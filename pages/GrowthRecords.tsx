
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const GrowthRecordsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRec, setNewRec] = useState({ pond_id: '', avg_weight_gm: '', sample_count: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: pondData } = await supabase.from('ponds').select('*').eq('is_archived', false);
    if (pondData) setPonds(pondData);

    const { data: recData } = await supabase.from('growth_records').select('*, ponds(name)').order('date', { ascending: false });
    if (recData) setRecords(recData);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newRec.pond_id || !newRec.avg_weight_gm) return;
    const { error } = await supabase.from('growth_records').insert([{
      user_id: user.id,
      pond_id: newRec.pond_id,
      avg_weight_gm: parseFloat(newRec.avg_weight_gm),
      sample_count: parseInt(newRec.sample_count || '0'),
      date: new Date().toISOString().split('T')[0]
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNewRec({ pond_id: '', avg_weight_gm: '', sample_count: '' });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই গ্রোথ রেকর্ডটি ডিলিট করতে চান?')) {
      await supabase.from('growth_records').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800">মাছের বৃদ্ধি ট্র্যাকিং</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all"
        >
          <span>📈</span>
          <span>নতুন গ্রোথ লগ</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">গড় ওজন</th>
                <th className="px-8 py-6">স্যাম্পল সংখ্যা</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 font-bold">লোড হচ্ছে...</td></tr>
              ) : records.map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 text-sm font-bold">{new Date(rec.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black">{rec.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg font-black">{rec.avg_weight_gm} গ্রাম</span>
                  </td>
                  <td className="px-8 py-6 font-medium text-slate-500">{rec.sample_count}টি মাছ</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(rec.id)} className="text-rose-300 hover:text-rose-600 transition">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800">মাছের ওজন লগ করুন</h3>
            <div className="space-y-4">
              <select value={newRec.pond_id} onChange={e => setNewRec({...newRec, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold">
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="গড় ওজন (গ্রাম)" value={newRec.avg_weight_gm} onChange={e => setNewRec({...newRec, avg_weight_gm: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-black text-indigo-600" />
                <input type="number" placeholder="মাছ সংখ্যা (স্যাম্পল)" value={newRec.sample_count} onChange={e => setNewRec({...newRec, sample_count: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-black" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthRecordsPage;
