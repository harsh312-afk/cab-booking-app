import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Car,
  Compass,
  AlertCircle,
  Sparkles,
  Zap
} from 'lucide-react';

// Preset popular locations for quick selection
const POPULAR_HUBS = [
  { name: 'Downtown Central Square', lat: 12.9716, lng: 77.5946 },
  { name: 'International Airport Hub', lat: 13.1986, lng: 77.7066 },
  { name: 'Tech Innovation Park', lat: 12.9279, lng: 77.6271 },
  { name: 'Central Railway Terminal', lat: 12.9781, lng: 77.5696 },
  { name: 'Grand Metro Shopping Mall', lat: 12.9352, lng: 77.6145 },
  { name: 'City Hospital & Medical Care', lat: 12.9915, lng: 77.5857 }
];

const VEHICLE_TIERS = [
  {
    id: 'auto',
    name: 'Auto Quick',
    desc: '3-wheeler, fast in traffic',
    base: 2.5,
    perKm: 0.8,
    eta: '3 mins away',
    capacity: '3 seats',
    icon: '🛺'
  },
  {
    id: 'economy',
    name: 'Economy Mini',
    desc: 'Budget-friendly hatchback',
    base: 3.5,
    perKm: 1.1,
    eta: '4 mins away',
    capacity: '4 seats',
    icon: '🚗'
  },
  {
    id: 'comfort',
    name: 'Comfort Sedan',
    desc: 'Air-conditioned smooth ride',
    base: 5.0,
    perKm: 1.4,
    eta: '2 mins away',
    capacity: '4 seats',
    icon: '🚘'
  },
  {
    id: 'suv',
    name: 'SUV XL',
    desc: 'Spacious 6-seater for groups',
    base: 7.5,
    perKm: 1.9,
    eta: '6 mins away',
    capacity: '6 seats',
    icon: '🚙'
  },
  {
    id: 'premium',
    name: 'Luxury Premium',
    desc: 'Top-rated drivers & luxury cars',
    base: 10.0,
    perKm: 2.5,
    eta: '5 mins away',
    capacity: '4 seats',
    icon: '✨'
  }
];

const calculateHaversineKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.max(1.0, Math.round(R * c * 10) / 10);
};

