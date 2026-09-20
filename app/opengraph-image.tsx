import { ImageResponse } from 'next/og'
import { client } from '@/config/client'

export const runtime = 'edge'
export const alt = client.name
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, ${client.colors.primary} 0%, #1a2638 100%)`,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          display: 'flex',
        }} />

        {/* Logo mark */}
        <div style={{
          width: 80, height: 80,
          background: client.colors.secondary,
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
        }}>
          <svg width="44" height="44" viewBox="0 0 40 36">
            <path d="M20 0L40 36H27.5L20 19L12.5 36H0L20 0Z" fill="white" />
          </svg>
        </div>

        {/* Store name */}
        <div style={{
          fontSize: 64,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-1px',
          marginBottom: 16,
          textAlign: 'center',
        }}>
          {client.name}
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 24,
          color: 'rgba(255,255,255,0.65)',
          fontWeight: 400,
          textAlign: 'center',
          maxWidth: 700,
        }}>
          {client.tagline ?? 'Shop the best products online'}
        </div>

        {/* Bottom strip */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: client.colors.secondary,
          display: 'flex',
        }} />
      </div>
    ),
    { ...size },
  )
}
