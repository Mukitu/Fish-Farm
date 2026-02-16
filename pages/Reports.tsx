
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const ReportsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [stats, setStats] = useState({ totalExp: 0, totalSale: 0, netProfit: 0 });
  const [pondStats, setPondStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReportData(); }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { data: exp } = await supabase.from('expenses').select('*').eq('user_id', user.id);
      const { data: sale } = await supabase.from('sales').select('*').eq('user_id', user.id);
      const { data: ponds } = await supabase.from('ponds').select('*').eq('user_id', user.id);

      const totalExp = exp?.reduce((a, b) => a + Number(b.amount), 0) || 0;
      const totalSale = sale?.reduce((a, b) => a + Number(b.amount), 0) || 0;

      const pStats = ponds?.map(p => {
        const pExp = exp?.filter(e => e.pond_id === p.id).reduce((a, b) => a + Number(b.amount), 0) || 0;
        const pSale = sale?.filter(s => s.pond_id === p.id).reduce((a, b) => a + Number(b.amount), 0) || 0;
        return { name: p.name, exp: pExp, sale: pSale, profit: pSale - pExp };
      }) || [];

      setStats({ totalExp, totalSale, netProfit: totalSale - totalExp });
      setPondStats(pStats);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">রিপোর্ট ও বিশ্লেষণ</h1>
          <p className="text-slate-500 font-bold">খামারের পূর্ণাঙ্গ আর্থিক চিত্র</p>
        </div>
        <button onClick={() => window.print()} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl">📥 PDF ডাউনলোড</button>
      </div>

      <div id="print-content" className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">মোট বিক্রয়</p>
            <h2 className="text-4xl font-black text-green-600">৳ {stats.totalSale.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">মোট খরচ</p>
            <h2 className="text-4xl font-black text-rose-600">৳ {stats.totalExp.toLocaleString()}</h2>
          </div>
          <div className={`p-10 rounded-[3rem] shadow-sm text-center ${stats.netProfit >= 0 ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}`}>
            <p className="text-xs font-black opacity-70 uppercase tracking-widest mb-4">নীট লাভ/ক্ষতি</p>
            <h2 className="text-4xl font-black">৳ {stats.netProfit.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-xl font-black text-slate-800 mb-8">পুকুর ভিত্তিক বিস্তারিত</h3>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">মোট খরচ</th>
                <th className="px-8 py-6">মোট বিক্রয়</th>
                <th className="px-8 py-6">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pondStats.map((p, i) => (
                <tr key={i}>
                  <td className="px-8 py-6 font-black">{p.name}</td>
                  <td className="px-8 py-6 text-rose-500 font-bold">৳{p.exp.toLocaleString()}</td>
                  <td className="px-8 py-6 text-green-600 font-bold">৳{p.sale.toLocaleString()}</td>
                  <td className={`px-8 py-6 font-black ${p.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {p.profit >= 0 ? '৳' + p.profit.toLocaleString() + ' লাভ' : '৳' + Math.abs(p.profit).toLocaleString() + ' ক্ষতি'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
