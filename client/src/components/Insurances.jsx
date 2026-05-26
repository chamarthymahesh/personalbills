import React, { useEffect, useState } from 'react';
import { Shield, Plus, Calendar, AlertCircle, CheckCircle, Trash2, Heart, Award, ShieldAlert } from 'lucide-react';

export default function Insurances() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dropdowns, setDropdowns] = useState({ cars: [], insurances: [], projects: [], rentals: [], contacts: [] });

  // Form State
  const [formData, setFormData] = useState({
    type: 'term',
    provider: 'Tata AIG',
    policyName: '',
    policyNumber: '',
    premiumAmount: '',
    frequency: 'yearly',
    dueDate: '',
    carName: '',
    notes: ''
  });

  useEffect(() => {
    fetchPolicies();
    fetchDropdowns();
  }, []);

  const fetchDropdowns = () => {
    fetch('/api/dropdowns')
      .then(res => res.json())
      .then(data => setDropdowns(data))
      .catch(err => console.error('Error fetching dropdowns:', err));
  };

  const fetchPolicies = () => {
    setLoading(true);
    fetch('/api/insurances')
      .then(res => res.json())
      .then(data => {
        setPolicies(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching policies:', err);
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.provider || !formData.policyName || !formData.premiumAmount || !formData.dueDate) {
      alert('Please fill out all required fields.');
      return;
    }

    fetch('/api/insurances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
      .then(res => res.json())
      .then(() => {
        setIsModalOpen(false);
        setFormData({
          type: 'term',
          provider: 'Tata AIG',
          policyName: '',
          policyNumber: '',
          premiumAmount: '',
          frequency: 'yearly',
          dueDate: '',
          carName: '',
          notes: ''
        });
        fetchPolicies();
      })
      .catch(err => console.error('Error creating policy:', err));
  };

  const handleUpdateStatus = (id, newStatus) => {
    fetch(`/api/insurances/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
      .then(() => fetchPolicies())
      .catch(err => console.error('Error updating status:', err));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    fetch(`/api/insurances/${id}`, { method: 'DELETE' })
      .then(() => fetchPolicies())
      .catch(err => console.error('Error deleting policy:', err));
  };

  const getPolicyIcon = (type) => {
    switch (type) {
      case 'term': return <Award size={20} style={{ color: 'var(--color-primary)' }} />;
      case 'health': return <Heart size={20} style={{ color: 'var(--color-danger)' }} />;
      case 'car': return <Shield size={20} style={{ color: 'var(--color-info)' }} />;
      default: return <ShieldAlert size={20} style={{ color: 'var(--text-secondary)' }} />;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const upcomingRenewalsCount = policies.filter(p => {
    const diffTime = new Date(p.dueDate) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return p.status === 'active' && diffDays >= 0 && diffDays <= 30;
  }).length;

  return (
    <div>
      <div className="page-header">
        <div className="page-title-section">
          <h1>Insurance Policies</h1>
          <p>Maintain Tata AIG, Term Insurance, Car Insurances, Health, and other premiums in one central vault.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add Policy
        </button>
      </div>

      {/* Insurance Metrics */}
      <div className="metrics-grid">
        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Policies</span>
            <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <h2 className="metric-value" style={{ color: 'var(--color-success)' }}>
              {policies.filter(p => p.status === 'active').length} Active
            </h2>
            <p className="metric-desc">Valid policies protecting assets</p>
          </div>
        </div>

        <div className="glass-card metric-card">
          <div className="metric-header">
            <span className="metric-title">Upcoming Renewals (30 Days)</span>
            <AlertCircle size={20} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div>
            <h2 className="metric-value" style={{ color: 'var(--color-warning)' }}>
              {upcomingRenewalsCount} Renewal{upcomingRenewalsCount !== 1 ? 's' : ''}
            </h2>
            <p className="metric-desc">Due in the next 30 days</p>
          </div>
        </div>
      </div>

      {/* Policies Grid */}
      <h3 style={{ marginBottom: '1.5rem', color: 'white' }}>Current Policies</h3>
      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading policies...</p>
      ) : policies.length === 0 ? (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No insurance policies added yet. Secure your future and list one now.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {policies.map(p => {
            const diffTime = new Date(p.dueDate) - new Date();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return (
              <div key={p._id} className="glass-card" style={{ borderTop: `4px solid ${p.type === 'term' ? 'var(--color-primary)' : p.type === 'health' ? 'var(--color-danger)' : 'var(--color-info)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {getPolicyIcon(p.type)}
                    <div>
                      <h4 style={{ fontSize: '1.1rem', color: 'white' }}>{p.policyName}</h4>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.provider} ({p.type})</span>
                    </div>
                  </div>
                  <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                    {p.status}
                  </span>
                </div>

                <div style={{ margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Policy Number:</span>
                    <span style={{ color: 'white', fontWeight: 500 }}>{p.policyNumber || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Premium:</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{formatCurrency(p.premiumAmount)} / <span style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>{p.frequency}</span></span>
                  </div>
                  {p.carName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Linked Vehicle:</span>
                      <span style={{ color: 'white' }}>{p.carName}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Renewal Due:</span>
                    <span style={{ color: daysLeft <= 15 && p.status === 'active' ? 'var(--color-danger)' : 'white' }}>
                      {new Date(p.dueDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                    </span>
                  </div>
                </div>

                {p.status === 'active' && daysLeft > 0 && daysLeft <= 30 && (
                  <div style={{ 
                    background: 'var(--color-warning-glow)', 
                    color: 'var(--color-warning)', 
                    padding: '0.5rem', 
                    borderRadius: '6px', 
                    fontSize: '0.8rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    marginBottom: '1rem' 
                  }}>
                    <AlertCircle size={14} />
                    Renewal due in {daysLeft} day{daysLeft !== 1 ? 's' : ''}!
                  </div>
                )}

                {p.notes && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                    "{p.notes}"
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  {p.status === 'active' ? (
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleUpdateStatus(p._id, 'expired')}>
                      Set Expired
                    </button>
                  ) : (
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleUpdateStatus(p._id, 'active')}>
                      Activate
                    </button>
                  )}
                  <button className="btn btn-danger" style={{ padding: '0.35rem' }} onClick={() => handleDelete(p._id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>Add Insurance Policy</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Policy Type</label>
                <select className="form-control" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                  <option value="term">Term Insurance</option>
                  <option value="car">Car Insurance</option>
                  <option value="health">Health Insurance</option>
                  <option value="other">Other Insurance</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Provider Name (e.g. Tata AIG, LIC)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.provider} 
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Policy Name / Plan (e.g. Tata AIG Car Guard, Term Life Cover)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={formData.policyName} 
                  onChange={(e) => setFormData({ ...formData, policyName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Policy Number</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.policyNumber} 
                  onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Premium Amount (INR)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  required
                  value={formData.premiumAmount} 
                  onChange={(e) => setFormData({ ...formData, premiumAmount: parseFloat(e.target.value) || '' })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Premium Frequency</label>
                <select className="form-control" value={formData.frequency} onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="half-yearly">Half-Yearly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Renewal / Premium Due Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  required
                  value={formData.dueDate} 
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              {formData.type === 'car' && (
                <div className="form-group">
                  <label className="form-label">Associated Car Name (Optional)</label>
                  <select 
                    className="form-control" 
                    value={formData.carName} 
                    onChange={(e) => setFormData({ ...formData, carName: e.target.value })}
                  >
                    <option value="">-- Select Registered Car --</option>
                    {dropdowns.cars.map(c => (
                      <option key={c._id} value={c.name}>{c.name} {c.plateNumber ? `(${c.plateNumber})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea 
                  className="form-control" 
                  rows="2"
                  value={formData.notes} 
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
