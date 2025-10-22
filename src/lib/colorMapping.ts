// /**
//  * Color mapping utilities for bloom visualization
//  */

// export interface ColorMapping {
//   r: number
//   g: number
//   b: number
//   intensity: number
// }

// /**
//  * Color schemes for different bloom phases
//  */
// export const BLOOM_COLORS = {
//   dormant: {
//     base: { r: 0.3, g: 0.3, b: 0.3 }, // Dark gray/brown
//     range: { r: 0.2, g: 0.2, b: 0.2 }
//   },
//   'pre-bloom': {
//     base: { r: 0.4, g: 0.5, b: 0.3 }, // Dull green
//     range: { r: 0.2, g: 0.2, b: 0.1 }
//   },
//   bloom: {
//     base: { r: 0.2, g: 0.7, b: 0.3 }, // Vibrant green
//     range: { r: 0.3, g: 0.3, b: 0.2 }
//   },
//   'post-bloom': {
//     base: { r: 0.6, g: 0.4, b: 0.2 }, // Yellow/orange
//     range: { r: 0.2, g: 0.2, b: 0.1 }
//   }
// }

// /**
//  * Seasonal color variations
//  */
// export const SEASONAL_COLORS = {
//   spring: { r: 0.0, g: 0.3, b: 0.0 }, // Fresh green
//   summer: { r: 0.0, g: 0.5, b: 0.0 }, // Deep green
//   fall: { r: 0.3, g: 0.2, b: 0.0 }, // Orange/brown
//   winter: { r: 0.2, g: 0.2, b: 0.2 } // Gray/brown
// }

// /**
//  * Convert bloom intensity to color
//  */
// export function intensityToColor(
//   intensity: number,
//   phase: 'pre-bloom' | 'bloom' | 'post-bloom' | 'dormant',
//   season: 'spring' | 'summer' | 'fall' | 'winter'
// ): ColorMapping {
//   const phaseColors = BLOOM_COLORS[phase]
//   const seasonalShift = SEASONAL_COLORS[season]
  
//   // Base color from phase
//   let r = phaseColors.base.r
//   let g = phaseColors.base.g
//   let b = phaseColors.base.b
  
//   // Apply intensity scaling
//   const intensityFactor = Math.pow(intensity, 0.8) // Slight gamma correction for better visual
//   r *= intensityFactor
//   g *= intensityFactor
//   b *= intensityFactor
  
//   // Apply seasonal shift
//   r = Math.min(1, r + seasonalShift.r * intensity * 0.3)
//   g = Math.min(1, g + seasonalShift.g * intensity * 0.3)
//   b = Math.min(1, b + seasonalShift.b * intensity * 0.3)
  
//   // Add some variation based on intensity
//   const variation = intensity * 0.1
//   r += (Math.random() - 0.5) * variation
//   g += (Math.random() - 0.5) * variation
//   b += (Math.random() - 0.5) * variation
  
//   // Clamp values
//   r = Math.max(0, Math.min(1, r))
//   g = Math.max(0, Math.min(1, g))
//   b = Math.max(0, Math.min(1, b))
  
//   return {
//     r,
//     g,
//     b,
//     intensity
//   }
// }

// /**
//  * Convert color to Three.js Color object
//  */
// export function colorMappingToThreeJS(color: ColorMapping): { r: number; g: number; b: number } {
//   return {
//     r: color.r,
//     g: color.g,
//     b: color.b
//   }
// }

// /**
//  * Generate a color palette for a range of intensities
//  */
// export function generateColorPalette(
//   phase: 'pre-bloom' | 'bloom' | 'post-bloom' | 'dormant',
//   season: 'spring' | 'summer' | 'fall' | 'winter',
//   steps: number = 10
// ): ColorMapping[] {
//   const palette: ColorMapping[] = []
  
//   for (let i = 0; i < steps; i++) {
//     const intensity = i / (steps - 1)
//     const color = intensityToColor(intensity, phase, season)
//     palette.push(color)
//   }
  
//   return palette
// }

// /**
//  * Interpolate between two colors based on intensity
//  */
// export function interpolateColors(
//   color1: ColorMapping,
//   color2: ColorMapping,
//   factor: number
// ): ColorMapping {
//   const clampedFactor = Math.max(0, Math.min(1, factor))
  
//   return {
//     r: color1.r + (color2.r - color1.r) * clampedFactor,
//     g: color1.g + (color2.g - color1.g) * clampedFactor,
//     b: color1.b + (color2.b - color1.b) * clampedFactor,
//     intensity: color1.intensity + (color2.intensity - color1.intensity) * clampedFactor
//   }
// }

