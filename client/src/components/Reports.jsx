import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid
} from 'recharts';
import {
  Zap, Droplets, Globe, Phone, Flame, FileText,
  TrendingUp, TrendingDown, IndianRupee, BarChart2,
  Filter, Calendar, Layers, Activity, Shield, Hammer, Car as CarIcon, Home
} from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const TYPE_CONFIG = {
  // Utilities
  electricity: { label: 'Electricity', color: '#f59e0b', icon: Zap },
  water:       { label: 'Water',       color: '#3b82f6', icon: Droplets },
  internet:    { label: 'Internet',    color: '#06b6d4', icon: Globe },
  phone:       { label: 'Phone',       color: '#8b5cf6', icon: Phone },
  gas:         { label: 'Gas',         color: '#f43f5e', icon: Flame },
  // Insurance
  term:        { label: 'Term Life',   color: '#8b5cf6', icon: Shield },
  health:      { label: 'Health',      color: '#ef4444', icon: Shield },
  car_ins:     { label: 'Car Ins.',    color: '#10b981', icon: Shield },
  life:        { label: 'Life',        color: '#6366f1', icon: Shield },
  property:    { label: 'Property',    color: '#f97316', icon: Shield },
  // Projects
  project:     { label: 'Project',     color: '#ec4899', icon: Hammer },
  // Cars
  maintenance: { label: 'Maintenance', color: '#14b8a6', icon: CarIcon },
  // Rentals
  rent:        { label: 'Rent',        color: '#84cc16', icon: Home },
  other:       { label: 'Other',       color: '#71717a', icon: FileText },
};

const CATEGORY_CONFIG = {
  'Utilities': { color: '#3b82f6' },
  'Insurance': { color: '#8b5cf6' },
  'Construction': { color: '#ec4899' },
  'Car': { color: '#14b8a6' },
  'Rental Income': { color: '#84cc16' }
};

