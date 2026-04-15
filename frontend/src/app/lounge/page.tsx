import { adminDb } from '@/lib/firebaseAdmin';
import LoungeContainerClient from '@/components/LoungeContainerClient';

export const dynamic = 'force-dynamic';

export default async function LoungePage() {
  let posts: any[] = [];
  
  try {
    if (adminDb) {
      const snap = await adminDb.collection('posts').orderBy('createdAt', 'desc').limit(50).get();
      posts = snap.docs.map(doc => {
        const data = doc.data();
        const rawContent = data.content || '';
        
        // Extract first image
        const imgMatch = rawContent.match(/!\[.*?\]\((.*?)\)/);
        const imageUrl = imgMatch ? imgMatch[1] : null;
        
        // Clean text content for summary
        const summary = rawContent.replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[.*?\]\(.*?\)/g, '').replace(/[#*~_\-`(]/g, '').replace(/\s+/g, ' ').replace(/https?:\/\/[^\s]+/g, '').trim();

        return {
          id: doc.id,
          title: data.title || '',
          summary,
          imageUrl,
          category: data.category || '',
          author: data.authorName || data.author || '익명',
          meta: data.meta || '',
          views: data.views || 0,
          likes: data.likes || 0,
          createdAt: data.createdAt?.toMillis() || 0,
        };
      });
    }
  } catch (error) {
    console.error('Failed to fetch lounge posts server-side', error);
  }

  return (
    <main id="main-content" className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 pt-6 pb-[100px] sm:pb-12 animate-in fade-in duration-500">
      <LoungeContainerClient initialPosts={posts} />
    </main>
  );
}
