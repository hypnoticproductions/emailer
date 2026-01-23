// app/api/debug/github/route.ts - Debug GitHub connectivity
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET() {
  try {
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      env_vars: {
        GITHUB_TOKEN: process.env.GITHUB_TOKEN ? 'SET' : 'MISSING',
        GITHUB_OWNER: process.env.GITHUB_OWNER || 'MISSING',
        GITHUB_REPO: process.env.GITHUB_REPO || 'MISSING',
      },
      tests: {},
    };

    // Test 1: List newsletters
    try {
      const url = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/newsletters`;
      console.log('Testing URL:', url);

      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      });

      diagnostics.tests.list_newsletters = {
        status: 'SUCCESS',
        files_found: response.data.length,
        files: response.data.map((f: any) => f.name),
      };
    } catch (error) {
      diagnostics.tests.list_newsletters = {
        status: 'FAILED',
        error: axios.isAxiosError(error) ? {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        } : String(error),
      };
    }

    // Test 2: Fetch specific file
    try {
      const url = `https://api.github.com/repos/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/contents/newsletters/wukr_wire_jan23_2026.md`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3.raw',
        },
      });

      diagnostics.tests.fetch_file = {
        status: 'SUCCESS',
        content_length: response.data.length,
        content_preview: response.data.substring(0, 100),
      };
    } catch (error) {
      diagnostics.tests.fetch_file = {
        status: 'FAILED',
        error: axios.isAxiosError(error) ? {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        } : String(error),
      };
    }

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Diagnostic failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
