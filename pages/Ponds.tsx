
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

  useEffect(() => { 
    fetchPonds(); 
  }, []);

  const fetchPonds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ponds')
        .select(`*, stocking_records(*)`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = data?.map(p => {
        const totalW = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.total_weight_kg), 0) || 0;
        const totalC = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.count), 0) || 0;
        return { 
          ...p, 
          total_weight: totalW, 
          total_count: totalC, 
          avg_weight: totalC > 0 ? (totalW * 1000) / totalC : 0 
        };
      });
      setPonds(processed || []);
    } catch (err) {
      console.error("Error fetching ponds:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPond = async () => {
    if (!newPond.name || !newPond.area) return;
    setSaving(true);
    const { error } = await supabase.from('ponds').insert([{ 
      user_id: user.id, 
      name: newPond.name, 
      area: parseFloat(newPond.area), 
      fish_type: newPond.fish_type 
    }]);
    if (!error) {
      setIsModalOpen(false);
      setNewPond({ name: '', area: '', fish_type: '' });
      fetchPonds();
    }
    setSaving(false);
  };

  const handleStocking = async () => {
    if (!selectedPond || !stocking.count || !stocking.total_weight) return;
    setSaving(true);
    const avg = (parseFloat(stocking.total_weight) * 1000) / parseInt(stocking.count);
    const { error } = await supabase.from('stocking_records').insert([{
      pond_id: selectedPond.id,
      species: stocking.species || selectedPond.fish_type,
      count: parseInt(stocking.count),
      total_weight_kg: parseFloat(stocking.total_weight),
      avg_weight_gm: avg
    }]);
    
    if (!error) {
      setIsStockModalOpen(false);
      setStocking({ species: '', count: '', total_weight: '' });
      fetchPonds();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`আপনি কি "${name}" পুকুরটি ডিলিট করতে চান? এর সাথে যুক্ত সকল ডাটা মুছে যাবে!`)) {
      await supabase.from('ponds').delete().eq('id', id);
      fetchPonds();
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">পুকুর ও মাছের মজুদ</h1>
          <p className="text-slate-500 font-bold">আপনার সব পুকুর এবং মোট মাছের হিসাব এখানে দেখুন</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-8 py-4 bg-blue-600 text-white rounded-3xl font-black shadow-xl hover:scale-105 transition-all">➕ নতুন পুকুর</button>
      </div>

      {loading ? (
        <div className="py-20 text-center font-black text-blue-600 animate-pulse text-2xl">পুকুরের ডাটা লোড হচ্ছে...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ponds.length === 0 && <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed text-center text-slate-400 font-bold italic">কোন পুকুর পাওয়া যায়নি!</div>}
          {ponds.map(pond => (
            <div key={pond.id} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 hover:shadow-2xl transition-all group relative overflow-hidden">
              <div className="flex justify-between mb-6">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl">🌊</div>
                <button onClick={() => handleDelete(pond.id, pond.name)} className="text-slate-200 hover:text-rose-500 transition-colors p-2">🗑️</button>
              </div>
              <h3 className="text-2xl font-black text-slate-800">{pond.name}</h3>
              <p className="text-slate-400 font-black text-sm uppercase mb-8">{pond.area} শতাংশ | {pond.fish_type}</p>
              
              <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 mb-8">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-400">মোট মাছ ছাড়া হয়েছে:</span> 
                  <span className="text-slate-800 font-black">{pond.total_count.toLocaleString()} পিস</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-400">মজুদ ওজন (কেজি):</span> 
                  <span className="text-blue-600 font-black">{pond.total_weight.toFixed(1)} কেজি</span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-slate-200 pt-4">
                  <span className="text-slate-400">গড় ওজন (প্রতিটি):</span> 
                  <span className="text-green-600 font-black">{pond.avg_weight.toFixed(1)} গ্রাম</span>
                </div>
              </div>

              <button 
                onClick={() => {setSelectedPond(pond); setIsStockModalOpen(true);}} 
                className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-blue-600 transition-colors shadow-lg active:scale-95"
              >
                🐟 পোনা মজুদ করুন
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stocking Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-8 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">নতুন পোনা মজুদের তথ্য</h3>
            <div className="space-y-4">
              <input type="text" placeholder="মাছের প্রজাতি" value={stocking.species} onChange={e => setStocking({...stocking, species: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-4">মাছ সংখ্যা (পিস)</label>
                   <input type="number" placeholder="সংখ্যা" value={stocking.count} onChange={e => setStocking({...stocking, count: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black border-none" />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-4">মোট ওজন (কেজি)</label>
                   <input type="number" placeholder="কেজি" value={stocking.total_weight} onChange={e => setStocking({...stocking, total_weight: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black border-none text-blue-600" />
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsStockModalOpen(false)} className="flex-1 py-5 bg-slate-100 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleStocking} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black">মজুদ করুন</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Pond Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 space-y-6 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-slate-800 text-center">নতুন পুকুর যোগ</h3>
            <div className="space-y-4">
              <input type="text" placeholder="পুকুরের নাম" value={newPond.name} onChange={e => setNewPond({...newPond, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" />
              <input type="number" placeholder="আয়তন (শতাংশ)" value={newPond.area} onChange={e => setNewPond({...newPond, area: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" />
              <input type="text" placeholder="প্রধান মাছ" value={newPond.fish_type} onChange={e => setNewPond({...newPond, fish_type: e.target.value})} className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold border-none outline-none" />
            </div>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-5 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAddPond} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black">তৈরি করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PondsPage;
