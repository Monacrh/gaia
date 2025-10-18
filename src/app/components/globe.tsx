'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three-stdlib'

export default function Globe() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Scene, Camera, Renderer
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000)
    camera.position.z = 2.5

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)

    // Light
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(5, 3, 5)
    scene.add(light)

    // Texture dari Google Earth Engine
    const tileUrl = `https://earthengine.googleapis.com/v1/projects/cloudcomputing-445005/maps/3e53eeff899ee8a66152b4a8d3c0e2ff-6cd6eb89abd8187fa87a46f0ea5682fc/tiles/2/1/2`

    const loader = new THREE.TextureLoader()
    loader.load(
      tileUrl,
      (texture) => {
        const geometry = new THREE.SphereGeometry(1, 128, 128)
        const material = new THREE.MeshPhongMaterial({
          map: texture,
          bumpMap: texture,
          bumpScale: 0.05,
        })
        const globe = new THREE.Mesh(geometry, material)
        scene.add(globe)

        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true

        const animate = () => {
          requestAnimationFrame(animate)
          controls.update()
          renderer.render(scene, camera)
        }
        animate()
      },
      undefined,
      (err) => console.error('Texture load error:', err)
    )

    const handleResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(mount.clientWidth, mount.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      mount.removeChild(renderer.domElement)
    }
  }, [])

  return <div ref={mountRef} className="w-full h-[100vh] bg-black" />
}
