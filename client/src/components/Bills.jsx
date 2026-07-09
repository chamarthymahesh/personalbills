import React, { useEffect, useState, useMemo } from 'react';
import {
  FileText, Plus, Trash2, Calendar, Phone, Zap, Globe,
  DollarSign, Droplets, Flame, Edit3, Save, X, ChevronDown, ChevronUp
} from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const FULL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const TYPE_CONFIG = {
  electricity: { label: 'Electricity', color: 'var(--color-warning)',  icon: Zap },
  water:       { label: 'Water',       color: 'var(--color-accent)',   icon: Droplets },
  internet:    { label: 'Internet',    color: 'var(--color-info)',     icon: Globe },
  phone:       { label: 'Phone',       color: '#a78bfa',               icon: Phone },
  gas:         { label: 'Gas',         color: 'var(--color-danger)',   icon: Flame },
  other:       { label: 'Other',       color: 'var(--text-muted)',     icon: FileText },
};

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

// ─── Inline month cell with Add/Edit/Delete ───────────────────────────────────
function MonthCell({ bill, month, year, payment, onSaved }) {
  const [mode, setMode] = useState(null); // null | 'add' | 'edit'
  const [amount, setAmount] = useState('');
  const [datePaid, setDatePaid] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  const openEdit = (e) => {
    e.stopPropagation();
    setAmount(payment.amount);
    setDatePaid(payment.datePaid ? new Date(payment.datePaid).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setMode('edit');
  };
  const openAdd = (e) => {
    e.stopPropagation();
    setAmount('');
    setDatePaid(new Date().toISOString().split('T')[0]);
    setMode('add');
  };
  const cancel = (e) => { e && e.stopPropagation(); setMode(null); };

  const save = async (e) => {
    e.stopPropagation();
    if (!amount) return;
    setSaving(true);
    try {
      let res;
      if (mode === 'add') {
        res = await fetch(`/api/bills/${bill._id}/payments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount), month, year, datePaid: datePaid || undefined }),
        });
      } else {
        res = await fetch(`/api/bills/${bill._id}/payments/${payment._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: parseFloat(amount), month, year, datePaid: datePaid || undefined }),
        });
      }
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'Failed to save payment'}`);
        setSaving(false);
        return;
      }
      
      onSaved();
      setMode(null);
    } catch (err) { 
      console.error(err);
      alert('Network error or server is down');
    }
    setSaving(false);
  };

  const del = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this payment?')) return;
    setSaving(true);
    try {
      await fetch(`/api/bills/${bill._id}/payments/${payment._id}`, { method: 'DELETE' });
      onSaved();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  // ── Inline editor shown below the cell ────────────
  if (mode) {
    return (
      <td style={{ padding: '0.4rem', verticalAlign: 'top' }} onClick={e => e.stopPropagation()}>
        <div style={{
          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.4)',
          borderRadius: 8, padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', minWidth: 115
        }}>
          <input
            type="number" placeholder="Amount"
            value={amount} onChange={e => setAmount(e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 5, padding: '3px 6px', color: '#fff', fontSize: '0.8rem', width: '100%'
            }}
          />
          <input
            type="date" value={datePaid} onChange={e => setDatePaid(e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 5, padding: '3px 6px', color: '#fff', fontSize: '0.75rem', width: '100%'
            }}
          />
          <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
            <button onClick={cancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
              <X size={13} />
            </button>
            <button onClick={save} disabled={saving} style={{
              background: 'var(--color-primary)', border: 'none', color: '#fff',
              borderRadius: 4, padding: '2px 8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600
            }}>
              {saving ? '...' : <Save size={12} />}
            </button>
          </div>
        </div>
      </td>
    );
  }

  // ── Normal paid cell ──────────────────────────────
  if (payment) {
    return (
      <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <span style={{
            display: 'block', color: 'var(--color-success)', fontWeight: 700, fontSize: '0.82rem',
            background: 'rgba(16,185,129,0.1)', padding: '3px 6px', borderRadius: 5
          }}>
            {fmt(payment.amount)}
          </span>
          <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', marginTop: '0.2rem' }}>
            <button onClick={openEdit} title="Edit" style={{
              background: 'rgba(139,92,246,0.15)', border: 'none', borderRadius: 3,
              color: 'var(--color-primary)', cursor: 'pointer', padding: '2px 4px', fontSize: '10px',
              display: 'flex', alignItems: 'center'
            }}>
              <Edit3 size={10} />
            </button>
            <button onClick={del} title="Delete" style={{
              background: 'rgba(244,63,94,0.15)', border: 'none', borderRadius: 3,
              color: 'var(--color-danger)', cursor: 'pointer', padding: '2px 4px', fontSize: '10px',
              display: 'flex', alignItems: 'center'
            }}>
              <Trash2 size={10} />
            </button>
          </div>
        </div>
      </td>
    );
  }

  // ── Unpaid cell ──────────────────────────────────
  return (
    <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center', verticalAlign: 'middle' }}>
      <button onClick={openAdd} title="Add payment" style={{
        background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.2)', borderRadius: 5, padding: '3px 8px',
        cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s'
      }}
        onMouseEnter={e => { e.target.style.borderColor = 'var(--color-primary)'; e.target.style.color = 'var(--color-primary)'; }}
        onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.color = 'rgba(255,255,255,0.2)'; }}
      >
        + Add
      </button>
    </td>
  );
}

// ─── Expandable Connection Row ────────────────────────────────────────────────
function BillRow({ bill, selectedYear, onSaved, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const typeConf = TYPE_CONFIG[bill.type] || TYPE_CONFIG.other;
  const TypeIcon = typeConf.icon;

  const yearPayments = MONTHS.map((_, i) =>
    bill.payments?.find(p => p.month === (i + 1) && p.year === selectedYear) || null
  );
  const yearTotal = yearPayments.reduce((s, p) => s + (p ? p.amount : 0), 0);
  const paidCount = yearPayments.filter(Boolean).length;

  return (
    <>
      {/* Main Row */}
      <tr
        onClick={() => setExpanded(e => !e)}
        style={{ cursor: 'pointer', transition: 'background 0.2s', borderBottom: expanded ? 'none' : '1px solid rgba(255,255,255,0.04)' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <td style={{ padding: '0.75rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ background: `${typeConf.color}18`, padding: 6, borderRadius: 7, display: 'flex' }}>
              <TypeIcon size={16} style={{ color: typeConf.color }} />
            </span>
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{bill.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {bill.serviceNo ? `${bill.serviceNo} · ` : ''}{typeConf.label}
              </div>
            </div>
          </div>
        </td>
        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
          <span style={{
            background: paidCount === 12 ? 'rgba(16,185,129,0.15)' : paidCount > 0 ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
            color: paidCount === 12 ? 'var(--color-success)' : paidCount > 0 ? 'var(--color-warning)' : 'var(--text-muted)',
            padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600
          }}>
            {paidCount}/{MONTHS.length} paid
          </span>
        </td>
        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
          {yearTotal > 0 ? fmt(yearTotal) : <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>No payments</span>}
        </td>
        <td style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>
          <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
            <button
              onClick={e => { e.stopPropagation(); if (window.confirm('Delete this connection and all its payments?')) onDelete(bill._id); }}
              style={{ background: 'rgba(244,63,94,0.1)', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded Month-wise Panel */}
      {expanded && (
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <td colSpan={4} style={{ padding: 0 }}>
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '0.75rem 1rem 1rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: '0.6rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Month-wise Payments — {selectedYear}
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {MONTHS.map(m => (
                        <th key={m} style={{
                          padding: '0.3rem 0.5rem', textAlign: 'center', fontSize: '0.75rem',
                          color: 'var(--text-muted)', fontWeight: 600, minWidth: 80
                        }}>{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {MONTHS.map((_, i) => (
                        <MonthCell
                          key={i}
                          bill={bill}
                          month={i + 1}
                          year={selectedYear}
                          payment={yearPayments[i]}
                          onSaved={onSaved}
                        />
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Row total summary */}
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Paid months: <strong style={{ color: 'var(--color-success)' }}>{paidCount}</strong>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Pending: <strong style={{ color: 'var(--color-warning)' }}>{12 - paidCount}</strong>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>
                  Year Total: <strong style={{ color: 'var(--color-primary)' }}>{fmt(yearTotal)}</strong>
                </span>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Bills Component ─────────────────────────────────────────────────────
export default function Bills() {
  const [bills, setBills] = useState([]);
  const [config, setConfig] = useState({ billTypes: [] });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState('all');

  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [connFormData, setConnFormData] = useState({ type: 'electricity', name: '', serviceNo: '', notes: '' });

  useEffect(() => { fetchBills(); fetchConfig(); }, []);

  const fetchConfig = () => {
    fetch('/api/config').then(r => r.json()).then(d => { if (d) setConfig(d); }).catch(console.error);
  };

  const fetchBills = () => {
    setLoading(true);
    fetch('/api/bills').then(r => r.json())
      .then(d => { setBills(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const handleConnSubmit = (e) => {
    e.preventDefault();
    if (!connFormData.name) return;
    fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(connFormData)
    }).then(() => {
      setIsConnModalOpen(false);
      setConnFormData({ type: 'electricity', name: '', serviceNo: '', notes: '' });
      fetchBills();
    }).catch(console.error);
  };

  const handleDelete = (id) => {
    fetch(`/api/bills/${id}`, { method: 'DELETE' }).then(fetchBills).catch(console.error);
  };

  // Available years across all payments
  const availableYears = useMemo(() => {
    const yrs = new Set([new Date().getFullYear()]);
    bills.forEach(b => b.payments?.forEach(p => yrs.add(p.year)));
    return [...yrs].sort((a, b) => b - a);
  }, [bills]);

  // Derive unique categories from data
  const categories = useMemo(() => {
    const types = [...new Set(bills.map(b => b.type))].sort();
    return ['all', ...types];
  }, [bills]);

  // Filtered bills by selected category
  const filteredBills = useMemo(() => {
    if (selectedCategory === 'all') return bills;
    return bills.filter(b => b.type === selectedCategory);
  }, [bills, selectedCategory]);

  // Summary stats for selected year (computed from filteredBills)
  const { yearTotal, paidThisMonth, unpaidConnCount } = useMemo(() => {
    const cm = new Date().getMonth() + 1;
    const cy = new Date().getFullYear();
    let yearTotal = 0, paidThisMonth = 0, unpaidConnCount = 0;
    filteredBills.forEach(b => {
      const yr = b.payments?.filter(p => p.year === selectedYear) || [];
      yearTotal += yr.reduce((s, p) => s + p.amount, 0);
      const thisMonthPay = b.payments?.find(p => p.month === cm && p.year === cy);
      if (thisMonthPay) paidThisMonth += thisMonthPay.amount;
      const currentMonthForYear = new Date().getFullYear() === selectedYear ? cm : 12;
      const hasPaidAll = [...Array(currentMonthForYear)].every((_, i) =>
        b.payments?.find(p => p.month === (i + 1) && p.year === selectedYear)
      );
      if (!hasPaidAll) unpaidConnCount++;
    });
    return { yearTotal, paidThisMonth, unpaidConnCount };
  }, [filteredBills, selectedYear]);

  const getCategoryLabel = (cat) => {
    if (cat === 'all') return 'All';
    return TYPE_CONFIG[cat]?.label || cat.charAt(0).toUpperCase() + cat.slice(1);
  };
  const getCategoryIcon = (cat) => {
    if (cat === 'all') return Zap;
    return TYPE_CONFIG[cat]?.icon || FileText;
  };
  const getCategoryColor = (cat) => {
    if (cat === 'all') return 'var(--color-primary)';
    return TYPE_CONFIG[cat]?.color || 'var(--text-muted)';
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-title-section">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Zap style={{ color: 'var(--color-warning)' }} size={32} />
            Utility Connections
          </h1>
          <p>Track and manage all your electricity, internet, water, gas & phone bills.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: 'auto', padding: '0.5rem 0.8rem' }}
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setIsConnModalOpen(true)} style={{ padding: '0.75rem 1.5rem', borderRadius: '12px' }}>
            <Plus size={20} />
            Add Connection
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: '2rem' }}>
        <div className="glass-card metric-card" style={{ borderLeft: `4px solid var(--color-primary)` }}>
          <div className="metric-header">
            <span className="metric-title">{selectedCategory === 'all' ? `Year ${selectedYear} Total` : `${getCategoryLabel(selectedCategory)} — ${selectedYear}`}</span>
            <div className="metric-icon-wrapper" style={{ background: 'var(--color-primary-glow)' }}>
              <DollarSign size={22} style={{ color: 'var(--color-primary)' }} />
            </div>
          </div>
          <div>
            <h2 className="metric-value" style={{ color: 'var(--color-primary)' }}>{fmt(yearTotal)}</h2>
            <p className="metric-desc" style={{ color: 'var(--text-secondary)' }}>{selectedCategory === 'all' ? 'All categories combined' : `Filtered to ${getCategoryLabel(selectedCategory)} only`}</p>
          </div>
        </div>
        <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--color-success)' }}>
          <div className="metric-header">
            <span className="metric-title">Paid This Month</span>
            <div className="metric-icon-wrapper" style={{ background: 'var(--color-success-glow)' }}>
              <DollarSign size={22} style={{ color: 'var(--color-success)' }} />
            </div>
          </div>
          <div>
            <h2 className="metric-value" style={{ color: 'var(--color-success)' }}>{fmt(paidThisMonth)}</h2>
            <p className="metric-desc" style={{ color: 'var(--text-secondary)' }}>{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="glass-card metric-card" style={{ borderLeft: '4px solid var(--color-warning)' }}>
          <div className="metric-header">
            <span className="metric-title">Connections</span>
            <div className="metric-icon-wrapper" style={{ background: 'var(--color-warning-glow)' }}>
              <Zap size={22} style={{ color: 'var(--color-warning)' }} />
            </div>
          </div>
          <div>
            <h2 className="metric-value">{filteredBills.length}</h2>
            <p className="metric-desc" style={{ color: 'var(--text-secondary)' }}>{unpaidConnCount} with pending months</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      {categories.length > 2 && (
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', marginBottom: '1.5rem', scrollbarWidth: 'none' }}>
          {categories.map(cat => {
            const CatIcon = getCategoryIcon(cat);
            const count = cat === 'all' ? bills.length : bills.filter(b => b.type === cat).length;
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  background: isActive ? getCategoryColor(cat) : 'rgba(255,255,255,0.05)',
                  color: isActive ? 'white' : 'var(--text-secondary)',
                  border: `1px solid ${isActive ? getCategoryColor(cat) : 'var(--border-color)'}`,
                  padding: '0.6rem 1.25rem',
                  borderRadius: '99px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: isActive ? `0 4px 15px ${getCategoryColor(cat)}44` : 'none'
                }}
              >
                <CatIcon size={16} />
                {getCategoryLabel(cat)} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Connections Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>My Connections</h3>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
            Click a row to expand month-wise view. Click <strong style={{ color: 'var(--color-primary)' }}>+ Add</strong> on any month to record a payment.
          </p>
        </div>

        {loading ? (
          <p style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Loading...</p>
        ) : filteredBills.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <FileText size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>No Connections Found</h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              {selectedCategory !== 'all' 
                ? `No ${getCategoryLabel(selectedCategory)} connections yet. Click "Add Connection" to add one.`
                : 'No connections yet. Add your first utility connection!'
              }
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Connection</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status {selectedYear}</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year Total</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map(bill => (
                  <BillRow
                    key={bill._id}
                    bill={bill}
                    selectedYear={selectedYear}
                    onSaved={fetchBills}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Connection Modal */}
      {isConnModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Add Utility Connection</h2>
              <button onClick={() => setIsConnModalOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleConnSubmit}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={connFormData.type} onChange={e => setConnFormData({ ...connFormData, type: e.target.value })}>
                  {config.billTypes?.length
                    ? config.billTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)
                    : <><option value="electricity">Electricity</option><option value="water">Water</option><option value="internet">Internet</option><option value="phone">Phone</option><option value="gas">Gas</option><option value="other">Other</option></>
                  }
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Connection Name</label>
                <input className="form-control" placeholder="e.g. Home Electricity" required value={connFormData.name} onChange={e => setConnFormData({ ...connFormData, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Service No / Account ID</label>
                <input className="form-control" placeholder="Optional" value={connFormData.serviceNo} onChange={e => setConnFormData({ ...connFormData, serviceNo: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input className="form-control" placeholder="Optional" value={connFormData.notes} onChange={e => setConnFormData({ ...connFormData, notes: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsConnModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Connection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
