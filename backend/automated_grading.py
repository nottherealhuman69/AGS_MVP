"""
Fixed automated_grading.py with improved compatibility and error handling
"""
import google.generativeai as genai
from dotenv import load_dotenv
import os
import sys

# Load environment variables
load_dotenv()
API_KEY = os.getenv("API_KEY")

if not API_KEY:
    print("⚠️  Warning: API_KEY not found in .env file")
    print("Please create a .env file with your Gemini API key:")
    print("API_KEY=your_gemini_api_key_here")
else:
    genai.configure(api_key=API_KEY)
    print(f"✅ API configured successfully")

def get_enhanced_response(instructions_text, answer_key_text, student_answer_text):
    """
    Enhanced grading function that uses instructions, answer key, and student answer
    for more comprehensive and accurate grading.
    """
    if not API_KEY:
        return "Grade: 0/10\n\nFeedback: API key not configured. Please check your .env file."
    
    prompt = f"""
You are an expert AI teaching assistant tasked with grading student assignments. Your goal is to provide fair, comprehensive, and personalized feedback.

**GRADING INSTRUCTIONS:**
1. Carefully read the assignment instructions, answer key, and student's submission
2. Grade based on correctness, completeness, understanding, and presentation
3. Provide a score out of 10 with a detailed explanation for the grade
4. Give specific, actionable feedback that helps the student improve

**GRADING CRITERIA:**
- Correctness (40%): How accurate are the answers?
- Completeness (30%): Did the student address all parts of the assignment?
- Understanding (20%): Does the student demonstrate clear understanding of concepts?
- Presentation (10%): Is the work well-organized and clearly written?

**ASSIGNMENT CONTEXT:**

--- ASSIGNMENT INSTRUCTIONS ---
{instructions_text if instructions_text else "No specific instructions provided"}

--- ANSWER KEY / EXPECTED SOLUTION ---
{answer_key_text if answer_key_text else "No answer key provided - grade based on general correctness and understanding"}

--- STUDENT'S SUBMISSION ---
{student_answer_text}

**RESPONSE FORMAT:**
Grade: [X]/10

**Detailed Feedback:**

**Strengths:**
- [List specific things the student did well]

**Areas for Improvement:**
- [Specific areas where the student can improve]

**Suggestions for Future Assignments:**
- [Actionable advice for better performance]

**Specific Comments:**
- [Point-by-point feedback on different sections/questions]

Now, please grade this assignment thoroughly and provide helpful feedback.
"""
    
    try:
        print("🤖 Attempting AI grading with basic model...")
        # Use the simplest approach that should work with most versions
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        if hasattr(response, 'text'):
            result = response.text
        elif hasattr(response, 'candidates') and len(response.candidates) > 0:
            result = response.candidates[0].content.parts[0].text
        else:
            result = str(response)
            
        print("✅ AI grading completed successfully")
        return result
        
    except Exception as e:
        print(f"❌ Error in AI grading: {e}")
        
        # Try alternative approach
        try:
            print("🔄 Trying alternative approach...")
            model = genai.GenerativeModel("gemini-pro")
            response = model.generate_content(prompt)
            result = response.text if hasattr(response, 'text') else str(response)
            print("✅ Alternative approach successful")
            return result
            
        except Exception as e2:
            print(f"❌ Alternative approach also failed: {e2}")
            return f"""Grade: 0/10

**Feedback:**
Error occurred during automatic grading. Please contact your professor for manual grading.

**Error Details:**
Primary error: {str(e)}
Secondary error: {str(e2)}

**Next Steps:**
1. Your submission has been saved successfully
2. Your professor will grade this assignment manually
3. You will receive your grade once manual grading is complete

If this error persists, please contact technical support.
"""

def get_response(answer_key_text, student_answer_text):
    """
    Backward compatibility function - maintains the old interface
    but calls the enhanced version with instructions=None
    """
    return get_enhanced_response(None, answer_key_text, student_answer_text)

