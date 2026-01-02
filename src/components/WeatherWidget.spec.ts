import { beforeEach, describe, expect, it, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/vue'
import * as useWeatherModule from 'src/composable/use-weather'
import WeatherWidget from './WeatherWidget.vue'

vi.mock('src/composable/use-weather')

describe('# WeatherWidget', () => {
  const mockUseWeather = {
    weather: { value: null },
    isLoading: { value: false },
    error: { value: null },
    fetchWeatherByCity: vi.fn(),
    fetchWeatherByCoordinates: vi.fn(),
    getUserLocation: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseWeather.weather.value = null
    mockUseWeather.isLoading.value = false
    mockUseWeather.error.value = null
    vi.mocked(useWeatherModule.useWeather).mockReturnValue(mockUseWeather as any)
  })

  it('should fetch Paris weather on mount', async () => {
    render(WeatherWidget)

    await waitFor(() => {
      expect(mockUseWeather.fetchWeatherByCity).toHaveBeenCalledWith('Paris')
    })
  })

  it('should display weather icon in compact mode', async () => {
    mockUseWeather.weather.value = {
      city: 'Paris',
      temperature: 20,
      description: 'clear sky',
      icon: '01d',
      humidity: 60,
      windSpeed: 18,
    }

    render(WeatherWidget)

    const img = screen.getByAlt('clear sky')
    expect(img).toHaveAttribute('src', 'https://openweathermap.org/img/wn/01d@2x.png')
    expect(screen.getByText('20°C')).toBeInTheDocument()
  })

  it('should show loading state in compact mode', () => {
    mockUseWeather.isLoading.value = true

    render(WeatherWidget)

    expect(screen.getByText('⏳')).toBeInTheDocument()
  })

  it('should expand widget when clicked', async () => {
    mockUseWeather.weather.value = {
      city: 'Paris',
      temperature: 20,
      description: 'clear sky',
      icon: '01d',
      humidity: 60,
      windSpeed: 18,
    }

    const user = userEvent.setup()
    render(WeatherWidget)

    const compact = screen.getByText('20°C').closest('.weather-compact')
    expect(compact).toBeInTheDocument()

    await user.click(compact!)

    await waitFor(() => {
      expect(screen.getByText('Weather')).toBeInTheDocument()
      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('📍 My Location')).toBeInTheDocument()
    })
  })

  it('should display weather details in expanded mode', async () => {
    mockUseWeather.weather.value = {
      city: 'Paris',
      temperature: 20,
      description: 'clear sky',
      icon: '01d',
      humidity: 60,
      windSpeed: 18,
    }

    const user = userEvent.setup()
    render(WeatherWidget)

    const compact = screen.getByText('20°C').closest('.weather-compact')
    await user.click(compact!)

    await waitFor(() => {
      expect(screen.getByText('Paris')).toBeInTheDocument()
      expect(screen.getByText('clear sky')).toBeInTheDocument()
      expect(screen.getByText('60%')).toBeInTheDocument()
      expect(screen.getByText('18 km/h')).toBeInTheDocument()
    })
  })

  it('should close expanded view when close button clicked', async () => {
    mockUseWeather.weather.value = {
      city: 'Paris',
      temperature: 20,
      description: 'clear sky',
      icon: '01d',
      humidity: 60,
      windSpeed: 18,
    }

    const user = userEvent.setup()
    render(WeatherWidget)

    // Expand
    const compact = screen.getByText('20°C').closest('.weather-compact')
    await user.click(compact!)

    await waitFor(() => {
      expect(screen.getByText('Weather')).toBeInTheDocument()
    })

    // Close
    const closeButton = screen.getByRole('button', { name: '×' })
    await user.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Weather')).not.toBeInTheDocument()
    })
  })

  it('should call getUserLocation when My Location button clicked', async () => {
    mockUseWeather.weather.value = {
      city: 'Paris',
      temperature: 20,
      description: 'clear sky',
      icon: '01d',
      humidity: 60,
      windSpeed: 18,
    }

    const user = userEvent.setup()
    render(WeatherWidget)

    // Expand
    const compact = screen.getByText('20°C').closest('.weather-compact')
    await user.click(compact!)

    await waitFor(() => {
      expect(screen.getByText('📍 My Location')).toBeInTheDocument()
    })

    // Click My Location
    const locationButton = screen.getByRole('button', { name: '📍 My Location' })
    await user.click(locationButton)

    expect(mockUseWeather.getUserLocation).toHaveBeenCalled()
  })

  it('should display error message when present', async () => {
    mockUseWeather.weather.value = null
    mockUseWeather.error.value = 'Failed to fetch weather data'

    const user = userEvent.setup()
    render(WeatherWidget)

    // Expand
    const compact = screen.getByText('🌤️').closest('.weather-compact')
    await user.click(compact!)

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch weather data')).toBeInTheDocument()
    })
  })

  it('should disable location button when loading', async () => {
    mockUseWeather.weather.value = {
      city: 'Paris',
      temperature: 20,
      description: 'clear sky',
      icon: '01d',
      humidity: 60,
      windSpeed: 18,
    }
    mockUseWeather.isLoading.value = true

    const user = userEvent.setup()
    render(WeatherWidget)

    // Expand
    const compact = screen.getByText('20°C').closest('.weather-compact')
    await user.click(compact!)

    await waitFor(() => {
      const locationButton = screen.getByRole('button', { name: '📍 My Location' })
      expect(locationButton).toBeDisabled()
    })
  })
})
