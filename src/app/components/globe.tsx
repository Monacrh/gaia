// 'use client'; // Komponen ini interaktif, jadi harus menjadi Client Component

// import { Canvas, useLoader } from '@react-three/fiber';
// import { OrbitControls, Stars } from '@react-three/drei';
// import { Suspense, useMemo, useRef, useEffect } from 'react';
// import * as THREE from 'three';

// // Radius utama dari globe kita
// const GLOBE_RADIUS = 5;
// // Jumlah titik yang akan kita generate di permukaan globe
// const DOTS_COUNT = 10000;
// // Ukuran setiap voxel
// const VOXEL_SIZE = 0.05;

// /**
//  * Komponen ini bertanggung jawab untuk merender lautan.
//  * Ini hanyalah sebuah bola biru yang halus.
//  */
// const Ocean = () => {
//   return (
//     <mesh>
//       <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
//       {/* Warna biru tua dan sedikit transparan untuk lautan */}
//       <meshStandardMaterial color="#001a33" roughness={0.9} transparent opacity={0.8} />
//     </mesh>
//   );
// };

// /**
//  * Komponen ini adalah inti dari visualisasi kita.
//  * Ia akan menghasilkan titik-titik di permukaan bola,
//  * memeriksa apakah titik tersebut berada di daratan menggunakan tekstur peta,
//  * dan kemudian merender voxel di lokasi daratan.
//  */
// const LandVoxels = () => {
//   // Muat tekstur peta daratan kita. Suspense akan menangani loading state.
//   const texture = useLoader(THREE.TextureLoader, '/textures/earth_bw.jpg');
//   const meshRef = useRef<THREE.InstancedMesh>(null);

//   // Langkah 1: Hitung posisi voxel.
//   // useMemo sangat cocok di sini karena ini adalah kalkulasi berat
//   // yang hanya perlu dijalankan kembali jika tekstur berubah.
//   const voxelPositions = useMemo(() => {
//     const positions: THREE.Vector3[] = [];
//     const tempCanvas = document.createElement('canvas');
//     const tempCtx = tempCanvas.getContext('2d');
    
//     if (!tempCtx || !texture.image) {
//       console.error('Failed to get canvas context or texture image.');
//       return positions;
//     }

//     const img = texture.image;
//     tempCanvas.width = img.width;
//     tempCanvas.height = img.height;
//     tempCtx.drawImage(img, 0, 0, img.width, img.height);
//     const imageData = tempCtx.getImageData(0, 0, img.width, img.height).data;

//     // Generate titik-titik menggunakan Fibonacci lattice untuk distribusi yang merata
//     const phi = Math.PI * (3.0 - Math.sqrt(5.0)); // Sudut emas

//     for (let i = 0; i < DOTS_COUNT; i++) {
//       const y = 1 - (i / (DOTS_COUNT - 1)) * 2; // y berada di antara -1 dan 1
//       const radius = Math.sqrt(1 - y * y);
//       const theta = phi * i;

//       const x = Math.cos(theta) * radius;
//       const z = Math.sin(theta) * radius;

//       // Cek apakah titik ini ada di daratan
//       const u = Math.atan2(x, z) / (2 * Math.PI) + 0.5;
//       const v = Math.asin(y) / Math.PI + 0.5;
//       const pixelX = Math.floor(u * img.width);
//       const pixelY = Math.floor((1 - v) * img.height);
//       const pixelIndex = (pixelY * img.width + pixelX) * 4;

//       if (imageData[pixelIndex] > 128) {
//         positions.push(new THREE.Vector3(
//           x * GLOBE_RADIUS, 
//           y * GLOBE_RADIUS, 
//           z * GLOBE_RADIUS
//         ));
//       }
//     }
    
//     console.log('Voxel positions calculated:', positions.length);
//     return positions;
//   }, [texture]);
  
