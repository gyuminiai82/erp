"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";

export default function ApprovalRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  
  useEffect(() => {
    if (resolvedParams.id) {
      router.replace(`/erp/approvals?docId=${resolvedParams.id}`);
    }
  }, [resolvedParams.id, router]);

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
      <span className="text-gray-500 font-medium">결재함으로 이동중...</span>
    </div>
  );
}
