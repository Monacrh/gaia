// File: src/app/api/earth-data/route.ts

import { NextResponse } from 'next/server';
import ee from '@google/earthengine';
import { readFileSync } from 'fs';
import path from 'path';

import '@google/earthengine';

// --- TYPE DEFINITIONS ---
interface VoxelDataPoint {
  lat: number;
  lon: number;
  ndvi: number;
  r: number;
  g: number;
  b: number;
}
interface GEEFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    NDVI?: number;
    SR_B4?: number;
    SR_B3?: number;
    SR_B2?: number;
  };
}
interface GEEFeatureCollectionResult {
  features: GEEFeature[];
}

// --- GEE INITIALIZATION ---
let isInitialized = false;

async function initializeEarthEngine(): Promise<void> {
  if (isInitialized) return;
  const keyPath = path.join(process.cwd(), 'gaia-project-475508-c80ebd630874.json');
  const privateKey = JSON.parse(readFileSync(keyPath, 'utf8'));
  return new Promise<void>((resolve, reject) => {
    ee.data.authenticateViaPrivateKey(
      privateKey,
      () => {
        ee.initialize(null, null, () => {
          console.log('✅ GEE Authenticated and Initialized');
          isInitialized = true;
          resolve();
        }, reject);
      },
      reject
    );
  });
}

// --- API GET HANDLER ---
export async function GET() {
  try {
    await initializeEarthEngine();

    const data = await new Promise<VoxelDataPoint[]>((resolve, reject) => {
      const geometry = ee.Geometry.Rectangle([-180, -60, 180, 85]);
      const startDate = '2023-01-01';
      const endDate = '2023-12-31';

      const landsat = ee
        .ImageCollection('LANDSAT/LC09/C02/T1_L2')
        .filterDate(startDate, endDate)
        .filterBounds(geometry)
        .filter(ee.Filter.lt('CLOUD_COVER', 30));

      const addNDVI = (image: ee.Image) => {
        const nir = image.select('SR_B5');
        const red = image.select('SR_B4');
        const ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
        return image.addBands(ndvi);
      };

      const medianComposite = landsat.map(addNDVI).median();
      const finalImage = medianComposite.select(['NDVI', 'SR_B4', 'SR_B3', 'SR_B2']);

      // --- THE FINAL FIX: Increase scale significantly and reduce numPixels ---
      const samples = finalImage.sample({
        region: geometry,
        // Increase scale to 100km for a low-res global query
        scale: 100000, 
        numPixels: 10000, 
        geometries: true,
      });

      console.log('⏳ Requesting optimized samples from Google Earth Engine...');

      samples.getInfo((result: GEEFeatureCollectionResult, error?: string) => {
        if (error) {
          return reject(new Error(error));
        }
        
        if (!result || !result.features || result.features.length === 0) {
          return reject(new Error('No features returned. Try widening the date range or increasing cloud cover.'));
        }

        console.log(`✅ Success! Returned ${result.features.length} data points from GEE.`);

        const dataPoints: VoxelDataPoint[] = result.features.map((feature) => {
          const coords = feature.geometry.coordinates;
          const props = feature.properties;
          const r = (props.SR_B4 || 0) / 30000;
          const g = (props.SR_B3 || 0) / 30000;
          const b = (props.SR_B2 || 0) / 30000;
          
          return {
            lon: coords[0],
            lat: coords[1],
            ndvi: props.NDVI || 0,
            r, g, b,
          };
        });

        resolve(dataPoints);
      });
    });

    return NextResponse.json(data);

  } catch (error) {
    let errorMessage = 'An unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error('❌ Error in GEE API Route:', errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}