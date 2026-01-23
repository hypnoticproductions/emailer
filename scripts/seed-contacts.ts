// scripts/seed-contacts.ts - Seed sample contacts for testing
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SECTORS = [
  'fintech',
  'clean_energy',
  'tech_web3',
  'tourism',
  'agriculture',
  'music_creative',
  'government',
  'other',
];

// Sample contacts for testing
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
  console.log('🌱 Seeding contacts...');

  try {
    // Check if contacts already exist
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true });

    if (count && count > 0) {
      console.log(`ℹ️  Found ${count} existing contacts`);
      console.log('   Would you like to add more or skip seeding?');
      console.log('   To reset, delete all contacts first in Supabase dashboard');
      return;
    }

    // Insert sample contacts
    const { data, error } = await supabase
      .from('contacts')
      .insert(sampleContacts)
      .select();

    if (error) {
      console.error('❌ Failed to seed contacts:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${data.length} contacts`);
    console.log('');
    console.log('📊 Contacts by sector:');

    const bySector = data.reduce((acc: any, contact: any) => {
      acc[contact.sector] = (acc[contact.sector] || 0) + 1;
      return acc;
    }, {});

    Object.entries(bySector).forEach(([sector, count]) => {
      console.log(`   ${sector}: ${count}`);
    });

    console.log('');
    console.log('💡 Next steps:');
    console.log('   1. Configure your API keys in .env');
    console.log('   2. Visit /api/health to check system status');
    console.log('   3. Start the dev server: npm run dev');
    console.log('   4. Test fetching signals from MANUS');
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
}

seedContacts();
