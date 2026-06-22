import Link from "next/link";

export type MaterialItem = {
  id: string;
  slug: string;
  name: string;
  category: string;
  kind: string;
  origin: string | null;
  priceTier: string;
  features: string[];
  blurb: string;
  swatch: string;
  imageUrl?: string | null;
};

export function MaterialGallery({ materials }: { materials: MaterialItem[] }) {
  if (materials.length === 0) {
    return <p className="text-muted-foreground">No materials in this category yet.</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {materials.map((m) => (
        <Link
          key={m.id}
          href={`/materials/${m.slug}`}
          className="lift group block overflow-hidden rounded-lg border border-border bg-card"
        >
          <div className="h-44 overflow-hidden">
            {m.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.imageUrl} alt={m.name} className="h-full w-full object-cover" />
            ) : (
              <div className={`swatch h-full w-full bg-gradient-to-br ${m.swatch}`} />
            )}
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <p className="eyebrow">{m.category}</p>
              <span className="text-sm text-gold">{m.priceTier}</span>
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold text-white group-hover:text-gold">
              {m.name}
            </h2>
            {m.origin && (
              <p className="mt-1 text-xs text-muted-foreground">
                {m.kind} · {m.origin}
              </p>
            )}
            <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{m.blurb}</p>
            <span className="mt-3 inline-block text-xs font-medium text-gold opacity-0 transition-opacity group-hover:opacity-100">
              View colors &amp; options →
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
