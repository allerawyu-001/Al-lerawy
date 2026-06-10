import { useSyncExternalStore } from "react";

export type Category = {
  slug: string;
  name: string;
  products: number;
  description?: string;
  image?: string;
};

let items: Category[] = [
  { slug: "kindai", name: "Kindai", products: 64, description: "Traditional Kindai design with intricate patterns." },
  { slug: "bama", name: "Bama", products: 42, description: "Classic Bama style craft." },
  { slug: "bangwal", name: "Bangwal", products: 38, description: "Premium Bangwal silhouette." },
  { slug: "yerwa", name: "Yerwa", products: 51, description: "Heritage Yerwa workwear." },
];

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const toSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const categoriesStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  getAll() {
    return items;
  },
  update(slug: string, patch: Partial<Category>) {
    const nextSlug = patch.name && !patch.slug ? toSlug(patch.name) : patch.slug ?? slug;
    items = items.map((c) => (c.slug === slug ? { ...c, ...patch, slug: nextSlug } : c));
    emit();
  },
  remove(slug: string) {
    items = items.filter((c) => c.slug !== slug);
    emit();
  },
};

export function useCategories() {
  return useSyncExternalStore(categoriesStore.subscribe, () => items, () => items);
}
