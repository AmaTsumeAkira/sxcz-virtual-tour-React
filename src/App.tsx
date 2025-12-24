import { useState, useRef, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { toJpeg } from 'html-to-image';
import PanoramaViewer from './components/PanoramaViewer';
import { APP_DATA } from './data';

function App() {
  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
  
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
  const [initialView] = useState(initialState.view);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(!initialState.view); // Skip welcome if shared link
  const [isMuted, setIsMuted] = useState(false);
  const [isAutorotateEnabled, setIsAutorotateEnabled] = useState(APP_DATA.settings.autorotateEnabled);
  const [isGyroEnabled, setIsGyroEnabled] = useState(false);
  const [infoHotspotData, setInfoHotspotData] = useState<{title: string, text: string} | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shareCardData, setShareCardData] = useState<{
    screenshot: string;
    url: string;
    sceneName: string;
  } | null>(null);
  const [finalShareImage, setFinalShareImage] = useState<string | null>(null);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const viewerRef = useRef<any>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const handleSceneChange = useCallback((id: string) => {
    setCurrentSceneId(id);
  }, []);

  const handleInfoHotspotClick = useCallback((title: string, text: string) => {
    setInfoHotspotData({ title, text });
  }, []);

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
        
        const sceneName = APP_DATA.scenes.find(s => s.id === view.sceneId)?.name || '全景校园';
        
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

  const currentScene = APP_DATA.scenes.find(s => s.id === currentSceneId) || APP_DATA.scenes[0];

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
      setIsMuted(!isMuted);
    }
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
      <div className={`absolute top-0 left-0 h-full w-72 md:w-85 bg-black/40 backdrop-blur-3xl z-30 transform transition-all duration-500 ease-out border-r border-white/10 shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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

          <div className="mt-6 pt-6 border-t border-white/5 text-[10px] text-white/20 text-center uppercase tracking-[0.2em] space-y-1">
            <p>© 2025 山西财专 · 云上游校园</p>
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-colors block">
              陕ICP备20011108号-1
            </a>
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
            onClick={() => setIsGyroEnabled(!isGyroEnabled)}
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

      {/* ICP Filing */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 text-[9px] md:text-[10px] text-white/20 pointer-events-auto whitespace-nowrap">
        <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-white/40 transition-colors">
          陕ICP备20011108号-1
        </a>
      </div>

      {/* Info Modal */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-xl transition-all duration-500 p-4">
          <div className="bg-glass p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border border-white/20 shadow-2xl max-w-md w-full relative animate-float max-h-[90dvh] overflow-y-auto no-scrollbar">
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/50 hover:text-white z-10"
            >
              ✕
            </button>
            <h3 className="text-2xl md:text-3xl font-black mb-6 md:mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">操作指南</h3>
            <div className="space-y-5 md:space-y-6 text-white/70 leading-relaxed font-medium">
              <div className="flex items-start space-x-4 group">
                <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center mt-1 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <span className="text-xs font-bold">1</span>
                </div>
                <p className="flex-1 text-sm">拖动屏幕可旋转视角，探索校园美景。</p>
              </div>
              <div className="flex items-start space-x-4 group">
                <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center mt-1 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <span className="text-xs font-bold">2</span>
                </div>
                <p className="flex-1 text-sm">点击蓝色闪烁的“前进”图标，可跳转至下一个场景。</p>
              </div>
              <div className="flex items-start space-x-4 group">
                <div className="w-8 h-8 bg-blue-500/20 rounded-xl flex items-center justify-center mt-1 border border-blue-500/30 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <span className="text-xs font-bold">3</span>
                </div>
                <p className="flex-1 text-sm">点击左上角菜单，可快速切换至不同校区场景。</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-white/10">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Project Info</span>
                <span className="px-2 py-1 bg-blue-500/10 rounded text-[10px] text-blue-400 border border-blue-500/20">v2.0.0-React</span>
              </div>
              
              {/* WeChat QR Banner */}
              <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 shadow-inner bg-white/5 p-1">
                <img 
                  src={`${baseUrl}/扫码_搜索联合传播样式-标准色版.png`} 
                  className="w-full h-auto rounded-xl" 
                  alt="信息科技学院微信二维码" 
                />
              </div>

              <div className="space-y-2 text-xs text-white/40 font-medium">
                <p className="flex justify-between items-start">
                  <span className="shrink-0">出品单位</span> 
                  <span className="text-white/60 text-right ml-4">山西省财政税务专科学校<br/>信息科技学院分团委</span>
                </p>
                <p className="flex justify-between"><span>核心引擎</span> <span className="text-white/60">Marzipano Engine</span></p>
                <p className="flex justify-between"><span>版权所有</span> <span className="text-white/60">© 2025 All Rights Reserved</span></p>
                <p className="flex justify-between">
                  <span>备案信息</span> 
                  <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-blue-400 transition-colors">
                    陕ICP备20011108号-1
                  </a>
                </p>
              </div>

              <div className="mt-8 flex items-center space-x-3">
                <a 
                  href="https://www.sxftc.edu.cn/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center space-x-2 py-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-2xl text-blue-400 text-xs font-bold transition-all group"
                >
                  <span>访问官网</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
                <button 
                  onClick={() => setIsInfoOpen(false)}
                  className="flex-1 py-4 bg-white text-blue-950 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-95"
                >
                  我知道了
                </button>
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

      {/* Share Card Modal */}
      {shareCardData && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 overflow-y-auto">
          {/* Hidden Source DOM for Capture */}
          <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
            <div 
              ref={shareCardRef}
              className="bg-[#F8FAFC] flex flex-col font-sans relative overflow-hidden"
              style={{ width: '600px', minHeight: '960px' }}
            >
              {/* 1. Top Visual Area - Cinematic Impact */}
              <div className="relative h-[560px] w-full shrink-0">
                <img src={shareCardData.screenshot} className="w-full h-full object-cover" alt="Screenshot" />
                
                {/* Professional Gradient Mask - Stronger at bottom for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                {/* Glassmorphism Badge */}
                <div className="absolute top-8 left-8">
                  <div className="px-5 py-2.5 bg-white/10 backdrop-blur-xl border border-white/20 text-white text-[10px] font-black tracking-[0.3em] uppercase rounded-full shadow-2xl">
                    Virtual Tour
                  </div>
                </div>

                {/* Scene Title - No Truncation, Dynamic Layout */}
                <div className="absolute bottom-16 left-10 right-10">
                  <div className="flex flex-col items-start space-y-3">
                    <h3 className="text-white text-6xl font-black tracking-tighter leading-[1.1] drop-shadow-2xl">
                      {shareCardData.sceneName}
                    </h3>
                    <p className="text-blue-400 text-xs font-black tracking-[0.4em] uppercase opacity-90">
                      Shanxi Finance & Taxation College
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Floating Info Card - The Core Content */}
              <div className="relative px-6 -mt-10 z-10">
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-10 flex items-stretch justify-between border border-slate-50">
                  
                  {/* Left: School Identity & Contact */}
                  <div className="flex flex-col justify-center py-1 pr-6 border-r border-slate-100 flex-1">
                    <div className="space-y-6">
                      
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3 text-slate-600">
                          <svg className="w-5 h-5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          <p className="text-base font-bold tracking-wide leading-tight">太原市万柏林区千峰南路25号</p>
                        </div>
                        <div className="flex flex-col space-y-4">
                          <div className="flex items-center space-x-3 text-slate-600">
                            <svg className="w-5 h-5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <p className="text-base font-bold tracking-wide">030024</p>
                          </div>
                          <div className="flex items-center space-x-3 text-slate-600">
                            <svg className="w-5 h-5 shrink-0 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <p className="text-base font-bold tracking-wide">0351-6580599</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          <p className="text-slate-500 font-mono text-xs font-bold uppercase tracking-widest">
                            {window.location.hostname}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Main QR Entry */}
                  <div className="flex flex-col items-center justify-center pl-10 shrink-0">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full group-hover:bg-blue-600/20 transition-all"></div>
                      <div className="relative bg-white p-3 rounded-[1.5rem] border border-slate-100 shadow-2xl">
                        <QRCodeCanvas 
                          value={shareCardData.url}
                          size={120}
                          level="H"
                          includeMargin={true}
                          fgColor="#0f172a"
                        />
                      </div>
                    </div>
                    <div className="mt-6 px-6 py-2.5 bg-blue-600 text-white text-[11px] font-black tracking-[0.2em] rounded-full shadow-lg shadow-blue-200 uppercase">
                      扫码游览
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Footer - Minimalist & Integrated */}
              <div className="mt-auto px-10 py-12">
                <div className="flex items-center justify-between transition-all duration-700">
                  <div className="flex flex-col">
                    <p className="text-slate-900 font-black text-lg tracking-tight">更多资讯</p>
                    <p className="text-slate-400 text-xs font-bold mt-1">关注出品方更多动态</p>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="h-10 w-px bg-slate-200"></div>
                    <div className="max-w-[340px]">
                      <img 
                        src={`${baseUrl}/扫码_搜索联合传播样式-白色版.png`} 
                        className="w-full h-auto block" 
                        alt="WeChat Banner" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-sm w-full animate-float-slow">
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
                <div className="bg-white/10 backdrop-blur-md rounded-[2rem] aspect-[3/4] flex flex-col items-center justify-center text-white space-y-6 border border-white/10">
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
