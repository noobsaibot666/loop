import React from "react";
import { useI18n } from "../i18n";
import { useNavigate } from "react-router-dom";

const CommunityFunnelCard: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <section className="funnel-container reveals">
      <div className="glass-card funnel-card">
        <div className="funnel-content">
          <div className="funnel-text">
            <h2 className="funnel-title">Join the Inner Circle</h2>
            <p className="funnel-subtitle">Get unlimited loop generation, high-res proof uploads, and exclusive access to the Hardchain community.</p>
          </div>
          <div className="funnel-actions">
            <button className="primary-button" onClick={() => navigate('/loop#credits')}>
              Become a Member
            </button>
            <button className="ghost-button small" onClick={() => window.open('https://discord.gg/hardchain', '_blank')}>
              Join Discord
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityFunnelCard;