// /**
//  * Create a smooth transition between bloom phases
//  */
// export function createPhaseTransition(
//   fromPhase: 'pre-bloom' | 'bloom' | 'post-bloom' | 'dormant',
//   toPhase: 'pre-bloom' | 'bloom' | 'post-bloom' | 'dormant',
//   season: 'spring' | 'summer' | 'fall' | 'winter',
//   progress: number
// ): ColorMapping {
//   const fromColor = intensityToColor(0.5, fromPhase, season)
//   const toColor = intensityToColor(0.5, toPhase, season)
  
//   return interpolateColors(fromColor, toColor, progress)
// }


/**
 * Color mapping utilities for climate visualization
 * Refactored from bloom visualization to climate data
 */

export interface ColorMapping {
  r: number
  g: number
  b: number
  value: number
}

// ========================================
// TEMPERATURE COLOR SCHEMES
// ========================================

/**
 * Temperature anomaly colors (deviation from baseline)
 * Blue (cold) → White (normal) → Red (hot)
 */
export const TEMPERATURE_COLORS = {
  veryCold: { r: 0.0, g: 0.2, b: 0.8 },   // Deep blue
  cold: { r: 0.2, g: 0.5, b: 1.0 },       // Light blue
  normal: { r: 0.9, g: 0.9, b: 0.9 },     // White/gray
  warm: { r: 1.0, g: 0.6, b: 0.2 },       // Orange
  hot: { r: 1.0, g: 0.2, b: 0.0 },        // Red
  veryHot: { r: 0.8, g: 0.0, b: 0.2 }     // Dark red
}

/**
 * Get temperature color based on anomaly value
 * @param anomaly - Temperature anomaly in Celsius (-3 to +3)
 */
export function temperatureToColor(anomaly: number): ColorMapping {
  let r: number, g: number, b: number
  
  // Normalize anomaly to 0-1 range (assuming -3 to +3 range)
  const normalized = (anomaly + 3) / 6
  const clamped = Math.max(0, Math.min(1, normalized))
  
  if (clamped < 0.2) {
    // Very cold (-3 to -1.8)
    const t = clamped / 0.2
    r = TEMPERATURE_COLORS.veryCold.r + (TEMPERATURE_COLORS.cold.r - TEMPERATURE_COLORS.veryCold.r) * t
    g = TEMPERATURE_COLORS.veryCold.g + (TEMPERATURE_COLORS.cold.g - TEMPERATURE_COLORS.veryCold.g) * t
    b = TEMPERATURE_COLORS.veryCold.b + (TEMPERATURE_COLORS.cold.b - TEMPERATURE_COLORS.veryCold.b) * t
  } else if (clamped < 0.4) {
    // Cold (-1.8 to -0.6)
    const t = (clamped - 0.2) / 0.2
    r = TEMPERATURE_COLORS.cold.r + (TEMPERATURE_COLORS.normal.r - TEMPERATURE_COLORS.cold.r) * t
    g = TEMPERATURE_COLORS.cold.g + (TEMPERATURE_COLORS.normal.g - TEMPERATURE_COLORS.cold.g) * t
    b = TEMPERATURE_COLORS.cold.b + (TEMPERATURE_COLORS.normal.b - TEMPERATURE_COLORS.cold.b) * t
  } else if (clamped < 0.6) {
    // Normal (-0.6 to +0.6)
    const t = (clamped - 0.4) / 0.2
    r = TEMPERATURE_COLORS.normal.r + (TEMPERATURE_COLORS.warm.r - TEMPERATURE_COLORS.normal.r) * t
    g = TEMPERATURE_COLORS.normal.g + (TEMPERATURE_COLORS.warm.g - TEMPERATURE_COLORS.normal.g) * t
    b = TEMPERATURE_COLORS.normal.b + (TEMPERATURE_COLORS.warm.b - TEMPERATURE_COLORS.normal.b) * t
  } else if (clamped < 0.8) {
    // Warm (+0.6 to +1.8)
    const t = (clamped - 0.6) / 0.2
    r = TEMPERATURE_COLORS.warm.r + (TEMPERATURE_COLORS.hot.r - TEMPERATURE_COLORS.warm.r) * t
    g = TEMPERATURE_COLORS.warm.g + (TEMPERATURE_COLORS.hot.g - TEMPERATURE_COLORS.warm.g) * t
    b = TEMPERATURE_COLORS.warm.b + (TEMPERATURE_COLORS.hot.b - TEMPERATURE_COLORS.warm.b) * t
  } else {
    // Hot to Very Hot (+1.8 to +3)
    const t = (clamped - 0.8) / 0.2
    r = TEMPERATURE_COLORS.hot.r + (TEMPERATURE_COLORS.veryHot.r - TEMPERATURE_COLORS.hot.r) * t
    g = TEMPERATURE_COLORS.hot.g + (TEMPERATURE_COLORS.veryHot.g - TEMPERATURE_COLORS.hot.g) * t
    b = TEMPERATURE_COLORS.hot.b + (TEMPERATURE_COLORS.veryHot.b - TEMPERATURE_COLORS.hot.b) * t
  }
  
  return { r, g, b, value: anomaly }
}

