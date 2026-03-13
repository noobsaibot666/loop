import React from "react";
import homeHeroImage from "../images/hero1.jpg";

type HeroProps = {
    onOpenAlleycat: () => void;
};

const Hero: React.FC<HeroProps> = ({ onOpenAlleycat }) => {
    return (
        <section className="hero-hub novasite-layout">
            <div className="hero-bg-visual">
                <img src={homeHeroImage} alt="City Background" className="hero-image-raw" />
                <div className="hero-image-overlay" />
            </div>

            <div className="hero-container">
                <div className="hero-left-content">
                    <div className="hero-eyebrow">Main move</div>
                    <h1 className="hero-header-left">
                        Alleycat runs the app.
                    </h1>
                    <p className="hero-subheader-left">
                        Pick a city. Pull a list. Run your line.
                    </p>
                    <div className="hero-actions">
                        <button className="primary-button" type="button" onClick={onOpenAlleycat}>
                            Open Alleycat
                        </button>
                    </div>
                    <div className="hero-metadata">
                        <div>
                            <div className="metric">8</div>
                            <div className="metric-label">Live city lanes</div>
                        </div>
                        <div>
                            <div className="metric">1</div>
                            <div className="metric-label">Wall hit live</div>
                        </div>
                        <div>
                            <div className="metric">Fast</div>
                            <div className="metric-label">Mobile-first flow</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
