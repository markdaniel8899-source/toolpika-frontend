import { redirect } from "next/navigation";

/** The pipeline now lives inside Tool Studio; keep the old URL working. */
export default function AdminPipelinePage() {
  redirect("/admin/studio");
}
