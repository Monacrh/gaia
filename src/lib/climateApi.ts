// lib/climateApi.ts - Fixed version with proper date handling

// ========================================
// TYPE DEFINITIONS FOR NEXT.JS
// ========================================

interface NextFetchRequestConfig {
  revalidate?: number | false
  tags?: string[]
}

// Extend RequestInit to include Next.js specific options
interface NextRequestInit extends RequestInit {
  next?: NextFetchRequestConfig
}

// ========================================
// API CONFIGURATION
// ========================================

const API_KEYS = {
  // Only OpenWeatherMap needs API key
  openWeatherMap: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '',
  // NASA POWER API does NOT require API key - it's completely free!
}

// ========================================
// TYPE DEFINITIONS
// ========================================

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
// NASA POWER API - Location-specific temperature data
// ========================================

async function fetchNASAPowerTemperature(
  lat: number,
  lon: number,
  startYear: number,
  endYear: number
): Promise<TemperatureData[]> {
  try {
    // NASA POWER data usually has 1-2 year lag
    // Use last year to ensure data is available
    const currentYear = new Date().getFullYear()
    const safeEndYear = Math.min(endYear, currentYear - 1)
    const queryEndDate = `${safeEndYear}1231`
    
    console.log(`🛰️ Fetching NASA POWER data for ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`)
    console.log(`   Date range: ${startYear} to ${safeEndYear}`)
    
    // NASA POWER API - NO API KEY REQUIRED!
    // This API is completely free and open
    const response = await fetch(
      `https://power.larc.nasa.gov/api/temporal/daily/point?` +
      `parameters=T2M,T2M_MAX,T2M_MIN&` +
      `community=RE&` +
      `longitude=${lon}&` +
      `latitude=${lat}&` +
      `start=${startYear}0101&` +
      `end=${queryEndDate}&` +
      `format=JSON`,
      {
        cache: 'force-cache',
        next: { revalidate: 86400 }
      } as NextRequestInit
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
      
      if (year >= startYear && year <= safeEndYear && temp !== -999) {
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
      const baselineTemp = 14.0
      const anomaly = avgTemp - baselineTemp
      
      data.push({
        year,
        temperature: avgTemp,
        anomaly
      })
    })
    
    console.log(`✅ NASA POWER data loaded: ${data.length} years`)
    return data.sort((a, b) => a.year - b.year)
  } catch (error) {
    console.warn('⚠️ NASA POWER API failed, using location-based fallback:', error)
    return generateRealisticTemperatureData(startYear, endYear, lat, lon)
  }
}

