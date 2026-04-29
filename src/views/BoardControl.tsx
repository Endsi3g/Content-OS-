import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { TerminalWindow, PlayCircle, StopCircle, Gear, WarningCircle, CheckCircle, Bug, Trash } from '@phosphor-icons/react';
import { useAppStore } from '../store';

export function BoardControl() {
  const [logs, setLogs] = useState<{ id: string, time: string, message: string, type: 'info' | 'error' | 'success' | 'ai' }[]>([
    { id: '1', time: new Date().toLocaleTimeString(), message: 'Board Control Interface initialized.', type: 'info' },
    { id: '2', time: new Date().toLocaleTimeString(), message: 'Connected to Playwright worker #1.', type: 'info' },
  ]);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [command, setCommand] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  
  const endOfLogsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfLogsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, isAiThinking]);

  const addLog = (message: string, type: 'info' | 'error' | 'success' | 'ai' = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), time: new Date().toLocaleTimeString(), message, type }]);
  };

  const handleRunTests = () => {
    if (isTestRunning) return;
    setIsTestRunning(true);
    addLog('Starting end-to-end test suite...', 'info');
    
    setTimeout(() => addLog('Testing workflow creation...', 'info'), 1000);
    setTimeout(() => addLog('Testing clip review save mechanism...', 'info'), 2500);
    setTimeout(() => addLog('Error in review save: element not found.', 'error'), 3500);
    setTimeout(() => addLog('Claude terminal notified of failure.', 'info'), 4000);
    setTimeout(() => {
      setIsTestRunning(false);
      addLog('Test suite completed with 1 error.', 'error');
      
      // Simulate Claude helping out
      setTimeout(() => {
        addLog('Claude is analyzing the error log...', 'ai');
        setIsAiThinking(true);
        setTimeout(() => {
          setIsAiThinking(false);
          addLog('I noticed the review save button is missing an ID. I recommend adding id="save-review-btn" to the UI component.', 'ai');
        }, 2000);
      }, 1000);
    }, 4500);
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    addLog(`> ${command}`, 'info');
    setCommand('');
    
    setIsAiThinking(true);
    setTimeout(() => {
      setIsAiThinking(false);
      addLog(`Executing: ${command}. The system is running in simulated sandboxed mode.`, 'ai');
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-5xl h-[80vh] flex flex-col bg-[var(--surface)] border border-[var(--border)] shadow-xl rounded-xl overflow-hidden">
        
        {/* Header */}
        <div className="h-14 shrink-0 border-b border-[var(--border)] bg-[var(--bg)] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <TerminalWindow size={24} weight="fill" className="text-[var(--text-main)]" />
            <span className="font-bold tracking-tight text-[var(--text-main)] text-lg">Board Control</span>
            <span className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-500 border border-red-500/20 font-mono ml-2">RESTRICTED ACCESS</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRunTests}
              disabled={isTestRunning}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isTestRunning ? 'bg-[var(--hover-bg)] text-[var(--text-muted)] cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isTestRunning ? <StopCircle size={18} /> : <PlayCircle size={18} />}
              {isTestRunning ? 'Running Tests...' : 'Run E2E Tests'}
            </button>
            <button className="p-2 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors rounded-md hover:bg-[var(--hover-bg)]">
              <Gear size={20} />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="grid grid-cols-4 border-b border-[var(--border)] bg-[var(--bg)]">
          <div className="p-4 border-r border-[var(--border)] flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">System Status</span>
            <div className="flex items-center gap-2 text-[var(--text-main)] font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500" /> Operational
            </div>
          </div>
          <div className="p-4 border-r border-[var(--border)] flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Playwright</span>
            <div className="flex items-center gap-2 text-[var(--text-main)] font-medium">
               {isTestRunning ? (
                 <><div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" /> Active</>
               ) : (
                 <><div className="w-2 h-2 rounded-full bg-green-500" /> Idle</>
               )}
            </div>
          </div>
          <div className="p-4 border-r border-[var(--border)] flex flex-col gap-1">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Claude Instance</span>
            <div className="flex items-center gap-2 text-[var(--text-main)] font-medium">
              <div className="w-2 h-2 rounded-full bg-blue-500" /> Connected
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
             <div className="flex flex-col gap-1">
                <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-semibold">Errors</span>
                <div className="flex items-center gap-2 text-red-500 font-medium">
                  <Bug size={16} /> 0 pending
                </div>
             </div>
             <button onClick={() => setLogs([])} className="text-[var(--text-muted)] hover:text-[var(--text-main)]" title="Clear Logs">
                <Trash size={18} />
             </button>
          </div>
        </div>

        {/* Terminal Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#0d1117] text-[#e6edf3] font-mono text-sm">
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="text-gray-500 shrink-0 select-none">[{log.time}]</span>
                <span className={`
                  ${log.type === 'error' ? 'text-red-400' : ''}
                  ${log.type === 'success' ? 'text-green-400' : ''}
                  ${log.type === 'ai' ? 'text-blue-400 font-medium' : ''}
                `}>
                  {log.message}
                </span>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex items-start gap-3">
                <span className="text-gray-500 shrink-0 select-none">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-blue-400 font-medium flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Gear size={14} />
                  </motion.div>
                  Claude is thinking...
                </span>
              </div>
            )}
            <div ref={endOfLogsRef} />
          </div>

          {/* Command Input */}
          <form onSubmit={handleCommandSubmit} className="shrink-0 border-t border-gray-800 p-2 bg-[#010409] flex items-center gap-2">
            <span className="text-blue-400 pl-2 font-bold">{'>'}</span>
            <input 
              type="text" 
              className="flex-1 bg-transparent border-none outline-none text-[#e6edf3] font-mono px-2 py-1 placeholder:text-gray-600"
              placeholder="Enter command or ask Claude..."
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={isAiThinking}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
