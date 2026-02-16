
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { GoogleGenAI } from "@google/genai";

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
  const [latestWater, setLatestWater] = useState<any>(null);
  const [advice, setAdvice] = useState<string>('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      if (data && data.length > 0) {
        setPonds(data);
        setSelectedPond(data[0]);
        await getAdvancedAdvice(data[0]);
      }
    } catch (e) {
      console.error("Fetch Data Error:", e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAdvancedAdvice = async (pond: any) => {
    setAnalyzing(true);
    setAdvice('');
    setSources([]);
    try {
      const { data: water } = await supabase.from('water_logs')
        .select('*')
        .eq('pond_id', pond.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setLatestWater(water);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Detailed Prompt for Professional Guidance
      const prompt = `
        You are a Professional Senior Fisheries Consultant in Bangladesh. 
        Analyze the following pond data and provide a COMPREHENSIVE farming guide in Bengali.
        
        Pond Data:
        - Name: ${pond.name}
        - Area: ${pond.area} decimals (শতাংশ)
        - Fish Type: ${pond.fish_type}
        - Current Water Status: Oxygen: ${water?.oxygen || 'Unknown'}, pH: ${water?.ph || 'Unknown'}, Temp: ${water?.temp || 'Unknown'}.

        Please provide the following in detailed Bengali sections:
        1. **পুকুর প্রস্তুতি ও চুন-লবণ প্রয়োগ**: আয়তন অনুযায়ী কতটুকু চুন ও লবণ কতদিন পর পর দিতে হবে তার সুনির্দিষ্ট ওজন (কেজি)।
        2. **পোনা মজুদ ঘনত্ব**: ${pond.area} শতাংশে কত পিস পোনা ছাড়া সবচেয়ে লাভজনক হবে।
        3. **খাদ্য ও পুষ্টি ব্যবস্থাপনা**: কি ধরণের খাবার এবং সম্পূরক খাদ্য দিলে দ্রুত বৃদ্ধি পাবে।
        4. **রোগবালাই ও ওষুধের নাম**: এই মাছের সাধারণ রোগ এবং বাজারে পাওয়া যায় এমন নির্দিষ্ট কিছু ওষুধের নাম ও প্রয়োগ বিধি।
        5. **লাভ বাড়ানোর গোপন টিপস**: কিভাবে খরচ কমিয়ে লাভ বাড়ানো যায়।

        Use formatting like headers, bullet points and bold text. Base this on BFRI (Bangladesh Fisheries Research Institute) guidelines.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setAdvice(response.text || 'তথ্য সংগ্রহ করা সম্ভব হয়নি।');
      
      // Extracting sources from grounding metadata
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        setSources(groundingChunks);
      }

    } catch (e: any) {
      console.error("AI Error:", e);
      setAdvice('দুঃখিত, এআই সার্ভারে সমস্যা হচ্ছে। অনুগ্রহ করে আপনার ইন্টারনেট কানেকশন চেক করুন।');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePondChange = (id: string) => {
    const p = ponds.find(x => x.id === id);
    if (p) {
      setSelectedPond(p);
      getAdvancedAdvice(p);
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600">খামারের ডাটাবেজ বিশ্লেষণ হচ্ছে...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">AI Fisheries Expert</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
           </div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight">অ্যাডভান্সড চাষ গাইড</h1>
           <p className="text-slate-500 font-bold">বিজ্ঞানসম্মত উপায়ে মৎস্য চাষের পূর্ণাঙ্গ সমাধান</p>
        </div>
        <div className="w-full md:w-auto">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-2">আপনার পুকুর বেছে নিন</label>
          <select 
            value={selectedPond?.id || ''} 
            onChange={e => handlePondChange(e.target.value)} 
            className="w-full md:w-80 px-6 py-4 bg-slate-50 rounded-2xl font-black border-none ring-2 ring-slate-100 shadow-inner focus:ring-4 focus:ring-blue-600/20 transition-all outline-none text-slate-800"
          >
            {ponds.map(p => <option key={p.id} value={p.id}>{p.name} ({p.area} শত.)</option>)}
            {ponds.length === 0 && <option value="">আগে পুকুর যোগ করুন</option>}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Stats Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden relative group">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-700"></div>
             <h3 className="text-lg font-black mb-6 flex items-center gap-2 relative z-10">🧪 পানির বর্তমান মান</h3>
             {latestWater ? (
               <div className="space-y-4 relative z-10">
                  <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">অক্সিজেন (DO)</p>
                    <div className="flex justify-between items-end">
                      <span className="text-2xl font-black text-blue-700">{latestWater.oxygen}</span>
                      <span className="text-[10px] font-bold text-blue-400 mb-1">mg/L</span>
                    </div>
                  </div>
                  <div className="p-5 bg-green-50/50 rounded-2xl border border-green-100">
                    <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">pH মান</p>
                    <span className="text-2xl font-black text-green-700">{latestWater.ph}</span>
                  </div>
                  <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-1">তাপমাত্রা</p>
                    <span className="text-2xl font-black text-orange-700">{latestWater.temp}°C</span>
                  </div>
               </div>
             ) : (
               <div className="text-center py-10 px-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                 <p className="text-xs text-slate-400 font-bold">পানির কোনো লগ পাওয়া যায়নি</p>
               </div>
             )}
          </div>

          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
             <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-blue-400">পুকুরের তথ্য</h3>
             <div className="space-y-4">
               <div>
                 <p className="text-[10px] opacity-50 font-bold">আয়তন</p>
                 <p className="text-xl font-black">{selectedPond?.area} শতাংশ</p>
               </div>
               <div>
                 <p className="text-[10px] opacity-50 font-bold">মাছের ধরণ</p>
                 <p className="text-xl font-black">{selectedPond?.fish_type}</p>
               </div>
             </div>
          </div>
        </div>

        {/* AI Report Content */}
        <div className="lg:col-span-3 space-y-8">
           <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-sm border border-slate-100 relative overflow-hidden min-h-[600px]">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] text-[15rem] pointer-events-none">🐟</div>
              
              <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
                 <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-blue-200">🤖</div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800">অ্যাডভাইজরি রিপোর্ট</h2>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Generated by Advanced Gemini 3.0 Analysis</p>
                 </div>
              </div>

              {analyzing ? (
                <div className="space-y-8">
                   <div className="h-6 bg-slate-50 rounded-xl w-3/4 animate-pulse"></div>
                   <div className="h-24 bg-slate-50 rounded-3xl w-full animate-pulse"></div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="h-40 bg-slate-50 rounded-3xl animate-pulse"></div>
                      <div className="h-40 bg-slate-50 rounded-3xl animate-pulse"></div>
                   </div>
                   <p className="text-center text-blue-600 font-black animate-bounce mt-10">গুগল থেকে নির্ভরযোগ্য ডাটা সংগ্রহ করা হচ্ছে...</p>
                </div>
              ) : (
                <div className="prose prose-blue max-w-none">
                  <div className="text-slate-700 leading-relaxed text-lg font-medium whitespace-pre-wrap advisory-content">
                    {advice || 'পুকুর সিলেক্ট করে রিপোর্ট জেনারেট করুন।'}
                  </div>
                </div>
              )}

              {/* Information Sources */}
              {sources.length > 0 && (
                <div className="mt-16 pt-8 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">তথ্যসূত্র (Trusted Sources):</h4>
                  <div className="flex flex-wrap gap-3">
                    {sources.map((source, idx) => (
                      <a 
                        key={idx}
                        href={source.web?.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl text-xs font-bold border border-slate-100 transition-all"
                      >
                        🌐 {source.web?.title || 'রিসোর্স লিংক'}
                      </a>
                    ))}
                  </div>
                </div>
              )}
           </div>

           {/* Disclaimer */}
           <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 flex items-start gap-4">
             <span className="text-2xl">⚠️</span>
             <div>
               <p className="text-xs font-black text-rose-800 uppercase tracking-widest mb-1">সতর্কবাণী</p>
               <p className="text-[10px] text-rose-600 font-bold leading-relaxed">
                 এই পরামর্শগুলো এআই চালিত এবং ইন্টারনেটে থাকা তথ্যের ভিত্তিতে প্রদান করা হয়েছে। কোনো বড় ধরণের ওষুধ প্রয়োগের আগে আপনার স্থানীয় মৎস্য কর্মকর্তার সাথে পরামর্শ করা নিরাপদ।
               </p>
             </div>
           </div>
        </div>
      </div>

      <style>{`
        .advisory-content h2 { font-weight: 900; color: #1e293b; font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; border-left: 5px solid #2563eb; padding-left: 1rem; }
        .advisory-content h3 { font-weight: 800; color: #334155; font-size: 1.25rem; margin-top: 1.5rem; }
        .advisory-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .advisory-content li { margin-bottom: 0.5rem; }
        .advisory-content strong { color: #2563eb; }
      `}</style>
    </div>
  );
};

export default AdvisoryPage;
