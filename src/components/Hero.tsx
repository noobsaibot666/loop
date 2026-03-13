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
                        Cheat Death on The Streets
                    </h1>
                    <p className="hero-subheader-left">
                        Loop in the city or run a Alleycat with your local crew
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Hero;
