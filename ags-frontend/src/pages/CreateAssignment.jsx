import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ClipboardList, ArrowLeft, Upload, FileText, Key } from 'lucide-react'

const CreateAssignment = () => {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    event_type: '',
    assignment_name: '',
    description: '',
    deadline: ''
  })
  const [files, setFiles] = useState({
    instructions_pdf: null,
    answer_pdf: null
  })

  useEffect(() => {
    fetchCourse()
  }, [courseId])

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`)
      setCourse(response.data.course)
    } catch (error) {
      console.error('Error fetching course:', error)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0]
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const submitData = new FormData()
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key])
    })
    
    if (files.instructions_pdf) {
      submitData.append('instructions_pdf', files.instructions_pdf)
    }
    if (files.answer_pdf) {
      submitData.append('answer_pdf', files.answer_pdf)
    }

    try {
      await axios.post(`/api/courses/${courseId}/assignments`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      navigate(`/course/${courseId}`)
    } catch (error) {
      console.error('Error creating assignment:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!course) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <ClipboardList className="h-16 w-16 text-primary-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-800">Create Assignment</h1>
        <p className="text-gray-600 mt-2">{course.course_name} ({course.course_code})</p>
      </div>

      {/* Form */}
      <div className="card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Assignment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleInputChange}
              className="input-field w-full"
              required
            >
              <option value="">Choose type</option>
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
              <option value="exam">Exam</option>
              <option value="project">Project</option>
            </select>
          </div>

          {/* Assignment Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Assignment Name</label>
            <input
              type="text"
              name="assignment_name"
              value={formData.assignment_name}
              onChange={handleInputChange}
              placeholder="e.g., Midterm Exam, Lab Assignment 1"
              className="input-field w-full"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="4"
              placeholder="Provide detailed instructions, learning objectives, and any special requirements..."
              className="input-field w-full"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              className="input-field w-full"
              required
            />
          </div>

          {/* File Uploads */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline w-4 h-4 mr-2" />
                Instructions PDF (Required)
              </label>
              <input
                type="file"
                name="instructions_pdf"
                onChange={handleFileChange}
                accept=".pdf"
                className="input-field w-full"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Key className="inline w-4 h-4 mr-2" />
                Answer Key PDF (Optional)
              </label>
              <input
                type="file"
                name="answer_pdf"
                onChange={handleFileChange}
                accept=".pdf"
                className="input-field w-full"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Assignment'}
            </button>
            <Link to={`/course/${courseId}`} className="btn-outline flex-1 text-center">
              <ArrowLeft className="inline w-5 h-5 mr-2" />
              Back to Course
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAssignment