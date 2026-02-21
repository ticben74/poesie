
import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { Narrative } from '../types';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PoetryBabylonStageProps {
  items: Narrative[];
  role: 'visitor' | 'editor' | 'coordinator';
  onSelectItem: (item: Narrative) => void;
  selectedId?: number;
  scrollDepth?: number;
  mouseTilt?: { x: number; y: number };
  onUpdateItem?: (id: number, x: number, y: number, z: number) => void;
  isBlurred?: boolean;
  viewMode?: 'stars' | 'cards';
}

// ─── Poem Node Data ────────────────────────────────────────────────────────────
interface PoemNode {
  id: number;
  mesh: BABYLON.Mesh;
  glowMesh?: BABYLON.Mesh;
  label: GUI.Rectangle;
  titleText: GUI.TextBlock;
  item: Narrative;
  baseScaling: BABYLON.Vector3;
  basePosition: BABYLON.Vector3;
  hoverWeight: number; // For smooth transitions (0 to 1)
}

// ─── Mural Style Helpers ───────────────────────────────────────────────────────
const getMuralColors = (style?: string) => {
  switch (style) {
    case 'stencil': 
      return { main: "#ffffff", grad: ["#000000", "#333333"], babylon: new BABYLON.Color3(0.9, 0.9, 0.9) };
    case 'neon':    
      return { main: "#00ffff", grad: ["#00ffff", "#ff00ff"], babylon: new BABYLON.Color3(0.3, 0.8, 1.0) };
    case 'ancient': 
      return { main: "#ffd700", grad: ["#5d4037", "#d7ccc8"], babylon: new BABYLON.Color3(0.8, 0.65, 0.3) };
    default: // urban
      return { main: "#a855f7", grad: ["#4c1d95", "#3b82f6"], babylon: new BABYLON.Color3(0.7, 0.3, 1.0) };
  }
};

const createMuralGradientTexture = (style: string | undefined, scene: BABYLON.Scene): BABYLON.DynamicTexture => {
  const config = getMuralColors(style);
  const tex = new BABYLON.DynamicTexture(`grad-${style}`, 512, scene, true);
  const ctx = tex.getContext();
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, config.grad[0]);
  grad.addColorStop(1, config.grad[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);
  tex.update();
  return tex;
};

