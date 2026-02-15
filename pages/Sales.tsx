
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
    setLoading(true);
    const { data: pondData } = await supabase.from('ponds').select('*').eq('is_archived', false);
    if (pondData) setPonds(pondData);

    const { data: saleData } = await supabase.from('sales').select('*, ponds(name)').order('date', { ascending: false });
    if (saleData) setSales(saleData);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newSale.pond_id || !newSale.amount || !newSale.weight) return;
    const { error, data } = await supabase.from('sales').insert([{
      user_id: user.id,
      pond_id: newSale.pond_id,
      item_name: newSale.item_name,
      amount: parseFloat(newSale.amount),
      weight: parseFloat(newSale.weight),
      date: new Date().toISOString().split('T')[0]
    }]).select('*, ponds(name)');

    if (!error) {
      if (data) setSales([data[0], ...sales]);
      setIsModalOpen(false);
      setNewSale({ pond_id: '', item_name: '', amount: '', weight: '' });
    } else {
      alert("ত্রুটি: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই বিক্রির রেকর্ডটি ডিলিট করতে চান?')) {
      const { error } = await supabase.from('sales').delete().eq('id', id);
      if (!error) {
        setSales(sales.filter(s => s.id !== id));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">বিক্রির হিসাব</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-green-600 text-white rounded-[1.5rem] font-black flex items-center gap-2 shadow-xl shadow-green-200 hover:bg-green-700 transition-all"
        >
          <span>💰</span>
          <span>বিক্রি যোগ করুন</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6 text-center">ওজন (কেজি)</th>
                <th className="px-8 py-6">বিবরণ</th>
                <th className="px-8 py-6 text-right">বিক্রয় মূল্য (৳)</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 font-bold">লোড হচ্ছে...</td></tr>
              ) : sales.map(sale => (
                <tr key={sale.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-6 text-sm font-bold">{new Date(sale.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{sale.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6 text-center">
                    <span className="font-black text-slate-600 bg-slate-50 px-3 py-1 rounded-xl">{sale.weight} কেজি</span>
                  </td>
                  <td className="px-8 py-6 text-xs font-medium text-slate-500">{sale.item_name}</td>
                  <td className="px-8 py-6 text-right font-black text-green-600 text-lg">৳ {Number(sale.amount).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(sale.id)} className="text-rose-200 hover:text-rose-600 transition p-2 bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100">🗑️</button>
                  </td>
                </tr>
              ))}
              {!loading && sales.length === 0 && (
                <tr><td colSpan={6} className="text-center py-24 font-black italic text-slate-300">কোন রেকর্ড পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 text-center">বিক্রির তথ্য যোগ করুন</h3>
            <div className="space-y-4">
              <select 
                value={newSale.pond_id} 
                onChange={e => setNewSale({...newSale, pond_id: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold"
              >
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="text" placeholder="ক্রেতার নাম / বিবরণ" value={newSale.item_name} onChange={e => setNewSale({...newSale, item_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                 <input type="number" placeholder="মোট ওজন (কেজি)" value={newSale.weight} onChange={e => setNewSale({...newSale, weight: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black" />
                 <input type="number" placeholder="মোট টাকা (৳)" value={newSale.amount} onChange={e => setNewSale({...newSale, amount: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-green-600" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-5 bg-green-600 text-white rounded-[1.5rem] font-black shadow-lg">বিক্রি সম্পন্ন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPage;
