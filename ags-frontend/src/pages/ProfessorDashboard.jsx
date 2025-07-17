import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Book, Users as UsersIcon, Clock, AlertCircle, Eye, FileText, UserCheck } from 'lucide-react';
import axios from 'axios';
import Alert from '../components/Alert';

function ProfessorDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/professor/dashboard');
      setCourses(response.data.courses);
    } catch (error) {
      setError('Failed to load courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalStudents = courses.reduce((sum, course) => sum + course.enrollment_count, 0);

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
              <Users className="mr-3 text-blue-300" size={36} />
              Professor Dashboard
            </h1>
            <p className="text-white/70 mt-2">Manage your courses and assignments</p>
          </div>
          <Link
            to="/create-course"
            className="primary-button flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Create New Course</span>
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
          <h3 className="text-lg font-semibold text-white/90 mb-2">Total Courses</h3>
          <div className="text-3xl font-bold text-blue-400">{courses.length}</div>
        </div>

        <div className="dashboard-card">
          <UsersIcon size={48} className="mx-auto text-green-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Total Students</h3>
          <div className="text-3xl font-bold text-green-400">{totalStudents}</div>
        </div>

        <div className="dashboard-card">
          <Clock size={48} className="mx-auto text-yellow-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Active Assignments</h3>
          <div className="text-3xl font-bold text-yellow-400">0</div>
        </div>

        <div className="dashboard-card">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-white/90 mb-2">Pending Grades</h3>
          <div className="text-3xl font-bold text-red-400">0</div>
        </div>
      </div>

      {/* Courses List */}
      <div className="glass-card">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white flex items-center">
            <FileText className="mr-2" size={24} />
            Your Courses
          </h2>
        </div>

        <div className="p-6">
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Course Name</th>
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Course Code</th>
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Students Enrolled</th>
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Created</th>
                    <th className="text-left py-3 px-4 text-white/90 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{course.course_name}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                          {course.course_code}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                          {course.enrollment_count} students
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white/70">
                        {course.created_at ? new Date(course.created_at).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex space-x-2">
                          <Link
                            to={`/course/${course.id}`}
                            className="glass-button text-sm flex items-center space-x-1"
                            title="View Course Details"
                          >
                            <Eye size={14} />
                          </Link>
                          <Link
                            to={`/course/${course.id}/create-assignment`}
                            className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center space-x-1"
                            title="Create Assignment"
                          >
                            <Plus size={14} />
                          </Link>
                          <Link
                            to={`/course/${course.id}/students`}
                            className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors flex items-center space-x-1"
                            title="View Students"
                            >
                            <UserCheck size={14} />
                            </Link>
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
              <h3 className="text-xl font-semibold text-white/70 mb-2">No courses yet</h3>
              <p className="text-white/50 mb-6">Create your first course to get started!</p>
              <Link
                to="/create-course"
                className="primary-button inline-flex items-center space-x-2"
              >
                <Plus size={18} />
                <span>Create Course</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center">
              <Clock className="mr-2" size={20} />
              Recent Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white/50">No recent activity</p>
            </div>
          </div>
        </div>

        <div className="glass-card">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center">
              <AlertCircle className="mr-2" size={20} />
              Notifications
            </h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <AlertCircle size={48} className="mx-auto text-white/30 mb-4" />
              <p className="text-white/50">No new notifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfessorDashboard;