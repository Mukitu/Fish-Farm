
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
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPond, setEditingPond] = useState<{ id: string; name: string; area: string; fish_type: string }>({ id: '', name: '', area: '', fish_type: '' });
  
  const [newPond, setNewPond] = useState({ name: '', area: '', fish_type: '' });
  const [stocking, setStocking] = useState({ species: '', count: '', total_weight: '', avg_size_inch: '' });
  const [availableGuides, setAvailableGuides] = useState<any[]>([]);

  useEffect(() => { 
    fetchPonds(); 
    fetchGuides();
  }, []);

  const fetchGuides = async () => {
    const { data } = await supabase.from('farming_guides').select('species_name');
    if (data) setAvailableGuides(data);
  };

  const fetchPonds = async () => {
    if (user.id === 'guest-id') {
      setPonds([
        { 
          id: '1', name: 'পুকুর ১ (রুই ও কাতলা)', area: 20, fish_type: 'মিশ্র চাষ', total_weight: 1200, total_count: 2500, avg_weight: 480,
          stocking_records: [
            { id: 's1', species: 'রুই', count: 1500, total_weight_kg: 800, avg_size_inch: 5 },
            { id: 's2', species: 'কাতলা', count: 1000, total_weight_kg: 400, avg_size_inch: 6 }
          ]
        },
        { 
          id: '2', name: 'পুকুর ২ (কাতলা)', area: 15, fish_type: 'কাতলা', total_weight: 850, total_count: 1500, avg_weight: 566,
          stocking_records: [
            { id: 's3', species: 'কাতলা', count: 1500, total_weight_kg: 850, avg_size_inch: 7 }
          ]
        },
        { 
          id: '3', name: 'পুকুর ৩ (পাঙ্গাস)', area: 30, fish_type: 'পাঙ্গাস', total_weight: 2500, total_count: 5000, avg_weight: 500,
          stocking_records: [
            { id: 's4', species: 'পাঙ্গাস', count: 5000, total_weight_kg: 2500, avg_size_inch: 4 }
          ]
        },
        { 
          id: '4', name: 'পুকুর ৪ (তেলাপিয়া)', area: 10, fish_type: 'তেলাপিয়া', total_weight: 400, total_count: 2000, avg_weight: 200,
          stocking_records: [
            { id: 's5', species: 'তেলাপিয়া', count: 2000, total_weight_kg: 400, avg_size_inch: 3 }
          ]
        }
      ]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ponds')
        .select(`*, stocking_records(*)`)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processed = data?.map(p => {
        const totalW = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.total_weight_kg || 0), 0) || 0;
        const totalC = p.stocking_records?.reduce((a: any, b: any) => a + Number(b.count || 0), 0) || 0;
        return { 
          ...p, 
          total_weight: totalW, 
          total_count: totalC, 
          avg_weight: totalC > 0 ? (totalW * 1000) / totalC : 0 
        };
      });
      setPonds(processed || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleAddPond = async () => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (ponds.length >= user.max_ponds) {
      alert(`⚠️ আপনার প্যাকেজ লিমিট শেষ! আপনি সর্বোচ্চ ${user.max_ponds}টি পুকুর যোগ করতে পারবেন। প্যাকেজ আপগ্রেড করুন।`);
      return;
    }

    if (!newPond.name || !newPond.area) {
      alert("পুকুরের নাম এবং আয়তন অবশ্যই দিতে হবে!");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('ponds').insert([{ 
        user_id: user.id, 
        name: newPond.name, 
        area: parseFloat(newPond.area), 
        fish_type: newPond.fish_type 
      }]);
      if (error) throw error;
      setIsModalOpen(false);
      setNewPond({ name: '', area: '', fish_type: '' });
      await fetchPonds();
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const handleEditPond = async () => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (!editingPond.name || !editingPond.area) {
      alert("পুকুরের নাম এবং আয়তন দিতে হবে!");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('ponds').update({
        name: editingPond.name,
        area: parseFloat(editingPond.area),
        fish_type: editingPond.fish_type
      }).eq('id', editingPond.id);

      if (error) throw error;
      setIsEditModalOpen(false);
      await fetchPonds();
      alert("✅ পুকুরের তথ্য সফলভাবে আপডেট হয়েছে!");
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  const handleDeleteStock = async (stockId: string) => {
    if (user.id === 'guest-id') return alert('ডেমো মোডে ডাটা সেভ করা যাবে না।');
    if (confirm('আপনি কি এই মাছের ক্যাটাগরি রেকর্ডটি মুছে ফেলতে চান?')) {
      const { error } = await supabase.from('stocking_records').delete().eq('id', stockId);
      if (!error) {
        fetchPonds();
      } else {
        alert(error.message);
      }
    }
  };

  const handleStocking = async () => {
    if (!selectedPond || !stocking.species || !stocking.count) {
      return alert("মাছের নাম এবং পিস সংখ্যা প্রদান করুন!");
    }
    setSaving(true);
    try {
      const count = parseInt(stocking.count) || 0;
      const weight = parseFloat(stocking.total_weight) || 0;
      const avgSize = parseFloat(stocking.avg_size_inch) || 0;

      if (user.id === 'guest-id') {
        const newRecord = {
          id: 'stock-' + Date.now(),
          species: stocking.species.trim(),
          count: count,
          total_weight_kg: weight,
          avg_size_inch: avgSize
        };

        setPonds(prevPonds => prevPonds.map(p => {
          if (p.id === selectedPond.id) {
            const existingRecords = p.stocking_records || [];
            // Check if species already exists in this pond, add count to it
            const existingIndex = existingRecords.findIndex((r: any) => r.species.toLowerCase() === stocking.species.trim().toLowerCase());
            let updatedRecords;
            if (existingIndex > -1) {
              updatedRecords = [...existingRecords];
              updatedRecords[existingIndex] = {
                ...updatedRecords[existingIndex],
                count: Number(updatedRecords[existingIndex].count || 0) + count,
                total_weight_kg: Number(updatedRecords[existingIndex].total_weight_kg || 0) + weight
              };
            } else {
              updatedRecords = [...existingRecords, newRecord];
            }

            const totalW = updatedRecords.reduce((a: any, b: any) => a + Number(b.total_weight_kg || 0), 0);
            const totalC = updatedRecords.reduce((a: any, b: any) => a + Number(b.count || 0), 0);
            return {
              ...p,
              stocking_records: updatedRecords,
              total_weight: totalW,
              total_count: totalC
            };
          }
          return p;
        }));

        setIsStockModalOpen(false);
        setStocking({ species: '', count: '', total_weight: '', avg_size_inch: '' });
        alert(`✅ ${stocking.species} (${count} পিস) পুকুরে যোগ করা হয়েছে!`);
        return;
      }

      const { error } = await supabase.from('stocking_records').insert([{
        user_id: user.id,
        pond_id: selectedPond.id,
        species: stocking.species.trim(),
        count: count,
        total_weight_kg: weight,
        avg_weight_gm: count > 0 ? (weight * 1000) / count : 0,
        avg_size_inch: avgSize
      }]);
      if (error) throw error;
      setIsStockModalOpen(false);
      setStocking({ species: '', count: '', total_weight: '', avg_size_inch: '' });
      await fetchPonds();
      alert(`✅ ${stocking.species} (${count} পিস) সফলভাবে রেকর্ড হয়েছে!`);
    } catch (err: any) { alert(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight">আমার পুকুরসমূহ</h1>
          <p className="text-slate-500 font-bold text-sm md:text-base">প্যাকেজ ব্যবহার: {ponds.length} / {user.max_ponds === 999 ? 'আনলিমিটেড' : user.max_ponds}</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl md:rounded-3xl font-black shadow-xl shadow-blue-200 transition-transform active:scale-95">➕ নতুন পুকুর</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {loading ? (
          <div className="col-span-full text-center py-20 font-black animate-pulse text-slate-400">ডাটা লোড হচ্ছে...</div>
        ) : (
          ponds.map(pond => (
            <div key={pond.id} className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-sm border border-slate-100 p-6 md:p-8 hover:shadow-2xl transition-all flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl">🌊</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingPond({ id: pond.id, name: pond.name, area: String(pond.area), fish_type: pond.fish_type || '' });
                        setIsEditModalOpen(true);
                      }} 
                      className="w-10 h-10 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl flex items-center justify-center text-sm font-bold transition-colors"
                      title="পুকুর এডিট করুন"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={async () => {
                        if(confirm('পুকুরটি মুছে ফেলবেন?')) {
                          if (user.id === 'guest-id') { setPonds(ponds.filter(p => p.id !== pond.id)); return; }
                          await supabase.from('ponds').delete().eq('id', pond.id); 
                          fetchPonds();
                        }
                      }} 
                      className="w-10 h-10 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl flex items-center justify-center text-sm font-bold transition-colors"
                      title="পুকুর মুছে ফেলুন"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <h3 className="text-xl md:text-2xl font-black text-slate-800">{pond.name}</h3>
                <p className="text-slate-400 font-bold text-xs uppercase mb-4">{pond.area} শতাংশ | {pond.fish_type || 'সাধারণ চাষ'}</p>
                
                {/* Overall Stats */}
                <div className="bg-blue-50/60 p-4 rounded-2xl flex justify-between items-center mb-4 text-xs font-bold">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase">মোট মাছ</span>
                    <span className="text-slate-900 font-black text-base">{pond.total_count || 0} পিস</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[10px] uppercase">মোট ওজন</span>
                    <span className="text-blue-600 font-black text-base">{pond.total_weight || 0} কেজি</span>
                  </div>
                </div>

                {/* Species Breakdown */}
                <div className="bg-slate-50 p-4 rounded-2xl space-y-2 mb-6">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
                    <span>মাছের জাত ও মজুদ</span>
                    <span className="text-blue-600 font-bold">{pond.stocking_records?.length || 0} টি জাত</span>
                  </div>

                  {pond.stocking_records && pond.stocking_records.length > 0 ? (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {pond.stocking_records.map((stock: any) => (
                        <div key={stock.id || stock.species} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 text-xs font-bold">
                          <div>
                            <span className="text-slate-800 font-black block">🐟 {stock.species}</span>
                            {stock.avg_size_inch > 0 && (
                              <span className="text-[10px] text-slate-400">সাইজ: {stock.avg_size_inch} ইঞ্চি</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-blue-600 font-black block">{stock.count || 0} পিস</span>
                              <span className="text-slate-400 text-[10px]">({stock.total_weight_kg || 0} কেজি)</span>
                            </div>
                            {user.id !== 'guest-id' && (
                              <button 
                                onClick={() => handleDeleteStock(stock.id)} 
                                className="text-slate-300 hover:text-rose-500 ml-1 text-xs" 
                                title="এই মাছের রেকর্ড মুছুন"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic py-2 text-center">এখনো কোনো মাছের জাত যোগ করা হয়নি</p>
                  )}
                </div>
              </div>

              <button 
                onClick={() => { setSelectedPond(pond); setIsStockModalOpen(true); }} 
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-md"
              >
                ➕ মাছের পোনা/জাত মজুদ করুন
              </button>
            </div>
          ))
        )}
      </div>

      {/* New Pond Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-6 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-center text-slate-800">নতুন পুকুর যোগ করুন</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">পুকুরের নাম</label>
                <input type="text" placeholder="উদা: পুকুর ১ (উত্তর পাড়া)" value={newPond.name} onChange={e => setNewPond({...newPond, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">আয়তন (শতাংশ)</label>
                <input type="number" placeholder="উদা: ২৫" value={newPond.area} onChange={e => setNewPond({...newPond, area: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">মাছের ধরন/বিবরণ</label>
                <input type="text" placeholder="উদা: কার্প মিশ্র চাষ" value={newPond.fish_type} onChange={e => setNewPond({...newPond, fish_type: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleAddPond} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200">
                {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Pond Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-6 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-center text-slate-800">পুকুরের তথ্য এডিট করুন</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">পুকুরের নাম</label>
                <input type="text" value={editingPond.name} onChange={e => setEditingPond({...editingPond, name: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">আয়তন (শতাংশ)</label>
                <input type="number" value={editingPond.area} onChange={e => setEditingPond({...editingPond, area: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">মাছের ধরন/বিবরণ</label>
                <input type="text" value={editingPond.fish_type} onChange={e => setEditingPond({...editingPond, fish_type: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleEditPond} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200">
                {saving ? 'আপডেট হচ্ছে...' : 'আপডেট করুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stocking Modal */}
      {isStockModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 space-y-6 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-center text-slate-800">মাছের জাত/পোনা মজুদ করুন</h3>
            <p className="text-center text-xs font-bold text-blue-600 -mt-4">{selectedPond?.name}</p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">মাছের নাম / ক্যাটাগরি</label>
                <input 
                  type="text" 
                  placeholder="উদা: রুই, কাতলা, তেলাপিয়া বা যেকোনো নাম" 
                  value={stocking.species} 
                  onChange={e => setStocking({...stocking, species: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">সংখ্যা (পিস)</label>
                <input 
                  type="number" 
                  placeholder="উদা: ২০০০" 
                  value={stocking.count} 
                  onChange={e => setStocking({...stocking, count: e.target.value})} 
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-lg text-blue-600 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">মোট ওজন কেজি (ঐচ্ছিক)</label>
                  <input 
                    type="number" 
                    placeholder="উদা: ১২০" 
                    value={stocking.total_weight} 
                    onChange={e => setStocking({...stocking, total_weight: e.target.value})} 
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs" 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-1 block">সাইজ ইঞ্চি (ঐচ্ছিক)</label>
                  <input 
                    type="number" 
                    placeholder="উদা: ৫" 
                    value={stocking.avg_size_inch} 
                    onChange={e => setStocking({...stocking, avg_size_inch: e.target.value})} 
                    className="w-full px-5 py-3.5 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-2 focus:ring-blue-500 text-xs" 
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 pt-2">
              <button onClick={() => setIsStockModalOpen(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">বাতিল</button>
              <button onClick={handleStocking} disabled={saving} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200">
                {saving ? 'সেভ হচ্ছে...' : 'মজুদ সম্পন্ন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PondsPage;
