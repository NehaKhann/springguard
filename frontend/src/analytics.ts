export function initAnalytics() {
  const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  if (gaId) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`
    document.head.appendChild(script)

    const inline = document.createElement('script')
    inline.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${gaId}');
    `
    document.head.appendChild(inline)
  }

  const umamiUrl = import.meta.env.VITE_UMAMI_URL as string | undefined
  const umamiId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined
  if (umamiUrl && umamiId) {
    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.src = umamiUrl
    script.setAttribute('data-website-id', umamiId)
    document.head.appendChild(script)
  }
}
