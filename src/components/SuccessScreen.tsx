import { motion } from "motion/react";
import { Stars, ArrowUp, Target, Globe, Library, Wrench, Lightbulb, ArrowRight } from "lucide-react";
import { AIAnalysis } from "../types";

export function SuccessScreen({ analysis, onContinue }: { analysis: AIAnalysis, onContinue: () => void }) {
  const icons: Record<string, any> = {
    target: Target,
    public: Globe,
    library_books: Library,
    build: Wrench,
    lightbulb: Lightbulb,
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-navy/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.main 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-xl bg-brand-ivory rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-6 gap-6"
      >
        {/* Confetti decorations (SVG placeholders) */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -50, x: Math.random() * 400 - 200, opacity: 0 }}
              animate={{ y: 500, opacity: 1 }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              className="absolute top-0 w-2 h-2 rounded-full border border-current"
              style={{ color: i % 2 === 0 ? "#3B82F6" : "#F97316" }}
            />
          ))}
        </div>

        <header className="relative flex flex-col items-center text-center gap-1">
          <div className="bg-brand-blue/10 rounded-full p-2 mb-2">
            <Stars size={32} className="text-brand-blue" fill="currentColor" />
          </div>
          <h1 className="text-3xl font-black text-brand-blue tracking-tight">보완 성공!</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">정책 구조화 수준 레벨업</p>
        </header>

        <section className="relative w-40 h-40 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
            <motion.circle 
              cx="50" cy="50" r="45" fill="none" stroke="#0058be" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray="283"
              initial={{ strokeDashoffset: 283 }}
              animate={{ strokeDashoffset: 283 - (283 * analysis.structuringLevel / 100) }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center border border-gray-100 shadow-sm">
            <div className="flex items-baseline gap-0.5">
              <span className="text-4xl font-black">{analysis.structuringLevel}</span>
              <span className="text-xl font-bold text-gray-400">%</span>
            </div>
            <div className="flex items-center gap-0.5 text-brand-success bg-brand-success/10 px-2 py-0.5 rounded-full border border-brand-success/20 mt-1">
              <ArrowUp size={10} />
              <span className="text-[10px] font-bold">+25% UP</span>
            </div>
          </div>
        </section>

        <div className="bg-white border border-gray-100 rounded-2xl p-4 text-center shadow-sm w-full">
          <p className="text-sm leading-relaxed">
            시민님의 답변으로 구체적인 타켓이 설정되어<br />
            <span className="text-brand-blue font-bold">근거 충분성</span>이 대폭 상승했습니다!
          </p>
        </div>

        <section className="w-full flex flex-col bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-50">
          {analysis.metrics.map((m) => (
            <div key={m.label} className="p-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1.5 rounded-lg ${m.increment > 5 ? 'bg-brand-blue/10 text-brand-blue' : 'text-gray-400'}`}>
                  {icons[m.icon] ? (<m.icon size={16} />) : <Target size={16} />}
                </div>
                <span className={`text-xs font-bold truncate ${m.increment > 5 ? 'text-brand-blue' : 'text-gray-600'}`}>{m.label}</span>
              </div>
              <div className="flex flex-col items-end flex-1 max-w-[140px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] text-gray-400">{m.value - m.increment}% → <span className="text-brand-navy font-bold">{m.value}%</span></span>
                  {m.increment > 0 && (
                    <span className="text-[10px] font-bold text-brand-success flex items-center">
                      <ArrowUp size={8} />{m.increment}%
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden flex">
                  <div className="bg-gray-300" style={{ width: `${m.value - m.increment}%` }} />
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${m.increment}%` }}
                    transition={{ delay: 1, duration: 0.8 }}
                    className="bg-brand-success" 
                  />
                </div>
              </div>
            </div>
          ))}
        </section>

        <button
          onClick={onContinue}
          className="w-full bg-brand-blue text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
        >
          다음 라운드 계속하기
          <ArrowRight size={20} />
        </button>
      </motion.main>
    </div>
  );
}
