import { ref } from 'vue'
import type { Ref } from 'vue'

export interface WeatherData {
  city: string
  temperature: number
  description: string
  icon: string
  humidity: number
  windSpeed: number
}

export interface UseWeatherReturn {
  weather: Ref<WeatherData | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  fetchWeatherByCity: (city: string) => Promise<void>
  fetchWeatherByCoordinates: (lat: number, lon: number, cityName?: string) => Promise<void>
  getUserLocation: () => Promise<void>
}

interface GeocodingResult {
  name: string
  latitude: number
  longitude: number
}

interface GeocodingResponse {
  results?: GeocodingResult[]
}

interface CurrentWeather {
  temperature: number
  weathercode: number
  windspeed: number
}

interface WeatherResponse {
  current_weather: CurrentWeather
}

// Using Open-Meteo API - Completely free, no API key required!
// https://open-meteo.com/
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'

// WMO Weather codes to descriptions and icons
function getWeatherInfo(code: number): { description: string, icon: string } {
  const weatherCodes: Record<number, { description: string, icon: string }> = {
    0: { description: 'Clear sky', icon: '01d' },
    1: { description: 'Mainly clear', icon: '01d' },
    2: { description: 'Partly cloudy', icon: '02d' },
    3: { description: 'Overcast', icon: '03d' },
    45: { description: 'Foggy', icon: '50d' },
    48: { description: 'Foggy', icon: '50d' },
    51: { description: 'Light drizzle', icon: '09d' },
    53: { description: 'Drizzle', icon: '09d' },
    55: { description: 'Heavy drizzle', icon: '09d' },
    61: { description: 'Light rain', icon: '10d' },
    63: { description: 'Rain', icon: '10d' },
    65: { description: 'Heavy rain', icon: '10d' },
    71: { description: 'Light snow', icon: '13d' },
    73: { description: 'Snow', icon: '13d' },
    75: { description: 'Heavy snow', icon: '13d' },
    77: { description: 'Snow grains', icon: '13d' },
    80: { description: 'Light showers', icon: '09d' },
    81: { description: 'Showers', icon: '09d' },
    82: { description: 'Heavy showers', icon: '09d' },
    85: { description: 'Light snow showers', icon: '13d' },
    86: { description: 'Snow showers', icon: '13d' },
    95: { description: 'Thunderstorm', icon: '11d' },
    96: { description: 'Thunderstorm with hail', icon: '11d' },
    99: { description: 'Thunderstorm with hail', icon: '11d' },
  }
  return weatherCodes[code] || { description: 'Unknown', icon: '01d' }
}

export function useWeather(): UseWeatherReturn {
  const weather = ref<WeatherData | null>(null)
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)

  async function fetchWeatherByCity(city: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // First, get coordinates from city name using geocoding
      const geoResponse = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(city)}&count=1&language=en&format=json`)

      if (!geoResponse.ok) {
        throw new Error(`Location not found for ${city}`)
      }

      const geoData = await geoResponse.json() as GeocodingResponse

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(`Location not found for ${city}`)
      }

      const location = geoData.results[0]
      await fetchWeatherByCoordinates(location.latitude, location.longitude, location.name)
    }
    catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to fetch weather data'
      weather.value = null
      isLoading.value = false
    }
  }

  async function fetchWeatherByCoordinates(lat: number, lon: number, cityName?: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const response = await fetch(
        `${WEATHER_URL}?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`,
      )

      if (!response.ok) {
        throw new Error('Weather data not available for your location')
      }

      const data = await response.json() as WeatherResponse
      const weatherInfo = getWeatherInfo(data.current_weather.weathercode)

      weather.value = {
        city: cityName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
        temperature: Math.round(data.current_weather.temperature),
        description: weatherInfo.description,
        icon: weatherInfo.icon,
        humidity: 0, // Open-Meteo free tier doesn't include humidity in current_weather
        windSpeed: Math.round(data.current_weather.windspeed),
      }
    }
    catch (error_) {
      error.value = error_ instanceof Error ? error_.message : 'Failed to fetch weather data'
      weather.value = null
    }
    finally {
      isLoading.value = false
    }
  }

  async function getUserLocation(): Promise<void> {
    if (!navigator.geolocation) {
      error.value = 'Geolocation is not supported by your browser'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject)
      })

      await fetchWeatherByCoordinates(
        position.coords.latitude,
        position.coords.longitude,
      )
    }
    catch (error_: unknown) {
      // Handle Geolocation errors by checking the code property
      if (error_ && typeof error_ === 'object' && 'code' in error_) {
        const errorCode = (error_ as { code: number }).code
        switch (errorCode) {
          case 1: { // PERMISSION_DENIED
            error.value = 'Location permission denied'
            break
          }
          case 2: { // POSITION_UNAVAILABLE
            error.value = 'Location information unavailable'
            break
          }
          case 3: { // TIMEOUT
            error.value = 'Location request timed out'
            break
          }
          default: {
            error.value = 'Failed to get location'
          }
        }
      }
      else {
        error.value = error_ instanceof Error ? error_.message : 'Failed to get location'
      }
      isLoading.value = false
    }
  }

  return {
    weather,
    isLoading,
    error,
    fetchWeatherByCity,
    fetchWeatherByCoordinates,
    getUserLocation,
  }
}
