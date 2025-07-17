import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfessorDashboard from './pages/ProfessorDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CreateCourse from './pages/CreateCourse';
import EnrollCourse from './pages/EnrollCourse';
import CourseDetails from './pages/CourseDetails';
import CreateAssignment from './pages/CreateAssignment';
import ViewStudents from './pages/ViewStudents';
import AssignmentDetails from './pages/AssignmentDetails';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-purple-800">
          {/* Animated background */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full blur-xl animate-pulse-slow"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-xl animate-float"></div>
          </div>
          
          <div className="relative z-10">
            <AppContent />
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8">
          <div className="loading mx-auto mb-4"></div>
          <p className="text-white text-center">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user && <Navbar />}
      <div className="container mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          
          {/* Protected Routes */}
          <Route path="/" element={
            user ? (
              user.user_type === 'professor' ? 
                <Navigate to="/professor/dashboard" /> : 
                <Navigate to="/student/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          } />
          
          <Route path="/professor/dashboard" element={
            user?.user_type === 'professor' ? <ProfessorDashboard /> : <Navigate to="/login" />
          } />
          
          <Route path="/student/dashboard" element={
            user?.user_type === 'student' ? <StudentDashboard /> : <Navigate to="/login" />
          } />
          
          <Route path="/create-course" element={
            user?.user_type === 'professor' ? <CreateCourse /> : <Navigate to="/login" />
          } />
          
          <Route path="/enroll-course" element={
            user?.user_type === 'student' ? <EnrollCourse /> : <Navigate to="/login" />
          } />
          
          <Route path="/course/:courseId" element={
            user ? <CourseDetails /> : <Navigate to="/login" />
          } />
          
          <Route path="/course/:courseId/create-assignment" element={
            user?.user_type === 'professor' ? <CreateAssignment /> : <Navigate to="/login" />
          } />

          <Route path="/course/:courseId/students" element={
            user?.user_type === 'professor' ? <ViewStudents /> : <Navigate to="/login" />
          } />
          
          <Route path="/assignment/:assignmentId" element={
            user ? <AssignmentDetails /> : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </>
  );
}

export default App;