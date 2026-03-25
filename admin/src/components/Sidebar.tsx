import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UserCheck, 
  FileText, 
  Users, 
  GraduationCap, 
  BarChart3,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/verifications', icon: UserCheck, label: 'Verifications' },
  { to: '/listings', icon: FileText, label: 'Listings' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/academic', icon: GraduationCap, label: 'Academic Data' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
];

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-slate-400 p-6 flex flex-col z-50">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="h-10 w-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
          <ShieldCheck size={24} />
        </div>
        <div>
          <h2 className="text-white font-black tracking-tight leading-none text-lg">CampusNotes</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all group",
              isActive 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={20} className={cn("transition-colors", "group-hover:text-white")} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="pt-6 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm font-black text-rose-400 hover:bg-rose-500/10 transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
