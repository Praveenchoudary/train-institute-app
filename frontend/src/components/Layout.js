import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, BookOpen, BookMarked, CreditCard,
  Users, GraduationCap, ChevronRight, Menu, X, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';

const mainNav = [
  { to:'/dashboard',  icon:LayoutDashboard, label:'Dashboard' },
  { to:'/courses',    icon:BookOpen,         label:'Browse Courses' },
  { to:'/my-courses', icon:BookMarked,       label:'My Courses' },
  { to:'/payments',   icon:CreditCard,       label:'Payments' },
];
const adminNav = [
  { to:'/admin',          icon:LayoutDashboard, label:'Overview' },
  { to:'/admin/courses',  icon:BookOpen,         label:'Manage Courses' },
  { to:'/admin/students', icon:Users,            label:'Manage Students' },
];

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); toast.success('Signed out.'); navigate('/login'); };
  const initials = `${user?.first_name?.[0]??user?.firstName?.[0]??''}${user?.last_name?.[0]??user?.lastName?.[0]??''}`.toUpperCase();
  const fullName = `${user?.first_name??user?.firstName??''} ${user?.last_name??user?.lastName??''}`.trim();

  return (
    <div className="app-layout">
      {open && <div className="sidebar-overlay open" onClick={()=>setOpen(false)}/>}

      <aside className={`sidebar${open?' open':''}`}>
        <div className="sidebar-header">
          <div className="logo-icon"><GraduationCap size={17} color="#020209"/></div>
          <span className="logo-text">Hyderabad Education Tech</span>
          <button className="sidebar-close" onClick={()=>setOpen(false)}><X size={15}/></button>
        </div>

        <nav className="sidebar-nav">
          <span className="nav-label">Main</span>
          {mainNav.map(({to,icon:Icon,label}) => (
            <NavLink key={to} to={to} end={to==='/dashboard'}
              className={({isActive})=>`nav-item${isActive?' active':''}`}
              onClick={()=>setOpen(false)}>
              <Icon size={15}/><span>{label}</span>
              <ChevronRight size={12} className="nav-arrow"/>
            </NavLink>
          ))}
          {isAdmin && (<>
            <span className="nav-label" style={{marginTop:10}}>Admin</span>
            {adminNav.map(({to,icon:Icon,label}) => (
              <NavLink key={to} to={to} end={to==='/admin'}
                className={({isActive})=>`nav-item${isActive?' active':''}`}
                onClick={()=>setOpen(false)}>
                <Icon size={15}/><span>{label}</span>
                <ChevronRight size={12} className="nav-arrow"/>
              </NavLink>
            ))}
          </>)}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="avatar">{initials}</div>
            <div>
              <div className="user-name">{fullName}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={14}/> Sign out
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <button className="menu-btn" onClick={()=>setOpen(true)}><Menu size={20}/></button>
          <div className="topbar-right">
            <span className="topbar-greeting">
              Hey, <strong>{user?.first_name??user?.firstName}</strong> 👋
            </span>
            <div className="avatar sm">{initials}</div>
          </div>
        </header>
        <div className="page-content"><Outlet/></div>
      </div>
    </div>
  );
}
