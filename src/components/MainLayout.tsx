import React, { useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useUIStore } from "../store/useUIStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCreditStore } from "../store/useCreditStore";
import { useI18n } from "../i18n";
import {
  Menu as MenuIcon, X, Globe, User, LogOut, LayoutGrid, Trophy,
  Map as MapIcon, Moon, Mail, ChevronRight
} from "lucide-react";
import AuthModal from "./AuthModal";

const MainLayout: React.FC = () => {
  const { 
    menuOpen, setMenuOpen, 
    showLanguageMenu, setShowLanguageMenu,
    mobileHeaderVisible,
    setMobileHeaderVisible,
    authModalOpen, setAuthModalOpen,
    authMode, setAuthMode
  } = useUIStore();
  
  const { user, handleLogout: signOut } = useAuthStore();
  const { usage } = useCreditStore();
  const { language, setLanguage, t } = useI18n();
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
    setMobileHeaderVisible(true);
    window.scrollTo(0, 0);
  }, [location.pathname, setMenuOpen, setMobileHeaderVisible]);

  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("menu-open-lock");
    } else {
      document.body.classList.remove("menu-open-lock");
    }
    return () => document.body.classList.remove("menu-open-lock");
  }, [menuOpen]);

  useEffect(() => {
    const isMobileViewport = () => window.matchMedia("(max-width: 1100px)").matches;
    if (!isMobileViewport()) {
      setMobileHeaderVisible(true);
      return;
    }

    let lastScrollY = window.scrollY;
    let hideTimer: number | null = null;

    const clearHideTimer = () => {
      if (hideTimer) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
    };

    const armHideTimer = () => {
      clearHideTimer();
      if (menuOpen) return;
      hideTimer = window.setTimeout(() => {
        if (window.scrollY > 24) setMobileHeaderVisible(false);
      }, 1100);
    };

    const onScroll = () => {
      const currentY = window.scrollY;
      if (currentY <= 8) {
        setMobileHeaderVisible(true);
        lastScrollY = currentY;
        armHideTimer();
        return;
      }

      const delta = currentY - lastScrollY;
      if (delta < -6) {
        setMobileHeaderVisible(true);
      } else if (delta > 10 && currentY > 48 && !menuOpen) {
        setMobileHeaderVisible(false);
      }

      lastScrollY = currentY;
      armHideTimer();
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    armHideTimer();

    return () => {
      window.removeEventListener("scroll", onScroll);
      clearHideTimer();
    };
  }, [menuOpen, setMobileHeaderVisible]);

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
  };

  const navLinks = [
    { to: "/", label: t("nav.home") },
    { to: "/messenger", label: t("nav.alleycat") },
    { to: "/loop", label: t("nav.loop") },
    { to: "/night", label: t("nav.night") },
    { to: "/leaderboard", label: t("nav.leaderboard") },
    { to: "/wall", label: t("nav.wallShort") },
    { to: "/cities", label: t("nav.cities") },
  ];

  const languages = [
    { code: "en", label: "EN" },
    { code: "pt", label: "PT" },
    { code: "es", label: "ES" }
  ];

  return (
    <div className="page" data-theme="dark">
      {/* Desktop & Mobile Header */}
      <header className={`site-header ${!mobileHeaderVisible ? "mobile-hidden" : "mobile-visible"}`}>
        <div className="nav-container">
          {/* Logo / Brand */}
          <div className="nav-left">
            <Link to="/" className="brand">
              <span className="brand-title">
                GIMME<br/>
                THE<br/>
                LOOP
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Link Group */}
          <nav className="header-nav">
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                className={`nav-link ${location.pathname === link.to ? "active" : ""}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="nav-right">
            <div className="header-actions">
              {!user ? (
                <button
                  className="mobile-login-button"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthModalOpen(true);
                  }}
                >
                  {t("nav.logIn")}
                </button>
              ) : (
                <Link to="/account" className="profile-link">
                  <User size={16} className="profile-icon" />
                  <span className="profile-credit-count">{usage?.credits_remaining ?? 0}</span>
                </Link>
              )}

              <div className="language-menu-wrap">
                <button 
                  className="language-trigger"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowLanguageMenu(!showLanguageMenu);
                  }}
                >
                  <Globe className="language-trigger-icon" />
                </button>

                {showLanguageMenu && (
                  <div className="language-menu">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        className={`language-option ${language === lang.code ? "active" : ""}`}
                        onClick={() => {
                          setLanguage(lang.code as any);
                          setShowLanguageMenu(false);
                        }}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className={`menu-toggle ${menuOpen ? "active" : ""}`}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Overlay (Sheet) */}
      <div 
        className={`mobile-nav-sheet ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
      >
        <div 
          className="mobile-nav-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Profile Area */}
          <div className="mobile-user-profile">
            {user ? (
              <>
                <div className="user-profile-brief">
                  <div className="user-avatar-placeholder">
                    <User size={28} />
                  </div>
                  <div className="user-profile-details">
                    <span className="profile-email">{user.email}</span>
                    <span className="profile-tier">{t("nav.account")}</span>
                  </div>
                </div>
                <div className="user-quick-stats">
                  <div className="quick-stat">
                    <span className="stat-value">{usage?.credits_remaining ?? 0}</span>
                    <span className="stat-label">{t("nav.credits")}</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-value">{usage?.unlimited_credits ? t("nav.passShort") : t("nav.freeShort")}</span>
                    <span className="stat-label">{t("account.community.plan")}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="user-profile-brief">
                <div className="user-avatar-placeholder">
                  <User size={28} />
                </div>
                <div className="user-profile-details">
                  <span className="profile-email">{t("nav.guestRider")}</span>
                  <button 
                    className="profile-tier profile-tier-button" 
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthModalOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    {t("nav.logIn")}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mobile-nav-group-label">{t("nav.menu")}</div>
          
          <nav className="mobile-nav-links">
            {navLinks.map((link) => (
              <Link 
                key={link.to} 
                to={link.to} 
                className={`mobile-nav-link ${location.pathname === link.to ? "active" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="link-label">{link.label}</span>
                <ChevronRight className="link-arrow" size={16} />
              </Link>
            ))}
          </nav>

          <div className="mobile-nav-footer">
            <div className="mobile-auth-actions">
              {user ? (
                <>
                  <Link to="/account" className="mobile-nav-link mobile-nav-link-compact" onClick={() => setMenuOpen(false)}>
                    {t("nav.account")}
                  </Link>
                  <button onClick={handleSignOut} className="mobile-nav-link mobile-nav-link-compact mobile-nav-link-button">
                    <LogOut size={20} className="mobile-nav-link-icon" />
                    {t("nav.out")}
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="primary-button full-width"
                    onClick={() => {
                      setAuthMode("signin");
                      setAuthModalOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    {t("account.guest.signIn") || "Sign in"}
                  </button>
                  <button 
                    className="ghost-button full-width"
                    onClick={() => {
                      setAuthMode("signup");
                      setAuthModalOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    {t("account.guest.create")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Page Content */}
      <main className="page-stage page-stage-enter">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-divider" />
        <div className="nav-container">
          <div className="footer-meta">
            <h4 className="footer-title">GIMME THE LOOP</h4>
            <span className="footer-meta-info">© {new Date().getFullYear()} All rights reserved</span>
          </div>
          <nav className="footer-nav">
            <div className="footer-nav-group">
              <Link to="/messenger" className="footer-nav-link">{t("nav.alleycat")}</Link>
              <Link to="/loop" className="footer-nav-link">{t("nav.loop")}</Link>
              <Link to="/night" className="footer-nav-link">{t("nav.night")}</Link>
            </div>
            <div className="footer-nav-group">
              <Link to="/leaderboard" className="footer-nav-link">{t("nav.leaderboard")}</Link>
              <Link to="/wall" className="footer-nav-link">{t("nav.wallShort")}</Link>
              <Link to="/cities" className="footer-nav-link">{t("nav.cities")}</Link>
            </div>
            <div className="footer-nav-group">
              <Link to="/account" className="footer-nav-link">{t("nav.account")}</Link>
              <span className="footer-nav-link footer-nav-link-muted">{t("footer.privacy")}</span>
              <span className="footer-nav-link footer-nav-link-muted">{t("footer.terms")}</span>
            </div>
          </nav>
        </div>
      </footer>

      {/* Login / Auth Modal */}
      {authModalOpen && (
        <AuthModal 
          defaultMode={authMode} 
          onClose={() => setAuthModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default MainLayout;