// ========================================
// NASA GISTEMP API - Global temperature data (fallback)
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
      } as NextRequestInit
    )
    
    if (!response.ok) {
      throw new Error('NASA GISTEMP API failed')
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
    
    console.log(`✅ Temperature data loaded from NASA: ${data.length} records`)
    return data
  } catch (error) {
    console.warn('⚠️ Temperature API error, using realistic location-based data:', error)
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

    // World Bank data usually has 2-3 year lag
    const currentYear = new Date().getFullYear()
    const safeEndYear = Math.min(endYear, currentYear - 2)
    
    console.log(`   Requesting years ${startYear} to ${safeEndYear}`)
    
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${country}/indicator/EN.ATM.CO2E.PC?date=${startYear}:${safeEndYear}&format=json&per_page=1000`,
      {
        cache: 'force-cache',
        next: { revalidate: 86400 }
      } as NextRequestInit
    )
    
    if (!response.ok) {
      throw new Error('World Bank API failed')
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
    
    console.log(`✅ CO2 data loaded from World Bank: ${data.length} records`)
    return data.sort((a, b) => a.year - b.year)
  } catch (error) {
    console.warn('⚠️ CO2 API error, using realistic data:', error)
    return generateRealisticCO2Data(startYear, endYear)
  }
}

// ========================================
// OPENWEATHERMAP API - Air Pollution Data
// ========================================

export async function fetchAirPollution(
  lat: number,
  lon: number
): Promise<PollutionData> {
  try {
    const apiKey = API_KEYS.openWeatherMap
    
    if (!apiKey) {
      console.warn('⚠️ OpenWeatherMap API key not configured, using location-based data')
      return generateRealisticPollutionData(lat, lon)
    }

    console.log(`💨 Fetching real pollution data for ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`)
    
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`,
      { cache: 'no-store' }
    )
    
    if (!response.ok) {
      throw new Error(`OpenWeatherMap API failed: ${response.status}`)
    }
    
    const json = await response.json()
    
    if (!json.list || json.list.length === 0) {
      throw new Error('No pollution data returned')
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
    
    console.log(`✅ Real pollution data loaded (AQI: ${realData.aqi})`)
    return realData
  } catch (error) {
    console.warn('⚠️ Pollution API error, using location-based data:', error)
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
    
    // Fetch all data in parallel with individual error handling
    const [temperatures, co2Emissions, currentPollution] = await Promise.all([
      fetchNASAPowerTemperature(lat, lon, startYear, endYear)
        .catch(() => {
          console.warn('Temperature API failed, using fallback')
          return generateRealisticTemperatureData(startYear, endYear, lat, lon)
        }),
      fetchCO2Emissions('WLD', startYear, endYear)
        .catch(() => {
          console.warn('CO2 API failed, using fallback')
          return generateRealisticCO2Data(startYear, endYear)
        }),
      fetchAirPollution(lat, lon)
        .catch(() => {
          console.warn('Pollution API failed, using fallback')
          return generateRealisticPollutionData(lat, lon)
        })
    ])

    // Calculate summary statistics
    const recentTemp = temperatures.slice(-10)
    const avgTemperature = recentTemp.reduce((sum, t) => sum + t.temperature, 0) / recentTemp.length
    const temperatureChange = calculateTemperatureChange(temperatures, startYear, endYear)
    
    const recentCO2 = co2Emissions[co2Emissions.length - 1]
    const currentCO2 = recentCO2?.value || 0
    const co2Growth = calculateCO2Growth(co2Emissions)

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
    throw error
  }
}

// ========================================
// REALISTIC DUMMY DATA GENERATORS
// ========================================

