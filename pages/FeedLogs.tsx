
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const FeedLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newLog, setNewLog] = useState({ pond_id: '', feed_item: 'সাধারণ খাবার', amount: '', time: 'সকাল' });
  const [suggestion, setSuggestion] = useState<{kg: number, bags: number} | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // স্টক রেকর্ড সহ পুকুরের ডাটা ফেচ করা
      const { data: p, error: pErr } = await supabase.from('ponds').select(`*, stocking_records(*)`);
      if (pErr) throw pErr;

      const { data: l, error: lErr } = await supabase.from('feed_logs').select('*, ponds(name)').order('created_at', { ascending: false });
      if (lErr) throw lErr;
      
      if (p) {
        const processed = p.map(pond => {
          const totalW = pond.stocking_records?.reduce((a:any, b:any) => a + Number(b.total_weight_kg), 0) || 0;
          return { ...pond, biomass: totalW };
        });
        setPonds(processed);
      }
      if (l) setLogs(l);
    } catch (err: any) {
      console.error("Fetch error:", err);
      alert("ডাটা লোড করা যাচ্ছে না: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newLog.pond_id) {
      const p = ponds.find(p => p.id === newLog.pond_id);
      if (p && p.biomass > 0) {
        const dailyKg = p.biomass * 0.03; 
        setSuggestion({
          kg: dailyKg,
          bags: dailyKg / 25 
        });
      } else {
        setSuggestion(null);
      }
    }
  }, [newLog.pond_id, ponds]);

  const handleAdd = async () => {
    if (!newLog.pond_id || !newLog.amount) {
      alert("অনুগ্রহ করে পুকুর এবং খাবারের পরিমাণ দিন!");
      return;
    }
    
    setSaving(true);
    try {
      // ডাটাবেজে ইনসার্ট করার আগে নিশ্চিত হওয়া যে সঠিক ডাটা যাচ্ছে
      const payload = {
        user_id: user.id,
        pond_id: newLog.pond_id,
        feed_item: newLog.feed_item,
        amount: parseFloat(newLog.amount),
        time: newLog.time,
        date: new Date().toISOString().split('T')[0]
      };

      const { error } = await supabase.from('feed_logs').insert([payload]);

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      setIsModalOpen(false);
      setNewLog({ pond_id: '', feed_item: 'সাধারণ খাবার', amount: '', time: 'সকাল' });
      await fetchData();
      alert("✅ খাবার প্রয়োগের তথ্য সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      console.error("Save error:", err);
      alert("⚠️ সংরক্ষণ করা যায়নি: " + (err.message || "সার্ভার সমস্যা"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই ফিড রেকর্ডটি ডিলিট করতে চান?')) {
      const { error } = await supabase.from('feed_logs').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20 font-['Hind_Siliguri']">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">দৈনিক খাবার প্রয়োগ</h1>
          <p className="text-slate-400 font-bold">সঠিক ডাটা এন্ট্রি নিশ্চিত করুন</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all">➕ খাবার দিন</button>
      </div>

      {loading ? (
        <div className="py-20 text-center font-black text-blue-600 animate-pulse text-xl">তথ্য লোড হচ্ছে...</div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">সময়</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">পরিমাণ (কেজি)</th>
                <th className="px-8 py-6 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-bold italic">কোনো তথ্য নেই।</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase">{log.time}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name}</td>
                  <td className="px-8 py-6 font-black text-blue-600">{log.amount} কেজি</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handleDelete(log.id)} className="text-rose-400 hover:text-rose-600 font-black text-xs mr-4">ডিলিট</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-800 text-center tracking-tight">খাবার প্রদানের তথ্য</h3>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পুকুর নির্বাচন</label>
                <select 
                  value={newLog.pond_id} 
                  onChange={e => setNewLog({...newLog, pond_id: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100"
                >
                  <option value="">পুকুর বেছে নিন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name} (বায়োমাস: {p.biomass}kg)</option>)}
                </select>
              </div>
              
              {suggestion && (
                <div className="bg-blue-600 p-6 rounded-[2.5rem] text-white space-y-3 shadow-lg shadow-blue-100">
                   <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest text-center">স্মার্ট সাজেশান</p>
                   <div className="flex justify-around items-center">
                      <div className="text-center">
                         <p className="text-3xl font-black">{suggestion.kg.toFixed(2)}</p>
                         <p className="text-[10px] font-bold opacity-70">মোট কেজি</p>
                      </div>
                      <div className="text-center">
                         <p className="text-3xl font-black">{suggestion.bags.toFixed(1)}</p>
                         <p className="text-[10px] font-bold opacity-70">বস্তা (২৫ কেজি)</p>
                      </div>
                   </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-center block text-[10px] font-black text-slate-400 uppercase tracking-widest">আজ কতটুকু দিলেন? (কেজি)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="0.0" 
                  value={newLog.amount} 
                  onChange={e => setNewLog({...newLog, amount: e.target.value})} 
                  className="w-full px-6 py-6 bg-slate-50 rounded-[2rem] font-black outline-none border-none text-blue-600 text-3xl text-center focus:ring-4 focus:ring-blue-100 transition-all" 
                />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black"
              >
                বাতিল
              </button>
              <button 
                onClick={handleAdd} 
                disabled={saving}
                className={`flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedLogsPage;
