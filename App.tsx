
import React, { useState, useEffect, useCallback } from 'react';
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
import AdvisoryPage from './pages/Advisory';
import AdminDashboard from './pages/AdminDashboard';
import OwnerProfile from './pages/OwnerProfile';
import ResetPasswordPage from './pages/ResetPassword';
import AccountSettings from './pages/AccountSettings';
import { UserProfile, SubscriptionStatus, UserRole, Pond } from './types';

const AuthListener: React.FC<{ onProfileFetch: (id: string) => void }> = ({ onProfileFetch }) => {
  const navigate = useNavigate();
  const onProfileFetchRef = React.useRef(onProfileFetch);
  onProfileFetchRef.current = onProfileFetch;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      } else if (session?.user?.id) {
        onProfileFetchRef.current(session.user.id);
      } else {
        onProfileFetchRef.current("");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  return null;
};

const QuickLink: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => (
  <Link to={to} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:bg-slate-50 transition-colors">
    <span className="text-2xl">{icon}</span>
    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{label}</span>
  </Link>
);

const DashboardSummary: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [stats, setStats] = useState({ totalExp: 0, totalSale: 0, totalPonds: 0, totalFishStock: 0, totalFishSold: 0 });
  const [pondsSummary, setPondsSummary] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!user) return;
    if (user.id === 'guest-id') {
      setStats({ totalExp: 45600, totalSale: 125000, totalPonds: 4, totalFishStock: 11000, totalFishSold: 600 });
      setPondsSummary([
        { id: '1', name: 'পুকুর ১ (রুই ও কাতলা)', speciesCount: 2, totalCount: 2500 },
        { id: '2', name: 'পুকুর ২ (কাতলা)', speciesCount: 1, totalCount: 1500 },
        { id: '3', name: 'পুকুর ৩ (পাঙ্গাস)', speciesCount: 1, totalCount: 5000 },
        { id: '4', name: 'পুকুর ৪ (তেলাপিয়া)', speciesCount: 1, totalCount: 2000 }
      ]);
      return;
    }
    try {
      const { data: exp } = await supabase.from('expenses').select('amount').eq('user_id', user.id);
      const { data: sale } = await supabase.from('sales').select('amount, count_sold').eq('user_id', user.id);
      const { data: pondList, count } = await supabase.from('ponds').select('*, stocking_records(*)').eq('user_id', user.id);
      
      let totalStock = 0;
      if (pondList) {
        const processed = pondList.map(p => {
          const pCount = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.count || 0), 0) || 0;
          totalStock += pCount;
          return {
            id: p.id,
            name: p.name,
            speciesCount: p.stocking_records?.length || 0,
            totalCount: pCount
          };
        });
        setPondsSummary(processed);
      }

      const totalExp = exp?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      const totalSale = sale?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      const totalSold = sale?.reduce((a, b) => a + Number(b.count_sold || 0), 0) || 0;

      setStats({ 
        totalExp, 
        totalSale, 
        totalPonds: count || 0,
        totalFishStock: totalStock,
        totalFishSold: totalSold
      });
    } catch (e) {
      console.error(e);
    }
  };

  const daysLeft = user?.expiry_date ? Math.ceil((new Date(user.expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

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
        <QuickLink to="/dashboard/sales" icon="💰" label="বিক্রি" />
        <QuickLink to="/dashboard/expenses" icon="📉" label="খরচ" />
        <QuickLink to="/dashboard/feeds" icon="📦" label="খাবার" />
        <QuickLink to="/dashboard/inventory" icon="🏪" label="গুদাম" />
        <QuickLink to="/dashboard/reports" icon="📜" label="রিপোর্ট" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className={`bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border-t-8 ${stats.totalSale - stats.totalExp >= 0 ? 'border-green-500' : 'border-rose-500'}`}>
           <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">মোট মুনাফা/ক্ষতি</p>
           <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-slate-800">৳ {(stats.totalSale - stats.totalExp).toLocaleString()}</h2>
        </div>
        
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">মোট পুকুর</p>
              <h2 className="text-2xl md:text-4xl font-black text-slate-800">{stats.totalPonds} <span className="text-sm">টি</span></h2>
           </div>
           <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl md:text-2xl">🌊</div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">পুকুরে মোট মাছ (মজুদ)</p>
              <h2 className="text-2xl md:text-4xl font-black text-blue-600">{stats.totalFishStock.toLocaleString()} <span className="text-sm">পিস</span></h2>
           </div>
           <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl md:text-2xl">🐟</div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">মোট বিক্রি হওয়া মাছ</p>
              <h2 className="text-2xl md:text-4xl font-black text-green-600">{stats.totalFishSold.toLocaleString()} <span className="text-sm">পিস</span></h2>
           </div>
           <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl md:text-2xl">💰</div>
        </div>
      </div>

      {/* Pond Fish Stock Overview Widget */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] shadow-sm border border-slate-100">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl text-white shadow-lg">🐟</div>
               <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800">পুকুর ভিত্তিক মাছের বর্তমান পরিমাণ</h3>
                  <p className="text-xs font-bold text-slate-400">প্রতিটি পুকুরের বর্তমান মজুদ ও মাছের বিবরণ</p>
               </div>
            </div>
            <Link to="/dashboard/sales" className="px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-xs hover:scale-105 transition-transform shadow-md shadow-green-100 text-center">
              💰 মাছ বিক্রি করুন
            </Link>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pondsSummary.map(pond => (
               <div key={pond.id} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                  <div>
                     <h4 className="font-black text-slate-800 text-base mb-1">{pond.name}</h4>
                     <span className="text-[10px] font-bold text-slate-400 uppercase block mb-3">{pond.speciesCount} টি ক্যাটাগরি</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-slate-200/60">
                     <span className="text-xs font-bold text-slate-500">বর্তমান মজুদ:</span>
                     <span className="text-lg font-black text-blue-600">{pond.totalCount.toLocaleString()} পিস</span>
                  </div>
               </div>
            ))}
            {pondsSummary.length === 0 && (
               <div className="col-span-full py-8 text-center text-slate-400 font-bold italic">কোনো পুকুরের তথ্য পাওয়া যায়নি। আগে নতুন পুকুর যোগ করুন।</div>
            )}
         </div>
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
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (localStorage.getItem('fish_farm_guest') === 'true') {
      return {
        id: 'guest-id',
        email: 'guest@demo.com',
        role: UserRole.FARMER,
        subscription_status: SubscriptionStatus.ACTIVE,
        expiry_date: new Date(Date.now() + 86400000 * 30).toISOString(),
        max_ponds: 5,
        farm_name: 'ডেমো মৎস্য খামার',
        full_name: 'অতিথি ইউজার'
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (id: string) => {
    if (!id) { 
      if (localStorage.getItem('fish_farm_guest') !== 'true') {
        setUser(null); 
      }
      setLoading(false); 
      return; 
    }
    try {
      localStorage.removeItem('fish_farm_guest');
      const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
      if (data) {
        setUser(data as UserProfile);
      } else {
        const { data: authData } = await supabase.auth.getSession();
        if (authData?.session?.user) {
          const fallbackUser: UserProfile = {
            id: authData.session.user.id,
            email: authData.session.user.email || 'user@farm.com',
            role: UserRole.FARMER,
            subscription_status: SubscriptionStatus.ACTIVE,
            expiry_date: new Date(Date.now() + 365 * 86400000).toISOString(),
            max_ponds: 10,
            farm_name: 'আমার মৎস্য খামার',
            full_name: authData.session.user.email ? authData.session.user.email.split('@')[0] : 'মৎস্য চাষী'
          };
          setUser(fallbackUser);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const enterGuestMode = () => {
    localStorage.setItem('fish_farm_guest', 'true');
    setUser({
      id: 'guest-id',
      email: 'guest@demo.com',
      role: UserRole.FARMER,
      subscription_status: SubscriptionStatus.ACTIVE,
      expiry_date: new Date(Date.now() + 86400000 * 30).toISOString(),
      max_ponds: 5,
      farm_name: 'ডেমো মৎস্য খামার',
      full_name: 'অতিথি ইউজার'
    });
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    
    // Safety timer so page never hangs on loading screen on slow mobile networks
    const timer = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.id) {
        fetchProfile(session.user.id);
      } else {
        if (isMounted) setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchProfile]);

  const handleLogout = async () => {
    localStorage.removeItem('fish_farm_guest');
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
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing enterGuestMode={enterGuestMode} />} />
          <Route path="/founder" element={<OwnerProfile />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage type="login" onLogin={(u) => setUser(u)} enterGuestMode={enterGuestMode} />} />
          <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage type="register" onLogin={(u) => setUser(u)} enterGuestMode={enterGuestMode} />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/subscription" element={user ? <SubscriptionPage user={user} onUpdateUser={fetchProfile} /> : <Navigate to="/login" replace />} />
          <Route path="/dashboard/*" element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
            <Route index element={<DashboardSummary user={user!} />} />
            <Route path="ponds" element={<PondsPage user={user!} />} />
            <Route path="sales" element={<SalesPage user={user!} />} />
            <Route path="expenses" element={<ExpensesPage user={user!} />} />
            <Route path="feeds" element={<FeedManagement user={user!} />} />
            <Route path="feed-logs" element={<FeedLogsPage user={user!} />} />
            <Route path="inventory" element={<InventoryPage user={user!} />} />
            <Route path="reports" element={<ReportsPage user={user!} />} />
            <Route path="settings" element={<AccountSettings user={user!} onUpdateUser={fetchProfile} />} />
          </Route>
          <Route path="/admin" element={user?.role === UserRole.ADMIN ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
