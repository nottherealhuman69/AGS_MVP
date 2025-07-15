import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FileText, Tag, Calendar, Upload, Key, ArrowLeft, Plus, AlertCircle, Clock, CheckCircle, Cpu } from 'lucide-react';
import axios from 'axios';
import Alert from '../components/Alert';

function CreateAssignment() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [formData, setFormData] = useState({
    event_type: '',
    assignment_name: '',
    description: '',
    deadline: ''
  });
  const [files, setFiles] = useState({
    instructions_pdf: null,
    answer_pdf: null
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [courseLoading, setCourseLoading] = useState(true);

  useEffect(() => {
    fetchCourse();
    // Set minimum deadline to current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setFormData(prev => ({
      ...prev,
      deadline: now.toISOString().slice(0, 16)
    }));
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourse(response.data.course);
    } catch (error) {
      setError('Failed to load course details');
    } finally {
      setCourseLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    const fieldName = e.target.name;

    if (file) {
      // Validate file size (16MB)
      if (file.size > 16 * 1024 * 1024) {
        setError('File size must be less than 16MB');
        e.target.value = '';
        return;
      }

      // Validate file type
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload only PDF files');
        e.target.value = '';
        return;
      }

      setFiles({
        ...files,
        [fieldName]: file
      });
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate required fields
    if (!formData.assignment_name || !formData.deadline || !formData.event_type) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Validate that instructions PDF is provided
    if (!files.instructions_pdf) {
      setError('Instructions PDF is required');
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Append form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append files
      if (files.instructions_pdf) {
        formDataToSend.append('instructions_pdf', files.instructions_pdf);
      }
      if (files.answer_pdf) {
        formDataToSend.append('answer_pdf', files.answer_pdf);
      }

      const response = await axios.post(`/api/courses/${courseId}/assignments`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(() => {
          navigate(`/course/${courseId}`);
        }, 2000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-card p-8">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-white text-center">Loading course details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="text-center">
          <FileText size={64} className="mx-auto text-blue-300 mb-4 floating-icon" />
          <h1 className="text-3xl font-bold text-white mb-2">Create Assignment</h1>
          {course && (
            <p className="text-white/70">{course.course_name} ({course.course_code})</p>
          )}
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
              {/* Assignment Type */}
              <div>
                <label className="block text-white/90 font-semibold mb-3">
                  <Tag size={18} className="inline mr-2" />
                  Type <span className="text-red-400">*</span>
                </label>
                <select
                  name="event_type"
                  value={formData.event_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  required
                >
                  <option value="" className="bg-gray-800">Choose type</option>
                  <option value="assignment" className="bg-gray-800">Assignment</option>
                  <option value="quiz" className="bg-gray-800">Quiz</option>
                  <option value="exam" className="bg-gray-800">Exam</option>
                  <option value="project" className="bg-gray-800">Project</option>
                </select>
              </div>

              {/* Assignment Name */}
              <div>
                <label className="block text-white/90 font-semibold mb-3">
                  <FileText size={18} className="inline mr-2" />
                  Assignment Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="assignment_name"
                  value={formData.assignment_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  placeholder="e.g., Midterm Exam, Lab Assignment 1"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-white/90 font-semibold mb-3">
                  <FileText size={18} className="inline mr-2" />
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all resize-none"
                  placeholder="Provide detailed instructions, learning objectives, and any special requirements..."
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-white/90 font-semibold mb-3">
                  <Calendar size={18} className="inline mr-2" />
                  Deadline <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                  required
                />
                <p className="text-white/60 text-sm mt-2">
                  Students won't be able to submit after this date and time
                </p>
              </div>

              {/* File Uploads */}
              <div className="glass-card bg-white/5">
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-bold text-white flex items-center">
                    <Upload className="mr-2" size={20} />
                    File Uploads
                  </h3>
                </div>
                <div className="p-6 space-y-6">
                  {/* Instructions PDF */}
                  <div>
                    <label className="block text-white/90 font-semibold mb-3">
                      <FileText size={18} className="inline mr-2" />
                      Instructions PDF 
                      <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs ml-2">Required</span>
                    </label>
                    <input
                      type="file"
                      name="instructions_pdf"
                      onChange={handleFileChange}
                      accept=".pdf"
                      className="w-full"
                      required
                    />
                    <p className="text-white/60 text-sm mt-2">
                      Upload the PDF containing questions and instructions for students
                    </p>
                    {files.instructions_pdf && (
                      <p className="text-green-300 text-sm mt-2 flex items-center">
                        <CheckCircle size={16} className="mr-1" />
                        {files.instructions_pdf.name}
                      </p>
                    )}
                  </div>

                  {/* Answer Key PDF */}
                  <div>
                    <label className="block text-white/90 font-semibold mb-3">
                      <Key size={18} className="inline mr-2" />
                      Answer Key PDF 
                      <span className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded text-xs ml-2">Optional</span>
                    </label>
                    <input
                      type="file"
                      name="answer_pdf"
                      onChange={handleFileChange}
                      accept=".pdf"
                      className="w-full"
                    />
                    <p className="text-white/60 text-sm mt-2">
                      Upload the answer key for automatic grading (students won't see this)
                    </p>
                    {files.answer_pdf && (
                      <p className="text-green-300 text-sm mt-2 flex items-center">
                        <CheckCircle size={16} className="mr-1" />
                        {files.answer_pdf.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full primary-button flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="loading"></div>
                      <span>Creating Assignment...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Create Assignment</span>
                    </>
                  )}
                </button>

                <Link
                  to={`/course/${courseId}`}
                  className="w-full glass-button flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={18} />
                  <span>Back to Course</span>
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
                <AlertCircle className="mr-2" size={20} />
                Assignment Creation Tips
              </h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-3">
                <FileText className="text-blue-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">PDF Quality</h4>
                  <p className="text-white/60 text-sm">Ensure PDFs are clear and readable for OCR processing</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Deadline Buffer</h4>
                  <p className="text-white/60 text-sm">Set deadlines with some buffer time for technical issues</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Cpu className="text-green-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Auto Grading</h4>
                  <p className="text-white/60 text-sm">Answer keys enable automatic grading and feedback</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <CheckCircle className="text-purple-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-semibold text-white">Clear Instructions</h4>
                  <p className="text-white/60 text-sm">Detailed descriptions help students understand expectations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateAssignment;