'use client';

/**
 * MapProvider — 하위 호환용 래퍼 (Maps Embed API 전환으로 APIProvider 제거)
 * 필요한 곳에서 <MapComponent />를 직접 사용하세요.
 */
export default function MapProvider({
  children,
}: {
  children?: React.ReactNode;
}) {
  return <>{children}</>;
}
