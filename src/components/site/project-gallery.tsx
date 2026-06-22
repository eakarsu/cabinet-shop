"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryProject = {
  id: string;
  title: string;
  tag: string;
  location: string | null;
  year: number | null;
  description: string | null;
  grad: string;
  imageUrl?: string | null;
};

export function ProjectGallery({
  projects,
  showFilter = false,
}: {
  projects: GalleryProject[];
  showFilter?: boolean;
}) {
  const tags = ["All", ...Array.from(new Set(projects.map((p) => p.tag)))];
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<GalleryProject | null>(null);

  const items = filter === "All" ? projects : projects.filter((p) => p.tag === filter);

  // Esc to close the modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {showFilter && (
        <div className="mb-10 flex flex-wrap gap-3">
          {tags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilter(tag)}
              className={cn(
                "rounded-sm border px-5 py-2 text-sm transition-colors",
                filter === tag
                  ? "border-gold bg-gold text-primary-foreground"
                  : "border-border text-stone-200 hover:border-gold/50"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p)}
            style={
              p.imageUrl
                ? { backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.1)), url(${p.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
                : undefined
            }
            className={`swatch lift group flex h-64 flex-col justify-end rounded-md border border-border p-5 text-left ${p.imageUrl ? "" : `bg-gradient-to-br ${p.grad}`}`}
          >
            <span className={`block text-[10px] uppercase tracking-widest ${p.imageUrl ? "text-white/80" : "text-black/60"}`}>
              {p.tag}
              {p.year ? ` · ${p.year}` : ""}
            </span>
            <span className={`font-semibold drop-shadow-sm ${p.imageUrl ? "text-white" : "text-stone-900"}`}>
              {p.title}
            </span>
            {p.location && (
              <span className={`mt-0.5 block text-xs ${p.imageUrl ? "text-white/80" : "text-stone-800/80"}`}>
                {p.location}
              </span>
            )}
            <span className={`mt-2 text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100 ${p.imageUrl ? "text-white/80" : "text-stone-900/70"}`}>
              View details →
            </span>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelected(null)}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-1.5 text-white hover:text-gold"
            >
              <X size={18} />
            </button>
            {selected.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.imageUrl} alt={selected.title} className="h-56 w-full object-cover" />
            ) : (
              <div className={`h-56 bg-gradient-to-br ${selected.grad}`} />
            )}
            <div className="p-6">
              <span className="eyebrow">{selected.tag}</span>
              <h3 className="mt-2 font-display text-2xl font-bold text-white">
                {selected.title}
              </h3>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {selected.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-gold" /> {selected.location}
                  </span>
                )}
                {selected.year && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} className="text-gold" /> {selected.year}
                  </span>
                )}
              </div>
              {selected.description && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {selected.description}
                </p>
              )}
              <Link
                href="/contact"
                className="btn-gold mt-6 inline-block px-6 py-2.5 text-sm"
              >
                Start a project like this
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
