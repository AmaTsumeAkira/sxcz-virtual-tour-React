import React, { useEffect, useRef } from 'react';
import { APP_DATA } from '../data';
import type { Scene } from '../data';

interface PanoramaViewerProps {
  currentSceneId: string;
  onSceneChange: (sceneId: string) => void;
  isAutorotateEnabled: boolean;
  isGyroEnabled: boolean;
  onInfoHotspotClick: (title: string, text: string) => void;
  onLoadingChange: (isLoading: boolean) => void;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ 
  currentSceneId, 
  onSceneChange, 
  isAutorotateEnabled,
  isGyroEnabled,
  onInfoHotspotClick,
  onLoadingChange
}) => {
  const viewerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scenesRef = useRef<Record<string, any>>({});
  const autorotateRef = useRef<any>(null);
  const onSceneChangeRef = useRef(onSceneChange);
  const deviceOrientationControlMethodRef = useRef<any>(null);

  useEffect(() => {
    onSceneChangeRef.current = onSceneChange;
  }, [onSceneChange]);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const Marzipano = (window as any).Marzipano;
    const DeviceOrientationControlMethod = (window as any).DeviceOrientationControlMethod;
    
    if (!Marzipano) {
      console.error('Marzipano library not found.');
      return;
    }

    const viewerOpts = {
      controls: { mouseViewMode: APP_DATA.settings.mouseViewMode }
    };

    const viewer = new Marzipano.Viewer(containerRef.current, viewerOpts);
    viewerRef.current = viewer;

    // Initialize Gyroscope if available
    if (DeviceOrientationControlMethod) {
      try {
        deviceOrientationControlMethodRef.current = new DeviceOrientationControlMethod();
        const controls = viewer.controls();
        controls.registerMethod('deviceOrientation', deviceOrientationControlMethodRef.current);
      } catch (err) {
        console.warn('Gyroscope not supported or permission denied:', err);
      }
    }

    // Initialize autorotate
    autorotateRef.current = Marzipano.autorotate({
      yawSpeed: 0.03,
      targetPitch: 0,
      targetFov: Math.PI/2
    });

    // Initialize all scenes
    const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
    APP_DATA.scenes.forEach((sceneData: Scene) => {
      const source = Marzipano.ImageUrlSource.fromString(
        `${baseUrl}/tiles/${sceneData.id}/{z}/{f}/{y}/{x}.jpg`,
        { cubeMapPreviewUrl: `${baseUrl}/tiles/${sceneData.id}/preview.jpg` }
      );
      
      const geometry = new Marzipano.CubeGeometry(sceneData.levels);
      const limiter = Marzipano.RectilinearView.limit.traditional(
        sceneData.faceSize, 
        100*Math.PI/180, 
        120*Math.PI/180
      );
      
      const view = new Marzipano.RectilinearView(sceneData.initialViewParameters, limiter);
      const scene = viewer.createScene({
        source: source,
        geometry: geometry,
        view: view,
        pinFirstLevel: true
      });

      // Create link hotspots
      sceneData.linkHotspots.forEach(hotspot => {
        const element = document.createElement('div');
        element.className = 'link-hotspot cursor-pointer group';
        
        const img = document.createElement('img');
        img.className = 'animate-pulse-slow';
        img.src = `${baseUrl}/img/link.png`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        img.style.setProperty('--hotspot-rotate', `${hotspot.rotation}rad`);
        img.style.transform = `rotate(${hotspot.rotation}rad)`;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-black/80 backdrop-blur-md text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow-xl';
        
        const targetScene = APP_DATA.scenes.find(s => s.id === hotspot.target);
        tooltip.innerText = targetScene ? `前往：${targetScene.name}` : '';

        element.appendChild(img);
        element.appendChild(tooltip);
        
        element.onclick = () => {
          onSceneChangeRef.current(hotspot.target);
        };
        
        // Add passive: true to resolve browser violations where preventDefault is not needed
        ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'].forEach(event => {
          element.addEventListener(event, e => e.stopPropagation(), { passive: true });
        });
        
        scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
      });

      // Create info hotspots
      sceneData.infoHotspots.forEach(hotspot => {
        const element = document.createElement('div');
        element.className = 'info-hotspot cursor-pointer group';
        
        const img = document.createElement('img');
        img.className = 'animate-pulse-slow';
        img.src = `${baseUrl}/img/info.png`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-3 py-1.5 bg-blue-600/90 backdrop-blur-md text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/20 shadow-xl';
        tooltip.innerText = hotspot.title;

        element.appendChild(img);
        element.appendChild(tooltip);
        
        element.onclick = () => {
          onInfoHotspotClick(hotspot.title, hotspot.text);
        };

        // Add passive: true to resolve browser violations where preventDefault is not needed
        ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'].forEach(event => {
          element.addEventListener(event, e => e.stopPropagation(), { passive: true });
        });
        
        scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
      });

      scenesRef.current[sceneData.id] = scene;
    });

    // Switch to initial scene immediately after initialization
    const initialScene = scenesRef.current[currentSceneId];
    if (initialScene) {
      console.log('Switching to initial scene:', currentSceneId);
      initialScene.switchTo({ transitionDuration: 1 });
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [onInfoHotspotClick]); // Removed currentSceneId from here to avoid re-init

  useEffect(() => {
    const scene = scenesRef.current[currentSceneId];
    if (scene && viewerRef.current) {
      // Check if it's already the current scene to avoid redundant transitions
      if (viewerRef.current.scene() === scene) return;

      onLoadingChange(true);
      console.log('Switching scene to:', currentSceneId);
      
      // Use transitionDuration: 0 to ensure instant swap
      scene.switchTo({ transitionDuration: 0 }, () => {
        onLoadingChange(false);
      });
    }
  }, [currentSceneId, onLoadingChange]);

  useEffect(() => {
    if (viewerRef.current && autorotateRef.current) {
      if (isAutorotateEnabled) {
        viewerRef.current.startMovement(autorotateRef.current);
        viewerRef.current.setIdleMovement(3000, autorotateRef.current);
      } else {
        viewerRef.current.stopMovement();
        viewerRef.current.setIdleMovement(Infinity);
      }
    }
  }, [isAutorotateEnabled]);

  useEffect(() => {
    if (viewerRef.current && deviceOrientationControlMethodRef.current) {
      const controls = viewerRef.current.controls();
      if (isGyroEnabled) {
        // Modern browsers (iOS 13+) require permission request
        const requestPermission = (DeviceOrientationEvent as any).requestPermission;
        if (typeof requestPermission === 'function') {
          requestPermission()
            .then((response: string) => {
              if (response === 'granted') {
                controls.enableMethod('deviceOrientation');
              } else {
                console.warn('Gyroscope permission denied');
              }
            })
            .catch((err: any) => {
              console.error('Gyroscope permission error:', err);
            });
        } else {
          // Older browsers or non-iOS
          controls.enableMethod('deviceOrientation');
        }
      } else {
        controls.disableMethod('deviceOrientation');
      }
    }
  }, [isGyroEnabled]);

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0" />
  );
};

export default PanoramaViewer;
