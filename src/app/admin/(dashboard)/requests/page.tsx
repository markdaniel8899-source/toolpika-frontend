import { adminMessages } from "@/lib/admin/messages";
import { getRequests } from "@/lib/admin/data";
import { PageHeader } from "@/components/admin/ui";
import { RequestsInbox } from "@/components/admin/requests-inbox";

export const dynamic = "force-dynamic";

export default async function AdminRequestsPage() {
  const requests = await getRequests();
  const t = adminMessages.requests;

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <RequestsInbox
        requests={requests}
        copy={{
          toolName: t.toolName,
          userEmail: t.userEmail,
          date: adminMessages.common.date,
          status: adminMessages.common.status,
          typeLabel: t.typeLabel,
          typeToolRequest: t.typeToolRequest,
          typeContact: t.typeContact,
          filterAll: t.filterAll,
          filterToolRequests: t.filterToolRequests,
          filterContact: t.filterContact,
          statusNew: t.statusNew,
          statusInProgress: t.statusInProgress,
          statusResolved: t.statusResolved,
          statusRejected: t.statusRejected,
          empty: t.empty,
          statusNote: t.statusNote,
        }}
      />
    </>
  );
}
