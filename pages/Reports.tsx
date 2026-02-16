
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const ReportsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [stats, setStats] = useState({ totalExp: 0, totalSale: 0, netProfit: 0 });
  const [pondStats, setPondStats] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [selectedPondId, setSelectedPondId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReportData(); }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [expRes, saleRes, pondRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user.id),
        supabase.from('sales').select('*').eq('user_id', user.id),
        supabase.from('ponds').select('*').eq('user_id', user.id)
      ]);

      const exp = expRes.data || [];
      const sale = saleRes.data || [];
      const allPonds = pondRes.data || [];
      setPonds(allPonds as Pond[]);

      const calculate = (pondId: string) => {
        const filteredExp = pondId === 'all' ? exp : exp.filter(e => e.pond_id === pondId);
        const filteredSale = pondId === 'all' ? sale : sale.filter(s => s.pond_id === pondId);
        
        const totalExp = filteredExp.reduce((a, b) => a + Number(b.amount), 0);
        const totalSale = filteredSale.reduce((a, b) => a + Number(b.amount), 0);
        
        return { totalExp, totalSale, netProfit: totalSale - totalExp };
      };

      const mainStats = calculate(selectedPondId);
      setStats(mainStats);

      const pStats = allPonds.map(p => {
        const pExp = exp.filter(e => e.pond_id === p.id).reduce((a, b) => a + Number(b.amount), 0);
        const pSale = sale.filter(s => s.pond_id === p.id).reduce((a, b) => a + Number(b.amount), 0);
        return { 
          id: p.id,
          name: p.name, 
          exp: pExp, 
          sale: pSale, 
          profit: pSale - pExp 
        };
      });

      setPondStats(pStats);
    } catch (e) { 
      console.error(e); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedPondId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print:hidden">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">আর্থিক রিপোর্ট</h1>
          <p className="text-slate-500 font-bold">পুকুর ভিত্তিক আয়-ব্যয়ের সামগ্রিক চিত্র</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <select 
            value={selectedPondId} 
            onChange={e => setSelectedPondId(e.target.value)}
            className="px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">সকল পুকুর</option>
            {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button onClick={() => window.print()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl">📥 PDF রিপোর্ট</button>
        </div>
      </div>

      <div id="print-content" className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">মোট বিক্রয়</p>
            <h2 className="text-5xl font-black text-green-600 tracking-tighter">৳ {stats.totalSale.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 text-center">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">মোট খরচ</p>
            <h2 className="text-5xl font-black text-rose-600 tracking-tighter">৳ {stats.totalExp.toLocaleString()}</h2>
          </div>
          <div className={`p-10 rounded-[3rem] shadow-2xl text-center ${stats.netProfit >= 0 ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}`}>
            <p className="text-xs font-black opacity-70 uppercase tracking-widest mb-4">নীট লাভ/ক্ষতি</p>
            <h2 className="text-5xl font-black tracking-tighter">৳ {stats.netProfit.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-2xl font-black text-slate-800 mb-8">📊 পুকুর ভিত্তিক বিস্তারিত</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-6">পুকুর</th>
                  <th className="px-8 py-6">মোট খরচ (৳)</th>
                  <th className="px-8 py-6">মোট বিক্রয় (৳)</th>
                  <th className="px-8 py-6 text-right">ব্যালেন্স অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-20 font-bold text-blue-600 animate-pulse">প্রসেস হচ্ছে...</td></tr>
                ) : pondStats.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-6 font-black text-slate-800">{p.name}</td>
                    <td className="px-8 py-6 text-rose-500 font-black">৳ {p.exp.toLocaleString()}</td>
                    <td className="px-8 py-6 text-green-600 font-black">৳ {p.sale.toLocaleString()}</td>
                    <td className={`px-8 py-6 text-right font-black ${p.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {p.profit >= 0 ? '৳' + p.profit.toLocaleString() + ' লাভ' : '৳' + Math.abs(p.profit).toLocaleString() + ' ক্ষতি'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
