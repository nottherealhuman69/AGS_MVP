import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText, ArrowLeft, Eye, Upload, Calendar, Book, Clock, CheckCircle, AlertTriangle, Users, Cpu, Star, MessageCircle, Filter } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import Alert from '../components/Alert';

function AssignmentDetails() {
  const { assignmentId } = useParams();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [submissionFilter, setSubmissionFilter] = useState('all');

  useEffect(() => {
    fetchAssignmentDetails();
  }, [assignmentId]);

  const fetchAssignmentDetails = async () => {
    try {
      const response = await axios.get(`/api/assignments/${assignmentId}`);
      setAssignment(response.data.assignment);
      setSubmission(response.data.submission);
      setSubmissions(response.data.submissions || []);
    } catch (error) {
      setError('Failed to load assignment details');
      console.error('Error fetching assignment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        setError('File size must be less than 16MB');
        e.target.value = '';
        return;
      }
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Please upload only PDF files');
        e.target.value = '';
        return;
      }
      setSubmissionFile(file);
      setError('');
    }
  };

  const handleSubmission = async (e) => {
    e.preventDefault();
    if (!submissionFile) {
      setError('Please select a file to upload');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('submission_file', submissionFile);

      const response = await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setShowSubmissionModal(false);
        setSubmissionFile(null);
        // Refresh assignment details to show new submission
        await fetchAssignmentDetails();
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const getAssignmentTypeColor = (type) => {
    switch (type) {
      case 'assignment': return 'bg-blue-500/20 text-blue-300';
      case 'quiz': return 'bg-green-500/20 text-green-300';
      case 'exam': return 'bg-red-500/20 text-red-300';
      case 'project': return 'bg-purple-500/20 text-purple-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const isDeadlinePassed = () => {
    if (!assignment?.deadline) return false;
    return new Date(assignment.deadline) < new Date();
  };

  const canViewGrades = () => {
    if (user?.user_type === 'professor') return true;
    if (!assignment?.deadline) return true;
    return new Date(assignment.deadline) < new Date();
  };

  const getFilteredSubmissions = () => {
    if (submissionFilter === 'all') return submissions;
    return submissions.filter(sub => sub.grading_status === submissionFilter);
  };

  const getGradingStatusCounts = () => {
    return {
      completed: submissions.filter(s => s.grading_status === 'completed').length,
      pending: submissions.filter(s => s.grading_status === 'pending').length,
      failed: submissions.filter(s => s.grading_status === 'failed').length
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="glass-card p-8">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-white text-center">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (error && !assignment) {
    return (
      <div className="max-w-4xl mx-auto">
        <Alert type="error" message={error} />
      </div>
    );
  }

  const statusCounts = getGradingStatusCounts();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Assignment Header */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAssignmentTypeColor(assignment?.event_type)}`}>
                {assignment?.event_type?.charAt(0).toUpperCase() + assignment?.event_type?.slice(1)}
              </span>
              {assignment?.deadline && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isDeadlinePassed() ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                }`}>
                  {isDeadlinePassed() ? 'Closed' : 'Open'}
                </span>
              )}
              {(assignment?.answer_text || assignment?.instructions_text) && (
                <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Cpu className="mr-1" size={14} />
                  AI Grading
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-white flex items-center mb-3">
              <FileText className="mr-3 text-blue-300" size={36} />
              {assignment?.event_name}
            </h1>

            <div className="flex items-center space-x-4 text-white/70">
              <span className="flex items-center">
                <Book className="mr-1" size={16} />
                {assignment?.course_name}
              </span>
              {assignment?.deadline && (
                <span className="flex items-center">
                  <Calendar className="mr-1" size={16} />
                  Due: {new Date(assignment.deadline).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to={`/course/${assignment?.course_id}`}
              className="glass-button flex items-center space-x-2"
            >
              <ArrowLeft size={18} />
              <span>Back to Course</span>
            </Link>
            {assignment?.instructions_text && (
              <button
                onClick={() => setShowInstructions(true)}
                className="primary-button flex items-center space-x-2"
              >
                <Eye size={18} />
                <span>View Instructions</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" message={error} onClose={() => setError('')} />
      )}

      {/* Assignment Description */}
      {assignment?.description && (
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <FileText className="mr-2" size={20} />
            Description
          </h3>
          <p className="text-white/80 whitespace-pre-wrap">{assignment.description}</p>
        </div>
      )}

      {/* Files and Submission Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instructions Section */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <FileText className="mr-2" size={20} />
            Instructions
          </h3>
          <div className="text-center">
            {assignment?.instructions_text ? (
              <>
                <FileText size={48} className="mx-auto text-blue-400 mb-4" />
                <h4 className="font-semibold text-white mb-2">Instructions Available</h4>
                <p className="text-white/60 mb-4">Contains questions and requirements</p>
                <button
                  onClick={() => setShowInstructions(true)}
                  className="primary-button flex items-center space-x-2 mx-auto"
                >
                  <Eye size={16} />
                  <span>View Instructions</span>
                </button>
              </>
            ) : (
              <>
                <FileText size={48} className="mx-auto text-white/30 mb-4" />
                <h4 className="text-white/60 mb-2">No instructions file</h4>
                <p className="text-white/40">Instructions are in the description above</p>
              </>
            )}
          </div>
        </div>

        {/* Submission/Answer Key Section */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            {user?.user_type === 'professor' ? (
              <>
                <FileText className="mr-2" size={20} />
                Answer Key
              </>
            ) : (
              <>
                <Upload className="mr-2" size={20} />
                Your Submission
              </>
            )}
          </h3>
          
          <div className="text-center">
            {user?.user_type === 'professor' ? (
              /* Professor View - Answer Key */
              assignment?.answer_text ? (
                <>
                  <FileText size={48} className="mx-auto text-green-400 mb-4" />
                  <h4 className="font-semibold text-white mb-2">Answer Key Available</h4>
                  <p className="text-white/60 mb-4">Used for automatic grading</p>
                  <button
                    onClick={() => setShowAnswerKey(true)}
                    className="bg-green-500/20 text-green-300 px-4 py-2 rounded-lg font-medium hover:bg-green-500/30 transition-colors flex items-center space-x-2 mx-auto"
                  >
                    <Eye size={16} />
                    <span>View Answer Key</span>
                  </button>
                </>
              ) : (
                <>
                  <FileText size={48} className="mx-auto text-white/30 mb-4" />
                  <h4 className="text-white/60 mb-2">No answer key</h4>
                  <p className="text-white/40">Manual grading required</p>
                </>
              )
            ) : (
              /* Student View - Submission */
              submission ? (
                <div className="space-y-4">
                  <CheckCircle size={48} className="mx-auto text-green-400 mb-4" />
                  <h4 className="font-semibold text-white mb-2">Submitted</h4>
                  <p className="text-white/60 mb-4">
                    Submitted on {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Unknown date'}
                  </p>

                  {/* Grading Status Display */}
                  {submission.grading_status === 'completed' && submission.grade !== null ? (
                    canViewGrades() ? (
                      <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center justify-center mb-2">
                          <Cpu className="mr-2" size={16} />
                          <strong className="text-green-300">AI Graded: {submission.grade}/10</strong>
                        </div>
                        {submission.graded_at && (
                          <p className="text-white/60 text-sm">
                            Graded on {new Date(submission.graded_at).toLocaleDateString()}
                          </p>
                        )}
                        {submission.feedback && (
                          <div className="mt-4">
                            <h5 className="font-semibold text-white mb-2 flex items-center">
                              <MessageCircle className="mr-1" size={16} />
                              AI Feedback:
                            </h5>
                            <div className="bg-white/10 p-3 rounded-lg text-left text-sm text-white/80 max-h-48 overflow-y-auto">
                              {submission.feedback.split('\n').map((line, index) => (
                                <p key={index} className="mb-1">{line}</p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                        <Clock className="mx-auto mb-2" size={20} />
                        <strong className="text-blue-300">Graded - Results available after deadline</strong>
                        <p className="text-white/60 text-sm mt-2">
                          Your work has been automatically graded. Results will be visible on {new Date(assignment.deadline).toLocaleString()}
                        </p>
                      </div>
                    )
                  ) : submission.grading_status === 'failed' ? (
                    <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                      <AlertTriangle className="mx-auto mb-2" size={20} />
                      <strong className="text-yellow-300">Manual Grading Required</strong>
                      <p className="text-white/60 text-sm mt-2">
                        Automatic grading failed. Your professor will grade manually.
                      </p>
                      {submission.feedback && (
                        <div className="mt-3 bg-white/10 p-3 rounded-lg text-left text-sm">
                          {submission.feedback}
                        </div>
                      )}
                    </div>
                  ) : submission.grading_status === 'pending' ? (
                    <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-center mb-2">
                        <div className="loading mr-2"></div>
                        <strong className="text-blue-300">Grading in Progress...</strong>
                      </div>
                      <p className="text-white/60 text-sm">Please refresh the page in a few moments</p>
                    </div>
                  ) : (
                    <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm">Pending Grade</span>
                  )}
                </div>
              ) : (
                /* No submission yet */
                isDeadlinePassed() ? (
                  <>
                    <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
                    <h4 className="text-red-300 font-semibold mb-2">Deadline Passed</h4>
                    <p className="text-white/60">Submission no longer allowed</p>
                  </>
                ) : (
                  <>
                    <Upload size={48} className="mx-auto text-blue-400 mb-4" />
                    <h4 className="font-semibold text-white mb-2">Upload Your Answer</h4>
                    <p className="text-white/60 mb-4">Submit your work as a PDF</p>
                    {(assignment?.answer_text || assignment?.instructions_text) && (
                      <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 mb-4">
                        <Cpu className="inline mr-2" size={16} />
                        <span className="text-purple-300 text-sm">This assignment will be automatically graded!</span>
                      </div>
                    )}
                    <button
                      onClick={() => setShowSubmissionModal(true)}
                      className="primary-button flex items-center space-x-2 mx-auto"
                    >
                      <Upload size={16} />
                      <span>Submit Assignment</span>
                    </button>
                  </>
                )
              )
            )}
          </div>
        </div>
      </div>

      {/* Professor View: Student Submissions */}
      {user?.user_type === 'professor' && (
        <div className="glass-card">
          <div className="p-6 border-b border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Users className="mr-2" size={24} />
                Student Submissions
                {submissions.length > 0 && (
                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm ml-3">
                    {submissions.length}
                  </span>
                )}
              </h3>
              {submissions.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSubmissionFilter('all')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      submissionFilter === 'all' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    All ({submissions.length})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('completed')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      submissionFilter === 'completed' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Graded ({statusCounts.completed})
                  </button>
                  <button
                    onClick={() => setSubmissionFilter('pending')}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      submissionFilter === 'pending' 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    Pending ({statusCounts.pending})
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {submissions.length > 0 ? (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Submitted</th>
                      <th>Grade</th>
                      <th>Grading Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredSubmissions().map((sub) => (
                      <tr key={sub.id}>
                        <td>
                          <strong className="text-white">{sub.username}</strong>
                        </td>
                        <td className="text-white/70">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : 'Unknown'}
                        </td>
                        <td>
                          {sub.grade !== null ? (
                            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                              {sub.grade}/10
                            </span>
                          ) : (
                            <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-medium">
                              Not Graded
                            </span>
                          )}
                        </td>
                        <td>
                          {sub.grading_status === 'completed' ? (
                            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium flex items-center w-fit">
                              <Cpu className="mr-1" size={12} />
                              AI Completed
                            </span>
                          ) : sub.grading_status === 'failed' ? (
                            <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-sm font-medium flex items-center w-fit">
                              <AlertTriangle className="mr-1" size={12} />
                              AI Failed
                            </span>
                          ) : sub.grading_status === 'pending' ? (
                            <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium flex items-center w-fit">
                              <Clock className="mr-1" size={12} />
                              Processing
                            </span>
                          ) : (
                            <span className="bg-gray-500/20 text-gray-300 px-3 py-1 rounded-full text-sm font-medium">
                              Manual Required
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setSelectedSubmission(sub)}
                              className="glass-button text-sm flex items-center space-x-1"
                              title="View Submission"
                            >
                              <Eye size={14} />
                            </button>
                            {sub.feedback && (
                              <button
                                onClick={() => setSelectedFeedback(sub)}
                                className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors flex items-center space-x-1"
                                title="View Feedback"
                              >
                                <MessageCircle size={14} />
                              </button>
                            )}
                            <button
                              className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-500/30 transition-colors flex items-center space-x-1"
                              title="Manual Override"
                            >
                              <Star size={14} />
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
                <Users size={64} className="mx-auto text-white/30 mb-4" />
                <h4 className="text-xl font-semibold text-white/70 mb-2">No submissions yet</h4>
                <p className="text-white/50">Students will see their submissions here once they upload them.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showInstructions && assignment?.instructions_text && (
        <Modal
          title="Assignment Instructions"
          onClose={() => setShowInstructions(false)}
          content={assignment.instructions_text}
        />
      )}

      {showAnswerKey && assignment?.answer_text && (
        <Modal
          title="Answer Key"
          onClose={() => setShowAnswerKey(false)}
          content={assignment.answer_text}
          isAnswerKey={true}
        />
      )}

      {selectedSubmission && (
        <Modal
          title="Student Submission"
          onClose={() => setSelectedSubmission(null)}
          content={selectedSubmission.submission_text}
        />
      )}

      {selectedFeedback && (
        <FeedbackModal
          submission={selectedFeedback}
          onClose={() => setSelectedFeedback(null)}
        />
      )}

      {/* Submission Modal for Students */}
      {showSubmissionModal && user?.user_type === 'student' && !isDeadlinePassed() && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-md w-full">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Upload className="mr-2" size={24} />
                Submit Assignment
              </h3>
            </div>
            
            <form onSubmit={handleSubmission} className="p-6 space-y-6">
              <div>
                <label className="block text-white/90 font-medium mb-3">
                  <FileText className="inline mr-2" size={18} />
                  Upload Your Answer (PDF)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="w-full"
                  required
                />
                <p className="text-white/60 text-sm mt-2">
                  Maximum file size: 16MB. Only PDF files are accepted.
                </p>
              </div>

              {(assignment?.answer_text || assignment?.instructions_text) && (
                <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-4">
                  <Cpu className="inline mr-2" size={16} />
                  <strong className="text-purple-300">AI Grading Enabled:</strong>
                  <p className="text-white/70 text-sm mt-1">
                    Your submission will be automatically graded within moments of upload. You'll receive detailed feedback and a score.
                  </p>
                </div>
              )}

              <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-4">
                <AlertTriangle className="inline mr-2" size={16} />
                <strong className="text-yellow-300">Note:</strong>
                <p className="text-white/70 text-sm mt-1">
                  Once submitted, you cannot change your submission. Make sure your PDF is complete and readable.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSubmissionModal(false)}
                  className="flex-1 glass-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !submissionFile}
                  className="flex-1 primary-button flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="loading"></div>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      <span>Submit Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Modal Component
function Modal({ title, content, onClose, isAnswerKey = false }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center">
            <FileText className="mr-2" size={24} />
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        {isAnswerKey && (
          <div className="p-4 bg-red-500/20 border-b border-red-500/30">
            <div className="flex items-center text-red-300">
              <AlertTriangle className="mr-2" size={16} />
              <strong>Confidential:</strong>
              <span className="ml-1">This answer key is not visible to students.</span>
            </div>
          </div>
        )}
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="bg-white/5 rounded-lg p-6 font-mono text-sm text-white/90 whitespace-pre-wrap">
            {content || 'No content available.'}
          </div>
        </div>
        
        <div className="p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="glass-button mx-auto block"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Feedback Modal Component
function FeedbackModal({ submission, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-4xl w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white flex items-center">
            <MessageCircle className="mr-2" size={24} />
            AI Feedback for {submission.username}
          </h3>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-white/90">
                <strong>Student:</strong> {submission.username}
              </span>
              <span className="text-white/70">
                <strong>Submitted:</strong> {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            {submission.grade !== null && (
              <div className="flex items-center space-x-2">
                <span className="text-green-300 font-semibold">Grade: {submission.grade}/10</span>
                {submission.graded_at && (
                  <span className="text-white/60 text-sm">
                    Graded: {new Date(submission.graded_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="bg-white/5 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Cpu className="mr-2" size={20} />
              AI Generated Feedback
            </h4>
            <div className="text-white/90 whitespace-pre-wrap leading-relaxed">
              {submission.feedback || 'No feedback available.'}
            </div>
          </div>
          
          {/* Grading Status Info */}
          <div className="mt-6 p-4 bg-white/5 rounded-lg">
            <h5 className="font-semibold text-white mb-2">Grading Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-white/60">Status:</span>
                <div className="mt-1">
                  {submission.grading_status === 'completed' ? (
                    <span className="bg-green-500/20 text-green-300 px-2 py-1 rounded text-xs">
                      AI Completed
                    </span>
                  ) : submission.grading_status === 'failed' ? (
                    <span className="bg-red-500/20 text-red-300 px-2 py-1 rounded text-xs">
                      AI Failed
                    </span>
                  ) : (
                    <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-xs">
                      Processing
                    </span>
                  )}
                </div>
              </div>
              <div>
                <span className="text-white/60">Submission Length:</span>
                <div className="text-white/90 mt-1">
                  {submission.submission_text ? `${submission.submission_text.length} characters` : 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-white/60">Feedback Length:</span>
                <div className="text-white/90 mt-1">
                  {submission.feedback ? `${submission.feedback.length} characters` : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t border-white/10 flex justify-between items-center">
          <div className="flex space-x-3">
            <button
              onClick={() => setSelectedSubmission(submission)}
              className="glass-button flex items-center space-x-2"
            >
              <Eye size={16} />
              <span>View Submission</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="primary-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignmentDetails;