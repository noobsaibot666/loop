import React from "react";
import InfoPage from "../components/InfoPage";
import { useI18n } from "../i18n";

const TermsPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <InfoPage
      eyebrow={t("legal.terms.eyebrow")}
      title={t("legal.terms.title")}
      intro={t("legal.terms.intro")}
      items={[
        t("legal.terms.item1"),
        t("legal.terms.item2"),
        t("legal.terms.item3"),
        t("legal.terms.item4"),
      ]}
    />
  );
};

export default TermsPage;
