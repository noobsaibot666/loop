import React from "react";

interface HeroProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  image: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  badgeDurationMs?: number;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, image, actions, badge, badgeDurationMs = 5500 }) => {
  const [badgeVisible, setBadgeVisible] = React.useState(false);
  const [shouldRenderBadge, setShouldRenderBadge] = React.useState(false);

  React.useEffect(() => {
    if (!badge) return;
    const showTimer = window.setTimeout(() => {
      setShouldRenderBadge(true);
      setBadgeVisible(true);
    }, 400);
    const hideTimer = window.setTimeout(() => setBadgeVisible(false), badgeDurationMs);
    const removeTimer = window.setTimeout(() => setShouldRenderBadge(false), badgeDurationMs + 700);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, [badge, badgeDurationMs]);

  return (
    <section className="hero-hub">
      <div className="hero-bg-visual">
        <img src={image} alt="Hero" className="hero-image-raw" />
        <div className="hero-image-overlay" />
        {badge && shouldRenderBadge && (
          <div className={`hero-badge-container ${badgeVisible ? "pill-appear" : "pill-hide"}`}>
            {badge}
          </div>
        )}
      </div>

      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-header">
            {title}
          </h1>
          <p className="hero-subheader">
            {subtitle}
          </p>
          {actions && <div className="hero-actions">{actions}</div>}
        </div>
      </div>
    </section>
  );
};

export default Hero;
