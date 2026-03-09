
import React, { useState } from 'react';
import { Routes, Route, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { UserProfile, UserRole } from '../types';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { label: 'ওভারভিউ', path: '/dashboard', icon: '📊' },
    { label: 'পুকুরসমূহ', path: '/dashboard/ponds', icon: '🌊' },
    { label: 'চাষ গাইড', path: '/dashboard/advisory', icon: '📖' },
    { label: 'খাবার প্রয়োগ', path: '/dashboard/feed-logs', icon: '🍽️' },
    { label: 'খাবার ব্যবস্থাপনা', path: '/dashboard/feeds', icon: '📦' },
    { label: 'পানির লগ', path: '/dashboard/water-logs', icon: '🧪' },
    { label: 'মাছের বৃদ্ধি', path: '/dashboard/growth', icon: '📈' },
    { label: 'গুদাম (Inventory)', path: '/dashboard/inventory', icon: '🏪' },
    { label: 'খরচের হিসাব', path: '/dashboard/expenses', icon: '📉' },
    { label: 'বিক্রির হিসাব', path: '/dashboard/sales', icon: '💰' },
    { label: 'রিপোর্ট', path: '/dashboard/reports', icon: '📜' },
    { label: 'প্রোফাইল সেটিংস', path: '/dashboard/settings', icon: '⚙️' },
    { label: 'প্রতিষ্ঠাতা', path: '/dashboard/owner', icon: '👑' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-x-hidden">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen w-80 bg-white border-r border-slate-100 z-50 transform transition-transform duration-500 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">🐟</div>
            <span className="font-black text-xl text-slate-800 tracking-tight">মৎস্য খামার</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 rounded-xl">✕</button>
        </div>
        
        <nav className="flex-1 p-6 space-y-1.5 overflow-y-auto">
          {user.role === UserRole.ADMIN && (
            <Link 
              to="/admin" 
              className="flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-rose-600 bg-rose-50 mb-6 border border-rose-100/50"
            >
              <span className="text-xl">🛡️</span>
              <span className="text-sm">অ্যাডমিন কন্ট্রোল</span>
            </Link>
          )}
          
          {navItems.map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl font-black transition-all ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={onLogout}
            className="flex items-center gap-4 px-5 py-4 w-full text-left text-rose-500 font-black hover:bg-rose-50 rounded-2xl transition-all"
          >
            <span className="text-xl">🚪</span>
            <span className="text-sm">লগআউট</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen relative">
        <header className="bg-white/80 backdrop-blur-md px-6 py-5 border-b border-slate-100 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl">☰</button>
             <div className="hidden sm:block">
                <h2 className="font-black text-slate-800 text-lg">
                   {navItems.find(i => i.path === location.pathname)?.label || 'ড্যাশবোর্ড'}
                </h2>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">খামার ড্যাশবোর্ড</p>
             </div>
          </div>
          
          <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <div className="text-right pl-3">
               <p className="text-xs font-black text-slate-800 leading-none mb-1">{user.full_name || user.farm_name}</p>
               <div className="flex items-center justify-end gap-1.5">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest">Premium Active</p>
               </div>
            </div>
            <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md bg-blue-100 overflow-hidden">
               <img 
                 src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
                 className="w-full h-full object-cover" 
                 alt="Profile" 
               />
            </div>
          </div>
        </header>

        {/* Mobile Horizontal Nav */}
        <div className="lg:hidden bg-white border-b border-slate-100 overflow-x-auto whitespace-nowrap p-2">
          <div className="flex gap-2">
            {navItems.map(item => (
              <Link 
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <main className="p-6 md:p-12 max-w-[1600px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
