
import React, { useState, useEffect, useCallback } from 'react';
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
    bags: '',
    time: 'সকাল' 
  });

  const [recommendation, setRecommendation] = useState<{ min: number; max: number } | null>(null);

  const fetchData = useCallback(async () => {
    if (user.id === 'guest-id') {
      const demoPonds = [
        { id: '1', name: 'পুকুর ১ (রুই)' }, 
        { id: '2', name: 'পুকুর ২ (কাতলা)' },
        { id: '3', name: 'পুকুর ৩ (পাঙ্গাস)' },
        { id: '4', name: 'পুকুর ৪ (তেলাপিয়া)' },
        { id: '5', name: 'পুকুর ৫ (কার্প)' }
      ];
      setPonds(demoPonds);
      setInventory([
        { id: 'i1', name: 'নারিশ ফিড (গ্রোয়ার)', quantity: 450, unit: 'কেজি', type: 'খাবার' },
        { id: 'i2', name: 'মেগা ফিড (স্টার্টার)', quantity: 80, unit: 'কেজি', type: 'খাবার' }
      ] as any);
      setLogs([
        { id: 'l1', date: new Date().toISOString(), time: 'সকাল', amount: 25, bags: 0.5, ponds: { name: 'পুকুর ১ (রুই)' }, inventory: { name: 'নারিশ ফিড (গ্রোয়ার)' } },
        { id: 'l2', date: new Date().toISOString(), time: 'বিকাল', amount: 30, bags: 0.6, ponds: { name: 'পুকুর ৩ (পাঙ্গাস)' }, inventory: { name: 'মেগা ফিড (স্টার্টার)' } },
        { id: 'l3', date: new Date().toISOString(), time: 'সকাল', amount: 15, bags: 0.3, ponds: { name: 'পুকুর ২ (কাতলা)' }, inventory: { name: 'নারিশ ফিড (গ্রোয়ার)' } }
      ]);
      setLoading(false);
      return;
    }
    if (!user?.id) return;
    setLoading(true);
    try {
      // ১. পুকুর লিস্ট আনা
      const { data: pData, error: pError } = await supabase
        .from('ponds')
        .select('*')
        .eq('user_id', user.id);
      
      if (pError) throw pError;
      setPonds(pData || []);

      // ২. খাবার ইনভেন্টরি আনা
      const { data: iData, error: iError } = await supabase
        .from('inventory')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'খাবার');

      if (iError) throw iError;
      setInventory(iData as InventoryItem[] || []);

      // ৩. ফিড লগ (ইতিহাস) আনা - এখানে !inventory_id দিয়ে নির্দিষ্ট করা হয়েছে
      const { data: lData, error: lError } = await supabase
        .from('feed_logs')
        .select(`
          *,
          ponds ( name ),
          inventory!inventory_id ( name )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (lError) throw lError;
      setLogs(lData || []);

    } catch (err: any) { 
      console.error("Fetch Error Detail:", err);
      // ইউজার ফ্রেন্ডলি মেসেজ
      if (err.message.includes('relationship')) {
        alert("ডাটাবেজ রিলেশনশিপে সমস্যা। দয়া করে SQL Editor এ দেওয়া কোডটি রান করুন।");
      } else {
        alert("ডাটা আনতে সমস্যা হয়েছে: " + err.message);
      }
    } finally { 
      setLoading(false); 
    }
  }, [user.id]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  const handlePondChange = async (pondId: string) => {
    setNewLog(prev => ({ ...prev, pond_id: pondId }));
    if (!pondId) {
      setRecommendation(null);
      return;
    }

    try {
      const { data: pondDetail } = await supabase
        .from('ponds')
        .select(`*, stocking_records(*), growth_records(*)`)
        .eq('id', pondId)
        .single();

      if (pondDetail) {
        const totalCount = pondDetail.stocking_records?.reduce((a: any, b: any) => a + Number(b.count), 0) || 0;
        const sortedGrowth = pondDetail.growth_records?.sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const latestWeight = sortedGrowth?.[0]?.avg_weight_gm || pondDetail.stocking_records?.[0]?.avg_weight_gm || 0;
        
        if (totalCount > 0 && latestWeight > 0) {
          const biomassKg = (totalCount * latestWeight) / 1000;
          const recMin = biomassKg * 0.025;
          const recMax = biomassKg * 0.03;
          setRecommendation({ 
            min: parseFloat(recMin.toFixed(2)), 
            max: parseFloat(recMax.toFixed(2)) 
          });
        } else {
          setRecommendation(null);
        }
      }
    } catch (e) {
      setRecommendation(null);
    }
  };

  const handleAdd = async () => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    const applyAmount = parseFloat(newLog.amount);
    const applyBags = parseFloat(newLog.bags || '0');

    if (!newLog.pond_id || !newLog.inventory_id || isNaN(applyAmount)) {
      alert("⚠️ পুকুর, খাবার এবং পরিমাণ সঠিকভাবে পূরণ করুন!");
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
        bags: applyBags,
        time: newLog.time,
        date: new Date().toISOString().split('T')[0]
      }]);

      if (logError) throw logError;

      const { error: invError } = await supabase.from('inventory')
        .update({ quantity: Number(selectedFeed.quantity) - applyAmount })
        .eq('id', newLog.inventory_id);
      
      if (invError) throw invError;

      setIsModalOpen(false);
      setNewLog({ pond_id: '', inventory_id: '', amount: '', bags: '', time: 'সকাল' });
      setRecommendation(null);
      
      await fetchData();
      alert("✅ খাবার প্রয়োগ সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) { 
      alert("ত্রুটি: " + err.message); 
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
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="px-8 py-4 bg-blue-600 text-white rounded-3xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all"
        >
          ➕ নতুন এন্ট্রি
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">ফিল্টার:</span>
        <select 
          value={filterPond} 
          onChange={e => setFilterPond(e.target.value)}
          className="bg-slate-50 border-none rounded-xl font-bold px-4 py-2 outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">সব পুকুর</option>
          {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button 
          onClick={fetchData} 
          className="ml-auto w-10 h-10 flex items-center justify-center bg-slate-100 rounded-xl hover:bg-blue-100 transition-colors"
          title="রিফ্রেশ করুন"
        >
          🔄
        </button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-6">তারিখ ও সময়</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">খাবার</th>
              <th className="px-8 py-6 text-center">পরিমাণ</th>
              <th className="px-8 py-6 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-20 font-bold animate-pulse text-blue-600">লোড হচ্ছে...</td></tr>
            ) : filteredLogs.map(log => (
              <tr key={log.id} className="hover:bg-slate-50 transition group">
                <td className="px-8 py-6 font-bold text-xs">
                  <span className="block text-slate-800">{new Date(log.date).toLocaleDateString('bn-BD')}</span>
                  <span className="text-blue-500 text-[10px] font-black uppercase">{log.time}</span>
                </td>
                <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name || 'অজানা'}</td>
                <td className="px-8 py-6 text-slate-500 font-bold">{log.inventory?.name || 'অজানা'}</td>
                <td className="px-8 py-6 text-center">
                   <div className="font-black text-blue-600">{log.amount} কেজি</div>
                   {log.bags > 0 && <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{log.bags} বস্তা</div>}
                </td>
                <td className="px-8 py-6 text-center">
                   <button 
                     onClick={async () => { if(confirm('ডিলিট করবেন?')) { await supabase.from('feed_logs').delete().eq('id', log.id); fetchData(); } }} 
                     className="text-rose-200 group-hover:text-rose-500 transition-colors text-xl"
                   >
                     🗑️
                   </button>
                </td>
              </tr>
            ))}
            {!loading && filteredLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-32">
                  <p className="text-4xl mb-4">📂</p>
                  <p className="text-slate-400 font-bold italic">কোনো রেকর্ড পাওয়া যায়নি। পেমেন্ট বা পুকুর চেক করুন।</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-center text-slate-800">খাবার প্রয়োগ ফর্ম</h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পুকুর নির্বাচন</label>
                <select 
                  value={newLog.pond_id} 
                  onChange={e => handlePondChange(e.target.value)} 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">পুকুর বেছে নিন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {recommendation !== null && (
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 animate-in slide-in-from-top-2">
                   <p className="text-xs font-black text-blue-600 uppercase mb-1">এআই পরামর্শ (২.৫% - ৩%)</p>
                   <p className="text-xl font-black text-blue-800">{recommendation.min} - {recommendation.max} কেজি</p>
                   <div className="flex gap-3 mt-2">
                     <button 
                       onClick={() => setNewLog(prev => ({ ...prev, amount: recommendation.min.toString() }))}
                       className="text-[10px] font-black text-blue-500 underline hover:text-blue-700"
                     >
                       ২.৫% ফিল
                     </button>
                     <button 
                       onClick={() => setNewLog(prev => ({ ...prev, amount: recommendation.max.toString() }))}
                       className="text-[10px] font-black text-blue-500 underline hover:text-blue-700"
                     >
                       ৩% ফিল
                     </button>
                   </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">খাবার নির্বাচন (গুদাম)</label>
                <select 
                  value={newLog.inventory_id} 
                  onChange={e => setNewLog(prev => ({ ...prev, inventory_id: e.target.value }))} 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  <option value="">খাবার বেছে নিন</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (মজুদ: {i.quantity} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ওজন (কেজি)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="০.০" 
                    value={newLog.amount} 
                    onChange={e => setNewLog(prev => ({ ...prev, amount: e.target.value }))} 
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-center text-xl focus:ring-2 focus:ring-blue-600 outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">বস্তা (ঐচ্ছিক)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    placeholder="০.০" 
                    value={newLog.bags} 
                    onChange={e => setNewLog(prev => ({ ...prev, bags: e.target.value }))} 
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-center text-xl focus:ring-2 focus:ring-blue-600 outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">প্রয়োগের সময়</label>
                <select 
                  value={newLog.time} 
                  onChange={e => setNewLog(prev => ({ ...prev, time: e.target.value }))} 
                  className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100"
                >
                  <option value="সকাল">সকাল</option>
                  <option value="দুপুর">দুপুর</option>
                  <option value="বিকাল">বিকাল</option>
                  <option value="রাত">রাত</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-400 hover:bg-slate-200 transition-colors"
              >
                বাতিল
              </button>
              <button 
                onClick={handleAdd} 
                disabled={saving} 
                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 disabled:opacity-50 hover:bg-blue-700 transition-all"
              >
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
