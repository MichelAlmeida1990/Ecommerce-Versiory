
import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

export const getAIProductInsight = async (product: Product): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Você é o consultor de sucesso da Versiory Store. Seu slogan é "Transformando ideias em sucesso". Crie um pitch de vendas persuasivo, inspirador e curto (máximo 3 frases) para o produto: ${product.name}. A descrição original é: ${product.description}. Fale diretamente com o cliente motivando-o a alcançar o sucesso com este item. Responda em Português.`,
    });
    
    return response.text || "Não foi possível gerar um insight no momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Nossa inteligência está refinando novas ideias. Mas este produto continua sendo sua chave para o sucesso!";
  }
};
