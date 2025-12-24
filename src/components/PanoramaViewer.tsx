import React, { useEffect, useRef } from 'react';
import { APP_DATA } from '../data';
import type { Scene } from '../data';

interface PanoramaViewerProps {
  currentSceneId: string;
  onSceneChange: (sceneId: string) => void;
  isAutorotateEnabled: boolean;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ currentSceneId, onSceneChange, isAutorotateEnabled }) => {
  const viewerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scenesRef = useRef<Record<string, any>>({});
  const autorotateRef = useRef<any>(null);
  const onSceneChangeRef = useRef(onSceneChange);

  useEffect(() => {
    onSceneChangeRef.current = onSceneChange;
  }, [onSceneChange]);

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const Marzipano = (window as any).Marzipano;
    if (!Marzipano) {
      console.error('Marzipano library not found. Please ensure it is loaded in index.html');
      return;
    }

    const viewerOpts = {
      controls: { mouseViewMode: APP_DATA.settings.mouseViewMode }
    };

    const viewer = new Marzipano.Viewer(containerRef.current, viewerOpts);
    viewerRef.current = viewer;

    // Initialize autorotate
    autorotateRef.current = Marzipano.autorotate({
      yawSpeed: 0.03,
      targetPitch: 0,
      targetFov: Math.PI/2
    });

    // Initialize all scenes
    console.log('Initializing scenes and hotspots...');
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
        console.log(`Creating link hotspot for scene ${sceneData.id} -> ${hotspot.target}`);
        const element = document.createElement('div');
        element.className = 'link-hotspot animate-pulse-slow cursor-pointer';
        
        const img = document.createElement('img');
        img.src = `${baseUrl}/img/link.png`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        img.style.transition = 'transform 0.3s';
        img.style.transform = `rotate(${hotspot.rotation}rad)`;
        img.onerror = () => console.error('Failed to load hotspot image: /img/link.png');
        
        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.style.bottom = '100%';
        tooltip.style.left = '50%';
        tooltip.style.transform = 'translateX(-50%)';
        tooltip.style.marginBottom = '8px';
        tooltip.style.padding = '4px 12px';
        tooltip.style.backgroundColor = 'rgba(0,0,0,0.8)';
        tooltip.style.color = 'white';
        tooltip.style.fontSize = '12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.whiteSpace = 'nowrap';
        tooltip.style.display = 'none'; // 默认隐藏
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '1001';
        
        const targetScene = APP_DATA.scenes.find(s => s.id === hotspot.target);
        tooltip.innerText = targetScene ? targetScene.name : '';

        element.appendChild(img);
        element.appendChild(tooltip);
        
        element.onmouseenter = () => { tooltip.style.display = 'block'; };
        element.onmouseleave = () => { tooltip.style.display = 'none'; };
        
        element.onclick = () => {
          console.log('Switching to scene:', hotspot.target);
          onSceneChangeRef.current(hotspot.target);
        };
        
        // Prevent event propagation
        ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'].forEach(event => {
          element.addEventListener(event, e => e.stopPropagation());
        });
        
        scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
      });

      // Create info hotspots
      sceneData.infoHotspots.forEach(hotspot => {
        console.log(`Creating info hotspot for scene ${sceneData.id}: ${hotspot.title}`);
        const element = document.createElement('div');
        element.className = 'info-hotspot animate-pulse-slow cursor-pointer';
        
        const img = document.createElement('img');
        img.src = '/img/info.png';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.display = 'block';
        img.onerror = () => console.error('Failed to load hotspot image: /img/info.png');
        
        element.appendChild(img);
        
        element.onclick = () => {
            alert(`${hotspot.title}: ${hotspot.text}`);
        };

        // Prevent event propagation
        ['touchstart', 'touchmove', 'touchend', 'touchcancel', 'wheel', 'mousewheel'].forEach(event => {
          element.addEventListener(event, e => e.stopPropagation());
        });
        
        scene.hotspotContainer().createHotspot(element, { yaw: hotspot.yaw, pitch: hotspot.pitch });
      });

      scenesRef.current[sceneData.id] = scene;
    });

    // Switch to initial scene
    if (scenesRef.current[currentSceneId]) {
      scenesRef.current[currentSceneId].switchTo();
    }

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (viewerRef.current && scenesRef.current[currentSceneId]) {
      scenesRef.current[currentSceneId].switchTo();
    }
  }, [currentSceneId]);

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

  return (
    <div ref={containerRef} className="w-full h-full absolute inset-0" />
  );
};

export default PanoramaViewer;
