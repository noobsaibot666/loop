import React from "react";
import InfoPage from "../components/InfoPage";
import { useI18n } from "../i18n";

const HowToPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <InfoPage
      eyebrow={t("legal.how.eyebrow")}
      title={t("legal.how.title")}
      items={[
        t("legal.how.item1"),
        t("legal.how.item2"),
        t("legal.how.item3"),
        t("legal.how.item4"),
      ]}
    />
  );
};

export default HowToPage;
