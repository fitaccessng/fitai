import React from 'react';

const LandingPage = () => {
  return (
    <main className="min-h-screen bg-white font-sans antialiased text-slate-900">
      
      {/* SECTION 1: HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1E1B4B] via-[#2D2A77] to-[#4338CA] pb-24 pt-16 lg:pb-32 lg:pt-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            
            {/* Left Content */}
            <div className="z-10 text-center lg:text-left">
              <p className="text-xs font-bold uppercase tracking-[0.4em] text-indigo-300 mb-6">Established 2026</p>
              <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl leading-tight">
                Personalized Health. <br/>
                <span className="opacity-80 italic">Verified Results.</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-8 text-indigo-100/80">
                FitAccess is a customized, high-fidelity health architecture. Build a healthier week with a plan that actually fits your life—integrated across web and mobile.
              </p>
              
              <div className="mt-10 flex flex-wrap justify-center gap-4 lg:justify-start">
                <button className="rounded-full bg-white px-8 py-4 text-sm font-bold text-indigo-900 transition hover:bg-indigo-50 shadow-xl">
                  Start Free Setup
                </button>
                <button className="rounded-full border border-white/30 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/20">
                  Explore Features
                </button>
              </div>
              
              <div className="mt-16 flex items-center justify-center gap-4 lg:justify-start">
                <div className="h-14 w-14 rounded-xl bg-white/10 p-2 border border-white/20">
                   <div className="h-full w-full bg-white/20 rounded-md"></div> {/* QR Placeholder */}
                </div>
                <p className="text-xs font-medium text-white/50 leading-tight uppercase tracking-widest text-left">
                  Scan to sync<br/>Mobile App.
                </p>
              </div>
            </div>

            {/* Right Visual: Mobile App & Floating Card */}
            <div className="relative flex justify-center lg:justify-end">
              {/* Mockup Frame */}
              <div className="relative z-20 w-72 rounded-[3.5rem] border-[8px] border-slate-900 bg-white shadow-2xl overflow-hidden aspect-[9/19]">
                <div className="p-5 pt-10">
                  <div className="flex justify-between items-center mb-6 px-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tighter">Dashboard</span>
                    <div className="h-6 w-6 rounded-full bg-slate-200"></div>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 p-4 mb-4 border border-indigo-100">
                    <div className="flex justify-between items-center mb-2">
                        <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent flex items-center justify-center text-[10px] font-bold">300</div>
                        <div className="text-[10px] text-right font-bold text-slate-500 uppercase tracking-tighter">Progress<br/><span className="text-indigo-600">Active</span></div>
                    </div>
                  </div>
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest px-2">Daily Logic</p>
                  <div className="space-y-2">
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">🥗</div>
                        <p className="text-[10px] font-bold">Meal Ready</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center">💧</div>
                        <p className="text-[10px] font-bold">Hydration</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Animation Card */}
              <div className="absolute -left-12 bottom-20 z-30 w-52 rounded-2xl bg-white p-3 shadow-2xl border border-slate-100 animate-[bounce_5s_ease-in-out_infinite]">
                <div className="h-28 w-full bg-slate-100 rounded-xl mb-3 overflow-hidden">
                   <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300" alt="Protocol" className="object-cover h-full w-full"/>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verified Meal</p>
                </div>
                <p className="text-xs font-bold text-slate-800">High-Protein Salmon</p>
              </div>
            </div>
          </div>
        </div>
        {/* Glow Effect */}
        <div className="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-indigo-500 opacity-20 blur-[120px]"></div>
      </section>

      {/* SECTION 2: THE "WHAT IS" BLOCK */}
      <section id="features" className="bg-white py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">What is FitAccess?</h2>
          <p className="mt-8 text-lg leading-8 text-slate-500">
            FitAccess is a digital environment designed for discipline. We coordinate your nutrition and movement through a private, data-driven architecture that vets every substitution for your safety.
          </p>
          <div className="mt-16 flex justify-center">
            <img 
              src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1200" 
              alt="Health Professional" 
              className="h-64 w-full max-w-4xl object-cover rounded-[3rem] shadow-2xl grayscale-[0.2]"
            />
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURE BENTO GRID */}
      <section className="bg-white pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Meal Logic', title: 'Smart menus and macro substitutions.' },
              { label: 'Workout Engine', title: 'Training routines by goal and access.' },
              { label: 'Scheduler', title: 'Precision water and timing alerts.' },
              { label: 'Mobile Ready', title: 'Native iOS and Android delivery.' }
            ].map((feature, i) => (
              <div key={i} className="rounded-[2.5rem] bg-slate-50 p-8 border border-slate-100 transition hover:shadow-lg">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-4">{feature.label}</p>
                <h3 className="text-xl font-bold text-slate-900 leading-snug">{feature.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: INTELLIGENCE METRICS */}
      <section className="bg-[#F8F9FF] py-24 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2">
                    <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-6 tracking-tight">Intelligence beyond tracking.</h2>
                    <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                      We analyze your circadian rhythm and volume load to provide real-time adjustments to your daily protocol.
                    </p>
                    <div className="space-y-4">
                      {['Bio-feedback Sync', 'Nutrient Verification', 'Volume Calibration'].map((item) => (
                        <div key={item} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                            <span className="text-sm font-bold text-slate-700">{item}</span>
                        </div>
                      ))}
                    </div>
                </div>
                <div className="lg:w-1/2 w-full max-w-sm bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Weekly Adherence</p>
                    <div className="flex items-end gap-2 h-32">
                        <div className="flex-1 bg-indigo-100 rounded-t-lg h-[40%] transition-all hover:h-[50%]"></div>
                        <div className="flex-1 bg-indigo-100 rounded-t-lg h-[60%] transition-all hover:h-[70%]"></div>
                        <div className="flex-1 bg-indigo-600 rounded-t-lg h-[90%] transition-all hover:h-[100%]"></div>
                        <div className="flex-1 bg-indigo-100 rounded-t-lg h-[75%] transition-all hover:h-[85%]"></div>
                        <div className="flex-1 bg-indigo-100 rounded-t-lg h-[85%] transition-all hover:h-[95%]"></div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <footer className="bg-slate-900 py-24 text-center text-white">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-4xl font-bold mb-8 tracking-tight">Ready to optimize?</h2>
            <button className="rounded-full bg-white px-12 py-5 text-sm font-bold text-slate-900 hover:bg-indigo-50 transition shadow-2xl">
                Get Access Now
            </button>
            <div className="mt-16 border-t border-white/10 pt-12 flex flex-col gap-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.5em]">Precision • Discipline • Adherence</p>
                <p className="text-[10px] text-slate-600">© 2026 FitAccess Architecture.</p>
            </div>
          </div>
      </footer>
    </main>
  );
};

export default LandingPage;