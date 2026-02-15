
import React from 'react';
import { UserProfile } from '../types';

const ReportsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">রিপোর্ট ও বিশ্লেষণ</h1>
        <button className="px-4 py-2 bg-gray-800 text-white rounded-lg font-bold flex items-center gap-2">
          <span>📥</span>
          <span>পিডিএফ ডাউনলোড</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-6">লাভ-ক্ষতি বিশ্লেষণ</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">মোট বিক্রয়</span>
              <span className="font-bold text-green-600">৳ ৫২০,০০০</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-gray-500">মোট খরচ</span>
              <span className="font-bold text-red-500">৳ ১৮৫,০০০</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-lg font-bold">নীট মুনাফা</span>
              <span className="text-lg font-bold text-blue-600">৳ ৩৩৫,০০০</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="text-lg font-bold mb-6">মাছের বৃদ্ধি (FCR)</h3>
          <div className="flex items-center justify-center h-40 border-2 border-dashed border-gray-100 rounded-lg">
             <div className="text-center">
                <p className="text-4xl font-black text-gray-300">১.৫</p>
                <p className="text-sm text-gray-400">গড় FCR স্কোর</p>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4">পুকুর ভিত্তিক পরিসংখ্যান</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase">
              <tr>
                <th className="px-4 py-3">পুকুরের নাম</th>
                <th className="px-4 py-3">মোট খরচ (৳)</th>
                <th className="px-4 py-3">মোট বিক্রয় (৳)</th>
                <th className="px-4 py-3">বর্তমান মুনাফা (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              <tr>
                <td className="px-4 py-4 font-bold">পুকুর ১</td>
                <td className="px-4 py-4 text-red-500">১২০,০০০</td>
                <td className="px-4 py-4 text-green-600-500">৪৫০,০০০</td>
                <td className="px-4 py-4 font-bold text-blue-600">৩৩০,০০০</td>
              </tr>
              <tr>
                <td className="px-4 py-4 font-bold">পুকুর ২</td>
                <td className="px-4 py-4 text-red-500">৬৫,০০০</td>
                <td className="px-4 py-4 text-green-600-500">৭০,০০০</td>
                <td className="px-4 py-4 font-bold text-blue-600">৫,০০০</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