//   // Langkah 2: Terapkan posisi ke mesh.
//   // useEffect adalah hook yang tepat untuk side effect seperti memanipulasi objek Three.js.
//   // Ini akan berjalan setelah komponen dirender dan setiap kali voxelPositions diperbarui.
//   useEffect(() => {
//     if (meshRef.current && voxelPositions.length > 0) {
//       console.log('Applying positions to InstancedMesh...');
//       const tempObject = new THREE.Object3D();
//       for (let i = 0; i < voxelPositions.length; i++) {
//         tempObject.position.copy(voxelPositions[i]);
//         tempObject.updateMatrix();
//         meshRef.current.setMatrixAt(i, tempObject.matrix);
//       }
//       // Penting: Beri tahu Three.js bahwa matriks instansi perlu diunggah ulang ke GPU.
//       meshRef.current.instanceMatrix.needsUpdate = true;
//       console.log('InstancedMesh updated.');
//     }
//   }, [voxelPositions]);

//   // Render InstancedMesh. Awalnya akan kosong, lalu diisi oleh useEffect.
//   return (
//     <instancedMesh ref={meshRef} args={[undefined, undefined, voxelPositions.length]}>
//       <boxGeometry args={[VOXEL_SIZE, VOXEL_SIZE, VOXEL_SIZE]} />
//       <meshStandardMaterial color="#aaffff" emissive="#00ffff" emissiveIntensity={0.3} roughness={0.5} />
//     </instancedMesh>
//   );
// };


// /**
//  * Komponen utama yang menyatukan semua elemen 3D.
//  */
// export default function VoxelGlobe() {
//   return (
//     <div className="w-full h-full">
//       <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
//         <Suspense fallback={null}>
//           {/* Pencahayaan untuk membuat globe terlihat 3D */}
//           <ambientLight intensity={0.2} />
//           <directionalLight position={[5, 10, 7.5]} intensity={1.0} />

//           {/* Latar belakang bintang-bintang */}
//           <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
//           <Ocean />
//           <LandVoxels />

//           {/* Kontrol untuk zoom dan putar globe */}
//           <OrbitControls 
//             enableZoom={true} 
//             enablePan={false}
//             minDistance={7}
//             maxDistance={30}
//             autoRotate={true}
//             autoRotateSpeed={0.3}
//           />
//         </Suspense>
//       </Canvas>
//     </div>
//   );
// }

// 'use client';

// import { Canvas, useLoader } from '@react-three/fiber';
// import { OrbitControls, Stars } from '@react-three/drei';
// import { Suspense, useMemo, useRef, useEffect } from 'react';
// import * as THREE from 'three';

// const GLOBE_RADIUS = 5;
// const DOTS_COUNT = 80000;
// const MAX_VOXEL_HEIGHT = 0.5;

// const Ocean = () => {
//   return (
//     <mesh>
//       <sphereGeometry args={[GLOBE_RADIUS - 0.01, 64, 64]} />
//       <meshStandardMaterial color="#00254d" roughness={0.9} />
//     </mesh>
//   );
// };

// const LandVoxels = () => {
//   // Load 2 tekstur: heightmap untuk ketinggian, color map untuk warna
//   const heightTexture = useLoader(THREE.TextureLoader, '/textures/nasa_earth_bump.jpg');
//   const colorTexture = useLoader(THREE.TextureLoader, '/textures/nasa2.jpg');
//   const meshRef = useRef<THREE.InstancedMesh>(null);

//   const voxelData = useMemo(() => {
//     if (!heightTexture.image || !colorTexture.image) return [];
    
//     // Canvas untuk heightmap
//     const heightCanvas = document.createElement('canvas');
//     const heightCtx = heightCanvas.getContext('2d', { willReadFrequently: true });
    
//     // Canvas untuk color map
//     const colorCanvas = document.createElement('canvas');
//     const colorCtx = colorCanvas.getContext('2d', { willReadFrequently: true });
    
//     if (!heightCtx || !colorCtx) return [];

//     // Setup height canvas
//     const heightImg = heightTexture.image;
//     heightCanvas.width = heightImg.width;
//     heightCanvas.height = heightImg.height;
//     heightCtx.drawImage(heightImg, 0, 0);
//     const heightData = heightCtx.getImageData(0, 0, heightImg.width, heightImg.height).data;

//     // Setup color canvas
//     const colorImg = colorTexture.image;
//     colorCanvas.width = colorImg.width;
//     colorCanvas.height = colorImg.height;
//     colorCtx.drawImage(colorImg, 0, 0);
//     const colorData = colorCtx.getImageData(0, 0, colorImg.width, colorImg.height).data;

