import React, { useEffect, useRef, useState } from 'react';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';
import GoongMapStyleControl from './GoongMapStyleControl';

const GOONG_API_KEY = 'w6UXzsXLNcwmP5pRQdbHALGm2jK3nxj8OhNrJlQY';
const GOONG_MAPTILES_KEY = 'WOh4DfxBHRZhUMufKtHKj4qXFb2RZu2vlatKPJpH';

function GoongBusMap({ selectPosition, style = 'goong_map_web', userLocation }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const userMarkerRef = useRef(null);
  
  // Convert style ID to URL
  const getStyleUrl = (styleId) => {
    return `https://tiles.goong.io/assets/${styleId}.json`;
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    goongjs.accessToken = GOONG_API_KEY;

    const map = new goongjs.Map({
      container: mapContainerRef.current,
      style: getStyleUrl(style),
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
    
    // Remove markers before style change
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    
    mapRef.current.setStyle(getStyleUrl(style));
    
    // Re-add markers after style loads
    mapRef.current.once('styledata', () => {
      if (selectPosition) {
        const { lat, lon } = selectPosition;
        const marker = new goongjs.Marker({ color: '#0277BD' })
          .setLngLat([lon, lat])
          .addTo(mapRef.current);
        markerRef.current = marker;
      }
      if (userLocation) {
        const userMarker = new goongjs.Marker({ color: '#4285F4' })
          .setLngLat([userLocation.lon, userLocation.lat])
          .addTo(mapRef.current);
        userMarkerRef.current = userMarker;
      }
    });
  }, [style, selectPosition, userLocation]);

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

  // Handle user location
  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    // Remove old user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Add marker with default style (blue color for user location)
    const marker = new goongjs.Marker({ color: '#4285F4' })
      .setLngLat([userLocation.lon, userLocation.lat])
      .setPopup(
        new goongjs.Popup({ offset: 25 }).setHTML(
          '<div style="padding: 8px;"><strong>Vị trí của bạn</strong></div>'
        )
      )
      .addTo(mapRef.current);

    userMarkerRef.current = marker;

    // Fly to user location
    mapRef.current.flyTo({
      center: [userLocation.lon, userLocation.lat],
      zoom: 15,
      duration: 1500
    });
  }, [userLocation]);

  return (
    <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
  );
}

export default GoongBusMap;
