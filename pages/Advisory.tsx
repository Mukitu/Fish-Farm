
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';
import { GoogleGenAI } from "@google/genai";

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
  const [latestWaterLog, setLatestWaterLog] = useState<any>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase.from('ponds').select(`*, stocking_records(*)`);
      if (pData && pData.length > 0) {
        const processed = pData.map(p => ({
          ...p,
          biomass: p.stocking_records?.reduce((a:any, b:any) => a + Number(b.total_weight_kg), 0) || 0,
          fishCount: p.stocking_records?.reduce((a:any, b:any) => a + Number(b.count), 0) || 0
        }));
        setPonds(processed);
        setSelectedPond(processed[0]);
        await fetchWaterLog(processed[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWaterLog = async (pondId: string) => {
    const { data } = await supabase.from('water_logs')
      .select('*')
      .eq('pond_id', pondId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    setLatestWaterLog(data);
    if (data) generateAIAdvice(data, ponds.find(p => p.id === pondId));
  };

  const generateAIAdvice = async (water: any, pond: any) => {
    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        একজন অভিজ্ঞ মৎস্য বিজ্ঞানী হিসেবে পরামর্শ দিন।
        পুকুরের নাম: ${pond.name}
        প্রধান মাছ: ${pond.fish_type}
        মাছের সংখ্যা: ${pond.fishCount}
        বর্তমান বায়োমাস: ${pond.biomass} কেজি
        
        পানির বর্তমান মান:
        অক্সিজেন (DO): ${water.oxygen} mg/L
        পিএইচ (pH): ${water.ph}
        তাপমাত্রা: ${water.temp} °C
        
        এই মানের ওপর ভিত্তি করে ৩টি পয়েন্টে ছোট পরামর্শ দিন (বাংলায়)। যদি মান খারাপ হয় তবে দ্রুত কি করতে হবে তা জানান। 
        খাবারের পরিমাণ সম্পর্কেও বলুন।
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      setAiAdvice(response.text || 'পরামর্শ তৈরি করা যায়নি।');
    } catch (err) {
      setAiAdvice('AI পরামর্শ লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে পানির মান পুনরায় চেক করুন।');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePondChange = (id: string) => {
    const pond = ponds.find(p => p.id === id);
    setSelectedPond(pond);
    setAiAdvice('');
    fetchWaterLog(id);
  };

  if (loading) return <div className="py-20 text-center font-black text-blue-600 animate-pulse">খামারের ডাটা বিশ্লেষণ করা হচ্ছে...</div>;

  return (
    <div className="space-y-10 pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">স্মার্ট এআই পরামর্শ</h1>
          <p className="text-slate-500 font-bold">পানির মানের ওপর ভিত্তি করে বৈজ্ঞানিক গাইড</p>
        </div>
        <select value={selectedPond?.id} onChange={e => handlePondChange(e.target.value)} className="px-6 py-4 bg-white rounded-2xl font-black shadow-sm border-none outline-none ring-1 ring-slate-100">
          {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Real-time Status */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-lg font-black text-slate-800 border-b pb-4">সর্বশেষ পানির রিপোর্ট</h3>
              {latestWaterLog ? (
                <div className="grid grid-cols-1 gap-4">
                   <div className="flex justify-between items-center p-4 bg-blue-50 rounded-2xl">
                      <span className="font-bold text-slate-500">অক্সিজেন (DO)</span>
                      <span className={`text-xl font-black ${latestWaterLog.oxygen < 5 ? 'text-rose-600' : 'text-blue-600'}`}>{latestWaterLog.oxygen} <span className="text-xs">mg/L</span></span>
                   </div>
                   <div className="flex justify-between items-center p-4 bg-green-50 rounded-2xl">
                      <span className="font-bold text-slate-500">পিএইচ (pH)</span>
                      <span className="text-xl font-black text-green-700">{latestWaterLog.ph}</span>
                   </div>
                   <div className="flex justify-between items-center p-4 bg-orange-50 rounded-2xl">
                      <span className="font-bold text-slate-500">তাপমাত্রা</span>
                      <span className="text-xl font-black text-orange-600">{latestWaterLog.temp}°C</span>
                   </div>
                   <p className="text-[10px] text-slate-400 text-center font-bold italic">আপডেট: {new Date(latestWaterLog.date).toLocaleDateString('bn-BD')}</p>
                </div>
              ) : (
                <div className="text-center py-10">
                   <p className="text-rose-500 font-bold mb-4">এই পুকুরের কোনো ওয়াটার লগ পাওয়া যায়নি!</p>
                   <p className="text-xs text-slate-400">ড্যাশবোর্ড থেকে নিয়মিত পানির মান আপডেট করুন।</p>
                </div>
              )}
           </div>
        </div>

        {/* AI Suggestions Card */}
        <div className="lg:col-span-2">
           <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">🤖</div>
              <div className="relative z-10 space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-2xl">💡</div>
                    <h3 className="text-2xl font-black">মৎস্য বিজ্ঞানীর পরামর্শ (AI)</h3>
                 </div>

                 {analyzing ? (
                   <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded w-full"></div>
                      <div className="h-4 bg-white/10 rounded w-5/6"></div>
                      <p className="text-blue-400 font-bold italic">পানির মান বিশ্লেষণ করা হচ্ছে...</p>
                   </div>
                 ) : (
                   <div className="prose prose-invert max-w-none">
                      {aiAdvice ? (
                        <div className="text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                           {aiAdvice}
                        </div>
                      ) : (
                        <p className="text-slate-500 font-bold">পানির সঠিক মান প্রদান করলে এখানে আপনি বিশেষজ্ঞ পরামর্শ পাবেন।</p>
                      )}
                   </div>
                 )}

                 <div className="pt-8 border-t border-white/10 grid grid-cols-2 gap-4">
                    <div className="text-center">
                       <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">প্রস্তাবিত ফিডিং রেট</p>
                       <p className="text-xl font-black text-blue-400">{selectedPond?.biomass > 0 ? (selectedPond.biomass * 0.03).toFixed(1) : 0} কেজি/দিন</p>
                    </div>
                    <div className="text-center">
                       <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">ঝুঁকি মাত্রা</p>
                       <p className={`text-xl font-black ${latestWaterLog?.oxygen < 4 ? 'text-rose-500' : 'text-green-500'}`}>
                          {latestWaterLog?.oxygen < 4 ? 'উচ্চ ঝুঁকি' : 'স্বাভাবিক'}
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryPage;
