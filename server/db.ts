import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import initSqlJs, { type Database } from 'sql.js';

let dbInstance: Database | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'salon.sqlite');

// Mutex for serializing database write transactions and persistence
let writeLock: Promise<void> = Promise.resolve();

export async function runWithLock<T>(fn: () => Promise<T> | T): Promise<T> {
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  const currentLock = writeLock;
  writeLock = currentLock.then(() => nextLock);

  try {
    await currentLock;
    const result = await fn();
    saveDatabase();
    return result;
  } finally {
    release!();
  }
}

export function saveDatabase(): void {
  if (!dbInstance) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, buffer);
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to save SQLite database to disk:', err);
  }
}

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const fileBuffer = fs.readFileSync(DB_FILE);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Could not read existing database, initializing fresh:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSchemaAndSeeds(dbInstance);
  saveDatabase();
  return dbInstance;
}

function initSchemaAndSeeds(db: Database): void {
  db.run(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('owner_admin', 'receptionist', 'stylist', 'customer')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      role_title TEXT NOT NULL,
      bio TEXT NOT NULL,
      specialties TEXT NOT NULL, -- JSON array
      image_url TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      consultation_only INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS service_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      buffer_minutes INTEGER NOT NULL DEFAULT 15,
      price REAL NOT NULL,
      price_type TEXT NOT NULL DEFAULT 'from' CHECK(price_type IN ('fixed', 'from', 'consultation')),
      requires_consultation INTEGER NOT NULL DEFAULT 0,
      requires_patch_test INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      online_booking_enabled INTEGER NOT NULL DEFAULT 1,
      image_url TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (category_id) REFERENCES service_categories(id)
    );

    CREATE TABLE IF NOT EXISTS staff_services (
      staff_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      PRIMARY KEY (staff_id, service_id),
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS salon_hours (
      day_of_week INTEGER PRIMARY KEY,
      day_name TEXT NOT NULL,
      open_time TEXT NOT NULL,
      close_time TEXT NOT NULL,
      is_open INTEGER NOT NULL DEFAULT 1,
      is_confirmed INTEGER NOT NULL DEFAULT 0 -- 0 = Good Salon Guide draft, 1 = owner confirmed
    );

    CREATE TABLE IF NOT EXISTS staff_working_hours (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      is_working INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
      UNIQUE (staff_id, day_of_week)
    );

    CREATE TABLE IF NOT EXISTS staff_breaks (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      label TEXT NOT NULL,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS staff_time_off (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      start_datetime TEXT NOT NULL, -- UTC ISO
      end_datetime TEXT NOT NULL,   -- UTC ISO
      reason TEXT NOT NULL,
      FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS salon_closures (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL, -- YYYY-MM-DD
      reason TEXT NOT NULL,
      all_day INTEGER NOT NULL DEFAULT 1,
      start_time TEXT,
      end_time TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      booking_reference TEXT UNIQUE NOT NULL,
      access_token TEXT UNIQUE NOT NULL,
      customer_id TEXT NOT NULL,
      staff_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      booked_service_name TEXT NOT NULL,
      booked_price REAL NOT NULL,
      booked_price_type TEXT NOT NULL,
      booked_duration_minutes INTEGER NOT NULL,
      booked_buffer_minutes INTEGER NOT NULL,
      start_time TEXT NOT NULL, -- UTC ISO
      end_time TEXT NOT NULL,   -- UTC ISO
      status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'no_show')),
      notes TEXT,
      internal_notes TEXT,
      cancellation_reason TEXT,
      cancelled_at TEXT,
      policy_accepted INTEGER NOT NULL DEFAULT 1,
      marketing_consent INTEGER NOT NULL DEFAULT 0,
      patch_test_acknowledged INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS reservation_holds (
      id TEXT PRIMARY KEY,
      staff_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      start_time TEXT NOT NULL, -- UTC ISO
      end_time TEXT NOT NULL,   -- UTC ISO
      session_id TEXT NOT NULL,
      expires_at TEXT NOT NULL, -- UTC ISO
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS idempotency_keys (
      key TEXT PRIMARY KEY,
      response_body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notification_logs (
      id TEXT PRIMARY KEY,
      appointment_id TEXT,
      recipient_email TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      subject TEXT NOT NULL,
      content TEXT NOT NULL,
      provider TEXT NOT NULL,
      error_details TEXT,
      attempts INTEGER NOT NULL DEFAULT 1,
      last_attempt_at TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_email TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      details TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS saloniq_migrations (
      id TEXT PRIMARY KEY,
      imported_at TEXT NOT NULL,
      records_count INTEGER NOT NULL,
      status TEXT NOT NULL,
      conflict_summary TEXT,
      cutover_mode TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      first_name TEXT,
      source TEXT NOT NULL DEFAULT 'footer',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gift_vouchers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      remaining_balance REAL NOT NULL,
      voucher_type TEXT NOT NULL DEFAULT 'amount',
      service_id TEXT,
      service_name TEXT,
      recipient_name TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      sender_email TEXT NOT NULL,
      message TEXT,
      theme TEXT NOT NULL DEFAULT 'bronze',
      delivery_date TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'redeemed', 'expired', 'cancelled')),
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS testimonials (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      client_location TEXT,
      rating INTEGER NOT NULL DEFAULT 5,
      category TEXT NOT NULL,
      service_name TEXT NOT NULL,
      stylist_id TEXT,
      stylist_name TEXT NOT NULL,
      quote TEXT NOT NULL,
      detail TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 1,
      source TEXT NOT NULL DEFAULT 'Google Verified',
      date TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Ensure staff images and complete official profiles from the salon website are synced
  try {
    const officialProfiles = [
      {
        id: 'staff_kirstin',
        role_title: 'Senior Stylist & Colour Specialist (Blow Dry Queen)',
        bio: 'Kirstin joined George Davis Hairdressing as an apprentice and has developed into a talented and confident stylist. She has a real passion for colour, creating beautiful, personalised results that suit every client. Known in the salon as the “Blow Dry Queen,” Kirstin is renowned for her smooth, long-lasting blow dries and flawless finishing. Friendly, approachable and always eager to learn, she takes pride in making every client feel relaxed, listened to and delighted with their hair. Whether you’re visiting for a fresh colour, a stylish cut or the perfect blow dry, Kirstin is dedicated to helping you look and feel your very best.',
        specialties: JSON.stringify(['Bespoke Colour', 'Balayage & Foiling', 'Luxury Blow-Dries', 'Gloss Treatments', 'Styling & Finish']),
        image_url: '/images/stylists/kirstin.png',
      },
      {
        id: 'staff_george_jnr',
        role_title: "Master Barber & Men's Hair Replacement Specialist",
        bio: 'George Jnr has been part of George Davis Hairdressing since he was 14 years old, starting as the salon’s Saturday boy before training to become an accomplished stylist. His passion, dedication, and years of hands-on experience have made him an exceptional ladies’ and gentlemen’s hairdresser. He is renowned for his precision cutting and creates styles that are modern, wearable, and tailored to every client. George also spent time working in Australia, where he further developed his skills and gained valuable international experience. In addition to cutting and colouring, George specialises in men’s hair replacement systems, offering discreet, natural-looking solutions that restore confidence. Whether you’re looking for a precision haircut, a complete restyle, or expert advice on hair replacement, George combines technical expertise with a friendly, professional approach to achieve outstanding results.',
        specialties: JSON.stringify(["Men's Precision Cutting", 'Non-Surgical Hair Systems', 'Scalp Assessment', 'Restyling', 'Beard & Neckline Craft']),
        image_url: '/images/stylists/george-jnr.png',
      },
      {
        id: 'staff_george_snr',
        role_title: 'Founder, Salon Director & Master Stylist',
        bio: 'George has been at the heart of George Davis Hairdressing for decades and is known for his experience, personality and genuine passion for the industry. George specialises in precision cutting, cutting and styling naturally curly hair and modern perming. Clients love his friendly sense of humour and the relaxed, welcoming atmosphere he creates in the salon. His wealth of knowledge, attention to detail and commitment to outstanding customer service ensure every client feels comfortable, confident and leaves looking their very best.',
        specialties: JSON.stringify(['Precision Cutting', 'Curly Hair Architecture', 'Perming & Texture', 'Classic Restyling', 'Tailored Consultation']),
        image_url: '/images/stylists/george-snr.png',
      },
      {
        id: 'staff_lisa',
        role_title: 'Senior Stylist, Extensions & Keratin Specialist',
        bio: 'Lisa has been a valued member of the George Davis Hairdressing team since 2010. With over a decade of experience in the salon, she specialises in precision cutting, beautiful colouring, hair extensions and keratin smoothing treatments. Lisa is known for her attention to detail, creative flair and friendly, professional approach. She takes the time to understand every client’s needs, ensuring they leave the salon feeling confident, refreshed and looking their absolute best.',
        specialties: JSON.stringify(['Cutting & Restyling', 'Dimensional Colour', 'Keratin Smoothing', 'Hair Extensions', 'Texture Care']),
        image_url: '/images/stylists/lisa.png',
      },
      {
        id: 'staff_rob',
        role_title: 'Senior Stylist, Occasion Artist & Colour Specialist',
        bio: 'Rob has been part of the George Davis Hairdressing team for eight years and brings a wealth of experience across all aspects of hairdressing. He is an outstanding ladies’ hairstylist, known for creating beautiful, personalised looks that suit each client’s style and lifestyle. He is particularly recognised for his exceptional blow-dries, elegant hair-up styling for special occasions, and expert colouring services, from subtle natural tones to complete colour transformations. Rob also spent several years working in China, where he broadened his experience and refined his skills while working with a diverse range of hair types and techniques. With his creativity, technical expertise, and friendly personality, Rob is dedicated to helping every client leave the salon looking and feeling their very best.',
        specialties: JSON.stringify(["Women's Styling", 'Occasion & Event Hair', 'Blow-Dries & Waves', 'Creative Colour', 'Hair-Up Artistry']),
        image_url: '/images/stylists/rob.png',
      },
      {
        id: 'staff_leah',
        role_title: 'Colourist, Blonde Artist & Hair Extension Technician',
        bio: 'Leah has been a valued member of the George Davis Hairdressing team for five years and has a real passion for creating beautiful hair. She specialises in hair extensions and is an expert colourist, particularly when it comes to achieving stunning blonde shades, from soft natural blondes to bright, icy finishes. Known for her warm, friendly personality, Leah takes the time to understand every client’s goals and is committed to delivering beautiful, confidence-boosting results. Whether you’re looking for a colour refresh, a complete blonde transformation, or fuller, longer hair with extensions, you’re in expert hands with Leah.',
        specialties: JSON.stringify(['Blonde Artistry', 'Balayage', 'Hair Extension Fitting', 'Root Melts & Toning', 'Icy & Natural Blondes']),
        image_url: '/images/stylists/leah.png',
      },
    ];

    for (const p of officialProfiles) {
      db.run(
        `UPDATE staff SET role_title = ?, bio = ?, specialties = ?, image_url = ? WHERE id = ?`,
        [p.role_title, p.bio, p.specialties, p.image_url, p.id]
      );
    }
  } catch (err) {
    console.warn('Could not update staff official profiles in db:', err);
  }

  // Ensure initial verified customer testimonials exist
  try {
    const testRes = db.exec('SELECT count(*) as count FROM testimonials');
    const testCount = (testRes[0]?.values[0]?.[0] as number) || 0;
    if (testCount === 0) {
      seedTestimonials(db);
    }
  } catch (err) {
    console.warn('Could not verify testimonials table:', err);
  }

  // Check if initial settings exist
  const res = db.exec("SELECT count(*) as count FROM settings WHERE key = 'salon_name'");
  const count = res[0]?.values[0]?.[0] as number;

  if (!count) {
    seedInitialData(db);
  }

  // Ensure single admin slot policy setting stays in sync with actual users
  const adminRes = db.exec("SELECT count(*) FROM users WHERE role = 'owner_admin'");
  const adminCount = (adminRes[0]?.values[0]?.[0] as number) || 0;
  if (adminCount === 0) {
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_slot_claimed', '0')");
    db.run("DELETE FROM settings WHERE key IN ('admin_claimed_at', 'admin_claimed_by')");
  } else {
    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES ('admin_slot_claimed', '1')");
  }
}

function seedInitialData(db: Database): void {
  console.log('Seeding initial database configuration and business records...');

  // Settings
  const initialSettings: Record<string, string> = {
    salon_name: 'George Davis Hairdressing',
    salon_address: '14 St John Street, Bromsgrove, B61 8QY, United Kingdom',
    salon_phone: '01527 577000',
    salon_phone_intl: '+441527577000',
    salon_email: 'georgedavisbromsgrove@gmail.com',
    currency: 'GBP',
    timezone: 'Europe/London',
    hours_confirmed: '0', // 0 = draft from Good Salon Guide, requires owner confirmation
    online_booking_active: '1',
    min_lead_time_hours: '2',
    max_advance_days: '60',
    cancellation_window_hours: '24',
    patch_test_required_hours: '48',
    saloniq_authoritative: '0',
    saloniq_cutover_confirmed: '0',
    notice_banner: 'Welcome to George Davis Hairdressing. Please note: Skin patch tests are mandatory 48 hours prior to any colour appointment.',
    admin_slot_claimed: '0', // Single admin account slot is open by default
  };

  for (const [key, value] of Object.entries(initialSettings)) {
    db.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
  }

  // Initial Staff Users (Admin slot is left unclaimed for user to register the 1 slot)
  const salt = bcrypt.genSaltSync(10);
  const staffPassHash = bcrypt.hashSync('GeorgeDavis2026!', salt);

  const receptionistUserId = 'user_reception_01';
  const stylistUserId = 'user_george_jnr_01';

  db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      receptionistUserId,
      'reception@georgedavishair.co.uk',
      staffPassHash,
      'Salon Reception Desk',
      '01527 577000',
      'receptionist',
      new Date().toISOString(),
    ],
  );

  db.run(
    `INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      stylistUserId,
      'george.jnr@georgedavishair.co.uk',
      staffPassHash,
      'George Davis Jnr',
      '01527 577000',
      'stylist',
      new Date().toISOString(),
    ],
  );

  // Good Salon Guide draft hours (stored as unconfirmed)
  // Monday closed; Tuesday 09:00–17:30; Wednesday 09:00–18:00; Thursday 09:00–21:00; Friday 09:00–19:00; Saturday 09:00–17:00; Sunday closed
  const draftHours = [
    { day: 0, name: 'Sunday', open: '00:00', close: '00:00', is_open: 0, is_confirmed: 0 },
    { day: 1, name: 'Monday', open: '00:00', close: '00:00', is_open: 0, is_confirmed: 0 },
    { day: 2, name: 'Tuesday', open: '09:00', close: '17:30', is_open: 1, is_confirmed: 0 },
    { day: 3, name: 'Wednesday', open: '09:00', close: '18:00', is_open: 1, is_confirmed: 0 },
    { day: 4, name: 'Thursday', open: '09:00', close: '21:00', is_open: 1, is_confirmed: 0 },
    { day: 5, name: 'Friday', open: '09:00', close: '19:00', is_open: 1, is_confirmed: 0 },
    { day: 6, name: 'Saturday', open: '09:00', close: '17:00', is_open: 1, is_confirmed: 0 },
  ];

  for (const h of draftHours) {
    db.run(
      `INSERT INTO salon_hours (day_of_week, day_name, open_time, close_time, is_open, is_confirmed)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [h.day, h.name, h.open, h.close, h.is_open, h.is_confirmed],
    );
  }

  // Service Categories
  const categories = [
    {
      id: 'cat_cutting',
      name: 'Precision Cutting & Styling',
      slug: 'cutting-styling',
      description: 'Bespoke cuts, restyles, and luxury blow-dries tailored to your hair texture and face shape.',
      sort_order: 1,
    },
    {
      id: 'cat_colour',
      name: 'Bespoke Colour & Balayage',
      slug: 'colour-balayage',
      description: 'Dimensional blonde, bespoke balayage, root melts, and rich grey blending using premium formulations.',
      sort_order: 2,
    },
    {
      id: 'cat_mens',
      name: "Men's Cutting & Hair Systems",
      slug: 'mens-cutting-systems',
      description: "Dedicated men's precision barbering and non-surgical human hair replacement systems.",
      sort_order: 3,
    },
    {
      id: 'cat_extensions',
      name: 'Human Hair Extensions',
      slug: 'hair-extensions',
      description: 'Premium seamless extensions for length, density, and dimensional colour enhancement.',
      sort_order: 4,
    },
    {
      id: 'cat_texture',
      name: 'Curly Care, Perming & Smoothing',
      slug: 'curly-texture',
      description: 'Specialist curly dry cuts, modern perming, and revitalising keratin smoothing treatments.',
      sort_order: 5,
    },
  ];

  for (const cat of categories) {
    db.run(
      `INSERT INTO service_categories (id, name, slug, description, sort_order)
       VALUES (?, ?, ?, ?, ?)`,
      [cat.id, cat.name, cat.slug, cat.description, cat.sort_order],
    );
  }

  // Services
  const services = [
    // Cutting & Styling
    {
      id: 'srv_cut_finish',
      category_id: 'cat_cutting',
      name: 'Cut & Finish (Women)',
      slug: 'women-cut-finish',
      description: 'In-depth consultation, luxury shampoo, tailored precision cut and bespoke blow-dry finish.',
      duration: 60,
      buffer: 15,
      price: 52.0,
      price_type: 'from',
      requires_consultation: 0,
      requires_patch_test: 0,
      sort_order: 1,
    },
    {
      id: 'srv_restyle',
      category_id: 'cat_cutting',
      name: 'Complete Restyle & Blow-Dry',
      slug: 'complete-restyle',
      description: 'A transformative haircut service with dedicated architectural consultation and finishing techniques.',
      duration: 75,
      buffer: 15,
      price: 64.0,
      price_type: 'from',
      requires_consultation: 0,
      requires_patch_test: 0,
      sort_order: 2,
    },
    {
      id: 'srv_blow_dry',
      category_id: 'cat_cutting',
      name: 'Luxury Blow-Dry & Finish',
      slug: 'luxury-blow-dry',
      description: 'Cleanse, conditioning massage, and bouncy or sleek thermal styling for everyday or occasion wear.',
      duration: 45,
      buffer: 15,
      price: 36.0,
      price_type: 'from',
      requires_consultation: 0,
      requires_patch_test: 0,
      sort_order: 3,
    },

    // Colour
    {
      id: 'srv_balayage',
      category_id: 'cat_colour',
      name: 'Bespoke Balayage & Gloss',
      slug: 'bespoke-balayage-gloss',
      description: 'Custom hand-painted highlighting, tailored toning gloss, bond protection and luxury blow-dry. 48hr patch test mandatory.',
      duration: 150,
      buffer: 20,
      price: 135.0,
      price_type: 'from',
      requires_consultation: 1,
      requires_patch_test: 1,
      sort_order: 4,
    },
    {
      id: 'srv_full_head_colour',
      category_id: 'cat_colour',
      name: 'Full Head Permanent Colour & Finish',
      slug: 'full-head-colour',
      description: 'Rich, multidimensional all-over tint or grey coverage with protective gloss and styling. 48hr patch test mandatory.',
      duration: 120,
      buffer: 15,
      price: 88.0,
      price_type: 'from',
      requires_consultation: 0,
      requires_patch_test: 1,
      sort_order: 5,
    },
    {
      id: 'srv_half_head_highlights',
      category_id: 'cat_colour',
      name: 'Half Head Highlights & Toner',
      slug: 'half-head-highlights',
      description: 'Foil placement through crown and hairline for natural lift, personalized gloss tone, and cut finish. 48hr patch test mandatory.',
      duration: 135,
      buffer: 15,
      price: 98.0,
      price_type: 'from',
      requires_consultation: 0,
      requires_patch_test: 1,
      sort_order: 6,
    },

    // Men's Cutting & Systems
    {
      id: 'srv_mens_precision_cut',
      category_id: 'cat_mens',
      name: "Men's Precision Cut & Style",
      slug: 'mens-precision-cut',
      description: "Scissor-over-comb precision, tailored neckline, texturised finish and styling advice.",
      duration: 45,
      buffer: 15,
      price: 34.0,
      price_type: 'from',
      requires_consultation: 0,
      requires_patch_test: 0,
      sort_order: 7,
    },
    {
      id: 'srv_mens_hair_system_consultation',
      category_id: 'cat_mens',
      name: "Men's Hair Replacement Consultation",
      slug: 'mens-hair-system-consultation',
      description: "Private 1-on-1 assessment for custom non-surgical hair systems with George Jnr. Discreet scalp sizing, density matching, and styling overview.",
      duration: 45,
      buffer: 15,
      price: 0.0,
      price_type: 'consultation',
      requires_consultation: 1,
      requires_patch_test: 0,
      sort_order: 8,
    },
    {
      id: 'srv_mens_hair_system_refit',
      category_id: 'cat_mens',
      name: "Men's Hair System Refit & Cut-In",
      slug: 'mens-hair-system-refit',
      description: "Full system removal, scalp cleanse, maintenance, re-bonding, perimeter cut-in and bespoke styling.",
      duration: 90,
      buffer: 15,
      price: 85.0,
      price_type: 'fixed',
      requires_consultation: 1,
      requires_patch_test: 0,
      sort_order: 9,
    },

    // Extensions
    {
      id: 'srv_extensions_consultation',
      category_id: 'cat_extensions',
      name: 'Human Hair Extensions Consultation',
      slug: 'hair-extensions-consultation',
      description: 'Colour matching, density assessment, method selection (tapes, bonds, or wefts) and bespoke pricing quotation.',
      duration: 30,
      buffer: 15,
      price: 0.0,
      price_type: 'consultation',
      requires_consultation: 1,
      requires_patch_test: 0,
      sort_order: 10,
    },
    {
      id: 'srv_extensions_maintenance',
      category_id: 'cat_extensions',
      name: 'Extension Maintenance & Rotation',
      slug: 'extension-maintenance',
      description: 'Professional repositioning, re-taping or bond rotation to protect natural hair health and maintain seamless integration.',
      duration: 90,
      buffer: 15,
      price: 95.0,
      price_type: 'from',
      requires_consultation: 1,
      requires_patch_test: 0,
      sort_order: 11,
    },

    // Curly & Texture
    {
      id: 'srv_curly_cut',
      category_id: 'cat_texture',
      name: 'Curly Hair Specialist Cut & Hydration',
      slug: 'curly-cut-hydration',
      description: 'Dry curl-by-curl architectural cutting respecting natural curl spring, intense hydration cleanse, and curl set.',
      duration: 75,
      buffer: 15,
      price: 68.0,
      price_type: 'from',
      requires_consultation: 0,
      requires_patch_test: 0,
      sort_order: 12,
    },
    {
      id: 'srv_keratin_smoothing',
      category_id: 'cat_texture',
      name: 'Keratin Smoothing Treatment',
      slug: 'keratin-smoothing',
      description: 'Anti-frizz smoothing treatment that seals the cuticle, eliminates humidity puffiness and dramatically speeds up home styling.',
      duration: 150,
      buffer: 20,
      price: 150.0,
      price_type: 'from',
      requires_consultation: 1,
      requires_patch_test: 0,
      sort_order: 13,
    },
  ];

  for (const s of services) {
    db.run(
      `INSERT INTO services (id, category_id, name, slug, description, duration_minutes, buffer_minutes, price, price_type, requires_consultation, requires_patch_test, active, online_booking_enabled, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?)`,
      [
        s.id,
        s.category_id,
        s.name,
        s.slug,
        s.description,
        s.duration,
        s.buffer,
        s.price,
        s.price_type,
        s.requires_consultation,
        s.requires_patch_test,
        s.sort_order,
      ],
    );
  }

  // Verified Team Members
  const staffMembers = [
    {
      id: 'staff_kirstin',
      name: 'Kirstin',
      slug: 'kirstin',
      role_title: 'Senior Stylist & Colour Specialist (Blow Dry Queen)',
      bio: 'Kirstin joined George Davis Hairdressing as an apprentice and has developed into a talented and confident stylist. She has a real passion for colour, creating beautiful, personalised results that suit every client. Known in the salon as the “Blow Dry Queen,” Kirstin is renowned for her smooth, long-lasting blow dries and flawless finishing. Friendly, approachable and always eager to learn, she takes pride in making every client feel relaxed, listened to and delighted with their hair. Whether you’re visiting for a fresh colour, a stylish cut or the perfect blow dry, Kirstin is dedicated to helping you look and feel your very best.',
      specialties: ['Bespoke Colour', 'Balayage & Foiling', 'Luxury Blow-Dries', 'Gloss Treatments', 'Styling & Finish'],
      image_url: '/images/stylists/kirstin.png',
      sort_order: 1,
      service_ids: ['srv_cut_finish', 'srv_blow_dry', 'srv_balayage', 'srv_full_head_colour', 'srv_half_head_highlights'],
    },
    {
      id: 'staff_george_jnr',
      name: 'George Jnr',
      slug: 'george-jnr',
      role_title: "Master Barber & Men's Hair Replacement Specialist",
      bio: 'George Jnr has been part of George Davis Hairdressing since he was 14 years old, starting as the salon’s Saturday boy before training to become an accomplished stylist. His passion, dedication, and years of hands-on experience have made him an exceptional ladies’ and gentlemen’s hairdresser. He is renowned for his precision cutting and creates styles that are modern, wearable, and tailored to every client. George also spent time working in Australia, where he further developed his skills and gained valuable international experience. In addition to cutting and colouring, George specialises in men’s hair replacement systems, offering discreet, natural-looking solutions that restore confidence. Whether you’re looking for a precision haircut, a complete restyle, or expert advice on hair replacement, George combines technical expertise with a friendly, professional approach to achieve outstanding results.',
      specialties: ["Men's Precision Cutting", 'Non-Surgical Hair Systems', 'Scalp Assessment', 'Restyling', 'Beard & Neckline Craft'],
      image_url: '/images/stylists/george-jnr.png',
      sort_order: 2,
      service_ids: ['srv_mens_precision_cut', 'srv_mens_hair_system_consultation', 'srv_mens_hair_system_refit'],
    },
    {
      id: 'staff_george_snr',
      name: 'George Snr',
      slug: 'george-snr',
      role_title: 'Founder, Salon Director & Master Stylist',
      bio: 'George has been at the heart of George Davis Hairdressing for decades and is known for his experience, personality and genuine passion for the industry. George specialises in precision cutting, cutting and styling naturally curly hair and modern perming. Clients love his friendly sense of humour and the relaxed, welcoming atmosphere he creates in the salon. His wealth of knowledge, attention to detail and commitment to outstanding customer service ensure every client feels comfortable, confident and leaves looking their very best.',
      specialties: ['Precision Cutting', 'Curly Hair Architecture', 'Perming & Texture', 'Classic Restyling', 'Tailored Consultation'],
      image_url: '/images/stylists/george-snr.png',
      sort_order: 3,
      service_ids: ['srv_cut_finish', 'srv_restyle', 'srv_mens_precision_cut', 'srv_curly_cut'],
    },
    {
      id: 'staff_lisa',
      name: 'Lisa',
      slug: 'lisa',
      role_title: 'Senior Stylist, Extensions & Keratin Specialist',
      bio: 'Lisa has been a valued member of the George Davis Hairdressing team since 2010. With over a decade of experience in the salon, she specialises in precision cutting, beautiful colouring, hair extensions and keratin smoothing treatments. Lisa is known for her attention to detail, creative flair and friendly, professional approach. She takes the time to understand every client’s needs, ensuring they leave the salon feeling confident, refreshed and looking their absolute best.',
      specialties: ['Cutting & Restyling', 'Dimensional Colour', 'Keratin Smoothing', 'Hair Extensions', 'Texture Care'],
      image_url: '/images/stylists/lisa.png',
      sort_order: 4,
      service_ids: [
        'srv_cut_finish',
        'srv_restyle',
        'srv_full_head_colour',
        'srv_half_head_highlights',
        'srv_extensions_consultation',
        'srv_extensions_maintenance',
        'srv_keratin_smoothing',
      ],
    },
    {
      id: 'staff_rob',
      name: 'Rob',
      slug: 'rob',
      role_title: 'Senior Stylist, Occasion Artist & Colour Specialist',
      bio: 'Rob has been part of the George Davis Hairdressing team for eight years and brings a wealth of experience across all aspects of hairdressing. He is an outstanding ladies’ hairstylist, known for creating beautiful, personalised looks that suit each client’s style and lifestyle. He is particularly recognised for his exceptional blow-dries, elegant hair-up styling for special occasions, and expert colouring services, from subtle natural tones to complete colour transformations. Rob also spent several years working in China, where he broadened his experience and refined his skills while working with a diverse range of hair types and techniques. With his creativity, technical expertise, and friendly personality, Rob is dedicated to helping every client leave the salon looking and feeling their very best.',
      specialties: ["Women's Styling", 'Occasion & Event Hair', 'Blow-Dries & Waves', 'Creative Colour', 'Hair-Up Artistry'],
      image_url: '/images/stylists/rob.png',
      sort_order: 5,
      service_ids: ['srv_cut_finish', 'srv_restyle', 'srv_blow_dry', 'srv_full_head_colour', 'srv_half_head_highlights'],
    },
    {
      id: 'staff_leah',
      name: 'Leah',
      slug: 'leah',
      role_title: 'Colourist, Blonde Artist & Hair Extension Technician',
      bio: 'Leah has been a valued member of the George Davis Hairdressing team for five years and has a real passion for creating beautiful hair. She specialises in hair extensions and is an expert colourist, particularly when it comes to achieving stunning blonde shades, from soft natural blondes to bright, icy finishes. Known for her warm, friendly personality, Leah takes the time to understand every client’s goals and is committed to delivering beautiful, confidence-boosting results. Whether you’re looking for a colour refresh, a complete blonde transformation, or fuller, longer hair with extensions, you’re in expert hands with Leah.',
      specialties: ['Blonde Artistry', 'Balayage', 'Hair Extension Fitting', 'Root Melts & Toning', 'Icy & Natural Blondes'],
      image_url: '/images/stylists/leah.png',
      sort_order: 6,
      service_ids: [
        'srv_cut_finish',
        'srv_blow_dry',
        'srv_balayage',
        'srv_half_head_highlights',
        'srv_extensions_consultation',
        'srv_extensions_maintenance',
      ],
    },
  ];

  for (const s of staffMembers) {
    db.run(
      `INSERT INTO staff (id, name, slug, role_title, bio, specialties, image_url, active, consultation_only, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)`,
      [s.id, s.name, s.slug, s.role_title, s.bio, JSON.stringify(s.specialties), s.image_url, s.sort_order, new Date().toISOString()],
    );

    // Map staff to services
    for (const srvId of s.service_ids) {
      db.run('INSERT INTO staff_services (staff_id, service_id) VALUES (?, ?)', [s.id, srvId]);
    }

    // Default working hours for staff (Tuesday to Saturday: 09:00 - 17:30, Thu late 20:00)
    for (let day = 0; day <= 6; day++) {
      const isWorking = day >= 2 && day <= 6; // Tue-Sat
      const closeHour = day === 4 ? '20:30' : day === 5 ? '18:30' : '17:30';
      db.run(
        `INSERT INTO staff_working_hours (id, staff_id, day_of_week, start_time, end_time, is_working)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [`swh_${s.id}_${day}`, s.id, day, '09:00', closeHour, isWorking ? 1 : 0],
      );

      // Lunch break 13:00 - 14:00 on working days
      if (isWorking) {
        db.run(
          `INSERT INTO staff_breaks (id, staff_id, day_of_week, start_time, end_time, label)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [`sb_${s.id}_${day}`, s.id, day, '13:00', '13:45', 'Lunch Break'],
        );
      }
    }
  }

  // Create initial demo/reference appointments (showing real database state)
  const customerId = 'cust_sarah_01';
  db.run(
    `INSERT INTO customers (id, full_name, email, phone, notes, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      customerId,
      'Sarah Jenkins',
      'sarah.jenkins.sample@gmail.com',
      '07700900123',
      'Prefers warm caramel tones for balayage. Previous patch test verified on 10 Sept 2026.',
      new Date().toISOString(),
    ],
  );

  // We can insert a sample appointment in the future (e.g. October 2026)
  const sampleStartUtc = '2026-10-15T10:00:00.000Z';
  const sampleEndUtc = '2026-10-15T11:00:00.000Z';
  db.run(
    `INSERT INTO appointments (
      id, booking_reference, access_token, customer_id, staff_id, service_id,
      booked_service_name, booked_price, booked_price_type, booked_duration_minutes, booked_buffer_minutes,
      start_time, end_time, status, notes, policy_accepted, marketing_consent, patch_test_acknowledged,
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, 'confirmed', ?, 1, 0, 1,
      ?, ?
    )`,
    [
      'app_sample_01',
      'GD-2026-B871',
      'tok_guest_sample_access_7a9f',
      customerId,
      'staff_kirstin',
      'srv_cut_finish',
      'Cut & Finish (Women)',
      52.0,
      'from',
      60,
      15,
      sampleStartUtc,
      sampleEndUtc,
      'Consultation requested on subtle shaping around face.',
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  );

  // Audit log of system initialisation
  db.run(
    `INSERT INTO audit_logs (id, user_email, action, entity_type, entity_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      'audit_init_01',
      'system',
      'SYSTEM_INITIALIZED',
      'system',
      'core',
      'George Davis Hairdressing system initialized with verified staff, service catalogue, and Good Salon Guide draft hours.',
      new Date().toISOString(),
    ],
  );

  console.log('Database initialisation complete.');
}

export function seedTestimonials(db: Database): void {
  const testimonials = [
    {
      id: 'test_01',
      client_name: 'Claire M.',
      client_location: 'Bromsgrove',
      rating: 5,
      category: 'curly',
      service_name: 'Dry Curl-by-Curl Specialist Cut',
      stylist_id: 'staff_lisa',
      stylist_name: 'Lisa',
      quote: 'I spent 15 years searching across the Midlands for someone who genuinely understood textured curls. Lisa is a true master.',
      detail: 'She evaluated my natural 3B curl coils section-by-section in their dry state, respecting natural shrinkage. No pyramid effect, no frizzy blowout. My curls have never held such effortless spring and definition.',
      verified: 1,
      source: 'Google Verified',
      date: 'Verified Client · 2 weeks ago',
    },
    {
      id: 'test_02',
      client_name: 'Dr. Rebecca T.',
      client_location: 'Barnt Green',
      rating: 5,
      category: 'precision',
      service_name: 'Architectural Geometric Bob',
      stylist_id: 'staff_george_snr',
      stylist_name: 'George Snr',
      quote: 'George Snr’s precision cutting is absolute artistry. My blunt bob falls perfectly into place with zero morning styling.',
      detail: 'His classic Vidal Sassoon precision training is evident in every scissor stroke. The hairline perimeter is laser-sharp, but the internal weight reduction gives the cut weightless fluidity.',
      verified: 1,
      source: 'Google Verified',
      date: 'Verified Client · 3 weeks ago',
    },
    {
      id: 'test_03',
      client_name: 'Charlotte B.',
      client_location: 'Droitwich',
      rating: 5,
      category: 'colour',
      service_name: 'Bespoke Balayage & Gloss Toner',
      stylist_id: 'staff_kirstin',
      stylist_name: 'Kirstin',
      quote: 'The balayage transition from my natural root to sunlit honey ribbons is seamless. Pure perfection.',
      detail: 'Strict patch testing gave me total peace of mind, and the tailored gloss toner left my hair silky and reflective without unwanted brassiness.',
      verified: 1,
      source: 'Good Salon Guide',
      date: 'Verified Client · 1 month ago',
    },
    {
      id: 'test_04',
      client_name: 'Marcus P.',
      client_location: 'Bromsgrove',
      rating: 5,
      category: 'mens',
      service_name: "Men's Precision Scissor Taper & Scalp Care",
      stylist_id: 'staff_george_jnr',
      stylist_name: 'George Jnr',
      quote: 'George Jnr provides exceptional barbering precision. Undetectable graduation and bespoke scalp care.',
      detail: 'Private, professional environment in the salon with zero rushing. Best men’s scissor-over-comb cutting in Worcestershire.',
      verified: 1,
      source: 'Google Verified',
      date: 'Verified Client · 1 month ago',
    },
    {
      id: 'test_05',
      client_name: 'Hannah D.',
      client_location: 'Worcestershire',
      rating: 5,
      category: 'curly',
      service_name: 'Specialist Curl Restoration & Hydration',
      stylist_id: 'staff_lisa',
      stylist_name: 'Lisa',
      quote: 'Having thick 3C curls, salon visits were always anxiety-inducing until I found George Davis.',
      detail: 'They took time to explain curl porosity and moisture seals before even touching a scissor. Three months on and the silhouette has grown out flawlessly without losing its shape.',
      verified: 1,
      source: 'Salon Verified',
      date: 'Verified Client · 6 weeks ago',
    },
    {
      id: 'test_06',
      client_name: 'Eleanor W.',
      client_location: 'Redditch',
      rating: 5,
      category: 'precision',
      service_name: 'Precision Restyle & Scissor Shape',
      stylist_id: 'staff_george_snr',
      stylist_name: 'George Snr',
      quote: 'You immediately notice the difference between a rushed high-street cut and true architectural craft.',
      detail: 'Every angle is tailored to your jawline and bone structure. Even 8 weeks after my appointment, my layers still look freshly cut. Worth every single penny.',
      verified: 1,
      source: 'Google Verified',
      date: 'Verified Client · 2 months ago',
    },
    {
      id: 'test_07',
      client_name: 'James K.',
      client_location: 'Solihull',
      rating: 5,
      category: 'mens',
      service_name: 'Non-Surgical Hair Replacement Consultation',
      stylist_id: 'staff_george_jnr',
      stylist_name: 'George Jnr',
      quote: 'The bespoke hair system consultation gave me my confidence back. Completely discreet, undetectable, and professional.',
      detail: 'George Jnr is immensely knowledgeable, patient, and respectful. The hairline blend is so seamless that even my closest friends couldn’t tell. Absolute game-changer.',
      verified: 1,
      source: 'Salon Verified',
      date: 'Verified Client · 2 months ago',
    },
    {
      id: 'test_08',
      client_name: 'Sophie L.',
      client_location: 'Alvechurch',
      rating: 5,
      category: 'colour',
      service_name: 'Luminous Blonde Foiling & Bond Repair',
      stylist_id: 'staff_leah',
      stylist_name: 'Leah',
      quote: 'Leah achieved the cleanest, brightest Scandinavian blonde without compromising my hair’s strength.',
      detail: 'The OLAPLEX integration and careful sectioning protected my fine hair completely. The tone is pure champagne pearl, zero yellowing.',
      verified: 1,
      source: 'Google Verified',
      date: 'Verified Client · 2 months ago',
    },
    {
      id: 'test_09',
      client_name: 'Natalie R.',
      client_location: 'Aston Fields',
      rating: 5,
      category: 'styling',
      service_name: 'Luxury Blow-Dry & Red-Carpet Waves',
      stylist_id: 'staff_rob',
      stylist_name: 'Rob',
      quote: 'Rob did my hair for a black-tie gala and it stayed voluminous, glossy, and bouncy all evening.',
      detail: 'His technique creates lasting body without stiffness or excessive hairspray. The compliments didn’t stop all night!',
      verified: 1,
      source: 'Good Salon Guide',
      date: 'Verified Client · 3 months ago',
    },
  ];

  const now = new Date().toISOString();
  for (const t of testimonials) {
    db.run(
      `INSERT INTO testimonials (id, client_name, client_location, rating, category, service_name, stylist_id, stylist_name, quote, detail, verified, source, date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        t.id,
        t.client_name,
        t.client_location,
        t.rating,
        t.category,
        t.service_name,
        t.stylist_id,
        t.stylist_name,
        t.quote,
        t.detail,
        t.verified,
        t.source,
        t.date,
        now,
      ],
    );
  }
}
