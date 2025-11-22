import React, { useEffect, useRef, useState } from 'react';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

const GOONG_MAPTILES_KEY = 'w6UXzsXLNcwmP5pRQdbHALGm2jK3nxj8OhNrJlQY';

goongjs.accessToken = GOONG_MAPTILES_KEY;

function GoongMap({ origin, destination, coords, style = 'goong_map_web', userLocation }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // Markers refs
  const startMarker = useRef(null);
  const endMarker = useRef(null);
  const userMarker = useRef(null);
  const routeLayer = useRef(null);

  // Initialize map
  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new goongjs.Map({
      container: mapContainer.current,
      style: `https://tiles.goong.io/assets/${style}.json`,
      center: [106.6297, 10.8231], // HCM City
      zoom: 12
    });

    // Add navigation controls
    map.current.addControl(new goongjs.NavigationControl(), 'top-right');

    // Add scale control
    map.current.addControl(new goongjs.ScaleControl({
      maxWidth: 100,
      unit: 'metric'
    }), 'bottom-left');

    map.current.on('load', () => {
      setMapLoaded(true);
      console.log('✅ Goong Map loaded');
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [style]);

  // Update origin marker
  useEffect(() => {
    if (!mapLoaded || !map.current || !origin) return;

    // Remove old marker
    if (startMarker.current) {
      startMarker.current.remove();
    }

    // Add new marker
    startMarker.current = new goongjs.Marker({ color: '#4CAF50' })
      .setLngLat([origin.lon, origin.lat])
      .setPopup(
        new goongjs.Popup().setHTML(
          `<strong>Điểm bắt đầu</strong><br/>${origin.name || 'Vị trí xuất phát'}`
        )
      )
      .addTo(map.current);

  }, [mapLoaded, origin]);

  // Update destination marker
  useEffect(() => {
    if (!mapLoaded || !map.current || !destination) return;

    // Remove old marker
    if (endMarker.current) {
      endMarker.current.remove();
    }

    // Add new marker
    endMarker.current = new goongjs.Marker({ color: '#F44336' })
      .setLngLat([destination.lon, destination.lat])
      .setPopup(
        new goongjs.Popup().setHTML(
          `<strong>Điểm đến</strong><br/>${destination.name || 'Đích đến'}`
        )
      )
      .addTo(map.current);

  }, [mapLoaded, destination]);

  // Update route
  useEffect(() => {
    if (!mapLoaded || !map.current || !coords || coords.length === 0) return;

    // Remove old route
    if (map.current.getLayer('route')) {
      map.current.removeLayer('route');
    }
    if (map.current.getSource('route')) {
      map.current.removeSource('route');
    }

    // Convert coords to GeoJSON
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: coords.map(c => [c.lon, c.lat])
      }
    };

    // Add route source and layer
    map.current.addSource('route', {
      type: 'geojson',
      data: geojson
    });

    map.current.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': '#0277BD',
        'line-width': 5,
        'line-opacity': 0.7
      }
    });

    // Fit bounds to show entire route
    const bounds = new goongjs.LngLatBounds();
    coords.forEach(c => bounds.extend([c.lon, c.lat]));
    map.current.fitBounds(bounds, { padding: 50 });

  }, [mapLoaded, coords]);

  // Fit bounds when origin/destination change
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    if (coords && coords.length > 0) {
      // Route exists, fitBounds handled in route effect
      return;
    }

    if (origin && destination) {
      const bounds = new goongjs.LngLatBounds();
      bounds.extend([origin.lon, origin.lat]);
      bounds.extend([destination.lon, destination.lat]);
      map.current.fitBounds(bounds, { padding: 50 });
    } else if (origin) {
      map.current.flyTo({ center: [origin.lon, origin.lat], zoom: 14 });
    } else if (destination) {
      map.current.flyTo({ center: [destination.lon, destination.lat], zoom: 14 });
    }
  }, [mapLoaded, origin, destination, coords]);

  // Handle user location
  useEffect(() => {
    if (!mapLoaded || !map.current || !userLocation) return;

    // Remove old user marker
    if (userMarker.current) {
      userMarker.current.remove();
    }

    // Add marker with default style (blue color for user location)
    const marker = new goongjs.Marker({ color: '#4285F4' })
      .setLngLat([userLocation.lon, userLocation.lat])
      .setPopup(
        new goongjs.Popup({ offset: 25 }).setHTML(
          '<div style="padding: 8px;"><strong>Vị trí của bạn</strong></div>'
        )
      )
      .addTo(map.current);

    userMarker.current = marker;

    // Fly to user location
    map.current.flyTo({
      center: [userLocation.lon, userLocation.lat],
      zoom: 15,
      duration: 1500
    });

  }, [mapLoaded, userLocation]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default GoongMap;
