import React from "react";

interface HeroProps {
  title: string;
  subtitle: React.ReactNode;
  image: string;
  actions?: React.ReactNode;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, image, actions }) => {
  return (
    <section className="hero-hub">
      <div className="hero-bg-visual">
        <img src={image} alt={title} className="hero-image-raw" />
        <div className="hero-image-overlay" />
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
