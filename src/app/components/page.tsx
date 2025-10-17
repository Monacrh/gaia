'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

interface Country {
  name: string;
  lat: number;
  lon: number;
  info: string;
}

const SimpleHexGlobe = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<string>('');
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const globeRef = useRef<THREE.Object3D | null>(null);
  const hexGroupRef = useRef<THREE.Group | null>(null);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());

  const countries: Country[] = useMemo(() => [
    { name: 'Indonesia', lat: -6.2088, lon: 106.8456, info: '🇮🇩 Indonesia - 17,000+ islands' },
    { name: 'United States', lat: 38.9072, lon: -77.0369, info: '🇺🇸 USA - Tech innovation hub' },
    { name: 'Japan', lat: 35.6762, lon: 139.6503, info: '🇯🇵 Japan - Rising sun nation' },
    { name: 'United Kingdom', lat: 51.5074, lon: -0.1278, info: '🇬🇧 UK - Historic landmarks' },
    { name: 'Brazil', lat: -15.7939, lon: -47.8828, info: '🇧🇷 Brazil - Amazon rainforest' },
  ], []);

  const latLonToVector3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  };

  // Create hexagon shape
  const createHexShape = (size: number): THREE.Shape => {
    const shape = new THREE.Shape();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = size * Math.cos(angle);
      const y = size * Math.sin(angle);
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  };

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 4;
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: false 
    });
    renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    currentMount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Stars background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: true
    });
    const starsVertices = [];
    for (let i = 0; i < 2000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 2000;
      starsVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    scene.add(new THREE.Points(starsGeometry, starsMaterial));

    // 🔆 IMPROVED LIGHTING - Membuat GLB lebih terang
    // Ambient light - cahaya keseluruhan
    const ambientLight = new THREE.AmbientLight(0xffffff, 100);
    scene.add(ambientLight);

    // Main light - seperti matahari
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(10, 5, 5);
    scene.add(mainLight);

    // Fill light - untuk highlight area gelap
    const fillLight = new THREE.DirectionalLight(0x8899ff, 1.0);
    fillLight.position.set(-10, 0, -5);
    scene.add(fillLight);

    // Rim light - untuk outline
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
    rimLight.position.set(0, 10, -10);
    scene.add(rimLight);

    // Hemisphere light - sky & ground color
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    scene.add(hemiLight);

    // Load Earth GLB dengan brightness adjustment
    const loader = new GLTFLoader();
    loader.load(
      '/models/earth (4).glb',
      (gltf) => {
        const earth = gltf.scene;
        earth.scale.set(1.1, 1.1, 1.1);
        
        // 💡 BRIGHTEN GLB MODEL
        earth.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Adjust material brightness
            if (child.material) {
              const material = child.material as THREE.MeshStandardMaterial;
              
              // Increase emissive for glow
              material.emissive = new THREE.Color(0x222222);
              material.emissiveIntensity = 0.3;
              
              // Adjust roughness & metalness
              material.roughness = 0.5;
              material.metalness = 0.1;
              
              // Enable shadows
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Force material update
              material.needsUpdate = true;
            }
          }
        });
        
        scene.add(earth);
        globeRef.current = earth;
        console.log('✅ Earth GLB loaded with brightness boost');
      },
      (progress) => {
        const percent = (progress.loaded / progress.total * 100).toFixed(0);
        console.log(`Loading: ${percent}%`);
      },
      (error) => {
        console.error('GLB load error:', error);
        // Fallback sphere dengan texture
        const geo = new THREE.SphereGeometry(1, 64, 64);
        const textureLoader = new THREE.TextureLoader();
        const earthTexture = textureLoader.load(
          'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'
        );
        const mat = new THREE.MeshStandardMaterial({ 
          map: earthTexture,
          roughness: 0.7,
          metalness: 0.1,
          emissive: 0x222222,
          emissiveIntensity: 0.2
        });
        const sphere = new THREE.Mesh(geo, mat);
        scene.add(sphere);
        globeRef.current = sphere;
      }
    );

    // Create hexagon overlay
    const hexGroup = new THREE.Group();
    hexGroupRef.current = hexGroup;
    scene.add(hexGroup);

    const hexShape = createHexShape(0.04);
    const hexGeo = new THREE.ExtrudeGeometry(hexShape, {
      depth: 0.01,
      bevelEnabled: false
    });

    // Generate hexagons dengan density lebih tinggi
    const hexMeshes: THREE.Mesh[] = [];
    for (let lat = -80; lat <= 80; lat += 6) {
      const lonStep = Math.max(6, 12 / Math.cos(lat * Math.PI / 180));
      for (let lon = -180; lon <= 180; lon += lonStep) {
        const pos = latLonToVector3(lat, lon, 1.02);
        const isLand = Math.random() > 0.65;
        
        // Warna lebih vibrant
        const color = isLand 
          ? new THREE.Color().setHSL(0.25 + Math.random() * 0.15, 0.7, 0.45)
          : new THREE.Color(0x2244aa);

        const mat = new THREE.MeshPhongMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.2,
          flatShading: true,
          transparent: true,
          opacity: 0.85,
          shininess: 30
        });

        const hex = new THREE.Mesh(hexGeo, mat);
        hex.position.copy(pos);
        hex.lookAt(0, 0, 0);
        hex.userData = {
          originalPos: pos.clone(),
          originalColor: color.clone(),
          originalScale: 1,
          lat,
          lon,
          isLand
        };

        hexGroup.add(hex);
        hexMeshes.push(hex);
      }
    }

    // Country markers
    const markerGroup = new THREE.Group();
    countries.forEach((country) => {
      const pos = latLonToVector3(country.lat, country.lon, 1.15);
      
      const markerGeo = new THREE.SphereGeometry(0.025, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.95
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(pos);
      marker.userData = { country };

      // Pulse ring
      const ringGeo = new THREE.RingGeometry(0.03, 0.05, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xff4444,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.copy(pos);
      ring.lookAt(0, 0, 0);

      markerGroup.add(marker, ring);
    });
    scene.add(markerGroup);

    // Interaction
    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouse = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMouse.x;
        const deltaY = e.clientY - prevMouse.y;
        
        if (globeRef.current) globeRef.current.rotation.y += deltaX * 0.005;
        if (globeRef.current) globeRef.current.rotation.x += deltaY * 0.005;
        hexGroup.rotation.y += deltaX * 0.005;
        hexGroup.rotation.x += deltaY * 0.005;
        markerGroup.rotation.y += deltaX * 0.005;
        markerGroup.rotation.x += deltaY * 0.005;
        
        prevMouse = { x: e.clientX, y: e.clientY };
      }

      // 🎯 RAYCASTING FOR HEXAGON HOVER - Ini yang bikin lift effect!
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const hexIntersects = raycasterRef.current.intersectObjects(hexMeshes);
      
      // Reset all hexagons
      hexMeshes.forEach(h => {
        h.scale.set(1, 1, 1);
        (h.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.2;
      });

      if (hexIntersects.length > 0) {
        const hex = hexIntersects[0].object as THREE.Mesh;
        
        // 🚀 LIFT EFFECT - Scale up untuk "mengangkat" hexagon
        hex.scale.set(1.3, 1.3, 2.0); // X, Y, Z - Z yang besar = lift tinggi
        
        // Glow effect
        (hex.material as THREE.MeshPhongMaterial).emissiveIntensity = 0.6;
        
        setHoveredInfo(`${hex.userData.isLand ? '🌍 Land' : '🌊 Ocean'} | Lat: ${hex.userData.lat}°, Lon: ${hex.userData.lon}°`);
        document.body.style.cursor = 'pointer';
      } else {
        setHoveredInfo('');
        document.body.style.cursor = 'default';
      }

      // Check markers
      const markerIntersects = raycasterRef.current.intersectObjects(markerGroup.children);
      if (markerIntersects.length > 0 && markerIntersects[0].object.userData.country) {
        document.body.style.cursor = 'pointer';
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = () => {
      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const intersects = raycasterRef.current.intersectObjects(markerGroup.children);
      
      if (intersects.length > 0 && intersects[0].object.userData.country) {
        setSelectedCountry(intersects[0].object.userData.country as Country);
      }
    };

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('click', onClick);

    // Animation
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      if (!isDragging) {
        if (globeRef.current) globeRef.current.rotation.y += 0.0008;
        hexGroup.rotation.y += 0.0008;
        markerGroup.rotation.y += 0.0008;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const handleResize = () => {
      if (!currentMount) return;
      camera.aspect = currentMount.clientWidth / currentMount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('click', onClick);
      if (currentMount?.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      hexGeo.dispose();
      renderer.dispose();
    };
  }, [countries]);

  return (
    <div className="w-full h-screen bg-black relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 z-10 p-6 pointer-events-none">
        <h1 className="text-4xl font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">🌍</span> Interactive Hex Globe
        </h1>
        <p className="text-gray-400 text-sm mt-1">Hover hexagons to see them lift • Powered by Three.js</p>
      </div>

      {hoveredInfo && (
        <div className="absolute top-24 left-6 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 px-4 py-2 rounded-lg text-white text-sm z-10 pointer-events-none font-mono">
          {hoveredInfo}
        </div>
      )}

      <div ref={mountRef} className="w-full h-full" />

      {selectedCountry && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-6 max-w-md z-20 animate-fade">
          <div className="flex justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">{selectedCountry.name}</h2>
            <button onClick={() => setSelectedCountry(null)} className="text-gray-400 hover:text-white text-2xl">×</button>
          </div>
          <p className="text-gray-300">{selectedCountry.info}</p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-blue-900/30 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Latitude</p>
              <p className="text-white font-bold">{selectedCountry.lat.toFixed(2)}°</p>
            </div>
            <div className="bg-blue-900/30 p-3 rounded-lg">
              <p className="text-gray-400 text-xs">Longitude</p>
              <p className="text-white font-bold">{selectedCountry.lon.toFixed(2)}°</p>
            </div>
          </div>
        </div>
      )}

      {/* Tips panel */}
      <div className="absolute bottom-8 right-8 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-xl p-4 text-white text-xs max-w-xs">
        <h3 className="font-bold mb-2 text-blue-400">💡 Tips</h3>
        <ul className="space-y-1 text-gray-300">
          <li>• Hexagon lift = Scale transform on hover</li>
          <li>• Model brightness = Multiple directional lights</li>
          <li>• Smooth effect = emissiveIntensity animation</li>
        </ul>
      </div>

      <style jsx>{`
        .animate-fade {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default SimpleHexGlobe;