module.exports = {
  ci: {
    collect: {
      // Run against the production URL — override via LHCI_BUILD_CONTEXT__CURRENT_HASH_URL
      url: [
        process.env.LHCI_URL || 'http://localhost:3000',
        (process.env.LHCI_URL || 'http://localhost:3000') + '/shop',
      ],
      numberOfRuns: 3,
      settings: {
        // Simulate mid-range Android on a 3G Nigerian connection
        preset:          'desktop',
        throttlingMethod: 'simulate',
        throttling: {
          rttMs:                150,
          throughputKbps:       1600,
          cpuSlowdownMultiplier: 4,
        },
        formFactor:    'mobile',
        screenEmulation: {
          mobile:             true,
          width:              390,
          height:             844,
          deviceScaleFactor:  2,
        },
      },
    },
    assert: {
      assertions: {
        // Performance
        'categories:performance':     ['warn',  { minScore: 0.75 }],
        'first-contentful-paint':     ['error', { maxNumericValue: 3000  }],
        'largest-contentful-paint':   ['error', { maxNumericValue: 5000  }],
        'total-blocking-time':        ['warn',  { maxNumericValue: 600   }],
        'cumulative-layout-shift':    ['error', { maxNumericValue: 0.15  }],
        'speed-index':                ['warn',  { maxNumericValue: 5500  }],
        // Accessibility
        'categories:accessibility':   ['warn',  { minScore: 0.85 }],
        // SEO
        'categories:seo':             ['warn',  { minScore: 0.90 }],
        // PWA
        'installable-manifest':       ['warn',  { minScore: 1 }],
        'service-worker':             ['warn',  { minScore: 1 }],
        'splash-screen':              ['warn',  { minScore: 1 }],
        // Best practices
        'categories:best-practices':  ['warn',  { minScore: 0.85 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
