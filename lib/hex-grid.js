
import {LitElement, html, css, svg} from 'lit-element';
import {styleMap} from 'lit-html/directives/style-map';

let HEX_ANGLES = new Array(6).fill(0).map((x,i) => 2*Math.PI*(i+0.5)/6);
let HEX_ANGLES_COS = HEX_ANGLES.map(x => Math.cos(x));
let HEX_ANGLES_SIN = HEX_ANGLES.map(x => Math.sin(x));
let HEX_ADJACENT = [[1,0], [-1,0], [0,1], [0,-1], [1,-1], [-1,1]];

function renderHexPath(id, shape, style = {}) {
  let {cx, cy, r} = shape;
  let {fill = 'whitesmoke', opacity = 1} = style;
  let corners = HEX_ANGLES.map(x => [r*Math.cos(x) + cx, r*Math.sin(x) + cy]);
  let coords = corners.map(x => x.join(','));
  let d = `M${coords[0]} ${coords.join('L ')} Z`;
  return svg`<path class="hex" data-id="${id}" d="${d}"
      style="${styleMap({opacity, fill})}"></path>`;
}

function renderEdgePath(id, shape, style = {}) {
  let {x0, y0, x1, y1} = shape;
  let {stroke='lightgray', strokeWidth = 1} = style;
  return svg`
    <line class="edge" data-id="${id}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${stroke}"
      stroke-width="${strokeWidth}" stroke-linecap="round"></line>
  `;
}

function renderCorner(id, shape, style = {}) {
  let {cx, cy, r} = shape;
  let {fill='lightgray'} = style;
  return svg`
    <circle class="edge" data-id="${id}" cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"></line>
  `;
}

export class HexGrid extends LitElement {
  
  static get properties() {
    return {
      ns: {type: Number},
      margin: {type: Number},
      r: {type: Number},
      elementStyles: {type: Object},
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
        transition: fill 0.2s;
        fill: whitesmoke;
      }

      .edge {
        transition: stroke 0.2s;
        fill: lightgray;
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
    } else if (e.target.matches('.edge')) {
      let id = e.target.dataset.id;
      let detail = {id, coord: JSON.parse(id)};
      this.dispatchEvent(new CustomEvent(`edge-${name}`, {detail}));
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

  get validHexCoords() {
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

  get validHalfedgeCoords() {
    const allHalfedges = this.validHexCoords.flatMap(x => HEX_ANGLES.map((y,i) => [...x, i]));
    const canonicalIds = allHalfedges.map(x => this.coordToId(this.canonicalHalfedge(x)));
    return Array.from(new Set(canonicalIds)).map(x => JSON.parse(x));
  }

  get validCoords() {
    return [...this.validHexCoords, ...this.validHalfedgeCoords];
  }
  
  halfedgeMirror(coord) {
    switch (coord[2]) {
      case 0:
        return [coord[0], coord[1]+1, 3];
      case 1:
        return [coord[0]-1, coord[1]+1, 1];
      case 2:
        return [coord[0]-1, coord[1], 5];
      case 3:
        return [coord[0], coord[1]-1, 0];
      case 4:
        return [coord[0]+1, coord[1]-1, 1];
      case 5:
        return [coord[0]+1, coord[1], 2];
    }
  }
 
  adjacentHexCoords(coord) {
    return HEX_ADJACENT.map(([dx,dy]) => [coord[0] + dx, coord[1] + dy]);
  }

  canonicalHalfedge(coord) {
    if (coord[2] < 3) return coord;
    return this.halfedgeMirror(coord);
  }

  coordToId(coord) {
    return JSON.stringify(coord);
  }

  render() {
    let hexes = [];
    let {ns, r, margin = 0, elementStyles} = this;
    let dx = Math.cos(HEX_ANGLES[0]);
    let dy = Math.sin(HEX_ANGLES[0]) + 1;
    let scale = r + margin;
    
    let corners = [];
    for (let [i,j] of this.validHexCoords) {
      let cx = scale*dx*(2*i + j - ns + 1);
      let cy = scale*(dy*j + 1) + 2*margin;
      let shape = {cx, cy, r};
      let id = this.coordToId([i,j]);
      let style = this.elementStyles.get(id) || {};
      hexes.push(renderHexPath(id, shape, style));

      for (let k = 0; k < HEX_ANGLES.length; k++) {
        corners.push(renderCorner(id, {
          cx: cx + scale*HEX_ANGLES_COS[k],
          cy: cy + scale*HEX_ANGLES_SIN[k],
          r: this.margin,
        }));
      }
    }

    let edges = [];
    for (let [i,j,k] of this.validHalfedgeCoords) {
      let cx = scale*dx*(2*i + j - ns + 1);
      let cy = scale*(dy*j + 1) + 2*margin;

      let x0 = cx + scale*HEX_ANGLES_COS[k];
      let y0 = cy + scale*HEX_ANGLES_SIN[k];
      let x1 = cx + scale*HEX_ANGLES_COS[(k+1)%6];
      let y1 = cy + scale*HEX_ANGLES_SIN[(k+1)%6];

      let shape = {x0, y0, x1, y1};
      let id = this.coordToId([i,j,k]);
      let style = this.elementStyles.get(id) || {};
      style.strokeWidth = 2*this.margin;
      edges.push(renderEdgePath(id, shape, style));
    }

    return html`
      <svg viewBox="0 0 100 100"
        @click="${this.onClick}" @mouseover="${this.onMouseOver}" @mouseout="${this.onMouseOut}">
          ${edges}
          ${corners}
          ${hexes}
      </svg>`;
  }
}

customElements.define('hex-grid', HexGrid);

