import cap1 from "@/assets/cap-1.jpg";
import cap2 from "@/assets/cap-2.jpg";
import cap3 from "@/assets/cap-3.jpg";
import cap4 from "@/assets/cap-4.jpg";

export type Product = {
  id: string;
  title: string;
  producer: string;
  category: "Kindai" | "Bama" | "Bangwal" | "Yerwa";
  color: string;
  price: number;
  image: string;
  stock: number;
  rating: number;
  reviews: number;
  description: string;
  tag?: "New" | "Trending" | "Limited";
};

export const products: Product[] = [
  {
    id: "noir-01",
    title: "Onyx Kindai",
    producer: "Atelier Noir",
    category: "Kindai",
    color: "Black",
    price: 68,
    image: cap1,
    stock: 24,
    rating: 4.9,
    reviews: 184,
    description: "Traditional Kindai design with intricate patterns.",
    tag: "Trending",
  },
  {
    id: "noir-02",
    title: "Crown Bama — Ivory",
    producer: "Maison Doré",
    category: "Bama",
    color: "Cream",
    price: 54,
    image: cap2,
    stock: 12,
    rating: 4.8,
    reviews: 96,
    description: "Classic Bama style craft in ivory tone.",
    tag: "New",
  },
  {
    id: "noir-03",
    title: "Atlas Bangwal Fitted",
    producer: "Northfield Co.",
    category: "Bangwal",
    color: "Charcoal",
    price: 84,
    image: cap3,
    stock: 6,
    rating: 4.95,
    reviews: 47,
    description: "A merino-blend fitted Bangwal in deep charcoal.",
    tag: "Limited",
  },
  {
    id: "noir-04",
    title: "Field Yerwa — Sand",
    producer: "Studio Wares",
    category: "Yerwa",
    color: "Sand",
    price: 46,
    image: cap4,
    stock: 32,
    rating: 4.7,
    reviews: 212,
    description: "Heritage Yerwa workwear cap with canvas front.",
  },
  {
    id: "noir-05",
    title: "Onyx Kindai — Wide",
    producer: "Atelier Noir",
    category: "Kindai",
    color: "Black",
    price: 72,
    image: cap1,
    stock: 18,
    rating: 4.85,
    reviews: 64,
    description: "Wide variant of the Onyx Kindai with tonal stitching.",
  },
  {
    id: "noir-06",
    title: "Crown Bama — Stone",
    producer: "Maison Doré",
    category: "Bama",
    color: "Stone",
    price: 54,
    image: cap2,
    stock: 9,
    rating: 4.6,
    reviews: 38,
    description: "Bama silhouette in a softer stone colorway.",
  },
  {
    id: "noir-07",
    title: "Atlas Yerwa",
    producer: "Northfield Co.",
    category: "Yerwa",
    color: "Black",
    price: 62,
    image: cap3,
    stock: 4,
    rating: 4.9,
    reviews: 21,
    description: "Hand-shaped Yerwa craft. Unstructured, satin-lined.",
    tag: "Limited",
  },
  {
    id: "noir-08",
    title: "Field Bangwal — Black",
    producer: "Studio Wares",
    category: "Bangwal",
    color: "Black",
    price: 46,
    image: cap4,
    stock: 40,
    rating: 4.7,
    reviews: 158,
    description: "Bangwal in washed black with tonal mesh.",
    tag: "Trending",
  },
];

export const categories = ["All", "Kindai", "Bama", "Bangwal", "Yerwa"] as const;
export const colors = ["All", "Black", "Cream", "Charcoal", "Sand", "Stone"] as const;
