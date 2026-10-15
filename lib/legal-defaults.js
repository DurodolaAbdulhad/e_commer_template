// NDPA-compliant legal page defaults.
// These are the fallback texts rendered when the admin has not yet
// saved custom content for the privacy / terms pages via admin/pages.
// All strings use **bold** / \n\n paragraph syntax that RichText renders.

export function privacy(client) {
  return `**Privacy Policy — ${client.name}**
Last updated: 1 October 2025

${client.name} ("we", "us", "our") is committed to protecting your personal data in accordance with the Nigeria Data Protection Act (NDPA) 2023 and the Nigeria Data Protection Regulation (NDPR) 2019.

**1. Data Controller**
${client.name}
${client.address}
Email: ${client.email}
Phone: ${client.phone || 'See contact page'}

For data protection enquiries, contact our team at ${client.email} with the subject line "Data Protection Request".

**2. What Data We Collect**
When you shop with us or create an account, we may collect:
- Name, email address, and phone number
- Delivery and billing address
- Order history and payment records (we never store card numbers — payments are handled by Paystack, PCI-DSS certified)
- Device and browser information for security purposes
- Cookies and usage data (with your consent — see Section 7)

**3. Why We Collect It (Lawful Basis)**
- **Order fulfilment**: We need your contact and delivery details to process and deliver your order (contractual necessity).
- **Customer support**: To respond to enquiries and resolve disputes (legitimate interest).
- **Marketing**: Promotional emails and SMS are sent only with your consent, which you may withdraw at any time.
- **Legal compliance**: We retain order records as required by Nigerian tax and commercial law.

**4. How We Use Your Data**
- Process and deliver your orders
- Send order confirmations and delivery updates
- Respond to your customer service requests
- Improve our website and services (analytics, with consent)
- Send promotional offers (only with consent)

We do not sell, rent, or trade your personal data to third parties for their own marketing purposes.

**5. Third-Party Processors**
We share your data only with trusted partners necessary to operate our business:
- **Paystack** (payment processing) — paystack.com/privacy
- **Supabase** (database hosting) — supabase.com/privacy
- **Google Analytics** (website analytics, with consent)
- **Meta / Facebook Pixel** (advertising, with consent)
- **TikTok Pixel** (advertising, with consent)
- **Microsoft Clarity** (session analytics, with consent)
- **Courier partners** (order delivery — your name, address, and phone only)

All processors are bound by data processing agreements and may not use your data for any other purpose.

**6. Your Rights Under the NDPA 2023**
As a data subject, you have the right to:
- **Access** — request a copy of the personal data we hold about you
- **Rectification** — ask us to correct inaccurate or incomplete data
- **Erasure** — request deletion of your data (subject to legal retention obligations)
- **Portability** — receive your data in a structured, machine-readable format
- **Objection** — object to processing based on legitimate interest
- **Restriction** — ask us to restrict processing of your data
- **Withdraw consent** — at any time, for any consent-based processing (e.g. marketing, analytics cookies)

To exercise any of these rights, email us at ${client.email} with the subject line "Data Subject Request". We will respond within 30 days. If you are not satisfied with our response, you may lodge a complaint with the Nigeria Data Protection Commission (NDPC) at ndpc.gov.ng.

**7. Cookies & Tracking**
We use the following categories of cookies:
- **Necessary cookies**: Essential for the website to function (cart, checkout, authentication). Always active.
- **Analytics cookies**: Help us understand how visitors use our site (Google Analytics, Microsoft Clarity). Active only with your consent.
- **Marketing cookies**: Used to measure the effectiveness of our advertising (Meta Pixel, TikTok Pixel). Active only with your consent.

You can manage your cookie preferences at any time using the "Cookie Settings" option in our website footer.

**8. Data Retention**
We retain order and customer records for a minimum of 6 years as required by the Companies and Allied Matters Act (CAMA) and FIRS tax obligations. Analytics and marketing data is retained for no longer than 26 months. You may request earlier deletion of your personal data subject to our legal obligations.

**9. Data Security**
We implement appropriate technical and organisational measures to protect your data, including SSL/TLS encryption, access controls, and regular security reviews. In the event of a data breach affecting your rights, we will notify you and the NDPC within 72 hours as required by law.

**10. Changes to This Policy**
We may update this policy from time to time. Material changes will be communicated by email or a prominent notice on our website. Your continued use of our services after changes constitutes acceptance of the updated policy.

**11. Contact**
For any data protection questions or to exercise your rights:
${client.name}, ${client.address}
Email: ${client.email}
Phone: ${client.phone || 'See contact page'}`
}

export function terms(client) {
  return `**Terms & Conditions — ${client.name}**
Last updated: 1 October 2025

By accessing and using ${client.name}, you accept and agree to be bound by these Terms and Conditions. Please read them carefully before placing an order.

**1. Use of the Website**
You must be at least 18 years old to make purchases. You agree to use this website only for lawful purposes and in a manner that does not infringe the rights of others.

**2. Product Descriptions**
We strive to display products as accurately as possible. Colours may vary slightly due to screen settings. We reserve the right to limit quantities and to correct errors in product descriptions or pricing.

**3. Pricing**
All prices are in Nigerian Naira (₦) and are subject to change without notice. The price at the time of your order will be honoured.

**4. Orders & Payment**
By placing an order, you represent that the information you provide is accurate and complete. We reserve the right to refuse or cancel any order. Payment must be received in full before goods are dispatched.

**5. Delivery**
Delivery timeframes are estimates and not guaranteed. Risk of loss passes to you upon delivery. We are not responsible for delays caused by courier services or circumstances beyond our control.

**6. Returns & Refunds**
Returns are accepted within 7 days of delivery for eligible items. Please see our Returns Policy at /pages/returns for full details.

**7. Intellectual Property**
All content on this website, including text, graphics, logos, and images, is the property of ${client.name} and is protected under applicable copyright law.

**8. Limitation of Liability**
${client.name} shall not be liable for any indirect, incidental, or consequential damages arising from your use of this website or our products.

**9. Data Protection**
Your personal data is processed in accordance with the Nigeria Data Protection Act (NDPA) 2023. Please see our Privacy Policy at /pages/privacy for full details.

**10. Governing Law**
These terms are governed by the laws of the Federal Republic of Nigeria. Disputes shall be resolved in Nigerian courts.

**11. Contact**
For questions about these terms, email us at ${client.email} or call ${client.phone || 'see the contact page'}.`
}
