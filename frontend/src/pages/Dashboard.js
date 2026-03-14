import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { enrollmentsAPI } from '../services/api';
import CourseThumbnail from '../components/CourseThumbnail';
import { BookOpen, Award, TrendingUp, Clock, ArrowRight, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin) { setLoading(false); return; }
    enrollmentsAPI.my().then(r => setEnrollments(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, [isAdmin]);

  const active = enrollments.filter(e => e.status === 'active');
  const completed = enrollments.filter(e => e.status === 'completed');
  const avgProg = active.length ? Math.round(active.reduce((s, e) => s + (e.progress || 0), 0) / active.length) : 0;
  const firstName = user?.first_name ?? user?.firstName ?? 'there';

  if (isAdmin) return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-sub">Manage your training institute from one place.</p>
      </div>
      <div className="quick-links">
        <Link to="/admin" className="quick-card purple">
          <TrendingUp size={20} className="quick-icon"/><span>Overview & Stats</span><ArrowRight size={16} style={{ color: 'var(--t3)' }}/>
        </Link>
        <Link to="/admin/courses" className="quick-card green">
          <BookOpen size={20} className="quick-icon"/><span>Manage Courses</span><ArrowRight size={16} style={{ color: 'var(--t3)' }}/>
        </Link>
        <Link to="/admin/students" className="quick-card blue">
          <Award size={20} className="quick-icon"/><span>Manage Students</span><ArrowRight size={16} style={{ color: 'var(--t3)' }}/>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="page">
      {/* Hero greeting */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <Sparkles size={18} style={{ color: 'var(--saffron)' }}/>
          <span style={{ color: 'var(--t2)', fontSize: 13 }}>Welcome back</span>
        </div>
        <h1 className="page-title">Hey, {firstName} 👋</h1>
        <p className="page-sub">Keep up the momentum — you're doing great.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><BookOpen size={20}/></div>
          <div><div className="stat-num">{active.length}</div><div className="stat-label">Active courses</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Award size={20}/></div>
          <div><div className="stat-num">{completed.length}</div><div className="stat-label">Completed</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><TrendingUp size={20}/></div>
          <div><div className="stat-num">{avgProg}%</div><div className="stat-label">Avg progress</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Clock size={20}/></div>
          <div><div className="stat-num">{enrollments.length}</div><div className="stat-label">Total enrolled</div></div>
        </div>
      </div>

      <div className="section">
        <div className="section-header">
          <h2>Continue learning</h2>
          <Link to="/my-courses" className="see-all">See all <ArrowRight size={14}/></Link>
        </div>

        {loading ? <div className="skeleton-cards"/> :
         active.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: 36 }}>
            <BookOpen size={40}/>
            <h3>No active courses yet</h3>
            <p>Browse the catalog and start learning today.</p>
            <Link to="/courses" className="btn-primary" style={{ marginTop: 4 }}>Browse courses →</Link>
          </div>
        ) : (
          <div className="course-cards-grid">
            {active.slice(0, 3).map(e => (
              <Link to={`/courses/${e.course_id}`} key={e.id} className="progress-card">
                <div className="pc-thumb">
                  <CourseThumbnail title={e.title} courseId={e.course_id} height={90}/>
                </div>
                <div className="pc-body">
                  <div className="pc-top">
                    <span className="category-pill">{e.category || 'Course'}</span>
                    <span className={`level-pill ${e.level === 'beginner' ? 'green' : e.level === 'advanced' ? 'red' : 'blue'}`}>{e.level}</span>
                  </div>
                  <h3>{e.title}</h3>
                  <p className="pc-instructor">by {e.instructor_name || 'Institute Staff'}</p>
                  <div className="progress-row">
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${e.progress || 0}%` }}/></div>
                    <span className="progress-pct">{e.progress || 0}%</span>
                  </div>
                  <div className="pc-date"><Clock size={11}/> Ends {new Date(e.end_date).toLocaleDateString()}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
