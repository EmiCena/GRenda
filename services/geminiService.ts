import { GoogleGenAI, Modality, Chat, Type } from "@google/genai";

// ✅ FIX: Usar import.meta.env en lugar de process.env
const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_API_KEY 
});

// 🔍 DEBUG TEMPORAL - Puedes borrar estas 2 líneas después
console.log("🔑 API Key presente:", !!import.meta.env.VITE_API_KEY);
console.log("🔑 Primeros caracteres:", import.meta.env.VITE_API_KEY?.substring(0, 15));

export const translateToGuarani = async (text: string): Promise<string> => {
  if (!text.trim()) {
    return "Por favor, introduce una palabra para traducir.";
  }

  try {
    const prompt = `Translate the following Spanish word or phrase to Guaraní. Provide ONLY the Guaraní translation. If you cannot translate it, respond with "No se encontró traducción.". Do not add any extra explanations or text.

Spanish phrase: "${text}"

Guaraní translation:`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error translating with Gemini API:", error);
    return "Error al conectar con el servicio de traducción.";
  }
};

export const translateBulkToGuarani = async (words: string[]): Promise<{ spanish: string; guarani: string }[]> => {
  if (words.length === 0) {
    return [];
  }

  const prompt = `Translate the following list of Spanish words into Guaraní. For each word, provide the most common translation. If a word cannot be translated, use the value "Traducción no encontrada".

Spanish words:
${words.join('\n')}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "A list of Spanish words and their Guaraní translations.",
          items: {
            type: Type.OBJECT,
            properties: {
              spanish: {
                type: Type.STRING,
                description: "The original word in Spanish."
              },
              guarani: {
                type: Type.STRING,
                description: "The translated word in Guaraní."
              },
            },
            required: ['spanish', 'guarani']
          }
        }
      }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (Array.isArray(result) && result.every(item => typeof item.spanish === 'string' && typeof item.guarani === 'string')) {
      const translationMap = new Map(result.map(item => [item.spanish.toLowerCase(), item.guarani]));
      return words.map(word => ({
        spanish: word,
        guarani: translationMap.get(word.toLowerCase()) || 'Traducción no encontrada'
      }));
    } else {
        throw new Error("Invalid JSON format from API");
    }

  } catch (error) {
    console.error("Error bulk translating with Gemini API:", error);
    return words.map(word => ({ spanish: word, guarani: 'Error de traducción' }));
  }
};

export const generateMascotImage = async (): Promise<string | null> => {
    try {
        const prompt = "A friendly and cute mascot for a Guaraní language learning app. The mascot is a capybara wearing a traditional Paraguayan ñandutí scarf. Simple, flat vector illustration style, with a cheerful expression, on a transparent background.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        return null;
    } catch (error) {
        console.error("Error generating mascot image with Gemini API:", error);
        return null;
    }
};

let chat: Chat | null = null;

const getChat = () => {
    if (!chat) {
        chat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: "You are a friendly and encouraging Guaraní teacher named 'Arami'. Your goal is to help the user practice their Guaraní in a conversational way. Keep your responses short, friendly, and primarily in Spanish but sprinkle in simple Guaraní words and phrases. For example, start with 'Mba'éichapa,' and end with 'Jajotopata'. Help correct the user's Guaraní if they make a mistake, but do it gently. When you introduce a Guaraní word or phrase for the user to learn, enclose it in single quotes like this: 'Iporãnte'.",
            },
        });
    }
    return chat;
};

export const getChatbotResponse = async (message: string): Promise<string> => {
    try {
        const chatInstance = getChat();
        const response = await chatInstance.sendMessage({ message });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting chatbot response:", error);
        return "Tuve un problema para responder. Intenta de nuevo.";
    }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const audioPart = {
            inlineData: {
                data: base64Audio,
                mimeType: mimeType,
            },
        };
        const textPart = {
            text: "Transcribe the following audio, which is a person speaking in Spanish or Guaraní.",
        };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, textPart] },
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error transcribing audio:", error);
        return ""; // Return empty string on error so it doesn't send "error" as a message
    }
};

export const generateSpeech = async (text: string): Promise<string | null> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // A friendly voice
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        return base64Audio || null;

    } catch (error) {
        console.error("Error generating speech with Gemini API:", error);
        return null;
    }
};

export const getAISuggestion = async (
  contentType: 'título de lección' | 'descripción de lección' | 'pregunta de opción múltiple' | 'frase para traducir' | 'oración para completar' | 'respuesta de traducción',
  currentText: string,
  context?: Record<string, string>
): Promise<string> => {
  const hasText = currentText.trim() !== '';
  let prompt: string;

  // Handle translation suggestion, which always needs a source phrase from context
  if (contentType === 'respuesta de traducción') {
    if (!context?.sourcePhrase) {
      return "Error: Se necesita la frase original para sugerir una traducción.";
    }
    prompt = `Eres un traductor experto de Español a Guaraní. Proporciona la traducción más precisa y natural para la siguiente frase en español.
      
Frase en Español: "${context.sourcePhrase}"
${hasText ? `Traducción actual (para mejorar): "${currentText}"` : ''}

Responde únicamente con la traducción ${hasText ? 'mejorada' : ''} en Guaraní. No añadas introducciones, explicaciones, ni comillas.`;
  }
  // Handle improvement of existing text
  else if (hasText) {
    prompt = `Eres un experto en diseño de currículos para el aprendizaje de idiomas, específicamente para el Guaraní. Mejora el siguiente texto que es un(a) "${contentType}". 
Responde únicamente con el texto mejorado. No añadas introducciones, explicaciones, ni comillas.

Texto Original: "${currentText}"
`;
  }
  // Handle generation of new text
  else {
    let contextHint = '';
    if (contentType === 'descripción de lección' && context?.title) {
        contextHint = ` para una lección titulada "${context.title}"`;
    }
    
    prompt = `Eres un experto en diseño de currículos para el aprendizaje de idiomas, específicamente para el Guaraní. Genera un(a) "${contentType}"${contextHint} para una lección sobre la cultura o el idioma Guaraní.
Responde únicamente con el texto generado. No añadas introducciones, explicaciones, ni comillas.`;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error getting AI suggestion from Gemini API:", error);
    return "Error: No se pudo conectar con el servicio de IA.";
  }
};

export const checkGuaraniPronunciation = async (
    base64Audio: string, 
    mimeType: string, 
    targetPhrase: string
): Promise<{ transcription: string; accuracyScore: number; feedback: string; } | null> => {
    try {
        const audioPart = { inlineData: { data: base64Audio, mimeType } };
        const prompt = `You are a Guaraní language pronunciation coach. A user is trying to pronounce the phrase: "${targetPhrase}".
The provided audio is their attempt.
Analyze their pronunciation and provide a response in JSON format.
The JSON object must contain:
1. "transcription": What you heard in the audio.
2. "accuracyScore": An integer score from 0 to 100 representing how accurately the user pronounced the target phrase.
3. "feedback": Constructive, specific, and encouraging feedback on their pronunciation. Point out what they did well and where they can improve. Keep it concise.

Do not include any other text or markdown formatting in your response.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, { text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        transcription: { type: Type.STRING },
                        accuracyScore: { type: Type.NUMBER },
                        feedback: { type: Type.STRING }
                    },
                    required: ['transcription', 'accuracyScore', 'feedback']
                }
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result;

    } catch (error) {
        console.error("Error checking pronunciation with Gemini API:", error);
        return null;
    }
};