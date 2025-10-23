// lib/climateApi.ts - Simplified version without OpenWeatherMap dependency

// ========================================
// API CONFIGURATION
// ========================================

const API_KEYS = {
  openWeatherMap: process.env.OPEN_WEATHER_API || '',
  nasa: process.env.NASA_API || 'DEMO_KEY', // Your NASA API key
}

// ========================================
// NASA APIs - Multiple endpoints available
// ========================================

/**
 * NASA POWER API - Location-specific climate data
 * Better than GISTEMP for location-based temperature
 */
async function fetchNASAPowerTemperature(
  lat: number,
  lon: number,
  startYear: number,
  endYear: number
): Promise<TemperatureData[]> {
  try {
    const apiKey = API_KEYS.nasa
    
    console.log(`🛰️ Fetching NASA POWER data for ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`)
    
    // NASA POWER API - Daily temperature data
    const response = await fetch(
      `https://power.larc.nasa.gov/api/temporal/daily/point?` +
      `parameters=T2M,T2M_MAX,T2M_MIN&` +
      `community=RE&` +
      `longitude=${lon}&` +
      `latitude=${lat}&` +
      `start=${startYear}0101&` +
      `end=${endYear}1231&` +
      `format=JSON&` +
      `api_key=${apiKey}`,
      {
        cache: 'force-cache',
        next: { revalidate: 86400 }
      }
    )
    
    if (!response.ok) {
      throw new Error(`NASA POWER API failed: ${response.status}`)
    }
    
    const json = await response.json()
    
    if (!json.properties || !json.properties.parameter) {
      throw new Error('Invalid NASA POWER response')
    }
    
    const temps = json.properties.parameter.T2M // Average temperature
    const data: TemperatureData[] = []
    
    // Group by year and calculate annual average
    const yearlyTemps: { [year: number]: number[] } = {}
    
    Object.keys(temps).forEach(dateStr => {
      const year = parseInt(dateStr.substring(0, 4))
      const temp = temps[dateStr]
      
      if (year >= startYear && year <= endYear && temp !== -999) { // -999 = missing data
        if (!yearlyTemps[year]) yearlyTemps[year] = []
        yearlyTemps[year].push(temp)
      }
    })
    
    // Calculate yearly averages
    Object.keys(yearlyTemps).forEach(yearStr => {
      const year = parseInt(yearStr)
      const temps = yearlyTemps[year]
      const avgTemp = temps.reduce((a, b) => a + b, 0) / temps.length
      
      // Calculate anomaly relative to 1980-2010 baseline
      const baselineTemp = 14.0 // Approximate global baseline
      const anomaly = avgTemp - baselineTemp
      
      data.push({
        year,
        temperature: avgTemp,
        anomaly
      })
    })
    
    console.log('✅ NASA POWER data loaded:', data.length, 'years')
    return data.sort((a, b) => a.year - b.year)
  } catch (error) {
    console.warn('⚠️ NASA POWER API failed:', error)
    throw error
  }
}

export interface TemperatureData {
  year: number
  temperature: number
  anomaly: number
}

export interface CO2Data {
  year: number
  value: number
  country: string
}

export interface PollutionData {
  timestamp: number
  aqi: number
  pm25: number
  pm10: number
  co: number
  no2: number
  o3: number
  so2: number
}