const fmt = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v || 0);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(13,13,15,0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 16px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
    }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: '0.8rem' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill, fontWeight: 600, margin: '2px 0' }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>{label}</span>
      <span style={{
        background: `${color}20`, padding: '6px', borderRadius: 8,
        display: 'flex', alignItems: 'center'
      }}>
        <Icon size={16} style={{ color }} />
      </span>
    </div>
    <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{value}</h2>
    {sub && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: trend < 0 ? 'var(--color-success)' : trend > 0 ? 'var(--color-danger)' : 'var(--text-muted)' }}>
        {trend < 0 ? <TrendingDown size={13} /> : trend > 0 ? <TrendingUp size={13} /> : null}
        <span>{sub}</span>
      </div>
    )}
  </div>
);

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedCategory, setSelectedCategory] = useState('All Outflows');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedConn, setSelectedConn] = useState('all');

  useEffect(() => {
    Promise.all([
      fetch('/api/bills').then(r => r.json()),
      fetch('/api/insurances').then(r => r.json()),
      fetch('/api/construction').then(r => r.json()),
      fetch('/api/cars').then(r => r.json()),
      fetch('/api/rentals').then(r => r.json())
    ])
    .then(([bills, insurances, projects, cars, rentals]) => {
      let normalized = [];

      // Utilities
      (Array.isArray(bills) ? bills : []).forEach(b => {
        normalized.push({
          _id: b._id, category: 'Utilities', type: b.type, name: b.name, flow: 'outflow', status: b.status,
          payments: (b.payments || []).map(p => ({ amount: p.amount, month: p.month, year: p.year }))
        });
      });

      // Insurances
      (Array.isArray(insurances) ? insurances : []).forEach(i => {
        normalized.push({
          _id: i._id, category: 'Insurance', type: i.type, name: i.policyName, flow: 'outflow', status: i.status,
          payments: (i.payments || []).map(p => ({ amount: p.amount, month: p.month, year: p.year }))
        });
      });

      // Construction
      (Array.isArray(projects) ? projects : []).forEach(p => {
        normalized.push({
          _id: p._id, category: 'Construction', type: 'project', name: p.projectName, flow: 'outflow', status: p.status,
          payments: (p.expenses || []).map(e => {
            const d = new Date(e.date);
            return { amount: e.amount, month: d.getMonth() + 1, year: d.getFullYear() };
          })
        });
      });

      // Cars
      (Array.isArray(cars) ? cars : []).forEach(c => {
        normalized.push({
          _id: c._id, category: 'Car', type: 'maintenance', name: c.name, flow: 'outflow', status: 'active',
          payments: (c.maintenanceLog || []).map(m => {
            const d = new Date(m.date);
            return { amount: m.cost, month: d.getMonth() + 1, year: d.getFullYear() };
          })
        });
      });

      // Rentals (Income)
      (Array.isArray(rentals) ? rentals : []).forEach(r => {
        normalized.push({
          _id: r._id, category: 'Rental Income', type: 'rent', name: r.tenantName || r.unitNumber, flow: 'inflow', status: r.status,
          payments: (r.payments || []).map(p => ({ amount: p.amountPaid, month: p.month, year: p.year }))
        });
      });

      setData(normalized);
      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching reports data:', err);
      setLoading(false);
    });
  }, []);

  // --- Filter Logic ---
  const filteredByCategory = useMemo(() => {
    if (selectedCategory === 'All Outflows') return data.filter(d => d.flow === 'outflow');
    return data.filter(d => d.category === selectedCategory);
  }, [data, selectedCategory]);

  const filteredByType = useMemo(() => {
    if (selectedType === 'all') return filteredByCategory;
    return filteredByCategory.filter(b => b.type === selectedType);
  }, [filteredByCategory, selectedType]);

  const filteredData = useMemo(() => {
    if (selectedConn === 'all') return filteredByType;
    return filteredByType.filter(b => b._id === selectedConn);
  }, [filteredByType, selectedConn]);

  // --- Derived: available years across all payments
  const availableYears = useMemo(() => {
    const yrs = new Set();
    filteredByCategory.forEach(b => b.payments?.forEach(p => yrs.add(p.year)));
    if (yrs.size === 0) yrs.add(new Date().getFullYear());
    return [...yrs].sort((a, b) => b - a);
  }, [filteredByCategory]);

  const allTypes = [...new Set(filteredByCategory.map(b => b.type))];

  // --- 1. Monthly trend for selected year & filters
  const monthlyTrend = useMemo(() => {
    return MONTHS.map((name, idx) => {
      const month = idx + 1;
      const total = filteredData.reduce((sum, b) => {
        const p = b.payments?.find(p => p.month === month && p.year === selectedYear);
        return sum + (p ? p.amount : 0);
      }, 0);
      return { name, total };
    });
  }, [filteredData, selectedYear]);

  // --- 2. Breakdown Pie Chart (Category or Type)
  const breakdownData = useMemo(() => {
    const map = {};
    filteredByCategory.forEach(b => {
      const groupKey = selectedCategory === 'All Outflows' ? b.category : b.type;
      b.payments?.filter(p => p.year === selectedYear).forEach(p => {
        map[groupKey] = (map[groupKey] || 0) + p.amount;
      });
    });
    return Object.entries(map)
      .map(([key, amount]) => {
        let label = key;
        let color = '#71717a';
        if (selectedCategory === 'All Outflows') {
          color = CATEGORY_CONFIG[key]?.color || color;
        } else {
          label = TYPE_CONFIG[key]?.label || key;
          color = TYPE_CONFIG[key]?.color || color;
        }
        return { name: label, amount, color };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredByCategory, selectedYear, selectedCategory]);

  // --- 3. Connection-wise total for selected year & type filter
  const connectionWise = useMemo(() => {
    return filteredByType
      .map(b => {
        const total = b.payments?.filter(p => p.year === selectedYear).reduce((sum, p) => sum + p.amount, 0) || 0;
        return { name: b.name, type: b.type, total, color: TYPE_CONFIG[b.type]?.color || '#71717a', category: b.category };
      })
      .filter(c => c.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [filteredByType, selectedYear]);

  // --- 4. Year-over-Year comparison
  const yoyData = useMemo(() => {
    const prevYear = selectedYear - 1;
    return MONTHS.map((name, idx) => {
      const month = idx + 1;
      const current = filteredData.reduce((sum, b) => {
        const p = b.payments?.find(p => p.month === month && p.year === selectedYear);
        return sum + (p ? p.amount : 0);
      }, 0);
      const previous = filteredData.reduce((sum, b) => {
        const p = b.payments?.find(p => p.month === month && p.year === prevYear);
        return sum + (p ? p.amount : 0);
      }, 0);
      return { name, [selectedYear]: current, [prevYear]: previous };
    });
  }, [filteredData, selectedYear]);

  // --- 5. Summary stats
  const { totalAmount, prevYearTotal, highestMonth } = useMemo(() => {
    const prevYear = selectedYear - 1;
    let total = 0, prevTotal = 0, highest = { name: '—', val: 0 };

    MONTHS.forEach((name, idx) => {
      const month = idx + 1;
      const monthTotal = filteredData.reduce((sum, b) => {
        const p = b.payments?.find(p => p.month === month && p.year === selectedYear);
        return sum + (p ? p.amount : 0);
      }, 0);
      total += monthTotal;
      if (monthTotal > highest.val) highest = { name, val: monthTotal };

      const prevMonthTotal = filteredData.reduce((sum, b) => {
        const p = b.payments?.find(p => p.month === month && p.year === prevYear);
        return sum + (p ? p.amount : 0);
      }, 0);
      prevTotal += prevMonthTotal;
    });

    return { totalAmount: total, prevYearTotal: prevTotal, highestMonth: highest };
  }, [filteredData, selectedYear]);

  const trendPct = prevYearTotal > 0 ? ((totalAmount - prevYearTotal) / prevYearTotal * 100).toFixed(1) : null;
  const isIncome = selectedCategory === 'Rental Income';

  // --- 6. Detailed ledger for selected year
  const ledger = useMemo(() => {
    return filteredData
      .map(b => {
        const payments = MONTHS.map((_, idx) => {
          const month = idx + 1;
          return b.payments?.find(p => p.month === month && p.year === selectedYear) || null;
        });
        const yearTotal = payments.reduce((s, p) => s + (p ? p.amount : 0), 0);
        return { ...b, monthlyPayments: payments, yearTotal };
      })
      .filter(b => b.yearTotal > 0);
  }, [filteredData, selectedYear]);

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Loading unified reports...</div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.5s ease' }}>

      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BarChart2 size={28} style={{ color: 'var(--color-primary)' }} />
            Unified Reports Dashboard
          </h1>
          <p>Comprehensive analytics across utilities, insurances, construction, and more.</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="glass-card" style={{ padding: '1rem 1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
            <Filter size={16} /> <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filters:</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <select className="form-control" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={14} style={{ color: 'var(--text-muted)' }} />
            <select className="form-control" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedType('all'); setSelectedConn('all'); }}>
              <option value="All Outflows">All Outflows (Summary)</option>
              <option value="Utilities">Utilities</option>
              <option value="Insurance">Insurances</option>
              <option value="Construction">Construction</option>
              <option value="Car">Car Maintenance</option>
              <option value="Rental Income">Rental Income (Inflow)</option>
            </select>
          </div>

          {selectedCategory !== 'All Outflows' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={14} style={{ color: 'var(--text-muted)' }} />
              <select className="form-control" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                value={selectedType} onChange={e => { setSelectedType(e.target.value); setSelectedConn('all'); }}>
                <option value="all">All Types</option>
                {allTypes.map(t => <option key={t} value={t}>{TYPE_CONFIG[t]?.label || t}</option>)}
              </select>
            </div>
          )}

          {selectedCategory !== 'All Outflows' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={14} style={{ color: 'var(--text-muted)' }} />
              <select className="form-control" style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                value={selectedConn} onChange={e => setSelectedConn(e.target.value)}>
                <option value="all">All Records</option>
                {filteredByType.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard
          icon={IndianRupee}
          label={isIncome ? `Total Received ${selectedYear}` : `Total Spend ${selectedYear}`}
          value={fmt(totalAmount)}
          color={isIncome ? "var(--color-success)" : "var(--color-primary)"}
          sub={trendPct ? `${trendPct > 0 ? '+' : ''}${trendPct}% vs ${selectedYear - 1}` : `No ${selectedYear - 1} data`}
          trend={isIncome ? parseFloat(trendPct) : -parseFloat(trendPct)}
        />
        <StatCard
          icon={TrendingUp}
          label="Highest Month"
          value={highestMonth.val > 0 ? highestMonth.name : '—'}
          sub={highestMonth.val > 0 ? fmt(highestMonth.val) : 'No payments recorded'}
          color="var(--color-warning)"
        />
        <StatCard
          icon={Activity}
          label="Active Tracking"
          value={filteredByType.filter(b => b.status === 'active' || b.status === 'ongoing').length}
          sub={`of ${filteredByType.length} total filtered`}
          color="var(--color-info)"
        />
      </div>

      {/* ── Monthly Trend ── */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp size={18} style={{ color: isIncome ? 'var(--color-success)' : 'var(--color-primary)' }} />
          Monthly {isIncome ? 'Income' : 'Spend'} Trend — {selectedYear}
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="total" name={isIncome ? "Total Received" : "Total Spend"} radius={[6,6,0,0]} fill="url(#barGrad)" />
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isIncome ? 'var(--color-success)' : 'var(--color-primary)'} stopOpacity={0.9} />
                <stop offset="100%" stopColor={isIncome ? 'var(--color-success)' : 'var(--color-primary)'} stopOpacity={0.3} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Type Breakdown + Connection-wise ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1.5rem' }}>
        {/* Pie: Breakdown */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers size={18} style={{ color: 'var(--color-accent)' }} />
            {selectedCategory === 'All Outflows' ? 'By Category' : 'By Sub-type'}
          </h3>
          {breakdownData.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No data for {selectedYear}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={breakdownData} dataKey="amount" nameKey="name"
                  cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                  paddingAngle={3} strokeWidth={0}>
                  {breakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(val, entry) => (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {val} — {fmt(entry.payload?.amount)}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: Connection-wise */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} style={{ color: 'var(--color-info)' }} />
            Record-wise Total — {selectedYear}
          </h3>
          {connectionWise.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No data for {selectedYear}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={connectionWise} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" tick={{ fontSize: 11 }}
                  tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 11 }} width={120} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" name="Total" radius={[0,6,6,0]}>
                  {connectionWise.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Year-over-Year Line Chart ── */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BarChart2 size={18} style={{ color: 'var(--color-warning)' }} />
          Year-over-Year Comparison — {selectedYear - 1} vs {selectedYear}
        </h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={yoyData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" stroke="var(--text-muted)" tick={{ fontSize: 12 }} />
            <YAxis stroke="var(--text-muted)" tick={{ fontSize: 12 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={val => <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{val}</span>} />
            <Line type="monotone" dataKey={selectedYear - 1} name={`${selectedYear - 1}`}
              stroke="rgba(139,92,246,0.5)" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: 'rgba(139,92,246,0.5)' }} />
            <Line type="monotone" dataKey={selectedYear} name={`${selectedYear}`}
              stroke={isIncome ? 'var(--color-success)' : 'var(--color-primary)'} strokeWidth={2.5} dot={{ r: 4, fill: isIncome ? 'var(--color-success)' : 'var(--color-primary)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Detailed Monthly Ledger Table ── */}
      <div className="glass-card" style={{ overflowX: 'auto' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} style={{ color: 'var(--color-success)' }} />
          Monthly Ledger — {selectedYear}
        </h3>

        {ledger.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No payment data found for this selection.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, minWidth: 140 }}>Record Name</th>
                <th style={{ textAlign: 'left', padding: '0.6rem 0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Category</th>
                {MONTHS.map(m => (
                  <th key={m} style={{ textAlign: 'center', padding: '0.6rem 0.5rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, minWidth: 62 }}>{m}</th>
                ))}
                <th style={{ textAlign: 'right', padding: '0.6rem 0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', fontWeight: 600 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((b, ri) => {
                const TypeIcon = TYPE_CONFIG[b.type]?.icon || (CATEGORY_CONFIG[b.category]?.color ? FileText : FileText);
                const typeColor = TYPE_CONFIG[b.type]?.color || CATEGORY_CONFIG[b.category]?.color || '#71717a';
                return (
                  <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: ri % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
                    <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {b.name}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: `${typeColor}18`, color: typeColor, padding: '2px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600 }}>
                        <TypeIcon size={11} /> {TYPE_CONFIG[b.type]?.label || b.category}
                      </span>
                    </td>
                    {b.monthlyPayments.map((pay, mi) => (
                      <td key={mi} style={{ textAlign: 'center', padding: '0.6rem 0.5rem' }}>
                        {pay ? (
                          <span style={{ color: isIncome ? 'var(--color-success)' : 'var(--color-primary)', fontWeight: 600 }}>
                            ₹{pay.amount >= 1000 ? (pay.amount / 1000).toFixed(1) + 'k' : pay.amount}
                          </span>
                        ) : (
                          <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '1rem' }}>—</span>
                        )}
                      </td>
                    ))}
                    <td style={{ textAlign: 'right', padding: '0.6rem 0.8rem', fontWeight: 700, color: isIncome ? 'var(--color-success)' : 'var(--color-primary)' }}>
                      {fmt(b.yearTotal)}
                    </td>
                  </tr>
                );
              })}

              {/* Grand Total Row */}
              <tr style={{ borderTop: '2px solid var(--border-color)', background: isIncome ? 'rgba(16,185,129,0.06)' : 'rgba(139,92,246,0.06)' }}>
                <td colSpan={2} style={{ padding: '0.75rem 0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>Grand Total</td>
                {MONTHS.map((_, mi) => {
                  const monthTotal = ledger.reduce((s, b) => s + (b.monthlyPayments[mi]?.amount || 0), 0);
                  return (
                    <td key={mi} style={{ textAlign: 'center', padding: '0.75rem 0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {monthTotal > 0 ? <span>₹{monthTotal >= 1000 ? (monthTotal / 1000).toFixed(1) + 'k' : monthTotal}</span> : <span style={{ color: 'rgba(255,255,255,0.15)' }}>—</span>}
                    </td>
                  );
                })}
                <td style={{ textAlign: 'right', padding: '0.75rem 0.8rem', fontWeight: 700, color: isIncome ? 'var(--color-success)' : 'var(--color-primary)', fontSize: '1rem' }}>
                  {fmt(ledger.reduce((s, b) => s + b.yearTotal, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
