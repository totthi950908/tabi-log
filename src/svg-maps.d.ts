declare module '@svg-maps/japan' {
  const map: {
    label: string
    viewBox: string
    locations: { id: string; name: string; path: string }[]
  }
  export default map
}

declare module '@svg-maps/world' {
  const map: {
    label: string
    viewBox: string
    locations: { id: string; name: string; path: string }[]
  }
  export default map
}
