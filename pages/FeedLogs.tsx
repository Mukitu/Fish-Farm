
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const FeedLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({ pond_id: '', feed_item: '', amount: '', time: 'সকাল' });
  const [suggestion, setSuggestion] = useState<number | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: p } = await supabase.from('ponds').select(`*, stocking_records(*)`);
    const { data: l } = await supabase.from('feed_logs').select('*, ponds(name)').order('created_at', { ascending: false });
    
    if (p) {
      const processed = p.map(pond => {
        const totalW = pond.stocking_records?.reduce((a:any, b:any) => a + Number(b.total_weight_kg), 0) || 0;
        return { ...pond, biomass: totalW };
      });
      setPonds(processed);
    }
    if (l) setLogs(l);
    setLoading(false);
  };

  useEffect(() => {
    if (newLog.pond_id) {
      const p = ponds.find(p => p.id === newLog.pond_id);
      if (p) setSuggestion(p.biomass * 0.03); // 3% of biomass rule for standard feeding
    }
  }, [newLog.pond_id, ponds]);

  const handleAdd = async () => {
    if (!newLog.pond_id || !newLog.amount) return;
    const { data: authUser } = await supabase.auth.getUser();
    await supabase.from('feed_logs').insert([{
      user_id: authUser.user?.id,
      pond_id: newLog.pond_id,
      feed_item: newLog.feed_item,
      amount: parseFloat(newLog.amount),
      time: newLog.time
    }]);
    setIsModalOpen(false);
    setNewLog({ pond_id: '', feed_item: '', amount: '', time: 'সকাল' });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('রেকর্ডটি ডিলিট করতে চান?')) {
      await supabase.from('feed_logs').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">দৈনিক খাবার প্রয়োগ</h1>
          <p className="text-slate-400 font-bold">মাছের ওজনের সাথে সমন্বয় করে খাবার দিন</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">➕ খাবার দিন</button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-6">সময়</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">পরিমাণ (কেজি)</th>
              <th className="px-8 py-6 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map(log => (
              <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6"><span className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">{log.time}</span></td>
                <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name}</td>
                <td className="px-8 py-6 font-black text-blue-600">{log.amount} কেজি</td>
                <td className="px-8 py-6 text-center">
                  <button onClick={() => handleDelete(log.id)} className="text-slate-300 hover:text-rose-600 p-2">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">খাবারের এন্ট্রি</h3>
            <div className="space-y-5">
              <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none border-none">
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name} (বায়োমাস: {p.biomass}kg)</option>)}
              </select>
              <div className="relative">
                <input type="number" placeholder="পরিমাণ (কেজি)" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black outline-none border-none text-blue-600 text-xl" />
                {suggestion && (
                  <p className="absolute -bottom-6 left-2 text-[10px] font-black text-blue-400 uppercase">স্মার্ট সাজেশান: প্রতিদিন {suggestion.toFixed(2)} কেজি</p>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black">সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedLogsPage;
