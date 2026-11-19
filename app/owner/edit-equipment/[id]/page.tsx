import { Suspense } from "react";
import EditEquipmentClient from "./EditEquipmentClient";

function EditEquipmentFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-8 w-48 bg-gray-200 dark:bg-zinc-800 rounded animate-pulse" />
    </div>
  );
}

export default function EditEquipmentPage() {
  return (
    <Suspense fallback={<EditEquipmentFallback />}>
      <EditEquipmentClient />
    </Suspense>
  );
}
