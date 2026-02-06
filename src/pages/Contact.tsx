import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import contactHero from "@/assets/facility/contact-hero.svg";
import { trackAnalyticsEvent } from "@/utils/trackAnalytics";
import { MultiSelect, Option } from "@/components/ui/multi-select";

export default function Contact() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    projectTypes: [] as string[],
    annualVolume: "",
    technicalRequirements: "",
    message: "",
  });

  const PROJECT_TYPE_OPTIONS: Option[] = [
    { value: "dental_implants", label: "Implantes Dentários" },
    { value: "orthopedic_implants", label: "Implantes Ortopédicos" },
    { value: "spinal_implants", label: "Implantes Espinhais" },
    { value: "veterinary_implants", label: "Implantes Veterinários" },
    { value: "surgical_instruments", label: "Instrumentos Cirúrgicos" },
    { value: "micro_precision_parts", label: "Peças de Micro Precisão" },
    { value: "custom_tooling", label: "Ferramental Customizado" },
    { value: "medical_devices", label: "Dispositivos Médicos" },
    { value: "measurement_tools", label: "Ferramentas de Medição" },
    { value: "other_medical", label: "Outros Médicos" },
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    // Basic validation
    if (!formData.name || !formData.email || !formData.phone || formData.projectTypes.length === 0 || !formData.technicalRequirements) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid email address.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Send email via edge function
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          company: formData.company,
          phone: formData.phone,
          projectTypes: formData.projectTypes,
          annualVolume: formData.annualVolume,
          technicalRequirements: formData.technicalRequirements,
          message: formData.message,
        }
      });

      if (error) {
        console.error('Error sending email:', error);

        // Check for rate limit error
        const errorMessage = error.message || '';
        if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
          toast({
            variant: "destructive",
            title: "Muitas tentativas",
            description: "Por favor, aguarde alguns segundos antes de tentar novamente.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro ao enviar",
            description: "Falha ao enviar mensagem. Por favor, tente novamente ou entre em contato diretamente.",
          });
        }
        return;
      }

      // Check if the response indicates success
      if (!data || (data as any).error) {
        console.error('Email function returned error:', data);
        toast({
          variant: "destructive",
          title: "Erro ao enviar",
          description: "Falha ao enviar mensagem. Por favor, tente novamente.",
        });
        return;
      }

      // Track analytics event
      await trackAnalyticsEvent({
        eventType: "form_submission",
        companyName: formData.company,
        companyEmail: formData.email,
        metadata: {
          formType: "contact_quote",
          name: formData.name,
          projectTypes: formData.projectTypes
        }
      });

      toast({
        title: "Mensagem Enviada!",
        description: "Entraremos em contato em breve com uma proposta personalizada.",
      });

      setFormData({
        name: "",
        email: "",
        company: "",
        phone: "",
        projectTypes: [],
        annualVolume: "",
        technicalRequirements: "",
        message: ""
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro inesperado. Por favor, tente novamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div id="top" />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)] text-primary-foreground py-8 sm:py-10 md:py-16">
        <div className="absolute inset-0 bg-[image:var(--gradient-subtle)] opacity-30" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <h1 className="font-bold animate-fade-in">
            {t("contact.title")}
          </h1>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 sm:py-20 md:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 lg:gap-16">
            {/* Contact Form */}
            <div className="bg-card p-10 lg:p-12 rounded-2xl shadow-[var(--shadow-elevated)] border border-border/50">
              <h2 className="text-2xl font-bold mb-2 text-primary">{t("contact.subtitle")}</h2>
              <p className="text-muted-foreground mb-6">
                {t("contact.form.description")}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    {t("contact.form.name")} *
                  </label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    {t("contact.form.email")} *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    {t("contact.form.company")}
                  </label>
                  <Input
                    id="company"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    {t("contact.form.phone")} *
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="projectTypes" className="block text-sm font-medium mb-2">
                    Tipos de Projeto *
                  </Label>
                  <MultiSelect
                    options={PROJECT_TYPE_OPTIONS}
                    selected={formData.projectTypes}
                    onChange={(values) =>
                      setFormData({ ...formData, projectTypes: values })
                    }
                    placeholder="Selecione os tipos de projeto..."
                  />
                </div>

                <div>
                  <label htmlFor="annualVolume" className="block text-sm font-medium mb-2">
                    {t("contact.form.annualVolume")}
                  </label>
                  <Input
                    id="annualVolume"
                    value={formData.annualVolume}
                    onChange={(e) =>
                      setFormData({ ...formData, annualVolume: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label htmlFor="technicalRequirements" className="block text-sm font-medium mb-2">
                    {t("contact.form.technicalRequirements")} *
                  </label>
                  <Textarea
                    id="technicalRequirements"
                    rows={4}
                    value={formData.technicalRequirements}
                    onChange={(e) =>
                      setFormData({ ...formData, technicalRequirements: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    {t("contact.form.message")}
                  </label>
                  <Textarea
                    id="message"
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  />
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Enviando..." : t("contact.form.submit")}
                </Button>
              </form>
            </div>

            {/* Contact Info & Image */}
            <div className="space-y-6 sm:space-y-10">
              <div>
                <img
                  src={contactHero}
                  alt="Lifetrek Medical facility exterior building"
                  className="rounded-2xl shadow-[var(--shadow-premium)] hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  width="600"
                  height="400"
                />
              </div>

              <div className="space-y-8 bg-card p-10 rounded-2xl shadow-[var(--shadow-soft)] border border-border/50">
                <div className="border-l-4 border-primary pl-6">
                  <h3 className="font-bold text-lg mb-2">{t("contact.info.email")}</h3>
                  <a
                    href="mailto:vmartin@lifetrek-medical.com"
                    className="text-muted-foreground text-lg hover:text-primary transition-colors"
                  >
                    vmartin@lifetrek-medical.com
                  </a>
                </div>

                <div className="border-l-4 border-accent pl-6">
                  <h3 className="font-bold text-lg mb-2">{t("contact.info.phone")}</h3>
                  <a
                    href="tel:+5511945336226"
                    className="text-muted-foreground text-lg hover:text-primary transition-colors"
                  >
                    +55 11 94533-6226
                  </a>
                </div>

                <div className="border-l-4 border-accent-orange pl-6">
                  <h3 className="font-bold text-lg mb-2">{t("contact.info.address")}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">{t("contact.location")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
