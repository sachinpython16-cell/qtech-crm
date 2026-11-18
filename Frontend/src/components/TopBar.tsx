import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Building2, UserPlus, FileText, CalendarClock } from 'lucide-react';
import { ActiveTab } from './Navigation';

interface TopBarProps {
  activeTab: ActiveTab;
  onOpenLookup: (prefillQuery?: string) => void;
  onOpenAddCompany: () => void;
  onOpenAddContact: () => void;
  onOpenAddDeal: () => void;
  onOpenLogFollowUp: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onOpenLookup,
  onOpenAddCompany,
  onOpenAddContact,
  onOpenAddDeal,
  onOpenLogFollowUp,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Overview & Activity';
      case 'companies':
        return 'Company Records & Work History';
      case 'contacts':
        return 'Contact Person Directory';
      case 'follow-ups':
        return 'Follow-Up Pipeline';
      case 'deals':
        return 'Deals & Inquiries';
      case 'lookup':
        return 'Relationship History Search';
      default:
        return 'Portal';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      onOpenLookup(searchVal.trim());
      setSearchVal('');
    } else {
      onOpenLookup();
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Breadcrumb & Title */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>RelateFlow</span>
            <span aria-hidden="true">/</span>
            <span className="text-slate-900 font-medium capitalize">{activeTab}</span>
          </div>
          <h1 className="text-lg sm:text-xl font-display font-semibold text-slate-900 truncate tracking-tight mt-0.5">
            {getBreadcrumbTitle()}
          </h1>
        </div>

        {/* Zone 2: Universal Search Bar & Zone 3: Quick Action */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Universal Relationship Search Trigger */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-80 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search person, email, company, phone..."
              className="w-full pl-9 pr-16 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#088395] focus:ring-2 focus:ring-[#088395]/15 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 rounded hover:text-slate-900 hover:border-slate-300 transition-colors shadow-2xs"
            >
              Verify
            </button>
          </form>

          {/* Quick Action Dropdown */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-[#EB673E] hover:bg-[#d85830] active:scale-[0.99] rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Entry</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenAddCompany();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="font-semibold text-slate-800">Add Company</div>
                    <div className="text-[11px] text-slate-400">Register new enterprise entity</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenAddContact();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <UserPlus className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="font-semibold text-slate-800">Add Contact Person</div>
                    <div className="text-[11px] text-slate-400">Attach person to company</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenAddDeal();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <div>
                    <div className="font-semibold text-slate-800">New Deal / Inquiry</div>
                    <div className="text-[11px] text-slate-400">Track incoming lead or project</div>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-100" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onOpenLogFollowUp();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors text-left"
                >
                  <CalendarClock className="w-4 h-4 text-[#EB673E]" />
                  <div>
                    <div className="font-semibold text-slate-800">Schedule / Log Follow-Up</div>
                    <div className="text-[11px] text-slate-400">1st, 2nd, or 3rd follow-up check-in</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
