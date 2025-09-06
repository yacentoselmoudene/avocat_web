import React from "react";
import { useTranslation } from "react-i18next";

export default function Factures() {
  const { t } = useTranslation();
  return (
    <div className="container" style={{ paddingTop: "1rem" }}>
      <h3 style={{ margin: "0 0 12px 0", color: "var(--primary-blue)" }}>
        {t("Factures")}
      </h3>
    </div>
  );
}




