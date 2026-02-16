
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, InventoryItem, Pond } from '../types';

const FeedManagement: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterPond, setFilterPond] = useState('');
  const [saving, setSaving] = useState(false);

  // নতুন ক্রয় ফরম স্টেট
  const [newPurchase, setNewPurchase] = useState({
    pond_id: '',
    feed_name: '',
    bags: '',
    kg_per_bag: '২৫',
    price_per_bag: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: pondData } = await supabase.from('ponds').select('*');
      const { data: purchaseData } = await supabase.from('feed_purchases')
        .select('*, ponds(name)')
        .order('purchase_date', { ascending: false });

      if (pondData) setPonds(pondData);
      if (purchaseData) setPurchases(purchaseData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPurchase = async () => {
    const { pond_id, feed_name, bags, kg_per_bag, price_per_bag, date } = newPurchase;
    if (!feed_name || !bags || !kg_per_bag || !price_per_bag) {
      alert("সবগুলো তথ্য সঠিকভাবে দিন!");
      return;
    }

    setSaving(true);
    const totalWeight = parseFloat(bags) * parseFloat(kg_per_bag);
    const totalPrice = parseFloat(bags) * parseFloat(price_per_bag);

    try {
      // ১. ক্রয় ইতিহাস টেবিলে সেভ করা
      const { error: pError } = await supabase.from('feed_purchases').insert([{
        user_id: user.id,
        pond_id: pond_id || null,
        feed_name,
        bags: parseInt(bags),
        kg_per_bag: parseFloat(kg_per_bag),
        price_per_bag: parseFloat(price_per_bag),
        total_weight: totalWeight,
        total_price: totalPrice,
        purchase_date: date
      }]);

      if (pError) throw pError;

      // ২. ইনভেন্টরিতে (গুদাম) স্টক আপডেট করা বা তৈরি করা
      // আমরা খাবার নামের ওপর ভিত্তি করে গুদামে স্টক যোগ করবো
      const { data: existingStock } = await supabase.from('inventory')
        .select('*')
        .eq('name', feed_name)
        .eq('type', 'খাবার')
        .maybeSingle();

      if (existingStock) {
        await supabase.from('inventory')
          .update({ quantity: existingStock.quantity + totalWeight })
          .eq('id', existingStock.id);
      } else {
        await supabase.from('inventory').insert([{
          user_id: user.id,
          name: feed_name,
          quantity: totalWeight,
          unit: 'কেজি',
          type: 'খাবার',
          low_stock_threshold: 50
        }]);
      }

      // ৩. খরচ (Expenses) টেবিলে অটোমেটিক এন্ট্রি দেওয়া (ঐচ্ছিক কিন্তু দরকারি)
      await supabase.from('expenses').insert([{
        user_id: user.id,
        pond_id: pond_id || null,
        category: 'খাবার',
        item_name: `${feed_name} (${bags} বস্তা)`,
        amount: totalPrice,
        date: date
      }]);

      alert("✅ খাবারের স্টক এবং খরচের হিসাব সফলভাবে যুক্ত হয়েছে!");
      setIsModalOpen(false);
      setNewPurchase({ pond_id: '', feed_name: '', bags: '', kg_per_bag: '২৫', price_per_bag: '', date: new Date().toISOString().split('T')[0] });
      fetchData();
    } catch (err: any) {
      alert("ভুল হয়েছে: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('এই রেকর্ডটি ডিলিট করলে ইনভেন্টরি থেকে স্টক কমবে না। আপনি কি নিশ্চিত?')) {
      const { error } = await supabase.from('feed_purchases').delete().eq('id', id);
      if (!error) fetchData();
    }
  };

  // ফিল্টারিং লজিক
  const filteredPurchases = filterPond 
    ? purchases.filter(p => p.pond_id === filterPond)
    : purchases;

  const totalCost = filteredPurchases.reduce((a, b) => a + Number(b.total_price), 0);
  const totalKg = filteredPurchases.reduce((a, b) => a + Number(b.total_weight), 0);

  return (
    <div className="space-y-8 pb-20 font-['Hind_Siliguri']">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">খাবার ব্যবস্থাপনা ও ক্রয় ইতিহাস</h1>
          <p className="text-slate-500 font-bold">গুদামে খাবার আসা এবং খরচের পূর্ণাঙ্গ ডাটাবেজ</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black shadow-xl shadow-blue-100 hover:scale-105 transition-all flex items-center gap-2"
        >
          <span>🚛</span>
          <span>খাবার কিনুন / স্টক যোগ করুন</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">মোট খাবারের খরচ (ফিল্টার অনুযায়ী)</p>
           <h2 className="text-4xl font-black text-rose-600">৳ {totalCost.toLocaleString()}</h2>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">মোট মজুদকৃত খাবার</p>
           <h2 className="text-4xl font-black text-blue-600">{totalKg.toLocaleString()} <span className="text-sm">কেজি</span></h2>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex items-end justify-between">
           <div className="w-full">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">পুকুর অনুযায়ী ফিল্টার</p>
              <select 
                value={filterPond} 
                onChange={e => setFilterPond(e.target.value)}
                className="w-full bg-slate-50 border-none rounded-xl font-bold py-2 px-4 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">সকল পুকুর</option>
                {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
           </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর</th>
                <th className="px-8 py-6">খাবারের নাম</th>
                <th className="px-8 py-6">বস্তা (ওজন)</th>
                <th className="px-8 py-6">প্রতি বস্তার দাম</th>
                <th className="px-8 py-6 text-right">মোট খরচ (৳)</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-20 font-bold animate-pulse text-blue-600">লোড হচ্ছে...</td></tr>
              ) : filteredPurchases.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-6 text-xs font-bold">{new Date(p.purchase_date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-800">{p.ponds?.name || 'গুদাম (সাধারণ)'}</span>
                  </td>
                  <td className="px-8 py-6 font-bold">{p.feed_name}</td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="font-black text-slate-800">{p.bags} বস্তা</span>
                       <span className="text-[10px] text-slate-400 font-black">{p.kg_per_bag} কেজি/বস্তা</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-500">৳ {p.price_per_bag}</td>
                  <td className="px-8 py-6 text-right font-black text-rose-600 text-lg">৳ {p.total_price.toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <button onClick={() => handleDelete(p.id)} className="text-rose-200 hover:text-rose-600 transition p-2">🗑️</button>
                  </td>
                </tr>
              ))}
              {filteredPurchases.length === 0 && !loading && (
                <tr><td colSpan={7} className="py-24 text-center text-slate-300 font-black italic">কোনো ক্রয় ইতিহাস পাওয়া যায়নি।</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Stock Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl my-8">
            <h3 className="text-2xl font-black text-slate-800 text-center tracking-tight">খাবার ক্রয় ও মজুদ তথ্য</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পুকুর বরাদ্দ (ঐচ্ছিক)</label>
                <select 
                  value={newPurchase.pond_id} 
                  onChange={e => setNewPurchase({...newPurchase, pond_id: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100"
                >
                  <option value="">সাধারণ মজুদ (কোন পুকুর নয়)</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">খাবারের নাম / ব্র্যান্ড</label>
                <input 
                  type="text" 
                  value={newPurchase.feed_name}
                  onChange={e => setNewPurchase({...newPurchase, feed_name: e.target.value})}
                  placeholder="উদা: নারিশ নার্সারি ফিড" 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">কত বস্তা?</label>
                <input 
                  type="number" 
                  value={newPurchase.bags}
                  onChange={e => setNewPurchase({...newPurchase, bags: e.target.value})}
                  placeholder="00" 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">প্রতি বস্তার ওজন (কেজি)</label>
                <input 
                  type="number" 
                  value={newPurchase.kg_per_bag}
                  onChange={e => setNewPurchase({...newPurchase, kg_per_bag: e.target.value})}
                  placeholder="25" 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">প্রতি বস্তার দাম (৳)</label>
                <input 
                  type="number" 
                  value={newPurchase.price_per_bag}
                  onChange={e => setNewPurchase({...newPurchase, price_per_bag: e.target.value})}
                  placeholder="0000" 
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100 text-rose-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">তারিখ</label>
                <input 
                  type="date" 
                  value={newPurchase.date}
                  onChange={e => setNewPurchase({...newPurchase, date: e.target.value})}
                  className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none ring-1 ring-slate-100"
                />
              </div>
            </div>

            {/* Calculations Display */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex justify-around items-center text-center">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">মোট ওজন</p>
                  <p className="text-3xl font-black text-blue-400">{(Number(newPurchase.bags) * Number(newPurchase.kg_per_bag) || 0)} <span className="text-sm">কেজি</span></p>
               </div>
               <div className="w-px h-12 bg-white/10"></div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">মোট দাম</p>
                  <p className="text-3xl font-black text-green-400">৳ {(Number(newPurchase.bags) * Number(newPurchase.price_per_bag) || 0).toLocaleString()}</p>
               </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black"
              >
                বাতিল
              </button>
              <button 
                onClick={handleAddPurchase} 
                disabled={saving}
                className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 disabled:opacity-50"
              >
                {saving ? 'সংরক্ষণ হচ্ছে...' : 'স্টক ও খরচ সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedManagement;
