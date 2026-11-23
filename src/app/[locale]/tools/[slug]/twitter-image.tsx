import { ImageResponse } from "next/og";
import { ToolShareImage } from "@/components/seo/tool-share-image";
import { getTool } from "@/lib/tools/registry";

export const alt = "Toolpika tool preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const tool = getTool(slug);

  return new ImageResponse(<ToolShareImage title={tool?.title ?? "Toolpika"} />, {
    ...size,
  });
}
