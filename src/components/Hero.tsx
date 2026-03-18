import React from "react";

interface HeroProps {
  title: React.ReactNode;
  subtitle: React.ReactNode;
  image: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

const Hero: React.FC<HeroProps> = ({ title, subtitle, image, actions, badge }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const [shouldRender, setShouldRender] = React.useState(false);

  React.useEffect(() => {
    // Delay appearance by 500ms
    const showTimer = setTimeout(() => {
      setShouldRender(true);
      setIsVisible(true);
    }, 500);

    // Start exit animation after 5.5 seconds (0.5s delay + 5s visibility)
    const hideTimer = setTimeout(() => setIsVisible(false), 5500);
    
    // Remove from DOM after animation completes
    const removeTimer = setTimeout(() => setShouldRender(false), 6500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <section className="hero-hub">
      <div className="hero-bg-visual">
        <img src={image} alt="Hero" className="hero-image-raw" />
        <div className="hero-image-overlay" />
        {badge && shouldRender && (
          <div className={`hero-badge-container ${isVisible ? 'pill-appear' : 'pill-hide'}`}>
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