const BookRide = () => {
  const [pickup, setPickup] = useState({
    lat: 12.9716,
    lng: 77.5946,
    address: 'Downtown Central Square'
  });
  const [dropoff, setDropoff] = useState({
    lat: 12.9352,
    lng: 77.6145,
    address: 'Grand Metro Shopping Mall'
  });
  const [selectedVehicle, setSelectedVehicle] = useState('comfort');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [clickTarget, setClickTarget] = useState('pickup'); // 'pickup' or 'dropoff'

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({ pickup: null, dropoff: null, polyline: null });
  const navigate = useNavigate();

  const distance = calculateHaversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng);
  const currentTier = VEHICLE_TIERS.find((t) => t.id === selectedVehicle) || VEHICLE_TIERS[2];
  const estimatedFare = (currentTier.base + distance * currentTier.perKm).toFixed(2);
  const estimatedDuration = Math.round(distance * 3 + 5);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Fix default Leaflet icon paths
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
      });

      const map = L.map(mapContainerRef.current).setView([pickup.lat, pickup.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        const roundedLat = parseFloat(lat.toFixed(5));
        const roundedLng = parseFloat(lng.toFixed(5));

        if (clickTarget === 'pickup') {
          setPickup({
            lat: roundedLat,
            lng: roundedLng,
            address: `Pin @ ${roundedLat}, ${roundedLng}`
          });
          setClickTarget('dropoff'); // automatically switch to setting dropoff next
        } else {
          setDropoff({
            lat: roundedLat,
            lng: roundedLng,
            address: `Pin @ ${roundedLat}, ${roundedLng}`
          });
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = { pickup: null, dropoff: null, polyline: null };
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update Markers & Polyline when coordinates change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Pickup Custom Marker
    const pickupIcon = L.divIcon({
      className: 'custom-map-pin pickup-pin',
      html: `<div class="pin-badge pin-green"><span>A</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    // Dropoff Custom Marker
    const dropoffIcon = L.divIcon({
      className: 'custom-map-pin dropoff-pin',
      html: `<div class="pin-badge pin-red"><span>B</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    if (markersRef.current.pickup) {
      markersRef.current.pickup.setLatLng([pickup.lat, pickup.lng]);
    } else {
      markersRef.current.pickup = L.marker([pickup.lat, pickup.lng], {
        icon: pickupIcon,
        draggable: true
      })
        .addTo(map)
        .bindPopup('<b>Pickup Location</b><br>' + pickup.address);

      markersRef.current.pickup.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setPickup({
          lat: parseFloat(lat.toFixed(5)),
          lng: parseFloat(lng.toFixed(5)),
          address: `Pinned Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`
        });
      });
    }

    if (markersRef.current.dropoff) {
      markersRef.current.dropoff.setLatLng([dropoff.lat, dropoff.lng]);
    } else {
      markersRef.current.dropoff = L.marker([dropoff.lat, dropoff.lng], {
        icon: dropoffIcon,
        draggable: true
      })
        .addTo(map)
        .bindPopup('<b>Dropoff Location</b><br>' + dropoff.address);

      markersRef.current.dropoff.on('dragend', (e) => {
        const { lat, lng } = e.target.getLatLng();
        setDropoff({
          lat: parseFloat(lat.toFixed(5)),
          lng: parseFloat(lng.toFixed(5)),
          address: `Pinned Location (${lat.toFixed(3)}, ${lng.toFixed(3)})`
        });
      });
    }

    // Polyline connecting A to B
    const latlngs = [
      [pickup.lat, pickup.lng],
      [dropoff.lat, dropoff.lng]
    ];

    if (markersRef.current.polyline) {
      markersRef.current.polyline.setLatLngs(latlngs);
    } else {
      markersRef.current.polyline = L.polyline(latlngs, {
        color: '#2563eb',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8
      }).addTo(map);
    }

    // Fit map bounds to show both pins
    const bounds = L.latLngBounds([pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [pickup, dropoff]);

  // Use Current Geolocation
  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(5));
          const lng = parseFloat(pos.coords.longitude.toFixed(5));
          setPickup({
            lat,
            lng,
            address: 'My Current GPS Location'
          });
        },
        (err) => {
          setError('Unable to retrieve GPS location: ' + err.message);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/rides/request', {
        pickup: {
          coordinates: [parseFloat(pickup.lng), parseFloat(pickup.lat)],
          address: pickup.address
        },
        dropoff: {
          coordinates: [parseFloat(dropoff.lng), parseFloat(dropoff.lat)],
          address: dropoff.address
        },
        vehicleType: selectedVehicle,
        paymentMethod
      });

      setLoading(false);
      navigate(`/rides/${res.data._id}`);
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to book ride');
    }
  };

  return (
    <div className="book-ride-page">
      <div className="booking-layout-grid">
        {/* Left Side: Booking Form & Controls */}
        <div className="booking-sidebar">
          <div className="booking-header">
            <h2>Book Your Ride</h2>
            <p>Select locations on map or choose popular city hubs</p>
          </div>

          {error && (
            <div className="alert-box error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="booking-form">
            {/* Location Selector Tabs */}
            <div className="map-mode-indicator">
              <span className="mode-label">Click map to set:</span>
              <div className="mode-btns">
                <button
                  type="button"
                  className={`mode-btn ${clickTarget === 'pickup' ? 'active-green' : ''}`}
                  onClick={() => setClickTarget('pickup')}
                >
                  <MapPin size={14} /> Pickup (A)
                </button>
                <button
                  type="button"
                  className={`mode-btn ${clickTarget === 'dropoff' ? 'active-red' : ''}`}
                  onClick={() => setClickTarget('dropoff')}
                >
                  <MapPin size={14} /> Dropoff (B)
                </button>
              </div>
            </div>

            {/* Pickup Input */}
            <div className="location-input-group">
              <div className="loc-bullet pickup-bullet"></div>
              <div className="loc-field">
                <div className="loc-label-row">
                  <label>Pickup Location</label>
                  <button
                    type="button"
                    className="btn-text-gps"
                    onClick={handleUseCurrentLocation}
                  >
                    <Compass size={12} /> Use GPS
                  </button>
                </div>
                <input
                  type="text"
                  value={pickup.address}
                  onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                  placeholder="Enter pickup address or click map"
                  required
                />
              </div>
            </div>

            {/* Dropoff Input */}
            <div className="location-input-group">
              <div className="loc-bullet dropoff-bullet"></div>
              <div className="loc-field">
                <label>Dropoff Destination</label>
                <input
                  type="text"
                  value={dropoff.address}
                  onChange={(e) => setDropoff({ ...dropoff, address: e.target.value })}
                  placeholder="Enter destination address or click map"
                  required
                />
              </div>
            </div>

            {/* Quick Hub Presets */}
            <div className="quick-hubs-container">
              <span className="hubs-title">
                <Sparkles size={14} /> Popular Destinations:
              </span>
              <div className="hubs-scroll">
                {POPULAR_HUBS.map((hub) => (
                  <button
                    key={hub.name}
                    type="button"
                    className="hub-chip"
                    onClick={() => {
                      setDropoff({
                        lat: hub.lat,
                        lng: hub.lng,
                        address: hub.name
                      });
                    }}
                  >
                    {hub.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Vehicle Selection Cards */}
            <div className="vehicle-selection-section">
              <label className="section-label">Select Vehicle Category</label>
              <div className="vehicle-options-list">
                {VEHICLE_TIERS.map((tier) => {
                  const tierFare = (tier.base + distance * tier.perKm).toFixed(2);
                  const isSelected = selectedVehicle === tier.id;

                  return (
                    <div
                      key={tier.id}
                      className={`vehicle-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedVehicle(tier.id)}
                    >
                      <div className="vehicle-icon-box">{tier.icon}</div>
                      <div className="vehicle-details">
                        <div className="vehicle-name-row">
                          <strong>{tier.name}</strong>
                          <span className="vehicle-fare">${tierFare}</span>
                        </div>
                        <div className="vehicle-meta-row">
                          <span>{tier.desc}</span>
                          <span className="vehicle-eta">{tier.eta}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trip Summary & Fare Card */}
            <div className="trip-summary-box">
              <div className="summary-row">
                <span>Distance</span>
                <strong>{distance} km</strong>
              </div>
              <div className="summary-row">
                <span>Estimated Time</span>
                <strong>~{estimatedDuration} mins</strong>
              </div>
              <div className="summary-row">
                <span>Payment Method</span>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="payment-select"
                >
                  <option value="card">💳 Credit / Debit Card</option>
                  <option value="cash">💵 Cash to Driver</option>
                  <option value="wallet">👛 Digital Wallet</option>
                  <option value="upi">⚡ Instant UPI</option>
                </select>
              </div>
              <div className="summary-row total-row">
                <span>Total Estimated Fare</span>
                <span className="total-price">${estimatedFare}</span>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full large-btn" disabled={loading}>
              <Car size={20} />
              <span>{loading ? 'Requesting Captain...' : `Confirm & Request Ride ($${estimatedFare})`}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Interactive Map */}
        <div className="map-view-container">
          <div ref={mapContainerRef} className="leaflet-map-element" />
          <div className="map-overlay-badge">
            <Zap size={14} />
            <span>Interactive Map: Click anywhere or drag pins to adjust route</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookRide;
