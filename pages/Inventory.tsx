
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, InventoryItem } from '../types';

const InventoryPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
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

  const handleOpenAdd = () => {
    setEditingItemId(null);
    setNewItem({ name: '', quantity: '', unit: 'কেজি', type: 'খাবার', low_stock_threshold: '10' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItemId(item.id);
    setNewItem({
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      type: item.type,
      low_stock_threshold: String(item.low_stock_threshold)
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!newItem.name || !newItem.quantity) {
      alert("⚠️ অনুগ্রহ করে পণ্যের নাম ও পরিমাণ সঠিক দিন!");
      return;
    }

    if (editingItemId) {
      if (user.id === 'guest-id') {
        setItems(prev => prev.map(i => i.id === editingItemId ? {
          ...i,
          name: newItem.name,
          quantity: parseFloat(newItem.quantity),
          unit: newItem.unit,
          type: newItem.type,
          low_stock_threshold: parseFloat(newItem.low_stock_threshold)
        } : i));
      } else {
        const { error } = await supabase.from('inventory').update({
          name: newItem.name,
          quantity: parseFloat(newItem.quantity),
          unit: newItem.unit,
          type: newItem.type,
          low_stock_threshold: parseFloat(newItem.low_stock_threshold)
        }).eq('id', editingItemId);
        if (error) {
          alert("⚠️ আপডেট সমস্যা: " + error.message);
          return;
        }
      }
      alert("✅ ইনভেন্টরি আইটেম আপডেট হয়েছে!");
    } else {
      if (user.id === 'guest-id') {
        const newRec: InventoryItem = {
          id: 'inv-' + Date.now(),
          user_id: 'guest',
          name: newItem.name,
          quantity: parseFloat(newItem.quantity),
          unit: newItem.unit,
          type: newItem.type,
          low_stock_threshold: parseFloat(newItem.low_stock_threshold)
        };
        setItems(prev => [newRec, ...prev]);
      } else {
        const { error } = await supabase.from('inventory').insert([{
          user_id: user.id,
          name: newItem.name,
          quantity: parseFloat(newItem.quantity),
          unit: newItem.unit,
          type: newItem.type,
          low_stock_threshold: parseFloat(newItem.low_stock_threshold)
        }]);
        if (error) {
          alert("⚠️ সংযোজন সমস্যা: " + error.message);
          return;
        }
      }
      alert("✅ নতুন আইটেম গুদামে যুক্ত হয়েছে!");
    }

    setIsModalOpen(false);
    setEditingItemId(null);
    setNewItem({ name: '', quantity: '', unit: 'কেজি', type: 'খাবার', low_stock_threshold: '10' });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('আপনি কি এই আইটেমটি ডিলিট করতে চান?')) {
      if (user.id === 'guest-id') {
        setItems(prev => prev.filter(i => i.id !== id));
        return;
      }
      await supabase.from('inventory').delete().eq('id', id);
      fetchData();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">গুদাম (Inventory)</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">আপনার মজুদ পণ্য ও ওষুধের হিসাব রাখুন</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 text-white rounded-2xl md:rounded-[2rem] font-black flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition text-xs sm:text-sm"
        >
          <span>➕ পণ্য যোগ করুন</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center font-bold text-indigo-600 animate-pulse text-sm">লোড হচ্ছে...</div>
        ) : items.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 italic text-sm">গুদামে কোনো পণ্য নেই</div>
        ) : items.map(item => {
          const isLow = Number(item.quantity) < Number(item.low_stock_threshold);
          return (
            <div key={item.id} className={`bg-white p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between ${isLow ? 'border-rose-200 bg-rose-50/20' : 'border-slate-100'}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3.5 rounded-2xl ${item.type === 'খাবার' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                    <span className="text-2xl">{item.type === 'খাবার' ? '🌾' : '💊'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 transition" title="এডিট">✏️</button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-600 transition" title="মুছুন">🗑️</button>
                  </div>
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-800 mb-1">{item.name}</h3>
                <p className="text-[10px] md:text-xs text-slate-400 mb-4 font-bold uppercase tracking-widest">{item.type} | থ্রেশহোল্ড: {item.low_stock_threshold} {item.unit}</p>
              </div>
              <div className="flex justify-between items-end border-t border-slate-50 pt-4 mt-2">
                <p className={`text-3xl md:text-4xl font-black ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>{item.quantity} <span className="text-sm font-medium">{item.unit}</span></p>
                {isLow && <span className="bg-rose-600 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase shadow-md animate-pulse">কম মজুত</span>}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 text-center">
              {editingItemId ? '✏️ ইনভেন্টরি এডিট করুন' : '📦 ইনভেন্টরি যোগ করুন'}
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">পণ্যের নাম</label>
                <input type="text" placeholder="উদা: নারিশ ফিড" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">পরিমাণ</label>
                  <input type="number" step="0.1" placeholder="উদা: ১০০" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">একক (Unit)</label>
                  <select value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500">
                    <option value="কেজি">কেজি</option>
                    <option value="লিটার">লিটার</option>
                    <option value="প্যাকেট">প্যাকেট</option>
                    <option value="বস্তা">বস্তা</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">ধরণ</label>
                  <select value={newItem.type} onChange={e => setNewItem({...newItem, type: e.target.value as any})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500">
                    <option value="খাবার">খাবার</option>
                    <option value="ওষুধ">ওষুধ</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">ওয়ার্নিং স্টক limit</label>
                  <input type="number" placeholder="উদা: ১০" value={newItem.low_stock_threshold} onChange={e => setNewItem({...newItem, low_stock_threshold: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setIsModalOpen(false); setEditingItemId(null); }} className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm">বাতিল</button>
              <button onClick={handleSave} className="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg text-sm">{editingItemId ? 'আপডেট সেভ' : 'সংরক্ষণ করুন'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
