import { Contact, ContactRole } from "../types";

const rawData = {
    "additional_connections": [
        {
            "id": "james-morrison",
            "name": "James Morrison",
            "role": "Chief Technology Officer",
            "company": "TechCorp",
            "is_high_value": true,
            "mutual_connections": 15,
            "work_history": [
                { "title": "Chief Technology Officer", "company": "TechCorp", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "VP of Engineering", "company": "Salesforce", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Director of Engineering", "company": "Oracle", "duration": "2017 - 2020", "location": "Redwood City, CA" }
            ]
        },
        {
            "id": "maria-gonzalez",
            "name": "Maria Gonzalez",
            "role": "Founder & CEO",
            "company": "HealthTech Innovations",
            "is_high_value": true,
            "mutual_connections": 22,
            "work_history": [
                { "title": "Founder & CEO", "company": "HealthTech Innovations", "duration": "2022 - Present", "location": "Boston, MA" },
                { "title": "VP of Product", "company": "Johnson & Johnson", "duration": "2019 - 2022", "location": "New Brunswick, NJ" },
                { "title": "Senior Product Manager", "company": "Medtronic", "duration": "2016 - 2019", "location": "Minneapolis, MN" }
            ]
        },
        {
            "id": "robert-kim",
            "name": "Robert Kim",
            "role": "Partner",
            "company": "Kleiner Perkins",
            "is_high_value": true,
            "mutual_connections": 18,
            "work_history": [
                { "title": "Partner", "company": "Kleiner Perkins", "duration": "2024 - Present", "location": "Menlo Park, CA" },
                { "title": "Principal", "company": "Benchmark Capital", "duration": "2021 - 2024", "location": "San Francisco, CA" },
                { "title": "Investment Associate", "company": "Greylock Partners", "duration": "2018 - 2021", "location": "Palo Alto, CA" }
            ]
        },
        {
            "id": "amanda-lewis",
            "name": "Amanda Lewis",
            "role": "VP of Marketing",
            "company": "Adobe",
            "is_high_value": true,
            "mutual_connections": 12,
            "work_history": [
                { "title": "VP of Marketing", "company": "Adobe", "duration": "2023 - Present", "location": "San Jose, CA" },
                { "title": "Director of Brand Marketing", "company": "Salesforce", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Senior Marketing Manager", "company": "HubSpot", "duration": "2017 - 2020", "location": "Boston, MA" }
            ]
        },
        {
            "id": "david-chang",
            "name": "David Chang",
            "role": "Head of Research",
            "company": "Meta AI",
            "is_high_value": true,
            "mutual_connections": 20,
            "work_history": [
                { "title": "Head of Research", "company": "Meta AI", "duration": "2024 - Present", "location": "Menlo Park, CA" },
                { "title": "Research Scientist", "company": "Google DeepMind", "duration": "2021 - 2024", "location": "London, UK" },
                { "title": "PhD Research", "company": "Stanford University", "duration": "2017 - 2021", "location": "Stanford, CA" }
            ]
        },
        {
            "id": "jessica-brown",
            "name": "Jessica Brown",
            "role": "Managing Director",
            "company": "Goldman Sachs",
            "is_high_value": true,
            "mutual_connections": 16,
            "work_history": [
                { "title": "Managing Director", "company": "Goldman Sachs", "duration": "2023 - Present", "location": "New York, NY" },
                { "title": "VP Investment Banking", "company": "JPMorgan", "duration": "2019 - 2023", "location": "New York, NY" },
                { "title": "Associate", "company": "Morgan Stanley", "duration": "2016 - 2019", "location": "New York, NY" }
            ]
        },
        {
            "id": "michael-zhang",
            "name": "Michael Zhang",
            "role": "Director of AI",
            "company": "NVIDIA",
            "is_high_value": true,
            "mutual_connections": 14,
            "work_history": [
                { "title": "Director of AI", "company": "NVIDIA", "duration": "2023 - Present", "location": "Santa Clara, CA" },
                { "title": "Senior ML Engineer", "company": "Tesla", "duration": "2020 - 2023", "location": "Palo Alto, CA" },
                { "title": "ML Engineer", "company": "Cruise Automation", "duration": "2018 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "jennifer-davis",
            "name": "Jennifer Davis",
            "role": "Chief Operating Officer",
            "company": "Airbnb",
            "is_high_value": true,
            "mutual_connections": 19,
            "work_history": [
                { "title": "Chief Operating Officer", "company": "Airbnb", "duration": "2024 - Present", "location": "San Francisco, CA" },
                { "title": "VP of Operations", "company": "Uber", "duration": "2021 - 2024", "location": "San Francisco, CA" },
                { "title": "Director of Operations", "company": "Lyft", "duration": "2018 - 2021", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "thomas-wilson",
            "name": "Thomas Wilson",
            "role": "Founder",
            "company": "CloudScale AI",
            "is_high_value": true,
            "mutual_connections": 11,
            "work_history": [
                { "title": "Founder & CEO", "company": "CloudScale AI", "duration": "2023 - Present", "location": "Seattle, WA" },
                { "title": "Engineering Manager", "company": "Amazon Web Services", "duration": "2019 - 2023", "location": "Seattle, WA" },
                { "title": "Senior Software Engineer", "company": "Microsoft Azure", "duration": "2016 - 2019", "location": "Redmond, WA" }
            ]
        },
        {
            "id": "olivia-martinez",
            "name": "Olivia Martinez",
            "role": "VP of Design",
            "company": "Figma",
            "is_high_value": true,
            "mutual_connections": 17,
            "work_history": [
                { "title": "VP of Design", "company": "Figma", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Head of Product Design", "company": "Notion", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Senior Designer", "company": "Dropbox", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "daniel-anderson",
            "name": "Daniel Anderson",
            "role": "Partner",
            "company": "Accel",
            "is_high_value": true,
            "mutual_connections": 21,
            "work_history": [
                { "title": "Partner", "company": "Accel", "duration": "2024 - Present", "location": "Palo Alto, CA" },
                { "title": "Principal", "company": "Index Ventures", "duration": "2021 - 2024", "location": "San Francisco, CA" },
                { "title": "Associate", "company": "Lightspeed Venture Partners", "duration": "2018 - 2021", "location": "Menlo Park, CA" }
            ]
        },
        {
            "id": "sophia-taylor",
            "name": "Sophia Taylor",
            "role": "Head of Product",
            "company": "Shopify",
            "is_high_value": true,
            "mutual_connections": 13,
            "work_history": [
                { "title": "Head of Product", "company": "Shopify", "duration": "2023 - Present", "location": "Ottawa, ON" },
                { "title": "Senior PM", "company": "LinkedIn", "duration": "2020 - 2023", "location": "Sunnyvale, CA" },
                { "title": "Product Manager", "company": "Twitter", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "william-johnson",
            "name": "William Johnson",
            "role": "Co-Founder",
            "company": "Quantum Computing Startup",
            "is_high_value": true,
            "mutual_connections": 9,
            "work_history": [
                { "title": "Co-Founder & CTO", "company": "Quantum Computing Startup", "duration": "2022 - Present", "location": "Boulder, CO" },
                { "title": "Research Scientist", "company": "IBM Quantum", "duration": "2019 - 2022", "location": "Yorktown Heights, NY" },
                { "title": "Postdoc Researcher", "company": "MIT", "duration": "2017 - 2019", "location": "Cambridge, MA" }
            ]
        },
        {
            "id": "emily-white",
            "name": "Emily White",
            "role": "Chief Financial Officer",
            "company": "Robinhood",
            "is_high_value": true,
            "mutual_connections": 14,
            "work_history": [
                { "title": "Chief Financial Officer", "company": "Robinhood", "duration": "2024 - Present", "location": "Menlo Park, CA" },
                { "title": "VP of Finance", "company": "Coinbase", "duration": "2021 - 2024", "location": "San Francisco, CA" },
                { "title": "Finance Director", "company": "Square", "duration": "2018 - 2021", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "alex-patel",
            "name": "Alex Patel",
            "role": "VP of Engineering",
            "company": "Databricks",
            "is_high_value": true,
            "mutual_connections": 16,
            "work_history": [
                { "title": "VP of Engineering", "company": "Databricks", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Director of Engineering", "company": "Snowflake", "duration": "2020 - 2023", "location": "San Mateo, CA" },
                { "title": "Engineering Manager", "company": "Palantir", "duration": "2017 - 2020", "location": "Palo Alto, CA" }
            ]
        },
        {
            "id": "rachel-cohen",
            "name": "Rachel Cohen",
            "role": "Head of Growth",
            "company": "Plaid",
            "is_high_value": true,
            "mutual_connections": 12,
            "work_history": [
                { "title": "Head of Growth", "company": "Plaid", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Growth Lead", "company": "Stripe", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Growth Manager", "company": "Brex", "duration": "2018 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "kevin-nguyen",
            "name": "Kevin Nguyen",
            "role": "Senior ML Researcher",
            "company": "OpenAI",
            "is_high_value": true,
            "mutual_connections": 18,
            "work_history": [
                { "title": "Senior ML Researcher", "company": "OpenAI", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Research Scientist", "company": "Anthropic", "duration": "2021 - 2023", "location": "San Francisco, CA" },
                { "title": "ML Engineer", "company": "Google Brain", "duration": "2018 - 2021", "location": "Mountain View, CA" }
            ]
        },
        {
            "id": "laura-mitchell",
            "name": "Laura Mitchell",
            "role": "VP of Sales",
            "company": "Snowflake",
            "is_high_value": true,
            "mutual_connections": 15,
            "work_history": [
                { "title": "VP of Sales", "company": "Snowflake", "duration": "2024 - Present", "location": "San Mateo, CA" },
                { "title": "VP Enterprise Sales", "company": "MongoDB", "duration": "2021 - 2024", "location": "New York, NY" },
                { "title": "Director of Sales", "company": "Atlassian", "duration": "2018 - 2021", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "christopher-lee",
            "name": "Christopher Lee",
            "role": "Head of Platform",
            "company": "Vercel",
            "is_high_value": true,
            "mutual_connections": 10,
            "work_history": [
                { "title": "Head of Platform", "company": "Vercel", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Senior Engineer", "company": "Netlify", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Platform Engineer", "company": "Heroku", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "natalie-garcia",
            "name": "Natalie Garcia",
            "role": "Director of Data Science",
            "company": "Netflix",
            "is_high_value": true,
            "mutual_connections": 14,
            "work_history": [
                { "title": "Director of Data Science", "company": "Netflix", "duration": "2023 - Present", "location": "Los Gatos, CA" },
                { "title": "Senior Data Scientist", "company": "Spotify", "duration": "2020 - 2023", "location": "New York, NY" },
                { "title": "Data Scientist", "company": "Airbnb", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "brandon-harris",
            "name": "Brandon Harris",
            "role": "Founder",
            "company": "Web3 Infrastructure",
            "is_high_value": true,
            "mutual_connections": 11,
            "work_history": [
                { "title": "Founder & CEO", "company": "Web3 Infrastructure", "duration": "2022 - Present", "location": "Austin, TX" },
                { "title": "Engineering Lead", "company": "Coinbase", "duration": "2019 - 2022", "location": "San Francisco, CA" },
                { "title": "Blockchain Engineer", "company": "ConsenSys", "duration": "2017 - 2019", "location": "Brooklyn, NY" }
            ]
        },
        {
            "id": "michelle-walker",
            "name": "Michelle Walker",
            "role": "Chief Product Officer",
            "company": "Canva",
            "is_high_value": true,
            "mutual_connections": 17,
            "work_history": [
                { "title": "Chief Product Officer", "company": "Canva", "duration": "2024 - Present", "location": "Sydney, Australia" },
                { "title": "VP of Product", "company": "Miro", "duration": "2021 - 2024", "location": "San Francisco, CA" },
                { "title": "Director of Product", "company": "Asana", "duration": "2018 - 2021", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "ryan-thomas",
            "name": "Ryan Thomas",
            "role": "Partner",
            "company": "Y Combinator",
            "is_high_value": true,
            "mutual_connections": 23,
            "work_history": [
                { "title": "Partner", "company": "Y Combinator", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Founder",
                "company": "EdTech Startup (Acquired)", "duration": "2019 - 2023", "location": "San Francisco, CA" },
                { "title": "Product Manager", "company": "Coursera", "duration": "2016 - 2019", "location": "Mountain View, CA" }
            ]
        },
        {
            "id": "samantha-king",
            "name": "Samantha King",
            "role": "VP of People",
            "company": "Atlassian",
            "is_high_value": true,
            "mutual_connections": 13,
            "work_history": [
                { "title": "VP of People", "company": "Atlassian", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Head of Talent", "company": "Slack", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Director of Recruiting", "company": "Dropbox", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "jonathan-rodriguez",
            "name": "Jonathan Rodriguez",
            "role": "Head of Security",
            "company": "Cloudflare",
            "is_high_value": true,
            "mutual_connections": 9,
            "work_history": [
                { "title": "Head of Security", "company": "Cloudflare", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Security Director", "company": "GitHub", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Senior Security Engineer", "company": "Facebook", "duration": "2017 - 2020", "location": "Menlo Park, CA" }
            ]
        },
        {
            "id": "victoria-hall",
            "name": "Victoria Hall",
            "role": "Chief Marketing Officer",
            "company": "Zoom",
            "is_high_value": true,
            "mutual_connections": 16,
            "work_history": [
                { "title": "Chief Marketing Officer", "company": "Zoom", "duration": "2024 - Present", "location": "San Jose, CA" },
                { "title": "VP of Marketing", "company": "Slack", "duration": "2021 - 2024", "location": "San Francisco, CA" },
                { "title": "Marketing Director", "company": "DocuSign", "duration": "2018 - 2021", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "andrew-scott",
            "name": "Andrew Scott",
            "role": "Director of ML",
            "company": "Tesla",
            "is_high_value": true,
            "mutual_connections": 15,
            "work_history": [
                { "title": "Director of ML", "company": "Tesla", "duration": "2023 - Present", "location": "Palo Alto, CA" },
                { "title": "ML Research Lead", "company": "Waymo", "duration": "2020 - 2023", "location": "Mountain View, CA" },
                { "title": "Research Scientist", "company": "NVIDIA", "duration": "2017 - 2020", "location": "Santa Clara, CA" }
            ]
        },
        {
            "id": "brittany-adams",
            "name": "Brittany Adams",
            "role": "VP of Customer Success",
            "company": "HubSpot",
            "is_high_value": true,
            "mutual_connections": 12,
            "work_history": [
                { "title": "VP of Customer Success", "company": "HubSpot", "duration": "2023 - Present", "location": "Boston, MA" },
                { "title": "Director of CS", "company": "Zendesk", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "CS Manager", "company": "Intercom", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "tyler-campbell",
            "name": "Tyler Campbell",
            "role": "Founder",
            "company": "ClimaTech Solutions",
            "is_high_value": true,
            "mutual_connections": 8,
            "work_history": [
                { "title": "Founder & CEO", "company": "ClimaTech Solutions", "duration": "2022 - Present", "location": "San Francisco, CA" },
                { "title": "Product Lead", "company": "Tesla Energy", "duration": "2019 - 2022", "location": "Palo Alto, CA" },
                { "title": "Engineer", "company": "SolarCity", "duration": "2016 - 2019", "location": "San Mateo, CA" }
            ]
        },
        {
            "id": "melissa-hill",
            "name": "Melissa Hill",
            "role": "Partner",
            "company": "NEA",
            "is_high_value": true,
            "mutual_connections": 19,
            "work_history": [
                { "title": "Partner", "company": "New Enterprise Associates", "duration": "2024 - Present", "location": "Menlo Park, CA" },
                { "title": "Principal", "company": "GV (Google Ventures)", "duration": "2021 - 2024", "location": "San Francisco, CA" },
                { "title": "Associate", "company": "General Catalyst", "duration": "2018 - 2021", "location": "SF & Boston" }
            ]
        },
        {
            "id": "joshua-baker",
            "name": "Joshua Baker",
            "role": "VP of Infrastructure",
            "company": "Uber",
            "is_high_value": true,
            "mutual_connections": 14,
            "work_history": [
                { "title": "VP of Infrastructure", "company": "Uber", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Director Infrastructure", "company": "Lyft", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Senior SRE", "company": "Google", "duration": "2017 - 2020", "location": "Mountain View, CA" }
            ]
        },
        {
            "id": "ashley-green",
            "name": "Ashley Green",
            "role": "Head of Business Development",
            "company": "Notion",
            "is_high_value": true,
            "mutual_connections": 11,
            "work_history": [
                { "title": "Head of Business Development", "company": "Notion", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "BD Director", "company": "Airtable", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "BD Manager", "company": "Zapier", "duration": "2018 - 2020", "location": "Remote" }
            ]
        },
        {
            "id": "marcus-evans",
            "name": "Marcus Evans",
            "role": "Chief Data Officer",
            "company": "Bloomberg",
            "is_high_value": true,
            "mutual_connections": 17,
            "work_history": [
                { "title": "Chief Data Officer", "company": "Bloomberg", "duration": "2024 - Present", "location": "New York, NY" },
                { "title": "VP of Data", "company": "Goldman Sachs", "duration": "2021 - 2024", "location": "New York, NY" },
                { "title": "Data Science Director", "company": "Morgan Stanley", "duration": "2018 - 2021", "location": "New York, NY" }
            ]
        },
        {
            "id": "stephanie-morris",
            "name": "Stephanie Morris",
            "role": "VP of Legal",
            "company": "Stripe",
            "is_high_value": true,
            "mutual_connections": 10,
            "work_history": [
                { "title": "VP of Legal", "company": "Stripe", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "General Counsel", "company": "Brex", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Senior Counsel", "company": "Square", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "patrick-cooper",
            "name": "Patrick Cooper",
            "role": "Head of Developer Relations",
            "company": "Supabase",
            "is_high_value": true,
            "mutual_connections": 13,
            "work_history": [
                { "title": "Head of Developer Relations", "company": "Supabase", "duration": "2023 - Present", "location": "Singapore" },
                { "title": "DevRel Lead", "company": "Vercel", "duration": "2020 - 2023", "location": "Remote" },
                { "title": "Developer Advocate", "company": "GitHub", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "diana-richardson",
            "name": "Diana Richardson",
            "role": "VP of Analytics",
            "company": "Pinterest",
            "is_high_value": true,
            "mutual_connections": 15,
            "work_history": [
                { "title": "VP of Analytics", "company": "Pinterest", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Analytics Director", "company": "Instacart", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Senior Analyst", "company": "Facebook", "duration": "2017 - 2020", "location": "Menlo Park, CA" }
            ]
        },
        {
            "id": "gregory-phillips",
            "name": "Gregory Phillips",
            "role": "Founder",
            "company": "DevOps Automation",
            "is_high_value": true,
            "mutual_connections": 9,
            "work_history": [
                { "title": "Founder & CEO", "company": "DevOps Automation", "duration": "2022 - Present", "location": "Austin, TX" },
                { "title": "Engineering Manager", "company": "HashiCorp", "duration": "2019 - 2022", "location": "San Francisco, CA" },
                { "title": "Senior DevOps Engineer", "company": "AWS", "duration": "2016 - 2019", "location": "Seattle, WA" }
            ]
        },
        {
            "id": "vanessa-turner",
            "name": "Vanessa Turner",
            "role": "Head of Community",
            "company": "Discord",
            "is_high_value": true,
            "mutual_connections": 12,
            "work_history": [
                { "title": "Head of Community", "company": "Discord", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Community Director", "company": "Twitch", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Community Manager", "company": "Reddit", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "eric-collins",
            "name": "Eric Collins",
            "role": "VP of Revenue",
            "company": "monday.com",
            "is_high_value": true,
            "mutual_connections": 14,
            "work_history": [
                { "title": "VP of Revenue", "company": "monday.com", "duration": "2024 - Present", "location": "Tel Aviv, Israel" },
                { "title": "VP Sales", "company": "Wix", "duration": "2021 - 2024", "location": "Tel Aviv, Israel" },
                { "title": "Director of Sales",
                "company": "SAP", "duration": "2018 - 2021", "location": "Palo Alto, CA" }
            ]
        },
        {
            "id": "amanda-stewart",
            "name": "Amanda Stewart",
            "role": "Chief People Officer",
            "company": "GitLab",
            "is_high_value": true,
            "mutual_connections": 11,
            "work_history": [
                { "title": "Chief People Officer", "company": "GitLab", "duration": "2023 - Present", "location": "Remote" },
                { "title": "VP of HR", "company": "Automattic", "duration": "2020 - 2023", "location": "Remote" },
                { "title": "HR Director", "company": "Buffer", "duration": "2017 - 2020", "location": "Remote" }
            ]
        },
        {
            "id": "timothy-sanchez",
            "name": "Timothy Sanchez",
            "role": "Director of Product",
            "company": "Roblox",
            "is_high_value": true,
            "mutual_connections": 16,
            "work_history": [
                { "title": "Director of Product", "company": "Roblox", "duration": "2023 - Present", "location": "San Mateo, CA" },
                { "title": "Senior PM", "company": "Epic Games", "duration": "2020 - 2023", "location": "Cary, NC" },
                { "title": "Product Manager", "company": "Unity Technologies", "duration": "2017 - 2020", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "christina-ramirez",
            "name": "Christina Ramirez",
            "role": "VP of Partnerships",
            "company": "Twilio",
            "is_high_value": true,
            "mutual_connections": 13,
            "work_history": [
                { "title": "VP of Partnerships", "company": "Twilio", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Partnerships Director", "company": "SendGrid", "duration": "2020 - 2023", "location": "Denver, CO" },
                { "title": "BD Manager", "company": "Mailchimp", "duration": "2017 - 2020", "location": "Atlanta, GA" }
            ]
        },
        {
            "id": "jeffrey-bell",
            "name": "Jeffrey Bell",
            "role": "Head of Compliance",
            "company": "Revolut",
            "is_high_value": true,
            "mutual_connections": 8,
            "work_history": [
                { "title": "Head of Compliance", "company": "Revolut", "duration": "2023 - Present", "location": "London, UK" },
                { "title": "Compliance Director", "company": "Monzo", "duration": "2020 - 2023", "location": "London, UK" },
                { "title": "Regulatory Manager", "company": "Barclays", "duration": "2017 - 2020", "location": "London, UK" }
            ]
        },
        {
            "id": "nicole-foster",
            "name": "Nicole Foster",
            "role": "Chief Strategy Officer",
            "company": "DoorDash",
            "is_high_value": true,
            "mutual_connections": 18,
            "work_history": [
                { "title": "Chief Strategy Officer", "company": "DoorDash", "duration": "2024 - Present", "location": "San Francisco, CA" },
                { "title": "VP Strategy", "company": "Instacart", "duration": "2021 - 2024", "location": "San Francisco, CA" },
                { "title": "Strategy Director", "company": "Uber Eats", "duration": "2018 - 2021", "location": "San Francisco, CA" }
            ]
        },
        {
            "id": "benjamin-gray",
            "name": "Benjamin Gray",
            "role": "VP of R&D",
            "company": "Intel",
            "is_high_value": true,
            "mutual_connections": 14,
            "work_history": [
                { "title": "VP of R&D",
                "company": "Intel", "duration": "2024 - Present", "location": "Santa Clara, CA" },
                { "title": "Director of Research", "company": "AMD", "duration": "2021 - 2024", "location": "Santa Clara, CA" },
                { "title": "Senior Researcher", "company": "IBM Research", "duration": "2018 - 2021", "location": "Yorktown Heights, NY" }
            ]
        },
        {
            "id": "kimberly-hughes",
            "name": "Kimberly Hughes",
            "role": "VP of Platform",
            "company": "Shopify",
            "is_high_value": true,
            "mutual_connections": 17,
            "work_history": [
                { "title": "VP of Platform", "company": "Shopify", "duration": "2023 - Present", "location": "Ottawa, ON" },
                { "title": "Platform Director", "company": "BigCommerce", "duration": "2020 - 2023", "location": "Austin, TX" },
                { "title": "Engineering Manager", "company": "WooCommerce", "duration": "2017 - 2020", "location": "Remote" }
            ]
        },
        {
            "id": "charles-price",
            "name": "Charles Price",
            "role": "Founder",
            "company": "AI Security Startup",
            "is_high_value": true,
            "mutual_connections": 10,
            "work_history": [
                { "title": "Founder & CEO", "company": "AI Security Startup", "duration": "2023 - Present", "location": "San Francisco, CA" },
                { "title": "Security Architect", "company": "Cloudflare", "duration": "2020 - 2023", "location": "San Francisco, CA" },
                { "title": "Security Engineer", "company": "Palo Alto Networks", "duration": "2017 - 2020", "location": "Santa Clara, CA" }
            ]
        },
        {
            "id": "angela-watson",
            "name": "Angela Watson",
            "role": "VP of Mobile",
            "company": "Snap Inc.",
            "is_high_value": true,
            "mutual_connections": 15,
            "work_history": [
                { "title": "VP of Mobile", "company": "Snap Inc.", "duration": "2023 - Present", "location": "Los Angeles, CA" },
                { "title": "Mobile Engineering Director", "company": "Instagram", "duration": "2020 - 2023", "location": "Menlo Park, CA" },
                { "title": "Engineering Manager", "company": "TikTok", "duration": "2018 - 2020", "location": "LA & Beijing" }
            ]
        }
    ]
};

// Mapper function to convert raw data to Contact type
export const getMockContacts = (): Contact[] => {
    return rawData.additional_connections.map((c, i) => {
        const isSponsor = c.is_high_value;
        const influence = isSponsor ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 40) + 40;
        
        // Logic to determine role based on simple heuristics
        const roleType = isSponsor ? (Math.random() > 0.7 ? ContactRole.SPONSOR : ContactRole.MENTOR) : ContactRole.PEER;

        return {
            id: c.id,
            name: c.name,
            role: c.role,
            company: c.company,
            type: roleType,
            influenceScore: influence,
            notes: `Identified via market scan. High leverage potential due to role at ${c.company}.`,
            lastContactDate: new Date().toISOString(),
            avatarSeed: (i * 73) % 1000, // Deterministic seed
            connectionStrength: c.mutual_connections * 4, // Rough proxy for strength
            mutualConnectionsCount: c.mutual_connections,
            connectionDegree: c.mutual_connections > 10 ? '2nd' : '3rd',
            suggestedPath: ['You', `Mutual Connection (${c.mutual_connections})`, c.name],
            workHistory: c.work_history,
            discoveryScore: isSponsor ? 45 : 15,
            careerFit: isSponsor ? 80 : 40,
        };
    });
};