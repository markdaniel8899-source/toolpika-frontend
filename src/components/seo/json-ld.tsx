import { serializeJsonLd, type JsonLd } from "@/lib/seo/json-ld";

/** Server component that renders one application/ld+json block per schema. */
export function JsonLdScripts({ schemas }: { schemas: JsonLd[] }) {
  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
        />
      ))}
    </>
  );
}
