
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
    const { data: expenses } = await supabase.from('expenses').select('*');
    const { data: sales } = await supabase.from('sales').select('*');
    const { data: ponds } = await supabase.from('ponds').select('*').eq('is_archived', false);

    const totalExp = expenses?.reduce((a, b) => a + Number(b.amount), 0) || 0;
    const totalSale = sales?.reduce((a, b) => a + Number(b.amount), 0) || 0;

    const pStats = ponds?.map(p => {
      const pExp = expenses?.filter(e => e.pond_id === p.id).reduce((a, b) => a + Number(b.amount), 0) || 0;
      const pSale = sales?.filter(s => s.pond_id === p.id).reduce((a, b) => a + Number(b.amount), 0) || 0;
      return {
        name: p.name,
        expense: pExp,
        sale: pSale,
        profit: pSale - pExp
      };
    }) || [];

    setStats({ totalExp, totalSale, netProfit: totalSale - totalExp });
    setPondStats(pStats);
    setLoading(false);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-3xl font-black text-slate-800">রিপোর্ট ও বিশ্লেষণ</h1>
        <button 
          onClick={handleDownloadPDF}
          className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-blue-600 transition-all"
        >
          <span>📥</span>
          <span>পিডিএফ ডাউনলোড</span>
        </button>
      </div>

      {/* Print-only Header */}
      <div className="hidden print:block text-center mb-10">
        <h1 className="text-4xl font-black text-blue-600 mb-2">মৎস্য খামার রিপোর্ট</h1>
        <p className="font-bold text-slate-500">তারিখ: {new Date().toLocaleDateString('bn-BD')}</p>
        <div className="h-1 bg-blue-600 w-20 mx-auto mt-4 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl">
          <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
            <span className="bg-blue-50 p-2 rounded-xl">📊</span> লাভ-ক্ষতি বিশ্লেষণ
          </h3>
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <span className="text-slate-400 font-bold">মোট বিক্রয়</span>
              <span className="font-black text-green-600 text-xl">৳ {stats.totalSale.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-4">
              <span className="text-slate-400 font-bold">মোট খরচ</span>
              <span className="font-black text-rose-500 text-xl">৳ {stats.totalExp.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="text-xl font-black text-slate-800">নীট মুনাফা</span>
              <span className={`text-2xl font-black ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                ৳ {stats.netProfit.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">📈</div>
          <h3 className="text-xl font-black text-slate-800 mb-2">খামারের দক্ষতা (FCR)</h3>
          <p className="text-slate-400 font-bold text-sm mb-6 max-w-xs">আপনার প্রযুক্ত খাবার এবং মাছের বৃদ্ধির অনুপাত</p>
          <div className="text-5xl font-black text-blue-600">১.৫</div>
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">গড় FCR স্কোর</p>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-2">
           <span className="bg-blue-50 p-2 rounded-xl">🌊</span> পুকুর ভিত্তিক পরিসংখ্যান
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">পুকুরের নাম</th>
                <th className="px-8 py-6">মোট খরচ (৳)</th>
                <th className="px-8 py-6">মোট বিক্রয় (৳)</th>
                <th className="px-8 py-6">বর্তমান মুনাফা (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {pondStats.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-800">{p.name}</td>
                  <td className="px-8 py-6 text-rose-500 font-bold">{p.expense.toLocaleString()}</td>
                  <td className="px-8 py-6 text-green-600 font-bold">{p.sale.toLocaleString()}</td>
                  <td className={`px-8 py-6 font-black ${p.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                    {p.profit.toLocaleString()}
                  </td>
                </tr>
              ))}
              {pondStats.length === 0 && (
                <tr><td colSpan={4} className="py-20 text-center font-bold text-slate-300 italic">কোন তথ্য নেই</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print CSS */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .bg-white { border: none !important; box-shadow: none !important; }
          table { width: 100% !important; border: 1px solid #e2e8f0 !important; }
          th { background: #f8fafc !important; }
          tr { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
