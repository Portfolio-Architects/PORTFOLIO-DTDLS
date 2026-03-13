import ReportEditorForm from '@/components/admin/ReportEditorForm';

export default function WriteReportPage() {
  return (
    <div className="animate-in fade-in duration-300 pb-20">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#191f28] tracking-tight mb-2">새 임장기 작성</h1>
        <p className="text-[#4e5968] text-[15px]">현장 데이터를 입력하고 프리미엄 임장기를 발행하세요.</p>
      </div>

      <div className="bg-white rounded-2xl border border-[#e5e8eb] shadow-sm overflow-hidden">
        <ReportEditorForm />
      </div>
    </div>
  );
}
