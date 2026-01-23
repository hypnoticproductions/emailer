// app/api/import-contacts/route.ts - Import contacts from GitHub CSV files
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import axios from 'axios';

interface CSVRow {
  'Company Name': string;
  'Location': string;
  'Sector': string;
  'Email': string;
  'Phone': string;
  'LinkedIn': string;
  'Twitter': string;
  'Website': string;
  'Notes': string;
}

async function fetchCSVFromGitHub(filename: string): Promise<string> {
  const response = await axios.get(
    `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${filename}`,
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    }
  );
  return response.data;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values: string[] = [];
    let currentValue = '';
    let insideQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        values.push(currentValue.trim());
        currentValue = '';
      } else {
        currentValue += char;
      }
    }
    values.push(currentValue.trim());

    const row: any = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

function mapSectorToStandard(sector: string): string {
  const sectorMap: { [key: string]: string } = {
    'Clean Energy': 'clean_energy',
    'Fintech': 'fintech',
    'Tech': 'tech_web3',
    'Tech/Transport': 'tech_web3',
    'Tech/Web3': 'tech_web3',
    'Tourism': 'tourism',
    'Agriculture': 'agriculture',
    'Music': 'music_creative',
    'Fashion': 'music_creative',
    'Government': 'government',
    'Health': 'other',
    'Education': 'other',
  };

  if (sectorMap[sector]) {
    return sectorMap[sector];
  }

  const lowerSector = sector.toLowerCase();
  if (lowerSector.includes('energy') || lowerSector.includes('solar')) {
    return 'clean_energy';
  } else if (lowerSector.includes('tech') || lowerSector.includes('web3') || lowerSector.includes('software')) {
    return 'tech_web3';
  } else if (lowerSector.includes('fintech') || lowerSector.includes('finance') || lowerSector.includes('payment')) {
    return 'fintech';
  } else if (lowerSector.includes('tourism') || lowerSector.includes('hotel') || lowerSector.includes('travel')) {
    return 'tourism';
  } else if (lowerSector.includes('agriculture') || lowerSector.includes('farm') || lowerSector.includes('agri')) {
    return 'agriculture';
  } else if (lowerSector.includes('music') || lowerSector.includes('art') || lowerSector.includes('creative')) {
    return 'music_creative';
  } else if (lowerSector.includes('government') || lowerSector.includes('public')) {
    return 'government';
  }

  return 'other';
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source') || 'both';

    const filesToImport: string[] = [];

    if (source === 'phase1' || source === 'both') {
      filesToImport.push('network_phase1_contacts.csv');
    }
    if (source === 'master' || source === 'both') {
      filesToImport.push('WUKR_WIRE_MASTER_NETWORK.csv');
    }

    let totalImported = 0;
    let totalSkipped = 0;
    const errors: string[] = [];
    const importedContacts: any[] = [];

    for (const filename of filesToImport) {
      try {
        console.log(`Fetching ${filename}...`);
        const csvText = await fetchCSVFromGitHub(filename);

        console.log(`Parsing ${filename}...`);
        const rows = parseCSV(csvText);

        console.log(`Found ${rows.length} contacts in ${filename}`);

        for (const row of rows) {
          try {
            if (!row.Email || row.Email === 'N/A') {
              totalSkipped++;
              continue;
            }

            const sector = mapSectorToStandard(row.Sector);

            let linkedinUrl = row.LinkedIn;
            if (linkedinUrl && !linkedinUrl.startsWith('http')) {
              linkedinUrl = `https://linkedin.com${linkedinUrl}`;
            }

            const notesArray = [];
            if (row.Location) notesArray.push(`Location: ${row.Location}`);
            if (row.Phone) notesArray.push(`Phone: ${row.Phone}`);
            if (row.Twitter) notesArray.push(`Twitter: ${row.Twitter}`);
            if (row.Website) notesArray.push(`Website: ${row.Website}`);
            if (row.Notes) notesArray.push(row.Notes);
            const notes = notesArray.join(' | ');

            try {
              db.addContact({
                email: row.Email,
                company: row['Company Name'],
                sector: sector,
                linkedin: linkedinUrl || null,
                notes: notes || null,
              });

              totalImported++;
              importedContacts.push({
                company: row['Company Name'],
                email: row.Email,
                sector: sector,
              });
            } catch (dbError) {
              console.error(`Error importing ${row['Company Name']}:`, dbError);
              errors.push(`${row['Company Name']}: ${dbError}`);
              totalSkipped++;
            }
          } catch (contactError) {
            console.error(`Error processing row:`, contactError);
            errors.push(`${row['Company Name']}: ${contactError}`);
            totalSkipped++;
          }
        }
      } catch (fileError) {
        console.error(`Error processing ${filename}:`, fileError);
        errors.push(`${filename}: ${fileError}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed`,
      stats: {
        totalImported,
        totalSkipped,
        filesProcessed: filesToImport.length,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : [],
      sample: importedContacts.slice(0, 5),
    });
  } catch (error) {
    console.error('Import contacts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import contacts',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Contact Import Endpoint',
    usage: 'POST to this endpoint to import contacts from GitHub CSV files',
    parameters: {
      source: 'phase1 | master | both (default: both)',
    },
    example: 'POST /api/import-contacts?source=both',
  });
}
