import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import RecentActivity from './RecentActivity.jsx';

// Sample data for summary cards
const summaryData = [
  { title: 'Total Bills', value: '₹ 12,340', color: 'var(--color-primary)' },
  { title: 'Pending Payments', value: '₹ 3,210', color: 'var(--color-danger)' },
  { title: 'Paid Bills', value: '₹ 9,130', color: 'var(--color-success)' },
];

// Sample chart data (reuse from Reports)
const chartData = [
  { name: 'Jan', bills: 1200 },
  { name: 'Feb', bills: 1100 },
  { name: 'Mar', bills: 1400 },
  { name: 'Apr', bills: 900 },
  { name: 'May', bills: 1300 },
  { name: 'Jun', bills: 1500 },
];

export default function Landing() {
  return (
    <div className="hero-section">
      <h1 className="hero-title">Welcome to Mahesh Finance</h1>
      <p className="hero-subtitle">Track your utilities, loans, and assets with a sleek glass‑morphic UI.</p>
      <div className="summary-cards">
        {summaryData.map((item) => (
          <div key={item.title} className="glass-card summary-card" style={{ borderTop: `4px solid ${item.color}` }}>
            <h3>{item.title}</h3>
            <p>{item.value}</p>
          </div>
        ))}
      </div>
      <div className="chart-container glass-card" style={{ marginTop: '2rem', padding: '1rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Bills Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <XAxis dataKey="name" stroke="var(--text-muted)" />
            <YAxis stroke="var(--text-muted)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'none' }} />
            <Bar dataKey="bills" fill="var(--color-primary)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <RecentActivity />
    </div>
  );
}
