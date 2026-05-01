import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo-optimized.webp";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const localePrefix = location.pathname.startsWith("/en")
    ? "/en"
    : location.pathname.startsWith("/pt")
      ? "/pt"
      : "";
  const normalizedPathname = localePrefix ? location.pathname.slice(localePrefix.length) || "/" : location.pathname;
  const withLocalePrefix = (path: string) => {
    if (!localePrefix) {
      return path;
    }
    return `${localePrefix}${path}`;
  };
  const switchLanguage = (targetLanguage: "en" | "pt") => {
    setLanguage(targetLanguage);
    const nextPrefix = `/${targetLanguage}`;
    const nextPath = normalizedPathname === "/" ? "" : normalizedPathname;
    navigate(`${nextPrefix}${nextPath}${location.hash}`);
  };

  const navItems = [
    { path: "/", label: t("nav.home") },
    { path: "/about", label: t("nav.short.about") },
    { path: "/what-we-do", label: t("nav.short.whatWeDo") },
    { path: "/products", label: t("nav.products") },
    { path: "/resources", label: t("nav.resources") },
    { path: "/blog", label: t("nav.blog") },
    { path: "/capabilities", label: t("nav.short.infrastructure") },
    { path: "/clients", label: t("nav.short.clients") },
    { path: "/contact", label: t("nav.contact") },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5e7eb] bg-white">
      <nav className="container mx-auto flex h-[72px] items-center justify-between gap-5 px-5 lg:px-6 2xl:px-8">
        <Link to={`${withLocalePrefix("/")}#top`} className="flex items-center flex-shrink-0">
          <img 
            src={logo} 
            alt="Lifetrek Medical - ISO 13485 Certified Medical Device Manufacturer" 
            className="h-[56px]"
            style={{ width: '169px', height: '56px' }}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden xl:flex min-w-0 flex-1 items-center justify-center gap-4 2xl:gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={`${withLocalePrefix(item.path)}#top`}
              className={`whitespace-nowrap text-[13px] font-medium transition-colors hover:text-[#003366] 2xl:text-sm ${
                normalizedPathname === item.path
                  ? "text-[#003366]"
                  : "text-[#003366]/70"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-shrink-0 items-center gap-3">
          {/* Language Toggle */}
          <div className="flex items-center gap-1 rounded-full bg-[#f5f7fa] p-1">
            <button
              onClick={() => switchLanguage("en")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all 2xl:text-sm ${
                language === "en"
                  ? "bg-[#003366] text-white"
                  : "text-[#003366]/60 hover:text-[#003366]"
              }`}
            >
              🇺🇸 EN
            </button>
            <button
              onClick={() => switchLanguage("pt")}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all 2xl:text-sm ${
                language === "pt"
                  ? "bg-[#003366] text-white"
                  : "text-[#003366]/60 hover:text-[#003366]"
              }`}
            >
              🇧🇷 PT
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="xl:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </nav>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="xl:hidden border-t border-[#e5e7eb] bg-white">
          <div className="container mx-auto px-8 py-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={`${withLocalePrefix(item.path)}#top`}
                onClick={() => setIsMenuOpen(false)}
                className={`px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  normalizedPathname === item.path
                    ? "bg-[#003366] text-white"
                    : "text-[#003366] hover:bg-[#f5f7fa]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
