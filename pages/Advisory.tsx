
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';
import { GoogleGenAI } from "@google/genai";

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [selectedPond, setSelectedPond] = useState<any | null>(null);
  const [latestWater, setLatestWater] = useState<any>(null);
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('ponds').select('*').eq('user_id', user.id);
      if (data && data.length > 0) {
        setPonds(data);
        const initialPond = data[0];
        setSelectedPond(initialPond);
        await getAdvice(initialPond);
      }
    } catch (e) { 
      console.error("Fetch Data Error:", e); 
    } finally { 
      setLoading(false); 
    }
  };

  const getAdvice = async (pond: any) => {
    setAnalyzing(true);
    setAdvice('');
    try {
      const { data: water } = await supabase.from('water_logs')
        .select('*')
        .eq('pond_id', pond.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setLatestWater(water);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `পুকুরের নাম: ${pond.name}, মাছের ধরণ: ${pond.fish_type}. পানির বর্তমান মান: অক্সিজেন: ${water?.oxygen || 'অজানা'}, pH: ${water?.ph || 'অজানা'}, তাপমাত্রা: ${water?.temp || 'অজানা'}। এই তথ্য অনুযায়ী মাছের মৃত্যুঝুঁকি কমাতে এবং দ্রুত বৃদ্ধি করতে ৩টি কার্যকরী পরামর্শ বাংলায় দিন।`;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp", // Stable and fast for simple text tasks
        contents: prompt,
      });

      const text = response.text;
      setAdvice(text || 'দুঃখিত, কোনো পরামর্শ পাওয়া যায়নি। অনুগ্রহ করে ডাটা পুনরায় চেক করুন।');
    } catch (e: any) {
      console.error("AI Generation Error:", e);
      setAdvice('এআই পরামর্শ তৈরি করতে সমস্যা হয়েছে। আপনার এপিআই কী চেক করুন এবং নিশ্চিত করুন যে আপনার পুকুরের পানির মান সঠিক আছে।');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePondChange = (id: string) => {
    const p = ponds.find(x => x.id === id);
    if (p) {
      setSelectedPond(p);
      getAdvice(p);
    }
  };

  if (loading) return (
    <div className="min-h-[400px] flex items-center justify-center bg-white flex-col gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-black text-blue-600">খামারের তথ্য বিশ্লেষণ হচ্ছে...</p>
    </div>
  );

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <h1 className="text-4xl font-black text-slate-800 tracking-tight">স্মার্ট চাষ গাইড</h1>
           <p className="text-slate-500 font-bold">পুকুর অনুযায়ী এআই চালিত বৈজ্ঞানিক পরামর্শ</p>
        </div>
        <div className="w-full md:w-auto">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 block mb-1">পুকুর নির্বাচন করুন</label>
          <select 
            value={selectedPond?.id || ''} 
            onChange={e => handlePondChange(e.target.value)} 
            className="w-full md:w-80 px-6 py-4 bg-white rounded-2xl font-black border-none ring-1 ring-slate-200 shadow-sm focus:ring-2 focus:ring-blue-600 transition-all outline-none"
          >
            {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            {ponds.length === 0 && <option value="">আগে পুকুর যোগ করুন</option>}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 h-fit">
           <h3 className="text-xl font-black mb-8 flex items-center gap-2">📊 পানির সর্বশেষ মান</h3>
           {latestWater ? (
             <div className="space-y-4">
                <div className="flex justify-between p-5 bg-blue-50 rounded-2xl font-bold group hover:bg-blue-600 hover:text-white transition-colors">
                  <span className="opacity-60 group-hover:opacity-100">অক্সিজেন:</span> 
                  <span className="font-black">{latestWater.oxygen} mg/L</span>
                </div>
                <div className="flex justify-between p-5 bg-green-50 rounded-2xl font-bold group hover:bg-green-600 hover:text-white transition-colors">
                  <span className="opacity-60 group-hover:opacity-100">pH মান:</span> 
                  <span className="font-black">{latestWater.ph}</span>
                </div>
                <div className="flex justify-between p-5 bg-orange-50 rounded-2xl font-bold group hover:bg-orange-600 hover:text-white transition-colors">
                  <span className="opacity-60 group-hover:opacity-100">তাপমাত্রা:</span> 
                  <span className="font-black">{latestWater.temp}°C</span>
                </div>
                <p className="text-[10px] text-center text-slate-400 font-black mt-4 uppercase tracking-tighter">সর্বশেষ আপডেট: {new Date(latestWater.date).toLocaleDateString('bn-BD')}</p>
             </div>
           ) : (
             <div className="text-center py-12 px-6 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
               <p className="text-rose-500 font-black mb-4">পানির কোনো লগ নেই!</p>
               <p className="text-xs text-slate-400 font-medium">সঠিক পরামর্শের জন্য ড্যাশবোর্ড থেকে পুকুরের পানির মান রেকর্ড করুন।</p>
             </div>
           )}
        </div>

        <div className="lg:col-span-2 bg-slate-900 text-white p-10 md:p-16 rounded-[4rem] shadow-2xl relative overflow-hidden min-h-[500px]">
           <div className="absolute top-0 right-0 p-12 opacity-5 text-9xl">🤖</div>
           <div className="relative z-10">
              <h3 className="text-3xl font-black mb-10 flex items-center gap-4">
                 <span className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl">💡</span>
                 এআই বিশেষজ্ঞের পরামর্শ
              </h3>
              
              {analyzing ? (
                <div className="space-y-8 animate-pulse">
                   <div className="h-4 bg-white/10 rounded w-3/4"></div>
                   <div className="h-4 bg-white/10 rounded w-full"></div>
                   <div className="h-4 bg-white/10 rounded w-2/3"></div>
                   <div className="h-4 bg-white/10 rounded w-5/6"></div>
                   <p className="text-blue-400 font-black text-sm tracking-widest uppercase mt-10">পুকুরের ডাটা বিশ্লেষণ করা হচ্ছে...</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none whitespace-pre-wrap font-medium text-slate-300 leading-relaxed text-xl">
                  {advice || 'পুকুর সিলেক্ট করলে এখানে পরামর্শ লোড হবে।'}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisoryPage;
