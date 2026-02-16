
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, InventoryItem, Pond } from '../types';

const FeedLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterPond, setFilterPond] = useState('all');
  
  const [newLog, setNewLog] = useState({ 
    pond_id: '', 
    inventory_id: '', 
    amount: '', 
    time: 'সকাল' 
  });

  const [recommendation, setRecommendation] = useState<number | null>(null);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // পুকুর এবং তাদের ডাটা আনা
      const { data: pData } = await supabase.from('ponds')
        .select(`*, stocking_records(*), growth_records(*)`)
        .eq('user_id', user.id);
      
      // খাবার ইনভেন্টরি আনা
      const { data: iData } = await supabase.from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'খাবার');

      // খাবার প্রয়োগের ইতিহাস আনা
      const { data: lData, error: lError } = await supabase.from('feed_logs')
        .select(`
          *,
          ponds ( name ),
          inventory ( name )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (lError) console.error("Log Fetch Error:", lError);

      if (pData) setPonds(pData);
      if (iData) setInventory(iData as InventoryItem[]);
      if (lData) setLogs(lData);
    } catch (err) { 
      console.error("Fetch Error:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePondChange = (pondId: string) => {
    setNewLog({ ...newLog, pond_id: pondId });
    if (!pondId) {
      setRecommendation(null);
      return;
    }

    const pond = ponds.find(p => p.id === pondId);
    if (pond) {
      // মাছের মোট সংখ্যা
      const totalCount = pond.stocking_records?.reduce((a: any, b: any) => a + Number(b.count), 0) || 0;
      
      // সর্বশেষ গড় ওজন (Growth Records থেকে অথবা Stocking থেকে)
      const sortedGrowth = pond.growth_records?.sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestGrowth = sortedGrowth?.[0];
      
      const avgWeight = latestGrowth ? latestGrowth.avg_weight_gm : (pond.stocking_records?.[0]?.avg_weight_gm || 0);
      
      if (totalCount > 0 && avgWeight > 0) {
        // বায়োমাস ক্যালকুলেশন (মাছের মোট ওজন কেজি তে)
        const biomassKg = (totalCount * avgWeight) / 1000;
        // ৩% খাবার পরামর্শ
        const recAmount = biomassKg * 0.03;
        setRecommendation(parseFloat(recAmount.toFixed(2)));
      } else {
        setRecommendation(null);
      }
    }
  };

  const handleAdd = async () => {
    const applyAmount = parseFloat(newLog.amount);
    if (!newLog.pond_id || !newLog.inventory_id || isNaN(applyAmount)) {
      alert("⚠️ পুকুর, খাবার এবং সঠিক পরিমাণ নির্বাচন করুন!");
      return;
    }

    const selectedFeed = inventory.find(i => i.id === newLog.inventory_id);
    if (!selectedFeed || Number(selectedFeed.quantity) < applyAmount) {
      alert(`⚠️ পর্যাপ্ত মজুদ নেই! গুদামে আছে: ${selectedFeed?.quantity || 0} কেজি`);
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

      // ইনভেন্টরি থেকে পরিমাণ কমানো
      await supabase.from('inventory')
        .update({ quantity: Number(selectedFeed.quantity) - applyAmount })
        .eq('id', newLog.inventory_id);

      setIsModalOpen(false);
      setNewLog({ pond_id: '', inventory_id: '', amount: '', time: 'সকাল' });
      setRecommendation(null);
      
      // ডাটা রিফ্রেশ করা
      await fetchData();
      alert("✅ খাবার প্রয়োগ সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) { 
      alert("Error: " + err.message); 
    } finally { 
      setSaving(false); 
    }
  };

  const filteredLogs = filterPond === 'all' ? logs : logs.filter(l => l.pond_id === filterPond);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">খাবার প্রয়োগ লগ</h1>
          <p className="text-slate-500 font-bold">প্রতিদিনের খাবার প্রদানের সঠিক হিসাব</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-3xl font-black shadow-xl hover:scale-105 transition-all">➕ নতুন এন্ট্রি</button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">পুকুর অনুযায়ী ফিল্টার:</span>
        <select 
          value={filterPond} 
          onChange={e => setFilterPond(e.target.value)}
          className="bg-slate-50 border-none rounded-xl font-bold px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">সব পুকুর</option>
          {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
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
              <tr><td colSpan={5} className="text-center py-20 font-bold animate-pulse text-blue-600">লোড হচ্ছে...</td></tr>
            ) : filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition group">
                <td className="px-8 py-6 font-bold text-xs">{new Date(log.date).toLocaleDateString('bn-BD')} | {log.time}</td>
                <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name || 'অজানা'}</td>
                <td className="px-8 py-6 text-slate-500 font-bold">{log.inventory?.name || 'অজানা'}</td>
                <td className="px-8 py-6 font-black text-blue-600">{log.amount} কেজি</td>
                <td className="px-8 py-6 text-center">
                   <button onClick={async () => {if(confirm('মুছবেন?')) {await supabase.from('feed_logs').delete().eq('id', log.id); fetchData();}}} className="text-rose-200 group-hover:text-rose-500 transition-colors">🗑️</button>
                </td>
              </tr>
            ))}
            {!loading && filteredLogs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-24 text-slate-300 italic font-bold">কোনো রেকর্ড পাওয়া যায়নি। পেমেন্ট বা পুকুর চেক করুন।</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-center text-slate-800">খাবার প্রয়োগ করুন</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পুকুর নির্বাচন</label>
                <select value={newLog.pond_id} onChange={e => handlePondChange(e.target.value)} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 transition-all">
                  <option value="">পুকুর বেছে নিন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {recommendation !== null && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
                   <p className="text-xs font-black text-blue-600 uppercase mb-1">প্রয়োজনীয় খাবারের পরিমাণ (পরামর্শ)</p>
                   <p className="text-xl font-black text-blue-800">প্রায় {recommendation} কেজি</p>
                   <button 
                     onClick={() => setNewLog({...newLog, amount: recommendation.toString()})}
                     className="text-[10px] font-black text-blue-500 underline mt-1 hover:text-blue-700"
                   >
                     অটো ফিল করুন
                   </button>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">খাবার নির্বাচন (গুদাম থেকে)</label>
                <select value={newLog.inventory_id} onChange={e => setNewLog({...newLog, inventory_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100">
                  <option value="">খাবার বেছে নিন</option>
                  {inventory.map(i => <option key={i.id} value={i.id}>{i.name} (মজুদ: {i.quantity} kg)</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পরিমাণ (কেজি)</label>
                <input type="number" step="0.1" placeholder="০.০০" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-center text-xl focus:ring-2 focus:ring-blue-600" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">সময়</label>
                <select value={newLog.time} onChange={e => setNewLog({...newLog, time: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100">
                  <option value="সকাল">সকাল</option>
                  <option value="দুপুর">দুপুর</option>
                  <option value="বিকাল">বিকাল</option>
                  <option value="রাত">রাত</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-400 hover:text-slate-600 transition-colors">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                {saving ? 'প্রসেস হচ্ছে...' : 'প্রয়োগ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedLogsPage;
