export const client = {
  name: "Tracy Boutique",
  tagline: "Your Dream Look, Delivered",
  industry: "fashion",
  logo: "",
  logoHeight: 44,
  favicon: "/assets/favicon.ico",
  shopByLabel: "Shop By Department",

  colors: {
    primary: "#2D1B3D",        // deep plum — bridal elegance
    secondary: "#C9A96E",      // champagne gold — celebration
    accent: "#F5E6F0",         // blush pink — romance
    background: "#FFFFFF",
    text: "#1A1A1A",
    textLight: "#6B6B6B",
  },

  fonts: {
    heading: "Bricolage Grotesque",
    body: "Poppins",
  },

  currency: "NGN",
  currencySymbol: "₦",
  phone: "",
  email: "hello@tracyboutique.com",
  address: "Lagos, Nigeria",
  whatsapp: "",

  shipping: {
    flatRate: 3500,
    freeAbove: 100000,
    estimatedDays: "3–7 business days",
  },

  pickupPoints: [
    {
      id:      'lagos',
      name:    'Lagos Showroom',
      address: 'Lagos, Nigeria',
      hours:   'Mon – Sat: 10 am – 7 pm',
    },
  ],

  tax: {
    enabled: false,
    rate: 7.5,
    label: "VAT (7.5%)",
    inclusive: false,
  },

  wholesale: {
    enabled: false,
    tag: "wholesale",
    discountPercent: 10,
  },

  socials: {
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
  },

  seo: {
    title: "Tracy Boutique — Bridal & Fashion in Lagos",
    description: "Your dream look, delivered. Shop bridal gowns, accessories, and occasion wear.",
    ogImage: "/opengraph-image",
  },

  tracking: {
    metaPixelId: "",
    googleTagId: "",
    termiiSenderId: "TracyBtq",
  },

  paymentGateway: "paystack",

  loyalty: {
    enabled: true,
    pointsPerHundredNaira: 1,
    nairaPerPoint: 1,
    minRedeemPoints: 100,
  },

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
    smsNotifications: true,
    loyalty: true,
    payOnDelivery: true,
    bankTransfer: true,
  },

  bankTransfer: {
    bankName: 'GTBank',
    accountName: 'Store Account Name',
    accountNumber: '0123456789',
    instructions: 'Transfer the exact amount shown. Send your receipt after payment.',
  },
}
