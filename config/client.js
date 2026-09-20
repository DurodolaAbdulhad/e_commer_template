import { client as mynnatap }      from './clients/mynnatap.js'
import { client as tracyboutique } from './clients/tracyboutique.js'

const map = {
  mynnatap,
  tracyboutique,
}

const key = process.env.NEXT_PUBLIC_CLIENT ?? 'mynnatap'
export const client = map[key] ?? mynnatap
