import axios from 'axios';

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

    // Fetch the webpage
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
      },
    });

    const html = response.data;

    // Extract Open Graph and meta tags
    const preview = {
      url: url,
      title: extractMetaTag(html, 'og:title') || extractTitle(html) || validUrl.hostname,
      description: extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description') || '',
      image: extractMetaTag(html, 'og:image') || '',
      siteName: extractMetaTag(html, 'og:site_name') || validUrl.hostname,
    };

    res.json(preview);
  } catch (error) {
    console.error('Link preview error:', error.message);
    res.status(500).json({ error: 'Failed to fetch link preview' });
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
