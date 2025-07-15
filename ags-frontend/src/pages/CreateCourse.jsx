import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Book, ArrowLeft, Plus, CheckCircle, Users as UsersIcon, FileText, Cpu } from 'lucide-react';
import axios from 'axios';
import Alert from '../components/Alert';

function CreateCourse() {
  const [formData, setFormData] = useState({
    course_name: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/courses', formData);
      
      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => {
          navigate('/professor/dashboard');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="text-center">
          <Users size={64} className="mx-auto text-blue-300 mb-4 floating-icon" />
          <h1 className="text-3xl font-bold text-white mb-2">Create New Course</h1>
          <p className="text-white/70">Set up a new course for your students</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6">
            {/* Alerts */}
            {error && (
              <Alert type="error" message={error} className="mb-6" />
            )}
            {success && (
              <Alert type="success" message={success} className="mb-6" />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-white/90 font-semibold mb-3">
                  <Book size={18} className="inline mr-2" />
                  Course Name
                </label>
                <input
                  type="text"
                  name="course_name"
                  value={formData.course_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="e.g., Introduction to Computer Science"
                  required
                />
                <p className="text-white/60 text-sm mt-2">
                  Choose a descriptive name for your course
                </p>
              </div>

              <Alert 
                type="info" 
                message="A unique course code will be automatically generated for student enrollment."
                className="mb-6"
              />

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full primary-button flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="loading"></div>
                      <span>Creating Course...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Create Course</span>
                    </>
                  )}
                </button>

                <Link
                  to="/professor/dashboard"
                  className="w-full glass-button flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={18} />
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Tips Section */}
        <div className="lg:col-span-1">
          <div className="glass-card">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center">
                <FileText className="mr-2" size={20} />
                Course Creation Tips
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="text-green-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Clear Naming</h4>
                  <p className="text-white/60 text-sm">Use descriptive course names that students can easily identify</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <UsersIcon className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Share Course Code</h4>
                  <p className="text-white/60 text-sm">Students will use the generated code to enroll in your course</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <FileText className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Add Assignments</h4>
                  <p className="text-white/60 text-sm">Create assignments and quizzes after course creation</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Cpu className="text-purple-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Auto Grading</h4>
                  <p className="text-white/60 text-sm">Upload answer keys for automatic grading and feedback</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateCourse;