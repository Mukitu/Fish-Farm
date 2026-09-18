import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';
import { exportReportToPdf } from '../utils/pdfExport';
import { syncFinancialNetProfit } from '../utils/financialSync';

const ExpensesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
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
        { id: 'e1', date: new Date().toISOString(), pond_id: '1', ponds: { name: 'পুকুর ১ (রুই)' }, category: 'খাবার', item_name: 'মাছের খাবার (নারিশ)', amount: 12000 },
        { id: 'e2', date: new Date().toISOString(), pond_id: '2', ponds: { name: 'পুকুর ২ (কাতলা)' }, category: 'প্রস্তুতি', item_name: 'চুন ও সার', amount: 3500 },
        { id: 'e3', date: new Date().toISOString(), pond_id: '3', ponds: { name: 'পুকুর ৩ (পাঙ্গাস)' }, category: 'খাবার', item_name: 'খাবার (মেগা)', amount: 18000 },
        { id: 'e4', date: new Date().toISOString(), pond_id: '4', ponds: { name: 'পুকুর ৪ (তেলাপিয়া)' }, category: 'পোনা', item_name: 'পোনা ক্রয়', amount: 5000 },
        { id: 'e5', date: new Date().toISOString(), pond_id: '5', ponds: { name: 'পুকুর ৫ (কার্প)' }, category: 'শ্রমিক', item_name: 'শ্রমিক মজুরি', amount: 4500 },
        { id: 'e6', date: new Date().toISOString(), pond_id: '1', ponds: { name: 'পুকুর ১ (রুই)' }, category: 'মেডিসিন', item_name: 'ভিটামিন ও ঔষধ', amount: 2600 }
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: p } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      const { data: e } = await supabase.from('expenses').select('*, ponds(name)').eq('user_id', user.id).order('date', { ascending: false });
      const { data: s } = await supabase.from('sales').select('*').eq('user_id', user.id);

      if (p) setPonds(p as Pond[]);
      if (e) setExpenses(e);

      if (user.id !== 'guest-id' && p && e) {
        await syncFinancialNetProfit(user.id, s || [], e || [], p || []);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleOpenAdd = () => {
    setEditingExpId(null);
    setNewExp({ pond_id: ponds[0]?.id || '', category: 'খাবার', item_name: '', amount: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: any) => {
    setEditingExpId(exp.id);
    setNewExp({
      pond_id: exp.pond_id || '',
      category: exp.category || 'খাবার',
      item_name: exp.item_name || '',
      amount: String(exp.amount || '')
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newExp.pond_id || !newExp.amount) return alert("⚠️ পুকুর ও টাকার পরিমাণ সঠিকভাবে দিন!");

    const selectedPond = ponds.find(p => p.id === newExp.pond_id);
    const pondName = selectedPond ? selectedPond.name : 'অজানা';

    if (editingExpId) {
      if (user.id === 'guest-id') {
        setExpenses(prev => prev.map(exp => exp.id === editingExpId ? {
          ...exp,
          pond_id: newExp.pond_id,
          ponds: { name: pondName },
          category: newExp.category,
          item_name: newExp.item_name,
          amount: parseFloat(newExp.amount)
        } : exp));
      } else {
        const { error } = await supabase.from('expenses').update({
          pond_id: newExp.pond_id,
          category: newExp.category,
          item_name: newExp.item_name,
          amount: parseFloat(newExp.amount)
        }).eq('id', editingExpId);
        if (error) { alert("⚠️ আপডেট সমস্যা: " + error.message); return; }
      }
      alert("✅ খরচের তথ্য আপডেট হয়েছে!");
    } else {
      if (user.id === 'guest-id') {
        const newRec = {
          id: 'exp-' + Date.now(),
          date: new Date().toISOString(),
          pond_id: newExp.pond_id,
          ponds: { name: pondName },
          category: newExp.category,
          item_name: newExp.item_name,
          amount: parseFloat(newExp.amount)
        };
        setExpenses(prev => [newRec, ...prev]);
      } else {
        const { error } = await supabase.from('expenses').insert([{
          user_id: user.id,
          pond_id: newExp.pond_id,
          category: newExp.category,
          item_name: newExp.item_name,
          amount: parseFloat(newExp.amount),
          date: new Date().toISOString().split('T')[0]
        }]);
        if (error) { alert("⚠️ সংযোজন সমস্যা: " + error.message); return; }
      }
      alert("✅ নতুন খরচের হিসাব যুক্ত হয়েছে!");
    }

    setIsModalOpen(false);
    setEditingExpId(null);
    setNewExp({ pond_id: '', category: 'খাবার', item_name: '', amount: '' });
    if (user.id !== 'guest-id') fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই খরচের হিসাবটি মুছে ফেলতে চান?')) {
      if (user.id === 'guest-id') {
        setExpenses(prev => prev.filter(e => e.id !== id));
        return;
      }
      await supabase.from('expenses').delete().eq('id', id);
      fetchData();
    }
  };

  const handleExportExpensesPdf = () => {
    if (expenses.length === 0) {
      alert("কোনো খরচের তথ্য পাওয়া যায়নি!");
      return;
    }

    const tableRows = expenses.map(exp => [
      new Date(exp.date).toLocaleDateString('bn-BD'),
      exp.ponds?.name || 'অজানা',
      exp.category || 'সাধারণ খরচ',
      exp.item_name || '-',
      `৳ ${Number(exp.amount).toLocaleString()}`
    ]);

    const totalExpAmount = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    exportReportToPdf({
      title: 'খামার খরচের বিবরণী (Expenses Statement)',
      farmName: user.farm_name || 'স্মার্ট মৎস্য খামার',
      userName: user.full_name || user.email,
      summaryCards: [
        { label: 'মোট খরচের হিসাব', value: `${expenses.length} টি রেকর্ড` },
        { label: 'মোট ব্যয়ের পরিমাণ', value: `৳ ${totalExpAmount.toLocaleString()}`, color: '#e11d48' }
      ],
      tableHeaders: ['তারিখ', 'পুকুর', 'ক্যাটাগরি', 'বিবরণ', 'টাকার পরিমাণ'],
      tableRows: tableRows,
      footerNotes: 'এই রিপোর্টটি সরাসরি প্রিন্ট বা ফোনে পিডিএফ সেভ করার জন্য প্রস্তুত।'
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight">খরচের হিসাব</h1>
          <p className="text-xs font-bold text-slate-400 mt-1">খামারের যাবতীয় খরচের বিবরণী, এডিট ও পিডিএফ সেভ</p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <button 
            onClick={handleExportExpensesPdf} 
            className="flex-1 sm:flex-initial px-4 sm:px-5 py-3.5 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            📄 পিডিএফ ডাউনলোড
          </button>
          <button 
            onClick={handleOpenAdd} 
            className="flex-1 sm:flex-initial px-5 sm:px-6 py-3.5 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-100 hover:bg-rose-700 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            ➕ খরচ যোগ
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">ক্যাটাগরি</th>
                <th className="px-8 py-6">বিবরণ</th>
                <th className="px-8 py-6 text-right">টাকা</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-rose-600 font-bold animate-pulse text-sm">লোড হচ্ছে...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-sm">কোনো খরচের হিসাব পাওয়া যায়নি</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 text-xs font-bold">{new Date(exp.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black text-slate-800">{exp.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6 text-xs font-bold"><span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full">{exp.category || 'সাধারণ'}</span></td>
                  <td className="px-8 py-6 font-medium">{exp.item_name || '-'}</td>
                  <td className="px-8 py-6 text-right font-black text-rose-600">৳ {Number(exp.amount).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenEdit(exp)} className="p-2 text-slate-400 hover:text-blue-600 transition" title="এডিট">✏️</button>
                      <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-400 hover:text-rose-600 transition" title="মুছুন">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-rose-600 font-bold animate-pulse text-sm">লোড হচ্ছে...</div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold text-sm">কোনো খরচের হিসাব পাওয়া যায়নি</div>
          ) : expenses.map(exp => (
            <div key={exp.id} className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(exp.date).toLocaleDateString('bn-BD')}</span>
                    <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md">{exp.category || 'সাধারণ'}</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-base">{exp.ponds?.name || 'অজানা'}</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleOpenEdit(exp)} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs" title="এডিট">✏️</button>
                  <button onClick={() => handleDelete(exp.id)} className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-xs" title="মুছুন">🗑️</button>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-slate-50 pt-2">
                <p className="text-xs text-slate-600 font-medium">{exp.item_name || 'বিস্তারিত নেই'}</p>
                <p className="text-lg font-black text-rose-600 tracking-tight">৳ {Number(exp.amount).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl sm:text-2xl font-black text-center text-slate-800">
              {editingExpId ? '✏️ খরচ এডিট করুন' : '➕ নতুন খরচ যোগ করুন'}
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">পুকুর</label>
                <select value={newExp.pond_id} onChange={e => setNewExp({...newExp, pond_id: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500">
                  <option value="">পুকুর বেছে নিন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">ক্যাটাগরি</label>
                <select value={newExp.category} onChange={e => setNewExp({...newExp, category: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500">
                  <option value="খাবার">খাবার</option>
                  <option value="মেডিসিন">মেডিসিন ও ভিটামিন</option>
                  <option value="পোনা">পোনা ক্রয়</option>
                  <option value="প্রস্তুতি">পুকুর প্রস্তুতি (চুন/সার)</option>
                  <option value="শ্রমিক">শ্রমিক মজুরি</option>
                  <option value="বিদ্যুৎ/জ্বালানি">বিদ্যুৎ / জ্বালানি</option>
                  <option value="অন্যান্য">অন্যান্য খরচ</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">বিবরণ</label>
                <input type="text" placeholder="উদা: ৫০ কেজি নারিশ ফিড ক্রয়" value={newExp.item_name} onChange={e => setNewExp({...newExp, item_name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-bold text-sm text-slate-800 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">টাকার পরিমাণ (৳)</label>
                <input type="number" placeholder="উদা: ১২০০০" value={newExp.amount} onChange={e => setNewExp({...newExp, amount: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 rounded-2xl font-black text-base text-rose-600 border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setIsModalOpen(false); setEditingExpId(null); }} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl font-black shadow-lg text-sm">{editingExpId ? 'আপডেট সেভ' : 'সংরক্ষণ করুন'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
