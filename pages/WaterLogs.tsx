
import React, { useState } from 'react';
import { UserProfile } from '../types';

const WaterLogsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [logs, setLogs] = useState([
    { id: '1', pond: 'পুকুর ১', oxygen: 6.2, ph: 7.5, temp: 28, date: '২০২৪-০৩-০৬ ১২:৩০' },
    { id: '2', pond: 'পুকুর ১', oxygen: 5.8, ph: 7.4, temp: 27, date: '২০২৪-০৩-০৫ ০৮:১৫' },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">পানির লগ</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-200">
          <span>🧪</span>
          <span>নতুন লগ যোগ করুন</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-gray-600 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-bold">সময় ও তারিখ</th>
                <th className="px-6 py-4 font-bold">পুকুর</th>
                <th className="px-6 py-4 font-bold">অক্সিজেন (mg/L)</th>
                <th className="px-6 py-4 font-bold">পিএইচ (pH)</th>
                <th className="px-6 py-4 font-bold">তাপমাত্রা (°C)</th>
              </tr>
            </thead>
            <tbody className="divide-y text-gray-700">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">{log.date}</td>
                  <td className="px-6 py-4">{log.pond}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${log.oxygen < 5 ? 'text-red-500' : 'text-green-600'}`}>{log.oxygen}</span>
                  </td>
                  <td className="px-6 py-4">{log.ph}</td>
                  <td className="px-6 py-4 font-medium">{log.temp}°C</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WaterLogsPage;
