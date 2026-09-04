import type { TagMeta } from "./format.ts";

export function Tag({ variant, glyph, label }: TagMeta) {
  return (
    <span className={`tag tag-${variant}`}>
      <span className="tag-glyph" aria-hidden="true">
        {glyph}
      </span>
      {label}
    </span>
  );
}
