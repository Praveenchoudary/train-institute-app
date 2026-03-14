import { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { Users, BookOpen, TrendingUp, DollarSign, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.dashboard()
      .then(r  => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="skeleton-list"/></div>;
  if (!data)   return null;

  const { stats, recentEnrollments, popularCourses } = data;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Admin Overview</h1>
        <p className="page-sub">Real-time snapshot of your training institute.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={20}/></div>
          <div>
            <div className="stat-num">{stats.students.total}</div>
            <div className="stat-label">Total Students</div>
            <div className="stat-sub">{stats.students.active} active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><BookOpen size={20}/></div>
          <div>
            <div className="stat-num">{stats.courses.total}</div>
            <div className="stat-label">Total Courses</div>
            <div className="stat-sub">{stats.courses.active} active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><TrendingUp size={20}/></div>
          <div>
            <div className="stat-num">{stats.enrollments.total}</div>
            <div className="stat-label">Total Enrollments</div>
            <div className="stat-sub">{stats.enrollments.active} active</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><DollarSign size={20}/></div>
          <div>
            <div className="stat-num">${parseFloat(stats.revenue.total).toLocaleString()}</div>
            <div className="stat-label">Total Revenue</div>
          </div>
        </div>
      </div>

      <div className="admin-two-col">

        {/* Recent Enrollments */}
        <div className="admin-panel">
          <h2>Recent Enrollments</h2>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr><th>Student</th><th>Course</th><th>Date</th></tr>
              </thead>
              <tbody>
                {recentEnrollments.length === 0
                  ? <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--muted)' }}>No enrollments yet.</td></tr>
                  : recentEnrollments.map((e, i) => (
                    <tr key={i}>
                      <td>{e.first_name} {e.last_name}</td>
                      <td className="td-clip">{e.course_title}</td>
                      <td className="td-muted"><Clock size={11}/> {new Date(e.enrolled_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Popular Courses */}
        <div className="admin-panel">
          <h2>Most Popular Courses</h2>
          {popularCourses.length === 0 ? (
            <p style={{ color: 'var(--muted)', marginTop: 12 }}>No courses yet.</p>
          ) : (
            <div className="pop-list">
              {popularCourses.map((c, i) => (
                <div key={i} className="pop-item">
                  <div className="pop-rank">{i + 1}</div>
                  <div className="pop-body">
                    <div className="pop-title">{c.title}</div>
                    <div className="pop-bar-row">
                      <div className="pop-track">
                        <div className="pop-fill" style={{ width: `${Math.min(100, (c.enrollment_count / c.max_students) * 100)}%` }}/>
                      </div>
                      <span>{c.enrollment_count}/{c.max_students}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
