import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, User, Users, Calendar, Plus, ArrowLeft, FileText, Clock, CheckCircle, Eye, MoreVertical, Cpu } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Alert from '../components/Alert';

function CourseDetails() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [professor, setProfessor] = useState(null);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourse(response.data.course);
      setAssignments(response.data.assignments);
      setProfessor(response.data.professor);
      setEnrollmentCount(response.data.enrollment_count);
    } catch (error) {
      setError('Failed to load course details');
      console.error('Error fetching course details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentTypeIcon = (type) => {
    switch (type) {
      case 'assignment': return FileText;
      case 'quiz': return CheckCircle;
      case 'exam': return Clock;
      default: return FileText;
    }
  };

  const getAssignmentTypeColor = (type) => {
    switch (type) {
      case 'assignment': return 'bg-blue-500/20 text-blue-300';
      case 'quiz': return 'bg-green-500/20 text-green-300';
      case 'exam': return 'bg-red-500/20 text-red-300';
      case 'project': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const isAssignmentActive = (deadline) => {
    if (!deadline) return true;
    return new Date(deadline) > new Date();
  };

  const getActiveAssignments = () => {
    return assignments.filter(assignment => isAssignmentActive(assignment.deadline));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-card p-8">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-white text-center">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert type="error" message={error} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Course Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white flex items-center mb-3">
              <BookOpen className="mr-3 text-blue-300" size={36} />
              {course?.course_name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <span className="bg-blue-500/20 text-blue-300 px-4 py-2 rounded-full font-medium">
                {course?.course_code}
              </span>
              <span className="text-white/70 flex items-center">
                <User className="mr-1" size={16} />
                {professor?.username}
              </span>
              <span className="text-white/70 flex items-center">
                <Users className="mr-1" size={16} />
                {enrollmentCount} students
              </span>
            </div>
            <p className="text-white/60 flex items-center">
              <Calendar className="mr-1" size={16} />
              Created {course?.created_at ? new Date(course.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
          <div className="flex space-x-3">
            {user?.user_type === 'professor' && (
              <Link
                to={`/course/${courseId}/create-assignment`}
                className="primary-button flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Create Assignment</span>
              </Link>
            )}
            <Link
              to={user?.user_type === 'professor' ? '/professor/dashboard' : '/student/dashboard'}
              className="glass-button flex items-center space-x-2"
            >
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <FileText size={48} className="mx-auto text-blue-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Total Assignments</h3>
          <div className="text-3xl font-bold text-blue-400">{assignments.length}</div>
        </div>

        <div className="dashboard-card">
          <Clock size={48} className="mx-auto text-yellow-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Active</h3>
          <div className="text-3xl font-bold text-yellow-400">{getActiveAssignments().length}</div>
        </div>

        <div className="dashboard-card">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Completed</h3>
          <div className="text-3xl font-bold text-green-400">0</div>
        </div>

        <div className="dashboard-card">
          <Users size={48} className="mx-auto text-purple-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Students</h3>
          <div className="text-3xl font-bold text-purple-400">{enrollmentCount}</div>
        </div>
      </div>

      {/* Assignments List */}
      <div className="glass-card">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FileText className="mr-2" size={24} />
            Assignments & Quizzes
          </h2>
        </div>

        <div className="p-6">
          {assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => {
                const IconComponent = getAssignmentTypeIcon(assignment.event_type);
                const isActive = isAssignmentActive(assignment.deadline);
                
                return (
                  <div key={assignment.id} className="glass-card p-6 hover:scale-105 transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAssignmentTypeColor(assignment.event_type)}`}>
                          {assignment.event_type.charAt(0).toUpperCase() + assignment.event_type.slice(1)}
                        </span>
                        {(assignment.answer_text || assignment.instructions_text) && (
                          <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Cpu className="mr-1" size={12} />
                            AI
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <button className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                          <MoreVertical size={16} className="text-white/60" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-3">{assignment.event_name}</h3>

                    {assignment.description && (
                      <p className="text-white/70 text-sm mb-4 line-clamp-3">
                        {assignment.description.length > 100 
                          ? assignment.description.substring(0, 100) + '...'
                          : assignment.description
                        }
                      </p>
                    )}

                    <div className="flex justify-between items-center mb-4">
                      <div className="text-white/60 text-sm flex items-center">
                        <Calendar className="mr-1" size={14} />
                        {assignment.deadline 
                          ? `Due: ${new Date(assignment.deadline).toLocaleDateString()}`
                          : 'No deadline'
                        }
                      </div>
                      {assignment.deadline && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isActive 
                            ? 'bg-green-500/20 text-green-300' 
                            : 'bg-red-500/20 text-red-300'
                        }`}>
                          {isActive ? 'Open' : 'Closed'}
                        </span>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/assignment/${assignment.id}`}
                        className="flex-1 primary-button text-center text-sm flex items-center justify-center space-x-1"
                      >
                        <Eye size={14} />
                        <span>View</span>
                      </Link>
                      {assignment.instructions_text && (
                        <button
                          className="bg-blue-500/20 text-blue-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition-colors"
                          title="View Instructions"
                        >
                          <FileText size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText size={64} className="mx-auto text-white/30 mb-4 floating-icon" />
              <h3 className="text-xl font-semibold text-white/70 mb-2">No assignments yet</h3>
              <p className="text-white/50 mb-6">
                {user?.user_type === 'professor' 
                  ? 'Create your first assignment to get started!'
                  : 'Your professor will add assignments here.'
                }
              </p>
              {user?.user_type === 'professor' && (
                <Link
                  to={`/course/${courseId}/create-assignment`}
                  className="primary-button inline-flex items-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Create Assignment</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseDetails;