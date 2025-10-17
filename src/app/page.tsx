'use client'

import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function InteractiveGlobe() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // --- Starfield Background ---
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 20;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.02,
      transparent: true,
      opacity: 0.8
    });

    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    // --- Create globe ---
    const radius = 1;
    const segments = 64;
    const globeGeometry = new THREE.SphereGeometry(radius, segments, segments);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0x2266aa,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    // --- Dots on surface ---
    const dotGeometry = new THREE.SphereGeometry(0.01, 8, 8);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    interface DotData {
      mesh: THREE.Mesh;
      originalPos: THREE.Vector3;
      targetScale: number;
      currentScale: number;
    }

    const dots: DotData[] = [];
    for (let i = 0; i < 600; i++) {
      const lat = Math.random() * Math.PI - Math.PI / 2;
      const lon = Math.random() * Math.PI * 2;
      const x = radius * Math.cos(lat) * Math.cos(lon);
      const y = radius * Math.sin(lat);
      const z = radius * Math.cos(lat) * Math.sin(lon);

      const dot = new THREE.Mesh(dotGeometry, dotMaterial.clone());
      dot.position.set(x, y, z);
      globe.add(dot); // Add to globe instead of scene
      
      dots.push({
        mesh: dot,
        originalPos: new THREE.Vector3(x, y, z),
        targetScale: 1,
        currentScale: 1
      });
    }

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 3, 5);
    scene.add(pointLight);

    // --- Mouse state ---
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let autoRotate = true;

    // --- Raycaster for hover ---
    const raycaster = new THREE.Raycaster();
    let intersectionPoint = new THREE.Vector3();
    let hasIntersection = false;

    // --- Single mouse move handler ---
    const onMouseMove = (event: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      // Handle dragging
      if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        globe.rotation.y += deltaX * 0.005;
        globe.rotation.x += deltaY * 0.005;

        // Rotate starfield too (slower for parallax effect)
        starField.rotation.y += deltaX * 0.002;
        starField.rotation.x += deltaY * 0.002;

        previousMousePosition = { x: event.clientX, y: event.clientY };
        autoRotate = false;
      }
    };

    const onMouseDown = (event: MouseEvent) => {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
      setTimeout(() => {
        if (!isDragging) autoRotate = true;
      }, 1000);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mouseup", onMouseUp);

    // --- Animation loop ---
    let animationId: number;
    function animate() {
      animationId = requestAnimationFrame(animate);

      // Auto rotate globe and stars
      if (autoRotate) {
        globe.rotation.y += 0.001;
        starField.rotation.y += 0.0003;
      }

      // Raycasting against globe
      raycaster.setFromCamera(mouse, camera);
      const globeIntersects = raycaster.intersectObject(globe);

      if (globeIntersects.length > 0 && !isDragging) {
        // Convert intersection point to globe's local space
        const worldPoint = globeIntersects[0].point;
        const localPoint = globe.worldToLocal(worldPoint.clone());
        intersectionPoint = localPoint;
        hasIntersection = true;
      } else {
        hasIntersection = false;
      }

      // Update dots with optimized loop
      const maxDistance = 0.3;
      const lerpSpeed = 0.15;

      for (let i = 0; i < dots.length; i++) {
        const dotData = dots[i];
        
        if (hasIntersection) {
          const distance = dotData.originalPos.distanceTo(intersectionPoint);
          
          if (distance < maxDistance) {
            const influence = 1 - (distance / maxDistance);
            const liftAmount = influence * 0.25;
            dotData.targetScale = 1 + liftAmount;
          } else {
            dotData.targetScale = 1;
          }
        } else {
          dotData.targetScale = 1;
        }

        // Smooth interpolation
        dotData.currentScale += (dotData.targetScale - dotData.currentScale) * lerpSpeed;

        // Update position
        const normalizedPos = dotData.originalPos.clone().normalize();
        dotData.mesh.position.copy(normalizedPos.multiplyScalar(radius * dotData.currentScale));

        // Update color
        const mat = dotData.mesh.material as THREE.MeshBasicMaterial;
        const colorIntensity = Math.min((dotData.currentScale - 1) * 4, 1);
        mat.color.setRGB(
          colorIntensity * 2,
          1,
          1 - colorIntensity * 0.5
        );
      }

      renderer.render(scene, camera);
    }
    animate();

    // --- Resize ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener("resize", handleResize);

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("resize", handleResize);
      
      if (currentMount && currentMount.contains(renderer.domElement)) {
        currentMount.removeChild(renderer.domElement);
      }
      
      globeGeometry.dispose();
      globeMaterial.dispose();
      dotGeometry.dispose();
      dotMaterial.dispose();
      starsGeometry.dispose();
      starsMaterial.dispose();
      
      dots.forEach(dotData => {
        if (dotData.mesh.material instanceof THREE.Material) {
          dotData.mesh.material.dispose();
        }
      });
      
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-gradient-to-b from-black via-blue-950 to-black overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      <div className="absolute top-6 left-6 text-white font-mono pointer-events-none">
        <h1 className="text-3xl font-bold mb-2">Interactive Globe</h1>
        <p className="text-sm opacity-70">Hover to lift • Drag to rotate</p>
      </div>
    </div>
  );
}