"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload, type ImageInfo } from "@/components/image-upload";
import {
  compressImage,
  formatFileSize,
  downloadBlob,
  FORMAT_EXTENSIONS,
  type ImageFormat,
} from "@/lib/image-utils";

export default function CompressPage() {
  const t = useTranslations("compress");
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [quality, setQuality] = useState(80);
  const [compressedBlob, setCompressedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const previewUrlRef = useRef<string | null>(null);

  // PNG is lossless and ignores the quality parameter in canvas.toBlob,
  // so we compress as JPEG to make quality-based compression work.
  const getOutputFormat = (format: ImageFormat): ImageFormat =>
    format === "image/png" ? "image/jpeg" : format;

  const processImage = useCallback(async () => {
    if (!imageInfo) return;
    setProcessing(true);
    try {
      let blob: Blob;
      if (quality === 100) {
        // Quality 100 = no compression, use original file as-is
        blob = imageInfo.file;
      } else {
        const outputFormat = getOutputFormat(imageInfo.format);
        blob = await compressImage(imageInfo.url, outputFormat, quality);
      }
      setCompressedBlob(blob);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const url = quality === 100 ? imageInfo.url : URL.createObjectURL(blob);
      previewUrlRef.current = quality === 100 ? null : url;
      setPreviewUrl(url);
    } finally {
      setProcessing(false);
    }
  }, [imageInfo, quality]);

  useEffect(() => {
    if (imageInfo) processImage();
  }, [imageInfo, quality, processImage]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const handleDownload = () => {
    if (!compressedBlob || !imageInfo) return;
    if (quality === 100) {
      downloadBlob(compressedBlob, imageInfo.file.name);
    } else {
      const outputFormat = getOutputFormat(imageInfo.format);
      const ext = FORMAT_EXTENSIONS[outputFormat];
      const baseName = imageInfo.file.name.replace(/\.[^.]+$/, "");
      downloadBlob(compressedBlob, `${baseName}_compressed.${ext}`);
    }
  };

  const reduction =
    imageInfo && compressedBlob
      ? Math.round((1 - compressedBlob.size / imageInfo.file.size) * 100)
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-muted-foreground mb-6">{t("description")}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Controls */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <ImageUpload onImageLoad={setImageInfo} imageInfo={imageInfo} />
              </CardContent>
            </Card>

            {imageInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("quality")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>1</Label>
                      <Badge variant="secondary">{quality}</Badge>
                      <Label>100</Label>
                    </div>
                    <Slider
                      value={[quality]}
                      onValueChange={(v) => setQuality(Array.isArray(v) ? v[0] : v)}
                      min={1}
                      max={100}
                      step={1}
                    />
                  </div>

                  {compressedBlob && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("original")}:</span>
                        <span className="font-medium">{formatFileSize(imageInfo.file.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("compressed")}:</span>
                        <span className="font-medium">{formatFileSize(compressedBlob.size)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t("reduction")}:</span>
                        <Badge variant={reduction > 0 ? "default" : "secondary"}>
                          {reduction > 0 ? `-${reduction}%` : `+${Math.abs(reduction)}%`}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleDownload}
                    disabled={!compressedBlob}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {t("download")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Preview */}
          <div className="lg:col-span-2">
            {previewUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t("preview")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border bg-muted/20">
                    <img
                      src={previewUrl}
                      alt="Compressed preview"
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
