# Weather Widget

A weather widget has been added to the navigation bar showing weather information.

## Setup

**No API key required!** The widget uses the free Open-Meteo API (https://open-meteo.com/) which doesn't require any registration or API key. It works out of the box.

## Features

- Shows weather for Paris by default when the app loads
- Compact view in navbar showing temperature and weather emoji
- Click to expand for detailed information (wind speed, weather description)
- "My Location" button to get weather for user's current location (requires browser permission)
- Responsive design that works across all pages
- Completely free with no API limits for non-commercial use

## Implementation

The weather widget consists of:
- **use-weather.ts**: Composable handling Open-Meteo API calls
- **WeatherWidget.vue**: UI component with compact and expanded views
- **AppNavigation.vue**: Integration into the main navigation bar

The component follows the same patterns as other features in the app with proper error handling and loading states.
