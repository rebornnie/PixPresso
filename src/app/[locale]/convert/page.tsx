"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload, type ImageInfo } from "@/components/image-upload";
import {
  convertImage,
  formatFileSize,
  downloadBlob,
  FORMAT_EXTENSIONS,
  FORMAT_LABELS,
  type ImageFormat,
} from "@/lib/image-utils";

const FORMATS: ImageFormat[] = ["image/jpeg", "image/png", "image/webp"];

export default function ConvertPage() {
  const t = useTranslations("convert");
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [targetFormat, setTargetFormat] = useState<ImageFormat>("image/webp");
  const [quality, setQuality] = useState(80);
  const [convertedBlob, setConvertedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const processImage = useCallback(async () => {
    if (!imageInfo) return;
    const blob = await convertImage(imageInfo.url, targetFormat, quality);
    setConvertedBlob(blob);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(blob));
  }, [imageInfo, targetFormat, quality]);

  useEffect(() => {
    if (imageInfo) processImage();
  }, [imageInfo, targetFormat, quality, processImage]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleDownload = () => {
    if (!convertedBlob || !imageInfo) return;
    const ext = FORMAT_EXTENSIONS[targetFormat];
    const baseName = imageInfo.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(convertedBlob, `${baseName}_converted.${ext}`);
  };

  const showQuality = targetFormat !== "image/png";

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground mb-6">{t("description")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <ImageUpload onImageLoad={setImageInfo} imageInfo={imageInfo} />
              </CardContent>
            </Card>

            {imageInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("targetFormat")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    value={targetFormat}
                    onValueChange={(v) => setTargetFormat(v as ImageFormat)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {FORMAT_LABELS[f]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {showQuality && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>{t("quality")}</Label>
                        <Badge variant="secondary">{quality}</Badge>
                      </div>
                      <Slider
                        value={[quality]}
                        onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
                        min={1}
                        max={100}
                        step={1}
                      />
                      <p className="text-xs text-muted-foreground">{t("qualityHint")}</p>
                    </div>
                  )}

                  {convertedBlob && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("original")}:</span>
                        <span className="font-medium">
                          {FORMAT_LABELS[imageInfo.format]} · {formatFileSize(imageInfo.file.size)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("converted")}:</span>
                        <span className="font-medium">
                          {FORMAT_LABELS[targetFormat]} · {formatFileSize(convertedBlob.size)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button onClick={handleDownload} disabled={!convertedBlob} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    {t("download")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2">
            {previewUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {FORMAT_LABELS[targetFormat]}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border bg-muted/20">
                    <img
                      src={previewUrl}
                      alt="Converted preview"
                      className="w-full object-contain max-h-[500px]"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
