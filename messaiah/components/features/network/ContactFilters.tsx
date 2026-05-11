import React from 'react';
import { Search, SortDesc } from 'lucide-react';

interface ContactFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filter: string;
    setFilter: (filter: string) => void;
    sortBy: 'discovery' | 'careerFit';
    setSortBy: (sort: 'discovery' | 'careerFit') => void;
}

const ContactFilters: React.FC<ContactFiltersProps> = ({
    searchTerm,
    setSearchTerm,
    filter,
    setFilter,
    sortBy,
    setSortBy
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
            <button
                onClick={() => setSortBy(sortBy === 'discovery' ? 'careerFit' : 'discovery')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors whitespace-nowrap"
            >
                {sortBy === 'discovery' ? (
                    <>Sort: Discovery <SortDesc size={14} /></>
                ) : (
                    <>Sort: Career Fit <SortDesc size={14} className="text-emerald-400" /></>
                )}
            </button>

            <div className="relative flex-1 sm:flex-none w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg pl-10 pr-4 py-2 focus:ring-1 focus:ring-cyan-500 focus:border-transparent outline-none placeholder:text-slate-600"
                />
            </div>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700 whitespace-nowrap">
                {['All', 'Sponsor', 'Peer'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === type
                                ? 'bg-cyan-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                    >
                        {type}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ContactFilters;
