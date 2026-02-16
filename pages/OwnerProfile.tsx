
import React from 'react';
import { Link } from 'react-router-dom';

const OwnerProfile: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-['Hind_Siliguri']">
      <nav className="p-6 border-b border-slate-50">
        <Link to="/" className="text-blue-600 font-black">← হোম পেজে ফিরে যান</Link>
      </nav>
      <div className="max-w-4xl mx-auto py-16 px-6 text-center">
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-blue-600 rounded-[3rem] rotate-6 -z-10 opacity-10"></div>
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Nishat&backgroundColor=b6e3f4" 
            alt="Owner" 
            className="w-48 h-48 md:w-64 md:h-64 rounded-[3rem] border-8 border-white shadow-2xl object-cover"
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4">মুকিতুল ইসলাম নিশাত</h1>
        <p className="text-xl md:text-2xl text-blue-600 font-black mb-12 italic">প্রতিষ্ঠাতা ও প্রধান নির্বাহী, মৎস্য খামার</p>
        
        <div className="bg-slate-50 p-10 md:p-16 rounded-[4rem] text-left shadow-inner border border-slate-100">
           <h3 className="text-2xl font-black text-slate-800 mb-6 border-b border-slate-200 pb-4">আমার স্বপ্ন</h3>
           <p className="text-slate-600 text-lg leading-relaxed font-medium">
             বাংলাদেশের প্রান্তিক খামারিদের প্রযুক্তিগত সহায়তা দিতে আমি এই প্ল্যাটফর্মটি তৈরি করেছি। আমরা চাই প্রতিটি পুকুরের হিসাব থাকুক স্বচ্ছ এবং প্রত্যেক খামারি যেন নিশ্চিত লাভের মুখ দেখেন। আমাদের লক্ষ্য প্রযুক্তির মাধ্যমে মৎস্য চাষকে আরও লাভজনক করা।
           </p>
           <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">যোগাযোগ</p>
                 <p className="text-xl font-black text-slate-800">০১৩০৩-৫৯৫০৬২</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-2">অবস্থান</p>
                 <p className="text-xl font-black text-slate-800">রাজশাহী, বাংলাদেশ</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;