// ========================================
// CO2 CONCENTRATION COLORS
// ========================================

/**
 * CO2 concentration colors
 * Green (low) → Yellow → Orange → Red (high)
 */
export const CO2_COLORS = {
  preindustrial: { r: 0.2, g: 0.8, b: 0.2 }, // Green (280 ppm)
  safe: { r: 0.4, g: 0.9, b: 0.3 },          // Light green (350 ppm)
  warning: { r: 0.9, g: 0.9, b: 0.2 },       // Yellow (400 ppm)
  danger: { r: 1.0, g: 0.5, b: 0.0 },        // Orange (450 ppm)
  critical: { r: 1.0, g: 0.0, b: 0.0 }       // Red (500+ ppm)
}

/**
 * Get CO2 color based on concentration
 * @param ppm - CO2 concentration in parts per million (280-500)
 */
export function co2ToColor(ppm: number): ColorMapping {
  let r: number, g: number, b: number
  
  // Normalize to 0-1 range (280-500 ppm)
  const normalized = (ppm - 280) / (500 - 280)
  const clamped = Math.max(0, Math.min(1, normalized))
  
  if (clamped < 0.25) {
    // Preindustrial to Safe (280-335)
    const t = clamped / 0.25
    r = CO2_COLORS.preindustrial.r + (CO2_COLORS.safe.r - CO2_COLORS.preindustrial.r) * t
    g = CO2_COLORS.preindustrial.g + (CO2_COLORS.safe.g - CO2_COLORS.preindustrial.g) * t
    b = CO2_COLORS.preindustrial.b + (CO2_COLORS.safe.b - CO2_COLORS.preindustrial.b) * t
  } else if (clamped < 0.5) {
    // Safe to Warning (335-390)
    const t = (clamped - 0.25) / 0.25
    r = CO2_COLORS.safe.r + (CO2_COLORS.warning.r - CO2_COLORS.safe.r) * t
    g = CO2_COLORS.safe.g + (CO2_COLORS.warning.g - CO2_COLORS.safe.g) * t
    b = CO2_COLORS.safe.b + (CO2_COLORS.warning.b - CO2_COLORS.safe.b) * t
  } else if (clamped < 0.75) {
    // Warning to Danger (390-445)
    const t = (clamped - 0.5) / 0.25
    r = CO2_COLORS.warning.r + (CO2_COLORS.danger.r - CO2_COLORS.warning.r) * t
    g = CO2_COLORS.warning.g + (CO2_COLORS.danger.g - CO2_COLORS.warning.g) * t
    b = CO2_COLORS.warning.b + (CO2_COLORS.danger.b - CO2_COLORS.warning.b) * t
  } else {
    // Danger to Critical (445-500)
    const t = (clamped - 0.75) / 0.25
    r = CO2_COLORS.danger.r + (CO2_COLORS.critical.r - CO2_COLORS.danger.r) * t
    g = CO2_COLORS.danger.g + (CO2_COLORS.critical.g - CO2_COLORS.danger.g) * t
    b = CO2_COLORS.danger.b + (CO2_COLORS.critical.b - CO2_COLORS.danger.b) * t
  }
  
  return { r, g, b, value: ppm }
}

// ========================================
// AIR QUALITY INDEX (AQI) COLORS
// ========================================

/**
 * Standard AQI color scale
 */
export const AQI_COLORS = {
  good: { r: 0.0, g: 0.9, b: 0.0 },              // Green (0-50)
  moderate: { r: 1.0, g: 1.0, b: 0.0 },          // Yellow (51-100)
  unhealthySensitive: { r: 1.0, g: 0.5, b: 0.0 }, // Orange (101-150)
  unhealthy: { r: 1.0, g: 0.0, b: 0.0 },         // Red (151-200)
  veryUnhealthy: { r: 0.6, g: 0.2, b: 0.6 },     // Purple (201-300)
  hazardous: { r: 0.5, g: 0.0, b: 0.1 }          // Maroon (301+)
}

