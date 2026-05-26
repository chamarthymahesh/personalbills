import React, { useEffect, useState } from 'react';
import { FileText, Plus, CheckCircle, Trash2, Calendar, Phone, Zap, Globe, AlertTriangle } from 'lucide-react';

export default function Bills() {
  const [bills, setBills] = useState([]);
  const [config, setConfig] = useState({ utilityConnections: [], billTypes: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    type: 'electricity',
    name: '',
    serviceNo: '',
    amount: '',
    dueDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchBills();
    fetchConfig();
  }, []);

  const fetchConfig = () => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => {
        if (data) setConfig(data);
      })
      .catch(err => console.error('Error fetching config:', err));
  };

  const fetchBills = () => {
    setLoading(true);
    fetch('/api/bills')
      .then(res => res.json())
      .then(data => {
        setBills(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching bills:', err);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.dueDate) {
      alert('Please fill out all required fields.');
      return;
    }

    fetch('/api/bills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        setIsModalOpen(false);
        setFormData({ type: 'electricity', name: '', serviceNo: '', amount: '', dueDate: '', notes: '' });
        fetchBills();
      })
      .catch(err => console.error('Error creating bill:', err));
  };

  const handlePay = (id) => {
    fetch(`/api/bills/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'paid', paidDate: new Date() })
    })
      .then(res => res.json())
      .then(() => fetchBills())
      .catch(err => console.error('Error paying bill:', err));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this bill?')) return;
    fetch(`/api/bills/${id}`, { method: 'DELETE' })
      .then(() => fetchBills())
      .catch(err => console.error('Error deleting bill:', err));
  };

  const getBillIcon = (type) => {
    switch (type) {
      case 'electricity': return <Zap size={18} style={{ color: 'var(--color-warning)' }} />;
      case 'phone': return <Phone size={18} style={{ color: 'var(--color-accent)' }} />;
      case 'internet': return <Globe size={18} style={{ color: 'var(--color-info)' }} />;
      default: return <FileText size={18} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const totalPending = bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Utility & Phone Bills</h1>
          <p>Track your monthly recurring utilities, electricity bills, internet, and phone payments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add New Bill
        </button>
      </div>

      {/* Bill Metrics */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Outstanding Bills</span>
            <AlertTriangle size={20} style={{ color: 'var(--color-danger)' }} />
          </div>
          <div>
            <h2 className="metric-value" style={{ color: 'var(--color-danger)' }}>{formatCurrency(totalPending)}</h2>
            <p className="metric-desc">{bills.filter(b => b.status === 'pending').length} bills awaiting payment</p>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Paid (All Time)</span>
            <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <h2 className="metric-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalPaid)}</h2>
            <p className="metric-desc">{bills.filter(b => b.status === 'paid').length} bills paid successfully</p>
          </div>
        </div>
      </div>

      {/* Bills List Table */}
      <div className="glass-card" style={{ padding: '1rem' }}>
        <h3 style={{ margin: '1rem', color: 'var(--text-primary)' }}>All Utility Bills</h3>
        {loading ? (
          <p style={{ margin: '2rem', color: 'var(--text-secondary)' }}>Loading bills...</p>
        ) : bills.length === 0 ? (
          <p style={{ margin: '2rem', color: 'var(--text-muted)' }}>No utility bills tracked yet. Add your first bill using the button above.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Bill Name</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Payment Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getBillIcon(bill.type)}
                        <span style={{ textTransform: 'capitalize' }}>{bill.type}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{bill.name}</div>
                      {bill.serviceNo && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No: {bill.serviceNo}</div>}
                    </td>
                    <td style={{ fontWeight: 600, color: bill.status === 'pending' ? 'var(--color-danger)' : 'var(--text-primary)' }}>
                      {formatCurrency(bill.amount)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                        <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                        {new Date(bill.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${bill.status === 'paid' ? 'badge-success' : 'badge-pending'}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      {bill.paidDate ? (
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                          {new Date(bill.paidDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>—</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {bill.status === 'pending' && (
                          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handlePay(bill._id)}>
                            Mark as Paid
                          </button>
                        )}
                        <button className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '4px' }} onClick={() => handleDelete(bill._id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>Add Utility / Phone Bill</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Bill Category</label>
                <select 
                  className="form-control" 
                  value={formData.type} 
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  {config.billTypes && config.billTypes.length > 0 ? (
                    config.billTypes.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))
                  ) : (
                    <>
                      <option value="electricity">Electricity</option>
                      <option value="phone">Phone / Mobile Bill</option>
                      <option value="internet">Broadband / Internet</option>
                      <option value="water">Water Bill</option>
                      <option value="other">Other Bill</option>
                    </>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Service / Connection Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter or select from dropdown"
                  list="utilityConnections"
                  value={formData.serviceNo} 
                  onChange={(e) => setFormData({ ...formData, serviceNo: e.target.value })}
                />
                <datalist id="utilityConnections">
                  {config.utilityConnections?.map((conn, idx) => (
                    <option key={idx} value={conn} />
                  ))}
                </datalist>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Manage these in Admin Settings or type a new one directly.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Bill Name (e.g. Home Electric, Jio Office)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Enter name"
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount (INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  placeholder="Enter amount"
                  value={formData.amount} 
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || '' })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.dueDate} 
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Notes / Account Number (Optional)</label>
                <textarea 
                  className="form-control" 
                  placeholder="Enter remarks"
                  rows="3"
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
