class SvgComponent {
  #svg = null;
  #space = null;
  #classNames = [];
  #instances = [];
  #maxSnapshots = [];
  #histories = [[]];
  constructor(id, space, className, instance, maxSnapshots) {
    this.#svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
    document.body.appendChild(this.#svg);
    this.#svg.id = id;
    this.#svg.setAttribute('class', className);
    this.#svg.setAttribute('width', `${2 * space}`);
    this.#svg.setAttribute('height', `${2 * space}`);
    this.#space = space;

    this.#classNames.push(className);
    this.#instances.push(instance);
    this.#maxSnapshots.push(maxSnapshots || 1)
    this.refresh();
  }

  get instance() {
    return this.#instances[0];
  }

  get instances() {
    return this.#instances;
  }

  addInstance(className, instance, maxSnapshots) {
    this.#classNames.push(className);
    this.#instances.push(instance);
    this.maxSnapshots.push(maxSnapshots || 1);
    this.#histories.push([]);
  }

  getInnerHTML(i, opacity) {
    let space = this.#space;
    let svg = this.#instances[i].getSvg(this.#classNames[i]);
    return `<g transform="translate(${space}, ${space}) scale(1,-1)" style="opacity:${opacity}">
              ${svg}
            </g>`;
  }

  refresh() {
    this.#svg.innerHTML = this.#instances.map((instance, i) => this.getInnerHTML(i, 1)).join('\n');
  }

  trackHTML(i) {
    let history = this.#histories[i];
    let maxSnapshots = this.#maxSnapshots[i];
    if (history.length > maxSnapshots) {
      history.shift();
    }
    history.push(this.getInnerHTML(i, 1));
    let opacity = 1;
    let opacityDecrease = 1 / maxSnapshots;
    // Decrease opacity as we go to the past.
    for(let i = history.length - 1; i >= 0; i--) {
      let htmlCall = history[i];
      history[i] = htmlCall.replace(/"opacity:.*"/, `"opacity: ${opacity}"`);
      opacity -= opacityDecrease;
    }
    return history.join("\n");
  }

  track() {
    this.#svg.innerHTML = this.#instances.map((instance, i) => this.trackHTML(i)).join("\n");
  }
}
