
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
      // Fetch all ponds belonging to this user
      const { data: p } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      // Fetch feed items from inventory
      const { data: inv } = await supabase.from('inventory').select('*').eq('user_id', user.id).eq('type', 'খাবার');
      // Fetch feed logs
      const { data: l } = await supabase.from('feed_logs')
        .select('*, ponds(name), inventory(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (p) setPonds(p as Pond[]);
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
      const { error: logError } = await supabase.from('feed_logs').insert([{
        user_id: user.id,
        pond_id: newLog.pond_id,
        inventory_id: newLog.inventory_id,
        amount: applyAmount,
        time: newLog.time,
        date: new Date().toISOString().split('T')[0]
      }]);

      if (logError) throw logError;

      // Update Stock
      const { error: invError } = await supabase.from('inventory')
        .update({ quantity: Number(selectedFeed.quantity) - applyAmount })
        .eq('id', newLog.inventory_id);

      if (invError) throw invError;

      setIsModalOpen(false);
      setNewLog({ pond_id: '', inventory_id: '', amount: '', time: 'সকাল' });
      await fetchData();
      alert("✅ খাবার প্রয়োগ সফল!");
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই লগটি ডিলিট করতে চান? (বি:দ্র: স্টক ফেরত যাবে না)')) {
      const { error } = await supabase.from('feed_logs').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">খাবার প্রয়োগ</h1>
          <p className="text-slate-400 font-bold">দৈনিক খাবার প্রদানের হিসাব</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">➕ খাবার দিন</button>
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
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 font-bold text-xs">
                    {new Date(log.date).toLocaleDateString('bn-BD')} | {log.time}
                  </td>
                  <td className="px-8 py-6 font-black">{log.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6">{log.inventory?.name || 'অজানা'}</td>
                  <td className="px-8 py-6 font-black text-blue-600">{log.amount} কেজি</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(log.id)} className="text-rose-300 hover:text-rose-600">🗑️</button>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-20 text-slate-300 italic">কোনো রেকর্ড পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 text-center">খাবার প্রয়োগ</h3>
            <div className="space-y-4">
              <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-200">
                <option value="">পুকুর বেছে নিন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={newLog.inventory_id} onChange={e => setNewLog({...newLog, inventory_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-200">
                <option value="">খাবার বেছে নিন</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (মজুদ: {i.quantity} kg)</option>)}
              </select>
              <select value={newLog.time} onChange={e => setNewLog({...newLog, time: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-200">
                <option value="সকাল">সকাল</option>
                <option value="দুপুর">দুপুর</option>
                <option value="বিকাল">বিকাল</option>
              </select>
              <input type="number" step="0.1" placeholder="পরিমাণ (কেজি)" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-center text-2xl border-none outline-none ring-1 ring-slate-200" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">
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
