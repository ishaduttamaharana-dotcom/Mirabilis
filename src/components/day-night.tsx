import { useId, useState } from "react";
import { media } from "@/content/site";

/**
 * Signature "Day → Night" comparison. Slider-driven, keyboard accessible,
 * and static-safe: both images render regardless of JS state.
 */
export function DayNight() {
  const [value, setValue] = useState(55);
  const id = useId();

  return (
    <div className="relative overflow-hidden border">
      <div className="relative aspect-4/3 w-full sm:aspect-16/9">
        <img
          src={media.sceneNight}
          alt="A cafe interior at night, lit by warm copper pendant lights"
          width={1280}
          height={960}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
        <img
          src={media.sceneDay}
          alt="The same cafe interior in golden-hour daylight"
          width={1280}
          height={960}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
          style={{ clipPath: `inset(0 ${100 - value}% 0 0)` }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-px bg-primary"
          style={{ left: `${value}%` }}
        />
        <span className="absolute left-4 top-4 eyebrow">Golden hour</span>
        <span className="absolute right-4 top-4 eyebrow">After dark</span>
      </div>

      <div className="flex items-center gap-4 border-t bg-card/60 px-5 py-4">
        <label htmlFor={id} className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
          Day / Night
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary"
          aria-label="Reveal the daytime version of the scene"
        />
      </div>
    </div>
  );
}
