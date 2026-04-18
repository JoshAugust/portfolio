export interface Company {
  id: string;
  name: string;
  domain: string;
  description: string;
  industry: string;
  employees: number;
  revenue: string;
  founded: number;
  funding: string;
  city: string;
  state: string;
  icpScore: number;
  grade: 'A' | 'B' | 'C' | 'DQ';
  signals: string[];
  techStack: string[];
  color: string; // for avatar circle
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  title: string;
  email: string;
  linkedin: string;
}

export interface OutreachDraft {
  contactId: string;
  subject: string;
  body: string;
  personalizationScore: number;
}

export type PipelineStage = 'discovered' | 'scoring' | 'enriching' | 'outreach' | 'ready';

export interface PipelineItem {
  company: Company;
  stage: PipelineStage;
  contact?: Contact;
  outreach?: OutreachDraft;
  timestamp: number;
}

export interface ICPConfig {
  description: string;
  companySize: [number, number]; // min, max employees
  revenue: [number, number];
  fundingStages: string[];
  industries: string[];
  foundedAfter: number;
  signals: string[];
}
