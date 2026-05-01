import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Building2, Package, Phone, BookOpen, Newspaper } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const MobileNav = () => {
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const localePrefix = location.pathname.startsWith("/en")
    ? "/en"
    : location.pathname.startsWith("/pt")
      ? "/pt"
      : "";
  const normalizedPathname = localePrefix ? location.pathname.slice(localePrefix.length) || "/" : location.pathname;
  const withLocalePrefix = (path: string) => (localePrefix ? `${localePrefix}${path}` : path);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { path: "/", icon: Home, label: t("nav.home") },
    { path: "/capabilities", icon: Building2, label: t("nav.short.infrastructure") },
    { path: "/products", icon: Package, label: t("nav.products") },
    { path: "/resources", icon: BookOpen, label: t("nav.resources") },
    { path: "/blog", icon: Newspaper, label: t("nav.blog") },
    { path: "/contact", icon: Phone, label: t("nav.contact") },
  ];

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 glass-card-strong border-t border-border transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="grid grid-cols-6 items-center gap-1 py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = normalizedPathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={`${withLocalePrefix(item.path)}#top`}
              className={`flex min-w-0 flex-col items-center gap-1 rounded-lg p-2 transition-all ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="w-full truncate text-center text-[10px] font-medium sm:text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
