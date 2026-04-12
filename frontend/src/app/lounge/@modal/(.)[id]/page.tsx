import LoungeDetailClient from '@/components/LoungeDetailClient';
import { adminDb } from '@/lib/firebaseAdmin';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ModalRoute(props: Props) {
  const params = await props.params;
  const { id } = params;
  let initialPost = null;

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
      console.error('Failed to fetch post in intercepted route', error);
    }
  }

  // To hide the scrolling of the body when modal is open
  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto w-full pt-16 pb-16 px-4">
      <div className="w-full max-w-[800px] h-fit bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
        <LoungeDetailClient postId={id} initialPost={initialPost} isModal={true} />
      </div>
    </div>
  );
}
