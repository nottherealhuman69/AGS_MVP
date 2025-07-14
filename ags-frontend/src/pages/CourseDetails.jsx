import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { 
  BookOpen, 
  Plus, 
  ArrowLeft, 
  User, 
  Users, 
  Calendar,
  ClipboardList,
  Clock,
  CheckCircle,
  Eye,
  FileText,
  Badge
} from 'lucide-react'

const CourseDetails = () => {
  const { courseId } = useParams()
  const [courseData, setCourseData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    fetchCourseDetails()
    fetchUser()
  }, [courseId])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me')
      setUser(response.data.user)
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const fetchCourseDetails = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`)
      setCourseData(response.data)
    } catch (error) {
      console.error('Error fetching course details:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAssignmentTypeIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <FileText className="w-5 h-5" />
      case 'quiz':
        return <ClipboardList className="w-5 h-5" />
      case 'exam':
        return <Badge className="w-5 h-5" />
      default:
        return <FileText className="w-5 h-5" />
    }
  }

  const getAssignmentTypeColor = (type) => {
    switch (type) {
      case 'assignment':
        return 'bg-primary-500'
      case 'quiz':
        return 'bg-green-500'
      case 'exam':
        return 'bg-red-500'
      default:
        return 'bg-blue-500'
    }
  }

  const isAssignmentActive = (deadline) => {
    if (!deadline) return true
    return new Date(deadline) > new Date()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!courseData) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-600">Course not found</h2>
      </div>
    )
  }

  const { course, assignments, professor, enrollment_count } = courseData
  const activeAssignments = assignments.filter(a => isAssignmentActive(a.deadline))

  return (
    <div className="space-y-8">
      {/* Course Header */}
      <div className="card p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-2">
              <BookOpen className="mr-3 text-primary-500" />
              {course.course_name}
            </h1>
            <div className="flex items-center space-x-6 mb-2">
              <span className="px-3 py-1 bg-primary-500 text-white rounded-lg font-medium">
                {course.course_code}
              </span>
              <span className="text-gray-600 flex items-center">
                <User className="w-4 h-4 mr-1" />
                {professor.username}
              </span>
              <span className="text-gray-600 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {enrollment_count} students
              </span>
            </div>
            <p className="text-gray-600 flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              Created {formatDate(course.created_at)}
            </p>
          </div>
          <div className="flex space-x-3">
            {user && user.user_type === 'professor' && (
              <Link 
                to={`/course/${courseId}/create-assignment`} 
                className="btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Assignment
              </Link>
            )}
            <Link 
              to={user && user.user_type === 'professor' ? '/professor/dashboard' : '/student/dashboard'} 
              className="btn-outline"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Course Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <ClipboardList className="h-12 w-12 text-primary-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">Total Assignments</h3>
          <p className="text-3xl font-bold text-primary-500">{assignments.length}</p>
        </div>

        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">Active</h3>
          <p className="text-3xl font-bold text-yellow-500">{activeAssignments.length}</p>
        </div>

        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">Completed</h3>
          <p className="text-3xl font-bold text-green-500">0</p>
        </div>

        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">Students</h3>
          <p className="text-3xl font-bold text-blue-500">{enrollment_count}</p>
        </div>
      </div>

      {/* Assignments List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <ClipboardList className="mr-2" />
            Assignments & Quizzes
          </h2>
        </div>
        
        <div className="p-6">
          {assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="card hover:scale-105 transition-transform">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`px-2 py-1 text-white rounded-lg text-sm font-medium flex items-center space-x-1 ${getAssignmentTypeColor(assignment.event_type)}`}>
                        {getAssignmentTypeIcon(assignment.event_type)}
                        <span className="capitalize">{assignment.event_type}</span>
                      </span>
                      {assignment.deadline && (
                        <span className={`px-2 py-1 text-white rounded-lg text-sm font-medium ${
                          isAssignmentActive(assignment.deadline) ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {isAssignmentActive(assignment.deadline) ? 'Open' : 'Closed'}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-gray-800 mb-2">{assignment.event_name}</h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {assignment.description && assignment.description.length > 100 
                        ? `${assignment.description.substring(0, 100)}...` 
                        : assignment.description || 'No description'}
                    </p>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        Due: {formatDate(assignment.deadline)}
                      </p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Link
                        to={`/assignment/${assignment.id}`}
                        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </Link>
                      {assignment.instructions_text && (
                        <button 
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          title="View Instructions"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardList className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No assignments yet</h3>
              <p className="text-gray-500 mb-6">
                {user && user.user_type === 'professor' 
                  ? 'Create your first assignment to get started!' 
                  : 'Your professor will add assignments here.'}
              </p>
              {user && user.user_type === 'professor' && (
                <Link to={`/course/${courseId}/create-assignment`} className="btn-primary">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Assignment
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseDetails