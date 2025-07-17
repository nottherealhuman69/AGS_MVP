// Create this file as ags-frontend/src/pages/ViewStudents.jsx

import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { 
  Users, 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  GraduationCap, 
  TrendingUp, 
  FileText, 
  Star,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Download,
  Eye
} from 'lucide-react';
import axios from 'axios';
import Alert from '../components/Alert';

function ViewStudents() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseData, setCourseData] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [courseId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/courses/${courseId}/students`);
      setCourseData(response.data.course);
      setStudents(response.data.students);
    } catch (error) {
      setError('Failed to load students');
      console.error('Error fetching students:', error);
      if (error.response?.status === 403) {
        navigate('/professor/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentPerformance = async (studentId) => {
    try {
      setLoadingPerformance(true);
      const response = await axios.get(`/api/courses/${courseId}/students/${studentId}/performance`);
      setStudentPerformance(response.data);
    } catch (error) {
      console.error('Error fetching student performance:', error);
      setError('Failed to load student performance');
    } finally {
      setLoadingPerformance(false);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    fetchStudentPerformance(student.id);
  };

  const closeStudentModal = () => {
    setSelectedStudent(null);
    setStudentPerformance(null);
  };

  const filteredStudents = students.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'graded': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getGradeColor = (grade) => {
    if (grade >= 8) return 'text-green-400';
    if (grade >= 6) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-card p-8">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-white text-center">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <Link
                to="/professor/dashboard"
                className="glass-button p-2"
                title="Back to Dashboard"
              >
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-3xl font-bold text-white flex items-center">
                <Users className="mr-3 text-blue-300" size={36} />
                Course Students
              </h1>
            </div>
            {courseData && (
              <div className="text-white/70">
                <p className="text-lg font-semibold">{courseData.course_name}</p>
                <p className="text-sm">Course Code: {courseData.course_code}</p>
              </div>
            )}
          </div>
          <div className="flex space-x-3">
            <Link
              to={`/course/${courseId}`}
              className="glass-button flex items-center space-x-2"
            >
              <Eye size={16} />
              <span>View Course</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <Users size={48} className="mx-auto text-blue-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Total Students</h3>
          <div className="text-3xl font-bold text-blue-400">{students.length}</div>
        </div>

        <div className="dashboard-card">
          <FileText size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Avg Submissions</h3>
          <div className="text-3xl font-bold text-green-400">
            {students.length > 0 ? 
              Math.round(students.reduce((sum, s) => sum + (s.total_submissions || 0), 0) / students.length) : 0}
          </div>
        </div>

        <div className="dashboard-card">
          <Star size={48} className="mx-auto text-yellow-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Avg Grade</h3>
          <div className="text-3xl font-bold text-yellow-400">
            {students.length > 0 ? 
              (students.filter(s => s.avg_grade).reduce((sum, s) => sum + s.avg_grade, 0) / 
               students.filter(s => s.avg_grade).length || 0).toFixed(1) : '-'}
          </div>
        </div>

        <div className="dashboard-card">
          <TrendingUp size={48} className="mx-auto text-purple-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Active Students</h3>
          <div className="text-3xl font-bold text-purple-400">
            {students.filter(s => s.total_submissions > 0).length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Enrolled Students</h2>
          <div className="flex space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50" size={18} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {filteredStudents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Student</th>
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Email</th>
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Enrolled</th>
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Submissions</th>
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Avg Grade</th>
                  <th className="text-left py-3 px-4 text-white/90 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <User size={20} className="text-blue-300" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">{student.username}</div>
                          <div className="text-white/60 text-sm">ID: {student.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2 text-white/70">
                        <Mail size={16} />
                        <span>{student.email}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white/70">
                      <div className="flex items-center space-x-2">
                        <Calendar size={16} />
                        <span>
                          {student.enrolled_at ? 
                            new Date(student.enrolled_at).toLocaleDateString() : 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                        {student.total_submissions || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {student.avg_grade ? (
                        <span className={`font-bold ${getGradeColor(student.avg_grade)}`}>
                          {student.avg_grade}/10
                        </span>
                      ) : (
                        <span className="text-gray-400">No grades</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleViewStudent(student)}
                        className="glass-button text-sm flex items-center space-x-1"
                        title="View Performance"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users size={64} className="mx-auto text-white/30 mb-4" />
            <h3 className="text-xl font-semibold text-white/70 mb-2">
              {searchTerm ? 'No students found' : 'No students enrolled yet'}
            </h3>
            <p className="text-white/50">
              {searchTerm ? 'Try adjusting your search terms' : 'Students will appear here once they enroll in your course'}
            </p>
          </div>
        )}
      </div>

      {/* Student Performance Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center">
                    <User className="mr-2" size={24} />
                    {selectedStudent.username}'s Performance
                  </h3>
                  <p className="text-white/70">{selectedStudent.email}</p>
                </div>
                <button
                  onClick={closeStudentModal}
                  className="glass-button p-2"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingPerformance ? (
                <div className="text-center py-8">
                  <div className="loading mx-auto mb-4"></div>
                  <p className="text-white">Loading performance data...</p>
                </div>
              ) : studentPerformance ? (
                <div className="space-y-6">
                  {/* Performance Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText size={20} className="text-blue-400" />
                        <span className="text-white/90">Total Assignments</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-400">
                        {studentPerformance.assignments?.length || 0}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle size={20} className="text-green-400" />
                        <span className="text-white/90">Completed</span>
                      </div>
                      <div className="text-2xl font-bold text-green-400">
                        {studentPerformance.assignments?.filter(a => a.submission_id).length || 0}
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Star size={20} className="text-yellow-400" />
                        <span className="text-white/90">Average Grade</span>
                      </div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {selectedStudent.avg_grade ? `${selectedStudent.avg_grade}/10` : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Assignments List */}
                  <div>
                    <h4 className="text-lg font-bold text-white mb-4">Assignment Submissions</h4>
                    {studentPerformance.assignments?.length > 0 ? (
                      <div className="space-y-3">
                        {studentPerformance.assignments.map((assignment) => (
                          <div key={assignment.id} className="bg-white/5 rounded-lg p-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h5 className="font-semibold text-white">{assignment.event_name}</h5>
                                <p className="text-white/60 text-sm capitalize">{assignment.event_type}</p>
                                <p className="text-white/50 text-sm">
                                  Due: {assignment.deadline ? 
                                    new Date(assignment.deadline).toLocaleString() : 'No deadline'}
                                </p>
                              </div>
                              <div className="text-right">
                                {assignment.submission_id ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle size={16} className="text-green-400" />
                                      <span className="text-green-400 text-sm font-medium">Submitted</span>
                                    </div>
                                    {assignment.grade !== null ? (
                                      <div className={`font-bold ${getGradeColor(assignment.grade)}`}>
                                        {assignment.grade}/10
                                      </div>
                                    ) : (
                                      <div className="text-yellow-400 text-sm">Pending Grade</div>
                                    )}
                                    {assignment.submitted_at && (
                                      <div className="text-white/50 text-xs">
                                        {new Date(assignment.submitted_at).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <AlertCircle size={16} className="text-red-400" />
                                    <span className="text-red-400 text-sm font-medium">Not Submitted</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {assignment.feedback && (
                              <div className="mt-3 p-3 bg-white/5 rounded border-l-4 border-blue-400">
                                <p className="text-white/90 text-sm">{assignment.feedback}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-white/60">No assignments in this course yet.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-white/60 text-center py-8">Failed to load performance data.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ViewStudents;