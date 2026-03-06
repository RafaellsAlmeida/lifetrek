import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { trackAnalyticsEvent, trackCalculatorEvent } from "@/utils/trackAnalytics";
import { saveLeadWithCompat } from "@/utils/contactLeadCapture";
import type { CalculatorInputs, CalculationResults } from "@/pages/Calculator";
import { useLanguage } from "@/contexts/LanguageContext";

interface LeadCaptureFormProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
  onBack: () => void;
}

export function LeadCaptureForm({ inputs, results, onBack }: LeadCaptureFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Track analytics event
      await trackAnalyticsEvent({
        eventType: "lead_magnet_usage",
        companyName: formData.company,
        companyEmail: formData.email,
        metadata: { 
          leadMagnetType: "calculator",
          name: formData.name,
          inputs,
          results 
        }
      });

      await saveLeadWithCompat({
        name: formData.name,
        email: formData.email,
        company: formData.company || undefined,
        phone: formData.phone || "Nao informado",
        project_type: "other_medical",
        project_types: ["other_medical"],
        technical_requirements: `Calculator lead | material=${inputs.material} | volume=${inputs.annualVolume}`,
        message: formData.message || `Feasibility score: ${results.feasibilityScore}`,
        source: "website",
      });

      // Call edge function to send email with results
      const { error } = await supabase.functions.invoke('send-calculator-report', {
        body: {
          contact: formData,
          inputs,
          results
        }
      });

      if (error) throw error;

      await trackCalculatorEvent("completed", {
        calculator_id: "feasibility_calculator_v1",
        part_complexity: inputs.partComplexity,
        annual_volume: inputs.annualVolume,
        material: inputs.material,
        tolerances: inputs.tolerances,
        feasibility_score: results.feasibilityScore,
      });

    setIsSubmitted(true);
    toast({
      title: t("leadCapture.toast.successTitle"),
      description: t("leadCapture.toast.successDescription"),
    });
    } catch (error) {
      console.error('Error sending report:', error);
      toast({
        variant: "destructive",
        title: t("leadCapture.toast.errorTitle"),
        description: t("leadCapture.toast.errorDescription"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-[var(--shadow-elevated)] text-center space-y-6">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">{t("leadCapture.success.title")}</h2>
          <p className="text-muted-foreground">
            {t("leadCapture.success.subtitle")} <strong>{formData.email}</strong>
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-3">
          <p className="font-semibold text-sm">{t("leadCapture.success.whatsNext")}</p>
          <ul className="text-sm text-muted-foreground space-y-2 text-left">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t("leadCapture.success.step1")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t("leadCapture.success.step2")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>{t("leadCapture.success.step3")}</span>
            </li>
          </ul>
        </div>

        <div className="pt-4 space-y-3">
          <Button onClick={onBack} variant="outline" className="w-full">
            {t("leadCapture.success.viewResultsButton")}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t("leadCapture.success.questionsText")} <a href="tel:+551939367193" className="text-primary hover:underline">+55 19 3936-7193</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-[var(--shadow-elevated)] space-y-6">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBack}
        className="mb-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("leadCapture.form.backButton")}
      </Button>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t("leadCapture.form.title")}</h2>
        <p className="text-muted-foreground">
          {t("leadCapture.form.subtitle")}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("leadCapture.form.fullName")}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
            placeholder={t("leadCapture.form.fullNamePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t("leadCapture.form.email")}</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
            placeholder={t("leadCapture.form.emailPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">{t("leadCapture.form.company")}</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            required
            placeholder={t("leadCapture.form.companyPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t("leadCapture.form.phone")}</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            placeholder={t("leadCapture.form.phonePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">{t("leadCapture.form.additionalDetails")}</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            placeholder={t("leadCapture.form.detailsPlaceholder")}
            rows={3}
          />
        </div>

        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-sm">
          <p className="font-semibold mb-2">{t("leadCapture.form.receiveTitle")}</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• {t("leadCapture.form.receiveItem1")}</li>
            <li>• {t("leadCapture.form.receiveItem2")}</li>
            <li>• {t("leadCapture.form.receiveItem3")}</li>
            <li>• {t("leadCapture.form.receiveItem4")}</li>
            <li>• {t("leadCapture.form.receiveItem5")}</li>
          </ul>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>{t("leadCapture.form.processingButton")}</>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              {t("leadCapture.form.submitButton")}
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {t("leadCapture.form.privacyText")}
        </p>
      </form>
    </div>
  );
}
