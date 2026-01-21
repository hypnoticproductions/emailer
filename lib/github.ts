// lib/github.ts
import axios from 'axios';

export interface GithubFile {
  name: string;
  path: string;
  content: string;
  sha: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: Date;
}

export const githubClient = {
  /**
   * Fetch a file from your Quintapoo repository
   */
  async getFile(path: string): Promise<GithubFile | null> {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/${path}`,
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3.raw',
          },
        }
      );

      // Get content
      let content = response.data;

      // If it's a string, keep as is
      if (typeof content !== 'string') {
        content = JSON.stringify(content);
      }

      return {
        name: path.split('/').pop() || '',
        path,
        content,
        sha: response.headers['x-github-meta-sha'] || '',
      };
    } catch (error) {
      console.error(`Failed to fetch ${path}:`, error);
      return null;
    }
  },

  /**
   * Get latest Morphic Trade Signal from MANUS
   * Fetches the markdown signal file
   */
  async getLatestSignal(): Promise<any> {
    // The signal is stored in wukr_wire_signals_jan21.md
    const file = await this.getFile('wukr_wire_signals_jan21.md');

    if (!file) {
      throw new Error('Signal file not found in repository');
    }

    // Parse the markdown content into structured data
    const signals = this.parseSignalMarkdown(file.content);

    return signals;
  },

  /**
   * Parse markdown signal file into structured data
   */
  parseSignalMarkdown(markdown: string): any {
    const lines = markdown.split('\n');
    const signals: any[] = [];
    let currentSignal: any = null;

    for (const line of lines) {
      // Detect signal headers (### SIG-JAN21-001: ...)
      if (line.startsWith('### SIG-')) {
        if (currentSignal) {
          signals.push(currentSignal);
        }
        const titleMatch = line.match(/### (SIG-[^:]+): (.+)/);
        if (titleMatch) {
          currentSignal = {
            id: titleMatch[1],
            title: titleMatch[2],
            source: '',
            signal: '',
            tradeAngle: '',
            morphicFit: '',
          };
        }
      } else if (currentSignal) {
        // Parse signal fields
        if (line.startsWith('**Source:**')) {
          currentSignal.source = line.replace('**Source:**', '').trim();
        } else if (line.startsWith('**Signal:**')) {
          currentSignal.signal = line.replace('**Signal:**', '').trim();
        } else if (line.startsWith('**Trade Angle:**')) {
          currentSignal.tradeAngle = line.replace('**Trade Angle:**', '').trim();
        } else if (line.startsWith('**Morphic Fit:**')) {
          currentSignal.morphicFit = line.replace('**Morphic Fit:**', '').trim();
        }
      }
    }

    // Add last signal
    if (currentSignal) {
      signals.push(currentSignal);
    }

    return {
      title: 'WUKR WIRE INTELLIGENCE',
      date: new Date().toISOString(),
      signals,
      rawContent: markdown,
    };
  },

  /**
   * Get list of recent commits (to show signal history)
   */
  async getRecentCommits(path: string, limit: number = 5): Promise<CommitInfo[]> {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/commits`,
        {
          params: {
            path,
            per_page: limit,
          },
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          },
        }
      );

      return response.data.map((commit: any) => ({
        sha: commit.sha.substring(0, 7),
        message: commit.commit.message.split('\n')[0],
        author: commit.commit.author.name,
        date: new Date(commit.commit.author.date),
      }));
    } catch (error) {
      console.error('Failed to fetch commits:', error);
      return [];
    }
  },

  /**
   * Watch for signal updates (returns timestamp of last commit)
   */
  async getSignalLastUpdate(path: string): Promise<Date | null> {
    const commits = await this.getRecentCommits(path, 1);
    return commits[0]?.date || null;
  },
};
