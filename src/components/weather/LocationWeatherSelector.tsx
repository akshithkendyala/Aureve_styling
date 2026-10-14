'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  CloudSun,
  CloudRain,
  Sun,
  Wind,
  Droplets,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  Compass,
  X,
  ChevronDown,
  Info,
} from 'lucide-react';
import { WeatherData } from '@/lib/types';
import { POPULAR_INDIAN_CITIES } from '@/lib/weather/weatherService';

interface LocationWeatherSelectorProps {
  city: string;
  onCityChange: (newCity: string) => void;
  weather: WeatherData | null;
  isWeatherLoading: boolean;
  weatherError?: string | null;
  savedProfileCity?: string | null;
  locationSource: 'profile' | 'geolocation' | 'manual';
  onUseCurrentLocation: () => void;
  isLocating: boolean;
  geoMessage?: { type: 'info' | 'error' | 'success'; text: string } | null;
  onClearGeoMessage?: () => void;
  date?: string;
  time?: string;
}

export function LocationWeatherSelector({
  city,
  onCityChange,
  weather,
  isWeatherLoading,
  weatherError,
  savedProfileCity,
  locationSource,
  onUseCurrentLocation,
  isLocating,
  geoMessage,
  onClearGeoMessage,
  date,
  time,
}: LocationWeatherSelectorProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(POPULAR_INDIAN_CITIES);
  const [isSearchingApi, setIsSearchingApi] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Close search popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isSearchOpen]);

  // Debounced search against popular list + server search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(POPULAR_INDIAN_CITIES);
      return;
    }

    const query = searchQuery.trim().toLowerCase();
    const localFiltered = POPULAR_INDIAN_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.state.toLowerCase().includes(query)
    );
    setSearchResults(localFiltered);

    // Also fetch remote autocomplete if local has few results
    let isCancelled = false;
    const timer = setTimeout(async () => {
      try {
        setIsSearchingApi(true);
        const res = await fetch(`/api/weather?search=${encodeURIComponent(query)}`);
        if (res.ok && !isCancelled) {
          const data = await res.json();
          if (Array.isArray(data.results) && data.results.length > 0) {
            setSearchResults((prev) => {
              const combined = [...prev];
              data.results.forEach((rem: any) => {
                if (!combined.some((c) => c.name.toLowerCase() === rem.name.toLowerCase())) {
                  combined.push({
                    name: rem.name,
                    state: rem.state || '',
                    country: rem.country || 'India',
                    lat: rem.lat,
                    lon: rem.lon,
                  });
                }
              });
              return combined;
            });
          }
        }
      } catch (e) {
        // Silently keep local
      } finally {
        if (!isCancelled) setIsSearchingApi(false);
      }
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  const handleSelectCity = (cityName: string) => {
    onCityChange(cityName);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onCityChange(searchQuery.trim());
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  };

  const getWeatherIcon = (condition?: string) => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain') || c.includes('drizzle') || c.includes('shower')) {
      return <CloudRain className="w-4 h-4 text-sky-600" />;
    }
    if (c.includes('cloud') || c.includes('overcast')) {
      return <CloudSun className="w-4 h-4 text-[#9A7B5F]" />;
    }
    return <Sun className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner / Form Widget */}
      <div className="bg-[#FAF8F5] border border-[#EBE5DB] rounded-3xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Location details */}
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-full bg-white border border-[#EBE5DB] flex items-center justify-center flex-shrink-0 text-[#7E6047] shadow-2xs mt-0.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7E6047]">
                  Outfit Destination
                </span>
                {locationSource === 'geolocation' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    GPS Detected
                  </span>
                )}
                {locationSource === 'profile' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBE5DB] text-[#5E4633]">
                    Saved Profile
                  </span>
                )}
                {locationSource === 'manual' && (
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                    Selected
                  </span>
                )}
              </div>
              <h3 className="font-serif text-lg sm:text-xl font-semibold text-[#18181B] mt-0.5">
                {city || 'Select Location'}
                {weather?.state && !city.includes(weather.state) && (
                  <span className="font-sans text-xs text-[#7E6047] font-normal ml-1.5">
                    ({weather.state})
                  </span>
                )}
              </h3>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={onUseCurrentLocation}
              disabled={isLocating}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-[#F4EFEA] border border-[#EBE5DB] rounded-full text-xs font-semibold text-[#18181B] transition-all shadow-2xs active:scale-95 disabled:opacity-60"
              title="Use current device location via browser GPS"
            >
              <Navigation className={`w-3.5 h-3.5 text-[#7E6047] ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Detecting…' : 'Use My Location'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center space-x-1 px-3.5 py-2 bg-[#18181B] hover:bg-[#3D2E22] text-[#FAF8F5] rounded-full text-xs font-semibold transition-all shadow-2xs active:scale-95"
            >
              <span>Change City</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#FAF8F5]/80" />
            </button>
          </div>
        </div>

        {/* Geolocation feedback / status notification */}
        {geoMessage && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-start justify-between gap-2 border transition-all animate-in fade-in duration-200 ${
              geoMessage.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-800'
                : geoMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span>{geoMessage.text}</span>
              </div>
            </div>
            {onClearGeoMessage && (
              <button
                type="button"
                onClick={onClearGeoMessage}
                className="text-stone-400 hover:text-stone-700 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Live Weather Preview Strip */}
        <div className="pt-3 border-t border-[#EBE5DB]/70">
          {isWeatherLoading ? (
            <div className="flex items-center space-x-2.5 py-2 text-xs text-[#7E6047] animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin text-[#9A7B5F]" />
              <span>Fetching live climate & forecast for {city}…</span>
            </div>
          ) : weatherError ? (
            <div className="flex items-center space-x-2 py-1 text-xs text-amber-800">
              <Info className="w-3.5 h-3.5 text-amber-600" />
              <span>{weatherError}</span>
            </div>
          ) : weather ? (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              {/* Temperature & Condition */}
              <div className="flex items-center space-x-2 font-medium text-[#18181B]">
                {getWeatherIcon(weather.condition)}
                <span className="font-semibold text-sm">{weather.temperature}°C</span>
                <span className="text-[#5E4633]">{weather.condition}</span>
                {weather.feels_like !== undefined && (
                  <span className="text-[11px] text-[#7E6047]">
                    (Feels {weather.feels_like}°C)
                  </span>
                )}
              </div>

              {/* Rain Probability */}
              <div className="flex items-center space-x-1.5 text-[#5E4633]">
                <Droplets className="w-3.5 h-3.5 text-sky-600" />
                <span>
                  Rain:{' '}
                  <strong className="text-[#18181B]">
                    {weather.rain_probability ?? 0}%
                  </strong>
                </span>
              </div>

              {/* Humidity */}
              <div className="flex items-center space-x-1.5 text-[#5E4633]">
                <span className="text-[11px] font-bold text-[#7E6047]">RH</span>
                <span>
                  Humidity:{' '}
                  <strong className="text-[#18181B]">{weather.humidity}%</strong>
                </span>
              </div>

              {/* Wind Speed */}
              <div className="flex items-center space-x-1.5 text-[#5E4633]">
                <Wind className="w-3.5 h-3.5 text-[#9A7B5F]" />
                <span>
                  Wind:{' '}
                  <strong className="text-[#18181B]">
                    {weather.wind_speed} km/h
                  </strong>
                </span>
              </div>

              {/* UV Index */}
              {weather.uv_index !== undefined && (
                <div className="flex items-center space-x-1.5 text-[#5E4633]">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>
                    UV:{' '}
                    <strong className="text-[#18181B]">
                      {weather.uv_index}
                    </strong>
                  </span>
                </div>
              )}

              {/* Forecast indicator badge */}
              {weather.is_forecast && (
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 ml-auto">
                  Forecast for {weather.forecast_time || `${date} ${time}`}
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#7E6047]">
              Weather information not available for {city}.
            </div>
          )}
        </div>
      </div>

      {/* City Search & Selection Modal / Popover */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            ref={popoverRef}
            className="bg-white rounded-3xl border border-[#EBE5DB] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EBE5DB]">
              <div className="flex items-center space-x-2">
                <Compass className="w-5 h-5 text-[#7E6047]" />
                <h3 className="font-serif text-lg font-semibold text-[#18181B]">
                  Select Destination City
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-full text-[#7E6047] hover:bg-[#FAF8F5] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick GPS button inside modal */}
            <button
              type="button"
              onClick={() => {
                onUseCurrentLocation();
                setIsSearchOpen(false);
              }}
              disabled={isLocating}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-2xl bg-[#FAF8F5] hover:bg-[#F4EFEA] border border-[#EBE5DB] text-xs font-semibold text-[#18181B] transition-colors shadow-2xs"
            >
              <Navigation className="w-3.5 h-3.5 text-[#7E6047]" />
              <span>Use Current Device Location (GPS)</span>
            </button>

            {/* Search Input */}
            <form onSubmit={handleCustomSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9A7B5F]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search city (e.g. Hyderabad, Bengaluru, Jaipur...)"
                className="w-full pl-10 pr-20 py-2.5 bg-[#FAF8F5] border border-[#EBE5DB] rounded-2xl text-xs sm:text-sm font-medium text-[#18181B] focus:outline-none focus:border-[#18181B]"
              />
              {searchQuery && (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#18181B] text-[#FAF8F5] rounded-xl text-xs font-medium"
                >
                  Select
                </button>
              )}
            </form>

            {/* City List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-72">
              <div className="text-[10px] uppercase font-bold tracking-wider text-[#7E6047] px-2 py-1">
                {searchQuery ? 'Search Results' : 'Popular Cities in India'}
              </div>

              {searchResults.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#7E6047] space-y-2">
                  <p>No cities matched &ldquo;{searchQuery}&rdquo;</p>
                  <button
                    type="button"
                    onClick={() => handleSelectCity(searchQuery.trim())}
                    className="inline-flex items-center space-x-1 px-4 py-1.5 bg-[#18181B] text-white rounded-full text-xs font-medium"
                  >
                    <span>Use &ldquo;{searchQuery}&rdquo; anyway</span>
                  </button>
                </div>
              ) : (
                searchResults.map((c) => {
                  const isCurrent =
                    city.toLowerCase().includes(c.name.toLowerCase()) ||
                    c.name.toLowerCase() === city.toLowerCase();

                  return (
                    <button
                      key={`${c.name}-${c.state}`}
                      type="button"
                      onClick={() => handleSelectCity(c.name)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-[#18181B] text-white font-medium'
                          : 'hover:bg-[#FAF8F5] text-[#18181B]'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <MapPin className={`w-3.5 h-3.5 ${isCurrent ? 'text-[#FAF8F5]' : 'text-[#7E6047]'}`} />
                        <div>
                          <span className="font-medium">{c.name}</span>
                          {c.state && (
                            <span className={`text-[11px] ml-1.5 ${isCurrent ? 'text-white/80' : 'text-[#7E6047]'}`}>
                              • {c.state}
                            </span>
                          )}
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#D4AF37]" />}
                    </button>
                  );
                })
              )}
            </div>

            {/* Saved Profile City Quick Access */}
            {savedProfileCity && (
              <div className="pt-3 border-t border-[#EBE5DB] flex items-center justify-between text-xs text-[#7E6047]">
                <span>Saved Home Profile: <strong>{savedProfileCity}</strong></span>
                <button
                  type="button"
                  onClick={() => handleSelectCity(savedProfileCity)}
                  className="text-xs font-semibold text-[#18181B] hover:underline"
                >
                  Use Saved Location
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
