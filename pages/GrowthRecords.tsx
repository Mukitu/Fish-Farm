
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const GrowthRecordsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRec, setNewRec] = useState({ pond_id: '', avg_weight_gm: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      const { data: rData } = await supabase.from('growth_records')
        .select('*, ponds(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (pData) setPonds(pData as Pond[]);
      if (rData) setRecords(rData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!newRec.pond_id || !newRec.avg_weight_gm) return alert("পুকুর এবং ওজন দিন!");
    try {
      const { error } = await supabase.from('growth_records').insert([{
        user_id: user.id,
        pond_id: newRec.pond_id,
        avg_weight_gm: parseFloat(newRec.avg_weight_gm),
        date: new Date().toISOString().split('T')[0]
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setNewRec({ pond_id: '', avg_weight_gm: '' });
      fetchData();
      alert("✅ গ্রোথ রেকর্ড সেভ হয়েছে!");
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">মাছের বৃদ্ধি</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">➕ রেকর্ড যোগ</button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black border-b">
            <tr>
              <th className="px-8 py-6">তারিখ</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">গড় ওজন</th>
              <th className="px-8 py-6 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {records.map(rec => (
              <tr key={rec.id} className="hover:bg-slate-50 transition">
                <td className="px-8 py-6 font-bold">{new Date(rec.date).toLocaleDateString('bn-BD')}</td>
                <td className="px-8 py-6 font-black text-slate-800">{rec.ponds?.name || 'অজানা'}</td>
                <td className="px-8 py-6 font-black text-indigo-600">{rec.avg_weight_gm} গ্রাম</td>
                <td className="px-8 py-6 text-center">
                  <button onClick={async () => { if(confirm('ডিলিট করবেন?')) { await supabase.from('growth_records').delete().eq('id', rec.id); fetchData(); } }} className="text-rose-300">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6">
            <h3 className="text-2xl font-black text-slate-800 text-center">মাছের ওজন রেকর্ড</h3>
            <div className="space-y-4">
              <select value={newRec.pond_id} onChange={e => setNewRec({...newRec, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none outline-none ring-1 ring-slate-200">
                <option value="">পুকুর বেছে নিন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" placeholder="গড় ওজন (গ্রাম)" value={newRec.avg_weight_gm} onChange={e => setNewRec({...newRec, avg_weight_gm: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-black text-center text-xl border-none ring-1 ring-slate-200" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthRecordsPage;
