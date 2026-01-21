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
   * Now supports both structured signals and raw markdown content
   */
  async generatePersonalizedEmail(
    contact: Contact,
    content: any,
    newsletterTitle: string
  ): Promise<{ html: string; text: string }> {
    // Check if content is structured signal or raw markdown
    const isMarkdown = typeof content.rawContent === 'string' && !content.signals;

    if (isMarkdown) {
      // Handle newsletter/proposal markdown content
      return this.generatePersonalizedMarkdownEmail(contact, content, newsletterTitle);
    }

    // Original signal format (keep for backwards compatibility)
    const signal = content as Signal;

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

  /**
   * Generate personalized email from markdown content (newsletters/proposals)
   */
  async generatePersonalizedMarkdownEmail(
    contact: Contact,
    content: any,
    newsletterTitle: string
  ): Promise<{ html: string; text: string }> {
    try {
      // Generate personalized introduction using Claude
      const introPrompt = `You are writing a personalized email introduction for a ${content.type || 'newsletter'}.

CONTACT DETAILS:
- Company: ${contact.company || 'Unknown'}
- Sector: ${contact.sector}
- Email: ${contact.email}

CONTENT SUBJECT: ${content.subject || newsletterTitle}
CONTENT TYPE: ${content.type === 'proposal' ? 'Partnership Proposal' : 'Newsletter'}

CONTENT PREVIEW:
${content.rawContent.substring(0, 500)}...

TASK:
Write a warm, professional 2-3 sentence personalized introduction that:
1. Greets the contact (use company name if name not available)
2. Explains why this ${content.type || 'content'} is relevant to their ${contact.sector} sector
3. Sets context for what follows
4. Maintains a professional but friendly tone

Keep it under 60 words.`;

      const introMessage = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [{ role: 'user', content: introPrompt }],
      });

      const introContent = introMessage.content.find((c) => c.type === 'text');
      const intro = introContent && 'text' in introContent
        ? introContent.text
        : `Hi there,\n\nWe thought this ${content.type || 'update'} would be particularly relevant for ${contact.sector}. Here's what you need to know:`;

      // Convert markdown to HTML using Claude
      const htmlPrompt = `Convert this markdown content into clean, professional HTML email content.

MARKDOWN CONTENT:
${content.rawContent}

REQUIREMENTS:
1. Convert markdown formatting (headers, bold, lists, etc.) to proper HTML
2. Maintain all the original content
3. Use clean, semantic HTML
4. Add subtle styling for readability (line-height, spacing)
5. Make links clickable
6. Keep it email-safe (inline styles only)
7. Do NOT include <html>, <head>, or <body> tags - just the content HTML
8. Do NOT add any introductions or conclusions - just convert the markdown

Return ONLY the HTML content, nothing else.`;

      const htmlMessage = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{ role: 'user', content: htmlPrompt }],
      });

      const htmlContent = htmlMessage.content.find((c) => c.type === 'text');
      const bodyHtml = htmlContent && 'text' in htmlContent
        ? htmlContent.text
        : content.rawContent.replace(/\n/g, '<br>');

      // Build complete HTML email
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
      max-width: 650px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f9fafb;
    }
    .header {
      background: linear-gradient(135deg, ${content.type === 'proposal' ? '#7c3aed 0%, #db2777 100%' : '#667eea 0%, #764ba2 100%'});
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
      padding: 35px 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .intro {
      font-size: 16px;
      margin-bottom: 30px;
      padding: 18px;
      background: #f3f4f6;
      border-left: 4px solid ${content.type === 'proposal' ? '#7c3aed' : '#667eea'};
      border-radius: 4px;
      line-height: 1.7;
    }
    .sector-tag {
      display: inline-block;
      background: ${content.type === 'proposal' ? '#7c3aed' : '#667eea'};
      color: white;
      padding: 5px 14px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 20px;
      letter-spacing: 0.5px;
    }
    .main-content {
      font-size: 15px;
      line-height: 1.8;
      color: #374151;
    }
    .main-content h1, .main-content h2, .main-content h3 {
      color: #111827;
      margin-top: 30px;
      margin-bottom: 15px;
      font-weight: 700;
    }
    .main-content h1 { font-size: 26px; }
    .main-content h2 { font-size: 22px; }
    .main-content h3 { font-size: 18px; }
    .main-content p {
      margin: 15px 0;
    }
    .main-content ul, .main-content ol {
      margin: 15px 0;
      padding-left: 25px;
    }
    .main-content li {
      margin: 8px 0;
    }
    .main-content a {
      color: ${content.type === 'proposal' ? '#7c3aed' : '#667eea'};
      text-decoration: none;
      border-bottom: 1px solid ${content.type === 'proposal' ? '#ddd6fe' : '#e0e7ff'};
    }
    .main-content a:hover {
      border-bottom-color: ${content.type === 'proposal' ? '#7c3aed' : '#667eea'};
    }
    .main-content strong {
      color: #111827;
      font-weight: 600;
    }
    .main-content blockquote {
      border-left: 3px solid #e5e7eb;
      padding-left: 20px;
      margin: 20px 0;
      color: #6b7280;
      font-style: italic;
    }
    .footer {
      text-align: center;
      margin-top: 35px;
      padding: 25px;
      font-size: 13px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .footer a {
      color: ${content.type === 'proposal' ? '#7c3aed' : '#667eea'};
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

    <div class="main-content">
      ${bodyHtml}
    </div>
  </div>

  <div class="footer">
    <p><strong>WUKR Wire Intelligence</strong> | Powered by MANUS</p>
    <p style="margin-top: 10px;">
      <a href="https://github.com/hypnoticproductions/quintapoo-memory">View Content Source on GitHub</a>
    </p>
    <p style="margin-top: 15px; font-size: 11px; color: #9ca3af;">
      Sent to ${contact.email} | ${contact.company || 'Your Organization'}
    </p>
  </div>
</body>
</html>
      `.trim();

      // Generate plain text version
      const text = `
${newsletterTitle}
${'='.repeat(newsletterTitle.length)}

${intro}

---

${content.rawContent}

---

WUKR Wire Intelligence | Powered by MANUS
View Content Source: https://github.com/hypnoticproductions/quintapoo-memory

Sent to ${contact.email} | ${contact.company || 'Your Organization'}
      `.trim();

      return { html, text };
    } catch (error) {
      console.error('Claude markdown email generation error:', error);

      // Fallback to simple format
      const simpleHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${newsletterTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    .header { background: #667eea; color: white; padding: 20px; text-align: center; }
    .content { background: white; padding: 30px; }
    pre { white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <div class="header">
    <h1>WUKR WIRE</h1>
    <p>${newsletterTitle}</p>
  </div>
  <div class="content">
    <p>Hi ${contact.company || 'there'},</p>
    <p>Here's the latest from WUKR Wire for the ${contact.sector} sector:</p>
    <hr>
    <pre>${content.rawContent}</pre>
  </div>
</body>
</html>
      `.trim();

      return {
        html: simpleHtml,
        text: `${newsletterTitle}\n\n${content.rawContent}`
      };
    }
  },
};
