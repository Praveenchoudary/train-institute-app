import { useEffect, useState } from 'react';
import { enrollmentsAPI } from '../services/api';
import CourseThumbnail from '../components/CourseThumbnail';
import { BookOpen, Clock, Award, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_META = {
  active:    { icon: <TrendingUp size={12}/>,  color: 'blue',  label: 'In progress' },
  completed: { icon: <CheckCircle size={12}/>, color: 'green', label: 'Completed' },
  cancelled: { icon: <XCircle size={12}/>,     color: 'red',   label: 'Cancelled' },
};

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    enrollmentsAPI.my().then(r => setEnrollments(r.data))
      .catch(() => toast.error('Failed to load enrollments.')).finally(() => setLoading(false));
  }, []);

  const handleUnenroll = async (id) => {
    if (!window.confirm('Unenroll from this course?')) return;
    try {
      await enrollmentsAPI.unenroll(id);
      setEnrollments(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' } : e));
      toast.success('Unenrolled.');
    } catch { toast.error('Failed to unenroll.'); }
  };

  const filtered = enrollments.filter(e => e.status === tab);
  const counts = Object.fromEntries(['active','completed','cancelled'].map(s => [s, enrollments.filter(e => e.status === s).length]));

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">My Courses</h1>
        <p className="page-sub">{enrollments.length} total enrollment{enrollments.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="tab-bar">
        {['active','completed','cancelled'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {STATUS_META[t].label}<span className="tab-count">{counts[t]}</span>
          </button>
        ))}
      </div>

      {loading ? <div className="skeleton-list"/> : filtered.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={40}/><h3>No {STATUS_META[tab].label.toLowerCase()} courses</h3>
          <p>{tab === 'active' ? 'Browse the catalog to start learning.' : `No ${tab} courses yet.`}</p>
        </div>
      ) : (
        <div className="enroll-list">
          {filtered.map(e => {
            const meta = STATUS_META[e.status];
            return (
              <div key={e.id} className="enroll-item">
                <div className="ei-thumb">
                  <CourseThumbnail title={e.title} courseId={e.course_id} height="100%"/>
                </div>
                <div className="ei-body">
                  <div className="ei-top">
                    <h3>{e.title}</h3>
                    <span className={`status-pill ${meta.color}`}>{meta.icon} {meta.label}</span>
                  </div>
                  <p className="ei-inst">by {e.instructor_name || 'Institute Staff'}</p>
                  <div className="ei-meta">
                    {e.category && <span>{e.category}</span>}
                    <span><Clock size={11}/> {new Date(e.start_date).toLocaleDateString()} – {new Date(e.end_date).toLocaleDateString()}</span>
                    {e.grade && <span><Award size={11}/> Grade: <strong>{e.grade}</strong></span>}
                  </div>
                  {e.status === 'active' && (
                    <div className="ei-footer">
                      <div className="progress-row" style={{ flex: 1 }}>
                        <div className="progress-track"><div className="progress-fill" style={{ width: `${e.progress || 0}%` }}/></div>
                        <span className="progress-pct">{e.progress || 0}%</span>
                      </div>
                      <button className="unenroll-btn" onClick={() => handleUnenroll(e.id)}>Unenroll</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
