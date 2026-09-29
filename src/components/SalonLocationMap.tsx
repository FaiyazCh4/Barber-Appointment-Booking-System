import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink, Scissors } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Precise location of George Davis Hairdressing: 14 St John Street, Bromsgrove, Worcestershire B61 8QY
const SALON_COORDINATES = { lat: 52.33534, lng: -2.06198 };

// Bespoke dark theme map styles matching George Davis Hairdressing charcoal & warm gold palette
const DARK_SALON_MAP_STYLES: google.maps.MapTypeStyle[] = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#161513' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#161513' }, { lightness: -20 }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#A69B8D' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#D9D1C5' }, { weight: 1.5 }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8C8273' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#1A211B' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6A806E' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#252320' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1C1A17' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9B9184' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#3A342B' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#2B2620' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#BFA57D' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#201D1A' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#8C8273' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#111722' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#4B5E78' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#111722' }],
  },
];

export const SalonLocationMap: React.FC = () => {
  const [infoOpen, setInfoOpen] = useState(true);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="aspect-[16/9] w-full bg-[#141414] border border-[#2B2925] rounded-sm p-8 flex flex-col items-center justify-center text-center space-y-3">
        <MapPin className="w-8 h-8 text-[#9B8058]" />
        <p className="text-sm text-[#F5F1EA] font-serif-heading">George Davis Hairdressing</p>
        <p className="text-xs text-[#A69B8D] max-w-sm">
          14 St John Street, Bromsgrove, Worcestershire B61 8QY
        </p>
        <a
          href="https://maps.app.goo.gl/jbP1sHY4TQzf17aJ8"
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs font-semibold text-[#141414] bg-[#9B8058] hover:bg-[#856C47] px-4 py-2 rounded-sm transition-colors inline-flex items-center gap-1.5"
        >
          <span>Open in Google Maps</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      <div className="aspect-[16/9] w-full rounded-sm overflow-hidden border border-[#2E2820] shadow-md relative bg-[#141414]">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={SALON_COORDINATES}
            defaultZoom={17}
            mapId="DEMO_MAP_ID"
            styles={DARK_SALON_MAP_STYLES}
            gestureHandling="cooperative"
            disableDefaultUI={false}
            zoomControl={true}
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={true}
            className="w-full h-full"
            {...({ internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'] } as any)}
          >
            <AdvancedMarker
              position={SALON_COORDINATES}
              onClick={() => setInfoOpen(true)}
              title="George Davis Hairdressing - 14 St John Street, Bromsgrove"
            >
              <Pin
                background="#9B8058"
                borderColor="#141414"
                glyphColor="#141414"
                scale={1.15}
              />
            </AdvancedMarker>

            {infoOpen && (
              <InfoWindow
                position={SALON_COORDINATES}
                onCloseClick={() => setInfoOpen(false)}
                pixelOffset={[0, -38]}
                headerContent={
                  <div className="flex items-center gap-1.5 text-[#141414] font-semibold text-xs pr-2">
                    <Scissors className="w-3.5 h-3.5 text-[#9B8058]" />
                    <span>George Davis Hairdressing</span>
                  </div>
                }
              >
                <div className="text-[11px] text-[#2C2824] space-y-1.5 pt-0.5 max-w-[220px]">
                  <p className="leading-snug">
                    14 St John Street, Bromsgrove, Worcestershire B61 8QY
                  </p>
                  <p className="text-[10px] text-[#706456]">
                    Opposite St John's Church · Crown Close car parks nearby
                  </p>
                  <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-[#E5E0D8]">
                    <a
                      href="https://www.google.com/maps/dir/?api=1&destination=14+St+John+Street,+Bromsgrove+B61+8QY"
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 font-semibold text-[11px] text-[#9B8058] hover:text-[#7A6443] transition-colors"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Directions</span>
                    </a>
                    <a
                      href="tel:+441527577000"
                      className="font-mono text-[11px] text-[#2C2824] hover:text-[#9B8058] transition-colors"
                    >
                      01527 577000
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-[#8C8273] gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#9B8058]" />
          <span>Interactive Dark Mode Navigation · Zoom & Drag to Explore</span>
        </div>
        <a
          href="https://www.google.com/maps/dir/?api=1&destination=14+St+John+Street,+Bromsgrove+B61+8QY"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[#BFA57D] hover:underline inline-flex items-center gap-1 font-medium"
        >
          <Navigation className="w-3 h-3" />
          <span>Get Turn-by-Turn Directions</span>
        </a>
      </div>
    </div>
  );
};
