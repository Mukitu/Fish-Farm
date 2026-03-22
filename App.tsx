
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

const QuickLink: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => (
  <Link to={to} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
    <span className="text-2xl">{icon}</span>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{label}</span>
  </Link>
);

const DashboardSummary: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [stats, setStats] = useState({ totalExp: 0, totalSale: 0, totalPonds: 0 });
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [metricForm, setMetricForm] = useState({ pond_id: '', oxygen: '', ph: '', temp: '' });
  const [savingMetric, setSavingMetric] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    if (user.id === 'guest-id') {
      setStats({ totalExp: 45600, totalSale: 125000, totalPonds: 5 });
      setPonds([
        { id: '1', name: 'পুকুর ১ (রুই)', area: 20, fish_type: 'রুই', stock_date: '2024-01-01', is_active: true, user_id: 'guest' },
        { id: '2', name: 'পুকুর ২ (কাতলা)', area: 15, fish_type: 'কাতলা', stock_date: '2024-01-05', is_active: true, user_id: 'guest' },
        { id: '3', name: 'পুকুর ৩ (পাঙ্গাস)', area: 30, fish_type: 'পাঙ্গাস', stock_date: '2024-01-10', is_active: true, user_id: 'guest' },
        { id: '4', name: 'পুকুর ৪ (তেলাপিয়া)', area: 10, fish_type: 'তেলাপিয়া', stock_date: '2024-01-15', is_active: true, user_id: 'guest' },
        { id: '5', name: 'পুকুর ৫ (কার্প)', area: 25, fish_type: 'কার্প', stock_date: '2024-01-20', is_active: true, user_id: 'guest' }
      ] as any);
      return;
    }
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

  const daysLeft = user?.expiry_date ? Math.ceil((new Date(user.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
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

  if (!user) return null;

  return (
    <div className="space-y-6 md:space-y-8 pb-12 font-sans">
      {/* Subscription Card */}
      <div className="bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8 shadow-2xl">
         <div className="absolute top-0 left-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
         <div className="relative z-10 space-y-1 md:space-y-2 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black">আমার সাবস্ক্রিপশন</h2>
            <p className="text-blue-400 font-bold text-sm md:text-base">প্যাকেজ: {user.max_ponds === 999 ? 'Unlimited' : user.max_ponds + ' পুকুর লিমিট'}</p>
            <p className="text-slate-400 text-[10px] md:text-sm">মেয়াদ শেষ: {user.expiry_date ? new Date(user.expiry_date).toLocaleDateString('bn-BD') : 'N/A'}</p>
         </div>
         <div className="relative z-10 text-center md:text-right bg-white/5 px-6 py-4 rounded-3xl backdrop-blur-sm border border-white/10 w-full md:w-auto">
            <div className="text-4xl md:text-6xl font-black text-blue-500 mb-0.5 md:mb-1">{daysLeft > 0 ? daysLeft : 0}</div>
            <p className="text-[9px] md:text-xs font-black uppercase tracking-widest text-slate-400">দিন বাকি আছে</p>
         </div>
      </div>

      {/* Quick Access Grid for Mobile */}
      <div className="lg:hidden grid grid-cols-3 gap-3">
        <QuickLink to="/dashboard/ponds" icon="🌊" label="পুকুর" />
        <QuickLink to="/dashboard/expenses" icon="📉" label="খরচ" />
        <QuickLink to="/dashboard/sales" icon="💰" label="বিক্রি" />
        <QuickLink to="/dashboard/feeds" icon="📦" label="খাবার" />
        <QuickLink to="/dashboard/inventory" icon="🏪" label="গুদাম" />
        <QuickLink to="/dashboard/reports" icon="📜" label="রিপোর্ট" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        <div className={`bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border-t-8 ${stats.totalSale - stats.totalExp >= 0 ? 'border-green-500' : 'border-rose-500'}`}>
           <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4">মোট মুনাফা/ক্ষতি</p>
           <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-800">৳ {(stats.totalSale - stats.totalExp).toLocaleString()}</h2>
        </div>
        <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 md:mb-4">মোট পুকুর ব্যবহার</p>
              <h2 className="text-3xl md:text-5xl font-black text-slate-800">{stats.totalPonds} <span className="text-lg">টি</span></h2>
           </div>
           <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl md:text-3xl">🌊</div>
        </div>
        <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-100 flex items-center justify-center">
           <Link to="/subscription" className="w-full text-center px-6 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-xl shadow-blue-200">প্যাকেজ আপগ্রেড</Link>
        </div>
      </div>

      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-100 max-w-2xl">
         <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl text-white shadow-lg">🧪</div>
            <h3 className="text-xl md:text-2xl font-black text-slate-800">পানির গুণমান পরিমাপ</h3>
         </div>
         <form onSubmit={handleSaveMetric} className="space-y-4 md:space-y-6">
            <select required value={metricForm.pond_id} onChange={e => setMetricForm({...metricForm, pond_id: e.target.value})} className="w-full px-5 py-3.5 md:px-6 md:py-4 bg-slate-50 border-none rounded-2xl font-black text-sm md:text-base">
              <option value="">পুকুর বেছে নিন</option>
              {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
               <input type="number" step="0.1" placeholder="DO" value={metricForm.oxygen} onChange={e => setMetricForm({...metricForm, oxygen: e.target.value})} className="w-full px-3 py-3.5 md:px-4 md:py-4 bg-slate-50 border-none rounded-2xl font-black text-center text-sm md:text-base" />
               <input type="number" step="0.1" placeholder="pH" value={metricForm.ph} onChange={e => setMetricForm({...metricForm, ph: e.target.value})} className="w-full px-3 py-3.5 md:px-4 md:py-4 bg-slate-50 border-none rounded-2xl font-black text-center text-sm md:text-base" />
               <input type="number" step="0.1" placeholder="Temp" value={metricForm.temp} onChange={e => setMetricForm({...metricForm, temp: e.target.value})} className="w-full px-3 py-3.5 md:px-4 md:py-4 bg-slate-50 border-none rounded-2xl font-black text-center text-sm md:text-base" />
            </div>
            <button type="submit" disabled={savingMetric} className="w-full py-4 md:py-5 bg-blue-600 text-white rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-xl shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50">
              {savingMetric ? 'সেভ হচ্ছে...' : 'সংরক্ষণ করুন'}
            </button>
         </form>
      </div>
    </div>
  );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50 p-6 font-sans">
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center space-y-6 border border-rose-100">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-3xl flex items-center justify-center text-4xl mx-auto">⚠️</div>
            <h1 className="text-2xl font-black text-slate-800">দুঃখিত, একটি সমস্যা হয়েছে</h1>
            <p className="text-slate-500 font-bold text-sm">অ্যাপ্লিকেশনটি লোড করার সময় একটি ত্রুটি ঘটেছে। অনুগ্রহ করে পেজটি রিফ্রেশ করুন।</p>
            <div className="p-4 bg-slate-50 rounded-2xl text-left overflow-auto max-h-40">
              <code className="text-[10px] text-rose-500 font-mono">{this.state.error?.toString()}</code>
            </div>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all">রিফ্রেশ করুন</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const fetchProfile = async (id: string) => {
    if (!id) { 
      if (!isGuest) {
        setUser(null); 
      }
      setLoading(false); 
      return; 
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) setUser(data as UserProfile);
    setLoading(false);
  };

  const enterGuestMode = () => {
    setIsGuest(true);
    setUser({
      id: 'guest-id',
      email: 'guest@demo.com',
      role: UserRole.FARMER,
      subscription_status: SubscriptionStatus.ACTIVE,
      expiry_date: new Date(Date.now() + 86400000).toISOString(),
      max_ponds: 5,
      farm_name: 'ডেমো মৎস্য খামার',
      full_name: 'অতিথি ইউজার'
    });
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600">লোড হচ্ছে...</p>
    </div>
  );

  return (
    <ErrorBoundary>
      <Router>
        <AuthListener onProfileFetch={fetchProfile} />
        <Routes>
          <Route path="/" element={<Landing enterGuestMode={enterGuestMode} />} />
          <Route path="/founder" element={<OwnerProfile />} />
          <Route path="/login" element={<AuthPage type="login" onLogin={(u) => setUser(u)} enterGuestMode={enterGuestMode} />} />
          <Route path="/register" element={<AuthPage type="register" onLogin={(u) => setUser(u)} enterGuestMode={enterGuestMode} />} />
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
            <Route path="settings" element={<AccountSettings user={user!} onUpdateUser={fetchProfile} />} />
          </Route>
          <Route path="/admin" element={user?.role === UserRole.ADMIN ? <AdminDashboard user={user} onLogout={() => setUser(null)} /> : <Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
