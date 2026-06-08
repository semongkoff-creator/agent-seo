# 🚀 PROMPT: Integrasi GSC + GA4 ke SEO Agent (Test dengan Data Real Kaitech)

## 🎭 PERSONA

Anda adalah **Senior Fullstack Engineer + SEO Data Specialist** dengan 10 tahun pengalaman:
- OAuth 2.0 Google APIs integration
- Google Search Console API (search analytics, indexing)
- Google Analytics 4 API (Reporting + Admin API)
- Next.js 14 App Router + TypeScript
- Supabase (PostgreSQL + RLS)

Anda paham bedanya **personal OAuth flow** (one-account testing) vs **multi-user OAuth** (production scale). Untuk task ini, kita prioritas **personal flow** dulu untuk testing dengan data Kaitech, tapi architecture harus reusable untuk multi-user nanti.

---

## 📌 CONTEXT

**Project**: SEO Agent V2 — Technical-first SEO platform.

**Tech Stack**:
- Frontend: Next.js 14 App Router (TypeScript) di Vercel — `agent-seo-eight.vercel.app`
- Backend: Next.js API Routes
- Database: Supabase PostgreSQL (existing tables: `projects`, `gsc_metrics`, `ga4_metrics`, etc.)
- Auth: Supabase Auth

**Status**:
- ✅ Database Phase 1 complete (tables `gsc_metrics`, `ga4_metrics` udah ada)
- ✅ Mock data ada di tables
- ✅ Google Cloud project ready (OAuth Client ID + Secret di-setup)
- ✅ User punya akses GSC + GA4 untuk website Kaitech (https://kaitech.io)

**Goal**: 
1. User connect GSC + GA4 via OAuth dari Settings page
2. Sistem fetch data real dari GSC + GA4 Kaitech
3. Save data ke `gsc_metrics` + `ga4_metrics` (replace mock data untuk project Kaitech)
4. Diagnosis workflow consume real data via existing tables

---

## 🎯 TASK

Build OAuth integration GSC + GA4 yang:
1. Settings page dengan 2 card: GSC + GA4 (Connect/Disconnect)
2. OAuth flow lengkap (initiate, callback, refresh token)
3. Property selector setelah connect (pilih property dari list)
4. Data sync endpoint: fetch latest data → save to `gsc_metrics` / `ga4_metrics`
5. Background sync (optional Phase 2): daily auto-fetch

**Scope MVP** (yang prioritas):
- ✅ OAuth flow per-user
- ✅ Connect Kaitech property
- ✅ Manual "Sync Now" button
- ✅ Save real data ke existing tables
- ⏳ Auto-sync background job (Phase 2)

---

## 📋 DETAIL IMPLEMENTASI

### 1. PRE-REQUISITES (User Sudah Siapkan)

Sebelum coding, user harus pastikan:

#### A. Google Cloud Console
- ✅ OAuth 2.0 Client ID created
- ✅ APIs enabled:
  - Google Search Console API
  - Google Analytics Data API (v1beta)
  - Google Analytics Admin API (v1beta)
- ✅ Redirect URIs registered:
  - Production: `https://agent-seo-eight.vercel.app/api/auth/google/callback`
  - Development: `http://localhost:3000/api/auth/google/callback`
- ✅ OAuth Consent Screen configured:
  - Test users include email yang punya akses ke Kaitech GSC/GA4

#### B. GSC Access
- ✅ Email user (test user) terdaftar sebagai Owner/Full/Restricted di property kaitech.io
- ✅ Property URL: `https://kaitech.io/` atau `https://kaitech.io/id` (cek di GSC)
- ✅ Verifikasi domain udah jalan (TXT record atau HTML file)

#### C. GA4 Access
- ✅ Email user terdaftar dengan role Administrator/Editor/Viewer di GA4 Kaitech
- ✅ Property ID Kaitech (format: 9-10 digit angka, contoh: `123456789`)
- ✅ Property name: "Kaitech.io" atau serupa

#### D. Environment Variables di Vercel
```bash
GOOGLE_OAUTH_CLIENT_ID=<from-google-cloud-console>
GOOGLE_OAUTH_CLIENT_SECRET=<from-google-cloud-console>
GOOGLE_OAUTH_REDIRECT_URI=https://agent-seo-eight.vercel.app/api/auth/google/callback
OAUTH_STATE_SECRET=<openssl rand -hex 32>
TOKEN_ENCRYPTION_KEY=<openssl rand -base64 32>
NEXT_PUBLIC_APP_URL=https://agent-seo-eight.vercel.app
```

---

### 2. DATABASE SCHEMA

#### Tabel `oauth_connections` (untuk store user OAuth credentials)

```sql
CREATE TABLE oauth_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('gsc', 'ga4')),
  
  -- Token storage
  access_token TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  
  -- Google user info
  google_email TEXT NOT NULL,
  google_user_id TEXT,
  
  -- Selected property (after user pick)
  connected_resource JSONB DEFAULT '{}'::jsonb,
  /* GSC: { property_url: "https://kaitech.io/", permission_level: "siteOwner" }
     GA4: { property_id: "123456789", property_name: "Kaitech.io", account_id: "...", account_name: "..." } */
  
  status TEXT CHECK (status IN ('active', 'expired', 'revoked', 'error')) DEFAULT 'active',
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, service)
);

CREATE INDEX idx_oauth_user ON oauth_connections(user_id);

-- RLS
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own connections" ON oauth_connections
  FOR ALL USING (auth.uid() = user_id);
```

#### Update `gsc_metrics` & `ga4_metrics` (tambah column untuk track source)

```sql
ALTER TABLE gsc_metrics 
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'mock' 
  CHECK (data_source IN ('mock', 'gsc_api'));

ALTER TABLE gsc_metrics
  ADD COLUMN IF NOT EXISTS date_range JSONB DEFAULT '{}'::jsonb;
/* { "start_date": "2026-05-01", "end_date": "2026-05-31" } */

ALTER TABLE ga4_metrics 
  ADD COLUMN IF NOT EXISTS data_source TEXT DEFAULT 'mock'
  CHECK (data_source IN ('mock', 'ga4_api'));

ALTER TABLE ga4_metrics
  ADD COLUMN IF NOT EXISTS date_range JSONB DEFAULT '{}'::jsonb;
```

---

### 3. FILE STRUCTURE

```
app/
├── settings/
│   └── integrations/
│       ├── page.tsx                            # Settings UI
│       └── components/
│           ├── GSCIntegrationCard.tsx
│           ├── GA4IntegrationCard.tsx
│           ├── PropertySelector.tsx
│           └── SyncStatusIndicator.tsx
├── api/
│   ├── auth/
│   │   └── google/
│   │       ├── initiate/route.ts               # Start OAuth flow
│   │       ├── callback/route.ts               # Handle Google callback
│   │       ├── disconnect/route.ts             # Revoke connection
│   │       └── refresh/route.ts                # Refresh access token
│   └── integrations/
│       ├── gsc/
│       │   ├── properties/route.ts             # List user's GSC properties
│       │   ├── select-property/route.ts        # Save selected property
│       │   └── sync/route.ts                   # Fetch & save GSC data
│       └── ga4/
│           ├── properties/route.ts             # List user's GA4 properties
│           ├── select-property/route.ts        # Save selected property
│           └── sync/route.ts                   # Fetch & save GA4 data
lib/
├── google-oauth.ts                             # OAuth helpers
├── token-encryption.ts                         # AES encryption
├── gsc-client.ts                               # GSC API client
└── ga4-client.ts                               # GA4 API client
hooks/
└── useOAuthConnections.ts                      # React hook
```

---

### 4. OAUTH FLOW

#### A. Initiate (`/api/auth/google/initiate`)

```typescript
// app/api/auth/google/initiate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get('service') as 'gsc' | 'ga4';
  
  if (!['gsc', 'ga4'].includes(service)) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }
  
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // Build signed state
  const stateData = {
    service,
    user_id: user.id,
    csrf_token: crypto.randomBytes(16).toString('hex'),
    ts: Date.now()
  };
  
  const stateB64 = Buffer.from(JSON.stringify(stateData)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', process.env.OAUTH_STATE_SECRET!)
    .update(stateB64)
    .digest('hex');
  const signedState = `${stateB64}.${signature}`;
  
  // Scopes per service
  const SCOPES = {
    gsc: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    ga4: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  };
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
    response_type: 'code',
    scope: SCOPES[service].join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: signedState
  });
  
  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
```

#### B. Callback (`/api/auth/google/callback`)

```typescript
// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { encryptToken } from '@/lib/token-encryption';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');
  const error = searchParams.get('error');
  
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  
  if (error) {
    return NextResponse.redirect(`${appUrl}/settings/integrations?error=${error}`);
  }
  
  if (!code || !stateParam) {
    return NextResponse.redirect(`${appUrl}/settings/integrations?error=missing_params`);
  }
  
  // Verify state signature
  const [stateB64, signature] = stateParam.split('.');
  if (!stateB64 || !signature) {
    return NextResponse.redirect(`${appUrl}/settings/integrations?error=invalid_state`);
  }
  
  const expectedSig = crypto
    .createHmac('sha256', process.env.OAUTH_STATE_SECRET!)
    .update(stateB64)
    .digest('hex');
  
  if (!crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'), 
    Buffer.from(expectedSig, 'hex')
  )) {
    return NextResponse.redirect(`${appUrl}/settings/integrations?error=state_mismatch`);
  }
  
  const stateData = JSON.parse(Buffer.from(stateB64, 'base64url').toString());
  
  // Check expiry (10 min)
  if (Date.now() - stateData.ts > 10 * 60 * 1000) {
    return NextResponse.redirect(`${appUrl}/settings/integrations?error=state_expired`);
  }
  
  // Exchange code untuk tokens
  const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
      grant_type: 'authorization_code'
    })
  });
  
  const tokens = await tokenResp.json();
  if (!tokens.access_token || !tokens.refresh_token) {
    return NextResponse.redirect(`${appUrl}/settings/integrations?error=token_exchange_failed`);
  }
  
  // Fetch Google user info
  const userInfoResp = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  });
  const googleUser = await userInfoResp.json();
  
  // Save to DB
  const supabase = createServerClient();
  const encryptedRefreshToken = encryptToken(tokens.refresh_token);
  
  await supabase
    .from('oauth_connections')
    .upsert({
      user_id: stateData.user_id,
      service: stateData.service,
      access_token: tokens.access_token,
      refresh_token_encrypted: encryptedRefreshToken,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      google_email: googleUser.email,
      google_user_id: googleUser.id,
      status: 'active'
    }, { onConflict: 'user_id,service' });
  
  // Redirect ke property selection
  return NextResponse.redirect(
    `${appUrl}/settings/integrations?service=${stateData.service}&action=select_property`
  );
}
```

#### C. Token Refresh Helper

```typescript
// lib/google-oauth.ts
import { decryptToken } from './token-encryption';
import { createServerClient } from './supabase/server';

export async function getValidAccessToken(userId: string, service: 'gsc' | 'ga4'): Promise<string> {
  const supabase = createServerClient();
  
  const { data: conn } = await supabase
    .from('oauth_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('service', service)
    .single();
  
  if (!conn) throw new Error(`No ${service} connection found`);
  
  // If still valid (with 5 min buffer), return
  const expiresAt = new Date(conn.token_expires_at).getTime();
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return conn.access_token;
  }
  
  // Refresh
  const refreshToken = decryptToken(conn.refresh_token_encrypted);
  const refreshResp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      grant_type: 'refresh_token'
    })
  });
  
  const newTokens = await refreshResp.json();
  if (!newTokens.access_token) {
    await supabase
      .from('oauth_connections')
      .update({ status: 'expired', last_error: 'Refresh failed' })
      .eq('id', conn.id);
    throw new Error('Token refresh failed');
  }
  
  await supabase
    .from('oauth_connections')
    .update({
      access_token: newTokens.access_token,
      token_expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
    })
    .eq('id', conn.id);
  
  return newTokens.access_token;
}
```

---

### 5. GSC INTEGRATION

#### A. List GSC Properties

```typescript
// app/api/integrations/gsc/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/lib/google-oauth';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const accessToken = await getValidAccessToken(user.id, 'gsc');
    
    const resp = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const data = await resp.json();
    const properties = data.siteEntry || [];
    
    return NextResponse.json({ 
      properties: properties.map((p: any) => ({
        site_url: p.siteUrl,
        permission_level: p.permissionLevel
      }))
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### B. Save Selected GSC Property

```typescript
// app/api/integrations/gsc/select-property/route.ts
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { property_url, permission_level } = await req.json();
  
  await supabase
    .from('oauth_connections')
    .update({
      connected_resource: { property_url, permission_level }
    })
    .eq('user_id', user.id)
    .eq('service', 'gsc');
  
  return NextResponse.json({ success: true });
}
```

#### C. Sync GSC Data ke `gsc_metrics`

Ini yang **paling important** — fetch real data dari GSC API dan save ke database.

```typescript
// app/api/integrations/gsc/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/lib/google-oauth';

