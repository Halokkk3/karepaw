const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
menuButton?.addEventListener('click', () => {
  const open = mainNav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});
mainNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
  mainNav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

document.querySelectorAll('.category-tab').forEach(tab => tab.addEventListener('click', () => {
  document.querySelectorAll('.category-tab').forEach(item => item.classList.remove('active'));
  tab.classList.add('active');
  const filter = tab.dataset.filter;
  document.querySelectorAll('.product-card').forEach(card => {
    card.classList.toggle('is-hidden', filter !== 'all' && card.dataset.category !== filter);
  });
}));

const GA4_MEASUREMENT_ID = '';
const ga4IdReady = /^G-[A-Z0-9]+$/i.test(GA4_MEASUREMENT_ID);
if (ga4IdReady) {
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA4_MEASUREMENT_ID);
  const gaScript = document.createElement('script');
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA4_MEASUREMENT_ID)}`;
  document.head.appendChild(gaScript);
}

function trackKarepawEvent(name, params = {}) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params);
  }
}

document.querySelectorAll('[data-select-product]').forEach(link => link.addEventListener('click', () => {
  const name = link.dataset.selectProduct;
  const checkbox = [...document.querySelectorAll('input[name="products"]')].find(input => input.value === name);
  if (checkbox) checkbox.checked = true;
  trackKarepawEvent('product_inquiry_start', { product_name: name });
}));

const toast = document.querySelector('#toast');
let toastTimer;
function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4300);
}

document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
  link.addEventListener('click', () => {
    trackKarepawEvent('email_click', { link_location: link.closest('footer') ? 'footer' : 'contact' });
  });
});
document.querySelectorAll('a[href*="wa.me/"]').forEach(link => {
  link.addEventListener('click', () => {
    trackKarepawEvent('whatsapp_click', { link_location: link.classList.contains('whatsapp-float') ? 'floating_button' : 'contact' });
  });
});

const form = document.querySelector('#quote-form');
const status = document.querySelector('#form-status');
let formStarted = false;
const attributionKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
function collectAttribution() {
  let stored = {};
  try {
    stored = JSON.parse(sessionStorage.getItem('karepaw_attribution') || '{}') || {};
  } catch (_) {}
  const params = new URLSearchParams(window.location.search);
  attributionKeys.forEach(key => {
    const value = params.get(key);
    if (value) stored[key] = value;
  });
  if (!stored.utm_source) {
    if (document.referrer) {
      try { stored.utm_source = new URL(document.referrer).hostname; } catch (_) { stored.utm_source = 'referral'; }
    } else {
      stored.utm_source = 'direct';
    }
  }
  if (!stored.landing_page) stored.landing_page = window.location.href.split('#')[0];
  if (!stored.referrer) stored.referrer = document.referrer || 'direct';
  try { sessionStorage.setItem('karepaw_attribution', JSON.stringify(stored)); } catch (_) {}
  attributionKeys.concat(['landing_page', 'referrer']).forEach(key => {
    const input = form?.elements.namedItem(key);
    if (input) input.value = stored[key] || '';
  });
}
collectAttribution();

form?.addEventListener('focusin', () => {
  if (formStarted) return;
  formStarted = true;
  trackKarepawEvent('quote_form_start', { form_id: 'quote-form' });
});

form?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const submitButton = form.querySelector('button[type="submit"]');
  const originalButton = submitButton?.innerHTML;
  const formData = new FormData(form);
  const products = formData.getAll('products');
  const payload = Object.fromEntries(formData.entries());
  payload.products = products.length ? products.join(', ') : 'Not specified';
  payload._subject = `Pet product sourcing inquiry — ${formData.get('company') || 'New buyer'}`;
  payload._template = 'table';

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Sending…';
  }
  if (status) status.textContent = 'Sending your inquiry to Karepaw…';

  try {
    const response = await fetch(form.dataset.ajaxEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    const accepted = result.success === true || result.success === 'true';
    if (!response.ok || !accepted) {
      const reason = String(result.message || result.error || '');
      if (/activat/i.test(reason)) {
        throw new Error('Karepaw needs to activate email delivery before the form can send. Please use email or WhatsApp for now.');
      }
      throw new Error(reason || 'The inquiry could not be delivered. Please email sales01@karepaw.com or contact us on WhatsApp.');
    }

    trackKarepawEvent('generate_lead', {
      form_id: 'quote-form',
      product_count: products.length,
      target_market: formData.get('market') || 'not_specified'
    });
    form.reset();
    collectAttribution();
    if (status) status.textContent = 'Thank you. Your inquiry has been sent to Karepaw.';
    showToast('Inquiry sent. Thank you for contacting Karepaw.');
    formStarted = false;
  } catch (error) {
    if (status) status.textContent = error.message || 'We could not send your inquiry. Please email sales01@karepaw.com.';
    showToast('Inquiry not sent. Please use the email or WhatsApp contact links.');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButton;
    }
  }
});

document.querySelector('#year')?.textContent = new Date().getFullYear();
