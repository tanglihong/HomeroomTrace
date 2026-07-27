"use client";

import { AdminView } from "@/features/admin/admin-view";
import { AdminAuthProvider } from "@/lib/auth/admin-context";
import { IOSAlertProvider } from "@/features/common/ios-alert";
import { ToastProvider } from "@/features/common/toast";

export default function AdminPage() {
  return (
    <ToastProvider>
      <IOSAlertProvider>
        <AdminAuthProvider>
          <AdminView />
        </AdminAuthProvider>
      </IOSAlertProvider>
    </ToastProvider>
  );
}
