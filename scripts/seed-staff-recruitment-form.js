// @ts-check
/**
 * Seed script: Official Staff Recruitment Form
 * Run with: node scripts/seed-staff-recruitment-form.js
 *
 * Requires MONGODB_URI in your .env.local file.
 * Optional: set CREATED_BY_ID to your Discord user ID (defaults to ADMIN_DISCORD_IDS).
 */

// Force IPv4 DNS resolution (avoids querySrv ECONNREFUSED on IPv6-only DNS)
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
// Use public DNS servers so Node.js can resolve Atlas SRV records
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 16);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Error: MONGODB_URI environment variable is not set.');
  process.exit(1);
}

const CREATED_BY =
  process.env.CREATED_BY_ID ||
  (process.env.ADMIN_DISCORD_IDS
    ? process.env.ADMIN_DISCORD_IDS.split(',')[0].trim()
    : 'system');

// ---------- Inline schema (mirrors models/Form.ts) ----------
const formFieldSchema = new mongoose.Schema(
  {
    id:          { type: String },
    type:        { type: String },
    label:       { type: String },
    placeholder: { type: String },
    required:    { type: Boolean },
    options:     [String],
    order:       { type: Number },
    sectionId:   { type: String },
  },
  { _id: false }
);

const sectionSchema = new mongoose.Schema(
  {
    id:          { type: String },
    title:       { type: String },
    description: { type: String },
    order:       { type: Number },
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String },
    fields:      { type: [formFieldSchema], required: true },
    sections:    { type: [sectionSchema], default: [] },
    createdBy:   { type: String, required: true },
    isPublished: { type: Boolean, default: false },
    publicId:    { type: String, unique: true },
  },
  { timestamps: true }
);

const Form =
  mongoose.models.Form || mongoose.model('Form', formSchema);

