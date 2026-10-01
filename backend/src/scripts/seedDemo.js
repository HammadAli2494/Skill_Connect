import bcrypt from 'bcryptjs';
import { Category } from '../models/Category.js';
import { ProviderProfile } from '../models/ProviderProfile.js';
import { Service } from '../models/Service.js';
import { User } from '../models/User.js';
import { connectDb, disconnectDb } from '../config/db.js';
import { assertEnv } from '../config/env.js';

const CATEGORIES = [
  ['Web development', 'web', 'Small websites and landing pages'],
  ['Graphic design', 'design', 'Logos, posters, and social graphics'],
  ['Video editing', 'video', 'Cuts, captions, and short videos'],
  ['Writing', 'writing', 'Articles, resumes, and web copy'],
  ['Tutoring', 'tutoring', 'School subjects and exam practice'],
  ['Home services', 'home', 'Cleaning, repairs, and household help'],
  ['Business support', 'business', 'Admin, research, and bookkeeping help'],
  ['Photography', 'photo', 'Portraits and small events'],
];

const WEEKDAY = [{ start: '09:00', end: '17:00' }];
const AVAILABILITY = {
  monday: WEEKDAY,
  tuesday: WEEKDAY,
  wednesday: WEEKDAY,
  thursday: WEEKDAY,
  friday: WEEKDAY,
  saturday: WEEKDAY,
  sunday: [],
};

const PROVIDERS = [
  {
    email: 'demo.studio@skillconnect.demo',
    name: 'Demo Studio',
    businessName: 'Demo Studio',
    city: 'Lahore',
    bio: 'Sample provider profile for the portfolio demo. These listings are not a real studio.',
    skills: ['Websites', 'Logos', 'Short video'],
    serviceArea: ['Gulberg', 'Model Town'],
  },
  {
    email: 'demo.desk@skillconnect.demo',
    name: 'Demo Desk',
    businessName: 'Demo Desk',
    city: 'Karachi',
    bio: 'Sample provider profile for writing and business-support listings. Not a real agency.',
    skills: ['Copy', 'Research', 'Admin'],
    serviceArea: ['Clifton', 'Saddar'],
  },
  {
    email: 'demo.tutor@skillconnect.demo',
    name: 'Demo Tutor',
    businessName: 'Demo Tutor',
    city: 'Islamabad',
    bio: 'Sample tutoring profile used to show booking. Not a real tutor.',
    skills: ['Maths', 'English'],
    serviceArea: ['F-8', 'G-10'],
  },
  {
    email: 'demo.home@skillconnect.demo',
    name: 'Demo Home',
    businessName: 'Demo Home Services',
    city: 'Lahore',
    bio: 'Sample home-services profile. Not a real tradesperson.',
    skills: ['Cleaning', 'Repairs', 'Portraits'],
    serviceArea: ['Johar Town', 'DHA'],
  },
];

