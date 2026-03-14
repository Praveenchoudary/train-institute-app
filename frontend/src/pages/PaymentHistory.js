import { useEffect, useState } from 'react';
import { paymentAPI } from '../services/api';
import { CreditCard, CheckCircle, XCircle, RefreshCw, Receipt } from 'lucide-react';

const STATUS = {
  success:  { label: 'Paid',     color: 'green', icon: <CheckCircle size={12}/> },
  failed:   { label: 'Declined', color: 'red',   icon: <XCircle size={12}/> },
  refunded: { label: 'Refunded', color: 'blue',  icon: <RefreshCw size={12}/> },
  pending:  { label: 'Pending',  color: 'blue',  icon: <RefreshCw size={12}/> },
};

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    paymentAPI.history().then(r => setPayments(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Payment History</h1>
        <p className="page-sub">{payments.length} transaction{payments.length !== 1 ? 's' : ''}</p>
      </div>

      {loading ? <div className="skeleton-list"/> : payments.length === 0 ? (
        <div className="empty-state">
          <Receipt size={40}/><h3>No payments yet</h3>
          <p>Enroll in a paid course and your receipts will appear here.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Transaction</th><th>Course</th><th>Amount</th><th>Card</th><th>Date</th><th>Status</th></tr>
            </thead>
            <tbody>
              {payments.map(p => {
                const s = STATUS[p.status] || STATUS.pending;
                return (
                  <tr key={p.transaction_id}>
                    <td><code style={{ fontSize:11.5,color:'var(--turmeric)',background:'var(--saffron-dim)',padding:'2px 7px',borderRadius:5 }}>{p.transaction_id}</code></td>
                    <td className="td-main" style={{ maxWidth:200 }}><span style={{ overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{p.course_title}</span></td>
                    <td style={{ color:'var(--saffron)',fontWeight:600 }}>
                      {parseFloat(p.amount) === 0 ? <span className="free-tag">Free</span> : `$${parseFloat(p.amount).toFixed(2)}`}
                    </td>
                    <td className="td-muted">
                      {p.card_last4
                        ? <span style={{ display:'flex',alignItems:'center',gap:5 }}><CreditCard size={12}/> {p.card_brand?.toUpperCase()} ••{p.card_last4}</span>
                        : <span style={{ color:'var(--t3)' }}>—</span>}
                    </td>
                    <td className="td-muted" style={{ fontSize:12 }}>{new Date(p.created_at).toLocaleDateString()}</td>
                    <td><span className={`status-pill ${s.color}`}>{s.icon} {s.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
