from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime
import uuid

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'

# Configure CORS properly
CORS(app, 
     origins=['http://localhost:5173', 'http://127.0.0.1:5173'], 
     supports_credentials=True,
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

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

def perform_immediate_grading(assignment, submission_text, student_id):
    """
    Perform immediate AI grading when student submits assignment
    Returns tuple: (grade, feedback, success)
    """
    try:
        from automated_grading import get_enhanced_response, extract_grade_from_response
        
        instructions_text = assignment.get('instructions_text', '')
        answer_key_text = assignment.get('answer_text', '')
        
        print(f"🤖 Starting AI grading for student {student_id}")
        print(f"📝 Instructions available: {'Yes' if instructions_text else 'No'}")
        print(f"🔑 Answer key available: {'Yes' if answer_key_text else 'No'}")
        
        if not answer_key_text and not instructions_text:
            print("⚠️  No answer key or instructions - skipping AI grading")
            return None, "Manual grading required - no answer key or instructions provided.", False
        
        grading_result = get_enhanced_response(
            instructions_text=instructions_text,
            answer_key_text=answer_key_text,
            student_answer_text=submission_text
        )
        
        grade, feedback = extract_grade_from_response(grading_result)
        
        if grade is not None:
            print(f"✅ AI grading completed - Grade: {grade}/10")
            return grade, feedback, True
        else:
            print("⚠️  AI grading completed but no grade extracted")
            return None, feedback, False
        
    except ImportError as e:
        print(f"❌ Import error - automated_grading module not found: {e}")
        error_feedback = "AI Grading Module Error. Manual grading required."
        return None, error_feedback, False
        
    except Exception as e:
        print(f"❌ AI grading failed: {e}")
        error_feedback = f"AI Grading Error: {str(e)}. Manual grading required."
        return None, error_feedback, False

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
    
    # Enhanced submissions table with grading metadata
    c.execute('''CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        student_id INTEGER,
        submission_text TEXT,
        grade INTEGER,
        feedback TEXT,
        grading_status TEXT DEFAULT 'pending',
        graded_at TIMESTAMP,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (student_id) REFERENCES users (id)
    )''')
    
    # Add new columns to existing submissions table if they don't exist
    try:
        c.execute('ALTER TABLE submissions ADD COLUMN grading_status TEXT DEFAULT "pending"')
    except sqlite3.OperationalError:
        pass
    
    try:
        c.execute('ALTER TABLE submissions ADD COLUMN graded_at TIMESTAMP')
    except sqlite3.OperationalError:
        pass
    
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect('ags.db')
    conn.row_factory = sqlite3.Row
    return conn

def safe_datetime_parse(date_string):
    """Safely parse datetime string"""
    if not date_string:
        return None
    if isinstance(date_string, datetime):
        return date_string.isoformat()
    try:
        dt = datetime.strptime(date_string, '%Y-%m-%d %H:%M:%S')
        return dt.isoformat()
    except (ValueError, TypeError):
        return None

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({'message': 'API is working!', 'cors': 'enabled'})

# API Routes

@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    
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
        return jsonify({'error': 'Invalid username or password'}), 401

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    user_type = data.get('user_type')
    
    if not all([username, email, password, user_type]):
        return jsonify({'error': 'All fields are required'}), 400
    
    conn = get_db()
    existing_user = conn.execute('SELECT * FROM users WHERE username = ? OR email = ?', 
                               (username, email)).fetchone()
    
    if existing_user:
        conn.close()
        return jsonify({'error': 'Username or email already exists'}), 400
    
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

@app.route('/api/auth/user', methods=['GET'])
def api_get_user():
    if 'user_id' in session:
        return jsonify({
            'user': {
                'id': session['user_id'],
                'username': session['username'],
                'user_type': session['user_type']
            }
        })
    return jsonify({'user': None})

@app.route('/api/professor/dashboard', methods=['GET'])
def api_professor_dashboard():
    if 'user_id' not in session or session['user_type'] != 'professor':
        return jsonify({'error': 'Access denied'}), 403
    
    conn = get_db()
    courses = conn.execute('''SELECT c.*, COUNT(e.id) as enrollment_count 
                             FROM courses c 
                             LEFT JOIN enrollments e ON c.id = e.course_id 
                             WHERE c.professor_id = ? 
                             GROUP BY c.id''', (session['user_id'],)).fetchall()
    conn.close()
    
    courses_list = []
    for course in courses:
        course_dict = dict(course)
        course_dict['created_at'] = safe_datetime_parse(course_dict['created_at'])
        courses_list.append(course_dict)
    
    return jsonify({'courses': courses_list})

@app.route('/api/student/dashboard', methods=['GET'])
def api_student_dashboard():
    if 'user_id' not in session or session['user_type'] != 'student':
        return jsonify({'error': 'Access denied'}), 403
    
    conn = get_db()
    enrollments = conn.execute('''SELECT c.*, e.enrolled_at 
                                 FROM courses c 
                                 JOIN enrollments e ON c.id = e.course_id 
                                 WHERE e.student_id = ?''', (session['user_id'],)).fetchall()
    conn.close()
    
    enrollments_list = []
    for enrollment in enrollments:
        enrollment_dict = dict(enrollment)
        enrollment_dict['enrolled_at'] = safe_datetime_parse(enrollment_dict['enrolled_at'])
        enrollments_list.append(enrollment_dict)
    
    return jsonify({'enrollments': enrollments_list})

@app.route('/api/courses', methods=['POST'])
def api_create_course():
    if 'user_id' not in session or session['user_type'] != 'professor':
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    course_name = data.get('course_name')
    
    if not course_name:
        return jsonify({'error': 'Course name is required'}), 400
    
    course_code = str(uuid.uuid4())[:8].upper()
    
    conn = get_db()
    conn.execute('INSERT INTO courses (course_name, course_code, professor_id) VALUES (?, ?, ?)',
                (course_name, course_code, session['user_id']))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True, 
        'message': f'Course created successfully! Course code: {course_code}',
        'course_code': course_code
    })

