import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Sample data for demonstration
const sampleData = [
  { name: 'Jan', bills: 1200 },
  { name: 'Feb', bills: 1100 },
  { name: 'Mar', bills: 1400 },
  { name: 'Apr', bills: 900 },
  { name: 'May', bills: 1300 },
  { name: 'Jun', bills: 1500 },
];

export default function Reports() {
  return (
    <div className="glass-card" style={{ padding: '2rem' }}>
      <h2 className="page-title" style={{ marginBottom: '1.5rem' }}>Financial Reports</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
        Overview of utility bill expenditures over the past months.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={sampleData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <XAxis dataKey="name" stroke="var(--text-muted)" />
          <YAxis stroke="var(--text-muted)" />
          <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', border: 'none' }} />
          <Bar dataKey="bills" fill="var(--color-primary)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
