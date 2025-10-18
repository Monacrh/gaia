// app/api/earth-engine/ndvi-grid/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, resolution = 256 } = body; // resolution: 256, 512, 1024

    // Validate date format
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Generate grid coordinates
    const gridSize = resolution;
    const coordinates = [];
    
    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize / 2; y++) { // Only half for sphere
        const lon = (x / gridSize) * 360 - 180;
        const lat = (y / (gridSize / 2)) * 180 - 90;
        
        // Skip polar regions if needed
        if (Math.abs(lat) <= 85) {
          coordinates.push({ lat, lon });
        }
      }
    }

    // Here you would call your Earth Engine function to get NDVI for all coordinates
    // For now, returning mock data structure
    return NextResponse.json({
      type: 'grid',
      resolution,
      date,
      coordinates: coordinates.slice(0, 1000), // Limit for demo
      message: 'Grid data structure ready - implement Earth Engine batch processing'
    });

  } catch (error) {
    console.error('Earth Engine grid error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate NDVI grid',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}