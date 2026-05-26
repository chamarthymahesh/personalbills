import React, { useEffect, useState } from 'react';
import { FileText, Plus, Trash2, Calendar, Phone, Zap, Globe, DollarSign, List, X } from 'lucide-react';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [config, setConfig] = useState({ billTypes: [] });
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isConnModalOpen, setIsConnModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);

  // Form States
  const [connFormData, setConnFormData] = useState({ type: 'electricity', name: '', serviceNo: '', notes: '' });
  const [paymentFormData, setPaymentFormData] = useState({ amount: '', datePaid: new Date().toISOString().split('T')[0], month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  useEffect(() => {
    fetchBills();
    fetchConfig();
  }, []);

  const fetchConfig = () => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => { if (data) setConfig(data); })
      .catch(console.error);
  };

  const fetchBills = () => {
    setLoading(true);
    fetch('/api/bills')
      .then(res => res.json())
      .then(data => { setBills(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  const handleConnSubmit = (e) => {
    e.preventDefault();
    if (!connFormData.name) { alert('Name is required.'); return; }
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

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentFormData.amount || !selectedBill) return;
    fetch(`/api/bills/${selectedBill._id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentFormData)
    }).then(() => {
      setIsPaymentModalOpen(false);
      setSelectedBill(null);
      setPaymentFormData({ amount: '', datePaid: new Date().toISOString().split('T')[0], month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      fetchBills();
    }).catch(console.error);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this bill connection?')) return;
    fetch(`/api/bills/${id}`, { method: 'DELETE' }).then(() => fetchBills());
  };

  const getBillIcon = (type) => {
    switch (type) {
      case 'electricity': return <Zap size={18} style={{ color: 'var(--color-warning)' }} />;
      case 'phone': return <Phone size={18} style={{ color: 'var(--color-accent)' }} />;
      case 'internet': return <Globe size={18} style={{ color: 'var(--color-info)' }} />;
      default: return <FileText size={18} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  
  // Calculate this month's stats
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const currentMonthPayments = bills.reduce((sum, b) => {
    const pay = b.payments?.find(p => p.month === currentMonth && p.year === currentYear);
    return sum + (pay ? pay.amount : 0);
  }, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Utility Connections</h1>
          <p>Manage your recurring bill accounts and make monthly payments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsConnModalOpen(true)}>
          <Plus size={18} /> Add Connection
        </button>
      </div>

      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Paid This Month</span>
            <DollarSign size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <h2 className="metric-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(currentMonthPayments)}</h2>
            <p className="metric-desc">Total paid in {new Date(currentYear, currentMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Connections</span>
            <Zap size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div>
            <h2 className="metric-value">{bills.length}</h2>
            <p className="metric-desc">Registered utility accounts</p>
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem' }}>
        <h3 style={{ margin: '1rem', color: 'var(--text-primary)' }}>My Connections</h3>
        {loading ? <p style={{ margin: '2rem', color: 'var(--text-secondary)' }}>Loading...</p> : 
          bills.length === 0 ? <p style={{ margin: '2rem', color: 'var(--text-muted)' }}>No connections yet.</p> : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Connection</th>
                    <th>Service No.</th>
                    <th>Recent Payment</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map(bill => {
                    const sortedPayments = [...(bill.payments || [])].sort((a,b) => new Date(b.datePaid) - new Date(a.datePaid));
                    const lastPay = sortedPayments[0];
                    return (
                      <tr key={bill._id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {getBillIcon(bill.type)}
                            <div>
                              <div style={{ fontWeight: 600 }}>{bill.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{bill.type}</div>
                            </div>
                          </div>
                        </td>
                        <td>{bill.serviceNo || '—'}</td>
                        <td>
                          {lastPay ? (
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(lastPay.amount)}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(lastPay.datePaid).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>No payments yet</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => { setSelectedBill(bill); setIsPaymentModalOpen(true); }}>
                              Add Payment
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '4px' }} onClick={() => {
                              alert(sortedPayments.length > 0 ? sortedPayments.map(p => `${p.month}/${p.year}: ${formatCurrency(p.amount)}`).join('\n') : 'No history');
                            }}>
                              <List size={16} />
                            </button>
                            <button className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '4px' }} onClick={() => handleDelete(bill._id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
        )}
      </div>

      {isConnModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add Utility Connection</h2>
            <form onSubmit={handleConnSubmit} style={{ marginTop: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" value={connFormData.type} onChange={e => setConnFormData({...connFormData, type: e.target.value})}>
                  {config.billTypes?.length ? config.billTypes.map(t => <option key={t} value={t}>{t}</option>) : (
                    <><option value="electricity">Electricity</option><option value="internet">Internet</option></>
                  )}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Connection Name</label>
                <input className="form-control" placeholder="e.g. Home Electricity" required value={connFormData.name} onChange={e => setConnFormData({...connFormData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Service No / Account ID</label>
                <input className="form-control" placeholder="Optional" value={connFormData.serviceNo} onChange={e => setConnFormData({...connFormData, serviceNo: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsConnModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Connection</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPaymentModalOpen && selectedBill && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Record Payment: {selectedBill.name}</h2>
            <form onSubmit={handlePaymentSubmit} style={{ marginTop: '1.5rem' }}>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Month</label>
                  <input type="number" min="1" max="12" className="form-control" required value={paymentFormData.month} onChange={e => setPaymentFormData({...paymentFormData, month: parseInt(e.target.value)})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Year</label>
                  <input type="number" min="2000" className="form-control" required value={paymentFormData.year} onChange={e => setPaymentFormData({...paymentFormData, year: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date Paid</label>
                <input type="date" className="form-control" required value={paymentFormData.datePaid} onChange={e => setPaymentFormData({...paymentFormData, datePaid: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Amount Paid</label>
                <input type="number" step="0.01" className="form-control" required value={paymentFormData.amount} onChange={e => setPaymentFormData({...paymentFormData, amount: parseFloat(e.target.value)})} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
