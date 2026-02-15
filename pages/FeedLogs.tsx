
import React, { useState } from 'react';
import { UserProfile } from '../types';

const FeedLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState([
    { id: '1', pond: 'পুকুর ১', item: 'নারিশ স্টার্টার', amount: 5, time: 'সকাল ০৭:৩০', date: '২০২৪-০৩-০৭' },
    { id: '2', pond: 'পুকুর ১', item: 'নারিশ স্টার্টার', amount: 3.5, time: 'বিকাল ০৫:১৫', date: '২০২৪-০৩-০৭' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800">খাবার প্রয়োগ লগ</h1>
          <p className="text-slate-500">প্রতিদিনের সঠিক ফিডিং ম্যানেজমেন্ট নিশ্চিত করুন</p>
        </div>
        <button className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all">
          <span>🍽️</span>
          <span>খাবার প্রদান করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">তারিখ ও সময়</th>
                  <th className="px-6 py-4">পুকুর</th>
                  <th className="px-6 py-4">খাবারের ধরণ</th>
                  <th className="px-6 py-4 text-right">পরিমাণ (কেজি)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <p className="font-bold">{log.time}</p>
                       <p className="text-[10px] text-slate-400">{log.date}</p>
                    </td>
                    <td className="px-6 py-4 font-medium">{log.pond}</td>
                    <td className="px-6 py-4">
                       <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">{log.item}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-blue-600">{log.amount.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="text-blue-400">⚙️</span> FCR ক্যালকুলেটর
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">মোট প্রদত্ত খাবার (কেজি)</label>
                <input type="number" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500" placeholder="0.0" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">মোট প্রাপ্ত ওজন (কেজি)</label>
                <input type="number" className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-blue-500" placeholder="0.0" />
              </div>
              <div className="pt-2">
                <div className="flex justify-between items-center bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30">
                  <span className="text-sm font-bold">FCR স্কোর:</span>
                  <span className="text-2xl font-black text-blue-400">১.৪৫</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-800 font-bold mb-4">গাইডলাইন</h3>
            <ul className="text-sm text-slate-500 space-y-3">
              <li className="flex gap-2">✅ খাবারের পরিমাণ দেহের ওজনের ২-৩% রাখুন।</li>
              <li className="flex gap-2">✅ রোদের সময় খাবার দেওয়া ভালো।</li>
              <li className="flex gap-2 text-rose-500 font-medium">⚠️ মেঘলা দিনে খাবারের পরিমাণ কমিয়ে দিন।</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedLogsPage;
