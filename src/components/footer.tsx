import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>{t("privacyText")}</span>
          </div>
          <div>
            &copy; {year} {t("copyright")}
          </div>
        </div>
      </div>
    </footer>
  );
}
