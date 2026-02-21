
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const ExpensesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExp, setNewExp] = useState({ pond_id: '', category: 'খাবার', item_name: '', amount: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    if (user.id === 'guest-id') {
      setPonds([
        { id: '1', name: 'পুকুর ১ (রুই)' }, 
        { id: '2', name: 'পুকুর ২ (কাতলা)' },
        { id: '3', name: 'পুকুর ৩ (পাঙ্গাস)' },
        { id: '4', name: 'পুকুর ৪ (তেলাপিয়া)' },
        { id: '5', name: 'পুকুর ৫ (কার্প)' }
      ] as any);
      setExpenses([
        { id: 'e1', date: new Date().toISOString(), ponds: { name: 'পুকুর ১ (রুই)' }, item_name: 'মাছের খাবার (নারিশ)', amount: 12000 },
        { id: 'e2', date: new Date().toISOString(), ponds: { name: 'পুকুর ২ (কাতলা)' }, item_name: 'চুন ও সার', amount: 3500 },
        { id: 'e3', date: new Date().toISOString(), ponds: { name: 'পুকুর ৩ (পাঙ্গাস)' }, item_name: 'খাবার (মেগা)', amount: 18000 },
        { id: 'e4', date: new Date().toISOString(), ponds: { name: 'পুকুর ৪ (তেলাপিয়া)' }, item_name: 'পোনা ক্রয়', amount: 5000 },
        { id: 'e5', date: new Date().toISOString(), ponds: { name: 'পুকুর ৫ (কার্প)' }, item_name: 'শ্রমিক মজুরি', amount: 4500 },
        { id: 'e6', date: new Date().toISOString(), ponds: { name: 'পুকুর ১ (রুই)' }, item_name: 'ভিটামিন ও ঔষধ', amount: 2600 }
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: p } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      const { data: e } = await supabase.from('expenses').select('*, ponds(name)').eq('user_id', user.id).order('date', { ascending: false });
      if (p) setPonds(p as Pond[]);
      if (e) setExpenses(e);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (!newExp.pond_id || !newExp.amount) return alert("পুকুর ও টাকার পরিমাণ দিন!");
    try {
      await supabase.from('expenses').insert([{
        user_id: user.id,
        pond_id: newExp.pond_id,
        category: newExp.category,
        item_name: newExp.item_name,
        amount: parseFloat(newExp.amount),
        date: new Date().toISOString().split('T')[0]
      }]);
      setIsModalOpen(false);
      setNewExp({ pond_id: '', category: 'খাবার', item_name: '', amount: '' });
      fetchData();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">খরচের হিসাব</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl">➕ খরচ যোগ</button>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-6">তারিখ</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">বিবরণ</th>
              <th className="px-8 py-6 text-right">টাকা</th>
              <th className="px-8 py-6 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50 transition">
                <td className="px-8 py-6 text-xs font-bold">{new Date(exp.date).toLocaleDateString('bn-BD')}</td>
                <td className="px-8 py-6 font-black text-slate-800">{exp.ponds?.name || 'অজানা'}</td>
                <td className="px-8 py-6">{exp.item_name}</td>
                <td className="px-8 py-6 text-right font-black text-rose-600">৳ {exp.amount}</td>
                <td className="px-8 py-6 text-center">
                   <button onClick={async () => {if(confirm('মুছবেন?')) {await supabase.from('expenses').delete().eq('id', exp.id); fetchData();}}} className="text-rose-300">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6">
            <h3 className="text-2xl font-black text-center text-slate-800">নতুন খরচ যোগ করুন</h3>
            <div className="space-y-4">
              <select value={newExp.pond_id} onChange={e => setNewExp({...newExp, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100">
                <option value="">পুকুর বেছে নিন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="text" placeholder="বিবরণ" value={newExp.item_name} onChange={e => setNewExp({...newExp, item_name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-bold border-none ring-1 ring-slate-100" />
              <input type="number" placeholder="টাকার পরিমাণ" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-rose-600 border-none ring-1 ring-slate-100" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black">সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
