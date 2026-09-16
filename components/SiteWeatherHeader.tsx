import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Sun, CloudRain, Wind, MapPin } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeProvider';
import { FONT } from '../theme/tokens';

interface CityWeather {
  city: string;
  tempC: number;
  condition: string;
  icon: string;
}

const CAMEROON_CITIES: CityWeather[] = [
  { city: 'Yaoundé', tempC: 28, condition: 'Partly Cloudy', icon: '⛅' },
  { city: 'Douala', tempC: 31, condition: 'Light Rain', icon: '🌦️' },
  { city: 'Kribi', tempC: 29, condition: 'Coastal Breeze', icon: '🌊' },
  { city: 'Bafoussam', tempC: 24, condition: 'Clear', icon: '☀️' },
  { city: 'Garoua', tempC: 36, condition: 'Dry', icon: '☀️' },
];

export function SiteWeatherHeader() {
  const { colors, isSunlightMode, toggleSunlightMode } = useTheme();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [localTime, setLocalTime] = useState('');

  const activeCity = CAMEROON_CITIES[selectedIdx];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const cameroonDate = new Date(utc + 3600000 * 1);
      setLocalTime(
        cameroonDate.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const nextCity = () => {
    setSelectedIdx((prev) => (prev + 1) % CAMEROON_CITIES.length);
  };

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Pressable
        onPress={nextCity}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: 14,
          backgroundColor: colors.parchment,
          borderWidth: 1,
          borderColor: colors.parchmentDark,
        }}
      >
        <Text style={{ fontSize: 13 }}>{activeCity.icon}</Text>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text style={{ fontFamily: FONT.sansSemiBold, fontSize: 11, color: colors.ink }}>
              {activeCity.city}
            </Text>
            <Text style={{ fontFamily: FONT.mono, fontSize: 10, color: colors.forest, fontWeight: '700' }}>
              {activeCity.tempC}°C
            </Text>
          </View>
          <Text style={{ fontFamily: FONT.mono, fontSize: 8, color: colors.inkSubtle }}>
            {localTime} WAT · {activeCity.condition}
          </Text>
        </View>
      </Pressable>

      {/* Sunlight High Contrast Mode Toggle */}
      <Pressable
        onPress={toggleSunlightMode}
        style={{
          paddingHorizontal: 8,
          paddingVertical: 5,
          borderRadius: 14,
          backgroundColor: isSunlightMode ? '#FEF08A' : colors.parchment,
          borderWidth: 1,
          borderColor: isSunlightMode ? '#CA8A04' : colors.parchmentDark,
          alignItems: 'center',
          justifyContent: 'center',
        }}
        accessibilityLabel="Toggle Outdoor High-Contrast Sunlight Mode"
      >
        <Text style={{ fontSize: 13 }}>{isSunlightMode ? '☀️ High-Vis' : '☀️'}</Text>
      </Pressable>
    </View>
  );
}
