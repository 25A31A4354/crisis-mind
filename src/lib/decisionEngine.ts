import { Zone, Resource, PlanData, PlanArea, PredictionItem, ConfidenceLevel, Allocation } from '@/types/crisis';

function mapSeverity(s: string) {
  if (s === 'High') return 3;
  if (s === 'Medium') return 2;
  return 1;
}

function mapVulnerability(v: string) {
  if (v === 'High') return 3;
  if (v === 'Medium') return 2;
  return 1;
}

function mapAccessibility(a: string) {
  if (a === 'Hard') return 3;
  if (a === 'Medium') return 2;
  return 1;
}

function mapInfrastructure(i: string) {
  if (i === 'Yes') return 3;
  return 1;
}

function mapUrgency(u: string) {
  if (u === 'Critical') return 5;
  if (u === 'Risky') return 3;
  if (u === 'Stable') return 1;
  return 0;
}

function computeETA(accessibility: string, priority: number): string {
  // Slightly faster for top priority (Priority 1)
  const isTopPriority = priority === 1;
  if (accessibility === 'Hard') return isTopPriority ? '60–75 min' : '60–90 min';
  if (accessibility === 'Medium') return isTopPriority ? '25–40 min' : '30–60 min';
  return isTopPriority ? '10–20 min' : '15–30 min';
}

