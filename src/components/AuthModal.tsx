import React, { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useI18n } from "../i18n";
import { useUIStore } from "../store/useUIStore";
import { supabase } from "../config";

interface AuthModalProps {
  onClose: () => void;
  defaultMode?: "signin" | "signup";
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, defaultMode = "signin" }) => {
  const { t } = useI18n();
  const { handlePasswordLogin, handleSignup } = useAuthStore();
  const { authMode, setAuthMode } = useUIStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setAuthMode(defaultMode);
  }, [defaultMode, setAuthMode]);

  const isSignup = authMode === "signup";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setIsSubmitLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      if (isSignup) {
        await handleSignup(email.trim(), password);
        setSuccessMessage(t("account.messages.accountCreated"));
      } else {
        await handlePasswordLogin(email.trim(), password);
        setSuccessMessage(t("account.messages.loggedIn"));
        onClose();
      }
    } catch (error: any) {
      setErrorMessage(error.message || t("common.requestFailed"));
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setErrorMessage(t("account.messages.addEmailFirst"));
      return;
    }
    if (!supabase) {
      setErrorMessage(t("common.authUnavailable"));
      return;
    }
    setIsResetLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/account`,
      });
      if (error) throw error;
      setSuccessMessage(t("account.messages.resetSent"));
    } catch (error: any) {
      setErrorMessage(error.message || t("common.requestFailed"));
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card auth-modal-card animation-slide-up" onClick={(event) => event.stopPropagation()}>
        <div className="auth-modal-header">
          <h2 className="modal-title">
            {isSignup ? t("account.auth.signUpTitle") : t("account.auth.signInTitle")}
          </h2>
          <p className="modal-subtitle">
            {isSignup ? t("account.auth.signUpSubtitle") : t("account.auth.subtitle")}
          </p>
        </div>

        <div className="auth-mode-switch">
          <button
            type="button"
            className={`pill auth-mode-pill ${!isSignup ? "active" : ""}`}
            onClick={() => setAuthMode("signin")}
          >
            {t("account.guest.signIn")}
          </button>
          <button
            type="button"
            className={`pill auth-mode-pill ${isSignup ? "active" : ""}`}
            onClick={() => setAuthMode("signup")}
          >
            {t("account.guest.create")}
          </button>
        </div>

        <form className="modal-form auth-modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>{t("account.auth.email")}</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t("account.auth.emailPlaceholder")}
              autoComplete="email"
              required
            />
          </label>

          <label className="field">
            <span>{t("account.auth.password")}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("account.auth.passwordPlaceholder")}
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={6}
            />
          </label>

          {!isSignup && (
            <div className="auth-reset-row">
              <button
                type="button"
                className="text-link-button"
                onClick={handleResetPassword}
                disabled={isResetLoading}
              >
                {isResetLoading ? t("account.auth.waiting") : t("account.auth.resetPassword")}
              </button>
            </div>
          )}

          <div className="form-actions auth-modal-actions">
            <button type="button" className="ghost-button" onClick={onClose}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="primary-button" disabled={isSubmitLoading || !email || !password}>
              {isSubmitLoading
                ? t("account.auth.waiting")
                : isSignup
                  ? t("account.auth.submitSignUp")
                  : t("account.auth.submitSignIn")}
            </button>
          </div>

          {successMessage && <div className="status-message success">{successMessage}</div>}
          {errorMessage && <div className="status-message error">{errorMessage}</div>}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