def extract_grade_from_response(grading_response):
    """
    Extract the numeric grade from the AI response
    Returns tuple: (grade_int, full_feedback)
    """
    lines = grading_response.strip().split('\n')
    grade = None
    
    # Try multiple patterns to extract grade
    grade_patterns = [
        'Grade: ',
        'Grade:',
        'Score: ',
        'Score:',
        'Final Grade: ',
        'Final Score: '
    ]
    
    for line in lines:
        for pattern in grade_patterns:
            if pattern in line:
                try:
                    # Extract number before /10
                    after_pattern = line.split(pattern)[1]
                    if '/' in after_pattern:
                        grade_part = after_pattern.split('/')[0].strip()
                    else:
                        # Look for just the number
                        import re
                        numbers = re.findall(r'\d+', after_pattern)
                        if numbers:
                            grade_part = numbers[0]
                        else:
                            continue
                    
                    grade = int(float(grade_part))  # Handle decimal grades
                    # Ensure grade is within valid range
                    grade = max(0, min(10, grade))
                    print(f"📊 Extracted grade: {grade}/10")
                    break
                except (ValueError, IndexError):
                    continue
        if grade is not None:
            break
    
    if grade is None:
        print("⚠️  Could not extract numeric grade from response")
        # Try to find any number in the first few lines
        for line in lines[:5]:
            import re
            numbers = re.findall(r'\b([0-9]|10)\b', line)
            if numbers:
                try:
                    grade = int(numbers[0])
                    grade = max(0, min(10, grade))
                    print(f"📊 Fallback grade extraction: {grade}/10")
                    break
                except:
                    continue
    
    return grade, grading_response

def test_grading_system():
    """Test function for the grading system"""
    print("=" * 60)
    print("🧪 TESTING AGS GRADING SYSTEM")
    print("=" * 60)
    
    instructions = """
    Solve the following math problems:
    1. What is 2 + 2?
    2. Calculate the area of a circle with radius 5
    3. Explain the Pythagorean theorem
    """
    
    answer_key = """
    1. 2 + 2 = 4
    2. Area = π × r² = π × 5² = 25π ≈ 78.54 square units
    3. The Pythagorean theorem states that in a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c²
    """
    
    student_answer = """
    1. 2 + 2 = 4
    2. Area = π × 5² = 25π = about 78.5
    3. Pythagorean theorem is a² + b² = c² for right triangles
    """
    
    print("📝 Test Data:")
    print(f"Instructions: {len(instructions)} characters")
    print(f"Answer Key: {len(answer_key)} characters")
    print(f"Student Answer: {len(student_answer)} characters")
    print("\n🤖 Starting AI grading...")
    
    result = get_enhanced_response(instructions, answer_key, student_answer)
    grade, feedback = extract_grade_from_response(result)
    
    print("\n" + "=" * 60)
    print("📊 GRADING RESULTS")
    print("=" * 60)
    print(f"Extracted Grade: {grade}/10")
    print("\n📝 Full Feedback:")
    print("-" * 40)
    print(feedback)
    print("-" * 40)
    
    # Test grade extraction
    if grade is not None:
        print(f"✅ Grade extraction: SUCCESS ({grade}/10)")
    else:
        print("❌ Grade extraction: FAILED")
    
    # Test feedback quality
    if len(feedback) > 100:
        print("✅ Feedback quality: GOOD (detailed response)")
    else:
        print("⚠️  Feedback quality: LIMITED (short response)")
    
    return grade, feedback

def check_api_connectivity():
    """Check if the API is working properly"""
    print("🔌 Testing API connectivity...")
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        test_response = model.generate_content("Say 'API test successful' if you can read this.")
        
        if hasattr(test_response, 'text'):
            result = test_response.text
        else:
            result = str(test_response)
            
        if "successful" in result.lower():
            print("✅ API connectivity: SUCCESS")
            return True
        else:
            print(f"⚠️  API connectivity: PARTIAL (Response: {result[:100]}...)")
            return True
            
    except Exception as e:
        print(f"❌ API connectivity: FAILED ({e})")
        return False

if __name__ == "__main__":
    print("🚀 AGS Automated Grading System")
    print("=" * 60)
    
    # Check API first
    if not check_api_connectivity():
        print("\n❌ API test failed. Please check:")
        print("1. Your .env file contains a valid API_KEY")
        print("2. Your internet connection is working")
        print("3. Your Gemini API key has proper permissions")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    
    if len(sys.argv) == 1:
        # Run test
        test_grading_system()
    elif len(sys.argv) == 2 and sys.argv[1] == "test":
        test_grading_system()
    else:
        print("Usage:")
        print("  python automated_grading.py        # Run test")
        print("  python automated_grading.py test   # Run test")
        print("\nOr import and use get_enhanced_response() function in your Flask app")