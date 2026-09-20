export const client = {
  name: "Mynnat Luxe Collections",
  tagline: "Luxury that speaks before you do",
  industry: "fashion",
  logo: "/assets/mynnat-logo.png",
  logoHeight: 56,
  headerBg: "#000000",
  favicon: "/assets/favicon.ico",

  colors: {
    primary: "#222222",
    secondary: "#22C55E",
    accent: "#F5A623",
    background: "#FFFFFF",
    text: "#333333",
    textLight: "#777777",
  },

  fonts: {
    heading: "Bricolage Grotesque",
    body: "Poppins",
  },

  currency: "NGN",
  currencySymbol: "₦",
  phone: "+234 815 304 0557",
  email: "Mynnatapparels@gmail.com",
  address: "Nob-oluwa Street Ogba Lagos",
  whatsapp: "2348153040557",

  shipping: {
    flatRate: 2500,
    freeAbove: 50000,
    estimatedDays: "2–5 business days",
  },

  tax: {
    enabled: false,
    rate: 7.5,
    label: "VAT (7.5%)",
    inclusive: false,
  },

  wholesale: {
    enabled: false,
    tag: "wholesale",
    discountPercent: 15,
  },

  socials: {
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
  },

  seo: {
    title: "Mynnat Luxe Collections — Luxury that speaks before you do",
    description: "Premium luxury fashion accessories — Ogba, Ikeja, Lagos. Shop belts, perfumes, eyewear, jewellery and more.",
    ogImage: "/opengraph-image",
  },

  tracking: {
    metaPixelId: "",
    googleTagId: "",
    termiiSenderId: "",
  },

  paymentGateway: "paystack",

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