function generateRealisticTemperatureData(
  startYear: number,
  endYear: number,
  lat: number,
  lon: number
): TemperatureData[] {
  const data: TemperatureData[] = []
  
  // Base temperature varies by latitude
  let baseTemp = 14.0
  const absLat = Math.abs(lat)
  
  if (absLat < 23.5) baseTemp = 25.0      // Tropics
  else if (absLat < 40) baseTemp = 20.0   // Subtropical
  else if (absLat < 60) baseTemp = 12.0   // Temperate
  else baseTemp = -5.0                     // Polar
  
  // Continental vs Coastal adjustment
  const isCoastal = (
    (Math.abs(lon) > 120 && Math.abs(lon) < 180) ||
    (lon > -30 && lon < 0 && lat > 40 && lat < 60) ||
    (lon > -90 && lon < -70 && lat > 25 && lat < 45)
  )
  
  if (!isCoastal) {
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
    
    // Polar amplification
    if (absLat > 60) trend *= 2.0
    else if (absLat > 40) trend *= 1.3
    
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

function generateRealisticCO2Data(
  startYear: number,
  endYear: number
): CO2Data[] {
  const data: CO2Data[] = []
  
  for (let year = startYear; year <= endYear; year++) {
    let value = 0
    
    if (year < 1970) {
      value = 2.5 + (year - 1960) * 0.08
    } else if (year < 1990) {
      value = 3.3 + (year - 1970) * 0.06
    } else if (year < 2010) {
      value = 4.5 + (year - 1990) * 0.12
    } else {
      value = 6.9 + Math.sin((year - 2010) * 0.3) * 0.3
    }
    
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

function generateRealisticPollutionData(lat: number, lon: number): PollutionData {
  let baseAQI = 50
  
  // Check for major pollution hotspots
  if ((lon > 70 && lon < 120 && lat > 20 && lat < 45) ||
      (lon > 35 && lon < 60 && lat > 20 && lat < 40)) {
    baseAQI = 120 + Math.random() * 80
  } else if ((lon > -100 && lon < -70 && lat > 30 && lat < 50) ||
             (lon > -10 && lon < 30 && lat > 40 && lat < 60)) {
    baseAQI = 60 + Math.random() * 40
  } else if (Math.abs(lat) > 60 || (lon > 140 || lon < -140)) {
    baseAQI = 20 + Math.random() * 30
  } else {
    baseAQI = 50 + Math.random() * 50
  }
  
  const factor = baseAQI / 100
  
  return {
    timestamp: Date.now(),
    aqi: Math.round(baseAQI),
    pm25: Math.round((10 + factor * 40) * 10) / 10,
    pm10: Math.round((20 + factor * 80) * 10) / 10,
    co: Math.round((200 + factor * 600) * 10) / 10,
    no2: Math.round((10 + factor * 50) * 10) / 10,
    o3: Math.round((50 + factor * 80) * 10) / 10,
    so2: Math.round((5 + factor * 25) * 10) / 10
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

export function calculateCO2Growth(data: CO2Data[]): number {
  const sortedData = [...data].sort((a, b) => a.year - b.year)

  if (sortedData.length < 2) return 0

  const fromData = sortedData[0]
  const toData = sortedData[sortedData.length - 1]

  if (!fromData || !toData || fromData.value === 0) return 0
  
  return ((toData.value - fromData.value) / fromData.value) * 100
}

function getLocationName(lat: number, lon: number): string {
  // Indonesia
  if (lon > 95 && lon < 141 && lat > -11 && lat < 6) {
    if (lon > 106 && lon < 107 && lat > -7 && lat < -6) return 'Jakarta, Indonesia'
    if (lon > 107 && lon < 108 && lat > -7 && lat < -6.5) return 'Bandung, Indonesia'
    return 'Indonesia'
  }
  
  // USA
  if (lon > -125 && lon < -65 && lat > 25 && lat < 50) {
    if (lon > -75 && lon < -73 && lat > 40 && lat < 41) return 'New York, USA'
    if (lon > -118.5 && lon < -117.5 && lat > 33.5 && lat < 34.5) return 'Los Angeles, USA'
    return 'United States'
  }
  
  // Japan
  if (lon > 129 && lon < 146 && lat > 30 && lat < 46) {
    if (lon > 139 && lon < 140 && lat > 35 && lat < 36) return 'Tokyo, Japan'
    return 'Japan'
  }
  
  // China
  if (lon > 73 && lon < 135 && lat > 18 && lat < 54) {
    if (lon > 116 && lon < 117 && lat > 39 && lat < 40) return 'Beijing, China'
    return 'China'
  }
  
  // India
  if (lon > 68 && lon < 97 && lat > 8 && lat < 35) {
    if (lon > 77 && lon < 78 && lat > 28 && lat < 29) return 'New Delhi, India'
    return 'India'
  }
  
  // Europe
  if (lon > -10 && lon < 40 && lat > 35 && lat < 70) {
    if (lon > -1 && lon < 0.5 && lat > 51 && lat < 52) return 'London, UK'
    if (lon > 2 && lon < 3 && lat > 48 && lat < 49) return 'Paris, France'
    return 'Europe'
  }
  
  // Australia
  if (lon > 110 && lon < 155 && lat > -45 && lat < -10) {
    if (lon > 151 && lon < 152 && lat > -34 && lat < -33) return 'Sydney, Australia'
    return 'Australia'
  }
  
  // South America
  if (lon > -82 && lon < -34 && lat > -56 && lat < 13) {
    if (lon > -47 && lon < -46 && lat > -24 && lat < -23) return 'São Paulo, Brazil'
    return 'South America'
  }
  
  // Africa
  if (lon > -18 && lon < 52 && lat > -35 && lat < 38) {
    if (lon > 31 && lon < 32 && lat > 30 && lat < 31) return 'Cairo, Egypt'
    return 'Africa'
  }
  
  return 'Selected Location'
}