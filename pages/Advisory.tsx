
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { GoogleGenAI } from "@google/genai";
import { ChevronRight, Info, Calendar, Droplets, TrendingUp, ShieldCheck, Search } from 'lucide-react';

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
  const [guide, setGuide] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeMonth, setActiveMonth] = useState<number>(1);
  const [advice, setAdvice] = useState<string>('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: pondData } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      if (pondData && pondData.length > 0) {
        setPonds(pondData);
        const initialPond = pondData[0];
        setSelectedPond(initialPond);
        await fetchGuideData(initialPond);
      }
    } catch (e) {
      console.error("Fetch Data Error:", e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const fetchGuideData = async (pond: any) => {
    try {
      // Try to find a matching guide in the database
      const { data: guideData } = await supabase
        .from('farming_guides')
        .select('*')
        .ilike('species_name', `%${pond.fish_type}%`)
        .maybeSingle();

      if (guideData) {
        setGuide(guideData);
        const { data: timelineData } = await supabase
          .from('farming_timeline')
          .select('*')
          .eq('guide_id', guideData.id)
          .order('month_number', { ascending: true });
        
        setTimeline(timelineData || []);
        setActiveMonth(1);
      } else {
        setGuide(null);
        setTimeline([]);
      }
    } catch (e) {
      console.error("Guide Fetch Error:", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getAIAdvice = async (pond: any) => {
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
      fetchGuideData(p);
      setAdvice(''); // Clear AI advice when changing pond
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600">খামারের ডাটা অ্যানালাইসিস হচ্ছে...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 font-sans animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-blue-500 w-8 h-8" />
            স্মার্ট চাষ গাইড
          </h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Calculations */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Info className="text-blue-600 w-5 h-5" />
              পুকুর বিশ্লেষণ
            </h3>
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট আয়তন</p>
                <p className="text-2xl font-black text-slate-800">{selectedPond?.area} শতাংশ</p>
              </div>
              <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">মাছের ধরণ</p>
                <p className="text-2xl font-black text-blue-800">{selectedPond?.fish_type}</p>
              </div>
              
              {guide && (
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">প্রস্তাবিত পোনা</p>
                      <p className="text-xl font-black text-emerald-800">
                        {Math.round(selectedPond?.area * guide.stocking_density_per_decimal).toLocaleString()} টি
                      </p>
                    </div>
                    <TrendingUp className="text-emerald-500 w-8 h-8 opacity-40" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">টার্গেট ফলন</p>
                      <p className="text-xl font-black text-amber-800">
                        {Math.round(selectedPond?.area * guide.expected_yield_kg_per_decimal).toLocaleString()} কেজি
                      </p>
                    </div>
                    <TrendingUp className="text-amber-500 w-8 h-8 opacity-40" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-125 transition-transform">💡</div>
            <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-indigo-200">বিশেষ দ্রষ্টব্য</h3>
            <p className="text-xs font-bold leading-relaxed opacity-90">
              চুন ও লবণ ব্যবহারের ক্ষেত্রে পানির pH এবং স্বচ্ছতা পরীক্ষা করে নেওয়া সবচেয়ে ভালো। এই গাইডটি BFRI এর আদর্শ মান অনুসরণ করে তৈরি।
            </p>
            <button 
              onClick={() => getAIAdvice(selectedPond)}
              disabled={analyzing}
              className="mt-6 w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
            >
              {analyzing ? 'অ্যানালাইসিস হচ্ছে...' : 'অ্যাডভান্সড এআই পরামর্শ'}
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Timeline & Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Timeline Selector */}
          {timeline.length > 0 && (
            <div className="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
              <div className="flex gap-4 min-w-max">
                {timeline.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveMonth(item.month_number)}
                    className={`px-6 py-4 rounded-2xl font-black text-sm transition-all flex flex-col items-center gap-1 ${
                      activeMonth === item.month_number 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] opacity-70 uppercase">মাস</span>
                    <span className="text-lg">{item.month_number}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-sm border border-slate-100 min-h-[500px] relative overflow-hidden">
            {analyzing ? (
              <div className="flex flex-col items-center justify-center h-full py-20 space-y-6">
                <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-center">
                  <p className="text-xl font-black text-slate-800 animate-pulse">নির্ভরযোগ্য ডাটা প্রসেস হচ্ছে...</p>
                  <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">গুগল সার্চ ও মৎস্য বিজ্ঞানীদের ডাটা যাচাই করা হচ্ছে</p>
                </div>
              </div>
            ) : advice ? (
              <div className="prose prose-blue max-w-none">
                <div className="flex items-center gap-3 mb-10 pb-6 border-b border-slate-50">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg">🤖</div>
                  <div>
                    <h2 className="text-xl font-black text-slate-800">অ্যাডভান্সড এআই রিপোর্ট</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated for {selectedPond?.area} decimals</p>
                  </div>
                </div>
                <div className="text-slate-700 leading-relaxed text-lg font-medium whitespace-pre-wrap advisory-content">
                  {advice}
                </div>
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
            ) : guide ? (
              <div className="space-y-10">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl shadow-xl">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800">{guide.species_name}</h2>
                    <p className="text-slate-400 font-bold">{guide.description}</p>
                  </div>
                </div>

                {timeline.find(t => t.month_number === activeMonth) && (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                        <div className="flex items-center gap-2 mb-4 text-blue-600">
                          <Droplets className="w-5 h-5" />
                          <h4 className="text-sm font-black uppercase tracking-widest">করণীয় কাজ</h4>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-4">{timeline.find(t => t.month_number === activeMonth).task_title}</h3>
                        <p className="text-slate-600 font-bold leading-relaxed">{timeline.find(t => t.month_number === activeMonth).task_description}</p>
                      </div>

                      <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
                        <div className="flex items-center gap-2 mb-4 text-rose-600">
                          <ShieldCheck className="w-5 h-5" />
                          <h4 className="text-sm font-black uppercase tracking-widest">ওষুধ ও ব্যবস্থাপনা</h4>
                        </div>
                        <p className="text-rose-900 font-black text-lg leading-relaxed">
                          {timeline.find(t => t.month_number === activeMonth).medicine_suggestions || 'কোন নির্দিষ্ট ওষুধ প্রয়োজন নেই।'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute -right-10 -bottom-10 opacity-10 text-[10rem] font-black">
                        {activeMonth}
                      </div>
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                          <h3 className="text-2xl font-black mb-2">মুনাফা বৃদ্ধির টিপস</h3>
                          <p className="text-blue-100 font-bold opacity-90 max-w-md">
                            সঠিক সময়ে খাবার এবং পানির মান নিয়ন্ত্রণ করলে আপনার মুনাফা ৫০% পর্যন্ত বৃদ্ধি পেতে পারে।
                          </p>
                        </div>
                        <button className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-black text-sm hover:scale-105 transition-transform shadow-xl">
                          বিস্তারিত জানুন
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl grayscale opacity-50">🐟</div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">কোন গাইড পাওয়া যায়নি</h3>
                  <p className="text-slate-400 font-bold max-w-xs mx-auto mt-2">আপনার পুকুরের মাছের জাতের জন্য আমাদের ডাটাবেসে কোন গাইড নেই। এআই পরামর্শ নিতে পারেন।</p>
                </div>
                <button 
                  onClick={() => getAIAdvice(selectedPond)}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all"
                >
                  এআই পরামর্শ নিন
                </button>
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default AdvisoryPage;
