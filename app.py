from flask import Flask, render_template, request, redirect, url_for, flash, session
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime
import uuid

app = Flask(__name__)
app.secret_key = 'your-secret-key-change-this-in-production'

# Configuration 
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Add template functions for date handling
@app.template_filter('moment')
def moment_filter(date):
    """Convert datetime to moment-like object for template use"""
    if isinstance(date, str):
        try:
            return datetime.strptime(date, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            return datetime.now()
    return date if date else datetime.now()

@app.template_global()
def moment():
    """Get current moment for template use"""
    return datetime.now()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'pdf'

def extract_text_from_pdf(pdf_file):
    """Extract text from uploaded PDF file using your text_extraction module"""
    try:
        # Use the Flask-specific function from text_extraction
        from text_extraction import extract_text_for_flask
        extracted_text = extract_text_for_flask(pdf_file)
        return extracted_text
    except Exception as e:
        print(f"PDF text extraction failed: {e}")
        return None

# Database setup
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

# Helper function to get database connection
def get_db():
    conn = sqlite3.connect('ags.db')
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    if 'user_id' in session:
        if session['user_type'] == 'professor':
            return redirect(url_for('professor_dashboard'))
        else:
            return redirect(url_for('student_dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db()
        user = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['user_type'] = user['user_type']
            
            if user['user_type'] == 'professor':
                return redirect(url_for('professor_dashboard'))
            else:
                return redirect(url_for('student_dashboard'))
        else:
            flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        user_type = request.form['user_type']
        
        # Basic validation
        if not username or not email or not password or not user_type:
            flash('All fields are required')
            return render_template('register.html')
        
        # Check if user exists
        conn = get_db()
        existing_user = conn.execute('SELECT * FROM users WHERE username = ? OR email = ?', 
                                   (username, email)).fetchone()
        
        if existing_user:
            flash('Username or email already exists')
            conn.close()
            return render_template('register.html')
        
        # Create new user
        password_hash = generate_password_hash(password)
        conn.execute('INSERT INTO users (username, email, password_hash, user_type) VALUES (?, ?, ?, ?)',
                    (username, email, password_hash, user_type))
        conn.commit()
        conn.close()
        
        flash('Registration successful! Please login.')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/professor_dashboard')
def professor_dashboard():
    if 'user_id' not in session or session['user_type'] != 'professor':
        return redirect(url_for('login'))
    
    conn = get_db()
    courses = conn.execute('''SELECT c.*, COUNT(e.id) as enrollment_count 
                             FROM courses c 
                             LEFT JOIN enrollments e ON c.id = e.course_id 
                             WHERE c.professor_id = ? 
                             GROUP BY c.id''', (session['user_id'],)).fetchall()
    conn.close()
    
    return render_template('professor_dashboard.html', courses=courses)

@app.route('/student_dashboard')
def student_dashboard():
    if 'user_id' not in session or session['user_type'] != 'student':
        return redirect(url_for('login'))
    
    conn = get_db()
    enrollments = conn.execute('''SELECT c.*, e.enrolled_at 
                                 FROM courses c 
                                 JOIN enrollments e ON c.id = e.course_id 
                                 WHERE e.student_id = ?''', (session['user_id'],)).fetchall()
    conn.close()
    
    return render_template('student_dashboard.html', enrollments=enrollments)

@app.route('/create_course', methods=['GET', 'POST'])
def create_course():
    if 'user_id' not in session or session['user_type'] != 'professor':
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        course_name = request.form['course_name']
        course_code = str(uuid.uuid4())[:8].upper()  # Generate random 8-character code
        
        conn = get_db()
        conn.execute('INSERT INTO courses (course_name, course_code, professor_id) VALUES (?, ?, ?)',
                    (course_name, course_code, session['user_id']))
        conn.commit()
        conn.close()
        
        flash(f'Course created successfully! Course code: {course_code}')
        return redirect(url_for('professor_dashboard'))
    
    return render_template('create_course.html')

@app.route('/enroll_course', methods=['GET', 'POST'])
def enroll_course():
    if 'user_id' not in session or session['user_type'] != 'student':
        return redirect(url_for('login'))
    
    if request.method == 'POST':
        course_code = request.form['course_code']
        
        conn = get_db()
        course = conn.execute('SELECT * FROM courses WHERE course_code = ?', (course_code,)).fetchone()
        
        if not course:
            flash('Invalid course code')
            conn.close()
            return render_template('enroll_course.html')
        
        # Check if already enrolled
        existing_enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                                         (session['user_id'], course['id'])).fetchone()
        
        if existing_enrollment:
            flash('You are already enrolled in this course')
            conn.close()
            return render_template('enroll_course.html')
        
        # Enroll student
        conn.execute('INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
                    (session['user_id'], course['id']))
        conn.commit()
        conn.close()
        
        flash(f'Successfully enrolled in {course["course_name"]}')
        return redirect(url_for('student_dashboard'))
    
    return render_template('enroll_course.html')

@app.route('/course/<int:course_id>')
def course_details(course_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db()
    course = conn.execute('SELECT * FROM courses WHERE id = ?', (course_id,)).fetchone()
    
    if not course:
        flash('Course not found')
        return redirect(url_for('index'))
    
    if session['user_type'] == 'professor':
        if course['professor_id'] != session['user_id']:
            flash('Access denied')
            return redirect(url_for('professor_dashboard'))
    else:
        enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                                  (session['user_id'], course_id)).fetchone()
        if not enrollment:
            flash('You are not enrolled in this course')
            return redirect(url_for('student_dashboard'))

    rows = conn.execute('''SELECT * FROM events WHERE course_id = ? ORDER BY deadline ASC''',
                    (course_id,)).fetchall()

    assignments = []
    for row in rows:
        a = dict(row)  # Convert sqlite3.Row to a dict
        if a['deadline']:
            try:
                a['deadline'] = datetime.strptime(a['deadline'], '%Y-%m-%d %H:%M:%S')
            except ValueError:
                a['deadline'] = None
        assignments.append(a)

    professor = conn.execute('SELECT username FROM users WHERE id = ?', 
                             (course['professor_id'],)).fetchone()

    enrollment_count = conn.execute('SELECT COUNT(*) as count FROM enrollments WHERE course_id = ?',
                                    (course_id,)).fetchone()['count']

    conn.close()

    # Calculate active assignments
    now = datetime.now()
    active_assignments = [a for a in assignments if a['deadline'] and a['deadline'] > now]
    active_count = len(active_assignments)

    return render_template('course_details.html',
                           course=course,
                           assignments=assignments,
                           professor=professor,
                           enrollment_count=enrollment_count,
                           active_count=active_count, now=now)

@app.route('/course/<int:course_id>/create_assignment', methods=['GET', 'POST'])
def create_assignment(course_id):
    if 'user_id' not in session or session['user_type'] != 'professor':
        return redirect(url_for('login'))
    
    conn = get_db()
    course = conn.execute('SELECT * FROM courses WHERE id = ? AND professor_id = ?',
                         (course_id, session['user_id'])).fetchone()
    
    if not course:
        flash('Course not found or access denied')
        return redirect(url_for('professor_dashboard'))
    
    if request.method == 'POST':
        assignment_name = request.form['assignment_name']
        deadline = request.form['deadline']
        description = request.form['description']
        event_type = request.form['event_type']
        
        # Extract text from uploaded PDFs
        answer_text = None
        instructions_text = None
        
        # Handle answer key PDF
        if 'answer_pdf' in request.files:
            answer_file = request.files['answer_pdf']
            if answer_file and allowed_file(answer_file.filename):
                answer_text = extract_text_from_pdf(answer_file)
                if not answer_text:
                    flash('Failed to extract text from answer key PDF')
                    return render_template('create_assignment.html', course=course)
        
        # Handle instructions PDF
        if 'instructions_pdf' in request.files:
            instructions_file = request.files['instructions_pdf']
            if instructions_file and allowed_file(instructions_file.filename):
                instructions_text = extract_text_from_pdf(instructions_file)
                if not instructions_text:
                    flash('Failed to extract text from instructions PDF')
                    return render_template('create_assignment.html', course=course)
        
        # Convert deadline to proper format
        try:
            deadline_dt = datetime.strptime(deadline, '%Y-%m-%dT%H:%M')
        except ValueError:
            flash('Invalid deadline format')
            conn.close()
            return render_template('create_assignment.html', course=course)
        
        # Insert assignment
        conn.execute('''INSERT INTO events (course_id, event_name, event_type, description, deadline, 
                        answer_text, instructions_text) VALUES (?, ?, ?, ?, ?, ?, ?)''',
                    (course_id, assignment_name, event_type, description, deadline_dt, 
                     answer_text, instructions_text))
        conn.commit()
        conn.close()
        
        flash(f'{event_type} created successfully!')
        return redirect(url_for('course_details', course_id=course_id))
    
    conn.close()
    return render_template('create_assignment.html', course=course)

@app.route('/assignment/<int:assignment_id>')
def assignment_details(assignment_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db()
    assignment = conn.execute('''SELECT e.*, c.course_name, c.professor_id, c.id as course_id
                               FROM events e 
                               JOIN courses c ON e.course_id = c.id 
                               WHERE e.id = ?''', (assignment_id,)).fetchone()
    
    if not assignment:
        flash('Assignment not found')
        return redirect(url_for('index'))
    
    # Check access permissions
    if session['user_type'] == 'professor':
        if assignment['professor_id'] != session['user_id']:
            flash('Access denied')
            return redirect(url_for('professor_dashboard'))
    else:  # student
        enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                                (session['user_id'], assignment['course_id'])).fetchone()
        if not enrollment:
            flash('You are not enrolled in this course')
            return redirect(url_for('student_dashboard'))
    
    # Get submission if student
    submission = None
    if session['user_type'] == 'student':
        submission = conn.execute('SELECT * FROM submissions WHERE event_id = ? AND student_id = ?',
                                (assignment_id, session['user_id'])).fetchone()
    
    # Get all submissions if professor
    submissions = None
    if session['user_type'] == 'professor':
        submissions = conn.execute('''SELECT s.*, u.username 
                                    FROM submissions s 
                                    JOIN users u ON s.student_id = u.id 
                                    WHERE s.event_id = ?''', (assignment_id,)).fetchall()
    
    conn.close()
    
    return render_template('assignment_details.html', assignment=assignment, 
                         submission=submission, submissions=submissions)

@app.route('/submit_assignment/<int:assignment_id>', methods=['POST'])
def submit_assignment(assignment_id):
    if 'user_id' not in session or session['user_type'] != 'student':
        return redirect(url_for('login'))
    
    conn = get_db()
    assignment = conn.execute('''SELECT e.*, c.professor_id 
                               FROM events e 
                               JOIN courses c ON e.course_id = c.id 
                               WHERE e.id = ?''', (assignment_id,)).fetchone()
    
    if not assignment:
        flash('Assignment not found')
        return redirect(url_for('student_dashboard'))
    
    # Check if student is enrolled
    enrollment = conn.execute('SELECT * FROM enrollments WHERE student_id = ? AND course_id = ?',
                            (session['user_id'], assignment['course_id'])).fetchone()
    if not enrollment:
        flash('You are not enrolled in this course')
        return redirect(url_for('student_dashboard'))
    
    # Check if deadline has passed
    if assignment['deadline'] and datetime.now() > datetime.strptime(str(assignment['deadline']), '%Y-%m-%d %H:%M:%S'):
        flash('Assignment deadline has passed')
        return redirect(url_for('assignment_details', assignment_id=assignment_id))
    
    # Check if already submitted
    existing_submission = conn.execute('SELECT * FROM submissions WHERE event_id = ? AND student_id = ?',
                                     (assignment_id, session['user_id'])).fetchone()
    if existing_submission:
        flash('You have already submitted this assignment')
        return redirect(url_for('assignment_details', assignment_id=assignment_id))
    
    # Handle file upload and extract text
    submission_file = request.files['submission_file']
    if not submission_file or not allowed_file(submission_file.filename):
        flash('Please upload a valid PDF file')
        return redirect(url_for('assignment_details', assignment_id=assignment_id))
    
    # Extract text from submission PDF
    submission_text = extract_text_from_pdf(submission_file)
    if not submission_text:
        flash('Failed to extract text from your PDF. Please ensure it contains readable text.')
        return redirect(url_for('assignment_details', assignment_id=assignment_id))
    
    # Save submission to database
    conn.execute('''INSERT INTO submissions (event_id, student_id, submission_text) 
                    VALUES (?, ?, ?)''',
                (assignment_id, session['user_id'], submission_text))
    conn.commit()
    
    # If there's an answer key, trigger automatic grading
    if assignment['answer_text']:
        try:
            # Import your grading function
            from automated_grading import get_response
            
            # Get automated grade and feedback
            grading_result = get_response(assignment['answer_text'], submission_text)
            
            # Parse the grading result to extract grade and feedback
            lines = grading_result.strip().split('\n')
            grade = None
            feedback = grading_result
            
            # Try to extract numeric grade
            for line in lines:
                if 'Grade:' in line:
                    try:
                        grade_part = line.split('Grade:')[1].split('/')[0].strip()
                        grade = int(grade_part)
                        break
                    except:
                        pass
            
            # Update submission with grade and feedback
            conn.execute('''UPDATE submissions SET grade = ?, feedback = ? 
                           WHERE event_id = ? AND student_id = ?''',
                        (grade, feedback, assignment_id, session['user_id']))
            conn.commit()
            
            flash('Assignment submitted successfully! Automatic grading complete.')
            
        except Exception as e:
            # If automatic grading fails, still save the submission
            flash('Assignment submitted successfully! Grading will be done manually.')
            print(f"Automatic grading failed: {e}")
    else:
        flash('Assignment submitted successfully!')
    
    conn.close()
    return redirect(url_for('assignment_details', assignment_id=assignment_id))

if __name__ == '__main__':
    print("Starting AGS application...")
    try:
        print("Initializing database...")
        init_db()
        print("Database initialized successfully!")
        print("Starting Flask app on http://localhost:5000")
        app.run(debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        print(f"Error starting application: {e}")
        import traceback
        traceback.print_exc()
        input("Press Enter to exit...")