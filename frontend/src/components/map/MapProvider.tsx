'use client';

import { APIProvider } from '@vis.gl/react-google-maps';
import { MapComponent } from './GoogleMap';

export default function MapProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  return (
    <APIProvider apiKey={googleApiKey}>
      {children || <MapComponent />}
    </APIProvider>
  );
}
