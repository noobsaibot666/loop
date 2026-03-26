import React from "react";
import InfoPage from "../components/InfoPage";
import { useI18n } from "../i18n";

const PrivacyPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <InfoPage
      eyebrow={t("legal.privacy.eyebrow")}
      title={t("legal.privacy.title")}
      intro={t("legal.privacy.intro")}
      items={[
        t("legal.privacy.item1"),
        t("legal.privacy.item2"),
        t("legal.privacy.item3"),
        t("legal.privacy.item4"),
      ]}
    />
  );
};

export default PrivacyPage;
