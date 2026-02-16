
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(6);
  const [feedingRate, setFeedingRate] = useState(3);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('ponds').select(`*, stocking_records(*)`);
    if (data && data.length > 0) {
      const processed = data.map(p => {
        const totalW = p.stocking_records?.reduce((a:any, b:any) => a + Number(b.total_weight_kg), 0) || 0;
        const totalC = p.stocking_records?.reduce((a:any, b:any) => a + Number(b.count), 0) || 0;
        return { ...p, biomass: totalW, fishCount: totalC };
      });
      setPonds(processed);
      setSelectedPond(processed[0]);
    }
    setLoading(false);
  };

  const getProjection = (biomass: number, months: number) => {
    // Standard growth multiplier: 1.25x to 2x depending on management
    const multiplier = 1 + (months * 0.25); 
    const finalBiomass = biomass * multiplier;
    const dailyFeed = biomass * (feedingRate / 100);
    return { current: biomass, final: finalBiomass, daily: dailyFeed, total: dailyFeed * 30 * months };
  };

  const proj = selectedPond ? getProjection(selectedPond.biomass, duration) : null;

  if (loading) return <div className="py-20 text-center font-black text-blue-600">খামারের ডাটা বিশ্লেষণ করা হচ্ছে...</div>;

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-800">স্মার্ট ফিড ও গ্রোথ গাইড</h1>
        {selectedPond && (
           <div className="bg-green-50 text-green-600 px-5 py-2 rounded-full font-black text-xs uppercase">
              বিশ্লেষণ পুকুর: {selectedPond.name}
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-slate-100 space-y-8 h-fit shadow-sm">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">পুকুর নির্বাচন করুন</label>
            <select 
              value={selectedPond?.id} 
              onChange={e => setSelectedPond(ponds.find(p => p.id === e.target.value))} 
              className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black border-none outline-none appearance-none cursor-pointer"
            >
              {ponds.map(p => <option key={p.id} value={p.id}>{p.name} ({p.fishCount} পিস)</option>)}
            </select>
          </div>
          
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">চাষের সময়কাল: {duration} মাস</label>
            <input type="range" min="3" max="12" value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
            <div className="flex justify-between text-[10px] font-black text-slate-300">
               <span>৩ মাস</span>
               <span>১২ মাস</span>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">💡</div>
            <p className="text-xs font-black text-blue-400 mb-2 uppercase tracking-widest text-center">মাছ চাষ পরামর্শ</p>
            <p className="text-sm opacity-80 leading-relaxed font-medium text-center">আপনার পুকুরে বর্তমানে মোট {selectedPond?.fishCount.toLocaleString()} পিস মাছ আছে। মাছের গ্রোথ ঠিক রাখতে নিয়মিত {proj?.daily.toFixed(1)} কেজি খাবার দিন।</p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdviceCard label="বর্তমান মজুদ মাছ" value={`${selectedPond?.fishCount.toLocaleString()} পিস`} icon="🐟" color="blue" />
            <AdviceCard label="দৈনিক খাবারের টার্গেট" value={`${proj?.daily.toFixed(1)} কেজি`} icon="🌾" color="green" />
            <AdviceCard label="টার্গেট হার্ভেস্টিং ওজন" value={`${proj?.final.toFixed(1)} কেজি`} icon="🧺" color="indigo" />
            <AdviceCard label="প্রয়োজনীয় মোট খাবার" value={`${proj?.total.toFixed(0)} কেজি`} icon="📦" color="rose" />
          </div>

          {selectedPond?.biomass === 0 && (
            <div className="bg-rose-50 border border-rose-100 p-8 rounded-[3rem] text-center">
               <p className="text-rose-600 font-black italic">সতর্কতা: এই পুকুরে এখনো মাছ মজুদ করা হয়নি! পুকুরসমূহ পেজে গিয়ে মাছের সংখ্যা ও ওজন যোগ করুন।</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdviceCard = ({ label, value, icon, color }: any) => {
  const colors: any = { blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600', indigo: 'bg-indigo-50 text-indigo-600', rose: 'bg-rose-50 text-rose-600' };
  return (
    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-xl transition-shadow">
       <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${colors[color]}`}>{icon}</div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-black text-slate-800">{value}</p>
       </div>
    </div>
  );
}

export default AdvisoryPage;
