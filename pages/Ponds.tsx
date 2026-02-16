
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const PondsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<Pond[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPond, setNewPond] = useState({ name: '', area: '', fish_type: '' });

  useEffect(() => {
    fetchPonds();
  }, []);

  const fetchPonds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ponds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPonds(data as Pond[]);
    } catch (err) {
      console.error("Error fetching ponds:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPond = async () => {
    // লিমিট চেক
    if (user.max_ponds !== 999 && ponds.length >= user.max_ponds) {
      alert(`আপনার প্যাকেজ অনুযায়ী আপনি সর্বোচ্চ ${user.max_ponds}টি পুকুর যোগ করতে পারবেন। আরও পুকুর যোগ করতে দয়া করে আপনার প্যাকেজ আপগ্রেড করুন।`);
      return;
    }

    if (!newPond.name || !newPond.area || !newPond.fish_type) {
      alert('অনুগ্রহ করে সবগুলো ঘর পূরণ করুন।');
      return;
    }

    setSaving(true);
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) throw new Error("ইউজার লগইন নেই");

      const { data, error } = await supabase.from('ponds').insert([
        {
          user_id: authUser.user.id,
          name: newPond.name,
          area: parseFloat(newPond.area),
          fish_type: newPond.fish_type,
          is_active: true,
          stock_date: new Date().toISOString().split('T')[0]
        }
      ]).select();

      if (error) throw error;

      if (data) {
        setPonds([data[0], ...ponds]);
        setIsModalOpen(false);
        setNewPond({ name: '', area: '', fish_type: '' });
        alert("সফলভাবে পুকুর যোগ করা হয়েছে!");
      }
    } catch (err: any) {
      alert("ত্রুটি: " + (err.message || "ডাটা সেভ করা যায়নি"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">আমার পুকুরসমূহ</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">
            লিমিট: <span className="text-blue-600 font-black">{ponds.length} / {user.max_ponds === 999 ? 'Unlimited' : user.max_ponds}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
        >
          <span>➕</span> নতুন পুকুর যোগ
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ponds.map(pond => (
            <div key={pond.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-black text-slate-800">{pond.name}</h3>
                <span className="bg-green-100 text-green-700 text-[10px] px-3 py-1 rounded-full font-black">সক্রিয়</span>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-slate-50 pb-3">
                  <span className="text-slate-400 font-bold">মাছ:</span>
                  <span className="font-black text-slate-800">{pond.fish_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">আয়তন:</span>
                  <span className="font-black text-blue-600">{pond.area} শতাংশ</span>
                </div>
              </div>
            </div>
          ))}
          {ponds.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
               <p className="text-slate-400 font-black">কোনো পুকুর খুঁজে পাওয়া যায়নি।</p>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-8 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">নতুন পুকুর যোগ করুন</h3>
            <div className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পুকুরের নাম</label>
                <input type="text" value={newPond.name} onChange={e => setNewPond({...newPond, name: e.target.value})} placeholder="পুকুরের নাম লিখুন" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">আয়তন (শতাংশ)</label>
                <input type="number" value={newPond.area} onChange={e => setNewPond({...newPond, area: e.target.value})} placeholder="উদা: ৫০" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black text-blue-600" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">মাছের প্রজাতি</label>
                <input type="text" value={newPond.fish_type} onChange={e => setNewPond({...newPond, fish_type: e.target.value})} placeholder="উদা: রুই" className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-black" />
              </div>
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black">বাতিল</button>
              <button onClick={handleAddPond} disabled={saving} className="flex-1 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl disabled:opacity-50">
                {saving ? 'সেভ হচ্ছে...' : 'সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PondsPage;
