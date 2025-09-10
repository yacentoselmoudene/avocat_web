import React from "react";

const UnifiedEtapeButton = ({
  etapeId,
  affaireId,
  onComplete,
  disabled = false,
  children = "Terminer l'étape",
  style = {},
  className = "",
}) => {
  const handleClick = async () => {
    if (disabled) return;

    try {
      await onComplete(etapeId);
    } catch (error) {
      console.error("Erreur lors de la terminaison de l'étape:", error);
    }
  };

  const defaultStyle = {
    padding: "12px 24px",
    backgroundColor: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: disabled ? "not-allowed" : "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    opacity: disabled ? 0.6 : 1,
    transition: "all 0.2s ease",
    minWidth: "140px",
    ...style,
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      style={defaultStyle}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
};

export default UnifiedEtapeButton;
