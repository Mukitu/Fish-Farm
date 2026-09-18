import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, InventoryItem } from '../types';
import { exportReportToPdf } from '../utils/pdfExport';

const FeedLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
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
        { id: 'l1', date: new Date().toISOString(), time: 'সকাল', amount: 25, bags: 0.5, pond_id: '1', inventory_id: 'i1', ponds: { name: 'পুকুর ১ (রুই)' }, inventory: { name: 'নারিশ ফিড (গ্রোয়ার)' } },
        { id: 'l2', date: new Date().toISOString(), time: 'বিকাল', amount: 30, bags: 0.6, pond_id: '3', inventory_id: 'i2', ponds: { name: 'পুকুর ৩ (পাঙ্গাস)' }, inventory: { name: 'মেগা ফিড (স্টার্টার)' } },
        { id: 'l3', date: new Date().toISOString(), time: 'সকাল', amount: 15, bags: 0.3, pond_id: '2', inventory_id: 'i1', ponds: { name: 'পুকুর ২ (কাতলা)' }, inventory: { name: 'নারিশ ফিড (গ্রোয়ার)' } }
      ]);
      setLoading(false);
      return;
    }
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data: pData } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      setPonds(pData || []);

      const { data: iData } = await supabase.from('inventory').select('*').eq('user_id', user.id).eq('type', 'খাবার');
      setInventory(iData as InventoryItem[] || []);

      const { data: lData } = await supabase
        .from('feed_logs')
        .select(`*, ponds ( name ), inventory!inventory_id ( name )`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setLogs(lData || []);
    } catch (err: any) { 
      console.error("Fetch Error:", err);
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
        .select(`*, stocking_records(*)`)
        .eq('id', pondId)
        .single();

      if (pondDetail) {
        const totalCount = pondDetail.stocking_records?.reduce((a: any, b: any) => a + Number(b.count), 0) || 0;
        const latestWeight = pondDetail.stocking_records?.[0]?.avg_weight_gm || 0;
        
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

  const handleOpenAdd = () => {
    setEditingLogId(null);
    setNewLog({ pond_id: ponds[0]?.id || '', inventory_id: inventory[0]?.id || '', amount: '', bags: '', time: 'সকাল' });
    setRecommendation(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (log: any) => {
    setEditingLogId(log.id);
    setNewLog({
      pond_id: log.pond_id || '',
      inventory_id: log.inventory_id || '',
      amount: String(log.amount || ''),
      bags: String(log.bags || ''),
      time: log.time || 'সকাল'
    });
    setRecommendation(null);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const applyAmount = parseFloat(newLog.amount);
    const applyBags = parseFloat(newLog.bags || '0');

    if (!newLog.pond_id || !newLog.inventory_id || isNaN(applyAmount) || applyAmount <= 0) {
      alert("⚠️ পুকুর, খাবার এবং সঠিক পরিমাণ প্রদান করুন!");
      return;
    }

    const selectedPond = ponds.find(p => p.id === newLog.pond_id);
    const selectedFeed = inventory.find(i => i.id === newLog.inventory_id);

    if (editingLogId) {
      // EDIT MODE
      if (user.id === 'guest-id') {
        setLogs(prev => prev.map(l => l.id === editingLogId ? {
          ...l,
          pond_id: newLog.pond_id,
          inventory_id: newLog.inventory_id,
          amount: applyAmount,
          bags: applyBags,
          time: newLog.time,
          ponds: { name: selectedPond ? selectedPond.name : 'অজানা' },
          inventory: { name: selectedFeed ? selectedFeed.name : 'খাবার' }
        } : l));
        alert("✅ এন্ট্রি আপডেট হয়েছে!");
      } else {
        setSaving(true);
        try {
          const { error } = await supabase.from('feed_logs').update({
            pond_id: newLog.pond_id,
            inventory_id: newLog.inventory_id,
            amount: applyAmount,
            bags: applyBags,
            time: newLog.time
          }).eq('id', editingLogId);
          if (error) throw error;
          alert("✅ খাবার প্রয়োগ এন্ট্রি আপডেট হয়েছে!");
          await fetchData();
        } catch (e: any) {
          alert("আপডেট সমস্যা: " + e.message);
        } finally {
          setSaving(false);
        }
      }
    } else {
      // ADD MODE
      if (user.id === 'guest-id') {
        const newRec = {
          id: 'log-' + Date.now(),
          date: new Date().toISOString(),
          time: newLog.time,
          amount: applyAmount,
          bags: applyBags,
          pond_id: newLog.pond_id,
          inventory_id: newLog.inventory_id,
          ponds: { name: selectedPond ? selectedPond.name : 'অজানা' },
          inventory: { name: selectedFeed ? selectedFeed.name : 'খাবার' }
        };
        setLogs(prev => [newRec, ...prev]);
        alert("✅ খাবার প্রয়োগ সফলভাবে সংযুক্ত হয়েছে!");
      } else {
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

          await supabase.from('inventory')
            .update({ quantity: Number(selectedFeed.quantity) - applyAmount })
            .eq('id', newLog.inventory_id);

          await fetchData();
          alert("✅ খাবার প্রয়োগ সফলভাবে সেভ হয়েছে!");
        } catch (err: any) {
          alert("ত্রুটি: " + err.message);
        } finally {
          setSaving(false);
        }
      }
    }

    setIsModalOpen(false);
    setEditingLogId(null);
    setNewLog({ pond_id: '', inventory_id: '', amount: '', bags: '', time: 'সকাল' });
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই খাবার প্রয়োগের রেকর্ডটি মুছে ফেলতে চান?')) {
      if (user.id === 'guest-id') {
        setLogs(prev => prev.filter(l => l.id !== id));
        return;
      }
      await supabase.from('feed_logs').delete().eq('id', id);
      fetchData();
    }
  };

  const handleExportFeedPdf = () => {
    const filtered = filterPond === 'all' ? logs : logs.filter(l => l.pond_id === filterPond);
    if (filtered.length === 0) {
      alert("কোনো খাবার প্রয়োগের রেকর্ড পাওয়া যায়নি!");
      return;
    }

    const tableRows = filtered.map(log => [
      new Date(log.date).toLocaleDateString('bn-BD'),
      log.time || 'সকাল',
      log.ponds?.name || 'অজানা',
      log.inventory?.name || 'খাবার',
      `${log.amount || 0} কেজি (${log.bags || 0} বস্তা)`
    ]);

    const totalAmountKg = filtered.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalBags = filtered.reduce((acc, curr) => acc + Number(curr.bags || 0), 0);
    const selectedPondName = ponds.find(p => p.id === filterPond)?.name || 'সকল পুকুর';

    exportReportToPdf({
      title: 'খাবার প্রয়োগ ও ট্র্যাকিং স্টেটমেন্ট',
      farmName: user.farm_name || 'স্মার্ট মৎস্য খামার',
      userName: user.full_name || user.email,
      filterLabel: selectedPondName,
      summaryCards: [
        { label: 'মোট প্রয়োগ সংখ্যা', value: `${filtered.length} বার` },
        { label: 'মোট প্রয়োগ করা খাবার', value: `${totalAmountKg.toLocaleString()} কেজি`, color: '#2563eb' },
        { label: 'মোট বস্তা', value: `${totalBags.toFixed(1)} বস্তা`, color: '#059669' }
      ],
      tableHeaders: ['তারিখ', 'সময়', 'পুকুরের নাম', 'খাবারের নাম', 'পরিমাণ (কেজি/বস্তা)'],
      tableRows: tableRows,
      footerNotes: 'স্মার্ট চাষিয়া খাবার ট্র্যাকার সিস্টেম দ্বারা তৈরিকৃত।'
    });
  };

  const filteredLogs = filterPond === 'all' ? logs : logs.filter(l => l.pond_id === filterPond);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">খাবার প্রয়োগ লগ</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">প্রতিদিনের খাবার প্রদানের হিসাব, এডিট ও পিডিএফ রিপোর্ট</p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <button 
            onClick={handleExportFeedPdf} 
            className="flex-1 sm:flex-initial px-4 sm:px-5 py-3.5 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            📄 পিডিএফ ডাউনলোড
          </button>
          <button 
            onClick={handleOpenAdd} 
            className="flex-1 sm:flex-initial px-5 sm:px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            ➕ নতুন এন্ট্রি
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-white p-3.5 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
        <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest ml-2">ফিল্টার:</span>
        <select 
          value={filterPond} 
          onChange={e => setFilterPond(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl font-bold px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">সব পুকুর</option>
          {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button 
          onClick={fetchData} 
          className="ml-auto w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl hover:bg-blue-100 text-xs transition-colors"
          title="রিফ্রেশ করুন"
        >
          🔄
        </button>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
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
                <tr><td colSpan={5} className="text-center py-16 font-bold animate-pulse text-blue-600 text-sm">লোড হচ্ছে...</td></tr>
              ) : filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-6 font-bold text-xs">
                    <span className="block text-slate-800">{new Date(log.date).toLocaleDateString('bn-BD')}</span>
                    <span className="text-blue-600 text-[10px] font-black uppercase">{log.time}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-800">{log.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6 text-slate-600 font-bold">{log.inventory?.name || 'অজানা'}</td>
                  <td className="px-8 py-6 text-center">
                    <div className="font-black text-blue-600">{log.amount} কেজি</div>
                    {log.bags > 0 && <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{log.bags} বস্তা</div>}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenEdit(log)} className="p-2 text-slate-400 hover:text-blue-600 transition" title="এডিট">✏️</button>
                      <button onClick={() => handleDelete(log.id)} className="p-2 text-slate-400 hover:text-rose-600 transition" title="মুছুন">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-20 text-slate-400 font-bold italic text-sm">
                    কোনো খাবার প্রয়োগের রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-blue-600 font-bold animate-pulse text-sm">লোড হচ্ছে...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold text-sm">কোনো প্রয়োগের রেকর্ড নেই</div>
          ) : filteredLogs.map(log => (
            <div key={log.id} className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('bn-BD')}</span>
                    <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">{log.time}</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-base">{log.ponds?.name || 'অজানা'}</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleOpenEdit(log)} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs" title="এডিট">✏️</button>
                  <button onClick={() => handleDelete(log.id)} className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-xs" title="মুছুন">🗑️</button>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-slate-50 pt-2">
                <p className="text-xs text-slate-600 font-bold">{log.inventory?.name || 'খাবার'}</p>
                <div className="text-right">
                  <p className="text-lg font-black text-blue-600 tracking-tight">{log.amount} কেজি</p>
                  {log.bags > 0 && <p className="text-[10px] text-slate-400 font-bold">{log.bags} বস্তা</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl sm:text-2xl font-black text-center text-slate-800">
              {editingLogId ? '✏️ খাবার এন্ট্রি এডিট' : '🌾 খাবার প্রয়োগ ফর্ম'}
            </h3>
            
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">পুকুর নির্বাচন</label>
                <select 
                  value={newLog.pond_id} 
                  onChange={e => handlePondChange(e.target.value)} 
                  className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">পুকুর বেছে নিন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {recommendation !== null && (
                <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100">
                   <p className="text-[10px] font-black text-blue-600 uppercase mb-1">এআই পরামর্শ (২.৫% - ৩%)</p>
                   <p className="text-base font-black text-blue-800">{recommendation.min} - {recommendation.max} কেজি</p>
                   <div className="flex gap-3 mt-1.5">
                     <button 
                       onClick={() => setNewLog(prev => ({ ...prev, amount: recommendation.min.toString() }))}
                       className="text-[10px] font-black text-blue-600 underline"
                     >
                       ২.৫% ফিল
                     </button>
                     <button 
                       onClick={() => setNewLog(prev => ({ ...prev, amount: recommendation.max.toString() }))}
                       className="text-[10px] font-black text-blue-600 underline"
                     >
                       ৩% ফিল
                     </button>
                   </div>
                </div>
              )}

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">খাবার নির্বাচন (গুদাম)</label>
                <select 
                  value={newLog.inventory_id} 
                  onChange={e => setNewLog(prev => ({ ...prev, inventory_id: e.target.value }))} 
                  className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">খাবার বেছে নিন</option>
                  {inventory.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (মজুদ: {i.quantity} kg)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">ওজন (কেজি)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    placeholder="০.০" 
                    value={newLog.amount} 
                    onChange={e => setNewLog(prev => ({ ...prev, amount: e.target.value }))} 
                    className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-black text-base text-blue-600 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">বস্তা (ঐচ্ছিক)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    placeholder="০.০" 
                    value={newLog.bags} 
                    onChange={e => setNewLog(prev => ({ ...prev, bags: e.target.value }))} 
                    className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-black text-base text-slate-800 border border-slate-200 outline-none focus:ring-2 focus:ring-blue-600" 
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">প্রয়োগের সময়</label>
                <select 
                  value={newLog.time} 
                  onChange={e => setNewLog(prev => ({ ...prev, time: e.target.value }))} 
                  className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 border border-slate-200 outline-none"
                >
                  <option value="সকাল">সকাল</option>
                  <option value="দুপুর">দুপুর</option>
                  <option value="বিকাল">বিকাল</option>
                  <option value="রাত">রাত</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => { setIsModalOpen(false); setEditingLogId(null); }} 
                className="flex-1 py-3.5 bg-slate-100 rounded-2xl font-black text-slate-600 text-sm"
              >
                বাতিল
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving} 
                className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 disabled:opacity-50 text-sm"
              >
                {saving ? 'সেভ হচ্ছে...' : editingLogId ? 'আপডেট সেভ' : 'প্রয়োগ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedLogsPage;
