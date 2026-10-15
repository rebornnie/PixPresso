import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import {
  Minimize2,
  RefreshCw,
  Maximize2,
  Palette,
  Shield,
  Zap,
  Heart,
  FileImage,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button-variants";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const featureIcons = {
  compress: Minimize2,
  convert: RefreshCw,
  resize: Maximize2,
  background: Palette,
};

const featureLinks = {
  compress: "/compress",
  convert: "/convert",
  resize: "/resize",
  background: "/background",
};

const highlightIcons = {
  privacy: Shield,
  free: Heart,
  fast: Zap,
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent locale={locale} />;
}

function HomeContent({ locale }: { locale: string }) {
  const t = useTranslations("home");

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute -top-24 -left-24 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -top-16 right-0 -z-10 h-64 w-64 rounded-full bg-success/10 blur-3xl" />
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-6">{t("hero.badge")}</Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-2">
            {t("hero.subtitle")}
          </p>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("hero.description")}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href={`/${locale}/compress`}
              className={cn(buttonVariants({ size: "lg" }), "text-lg px-8 hover:bg-primary/80")}
            >
              {t("hero.cta")}
            </Link>
            <a
              href="#features"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-lg px-8")}
            >
              {t("hero.ctaSecondary")}
            </a>
          </div>

          {/* Compression demo mock */}
          <div className="mx-auto mt-14 max-w-md rounded-xl border bg-card p-4 text-left shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileImage className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">photo.jpg</p>
                <p className="text-xs text-muted-foreground">
                  {t("hero.demoOriginal")} 2.4 MB · {t("hero.demoCompressed")} 386 KB
                </p>
              </div>
              <Badge className="bg-success text-success-foreground">-84%</Badge>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[16%] rounded-full bg-success" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(
              Object.keys(featureIcons) as Array<keyof typeof featureIcons>
            ).map((key) => {
              const Icon = featureIcons[key];
              return (
                <Link key={key} href={`/${locale}${featureLinks[key]}`}>
                  <Card className="h-full cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <CardHeader>
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">
                        {t(`features.${key}.title`)}
                      </CardTitle>
                      <CardDescription>
                        {t(`features.${key}.description`)}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(
              Object.keys(highlightIcons) as Array<keyof typeof highlightIcons>
            ).map((key) => {
              const Icon = highlightIcons[key];
              return (
                <div key={key} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {t(`highlights.${key}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`highlights.${key}.description`)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
