import { Star } from "lucide-react";

const SIZES = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
} as const;

export default function Stars({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${SIZES[size]} ${
            n <= rating ? "fill-gold text-gold-deep" : "text-line-strong"
          }`}
          strokeWidth={2}
          aria-hidden
        />
      ))}
    </div>
  );
}
