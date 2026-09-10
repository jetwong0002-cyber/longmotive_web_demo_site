// /contact -- served from index.html with a head of its own. See _screen.js.
import { serveScreen } from './_screen.js';

export const onRequestGet = (context) => serveScreen(context, '/contact');
