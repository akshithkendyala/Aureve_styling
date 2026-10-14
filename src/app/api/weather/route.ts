import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWeatherData,
  searchCities,
  reverseGeocodeCoordinates,
  POPULAR_INDIAN_CITIES,
} from '@/lib/weather/weatherService';
import { getSessionUser } from '@/lib/auth/session';
import { Repository } from '@/lib/db/repository';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const isReverse = searchParams.get('reverse') === 'true';
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const date = searchParams.get('date') || undefined;
    const time = searchParams.get('time') || undefined;

    // 1. City Autocomplete / Search endpoint
    if (search !== null && search !== undefined) {
      const results = await searchCities(search);
      return NextResponse.json({ success: true, results });
    }

    // 2. Reverse geocoding endpoint for coordinates
    if (isReverse && latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      if (!isNaN(lat) && !isNaN(lon)) {
        const reverseResult = await reverseGeocodeCoordinates(lat, lon);
        return NextResponse.json({ success: true, ...reverseResult });
      }
    }

    // 3. Location Resolution Priority:
    // a) Explicit coordinate params (e.g. from browser geolocation)
    // b) Explicit city param from URL query
    // c) Saved user profile location from database
    // d) Fallback to 'Hyderabad' rather than arbitrary Mumbai
    let locationInput: string | { lat: number; lon: number; name?: string } = '';

    if (latParam && lonParam) {
      const lat = parseFloat(latParam);
      const lon = parseFloat(lonParam);
      if (!isNaN(lat) && !isNaN(lon)) {
        locationInput = { lat, lon, name: searchParams.get('city') || undefined };
      }
    }

    if (!locationInput) {
      const explicitCity = searchParams.get('city')?.trim();
      if (explicitCity) {
        locationInput = explicitCity;
      } else {
        // Retrieve authenticated user's saved profile city if available
        try {
          const session = await getSessionUser();
          if (session?.userId) {
            const profile = await Repository.getUserProfile(session.userId);
            if (profile?.city?.trim()) {
              locationInput = profile.city.trim();
            }
          }
        } catch {
          // Ignore session fetch error in public weather lookups
        }
      }
    }

    // Final fallback if no location was supplied or resolved
    if (!locationInput) {
      locationInput = 'Hyderabad';
    }

    const weather = await fetchWeatherData(locationInput, { date, time });

    return NextResponse.json({
      success: true,
      weather,
      popularCities: POPULAR_INDIAN_CITIES.map((c) => ({
        name: c.name,
        state: c.state,
      })),
    });
  } catch (error: any) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
