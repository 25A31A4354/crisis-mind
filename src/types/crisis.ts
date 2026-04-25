export type ZoneSeverity = 'Low' | 'Medium' | 'High' | '';
export type ZoneVulnerability = 'Low' | 'Medium' | 'High' | '';
export type ZoneAccessibility = 'Easy' | 'Medium' | 'Hard' | '';
export type ZoneInfrastructureDamage = 'Yes' | 'No' | '';
export type ZoneUrgency = 'Stable' | 'Risky' | 'Critical' | '';

export type Zone = {
  id: string;
  name: string;
  people: number;
  severity: ZoneSeverity;
  vulnerability: ZoneVulnerability;
  accessibility: ZoneAccessibility;
  infrastructureDamage: ZoneInfrastructureDamage;
  urgency: ZoneUrgency;
  lat?: number;
  lng?: number;
  notes?: string;
  isManualOverride?: boolean;
};

export type Resource = {
  id: string;
  name: string;
  value: number;
};

export type Allocation = {
  name: string;
  value: number;
  total: number;
  percentage: number;
};

export type PlanArea = {
  id: string;
  area: string;
  score: number;
  priority: number;
  urgency: ZoneUrgency;
  isUnderSupported: boolean;
  allocations: Allocation[];
  reason: string;
  scoreBreakdown: { factor: string; points: number }[];
  actions: string[];
  responseTime: string;
};

export type PredictionItem = {
  next_area: string;
  risk_level: string;
  reason: string;
};

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export type PlanData = {
  plan: PlanArea[];
  trade_offs: string[];
  prediction?: PredictionItem;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  deficitAlert?: {
    underSupportedZones: number;
    affectedZoneIds: string[];
  };
  totalPeopleAffected: number;
  prioritizedPeople: number;
  underSupportedPeople: number;
  isUnreliable: boolean;
  signalData: string;
  zeroResourceAlert?: boolean;
  criticalShortage?: boolean;
  excludedZoneCount?: number;
  lastUpdated: string;
};
