"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DownloadButtonProps {
  disabled: boolean;
  processing: boolean;
  onDownload: () => void;
  label: string;
}

export function DownloadButton({
  disabled,
  processing,
  onDownload,
  label,
}: DownloadButtonProps) {
  const t = useTranslations("common");
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleClick = () => {
    onDownload();
    setDone(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDone(false), 2000);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || processing}
      className="w-full bg-success text-success-foreground hover:bg-success/90"
    >
      {processing ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : done ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {processing ? t("processing") : done ? t("downloaded") : label}
    </Button>
  );
}
