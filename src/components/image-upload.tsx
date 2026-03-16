"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatFileSize,
  getImageFormat,
  FORMAT_LABELS,
  type ImageFormat,
} from "@/lib/image-utils";

export interface ImageInfo {
  file: File;
  url: string;
  width: number;
  height: number;
  format: ImageFormat;
}

interface ImageUploadProps {
  onImageLoad: (info: ImageInfo) => void;
  imageInfo: ImageInfo | null;
}

export function ImageUpload({ onImageLoad, imageInfo }: ImageUploadProps) {
  const t = useTranslations("upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const prevUrlRef = useRef<string | null>(null);

  // Revoke previous URL when imageInfo changes or component unmounts
  useEffect(() => {
    if (imageInfo?.url) {
      if (prevUrlRef.current && prevUrlRef.current !== imageInfo.url) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
      prevUrlRef.current = imageInfo.url;
    }
  }, [imageInfo?.url]);

  useEffect(() => {
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, []);

  const processFile = useCallback(
    (file: File) => {
      if (file.size > 20 * 1024 * 1024) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        onImageLoad({
          file,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          format: getImageFormat(file),
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [onImageLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  if (imageInfo) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-lg overflow-hidden border bg-muted/20">
          <img
            src={imageInfo.url}
            alt="Preview"
            className="w-full max-h-64 object-contain"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="overflow-hidden min-w-0">
            <span className="text-muted-foreground">{t("info.fileName")}:</span>{" "}
            <span className="font-medium truncate block">
              {imageInfo.file.name}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("info.fileSize")}:</span>{" "}
            <span className="font-medium">
              {formatFileSize(imageInfo.file.size)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">
              {t("info.dimensions")}:
            </span>{" "}
            <span className="font-medium">
              {imageInfo.width} x {imageInfo.height}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("info.format")}:</span>{" "}
            <span className="font-medium">
              {FORMAT_LABELS[imageInfo.format]}
            </span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          className="w-full"
        >
          {t("change")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleChange}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-primary/50"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        {isDragging ? (
          <ImageIcon className="h-10 w-10 text-primary" />
        ) : (
          <Upload className="h-10 w-10 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">{t("title")}</p>
        <p className="text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
