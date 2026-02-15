
import React, { useState } from 'react';
import { UserProfile, Pond } from '../types';

const AdvisoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  // Fixed: Added missing is_archived property to Pond objects
  const [ponds] = useState<Pond[]>([
    { id: '1', user_id: user.id, name: 'পুকুর ১ (পূর্ব পাড়)', area: 40, fish_type: 'তেলাপিয়া', stock_date: '2024-01-10', is_active: true, is_archived: false },
    { id: '2', user_id: user.id, name: 'পুকুর ২ (নতুন)', area: 30, fish_type: 'কার্প জাতীয়', stock_date: '2024-02-15', is_active: true, is_archived: false },
  ]);

  const [selectedPond, setSelectedPond] = useState<Pond | null>(ponds[0]);

  // Expert Dosages Calculation logic for maximum profit
  const calculateDosage = (area: number) => {
    return {
      salt: area * 1, // 1kg per decimal
      lime: area * 1, // 1kg per decimal
      pesticide: area * 10, // 10ml per decimal
      potash: area * 5, // 5gm per decimal
      zeolite: area * 15, // 15gm per decimal for gas control
      vitaminC: area * 2, // 2gm per decimal for immunity
    };
  };

  const dosages = selectedPond ? calculateDosage(selectedPond.area) : null;

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">স্মার্ট চাষ গাইড ও ঔষধ ক্যালকুলেটর</h1>
          <p className="text-slate-500 font-medium">আপনার পুকুর ({selectedPond?.area} শতাংশ) অনুযায়ী প্রয়োজনীয় উপকরণের তালিকা</p>
        </div>
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm">
          প্যাকেজ: সকল ফিচার আনলকড্ ✅
        </div>
      </div>

      {/* Pond Selector */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4 ml-2">পুকুর নির্বাচন করুন (আয়তন অনুযায়ী হিসাব হবে)</label>
        <div className="flex flex-wrap gap-3">
          {ponds.map(pond => (
            <button
              key={pond.id}
              onClick={() => setSelectedPond(pond)}
              className={`px-6 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 ${selectedPond?.id === pond.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <span>🌊</span>
              <span>{pond.name} ({pond.area} শতাংশ)</span>
            </button>
          ))}
        </div>
      </div>

      {selectedPond && dosages && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AdvisoryCard title="লবণ (Salt)" value={`${dosages.salt} কেজি`} icon="🧂" color="bg-blue-500" instruction="মাছের ঘা ও ব্যাকটেরিয়া রোধে। ১৫ দিন পর পর।" />
          <AdvisoryCard title="চুন (Lime)" value={`${dosages.lime} কেজি`} icon="⚪" color="bg-slate-400" instruction="পানির পিএইচ ও স্বচ্ছতা বজায় রাখতে। ৩০ দিন পর পর।" />
          <AdvisoryCard title="পোকানাশক" value={`${dosages.pesticide} মিলি`} icon="🦟" color="bg-rose-500" instruction="পানির পোকা ও উকুন মারতে। প্রয়োজনে ২১ দিন পর পর।" />
          <AdvisoryCard title="জিওলাইট (Gas Control)" value={`${dosages.zeolite} গ্রাম`} icon="☁️" color="bg-cyan-500" instruction="পুকুরের তলার বিষাক্ত গ্যাস দূর করতে। ১৫ দিন পর পর।" />
          <AdvisoryCard title="পটাশ সার" value={`${dosages.potash} গ্রাম`} icon="🧪" color="bg-purple-500" instruction="পানির জীবনু নাশক হিসেবে। ২০ দিন পর পর।" />
          <AdvisoryCard title="ভিটামিন-সি" value={`${dosages.vitaminC} গ্রাম`} icon="💊" color="bg-amber-500" instruction="মাছের রোগ প্রতিরোধ ক্ষমতা বাড়াতে। খাবারের সাথে প্রতিদিন।" />
        </div>
      )}

      {/* Treatment Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-8 flex items-center gap-4">
              <span className="bg-blue-600 p-2 rounded-xl">📅</span> পূর্ণাঙ্গ চাষ সময়সূচী ও পরিচর্যা
            </h2>
            <div className="space-y-8">
              <ScheduleItem 
                time="পুকুর প্রস্তুতি" 
                task="চুন ও লবণ প্রয়োগ করুন। ৭ দিন পানি শুকিয়ে রাখা ভালো।" 
                importance="অত্যন্ত গুরুত্বপূর্ণ"
                color="border-blue-500"
              />
              <ScheduleItem 
                time="পোনা ছাড়ার ১০ দিন পর" 
                task="পটাশ দিয়ে পানি শোধন এবং ভিটামিন সি খাওয়ানো শুরু করুন।" 
                importance="স্বাস্থ্য সুরক্ষা"
                color="border-amber-500"
              />
              <ScheduleItem 
                time="প্রতি ১৫ দিন অন্তর" 
                task="লবণ ও জিওলাইট প্রয়োগ করুন। মাছের স্যাম্পলিং করে ওজন দেখুন।" 
                importance="বৃদ্ধি পর্যবেক্ষণ"
                color="border-green-500"
              />
              <ScheduleItem 
                time="প্রতি ৩০ দিন অন্তর" 
                task="চুন প্রয়োগ করুন। পুকুরের তলার কাদা পরিষ্কার বা নাড়া দিলে ভালো হয়।" 
                importance="পরিবেশ নিয়ন্ত্রণ"
                color="border-purple-500"
              />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 blur-[120px] rounded-full"></div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-8 rounded-[2.5rem] text-white shadow-xl">
            <h3 className="text-xl font-black mb-4 flex items-center gap-2">🚀 প্রফিট ম্যাক্সিমাইজার</h3>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex gap-3">
                <span className="text-green-400">✓</span>
                খাবারের অপচয় রোধ করতে ট্রা-ফিডিং (Tray Feeding) পদ্ধতি ব্যবহার করুন।
              </li>
              <li className="flex gap-3">
                <span className="text-green-400">✓</span>
                সকাল ১০টার আগে ও রাত ১০টার পর খাবারের পরিমাণ কমিয়ে দিন।
              </li>
              <li className="flex gap-3">
                <span className="text-green-400">✓</span>
                FCR ১.২ থেকে ১.৪ এর মধ্যে থাকলে বুঝবেন আপনার লাভ সর্বোচ্চ হচ্ছে।
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 mb-4">জরুরী সতর্কতা 🚨</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              যদি দেখেন মাছের কানকো লাল হয়ে গেছে বা গায়ে সাদা স্পট পড়েছে, তবে ঔষধ প্রয়োগের আগে আমাদের হেল্পলাইনে বিশেষজ্ঞের পরামর্শ নিন। অতিরিক্ত ঔষধ প্রয়োগ মাছের গ্রোথ কমিয়ে দিতে পারে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdvisoryCard: React.FC<{ title: string; value: string; icon: string; color: string; instruction: string }> = ({ title, value, icon, color, instruction }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
    <div className={`absolute -right-4 -top-4 text-6xl opacity-5 group-hover:rotate-12 transition-transform`}>{icon}</div>
    <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl mb-6 shadow-lg`}>
      {icon}
    </div>
    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{title}</p>
    <p className="text-3xl font-black text-slate-800">{value}</p>
    <p className="mt-4 text-xs text-slate-500 font-semibold leading-relaxed border-t border-slate-50 pt-4 italic">
      <span className="text-blue-600 not-italic font-black">নির্দেশনা: </span>{instruction}
    </p>
  </div>
);

const ScheduleItem: React.FC<{ time: string; task: string; importance: string; color: string }> = ({ time, task, importance, color }) => (
  <div className={`pl-6 border-l-4 ${color} relative py-2`}>
    <div className="absolute -left-[11px] top-4 w-5 h-5 bg-slate-900 border-4 border-inherit rounded-full"></div>
    <div className="flex justify-between items-center mb-1">
      <p className="font-black text-blue-400 text-sm">{time}</p>
      <span className="text-[8px] font-black uppercase tracking-widest bg-white/10 px-2 py-1 rounded">{importance}</span>
    </div>
    <p className="text-slate-300 text-sm leading-relaxed">{task}</p>
  </div>
);

export default AdvisoryPage;
