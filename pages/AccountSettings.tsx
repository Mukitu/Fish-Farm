
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile } from '../types';

const AccountSettings: React.FC<{ user: UserProfile, onUpdateUser: any }> = ({ user, onUpdateUser }) => {
  const [fullName, setFullName] = useState(user.full_name || '');
  const [farmName, setFarmName] = useState(user.farm_name || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || '');
  const [saving, setSaving] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      farm_name: farmName,
      phone: phone,
      avatar_url: avatarUrl
    }).eq('id', user.id);

    if (!error) {
      alert("প্রোফাইল সফলভাবে আপডেট করা হয়েছে!");
      onUpdateUser(user.id);
    } else {
      alert("ত্রুটি: আপডেট করা যায়নি।");
    }
    setSaving(false);
  };

  const avatars = [
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Nishat`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Fish`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Farmer`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=King`,
    `https://api.dicebear.com/7.x/avataaars/svg?seed=Water`
  ];

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-slate-800">অ্যাকাউন্ট সেটিংস</h1>
        <p className="text-slate-500 font-bold">আপনার ব্যক্তিগত ও খামারের তথ্য আপডেট করুন</p>
      </div>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
        <form onSubmit={handleUpdate} className="space-y-8">
          <div className="space-y-4">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">প্রোফাইল ছবি নির্বাচন করুন</label>
             <div className="flex flex-wrap gap-4">
               {avatars.map((av, i) => (
                 <button 
                   key={i} 
                   type="button" 
                   onClick={() => setAvatarUrl(av)}
                   className={`w-16 h-16 rounded-2xl border-4 transition-all overflow-hidden ${avatarUrl === av ? 'border-blue-600 scale-110 shadow-lg' : 'border-transparent'}`}
                 >
                   <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                 </button>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">আপনার পূর্ণ নাম</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="উদা: মুুকিতুল ইসলাম নিশাত" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">খামারের নাম</label>
              <input type="text" value={farmName} onChange={e => setFarmName(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" placeholder="উদা: নিশান ফিশ ফার্ম" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">মোবাইল নম্বর</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">ইমেইল (পরিবর্তনযোগ্য নয়)</label>
              <input type="email" value={user.email} disabled className="w-full px-6 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-400 cursor-not-allowed" />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-xl hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? 'আপডেট হচ্ছে...' : 'পরিবর্তনগুলো সেভ করুন'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AccountSettings;
