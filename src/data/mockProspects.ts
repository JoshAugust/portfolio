import type { Company, Contact, OutreachDraft } from '../types/prospector';

export const mockCompanies: Company[] = [
  {
    id: 'c-001',
    name: 'NeuralStack',
    domain: 'neuralstack.ai',
    description: 'NeuralStack builds infrastructure for teams deploying LLMs at scale — model routing, prompt versioning, and observability baked in. Think Datadog, but for your AI layer.',
    industry: 'AI/ML Infrastructure',
    employees: 34,
    revenue: '$2.1M ARR',
    founded: 2022,
    funding: 'Seed ($4.5M)',
    city: 'San Francisco',
    state: 'CA',
    icpScore: 92,
    grade: 'A',
    signals: ['Posted 3 AI Engineer roles in last 30 days', 'CTO spoke at MLConf 2025', 'New pricing page launched'],
    techStack: ['Python', 'FastAPI', 'Kubernetes', 'Postgres', 'Stripe'],
    color: 'violet-500',
  },
  {
    id: 'c-002',
    name: 'DevPulse',
    domain: 'devpulse.io',
    description: 'DevPulse surfaces engineering velocity signals from GitHub, Jira, and CI pipelines — giving eng leaders a real-time pulse on team health without the spreadsheets.',
    industry: 'DevTools / Engineering Analytics',
    employees: 22,
    revenue: '$1.4M ARR',
    founded: 2021,
    funding: 'Seed ($3.2M)',
    city: 'Austin',
    state: 'TX',
    icpScore: 88,
    grade: 'A',
    signals: ['Raised seed round 6 months ago', 'Integration with Linear announced', 'Active job posting: Head of Growth'],
    techStack: ['TypeScript', 'React', 'Node.js', 'Postgres', 'GitHub API'],
    color: 'blue-500',
  },
  {
    id: 'c-003',
    name: 'CodeShield',
    domain: 'codeshield.dev',
    description: 'CodeShield scans pull requests for secrets, misconfigurations, and supply chain vulnerabilities before they hit production — integrated directly into the developer workflow.',
    industry: 'Cybersecurity / DevSecOps',
    employees: 41,
    revenue: '$3.8M ARR',
    founded: 2020,
    funding: 'Series A ($11M)',
    city: 'Seattle',
    state: 'WA',
    icpScore: 85,
    grade: 'A',
    signals: ['SOC2 Type II certified last quarter', 'GitHub Marketplace listing updated', 'Hiring VP of Sales'],
    techStack: ['Go', 'Rust', 'Kubernetes', 'GitHub API', 'AWS'],
    color: 'rose-500',
  },
  {
    id: 'c-004',
    name: 'Stackfuel',
    domain: 'stackfuel.com',
    description: 'Stackfuel is a developer-first data pipeline platform that replaces brittle ETL scripts with declarative YAML configs and automatic lineage tracking.',
    industry: 'Data Infrastructure',
    employees: 18,
    revenue: '$900K ARR',
    founded: 2023,
    funding: 'Pre-Seed ($1.8M)',
    city: 'New York',
    state: 'NY',
    icpScore: 79,
    grade: 'B',
    signals: ['Featured in Hacker News Show HN', 'Launched dbt integration', 'Open-source repo hit 1.2K stars'],
    techStack: ['Python', 'dbt', 'Airbyte', 'Snowflake', 'Docker'],
    color: 'amber-500',
  },
  {
    id: 'c-005',
    name: 'Parsec AI',
    domain: 'parsec.ai',
    description: 'Parsec AI automates contract review for mid-market legal teams — extracting obligations, flagging risk clauses, and generating redline suggestions in minutes, not days.',
    industry: 'LegalTech / AI',
    employees: 29,
    revenue: '$2.6M ARR',
    founded: 2022,
    funding: 'Seed ($5.5M)',
    city: 'Chicago',
    state: 'IL',
    icpScore: 83,
    grade: 'A',
    signals: ['Partnership with Ironclad announced', 'Hiring ML Engineer and 2 AEs', 'Blog post on GPT-4o contract parsing'],
    techStack: ['Python', 'OpenAI', 'React', 'Django', 'AWS'],
    color: 'cyan-500',
  },
  {
    id: 'c-006',
    name: 'FlowMetrics',
    domain: 'flowmetrics.co',
    description: 'FlowMetrics gives RevOps teams a single source of truth for pipeline health — connecting CRM data, call recordings, and email activity into actionable funnel intelligence.',
    industry: 'Revenue Intelligence / SaaS',
    employees: 16,
    revenue: '$750K ARR',
    founded: 2023,
    funding: 'Pre-Seed ($1.2M)',
    city: 'Denver',
    state: 'CO',
    icpScore: 71,
    grade: 'B',
    signals: ['Salesforce AppExchange listing live', 'CEO posted on LinkedIn about Q1 growth', 'Joined Y Combinator W24 batch'],
    techStack: ['TypeScript', 'React', 'Salesforce API', 'HubSpot API', 'Postgres'],
    color: 'emerald-500',
  },
  {
    id: 'c-007',
    name: 'VaultEdge',
    domain: 'vaultedge.io',
    description: 'VaultEdge provides zero-knowledge secrets management for cloud-native teams — storing, rotating, and auditing credentials without ever seeing the plaintext values.',
    industry: 'Cybersecurity / Secrets Management',
    employees: 37,
    revenue: '$4.2M ARR',
    founded: 2021,
    funding: 'Series A ($9M)',
    city: 'Boston',
    state: 'MA',
    icpScore: 87,
    grade: 'A',
    signals: ['AWS Marketplace listing approved', 'Published FIPS 140-2 compliance blog', 'VP Eng posted about scaling to 500 customers'],
    techStack: ['Go', 'Rust', 'AWS KMS', 'Terraform', 'Kubernetes'],
    color: 'indigo-500',
  },
  {
    id: 'c-008',
    name: 'ShipLane',
    domain: 'shiplane.dev',
    description: 'ShipLane streamlines e-commerce fulfillment by connecting warehouse management systems, carriers, and storefronts into a single orchestration layer — with ML-based routing to cut shipping costs.',
    industry: 'Logistics / E-commerce Tech',
    employees: 52,
    revenue: '$6.1M ARR',
    founded: 2020,
    funding: 'Series A ($15M)',
    city: 'Los Angeles',
    state: 'CA',
    icpScore: 68,
    grade: 'B',
    signals: ['Shopify Plus partner badge earned', 'New WMS integrations: 3PL Central, Fishbowl', 'Hiring 4 engineers'],
    techStack: ['Node.js', 'React', 'Shopify API', 'AWS', 'Postgres'],
    color: 'orange-500',
  },
  {
    id: 'c-009',
    name: 'Beacon Analytics',
    domain: 'beaconanalytics.io',
    description: 'Beacon Analytics delivers product analytics for mobile-first B2C companies — with session replay, funnel analysis, and retention cohorts designed for high-volume event streams.',
    industry: 'Product Analytics / SaaS',
    employees: 27,
    revenue: '$1.9M ARR',
    founded: 2021,
    funding: 'Seed ($4M)',
    city: 'Miami',
    state: 'FL',
    icpScore: 74,
    grade: 'B',
    signals: ['iOS SDK v3.0 released last week', 'Case study published with DoorDash competitor', 'Competitor Mixpanel raised prices'],
    techStack: ['Swift', 'Kotlin', 'TypeScript', 'ClickHouse', 'Kafka'],
    color: 'teal-500',
  },
  {
    id: 'c-010',
    name: 'TerraOps',
    domain: 'terraops.cloud',
    description: 'TerraOps makes Terraform manageable at scale — drift detection, cost forecasting, and module governance in a self-hosted or cloud platform that engineering orgs actually adopt.',
    industry: 'DevOps / Infrastructure as Code',
    employees: 20,
    revenue: '$1.1M ARR',
    founded: 2022,
    funding: 'Seed ($2.8M)',
    city: 'Portland',
    state: 'OR',
    icpScore: 81,
    grade: 'A',
    signals: ['HashiCorp partnership announcement', 'Terraform provider published to registry', 'Opened Series A process (LinkedIn post)'],
    techStack: ['Go', 'Terraform', 'AWS', 'GCP', 'React'],
    color: 'lime-500',
  },
  {
    id: 'c-011',
    name: 'CipherGrid',
    domain: 'ciphergrid.com',
    description: 'CipherGrid is a network security platform that gives security teams visibility into encrypted traffic anomalies without decryption — leveraging ML on metadata patterns to catch threats early.',
    industry: 'Cybersecurity / Network Security',
    employees: 44,
    revenue: '$5.3M ARR',
    founded: 2020,
    funding: 'Series A ($13M)',
    city: 'McLean',
    state: 'VA',
    icpScore: 76,
    grade: 'B',
    signals: ['FedRAMP authorization in progress', 'RSAC 2025 booth secured', 'Hiring 2 Federal Sales Directors'],
    techStack: ['C++', 'Python', 'Kafka', 'Elasticsearch', 'AWS GovCloud'],
    color: 'red-500',
  },
  {
    id: 'c-012',
    name: 'DataForge',
    domain: 'dataforge.ai',
    description: 'DataForge accelerates AI data preparation — automating labeling, deduplication, and schema normalization so ML teams spend less time wrangling CSVs and more time training models.',
    industry: 'AI/ML Data Tooling',
    employees: 25,
    revenue: '$1.7M ARR',
    founded: 2022,
    funding: 'Seed ($3.5M)',
    city: 'San Francisco',
    state: 'CA',
    icpScore: 89,
    grade: 'A',
    signals: ['Integration with Hugging Face Hub launched', 'Raised seed extension (crunchbase)', 'CTO presenting at Data + AI Summit'],
    techStack: ['Python', 'Spark', 'Hugging Face', 'React', 'GCP'],
    color: 'fuchsia-500',
  },
  {
    id: 'c-013',
    name: 'Runloop',
    domain: 'runloop.dev',
    description: 'Runloop provides sandboxed cloud dev environments that spin up in under 3 seconds — letting engineering teams eliminate "works on my machine" by standardizing on ephemeral, reproducible workspaces.',
    industry: 'DevTools / Cloud IDEs',
    employees: 19,
    revenue: '$1.2M ARR',
    founded: 2023,
    funding: 'Seed ($3M)',
    city: 'San Francisco',
    state: 'CA',
    icpScore: 91,
    grade: 'A',
    signals: ['VS Code extension hit 10K installs', 'GitHub Codespaces pricing spike driving inbound', 'Open-source sandbox runtime released'],
    techStack: ['Rust', 'TypeScript', 'Kubernetes', 'nix', 'AWS'],
    color: 'sky-500',
  },
  {
    id: 'c-014',
    name: 'Promptly AI',
    domain: 'promptly.ai',
    description: 'Promptly AI is a no-code platform for building, testing, and deploying AI workflows — letting product and ops teams ship LLM-powered features without writing a single line of Python.',
    industry: 'AI Workflow Automation / No-Code',
    employees: 31,
    revenue: '$2.3M ARR',
    founded: 2022,
    funding: 'Seed ($5M)',
    city: 'New York',
    state: 'NY',
    icpScore: 82,
    grade: 'A',
    signals: ['Zapier competitor positioning shift', '3 enterprise logos added to homepage', 'VP Product hire announced on LinkedIn'],
    techStack: ['Python', 'LangChain', 'React', 'Postgres', 'Stripe'],
    color: 'purple-500',
  },
  {
    id: 'c-015',
    name: 'SigmaCloud',
    domain: 'sigmacloud.io',
    description: 'SigmaCloud gives DevOps teams a unified cost observability layer across AWS, GCP, and Azure — with anomaly detection, showback reports, and Slack alerts when spend spikes.',
    industry: 'FinOps / Cloud Cost Management',
    employees: 23,
    revenue: '$1.6M ARR',
    founded: 2022,
    funding: 'Seed ($3.8M)',
    city: 'Austin',
    state: 'TX',
    icpScore: 78,
    grade: 'B',
    signals: ['AWS re:Invent partner sponsorship', 'New Terraform module for cost tagging published', 'Competitor Spot.io acquired — market in motion'],
    techStack: ['Python', 'AWS', 'GCP', 'Azure', 'React', 'ClickHouse'],
    color: 'yellow-500',
  },
  {
    id: 'c-016',
    name: 'Nexlayer',
    domain: 'nexlayer.com',
    description: 'Nexlayer is a deployment platform for full-stack AI apps — one command to ship a Next.js frontend, Python backend, and vector database to production with autoscaling built in.',
    industry: 'AI Infrastructure / PaaS',
    employees: 14,
    revenue: '$480K ARR',
    founded: 2024,
    funding: 'Pre-Seed ($800K)',
    city: 'San Francisco',
    state: 'CA',
    icpScore: 63,
    grade: 'C',
    signals: ['Product Hunt launch — #2 product of the day', 'Joined a16z START program', 'Founder on Twitter thread about AI deployment pain'],
    techStack: ['TypeScript', 'Next.js', 'Python', 'pgvector', 'Fly.io'],
    color: 'zinc-500',
  },
  {
    id: 'c-017',
    name: 'BuildKit',
    domain: 'buildkit.dev',
    description: 'BuildKit is an internal developer portal platform — giving platform engineering teams a Backstage-like service catalog, scaffolding, and golden path workflows without the 18-month setup.',
    industry: 'DevTools / Platform Engineering',
    employees: 28,
    revenue: '$2.0M ARR',
    founded: 2021,
    funding: 'Seed ($4.2M)',
    city: 'Chicago',
    state: 'IL',
    icpScore: 80,
    grade: 'B',
    signals: ['Backstage frustration thread went viral — referenced company', 'Hiring Platform Engineer Advocate', 'Integration with PagerDuty and OpsGenie shipped'],
    techStack: ['TypeScript', 'React', 'Node.js', 'Backstage', 'Postgres'],
    color: 'stone-500',
  },
  {
    id: 'c-018',
    name: 'AuthWave',
    domain: 'authwave.io',
    description: `AuthWave provides drop-in B2B authentication — SSO, SCIM provisioning, and audit logs for SaaS companies that want enterprise contracts but don\'t want to build auth from scratch.`,
    industry: 'Identity / Auth Infrastructure',
    employees: 21,
    revenue: '$1.5M ARR',
    founded: 2022,
    funding: 'Seed ($3.6M)',
    city: 'Boston',
    state: 'MA',
    icpScore: 86,
    grade: 'A',
    signals: ['WorkOS pricing increased — customers looking for alternatives', 'SOC2 Type II completed', 'CTO blog post on SCIM implementation complexity'],
    techStack: ['Go', 'React', 'Postgres', 'AWS', 'Stripe'],
    color: 'blue-400',
  },
  {
    id: 'c-019',
    name: 'MetricFlow',
    domain: 'metricflow.co',
    description: 'MetricFlow is a metrics layer for data teams — defining business metrics once in YAML, then serving them consistently to BI tools, data apps, and API consumers without duplication.',
    industry: 'Data / Analytics Engineering',
    employees: 17,
    revenue: '$820K ARR',
    founded: 2023,
    funding: 'Pre-Seed ($1.5M)',
    city: 'Seattle',
    state: 'WA',
    icpScore: 72,
    grade: 'B',
    signals: ['dbt Semantic Layer integration shipped', 'Featured in data engineering newsletter (15K subs)', 'Founder presenting at Coalesce 2025'],
    techStack: ['Python', 'dbt', 'Snowflake', 'BigQuery', 'React'],
    color: 'emerald-400',
  },
  {
    id: 'c-020',
    name: 'Cobalt Systems',
    domain: 'cobalt.systems',
    description: 'Cobalt Systems builds agent orchestration infrastructure for enterprise AI deployments — giving ops teams audit trails, access controls, and rollback capabilities for autonomous AI agents.',
    industry: 'AI Infrastructure / Agent Ops',
    employees: 38,
    revenue: '$3.1M ARR',
    founded: 2023,
    funding: 'Seed ($7M)',
    city: 'New York',
    state: 'NY',
    icpScore: 90,
    grade: 'A',
    signals: ['Raised $7M seed 3 months ago', 'Partnership with Microsoft Azure AI announced', 'CTO gave keynote at AgentCon 2025'],
    techStack: ['Python', 'TypeScript', 'LangGraph', 'Postgres', 'Azure'],
    color: 'violet-400',
  },
];

