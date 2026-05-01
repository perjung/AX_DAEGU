import { GoogleGenAI, Type } from "@google/genai";
import { AIAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    structuringLevel: { type: Type.NUMBER },
    diagnostic: { type: Type.STRING },
    riskOfRejection: { type: Type.BOOLEAN },
    draft: {
      type: Type.OBJECT,
      properties: {
        category: { type: Type.STRING },
        problem: { type: Type.STRING },
        target: { type: Type.STRING },
        direction: { type: Type.STRING },
        possibility: { type: Type.STRING },
      },
      required: ["category", "problem", "target", "direction", "possibility"],
    },
    metrics: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.NUMBER },
          increment: { type: Type.NUMBER },
          icon: { type: Type.STRING },
        },
        required: ["label", "value", "increment", "icon"],
      }
    }
  },
  required: ["structuringLevel", "diagnostic", "riskOfRejection", "draft", "metrics"],
};

export const geminiService = {
  async analyzeComplaint(complaint: string): Promise<AIAnalysis> {
    const prompt = `
      당신은 대한민국 행정 전문가 '이의있소'입니다.
      시민이 입력한 불편함을 분석하여 전문적인 '정책 제안서' 형태로 구조화하고, 지자체(대구광역시)에 제출했을 때의 실효성을 평가하세요.

      [사용자 입력]: "${complaint}"

      [분석 가이드라인]:
      1. structuringLevel: 0-100 사이의 점수. 초기 입력은 보통 30-50점 사이입니다.
      2. draft:
         - category: 정책 분야 (예: 교통, 환경, 복지 등)
         - problem: 시민의 말을 행정 언어로 정제한 핵심 문제 정의
         - target: 이 정책의 수혜 대상
         - direction: 해결 방안의 대략적인 방향
         - possibility: 정책화 가능성에 대한 전문가 소견
      3. metrics: 다음 5개 지표를 포함하세요 (Icon은 'target', 'public', 'library_books', 'build', 'lightbulb' 중 하나)
         - 문제 명확도
         - 공공성
         - 근거 충분성
         - 실현 가능성
         - 대안 구체성
      4. diagnostic: 현재 제안의 한계점과 보완이 필요한 이유를 1~2문장으로 설명.
      5. riskOfRejection: structuringLevel이 75점 미만이면 무조건 true, 75점 이상이면 false로 설정하세요.

      한국어로 응답하세요.
    `;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
        }
      });
      
      const text = result.text;
      if (!text) throw new Error("Empty response from Gemini");
      return JSON.parse(text);
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  },

  async getRefinementQuestion(analysis: AIAnalysis, history: any[]) {
    const prompt = `
      당신은 시민의 제안을 돕는 '정책 분석관'입니다. 
      현재 정책 제안의 완성도는 ${analysis.structuringLevel}% 입니다.
      특히 ${analysis.metrics.find(m => m.value < 50)?.label || '근거 충분성'} 부분이 보완이 필요합니다.

      ${analysis.diagnostic}

      시민에게 부드럽고 전문적인 어조로, 제안을 더 구체화하기 위한 '단 하나의 핵심 질문'을 던지세요. 
      게임 리프레임 기법을 사용해 "Round 1. 예산 문제 🔴" 같은 헤더를 포함해도 좋습니다.
      질문은 시민이 대답하기 쉽도록 예시를 포함하세요.
    `;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return result.text || "제안을 더 구체화하기 위해 도움이 필요합니다. 어떤 부분을 더 알고 싶으신가요?";
    } catch (error) {
      console.error("Gemini Question Error:", error);
      return "제안을 더 구체화하기 위해 도움이 필요합니다. 어떤 부분을 더 알고 싶으신가요?";
    }
  }
};