export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { project_id } = await req.json();
  
  // Get GSC connection
  const { data: conn } = await supabase
    .from('oauth_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('service', 'gsc')
    .single();
  
  if (!conn || !conn.connected_resource?.property_url) {
    return NextResponse.json({ error: 'GSC not connected or property not selected' }, { status: 400 });
  }
  
  const propertyUrl = conn.connected_resource.property_url;
  const accessToken = await getValidAccessToken(user.id, 'gsc');
  
  // Date range: last 30 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  try {
    // 1. Fetch search analytics (impressions, clicks, ctr, position)
    const analyticsResp = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 100
        })
      }
    );
    
    const analyticsData = await analyticsResp.json();
    
    // Aggregate metrics
    const totalImpressions = analyticsData.rows?.reduce((sum: number, r: any) => sum + r.impressions, 0) || 0;
    const totalClicks = analyticsData.rows?.reduce((sum: number, r: any) => sum + r.clicks, 0) || 0;
    const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgPosition = analyticsData.rows?.length 
      ? analyticsData.rows.reduce((sum: number, r: any) => sum + r.position, 0) / analyticsData.rows.length 
      : 0;
    
    // 2. Fetch indexing status
    const sitemapsResp = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(propertyUrl)}/sitemaps`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const sitemapsData = await sitemapsResp.json();
    
    const totalSubmitted = sitemapsData.sitemap?.reduce((sum: number, s: any) => 
      sum + parseInt(s.contents?.[0]?.submitted || '0'), 0) || 0;
    const totalIndexed = sitemapsData.sitemap?.reduce((sum: number, s: any) => 
      sum + parseInt(s.contents?.[0]?.indexed || '0'), 0) || 0;
    
    const indexedPercentage = totalSubmitted > 0 
      ? Math.round((totalIndexed / totalSubmitted) * 100) 
      : 0;
    
    // 3. Save to gsc_metrics
    const dateRange = { start_date: startDate, end_date: endDate };
    
    // Delete old API data for this project (keep only latest)
    await supabase
      .from('gsc_metrics')
      .delete()
      .eq('project_id', project_id)
      .eq('data_source', 'gsc_api');
    
    // Insert new data
    const records = [
      {
        project_id,
        data_source: 'gsc_api',
        metric_type: 'indexed_pages',
        metric_value: { 
          indexed: totalIndexed, 
          total: totalSubmitted, 
          percentage: indexedPercentage 
        },
        date_range: dateRange
      },
      {
        project_id,
        data_source: 'gsc_api',
        metric_type: 'impressions',
        metric_value: { 
          value: totalImpressions, 
          trend_30d: 'measured' // future: compare with previous period
        },
        date_range: dateRange
      },
      {
        project_id,
        data_source: 'gsc_api',
        metric_type: 'avg_ctr',
        metric_value: { 
          value: parseFloat(avgCtr.toFixed(2)), 
          benchmark: 2.3 // industry average
        },
        date_range: dateRange
      },
      {
        project_id,
        data_source: 'gsc_api',
        metric_type: 'keyword_position',
        metric_value: {
          avg_position: parseFloat(avgPosition.toFixed(2)),
          keywords: analyticsData.rows?.slice(0, 30).map((r: any) => ({
            keyword: r.keys[0],
            position: parseFloat(r.position.toFixed(2)),
            impressions: r.impressions,
            clicks: r.clicks,
            ctr: parseFloat((r.ctr * 100).toFixed(2))
          })) || []
        },
        date_range: dateRange
      }
    ];
    
    await supabase.from('gsc_metrics').insert(records);
    
    // Update last_synced_at
    await supabase
      .from('oauth_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', conn.id);
    
    return NextResponse.json({ 
      success: true,
      summary: {
        total_keywords: analyticsData.rows?.length || 0,
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        avg_ctr: parseFloat(avgCtr.toFixed(2)),
        avg_position: parseFloat(avgPosition.toFixed(2)),
        indexed_pages: totalIndexed,
        total_pages: totalSubmitted
      }
    });
  } catch (error: any) {
    await supabase
      .from('oauth_connections')
      .update({ status: 'error', last_error: error.message })
      .eq('id', conn.id);
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 6. GA4 INTEGRATION

#### A. List GA4 Properties

```typescript
// app/api/integrations/ga4/properties/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@/lib/google-oauth';

