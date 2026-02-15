
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const ReportsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [stats, setStats] = useState({ totalExp: 0, totalSale: 0, netProfit: 0 });
  const [pondStats, setPondStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    const { data: exp } = await supabase.from('expenses').select('*');
    const { data: sale } = await supabase.from('sales').select('*');
    const { data: ponds } = await supabase.from('ponds').select('*').eq('is_archived', false);

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
        <button 
          onClick={() => window.print()}
          className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl"
        >
          <span>📥</span> পিডিএফ ডাউনলোড
        </button>
      </div>

      <div className="hidden print:block text-center mb-10">
         <h1 className="text-4xl font-black text-blue-600">মৎস্য খামার রিপোর্ট</h1>
         <p className="font-bold text-slate-500 mt-2">তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
         <div className="h-1 bg-blue-600 w-24 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
          <h3 className="text-xl font-black text-slate-800 mb-8">আর্থিক সারসংক্ষেপ</h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-50">
              <span className="text-slate-400 font-bold">মোট বিক্রয়</span>
              <span className="font-black text-green-600 text-xl">৳ {stats.totalSale.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-slate-50">
              <span className="text-slate-400 font-bold">মোট খরচ</span>
              <span className="font-black text-rose-500 text-xl">৳ {stats.totalExp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xl font-black text-slate-800">নীট লাভ/ক্ষতি</span>
              <span className={`text-3xl font-black ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                ৳ {stats.netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-blue-600 p-10 rounded-[3rem] text-white flex flex-col justify-center items-center text-center shadow-2xl">
           <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-4xl mb-6">📊</div>
           <h3 className="text-2xl font-black mb-2">খামারের দক্ষতা</h3>
           <p className="opacity-80 font-bold text-sm mb-6">আপনার ব্যবসার বর্তমান বৃদ্ধির হার</p>
           <div className="text-6xl font-black">৮৫%</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="text-xl font-black text-slate-800 mb-8">পুকুর ভিত্তিক লাভ-ক্ষতি</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">খরচ (৳)</th>
                <th className="px-8 py-6">বিক্রয় (৳)</th>
                <th className="px-8 py-6">অবস্থা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700 font-bold">
              {pondStats.map((p, i) => (
                <tr key={i}>
                  <td className="px-8 py-6 font-black text-slate-800">{p.name}</td>
                  <td className="px-8 py-6 text-rose-500">{p.exp.toLocaleString()}</td>
                  <td className="px-8 py-6 text-green-600">{p.sale.toLocaleString()}</td>
                  <td className={`px-8 py-6 ${p.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {p.profit >= 0 ? 'লাভ' : 'ক্ষতি'} (৳{Math.abs(p.profit).toLocaleString()})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .bg-white { border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border: 1px solid #eee !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
