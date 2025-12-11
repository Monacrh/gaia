import { useAppStore } from '@/lib/store' // Gunakan store asli
import { temperatureToColor, co2ToColor, aqiToColor, colorMappingToCSS } from '@/lib/colorMapping' // Helper warna asli
import { X, Minimize2, Maximize2, TrendingUp, Wind, ThermometerSun } from 'lucide-react'

export default function ClimatePanel() {
  // Mengambil state dan fungsi dari store asli (yang terhubung dengan Map)
  const { 
    isPanelOpen, 
    isMinimized, 
    climateData, 
    isLoadingClimate,
    showTemperature,
    showCO2,
    showPollution,
    currentYear,
    animationPlaying,
    setPanelOpen,
    setIsMinimized,
    toggleTemperature,
    toggleCO2,
    togglePollution,
    setCurrentYear,
    toggleAnimation
  } = useAppStore()

  if (!isPanelOpen) return null

  return (
    <>
      <style>{`
        /* Custom Scrollbar Styles */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.6);
        }

        /* Firefox scrollbar */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 211, 238, 0.3) rgba(255, 255, 255, 0.05);
        }

        /* Custom slider styles */
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          background: #22d3ee;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(34, 211, 238, 0.5);
          transition: all 0.2s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 15px rgba(34, 211, 238, 0.8);
        }
        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          background: #22d3ee;
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
        }

        /* Animations */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes pulse-slower {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.08); }
        }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slower 6s ease-in-out infinite; }
      `}</style>

      {/* Main Container - Terhubung dengan pointer events & fixed layout */}
      <div className="fixed right-4 top-4 bottom-4 z-50 w-96 max-h-[calc(100vh-2rem)] flex flex-col pointer-events-auto transition-all duration-300">
        
        {/* Background Layer */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-900/40 via-purple-900/20 to-cyan-900/20 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent border-r border-b border-white/5 rounded-3xl" />
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-400/20 rounded-full blur-2xl animate-pulse-slow mix-blend-screen" />
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl animate-pulse-slower mix-blend-screen" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full overflow-hidden rounded-3xl">
          
          {/* Header */}
          <div className="flex-none flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl backdrop-blur-md border border-cyan-400/30">
                <ThermometerSun className="w-5 h-5 text-cyan-300" />
              </div>
              <span className="bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                Climate Vision
              </span>
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 border border-transparent hover:border-cyan-400/30 group cursor-pointer"
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4 text-cyan-300" />
                ) : (
                  <Minimize2 className="w-4 h-4 text-cyan-300" />
                )}
              </button>
              <button
                onClick={() => setPanelOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-all duration-300 border border-transparent hover:border-red-400/30 group cursor-pointer"
              >
                <X className="w-4 h-4 text-cyan-300" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              
              {/* Loading State */}
              {isLoadingClimate && (
                <div className="flex items-center justify-center py-12">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-cyan-400/30 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
                    </div>
                  </div>
                </div>
              )}

              {/* Climate Data Display */}
              {!isLoadingClimate && climateData && (
                <>
                  {/* Location Info */}
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-lg">
                    <p className="text-sm text-cyan-300/80 font-light mb-2">Selected Location</p>
                    <p className="text-xl text-white font-semibold mb-1">
                      {climateData.location.name}
                    </p>
                    <p className="text-xs text-cyan-200/60 font-mono">
                      {climateData.location.lat.toFixed(4)}°, {climateData.location.lon.toFixed(4)}°
                    </p>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Temperature */}
                    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 backdrop-blur-md p-4 rounded-2xl border border-orange-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <ThermometerSun className="w-3.5 h-3.5 text-orange-400" />
                        <p className="text-xs text-orange-200/80">Temperature</p>
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">
                        {climateData.summary.avgTemperature.toFixed(1)}°C
                      </p>
                      <p className="text-xs text-orange-300/80">
                        {climateData.summary.temperatureChange > 0 ? '+' : ''}
                        {climateData.summary.temperatureChange.toFixed(2)}°C anomaly
                      </p>
                    </div>

                    {/* CO2 */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-yellow-500/5 backdrop-blur-md p-4 rounded-2xl border border-emerald-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        <p className="text-xs text-emerald-200/80">CO2 Level</p>
                      </div>
                      <p className="text-2xl font-bold text-white mb-1">
                        {climateData.summary.currentCO2.toFixed(1)}
                      </p>
                      <p className="text-xs text-emerald-300/80">
                         {climateData.summary.co2Growth > 0 ? '+' : ''}
                         {climateData.summary.co2Growth.toFixed(0)}% growth
                      </p>
                    </div>

                    {/* Air Quality */}
                    {climateData.pollution && (
                      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/5 backdrop-blur-md p-4 rounded-2xl border border-blue-500/20 col-span-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wind className="w-3.5 h-3.5 text-blue-300" />
                          <div>
                            <p className="text-xs text-blue-200/80">Air Quality</p>
                            <p className="text-xl font-bold text-white">{climateData.pollution.aqi}</p>
                          </div>
                        </div>
                        <span 
                          className="px-4 py-1.5 rounded-full text-sm font-semibold border shadow-lg backdrop-blur-xl"
                          style={{
                            backgroundColor: `${colorMappingToCSS(aqiToColor(climateData.pollution.aqi))}20`,
                            borderColor: `${colorMappingToCSS(aqiToColor(climateData.pollution.aqi))}40`,
                            color: colorMappingToCSS(aqiToColor(climateData.pollution.aqi)) || 'white'
                          }}
                        >
                          {climateData.summary.airQuality}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Visualization Controls */}
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl space-y-4 border border-white/10">
                    <p className="text-sm font-semibold text-cyan-300/80">Visualization Layers</p>
                    
                    <label className="flex items-center gap-4 cursor-pointer group p-2 hover:bg-white/5 rounded-xl transition-all relative z-20">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={showTemperature}
                          onChange={toggleTemperature}
                          className="w-5 h-5 rounded-lg border-white/30 bg-white/10 checked:bg-orange-500 checked:border-orange-400 cursor-pointer"
                        />
                      </div>
                      <span className="text-sm text-gray-200 group-hover:text-white flex-1">Temperature Anomaly</span>
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-red-500 opacity-80" />
                    </label>

                    <label className="flex items-center gap-4 cursor-pointer group p-2 hover:bg-white/5 rounded-xl transition-all relative z-20">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={showCO2}
                          onChange={toggleCO2}
                          className="w-5 h-5 rounded-lg border-white/30 bg-white/10 checked:bg-emerald-500 checked:border-emerald-400 cursor-pointer"
                        />
                      </div>
                      <span className="text-sm text-gray-200 group-hover:text-white flex-1">CO2 Emissions</span>
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-green-500 to-red-500 opacity-80" />
                    </label>

                    <label className="flex items-center gap-4 cursor-pointer group p-2 hover:bg-white/5 rounded-xl transition-all relative z-20">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={showPollution}
                          onChange={togglePollution}
                          className="w-5 h-5 rounded-lg border-white/30 bg-white/10 checked:bg-blue-500 checked:border-blue-400 cursor-pointer"
                        />
                      </div>
                      <span className="text-sm text-gray-200 group-hover:text-white flex-1">Air Pollution</span>
                      <div className="w-6 h-6 rounded bg-gradient-to-br from-green-400 to-purple-600 opacity-80" />
                    </label>
                  </div>

                  {/* Time Animation Slider */}
                  <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl space-y-4 border border-white/10">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-cyan-300/80">Timeline</p>
                      <button
                        onClick={toggleAnimation}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer relative z-20 ${
                          animationPlaying 
                            ? 'bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30' 
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'
                        }`}
                      >
                        {animationPlaying ? 'Pause' : 'Play Animation'}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-cyan-200/60">
                        <span>1960</span>
                        <span className="text-white font-mono text-lg font-bold">{currentYear}</span>
                        <span>{new Date().getFullYear()}</span>
                      </div>
                      <div className="relative w-full h-4 flex items-center">
                        <input
                          type="range"
                          min="1960"
                          max={new Date().getFullYear()}
                          value={currentYear}
                          onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer slider relative z-20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Temperature Chart Analysis */}
                  {climateData.temperature.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/10">
                      <p className="text-sm font-semibold text-cyan-300/80 mb-4">Trend Analysis</p>
                      
                      {/* Fixed Chart: Overflow Hidden added */}
                      <div className="h-28 relative w-full overflow-hidden rounded-lg bg-black/10">
                        <div className="absolute inset-0 flex flex-col justify-between py-2 px-1 opacity-20 pointer-events-none">
                           <div className="border-t border-cyan-300 w-full"></div>
                           <div className="border-t border-cyan-300 w-full"></div>
                           <div className="border-t border-cyan-300 w-full"></div>
                        </div>

                        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
                            </linearGradient>
                          </defs>
                          
                          <path
                            d={`M 0 100 ` + climateData.temperature
                              .filter((d) => d.year >= 1960)
                              .map((d, i, arr) => {
                                 const x = (i / (arr.length - 1)) * 400
                                 const normalized = Math.max(0, Math.min(1.5, (d.anomaly + 1) / 3)) 
                                 const y = 100 - normalized * 80 
                                 return `L ${x} ${y}`
                              }).join(' ') + ` L 400 100 Z`}
                            fill="url(#tempGradient)"
                          />
                          
                          <polyline
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={climateData.temperature
                              .filter((d) => d.year >= 1960)
                              .map((d, i, arr) => {
                                const x = (i / (arr.length - 1)) * 400
                                const normalized = Math.max(0, Math.min(1.5, (d.anomaly + 1) / 3))
                                const y = 100 - normalized * 80
                                return `${x},${y}`
                              })
                              .join(' ')}
                          />
                        </svg>
                      </div>
                      <div className="flex justify-between text-xs text-cyan-200/60 mt-2">
                        <span>Cooler</span>
                        <span>Warmer</span>
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  <div className="bg-gradient-to-br from-cyan-500/15 to-blue-500/10 backdrop-blur-md p-5 rounded-2xl border border-cyan-400/20">
                    <p className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                      <span className="text-lg">🌍</span>
                      Climate Insights
                    </p>
                    <ul className="space-y-2 text-sm text-gray-200">
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                        Global temperature {climateData.summary.temperatureChange > 0 ? '+' : ''}{climateData.summary.temperatureChange.toFixed(2)}°C
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                        CO2 emissions {climateData.summary.co2Growth > 0 ? '+' : ''}{climateData.summary.co2Growth.toFixed(0)}%
                      </li>
                      {climateData.summary.temperatureChange > 1 && (
                        <li className="flex items-center gap-2 text-orange-300 mt-2 pt-2 border-t border-white/10">
                          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                          ⚠️ Significant warming detected
                        </li>
                      )}
                    </ul>
                  </div>
                </>
              )}

              {/* No Data State */}
              {!isLoadingClimate && !climateData && (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-white/5 rounded-2xl border border-white/10 mx-auto mb-4 flex items-center justify-center">
                    <ThermometerSun className="w-8 h-8 text-cyan-300 opacity-50" />
                  </div>
                  <p className="text-cyan-200/70">Select a location to view data</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}