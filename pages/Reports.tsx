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
      if (user.id === 'guest-id') {
        const demoPonds = [
          { id: '1', name: 'পুকুর ১ (রুই)' }, 
          { id: '2', name: 'পুকুর ২ (কাতলা)' },
          { id: '3', name: 'পুকুর ৩ (পাঙ্গাস)' },
          { id: '4', name: 'পুকুর ৪ (তেলাপিয়া)' },
          { id: '5', name: 'পুকুর ৫ (কার্প)' }
        ];
        setPonds(demoPonds as any);
        const demoStats = [
          { id: '1', name: 'পুকুর ১ (রুই)', exp: 14600, sale: 45000, profit: 30400 },
          { id: '2', name: 'পুকুর ২ (কাতলা)', exp: 3500, sale: 28000, profit: 24500 },
          { id: '3', name: 'পুকুর ৩ (পাঙ্গাস)', exp: 18000, sale: 35000, profit: 17000 },
          { id: '4', name: 'পুকুর ৪ (তেলাপিয়া)', exp: 5000, sale: 22000, profit: 17000 },
          { id: '5', name: 'পুকুর ৫ (কার্প)', exp: 4500, sale: 15000, profit: 10500 }
        ];
        setPondStats(demoStats);

        const filtered = selectedPondId === 'all' ? demoStats : demoStats.filter(s => s.id === selectedPondId);
        const tExp = filtered.reduce((a, b) => a + b.exp, 0);
        const tSale = filtered.reduce((a, b) => a + b.sale, 0);
        setStats({ totalExp: tExp, totalSale: tSale, netProfit: tSale - tExp });
        setLoading(false);
        return;
      }

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
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">আর্থিক রিপোর্ট</h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">পুকুর ভিত্তিক আয়-ব্যয়ের সামগ্রিক চিত্র</p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <select 
            value={selectedPondId} 
            onChange={e => setSelectedPondId(e.target.value)}
            className="flex-1 sm:flex-initial px-4 py-3 bg-white border border-slate-200 rounded-2xl font-bold shadow-sm outline-none text-xs sm:text-sm focus:ring-2 focus:ring-blue-600"
          >
            <option value="all">সকল পুকুর</option>
            {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button 
            onClick={() => window.print()} 
            className="px-5 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-slate-800 active:scale-95 transition-all flex items-center gap-1.5"
          >
            📥 প্রিন্ট / PDF
          </button>
        </div>
      </div>

      <div id="print-content" className="space-y-6 sm:space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
            <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2">মোট বিক্রয়</p>
            <h2 className="text-2xl sm:text-4xl font-black text-green-600 tracking-tight">৳ {stats.totalSale.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 text-center">
            <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-2">মোট খরচ</p>
            <h2 className="text-2xl sm:text-4xl font-black text-rose-600 tracking-tight">৳ {stats.totalExp.toLocaleString()}</h2>
          </div>
          <div className={`p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-xl text-center ${stats.netProfit >= 0 ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}`}>
            <p className="text-[10px] sm:text-xs font-black opacity-80 uppercase tracking-widest mb-2">নীট লাভ/ক্ষতি</p>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">৳ {stats.netProfit.toLocaleString()}</h2>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
          <h3 className="text-lg sm:text-2xl font-black text-slate-800 mb-6">📊 পুকুর ভিত্তিক আয়-ব্যয় তালিকা</h3>
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
                <tr>
                  <th className="px-8 py-5">পুকুর</th>
                  <th className="px-8 py-5">মোট খরচ (৳)</th>
                  <th className="px-8 py-5">মোট বিক্রয় (৳)</th>
                  <th className="px-8 py-5 text-right">ব্যালেন্স অবস্থা</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-12 font-bold text-blue-600 animate-pulse text-sm">হিসাব করা হচ্ছে...</td></tr>
                ) : pondStats.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-8 py-5 font-black text-slate-800">{p.name}</td>
                    <td className="px-8 py-5 text-rose-500 font-black">৳ {p.exp.toLocaleString()}</td>
                    <td className="px-8 py-5 text-green-600 font-black">৳ {p.sale.toLocaleString()}</td>
                    <td className={`px-8 py-5 text-right font-black ${p.profit >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {p.profit >= 0 ? '৳' + p.profit.toLocaleString() + ' (লাভ)' : '৳' + Math.abs(p.profit).toLocaleString() + ' (ক্ষতি)'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-blue-600 font-bold animate-pulse text-sm">হিসাব করা হচ্ছে...</div>
            ) : pondStats.map((p) => (
              <div key={p.id} className="py-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-800 text-base">{p.name}</h4>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${p.profit >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                    {p.profit >= 0 ? '৳' + p.profit.toLocaleString() + ' লাভ' : '৳' + Math.abs(p.profit).toLocaleString() + ' ক্ষতি'}
                  </span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-1">
                  <span className="text-slate-500">বিক্রয়: <strong className="text-green-600">৳ {p.sale.toLocaleString()}</strong></span>
                  <span className="text-slate-500">খরচ: <strong className="text-rose-600">৳ {p.exp.toLocaleString()}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-content, #print-content * { visibility: visible; }
          #print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ReportsPage;
