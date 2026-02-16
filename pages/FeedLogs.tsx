
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const FeedLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({ pond_id: '', feed_item: '', amount: '', time: 'সকাল' });
  const [suggestion, setSuggestion] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
      if (p) setSuggestion(p.biomass * 0.03); // 3% rule
    }
  }, [newLog.pond_id]);

  const handleAdd = async () => {
    if (!newLog.pond_id || !newLog.amount) return;
    const { error, data } = await supabase.from('feed_logs').insert([{
      user_id: user.id,
      pond_id: newLog.pond_id,
      feed_item: newLog.feed_item,
      amount: parseFloat(newLog.amount),
      time: newLog.time
    }]).select('*, ponds(name)');

    if (!error && data) {
      setLogs([data[0], ...logs]);
      setIsModalOpen(false);
      setNewLog({ pond_id: '', feed_item: '', amount: '', time: 'সকাল' });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই রেকর্ডটি মুছতে চান?')) {
      const { error } = await supabase.from('feed_logs').delete().eq('id', id);
      if (!error) setLogs(logs.filter(l => l.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">দৈনিক খাবার প্রয়োগ</h1>
          <p className="text-slate-400 font-bold">আপনার পুকুরের বায়োমাস অনুযায়ী খাবার ট্র্যাকিং</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100">➕ খাবার দিন</button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-6">সময়</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">খাবারের নাম</th>
              <th className="px-8 py-6 text-right">পরিমাণ (কেজি)</th>
              <th className="px-8 py-6 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs.map(log => (
              <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-8 py-6">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase ${log.time === 'সকাল' ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    {log.time}
                  </span>
                </td>
                <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name}</td>
                <td className="px-8 py-6 text-slate-500 font-bold">{log.feed_item || 'মাছের খাবার'}</td>
                <td className="px-8 py-6 text-right font-black text-blue-600">{log.amount} কেজি</td>
                <td className="px-8 py-6 text-center">
                  <button onClick={() => handleDelete(log.id)} className="text-rose-200 hover:text-rose-600 transition p-2 bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">খাবার প্রদানের এন্ট্রি</h3>
            <div className="space-y-5">
              <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name} (বায়োমাস: {p.biomass}kg)</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                 <select value={newLog.time} onChange={e => setNewLog({...newLog, time: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none">
                    <option value="সকাল">সকাল</option>
                    <option value="দুপুর">দুপুর</option>
                    <option value="বিকাল">বিকাল</option>
                    <option value="রাত">রাত</option>
                 </select>
                 <input type="text" placeholder="খাবারের নাম" value={newLog.feed_item} onChange={e => setNewLog({...newLog, feed_item: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" />
              </div>
              <div className="relative">
                <input type="number" placeholder="পরিমাণ (কেজি)" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black outline-none border-none text-blue-600 text-xl" />
                {suggestion && (
                  <p className="absolute -bottom-6 left-2 text-[10px] font-black text-blue-400 uppercase">স্মার্ট সাজেশান: {suggestion.toFixed(2)} কেজি (দৈনিক মোট)</p>
                )}
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedLogsPage;
