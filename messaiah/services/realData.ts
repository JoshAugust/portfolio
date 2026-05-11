import { Contact, ContactRole } from "../types";

export const parseCSVData = (csvContent: string): Contact[] => {
  const lines = csvContent.split('\n');
  const contacts: Contact[] = [];
  
  // Find where data starts (Look for "First Name")
  const startIndex = lines.findIndex(l => l.toLowerCase().includes("first name"));
  
  if (startIndex === -1) return [];

  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle CSV quoting slightly better for basic names
    // This is a simple regex split that handles commas inside quotes
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    // Fallback if regex fails or simple split
    let parts: string[] = [];
    
    if (matches && matches.length >= 3) {
        parts = matches;
    } else {
        parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    }
    
    // Clean quotes
    const clean = (s: string) => s ? s.replace(/^"|"$/g, '').trim() : '';

    if (parts.length >= 3) {
        const firstName = clean(parts[0]);
        const lastName = clean(parts[1]);
        const url = clean(parts[2]);
        // parts[3] is email
        const company = clean(parts[4]);
        const position = clean(parts[5]);
        const connectedOn = clean(parts[6]);

        if (!firstName) continue;

        // Determine Role
        let role = ContactRole.PEER;
        const titleLower = position.toLowerCase();
        if (titleLower.includes('director') || titleLower.includes('head') || titleLower.includes('vp') || titleLower.includes('partner') || titleLower.includes('founder') || titleLower.includes('chief') || titleLower.includes('c-suite')) {
            role = ContactRole.MENTOR; 
        }
        if (titleLower.includes('student') || titleLower.includes('candidate') || titleLower.includes('intern')) {
            role = ContactRole.PEER;
        }

        // Determine Influence (Heuristic)
        let influence = 40 + Math.random() * 30;
        if (role === ContactRole.MENTOR) influence += 20;

        contacts.push({
            id: `imported-${i}-${Date.now()}`,
            name: `${firstName} ${lastName}`,
            role: position || "Unknown Role",
            company: company || "Unknown Company",
            type: role,
            influenceScore: Math.floor(influence),
            notes: `Connected on ${connectedOn}.`,
            lastContactDate: connectedOn ? new Date(connectedOn).toISOString() : new Date().toISOString(),
            avatarSeed: (i * 13) % 1000,
            connectionStrength: 100, 
            connectionDegree: '1st',
            suggestedPath: ['You', 'Direct Connection'],
            linkedinUrl: url,
            workHistory: [], 
            discoveryScore: 10, // Starts low
            careerFit: 50, 
        });
    }
  }
  return contacts;
};