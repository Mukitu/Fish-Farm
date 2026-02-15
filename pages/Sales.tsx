
import React, { useState } from 'react';
import { UserProfile } from '../types';

const SalesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [sales, setSales] = useState([
    // Fix: Replaced Bengali numerals with standard numeric literals to fix parsing errors
    { id: '1', pond: 'পুকুর ১', amount: 45000, weight: 120, date: '২০২৪-০২-২০', note: 'আড়তে পাইকারি বিক্রি' },
    { id: '2', pond: 'পুকুর ১', amount: 15000, weight: 40, date: '২০২৪-০২-২৫', note: 'খুচরা বিক্রি' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">বিক্রির হিসাব</h1>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-green-200">
          <span>📈</span>
          <span>বিক্রি যোগ করুন</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-bold">তারিখ</th>
                <th className="px-6 py-4 font-bold">পুকুর</th>
                <th className="px-6 py-4 font-bold">ওজন (কেজি)</th>
                <th className="px-6 py-4 font-bold">বিবরণ</th>
                <th className="px-6 py-4 font-bold text-right">বিক্রয় মূল্য (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {sales.map(sale => (
                <tr key={sale.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">{sale.date}</td>
                  <td className="px-6 py-4">{sale.pond}</td>
                  <td className="px-6 py-4 font-medium">{sale.weight} কেজি</td>
                  <td className="px-6 py-4 text-sm">{sale.note}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">{sale.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right">সর্বমোট:</td>
                <td className="px-6 py-4 text-right text-green-600">৳ ৬০,০০০</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
