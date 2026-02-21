
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
      setRecords([
        { id: 'g1', date: new Date().toISOString(), ponds: { name: 'পুকুর ১ (রুই)' }, sample_count: 5, avg_weight_gm: 480 },
        { id: 'g2', date: new Date().toISOString(), ponds: { name: 'পুকুর ২ (কাতলা)' }, sample_count: 4, avg_weight_gm: 560 },
        { id: 'g3', date: new Date().toISOString(), ponds: { name: 'পুকুর ৩ (পাঙ্গাস)' }, sample_count: 10, avg_weight_gm: 500 }
      ]);
      setLoading(false);
      return;
    }
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
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (!newRec.pond_id || !newRec.avg_weight_gm) {
      alert("⚠️ পুকুর এবং মাছের গড় ওজন দিন!");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('growth_records').insert([{
        user_id: user.id,
        pond_id: newRec.pond_id,
        avg_weight_gm: parseFloat(newRec.avg_weight_gm),
        sample_count: parseInt(newRec.sample_count || '0'), // নাল এরর ঠেকাতে ডিফল্ট ০
        date: new Date().toISOString().split('T')[0]
      }]);
      
      if (error) throw error;
      
      setIsModalOpen(false);
      setNewRec({ pond_id: '', avg_weight_gm: '', sample_count: '' });
      await fetchData();
      alert("✅ মাছের বৃদ্ধির রেকর্ড সফলভাবে সংরক্ষিত হয়েছে!");
    } catch (err: any) { 
      alert("Error: " + err.message); 
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">মাছের বৃদ্ধি ট্র্যাকিং</h1>
          <p className="text-slate-500 font-bold">সময়ের সাথে মাছের গড় ওজন রেকর্ড করুন</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all">➕ রেকর্ড যোগ</button>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black border-b uppercase tracking-widest">
            <tr>
              <th className="px-8 py-6">তারিখ</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">স্যাম্পল সংখ্যা</th>
              <th className="px-8 py-6">গড় ওজন</th>
              <th className="px-8 py-6 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-20 font-bold text-indigo-600 animate-pulse">লোড হচ্ছে...</td></tr>
            ) : records.map(rec => (
              <tr key={rec.id} className="hover:bg-slate-50 transition group">
                <td className="px-8 py-6 font-bold">{new Date(rec.date).toLocaleDateString('bn-BD')}</td>
                <td className="px-8 py-6 font-black text-slate-800">{rec.ponds?.name || 'অজানা'}</td>
                <td className="px-8 py-6">{rec.sample_count || 0} টি মাছ</td>
                <td className="px-8 py-6 font-black text-indigo-600 text-lg">{rec.avg_weight_gm} গ্রাম</td>
                <td className="px-8 py-6 text-center">
                  <button onClick={async () => { if(confirm('ডিলিট করবেন?')) { await supabase.from('growth_records').delete().eq('id', rec.id); fetchData(); } }} className="text-rose-200 group-hover:text-rose-500 transition-colors">🗑️</button>
                </td>
              </tr>
            ))}
            {!loading && records.length === 0 && (
              <tr><td colSpan={5} className="text-center py-20 text-slate-300 italic">কোনো গ্রোথ রেকর্ড নেই।</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-slate-800 text-center">নতুন ওজন রেকর্ড</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পুকুর নির্বাচন</label>
                <select value={newRec.pond_id} onChange={e => setNewRec({...newRec, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600">
                  <option value="">পুকুর বেছে নিন</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">স্যাম্পল মাছের সংখ্যা</label>
                  <input type="number" placeholder="উদা: ৫" value={newRec.sample_count} onChange={e => setNewRec({...newRec, sample_count: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none ring-1 ring-slate-200" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">গড় ওজন (গ্রাম)</label>
                  <input type="number" step="0.1" placeholder="উদা: ২৫০" value={newRec.avg_weight_gm} onChange={e => setNewRec({...newRec, avg_weight_gm: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-black text-center text-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-600" />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black text-slate-400 hover:text-slate-600 transition-colors">বাতিল</button>
              <button onClick={handleAdd} disabled={saving} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                {saving ? 'সেভ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthRecordsPage;
