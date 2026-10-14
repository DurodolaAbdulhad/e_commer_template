'use client'

import { useEffect, useState } from 'react'

type Consent = { necessary: boolean; analytics: boolean; marketing: boolean }

function getConsent(): Consent | null {
  try {
    const raw = localStorage.getItem('cookie_consent')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function injectInlineScript(id: string, code: string) {
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  s.innerHTML = code
  document.head.appendChild(s)
}

function injectExternalScript(id: string, src: string) {
  if (document.getElementById(id)) return
  const s = document.createElement('script')
  s.id = id
  s.src = src
  s.async = true
  document.head.appendChild(s)
}

export default function TrackingScripts({
  fbPixelId,
  gaId,
  tiktokId,
  clarityId,
}: {
  fbPixelId?: string
  gaId?: string
  tiktokId?: string
  clarityId?: string
}) {
  const [consent, setConsent] = useState<Consent | null>(null)

  useEffect(() => {
    setConsent(getConsent())
    const handler = () => setConsent(getConsent())
    window.addEventListener('cookie-consent-update', handler)
    return () => window.removeEventListener('cookie-consent-update', handler)
  }, [])

  useEffect(() => {
    if (!consent) return

    if (consent.analytics) {
      if (gaId) {
        injectExternalScript('ga4-src', `https://www.googletagmanager.com/gtag/js?id=${gaId}`)
        injectInlineScript(
          'ga4-init',
          `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`
        )
      }
      if (clarityId) {
        injectInlineScript(
          'clarity-init',
          `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${clarityId}");`
        )
      }
    }

    if (consent.marketing) {
      if (fbPixelId) {
        injectInlineScript(
          'fbpixel-init',
          `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${fbPixelId}');fbq('track','PageView');`
        )
      }
      if (tiktokId) {
        injectInlineScript(
          'ttq-init',
          `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${tiktokId}');ttq.page();}(window,document,'ttq');`
        )
      }
    }
  }, [consent, fbPixelId, gaId, tiktokId, clarityId])

  return null
}
