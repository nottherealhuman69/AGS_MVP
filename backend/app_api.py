from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime
import uuid

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'
CORS(app, supports_credentials=True)  # Enable CORS for React frontend

# Configuration 
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

def extract_text_from_pdf(pdf_file):
    """Extract text from uploaded PDF file using your text_extraction module"""
    try:
        from text_extraction import extract_text_for_flask
        extracted_text = extract_text_for_flask(pdf_file)
        return extracted_text
    except Exception as e:
        print(f"PDF text extraction failed: {e}")
        return None

# Database setup (same as before)
def init_db():
    conn = sqlite3.connect('ags.db')
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        user_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )''')
    
    # Courses table
    c.execute('''CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        course_code TEXT UNIQUE NOT NULL,
        professor_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (professor_id) REFERENCES users (id)
    )''')
    
    # Enrollments table
    c.execute('''CREATE TABLE IF NOT EXISTS enrollments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER,
        course_id INTEGER,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users (id),
        FOREIGN KEY (course_id) REFERENCES courses (id)
    )''')
    
    # Events table (assignments/quizzes)
    c.execute('''CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_id INTEGER,
        event_name TEXT NOT NULL,
        event_type TEXT NOT NULL,
        description TEXT,
        deadline DATETIME,
        answer_text TEXT,
        instructions_text TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses (id)
    )''')
    
    # Submissions table
    c.execute('''CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        student_id INTEGER,
        submission_text TEXT,
        grade INTEGER,
        feedback TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (student_id) REFERENCES users (id)
    )''')
    
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect('ags.db')
    conn.row_factory = sqlite3.Row
    return conn

# API Routes

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    
    if user and check_password_hash(user['password_hash'], password):
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['user_type'] = user['user_type']
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'user_type': user['user_type']
            }
        })
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('user_type')
    
    if not all([username, email, password, user_type]):
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    conn = get_db()
    existing_user = conn.execute('SELECT * FROM users WHERE username = ? OR email = ?', 
                               (username, email)).fetchone()
    
    if existing_user:
        conn.close()
        return jsonify({'success': False, 'message': 'Username or email already exists'}), 400
    
    password_hash = generate_password_hash(password)
    conn.execute('INSERT INTO users (username, email, password_hash, user_type) VALUES (?, ?, ?, ?)',
                (username, email, password_hash, user_type))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': 'Registration successful'})

@app.route('/api/auth/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({'success': True})

@app.route('/api/auth/me', methods=['GET'])
def api_me():
    if 'user_id' in session:
        return jsonify({
            'user': {
                'id': session['user_id'],
                'username': session['username'],
                'user_type': session['user_type']
            }
        })
    return jsonify({'user': None}), 401

@app.route('/api/courses', methods=['GET'])
def api_get_courses():
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    
    conn = get_db()
    
    if session['user_type'] == 'professor':
        courses = conn.execute('''SELECT c.*, COUNT(e.id) as enrollment_count 
                                 FROM courses c 
                                 LEFT JOIN enrollments e ON c.id = e.course_id 
                                 WHERE c.professor_id = ? 
                                 GROUP BY c.id''', (session['user_id'],)).fetchall()
    else:  # student
        courses = conn.execute('''SELECT c.*, e.enrolled_at 
                                 FROM courses c 
                                 JOIN enrollments e ON c.id = e.course_id 
                                 WHERE e.student_id = ?''', (session['user_id'],)).fetchall()
    
    conn.close()
    
    return jsonify([dict(course) for course in courses])

@app.route('/api/courses', methods=['POST'])
def api_create_course():
    if 'user_id' not in session or session['user_type'] != 'professor':
        return jsonify({'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    course_name = data.get('course_name')
    course_code = str(uuid.uuid4())[:8].upper()
    
    conn = get_db()
    conn.execute('INSERT INTO courses (course_name, course_code, professor_id) VALUES (?, ?, ?)',
                (course_name, course_code, session['user_id']))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'course_code': course_code})

@app.route('/api/courses/enroll', methods=['POST'])
def api_enroll_course():
    if 'user_id' not in session or session['user_type'] != 'student':
        return jsonify({'message': 'Unauthorized'}), 401
    
    data = request.get_json()
    course_code = data.get('course_code')
    
    conn = get_db()
    course = conn.execute('SELECT * FROM courses WHERE course_code = ?', (course_code,)).fetchone()
    
    if not course:
        conn.close()
        return jsonify({'success': False, 'message': 'Invalid course code'}), 404
    
    existing_enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                                     (session['user_id'], course['id'])).fetchone()
    
    if existing_enrollment:
        conn.close()
        return jsonify({'success': False, 'message': 'Already enrolled'}), 400
    
    conn.execute('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
                (session['user_id'], course['id']))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True, 'message': f'Enrolled in {course["course_name"]}'})

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def api_get_course_details(course_id):
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    
    conn = get_db()
    course = conn.execute('SELECT * FROM courses WHERE id = ?', (course_id,)).fetchone()
    
    if not course:
        conn.close()
        return jsonify({'message': 'Course not found'}), 404
    
    # Check access permissions
    if session['user_type'] == 'professor':
        if course['professor_id'] != session['user_id']:
            conn.close()
            return jsonify({'message': 'Access denied'}), 403
    else:
        enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                                  (session['user_id'], course_id)).fetchone()
        if not enrollment:
            conn.close()
            return jsonify({'message': 'Not enrolled'}), 403

    assignments = conn.execute('SELECT * FROM events WHERE course_id = ? ORDER BY deadline ASC',
                              (course_id,)).fetchall()
    
    professor = conn.execute('SELECT username FROM users WHERE id = ?', 
                             (course['professor_id'],)).fetchone()
    
    enrollment_count = conn.execute('SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?',
                                    (course_id,)).fetchone()['count']
    
    conn.close()
    
    return jsonify({
        'course': dict(course),
        'assignments': [dict(assignment) for assignment in assignments],
        'professor': dict(professor),
        'enrollment_count': enrollment_count
    })

@app.route('/api/courses/<int:course_id>/assignments', methods=['POST'])
def api_create_assignment(course_id):
    if 'user_id' not in session or session['user_type'] != 'professor':
        return jsonify({'message': 'Unauthorized'}), 401
    
    conn = get_db()
    course = conn.execute('SELECT * FROM courses WHERE id = ? AND professor_id = ?',
                         (course_id, session['user_id'])).fetchone()
    
    if not course:
        conn.close()
        return jsonify({'message': 'Course not found or access denied'}), 404
    
    # Get form data
    assignment_name = request.form.get('assignment_name')
    deadline = request.form.get('deadline')
    description = request.form.get('description')
    event_type = request.form.get('event_type')
    
    # Extract text from uploaded PDFs
    answer_text = None
    instructions_text = None
    
    if 'answer_pdf' in request.files:
        answer_file = request.files['answer_pdf']
        if answer_file and allowed_file(answer_file.filename):
            answer_text = extract_text_from_pdf(answer_file)
    
    if 'instructions_pdf' in request.files:
        instructions_file = request.files['instructions_pdf']
        if instructions_file and allowed_file(instructions_file.filename):
            instructions_text = extract_text_from_pdf(instructions_file)
    
    try:
        deadline_dt = datetime.strptime(deadline, '%Y-%m-%dT%H:%M')
    except ValueError:
        conn.close()
        return jsonify({'success': False, 'message': 'Invalid deadline format'}), 400
    
    conn.execute('''INSERT INTO events (course_id, event_name, event_type, description, deadline, 
                    answer_text, instructions_text) VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (course_id, assignment_name, event_type, description, deadline_dt, 
                 answer_text, instructions_text))
    conn.commit()
    conn.close()
    
    return jsonify({'success': True})

