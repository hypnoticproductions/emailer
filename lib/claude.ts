// lib/claude.ts
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface Contact {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  title?: string | null;
  sector: string;
}

export interface Signal {
  title: string;
  date: string;
  signals: Array<{
    id: string;
    title: string;
    source: string;
    signal: string;
    tradeAngle: string;
    morphicFit: string;
  }>;
  rawContent: string;
}

export const claudeClient = {
  /**
   * Generate personalized email intro for a contact based on their sector
   */
  async generatePersonalizedIntro(
    contact: Contact,
    signal: Signal,
    newsletterTitle: string
  ): Promise<string> {
    const prompt = `You are writing a personalized introduction for a WUKR Wire intelligence signal email.

CONTACT DETAILS:
- Name: ${contact.firstName || ''} ${contact.lastName || ''}
- Company: ${contact.company || 'Unknown'}
- Title: ${contact.title || 'Unknown'}
- Sector: ${contact.sector}

SIGNAL OVERVIEW:
${signal.signals.slice(0, 3).map(s => `- ${s.title}: ${s.signal}`).join('\n')}

TASK:
Write a 2-3 sentence personalized introduction that:
1. Addresses the contact by name (if available)
2. Connects the signal to their specific sector (${contact.sector})
3. Explains why this intelligence matters for their work
4. Maintains a professional, direct tone (no hype)

Keep it under 75 words. Do not include greetings like "Hi" or "Hello". Start directly with their name or the context.`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      return textContent && 'text' in textContent ? textContent.text : '';
    } catch (error) {
      console.error('Claude API error:', error);
      // Fallback intro
      return `${contact.firstName || 'Hi there'},\n\nThis week's WUKR Wire signal includes intelligence relevant to ${contact.sector}. Below are the key developments.`;
    }
  },

  /**
   * Generate sector-specific summary
   */
  async generateSectorSummary(sector: string, signal: Signal): Promise<string> {
    const prompt = `You are summarizing WUKR Wire intelligence for the ${sector} sector.

SIGNALS:
${signal.signals.map(s => `${s.id}: ${s.title}\n${s.signal}\nTrade Angle: ${s.tradeAngle}`).join('\n\n')}

TASK:
Write a 3-4 sentence summary that:
1. Identifies which signals are most relevant to ${sector}
2. Explains the strategic implications for this sector
3. Highlights actionable insights or opportunities

Keep it under 100 words. Be direct and analytical.`;

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 250,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const textContent = message.content.find((c) => c.type === 'text');
      return textContent && 'text' in textContent ? textContent.text : '';
    } catch (error) {
      console.error('Claude API error:', error);
      return `Key signals for ${sector}: ${signal.signals.slice(0, 2).map(s => s.title).join(', ')}.`;
    }
  },

  /**
   * Generate complete personalized email HTML
   */
  async generatePersonalizedEmail(
    contact: Contact,
    signal: Signal,
    newsletterTitle: string
  ): Promise<{ html: string; text: string }> {
    // Generate personalized intro
    const intro = await this.generatePersonalizedIntro(
      contact,
      signal,
      newsletterTitle
    );

    // Generate sector summary
    const sectorSummary = await this.generateSectorSummary(contact.sector, signal);

    // Build HTML email
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${newsletterTitle}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
    }
    .header p {
      margin: 5px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .content {
      background: white;
      padding: 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .intro {
      font-size: 16px;
      margin-bottom: 25px;
      padding: 15px;
      background: #f3f4f6;
      border-left: 4px solid #667eea;
      border-radius: 4px;
    }
    .sector-tag {
      display: inline-block;
      background: #667eea;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 15px;
    }
    .summary {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .summary h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #92400e;
    }
    .signal {
      margin: 25px 0;
      padding: 20px;
      background: #f9fafb;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .signal h3 {
      margin: 0 0 10px 0;
      font-size: 18px;
      color: #111827;
    }
    .signal-meta {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 12px;
    }
    .signal-content {
      font-size: 15px;
      color: #374151;
      line-height: 1.6;
    }
    .signal-label {
      font-weight: 600;
      color: #111827;
      display: block;
      margin-top: 12px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding: 20px;
      font-size: 13px;
      color: #6b7280;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>WUKR WIRE</h1>
    <p>${newsletterTitle}</p>
  </div>

  <div class="content">
    <span class="sector-tag">${contact.sector.replace(/_/g, ' ')}</span>

    <div class="intro">
      ${intro}
    </div>

    <div class="summary">
      <h3>📊 Sector Intelligence: ${contact.sector.replace(/_/g, ' ').toUpperCase()}</h3>
      <p>${sectorSummary}</p>
    </div>

    <h2 style="font-size: 20px; margin-top: 30px; margin-bottom: 20px;">Top Signals</h2>

    ${signal.signals.map(s => `
      <div class="signal">
        <h3>${s.title}</h3>
        <p class="signal-meta">${s.source}</p>
        <div class="signal-content">
          <p><strong>Signal:</strong> ${s.signal}</p>
          <span class="signal-label">Trade Angle:</span>
          <p>${s.tradeAngle}</p>
          <span class="signal-label">Morphic Fit:</span>
          <p>${s.morphicFit}</p>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="footer">
    <p>WUKR Wire Intelligence | Powered by MANUS</p>
    <p>
      <a href="https://github.com/hypnoticproductions/quintapoo-memory">View Signal Source</a>
    </p>
  </div>
</body>
</html>
    `.trim();

    // Generate plain text version
    const text = `
${newsletterTitle}

${intro}

SECTOR INTELLIGENCE: ${contact.sector.toUpperCase()}
${sectorSummary}

TOP SIGNALS:

${signal.signals.map(s => `
${s.title}
Source: ${s.source}

Signal: ${s.signal}

Trade Angle: ${s.tradeAngle}

Morphic Fit: ${s.morphicFit}
`).join('\n---\n')}

---
WUKR Wire Intelligence | Powered by MANUS
    `.trim();

    return { html, text };
  },
};
