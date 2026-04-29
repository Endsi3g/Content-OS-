import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store';
import { FileText, Plus, Trash, PencilSimple, Users, WifiHigh, Circle } from '@phosphor-icons/react';
import { Bold, Italic, List, ListOrdered, Heading1 } from 'lucide-react';
import { ScrollReveal } from '../components/ScrollReveal';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import * as Y from 'yjs';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { HocuspocusProvider } from '@hocuspocus/provider';

function CollaborativeEditor({ script, assets, teamMembers, updateScript }: any) {
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [activeCollaborators, setActiveCollaborators] = useState<any[]>([]);

  useEffect(() => {
    // Determine websocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/collaboration`;

    const doc = new Y.Doc();
    
    // Connect to Hocuspocus/Yjs websocket
    const newProvider = new HocuspocusProvider({
      url,
      name: script.id,
      document: doc,
    });

    const userColor = ['#f783ac', '#8ce99a', '#74c0fc', '#ffd43b', '#b197fc'][Math.floor(Math.random() * 5)];
    const username = `User ${Math.floor(Math.random() * 100)}`;
    
    newProvider.setAwarenessField('user', {
      name: username,
      color: userColor,
    });

    newProvider.on('awarenessUpdate', () => {
      const states = newProvider.awareness.getStates();
      const users: any[] = [];
      states.forEach((state: any, clientId: number) => {
        if (state.user && clientId !== newProvider.awareness.clientID) {
          users.push(state.user);
        }
      });
      setActiveCollaborators(users);
    });

    setProvider(newProvider);

    return () => {
      newProvider.destroy();
    };
  }, [script.id]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your script here...',
      }),
      ...(provider ? [
        Collaboration.configure({
          document: provider.document,
        }),
        CollaborationCursor.configure({
          provider,
          user: provider.awareness.getLocalState()?.user,
        })
      ] : [])
    ],
    // content is handled by yjs
  }, [provider]);

  if (!provider || !editor) return (
     <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] animate-pulse">
        Connecting to collaborative session...
     </div>
  );

  return (
    <ScrollReveal delay={0} className="flex-1 flex flex-col h-full">
      <div className="p-6 border-b border-[var(--border)]">
        <input 
          type="text" 
          value={script.title}
          onChange={(e) => updateScript(script.id, { title: e.target.value })}
          className="flex-1 text-2xl font-bold bg-transparent outline-none text-[var(--text-main)] w-full"
          placeholder="Script Title..."
        />
        <div className="flex items-center gap-2 mt-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400 rounded-full mr-4 text-xs font-semibold border border-green-200 dark:border-green-500/20">
             <Circle className="animate-pulse" weight="fill" size={8} /> 
             Live Editing
             {activeCollaborators.length > 0 && (
               <div className="flex -space-x-2 ml-2">
                 {activeCollaborators.map((c, i) => (
                   <div key={i} className="w-5 h-5 rounded-full bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center justify-center text-[10px] font-bold text-[var(--text-main)]" style={{ backgroundColor: c.color, color: '#000' }}>
                     {c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full rounded-full" /> : c.name.charAt(0)}
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 text-sm text-[var(--text-muted)] px-6 py-4 border-b border-[var(--border)]">
        <label className="flex items-center gap-2">
            <span>Linked Asset:</span>
            <select 
              value={script.assetId || ''}
              onChange={(e) => updateScript(script.id, { assetId: e.target.value || undefined })}
              className="bg-transparent border-none outline-none font-medium cursor-pointer"
            >
              <option value="">None</option>
              {assets.map((a: any) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <span>Assignee:</span>
            <select 
              value={script.assigneeId || ''}
              onChange={(e) => updateScript(script.id, { assigneeId: e.target.value || undefined })}
              className="bg-transparent border-none outline-none font-medium cursor-pointer"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
        </div>

      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-1 bg-[var(--bg)]">
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded hover:bg-[var(--hover-bg)] ${editor.isActive('heading', { level: 1 }) ? 'text-[var(--text-main)] bg-[var(--hover-bg)]' : 'text-[var(--text-muted)]'}`}
        >
          <span className="font-bold text-sm">H1</span>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-[var(--hover-bg)] ${editor.isActive('heading', { level: 2 }) ? 'text-[var(--text-main)] bg-[var(--hover-bg)]' : 'text-[var(--text-muted)]'}`}
        >
          <span className="font-bold text-sm">H2</span>
        </button>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-[var(--hover-bg)] ${editor.isActive('bold') ? 'text-[var(--text-main)] bg-[var(--hover-bg)]' : 'text-[var(--text-muted)]'}`}
        >
          <Bold size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-[var(--hover-bg)] ${editor.isActive('italic') ? 'text-[var(--text-main)] bg-[var(--hover-bg)]' : 'text-[var(--text-muted)]'}`}
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-4 bg-[var(--border)] mx-1" />
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-[var(--hover-bg)] ${editor.isActive('bulletList') ? 'text-[var(--text-main)] bg-[var(--hover-bg)]' : 'text-[var(--text-muted)]'}`}
        >
          <List size={16} />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-[var(--hover-bg)] ${editor.isActive('orderedList') ? 'text-[var(--text-main)] bg-[var(--hover-bg)]' : 'text-[var(--text-muted)]'}`}
        >
          <ListOrdered size={16} />
        </button>
      </div>

      <div className="flex-1 p-6 overflow-y-auto prose dark:prose-invert max-w-none prose-p:my-1 text-[var(--text-main)]">
        <EditorContent editor={editor} className="min-h-full outline-none" />
      </div>
    </ScrollReveal>
  );
}

export function Scripts() {
  const { scripts, assets, teamMembers, addScript, updateScript, removeScript } = useAppStore();
  const [selectedScriptId, setSelectedScriptId] = useState<string | null>(null);

  const [backendScript, setBackendScript] = useState<{ id: string, title: string, content: string } | null>(null);
  
  const selectedScript = scripts.find(s => s.id === selectedScriptId) || (backendScript ? {
      id: backendScript.id,
      title: backendScript.title,
      content: backendScript.content,
      assetId: undefined,
      assigneeId: undefined,
      updatedAt: new Date().toISOString()
  } as any : null);

  useEffect(() => {
    // Fetch the latest script from the Prisma backend.
    fetch('/api/scripts/latest')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.script) {
          setBackendScript({
            id: data.script.id,
            title: 'Database Script',
            content: data.script.content,
          });
        }
      })
      .catch(console.error);
  }, []);

  const handleCreate = () => {
    addScript({
      title: 'New Script',
      content: ''
    });
  };

  return (
    <div className="flex h-full gap-6">
      {/* Sidebar List */}
      <div className="w-1/3 flex flex-col border border-[var(--border)] bg-[var(--surface)] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-sm font-semibold flex items-center gap-2 text-[var(--text-main)]">
            <FileText size={18} />
            Scripts
          </h2>
          <button 
            onClick={handleCreate}
            className="p-1.5 bg-[var(--hover-bg)] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            <Plus size={16} className="text-[var(--text-main)]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          <div>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-2">My Scripts</div>
            {scripts.map(script => (
              <button
                key={script.id}
                onClick={() => setSelectedScriptId(script.id)}
                className={`w-full text-left p-3 rounded-lg flex items-center justify-between group transition-colors ${
                  selectedScriptId === script.id ? 'bg-[var(--hover-bg)] text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-medium truncate">{script.title}</p>
                  <p className="text-xs opacity-70 truncate mt-0.5">{new Date(script.updatedAt).toLocaleDateString()}</p>
                </div>
                <div 
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-600 rounded-md transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeScript(script.id);
                    if (selectedScriptId === script.id) setSelectedScriptId(null);
                  }}
                >
                  <Trash size={14} />
                </div>
              </button>
            ))}
            {scripts.length === 0 && (
              <div className="p-6 text-center text-[var(--text-muted)] text-sm">
                No scripts yet. Create one!
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider px-2 py-2 flex items-center justify-between">
              <span>Team Scripts</span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
            </div>
            {/* Mock team scripts */}
            {teamMembers.slice(0, 2).map((member, i) => (
              <button
                key={`team-script-${i}`}
                onClick={() => {
                   // Generate a mock script just for viewing
                   setBackendScript({
                     id: `team-script-${i}`,
                     title: `${member.name}'s Narrative Draft`,
                     content: `<h1>${member.name}'s Narrative Draft</h1><p>This is a live collaborative script. Join in to edit together!</p>`
                   });
                   setSelectedScriptId(`team-script-${i}`);
                }}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${
                  selectedScriptId === `team-script-${i}` ? 'bg-[var(--hover-bg)] text-[var(--text-main)]' : 'text-[var(--text-muted)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-main)]'
                }`}
              >
                <div className="relative">
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full border border-[var(--border)]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {member.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-[var(--surface)] rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-sm font-medium truncate">{member.name}'s Narrative Draft</p>
                  <p className="text-xs opacity-70 truncate mt-0.5 flex items-center gap-1">
                    <WifiHigh size={12} className="text-green-500" /> Live editing
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 border border-[var(--border)] bg-[var(--surface)] flex flex-col rounded-xl overflow-hidden shadow-sm">
        {selectedScript ? (
          <CollaborativeEditor 
            key={selectedScript.id} 
            script={selectedScript} 
            assets={assets} 
            teamMembers={teamMembers} 
            updateScript={updateScript} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <div className="text-center">
              <FileText size={48} className="mx-auto mb-4 opacity-50" weight="duotone" />
              <p>Select a script or create a new one</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Required CSS to make TipTap look decent without huge setup */}
      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: var(--text-muted);
          pointer-events: none;
          height: 0;
        }
        .ProseMirror {
          outline: none;
          min-height: 100%;
          color: var(--text-main);
        }
        .ProseMirror p, .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, .ProseMirror h4, .ProseMirror ul, .ProseMirror ol, .ProseMirror li {
            color: var(--text-main) !important;
        }
        .collaboration-cursor__caret {
          position: relative;
          margin-left: -1px;
          margin-right: -1px;
          border-left: 2px solid #000;
          word-break: normal;
          pointer-events: none;
        }
        .collaboration-cursor__label {
          position: absolute;
          top: -1.4em;
          left: -1px;
          font-size: 11px;
          font-style: normal;
          font-weight: 600;
          line-height: normal;
          user-select: none;
          color: #000;
          padding: 1px 4px;
          border-radius: 4px;
          border-bottom-left-radius: 0;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

