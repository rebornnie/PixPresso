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
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            {t("hero.title")}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-2">
            {t("hero.subtitle")}
          </p>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("hero.description")}
          </p>
          <Link href={`/${locale}/compress`}>
            <Button size="lg" className="text-lg px-8">
              {t("hero.cta")}
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(
              Object.keys(featureIcons) as Array<keyof typeof featureIcons>
            ).map((key) => {
              const Icon = featureIcons[key];
              return (
                <Link key={key} href={`/${locale}${featureLinks[key]}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
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
