import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  CalendarClock, 
  Briefcase, 
  Search, 
  RotateCcw,
  Menu,
  X,
  Layers,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 'dashboard' | 'companies' | 'contacts' | 'follow-ups' | 'deals' | 'lookup';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  pendingFollowUpsCount: number;
  overdueCount: number;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onRefreshData?: () => void;
  onResetData?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  pendingFollowUpsCount,
  overdueCount,
  mobileMenuOpen,
  setMobileMenuOpen,
  onRefreshData,
  onResetData,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Main Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'companies' as ActiveTab,
      label: 'Companies & History',
      icon: Building2,
      badge: null,
    },
    {
      id: 'contacts' as ActiveTab,
      label: 'Contact Persons',
      icon: Users,
      badge: null,
    },
    {
      id: 'follow-ups' as ActiveTab,
      label: 'Follow-Up Queue',
      icon: CalendarClock,
      badge: overdueCount > 0 ? `${overdueCount} overdue` : pendingFollowUpsCount > 0 ? `${pendingFollowUpsCount}` : null,
      badgeColor: overdueCount > 0 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'deals' as ActiveTab,
      label: 'Deals & Inquiries',
      icon: Briefcase,
      badge: null,
    },
    {
      id: 'lookup' as ActiveTab,
      label: 'Relationship Lookup',
      icon: Search,
      badge: 'Fast',
      badgeColor: 'bg-teal-50 text-[#088395] border-teal-200',
    },
  ];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#EB673E] flex items-center justify-center text-white font-bold text-sm">
            RF
          </div>
          <div>
            <span className="font-display font-bold text-base text-[#1D1D1D] tracking-tight">RelateFlow</span>
            <span className="block text-[11px] text-slate-500 -mt-0.5">Relationship & Inquiry Portal</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Area */}
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#EB673E] flex items-center justify-center text-white shadow-xs">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-[#1D1D1D] tracking-tight block">
                RelateFlow
              </span>
              <span className="text-[11px] font-medium text-slate-500 tracking-wide uppercase">
                B2B Relationship Portal
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors text-left ${
                  isActive
                    ? 'bg-[#088395] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-[10px] font-semibold rounded border uppercase tracking-wider ${
                      isActive ? 'bg-white/20 text-white border-white/30' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Operational Highlights Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium">Active Follow-ups</span>
              <span className="font-mono-tabular font-semibold text-slate-900">{pendingFollowUpsCount}</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center justify-between text-xs text-red-600">
                <span className="font-medium">Requires Attention</span>
                <span className="font-mono-tabular font-semibold">{overdueCount} overdue</span>
              </div>
            )}
            {(onRefreshData || onResetData) && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={onRefreshData || onResetData}
                  title="Sync and refresh all records from the server"
                  className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:text-[#088395] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Sync from Server</span>
                </button>
              </div>
            )}

            {/* Authenticated User Profile & Logout */}
            {user && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#088395] text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {(user.full_name || user.username).charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate leading-tight">
                      {user.full_name || user.username}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate leading-tight">
                      {user.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