# Add these endpoints to your app_api.py file


@app.route('/api/assignments/<int:assignment_id>', methods=['GET'])
def api_get_assignment_details(assignment_id):
    if 'user_id' not in session:
        return jsonify({'message': 'Unauthorized'}), 401
    
    conn = get_db()
    assignment = conn.execute('''SELECT e.*, c.course_name, c.professor_id, c.id as course_id
                               FROM events e 
                               JOIN courses c ON e.course_id = c.id 
                               WHERE e.id = ?''', (assignment_id,)).fetchone()
    
    if not assignment:
        conn.close()
        return jsonify({'message': 'Assignment not found'}), 404
    
    # Check access permissions
    if session['user_type'] == 'professor':
        if assignment['professor_id'] != session['user_id']:
            conn.close()
            return jsonify({'message': 'Access denied'}), 403
    else:  # student
        enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                                (session['user_id'], assignment['course_id'])).fetchone()
        if not enrollment:
            conn.close()
            return jsonify({'message': 'Not enrolled'}), 403
    
    # Get submission if student
    submission = None
    if session['user_type'] == 'student':
        submission_row = conn.execute('SELECT * FROM submissions WHERE event_id = ? AND student_id = ?',
                                (assignment_id, session['user_id'])).fetchone()
        if submission_row:
            submission = dict(submission_row)
    
    # Get all submissions if professor
    submissions = None
    if session['user_type'] == 'professor':
        submission_rows = conn.execute('''SELECT s.*, u.username 
                                    FROM submissions s 
                                    JOIN users u ON s.student_id = u.id 
                                    WHERE s.event_id = ? 
                                    ORDER BY s.submitted_at DESC''', (assignment_id,)).fetchall()
        submissions = [dict(row) for row in submission_rows]
    
    conn.close()
    
    return jsonify({
        'assignment': dict(assignment),
        'submission': submission,
        'submissions': submissions
    })

