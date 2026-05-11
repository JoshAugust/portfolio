import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Contact, ContactRole } from '../types';
import ContactFilters from './features/network/ContactFilters';
import ContactList from './features/network/ContactList';
import { scrapeLinkedInProfile, hasApifyKey } from '../services/apifyService';
import { Search, Loader2 } from 'lucide-react';

const CRM: React.FC = () => {
  const { contacts, updateContact, addContact, setActiveContext, processingContactId } = useApp();
  const [filter, setFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'discovery' | 'careerFit'>('careerFit');

  const [scrapeUrl, setScrapeUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatus, setScrapeStatus] = useState('');

  useEffect(() => {
    setActiveContext("Network Grid - Managing Relationships");
  }, [setActiveContext]);

  const filteredContacts = contacts.filter(c => {
    const matchesFilter = filter === 'All' || c.type === filter;
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.company.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    if (sortBy === 'careerFit') {
      return (b.careerFit || 0) - (a.careerFit || 0);
    }
    return b.discoveryScore - a.discoveryScore;
  });

  const handleRoleChange = (id: string, newRole: string) => {
    updateContact(id, { type: newRole as ContactRole });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    if (expandedId !== id) {
      const c = contacts.find(contact => contact.id === id);
      if (c) setActiveContext(`Network Grid - Analyzing ${c.name}`);
    } else {
      setActiveContext("Network Grid");
    }
  };

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    if (!hasApifyKey()) {
      setScrapeStatus("Please configure your Apify Key first.");
      return;
    }
    
    setIsScraping(true);
    setScrapeStatus('Initializing...');
    try {
        const data = await scrapeLinkedInProfile(scrapeUrl, setScrapeStatus);
        if (data) {
            const fullName = data.fullName || (data.firstName ? `${data.firstName} ${data.lastName || ''}` : '') || 'Unknown';
            const newContact: Contact = {
                id: `c-${Date.now()}`,
                name: fullName.trim(),
                role: data.headline || 'Unknown Role',
                company: data.experiences?.[0]?.company || 'Unknown Company',
                type: ContactRole.PROSPECT,
                influenceScore: 50,
                careerFit: 50,
                notes: data.summary || '',
                lastContactDate: new Date().toISOString(),
                avatarSeed: Math.floor(Math.random() * 1000),
                avatarImage: data.profilePicUrl,
                connectionStrength: 10,
                linkedinUrl: scrapeUrl,
                discoveryScore: 80, // High discovery score since we have full profile
                workHistory: data.experiences?.map(exp => ({
                    title: exp.title,
                    company: exp.company,
                    duration: exp.duration || '',
                    location: exp.location || ''
                })),
            };
            addContact(newContact);
            setScrapeUrl('');
            setScrapeStatus('Success! Contact added.');
            setTimeout(() => setScrapeStatus(''), 3000);
        } else {
            setScrapeStatus('No data returned.');
        }
    } catch (e: any) {
        setScrapeStatus(`Error: ${e.message}`);
    } finally {
        setIsScraping(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Network Grid</h2>
          <p className="text-slate-400 text-sm">Imported {contacts.length} souls.</p>
        </div>

        <ContactFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filter={filter}
          setFilter={setFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      </div>

      {/* Scraper UI */}
      <div className="mb-6 bg-slate-900 border border-slate-700/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-md">
        <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Paste LinkedIn Profile URL to auto-scrape..." 
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              disabled={isScraping}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all disabled:opacity-50"
            />
        </div>
        <button 
          onClick={handleScrape}
          disabled={!scrapeUrl || isScraping}
          className="w-full sm:w-auto px-6 py-2 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
        >
          {isScraping ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {isScraping ? 'Scraping...' : 'Scrape Profile'}
        </button>
      </div>
      
      {scrapeStatus && (
        <div className={`mb-6 text-xs px-4 py-2 rounded-lg border ${scrapeStatus.includes('Error') ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'} flex items-center gap-2 animate-in fade-in`}>
          {isScraping && <Loader2 className="w-3 h-3 animate-spin" />}
          {scrapeStatus}
        </div>
      )}

      <ContactList
        contacts={filteredContacts}
        expandedId={expandedId}
        toggleExpand={toggleExpand}
        processingContactId={processingContactId}
        updateContact={updateContact}
        handleRoleChange={handleRoleChange}
      />
    </div>
  );
};

export default CRM;