export const mockContacts: Contact[] = [
  // NeuralStack
  { id: 'ct-001', companyId: 'c-001', name: 'Maya Chen', title: 'CEO & Co-Founder', email: 'maya@neuralstack.ai', linkedin: 'linkedin.com/in/mayachen-neuralstack' },
  { id: 'ct-002', companyId: 'c-001', name: 'Arjun Patel', title: 'CTO & Co-Founder', email: 'arjun@neuralstack.ai', linkedin: 'linkedin.com/in/arjunpatel-ml' },
  { id: 'ct-003', companyId: 'c-001', name: 'Sofia Reyes', title: 'Head of Growth', email: 'sofia@neuralstack.ai', linkedin: 'linkedin.com/in/sofiareyes-growth' },
  // DevPulse
  { id: 'ct-004', companyId: 'c-002', name: 'Liam Torres', title: 'CEO & Co-Founder', email: 'liam@devpulse.io', linkedin: 'linkedin.com/in/liamtorres-devpulse' },
  { id: 'ct-005', companyId: 'c-002', name: 'Priya Nair', title: 'VP Engineering', email: 'priya@devpulse.io', linkedin: 'linkedin.com/in/priyanair-eng' },
  // CodeShield
  { id: 'ct-006', companyId: 'c-003', name: 'James Whitfield', title: 'CEO', email: 'james@codeshield.dev', linkedin: 'linkedin.com/in/jameswhitfield-security' },
  { id: 'ct-007', companyId: 'c-003', name: 'Dana Kim', title: 'CTO', email: 'dana@codeshield.dev', linkedin: 'linkedin.com/in/danakim-devsec' },
  { id: 'ct-008', companyId: 'c-003', name: 'Marcus Webb', title: 'VP Sales', email: 'marcus@codeshield.dev', linkedin: 'linkedin.com/in/marcuswebb-sales' },
  // Stackfuel
  { id: 'ct-009', companyId: 'c-004', name: 'Elena Vasquez', title: 'CEO & Founder', email: 'elena@stackfuel.com', linkedin: 'linkedin.com/in/elenavasquez-data' },
  { id: 'ct-010', companyId: 'c-004', name: 'Noah Park', title: 'Head of Engineering', email: 'noah@stackfuel.com', linkedin: 'linkedin.com/in/noahpark-eng' },
  // Parsec AI
  { id: 'ct-011', companyId: 'c-005', name: 'Rachel Goldman', title: 'CEO & Co-Founder', email: 'rachel@parsec.ai', linkedin: 'linkedin.com/in/rachelgoldman-legaltech' },
  { id: 'ct-012', companyId: 'c-005', name: 'Tyler Brooks', title: 'CTO', email: 'tyler@parsec.ai', linkedin: 'linkedin.com/in/tylerbrooks-ai' },
  // FlowMetrics
  { id: 'ct-013', companyId: 'c-006', name: 'Samantha Osei', title: 'CEO & Founder', email: 'sam@flowmetrics.co', linkedin: 'linkedin.com/in/samanthaosei-revops' },
  { id: 'ct-014', companyId: 'c-006', name: 'Derek Liu', title: 'Head of Product', email: 'derek@flowmetrics.co', linkedin: 'linkedin.com/in/derekliu-product' },
  // VaultEdge
  { id: 'ct-015', companyId: 'c-007', name: 'Aisha Johnson', title: 'CEO', email: 'aisha@vaultedge.io', linkedin: 'linkedin.com/in/aishajohnson-security' },
  { id: 'ct-016', companyId: 'c-007', name: 'Brendan Holt', title: 'CTO', email: 'brendan@vaultedge.io', linkedin: 'linkedin.com/in/brendanholt-infra' },
  { id: 'ct-017', companyId: 'c-007', name: 'Leila Moradi', title: 'VP Engineering', email: 'leila@vaultedge.io', linkedin: 'linkedin.com/in/leilamoradi-eng' },
  // ShipLane
  { id: 'ct-018', companyId: 'c-008', name: 'Carlos Mendez', title: 'CEO & Co-Founder', email: 'carlos@shiplane.dev', linkedin: 'linkedin.com/in/carlosmendez-logistics' },
  { id: 'ct-019', companyId: 'c-008', name: 'Yuki Tanaka', title: 'CTO', email: 'yuki@shiplane.dev', linkedin: 'linkedin.com/in/yukitanaka-ecommerce' },
  // Beacon Analytics
  { id: 'ct-020', companyId: 'c-009', name: 'Jordan Wallace', title: 'CEO & Founder', email: 'jordan@beaconanalytics.io', linkedin: 'linkedin.com/in/jordanwallace-analytics' },
  { id: 'ct-021', companyId: 'c-009', name: 'Fatima Al-Rashid', title: 'Head of Engineering', email: 'fatima@beaconanalytics.io', linkedin: 'linkedin.com/in/fatimaalrashid-mobile' },
  // TerraOps
  { id: 'ct-022', companyId: 'c-010', name: 'Owen Murphy', title: 'CEO & Co-Founder', email: 'owen@terraops.cloud', linkedin: 'linkedin.com/in/owenmurphy-devops' },
  { id: 'ct-023', companyId: 'c-010', name: 'Ingrid Larsen', title: 'CTO', email: 'ingrid@terraops.cloud', linkedin: 'linkedin.com/in/ingridlarsen-iac' },
  // CipherGrid
  { id: 'ct-024', companyId: 'c-011', name: 'Victor Ashby', title: 'CEO', email: 'victor@ciphergrid.com', linkedin: 'linkedin.com/in/victorashby-security' },
  { id: 'ct-025', companyId: 'c-011', name: 'Nicole Tran', title: 'VP Engineering', email: 'nicole@ciphergrid.com', linkedin: 'linkedin.com/in/nicoletran-neteng' },
  // DataForge
  { id: 'ct-026', companyId: 'c-012', name: 'Remi Okonkwo', title: 'CEO & Co-Founder', email: 'remi@dataforge.ai', linkedin: 'linkedin.com/in/remiokonkwo-ai' },
  { id: 'ct-027', companyId: 'c-012', name: 'Sarah Lindqvist', title: 'CTO', email: 'sarah@dataforge.ai', linkedin: 'linkedin.com/in/sarahlindqvist-ml' },
  { id: 'ct-028', companyId: 'c-012', name: 'Kevin Zhang', title: 'Head of Ops', email: 'kevin@dataforge.ai', linkedin: 'linkedin.com/in/kevinzhang-ops' },
  // Runloop
  { id: 'ct-029', companyId: 'c-013', name: 'Zoe Hartmann', title: 'CEO & Founder', email: 'zoe@runloop.dev', linkedin: 'linkedin.com/in/zoehartmann-devtools' },
  { id: 'ct-030', companyId: 'c-013', name: 'Ben Okafor', title: 'CTO', email: 'ben@runloop.dev', linkedin: 'linkedin.com/in/benokafor-infra' },
  // Promptly AI
  { id: 'ct-031', companyId: 'c-014', name: 'Isabelle Fontaine', title: 'CEO & Co-Founder', email: 'isabelle@promptly.ai', linkedin: 'linkedin.com/in/isabellefontaine-ai' },
  { id: 'ct-032', companyId: 'c-014', name: 'Marcus Reid', title: 'VP Product', email: 'marcus@promptly.ai', linkedin: 'linkedin.com/in/marcusreid-product' },
  // SigmaCloud
  { id: 'ct-033', companyId: 'c-015', name: 'Tomas Bauer', title: 'CEO & Founder', email: 'tomas@sigmacloud.io', linkedin: 'linkedin.com/in/tomasbauer-finops' },
  { id: 'ct-034', companyId: 'c-015', name: 'Priyanka Shah', title: 'Head of Engineering', email: 'priyanka@sigmacloud.io', linkedin: 'linkedin.com/in/priyankashah-cloud' },
  // Nexlayer
  { id: 'ct-035', companyId: 'c-016', name: 'Alex Nguyen', title: 'CEO & Founder', email: 'alex@nexlayer.com', linkedin: 'linkedin.com/in/alexnguyen-ai' },
  // BuildKit
  { id: 'ct-036', companyId: 'c-017', name: 'Diana Foster', title: 'CEO & Co-Founder', email: 'diana@buildkit.dev', linkedin: 'linkedin.com/in/dianafoster-platform' },
  { id: 'ct-037', companyId: 'c-017', name: 'Raj Kapoor', title: 'VP Engineering', email: 'raj@buildkit.dev', linkedin: 'linkedin.com/in/rajkapoor-devtools' },
  // AuthWave
  { id: 'ct-038', companyId: 'c-018', name: 'Natasha Ivanova', title: 'CEO & Founder', email: 'natasha@authwave.io', linkedin: 'linkedin.com/in/natashaiVanova-auth' },
  { id: 'ct-039', companyId: 'c-018', name: 'David Osei', title: 'CTO', email: 'david@authwave.io', linkedin: 'linkedin.com/in/davidosei-identity' },
  // MetricFlow
  { id: 'ct-040', companyId: 'c-019', name: 'Claire Beaumont', title: 'CEO & Co-Founder', email: 'claire@metricflow.co', linkedin: 'linkedin.com/in/clairebeaumont-data' },
  { id: 'ct-041', companyId: 'c-019', name: 'Jared Moon', title: 'Head of Engineering', email: 'jared@metricflow.co', linkedin: 'linkedin.com/in/jaredmoon-analytics' },
  // Cobalt Systems
  { id: 'ct-042', companyId: 'c-020', name: 'Patrick Abara', title: 'CEO & Co-Founder', email: 'patrick@cobalt.systems', linkedin: 'linkedin.com/in/patrickabara-ai' },
  { id: 'ct-043', companyId: 'c-020', name: 'Mei Lin', title: 'CTO', email: 'mei@cobalt.systems', linkedin: 'linkedin.com/in/meilin-agents' },
  { id: 'ct-044', companyId: 'c-020', name: 'Andre Holloway', title: 'Head of Ops', email: 'andre@cobalt.systems', linkedin: 'linkedin.com/in/andreholloway-ops' },
];

