

import React, { useState, useCallback, useEffect, useRef, DragEvent } from 'react';
import { LogEntry, LogStatus } from './types';
import Logo from './components/Logo';
import ToggleSwitch from './components/ToggleSwitch';
import DeploymentOptionCard from './components/DeploymentOptionCard';
import ChipIcon from './components/icons/ChipIcon';
import ServerIcon from './components/icons/ServerIcon';
import CloudUploadIcon from './components/icons/CloudUploadIcon';
import SpinnerIcon from './components/icons/SpinnerIcon';
import CheckCircleIcon from './components/icons/CheckCircleIcon';
import XCircleIcon from './components/icons/XCircleIcon';
import InformationCircleIcon from './components/icons/InformationCircleIcon';
import UploadIcon from './components/icons/UploadIcon';
import DocumentIcon from './components/icons/DocumentIcon';
import BrainIcon from './components/icons/BrainIcon';
import DataAnalyzer from './components/DataAnalyzer';
import UpdateModal from './components/UpdateModal';
import LoginScreen from './components/LoginScreen';

// Base64 encoded alert sound to keep the app self-contained
const ALERT_SOUND_URI = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
const GITHUB_REPO_URL = "https://api.github.com/repos/mvsdal/PhantomV-VeilSync/commits/main";
const UPDATE_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSessionPersistent, setIsSessionPersistent] = useState(false);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [pastedContent, setPastedContent] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageData, setImageData] = useState<{ url: string; base64: string; mimeType: string; name: string; } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  
  // State for the auto-update feature
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [snoozeUntil, setSnoozeUntil] = useState<number | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inactivityTimerRef = useRef<number | null>(null);

  const addLog = useCallback((message: string, status: LogStatus) => {
    const newLog = { id: Date.now() + Math.random(), message, status };
    setLogs(prevLogs => [...prevLogs, newLog]);
  }, []);

  const handleLogout = useCallback(() => {
    setIsAuthenticated(false);
    // We don't need to add a log here as the user will see the login screen
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = window.setTimeout(() => handleLogout(), INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    if (isAuthenticated) {
        const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];
        
        const eventHandler = () => {
            resetInactivityTimer();
        };

        events.forEach(event => window.addEventListener(event, eventHandler));
        resetInactivityTimer();

        return () => {
            if (inactivityTimerRef.current) {
                clearTimeout(inactivityTimerRef.current);
            }
            events.forEach(event => window.removeEventListener(event, eventHandler));
        };
    }
  }, [isAuthenticated, resetInactivityTimer]);


  // Auto-update check logic
  useEffect(() => {
    const checkForUpdates = async () => {
      if (snoozeUntil && Date.now() < snoozeUntil) {
        return;
      }
      try {
        const response = await fetch(GITHUB_REPO_URL, {
          headers: {
            // It is best practice to provide a User-Agent when using the GitHub API.
            'User-Agent': 'PhantomV-VeilSync-App'
          }
        });

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Repository or branch not found. Please check GITHUB_REPO_URL.');
          }
          if (response.status === 403) {
            throw new Error('GitHub API rate limit exceeded. Please try again later.');
          }
          throw new Error(`Failed to fetch from GitHub API (Status: ${response.status})`);
        }

        const latestCommit = await response.json();
        const latestCommitSha = latestCommit.sha;
        
        const currentCommitSha = sessionStorage.getItem('currentCommitSha');

        if (!currentCommitSha) {
          sessionStorage.setItem('currentCommitSha', latestCommitSha);
        } else if (currentCommitSha !== latestCommitSha) {
          setShowUpdateModal(true);
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
          }
        }
      } catch (error) {
        console.error("Update check failed:", error);
      }
    };

    checkForUpdates();
    const intervalId = setInterval(checkForUpdates, UPDATE_CHECK_INTERVAL);

    return () => clearInterval(intervalId);
  }, [snoozeUntil]);


  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const resetInput = () => {
    setFileContent(null);
    setFileName(null);
    setImageData(null);
    setPastedContent('');
    setSyncCompleted(false);
    setShowAnalyzer(false);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setLogs([]);
    addLog('Authentication successful. VeilSync protocol engaged.', 'success');
    resetInput();
  };

  const handleFileRead = (file: File) => {
    resetInput();
    setLogs([]);

    if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const base64 = dataUrl.split(',')[1];
            setImageData({
                url: dataUrl,
                base64,
                mimeType: file.type,
                name: file.name
            });
        };
        reader.onerror = () => {
            addLog(`Error reading image file: ${file.name}`, 'error');
            resetInput();
        };
        reader.readAsDataURL(file);
    } else {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            setFileContent(text);
        };
        reader.onerror = () => {
            addLog(`Error reading text file: ${file.name}`, 'error');
            resetInput();
        };
        reader.readAsText(file);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isSyncing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileRead(file);
    }
  };
  
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSyncing) setIsDragOver(true);
  };
  
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleStartSync = async () => {
    if (isSyncing || (!fileContent && !pastedContent && !imageData)) return;
    setIsSyncing(true);
    setSyncCompleted(false);
    setLogs([]);

    const dataName = imageData?.name || fileName || 'Pasted Content';
    const dataSize = imageData ? 'Image Data' : `${fileContent?.length || pastedContent.length} chars`;

    const steps = [
      { msg: "INITIALIZING PHANTOM_V RUNTIME", delay: 1000, status: 'info' },
      { msg: `PROCESSING DATA: ${dataName}`, delay: 1000, status: 'info' },
      { msg: "ESTABLISHING SECURE CONNECTION", delay: 1500, status: 'info' },
      { msg: "ANALYZING DATA STRUCTURE", delay: 1200, status: 'info' },
      { msg: "ATTEMPTING KERNEL-LEVEL SYNC", delay: 2000, status: 'info' },
      { msg: "SYNC FAILED: ACCESS RESTRICTED.", delay: 800, status: 'error' },
      { msg: "FALLBACK TO PAYLOAD INJECTION", delay: 1500, status: 'info' },
      { msg: `SUCCESS: ${dataSize} SYNCED.`, delay: 1000, status: 'success' },
      { msg: "SYNC COMPLETE. STANDBY.", delay: 500, status: 'success' },
    ] as const;
    
    let currentLogs: LogEntry[] = [];
    for (const step of steps) {
        const pendingLog = { id: Date.now() + Math.random(), message: step.msg, status: 'pending' as LogStatus };
        currentLogs.push(pendingLog);
        setLogs([...currentLogs]);
        
        await sleep(200); 
        
        currentLogs = currentLogs.map(l => l.id === pendingLog.id ? {...l, status: step.status} : l);
        setLogs([...currentLogs]);

        await sleep(step.delay);
    }
    
    setSyncCompleted(true);
    if (isSessionPersistent) {
      addLog("SESSION PERSISTENCE ENABLED.", 'info');
    } else {
      addLog("SESSION PERSISTENCE DISABLED. CLEARING INPUT ON NEXT ACTION.", 'info');
    }
    setIsSyncing(false);
  };

  const handleUpdateNow = () => {
    window.location.reload();
  };

  const handleSnooze = (minutes: number) => {
    setSnoozeUntil(Date.now() + minutes * 60 * 1000);
    setShowUpdateModal(false);
  };

  const getIconForStatus = (status: LogStatus) => {
    switch (status) {
      case 'pending':
        return <SpinnerIcon className="h-5 w-5 text-sky-400" />;
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'info':
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const hasData = !!fileContent || !!pastedContent || !!imageData;

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="bg-[#02040a] bg-[radial-gradient(at_10%_20%,hsla(219,90%,50%,0.4)_0px,transparent_50%),radial-gradient(at_90%_30%,hsla(300,90%,40%,0.4)_0px,transparent_50%),radial-gradient(at_50%_95%,hsla(219,90%,60%,0.3)_0px,transparent_50%)]">
    {/* Hidden audio element for the update alert */}
    <audio ref={audioRef} src={ALERT_SOUND_URI} preload="auto" />

    <div className="min-h-screen w-full bg-transparent text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-orbitron">
      <header className="w-full max-w-6xl mx-auto flex flex-col justify-center items-center py-4 text-center">
        <Logo className="h-20" />
        <h1 className="text-2xl font-bold text-sky-300/80 tracking-[0.3em] uppercase -mt-4 drop-shadow-[0_0_8px_rgba(125,211,252,0.4)]">VeilSync</h1>
      </header>

      <main className="w-full max-w-6xl mx-auto flex-grow flex flex-col lg:flex-row gap-8 mt-8">
        {/* Data Input Panel */}
        <div className="lg:w-1/2 w-full flex flex-col">
           <div className="relative p-px bg-gradient-to-br from-blue-500 via-fuchsia-500 to-sky-500 rounded-2xl shadow-lg shadow-blue-500/20 h-full">
            <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-6 h-full flex flex-col">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400 tracking-wider uppercase">Data Input</h2>
              <p className="mt-2 text-gray-400 font-sans text-sm">Provide data by file upload or pasting content below.</p>
              
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !isSyncing && fileInputRef.current?.click()}
                className={`mt-6 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[140px] ${isSyncing ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${isDragOver ? 'border-sky-400 bg-sky-500/10' : 'border-gray-600 hover:border-sky-500/70'}`}
              >
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} disabled={isSyncing} accept="text/*,image/png,image/jpeg,image/webp"/>
                {imageData ? (
                   <div className="flex flex-col items-center justify-center text-sky-300">
                      <img src={imageData.url} alt="Image preview" className="h-16 w-auto max-w-full object-contain rounded-md mb-2 border border-sky-500/50" />
                      <p className="font-bold text-base">{imageData.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); resetInput(); }} className="mt-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-50" disabled={isSyncing}>Clear Image</button>
                   </div>
                ) : fileName ? (
                   <div className="flex flex-col items-center justify-center text-sky-300">
                      <DocumentIcon className="h-10 w-10 mb-2"/>
                      <p className="font-bold text-base">{fileName}</p>
                      <button onClick={(e) => { e.stopPropagation(); resetInput(); }} className="mt-2 text-xs text-red-400 hover:text-red-300 disabled:opacity-50" disabled={isSyncing}>Clear File</button>
                   </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <UploadIcon className="h-10 w-10 mb-2" />
                    <p className="font-bold">Drag & drop a file</p>
                    <p className="text-xs">or click to select</p>
                  </div>
                )}
              </div>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-700"></div>
                <span className="flex-shrink mx-4 text-gray-500 text-xs font-sans">OR</span>
                <div className="flex-grow border-t border-gray-700"></div>
              </div>

              <textarea
                value={pastedContent}
                onChange={(e) => { resetInput(); setLogs([]); setPastedContent(e.target.value); }}
                placeholder="Paste raw content here..."
                className="w-full h-24 bg-black/50 rounded-lg p-3 font-mono text-sm border border-gray-700/50 focus:ring-2 focus:ring-fuchsia-500 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSyncing || !!fileName || !!imageData}
              />

              <div className="my-6 border-t border-blue-500/20"></div>

              <ToggleSwitch
                label="Enable Persistent Session"
                enabled={isSessionPersistent}
                onChange={setIsSessionPersistent}
                disabled={isSyncing}
              />
              
              <div className="mt-auto pt-6">
                <button
                  onClick={handleStartSync}
                  disabled={isSyncing || !hasData || (syncCompleted && isSessionPersistent)}
                  className="w-full relative inline-flex items-center justify-center p-0.5 mb-2 overflow-hidden text-base font-bold rounded-lg group bg-gradient-to-br from-blue-600 to-fuchsia-600 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-neon-blue"
                >
                  <span className="w-full relative px-5 py-3.5 transition-all ease-in duration-150 bg-gray-900 rounded-md group-hover:bg-opacity-0 text-white tracking-widest uppercase">
                    {isSyncing ? 'Syncing...' : 'Start Sync'}
                  </span>
                </button>

                {syncCompleted && hasData && (
                   <button
                    onClick={() => setShowAnalyzer(true)}
                    disabled={isSyncing}
                    className="w-full relative inline-flex items-center justify-center p-0.5 mt-4 overflow-hidden text-base font-bold rounded-lg group bg-gradient-to-br from-sky-500 to-green-500 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-neon-blue animate-fade-in"
                  >
                    <span className="w-full relative px-5 py-3.5 transition-all ease-in duration-150 bg-gray-900 rounded-md group-hover:bg-opacity-0 text-white tracking-widest uppercase flex items-center justify-center gap-2">
                      <BrainIcon className="h-5 w-5" />
                      Analyze Synced Data
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Log Viewer */}
        <div className="lg:w-1/2 w-full flex flex-col">
          <div className="relative p-px bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl h-full">
            <div className="bg-black/70 backdrop-blur-xl rounded-2xl p-6 h-full flex flex-col">
              <h3 className="text-lg font-semibold text-gray-300 tracking-wider uppercase">Process Log</h3>
              <div ref={logContainerRef} className="mt-4 flex-grow bg-black/50 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm border border-gray-700/50">
                {logs.length === 0 && (
                  <p className="text-gray-500 animate-pulse">Awaiting data and sync command...</p>
                )}
                <ul className="space-y-3">
                  {logs.map(log => (
                    <li key={log.id} className="flex items-start gap-3 animate-fade-in">
                      <div className="flex-shrink-0 mt-0.5">{getIconForStatus(log.status)}</div>
                      <span className={`flex-1 ${log.status === 'pending' ? 'text-gray-400 animate-pulse' : 'text-gray-300'}`}>{log.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-6xl mx-auto mt-16">
        <h3 className="text-center text-xl font-bold text-gray-400 mb-6 tracking-wider uppercase">Deployment Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DeploymentOptionCard
            icon={<ChipIcon className="h-8 w-8 text-blue-400" />}
            title="Standalone App"
            description="All-in-one, portable executable with an embedded browser. Works offline."
          />
          <DeploymentOptionCard
            icon={<ServerIcon className="h-8 w-8 text-fuchsia-400" />}
            title="Slim Client + Backend"
            description="Lightweight UI with processing handled on a secure remote server."
          />
          <DeploymentOptionCard
            icon={<CloudUploadIcon className="h-8 w-8 text-sky-400" />}
            title="Firebase Hosting"
            description="Globally distributed, SSL-enabled hosting for fast and secure access."
          />
        </div>
      </footer>
    </div>
    
    {showAnalyzer && hasData && (
      <DataAnalyzer
        textContent={fileContent || pastedContent}
        imageData={imageData}
        onClose={() => setShowAnalyzer(false)}
      />
    )}

    {showUpdateModal && (
      <UpdateModal
        onUpdateNow={handleUpdateNow}
        onSnooze={handleSnooze}
        onClose={() => setShowUpdateModal(false)}
      />
    )}
    </div>
  );
};

export default App;