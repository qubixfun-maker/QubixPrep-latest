import { H, P, UL } from "./bits"
import { COMPANY_NAME, CONTACT_EMAIL, PRIVACY_VERSION, SITE_URL } from "@/lib/legal"

export function PrivacyContent() {
  return (
    <div>
      <p className="text-xs text-muted-foreground">Version {PRIVACY_VERSION} · Applies to {SITE_URL} and the {COMPANY_NAME} app. We follow the Digital Personal Data Protection Act, 2023 and the Information Technology Act, 2000.</p>

      <H>1. Our promise</H>
      <P><strong>Your data is used only by {COMPANY_NAME}, only to run the platform and to benefit you. We never sell your personal data and never share it with advertisers or data brokers.</strong></P>

      <H>2. What we collect</H>
      <UL>
        <li><strong>Account details:</strong> name, email, mobile number, college, year of study, profile photo (if you sign in with Google), referral code.</li>
        <li><strong>Study activity:</strong> questions answered, scores, streaks, flashcard and note progress, bookmarks, weak topics, test and OSCE results.</li>
        <li><strong>Things you give the AI:</strong> your questions, voice-practice speech sent for transcription, and files you upload (for example PDFs for question banks).</li>
        <li><strong>Payment status:</strong> which plan you bought, its validity, and the Razorpay order/payment ID. Card, UPI and bank details go to Razorpay and are never stored by us.</li>
        <li><strong>Technical data:</strong> device and browser type, IP address, error logs, security signals (used to stop account sharing and piracy).</li>
        <li><strong>Consent records:</strong> the version and time you accepted the Terms, Privacy Policy and (if you chose) WhatsApp messages.</li>
      </UL>

      <H>3. Why we use it</H>
      <UL>
        <li>To create your account, sign you in and keep it secure.</li>
        <li>To personalise your study: dashboard, streaks, revision suggestions, weak-area analysis.</li>
        <li>To run paid plans, referrals and affiliate rewards.</li>
        <li>To send service messages and, only if you agreed, WhatsApp study updates and offers.</li>
        <li>To prevent piracy, account sharing, fraud and abuse, and to improve the platform.</li>
      </UL>

      <H>4. Who it is shared with</H>
      <P>Inside {COMPANY_NAME}, only the people who need it to run the service can see it. We use trusted service providers (&ldquo;processors&rdquo;) that handle data only on our instructions, for the purpose of running the platform for you:</P>
      <UL>
        <li>Google Firebase / Google Cloud — sign-in, database, hosting, storage;</li>
        <li>Neon — database hosting;</li>
        <li>Razorpay — payments;</li>
        <li>OpenAI and Google AI — to generate AI answers, voice and transcriptions you request (the text or audio you send to these features is shared with them for that request only);</li>
        <li>Meta / WhatsApp — only if you opted in to WhatsApp messages.</li>
      </UL>
      <P>Some of these providers keep servers outside India. We share data outside these providers only if the law or a court orders us to, or to protect our legal rights. If the business is ever sold or merged, your data would move to the new owner who must honour this policy.</P>

      <H>5. Your choices and rights</H>
      <UL>
        <li>See and correct your details on the Profile page.</li>
        <li>Ask for a copy, correction or deletion of your data, or withdraw any consent, by writing to {CONTACT_EMAIL}. Withdrawing the WhatsApp consent never affects your access to the platform.</li>
        <li>Nominate someone to exercise your rights if you cannot, as the DPDP Act allows.</li>
        <li>Complain to us first; if unresolved you may approach the Data Protection Board of India.</li>
      </UL>

      <H>6. How long we keep it</H>
      <P>We keep your data while your account is active and for a reasonable period afterwards for legal, tax, fraud-prevention and dispute purposes. When you ask us to delete your account we erase or anonymise personal data, except what the law requires us to retain (for example payment records).</P>

      <H>7. Security</H>
      <P>We use encrypted connections, access rules on our database, and limit who can see data. No system is perfectly secure; if a breach affecting you occurs we will inform you and the authorities as the law requires.</P>

      <H>8. Children</H>
      <P>{COMPANY_NAME} is meant for adults preparing for medical exams. If you are under 18, use it only with a parent or guardian&apos;s consent; they may write to us to review or delete your data.</P>

      <H>9. Cookies and local storage</H>
      <P>We use cookies and browser storage that are needed for sign-in, security and remembering your preferences. We do not use them to show third-party ads.</P>

      <H>10. Changes and contact</H>
      <P>If this policy changes in an important way we will notify you and ask for fresh consent where required. Contact and grievance officer: {CONTACT_EMAIL}.</P>
    </div>
  )
}