export function runDecisionEngine(
  zones: Zone[],
  resources: Resource[],
  disasterType: string = 'Flood'
): PlanData {
  const lastUpdated = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tradeOffs: string[] = [];

  // Separate complete vs incomplete zones
  const completeZones = zones.filter(z =>
    z.name.trim() !== '' && z.people > 0 &&
    z.severity && z.vulnerability && z.accessibility && z.infrastructureDamage && z.urgency
  );
  const excludedZoneCount = zones.filter(z => z.name.trim() !== '').length - completeZones.length;

  // Zero resource check
  const totalResources = resources.reduce((sum, r) => sum + r.value, 0);
  const zeroResourceAlert = totalResources === 0;

  if (completeZones.length === 0) {
    return {
      plan: [],
      trade_offs: [],
      confidence: 'LOW',
      confidenceReason: 'No complete zones provided. Ensure all fields are filled for at least one zone.',
      totalPeopleAffected: 0,
      prioritizedPeople: 0,
      underSupportedPeople: 0,
      isUnreliable: true,
      signalData: 'No valid zone data',
      zeroResourceAlert,
      excludedZoneCount,
      lastUpdated,
    };
  }

  // Confidence calculation
  let filledCount = 0;
  const totalFields = completeZones.length * 7;
  completeZones.forEach(z => {
    if (z.name) filledCount++;
    if (z.people > 0) filledCount++;
    if (z.severity) filledCount++;
    if (z.vulnerability) filledCount++;
    if (z.accessibility) filledCount++;
    if (z.infrastructureDamage) filledCount++;
    if (z.urgency) filledCount++;
  });

  const completionRatio = filledCount / totalFields;
  let confidence: ConfidenceLevel = 'LOW';
  let confidenceReason = 'Incomplete data sets across zones.';
  if (completionRatio === 1) {
    confidence = 'HIGH';
    confidenceReason = 'All data points are complete for optimal decision making.';
  } else if (completionRatio > 0.5) {
    confidence = 'MEDIUM';
    confidenceReason = 'Some fields are missing, relying on baseline assumptions.';
  }

  // Score Calculation — override zones always float to the top (no +1000 hack)
  let totalPeopleAffected = 0;

  const scoredZones = completeZones.map(zone => {
    totalPeopleAffected += (zone.people || 0);

    const peopleScore = zone.people / 100;
    const severityScore = mapSeverity(zone.severity) * 3;
    const vulnerabilityScore = mapVulnerability(zone.vulnerability) * 2;
    const accessibilityScore = mapAccessibility(zone.accessibility) * 2;
    const infraScore = mapInfrastructure(zone.infrastructureDamage) * 2;
    const urgencyScore = mapUrgency(zone.urgency);

    const totalScore = peopleScore + severityScore + vulnerabilityScore + accessibilityScore + infraScore + urgencyScore;

    const scoreBreakdown = [
      { factor: 'Population Scaling', points: peopleScore },
      { factor: `Severity (${zone.severity || 'Low'})`, points: severityScore },
      { factor: `Vulnerability (${zone.vulnerability || 'Low'})`, points: vulnerabilityScore },
      { factor: `Accessibility (${zone.accessibility || 'Easy'})`, points: accessibilityScore },
      { factor: `Infra Damage (${zone.infrastructureDamage || 'No'})`, points: infraScore },
      { factor: `Urgency (${zone.urgency || 'None'})`, points: urgencyScore },
    ];

    if (zone.isManualOverride) {
      scoreBreakdown.push({ factor: 'MANUAL OVERRIDE', points: 0 });
    }

    return { zone, score: totalScore, scoreBreakdown };
  });

  // Sort: override zones first, then by score descending
  scoredZones.sort((a, b) => {
    const aOverride = a.zone.isManualOverride ? 1 : 0;
    const bOverride = b.zone.isManualOverride ? 1 : 0;
    if (bOverride !== aOverride) return bOverride - aOverride;
    return b.score - a.score;
  });

  // Resource Allocation
  const planAreas: PlanArea[] = [];
  const topPriorities = scoredZones.slice(0, 3);
  const topPrioritySum = topPriorities.reduce((sum, sz) => sum + sz.score, 0);

  let underSupportedZones = 0;
  const affectedZoneIds: string[] = [];
  let prioritizedPeople = 0;
  let underSupportedPeople = 0;

  scoredZones.forEach((sz, idx) => {
    const priority = idx + 1;
    const isTopPriority = priority <= 3;
    const allocations: Allocation[] = [];

    if (isTopPriority) prioritizedPeople += sz.zone.people;

    let totalAllocatedToZone = 0;

    if (!zeroResourceAlert) {
      resources.forEach(r => {
        let finalAlloc = 0;
        // Base: 10% minimum to each zone
        const baseAlloc = Math.max(1, Math.floor(r.value * 0.10));
        finalAlloc += baseAlloc;

        // Remaining distributed proportionally to top 3 by score
        if (isTopPriority && topPrioritySum > 0) {
          const remaining = r.value - (Math.max(1, Math.floor(r.value * 0.10)) * scoredZones.length);
          if (remaining > 0) {
            const share = Math.floor(remaining * (sz.score / topPrioritySum));
            finalAlloc += share;
          }
        }

        finalAlloc = Math.min(finalAlloc, r.value); // cap at total
        totalAllocatedToZone += finalAlloc;
        const pct = r.value > 0 ? Math.round((finalAlloc / r.value) * 100) : 0;
        allocations.push({ name: r.name, value: finalAlloc, total: r.value, percentage: pct });
      });
    } else {
      // Zero resources — push 0-allocation entries
      resources.forEach(r => allocations.push({ name: r.name, value: 0, total: 0, percentage: 0 }));
    }

    const minimumRequiredForSafeSupport = sz.zone.people * 0.1;
    const isUnderSupported = !zeroResourceAlert && totalAllocatedToZone < minimumRequiredForSafeSupport;

    if (isUnderSupported) {
      underSupportedZones++;
      affectedZoneIds.push(sz.zone.id);
      underSupportedPeople += sz.zone.people;
    }

    let reason = '';
    if (sz.zone.isManualOverride) {
      reason = `Ranked Priority ${priority} via Manual Override. System scoring preserved for audit.`;
    } else if (isTopPriority) {
      reason = `Designated Priority ${priority} — risk score ${sz.score.toFixed(1)}.`;
      if (sz.zone.urgency === 'Critical') reason += ' Critical urgency window (<3 hrs) active.';
    } else {
      reason = `Baseline resources only. Score (${sz.score.toFixed(1)}) is lower than critical zones.`;
    }

    const actions: string[] = [];
    if (isTopPriority) {
      if (sz.zone.severity === 'High') actions.push('Evacuate immediately');
      if (sz.zone.vulnerability === 'High') actions.push('Send medical team NOW');
      if (sz.zone.accessibility === 'Hard') actions.push('Deploy boats / transport immediately');
      if (sz.zone.infrastructureDamage === 'Yes') actions.push('Dispatch heavy emergency repair');
      if (actions.length === 0) actions.push('Establish staging area');
    }

    const responseTime = computeETA(sz.zone.accessibility, priority);

    planAreas.push({
      id: sz.zone.id,
      area: sz.zone.name,
      score: sz.score,
      scoreBreakdown: sz.scoreBreakdown,
      priority,
      urgency: sz.zone.urgency,
      isUnderSupported,
      allocations,
      reason,
      actions,
      responseTime,
    });
  });

  if (scoredZones.length > 1) {
    const highest = scoredZones[0];
    const lowest = scoredZones[scoredZones.length - 1];
    if (highest.zone.isManualOverride) {
      tradeOffs.push(`${highest.zone.name} ranked first via Manual Commander Override. All system scores preserved below.`);
    } else {
      tradeOffs.push(`${highest.zone.name} received priority resources — severity (${highest.zone.severity}) and urgency drove a higher risk score than ${lowest.zone.name}.`);
    }
  } else {
    tradeOffs.push('All available resources directed to the single reported zone.');
  }

  // Predictions
  let prediction: PredictionItem | undefined = undefined;
  const highRiskEscalation = completeZones.find(z => z.severity === 'High' && z.accessibility === 'Hard');
  if (highRiskEscalation) {
    prediction = {
      next_area: highRiskEscalation.name,
      risk_level: 'ESCALATING',
      reason: 'Zone exhibits High severity paired with Hard accessibility. Compound casualties risk if untreated.',
    };
  }

  const deficitAlert = underSupportedZones > 0 ? { underSupportedZones, affectedZoneIds } : undefined;
  const criticalShortage = underSupportedZones >= Math.ceil(completeZones.length / 2);
  const isUnreliable = completionRatio < 0.7 || underSupportedZones >= Math.ceil(completeZones.length / 2);

  const signals: Record<string, string> = {
    'Flood': 'Heavy precipitation forecasted for the next 12 hours.',
    'Earthquake': 'Strong aftershocks mapped near epicenter. Infrastructure unstable.',
    'Wildfire': 'High winds shifting East. Containment lines dropping.',
    'Cyclone': 'Storm surge expected to exceed 3 meters upon landfall.',
    'Industrial Accident': 'Toxic plume expanding rapidly due to prevailing winds.',
    '': 'Awaiting sensor payloads.',
  };
  const signalData = signals[disasterType] || signals[''];

  return {
    plan: planAreas,
    trade_offs: tradeOffs,
    prediction,
    confidence,
    confidenceReason,
    deficitAlert,
    totalPeopleAffected,
    prioritizedPeople,
    underSupportedPeople,
    isUnreliable,
    signalData,
    zeroResourceAlert,
    criticalShortage,
    excludedZoneCount,
    lastUpdated,
  };
}
