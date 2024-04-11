"use client";
// components/ThreeCanvas.js
import React, { useEffect, useRef } from "react";
import * as THREE from "three";

// Data and visualization
import { CompositionShader } from "./shaders/CompositionShader.js";
import {
  BASE_LAYER,
  BLOOM_LAYER,
  BLOOM_PARAMS,
  OVERLAY_LAYER,
} from "./config/renderConfig.js";

// Rendering
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { Galaxy } from "./objects/galaxy.js";

const GalaxyCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xebe2db, 0.00003);

    // Camera
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000000);
    camera.position.set(0, 500, 500);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvasRef.current,
      logarithmicDepthBuffer: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    //renderer.outputEncoding = THREE.sRGBEncoding; // Uncomment if needed
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 16384;
    controls.maxPolarAngle = Math.PI / 2 - Math.PI / 360;

    // Postprocessing setup
    const renderScene = new RenderPass(scene, camera);

    // Rendering pass for bloom
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    bloomPass.threshold = BLOOM_PARAMS.bloomThreshold;
    bloomPass.strength = BLOOM_PARAMS.bloomStrength;
    bloomPass.radius = BLOOM_PARAMS.bloomRadius;

    // bloom composer
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    // overlay composer
    const overlayComposer = new EffectComposer(renderer);
    overlayComposer.renderToScreen = false;
    overlayComposer.addPass(renderScene);
    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: CompositionShader.vertex,
        fragmentShader: CompositionShader.fragment,
      }),
      "baseTexture"
    );
    finalPass.needsSwap = true;

    const baseComposer = new EffectComposer(renderer);
    baseComposer.addPass(renderScene);
    baseComposer.addPass(finalPass);

    // Galaxy
    const galaxy = new Galaxy(scene); // Assuming Galaxy's constructor adds it to the scene

    // Animation loop
    const animate = () => {
      // Render bloom
      camera.layers.set(BLOOM_LAYER);
      bloomComposer.render();

      // Render overlays
      camera.layers.set(OVERLAY_LAYER);
      overlayComposer.render();

      // Render normal
      camera.layers.set(BASE_LAYER);
      baseComposer.render();
      controls.update();
      baseComposer.render();

      requestAnimationFrame(animate);
    };
    animate();

    // Handle window resize
    const onWindowResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      baseComposer.setSize(width, height);
      bloomComposer.setSize(width, height);
    };
    window.addEventListener("resize", onWindowResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", onWindowResize);
      // Any other necessary cleanup
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />;
};

export default GalaxyCanvas;
