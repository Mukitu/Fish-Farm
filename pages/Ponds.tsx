
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserProfile, Pond } from '../types';

const PondsPage: React.FC<{ user: UserProfile }> = ({ user }) => {
  const [ponds, setPonds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedPond, setSelectedPond] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  
  const [newPond, setNewPond] = useState({ name: '', area: '', fish_type: '' });
  const [stocking, setStocking] = useState({ species: '', count: '', total_weight: '' });

  useEffect(() => { fetchPonds(); }, []);

  const fetchPonds = async () => {
    setLoading(true);
    const { data } = await supabase.from('ponds').select(`*, stocking_records(*)`).order('created_at', { ascending: false });
    if (data) {
      const processed = data.map(p => {
        const totalW = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.total_weight_kg), 0) || 0;
        const totalC = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.count), 0) || 0;
        return { ...p, total_weight: totalW, total_count: totalC, avg_weight: totalC > 0 ? (totalW * 1000) / totalC : 0 };
      });
      setPonds(processed);
    }
    setLoading(false);
  };

  const handleAddPond = async () => {
    if (!newPond.name || !newPond.area) return;
    setSaving(true);
    const { data: authUser } = await supabase.auth.getUser();
    await supabase.from('ponds').insert([{ user_id: authUser.user?.id, name: newPond.name, area: parseFloat(newPond.area), fish_type: newPond.fish_type }]);
    setIsModalOpen(false);
    fetchPonds();
    setSaving(false);
  };

  const handleStocking = async () => {
    if (!selectedPond || !stocking.count || !stocking.total_weight) return;
    setSaving(true);
    const avg = (parseFloat(stocking.total_weight) * 1000) / parseInt(stocking.count);
    await supabase.from('stocking_records').insert([{
      pond_id: selectedPond.id,
      species: stocking.species || selectedPond.fish_type,
      count: parseInt(stocking.count),
      total_weight_kg: parseFloat(stocking.total_weight),
      avg_weight_gm: avg
    }]);
    setIsStockModalOpen(false);
    fetchPonds();
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`আপনি কি "${name}" পুকুরটি ডিলিট করতে চান? এর সাথে যুক্ত সব খরচ ও বিক্রির ডাটা মুছে যাবে!`)) {
      await supabase.from('ponds').delete().eq('id', id);
      fetchPonds();
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">পুকুর ও পোনা মজুদ</h1>
          <p className="text-slate-500 font-bold">আপনার খামারের প্রোডাকশন সেন্টার</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all">➕ নতুন পুকুর</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {ponds.map(pond => (
          <div key={pond.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 hover:shadow-xl transition-all group">
            <div className="flex justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl">🌊</div>
              <button onClick={() => handleDelete(pond.id, pond.name)} className="text-slate-300 hover:text-rose-500 transition-colors">🗑️</button>
            </div>
            <h3 className="text-xl font-black text-slate-800">{pond.name}</h3>
            <p className="text-slate-400 font-bold text-xs uppercase mb-6">{pond.area} শতাংশ | {pond.fish_type}</p>
            
            <div className="bg-slate-50 p-5 rounded-2xl space-y-2 mb-6">
              <div className="flex justify-between text-xs font-bold text-slate-500"><span>মজুদ পোনা:</span> <span className="text-slate-800">{pond.total_count} টি</span></div>
              <div className="flex justify-between text-xs font-bold text-slate-500"><span>মোট ওজন:</span> <span className="text-blue-600 font-black">{pond.total_weight} কেজি</span></div>
              <div className="flex justify-between text-xs font-bold text-slate-500"><span>গড় ওজন:</span> <span className="text-green-600 font-black">{pond.avg_weight.toFixed(1)} গ্রাম</span></div>
            </div>

            <button onClick={() => {setSelectedPond(pond); setIsStockModalOpen(true);}} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-colors">🐟 পোনা ছাড়ুন</button>
          </div>
        ))}
      </div>

      {/* Stocking Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-6 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">পোনা মজুদের তথ্য</h3>
            <div className="space-y-4">
              <input type="text" placeholder="মাছের প্রজাতি" value={stocking.species} onChange={e => setStocking({...stocking, species: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="মাছ সংখ্যা" value={stocking.count} onChange={e => setStocking({...stocking, count: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-black border-none" />
                <input type="number" placeholder="মোট ওজন (kg)" value={stocking.total_weight} onChange={e => setStocking({...stocking, total_weight: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-black border-none text-blue-600" />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsStockModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black">বাতিল</button>
              <button onClick={handleStocking} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black">মজুদ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Pond Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 space-y-6 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">নতুন পুকুর যোগ</h3>
            <div className="space-y-4">
              <input type="text" placeholder="পুকুরের নাম" value={newPond.name} onChange={e => setNewPond({...newPond, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none outline-none" />
              <input type="number" placeholder="আয়তন (শতাংশ)" value={newPond.area} onChange={e => setNewPond({...newPond, area: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none outline-none" />
              <input type="text" placeholder="প্রধান মাছ" value={newPond.fish_type} onChange={e => setNewPond({...newPond, fish_type: e.target.value})} className="w-full px-5 py-4 bg-slate-50 rounded-xl font-bold border-none outline-none" />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 rounded-xl font-black">বাতিল</button>
              <button onClick={handleAddPond} className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black">সংরক্ষণ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PondsPage;
