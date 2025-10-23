'use client'

import { useRef, useMemo, Suspense, useEffect } from 'react'
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber'
import { OrbitControls, useTexture, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '../../lib/store'
import { fetchClimateDataForLocation } from '../../lib/climateApi'

function EarthGlobe() {
  const globeGroupRef = useRef<THREE.Group>(null)
  const wireframeRef = useRef<THREE.Mesh>(null)
  const pointsRef = useRef<THREE.Points>(null)
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster())
  const pointerPosRef = useRef<THREE.Vector2>(new THREE.Vector2())
  const globeUVRef = useRef<THREE.Vector2>(new THREE.Vector2())

  const { 
    setSelectedLocation, 
    setPanelOpen, 
    setIsMinimized,
    setClimateData,
    setLoadingClimate,
  } = useAppStore()
  
  // Load textures
  const colorMap = useTexture('/textures/00_earthmap1k.jpg')
  const otherMap = useTexture('/textures/04_rainbow1k.jpg')
  const elevMap = useTexture('/textures/01_earthbump1k.jpg')
  const alphaMap = useTexture('/textures/02_earthspec1k.jpg')
  
  // Shader uniforms - Simple version
  const uniforms = useMemo(() => ({
    size: { value: 4.0 },
    colorTexture: { value: colorMap },
    otherTexture: { value: otherMap },
    elevTexture: { value: elevMap },
    alphaTexture: { value: alphaMap },
    mouseUV: { value: new THREE.Vector2(0.0, 0.0) },
  }), [colorMap, otherMap, elevMap, alphaMap])

  // Vertex shader
  const vertexShader = `
    uniform float size;
    uniform sampler2D elevTexture;
    uniform vec2 mouseUV;

    varying vec2 vUv;
    varying float vVisible;
    varying float vDist;

    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
      float elv = texture2D(elevTexture, vUv).r;
      vec3 vNormal = normalMatrix * normal;
      vVisible = step(0.0, dot( -normalize(mvPosition.xyz), normalize(vNormal)));
      mvPosition.z += 0.35 * elv;

      float dist = distance(mouseUV, vUv);
      float zDisp = 0.0;
      float thresh = 0.04;
      if (dist < thresh) {
        zDisp = (thresh - dist) * 10.0;
      }
      vDist = dist;
      mvPosition.z += zDisp;

      gl_PointSize = size;
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  // Fragment shader - Original green-white style
  const fragmentShader = `
    uniform sampler2D colorTexture;
    uniform sampler2D alphaTexture;
    uniform sampler2D otherTexture;

    varying vec2 vUv;
    varying float vVisible;
    varying float vDist;

    void main() {
      if (floor(vVisible + 0.1) == 0.0) discard;
      
      vec3 color = texture2D(colorTexture, vUv).rgb;
      vec3 other = texture2D(otherTexture, vUv).rgb;
      
      // Check if this is land (not ocean)
      float blue = color.b;
      float green = color.g;
      float red = color.r;
      
      // Skip ocean areas (let solid ocean layer handle them)
      if (blue > red && blue > green && (blue + green + red) < 1.2) {
        discard;
      }
      
      // Hover effect - rainbow highlight on hover
      float thresh = 0.04;
      if (vDist < thresh) {
        color = mix(color, other, (thresh - vDist) * 50.0);
      }
      
      float alpha = 1.0 - texture2D(alphaTexture, vUv).r;
      alpha = alpha * 0.8;
      
      gl_FragColor = vec4(color, alpha);
    }
  `

  const wireframeGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 16), [])
  const pointsGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 120), [])
  const oceanGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 128), [])
  
  const wireframeMat = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: 0x0099ff,
    wireframe: true,
    transparent: true,
    opacity: 0.0,
    visible: false
  }), [])
  
  const pointsMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true
  }), [uniforms, vertexShader, fragmentShader])

  const handleRaycast = (camera: THREE.Camera) => {
    if (!raycasterRef.current || !pointerPosRef.current || !globeUVRef.current || !wireframeRef.current) return

    raycasterRef.current.setFromCamera(pointerPosRef.current, camera)
    const intersects = raycasterRef.current.intersectObjects([wireframeRef.current], false)

    if (intersects.length > 0) {
      if (intersects[0].uv) {
        globeUVRef.current.copy(intersects[0].uv)
      }
    }

    uniforms.mouseUV.value = globeUVRef.current
  }

  const uvToLatLng = (uv: THREE.Vector2): { lat: number; lng: number } => {
    const lat = (uv.y - 0.5) * 180
    const lng = (uv.x - 0.5) * 360
    return { lat, lng }
  }

  // Click handler to fetch climate data
  const handleGlobeClick = async (event: ThreeEvent<MouseEvent>) => {
    if (!event.point || !event.uv) return

    const { lat, lng } = uvToLatLng(event.uv)
    
    console.log(`🌍 Globe clicked at: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`)
    
    setSelectedLocation({ lat, lng })
    setPanelOpen(true)
    setIsMinimized(false)
    setLoadingClimate(true)

    try {
      console.log('🔄 Fetching climate data...')
      const data = await fetchClimateDataForLocation(lat, lng)
      setClimateData(data)
      console.log('✅ Climate data loaded successfully')
      console.log(`   Location: ${data.location.name}`)
      console.log(`   Temperature: ${data.summary.avgTemperature.toFixed(1)}°C`)
      console.log(`   Air Quality: ${data.summary.airQuality}`)
    } catch (error) {
      console.error('❌ Failed to load climate data:', error)
    } finally {
      setLoadingClimate(false)
    }
  }

  // Ocean material
  const oceanTexture = useTexture('/textures/00_earthmap1k.jpg')
  const oceanMatRef = useRef<THREE.ShaderMaterial | null>(null)

  const oceanMat = useMemo(() => {
    const oceanVertexShader = `
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        
        vec3 pos = position;
        float wave1 = sin(pos.x * 10.0 + time * 0.5) * 0.002;
        float wave2 = cos(pos.z * 8.0 + time * 0.7) * 0.002;
        float wave3 = sin(pos.y * 12.0 + time * 0.3) * 0.001;
        pos += normal * (wave1 + wave2 + wave3);
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        
        gl_Position = projectionMatrix * mvPosition;
      }
    `
    
    const oceanFragmentShader = `
      uniform sampler2D oceanTexture;
      uniform float time;
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      
      void main() {
        vec3 color = texture2D(oceanTexture, vUv).rgb;
        
        float blue = color.b;
        float green = color.g;
        float red = color.r;
        
        // Ocean detection
        bool isOcean = (blue > red * 1.05 && blue > green * 1.05) || 
                       ((blue + green + red) < 1.15);
        
        if (isOcean) {
          // Base ocean colors
          vec3 deepOcean = vec3(0.0, 0.1, 0.3);
          vec3 shallowOcean = vec3(0.0, 0.4, 0.7);
          vec3 baseOceanColor = mix(deepOcean, shallowOcean, blue);
          
          // Animated waves
          vec2 normalUV = vUv * 20.0;
          float normalWave1 = sin(normalUV.x * 3.0 + time * 0.8) * 0.5 + 0.5;
          float normalWave2 = cos(normalUV.y * 2.5 + time * 0.6) * 0.5 + 0.5;
          vec3 perturbedNormal = normalize(vNormal + vec3(
            (normalWave1 - 0.5) * 0.1,
            (normalWave2 - 0.5) * 0.1,
            0.0
          ));
          
          // Fresnel effect
          vec3 viewDir = normalize(vViewPosition);
          float fresnel = pow(1.0 - abs(dot(viewDir, perturbedNormal)), 3.0);
          vec3 fresnelColor = vec3(0.3, 0.6, 1.0);
          
          // Specular highlights
          vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
          vec3 reflectDir = reflect(-lightDir, perturbedNormal);
          float specular = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
          
          // Shimmer
          float shimmer = sin(vUv.x * 50.0 + time * 2.0) * 
                         cos(vUv.y * 50.0 + time * 1.5) * 0.1 + 0.9;
          
          // Combine effects
          vec3 finalColor = baseOceanColor;
          finalColor += fresnelColor * fresnel * 0.4;
          finalColor += vec3(1.0, 1.0, 1.0) * specular * 0.6;
          finalColor *= shimmer;
          
          float depth = 1.0 - blue * 0.3;
          finalColor *= depth;
          
          gl_FragColor = vec4(finalColor, 1.0);
        } else {
          discard;
        }
      }
    `
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        oceanTexture: { value: oceanTexture },
        time: { value: 0.0 }
      },
      vertexShader: oceanVertexShader,
      fragmentShader: oceanFragmentShader,
      transparent: true
    })
    
    oceanMatRef.current = material
    return material
  }, [oceanTexture])

  useFrame((state) => {
    if (globeGroupRef.current) {
      globeGroupRef.current.rotation.y += 0.002
    }
    handleRaycast(state.camera)
    
    if (oceanMatRef.current && oceanMatRef.current.uniforms.time) {
      oceanMatRef.current.uniforms.time.value = state.clock.getElapsedTime()
    }
  })
  
  useEffect(() => {
    const handleMouseMove = (evt: MouseEvent) => {
      if (!pointerPosRef.current) return
      pointerPosRef.current.set(
        (evt.clientX / window.innerWidth) * 2 - 1,
        -(evt.clientY / window.innerHeight) * 2 + 1
      )
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <group ref={globeGroupRef}>
      <mesh
        ref={wireframeRef}
        geometry={wireframeGeo}
        material={wireframeMat}
        onClick={handleGlobeClick}
      />
      <mesh geometry={oceanGeo} material={oceanMat} />
      <points ref={pointsRef} geometry={pointsGeo} material={pointsMat} />
    </group>
  )
}

function GlobeLoading() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  )
}

interface GlobeProps {
  className?: string
}

export default function Globe({ className }: GlobeProps) {
  return (
    <div className={className}>
      <Suspense fallback={<GlobeLoading />}>
        <Canvas
          camera={{ 
            position: [0, 0, 4],
            fov: 45,
            near: 0.1,
            far: 1000
          }}
          gl={{ antialias: true }}
          style={{ background: 'black' }}
        >
          <hemisphereLight args={[0xffffff, 0x080820, 3]} />
          <Stars 
            radius={50} 
            depth={50} 
            count={5000} 
            factor={4} 
            saturation={0.1} 
            fade 
            speed={0.5}
          />
          <EarthGlobe />
          <OrbitControls 
            enableDamping 
            dampingFactor={0.05}
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={2.5}  
            maxDistance={22.0}  
          />
        </Canvas>
      </Suspense>
    </div>
  )
}