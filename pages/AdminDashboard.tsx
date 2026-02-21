
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, SubscriptionStatus, SUBSCRIPTION_PLANS } from '../types';

const AdminDashboard: React.FC<{ user: UserProfile, onLogout: any }> = ({ user, onLogout }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'revenue' | 'settings' | 'coupons' | 'analytics'>('pending');
  const [stats, setStats] = useState({ revenue: 0, activeUsers: 0, totalVisits: 0 });
  const [processing, setProcessing] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>(SUBSCRIPTION_PLANS);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: 20 });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    if (activeTab === 'pending') {
      const { data } = await supabase.from('payments').select('*, profiles(email, farm_name, phone)').eq('status', 'PENDING').order('created_at', { ascending: false });
      if (data) {
        setPayments(data);
        const durations: any = {};
        data.forEach(p => durations[p.id] = p.months || 1);
        setSelectedMonths(durations);
      }
    } else if (activeTab === 'users') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (data) setUsers(data as UserProfile[]);
    } else if (activeTab === 'coupons') {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      if (data) setCoupons(data);
    } else if (activeTab === 'settings') {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 'subscription_plans').single();
      if (data) setPlans(data.value);
    } else if (activeTab === 'analytics') {
      const { data } = await supabase.from('site_analytics').select('*').order('created_at', { ascending: false }).limit(100);
      if (data) setAnalytics(data);
    }
    
    // Stats calculation
    const { data: revData } = await supabase.from('payments').select('amount').eq('status', 'APPROVED');
    const totalRevenue = revData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
    const { count: activeCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'ACTIVE');
    const { count: visitCount } = await supabase.from('site_analytics').select('*', { count: 'exact', head: true });
    setStats({ revenue: totalRevenue, activeUsers: activeCount || 0, totalVisits: visitCount || 0 });
  };

  const handleApprove = async (payment: any) => {
    setProcessing(payment.id);
    const months = selectedMonths[payment.id];
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    // ১. পেমেন্ট স্ট্যাটাস আপডেট
    const { error: payError } = await supabase.from('payments').update({ 
      status: 'APPROVED',
      months: months
    }).eq('id', payment.id);

    if (payError) {
      alert('পেমেন্ট আপডেট করতে সমস্যা হয়েছে।');
      setProcessing(null);
      return;
    }

    // ২. প্রোফাইল স্ট্যাটাস এবং ফিচার লিমিট আপডেট
    const plan = plans.find(pl => pl.id === payment.plan_id);
    const maxPonds = plan ? plan.ponds : 1;

    const { error: profError } = await supabase.from('profiles').update({ 
      subscription_status: SubscriptionStatus.ACTIVE,
      expiry_date: expiryDate.toISOString(),
      max_ponds: maxPonds
    }).eq('id', payment.user_id);

    if (!profError) {
      alert(`সফলভাবে অ্যাপ্রুভ হয়েছে! ইউজার এখন ড্যাশবোর্ড ব্যবহার করতে পারবেন। মেয়াদ: ${expiryDate.toLocaleDateString('bn-BD')}`);
      fetchData();
    } else {
      alert('প্রোফাইল আপডেট করতে সমস্যা হয়েছে।');
    }
    setProcessing(null);
  };

  const handleReject = async (id: string) => {
    if (confirm('আপনি কি এই পেমেন্টটি বাতিল করতে চান?')) {
      await supabase.from('payments').update({ status: 'REJECTED' }).eq('id', id);
      fetchData();
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('আপনি কি এই ইউজারকে ডিলিট করতে চান? এটি সব ডাটা মুছে ফেলবে!')) {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (!error) fetchData();
      else alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  const handleDeletePayment = async (id: string) => {
    if (confirm('আপনি কি এই পেমেন্ট রেকর্ডটি ডিলিট করতে চান?')) {
      const { error } = await supabase.from('payments').delete().eq('id', id);
      if (!error) fetchData();
      else alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  const handleUpdatePlans = async () => {
    const { error } = await supabase.from('site_settings').upsert({ id: 'subscription_plans', value: plans });
    if (!error) alert('প্রাইসিং আপডেট হয়েছে!');
    else alert('আপডেট করতে সমস্যা হয়েছে।');
  };

  const handleAddPlan = () => {
    const newId = plans.length > 0 ? Math.max(...plans.map(p => p.id)) + 1 : 1;
    setPlans([...plans, { id: newId, label: 'নতুন প্ল্যান', price: 0, ponds: 1 }]);
  };

  const handleRemovePlan = (id: number) => {
    if (confirm('আপনি কি এই প্ল্যানটি ডিলিট করতে চান?')) {
      setPlans(plans.filter(p => p.id !== id));
    }
  };

  const handleAddCoupon = async () => {
    if (!newCoupon.code) return;
    const { error } = await supabase.from('coupons').insert([{ code: newCoupon.code.toUpperCase(), discount_percent: newCoupon.discount }]);
    if (!error) {
      setNewCoupon({ code: '', discount: 20 });
      fetchData();
    } else alert('কুপন যোগ করতে সমস্যা হয়েছে।');
  };

  const handleDeleteCoupon = async (id: string) => {
    await supabase.from('coupons').delete().eq('id', id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <nav className="bg-slate-900 text-white p-6 sticky top-0 z-50 shadow-2xl flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">🛡️</div>
           <h1 className="text-xl font-black tracking-tight">অ্যাডমিন কন্ট্রোল সেন্টার</h1>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden md:flex gap-4 text-xs font-black uppercase tracking-widest text-slate-400">
              <div className="flex flex-col items-end">
                 <span className="text-green-500 font-black">৳ {stats.revenue.toLocaleString()}</span>
                 <span>মোট আয়</span>
              </div>
              <div className="flex flex-col items-end border-l border-white/10 pl-4">
                 <span className="text-blue-400 font-black">{stats.activeUsers} জন</span>
                 <span>সক্রিয় খামারি</span>
              </div>
              <div className="flex flex-col items-end border-l border-white/10 pl-4">
                 <span className="text-amber-400 font-black">{stats.totalVisits} বার</span>
                 <span>ভিজিটর</span>
              </div>
           </div>
           <button onClick={onLogout} className="px-5 py-2.5 bg-rose-600/10 text-rose-500 rounded-xl text-xs font-black hover:bg-rose-600 hover:text-white transition-all">লগআউট</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-12">
        <div className="flex flex-wrap gap-2 mb-10 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <TabButton label="পেন্ডিং পেমেন্ট" active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} count={payments.length} />
           <TabButton label="ইউজার তালিকা" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
           <TabButton label="আর্থিক রিপোর্ট" active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} />
           <TabButton label="প্রাইসিং" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
           <TabButton label="কুপন" active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} />
           <TabButton label="অ্যানালিটিক্স" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
        </div>

        {activeTab === 'pending' && (
          <div className="space-y-6">
            {payments.map(p => (
              <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex-1 space-y-2 text-center lg:text-left">
                  <h3 className="text-xl font-black text-slate-800">{p.profiles?.farm_name || 'অজানা খামার'}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 font-bold text-xs justify-center lg:justify-start">
                     <span>📧 {p.profiles?.email}</span>
                     <span>📞 {p.profiles?.phone || 'নেই'}</span>
                  </div>
                  <div className="inline-block px-4 py-1.5 bg-blue-50 rounded-xl font-mono text-blue-600 font-black text-sm uppercase mt-2 border border-blue-100">
                    TrxID: {p.trx_id}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-3xl">
                   <div className="text-center md:text-left px-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase">পেমেন্ট পরিমাণ</p>
                      <p className="text-xl font-black text-slate-800">৳ {p.amount}</p>
                   </div>
                   <div className="h-10 w-px bg-slate-200 hidden md:block"></div>
                   <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-inner">
                      <label className="text-[10px] font-black text-slate-400 uppercase">মেয়াদ (মাস)</label>
                      <select value={selectedMonths[p.id]} onChange={e => setSelectedMonths({...selectedMonths, [p.id]: Number(e.target.value)})} className="bg-transparent border-none font-black outline-none text-blue-600">
                        {[1, 2, 3, 4, 5, 6, 12].map(m => <option key={m} value={m}>{m} মাস</option>)}
                      </select>
                   </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    disabled={processing === p.id}
                    onClick={() => handleApprove(p)} 
                    className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {processing === p.id ? 'অপেক্ষা...' : 'অ্যাপ্রুভ'}
                  </button>
                  <button onClick={() => handleReject(p.id)} className="bg-rose-50 text-rose-500 px-6 py-4 rounded-2xl font-black hover:bg-rose-500 hover:text-white transition-all">বাতিল</button>
                </div>
              </div>
            ))}
            {payments.length === 0 && (
              <div className="text-center py-32 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                 <p className="text-4xl mb-4 opacity-30">📂</p>
                 <p className="text-slate-400 font-bold italic text-xl">বর্তমানে কোনো পেন্ডিং পেমেন্ট নেই</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-300">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <tr>
                         <th className="px-8 py-6">খামারের নাম</th>
                         <th className="px-8 py-6">ইমেইল ও ফোন</th>
                         <th className="px-8 py-6">অবস্থা</th>
                         <th className="px-8 py-6">পুকুর সীমা</th>
                         <th className="px-8 py-6">অ্যাকশন</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 text-slate-700">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-6 font-black text-slate-800">{u.farm_name || 'নামহীন'}</td>
                           <td className="px-8 py-6">
                              <p className="text-sm font-bold">{u.email}</p>
                              <p className="text-xs text-slate-400">{u.phone || 'নেই'}</p>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${u.subscription_status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-600'}`}>
                                 {u.subscription_status === 'ACTIVE' ? 'সক্রিয়' : 'মেয়াদোত্তীর্ণ'}
                              </span>
                           </td>
                           <td className="px-8 py-6 font-bold">{u.max_ponds === 999 ? 'আনলিমিটেড' : u.max_ponds}টি</td>
                           <td className="px-8 py-6">
                              <button onClick={() => handleDeleteUser(u.id)} className="text-rose-500 hover:text-rose-700 font-black text-xs uppercase tracking-widest">ডিলিট</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in zoom-in-95 duration-300">
                <div className="bg-blue-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700"></div>
                   <h3 className="text-lg font-bold opacity-80 mb-2">সর্বমোট আয়</h3>
                   <p className="text-6xl font-black tracking-tighter mb-8">৳ {stats.revenue.toLocaleString()}</p>
                   <div className="pt-8 border-t border-white/10 flex justify-between">
                      <span className="text-xs font-bold">সার্ভার স্ট্যাটাস:</span>
                      <span className="text-sm font-black text-green-300">অনলাইন (সচল)</span>
                   </div>
                </div>
                <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
                   <h3 className="text-lg font-bold opacity-80 mb-2">এক্টিভ ইউজার</h3>
                   <p className="text-6xl font-black tracking-tighter mb-8">{stats.activeUsers} <span className="text-2xl font-medium">জন</span></p>
                   <div className="pt-8 border-t border-white/10 flex justify-between">
                      <span className="text-xs font-bold">ইউজার প্রবৃদ্ধি:</span>
                      <span className="text-sm font-black text-blue-400">+১৫%</span>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                   <h3 className="text-xl font-black text-slate-800">আর্থিক রিপোর্ট (পেমেন্ট হিস্ট্রি)</h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                         <tr>
                            <th className="px-8 py-6">তারিখ</th>
                            <th className="px-8 py-6">পরিমাণ</th>
                            <th className="px-8 py-6">TrxID</th>
                            <th className="px-8 py-6">অবস্থা</th>
                            <th className="px-8 py-6">অ্যাকশন</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700">
                         {payments.map(p => (
                           <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-6 text-sm">{new Date(p.created_at).toLocaleDateString('bn-BD')}</td>
                              <td className="px-8 py-6 font-black">৳ {p.amount}</td>
                              <td className="px-8 py-6 font-mono text-xs">{p.trx_id}</td>
                              <td className="px-8 py-6">
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-black ${p.status === 'APPROVED' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                                    {p.status}
                                 </span>
                              </td>
                              <td className="px-8 py-6">
                                 <button onClick={() => handleDeletePayment(p.id)} className="text-rose-500 hover:text-rose-700 font-black text-xs uppercase tracking-widest">ডিলিট</button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div className="flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">প্রাইসিং ম্যানেজমেন্ট</h3>
                <button onClick={handleAddPlan} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all">নতুন প্ল্যান যোগ করুন</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map((plan, idx) => (
                  <div key={idx} className="p-6 bg-slate-50 rounded-3xl space-y-4 relative group">
                     <button onClick={() => handleRemovePlan(plan.id)} className="absolute top-4 right-4 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400">লেবেল</label>
                        <input 
                          type="text" 
                          value={plan.label} 
                          onChange={e => {
                            const newPlans = [...plans];
                            newPlans[idx].label = e.target.value;
                            setPlans(newPlans);
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 font-black text-slate-800"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-400">মূল্য (৳)</label>
                           <input 
                             type="number" 
                             value={plan.price} 
                             onChange={e => {
                               const newPlans = [...plans];
                               newPlans[idx].price = Number(e.target.value);
                               setPlans(newPlans);
                             }}
                             className="w-full px-4 py-3 rounded-xl border border-slate-200 font-black text-slate-800"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-400">পুকুর সংখ্যা</label>
                           <input 
                             type="number" 
                             value={plan.ponds} 
                             onChange={e => {
                               const newPlans = [...plans];
                               newPlans[idx].ponds = Number(e.target.value);
                               setPlans(newPlans);
                             }}
                             className="w-full px-4 py-3 rounded-xl border border-slate-200 font-black text-slate-800"
                           />
                        </div>
                     </div>
                  </div>
                ))}
             </div>
             <button onClick={handleUpdatePlans} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">সেভ করুন</button>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div className="bg-white p-12 rounded-[3rem] shadow-sm border border-slate-100 space-y-6">
                <h3 className="text-2xl font-black text-slate-800">নতুন কুপন যোগ করুন</h3>
                <div className="flex flex-col md:flex-row gap-4">
                   <input 
                     placeholder="কুপন কোড (যেমন: SAVE20)" 
                     value={newCoupon.code}
                     onChange={e => setNewCoupon({...newCoupon, code: e.target.value})}
                     className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-600 font-black uppercase"
                   />
                   <input 
                     type="number"
                     placeholder="ডিসকাউন্ট (%)" 
                     value={newCoupon.discount}
                     onChange={e => setNewCoupon({...newCoupon, discount: Number(e.target.value)})}
                     className="w-full md:w-40 px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-600 font-black"
                   />
                   <button onClick={handleAddCoupon} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-blue-600 transition-all">যোগ করুন</button>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <tr>
                         <th className="px-8 py-6">কোড</th>
                         <th className="px-8 py-6">ডিসকাউন্ট</th>
                         <th className="px-8 py-6">অবস্থা</th>
                         <th className="px-8 py-6">অ্যাকশন</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 text-slate-700">
                      {coupons.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-6 font-black text-blue-600">{c.code}</td>
                           <td className="px-8 py-6 font-bold">{c.discount_percent}%</td>
                           <td className="px-8 py-6">
                              <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-black">ACTIVE</span>
                           </td>
                           <td className="px-8 py-6">
                              <button onClick={() => handleDeleteCoupon(c.id)} className="text-rose-500 hover:text-rose-700 font-black text-xs uppercase tracking-widest">ডিলিট</button>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট ভিজিট</p>
                   <p className="text-4xl font-black text-slate-800">{stats.totalVisits}</p>
                </div>
             </div>

             <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50">
                   <h3 className="text-xl font-black text-slate-800">সাম্প্রতিক ভিজিটর অ্যাক্টিভিটি</h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                         <tr>
                            <th className="px-8 py-6">সময়</th>
                            <th className="px-8 py-6">পেজ</th>
                            <th className="px-8 py-6">ভিজিটর আইডি</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-700">
                         {analytics.map(a => (
                           <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-8 py-6 text-xs">{new Date(a.created_at).toLocaleString('bn-BD')}</td>
                              <td className="px-8 py-6 font-bold text-blue-600">{a.page_path}</td>
                              <td className="px-8 py-6 font-mono text-[10px] text-slate-400">{a.visitor_id}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void; count?: number }> = ({ label, active, onClick, count }) => (
  <button 
    onClick={onClick}
    className={`flex-1 py-4 px-6 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
  >
    {label}
    {count !== undefined && count > 0 && (
      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${active ? 'bg-white text-blue-600' : 'bg-blue-600 text-white'}`}>
        {count}
      </span>
    )}
  </button>
);

export default AdminDashboard;
