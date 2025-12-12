'use client'

import Globe from './components/globe'
import ClimatePanel from '../app/components/climatePanel'
import { useAppStore } from '@/lib/store'
import { useEffect } from 'react'

export default function HomePage() {
  const { animationPlaying, currentYear, setCurrentYear } = useAppStore()

  // Auto-advance year animation
  useEffect(() => {
    if (!animationPlaying) return

    const interval = setInterval(() => {
      setCurrentYear(prev => {
        const maxYear = new Date().getFullYear()
        if (prev >= maxYear) {
          return 1960 // Loop back
        }
        return prev + 1
      })
    }, 500) // Change year every 500ms

    return () => clearInterval(interval)
  }, [animationPlaying, setCurrentYear])

  return (
    <>
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              🌍 Climate Globes
            </h1>
            <p className="text-blue-200 text-sm md:text-base">
              Interactive Climate Data Visualization
            </p>
          </div>
        </div>
      </header>

      {/* Main Content - Globe Background */}
      <main className="relative h-screen w-screen overflow-hidden bg-black">
        {/* Globe Background - Full Screen */}
        <Globe className="absolute inset-0 z-0" />

        {/* Climate Data Panel - Overlay */}
        <ClimatePanel />

        {/* Instructions Overlay */}
        {/* <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 text-white text-sm max-w-xs z-10">
          <p className="font-semibold mb-2">💡 How to Use:</p>
          <ul className="space-y-1 text-xs text-gray-300">
            <li>• Click anywhere on the globe to view climate data</li>
            <li>• Use checkboxes to toggle visualization layers</li>
            <li>• Drag the time slider to see changes over time</li>
            <li>• Click Play to animate climate change</li>
          </ul>
        </div> */}
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 right-4 md:right-6 z-10 p-2 md:p-4">
        <div className="text-white/60 text-xs md:text-sm">
          <p>Data: NASA GISTEMP, World Bank, OpenWeatherMap</p>
        </div>
      </footer>
    </>
  )
}


// 'use client'

// import Globe from './components/globe'
// import { useAppStore } from '@/lib/store'
// import Image from 'next/image'

// // Temporary loading component
// function Loading() {
//   return (
//     <div className="flex items-center justify-center h-screen">
//       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
//     </div>
//   )
// }

// export default function HomePage() {
//   const { isPanelOpen, togglePanel, isChatOpen } = useAppStore()

//   return (
//     <>
//       {/* Header */}
//       {/* <header className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
//         <div className="flex items-center justify-between">
//                  <div className="text-white">
//                    <div className="flex items-center gap-3">
//                      <Image 
//                        src="/logo/logo-text.png" 
//                        alt="Bloome" 
//                        width={120}
//                        height={40}
//                        className="h-10 w-auto -ml-1.5"
//                      />
//                    </div>
//                    <p className="text-blue-200 text-sm md:text-base">Our Planet in Bloom</p>
//                  </div>
//         </div>
//       </header> */}

//       {/* Main Content - Globe Background with Overlay Panels */}
//       <main className="relative h-screen w-screen overflow-hidden bg-black">
//         {/* Globe Background - Full Screen */}
//         <Globe className="absolute inset-0 z-0" />    
//       </main>

//       {/* Footer */}
//       <footer className="absolute bottom-0 right-4 md:right-6 z-10 p-2 md:p-4">
//         <div className="text-white/60 text-xs md:text-sm">
//           <p>Powered by NASA Landsat Data</p>
//         </div>
//       </footer>
//     </>
//   )
// }
