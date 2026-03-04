'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as PIXI from 'pixi.js';
import { X, Maximize2, RefreshCw, Play, Smile, Eye, EyeOff, Video, VideoOff } from 'lucide-react';
// import { FaceMesh } from '@mediapipe/face_mesh'; // Removed due to module issues
import * as Kalidokit from 'kalidokit';

// Simple Camera Implementation to replace @mediapipe/camera_utils which has module issues
class Camera {
    private video: HTMLVideoElement;
    private onFrame: () => Promise<void> | null;
    private isRunning: boolean = false;
    private rafId: number | null = null;
    private facingMode: string = 'user';

    constructor(video: HTMLVideoElement, options: { onFrame: () => Promise<void> | null, width?: number, height?: number, facingMode?: string }) {
        this.video = video;
        this.onFrame = options.onFrame;
        this.facingMode = options.facingMode || 'user';
    }

    async start() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error("Browser API navigator.mediaDevices.getUserMedia not available");
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });
            this.video.srcObject = stream;
            this.video.onloadedmetadata = () => {
                this.video.play();
                this.isRunning = true;
                this.tick();
            };
        } catch (e) {
            console.error("Failed to start camera:", e);
        }
    }

    stop() {
        this.isRunning = false;
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        if (this.video.srcObject) {
            const stream = this.video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    private tick = async () => {
        if (!this.isRunning) return;
        
        if (this.onFrame) {
            try {
                await this.onFrame();
            } catch (e) {
                console.error("Frame processing error:", e);
            }
        }
        
        if (this.isRunning) {
            this.rafId = requestAnimationFrame(this.tick);
        }
    }
}

// Helper to load script
const loadScript = (url: string) => {
    return new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${url}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = url;
        script.crossOrigin = 'anonymous';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script ${url}`));
        document.body.appendChild(script);
    });
};

interface Live2DViewerProps {
  modelUrl: string;
  interactive?: boolean;
  className?: string;
}

interface ModelParameter {
  id: string;
  value: number;
  min: number;
  max: number;
  defaultValue: number;
  name: string;
}

interface ModelExpression {
  name: string;
  file: string;
}

export default function Live2DViewer({ modelUrl, interactive = true, className }: Live2DViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
        console.log('[Live2DViewer] Fullscreen modal OPENED');
        document.body.style.overflow = 'hidden';
    } else {
        console.log('[Live2DViewer] Fullscreen modal CLOSED');
        document.body.style.overflow = '';
    }
    return () => {
        setMounted(false);
        document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  return (
    <>
      {/* Preview Card */}
      <div className={`relative w-full h-full group bg-gray-900 rounded-xl overflow-hidden border border-gray-800 ${className}`}>
        {/* Only render inline canvas if modal is CLOSED */}
        {!isOpen && (
            <Live2DCanvas 
                key="inline-viewer"
                modelUrl={modelUrl} 
                interactive={interactive} 
                onClick={() => {
                    console.log('[Live2DViewer] Inline viewer clicked, opening fullscreen');
                    interactive && setIsOpen(true);
                }}
                className={`w-full h-full ${interactive ? 'cursor-pointer' : ''}`}
            />
        )}
        {interactive && !isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none">
                <div className="bg-white/90 backdrop-blur text-gray-900 px-5 py-3 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 flex items-center gap-2 font-bold tracking-wide">
                    <Maximize2 size={18} />
                    <span>Inspect Model</span>
                </div>
            </div>
        )}
      </div>

      {/* Fullscreen Modal - Rendered via Portal to escape parent stacking context */}
      {isOpen && mounted && createPortal(
        <div 
            className="fixed inset-0 flex items-center justify-center bg-black animate-in fade-in duration-300"
            style={{ zIndex: 2147483647 }}
        >
          {/* Overlay to handle closing when clicking outside */}
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />

          <div className="bg-[#1a1a1a] w-full h-full md:max-w-[1800px] md:max-h-[95vh] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative border border-gray-800 ring-1 ring-white/10 mx-0 md:mx-4 pointer-events-auto z-10 isolate">
            
            {/* Close Button */}
            <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 md:top-6 md:right-6 z-[50] bg-black/50 hover:bg-white/20 text-white p-2 md:p-3 rounded-full backdrop-blur-md transition-all border border-white/10"
            >
                <X size={20} className="md:w-6 md:h-6" />
            </button>

            {/* Canvas Area */}
            <div className="flex-grow h-[50vh] md:h-full bg-[#0f0f0f] relative z-0 flex items-center justify-center overflow-hidden order-1 md:order-1">
                 <Live2DCanvas 
                    key="fullscreen-viewer"
                    modelUrl={modelUrl} 
                    interactive={true} 
                    showControls={true}
                    enableZoomPan={true}
                    className="w-full h-full"
                />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Re-defining Live2DCanvas to handle the split layout internally
interface Live2DCanvasProps {
    modelUrl: string;
    interactive?: boolean;
    showControls?: boolean;
    enableZoomPan?: boolean;
    onClick?: () => void;
    className?: string;
}

function Live2DCanvas({ modelUrl, interactive, showControls, enableZoomPan, onClick, className }: Live2DCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasWrapperRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const appRef = useRef<PIXI.Application | null>(null);
    const modelRef = useRef<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [parameters, setParameters] = useState<ModelParameter[]>([]);
    const [expressions, setExpressions] = useState<ModelExpression[]>([]);
    const [loading, setLoading] = useState(true);
    const [debugInfo, setDebugInfo] = useState<string>('');
    const [isMouseTracking, setIsMouseTracking] = useState(false);
    const [isFaceTracking, setIsFaceTracking] = useState(false);
    const [activeExpressions, setActiveExpressions] = useState<string[]>([]);
    const [expressionCache, setExpressionCache] = useState<Record<string, any>>({});
    const [faceMeshLoaded, setFaceMeshLoaded] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
            const mobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));
            setIsMobile(mobile);
            console.log('[Live2DViewer] Device check:', mobile ? 'Mobile' : 'Desktop');
        };
        checkMobile();
    }, []);
    
    // Zoom/Pan State
    const isDragging = useRef(false);
    const lastMousePos = useRef({ x: 0, y: 0 });

    // Face Tracking Refs
    const faceMeshRef = useRef<any>(null);
    const cameraRef = useRef<Camera | null>(null);
    const isTrackingInitializing = useRef(false);

    // Reset focus when tracking is disabled
    useEffect(() => {
        if (!isMouseTracking && !isFaceTracking && modelRef.current?.internalModel?.focusController) {
            modelRef.current.internalModel.focusController.focus(0, 0);
        }
    }, [isMouseTracking, isFaceTracking]);

    // Load FaceMesh Script
    useEffect(() => {
        if (showControls && !faceMeshLoaded) {
            // Using a specific older version known to be stable with Kalidokit
            loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/face_mesh.js')
                .then(() => {
                    console.log('FaceMesh script loaded');
                    setFaceMeshLoaded(true);
                })
                .catch(err => console.error('Failed to load FaceMesh', err));
        }
    }, [showControls, faceMeshLoaded]);

    // Face Tracking Logic
    useEffect(() => {
        if (!isFaceTracking || !faceMeshLoaded || !videoRef.current || !modelRef.current) {
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
            return;
        }

        if (isTrackingInitializing.current) return;
        isTrackingInitializing.current = true;

        const startTracking = async () => {
            try {
                // @ts-ignore
                const faceMesh = new window.FaceMesh({
                    locateFile: (file: string) => {
                        // Use a fixed version to prevent issues with auto-updates breaking functionality
                        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/${file}`;
                    }
                });

                faceMesh.setOptions({
                    maxNumFaces: 1,
                    refineLandmarks: true,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });

                let isFaceMeshReady = false;
                let active = true;

                faceMesh.onResults((results: any) => {
                    if (!active) return;
                    if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
                    
                    const landmarks = results.multiFaceLandmarks[0];
                    const solved = Kalidokit.Face.solve(landmarks, {
                        runtime: 'mediapipe',
                        video: videoRef.current
                    });
                    
                    // ... existing solving logic
                    if (solved && modelRef.current) {
                        const core = modelRef.current.internalModel.coreModel;
                        
                        // Map Kalidokit results to Live2D parameters
                        // ... (rest of mapping logic)
                        const solvedHead = solved.head.degrees;
                        const solvedEye = solved.eye;
                        const solvedMouth = solved.mouth.shape;

                        const targets = [
                            { id: 'ParamAngleX', alt: 'PARAM_ANGLE_X', value: solvedHead.y }, 
                            { id: 'ParamAngleY', alt: 'PARAM_ANGLE_Y', value: solvedHead.x },
                            { id: 'ParamAngleZ', alt: 'PARAM_ANGLE_Z', value: solvedHead.z },
                            { id: 'ParamEyeLOpen', alt: 'PARAM_EYE_L_OPEN', value: solvedEye.l },
                            { id: 'ParamEyeROpen', alt: 'PARAM_EYE_R_OPEN', value: solvedEye.r },
                            { id: 'ParamEyeBallX', alt: 'PARAM_EYE_BALL_X', value: solved.pupil.x },
                            { id: 'ParamEyeBallY', alt: 'PARAM_EYE_BALL_Y', value: solved.pupil.y },
                            { id: 'ParamMouthOpenY', alt: 'PARAM_MOUTH_OPEN_Y', value: solvedMouth.A },
                            { id: 'ParamMouthForm', alt: 'PARAM_MOUTH_FORM', value: solvedMouth.I + solvedMouth.U },
                            { id: 'ParamBodyAngleX', alt: 'PARAM_BODY_ANGLE_X', value: solvedHead.y * 0.5 },
                            { id: 'ParamBodyAngleY', alt: 'PARAM_BODY_ANGLE_Y', value: solvedHead.x * 0.5 },
                            { id: 'ParamBodyAngleZ', alt: 'PARAM_BODY_ANGLE_Z', value: solvedHead.z * 0.5 },
                        ];

                        const internal = modelRef.current.internalModel;

                        targets.forEach(({ id, alt, value }) => {
                             let targetId = id;
                             try {
                                 if (internal.coreModel && internal.coreModel.setParameterValueById) {
                                     internal.coreModel.setParameterValueById(id, value);
                                     internal.coreModel.setParameterValueById(alt, value);
                                 } 
                                 else if (internal.coreModel && internal.coreModel.setParamFloat) {
                                     let idx = -1;
                                     if (internal.coreModel.getParamIndex) {
                                         idx = internal.coreModel.getParamIndex(id);
                                         if (idx === -1) idx = internal.coreModel.getParamIndex(alt);
                                     }
                                     if (idx !== -1) {
                                         internal.coreModel.setParamFloat(idx, value);
                                     }
                                 }
                                 else if (internal.setParameterValueById) {
                                     internal.setParameterValueById(id, value);
                                     internal.setParameterValueById(alt, value);
                                 }
                             } catch(e) {}
                        });
                    }
                });

                faceMeshRef.current = faceMesh;

                // Wait for initialization (simple workaround)
                await faceMesh.initialize();
                isFaceMeshReady = true;

                if (!videoRef.current) return;

                const camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (!active) return;
                        if (videoRef.current && faceMesh && isFaceMeshReady) {
                            try {
                                await faceMesh.send({ image: videoRef.current });
                            } catch (e) {
                                // Ignore frames that are sent too quickly or if faceMesh is closed
                            }
                        }
                    },
                    width: 640,
                    height: 480,
                    facingMode: 'user' // Default to front camera
                });

                // Prevent multiple camera instances
                if (cameraRef.current) {
                    cameraRef.current.stop();
                }
                cameraRef.current = camera;
                await camera.start();
                
                // Store cleanup function in ref or return it
                return () => {
                    active = false;
                    camera.stop();
                    faceMesh.close();
                };

            } catch (err) {
                console.error("Failed to start face tracking:", err);
                setIsFaceTracking(false); // Disable on error to prevent loop
                setError("Face tracking failed to initialize. It may not be supported on this device.");
            } finally {
                isTrackingInitializing.current = false;
            }
        };

        const cleanupPromise = startTracking();

        return () => {
            isTrackingInitializing.current = false;
            cleanupPromise.then(cleanup => cleanup && cleanup());
            if (cameraRef.current) {
                cameraRef.current.stop();
                cameraRef.current = null;
            }
            if (faceMeshRef.current) {
                faceMeshRef.current.close();
                faceMeshRef.current = null;
            }
        };
    }, [isFaceTracking, faceMeshLoaded]);
    
    // Initialize PIXI
    useEffect(() => {
        let mounted = true;
        let resizeObserver: ResizeObserver | null = null;
        let resizeTimeout: NodeJS.Timeout;
        let checkTimeout: NodeJS.Timeout;
        let attempts = 0;

        setLoading(true);

        let resizeRetries = 0;

        const resize = () => {
            const app = appRef.current;
            const model = modelRef.current;
            if (!app || !app.view || !canvasWrapperRef.current || !model) return;
            
            const w = canvasWrapperRef.current.clientWidth;
            const h = canvasWrapperRef.current.clientHeight;
            
            if (w === 0 || h === 0) return;

            // Only resize if dimensions actually changed significantly to avoid loops
            const curW = app.renderer.width / app.renderer.resolution;
            const curH = app.renderer.height / app.renderer.resolution;
            
            // On mobile, ignore small height changes which might be address bar toggling
            const isMobile = window.innerWidth < 768;
            const threshold = isMobile ? 100 : 2;
            
            // Force resize if model scale is default (1) which means it hasn't been fitted yet
            const needsFit = model.scale.x === 1 && model.scale.y === 1;

            if (!needsFit && Math.abs(w - curW) < 2 && Math.abs(h - curH) < threshold) {
                 // console.log('[Live2DViewer] Resize skipped (no change)');
                 return;
            }

            console.log(`[Live2DViewer] Resizing to ${w}x${h}`);
            app.renderer.resize(w, h);
            
            // Reset scale to check dimensions
            model.scale.set(1);
            
            // Check for valid dimensions
            if (model.width === 0 || model.height === 0) {
                // Retry later if dimensions are not ready, but limit retries to prevent infinite loops
                if (resizeRetries < 10) {
                    resizeRetries++;
                    console.log(`[Live2DViewer] Model dimensions 0, retrying (${resizeRetries}/10)`);
                    setTimeout(() => {
                        if (mounted) requestAnimationFrame(resize);
                    }, 100);
                }
                return;
            }
            
            // Reset retries on success
            resizeRetries = 0;
            
            // Calculate scale to fit 85% of container (slightly larger)
            const scaleX = (w * 0.85) / model.width;
            const scaleY = (h * 0.85) / model.height;
            
            let scale = Math.min(scaleX, scaleY);
            
            // CAP SCALE to prevent gigantic models
            // If the model is very small, don't scale it up too much (max 2.5x)
            // If the model is huge, scale it down (which min(scaleX, scaleY) does)
            scale = Math.min(scale, 2.5);
            
            model.scale.set(scale);
            
            if (model.anchor) {
                model.anchor.set(0.5);
                model.x = w / 2;
                model.y = h / 2;
            } else {
                model.x = (w - model.width) / 2;
                model.y = (h - model.height) / 2;
            }
        };

        const init = async () => {
            try {
                if (typeof window === 'undefined') return;
                
                console.log('[Live2DViewer] Initializing PIXI...');
                (window as any).PIXI = PIXI;
                const { Live2DModel } = await import('pixi-live2d-display');
                
                if (!mounted || !canvasRef.current || !canvasWrapperRef.current) {
                    console.log('[Live2DViewer] Aborted init: Component unmounted or refs missing');
                    return;
                }

                // Cleanup existing app
                if (appRef.current) {
                    console.log('[Live2DViewer] Cleaning up existing PIXI app before init');
                    appRef.current.destroy(true, { children: true });
                    appRef.current = null;
                }

                const width = canvasWrapperRef.current.clientWidth;
                const height = canvasWrapperRef.current.clientHeight;
                console.log(`[Live2DViewer] Canvas dimensions: ${width}x${height}`);

                const app = new PIXI.Application({
                    view: canvasRef.current,
                    width,
                    height,
                    backgroundAlpha: 0,
                    autoStart: true,
                    antialias: true,
                    resolution: Math.min(window.devicePixelRatio || 1, 2), // Cap resolution to save memory on mobile
                    autoDensity: true,
                    preserveDrawingBuffer: true, // Fix for some devices not showing the canvas
                });
                appRef.current = app;
                console.log('[Live2DViewer] PIXI Application created');

                console.log('Loading model...', modelUrl);
                
                // Add crossOrigin handling for external resources
                PIXI.utils.skipHello();
                
                // Configure base texture settings globally
                PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
                PIXI.settings.PRECISION_FRAGMENT = PIXI.PRECISION.HIGH;

                // Attempt to pre-validate the URL to rule out basic connectivity issues
                try {
                    const headRes = await fetch(modelUrl, { method: 'HEAD' });
                    if (!headRes.ok && headRes.status !== 405) { // 405 is Method Not Allowed, which some servers return for HEAD
                         console.warn(`Model URL might be invalid: ${headRes.status}`);
                    }
                } catch (e) {
                    console.warn("Pre-fetch check failed, attempting load anyway:", e);
                }

                const model = await Live2DModel.from(modelUrl, {
                    autoHitTest: false,
                    autoFocus: false,
                    onError: (e: any) => {
                        console.error('Model internal error:', e);
                        // Only set error if it's a critical loading failure
                        if (mounted && !modelRef.current) {
                            setError(`Failed to load model: ${e.message || 'Network Error'}`);
                        }
                    }
                });
                
                console.log('[Live2DViewer] Model loaded successfully');

                if (!mounted) {
                    console.log('[Live2DViewer] Unmounted during model load, destroying resources');
                    model.destroy();
                    app.destroy(true, { children: true });
                    return;
                }
                
                // FORCE RESET focus on load
                if (model.internalModel && model.internalModel.focusController) {
                     model.internalModel.focusController.focus(0, 0);
                }
                
                if (model.textures && model.textures.some(t => !t.valid)) {
                    console.warn('Some textures failed to load');
                }

                modelRef.current = model;
                app.stage.addChild(model);
                
                // Force initial update
                model.update(0);

                resize();
                
                // Debounced resize observer
                resizeObserver = new ResizeObserver(() => {
                    clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(() => {
                         if (mounted) requestAnimationFrame(resize);
                    }, 200);
                });
                if (canvasWrapperRef.current) {
                    resizeObserver.observe(canvasWrapperRef.current);
                }
                
                // Double check resize after a small delay to handle layout shifts
                setTimeout(() => {
                    if (mounted) resize();
                }, 500);
                
                if (interactive) {
                    model.eventMode = 'static';
                    model.cursor = 'pointer';
                    model.on('pointertap', () => {
                        model.motion('TapBody');
                    });
                }

                // Extract Parameters - ROBUST EXTRACTION
                if (showControls && model.internalModel) {
                    const internal = model.internalModel as any;
                    const core = internal.coreModel as any;
                    const params: ModelParameter[] = [];
                    
                    try {
                        // Strategy 1: Cubism 4+ Core (Standard & Emscripten)
                        if (core && core.parameters) {
                            const ids = core.parameters.ids;
                            const values = core.parameters.values;
                            const min = core.parameters.minimumValues;
                            const max = core.parameters.maximumValues;
                            const def = core.parameters.defaultValues;
                            const count = core.parameters.count;

                            for (let i = 0; i < count; i++) {
                                const getVal = (arr: any, idx: number) => {
                                    if (!arr) return 0;
                                    if (typeof arr[idx] !== 'undefined') return arr[idx];
                                    if (typeof arr.at === 'function') return arr.at(idx);
                                    if (typeof arr.get === 'function') return arr.get(idx);
                                    return 0;
                                };

                                const getStr = (arr: any, idx: number) => {
                                    if (!arr) return null;
                                    if (typeof arr[idx] !== 'undefined') return arr[idx];
                                    if (typeof arr.at === 'function') return arr.at(idx);
                                    if (typeof arr.get === 'function') return arr.get(idx);
                                    return null;
                                };

                                const id = getStr(ids, i);
                                
                                if (id) {
                                    params.push({
                                        id,
                                        value: getVal(values, i),
                                        min: getVal(min, i),
                                        max: getVal(max, i),
                                        defaultValue: getVal(def, i),
                                        name: id
                                    });
                                }
                            }
                        } 
                        // Strategy 2: Cubism 2 Core
                        else if (core && typeof core.getParamCount === 'function' && typeof core.getParamID === 'function') {
                            const count = core.getParamCount();
                            for (let i = 0; i < count; i++) {
                                const id = core.getParamID(i);
                                const value = core.getParamFloat(i);
                                const max = (typeof core.getParamMax === 'function') ? core.getParamMax(i) : 1;
                                const min = (typeof core.getParamMin === 'function') ? core.getParamMin(i) : 0;
                                const def = value; 

                                params.push({
                                    id,
                                    value,
                                    min,
                                    max,
                                    defaultValue: def,
                                    name: id
                                });
                            }
                        }
                        // Strategy 3: Internal Model Cached Ids
                        else if (core && core._parameterIds) {
                             const ids = core._parameterIds;
                             const count = ids.length;
                             const values = core._parameterValues;
                             const max = core._parameterMaximumValues;
                             const min = core._parameterMinimumValues;
                             const def = core._parameterDefaultValues;

                             for(let i=0; i<count; i++) {
                                 params.push({
                                     id: ids[i],
                                     value: values ? values[i] : 0,
                                     min: min ? min[i] : 0,
                                     max: max ? max[i] : 1,
                                     defaultValue: def ? def[i] : (values ? values[i] : 0),
                                     name: ids[i]
                                 });
                             }
                        } 
                        else if (internal._parameterIds) {
                             const ids = internal._parameterIds;
                             const count = ids.length;
                             
                             for(let i=0; i<count; i++) {
                                 params.push({
                                     id: ids[i],
                                     value: internal.getParameterValueByIndex(i),
                                     min: internal.getParameterMinimumValueByIndex(i),
                                     max: internal.getParameterMaximumValueByIndex(i),
                                     defaultValue: internal.getParameterDefaultValueByIndex(i),
                                     name: ids[i]
                                 });
                             }
                        }   
                        // Strategy 4: High-Level SDK Methods
                        else {
                            if (typeof internal.getParameterCount === 'function') {
                                const count = internal.getParameterCount();
                                for(let i=0; i<count; i++) {
                                    const id = internal.getParameterId(i);
                                    params.push({
                                        id: id,
                                        value: internal.getParameterValueByIndex(i),
                                        min: internal.getParameterMinimumValueByIndex(i),
                                        max: internal.getParameterMaximumValueByIndex(i),
                                        defaultValue: internal.getParameterDefaultValueByIndex(i),
                                        name: id
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        console.error("Failed to extract parameters:", e);
                    }
                    
                    setParameters(params);
                    
                    if (params.length === 0) {
                        const info = {
                            modelType: model.constructor.name,
                            internalModelType: internal ? internal.constructor.name : 'N/A',
                            hasCore: !!core,
                            coreKeys: core ? Object.keys(core) : [],
                            internalKeys: internal ? Object.keys(internal) : [],
                            coreParams: core && core.parameters ? 'Present' : 'Missing',
                        };
                        setDebugInfo(JSON.stringify(info, null, 2));
                    }

                    // Extract Expressions
                    const exps: ModelExpression[] = [];
                    const settings = internal.settings || (model as any).settings;
                    
                    if (settings) {
                        if (Array.isArray(settings.Expressions)) {
                             settings.Expressions.forEach((exp: any) => {
                                exps.push({ name: exp.Name, file: exp.File });
                            });
                        }
                        else if (Array.isArray(settings.expressions)) {
                             settings.expressions.forEach((exp: any) => {
                                exps.push({ name: exp.Name || exp.name, file: exp.File || exp.file });
                            });
                        }
                        else if (Array.isArray(settings.expressions_list)) {
                             settings.expressions_list.forEach((exp: any) => {
                                exps.push({ name: exp.name, file: exp.file });
                            });
                        }
                    }

                    const uniqueExps = Array.from(new Map(exps.map(item => [item.name, item])).values());
                    setExpressions(uniqueExps);
                }

                setLoading(false);

            } catch (err: any) {
                console.error('Live2D Error:', err);
                if (mounted) setError(err.message || 'Failed to load model');
                setLoading(false);
            }
        };

        const checkCore = () => {
            if (!mounted) return;
            
            if ((window as any).Live2DCubismCore || (window as any).Live2D) {
                console.log('[Live2DViewer] Core SDK found, starting init');
                init();
            } else {
                attempts++;
                if (attempts > 50) { // 5 seconds timeout
                    if (mounted) {
                        console.error('[Live2DViewer] Core SDK timeout');
                        setError('Live2D Core SDK failed to load. Please check your internet connection or disable adblockers.');
                        setLoading(false);
                    }
                    return;
                }
                checkTimeout = setTimeout(checkCore, 100);
            }
        };
        
        checkCore();

        return () => {
            console.log('[Live2DViewer] Cleaning up Live2DCanvas effect');
            mounted = false;
            clearTimeout(resizeTimeout);
            clearTimeout(checkTimeout);
            if (resizeObserver) resizeObserver.disconnect();
            if (appRef.current) {
                console.log('[Live2DViewer] Destroying PIXI app');
                try {
                    appRef.current.destroy(true, { children: true });
                } catch (e) {
                    console.error('[Live2DViewer] Error destroying app:', e);
                }
                appRef.current = null;
            }
        };
    }, [modelUrl, interactive, showControls]);

    // Interactions
    useEffect(() => {
        if (!enableZoomPan || !canvasWrapperRef.current) return;
        const wrapper = canvasWrapperRef.current;

        const handleWheel = (e: WheelEvent) => {
            if (!modelRef.current) return;
            e.preventDefault();
            const rect = wrapper.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const oldScale = modelRef.current.scale.x;
            const scaleAmount = -e.deltaY * 0.001;
            let newScale = oldScale * (1 + scaleAmount);
            newScale = Math.max(0.05, Math.min(newScale, 10));
            const vectorX = mouseX - modelRef.current.x;
            const vectorY = mouseY - modelRef.current.y;
            modelRef.current.scale.set(newScale);
            const scaleRatio = newScale / oldScale;
            modelRef.current.x = mouseX - vectorX * scaleRatio;
            modelRef.current.y = mouseY - vectorY * scaleRatio;
        };

        const handlePointerDown = (e: PointerEvent) => {
            const isTouch = e.pointerType === 'touch';
            if (!isTouch && e.button !== 2) return;
            isDragging.current = true;
            lastMousePos.current = { x: e.clientX, y: e.clientY };
            wrapper.setPointerCapture(e.pointerId);
            wrapper.style.cursor = 'grabbing';
        };

        const handlePointerMove = (e: PointerEvent) => {
            if (isDragging.current && modelRef.current) {
                e.preventDefault();
                const dx = e.clientX - lastMousePos.current.x;
                const dy = e.clientY - lastMousePos.current.y;
                modelRef.current.x += dx;
                modelRef.current.y += dy;
                lastMousePos.current = { x: e.clientX, y: e.clientY };
                return;
            }
            
            // Only look at pointer if not multi-touch
            if (e.pointerType === 'touch' && (e as any).getCoalescedEvents && (e as any).getCoalescedEvents().length > 1) return;

            // Only look if Mouse Tracking is enabled
            if (!isMouseTracking) return;

            if (!modelRef.current || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const viewX = (x / rect.width) * 2 - 1;
            const viewY = -((y / rect.height) * 2 - 1);
            if (modelRef.current.internalModel && modelRef.current.internalModel.focusController) {
                modelRef.current.internalModel.focusController.focus(viewX, viewY);
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            isDragging.current = false;
            wrapper.releasePointerCapture(e.pointerId);
            wrapper.style.cursor = 'grab';
        };

        // Mobile Pinch Zoom
        let initialDistance = 0;
        let initialScale = 1;
        let initialTouchPos = { x: 0, y: 0 };
        let isTouchDragging = false;

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                initialDistance = Math.hypot(dx, dy);
                if (modelRef.current) initialScale = modelRef.current.scale.x;
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                initialTouchPos = { x: centerX, y: centerY };
                isTouchDragging = true;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2 && modelRef.current) {
                e.preventDefault();
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const distance = Math.hypot(dx, dy);
                if (initialDistance > 0) {
                    const scaleFactor = distance / initialDistance;
                    let newScale = initialScale * scaleFactor;
                    newScale = Math.max(0.05, Math.min(newScale, 10));
                    modelRef.current.scale.set(newScale);
                }
                const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                if (isTouchDragging) {
                    const moveX = centerX - initialTouchPos.x;
                    const moveY = centerY - initialTouchPos.y;
                    modelRef.current.x += moveX;
                    modelRef.current.y += moveY;
                    initialTouchPos = { x: centerX, y: centerY };
                }
            }
        };

        wrapper.addEventListener('wheel', handleWheel, { passive: false });
        wrapper.addEventListener('pointerdown', handlePointerDown);
        wrapper.addEventListener('pointermove', handlePointerMove);
        wrapper.addEventListener('pointerup', handlePointerUp);
        wrapper.addEventListener('pointerleave', handlePointerUp);
        wrapper.addEventListener('contextmenu', (e) => e.preventDefault());
        wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
        wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
        wrapper.style.cursor = 'grab';

        return () => {
            wrapper.removeEventListener('wheel', handleWheel);
            wrapper.removeEventListener('pointerdown', handlePointerDown);
            wrapper.removeEventListener('pointermove', handlePointerMove);
            wrapper.removeEventListener('pointerup', handlePointerUp);
            wrapper.removeEventListener('pointerleave', handlePointerUp);
            wrapper.removeEventListener('contextmenu', (e) => e.preventDefault());
            wrapper.removeEventListener('touchstart', handleTouchStart);
            wrapper.removeEventListener('touchmove', handleTouchMove);
            wrapper.style.cursor = '';
        };
    }, [enableZoomPan, isMouseTracking]); // Added isMouseTracking to deps

    // Helpers
    const updateModelParameter = (id: string, value: number, currentParams: ModelParameter[]) => {
        if (modelRef.current && modelRef.current.internalModel) {
             // ... (Same robust update logic)
             const index = currentParams.findIndex(p => p.id === id);
             if (index !== -1) {
                // Strategy 1
                if (modelRef.current.internalModel.coreModel && 
                    modelRef.current.internalModel.coreModel.parameters && 
                    modelRef.current.internalModel.coreModel.parameters.values) {
                     const values = modelRef.current.internalModel.coreModel.parameters.values;
                     if (typeof values[index] !== 'undefined') values[index] = value;
                     else if (typeof values.set === 'function') values.set(index, value);
                } 
                // Strategy 2: Core Internal Arrays
                else if (modelRef.current.internalModel.coreModel && 
                         modelRef.current.internalModel.coreModel._parameterValues) {
                     const values = modelRef.current.internalModel.coreModel._parameterValues;
                     if (values.length > index) values[index] = value;
                }
                // Strategy 3: Cubism 2
                else if (modelRef.current.internalModel.coreModel && 
                         typeof modelRef.current.internalModel.coreModel.setParamFloat === 'function') {
                    try { modelRef.current.internalModel.coreModel.setParamFloat(index, value); } catch(e) {}
                }
                // Strategy 4: High-Level
                else {
                    try {
                        if (modelRef.current.internalModel.setParameterValueByIndex) {
                            modelRef.current.internalModel.setParameterValueByIndex(index, value);
                        }
                    } catch(e) {}
                }
             }
        }
    };

    const handleParamChange = (id: string, value: number) => {
        updateModelParameter(id, value, parameters);
        setParameters(prev => {
            const index = prev.findIndex(p => p.id === id);
            if (index === -1) return prev;
            const newParams = [...prev];
            newParams[index] = { ...newParams[index], value };
            return newParams;
        });
    };

    const handleExpression = (expName: string) => {
        if (modelRef.current) {
            modelRef.current.expression(expName);
            setActiveExpressions(prev => prev.includes(expName) ? prev.filter(e => e !== expName) : [...prev, expName]);
        }
    };

    const sortedParameters = parameters;

    return (
        <div ref={containerRef} className={`relative flex flex-col md:flex-row ${className}`}>
            <div className={`relative flex-grow h-full overflow-hidden ${showControls ? 'w-full md:w-3/4' : 'w-full'} order-1 md:order-1`} onClick={onClick}>
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 gap-2 z-50 pointer-events-none">
                        <RefreshCw className="animate-spin" /> Loading Model...
                    </div>
                )}
                {error && <div className="absolute inset-0 flex items-center justify-center text-red-500 bg-red-900/20 p-4 z-50 pointer-events-none">{error}</div>}
                
                {/* Tracking Controls Overlay */}
                {showControls && (
                    <div 
                        className="absolute top-4 left-4 z-[9999] flex flex-col gap-2 pointer-events-auto max-w-[200px] md:max-w-none"
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-1 pl-1">
                            <div className="relative group">
                                <div className="bg-black/50 hover:bg-black/80 text-white/70 hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold cursor-help transition-colors border border-white/10 shadow-sm">
                                    ?
                                </div>
                                <div className="absolute left-0 top-full mt-2 w-56 p-3 bg-black/90 backdrop-blur border border-white/10 rounded-lg shadow-xl text-[11px] text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[9999]">
                                    <p className="font-bold text-white mb-1.5">How to use tracking:</p>
                                    <ul className="list-disc pl-3 space-y-1">
                                        {!isMobile && <li><span className="text-green-400">Mouse:</span> Model follows cursor.</li>}
                                        <li><span className="text-blue-400">Face:</span> Uses webcam for head/expression.</li>
                                        <li>Mobile uses front camera.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {!isMobile && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isFaceTracking) setIsFaceTracking(false);
                                    setIsMouseTracking(!isMouseTracking);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-lg backdrop-blur-md cursor-pointer select-none pointer-events-auto ${
                                    isMouseTracking 
                                        ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30' 
                                        : 'bg-black/50 text-gray-400 border-gray-600 hover:bg-black/70'
                                }`}
                            >
                                {isMouseTracking ? <Eye size={14} /> : <EyeOff size={14} />}
                                <span>MOUSE TRACKING</span>
                            </button>
                        )}
                        
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (isMouseTracking) setIsMouseTracking(false);
                                setIsFaceTracking(!isFaceTracking);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border shadow-lg backdrop-blur-md cursor-pointer select-none pointer-events-auto ${
                                isFaceTracking 
                                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30' 
                                    : 'bg-black/50 text-gray-400 border-gray-600 hover:bg-black/70'
                            }`}
                            // Add touch handler for better mobile responsiveness
                            onTouchEnd={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (isMouseTracking) setIsMouseTracking(false);
                                setIsFaceTracking(!isFaceTracking);
                            }}
                        >
                            {isFaceTracking ? <Video size={14} /> : <VideoOff size={14} />}
                            <span>FACE TRACKING</span>
                        </button>

                        <video ref={videoRef} className="hidden" autoPlay playsInline muted></video>
                    </div>
                )}

                <div 
                    ref={canvasWrapperRef}
                    className="w-full h-full absolute inset-0 z-10 touch-none"
                />

                <canvas ref={canvasRef} className="w-full h-full relative z-0 pointer-events-none" />
            </div>

            {/* Controls Sidebar */}
            {showControls && (!isMobile || expressions.length > 0) && (
                <div className="w-full md:w-96 bg-[#1a1a1a] border-t md:border-t-0 md:border-l border-gray-800 h-[40vh] md:h-full overflow-y-auto flex-shrink-0 shadow-2xl z-50 text-gray-200 custom-scrollbar relative order-2 md:order-2">
                    
                    {/* Expressions Section */}
                    {expressions.length > 0 && (
                        <div className="p-6 border-b border-gray-800">
                             <div className="flex items-center justify-between mb-4">
                                 <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <Smile size={16} className="text-purple-400" />
                                    <span>Expressions</span>
                                </h3>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                            {expressions.map((exp) => {
                                const isActive = activeExpressions.includes(exp.name);
                                return (
                                    <button
                                        key={exp.name}
                                        onClick={() => handleExpression(exp.name)}
                                        className={`
                                            text-xs py-2 px-3 rounded transition-all text-left truncate flex items-center justify-between group
                                            ${isActive 
                                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20 ring-1 ring-purple-400' 
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}
                                        `}
                                    >
                                        <span className="truncate">{exp.name}</span>
                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-pulse" />}
                                    </button>
                                );
                            })}
                            </div>
                        </div>
                    )}

                    {/* Parameters Section */}
                    <div className="p-6 hidden md:block">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                            <Play size={16} className="text-blue-400" />
                            <span>Parameters</span>
                            <span className="text-[10px] font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{sortedParameters.length}</span>
                        </h3>
                        
                        {sortedParameters.length === 0 && !loading && (
                            <div className="text-gray-500 text-sm text-center py-4 bg-gray-800/50 rounded-lg">
                                No parameters found.<br/>
                                <span className="text-xs opacity-70">Check console for extraction errors.</span>
                                {debugInfo && (
                                    <pre className="text-[10px] text-left mt-2 overflow-x-auto p-2 bg-black/50 rounded text-gray-400">
                                        {debugInfo}
                                    </pre>
                                )}
                            </div>
                        )}

                        <div className="space-y-5">
                            {sortedParameters.map((param) => (
                                <div key={param.id} className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-gray-400">
                                        <label className="font-medium truncate max-w-[200px] text-gray-300" title={param.id}>{param.id}</label>
                                        <span className="font-mono text-blue-300">{param.value.toFixed(2)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={param.min}
                                        max={param.max}
                                        step={0.01}
                                        value={parameters.find(p => p.id === param.id)?.value ?? param.value}
                                        onChange={(e) => handleParamChange(param.id, parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Dummy component to satisfy the "Live2DCanvasControls" reference in the first component
// But actually, we removed the reference in the first component now.
// So we can remove this dummy component.
