import { adminMessages } from "@/lib/admin/messages";
import { getPosts } from "@/lib/admin/data";
import { PageHeader } from "@/components/admin/ui";
import { BlogManager } from "@/components/admin/blog-manager";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const posts = await getPosts();
  const t = adminMessages.blog;

  return (
    <>
      <PageHeader title={t.title} subtitle={t.subtitle} />

      <BlogManager
        posts={posts}
        copy={{
          ...t,
          // `title` is the editor's Title label, so it must not be the page
          // title ("Blog").
          title: t.postTitle,
          listTitle: t.postTitle,
          status: adminMessages.common.status,
          actions: adminMessages.common.actions,
          slug: adminMessages.common.slug,
          save: adminMessages.common.save,
          saving: adminMessages.common.saving,
          cancel: adminMessages.common.cancel,
          delete: adminMessages.common.delete,
          deleteConfirm: adminMessages.common.confirmDelete,
          errorMissing: adminMessages.common.errorMissingFields,
          errorSlug: adminMessages.common.errorSlug,
          errorSave: adminMessages.common.error,
          saved: adminMessages.common.saved,
        }}
      />
    </>
  );
}
