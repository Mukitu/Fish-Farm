
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
import { UserProfile, SubscriptionStatus, UserRole, Pond } from './types';

const AuthListener: React.FC<{ onProfileFetch: (id: string) => void }> = ({ onProfileFetch }) => {
  const navigate = useNavigate();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') navigate('/reset-password');
      else if (session) onProfileFetch(session.user.id);
      else onProfileFetch("");
    });
    return () => subscription.unsubscribe();
  }, [navigate, onProfileFetch]);
  return null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (id: string) => {
    if (!id) { setUser(null); setLoading(false); return; }
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) setUser(data as UserProfile);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600">লোড হচ্ছে...</p>
    </div>
  );

  return (
    <Router>
      <AuthListener onProfileFetch={fetchProfile} />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/founder" element={<OwnerProfile />} />
        <Route path="/login" element={<AuthPage type="login" onLogin={(u) => setUser(u)} />} />
        <Route path="/register" element={<AuthPage type="register" onLogin={(u) => setUser(u)} />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/subscription" element={user ? <SubscriptionPage user={user} onUpdateUser={fetchProfile} /> : <Navigate to="/login" />} />
        <Route path="/dashboard/*" element={user ? <Dashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/login" />}>
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
        <Route path="/admin" element={user?.role === UserRole.ADMIN ? <AdminDashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

const DashboardSummary: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [stats, setStats] = useState({ totalExp: 0, totalSale: 0, totalPonds: 0 });
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [metricForm, setMetricForm] = useState({ pond_id: '', oxygen: '', ph: '', temp: '' });
  const [savingMetric, setSavingMetric] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: exp } = await supabase.from('expenses').select('amount');
      const { data: sale } = await supabase.from('sales').select('amount');
      const { data: pondList, count } = await supabase.from('ponds').select('*', { count: 'exact' });
      
      if (pondList) setPonds(pondList);
      const totalExp = exp?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      const totalSale = sale?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      setStats({ totalExp, totalSale, totalPonds: count || 0 });
    } catch (e) {
      console.error("Dashboard data fetch error:", e);
    }
  };

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricForm.pond_id) return alert('পুকুর নির্বাচন করুন');
    
    setSavingMetric(true);
    try {
      const { data: authUser } = await supabase.auth.getUser();
      const { error } = await supabase.from('water_logs').insert([{
        user_id: authUser.user?.id,
        pond_id: metricForm.pond_id,
        oxygen: parseFloat(metricForm.oxygen || '0'),
        ph: parseFloat(metricForm.ph || '0'),
        temp: parseFloat(metricForm.temp || '0')
      }]);

      if (error) throw error;

      setShowSuccess(true);
      setMetricForm({ pond_id: '', oxygen: '', ph: '', temp: '' });
      setTimeout(() => setShowSuccess(false), 3000);
      alert("পানির মান সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSavingMetric(false);
    }
  };

  const profit = stats.totalSale - stats.totalExp;

  return (
    <div className="space-y-8 pb-12 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className={`bg-white p-10 rounded-[3rem] shadow-sm border-t-8 ${profit >= 0 ? 'border-green-500' : 'border-rose-500'}`}>
           <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">মোট মুনাফা/ক্ষতি</p>
           <h2 className={`text-5xl font-black tracking-tighter ${profit >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>৳ {Math.abs(profit).toLocaleString()}</h2>
        </div>
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white">
           <p className="text-[11px] font-black text-blue-300 uppercase tracking-widest mb-4">মোট পুকুর</p>
           <h2 className="text-6xl font-black">{stats.totalPonds} <span className="text-xl">টি</span></h2>
        </div>
        <div className="bg-blue-600 p-10 rounded-[3rem] text-white">
           <p className="text-[11px] font-black text-blue-100 uppercase tracking-widest mb-4">ইউজার স্ট্যাটাস</p>
           <h2 className="text-3xl font-black">Premium <span className="text-sm opacity-60">Active</span></h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
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
              <button type="submit" disabled={savingMetric} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                {savingMetric ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};

export default App;
