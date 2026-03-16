"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Download, Pipette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageUpload, type ImageInfo } from "@/components/image-upload";
import {
  replaceBackgroundColor,
  pickColorFromImage,
  downloadBlob,
  FORMAT_EXTENSIONS,
} from "@/lib/image-utils";

const PRESET_COLORS = [
  { key: "white", color: { r: 255, g: 255, b: 255 }, hex: "#FFFFFF" },
  { key: "red", color: { r: 255, g: 0, b: 0 }, hex: "#FF0000" },
  { key: "blue", color: { r: 67, g: 142, b: 219 }, hex: "#438EDB" },
] as const;

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 255, g: 255, b: 255 };
}

export default function BackgroundPage() {
  const t = useTranslations("background");
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [sourceColor, setSourceColor] = useState({ r: 255, g: 255, b: 255 });
  const [targetColor, setTargetColor] = useState({ r: 255, g: 0, b: 0 });
  const [tolerance, setTolerance] = useState(30);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const previewImgRef = useRef<HTMLImageElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const processImage = useCallback(async () => {
    if (!imageInfo) return;
    const blob = await replaceBackgroundColor(
      imageInfo.url,
      sourceColor,
      targetColor,
      tolerance,
      imageInfo.format,
      90
    );
    setResultBlob(blob);
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(blob);
    previewUrlRef.current = url;
    setPreviewUrl(url);
  }, [imageInfo, sourceColor, targetColor, tolerance]);

  useEffect(() => {
    if (imageInfo) {
      const timer = setTimeout(processImage, 200);
      return () => clearTimeout(timer);
    }
  }, [imageInfo, sourceColor, targetColor, tolerance, processImage]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const handlePickColor = async (e: React.MouseEvent<HTMLImageElement>) => {
    if (!picking || !imageInfo || !previewImgRef.current) return;
    const rect = previewImgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const color = await pickColorFromImage(
      imageInfo.url,
      x,
      y,
      rect.width,
      rect.height
    );
    setSourceColor(color);
    setPicking(false);
  };

  const handleDownload = () => {
    if (!resultBlob || !imageInfo) return;
    const ext = FORMAT_EXTENSIONS[imageInfo.format];
    const baseName = imageInfo.file.name.replace(/\.[^.]+$/, "");
    downloadBlob(resultBlob, `${baseName}_bg_changed.${ext}`);
  };

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
                  <CardTitle className="text-base">{t("sourceColor")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded border"
                      style={{ backgroundColor: rgbToHex(sourceColor.r, sourceColor.g, sourceColor.b) }}
                    />
                    <span className="text-sm font-mono">
                      {rgbToHex(sourceColor.r, sourceColor.g, sourceColor.b)}
                    </span>
                    <Button
                      variant={picking ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPicking(!picking)}
                    >
                      <Pipette className="h-4 w-4 mr-1" />
                      {t("pick")}
                    </Button>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{t("targetColor")}</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {PRESET_COLORS.map((pc) => (
                        <Button
                          key={pc.key}
                          variant={
                            targetColor.r === pc.color.r &&
                            targetColor.g === pc.color.g &&
                            targetColor.b === pc.color.b
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => setTargetColor(pc.color)}
                          className="gap-2"
                        >
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: pc.hex }}
                          />
                          {t(pc.key)}
                        </Button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Label className="text-xs">{t("custom")}:</Label>
                      <Input
                        type="color"
                        value={rgbToHex(targetColor.r, targetColor.g, targetColor.b)}
                        onChange={(e) => setTargetColor(hexToRgb(e.target.value))}
                        className="w-10 h-8 p-0 border-0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>{t("tolerance")}</Label>
                      <Badge variant="secondary">{tolerance}</Badge>
                    </div>
                    <Slider
                      value={[tolerance]}
                      onValueChange={(v) => setTolerance(Array.isArray(v) ? v[0] : v)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>

                  <Button onClick={handleDownload} disabled={!resultBlob} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    {t("download")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {imageInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {picking && (
                      <Badge variant="destructive" className="mr-2">
                        {t("pick")}
                      </Badge>
                    )}
                    {t("title")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden border bg-muted/20">
                    <img
                      ref={previewImgRef}
                      src={previewUrl || imageInfo.url}
                      alt="Background preview"
                      className={`w-full object-contain max-h-[500px] ${
                        picking ? "cursor-crosshair" : ""
                      }`}
                      onClick={handlePickColor}
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
