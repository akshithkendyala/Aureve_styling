import {
  fetchWeatherData,
  reverseGeocodeCoordinates,
  searchCities,
  POPULAR_INDIAN_CITIES,
} from '../src/lib/weather/weatherService';
import { generateIntelligentOutfit, evaluateMissingItem } from '../src/lib/ai/outfitEngine';
import { WardrobeItem, UserProfile, WeatherData } from '../src/lib/types';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 AUREVÉ LOCATION, REAL-TIME WEATHER & AI STYLING TEST SUITE');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function runTestSuite() {
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      if (detail) console.error(`   Detail: ${detail}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // TEST A: HYDERABAD LOCATION RESOLUTION (ROOT CAUSE FIX)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST A: Saved Hyderabad Location Resolution (No Silent Mumbai Fallback) ---');
  
  const hydInput1 = 'Hyderabad, Telangana, India';
  const hydWeather1 = await fetchWeatherData(hydInput1);
  assert(
    hydWeather1.city === 'Hyderabad',
    `Resolving "${hydInput1}" returns city "Hyderabad"`,
    `Got: ${hydWeather1.city}`
  );
  assert(
    hydWeather1.city !== 'Mumbai',
    `Resolving "${hydInput1}" does NOT substitute "Mumbai"`,
    `Got: ${hydWeather1.city}`
  );
  assert(
    typeof hydWeather1.temperature === 'number' && hydWeather1.temperature > -50 && hydWeather1.temperature < 60,
    `Valid temperature retrieved for Hyderabad: ${hydWeather1.temperature}°C`
  );
  assert(
    typeof hydWeather1.humidity === 'number' && hydWeather1.humidity >= 0 && hydWeather1.humidity <= 100,
    `Valid humidity retrieved for Hyderabad: ${hydWeather1.humidity}%`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST B: CHANGING LOCATION TO BENGALURU
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST B: Changing Location to Bengaluru ---');

  const blrInput = 'Bengaluru, Karnataka, India';
  const blrWeather = await fetchWeatherData(blrInput);
  assert(
    blrWeather.city === 'Bengaluru',
    `Resolving "${blrInput}" returns city "Bengaluru"`,
    `Got: ${blrWeather.city}`
  );
  assert(
    blrWeather.city !== 'Mumbai' && blrWeather.city !== 'Hyderabad',
    `Bengaluru weather does NOT show Mumbai or Hyderabad`,
    `Got: ${blrWeather.city}`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST C: BROWSER GPS REVERSE GEOCODING
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST C: Browser GPS Coordinate Reverse Geocoding ---');

  // Hyderabad coordinates: 17.3850° N, 78.4867° E
  const gpsHyd = await reverseGeocodeCoordinates(17.3850, 78.4867);
  assert(
    gpsHyd.city.toLowerCase().includes('hyderabad'),
    `Reverse geocoding (17.3850, 78.4867) resolves to Hyderabad`,
    `Got: ${gpsHyd.city}, State: ${gpsHyd.state}`
  );

  // Bengaluru coordinates: 12.9716° N, 77.5946° E
  const gpsBlr = await reverseGeocodeCoordinates(12.9716, 77.5946);
  assert(
    gpsBlr.city.toLowerCase().includes('bengaluru') || gpsBlr.city.toLowerCase().includes('bangalore'),
    `Reverse geocoding (12.9716, 77.5946) resolves to Bengaluru`,
    `Got: ${gpsBlr.city}`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST D: CITY SEARCH & AUTOCOMPLETE
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST D: City Autocomplete & Search ---');

  const searchResults = await searchCities('Jaipur');
  assert(
    searchResults.length > 0 && searchResults[0].name.toLowerCase() === 'jaipur',
    `Searching for "Jaipur" returns Jaipur as top match`,
    `Got: ${JSON.stringify(searchResults.slice(0, 2))}`
  );

  const searchKochi = await searchCities('Kochi');
  assert(
    searchKochi.some((c) => c.name.toLowerCase() === 'kochi'),
    `Searching for "Kochi" includes Kochi`,
    `Got: ${JSON.stringify(searchKochi.slice(0, 2))}`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST E: FUTURE OUTING FORECAST RESOLUTION
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST E: Future Outing Forecast Resolution ---');

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 2);
  const futureDateStr = futureDate.toISOString().split('T')[0];

  const forecastWeather = await fetchWeatherData('Hyderabad', {
    date: futureDateStr,
    time: '20:00',
  });

  assert(
    forecastWeather.city === 'Hyderabad',
    `Forecast destination is Hyderabad`,
    `Got: ${forecastWeather.city}`
  );
  assert(
    forecastWeather.is_forecast === true,
    `Weather is flagged as future forecast (is_forecast: true)`,
    `Got: ${forecastWeather.is_forecast}`
  );
  assert(
    Boolean(forecastWeather.forecast_time),
    `Weather includes forecast_time metadata: ${forecastWeather.forecast_time}`
  );

  // ─────────────────────────────────────────────────────────────
  // TEST F: WEATHER-AWARE AI STYLING & MISSING ITEM EVALUATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST F: Weather-Aware AI Styling & Climate Adaptations ---');

  const mockWardrobe: WardrobeItem[] = [
    {
      id: 'item_linen_shirt',
      user_id: 'u1',
      category: 'tops',
      subcategory: 'Shirt',
      name: 'Breezy White Linen Shirt',
      primary_color: 'White',
      material: 'Linen',
      formality: 'Smart Casual',
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
      times_worn: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'item_heavy_wool_sweater',
      user_id: 'u1',
      category: 'tops',
      subcategory: 'Sweater',
      name: 'Chunky Wool Cable Knit',
      primary_color: 'Navy',
      material: 'Wool',
      formality: 'Casual',
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
      times_worn: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'item_formal_shirt',
      user_id: 'u1',
      category: 'tops',
      subcategory: 'Formal Shirt',
      name: 'Crisp Light Blue Cotton Formal Shirt',
      primary_color: 'Light Blue',
      material: 'Cotton',
      formality: 'Formal',
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
      times_worn: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'item_chinos',
      user_id: 'u1',
      category: 'bottoms',
      subcategory: 'Chinos',
      name: 'Tailored Beige Chinos',
      primary_color: 'Beige',
      material: 'Cotton',
      formality: 'Smart Casual',
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
      times_worn: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'item_formal_trousers',
      user_id: 'u1',
      category: 'bottoms',
      subcategory: 'Formal Trousers',
      name: 'Charcoal Wool-Blend Trousers',
      primary_color: 'Charcoal',
      material: 'Wool Blend',
      formality: 'Formal',
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
      times_worn: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'item_loafers',
      user_id: 'u1',
      category: 'footwear',
      subcategory: 'Loafers',
      name: 'Dark Brown Leather Penny Loafers',
      primary_color: 'Dark Brown',
      material: 'Leather',
      formality: 'Smart Casual',
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
      times_worn: 0,
      created_at: new Date().toISOString(),
    },
    {
      id: 'item_formal_shoes',
      user_id: 'u1',
      category: 'footwear',
      subcategory: 'Formal Shoes',
      name: 'Black Leather Oxfords',
      primary_color: 'Black',
      material: 'Leather',
      formality: 'Formal',
      is_archived: false,
      image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf',
      times_worn: 0,
      created_at: new Date().toISOString(),
    },
  ];

  const mockProfile: UserProfile = {
    id: 'p1',
    user_id: 'u1',
    name: 'Sai Lalitha Raam',
    city: 'Hyderabad',
    gender: 'Female',
    skin_tone: 'Warm Undertone',
    body_build: 'Proportional',
    preferred_fit: 'Tailored',
  };

  // Scenario F1: Hot Summer Weather in Hyderabad (38°C)
  console.log('\nScenario F1: Hot Summer Weather (38°C)');
  const hotWeather: WeatherData = {
    city: 'Hyderabad',
    temperature: 38,
    feels_like: 42,
    condition: 'Hot & Sunny',
    humidity: 45,
    rain_probability: 0,
    wind_speed: 12,
    uv_index: 9,
  };

  const hotOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: mockWardrobe,
    userProfile: mockProfile,
    occasion: 'Casual Outing',
    location: 'Hyderabad',
    weather: hotWeather,
  });

  const topChosenHot = hotOutfit.items.find((i) => i.role === 'top')?.item;
  assert(
    topChosenHot?.id === 'item_linen_shirt',
    `Hot summer weather favors breathable linen shirt over heavy wool sweater`,
    `Chosen top: ${topChosenHot?.name}`
  );
  assert(
    hotOutfit.ai_explanation.toLowerCase().includes('hyderabad') ||
    hotOutfit.ai_explanation.toLowerCase().includes('breathab') ||
    hotOutfit.ai_explanation.toLowerCase().includes('comfort') ||
    hotOutfit.ai_explanation.toLowerCase().includes('heat'),
    `AI explanation references climate context for hot weather`
  );

  // Scenario F2: Rainy Monsoon Weather (High rain probability)
  console.log('\nScenario F2: Rainy Monsoon Weather (75% Rain Probability)');
  const rainyWeather: WeatherData = {
    city: 'Hyderabad',
    temperature: 26,
    feels_like: 28,
    condition: 'Heavy Rain / Thunderstorm',
    humidity: 88,
    rain_probability: 75,
    wind_speed: 24,
    uv_index: 3,
  };

  const rainyMissing = evaluateMissingItem(
    mockWardrobe,
    'casual',
    mockWardrobe[0],
    mockWardrobe[3],
    rainyWeather
  );

  assert(
    rainyMissing !== null && rainyMissing.category === 'layers',
    `Missing item detector identifies water-resistant rain layer for rainy weather`,
    `Got: ${rainyMissing?.suggested_item}`
  );
  assert(
    rainyMissing?.reason.includes('75%') || rainyMissing?.reason.includes('rain') || rainyMissing?.reason.includes('Hyderabad'),
    `Missing item explanation includes actual rain probability/city: "${rainyMissing?.reason}"`
  );

  // Scenario F3: Cold Winter Weather (14°C)
  console.log('\nScenario F3: Cold Winter Weather (14°C)');
  const coldWeather: WeatherData = {
    city: 'Hyderabad',
    temperature: 14,
    feels_like: 13,
    condition: 'Chilly Morning',
    humidity: 60,
    rain_probability: 0,
    wind_speed: 10,
    uv_index: 4,
  };

  const coldOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: mockWardrobe,
    userProfile: mockProfile,
    occasion: 'Casual Outing',
    location: 'Hyderabad',
    weather: coldWeather,
  });

  const topChosenCold = coldOutfit.items.find((i) => i.role === 'top')?.item;
  assert(
    topChosenCold?.id === 'item_heavy_wool_sweater',
    `Cold weather favors warm knitwear (Chunky Wool Sweater) over linen`,
    `Chosen top: ${topChosenCold?.name}`
  );

  // Scenario F4: Formality Preservation During Interview (Weather must not violate dress code)
  console.log('\nScenario F4: Interview Occasion (Formal rules preserved despite hot weather)');
  const interviewOutfit = await generateIntelligentOutfit({
    userId: 'u1',
    wardrobe: mockWardrobe,
    userProfile: mockProfile,
    occasion: 'Interview',
    location: 'Hyderabad',
    weather: hotWeather, // 38°C hot weather
  });

  const topChosenInterview = interviewOutfit.items.find((i) => i.role === 'top')?.item;
  const bottomChosenInterview = interviewOutfit.items.find((i) => i.role === 'bottom')?.item;
  const footwearChosenInterview = interviewOutfit.items.find((i) => i.role === 'footwear')?.item;

  assert(
    topChosenInterview?.formality === 'Formal' && topChosenInterview?.id === 'item_formal_shirt',
    `Formal interview selects formal cotton shirt despite 38°C heat`,
    `Chosen top: ${topChosenInterview?.name}`
  );
  assert(
    bottomChosenInterview?.id === 'item_formal_trousers',
    `Formal interview selects formal trousers`,
    `Chosen bottom: ${bottomChosenInterview?.name}`
  );
  assert(
    footwearChosenInterview?.id === 'item_formal_shoes',
    `Formal interview selects Oxford formal shoes`,
    `Chosen footwear: ${footwearChosenInterview?.name}`
  );

  // ─────────────────────────────────────────────────────────────
  // FINAL SCORECARD
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊 TEST SUITE SUMMARY: ${passed}/${total} PASSED (${Math.round((passed / total) * 100)}%)`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (passed === total) {
    console.log('🎉 ALL LOCATION & REAL-TIME WEATHER SUITE TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error(`⚠️ ${total - passed} test(s) failed.`);
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
