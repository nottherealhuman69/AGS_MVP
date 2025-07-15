import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Key, ArrowLeft, Search, AlertTriangle, Clock, Bell } from 'lucide-react';
import axios from 'axios';
import Alert from '../components/Alert';

function EnrollCourse() {
  const [formData, setFormData] = useState({
    course_code: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    // Auto-uppercase and limit to 8 characters
    const value = e.target.value.toUpperCase().slice(0, 8);
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/enroll', formData);
      
      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to enroll in course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="text-center">
          <UserPlus size={64} className="mx-auto text-green-300 mb-4 floating-icon" />
          <h1 className="text-3xl font-bold text-white mb-2">Enroll in Course</h1>
          <p className="text-white/70">Enter the course code provided by your professor</p>
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
                  <Key size={18} className="inline mr-2" />
                  Course Code
                </label>
                <input
                  type="text"
                  name="course_code"
                  value={formData.course_code}
                  onChange={handleChange}
                  className="w-full px-4 py-4 rounded-xl bg-white/10 border border-white/20 text-white text-center text-xl font-bold tracking-wider placeholder-white/50 focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                  placeholder="Enter 8-character course code"
                  maxLength="8"
                  required
                />
                <p className="text-white/60 text-sm mt-2">
                  Course codes are 8 characters long (e.g., ABC12345)
                </p>
              </div>

              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading || formData.course_code.length !== 8}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:from-green-600 hover:to-emerald-700 hover:scale-105 shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="loading"></div>
                      <span>Enrolling...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>Enroll in Course</span>
                    </>
                  )}
                </button>

                <Link
                  to="/student/dashboard"
                  className="w-full glass-button flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={18} />
                  <span>Back to Dashboard</span>
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Help Section */}
        <div className="lg:col-span-1">
          <div className="glass-card">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center">
                <Search className="mr-2" size={20} />
                Need Help?
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-3">
                <Search className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Where to Find Course Code?</h4>
                  <p className="text-white/60 text-sm">Your professor will provide the course code during class or via email</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <AlertTriangle className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Invalid Code?</h4>
                  <p className="text-white/60 text-sm">Double-check the code with your professor if enrollment fails</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="text-green-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Instant Access</h4>
                  <p className="text-white/60 text-sm">Once enrolled, you'll immediately see course assignments</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Bell className="text-purple-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Notifications</h4>
                  <p className="text-white/60 text-sm">Get notified about new assignments and deadlines</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnrollCourse;