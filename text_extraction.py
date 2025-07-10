import fitz  # PyMuPDF
import pdfminer
from pdfminer.high_level import extract_text
from tika import parser
import pytesseract
from PIL import Image
import io
import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
import os
import sys

# Download required NLTK data (only download if not already present)
try:
    nltk.data.find('tokenizers/punkt')
    print("✓ NLTK punkt tokenizer found")
except LookupError:
    print("⬇ Downloading NLTK punkt tokenizer...")
    nltk.download('punkt', quiet=True)



# Additional fallback for sentence tokenization
def safe_sent_tokenize(text):
    """Safe sentence tokenization with fallbacks"""
    try:
        return sent_tokenize(text)
    except:
        # Fallback 1: Try with punkt only
        try:
            import nltk.tokenize
            tokenizer = nltk.tokenize.punkt.PunktSentenceTokenizer()
            return tokenizer.tokenize(text)
        except:
            # Fallback 2: Simple split by periods
            return [s.strip() + '.' for s in text.split('.') if s.strip()]

def safe_word_tokenize(sentence):
    """Safe word tokenization with fallbacks"""
    try:
        return word_tokenize(sentence)
    except:
        # Fallback: Simple split by spaces and punctuation
        import re
        return re.findall(r'\b\w+\b', sentence)

# Whitelist of additional characters to keep (mathematical symbols, etc.)
WHITELIST = "Σ±÷×°√∞∫∂≤≥≠≈"

# Configure Tesseract path (adjust for your system)
try:
    # Try to find tesseract automatically first
    import shutil
    tesseract_path = shutil.which('tesseract')
    if tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        print(f"✓ Tesseract found at: {tesseract_path}")
    else:
        # Fallback to common Windows locations
        possible_paths = [
            r'C:\Program Files\Tesseract-OCR\tesseract.exe',
            r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
            r'C:\Users\PC\PycharmProjects\tesseract.exe'
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                pytesseract.pytesseract.tesseract_cmd = path
                print(f"✓ Tesseract found at: {path}")
                break
        else:
            print("⚠ Tesseract not found - OCR functionality will be limited")
except Exception as e:
    print(f"⚠ Tesseract configuration warning: {e}")
    print("  → OCR functionality may be limited")

def extract_text_from_pdf(pdf_path):
    """
    Extract text from PDF using multiple methods.
    Tries PyMuPDF first, then PDFMiner, then Tika as fallbacks.
    """
    doc = None
    try:
        # Method 1: Try PyMuPDF (fastest and most reliable for most PDFs)
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
        
        if text.strip():
            print(f"✓ Text extracted using PyMuPDF: {len(text)} characters")
            return text
    except Exception as e:
        print(f"⚠ PyMuPDF extraction failed: {e}")
    finally:
        # Always close the document to release file handles
        if doc:
            doc.close()

    try:
        # Method 2: Try PDFMiner (good for complex layouts)
        text = extract_text(pdf_path)
        if text.strip():
            print(f"✓ Text extracted using PDFMiner: {len(text)} characters")
            return text
    except Exception as e:
        print(f"⚠ PDFMiner extraction failed: {e}")

    try:
        # Method 3: Try Tika (good for various document types)
        raw = parser.from_file(pdf_path)
        text = raw['content']
        if text and text.strip():
            print(f"✓ Text extracted using Tika: {len(text)} characters")
            return text
    except Exception as e:
        print(f"⚠ Tika extraction failed: {e}")

    # If all text extraction methods fail, return None
    print("✗ All text extraction methods failed")
    return None

def ocr_image(image):
    """Perform OCR on a PIL Image object"""
    try:
        return pytesseract.image_to_string(image, config='--psm 6')
    except Exception as e:
        print(f"⚠ OCR failed: {e}")
        return ""

def handle_scanned_pdf(pdf_path):
    """
    Handle scanned PDFs by extracting images and performing OCR.
    Use this when regular text extraction fails.
    """
    text = ""
    doc = None
    try:
        doc = fitz.open(pdf_path)
        print(f"Processing {len(doc)} pages for OCR...")
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            
            # Convert page to image
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            # Perform OCR on the page image
            page_text = ocr_image(img)
            text += f"\n--- Page {page_num + 1} ---\n{page_text}\n"
            
            print(f"✓ OCR completed for page {page_num + 1}: {len(page_text)} characters")
        
        return text
    except Exception as e:
        print(f"✗ OCR processing failed: {e}")
        return ""
    finally:
        if doc:
            doc.close()

def extract_images_from_pdf(pdf_path):
    """Extract images from PDF and perform OCR on them"""
    images_text = ""
    doc = None
    try:
        doc = fitz.open(pdf_path)
        image_count = 0
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            image_list = page.get_images(full=True)
            
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    img_pil = Image.open(io.BytesIO(image_bytes))
                    
                    # Perform OCR on the image
                    image_text = ocr_image(img_pil)
                    if image_text.strip():
                        images_text += f"\n--- Image {image_count + 1} (Page {page_num + 1}) ---\n{image_text}\n"
                        image_count += 1
                        print(f"✓ OCR completed for image {image_count}: {len(image_text)} characters")
                
                except Exception as e:
                    print(f"⚠ Failed to process image {img_index} on page {page_num + 1}: {e}")
        
        return images_text
    except Exception as e:
        print(f"✗ Image extraction failed: {e}")
        return ""
    finally:
        if doc:
            doc.close()

def clean_text(text):
    """Clean and normalize extracted text"""
    if not text:
        return ""
    
    # Replace multiple spaces/newlines with single space
    text = re.sub(r'\s+', ' ', text)
    
    # Remove non-printable characters but keep whitelist characters
    text = re.sub(f'[^\x20-\x7E{WHITELIST}]+', '', text)
    
    # Remove excessive whitespace
    text = text.strip()
    
    return text

def segment_sentences(text):
    """Split text into sentences using NLTK with fallbacks"""
    try:
        sentences = safe_sent_tokenize(text)
        return sentences
    except Exception as e:
        print(f"⚠ Sentence segmentation failed: {e}")
        # Fallback: split by periods, exclamation marks, and question marks
        import re
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]

def tokenize_sentence(sentence):
    """Tokenize sentence into words using NLTK with fallbacks"""
    try:
        tokens = safe_word_tokenize(sentence)
        return tokens
    except Exception as e:
        print(f"⚠ Tokenization failed: {e}")
        # Fallback: split by spaces and remove punctuation
        import re
        tokens = re.findall(r'\b\w+\b', sentence)
        return tokens

def preprocess_text(text):
    """
    Complete text preprocessing pipeline:
    1. Clean text
    2. Segment into sentences
    3. Tokenize sentences
    4. Return processed text
    """
    if not text:
        return ""
    
    print("🔄 Preprocessing text...")
    
    # Clean the text
    cleaned_text = clean_text(text)
    
    # Segment into sentences
    sentences = segment_sentences(cleaned_text)
    
    # Tokenize each sentence
    tokenized_sentences = []
    for sentence in sentences:
        if sentence.strip():  # Skip empty sentences
            tokens = tokenize_sentence(sentence)
            tokenized_sentences.append(tokens)
    
    # Convert back to text format (preserving sentence structure)
    final_text = "\n".join([" ".join(tokens) for tokens in tokenized_sentences])
    
    print(f"✓ Text preprocessing complete: {len(final_text)} characters")
    return final_text

def convert_pdf_to_txt(pdf_path):
    """
    Main function: Convert PDF to cleaned, processed text.
    This is the function called by Flask app.
    """
    print(f"🔄 Processing PDF: {pdf_path}")
    
    # Step 1: Extract text using standard methods
    text = extract_text_from_pdf(pdf_path)
    
    # Step 2: If no text found, try OCR on the entire document
    if not text or len(text.strip()) < 100:  # If very little text extracted
        print("📄 Low text content detected, trying OCR...")
        ocr_text = handle_scanned_pdf(pdf_path)
        if ocr_text:
            text = ocr_text
    
    # Step 3: Extract text from images within the PDF
    images_text = extract_images_from_pdf(pdf_path)
    if images_text:
        text += f"\n\n--- EXTRACTED FROM IMAGES ---\n{images_text}"
    
    # Step 4: If still no text, return error message
    if not text or not text.strip():
        error_msg = "Failed to extract any readable text from the PDF. Please ensure the PDF contains text or clear images."
        print(f"✗ {error_msg}")
        return error_msg
    
    # Step 5: Preprocess the extracted text
    processed_text = preprocess_text(text)
    
    print(f"✅ PDF processing complete: {len(processed_text)} characters extracted")
    return processed_text

