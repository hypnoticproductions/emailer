import { getSQLiteClient } from '../lib/sqlite-client';

const sampleContacts = [
  {
    id: 'contact_1',
    email: 'john.fintech@example.com',
    first_name: 'John',
    last_name: 'Smith',
    company: 'FinTech Innovations',
    title: 'CEO',
    sector: 'fintech',
    linkedin: 'https://linkedin.com/in/johnsmith',
    notes: 'Interested in AI-powered financial insights',
  },
  {
    id: 'contact_2',
    email: 'sarah.energy@example.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    company: 'Green Energy Solutions',
    title: 'CTO',
    sector: 'clean_energy',
    linkedin: 'https://linkedin.com/in/sarahjohnson',
    notes: 'Focus on renewable energy investments',
  },
  {
    id: 'contact_3',
    email: 'mike.web3@example.com',
    first_name: 'Mike',
    last_name: 'Chen',
    company: 'BlockChain Ventures',
    title: 'Founder',
    sector: 'tech_web3',
    linkedin: 'https://linkedin.com/in/mikechen',
    notes: 'Web3 and DeFi specialist',
  },
  {
    id: 'contact_4',
    email: 'emma.tourism@example.com',
    first_name: 'Emma',
    last_name: 'Rodriguez',
    company: 'Global Tourism Partners',
    title: 'VP Marketing',
    sector: 'tourism',
    linkedin: 'https://linkedin.com/in/emmarodriguez',
    notes: 'Focus on sustainable tourism',
  },
  {
    id: 'contact_5',
    email: 'david.agri@example.com',
    first_name: 'David',
    last_name: 'Brown',
    company: 'AgriTech Innovations',
    title: 'Director',
    sector: 'agriculture',
    linkedin: 'https://linkedin.com/in/davidbrown',
    notes: 'Precision agriculture and IoT',
  },
  {
    id: 'contact_6',
    email: 'lisa.creative@example.com',
    first_name: 'Lisa',
    last_name: 'Taylor',
    company: 'Creative Music Labs',
    title: 'Producer',
    sector: 'music_creative',
    linkedin: 'https://linkedin.com/in/lisataylor',
    notes: 'Music tech and artist development',
  },
  {
    id: 'contact_7',
    email: 'robert.gov@example.com',
    first_name: 'Robert',
    last_name: 'Wilson',
    company: 'City Innovation Office',
    title: 'Chief Innovation Officer',
    sector: 'government',
    linkedin: 'https://linkedin.com/in/robertwilson',
    notes: 'Smart city initiatives',
  },
  {
    id: 'contact_8',
    email: 'jane.consultant@example.com',
    first_name: 'Jane',
    last_name: 'Davis',
    company: 'Strategic Advisors',
    title: 'Senior Consultant',
    sector: 'other',
    linkedin: 'https://linkedin.com/in/janedavis',
    notes: 'General business strategy',
  },
];

async function seedContacts() {
  console.log('🌱 Seeding SQLite database with contacts...');

  try {
    const db = getSQLiteClient();

    const countResult = db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number };

    if (countResult.count > 0) {
      console.log(`ℹ️  Found ${countResult.count} existing contacts`);
      console.log('   Database already has contacts. Skipping seed.');
      return;
    }

    const stmt = db.prepare(`
      INSERT INTO contacts (id, email, first_name, last_name, company, title, sector, linkedin, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insert = db.transaction((contacts: typeof sampleContacts) => {
      for (const contact of contacts) {
        stmt.run(
          contact.id,
          contact.email,
          contact.first_name,
          contact.last_name,
          contact.company,
          contact.title,
          contact.sector,
          contact.linkedin,
          contact.notes
        );
      }
    });

    insert(sampleContacts);

    console.log(`✅ Successfully seeded ${sampleContacts.length} contacts`);
    console.log('');
    console.log('📊 Contacts by sector:');

    const bySector = sampleContacts.reduce((acc: any, contact: any) => {
      acc[contact.sector] = (acc[contact.sector] || 0) + 1;
      return acc;
    }, {});

    Object.entries(bySector).forEach(([sector, count]) => {
      console.log(`   ${sector}: ${count}`);
    });

    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Start the dev server: npm run dev');
    console.log('   2. Visit /api/health to check system status');
    console.log('   3. Test the dashboard and features');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedContacts();