/**
 * Get AQI color
 * @param aqi - Air Quality Index (0-500)
 */
export function aqiToColor(aqi: number): ColorMapping {
  let r: number, g: number, b: number
  
  if (aqi <= 50) {
    // Good (0-50)
    const t = aqi / 50
    r = AQI_COLORS.good.r
    g = AQI_COLORS.good.g * (0.7 + t * 0.3)
    b = AQI_COLORS.good.b
  } else if (aqi <= 100) {
    // Moderate (51-100)
    const t = (aqi - 50) / 50
    r = AQI_COLORS.good.r + (AQI_COLORS.moderate.r - AQI_COLORS.good.r) * t
    g = AQI_COLORS.good.g + (AQI_COLORS.moderate.g - AQI_COLORS.good.g) * t
    b = AQI_COLORS.good.b + (AQI_COLORS.moderate.b - AQI_COLORS.good.b) * t
  } else if (aqi <= 150) {
    // Unhealthy for Sensitive Groups (101-150)
    const t = (aqi - 100) / 50
    r = AQI_COLORS.moderate.r + (AQI_COLORS.unhealthySensitive.r - AQI_COLORS.moderate.r) * t
    g = AQI_COLORS.moderate.g + (AQI_COLORS.unhealthySensitive.g - AQI_COLORS.moderate.g) * t
    b = AQI_COLORS.moderate.b + (AQI_COLORS.unhealthySensitive.b - AQI_COLORS.moderate.b) * t
  } else if (aqi <= 200) {
    // Unhealthy (151-200)
    const t = (aqi - 150) / 50
    r = AQI_COLORS.unhealthySensitive.r + (AQI_COLORS.unhealthy.r - AQI_COLORS.unhealthySensitive.r) * t
    g = AQI_COLORS.unhealthySensitive.g + (AQI_COLORS.unhealthy.g - AQI_COLORS.unhealthySensitive.g) * t
    b = AQI_COLORS.unhealthySensitive.b + (AQI_COLORS.unhealthy.b - AQI_COLORS.unhealthySensitive.b) * t
  } else if (aqi <= 300) {
    // Very Unhealthy (201-300)
    const t = (aqi - 200) / 100
    r = AQI_COLORS.unhealthy.r + (AQI_COLORS.veryUnhealthy.r - AQI_COLORS.unhealthy.r) * t
    g = AQI_COLORS.unhealthy.g + (AQI_COLORS.veryUnhealthy.g - AQI_COLORS.unhealthy.g) * t
    b = AQI_COLORS.unhealthy.b + (AQI_COLORS.veryUnhealthy.b - AQI_COLORS.unhealthy.b) * t
  } else {
    // Hazardous (301+)
    const t = Math.min(1, (aqi - 300) / 200)
    r = AQI_COLORS.veryUnhealthy.r + (AQI_COLORS.hazardous.r - AQI_COLORS.veryUnhealthy.r) * t
    g = AQI_COLORS.veryUnhealthy.g + (AQI_COLORS.hazardous.g - AQI_COLORS.veryUnhealthy.g) * t
    b = AQI_COLORS.veryUnhealthy.b + (AQI_COLORS.hazardous.b - AQI_COLORS.veryUnhealthy.b) * t
  }
  
  return { r, g, b, value: aqi }
}

// ========================================
// SEA LEVEL RISE COLORS
// ========================================

export const SEA_LEVEL_COLORS = {
  low: { r: 0.0, g: 0.5, b: 1.0 },      // Light blue
  medium: { r: 0.2, g: 0.7, b: 1.0 },   // Sky blue
  high: { r: 1.0, g: 0.6, b: 0.0 },     // Orange
  critical: { r: 1.0, g: 0.0, b: 0.0 }  // Red
}

/**
 * Get sea level rise color
 * @param meters - Sea level rise in meters (0-2)
 */
