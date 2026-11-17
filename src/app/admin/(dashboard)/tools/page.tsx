import { adminMessages } from "@/lib/admin/messages";
import { getCategories, getTools } from "@/lib/admin/data";
import { PageHeader } from "@/components/admin/ui";
import { ToolsManager } from "@/components/admin/tools-manager";

export const dynamic = "force-dynamic";

export default async function AdminToolsPage() {
  const [tools, categories] = await Promise.all([getTools(), getCategories()]);
  const t = adminMessages.tools;

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <ToolsManager
        tools={tools}
        categories={categories.map((category) => ({
          slug: category.slug,
          label: category.label,
        }))}
        copy={{
          ...t,
          title: adminMessages.common.name,
          category: adminMessages.common.category,
          status: adminMessages.common.status,
          actions: adminMessages.common.actions,
          cancel: adminMessages.common.cancel,
          save: adminMessages.common.save,
          saving: adminMessages.common.saving,
          delete: adminMessages.common.delete,
          errorMissing: adminMessages.common.errorMissingFields,
          errorSlug: adminMessages.common.errorSlug,
          errorSave: adminMessages.common.error,
          saved: adminMessages.common.saved,
        }}
      />
    </>
  );
}
