import { motion } from "framer-motion";
import type { PageView } from "../App";

interface HeroProps {
    heroRef: React.RefObject<HTMLDivElement>;
    parallaxY: any; // Using any for Framer Motion types brevity in initial refactor
    parallaxX: any;
    heroImage: string;
    onNavigate: (page: PageView) => void;
    activeStep: number;
    setActiveStep: (step: number) => void;
}

export const Hero = ({
    heroRef,
    parallaxY,
    parallaxX,
    heroImage,
    onNavigate,
}: HeroProps) => {
    return (
        <section className="hero" ref={heroRef}>
            <motion.div
                className="hero-copy"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="hero-eyebrow">City riding tools</div>
                <h1>
                    One product page. <br />
                    Two ways to ride.
                </h1>
                <p>
                    Loop gives you the fast return route. <br />
                    Alleycat gives you the pressure and the game.
                </p>
                <div className="hero-actions">
                    <button className="primary-button" type="button" onClick={() => onNavigate("loop")}>
                        Open Loop
                    </button>
                    <button className="ghost-button" type="button" onClick={() => onNavigate("messenger")}>
                        Open Alleycat
                    </button>
                    <button className="ghost-button" type="button" onClick={() => onNavigate("wall")}>
                        Open Wall
                    </button>
                </div>
                <div className="hero-metadata">
                    <div className="metric-group">
                        <div className="metric">Loop</div>
                        <div className="metric-label">Clean returns</div>
                    </div>
                    <div className="metric-group">
                        <div className="metric">Alleycat</div>
                        <div className="metric-label">City mode</div>
                    </div>
                    <div className="metric-group">
                        <div className="metric">Wall</div>
                        <div className="metric-label">Proof feed</div>
                    </div>
                </div>
            </motion.div>

            <motion.div
                className="hero-visual"
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
                <motion.div className="hero-image" style={{ y: parallaxY, x: parallaxX }}>
                    <img src={heroImage} alt="Cyclist moving through a city ride product" />
                </motion.div>
            </motion.div>
        </section>
    );
};
