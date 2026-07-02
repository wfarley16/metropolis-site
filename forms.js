/*
 * forms.js — contact forms for a backend-less static site.
 *
 * Any <form data-contact data-subject="…"> is wired up automatically.
 *
 * Submissions go to FORM_ENDPOINT if set (a Formspree / Getform / Basin URL that
 * captures submissions server-side). If it's left empty, the form falls back to
 * composing an email to FORM_TO in the visitor's mail client — no setup required.
 *
 * To capture submissions without a mail client: create a free form endpoint and
 * paste its URL into FORM_ENDPOINT below.
 */
window.__FORM_ENDPOINT = ""; // <-- Paste your Formspree/Getform URL here to receive submissions.
window.__FORM_TO = "";       // Optional mailto fallback. Leave blank to keep NO email address in the public source.

function mailtoFallback(subject, data){
  const body = Object.entries(data).map(([k,v]) => `${k}: ${v}`).join('\n');
  window.location.href = `mailto:${window.__FORM_TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function wireForm(form){
  const status = form.querySelector('[data-status]');
  const say = (msg, ok) => { if(status){ status.textContent = msg; status.style.color = ok ? 'var(--good)' : 'var(--ink-2)'; } };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    data.source = location.pathname.replace(/^.*\//, '') || 'index.html'; // tag which page it came from
    const subject = form.dataset.subject || 'Metropolis enquiry';
    const btn = form.querySelector('button[type="submit"]');
    const label = btn ? btn.textContent : '';
    const endpoint = window.__FORM_ENDPOINT;
    if(endpoint){
      if(btn){ btn.disabled = true; btn.textContent = 'Sending…'; }
      try{
        const r = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Accept':'application/json', 'Content-Type':'application/json' },
          body: JSON.stringify({ _subject: subject, ...data })
        });
        if(!r.ok) throw new Error('bad status');
        form.reset(); say("Thanks — we'll be in touch.", true);
      }catch(_){
        say('Opening your email app instead…', false);
        mailtoFallback(subject, data);
      }finally{
        if(btn){ btn.disabled = false; btn.textContent = label; }
      }
    } else if (window.__FORM_TO) {
      mailtoFallback(subject, data);
      say('Opening your email app…', false);
    } else {
      say("Submissions aren't live yet — please check back soon.", false);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form[data-contact]').forEach(wireForm);
});
