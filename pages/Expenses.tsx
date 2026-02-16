
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const ExpensesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newExp, setNewExp] = useState({ pond_id: '', category: 'খাবার', item_name: '', amount: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pondData } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      if (pondData) setPonds(pondData);

      const { data: expData } = await supabase.from('expenses')
        .select('*, ponds(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (expData) setExpenses(expData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newExp.pond_id || !newExp.amount || !newExp.item_name) {
      alert("পুকুর, বিবরণ এবং টাকার পরিমাণ সঠিকভাবে দিন!");
      return;
    }
    
    setSaving(true);
    try {
      const { error } = await supabase.from('expenses').insert([{
        user_id: user.id,
        pond_id: newExp.pond_id,
        category: newExp.category,
        item_name: newExp.item_name,
        amount: parseFloat(newExp.amount),
        date: new Date().toISOString().split('T')[0]
      }]);

      if (error) throw error;

      setIsModalOpen(false);
      setNewExp({ pond_id: '', category: 'খাবার', item_name: '', amount: '' });
      await fetchData();
      alert("✅ খরচ সফলভাবে যুক্ত হয়েছে!");
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই খরচটি ডিলিট করতে চান?')) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">খরচের হিসাব</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-rose-600 text-white rounded-[1.5rem] font-black shadow-xl hover:scale-105 transition-all">➕ খরচ যোগ করুন</button>
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
                <tr key={exp.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 text-xs font-bold">{new Date(exp.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black">{exp.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-black">{exp.category}</span>
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-500">{exp.item_name}</td>
                  <td className="px-8 py-6 text-right font-black text-rose-600">৳ {Number(exp.amount).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(exp.id)} className="text-rose-300 hover:text-rose-600">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">নতুন খরচ যোগ করুন</h3>
            <div className="space-y-4">
              <select value={newExp.pond_id} onChange={e => setNewExp({...newExp, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold">
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold">
                <option value="খাবার">খাবার</option>
                <option value="ঔষধ">ঔষধ</option>
                <option value="পোনা">পোনা</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
              <input type="text" placeholder="বিবরণ (উদা: ২৫ বস্তা ফিড)" value={newExp.item_name} onChange={e => setNewExp({...newExp, item_name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
              <input type="number" placeholder="টাকার পরিমাণ (৳)" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-rose-600" />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black">{saving ? 'সেভ হচ্ছে...' : 'সংরক্ষণ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
