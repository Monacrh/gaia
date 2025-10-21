'use client'

import Globe from './components/globe'
import { useAppStore } from '@/lib/store'
import Image from 'next/image'

// Temporary loading component
function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
    </div>
  )
}

export default function HomePage() {
  const { isPanelOpen, togglePanel, isChatOpen } = useAppStore()

  return (
    <>
      {/* Header */}
      {/* <header className="absolute top-0 left-0 right-0 z-10 p-4 md:p-6">
        <div className="flex items-center justify-between">
                 <div className="text-white">
                   <div className="flex items-center gap-3">
                     <Image 
                       src="/logo/logo-text.png" 
                       alt="Bloome" 
                       width={120}
                       height={40}
                       className="h-10 w-auto -ml-1.5"
                     />
                   </div>
                   <p className="text-blue-200 text-sm md:text-base">Our Planet in Bloom</p>
                 </div>
        </div>
      </header> */}

      {/* Main Content - Globe Background with Overlay Panels */}
      <main className="relative h-screen w-screen overflow-hidden bg-black">
        {/* Globe Background - Full Screen */}
        <Globe className="absolute inset-0 z-0" />    
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 right-4 md:right-6 z-10 p-2 md:p-4">
        <div className="text-white/60 text-xs md:text-sm">
          <p>Powered by NASA Landsat Data</p>
        </div>
      </footer>
    </>
  )
}
