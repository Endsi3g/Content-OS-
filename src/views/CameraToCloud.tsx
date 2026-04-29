import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CloudArrowUp, Camera, WifiHigh, CheckCircle, WarningCircle, 
  VideoCamera, FileVideo, Clock, HardDrives, X
} from '@phosphor-icons/react';
import { useAppStore } from '../store';
import { api } from '../lib/api';
import { ScrollReveal } from '../components/ScrollReveal';

interface Device {
  id: string;
  name: string;
  status: 'recording' | 'idle' | 'offline';
  battery: number;
  storage: number;
  lastActive: string;
}

function ConnectDeviceModal({ onClose, onConnect }: { onClose: () => void, onConnect: (device: Device) => void }) {
  const [code, setCode] = useState('');
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      onConnect({
        id: 'new-dev-' + Date.now(),
        name: code === 'ARRI' ? 'ARRI Alexa 35' : 'Camera ' + Math.floor(Math.random() * 1000),
        status: 'idle',
        battery: 100,
        storage: 2,
        lastActive: 'Just now'
      });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 shadow-2xl backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--surface)] text-[var(--text-main)] w-full max-w-sm rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <WifiHigh className="text-blue-500" />
            Connect Device
          </h3>
          <button onClick={onClose} className="p-1 text-[var(--text-muted)] hover:bg-[var(--hover-bg)] rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Enter the 6-digit pairing code displayed on your camera or proxy device.
          </p>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. A2B4C6"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-xl px-4 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 mb-6"
            maxLength={6}
          />
          <button
            onClick={handleConnect}
            disabled={code.length < 3 || connecting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {connecting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Device'
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export function CameraToCloud() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [uploads, setUploads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [devData, upData] = await Promise.all([
          api.get<any>('/api/c2c/devices'),
          api.get<any>('/api/c2c/uploads')
        ]);
        
        if (devData.success) setDevices(devData.devices);
        if (upData.success) {
          // map to match UI fields
          setUploads(upData.uploads.map((u: any) => ({
            id: u.id,
            name: u.name,
            source: u.device?.name || 'Unknown',
            size: u.size,
            status: u.status,
            progress: u.progress
          })));
        }
      } catch (e) {
        console.error('Failed to fetch C2C data:', e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();

    // Poll every 5 seconds for updates
    const pollInterval = setInterval(fetchData, 5000);

    return () => clearInterval(pollInterval);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-12">
      <ScrollReveal>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] flex items-center gap-2 mb-1">
              <CloudArrowUp size={28} className="text-blue-500" weight="duotone" />
              Camera to Cloud
            </h1>
            <p className="text-sm text-[var(--text-muted)]">Live proxy uploads from set directly into your workspace.</p>
          </div>
          <button 
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2 text-sm cursor-pointer"
            onClick={() => setIsConnectModalOpen(true)}
          >
            <WifiHigh size={18} /> Connect New Device
          </button>
        </div>
      </ScrollReveal>

      <AnimatePresence>
        {isConnectModalOpen && (
          <ConnectDeviceModal 
            onClose={() => setIsConnectModalOpen(false)} 
            onConnect={(newDevice) => {
              setDevices(prev => [newDevice, ...prev]);
              setIsConnectModalOpen(false);
            }} 
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Connected Devices */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2 mb-4">
            <Camera size={20} weight="duotone" className="text-gray-500" /> Connected Devices
          </h2>
          <div className="space-y-3">
            {loading ? (
               <div className="text-sm text-[var(--text-muted)] p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-sm">Loading devices...</div>
            ) : devices.map(device => (
              <div key={device.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-colors hover:border-gray-300 dark:hover:border-gray-600">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-[var(--text-main)]">{device.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                      <Clock size={12} /> Last seen: {device.lastActive}
                    </p>
                  </div>
                  <div className={`px-2 py-1 flex items-center gap-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    device.status === 'recording' ? 'bg-red-50 text-red-600 border border-red-200 dark:bg-red-500/10 dark:border-red-500/20' :
                    device.status === 'idle' ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:border-green-500/20' :
                    'bg-gray-50 text-gray-600 border border-gray-200 dark:bg-gray-500/10 dark:border-gray-500/20'
                  }`}>
                    {device.status === 'recording' && <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>}
                    {device.status}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-[var(--border)] border-dashed">
                   <div>
                     <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold block mb-1">Battery</span>
                     <span className={`text-sm font-semibold flex items-center gap-1 ${device.battery < 20 ? 'text-red-500' : 'text-[var(--text-main)]'}`}>
                       {device.battery}%
                     </span>
                   </div>
                   <div>
                     <span className="text-[10px] uppercase text-[var(--text-muted)] font-bold block mb-1">Storage</span>
                     <span className="text-sm font-semibold text-[var(--text-main)] flex items-center gap-1">
                       <HardDrives size={14} className="text-gray-400" /> {device.storage}%
                     </span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Uploads */}
        <div className="lg:col-span-2 space-y-4">
           <h2 className="text-lg font-semibold text-[var(--text-main)] flex items-center gap-2 mb-4">
            <VideoCamera size={20} weight="duotone" className="text-gray-500" /> Live Transfers
          </h2>
          
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="p-4 border-b border-[var(--border)] grid grid-cols-12 gap-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider bg-[var(--hover-bg)]">
               <div className="col-span-6">File Name</div>
               <div className="col-span-3">Source</div>
               <div className="col-span-3 text-right">Status</div>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {loading ? (
                <div className="p-8 text-sm text-[var(--text-muted)] flex justify-center">Loading uploads...</div>
              ) : uploads.length === 0 ? (
                <div className="p-8 text-sm text-[var(--text-muted)] text-center">No recent uploads</div>
              ) : uploads.map(file => (
                <div key={file.id} className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-[var(--hover-bg)] transition-colors">
                  <div className="col-span-6 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
                      <FileVideo size={20} className="text-blue-500" weight="duotone" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-main)] truncate" title={file.name}>{file.name}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">{file.size}</p>
                    </div>
                  </div>
                  <div className="col-span-3 text-sm text-[var(--text-muted)] truncate flex items-center gap-2">
                    <Camera size={14} /> {file.source}
                  </div>
                  <div className="col-span-3 flex flex-col items-end justify-center gap-1.5 w-full">
                    {file.status === 'uploading' ? (
                      <div className="w-full flex flex-col items-end">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">{file.progress}%</span>
                        <div className="w-full max-w-[100px] bg-blue-100 dark:bg-blue-900/30 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${file.progress}%` }}></div>
                        </div>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10 px-2.5 py-1 rounded-full">
                        <CheckCircle size={14} weight="fill" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

