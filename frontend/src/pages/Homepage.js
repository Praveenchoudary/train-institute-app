// ══════════════════════════════════════════════════════════════════
//  Homepage.js — Public landing page
//  Inspired by professional EdTech sites (NareshIT style):
//  • Full-width top navbar
//  • Auto-rotating hero banner with slides
//  • Colorful course category cards
//  • Stats strip
//  • Features section
//  • Footer with CTA
// ══════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ChevronLeft, ChevronRight, BookOpen, Users,
         Award, Clock, Star, ArrowRight, CheckCircle, Phone, Mail,
         MapPin, Youtube, Linkedin, Instagram, Menu, X, Zap,
         TrendingUp, Code, Database, Shield, Cloud, Smartphone } from 'lucide-react';

// ── Hero slides ───────────────────────────────────────────────────
const SLIDES = [
  {
    bg: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    accent: '#FF6B35',
    tag: '🔥 New Batch Starting Soon',
    title: 'Learn DevOps &\nMulti-Cloud',
    sub: 'Classroom & Online Training in Hyderabad',
    cta: 'Enroll Now',
    img: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=500&q=80',
  },
  {
    bg: 'linear-gradient(135deg, #11998e, #38ef7d, #11998e)',
    accent: '#FFB830',
    tag: '⭐ Most Popular Course',
    title: 'Full Stack\nWeb Development',
    sub: 'React, Node.js, PostgreSQL — from zero to deployed',
    cta: 'Start Learning',
    img: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=500&q=80',
  },
  {
    bg: 'linear-gradient(135deg, #141e30, #243b55)',
    accent: '#8B5CF6',
    tag: '🤖 AI-Powered Curriculum',
    title: 'Data Science &\nMachine Learning',
    sub: 'Python, TensorFlow, real datasets — industry-ready skills',
    cta: 'Explore Course',
    img: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=500&q=80',
  },
  {
    bg: 'linear-gradient(135deg, #1a1a2e, #e94560)',
    accent: '#10D9A4',
    tag: '🛡️ High Demand Skills',
    title: 'Ethical Hacking &\nCybersecurity',
    sub: 'Learn to protect systems — CEH-aligned curriculum',
    cta: 'Join Batch',
    img: 'https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=500&q=80',
  },
];

// ── Course categories ─────────────────────────────────────────────
const CATEGORIES = [
  { icon: Code,       label: 'Web Development',  count: '3 Courses', color: '#FF6B35', bg: 'rgba(255,107,53,.12)' },
  { icon: Database,   label: 'Data Science',      count: '2 Courses', color: '#10D9A4', bg: 'rgba(16,217,164,.12)' },
  { icon: Cloud,      label: 'Cloud & DevOps',    count: '2 Courses', color: '#38BDF8', bg: 'rgba(56,189,248,.12)' },
  { icon: Shield,     label: 'Cybersecurity',     count: '1 Course',  color: '#8B5CF6', bg: 'rgba(139,92,246,.12)' },
  { icon: Smartphone, label: 'Mobile Dev',        count: '1 Course',  color: '#FFB830', bg: 'rgba(255,184,48,.12)' },
  { icon: Database,   label: 'Database Design',   count: '1 Course',  color: '#FF3366', bg: 'rgba(255,51,102,.12)' },
];

// ── Stats ─────────────────────────────────────────────────────────
const STATS = [
  { val: '1,200+', lbl: 'Students Trained' },
  { val: '10+',    lbl: 'Expert Courses' },
  { val: '15+',    lbl: 'Industry Trainers' },
  { val: '94%',    lbl: 'Placement Rate' },
  { val: '4.9★',   lbl: 'Average Rating' },
];

