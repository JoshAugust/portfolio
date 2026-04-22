/**
 * sessionTracks.ts
 * Apex Summit session track definitions.
 */

import type { SessionTrack } from '../types';

export const SESSION_TRACKS: SessionTrack[] = [
  {
    id: 'ai_ml',
    name: 'AI & Machine Learning',
    keywords: [
      'ai', 'artificial intelligence', 'machine learning', 'ml',
      'llm', 'deep learning', 'neural', 'gpt', 'claude', 'nlp',
      'computer vision', 'data science', 'large language model',
      'transformer', 'diffusion', 'generative', 'chatbot',
    ],
  },
  {
    id: 'product_design',
    name: 'Product Design',
    keywords: [
      'product', 'design', 'product design', 'ux', 'ui', 'user experience',
      'user interface', 'figma', 'prototype', 'interaction design',
      'design system', 'wireframe', 'usability', 'visual design',
    ],
  },
  {
    id: 'ux_research',
    name: 'UX Research',
    keywords: [
      'ux research', 'user research', 'usability', 'testing',
      'interviews', 'surveys', 'personas', 'research', 'qualitative',
      'quantitative', 'ethnography', 'discovery', 'synthesis',
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering Leadership',
    keywords: [
      'engineering', 'leadership', 'management', 'tech lead',
      'architecture', 'scaling', 'devops', 'infrastructure',
      'backend', 'frontend', 'full stack', 'platform', 'distributed',
      'microservices', 'cloud', 'aws', 'gcp', 'azure', 'kubernetes',
    ],
  },
  {
    id: 'startups',
    name: 'Startups & Funding',
    keywords: [
      'startup', 'funding', 'venture', 'vc', 'fundraising',
      'entrepreneurship', 'founder', 'pitch', 'business',
      'growth', 'revenue', 'saas', 'b2b', 'b2c', 'gtm',
      'go to market', 'product market fit', 'pmf', 'angel',
    ],
  },
];

export default SESSION_TRACKS;
