
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("পাসওয়ার্ড দুটি মিলছে না।");
      return;
    }
    if (password.length < 6) {
      setError("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।");
      return;
    }

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("পাসওয়ার্ড আপডেট করতে সমস্যা হয়েছে। লিঙ্কটি হয়তো এক্সপায়ার হয়ে গেছে।");
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white max-w-md w-full rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 p-10">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl mx-auto mb-6">🔒</div>
          <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">নতুন পাসওয়ার্ড</h1>
          <p className="text-slate-500 font-bold">আপনার নতুন গোপন পাসওয়ার্ড সেট করুন</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-100 text-green-600 p-6 rounded-2xl text-center font-bold animate-in zoom-in-95 duration-300">
            <p className="text-4xl mb-2">🎉</p>
            পাসওয়ার্ড সফলভাবে আপডেট হয়েছে! আপনাকে লগইন পেজে নিয়ে যাওয়া হচ্ছে...
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-2xl text-sm font-bold flex items-center gap-3">
                <span>⚠️</span> {error}
              </div>
            )}
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">নতুন পাসওয়ার্ড</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="********" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">পাসওয়ার্ড নিশ্চিত করুন</label>
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold" placeholder="********" />
            </div>

            <button type="submit" disabled={loading} className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-blue-700 transition-all disabled:opacity-50 mt-4">
              {loading ? 'আপডেট হচ্ছে...' : 'পাসওয়ার্ড সেভ করুন'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
