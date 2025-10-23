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
    <div className="fixed right-4 top-4 z-50 w-96 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <ThermometerSun className="w-5 h-5 text-blue-400" />
          Climate Data
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => setPanelOpen(false)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
          {/* Loading State */}
          {isLoadingClimate && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Climate Data Display */}
          {!isLoadingClimate && climateData && (
            <>
              {/* Location Info */}
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <p className="text-sm text-gray-400">Selected Location</p>
                <p className="text-white font-mono">
                  {climateData.location.lat.toFixed(4)}°, {climateData.location.lon.toFixed(4)}°
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                {/* Temperature */}
                <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 p-4 rounded-lg border border-orange-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ThermometerSun className="w-4 h-4 text-orange-400" />
                    <p className="text-xs text-gray-300">Avg Temperature</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {climateData.summary.avgTemperature.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-orange-300 mt-1">
                    +{climateData.summary.temperatureChange.toFixed(2)}°C since 1960
                  </p>
                </div>

                {/* CO2 */}
                <div className="bg-gradient-to-br from-green-500/20 to-yellow-500/20 p-4 rounded-lg border border-green-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-gray-300">CO2 Emissions</p>
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {climateData.summary.currentCO2.toFixed(1)}
                  </p>
                  <p className="text-xs text-yellow-300 mt-1">
                    +{climateData.summary.co2Growth.toFixed(0)}% growth
                  </p>
                </div>

                {/* Air Quality */}
                {climateData.pollution && (
                  <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-4 rounded-lg border border-blue-500/30 col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      <Wind className="w-4 h-4 text-blue-400" />
                      <p className="text-xs text-gray-300">Air Quality Index</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-white">
                        {climateData.pollution.aqi}
                      </p>
                      <span 
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: colorMappingToCSS(aqiToColor(climateData.pollution.aqi))
                        }}
                      >
                        {climateData.summary.airQuality}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Visualization Controls */}
              <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-gray-300">Visualization Layers</p>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTemperature}
                    onChange={toggleTemperature}
                    className="w-4 h-4 rounded border-gray-600 bg-slate-700"
                  />
                  <span className="text-sm text-gray-300">Temperature Anomaly</span>
                  <div 
                    className="ml-auto w-6 h-6 rounded"
                    style={{ background: 'linear-gradient(to right, #0080ff, #ff0000)' }}
                  />
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCO2}
                    onChange={toggleCO2}
                    className="w-4 h-4 rounded border-gray-600 bg-slate-700"
                  />
                  <span className="text-sm text-gray-300">CO2 Emissions</span>
                  <div 
                    className="ml-auto w-6 h-6 rounded"
                    style={{ background: 'linear-gradient(to right, #22c55e, #ef4444)' }}
                  />
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPollution}
                    onChange={togglePollution}
                    className="w-4 h-4 rounded border-gray-600 bg-slate-700"
                  />
                  <span className="text-sm text-gray-300">Air Pollution</span>
                  <div 
                    className="ml-auto w-6 h-6 rounded"
                    style={{ background: 'linear-gradient(to right, #00e400, #7e0023)' }}
                  />
                </label>
              </div>

              {/* Time Animation Slider */}
              <div className="bg-slate-800/50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-300">Time Animation</p>
                  <button
                    onClick={toggleAnimation}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      animationPlaying 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    {animationPlaying ? 'Pause' : 'Play'}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>1960</span>
                    <span className="text-white font-mono text-sm">{currentYear}</span>
                    <span>{new Date().getFullYear()}</span>
                  </div>
                  <input
                    type="range"
                    min="1960"
                    max={new Date().getFullYear()}
                    value={currentYear}
                    onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              {/* Temperature Chart */}
              {climateData.temperature.length > 0 && (
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-gray-300 mb-3">Temperature Trend</p>
                  <div className="h-32 relative">
                    {/* Simple line chart */}
                    <svg className="w-full h-full" viewBox="0 0 400 100">
                      <defs>
                        <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
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
                          stroke="#334155"
                          strokeWidth="0.5"
                          strokeDasharray="2,2"
                        />
                      ))}

                      {/* Temperature line */}
                      <polyline
                        fill="url(#tempGradient)"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        points={climateData.temperature
                          .filter((d) => d.year >= 1960)
                          .map((d, i, arr) => {
                            const x = (i / (arr.length - 1)) * 400
                            const normalized = (d.anomaly + 1) / 3 // Normalize -1 to +2 range
                            const y = 100 - normalized * 100
                            return `${x},${y}`
                          })
                          .join(' ') + ' 400,100 0,100'}
                      />
                    </svg>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Cooler</span>
                    <span>Warmer</span>
                  </div>
                </div>
              )}

              {/* CO2 Chart */}
              {climateData.co2.length > 0 && (
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <p className="text-sm font-semibold text-gray-300 mb-3">CO2 Emissions Trend</p>
                  <div className="h-32 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 100">
                      <defs>
                        <linearGradient id="co2Gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                          <stop offset="50%" stopColor="#eab308" stopOpacity="0.2" />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
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
                          stroke="#334155"
                          strokeWidth="0.5"
                          strokeDasharray="2,2"
                        />
                      ))}

                      {/* CO2 line */}
                      <polyline
                        fill="url(#co2Gradient)"
                        stroke="#22c55e"
                        strokeWidth="2"
                        points={climateData.co2
                          .filter((d) => d.year >= 1960)
                          .map((d, i, arr) => {
                            const x = (i / (arr.length - 1)) * 400
                            const normalized = (d.value - 2) / 10 // Normalize values
                            const y = 100 - normalized * 100
                            return `${x},${y}`
                          })
                          .join(' ') + ' 400,100 0,100'}
                      />
                    </svg>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>Lower</span>
                    <span>Higher</span>
                  </div>
                </div>
              )}

              {/* Pollution Details */}
              {climateData.pollution && (
                <div className="bg-slate-800/50 p-4 rounded-lg space-y-2">
                  <p className="text-sm font-semibold text-gray-300 mb-3">Air Quality Details</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">PM2.5:</span>
                      <span className="text-white font-mono">{climateData.pollution.pm25.toFixed(1)} μg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">PM10:</span>
                      <span className="text-white font-mono">{climateData.pollution.pm10.toFixed(1)} μg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">CO:</span>
                      <span className="text-white font-mono">{climateData.pollution.co.toFixed(0)} μg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">NO₂:</span>
                      <span className="text-white font-mono">{climateData.pollution.no2.toFixed(1)} μg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">O₃:</span>
                      <span className="text-white font-mono">{climateData.pollution.o3.toFixed(1)} μg/m³</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">SO₂:</span>
                      <span className="text-white font-mono">{climateData.pollution.so2.toFixed(1)} μg/m³</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Insights */}
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4 rounded-lg border border-blue-500/20">
                <p className="text-sm font-semibold text-blue-300 mb-2">🌍 Climate Insights</p>
                <ul className="space-y-1 text-xs text-gray-300">
                  <li>• Global temperature has risen by {climateData.summary.temperatureChange.toFixed(2)}°C</li>
                  <li>• CO2 emissions grew by {climateData.summary.co2Growth.toFixed(0)}% since 1960</li>
                  <li>• Current air quality: {climateData.summary.airQuality}</li>
                  {climateData.summary.temperatureChange > 1 && (
                    <li className="text-orange-300">⚠️ Significant warming detected</li>
                  )}
                </ul>
              </div>
            </>
          )}

          {/* No Data State */}
          {!isLoadingClimate && !climateData && (
            <div className="text-center py-8">
              <p className="text-gray-400">Click anywhere on the globe to view climate data</p>
            </div>
          )}
        </div>
      )}

      {/* Custom slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .slider::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .slider::-moz-range-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}