'use client';

/**
 * GoogleMap — Maps Embed API (iframe, unlimited free)
 * 기존 Dynamic Maps API(@vis.gl/react-google-maps) 대체
 */
export function MapComponent() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  // Dongtan Station coordinates
  const center = '37.199493,127.096503';

  return (
    <iframe
      title="동탄역 지도"
      width="100%"
      height="100%"
      style={{ border: 0, minHeight: '400px' }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
      src={`https://www.google.com/maps/embed/v1/view?key=${apiKey}&center=${center}&zoom=15&maptype=roadmap`}
    />
  );
}
