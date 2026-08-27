/**
 * SoundCloud oEmbed proxy
 * Fetches SoundCloud metadata server-side and normalizes the response
 * 
 * Usage: GET /api/soundcloud-oembed?url=<encoded-soundcloud-url>
 * Returns: { title, author_name, thumbnail_url, ... }
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    // Validate it's a SoundCloud URL
    if (!url.includes('soundcloud.com')) {
      return res.status(400).json({ error: 'URL must be a SoundCloud link' });
    }

    // Try multiple methods to fetch SoundCloud metadata
    let data = null;
    let lastError = null;

    // Attempt 1: Try noembed.com first (more reliable for public tracks)
    try {
      console.log('Attempting noembed.com...');
      const noembed = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
      const response = await fetch(noembed, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
      });

      if (response.ok) {
        const noembed_data = await response.json();
        if (noembed_data.title && noembed_data.title !== 'Not Found') {
          data = noembed_data;
          console.log('✓ noembed.com success:', {
            title: data.title,
            author_name: data.author_name,
            thumbnail_url: data.thumbnail_url?.substring(0, 50) + '...',
          });
        } else {
          lastError = 'noembed.com returned empty data';
        }
      } else {
        lastError = `noembed.com returned ${response.status}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error with noembed.com';
      console.log('noembed.com failed:', lastError);
    }

    // Attempt 2: Try SoundCloud oEmbed with proper headers
    if (!data || !data.title) {
      try {
        console.log('Attempting SoundCloud oEmbed...');
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
            console.log('✓ SoundCloud oEmbed success:', {
              title: data.title,
              author_name: data.author_name,
              thumbnail_url: data.thumbnail_url?.substring(0, 50) + '...',
            });
          } else {
            lastError = 'SoundCloud oEmbed returned empty data';
          }
        } else {
          const errorText = await response.text();
          lastError = `SoundCloud API returned ${response.status}: ${errorText}`;
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error with SoundCloud oEmbed';
        console.log('SoundCloud oEmbed failed:', lastError);
      }
    }

    // Attempt 3: Try Iframely as another fallback
    if (!data || !data.title) {
      try {
        console.log('Attempting Iframely...');
        const iframelyUrl = `https://iframe.ly/api/oembed?url=${encodeURIComponent(url)}&api_key=${process.env.IFRAMELY_API_KEY || ''}`;
        const response = await fetch(iframelyUrl, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const iframely_data = await response.json();
          if (iframely_data.title && iframely_data.title !== 'Not Found') {
            data = iframely_data;
            console.log('✓ Iframely success:', {
              title: data.title,
              author_name: data.author_name,
              thumbnail_url: data.thumbnail_url?.substring(0, 50) + '...',
            });
          }
        }
      } catch (err) {
        console.log('Iframely failed:', err instanceof Error ? err.message : 'Unknown error');
      }
    }

    // If still no data, return error
    if (!data || !data.title) {
      console.error('Failed to fetch SoundCloud metadata. Last error:', lastError);
      return res.status(502).json({ 
        error: 'Could not fetch SoundCloud metadata',
        details: lastError || 'All services returned empty data. The track may be private or the URL may be invalid.'
      });
    }

    // Normalize response
    const normalized = {
      title: data.title || '',
      author_name: data.author_name || data.author_url || '',
      thumbnail_url: data.thumbnail_url || data.image || '',
      html: data.html || '',
      height: data.height || 0,
      width: data.width || 0,
      url: url,
    };

    console.log('SoundCloud metadata normalized:', {
      title: normalized.title,
      author_name: normalized.author_name,
      thumbnail_url: normalized.thumbnail_url?.substring(0, 50) + '...',
    });

    return res.status(200).json(normalized);

  } catch (err) {
    console.error('SoundCloud proxy error:', err);
    return res.status(500).json({ 
      error: 'Proxy fetch failed',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}
