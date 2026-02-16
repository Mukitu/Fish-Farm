
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { GoogleGenAI } from "@google/genai";

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
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
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        You are a Senior Fisheries Expert in Bangladesh. Generate a professional, highly structured aquaculture farming guide in Bengali for a pond with these details:
        
        Pond Specs:
        - Name: ${pond.name}
        - Total Area: ${pond.area} decimals (শতাংশ)
        - Fish Type: ${pond.fish_type}

        Please provide EXACT data and numbers for the following sections:
        1. **মজুদ ঘনত্ব ও টার্গেট**: ${pond.area} শতাংশের জন্য কত পিস পোনা (specific count) ছাড়তে হবে এবং ৬ মাস পর কত কেজি মাছ পাওয়ার লক্ষ্যমাত্রা (Target Yield in Kg) থাকা উচিত।
        2. **পুকুর প্রস্তুতি ও চুন-লবণ**: পুকুর প্রস্তুত করতে কত কেজি চুন এবং কত কেজি লবণ লাগবে? চাষ চলাকালীন ১৫ দিন বা ১ মাস অন্তর কতটুকু চুন-লবণ দিতে হবে? (Calculate based on ${pond.area} decimals).
        3. **খাদ্য ব্যবস্থাপনা**: মাছের ওজন অনুযায়ী দৈনিক কত শতাংশ হারে খাবার দিতে হবে? (Feed ratio logic).
        4. **প্রয়োজনীয় ওষুধ (Medicine List)**: এই জাতের মাছের রোগের জন্য বাজারে পাওয়া যায় এমন ৩-৪টি নির্দিষ্ট ওষুধের নাম (যেমন: BKC, Zeolite, Gas Trap বা Potash) এবং তাদের প্রয়োগ মাত্রা লিখুন।
        5. **চাষের গোপন টিপস**: খরচ কমিয়ে লাভ বাড়ানোর ২-৩টি কার্যকরী পরামর্শ।

        Instructions:
        - Use Markdown for bold titles.
        - Be very specific with numbers (Kg/Decimal).
        - Base data on BFRI (Bangladesh Fisheries Research Institute) standards.
        - Ensure output is in clear Bengali.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      setAdvice(response.text || 'তথ্য সংগ্রহ করা সম্ভব হয়নি।');
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) setSources(groundingChunks);

    } catch (e: any) {
      console.error("AI Error:", e);
      setAdvice('দুঃখিত, এআই সার্ভার থেকে ডাটা লোড করা যাচ্ছে না। দয়া করে আপনার API Key চেক করুন বা কিছুক্ষণ পর চেষ্টা করুন।');
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
      <p className="font-black text-blue-600">খামারের ডাটা অ্যানালাইসিস হচ্ছে...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Selector Section */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight">স্মার্ট চাষ গাইড</h1>
          <p className="text-blue-400 font-bold">পুকুরের আয়তন ও জাত অনুযায়ী সঠিক পরামর্শ</p>
        </div>
        <div className="relative z-10 w-full md:w-80">
          <select 
            value={selectedPond?.id || ''} 
            onChange={e => handlePondChange(e.target.value)} 
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-black text-white outline-none focus:ring-4 focus:ring-blue-500/50 transition-all"
          >
            {ponds.map(p => <option key={p.id} value={p.id} className="text-slate-800">{p.name} ({p.area} শতাংশ)</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Metric Summary Sidebar */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">📊 পুকুরের ডাটা কার্ড</h3>
              <div className="space-y-4">
                 <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট আয়তন</p>
                    <p className="text-2xl font-black text-slate-800">{selectedPond?.area} শতাংশ</p>
                 </div>
                 <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">মাছের ধরণ</p>
                    <p className="text-2xl font-black text-blue-800">{selectedPond?.fish_type}</p>
                 </div>
              </div>
           </div>

           <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-125 transition-transform">💡</div>
              <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-indigo-200">বিশেষ দ্রষ্টব্য</h3>
              <p className="text-xs font-bold leading-relaxed opacity-90">চুন ও লবণ ব্যবহারের ক্ষেত্রে পানির pH এবং স্বচ্ছতা পরীক্ষা করে নেওয়া সবচেয়ে ভালো। এই গাইডটি BFRI এর আদর্শ মান অনুসরণ করে তৈরি।</p>
           </div>
        </div>

        {/* AI Content Section */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-sm border border-slate-100 min-h-[600px] relative">
              {analyzing ? (
                <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
                   <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                   <div className="text-center">
                     <p className="text-xl font-black text-slate-800 animate-pulse">নির্ভরযোগ্য ডাটা প্রসেস হচ্ছে...</p>
                     <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">গুগল সার্চ ও মৎস্য বিজ্ঞানীদের ডাটা যাচাই করা হচ্ছে</p>
                   </div>
                </div>
              ) : (
                <div className="prose prose-blue max-w-none">
                  <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">🤖</div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800">অ্যাডভান্সড এআই রিপোর্ট</h2>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated for {selectedPond?.area} decimals</p>
                    </div>
                  </div>
                  
                  <div className="text-slate-700 leading-relaxed text-lg font-medium whitespace-pre-wrap advisory-content">
                    {advice || 'পুকুর নির্বাচন করে গাইড জেনারেট করুন।'}
                  </div>

                  {/* Sources display */}
                  {sources.length > 0 && (
                    <div className="mt-16 pt-8 border-t border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">তথ্যসূত্র (Trusted Links):</h4>
                      <div className="flex flex-wrap gap-2">
                        {sources.map((src, i) => (
                          <a key={i} href={src.web?.uri} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl text-[10px] font-black border border-slate-100 transition-all flex items-center gap-1">
                            🌐 {src.web?.title || 'রিসোর্স'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
           </div>
        </div>
      </div>

      <style>{`
        .advisory-content h2 { font-weight: 900; color: #1e293b; font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; border-left: 5px solid #2563eb; padding-left: 1rem; }
        .advisory-content h3 { font-weight: 800; color: #334155; font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .advisory-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1.5rem; }
        .advisory-content li { margin-bottom: 0.5rem; color: #475569; }
        .advisory-content strong { color: #2563eb; font-weight: 900; }
      `}</style>
    </div>
  );
};

export default AdvisoryPage;
