// // components/Globe.tsx
// import { useEffect, useRef, useState } from 'react';
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// interface NDVIDataPoint {
//   lat: number;
//   lon: number;
//   ndvi: number;
//   date: string;
// }

// interface GlobeProps {
//   ndviData: NDVIDataPoint[];
//   onCountryClick?: (country: string, ndvi: number) => void;
// }

// export default function Globe({ ndviData, onCountryClick }: GlobeProps) {
//   const mountRef = useRef<HTMLDivElement>(null);
//   const [hoveredPoint, setHoveredPoint] = useState<NDVIDataPoint | null>(null);
//   const [selectedCountry, setSelectedCountry] = useState<string>('');

//   useEffect(() => {
//     if (!mountRef.current) return;

//     // Scene setup
//     const scene = new THREE.Scene();
//     const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
//     const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
//     renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
//     renderer.setPixelRatio(window.devicePixelRatio);
//     mountRef.current.appendChild(renderer.domElement);

//     // Controls
//     const controls = new OrbitControls(camera, renderer.domElement);
//     controls.enableDamping = true;
//     controls.dampingFactor = 0.05;

//     // Globe geometry
//     const globeRadius = 5;
//     const globeGeometry = new THREE.SphereGeometry(globeRadius, 64, 64);
    
//     // Create NDVI texture
//     const texture = createNDVITexture(ndviData, 1024, 512);
//     const globeMaterial = new THREE.MeshPhongMaterial({ 
//       map: texture,
//       transparent: true,
//       opacity: 0.9
//     });
    
//     const globe = new THREE.Mesh(globeGeometry, globeMaterial);
//     scene.add(globe);

//     // Add elevation based on NDVI
//     addNDVIElevation(globe, ndviData);

//     // Lighting
//     const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
//     scene.add(ambientLight);
    
//     const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
//     directionalLight.position.set(10, 5, 5);
//     scene.add(directionalLight);

//     // Stars background
//     addStarfield(scene);

//     camera.position.z = 15;

//     // Raycaster for interaction
//     const raycaster = new THREE.Raycaster();
//     const mouse = new THREE.Vector2();

//     function handleMouseMove(event: MouseEvent) {
//       if (!mountRef.current) return;
      
//       const rect = mountRef.current.getBoundingClientRect();
//       mouse.x = ((event.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1;
//       mouse.y = -((event.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1;

//       raycaster.setFromCamera(mouse, camera);
//       const intersects = raycaster.intersectObject(globe);

//       if (intersects.length > 0) {
//         const intersect = intersects[0];
//         const point = getClosestNDVIPoint(intersect.point, ndviData);
//         setHoveredPoint(point);
        
//         // Elevate hovered area
//         elevatePoint(globe, intersect.point, true);
//       } else {
//         setHoveredPoint(null);
//         resetElevation(globe);
//       }
//     }

//     function handleClick(event: MouseEvent) {
//       if (!mountRef.current || !hoveredPoint) return;

//       const country = reverseGeocode(hoveredPoint.lat, hoveredPoint.lon);
//       setSelectedCountry(country);
//       onCountryClick?.(country, hoveredPoint.ndvi);
      
//       // Animate click effect
//       animateClick(globe, hoveredPoint);
//     }

//     mountRef.current.addEventListener('mousemove', handleMouseMove);
//     mountRef.current.addEventListener('click', handleClick);

//     // Animation loop
//     function animate() {
//       requestAnimationFrame(animate);
//       controls.update();
//       globe.rotation.y += 0.001; // Slow rotation
//       renderer.render(scene, camera);
//     }
//     animate();

//     // Handle resize
//     function handleResize() {
//       if (!mountRef.current) return;
//       camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
//       camera.updateProjectionMatrix();
//       renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
//     }

//     window.addEventListener('resize', handleResize);

//     // Cleanup
//     return () => {
//       if (mountRef.current) {
//         mountRef.current.removeChild(renderer.domElement);
//         mountRef.current.removeEventListener('mousemove', handleMouseMove);
//         mountRef.current.removeEventListener('click', handleClick);
//       }
//       window.removeEventListener('resize', handleResize);
//     };
//   }, [ndviData]);

//   return (
//     <div className="relative w-full h-full">
//       <div ref={mountRef} className="w-full h-full" />
      
