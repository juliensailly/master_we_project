import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWeather } from './use-weather'

/* eslint-disable camelcase */
// Setup geolocation mock
Object.defineProperty(globalThis.navigator, 'geolocation', {
  writable: true,
  value: {
    getCurrentPosition: vi.fn(),
  },
})

describe('useWeather', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    globalThis.fetch = vi.fn()
    globalThis.navigator.geolocation.getCurrentPosition = vi.fn()
  })

  describe('fetchWeatherByCity', () => {
    it('should fetch weather data for a city successfully', async () => {
      const mockGeoResponse = {
        results: [{
          name: 'Paris',
          latitude: 48.8566,
          longitude: 2.3522,
        }],
      }

      const mockWeatherResponse = {
        current_weather: {
          temperature: 20.5,
          weathercode: 0,
          windspeed: 18,
        },
      }

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGeoResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockWeatherResponse,
        })

      const { weather, isLoading, error, fetchWeatherByCity } = useWeather()

      expect(weather.value).toBeNull()
      expect(isLoading.value).toBe(false)

      await fetchWeatherByCity('Paris')

      expect(isLoading.value).toBe(false)
      expect(error.value).toBeNull()
      expect(weather.value).toEqual({
        city: 'Paris',
        temperature: 21,
        description: 'Clear sky',
        icon: '01d',
        humidity: 0,
        windSpeed: 18,
      })
    })

    it('should handle fetch error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
      })

      const { weather, error, fetchWeatherByCity } = useWeather()

      await fetchWeatherByCity('InvalidCity')

      expect(error.value).toBe('Location not found for InvalidCity')
      expect(weather.value).toBeNull()
    })

    it('should set loading state during fetch', async () => {
      const mockGeoResponse = { results: [{ name: 'Paris', latitude: 48.8566, longitude: 2.3522 }] }
      const mockWeatherResponse = { current_weather: { temperature: 20, weathercode: 0, windspeed: 18 } }

      globalThis.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: async () => mockGeoResponse })
        .mockResolvedValueOnce({ ok: true, json: async () => mockWeatherResponse })

      const { isLoading, fetchWeatherByCity } = useWeather()

      expect(isLoading.value).toBe(false)
      await fetchWeatherByCity('Paris')
      expect(isLoading.value).toBe(false)
    })
  })

  describe('fetchWeatherByCoordinates', () => {
    it('should fetch weather data by coordinates successfully', async () => {
      const mockResponse = {
        current_weather: {
          temperature: 25.3,
          weathercode: 2,
          windspeed: 11,
        },
      }

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      })

      const { weather, error, fetchWeatherByCoordinates } = useWeather()

      await fetchWeatherByCoordinates(35.6762, 139.6503, 'Tokyo')

      expect(error.value).toBeNull()
      expect(weather.value).toEqual({
        city: 'Tokyo',
        temperature: 25,
        description: 'Partly cloudy',
        icon: '02d',
        humidity: 0,
        windSpeed: 11,
      })
    })

    it('should handle coordinates fetch error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
      })

      const { weather, error, fetchWeatherByCoordinates } = useWeather()

      await fetchWeatherByCoordinates(0, 0)

      expect(error.value).toBe('Weather data not available for your location')
      expect(weather.value).toBeNull()
    })
  })

  describe('getUserLocation', () => {
    it('should fetch weather for user location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
        },
      }

      const mockWeatherResponse = {
        current_weather: {
          temperature: 18,
          weathercode: 3,
          windspeed: 14,
        },
      }

      globalThis.navigator.geolocation.getCurrentPosition = vi.fn((success: any) => {
        success(mockPosition)
      })

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWeatherResponse,
      })

      const { weather, error, getUserLocation } = useWeather()

      await getUserLocation()

      expect(error.value).toBeNull()
      expect(weather.value?.temperature).toBe(18)
      expect(weather.value?.description).toBe('Overcast')
      expect(weather.value?.icon).toBe('03d')
      expect(weather.value?.windSpeed).toBe(14)
    })

    it('should handle geolocation permission denied', async () => {
      const geolocationError = {
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }

      globalThis.navigator.geolocation.getCurrentPosition = vi.fn((_: any, error: any) => {
        error(geolocationError)
      })

      const { error, getUserLocation } = useWeather()

      await getUserLocation()

      expect(error.value).toBe('Location permission denied')
    })

    it('should handle geolocation timeout', async () => {
      const geolocationError = {
        code: 3, // TIMEOUT
      }

      globalThis.navigator.geolocation.getCurrentPosition = vi.fn((_: any, error: any) => {
        error(geolocationError)
      })

      const { error, getUserLocation } = useWeather()

      await getUserLocation()

      expect(error.value).toBe('Location request timed out')
    })
  })
})
