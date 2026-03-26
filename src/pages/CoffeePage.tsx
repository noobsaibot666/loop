import React from "react";
import { Link } from "react-router-dom";
import InfoPage from "../components/InfoPage";
import { useI18n } from "../i18n";

const CoffeePage: React.FC = () => {
  const { t } = useI18n();

  return (
    <InfoPage
      eyebrow={t("legal.coffee.eyebrow")}
      title={t("legal.coffee.title")}
      intro={t("legal.coffee.intro")}
      items={[
        t("legal.coffee.item1"),
        t("legal.coffee.item2"),
      ]}
      actions={
        <>
          <a
            className="primary-button small info-page-action-button"
            href="https://buymeacoffee.com/js4mhwqrdjd"
            target="_blank"
            rel="noreferrer"
          >
            {t("legal.coffee.action")}
          </a>
          <Link to="/" className="ghost-button small info-page-action-button">
            {t("legal.coffee.back")}
          </Link>
        </>
      }
    />
  );
};

export default CoffeePage;