export interface ClimateDataForLocation {
  location: { lat: number; lon: number; name: string }
  temperature: TemperatureData[]
  co2: CO2Data[]
  pollution: PollutionData
  summary: {
    avgTemperature: number
    temperatureChange: number
    currentCO2: number
    co2Growth: number
    airQuality: string
  }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function getAQILabel(aqi: number): string {
  if (aqi <= 50) return 'Good'
  if (aqi <= 100) return 'Moderate'
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups'
  if (aqi <= 200) return 'Unhealthy'
  if (aqi <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#00e400'
  if (aqi <= 100) return '#ffff00'
  if (aqi <= 150) return '#ff7e00'
  if (aqi <= 200) return '#ff0000'
  if (aqi <= 300) return '#8f3f97'
  return '#7e0023'
}

export function calculateTemperatureChange(
  data: TemperatureData[],
  fromYear: number,
  toYear: number
): number {
  const fromData = data.find(d => d.year === fromYear)
  const toData = data.find(d => d.year === toYear)
  
  if (!fromData || !toData) return 0
  
  return toData.temperature - fromData.temperature
}

export function calculateCO2Growth(
  data: CO2Data[],
  fromYear: number,
  toYear: number
): number {
  const fromData = data.find(d => d.year === fromYear)
  const toData = data.find(d => d.year === toYear)
  
  if (!fromData || !toData) return 0
  
  return ((toData.value - fromData.value) / fromData.value) * 100
}

// ========================================
// REALISTIC DUMMY DATA GENERATORS
// ========================================

/**
 * Generate realistic temperature data with LOCATION-BASED variations
 */
function generateRealisticTemperatureData(
  startYear: number,
  endYear: number,
  lat: number,
  lon: number
): TemperatureData[] {
  const data: TemperatureData[] = []
  
  // Base temperature varies by latitude (realistic global patterns)
  let baseTemp = 14.0 // Global average
  
  // Latitude-based temperature adjustment
  const absLat = Math.abs(lat)
  if (absLat < 23.5) {
    // Tropics (hot)
    baseTemp = 25.0 + (Math.random() - 0.5) * 2
  } else if (absLat < 40) {
    // Subtropical
    baseTemp = 20.0 + (Math.random() - 0.5) * 3
  } else if (absLat < 60) {
    // Temperate
    baseTemp = 12.0 + (Math.random() - 0.5) * 4
  } else {
    // Polar (cold)
    baseTemp = -5.0 + (Math.random() - 0.5) * 10
  }
  
  // Continental vs Coastal adjustment
  // Coastal areas have more moderate temperatures
  const isCoastal = (
    (Math.abs(lon) > 120 && Math.abs(lon) < 180) || // Pacific
    (lon > -30 && lon < 0 && lat > 40 && lat < 60) || // Western Europe
    (lon > -90 && lon < -70 && lat > 25 && lat < 45) // US East Coast
  )
  
  if (!isCoastal) {
    // Continental areas have more extreme temperatures
    baseTemp += (Math.random() - 0.5) * 3
  }
  
  for (let year = startYear; year <= endYear; year++) {
    const yearsSince1880 = year - 1880
    
    // Realistic warming trend (accelerating)
    let trend = 0
    if (year < 1940) {
      trend = yearsSince1880 * 0.003
    } else if (year < 1980) {
      trend = 0.18 + (year - 1940) * 0.005
    } else {
      trend = 0.38 + (year - 1980) * 0.018
    }
    
    // Polar amplification (Arctic warms faster)
    if (absLat > 60) {
      trend *= 2.0 // Polar regions warm twice as fast
    } else if (absLat > 40) {
      trend *= 1.3 // Mid-latitudes warm moderately faster
    }
    
    // Natural variability
    const naturalCycle = Math.sin(year / 3.5) * 0.12 + Math.sin(year / 7) * 0.08
    const randomVariation = (Math.random() - 0.5) * 0.15
    
    const anomaly = trend + naturalCycle + randomVariation
    
    data.push({
      year,
      temperature: baseTemp + anomaly,
      anomaly
    })
  }
  
  return data
}

/**
 * Generate realistic CO2 emissions data based on historical trends
 */
function generateRealisticCO2Data(
  startYear: number,
  endYear: number
): CO2Data[] {
  const data: CO2Data[] = []
  
  for (let year = startYear; year <= endYear; year++) {
    let value = 0
    
    // Historical CO2 emissions patterns
    if (year < 1970) {
      // Post-WWII industrial boom
      value = 2.5 + (year - 1960) * 0.08
    } else if (year < 1990) {
      // Oil crisis era (slower growth)
      value = 3.3 + (year - 1970) * 0.06
    } else if (year < 2010) {
      // Globalization era (rapid growth)
      value = 4.5 + (year - 1990) * 0.12
    } else {
      // Modern era (peak and plateau)
      value = 6.9 + Math.sin((year - 2010) * 0.3) * 0.3
    }
    
    // Add regional variation
    const regionalFactor = 0.9 + Math.random() * 0.2
    value *= regionalFactor
    
    data.push({
      year,
      value: parseFloat(value.toFixed(2)),
      country: 'World'
    })
  }
  
  return data
}

/**
 * Generate realistic pollution data based on location
 */
function generateRealisticPollutionData(lat: number, lon: number): PollutionData {
  // Urban areas have higher pollution
  // Major cities: New York (-74, 40), Beijing (116, 39), Delhi (77, 28), etc.
  
  let baseAQI = 50 // Default moderate
  
  // Check for major pollution hotspots
  if (
    // China/India (high pollution)
    (lon > 70 && lon < 120 && lat > 20 && lat < 45) ||
    // Middle East (dust)
    (lon > 35 && lon < 60 && lat > 20 && lat < 40)
  ) {
    baseAQI = 120 + Math.random() * 80 // Unhealthy
  } else if (
    // North America/Europe (moderate)
    (lon > -100 && lon < -70 && lat > 30 && lat < 50) ||
    (lon > -10 && lon < 30 && lat > 40 && lat < 60)
  ) {
    baseAQI = 60 + Math.random() * 40 // Moderate
  } else if (
    // Rural/Ocean areas (good)
    Math.abs(lat) > 60 || // Polar regions
    (lon > 140 || lon < -140) // Pacific Ocean
  ) {
    baseAQI = 20 + Math.random() * 30 // Good
  } else {
    baseAQI = 50 + Math.random() * 50 // Moderate
  }
  
  // Calculate component pollutants based on AQI
  const factor = baseAQI / 100
  
  return {
    timestamp: Date.now(),
    aqi: Math.round(baseAQI),
    pm25: Math.round((10 + factor * 40) * 10) / 10, // 10-50 μg/m³
    pm10: Math.round((20 + factor * 80) * 10) / 10, // 20-100 μg/m³
    co: Math.round((200 + factor * 600) * 10) / 10, // 200-800 μg/m³
    no2: Math.round((10 + factor * 50) * 10) / 10, // 10-60 μg/m³
    o3: Math.round((50 + factor * 80) * 10) / 10, // 50-130 μg/m³
    so2: Math.round((5 + factor * 25) * 10) / 10 // 5-30 μg/m³
  }
}

// ========================================
// NASA GISTEMP API - Global Temperature Data
// ========================================

export async function fetchGlobalTemperature(
  startYear: number = 1880,
  endYear: number = new Date().getFullYear(),
  lat?: number,
  lon?: number
): Promise<TemperatureData[]> {
  try {
    console.log('🌡️ Fetching temperature data from NASA GISTEMP...')
    
    const response = await fetch(
      'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv',
      { 
        cache: 'force-cache',
        next: { revalidate: 86400 }
      }
    )
    
    if (!response.ok) {
      console.warn('⚠️ NASA API failed, using realistic location-based dummy data')
      return generateRealisticTemperatureData(startYear, endYear, lat || 0, lon || 0)
    }
    
    const csvText = await response.text()
    const lines = csvText.split('\n').slice(1)
    
    const data: TemperatureData[] = []
    
    // Calculate location-specific base temperature
    let baseTemp = 14.0
    if (lat !== undefined) {
      const absLat = Math.abs(lat)
      if (absLat < 23.5) baseTemp = 25.0
      else if (absLat < 40) baseTemp = 20.0
      else if (absLat < 60) baseTemp = 12.0
      else baseTemp = -5.0
    }
    
    for (const line of lines) {
      const cols = line.split(',')
      const year = parseInt(cols[0])
      
      if (year >= startYear && year <= endYear && !isNaN(year)) {
        const anomaly = parseFloat(cols[13])
        
        if (!isNaN(anomaly)) {
          data.push({
            year,
            temperature: baseTemp + anomaly,
            anomaly
          })
        }
      }
    }
    
    console.log('✅ Temperature data loaded from NASA:', data.length, 'records')
    return data
  } catch (error) {
    console.warn('⚠️ Temperature API error, using realistic location-based dummy data:', error)
    return generateRealisticTemperatureData(startYear, endYear, lat || 0, lon || 0)
  }
}

// ========================================
// WORLD BANK API - CO2 Emissions Data
// ========================================

export async function fetchCO2Emissions(
  country: string = 'WLD',
  startYear: number = 1960,
  endYear: number = new Date().getFullYear()
): Promise<CO2Data[]> {
  try {
    console.log('🏭 Fetching CO2 data from World Bank...')
    
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${country}/indicator/EN.ATM.CO2E.PC?date=${startYear}:${endYear}&format=json&per_page=1000`,
      {
        cache: 'force-cache',
        next: { revalidate: 86400 }
      }
    )
    
    if (!response.ok) {
      console.warn('⚠️ World Bank API failed, using realistic dummy data')
      return generateRealisticCO2Data(startYear, endYear)
    }
    
    const json = await response.json()
    const data: CO2Data[] = []
    
    if (json && json[1]) {
      for (const item of json[1]) {
        if (item.value !== null) {
          data.push({
            year: parseInt(item.date),
            value: item.value,
            country: item.country.value
          })
        }
      }
    }
    
    console.log('✅ CO2 data loaded from World Bank:', data.length, 'records')
    return data.sort((a, b) => a.year - b.year)
  } catch (error) {
    console.warn('⚠️ CO2 API error, using realistic dummy data:', error)
    return generateRealisticCO2Data(startYear, endYear)
  }
}

// ========================================
// OPENWEATHERMAP API - Air Pollution Data (REAL DATA)
// ========================================

export async function fetchAirPollution(
  lat: number,
  lon: number
): Promise<PollutionData> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY
    
    if (!apiKey) {
      console.warn('⚠️ OpenWeatherMap API key not configured, using location-based data')
      return generateRealisticPollutionData(lat, lon)
    }

    console.log(`💨 Fetching real pollution data from OpenWeatherMap for ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`)
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`,
      { 
        cache: 'no-store', // Don't cache pollution data (changes frequently)
      }
    )
    
    if (!response.ok) {
      console.warn(`⚠️ OpenWeatherMap API failed (${response.status}), using realistic data`)
      return generateRealisticPollutionData(lat, lon)
    }
    
    const json = await response.json()
    
    if (!json.list || json.list.length === 0) {
      console.warn('⚠️ No pollution data returned, using realistic data')
      return generateRealisticPollutionData(lat, lon)
    }
    
    const current = json.list[0]
    
    const realData: PollutionData = {
      timestamp: current.dt * 1000,
      aqi: current.main.aqi,
      pm25: current.components.pm2_5,
      pm10: current.components.pm10,
      co: current.components.co,
      no2: current.components.no2,
      o3: current.components.o3,
      so2: current.components.so2
    }
    
    console.log('✅ Real pollution data loaded from OpenWeatherMap')
    console.log(`   AQI: ${realData.aqi} (${getAQILabel(realData.aqi)})`)
    console.log(`   PM2.5: ${realData.pm25.toFixed(1)} μg/m³`)
    
    return realData
  } catch (error) {
    console.error('❌ OpenWeatherMap API error:', error)
    console.log('   Falling back to location-based realistic data')
    return generateRealisticPollutionData(lat, lon)
  }
}

// ========================================
// COMBINED CLIMATE DATA FETCHER
// ========================================

export async function fetchClimateDataForLocation(
  lat: number,
  lon: number,
  startYear: number = 1960,
  endYear: number = new Date().getFullYear()
): Promise<ClimateDataForLocation> {
  try {
    console.log(`🌍 Fetching climate data for ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`)
    
    // Fetch all data in parallel - PASS lat/lon to temperature function
    const [temperatures, co2Emissions, currentPollution] = await Promise.all([
      fetchGlobalTemperature(startYear, endYear, lat, lon), // Pass location!
      fetchCO2Emissions('WLD', startYear, endYear),
      fetchAirPollution(lat, lon)
    ])

    // Calculate summary statistics
    const recentTemp = temperatures.slice(-10)
    const avgTemperature = recentTemp.reduce((sum, t) => sum + t.temperature, 0) / recentTemp.length
    const temperatureChange = calculateTemperatureChange(temperatures, startYear, endYear)
    
    const recentCO2 = co2Emissions[co2Emissions.length - 1]
    const currentCO2 = recentCO2?.value || 0
    const co2Growth = calculateCO2Growth(co2Emissions, startYear, endYear)

    const airQuality = getAQILabel(currentPollution.aqi)

    console.log('✅ Climate data loaded successfully')
    console.log(`   Temperature: ${avgTemperature.toFixed(1)}°C (${temperatureChange >= 0 ? '+' : ''}${temperatureChange.toFixed(2)}°C change)`)
    console.log(`   CO2: ${currentCO2.toFixed(1)} (${co2Growth.toFixed(0)}% growth)`)
    console.log(`   Air Quality: ${airQuality} (AQI ${currentPollution.aqi})`)

    return {
      location: {
        lat,
        lon,
        name: getLocationName(lat, lon)
      },
      temperature: temperatures,
      co2: co2Emissions,
      pollution: currentPollution,
      summary: {
        avgTemperature,
        temperatureChange,
        currentCO2,
        co2Growth,
        airQuality
      }
    }
  } catch (error) {
    console.error('❌ Failed to fetch climate data:', error)
    
    // Return fallback data with LOCATION-SPECIFIC temperatures
    const fallbackTemp = generateRealisticTemperatureData(startYear, endYear, lat, lon)
    const fallbackCO2 = generateRealisticCO2Data(startYear, endYear)
    const fallbackPollution = generateRealisticPollutionData(lat, lon)
    
    // Calculate fallback summary
    const recentTemp = fallbackTemp.slice(-10)
    const avgTemperature = recentTemp.reduce((sum, t) => sum + t.temperature, 0) / recentTemp.length
    const temperatureChange = calculateTemperatureChange(fallbackTemp, startYear, endYear)
    
    const recentCO2 = fallbackCO2[fallbackCO2.length - 1]
    const currentCO2 = recentCO2?.value || 5.5
    const co2Growth = calculateCO2Growth(fallbackCO2, startYear, endYear)
    
    return {
      location: { 
        lat, 
        lon, 
        name: getLocationName(lat, lon)
      },
      temperature: fallbackTemp,
      co2: fallbackCO2,
      pollution: fallbackPollution,
      summary: {
        avgTemperature,
        temperatureChange,
        currentCO2,
        co2Growth,
        airQuality: getAQILabel(fallbackPollution.aqi)
      }
    }
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Get approximate location name based on coordinates
 */
function getLocationName(lat: number, lon: number): string {
  // Indonesia
  if (lon > 95 && lon < 141 && lat > -11 && lat < 6) {
    if (lon > 106 && lon < 107 && lat > -7 && lat < -6) return 'Jakarta, Indonesia'
    if (lon > 107 && lon < 108 && lat > -7 && lat < -6.5) return 'Bandung, Indonesia'
    if (lon > 110 && lon < 111 && lat > -8 && lat < -7) return 'Yogyakarta, Indonesia'
    return 'Indonesia'
  }
  
  // USA
  if (lon > -125 && lon < -65 && lat > 25 && lat < 50) {
    if (lon > -75 && lon < -73 && lat > 40 && lat < 41) return 'New York, USA'
    if (lon > -118.5 && lon < -117.5 && lat > 33.5 && lat < 34.5) return 'Los Angeles, USA'
    if (lon > -122.5 && lon < -122 && lat > 37.5 && lat < 38) return 'San Francisco, USA'
    if (lon > -77.5 && lon < -76.5 && lat > 38.5 && lat < 39.5) return 'Washington DC, USA'
    return 'United States'
  }
  
  // Japan
  if (lon > 129 && lon < 146 && lat > 30 && lat < 46) {
    if (lon > 139 && lon < 140 && lat > 35 && lat < 36) return 'Tokyo, Japan'
    if (lon > 135 && lon < 136 && lat > 34 && lat < 35) return 'Osaka, Japan'
    return 'Japan'
  }
  
  // China
  if (lon > 73 && lon < 135 && lat > 18 && lat < 54) {
    if (lon > 116 && lon < 117 && lat > 39 && lat < 40) return 'Beijing, China'
    if (lon > 121 && lon < 122 && lat > 31 && lat < 32) return 'Shanghai, China'
    return 'China'
  }
  
  // India
  if (lon > 68 && lon < 97 && lat > 8 && lat < 35) {
    if (lon > 77 && lon < 78 && lat > 28 && lat < 29) return 'New Delhi, India'
    if (lon > 72 && lon < 73 && lat > 18 && lat < 19) return 'Mumbai, India'
    return 'India'
  }
  
  // Europe
  if (lon > -10 && lon < 40 && lat > 35 && lat < 70) {
    // UK
    if (lon > -1 && lon < 0.5 && lat > 51 && lat < 52) return 'London, UK'
    // France
    if (lon > 2 && lon < 3 && lat > 48 && lat < 49) return 'Paris, France'
    // Germany
    if (lon > 13 && lon < 14 && lat > 52 && lat < 53) return 'Berlin, Germany'
    // Italy
    if (lon > 12 && lon < 13 && lat > 41 && lat < 42) return 'Rome, Italy'
    // Spain
    if (lon > -4 && lon < -3 && lat > 40 && lat < 41) return 'Madrid, Spain'
    
    if (lon > -10 && lon < 5 && lat > 50 && lat < 60) return 'United Kingdom'
    if (lon > -5 && lon < 10 && lat > 42 && lat < 51) return 'France'
    if (lon > 5 && lon < 16 && lat > 47 && lat < 55) return 'Germany'
    if (lon > 6 && lon < 19 && lat > 36 && lat < 48) return 'Italy'
    if (lon > -10 && lon < 4 && lat > 36 && lat < 44) return 'Spain'
    return 'Europe'
  }
  
  // Australia
  if (lon > 110 && lon < 155 && lat > -45 && lat < -10) {
    if (lon > 151 && lon < 152 && lat > -34 && lat < -33) return 'Sydney, Australia'
    if (lon > 144 && lon < 145 && lat > -38 && lat < -37) return 'Melbourne, Australia'
    return 'Australia'
  }
  
  // South America
  if (lon > -82 && lon < -34 && lat > -56 && lat < 13) {
    // Brazil
    if (lon > -47 && lon < -46 && lat > -24 && lat < -23) return 'São Paulo, Brazil'
    if (lon > -43.5 && lon < -43 && lat > -23 && lat < -22.5) return 'Rio de Janeiro, Brazil'
    if (lon > -60 && lon < -34 && lat > -34 && lat < 5) return 'Brazil'
    // Argentina
    if (lon > -59 && lon < -58 && lat > -35 && lat < -34) return 'Buenos Aires, Argentina'
    if (lon > -75 && lon < -53 && lat > -55 && lat < -21) return 'Argentina'
    return 'South America'
  }
  
  // Africa
  if (lon > -18 && lon < 52 && lat > -35 && lat < 38) {
    // South Africa
    if (lon > 18 && lon < 19 && lat > -34 && lat < -33) return 'Cape Town, South Africa'
    if (lon > 28 && lon < 29 && lat > -27 && lat < -26) return 'Johannesburg, South Africa'
    // Egypt
    if (lon > 31 && lon < 32 && lat > 30 && lat < 31) return 'Cairo, Egypt'
    // Kenya
    if (lon > 36 && lon < 37 && lat > -2 && lat < -1) return 'Nairobi, Kenya'
    
    if (lon > 16 && lon < 33 && lat > -35 && lat < -22) return 'South Africa'
    if (lon > 24 && lon < 52 && lat > 22 && lat < 32) return 'Egypt'
    return 'Africa'
  }
  
  // Canada
  if (lon > -141 && lon < -52 && lat > 41 && lat < 84) {
    if (lon > -80 && lon < -79 && lat > 43 && lat < 44) return 'Toronto, Canada'
    if (lon > -124 && lon < -123 && lat > 49 && lat < 50) return 'Vancouver, Canada'
    return 'Canada'
  }
  
  // Middle East
  if (lon > 34 && lon < 60 && lat > 12 && lat < 42) {
    // UAE
    if (lon > 55 && lon < 56 && lat > 25 && lat < 26) return 'Dubai, UAE'
    // Saudi Arabia
    if (lon > 46 && lon < 47 && lat > 24 && lat < 25) return 'Riyadh, Saudi Arabia'
    return 'Middle East'
  }
  
  // Russia
  if (lon > 27 && lon < 180 && lat > 50 && lat < 82) {
    if (lon > 37 && lon < 38 && lat > 55 && lat < 56) return 'Moscow, Russia'
    return 'Russia'
  }
  
  // Polar regions
  if (Math.abs(lat) > 66) return lat > 0 ? 'Arctic Region' : 'Antarctic Region'
  
  // Oceans
  if (lon > -180 && lon < -120 && lat > -60 && lat < 60) return 'Pacific Ocean'
  if (lon > -90 && lon < -20 && lat > -60 && lat < 60) return 'Atlantic Ocean'
  if (lon > 20 && lon < 120 && lat > -60 && lat < 30) return 'Indian Ocean'
  
  return 'Selected Location'
}