const SERVICES = [
  ['demo.studio@skillconnect.demo', 'web', 'One-page business site', 'A sample listing for a single marketing page with contact details and a clear layout.', 'Typical turnaround in this sample is 7 days. This is not an offer from a real developer.', ['Page structure', 'Contact section', 'Mobile layout'], 18000, 'starting_at', 'Lahore', '/demo/web.svg'],
  ['demo.studio@skillconnect.demo', 'web', 'Landing page updates', 'A sample listing for copy and layout changes on an existing landing page.', 'Typical turnaround in this sample is 3 days.', ['Content edits', 'Section layout', 'Basic checks'], 8000, 'fixed', 'Lahore', '/demo/web.svg'],
  ['demo.studio@skillconnect.demo', 'web', 'Small shop catalogue page', 'A sample listing for one catalogue page that lists products and prices.', 'Typical turnaround in this sample is 5 days.', ['Product grid', 'Price list', 'Enquiry link'], 12000, 'fixed', 'Karachi', '/demo/web.svg'],
  ['demo.studio@skillconnect.demo', 'design', 'Logo sketch set', 'A sample listing for three simple logo directions for a new local business.', 'Typical turnaround in this sample is 4 days.', ['Three sketches', 'One revision', 'PNG export'], 7000, 'fixed', 'Lahore', '/demo/design.svg'],
  ['demo.studio@skillconnect.demo', 'design', 'Social post templates', 'A sample listing for a small set of square social graphics.', 'Typical turnaround in this sample is 3 days.', ['Four templates', 'Editable text', 'Export files'], 4500, 'fixed', 'Islamabad', '/demo/design.svg'],
  ['demo.studio@skillconnect.demo', 'design', 'Event poster', 'A sample listing for one printed-style poster for a local event.', 'Typical turnaround in this sample is 2 days.', ['One size', 'Print-ready file', 'One revision'], 3500, 'fixed', 'Lahore', '/demo/design.svg'],
  ['demo.studio@skillconnect.demo', 'video', 'Short video cut', 'A sample listing for cutting a short clip and adding simple captions.', 'Typical turnaround in this sample is 3 days.', ['Up to 60 seconds', 'Captions', 'One revision'], 6000, 'fixed', 'Lahore', '/demo/video.svg'],
  ['demo.studio@skillconnect.demo', 'video', 'Talking-head cleanup', 'A sample listing for trimming pauses from a recorded explanation.', 'Typical turnaround in this sample is 2 days.', ['Trim', 'Basic audio', 'Export'], 5000, 'starting_at', 'Karachi', '/demo/video.svg'],
  ['demo.desk@skillconnect.demo', 'writing', 'Service page copy', 'A sample listing for a clear page that explains one local service.', 'Typical turnaround in this sample is 2 days.', ['About 400 words', 'Headline options', 'One revision'], 3000, 'fixed', 'Karachi', '/demo/writing.svg'],
  ['demo.desk@skillconnect.demo', 'writing', 'Resume edit', 'A sample listing for rewriting a one-page resume into plain language.', 'Typical turnaround in this sample is 2 days.', ['Structure', 'Wording', 'One revision'], 2500, 'fixed', 'Lahore', '/demo/writing.svg'],
  ['demo.desk@skillconnect.demo', 'writing', 'Blog outline and draft', 'A sample listing for an outline plus a short draft on a practical topic.', 'Typical turnaround in this sample is 4 days.', ['Outline', 'Draft', 'One revision'], 5500, 'fixed', 'Islamabad', '/demo/writing.svg'],
  ['demo.desk@skillconnect.demo', 'business', 'Inbox and calendar tidy', 'A sample listing for sorting a week of email and proposing a simple calendar.', 'This sample is booked as a two-hour block.', ['Sort mail', 'Draft replies', 'Calendar notes'], 2000, 'hourly', 'Karachi', '/demo/business.svg'],
  ['demo.desk@skillconnect.demo', 'business', 'Competitor notes', 'A sample listing for a short brief comparing three local competitors.', 'Typical turnaround in this sample is 3 days.', ['Three businesses', 'Price notes', 'One-page brief'], 4000, 'fixed', 'Karachi', '/demo/business.svg'],
  ['demo.desk@skillconnect.demo', 'business', 'Invoice spreadsheet setup', 'A sample listing for a simple spreadsheet to track invoices.', 'Typical turnaround in this sample is 1 day.', ['Columns', 'Totals', 'Short instructions'], 2800, 'fixed', 'Lahore', '/demo/business.svg'],
  ['demo.tutor@skillconnect.demo', 'tutoring', 'Secondary maths session', 'A sample listing for a one-hour maths session. Book an open slot.', 'Each booking is one hour inside the sample hours.', ['One hour', 'Practice questions', 'Session notes'], 1500, 'hourly', 'Islamabad', '/demo/tutoring.svg'],
  ['demo.tutor@skillconnect.demo', 'tutoring', 'English writing practice', 'A sample listing for a one-hour session on paragraphs and essays.', 'Each booking is one hour.', ['One hour', 'One writing task', 'Feedback'], 1500, 'hourly', 'Islamabad', '/demo/tutoring.svg'],
  ['demo.tutor@skillconnect.demo', 'tutoring', 'Exam revision plan', 'A sample listing for a session that turns a syllabus into a weekly plan.', 'Each booking is one hour.', ['Topic list', 'Weekly plan', 'Practice set'], 2000, 'fixed', 'Lahore', '/demo/tutoring.svg'],
  ['demo.home@skillconnect.demo', 'home', 'Apartment cleaning visit', 'A sample listing for a basic apartment clean. Not a real cleaning company.', 'The sample slot is one hour. A real clean may take longer.', ['Floors', 'Kitchen surfaces', 'Bathroom surfaces'], 2500, 'starting_at', 'Lahore', '/demo/home.svg'],
  ['demo.home@skillconnect.demo', 'home', 'Furniture assembly help', 'A sample listing for assembling one flat-pack item.', 'The sample slot is one hour.', ['One item', 'Basic tools', 'Packaging removal'], 2000, 'starting_at', 'Lahore', '/demo/home.svg'],
  ['demo.home@skillconnect.demo', 'home', 'Minor home repair visit', 'A sample listing for a visit to look at one small household fault.', 'The sample slot is one hour and does not include parts.', ['Inspection', 'Simple fix if possible', 'Parts note'], 1800, 'starting_at', 'Karachi', '/demo/home.svg'],
  ['demo.home@skillconnect.demo', 'photo', 'Portrait session', 'A sample listing for a short outdoor portrait session.', 'The sample slot is one hour. Edited files are described as a 5-day sample turnaround.', ['One hour', '10 edited images', 'Online delivery'], 8000, 'fixed', 'Lahore', '/demo/photo.svg'],
  ['demo.home@skillconnect.demo', 'photo', 'Small event coverage', 'A sample listing for two hours of coverage at a small gathering.', 'This sample is booked as one slot and describes a two-hour visit.', ['Two hours', 'Candid set', 'Online gallery'], 15000, 'starting_at', 'Islamabad', '/demo/photo.svg'],
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO !== 'true') {
  console.error('Refusing demo seed in production. Set SEED_DEMO=true only for a deliberate demo database.');
  process.exit(1);
}

