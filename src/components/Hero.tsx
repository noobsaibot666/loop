import React from "react";

interface HeroProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  image: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, image, actions, badge }) => {
  return (
    <section className="hero-hub">
      <div className="hero-bg-visual">
        <img src={image} alt="Hero" className="hero-image-raw" />
        <div className="hero-image-overlay" />
        {badge && (
          <div className="hero-badge-container">
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
