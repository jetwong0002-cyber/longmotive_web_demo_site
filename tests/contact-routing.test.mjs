import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../functions/api/contact.js', import.meta.url), 'utf8');
const { onRequestPost } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const originalFetch = globalThis.fetch;
const messages = [];
globalThis.fetch = async (url, options) => {
  assert.equal(url, 'https://api.resend.com/emails');
  messages.push(JSON.parse(options.body));
  return new Response('{"id":"test-only"}', { status: 200 });
};

try {
  for (const formType of ['enquiry', 'careers']) {
    const form = new FormData();
    for (const [name, value] of Object.entries({ formType, name: 'Routing test', email: 'test@example.com', contact: '123', subject: 'Project enquiry', message: 'Test only', salutation: 'Mr', jobTitle: 'Engineer' })) form.set(name, value);
    if (formType === 'careers') form.set('cv', new File(['test attachment'], 'cv.pdf', { type: 'application/pdf' }));
    const response = await onRequestPost({
      request: new Request('https://example.com/api/contact', { method: 'POST', body: form }),
      // The legacy shared recipient must not redirect either form.
      env: { RESEND_API_KEY: 'test', CONTACT_FROM: 'test@example.com', CONTACT_TO: 'wrong@example.com' },
    });
    assert.equal(response.status, 200);
    const email = messages.at(-1);
    assert.deepEqual(email.to, [formType === 'careers' ? 'humanresource@longmotive.com' : 'info@longmotive.com']);
    assert.deepEqual(email.cc, ['sjwong@longmotive.com']);
    assert.equal(email.reply_to, 'test@example.com');
    assert.equal(Boolean(email.attachments), formType === 'careers');
  }
  console.log('PASS: enquiry and careers recipients are isolated; sjwong@ copied on both; CV retained; no real mail sent');
} finally {
  globalThis.fetch = originalFetch;
}