// ── Why choose us ─────────────────────────────────────────────────
const WHY = [
  { icon: Users,      title: 'Expert Faculty',        desc: 'Learn from working professionals with 10+ years of real-world industry experience.' },
  { icon: Zap,        title: 'Hands-on Projects',     desc: 'Every course includes live projects and assignments that mirror actual workplace tasks.' },
  { icon: Award,      title: 'Placement Support',     desc: 'Dedicated placement cell with 200+ hiring partners across Hyderabad and beyond.' },
  { icon: Clock,      title: 'Flexible Batches',      desc: 'Morning, evening, and weekend batches. Online and classroom options available.' },
  { icon: TrendingUp, title: 'Industry Curriculum',   desc: 'Updated every quarter based on the latest tech trends and employer requirements.' },
  { icon: Star,       title: 'Lifetime Access',       desc: 'Course materials, recordings and community access remain yours after course completion.' },
];

// ── Testimonials ──────────────────────────────────────────────────
const TESTIMONIALS = [
  { name: 'Sai Teja', role: 'Software Engineer @ TCS', avatar: 'ST', rating: 5, text: 'The DevOps course was outstanding. Real-world labs, expert faculty, and placement support that actually works. Got placed within 3 months.' },
  { name: 'Priya Reddy', role: 'Data Analyst @ Infosys', avatar: 'PR', rating: 5, text: 'Coming from a non-tech background, I was nervous. The Data Science course was well-paced and the mentors were incredibly patient and helpful.' },
  { name: 'Rahul Kumar', role: 'Full Stack Dev @ Wipro', avatar: 'RK', rating: 5, text: 'Best investment I made in my career. The Full Stack course covered everything from basics to deployment. Highly recommend!' },
];

// ── Nav links ─────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Home',     to: '/' },
  { label: 'Courses',  to: '/login' },
  { label: 'About',    to: '#about' },
  { label: 'Contact',  to: '#contact' },
];

