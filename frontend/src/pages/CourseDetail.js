import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI, enrollmentsAPI, paymentAPI } from '../services/api';
import { getCourseThumbnail } from '../utils/courseThumbs';
import PaymentModal from '../components/PaymentModal';
import { ArrowLeft, Clock, Users, Award, CheckCircle, Calendar, BookOpen, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course,   setCourse]   = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [order,    setOrder]    = useState(null);   // triggers modal
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([coursesAPI.getById(id), enrollmentsAPI.my()])
      .then(([cRes, myRes]) => {
        setCourse(cRes.data);
        setEnrolled(myRes.data.some(e => e.course_id === parseInt(id)));
      })
      .catch(() => toast.error('Failed to load course.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Called when user clicks "Enroll / Pay"
  const handleEnrollClick = async () => {
    setCreating(true);
    try {
      const res = await paymentAPI.createOrder(parseInt(id));
      setOrder(res.data.order);          // opens modal
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not start checkout.');
    } finally { setCreating(false); }
  };

  if (loading) return <div className="page"><div className="skeleton-detail"/></div>;
  if (!course) return <div className="page"><div className="empty-state"><p>Course not found.</p></div></div>;

  const spotsLeft  = course.max_students - (course.enrolled_count || 0);
  const levelColor = { beginner: 'green', intermediate: 'blue', advanced: 'red' };
  const thumb      = getCourseThumbnail(course.title, course.id);
  const isFree     = parseFloat(course.price) === 0;

  return (
    <div className="page">
      <button className="back-btn" onClick={() => navigate(-1)}><ArrowLeft size={15}/> Back to courses</button>

      <div className="detail-layout">
        <div className="detail-main">
          {/* Hero */}
          <div className="detail-hero">
            {thumb.type === 'image'
              ? <img src={thumb.url} alt={course.title}/>
              : <div style={{ width:'100%',height:'100%',background:`linear-gradient(135deg,${thumb.from},${thumb.to})`,display:'flex',alignItems:'center',justifyContent:'center' }}><BookOpen size={52} style={{ color:'rgba(255,255,255,0.2)' }}/></div>}
            <div className="detail-hero-overlay"/>
            <div className="detail-hero-pills">
              <span className={`level-pill ${levelColor[course.level]||'blue'}`}>{course.level}</span>
              {course.category_name && <span className="cat-pill">{course.category_name}</span>}
            </div>
          </div>

          <h1 className="detail-title">{course.title}</h1>
          <p className="detail-instructor">Taught by <strong style={{ color:'var(--t1)' }}>{course.instructor_name || 'Institute Staff'}</strong></p>
          <p className="detail-desc">{course.description}</p>
          {course.syllabus     && <div className="detail-section"><h3>📋 Syllabus</h3><p>{course.syllabus}</p></div>}
          {course.prerequisites && <div className="detail-section"><h3>⚡ Prerequisites</h3><p>{course.prerequisites}</p></div>}
        </div>

        {/* Enroll sidebar */}
        <aside className="detail-sidebar">
          <div className="enroll-card">
            <div className="enroll-price">
              {isFree ? <span className="price-free">Free</span>
                      : <span className="price-paid">${parseFloat(course.price).toFixed(2)}</span>}
            </div>
            <div className="enroll-stats">
              <div className="e-stat"><Users size={15}/><span><strong style={{ color:'var(--t1)' }}>{course.enrolled_count||0}</strong> enrolled</span></div>
              <div className="e-stat"><Award size={15}/><span><strong style={{ color:'var(--t1)' }}>{spotsLeft}</strong> spots left</span></div>
              {course.duration_hours && <div className="e-stat"><Clock size={15}/><span><strong style={{ color:'var(--t1)' }}>{course.duration_hours}h</strong> content</span></div>}
            </div>
            <div className="enroll-dates">
              <div className="e-date"><Calendar size={13}/> Starts <strong style={{ color:'var(--t1)',marginLeft:4 }}>{new Date(course.start_date).toLocaleDateString()}</strong></div>
              <div className="e-date"><Calendar size={13}/> Ends <strong style={{ color:'var(--t1)',marginLeft:4 }}>{new Date(course.end_date).toLocaleDateString()}</strong></div>
            </div>

            {enrolled ? (
              <div className="enrolled-badge"><CheckCircle size={18}/> You're enrolled!</div>
            ) : (
              <button className="btn-primary full enroll-cta" onClick={handleEnrollClick}
                disabled={creating || spotsLeft <= 0}>
                {creating ? 'Preparing checkout…'
                  : spotsLeft <= 0 ? 'Course Full'
                  : isFree ? 'Enroll for Free →'
                  : <><CreditCard size={15}/> Pay & Enroll — ${parseFloat(course.price).toFixed(2)}</>}
              </button>
            )}
            {spotsLeft <= 5 && spotsLeft > 0 && !enrolled && (
              <p className="spots-warn">⚡ Only {spotsLeft} spot{spotsLeft>1?'s':''} left!</p>
            )}

            {/* What's included */}
            {!enrolled && (
              <div style={{ marginTop: 16, padding: '12px 0', borderTop: '1px solid var(--b1)' }}>
                {[
                  'Lifetime access to course materials',
                  'Certificate on completion',
                  'Track progress on your dashboard',
                  isFree ? 'Completely free — no card needed' : '30-day money-back guarantee',
                ].map((t,i) => (
                  <div key={i} style={{ display:'flex',alignItems:'center',gap:8,padding:'5px 0',fontSize:12.5,color:'var(--t2)' }}>
                    <CheckCircle size={13} style={{ color:'var(--mint)',flexShrink:0 }}/>{t}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Payment Modal */}
      {order && (
        <PaymentModal
          order={order}
          onClose={() => setOrder(null)}
          onSuccess={() => { setEnrolled(true); navigate('/my-courses'); }}
        />
      )}
    </div>
  );
}
