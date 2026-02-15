
import React, { useState, useMemo } from 'react';
import { UserProfile, GrowthRecord } from '../types';

const GrowthRecordsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  // Added missing user_id to mock growth records
  const [records, setRecords] = useState<GrowthRecord[]>([
    { id: '1', user_id: user.id, pond_id: 'p1', pond_name: 'পুকুর ১', avg_weight_gm: 250, sample_count: 10, date: '2024-03-01' },
    { id: '2', user_id: user.id, pond_id: 'p1', pond_name: 'পুকুর ১', avg_weight_gm: 310, sample_count: 15, date: '2024-03-15' },
    { id: '3', user_id: user.id, pond_id: 'p2', pond_name: 'পুকুর ২', avg_weight_gm: 120, sample_count: 8, date: '2024-03-10' },
  ]);

  const [pondFilter, setPondFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredRecords = useMemo(() => {
    if (pondFilter === 'all') return records;
    return records.filter(r => r.pond_name === pondFilter);
  }, [records, pondFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">মাছের বৃদ্ধি ট্র্যাকিং</h1>
          <p className="text-slate-500 font-medium">মাছের ওজন মেপে বৃদ্ধির ধারা পর্যবেক্ষণ করুন</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
        >
          <span>📈</span>
          <span>নতুন গ্রোথ লগ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <h3 className="font-black text-slate-800">সাম্প্রতিক স্যাম্পলিং রেকর্ড</h3>
            <select 
              value={pondFilter}
              onChange={(e) => setPondFilter(e.target.value)}
              className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none ring-2 ring-slate-100 focus:ring-indigo-500"
            >
              <option value="all">সব পুকুর</option>
              <option value="পুকুর ১">পুকুর ১</option>
              <option value="পুকুর ২">পুকুর ২</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">তারিখ</th>
                  <th className="px-6 py-4">পুকুর</th>
                  <th className="px-6 py-4">গড় ওজন</th>
                  <th className="px-6 py-4">স্যাম্পল সংখ্যা</th>
                  <th className="px-6 py-4 text-right">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRecords.map(rec => (
                  <tr key={rec.id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-sm whitespace-nowrap">{rec.date}</td>
                    <td className="px-6 py-4">
                      <span className="font-black text-slate-800">{rec.pond_name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-50 text-green-700 rounded-lg font-black">{rec.avg_weight_gm} গ্রাম</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-500">{rec.sample_count}টি মাছ</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-300 hover:text-rose-600 transition-colors text-xl">🗑️</button>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-slate-400 font-bold italic">কোন ডাটা পাওয়া যায়নি!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
              <span className="text-indigo-600">🧠</span> স্মার্ট গাইডলাইন
            </h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 font-bold shadow-inner">১</div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">প্রতি ১৫ দিন অন্তর অন্তত ২০টি মাছ মেপে গড় ওজন বের করুন। স্যাম্পলিং সকালে রোদের আগে করা ভালো।</p>
              </div>
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 font-bold shadow-inner">২</div>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">মাছের ওজন বাড়ার সাথে সাথে খাবারের প্রোটিন পার্সেন্টেজ ও পরিমাণ সমন্বয় করুন।</p>
              </div>
            </div>
          </div>
          
          <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2 relative z-10">প্রত্যাশিত গ্রোথ টার্গেট</p>
            <h2 className="text-3xl font-black mb-6 relative z-10">৮২.৫%</h2>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden mb-4 relative z-10">
              <div className="h-full bg-white w-[82.5%] rounded-full shadow-lg"></div>
            </div>
            <p className="text-xs text-indigo-100 font-medium relative z-10">গত ১৫ দিনে মাছের গড় ওজন ৬০ গ্রাম বৃদ্ধি পেয়েছে।</p>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800">মাছের ওজন লগ করুন</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">পুকুর নির্বাচন</label>
                <select className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold">
                  <option>পুকুর ১</option>
                  <option>পুকুর ২</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">গড় ওজন (গ্রাম)</label>
                  <input type="number" placeholder="00" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-indigo-600" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">মাছ সংখ্যা (স্যাম্পল)</label>
                  <input type="number" placeholder="00" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-black" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">স্যাম্পলিং তারিখ</label>
                <input type="date" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all">বাতিল</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrowthRecordsPage;
