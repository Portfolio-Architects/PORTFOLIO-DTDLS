import { Metadata } from 'next';
import LoungeDetailClient from '@/components/LoungeDetailClient';
import { adminDb } from '@/lib/firebaseAdmin';

interface Props {
  params: { id: string };
}

// Next.js 14 Server Component for dynamic SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  let title = '동탄 라운지 게시글 | D-VIEW';
  let description = '동탄 주민들의 솔직한 리얼 실거래가 라운지 이야기입니다.';

  if (adminDb) {
    try {
      const docSnap = await adminDb.collection('posts').doc(id).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data) {
          title = `${data.title} | D-VIEW 라운지`;
          // Use 'content' if it exists, otherwise fallback to description
          description = data.content
            ? (data.content.length > 100 ? data.content.substring(0, 100) + '...' : data.content)
            : '동탄 주민들의 솔직한 리얼 실거래가 라운지 이야기입니다.';
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

export default function LoungePostPage({ params }: Props) {
  // Pass the ID to the client component to handle the rest of the dynamic interactions
  return <LoungeDetailClient postId={params.id} />;
}
