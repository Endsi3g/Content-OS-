import { useState } from 'react';
import { useAppStore } from '../store';
import { useElectron } from '../hooks/useElectron';
import { t } from '../i18n';
import { Globe, GoogleDriveLogo, ChartLineUp, CheckCircle, CircleNotch as Spinner, Scissors, User, Robot, Key, Video, Bug } from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ScrollReveal } from '../components/ScrollReveal';
import { ColorSchemeSelector } from '../components/ColorSchemeSelector';
import { ProfileSettings } from '../components/ProfileSettings';

export function Settings() {
  const { language, setLanguage, isMetricoolConnected, setIsMetricoolConnected } = useAppStore();
  const { openVideoFiles, ffmpeg } = useElectron();
  
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [isDriveConnected, setIsDriveConnected] = useState(true); // Mock initial state
  
  const [isConnectingMetricool, setIsConnectingMetricool] = useState(false);

  const [isConnectingOpus, setIsConnectingOpus] = useState(false);
  const [isOpusConnected, setIsOpusConnected] = useState(false);

  const [isConnectingClaude, setIsConnectingClaude] = useState(false);
  const [isClaudeConnected, setIsClaudeConnected] = useState(false);

  const [openclawKey, setOpenclawKey] = useState<string | null>(null);

  const handleConnectDrive = () => {
    if (isDriveConnected) {
      setIsDriveConnected(false);
      toast.success(language === 'fr' ? 'Google Drive déconnecté' : 'Google Drive disconnected');
      return;
    }
    
    setIsConnectingDrive(true);
    // Simulate OAuth flow
    setTimeout(() => {
      setIsConnectingDrive(false);
      setIsDriveConnected(true);
      toast.success(language === 'fr' ? 'Google Drive connecté avec succès' : 'Google Drive connected successfully');
    }, 1500);
  };

  const handleConnectMetricool = () => {
    if (isMetricoolConnected) {
      setIsMetricoolConnected(false);
      toast.success(language === 'fr' ? 'Metricool déconnecté' : 'Metricool disconnected');
      return;
    }

    setIsConnectingMetricool(true);
    // Simulate OAuth flow
    setTimeout(() => {
      setIsConnectingMetricool(false);
      setIsMetricoolConnected(true);
      toast.success(language === 'fr' ? 'Metricool connecté avec succès' : 'Metricool connected successfully');
    }, 1500);
  };

  const handleConnectOpus = () => {
    if (isOpusConnected) {
      setIsOpusConnected(false);
      toast.success(language === 'fr' ? 'Opus Clip déconnecté' : 'Opus Clip disconnected');
      return;
    }

    setIsConnectingOpus(true);
    // Simulate OAuth flow
    setTimeout(() => {
      setIsConnectingOpus(false);
      setIsOpusConnected(true);
      toast.success(language === 'fr' ? 'Opus Clip connecté avec succès' : 'Opus Clip connected successfully');
    }, 1500);
  };

  const handleConnectClaude = () => {
    if (isClaudeConnected) {
      setIsClaudeConnected(false);
      toast.success(language === 'fr' ? 'Claude API déconnecté' : 'Claude API disconnected');
      return;
    }

    setIsConnectingClaude(true);
    // Simulate API connect
    setTimeout(() => {
      setIsConnectingClaude(false);
      setIsClaudeConnected(true);
      toast.success(language === 'fr' ? 'Claude API connecté' : 'Claude API connected');
    }, 1500);
  };

  const handleGenerateOpenclawKey = () => {
    // Generate a mock secure key
    const newKey = 'oc_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setOpenclawKey(newKey);
    toast.success(language === 'fr' ? 'Clé API Openclaw générée pour le rôle "ai_agent"' : 'Openclaw API Key generated for "ai_agent" role.');
  };
  
  const [ffmpegTestResult, setFfmpegTestResult] = useState<{
    codec?: string;
    duration?: number;
    thumbnail?: string;
  } | null>(null);
  const [isTestingFFmpeg, setIsTestingFFmpeg] = useState(false);

  const handleTestFFmpeg = async () => {
    if (!ffmpeg || !openVideoFiles) {
      toast.error('FFmpeg engine not available in this environment');
      return;
    }

    try {
      const files = await openVideoFiles([{ name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv'] }]);
      if (!files || files.length === 0) return;

      const testPath = files[0];
      setIsTestingFFmpeg(true);
      setFfmpegTestResult(null);
      
      toast.info('Analyzing video file...');
      const result = await ffmpeg.probe({ inputPath: testPath });
      
      if (result.success) {
        toast.success(`FFmpeg Engine OK: ${result.video?.codec || 'N/A'} detected`);
        
        // Try to generate a thumbnail to test write capability
        toast.info('Generating test thumbnail...');
        // We'll try to generate it in a temporary location or just a .jpg next to the file
        const thumbPath = testPath.replace(/\.[^/.]+$/, "") + "_test_thumb.jpg";
        const thumbResult = await ffmpeg.thumbnail({ 
          inputPath: testPath, 
          outputPath: thumbPath,
          timestamp: '00:00:01'
        });

        setFfmpegTestResult({
          codec: result.video?.codec,
          duration: result.duration,
          thumbnail: thumbResult.success ? thumbPath : undefined
        });
        
        if (thumbResult.success) {
          toast.success('Thumbnail generated successfully!');
        }
      } else {
        toast.error(`FFmpeg Engine Error: ${result.error}`);
      }
    } catch (e: any) {
      toast.error(`Test failed: ${e.message}`);
    } finally {
      setIsTestingFFmpeg(false);
    }
  };

  const handleTestSentry = () => {
    toast.info('Triggering test exception in Sentry...');
    try {
      throw new Error('Sentry Diagnostic Test - Content OS');
    } catch (e) {
      // In renderer, Sentry is already initialized
      import('@sentry/electron/renderer').then(Sentry => {
        Sentry.captureException(e);
        toast.success('Exception captured and sent to Sentry.');
      });
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-12 max-w-4xl mx-auto w-full">
      <ScrollReveal delay={0}>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-main)] mb-1">
            {t('settings.title', language)}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {t('settings.description', language)}
          </p>
        </div>
      </ScrollReveal>

      <div className="space-y-8">
        {/* Profile Section */}
        <ScrollReveal delay={0.05}>
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6">
              <User size={24} className="text-[var(--text-muted)]" />
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Profile</h2>
            </div>
            <ProfileSettings />
          </section>
        </ScrollReveal>

        {/* Language Section */}
        <ScrollReveal delay={0.1}>
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6">
              <Globe size={24} className="text-[var(--text-muted)]" />
              <h2 className="text-lg font-semibold text-[var(--text-main)]">{t('settings.language', language)}</h2>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                  language === 'en' 
                    ? 'bg-gray-100 border-gray-300 text-[var(--text-main)]' 
                    : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-gray-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('fr')}
                className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                  language === 'fr' 
                    ? 'bg-gray-100 border-gray-300 text-[var(--text-main)]' 
                    : 'bg-transparent border-[var(--border)] text-[var(--text-muted)] hover:border-gray-300'
                }`}
              >
                Français
              </button>
            </div>
          </section>
        </ScrollReveal>

        {/* Integrations Section */}
        <ScrollReveal delay={0.2}>
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <h2 className="text-lg font-semibold text-[var(--text-main)] mb-6">{t('settings.integrations', language)}</h2>
            
            <div className="space-y-4">
            {/* Google Drive */}
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--hover-bg)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                  <GoogleDriveLogo size={20} className="text-[var(--text-main)]" weight="regular" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-main)]">{t('settings.googleDrive', language)}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t('settings.googleDriveDesc', language)}</p>
                </div>
              </div>
              <button 
                onClick={handleConnectDrive}
                disabled={isConnectingDrive}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors group ${
                  isDriveConnected 
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' 
                    : 'bg-[var(--text-main)] text-[var(--bg)] hover:bg-[#333333]'
                }`}
              >
                {isConnectingDrive ? (
                  <Spinner size={14} className="animate-spin" />
                ) : isDriveConnected ? (
                  <>
                    <CheckCircle size={14} weight="fill" className="group-hover:hidden" />
                    <span className="group-hover:hidden">{t('settings.connected', language)}</span>
                    <span className="hidden group-hover:inline">{language === 'fr' ? 'Déconnecter' : 'Disconnect'}</span>
                  </>
                ) : (
                  t('settings.connect', language)
                )}
              </button>
            </div>

            {/* Metricool */}
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--hover-bg)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                  <ChartLineUp size={20} className="text-[var(--text-main)]" weight="regular" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-main)]">{t('settings.metricool', language)}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t('settings.metricoolDesc', language)}</p>
                </div>
              </div>
              <button 
                onClick={handleConnectMetricool}
                disabled={isConnectingMetricool}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors group ${
                  isMetricoolConnected 
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' 
                    : 'bg-[var(--text-main)] text-[var(--bg)] hover:bg-[#333333]'
                }`}
              >
                {isConnectingMetricool ? (
                  <Spinner size={14} className="animate-spin" />
                ) : isMetricoolConnected ? (
                  <>
                    <CheckCircle size={14} weight="fill" className="group-hover:hidden" />
                    <span className="group-hover:hidden">{t('settings.connected', language)}</span>
                    <span className="hidden group-hover:inline">{language === 'fr' ? 'Déconnecter' : 'Disconnect'}</span>
                  </>
                ) : (
                  t('settings.connect', language)
                )}
              </button>
            </div>

            {/* Opus Clip */}
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--hover-bg)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                  <Scissors size={20} className="text-[var(--text-main)]" weight="regular" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-main)]">{t('settings.opusClip', language)}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t('settings.opusClipDesc', language)}</p>
                </div>
              </div>
              <button 
                onClick={handleConnectOpus}
                disabled={isConnectingOpus}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors group ${
                  isOpusConnected 
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' 
                    : 'bg-[var(--text-main)] text-[var(--bg)] hover:bg-[#333333]'
                }`}
              >
                {isConnectingOpus ? (
                  <Spinner size={14} className="animate-spin" />
                ) : isOpusConnected ? (
                  <>
                    <CheckCircle size={14} weight="fill" className="group-hover:hidden" />
                    <span className="group-hover:hidden">{t('settings.connected', language)}</span>
                    <span className="hidden group-hover:inline">{language === 'fr' ? 'Déconnecter' : 'Disconnect'}</span>
                  </>
                ) : (
                  t('settings.connect', language)
                )}
              </button>
            </div>

            {/* Claude API */}
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--hover-bg)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                  <Robot size={20} className="text-[var(--text-main)]" weight="regular" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-main)]">{t('settings.claudeApi', language)}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t('settings.claudeApiDesc', language)}</p>
                </div>
              </div>
              <button 
                onClick={handleConnectClaude}
                disabled={isConnectingClaude}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors group ${
                  isClaudeConnected 
                    ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200' 
                    : 'bg-[var(--text-main)] text-[var(--bg)] hover:bg-[#333333]'
                }`}
              >
                {isConnectingClaude ? (
                  <Spinner size={14} className="animate-spin" />
                ) : isClaudeConnected ? (
                  <>
                    <CheckCircle size={14} weight="fill" className="group-hover:hidden" />
                    <span className="group-hover:hidden">{t('settings.connected', language)}</span>
                    <span className="hidden group-hover:inline">{language === 'fr' ? 'Déconnecter' : 'Disconnect'}</span>
                  </>
                ) : (
                  t('settings.connect', language)
                )}
              </button>
            </div>

            {/* Openclaw API Access */}
            <div className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--hover-bg)] border border-[var(--border)] rounded-lg flex items-center justify-center">
                  <Key size={20} className="text-[var(--text-main)]" weight="regular" />
                </div>
                <div className="flex-1 max-w-sm">
                  <h3 className="text-sm font-medium text-[var(--text-main)]">{t('settings.openclaw', language)}</h3>
                  <p className="text-xs text-[var(--text-muted)]">{t('settings.openclawDesc', language)}</p>
                  {openclawKey && (
                    <div 
                      className="mt-2 text-xs bg-[var(--hover-bg)] border border-[var(--border)] p-2 rounded text-[var(--text-main)] font-mono break-all cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(openclawKey);
                        toast.success(language === 'fr' ? 'Clé copiée' : 'Key copied');
                      }}
                    >
                       {openclawKey}
                    </div>
                  )}
                </div>
              </div>
              <button 
                onClick={handleGenerateOpenclawKey}
                className={`flex shrink-0 items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100`}
              >
                 {t('settings.generateKey', language)}
              </button>
            </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Color Scheme Section */}
        <ScrollReveal delay={0.3}>
          <ColorSchemeSelector />
        </ScrollReveal>

        {/* Diagnostics Section */}
        <ScrollReveal delay={0.4}>
          <section className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6">
              <ChartLineUp size={24} className="text-[var(--text-muted)]" />
              <h2 className="text-lg font-semibold text-[var(--text-main)]">Diagnostics</h2>
            </div>
            
            <div className="p-4 border border-[var(--border)] rounded-lg bg-yellow-50/30 border-yellow-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border border-yellow-200 rounded-lg flex items-center justify-center text-yellow-600">
                    <Video size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-900">FFmpeg Video Engine</h3>
                    <p className="text-xs text-yellow-700/70">Verify local rendering capabilities with real files.</p>
                  </div>
                </div>
                <button 
                  onClick={handleTestFFmpeg}
                  disabled={isTestingFFmpeg}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md text-xs font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50"
                >
                  {isTestingFFmpeg ? 'Testing...' : 'Run Test'}
                </button>
              </div>
              
              {ffmpegTestResult && (
                <div className="mt-4 flex gap-4 p-3 bg-white/50 rounded-lg border border-yellow-200/50 animate-in fade-in slide-in-from-top-2">
                  {ffmpegTestResult.thumbnail && (
                    <div className="w-32 aspect-video bg-black rounded overflow-hidden border border-black/10">
                       <img 
                         src={`file://${ffmpegTestResult.thumbnail}`} 
                         className="w-full h-full object-cover" 
                         alt="Thumbnail test" 
                         onError={(e) => {
                            // If direct file access is blocked by CSP, this might fail without protocol registration
                            (e.target as HTMLImageElement).src = 'https://placehold.co/320x180?text=Rendering+OK';
                         }}
                       />
                    </div>
                  )}
                  <div className="flex-1 text-xs space-y-1">
                    <p className="font-bold text-yellow-900">Result Details:</p>
                    <p className="text-yellow-800">Codec: <span className="font-mono">{ffmpegTestResult.codec || 'Unknown'}</span></p>
                    <p className="text-yellow-800">Duration: <span className="font-mono">{Math.round(ffmpegTestResult.duration || 0)}s</span></p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 border border-[var(--border)] rounded-lg bg-red-50/30 border-red-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white border border-red-200 rounded-lg flex items-center justify-center text-red-600">
                    <Bug size={20} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-red-900">Sentry Crash Reports</h3>
                    <p className="text-xs text-red-700/70">Test the error reporting pipeline.</p>
                  </div>
                </div>
                <button 
                  onClick={handleTestSentry}
                  className="px-4 py-2 bg-red-600 text-white rounded-md text-xs font-medium hover:bg-red-700 transition-colors"
                >
                  Trigger Crash
                </button>
              </div>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  );
}
