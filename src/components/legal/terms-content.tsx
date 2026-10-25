import { H, P, UL, Warn } from "./bits"
import { COMPANY_NAME, CONTACT_EMAIL, JURISDICTION_CITY, PIRACY_DAMAGES_TEXT, SITE_URL, TERMS_VERSION } from "@/lib/legal"

export function TermsContent() {
  const courts = JURISDICTION_CITY ? `the courts at ${JURISDICTION_CITY}, India` : "the competent courts in India"
  return (
    <div>
      <p className="text-xs text-muted-foreground">Version {TERMS_VERSION} · Applies to {SITE_URL}, the {COMPANY_NAME} app and every related service.</p>

      <H>1. Agreement</H>
      <P>By creating an account or using {COMPANY_NAME} (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the Company&rdquo;) you agree to these Terms and to our Privacy Policy. If you do not agree, please do not sign up. This is a legally binding electronic contract under the Information Technology Act, 2000 and the Indian Contract Act, 1872.</P>

      <H>2. Who can use {COMPANY_NAME}</H>
      <UL>
        <li>{COMPANY_NAME} is an exam-preparation platform for medical students and graduates. You must be 18 or older, or use it with the consent of a parent or guardian.</li>
        <li>Give true details (name, mobile number, college, year). Keep your password private. You are responsible for everything done through your account.</li>
        <li>One account is for one person. Sharing, selling, renting or lending an account is not allowed.</li>
      </UL>

      <H>3. Your licence to use the content</H>
      <P>All notes, mind maps, flashcards, question banks, previous-year question explanations, long answers, case presentations, OSCE stations, images, AI tutor responses, software and design on {COMPANY_NAME} belong to the Company or its licensors and are protected by the Copyright Act, 1957 and other laws. We give you a personal, limited, non-transferable, non-exclusive, revocable licence to view and study this content inside the platform, for your own exam preparation only.</P>

      <H>4. Piracy, copying and sharing — strictly prohibited</H>
      <Warn>
        <strong>Zero tolerance.</strong> Copying, leaking or sharing our content is a serious offence. We monitor for it, and we will take strict legal action. The Company may claim compensation of up to <strong>{PIRACY_DAMAGES_TEXT}</strong> for each proven act of piracy or unauthorised distribution, in addition to the other remedies below.
      </Warn>
      <P>You must not, by any means (manual, screenshot, screen-recording, camera, script, bot, browser extension, scraping, AI or OCR tool):</P>
      <UL>
        <li>copy, download, photograph, record, print, translate, summarise, re-type or reproduce our content in bulk, or outside normal personal study;</li>
        <li>upload, forward or post our content, or any part of it, on WhatsApp, Telegram, Discord, Google Drive, Mega, YouTube, Instagram, social media, file-sharing sites, other apps or any group or channel;</li>
        <li>sell, resell, rent, lease, gift, publish, or use our content in any other product, course, app, website, test series, model training or dataset, free or paid;</li>
        <li>share your login, OTP or session with anyone, or use one account on many people&apos;s devices;</li>
        <li>bypass or break any lock, paywall, plan limit, watermark, device limit or security feature, or access paid content without paying;</li>
        <li>help, encourage or reward anyone else to do any of the above.</li>
      </UL>
      <P><strong>Consequences.</strong> If we find or reasonably suspect a breach, we may, without notice and without refund: suspend or permanently terminate your account and all linked accounts; block your devices and numbers; send takedown notices to platforms and hosts; share the facts with your college or institution where needed to stop the leak; and begin civil and criminal proceedings.</P>
      <UL>
        <li><strong>Civil action:</strong> injunction, accounts of profits, damages and costs under Section 55 of the Copyright Act, 1957, and compensation under the Indian Contract Act, 1872. You agree that the loss from piracy of subscription content is hard to measure, and that compensation of up to {PIRACY_DAMAGES_TEXT} is a reasonable pre-estimate of the Company&apos;s loss and damage to goodwill. A court will decide the actual, reasonable amount.</li>
        <li><strong>Criminal action:</strong> infringement is an offence under Section 63 of the Copyright Act, 1957 (imprisonment from six months up to three years and a fine from ₹50,000 up to ₹2,00,000, with higher penalties for repeat offences), and may also attract the Information Technology Act, 2000 and the Bharatiya Nyaya Sanhita, 2023.</li>
        <li>You will also bear our reasonable legal and investigation costs.</li>
      </UL>
      <P>If you see pirated {COMPANY_NAME} content anywhere, please report it to {CONTACT_EMAIL}. We keep reporters&apos; identity confidential.</P>

      <H>5. Plans, payments and refunds</H>
      <UL>
        <li>Some features are free and some need a paid plan. Prices, validity and what each plan includes are shown on the Pricing page at the time you buy. Taxes are included or shown separately as required by law.</li>
        <li>Payments are processed by Razorpay. We never see or store your card, UPI PIN or net-banking details.</li>
        <li>A plan gives access until its expiry date. Because digital content is available to you immediately, fees are non-refundable once access has started, except where the law requires a refund or we decide otherwise in writing. If you were charged twice or by mistake, write to us within 7 days.</li>
        <li>We may change prices and plans for future purchases. We will not reduce what you have already paid for during its validity period.</li>
      </UL>

      <H>6. AI features and medical disclaimer</H>
      <UL>
        <li>The AI tutor, Jelly, OSCE simulations, summaries and flashcard generators are learning aids. They can make mistakes. Verify important facts with your standard textbooks and faculty.</li>
        <li>{COMPANY_NAME} is for education only. It is not medical advice, and it must never be used to diagnose or treat a real patient or to make clinical decisions.</li>
        <li>AI features may have fair-use limits. Do not use them to create harmful, illegal, abusive or misleading content, and do not try to extract our prompts, models or content through them.</li>
      </UL>

      <H>7. Your content</H>
      <P>Notes, questions or files you upload (for example your own PDFs) remain yours. You allow us to store and process them only to give you the feature you used. You promise you have the right to upload them and that they do not infringe anyone&apos;s rights.</P>

      <H>8. Acceptable use</H>
      <UL>
        <li>No hacking, probing, overloading or reverse-engineering the platform; no malware; no automated access without our written permission.</li>
        <li>No harassment, hate speech, impersonation or false information.</li>
        <li>No attempts to cheat the referral or affiliate programme (fake or self-referrals, bots, duplicate accounts). Rewards obtained this way will be cancelled.</li>
      </UL>

      <H>9. Messages and WhatsApp</H>
      <P>We will send essential service messages (account, payment, security, important changes) by email or in-app. We message you on WhatsApp for updates, study reminders and offers only if you separately tick the WhatsApp consent box. You can say STOP at any time, or write to us, and we will stop.</P>

      <H>10. Suspension and termination</H>
      <P>You may stop using {COMPANY_NAME} and ask us to delete your account at any time. We may suspend or end your access if you break these Terms, misuse the platform or the law requires it. Sections 4, 11, 12 and 13 continue after termination.</P>

      <H>11. Limitation of liability</H>
      <P>The platform is provided &ldquo;as is&rdquo;. We work hard on accuracy and uptime but cannot promise that content is error-free, that the service will be uninterrupted, or any particular exam result. To the extent allowed by law, our total liability to you for any claim is limited to the amount you paid us in the 12 months before the claim. We are not liable for indirect or consequential loss. Nothing here limits liability that cannot lawfully be limited.</P>

      <H>12. Changes to these Terms</H>
      <P>We may update these Terms. When the changes are important we will tell you in the app or by email and ask you to accept again. Continuing to use {COMPANY_NAME} after the notice means you accept the new Terms.</P>

      <H>13. Governing law and disputes</H>
      <P>These Terms are governed by the laws of India. Disputes will be decided by {courts}. Before going to court, please write to us at {CONTACT_EMAIL}; we will try to resolve the matter within 30 days.</P>

      <H>14. Contact and grievances</H>
      <P>Questions, complaints or copyright notices: {CONTACT_EMAIL}. We acknowledge within 48 hours and aim to resolve within 30 days.</P>
    </div>
  )
}
