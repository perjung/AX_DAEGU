import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gavel, ChevronLeft, Send, Stars } from "lucide-react";
import { AIAnalysis, ChatMessage } from "../types";
import { geminiService } from "../services/geminiService";

interface RefineScreenProps {
  analysis: AIAnalysis;
  onUpdate: (newAnalysis: AIAnalysis) => void;
  onBack: () => void;
  onComplete: () => void;
}

export function RefineScreen({ analysis, onUpdate, onBack, onComplete }: RefineScreenProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initChat = async () => {
      setIsTyping(true);
      const question = await geminiService.getRefinementQuestion(analysis, []);
      setMessages([{
        id: "1",
        role: "assistant",
        content: question,
        round: 1,
        topic: "구체성 보완"
      }]);
      setIsTyping(false);
    };
    initChat();
  }, []);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: "user", content: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    try {
      const newScore = Math.min(95, analysis.structuringLevel + 25);
      // Simulate analysis update
      const updatedAnalysis: AIAnalysis = {
        ...analysis,
        structuringLevel: newScore,
        metrics: analysis.metrics.map(m => {
          if (m.label === "근거 충분성" || m.label === "대안 구체성") {
            return { ...m, value: Math.min(100, m.value + 25), increment: 25 };
          }
          return { ...m, increment: Math.floor(Math.random() * 5) };
        }),
        riskOfRejection: newScore < 75,
        diagnostic: newScore >= 75 
          ? "보완 사항이 훌륭하게 반영되었습니다. 이제 정책의 설득력이 매우 높아져 통과 가능성이 큽니다."
          : "보완이 진행되었으나 아직 구체적인 근거가 부족합니다. 한 라운드 더 진행하는 것을 권장합니다."
      };

      // In a real app, we might call Gemini again with the full history
      // For this demo, we'll wait 2 seconds and trigger the success
      setTimeout(() => {
        onUpdate(updatedAnalysis);
        onComplete();
      }, 2000);

    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-screen bg-brand-ivory overflow-hidden">
      <header className="flex-shrink-0 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <div className="flex items-center gap-2">
          <Gavel size={20} className="text-brand-blue" fill="currentColor" />
          <h1 className="text-lg font-black text-brand-blue">이의있소!</h1>
        </div>
        <div className="w-10" />
      </header>

      {/* Sticky Progress Info */}
      <div className="flex-shrink-0 bg-brand-ivory px-6 py-3 border-b border-gray-100">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[10px] font-bold text-gray-400">정책 구조화 수준</span>
          <span className="text-xs font-bold text-brand-success">{analysis.structuringLevel}% <span className="text-[10px] ml-1 opacity-70">(보완 중)</span></span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <motion.div 
            initial={{ width: `${analysis.structuringLevel}%` }}
            animate={{ width: `${analysis.structuringLevel + 5}%` }}
            className="bg-brand-success h-full animate-pulse" 
          />
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-2 mb-2 ml-1">
                  <div className="w-6 h-6 rounded-full bg-brand-blue/10 flex items-center justify-center border border-brand-blue/10 overflow-hidden">
                    <Stars size={12} className="text-brand-blue" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-orange flex items-center gap-1">정책 분석관</span>
                </div>
              )}
              
              <div className={`p-4 rounded-2xl shadow-sm border ${
                msg.role === "user" 
                ? "bg-brand-blue text-white rounded-tr-sm border-brand-blue max-w-[85%]" 
                : "bg-white text-brand-navy rounded-tl-sm border-brand-orange/20 max-w-[90%] relative"
              }`}>
                {msg.role === "assistant" && (
                  <div className="absolute -top-3 -right-3 bg-white border border-gray-100 rounded-full p-1.5 shadow-sm">
                    <Gavel size={14} className="text-brand-orange" />
                  </div>
                )}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
              
              <span className="text-[10px] text-gray-400 mt-1.5 px-1">
                {msg.role === "user" ? "나의 보완" : "전문가 피드백"}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="flex space-x-1 p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-gray-300 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-gray-300 rounded-full" />
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-gray-300 rounded-full" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </main>

      <footer className="flex-shrink-0 p-4 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:ring-1 focus:ring-brand-blue focus:border-brand-blue transition-all resize-none max-h-32"
            placeholder="질문에 답하며 제안을 보완하세요..."
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isTyping}
            className="w-12 h-12 flex items-center justify-center bg-brand-blue text-white rounded-xl shadow-lg hover:bg-blue-700 disabled:bg-gray-200 disabled:shadow-none transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </footer>
    </div>
  );
}
