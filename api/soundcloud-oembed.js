/**
 * SoundCloud metadata proxy
 *
 * SoundCloud's public /oembed endpoint is now frequently blocked by their
 * anti-bot/Cloudflare protection when called from a server (Vercel, etc.),
 * returning random 403/404s even though the endpoint is still "documented".
 * See: https://github.com/soundcloud/api/issues/247, /issues/256
 *
 * The reliable, currently-supported way to fetch track metadata server-side
 * is SoundCloud's OAuth 2.1 REST API using the Client Credentials flow
 * (app-level auth, no user login needed) + the /resolve endpoint.
 * Docs: https://developers.soundcloud.com/docs/api/guide#authentication
 *       https://developers.soundcloud.com/docs/api/guide#resolving
 *
 * Setup:
 *   1. Create a SoundCloud account with Artist Pro (required to register an app)
 *   2. Register an app: https://developers.soundcloud.com/docs/api/register-app
 *   3. Add these to your environment (Vercel dashboard or .env):
 *        SOUNDCLOUD_CLIENT_ID=xxxxx
 *        SOUNDCLOUD_CLIENT_SECRET=xxxxx
 *
 * If those aren't configured, this falls back to the old scraping methods
 * (noembed.com / soundcloud.com/oembed), which may still work intermittently
 * but are not guaranteed by SoundCloud.
 *
 * Usage: GET /api/soundcloud-oembed?url=<encoded-soundcloud-url>
 * Returns: { title, author_name, thumbnail_url, ... }
 */
 
// Module-scope token cache. Serverless functions can reuse a warm instance
// between invocations, so caching here avoids hitting SoundCloud's client
// credentials rate limit (50 tokens / 12h per app, 30 / 1h per IP).
let cachedToken = null; // { access_token, expires_at }
 
async function getClientCredentialsToken() {
  const clientId = process.env.SOUNDCLOUD_CLIENT_ID;
  const clientSecret = process.env.SOUNDCLOUD_CLIENT_SECRET;
 
  if (!clientId || !clientSecret) {
    return null; // not configured, caller should fall back
  }
 
  if (cachedToken && cachedToken.expires_at > Date.now() + 30_000) {
    return cachedToken.access_token;
  }
 
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
 
  const response = await fetch('https://secure.soundcloud.com/oauth/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json; charset=utf-8',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuth}`,
    },
    body: 'grant_type=client_credentials',
  });
 
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`SoundCloud token request failed: ${response.status} ${errText}`);
  }
 
  const tokenData = await response.json();
  cachedToken = {
    access_token: tokenData.access_token,
    // expires_in is in seconds (~3600); refresh a bit early
    expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
  };
 
  return cachedToken.access_token;
}
 
/**
 * Fetch track/user/playlist metadata via the official /resolve endpoint.
 * Returns a raw SoundCloud API resource (track, user, or playlist object).
 */
async function fetchViaResolveApi(url, isRetry = false) {
  const token = await getClientCredentialsToken();
  if (!token) return null;
 
  const resolveUrl = `https://api.soundcloud.com/resolve?url=${encodeURIComponent(url)}`;
  const response = await fetch(resolveUrl, {
    headers: {
      'Accept': 'application/json; charset=utf-8',
      'Authorization': `OAuth ${token}`,
    },
  });
 
  if (response.status === 401 && !isRetry) {
    // Token may have been invalidated server-side; force a refresh and retry once.
    cachedToken = null;
    return fetchViaResolveApi(url, true);
  }
 
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`SoundCloud /resolve failed: ${response.status} ${errText}`);
  }
 
  return response.json();
}
 
/** Normalize a SoundCloud API track/playlist/user resource into our shape. */
function normalizeResolveResource(resource, url) {
  const title = resource.title || resource.full_name || resource.username || '';
  const authorName =
    (resource.user && (resource.user.username || resource.user.full_name)) ||
    resource.username ||
    '';
  const artworkUrl = resource.artwork_url || (resource.user && resource.user.avatar_url) || '';
 
  return {
    title,
    author_name: authorName,
    thumbnail_url: artworkUrl,
    // Build a standard SoundCloud widget embed for the html field, since
    // /resolve doesn't return one directly.
    html: `<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodeURIComponent(resource.uri || url)}&show_artwork=true"></iframe>`,
    height: 166,
    width: '100%',
  };
}
 
