import React from "react";
import homeHeroImage from "../images/hero1.jpg";
import { useI18n } from "../i18n";

const Hero: React.FC = () => {
    const { t } = useI18n();

    return (
        <section className="hero-hub novasite-layout">
            <div className="hero-bg-visual">
                <img src={homeHeroImage} alt={t("hero.title")} className="hero-image-raw" />
                <div className="hero-image-overlay" />
            </div>

            <div className="hero-container">
                <div className="hero-left-content">
                    <h1 className="hero-header-left">
                        {t("hero.title")}
                    </h1>
                    <p className="hero-subheader-left">
                        {t("hero.subtitle")}
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Hero;
