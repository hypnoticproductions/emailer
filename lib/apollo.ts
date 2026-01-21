// lib/apollo.ts
import axios from 'axios';

export interface ApolloContact {
  email: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  organization_name?: string;
  linkedin_url?: string;
}

export const apolloClient = {
  /**
   * Enrich contact data using Apollo API
   * This is optional - only used if you need to enrich existing contacts
   */
  async enrichContact(email: string): Promise<ApolloContact | null> {
    if (!process.env.APOLLO_API_KEY) {
      console.warn('APOLLO_API_KEY not set, skipping enrichment');
      return null;
    }

    try {
      const response = await axios.post(
        'https://api.apollo.io/v1/people/match',
        {
          email,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'X-Api-Key': process.env.APOLLO_API_KEY,
          },
        }
      );

      if (response.data?.person) {
        const person = response.data.person;
        return {
          email: person.email,
          first_name: person.first_name,
          last_name: person.last_name,
          title: person.title,
          organization_name: person.organization?.name,
          linkedin_url: person.linkedin_url,
        };
      }

      return null;
    } catch (error) {
      console.error('Apollo enrichment error:', error);
      return null;
    }
  },

  /**
   * Bulk enrich contacts (with rate limiting)
   */
  async enrichContacts(
    emails: string[],
    delayMs: number = 1000
  ): Promise<(ApolloContact | null)[]> {
    const results: (ApolloContact | null)[] = [];

    for (const email of emails) {
      const enriched = await this.enrichContact(email);
      results.push(enriched);

      // Rate limiting
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    return results;
  },
};
