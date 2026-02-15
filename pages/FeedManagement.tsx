
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, InventoryItem } from '../types';

const FeedManagement: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [feeds, setFeeds] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFeed, setNewFeed] = useState({ name: '', quantity: '', unit: 'কেজি' as any, low_stock_threshold: '10' });

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('inventory')
      .select('*')
      .eq('type', 'খাবার')
      .order('created_at', { ascending: false });
    
    if (data) setFeeds(data as InventoryItem[]);
    setLoading(false);
  };

  const handleAddFeed = async () => {
    if (!newFeed.name || !newFeed.quantity) return;

    const { data, error } = await supabase.from('inventory').insert([
      {
        user_id: user.id,
        name: newFeed.name,
        quantity: parseFloat(newFeed.quantity),
        unit: newFeed.unit,
        type: 'খাবার',
        low_stock_threshold: parseFloat(newFeed.low_stock_threshold)
      }
    ]).select();

    if (data) {
      setFeeds([data[0] as InventoryItem, ...feeds]);
      setIsModalOpen(false);
      setNewFeed({ name: '', quantity: '', unit: 'কেজি', low_stock_threshold: '10' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">খাবার ব্যবস্থাপনা</h1>
          <p className="text-slate-500 font-medium">আপনার সকল প্রকার মাছের খাবারের তালিকা ও মজুদ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all"
        >
          <span>➕</span>
          <span>নতুন খাবার যোগ</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div></div>
        ) : (
          feeds.map(feed => (
            <div key={feed.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">🌾</div>
                  {feed.quantity < feed.low_stock_threshold && (
                    <span className="bg-rose-100 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Low Stock</span>
                  )}
                </div>
                <h3 className="font-black text-slate-800 text-lg mb-1">{feed.name}</h3>
                <p className="text-xs text-slate-400 font-bold mb-4 uppercase tracking-widest">মজুদ: {feed.quantity} {feed.unit}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">থ্রেশহোল্ড: {feed.low_stock_threshold}</span>
                <button className="text-blue-600 font-black text-xs">মজুদ আপডেট</button>
              </div>
            </div>
          ))
        )}
        {!loading && feeds.length === 0 && (
          <div className="col-span-full py-24 text-center text-slate-400 font-black italic border-2 border-dashed rounded-[3rem]">কোন খাবারের তালিকা নেই!</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-800 text-center">নতুন খাবার টাইপ যোগ করুন</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">খাবারের নাম</label>
                <input 
                  type="text" 
                  value={newFeed.name}
                  onChange={e => setNewFeed({...newFeed, name: e.target.value})}
                  placeholder="উদা: নারিশ নার্সারি ফিড" 
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">বর্তমান মজুদ</label>
                  <input 
                    type="number" 
                    value={newFeed.quantity}
                    onChange={e => setNewFeed({...newFeed, quantity: e.target.value})}
                    placeholder="00" 
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">একক</label>
                  <select 
                    value={newFeed.unit}
                    onChange={e => setNewFeed({...newFeed, unit: e.target.value as any})}
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    <option value="কেজি">কেজি</option>
                    <option value="প্যাকেট">প্যাকেট</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">এলার্ট থ্রেশহোল্ড (Alert point)</label>
                <input 
                  type="number" 
                  value={newFeed.low_stock_threshold}
                  onChange={e => setNewFeed({...newFeed, low_stock_threshold: e.target.value})}
                  className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-rose-500" 
                />
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAddFeed} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">যোগ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedManagement;
