import { useState } from "react";
import { Calculator as CalculatorIcon, TrendingUp, CheckCircle2 } from "lucide-react";
import { CalculatorForm } from "@/components/calculator/CalculatorForm";
import { CalculatorResults } from "@/components/calculator/CalculatorResults";
import { LeadCaptureForm } from "@/components/calculator/LeadCaptureForm";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { trackCalculatorEvent } from "@/utils/trackAnalytics";

export interface CalculatorInputs {
  partComplexity: "simple" | "moderate" | "complex" | "highly-complex";
  annualVolume: number;
  material: "aluminum" | "titanium" | "stainless-steel" | "peek" | "cobalt-chrome";
  tolerances: "standard" | "tight" | "ultra-precision";
  certifications: string[];
  surfaceFinish: "standard" | "polished" | "electropolished";
  secondaryOps: string[];
}

export interface CalculationResults {
  estimatedCost: {
    perUnit: number;
    annual: number;
    tooling: number;
  };
  leadTime: {
    prototype: string;
    production: string;
  };
  feasibilityScore: number;
  recommendations: string[];
  costBreakdown: {
    material: number;
    machining: number;
    finishing: number;
    quality: number;
    overhead: number;
  };
}

export default function Calculator() {
  const [inputs, setInputs] = useState<CalculatorInputs | null>(null);
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [hasTrackedStart, setHasTrackedStart] = useState(false);
  const heroAnimation = useScrollAnimation();

  const calculateResults = (data: CalculatorInputs): CalculationResults => {
    // Base costs
    const complexityMultiplier = {
      "simple": 1,
      "moderate": 1.5,
      "complex": 2.5,
      "highly-complex": 4
    }[data.partComplexity];

    const materialCosts = {
      "aluminum": 15,
      "titanium": 85,
      "stainless-steel": 35,
      "peek": 120,
      "cobalt-chrome": 95
    }[data.material];

    const toleranceCost = {
      "standard": 1,
      "tight": 1.8,
      "ultra-precision": 3.2
    }[data.tolerances];

    // Calculate base machining cost
    const baseMachiningCost = 50 * complexityMultiplier * toleranceCost;
    
    // Material cost per unit
    const materialCostPerUnit = materialCosts * complexityMultiplier * 0.8;

    // Surface finish cost
    const finishCost = {
      "standard": 5,
      "polished": 25,
      "electropolished": 45
    }[data.surfaceFinish];

    // Secondary operations cost
    const secondaryOpsCost = data.secondaryOps.length * 15;

    // Certification overhead
    const certificationCost = data.certifications.length * 8;

    // Quality control cost (15% of machining)
    const qualityCost = baseMachiningCost * 0.15;

    // Overhead (20% of total)
    const subtotal = materialCostPerUnit + baseMachiningCost + finishCost + secondaryOpsCost + certificationCost + qualityCost;
    const overheadCost = subtotal * 0.20;

    const perUnitCost = subtotal + overheadCost;

    // Volume discounts
    let volumeDiscount = 1;
    if (data.annualVolume > 10000) volumeDiscount = 0.75;
    else if (data.annualVolume > 5000) volumeDiscount = 0.82;
    else if (data.annualVolume > 1000) volumeDiscount = 0.90;
    else if (data.annualVolume > 100) volumeDiscount = 0.95;

    const finalPerUnitCost = perUnitCost * volumeDiscount;
    const annualCost = finalPerUnitCost * data.annualVolume;
    
    // Tooling costs
    const toolingCost = complexityMultiplier * 2500 + (data.annualVolume > 1000 ? 5000 : 0);

    // Lead times
    const prototypeWeeks = complexityMultiplier * 2;
    const productionWeeks = 4 + (data.partComplexity === "highly-complex" ? 4 : data.partComplexity === "complex" ? 2 : 0);

    // Feasibility score (0-100)
    let feasibilityScore = 85;
    if (data.partComplexity === "highly-complex" && data.tolerances === "ultra-precision") feasibilityScore -= 15;
    if (data.material === "peek" || data.material === "cobalt-chrome") feasibilityScore -= 5;
    if (data.secondaryOps.length > 3) feasibilityScore -= 10;
    if (data.certifications.includes("fda") || data.certifications.includes("iso13485")) feasibilityScore += 10;

    // Recommendations
    const recommendations: string[] = [];
    if (data.annualVolume > 5000) {
      recommendations.push("High volume qualifies for automated production - significant cost savings possible");
    }
    if (data.material === "titanium" && data.annualVolume < 500) {
      recommendations.push("Consider aluminum alloy for prototyping to reduce initial costs");
    }
    if (data.tolerances === "ultra-precision") {
      recommendations.push("Ultra-precision requires state-of-the-art CNC machining - our specialty");
    }
    if (data.certifications.length > 0) {
      recommendations.push("ISO 13485 certified facility - compliant with all required standards");
    }
    if (data.partComplexity === "highly-complex") {
      recommendations.push("Complex geometry ideal for our 5-axis CNC capabilities");
    }
    if (data.surfaceFinish === "electropolished") {
      recommendations.push("In-house electropolishing line available for optimal surface finish");
    }

    return {
      estimatedCost: {
        perUnit: Math.round(finalPerUnitCost * 100) / 100,
        annual: Math.round(annualCost),
        tooling: Math.round(toolingCost)
      },
      leadTime: {
        prototype: `${Math.ceil(prototypeWeeks)}-${Math.ceil(prototypeWeeks) + 1} weeks`,
        production: `${Math.ceil(productionWeeks)}-${Math.ceil(productionWeeks) + 2} weeks`
      },
      feasibilityScore: Math.max(0, Math.min(100, feasibilityScore)),
      recommendations,
      costBreakdown: {
        material: Math.round((materialCostPerUnit / perUnitCost) * 100),
        machining: Math.round((baseMachiningCost / perUnitCost) * 100),
        finishing: Math.round(((finishCost + secondaryOpsCost) / perUnitCost) * 100),
        quality: Math.round(((qualityCost + certificationCost) / perUnitCost) * 100),
        overhead: Math.round((overheadCost / perUnitCost) * 100)
      }
    };
  };

  const handleCalculate = (data: CalculatorInputs) => {
    if (!hasTrackedStart) {
      setHasTrackedStart(true);
      void trackCalculatorEvent("started", {
        calculator_id: "feasibility_calculator_v1",
        ...data,
      });
    }

    setInputs(data);
    const calculatedResults = calculateResults(data);
    setResults(calculatedResults);
    setShowLeadCapture(false);
  };

  const handleGetDetailedReport = () => {
    setShowLeadCapture(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[image:var(--gradient-hero)] text-primary-foreground py-16 sm:py-20 md:py-24">
        <div className="absolute inset-0 bg-[image:var(--gradient-subtle)] opacity-30" />
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div 
            ref={heroAnimation.elementRef}
            className={`max-w-4xl mx-auto text-center transition-all duration-1000 ${
              heroAnimation.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div className="inline-flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm px-6 py-3 rounded-full mb-6">
              <CalculatorIcon className="w-6 h-6" />
              <span className="text-sm font-semibold tracking-wide">FREE INSTANT ANALYSIS</span>
            </div>
            
            <h1 className="font-bold mb-6">
              Manufacturing Cost & Feasibility Calculator
            </h1>
            
            <p className="text-xl sm:text-2xl opacity-90 leading-relaxed max-w-3xl mx-auto">
              Get instant cost estimates and feasibility analysis for your medical device manufacturing project. 
              Industry-leading precision from Brazil's premier state-of-the-art CNC facility.
            </p>

            {/* Value Props */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
              {[
                { icon: TrendingUp, text: "Accurate Cost Estimates" },
                { icon: CheckCircle2, text: "Instant Feasibility Score" },
                { icon: CalculatorIcon, text: "Detailed Breakdown" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-sm px-4 py-3 rounded-lg">
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 max-w-7xl mx-auto">
            {/* Form */}
            <div>
              <CalculatorForm onCalculate={handleCalculate} />
            </div>

            {/* Results */}
            <div className="lg:sticky lg:top-24 h-fit">
              {results ? (
                showLeadCapture ? (
                  <LeadCaptureForm 
                    inputs={inputs!} 
                    results={results} 
                    onBack={() => setShowLeadCapture(false)}
                  />
                ) : (
                  <CalculatorResults 
                    results={results} 
                    onGetDetailedReport={handleGetDetailedReport}
                  />
                )
              ) : (
                <div className="bg-card border border-border/50 rounded-2xl p-10 shadow-[var(--shadow-soft)] h-[600px] flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <CalculatorIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">Fill out the form to see your results</p>
                    <p className="text-sm mt-2">Get instant cost estimates and feasibility analysis</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
