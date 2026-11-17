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
          empty: t.empty,
          markBuilding: t.markBuilding,
          markLaunched: t.markLaunched,
          reopen: t.reopen,
          launchedNote: t.launchedNote,
        }}
      />
    </>
  );
}
