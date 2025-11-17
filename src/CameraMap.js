import React, { useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './CameraMap.css';
import MapLayerControl from './MapLayerControl';

// Import camera locations
import cameraLocations from './camera_locations.json';

// API Base URL
const API_BASE_URL = 'https://api.hcmus.fit';

// Custom camera icon
const cameraIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#2196F3">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Component to handle map centering
function MapCenter({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, 13);
    }
  }, [center, map]);
  
  return null;
}

// Component to display camera images
function CameraPopup({ cameraId, cameraName }) {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load images from camera_frames folder via API
    const loadImages = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch images from API
        const response = await fetch(`${API_BASE_URL}/api/camera/${cameraId}/images`);
        
        if (!response.ok) {
          throw new Error('Failed to load images');
        }
        
        const data = await response.json();
        
        if (data.images && data.images.length > 0) {
          // Convert to full URLs
          const imageUrls = data.images.map(img => 
            `${API_BASE_URL}${img.url}`
          );
          setImages(imageUrls);
        } else {
          setImages([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading images:', err);
        setError('Không thể tải ảnh camera');
        setLoading(false);
      }
    };

    loadImages();
  }, [cameraId]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="camera-popup">
      <h3>{cameraName}</h3>
      <div className="camera-id">ID: {cameraId}</div>
      
      {loading && <div className="loading">Đang tải ảnh...</div>}
      
      {error && <div className="error">{error}</div>}
      
      {!loading && !error && images.length > 0 && (
        <div className="image-viewer">
          <img 
            src={images[currentImageIndex]} 
            alt={`Camera ${cameraName}`}
            className="camera-image"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200">
                  <rect width="300" height="200" fill="#f0f0f0"/>
                  <text x="150" y="100" text-anchor="middle" font-family="Arial" font-size="16" fill="#999">
                    Không có ảnh
                  </text>
                </svg>
              `);
            }}
          />
          
          {images.length > 1 && (
            <div className="image-controls">
              <button onClick={prevImage} className="nav-button">‹</button>
              <span className="image-counter">
                {currentImageIndex + 1} / {images.length}
              </span>
              <button onClick={nextImage} className="nav-button">›</button>
            </div>
          )}
        </div>
      )}
      
      {!loading && !error && images.length === 0 && (
        <div className="no-images">Không có ảnh cho camera này</div>
      )}
    </div>
  );
}

function CameraMap() {
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.762622, 106.660172]); // Ho Chi Minh City center
  const [searchTerm, setSearchTerm] = useState('');
  
  // Convert camera locations to array - useMemo to avoid recreating on every render
  const cameras = React.useMemo(() => {
    return Object.entries(cameraLocations)
      .filter(([id, data]) => data.lat !== null && data.lon !== null) // Filter out cameras without coordinates
      .map(([id, data]) => ({
        id,
        ...data
      }));
  }, []);
  
  const [filteredCameras, setFilteredCameras] = useState(cameras);

  useEffect(() => {
    // Filter cameras based on search term
    if (searchTerm.trim() === '') {
      setFilteredCameras(cameras);
    } else {
      const filtered = cameras.filter(camera => {
        const cameraName = camera.camera_name || '';
        const displayName = camera.display_name || '';
        const searchLower = searchTerm.toLowerCase();
        
        return cameraName.toLowerCase().includes(searchLower) ||
               displayName.toLowerCase().includes(searchLower);
      });
      setFilteredCameras(filtered);
    }
  }, [searchTerm, cameras]);

  const handleCameraClick = (camera) => {
    setSelectedCamera(camera);
    setMapCenter([camera.lat, camera.lon]);
  };

  return (
    <div className="camera-map-container">
      <div className="map-header">
        <h1>Bản đồ Camera Giao thông TP.HCM</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm camera theo tên hoặc địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="camera-count">
            Hiển thị {filteredCameras.length} / {cameras.length} camera
          </div>
        </div>
      </div>

      <div className="map-wrapper">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <MapLayerControl />
          
          <MapCenter center={mapCenter} />

          {filteredCameras.map((camera) => (
            camera.lat && camera.lon && (
              <Marker
                key={camera.id}
                position={[camera.lat, camera.lon]}
                icon={cameraIcon}
                eventHandlers={{
                  click: () => handleCameraClick(camera)
                }}
              >
                <Popup maxWidth={400} minWidth={300}>
                  <CameraPopup 
                    cameraId={camera.id} 
                    cameraName={camera.camera_name}
                  />
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {selectedCamera && (
        <div className="camera-info-panel">
          <button 
            className="close-button"
            onClick={() => setSelectedCamera(null)}
          >
            ×
          </button>
          <h3>{selectedCamera.camera_name}</h3>
          <p><strong>Địa điểm:</strong> {selectedCamera.display_name}</p>
          <p><strong>Tọa độ:</strong> {selectedCamera.lat.toFixed(6)}, {selectedCamera.lon.toFixed(6)}</p>
        </div>
      )}
    </div>
  );
}

export default CameraMap;