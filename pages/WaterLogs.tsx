
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const WaterLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({ pond_id: '', oxygen: '', ph: '', temp: '' });

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
      setLogs([
        { id: 'w1', date: new Date().toISOString(), ponds: { name: 'পুকুর ১ (রুই)' }, oxygen: 6.5, ph: 7.8, temp: 28 },
        { id: 'w2', date: new Date().toISOString(), ponds: { name: 'পুকুর ২ (কাতলা)' }, oxygen: 4.2, ph: 8.1, temp: 29 },
        { id: 'w3', date: new Date().toISOString(), ponds: { name: 'পুকুর ৩ (পাঙ্গাস)' }, oxygen: 5.8, ph: 7.5, temp: 27 }
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data: pData } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      const { data: logData } = await supabase.from('water_logs')
        .select('*, ponds(name)')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      
      if (pData) setPonds(pData as Pond[]);
      if (logData) setLogs(logData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (!newLog.pond_id) return alert("পুকুর নির্বাচন করুন!");
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
        alert("✅ পানির মান রেকর্ড হয়েছে!");
      } else { throw error; }
    } catch (err: any) { alert("ত্রুটি: " + err.message); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই লগটি ডিলিট করতে চান?')) {
      const { error } = await supabase.from('water_logs').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800">পানির গুণমান</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl">🧪 নতুন লগ</button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">DO (mg/L)</th>
                <th className="px-8 py-6">pH</th>
                <th className="px-8 py-6">Temp</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="px-8 py-6 text-xs font-bold">{new Date(log.date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black">{log.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6"><span className={`font-black ${log.oxygen < 5 ? 'text-rose-500' : 'text-blue-600'}`}>{log.oxygen}</span></td>
                  <td className="px-8 py-6 font-bold text-green-600">{log.ph}</td>
                  <td className="px-8 py-6 font-medium text-slate-500">{log.temp}°C</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(log.id)} className="text-rose-300">🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-6 shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 text-center">পানির পরীক্ষা</h3>
            <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none outline-none ring-1 ring-slate-200">
              <option value="">পুকুর বেছে নিন</option>
              {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-3">
              <input type="number" step="0.1" placeholder="DO" value={newLog.oxygen} onChange={e => setNewLog({...newLog, oxygen: e.target.value})} className="w-full px-4 py-4 bg-slate-50 rounded-xl font-black text-center" />
              <input type="number" step="0.1" placeholder="pH" value={newLog.ph} onChange={e => setNewLog({...newLog, ph: e.target.value})} className="w-full px-4 py-4 bg-slate-50 rounded-xl font-black text-center" />
              <input type="number" step="0.1" placeholder="Temp" value={newLog.temp} onChange={e => setNewLog({...newLog, temp: e.target.value})} className="w-full px-4 py-4 bg-slate-50 rounded-xl font-black text-center" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-black">সংরক্ষণ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterLogsPage;
