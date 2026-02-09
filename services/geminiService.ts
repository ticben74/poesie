
import { GoogleGenAI } from "@google/genai";

export async function generatePoetryIntro() {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'اكتب مقدمة أدبية بليغة لافتتاح "مدينة الشعر الرقمية"، وهي منصة تجعل القصائد تعوم في الفضاء الثلاثي الأبعاد. ركز على تلاقي الكلمة والتكنولوجيا.',
  });
  return response.text;
}

export async function getLiteraryInsights(locationName: string, lat?: number, lng?: number) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `أخبرني عن التاريخ الأدبي والشعري لمدينة ${locationName}. من هم أشهر شعرائها وما هي القصائد التي قيلت فيها؟`,
    config: {
      tools: [{ googleSearch: {} }] // استخدام البحث للحصول على معلومات دقيقة
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

export async function formulateVerse(theme: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `اكتب بيت شعر واحد بليغ على بحر الخليل حول موضوع: ${theme}.`,
  });
  return response.text;
}
