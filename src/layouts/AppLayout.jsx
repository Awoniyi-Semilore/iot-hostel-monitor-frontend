import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Activity, BarChart2, Users, Info, Wind } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',         icon: Activity,  label: 'Monitor',  end: true },
  { to: '/history',  icon: BarChart2, label: 'History' },
  { to: '/contacts', icon: Users,     label: 'Contacts' },
  { to: '/about',    icon: Info,      label: 'About' },
];

const navClass = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
    isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-white hover:bg-white/5'
  }`;

const bottomNavClass = ({ isActive }) =>
  `flex-1 flex flex-col items-center gap-1 py-3 text-[9px] font-black uppercase tracking-widest transition-all ${
    isActive ? 'text-blue-400' : 'text-slate-600'
  }`;

export default function AppLayout() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 border-r border-white/5 sticky top-0 h-screen">
        <div className="p-6 pb-4 flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Wind size={18} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-widest leading-tight">Smart Hostel<br />Hygiene Monitor</p>
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">AuraCheck</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 px-3 flex-1 mt-2">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navClass}>
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <p className="text-[9px] font-mono text-slate-600 text-center">Unilag Smart Campus Initiative</p>
        </div>
      </aside>

      {/* Page content */}
      <main className="flex-1 flex flex-col min-h-screen pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-slate-950/90 backdrop-blur-xl border-t border-white/5 flex z-50">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={bottomNavClass}>
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
      </nav>

    </div>
  );
}
