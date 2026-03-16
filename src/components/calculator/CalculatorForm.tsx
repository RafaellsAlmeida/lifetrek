import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator } from "lucide-react";
import type { CalculatorInputs } from "@/pages/Calculator";

interface CalculatorFormProps {
  onCalculate: (data: CalculatorInputs) => void;
}

export function CalculatorForm({ onCalculate }: CalculatorFormProps) {
  const [formData, setFormData] = useState<CalculatorInputs>({
    partComplexity: "moderate",
    annualVolume: 1000,
    material: "stainless-steel",
    tolerances: "tight",
    certifications: [],
    surfaceFinish: "standard",
    secondaryOps: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate(formData);
  };

  const toggleCertification = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert]
    }));
  };

  const toggleSecondaryOp = (op: string) => {
    setFormData(prev => ({
      ...prev,
      secondaryOps: prev.secondaryOps.includes(op)
        ? prev.secondaryOps.filter(o => o !== op)
        : [...prev.secondaryOps, op]
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border/50 rounded-2xl p-8 shadow-[var(--shadow-soft)] space-y-6">
      <div className="space-y-2 mb-6">
        <h2 className="text-2xl font-bold">Project Details</h2>
        <p className="text-muted-foreground">Provide the baseline assumptions for a preliminary screening. Final pricing requires drawing and process review.</p>
      </div>

      {/* Part Complexity */}
      <div className="space-y-2">
        <Label htmlFor="complexity">Part Complexity</Label>
        <Select 
          value={formData.partComplexity} 
          onValueChange={(value: any) => setFormData({...formData, partComplexity: value})}
        >
          <SelectTrigger id="complexity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="simple">Simple (Basic shapes, few features)</SelectItem>
            <SelectItem value="moderate">Moderate (Multiple features, moderate geometry)</SelectItem>
            <SelectItem value="complex">Complex (Intricate features, tight tolerances)</SelectItem>
            <SelectItem value="highly-complex">Highly Complex (5-axis required, ultra-tight tolerances)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Annual Volume */}
      <div className="space-y-2">
        <Label htmlFor="volume">Annual Production Volume</Label>
        <Input
          id="volume"
          type="number"
          min="1"
          value={formData.annualVolume}
          onChange={(e) => setFormData({...formData, annualVolume: parseInt(e.target.value) || 0})}
          placeholder="e.g., 5000"
        />
        <p className="text-xs text-muted-foreground">Higher volumes qualify for bulk pricing</p>
      </div>

      {/* Material */}
      <div className="space-y-2">
        <Label htmlFor="material">Material</Label>
        <Select 
          value={formData.material} 
          onValueChange={(value: any) => setFormData({...formData, material: value})}
        >
          <SelectTrigger id="material">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aluminum">Aluminum Alloys (Most economical)</SelectItem>
            <SelectItem value="stainless-steel">Stainless Steel (Medical grade)</SelectItem>
            <SelectItem value="titanium">Titanium (Grade 5, biocompatible)</SelectItem>
            <SelectItem value="peek">PEEK (High-performance polymer)</SelectItem>
            <SelectItem value="cobalt-chrome">Cobalt-Chrome (Implant grade)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tolerances */}
      <div className="space-y-2">
        <Label htmlFor="tolerances">Required Tolerances</Label>
        <Select 
          value={formData.tolerances} 
          onValueChange={(value: any) => setFormData({...formData, tolerances: value})}
        >
          <SelectTrigger id="tolerances">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard (±0.1mm)</SelectItem>
            <SelectItem value="tight">Tight (±0.05mm)</SelectItem>
            <SelectItem value="ultra-precision">Ultra-Precision (±0.01mm or tighter)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Surface Finish */}
      <div className="space-y-2">
        <Label htmlFor="finish">Surface Finish</Label>
        <Select 
          value={formData.surfaceFinish} 
          onValueChange={(value: any) => setFormData({...formData, surfaceFinish: value})}
        >
          <SelectTrigger id="finish">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard Machined</SelectItem>
            <SelectItem value="polished">Polished Finish</SelectItem>
            <SelectItem value="electropolished">Electropolished (Medical grade)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Regulatory & quality requirements */}
      <div className="space-y-3">
        <Label>Regulatory & Quality Requirements</Label>
        <div className="space-y-2">
          {[
            { id: "iso13485", label: "ISO 13485 supplier alignment" },
            { id: "fda", label: "FDA / 510(k) documentation support" },
            { id: "ce", label: "CE / MDR documentation support" }
          ].map((cert) => (
            <div key={cert.id} className="flex items-center space-x-2">
              <Checkbox
                id={cert.id}
                checked={formData.certifications.includes(cert.id)}
                onCheckedChange={() => toggleCertification(cert.id)}
              />
              <label htmlFor={cert.id} className="text-sm cursor-pointer">
                {cert.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Operations */}
      <div className="space-y-3">
        <Label>Secondary Operations (Optional)</Label>
        <div className="space-y-2">
          {[
            { id: "anodizing", label: "Anodizing" },
            { id: "heat-treatment", label: "Heat Treatment" },
            { id: "laser-marking", label: "Laser Marking" },
            { id: "assembly", label: "Assembly Services" }
          ].map((op) => (
            <div key={op.id} className="flex items-center space-x-2">
              <Checkbox
                id={op.id}
                checked={formData.secondaryOps.includes(op.id)}
                onCheckedChange={() => toggleSecondaryOp(op.id)}
              />
              <label htmlFor={op.id} className="text-sm cursor-pointer">
                {op.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full">
        <Calculator className="w-5 h-5 mr-2" />
        Run Preliminary Screening
      </Button>
    </form>
  );
}