@app.route('/api/enroll', methods=['POST'])
def api_enroll_course():
    if 'user_id' not in session or session['user_type'] != 'student':
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    course_code = data.get('course_code')
    
    if not course_code:
        return jsonify({'error': 'Course code is required'}), 400
    
    conn = get_db()
    course = conn.execute('SELECT * FROM courses WHERE course_code = ?', (course_code,)).fetchone()
    
    if not course:
        conn.close()
        return jsonify({'error': 'Invalid course code'}), 400
    
    existing_enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                                     (session['user_id'], course['id'])).fetchone()
    
    if existing_enrollment:
        conn.close()
        return jsonify({'error': 'You are already enrolled in this course'}), 400
    
    conn.execute('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
                (session['user_id'], course['id']))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True, 
        'message': f'Successfully enrolled in {course["course_name"]}'
    })

@app.route('/api/courses/<int:course_id>', methods=['GET'])
def api_course_details(course_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    conn = get_db()
    course = conn.execute('SELECT * FROM courses WHERE id = ?', (course_id,)).fetchone()
    
    if not course:
        conn.close()
        return jsonify({'error': 'Course not found'}), 404
    
    # Check access
    if session['user_type'] == 'professor':
        if course['professor_id'] != session['user_id']:
            conn.close()
            return jsonify({'error': 'Access denied'}), 403
    else:
        enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                                  (session['user_id'], course_id)).fetchone()
        if not enrollment:
            conn.close()
            return jsonify({'error': 'Not enrolled in this course'}), 403

    assignments = conn.execute('SELECT * FROM events WHERE course_id = ? ORDER BY deadline ASC',
                              (course_id,)).fetchall()
    
    professor = conn.execute('SELECT username FROM users WHERE id = ?', 
                             (course['professor_id'],)).fetchone()
    
    enrollment_count = conn.execute('SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?',
                                    (course_id,)).fetchone()['count']
    
    conn.close()
    
    # Convert assignments to list of dicts
    assignments_list = []
    for assignment in assignments:
        assignment_dict = dict(assignment)
        assignment_dict['deadline'] = safe_datetime_parse(assignment_dict['deadline'])
        assignment_dict['created_at'] = safe_datetime_parse(assignment_dict['created_at'])
        assignments_list.append(assignment_dict)
    
    course_dict = dict(course)
    course_dict['created_at'] = safe_datetime_parse(course_dict['created_at'])
    
    return jsonify({
        'course': course_dict,
        'assignments': assignments_list,
        'professor': dict(professor) if professor else None,
        'enrollment_count': enrollment_count
    })

