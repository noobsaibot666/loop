import React from "react";
import { Coins, Shield, Waypoints } from "lucide-react";
import { useI18n } from "../i18n";

const PrivacyPage: React.FC = () => {
  const { t } = useI18n();
  const privacyBullets = [
    t("legal.privacy.item1"),
    t("legal.privacy.item2"),
    t("legal.privacy.item3"),
    t("legal.privacy.item4"),
  ];
  const rulesBullets = [
    t("legal.terms.item1"),
    t("legal.terms.item2"),
    t("legal.terms.item3"),
    t("legal.terms.item4"),
  ];

  return (
    <section className="info-page-shell page-stage-enter">
      <div className="info-page-wrap privacy-page-wrap">
        <section className="how-section privacy-page-section">
          <div className="how-section-head">
            <p className="info-page-eyebrow">{t("legal.privacy.eyebrow")}</p>
            <h1 className="how-section-title privacy-page-title">{t("legal.privacy.title")}</h1>
            <p className="how-section-copy privacy-page-copy">{t("legal.privacy.intro")}</p>
          </div>

          <div className="how-stack-grid privacy-card-grid">
            <article className="how-detail-card privacy-detail-card">
              <div className="how-utility-head">
                <span className="how-mode-icon">
                  <Shield size={16} />
                </span>
                <h2 className="how-utility-title">{t("footer.privacy")}</h2>
              </div>
              <ul className="how-bullet-list how-bullet-list-tight">
                {privacyBullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>

            <article className="how-detail-card privacy-detail-card privacy-detail-card-rules">
              <div className="how-utility-head">
                <span className="how-mode-icon">
                  <Waypoints size={16} />
                </span>
                <h2 className="how-utility-title">{t("legal.terms.title")}</h2>
              </div>
              <ul className="how-bullet-list how-bullet-list-tight">
                {rulesBullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            </article>
          </div>

          <article className="how-detail-card privacy-detail-card privacy-detail-card-simple">
            <div className="how-utility-head">
              <span className="how-mode-icon">
                <Coins size={16} />
              </span>
              <h2 className="how-utility-title">{t("account.credits.title")}</h2>
            </div>
            <p className="how-utility-body">{t("legal.coffee.intro")}</p>
          </article>
        </section>
      </div>
    </section>
  );
};

export default PrivacyPage;