/** Old fallback path: scrape noembed.com / soundcloud.com/oembed directly. */
async function fetchViaOembedScraping(url) {
  let data = null;
  let lastError = null;
 
  // Attempt 1: noembed.com
  try {
    const noembed = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
    const response = await fetch(noembed, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    if (response.ok) {
      const noembed_data = await response.json();
      if (noembed_data.title && noembed_data.title !== 'Not Found') {
        data = noembed_data;
      } else {
        lastError = 'noembed.com returned empty data';
      }
    } else {
      lastError = `noembed.com returned ${response.status}`;
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Unknown error with noembed.com';
  }
 
  // Attempt 2: SoundCloud's own oEmbed endpoint
  if (!data || !data.title) {
    try {
      const oembedUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (response.ok) {
        const sc_data = await response.json();
        if (sc_data.title && sc_data.title !== 'Not Found') {
          data = sc_data;
        } else {
          lastError = 'SoundCloud oEmbed returned empty data';
        }
      } else {
        const errorText = await response.text();
        lastError = `SoundCloud oEmbed returned ${response.status}: ${errorText}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error with SoundCloud oEmbed';
    }
  }
 
  // Attempt 3: Iframely, if an API key is configured
  if ((!data || !data.title) && process.env.IFRAMELY_API_KEY) {
    try {
      const iframelyUrl = `https://iframe.ly/api/oembed?url=${encodeURIComponent(url)}&api_key=${process.env.IFRAMELY_API_KEY}`;
      const response = await fetch(iframelyUrl, { headers: { 'Accept': 'application/json' } });
      if (response.ok) {
        const iframely_data = await response.json();
        if (iframely_data.title && iframely_data.title !== 'Not Found') {
          data = iframely_data;
        }
      }
    } catch (err) {
      // ignore, we're out of fallbacks
    }
  }
 
  if (!data || !data.title) {
    throw new Error(lastError || 'All oEmbed fallbacks returned empty data');
  }
 
  return {
    title: data.title || '',
    author_name: data.author_name || data.author_url || '',
    thumbnail_url: data.thumbnail_url || data.image || '',
    html: data.html || '',
    height: data.height || 0,
    width: data.width || 0,
  };
}
 
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const url = req.query.url;
 
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }
 
  if (!url.includes('soundcloud.com')) {
    return res.status(400).json({ error: 'URL must be a SoundCloud link' });
  }
 
  let normalized = null;
  let lastError = null;
 
  // Preferred path: official REST API via /resolve (requires SOUNDCLOUD_CLIENT_ID/SECRET)
  try {
    const resource = await fetchViaResolveApi(url);
    if (resource) {
      normalized = normalizeResolveResource(resource, url);
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Unknown error calling /resolve';
    console.error('SoundCloud /resolve error:', lastError);
  }
 
  // Fallback path: scrape the public oEmbed endpoints (best-effort, may 403 randomly)
  if (!normalized) {
    try {
      normalized = await fetchViaOembedScraping(url);
    } catch (err) {
      lastError = err instanceof Error ? err.message : lastError;
      console.error('SoundCloud oEmbed fallback error:', lastError);
    }
  }
 
  if (!normalized) {
    return res.status(502).json({
      error: 'Could not fetch SoundCloud metadata',
      details:
        lastError ||
        'All services returned empty data. The track may be private, the URL may be invalid, or SOUNDCLOUD_CLIENT_ID/SOUNDCLOUD_CLIENT_SECRET may need to be configured.',
    });
  }
 
  // Normalize thumbnail to a larger size, same as before
  let thumbnailUrl = normalized.thumbnail_url || '';
  if (thumbnailUrl) {
    thumbnailUrl = thumbnailUrl.replace('-large', '-t500x500');
  }
 
  return res.status(200).json({
    title: normalized.title,
    author_name: normalized.author_name,
    thumbnail_url: thumbnailUrl,
    html: normalized.html,
    height: normalized.height,
    width: normalized.width,
    url,
  });
}
 