//       {/* Hover Tooltip */}
//       {hoveredPoint && (
//         <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
//           <div className="text-sm">
//             <div>NDVI: {hoveredPoint.ndvi.toFixed(3)}</div>
//             <div>Lat: {hoveredPoint.lat.toFixed(2)}°</div>
//             <div>Lon: {hoveredPoint.lon.toFixed(2)}°</div>
//           </div>
//         </div>
//       )}

//       {/* Selected Country Info */}
//       {selectedCountry && (
//         <div className="absolute top-4 right-4 bg-green-600 text-white p-4 rounded-lg max-w-sm">
//           <h3 className="font-bold text-lg">🌍 {selectedCountry}</h3>
//           <p className="mt-2">Vegetation health data loaded</p>
//         </div>
//       )}

//       {/* Legend */}
//       <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg">
//         <div className="text-sm mb-2">NDVI Scale:</div>
//         <div className="flex items-center space-x-2 text-xs">
//           <div className="w-4 h-4 bg-red-600"></div>
//           <span>Barren (≤ 0.1)</span>
//         </div>
//         <div className="flex items-center space-x-2 text-xs">
//           <div className="w-4 h-4 bg-yellow-600"></div>
//           <span>Grassland (0.2-0.5)</span>
//         </div>
//         <div className="flex items-center space-x-2 text-xs">
//           <div className="w-4 h-4 bg-green-600"></div>
//           <span>Forest (≥ 0.6)</span>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Helper functions
// function createNDVITexture(ndviData: NDVIDataPoint[], width: number, height: number): THREE.DataTexture {
//   const canvas = document.createElement('canvas');
//   canvas.width = width;
//   canvas.height = height;
//   const ctx = canvas.getContext('2d')!;

//   // Fill with ocean blue
//   ctx.fillStyle = '#1E3A8A';
//   ctx.fillRect(0, 0, width, height);

//   // Plot NDVI points
//   ndviData.forEach(point => {
//     const x = ((point.lon + 180) / 360) * width;
//     const y = ((90 - point.lat) / 180) * height;

//     // Color based on NDVI value
//     let color = '#DC2626'; // Red for low NDVI
//     if (point.ndvi > 0.2) color = '#D97706'; // Yellow for medium
//     if (point.ndvi > 0.5) color = '#16A34A'; // Green for high

//     ctx.fillStyle = color;
//     ctx.beginPath();
//     ctx.arc(x, y, 2, 0, 2 * Math.PI);
//     ctx.fill();
//   });

//   const texture = new THREE.CanvasTexture(canvas);
//   return texture;
// }

// function addNDVIElevation(globe: THREE.Mesh, ndviData: NDVIDataPoint[]) {
//   const geometry = globe.geometry as THREE.SphereGeometry;
//   const positions = geometry.attributes.position.array as Float32Array;
  
//   for (let i = 0; i < positions.length; i += 3) {
//     const x = positions[i];
//     const y = positions[i + 1];
//     const z = positions[i + 2];
    
//     // Convert to spherical coordinates
//     const lat = Math.asin(y / 5) * (180 / Math.PI);
//     const lon = Math.atan2(z, x) * (180 / Math.PI);
    
//     // Find closest NDVI point
//     const closest = getClosestNDVIPoint(new THREE.Vector3(x, y, z), ndviData);
//     if (closest && closest.ndvi > 0.3) {
//       // Elevate based on NDVI value
//       const elevation = closest.ndvi * 0.3;
//       const norm = new THREE.Vector3(x, y, z).normalize();
      
//       positions[i] += norm.x * elevation;
//       positions[i + 1] += norm.y * elevation;
//       positions[i + 2] += norm.z * elevation;
//     }
//   }
  
//   geometry.attributes.position.needsUpdate = true;
//   geometry.computeVertexNormals();
// }

// function getClosestNDVIPoint(position: THREE.Vector3, ndviData: NDVIDataPoint[]): NDVIDataPoint | null {
//   if (ndviData.length === 0) return null;

//   // Convert 3D position to lat/lon
//   const lat = Math.asin(position.y / 5) * (180 / Math.PI);
//   const lon = Math.atan2(position.z, position.x) * (180 / Math.PI);

//   let closest = ndviData[0];
//   let minDistance = Infinity;

//   ndviData.forEach(point => {
//     const distance = Math.sqrt(
//       Math.pow(point.lat - lat, 2) + Math.pow(point.lon - lon, 2)
//     );
//     if (distance < minDistance) {
//       minDistance = distance;
//       closest = point;
//     }
//   });

