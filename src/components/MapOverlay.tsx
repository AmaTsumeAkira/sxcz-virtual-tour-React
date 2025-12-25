import React, { useRef } from 'react';
import type { Scene } from '../data';

interface MapOverlayProps {
  currentSceneId: string;
  onSceneChange: (sceneId: string) => void;
  baseUrl: string;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  scenes: Scene[];
  onUpdateScene?: (id: string, pos: { x: number; y: number }) => void;
}

const MapOverlay: React.FC<MapOverlayProps> = ({ 
  currentSceneId, 
  onSceneChange, 
  baseUrl, 
  isOpen, 
  onClose,
  isAdmin,
  scenes,
  onUpdateScene
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  if (!isOpen) return null;

  const handleDrag = (e: React.MouseEvent | React.TouchEvent, sceneId: string) => {
    if (!isAdmin || !onUpdateScene || !mapRef.current) return;
    
    e.preventDefault();
    const mapRect = mapRef.current.getBoundingClientRect();
    
    const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      
      let x = ((clientX - mapRect.left) / mapRect.width) * 100;
      let y = ((clientY - mapRect.top) / mapRect.height) * 100;
      
      // Clamp values
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));
      
      onUpdateScene(sceneId, { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
    };

    const upHandler = () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', upHandler);
      window.removeEventListener('touchmove', moveHandler);
      window.removeEventListener('touchend', upHandler);
    };

    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', upHandler);
    window.addEventListener('touchmove', moveHandler);
    window.addEventListener('touchend', upHandler);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-xl transition-all duration-500 p-4">
      <div className="bg-glass p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-white/20 shadow-2xl max-w-4xl w-full relative animate-float max-h-[90dvh] flex flex-col">
        <div className="flex justify-between items-center mb-6 px-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-blue-400 font-black uppercase tracking-widest">
              {isAdmin ? 'ADMIN MODE - DRAG TO POSITION' : 'Campus Map'}
            </span>
            <span className="text-2xl md:text-3xl font-black text-white">校园导览地图</span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-full flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="relative flex-1 bg-black/20 rounded-2xl overflow-hidden border border-white/5 min-h-[50vh] flex items-center justify-center p-2 md:p-4">
          <div 
            ref={mapRef}
            className="relative inline-block"
          >
            <img 
              src={`${baseUrl}/map.png`} 
              className="max-w-full max-h-[70vh] block pointer-events-none rounded-lg shadow-2xl select-none" 
              alt="Campus Map" 
            />
            
            {/* Scene Markers */}
            {scenes.map((scene) => {
              const hasPos = scene.mapPos !== undefined;
              if (!hasPos && !isAdmin) return null;

              // Default position for markers without mapPos in admin mode
              const pos = scene.mapPos || { x: 50, y: 50 };

              return (
                <button
                  key={scene.id}
                  onMouseDown={(e) => isAdmin && handleDrag(e, scene.id)}
                  onTouchStart={(e) => isAdmin && handleDrag(e, scene.id)}
                  onClick={() => {
                    if (!isAdmin) {
                      onSceneChange(scene.id);
                      onClose();
                    }
                  }}
                  className={`absolute group z-10 ${isAdmin ? 'cursor-move' : 'cursor-pointer'}`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div className={`w-4 h-4 md:w-5 md:h-5 -ml-2 -mt-2 md:-ml-2.5 md:-mt-2.5 rounded-full border-2 border-white shadow-lg transition-all duration-300 ${
                    isAdmin ? 'bg-orange-500 scale-110' : 
                    currentSceneId === scene.id ? 'bg-blue-500 scale-125' : 'bg-white/40 group-hover:bg-white'
                  }`}>
                    {currentSceneId === scene.id && !isAdmin && (
                      <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                    )}
                  </div>
                  
                  {/* Tooltip */}
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-black/90 backdrop-blur-md text-xs font-bold text-white rounded-xl border border-white/10 transition-all transform ${
                    isAdmin ? 'opacity-100 translate-y-0' : 'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'
                  } pointer-events-none whitespace-nowrap shadow-2xl`}>
                    {scene.name} {isAdmin && `(${pos.x}, ${pos.y})`}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-white/30 text-[10px] uppercase tracking-[0.2em] font-bold">
            {isAdmin ? '管理员模式：拖动橙色点位进行定位，完成后在控制台输入 map 查看数据' : '点击地图上的点位即可快速跳转场景'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapOverlay;
