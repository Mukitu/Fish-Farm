
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, InventoryItem, Pond } from '../types';

const FeedLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newLog, setNewLog] = useState({ 
    pond_id: '', 
    inventory_id: '', 
    amount: '', 
    time: 'সকাল' 
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch user's data with proper filtering
      const [pondRes, invRes, logRes] = await Promise.all([
        supabase.from('ponds').select('*').eq('user_id', user.id),
        supabase.from('inventory').select('*').eq('user_id', user.id).eq('type', 'খাবার'),
        supabase.from('feed_logs')
          .select('*, ponds(name), inventory(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (pondRes.data) setPonds(pondRes.data as Pond[]);
      if (invRes.data) setInventory(invRes.data as InventoryItem[]);
      if (logRes.data) setLogs(logRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const applyAmount = parseFloat(newLog.amount);
    const selectedFeed = inventory.find(i => i.id === newLog.inventory_id);

    if (!newLog.pond_id || !newLog.inventory_id || isNaN(applyAmount)) {
      alert("⚠️ পুকুর, খাবার এবং সঠিক পরিমাণ নির্বাচন করুন!");
      return;
    }

    if (!selectedFeed || Number(selectedFeed.quantity) < applyAmount) {
      alert(`⚠️ পর্যাপ্ত মজুদ নেই! আপনার গুদামে মাত্র ${selectedFeed?.quantity || 0} কেজি খাবার আছে।`);
      return;
    }

    setSaving(true);
    try {
      // ১. খাবার প্রয়োগ রেকর্ড
      const { error: logError } = await supabase.from('feed_logs').insert([{
        user_id: user.id,
        pond_id: newLog.pond_id,
        inventory_id: newLog.inventory_id,
        amount: applyAmount,
        time: newLog.time,
        date: new Date().toISOString().split('T')[0]
      }]);

      if (logError) throw logError;

      // ২. ইনভেন্টরি স্টক আপডেট
      const { error: invError } = await supabase.from('inventory')
        .update({ quantity: Number(selectedFeed.quantity) - applyAmount })
        .eq('id', newLog.inventory_id);

      if (invError) throw invError;

      setIsModalOpen(false);
      setNewLog({ pond_id: '', inventory_id: '', amount: '', time: 'সকাল' });
      await fetchData();
      alert("✅ খাবার প্রয়োগ এবং স্টক সফলভাবে আপডেট হয়েছে!");
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই রেকর্ডটি ডিলিট করতে চান? মনে রাখবেন, এটি ডিলিট করলে স্টক স্বয়ংক্রিয়ভাবে ফেরত আসবে না।')) {
      const { error } = await supabase.from('feed_logs').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">খাবার প্রয়োগ লগ</h1>
          <p className="text-slate-500 font-bold">প্রতিদিনের খাবার প্রদানের হিসাব</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black shadow-xl shadow-blue-100 hover:scale-105 transition-all">➕ খাবার প্রদান করুন</button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ ও সময়</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">খাবার</th>
                <th className="px-8 py-6">পরিমাণ</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 font-black text-blue-600 animate-pulse">লোড হচ্ছে...</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 font-bold text-xs text-slate-400">
                    {new Date(log.date).toLocaleDateString('bn-BD')} | {log.time}
                  </td>
                  <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6 font-medium">{log.inventory?.name || 'অজানা'}</td>
                  <td className="px-8 py-6 font-black text-blue-600">{log.amount} কেজি</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(log.id)} className="text-rose-200 hover:text-rose-600 p-2 transition-colors">🗑️</button>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-20 text-slate-300 italic">কোনো প্রয়োগ রেকর্ড পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">খাবার প্রদানের তথ্য</h3>
            <div className="space-y-4">
              <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-200">
                <option value="">পুকুর বেছে নিন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={newLog.inventory_id} onChange={e => setNewLog({...newLog, inventory_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-200">
                <option value="">গুদাম থেকে খাবার বেছে নিন</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (মজুদ: {i.quantity} kg)</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <select value={newLog.time} onChange={e => setNewLog({...newLog, time: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-200">
                  <option value="সকাল">সকাল</option>
                  <option value="দুপুর">দুপুর</option>
                  <option value="বিকাল">বিকাল</option>
                  <option value="রাত">রাত</option>
                </select>
                <input type="number" step="0.1" placeholder="পরিমাণ (কেজি)" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-center text-xl border-none outline-none ring-1 ring-slate-200" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">
                {saving ? 'সেভ হচ্ছে...' : 'প্রয়োগ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedLogsPage;
