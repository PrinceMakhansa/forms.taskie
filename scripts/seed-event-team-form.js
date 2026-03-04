// @ts-check
/**
 * Seed script: Event Team Application Form
 * Run with: node scripts/seed-event-team-form.js
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
const formFieldSchema = new mongoose.Schema({
  id:          String,
  type:        String,
  label:       String,
  placeholder: String,
  required:    Boolean,
  options:     [String],
  order:       Number,
});

const formSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String },
    fields:      { type: [formFieldSchema], required: true },
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
  title:
    'Event Team Application Form',
  publicId: nanoid(),
  description:
    "Thank you for your interest in joining the Event Team on Harsh's server! " +
    'The Event Team plays a huge role in bringing exciting and fun experiences ' +
    'to our community. Please fill out the form below to apply for the role.',
  isPublished: true,
  createdBy: CREATED_BY,
  fields: [
    {
      id:          'field_discord_username',
      type:        'text',
      label:       'Discord Username',
      placeholder: 'e.g., User#1234',
      required:    true,
      order:       0,
    },
    {
      id:          'field_age',
      type:        'text',
      label:       'Age',
      placeholder: 'Must be 16+ to apply',
      required:    true,
      order:       1,
    },
    {
      id:          'field_availability',
      type:        'textarea',
      label:       'Availability',
      placeholder:
        "Let us know the days and times you're typically available to work on events.",
      required:    false,
      order:       2,
    },
    {
      id:          'field_why_join',
      type:        'textarea',
      label:       'Why do you want to join the Event Team?',
      placeholder:
        'Tell us what excites you about planning and hosting events in our community!',
      required:    false,
      order:       3,
    },
    {
      id:          'field_skills',
      type:        'textarea',
      label:       'Relevant Skills or Experience',
      placeholder:
        'List any skills or past experience with event planning, hosting, or team ' +
        'collaboration that you think would help you as an Event Team member.',
      required:    false,
      order:       4,
    },
    {
      id:          'field_event_ideas',
      type:        'textarea',
      label:       'Event Ideas',
      placeholder:
        'Share 1-2 event ideas you would like to help organize. Explain briefly how they would work.',
      required:    false,
      order:       5,
    },
    {
      id:          'field_community_engagement',
      type:        'textarea',
      label:       'How would you promote community engagement in events?',
      placeholder:
        'Explain how you would encourage more members to participate in events.',
      required:    false,
      order:       6,
    },
    {
      id:          'field_server_experience',
      type:        'textarea',
      label:       'Let us know about your overall experience in the server',
      placeholder: 'Share your overall experience in the server...',
      required:    true,
      order:       7,
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
      process.exit(0);
    }

    const form = new Form(formData);
    await form.save();

    console.log(`\nForm created successfully!`);
    console.log(`  Title : ${form.title}`);
    console.log(`  ID    : ${form._id}`);
    console.log(`  Fields: ${form.fields.length}`);
    console.log(
      `\nShare the form at: /forms/${form.publicId}`
    );

    process.exit(0);
  } catch (err) {
    console.error('Failed to seed form:', err);
    process.exit(1);
  }
})();
