
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { UserProfile, SubscriptionStatus, SUBSCRIPTION_PLANS } from '../types';

const SubscriptionPage: React.FC<{ user: UserProfile, onUpdateUser: any }> = ({ user, onUpdateUser }) => {
  const [plans, setPlans] = useState<any[]>(SUBSCRIPTION_PLANS);
  const [selectedPlan, setSelectedPlan] = useState(SUBSCRIPTION_PLANS[0]);
  const [months, setMonths] = useState(1);
  const [trxId, setTrxId] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase.from('site_settings').select('*').eq('id', 'subscription_plans').single();
      if (data) {
        setPlans(data.value);
        setSelectedPlan(data.value[0]);
      }
    };
    fetchPlans();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    const { data, error } = await supabase.from('coupons').select('*').eq('code', couponCode.toUpperCase()).eq('is_active', true).single();
    if (data) {
      setAppliedCoupon(data);
      alert(`কুপন সফলভাবে প্রয়োগ হয়েছে! আপনি ${data.discount_percent}% ডিসকাউন্ট পেয়েছেন।`);
    } else {
      alert('ভুল কুপন কোড অথবা কুপনটি এখন সচল নেই।');
      setAppliedCoupon(null);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.id === 'guest-id') return alert('ডেমো মোডে পেমেন্ট সাবমিট করা যাবে না।');
    const baseAmount = selectedPlan.price * months;
    const discount = appliedCoupon ? (baseAmount * appliedCoupon.discount_percent / 100) : 0;
    const totalAmount = baseAmount - discount;
    
    const { error } = await supabase.from('payments').insert([{
      user_id: user.id,
      plan_id: selectedPlan.id,
      amount: totalAmount,
      trx_id: trxId.toUpperCase(),
      months: months,
      status: 'PENDING'
    }]);

    if (!error) {
      await supabase.from('profiles').update({ 
        subscription_status: SubscriptionStatus.PENDING 
      }).eq('id', user.id);
      setStep(3);
    } else {
      alert('পেমেন্ট সাবমিট করতে সমস্যা হয়েছে অথবা Transaction ID আগে ব্যবহৃত হয়েছে।');
    }
  };

  const baseTotal = selectedPlan.price * months;
  const discountAmount = appliedCoupon ? (baseTotal * appliedCoupon.discount_percent / 100) : 0;
  const totalPayment = baseTotal - discountAmount;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex items-center justify-center font-['Hind_Siliguri']">
      <div className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-blue-600 p-8 md:p-12 text-white text-center">
          <h2 className="text-3xl md:text-4xl font-black">সাবস্ক্রিপশন প্ল্যান</h2>
          <p className="mt-2 text-blue-100 font-bold">সঠিক প্যাকেজ ও মেয়াদ বেছে নিন</p>
        </div>

        <div className="p-6 md:p-12">
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map(plan => (
                  <button 
                    key={plan.id} 
                    onClick={() => setSelectedPlan(plan)} 
                    className={`p-6 border-2 rounded-3xl text-left transition-all ${selectedPlan.id === plan.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-200'}`}
                  >
                    <p className="font-black text-slate-800">{plan.label}</p>
                    <p className="text-2xl font-black text-blue-600">৳ {plan.price}/মাস</p>
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-8 rounded-3xl space-y-4">
                  <div className="flex justify-between items-center mb-2">
                     <label className="font-black text-slate-700">মেয়াদ নির্বাচন করুন</label>
                     <span className="bg-blue-600 text-white px-4 py-1 rounded-full font-black text-sm">{months} মাস</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="12" 
                    value={months} 
                    onChange={e => setMonths(Number(e.target.value))} 
                    className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                  />
                  <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span>১ মাস</span>
                    <span>৬ মাস</span>
                    <span>১২ মাস</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-3xl space-y-4">
                  <label className="font-black text-slate-700 block">কুপন কোড (যদি থাকে)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                      placeholder="কুপন দিন"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 font-black uppercase outline-none focus:border-blue-600"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black hover:bg-blue-600 transition-all"
                    >
                      প্রয়োগ
                    </button>
                  </div>
                  {appliedCoupon && (
                    <p className="text-xs font-black text-green-600">✓ {appliedCoupon.discount_percent}% ডিসকাউন্ট প্রয়োগ হয়েছে!</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center bg-blue-600 p-8 rounded-[2rem] text-white shadow-xl shadow-blue-200 gap-6">
                <div>
                  <p className="text-xs opacity-80 font-bold uppercase tracking-widest mb-1">সর্বমোট পেমেন্ট পরিমাণ</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-black">৳ {totalPayment}</p>
                    {appliedCoupon && (
                      <p className="text-sm line-through opacity-50 font-bold">৳ {baseTotal}</p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => setStep(2)} 
                  className="w-full sm:w-auto bg-white text-blue-600 px-10 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform shadow-lg active:scale-95"
                >
                  পেমেন্ট করুন
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <form onSubmit={handlePaymentSubmit} className="space-y-8">
                <div className="bg-rose-50 p-8 rounded-[2rem] border border-rose-100 text-center relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-5 text-6xl">💸</div>
                   <p className="text-rose-500 text-xs font-black uppercase tracking-[0.2em] mb-4">বিকাশ পেমেন্ট (Send Money)</p>
                   <p className="text-sm font-bold text-slate-500 mb-1">নিচের নম্বরে <span className="text-slate-800 font-black">৳{totalPayment}</span> সেন্ড মানি করুন</p>
                   <p className="text-4xl font-black text-rose-600 tracking-tight">01303595062</p>
                   <p className="mt-6 text-slate-600 text-xs font-bold bg-white/50 inline-block px-4 py-2 rounded-full border border-rose-100">টাকা পাঠানোর পর নিচের বক্সে TrxID দিন</p>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">TRANSACTION ID (TRXID)</label>
                   <input 
                     value={trxId} 
                     onChange={e => setTrxId(e.target.value)} 
                     required 
                     type="text" 
                     placeholder="Ex: AB12CD34EF" 
                     className="w-full px-6 py-5 bg-slate-50 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-600 font-mono text-xl uppercase text-center placeholder:opacity-30" 
                   />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                   <button 
                     type="button" 
                     onClick={() => setStep(1)} 
                     className="flex-1 py-5 font-black text-slate-400 hover:text-slate-600 transition-colors"
                   >
                     ← পিছনে যান
                   </button>
                   <button 
                     type="submit" 
                     className="flex-[2] bg-blue-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-400/30 hover:bg-blue-700 hover:translate-y-[-2px] active:translate-y-0 transition-all"
                   >
                     পেমেন্ট সাবমিট করুন
                   </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-5xl mx-auto shadow-inner animate-bounce">✓</div>
              <div className="space-y-2">
                <h2 className="text-3xl md:text-4xl font-black text-slate-800">আবেদন সম্পন্ন হয়েছে</h2>
                <p className="text-slate-500 font-bold max-w-sm mx-auto leading-relaxed">
                   আপনার <span className="text-blue-600">৳{totalPayment}</span> পেমেন্টের আবেদনটি অ্যাডমিনের কাছে পাঠানো হয়েছে। যাচাই শেষে খুব শীঘ্রই আপনার ড্যাশবোর্ড সচল করা হবে।
                </p>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-lg shadow-2xl hover:bg-blue-600 transition-all hover:scale-105 active:scale-95"
                >
                  ড্যাশবোর্ডে প্রবেশ করুন
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPage;
