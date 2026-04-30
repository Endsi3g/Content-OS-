import Anthropic from '@anthropic-ai/sdk';

const ai = new Anthropic({ 
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true
});

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

  const anthropicMessages: any[] = [];
  
  // Convert generic history to Anthropic format
  for (const msg of history) {
    if (msg.role === 'model') {
      anthropicMessages.push({ role: 'assistant', content: msg.parts.map((p: any) => p.text).join('\n') });
    } else {
      anthropicMessages.push({ role: 'user', content: msg.parts.map((p: any) => p.text).join('\n') });
    }
  }

  const currentMessageParts: any[] = [];
  if (text) {
    currentMessageParts.push({ type: 'text', text });
  }
  
  if (fileParts.length > 0) {
    for (const fp of fileParts) {
      if (fp.inlineData.mimeType.startsWith('image/')) {
        currentMessageParts.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: fp.inlineData.mimeType,
            data: fp.inlineData.data,
          }
        });
      } else {
         // Claude only supports image/document natively, fallback text description
         currentMessageParts.push({ type: 'text', text: `[File attached: ${fp.inlineData.mimeType}]` });
      }
    }
  }

  if (currentMessageParts.length === 0) {
    currentMessageParts.push({ type: 'text', text: "Please analyze the attached files." });
  }

  anthropicMessages.push({ role: 'user', content: currentMessageParts });

  try {
    const response = await ai.messages.create({
      model: import.meta.env.VITE_ANTHROPIC_CHAT_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 2048,
      system: instruction,
      messages: anthropicMessages,
      temperature: 0.7,
    });

    return (response.content[0] as any).text;
  } catch (error: any) {
    if (error?.status === 429) {
      return "⚠️ **Rate Limit Exceeded:** The AI API is currently rate limited. Please wait a few moments and try your request again.";
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

    const response = await ai.messages.create({
      model: import.meta.env.VITE_ANTHROPIC_CHAT_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: 'Please transcribe the audio in this file verbatim. Return ONLY the transcription text. Do not add any extra commentary or formatting. If there is no audio, return "[No audio detected]".' }
        ]
      }],
      temperature: 0.1, // low temperature for accurate transcription
    });

    return (response.content[0] as any).text?.trim() || '[Empty transcription]';
  } catch (error: any) {
    console.warn('Silent fallback: Error transcribing media.', error?.message);
    throw new Error('Transcription failed due to API limits or file size.');
  }
}

export async function generateChatTitle(firstMessage: string) {
  try {
    const response = await ai.messages.create({
      model: import.meta.env.VITE_ANTHROPIC_FAST_MODEL || 'claude-3-5-haiku-latest',
      max_tokens: 64,
      messages: [{
        role: 'user',
        content: `Generate a very short, concise title (max 5 words) for a chat that starts with the following message: "${firstMessage}"`
      }],
      temperature: 0.5,
    });
    
    // Remove quotes if present
    let title = (response.content[0] as any).text?.trim() || 'New Chat';
    if (title.startsWith('"') && title.endsWith('"')) {
      title = title.substring(1, title.length - 1);
    }
    return title;
  } catch (error: any) {
    console.warn('Silent fallback: Error generating title due to API limits.', error?.message);
    return 'New Chat';
  }
}
