
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';
import { GoogleGenAI } from "@google/genai";

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
  const [latestWaterLog, setLatestWaterLog] = useState<any>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [groundingLinks, setGroundingLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pData } = await supabase.from('ponds').select(`*, stocking_records(*)`).eq('user_id', user.id);
      if (pData && pData.length > 0) {
        const processed = pData.map(p => ({
          ...p,
          biomass: p.stocking_records?.reduce((a:any, b:any) => a + Number(b.total_weight_kg), 0) || 0,
          fishCount: p.stocking_records?.reduce((a:any, b:any) => a + Number(b.count), 0) || 0
        }));
        setPonds(processed);
        setSelectedPond(processed[0]);
        await fetchWaterLog(processed[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchWaterLog = async (pondId: string) => {
    setAnalyzing(true);
    const { data } = await supabase.from('water_logs')
      .select('*')
      .eq('pond_id', pondId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    setLatestWaterLog(data);
    const currentPond = ponds.find(p => p.id === pondId);
    
    if (data && currentPond) {
      await generateAIAdvice(data, currentPond);
    } else {
      setAiAdvice('এই পুকুরের কোনো সাম্প্রতিক পানির লগ পাওয়া যায়নি। ড্যাশবোর্ড থেকে পানির মান (DO, pH, Temp) আপডেট করলে এখানে AI পরামর্শ পাবেন।');
      setAnalyzing(false);
    }
  };

  const generateAIAdvice = async (water: any, pond: any) => {
    setAnalyzing(true);
    setAiAdvice('');
    setGroundingLinks([]);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        আপনি একজন মৎস্য বিজ্ঞানী। নিচের বাস্তব তথ্যের ওপর ভিত্তি করে খামারিকে বৈজ্ঞানিক পরামর্শ দিন। 
        তথ্যগুলো অবশ্যই FAO, মৎস্য অধিদপ্তর বাংলাদেশ বা নির্ভরযোগ্য মৎস্য চাষ ম্যানুয়াল থেকে যাচাইকৃত হতে হবে।
        
        খামারের তথ্য:
        পুকুরের নাম: ${pond.name}
        মাছের প্রজাতি: ${pond.fish_type}
        মাছের সংখ্যা: ${pond.fishCount}
        বর্তমান বায়োমাস: ${pond.biomass} কেজি
        
        পানির বর্তমান মান:
        অক্সিজেন (DO): ${water.oxygen} mg/L
        পিএইচ (pH): ${water.ph}
        তাপমাত্রা: ${water.temp} °C
        
        এই মানের প্রেক্ষিতে খামারিকে ৩টি ধাপে করনীয় জানান (বাংলায়)। পানির মান ভালো না হলে দ্রুত সমাধান দিন। 
        খাবারের পরিমাণ সম্পর্কেও সঠিক ধারণা দিন। 
        তথ্যগুলো অবশ্যই নির্ভরযোগ্য ওয়েবসাইট থেকে গুগল সার্চের মাধ্যমে নিশ্চিত করুন।
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setAiAdvice(response.text || 'পরামর্শ তৈরি করা যায়নি।');
      
      // Extract grounding links for transparency and trust
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        setGroundingLinks(chunks);
      }
    } catch (err) {
      console.error(err);
      setAiAdvice('AI পরামর্শ লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আপনার API Key এবং ইন্টারনেট কানেকশন চেক করুন।');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePondChange = (id: string) => {
    const pond = ponds.find(p => p.id === id);
    setSelectedPond(pond);
    fetchWaterLog(id);
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600 animate-pulse">খামারের ডাটা বিশ্লেষণ করা হচ্ছে...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">স্মার্ট এআই পরামর্শ</h1>
          <p className="text-slate-500 font-bold">পানির মানের ওপর ভিত্তি করে বৈজ্ঞানিক গাইড</p>
        </div>
        <select value={selectedPond?.id} onChange={e => handlePondChange(e.target.value)} className="px-6 py-4 bg-white rounded-2xl font-black shadow-sm border-none outline-none ring-1 ring-slate-100 cursor-pointer">
          {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {!selectedPond && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 font-black italic">
           প্রথমে একটি পুকুর যোগ করুন!
        </div>
      )}

      {selectedPond && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                <h3 className="text-lg font-black text-slate-800 border-b pb-4">সর্বশেষ পানির রিপোর্ট</h3>
                {latestWaterLog ? (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center p-5 bg-blue-50 rounded-2xl">
                        <span className="font-bold text-slate-500">অক্সিজেন (DO)</span>
                        <span className={`text-xl font-black ${latestWaterLog.oxygen < 5 ? 'text-rose-600' : 'text-blue-600'}`}>{latestWaterLog.oxygen} <span className="text-xs">mg/L</span></span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-green-50 rounded-2xl">
                        <span className="font-bold text-slate-500">পিএইচ (pH)</span>
                        <span className="text-xl font-black text-green-700">{latestWaterLog.ph}</span>
                    </div>
                    <div className="flex justify-between items-center p-5 bg-orange-50 rounded-2xl">
                        <span className="font-bold text-slate-500">তাপমাত্রা</span>
                        <span className="text-xl font-black text-orange-600">{latestWaterLog.temp}°C</span>
                    </div>
                    <p className="text-[10px] text-slate-400 text-center font-bold italic tracking-wider">সর্বশেষ আপডেট: {new Date(latestWaterLog.date).toLocaleDateString('bn-BD')}</p>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-3xl">
                    <p className="text-rose-500 font-bold mb-4">লগ পাওয়া যায়নি!</p>
                    <p className="text-xs text-slate-400 leading-relaxed px-4">পরামর্শ পেতে ড্যাশবোর্ড থেকে নিয়মিত পানির মান আপডেট করুন।</p>
                  </div>
                )}
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
               <h3 className="text-lg font-black text-slate-800 border-b pb-4 mb-4">পুকুর পরিসংখ্যান</h3>
               <div className="space-y-4">
                  <div className="flex justify-between font-bold text-sm">
                     <span className="text-slate-400">মাছের ধরন:</span>
                     <span className="text-slate-800">{selectedPond.fish_type}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm">
                     <span className="text-slate-400">মোট বায়োমাস:</span>
                     <span className="text-blue-600">{selectedPond.biomass} কেজি</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden h-full border border-slate-800">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl select-none">🧬</div>
                <div className="relative z-10 space-y-8">
                  <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">🤖</div>
                      <div>
                        <h3 className="text-2xl font-black">AI মৎস্য বিজ্ঞানীর পরামর্শ</h3>
                        <p className="text-xs text-blue-400 font-black uppercase tracking-widest">Scientific Guidance powered by Gemini 3 Pro</p>
                      </div>
                  </div>

                  {analyzing ? (
                    <div className="space-y-6 py-6">
                        <div className="h-4 bg-white/5 rounded-full w-3/4 animate-pulse"></div>
                        <div className="h-4 bg-white/5 rounded-full w-full animate-pulse delay-75"></div>
                        <div className="h-4 bg-white/5 rounded-full w-5/6 animate-pulse delay-150"></div>
                        <p className="text-blue-400 font-black italic text-sm animate-pulse">নির্ভরযোগ্য তথ্যসূত্র থেকে আপনার পুকুরের অবস্থা বিশ্লেষণ করা হচ্ছে...</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                        <div className="prose prose-invert max-w-none">
                          <div className="text-slate-300 leading-relaxed font-medium whitespace-pre-wrap text-lg">
                            {aiAdvice}
                          </div>
                        </div>
                        
                        {groundingLinks.length > 0 && (
                          <div className="pt-8 border-t border-white/10">
                            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">নির্ভরযোগ্য তথ্যসূত্র ও গাইডলাইন:</h4>
                            <div className="flex flex-wrap gap-3">
                              {groundingLinks.map((chunk, idx) => (
                                chunk.web && (
                                  <a 
                                    key={idx} 
                                    href={chunk.web.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/50 rounded-xl text-xs font-bold text-blue-400 transition-all flex items-center gap-2 group"
                                  >
                                    <span className="group-hover:translate-x-1 transition-transform">🔗</span> 
                                    {chunk.web.title || 'বৈজ্ঞানিক তথ্যসূত্র'}
                                  </a>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                    </div>
                  )}

                  <div className="pt-10 border-t border-white/5 grid grid-cols-2 gap-8">
                      <div className="bg-white/5 p-6 rounded-3xl">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">প্রস্তাবিত ফিডিং (প্রতিদিন)</p>
                        <p className="text-2xl font-black text-blue-400">
                          {selectedPond?.biomass > 0 ? (selectedPond.biomass * 0.03).toFixed(1) : 0} <span className="text-sm">কেজি</span>
                        </p>
                      </div>
                      <div className="bg-white/5 p-6 rounded-3xl">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">পুকুরের স্বাস্থ্য ঝুঁকি</p>
                        <p className={`text-2xl font-black ${latestWaterLog?.oxygen < 4 ? 'text-rose-500' : 'text-green-500'}`}>
                            {latestWaterLog?.oxygen < 4 ? 'উচ্চ ঝুঁকি' : 'স্বাভাবিক'}
                        </p>
                      </div>
                  </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvisoryPage;