export async function GET(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const accessToken = await getValidAccessToken(user.id, 'ga4');
    
    // Step 1: List accounts
    const accountsResp = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accounts',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const accountsData = await accountsResp.json();
    const accounts = accountsData.accounts || [];
    
    // Step 2: For each account, list properties
    const allProperties = [];
    for (const account of accounts) {
      const propsResp = await fetch(
        `https://analyticsadmin.googleapis.com/v1beta/properties?filter=parent:${account.name}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const propsData = await propsResp.json();
      
      for (const prop of (propsData.properties || [])) {
        allProperties.push({
          property_id: prop.name.split('/').pop(),
          property_name: prop.displayName,
          account_id: account.name.split('/').pop(),
          account_name: account.displayName
        });
      }
    }
    
    return NextResponse.json({ properties: allProperties });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

#### B. Sync GA4 Data

```typescript
// app/api/integrations/ga4/sync/route.ts
export async function POST(req: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { project_id } = await req.json();
  
  const { data: conn } = await supabase
    .from('oauth_connections')
    .select('*')
    .eq('user_id', user.id)
    .eq('service', 'ga4')
    .single();
  
  if (!conn || !conn.connected_resource?.property_id) {
    return NextResponse.json({ error: 'GA4 not connected' }, { status: 400 });
  }
  
  const propertyId = conn.connected_resource.property_id;
  const accessToken = await getValidAccessToken(user.id, 'ga4');
  
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  try {
    // Fetch core metrics
    const reportResp = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          metrics: [
            { name: 'sessions' },
            { name: 'screenPageViews' },
            { name: 'engagementRate' },
            { name: 'activeUsers' },
            { name: 'newUsers' }
          ]
        })
      }
    );
    
    const reportData = await reportResp.json();
    const row = reportData.rows?.[0];
    
    if (!row) {
      throw new Error('No GA4 data returned');
    }
    
    const sessions = parseInt(row.metricValues[0].value);
    const pageViews = parseInt(row.metricValues[1].value);
    const engagementRate = parseFloat(row.metricValues[2].value) * 100;
    const activeUsers = parseInt(row.metricValues[3].value);
    const newUsers = parseInt(row.metricValues[4].value);
    const returningUsers = activeUsers - newUsers;
    
    // Save to ga4_metrics
    const dateRange = { start_date: startDate, end_date: endDate };
    
    await supabase
      .from('ga4_metrics')
      .delete()
      .eq('project_id', project_id)
      .eq('data_source', 'ga4_api');
    
    const records = [
      {
        project_id,
        data_source: 'ga4_api',
        metric_type: 'session',
        metric_value: { value: sessions, trend_pct: 0 }, // future: trend calc
        date_range: dateRange
      },
      {
        project_id,
        data_source: 'ga4_api',
        metric_type: 'page_view',
        metric_value: { value: pageViews, trend_pct: 0 },
        date_range: dateRange
      },
      {
        project_id,
        data_source: 'ga4_api',
        metric_type: 'engagement_rate',
        metric_value: { 
          value: parseFloat(engagementRate.toFixed(2)), 
          benchmark: 55 
        },
        date_range: dateRange
      },
      {
        project_id,
        data_source: 'ga4_api',
        metric_type: 'visitor',
        metric_value: { 
          new: newUsers, 
          returning: returningUsers, 
          total: activeUsers 
        },
        date_range: dateRange
      }
    ];
    
    await supabase.from('ga4_metrics').insert(records);
    
    await supabase
      .from('oauth_connections')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', conn.id);
    
    return NextResponse.json({
      success: true,
      summary: {
        sessions,
        pageViews,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        activeUsers,
        newUsers,
        returningUsers
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

### 7. SETTINGS UI

#### Main Page

```tsx
// app/settings/integrations/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { GSCIntegrationCard } from './components/GSCIntegrationCard';
import { GA4IntegrationCard } from './components/GA4IntegrationCard';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

export default function IntegrationsPage() {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      toast.error(`OAuth error: ${error}`);
    }
    
    const action = searchParams.get('action');
    if (action === 'select_property') {
      toast.info('Pilih property untuk continue');
    }
  }, [searchParams]);
  
  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Integrations</h1>
      <p className="text-muted-foreground mb-6">
        Connect Google Search Console + Google Analytics 4 untuk auto-fetch data SEO
      </p>
      
      <div className="space-y-4">
        <GSCIntegrationCard />
        <GA4IntegrationCard />
      </div>
    </div>
  );
}
```

#### GSC Card with Sync Button

```tsx
// app/settings/integrations/components/GSCIntegrationCard.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useOAuthConnections } from '@/hooks/useOAuthConnections';
import { PropertySelector } from './PropertySelector';
import { Search, RefreshCw, Unplug } from 'lucide-react';
import { toast } from 'sonner';

export function GSCIntegrationCard() {
  const { connections, refetch } = useOAuthConnections();
  const connection = connections?.find(c => c.service === 'gsc');
  const isConnected = !!connection;
  const hasProperty = !!connection?.connected_resource?.property_url;
  
  const [showPropertySelector, setShowPropertySelector] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const handleConnect = () => {
    window.location.href = '/api/auth/google/initiate?service=gsc';
  };
  
  const handleDisconnect = async () => {
    if (!confirm('Disconnect GSC?')) return;
    await fetch('/api/auth/google/disconnect', {
      method: 'POST',
      body: JSON.stringify({ service: 'gsc' })
    });
    refetch();
    toast.success('GSC disconnected');
  };
  
  const handleSync = async (projectId: string) => {
    setSyncing(true);
    try {
      const resp = await fetch('/api/integrations/gsc/sync', {
        method: 'POST',
        body: JSON.stringify({ project_id: projectId })
      });
      const data = await resp.json();
      
      if (data.success) {
        toast.success(`Synced! ${data.summary.total_keywords} keywords, ${data.summary.total_impressions} impressions`);
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } finally {
      setSyncing(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold">Google Search Console</h3>
              <p className="text-sm text-muted-foreground">
                Auto-fetch indexed pages, impressions, keyword position
              </p>
            </div>
          </div>
          
          {isConnected ? (
            <Badge className="bg-green-100 text-green-700">Connected</Badge>
          ) : (
            <Badge variant="secondary">Not Connected</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {!isConnected ? (
          <Button onClick={handleConnect} className="w-full">
            Connect Google Search Console
          </Button>
        ) : !hasProperty ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Pilih property GSC untuk sync data
            </p>
            <Button onClick={() => setShowPropertySelector(true)} variant="outline" className="w-full">
              Select Property
            </Button>
            {showPropertySelector && (
              <PropertySelector
                service="gsc"
                onSelect={() => {
                  setShowPropertySelector(false);
                  refetch();
                }}
              />
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span>{connection.google_email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property:</span>
                <span className="font-mono text-xs">{connection.connected_resource.property_url}</span>
              </div>
              {connection.last_synced_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last sync:</span>
                  <span>{new Date(connection.last_synced_at).toLocaleString()}</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-2">
              <ProjectSyncSelector onSync={handleSync} syncing={syncing} />
              <Button variant="outline" size="sm" onClick={handleDisconnect}>
                <Unplug className="w-4 h-4 mr-1" />
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Project selector untuk pilih project yang mau di-sync
function ProjectSyncSelector({ onSync, syncing }) {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  
  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data.projects || []));
  }, []);
  
  return (
    <div className="flex gap-2 flex-1">
      <select 
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value)}
        className="border rounded px-2 py-1 text-sm flex-1"
      >
        <option value="">Pilih project...</option>
        {projects.map((p: any) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>
      <Button 
        size="sm" 
        onClick={() => onSync(selectedProject)}
        disabled={!selectedProject || syncing}
      >
        {syncing ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-1" />
            Sync Now
          </>
        )}
      </Button>
    </div>
  );
}
```

#### Property Selector

```tsx
// app/settings/integrations/components/PropertySelector.tsx
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface Props {
  service: 'gsc' | 'ga4';
  onSelect: () => void;
}

export function PropertySelector({ service, onSelect }: Props) {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  
  useEffect(() => {
    fetch(`/api/integrations/${service}/properties`)
      .then(r => r.json())
      .then(data => {
        setProperties(data.properties || []);
        setLoading(false);
      });
  }, [service]);
  
  const handleSelect = async (property: any) => {
    setSelecting(true);
    try {
      const resp = await fetch(`/api/integrations/${service}/select-property`, {
        method: 'POST',
        body: JSON.stringify(property)
      });
      
      if (resp.ok) {
        toast.success(`${service.toUpperCase()} property selected`);
        onSelect();
      }
    } finally {
      setSelecting(false);
    }
  };
  
  if (loading) return <p className="text-sm">Loading properties...</p>;
  if (properties.length === 0) return <p className="text-sm text-muted-foreground">No properties found</p>;
  
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <p className="text-sm font-medium mb-2">Pilih property:</p>
        {properties.map((p, i) => (
          <div key={i} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50">
            <div className="flex-1">
              <p className="font-medium text-sm">
                {service === 'gsc' ? p.site_url : p.property_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {service === 'gsc' ? p.permission_level : `Account: ${p.account_name}`}
              </p>
            </div>
            <Button 
              size="sm" 
              onClick={() => handleSelect(p)}
              disabled={selecting}
            >
              Select
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

---

### 8. INTEGRATION DENGAN EXISTING WORKFLOW

Setelah data tersimpan di `gsc_metrics` + `ga4_metrics` (dengan `data_source='gsc_api'` atau `'ga4_api'`), workflow n8n existing **otomatis** consume real data.

Update node "Fetch Mock GSC Data" di n8n untuk priority real data:

```javascript
// n8n Code Node: Fetch GSC Data
const supabase = supabaseHelper(); // helper

// Try fetch real API data first
let { data: realData } = await supabase
  .from('gsc_metrics')
  .select('*')
  .eq('project_id', $('Verify HMAC (DEV)').first().json.project_id)
  .eq('data_source', 'gsc_api')
  .order('created_at', { ascending: false });

// Fallback to mock if no real data
if (!realData || realData.length === 0) {
  ({ data: realData } = await supabase
    .from('gsc_metrics')
    .select('*')
    .eq('project_id', $('Verify HMAC (DEV)').first().json.project_id)
    .eq('data_source', 'mock'));
}

return realData.map(r => ({ json: r }));
```

(Atau di Supabase node, filter `data_source eq gsc_api` dulu, kalau kosong, baru fallback ke mock.)

---

## ✅ ACCEPTANCE CRITERIA

### Functional
- [ ] User bisa connect GSC via OAuth (redirect ke Google, authorize, callback)
- [ ] User bisa connect GA4 via OAuth
- [ ] Setelah connect, user bisa pilih property dari list
- [ ] User bisa klik "Sync Now" untuk pilih project + fetch data
- [ ] Data real masuk ke `gsc_metrics` dengan `data_source='gsc_api'`
- [ ] Data real masuk ke `ga4_metrics` dengan `data_source='ga4_api'`
- [ ] User bisa disconnect (delete connection, revoke token)
- [ ] Re-trigger diagnosis workflow → AI consume real data

### Security
- [ ] State parameter signed HMAC
- [ ] Refresh token encrypted (AES-256-GCM)
- [ ] RLS aktif di `oauth_connections`
- [ ] HTTPS only di production

### UX
- [ ] Settings page show 2 cards dengan status badges
- [ ] Property selector show list properties dari Google
- [ ] Sync button dengan loading state
- [ ] Toast notification untuk success/error
- [ ] Error message clear (gak generic "Error 500")

---

## 🛠️ DELIVERABLE

1. Migration SQL: `oauth_connections` + alter `gsc_metrics`/`ga4_metrics`
2. OAuth endpoints: initiate, callback, disconnect, refresh
3. GSC endpoints: properties, select-property, sync
4. GA4 endpoints: properties, select-property, sync
5. UI components: 2 cards + PropertySelector
6. Helper libs: `google-oauth.ts`, `token-encryption.ts`, `gsc-client.ts`, `ga4-client.ts`
7. Update n8n workflow untuk priority real data over mock

---

## 🧪 TESTING SCENARIO

### Test 1: Connect & Sync Kaitech GSC
1. Login as user yang punya akses GSC Kaitech
2. Buka `/settings/integrations`
3. Klik "Connect Google Search Console"
4. Authorize di Google consent screen (test user email)
5. Redirect back → property selector
6. Pilih `https://kaitech.io/` (atau `https://kaitech.io/id`)
7. Pilih project Kaitech di SEO Agent
8. Klik "Sync Now"
9. **PASS**: Toast show "Synced! X keywords, Y impressions"
10. **PASS**: Cek Supabase `gsc_metrics` → ada rows dengan `data_source='gsc_api'`

### Test 2: Connect & Sync Kaitech GA4
1. (Same flow) Klik "Connect Google Analytics 4"
2. Authorize
3. Pilih GA4 property Kaitech
4. Sync ke project Kaitech
5. **PASS**: `ga4_metrics` ada rows dengan `data_source='ga4_api'`

### Test 3: Re-trigger Diagnosis dengan Real Data
1. Setelah sync GSC + GA4 berhasil
2. Buka project Kaitech di SEO Agent
3. Re-run "Identify Problem" diagnosis
4. **PASS**: n8n workflow consume real data dari tables
5. **PASS**: AI Agent output reflect real numbers (bukan mock)

### Test 4: Error Handling
1. Disconnect GSC
2. Klik "Sync Now"
3. **PASS**: Error "GSC not connected"
4. Connect ulang
5. **PASS**: Connection restore, sync works

---

## ⚠️ CRITICAL NOTES

### Sebelum Coding

**WAJIB**:
1. Google Cloud Console udah setup (OAuth Client ID, redirect URIs, consent screen)
2. Email lo terdaftar sebagai **Test User** di OAuth Consent Screen
3. Email lo punya akses ke GSC + GA4 Kaitech
4. Env vars sudah set di Vercel + `.env.local`

### Common Issues

1. **"redirect_uri_mismatch"**: URI di env var harus EXACT match dengan yg di-register di Google Cloud
2. **"access_denied"**: User cancel di consent screen, atau email belum di-whitelist sebagai test user
3. **"insufficient permissions"**: GSC/GA4 scope kurang, atau email gak punya akses ke property
4. **GA4 API quota exceeded**: Free tier 200k token/day, biasanya cukup

### Property URL Format GSC

- Domain property: `sc-domain:kaitech.io`
- URL property: `https://kaitech.io/` (dengan trailing slash)
- Sub-folder: `https://kaitech.io/id/`

Hati-hati format saat call API. Encode pakai `encodeURIComponent()`.

---

## 🎬 IMPLEMENTATION ORDER

1. **Day 1**: Database migration + token encryption helper
2. **Day 2**: OAuth flow (initiate + callback)
3. **Day 3**: GSC integration (list + sync)
4. **Day 4**: GA4 integration (list + sync)
5. **Day 5**: UI components (cards + property selector)
6. **Day 6**: Integration testing dengan Kaitech data
7. **Day 7**: Polish + documentation

**Total**: 7 hari kerja (~1 minggu)

---

**Mulai dari setup Google Cloud (kalau belum), lalu database migration. Test dengan Kaitech property sebagai first real integration. Setelah sukses, scale ke multi-user.**
