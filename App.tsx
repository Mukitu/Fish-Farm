
import React, { useState, useEffect, useMemo } from 'react';
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
import { UserProfile, SubscriptionStatus, UserRole, Pond } from './types';

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
          user ? (user.subscription_status === SubscriptionStatus.ACTIVE || user.role === UserRole.ADMIN ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/subscription" />) : <Navigate to="/login" />
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

        <Route path="/admin" element={user?.role === UserRole.ADMIN ? <AdminDashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

const DashboardSummary: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [calcType, setCalcType] = useState<'expense' | 'sale'>('expense');
  const [calcItem, setCalcItem] = useState('');
  const [calcWeight, setCalcWeight] = useState<number | ''>('');
  const [calcPrice, setCalcPrice] = useState<number | ''>('');
  const [stats, setStats] = useState({ totalExp: 0, totalSale: 0, totalWeightSold: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: exp } = await supabase.from('expenses').select('amount');
      const { data: sale } = await supabase.from('sales').select('amount, weight');
      
      const totalExp = exp?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      const totalSale = sale?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      const totalWeightSold = sale?.reduce((a, b) => a + Number(b.weight || 0), 0) || 0;
      
      setStats({ totalExp, totalSale, totalWeightSold });
    };
    fetchStats();
  }, []);

  const totalCalcAmount = (Number(calcWeight) || 0) * (Number(calcPrice) || 0);
  const profit = stats.totalSale - stats.totalExp;
  const breakEven = stats.totalWeightSold > 0 ? (stats.totalExp / stats.totalWeightSold).toFixed(2) : '০';

  const handleAddData = async () => {
    if (!calcItem || !calcWeight || !calcPrice) return alert('দয়া করে সঠিক তথ্য দিন');
    const table = calcType === 'expense' ? 'expenses' : 'sales';
    
    const { error } = await supabase.from(table).insert([{
      user_id: user.id,
      amount: totalCalcAmount,
      weight: Number(calcWeight),
      category: calcType === 'expense' ? 'হিসাব সহকারী' : 'বিক্রয়',
      item_name: calcItem,
      note: `${calcItem} - ${calcWeight} কেজি (৳${calcPrice}/কেজি)`,
      date: new Date().toISOString()
    }]);

    if (!error) {
      alert('সফলভাবে যুক্ত হয়েছে!');
      setCalcItem(''); setCalcWeight(''); setCalcPrice('');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* Smart Quick Input Assistant */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border border-blue-50 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 transition-transform group-hover:scale-110"></div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
            <div>
               <h3 className="text-2xl font-black text-slate-800">স্মার্ট হিসাব সহকারী</h3>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1 italic">পরিমাণ ও দর দিলেই টাকা স্বয়ংক্রিয়ভাবে হিসাব হবে</p>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto shadow-inner">
              <button onClick={() => setCalcType('expense')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-xs font-black transition-all ${calcType === 'expense' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500 hover:text-rose-500'}`}>খরচ/ক্রয়</button>
              <button onClick={() => setCalcType('sale')} className={`flex-1 md:flex-none px-8 py-2.5 rounded-xl text-xs font-black transition-all ${calcType === 'sale' ? 'bg-green-600 text-white shadow-lg' : 'text-slate-500 hover:text-green-600'}`}>মাছ বিক্রি</button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-[0.1em]">মাছ/খাবার/ওষুধের নাম</label>
              <input value={calcItem} onChange={e => setCalcItem(e.target.value)} type="text" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder="উদা: সিলভার কার্প / খাবার" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-[0.1em]">পরিমাণ (কেজি)</label>
              <input value={calcWeight} onChange={e => setCalcWeight(e.target.value === '' ? '' : Number(e.target.value))} type="number" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder="০০" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-[0.1em]">দর (৳ প্রতি কেজি)</label>
              <input value={calcPrice} onChange={e => setCalcPrice(e.target.value === '' ? '' : Number(e.target.value))} type="number" className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500 shadow-inner" placeholder="৳ ০০" />
            </div>
            <div className="flex items-center gap-3">
               <div className="flex-1 bg-blue-600/5 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center h-[58px]">
                  <p className="text-[8px] font-black text-blue-400 uppercase leading-none mb-1">মোট টাকা</p>
                  <p className="text-lg font-black text-blue-600 leading-none">৳ {totalCalcAmount}</p>
               </div>
               <button onClick={handleAddData} className={`p-4 h-[58px] w-[58px] rounded-2xl text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center shrink-0 ${calcType === 'expense' ? 'bg-rose-500 shadow-rose-200' : 'bg-green-600 shadow-green-200'}`}>
                  <span className="text-2xl">➔</span>
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`bg-white p-10 rounded-[3rem] shadow-sm border-t-8 transition-all hover:shadow-xl ${profit >= 0 ? 'border-green-500' : 'border-rose-500'}`}>
           <div className="flex justify-between items-start mb-8">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">খামারের নীট লাভ/ক্ষতি</p>
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
              <p className="text-[11px] font-black text-blue-300 uppercase tracking-[0.2em] mb-8">টার্গেট ব্রেক-ইভেন দর</p>
              <h2 className="text-5xl font-black text-white tracking-tighter">৳ {breakEven}</h2>
              <p className="mt-6 text-xs font-medium text-slate-400 leading-relaxed italic">
                 "মুনাফা করতে হলে আপনাকে প্রতি কেজি মাছ গড়ে <span className="text-blue-400 font-black">৳ {breakEven}</span> এর বেশি দামে বিক্রি করতে হবে।"
              </p>
           </div>
           <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-500 opacity-5 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-between group">
           <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">প্যাকেজ স্ট্যাটাস</p>
              <div className="flex items-center gap-4 mb-4">
                 <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-3xl group-hover:scale-110 transition-transform shadow-inner">👑</div>
                 <div>
                    <p className="font-black text-slate-800 text-lg leading-none mb-1">{user.max_ponds === 999 ? 'আনলিমিটেড' : user.max_ponds + 'টি'} পুকুর প্যাকেজ</p>
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
