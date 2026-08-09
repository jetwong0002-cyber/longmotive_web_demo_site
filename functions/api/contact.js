/**
 * POST /api/contact
 * Cloudflare Pages Function for business enquiries and careers applications.
 *
 * Required Cloudflare Pages environment variables:
 *   RESEND_API_KEY
 *   CONTACT_TO
 *   CONTACT_FROM
 */

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const JOB_TITLES = [
  'QS Engineer', 'Civil Engineer', 'Mechanical Engineer', 'Safety Engineer',
  'Electric Engineer', 'Fire Engineer', 'Project Engineer', 'Internship Engineer',
  'QAQC Engineer', 'ELV Engineer',
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]));
}

function field(formData, name) {
  return (formData.get(name) || '').toString().trim();
}

export async function onRequestPost({ request, env }) {
  const missingEnvironment = ['RESEND_API_KEY', 'CONTACT_TO', 'CONTACT_FROM']
    .filter((name) => !env[name]);
  if (missingEnvironment.length > 0) {
    console.error('Missing contact-form environment variables:', missingEnvironment.join(', '));
    return json({ ok: false, error: 'Server not configured' }, 500);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return json({ ok: false, error: 'Invalid form data' }, 400);
  }

  const formType = field(formData, 'formType');
  if (!['enquiry', 'careers'].includes(formType)) {
    return json({ ok: false, error: 'Invalid form type' }, 400);
  }

  // Honeypot: real users never fill this hidden field.
  if (field(formData, 'website')) return json({ ok: true });

  const salutation = field(formData, 'salutation');
  const name = field(formData, 'name');
  const contact = field(formData, 'contact');
  const email = field(formData, 'email');
  const subject = field(formData, 'subject');
  const message = field(formData, 'message');
  const jobTitle = field(formData, 'jobTitle');
  const isCareers = formType === 'careers';
  const cv = isCareers ? formData.get('cv') : null;
  const hasCv = cv instanceof File && cv.size > 0;

  const errors = [];
  if (!name) errors.push('Name is required');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid email is required');
  if (name.length > 120) errors.push('Name is too long');
  if (email.length > 254) errors.push('Email is too long');
  if (contact.length > 60) errors.push('Contact No. is too long');

  if (isCareers) {
    if (!contact) errors.push('Contact No. is required');
    if (!jobTitle) errors.push('Job Title is required');
    if (jobTitle && !JOB_TITLES.includes(jobTitle)) errors.push('Invalid job title');
    if (salutation.length > 20) errors.push('Salutation is too long');
  } else {
    if (!subject) errors.push('Subject is required');
    if (!message) errors.push('Message is required');
    if (subject.length > 200) errors.push('Subject is too long');
    if (message.length > 5000) errors.push('Message is too long');
  }

  let attachment = null;
  if (isCareers && hasCv) {
    if (cv.size > MAX_FILE_SIZE) {
      errors.push('CV file must be under 5MB');
    } else if (!ALLOWED_TYPES[cv.type]) {
      errors.push('CV must be PDF, DOC, or DOCX');
    } else {
      const safeName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5 _-]/g, '').slice(0, 50) || 'applicant';
      attachment = {
        filename: `CV_${safeName}${ALLOWED_TYPES[cv.type]}`,
        content: bufferToBase64(await cv.arrayBuffer()),
      };
    }
  }

  if (errors.length > 0) {
    return json({ ok: false, error: errors.join('; ') }, 400);
  }

  const emailHtml = isCareers
    ? `
      <h2>New Job Application — ${escapeHtml(jobTitle)}</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><b>Salutation</b></td><td>${escapeHtml(salutation || '-')}</td></tr>
        <tr><td><b>Name</b></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><b>Contact No.</b></td><td>${escapeHtml(contact)}</td></tr>
        <tr><td><b>Email</b></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><b>Job Title</b></td><td>${escapeHtml(jobTitle)}</td></tr>
        <tr><td><b>CV</b></td><td>${attachment ? escapeHtml(attachment.filename) : 'Not attached'}</td></tr>
      </table>`
    : `
      <h2>New Business Enquiry</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><b>Name</b></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><b>Email</b></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><b>Contact No.</b></td><td>${escapeHtml(contact || '-')}</td></tr>
        <tr><td><b>Subject</b></td><td>${escapeHtml(subject)}</td></tr>
      </table>
      <h3>Message</h3>
      <p>${escapeHtml(message).replace(/\r?\n/g, '<br>')}</p>`;

  const payload = {
    from: env.CONTACT_FROM,
    to: [env.CONTACT_TO],
    reply_to: email,
    subject: isCareers
      ? `[Job Application] ${jobTitle} — ${name}`
      : `[Enquiry] ${subject} — ${name}`,
    html: `${emailHtml}<p style="color:#888;font-size:12px">Submitted via longmotive-m.com</p>`,
  };
  if (attachment) payload.attachments = [attachment];

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!resendResponse.ok) {
    const detail = await resendResponse.text().catch(() => '');
    console.error('Resend error:', resendResponse.status, detail);
    return json({ ok: false, error: 'Failed to send. Please try again later.' }, 502);
  }

  return json({
    ok: true,
    message: isCareers ? 'Application submitted successfully' : 'Enquiry received',
  });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ ok: false, error: 'Method not allowed' }, 405);
}
