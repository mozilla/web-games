const deckyPlugin = {
  markdown() {
    let slides = [...document.querySelectorAll('section')];

    function trim(code) {
      let lines = code.split('\n');
      let indentSize = lines
        .map(l => l.match(/^[ ]*[^\s]/))
        .map(m => (m === null) ? Infinity : m[0].length - 1)
      	.reduce((n, min) => n < min ? n : min, Infinity);
      if (indentSize === 0) {
        return code.trim();
      }
      return lines.map(
        l => l.replace(new RegExp(`^[ ]{${indentSize}}`), '')
      ).join('\n').trim();
    }

    let renderer = new marked.Renderer();

    let oldHeading = renderer.heading.bind(renderer);
    let seenH1 = false;
    renderer.heading = function (text, level) {
      if (level === 1 || level === 2) {
        if (seenH1) {
          return '<!-- SPLIT -->' + oldHeading(...arguments);
        }
        seenH1 = true;
      }
      return oldHeading(...arguments);
    };

    renderer.hr = function (...args) {
      return '<!-- SPLIT -->';
    }

    slides.forEach(slide => {
      seenH1 = false;
      let result = marked(trim(slide.innerHTML), { renderer });
      let parts = result.split('<!-- SPLIT -->');
      slide.innerHTML = parts[0];
      for (let i = parts.length - 1; i > 0; i--) {
        let el = slide.cloneNode(true);
        el.innerHTML = parts[i];
        slide.insertAdjacentElement('afterend', el);
      }
    });
  },
  slideSteps() {
    let steppedSlides = [...document.querySelectorAll('section[data-step]')];
    steppedSlides.forEach(slide => {
      let stepBy = slide.getAttribute('data-step') || 'li';
      let stepCount = slide.querySelectorAll(stepBy).length;
      for (let i = stepCount; i > 0; i--) {
        let newSlide = slide.cloneNode(true);
        let steps = newSlide.querySelectorAll(stepBy);
        for (let j = 0; j < i; j++) {
          steps[stepCount - j - 1].classList.add('hide');
        }
        slide.parentNode.insertBefore(newSlide, slide);
      }
    });
  },
  progressBars(duration) {
    let footer = document.querySelector('footer');
    let talkProgress = document.createElement('div');
    talkProgress.classList.add('progress', 'talk-progress');
    let timeProgress = document.createElement('div');
    timeProgress.classList.add('progress', 'time-progress');
    footer.appendChild(talkProgress);
    footer.appendChild(timeProgress);

    let sTime;
    let timer;
    let going = false;

    decky.onSlideChange(function (n) {
      if (n > 1 && !going) {
        going = true;
        timer = setInterval(update, 100);
        sTime = Date.now();
        console.log('starting timer');
      }

      let pct = n / decky.num * 100;
      talkProgress.style.transform = 'translate(' + pct + '%, 0)';
    });

    function update() {
      let time = Math.min(100, ((Date.now() - sTime) / (duration * 60 * 1000)) * 100);
      timeProgress.style.transform = 'translate(' + time + '%, 0)';
    }
  },
  iframes() {
    let iframes = document.querySelectorAll('iframe');
    iframes = Array.from(iframes);
    iframes.forEach(function (i) {
      var src = i.src;
      i.setAttribute('data-src', src);
      i.src = '';
    });
    iframes.forEach(function (i) {
      i.src = '';
    });

    let f = document.querySelector('.active iframe');
    if (f && window.top === window) {
      f.src = f.getAttribute('data-src');
    }
  },
  asyncCode() {
    var els = document.querySelectorAll('code[data-src]');
    Array.from(els).forEach(function (el) {
      var xhr = new XMLHttpRequest();
      xhr.addEventListener("load", function () {
        el.innerHTML = this.responseText.replace('<', '&lt;', 'g');
        hljs.highlightBlock(el);
      });
      xhr.open("GET", el.getAttribute('data-src'));
      xhr.send();
    });
  }
};
