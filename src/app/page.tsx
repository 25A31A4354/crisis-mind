"use client";

import { useState, useEffect } from "react";
import { PlanData } from "@/types/crisis";
import PlanDisplay from "@/components/PlanDisplay";
import ZoneInput from "@/components/ZoneInput";
import { Zone, Resource } from "@/types/crisis";
import ResourceInput from "@/components/ResourceInput";
import { runDecisionEngine } from "@/lib/decisionEngine";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const disasterType = "Flood";
  const [zones, setZones] = useState<Zone[]>([
    { id: "1", name: "", people: 0, severity: "", vulnerability: "", accessibility: "", infrastructureDamage: "", urgency: "", isManualOverride: false, notes: "" }
  ]);
  const [resources, setResources] = useState<Resource[]>([
    { id: "1", name: "Boats", value: 10 },
    { id: "2", name: "Food packets", value: 50 },
    { id: "3", name: "Medical kits", value: 20 },
  ]);

  const [plan, setPlan] = useState<PlanData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simFeedback, setSimFeedback] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="min-h-screen bg-[#f9fafb]" />;

  // Validation logic
  const validate = (): string[] => {
    const errs: string[] = [];
    const namedZones = zones.filter(z => z.name.trim() !== "");
    if (namedZones.length === 0) {
      errs.push("At least 1 zone with a location is required.");
    }
    namedZones.forEach(z => {
      if (z.people <= 0) errs.push(`"${z.name}": People at risk must be greater than 0.`);
    });
    resources.forEach(r => {
      if (r.value < 0) errs.push(`"${r.name}": Resource value cannot be negative.`);
    });
    return errs;
  };

  const handleAnalyze = () => {
    const errs = validate();
    if (errs.length > 0) {
      setValidationErrors(errs);
      return;
    }
    setValidationErrors([]);
    setIsAnalyzing(true);
    setError("");
    setPlan(null);
    setIsSimulated(false);
    setSimFeedback(false);

    try {
      const result = runDecisionEngine(zones, resources, disasterType);
      setPlan(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadDemoData = () => {
    setZones([
      { id: Date.now().toString() + "_1", name: "Hyderabad", people: 1500, severity: "High", vulnerability: "High", accessibility: "Hard", infrastructureDamage: "Yes", urgency: "Critical", isManualOverride: false, notes: "Severe structural damage." },
      { id: Date.now().toString() + "_2", name: "Warangal", people: 500, severity: "Medium", vulnerability: "Medium", accessibility: "Easy", infrastructureDamage: "No", urgency: "Stable", isManualOverride: false, notes: "Waterlogging but structural safe." },
      { id: Date.now().toString() + "_3", name: "Vijayawada", people: 800, severity: "Medium", vulnerability: "High", accessibility: "Medium", infrastructureDamage: "Yes", urgency: "Risky", isManualOverride: false, notes: "Vulnerable populations identified." },
    ]);
    setResources([
      { id: "1", name: "Boats", value: 20 },
      { id: "2", name: "Food packets", value: 200 },
      { id: "3", name: "Medical kits", value: 50 },
    ]);
    setPlan(null);
    setValidationErrors([]);
    setIsSimulated(false);
    setSimFeedback(false);
  };

  const simulateWorseScenario = () => {
    const shiftSeverity = (s: string) => s === "Low" ? "Medium" : "High";
    const shiftAccessibility = (a: string) => a === "Easy" ? "Medium" : "Hard";
    const shiftUrgency = (u: string) => u === "Stable" ? "Risky" : "Critical";

    const worsenedZones = zones.map(z => ({
      ...z,
      severity: z.severity ? shiftSeverity(z.severity) : "Medium",
      accessibility: z.accessibility ? shiftAccessibility(z.accessibility) : "Hard",
      urgency: z.urgency ? shiftUrgency(z.urgency) : "Risky",
    })) as Zone[];

    setZones(worsenedZones);
    setIsAnalyzing(true);
    setError("");
    setPlan(null);
    setSimFeedback(true);
    setIsSimulated(true);

    setTimeout(() => {
      try {
        const result = runDecisionEngine(worsenedZones, resources, disasterType);
        setPlan(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error");
      } finally {
        setIsAnalyzing(false);
      }
    }, 400);
  };

  const isRunDisabled = isAnalyzing || validationErrors.length > 0;

  return (
    <main className="min-h-screen bg-[#f9fafb] p-6 text-gray-900 font-sans">
      <div className="max-w-[1400px] mx-auto px-8 space-y-8">

        <header className="mb-8 mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Crisis Command Interface · Active</div>
            <h1 className="text-4xl font-black tracking-tight text-gray-900">CrisisMind</h1>
            <p className="text-gray-500 mt-1.5 text-sm font-medium">
              Crisis decision intelligence system
            </p>
          </div>
          <button
            onClick={loadDemoData}
            className="px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-600 text-sm font-bold tracking-wide rounded-xl transition-colors border-2 border-blue-200 shadow-sm"
          >
            Load Demo Data
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <ZoneInput zones={zones} setZones={setZones} disabled={isAnalyzing} />
          </div>
          <div className="md:col-span-1">
            <ResourceInput resources={resources} setResources={setResources} disabled={isAnalyzing} />
          </div>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="border-2 border-red-300 bg-red-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
              <span className="text-xs font-black uppercase tracking-widest text-red-700">Input Validation Errors</span>
            </div>
            <ul className="space-y-1">
              {validationErrors.map((e, i) => (
                <li key={i} className="text-sm text-red-600 font-medium flex items-start gap-2">
                  <span className="mt-0.5 shrink-0">→</span>{e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Simulate feedback banner */}
        {simFeedback && !plan && (
          <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-3 text-center text-sm font-bold text-orange-700">
            ↯ Scenario worsened — recalculating priorities...
          </div>
        )}

        {/* Buttons */}
        <div className="pt-2 flex flex-col md:flex-row items-center justify-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={isRunDisabled}
            title={validationErrors.length > 0 ? "Fix validation errors before running" : ""}
            className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black tracking-widest uppercase rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-w-[240px]"
          >
            {isAnalyzing ? "⏳ Processing..." : "▶ Run Decision Engine"}
          </button>

          {plan && (
            <button
              onClick={simulateWorseScenario}
              disabled={isAnalyzing}
              className="w-full md:w-auto px-6 py-3 bg-white hover:bg-orange-50 text-orange-600 text-xs font-bold tracking-widest uppercase rounded-xl border-2 border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[200px]"
            >
              ↯ Simulate Worse Scenario
            </button>
          )}

          {error && (
            <div className="mt-4 p-3 border-2 border-red-200 bg-red-50 text-red-600 rounded-xl text-sm w-full md:w-auto text-center font-bold">
              {error}
            </div>
          )}
        </div>

        {/* Result Display */}
        {plan && (
          <div className="pt-6">
            <PlanDisplay data={plan} isSimulated={isSimulated} />
          </div>
        )}

      </div>
    </main>
  );
}
