import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { UserPlus, Key, LogIn, ArrowLeft, Search, AlertTriangle, Clock, Bell } from 'lucide-react'

const EnrollCourse = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    course_code: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    // Auto-uppercase the course code
    const value = e.target.value.toUpperCase()
    setFormData({
      ...formData,
      [e.target.name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post('/api/courses/enroll', formData)
      
      if (response.data.success) {
        setSuccess(response.data.message)
        setTimeout(() => {
          navigate('/student/dashboard')
        }, 2000)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to enroll in course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <UserPlus className="h-16 w-16 text-primary-500 mx-auto mb-4 animate-bounce" />
        <h1 className="text-3xl font-bold text-gray-800">Enroll in Course</h1>
        <p className="text-gray-600 mt-2">Enter the course code provided by your professor</p>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="inline w-4 h-4 mr-2" />
                Course Code
              </label>
              <input
                type="text"
                name="course_code"
                value={formData.course_code}
                onChange={handleChange}
                placeholder="Enter 8-character course code"
                maxLength="8"
                className="input-field w-full text-center text-lg font-bold tracking-widest"
                style={{ letterSpacing: '2px' }}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Course codes are 8 characters long (e.g., ABC12345)
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Enroll in Course</span>
                  </>
                )}
              </button>

              <Link 
                to="/student/dashboard" 
                className="btn-outline w-full flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </form>
        </div>

        {/* Help Card */}
        <div className="card p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Search className="mr-2 text-primary-500" />
            Need Help?
          </h3>

          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <Search className="w-6 h-6 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-700">Where to Find Course Code?</h4>
                <p className="text-sm text-gray-600">
                  Your professor will provide the course code during class or via email
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-700">Invalid Code?</h4>
                <p className="text-sm text-gray-600">
                  Double-check the code with your professor if enrollment fails
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Clock className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-700">Instant Access</h4>
                <p className="text-sm text-gray-600">
                  Once enrolled, you'll immediately see course assignments
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Bell className="w-6 h-6 text-primary-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-700">Notifications</h4>
                <p className="text-sm text-gray-600">
                  Get notified about new assignments and deadlines
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnrollCourse