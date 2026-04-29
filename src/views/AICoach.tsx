import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { t } from '../i18n';
import { Fire, Plus, PaperPlaneRight, User, Robot, Chat, Trash, Copy, ThumbsUp, ThumbsDown, ArrowsClockwise, Sparkle, ChartLineUp, Lightbulb, Scissors, FileText, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { sendChatMessage, generateChatTitle, transcribeMedia } from '../services/aiService';
import { fetchMetricoolAnalytics } from '../services/metricoolService';
import { ClaudeChatInput } from '../components/ui/claude-style-ai-input';

function CollapsibleMessage({ content }: { content: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className="flex flex-col relative w-full">
      <div className={`transition-all duration-300 relative overflow-hidden ${isCollapsed ? 'max-h-[100px] cursor-pointer' : 'max-h-full'}`} onClick={() => isCollapsed && setIsCollapsed(false)}>
        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:mt-0 prose-p:mb-5 prose-headings:font-bold prose-headings:text-[var(--text-main)] prose-p:text-[var(--text-main)] prose-li:text-[var(--text-main)] prose-strong:text-[var(--text-main)] prose-pre:bg-[var(--border)] prose-pre:text-[var(--text-main)] prose-a:text-[#D97757]">
          <Markdown>{content}</Markdown>
        </div>
        {isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[var(--bg)] to-transparent pointer-events-none" />
        )}
      </div>
      
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[var(--border)]/50">
        <div className="flex items-center gap-1 text-[var(--text-muted)] -ml-1">
          <button className="p-1.5 hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)] rounded-md transition-colors" title="Copy">
            <Copy size={16} />
          </button>
          <button className="p-1.5 hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)] rounded-md transition-colors" title="Good response">
            <ThumbsUp size={16} />
          </button>
          <button className="p-1.5 hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)] rounded-md transition-colors" title="Bad response">
            <ThumbsDown size={16} />
          </button>
          <button className="p-1.5 hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)] rounded-md transition-colors" title="Retry">
            <ArrowsClockwise size={16} />
          </button>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors px-2 py-1 rounded-md hover:bg-[var(--hover-bg)]"
        >
          {isCollapsed ? 'Expand' : 'Collapse'}
        </button>
      </div>
    </div>
  );
}

export function AICoach() {
  const { 
    language, 
    chatSessions, 
    activeChatId, 
    setActiveChatId, 
    addChatSession, 
    updateChatSession, 
    removeChatSession,
    addChatMessage,
    assets,
    clips
  } = useAppStore();

  const [isTyping, setIsTyping] = useState(false);
  
  // Custom states for the transcription panel
  const [activeTranscription, setActiveTranscription] = useState<{ filename: string; text: string; isLoading: boolean } | null>(null);
  const [showTranscriptionPanel, setShowTranscriptionPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeChat = chatSessions.find(s => s.id === activeChatId) || chatSessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const handleNewChat = () => {
    const newSession = {
      id: crypto.randomUUID(),
      title: 'New Chat',
      messages: [],
      updatedAt: new Date().toISOString()
    };
    addChatSession(newSession);
    setActiveChatId(newSession.id);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeChatSession(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
    if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const handleSendMessage = async (message: string, files: any[] = [], pastedContent: any[] = []) => {
    if ((!message.trim() && files.length === 0 && pastedContent.length === 0) || isTyping) return;

    let fullText = message;
    if (pastedContent.length > 0) {
      fullText += '\n\n' + pastedContent.map(pc => pc.content).join('\n\n');
    }
    
    // We only concatenate text content for non-native files.
    // Native files (images/video) will be passed directly to Gemini.
    const nativeFiles = files?.map(f => f.file).filter(Boolean) || [];
    
    // Check if we uploaded a video file
    const hasVideo = nativeFiles.some(f => f.type.startsWith('video/'));

    if (files.length > 0) {
      const filesText = files.filter(f => f.textContent).map(f => `--- File: ${f.file.name} ---\n${f.textContent}\n--- End File ---`).join('\n\n');
      if (filesText) fullText += '\n\n' + filesText;
    }

    let currentSessionId = activeChatId;
    let currentSession = activeChat;

    // Create session if it doesn't exist
    if (!currentSession) {
      const newSessionId = crypto.randomUUID();
      currentSession = { id: newSessionId, title: 'New Chat', messages: [], updatedAt: new Date().toISOString() };
      addChatSession(currentSession);
      setActiveChatId(newSessionId);
      currentSessionId = newSessionId;
    }

    // Attach file names to content to signify they are present visually without big blobs
    let visualText = fullText.trim();
    if (nativeFiles.length > 0) {
      const attachedNames = nativeFiles.map(f => f.name).join(', ');
      visualText += `\n\n*(Attached Files: ${attachedNames})*`;
      if(hasVideo) {
         visualText += `\n\n**Please transcribe and summarize this video, extract key topics, suggest potential viral hooks based on my metric trends, and offer editing guidelines.**`;
      }
    }

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user' as const,
      content: visualText.trim() || 'Analyze attached files',
      timestamp: new Date().toISOString()
    };

    addChatMessage(currentSessionId as string, userMessage);
    setIsTyping(true);

    // Generate title in parallel if it's the first message
    if (currentSession.messages.length === 0) {
      generateChatTitle(userMessage.content)
        .then((newTitle) => {
          if (newTitle) {
            updateChatSession(currentSessionId as string, { title: newTitle });
          }
        })
        .catch((error) => console.error('Failed to generate title:', error));
    }

    const history = currentSession.messages.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    }));

    try {
      // Build dynamic system context
      const metrics = await fetchMetricoolAnalytics().catch(() => ({ error: 'Could not fetch metrics' }));
      const pendingClipsCount = clips.filter(c => c.status === 'pending').length;
      
      const systemContext = `
      Current Application State:
      - Total Assets: ${assets.length}
      - Pending Clips Review: ${pendingClipsCount}
      - Metricool Analytics Summary: ${JSON.stringify(metrics, null, 2)}
      
      ROLE: You are an expert AI Coach for content creators.
      INSTRUCTIONS:
      ${hasVideo ? '- If a video file is attached, ALWAYS provide: 1. A summary transcription of the content. 2. Key topics covered. 3. Potential viral hooks leveraging the user\'s Metricool Analytics data. 4. Advanced editing feedback and pacing suggestions.' : ''}
      - Be proactive in giving actionable advice to improve engagement.
      - Keep formatting clean using markdown.
      `;

      let promptToSend = fullText.trim();
      if(hasVideo && !promptToSend) {
         promptToSend = `Transcribe this video, summarize its content, extract key topics, suggest potential viral hooks, and give editing guidelines based on my past performance.`;
      }

      if (hasVideo && nativeFiles.length > 0) {
        const videoFile = nativeFiles.find(f => f.type.startsWith('video/'));
        if (videoFile) {
          setShowTranscriptionPanel(true);
          setActiveTranscription({ filename: videoFile.name, text: '', isLoading: true });
          
          transcribeMedia(videoFile).then(transcriptionText => {
            setActiveTranscription({ filename: videoFile.name, text: transcriptionText, isLoading: false });
          }).catch(err => {
            console.error('Transcription failed', err);
            setActiveTranscription({ filename: videoFile.name, text: 'Transcription failed due to an error or API limits.', isLoading: false });
          });
        }
      }

      const responseText = await sendChatMessage(history, promptToSend, systemContext, nativeFiles);
      
      const modelMessage = {
        id: crypto.randomUUID(),
        role: 'model' as const,
        content: responseText,
        timestamp: new Date().toISOString()
      };
      
      addChatMessage(currentSessionId as string, modelMessage);
    } catch (error: any) {
      console.warn('Silent fallback: Failed to get AI response due to API limits.', error?.message);
      // Fallback response for limits or errors
      const errorMessage = {
        id: crypto.randomUUID(),
        role: 'model' as const,
        content: "Oops! There was an issue processing your request or reading the file. Make sure your video isn't too large for the current model limits.",
        timestamp: new Date().toISOString()
      };
      addChatMessage(currentSessionId as string, errorMessage);
    } finally {
      setIsTyping(false);
    }
  };

  const suggestions = [
    {
      title: "Analyze my metrics",
      prompt: "Can you analyze my current Metricool performance metrics and suggest 3 actionable ways to increase my audience engagement?",
      icon: <ChartLineUp size={18} className="text-blue-500" />
    },
    {
      title: "Analyze Video Upload",
      prompt: "Transcribe the attached video, extract key topics, suggest potential viral hooks, and give advanced editing guidelines.",
      icon: <Sparkle size={18} className="text-purple-500" />
    },
    {
      title: "Review Editing Pacing",
      prompt: "What are the best practices for editing shorts to maximize retention? Give me advanced tips on pacing, b-roll, and sound design.",
      icon: <Scissors size={18} className="text-pink-500" />
    }
  ];

  return (
    <div className="flex h-full border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--surface)]">
      {/* Sidebar: Chat History */}
      <div className="w-72 border-r border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0">
        <div className="p-4 border-b border-[var(--border)]">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--text-main)] text-[var(--surface)] rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus size={16} weight="bold" />
            {language === 'fr' ? 'Nouveau Chat' : 'New Chat'}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-1">
          {[...chatSessions].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(session => (
            <div
              key={session.id}
              onClick={() => setActiveChatId(session.id)}
              className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg text-left text-sm transition-all cursor-pointer group border ${
                activeChatId === session.id
                  ? 'bg-[var(--hover-bg)] text-[var(--text-main)] border-[var(--border)] shadow-sm'
                  : 'text-[var(--text-muted)] border-transparent hover:bg-[var(--hover-bg)]/50 hover:text-[var(--text-main)]'
              }`}
            >
              <Chat size={18} className={`shrink-0 mt-0.5 ${activeChatId === session.id ? 'text-[var(--brand)]' : ''}`} weight={activeChatId === session.id ? 'fill' : 'regular'} />
              <div className="flex-1 flex flex-col min-w-0">
                <span className="truncate font-medium">{session.title}</span>
                <span className="text-[10px] opacity-70 mt-0.5">{formatDate(session.updatedAt)}</span>
              </div>
              <button 
                onClick={(e) => handleDeleteSession(e, session.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[var(--border)] hover:text-red-500 rounded-md transition-all shrink-0"
                title="Delete Chat"
              >
                <Trash size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg)]">
        {/* Chat Header */}
        <div className="h-16 border-b border-[var(--border)] px-6 flex items-center justify-between bg-[var(--surface)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
              <Fire size={20} weight="duotone" />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-main)]">
                {activeChat?.title || 'AI Coach'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                {language === 'fr' ? 'Spécialiste en création de contenu' : 'Content Creation Specialist'}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {(!activeChat || activeChat.messages.length === 0) && (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-2xl px-4">
                <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkle size={32} weight="fill" />
                </div>
                <h3 className="text-2xl font-semibold text-[var(--text-main)] text-center mb-2">
                  {language === 'fr' ? 'Bonjour, je suis votre Coach IA.' : 'Hello, I\'m your AI Coach.'}
                </h3>
                <p className="text-[var(--text-muted)] text-center mb-8 max-w-md mx-auto">
                  {language === 'fr' 
                    ? 'Je peux analyser vos statistiques, brainstormer des concepts viraux, ou affiner la narration de vos vidéos.'
                    : 'I can analyze your performance metrics, brainstorm viral hooks, or refine your video editing pacing.'}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggestion.prompt)}
                      className="text-left p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover-bg)] hover:border-purple-300 transition-all flex flex-col gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {suggestion.icon}
                      </div>
                      <span className="text-sm font-medium text-[var(--text-main)] leading-snug">
                        {suggestion.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeChat?.messages.map((msg, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id || index} 
              className={`flex gap-4 max-w-3xl mx-auto w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'model' && (
                <div className="w-8 h-8 mt-1 rounded-md bg-[#D97757] text-[#FAF8F5] flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkle size={18} weight="fill" />
                </div>
              )}
              
                  <div className={`text-[15px] leading-relaxed flex flex-col ${
                    msg.role === 'user' 
                      ? 'bg-[var(--hover-bg)] border border-[var(--border)] text-[var(--text-main)] px-5 py-3.5 rounded-3xl rounded-tr-sm max-w-[85%]' 
                      : 'text-[var(--text-main)] mt-1 max-w-full overflow-hidden'
                  }`}>
                    {msg.role === 'user' ? (
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    ) : (
                      <CollapsibleMessage content={msg.content} />
                    )}
                  </div>
            </motion.div>
          ))}
          
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 max-w-3xl mx-auto w-full justify-start"
            >
              <div className="w-8 h-8 mt-1 rounded-md bg-[#D97757] text-[#FAF8F5] flex items-center justify-center shrink-0 shadow-sm">
                <Sparkle size={18} weight="fill" />
              </div>
              <div className="mt-1 p-2 flex items-center gap-2 h-[32px]">
                <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[var(--text-muted)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] shrink-0 w-full flex justify-center pb-6">
          <div className="w-full max-w-3xl">
            <ClaudeChatInput
              onSendMessage={(msg, files, pasted) => handleSendMessage(msg, files, pasted)}
              isSending={isTyping}
              acceptedFileTypes={['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg', 'image/png', 'application/pdf', 'text/plain']}
              placeholder={language === 'fr' ? "Demander conseil à l'IA ou ajoutez des vidéos..." : "Upload a video or ask the coach..."}
            />
          </div>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-center">
            <span className="text-[10px] text-[var(--text-muted)]">
              L'IA peut faire des erreurs. Vérifiez les informations importantes.
            </span>
          </div>
        </div>
      </div>

      {/* Transcription Panel */}
      <AnimatePresence>
        {showTranscriptionPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-[var(--border)] bg-[var(--surface)] flex flex-col shrink-0 overflow-hidden"
          >
            <div className="h-16 border-b border-[var(--border)] px-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-[var(--text-main)] font-semibold">
                <FileText size={18} className="text-blue-500" />
                <span>Transcript</span>
              </div>
              <button 
                onClick={() => setShowTranscriptionPanel(false)}
                className="p-1 hover:bg-[var(--hover-bg)] rounded-md transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto w-[320px]">
              {activeTranscription ? (
                <div className="p-4 flex flex-col gap-3">
                  <div className="text-xs font-mono text-[var(--text-muted)] truncate bg-[var(--bg)] p-2 rounded-md border border-[var(--border)]">
                    {activeTranscription.filename}
                  </div>
                  
                  {activeTranscription.isLoading ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4 text-[var(--text-muted)]">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm animate-pulse">Transcribing video...</span>
                    </div>
                  ) : (
                    <div className="text-sm leading-relaxed text-[var(--text-main)] bg-[var(--hover-bg)] p-4 rounded-xl border border-[var(--border)]">
                      <span className="font-semibold block mb-2 text-blue-600">Result:</span>
                      <div className="whitespace-pre-wrap">{activeTranscription.text}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 text-sm text-[var(--text-muted)] text-center mt-10">
                  Select a video or upload one to see its transcription here.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
