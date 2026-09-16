import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const SalesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  const [selectedFilterPond, setSelectedFilterPond] = useState<string>('all');

  const [newSale, setNewSale] = useState({ 
    pond_id: '', 
    species: '', 
    count_sold: '', 
    weight: '', 
    amount: '', 
    item_name: '',
    sale_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (user.id === 'guest-id') {
      setPonds([
        { 
          id: '1', name: 'পুকুর ১ (রুই ও কাতলা)', 
          stocking_records: [
            { id: 's1', species: 'রুই', count: 1500, total_weight_kg: 800 },
            { id: 's2', species: 'কাতলা', count: 1000, total_weight_kg: 400 }
          ] 
        }, 
        { 
          id: '2', name: 'পুকুর ২ (কাতলা)', 
          stocking_records: [
            { id: 's3', species: 'কাতলা', count: 1500, total_weight_kg: 850 }
          ] 
        },
        { 
          id: '3', name: 'পুকুর ৩ (পাঙ্গাস)', 
          stocking_records: [
            { id: 's4', species: 'পাঙ্গাস', count: 5000, total_weight_kg: 2500 }
          ] 
        },
        { 
          id: '4', name: 'পুকুর ৪ (তেলাপিয়া)', 
          stocking_records: [
            { id: 's5', species: 'তেলাপিয়া', count: 2000, total_weight_kg: 400 }
          ] 
        }
      ] as any);

      setSales([
        { id: 's1', date: new Date().toISOString().split('T')[0], ponds: { name: 'পুকুর ১ (রুই ও কাতলা)' }, pond_id: '1', species: 'রুই', count_sold: 200, weight_kg: 100, amount: 30000, item_name: 'আড়ৎ বিক্রি' },
        { id: 's2', date: new Date(Date.now() - 86400000).toISOString().split('T')[0], ponds: { name: 'পুকুর ২ (কাতলা)' }, pond_id: '2', species: 'কাতলা', count_sold: 100, weight_kg: 120, amount: 38000, item_name: 'পাইকারি বিক্রি' },
        { id: 's3', date: new Date(Date.now() - 172800000).toISOString().split('T')[0], ponds: { name: 'পুকুর ৪ (তেলাপিয়া)' }, pond_id: '4', species: 'তেলাপিয়া', count_sold: 300, weight_kg: 80, amount: 12000, item_name: 'স্থানীয় বাজার' }
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: pondData } = await supabase
        .from('ponds')
        .select('*, stocking_records(*)')
        .eq('user_id', user.id);

      if (pondData) setPonds(pondData);

      const { data: saleData } = await supabase.from('sales')
        .select('*, ponds(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (saleData) setSales(saleData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedPondObj = ponds.find(p => p.id === newSale.pond_id);
  const availableSpeciesList = selectedPondObj?.stocking_records || [];

  const handleAdd = async () => {
    if (!newSale.pond_id) return alert("অনুগ্রহ করে পুকুর নির্বাচন করুন!");
    if (!newSale.species) return alert("অনুগ্রহ করে মাছের ক্যাটাগরি নির্বাচন করুন!");
    if (!newSale.count_sold || parseInt(newSale.count_sold) <= 0) return alert("বিক্রিত মাছের সংখ্যা (পিস) দিন!");
    if (!newSale.amount) return alert("বিক্রয় মূল্য প্রদান করুন!");

    setSaving(true);
    try {
      const soldCount = parseInt(newSale.count_sold) || 0;
      const soldWeight = parseFloat(newSale.weight) || 0;
      const totalAmount = parseFloat(newSale.amount) || 0;
      const saleDate = newSale.sale_date || new Date().toISOString().split('T')[0];

      if (user.id === 'guest-id') {
        // Guest mode state update
        const newSaleRecord = {
          id: 'sale-' + Date.now(),
          date: saleDate,
          pond_id: newSale.pond_id,
          ponds: { name: selectedPondObj?.name || 'পুকুর' },
          species: newSale.species,
          count_sold: soldCount,
          weight_kg: soldWeight,
          amount: totalAmount,
          item_name: newSale.item_name || `${newSale.species} বিক্রি`
        };

        setSales(prev => [newSaleRecord, ...prev]);

        // Deduct from local pond stocking records
        setPonds(prevPonds => prevPonds.map(p => {
          if (p.id === newSale.pond_id) {
            const updatedStock = (p.stocking_records || []).map((st: any) => {
              if (st.species === newSale.species) {
                return {
                  ...st,
                  count: Math.max(0, (st.count || 0) - soldCount)
                };
              }
              return st;
            });
            return { ...p, stocking_records: updatedStock };
          }
          return p;
        }));

        setIsModalOpen(false);
        setNewSale({ pond_id: '', species: '', count_sold: '', amount: '', weight: '', item_name: '', sale_date: new Date().toISOString().split('T')[0] });
        alert(`✅ ${newSale.species} ${soldCount} পিস বিক্রি সংরক্ষিত হয়েছে এবং মজুদ থেকে মাইনাস করা হয়েছে!`);
        return;
      }

      // 1. Insert Sales Record into Supabase
      const { error: saleErr } = await supabase.from('sales').insert([{
        user_id: user.id,
        pond_id: newSale.pond_id,
        species: newSale.species,
        item_name: newSale.item_name || `${newSale.species} বিক্রি`,
        count_sold: soldCount,
        weight_kg: soldWeight,
        amount: totalAmount,
        date: saleDate
      }]);

      if (saleErr) throw saleErr;

      // 2. Auto Minus Stock from Stocking Records for matched species
      if (newSale.species && selectedPondObj) {
        const matchingStock = availableSpeciesList.find((s: any) => s.species === newSale.species);
        if (matchingStock) {
          const currentCount = Number(matchingStock.count || 0);
          const currentWeight = Number(matchingStock.total_weight_kg || 0);

          const newCount = Math.max(0, currentCount - soldCount);
          const newWeight = Math.max(0, currentWeight - soldWeight);
          const newAvgWeight = newCount > 0 ? (newWeight * 1000) / newCount : 0;

          await supabase.from('stocking_records').update({
            count: newCount,
            total_weight_kg: newWeight,
            avg_weight_gm: newAvgWeight
          }).eq('id', matchingStock.id);
        }
      }

      setIsModalOpen(false);
      setNewSale({ pond_id: '', species: '', count_sold: '', amount: '', weight: '', item_name: '', sale_date: new Date().toISOString().split('T')[0] });
      await fetchData();
      alert(`✅ ${soldCount} পিস ${newSale.species} বিক্রি সংরক্ষিত হয়েছে এবং মজুদ থেকে অটো-মাইনাস করা হয়েছে!`);
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই বিক্রির রেকর্ডটি মুছে ফেলতে চান?')) {
      if (user.id === 'guest-id') {
        setSales(sales.filter(s => s.id !== id));
        return;
      }
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  const filteredSales = selectedFilterPond === 'all' 
    ? sales 
    : sales.filter(s => s.pond_id === selectedFilterPond);

  const totalSoldCount = filteredSales.reduce((acc, curr) => acc + Number(curr.count_sold || 0), 0);
  const totalSaleAmount = filteredSales.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">মাছ বিক্রি ও হিসাব</h1>
          <p className="text-xs font-bold text-slate-400 mt-1">পুকুর ভিত্তিক বিক্রি সংরক্ষণ, মজুদ অটো-মাইনাস ও হিস্ট্রি</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => setIsDetailModalOpen(true)} 
            className="flex-1 sm:flex-initial px-5 py-3.5 bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:bg-slate-700 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            🔍 ভিউ ডিটেইলস
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="flex-1 sm:flex-initial px-6 py-3.5 bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            💰 বিক্রি যোগ করুন
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট বিক্রিত মাছ</p>
            <h3 className="text-2xl font-black text-blue-600">{totalSoldCount.toLocaleString()} পিস</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl">🐟</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট বিক্রি আয়</p>
            <h3 className="text-2xl font-black text-green-600">৳ {totalSaleAmount.toLocaleString()}</h3>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center text-xl">💰</div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট বিক্রির সংখ্যা</p>
            <h3 className="text-2xl font-black text-slate-800">{filteredSales.length} টি রেকর্ড</h3>
          </div>
          <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center text-xl">📜</div>
        </div>
      </div>

      {/* Main Table / List */}
      <div className="bg-white md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden rounded-[2rem]">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">মাছের ক্যাটাগরি</th>
                <th className="px-8 py-6 text-center">বিক্রিত পরিমাণ (পিস)</th>
                <th className="px-8 py-6 text-right">বিক্রয় মূল্য (৳)</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 font-bold">লোড হচ্ছে...</td></tr>
              ) : sales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 text-sm font-bold">{new Date(sale.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{sale.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-800 block">🐟 {sale.species || 'মাছ'}</span>
                    {sale.item_name && <span className="text-xs text-slate-400">{sale.item_name}</span>}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="font-black text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-xl text-xs">
                      {sale.count_sold || 0} পিস
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-green-600 text-base">৳ {Number(sale.amount).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(sale.id)} className="text-slate-300 hover:text-rose-600 transition-colors" title="রেকর্ডটি মুছুন">🗑️</button>
                  </td>
                </tr>
              ))}
              {!loading && sales.length === 0 && (
                <tr><td colSpan={6} className="text-center py-24 text-slate-300 italic">কোন বিক্রির রেকর্ড পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-50">
          {loading ? (
            <div className="p-12 text-center font-bold">লোড হচ্ছে...</div>
          ) : sales.map(sale => (
            <div key={sale.id} className="p-6 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(sale.date).toLocaleDateString('bn-BD')}</p>
                  <h4 className="font-black text-slate-800">{sale.ponds?.name || 'অজানা'}</h4>
                  <span className="text-xs font-black text-slate-600">🐟 {sale.species || 'মাছ'} {sale.item_name ? `(${sale.item_name})` : ''}</span>
                </div>
                <button onClick={() => handleDelete(sale.id)} className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center text-xs">🗑️</button>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-black">{sale.count_sold || 0} পিস</span>
                <p className="text-xl font-black text-green-600 tracking-tighter">৳ {Number(sale.amount).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {!loading && sales.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-bold">কোনো বিক্রির রেকর্ড পাওয়া যায়নি</div>
          )}
        </div>
      </div>

      {/* Add Sale Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-slate-800 text-center">মাছ বিক্রি তথ্য যোগ করুন</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">তারিখ</label>
                <input 
                  type="date" 
                  value={newSale.sale_date} 
                  onChange={e => setNewSale({...newSale, sale_date: e.target.value})} 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">১. পুকুর নির্বাচন করুন</label>
                <select 
                  value={newSale.pond_id} 
                  onChange={e => setNewSale({...newSale, pond_id: e.target.value, species: ''})} 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">পুকুর বেছে নিন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">২. মাছের ক্যাটাগরি (পুকুরে মজুদ অনুযায়ী)</label>
                <select 
                  value={newSale.species} 
                  onChange={e => setNewSale({...newSale, species: e.target.value})}
                  disabled={!newSale.pond_id}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <option value="">মাছের নাম বেছে নিন</option>
                  {availableSpeciesList.map((st: any) => (
                    <option key={st.id || st.species} value={st.species}>
                      🐟 {st.species} (মজুদ আছে: {st.count || 0} পিস)
                    </option>
                  ))}
                </select>
                {newSale.pond_id && availableSpeciesList.length === 0 && (
                  <p className="text-[11px] text-amber-600 font-bold mt-1.5 ml-2">⚠️ এই পুকুরে কোনো মাছ মজুদ করা নেই। আগে 'আমার পুকুরসমূহ' থেকে মাছ পোনা যোগ করুন।</p>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">কত পিস বিক্রি (সংখ্যা)</label>
                <input 
                  type="number" 
                  placeholder="উদা: ৫০" 
                  value={newSale.count_sold} 
                  onChange={e => setNewSale({...newSale, count_sold: e.target.value})} 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-blue-600 text-lg focus:ring-2 focus:ring-green-500" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">মোট বিক্রয় মূল্য (৳)</label>
                <input 
                  type="number" 
                  placeholder="উদা: ৬০০০" 
                  value={newSale.amount} 
                  onChange={e => setNewSale({...newSale, amount: e.target.value})} 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-green-600 text-lg focus:ring-2 focus:ring-green-500" 
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">বিবরণ / পাইকার (ঐচ্ছিক)</label>
                <input 
                  type="text" 
                  placeholder="উদা: স্থানীয় পাইকার করিম" 
                  value={newSale.item_name} 
                  onChange={e => setNewSale({...newSale, item_name: e.target.value})} 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 text-sm" 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-200">
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'বিক্রি ও অটো-মাইনাস'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isDetailModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 z-50">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-6 md:p-10 space-y-6 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800">বিক্রির বিস্তারিত হিস্ট্রি (View Details)</h3>
                <p className="text-xs font-bold text-slate-400">তারিখ ও পুকুর ভিত্তিক সম্পূর্ণ বিক্রির বিবরণ</p>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl font-bold">✕</button>
            </div>

            {/* Filter by pond */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-400 uppercase">পুকুর ফিল্টার:</span>
              <select 
                value={selectedFilterPond} 
                onChange={e => setSelectedFilterPond(e.target.value)} 
                className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black outline-none"
              >
                <option value="all">সকল পুকুর</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            {/* History Table */}
            <div className="flex-1 overflow-y-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b sticky top-0">
                  <tr>
                    <th className="px-6 py-4">তারিখ</th>
                    <th className="px-6 py-4">পুকুর</th>
                    <th className="px-6 py-4">মাছের ক্যাটাগরি</th>
                    <th className="px-6 py-4 text-center">বিক্রিত পিস</th>
                    <th className="px-6 py-4 text-right">মূল্য (৳)</th>
                    <th className="px-6 py-4">বিবরণ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-slate-700 text-xs font-bold">
                  {filteredSales.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-16 text-slate-400 italic">কোন বিক্রির বিবরণ পাওয়া যায়নি</td></tr>
                  ) : filteredSales.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                      <td className="px-6 py-4 font-black">{s.ponds?.name || 'অজানা'}</td>
                      <td className="px-6 py-4 text-blue-600 font-black">🐟 {s.species}</td>
                      <td className="px-6 py-4 text-center font-black">{s.count_sold || 0} পিস</td>
                      <td className="px-6 py-4 text-right font-black text-green-600">৳ {Number(s.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-400">{s.item_name || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl text-xs font-black">
              <span>মোট বিক্রিত পিস: <strong className="text-blue-600">{totalSoldCount} পিস</strong></span>
              <span>মোট বিক্রয় মূল্য: <strong className="text-green-600">৳ {totalSaleAmount.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
