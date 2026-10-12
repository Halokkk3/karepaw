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

document.querySelectorAll('[data-select-product]').forEach(link => link.addEventListener('click', () => {
  const name = link.dataset.selectProduct;
  const checkbox = [...document.querySelectorAll('input[name="products"]')].find(input => input.value === name);
  if (checkbox) checkbox.checked = true;
}));

const toast = document.querySelector('#toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 4300);
}

document.querySelector('#quote-form')?.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const products = data.getAll('products');
  const summary = [
    'Karepaw sourcing inquiry',
    `Company: ${data.get('company')}`,
    `Contact: ${data.get('contact')}`,
    `Work email: ${data.get('email')}`,
    `Target market: ${data.get('market') || 'Not specified'}`,
    `Estimated volume: ${data.get('quantity') || 'Not specified'}`,
    `Products: ${products.length ? products.join(', ') : 'Not specified'}`,
    `Customization / sourcing details: ${data.get('details') || 'Not specified'}`,
    'Note: MOQ is 100 pieces per product; quantities cannot be combined across different products.'
  ].join('\n');
  const subject = encodeURIComponent(`Pet product sourcing inquiry from ${data.get('company')}`);
  const body = encodeURIComponent(summary);
  window.location.href = `mailto:sales01@karepaw.com?subject=${subject}&body=${body}`;
  document.querySelector('#form-status').textContent = 'Your email app should open with the inquiry details. Nothing is sent until you choose to send it.';
});

document.querySelector('#year').textContent = new Date().getFullYear();
