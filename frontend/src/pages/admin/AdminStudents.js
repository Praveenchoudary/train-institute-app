import { useEffect, useState, useCallback } from 'react';
import { studentsAPI, adminAPI } from '../../services/api';
import { Search, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  const load = useCallback((q = '') => {
    setLoading(true);
    studentsAPI.getAll({ search: q, limit: 100 })
      .then(r  => setStudents(r.data))
      .catch(() => toast.error('Failed to load students.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (val.length >= 2 || val === '') load(val);
  };

  const toggleUser = async (id, isActive) => {
    try {
      await adminAPI.toggleUser(id);
      setStudents(prev => prev.map(s => s.id === id ? { ...s, is_active: !isActive } : s));
      toast.success(isActive ? 'Student deactivated.' : 'Student activated.');
    } catch {
      toast.error('Failed to toggle status.');
    }
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Manage Students</h1>
          <p className="page-sub">{students.length} student{students.length !== 1 ? 's' : ''} registered.</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-wrap">
          <Search size={15}/>
          <input placeholder="Search by name, email, or enrollment number…"
            value={search} onChange={handleSearch}/>
        </div>
      </div>

      {loading ? <div className="skeleton-list"/> : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Student</th><th>Email</th><th>Enrollment #</th><th>Courses</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>
                  No students found.
                </td></tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td className="td-main">
                    <div className="avatar-sm">{s.first_name?.[0]}{s.last_name?.[0]}</div>
                    {s.first_name} {s.last_name}
                  </td>
                  <td className="td-muted">{s.email}</td>
                  <td><code className="enroll-num">{s.enrollment_number}</code></td>
                  <td>{s.courses_enrolled} enrolled</td>
                  <td className="td-muted">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td><span className={`status-pill ${s.is_active ? 'green' : 'red'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button
                      className={`icon-btn ${s.is_active ? 'danger' : 'success'}`}
                      title={s.is_active ? 'Deactivate' : 'Activate'}
                      onClick={() => toggleUser(s.id, s.is_active)}>
                      {s.is_active ? <UserX size={14}/> : <UserCheck size={14}/>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
