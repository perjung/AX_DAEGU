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
         **중요: 최초 분석이므로 모든 지표의 increment는 0으로 설정하세요.**
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
    const historyString = history
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? '시민' : '분석관'}: ${m.content}`)
      .join('\n');

    const prompt = `
      당신은 시민의 제안을 돕는 전문적인 '정책 분석관'입니다. 

      [현재 분석 상태]
      - 정책 제안 완성도: ${analysis.structuringLevel}%
      - 보완 권고: ${analysis.diagnostic}
      
      [대화 요약]
      ${historyString}

      [지침]
      1. 사용자의 최근 답변이 정책의 완성도를 어떻게 높였는지 짧게(1문장) 칭찬하거나 격려하세요.
      2. 만약 완성도가 85% 이상이라면, "제안이 충분히 무르익었습니다. 이제 행정 전문가 검토를 위해 제출하셔도 좋습니다."라고 마무리하세요.
      3. 완성도가 아직 부족하다면, ${analysis.metrics.find(m => m.value < 70)?.label || '다음 단계'}를 보완하기 위한 '단 하나의' 구체적인 질문을 던지세요.
      4. 반론(피드백)을 통해 시민의 아이디어를 깎아내리지 말고, "더 좋은 정책이 되려면 이 점이 필요해요"라는 관점으로 접근하세요.
      5. "AI"라는 표현 대신 "우리 분석팀"이나 "저" 같은 표현을 사용하세요.
    `;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      return result.text || "제안을 더 구체적으로 만들어주셔서 감사합니다. 추가로 보완하고 싶은 점이 있으신가요?";
    } catch (error) {
      console.error("Gemini Question Error:", error);
      return "제안을 보완해주셔서 감사합니다. 혹시 더 덧붙이고 싶은 내용이 있으신가요?";
    }
  }
};

