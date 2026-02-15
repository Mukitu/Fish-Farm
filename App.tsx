
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
import { UserProfile, SubscriptionStatus, UserRole } from './types';

const AuthListener: React.FC<{ onProfileFetch: (id: string) => void }> = ({ onProfileFetch }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      } else if (session) {
        onProfileFetch(session.user.id);
      } else {
        onProfileFetch("");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, onProfileFetch]);

  return null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (id: string) => {
    if (!id) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // ১. প্রোফাইল চেক করা
      let { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      // ২. যদি প্রোফাইল না থাকে (Auto-Repair Logic)
      if (!data) {
        console.log("প্রোফাইল পাওয়া যায়নি, অটোমেটিক তৈরি করা হচ্ছে...");
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (authUser) {
          const isOwner = authUser.email === 'mukituislamnishat@gmail.com';
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .upsert([{ 
              id: authUser.id, 
              email: authUser.email,
              role: isOwner ? UserRole.ADMIN : UserRole.FARMER,
              subscription_status: isOwner ? SubscriptionStatus.ACTIVE : SubscriptionStatus.EXPIRED,
              max_ponds: isOwner ? 999 : 0,
              expiry_date: isOwner ? '2099-12-31' : null
            }])
            .select()
            .single();

          if (insertError) throw insertError;
          data = newProfile;
        }
      }

      if (data) {
        setUser(data as UserProfile);
        setError(null);
      } else {
        setError("আপনার প্রোফাইল তথ্য ডাটাবেজে পাওয়া যাচ্ছে না।");
      }
    } catch (e: any) {
      console.error("Profile Error:", e);
      setError("সিস্টেমে ত্রুটি হয়েছে: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600 animate-pulse">লোড হচ্ছে...</p>
    </div>
  );

  if (error && !user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
       <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-md w-full text-center border border-rose-100">
          <div className="text-5xl mb-6">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">প্রোফাইল এরর</h2>
          <p className="text-slate-500 font-bold mb-8">{error}</p>
          <div className="space-y-3">
             <button onClick={() => window.location.reload()} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">পুনরায় চেষ্টা করুন</button>
             <button onClick={() => supabase.auth.signOut()} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">লগআউট করুন</button>
          </div>
       </div>
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
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data: exp } = await supabase.from('expenses').select('amount, date');
      const { data: sale } = await supabase.from('sales').select('amount, date');
      const { count } = await supabase.from('ponds').select('*', { count: 'exact', head: true }).eq('is_archived', false);
      
      const totalExp = exp?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      const totalSale = sale?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      
      setStats({ totalExp, totalSale, totalPonds: count || 0 });

      const months: string[] = [];
      const bnMonths = ["জানু", "ফেব", "মার্চ", "এপ্রি", "মে", "জুন", "জুল", "আগ", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
      
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
      }

      const formattedData = months.map(m => {
        const mExp = exp?.filter(e => e.date.startsWith(m)).reduce((a, b) => a + Number(b.amount), 0) || 0;
        const mSale = sale?.filter(s => s.date.startsWith(m)).reduce((a, b) => a + Number(b.amount), 0) || 0;
        const monthIndex = parseInt(m.split('-')[1]) - 1;
        return { month: bnMonths[monthIndex], expense: mExp, sale: mSale };
      });

      setMonthlyData(formattedData);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const profit = stats.totalSale - stats.totalExp;
  const maxVal = Math.max(...monthlyData.map(d => Math.max(d.sale, d.expense)), 1000);

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

      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
            <div>
               <h3 className="text-2xl font-black text-slate-800 mb-1">মাসিক লেনদেন বিশ্লেষণ</h3>
               <p className="text-xs font-bold text-slate-400">গত ৬ মাসের বিক্রয় এবং খরচের চিত্র</p>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                  <span className="text-xs font-black text-slate-600">বিক্রয় (Sales)</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-400 rounded-full"></div>
                  <span className="text-xs font-black text-slate-600">খরচ (Expenses)</span>
               </div>
            </div>
         </div>

         <div className="relative h-64 w-full flex items-end justify-between px-2 md:px-10 gap-2 md:gap-8">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
               <div className="w-full h-px bg-slate-900"></div>
               <div className="w-full h-px bg-slate-900"></div>
               <div className="w-full h-px bg-slate-900"></div>
               <div className="w-full h-px bg-slate-900"></div>
            </div>

            {loading ? (
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : monthlyData.map((data, idx) => (
               <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                  <div className="flex items-end gap-1 md:gap-3 w-full justify-center h-full">
                     <div className="w-3 md:w-8 bg-blue-600 rounded-t-xl transition-all duration-700 ease-out group-hover:bg-blue-700 relative" style={{ height: `${(data.sale / maxVal) * 100}%`, minHeight: data.sale > 0 ? '4px' : '0' }}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-2 py-1 rounded text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">৳{data.sale.toLocaleString()}</div>
                     </div>
                     <div className="w-3 md:w-8 bg-rose-400 rounded-t-xl transition-all duration-700 ease-out group-hover:bg-rose-500 relative" style={{ height: `${(data.expense / maxVal) * 100}%`, minHeight: data.expense > 0 ? '4px' : '0' }}>
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-2 py-1 rounded text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">৳{data.expense.toLocaleString()}</div>
                     </div>
                  </div>
                  <p className="mt-6 text-[10px] md:text-xs font-black text-slate-400 group-hover:text-slate-800 transition-colors">{data.month}</p>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default App;
