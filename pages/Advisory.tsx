
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(6);
  const [feedingRate, setFeedingRate] = useState(3); // Standard 3% of body weight

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
    // Standard growth multiplier: 1.5x to 3x depending on duration
    const multiplier = 1 + (months * 0.25);
    const finalBiomass = biomass * multiplier;
    const dailyFeed = biomass * (feedingRate / 100);
    
    return {
      currentBiomass: biomass.toFixed(1),
      finalBiomass: finalBiomass.toFixed(1),
      dailyFeed: dailyFeed.toFixed(2),
      totalFeedProjected: (dailyFeed * 30 * months).toFixed(0)
    };
  };

  const proj = selectedPond ? getProjection(selectedPond.biomass, duration) : null;

  return (
    <div className="space-y-10 pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-800">স্মার্ট ফিড ও গ্রোথ গাইড</h1>
          <p className="text-slate-500 font-bold">বিশ্বস্ত গাণিতিক পদ্ধতিতে খাবারের পরিমাণ নির্ণয়</p>
        </div>
        <div className="px-6 py-3 bg-blue-600 text-white rounded-full font-black text-xs uppercase tracking-widest animate-pulse">
           Live Analysis
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 space-y-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">পুকুর নির্বাচন</label>
                 <select 
                  onChange={e => setSelectedPond(ponds.find(p => p.id === e.target.value))}
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black outline-none border-none"
                 >
                   {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">চাষের সময়কাল: {duration} মাস</label>
                 <div className="flex flex-wrap gap-2">
                    {[6, 7, 9, 10, 12].map(m => (
                      <button key={m} onClick={() => setDuration(m)} className={`px-4 py-2 rounded-xl font-black text-xs ${duration === m ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                        {m} মাস
                      </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">খাবার প্রয়োগ হার: {feedingRate}%</label>
                 <input type="range" min="1.5" max="5" step="0.5" value={feedingRate} onChange={e => setFeedingRate(Number(e.target.value))} className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                 <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase">
                    <span>১.৫% (কম)</span>
                    <span>৫.০% (বেশি)</span>
                 </div>
              </div>
           </div>

           <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
              <h4 className="text-blue-400 font-black uppercase text-xs mb-4">বিশেষজ্ঞের পরামর্শ</h4>
              <p className="text-sm opacity-70 leading-relaxed font-medium">
                মাছের আকার বৃদ্ধির সাথে সাথে খাবারের হার (%) কমিয়ে আনতে হয়। পোনা অবস্থায় ৫% পর্যন্ত দিলেও বড় মাছের ক্ষেত্রে এটি ২% এ নামিয়ে আনুন।
              </p>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AdviceCard label="বর্তমান বায়োমাস" value={`${proj?.currentBiomass} কেজি`} icon="⚖️" color="blue" />
              <AdviceCard label="দৈনিক খাদ্য (সাজেস্টেড)" value={`${proj?.dailyFeed} কেজি`} icon="🌾" color="green" />
              <AdviceCard label="সম্ভাব্য হার্ভেস্টিং ওজন" value={`${proj?.finalBiomass} কেজি`} icon="🧺" color="indigo" />
              <AdviceCard label="প্রয়োজনীয় মোট খাবার" value={`${proj?.totalFeedProjected} কেজি`} icon="📦" color="rose" />
           </div>

           <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 className="text-xl font-black text-slate-800 mb-6">পরিকল্পিত মাসিক চার্ট</h3>
              <div className="space-y-4">
                 {[1, 2, 3, 4, 5, 6].map(step => (
                   <div key={step} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                      <span className="font-black text-slate-400 text-xs uppercase">মাস - ০{step}</span>
                      <span className="font-black text-slate-800">টার্গেট ওজন: {(Number(proj?.currentBiomass) * (1 + step * 0.15)).toFixed(1)} কেজি</span>
                      <span className="text-blue-600 font-black">খাবার: {(Number(proj?.dailyFeed) * (1 + step * 0.1)).toFixed(2)} কেজি/দিন</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const AdviceCard = ({ label, value, icon, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-600'
  };
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
       <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${colors[color]}`}>{icon}</div>
       <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-black text-slate-800">{value}</p>
       </div>
    </div>
  );
}

export default AdvisoryPage;
