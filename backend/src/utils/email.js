/**
 * Pluggable email sender.
 * - If RESEND_API_KEY is set → send via Resend REST API (no extra dependency, uses global fetch).
 * - Otherwise (dev) → log the email to the console so flows are fully testable without a provider.
 *
 * Swap to a real provider later by just setting env vars — no calling code changes.
 */
async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'BoutiqueKi <onboarding@resend.dev>';

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, subject, html: html || `<pre>${text || ''}</pre>` }),
      });
      if (!res.ok) console.error('[email] Resend error:', res.status, await res.text());
    } catch (err) {
      console.error('[email] Resend request failed:', err.message);
    }
    return;
  }

  // Dev transport — visible in the backend console.
  const body = text || (html ? html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '');
  console.log('\n📧 [DEV EMAIL]');
  console.log('   To     :', to);
  console.log('   Subject:', subject);
  console.log('   Body   :', body);
  console.log('');
}

module.exports = { sendEmail };
