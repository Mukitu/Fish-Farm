
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { ChevronRight, Info, Calendar, Droplets, TrendingUp, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [allGuides, setAllGuides] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
  const [pondStock, setPondStock] = useState<any[]>([]);
  const [activeGuides, setActiveGuides] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [activeMonth, setActiveMonth] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [plannerForm, setPlannerForm] = useState({ area: user.max_ponds > 0 ? '' : '0', depth: '4', months: '4' });
  const [planResult, setPlanResult] = useState<any | null>(null);
  const [aiGuide, setAiGuide] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(false);

  const getAiGuide = async (pond: any, stock: any[]) => {
    setAiLoading(true);
    setAiGuide('');
    
    const area = plannerForm.area || pond?.area || '0';
    const name = pond?.name || 'নতুন পুকুর';
    const speciesInfo = stock.length > 0 
      ? stock.map(s => `${s.species} (${s.count} টি, গড় সাইজ ${s.avg_size_inch} ইঞ্চি)`).join(', ')
      : 'এখনো মাছ মজুদ করা হয়নি';

    const prompt = `পুকুরের নাম: ${name}
আয়তন: ${area} শতাংশ
গভীরতা: ${plannerForm.depth} ফুট
চাষের সময়কাল: ${plannerForm.months} মাস
মাছের প্রজাতি: ${speciesInfo}

উপরের তথ্যের ভিত্তিতে একটি বিস্তারিত চাষ গাইড তৈরি করে দিন। এই তথ্যগুলো উইকিপিডিয়া (Wikipedia), বাংলাদেশ মৎস্য গবেষণা ইনস্টিটিউট (BFRI) এবং অন্যান্য বিশ্বস্ত মৎস্য বিজ্ঞান সাময়িকী থেকে সংগ্রহ করা তথ্যের আলোকে তৈরি করুন। 

গাইডটিতে নিচের বিষয়গুলো অবশ্যই থাকতে হবে:
১. মাছের প্রজাতির বৈশিষ্ট্য ও চাষ পদ্ধতি।
২. পানির গুণমান (pH, অ্যামোনিয়া, অক্সিজেন) বজায় রাখার সঠিক উপায়।
৩. আধুনিক ও বৈজ্ঞানিক খাবার প্রয়োগের নিয়ম।
৪. সাধারণ রোগবালাই এবং উইকিপিডিয়া ও বিএফআরআই অনুমোদিত প্রতিকার।
৫. চাষের প্রতিটি মাসের জন্য একটি সংক্ষিপ্ত চেকলিস্ট।

উত্তরটি বাংলায় এবং সুন্দরভাবে Markdown ফরম্যাটে দিন।`;

    try {
      const response = await fetch('/api/groq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server Response Error:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          setAiGuide(`সার্ভার ত্রুটি: ${errorJson.error || response.statusText}`);
        } catch {
          setAiGuide(`সার্ভার ত্রুটি (${response.status}): ${response.statusText}`);
        }
        return;
      }

      const data = await response.json();
      
      if (data.choices?.[0]?.message?.content) {
        setAiGuide(data.choices[0].message.content);
      } else if (data.error) {
        const errorMsg = typeof data.error === 'object' 
          ? (data.error.message || JSON.stringify(data.error)) 
          : data.error;
        setAiGuide(`এআই ত্রুটি: ${errorMsg}`);
      } else {
        setAiGuide('দুঃখিত, এআই পরামর্শ পেতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      }
    } catch (error) {
      console.error("Groq Fetch Error:", error);
      setAiGuide('সার্ভার সংযোগে সমস্যা হয়েছে। দয়া করে আপনার ইন্টারনেট কানেকশন চেক করুন।');
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    calculatePlan();
  }, [plannerForm, selectedPond]);

  const calculatePlan = () => {
    const areaVal = parseFloat(plannerForm.area || selectedPond?.area?.toString() || '0') || 0;
    const depth = parseFloat(plannerForm.depth || '4') || 4;
    const months = parseInt(plannerForm.months || '4');

    if (areaVal <= 0) {
      setPlanResult(null);
      return;
    }

    // Logic for calculations (Approximate standard values for BD fish farming)
    const intensity = months <= 3 ? 1.5 : months <= 4 ? 1.2 : 1.0;
    
    const monthlySchedule = [];
    let totalFeed = 0;
    
    for (let i = 1; i <= months; i++) {
      const monthlyFeed = areaVal * (8 + (i * 3)) * intensity; // Feed increases as fish grow
      totalFeed += monthlyFeed;
      
      monthlySchedule.push({
        month: i,
        lime: i === 1 ? (areaVal * 1).toFixed(1) : (areaVal * 0.2).toFixed(1),
        salt: i === 1 ? (areaVal * 0.5).toFixed(1) : (i % 3 === 0 ? (areaVal * 0.2).toFixed(1) : '0'),
        fertilizer: {
          urea: Math.round(areaVal * 100 * intensity),
          tsp: Math.round(areaVal * 50 * intensity)
        },
        feed: Math.round(monthlyFeed),
        task: i === 1 ? "পুকুর প্রস্তুতি, চুন ও সার প্রয়োগ" : (i === months ? "মাছ আহরণ ও বাজারজাতকরণ" : "নিয়মিত পরিচর্যা ও নমুনা সংগ্রহ"),
        medicine: i % 2 === 0 ? "পটাশ বা জীবাণুনাশক (১০ গ্রাম/শতাংশ)" : "প্রয়োজন নেই"
      });
    }

    const results = {
      expected_yield: Math.round(areaVal * 15),
      lime: { total: (areaVal * 1 + (months - 1) * areaVal * 0.2).toFixed(1), unit: 'কেজি', note: 'পুরো সিজনের মোট চুন' },
      salt: { total: (areaVal * 0.5 + Math.floor(months/3) * areaVal * 0.2).toFixed(1), unit: 'কেজি', note: 'রোগ প্রতিরোধে মোট লবণ' },
      potash: { total: Math.round(areaVal * 10 * Math.floor(months/2)), unit: 'গ্রাম', note: 'মোট পটাশ/জীবাণুনাশক' },
      fertilizer: { 
        urea: Math.round(areaVal * 100 * intensity), 
        tsp: Math.round(areaVal * 50 * intensity), 
        unit: 'গ্রাম', 
        note: 'প্রতি সপ্তাহের জন্য সার' 
      },
      feed_estimate: { 
        total: Math.round(totalFeed), 
        unit: 'কেজি', 
        note: `পুরো ${months} মাসের আনুমানিক মোট খাবার` 
      },
      water_volume: (areaVal * 435.6 * depth).toLocaleString(),
      monthlySchedule,
      disinfectants: [
        { name: "Timsen (টিমসেন)", usage: "১ গ্রাম/শতাংশ", note: "সবচেয়ে জনপ্রিয় ও কার্যকর জীবাণুনাশক। এটি পানিতে দ্রুত মিশে যায় এবং ক্ষতিকর ব্যাকটেরিয়া ধ্বংস করে।" },
        { name: "Virkon S (ভারকন এস)", usage: "২ গ্রাম/শতাংশ", note: "ভাইরাস ও ব্যাকটেরিয়া দমনে অত্যন্ত শক্তিশালী। আন্তর্জাতিকভাবে স্বীকৃত ও নিরাপদ।" },
        { name: "BKC 80%", usage: "৫-১০ মিলি/শতাংশ", note: "পানির গুণমান রক্ষা ও জীবাণু দমনে কার্যকর। মাছের ক্ষত সারাতে সাহায্য করে।" }
      ],
      tips: [
        months <= 4 ? "দ্রুত বর্ধনশীল জাত (পাঙ্গাস, তেলাপিয়া বা কার্প নার্সারি) এর জন্য উপযুক্ত।" : "কার্প জাতীয় বড় মাছ চাষের জন্য এই সময়কাল আদর্শ।",
        "পানির গভীরতা ৪-৫ ফুটের মধ্যে রাখা ভালো।",
        "প্রতি ১৫ দিন অন্তর মাছের বৃদ্ধি পর্যবেক্ষণ করুন।"
      ]
    };

    setPlanResult(results);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: pondData } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      const { data: guidesData } = await supabase.from('farming_guides').select('*');
      
      if (guidesData) setAllGuides(guidesData);

      if (pondData && pondData.length > 0) {
        setPonds(pondData);
        const initialPond = pondData[0];
        setSelectedPond(initialPond);
        setPlannerForm(prev => ({ ...prev, area: initialPond.area.toString() }));
        const stock = await fetchPondStockAndGuides(initialPond, guidesData || []);
        getAiGuide(initialPond, stock);
      }
    } catch (e) {
      console.error("Fetch Data Error:", e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const fetchPondStockAndGuides = async (pond: any, guides: any[]) => {
    try {
      const { data: stockData } = await supabase
        .from('stocking_records')
        .select('*')
        .eq('pond_id', pond.id);
      
      const currentStock = stockData || [];
      setPondStock(currentStock);

      if (currentStock.length > 0) {
        const uniqueSpecies = Array.from(new Set(currentStock.map(s => s.species)));
        const matchedGuides = guides.filter(g => 
          uniqueSpecies.some(s => 
            g.species_name.toLowerCase().includes(s.toLowerCase()) || 
            (g.keywords && g.keywords.toLowerCase().includes(s.toLowerCase()))
          )
        );

        setActiveGuides(matchedGuides);

        if (matchedGuides.length > 0) {
          const guideIds = matchedGuides.map(g => g.id);
          const { data: timelineData } = await supabase
            .from('farming_timeline')
            .select('*')
            .in('guide_id', guideIds)
            .order('month_number', { ascending: true });
          
          setTimeline(timelineData || []);
          setActiveMonth(1);
        } else {
          setTimeline([]);
        }
      } else {
        setActiveGuides([]);
        setTimeline([]);
      }
      return currentStock;
    } catch (e) {
      console.error("Stock/Guide Fetch Error:", e);
      return [];
    }
  };

  const selectManualGuide = async (g: any) => {
    setActiveGuides([g]);
    const { data: timelineData } = await supabase
      .from('farming_timeline')
      .select('*')
      .eq('guide_id', g.id)
      .order('month_number', { ascending: true });
    
    setTimeline(timelineData || []);
    setActiveMonth(1);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePondChange = async (id: string) => {
    const p = ponds.find(x => x.id === id);
    if (p) {
      setSelectedPond(p);
      setPlannerForm(prev => ({ ...prev, area: p.area.toString() }));
      const stock = await fetchPondStockAndGuides(p, allGuides);
      getAiGuide(p, stock);
    }
  };

  const getFilteredTimeline = () => {
    if (!timeline.length) return [];
    
    // Filter by active month
    let filtered = timeline.filter(t => t.month_number === activeMonth);

    // Further filter by size if stock data exists
    if (pondStock.length > 0) {
      const avgSize = pondStock.reduce((a, b) => a + Number(b.avg_size_inch), 0) / pondStock.length;
      filtered = filtered.filter(t => 
        (t.min_size_inch === 0 && t.max_size_inch === 99) || // Default range
        (avgSize >= Number(t.min_size_inch) && avgSize <= Number(t.max_size_inch))
      );
    }

    return filtered;
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600">খামারের ডাটা অ্যানালাইসিস হচ্ছে...</p>
    </div>
  );

  const currentTimelineItems = getFilteredTimeline();

  return (
    <div className="space-y-8 pb-20 font-sans animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-3xl font-black mb-2 tracking-tight flex items-center justify-center md:justify-start gap-3">
            <ShieldCheck className="text-blue-500 w-8 h-8" />
            স্মার্ট চাষ গাইড
          </h1>
          <p className="text-blue-400 font-bold">পুকুরের আয়তন ও মজুদকৃত মাছ অনুযায়ী সঠিক পরামর্শ</p>
        </div>
        <div className="relative z-10 w-full md:w-80">
          <select 
            value={selectedPond?.id || ''} 
            onChange={e => handlePondChange(e.target.value)} 
            className="w-full px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl font-black text-white outline-none focus:ring-4 focus:ring-blue-500/50 transition-all"
          >
            {ponds.length === 0 ? (
              <option value="" className="text-slate-800">পুকুর যোগ করুন</option>
            ) : (
              ponds.map(p => <option key={p.id} value={p.id} className="text-slate-800">{p.name} ({p.area} শতাংশ)</option>)
            )}
          </select>
        </div>
      </div>
      
      {/* Unified Smart Report Section */}
      <div className="bg-white p-6 md:p-10 rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Configuration & Stats */}
          <div className="space-y-8">
            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                <TrendingUp className="text-blue-600 w-5 h-5" />
                চাষ পরিকল্পনা সেটআপ
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">পুকুরের আয়তন (শতাংশ)</label>
                  <input 
                    type="number" 
                    value={plannerForm.area} 
                    onChange={e => setPlannerForm({...plannerForm, area: e.target.value})}
                    placeholder={selectedPond?.area || "আয়তন দিন"}
                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">পানির গড় গভীরতা (ফুট)</label>
                  <input 
                    type="number" 
                    value={plannerForm.depth} 
                    onChange={e => setPlannerForm({...plannerForm, depth: e.target.value})}
                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">বিক্রির টার্গেট (মাস)</label>
                  <select 
                    value={plannerForm.months} 
                    onChange={e => setPlannerForm({...plannerForm, months: e.target.value})}
                    className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>{i+1} মাস {i+1 <= 3 ? '(খুব দ্রুত)' : i+1 <= 6 ? '(স্বাভাবিক)' : '(দীর্ঘমেয়াদী)'}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={() => getAiGuide(selectedPond, pondStock)}
                  disabled={aiLoading}
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  এআই গাইড আপডেট করুন
                </button>
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-125 transition-transform">📊</div>
              <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-blue-200">খামার ব্যবস্থাপনা</h3>
              <p className="text-xs font-bold leading-relaxed opacity-90">
                আপনার পুকুরে বর্তমানে {pondStock.length > 0 ? pondStock.length : '০'} টি প্রজাতির মাছ রয়েছে। তাদের গড় সাইজ অনুযায়ী নিচের পরামর্শগুলো অনুসরণ করুন।
              </p>
              <div className="mt-6 pt-6 border-t border-white/10">
                <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">পরামর্শ</p>
                <p className="text-sm font-bold">গড় সাইজ: {pondStock.length > 0 ? (pondStock.reduce((a, b) => a + Number(b.avg_size_inch), 0) / pondStock.length).toFixed(1) : 0} ইঞ্চি</p>
              </div>
            </div>
          </div>

          {/* Right Column: The Report */}
          <div className="lg:col-span-2 space-y-8">
            {/* Analysis Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">মোট আয়তন</p>
                <p className="text-xl font-black text-slate-800">{plannerForm.area || selectedPond?.area || '0'} শতাংশ</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">মোট পোনা</p>
                <p className="text-xl font-black text-slate-800">
                  {pondStock.reduce((a, b) => a + Number(b.count), 0).toLocaleString()} টি
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">টার্গেট ফলন</p>
                <p className="text-xl font-black text-slate-800">
                  {planResult?.expected_yield || Math.round((parseFloat(plannerForm.area || selectedPond?.area || '0') || 0) * 15)} কেজি
                </p>
              </div>
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">মজুদকৃত মাছ</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {pondStock.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black rounded">
                      {s.species}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Timeline Selector - Hidden as AI Guide is primary */}
            <div className="hidden">
              <div className="flex gap-3 min-w-max">
                <button
                  onClick={() => getAiGuide(selectedPond, pondStock)}
                  disabled={aiLoading}
                  className={`px-5 py-3 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-200 scale-105 disabled:opacity-50`}
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span className="text-sm">এআই গাইড</span>
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[400px]">
              {aiLoading ? (
                <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                  <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-black text-purple-600">উইকিপিডিয়া ও বিএফআরআই থেকে তথ্য সংগ্রহ করা হচ্ছে...</p>
                </div>
              ) : aiGuide ? (
                <div className="advisory-content prose prose-slate max-w-none animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-4 border-b border-slate-50 pb-6 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 m-0 border-none p-0">এআই স্মার্ট গাইড (Trusted)</h2>
                      <p className="text-slate-400 font-bold text-sm">উৎস: Wikipedia, BFRI ও মৎস্য বিজ্ঞান</p>
                    </div>
                  </div>
                  <ReactMarkdown>{aiGuide}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <Info className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold">গাইড লোড করতে পুকুর সিলেক্ট করুন অথবা আপডেট বাটনে ক্লিক করুন।</p>
                </div>
              )}
            </div>
          </div>

            {/* Planner Results (if active) */}
            {planResult && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">চুন (Lime)</p>
                    <p className="text-2xl font-black text-slate-800">{planResult.lime.total} {planResult.lime.unit}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{planResult.lime.note}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">লবণ (Salt)</p>
                    <p className="text-2xl font-black text-slate-800">{planResult.salt.total} {planResult.salt.unit}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{planResult.salt.note}</p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">পটাশ (Potash)</p>
                    <p className="text-2xl font-black text-slate-800">{planResult.potash.total} {planResult.potash.unit}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{planResult.potash.note}</p>
                  </div>
                </div>

                {/* Disinfectants Section */}
                <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100">
                  <h4 className="text-sm font-black text-emerald-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <ShieldCheck className="text-emerald-600 w-5 h-5" />
                    সেরা জীবাণুনাশক পরামর্শ (Trusted)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {planResult.disinfectants.map((d: any, i: number) => (
                      <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-emerald-50">
                        <p className="font-black text-emerald-700 mb-1">{d.name}</p>
                        <p className="text-xs font-black text-slate-800 mb-2">প্রয়োগ: {d.usage}</p>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight">{d.note}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[10px] text-emerald-600 font-bold italic text-center">
                    * তথ্যসূত্র: বাংলাদেশ মৎস্য গবেষণা ইনস্টিটিউট (BFRI) ও অনুমোদিত ডিলার।
                  </p>
                </div>
              </div>
            )}
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
