
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
    const { data: exp } = await supabase.from('expenses').select('*');
    const { data: sale } = await supabase.from('sales').select('*');
    const { data: ponds } = await supabase.from('ponds').select('*');

    const totalExp = exp?.reduce((a, b) => a + Number(b.amount), 0) || 0;
    const totalSale = sale?.reduce((a, b) => a + Number(b.amount), 0) || 0;

    const pStats = ponds?.map(p => {
      const pExp = exp?.filter(e => e.pond_id === p.id).reduce((a, b) => a + Number(b.amount), 0) || 0;
      const pSale = sale?.filter(s => s.pond_id === p.id).reduce((a, b) => a + Number(b.amount), 0) || 0;
      return { name: p.name, exp: pExp, sale: pSale, profit: pSale - pExp };
    }) || [];

    setStats({ totalExp, totalSale, netProfit: totalSale - totalExp });
    setPondStats(pStats);
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">রিপোর্ট ও বিশ্লেষণ</h1>
          <p className="text-slate-500 font-bold">আপনার খামারের পূর্ণাঙ্গ আর্থিক চিত্র</p>
        </div>
        <button onClick={() => window.print()} className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl">📥 PDF ডাউনলোড</button>
      </div>

      <div id="print-content" className="space-y-8 print:p-10 print:bg-white">
        <div className="hidden print:block text-center border-b-4 border-blue-600 pb-6 mb-8">
           <h1 className="text-4xl font-black text-slate-800">{user.farm_name || 'মৎস্য খামার'}</h1>
           <p className="font-bold text-slate-500 mt-2">রিপোর্ট জেনারেট তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 print:border-2">
            <h3 className="text-xl font-black text-slate-800 mb-8">আর্থিক সারসংক্ষেপ</h3>
            <div className="space-y-6">
              <div className="flex justify-between border-b border-slate-50 pb-4">
                <span className="text-slate-400 font-bold">মোট বিক্রয়</span>
                <span className="font-black text-green-600 text-xl">৳ {stats.totalSale.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-4">
                <span className="text-slate-400 font-bold">মোট খরচ</span>
                <span className="font-black text-rose-500 text-xl">৳ {stats.totalExp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-xl font-black text-slate-800">নীট লাভ</span>
                <span className={`text-3xl font-black ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>৳ {stats.netProfit.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-600 p-10 rounded-[3rem] text-white flex flex-col justify-center items-center text-center print:bg-slate-50 print:text-slate-900 print:border-2">
             <h3 className="text-2xl font-black mb-2">খামারের দক্ষতা</h3>
             <div className="text-6xl font-black">{stats.totalSale > 0 ? ((stats.netProfit / stats.totalSale) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden print:border-2">
          <h3 className="text-xl font-black text-slate-800 mb-8">পুকুর ভিত্তিক তালিকা</h3>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">খরচ</th>
                <th className="px-8 py-6">বিক্রয়</th>
                <th className="px-8 py-6">লাভ/ক্ষতি</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pondStats.map((p, i) => (
                <tr key={i}>
                  <td className="px-8 py-6 font-black">{p.name}</td>
                  <td className="px-8 py-6 text-rose-500">৳{p.exp.toLocaleString()}</td>
                  <td className="px-8 py-6 text-green-600">৳{p.sale.toLocaleString()}</td>
                  <td className={`px-8 py-6 font-black ${p.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>৳{p.profit.toLocaleString()}</td>
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
          .shadow-sm, .shadow-xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
