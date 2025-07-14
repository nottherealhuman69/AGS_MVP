import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { 
  GraduationCap,  // ← Changed from ChalkboardTeacher
  Plus, 
  Book, 
  Users, 
  ClipboardList, 
  Clock,
  Eye,
  FileText,
  Calendar
} from 'lucide-react'

const ProfessorDashboard = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses()
  }, [])

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/courses')
      setCourses(response.data)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalStudents = courses.reduce((total, course) => total + (course.enrollment_count || 0), 0)

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <GraduationCap className="mr-3 text-primary-500" />
              Professor Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your courses and assignments</p>
          </div>
          <Link to="/professor/create-course" className="btn-primary">
            <Plus className="w-5 h-5 mr-2" />
            Create New Course
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <Book className="h-12 w-12 text-primary-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">Total Courses</h3>
          <p className="text-3xl font-bold text-primary-500">{courses.length}</p>
        </div>

        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <Users className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">Total Students</h3>
          <p className="text-3xl font-bold text-green-500">{totalStudents}</p>
        </div>

        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <ClipboardList className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">Active Assignments</h3>
          <p className="text-3xl font-bold text-yellow-500">0</p>
        </div>

        <div className="card p-6 text-center hover:scale-105 transition-transform">
          <Clock className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-700">Pending Grades</h3>
          <p className="text-3xl font-bold text-red-500">0</p>
        </div>
      </div>

      {/* Courses List */}
      <div className="card">
        <div className="px-6 py-4 border-b border-white/20">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <FileText className="mr-2" />
            Your Courses
          </h2>
        </div>
        
        <div className="p-6">
          {courses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-white/20">
                    <th className="pb-3 font-semibold text-gray-700">Course Name</th>
                    <th className="pb-3 font-semibold text-gray-700">Course Code</th>
                    <th className="pb-3 font-semibold text-gray-700">Students Enrolled</th>
                    <th className="pb-3 font-semibold text-gray-700">Created</th>
                    <th className="pb-3 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-4">
                        <span className="font-medium text-gray-800">{course.course_name}</span>
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-primary-500 text-white rounded-lg text-sm font-medium">
                          {course.course_code}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-green-500 text-white rounded-lg text-sm font-medium">
                          {course.enrollment_count || 0} students
                        </span>
                      </td>
                      <td className="py-4 text-gray-600">
                        {new Date(course.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <Link
                            to={`/course/${course.id}`}
                            className="p-2 text-primary-500 hover:bg-primary-500/10 rounded-lg transition-colors"
                            title="View Course Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/course/${course.id}/create-assignment`}
                            className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Create Assignment"
                          >
                            <Plus className="w-4 h-4" />
                          </Link>
                          <button
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="View Students"
                          >
                            <Users className="w-4 h-4" />
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
              <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-6">Create your first course to get started!</p>
              <Link to="/professor/create-course" className="btn-primary">
                <Plus className="w-5 h-5 mr-2" />
                Create Course
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Calendar className="mr-2" />
              Recent Activity
            </h3>
          </div>
          <div className="p-6 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        </div>

        <div className="card">
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Clock className="mr-2" />
              Notifications
            </h3>
          </div>
          <div className="p-6 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No new notifications</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfessorDashboard