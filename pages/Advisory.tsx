
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { ChevronRight, Info, Calendar, Droplets, TrendingUp, ShieldCheck } from 'lucide-react';

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

  const calculatePlan = () => {
    const area = parseFloat(plannerForm.area || selectedPond?.area || '0');
    const depth = parseFloat(plannerForm.depth || '4');
    const months = parseInt(plannerForm.months || '4');

    if (area <= 0) return alert('পুকুরের আয়তন দিন');

    // Logic for calculations (Approximate standard values for BD fish farming)
    const intensity = months <= 3 ? 1.5 : months <= 4 ? 1.2 : 1.0;
    
    const monthlySchedule = [];
    let totalFeed = 0;
    
    for (let i = 1; i <= months; i++) {
      const monthlyFeed = area * (8 + (i * 3)) * intensity; // Feed increases as fish grow
      totalFeed += monthlyFeed;
      
      monthlySchedule.push({
        month: i,
        lime: i === 1 ? (area * 1).toFixed(1) : (area * 0.2).toFixed(1),
        salt: i === 1 ? (area * 0.5).toFixed(1) : (i % 3 === 0 ? (area * 0.2).toFixed(1) : '0'),
        fertilizer: {
          urea: Math.round(area * 100 * intensity),
          tsp: Math.round(area * 50 * intensity)
        },
        feed: Math.round(monthlyFeed),
        task: i === 1 ? "পুকুর প্রস্তুতি, চুন ও সার প্রয়োগ" : (i === months ? "মাছ আহরণ ও বাজারজাতকরণ" : "নিয়মিত পরিচর্যা ও নমুনা সংগ্রহ"),
        medicine: i % 2 === 0 ? "পটাশ বা জীবাণুনাশক (১০ গ্রাম/শতাংশ)" : "প্রয়োজন নেই"
      });
    }

    const results = {
      lime: { total: (area * 1 + (months - 1) * area * 0.2).toFixed(1), unit: 'কেজি', note: 'পুরো সিজনের মোট চুন' },
      salt: { total: (area * 0.5 + Math.floor(months/3) * area * 0.2).toFixed(1), unit: 'কেজি', note: 'রোগ প্রতিরোধে মোট লবণ' },
      potash: { total: Math.round(area * 10 * Math.floor(months/2)), unit: 'গ্রাম', note: 'মোট পটাশ/জীবাণুনাশক' },
      fertilizer: { 
        urea: Math.round(area * 100 * intensity), 
        tsp: Math.round(area * 50 * intensity), 
        unit: 'গ্রাম', 
        note: 'প্রতি সপ্তাহের জন্য সার' 
      },
      feed_estimate: { 
        total: Math.round(totalFeed), 
        unit: 'কেজি', 
        note: `পুরো ${months} মাসের আনুমানিক মোট খাবার` 
      },
      water_volume: (area * 435.6 * depth).toLocaleString(),
      monthlySchedule,
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
        await fetchPondStockAndGuides(initialPond, guidesData || []);
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
      
      setPondStock(stockData || []);

      if (stockData && stockData.length > 0) {
        const uniqueSpecies = Array.from(new Set(stockData.map(s => s.species)));
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
    } catch (e) {
      console.error("Stock/Guide Fetch Error:", e);
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

  const handlePondChange = (id: string) => {
    const p = ponds.find(x => x.id === id);
    if (p) {
      setSelectedPond(p);
      fetchPondStockAndGuides(p, allGuides);
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
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 tracking-tight flex items-center gap-3">
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
            {ponds.map(p => <option key={p.id} value={p.id} className="text-slate-800">{p.name} ({p.area} শতাংশ)</option>)}
          </select>
        </div>
      </div>
      
      {/* Growth Planner Section */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full"></div>
        <div className="flex flex-col md:flex-row gap-10 items-start">
          <div className="w-full md:w-1/3 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-800">দ্রুত চাষ পরিকল্পনা</h3>
            </div>
            <p className="text-sm font-bold text-slate-400 leading-relaxed">
              আপনার পুকুরের আয়তন, পানির গভীরতা এবং কত মাসে মাছ বিক্রি করতে চান তা ইনপুট দিন। আমরা আপনাকে একটি আনুমানিক গাইড দেব।
            </p>
            
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">পুকুরের আয়তন (শতাংশ)</label>
                <input 
                  type="number" 
                  value={plannerForm.area} 
                  onChange={e => setPlannerForm({...plannerForm, area: e.target.value})}
                  placeholder={selectedPond?.area || "আয়তন দিন"}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">পানির গড় গভীরতা (ফুট)</label>
                <input 
                  type="number" 
                  value={plannerForm.depth} 
                  onChange={e => setPlannerForm({...plannerForm, depth: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">বিক্রির টার্গেট (মাস)</label>
                <select 
                  value={plannerForm.months} 
                  onChange={e => setPlannerForm({...plannerForm, months: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} মাস {i+1 <= 3 ? '(খুব দ্রুত)' : i+1 <= 6 ? '(স্বাভাবিক)' : '(দীর্ঘমেয়াদী)'}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={calculatePlan}
                className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
              >
                পরিকল্পনা তৈরি করুন
              </button>
            </div>
          </div>

          <div className="w-full md:w-2/3 min-h-[400px] bg-slate-50 rounded-[3rem] p-8 border border-slate-100 relative">
            {planResult ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[150px] bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">চুন (Lime)</p>
                    <p className="text-2xl font-black text-slate-800">{planResult.lime.total} {planResult.lime.unit}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{planResult.lime.note}</p>
                  </div>
                  <div className="flex-1 min-w-[150px] bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">লবণ (Salt)</p>
                    <p className="text-2xl font-black text-slate-800">{planResult.salt.total} {planResult.salt.unit}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{planResult.salt.note}</p>
                  </div>
                  <div className="flex-1 min-w-[150px] bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">পটাশ (Potash)</p>
                    <p className="text-2xl font-black text-slate-800">{planResult.potash.total} {planResult.potash.unit}</p>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">{planResult.potash.note}</p>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Droplets className="text-blue-600 w-4 h-4" />
                    সার ও খাবার ব্যবস্থাপনা
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400">সাপ্তাহিক সার:</p>
                      <div className="flex gap-4">
                        <div className="px-4 py-2 bg-blue-50 rounded-xl text-blue-700 font-black text-sm">ইউরিয়া: {planResult.fertilizer.urea} গ্রাম</div>
                        <div className="px-4 py-2 bg-blue-50 rounded-xl text-blue-700 font-black text-sm">টিএসপি: {planResult.fertilizer.tsp} গ্রাম</div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold italic">{planResult.fertilizer.note}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-400">মোট আনুমানিক খাবার:</p>
                      <p className="text-2xl font-black text-slate-800">{planResult.feed_estimate.total} {planResult.feed_estimate.unit}</p>
                      <p className="text-[10px] text-slate-400 font-bold italic">{planResult.feed_estimate.note}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white shadow-lg">
                  <h4 className="text-sm font-black uppercase tracking-widest mb-4 opacity-80">বিশেষ পরামর্শ</h4>
                  <ul className="space-y-3">
                    {planResult.tips.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-bold">
                        <ChevronRight className="w-5 h-5 text-blue-300 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">পানির মোট আয়তন</p>
                    <p className="text-lg font-black">{planResult.water_volume} ঘনফুট</p>
                  </div>
                </div>

                {/* Monthly Breakdown */}
                <div className="mt-12 space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                      <Calendar className="text-blue-600 w-8 h-8" />
                      মাসিক কর্মপরিকল্পনা
                    </h3>
                    <span className="px-4 py-2 bg-blue-50 text-blue-600 rounded-2xl font-black text-xs">
                      মোট সময়কাল: {plannerForm.months} মাস
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    {planResult.monthlySchedule.map((m: any) => (
                      <div key={m.month} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-slate-50 pb-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-100">
                              {m.month}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">মাসিক লক্ষ্য</p>
                              <h4 className="text-lg font-black text-slate-800">{m.task}</h4>
                            </div>
                          </div>
                          {m.salt !== '0' && (
                            <span className="px-4 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full border border-amber-100">
                              লবণ প্রয়োগের মাস
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                          <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50/50 transition-colors">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">চুন প্রয়োগ</p>
                            <p className="text-lg font-black text-slate-800">{m.lime} <span className="text-xs">কেজি</span></p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50/50 transition-colors">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">খাবার (মাসিক)</p>
                            <p className="text-lg font-black text-slate-800">{m.feed} <span className="text-xs">কেজি</span></p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50/50 transition-colors">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">সার (ইউরিয়া/টিএসপি)</p>
                            <p className="text-lg font-black text-slate-800">{m.fertilizer.urea}/{m.fertilizer.tsp} <span className="text-xs">গ্রাম</span></p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-blue-50/50 transition-colors">
                            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ওষুধ/ব্যবস্থাপনা</p>
                            <p className={`text-sm font-black ${m.medicine === 'প্রয়োজন নেই' ? 'text-slate-400' : 'text-rose-600'}`}>{m.medicine}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm">📋</div>
                <h4 className="text-xl font-black text-slate-800">পরিকল্পনা দেখতে ডাটা ইনপুট দিন</h4>
                <p className="text-sm font-bold text-slate-400 max-w-xs">
                  বামে আপনার পুকুরের তথ্য দিয়ে "পরিকল্পনা তৈরি করুন" বাটনে ক্লিক করুন।
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Stats & Calculations */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Info className="text-blue-600 w-5 h-5" />
              পুকুর ও মজুদ বিশ্লেষণ
            </h3>
            <div className="space-y-4">
              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট আয়তন</p>
                <p className="text-2xl font-black text-slate-800">{selectedPond?.area} শতাংশ</p>
              </div>
              
              <div className="p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">মজুদকৃত মাছসমূহ</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {pondStock.length > 0 ? (
                    pondStock.map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black rounded-lg">
                        {s.species} ({s.avg_size_inch}")
                      </span>
                    ))
                  ) : (
                    <p className="text-sm font-bold text-slate-400">কোন মাছ মজুদ নেই</p>
                  )}
                </div>
              </div>
              
              {activeGuides.length > 0 && (
                <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">মোট পোনা</p>
                      <p className="text-xl font-black text-emerald-800">
                        {pondStock.reduce((a, b) => a + Number(b.count), 0).toLocaleString()} টি
                      </p>
                    </div>
                    <TrendingUp className="text-emerald-500 w-8 h-8 opacity-40" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl">
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">টার্গেট ফলন (গড়)</p>
                      <p className="text-xl font-black text-amber-800">
                        {Math.round(selectedPond?.area * (activeGuides.reduce((a, b) => a + Number(b.expected_yield_kg_per_decimal), 0) / activeGuides.length)).toLocaleString()} কেজি
                      </p>
                    </div>
                    <TrendingUp className="text-amber-500 w-8 h-8 opacity-40" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-125 transition-transform">📊</div>
            <h3 className="text-sm font-black mb-4 uppercase tracking-widest text-slate-400">খামার ব্যবস্থাপনা</h3>
            <p className="text-xs font-bold leading-relaxed opacity-90">
              আপনার পুকুরে বর্তমানে {pondStock.length > 0 ? pondStock.length : '০'} টি প্রজাতির মাছ রয়েছে। তাদের গড় সাইজ অনুযায়ী নিচের পরামর্শগুলো অনুসরণ করুন।
            </p>
          </div>
        </div>

        {/* Right Column: Timeline & Content */}
        <div className="lg:col-span-8 space-y-8">
          {/* Timeline Selector */}
          {timeline.length > 0 && (
            <div className="bg-white p-6 rounded-[3rem] shadow-sm border border-slate-100 overflow-x-auto no-scrollbar">
              <div className="flex gap-4 min-w-max">
                {Array.from(new Set(timeline.map(t => t.month_number))).sort((a, b) => a - b).map((month) => (
                  <button
                    key={month}
                    onClick={() => setActiveMonth(month)}
                    className={`px-6 py-4 rounded-2xl font-black text-sm transition-all flex flex-col items-center gap-1 ${
                      activeMonth === month 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-[10px] opacity-70 uppercase">মাস</span>
                    <span className="text-lg">{month}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-sm border border-slate-100 min-h-[500px] relative overflow-hidden">
            {activeGuides.length > 0 ? (
              <div className="space-y-10">
                <div className="flex items-center gap-4 border-b border-slate-50 pb-8">
                  <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white text-3xl shadow-xl">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-800">সম্মিলিত চাষ গাইড</h2>
                    <p className="text-slate-400 font-bold">
                      {activeGuides.map(g => g.species_name).join(', ')} এর জন্য সমন্বিত পরামর্শ
                    </p>
                  </div>
                </div>

                {currentTimelineItems.length > 0 ? (
                  <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                    {currentTimelineItems.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-50 pb-8 last:border-0">
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                          <div className="flex items-center gap-2 mb-4 text-blue-600">
                            <Droplets className="w-5 h-5" />
                            <h4 className="text-sm font-black uppercase tracking-widest">
                              {activeGuides.find(g => g.id === item.guide_id)?.species_name} - করণীয়
                            </h4>
                          </div>
                          <h3 className="text-2xl font-black text-slate-800 mb-4">{item.task_title}</h3>
                          <p className="text-slate-600 font-bold leading-relaxed">{item.task_description}</p>
                          {item.min_size_inch > 0 && (
                            <p className="mt-4 text-[10px] font-black text-blue-500 uppercase">উপযুক্ত সাইজ: {item.min_size_inch} - {item.max_size_inch} ইঞ্চি</p>
                          )}
                        </div>

                        <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
                          <div className="flex items-center gap-2 mb-4 text-rose-600">
                            <ShieldCheck className="w-5 h-5" />
                            <h4 className="text-sm font-black uppercase tracking-widest">ওষুধ ও ব্যবস্থাপনা</h4>
                          </div>
                          <p className="text-rose-900 font-black text-lg leading-relaxed">
                            {item.medicine_suggestions || 'কোন নির্দিষ্ট ওষুধ প্রয়োজন নেই।'}
                          </p>
                        </div>
                      </div>
                    ))}

                    <div className="bg-blue-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute -right-10 -bottom-10 opacity-10 text-[10rem] font-black">
                        {activeMonth}
                      </div>
                      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                          <h3 className="text-2xl font-black mb-2">সমন্বিত মুনাফা টিপস</h3>
                          <p className="text-blue-100 font-bold opacity-90 max-w-md">
                            একাধিক প্রজাতির মাছ চাষে খাবারের অপচয় কম হয়। নিয়মিত পানির গুণমান বজায় রাখুন।
                          </p>
                        </div>
                        <div className="px-6 py-3 bg-white/20 rounded-xl backdrop-blur-sm">
                           <p className="text-xs font-black uppercase">পরামর্শ</p>
                           <p className="text-sm font-bold">গড় সাইজ: {pondStock.length > 0 ? (pondStock.reduce((a, b) => a + Number(b.avg_size_inch), 0) / pondStock.length).toFixed(1) : 0} ইঞ্চি</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <p className="text-slate-400 font-bold">এই মাসের জন্য বা এই সাইজের মাছের জন্য কোন নির্দিষ্ট কাজ পাওয়া যায়নি।</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-8">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-5xl grayscale opacity-50">🐟</div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">সঠিক গাইড নির্বাচন করুন</h3>
                  <p className="text-slate-400 font-bold max-w-xs mx-auto mt-2">আপনার পুকুরে কোন মাছ মজুদ করা হয়নি অথবা মজুদকৃত মাছের সাথে আমাদের ডাটাবেসের মিল পাওয়া যায়নি। নিচের তালিকা থেকে একটি গাইড বেছে নিন:</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                   {allGuides.map((g) => (
                     <button
                       key={g.id}
                       onClick={() => selectManualGuide(g)}
                       className="p-6 bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-200 rounded-3xl text-left transition-all group"
                     >
                        <p className="font-black text-slate-800 group-hover:text-blue-600 mb-1">{g.species_name}</p>
                        <p className="text-xs text-slate-400 font-bold line-clamp-1">{g.description}</p>
                     </button>
                   ))}
                </div>
                
                <div className="pt-8 border-t border-slate-50 w-full">
                   <p className="text-xs text-slate-400 italic">পরামর্শ: পুকুর সেকশনে গিয়ে মাছের পোনা মজুদ করুন।</p>
                </div>
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
