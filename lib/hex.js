
import {LitElement, html, css, svg} from 'lit-element';

let HEX_ANGLES = new Array(6).fill(0).map((x,i) => 2*Math.PI*(i+0.5)/6);

function renderHexPath(shape) {
  let {cx, cy, r} = shape;
  let corners = HEX_ANGLES.map(x => [r*Math.cos(x) + cx, r*Math.sin(x) + cy]);
  let coords = corners.map(x => x.join(','));
  let d = `M${coords[0]} ${coords.join('L ')} Z`;
  return svg`<path d="${d}" stroke="white"></path>`;
}

export class HexGrid extends LitElement {
  
  static get properties() {
    return {
      ns: {type: Number},
      r: {type: Number},
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
    `;
  }

  isValidCoord(i, j) {
    let {ns} = this;
    return !(i + j < ns - 1 || i + j > 2*ns + Math.ceil(ns/2) - 1);
  }

  render() {
    let hexes = [];
    let {ns, r} = this;
    let dx = Math.cos(HEX_ANGLES[0]);
    let dy = Math.sin(HEX_ANGLES[0]) + 1;
    
    for (let i = 0; i < 2*ns-1; i++) {
      for (let j = 0; j < 2*ns-1; j++) {
        if (!this.isValidCoord(i,j)) continue;
        let shape = {cx: r*dx*(2*i + j - ns + 1), cy: r*(dy*j + 1), r};
        hexes.push(renderHexPath(shape));
      }
    }

    return html`<svg viewBox="0 0 100 100">
      ${hexes}
    </svg>`;
  }
}

customElements.define('hex-grid', HexGrid);

