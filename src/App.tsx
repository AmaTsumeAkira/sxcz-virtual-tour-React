import { useState, useRef, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { toJpeg } from 'html-to-image';
import { useVercount } from 'vercount-react';
import PanoramaViewer from './components/PanoramaViewer';
import MapOverlay from './components/MapOverlay';
import { APP_DATA } from './data';

function App() {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  const { sitePv, pagePv, siteUv } = useVercount();
  
  // Parse URL parameters for initial state
  const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    const sceneId = params.get('scene');
    const yaw = params.get('yaw');
    const pitch = params.get('pitch');
    const fov = params.get('fov');
    
    return {
      sceneId: sceneId && APP_DATA.scenes.find(s => s.id === sceneId) ? sceneId : APP_DATA.scenes[0].id,
      view: yaw && pitch && fov ? {
        yaw: parseFloat(yaw),
        pitch: parseFloat(pitch),
        fov: parseFloat(fov)
      } : undefined
    };
  };

  const initialState = getInitialState();
  const [currentSceneId, setCurrentSceneId] = useState(initialState.sceneId);
  const currentScene = APP_DATA.scenes.find(s => s.id === currentSceneId) || APP_DATA.scenes[0];
  const [initialView] = useState(initialState.view);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(!initialState.view); // Skip welcome if shared link
  const [isMuted, setIsMuted] = useState(false);
  const [isAutorotateEnabled, setIsAutorotateEnabled] = useState(APP_DATA.settings.autorotateEnabled);
  const [isGyroEnabled, setIsGyroEnabled] = useState(false);
  const [infoHotspotData, setInfoHotspotData] = useState<{title: string, text: string} | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareCardData, setShareCardData] = useState<{
    screenshot: string;
    url: string;
    sceneName: string;
  } | null>(null);
  const [finalShareImage, setFinalShareImage] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [isNarrationPlaying, setIsNarrationPlaying] = useState(false);
  const [scenesData, setScenesData] = useState(APP_DATA.scenes);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const narrationRef = useRef<HTMLAudioElement>(null);
  const viewerRef = useRef<any>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Admin Mode Global Functions
  useEffect(() => {
    (window as any).admin = () => {
      setIsAdminMode(prev => {
        const newMode = !prev;
        console.log(`Admin Mode: ${newMode ? 'ENABLED' : 'DISABLED'}`);
        if (newMode) setIsMapOpen(true);
        return newMode;
      });
    };

    (window as any).map = () => {
      const output = scenesData.map(s => ({
        id: s.id,
        name: s.name,
        mapPos: s.mapPos
      }));
      console.table(output);
      console.log(JSON.stringify(output, null, 2));
    };

    return () => {
      delete (window as any).admin;
      delete (window as any).map;
    };
  }, [scenesData]);

  const handleSceneChange = useCallback((id: string) => {
    setCurrentSceneId(id);
  }, []);

  const handleInfoHotspotClick = useCallback((title: string, text: string) => {
    setInfoHotspotData({ title, text });
  }, []);

  // Handle narration when scene changes
  useEffect(() => {
    if (!isWelcomeOpen && currentScene.audio && narrationRef.current) {
      narrationRef.current.src = `${baseUrl}/${currentScene.audio}`;
      narrationRef.current.play()
        .then(() => setIsNarrationPlaying(true))
        .catch(err => {
          console.log("Narration play failed:", err);
          setIsNarrationPlaying(false);
        });
      
      // Stop background music when narration starts
      if (audioRef.current) {
        audioRef.current.pause();
      }
    } else if (narrationRef.current) {
      narrationRef.current.pause();
      setIsNarrationPlaying(false);
      // Resume background music if narration is stopped/not present
      if (!isWelcomeOpen && audioRef.current) {
        audioRef.current.play().catch(err => console.log("Audio resume failed:", err));
      }
    }
  }, [currentSceneId, isWelcomeOpen, baseUrl, currentScene.audio]);

  // Resume background music when narration ends
  const handleNarrationEnded = () => {
    setIsNarrationPlaying(false);
    if (audioRef.current) {
      audioRef.current.play().catch(err => console.log("Audio resume failed:", err));
    }
  };

  const toggleNarration = () => {
    if (narrationRef.current) {
      if (isNarrationPlaying) {
        narrationRef.current.pause();
        setIsNarrationPlaying(false);
        // Resume background music when manually pausing narration
        if (audioRef.current) {
          audioRef.current.play().catch(err => console.log("Audio resume failed:", err));
        }
      } else {
        narrationRef.current.play()
          .then(() => setIsNarrationPlaying(true))
          .catch(err => console.log("Narration play failed:", err));
        // Pause background music when manually playing narration
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }
  };

  const handleShare = () => {
    if (viewerRef.current) {
      const view = viewerRef.current.getCurrentView();
      const screenshot = viewerRef.current.takeScreenshot();
      
      if (view && screenshot) {
        const url = new URL(window.location.href);
        url.searchParams.set('scene', view.sceneId);
        url.searchParams.set('yaw', view.yaw.toFixed(4));
        url.searchParams.set('pitch', view.pitch.toFixed(4));
        url.searchParams.set('fov', view.fov.toFixed(4));
        
        const sceneName = (APP_DATA.scenes.find(s => s.id === view.sceneId)?.name || '全景校园').replace('云游财专-', '');
        
        setFinalShareImage(null);
        setShareCardData({
          screenshot,
          url: url.toString(),
          sceneName
        });
        setIsGeneratingCard(true);
      }
    }
  };

  useEffect(() => {
    if (shareCardData && isGeneratingCard && shareCardRef.current) {
      // Wait longer for all assets (especially the screenshot data URL) to be ready in the DOM
      const timer = setTimeout(() => {
        const filter = (node: HTMLElement) => {
          const exclusionClasses = ['animate-spin', 'animate-pulse'];
          return !exclusionClasses.some(cls => node.classList?.contains(cls));
        };

        toJpeg(shareCardRef.current!, { 
          quality: 0.95, 
          backgroundColor: '#ffffff',
          pixelRatio: 2, // Higher quality
          filter: filter
        })
          .then((dataUrl) => {
            // Check if the generated image is too small (likely failed)
            if (dataUrl.length < 1000) {
              throw new Error('Generated image is empty');
            }
            setFinalShareImage(dataUrl);
            setIsGeneratingCard(false);
          })
          .catch((err) => {
            console.error('Failed to generate share image:', err);
            // Retry once after a longer delay if it failed
            setTimeout(() => {
              if (shareCardRef.current) {
                toJpeg(shareCardRef.current!, { quality: 0.9, backgroundColor: '#fff', pixelRatio: 2 })
                  .then(setFinalShareImage)
                  .finally(() => setIsGeneratingCard(false));
              }
            }, 1000);
          });
      }, 1000); // Increased delay to 1s
      return () => clearTimeout(timer);
    }
  }, [shareCardData, isGeneratingCard]);

  const filteredScenes = APP_DATA.scenes.filter(scene => 
    scene.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!isWelcomeOpen && audioRef.current) {
      audioRef.current.play().catch(err => console.log("Audio play failed:", err));
    }
  }, [isWelcomeOpen]);

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    if (narrationRef.current) {
      narrationRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const toggleInfo = () => {
    setIsInfoOpen(!isInfoOpen);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white font-sans">
      {/* Panorama Viewer */}
      <PanoramaViewer 
        ref={viewerRef}
        currentSceneId={currentSceneId} 
        onSceneChange={handleSceneChange}
        isAutorotateEnabled={isAutorotateEnabled}
        isGyroEnabled={isGyroEnabled}
        onInfoHotspotClick={handleInfoHotspotClick}
        initialView={initialView}
      />

      {/* Map Overlay */}
      <MapOverlay 
        currentSceneId={currentSceneId}
        onSceneChange={handleSceneChange}
        baseUrl={baseUrl}
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        isAdmin={isAdminMode}
        scenes={scenesData}
        onUpdateScene={(id, pos) => {
          setScenesData(prev => prev.map(s => s.id === id ? { ...s, mapPos: pos } : s));
        }}
      />

      {/* Top Title Bar */}
      <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 z-10 w-auto max-w-[75vw] md:max-w-none">
        <div className="bg-glass-dark px-5 py-2.5 md:px-10 md:py-4 rounded-full md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex items-center space-x-3 md:space-x-5 group hover:scale-105 transition-transform duration-500">
          <div className="relative shrink-0">
            <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full animate-ping absolute inset-0 opacity-50"></div>
            <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-400 rounded-full relative shadow-[0_0_10px_rgba(96,165,250,0.8)]"></div>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-[13px] md:text-lg font-black tracking-[0.1em] md:tracking-[0.2em] text-white drop-shadow-lg uppercase whitespace-nowrap overflow-hidden text-ellipsis">
              {currentScene.name}
            </h1>
            <div className="hidden md:block h-0.5 w-0 group-hover:w-full bg-blue-500 transition-all duration-700 mt-1"></div>
          </div>
        </div>
      </div>

      {/* Top Right Logo (Desktop Only) */}
      <div className="absolute top-8 right-8 z-10 hidden md:block">
        <div className="bg-glass-dark p-3 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-2xl">
          <img src={`${baseUrl}/sxczlogo.png`} className="h-12 w-auto" alt="School Logo" />
        </div>
      </div>

      {/* Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-4 left-4 md:top-8 md:left-8 z-20 p-3.5 md:p-4 bg-glass-dark rounded-xl md:rounded-2xl hover:bg-white/10 transition-all duration-300 group border border-white/10 shadow-xl"
      >
        <div className="space-y-1 md:space-y-1.5">
          <div className="w-5 h-0.5 md:w-6 md:h-0.5 bg-white/80 transition-all group-hover:w-4"></div>
          <div className="w-5 h-0.5 md:w-6 md:h-0.5 bg-white/80"></div>
          <div className="w-5 h-0.5 md:w-6 md:h-0.5 bg-white/80 transition-all group-hover:w-4 ml-auto"></div>
        </div>
      </button>

      {/* Mobile Info Button */}
      <button 
        onClick={toggleInfo}
        className="absolute top-4 right-4 z-20 md:hidden p-3.5 bg-glass-dark rounded-xl border border-white/10 shadow-xl"
      >
        <img src={`${baseUrl}/img/info.png`} className="w-5 h-5 opacity-70" alt="Help" />
      </button>

      {/* Sidebar */}
      <div className={`absolute top-0 left-0 h-full w-72 md:w-85 bg-black/40 backdrop-blur-3xl z-[200] transform transition-all duration-500 ease-out border-r border-white/10 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 md:p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-black bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent tracking-tight">
                校园导览
              </h2>
              <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-bold">Campus Navigation</p>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6 group">
            <input
              type="text"
              placeholder="搜索场景..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-5 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white/10 transition-all placeholder:text-white/20"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {filteredScenes.length > 0 ? (
              filteredScenes.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => {
                    setCurrentSceneId(scene.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3.5 rounded-xl md:rounded-2xl transition-all duration-300 flex items-center space-x-4 group relative overflow-hidden ${
                    currentSceneId === scene.id 
                    ? 'bg-blue-600/20 border border-blue-500/50 text-blue-200' 
                    : 'bg-white/5 border border-transparent hover:bg-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {currentSceneId === scene.id && (
                    <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                  )}
                  <div className={`w-2 h-2 rounded-full transition-all duration-500 ${currentSceneId === scene.id ? 'bg-blue-400 scale-125' : 'bg-white/20 group-hover:bg-white/40'}`}></div>
                  <span className="truncate font-semibold tracking-wide text-xs md:text-sm">{scene.name}</span>
                </button>
              ))
            ) : (
              <div className="text-center py-10 text-white/20 italic text-sm">未找到相关场景</div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                <p className="text-[8px] text-white/30 uppercase tracking-tighter mb-1">总访问量</p>
                <p className="text-xs font-bold text-blue-400">{sitePv || '...'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                <p className="text-[8px] text-white/30 uppercase tracking-tighter mb-1">本页阅读</p>
                <p className="text-xs font-bold text-purple-400">{pagePv || '...'}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-2 text-center border border-white/5">
                <p className="text-[8px] text-white/30 uppercase tracking-tighter mb-1">访客人数</p>
                <p className="text-xs font-bold text-emerald-400">{siteUv || '...'}</p>
              </div>
            </div>

            <div className="text-[10px] text-white/20 text-center uppercase tracking-[0.2em] space-y-1">
              <p>© 2025 山西财专 · 云上游校园</p>
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-colors block">
                陕ICP备20011108号-1
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {isWelcomeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl transition-all duration-700">
          <div className="bg-glass p-8 md:p-12 rounded-[2.5rem] md:rounded-[3rem] border border-white/20 shadow-[0_0_100px_rgba(0,0,0,0.5)] max-w-lg w-full mx-4 text-center transform transition-all scale-100 animate-float">
            {/* Logo Banner */}
            <div className="mb-8 md:mb-10 relative group">
              <img 
                src={`${baseUrl}/sxczlogo.png`} 
                className="w-full max-w-[220px] md:max-w-[280px] h-auto mx-auto drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                alt="Logo" 
              />
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">山西财专</h2>
            <p className="text-blue-400 text-lg md:text-xl mb-8 md:mb-10 font-bold tracking-[0.3em] uppercase opacity-80">“云上”游校园</p>
            <div className="space-y-3 md:space-y-4 mb-10 md:mb-12 text-white/50 text-sm md:text-base font-medium leading-relaxed">
              <p>首批国家示范性高等职业院校</p>
              <p className="text-xs opacity-60">点击下方按钮，开启沉浸式全景探索之旅</p>
            </div>
            <button 
              onClick={() => setIsWelcomeOpen(false)}
              className="w-full py-5 md:py-6 bg-white text-blue-950 rounded-2xl font-black text-lg md:text-xl hover:bg-blue-50 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-95 glass-shine"
            >
              开启云端之旅
            </button>
            <div className="mt-6">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-[10px] text-white/20 hover:text-white/40 transition-colors">
                陕ICP备20011108号-1
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-16 md:bottom-10 left-1/2 -translate-x-1/2 md:left-auto md:right-10 md:translate-x-0 z-50 flex items-center">
        <div className="flex items-center bg-black/60 backdrop-blur-3xl p-1.5 md:p-2 rounded-full md:rounded-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-[96vw] md:w-auto md:max-w-none overflow-x-auto no-scrollbar justify-around md:justify-start md:space-x-1">
          <button 
            onClick={() => setIsAutorotateEnabled(!isAutorotateEnabled)}
            className={`p-2 md:p-3 rounded-full md:rounded-2xl transition-all duration-500 group relative shrink-0 flex flex-col items-center space-y-1 ${isAutorotateEnabled ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'hover:bg-white/10 text-white/60'}`}
            title="自动旋转"
          >
            <div className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center transition-transform duration-700 ${isAutorotateEnabled ? 'rotate-180' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 md:w-5 md:h-5">
                <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.83 6.72 2.24" />
                <path d="M21 3v9h-9" />
              </svg>
            </div>
            <span className="text-[9px] md:text-[10px] font-bold tracking-tighter opacity-80">旋转</span>
          </button>
          <button 
            onClick={() => {
              const newGyroState = !isGyroEnabled;
              setIsGyroEnabled(newGyroState);
              if (newGyroState) {
                setIsAutorotateEnabled(false);
              }
            }}
            className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all duration-500 group relative shrink-0 flex flex-col items-center space-y-1 ${isGyroEnabled ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40' : 'hover:bg-white/10 text-white/60'}`}
            title="陀螺仪"
          >
            <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 md:w-5 md:h-5">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <span className="text-[9px] md:text-[10px] font-bold tracking-tighter opacity-80">感应</span>
          </button>          
          <div className="w-px h-6 md:h-8 bg-white/10 self-center mx-0.5 md:mx-1 shrink-0"></div>

          <button 
            onClick={toggleMute}
            className="p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white/60 hover:text-white group shrink-0 flex flex-col items-center space-y-1"
            title={isMuted ? "播放音乐" : "暂停音乐"}
          >
            <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
              {isMuted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5 opacity-70 group-hover:opacity-100 transition-opacity">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" fillOpacity="0.2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 md:w-5 md:h-5 opacity-70 group-hover:opacity-100 transition-opacity">
                  <rect x="6" y="4" width="4" height="16" fill="currentColor" fillOpacity="0.2" />
                  <rect x="14" y="4" width="4" height="16" fill="currentColor" fillOpacity="0.2" />
                </svg>
              )}
            </div>
            <span className="text-[9px] md:text-[10px] font-bold tracking-tighter opacity-80">音乐</span>
          </button>

          <button 
            onClick={toggleFullscreen}
            className="p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white/60 hover:text-white group shrink-0 flex flex-col items-center space-y-1"
            title="全屏显示"
          >
            <img src={`${baseUrl}/img/fullscreen.png`} className="w-5 h-5 md:w-6 md:h-6 opacity-70 group-hover:opacity-100 transition-opacity" alt="Fullscreen" />
            <span className="text-[9px] md:text-[10px] font-bold tracking-tighter opacity-80">全屏</span>
          </button>

          <button 
            onClick={toggleInfo}
            className="p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white/60 hover:text-white group shrink-0 hidden md:flex flex-col items-center space-y-1"
            title="帮助说明"
          >
            <img src={`${baseUrl}/img/info.png`} className="w-5 h-5 md:w-6 md:h-6 opacity-70 group-hover:opacity-100 transition-opacity" alt="Help" />
            <span className="text-[9px] md:text-[10px] font-bold tracking-tighter opacity-80">帮助</span>
          </button>

          <button 
            onClick={() => setIsMapOpen(true)}
            className={`p-2 md:p-3 rounded-xl md:rounded-2xl transition-all duration-500 group relative shrink-0 flex flex-col items-center space-y-1 ${isMapOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'hover:bg-white/10 text-white/60'}`}
            title="校园地图"
          >
            <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 md:w-5 md:h-5">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            </div>
            <span className="text-[9px] md:text-[10px] font-bold tracking-tighter opacity-80">地图</span>
          </button>

          <button 
            onClick={handleShare}
            className="p-2 md:p-3 rounded-xl md:rounded-2xl hover:bg-white/10 transition-all text-white/60 hover:text-white group shrink-0 flex flex-col items-center space-y-1"
            title="分享当前视角"
          >
            <div className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 md:w-5 md:h-5 opacity-70 group-hover:opacity-100 transition-opacity">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
            </div>
            <span className="text-[9px] md:text-[10px] font-bold tracking-tighter opacity-80">分享</span>
          </button>
        </div>
      </div>

      {/* Narration Control (Desktop Only) */}
      {currentScene.audio && !isWelcomeOpen && (
        <div className="absolute bottom-10 left-10 z-50 hidden md:block">
          <div className="bg-glass-dark p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-2xl flex items-center space-x-4 animate-fade-in">
            <button 
              onClick={toggleNarration}
              className="w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-500 flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              {isNarrationPlaying ? (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white ml-1">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <div className="flex flex-col pr-2">
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-0.5">正在播放</span>
              <span className="text-sm font-bold text-white/90">场景语音解说</span>
            </div>
            {isNarrationPlaying && (
              <div className="flex items-end space-x-1 h-4 pb-1">
                <div className="w-1 bg-blue-400 animate-music-bar-1 rounded-full"></div>
                <div className="w-1 bg-blue-400 animate-music-bar-2 rounded-full"></div>
                <div className="w-1 bg-blue-400 animate-music-bar-3 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ICP Filing */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-[9px] md:text-[10px] text-white/20 pointer-events-auto whitespace-nowrap">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-colors">
          陕ICP备20011108号-1
        </a>
      </div>

      {/* Info Modal */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-xl transition-all duration-500 p-4">
          <div className="bg-glass rounded-[2rem] md:rounded-[3rem] border border-white/20 shadow-2xl max-w-4xl w-full relative animate-float max-h-[90dvh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="absolute top-4 right-4 md:top-8 md:right-8 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white z-10"
            >
              ✕
            </button>

            {/* Desktop Layout */}
            <div className="hidden md:flex p-12 space-x-12">
              {/* Left Column: Guide */}
              <div className="flex-1 space-y-8">
                <h3 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">操作指南</h3>
                <div className="space-y-8 text-white/70 leading-relaxed font-medium">
                  <div className="flex items-start space-x-5 group">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center mt-1 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                      <span className="text-sm font-bold">1</span>
                    </div>
                    <p className="text-lg">拖动屏幕可旋转视角，探索校园美景。</p>
                  </div>
                  <div className="flex items-start space-x-5 group">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center mt-1 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                      <span className="text-sm font-bold">2</span>
                    </div>
                    <p className="text-lg">点击蓝色闪烁的“前进”图标，可跳转至下一个场景。</p>
                  </div>
                  <div className="flex items-start space-x-5 group">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-2xl flex items-center justify-center mt-1 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all shrink-0">
                      <span className="text-sm font-bold">3</span>
                    </div>
                    <p className="text-lg">点击左上角菜单，可快速切换至不同校区场景。</p>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold">访问统计</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase mb-1">总访问量</p>
                      <p className="text-xl font-black text-blue-400">{sitePv || '...'}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase mb-1">本页阅读</p>
                      <p className="text-xl font-black text-purple-400">{pagePv || '...'}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
                      <p className="text-[10px] text-white/30 uppercase mb-1">访客人数</p>
                      <p className="text-xl font-black text-emerald-400">{siteUv || '...'}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                        <span className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold">出品单位</span>
                      </div>
                      <p className="text-sm text-white/60 leading-relaxed font-medium">
                        山西省财政税务专科学校<br/>信息科技学院分团委
                      </p>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-4 bg-purple-500 rounded-full"></div>
                          <span className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold">核心技术</span>
                        </div>
                        <p className="text-sm text-white/60 font-medium">Marzipano Engine</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                          <span className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold">备案信息</span>
                        </div>
                        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-sm text-white/60 hover:text-blue-400 transition-colors font-medium block">
                          陕ICP备20011108号-1
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Info & QRs */}
              <div className="w-80 space-y-6">
                <div className="bg-white/5 rounded-[2rem] p-6 border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">关注我们</span>
                    <span className="px-2 py-1 bg-blue-500/10 rounded text-[10px] text-blue-400 border border-blue-500/20">v2.0.0</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-white p-1.5 rounded-xl shadow-xl w-full aspect-square flex items-center justify-center">
                        <img src={`${baseUrl}/学校微信公众号二维码.jpg`} className="w-full h-auto rounded-lg" alt="微信公众号" />
                      </div>
                      <span className="text-[10px] text-white/40 font-bold">微信公众号</span>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-white p-1.5 rounded-xl shadow-xl w-full aspect-square flex items-center justify-center">
                        <img src={`${baseUrl}/学校微信视频号二维码.jpg`} className="w-full h-auto rounded-lg" alt="微信视频号" />
                      </div>
                      <span className="text-[10px] text-white/40 font-bold">微信视频号</span>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-white p-1.5 rounded-xl shadow-xl w-full aspect-square flex items-center justify-center">
                        <img src={`${baseUrl}/学校微博二维码.jpg`} className="w-full h-auto rounded-lg" alt="官方微博" />
                      </div>
                      <span className="text-[10px] text-white/40 font-bold">官方微博</span>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-white p-1.5 rounded-xl shadow-xl w-full aspect-square flex items-center justify-center">
                        <img src={`${baseUrl}/学校抖音二维码.jpg`} className="w-full h-auto rounded-lg" alt="官方抖音" />
                      </div>
                      <span className="text-[10px] text-white/40 font-bold">官方抖音</span>
                    </div>
                  </div>

                  {/* WeChat QR Banner */}
                  <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-1">
                    <img 
                      src={`${baseUrl}/扫码_搜索联合传播样式-标准色版.png`} 
                      className="w-full h-auto rounded-xl" 
                      alt="信息科技学院微信二维码" 
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <a 
                    href="https://www.sxftc.edu.cn/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-white text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
                  >
                    <span>访问官网</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                  <button 
                    onClick={() => setIsInfoOpen(false)}
                    className="py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-sm transition-all border border-white/10"
                  >
                    我知道了
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Layout */}
            <div className="md:hidden p-6">
              <h3 className="text-2xl font-black mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">操作指南</h3>
              <div className="space-y-5 text-white/70 leading-relaxed font-medium mb-8">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center mt-1 border border-blue-500/30 shrink-0">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <p className="text-sm">拖动屏幕可旋转视角，探索校园美景。</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center mt-1 border border-blue-500/30 shrink-0">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <p className="text-sm">点击蓝色闪烁的“前进”图标，可跳转至下一个场景。</p>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center mt-1 border border-blue-500/30 shrink-0">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <p className="text-sm">点击左上角菜单，可快速切换至不同校区场景。</p>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 space-y-6">
                {/* Mobile Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[8px] text-white/30 uppercase mb-1">总访问量</p>
                    <p className="text-sm font-bold text-blue-400">{sitePv || '...'}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[8px] text-white/30 uppercase mb-1">本页阅读</p>
                    <p className="text-sm font-bold text-purple-400">{pagePv || '...'}</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                    <p className="text-[8px] text-white/30 uppercase mb-1">访客人数</p>
                    <p className="text-sm font-bold text-emerald-400">{siteUv || '...'}</p>
                  </div>
                </div>

                {/* Mobile QRs */}
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center space-y-1">
                    <div className="bg-white p-1 rounded-lg w-full aspect-square flex items-center justify-center">
                      <img src={`${baseUrl}/学校微信公众号二维码.jpg`} className="w-full h-auto rounded" alt="微信" />
                    </div>
                    <span className="text-[8px] text-white/40 font-bold scale-90">公众号</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <div className="bg-white p-1 rounded-lg w-full aspect-square flex items-center justify-center">
                      <img src={`${baseUrl}/学校微信视频号二维码.jpg`} className="w-full h-auto rounded" alt="视频号" />
                    </div>
                    <span className="text-[8px] text-white/40 font-bold scale-90">视频号</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <div className="bg-white p-1 rounded-lg w-full aspect-square flex items-center justify-center">
                      <img src={`${baseUrl}/学校微博二维码.jpg`} className="w-full h-auto rounded" alt="微博" />
                    </div>
                    <span className="text-[8px] text-white/40 font-bold scale-90">微博</span>
                  </div>
                  <div className="flex flex-col items-center space-y-1">
                    <div className="bg-white p-1 rounded-lg w-full aspect-square flex items-center justify-center">
                      <img src={`${baseUrl}/学校抖音二维码.jpg`} className="w-full h-auto rounded" alt="抖音" />
                    </div>
                    <span className="text-[8px] text-white/40 font-bold scale-90">抖音</span>
                  </div>
                </div>

                {/* Mobile Banner */}
                <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 p-1">
                  <img src={`${baseUrl}/扫码_搜索联合传播样式-标准色版.png`} className="w-full h-auto rounded-xl" alt="Banner" />
                </div>

                <div className="space-y-2 text-[10px] text-white/40 font-medium text-center">
                  <p>© 2025 山西省财政税务专科学校</p>
                  <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                    陕ICP备20011108号-1
                  </a>
                </div>

                <div className="flex space-x-3">
                  <a href="https://www.sxftc.edu.cn/" target="_blank" rel="noopener noreferrer" className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold text-sm text-center">
                    访问官网
                  </a>
                  <button onClick={() => setIsInfoOpen(false)} className="flex-1 py-4 bg-white/10 text-white rounded-2xl font-bold text-sm border border-white/10">
                    我知道了
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Hotspot Modal */}
      {infoHotspotData && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-500">
          <div className="bg-glass p-8 rounded-[2rem] border border-white/20 shadow-2xl max-w-sm w-full mx-4 relative animate-float">
            <button 
              onClick={() => setInfoHotspotData(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white"
            >
              ✕
            </button>
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/30">
              <img src={`${baseUrl}/img/info.png`} className="w-6 h-6" alt="Info" />
            </div>
            <h3 className="text-xl font-black mb-4 text-white">{infoHotspotData.title}</h3>
            <p className="text-white/70 text-sm leading-relaxed mb-8">{infoHotspotData.text}</p>
            <button 
              onClick={() => setInfoHotspotData(null)}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg active:scale-95"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      <audio ref={audioRef} src={`${baseUrl}/sxcz.mp3`} loop />
      <audio ref={narrationRef} onEnded={handleNarrationEnded} />

      {/* Share Card Modal */}
      {shareCardData && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-y-auto">
          {/* Hidden Source DOM for Capture */}
          <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
            <div 
              ref={shareCardRef}
              className="bg-white flex flex-row font-sans relative overflow-hidden"
              style={{ width: '1200px', height: '675px' }}
            >
              {/* 1. Main Visual Section (Left) */}
              <div className="relative w-[820px] h-full shrink-0 overflow-hidden bg-slate-100">
                <img src={shareCardData.screenshot} className="w-full h-full object-cover scale-105" alt="Screenshot" />
                
                {/* Sophisticated Overlays */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent"></div>
                <div className="absolute inset-0 ring-[24px] ring-inset ring-white/10 pointer-events-none"></div>
                
                {/* Top Brand Bar */}
                <div className="absolute top-12 left-12">
                  <div className="text-white">
                    <p className="text-[11px] font-black tracking-[0.5em] uppercase opacity-60 mb-1">云端校园</p>
                    <p className="text-2xl font-black tracking-[0.2em]">山西省财政税务专科学校</p>
                  </div>
                </div>

                {/* Bottom Scene Info */}
                <div className="absolute bottom-12 left-12 right-12">
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="h-px w-12 bg-blue-500"></div>
                    <span className="text-white/80 text-[10px] font-black tracking-[0.5em] uppercase">当前场景 · CURRENT SCENE</span>
                  </div>
                  <div className="w-full overflow-hidden">
                    <h3 
                      className="text-white font-black tracking-tighter leading-none drop-shadow-2xl mb-4 whitespace-nowrap"
                      style={{ fontSize: shareCardData.sceneName.length > 6 ? '60px' : '80px' }}
                    >
                      {shareCardData.sceneName}
                    </h3>
                  </div>
                  <p className="text-white/50 text-xs font-medium tracking-[0.4em] uppercase border-l-2 border-white/20 pl-4">
                    360° 全景沉浸式体验校园美景
                  </p>
                </div>
              </div>

              {/* 2. Information & Interaction Section (Right) */}
              <div className="flex-1 bg-white relative flex flex-col p-10">
                {/* Subtle Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none overflow-hidden">
                  <img src={`${baseUrl}/财专正方形logo.png`} className="absolute -right-20 -top-20 w-96 h-96 rotate-12" alt="" />
                </div>

                {/* Content Wrapper */}
                <div className="relative z-10 flex flex-col h-full">
                  {/* QR Code Section - Smaller */}
                  <div className="flex flex-col items-center mb-8">
                    <div className="relative p-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-[2rem] shadow-inner">
                      <div className="bg-white p-3 rounded-[1.5rem] shadow-xl border border-slate-100">
                        <QRCodeCanvas 
                          value={shareCardData.url}
                          size={140}
                          level="H"
                          includeMargin={false}
                          fgColor="#0f172a"
                        />
                      </div>
                      {/* Decorative Corner Accents */}
                      <div className="absolute -top-2 -left-2 w-8 h-8 border-t-4 border-l-4 border-blue-600 rounded-tl-xl"></div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-4 border-r-4 border-blue-600 rounded-br-xl"></div>
                    </div>
                    <p className="mt-4 text-slate-900 font-black text-xs tracking-[0.3em] uppercase">扫码立即进入</p>
                  </div>

                  {/* Contact Info - Clean List */}
                  <div className="space-y-6 mb-auto px-2">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">校园地址</p>
                        <p className="text-xs font-bold text-slate-700">太原市万柏林区千峰南路25号</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">联系电话</p>
                        <p className="text-xs font-bold text-slate-700">0351-6580599</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">浏览网站</p>
                        <p className="text-xs font-bold text-blue-600 tracking-tight">
                          {window.location.origin.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Branding */}
                  <div className="pt-6">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] text-center mb-3">关注出品方更多动态</p>
                    <img 
                      src={`${baseUrl}/扫码_搜索联合传播样式-白色版.png`} 
                      className="w-full h-auto block" 
                      alt="Footer Banner" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl w-full animate-float-slow">
            <div className="relative">
              {/* Final Image for Saving */}
              {finalShareImage ? (
                <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl">
                  <img src={finalShareImage} className="w-full h-auto block" alt="Share Card" />
                  <div className="bg-blue-600 px-6 py-4 text-center">
                    <p className="text-[10px] text-white font-bold animate-pulse">💡 长按上方图片保存并分享</p>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 backdrop-blur-md rounded-[2rem] aspect-video flex flex-col items-center justify-center text-white space-y-6 border border-white/10">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-lg mb-1">正在生成精美卡片</p>
                    <p className="text-white/50 text-xs">请稍候，正在为您捕获校园美景...</p>
                  </div>
                </div>
              )}

              {/* Close Button */}
              <button 
                onClick={() => {
                  setShareCardData(null);
                  setFinalShareImage(null);
                }}
                className="absolute -top-12 right-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
              >
                ✕
              </button>
            </div>
            
            <button 
              onClick={() => {
                setShareCardData(null);
                setFinalShareImage(null);
              }}
              className="w-full mt-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all border border-white/10"
            >
              返回导览
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
