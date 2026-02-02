import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import logo from "@/assets/logo-optimized.webp";
import isoLogo from "@/assets/certifications/iso.webp";

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div>
            <img 
              src={logo} 
              alt="Lifetrek Medical logo" 
              className="h-[46px] sm:h-[55px] mb-4"
              width="138"
              height="55"
              loading="lazy"
            />
            <p className="text-sm text-muted-foreground">
              {t("home.hero.subtitle")}
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">{t("nav.contact")}</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <a href="mailto:contato@lifetrek-medical.com" className="hover:text-primary transition-colors block">
                  contato@lifetrek-medical.com
                </a>
              </div>
              <div>
                <a href="tel:+5511945336226" className="hover:text-primary transition-colors block">
                  +55 11 94533-6226
                </a>
              </div>
              <div>
                <span className="block">{t("contact.location")}</span>
              </div>
              <div>
                <a 
                  href="https://www.linkedin.com/company/109570674/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 hover:text-primary transition-colors text-foreground font-medium mt-4"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                  LinkedIn (Lifetrek Medical)
                </a>
                <a 
                  href="https://www.instagram.com/lifetrekmedical" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 hover:text-primary transition-colors text-foreground font-medium mt-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  Instagram (@lifetrekmedical)
                </a>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">{t("footer.certifications")}</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-card/50 p-3 rounded-lg border border-border/50">
                <img 
                  src={isoLogo} 
                  alt="ISO 13485:2016 Medical Device Quality Management certification" 
                  className="h-12 w-auto object-contain"
                  loading="lazy"
                  width="80"
                  height="48"
                />
                <span className="text-sm font-medium text-foreground">ISO 13485:2016</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Lifetrek Medical. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
};
