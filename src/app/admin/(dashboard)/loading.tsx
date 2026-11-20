import { DelayedAdminSkeleton } from "@/components/admin/delayed-admin-skeleton";

/**
 * Route fallback for the admin dashboard.
 *
 * The skeleton itself waits before painting, so fast tab switches show the
 * real page immediately and only a genuinely slow/offline load shows a
 * placeholder.
 */
export default function AdminLoading() {
  return <DelayedAdminSkeleton />;
}