@app.route('/api/assignments/<int:assignment_id>/submit', methods=['POST'])
def api_submit_assignment(assignment_id):
    if 'user_id' not in session or session['user_type'] != 'student':
        return jsonify({'message': 'Unauthorized'}), 401
    
    conn = get_db()
    assignment = conn.execute('''SELECT e.*, c.professor_id, e.course_id
                               FROM events e 
                               JOIN courses c ON e.course_id = c.id 
                               WHERE e.id = ?''', (assignment_id,)).fetchone()
    
    if not assignment:
        conn.close()
        return jsonify({'success': False, 'message': 'Assignment not found'}), 404
    
    # Check if student is enrolled
    enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                            (session['user_id'], assignment['course_id'])).fetchone()
    if not enrollment:
        conn.close()
        return jsonify({'success': False, 'message': 'Not enrolled in course'}), 403
    
    # Check if deadline has passed
    if assignment['deadline']:
        try:
            deadline = datetime.strptime(str(assignment['deadline']), '%Y-%m-%d %H:%M:%S')
            if datetime.now() > deadline:
                conn.close()
                return jsonify({'success': False, 'message': 'Assignment deadline has passed'}), 400
        except ValueError:
            pass  # Continue if deadline format is different
    
    # Check if already submitted
    existing_submission = conn.execute('SELECT * FROM submissions WHERE event_id = ? AND student_id = ?',
                                     (assignment_id, session['user_id'])).fetchone()
    if existing_submission:
        conn.close()
        return jsonify({'success': False, 'message': 'Already submitted'}), 400
    
    # Handle file upload and extract text
    if 'submission_file' not in request.files:
        conn.close()
        return jsonify({'success': False, 'message': 'No file uploaded'}), 400
    
    submission_file = request.files['submission_file']
    if not submission_file or not allowed_file(submission_file.filename):
        conn.close()
        return jsonify({'success': False, 'message': 'Please upload a valid PDF file'}), 400
    
    # Extract text from submission PDF using your existing function
    submission_text = extract_text_from_pdf(submission_file)
    if not submission_text:
        conn.close()
        return jsonify({'success': False, 'message': 'Failed to extract text from PDF'}), 400
    
    # Save submission to database first
    conn.execute('''INSERT INTO submissions (event_id, student_id, submission_text) 
                    VALUES (?, ?, ?)''',
                (assignment_id, session['user_id'], submission_text))
    conn.commit()
    
    # Perform AI grading using your existing automated_grading.py
    try:
        from automated_grading import get_enhanced_response
        
        instructions_text = assignment.get('instructions_text', '') or ''
        answer_key_text = assignment.get('answer_text', '') or ''
        
        # Get AI grading
        grading_response = get_enhanced_response(instructions_text, answer_key_text, submission_text)
        
        # Extract grade from response (simple extraction)
        grade = None
        try:
            import re
            grade_match = re.search(r'Grade:\s*(\d+)', grading_response)
            if grade_match:
                grade = int(grade_match.group(1))
        except:
            grade = None
        
        # Update submission with grade and feedback
        conn.execute('''UPDATE submissions 
                       SET grade = ?, feedback = ? 
                       WHERE event_id = ? AND student_id = ?''',
                    (grade, grading_response, assignment_id, session['user_id']))
        conn.commit()
        
    except Exception as e:
        print(f"AI grading failed: {e}")
        # Continue without grading - can be done manually later
    
    conn.close()
    return jsonify({'success': True, 'message': 'Assignment submitted successfully!'})

@app.route('/api/courses/<int:course_id>/students', methods=['GET'])
def api_get_course_students(course_id):
    if 'user_id' not in session or session['user_type'] != 'professor':
        return jsonify({'message': 'Unauthorized'}), 401
    
    conn = get_db()
    course = conn.execute('SELECT * FROM courses WHERE id = ? AND professor_id = ?',
                         (course_id, session['user_id'])).fetchone()
    
    if not course:
        conn.close()
        return jsonify({'message': 'Course not found or access denied'}), 404
    
    students = conn.execute('''SELECT u.id, u.username, u.email, e.enrolled_at 
                              FROM users u 
                              JOIN enrollments e ON u.id = e.student_id 
                              WHERE e.course_id = ? 
                              ORDER BY e.enrolled_at DESC''', (course_id,)).fetchall()
    
    conn.close()
    return jsonify([dict(student) for student in students])



if __name__ == '__main__':
    print("Starting AGS API server...")
    try:
        print("Initializing database...")
        init_db()
        print("Database initialized successfully!")
        print("Starting Flask API on http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"Error starting application: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")