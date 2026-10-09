// Multi-client entry point.
// Set NEXT_PUBLIC_CLIENT in your Vercel deployment environment variables
// to switch which store config is used at build time.
//
//   NEXT_PUBLIC_CLIENT=mynnatap       → config/clients/mynnatap.js
//   NEXT_PUBLIC_CLIENT=tracyboutique  → config/clients/tracyboutique.js  (default)
//
// Adding a new client: create config/clients/<name>.js, set NEXT_PUBLIC_CLIENT=<name>.

const id = process.env.NEXT_PUBLIC_CLIENT ?? 'tracyboutique'

let config

if (id === 'mynnatap') {
  config = require('./clients/mynnatap.js')
} else if (id === 'tracyboutique') {
  config = require('./clients/tracyboutique.js')
} else {
  // Fallback: try to require the named file; error at build time if it doesn't exist
  config = require(`./clients/${id}.js`)
}

export const client = config.client
