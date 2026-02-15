
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const ExpensesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExp, setNewExp] = useState({ pond_id: '', category: 'খাবার', item_name: '', amount: '', weight: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: pondData } = await supabase.from('ponds').select('*').eq('is_archived', false);
    if (pondData) setPonds(pondData);

    const { data: expData } = await supabase.from('expenses').select('*, ponds(name)').order('date', { ascending: false });
    if (expData) setExpenses(expData);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newExp.pond_id || !newExp.amount) return;
    const { error, data } = await supabase.from('expenses').insert([{
      user_id: user.id,
      pond_id: newExp.pond_id,
      category: newExp.category,
      item_name: newExp.item_name,
      amount: parseFloat(newExp.amount),
      weight: parseFloat(newExp.weight || '0'),
      date: new Date().toISOString().split('T')[0]
    }]).select('*, ponds(name)');

    if (!error) {
      if (data) setExpenses([data[0], ...expenses]);
      setIsModalOpen(false);
      setNewExp({ pond_id: '', category: 'খাবার', item_name: '', amount: '', weight: '' });
    } else {
      alert("ডাটা সেভ করতে সমস্যা হয়েছে: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই খরচটি ডিলিট করতে চান?')) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (!error) {
        setExpenses(expenses.filter(e => e.id !== id));
      } else {
        alert("ডিলিট করা যায়নি।");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">খরচের হিসাব</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-rose-600 text-white rounded-[1.5rem] font-black flex items-center gap-2 shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all"
        >
          <span>📉</span>
          <span>খরচ যোগ করুন</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">ক্যাটাগরি</th>
                <th className="px-8 py-6">বিবরণ</th>
                <th className="px-8 py-6 text-right">পরিমাণ (৳)</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 font-bold">লোড হচ্ছে...</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-6 text-sm font-bold">{new Date(exp.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{exp.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase">{exp.category}</span>
                  </td>
                  <td className="px-8 py-6 text-xs font-medium text-slate-500">{exp.item_name}</td>
                  <td className="px-8 py-6 text-right font-black text-rose-600">৳ {Number(exp.amount).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(exp.id)} className="text-rose-200 hover:text-rose-600 transition p-2 bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100">🗑️</button>
                  </td>
                </tr>
              ))}
              {!loading && expenses.length === 0 && (
                <tr><td colSpan={6} className="text-center py-24 font-black italic text-slate-300">কোন রেকর্ড পাওয়া যায়নি</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 text-center">নতুন খরচ যোগ করুন</h3>
            <div className="space-y-4">
              <select 
                value={newExp.pond_id} 
                onChange={e => setNewExp({...newExp, pond_id: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold"
              >
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select 
                value={newExp.category} 
                onChange={e => setNewExp({...newExp, category: e.target.value})}
                className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none font-bold"
              >
                <option value="খাবার">খাবার</option>
                <option value="ঔষধ">ঔষধ</option>
                <option value="পোনা">পোনা</option>
                <option value="লেবার">লেবার</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
              <input type="text" placeholder="বিবরণ" value={newExp.item_name} onChange={e => setNewExp({...newExp, item_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-bold" />
              <input type="number" placeholder="টাকার পরিমাণ (৳)" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl outline-none font-black text-rose-600" />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-5 bg-rose-600 text-white rounded-[1.5rem] font-black shadow-lg">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
