// Variant: section headings carried by type and space, and plain
// company / role / year facts on each case study in place of category tags.
(function () {
  var FACTS = {
    'benchling-bioanalytical.html': ['Benchling', 'Design lead', '2024–2025'],
    'linkedin-recruiter-inbox.html': ['LinkedIn', 'Product designer', '2020–2021'],
    'linkedin-quick-reply.html': ['LinkedIn', 'Product designer']
  };

  function heading(text) {
    var h = document.createElement('h2');
    h.className = 'v-section-title';
    h.textContent = text;
    return h;
  }

  function run() {
    // About: give it a heading
    var about = document.querySelector('#about .about-content');
    if (about) about.insertBefore(heading('Hi, I’m Jia.'), about.firstChild);

    // About: portrait replaces the spec table; "How I can help" is removed
    var figure = document.querySelector('#how-i-help .help-figure');
    var specCol = document.querySelector('#about .bio-col-photo');
    if (figure && specCol) {
      specCol.innerHTML = '';
      specCol.appendChild(figure);
    }
    // Hero copy
    var HERO_TITLE = 'I design products that help experts do their best work.';
    var HERO_SUB = [
      'Clear to use and practical to build, from the first customer conversation to shipped product.',
      'Currently at Proscia, previously Benchling and LinkedIn.'
    ];
    var line = document.querySelector('.hero-line-sans');
    var firstWord = line && line.querySelector('.word-in');
    if (firstWord) {
      var template = firstWord.parentNode.cloneNode(true);
      line.innerHTML = '';
      HERO_TITLE.split(' ').forEach(function (w, i) {
        var wrap = template.cloneNode(true);
        var word = wrap.querySelector('.word-in');
        word.style.animationDelay = (1.5 + i * 0.038).toFixed(3) + 's';
        word.querySelector('.sc-interp').textContent = w;
        word.appendChild(document.createTextNode(' '));
        // drop the template's original trailing nbsp text nodes
        Array.prototype.slice.call(word.childNodes, 1, -1).forEach(function (n) { word.removeChild(n); });
        line.appendChild(wrap);
      });
    }
    var sub = document.querySelector('.hero-sub');
    if (sub) {
      sub.textContent = HERO_SUB[0];
      sub.appendChild(document.createElement('br'));
      sub.appendChild(document.createElement('br'));
      sub.appendChild(document.createTextNode(HERO_SUB[1]));
    }

    // About copy, updated to match the LinkedIn summary
    var ABOUT = [
      'I help teams find their direction when the path forward is unclear. I look beyond screens to the industry, the business, and how teams work together to build great products. I do my best work in small, fast-moving teams, talking strategy with leaders, running research with customers, and designing methodically with product teams.',
      'I started out as a teacher, then joined Coursera early on and grew into roles at the intersection of product and business. I switched into product design after grad school and, since then, I’ve led design through a platform launch at Benchling, worked on messaging at LinkedIn, and now design software at Proscia that helps life science teams turn tissue samples into drug discoveries.'
    ];

    var paras = document.querySelectorAll('#about .bio-col-text p');
    paras.forEach(function (p, i) {
      if (i < ABOUT.length) p.textContent = ABOUT[i]; else p.remove();
    });

    var help = document.getElementById('how-i-help');
    if (help) help.remove();
    document.querySelectorAll('a[data-section-id="how-i-help"], a[href$="#how-i-help"]').forEach(function (a) {
      a.remove();
    });

    // Case studies: facts line replaces the category tag
    document.querySelectorAll('a.project').forEach(function (a) {
      var facts = FACTS[a.getAttribute('href')];
      var tag = a.querySelector('.project-meta > span:first-child');
      if (!facts || !tag) return;
      tag.classList.add('v-facts');
      tag.textContent = facts.join('  ·  ');

      // Title drops the company name, which the facts line already gives
      var title = a.querySelector('.project-title-text .sc-interp');
      if (title) title.textContent = title.textContent.replace(new RegExp('^' + facts[0] + '\\s+'), '');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();
