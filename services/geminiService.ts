import { GoogleGenAI, Type } from "@google/genai";
import { ParticleConfig, ParticleMode, DEFAULT_CONFIG } from '../types';

// Safely retrieve the API key
const getApiKey = (): string | undefined => {
  return process.env.API_KEY;
};

export const generateConfigFromPrompt = async (prompt: string): Promise<ParticleConfig> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("API Key not found, returning default config.");
    return DEFAULT_CONFIG;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a particle system configuration based on this description: "${prompt}".
      Choose colors that match the mood. 
      'chaos' should be between 0.1 and 2.0.
      'speed' should be between 0.1 and 5.0.
      'count' between 1000 and 8000.
      'size' between 0.05 and 0.5.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            count: { type: Type.INTEGER },
            size: { type: Type.NUMBER },
            speed: { type: Type.NUMBER },
            colorA: { type: Type.STRING, description: "Hex color code, e.g. #ff0000" },
            colorB: { type: Type.STRING, description: "Hex color code" },
            mode: { 
              type: Type.STRING, 
              enum: ["float", "attract", "swirl", "rain"] 
            },
            chaos: { type: Type.NUMBER }
          },
          required: ["count", "size", "speed", "colorA", "colorB", "mode", "chaos"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const data = JSON.parse(jsonText);
    
    // Validate mapping to enum
    let mode = ParticleMode.FLOAT;
    if (Object.values(ParticleMode).includes(data.mode)) {
      mode = data.mode as ParticleMode;
    }

    return {
      count: Math.min(Math.max(data.count, 500), 10000), // Safety clamp
      size: data.size,
      speed: data.speed,
      colorA: data.colorA,
      colorB: data.colorB,
      mode: mode,
      chaos: data.chaos
    };

  } catch (error) {
    console.error("Failed to generate config:", error);
    return DEFAULT_CONFIG;
  }
};
