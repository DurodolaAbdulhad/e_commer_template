// ============================================================
// CLIENT CONFIG — copy this file, rename to [clientname].js
// Fill in all fields for the client, then:
//   npm run switch [clientname]
// ============================================================

export const client = {
  // ── Identity ──────────────────────────────────────────────
  name: "Tech Mart",
  tagline: "Best Prices in Lagos.",
  industry: "electronics", // electronics | fashion | grocery | beauty | furniture | general
  logo: "",             // "/assets/logo.png" or Cloudinary URL — leave "" for text logo
  logoHeight: 40,
  favicon: "/assets/favicon.ico",

  // ── Brand Colors ──────────────────────────────────────────
  colors: {
    primary: "#1a1a2e",
    secondary: "#e94560",
    accent: "#0f3460",
    background: "#FFFFFF",
    text: "#333333",
    textLight: "#777777",
  },

  // ── Typography ────────────────────────────────────────────
  fonts: {
    heading: "Bricolage Grotesque",
    body: "Poppins",
  },

  // ── Business Info ─────────────────────────────────────────
  currency: "NGN",
  currencySymbol: "₦",
  phone: "+234 800 123 4567",
  email: "hello@techmart.com.ng",
  address: "Victoria Island, Lagos",
  whatsapp: "2348001234567",

  // ── Shipping ──────────────────────────────────────────────
  shipping: {
    flatRate: 2500,
    freeAbove: 50000,
    estimatedDays: "2–5 business days",
  },

  // ── Tax / VAT ─────────────────────────────────────────────
  tax: {
    enabled: false,
    rate: 7.5,
    label: "VAT (7.5%)",
    inclusive: false,
  },

  // ── B2B / Wholesale ───────────────────────────────────────
  wholesale: {
    enabled: false,
    tag: "wholesale",
    discountPercent: 15,
  },

  // ── Social Links ──────────────────────────────────────────
  socials: {
    instagram: "techmart.ng",
    facebook: "techmartnigeria",
    twitter: "techmart_ng",
    youtube: "",
  },

  // ── SEO ───────────────────────────────────────────────────
  seo: {
    title: "Tech Mart — Electronics & Gadgets in Lagos",
    description: "Shop smartphones, laptops, and electronics at the best prices.",
    ogImage: "/opengraph-image",
  },

  // ── Analytics ─────────────────────────────────────────────
  tracking: {
    metaPixelId: "",
    googleTagId: "",
    termiiSenderId: "TechMart",
  },

  // ── Payment ───────────────────────────────────────────────
  paymentGateway: "paystack", // "paystack" | "flutterwave"

  // ── Features ──────────────────────────────────────────────
  features: {
    wishlist: true,
    reviews: true,
    blog: true,
    whatsappChat: true,
    whatsappOrder: true,
    compare: false,
    newsletter: true,
    guestCheckout: true,
    googleAuth: false,
    digitalProducts: false,
    giftCards: true,
    bundles: true,
    abandonedCart: true,
    smsNotifications: false,
  },
}
