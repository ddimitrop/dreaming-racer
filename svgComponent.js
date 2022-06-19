class SvgComponent {
  #svg = null;
  #className = null;
  #instance = null;
  #space = null;
  #history = [];
  constructor(id, className, space, instance) {
    this.#svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    document.body.appendChild(this.#svg);
    this.#svg.id = id;
    this.#svg.setAttribute('class', className);
    this.#svg.setAttribute('width', `${space}`);
    this.#svg.setAttribute('height', `${space}`);
    this.#className = className;
    this.#instance = instance;
    this.#space = space;
    this.refresh();
  }

  get instance() {
    return this.#instance;
  }

  getInnerHTML(opacity) {
    let space = this.#space;
    let hspace = space / 2;
    let svg = this.#instance.getSvg(this.#className);
    return `<g transform="translate(${hspace}, ${hspace}) scale(1,-1)" style="opacity:${opacity}">
              ${svg}
            </g>`;

  }

  refresh() {
    this.#svg.innerHTML = this.getInnerHTML(1);
  }

  track(maxCalls) {
    let space = this.#space;
    let hspace = space / 2;
    if (this.#history.length > maxCalls) {
      this.#history.shift();
    }
    this.#history.push(this.getInnerHTML(1));
    let opacity = 1;
    let opacityDecrease = 1/maxCalls;
    // Decrease opacity as we go to the past.
    for(let i = this.#history.length - 1; i>=0; i--) {
      let htmlCall = this.#history[i];
      this.#history[i] = htmlCall.replace(/"opacity:.*"/, `"opacity: ${opacity}"`);
      opacity -= opacityDecrease;
    }
    this.#svg.innerHTML = this.#history.join("\n");
  }
}