// ─── Component ─────────────────────────────────────────────────────────────────
const PoetryBabylonStage: React.FC<PoetryBabylonStageProps> = ({
  items,
  role,
  onSelectItem,
  selectedId,
  scrollDepth = 0,
  mouseTilt = { x: 0, y: 0 },
  onUpdateItem,
  isBlurred = false,
  viewMode = 'stars',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<BABYLON.Engine | null>(null);
  const sceneRef = useRef<BABYLON.Scene | null>(null);
  const nodesRef = useRef<Map<number, PoemNode>>(new Map());
  const starfieldRef = useRef<BABYLON.Mesh[]>([]);
  const dustRef = useRef<BABYLON.ParticleSystem | null>(null);
  const glowLayerRef = useRef<BABYLON.GlowLayer | null>(null);
  const advTexRef = useRef<BABYLON.GUI.AdvancedDynamicTexture | null>(null);
  const autoRotRef = useRef<number>(0);
  const isRotatingRef = useRef<boolean>(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  // For smooth interpolation
  const targetRadiusRef = useRef<number>(55);
  const targetTiltXRef = useRef<number>(0);
  const targetTiltYRef = useRef<number>(0);

  const toWorld = useCallback((item: Narrative): BABYLON.Vector3 => {
    const wx = ((item.x / 100) - 0.5) * 60;
    const wy = -((item.y / 100) - 0.5) * 40;
    const wz = ((item.z || 0) / 1000) * 3;
    return new BABYLON.Vector3(wx, wy, wz);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      antialias: true,
    });
    engineRef.current = engine;

    const scene = new BABYLON.Scene(engine);
    sceneRef.current = scene;

    scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.01, 1);
    scene.ambientColor = new BABYLON.Color3(0.05, 0.05, 0.08);
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.006;
    scene.fogColor = new BABYLON.Color3(0.02, 0.02, 0.04);

    const camera = new BABYLON.ArcRotateCamera(
      'cam',
      -Math.PI / 2,
      Math.PI / 2.5,
      55,
      BABYLON.Vector3.Zero(),
      scene,
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 10;
    camera.upperRadiusLimit = 200;
    camera.wheelDeltaPercentage = 0.008;

    const hemi = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.2;

    const glowLayer = new BABYLON.GlowLayer('glow', scene);
    glowLayer.intensity = 0.8;
    glowLayerRef.current = glowLayer;

    // Background Stars
    for (let i = 0; i < 400; i++) {
      const star = BABYLON.MeshBuilder.CreateSphere(`star${i}`, { diameter: 0.06 + Math.random() * 0.15 }, scene);
      const r = 90 + Math.random() * 80;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      star.position = new BABYLON.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      );
      const starMat = new BABYLON.StandardMaterial(`starMat${i}`, scene);
      const brightness = 0.6 + Math.random() * 0.4;
      starMat.emissiveColor = new BABYLON.Color3(brightness, brightness, brightness * 1.2);
      star.material = starMat;
      starfieldRef.current.push(star);
    }

    // Dust system
    const dust = new BABYLON.ParticleSystem('dust', 1000, scene);
    dust.particleTexture = new BABYLON.Texture('https://www.babylonjs-playground.com/textures/flare.png', scene);
    dust.emitter = BABYLON.Vector3.Zero();
    dust.minEmitBox = new BABYLON.Vector3(-60, -40, -40);
    dust.maxEmitBox = new BABYLON.Vector3(60, 40, 40);
    dust.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 0.1);
    dust.color2 = new BABYLON.Color4(0.4, 0.2, 0.8, 0.05);
    dust.minSize = 0.05; dust.maxSize = 0.25;
    dust.minLifeTime = 10; dust.maxLifeTime = 20;
    dust.emitRate = 120;
    dust.start();
    dustRef.current = dust;

    const advTex = GUI.AdvancedDynamicTexture.CreateFullscreenUI('UI');
    advTexRef.current = advTex;

    scene.registerBeforeRender(() => {
      const t = Date.now() * 0.001;
      
      // 1. Smooth Camera Scroll & Rotation
      if (isRotatingRef.current && role === 'visitor') {
        autoRotRef.current += 0.003;
        camera.alpha = BABYLON.Scalar.Lerp(camera.alpha, -Math.PI / 2 + autoRotRef.current, 0.1);
      }

      // 2. Immersive Scroll Depth & Mouse Parallax mapping
      targetRadiusRef.current = 55 + (scrollDepth || 0);
      camera.radius = BABYLON.Scalar.Lerp(camera.radius, targetRadiusRef.current, 0.05);
      
      targetTiltXRef.current = (mouseTilt.x / 40);
      targetTiltYRef.current = (mouseTilt.y / 40);
      
      camera.beta = BABYLON.Scalar.Lerp(camera.beta, Math.PI / 2.5 + targetTiltYRef.current, 0.05);
      
      // 3. Apply deep parallax to environment
      const parallaxFactor = 0.05;
      starfieldRef.current.forEach((star, i) => {
        const offset = i * 0.1;
        star.position.x += Math.sin(t * 0.2 + offset) * 0.001;
        star.position.x += (mouseTilt.x * parallaxFactor * 0.1);
        star.position.y += (mouseTilt.y * parallaxFactor * 0.1);
      });

      if (dustRef.current) {
        dustRef.current.emitter = new BABYLON.Vector3(
          mouseTilt.x * 0.5, 
          mouseTilt.y * 0.5, 
          -scrollDepth * 0.2
        );
      }

      // 4. Animate Nodes with Pulses & Parallax
      nodesRef.current.forEach((node, id) => {
        const offset = node.id * 0.4;
        
        // Parallax Offset
        const px = mouseTilt.x * 0.05;
        const py = mouseTilt.y * 0.05;
        const pz = -scrollDepth * 0.1;
        
        node.mesh.position.x = BABYLON.Scalar.Lerp(node.mesh.position.x, node.basePosition.x + px, 0.1);
        node.mesh.position.y = BABYLON.Scalar.Lerp(node.mesh.position.y, node.basePosition.y + py + Math.sin(t * 0.8 + offset) * 0.005, 0.1);
        node.mesh.position.z = BABYLON.Scalar.Lerp(node.mesh.position.z, node.basePosition.z + pz, 0.1);

        if (node.glowMesh) {
          node.glowMesh.position.copyFrom(node.mesh.position);
        }

        if (role === 'visitor') {
          const isActive = id === selectedId;
          const isHovered = id === hoveredId;
          
          // --- MAGICAL HOVER SMOOTHING ---
          const targetWeight = (isHovered || isActive) ? 1.0 : 0.0;
          node.hoverWeight = BABYLON.Scalar.Lerp(node.hoverWeight, targetWeight, 0.1);

          // Interpolated pulse speed and amplitude
          // Base: 1.0 speed, 0.05 amp
          // Active: 3.0 speed, 0.15 amp
          // Hovered: 2.0 speed, 0.10 amp
          const maxSpeed = isActive ? 3.0 : 2.0;
          const maxAmp = isActive ? 0.15 : 0.10;
          
          const pulseSpeed = 1.0 + (node.hoverWeight * (maxSpeed - 1.0));
          const pulseAmp = 0.05 + (node.hoverWeight * (maxAmp - 0.05));
          
          const scaleFactor = 1 + Math.sin(t * pulseSpeed + offset) * pulseAmp;
          node.mesh.scaling = node.baseScaling.scale(scaleFactor);
          
          if (node.glowMesh) {
            // Glow mesh expands further on hover
            const glowExpandFactor = 1.5 + (node.hoverWeight * 0.5);
            node.glowMesh.scaling = node.baseScaling.scale(scaleFactor * glowExpandFactor);
            const glowMat = node.glowMesh.material as BABYLON.StandardMaterial;
            if (glowMat) {
              // Brighten alpha on hover
              const baseAlpha = 0.12 + (node.hoverWeight * 0.13);
              glowMat.alpha = baseAlpha + Math.sin(t * pulseSpeed + offset) * 0.05;
            }
          }

          // Subtle extra rotation when hovered
          if (viewMode === 'stars') {
            const rotSpeed = 0.008 + (node.hoverWeight * 0.012);
            node.mesh.rotation.y += rotSpeed;
          }
        } else if (viewMode === 'stars') {
          node.mesh.rotation.y += 0.008;
        }
      });
    });

    engine.runRenderLoop(() => scene.render());
    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    const advTex = advTexRef.current;
    const glowLayer = glowLayerRef.current;
    if (!scene || !advTex || !glowLayer) return;

    nodesRef.current.forEach((node) => {
      node.mesh.dispose();
      node.glowMesh?.dispose();
      advTex.removeControl(node.label);
    });
    nodesRef.current.clear();

    items.forEach((item) => {
      const pos = toWorld(item);
      const isMural = item.type === 'mural';
      const styleConfig = getMuralColors(item.style);

      let mesh: BABYLON.Mesh;
      if (viewMode === 'stars') {
        mesh = BABYLON.MeshBuilder.CreateSphere(`poem-${item.id}`, { diameter: isMural ? 0.8 : 0.5 }, scene);
      } else {
        mesh = BABYLON.MeshBuilder.CreatePlane(`poem-${item.id}`, { width: isMural ? 6 : 4, height: isMural ? 4 : 5.5 }, scene);
      }
      mesh.position = pos.clone();
      mesh.isPickable = true;

      const mat = new BABYLON.StandardMaterial(`mat-${item.id}`, scene);
      mat.disableLighting = true;

      if (isMural) {
        const gradTex = createMuralGradientTexture(item.style, scene);
        if (viewMode === 'cards') {
          mat.diffuseTexture = new BABYLON.Texture(item.image, scene);
          mat.emissiveTexture = gradTex;
          mat.emissiveColor = new BABYLON.Color3(1, 1, 1);
          mat.useEmissiveAsIllumination = true;
          mat.alpha = 0.9;
        } else {
          mat.emissiveTexture = gradTex;
          mat.emissiveColor = styleConfig.babylon;
        }
      } else {
        mat.emissiveColor = new BABYLON.Color3(0.85, 0.9, 1.0);
        if (viewMode === 'cards') {
          mat.diffuseTexture = new BABYLON.Texture(item.image, scene);
          mat.alpha = 0.85;
        }
      }

      mesh.material = mat;
      glowLayer.addIncludedOnlyMesh(mesh);

      let glowMesh: BABYLON.Mesh | undefined;
      if (viewMode === 'stars') {
        glowMesh = BABYLON.MeshBuilder.CreateSphere(`glow-${item.id}`, { diameter: isMural ? 2.5 : 1.8 }, scene);
        glowMesh.position = pos.clone();
        const glowMat = new BABYLON.StandardMaterial(`glowMat-${item.id}`, scene);
        glowMat.emissiveColor = styleConfig.babylon.scale(0.3);
        glowMat.alpha = 0.12;
        glowMesh.material = glowMat;
        glowLayer.addIncludedOnlyMesh(glowMesh);
      }

      const rect = new GUI.Rectangle(`rect-${item.id}`);
      rect.width = '180px'; rect.height = '36px'; rect.cornerRadius = 18;
      rect.thickness = 1;
      rect.color = isMural ? 'rgba(167,139,250,0.7)' : 'rgba(96,165,250,0.6)';
      rect.background = 'rgba(2,2,10,0.75)';
      rect.isVisible = false;
      advTex.addControl(rect);
      rect.linkWithMesh(mesh);
      rect.linkOffsetY = viewMode === 'stars' ? -40 : -110;

      const titleText = new GUI.TextBlock(`title-${item.id}`);
      titleText.text = item.title;
      titleText.color = 'white'; titleText.fontSize = 11;
      rect.addControl(titleText);

      mesh.actionManager = new BABYLON.ActionManager(scene);
      mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOverTrigger, () => {
        rect.isVisible = true;
        setHoveredId(item.id);
        isRotatingRef.current = false;
        document.body.style.cursor = 'pointer';
      }));
      mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPointerOutTrigger, () => {
        rect.isVisible = false;
        setHoveredId(null);
        if (role === 'visitor') isRotatingRef.current = true;
        document.body.style.cursor = 'default';
      }));
      mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, () => {
        onSelectItem(item);
      }));

      nodesRef.current.set(item.id, { 
        id: item.id, mesh, glowMesh, label: rect, titleText, item,
        baseScaling: mesh.scaling.clone(),
        basePosition: mesh.position.clone(),
        hoverWeight: 0.0
      });
    });
  }, [items, viewMode, role]);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none outline-none" style={{ background: 'transparent' }} />
  );
};

export default PoetryBabylonStage;
