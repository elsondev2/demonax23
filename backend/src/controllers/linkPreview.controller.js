import axios from 'axios';
import https from 'https';

export const getLinkPreview = async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Security: Only allow http and https protocols
    if (!['http:', 'https:'].includes(validUrl.protocol)) {
      return res.status(400).json({ error: 'Invalid URL protocol' });
    }

    console.log('Fetching link preview for:', url);

    // Fetch the webpage with better error handling
    const response = await axios.get(url, {
      timeout: 10000, // Increased to 10 seconds
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      // Allow self-signed certificates in development
      httpsAgent: new https.Agent({
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      }),
      validateStatus: (status) => {
        // Accept any status code less than 500
        return status < 500;
      }
    });

    // Check if we got HTML content
    const contentType = response.headers['content-type'] || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      console.log('Non-HTML content type:', contentType);
      // Return basic info for non-HTML content
      return res.json({
        url: url,
        title: validUrl.hostname,
        description: 'Link preview not available',
        image: '',
        siteName: validUrl.hostname,
      });
    }

    const html = response.data;

    // Extract Open Graph and meta tags
    const preview = {
      url: url,
      title: extractMetaTag(html, 'og:title') || extractTitle(html) || validUrl.hostname,
      description: extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description') || '',
      image: extractMetaTag(html, 'og:image') || extractMetaTag(html, 'twitter:image') || '',
      siteName: extractMetaTag(html, 'og:site_name') || validUrl.hostname,
    };

    // Make image URL absolute if it's relative
    if (preview.image && !preview.image.startsWith('http')) {
      try {
        preview.image = new URL(preview.image, url).href;
      } catch (e) {
        console.log('Failed to resolve image URL:', e.message);
        preview.image = '';
      }
    }

    console.log('Link preview extracted:', {
      url: preview.url,
      title: preview.title?.substring(0, 50),
      hasImage: !!preview.image
    });

    res.json(preview);
  } catch (error) {
    console.error('Link preview error:', {
      message: error.message,
      code: error.code,
      url: req.query.url
    });

    // Return a basic fallback preview instead of error
    try {
      const validUrl = new URL(req.query.url);
      return res.json({
        url: req.query.url,
        title: validUrl.hostname,
        description: '',
        image: '',
        siteName: validUrl.hostname,
      });
    } catch {
      return res.status(500).json({ error: 'Failed to fetch link preview' });
    }
  }
};

// Helper function to extract meta tags
function extractMetaTag(html, property) {
  // Try Open Graph tags
  const ogRegex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
  const ogMatch = html.match(ogRegex);
  if (ogMatch) return ogMatch[1];

  // Try name attribute
  const nameRegex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
  const nameMatch = html.match(nameRegex);
  if (nameMatch) return nameMatch[1];

  // Try reversed order (content before property/name)
  const reverseOgRegex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`, 'i');
  const reverseOgMatch = html.match(reverseOgRegex);
  if (reverseOgMatch) return reverseOgMatch[1];

  const reverseNameRegex = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`, 'i');
  const reverseNameMatch = html.match(reverseNameRegex);
  if (reverseNameMatch) return reverseNameMatch[1];

  return null;
}

// Helper function to extract title from <title> tag
function extractTitle(html) {
  const titleRegex = /<title[^>]*>([^<]*)<\/title>/i;
  const match = html.match(titleRegex);
  return match ? match[1].trim() : null;
}
