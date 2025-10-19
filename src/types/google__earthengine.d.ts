declare module '@google/earthengine' {
  // Coordinate types
  export type PointCoords = [number, number];
  export type BBoxCoords = [number, number, number, number];
  
  // Earth Engine objects (using unknown instead of any where possible)
  export type EEObject = unknown;

  export interface Geometry {
    Point(coords: PointCoords): Geometry;
    Rectangle(coords: BBoxCoords): Geometry;
    buffer(distance: number): Geometry;
  }

  export interface Image {
    select(bands: string | string[]): Image;
    subtract(other: Image): Image;
    divide(other: Image): Image;
    add(other: Image): Image;
    rename(name: string): Image;
    addBands(band: Image): Image;
    sample(params: {
      region: Geometry;
      scale: number;
      numPixels: number;
      seed?: number;
      geometries?: boolean;
    }): FeatureCollection;
    reduceRegion(params: {
      reducer: Reducer;
      geometry: Geometry;
      scale: number;
      maxPixels: number;
    }): Dictionary;
    median(): Image;
  }

  export interface ImageCollection {
    filterDate(start: string, end: string): ImageCollection;
    filterBounds(geometry: Geometry): ImageCollection;
    filter(filter: Filter): ImageCollection;
    map(callback: (image: Image) => Image): ImageCollection;
    select(band: string): ImageCollection;
    median(): Image;
    getInfo(callback: (result: unknown, error?: string) => void): void;
  }

  export interface Filter {
    lt(property: string, value: number): Filter;
  }

  export interface Reducer {
    mean(): Reducer;
  }

  export interface Dictionary {
    getInfo(callback: (result: unknown, error?: string) => void): void;
  }

  export interface FeatureCollection {
    getInfo(callback: (result: unknown, error?: string) => void): void;
  }

  export const Geometry: Geometry;
  
  export const Filter: {
    lt(property: string, value: number): Filter;
  };

  export const Reducer: {
    mean(): Reducer;
  };

  export function ImageCollection(id: string): ImageCollection;

  export const data: {
    authenticateViaPrivateKey(
      privateKey: Record<string, unknown>,
      success: () => void,
      error: (err: Error) => void
    ): void;
  };

  export function initialize(
    opt_baseurl?: string | null,
    opt_tileurl?: string | null,
    success?: () => void,
    error?: (err: Error) => void
  ): void;
}