//   return minDistance < 10 ? closest : null; // Only return if reasonably close
// }

// function elevatePoint(globe: THREE.Mesh, point: THREE.Vector3, elevate: boolean) {
//   const geometry = globe.geometry as THREE.SphereGeometry;
//   const positions = geometry.attributes.position.array as Float32Array;
  
//   for (let i = 0; i < positions.length; i += 3) {
//     const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
//     const distance = vertex.distanceTo(point);
    
//     if (distance < 0.5) {
//       const norm = vertex.clone().normalize();
//       const elevation = elevate ? 0.2 : 0;
      
//       positions[i] = vertex.x + norm.x * elevation;
//       positions[i + 1] = vertex.y + norm.y * elevation;
//       positions[i + 2] = vertex.z + norm.z * elevation;
//     }
//   }
  
//   geometry.attributes.position.needsUpdate = true;
// }

// function resetElevation(globe: THREE.Mesh) {
//   // Reset all vertices to original sphere
//   const geometry = globe.geometry as THREE.SphereGeometry;
//   geometry.attributes.position.needsUpdate = true;
// }

// function animateClick(globe: THREE.Mesh, point: NDVIDataPoint) {
//   // Create ripple effect
//   const geometry = globe.geometry as THREE.SphereGeometry;
//   const positions = geometry.attributes.position.array as Float32Array;
//   const originalPositions = [...positions];
  
//   const clickPoint = new THREE.Vector3();
//   const latRad = point.lat * Math.PI / 180;
//   const lonRad = point.lon * Math.PI / 180;
//   clickPoint.set(
//     Math.cos(latRad) * Math.cos(lonRad) * 5,
//     Math.sin(latRad) * 5,
//     Math.cos(latRad) * Math.sin(lonRad) * 5
//   );

//   for (let i = 0; i < positions.length; i += 3) {
//     const vertex = new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]);
//     const distance = vertex.distanceTo(clickPoint);
    
//     if (distance < 1) {
//       const norm = vertex.clone().normalize();
//       const wave = Math.sin(distance * 10) * 0.3 * (1 - distance);
      
//       positions[i] = vertex.x + norm.x * wave;
//       positions[i + 1] = vertex.y + norm.y * wave;
//       positions[i + 2] = vertex.z + norm.z * wave;
//     }
//   }
  
//   geometry.attributes.position.needsUpdate = true;
  
//   // Reset after animation
//   setTimeout(() => {
//     for (let i = 0; i < positions.length; i++) {
//       positions[i] = originalPositions[i];
//     }
//     geometry.attributes.position.needsUpdate = true;
//   }, 500);
// }

// function addStarfield(scene: THREE.Scene) {
//   const starGeometry = new THREE.BufferGeometry();
//   const starCount = 1000;
//   const positions = new Float32Array(starCount * 3);
  
//   for (let i = 0; i < starCount * 3; i++) {
//     positions[i] = (Math.random() - 0.5) * 2000;
//   }
  
//   starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
//   const starMaterial = new THREE.PointsMaterial({
//     color: 0xffffff,
//     size: 2,
//     sizeAttenuation: true
//   });
  
//   const stars = new THREE.Points(starGeometry, starMaterial);
//   scene.add(stars);
// }

// function reverseGeocode(lat: number, lon: number): string {
//   // Simple reverse geocoding - in production, use a proper geocoding service
//   // This is a simplified version that returns approximate regions
//   if (lat > 20 && lon > -130 && lon < -60) return 'North America';
//   if (lat > -60 && lat < 20 && lon > -80 && lon < -30) return 'South America';
//   if (lat > 35 && lon > -10 && lon < 50) return 'Europe';
//   if (lat > -35 && lat < 35 && lon > 20 && lon < 60) return 'Africa';
//   if (lat > 10 && lon > 60 && lon < 150) return 'Asia';
//   if (lat < -10 && lon > 110 && lon < 180) return 'Australia';
//   return 'Ocean Region';
// }

// components/VoxelGlobe.tsx

'use client'; // Komponen ini interaktif, jadi harus menjadi Client Component

import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

// Radius utama dari globe kita
const GLOBE_RADIUS = 5;
// Jumlah titik yang akan kita generate di permukaan globe
const DOTS_COUNT = 10000;
// Ukuran setiap voxel
const VOXEL_SIZE = 0.05;

