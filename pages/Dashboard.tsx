
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
    { label: 'মালিকের তথ্য', path: '/dashboard/owner', icon: '👑' },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex font-['Hind_Siliguri']">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar for Desktop & Mobile Toggle */}
      <aside className={`fixed lg:static inset-y-0 left-0 w-72 bg-white border-r border-slate-200 shadow-2xl lg:shadow-xl z-50 transform transition-transform duration-300 flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-200">🐟</div>
            <div>
              <span className="font-extrabold text-xl text-slate-800 block leading-none">মৎস্য খামার</span>
              <span className="text-[10px] text-blue-500 font-bold tracking-widest uppercase mt-1 block">Enterprise SaaS</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 text-2xl">✕</button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {user.role === UserRole.ADMIN && (
            <Link 
              to="/admin" 
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-rose-600 bg-rose-50 border border-rose-100 mb-4 hover:bg-rose-100 transition-all"
            >
              <span className="text-xl">👑</span>
              <span className="text-sm">অ্যাডমিন প্যানেল</span>
            </Link>
          )}
          
          {navItems.map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold transition-all duration-200 ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-left text-rose-500 font-bold hover:bg-rose-50 rounded-xl transition-colors"
          >
            <span>🚪</span>
            <span className="text-sm">লগআউট</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg">☰</button>
             <h2 className="hidden sm:block text-lg font-black text-slate-800">
                {navItems.find(i => i.path === location.pathname)?.label || 'ড্যাশবোর্ড'}
             </h2>
             <h2 className="sm:hidden text-lg font-black text-slate-800 truncate max-w-[120px]">
                {navItems.find(i => i.path === location.pathname)?.label || 'ড্যাশবোর্ড'}
             </h2>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex flex-col items-end">
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="text-sm font-black text-slate-800">{user.farm_name}</p>
               </div>
               <p className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold mt-1 uppercase tracking-tighter">প্যাকেজ: {user.max_ponds === 999 ? 'আনলিমিটেড' : user.max_ponds}টি পুকুর</p>
            </div>
            <div className="relative group cursor-pointer flex items-center">
               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl border-2 border-white shadow-md bg-slate-100" alt="Avatar" />
               {user.role === UserRole.ADMIN && (
                 <div className="absolute -top-1 -right-1 bg-rose-500 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] text-white font-bold">A</div>
               )}
            </div>
          </div>
        </header>

        {/* Dynamic View */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full pb-32 lg:pb-8">
          <Outlet />
        </div>

        {/* Mobile Navbar (Quick Access Bottom Bar) */}
        <nav className="lg:hidden fixed bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-xl rounded-[2rem] px-4 py-3 flex justify-between items-center z-40 shadow-2xl border border-white/10 ring-1 ring-white/20 animate-in slide-in-from-bottom-10">
          {[
            { path: '/dashboard', icon: '📊' },
            { path: '/dashboard/ponds', icon: '🌊' },
            { path: '/dashboard/feeds', icon: '📦' },
            { path: '/dashboard/reports', icon: '📜' },
          ].map(item => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 ${location.pathname === item.path ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 scale-110' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="text-2xl">{item.icon}</span>
            </Link>
          ))}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="w-12 h-12 flex items-center justify-center text-slate-400"
          >
            <span className="text-2xl">☰</span>
          </button>
        </nav>
      </main>
    </div>
  );
};

export default Dashboard;
