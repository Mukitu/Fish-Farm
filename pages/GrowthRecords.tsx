
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const GrowthRecordsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newRec, setNewRec] = useState({ pond_id: '', avg_weight_gm: '', sample_count: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      if (pData) setPonds(pData);

      const { data: rData } = await supabase.from('growth_records')
        .select('*, ponds(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (rData) setRecords(rData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newRec.pond_id || !newRec.avg_weight_gm) {
      alert("পুকুর এবং গড় ওজন দিন!");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('growth_records').insert([{
        user_id: user.id,
        pond_id: newRec.pond_id,
        avg_weight_gm: parseFloat(newRec.avg_weight_gm),
        sample_count: parseInt(newRec.sample_count || '0'),
        date: new Date().toISOString().split('T')[0]
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setNewRec({ pond_id: '', avg_weight_gm: '', sample_count: '' });
      fetchData();
      alert("✅ মাছের বৃদ্ধির রেকর্ড সংরক্ষিত হয়েছে!");
    } catch (err: any) {
      alert("ভুল: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800">মাছের বৃদ্ধি ট্র্যাকিং</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">➕ নতুন লগ</button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black border-b">
            <tr>
              <th className="px-8 py-6">তারিখ</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">গড় ওজন</th>
              <th className="px-8 py-6">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {records.map(rec => (
              <tr key={rec.id} className="hover:bg-slate-50">
                <td className="px-8 py-6 font-bold">{new Date(rec.date).toLocaleDateString('bn-BD')}</td>
                <td className="px-8 py-6 font-black">{rec.ponds?.name}</td>
                <td className="px-8 py-6"><span className="bg-green-50 text-green-600 px-3 py-1 rounded-lg font-black">{rec.avg_weight_gm} গ্রাম</span></td>
                <td className="px-8 py-6"><button onClick={async () => { if(confirm('ডিলিট করবেন?')) { await supabase.from('growth_records').delete().eq('id', rec.id); fetchData(); } }} className="text-rose-300 hover:text-rose-600">🗑️</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 text-center">মাছের ওজন লগ করুন</h3>
            <select value={newRec.pond_id} onChange={e => setNewRec({...newRec, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none outline-none">
              <option value="">পুকুর নির্বাচন করুন</option>
              {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" placeholder="গড় ওজন (গ্রাম)" value={newRec.avg_weight_gm} onChange={e => setNewRec({...newRec, avg_weight_gm: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-black text-indigo-600 border-none outline-none" />
            <input type="number" placeholder="স্যাম্পল সংখ্যা (পিস)" value={newRec.sample_count} onChange={e => setNewRec({...newRec, sample_count: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none outline-none" />
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">{saving ? 'সেভ হচ্ছে...' : 'সংরক্ষণ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthRecordsPage;
