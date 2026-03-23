import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DSQ | 동탄구 아파트 가치 측정 플랫폼',
    short_name: 'DSQ',
    description: 'Dongtan Spatial Quant — 동탄구 179개 아파트의 실거래가·인프라·임장 리포트를 한눈에.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f2f4f6',
    theme_color: '#3182f6',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
