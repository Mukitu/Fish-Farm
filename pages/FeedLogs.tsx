
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
  
  const [suggestion, setSuggestion] = useState<{kg: number, bags: number} | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // ১. পুকুর ও স্টক রেকর্ড
      const { data: p } = await supabase.from('ponds').select(`*, stocking_records(*)`);
      
      // ২. ফিড লগসমূহ
      const { data: l } = await supabase.from('feed_logs')
        .select('*, ponds(name), inventory(name)')
        .order('created_at', { ascending: false });

      // ৩. গুদাম থেকে খাবারের তালিকা
      const { data: inv } = await supabase.from('inventory')
        .select('*')
        .eq('type', 'খাবার');
      
      if (p) {
        const processed = p.map(pond => {
          const totalW = pond.stocking_records?.reduce((a:any, b:any) => a + Number(b.total_weight_kg), 0) || 0;
          return { ...pond, biomass: totalW };
        });
        setPonds(processed);
      }
      if (l) setLogs(l);
      if (inv) setInventory(inv as InventoryItem[]);
    } catch (err: any) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // স্মার্ট সাজেশান লজিক
  useEffect(() => {
    if (newLog.pond_id) {
      const p = ponds.find(p => p.id === newLog.pond_id);
      if (p && p.biomass > 0) {
        const dailyKg = p.biomass * 0.03; 
        setSuggestion({ kg: dailyKg, bags: dailyKg / 25 });
      } else {
        setSuggestion(null);
      }
    }
  }, [newLog.pond_id, ponds]);

  const handleAdd = async () => {
    if (!newLog.pond_id || !newLog.inventory_id || !newLog.amount) {
      alert("অনুগ্রহ করে পুকুর, খাবার এবং সঠিক পরিমাণ দিন!");
      return;
    }
    
    const applyAmount = parseFloat(newLog.amount);
    const selectedFeed = inventory.find(i => i.id === newLog.inventory_id);

    if (!selectedFeed || selectedFeed.quantity < applyAmount) {
      alert(`⚠️ দুঃখিত! গুদামে পর্যাপ্ত খাবার নেই। বর্তমান মজুদ: ${selectedFeed?.quantity || 0} ${selectedFeed?.unit}`);
      return;
    }

    setSaving(true);
    try {
      // ১. খাবার প্রয়োগের লগ ইনসার্ট করা
      const { error: logError } = await supabase.from('feed_logs').insert([{
        user_id: user.id,
        pond_id: newLog.pond_id,
        inventory_id: newLog.inventory_id,
        feed_item: selectedFeed.name, // ব্যাকআপের জন্য নাম রাখা হচ্ছে
        amount: applyAmount,
        time: newLog.time,
        date: new Date().toISOString().split('T')[0]
      }]);

      if (logError) throw logError;

      // ২. গুদাম (Inventory) থেকে স্টক বিয়োগ করা
      const newQuantity = selectedFeed.quantity - applyAmount;
      const { error: invError } = await supabase.from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', newLog.inventory_id);

      if (invError) throw invError;

      setIsModalOpen(false);
      setNewLog({ pond_id: '', inventory_id: '', amount: '', time: 'সকাল' });
      await fetchData();
      alert(`✅ সফলভাবে সংরক্ষিত! গুদাম থেকে ${applyAmount} কেজি ${selectedFeed.name} বিয়োগ করা হয়েছে।`);
    } catch (err: any) {
      alert("⚠️ সমস্যা হয়েছে: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (log: any) => {
    if (confirm('আপনি কি এই রেকর্ডটি ডিলিট করতে চান? (এটি ডিলিট করলে স্টক ফেরত যাবে না)')) {
      const { error } = await supabase.from('feed_logs').delete().eq('id', log.id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20 font-['Hind_Siliguri']">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">দৈনিক খাবার প্রয়োগ</h1>
          <p className="text-slate-400 font-bold">গুদাম থেকে স্টক স্বয়ংক্রিয়ভাবে বিয়োগ হবে</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all">➕ খাবার দিন</button>
      </div>

      {loading ? (
        <div className="py-20 text-center font-black text-blue-600 animate-pulse text-xl">লোড হচ্ছে...</div>
      ) : (
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
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
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-300 font-bold italic">কোনো তথ্য নেই।</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black mr-2 uppercase">{log.time}</span>
                    <span className="text-xs text-slate-400 font-bold">{new Date(log.date).toLocaleDateString('bn-BD')}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name}</td>
                  <td className="px-8 py-6 font-bold text-slate-500">{log.inventory?.name || log.feed_item}</td>
                  <td className="px-8 py-6 font-black text-blue-600">{log.amount} কেজি</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handleDelete(log)} className="text-rose-400 hover:text-rose-600 font-black text-xs mr-4">ডিলিট</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl">
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

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">খাবার নির্বাচন (গুদাম থেকে)</label>
                <select 
                  value={newLog.inventory_id} 
                  onChange={e => setNewLog({...newLog, inventory_id: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100"
                >
                  <option value="">খাবার বেছে নিন</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id} disabled={i.quantity <= 0}>
                      {i.name} (মজুদ: {i.quantity} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">সময়</label>
                  <select 
                    value={newLog.time} 
                    onChange={e => setNewLog({...newLog, time: e.target.value})} 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100"
                  >
                    <option value="সকাল">সকাল</option>
                    <option value="দুপুর">দুপুর</option>
                    <option value="বিকাল">বিকাল</option>
                    <option value="রাত">রাত</option>
                  </select>
                </div>
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

              <div className="space-y-1 text-center">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">খাবারের পরিমাণ (কেজি)</label>
                <input 
                  type="number" 
                  step="0.1"
                  placeholder="0.0" 
                  value={newLog.amount} 
                  onChange={e => setNewLog({...newLog, amount: e.target.value})} 
                  className="w-full px-6 py-6 bg-slate-50 rounded-[2rem] font-black outline-none border-none text-blue-600 text-4xl text-center focus:ring-4 focus:ring-blue-100 transition-all" 
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
