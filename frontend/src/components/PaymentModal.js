// ══════════════════════════════════════════════════════════════════
//  PaymentModal.js
//
//  Screens:
//    "free"       → confirm screen for free courses (no card needed)
//    "form"       → card entry for paid courses
//    "processing" → animated processing state
//    "success"    → "Order placed successfully!" receipt
//
//  Test cards:
//    Success: 4111 1111 1111 1111  (any card NOT ending 0000)
//    Decline: 4111 1111 1111 0000
// ══════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { paymentAPI } from '../services/api';
import { X, CreditCard, Lock, CheckCircle, AlertCircle,
         Shield, RefreshCw, Zap, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

function fmtCard(v)   { return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim(); }
function fmtExpiry(v) { const d=v.replace(/\D/g,'').slice(0,4); return d.length>2?d.slice(0,2)+'/'+d.slice(2):d; }
function brandInfo(num) {
  const n=(num||'').replace(/\s/g,'');
  if (n.startsWith('4'))    return { label:'VISA',       bg:'#1a1f71', color:'#fff' };
  if (/^5[1-5]/.test(n))   return { label:'MASTERCARD', bg:'#eb001b', color:'#fff' };
  if (/^3[47]/.test(n))    return { label:'AMEX',       bg:'#007bc1', color:'#fff' };
  if (n.startsWith('6011')) return { label:'DISCOVER',   bg:'#f76f20', color:'#fff' };
  return null;
}

export default function PaymentModal({ order, onClose, onSuccess }) {
  const [screen,   setScreen]   = useState(order.isFree ? 'free' : 'form');
  const [card,     setCard]     = useState({ number:'', holder:'', expiry:'', cvv:'' });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [receipt,  setReceipt]  = useState(null);
  const [declined, setDeclined] = useState(false);

  const brand = brandInfo(card.number);

  // ── Free enrollment ─────────────────────────────────────────────
  const handleFreeEnroll = async () => {
    setScreen('processing');
    try {
      const res = await paymentAPI.process({ orderId: order.id });
      setReceipt(res.data.receipt);
      setScreen('success');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Enrollment failed.');
      onClose();
    }
  };

  // ── Paid card validation ────────────────────────────────────────
  const validate = () => {
    const e = {};
    const num = card.number.replace(/\s/g,'');
    if (num.length < 13)         e.number = 'Enter a valid card number';
    if (!card.holder.trim())     e.holder = 'Cardholder name required';
    if (card.expiry.length < 5)  e.expiry = 'Enter MM/YY';
    if (card.cvv.length < 3)     e.cvv    = 'Enter CVV';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true); setDeclined(false);
    setScreen('processing');
    try {
      const res = await paymentAPI.process({
        orderId:    order.id,
        cardNumber: card.number.replace(/\s/g,''),
        cardHolder: card.holder,
        expiry:     card.expiry,
        cvv:        card.cvv,
      });
      setReceipt(res.data.receipt);
      setScreen('success');
      toast.success('Payment successful! 🎉');
    } catch (err) {
      const msg = err.response?.data?.error || 'Payment failed.';
      setDeclined(true);
      setScreen('form');
      setErrors({ global: msg });
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const set = k => v => setCard(c => ({ ...c, [k]: v }));

  return (
    <div style={S.overlay}
      onClick={e => e.target === e.currentTarget && screen !== 'processing' && onClose()}>
      <div style={S.modal}>

        {/* ── Top accent bar ─────────────────────────────── */}
        <div style={S.accentBar}/>

        {/* ── Header ─────────────────────────────────────── */}
        {screen !== 'processing' && (
          <div style={S.header}>
            <div style={S.headerLeft}>
              <div style={S.lockBadge}>
                {screen === 'success'
                  ? <CheckCircle size={14} color="white"/>
                  : <Lock size={13} color="white"/>}
              </div>
              <div>
                <div style={S.headerTitle}>
                  {screen === 'success' ? 'Order Placed Successfully!' :
                   screen === 'free'    ? 'Confirm Enrollment' :
                                          'Secure Checkout'}
                </div>
                <div style={S.headerSub}>
                  {screen === 'success' ? (receipt?.txnId || '') :
                   screen === 'free'    ? 'Free course — no payment needed' :
                                          'Your card info is encrypted & secure'}
                </div>
              </div>
            </div>
            {screen !== 'success' && (
              <button style={S.closeBtn} onClick={onClose}><X size={17}/></button>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            SCREEN: FREE COURSE CONFIRM
        ══════════════════════════════════════════════════ */}
        {screen === 'free' && (
          <div style={S.freeWrap}>
            <div style={S.freeIconBox}>
              <BookOpen size={28} color="var(--mint)"/>
            </div>
            <div style={S.freeCourse}>{order.courseTitle || order.title}</div>
            <div style={S.freeBadge}>FREE COURSE</div>
            <p style={S.freeDesc}>
              This course is completely free. Click below to confirm your enrollment
              and get instant access to all course materials.
            </p>
            <button className="btn-primary full" style={{ fontSize:15, padding:'13px' }}
              onClick={handleFreeEnroll}>
              <Zap size={16}/> Enroll Now — It's Free!
            </button>
            <button style={S.cancelLink} onClick={onClose}>Cancel</button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            SCREEN: PAID CARD FORM
        ══════════════════════════════════════════════════ */}
        {screen === 'form' && (
          <form onSubmit={handlePay} style={S.form}>
            {/* Order strip */}
            <div style={S.orderStrip}>
              <span style={S.orderTitle}>{order.courseTitle || order.title}</span>
              <span style={S.orderPrice}>${order.amount?.toFixed(2)} <span style={S.orderCurr}>USD</span></span>
            </div>

            {/* Decline error */}
            {declined && errors.global && (
              <div style={S.errorBanner}>
                <AlertCircle size={15}/><span>{errors.global}</span>
              </div>
            )}

            {/* Visual card */}
            <div style={S.cardViz}>
              <div style={S.cardChip}/>
              <div style={S.cardNum}>
                {(card.number||'•••• •••• •••• ••••')
                  .padEnd(19,'•').slice(0,19)
                  .match(/.{1,5}/g)?.join(' ') || '•••• •••• •••• ••••'}
              </div>
              <div style={S.cardRow}>
                <div>
                  <div style={S.cardLabel}>CARDHOLDER</div>
                  <div style={S.cardVal}>{card.holder || 'YOUR NAME'}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={S.cardLabel}>EXPIRES</div>
                  <div style={S.cardVal}>{card.expiry || 'MM/YY'}</div>
                </div>
                {brand && (
                  <div style={{ ...S.brandPill, background:brand.bg }}>{brand.label}</div>
                )}
              </div>
            </div>

            {/* Card number */}
            <div style={S.field}>
              <label style={S.label}>Card number</label>
              <div style={{ ...S.inputWrap, ...(errors.number ? S.inputErr : {}) }}>
                <CreditCard size={15} style={{ color:'var(--t3)', flexShrink:0 }}/>
                <input style={S.input} placeholder="1234 5678 9012 3456"
                  value={card.number} inputMode="numeric"
                  onChange={e => set('number')(fmtCard(e.target.value))}/>
              </div>
              {errors.number && <span style={S.errText}>{errors.number}</span>}
            </div>

            {/* Holder */}
            <div style={S.field}>
              <label style={S.label}>Cardholder name</label>
              <div style={{ ...S.inputWrap, ...(errors.holder ? S.inputErr : {}) }}>
                <input style={S.input} placeholder="Name on card"
                  value={card.holder}
                  onChange={e => set('holder')(e.target.value.toUpperCase())}/>
              </div>
              {errors.holder && <span style={S.errText}>{errors.holder}</span>}
            </div>

            {/* Expiry + CVV */}
            <div style={{ display:'flex', gap:12 }}>
              <div style={{ ...S.field, flex:1 }}>
                <label style={S.label}>Expiry date</label>
                <div style={{ ...S.inputWrap, ...(errors.expiry ? S.inputErr : {}) }}>
                  <input style={S.input} placeholder="MM/YY"
                    value={card.expiry} inputMode="numeric"
                    onChange={e => set('expiry')(fmtExpiry(e.target.value))}/>
                </div>
                {errors.expiry && <span style={S.errText}>{errors.expiry}</span>}
              </div>
              <div style={{ ...S.field, flex:1 }}>
                <label style={S.label}>CVV</label>
                <div style={{ ...S.inputWrap, ...(errors.cvv ? S.inputErr : {}) }}>
                  <input style={S.input} placeholder="•••" maxLength={4}
                    value={card.cvv} inputMode="numeric"
                    onChange={e => set('cvv')(e.target.value.replace(/\D/g,'').slice(0,4))}/>
                </div>
                {errors.cvv && <span style={S.errText}>{errors.cvv}</span>}
              </div>
            </div>

            {/* Test hint */}
            <div style={S.testHint}>
              <Zap size={13} style={{ color:'var(--turmeric)', flexShrink:0 }}/>
              <span>Test: use any card number · ending <strong>0000</strong> = declined</span>
            </div>

            {/* Submit */}
            <button type="submit" className="btn-primary full"
              style={{ fontSize:15, padding:'13px' }} disabled={loading}>
              <Lock size={15}/> Pay ${order.amount?.toFixed(2)}
            </button>

            {/* Security row */}
            <div style={S.secRow}>
              <Shield size={11} style={{ color:'var(--t3)' }}/>
              <span style={{ fontSize:11, color:'var(--t3)' }}>
                256-bit SSL · PCI DSS · No card data stored
              </span>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════
            SCREEN: PROCESSING
        ══════════════════════════════════════════════════ */}
        {screen === 'processing' && (
          <div style={S.processingWrap}>
            <div style={S.spinnerBox}>
              <RefreshCw size={28} style={{ color:'var(--saffron)', animation:'spin 1s linear infinite' }}/>
            </div>
            <div style={S.processingTitle}>
              {order.isFree ? 'Confirming enrollment…' : 'Processing payment…'}
            </div>
            <div style={S.processingSteps}>
              {(order.isFree
                ? ['Verifying course availability','Creating your enrollment','Setting up course access']
                : ['Encrypting card data','Contacting payment network','Confirming enrollment']
              ).map((step, i) => (
                <div key={i} style={S.processingStep}>
                  <div style={S.pDot}/>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            SCREEN: SUCCESS RECEIPT
        ══════════════════════════════════════════════════ */}
        {screen === 'success' && receipt && (
          <div style={S.receiptWrap}>
            {/* Tick */}
            <div style={S.successTick}>
              <CheckCircle size={38} color="white"/>
            </div>
            <h3 style={S.successTitle}>Order Placed Successfully!</h3>
            <p style={S.successSub}>{receipt.courseTitle}</p>

            {/* Receipt card */}
            <div style={S.receiptCard}>
              <div style={S.receiptRow}>
                <span style={S.rLabel}>Transaction ID</span>
                <code style={S.rCode}>{receipt.txnId}</code>
              </div>
              <div style={S.receiptRow}>
                <span style={S.rLabel}>Amount paid</span>
                <span style={{ ...S.rVal, color: receipt.amount === 0 ? 'var(--mint)' : 'var(--turmeric)' }}>
                  {receipt.amount === 0 ? 'FREE' : `$${receipt.amount.toFixed(2)} USD`}
                </span>
              </div>
              {receipt.cardLast4 && (
                <div style={S.receiptRow}>
                  <span style={S.rLabel}>Card</span>
                  <span style={S.rVal}>{receipt.cardBrand?.toUpperCase()} •••• {receipt.cardLast4}</span>
                </div>
              )}
              <div style={{ ...S.receiptRow, borderBottom:'none' }}>
                <span style={S.rLabel}>Date</span>
                <span style={S.rVal}>{new Date(receipt.date).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ display:'flex', gap:10, width:'100%', marginTop:4 }}>
              <button className="btn-secondary" style={{ flex:1, padding:'11px' }}
                onClick={onClose}>Close</button>
              <button className="btn-primary" style={{ flex:1, padding:'11px' }}
                onClick={() => { onSuccess(); onClose(); }}>
                Go to My Courses →
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const S = {
  overlay:{
    position:'fixed', inset:0, background:'rgba(0,0,0,.85)',
    backdropFilter:'blur(14px)', zIndex:300,
    display:'flex', alignItems:'center', justifyContent:'center', padding:24,
  },
  modal:{
    background:'var(--card)', border:'1px solid var(--b3)',
    borderRadius:22, width:'100%', maxWidth:460,
    boxShadow:'0 32px 80px rgba(0,0,0,.7)',
    overflow:'hidden', position:'relative',
  },
  accentBar:{
    height:2, background:'linear-gradient(90deg,var(--saffron),var(--turmeric),var(--violet))',
  },
  header:{
    display:'flex', alignItems:'center', justifyContent:'space-between',
    padding:'18px 22px 0',
  },
  headerLeft:{ display:'flex', alignItems:'center', gap:11 },
  lockBadge:{
    width:32, height:32, borderRadius:9, flexShrink:0,
    background:'linear-gradient(135deg,var(--saffron),var(--turmeric))',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 4px 12px var(--saffron-glow)',
  },
  headerTitle:{ fontSize:14.5, fontWeight:700, color:'var(--t1)', fontFamily:"'Bricolage Grotesque',sans-serif" },
  headerSub:  { fontSize:11, color:'var(--t3)', marginTop:1, fontFamily:"'DM Mono',monospace" },
  closeBtn:{
    width:32, height:32, borderRadius:9,
    background:'var(--card2)', border:'1px solid var(--b1)',
    display:'flex', alignItems:'center', justifyContent:'center',
    color:'var(--t2)', cursor:'pointer',
  },

  /* Free screen */
  freeWrap:{
    padding:'28px 26px',
    display:'flex', flexDirection:'column', alignItems:'center', gap:12,
  },
  freeIconBox:{
    width:68, height:68, borderRadius:'50%',
    background:'var(--mint-dim)', border:'1px solid rgba(16,217,164,.3)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  freeCourse:{ fontSize:16, fontWeight:700, color:'var(--t1)', textAlign:'center', fontFamily:"'Bricolage Grotesque',sans-serif" },
  freeBadge:{
    background:'var(--mint-dim)', color:'var(--mint)',
    padding:'3px 14px', borderRadius:20, fontSize:11, fontWeight:700,
    border:'1px solid rgba(16,217,164,.25)', fontFamily:"'DM Mono',monospace",
  },
  freeDesc:{ fontSize:13.5, color:'var(--t2)', textAlign:'center', lineHeight:1.7, maxWidth:340 },
  cancelLink:{ fontSize:12.5, color:'var(--t3)', background:'none', border:'none', cursor:'pointer', marginTop:-4 },

  /* Card form */
  form:{ padding:'16px 22px 22px', display:'flex', flexDirection:'column', gap:13 },
  orderStrip:{
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'10px 14px', background:'rgba(255,107,53,.07)',
    borderRadius:10, border:'1px solid rgba(255,107,53,.18)',
  },
  orderTitle:{ fontSize:13, fontWeight:500, color:'var(--t1)' },
  orderPrice:{ fontSize:17, fontWeight:700, color:'var(--saffron)', fontFamily:"'DM Mono',monospace" },
  orderCurr:{ fontSize:11, color:'var(--t2)', fontWeight:400 },
  errorBanner:{
    display:'flex', alignItems:'center', gap:8, padding:'10px 13px',
    borderRadius:10, background:'var(--rose-dim)',
    border:'1px solid rgba(255,51,102,.25)', color:'#ff6b8a', fontSize:13,
  },

  /* Card visual */
  cardViz:{
    background:'linear-gradient(135deg,#1a1f4e 0%,#2d1b69 50%,#1a3a5e 100%)',
    borderRadius:14, padding:'16px 18px',
    border:'1px solid rgba(255,107,53,.25)',
    boxShadow:'0 8px 24px rgba(0,0,0,.4)',
  },
  cardChip:{
    width:30, height:22, borderRadius:4, marginBottom:14,
    background:'linear-gradient(135deg,#d4a843,#f5d280)',
    border:'1px solid rgba(255,255,255,.2)',
  },
  cardNum:{
    fontFamily:"'DM Mono',monospace", fontSize:16, letterSpacing:'.12em',
    color:'rgba(255,255,255,.9)', marginBottom:16,
  },
  cardRow:{ display:'flex', alignItems:'flex-end', gap:16, position:'relative' },
  cardLabel:{ fontSize:8, letterSpacing:'.1em', color:'rgba(255,255,255,.4)', textTransform:'uppercase', marginBottom:2 },
  cardVal:{ fontSize:12, fontWeight:500, color:'rgba(255,255,255,.85)', fontFamily:"'DM Mono',monospace" },
  brandPill:{ marginLeft:'auto', padding:'2px 7px', borderRadius:4, fontSize:9.5, fontWeight:800, color:'#fff' },

  /* Inputs */
  field:{ display:'flex', flexDirection:'column', gap:5 },
  label:{ fontSize:11, fontWeight:600, color:'var(--t2)', letterSpacing:'.06em', textTransform:'uppercase', fontFamily:"'DM Mono',monospace" },
  inputWrap:{
    display:'flex', alignItems:'center', gap:8,
    border:'1px solid var(--b2)', borderRadius:9,
    padding:'10px 13px', background:'var(--ink)', transition:'all .2s',
  },
  inputErr:{ borderColor:'var(--rose)', boxShadow:'0 0 0 3px var(--rose-dim)' },
  input:{ flex:1, border:'none', background:'none', color:'var(--t1)', fontSize:14 },
  errText:{ fontSize:11, color:'var(--rose)' },
  testHint:{
    display:'flex', alignItems:'center', gap:7, padding:'8px 11px', borderRadius:9,
    background:'rgba(255,184,48,.07)', border:'1px solid rgba(255,184,48,.18)',
    fontSize:11.5, color:'var(--t2)',
  },
  secRow:{ display:'flex', alignItems:'center', justifyContent:'center', gap:5, marginTop:2 },

  /* Processing */
  processingWrap:{
    padding:'52px 24px', textAlign:'center',
    display:'flex', flexDirection:'column', alignItems:'center', gap:18,
  },
  spinnerBox:{
    width:72, height:72, borderRadius:'50%',
    background:'var(--saffron-dim)', border:'1px solid rgba(255,107,53,.3)',
    display:'flex', alignItems:'center', justifyContent:'center',
  },
  processingTitle:{ fontSize:17, fontWeight:700, color:'var(--t1)', fontFamily:"'Bricolage Grotesque',sans-serif" },
  processingSteps:{ display:'flex', flexDirection:'column', gap:9, textAlign:'left' },
  processingStep:{ display:'flex', alignItems:'center', gap:10, fontSize:13, color:'var(--t2)' },
  pDot:{ width:6, height:6, borderRadius:'50%', background:'var(--turmeric)', flexShrink:0 },

  /* Receipt */
  receiptWrap:{
    padding:'28px 26px',
    display:'flex', flexDirection:'column', alignItems:'center', gap:12,
  },
  successTick:{
    width:76, height:76, borderRadius:'50%',
    background:'linear-gradient(135deg,#059669,#34d399)',
    display:'flex', alignItems:'center', justifyContent:'center',
    boxShadow:'0 8px 28px rgba(5,150,105,.35)',
  },
  successTitle:{
    fontFamily:"'Bricolage Grotesque',sans-serif",
    fontSize:22, fontWeight:800, color:'var(--t1)',
    letterSpacing:'-.03em', textAlign:'center',
  },
  successSub:{ fontSize:14, color:'var(--t2)', textAlign:'center' },
  receiptCard:{
    width:'100%', background:'rgba(255,255,255,.03)',
    border:'1px solid var(--b1)', borderRadius:12, overflow:'hidden',
  },
  receiptRow:{
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'10px 15px', borderBottom:'1px solid var(--b1)',
  },
  rLabel:{ fontSize:11.5, color:'var(--t3)' },
  rVal:  { fontSize:12.5, color:'var(--t1)', fontWeight:600 },
  rCode: { fontSize:11, color:'var(--turmeric)', fontFamily:"'DM Mono',monospace" },
};
