import React from "react";
import homeHeroImage from "../images/hero1.jpg";

type HeroProps = {
    onOpenAlleycat: () => void;
    onOpenLoop: () => void;
    onOpenCities: () => void;
};

const Hero: React.FC<HeroProps> = ({ onOpenAlleycat, onOpenLoop, onOpenCities }) => {
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
                        Pick the city, pull the list, and cut your own line through it. Loop is still there when you just want the quick route.
                    </p>
                    <div className="hero-actions">
                        <button className="primary-button" type="button" onClick={onOpenAlleycat}>
                            Open Alleycat
                        </button>
                        <button className="ghost-button" type="button" onClick={onOpenLoop}>
                            Open Loop
                        </button>
                        <button className="ghost-button" type="button" onClick={onOpenCities}>
                            See cities
                        </button>
                    </div>
                    <div className="hero-metadata">
                        <div>
                            <div className="metric">8</div>
                            <div className="metric-label">Live city lanes</div>
                        </div>
                        <div>
                            <div className="metric">1</div>
                            <div className="metric-label">Wall hit to beat</div>
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
