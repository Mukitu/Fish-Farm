
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
    <div className="space-y-8 animate-in fade-in duration-500 font-sans">
      <div className="flex justify-between items-center print:hidden">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">রিপোর্ট ও বিশ্লেষণ</h1>
          <p className="text-slate-500 font-bold">আপনার খামারের পূর্ণাঙ্গ আর্থিক চিত্র</p>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-blue-600 transition-all shadow-xl"
        >
          <span>📥</span> PDF রিপোর্ট ডাউনলোড
        </button>
      </div>

      <div id="print-area" className="space-y-8 print:p-8 print:bg-white">
        {/* Print Header - Only visible in print */}
        <div className="hidden print:block text-center border-b-4 border-blue-600 pb-6 mb-8">
           <h1 className="text-4xl font-black text-slate-800">{user.farm_name || 'মৎস্য খামার'}</h1>
           <p className="font-bold text-slate-500 mt-2">রিপোর্ট জেনারেট তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
           <p className="text-sm text-blue-600 font-black">মালিক: {user.full_name || user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 print:border-2">
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
          
          <div className="bg-blue-600 p-10 rounded-[3rem] text-white flex flex-col justify-center items-center text-center shadow-2xl print:bg-slate-100 print:text-slate-800 print:border-2 print:shadow-none">
             <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center text-4xl mb-6 print:bg-blue-100">📊</div>
             <h3 className="text-2xl font-black mb-2">খামারের দক্ষতা</h3>
             <p className="opacity-80 font-bold text-sm mb-6">বর্তমান প্রবৃদ্ধি হার</p>
             <div className="text-6xl font-black">{stats.totalSale > 0 ? ((stats.netProfit / stats.totalSale) * 100).toFixed(1) : 0}%</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden print:border-2">
          <h3 className="text-xl font-black text-slate-800 mb-8">পুকুর ভিত্তিক লাভ-ক্ষতি তালিকা</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest print:bg-slate-100">
                <tr>
                  <th className="px-8 py-6">পুকুর</th>
                  <th className="px-8 py-6">মোট খরচ (৳)</th>
                  <th className="px-8 py-6">মোট বিক্রয় (৳)</th>
                  <th className="px-8 py-6">মুনাফার অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-slate-700 font-bold">
                {pondStats.map((p, i) => (
                  <tr key={i} className="print:bg-white">
                    <td className="px-8 py-6 font-black text-slate-800">{p.name}</td>
                    <td className="px-8 py-6 text-rose-500">৳{p.exp.toLocaleString()}</td>
                    <td className="px-8 py-6 text-green-600">৳{p.sale.toLocaleString()}</td>
                    <td className={`px-8 py-6 ${p.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {p.profit >= 0 ? 'লাভ' : 'ক্ষতি'} (৳{Math.abs(p.profit).toLocaleString()})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Footer */}
        <div className="hidden print:block text-center text-[10px] text-slate-400 font-bold pt-12">
          &copy; মৎস্য খামার - আপনার খামারের ডিজিটাল সঙ্গী। <br /> মুুকিতুল ইসলাম নিশাত কর্তৃক প্রস্তুতকৃত।
        </div>
      </div>

      <style>{`
        @media print {
          /* Hide Sidebar and Header */
          aside, header, nav, button { display: none !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; }
          body { background: white !important; }
          
          /* Full width print area */
          #print-area { width: 100% !important; border: none !important; }
          .rounded-[3rem], .rounded-[4rem] { border-radius: 1rem !important; }
          .shadow-sm, .shadow-2xl { box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
