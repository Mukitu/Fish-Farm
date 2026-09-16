
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const SalesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [newSale, setNewSale] = useState({ 
    pond_id: '', 
    species: '', 
    count_sold: '', 
    weight: '', 
    amount: '', 
    item_name: '' 
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
        { id: 's1', date: new Date().toISOString(), ponds: { name: 'পুকুর ১ (রুই ও কাতলা)' }, species: 'রুই', count_sold: 200, weight_kg: 100, amount: 30000, item_name: 'আড়ৎ বিক্রি' },
        { id: 's2', date: new Date().toISOString(), ponds: { name: 'পুকুর ২ (কাতলা)' }, species: 'কাতলা', count_sold: 100, weight_kg: 120, amount: 38000, item_name: 'পাইকারি বিক্রি' },
        { id: 's3', date: new Date().toISOString(), ponds: { name: 'পুকুর ৪ (তেলাপিয়া)' }, species: 'তেলাপিয়া', count_sold: 300, weight_kg: 80, amount: 12000, item_name: 'স্থানীয় বাজার' }
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
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (!newSale.pond_id || !newSale.amount || (!newSale.weight && !newSale.count_sold)) {
      alert("পুকুর, বিক্রয় মূল্য এবং ওজন বা পিস সংখ্যা প্রদান করুন!");
      return;
    }

    setSaving(true);
    try {
      const soldCount = parseInt(newSale.count_sold) || 0;
      const soldWeight = parseFloat(newSale.weight) || 0;
      const totalAmount = parseFloat(newSale.amount) || 0;

      // 1. Insert Sales Record
      const { error: saleErr } = await supabase.from('sales').insert([{
        user_id: user.id,
        pond_id: newSale.pond_id,
        species: newSale.species || 'সাধারণ মাছ',
        item_name: newSale.item_name || `${newSale.species || 'মাছ'} বিক্রি`,
        count_sold: soldCount,
        weight_kg: soldWeight,
        amount: totalAmount,
        date: new Date().toISOString().split('T')[0]
      }]);

      if (saleErr) throw saleErr;

      // 2. Auto Minus Stock from Stocking Records if species is matched
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
      setNewSale({ pond_id: '', species: '', count_sold: '', amount: '', weight: '', item_name: '' });
      await fetchData();
      alert(`✅ ${soldCount > 0 ? soldCount + ' পিস ' : ''}${newSale.species ? newSale.species + ' ' : ''}বিক্রি সফলভাবে সংরক্ষিত এবং স্টক থেকে অটো-মাইনাস করা হয়েছে!`);
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই বিক্রির রেকর্ডটি ডিলিট করতে চান?')) {
      if (user.id === 'guest-id') {
        setSales(sales.filter(s => s.id !== id));
        return;
      }
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">বিক্রির হিসাব</h1>
          <p className="text-xs font-bold text-slate-400 mt-1">মাছ বিক্রি সংরক্ষণ ও মজুদ থেকে অটো-মাইনাস</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="px-6 py-3.5 bg-green-600 text-white rounded-2xl font-black shadow-xl shadow-green-100 hover:scale-105 active:scale-95 transition-all text-sm flex items-center gap-2"
        >
          💰 বিক্রি যোগ করুন
        </button>
      </div>

      <div className="bg-white md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden rounded-[2rem]">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">মাছের জাত / বিবরণ</th>
                <th className="px-8 py-6 text-center">বিক্রিত পরিমাণ</th>
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
                    <span className="text-xs text-slate-400">{sale.item_name || ''}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-xl text-xs mr-2">
                      {sale.count_sold || 0} পিস
                    </span>
                    <span className="font-black text-slate-600 bg-slate-50 px-3 py-1 rounded-xl text-xs">
                      {sale.weight_kg || 0} কেজি
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-green-600 text-base">৳ {Number(sale.amount).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(sale.id)} className="text-slate-300 hover:text-rose-600 transition-colors">🗑️</button>
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
                <div className="flex gap-2 text-xs font-black">
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg">{sale.count_sold || 0} পিস</span>
                  <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg">{sale.weight_kg || 0} কেজি</span>
                </div>
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
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-5 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">বিক্রির তথ্য যোগ করুন</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">১. পুকুর নির্বাচন করুন</label>
                <select 
                  value={newSale.pond_id} 
                  onChange={e => setNewSale({...newSale, pond_id: e.target.value, species: ''})} 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">পুকুর নির্বাচন করুন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">২. মাছের জাত / ক্যাটাগরি</label>
                <select 
                  value={newSale.species} 
                  onChange={e => setNewSale({...newSale, species: e.target.value})}
                  disabled={!newSale.pond_id}
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <option value="">মাছের জাত নির্বাচন করুন</option>
                  {availableSpeciesList.map((st: any) => (
                    <option key={st.id || st.species} value={st.species}>
                      🐟 {st.species} (মজুদ আছে: {st.count || 0} পিস, {st.total_weight_kg || 0} কেজি)
                    </option>
                  ))}
                  <option value="রুই">রুই</option>
                  <option value="কাতলা">কাতলা</option>
                  <option value="মৃগেল">মৃগেল</option>
                  <option value="পাঙ্গাস">পাঙ্গাস</option>
                  <option value="তেলাপিয়া">তেলাপিয়া</option>
                  <option value="অন্যান্য">অন্যান্য মাছ</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">কত পিস বিক্রি (সংখ্যা)</label>
                  <input 
                    type="number" 
                    placeholder="উদা: ৫০" 
                    value={newSale.count_sold} 
                    onChange={e => setNewSale({...newSale, count_sold: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-blue-600 focus:ring-2 focus:ring-green-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">ওজন (কেজি)</label>
                  <input 
                    type="number" 
                    placeholder="উদা: ২০" 
                    value={newSale.weight} 
                    onChange={e => setNewSale({...newSale, weight: e.target.value})} 
                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-slate-800 focus:ring-2 focus:ring-green-500" 
                  />
                </div>
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">ক্রেতার নাম / বিবরণ (ঐচ্ছিক)</label>
                <input 
                  type="text" 
                  placeholder="উদা: আড়তদার রহিম বা লোকাল পাইকার" 
                  value={newSale.item_name} 
                  onChange={e => setNewSale({...newSale, item_name: e.target.value})} 
                  className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold text-slate-800 focus:ring-2 focus:ring-green-500" 
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-4 bg-green-600 text-white rounded-2xl font-black shadow-lg shadow-green-200">
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ ও মাইনাস'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
