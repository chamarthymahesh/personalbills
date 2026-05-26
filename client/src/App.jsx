import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Percent, 
  HardHat, 
  Users, 
  Car, 
  Building,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Menu,
  X,
  Settings,
  Home
} from 'lucide-react';
import Login from './components/Login.jsx';
import Reports from './components/Reports.jsx';
import Landing from './components/Landing.jsx';

import Dashboard from './components/Dashboard';
import Bills from './components/Bills';
import Insurances from './components/Insurances';
import Loans from './components/Loans';
import Construction from './components/Construction';
import Debts from './components/Debts';
import Cars from './components/Cars';
import Rentals from './components/Rentals';
import AdminSettings from './components/AdminSettings';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };
  // Conditional render based on authentication
  if (!user) {
    return <Login />;
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home': return <Landing />;
      case 'dashboard': return <Dashboard />;
      case 'bills': return <Bills />;
      case 'insurances': return <Insurances />;
      case 'loans': return <Loans />;
      case 'construction': return <Construction />;
      case 'debts': return <Debts />;
      case 'cars': return <Cars />;
      case 'rentals': return <Rentals />;
      case 'admin': return <AdminSettings />;
      case 'reports': return <Reports />;
      default: return <Landing />;
    }
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home size={20} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'bills', label: 'Utility Bills', icon: <FileText size={20} /> },
    { id: 'insurances', label: 'Insurances Vault', icon: <ShieldCheck size={20} /> },
    { id: 'loans', label: 'Interest Loans', icon: <Percent size={20} /> },
    { id: 'construction', label: 'Construction Sites', icon: <HardHat size={20} /> },
    { id: 'debts', label: 'Friends & Family', icon: <Users size={20} /> },
    { id: 'cars', label: 'Car Fleet Logs', icon: <Car size={20} /> },
    { id: 'rentals', label: 'Rental Income', icon: <Building size={20} /> },
    { id: 'reports', label: 'Reports', icon: <FileText size={20} /> },
    { id: 'admin', label: 'Admin Settings', icon: <Settings size={20} /> }
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };



  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>

      {/* Mobile Menu Toggle Button */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile Overlay Backdrop */}
      {mobileMenuOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${mobileMenuOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Logo + Collapse Toggle */}
        <div className="sidebar-top">
          <div className="logo-container" onClick={() => handleNavClick('dashboard')}>
            <div className="logo-icon">M</div>
            <span className="logo-text">Mahesh Finance</span>
          </div>
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav>
          <ul className="nav-links">
            {navItems.map(item => (
              <li 
                key={item.id} 
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span className="nav-item-text">{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer with Logout */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
            <span className="logout-text">Logout</span>
          </button>
          <div className="footer-info">
            <p>© {new Date().getFullYear()} Mahesh Personal</p>
            <p style={{ marginTop: '0.2rem', color: 'var(--text-muted)' }}>Financial Ledger v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {renderActiveView()}
      </main>
    </div>
  );
}
