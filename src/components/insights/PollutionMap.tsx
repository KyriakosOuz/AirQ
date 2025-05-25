
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Pollutant } from '@/lib/types';

// Greek regions coordinates
const REGION_COORDINATES: Record<string, [number, number]> = {
  'thessaloniki': [22.9444, 40.6401],
  'ampelokipoi-menemeni': [22.9500, 40.6500],
  'neapoli-sykies': [22.9600, 40.6300],
  'kalamaria': [22.9547, 40.5803],
  'pavlos-melas': [22.9200, 40.6200],
  'pylaia-chortiatis': [23.0500, 40.5700],
  'panorama': [23.0400, 40.5900],
};

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoibmlvbW9kZSIsImEiOiJjbWIzczhobzcxczF4MmlwN2syaDFzajVwIn0.DsYH7lEKULJ1x7WJl_WcrA';

// Color scheme for pollution levels
const getPollutionColor = (value: number, maxValue: number): string => {
  const intensity = value / maxValue;
  if (intensity > 0.8) return '#8B0000'; // Dark red
  if (intensity > 0.6) return '#FF4500'; // Orange red
  if (intensity > 0.4) return '#FFA500'; // Orange
  if (intensity > 0.2) return '#FFD700'; // Gold
  return '#32CD32'; // Lime green
};

interface PollutionMapProps {
  data: Array<{ name: string; value: number }>;
  pollutant: Pollutant;
  year: number;
  unit: string;
  loading?: boolean;
  error?: string;
}

export const PollutionMap: React.FC<PollutionMapProps> = ({
  data,
  pollutant,
  year,
  unit,
  loading,
  error
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  // Helper function to get pollutant display name
  const getPollutantDisplayName = (pollutant: Pollutant) => {
    const pollutantNames: Record<Pollutant, string> = {
      pollution: "Combined Pollution Index",
      no2_conc: "NO₂",
      o3_conc: "O₃",
      co_conc: "CO",
      no_conc: "NO",
      so2_conc: "SO₂"
    };
    return pollutantNames[pollutant] || pollutant;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [22.9444, 40.6401], // Thessaloniki center
      zoom: 10,
      pitch: 0,
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update markers when data changes
  useEffect(() => {
    if (!map.current || !data.length) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    const maxValue = Math.max(...data.map(d => d.value));

    // Add new markers
    data.forEach(region => {
      const regionKey = region.name.toLowerCase().replace(/\s+/g, '-');
      const coordinates = REGION_COORDINATES[regionKey];
      
      if (!coordinates) return;

      const color = getPollutionColor(region.value, maxValue);
      const size = 20 + (region.value / maxValue) * 30; // Scale marker size

      // Create marker element
      const markerElement = document.createElement('div');
      markerElement.className = 'pollution-marker';
      markerElement.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 10px;
        font-weight: bold;
      `;
      markerElement.textContent = region.value.toFixed(1);

      // Create popup
      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-2">
          <h3 class="font-semibold text-sm">${region.name}</h3>
          <p class="text-sm text-gray-600">${getPollutantDisplayName(pollutant)}</p>
          <p class="text-lg font-bold" style="color: ${color}">${region.value.toFixed(2)} ${unit}</p>
          <p class="text-xs text-gray-500">Year: ${year}</p>
        </div>
      `);

      // Create and add marker
      const marker = new mapboxgl.Marker(markerElement)
        .setLngLat(coordinates)
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [data, pollutant, year, unit]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pollution Map</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {getPollutantDisplayName(pollutant)} Distribution Map ({year})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div ref={mapContainer} className="h-[400px] w-full rounded-lg" />
          
          {/* Legend */}
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span>Low</span>
            <div className="flex space-x-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#32CD32' }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFD700' }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFA500' }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF4500' }}></div>
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#8B0000' }}></div>
            </div>
            <span>High</span>
          </div>
          
          {loading && (
            <div className="text-center text-muted-foreground">
              Loading map data...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
