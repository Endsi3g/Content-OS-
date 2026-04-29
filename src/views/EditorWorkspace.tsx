import React, { useState, useRef, useEffect } from 'react';
import {
  PlayCircle, Check, X, Folder, FilmStrip,
  PenNib, ShareNetwork, DotsThreeCircle, Plus, Eye, UserCircle,
  FrameCorners, ArrowSquareOut
} from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

const FREEFRAME_URL = import.meta.env.VITE_FREEFRAME_URL as string | undefined;

interface Point { x: number; y: number }
interface Drawing { points: Point[]; color: string }
interface Comment {
  id: string;
  timePct: number;
  timeStr: string;
  text: string;
  author: string;
  resolved: boolean;
  drawing?: Drawing;
}

export function EditorWorkspace() {
  const { assets, setCurrentView } = useAppStore();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'comments' | 'versions'>('comments');
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Drawing | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [freeframeMode, setFreeframeMode] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const videoPlayerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [assetId, setAssetId] = useState<string | null>(null);

  useEffect(() => {
    if (assets && assets.length > 0) setAssetId(assets[0].id);
  }, [assets]);

  useEffect(() => {
    if (!assetId) return;
    api.get<any>(`/api/assets/${assetId}/comments`)
      .then(d => {
        if (d.success) setComments(d.comments.map((c: any) => ({
          ...c,
          drawing: c.drawing ? JSON.parse(c.drawing) : undefined,
        })));
      })
      .catch(console.error);
  }, [assetId]);

  // Receive messages from FreeFrame iframe
  useEffect(() => {
    if (!FREEFRAME_URL) return;
    const handleMessage = (event: MessageEvent) => {
      try {
        const url = new URL(FREEFRAME_URL);
        if (event.origin !== url.origin) return;
      } catch { return; }

      const { type } = event.data || {};
      if (type === 'FREEFRAME_READY') {
        sendAuthToFreeframe();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [FREEFRAME_URL, user]);

  const sendAuthToFreeframe = async () => {
    if (!user || !iframeRef.current?.contentWindow || !FREEFRAME_URL) return;
    try {
      const token = await user.getIdToken();
      const freeframeOrigin = new URL(FREEFRAME_URL).origin;
      iframeRef.current.contentWindow.postMessage(
        { type: 'CONTENTOS_AUTH', token, email: user.email, displayName: user.displayName },
        freeframeOrigin
      );
    } catch (e) {
      console.error('Failed to send auth to FreeFrame:', e);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !videoPlayerRef.current) return;
    const rect = videoPlayerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentDrawing({ points: [{ x, y }], color: '#FF3366' });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingMode || !currentDrawing || !videoPlayerRef.current) return;
    const rect = videoPlayerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setCurrentDrawing(prev => prev ? { ...prev, points: [...prev.points, { x, y }] } : null);
  };

  const submitComment = async () => {
    if (!newComment.trim() && !currentDrawing) return;
    if (!assetId) return;
    try {
      const d = await api.post<any>(`/api/assets/${assetId}/comments`, {
        timePct: 30,
        timeStr: '00:25',
        text: newComment,
        author: user?.displayName || 'You',
        drawing: currentDrawing || undefined,
      });
      if (d.success) {
        setComments(prev => [...prev, {
          ...d.comment,
          drawing: d.comment.drawing ? JSON.parse(d.comment.drawing) : undefined,
        }]);
      }
    } catch (e) {
      console.error(e);
    }
    setNewComment('');
    setCurrentDrawing(null);
    setIsDrawingMode(false);
  };

  const toggleResolve = async (commentId: string, currentResolved: boolean) => {
    try {
      const d = await api.patch<any>(`/api/comments/${commentId}/resolve`, { resolved: !currentResolved });
      if (d.success) {
        setComments(prev => prev.map(c => c.id === commentId ? { ...c, resolved: !currentResolved } : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const showFreeframe = freeframeMode && !!FREEFRAME_URL && !iframeError;

  return (
    <div className="flex h-full w-full bg-[var(--bg)] text-[var(--text-main)] overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-[var(--border)] flex-col hidden md:flex shrink-0 bg-[var(--surface)]">
        <div className="p-4 border-b border-[var(--border)] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('review')}
              className="p-1 hover:bg-[var(--hover-bg)] rounded-md transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
              title="Close Workspace"
            >
              <X size={16} weight="bold" />
            </button>
            <h2 className="font-semibold text-sm">FreeFrame Engine</h2>
          </div>
          <button className="text-[var(--text-muted)] hover:text-[var(--text-main)]"><Plus size={16} /></button>
        </div>

        <div className="p-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs mb-3">
            <strong className="text-blue-700 dark:text-blue-400 block mb-1">Open Source Beta</strong>
            <p className="text-[var(--text-muted)] leading-relaxed">
              This Editor uses <a href="https://github.com/Techiebutler/freeframe" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline font-semibold hover:text-blue-500">FreeFrame</a>, the open-source alternative to Frame.io.
            </p>
          </div>
          <button className="w-full bg-[var(--text-main)] hover:opacity-90 text-[var(--bg)] text-xs font-semibold py-2 rounded-md shadow-sm transition-opacity flex items-center justify-center gap-2">
            NEW
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2 py-2 mt-2">Folders</div>
          <button className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--hover-bg)] flex items-center gap-2 text-xs font-medium text-[var(--text-main)]">
            <Folder size={16} className="text-gray-400" weight="fill" /> Review Links
          </button>
          <button className="w-full text-left px-2 py-1.5 rounded-md hover:bg-[var(--hover-bg)] flex items-center gap-2 text-xs font-medium text-[var(--text-main)]">
            <Folder size={16} className="text-gray-400" weight="fill" /> Presentations
          </button>
          <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-2 py-2 mt-4">Files</div>
          <button className="w-full text-left px-2 py-1.5 rounded-md bg-[var(--hover-bg)] flex items-center gap-2 text-xs font-medium text-blue-600 dark:text-blue-400">
            <FilmStrip size={16} weight="fill" /> Final_Cut_V2.mp4
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative bg-[var(--bg)]">
        {/* Header */}
        <div className="h-14 border-b border-[var(--border)] flex items-center justify-between px-4 shrink-0 bg-[var(--surface)]">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold text-[var(--text-main)]">Final_Cut_V2.mp4</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/30">Needs Review</span>
          </div>

          <div className="flex items-center gap-2">
            {/* FreeFrame toggle */}
            {FREEFRAME_URL && (
              <button
                onClick={() => { setFreeframeMode(!freeframeMode); setIframeError(false); }}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors flex items-center gap-1.5 ${freeframeMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[var(--hover-bg)] border-[var(--border)] hover:bg-gray-200 dark:hover:bg-gray-800 text-[var(--text-main)]'}`}
                title={freeframeMode ? 'Switch to native player' : 'Open in FreeFrame'}
              >
                <FrameCorners size={14} />
                FreeFrame
              </button>
            )}
            {freeframeMode && FREEFRAME_URL && (
              <a
                href={FREEFRAME_URL}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                title="Open FreeFrame in new tab"
              >
                <ArrowSquareOut size={16} />
              </a>
            )}
            <button className="px-3 py-1.5 rounded-full bg-[var(--hover-bg)] border border-[var(--border)] hover:bg-gray-200 dark:hover:bg-gray-800 text-[var(--text-main)] text-xs font-semibold transition-colors flex items-center gap-2">
              <ShareNetwork size={14} /> Share
            </button>
            <button className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-600 border border-green-200 dark:border-green-500 text-green-700 dark:text-white text-xs font-semibold hover:bg-green-200 dark:hover:bg-green-500 transition-colors flex items-center gap-2">
              <Check size={14} weight="bold" /> Approved
            </button>
            <button className="text-[var(--text-muted)] hover:text-[var(--text-main)] ml-2"><DotsThreeCircle size={20} /></button>
          </div>
        </div>

        {/* Player / FreeFrame */}
        <div className="flex-1 relative overflow-hidden">
          {showFreeframe ? (
            <iframe
              ref={iframeRef}
              src={FREEFRAME_URL}
              className="absolute inset-0 w-full h-full border-0"
              allow="camera; microphone; fullscreen; clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
              title="FreeFrame Video Review"
              onLoad={sendAuthToFreeframe}
              onError={() => setIframeError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 bg-gray-100 dark:bg-[#111]">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
              <div
                ref={videoPlayerRef}
                className="w-full max-w-5xl aspect-video bg-black rounded-lg border border-[var(--border)] relative overflow-hidden shadow-2xl flex items-center justify-center group z-10 isolate"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={() => {}}
                onPointerLeave={() => {}}
                style={{ touchAction: 'none' }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/60 to-black mix-blend-overlay" />
                <PlayCircle size={64} className="text-white/40 group-hover:text-white/80 transition-colors z-10 cursor-pointer drop-shadow-lg" weight="fill" />

                <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                  {comments.filter(c => c.drawing).map(c => (
                    <polyline
                      key={c.id}
                      points={c.drawing?.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={c.drawing?.color}
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                      className="opacity-60 drop-shadow-md"
                    />
                  ))}
                  {currentDrawing && (
                    <polyline
                      points={currentDrawing.points.map(p => `${p.x},${p.y}`).join(' ')}
                      fill="none"
                      stroke={currentDrawing.color}
                      strokeWidth="3"
                      vectorEffect="non-scaling-stroke"
                    />
                  )}
                </svg>

                <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 to-transparent flex flex-col gap-3 z-30">
                  <div className="h-1 w-full bg-white/20 rounded-full cursor-pointer relative group/timeline hover:h-2 transition-all">
                    <div className="absolute top-0 left-0 h-full bg-blue-500 rounded-full" style={{ width: '30%' }} />
                    {comments.map((c, i) => (
                      <div
                        key={c.id || i}
                        className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 group-hover/timeline:w-3 group-hover/timeline:h-3 rounded-full bg-yellow-400 hover:scale-125 hover:bg-white transition-all shadow-sm border border-black/20 cursor-pointer"
                        style={{ left: `${c.timePct}%` }}
                        title={c.text}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-white/90 font-medium">
                    <div className="flex items-center gap-3">
                      <PlayCircle size={20} className="hover:text-white cursor-pointer" weight="fill" />
                      <span>00:25 / 01:45</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setIsDrawingMode(!isDrawingMode)}
                        className={`transition-colors flex items-center justify-center p-1.5 rounded ${isDrawingMode ? 'bg-[#FF3366] text-white shadow-md' : 'hover:bg-white/20 hover:text-white'}`}
                        title="Draw Annotation (D)"
                      >
                        <PenNib size={16} />
                      </button>
                      <button className="hover:text-white transition-colors uppercase text-[10px] font-bold tracking-wider bg-black/40 px-2 py-1 rounded">1080p</button>
                      <button className="hover:text-white transition-colors p-1 bg-black/40 rounded"><Eye size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* FreeFrame not configured notice */}
              {!FREEFRAME_URL && (
                <p className="mt-4 text-xs text-[var(--text-muted)] text-center z-10">
                  Set <code className="bg-[var(--surface)] px-1 rounded">VITE_FREEFRAME_URL</code> to enable the full FreeFrame review experience.
                </p>
              )}
              {iframeError && (
                <p className="mt-4 text-xs text-red-500 text-center z-10">
                  Could not connect to FreeFrame at <code className="bg-[var(--surface)] px-1 rounded">{FREEFRAME_URL}</code>. Using native player.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Comments */}
      <div className="w-80 border-l border-[var(--border)] flex flex-col shrink-0 bg-[var(--surface)]">
        <div className="flex p-3 border-b border-[var(--border)] gap-1">
          <button
            onClick={() => setActiveTab('comments')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded border ${activeTab === 'comments' ? 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-main)] shadow-sm' : 'border-transparent bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)]'}`}
          >
            Comments
          </button>
          <button
            onClick={() => setActiveTab('versions')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wide rounded border ${activeTab === 'versions' ? 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-main)] shadow-sm' : 'border-transparent bg-transparent text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)]'}`}
          >
            Versions (2)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-[var(--bg)]">
          {comments.map(c => (
            <div key={c.id} className={`p-4 rounded-xl border ${c.resolved ? 'border-[var(--border)] bg-[var(--surface)] opacity-60' : 'border-[var(--border)] bg-[var(--surface)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/5 dark:ring-white/5'}`}>
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex items-center gap-2">
                  <UserCircle size={28} className="text-gray-400" weight="duotone" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[var(--text-main)]">{c.author}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">Recently</span>
                  </div>
                </div>
                <span className="px-1.5 py-0.5 rounded text-blue-700 bg-blue-100 border border-blue-200 dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20 text-[10px] font-mono cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors">
                  {c.timeStr}
                </span>
              </div>
              <p className="text-sm text-[var(--text-main)] leading-relaxed mt-2">{c.text}</p>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-2">
                <button className="text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase tracking-wider transition-colors">Reply</button>
                {!c.resolved ? (
                  <button
                    onClick={() => toggleResolve(c.id, c.resolved)}
                    className="w-5 h-5 rounded-full border border-[var(--border)] flex items-center justify-center hover:bg-green-100 hover:border-green-300 dark:hover:bg-green-500/20 dark:hover:border-green-500 text-transparent transition-colors group/btn"
                  >
                    <Check size={12} weight="bold" className="text-transparent group-hover/btn:text-green-600 dark:group-hover/btn:text-green-400" />
                  </button>
                ) : (
                  <button onClick={() => toggleResolve(c.id, c.resolved)} className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 font-medium hover:text-green-500 transition-colors">
                    <Check size={14} weight="bold" /> Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="relative shadow-sm rounded-xl overflow-hidden ring-1 ring-[var(--border)] focus-within:ring-2 focus-within:ring-blue-500 transition-all bg-[var(--bg)]">
            <textarea
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Leave a comment at 00:25..."
              className="w-full bg-transparent border-0 p-3 pb-10 text-sm text-[var(--text-main)] placeholder-[var(--text-muted)] resize-none h-24 focus:ring-0 focus:outline-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
              }}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <button
                onClick={() => setIsDrawingMode(!isDrawingMode)}
                className={`p-1.5 rounded-full transition-colors ${isDrawingMode || currentDrawing ? 'bg-[#FF3366] text-white shadow-sm' : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)]'}`}
                title="Draw"
              >
                <PenNib size={14} weight="fill" />
              </button>
              <button
                onClick={submitComment}
                disabled={!newComment.trim() && !currentDrawing}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-md text-xs font-bold tracking-wide transition-colors shadow-sm"
              >
                SEND
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-[10px] text-[var(--text-muted)] mt-3 uppercase tracking-widest font-semibold flex-wrap">
            <span>Pro Tip: Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-[var(--hover-bg)] border border-[var(--border)] shadow-sm font-sans font-bold">D</kbd>
            <span>to Draw</span>
          </div>
        </div>
      </div>
    </div>
  );
}
