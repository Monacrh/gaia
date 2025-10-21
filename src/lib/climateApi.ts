// lib/climateApi.ts - Climate Data API Integration

// ========================================
// API CONFIGURATION
// ========================================

const API_KEYS = {
  openWeatherMap: 'YOUR_OPENWEATHERMAP_API_KEY', // Get from: https://openweathermap.org/api
  nasa: 'DEMO_KEY', // Get your key from: https://api.nasa.gov/
  worldBank: '' // No API key needed
}

// ========================================
// TYPE DEFINITIONS
// ========================================

export interface TemperatureData {
  year: number
  temperature: number // Celsius
  anomaly: number // Deviation from baseline
}

export interface CO2Data {
  year: number
  value: number // Metric tons per capita
  country: string
}

export interface PollutionData {
  timestamp: number
  aqi: number // Air Quality Index
  pm25: number // PM2.5 concentration
  pm10: number
  co: number
  no2: number
  o3: number
  so2: number
}

export interface ClimateTimeline {
  temperatures: TemperatureData[]
  co2Emissions: CO2Data[]
  pollution: PollutionData[]
}

// ========================================
// NASA GISTEMP API - Global Temperature Data
// ========================================

export async function fetchGlobalTemperature(
  startYear: number = 1880,
  endYear: number = new Date().getFullYear()
): Promise<TemperatureData[]> {
  try {
    // NASA GISTEMP data (using simulated data for demo)
    // Real API: https://data.giss.nasa.gov/gistemp/
    
    // For production, you would fetch from NASA's data files
    const response = await fetch(
      'https://data.giss.nasa.gov/gistemp/tabledata_v4/GLB.Ts+dSST.csv'
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch temperature data')
    }
    
    const csvText = await response.text()
    const lines = csvText.split('\n').slice(1) // Skip header
    
    const data: TemperatureData[] = []
    
    for (const line of lines) {
      const cols = line.split(',')
      const year = parseInt(cols[0])
      
      if (year >= startYear && year <= endYear && !isNaN(year)) {
        // Annual mean is in column 13 (J-D column)
        const anomaly = parseFloat(cols[13])
        
        if (!isNaN(anomaly)) {
          data.push({
            year,
            temperature: 14.0 + anomaly, // 14°C is baseline (1951-1980 avg)
            anomaly
          })
        }
      }
    }
    
    return data
  } catch (error) {
    console.error('Error fetching temperature data:', error)
    // Return simulated data as fallback
    return generateSimulatedTemperatureData(startYear, endYear)
  }
}

// ========================================
// WORLD BANK API - CO2 Emissions Data
// ========================================

