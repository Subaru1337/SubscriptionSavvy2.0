export function setFaviconBadge(count: number) {
  const canvas = document.createElement('canvas')
  canvas.width = 32
  canvas.height = 32
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Draw the base favicon
  const img = new Image()
  img.src = '/favicon.ico'
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 32, 32)

    if (count > 0) {
      // Draw red badge circle in top-right corner
      ctx.beginPath()
      ctx.arc(24, 8, 8, 0, 2 * Math.PI)
      ctx.fillStyle = '#E05C5C'
      ctx.fill()

      // Draw count number (or dot if count > 9)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 10px DM Sans, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(count > 9 ? '9+' : String(count), 24, 8)
    }

    // Replace the favicon
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement
      || document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = canvas.toDataURL()
    document.head.appendChild(link)
  }
}

export function clearFaviconBadge() {
  setFaviconBadge(0)
}
