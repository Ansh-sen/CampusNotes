import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Bell, Search } from 'lucide-react';

export default function AdminLayout() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const segment = path.split('/')[1];
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  return (
    <div className="flex min-h-screen bg-background transition-colors duration-500">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-20 glass border-b border-border/50 px-8 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">
              {getPageTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="h-10 w-64 bg-secondary/50 border-none rounded-xl pl-12 pr-4 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-all active:scale-95"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/80 transition-all active:scale-95 relative">
                <Bell size={18} />
                <span className="absolute top-2 right-2 h-2 w-2 bg-primary rounded-full border-2 border-background" />
              </button>
            </div>

            <div className="h-8 w-[1px] bg-border/50 mx-2" />

            <div className="flex items-center gap-3 pl-2 group cursor-pointer">
              <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center font-black shadow-lg shadow-primary/20">
                A
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-black text-foreground leading-none">Admin User</p>
                <p className="text-[10px] font-bold text-muted-foreground mt-1">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 animate-fade-in">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}