
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPonds();
  }, []);

  const fetchPonds = async () => {
    setLoading(true);
    const { data } = await supabase.from('ponds').select('*').eq('is_archived', false);
    if (data && data.length > 0) {
      setPonds(data as Pond[]);
      setSelectedPond(data[0] as Pond);
    }
    setLoading(false);
  };

  const calculateDosage = (area: number, fishType: string) => {
    // মাছের ধরণ অনুযায়ী মাল্টিপ্লায়ার অ্যাডজাস্টমেন্ট
    let multiplier = 1.0;
    if (fishType.includes('তেলাপিয়া')) multiplier = 1.2;
    if (fishType.includes('কার্প')) multiplier = 1.0;
    if (fishType.includes('পাঙ্গাস')) multiplier = 1.5;

    return {
      salt: (area * 1 * multiplier).toFixed(1),
      lime: (area * 1).toFixed(1),
      pesticide: (area * 10 * multiplier).toFixed(0),
      potash: (area * 5).toFixed(0),
      zeolite: (area * 15).toFixed(0),
      vitaminC: (area * 2).toFixed(0),
    };
  };

  const dosages = selectedPond ? calculateDosage(selectedPond.area, selectedPond.fish_type) : null;

  if (loading) return <div className="py-20 text-center font-black animate-pulse">স্মার্ট গাইড লোড হচ্ছে...</div>;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">স্মার্ট চাষ গাইড ও ঔষধ ক্যালকুলেটর</h1>
          <p className="text-slate-500 font-bold mt-2">
            {selectedPond ? `নির্বাচিত পুকুর: ${selectedPond.name} (${selectedPond.area} শতাংশ)` : 'অনুগ্রহ করে প্রথমে পুকুর যোগ করুন'}
          </p>
        </div>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-xl shadow-blue-100 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> এআই গাইড সক্রিয়
        </div>
      </div>

      {/* Pond Selector */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-6 ml-2">আপনার পুকুর তালিকা থেকে একটি নির্বাচন করুন</label>
        <div className="flex flex-wrap gap-4">
          {ponds.map(pond => (
            <button
              key={pond.id}
              onClick={() => setSelectedPond(pond)}
              className={`px-8 py-5 rounded-[2rem] font-black transition-all flex items-center gap-3 border-2 ${selectedPond?.id === pond.id ? 'bg-blue-600 text-white border-blue-600 shadow-2xl scale-105' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
            >
              <span className="text-xl">🌊</span>
              <div className="text-left">
                <p className="leading-none mb-1">{pond.name}</p>
                <p className="text-[10px] opacity-60 font-bold">{pond.area} শতাংশ | {pond.fish_type}</p>
              </div>
            </button>
          ))}
          {ponds.length === 0 && (
            <p className="text-rose-500 font-bold italic">কোন পুকুর পাওয়া যায়নি। ড্যাশবোর্ড থেকে পুকুর যোগ করুন।</p>
          )}
        </div>
      </div>

      {selectedPond && dosages && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AdvisoryCard title="লবণ (Salt)" value={`${dosages.salt} কেজি`} icon="🧂" color="bg-blue-500" instruction={`আপনার ${selectedPond.fish_type} চাষের জন্য ঘা রোধে বিশেষ কার্যকর।`} />
          <AdvisoryCard title="চুন (Lime)" value={`${dosages.lime} কেজি`} icon="⚪" color="bg-slate-400" instruction="পানির পিএইচ লেভেল ৭.৫ - ৮.৫ রাখতে সাহায্য করে।" />
          <AdvisoryCard title="পোকানাশক (Pesticide)" value={`${dosages.pesticide} মিলি`} icon="🦟" color="bg-rose-500" instruction="সকাল রোদের সময় প্রয়োগ করুন। ২১ দিন পর পর।" />
          <AdvisoryCard title="জিওলাইট (Gas Control)" value={`${dosages.zeolite} গ্রাম`} icon="☁️" color="bg-cyan-500" instruction="পুকুরের তলায় গ্যাস তৈরি হলে দ্রুত ফলাফল দেয়।" />
          <AdvisoryCard title="পটাশ সার" value={`${dosages.potash} গ্রাম`} icon="🧪" color="bg-purple-500" instruction="পানির জীবনু নাশক হিসেবে ২০ দিন পর পর ব্যবহার্য।" />
          <AdvisoryCard title="ভিটামিন-সি" value={`${dosages.vitaminC} গ্রাম`} icon="💊" color="bg-amber-500" instruction="মাছের ইমিউনিটি বাড়াতে খাবারের সাথে মিশিয়ে দিন।" />
        </div>
      )}

      {/* Expert Tips */}
      <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
         <h2 className="text-2xl font-black mb-10 flex items-center gap-4">
            <span className="bg-blue-600 p-3 rounded-2xl">🎓</span> বিশেষজ্ঞের পরামর্শ (Best Practices)
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
               <TipItem icon="📉" text="FCR কমানোর জন্য খাবারের অপচয় বন্ধ করুন। ট্রে ফিডিং পদ্ধতি ব্যবহার করলে ১০-১৫% খাবার সাশ্রয় হয়।" />
               <TipItem icon="🌞" text="রৌদ্রোজ্জ্বল দিনে খাবার বেশি দিন, মেঘলা দিনে খাবারের পরিমাণ ৩০-৫০% কমিয়ে দিন।" />
            </div>
            <div className="space-y-6">
               <TipItem icon="🧪" text="সকাল ৮টায় এবং বিকাল ৪টায় পানির অক্সিজেন লেভেল পরীক্ষা করুন। কম মনে হলে এয়ারেটর চালান।" />
               <TipItem icon="🩺" text="মাছ ভাসতে শুরু করলে খাবার বন্ধ করে দ্রুত লবণ ও পটাশ প্রয়োগ করুন।" />
            </div>
         </div>
      </div>
    </div>
  );
};

const AdvisoryCard: React.FC<{ title: string; value: string; icon: string; color: string; instruction: string }> = ({ title, value, icon, color, instruction }) => (
  <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
    <div className={`${color} w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-3xl mb-8 shadow-xl group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
    <p className="text-4xl font-black text-slate-800 tracking-tighter">{value}</p>
    <div className="mt-8 pt-8 border-t border-slate-50">
       <p className="text-xs text-slate-500 font-bold leading-relaxed italic">
          <span className="text-blue-600 not-italic font-black">গাইড: </span>{instruction}
       </p>
    </div>
  </div>
);

const TipItem: React.FC<{ icon: string, text: string }> = ({ icon, text }) => (
  <div className="flex gap-4 items-start">
    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-xl shrink-0">{icon}</div>
    <p className="text-slate-300 text-sm font-medium leading-relaxed">{text}</p>
  </div>
);

export default AdvisoryPage;
