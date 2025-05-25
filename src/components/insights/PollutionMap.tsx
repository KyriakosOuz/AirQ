
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
  const [mapLoaded, setMapLoaded] = useState(false);

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

  // Validate data before processing
  const isValidData = (data: any): data is Array<{ name: string; value: number }> => {
    return Array.isArray(data) && data.length > 0 && data.every(item => 
      item && 
      typeof item === 'object' && 
      typeof item.name === 'string' && 
      typeof item.value === 'number' && 
      !isNaN(item.value)
    );
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

    // Set map loaded flag when style is loaded
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  // Update pollution areas when data changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log('Map update effect triggered with data:', data);

    // Remove existing sources and layers
    if (map.current.getSource('pollution-data')) {
      if (map.current.getLayer('pollution-circles')) {
        map.current.removeLayer('pollution-circles');
      }
      if (map.current.getLayer('pollution-labels')) {
        map.current.removeLayer('pollution-labels');
      }
      map.current.removeSource('pollution-data');
    }

    // Validate data before proceeding
    if (!isValidData(data)) {
      console.log('Invalid or empty data, skipping map update:', data);
      return;
    }

    try {
      const maxValue = Math.max(...data.map(d => d.value));

      // Prepare GeoJSON data with proper typing
      const features = data.map(region => {
        const regionKey = region.name.toLowerCase().replace(/\s+/g, '-');
        const coordinates = REGION_COORDINATES[regionKey];
        
        if (!coordinates) {
          console.warn(`No coordinates found for region: ${region.name}`);
          return null;
        }

        return {
          type: "Feature" as const,
          properties: {
            name: region.name,
            value: region.value,
            color: getPollutionColor(region.value, maxValue),
            intensity: region.value / maxValue
          },
          geometry: {
            type: "Point" as const,
            coordinates: coordinates
          }
        };
      }).filter((feature): feature is NonNullable<typeof feature> => feature !== null);

      if (features.length === 0) {
        console.log('No valid features found for mapping');
        return;
      }

      const geojsonData = {
        type: "FeatureCollection" as const,
        features: features
      };

      console.log('Adding map data with features:', features.length);

      // Add source
      map.current.addSource('pollution-data', {
        type: 'geojson',
        data: geojsonData
      });

      // Add circle layer for pollution areas with larger, more visible circles
      map.current.addLayer({
        id: 'pollution-circles',
        type: 'circle',
        source: 'pollution-data',
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'intensity'],
            0, 15,
            1, 40
          ],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.7,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-opacity': 1
        }
      });

      // Add label layer
      map.current.addLayer({
        id: 'pollution-labels',
        type: 'symbol',
        source: 'pollution-data',
        layout: {
          'text-field': ['concat', ['to-string', ['get', 'value']], ` ${unit}`],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': 14,
          'text-anchor': 'center',
          'text-offset': [0, 0]
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 2
        }
      });

      // Add click event for popups
      map.current.on('click', 'pollution-circles', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const feature = e.features[0];
        const geometry = feature.geometry;
        
        // Type guard to ensure we have Point geometry
        if (geometry.type !== 'Point') return;
        
        const coordinates = geometry.coordinates.slice() as [number, number];
        const { name, value } = feature.properties || {};

        if (!name || value === undefined) return;

        // Create popup
        new mapboxgl.Popup()
          .setLngLat(coordinates)
          .setHTML(`
            <div class="p-3">
              <h3 class="font-semibold text-sm mb-1">${name}</h3>
              <p class="text-sm text-gray-600 mb-1">${getPollutantDisplayName(pollutant)}</p>
              <p class="text-lg font-bold mb-1" style="color: ${getPollutionColor(value, maxValue)}">${Number(value).toFixed(2)} ${unit}</p>
              <p class="text-xs text-gray-500">Year: ${year}</p>
            </div>
          `)
          .addTo(map.current!);
      });

      // Add hover effects
      map.current.on('mouseenter', 'pollution-circles', () => {
        map.current!.getCanvas().style.cursor = 'pointer';
      });

      map.current.on('mouseleave', 'pollution-circles', () => {
        map.current!.getCanvas().style.cursor = '';
      });

    } catch (error) {
      console.error('Error updating map data:', error);
    }

  }, [data, pollutant, year, unit, mapLoaded]);

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
          
          {/* Enhanced Legend */}
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-4 text-sm">
              <span>Low</span>
              <div className="flex space-x-1">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#32CD32' }}></div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FFD700' }}></div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FFA500' }}></div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#FF4500' }}></div>
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#8B0000' }}></div>
              </div>
              <span>High</span>
            </div>
            <div className="text-center text-xs text-muted-foreground">
              Circle size and color represent pollution intensity. Click on areas for details.
            </div>
          </div>
          
          {loading && (
            <div className="text-center text-muted-foreground">
              Loading map data...
            </div>
          )}

          {!loading && !isValidData(data) && (
            <div className="text-center text-muted-foreground">
              No pollution data available for mapping
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
