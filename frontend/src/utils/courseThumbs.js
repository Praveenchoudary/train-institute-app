// Course thumbnail helper — maps course keywords to Unsplash photos,
// falls back to warm branded gradients matching Biryani Dark palette.

const THUMB_MAP = [
  { keywords:['react','node','javascript','typescript'],
    url:'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&q=80' },
  { keywords:['python','data','machine learning','ai','ml'],
    url:'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=600&q=80' },
  { keywords:['docker','kubernetes','devops','cloud','aws'],
    url:'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&q=80' },
  { keywords:['security','cyber','hacking','ethical','penetration'],
    url:'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=600&q=80' },
  { keywords:['mobile','react native','flutter','ios','android'],
    url:'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&q=80' },
  { keywords:['database','sql','postgresql','postgres'],
    url:'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&q=80' },
  { keywords:['git','github','version'],
    url:'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=600&q=80' },
];

// Warm / spicy gradients for Biryani Dark theme
const GRADS = [
  ['#1e0800','#FF6B35'],  // saffron
  ['#1a0e00','#FFB830'],  // turmeric
  ['#0e0020','#8B5CF6'],  // violet
  ['#001810','#10D9A4'],  // mint
  ['#001520','#38BDF8'],  // sky
  ['#200010','#FF3366'],  // rose
  ['#1a0800','#FF8C5A'],  // light saffron
  ['#100018','#A78BFA'],  // light violet
];

export function getCourseThumbnail(title = '', courseId = 1) {
  const lower = title.toLowerCase();
  const match = THUMB_MAP.find(t => t.keywords.some(kw => lower.includes(kw)));
  if (match) return { type:'image', url:match.url };
  const idx = ((courseId - 1) % GRADS.length + GRADS.length) % GRADS.length;
  return { type:'gradient', from:GRADS[idx][0], to:GRADS[idx][1] };
}
