// lib/climateApi.ts — FINAL PATCH (CO₂ BERDASARKAN NEGARA)

// ========================================
// TYPE DEFINITIONS FOR NEXT.JS
// ========================================

interface NextFetchRequestConfig {
  revalidate?: number | false
  tags?: string[]
}

interface NextRequestInit extends RequestInit {
  next?: NextFetchRequestConfig
}

// ========================================
// API CONFIGURATION
// ========================================

const API_KEYS = {
  openWeatherMap: process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '',
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
// REVERSE GEOCODING
// ========================================

async function getCountryNameFromCoords(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=3`
    const response = await fetch(url, {
      headers: { "User-Agent": "climate-app" }
    })

    const json = await response.json()
    const country = json?.address?.country

    return country || "World"
  } catch {
    return "World"
  }
}

// ========================================
// NASA POWER API (NO CHANGES)
// ========================================

async function fetchNASAPowerTemperature(
  lat: number,
  lon: number,
  startYear: number,
  endYear: number
): Promise<TemperatureData[]> {
  try {
    const currentYear = new Date().getFullYear()
    const safeEndYear = Math.min(endYear, currentYear - 2)
    const safeStartYear = Math.max(startYear, 1981)

    const adjustedStartYear = Math.max(safeStartYear, safeEndYear - 30 + 1)
    const queryStartDate = `${adjustedStartYear}0101`
    const queryEndDate = `${safeEndYear}1231`

    console.log(`🛰️ Fetching NASA POWER data for ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`)
    console.log(`   Date range: ${adjustedStartYear} to ${safeEndYear}`)

    const url =
      `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M&community=RE&longitude=${lon}&latitude=${lat}&start=${queryStartDate}&end=${queryEndDate}&format=JSON`

    const response = await fetch(url, {
      cache: "force-cache",
      next: { revalidate: 86400 }
    } as NextRequestInit)

    if (!response.ok) throw new Error(`NASA POWER API failed: ${response.status}`)

    const json = await response.json()

    const temps = json?.properties?.parameter?.T2M
    if (!temps) throw new Error("Invalid NASA POWER response")

    const data: TemperatureData[] = []
    const yearlyTemps: Record<number, number[]> = {}

    Object.keys(temps).forEach(dateStr => {
      const year = parseInt(dateStr.substring(0, 4))
      const temp = temps[dateStr]
      if (temp !== -999) {
        if (!yearlyTemps[year]) yearlyTemps[year] = []
        yearlyTemps[year].push(temp)
      }
    })

    Object.keys(yearlyTemps).forEach(yearStr => {
      const year = parseInt(yearStr)
      const arr = yearlyTemps[year]
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length

      data.push({
        year,
        temperature: avg,
        anomaly: avg - 14.0
      })
    })

    console.log(`✅ NASA POWER data loaded: ${data.length} years`)
    return data.sort((a, b) => a.year - b.year)
  } catch (err) {
    console.warn("⚠ NASA POWER fallback:", err)
    return generateRealisticTemperatureData(startYear, endYear, lat, lon)
  }
}

// ========================================
// CO₂ EMISSIONS (PATCHED VERSION)
// ========================================

export async function fetchCO2Emissions(
  countryName: string,
  startYear: number = 1960,
  endYear: number = new Date().getFullYear()
): Promise<CO2Data[]> {
  try {
    console.log(`🏭 Fetching CO2 data for country: ${countryName}`)

    const currentYear = new Date().getFullYear()
    const safeEndYear = Math.min(endYear, currentYear - 1)

    const response = await fetch(
      "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv",
      {
        cache: "force-cache",
        next: { revalidate: 604800 }
      } as NextRequestInit
    )

    const csv = await response.text()
    const lines = csv.split("\n")
    const headers = lines[0].split(",")

    const idxCountry = headers.indexOf("country")
    const idxYear = headers.indexOf("year")
    const idxValue = headers.indexOf("co2_per_capita")

    const list: CO2Data[] = []

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",")

      if (cols[idxCountry]?.trim() === countryName) {
        const year = parseInt(cols[idxYear])
        const value = parseFloat(cols[idxValue])

        if (!isNaN(year) && !isNaN(value) && year >= startYear && year <= safeEndYear) {
          list.push({
            year,
            value: parseFloat(value.toFixed(3)),
            country: countryName
          })
        }
      }
    }

    if (list.length === 0) {
      console.warn(`⚠ No CO2 data for ${countryName}, fallback World`)
      return fetchCO2Emissions("World", startYear, endYear)
    }

    console.log(`✅ Loaded ${list.length} CO₂ rows for ${countryName}`)
    return list.sort((a, b) => a.year - b.year)
  } catch (err) {
    console.warn("⚠ CO2 fetch error, fallback World", err)
    return fetchCO2Emissions("World", startYear, endYear)
  }
}

// ========================================
// POLLUTION (NO CHANGES)
// ========================================

export async function fetchAirPollution(lat: number, lon: number): Promise<PollutionData> {
  try {
    const apiKey = API_KEYS.openWeatherMap

    if (!apiKey) {
      console.warn("⚠ Missing OWM API key → using fallback")
      return generateRealisticPollutionData(lat, lon)
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`,
      { cache: "no-store" }
    )

    const json = await response.json()
    const d = json.list[0]

    return {
      timestamp: d.dt * 1000,
      aqi: d.main.aqi,
      pm25: d.components.pm2_5,
      pm10: d.components.pm10,
      co: d.components.co,
      no2: d.components.no2,
      o3: d.components.o3,
      so2: d.components.so2
    }
  } catch {
    return generateRealisticPollutionData(lat, lon)
  }
}

