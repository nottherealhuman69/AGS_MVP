import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { GraduationCap, Book, Plus, ArrowLeft, Info, CheckCircle, Users, ClipboardList, Bot } from 'lucide-react'

const CreateCourse = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    course_name: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await axios.post('/api/courses', formData)
      
      if (response.data.success) {
        setSuccess(`Course created successfully! Course code: ${response.data.course_code}`)
        setTimeout(() => {
          navigate('/professor/dashboard')
        }, 3000)
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create course')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <GraduationCap className="h-16 w-16 text-primary-500 mx-auto mb-4 animate-bounce" />
        <h1 className="text-3xl font-bold text-gray-800">Create New Course</h1>
        <p className="text-gray-600 mt-2">Set up a new course for your students</p>
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
                <Book className="inline w-4 h-4 mr-2" />
                Course Name
              </label>
              <input
                type="text"
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                placeholder="e.g., Introduction to Computer Science"
                className="input-field w-full"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Choose a descriptive name for your course
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Note:</p>
                  <p className="text-sm text-blue-700">
                    A unique course code will be automatically generated for student enrollment.
                  </p>
                </div>
              </div>
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
                    <Plus className="w-5 h-5" />
                    <span>Create Course</span>
                  </>
                )}
              </button>

              <Link 
                to="/professor/dashboard" 
                className="btn-outline w-full flex items-center justify-center space-x-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </form>
        </div>

        {/* Tips Card */}
        <div className="card p-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
            <Info className="mr-2 text-primary-500" />
            Course Creation Tips
          </h3>

          <div className="space-y-6">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-700">Clear Naming</h4>
                <p className="text-sm text-gray-600">
                  Use descriptive course names that students can easily identify
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Users className="w-6 h-6 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-700">Share Course Code</h4>
                <p className="text-sm text-gray-600">
                  Students will use the generated code to enroll in your course
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <ClipboardList className="w-6 h-6 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-700">Add Assignments</h4>
                <p className="text-sm text-gray-600">
                  Create assignments and quizzes after course creation
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Bot className="w-6 h-6 text-primary-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-gray-700">Auto Grading</h4>
                <p className="text-sm text-gray-600">
                  Upload answer keys for automatic grading and feedback
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateCourse