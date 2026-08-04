function formatUtcTimestamp(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}

function downloadResumePdf() {
  const container = document.getElementById('resume-content');
  if (!container) {
    return;
  }

  const filename = `Dean Young Resume ${formatUtcTimestamp(new Date())}.pdf`;

  if (typeof html2pdf === 'undefined') {
    alert('Resume download is not available right now. Please try again later.');
    return;
  }

  html2pdf()
    .set({
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'letter', orientation: 'portrait' }
    })
    .from(container)
    .save();
}

/* Programmatically generate the header bars inspired by the old site.
   - number of bars = age in years since 1988-09-11
   - heights are taken from digits of phi (each digit -> digit * 10%)
*/
function buildHeaderBars() {
  try {
    if (typeof document === 'undefined') {
      return;
    }

    const birth = new Date(Date.UTC(1988, 8, 11)); // months 0-indexed: 8 = September
    const now = new Date();

    // compute age in full years
    let age = now.getUTCFullYear() - birth.getUTCFullYear();
    const nowMonth = now.getUTCMonth();
    const nowDay = now.getUTCDate();
    if (nowMonth < birth.getUTCMonth() || (nowMonth === birth.getUTCMonth() && nowDay < birth.getUTCDate())) {
      age -= 1;
    }
    if (age < 0) age = 0;

    // digits of phi (without decimal) - sufficiently long
    const phiDigits = '1618033988749894848204586834365638117720309179805762862135448622705260462818902449707207204';

    // create container
    const container = document.createElement('div');
    container.className = 'header-bars';
    container.setAttribute('aria-hidden', 'true');

    const barContainer = document.createElement('div');
    barContainer.className = 'bar-container';

    for (let i = 0; i < age; i++) {
      const digitChar = phiDigits[i % phiDigits.length];
      const digit = parseInt(digitChar, 10);
      const bar = document.createElement('div');
      bar.className = 'bar';
      bar.style.height = `${(isNaN(digit) ? 10 : digit * 10)}%`;
      barContainer.appendChild(bar);
    }

    container.appendChild(barContainer);

    // insert into document
    document.addEventListener('DOMContentLoaded', () => {
      if (!document.body.querySelector('.header-bars')) {
        document.body.insertBefore(container, document.body.firstChild);
      }
    });
  } catch (e) {
    console.error('buildHeaderBars error', e);
  }
}

function decodeRot13(value) {
  return value.replace(/[A-Za-z]/g, c => {
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

function renderObfuscatedEmails() {
  if (typeof document === 'undefined') {
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-obfuscated-email]').forEach(el => {
      const encoded = el.getAttribute('data-obfuscated-email') || '';
      const email = decodeRot13(encoded);
      const link = document.createElement('a');
      link.href = `mailto:${email}`;
      link.textContent = email;
      link.rel = 'nofollow noreferrer noopener';
      el.innerHTML = '';
      el.appendChild(link);
    });
  });
}

/* Philosophy page — clickable value headings copy anchor URL to clipboard */
function setupValueAnchors() {
  if (typeof document === 'undefined') {
    return;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const anchors = document.querySelectorAll('a.value-anchor');
    if (!anchors.length) {
      return;
    }

    anchors.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        const hash = link.getAttribute('data-anchor') || link.getAttribute('href') || '';
        if (!hash) {
          return;
        }

        // Update the URL bar with the anchor
        const fullUrl = window.location.origin + window.location.pathname + hash;
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', fullUrl);
        } else {
          window.location.hash = hash;
        }

        // Copy the full URL to the clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(fullUrl).then(() => {
            showCopyFeedback(link, 'Copied!');
          }).catch(() => {
            fallbackCopy(fullUrl, link);
          });
        } else {
          fallbackCopy(fullUrl, link);
        }
      });
    });
  });
}

function fallbackCopy(text, link) {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopyFeedback(link, 'Copied!');
  } catch (err) {
    showCopyFeedback(link, 'Press ⌘C to copy');
  }
}

function showCopyFeedback(link, message) {
  const heading = link.parentElement;
  if (!heading) {
    return;
  }

  let badge = heading.querySelector('.copy-feedback');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'copy-feedback';
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-live', 'polite');
    heading.appendChild(badge);
  }

  badge.textContent = message;
  badge.classList.add('visible');

  clearTimeout(badge._timeout);
  badge._timeout = setTimeout(() => {
    badge.classList.remove('visible');
  }, 2000);
}

renderObfuscatedEmails();
buildHeaderBars();
highlightActiveNav();
setupValueAnchors();

/* Highlight the active nav link based on current page URL */
function highlightActiveNav() {
  if (typeof document === 'undefined') {
    return;
  }

  const currentPage = window.location.pathname;
  // Normalize: strip index.html and trailing slash to get base path
  let normalized = currentPage
    .replace(/\/index\.html$/, '')
    .replace(/\/$/, '');
  if (!normalized) normalized = '/';

  document.querySelectorAll('nav.nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === normalized || (normalized === '/' && href === '/about')) {
      link.classList.add('nav-active');
    } else {
      link.classList.remove('nav-active');
    }
  });
}
