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
    <aside className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border/50 p-6 flex flex-col z-50 transition-colors duration-500">
      <div className="flex items-center gap-3 px-2 mb-10">
        <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
          <ShieldCheck size={28} />
        </div>
        <div>
          <h2 className="text-foreground font-black tracking-tight leading-none text-xl">Campus</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-4 mb-4 opacity-50">Main Menu</p>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-black transition-all group relative overflow-hidden",
              isActive 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon size={18} className={cn("transition-transform duration-300 group-hover:scale-110 relative z-10")} />
            <span className="relative z-10">{item.label}</span>
            {/* Subtle glow effect for active item */}
          </NavLink>
        ))}
      </nav>

      <div className="pt-6 border-t border-border/50">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-4 w-full rounded-2xl text-sm font-black text-destructive hover:bg-destructive/10 transition-all transition-colors active:scale-95 group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