@app.route('/api/courses/<int:course_id>/assignments', methods=['POST'])
def api_create_assignment(course_id):
    if 'user_id' not in session or session['user_type'] != 'professor':
        return jsonify({'error': 'Access denied'}), 403
    
    conn = get_db()
    course = conn.execute('SELECT * FROM courses WHERE id = ? AND professor_id = ?',
                         (course_id, session['user_id'])).fetchone()
    
    if not course:
        conn.close()
        return jsonify({'error': 'Course not found or access denied'}), 404
    
    # Get form data
    assignment_name = request.form.get('assignment_name')
    deadline = request.form.get('deadline')
    description = request.form.get('description')
    event_type = request.form.get('event_type')
    
    if not all([assignment_name, deadline, event_type]):
        conn.close()
        return jsonify({'error': 'Missing required fields'}), 400
    
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
        return jsonify({'error': 'Invalid deadline format'}), 400
    
    conn.execute('''INSERT INTO events (course_id, event_name, event_type, description, deadline, 
                    answer_text, instructions_text) VALUES (?, ?, ?, ?, ?, ?, ?)''',
                (course_id, assignment_name, event_type, description, deadline_dt, 
                 answer_text, instructions_text))
    conn.commit()
    conn.close()
    
    return jsonify({
        'success': True, 
        'message': f'{event_type.title()} created successfully!'
    })

@app.route('/api/assignments/<int:assignment_id>', methods=['GET'])
def api_assignment_details(assignment_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Authentication required'}), 401
    
    conn = get_db()
    assignment = conn.execute('''SELECT e.*, c.course_name, c.professor_id, c.id as course_id
                               FROM events e 
                               JOIN courses c ON e.course_id = c.id 
                               WHERE e.id = ?''', (assignment_id,)).fetchone()
    
    if not assignment:
        conn.close()
        return jsonify({'error': 'Assignment not found'}), 404
    
    # Check access
    if session['user_type'] == 'professor':
        if assignment['professor_id'] != session['user_id']:
            conn.close()
            return jsonify({'error': 'Access denied'}), 403
    else:
        enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                                (session['user_id'], assignment['course_id'])).fetchone()
        if not enrollment:
            conn.close()
            return jsonify({'error': 'Not enrolled in this course'}), 403
    
    assignment_dict = dict(assignment)
    assignment_dict['deadline'] = safe_datetime_parse(assignment_dict['deadline'])
    assignment_dict['created_at'] = safe_datetime_parse(assignment_dict['created_at'])
    
    # Get submission if student
    submission = None
    if session['user_type'] == 'student':
        submission_row = conn.execute('SELECT * FROM submissions WHERE event_id = ? AND student_id = ?',
                                (assignment_id, session['user_id'])).fetchone()
        if submission_row:
            submission = dict(submission_row)
            submission['submitted_at'] = safe_datetime_parse(submission['submitted_at'])
            submission['graded_at'] = safe_datetime_parse(submission['graded_at'])
    
    # Get all submissions if professor
    submissions = None
    if session['user_type'] == 'professor':
        submission_rows = conn.execute('''SELECT s.*, u.username 
                                    FROM submissions s 
                                    JOIN users u ON s.student_id = u.id 
                                    WHERE s.event_id = ? 
                                    ORDER BY s.submitted_at DESC''', (assignment_id,)).fetchall()
        submissions = []
        for row in submission_rows:
            sub_dict = dict(row)
            sub_dict['submitted_at'] = safe_datetime_parse(sub_dict['submitted_at'])
            sub_dict['graded_at'] = safe_datetime_parse(sub_dict['graded_at'])
            submissions.append(sub_dict)
    
    conn.close()
    
    return jsonify({
        'assignment': assignment_dict,
        'submission': submission,
        'submissions': submissions
    })

