import { useState, useRef, useEffect } from 'react';
import PanoramaViewer from './components/PanoramaViewer';
import { APP_DATA } from './data';

function App() {
  const [currentSceneId, setCurrentSceneId] = useState(APP_DATA.scenes[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isAutorotateEnabled, setIsAutorotateEnabled] = useState(APP_DATA.settings.autorotateEnabled);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentScene = APP_DATA.scenes.find(s => s.id === currentSceneId) || APP_DATA.scenes[0];

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
        currentSceneId={currentSceneId} 
        onSceneChange={(id) => setCurrentSceneId(id)} 
        isAutorotateEnabled={isAutorotateEnabled}
      />

      {/* Top Title Bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-glass px-8 py-3 rounded-full shadow-2xl border border-white/20 flex items-center space-x-4">
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
          <h1 className="text-xl font-bold tracking-widest drop-shadow-md">
            {currentScene.name}
          </h1>
        </div>
      </div>

      {/* Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="absolute top-6 left-6 z-20 p-3 bg-glass rounded-xl hover:bg-white/20 transition-all duration-300 group"
      >
        <div className="w-6 h-0.5 bg-white mb-1.5 transition-all group-hover:w-4"></div>
        <div className="w-6 h-0.5 bg-white mb-1.5"></div>
        <div className="w-6 h-0.5 bg-white transition-all group-hover:w-4"></div>
      </button>

      {/* Sidebar */}
      <div className={`absolute top-0 left-0 h-full w-80 bg-black/40 backdrop-blur-2xl z-30 transform transition-transform duration-500 border-r border-white/10 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              场景列表
            </h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-white/50 hover:text-white">
              ✕
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {APP_DATA.scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => {
                  setCurrentSceneId(scene.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full text-left px-5 py-4 rounded-xl transition-all duration-300 flex items-center space-x-4 group ${
                  currentSceneId === scene.id 
                  ? 'bg-blue-500/20 border border-blue-400/50 text-blue-300' 
                  : 'bg-white/5 border border-transparent hover:bg-white/10 text-white/70'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${currentSceneId === scene.id ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]' : 'bg-white/20'}`}></div>
                <span className="truncate font-medium">{scene.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      {isWelcomeOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity duration-500">
          <div className="bg-glass p-10 rounded-[2rem] border border-white/20 shadow-2xl max-w-lg w-full mx-4 text-center transform transition-all scale-100">
            <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-blue-400/30">
              <img src="/img/link.png" className="w-12 h-12 animate-pulse" alt="Logo" />
            </div>
            <h2 className="text-4xl font-black mb-4 tracking-tight">山西财专</h2>
            <p className="text-blue-200 text-xl mb-8 font-light tracking-widest">“云上”游校园</p>
            <div className="space-y-4 mb-10 text-white/60 text-sm leading-relaxed">
              <p>欢迎来到山西省财政税务专科学校</p>
              <p>点击热点进行场景跳转，拖动屏幕探索校园</p>
            </div>
            <button 
              onClick={() => setIsWelcomeOpen(false)}
              className="w-full py-5 bg-white text-blue-900 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-xl active:scale-95"
            >
              开启云端之旅
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-8 right-8 z-10 flex space-x-4">
        <button 
          onClick={() => setIsAutorotateEnabled(!isAutorotateEnabled)}
          className={`p-4 bg-glass rounded-2xl transition-all shadow-lg border border-white/10 group ${isAutorotateEnabled ? 'bg-blue-500/40 border-blue-400/50' : 'hover:bg-white/20'}`}
          title="自动旋转"
        >
          <div className={`w-6 h-6 flex items-center justify-center transition-transform duration-500 ${isAutorotateEnabled ? 'rotate-180' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 opacity-70 group-hover:opacity-100">
              <path d="M21 12a9 9 0 11-9-9c2.52 0 4.85.83 6.72 2.24" />
              <path d="M21 3v9h-9" />
            </svg>
          </div>
        </button>
        <button 
          onClick={toggleMute}
          className="p-4 bg-glass rounded-2xl hover:bg-white/20 transition-all shadow-lg border border-white/10 group"
          title="背景音乐"
        >
          <img src={isMuted ? "/img/pause.png" : "/img/play.png"} className="w-6 h-6 opacity-70 group-hover:opacity-100" alt="Mute" />
        </button>
        <button 
          onClick={toggleFullscreen}
          className="p-4 bg-glass rounded-2xl hover:bg-white/20 transition-all shadow-lg border border-white/10 group"
          title="全屏显示"
        >
          <img src="/img/fullscreen.png" className="w-6 h-6 opacity-70 group-hover:opacity-100" alt="Fullscreen" />
        </button>
        <button 
          onClick={toggleInfo}
          className="p-4 bg-glass rounded-2xl hover:bg-white/20 transition-all shadow-lg border border-white/10 group"
          title="帮助说明"
        >
          <img src="/img/info.png" className="w-6 h-6 opacity-70 group-hover:opacity-100" alt="Help" />
        </button>
      </div>

      {/* Info Modal */}
      {isInfoOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="bg-glass p-8 rounded-3xl border border-white/20 shadow-2xl max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold mb-6 text-blue-300">操作指南</h3>
            <div className="space-y-4 text-white/80 leading-relaxed">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center mt-1">
                  <span className="text-xs">1</span>
                </div>
                <p>拖动屏幕可旋转视角，探索校园美景。</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center mt-1">
                  <span className="text-xs">2</span>
                </div>
                <p>点击蓝色闪烁的“前进”图标，可跳转至下一个场景。</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500/20 rounded flex items-center justify-center mt-1">
                  <span className="text-xs">3</span>
                </div>
                <p>点击左上角菜单，可快速切换至不同校区场景。</p>
              </div>
            </div>
            <button 
              onClick={() => setIsInfoOpen(false)}
              className="w-full mt-8 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-colors"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      <audio ref={audioRef} src="/sxcz.mp3" loop />
    </div>
  );
}

export default App;