//     const finalData = [];
//     const phi = Math.PI * (3.0 - Math.sqrt(5.0));
    
//     for (let i = 0; i < DOTS_COUNT; i++) {
//       const y = 1 - (i / (DOTS_COUNT - 1)) * 2;
//       const radius = Math.sqrt(1 - y * y);
//       const theta = phi * i;
//       const x = Math.cos(theta) * radius;
//       const z = Math.sin(theta) * radius;
      
//       const pointOnSphere = new THREE.Vector3(x, y, z);
//       const u = Math.atan2(x, z) / (2 * Math.PI) + 0.5;
//       const v = Math.asin(y) / Math.PI + 0.5;
      
//       // Get height value
//       const heightX = Math.floor(u * heightImg.width);
//       const heightY = Math.floor((1 - v) * heightImg.height);
//       const heightIndex = (heightY * heightImg.width + heightX) * 4;
//       const heightValue = heightData[heightIndex] / 255;

//       // Get color value dari tekstur warna asli
//       const colorX = Math.floor(u * colorImg.width);
//       const colorY = Math.floor((1 - v) * colorImg.height);
//       const colorIndex = (colorY * colorImg.width + colorX) * 4;
      
//       const r = colorData[colorIndex] / 255;
//       const g = colorData[colorIndex + 1] / 255;
//       const b = colorData[colorIndex + 2] / 255;

//       // Filter hanya daratan (nilai heightmap > threshold tertentu)
//       if (heightValue > 0.05) {
//         const voxelHeight = heightValue * MAX_VOXEL_HEIGHT;
//         const color = new THREE.Color(r, g, b);
        
//         finalData.push({ position: pointOnSphere, height: voxelHeight, color });
//       }
//     }
    
//     return finalData;
//   }, [heightTexture, colorTexture]);
  
//   const tempObject = useMemo(() => new THREE.Object3D(), []);
//   const tempVec = useMemo(() => new THREE.Vector3(), []);
//   const tempQuat = useMemo(() => new THREE.Quaternion(), []);

//   useEffect(() => {
//     if (!meshRef.current || voxelData.length === 0) return;
//     const defaultUp = new THREE.Vector3(0, 0, 1);
//     voxelData.forEach((data, i) => {
//       const position = tempVec.copy(data.position).multiplyScalar(GLOBE_RADIUS + data.height / 2);
//       const normal = data.position.clone().normalize();
//       tempQuat.setFromUnitVectors(defaultUp, normal);
//       const scale = new THREE.Vector3(1, 1, data.height);
//       tempObject.matrix.compose(position, tempQuat, scale);
//       meshRef.current!.setMatrixAt(i, tempObject.matrix);
//       meshRef.current!.setColorAt(i, data.color);
//     });
//     meshRef.current.instanceMatrix.needsUpdate = true;
//     if (meshRef.current.instanceColor) {
//       meshRef.current.instanceColor.needsUpdate = true;
//     }
//   }, [voxelData, tempObject, tempQuat, tempVec]);
  
//   if (voxelData.length === 0) return null;

//   return (
//     <instancedMesh
//       ref={meshRef}
//       args={[undefined, undefined, voxelData.length]}
//     >
//       <boxGeometry args={[0.05, 0.05, 1]} />
//       <meshStandardMaterial vertexColors={true} roughness={0.7} />
//     </instancedMesh>
//   );
// };

// export default function VoxelGlobe() {
//   return (
//     <div className="w-full h-full">
//       <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
//         <Suspense fallback={null}>
//           <ambientLight intensity={1.5} />
//           <directionalLight position={[5, 10, 7.5]} intensity={2.5} />
//           <Stars radius={200} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
//           <Ocean />
//           <LandVoxels />
//           <OrbitControls
//             enableZoom={true}
//             enablePan={false}
//             minDistance={7}
//             maxDistance={30}
//             autoRotate={true}
//             autoRotateSpeed={0.3}
//           />
//         </Suspense>
//       </Canvas>
//     </div>
//   );
// }

// File: src/app/components/globe.tsx

