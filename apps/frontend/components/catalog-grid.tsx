import Link from "next/link";
import type { CatalogItem } from "@/lib/types";

type Props = {
  items: CatalogItem[];
};

export function CatalogGrid(props: Props) {
  if (props.items.length === 0) {
    return <p className="text-sm text-gray-300">No titles found.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {props.items.map((item) => (
        <Link
          className="group overflow-hidden rounded-md border border-gray-800 bg-gray-900"
          href={{ pathname: `/title/${item.id}` }}
          key={item.id}
        >
          <div className="aspect-[2/3] bg-gray-800">
            {item.posterImageUrl ? (
              <img
                alt={item.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                src={item.posterImageUrl}
              />
            ) : null}
          </div>
          <div className="p-3">
            <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
            <p className="mt-1 text-xs text-gray-400">{item.genres.join(" • ")}</p>
            {item.isPremium ? (
              <span className="mt-2 inline-block rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-yellow-300">
                Premium
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