/**
 * Komponen ini bertanggung jawab untuk merender lautan.
 * Ini hanyalah sebuah bola biru yang halus.
 */
const Ocean = () => {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      {/* Warna biru tua dan sedikit transparan untuk lautan */}
      <meshStandardMaterial color="#001a33" roughness={0.9} transparent opacity={0.8} />
    </mesh>
  );
};

/**
 * Komponen ini adalah inti dari visualisasi kita.
 * Ia akan menghasilkan titik-titik di permukaan bola,
 * memeriksa apakah titik tersebut berada di daratan menggunakan tekstur peta,
 * dan kemudian merender voxel di lokasi daratan.
 */
const LandVoxels = () => {
  // Muat tekstur peta daratan kita. Suspense akan menangani loading state.
  const texture = useLoader(THREE.TextureLoader, '/textures/earth_bw.jpg');
  const meshRef = useRef<THREE.InstancedMesh>(null);

  // Langkah 1: Hitung posisi voxel.
  // useMemo sangat cocok di sini karena ini adalah kalkulasi berat
  // yang hanya perlu dijalankan kembali jika tekstur berubah.
  const voxelPositions = useMemo(() => {
    const positions: THREE.Vector3[] = [];
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx || !texture.image) {
      console.error('Failed to get canvas context or texture image.');
      return positions;
    }

    const img = texture.image;
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    tempCtx.drawImage(img, 0, 0, img.width, img.height);
    const imageData = tempCtx.getImageData(0, 0, img.width, img.height).data;

    // Generate titik-titik menggunakan Fibonacci lattice untuk distribusi yang merata
    const phi = Math.PI * (3.0 - Math.sqrt(5.0)); // Sudut emas

    for (let i = 0; i < DOTS_COUNT; i++) {
      const y = 1 - (i / (DOTS_COUNT - 1)) * 2; // y berada di antara -1 dan 1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      // Cek apakah titik ini ada di daratan
      const u = Math.atan2(x, z) / (2 * Math.PI) + 0.5;
      const v = Math.asin(y) / Math.PI + 0.5;
      const pixelX = Math.floor(u * img.width);
      const pixelY = Math.floor((1 - v) * img.height);
      const pixelIndex = (pixelY * img.width + pixelX) * 4;

      if (imageData[pixelIndex] > 128) {
        positions.push(new THREE.Vector3(
          x * GLOBE_RADIUS, 
          y * GLOBE_RADIUS, 
          z * GLOBE_RADIUS
        ));
      }
    }
    
    console.log('Voxel positions calculated:', positions.length);
    return positions;
  }, [texture]);
  
  // Langkah 2: Terapkan posisi ke mesh.
  // useEffect adalah hook yang tepat untuk side effect seperti memanipulasi objek Three.js.
  // Ini akan berjalan setelah komponen dirender dan setiap kali voxelPositions diperbarui.
  useEffect(() => {
    if (meshRef.current && voxelPositions.length > 0) {
      console.log('Applying positions to InstancedMesh...');
      const tempObject = new THREE.Object3D();
      for (let i = 0; i < voxelPositions.length; i++) {
        tempObject.position.copy(voxelPositions[i]);
        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(i, tempObject.matrix);
      }
      // Penting: Beri tahu Three.js bahwa matriks instansi perlu diunggah ulang ke GPU.
      meshRef.current.instanceMatrix.needsUpdate = true;
      console.log('InstancedMesh updated.');
    }
  }, [voxelPositions]);

  // Render InstancedMesh. Awalnya akan kosong, lalu diisi oleh useEffect.
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, voxelPositions.length]}>
      <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
      <meshStandardMaterial color="#aaffff" emissive="#00ffff" emissiveIntensity={0.3} roughness={0.5} />
    </instancedMesh>
  );
};


/**
 * Komponen utama yang menyatukan semua elemen 3D.
 */
export default function VoxelGlobe() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <Suspense fallback={null}>
          {/* Pencahayaan untuk membuat globe terlihat 3D */}
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 10, 7.5]} intensity={1.0} />

          {/* Latar belakang bintang-bintang */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <Ocean />
          <LandVoxels />

          {/* Kontrol untuk zoom dan putar globe */}
          <OrbitControls 
            enableZoom={true} 
            enablePan={false}
            minDistance={7}
            maxDistance={30}
            autoRotate={true}
            autoRotateSpeed={0.3}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}