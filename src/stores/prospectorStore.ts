import { create } from 'zustand';
import type { ICPConfig, PipelineItem, PipelineStage } from '../types/prospector';
import {
  mockCompanies,
  getPrimaryContact,
  getOutreachForContact,
} from '../data/mockProspects';

interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: number;
}

interface ProspectorStats {
  companiesScanned: number;
  leadsFound: number;
  emailsDrafted: number;
  avgScore: number;
}

interface ProspectorState {
  // ICP
  icpConfig: ICPConfig | null;
  setICPConfig: (config: ICPConfig) => void;

  // Pipeline
  pipeline: PipelineItem[];
  isRunning: boolean;
  speed: number;
  setSpeed: (speed: number) => void;
  startPipeline: () => void;
  stopPipeline: () => void;

  // Results
  results: PipelineItem[];

  // Chat
  chatMessages: ChatMessage[];
  addMessage: (role: 'user' | 'agent', content: string) => void;

  // Stats
  stats: ProspectorStats;

  // Internal — not exposed to consumers
  _intervalIds: ReturnType<typeof setInterval>[];
}

const STAGES: PipelineStage[] = ['discovered', 'scoring', 'enriching', 'outreach', 'ready'];
const STAGE_DELAY_MS = 1500;
const COMPANY_ADD_DELAY_MS = 800;

export const useProspectorStore = create<ProspectorState>((set, get) => ({
  // ICP
  icpConfig: null,
  setICPConfig: (config) => set({ icpConfig: config }),

  // Pipeline
  pipeline: [],
  isRunning: false,
  speed: 1,
  setSpeed: (speed) => {
    set({ speed });
    const { isRunning, stopPipeline, startPipeline } = get();
    if (isRunning) {
      stopPipeline();
      startPipeline();
    }
  },
  _intervalIds: [],

  startPipeline: () => {
    const { isRunning, stopPipeline, speed } = get();
    if (isRunning) stopPipeline();

    set({
      isRunning: true,
      pipeline: [],
      results: [],
      stats: { companiesScanned: 0, leadsFound: 0, emailsDrafted: 0, avgScore: 0 },
    });

    const companies = [...mockCompanies];
    const intervalIds: ReturnType<typeof setInterval>[] = [];

    const effectiveStageDelay = Math.round(STAGE_DELAY_MS / speed);
    const effectiveCompanyDelay = Math.round(COMPANY_ADD_DELAY_MS / speed);

    // Add one company every 800ms (adjusted by speed)
    let companyIndex = 0;
    const addInterval = setInterval(() => {
      if (companyIndex >= companies.length) {
        clearInterval(addInterval);
        return;
      }

      const company = companies[companyIndex];
      companyIndex++;

      const newItem: PipelineItem = {
        company,
        stage: 'discovered',
        timestamp: Date.now(),
      };

      set((state) => ({
        pipeline: [...state.pipeline, newItem],
        stats: {
          ...state.stats,
          companiesScanned: state.stats.companiesScanned + 1,
        },
      }));

      // Advance this company through pipeline stages (adjusted by speed)
      let stageIndex = 0;
      const stageInterval = setInterval(() => {
        stageIndex++;

        if (stageIndex >= STAGES.length) {
          clearInterval(stageInterval);

          // Move company to results
          set((state) => {
            const item = state.pipeline.find((p) => p.company.id === company.id);
            if (!item) return state;

            const contact = getPrimaryContact(company.id);
            const outreach = contact ? getOutreachForContact(contact.id) : undefined;

            const completedItem: PipelineItem = {
              ...item,
              stage: 'ready',
              contact,
              outreach,
            };

            const newResults = [...state.results, completedItem];
            const totalScore = newResults.reduce((sum, r) => sum + r.company.icpScore, 0);
            const avgScore = newResults.length > 0 ? Math.round(totalScore / newResults.length) : 0;

            return {
              pipeline: state.pipeline.filter((p) => p.company.id !== company.id),
              results: newResults,
              stats: {
                companiesScanned: state.stats.companiesScanned,
                leadsFound: newResults.filter((r) => r.company.grade === 'A' || r.company.grade === 'B').length,
                emailsDrafted: newResults.filter((r) => r.outreach != null).length,
                avgScore,
              },
            };
          });

          return;
        }

        const nextStage = STAGES[stageIndex];

        set((state) => ({
          pipeline: state.pipeline.map((p) =>
            p.company.id === company.id ? { ...p, stage: nextStage } : p,
          ),
        }));
      }, effectiveStageDelay);

      intervalIds.push(stageInterval);
    }, effectiveCompanyDelay);

    intervalIds.push(addInterval);
    set({ _intervalIds: intervalIds });
  },

  stopPipeline: () => {
    const { _intervalIds } = get();
    _intervalIds.forEach((id) => clearInterval(id));
    set({ isRunning: false, _intervalIds: [] });
  },

  // Results
  results: [],

  // Chat
  chatMessages: [
    {
      role: 'agent',
      content: "Hey! I'm your AI prospecting agent. Describe your ideal customer and I'll find, score, and draft outreach for matching companies. What kind of companies are you looking for?",
      timestamp: Date.now(),
    },
  ],
  addMessage: (role, content) =>
    set((state) => ({
      chatMessages: [
        ...state.chatMessages,
        { role, content, timestamp: Date.now() },
      ],
    })),

  // Stats
  stats: {
    companiesScanned: 0,
    leadsFound: 0,
    emailsDrafted: 0,
    avgScore: 0,
  },
}));
