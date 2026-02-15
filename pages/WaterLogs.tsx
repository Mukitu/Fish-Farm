
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
    const { data: pondData } = await supabase.from('ponds').select('*').eq('is_archived', false);
    if (pondData) setPonds(pondData);

    const { data: logData } = await supabase.from('water_logs').select('*, ponds(name)').order('date', { ascending: false });
    if (logData) setLogs(logData);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newLog.pond_id) return;
    const { error } = await supabase.from('water_logs').insert([{
      user_id: user.id,
      pond_id: newLog.pond_id,
      oxygen: parseFloat(newLog.oxygen || '0'),
      ph: parseFloat(newLog.ph || '0'),
      temp: parseFloat(newLog.temp || '0')
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNewLog({ pond_id: '', oxygen: '', ph: '', temp: '' });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই লগটি ডিলিট করতে চান?')) {
      await supabase.from('water_logs').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800">পানির গুণমান লগ</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-200"
        >
          <span>🧪</span>
          <span>নতুন লগ যোগ</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6 font-bold">সময় ও তারিখ</th>
                <th className="px-8 py-6 font-bold">পুকুর</th>
                <th className="px-8 py-6 font-bold">অক্সিজেন (mg/L)</th>
                <th className="px-8 py-6 font-bold">পিএইচ (pH)</th>
                <th className="px-8 py-6 font-bold">তাপমাত্রা (°C)</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-20 font-bold">লোড হচ্ছে...</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 text-sm font-bold">{new Date(log.date).toLocaleString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black">{log.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6">
                    <span className={`font-black text-lg ${log.oxygen < 5 ? 'text-rose-500' : 'text-green-600'}`}>{log.oxygen}</span>
                  </td>
                  <td className="px-8 py-6 font-bold">{log.ph}</td>
                  <td className="px-8 py-6 font-medium text-blue-500">{log.temp}°C</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(log.id)} className="text-rose-300 hover:text-rose-600 transition">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 text-center">পানির গুণমান পরীক্ষা</h3>
            <div className="space-y-4">
              <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold">
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <div className="grid grid-cols-3 gap-3">
                 <input type="number" step="0.1" placeholder="অক্সিজেন" value={newLog.oxygen} onChange={e => setNewLog({...newLog, oxygen: e.target.value})} className="px-4 py-4 bg-slate-50 border-none rounded-xl outline-none font-black text-center" />
                 <input type="number" step="0.1" placeholder="পিএইচ" value={newLog.ph} onChange={e => setNewLog({...newLog, ph: e.target.value})} className="px-4 py-4 bg-slate-50 border-none rounded-xl outline-none font-black text-center" />
                 <input type="number" step="0.1" placeholder="তাপমাত্রা" value={newLog.temp} onChange={e => setNewLog({...newLog, temp: e.target.value})} className="px-4 py-4 bg-slate-50 border-none rounded-xl outline-none font-black text-center" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">লগ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterLogsPage;
