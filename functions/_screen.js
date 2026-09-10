// ONE DOCUMENT, FOUR URLS, FOUR HEADS.
//
// The site is a single index.html with four client-side screens. /about,
// /projects and /contact are served from that same file, so all four URLs
// shipped byte-identical: same <title>, same description, and a canonical on
// every one of them pointing at "/". sitemap.xml says "index these four";
// canonical says "they are all the homepage". Google follows the canonical,
// so the three extra URLs would be dropped as duplicates -- and the whole
// reason for giving the screens URLs was the sitelinks that come from having
// more than one indexable page.
//
// Rewriting the head in the browser is not enough. The client does update
// canonical and title on navigation, which is right for a reader, but the
// document a crawler FETCHES still says "/". This runs at the edge, so the
// bytes that leave Cloudflare already carry the right head.
//
// A screen file is deliberately thin: one import, one line. The copy lives
// here so the four descriptions can be read side by side.

const ORIGIN = 'https://www.longmotive-m.com';

export const SCREENS = {
  '/about': {
    title: 'About Longmotive | M&E Engineering in Johor',
    description:
      'Longmotive is a Johor-based mechanical and electrical contractor for '
      + 'data centres, working across Malaysia, Indonesia and China. Certifications, '
      + 'track record and how the team is organised.',
  },
  '/projects': {
    title: 'Projects | Longmotive M&E Engineering',
    description:
      'Completed data-centre M&E installations: chiller plant rooms, main '
      + 'switchboards, data halls, rooftop condensers and control rooms. Many open '
      + 'into an interactive 3D BIM viewer.',
  },
  '/contact': {
    title: 'Contact & Careers | Longmotive M&E Engineering',
    description:
      'Send Longmotive a project enquiry, or apply for an engineering role in '
      + 'Iskandar Puteri, Johor. Office +607-550 5651.',
  },
};

// The routed path is the source of truth. Taking it from request.url instead
// would follow a redirect or a trailing slash somewhere unhelpful.
export async function serveScreen(context, path) {
  const meta = SCREENS[path];
  if (!meta) return context.env.ASSETS.fetch(context.request);

  const abs = ORIGIN + path;

  // Fetch the app itself. "/" rather than "/index.html": Pages normalises
  // /index.html to / with a 308, and a fetch aimed at the file name gets
  // caught by that same normalisation.
  const res = await context.env.ASSETS.fetch(new URL('/', context.request.url));

  // A non-HTML answer (an error page, say) must pass through untouched --
  // running HTMLRewriter over it would produce a plausible-looking 200.
  const type = res.headers.get('content-type') || '';
  if (!res.ok || !type.includes('text/html')) return res;

  const set = (attr, value) => ({
    element(el) { el.setAttribute(attr, value); },
  });

  return new HTMLRewriter()
    .on('title', { element(el) { el.setInnerContent(meta.title); } })
    .on('link[rel="canonical"]', set('href', abs))
    .on('meta[property="og:url"]', set('content', abs))
    .on('meta[property="og:title"]', set('content', meta.title))
    .on('meta[property="og:description"]', set('content', meta.description))
    .on('meta[name="description"]', set('content', meta.description))
    .on('meta[name="twitter:title"]', set('content', meta.title))
    .on('meta[name="twitter:description"]', set('content', meta.description))
    .transform(new Response(res.body, res));
}
