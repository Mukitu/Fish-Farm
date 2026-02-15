
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [selectedPond, setSelectedPond] = useState<Pond | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPonds = async () => {
      setLoading(true);
      const { data } = await supabase.from('ponds').select('*').eq('is_archived', false);
      if (data && data.length > 0) {
        setPonds(data as Pond[]);
        setSelectedPond(data[0] as Pond);
      }
      setLoading(false);
    };
    fetchPonds();
  }, []);

  const calculateDosage = (area: number, fishType: string) => {
    let m = 1.0;
    if (fishType.includes('তেলাপিয়া') || fishType.toLowerCase().includes('telapia')) m = 1.2;
    if (fishType.includes('পাঙ্গাস') || fishType.toLowerCase().includes('pangash')) m = 1.5;

    return {
      salt: (area * 1 * m).toFixed(1),
      lime: (area * 1).toFixed(1),
      pesticide: (area * 10 * m).toFixed(0),
      potash: (area * 5).toFixed(0),
      zeolite: (area * 15).toFixed(0)
    };
  };

  if (loading) return <div className="py-20 text-center font-black animate-pulse">স্মার্ট গাইড তৈরি হচ্ছে...</div>;

  const dosages = selectedPond ? calculateDosage(selectedPond.area, selectedPond.fish_type) : null;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter">স্মার্ট চাষ গাইড ও ঔষধ ক্যালকুলেটর</h1>
          <p className="text-slate-500 font-bold mt-2">
            {selectedPond ? `নির্বাচিত: ${selectedPond.name} (${selectedPond.area} শতাংশ)` : 'প্রথমে ড্যাশবোর্ড থেকে পুকুর যোগ করুন'}
          </p>
        </div>
        <div className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span> এআই গাইড সক্রিয়
        </div>
      </div>

      {ponds.length > 0 ? (
        <>
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4 ml-2">পুকুর নির্বাচন করুন</label>
            <div className="flex flex-wrap gap-3">
              {ponds.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPond(p)}
                  className={`px-6 py-4 rounded-2xl font-black transition-all border-2 ${selectedPond?.id === p.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <DosageCard title="লবণ (Salt)" value={`${dosages?.salt} কেজি`} icon="🧂" color="bg-blue-500" hint="পুকুরের জীবাণু নাশে ও পিএইচ ঠিক রাখতে।" />
            <DosageCard title="চুন (Lime)" value={`${dosages?.lime} কেজি`} icon="⚪" color="bg-slate-400" hint="পানির অস্বচ্ছতা দূর করতে ব্যবহার করুন।" />
            <DosageCard title="পোকানাশক" value={`${dosages?.pesticide} মিলি`} icon="🦟" color="bg-rose-500" hint="পানির পোকা দমনে ১০-১৫ দিন অন্তর।" />
            <DosageCard title="জিওলাইট" value={`${dosages?.zeolite} গ্রাম`} icon="☁️" color="bg-cyan-500" hint="গ্যাস সমস্যা সমাধানে জরুরি।" />
            <DosageCard title="পটাশ" value={`${dosages?.potash} গ্রাম`} icon="🧪" color="bg-purple-500" hint="দ্রুত পানির জীবাণু ধ্বংস করতে।" />
          </div>
        </>
      ) : (
        <div className="py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <p className="text-slate-400 font-black">আপনার কোনো পুকুর খুঁজে পাওয়া যায়নি।</p>
        </div>
      )}
    </div>
  );
};

const DosageCard = ({ title, value, icon, color, hint }: any) => (
  <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
    <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform`}>{icon}</div>
    <p className="text-[10px] text-slate-400 font-black uppercase mb-1">{title}</p>
    <p className="text-3xl font-black text-slate-800">{value}</p>
    <p className="mt-4 text-[10px] text-slate-500 font-bold italic">{hint}</p>
  </div>
);

export default AdvisoryPage;
