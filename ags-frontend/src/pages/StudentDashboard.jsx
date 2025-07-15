import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Plus, Book, Clock, CheckCircle, Star, Eye, FileText, Calendar, Trophy } from 'lucide-react';
import axios from 'axios';
import Alert from '../components/Alert';

function StudentDashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await axios.get('/api/student/dashboard');
      setEnrollments(response.data.enrollments);
    } catch (error) {
      setError('Failed to load courses');
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-card p-8">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-white text-center">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <GraduationCap className="mr-3 text-green-300" size={36} />
              Student Dashboard
            </h1>
            <p className="text-white/70 mt-2">Track your courses and assignments</p>
          </div>
          <Link
            to="/enroll-course"
            className="primary-button flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Enroll in Course</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dashboard-card">
          <Book size={48} className="mx-auto text-blue-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Enrolled Courses</h3>
          <div className="text-3xl font-bold text-blue-400">{enrollments.length}</div>
        </div>

        <div className="dashboard-card">
          <Clock size={48} className="mx-auto text-yellow-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Pending Assignments</h3>
          <div className="text-3xl font-bold text-yellow-400">0</div>
        </div>

        <div className="dashboard-card">
          <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Completed</h3>
          <div className="text-3xl font-bold text-green-400">0</div>
        </div>

        <div className="dashboard-card">
          <Star size={48} className="mx-auto text-purple-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Average Grade</h3>
          <div className="text-3xl font-bold text-purple-400">-</div>
        </div>
      </div>

      {/* Courses List */}
      <div className="glass-card">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FileText className="mr-2" size={24} />
            My Courses
          </h2>
        </div>

        <div className="p-6">
          {enrollments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Course Name</th>
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Course Code</th>
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Enrolled Date</th>
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{enrollment.course_name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                          {enrollment.course_code}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white/70">
                        {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Link
                            to={`/course/${enrollment.id}`}
                            className="glass-button text-sm flex items-center space-x-1"
                            title="View Course"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            to={`/course/${enrollment.id}`}
                            className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center space-x-1"
                            title="View Assignments"
                          >
                            <FileText size={14} />
                          </Link>
                          <button
                            className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors flex items-center space-x-1"
                            title="Grades"
                          >
                            <Star size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Book size={64} className="mx-auto text-white/30 mb-4 floating-icon" />
              <h3 className="text-xl font-semibold text-white/70 mb-2">No courses enrolled yet</h3>
              <p className="text-white/50 mb-6">Join your first course to get started!</p>
              <Link
                to="/enroll-course"
                className="primary-button inline-flex items-center space-x-2 animate-pulse-slow"
              >
                <Plus size={18} />
                <span>Enroll in Course</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Deadlines & Recent Grades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Calendar className="mr-2" size={20} />
              Upcoming Deadlines
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white/50">No upcoming deadlines</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Trophy className="mr-2" size={20} />
              Recent Grades
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <Trophy size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white/50">No grades yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;