
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const SalesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [sales, setSales] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSale, setNewSale] = useState({ pond_id: '', item_name: '', amount: '', weight: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (user.id === 'guest-id') {
      setPonds([
        { id: '1', name: 'পুকুর ১ (রুই)' }, 
        { id: '2', name: 'পুকুর ২ (কাতলা)' },
        { id: '3', name: 'পুকুর ৩ (পাঙ্গাস)' },
        { id: '4', name: 'পুকুর ৪ (তেলাপিয়া)' },
        { id: '5', name: 'পুকুর ৫ (কার্প)' }
      ] as any);
      setSales([
        { id: 's1', date: new Date().toISOString(), ponds: { name: 'পুকুর ১ (রুই)' }, weight_kg: 250, amount: 65000 },
        { id: 's2', date: new Date().toISOString(), ponds: { name: 'পুকুর ২ (কাতলা)' }, weight_kg: 120, amount: 38000 },
        { id: 's3', date: new Date().toISOString(), ponds: { name: 'পুকুর ৪ (তেলাপিয়া)' }, weight_kg: 80, amount: 12000 },
        { id: 's4', date: new Date().toISOString(), ponds: { name: 'পুকুর ৫ (কার্প)' }, weight_kg: 50, amount: 10000 }
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: pondData } = await supabase.from('ponds').select('*').eq('user_id', user.id);
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

  const handleAdd = async () => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (!newSale.pond_id || !newSale.amount || !newSale.weight) {
      alert("পুকুর, ওজন এবং মোট টাকার পরিমাণ দিন!");
      return;
    }
    try {
      const { error } = await supabase.from('sales').insert([{
        user_id: user.id,
        pond_id: newSale.pond_id,
        item_name: newSale.item_name,
        amount: parseFloat(newSale.amount) || 0,
        weight_kg: parseFloat(newSale.weight) || 0,
        date: new Date().toISOString().split('T')[0]
      }]);

      if (!error) {
        setIsModalOpen(false);
        setNewSale({ pond_id: '', item_name: '', amount: '', weight: '' });
        fetchData();
        alert("✅ বিক্রির রেকর্ড সংরক্ষিত হয়েছে!");
      } else {
        throw error;
      }
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই বিক্রির রেকর্ডটি ডিলিট করতে চান?')) {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">বিক্রির হিসাব</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-green-600 text-white rounded-[1.5rem] font-black shadow-xl hover:scale-105 transition-all">💰 বিক্রি যোগ করুন</button>
      </div>

      <div className="bg-white md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden rounded-[2rem]">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6 text-center">ওজন (কেজি)</th>
                <th className="px-8 py-6 text-right">বিক্রয় মূল্য (৳)</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 font-bold">লোড হচ্ছে...</td></tr>
              ) : sales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 text-sm font-bold">{new Date(sale.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{sale.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6 text-center"><span className="font-black text-slate-600 bg-slate-50 px-3 py-1 rounded-xl">{sale.weight_kg || 0} কেজি</span></td>
                  <td className="px-8 py-6 text-right font-black text-green-600">৳ {Number(sale.amount).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(sale.id)} className="text-rose-300 hover:text-rose-600 transition-colors">🗑️</button>
                  </td>
                </tr>
              ))}
              {!loading && sales.length === 0 && (
                <tr><td colSpan={5} className="text-center py-24 text-slate-300 italic">কোন বিক্রির রেকর্ড পাওয়া যায়নি</td></tr>
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
                </div>
                <button onClick={() => handleDelete(sale.id)} className="w-8 h-8 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center text-xs">🗑️</button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">{sale.weight_kg || 0} কেজি</span>
                <p className="text-xl font-black text-green-600 tracking-tighter">৳ {Number(sale.amount).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {!loading && sales.length === 0 && (
            <div className="p-12 text-center text-slate-400 font-bold">কোনো বিক্রির রেকর্ড পাওয়া যায়নি</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">বিক্রির তথ্য যোগ করুন</h3>
            <div className="space-y-4">
              <select value={newSale.pond_id} onChange={e => setNewSale({...newSale, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold">
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="text" placeholder="ক্রেতা বা বিবরণ" value={newSale.item_name} onChange={e => setNewSale({...newSale, item_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                 <input type="number" placeholder="ওজন (কেজি)" value={newSale.weight} onChange={e => setNewSale({...newSale, weight: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black" />
                 <input type="number" placeholder="মোট টাকা (৳)" value={newSale.amount} onChange={e => setNewSale({...newSale, amount: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-green-600" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-5 bg-green-600 text-white rounded-[1.5rem] font-black shadow-lg">সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
