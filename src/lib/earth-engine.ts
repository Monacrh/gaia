import ee from '@google/earthengine';
import { readFileSync } from 'fs';
import path from 'path';

let isInitialized = false;

interface EarthEngineFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    NDVI: number;
  };
}

interface EarthEngineResult {
  features: EarthEngineFeature[];
}

interface EarthEngineStats {
  NDVI: number;
}

export async function initializeEarthEngine(): Promise<void> {
  if (isInitialized) return;

  try {
    const keyPath = path.join(process.cwd(), process.env.GEE_PRIVATE_KEY_PATH || '');
    const privateKey = JSON.parse(readFileSync(keyPath, 'utf8'));

    await new Promise<void>((resolve, reject) => {
      ee.data.authenticateViaPrivateKey(
        privateKey,
        () => {
          ee.initialize(
            null,
            null,
            () => {
              console.log('✅ Earth Engine initialized successfully');
              isInitialized = true;
              resolve();
            },
            (error: Error) => {
              console.error('❌ Earth Engine initialization failed:', error);
              reject(error);
            }
          );
        },
        (error: Error) => {
          console.error('❌ Earth Engine authentication failed:', error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error('❌ Failed to read private key:', error);
    throw error;
  }
}

export interface NDVIDataPoint {
  lat: number;
  lon: number;
  ndvi: number;
  date: string;
}

export async function getNDVIData(
  startDate: string,
  endDate: string,
  bounds: {
    west: number;
    south: number;
    east: number;
    north: number;
  }
): Promise<NDVIDataPoint[]> {
  await initializeEarthEngine();

  return new Promise((resolve, reject) => {
    try {
      const geometry = ee.Geometry.Rectangle([
        bounds.west,
        bounds.south,
        bounds.east,
        bounds.north,
      ]);

      const landsat = ee
        .ImageCollection('LANDSAT/LC09/C02/T1_L2')
        .filterDate(startDate, endDate)
        .filterBounds(geometry)
        .filter(ee.Filter.lt('CLOUD_COVER', 20));

      const addNDVI = (image: ee.Image) => {
        const nir = image.select('SR_B5');
        const red = image.select('SR_B4');
        const ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
        return image.addBands(ndvi);
      };

      const withNDVI = landsat.map(addNDVI);
      const medianNDVI = withNDVI.select('NDVI').median();

      // This should now work with the corrected types
      const samples = medianNDVI.sample({
        region: geometry,
        scale: 1000,
        numPixels: 5000,
        seed: 42,
        geometries: true,
      });

      samples.getInfo((result: unknown) => {
        const earthEngineResult = result as EarthEngineResult;
        if (!earthEngineResult || !earthEngineResult.features) {
          reject(new Error('No data returned from Earth Engine'));
          return;
        }

        const dataPoints: NDVIDataPoint[] = earthEngineResult.features.map((feature) => {
          const coords = feature.geometry.coordinates;
          const ndvi = feature.properties.NDVI;

          return {
            lon: coords[0],
            lat: coords[1],
            ndvi: ndvi || 0,
            date: startDate,
          };
        });

        resolve(dataPoints);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export async function getNDVIForRegion(
  date: string,
  region: {
    centerLat: number;
    centerLon: number;
    radiusKm: number;
  }
): Promise<number> {
  await initializeEarthEngine();

  return new Promise((resolve, reject) => {
    try {
      const point = ee.Geometry.Point([region.centerLon, region.centerLat]);
      const buffer = point.buffer(region.radiusKm * 1000);

      const endDate = new Date(new Date(date).getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();
      
      const landsat = ee
        .ImageCollection('LANDSAT/LC09/C02/T1_L2')
        .filterDate(date, endDate)
        .filterBounds(buffer)
        .filter(ee.Filter.lt('CLOUD_COVER', 20));

      const addNDVI = (image: ee.Image) => {
        const nir = image.select('SR_B5');
        const red = image.select('SR_B4');
        const ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
        return image.addBands(ndvi);
      };

      const withNDVI = landsat.map(addNDVI);
      const medianNDVI = withNDVI.select('NDVI').median();

      const stats = medianNDVI.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: buffer,
        scale: 1000,
        maxPixels: 1e9,
      });

      stats.getInfo((result: unknown) => {
        const earthEngineStats = result as EarthEngineStats;
        resolve(earthEngineStats.NDVI || 0);
      });
    } catch (error) {
      reject(error);
    }
  });
}