<template>
  <div class="weather-widget">
    <div
      v-if="!isExpanded"
      class="weather-compact"
      role="button"
      tabindex="0"
      @click="toggleExpanded"
      @keydown.enter="toggleExpanded"
      @keydown.space.prevent="toggleExpanded"
    >
      <template v-if="isLoading">
        <span class="weather-loading">⏳</span>
      </template>
      <template v-else-if="weather">
        <span class="weather-icon-emoji">{{ getWeatherEmoji(weather.icon) }}</span>
        <span class="weather-temp">{{ weather.temperature }}°C</span>
      </template>
      <template v-else>
        <span class="weather-icon">🌤️</span>
      </template>
    </div>

    <div
      v-else
      class="weather-expanded"
    >
      <div class="weather-header">
        <h5>Weather</h5>
        <button
          class="btn-close"
          @click="toggleExpanded"
        >
          ×
        </button>
      </div>

      <div
        v-if="error"
        class="weather-error"
      >
        {{ error }}
      </div>

      <div
        v-if="isLoading"
        class="weather-loading-full"
      >
        Loading weather data...
      </div>

      <div
        v-else-if="weather"
        class="weather-content"
      >
        <div class="weather-main">
          <span class="weather-icon-large">{{ getWeatherEmoji(weather.icon) }}</span>
          <div class="weather-info">
            <div class="weather-city">
              {{ weather.city }}
            </div>
            <div class="weather-temp-large">
              {{ weather.temperature }}°C
            </div>
            <div class="weather-description">
              {{ weather.description }}
            </div>
          </div>
        </div>

        <div class="weather-details">
          <div
            v-if="weather.humidity > 0"
            class="weather-detail"
          >
            <span class="detail-label">💧 Humidity:</span>
            <span class="detail-value">{{ weather.humidity }}%</span>
          </div>
          <div class="weather-detail">
            <span class="detail-label">💨 Wind:</span>
            <span class="detail-value">{{ weather.windSpeed }} km/h</span>
          </div>
        </div>
      </div>

      <div class="weather-actions">
        <button
          class="btn btn-sm btn-outline-primary"
          :disabled="isLoading"
          @click="handleGetLocation"
        >
          📍 My Location
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useWeather } from 'src/composable/use-weather'

const { weather, isLoading, error, fetchWeatherByCity, getUserLocation } = useWeather()
const isExpanded = ref(false)

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

async function handleGetLocation() {
  await getUserLocation()
}

function getWeatherEmoji(iconCode: string): string {
  const emojiMap: Record<string, string> = {
    '01d': '☀️',
    '02d': '⛅',
    '03d': '☁️',
    '04d': '☁️',
    '09d': '🌧️',
    '10d': '🌦️',
    '11d': '⛈️',
    '13d': '❄️',
    '50d': '🌫️',
  }
  return emojiMap[iconCode] || '🌤️'
}

// Fetch Paris weather by default on mount
onMounted(async () => {
  await fetchWeatherByCity('Paris')
})
</script>

<style scoped>
.weather-widget {
  position: relative;
}

.weather-compact {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.weather-compact:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.weather-icon-small {
  width: 32px;
  height: 32px;
  margin: -8px;
}

.weather-icon-emoji {
  font-size: 1.5rem;
  line-height: 1;
}

.weather-temp {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
}

.weather-loading {
  font-size: 1.2rem;
}

.weather-icon {
  font-size: 1.5rem;
}

.weather-expanded {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  z-index: 1000;
  padding: 1rem;
}

.weather-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.weather-header h5 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 24px;
  height: 24px;
}

.btn-close:hover {
  color: #333;
}

.weather-error {
  color: #dc3545;
  font-size: 0.875rem;
  padding: 0.5rem;
  background: #f8d7da;
  border-radius: 4px;
  margin-bottom: 0.5rem;
}

.weather-loading-full {
  text-align: center;
  padding: 2rem 1rem;
  color: #666;
}

.weather-content {
  margin-bottom: 1rem;
}

.weather-main {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.weather-icon-large {
  font-size: 4rem;
  line-height: 1;
}

.weather-info {
  flex: 1;
}

.weather-city {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.weather-temp-large {
  font-size: 2rem;
  font-weight: 700;
  color: #5cb85c;
}

.weather-description {
  font-size: 0.9rem;
  color: #666;
  text-transform: capitalize;
}

.weather-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fa;
  border-radius: 4px;
}

.weather-detail {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.detail-label {
  color: #666;
}

.detail-value {
  font-weight: 600;
  color: #333;
}

.weather-actions {
  display: flex;
  gap: 0.5rem;
}

.weather-actions button {
  flex: 1;
  white-space: nowrap;
}
</style>
