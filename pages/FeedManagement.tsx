import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';
import { exportReportToPdf } from '../utils/pdfExport';

const FeedManagement: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
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
      if (user.id === 'guest-id') {
        setPonds([
          { id: 'p1', name: 'পুকুর ১ (রুই)' } as any,
          { id: 'p2', name: 'পুকুর ২ (কাতলা)' } as any
        ]);
        setPurchases([
          {
            id: 'fp-1',
            purchase_date: new Date().toISOString().split('T')[0],
            pond_id: null,
            ponds: null,
            feed_name: 'নারিশ ফিড (গ্রোয়ার)',
            bags: 10,
            kg_per_bag: 25,
            price_per_bag: 2200,
            total_weight: 250,
            total_price: 22000
          },
          {
            id: 'fp-2',
            purchase_date: new Date().toISOString().split('T')[0],
            pond_id: 'p1',
            ponds: { name: 'পুকুর ১ (রুই)' },
            feed_name: 'মেগা ফিড (স্টার্টার)',
            bags: 5,
            kg_per_bag: 25,
            price_per_bag: 2100,
            total_weight: 125,
            total_price: 10500
          }
        ]);
        setLoading(false);
        return;
      }

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

  const handleOpenAddModal = () => {
    setEditingPurchaseId(null);
    setNewPurchase({
      pond_id: '',
      feed_name: '',
      bags: '',
      kg_per_bag: '২৫',
      price_per_bag: '',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: any) => {
    setEditingPurchaseId(p.id);
    setNewPurchase({
      pond_id: p.pond_id || '',
      feed_name: p.feed_name || '',
      bags: p.bags ? String(p.bags) : '',
      kg_per_bag: p.kg_per_bag ? String(p.kg_per_bag) : '২৫',
      price_per_bag: p.price_per_bag ? String(p.price_per_bag) : '',
      date: p.purchase_date || new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleSavePurchase = async () => {
    const { pond_id, feed_name, bags, kg_per_bag, price_per_bag, date } = newPurchase;
    if (!feed_name || !bags || !kg_per_bag || !price_per_bag) {
      alert("খাবারের নাম, বস্তা সংখ্যা, কেজি ও বস্তার দাম সঠিকভাবে দিন!");
      return;
    }

    setSaving(true);
    const totalWeight = parseFloat(bags) * parseFloat(kg_per_bag);
    const totalPrice = parseFloat(bags) * parseFloat(price_per_bag);
    const selectedPondObj = ponds.find(p => p.id === pond_id);

    try {
      if (editingPurchaseId) {
        if (user.id === 'guest-id') {
          setPurchases(prev => prev.map(item => {
            if (item.id === editingPurchaseId) {
              return {
                ...item,
                pond_id: pond_id || null,
                ponds: selectedPondObj ? { name: selectedPondObj.name } : null,
                feed_name,
                bags: parseInt(bags),
                kg_per_bag: parseFloat(kg_per_bag),
                price_per_bag: parseFloat(price_per_bag),
                total_weight: totalWeight,
                total_price: totalPrice,
                purchase_date: date
              };
            }
            return item;
          }));
        } else {
          const { error: updErr } = await supabase.from('feed_purchases').update({
            pond_id: pond_id || null,
            feed_name,
            bags: parseInt(bags),
            kg_per_bag: parseFloat(kg_per_bag),
            price_per_bag: parseFloat(price_per_bag),
            total_weight: totalWeight,
            total_price: totalPrice,
            purchase_date: date
          }).eq('id', editingPurchaseId);

          if (updErr) throw updErr;
        }

        alert("✅ খাবার ক্রয়ের বিবরণ সফলভাবে আপডেট করা হয়েছে!");
      } else {
        if (user.id === 'guest-id') {
          const newRec = {
            id: 'fp-' + Date.now(),
            purchase_date: date,
            pond_id: pond_id || null,
            ponds: selectedPondObj ? { name: selectedPondObj.name } : null,
            feed_name,
            bags: parseInt(bags),
            kg_per_bag: parseFloat(kg_per_bag),
            price_per_bag: parseFloat(price_per_bag),
            total_weight: totalWeight,
            total_price: totalPrice
          };
          setPurchases(prev => [newRec, ...prev]);
        } else {
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

          const { data: existingStock } = await supabase.from('inventory')
            .select('*')
            .eq('name', feed_name)
            .eq('user_id', user.id)
            .maybeSingle();

          if (existingStock) {
            await supabase.from('inventory')
              .update({ quantity: Number(existingStock.quantity) + totalWeight })
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

          await supabase.from('expenses').insert([{
            user_id: user.id,
            pond_id: pond_id || null,
            category: 'খাবার',
            item_name: `${feed_name} (${bags} বস্তা)`,
            amount: totalPrice,
            date: date
          }]);
        }

        alert("✅ " + (pond_id ? "নির্দিষ্ট পুকুরের" : "কেন্দ্রীয় সাধারণ স্টকের") + " খাবার ক্রয় সফলভাবে সংরক্ষিত হয়েছে!");
      }

      setIsModalOpen(false);
      setEditingPurchaseId(null);
      setNewPurchase({ pond_id: '', feed_name: '', bags: '', kg_per_bag: '২৫', price_per_bag: '', date: new Date().toISOString().split('T')[0] });
      if (user.id !== 'guest-id') await fetchData();
    } catch (err: any) {
      alert("⚠️ সমস্যা: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (purchase: any) => {
    if (confirm('এই রেকর্ডটি ডিলিট করলে ক্রয় ইতিহাস মুছে যাবে। আপনি কি নিশ্চিত?')) {
      if (user.id === 'guest-id') {
        setPurchases(prev => prev.filter(p => p.id !== purchase.id));
        return;
      }
      const { error } = await supabase.from('feed_purchases').delete().eq('id', purchase.id);
      if (!error) fetchData();
    }
  };

  const filteredPurchases = filterPond 
    ? (filterPond === 'central' ? purchases.filter(p => !p.pond_id) : purchases.filter(p => p.pond_id === filterPond))
    : purchases;

  const totalCost = filteredPurchases.reduce((a, b) => a + Number(b.total_price), 0);
  const totalWeightInStock = filteredPurchases.reduce((a, b) => a + Number(b.total_weight), 0);

  const handleExportFeedPurchasesPdf = () => {
    if (filteredPurchases.length === 0) {
      alert("কোনো খাবার ক্রয়ের তথ্য পাওয়া যায়নি!");
      return;
    }

    const tableRows = filteredPurchases.map(p => [
      new Date(p.purchase_date).toLocaleDateString('bn-BD'),
      p.ponds?.name ? p.ponds.name : 'কেন্দ্রীয় সাধারণ স্টক (সকল পুকুর)',
      p.feed_name,
      `${p.bags} বস্তা (${p.total_weight} কেজি)`,
      `৳ ${Number(p.price_per_bag).toLocaleString()}`,
      `৳ ${Number(p.total_price).toLocaleString()}`
    ]);

    const totalSpent = filteredPurchases.reduce((acc, curr) => acc + Number(curr.total_price || 0), 0);
    const totalBags = filteredPurchases.reduce((acc, curr) => acc + Number(curr.bags || 0), 0);

    exportReportToPdf({
      title: 'খাবার ক্রয় ও মজুদ স্টেটমেন্ট',
      farmName: user.farm_name || 'স্মার্ট মৎস্য খামার',
      userName: user.full_name || user.email,
      summaryCards: [
        { label: 'মোট ক্রয় লেনদেন', value: `${filteredPurchases.length} টি` },
        { label: 'মোট আমদানিকৃত বস্তা', value: `${totalBags} বস্তা` },
        { label: 'মোট ব্যয়িত অর্থ', value: `৳ ${totalSpent.toLocaleString()}`, color: '#2563eb' }
      ],
      tableHeaders: ['তারিখ', 'পুকুর / স্থান', 'খাবারের নাম', 'পরিমাণ', 'বস্তাপ্রতি দাম', 'মোট দাম (৳)'],
      tableRows: tableRows,
      footerNotes: 'স্মার্ট চাসিয়া খাবার ফিডার ও গুদাম হিস্ট্রি থেকে প্রস্তুতকৃত।'
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 tracking-tight">খাবার ব্যবস্থাপনা</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">কেন্দ্রীয় খাবার স্টক, ক্রয় ইতিহাস, এডিট ও ডিলিট</p>
        </div>
        <div className="flex gap-2.5 w-full sm:w-auto">
          <button 
            onClick={handleExportFeedPurchasesPdf} 
            className="flex-1 sm:flex-initial px-4 sm:px-5 py-3.5 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-slate-800 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            📄 পিডিএফ ডাউনলোড
          </button>
          <button 
            onClick={handleOpenAddModal} 
            className="flex-1 sm:flex-initial px-5 sm:px-6 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all text-xs flex items-center justify-center gap-2"
          >
            ➕ খাবার ক্রয় যোগ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট ক্রয় মূল্য</p>
           <h2 className="text-2xl sm:text-3xl font-black text-rose-600">৳ {totalCost.toLocaleString()}</h2>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">মোট আমদানিকৃত খাবার</p>
           <h2 className="text-2xl sm:text-3xl font-black text-blue-600">{totalWeightInStock.toLocaleString()} <span className="text-sm font-medium">কেজি</span></h2>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm sm:col-span-2 md:col-span-1">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">পুকুর / ফিল্টার</p>
           <select 
             value={filterPond} 
             onChange={e => setFilterPond(e.target.value)} 
             className="w-full bg-slate-50 border border-slate-200 rounded-2xl font-bold py-2.5 px-3 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
           >
              <option value="">সকল খাবার (সকল পুকুর ও কেন্দ্রীয় গুদাম)</option>
              <option value="central">🏬 কেন্দ্রীয় সাধারণ স্টক</option>
              {ponds.map(p => <option key={p.id} value={p.id}>🐟 {p.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white rounded-3xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-6">তারিখ</th>
                <th className="px-8 py-6">পুকুর / অবস্থান</th>
                <th className="px-8 py-6">খাবারের নাম</th>
                <th className="px-8 py-6">বস্তা (ওজন)</th>
                <th className="px-8 py-6 text-right">মোট দাম</th>
                <th className="px-8 py-6 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-slate-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-16 font-bold animate-pulse text-blue-600 text-sm">লোড হচ্ছে...</td></tr>
              ) : filteredPurchases.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-slate-400 italic text-sm">কোন খাবার ক্রয়ের রেকর্ড পাওয়া যায়নি</td></tr>
              ) : filteredPurchases.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition group">
                  <td className="px-8 py-6 text-xs font-bold">{new Date(p.purchase_date).toLocaleDateString('bn-BD')}</td>
                  <td className="px-8 py-6 font-black">
                    {p.ponds?.name ? (
                      <span className="text-slate-800">🐟 {p.ponds.name}</span>
                    ) : (
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1">
                        🏬 কেন্দ্রীয় সাধারণ স্টক
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6 font-bold">{p.feed_name}</td>
                  <td className="px-8 py-6">
                    <span className="font-black text-slate-800">{p.bags} বস্তা</span>
                    <p className="text-[10px] text-slate-400 font-black">{p.kg_per_bag} কেজি/বস্তা ({p.total_weight} কেজি)</p>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-rose-600">৳ {Number(p.total_price).toLocaleString()}</td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => handleOpenEditModal(p)} 
                        className="p-2 text-slate-400 hover:text-blue-600 transition"
                        title="এডিট করুন"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(p)} 
                        className="p-2 text-slate-400 hover:text-rose-600 transition"
                        title="মুছুন"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-12 text-center text-blue-600 font-bold animate-pulse text-sm">লোড হচ্ছে...</div>
          ) : filteredPurchases.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-bold text-sm">কোনো ক্রয়ের রেকর্ড নেই</div>
          ) : filteredPurchases.map(p => (
            <div key={p.id} className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(p.purchase_date).toLocaleDateString('bn-BD')}</span>
                    {p.ponds?.name ? (
                      <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md">🐟 {p.ponds.name}</span>
                    ) : (
                      <span className="text-[9px] font-black bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">🏬 কেন্দ্রীয় স্টক</span>
                    )}
                  </div>
                  <h4 className="font-black text-slate-800 text-base">{p.feed_name}</h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => handleOpenEditModal(p)} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs" title="এডিট">✏️</button>
                  <button onClick={() => handleDelete(p)} className="w-8 h-8 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center text-xs" title="মুছুন">🗑️</button>
                </div>
              </div>
              <div className="flex justify-between items-end border-t border-slate-50 pt-2">
                <div>
                  <p className="text-sm font-black text-slate-800">{p.bags} বস্তা <span className="text-xs font-normal text-slate-500">({p.total_weight} কেজি)</span></p>
                  <p className="text-[10px] text-slate-400 font-bold">বস্তাপ্রতি: ৳ {p.price_per_bag}</p>
                </div>
                <p className="text-lg font-black text-rose-600 tracking-tight">৳ {Number(p.total_price).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl sm:rounded-[2.5rem] p-6 sm:p-8 space-y-4 shadow-2xl my-6">
            <h3 className="text-xl sm:text-2xl font-black text-slate-800 text-center tracking-tight">
              {editingPurchaseId ? '✏️ খাবার ক্রয়ের তথ্য এডিট' : '🏬 খাবার ক্রয় ও স্টক যোগ'}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3 block">
                  পুকুর নির্বাচন (ঐচ্ছিক - খালি রাখলে কেন্দ্রীয় স্টক)
                </label>
                <select 
                  value={newPurchase.pond_id} 
                  onChange={e => setNewPurchase({...newPurchase, pond_id: e.target.value})} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                >
                  <option value="">🏬 সকল পুকুরের জন্য কেন্দ্রীয় গুদাম স্টক</option>
                  {ponds.map(p => <option key={p.id} value={p.id}>🐟 {p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">খাবারের নাম</label>
                <input 
                  type="text" 
                  value={newPurchase.feed_name} 
                  onChange={e => setNewPurchase({...newPurchase, feed_name: e.target.value})} 
                  placeholder="উদা: নারিশ ফিড / মেগা ফিড" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">ক্রয়ের তারিখ</label>
                  <input 
                    type="date" 
                    value={newPurchase.date} 
                    onChange={e => setNewPurchase({...newPurchase, date: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">বস্তা সংখ্যা</label>
                  <input 
                    type="number" 
                    placeholder="১০"
                    value={newPurchase.bags} 
                    onChange={e => setNewPurchase({...newPurchase, bags: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">কেজি/বস্তা</label>
                  <input 
                    type="number" 
                    placeholder="২৫"
                    value={newPurchase.kg_per_bag} 
                    onChange={e => setNewPurchase({...newPurchase, kg_per_bag: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">দাম (বস্তাপ্রতি ৳)</label>
                  <input 
                    type="number" 
                    placeholder="২২০০"
                    value={newPurchase.price_per_bag} 
                    onChange={e => setNewPurchase({...newPurchase, price_per_bag: e.target.value})} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none text-rose-600 font-black text-xs sm:text-sm focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl text-white flex justify-around items-center text-center">
               <div>
                  <p className="text-[9px] opacity-60 font-black uppercase tracking-widest">মোট আমদানিকৃত ওজন</p>
                  <p className="text-xl font-black text-blue-400">{(Number(newPurchase.bags) * Number(newPurchase.kg_per_bag) || 0)} কেজি</p>
               </div>
               <div>
                  <p className="text-[9px] opacity-60 font-black uppercase tracking-widest">মোট ক্রয় ব্যয়</p>
                  <p className="text-xl font-black text-emerald-400">৳ {(Number(newPurchase.bags) * Number(newPurchase.price_per_bag) || 0).toLocaleString()}</p>
               </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPurchaseId(null);
                }} 
                className="flex-1 py-3.5 bg-slate-100 rounded-2xl font-black text-slate-600 text-xs sm:text-sm"
              >
                বাতিল
              </button>
              <button 
                onClick={handleSavePurchase} 
                disabled={saving} 
                className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 disabled:opacity-50 text-xs sm:text-sm"
              >
                {saving ? 'সেভ হচ্ছে...' : (editingPurchaseId ? 'আপডেট সেভ' : 'মজুদ সেভ')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedManagement;
