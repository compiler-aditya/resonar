import { Suspense } from "react";
import Recorder from "@/components/Recorder";

export default function RecordPage() {
  return (
    <Suspense fallback={<div className="py-10 text-white/50">Loading recorder…</div>}>
      <Recorder />
    </Suspense>
  );
}
