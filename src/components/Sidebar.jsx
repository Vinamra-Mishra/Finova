import React, { useState, useEffect } from 'react';
import { LayoutDashboard, CreditCard, TrendingUp, Landmark, PiggyBank, Sun, Moon, Download, WifiOff, Zap } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'expenses', label: 'Expenses', icon: CreditCard },
  { id: 'investments', label: 'Portfolio', icon: TrendingUp },
  { id: 'emi', label: 'EMI Calc', icon: Landmark },
  { id: 'sip', label: 'SIP Calc', icon: PiggyBank },
];

export default function Sidebar({ currentTab, setCurrentTab, theme, toggleTheme }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleInstallPrompt = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <aside className="sidebar">
      {/* ─── Logo ─────────────────── */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Zap size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div className="sidebar-logo-name">Finova</div>
          <div className="sidebar-logo-sub">Personal Finance</div>
        </div>
      </div>

      {/* ─── Navigation ───────────── */}
      <nav className="sidebar-nav">
        <p className="sidebar-nav-section">Menu</p>
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => setCurrentTab(id)}
              className={`sidebar-nav-item ${active ? 'active' : ''}`}
            >
              <span className="sidebar-nav-icon">
                <Icon size={17} strokeWidth={active ? 2.5 : 1.75} />
              </span>
              <span className="sidebar-nav-label">{label}</span>
              {active && <span className="sidebar-nav-active-dot" />}
            </button>
          );
        })}
      </nav>

      {/* ─── Footer ───────────────── */}
      <div className="sidebar-footer">
        {isOffline && (
          <div className="sidebar-offline">
            <WifiOff size={13} />
            <span>Offline Mode</span>
          </div>
        )}

        {deferredPrompt && (
          <div className="pwa-card">
            <div className="pwa-card-header">
              <Download size={14} />
              <span>Install Finova</span>
            </div>
            <p className="pwa-card-desc">Add to your home screen for the best experience.</p>
            <button onClick={handleInstallClick} className="apple-btn apple-btn-primary" style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem', borderRadius: '10px' }}>
              Install App
            </button>
          </div>
        )}

        <button onClick={toggleTheme} className="theme-btn">
          {theme === 'light'
            ? <><Moon size={15} /><span>Dark Mode</span></>
            : <><Sun size={15} /><span>Light Mode</span></>
          }
        </button>
      </div>

      <style>{`
        /* ── Sidebar Shell ── */
        .sidebar {
          width: var(--sidebar-width);
          min-width: var(--sidebar-width);
          background: var(--bg-secondary);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1.25rem;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 200;
          transition: background 0.3s ease, border-color 0.3s ease;
        }

        /* ── Logo ── */
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.25rem;
          padding: 0 0.25rem;
        }
        .sidebar-logo-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--accent-gradient);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
          flex-shrink: 0;
        }
        .sidebar-logo-name {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .sidebar-logo-sub {
          font-size: 0.7rem;
          color: var(--text-tertiary);
          font-weight: 400;
          margin-top: 2px;
        }

        /* ── Nav ── */
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }
        .sidebar-nav-section {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
          padding: 0 0.75rem;
          margin-bottom: 0.4rem;
        }
        .sidebar-nav-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0.75rem;
          border-radius: 12px;
          background: transparent;
          color: var(--text-secondary);
          border: none;
          cursor: pointer;
          font-family: var(--font-family);
          font-weight: 500;
          font-size: 0.9rem;
          text-align: left;
          width: 100%;
          transition: background 0.15s ease, color 0.15s ease;
        }
        .sidebar-nav-item:hover {
          background: var(--input-bg);
          color: var(--text-primary);
        }
        .sidebar-nav-item.active {
          background: var(--accent-light);
          color: var(--accent-color);
          font-weight: 600;
        }
        .sidebar-nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          flex-shrink: 0;
        }
        .sidebar-nav-label {
          flex: 1;
        }
        .sidebar-nav-active-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-color);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        /* ── Footer ── */
        .sidebar-footer {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid var(--border-color);
        }
        .sidebar-offline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 0.45rem;
          border-radius: 8px;
          background: var(--danger-light);
          color: var(--danger);
          font-size: 0.78rem;
          font-weight: 600;
          animation: pulse-dot 2s ease infinite;
        }
        .pwa-card {
          padding: 0.9rem;
          border-radius: 14px;
          background: var(--input-bg);
          border: 1px solid var(--border-color);
        }
        .pwa-card-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 600;
          font-size: 0.82rem;
          color: var(--text-primary);
          margin-bottom: 0.35rem;
        }
        .pwa-card-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 0.75rem;
        }
        .theme-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem;
          border-radius: 12px;
          background: var(--input-bg);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
          cursor: pointer;
          font-family: var(--font-family);
          font-weight: 500;
          font-size: 0.85rem;
          transition: var(--transition-fast);
          width: 100%;
        }
        .theme-btn:hover {
          background: var(--border-strong);
        }

        /* ── Mobile Bottom Bar ── */
        @media (max-width: 768px) {
          .sidebar {
            width: 100%;
            min-width: 0;
            height: auto;
            flex-direction: row;
            align-items: center;
            padding: 0 0.75rem;
            padding-bottom: env(safe-area-inset-bottom, 0);
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            top: auto;
            border-right: none;
            border-top: 1px solid var(--border-color);
            height: 56px;
            background: var(--glass-bg);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
          }
          .sidebar-logo,
          .sidebar-nav-section,
          .sidebar-nav-active-dot,
          .sidebar-footer {
            display: none;
          }
          .sidebar-nav {
            flex-direction: row;
            justify-content: space-around;
            align-items: center;
            flex: 1;
            gap: 0;
          }
          .sidebar-nav-item {
            flex-direction: column;
            align-items: center;
            padding: 0.35rem 0.5rem;
            font-size: 0.6rem;
            gap: 0.2rem;
            border-radius: 10px;
            flex: 1;
            max-width: 68px;
          }
          .sidebar-nav-label {
            font-size: 0.6rem;
            flex: none;
          }
          .sidebar-nav-icon {
            width: auto;
          }
        }
      `}</style>
    </aside>
  );
}