// ========================================
// COMBINED FETCHER (PATCHED)
// ========================================

export async function fetchClimateDataForLocation(
  lat: number,
  lon: number,
  startYear: number = 1960,
  endYear: number = new Date().getFullYear()
): Promise<ClimateDataForLocation> {
  try {
    const countryName = await getCountryNameFromCoords(lat, lon)

    const [temps, co2, pollution] = await Promise.all([
      fetchNASAPowerTemperature(lat, lon, startYear, endYear),
      fetchCO2Emissions(countryName, startYear, endYear),
      fetchAirPollution(lat, lon)
    ])

    const recentCO2 = co2[co2.length - 1]
    const lastTemps = temps.slice(-10)
    const avgTemp = lastTemps.reduce((s, x) => s + x.temperature, 0) / lastTemps.length

    return {
      location: { lat, lon, name: countryName },
      temperature: temps,
      co2,
      pollution,
      summary: {
        avgTemperature: avgTemp,
        temperatureChange: calculateTemperatureChange(temps, startYear, endYear),
        currentCO2: recentCO2.value,
        co2Growth: calculateCO2Growth(co2),
        airQuality: getAQILabel(pollution.aqi)
      }
    }
  } catch (err) {
    console.error("❌ Climate fetch failed:", err)
    throw err
  }
}

// ========================================
// MOCK DATA GENERATORS (NO CHANGES)
// ========================================

function generateRealisticTemperatureData(start: number, end: number, lat: number, lon: number): TemperatureData[] {
  const result: TemperatureData[] = []
  const absLat = Math.abs(lat)

  let base = 14
  if (absLat < 23.5) base = 25
  else if (absLat < 40) base = 20
  else if (absLat < 60) base = 12
  else base = -5

  for (let y = start; y <= end; y++) {
    const a = Math.sin(y / 3) * 0.2 + (Math.random() - 0.5) * 0.2
    result.push({
      year: y,
      temperature: base + a,
      anomaly: a
    })
  }

  return result
}

function generateRealisticPollutionData(lat: number, lon: number): PollutionData {
  const aqi = 40 + Math.random() * 80
  const f = aqi / 100

  return {
    timestamp: Date.now(),
    aqi: Math.round(aqi),
    pm25: Math.round((12 + f * 30) * 10) / 10,
    pm10: Math.round((20 + f * 50) * 10) / 10,
    co: Math.round((200 + f * 400) * 10) / 10,
    no2: Math.round((10 + f * 30) * 10) / 10,
    o3: Math.round((50 + f * 60) * 10) / 10,
    so2: Math.round((5 + f * 20) * 10) / 10
  }
}

// ========================================
// UTILITIES (NO CHANGES)
// ========================================

export function getAQILabel(aqi: number): string {
  if (aqi <= 50) return "Good"
  if (aqi <= 100) return "Moderate"
  if (aqi <= 150) return "Unhealthy for Sensitive Groups"
  if (aqi <= 200) return "Unhealthy"
  if (aqi <= 300) return "Very Unhealthy"
  return "Hazardous"
}

export function calculateTemperatureChange(data: TemperatureData[], from: number, to: number): number {
  const a = data.find(d => d.year === from)
  const b = data.find(d => d.year === to)
  if (!a || !b) return 0
  return b.temperature - a.temperature
}

export function calculateCO2Growth(list: CO2Data[]): number {
  const sorted = [...list].sort((a, b) => a.year - b.year)
  if (sorted.length < 2) return 0
  return ((sorted.at(-1)!.value - sorted[0].value) / sorted[0].value) * 100
}
