import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { client } from '@/config/client'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const size    = parseInt(req.nextUrl.searchParams.get('size') ?? '192', 10)
  const sz      = [192, 512].includes(size) ? size : 192
  const primary = client.colors.primary
  const letter  = client.name.charAt(0).toUpperCase()
  const pad     = Math.round(sz * 0.15)
  const fontSize = Math.round(sz * 0.45)
  const radius   = Math.round(sz * 0.22)

  return new ImageResponse(
    (
      <div
        style={{
          width:           sz,
          height:          sz,
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          background:      primary,
          borderRadius:    radius,
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight:  800,
            color:       '#ffffff',
            lineHeight:  1,
            fontFamily:  'sans-serif',
          }}
        >
          {letter}
        </span>
      </div>
    ),
    { width: sz, height: sz }
  )
}
