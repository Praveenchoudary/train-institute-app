import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Layout        from './components/Layout';
import Homepage      from './pages/Homepage';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Dashboard     from './pages/Dashboard';
import Courses       from './pages/Courses';
import CourseDetail  from './pages/CourseDetail';
import MyCourses     from './pages/MyCourses';
import PaymentHistory from './pages/PaymentHistory';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourses  from './pages/admin/AdminCourses';
import AdminStudents from './pages/admin/AdminStudents';

function Spinner() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--base)' }}>
      <div className="spinner"/>
    </div>
  );
}

function PrivateRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  if (!user)   return <Navigate to="/login" replace/>;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace/>;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner/>;
  if (user)    return <Navigate to="/dashboard" replace/>;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public homepage */}
      <Route path="/"         element={<Homepage/>}/>
      <Route path="/login"    element={<PublicRoute><Login/></PublicRoute>}/>
      <Route path="/register" element={<PublicRoute><Register/></PublicRoute>}/>

      {/* Protected — sidebar layout */}
      <Route element={<Layout/>}>
        <Route path="/dashboard"   element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
        <Route path="/courses"     element={<PrivateRoute><Courses/></PrivateRoute>}/>
        <Route path="/courses/:id" element={<PrivateRoute><CourseDetail/></PrivateRoute>}/>
        <Route path="/my-courses"  element={<PrivateRoute><MyCourses/></PrivateRoute>}/>
        <Route path="/payments"    element={<PrivateRoute><PaymentHistory/></PrivateRoute>}/>

        <Route path="/admin"          element={<PrivateRoute adminOnly><AdminDashboard/></PrivateRoute>}/>
        <Route path="/admin/courses"  element={<PrivateRoute adminOnly><AdminCourses/></PrivateRoute>}/>
        <Route path="/admin/students" element={<PrivateRoute adminOnly><AdminStudents/></PrivateRoute>}/>
      </Route>

      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes/>
        <Toaster position="top-right" toastOptions={{ duration: 3500,
          style:{ background:'var(--card)', color:'var(--t1)', border:'1px solid var(--b2)' }
        }}/>
      </BrowserRouter>
    </AuthProvider>
  );
}
