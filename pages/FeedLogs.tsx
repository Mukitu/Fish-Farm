
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const FeedLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({ pond_id: '', feed_item: '', amount: '', time: 'সকাল' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: pondData } = await supabase.from('ponds').select('*').eq('is_archived', false);
    if (pondData) setPonds(pondData);

    const { data: logData } = await supabase.from('feed_logs').select('*, ponds(name)').order('created_at', { ascending: false });
    if (logData) setLogs(logData);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newLog.pond_id || !newLog.amount) return;
    const { error } = await supabase.from('feed_logs').insert([{
      user_id: user.id,
      pond_id: newLog.pond_id,
      feed_item: newLog.feed_item,
      amount: parseFloat(newLog.amount),
      time: newLog.time,
      date: new Date().toISOString().split('T')[0]
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNewLog({ pond_id: '', feed_item: '', amount: '', time: 'সকাল' });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই লগটি ডিলিট করতে চান?')) {
      await supabase.from('feed_logs').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">খাবার প্রয়োগ লগ</h1>
          <p className="text-slate-500">প্রতিদিনের সঠিক ফিডিং ম্যানেজমেন্ট নিশ্চিত করুন</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-200"
        >
          <span>🍽️</span>
          <span>খাবার প্রদান করুন</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ ও সময়</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">খাবারের ধরণ</th>
                <th className="px-8 py-6 text-right">পরিমাণ (কেজি)</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-20 font-bold">লোড হচ্ছে...</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="px-8 py-6 whitespace-nowrap">
                     <p className="font-bold">{log.time}</p>
                     <p className="text-[10px] text-slate-400">{new Date(log.date).toLocaleDateString('bn-BD')}</p>
                  </td>
                  <td className="px-8 py-6 font-black">{log.ponds?.name || 'অজানা'}</td>
                  <td className="px-8 py-6">
                     <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase">{log.feed_item}</span>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-blue-600">{Number(log.amount).toFixed(1)}</td>
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
            <h3 className="text-2xl font-black text-slate-800 text-center">খাবার প্রদানের তথ্য</h3>
            <div className="space-y-4">
              <select value={newLog.pond_id} onChange={e => setNewLog({...newLog, pond_id: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold">
                <option value="">পুকুর নির্বাচন করুন</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="text" placeholder="খাবারের নাম" value={newLog.feed_item} onChange={e => setNewLog({...newLog, feed_item: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                 <input type="number" placeholder="পরিমাণ (কেজি)" value={newLog.amount} onChange={e => setNewLog({...newLog, amount: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold" />
                 <select value={newLog.time} onChange={e => setNewLog({...newLog, time: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold">
                    <option value="সকাল">সকাল</option>
                    <option value="দুপুর">দুপুর</option>
                    <option value="বিকাল">বিকাল</option>
                    <option value="রাত">রাত</option>
                 </select>
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedLogsPage;
