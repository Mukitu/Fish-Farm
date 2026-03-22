
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { Info, TrendingUp, ShieldCheck } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
  const [pondStock, setPondStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [plannerForm, setPlannerForm] = useState({ area: user.max_ponds > 0 ? '' : '0', depth: '4', months: '4' });
  const [planResult, setPlanResult] = useState<any | null>(null);

  useEffect(() => {
    calculatePlan();
  }, [plannerForm, selectedPond, pondStock]);

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
    
    // Calculations
    const prepLime = areaVal * 1; // 1 kg per decimal
    const prepUrea = areaVal * 100; // 100g per decimal
    const prepTsp = areaVal * 50; // 50g per decimal
    const prepDung = areaVal * 5; // 5kg per decimal
    
    const monthlyLime = areaVal * 250; // 250g per decimal
    const monthlySalt = areaVal * 250; // 250g per decimal
    const monthlyUrea = areaVal * 50; // 50g per decimal
    const monthlyTsp = areaVal * 25; // 25g per decimal
    const monthlyZeolite = areaVal * 200; // 200g per decimal

    const speciesNames = pondStock.length > 0 ? Array.from(new Set(pondStock.map(s => s.species))).join(', ') : 'মিশ্র চাষ';
    
    let guideMd = `### 🐟 ${speciesNames} চাষের বিস্তারিত গাইড\n\n`;
    guideMd += `**পুকুরের আয়তন:** ${areaVal} শতাংশ | **গভীরতা:** ${depth} ফুট | **চাষের সময়কাল:** ${months} মাস\n\n`;
    
    guideMd += `#### ১. পুকুর প্রস্তুতি (প্রথম ২-৩ সপ্তাহ)\n`;
    guideMd += `পুকুর প্রস্তুতির উপর মাছের ফলন অনেকাংশে নির্ভর করে। নিচের ধাপগুলো অনুসরণ করুন:\n`;
    guideMd += `- **রাক্ষুসে মাছ নিধন:** পুকুর শুকিয়ে ফেলা সবচেয়ে ভালো। সম্ভব না হলে রোটেনন (২৫-৩০ গ্রাম/শতাংশ/ফুট পানি) প্রয়োগ করুন।\n`;
    guideMd += `- **চুন প্রয়োগ:** প্রতি শতাংশে **${prepLime.toFixed(1)} কেজি** চুন প্রয়োগ করুন। চুন পানিতে গুলে ঠান্ডা করে পুরো পুকুরে ছিটিয়ে দিন।\n`;
    guideMd += `- **সার প্রয়োগ (চুন দেওয়ার ৩-৪ দিন পর):** প্রাকৃতিক খাবার তৈরির জন্য প্রতি শতাংশে ইউরিয়া **${prepUrea.toFixed(0)} গ্রাম**, টিএসপি **${prepTsp.toFixed(0)} গ্রাম** এবং গোবর **${prepDung.toFixed(1)} কেজি** প্রয়োগ করুন।\n\n`;

    guideMd += `#### ২. মাসিক পরিচর্যা ও ঔষধ প্রয়োগ\n`;
    guideMd += `পানির গুণাগুণ ঠিক রাখতে এবং রোগবালাই প্রতিরোধে প্রতি মাসে নিচের রুটিন মেনে চলুন:\n`;
    guideMd += `- **১ম সপ্তাহ (চুন ও লবণ):** প্রতি শতাংশে **${(monthlyLime/1000).toFixed(2)} কেজি** চুন এবং **${(monthlySalt/1000).toFixed(2)} কেজি** লবণ প্রয়োগ করুন। এটি মাছকে রোগমুক্ত রাখবে।\n`;
    guideMd += `- **২য় সপ্তাহ (সার):** পানির রঙ হালকা হয়ে গেলে প্রতি শতাংশে ইউরিয়া **${monthlyUrea.toFixed(0)} গ্রাম** এবং টিএসপি **${monthlyTsp.toFixed(0)} গ্রাম** দিন।\n`;
    guideMd += `- **৩য় সপ্তাহ (জীবাণুনাশক):** টিমসেন (Timsen) বা অ্যাকুয়াক্লিন প্রতি শতাংশে **২ গ্রাম** হারে প্রয়োগ করুন।\n`;
    guideMd += `- **৪র্থ সপ্তাহ (গ্যাস দূরীকরণ):** পুকুরের তলায় গ্যাস হলে বা অ্যামোনিয়া বাড়লে জিয়োলাইট (Zeolite) প্রতি শতাংশে **${(monthlyZeolite/1000).toFixed(2)} কেজি** প্রয়োগ করুন।\n\n`;

    guideMd += `#### ৩. খাবার ব্যবস্থাপনা\n`;
    guideMd += `- মাছের গড় ওজনের ৩-৫% হারে দৈনিক খাবার দিন।\n`;
    guideMd += `- খাবার দিনে ২-৩ বার নির্দিষ্ট স্থানে প্রয়োগ করুন।\n`;
    guideMd += `- শীতকালে মাছের খাবার গ্রহণ কমে যায়, তাই খাবারের পরিমাণ অর্ধেক করে দিন।\n\n`;

    guideMd += `#### ৪. রোগবালাই ও প্রতিকার\n`;
    guideMd += `- **ক্ষত রোগ (Epizootic Ulcerative Syndrome):** শীতের শুরুতে প্রতি শতাংশে ৫০০ গ্রাম চুন ও ৫০০ গ্রাম লবণ প্রয়োগ করুন। আক্রান্ত হলে বিকেসি (BKC) বা টিমসেন ব্যবহার করুন।\n`;
    guideMd += `- **উকুন বা পরজীবী:** সাইপারমেথ্রিন (Cypermethrin) জাতীয় ঔষধ প্যাকেটের নির্দেশিকা অনুযায়ী প্রয়োগ করুন।\n`;
    guideMd += `- **অক্সিজেন স্বল্পতা:** মাছ খাবি খেলে দ্রুত পুকুরে পানি সরবরাহ করুন, সাঁতার কাটুন বা অক্সি-ফ্লো (Oxy-flow) জাতীয় পাউডার ছিটিয়ে দিন।\n\n`;

    guideMd += `> **বিশেষ দ্রষ্টব্য:** এই তথ্যগুলো বাংলাদেশ মৎস্য গবেষণা ইনস্টিটিউট (BFRI) এবং মৎস্য অধিদপ্তরের গাইডলাইন অবলম্বনে তৈরি। যেকোনো জরুরি অবস্থায় স্থানীয় মৎস্য কর্মকর্তার পরামর্শ নিন।`;

    const monthlySchedule = [];
    let totalFeed = 0;
    
    for (let i = 1; i <= months; i++) {
      const monthlyFeed = areaVal * (8 + (i * 3)) * intensity; // Feed increases as fish grow
      totalFeed += monthlyFeed;
      
      monthlySchedule.push({
        month: i,
        lime: i === 1 ? (areaVal * 1).toFixed(1) : (areaVal * 0.25).toFixed(1),
        salt: i === 1 ? (areaVal * 0.5).toFixed(1) : (areaVal * 0.25).toFixed(1),
        fertilizer: {
          urea: Math.round(areaVal * 50 * intensity),
          tsp: Math.round(areaVal * 25 * intensity)
        },
        feed: Math.round(monthlyFeed),
        task: i === 1 ? "পুকুর প্রস্তুতি, চুন ও সার প্রয়োগ" : (i === months ? "মাছ আহরণ ও বাজারজাতকরণ" : "নিয়মিত পরিচর্যা ও নমুনা সংগ্রহ"),
        medicine: i % 2 === 0 ? "টিমসেন বা জীবাণুনাশক (২ গ্রাম/শতাংশ)" : "প্রয়োজন নেই"
      });
    }

    const results = {
      expected_yield: Math.round(areaVal * 15),
      lime: { total: (areaVal * 1 + (months - 1) * areaVal * 0.25).toFixed(1), unit: 'কেজি', note: 'পুরো সিজনের মোট চুন' },
      salt: { total: (areaVal * 0.5 + (months - 1) * areaVal * 0.25).toFixed(1), unit: 'কেজি', note: 'রোগ প্রতিরোধে মোট লবণ' },
      potash: { total: Math.round(areaVal * 2 * months), unit: 'গ্রাম', note: 'মোট টিমসেন/জীবাণুনাশক' },
      fertilizer: { 
        urea: Math.round(areaVal * 50 * intensity), 
        tsp: Math.round(areaVal * 25 * intensity), 
        unit: 'গ্রাম', 
        note: 'প্রতি মাসের জন্য সার' 
      },
      feed_estimate: { 
        total: Math.round(totalFeed), 
        unit: 'কেজি', 
        note: `পুরো ${months} মাসের আনুমানিক মোট খাবার` 
      },
      water_volume: (areaVal * 435.6 * depth).toLocaleString(),
      monthlySchedule,
      staticGuide: guideMd,
      disinfectants: [
        { name: "Timsen (টিমসেন)", usage: "১-২ গ্রাম/শতাংশ", note: "সবচেয়ে জনপ্রিয় ও কার্যকর জীবাণুনাশক। এটি পানিতে দ্রুত মিশে যায় এবং ক্ষতিকর ব্যাকটেরিয়া ধ্বংস করে।" },
        { name: "Virkon S (ভারকন এস)", usage: "২ গ্রাম/শতাংশ", note: "ভাইরাস ও ব্যাকটেরিয়া দমনে অত্যন্ত শক্তিশালী। আন্তর্জাতিকভাবে স্বীকৃত ও নিরাপদ।" },
        { name: "Zeolite (জিয়োলাইট)", usage: "২০০-৩০০ গ্রাম/শতাংশ", note: "পুকুরের তলার বিষাক্ত গ্যাস (অ্যামোনিয়া) দূর করতে অত্যন্ত কার্যকর।" }
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
      
      if (pondData && pondData.length > 0) {
        setPonds(pondData);
        const initialPond = pondData[0];
        setSelectedPond(initialPond);
        setPlannerForm(prev => ({ ...prev, area: initialPond.area.toString() }));
        await fetchPondStock(initialPond);
      }
    } catch (e) {
      console.error("Fetch Data Error:", e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const fetchPondStock = async (pond: any) => {
    try {
      const { data: stockData } = await supabase
        .from('stocking_records')
        .select('*')
        .eq('pond_id', pond.id);
      
      const currentStock = stockData || [];
      setPondStock(currentStock);
      return currentStock;
    } catch (e) {
      console.error("Stock Fetch Error:", e);
      return [];
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePondChange = async (id: string) => {
    const p = ponds.find(x => x.id === id);
    if (p) {
      setSelectedPond(p);
      setPlannerForm(prev => ({ ...prev, area: p.area.toString() }));
      await fetchPondStock(p);
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

            {/* Main Content Area */}
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-sm min-h-[400px]">
              {planResult?.staticGuide ? (
                <div className="advisory-content prose prose-slate max-w-none animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-4 border-b border-slate-50 pb-6 mb-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-800 m-0 border-none p-0">স্মার্ট চাষ গাইড (Trusted)</h2>
                      <p className="text-slate-400 font-bold text-sm">উৎস: Wikipedia, BFRI ও মৎস্য বিজ্ঞান</p>
                    </div>
                  </div>
                  <ReactMarkdown>{planResult.staticGuide}</ReactMarkdown>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                  <Info className="w-12 h-12 text-slate-200 mb-4" />
                  <p className="text-slate-400 font-bold">গাইড লোড করতে পুকুর সিলেক্ট করুন অথবা আয়তন দিন।</p>
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