export const mockOutreachDrafts: OutreachDraft[] = [
  {
    contactId: 'ct-001',
    subject: 'Saw your MLConf talk — question on how NeuralStack handles routing latency',
    body: `Hi Maya,

Watched Arjun's MLConf talk on model routing last week — the bit about cold-start penalty for smaller models really resonated with what I'm hearing from other infra teams.

Quick question: as NeuralStack scales past the 200-customer mark, how are you thinking about the observability gap between what the router decides and what the model actually delivers? I ask because that's the exact problem we help teams instrument.

Happy to show you what we've built — 20 minutes, no deck. Would that be worth your time?

Best,`,
    personalizationScore: 94,
  },
  {
    contactId: 'ct-004',
    subject: 'DevPulse + [our tool] — closing the loop on Linear signal data',
    body: `Hi Liam,

Congrats on the Linear integration — that's a meaningful addition for eng leaders who live in Linear but need the analytics layer.

We work with a few seed-stage DevTools companies on the data problem that usually shows up 6 months post-integration: keeping the signal-to-noise ratio high as more sources come in. Thought it might be relevant given where DevPulse is right now.

Worth a 20-minute call this week or next?

Best,`,
    personalizationScore: 88,
  },
  {
    contactId: 'ct-006',
    subject: 'CodeShield after SOC2 — what the next 6 months look like for you',
    body: `Hi James,

Saw CodeShield just wrapped SOC2 Type II — congrats, that's a grind. Usually what follows is a wave of enterprise inbound that stress-tests the sales motion in a new way.

We help security-focused DevTools companies navigate that exact transition — from founder-led to a repeatable enterprise process without losing the technical credibility that got you here.

Are you thinking about that GTM evolution at all right now? Happy to share what we've seen work.

Best,`,
    personalizationScore: 91,
  },
  {
    contactId: 'ct-026',
    subject: 'DataForge x Hugging Face — thoughts on what comes after the integration',
    body: `Hi Remi,

The Hugging Face Hub integration is a smart move — it puts DataForge right in the workflow for teams already using HF for model hosting.

The pattern we see: once that integration ships and traction picks up, the bottleneck shifts to data governance and reproducibility. Teams want to know which version of a dataset trained which model. Is that something you're thinking about for the roadmap?

Would love to share what we're seeing across similar infra companies — 20 minutes?

Best,`,
    personalizationScore: 89,
  },
  {
    contactId: 'ct-029',
    subject: 'Runloop hitting 10K VS Code installs — what the activation data looks like',
    body: `Hi Zoe,

10K VS Code installs is a real milestone — especially for a dev tool that requires behavior change (moving to ephemeral envs is a bigger ask than it sounds).

Curious: what does your activation funnel look like? First sandbox spin-up → first meaningful session → retained user. That path is where most DevTools companies lose the most, and it's solvable with the right instrumentation.

Happy to share a framework we use with similar-stage companies if it'd be useful.

Best,`,
    personalizationScore: 92,
  },
  {
    contactId: 'ct-042',
    subject: `Cobalt Systems post-raise — how you're thinking about enterprise go-to-market`,
    body: `Hi Patrick,

Congrats on the $7M seed — that's a strong round for an agent infrastructure play, and the Microsoft Azure partnership is a smart distribution wedge.

One thing we've seen consistently with enterprise AI infra companies at your stage: the buyers are excited but the procurement motion is long, and the champions (usually AI/ML leads) need a compliance and audit story to close legal. Given your focus on audit trails and access controls, you're well-positioned — but the narrative has to land the right way.

Worth a conversation about how other companies at this stage are running that motion?

Best,`,
    personalizationScore: 93,
  },
];

// Helper: get contacts for a company
export function getContactsForCompany(companyId: string): Contact[] {
  return mockContacts.filter((c) => c.companyId === companyId);
}

// Helper: get primary contact for a company (first contact)
export function getPrimaryContact(companyId: string): Contact | undefined {
  return mockContacts.find((c) => c.companyId === companyId);
}

// Helper: get outreach draft for a contact
export function getOutreachForContact(contactId: string): OutreachDraft | undefined {
  return mockOutreachDrafts.find((d) => d.contactId === contactId);
}
