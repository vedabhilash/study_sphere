import React, { useState } from 'react';
import { Menu, X, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MobileHeader.css';

const MobileHeader = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (!user) return null;

  return (
    <div className="top-header-wrapper">
      {/* Top Green Promo Banner */}
      <div className="promo-banner" onClick={() => setShowUpgradeModal(true)}>
        <span className="promo-text">STUDYSPHERE PREMIUM SALE ❤️🤍💙</span>
        <button className="promo-btn">ONLY $9.95</button>
      </div>

      {/* Main Header Bar */}
      <header className="mobile-header">
        <div className="header-left">
          <button className="mobile-toggle-btn" onClick={onToggleSidebar} aria-label="Toggle Navigation Menu">
            <Menu size={24} />
          </button>

          <div className="mobile-brand-container">
            <span className="brand-primary">STUDYSPHERE</span>
            <span className="brand-accent">RAW</span>
          </div>
        </div>

        <button className="btn-get-access" onClick={() => setShowUpgradeModal(true)}>
          GET ACCESS &gt;&gt;
        </button>
      </header>

      {/* Premium Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title-raw">UNLOCK STUDYSPHERE <span className="text-red">RAW</span></h3>
              <button onClick={() => setShowUpgradeModal(false)} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="premium-price-box">
              <span className="premium-price-label">PREMIUM PASS</span>
              <h4 className="premium-price-value">$9.95 <span className="price-period">/ month</span></h4>
            </div>

            <ul className="premium-benefits-list">
              <li>
                <Check size={16} className="text-red" />
                <span>Unlimited High-Definition Video Calls</span>
              </li>
              <li>
                <Check size={16} className="text-red" />
                <span>Collaborative Interactive Whiteboards</span>
              </li>
              <li>
                <Check size={16} className="text-red" />
                <span>Advanced Goal Tracking & Metrics</span>
              </li>
              <li>
                <Check size={16} className="text-red" />
                <span>Priority Local-Network Peer Connections</span>
              </li>
            </ul>

            <button 
              onClick={() => { alert("Thank you for upgrading to StudySphere RAW!"); setShowUpgradeModal(false); }} 
              className="btn-upgrade-confirm"
            >
              UPGRADE NOW
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHeader;
