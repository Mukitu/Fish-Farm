
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
      // ১. ক্রয় ইতিহাসে সেভ
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

      // ২. ইনভেন্টরি (গুদাম) স্টক আপডেট
      const { data: existingStock } = await supabase.from('inventory')
        .select('*')
        .eq('name', feed_name)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingStock) {
        const { error: updError } = await supabase.from('inventory')
          .update({ quantity: Number(existingStock.quantity) + totalWeight })
          .eq('id', existingStock.id);
        if (updError) throw updError;
      } else {
        const { error: insError } = await supabase.from('inventory').insert([{
          user_id: user.id,
          name: feed_name,
          quantity: totalWeight,
          unit: 'কেজি',
          type: 'খাবার',
          low_stock_threshold: 50
        }]);
        if (insError) throw insError;
      }

      // ৩. খরচের হিসাবে যোগ
      await supabase.from('expenses').insert([{
        user_id: user.id,
        pond_id: pond_id || null,
        category: 'খাবার',
        item_name: `${feed_name} (${bags} বস্তা)`,
        amount: totalPrice,
        date: date
      }]);

      setIsModalOpen(false);
      setNewPurchase({ pond_id: '', feed_name: '', bags: '', kg_per_bag: '২৫', price_per_bag: '', date: new Date().toISOString().split('T')[0] });
      await fetchData();
      alert("✅ স্টক ও খরচের হিসাব সফলভাবে আপডেট হয়েছে!");
    } catch (err: any) {
      alert("⚠️ সমস্যা: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (purchase: any) => {
    if (confirm('এই রেকর্ডটি ডিলিট করলে স্টক স্বয়ংক্রিয়ভাবে কমবে না। আপনি কি নিশ্চিত?')) {
      const { error } = await supabase.from('feed_purchases').delete().eq('id', purchase.id);
      if (!error) fetchData();
    }
  };

  const filteredPurchases = filterPond 
    ? purchases.filter(p => p.pond_id === filterPond)
    : purchases;

  const totalCost = filteredPurchases.reduce((a, b) => a + Number(b.total_price), 0);
  const totalWeightInStock = filteredPurchases.reduce((a, b) => a + Number(b.total_weight), 0);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">খাবার ব্যবস্থাপনা</h1>
          <p className="text-slate-500 font-bold">ক্রয় ইতিহাস ও স্টক ট্র্যাকিং</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] font-black shadow-xl shadow-blue-100 hover:scale-105 transition-all">➕ স্টক যোগ করুন</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">মোট ক্রয় মূল্য</p>
           <h2 className="text-4xl font-black text-rose-600">৳ {totalCost.toLocaleString()}</h2>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">মোট আমদানিকৃত খাবার</p>
           <h2 className="text-4xl font-black text-blue-600">{totalWeightInStock.toLocaleString()} <span className="text-sm">কেজি</span></h2>
        </div>
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">পুকুর ফিল্টার</p>
           <select value={filterPond} onChange={e => setFilterPond(e.target.value)} className="w-full bg-slate-50 border-none rounded-xl font-bold py-2 px-4">
              <option value="">সকল পুকুর</option>
              {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
            <tr>
              <th className="px-8 py-6">তারিখ</th>
              <th className="px-8 py-6">পুকুর</th>
              <th className="px-8 py-6">খাবারের নাম</th>
              <th className="px-8 py-6">বস্তা (ওজন)</th>
              <th className="px-8 py-6 text-right">মোট দাম</th>
              <th className="px-8 py-6 text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-slate-700">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-20 font-bold animate-pulse text-blue-600">লোড হচ্ছে...</td></tr>
            ) : filteredPurchases.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition group">
                <td className="px-8 py-6 text-xs font-bold">{new Date(p.purchase_date).toLocaleDateString('bn-BD')}</td>
                <td className="px-8 py-6 font-black">{p.ponds?.name || 'গুদাম'}</td>
                <td className="px-8 py-6 font-bold">{p.feed_name}</td>
                <td className="px-8 py-6">
                  <span className="font-black text-slate-800">{p.bags} বস্তা</span>
                  <p className="text-[10px] text-slate-400 font-black">{p.kg_per_bag} কেজি/বস্তা</p>
                </td>
                <td className="px-8 py-6 text-right font-black text-rose-600">৳ {p.total_price.toLocaleString()}</td>
                <td className="px-8 py-6 text-center">
                  <button onClick={() => handleDelete(p)} className="text-rose-300 hover:text-rose-600 transition">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-10 space-y-8 animate-in zoom-in-95 duration-300 shadow-2xl my-8">
            <h3 className="text-2xl font-black text-slate-800 text-center tracking-tight">খাবার ক্রয় ও মজুদ তথ্য</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পুকুর (ঐচ্ছিক)</label>
                <select value={newPurchase.pond_id} onChange={e => setNewPurchase({...newPurchase, pond_id: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none">
                  <option value="">গুদামে মজুদ</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">খাবারের নাম</label>
                <input type="text" value={newPurchase.feed_name} onChange={e => setNewPurchase({...newPurchase, feed_name: e.target.value})} placeholder="উদা: নারিশ ফিড" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">বস্তা সংখ্যা</label>
                <input type="number" value={newPurchase.bags} onChange={e => setNewPurchase({...newPurchase, bags: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">কেজি/বস্তা</label>
                <input type="number" value={newPurchase.kg_per_bag} onChange={e => setNewPurchase({...newPurchase, kg_per_bag: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">বস্তার দাম (৳)</label>
                <input type="number" value={newPurchase.price_per_bag} onChange={e => setNewPurchase({...newPurchase, price_per_bag: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none text-rose-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">তারিখ</label>
                <input type="date" value={newPurchase.date} onChange={e => setNewPurchase({...newPurchase, date: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" />
              </div>
            </div>
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex justify-around items-center text-center">
               <div>
                  <p className="text-[10px] opacity-50 font-black">মোট ওজন</p>
                  <p className="text-3xl font-black">{(Number(newPurchase.bags) * Number(newPurchase.kg_per_bag) || 0)} কেজি</p>
               </div>
               <div>
                  <p className="text-[10px] opacity-50 font-black">মোট দাম</p>
                  <p className="text-3xl font-black">৳ {(Number(newPurchase.bags) * Number(newPurchase.price_per_bag) || 0).toLocaleString()}</p>
               </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAddPurchase} disabled={saving} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl disabled:opacity-50">
                {saving ? 'সেভ হচ্ছে...' : 'মজুদ সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedManagement;
