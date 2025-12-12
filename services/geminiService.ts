import { GoogleGenAI, Type } from "@google/genai";
import { TriviaQuestion, Language } from "../types";

const createClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const fetchTriviaBatch = async (
  topic: string,
  language: Language
): Promise<TriviaQuestion[]> => {
  const client = createClient();
  if (!client) return [];

  // Updated prompt for 5-6 year olds, asking for a batch
  const prompt = `Generate a list of 20 distinct, simple trivia questions about "${topic}" suitable for a 6-year-old child.
  The questions should be in the language: ${language}.
  For each question, provide 4 simple options and the index of the correct answer (0-3).`;

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctIndex: { type: Type.INTEGER },
            },
            required: ["question", "options", "correctIndex"],
          },
        },
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as TriviaQuestion[];
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching trivia batch:", error);
    // Return empty array to trigger fallback in UI
    return [];
  }
};