def extract_text_for_flask(pdf_file_object):
    """
    Special function for Flask file uploads.
    Handles file objects instead of file paths.
    """
    import tempfile
    import time
    
    temp_file_path = None
    try:
        # Create a temporary file with a unique name
        temp_fd, temp_file_path = tempfile.mkstemp(suffix='.pdf', prefix='ags_upload_')
        
        # Close the file descriptor immediately to avoid locking issues
        os.close(temp_fd)
        
        # Reset file pointer to beginning
        pdf_file_object.seek(0)
        
        # Write the uploaded file data to temporary location
        with open(temp_file_path, 'wb') as temp_file:
            temp_file.write(pdf_file_object.read())
        
        # Reset file pointer again for potential future use
        pdf_file_object.seek(0)
        
        # Process the PDF
        result = convert_pdf_to_txt(temp_file_path)
        
        return result
        
    except Exception as e:
        print(f"Error in extract_text_for_flask: {e}")
        return None
        
    finally:
        # Clean up temporary file with retry mechanism
        if temp_file_path and os.path.exists(temp_file_path):
            max_retries = 5
            for attempt in range(max_retries):
                try:
                    os.unlink(temp_file_path)
                    print(f"✓ Temporary file cleaned up: {temp_file_path}")
                    break
                except PermissionError:
                    if attempt < max_retries - 1:
                        print(f"⚠ File still locked, retrying in {0.5 * (attempt + 1)} seconds...")
                        time.sleep(0.5 * (attempt + 1))
                    else:
                        print(f"⚠ Could not delete temporary file: {temp_file_path}")
                        print("  → File will be cleaned up automatically by the system")
                except Exception as e:
                    print(f"⚠ Error cleaning up temporary file: {e}")
                    break

# Command line interface (for testing)
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python text_extraction.py <path_to_pdf>")
        print("Example: python text_extraction.py test_document.pdf")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"Error: File '{pdf_path}' not found")
        sys.exit(1)
    
    print("="*50)
    print("AGS Text Extraction Tool")
    print("="*50)
    
    # Process the PDF
    extracted_text = convert_pdf_to_txt(pdf_path)
    
    # Save to output file
    output_path = pdf_path.replace('.pdf', '_extracted.txt')
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(extracted_text)
        print(f"✅ Extracted text saved to: {output_path}")
    except Exception as e:
        print(f"✗ Failed to save extracted text: {e}")
    
    # Display summary
    print("\n" + "="*50)
    print("EXTRACTION SUMMARY")
    print("="*50)
    print(f"Input file: {pdf_path}")
    print(f"Output file: {output_path}")
    print(f"Characters extracted: {len(extracted_text)}")
    print(f"Words extracted: {len(extracted_text.split())}")
    print(f"Lines extracted: {len(extracted_text.splitlines())}")
    
    # Show first 200 characters as preview
    if extracted_text:
        print("\nTEXT PREVIEW:")
        print("-" * 30)
        preview = extracted_text[:200]
        if len(extracted_text) > 200:
            preview += "..."
        print(preview)