export default function Homepage() {
  const [slide, setSlide]     = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const timerRef = useRef(null);

  const startTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setSlide(s => (s + 1) % SLIDES.length), 5000);
  };
  useEffect(() => { startTimer(); return () => clearInterval(timerRef.current); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const goSlide = dir => {
    setSlide(s => (s + dir + SLIDES.length) % SLIDES.length);
    startTimer();
  };

  const S = SLIDES[slide];

  return (
    <div style={css.page}>

      {/* ══ NAVBAR ═══════════════════════════════════════════════ */}
      <nav style={{ ...css.nav, ...(scrolled ? css.navScrolled : {}) }}>
        <div style={css.navInner}>
          {/* Logo */}
          <Link to="/" style={css.navLogo}>
            <div style={css.navLogoIcon}><GraduationCap size={18} color="#020209"/></div>
            <div>
              <div style={css.navLogoName}>Hyderabad Education Tech</div>
              <div style={css.navLogoSub}>ISO 9001:2015 Certified</div>
            </div>
          </Link>

          {/* Desktop links */}
          <div style={css.navLinks}>
            {NAV_LINKS.map(l => (
              <Link key={l.label} to={l.to} style={css.navLink}>{l.label}</Link>
            ))}
          </div>

          {/* CTA buttons */}
          <div style={css.navCtas}>
            <Link to="/login"    style={css.navLogin}>Sign In</Link>
            <Link to="/register" style={css.navRegister}>Register Free</Link>
          </div>

          {/* Mobile burger */}
          <button style={css.burger} onClick={() => setNavOpen(v => !v)}>
            {navOpen ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>

        {/* Mobile menu */}
        {navOpen && (
          <div style={css.mobileMenu}>
            {NAV_LINKS.map(l => (
              <Link key={l.label} to={l.to} style={css.mobileLink}
                onClick={() => setNavOpen(false)}>{l.label}</Link>
            ))}
            <Link to="/login"    style={{ ...css.mobileLink, color:'var(--saffron)' }}
              onClick={() => setNavOpen(false)}>Sign In</Link>
            <Link to="/register" style={css.navRegister}
              onClick={() => setNavOpen(false)}>Register Free</Link>
          </div>
        )}
      </nav>

      {/* ══ HERO BANNER ══════════════════════════════════════════ */}
      <section style={{ ...css.hero, background: S.bg }}>
        {/* Slide content */}
        <div style={css.heroLeft}>
          <div style={{ ...css.heroTag, borderColor: S.accent, color: S.accent,
            background: `${S.accent}18` }}>{S.tag}</div>
          <h1 style={css.heroTitle}>
            {S.title.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br/>}</span>
            ))}
          </h1>
          <p style={css.heroSub}>{S.sub}</p>
          <div style={css.heroBtns}>
            <Link to="/register" style={{ ...css.heroCta, background: S.accent,
              boxShadow: `0 4px 20px ${S.accent}50` }}>
              {S.cta} <ArrowRight size={16}/>
            </Link>
            <Link to="/login" style={css.heroSecondary}>View All Courses</Link>
          </div>
        </div>

        {/* Hero image */}
        <div style={css.heroRight}>
          <div style={css.heroImgBox}>
            <img key={slide} src={S.img} alt="" style={css.heroImg}/>
            <div style={{ ...css.heroImgGlow, background: S.accent }}/>
          </div>
        </div>

        {/* Prev / Next */}
        <button style={{ ...css.slideBtn, left: 16 }} onClick={() => goSlide(-1)}>
          <ChevronLeft size={20}/>
        </button>
        <button style={{ ...css.slideBtn, right: 16 }} onClick={() => goSlide(1)}>
          <ChevronRight size={20}/>
        </button>

        {/* Dots */}
        <div style={css.slideDots}>
          {SLIDES.map((sl, i) => (
            <button key={i}
              style={{ ...css.slideDot, ...(i === slide
                ? { width: 28, background: S.accent }
                : { background: 'rgba(255,255,255,.35)' }) }}
              onClick={() => { setSlide(i); startTimer(); }}/>
          ))}
        </div>
      </section>

      {/* ══ STATS STRIP ══════════════════════════════════════════ */}
      <section style={css.statsStrip}>
        {STATS.map((s, i) => (
          <div key={s.lbl} style={css.statItem}>
            <div style={css.statVal}>{s.val}</div>
            <div style={css.statLbl}>{s.lbl}</div>
            {i < STATS.length - 1 && <div style={css.statDiv}/>}
          </div>
        ))}
      </section>

      {/* ══ COURSE CATEGORIES ════════════════════════════════════ */}
      <section style={css.section} id="courses">
        <div style={css.sectionHead}>
          <div style={css.sectionTag}>Our Programs</div>
          <h2 style={css.sectionTitle}>Explore Our Course Categories</h2>
          <p style={css.sectionSub}>Industry-aligned programs designed for real career outcomes</p>
        </div>
        <div style={css.catGrid}>
          {CATEGORIES.map(cat => (
            <Link to="/login" key={cat.label} style={{ ...css.catCard, '--cat-color': cat.color }}>
              <div style={{ ...css.catIcon, background: cat.bg, border: `1px solid ${cat.color}30` }}>
                <cat.icon size={24} color={cat.color}/>
              </div>
              <div style={css.catLabel}>{cat.label}</div>
              <div style={css.catCount}>{cat.count}</div>
              <div style={{ ...css.catArrow, color: cat.color }}>
                <ArrowRight size={14}/>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ══ WHY CHOOSE US ════════════════════════════════════════ */}
      <section style={{ ...css.section, background: 'var(--ink)' }} id="about">
        <div style={css.sectionHead}>
          <div style={css.sectionTag}>Why Us</div>
          <h2 style={css.sectionTitle}>Why Choose Hyderabad Education Tech?</h2>
          <p style={css.sectionSub}>We don't just teach — we transform careers</p>
        </div>
        <div style={css.whyGrid}>
          {WHY.map(w => (
            <div key={w.title} style={css.whyCard}>
              <div style={css.whyIconBox}><w.icon size={22} color="var(--saffron)"/></div>
              <h3 style={css.whyTitle}>{w.title}</h3>
              <p style={css.whyDesc}>{w.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════ */}
      <section style={css.section}>
        <div style={css.sectionHead}>
          <div style={css.sectionTag}>Success Stories</div>
          <h2 style={css.sectionTitle}>What Our Students Say</h2>
        </div>
        <div style={css.testimonialGrid}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={css.tCard}>
              <div style={css.tStars}>{'★'.repeat(t.rating)}</div>
              <p style={css.tText}>"{t.text}"</p>
              <div style={css.tAuthor}>
                <div style={css.tAvatar}>{t.avatar}</div>
                <div>
                  <div style={css.tName}>{t.name}</div>
                  <div style={css.tRole}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA BANNER ═══════════════════════════════════════════ */}
      <section style={css.ctaBanner}>
        <div style={css.ctaInner}>
          <h2 style={css.ctaTitle}>Ready to Start Your Tech Career?</h2>
          <p style={css.ctaSub}>Join 1,200+ students who have already transformed their careers with us</p>
          <div style={css.ctaBtns}>
            <Link to="/register" style={css.ctaBtn}>Register Free Today <ArrowRight size={16}/></Link>
            <Link to="/login"    style={css.ctaSecondary}>Browse Courses</Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════ */}
      <footer style={css.footer} id="contact">
        <div style={css.footerInner}>
          {/* Brand */}
          <div style={css.footerBrand}>
            <div style={css.footerLogo}>
              <div style={css.footerLogoIcon}><GraduationCap size={16} color="#020209"/></div>
              <span style={css.footerLogoName}>Hyderabad Education Tech</span>
            </div>
            <p style={css.footerTagline}>
              Empowering the next generation of tech professionals from the heart of Hyderabad.
            </p>
            <div style={css.footerSocial}>
              <a href="#!" style={css.socialBtn}><Youtube size={16}/></a>
              <a href="#!" style={css.socialBtn}><Linkedin size={16}/></a>
              <a href="#!" style={css.socialBtn}><Instagram size={16}/></a>
            </div>
          </div>

          {/* Courses */}
          <div style={css.footerCol}>
            <div style={css.footerColTitle}>Courses</div>
            {['Web Development','Data Science','DevOps','Cybersecurity','Mobile Dev','Database Design'].map(c => (
              <Link key={c} to="/login" style={css.footerLink}>{c}</Link>
            ))}
          </div>

          {/* Company */}
          <div style={css.footerCol}>
            <div style={css.footerColTitle}>Company</div>
            {['About Us','Our Faculty','Placements','Blog','Careers'].map(l => (
              <a key={l} href="#!" style={css.footerLink}>{l}</a>
            ))}
          </div>

          {/* Contact */}
          <div style={css.footerCol}>
            <div style={css.footerColTitle}>Contact Us</div>
            <div style={css.contactItem}><MapPin size={14}/><span>KPHB Colony, Hyderabad — 500072</span></div>
            <div style={css.contactItem}><Phone size={14}/><span>+91 90000 00000</span></div>
            <div style={css.contactItem}><Mail size={14}/><span>info@hydedutech.com</span></div>
          </div>
        </div>

        <div style={css.footerBottom}>
          <span>© 2024 Hyderabad Education Tech. All rights reserved.</span>
          <span>ISO 9001:2015 Certified · Made with ❤️ in Hyderabad</span>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════ */
const css = {
  page: { minHeight:'100vh', background:'var(--base)', color:'var(--t1)', fontFamily:"'DM Sans',sans-serif" },

  /* ── Navbar ── */
  nav: {
    position:'fixed', top:0, left:0, right:0, zIndex:200,
    padding:'0 24px',
    borderBottom:'1px solid transparent',
    transition:'all .3s',
  },
  navScrolled: {
    background:'rgba(2,2,9,.95)',
    backdropFilter:'blur(20px)',
    borderBottomColor:'var(--b1)',
    boxShadow:'0 4px 30px rgba(0,0,0,.4)',
  },
  navInner: {
    maxWidth:1200, margin:'0 auto',
    display:'flex', alignItems:'center', gap:32, height:68,
  },
  navLogo:{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', flexShrink:0 },
  navLogoIcon:{
    width:38, height:38, borderRadius:10,
    background:'var(--g-brand)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 16px var(--saffron-glow)',
  },
  navLogoName:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:14, fontWeight:800, letterSpacing:'-.02em',
    background:'var(--g-text)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
  },
  navLogoSub:{ fontSize:9.5, color:'var(--t3)', letterSpacing:'.04em' },
  navLinks:{ display:'flex', gap:4, flex:1 },
  navLink:{
    padding:'6px 14px', borderRadius:8, fontSize:13.5, fontWeight:500,
    color:'var(--t2)', transition:'all .18s', textDecoration:'none',
  },
  navCtas:{ display:'flex', gap:8, flexShrink:0 },
  navLogin:{
    padding:'8px 18px', borderRadius:8, fontSize:13.5, fontWeight:600,
    color:'var(--saffron)', border:'1px solid rgba(255,107,53,.3)',
    background:'rgba(255,107,53,.06)', textDecoration:'none',
    fontFamily:"'Bricolage Grotesque',sans-serif",
  },
  navRegister:{
    padding:'8px 18px', borderRadius:8, fontSize:13.5, fontWeight:700,
    color:'#020209', background:'var(--g-brand)',
    boxShadow:'0 2px 12px var(--saffron-glow)', textDecoration:'none',
    fontFamily:"'Bricolage Grotesque',sans-serif",
  },
  burger:{ display:'none', padding:8, borderRadius:8, color:'var(--t1)', marginLeft:'auto' },
  mobileMenu:{
    display:'flex', flexDirection:'column', gap:4, padding:'12px 16px 16px',
    borderTop:'1px solid var(--b1)',
    background:'rgba(2,2,9,.98)',
  },
  mobileLink:{
    padding:'10px 12px', borderRadius:8, fontSize:14, fontWeight:500,
    color:'var(--t2)', textDecoration:'none',
  },

  /* ── Hero ── */
  hero:{
    minHeight:520, display:'flex', alignItems:'center',
    paddingTop:68, position:'relative', overflow:'hidden',
  },
  heroLeft:{
    flex:1, padding:'60px 5% 60px 8%', zIndex:1,
    maxWidth:600,
  },
  heroTag:{
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:600,
    border:'1px solid', marginBottom:20,
    fontFamily:"'DM Mono',monospace",
  },
  heroTitle:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:'clamp(32px,5vw,58px)', fontWeight:800,
    color:'#fff', lineHeight:1.1, letterSpacing:'-.03em',
    marginBottom:16, textShadow:'0 2px 20px rgba(0,0,0,.3)',
  },
  heroSub:{ fontSize:16, color:'rgba(255,255,255,.75)', marginBottom:32, lineHeight:1.6, maxWidth:460 },
  heroBtns:{ display:'flex', gap:12, flexWrap:'wrap' },
  heroCta:{
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'13px 28px', borderRadius:10,
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:15, fontWeight:700, color:'#fff', textDecoration:'none',
    transition:'all .25s',
  },
  heroSecondary:{
    display:'inline-flex', alignItems:'center',
    padding:'12px 24px', borderRadius:10,
    fontSize:14, fontWeight:600, color:'rgba(255,255,255,.8)',
    border:'1px solid rgba(255,255,255,.2)',
    background:'rgba(255,255,255,.06)',
    textDecoration:'none', backdropFilter:'blur(4px)',
    fontFamily:"'Bricolage Grotesque',sans-serif",
  },
  heroRight:{
    flex:1, display:'flex', alignItems:'center', justifyContent:'center',
    padding:'40px 8% 40px 4%', zIndex:1,
  },
  heroImgBox:{
    width:360, height:260, borderRadius:20, overflow:'hidden',
    position:'relative', boxShadow:'0 24px 60px rgba(0,0,0,.5)',
  },
  heroImg:{ width:'100%', height:'100%', objectFit:'cover', opacity:.88 },
  heroImgGlow:{
    position:'absolute', bottom:-30, left:'50%', transform:'translateX(-50%)',
    width:240, height:40, borderRadius:'50%', filter:'blur(24px)', opacity:.5,
  },
  slideBtn:{
    position:'absolute', top:'50%', transform:'translateY(-50%)',
    width:42, height:42, borderRadius:'50%',
    background:'rgba(255,255,255,.15)', backdropFilter:'blur(8px)',
    border:'1px solid rgba(255,255,255,.2)',
    display:'flex', alignItems:'center', justifyContent:'center',
    cursor:'pointer', color:'white', zIndex:2, transition:'all .2s',
  },
  slideDots:{ position:'absolute', bottom:18, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6, zIndex:2 },
  slideDot:{ height:6, borderRadius:3, cursor:'pointer', border:'none', padding:0, transition:'all .3s' },

  /* ── Stats strip ── */
  statsStrip:{
    background:'var(--ink)', borderTop:'1px solid var(--b1)', borderBottom:'1px solid var(--b1)',
    padding:'0 8%', display:'flex', alignItems:'center', justifyContent:'space-around',
    flexWrap:'wrap', gap:0,
  },
  statItem:{
    display:'flex', flexDirection:'column', alignItems:'center',
    padding:'24px 32px', position:'relative', textAlign:'center',
  },
  statVal:{
    fontFamily:"'DM Mono',monospace",
    fontSize:28, fontWeight:500, color:'var(--saffron)', lineHeight:1,
  },
  statLbl:{ fontSize:12, color:'var(--t2)', marginTop:4 },
  statDiv:{
    position:'absolute', right:0, top:'20%', bottom:'20%',
    width:1, background:'var(--b1)',
  },

  /* ── Section base ── */
  section:{ padding:'72px 8%' },
  sectionHead:{ textAlign:'center', marginBottom:48 },
  sectionTag:{
    display:'inline-block', marginBottom:12,
    background:'var(--saffron-dim)', color:'var(--saffron)',
    padding:'4px 14px', borderRadius:20, fontSize:11.5, fontWeight:700,
    fontFamily:"'DM Mono',monospace", letterSpacing:'.06em',
  },
  sectionTitle:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:'clamp(24px,4vw,38px)', fontWeight:800, letterSpacing:'-.03em',
    color:'var(--t1)', marginBottom:12, lineHeight:1.2,
  },
  sectionSub:{ fontSize:15, color:'var(--t2)', maxWidth:520, margin:'0 auto' },

  /* ── Categories ── */
  catGrid:{
    display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',
    gap:16, maxWidth:1100, margin:'0 auto',
  },
  catCard:{
    background:'var(--card)', border:'1px solid var(--b1)',
    borderRadius:16, padding:'22px 18px',
    display:'flex', flexDirection:'column', gap:8, textDecoration:'none',
    transition:'all .25s', cursor:'pointer', position:'relative', overflow:'hidden',
  },
  catIcon:{ width:50, height:50, borderRadius:13, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:4 },
  catLabel:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:14.5, fontWeight:700, color:'var(--t1)', letterSpacing:'-.01em',
  },
  catCount:{ fontSize:12, color:'var(--t2)', fontFamily:"'DM Mono',monospace" },
  catArrow:{ marginTop:4 },

  /* ── Why ── */
  whyGrid:{
    display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
    gap:20, maxWidth:1100, margin:'0 auto',
  },
  whyCard:{
    background:'var(--card)', border:'1px solid var(--b1)',
    borderRadius:16, padding:'24px 22px',
    transition:'all .25s',
  },
  whyIconBox:{
    width:46, height:46, borderRadius:13,
    background:'var(--saffron-dim)', border:'1px solid rgba(255,107,53,.2)',
    display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14,
  },
  whyTitle:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:16, fontWeight:700, color:'var(--t1)',
    letterSpacing:'-.02em', marginBottom:8,
  },
  whyDesc:{ fontSize:13.5, color:'var(--t2)', lineHeight:1.7 },

  /* ── Testimonials ── */
  testimonialGrid:{
    display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',
    gap:20, maxWidth:1100, margin:'0 auto',
  },
  tCard:{
    background:'var(--card)', border:'1px solid var(--b1)',
    borderRadius:16, padding:'24px 22px',
  },
  tStars:{ color:'var(--turmeric)', fontSize:16, marginBottom:12, letterSpacing:2 },
  tText:{ fontSize:14, color:'var(--t2)', lineHeight:1.75, marginBottom:18, fontStyle:'italic' },
  tAuthor:{ display:'flex', alignItems:'center', gap:12 },
  tAvatar:{
    width:40, height:40, borderRadius:10, flexShrink:0,
    background:'var(--g-brand)', color:'#020209',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:12, fontWeight:800,
  },
  tName:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:14, fontWeight:700, color:'var(--t1)',
  },
  tRole:{ fontSize:12, color:'var(--t3)', marginTop:2 },

  /* ── CTA Banner ── */
  ctaBanner:{
    background:'linear-gradient(135deg,rgba(255,107,53,.12) 0%,rgba(139,92,246,.1) 100%)',
    border:'1px solid rgba(255,107,53,.15)',
    borderLeft:'none', borderRight:'none',
    padding:'72px 8%', textAlign:'center',
  },
  ctaInner:{ maxWidth:640, margin:'0 auto' },
  ctaTitle:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:'clamp(26px,4vw,42px)', fontWeight:800,
    color:'var(--t1)', letterSpacing:'-.03em', marginBottom:12, lineHeight:1.2,
  },
  ctaSub:{ fontSize:16, color:'var(--t2)', marginBottom:32, lineHeight:1.6 },
  ctaBtns:{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' },
  ctaBtn:{
    display:'inline-flex', alignItems:'center', gap:8,
    padding:'14px 32px', borderRadius:10,
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:15, fontWeight:700, color:'#020209',
    background:'var(--g-brand)', textDecoration:'none',
    boxShadow:'0 4px 20px var(--saffron-glow)',
  },
  ctaSecondary:{
    display:'inline-flex', alignItems:'center',
    padding:'13px 28px', borderRadius:10, fontSize:14, fontWeight:600,
    color:'var(--t2)', border:'1px solid var(--b2)',
    background:'var(--card)', textDecoration:'none',
    fontFamily:"'Bricolage Grotesque',sans-serif",
  },

  /* ── Footer ── */
  footer:{ background:'var(--ink)', borderTop:'1px solid var(--b1)', padding:'56px 8% 0' },
  footerInner:{
    maxWidth:1200, margin:'0 auto',
    display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1.5fr', gap:40,
    paddingBottom:48,
  },
  footerBrand:{},
  footerLogo:{ display:'flex', alignItems:'center', gap:10, marginBottom:14 },
  footerLogoIcon:{
    width:34, height:34, borderRadius:9,
    background:'var(--g-brand)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  footerLogoName:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:13, fontWeight:800, letterSpacing:'-.02em',
    background:'var(--g-text)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
  },
  footerTagline:{ fontSize:13, color:'var(--t2)', lineHeight:1.7, marginBottom:18 },
  footerSocial:{ display:'flex', gap:8 },
  socialBtn:{
    width:34, height:34, borderRadius:9, border:'1px solid var(--b2)',
    background:'var(--card)', display:'flex', alignItems:'center', justifyContent:'center',
    color:'var(--t2)', textDecoration:'none',
  },
  footerCol:{},
  footerColTitle:{
    fontFamily:"'DM Mono',monospace",
    fontSize:10, fontWeight:500, color:'var(--t3)',
    letterSpacing:'.12em', textTransform:'uppercase', marginBottom:14,
  },
  footerLink:{
    display:'block', fontSize:13.5, color:'var(--t2)',
    marginBottom:8, textDecoration:'none', transition:'color .15s',
  },
  contactItem:{
    display:'flex', gap:8, fontSize:13, color:'var(--t2)', marginBottom:10, alignItems:'flex-start',
  },
  footerBottom:{
    maxWidth:1200, margin:'0 auto',
    borderTop:'1px solid var(--b1)', padding:'20px 0',
    display:'flex', justifyContent:'space-between', flexWrap:'wrap',
    fontSize:12, color:'var(--t3)', gap:8,
  },
};