const providerPassword = process.env.DEMO_PROVIDER_PASSWORD || '';
const customerPassword = process.env.DEMO_CUSTOMER_PASSWORD || '';
if (providerPassword.length < 8) {
  console.error('Set DEMO_PROVIDER_PASSWORD in the environment (at least 8 characters). No default password is used.');
  process.exit(1);
}

assertEnv();
await connectDb();

const passwordHash = await bcrypt.hash(providerPassword, 12);
const providerIds = new Map();

for (const provider of PROVIDERS) {
  let user = await User.findOne({ email: provider.email });
  if (user && user.role !== 'provider') {
    console.log(`Skipped ${provider.email} because that email already belongs to a ${user.role}.`);
    continue;
  }
  if (!user) {
    user = await User.create({
      name: provider.name,
      email: provider.email,
      passwordHash,
      role: 'provider',
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`Created demo provider ${provider.email}`);
  } else {
    console.log(`Demo provider already exists: ${provider.email}. Account was left unchanged.`);
  }
  providerIds.set(provider.email, user._id);

  const profile = await ProviderProfile.findOne({ user: user._id });
  if (!profile) {
    await ProviderProfile.create({
      user: user._id,
      businessName: provider.businessName,
      bio: provider.bio,
      experienceYears: 0,
      skills: provider.skills,
      city: provider.city,
      serviceArea: provider.serviceArea,
      availability: AVAILABILITY,
      averageRating: 0,
      reviewCount: 0,
      completedJobs: 0,
    });
  }
}

for (const [name, icon, description] of CATEGORIES) {
  const slug = slugify(name);
  await Category.updateOne(
    { slug },
    { $setOnInsert: { name, slug, icon, description, isActive: true } },
    { upsert: true }
  );
}

let created = 0;
let skipped = 0;
for (const [email, categorySlug, title, summary, detail, included, price, pricingType, city, image] of SERVICES) {
  const providerId = providerIds.get(email);
  const category = await Category.findOne({ slug: categorySlug });
  if (!providerId || !category) {
    skipped += 1;
    continue;
  }
  const existing = await Service.findOne({ provider: providerId, title });
  if (existing) {
    skipped += 1;
    continue;
  }
  await Service.create({
    provider: providerId,
    category: category._id,
    title,
    description: `${summary} ${detail} This is a demo listing for the SkillConnect portfolio, not a live offer.`,
    whatsIncluded: included,
    price,
    pricingType,
    city,
    images: [{ url: image, publicId: '' }],
    isActive: true,
    isDemo: true,
  });
  created += 1;
}

if (customerPassword.length >= 8) {
  const customerEmail = 'demo.customer@skillconnect.demo';
  const existingCustomer = await User.findOne({ email: customerEmail });
  if (!existingCustomer) {
    await User.create({
      name: 'Demo Customer',
      email: customerEmail,
      passwordHash: await bcrypt.hash(customerPassword, 12),
      role: 'customer',
      isEmailVerified: true,
      isActive: true,
    });
    console.log(`Created demo customer ${customerEmail}`);
  } else {
    console.log(`Demo customer already exists: ${customerEmail}. Account was left unchanged.`);
  }
} else {
  console.log('Skipped demo customer. Set DEMO_CUSTOMER_PASSWORD to create demo.customer@skillconnect.demo.');
}

console.log(`Demo seed finished. Created ${created} services, skipped ${skipped} existing or unmatched rows.`);
console.log('Demo provider emails: demo.studio@skillconnect.demo, demo.desk@skillconnect.demo, demo.tutor@skillconnect.demo, demo.home@skillconnect.demo');
console.log('Passwords were taken from DEMO_PROVIDER_PASSWORD and are not printed.');
await disconnectDb();