@app.route('/api/assignments/<int:assignment_id>/submit', methods=['POST'])
def api_submit_assignment(assignment_id):
    if 'user_id' not in session or session['user_type'] != 'student':
        return jsonify({'error': 'Access denied'}), 403
    
    conn = get_db()
    assignment = conn.execute('''SELECT e.*, c.professor_id 
                               FROM events e 
                               JOIN courses c ON e.course_id = c.id 
                               WHERE e.id = ?''', (assignment_id,)).fetchone()
    
    if not assignment:
        conn.close()
        return jsonify({'error': 'Assignment not found'}), 404
    
    # Check enrollment
    enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                            (session['user_id'], assignment['course_id'])).fetchone()
    if not enrollment:
        conn.close()
        return jsonify({'error': 'Not enrolled in this course'}), 403
    
    # Check deadline
    if assignment['deadline'] and datetime.now() > datetime.strptime(str(assignment['deadline']), '%Y-%m-%d %H:%M:%S'):
        conn.close()
        return jsonify({'error': 'Assignment deadline has passed'}), 400
    
    # Check if already submitted
    existing_submission = conn.execute('SELECT * FROM submissions WHERE event_id = ? AND student_id = ?',
                                     (assignment_id, session['user_id'])).fetchone()
    if existing_submission:
        conn.close()
        return jsonify({'error': 'You have already submitted this assignment'}), 400
    
    # Handle file upload
    if 'submission_file' not in request.files:
        conn.close()
        return jsonify({'error': 'No file uploaded'}), 400
    
    submission_file = request.files['submission_file']
    if not submission_file or not allowed_file(submission_file.filename):
        conn.close()
        return jsonify({'error': 'Please upload a valid PDF file'}), 400
    
    # Extract text from submission
    submission_text = extract_text_from_pdf(submission_file)
    if not submission_text:
        conn.close()
        return jsonify({'error': 'Failed to extract text from PDF'}), 400
    
    # Save submission
    conn.execute('''INSERT INTO submissions (event_id, student_id, submission_text, grading_status) 
                    VALUES (?, ?, ?, ?)''',
                (assignment_id, session['user_id'], submission_text, 'pending'))
    conn.commit()
    
    message = 'Assignment submitted successfully!'
    
    # Perform AI grading if possible
    if assignment['answer_text'] or assignment['instructions_text']:
        assignment_dict = dict(assignment)
        grade, feedback, success = perform_immediate_grading(
            assignment_dict, submission_text, session['user_id']
        )
        
        if success and grade is not None:
            conn.execute('''UPDATE submissions 
                           SET grade = ?, feedback = ?, grading_status = ?, graded_at = CURRENT_TIMESTAMP 
                           WHERE event_id = ? AND student_id = ?''',
                        (grade, feedback, 'completed', assignment_id, session['user_id']))
            message += ' ✅ Automatic grading completed.'
        else:
            conn.execute('''UPDATE submissions 
                           SET feedback = ?, grading_status = ? 
                           WHERE event_id = ? AND student_id = ?''',
                        (feedback, 'failed', assignment_id, session['user_id']))
            message += ' ⚠️ Manual grading required.'
        
        conn.commit()
    else:
        message += ' 📝 Manual grading will be performed.'
    
    conn.close()
    return jsonify({'success': True, 'message': message})

if __name__ == '__main__':
    print("Starting Enhanced AGS API...")
    try:
        print("Initializing database...")
        init_db()
        print("Database initialized successfully!")
        print("🤖 AI grading system ready!")
        print("Starting Flask API on http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"Error starting application: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")