export async function fetchCO2Emissions(
  country: string = 'WLD', // WLD = World
  startYear: number = 1960,
  endYear: number = new Date().getFullYear()
): Promise<CO2Data[]> {
  try {
    // World Bank Climate API
    const response = await fetch(
      `https://api.worldbank.org/v2/country/${country}/indicator/EN.ATM.CO2E.PC?date=${startYear}:${endYear}&format=json&per_page=1000`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch CO2 data')
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
    
    // Sort by year ascending
    return data.sort((a, b) => a.year - b.year)
  } catch (error) {
    console.error('Error fetching CO2 data:', error)
    return generateSimulatedCO2Data(startYear, endYear)
  }
}

// ========================================
// OPENWEATHERMAP API - Air Pollution Data
// ========================================

export async function fetchAirPollution(
  lat: number,
  lon: number
): Promise<PollutionData | null> {
  try {
    const apiKey = API_KEYS.openWeatherMap
    
    if (apiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
      console.warn('OpenWeatherMap API key not configured, using simulated data')
      return generateSimulatedPollutionData()
    }
    
    const response = await fetch(
      `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch pollution data')
    }
    
    const json = await response.json()
    const current = json.list[0]
    
    return {
      timestamp: current.dt * 1000,
      aqi: current.main.aqi,
      pm25: current.components.pm2_5,
      pm10: current.components.pm10,
      co: current.components.co,
      no2: current.components.no2,
      o3: current.components.o3,
      so2: current.components.so2
    }
  } catch (error) {
    console.error('Error fetching pollution data:', error)
    return generateSimulatedPollutionData()
  }
}

// ========================================
// HISTORICAL AIR POLLUTION DATA
// ========================================

export async function fetchHistoricalPollution(
  lat: number,
  lon: number,
  startTimestamp: number,
  endTimestamp: number
): Promise<PollutionData[]> {
  try {
    const apiKey = API_KEYS.openWeatherMap
    
    if (apiKey === 'YOUR_OPENWEATHERMAP_API_KEY') {
      console.warn('OpenWeatherMap API key not configured, using simulated data')
      return generateSimulatedPollutionTimeline(startTimestamp, endTimestamp)
    }
    
    const response = await fetch(
      `http://api.openweathermap.org/data/2.5/air_pollution/history?lat=${lat}&lon=${lon}&start=${startTimestamp}&end=${endTimestamp}&appid=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error('Failed to fetch historical pollution data')
    }
    
    const json = await response.json()
    const data: PollutionData[] = []
    
    for (const item of json.list) {
      data.push({
        timestamp: item.dt * 1000,
        aqi: item.main.aqi,
        pm25: item.components.pm2_5,
        pm10: item.components.pm10,
        co: item.components.co,
        no2: item.components.no2,
        o3: item.components.o3,
        so2: item.components.so2
      })
    }
    
    return data
  } catch (error) {
    console.error('Error fetching historical pollution data:', error)
    return generateSimulatedPollutionTimeline(startTimestamp, endTimestamp)
  }
}

// ========================================
// COMBINED CLIMATE DATA FETCHER
// ========================================

export async function fetchClimateTimeline(
  startYear: number = 1960,
  endYear: number = new Date().getFullYear(),
  lat: number = 0,
  lon: number = 0
): Promise<ClimateTimeline> {
  try {
    // Fetch all data in parallel
    const [temperatures, co2Emissions] = await Promise.all([
      fetchGlobalTemperature(startYear, endYear),
      fetchCO2Emissions('WLD', startYear, endYear)
    ])
    
    // Fetch recent pollution data (last 7 days)
    const now = Date.now()
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000
    const pollution = await fetchHistoricalPollution(
      lat,
      lon,
      Math.floor(weekAgo / 1000),
      Math.floor(now / 1000)
    )
    
    return {
      temperatures,
      co2Emissions,
      pollution
    }
  } catch (error) {
    console.error('Error fetching climate timeline:', error)
    throw error
  }
}

// ========================================
// SIMULATED DATA GENERATORS (Fallback)
// ========================================

function generateSimulatedTemperatureData(
  startYear: number,
  endYear: number
): TemperatureData[] {
  const data: TemperatureData[] = []
  const baseTemp = 14.0 // Baseline temperature
  
  for (let year = startYear; year <= endYear; year++) {
    // Simulate warming trend with some variation
    const yearsSince1880 = year - 1880
    const trend = (yearsSince1880 / 140) * 1.2 // ~1.2°C warming over 140 years
    const variation = Math.sin(year / 5) * 0.1 + Math.random() * 0.1
    const anomaly = trend + variation - 0.3
    
    data.push({
      year,
      temperature: baseTemp + anomaly,
      anomaly
    })
  }
  
  return data
}

function generateSimulatedCO2Data(
  startYear: number,
  endYear: number
): CO2Data[] {
  const data: CO2Data[] = []
  
  for (let year = startYear; year <= endYear; year++) {
    // Simulate exponential growth of CO2 emissions
    const yearsSince1960 = year - 1960
    const baseValue = 3.0
    const growthRate = 0.02
    const value = baseValue * Math.exp(growthRate * yearsSince1960) + Math.random() * 0.5
    
    data.push({
      year,
      value: parseFloat(value.toFixed(2)),
      country: 'World'
    })
  }
  
  return data
}

function generateSimulatedPollutionData(): PollutionData {
  return {
    timestamp: Date.now(),
    aqi: Math.floor(Math.random() * 100) + 50,
    pm25: Math.random() * 50 + 10,
    pm10: Math.random() * 80 + 20,
    co: Math.random() * 500 + 200,
    no2: Math.random() * 40 + 10,
    o3: Math.random() * 100 + 50,
    so2: Math.random() * 20 + 5
  }
}

function generateSimulatedPollutionTimeline(
  startTimestamp: number,
  endTimestamp: number
): PollutionData[] {
  const data: PollutionData[] = []
  const interval = 3600000 // 1 hour in milliseconds
  
  for (let time = startTimestamp; time <= endTimestamp; time += interval) {
    data.push({
      timestamp: time,
      aqi: Math.floor(Math.random() * 100) + 30,
      pm25: Math.random() * 50 + 10,
      pm10: Math.random() * 80 + 20,
      co: Math.random() * 500 + 200,
      no2: Math.random() * 40 + 10,
      o3: Math.random() * 100 + 50,
      so2: Math.random() * 20 + 5
    })
  }
  
  return data
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