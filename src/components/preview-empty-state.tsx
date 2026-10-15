import { useTranslations } from "next-intl";
import { ImageIcon } from "lucide-react";

export function PreviewEmptyState() {
  const t = useTranslations("upload");

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center text-muted-foreground">
      <ImageIcon className="h-10 w-10" />
      <p className="text-sm">{t("previewEmpty")}</p>
    </div>
  );
}
