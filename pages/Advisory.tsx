
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
    const { data } = await supabase.from('ponds').select('*').eq('user_id', user.id);
    if (data && data.length > 0) {
      setPonds(data);
      setSelectedPond(data[0]);
      await getAdvice(data[0].id);
    }
    setLoading(false);
  };

  const getAdvice = async (pondId: string) => {
    setAnalyzing(true);
    const { data: water } = await supabase.from('water_logs')
      .select('*')
      .eq('pond_id', pondId)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    setLatestWater(water);
    const pond = ponds.find(p => p.id === pondId) || selectedPond;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `পুকুরের নাম: ${pond.name}, মাছ: ${pond.fish_type}. পানির অবস্থা: DO: ${water?.oxygen || 'অজানা'}, pH: ${water?.ph || 'অজানা'}, Temp: ${water?.temp || 'অজানা'}। এই পুকুরের জন্য ৩টি বৈজ্ঞানিক পরামর্শ দিন।`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });
      setAdvice(response.text || 'কোনো পরামর্শ পাওয়া যায়নি।');
    } catch (e) {
      setAdvice('পানির মান আপডেট করুন অথবা ইন্টারনেট চেক করুন।');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePondChange = (id: string) => {
    const p = ponds.find(x => x.id === id);
    setSelectedPond(p);
    getAdvice(id);
  };

  if (loading) return <div className="text-center py-20 font-black">লোড হচ্ছে...</div>;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-800">চাষ গাইড (এআই)</h1>
        <select value={selectedPond?.id} onChange={e => handlePondChange(e.target.value)} className="px-6 py-4 bg-white rounded-2xl font-black border-none ring-1 ring-slate-100">
          {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
           <h3 className="text-xl font-black mb-6">বর্তমান অবস্থা</h3>
           {latestWater ? (
             <div className="space-y-4">
                <div className="flex justify-between p-4 bg-blue-50 rounded-2xl font-bold">
                  <span>অক্সিজেন:</span> <span>{latestWater.oxygen} mg/L</span>
                </div>
                <div className="flex justify-between p-4 bg-green-50 rounded-2xl font-bold">
                  <span>pH মান:</span> <span>{latestWater.ph}</span>
                </div>
             </div>
           ) : <p className="text-rose-500 font-bold">পানির মান রেকর্ড নেই!</p>}
        </div>

        <div className="lg:col-span-2 bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">📖</div>
           <h3 className="text-2xl font-black mb-6 flex items-center gap-3">🤖 এআই পরামর্শ</h3>
           {analyzing ? <div className="animate-pulse">বিশ্লেষণ করা হচ্ছে...</div> : (
             <div className="prose prose-invert whitespace-pre-wrap font-medium text-slate-300 leading-relaxed">
               {advice}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AdvisoryPage;
