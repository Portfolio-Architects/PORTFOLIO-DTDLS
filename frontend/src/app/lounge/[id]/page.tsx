import { Metadata } from 'next';
import LoungeDetailClient from '@/components/LoungeDetailClient';
import { adminDb } from '@/lib/firebaseAdmin';

interface Props {
  params: Promise<{ id: string }>;
}

// Next.js 15+ Server Component for dynamic SEO requires await for params
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const { id } = params;
  let title = '동탄 라운지 게시글 | D-VIEW';
  let description = '동탄 주민들의 솔직한 리얼 실거래가 라운지 이야기입니다.';

  if (!id) return { title, description };

  if (adminDb) {
    try {
      const docSnap = await adminDb.collection('posts').doc(id).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data) {
          title = `${data.title} | D-VIEW 라운지`;
          // Use 'content' if it exists, clean markdown symbols, otherwise fallback to description
          if (data.content) {
            const cleanContent = data.content.replace(/[#*`~_\-]/g, '').replace(/\n+/g, ' ').trim();
            description = cleanContent.length > 100 ? cleanContent.substring(0, 100) + '...' : cleanContent;
          } else {
            description = '동탄 주민들의 솔직한 리얼 실거래가 라운지 이야기입니다.';
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch post for metadata', error);
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: 'D-VIEW',
      locale: 'ko_KR',
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function LoungePostPage(props: Props) {
  const params = await props.params;
  const { id } = params;
  let initialPost: Record<string, unknown> | undefined = undefined;

  if (adminDb && id) {
    try {
      const docSnap = await adminDb.collection('posts').doc(id).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data) {
          initialPost = {
            id: docSnap.id,
            title: data.title,
            category: data.category,
            content: data.content || '',
            author: data.authorName || '익명',
            likes: data.likes || 0,
            views: data.views || 0,
            authorUid: data.authorUid || null,
            verifiedApartment: data.verifiedApartment || null,
            verificationLevel: data.verificationLevel || null,
            createdAt: data.createdAt ? data.createdAt.toMillis() : Date.now(),
          };
        }
      }
    } catch (error) {
      console.error('Failed to fetch initial post in server', error);
    }
  }

  // Pass the ID and the prefetched data to the client component to render SSR
  return <LoungeDetailClient postId={id} initialPost={initialPost} />;
}
