
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
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
import ResetPasswordPage from './pages/ResetPassword';
import AccountSettings from './pages/AccountSettings';
import { UserProfile, SubscriptionStatus, UserRole, Pond } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (id: string) => {
    if (!id) { setUser(null); setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) setUser(data as UserProfile);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted) {
        if (session) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        await fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      } else if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600">লোড হচ্ছে...</p>
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
        <Route path="/founder" element={<OwnerProfile />} />
        <Route path="/login" element={<AuthPage type="login" onLogin={(u) => setUser(u)} />} />
        <Route path="/register" element={<AuthPage type="register" onLogin={(u) => setUser(u)} />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/subscription" element={user ? <SubscriptionPage user={user} onUpdateUser={fetchProfile} /> : <Navigate to="/login" />} />
        <Route path="/dashboard/*" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
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
          <Route path="settings" element={<AccountSettings user={user!} onUpdateUser={fetchProfile} />} />
        </Route>
        <Route path="/admin" element={user?.role === UserRole.ADMIN ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/dashboard" />} />
      </Routes>
  );
};

const DashboardSummary: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [stats, setStats] = useState({ totalExp: 0, totalSale: 0, totalPonds: 0 });
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [metricForm, setMetricForm] = useState({ pond_id: '', oxygen: '', ph: '', temp: '' });
  const [savingMetric, setSavingMetric] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: exp } = await supabase.from('expenses').select('amount').eq('user_id', user.id);
      const { data: sale } = await supabase.from('sales').select('amount').eq('user_id', user.id);
      const { data: pondList, count } = await supabase.from('ponds').select('*', { count: 'exact' }).eq('user_id', user.id);
      
      if (pondList) setPonds(pondList);
      const totalExp = exp?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      const totalSale = sale?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      setStats({ totalExp, totalSale, totalPonds: count || 0 });
    } catch (e) {
      console.error(e);
    }
  };

  const daysLeft = user.expiry_date ? Math.ceil((new Date(user.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricForm.pond_id) return alert('পুকুর নির্বাচন করুন');
    setSavingMetric(true);
    try {
      const { error } = await supabase.from('water_logs').insert([{
        user_id: user.id,
        pond_id: metricForm.pond_id,
        oxygen: parseFloat(metricForm.oxygen || '0'),
        ph: parseFloat(metricForm.ph || '0'),
        temp: parseFloat(metricForm.temp || '0'),
        date: new Date().toISOString().split('T')[0]
      }]);
      if (error) throw error;
      setMetricForm({ pond_id: '', oxygen: '', ph: '', temp: '' });
      alert("✅ পানির মান সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSavingMetric(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
         <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
         <div className="relative z-10 space-y-2">
            <h2 className="text-3xl font-black">আমার সাবস্ক্রিপশন</h2>
            <p className="text-blue-400 font-bold">প্যাকেজ: {user.max_ponds === 999 ? 'Unlimited' : user.max_ponds + ' পুকুর লিমিট'}</p>
            <p className="text-slate-400 text-sm">মেয়াদ শেষ: {user.expiry_date ? new Date(user.expiry_date).toLocaleDateString('bn-BD') : 'N/A'}</p>
         </div>
         <div className="relative z-10 text-center md:text-right">
            <div className="text-6xl font-black text-blue-500 mb-1">{daysLeft > 0 ? daysLeft : 0}</div>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">দিন বাকি আছে</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div className={`bg-white p-10 rounded-[3rem] shadow-sm border-t-8 ${stats.totalSale - stats.totalExp >= 0 ? 'border-green-500' : 'border-rose-500'}`}>
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">মোট মুনাফা/ক্ষতি</p>
           <h2 className="text-5xl font-black tracking-tighter text-slate-800">৳ {(stats.totalSale - stats.totalExp).toLocaleString()}</h2>
        </div>
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex items-center justify-between">
           <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">মোট পুকুর ব্যবহার</p>
              <h2 className="text-5xl font-black text-slate-800">{stats.totalPonds} <span className="text-xl">টি</span></h2>
           </div>
           <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">🌊</div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex items-center justify-center">
           <Link to="/subscription" className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-xl shadow-blue-200">প্যাকেজ আপগ্রেড</Link>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 max-w-2xl">
         <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg">🧪</div>
            <h3 className="text-2xl font-black text-slate-800">পানির গুণমান পরিমাপ</h3>
         </div>
         <form onSubmit={handleSaveMetric} className="space-y-6">
            <select required value={metricForm.pond_id} onChange={e => setMetricForm({...metricForm, pond_id: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black">
              <option value="">পুকুর বেছে নিন</option>
              {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-4">
               <input type="number" step="0.1" placeholder="DO" value={metricForm.oxygen} onChange={e => setMetricForm({...metricForm, oxygen: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-black text-center" />
               <input type="number" step="0.1" placeholder="pH" value={metricForm.ph} onChange={e => setMetricForm({...metricForm, ph: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-black text-center" />
               <input type="number" step="0.1" placeholder="Temp" value={metricForm.temp} onChange={e => setMetricForm({...metricForm, temp: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border-none rounded-2xl font-black text-center" />
            </div>
            <button type="submit" disabled={savingMetric} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50">
              {savingMetric ? 'সেভ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
         </form>
      </div>
    </div>
  );
};

const AppWrapper: React.FC = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;
