
import { GoogleGenAI, Type } from "@google/genai";

export async function generatePoetryIntro() {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: 'اكتب مقدمة أدبية bليغة لافتتاح "مدينة الشعر الرقمية"، وهي منصة تجعل القصائد تعوم في الفضاء الثلاثي الأبعاد. ركز على تلاقي الكلمة والتكنولوجيا.',
  });
  return response.text;
}

export async function getLiteraryInsights(locationName: string, lat?: number, lng?: number) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `أخبرني عن التاريخ الأدبي والشعري لمدينة ${locationName}. من هم أشهر شعرائها وما هي القصائد التي قيلت فيها؟`,
    config: {
      tools: [{ googleSearch: {} }]
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
}

export async function generateExhibitionContent(location: string, prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `أنت مساعد إبداعي لمنسق معارض فنية في "مدن الشعر". 
    الموقع الحالي: ${location}. 
    رؤية المنسق: ${prompt}.
    قم بتوليد 6 نقاط سردية (قصائد أو جداريات) تعبر عن روح هذا المكان.
    يجب أن يكون المحتوى باللغة العربية البليغة، مع لمسات من التراث المحلي للمكان إذا أمكن.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                poet: { type: Type.STRING },
                content: { type: Type.STRING },
                type: { type: Type.STRING, description: "either 'poem' or 'mural'" },
                style: { type: Type.STRING, description: "one of: urban, stencil, ancient, neon" }
              },
              required: ["title", "poet", "content", "type"]
            }
          }
        },
        required: ["items"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function formulateVerse(theme: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `اكتب بيت شعر واحد بليغ على بحر الخليل حول موضوع: ${theme}.`,
  });
  return response.text;
}
