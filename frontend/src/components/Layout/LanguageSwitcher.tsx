import React from "react";
import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLang = i18n.language.startsWith("en") ? "en" : "ja";

  const toggleLanguage = () => {
    const nextLang = currentLang === "ja" ? "en" : "ja";
    i18n.changeLanguage(nextLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      title={currentLang === "ja" ? "Switch to English" : "日本語に切り替え"}
      className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground border border-input px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm hover:shadow"
    >
      <Globe className="h-3.5 w-3.5 text-primary" />
      <span>{currentLang === "ja" ? "🇯🇵 日本語" : "🇬🇧 English"}</span>
    </button>
  );
};
