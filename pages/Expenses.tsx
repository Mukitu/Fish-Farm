
import React, { useState } from 'react';
import { UserProfile } from '../types';

const ExpensesPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [expenses, setExpenses] = useState([
    // Fix: Replaced Bengali numerals with standard numeric literals to fix parsing errors
    { id: '1', pond: 'পুকুর ১', category: 'খাবার', amount: 5000, date: '২০২৪-০৩-০১', note: 'নারিশ স্টার্টার ১০ কেজি' },
    { id: '2', pond: 'পুকুর ২', category: 'ঔষধ', amount: 1200, date: '২০২৪-০৩-০৩', note: 'অক্সিজেন পাউডার' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">খরচের হিসাব</h1>
        <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-red-200">
          <span>📉</span>
          <span>খরচ যোগ করুন</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-bold">তারিখ</th>
                <th className="px-6 py-4 font-bold">পুকুর</th>
                <th className="px-6 py-4 font-bold">ক্যাটাগরি</th>
                <th className="px-6 py-4 font-bold">বিবরণ</th>
                <th className="px-6 py-4 font-bold text-right">পরিমাণ (৳)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">{exp.date}</td>
                  <td className="px-6 py-4">{exp.pond}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs font-bold">{exp.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{exp.note}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">{exp.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right">সর্বমোট:</td>
                <td className="px-6 py-4 text-right text-red-600">৳ ৬,২০০</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExpensesPage;
