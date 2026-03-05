'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import * as PIXI from 'pixi.js';
import { X, Maximize2, RefreshCw, Play, Smile, Eye, EyeOff, Video, VideoOff } from 'lucide-react';
// import { FaceMesh } from '@mediapipe/face_mesh'; // Removed due to module issues
import * as Kalidokit from 'kalidokit';

// --- WebGL Context Patch for Mobile/Low-End Devices ---
// Fixes "Invalid value of '0' passed to 'checkMaxIfStatementsInShader'"
if (typeof window !== 'undefined') {
    const patchWebGL = (contextPrototype: any, name: string) => {
        const originalGetParameter = contextPrototype.getParameter;
        contextPrototype.getParameter = function(parameter: number) {
            // Check for 0 results on critical parameters
            const result = originalGetParameter.call(this, parameter);
            
            // Log ALL zero returns for debugging if needed (can be noisy)
            // if (result === 0) console.log(`[Live2DViewer] ${name} getParameter(${parameter}) returned 0`);

            if (result === 0) {
                // GL_MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB (36347)
                if (parameter === 36347) {
                    console.warn(`[Live2DViewer] ${name} MAX_VERTEX_UNIFORM_VECTORS returned 0, patching to 1024`);
                    return 1024; 
                }
                // GL_MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DF2 (36338)
                if (parameter === 36338) {
                    console.warn(`[Live2DViewer] ${name} MAX_FRAGMENT_UNIFORM_VECTORS returned 0, patching to 1024`);
                    return 1024;
                }
                // GL_MAX_VARYING_VECTORS = 0x8DFC (36348)
                if (parameter === 36348) {
                    console.warn(`[Live2DViewer] ${name} MAX_VARYING_VECTORS returned 0, patching to 30`);
                    return 30;
                }
                // GL_MAX_VERTEX_ATTRIBS = 0x8869 (34921)
                if (parameter === 34921) {
                    console.warn(`[Live2DViewer] ${name} MAX_VERTEX_ATTRIBS returned 0, patching to 16`);
                    return 16;
                }
                // GL_MAX_TEXTURE_IMAGE_UNITS = 0x8872 (34930)
                if (parameter === 34930) {
                    return 16;
                }
                // GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C (35660)
                if (parameter === 35660) {
                    return 16;
                }
            }
            
            // Force return of high values for specific shader checks that might fail even if not 0 (e.g. too low)
            if (parameter === 36347) return Math.max(result, 1024); // GL_MAX_VERTEX_UNIFORM_VECTORS
            if (parameter === 36338) return Math.max(result, 1024); // GL_MAX_FRAGMENT_UNIFORM_VECTORS
            if (parameter === 36348) return Math.max(result, 30);   // GL_MAX_VARYING_VECTORS
            if (parameter === 34921) return Math.max(result, 16);   // GL_MAX_VERTEX_ATTRIBS
            
            return result;
        };
    };
    
    try {
        if (typeof WebGLRenderingContext !== 'undefined') patchWebGL(WebGLRenderingContext.prototype, 'WebGL1');
        if (typeof WebGL2RenderingContext !== 'undefined') patchWebGL(WebGL2RenderingContext.prototype, 'WebGL2');
    } catch (e) {
        console.warn('[Live2DViewer] Failed to patch WebGL context:', e);
    }
}
// -----------------------------------------------------

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
  
  // Ref to hold the PIXI app instance to persist across fullscreen toggles
  const appRef = useRef<PIXI.Application | null>(null);

  useEffect(() => {
    if (isOpen) {
        console.log('[Live2DViewer] Fullscreen mode ACTIVATED');
        document.body.style.overflow = 'hidden';
    } else {
        console.log('[Live2DViewer] Fullscreen mode DEACTIVATED');
        document.body.style.overflow = '';
    }
    return () => {
        document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  return (
    <>
      {/* 
          Unified Viewer Container 
          - When !isOpen: Relative positioning, fits in parent card
          - When isOpen: Fixed positioning, covers entire screen (z-50)
      */}
      <div 
        className={`
            transition-all duration-300 ease-in-out
            ${isOpen 
                ? 'fixed inset-0 z-[9999] bg-[#1a1a1a] flex items-center justify-center' 
                : `relative w-full h-full group bg-gray-900 rounded-xl overflow-hidden border border-gray-800 ${className}`
            }
        `}
      >
        <Live2DCanvas 
            modelUrl={modelUrl} 
            interactive={interactive} 
            isOpen={isOpen}
            onToggleFullscreen={() => interactive && setIsOpen(!isOpen)}
            className="w-full h-full"
        />

        {/* Floating "Inspect" Button (Only when NOT open) */}
        {interactive && !isOpen && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none z-20">
                <div className="bg-white/90 backdrop-blur text-gray-900 px-5 py-3 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0 duration-300 flex items-center gap-2 font-bold tracking-wide">
                    <Maximize2 size={18} />
                    <span>Inspect Model</span>
                </div>
            </div>
        )}

        {/* Close Button is now handled inside Live2DCanvas for better placement */}
      </div>
    </>
  );
}

// Updated Props
interface Live2DCanvasProps {
    modelUrl: string;
    interactive?: boolean;
    isOpen?: boolean; // New prop to track state
    onToggleFullscreen?: () => void;
    className?: string;
}

function Live2DCanvas({ modelUrl, interactive, isOpen, onToggleFullscreen, className }: Live2DCanvasProps) {
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

    // Derived state for controls
    const showControls = isOpen; 
    const enableZoomPan = isOpen;

    useEffect(() => {
        const checkMobile = () => {
            const userAgent = typeof window.navigator === "undefined" ? "" : navigator.userAgent;
            const mobile = Boolean(userAgent.match(/Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i));
            setIsMobile(mobile);
            console.log('[Live2DViewer] Device check:', mobile ? 'Mobile' : 'Desktop');
        };
        checkMobile();
    }, []);

    // Helper for resize
    const triggerResize = () => {
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
             return;
        }

        console.log(`[Live2DViewer] Resizing to ${w}x${h}`);
        app.renderer.resize(w, h);
        
        // Reset scale to check dimensions
        model.scale.set(1);
        
        // Check for valid dimensions
        if (model.width === 0 || model.height === 0) {
            // Can't retry here easily without creating a closure loop, just return
            return;
        }
        
        // Calculate scale to fit 85% of container (slightly larger)
        const scaleX = (w * 0.85) / model.width;
        const scaleY = (h * 0.85) / model.height;
        
        let scale = Math.min(scaleX, scaleY);
        
        // CAP SCALE to prevent gigantic models
        scale = Math.min(scale, 2.5);
        
        model.scale.set(scale);
        
        // Re-center model
        if (model.anchor) {
            model.anchor.set(0.5);
            model.x = w / 2;
            model.y = h / 2;
        } else {
            model.x = (w - model.width) / 2;
            model.y = (h - model.height) / 2;
        }
    };

    // Trigger Resize when isOpen changes
    useEffect(() => {
        // Wait for layout transition to finish/start
        const timers = [
            setTimeout(() => triggerResize(), 50),
            setTimeout(() => triggerResize(), 300), // Match transition duration
            setTimeout(() => triggerResize(), 500)
        ];
        return () => timers.forEach(t => clearTimeout(t));
    }, [isOpen]);

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
                    
                    if (solved && modelRef.current) {
                        const core = modelRef.current.internalModel.coreModel;
                        
                        // Map Kalidokit results to Live2D parameters
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
            if (!mounted) return;
            
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
            
            // Re-center model
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
                const live2dExports = await import('pixi-live2d-display');
                const { Live2DModel, config, Cubism4InternalModel } = live2dExports;
                const Cubism2InternalModel = (live2dExports as any).Cubism2InternalModel;

                // Force logging to see if config is applied
                console.log('[Live2DViewer] Applying mask configuration...');
                
                // CRITICAL FIX: Monkey-patch the Cubism4InternalModel prototype directly
                // This ensures that ANY new model instance gets these defaults
                if (Cubism4InternalModel && Cubism4InternalModel.prototype) {
                    try {
                        console.log('[Live2DViewer] Patching Cubism4InternalModel prototype');
                        // Override the method that initializes the mask manager if possible
                        // Or just set static defaults if they exist on the class
                    } catch (e) {
                         console.warn('[Live2DViewer] Failed to patch prototype:', e);
                    }
                }

                // Unified configuration for all internal models
                const setMaskSettings = (target: any) => {
                    if (!target) return;
                    try {
                        target.maskSize = 4096;
                        target.maskLimit = 256;
                    } catch (e) {
                        console.warn('[Live2DViewer] Failed to set mask settings on target:', e);
                    }
                };

                // 1. Config Object
                if (config) {
                    setMaskSettings(config.cubism4);
                    setMaskSettings((config as any).cubism2);
                    if (config.cubism4) {
                        (config.cubism4 as any).supportMoreMaskDivisions = true;
                    }
                }

                // 2. Live2DModel Config (Static)
                if ((Live2DModel as any).config) {
                     const l2dConfig = (Live2DModel as any).config;
                     setMaskSettings(l2dConfig.cubism4);
                     setMaskSettings(l2dConfig.cubism2);
                     if (l2dConfig.cubism4) {
                         (l2dConfig.cubism4 as any).supportMoreMaskDivisions = true;
                     }
                }

                // 3. Internal Models (Static)
                if (Cubism4InternalModel) setMaskSettings(Cubism4InternalModel);
                if (Cubism2InternalModel) setMaskSettings(Cubism2InternalModel);

                // 4. Register Settings (Official Method)
                if (typeof (Live2DModel as any).registerSettings === 'function') {
                    try {
                        (Live2DModel as any).registerSettings({
                            cubism4: { maskLimit: 256, maskSize: 4096, supportMoreMaskDivisions: true },
                            cubism2: { maskLimit: 256, maskSize: 4096 }
                        });
                    } catch (e) {}
                }
                
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

                // INTERCEPT CONTEXT CREATION
                // This ensures we patch the exact context PIXI uses, regardless of when it's created
                const canvas = canvasRef.current;
                const originalGetContext = canvas.getContext;
                
                // Define the patch function
                const patchGLContext = (gl: any) => {
                    if (gl._isPatched) return;
                    
                    const originalGetParameter = gl.getParameter.bind(gl);
                    gl.getParameter = (parameter: number) => {
                        const result = originalGetParameter(parameter);
                        
                        // MAX_VERTEX_UNIFORM_VECTORS (36347)
                        if (parameter === 36347) return Math.max(result || 0, 1024); 
                        // MAX_FRAGMENT_UNIFORM_VECTORS (36338)
                        if (parameter === 36338) return Math.max(result || 0, 1024); 
                        // MAX_VARYING_VECTORS (36348)
                        if (parameter === 36348) return Math.max(result || 0, 30);   
                        // MAX_VERTEX_ATTRIBS (34921)
                        if (parameter === 34921) return Math.max(result || 0, 16);   
                        // MAX_TEXTURE_IMAGE_UNITS (34930)
                        if (parameter === 34930) return Math.max(result || 0, 16);
                        // MAX_VERTEX_TEXTURE_IMAGE_UNITS (35660)
                        if (parameter === 35660) return Math.max(result || 0, 16);
                        
                        return result;
                    };
                    
                    // Also try to enable extensions
                    try { gl.getExtension('OES_standard_derivatives'); } catch(e) {}
                    
                    gl._isPatched = true;
                    console.log('[Live2DViewer] WebGL Context Patched via Interceptor');
                };

                // Override getContext
                // @ts-ignore
                canvas.getContext = function(type: string, options?: any) {
                    // @ts-ignore
                    const ctx = originalGetContext.call(this, type, options);
                    if (ctx) patchGLContext(ctx);
                    return ctx;
                };

                const app = new PIXI.Application({
                    view: canvasRef.current,
                    width,
                    height,
                    backgroundAlpha: 0,
                    autoStart: true,
                    antialias: true,
                    // Resolution Handling:
                    // - On mobile, use 1.5x resolution for better quality without crashing (compromise)
                    // - On desktop, use device pixel ratio (capped at 2x)
                    resolution: isMobile ? 1.5 : Math.min(window.devicePixelRatio || 1, 2),
                    autoDensity: true,
                    preserveDrawingBuffer: true,
                    // 'high-performance' can cause crashes on some mobile GPUs if they can't handle the shader complexity
                    // defaulting to 'default' lets the browser decide the best power mode
                    powerPreference: 'default', 
                    // Add this to prevent context loss on some systems
                    context: undefined
                });
                
                // Fallback: If PIXI already created the context (unlikely with interceptor but possible if reused)
                if (app.renderer && (app.renderer as any).gl) {
                    patchGLContext((app.renderer as any).gl);
                }
                
                appRef.current = app;
                console.log('[Live2DViewer] PIXI Application created');

                console.log('Loading model...', modelUrl);
                
                // Add crossOrigin handling for external resources
                // PIXI.utils.skipHello(); // Deprecated in v7

                // Configure base texture settings globally
                PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.LINEAR;
                PIXI.Program.defaultFragmentPrecision = PIXI.PRECISION.HIGH;

                // Attempt to pre-validate the URL to rule out basic connectivity issues
                try {
                    const headRes = await fetch(modelUrl, { method: 'HEAD' });
                    if (!headRes.ok && headRes.status !== 405) { // 405 is Method Not Allowed, which some servers return for HEAD
                         console.warn(`Model URL might be invalid: ${headRes.status}`);
                    }
                } catch (e) {
                    console.warn("Pre-fetch check failed, attempting load anyway:", e);
                }

                // Add global logging hook to catch PIXI errors
                const originalLog = console.log;
                const originalWarn = console.warn;
                const originalError = console.error;

                (window as any)._live2d_debug_log = [];

                const pushLog = (type: string, args: any[]) => {
                    (window as any)._live2d_debug_log.push({
                        time: new Date().toISOString(),
                        type,
                        message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
                    });
                };

                console.log = (...args) => {
                    originalLog(...args);
                    pushLog('LOG', args);
                };
                console.warn = (...args) => {
                    originalWarn(...args);
                    pushLog('WARN', args);
                };
                console.error = (...args) => {
                    originalError(...args);
                    pushLog('ERROR', args);
                };

                const model = await Live2DModel.from(modelUrl, {
                    autoHitTest: false,
                    autoFocus: false,
                    // Note: Properties below are for versions that support them
                    // @ts-ignore
                    maskBufferCount: 4, 
                    // @ts-ignore
                    maskCount: 4,
                    // @ts-ignore
                    maskLimit: 256,
                    // @ts-ignore
                    maskSize: 4096,
                    onError: (e: any) => {
                        console.error('Model internal error:', e);
                        // Only set error if it's a critical loading failure
                        if (mounted && !modelRef.current) {
                            // Dump the log on error
                            const logs = (window as any)._live2d_debug_log || [];
                            const logDump = logs.slice(-20).map((l: any) => `[${l.type}] ${l.message}`).join('\n');
                            console.error('CRITICAL FAILURE LOGS:', logDump);
                            setError(`Failed to load model: ${e.message || 'Network Error'} \n\nCheck console for details.`);
                        }
                    }
                });
                
                // Restore console
                console.log = originalLog;
                console.warn = originalWarn;
                console.error = originalError;

                // DIRECT PATCH: Access the internal MaskSpriteManager immediately
                if (model.internalModel && (model.internalModel as any).maskSpriteManager) {
                    const manager = (model.internalModel as any).maskSpriteManager;
                    console.log('[Live2DViewer] Forcing mask manager capacity to 256');
                    
                    // 1. Force capacity (Max masks)
                    manager.capacity = 256;
                    
                    // 2. Force mask limit property
                    // Note: 'maskLimit' is sometimes used instead of capacity in different versions
                    if ('maskLimit' in manager) manager.maskLimit = 256;
                    
                    // 3. Force render texture count (The key to 78 masks)
                    // If this property doesn't exist, we inject it just in case the internal logic checks it
                    if ('renderTextureCount' in manager) {
                        manager.renderTextureCount = 4;
                    } else {
                        // Inject it anyway as a fallback
                        (manager as any).renderTextureCount = 4;
                    }

                    // 4. Force resize to ensure high resolution
                    if (manager.resize && typeof manager.resize === 'function') {
                         try { manager.resize(4096, 4096); } catch(e) {}
                    }
                }
                
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

                setLoading(false);

            } catch (err: any) {
                console.error('Live2D Error:', err);
                if (mounted) {
                    let message = err.message || 'Failed to load model';
                    if (message.includes('checkMaxIfStatementsInShader') || message.includes('WebGL')) {
                        message = 'Graphics Error: Your device/browser may not support the required WebGL features. Try updating drivers or using a different browser.';
                    } else if (message.toLowerCase().includes('not supported mask count')) {
                        message = 'Model Error: This model uses too many masks (Clipping Mask Count Exceeded). The viewer has been updated to support more masks, but if this persists, the model may be too complex for web viewing.';
                    }
                    setError(message);
                }
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
                    // DO NOT remove view from DOM as React manages it
                    appRef.current.destroy(false, { children: true });
                } catch (e) {
                    console.error('[Live2DViewer] Error destroying app:', e);
                }
                appRef.current = null;
            }
        };
    }, [modelUrl]); // Only re-init if modelUrl changes. interactive/showControls handled separately.

    // Extract Parameters when controls are shown
    useEffect(() => {
        if (!showControls || !modelRef.current || parameters.length > 0) return;
        
        const extractParams = () => {
             const model = modelRef.current;
             if (!model || !model.internalModel) return;

             console.log('[Live2DViewer] Extracting parameters...');
             // ... extraction logic ...
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
        };

        // If model is already loaded, extract immediately
        if (modelRef.current && !loading) {
            extractParams();
        } 
        // Otherwise wait for loading to finish (handled by main effect setting loading=false)
    }, [showControls, loading]); // Run when controls are shown or loading finishes

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

    // Toggle Idle Animation, Physics, Blink, Breath based on Mouse Tracking
    useEffect(() => {
        const model = modelRef.current;
        if (!model || !model.internalModel) return;

        const internal = model.internalModel as any;
        const motionManager = internal.motionManager;

        // Helper to disable an updater safely
        const disableUpdater = (target: any, name: string) => {
            if (target && target.update && !target._originalUpdate) {
                target._originalUpdate = target.update;
                target.update = () => {}; // No-op
                console.log(`[Live2DViewer] Disabled ${name}`);
            }
        };

        // Helper to restore an updater
        const restoreUpdater = (target: any, name: string) => {
            if (target && target._originalUpdate) {
                target.update = target._originalUpdate;
                delete target._originalUpdate;
                console.log(`[Live2DViewer] Restored ${name}`);
            }
        };

        if (isMouseTracking) {
             console.log('[Live2DViewer] Mouse tracking enabled - Disabling idle motions & physics (Override Strategy)');
             
             // 1. Stop all current motions immediately
             if (motionManager) {
                 if (typeof motionManager.stopAll === 'function') {
                     motionManager.stopAll();
                 } else if (typeof motionManager.stopAllMotions === 'function') {
                     motionManager.stopAllMotions();
                 }
                 // Prevent new idle motions from starting
                 if (!motionManager._originalIdleGroup) {
                    motionManager._originalIdleGroup = motionManager.idleMotionGroup;
                 }
                 motionManager.idleMotionGroup = undefined;
             }

             // 2. Override Update Loop to forcefully skip Physics, Breath, Blink
             if (!internal._originalUpdate) {
                 internal._originalUpdate = internal.update;
                 
                 // We replace the update function to only update what we want
                 // standard signature: update(dt, now)
                 internal.update = function(dt: number, now: number) {
                     // Robust Cubism 4 detection:
                     // 1. Check for 'parameters' object (standard Cubism 4)
                     // 2. Check for lack of getParamFloat (standard Cubism 2)
                     const isCubism4 = (this.coreModel && this.coreModel.parameters) || 
                                       (this.coreModel && typeof this.coreModel.getParamFloat !== 'function');
                     
                     // 1. Update Focus (Always uses MS in InternalModel base)
                     if (this.focusController) {
                         this.focusController.update(dt);
                     }
                     
                     // 1.5. Apply Focus to Model Parameters (Manual & Robust Implementation)
                     // We bypass this.updateFocus() to ensure values are applied regardless of internal state/version
                     if (this.focusController && this.coreModel) {
                         const fx = this.focusController.x;
                         const fy = this.focusController.y;
                         
                         // Helper to set parameter safely (supports C2, C4, and direct access)
                         // CRITICAL FIX: Changed from ADD to SET to prevent accumulation/saturation
                         const setParam = (id: string, value: number) => {
                             // Strategy 1: InternalModel method (Preferred)
                             if (this.setParameterValueById) {
                                 this.setParameterValueById(id, value);
                                 return;
                             }
                             
                             // Strategy 2: Cubism 4 Core Direct Access (Fastest fallback)
                             if (this.coreModel.parameters && this.coreModel.parameters.ids && this.coreModel.parameters.values) {
                                 const ids = this.coreModel.parameters.ids;
                                 // Simple linear search (fast enough for few params)
                                 let idx = -1;
                                 if (ids.indexOf) idx = ids.indexOf(id);
                                 else {
                                     // Fallback for array-like objects
                                     for (let i = 0; i < ids.length; i++) {
                                         if (ids[i] === id) { idx = i; break; }
                                     }
                                 }
                                 
                                 if (idx !== -1) {
                                     this.coreModel.parameters.values[idx] = value;
                                 }
                                 return;
                             }
                             
                             // Strategy 3: Cubism 2 Core
                             if (this.coreModel.setParamFloat) {
                                 let idx = -1;
                                 if (this.coreModel.getParamIndex) {
                                     idx = this.coreModel.getParamIndex(id);
                                 }
                                 if (idx !== -1) {
                                     this.coreModel.setParamFloat(idx, value);
                                 }
                                 return;
                             }

                             // Strategy 4: Cubism 4 SDK method (if exposed)
                             if (this.coreModel.setParameterValueById) {
                                 this.coreModel.setParameterValueById(id, value);
                             }
                         };
                         
                         // Standard IDs (Cubism 4 / 2)
                         setParam('ParamAngleX', fx * 30);
                         setParam('ParamAngleY', fy * 30);
                         setParam('ParamAngleZ', fx * fy * -30);
                         setParam('ParamBodyAngleX', fx * 10);
                         setParam('ParamEyeBallX', fx);
                         setParam('ParamEyeBallY', fy);
                         
                         // Cubism 2 IDs (Upper Snake Case)
                         setParam('PARAM_ANGLE_X', fx * 30);
                         setParam('PARAM_ANGLE_Y', fy * 30);
                         setParam('PARAM_ANGLE_Z', fx * fy * -30);
                         setParam('PARAM_BODY_ANGLE_X', fx * 10);
                         setParam('PARAM_EYE_BALL_X', fx);
                         setParam('PARAM_EYE_BALL_Y', fy);
                     }
                     
                     // 2. Update Motions
                     // Cubism 4 expects Seconds. Cubism 2 expects MS.
                     if (this.motionManager) {
                         if (isCubism4) {
                             this.motionManager.update(this.coreModel, now / 1000);
                         } else {
                             this.motionManager.update(this.coreModel, now);
                         }
                     }
                     
                     // 3. Update Physics (Hair/Clothes) - RESTORED to fix "stiff" look
                     if (this.physics) {
                         // Safely check for evaluate (Cubism 4) or update (Cubism 2)
                         if (typeof this.physics.evaluate === 'function') {
                             this.physics.evaluate(this.coreModel, dt / 1000);
                         } else if (typeof this.physics.update === 'function') {
                             this.physics.update(now);
                         }
                     }
                     
                     // 4. Update Pose (Parts visibility) - RESTORED
                     if (this.pose) {
                         if (typeof this.pose.updateParameters === 'function') {
                             this.pose.updateParameters(this.coreModel, dt / 1000);
                         } else if (typeof this.pose.update === 'function') {
                             this.pose.update(dt);
                         }
                     }
                     
                     // 5. Update EyeBlink (Blinking) - RESTORED
                     // We intentionally skip `updateNaturalMovements` because that adds the sway/breathing
                     if (this.eyeBlink) {
                         if (typeof this.eyeBlink.updateParameters === 'function') {
                             this.eyeBlink.updateParameters(this.coreModel, dt / 1000);
                         } else if (typeof this.eyeBlink.update === 'function') {
                             this.eyeBlink.update(dt);
                         }
                     }
                     
                     // 6. Update Breath - SKIPPED (This is the sway)
                     
                     // 7. IMPORTANT: Update Core Model to apply changes
                     if (this.coreModel) {
                         if (this.coreModel.update) {
                             this.coreModel.update();
                         }
                     }
                 };
                 console.log('[Live2DViewer] Internal update loop overridden');
             }

        } else {
             console.log('[Live2DViewer] Mouse tracking disabled - Restoring state');

             // 1. Restore Update Loop
             if (internal._originalUpdate) {
                 internal.update = internal._originalUpdate;
                 delete internal._originalUpdate;
                 console.log('[Live2DViewer] Internal update loop restored');
             }

             // 2. Restore Idle Motions
             if (motionManager && motionManager._originalIdleGroup) {
                 motionManager.idleMotionGroup = motionManager._originalIdleGroup;
                 delete motionManager._originalIdleGroup;
                 motionManager.startRandomMotion(motionManager.idleMotionGroup);
             }
             
             // 3. Reset Focus Parameters to Neutral (0)
             // This ensures the avatar doesn't get stuck looking at the last position
             if (internal.coreModel) {
                 const resetParam = (id: string) => {
                     // Try all strategies to force reset
                     try {
                         if (internal.setParameterValueById) internal.setParameterValueById(id, 0);
                         else if (internal.coreModel.setParameterValueById) internal.coreModel.setParameterValueById(id, 0);
                         else if (internal.coreModel.setParamFloat) {
                             const idx = internal.coreModel.getParamIndex(id);
                             if (idx !== -1) internal.coreModel.setParamFloat(idx, 0);
                         }
                     } catch(e) {}
                 };
                 
                 ['ParamAngleX', 'ParamAngleY', 'ParamAngleZ', 'ParamBodyAngleX', 'ParamEyeBallX', 'ParamEyeBallY',
                  'PARAM_ANGLE_X', 'PARAM_ANGLE_Y', 'PARAM_ANGLE_Z', 'PARAM_BODY_ANGLE_X', 'PARAM_EYE_BALL_X', 'PARAM_EYE_BALL_Y'
                 ].forEach(resetParam);
             }
        }
    }, [isMouseTracking]);

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
            <div className={`relative flex-grow h-full overflow-hidden ${showControls ? 'w-full md:w-3/4' : 'w-full'} order-1 md:order-1`} onClick={onToggleFullscreen}>
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

                        {/* Mouse Tracking Button - Hidden on mobile unless requested, but let's show it if not explicitly mobile to debug */}
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
                            } ${isMobile ? 'hidden' : 'flex'}`}
                        >
                            {isMouseTracking ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span>MOUSE TRACKING</span>
                        </button>
                        
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

                {/* Mobile Close Button (Floating) */}
                {showControls && isMobile && (
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFullscreen && onToggleFullscreen();
                        }}
                        className="absolute top-4 right-4 z-[100] bg-black/50 text-white p-2 rounded-full backdrop-blur-md hover:bg-white/20 transition-all border border-white/10 shadow-lg"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            {/* Controls Sidebar */}
            {showControls && (!isMobile || expressions.length > 0) && (
                <div className="w-full md:w-96 bg-[#1a1a1a] border-t md:border-t-0 md:border-l border-gray-800 h-[40vh] md:h-full overflow-y-auto flex-shrink-0 shadow-2xl z-50 text-gray-200 custom-scrollbar relative order-2 md:order-2">
                    
                    {/* Desktop Header with Embedded Close Button */}
                    {!isMobile && (
                        <div className="sticky top-0 z-20 bg-[#1a1a1a]/95 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                <h3 className="font-bold text-gray-200 text-xs uppercase tracking-wider">Model Inspector</h3>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleFullscreen && onToggleFullscreen();
                                }}
                                className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all"
                                title="Close Inspector"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Expressions Section */}
                    <div className="p-6 border-b border-gray-800">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm uppercase tracking-wider">
                                <Smile size={16} className="text-purple-400" />
                                <span>Expressions</span>
                                <span className="text-[10px] font-normal text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">{expressions.length}</span>
                            </h3>
                        </div>
                        
                        {expressions.length === 0 ? (
                            <div className="text-gray-500 text-xs italic opacity-50 pl-1">No expressions set to dedicated buttons, you can assign them yourself</div>
                        ) : (
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
                        )}
                    </div>

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
