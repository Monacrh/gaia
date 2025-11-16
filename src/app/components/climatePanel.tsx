import { useAppStore } from '@/lib/store'
import { temperatureToColor, co2ToColor, aqiToColor, colorMappingToCSS } from '@/lib/colorMapping'
import { X, Minimize2, Maximize2, TrendingUp, Wind, Droplets, ThermometerSun } from 'lucide-react'

export default function ClimatePanel() {
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
    <div className="fixed right-4 top-4 z-50 w-96">
      {/* Liquid Glass Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-500/5 to-cyan-300/8 backdrop-blur-3xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        {/* Glass Morphism Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/2 border-r border-b border-white/10 rounded-3xl" />
        
        {/* Animated Liquid Bubbles */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-400/10 rounded-full blur-xl animate-pulse-slow" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-purple-400/10 rounded-full blur-xl animate-pulse-slower" />
      </div>

      {/* Content Container */}
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-cyan-400/30">
              <ThermometerSun className="w-6 h-6 text-cyan-300" />
            </div>
            <span className="bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
              Climate Vision
            </span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-3 hover:bg-white/5 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/5 hover:border-cyan-400/30"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4 text-cyan-300" />
              ) : (
                <Minimize2 className="w-4 h-4 text-cyan-300" />
              )}
            </button>
            <button
              onClick={() => setPanelOpen(false)}
              className="p-3 hover:bg-white/5 rounded-2xl transition-all duration-300 backdrop-blur-sm border border-white/5 hover:border-red-400/30"
            >
              <X className="w-4 h-4 text-cyan-300" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
            {/* Loading State */}
            {isLoadingClimate && (
              <div className="flex items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-cyan-400/30 rounded-full animate-spin" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 border-4 border-cyan-400 rounded-full animate-ping" />
                </div>
              </div>
            )}

            {/* Climate Data Display */}
            {!isLoadingClimate && climateData && (
              <>
                {/* Location Info */}
                <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-lg">
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
                  <div className="bg-gradient-to-br from-orange-500/15 to-red-500/10 backdrop-blur-2xl p-4 rounded-2xl border border-orange-500/20 shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-orange-500/20 rounded-lg">
                        <ThermometerSun className="w-3.5 h-3.5 text-orange-300" />
                      </div>
                      <p className="text-xs text-orange-200/80 font-light">Temperature</p>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {climateData.summary.avgTemperature.toFixed(1)}°C
                    </p>
                    <div className="h-1 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mb-2" />
                    <p className="text-xs text-orange-300/80">
                      +{climateData.summary.temperatureChange.toFixed(2)}°C since 1960
                    </p>
                  </div>

                  {/* CO2 */}
                  <div className="bg-gradient-to-br from-emerald-500/15 to-yellow-500/10 backdrop-blur-2xl p-4 rounded-2xl border border-emerald-500/20 shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
                      </div>
                      <p className="text-xs text-emerald-200/80 font-light">CO2 Level</p>
                    </div>
                    <p className="text-2xl font-bold text-white mb-1">
                      {climateData.summary.currentCO2.toFixed(1)}
                    </p>
                    <div className="h-1 bg-gradient-to-r from-emerald-400 to-yellow-500 rounded-full mb-2" />
                    <p className="text-xs text-yellow-300/80">
                      +{climateData.summary.co2Growth.toFixed(0)}% growth
                    </p>
                  </div>

                  {/* Air Quality */}
                  {climateData.pollution && (
                    <div className="bg-gradient-to-br from-blue-500/15 to-purple-500/10 backdrop-blur-2xl p-4 rounded-2xl border border-blue-500/20 shadow-lg col-span-2">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-blue-500/20 rounded-lg">
                          <Wind className="w-3.5 h-3.5 text-blue-300" />
                        </div>
                        <p className="text-xs text-blue-200/80 font-light">Air Quality</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-white">
                          {climateData.pollution.aqi}
                        </p>
                        <span 
                          className="px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border border-white/10 shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${colorMappingToCSS(aqiToColor(climateData.pollution.aqi))}40, ${colorMappingToCSS(aqiToColor(climateData.pollution.aqi))}20)`,
                            color: 'white'
                          }}
                        >
                          {climateData.summary.airQuality}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Visualization Controls */}
                <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-2xl p-5 rounded-2xl space-y-4 border border-white/10 shadow-lg">
                  <p className="text-sm font-semibold text-cyan-300/80">Visualization Layers</p>
                  
                  <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-white/5 transition-all duration-300">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showTemperature}
                        onChange={toggleTemperature}
                        className="w-5 h-5 rounded-lg border-white/30 bg-white/10 backdrop-blur-sm checked:bg-orange-500/50 checked:border-orange-400 transition-all duration-300"
                      />
                    </div>
                    <span className="text-sm text-gray-200 group-hover:text-white transition-colors flex-1">
                      Temperature Anomaly
                    </span>
                    <div 
                      className="w-8 h-8 rounded-lg backdrop-blur-sm border border-white/10 shadow-inner"
                      style={{ background: 'linear-gradient(135deg, #0080ff, #ff0000)' }}
                    />
                  </label>

                  <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-white/5 transition-all duration-300">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showCO2}
                        onChange={toggleCO2}
                        className="w-5 h-5 rounded-lg border-white/30 bg-white/10 backdrop-blur-sm checked:bg-emerald-500/50 checked:border-emerald-400 transition-all duration-300"
                      />
                    </div>
                    <span className="text-sm text-gray-200 group-hover:text-white transition-colors flex-1">
                      CO2 Emissions
                    </span>
                    <div 
                      className="w-8 h-8 rounded-lg backdrop-blur-sm border border-white/10 shadow-inner"
                      style={{ background: 'linear-gradient(135deg, #22c55e, #ef4444)' }}
                    />
                  </label>

                  <label className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-white/5 transition-all duration-300">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={showPollution}
                        onChange={togglePollution}
                        className="w-5 h-5 rounded-lg border-white/30 bg-white/10 backdrop-blur-sm checked:bg-blue-500/50 checked:border-blue-400 transition-all duration-300"
                      />
                    </div>
                    <span className="text-sm text-gray-200 group-hover:text-white transition-colors flex-1">
                      Air Pollution
                    </span>
                    <div 
                      className="w-8 h-8 rounded-lg backdrop-blur-sm border border-white/10 shadow-inner"
                      style={{ background: 'linear-gradient(135deg, #00e400, #7e0023)' }}
                    />
                  </label>
                </div>

                {/* Time Animation Slider */}
                <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-2xl p-5 rounded-2xl space-y-4 border border-white/10 shadow-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-cyan-300/80">Time Animation</p>
                    <button
                      onClick={toggleAnimation}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 backdrop-blur-sm border shadow-lg ${
                        animationPlaying 
                          ? 'bg-gradient-to-r from-red-500/30 to-pink-500/20 border-red-400/30 text-white hover:from-red-500/40' 
                          : 'bg-gradient-to-r from-cyan-500/30 to-blue-500/20 border-cyan-400/30 text-white hover:from-cyan-500/40'
                      }`}
                    >
                      {animationPlaying ? '⏸️ Pause' : '▶️ Play'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-cyan-200/60">
                      <span>1960</span>
                      <span className="text-white font-mono text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        {currentYear}
                      </span>
                      <span>{new Date().getFullYear()}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="range"
                        min="1960"
                        max={new Date().getFullYear()}
                        value={currentYear}
                        onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider backdrop-blur-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Temperature Chart */}
                {climateData.temperature.length > 0 && (
                  <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-2xl p-5 rounded-2xl border border-white/10 shadow-lg">
                    <p className="text-sm font-semibold text-cyan-300/80 mb-4">Temperature Trend</p>
                    <div className="h-32 relative">
                      <svg className="w-full h-full" viewBox="0 0 400 100">
                        <defs>
                          <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
                          </linearGradient>
                        </defs>
                        
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((y) => (
                          <line
                            key={y}
                            x1="0"
                            y1={y}
                            x2="400"
                            y2={y}
                            stroke="#22d3ee"
                            strokeWidth="0.5"
                            strokeOpacity="0.2"
                            strokeDasharray="2,2"
                          />
                        ))}

                        {/* Temperature line */}
                        <polyline
                          fill="url(#tempGradient)"
                          stroke="#22d3ee"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={climateData.temperature
                            .filter((d) => d.year >= 1960)
                            .map((d, i, arr) => {
                              const x = (i / (arr.length - 1)) * 400
                              const normalized = (d.anomaly + 1) / 3
                              const y = 100 - normalized * 100
                              return `${x},${y}`
                            })
                            .join(' ') + ' 400,100 0,100'}
                        />
                      </svg>
                    </div>
                    <div className="flex justify-between text-xs text-cyan-200/60 mt-3">
                      <span>Cooler</span>
                      <span>Warmer</span>
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                <div className="bg-gradient-to-br from-cyan-500/15 to-blue-500/10 backdrop-blur-2xl p-5 rounded-2xl border border-cyan-400/20 shadow-lg">
                  <p className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                    <span className="text-lg">🌍</span>
                    Climate Insights
                  </p>
                  <ul className="space-y-2 text-sm text-gray-200">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                      Global temperature +{climateData.summary.temperatureChange.toFixed(2)}°C
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      CO2 emissions +{climateData.summary.co2Growth.toFixed(0)}% since 1960
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                      Air quality: {climateData.summary.airQuality}
                    </li>
                    {climateData.summary.temperatureChange > 1 && (
                      <li className="flex items-center gap-2 text-orange-300 mt-3">
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
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-2xl backdrop-blur-sm border border-cyan-400/30 mx-auto mb-4 flex items-center justify-center">
                  <ThermometerSun className="w-8 h-8 text-cyan-300" />
                </div>
                <p className="text-cyan-200/70">Click anywhere on the globe to view climate data</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #22d3ee, #06b6d4);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(34, 211, 238, 0.4);
          transition: all 0.3s ease;
        }
        .slider::-webkit-slider-thumb:hover {
          background: linear-gradient(135deg, #67e8f9, #22d3ee);
          transform: scale(1.15);
          box-shadow: 0 6px 16px rgba(34, 211, 238, 0.6);
        }
        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: linear-gradient(135deg, #22d3ee, #06b6d4);
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(34, 211, 238, 0.4);
          transition: all 0.3s ease;
        }
        .slider::-moz-range-thumb:hover {
          background: linear-gradient(135deg, #67e8f9, #22d3ee);
          transform: scale(1.15);
          box-shadow: 0 6px 16px rgba(34, 211, 238, 0.6);
        }
      `}</style>
    </div>
  )
}