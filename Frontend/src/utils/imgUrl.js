const BACKEND = import.meta.env.VITE_API_URL || "http://localhost:8519";
const FALLBACK = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80";

/**
 * Converts a stored image path to a renderable URL.
 * - "/uploads/..." paths → prepend backend origin
 * - full "http..." URLs → returned as-is (legacy URL-based entries)
 * - empty / null → fallback placeholder
 */
const imgUrl = (path, fallback = FALLBACK) => {
  if (!path || path.trim() === "") return fallback;
  if (path.startsWith("/uploads")) return `${BACKEND}${path}`;
  return path; // already a full URL
};

export default imgUrl;
