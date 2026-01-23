// lib/github.ts
import axios from 'axios';

export interface GithubFile {
  name: string;
  path: string;
  content: string;
  sha: string;
}

export interface ContentFile {
  name: string;
  path: string;
  type: 'newsletter' | 'proposal';
  download_url: string;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: Date;
}

export const githubClient = {
  /**
   * List all newsletters available in the newsletters folder
   */
  async listNewsletters(): Promise<ContentFile[]> {
    try {
      console.log('[github] Listing newsletters...');
      console.log('[github] Owner:', process.env.GITHUB_OWNER);
      console.log('[github] Repo:', process.env.GITHUB_REPO);
      console.log('[github] Token:', process.env.GITHUB_TOKEN ? 'SET' : 'MISSING');

      const response = await axios.get(
        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/newsletters`,
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          },
        }
      );

      const files = response.data
        .filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))
        .map((file: any) => ({
          name: file.name,
          path: file.path,
          type: 'newsletter',
          download_url: file.download_url,
        }));

      console.log('[github] Found newsletters:', files.map((f: any) => f.name));
      return files;
    } catch (error) {
      console.error('Failed to list newsletters:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
      }
      return [];
    }
  },

  /**
   * List all proposals available in the proposals folder
   */
  async listProposals(): Promise<ContentFile[]> {
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/proposals`,
        {
          headers: {
            Authorization: `token ${process.env.GITHUB_TOKEN}`,
          },
        }
      );

      return response.data
        .filter((file: any) => file.type === 'file' && file.name.endsWith('.md'))
        .map((file: any) => ({
          name: file.name,
          path: file.path,
          type: 'proposal',
          download_url: file.download_url,
        }));
    } catch (error) {
      console.error('Failed to list proposals:', error);
      return [];
    }
  },

  /**
   * Fetch a file from the repository
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

      let content = response.data;

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
   * Get the latest newsletter or proposal
   */
  async getLatestContent(type: 'newsletter' | 'proposal' = 'newsletter'): Promise<any> {
    try {
      console.log(`[github] Getting latest ${type}...`);
      const files = type === 'newsletter'
        ? await this.listNewsletters()
        : await this.listProposals();

      console.log(`[github] Found ${files.length} files:`, files.map(f => f.name));

      if (files.length === 0) {
        throw new Error(`No ${type}s found in repository`);
      }

      // Get the most recent file by sorting alphabetically descending (newest dates first)
      const nonTemplateFiles = files.filter(f => !f.name.includes('template'));
      const sortedFiles = nonTemplateFiles.sort((a, b) => b.name.localeCompare(a.name));
      const latestFile = sortedFiles[0] || files[0];

      console.log(`[github] Selected file:`, latestFile.name);

      const content = await this.getFile(latestFile.path);

      if (!content) {
        throw new Error(`Failed to fetch ${type}: ${latestFile.name}`);
      }

      // Parse the markdown content
      const parsed = this.parseMarkdown(content.content, type);

      return {
        ...parsed,
        fileName: latestFile.name,
        filePath: latestFile.path,
        type,
      };
    } catch (error) {
      console.error(`Failed to get latest ${type}:`, error);
      throw error;
    }
  },

  /**
   * Get specific content by filename
   */
  async getContentByName(filename: string, type: 'newsletter' | 'proposal'): Promise<any> {
    try {
      const folder = type === 'newsletter' ? 'newsletters' : 'proposals';
      const path = `${folder}/${filename}`;

      const content = await this.getFile(path);

      if (!content) {
        throw new Error(`File not found: ${filename}`);
      }

      const parsed = this.parseMarkdown(content.content, type);

      return {
        ...parsed,
        fileName: filename,
        filePath: path,
        type,
      };
    } catch (error) {
      console.error(`Failed to get ${type} ${filename}:`, error);
      throw error;
    }
  },

  /**
   * Parse markdown content to extract metadata and format
   */
  parseMarkdown(markdown: string, type: 'newsletter' | 'proposal'): any {
    const lines = markdown.split('\n');

    // Extract metadata from markdown headers
    const metadata: any = {
      rawContent: markdown,
    };

    // Extract subject line (first line starting with # or **Subject:**)
    const titleLine = lines.find(line => line.startsWith('# '));
    if (titleLine) {
      metadata.title = titleLine.replace('# ', '').trim();
    }

    // Extract subject from **Subject:** line
    const subjectLine = lines.find(line => line.startsWith('**Subject:**'));
    if (subjectLine) {
      metadata.subject = subjectLine.replace('**Subject:**', '').trim();
    }

    // Extract from line
    const fromLine = lines.find(line => line.startsWith('**From:**'));
    if (fromLine) {
      metadata.from = fromLine.replace('**From:**', '').trim();
    }

    // Extract date line
    const dateLine = lines.find(line => line.startsWith('**Date:**'));
    if (dateLine) {
      metadata.date = dateLine.replace('**Date:**', '').trim();
    }

    // Extract edition (for newsletters)
    const editionLine = lines.find(line => line.startsWith('**Edition:**'));
    if (editionLine) {
      metadata.edition = editionLine.replace('**Edition:**', '').trim();
    }

    // Use title as subject if subject not found
    if (!metadata.subject && metadata.title) {
      metadata.subject = metadata.title;
    }

    // Default values
    if (!metadata.subject) {
      metadata.subject = type === 'newsletter'
        ? 'WUKR Wire Intelligence Update'
        : 'Partnership Opportunity - WUKR Wire';
    }

    if (!metadata.title) {
      metadata.title = metadata.subject;
    }

    return metadata;
  },

  /**
   * Get list of recent commits (to show content history)
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
   * Watch for content updates (returns timestamp of last commit)
   */
  async getContentLastUpdate(path: string): Promise<Date | null> {
    const commits = await this.getRecentCommits(path, 1);
    return commits[0]?.date || null;
  },
};
