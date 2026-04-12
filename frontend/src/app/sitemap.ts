import { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebaseAdmin';

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dview-five.vercel.app';

  // Base routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1,
    },
    {
      url: `${baseUrl}/lounge`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
  ];

  // Dynamic Lounge post routes
  if (adminDb) {
    try {
      const postsSnapshot = await adminDb
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(1000) // limit for safety in sitemap
        .get();

      postsSnapshot.forEach((doc) => {
        const post = doc.data();
        let lastModified = new Date();
        
        if (post.createdAt) {
          try {
            // Check if it's a Firestore Timestamp explicitly to call .toDate() safely
            if (typeof post.createdAt.toDate === 'function') {
              lastModified = post.createdAt.toDate();
            } else if (post.createdAt._seconds) {
               lastModified = new Date(post.createdAt._seconds * 1000);
            }
          } catch(e) { /* ignore */ }
        }

        routes.push({
          url: `${baseUrl}/lounge/${doc.id}`,
          lastModified,
          changeFrequency: 'daily',
          priority: 0.8,
        });
      });
    } catch (error) {
      console.error('Failed to fetch posts for sitemap', error);
    }
  }

  return routes;
}
