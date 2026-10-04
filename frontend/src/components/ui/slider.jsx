import * as React from "react"
import { cn } from "@/lib/utils"
import { Slider as SliderPrimitive } from "radix-ui"

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-disabled:opacity-50 py-1.5 cursor-pointer",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-slate-800/90 border border-slate-700/40 shadow-inner"
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className="absolute h-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 select-none shadow-[0_0_8px_rgba(6,182,212,0.5)]"
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="relative block h-4 w-4 shrink-0 rounded-full border-2 border-cyan-400 bg-white ring-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.7)] transition-all select-none hover:scale-110 hover:ring-4 focus-visible:ring-4 focus-visible:outline-none active:scale-95 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
