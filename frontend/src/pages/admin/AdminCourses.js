import { useEffect, useState } from 'react';
import { coursesAPI } from '../../services/api';
import { Plus, Edit, Trash2, Users, BookOpen } from 'lucide-react';
import CourseThumbnail from '../../components/CourseThumbnail';
import toast from 'react-hot-toast';

const EMPTY = { title: '', description: '', price: 0, maxStudents: 30,
                startDate: '', endDate: '', duration: '', level: 'beginner',
                syllabus: '', prerequisites: '' };

export default function AdminCourses() {
  const [courses,    setCourses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editing,    setEditing]    = useState(null);   // null = create, id = update
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    coursesAPI.getAll({ limit: 100 })
      .then(r  => setCourses(r.data.courses))
      .catch(() => toast.error('Failed to load courses.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit   = (c)  => {
    setEditing(c.id);
    setForm({
      title: c.title, description: c.description, price: c.price,
      maxStudents: c.max_students, startDate: c.start_date?.split('T')[0],
      endDate: c.end_date?.split('T')[0], duration: c.duration_hours || '',
      level: c.level, syllabus: c.syllabus || '', prerequisites: c.prerequisites || '',
    });
    setShowModal(true);
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) { await coursesAPI.update(editing, form); toast.success('Course updated.'); }
      else         { await coursesAPI.create(form);          toast.success('Course created.'); }
      setShowModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this course? Students keep their enrollment records.')) return;
    try { await coursesAPI.delete(id); toast.success('Course deactivated.'); load(); }
    catch { toast.error('Failed to deactivate.'); }
  };

  const levelColor = { beginner: 'green', intermediate: 'blue', advanced: 'red' };

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Manage Courses</h1>
          <p className="page-sub">{courses.length} course{courses.length !== 1 ? 's' : ''} total.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}><Plus size={15}/> New Course</button>
      </div>

      {loading ? <div className="skeleton-list"/> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Level</th><th>Enrolled</th><th>Price</th><th>Dates</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {courses.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--muted)' }}>
                  No courses yet. Click "New Course" to create one.
                </td></tr>
              )}
              {courses.map(c => (
                <tr key={c.id}>
                  <td className="td-main"><div style={{display:'flex',alignItems:'center',gap:8}}><CourseThumbnail title={c.title} courseId={c.id} height={32} className="" /><span>{c.title}</span></div></td>
                  <td><span className={`level-pill ${levelColor[c.level]||'blue'}`}>{c.level}</span></td>
                  <td><Users size={12}/> {c.enrolled_count}/{c.max_students}</td>
                  <td>{parseFloat(c.price) === 0 ? <span className="free-tag">Free</span> : `$${parseFloat(c.price).toFixed(2)}`}</td>
                  <td className="td-muted" style={{ fontSize: 12 }}>
                    {new Date(c.start_date).toLocaleDateString()} –<br/>{new Date(c.end_date).toLocaleDateString()}
                  </td>
                  <td><span className={`status-pill ${c.is_active ? 'green' : 'red'}`}>{c.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="icon-btn" onClick={() => openEdit(c)} title="Edit"><Edit size={14}/></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(c.id)} title="Deactivate"><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create / Edit Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Course' : 'Create New Course'}</h2>
            <form onSubmit={handleSave} className="modal-form">

              <div className="field">
                <label>Title *</label>
                <input value={form.title} onChange={set('title')} required placeholder="e.g. React Fundamentals"/>
              </div>

              <div className="field">
                <label>Description *</label>
                <textarea value={form.description} onChange={set('description')} required rows={3} placeholder="Describe what students will learn…"/>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Price ($) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required/>
                </div>
                <div className="field">
                  <label>Max Students *</label>
                  <input type="number" min="1" value={form.maxStudents} onChange={set('maxStudents')} required/>
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Start Date *</label>
                  <input type="date" value={form.startDate} onChange={set('startDate')} required/>
                </div>
                <div className="field">
                  <label>End Date *</label>
                  <input type="date" value={form.endDate} onChange={set('endDate')} required/>
                </div>
              </div>

              <div className="field-row">
                <div className="field">
                  <label>Level</label>
                  <select value={form.level} onChange={set('level')}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="field">
                  <label>Duration (hours)</label>
                  <input type="number" min="1" value={form.duration} onChange={set('duration')} placeholder="e.g. 40"/>
                </div>
              </div>

              <div className="field">
                <label>Syllabus <span className="optional">(optional)</span></label>
                <textarea value={form.syllabus} onChange={set('syllabus')} rows={2} placeholder="Week-by-week breakdown…"/>
              </div>

              <div className="field">
                <label>Prerequisites <span className="optional">(optional)</span></label>
                <input value={form.prerequisites} onChange={set('prerequisites')} placeholder="e.g. Basic JavaScript knowledge"/>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
