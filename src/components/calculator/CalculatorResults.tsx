import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, Download, Clock, CheckCircle2, DollarSign } from "lucide-react";
import type { CalculationResults } from "@/pages/Calculator";

interface CalculatorResultsProps {
  results: CalculationResults;
  onGetDetailedReport: () => void;
}

export function CalculatorResults({ results, onGetDetailedReport }: CalculatorResultsProps) {
  const getFeasibilityColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-orange-500";
  };

  const getFeasibilityLabel = (score: number) => {
    if (score >= 80) return "Highly Feasible";
    if (score >= 60) return "Feasible with Considerations";
    return "Challenging but Possible";
  };

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-8 shadow-[var(--shadow-elevated)] space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Your Preliminary Results</h2>
        <p className="text-muted-foreground">Directional budgetary estimate for early screening only</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3 text-sm text-amber-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>These values are not a formal quotation. Final cost and lead time depend on drawing review, routing, validation scope, inspection plan, batch size, and commercial terms.</p>
        </div>
      </div>

      {/* Feasibility Score */}
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/20">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-muted-foreground">Feasibility Score</span>
          <span className={`text-3xl font-bold ${getFeasibilityColor(results.feasibilityScore)}`}>
            {results.feasibilityScore}%
          </span>
        </div>
        <Progress value={results.feasibilityScore} className="h-3 mb-2" />
        <p className="text-sm font-medium">{getFeasibilityLabel(results.feasibilityScore)}</p>
      </div>

      {/* Cost Estimates */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <DollarSign className="w-5 h-5 text-primary" />
          <span>Cost Estimates</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Per Unit</p>
            <p className="text-2xl font-bold text-primary">
              ${results.estimatedCost.perUnit.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">Budgetary estimate</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Annual Total</p>
            <p className="text-2xl font-bold text-primary">
              ${results.estimatedCost.annual.toLocaleString()}
            </p>
            <p className="text-[11px] text-muted-foreground mt-2">Scenario-based projection</p>
          </div>
        </div>

        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
          <p className="text-xs text-muted-foreground mb-1">Tooling Cost (Preliminary)</p>
          <p className="text-xl font-bold">
            ${results.estimatedCost.tooling.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Cost Breakdown</p>
        <div className="space-y-2">
          {Object.entries(results.costBreakdown).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground capitalize">
                {key.replace('-', ' ')}
              </span>
              <span className="font-medium">{value}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Lead Times */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="w-4 h-4 text-accent" />
          <span>Lead Times</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Prototype</p>
            <p className="text-sm font-bold">{results.leadTime.prototype}</p>
            <p className="text-[11px] text-muted-foreground mt-2">Indicative range</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Production</p>
            <p className="text-sm font-bold">{results.leadTime.production}</p>
            <p className="text-[11px] text-muted-foreground mt-2">Indicative range</p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {results.recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span>Key Recommendations</span>
          </div>
          <ul className="space-y-2">
            {results.recommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* CTA */}
      <div className="pt-4 border-t">
        <Button onClick={onGetDetailedReport} size="lg" className="w-full group">
          <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
          Get Detailed PDF Report
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          We will validate the scenario and send a reviewed version with assumptions called out explicitly
        </p>
      </div>
    </div>
  );
}
