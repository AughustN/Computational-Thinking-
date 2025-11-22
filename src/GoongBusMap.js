import React, { useEffect, useRef, useState } from 'react';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';
import GoongMapStyleControl from './GoongMapStyleControl';

const GOONG_API_KEY = 'w6UXzsXLNcwmP5pRQdbHALGm2jK3nxj8OhNrJlQY';
const GOONG_MAPTILES_KEY = 'WOh4DfxBHRZhUMufKtHKj4qXFb2RZu2vlatKPJpH';

function GoongBusMap({ selectPosition }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapStyle, setMapStyle] = useState('goong_map_web');
  
  // Convert style ID to URL
  const getStyleUrl = (styleId) => {
    return `https://tiles.goong.io/assets/${styleId}.json`;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    goongjs.accessToken = GOONG_API_KEY;

    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: getStyleUrl(mapStyle),
      center: [106.660172, 10.762622],
      zoom: 13,
      pitch: 0,
      bearing: 0
    });

    map.addControl(new goongjs.NavigationControl(), 'top-right');
    map.addControl(new goongjs.FullscreenControl(), 'top-right');

    mapRef.current = map;

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
      map.remove();
    };
  }, []);

  // Update map style when changed
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Remove marker before style change
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    
    mapRef.current.setStyle(getStyleUrl(mapStyle));
    
    // Re-add marker after style loads if position exists
    if (selectPosition) {
      mapRef.current.once('styledata', () => {
        const { lat, lon } = selectPosition;
        const marker = new goongjs.Marker({ color: '#0277BD' })
          .setLngLat([lon, lat])
          .addTo(mapRef.current);
        markerRef.current = marker;
      });
    }
  }, [mapStyle, selectPosition]);

  // Update marker position (separate from style changes)
  useEffect(() => {
    if (!mapRef.current || !selectPosition) return;

    const { lat, lon } = selectPosition;

    // Wait for map to be ready
    const updateMarker = () => {
      // Remove old marker
      if (markerRef.current) {
        markerRef.current.remove();
      }

      // Add new marker
      const marker = new goongjs.Marker({ color: '#0277BD' })
        .setLngLat([lon, lat])
        .addTo(mapRef.current);

      markerRef.current = marker;

      // Fly to position
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 15,
        duration: 1500
      });
    };

    if (mapRef.current.isStyleLoaded()) {
      updateMarker();
    } else {
      mapRef.current.once('styledata', updateMarker);
    }
  }, [selectPosition]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <GoongMapStyleControl 
        currentStyle={mapStyle}
        onStyleChange={setMapStyle}
      />
    </div>
  );
}

export default GoongBusMap;
