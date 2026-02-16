
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const WaterLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({ pond_id: '', oxygen: '', ph: '', temp: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      if (pData) setPonds(pData);

      const { data: logData } = await supabase.from('water_logs')
        .select('*, ponds(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (logData) setLogs(logData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newLog.pond_id) {
      alert("পুকুর নির্বাচন করুন!");
      return;
    }
    try {
      const { error } = await supabase.from('water_logs').insert([{
        user_id: user.id,
        pond_id: newLog.pond_id,
        oxygen: parseFloat(newLog.oxygen || '0'),
        ph: parseFloat(newLog.ph || '0'),
        temp: parseFloat(newLog.temp || '0'),
        date: new Date().toISOString().split('T')[0]
      }]);

      if (!error) {
        setIsModalOpen(false);
        setNewLog({ pond_id: '', oxygen: '', ph: '', temp: '' });
        fetchData();
        alert("✅ পানির মান সফলভাবে রেকর্ড করা হয়েছে!");
      } else {
        throw error;
      }
    } catch (err: any) {
      alert("ত্রুটি: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই পানির লগটি ডিলিট করতে চান?')) {
      const { error } = await supabase.from('water_logs').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">পানির গুণমান লগ</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">🧪 নতুন লগ যোগ</button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">DO (mg/L)</th>
                <th className="px-8 py-6">pH</th>
                <th className="px-8 py-6">তাপমাত্রা</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 font-bold">লোড হচ্ছে...</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 text-sm font-bold">{new Date(log.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black">{log.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6"><span className={`font-black ${log.oxygen < 5 ? 'text-rose-500' : 'text-blue-600'}`}>{log.oxygen}</span></td>
                  <td className="px-8 py-6 font-bold text-green-600">{log.ph}</td>
                  <td className="px-8 py-6 font-medium text-slate-500">{log.temp}°C</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(log.id)} className="text-rose-200 hover:text-rose-600 transition p-2">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">পানির মান পরীক্ষা</h3>
            <div className="space-y-4">
              <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold">
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-3">
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase text-center block">DO</label>
                   <input type="number" step="0.1" placeholder="0.0" value={newLog.oxygen} onChange={e => setNewLog({...newLog, oxygen: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border-none rounded-xl outline-none font-black text-center" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase text-center block">pH</label>
                   <input type="number" step="0.1" placeholder="7.0" value={newLog.ph} onChange={e => setNewLog({...newLog, ph: e.target.value})} className="px-4 py-4 bg-slate-50 border-none rounded-xl outline-none font-black text-center" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase text-center block">Temp</label>
                   <input type="number" step="0.1" placeholder="28" value={newLog.temp} onChange={e => setNewLog({...newLog, temp: e.target.value})} className="px-4 py-4 bg-slate-50 border-none rounded-xl outline-none font-black text-center text-blue-500" />
                 </div>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">লগ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterLogsPage;
