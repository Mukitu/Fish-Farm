
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, InventoryItem } from '../types';

const InventoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', unit: 'কেজি', type: 'খাবার' as any, low_stock_threshold: '10' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (user.id === 'guest-id') {
      setItems([
        { id: 'i1', user_id: 'guest', name: 'নারিশ ফিড (গ্রোয়ার)', quantity: 450, unit: 'কেজি', type: 'খাবার', low_stock_threshold: 100 },
        { id: 'i2', user_id: 'guest', name: 'মেগা ফিড (স্টার্টার)', quantity: 80, unit: 'কেজি', type: 'খাবার', low_stock_threshold: 100 },
        { id: 'i3', user_id: 'guest', name: 'অক্সি-ম্যাক্স (অক্সিজেন পাউডার)', quantity: 15, unit: 'প্যাকেট', type: 'ওষুধ', low_stock_threshold: 5 },
        { id: 'i4', user_id: 'guest', name: 'জিও-লাইফ (পানি শোধন)', quantity: 10, unit: 'লিটার', type: 'ওষুধ', low_stock_threshold: 2 }
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setItems(data as InventoryItem[]);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (!newItem.name || !newItem.quantity) return;
    const { error } = await supabase.from('inventory').insert([{
      user_id: user.id,
      name: newItem.name,
      quantity: parseFloat(newItem.quantity),
      unit: newItem.unit,
      type: newItem.type,
      low_stock_threshold: parseFloat(newItem.low_stock_threshold)
    }]);

    if (!error) {
      setIsModalOpen(false);
      setNewItem({ name: '', quantity: '', unit: 'কেজি', type: 'খাবার', low_stock_threshold: '10' });
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই আইটেমটি ডিলিট করতে চান?')) {
      await supabase.from('inventory').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">গুদাম (Inventory)</h1>
          <p className="text-slate-500 font-medium">আপনার মজুদ পণ্য ও ওষুধের হিসাব রাখুন</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-200"
        >
          <span>➕</span>
          <span>পণ্য যোগ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-bold">লোড হচ্ছে...</div>
        ) : items.map(item => {
          const isLow = Number(item.quantity) < Number(item.low_stock_threshold);
          return (
            <div key={item.id} className={`bg-white p-8 rounded-[2.5rem] border shadow-sm transition-all group relative overflow-hidden ${isLow ? 'border-rose-200 bg-rose-50/20' : 'border-slate-100'}`}>
              <div className="flex justify-between items-start mb-6">
                <div className={`p-4 rounded-2xl ${item.type === 'খাবার' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                  {item.type === 'খাবার' ? '🌾' : '💊'}
                </div>
                <button onClick={() => handleDelete(item.id)} className="text-slate-200 hover:text-rose-500 transition">🗑️</button>
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-1">{item.name}</h3>
              <p className="text-xs text-slate-400 mb-6 font-bold uppercase tracking-widest">{item.type} | থ্রেশহোল্ড: {item.low_stock_threshold} {item.unit}</p>
              <div className="flex justify-between items-end border-t border-slate-50 pt-6">
                <p className={`text-4xl font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity} <span className="text-lg font-medium">{item.unit}</span></p>
                {isLow && <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase absolute top-4 right-4 animate-pulse">Low</span>}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 text-center">ইনভেন্টরি যোগ করুন</h3>
            <div className="space-y-4">
              <input type="text" placeholder="পণ্যের নাম" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="পরিমাণ" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold" />
                <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold">
                  <option value="কেজি">কেজি</option>
                  <option value="লিটার">লিটার</option>
                  <option value="প্যাকেট">প্যাকেট</option>
                </select>
              </div>
              <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-xl outline-none font-bold">
                <option value="খাবার">খাবার</option>
                <option value="ওষুধ">ওষুধ</option>
                <option value="অন্যান্য">অন্যান্য</option>
              </select>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAdd} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
