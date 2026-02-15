
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, SubscriptionStatus } from '../types';

const AdminDashboard: React.FC<{ user: UserProfile, onLogout: any }> = ({ user, onLogout }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedMonths, setSelectedMonths] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchPayments = async () => {
      const { data } = await supabase.from('payments').select('*, profiles(email, farm_name)').eq('status', 'PENDING');
      if (data) {
        setPayments(data);
        const durations: any = {};
        data.forEach(p => durations[p.id] = p.months || 1);
        setSelectedMonths(durations);
      }
    };
    fetchPayments();
  }, []);

  const handleApprove = async (payment: any) => {
    const months = selectedMonths[payment.id];
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + months);

    await supabase.from('payments').update({ status: 'APPROVED' }).eq('id', payment.id);
    await supabase.from('profiles').update({ 
      subscription_status: 'ACTIVE',
      expiry_date: expiryDate.toISOString(),
      max_ponds: payment.plan_id === 6 ? 999 : payment.plan_id
    }).eq('id', payment.user_id);

    alert('অ্যাকাউন্ট একটিভ হয়েছে!');
    setPayments(payments.filter(p => p.id !== payment.id));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Hind_Siliguri']">
      <nav className="bg-slate-900 text-white p-6 flex justify-between items-center shadow-xl">
        <h1 className="text-xl font-black">অ্যাডমিন কন্ট্রোল</h1>
        <button onClick={onLogout} className="text-xs font-bold text-rose-400">লগআউট</button>
      </nav>
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <h2 className="text-2xl font-black text-slate-800 mb-8">পেন্ডিং পেমেন্ট তালিকা</h2>
        {payments.map(p => (
          <div key={p.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <h3 className="text-lg font-black text-slate-800">{p.profiles.farm_name} ({p.profiles.email})</h3>
              <p className="font-mono text-blue-600 font-bold text-lg uppercase mt-1">TrxID: {p.trx_id}</p>
              <p className="text-xs text-slate-400 font-bold">প্যাকেজ: {p.plan_id} পুকুর | রিকোয়েস্ট মেয়াদ: {p.months} মাস</p>
            </div>
            <div className="w-full md:w-auto flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
               <label className="text-[10px] font-black text-slate-400 uppercase">অনুমোদন মেয়াদ</label>
               <select value={selectedMonths[p.id]} onChange={e => setSelectedMonths({...selectedMonths, [p.id]: Number(e.target.value)})} className="bg-white border-none rounded-xl px-4 py-2 font-bold outline-none shadow-sm">
                  {[1, 2, 3, 4, 5, 6, 12].map(m => <option key={m} value={m}>{m} মাস</option>)}
               </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => handleApprove(p)} className="bg-green-600 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-green-100 hover:scale-105 transition-transform">অ্যাপ্রুভ</button>
              <button className="bg-rose-50 text-rose-600 px-6 py-3.5 rounded-2xl font-black">বাতিল</button>
            </div>
          </div>
        ))}
        {payments.length === 0 && <div className="text-center py-20 text-slate-400 font-bold italic">কোন পেন্ডিং পেমেন্ট নেই</div>}
      </div>
    </div>
  );
};

export default AdminDashboard;
