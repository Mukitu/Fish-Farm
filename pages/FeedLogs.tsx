
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, InventoryItem } from '../types';

const FeedLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
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
      const { data: p } = await supabase.from('ponds').select(`*, stocking_records(*)`);
      const { data: inv } = await supabase.from('inventory').select('*').eq('type', 'খাবার');
      const { data: l } = await supabase.from('feed_logs')
        .select('*, ponds(name), inventory(name)')
        .order('created_at', { ascending: false });

      if (p) setPonds(p.map(pond => ({ ...pond, biomass: pond.stocking_records?.reduce((a:any, b:any) => a + Number(b.total_weight_kg), 0) || 0 })));
      if (inv) setInventory(inv as InventoryItem[]);
      if (l) setLogs(l);
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
      alert("তথ্যগুলো সঠিকভাবে দিন!");
      return;
    }

    if (!selectedFeed || Number(selectedFeed.quantity) < applyAmount) {
      alert(`⚠️ পর্যাপ্ত মজুদ নেই! (মজুদ: ${selectedFeed?.quantity || 0} কেজি)`);
      return;
    }

    setSaving(true);
    try {
      // ১. ফিড লগ এন্ট্রি
      const { error: logError } = await supabase.from('feed_logs').insert([{
        user_id: user.id,
        pond_id: newLog.pond_id,
        inventory_id: newLog.inventory_id,
        amount: applyAmount,
        time: newLog.time,
        date: new Date().toISOString().split('T')[0]
      }]);

      if (logError) throw logError;

      // ২. স্টক বিয়োগ (UPDATE)
      const { error: invError } = await supabase.from('inventory')
        .update({ quantity: Number(selectedFeed.quantity) - applyAmount })
        .eq('id', newLog.inventory_id);

      if (invError) throw invError;

      setIsModalOpen(false);
      setNewLog({ pond_id: '', inventory_id: '', amount: '', time: 'সকাল' });
      await fetchData();
      alert("✅ খাবার প্রয়োগ সফল! স্টক আপডেট হয়েছে।");
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (log: any) => {
    if (confirm('ডিলিট করলে স্টক ফেরত যাবে না। ডিলিট করবেন?')) {
      const { error } = await supabase.from('feed_logs').delete().eq('id', log.id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">দৈনিক খাবার প্রয়োগ</h1>
          <p className="text-slate-400 font-bold">স্টক স্বয়ংক্রিয়ভাবে বিয়োগ হবে</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">➕ খাবার দিন</button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-6">সময় ও তারিখ</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">খাবারের নাম</th>
              <th className="px-8 py-6">পরিমাণ (কেজি)</th>
              <th className="px-8 py-6 text-right">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition">
                <td className="px-8 py-6">
                  <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-[10px] font-black mr-2 uppercase">{log.time}</span>
                  <span className="text-xs text-slate-400 font-bold">{new Date(log.date).toLocaleDateString('bn-BD')}</span>
                </td>
                <td className="px-8 py-6 font-black">{log.ponds?.name}</td>
                <td className="px-8 py-6 font-bold">{log.inventory?.name || 'অজানা'}</td>
                <td className="px-8 py-6 font-black text-blue-600">{log.amount} কেজি</td>
                <td className="px-8 py-6 text-right">
                  <button onClick={() => handleDelete(log)} className="text-rose-400 font-black text-xs">ডিলিট</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 text-center tracking-tight">খাবার প্রয়োগ</h3>
            <div className="space-y-5">
              <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none">
                <option value="">পুকুর বেছে নিন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name} (বায়োমাস: {p.biomass}kg)</option>)}
              </select>
              <select value={newLog.inventory_id} onChange={e => setNewLog({...newLog, inventory_id: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none">
                <option value="">খাবার বেছে নিন</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (মজুদ: {i.quantity} kg)</option>)}
              </select>
              <select value={newLog.time} onChange={e => setNewLog({...newLog, time: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none">
                <option value="সকাল">সকাল</option>
                <option value="দুপুর">দুপুর</option>
                <option value="বিকাল">বিকাল</option>
              </select>
              <input type="number" step="0.1" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} placeholder="পরিমাণ (কেজি)" className="w-full px-6 py-6 bg-slate-50 rounded-[2rem] font-black text-blue-600 text-4xl text-center outline-none" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl disabled:opacity-50">
                {saving ? 'সেভ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedLogsPage;
