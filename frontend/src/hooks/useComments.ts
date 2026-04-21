import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { dashboardFacade, CommentData, FieldReportData } from '@/lib/DashboardFacade';

export function useComments(selectedReport: FieldReportData | null, fullReportData: FieldReportData | null, user: User | null, requestLogin: () => void) {
  const [commentsData, setCommentsData] = useState<Record<string, CommentData[]>>({});
  const [commentInput, setCommentInput] = useState<Record<string, string>>({});

  useEffect(() => {
    // Determine the actual ID to use for fetching comments.
    const actualReportId = fullReportData ? fullReportData.id : selectedReport?.id;
    
    if (actualReportId && !actualReportId.startsWith('stub-') && !commentsData[actualReportId]) {
      const unsubscribe = dashboardFacade.listenToComments!(actualReportId, (comments) => {
        setCommentsData(prev => ({ ...prev, [actualReportId]: comments }));
      });
      return () => unsubscribe();
    }
  }, [selectedReport, fullReportData, commentsData]);

  const handleSubmitComment = async (reportId: string) => {
    if (!user) { 
      alert("로그인 후 댓글을 남길 수 있습니다."); 
      requestLogin(); 
      return; 
    }
    const text = commentInput[reportId];
    if (!text?.trim()) return;

    await dashboardFacade.addFieldReportComment!(reportId, text, user.uid);
    setCommentInput(prev => ({ ...prev, [reportId]: '' }));
  };

  return {
    commentsData,
    commentInput,
    setCommentInput,
    handleSubmitComment
  };
}
