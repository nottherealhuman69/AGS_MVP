import fitz  # PyMuPDF
import pdfminer
#from pdfminer.high_level import extract_text
from tika import parser
import pytesseract
from PIL import Image
import io
import re
import nltk
from nltk.tokenize import sent_tokenize, word_tokenize
import os
import sys

import google.generativeai as genai
# Set your API key here
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Get the API key
API_KEY = os.getenv("API_KEY")

genai.configure(api_key=API_KEY)
# Whitelist of additional characters to keep







# def gpt4_process_text(text, task="summarize"):
#     if task == "summarize":
#         prompt = f"Please summarize the following text:\n\n{text}"
#     else:
#         prompt = f"{task}:\n\n{text}"

#     response = openai.Completion.create(
#         model="text-davinci",
#         prompt=prompt,
#         max_tokens=1024,
#         n=1,
#         stop=None,
#         temperature=0.7
#     )
#     return response.choices[0].text.strip()

"""
Install the Google AI Python SDK

$ pip install google-generativeai

See the getting started guide for more information:
https://ai.google.dev/gemini-api/docs/get-started/python
"""



# Create the model
# See https://ai.google.dev/api/python/google/generativeai/GenerativeModel


def get_response(pdf_text, student_text):
    generation_config = {
    "temperature": 0.7,
    "top_p": 0.9,
    "top_k": 50,
    "max_output_tokens": 512,
    "response_mime_type": "text/plain",
    }

    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        generation_config=generation_config,
        # safety_settings = Adjust safety settings
        # See https://ai.google.dev/gemini-api/docs/safety-settings
        )

    chat_session = model.start_chat(
        history=[
        ]
        )
    prompt = f"""
You are an AI teaching assistant tasked with grading and providing personalized feedback on student answers. Your goal is to:
1. Compare the student's answer with the provided answer key.
2. Assign a numeric grade out of 10, with a detailed explanation for the grade.
3. Provide personalized feedback that:
   - Highlights what the student did well.
   - Points out specific areas for improvement.
   - Offers actionable suggestions to improve future answers.

Use the following format in your response:
---
Grade: [numeric score]/10

Feedback:
1. Strengths: [What the student did well]
2. Weaknesses: [Specific areas where the student could improve]
3. Suggestions: [Actionable advice for improvement]

Here is the information:
- Answer Key: {pdf_text}
- Student's Answer: {student_text}

Now, grade the student's answer and provide feedback.
"""
    response = chat_session.send_message(prompt)
    return response.text


if __name__ == "__main__":
    # Ensure correct usage
    if len(sys.argv) != 3:
        print("Usage: python test.py <input_pdf_path> <output_txt_path>")
        sys.exit(1)

    summarized_text = get_response(pdf_text, text)

