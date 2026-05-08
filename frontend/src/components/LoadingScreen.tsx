import { motion } from "motion/react";
import { Gavel } from "lucide-react";
import { useEffect, useState } from "react";

export function LoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["불편 사항 분석 중...", "이해관계자 파악 중...", "행정 용어로 번역 중...", "정책 구조화 중..."];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center gap-12 bg-brand-ivory">
      <div className="relative w-32 h-32 flex items-center justify-center">
        <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border-4 border-brand-blue rounded-full border-t-transparent"
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-50 z-10"
        >
          <Gavel size={40} className="text-brand-blue" fill="currentColor" />
        </motion.div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 leading-tight">
          시민님의 소중한 의견을<br />정책 언어로 번역하고 있습니다...
        </h2>
        
        <div className="h-8">
          <motion.p
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-brand-blue font-medium"
          >
            {steps[currentStep]}
          </motion.p>
        </div>

        <p className="text-gray-500 text-sm">
          잠시만 기다려 주세요. 행정 전문가가 분석 중입니다.
        </p>
      </div>

      <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: "10%" }}
          animate={{ width: "95%" }}
          transition={{ duration: 8, ease: "easeInOut" }}
          className="h-full bg-brand-success rounded-full"
        />
      </div>
    </div>
  );
}
