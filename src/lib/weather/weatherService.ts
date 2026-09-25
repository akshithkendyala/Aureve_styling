import { WeatherData } from '@/lib/types';

export interface CityCoordinates {
  name: string;
  state: string;
  lat: number;
  lon: number;
}

export const POPULAR_INDIAN_CITIES: CityCoordinates[] = [
  { name: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  { name: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867 },
  { name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { name: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { name: 'Chandigarh', state: 'Punjab/Haryana', lat: 30.7333, lon: 76.7794 },
  { name: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { name: 'Goa', state: 'Goa', lat: 15.2993, lon: 74.124 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462 },
  { name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lon: 75.8577 },
];

function interpretWmoCode(code: number): { condition: string; summary: string } {
  if (code === 0) return { condition: 'Clear Sky', summary: 'Clear and bright' };
  if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', summary: 'Pleasant with light clouds' };
  if (code >= 45 && code <= 48) return { condition: 'Foggy / Hazy', summary: 'Mild haze or mist' };
  if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', summary: 'Gentle drizzle; avoid delicate fabrics' };
  if (code >= 61 && code <= 65) return { condition: 'Rain', summary: 'Rain expected; choose water-safe footwear' };
  if (code >= 80 && code <= 82) return { condition: 'Showers', summary: 'Sudden rain showers possible' };
  if (code >= 95) return { condition: 'Thunderstorm', summary: 'Heavy rain & winds; prioritize practical weatherwear' };
  return { condition: 'Pleasant', summary: 'Moderate weather conditions' };
}

export async function fetchWeatherData(cityName: string = 'Mumbai'): Promise<WeatherData> {
  const matchedCity = POPULAR_INDIAN_CITIES.find(
    (c) => c.name.toLowerCase() === cityName.toLowerCase()
  ) || POPULAR_INDIAN_CITIES[0];

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${matchedCity.lat}&longitude=${matchedCity.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability,uv_index&timezone=auto`;

    const res = await fetch(url, { next: { revalidate: 1800 } }); // Cache 30 mins
    if (!res.ok) throw new Error('Failed to fetch from Open-Meteo');

    const data = await res.json();
    const current = data.current;
    const weatherInfo = interpretWmoCode(current.weather_code ?? 0);
    const temp = Math.round(current.temperature_2m);
    const humidity = Math.round(current.relative_humidity_2m);
    const windSpeed = Math.round(current.wind_speed_10m);
    const rainProb = data.hourly?.precipitation_probability?.[0] || (current.precipitation > 0 ? 80 : 10);
    const uvIndex = data.hourly?.uv_index?.[0] || 5;

    let stylingGuidance = '';
    if (temp >= 32) {
      stylingGuidance = `${temp}°C & ${humidity}% humidity. High warmth — prioritize ultra-breathable linen, lightweight cottons, and lighter shades.`;
    } else if (rainProb > 40) {
      stylingGuidance = `Rain likely (${rainProb}%). Choose darker or cropped trousers, water-friendly leather/sneakers, and skip ground-touching garments.`;
    } else if (temp <= 18) {
      stylingGuidance = `Cool weather (${temp}°C). Perfect for light layering with a bomber jacket, overshirt, or knit sweater.`;
    } else {
      stylingGuidance = `Pleasant ${temp}°C. Ideal for versatile smart-casual styling, oxford shirts, and tailored chinos.`;
    }

    return {
      city: matchedCity.name,
      temperature: temp,
      feels_like: Math.round(current.apparent_temperature ?? temp),
      condition: weatherInfo.condition,
      humidity,
      rain_probability: rainProb,
      wind_speed: windSpeed,
      uv_index: uvIndex,
      summary: stylingGuidance,
    };
  } catch (error) {
    console.error('Weather fetch fallback error:', error);
    // Graceful fallback for offline / disconnected environments
    return {
      city: cityName || 'Mumbai',
      temperature: 28,
      feels_like: 30,
      condition: 'Partly Cloudy',
      humidity: 65,
      rain_probability: 15,
      wind_speed: 12,
      uv_index: 6,
      summary: '28°C with moderate humidity. Ideal for breathable cottons, linen shirts, and comfortable loafers.',
    };
  }
}
