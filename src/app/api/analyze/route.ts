export async function POST(req: Request) {
  try {
    const { disasterType, zones, resources } = await req.json();

    if (!zones || zones.length === 0) {
      return Response.json({ error: "Disaster zones are required." }, { status: 400 });
    }

    // 1. Assign severity weights
    const getSeverityWeight = (sev?: string) => {
      const s = sev?.toLowerCase() || "";
      if (s.includes("high") || s.includes("critical")) return 50;
      if (s.includes("medium")) return 25;
      if (s.includes("low")) return 10;
      return 10; // Default
    };

    // Calculate score for each zone
    interface ZoneInput { name?: string; severity?: string; people?: string | number; notes?: string; }
    interface ScoredZone {
      originalZone: ZoneInput;
      score: number;
      percentage: number;
    }

    let totalScore = 0;
    const scoredZones: ScoredZone[] = zones.map((z: ZoneInput) => {
      const weight = getSeverityWeight(z.severity);
      const people = typeof z.people === 'number' ? z.people : parseInt((z.people || "0") as string) || 0;
      const score = (people * 0.6) + weight;
      totalScore += score;
      return {
        originalZone: z,
        score,
        percentage: 0
      };
    });

    // Handle percentage distribution
    if (totalScore === 0) {
      // Edge case: all zero score. Just give equal percentages to avoid NaN
      scoredZones.forEach(z => z.percentage = 1 / scoredZones.length);
    } else {
      scoredZones.forEach(z => z.percentage = z.score / totalScore);
    }

    // 3. Sort zones by score DESC (Highest priority first)
    scoredZones.sort((a, b) => b.score - a.score);

    // Calculate allocations for each zone
    // Each zone gets percentage of each resource.
    const allocationsByZone = scoredZones.map((sz, idx) => {
      const zoneAllocations = resources.map((r: { name: string; value: number }) => {
        // Floor ensures we don't exceed total resources
        return {
          name: r.name,
          value: Math.floor(r.value * sz.percentage)
        };
      });

      return {
        area: sz.originalZone.name || `Zone ${idx + 1}`,
        allocations: zoneAllocations,
        reason: `Allocated based on deterministic severity score: ${sz.score.toFixed(1)} (${(sz.percentage * 100).toFixed(1)}% of total risk).`,
        severity: sz.originalZone.severity || "Unknown",
        people: sz.originalZone.people || 0,
        priority: idx + 1
      };
    });

    // 5. Prediction Logic
    const predictionTarget = scoredZones.length > 1 ? scoredZones[1].originalZone : (scoredZones[0]?.originalZone || null);
    const nextAreaName = predictionTarget ? (scoredZones.length > 1 ? predictionTarget.name : `${predictionTarget.name} Periphery`) || "Surrounding areas" : "Surrounding areas";
    
    // Generate realistic scenario-based prediction
    let predReason = "Evacuation delays expected due to compromised infrastructure and limited access.";
    let predPrep = "Pre-deploy secondary triage units and mobilize heavy transport.";
    let predTime = "2-4 hours";
    const predRisk = "HIGH";
    
    const disasterStr = (disasterType || "").toLowerCase();
    
    if (disasterStr.includes("flood")) {
      predReason = "Water levels rising rapidly; up-stream reservoirs are nearing spillover capacity.";
      predPrep = "Ready deployable water pumps, staging rescue boats, and deploy sandbag reinforcements.";
      predTime = "1-3 hours";
    } else if (disasterStr.includes("earthquake")) {
      predReason = "Severe structural instability identified with high probability of hazardous aftershocks.";
      predPrep = "Move populations to open ground and clear designated safe paths for emergency vehicles.";
      predTime = "Immediate (Ongoing)";
    } else if (disasterStr.includes("wildfire") || disasterStr.includes("fire")) {
      predReason = "Wind direction is shifting rapidly towards adjacent high-density dry brush borders.";
      predPrep = "Establish fire line breaks and initiate preemptive localized evacuations down-wind.";
      predTime = "4-6 hours";
    } else if (disasterStr.includes("cyclone")) {
      predReason = "Secondary storm surge bands are expected to breach coastal or low-lying defenses.";
      predPrep = "Activate reinforced inland shelters and dispatch high-clearance rescue vehicles safely.";
      predTime = "3-5 hours";
    }

    // 6. Resource Scaling calculations
    const totalPeople = zones.reduce((sum: number, z: ZoneInput) => sum + (parseInt(z.people as string) || 0), 0);
    
    let hasDeficit = false;
    const resourceScalings = resources.map((r: { name: string; value: number }) => {
      let ideal = 0;
      const lowerName = (r.name || "").toLowerCase();
      
      // Industry-standard baseline heuristics per person
      if (lowerName.includes("volunteer")) ideal = Math.ceil(totalPeople / 10);
      else if (lowerName.includes("food")) ideal = totalPeople; // 1 daily ration per person
      else if (lowerName.includes("water")) ideal = totalPeople * 2; // 2 water units per person
      else if (lowerName.includes("medicine") || lowerName.includes("medical")) ideal = Math.ceil(totalPeople / 5);
      else ideal = Math.ceil(totalPeople * 0.5); // safe fallback
      
      const currentSupply = typeof r.value === 'number' ? r.value : parseInt((r.value || "0") as string) || 0;
      
      let deficit = 0;
      if (ideal > currentSupply) {
        deficit = ideal - currentSupply;
        hasDeficit = true;
      } else {
        // If no deficit, demand a safe 20% buffer for unseen circumstances
        deficit = Math.ceil(currentSupply * 0.2);
      }
      
      return {
        name: r.name,
        value: deficit
      };
    });
    
    const scalingReason = hasDeficit 
      ? `Severe resource deficit detected based on ${totalPeople} total affected individuals. Emergency supply lines must be opened.`
      : `Standard 20% operational reserve buffer recommended to sustain response for ${totalPeople} affected individuals.`;

    // 7. Generate output JSON: areas, allocation, reasoning
    const tradeOffs = [
      "Focused allocation on critical areas to maximize life-saving interventions."
    ];
    if (zones.length > 1) {
      tradeOffs.push("Reduced support in low priority zones to concentrate limited resources.");
    }
    if (hasDeficit) {
      tradeOffs.push("Delayed secondary objectives due to severe immediate resource limits.");
    }

    const data = {
      analysis: allocationsByZone.map((z) => ({
        area: z.area,
        severity: z.severity,
        people_affected: z.people,
        priority: z.priority
      })),
      plan: allocationsByZone.map((z) => ({
        area: z.area,
        allocations: z.allocations,
        reason: z.reason
      })),
      trade_offs: tradeOffs,
      prediction: {
        next_area: nextAreaName,
        risk_level: predRisk,
        time_estimate: predTime,
        reason: predReason,
        preparation: predPrep
      },
      resource_scaling: {
        allocations: resourceScalings,
        reason: scalingReason
      },
      what_if: {
        "unpredictable_escalation": "Implement fallback reserve pool for unpredicted crisis escalation.",
        "communication_blackout": "Establish decentralized physical rally points in Priority 1 zones."
      },
      confidence: scoredZones.reduce((acc: Record<string, string>, z) => {
        // Calculate data completeness
        const hasPeople = !!z.originalZone.people && parseInt(z.originalZone.people as string) > 0;
        const hasSeverity = !!z.originalZone.severity && z.originalZone.severity.trim() !== "";
        const hasNotes = !!z.originalZone.notes && z.originalZone.notes.trim() !== "";
        
        let confLevel = "LOW";
        if (hasPeople && hasSeverity && hasNotes) {
          confLevel = "HIGH";
        } else if (hasPeople && hasSeverity) {
          confLevel = "HIGH";
        } else if (hasPeople || hasSeverity) {
          confLevel = "MEDIUM";
        }
        
        const areaName = z.originalZone.name || `Zone ${(acc && Object.keys(acc).length + 1) || 1}`;
        acc[areaName] = confLevel;
        return acc;
      }, {} as Record<string, string>)
    };

    const finalResponse = { 
      success: true,
      source: "simulation", // Flag backend response as simulated/deterministic
      data: data
    };
    
    return Response.json(finalResponse);

  } catch (error) {
    console.error("DETERMINISTIC ENGINE ERROR:", error);
    return Response.json({ 
      success: false, 
      source: "error",
      error: error instanceof Error ? error.message : "Failed to process crisis data deterministically" 
    }, { status: 500 });
  }
}
