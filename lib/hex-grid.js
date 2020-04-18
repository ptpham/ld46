
import {LitElement, html, css, svg} from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map';

let HEX_ANGLES = new Array(6).fill(0).map((x,i) => 2*Math.PI*(i+0.5)/6);

function renderHexPath(id, shape, style = {}) {
  let {cx, cy, r} = shape;
  let {fill = 'dimgray', opacity = 1} = style;
  let corners = HEX_ANGLES.map(x => [r*Math.cos(x) + cx, r*Math.sin(x) + cy]);
  let coords = corners.map(x => x.join(','));
  let d = `M${coords[0]} ${coords.join('L ')} Z`;
  return svg`<path class="hex" data-id="${id}" d="${d}" stroke="white"
      style="${styleMap({opacity})}"
      fill="${fill}"></path>`;
}

export class HexGrid extends LitElement {
  
  static get properties() {
    return {
      ns: {type: Number},
      r: {type: Number},
      hexStyles: {type: Object},
    };
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      svg {
        width: 100%;
        height: 100%;
      }

      .hex {
        transition: opacity 0.2s;
        opacity: 1;
      }
    `;
  }

  isValidCoord(i, j) {
    let {ns} = this;
    return !(i + j < ns - 1 || i + j > 2*ns + Math.ceil(ns/2) - 1);
  }

  dispatchGenericMouseEvent(e, name) {
    if (e.target.matches('.hex')) {
      let id = e.target.dataset.id;
      let detail = {id, coord: JSON.parse(id)};
      this.dispatchEvent(new CustomEvent(`hex-${name}`, {detail}));
    }
  }

  onClick(e) {
    this.dispatchGenericMouseEvent(e, 'click');
  }

  onMouseOver(e) {
    this.dispatchGenericMouseEvent(e, 'mouseover');
  }

  onMouseOut(e) {
    this.dispatchGenericMouseEvent(e, 'mouseout');
  }

  get validCoords() {
    let result = [];
    let {ns} = this;
    for (let i = 0; i < 2*ns-1; i++) {
      for (let j = 0; j < 2*ns-1; j++) {
        if (!this.isValidCoord(i,j)) continue;
        result.push([i,j]);
      }
    }
    return result;
  }

  coordToId(coord) {
    return JSON.stringify(coord);
  }

  render() {
    let hexes = [];
    let {ns, r, hexStyles} = this;
    let dx = Math.cos(HEX_ANGLES[0]);
    let dy = Math.sin(HEX_ANGLES[0]) + 1;
    
    for (let [i,j] of this.validCoords) {
      let shape = {cx: r*dx*(2*i + j - ns + 1), cy: r*(dy*j + 1), r};
      let id = this.coordToId([i,j]);
      let style = this.hexStyles.get(id) || {};
      hexes.push(renderHexPath(id, shape, style));
    }

    return html`
      <svg viewBox="0 0 100 100"
        @click="${this.onClick}" @mouseover="${this.onMouseOver}" @mouseout="${this.onMouseOut}">
          ${hexes}
      </svg>`;
  }
}

customElements.define('hex-grid', HexGrid);

