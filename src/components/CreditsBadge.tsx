import React from "react";
import { useI18n } from "../i18n";
import { Usage } from "../types";

interface CreditsBadgeProps {
  usage: Usage | null;
  cost?: number;
  label?: string;
}

const CreditsBadge: React.FC<CreditsBadgeProps> = ({ usage, cost, label }) => {
  const { t } = useI18n();
  
  if (!usage) return null;

  const isUnlimited = usage.unlimited_credits;
  const total = (usage.free_remaining || 0) + (usage.credits_remaining || 0);

  return (
    <div className="loops-left">
      <span className="loops-left-line">
        {isUnlimited ? t("credits.unlimited") : t("credits.balance", { count: total })}
      </span>
      {label && <span className="loops-left-line">{label}</span>}
      {!label && cost !== undefined && (
        <span className="loops-left-line">
          {t("account.credits.burn", { count: cost })}
        </span>
      )}
    </div>
  );
};

export default CreditsBadge;
