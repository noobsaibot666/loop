import React from "react";
import homeHeroImage from "../images/hero1.jpg";

const Hero: React.FC = () => {
    return (
        <section className="hero-hub novasite-layout">
            <div className="hero-bg-visual">
                <img src={homeHeroImage} alt="City Background" className="hero-image-raw" />
                <div className="hero-image-overlay" />
            </div>

            <div className="hero-container">
                <div className="hero-left-content">
                    <h1 className="hero-header-left">
                        Ride the city your way.
                    </h1>
                    <p className="hero-subheader-left">
                        Loop keeps it clean. Alleycat keeps it hot.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Hero;
