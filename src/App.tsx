/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, CheckCircle, BarChart3, ArrowRight, Save } from "lucide-react";

export default function App() {
  const [oneLineReview, setOneLineReview] = useState("");
  const [proposal, setProposal] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [finalCard, setFinalCard] = useState<any>(null);

  // Load completed proposals on mount
  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const res = await fetch("/api/proposals");
      const data = await res.json();
      setHistory(data);
    } catch (e) {
      console.error("Failed to fetch proposals", e);
    }
  };

  const startFlow = async () => {
    if (!oneLineReview.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/proposals/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oneLineReview }),
      });
      const data = await res.json();
      setProposal(data);
      setOneLineReview("");
    } catch (e) {
      alert("Error starting flow");
    } finally {
      setLoading(false);
    }
  };

  const respond = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.proposalId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });
      const data = await res.json();
      setProposal((prev: any) => ({
        ...prev,
        ...data,
        currentRound: data.currentRound,
        scores: data.updatedScores,
        counterQuestion: data.nextCounterQuestion,
      }));
      setAnswer("");
      if (data.isReadyToFinalize) {
        finalize(proposal.proposalId);
      }
    } catch (e) {
      alert("Error responding");
    } finally {
      setLoading(false);
    }
  };

  const finalize = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proposals/${id}/finalize`, {
        method: "POST",
      });
      const data = await res.json();
      setFinalCard(data.finalCard);
      setProposal(null);
      fetchProposals();
    } catch (e) {
      alert("Error finalizing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-soft font-sans text-text-main">
      <header className="fixed top-0 left-0 right-0 z-10 px-8 py-6 border-b border-border-natural bg-white flex justify-between items-center h-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-stone rounded-xl flex items-center justify-center text-white font-bold text-xl">D</div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text-heading">대구 시민 공론장 | 정책 제안 도구</h1>
            <p className="text-xs text-text-muted">시민의 일상적인 불편을 구체적인 정책 언어로 번역합니다.</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-border-subtle px-4 py-2 rounded-full text-xs font-bold text-accent-stone">
          <span className="w-2 h-2 bg-accent-stone rounded-full animate-pulse"></span>
          실시간 정책 제안 중
        </div>
      </header>

      <main className="pt-20 min-h-screen flex flex-col">
        {/* Step 1: Initial Input */}
        {!proposal && !finalCard && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/fiber-paper.png')]">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl bg-white p-10 rounded-[2rem] shadow-sm border border-border-natural"
            >
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-text-heading mb-2">당신의 이야기를 들려주세요</h2>
                <p className="text-text-muted text-sm">대구에서 느꼈던 불편함이 정책의 시작이 됩니다.</p>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted mb-2 ml-1">오늘 대구에서 어떤 불편함이 있었나요?</label>
                <div className="relative">
                  <textarea 
                    value={oneLineReview}
                    onChange={(e) => setOneLineReview(e.target.value)}
                    placeholder="지옥철 때문에 출근이 너무 힘들어요..."
                    className="w-full px-6 py-5 bg-background-soft border-2 border-border-natural rounded-3xl focus:border-accent-stone outline-none transition-all placeholder:text-text-muted/50 resize-none min-h-[120px]"
                    id="review-input"
                  />
                </div>
                <button 
                  onClick={startFlow}
                  disabled={loading || !oneLineReview.trim()}
                  className="w-full bg-accent-stone text-white px-6 py-4 rounded-full font-bold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
                  id="start-btn"
                >
                  {loading ? "정책 분석 중..." : "제안 분석 시작"}
                  <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>

            {/* Recent History Grid (Below Initial Input) */}
            {history.length > 0 && (
              <section className="mt-16 w-full max-w-4xl px-4">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-bold text-text-muted uppercase tracking-[0.2em]">공유된 최신 정책 제안</h3>
                  <div className="h-px bg-border-natural flex-1 ml-6"></div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.slice(0, 6).map((h) => (
                    <motion.div 
                      key={h.id} 
                      whileHover={{ y: -4 }}
                      className="bg-white p-6 rounded-2xl border border-border-natural hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                      onClick={() => setFinalCard(h.finalCard)}
                    >
                      <div>
                        <span className="text-[10px] font-bold text-accent-stone mb-2 block opacity-60">#{h.field || "분야미정"}</span>
                        <h4 className="font-bold text-text-heading text-sm mb-2 line-clamp-1">{h.finalCard?.title}</h4>
                        <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed">{h.finalCard?.summary}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-border-subtle flex justify-between items-center">
                        <span className="text-[9px] text-text-muted uppercase font-mono tracking-tighter">Drafted</span>
                        <ArrowRight size={14} className="text-accent-stone opacity-40" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Step 2: Refining rounds with Sidebar Layout */}
        <AnimatePresence>
          {proposal && (
            <motion.div 
              key="refining-step"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden h-[calc(100vh-5rem)]"
            >
              {/* Sidebar: Metrics & Current Draft Status */}
              <aside className="w-[400px] border-r border-border-natural bg-background-sidebar p-8 flex flex-col gap-8 overflow-y-auto">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-text-muted">정책 완성도 지표</h2>
                  <span className="text-[10px] font-bold text-accent-stone px-2 py-1 bg-border-natural rounded uppercase">Draft #{String(proposal.currentRound).padStart(2, '0')}</span>
                </div>

                <div className="space-y-5">
                  {Object.entries(proposal.scores || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-accent-stone font-bold uppercase tracking-tighter">
                          {key === 'problemClarity' ? '문제 명확도' : 
                           key === 'publicness' ? '공공성' : 
                           key === 'evidence' ? '근거 충분성' : 
                           key === 'feasibility' ? '실현 가능성' : '대안 구체성'}
                        </span>
                        <span className="font-bold italic text-text-heading">{value}%</span>
                      </div>
                      <div className="h-1.5 bg-border-natural rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-accent-stone"
                          style={{ opacity: value < 40 ? 0.4 : value < 70 ? 0.7 : 1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 bg-white p-6 rounded-2xl shadow-sm border border-border-natural space-y-4">
                  <h3 className="text-accent-stone italic font-serif text-lg leading-tight border-b border-border-subtle pb-3">
                    "{proposal.coreProblem || proposal.originalText}"
                  </h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                    <div>
                      <p className="text-[9px] uppercase text-text-muted font-bold tracking-widest mb-1">분야</p>
                      <p className="text-xs font-bold text-text-heading">{proposal.field || "분석 중"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-text-muted font-bold tracking-widest mb-1">타겟</p>
                      <p className="text-xs font-bold text-text-heading">{proposal.affectedGroup || "분석 중"}</p>
                    </div>
                  </div>
                  {proposal.feedback && (
                    <div className="bg-background-soft p-3 rounded-lg border border-border-subtle">
                      <p className="text-[10px] text-accent-stone font-bold mb-1">전문가 조언</p>
                      <p className="text-[11px] text-text-muted leading-relaxed italic">{proposal.feedback}</p>
                    </div>
                  )}
                </div>
              </aside>

              {/* Main Content: Chat/Deliberation Area */}
              <section className="flex-1 p-12 bg-white flex flex-col items-center">
                <div className="max-w-2xl w-full flex flex-col h-full">
                  {/* Round Progress */}
                  <div className="flex justify-between items-center mb-12">
                    <div className="flex gap-2">
                      {[1, 2, 3].map((r) => (
                        <div 
                          key={r}
                          className={`h-2 w-12 rounded-full transition-all duration-500 ${proposal.currentRound >= r ? 'bg-accent-stone' : 'bg-border-natural'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-accent-stone tracking-widest uppercase">Round {proposal.currentRound} / 3</span>
                  </div>

                  {/* Chat Interface Sim */}
                  <div className="flex-1 space-y-8 overflow-y-auto">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-border-natural flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-accent-stone ring-2 ring-white">AI</div>
                      <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-border-natural max-w-[85%]">
                        <p className="text-xs font-bold text-accent-stone mb-2 uppercase tracking-wide">
                          {proposal.counterQuestion?.type || "정책 질문"}
                        </p>
                        <p className="text-md leading-relaxed text-text-heading font-medium">
                          {proposal.counterQuestion?.message}
                        </p>
                      </div>
                    </motion.div>

                    {proposal.answers?.map((ans: any, idx: number) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={idx}
                        className="flex gap-4 justify-end"
                      >
                        <div className="bg-accent-stone p-6 rounded-3xl rounded-tr-none shadow-sm max-w-[85%] text-white">
                          <p className="text-sm leading-relaxed font-light">{ans.answer}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-text-heading flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white uppercase">Me</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Input Area */}
                  <div className="mt-8">
                    <div className="relative">
                      <textarea 
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="의견을 명확하게 들려주세요..."
                        className="w-full bg-white border-2 border-border-natural focus:border-accent-stone rounded-3xl p-6 pr-32 outline-none resize-none shadow-sm transition-all focus:ring-0"
                        rows={3}
                        id="answer-input"
                      />
                      <button 
                        onClick={respond}
                        disabled={loading || !answer.trim()}
                        className="absolute right-4 bottom-4 bg-accent-stone text-white px-6 py-2.5 rounded-full font-bold text-xs hover:opacity-90 transition-opacity disabled:opacity-50 uppercase tracking-widest shadow-md"
                        id="respond-btn"
                      >
                        {loading ? "반영 중" : "제안 보완"}
                      </button>
                    </div>
                    <p className="text-center text-[10px] text-text-muted mt-6 uppercase tracking-widest opacity-60">
                      정책 제안 과정은 약 3단계의 구체화 과정을 거칩니다.
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 3: Final Card Display */}
        {finalCard && (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[url('https://www.transparenttextures.com/patterns/fiber-paper.png')]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-accent-stone/10 overflow-hidden border border-border-natural"
            >
              <div className="bg-accent-stone p-10 text-white relative">
                <div className="absolute top-0 right-0 p-10 flex flex-col items-end opacity-20 pointer-events-none">
                   <div className="w-24 h-24 border-8 border-white rounded-full"></div>
                </div>
                <div className="flex items-center gap-2 text-border-natural mb-6 font-bold text-[10px] uppercase tracking-[0.3em]">
                  <CheckCircle size={14} /> 정책 제안 카드
                </div>
                <h2 className="text-3xl font-serif font-bold leading-tight">{finalCard.title}</h2>
              </div>
              
              <div className="p-10 space-y-8">
                <section>
                  <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.3em] mb-4">제안 개요</h3>
                  <p className="text-xl text-text-heading leading-relaxed font-serif italic text-accent-stone">"{finalCard.summary}"</p>
                </section>
                
                <div className="grid md:grid-cols-2 gap-10">
                  <section>
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-3">현황 및 문제점</h3>
                    <p className="text-sm text-text-main leading-relaxed">{finalCard.problem}</p>
                  </section>
                  <section>
                    <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-3">정책 대안</h3>
                    <p className="text-sm text-text-main leading-relaxed">{finalCard.suggestion}</p>
                  </section>
                </div>

                <div className="bg-background-sidebar p-8 rounded-3xl border border-border-natural">
                  <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4">기대 효과</h3>
                  <p className="text-sm text-text-heading font-medium leading-relaxed">{finalCard.expectedEffect}</p>
                </div>

                <section>
                  <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] mb-4 text-center">행정 실무 검토 가이드</h3>
                  <div className="grid grid-cols-1 gap-2">
                    {finalCard.reviewPoints.map((point: string, i: number) => (
                      <div key={i} className="flex items-center gap-4 text-xs text-text-muted bg-background-soft px-4 py-3 rounded-xl border border-border-subtle">
                        <span className="w-1.5 h-1.5 bg-accent-stone/50 rounded-full flex-shrink-0" />
                        {point}
                      </div>
                    ))}
                  </div>
                </section>

                <div className="pt-10 flex flex-col items-center gap-6">
                  <button 
                    onClick={() => { setFinalCard(null); setProposal(null); fetchProposals(); }}
                    className="flex items-center gap-3 bg-accent-stone text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-accent-stone/20"
                    id="new-proposal-btn"
                  >
                    새로운 제안 작성하기 <ArrowRight size={16} />
                  </button>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest opacity-40">이 제안은 공공 데이터로 관리됩니다.</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

