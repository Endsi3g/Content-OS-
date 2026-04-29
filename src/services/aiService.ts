import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

const BASE_SYSTEM_INSTRUCTION = `You are an expert AI Content Creation Assistant and Strategist for a Content OS.
Your role is to act as a proactive coach:
1. Brainstorm high-converting content ideas and evaluate hooks.
2. Analyze video performance trends (Metricool data) to provide actionable growth strategies.
3. Offer advanced video editing feedback based on best practices (e.g., pacing, retention mechanics, b-roll usage, sound design).
4. Suggest ways to repurpose long-form videos into viral shorts.
5. If the user uploads a video file, ALWAYS provide a comprehensive transcription, summarize the content, identify key topics, and suggest 3 potential viral hooks and editing suggestions based on the transcription and user's goals.

Be highly professional, engaging, and concise. Format your responses beautifully using Markdown. Use lists, bold text, and clear headings to organize advice. If given current application state (like Metricool metrics or pending clips), analyze them directly to provide personalized recommendations.`;

export async function sendChatMessage(
  history: { role: string; parts: any[] }[], 
  text: string, 
  systemContext?: string,
  nativeFiles: File[] = []
) {
  const instruction = systemContext 
    ? `${BASE_SYSTEM_INSTRUCTION}\n\nCURRENT APP CONTEXT:\n${systemContext}`
    : BASE_SYSTEM_INSTRUCTION;

  const fileParts = await Promise.all(
    nativeFiles.map(async (file) => {
      return new Promise<any>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            const base64Data = reader.result.split(',')[1];
            resolve({
              inlineData: {
                data: base64Data,
                mimeType: file.type || 'application/octet-stream',
              }
            });
          } else {
            reject(new Error('Failed to read file as base64'));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    })
  );

  const parts: any[] = [];
  if (text) {
    parts.push({ text });
  }
  
  if (fileParts.length > 0) {
    parts.push(...fileParts);
  }

  // To prevent crashing with empty parts if just sending file
  if (parts.length === 0) {
    parts.push({ text: "Please analyze the attached files." });
  }

  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_CHAT_MODEL || 'gemini-2.0-flash',
      contents: [
        ...history,
        {
          role: 'user',
          parts
        }
      ],
      config: {
        systemInstruction: instruction,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('exhausted') || error?.message?.includes('Resource has been exhausted')) {
      return "⚠️ **Rate Limit Exceeded:** The AI API is currently rate limited (free tier quota). Please wait a few moments and try your request again.";
    }
    console.error("AI Error:", error);
    throw error;
  }
}

export async function transcribeMedia(file: File): Promise<string> {
  try {
    const filePart = await new Promise<any>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64Data = reader.result.split(',')[1];
          resolve({
            inlineData: {
              data: base64Data,
              mimeType: file.type || 'application/octet-stream',
            }
          });
        } else {
          reject(new Error('Failed to read file as base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_CHAT_MODEL || 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [
          filePart,
          { text: 'Please transcribe the audio in this file verbatim. Return ONLY the transcription text. Do not add any extra commentary or formatting. If there is no audio, return "[No audio detected]".' }
        ]
      }],
      config: {
        temperature: 0.1, // low temperature for accurate transcription
      }
    });

    return response.text?.trim() || '[Empty transcription]';
  } catch (error: any) {
    console.warn('Silent fallback: Error transcribing media.', error?.message);
    throw new Error('Transcription failed due to API limits or file size.');
  }
}

export async function generateChatTitle(firstMessage: string) {
  try {
    const response = await ai.models.generateContent({
      model: import.meta.env.VITE_GEMINI_FAST_MODEL || 'gemini-2.0-flash',
      contents: [{
        role: 'user',
        parts: [{ text: `Generate a very short, concise title (max 5 words) for a chat that starts with the following message: "${firstMessage}"` }]
      }],
      config: {
        temperature: 0.5,
      }
    });
    
    // Remove quotes if present
    let title = response.text?.trim() || 'New Chat';
    if (title.startsWith('"') && title.endsWith('"')) {
      title = title.substring(1, title.length - 1);
    }
    return title;
  } catch (error: any) {
    console.warn('Silent fallback: Error generating title due to API limits.', error?.message);
    return 'New Chat';
  }
}
