
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, Outlet } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import SubscriptionPage from './pages/Subscription';
import Dashboard from './pages/Dashboard';
import PondsPage from './pages/Ponds';
import ExpensesPage from './pages/Expenses';
import SalesPage from './pages/Sales';
import WaterLogsPage from './pages/WaterLogs';
import ReportsPage from './pages/Reports';
import FeedLogsPage from './pages/FeedLogs';
import FeedManagement from './pages/FeedManagement';
import InventoryPage from './pages/Inventory';
import GrowthRecordsPage from './pages/GrowthRecords';
import AdvisoryPage from './pages/Advisory';
import AdminDashboard from './pages/AdminDashboard';
import OwnerProfile from './pages/OwnerProfile';
import { UserProfile, SubscriptionStatus, UserRole } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (id: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) setUser(data as UserProfile);
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600 animate-pulse">লোড হচ্ছে...</p>
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/founder" element={<OwnerProfile />} />
        <Route path="/login" element={<AuthPage type="login" onLogin={(u) => setUser(u)} />} />
        <Route path="/register" element={<AuthPage type="register" onLogin={(u) => setUser(u)} />} />
        
        <Route path="/subscription" element={user ? <SubscriptionPage user={user} onUpdateUser={fetchProfile} /> : <Navigate to="/login" />} />
        
        <Route path="/dashboard/*" element={
          user ? (
            user.subscription_status === SubscriptionStatus.ACTIVE || user.role === UserRole.ADMIN ? 
            <Dashboard user={user} onLogout={() => setUser(null)} /> : 
            <Navigate to="/subscription" />
          ) : <Navigate to="/login" />
        }>
          <Route index element={<DashboardSummary user={user!} />} />
          <Route path="ponds" element={<PondsPage user={user!} />} />
          <Route path="expenses" element={<ExpensesPage user={user!} />} />
          <Route path="sales" element={<SalesPage user={user!} />} />
          <Route path="owner" element={<OwnerProfile />} />
          <Route path="feeds" element={<FeedManagement user={user!} />} />
          <Route path="reports" element={<ReportsPage user={user!} />} />
          <Route path="water-logs" element={<WaterLogsPage user={user!} />} />
          <Route path="feed-logs" element={<FeedLogsPage user={user!} />} />
          <Route path="inventory" element={<InventoryPage user={user!} />} />
          <Route path="growth" element={<GrowthRecordsPage user={user!} />} />
          <Route path="advisory" element={<AdvisoryPage user={user!} />} />
        </Route>

        <Route path="/admin" element={
          user ? (
            user.role === UserRole.ADMIN ? 
            <AdminDashboard user={user} onLogout={() => setUser(null)} /> : 
            <Navigate to="/dashboard" />
          ) : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
};

const DashboardSummary: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [stats, setStats] = useState({ totalExp: 0, totalSale: 0, totalPonds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data: exp } = await supabase.from('expenses').select('amount');
      const { data: sale } = await supabase.from('sales').select('amount');
      const { count } = await supabase.from('ponds').select('*', { count: 'exact', head: true }).eq('is_archived', false);
      
      const totalExp = exp?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      const totalSale = sale?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      
      setStats({ totalExp, totalSale, totalPonds: count || 0 });
      setLoading(false);
    };
    fetchStats();
  }, []);

  const profit = stats.totalSale - stats.totalExp;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`bg-white p-10 rounded-[3rem] shadow-sm border-t-8 transition-all hover:shadow-xl ${profit >= 0 ? 'border-green-500' : 'border-rose-500'}`}>
           <div className="flex justify-between items-start mb-8">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">মোট মুনাফা/ক্ষতি</p>
              <span className={`text-2xl p-3 rounded-2xl ${profit >= 0 ? 'bg-green-50 text-green-500' : 'bg-rose-50 text-rose-500'}`}>{profit >= 0 ? '📈' : '📉'}</span>
           </div>
           <h2 className={`text-5xl font-black tracking-tighter ${profit >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
              ৳ {Math.abs(profit).toLocaleString()}
           </h2>
           <p className="mt-4 text-xs font-bold text-slate-400 flex items-center gap-2">
              {profit >= 0 ? (
                <><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> আপনি বর্তমানে লাভে আছেন</>
              ) : (
                <><span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span> খরচ বিক্রির চেয়ে বেশি (ক্ষতি)</>
              )}
           </p>
        </div>

        <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent"></div>
           <div className="relative z-10">
              <p className="text-[11px] font-black text-blue-300 uppercase tracking-[0.2em] mb-8">মোট পুকুর সংখ্যা</p>
              <h2 className="text-6xl font-black text-white tracking-tighter">{stats.totalPonds} <span className="text-xl font-medium">টি</span></h2>
              <p className="mt-6 text-xs font-medium text-slate-400 leading-relaxed italic">
                 আপনার বর্তমানে <span className="text-blue-400 font-black">{stats.totalPonds}টি</span> পুকুর সচল রয়েছে।
              </p>
           </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between group">
           <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">প্যাকেজ স্ট্যাটাস</p>
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-3xl group-hover:scale-110 transition-transform shadow-inner">👑</div>
                 <div>
                    <p className="font-black text-slate-800 text-lg leading-none mb-1">{user.max_ponds === 999 ? 'আনলিমিটেড' : user.max_ponds + 'টি'} পুকুর</p>
                    <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">সক্রিয় সদস্য</p>
                 </div>
              </div>
           </div>
           <div className="pt-6 border-t border-slate-50">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-xs font-bold text-slate-500">মেয়াদ শেষ:</span>
                 <span className="text-sm font-black text-slate-800">{user.expiry_date ? new Date(user.expiry_date).toLocaleDateString('bn-BD') : 'নেই'}</span>
              </div>
              <Link to="/subscription" className="block w-full py-4 bg-slate-50 text-slate-600 rounded-2xl text-center text-xs font-black hover:bg-blue-600 hover:text-white transition-all shadow-inner">প্যাকেজ রিনিউ করুন →</Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;
