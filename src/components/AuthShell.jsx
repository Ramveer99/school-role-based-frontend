export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 lg:p-8 bg-[#F1F5F9]">
      <div className="w-full max-w-[1080px] bg-white rounded-[28px] shadow-[0_20px_60px_-16px_rgba(15,23,42,.12)] border border-slate-200 overflow-hidden grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden lg:flex flex-col p-10 bg-[#0F172A] text-white relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-[#2563EB] rounded-full blur-[80px] opacity-30"></div>
          <div className="absolute -bottom-20 -left-20 w-[380px] h-[380px] bg-[#0EA5E9] rounded-full blur-[80px] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-14">
              <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white"><i className="fa-solid fa-graduation-cap"></i></div>
              <div><div className="font-display font-extrabold text-[17px] leading-none">EduCore</div><div className="text-[11px] tracking-[0.18em] text-slate-400 font-semibold">SCHOOL MANAGEMENT</div></div>
            </div>
            <h2 className="font-display text-[34px] font-extrabold leading-[0.95] mb-4">Empowering<br />Education<br /><span className="text-[#60A5FA]">Management.</span></h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-10 max-w-[360px]">A unified platform for administrators, teachers, students and parents — simple, fast and secure.</p>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><i className="fa-solid fa-check text-xs"></i></span> Role-based access & permissions</div>
              <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><i className="fa-solid fa-check text-xs"></i></span> Multi-tenant organizations</div>
              <div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><i className="fa-solid fa-check text-xs"></i></span> Trusted by 1,200+ schools</div>
            </div>
            <div className="mt-10 bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              <img src="https://i.pravatar.cc/100?img=33" className="w-10 h-10 rounded-full object-cover" alt="" />
              <div className="flex-1"><div className="text-sm font-semibold">“EduCore cut our admin time by 60%.”</div><div className="text-xs text-slate-400">— Principal, Greenwood Academy</div></div>
            </div>
          </div>
        </div>

        <div className="p-7 lg:p-10">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#2563EB] flex items-center justify-center text-white"><i className="fa-solid fa-graduation-cap"></i></div>
            <div><div className="font-display font-extrabold leading-none">EduCore</div><div className="text-[11px] tracking-widest text-slate-500 font-semibold">SCHOOL MANAGEMENT</div></div>
          </div>
          <h1 className="font-display text-[26px] font-extrabold leading-none">{title}</h1>
          <p className="text-slate-500 text-sm mt-2 mb-7">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
