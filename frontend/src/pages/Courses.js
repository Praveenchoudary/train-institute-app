import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { coursesAPI } from '../services/api';
import CourseThumbnail from '../components/CourseThumbnail';
import { Search, SlidersHorizontal, Users, Clock, ChevronRight } from 'lucide-react';

const LEVELS = ['All', 'beginner', 'intermediate', 'advanced'];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [page, setPage] = useState(1);
  const LIMIT = 12;

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (search) params.search = search;
    if (level !== 'All') params.level = level;
    coursesAPI.getAll(params)
      .then(r => { setCourses(r.data.courses); setTotal(r.data.total); })
      .finally(() => setLoading(false));
  }, [search, level, page]);

  const levelColor = { beginner: 'green', intermediate: 'blue', advanced: 'red' };
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Course Catalog</h1>
        <p className="page-sub">{total} course{total !== 1 ? 's' : ''} available — find your perfect fit</p>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <Search size={15}/>
          <input placeholder="Search courses, topics, skills…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}/>
        </div>
        <div className="level-chips">
          <SlidersHorizontal size={14} style={{ color: 'var(--t3)' }}/>
          {LEVELS.map(l => (
            <button key={l} className={`chip ${level === l ? 'active' : ''}`}
              onClick={() => { setLevel(l); setPage(1); }}>
              {l === 'All' ? 'All levels' : l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="courses-grid">{Array(6).fill(0).map((_, i) => <div key={i} className="course-card skeleton-card"/>)}</div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <Search size={40}/>
          <h3>No courses found</h3>
          <p>Try a different search term or remove the level filter.</p>
        </div>
      ) : (
        <>
          <div className="courses-grid">
            {courses.map(c => {
              const spots = c.max_students - (c.enrolled_count || 0);
              return (
                <Link to={`/courses/${c.id}`} key={c.id} className="course-card">
                  <CourseThumbnail title={c.title} courseId={c.id}/>
                  <div className="course-body">
                    <div className="course-meta-row">
                      <span className={`level-pill ${levelColor[c.level] || 'blue'}`}>{c.level}</span>
                      {c.category_name && <span className="cat-pill">{c.category_name}</span>}
                    </div>
                    <h3 className="course-title">{c.title}</h3>
                    <p className="course-desc">{c.description?.slice(0, 88)}…</p>
                    <p className="course-inst">
                      <Users size={11}/> {c.instructor_name || 'Institute Staff'}
                    </p>
                    <div className="course-footer-row">
                      <div className="course-stats-row">
                        <span><Users size={11}/> {c.enrolled_count || 0}/{c.max_students}</span>
                        {c.duration_hours && <span><Clock size={11}/> {c.duration_hours}h</span>}
                      </div>
                      <div className="course-price-tag">
                        {parseFloat(c.price) === 0
                          ? <span className="free-tag">Free</span>
                          : `$${parseFloat(c.price).toFixed(2)}`}
                      </div>
                    </div>
                    {spots <= 5 && spots > 0 && (
                      <div className="spots-warning">⚡ Only {spots} spot{spots > 1 ? 's' : ''} left!</div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
