
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
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (newLog.pond_id) {
      const p = ponds.find(p => p.id === newLog.pond_id);
      if (p && p.biomass > 0) {
        const dailyKg = p.biomass * 0.03; // Standard 3% rule
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
      alert("পুকুর এবং খাবারের পরিমাণ অবশ্যই দিতে হবে!");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.from('feed_logs').insert([{
        user_id: user.id,
        pond_id: newLog.pond_id,
        feed_item: newLog.feed_item,
        amount: parseFloat(newLog.amount),
        time: newLog.time
      }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewLog({ pond_id: '', feed_item: 'সাধারণ খাবার', amount: '', time: 'সকাল' });
      await fetchData();
      alert("খাবার প্রয়োগ সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      alert("সংরক্ষণ করা যায়নি: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই ফিড রেকর্ডটি ডিলিট করতে চান?')) {
      await supabase.from('feed_logs').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20 font-['Hind_Siliguri']">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">দৈনিক খাবার প্রয়োগ</h1>
          <p className="text-slate-400 font-bold">মাছের বর্তমান ওজন অনুযায়ী সঠিক খাবার দিন</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all">➕ খাবার দিন</button>
      </div>

      {loading ? (
        <div className="py-20 text-center font-black text-blue-600 animate-pulse text-xl">ডাটা লোড হচ্ছে...</div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
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
              {logs.length === 0 && (
                <tr><td colSpan={4} className="py-20 text-center text-slate-400 font-bold italic">এখনো কোনো খাবারের তথ্য যোগ করা হয়নি।</td></tr>
              )}
              {logs.map(log => (
                <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider">{log.time}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name}</td>
                  <td className="px-8 py-6 font-black text-blue-600">{log.amount} কেজি</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(log.id)} className="text-rose-400 hover:text-rose-600 transition p-2 bg-rose-50 rounded-xl">🗑️ ডিলিট</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center tracking-tight">খাবার প্রদানের তথ্য</h3>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পুকুর সিলেক্ট করুন</label>
                <select 
                  value={newLog.pond_id} 
                  onChange={e => setNewLog({...newLog, pond_id: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100 focus:ring-blue-600"
                >
                  <option value="">পুকুর নির্বাচন করুন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name} (বায়োমাস: {p.biomass}kg)</option>)}
                </select>
              </div>
              
              {suggestion && (
                <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 space-y-2">
                   <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest text-center">স্মার্ট সাজেশান (Trusted Source)</p>
                   <div className="flex justify-around items-center pt-2">
                      <div className="text-center">
                         <p className="text-2xl font-black text-blue-700">{suggestion.kg.toFixed(2)}</p>
                         <p className="text-[10px] font-bold text-blue-400">মোট কেজি</p>
                      </div>
                      <div className="h-10 w-px bg-blue-200"></div>
                      <div className="text-center">
                         <p className="text-2xl font-black text-blue-700">{suggestion.bags.toFixed(1)}</p>
                         <p className="text-[10px] font-bold text-blue-400">বস্তা (২৫ কেজি)</p>
                      </div>
                   </div>
                   <p className="text-[10px] text-blue-400 text-center italic mt-2">আপনার পুকুরের মাছের ওজনের ৩% হারে খাবার দিন</p>
                </div>
              )}

              <div className="space-y-1 text-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">আজকের খাবারের পরিমাণ (কেজি)</label>
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
                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-colors"
              >
                বাতিল
              </button>
              <button 
                onClick={handleAdd} 
                disabled={saving}
                className={`flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all ${saving ? 'opacity-50' : ''}`}
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
