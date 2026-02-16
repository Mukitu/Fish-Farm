
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
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const getAdvice = async (pond: any) => {
    setAnalyzing(true);
    try {
      const { data: water } = await supabase.from('water_logs')
        .select('*')
        .eq('pond_id', pond.id)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setLatestWater(water);

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `পুকুর: ${pond.name}, মাছ: ${pond.fish_type}. পানির মান: DO: ${water?.oxygen || 'অজানা'}, pH: ${water?.ph || 'অজানা'}, তাপমাত্রা: ${water?.temp || 'অজানা'}। এই খামারের জন্য ৩টি কার্যকরী চাষ পরামর্শ দিন বাংলায়।`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 10000 } },
      });
      setAdvice(response.text || 'কোনো পরামর্শ পাওয়া যায়নি।');
    } catch (e) {
      setAdvice('ডাটা আপডেট করুন এবং পুনরায় চেষ্টা করুন।');
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

  if (loading) return <div className="text-center py-20 font-black">তথ্য লোড হচ্ছে...</div>;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-black text-slate-800">চাষ গাইড ও পরামর্শ</h1>
        <select 
          value={selectedPond?.id || ''} 
          onChange={e => handlePondChange(e.target.value)} 
          className="px-6 py-4 bg-white rounded-2xl font-black border-none ring-1 ring-slate-200 outline-none"
        >
          {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          {ponds.length === 0 && <option value="">পুকুর যোগ করুন</option>}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 h-fit">
           <h3 className="text-xl font-black mb-6 flex items-center gap-2"><span>📊</span> বর্তমান অবস্থা</h3>
           {latestWater ? (
             <div className="space-y-4">
                <div className="flex justify-between p-5 bg-blue-50 rounded-2xl font-bold">
                  <span className="text-slate-500">অক্সিজেন:</span> <span className="text-blue-600">{latestWater.oxygen} mg/L</span>
                </div>
                <div className="flex justify-between p-5 bg-green-50 rounded-2xl font-bold">
                  <span className="text-slate-500">pH মান:</span> <span className="text-green-600">{latestWater.ph}</span>
                </div>
                <div className="flex justify-between p-5 bg-orange-50 rounded-2xl font-bold">
                  <span className="text-slate-500">তাপমাত্রা:</span> <span className="text-orange-600">{latestWater.temp}°C</span>
                </div>
             </div>
           ) : (
             <div className="text-center py-10">
               <p className="text-rose-500 font-bold mb-4">পানির মান রেকর্ড নেই!</p>
               <p className="text-xs text-slate-400">ভালো পরামর্শের জন্য পানির মান আপডেট করুন</p>
             </div>
           )}
        </div>

        <div className="lg:col-span-2 bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden min-h-[400px]">
           <div className="absolute top-0 right-0 p-8 opacity-5 text-9xl">💡</div>
           <h3 className="text-2xl font-black mb-8 flex items-center gap-3">🤖 এআই চাষ বিশেষজ্ঞের পরামর্শ</h3>
           {analyzing ? (
             <div className="space-y-6 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-full"></div>
                <div className="h-4 bg-white/10 rounded w-2/3"></div>
                <p className="text-blue-400 font-bold text-sm">আপনার পুকুরের ডাটা বিশ্লেষণ করা হচ্ছে...</p>
             </div>
           ) : (
             <div className="prose prose-invert max-w-none whitespace-pre-wrap font-medium text-slate-300 leading-relaxed text-lg">
               {advice || 'পুকুর সিলেক্ট করে পরামর্শ নিন।'}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AdvisoryPage;
