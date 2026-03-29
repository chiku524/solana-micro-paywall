/**
 * Micropaywall embed: drops an iframe to the hosted content page.
 * Usage:
 * <script async src="https://micropaywall.app/micropaywall-embed.js"
 *   data-merchant-id="YOUR_MERCHANT_ID"
 *   data-slug="your-slug"
 *   data-base-url="https://micropaywall.app"></script>
 */
(function () {
  var s = document.currentScript;
  if (!s || !s.getAttribute) return;
  var merchantId = s.getAttribute('data-merchant-id');
  var slug = s.getAttribute('data-slug');
  var base = (s.getAttribute('data-base-url') || 'https://micropaywall.app').replace(/\/$/, '');
  if (!merchantId || !slug) {
    console.warn('[micropaywall-embed] data-merchant-id and data-slug are required');
    return;
  }
  var src =
    base +
    '/marketplace/content/?merchantId=' +
    encodeURIComponent(merchantId) +
    '&slug=' +
    encodeURIComponent(slug);
  var iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = 'Micropaywall content';
  iframe.style.width = '100%';
  iframe.style.border = '0';
  iframe.style.minHeight = '520px';
  iframe.setAttribute('loading', 'lazy');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  var parent = s.parentNode;
  if (parent) parent.insertBefore(iframe, s.nextSibling);

  window.addEventListener('message', function (ev) {
    var d = ev.data;
    if (!d || d.type !== 'micropaywall:resize') return;
    if (typeof d.height === 'number' && d.height > 200) {
      iframe.style.height = Math.min(d.height + 32, 3200) + 'px';
    }
  });
})();
