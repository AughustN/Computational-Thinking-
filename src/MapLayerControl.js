import React, { useEffect } from 'react';
import { TileLayer, LayersControl, LayerGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import './css/MapLayerControl.css';

const { BaseLayer } = LayersControl;
const GOONG_API_KEY = 'WOXLNJwS4RZLxLmxLGKTa4gu0p8UrBKcRBOg1Xqy';
const GOONG_MAPTILES_KEY = 'w6UXzsXLNcwmP5pRQdbHALGm2jK3nxj8OhNrJlQY';

/**
 * Goong Map Vector Layer Component
 */
function GoongVector({ styleUrl, name }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !window.L.maplibreGL) {
            console.warn('MapLibre GL not loaded');
            return;
        }

        const vectorLayer = L.maplibreGL({
            style: styleUrl,
            attribution: '&copy; <a href="https://goong.io">Goong</a>'
        });

        vectorLayer.addTo(map);

        return () => {
            if (map.hasLayer(vectorLayer)) {
                map.removeLayer(vectorLayer);
            }
        };
    }, [map, styleUrl]);

    return null;
}

/**
 * MapLayerControl - Component để chuyển đổi giữa các loại bản đồ
 * Hỗ trợ: Goong Map Vector, Raster, Satellite, Terrain
 */
function MapLayerControl() {
    console.log('MapLayerControl rendered');

    return (
        <LayersControl position="topright">
            {/* Goong Map - Raster (Default - Always works) */}
            <BaseLayer checked name="🗺️ Goong Map">
                <TileLayer
                    attribution='&copy; <a href="https://goong.io">Goong</a>'
                    url={`https://tiles.goong.io/{z}/{x}/{y}.png?api_key=${GOONG_MAPTILES_KEY}`}
                    maxZoom={20}
                />
            </BaseLayer>

            {/* Goong Vector - Default */}
            <BaseLayer name="🗺️ Goong Vector">
                <GoongVector 
                    styleUrl={`https://tiles.goong.io/assets/goong_map_web.json?api_key=${GOONG_MAPTILES_KEY}`}
                    name="Goong Vector"
                />
            </BaseLayer>

            {/* Goong Light V2 */}
            <BaseLayer name="☀️ Goong Light">
                <GoongVector 
                    styleUrl={`https://tiles.goong.io/assets/goong_light_v2.json?api_key=${GOONG_MAPTILES_KEY}`}
                    name="Goong Light"
                />
            </BaseLayer>

            {/* Goong Dark */}
            <BaseLayer name="🌙 Goong Dark">
                <GoongVector 
                    styleUrl={`https://tiles.goong.io/assets/goong_map_dark.json?api_key=${GOONG_MAPTILES_KEY}`}
                    name="Goong Dark"
                />
            </BaseLayer>

            {/* Goong Navigation Day */}
            <BaseLayer name="🚗 Navigation Day">
                <GoongVector 
                    styleUrl={`https://tiles.goong.io/assets/navigation_day.json?api_key=${GOONG_MAPTILES_KEY}`}
                    name="Navigation Day"
                />
            </BaseLayer>

            {/* Goong Navigation Night */}
            <BaseLayer name="🌃 Navigation Night">
                <GoongVector 
                    styleUrl={`https://tiles.goong.io/assets/navigation_night.json?api_key=${GOONG_MAPTILES_KEY}`}
                    name="Navigation Night"
                />
            </BaseLayer>

            {/* Satellite - Map vệ tinh */}
            <BaseLayer name="🛰️ Vệ tinh">
                <TileLayer
                    attribution='Tiles &copy; Esri'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                />
            </BaseLayer>
        </LayersControl>
    );
}

export default MapLayerControl;
