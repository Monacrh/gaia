import { NextResponse } from 'next/server';
import { initializeEarthEngine } from '@/lib/earth-engine';

export async function GET() {
  try {
    await initializeEarthEngine();
    return NextResponse.json({ 
      status: 'healthy',
      service: 'Google Earth Engine',
      message: 'Connection successful'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}