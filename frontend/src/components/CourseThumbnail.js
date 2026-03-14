import { BookOpen } from 'lucide-react';
import { getCourseThumbnail } from '../utils/courseThumbs';

export default function CourseThumbnail({ title, courseId, height = 160, className = '' }) {
  const thumb = getCourseThumbnail(title, courseId);
  if (thumb.type === 'image') {
    return (
      <div className={`course-thumb ${className}`} style={{ height }}>
        <img src={thumb.url} alt={title} loading="lazy" onError={e => { e.target.style.display='none'; }} />
        <div className="course-thumb-overlay"/>
        <div className="course-thumb-icon"><BookOpen size={16}/></div>
      </div>
    );
  }
  return (
    <div className={`course-thumb ${className}`} style={{ height, background: `linear-gradient(135deg, ${thumb.from}, ${thumb.to})` }}>
      <div className="course-thumb-fallback"><BookOpen size={32} style={{ color: 'rgba(255,255,255,0.3)' }}/></div>
      <div className="course-thumb-icon"><BookOpen size={16}/></div>
    </div>
  );
}
