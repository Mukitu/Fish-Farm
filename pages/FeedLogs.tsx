
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
      const [pondRes, invRes, logRes] = await Promise.all([
        supabase.from('ponds').select('*').eq('user_id', user.id),
        supabase.from('inventory').select('*').eq('user_id', user.id).eq('type', 'খাবার'),
        supabase.from('feed_logs')
          .select('*, ponds(name), inventory(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (pondRes.data) setPonds(pondRes.data);
      if (invRes.data) setInventory(invRes.data);
      if (logRes.data) setLogs(logRes.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    const applyAmount = parseFloat(newLog.amount);
    const selectedFeed = inventory.find(i => i.id === newLog.inventory_id);

    if (!newLog.pond_id || !newLog.inventory_id || isNaN(applyAmount)) {
      alert("⚠️ পুকুর ও খাবার নির্বাচন করুন!");
      return;
    }

    if (!selectedFeed || Number(selectedFeed.quantity) < applyAmount) {
      alert(`⚠️ পর্যাপ্ত মজুদ নেই! আছে: ${selectedFeed?.quantity || 0} kg`);
      return;
    }

    setSaving(true);
    try {
      // খাবার প্রয়োগ রেকর্ড
      const { error: logError } = await supabase.from('feed_logs').insert([{
        user_id: user.id,
        pond_id: newLog.pond_id,
        inventory_id: newLog.inventory_id,
        amount: applyAmount,
        time: newLog.time,
        date: new Date().toISOString().split('T')[0]
      }]);
      if (logError) throw logError;

      // ইনভেন্টরি স্টক আপডেট
      await supabase.from('inventory')
        .update({ quantity: Number(selectedFeed.quantity) - applyAmount })
        .eq('id', newLog.inventory_id);

      setIsModalOpen(false);
      setNewLog({ pond_id: '', inventory_id: '', amount: '', time: 'সকাল' });
      await fetchData();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-800">খাবার প্রয়োগ</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-3xl font-black shadow-xl">➕ খাবার প্রদান</button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-6">তারিখ</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">খাবার</th>
              <th className="px-8 py-6">পরিমাণ</th>
              <th className="px-8 py-6 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition">
                <td className="px-8 py-6 font-bold text-xs">{new Date(log.date).toLocaleDateString('bn-BD')} | {log.time}</td>
                <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name || 'অজানা'}</td>
                <td className="px-8 py-6">{log.inventory?.name || 'অজানা'}</td>
                <td className="px-8 py-6 font-black text-blue-600">{log.amount} kg</td>
                <td className="px-8 py-6 text-center">
                   <button onClick={async () => {if(confirm('মুছবেন?')) {await supabase.from('feed_logs').delete().eq('id', log.id); fetchData();}}} className="text-rose-300">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6">
            <h3 className="text-2xl font-black text-center">খাবার প্রদানের তথ্য</h3>
            <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100">
              <option value="">পুকুর বেছে নিন</option>
              {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={newLog.inventory_id} onChange={e => setNewLog({...newLog, inventory_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100">
              <option value="">খাবার বেছে নিন</option>
              {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (মজুদ: {i.quantity} kg)</option>)}
            </select>
            <input type="number" placeholder="পরিমাণ (কেজি)" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-center" />
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">প্রয়োগ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedLogsPage;
