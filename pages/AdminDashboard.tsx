
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, SubscriptionStatus } from '../types';

const AdminDashboard: React.FC<{ user: UserProfile, onLogout: any }> = ({ user, onLogout }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'pending' | 'users' | 'revenue'>('pending');
  const [stats, setStats] = useState({ revenue: 0, activeUsers: 0 });

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
    }
    
    // Stats calculation
    const { data: revData } = await supabase.from('payments').select('amount').eq('status', 'APPROVED');
    const totalRevenue = revData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'ACTIVE');
    setStats({ revenue: totalRevenue, activeUsers: count || 0 });
  };

  const handleApprove = async (payment: any) => {
    const months = selectedMonths[payment.id];
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    const { error } = await supabase.from('payments').update({ 
      status: 'APPROVED',
      months: months
    }).eq('id', payment.id);

    if (!error) {
      await supabase.from('profiles').update({ 
        subscription_status: SubscriptionStatus.ACTIVE,
        expiry_date: expiryDate.toISOString(),
        max_ponds: payment.plan_id === 999 ? 999 : (payment.plan_id || 1)
      }).eq('id', payment.user_id);

      alert('সফলভাবে অ্যাপ্রুভ হয়েছে!');
      fetchData();
    }
  };

  const handleReject = async (id: string) => {
    if (confirm('আপনি কি এই পেমেন্টটি বাতিল করতে চান?')) {
      await supabase.from('payments').update({ status: 'REJECTED' }).eq('id', id);
      fetchData();
    }
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
                 <span className="text-green-500">৳ {stats.revenue.toLocaleString()}</span>
                 <span>মোট আয়</span>
              </div>
              <div className="flex flex-col items-end border-l border-white/10 pl-4">
                 <span className="text-blue-400">{stats.activeUsers} জন</span>
                 <span>সক্রিয় খামারি</span>
              </div>
           </div>
           <button onClick={onLogout} className="px-5 py-2.5 bg-rose-600/10 text-rose-500 rounded-xl text-xs font-black hover:bg-rose-600 hover:text-white transition-all">লগআউট</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6 md:p-12">
        {/* Tabs */}
        <div className="flex gap-2 mb-10 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
           <TabButton label="পেন্ডিং পেমেন্ট" active={activeTab === 'pending'} onClick={() => setActiveTab('pending')} count={payments.length} />
           <TabButton label="ইউজার তালিকা" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
           <TabButton label="আর্থিক রিপোর্ট" active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} />
        </div>

        {activeTab === 'pending' && (
          <div className="space-y-6">
            {payments.map(p => (
              <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex-1 space-y-2 text-center lg:text-left">
                  <h3 className="text-xl font-black text-slate-800">{p.profiles.farm_name}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 font-bold text-xs justify-center lg:justify-start">
                     <span>📧 {p.profiles.email}</span>
                     <span>📞 {p.profiles.phone || 'নেই'}</span>
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
                  <button onClick={() => handleApprove(p)} className="bg-green-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all">অ্যাপ্রুভ</button>
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
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                      <tr>
                         <th className="px-8 py-6">খামারের নাম</th>
                         <th className="px-8 py-6">ইমেইল ও ফোন</th>
                         <th className="px-8 py-6">অবস্থা</th>
                         <th className="px-8 py-6">পুকুর সীমা</th>
                         <th className="px-8 py-6">মেয়াদ শেষ</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 text-slate-700">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-8 py-6 font-black text-slate-800">{u.farm_name || 'নামহীন'}</td>
                           <td className="px-8 py-6">
                              <p className="text-sm font-bold">{u.email}</p>
                              <p className="text-xs text-slate-400">{u.phone}</p>
                           </td>
                           <td className="px-8 py-6">
                              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${u.subscription_status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-600'}`}>
                                 {u.subscription_status === 'ACTIVE' ? 'সক্রিয়' : 'মেয়াদোত্তীর্ণ'}
                              </span>
                           </td>
                           <td className="px-8 py-6 font-bold">{u.max_ponds === 999 ? 'আনলিমিটেড' : u.max_ponds}টি</td>
                           <td className="px-8 py-6 text-sm font-medium">{u.expiry_date ? new Date(u.expiry_date).toLocaleDateString('bn-BD') : '-'}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'revenue' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-blue-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h3 className="text-lg font-bold opacity-80 mb-2">সর্বমোট আয়</h3>
                <p className="text-6xl font-black tracking-tighter mb-8">৳ {stats.revenue.toLocaleString()}</p>
                <div className="pt-8 border-t border-white/10 flex justify-between">
                   <span className="text-xs font-bold">গত ৩০ দিনে প্রবৃদ্ধি:</span>
                   <span className="text-sm font-black text-green-300">+১২%</span>
                </div>
             </div>
             <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
                <h3 className="text-lg font-bold opacity-80 mb-2">এক্টিভ ইউজার</h3>
                <p className="text-6xl font-black tracking-tighter mb-8">{stats.activeUsers} <span className="text-2xl font-medium">জন</span></p>
                <div className="pt-8 border-t border-white/10 flex justify-between">
                   <span className="text-xs font-bold">সার্ভার স্ট্যাটাস:</span>
                   <span className="text-sm font-black text-blue-400">অনলাইন (সচল)</span>
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
    className={`flex-1 py-4 px-6 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
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
