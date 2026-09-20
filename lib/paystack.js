'use client'

export function initializePaystack({ email, amount, reference, onSuccess, onClose, metadata = {} }) {
  const handler = window.PaystackPop.setup({
    key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    email,
    amount: amount * 100, // Paystack expects kobo
    currency: 'NGN',
    ref: reference,
    metadata,
    callback: (response) => {
      onSuccess(response)
    },
    onClose: () => {
      if (onClose) onClose()
    },
  })
  handler.openIframe()
}