'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Detailed, Html } from '@react-three/drei';
import { Suspense, useMemo, useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

// Tipe data yang sama dengan di backend
interface VoxelDataPoint {
  lat: number;
  lon: number;
  ndvi: number;
  r: number;
  g: number;
  b: number;
}

const GLOBE_RADIUS = 5;
const MAX_VOXEL_HEIGHT = 0.7; // Sedikit lebih tinggi untuk efek dramatis

// --- Komponen Voxel ---
const VoxelLand = ({ voxelData }: { voxelData: VoxelDataPoint[] }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  const processedData = useMemo(() => {
    if (!voxelData || voxelData.length === 0) return [];
    
    let minNdvi = 1.0, maxNdvi = -1.0;
    voxelData.forEach(item => {
      if (item.ndvi < minNdvi) minNdvi = item.ndvi;
      if (item.ndvi > maxNdvi) maxNdvi = item.ndvi;
    });
    const ndviRange = maxNdvi - minNdvi;

    return voxelData.map(item => {
      const normalizedHeight = ndviRange > 0 ? (item.ndvi - minNdvi) / ndviRange : 0;
      const voxelHeight = normalizedHeight * MAX_VOXEL_HEIGHT;

      const latRad = item.lat * (Math.PI / 180);
      const lonRad = item.lon * (Math.PI / 180);
      const x = -GLOBE_RADIUS * Math.cos(latRad) * Math.cos(lonRad);
      const y = GLOBE_RADIUS * Math.sin(latRad);
      const z = GLOBE_RADIUS * Math.cos(latRad) * Math.sin(lonRad);
      
      return {
        position: new THREE.Vector3(x, y, z),
        height: Math.max(0.01, voxelHeight), // Pastikan tinggi minimum
        color: new THREE.Color(item.r, item.g, item.b).multiplyScalar(1.5), // Sedikit lebih cerah
      };
    });
  }, [voxelData]);

  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempVec = useMemo(() => new THREE.Vector3(), []);
  const tempQuat = useMemo(() => new THREE.Quaternion(), []);

  useEffect(() => {
    if (!meshRef.current || processedData.length === 0) return;
    const defaultUp = new THREE.Vector3(0, 0, 1);
    processedData.forEach((data, i) => {
      const position = tempVec.copy(data.position).normalize().multiplyScalar(GLOBE_RADIUS + data.height / 2);
      const normal = data.position.clone().normalize();
      tempQuat.setFromUnitVectors(defaultUp, normal);
      const scale = new THREE.Vector3(1, 1, data.height);
      tempObject.matrix.compose(position, tempQuat, scale);
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
      meshRef.current!.setColorAt(i, data.color);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [processedData]);
  
  if (processedData.length === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, processedData.length]}>
      <boxGeometry args={[0.07, 0.07, 1]} />
      <meshStandardMaterial vertexColors={true} roughness={0.8} />
    </instancedMesh>
  );
};

// --- Komponen Globe Utama ---
export default function VoxelGlobe() {
  const [earthData, setEarthData] = useState<VoxelDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEarthData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch('/api/earth-engine/earth-data');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.statusText}`);
        }
        const data = await response.json();
        setEarthData(data);
      } catch (err: any) {
        console.error("Error fetching GEE data:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarthData();
  }, []);

  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 5]} intensity={2.0} />
          <Stars radius={200} count={5000} factor={4} fade speed={1} />
          
          {/* Tampilkan Voxel jika data sudah siap */}
          {!isLoading && !error && <VoxelLand voxelData={earthData} />}
          
          {/* Fallback berupa lautan biru */}
          <mesh>
            <sphereGeometry args={[GLOBE_RADIUS - 0.02, 64, 64]} />
            <meshStandardMaterial color="#001529" roughness={0.9} />
          </mesh>

          <OrbitControls
            enableZoom={true}
            enablePan={false}
            minDistance={7}
            maxDistance={30}
            autoRotate={true}
            autoRotateSpeed={0.2}
          />
        </Suspense>
      </Canvas>
      
      {/* Tampilkan status Loading atau Error */}
      {(isLoading || error) && (
        <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center pointer-events-none">
          <div className="text-white bg-black bg-opacity-50 p-4 rounded-lg">
            {isLoading ? 'Mengambil data dari Satelit...' : `Error: ${error}`}
          </div>
        </div>
      )}
    </div>
  );
}