export function seaLevelToColor(meters: number): ColorMapping {
  let r: number, g: number, b: number
  
  const normalized = meters / 2
  const clamped = Math.max(0, Math.min(1, normalized))
  
  if (clamped < 0.33) {
    const t = clamped / 0.33
    r = SEA_LEVEL_COLORS.low.r + (SEA_LEVEL_COLORS.medium.r - SEA_LEVEL_COLORS.low.r) * t
    g = SEA_LEVEL_COLORS.low.g + (SEA_LEVEL_COLORS.medium.g - SEA_LEVEL_COLORS.low.g) * t
    b = SEA_LEVEL_COLORS.low.b + (SEA_LEVEL_COLORS.medium.b - SEA_LEVEL_COLORS.low.b) * t
  } else if (clamped < 0.66) {
    const t = (clamped - 0.33) / 0.33
    r = SEA_LEVEL_COLORS.medium.r + (SEA_LEVEL_COLORS.high.r - SEA_LEVEL_COLORS.medium.r) * t
    g = SEA_LEVEL_COLORS.medium.g + (SEA_LEVEL_COLORS.high.g - SEA_LEVEL_COLORS.medium.g) * t
    b = SEA_LEVEL_COLORS.medium.b + (SEA_LEVEL_COLORS.high.b - SEA_LEVEL_COLORS.medium.b) * t
  } else {
    const t = (clamped - 0.66) / 0.34
    r = SEA_LEVEL_COLORS.high.r + (SEA_LEVEL_COLORS.critical.r - SEA_LEVEL_COLORS.high.r) * t
    g = SEA_LEVEL_COLORS.high.g + (SEA_LEVEL_COLORS.critical.g - SEA_LEVEL_COLORS.high.g) * t
    b = SEA_LEVEL_COLORS.high.b + (SEA_LEVEL_COLORS.critical.b - SEA_LEVEL_COLORS.high.b) * t
  }
  
  return { r, g, b, value: meters }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Convert RGB (0-1) to Hex color string
 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Convert ColorMapping to CSS color string
 */
export function colorMappingToCSS(color: ColorMapping): string {
  return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`
}

/**
 * Convert ColorMapping to Three.js Color object
 */
export function colorMappingToThreeJS(color: ColorMapping): { r: number; g: number; b: number } {
  return {
    r: color.r,
    g: color.g,
    b: color.b
  }
}

/**
 * Interpolate between two colors
 */
export function interpolateColors(
  color1: ColorMapping,
  color2: ColorMapping,
  factor: number
): ColorMapping {
  const t = Math.max(0, Math.min(1, factor))
  
  return {
    r: color1.r + (color2.r - color1.r) * t,
    g: color1.g + (color2.g - color1.g) * t,
    b: color1.b + (color2.b - color1.b) * t,
    value: color1.value + (color2.value - color1.value) * t
  }
}

/**
 * Generate color palette for legend/scale
 */
export function generateColorScale(
  type: 'temperature' | 'co2' | 'aqi' | 'seaLevel',
  steps: number = 10
): ColorMapping[] {
  const palette: ColorMapping[] = []
  
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1)
    let color: ColorMapping
    
    switch (type) {
      case 'temperature':
        color = temperatureToColor(t * 6 - 3) // -3 to +3
        break
      case 'co2':
        color = co2ToColor(280 + t * 220) // 280 to 500 ppm
        break
      case 'aqi':
        color = aqiToColor(t * 500) // 0 to 500
        break
      case 'seaLevel':
        color = seaLevelToColor(t * 2) // 0 to 2 meters
        break
      default:
        color = { r: t, g: t, b: t, value: t }
    }
    
    palette.push(color)
  }
  
  return palette
}

/**
 * Get color label/description
 */
export function getColorLabel(type: 'temperature' | 'co2' | 'aqi' | 'seaLevel', value: number): string {
  switch (type) {
    case 'temperature':
      if (value < -2) return 'Very Cold'
      if (value < -1) return 'Cold'
      if (value < 1) return 'Normal'
      if (value < 2) return 'Warm'
      return 'Hot'
    
    case 'co2':
      if (value < 315) return 'Pre-industrial'
      if (value < 375) return 'Safe'
      if (value < 425) return 'Warning'
      if (value < 475) return 'Danger'
      return 'Critical'
    
    case 'aqi':
      if (value <= 50) return 'Good'
      if (value <= 100) return 'Moderate'
      if (value <= 150) return 'Unhealthy (Sensitive)'
      if (value <= 200) return 'Unhealthy'
      if (value <= 300) return 'Very Unhealthy'
      return 'Hazardous'
    
    case 'seaLevel':
      if (value < 0.5) return 'Low'
      if (value < 1.0) return 'Medium'
      if (value < 1.5) return 'High'
      return 'Critical'
    
    default:
      return 'Unknown'
  }
}