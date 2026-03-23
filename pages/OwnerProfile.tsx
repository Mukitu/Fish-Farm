
import React from 'react';
import { Link } from 'react-router-dom';

const OwnerProfile: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-['Hind_Siliguri']">
      <nav className="p-6 border-b border-slate-50 absolute top-0 left-0 w-full z-10">
        <Link to="/" className="text-white font-black drop-shadow-md">← হোম পেজে ফিরে যান</Link>
      </nav>

      {/* Cover Section */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=1000&auto=format&fit=crop" 
          alt="Cover" 
          className="w-full h-full object-cover blur-sm scale-110 opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 to-white"></div>
      </div>

      <div className="max-w-4xl mx-auto -mt-32 md:-mt-48 px-6 text-center relative z-10">
        <div className="relative inline-block mb-10">
          <div className="absolute inset-0 bg-blue-600 rounded-[3rem] rotate-6 -z-10 opacity-10"></div>
          <img 
            src="https://scontent.fdac177-1.fna.fbcdn.net/v/t39.30808-6/608555197_1420424023055766_6960166380452882439_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=53a332&_nc_ohc=ewXGMxSBccgQ7kNvwF9a-h3&_nc_oc=Adr88bk8BlrtV1odku_iHDy5AMw_nJdIswYPLZxXXPfU_fJikuE48JL0n5WZCGvJI-Y&_nc_zt=23&_nc_ht=scontent.fdac177-1.fna&_nc_gid=fIZ7cbIWtZTUSL_Ug1-whQ&_nc_ss=7a32e&oh=00_AfxUbEViUvrmZqUaJMB2-LpDNYXM6oOKCt5IELyVmUdo4Q&oe=69C67A80" 
            alt="Owner" 
            className="w-48 h-48 md:w-64 md:h-64 rounded-[3rem] border-8 border-white shadow-2xl object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-4">মুকিতুল ইসলাম নিশাত</h1>
        <p className="text-xl md:text-2xl text-blue-600 font-black mb-12 italic">প্রতিষ্ঠাতা ও প্রধান নির্বাহী</p>
      </div>
    </div>
  );
};

export default OwnerProfile;
