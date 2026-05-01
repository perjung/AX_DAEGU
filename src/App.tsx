import { useState } from 'react';
import { AnimatePresence } from "motion/react";
import { Screen, AIAnalysis } from './types';
import { SplashScreen } from './components/SplashScreen';
import { InputScreen } from './components/InputScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ResultScreen } from './components/ResultScreen';
import { RefineScreen } from './components/RefineScreen';
import { SuccessScreen } from './components/SuccessScreen';
import { geminiService } from './services/geminiService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('SPLASH');
  const [complaint, setComplaint] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);

  const handleStartAnalysis = async (text: string) => {
    setComplaint(text);
    setCurrentScreen('LOADING');
    
    try {
      const result = await geminiService.analyzeComplaint(text);
      setAnalysis(result);
      setCurrentScreen('RESULT');
    } catch (error) {
      console.error(error);
      // Fallback or retry logic
      setCurrentScreen('INPUT');
      alert('분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const handleUpdateAnalysis = (newAnalysis: AIAnalysis) => {
    setAnalysis(newAnalysis);
  };

  return (
    <div className="min-h-screen bg-brand-ivory font-sans antialiased text-brand-navy selection:bg-brand-blue/10">
      <AnimatePresence mode="wait">
        {currentScreen === 'SPLASH' && (
          <SplashScreen key="splash" onComplete={() => setCurrentScreen('INPUT')} />
        )}

        {currentScreen === 'INPUT' && (
          <InputScreen key="input" onSubmit={handleStartAnalysis} />
        )}

        {currentScreen === 'LOADING' && (
          <LoadingScreen key="loading" />
        )}

        {currentScreen === 'RESULT' && analysis && (
          <ResultScreen 
            key="result" 
            analysis={analysis} 
            onRefine={() => setCurrentScreen('REFINE')}
            onSubmit={() => alert('시청에 초안이 제출되었습니다. 시민님의 소중한 기부 감사드립니다!')}
          />
        )}

        {currentScreen === 'REFINE' && analysis && (
          <RefineScreen 
            key="refine" 
            analysis={analysis}
            onUpdate={handleUpdateAnalysis}
            onBack={() => setCurrentScreen('RESULT')}
            onComplete={() => setCurrentScreen('SUCCESS')}
          />
        )}

        {currentScreen === 'SUCCESS' && analysis && (
          <SuccessScreen 
            key="success" 
            analysis={analysis}
            onContinue={() => setCurrentScreen('RESULT')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

