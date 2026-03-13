"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Sun, Moon, Globe, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { key: "compress", href: "/compress" },
  { key: "convert", href: "/convert" },
  { key: "resize", href: "/resize" },
  { key: "background", href: "/background" },
] as const;

export function Header() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const switchLocale = () => {
    const newLocale = locale === "zh" ? "en" : "zh";
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  const isActive = (href: string) => {
    return pathname === `/${locale}${href}`;
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link
          href={`/${locale}`}
          className="mr-6 flex items-center gap-2 font-bold"
        >
          <ImageIcon className="h-5 w-5" />
          <span>PixPresso</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <Link key={item.key} href={`/${locale}${item.href}`}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
              >
                {t(item.key)}
              </Button>
            </Link>
          ))}
        </nav>

        <nav className="flex md:hidden items-center gap-1 flex-1 overflow-x-auto">
          {navItems.map((item) => (
            <Link key={item.key} href={`/${locale}${item.href}`}>
              <Button
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
                className="text-xs px-2"
              >
                {t(item.key)}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 px-2"
            onClick={switchLocale}
          >
            <Globe className="h-4 w-4" />
            <span className="text-xs font-medium">
              {locale === "zh" ? "En" : "中"}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 relative"
            onClick={toggleTheme}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">{t("theme")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
