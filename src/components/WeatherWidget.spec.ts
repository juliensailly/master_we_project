import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/vue'
import * as useWeatherModule from 'src/composable/use-weather'
import WeatherWidget from './WeatherWidget.vue'

vi.mock('src/composable/use-weather')

describe('# WeatherWidget', () => {
  const mockFetchWeatherByCity = vi.fn()
  const mockFetchWeatherByCoordinates = vi.fn()
  const mockGetUserLocation = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useWeatherModule.useWeather).mockReturnValue({
      weather: ref(null),
      isLoading: ref(false),
      error: ref(null),
      fetchWeatherByCity: mockFetchWeatherByCity,
      fetchWeatherByCoordinates: mockFetchWeatherByCoordinates,
      getUserLocation: mockGetUserLocation,
    })
  })

  it('should fetch Paris weather on mount', async () => {
    render(WeatherWidget)

    await waitFor(() => {
      expect(mockFetchWeatherByCity).toHaveBeenCalledWith('Paris')
    })
  })

  it('should show loading state in compact mode', () => {
    vi.mocked(useWeatherModule.useWeather).mockReturnValue({
      weather: ref(null),
      isLoading: ref(true),
      error: ref(null),
      fetchWeatherByCity: mockFetchWeatherByCity,
      fetchWeatherByCoordinates: mockFetchWeatherByCoordinates,
      getUserLocation: mockGetUserLocation,
    })

    const { container } = render(WeatherWidget)
    const loadingElement = container.querySelector('.weather-loading')

    expect(loadingElement).toBeInTheDocument()
    expect(loadingElement?.textContent).toBe('⏳')
  })
})