// ---------- Form definition ----------
const formData = {
  title: 'Harsh Ka Server \u2014 Official Staff Recruitment Form',
  publicId: nanoid(),
  description:
    'Apply here for a chance to join the Harsh Ka Server staff team! ' +
    'Fill out this form to help us assess your suitability for the staff role. Good luck!\n\n' +
    'Important Note: Any submissions found to be frivolous, misleading, or submitted in bad faith ' +
    'will be summarily rejected. Kindly read the Server Rules before submitting this form.',
  isPublished: true,
  createdBy: CREATED_BY,
  sections: [
    {
      id:          'section_0',
      title:       'Important Note!!',
      description: 'Any submissions found to be frivolous, misleading, or submitted in bad faith will be summarily rejected. Kindly read Server Rules before submitting the form: #\u3002rules',
      order:       0,
    },
    { id: 'section_1', title: 'Enter Your Details',          description: '', order: 1 },
    { id: 'section_2', title: 'Role Selection & Experience', description: '', order: 2 },
  ],
  fields: [

    // ── Section 1: Enter Your Details ────────────────────────────────────────
    {
      id:          'field_discord_username_id',
      type:        'text',
      label:       'Your Discord Username & User ID',
      placeholder: 'e.g., harshkhelraay / 123456789012345678',
      required:    true,
      order:       0,
      sectionId:   'section_1',
    },
    {
      id:          'field_full_name',
      type:        'text',
      label:       'Your Full Name',
      placeholder: 'Enter your full name',
      required:    true,
      order:       1,
      sectionId:   'section_1',
    },
    {
      id:          'field_age_acknowledgement',
      type:        'radio',
      label:       'You must be 16 years old or above to apply. All roles are voluntary and unpaid. You will be contributing to the growth and safety of the community as a part of Harsh Ka Server. As a moderator, you\'ll be responsible for keeping the server safe and orderly, which includes reviewing and removing harmful or inappropriate content, resolving conflicts, and enforcing community guidelines. This role is not just about having a special title — it can involve handling stressful or serious situations. While moderation can be rewarding and help you develop leadership skills, it also requires maturity, responsibility, and emotional resilience. Do you acknowledge and accept this?',
      placeholder: '',
      required:    true,
      options:     ['Yes, I acknowledge and accept', 'No'],
      order:       2,
      sectionId:   'section_1',
    },
    {
      id:          'field_age',
      type:        'text',
      label:       'How old are you?',
      placeholder: 'Must be 16+ to apply',
      required:    true,
      order:       3,
      sectionId:   'section_1',
    },
    {
      id:          'field_device',
      type:        'radio',
      label:       'What device do you usually use Discord on?',
      placeholder: '',
      required:    true,
      options:     ['Mobile', 'PC / Desktop', 'Both Mobile & PC', 'Tablet'],
      order:       4,
      sectionId:   'section_1',
    },
    {
      id:          'field_2fa_enabled',
      type:        'radio',
      label:       'Is your Discord Authenticator (2FA) enabled?',
      placeholder: '',
      required:    true,
      options:     ['Yes', 'No'],
      order:       5,
      sectionId:   'section_1',
    },
    {
      id:          'field_mic_available',
      type:        'radio',
      label:       'Will you be able to use your Microphone during VC activities or discussions?',
      placeholder: '',
      required:    true,
      options:     ['Yes', 'No', 'Sometimes'],
      order:       6,
      sectionId:   'section_1',
    },
    {
      id:          'field_timezone_active_hours',
      type:        'text',
      label:       'Time Zone & Active Hours on Discord',
      placeholder: 'e.g. IST | Active from 5 PM – 10 PM daily',
      required:    true,
      order:       7,
      sectionId:   'section_1',
    },
    {
      id:          'field_vc_activity',
      type:        'radio',
      label:       'How active are you in server Voice Chat?',
      placeholder: '',
      required:    true,
      options:     ['Very Active', 'Moderately Active', 'Rarely', 'Never'],
      order:       8,
      sectionId:   'section_1',
    },
    {
      id:          'field_fluent_english',
      type:        'radio',
      label:       'Do you speak fluent English?',
      placeholder: '',
      required:    true,
      options:     ['Yes', 'Somewhat', 'No'],
      order:       9,
      sectionId:   'section_1',
    },
    {
      id:          'field_time_in_server',
      type:        'text',
      label:       'How long have you been in Harsh Ka Server?',
      placeholder: 'e.g., 6 months, 1 year',
      required:    true,
      order:       10,
      sectionId:   'section_1',
    },
    {
      id:          'field_time_on_discord',
      type:        'text',
      label:       'How long have you been on Discord?',
      placeholder: 'e.g., 2 years',
      required:    true,
      order:       11,
      sectionId:   'section_1',
    },

    // ── Section 2: Role Selection & Experience ───────────────────────────────
    {
      id:          'field_positions_applying',
      type:        'checkbox',
      label:       'Which position(s) are you applying for?',
      placeholder: '',
      required:    true,
      options:     ['Moderator', 'Trial Moderator', 'Event Staff', 'Support Staff', 'Other'],
      order:       12,
      sectionId:   'section_2',
    },
    {
      id:          'field_prior_experience',
      type:        'textarea',
      label:       'Do you have any prior experience in any of the selected roles?',
      placeholder: 'Describe any previous moderation or staff experience you have had.',
      required:    true,
      order:       13,
      sectionId:   'section_2',
    },
    {
      id:          'field_why_join_staff',
      type:        'textarea',
      label:       'Why do you want to join the staff team in Harsh Ka Server?',
      placeholder: 'Tell us your motivation for applying.',
      required:    true,
      order:       14,
      sectionId:   'section_2',
    },
    {
      id:          'field_skills_qualities',
      type:        'textarea',
      label:       'What skills or qualities make you suitable for this role?',
      placeholder: 'Highlight your strengths relevant to moderation or staff work.',
      required:    true,
      order:       15,
      sectionId:   'section_2',
    },
    {
      id:          'field_mod_bots_familiarity',
      type:        'textarea',
      label:       'Are you familiar with any moderation bots (e.g. Sapphire, Dyno, Raiden)? Which ones?',
      placeholder: 'List the bots you have used and briefly describe your experience with them.',
      required:    true,
      order:       16,
      sectionId:   'section_2',
    },
    {
      id:          'field_handle_situations',
      type:        'radio',
      label:       'Do you think you can handle different kinds of situations and cooperate with your co-staff members?',
      placeholder: '',
      required:    true,
      options:     ['Yes, absolutely', 'I will try my best', 'I am not sure'],
      order:       17,
      sectionId:   'section_2',
    },
    {
      id:          'field_overall_server_experience',
      type:        'textarea',
      label:       'Let us know about your overall experience in the server.',
      placeholder: 'Share your honest thoughts about the server community, channels, events, and anything else.',
      required:    true,
      order:       18,
      sectionId:   'section_2',
    },
  ],
};

// ---------- Main ----------
(async () => {
  try {
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    console.log('Connected to MongoDB.');

    const existing = await Form.findOne({ title: formData.title });
    if (existing) {
      console.log(
        `Form "${formData.title}" already exists (ID: ${existing._id}). Skipping insert.`
      );
      await mongoose.disconnect();
      process.exit(0);
    }

    const form = new Form(formData);
    await form.save();

    console.log(`\nForm created successfully!`);
    console.log(`  Title   : ${form.title}`);
    console.log(`  ID      : ${form._id}`);
    console.log(`  Fields  : ${form.fields.length}`);
    console.log(`  Sections: ${form.sections.length}`);
    console.log(`\nShare the form at: /forms/${form.publicId}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed form:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
})();