import { NextRequest, NextResponse } from 'next/server';
import { fetchWeatherData, POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || 'Mumbai';

    const weather = await fetchWeatherData(city);
    return NextResponse.json({
      success: true,
      weather,
      popularCities: POPULAR_INDIAN_CITIES.map((c) => c.name),
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
