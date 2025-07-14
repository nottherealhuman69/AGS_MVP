import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FileText, ArrowLeft, Upload, Eye, Clock } from 'lucide-react'

const AssignmentDetails = () => {
  const { assignmentId } = useParams()
  const [assignment, setAssignment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // This would fetch assignment details from your API
    // For now, we'll simulate loading
    setTimeout(() => {
      setAssignment({
        id: assignmentId,
        event_name: 'Sample Assignment',
        event_type: 'assignment',
        description: 'This is a sample assignment description.',
        deadline: '2024-12-31T23:59',
        course_name: 'Sample Course'
      })
      setLoading(false)
    }, 1000)
  }, [assignmentId])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-600">Assignment not found</h2>
        <Link to="/" className="btn-primary mt-4">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Go Back
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Assignment Header */}
      <div className="card p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 bg-primary-500 text-white rounded-lg font-medium capitalize">
                {assignment.event_type}
              </span>
              <span className="px-3 py-1 bg-green-500 text-white rounded-lg font-medium">
                Open
              </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center mb-2">
              <FileText className="mr-3 text-primary-500" />
              {assignment.event_name}
            </h1>
            <p className="text-gray-600 mb-1">{assignment.course_name}</p>
            <p className="text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              Due: {new Date(assignment.deadline).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex space-x-3">
            <button className="btn-primary">
              <Eye className="w-5 h-5 mr-2" />
              View Instructions
            </button>
            <Link to="/" className="btn-outline">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Course
            </Link>
          </div>
        </div>
      </div>

      {/* Assignment Description */}
      {assignment.description && (
        <div className="card">
          <div className="px-6 py-4 border-b border-white/20">
            <h2 className="text-xl font-semibold text-gray-800">Description</h2>
          </div>
          <div className="p-6">
            <p className="text-gray-700">{assignment.description}</p>
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <FileText className="mr-2" />
              Instructions
            </h3>
          </div>
          <div className="p-6 text-center">
            <FileText className="h-16 w-16 text-primary-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-700 mb-2">Instructions Available</h4>
            <p className="text-gray-600 mb-4">Contains questions and requirements</p>
            <button className="btn-primary">
              <Eye className="w-5 h-5 mr-2" />
              View Instructions
            </button>
          </div>
        </div>

        <div className="card">
          <div className="px-6 py-4 border-b border-white/20">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center">
              <Upload className="mr-2" />
              Your Submission
            </h3>
          </div>
          <div className="p-6 text-center">
            <Upload className="h-16 w-16 text-primary-500 mx-auto mb-4" />
            <h4 className="font-semibold text-gray-700 mb-2">Upload Your Answer</h4>
            <p className="text-gray-600 mb-4">Submit your work as a PDF</p>
            <button className="btn-primary">
              <Upload className="w-5 h-5 mr-2" />
              Submit Assignment
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AssignmentDetails