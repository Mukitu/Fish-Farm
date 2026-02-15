
import React, { useState } from 'react';
import { UserProfile, InventoryItem } from '../types';

const InventoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  // Added missing user_id to mock data items
  const [items, setItems] = useState<InventoryItem[]>([
    { id: '1', user_id: user.id, name: 'নারিশ মাছের খাবার (নার্সারি)', quantity: 250, unit: 'কেজি', type: 'খাবার', low_stock_threshold: 50 },
    { id: '2', user_id: user.id, name: 'অক্সিজেন পাউডার', quantity: 12, unit: 'প্যাকেট', type: 'ওষুধ', low_stock_threshold: 15 },
    { id: '3', user_id: user.id, name: 'পটাশিয়াম পারম্যাঙ্গানেট', quantity: 5, unit: 'কেজি', type: 'ওষুধ', low_stock_threshold: 10 },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">গুদাম (Inventory)</h1>
          <p className="text-slate-500 font-medium">আপনার মজুদ পণ্য ও ওষুধের হিসাব রাখুন</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-indigo-200"
        >
          <span>➕</span>
          <span>পণ্য যোগ করুন</span>
        </button>
      </div>

      {/* Notifications for low stock */}
      <div className="space-y-3">
        {items.filter(item => item.quantity < item.low_stock_threshold).map(item => (
          <div key={`alert-${item.id}`} className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center justify-between text-rose-700 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚨</span>
              <p className="text-sm font-bold"><strong>{item.name}</strong> এর স্টক কমে গেছে ({item.quantity} {item.unit})! দ্রুত সংগ্রহ করুন।</p>
            </div>
            <button className="text-rose-400 hover:text-rose-600">✖</button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {items.map(item => {
          const isLow = item.quantity < item.low_stock_threshold;
          return (
            <div key={item.id} className={`bg-white p-6 rounded-3xl border shadow-sm transition-all group ${isLow ? 'border-rose-200 bg-rose-50/20' : 'border-slate-100 hover:shadow-md'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${item.type === 'খাবার' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                  {item.type === 'খাবার' ? '🌾' : '💊'}
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${isLow ? 'bg-rose-600 text-white animate-pulse' : 'bg-green-100 text-green-700'}`}>
                    {isLow ? 'Low Stock' : 'Good'}
                  </span>
                </div>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{item.name}</h3>
              <p className="text-xs text-slate-400 mb-4">{item.type} | থ্রেশহোল্ড: {item.low_stock_threshold} {item.unit}</p>
              <div className="flex justify-between items-end">
                <div>
                  <p className={`text-3xl font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity} {item.unit}</p>
                </div>
                <button className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isLow ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 hover:bg-blue-600 hover:text-white'}`}>
                  ব্যবহার করুন
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-blue-200 relative overflow-hidden">
         <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
         <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-4xl relative z-10">🔔</div>
         <div className="flex-1 text-center md:text-left relative z-10">
            <h2 className="text-2xl font-bold mb-2">ইনভেন্টরি স্মার্ট এলার্ট</h2>
            <p className="text-blue-100 text-sm">খাবার বা ঔষধ নির্দিষ্ট পরিমাণের নিচে নামলেই আপনাকে ইন-অ্যাপ এবং ইমেইল নোটিফিকেশন পাঠানো হবে।</p>
         </div>
         <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black hover:scale-105 transition-transform shadow-xl relative z-10">কনফিগার করুন</button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800">নতুন পণ্য যোগ করুন</h3>
            <div className="space-y-4">
              <input type="text" placeholder="পণ্যের নাম" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="পরিমাণ" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
                <select className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold">
                  <option>কেজি</option>
                  <option>লিটার</option>
                  <option>প্যাকেট</option>
                </select>
              </div>
              <input type="number" placeholder="লো-স্টক থ্রেশহোল্ড (Alert point)" className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-rose-500" />
            </div>
            <div className="flex gap-4 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
