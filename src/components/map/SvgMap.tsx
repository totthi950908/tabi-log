type SvgMapData = {
  viewBox: string
  locations: { id: string; name: string; path: string }[]
}

/**
 * 汎用の塗りつぶし地図。visited に含まれる id のロケーションを塗る。
 */
export default function SvgMap({
  map,
  visited,
}: {
  map: SvgMapData
  visited: Set<string>
}) {
  return (
    <svg
      viewBox={map.viewBox}
      className="w-full h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      {map.locations.map((loc) => {
        const on = visited.has(loc.id)
        return (
          <path
            key={loc.id}
            d={loc.path}
            fill={on ? 'url(#visited-grad)' : '#e2e8f0'}
            stroke="#ffffff"
            strokeWidth={0.5}
          >
            <title>{loc.name}</title>
          </path>
        )
      })}
      <defs>
        <linearGradient id="visited-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0ea5e9" />
          <stop offset="1" stopColor="#14b8a6" />
        </linearGradient>
      </defs>
    </svg>
  )
}
