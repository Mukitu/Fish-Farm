
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);
  const [loading, setLoading] = useState(true);
  const [duration, setDuration] = useState(6); // Months
  const [stockingDensity, setStockingDensity] = useState(40); // Fish per decimal

  useEffect(() => {
    fetchPonds();
  }, []);

  const fetchPonds = async () => {
    setLoading(true);
    const { data } = await supabase.from('ponds').select('*');
    if (data && data.length > 0) {
      setPonds(data as Pond[]);
      setSelectedPond(data[0] as Pond);
    }
    setLoading(false);
  };

  const calculateAdvice = (area: number, fishType: string, months: number, density: number) => {
    // Trusted data simulation (Simplified Bio-logical logic)
    let growthRate = 0.8; // default
    if (fishType.includes('তেলাপিয়া')) growthRate = 0.9;
    if (fishType.includes('পাঙ্গাস')) growthRate = 1.2;
    if (fishType.includes('রুই')) growthRate = 0.7;

    const totalFish = area * density;
    const finalWeightGm = (growthRate * months * 120); // Estimation formula
    const totalExpectedYieldKg = (totalFish * finalWeightGm) / 1000;
    
    // FCR Logic (Food Conversion Ratio)
    const totalFeedKg = totalExpectedYieldKg * 1.5; 

    return {
      fishCount: totalFish.toFixed(0),
      expectedWeight: finalWeightGm.toFixed(0),
      totalYield: totalExpectedYieldKg.toFixed(0),
      totalFeed: totalFeedKg.toFixed(0),
      lime: (area * 1).toFixed(1),
      salt: (area * 0.5).toFixed(1)
    };
  };

  if (loading) return <div className="py-20 text-center font-black animate-pulse">স্মার্ট গাইড তৈরি হচ্ছে...</div>;

  const advice = selectedPond ? calculateAdvice(selectedPond.area, selectedPond.fish_type, duration, stockingDensity) : null;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">স্মার্ট চাষ গাইড ও প্রোজেকশন</h1>
          <p className="text-slate-500 font-bold mt-2">আপনার পুকুরের ধরন বুঝে আধুনিক পরামর্শ নিন</p>
        </div>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> এআই গাইড সচল
        </div>
      </div>

      {ponds.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">পুকুর নির্বাচন করুন</label>
                  <select 
                    value={selectedPond?.id} 
                    onChange={e => setSelectedPond(ponds.find(p => p.id === e.target.value) || null)}
                    className="w-full px-5 py-4 bg-slate-50 rounded-2xl font-black text-slate-700 outline-none"
                  >
                    {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">চাষের মেয়াদ (মাস)</label>
                  <div className="flex flex-wrap gap-2">
                    {[6, 7, 9, 10, 12].map(m => (
                      <button 
                        key={m} 
                        onClick={() => setDuration(m)}
                        className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${duration === m ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                      >
                        {m} মাস
                      </button>
                    ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">মাছ ছাড়ার ঘনত্ব (প্রতি শতাংশে)</label>
                  <input 
                    type="range" min="10" max="200" step="5" 
                    value={stockingDensity} 
                    onChange={e => setStockingDensity(Number(e.target.value))}
                    className="w-full h-2 bg-blue-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-xs font-black text-blue-600">
                    <span>১০ টি</span>
                    <span>{stockingDensity} টি</span>
                    <span>২০০ টি</span>
                  </div>
               </div>
            </div>
            
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white">
               <h4 className="font-black text-blue-400 mb-4 uppercase text-xs tracking-widest">বিশেষ টিপস</h4>
               <p className="text-sm font-medium leading-relaxed opacity-80">
                 মাছকে সবসময় সকালে এবং বিকেলে খাবার দিন। মেঘলা দিনে বা পানির অক্সিজেন কমে গেলে খাবার প্রয়োগ বন্ধ রাখুন।
               </p>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl">📈</div>
               <h3 className="text-2xl font-black text-slate-800 mb-8">সম্ভাব্য উৎপাদনের ফলাফল</h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <ResultItem label="মোট পোনা মজুদ" value={`${advice?.fishCount} টি`} icon="🐟" />
                  <ResultItem label="মাছের গড় ওজন (সম্ভাব্য)" value={`${advice?.expectedWeight} গ্রাম`} icon="⚖️" />
                  <ResultItem label="মোট সম্ভাব্য উৎপাদন" value={`${advice?.totalYield} কেজি`} icon="🧺" />
                  <ResultItem label="প্রয়োজনীয় মোট খাবার" value={`${advice?.totalFeed} কেজি`} icon="🌾" />
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">প্রস্তুতির জন্য চুন</p>
                  <p className="text-3xl font-black text-blue-700">{advice?.lime} কেজি</p>
               </div>
               <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">প্রস্তুতির জন্য লবণ</p>
                  <p className="text-3xl font-black text-indigo-700">{advice?.salt} কেজি</p>
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-32 text-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
           <p className="text-4xl mb-4">🌊</p>
           <p className="text-slate-400 font-black text-xl">প্রথমে আপনার পুকুর যোগ করুন!</p>
        </div>
      )}
    </div>
  );
};

const ResultItem = ({ label, value, icon }: any) => (
  <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] hover:bg-slate-100 transition-colors">
    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm">{icon}</div>
    <div>
       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

export default AdvisoryPage;
