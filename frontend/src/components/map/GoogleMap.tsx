import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';

export function MapComponent() {
  // Dongtan Station coordinates
  const dongtanCenter = { lat: 37.199493, lng: 127.096503 };

  return (
    <Map
      defaultCenter={dongtanCenter}
      defaultZoom={15}
      style={{
        width: '100%',
        height: '100vh',
      }}
      mapId="DEMO_MAP_ID" // Required for AdvancedMarker
      disableDefaultUI={true}
    >
      <AdvancedMarker position={dongtanCenter} />
    </Map>
  );
}
