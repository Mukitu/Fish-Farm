
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
