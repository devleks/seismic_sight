export interface SeismicData {
  magnitude: number;
  location: string;
  depth: number;
  timestamp: string;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
}

export interface HazardIndicator {
  id: string;
  type: 'structural' | 'fire' | 'glass' | 'falling' | 'exit';
  label: string;
  details: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  timestamp: string;
  confidence: number; // 0-1
}

export interface HazardAnalysis {
  hazards: string[];
  recommendations: string[];
  structuralIntegrity: number; // 0-100
  indicators: HazardIndicator[];
}

export enum AppStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  SIMULATING = 'SIMULATING',
  ERROR = 'ERROR'
}

declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}
