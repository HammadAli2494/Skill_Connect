import { Link } from 'react-router-dom';
import { usePageMeta } from '../../utils/seo';

function DraftNotice({ missing }) {
  return (
    <aside className="border border-line bg-paper p-4 text-sm leading-6 text-ink">
      <p className="font-semibold">Reviewable draft</p>
      <p className="mt-2 text-muted">
        This page describes how the application works today. It is not a finished legal policy and does not claim legal compliance.
      </p>
      <p className="mt-2 text-muted">Still needed before this can be treated as a final policy:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
        {missing.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </aside>
  );
}

const MISSING = [
  'Legal entity name',
  'Postal address',
  'Contact email for privacy and account requests',
  'Governing jurisdiction',
  'How long account, booking, and upload records are kept',
];

export function PrivacyPage() {
  usePageMeta({
    title: 'Privacy policy draft',
    description: 'Draft description of the information Skill Connect collects and how accounts, cookies, and uploads work.',
    path: '/privacy-policy',
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-semibold text-forest">Skill Connect</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">Privacy policy</h1>
      <p className="mt-3 text-sm text-muted">Last reviewed with the current application behavior. Not a final policy.</p>
      <div className="mt-6">
        <DraftNotice missing={MISSING} />
      </div>
      <div className="mt-8 space-y-6 text-sm leading-6 text-ink">
        <section>
          <h2 className="font-serif text-2xl">What this service is</h2>
          <p className="mt-2 text-muted">
            Skill Connect is a marketplace for browsing service listings and sending booking requests. Customers and providers deal with each other through the site. The application does not take payments.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Information the app stores</h2>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-muted">
            <li>Account: name, email, a password hash, role, optional phone number, and whether the email address has been verified.</li>
            <li>Provider profile, when you offer services: business name, bio, years of experience, skills, city, service area, weekly hours, and a profile image if you upload one.</li>
            <li>Service listings: title, description, included items, price, pricing type, city, and images.</li>
            <li>Booking requests: the service, date, time, address line, area, city, notes, the price at the time of the request, status, and an optional cancellation reason.</li>
            <li>Reviews: a rating and comment, only after a booking is marked completed, and only once for that booking.</li>
            <li>Reports: a signed-in user can submit a reason about a listing. Administrators can review those reports.</li>
            <li>In-app notifications tied to account activity.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Why it is used</h2>
          <p className="mt-2 text-muted">
            The data is used to create your account, show listings, send and respond to booking requests, display reviews that actually exist, and let an administrator disable an account or hide a listing. The browser does not decide your role. The server reads the account stored for your session.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Session cookie</h2>
          <p className="mt-2 text-muted">
            After login, the API sets an HttpOnly cookie named accessToken. It holds the session and expires after 7 days. It is not stored in localStorage. In production the cookie is marked Secure and SameSite=None so a separate site and API host can send it. In local development it uses SameSite=Lax and is not marked Secure. Logging out clears the cookie.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Email and uploads</h2>
          <p className="mt-2 text-muted">
            Verification and password-reset messages are sent with Resend when that service is configured. If it is not configured, registration still works and the app says that email was not sent. In development, the link may be printed in the API console so the flow can be finished.
          </p>
          <p className="mt-2 text-muted">
            Profile and service images are uploaded through the API to Cloudinary when Cloudinary is configured. The API secret stays on the server. Without Cloudinary, uploads fail with an error and the rest of the site still runs. Listings without an image show a plain fallback.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Other services</h2>
          <p className="mt-2 text-muted">
            Account and marketplace records are stored in MongoDB. Images, when uploads are enabled, are stored by Cloudinary. Email, when enabled, is sent by Resend. The website and API are hosted separately. This draft does not name a hosting company because that choice is part of deployment, not the application itself.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">What you can change</h2>
          <p className="mt-2 text-muted">
            Signed-in customers and providers can update their name and phone number, change their password, resend a verification email, and log out. There is no button in the app to delete an account. An administrator can disable an account, which stops that session from continuing. A specific retention or deletion period has not been set.
          </p>
        </section>
        <p>
          <Link to="/terms-and-conditions" className="font-semibold text-forest">Read the terms draft</Link>
        </p>
      </div>
    </article>
  );
}

export function TermsPage() {
  usePageMeta({
    title: 'Terms and conditions draft',
    description: 'Draft terms for using Skill Connect to list services and send booking requests.',
    path: '/terms-and-conditions',
  });

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm font-semibold text-forest">Skill Connect</p>
      <h1 className="mt-2 font-serif text-4xl text-ink">Terms and conditions</h1>
      <p className="mt-3 text-sm text-muted">Last reviewed with the current application behavior. Not a final policy.</p>
      <div className="mt-6">
        <DraftNotice missing={MISSING} />
      </div>
      <div className="mt-8 space-y-6 text-sm leading-6 text-ink">
        <section>
          <h2 className="font-serif text-2xl">Role of the platform</h2>
          <p className="mt-2 text-muted">
            Skill Connect lets customers find a listing and send a booking request, and lets providers publish services and respond. The site is not the person doing the job. It does not take payment, issue refunds, insure work, or check a provider's identity beyond the account they create.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Accounts</h2>
          <p className="mt-2 text-muted">
            Public registration offers a customer account or a provider account. Administrator accounts are not created from the public form. Each email address can be used once. You are responsible for the password on your account. The server rejects actions that do not match your role or a record you own.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Listings</h2>
          <p className="mt-2 text-muted">
            Providers describe their own services, prices, cities, and images. A listing can be deactivated by its provider or hidden by an administrator. Sample listings, when present, are labeled Demo listing and are not live offers. Do not present a sample as your own work.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Booking requests</h2>
          <p className="mt-2 text-muted">
            Sending a request does not start the job. The request stays pending until the provider accepts or rejects it. A customer can cancel a pending or accepted request. After acceptance, the provider can mark the job in progress and then completed. Other status changes are refused.
          </p>
          <p className="mt-2 text-muted">
            Choose a time at least one hour ahead and no more than 60 days ahead. A provider cannot accept a time that is already accepted or in progress. The price saved on the request is the price at that moment. A later change to the listing price does not rewrite it.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Reviews</h2>
          <p className="mt-2 text-muted">
            A customer can leave one review after a booking is completed. Listings and providers without reviews show "No reviews yet". The site does not add ratings, review counts, or completed-job totals that are not stored from real activity.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">Prohibited use</h2>
          <p className="mt-2 text-muted">
            Do not use another person's account, try to read or change a booking or listing you do not own, or submit a report or listing for a purpose other than describing a real problem or a real service. Administrators can disable users, hide listings, manage categories, and review reports.
          </p>
        </section>
        <section>
          <h2 className="font-serif text-2xl">What is not offered</h2>
          <p className="mt-2 text-muted">
            The application does not process payments, refunds, or payouts. It does not promise that a provider will accept a request, that work will be completed, or that support is available at all hours. Disputes about the work itself are between the customer and the provider. The product has a report form and an admin review screen. It does not have a separate dispute or refund process.
          </p>
        </section>
        <p>
          <Link to="/privacy-policy" className="font-semibold text-forest">Read the privacy draft</Link>
        </p>
      </div>
    </article>
  );
}
