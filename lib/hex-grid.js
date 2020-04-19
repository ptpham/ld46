
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
      stroke-width="${strokeWidth}"></line>
  `;
}

function renderCorner(id, shape, style = {}) {
  let {cx, cy, r} = shape;
  let {fill = 'lightgray'} = style;
  return svg`
    <circle class="corner" data-id="${id}" cx="${cx}" cy="${cy}" r="${r}"
       style="${styleMap({fill})}"></line>
  `;
}

function commaCount(x) {
  let result = 0;
  for (let i = 0; i < x.length; i++) {
    if (x[i] == ',') result++;
  }
  return result;
}

function isValidCoord(ns, i, j) {
  return !(i + j < ns - 1 || i + j > 2*ns + Math.ceil(ns/2) - 1);
}

export function validHexCoords(ns) {
  let result = [];
  for (let i = 0; i < 2*ns-1; i++) {
    for (let j = 0; j < 2*ns-1; j++) {
      if (!isValidCoord(ns, i, j)) continue;
      result.push([i,j]);
    }
  }
  return result;
}

function coordToId(coord) {
  return JSON.stringify(coord);
}

function validHalfedgeCoords(ns) {
  const allHalfedges = validHexCoords(ns).flatMap(x => HEX_ANGLES.map((y,i) => [...x, i]));
  const canonicalIds = allHalfedges.map(x => coordToId(canonicalHalfedge(x)));
  return Array.from(new Set(canonicalIds)).map(x => JSON.parse(x));
}

function canonicalHalfedge(coord) {
  if (coord[2] < 3) return coord.length == 3 ? coord : coord.slice(0, 3);
  return halfedgeMirror(coord);
}

export function validCoords(ns) {
  return [...validHexCoords(ns), ...validHalfedgeCoords(ns)];
}

function halfedgeMirror(coord) {
  switch (coord[2]) {
    case 0:
      return [coord[0], coord[1]+1, 3];
    case 1:
      return [coord[0]-1, coord[1]+1, 4];
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

export function hexCenterXFunction(ns, r, margin = 0) {
  let dx = Math.cos(HEX_ANGLES[0]);
  let scale = r + margin;
  return (i, j) => scale*dx*(2*i + j - ns + 2.5);
}

export function hexCenterYFunction(ns, r, margin = 0) {
  let dy = Math.sin(HEX_ANGLES[0]) + 1;
  let scale = r + margin;
  return (i, j) => scale*(dy*j + 2) + 2*margin;
}

export class HexGrid extends LitElement {
  
  static get properties() {
    return {
      ns: {type: Number},
      margin: {type: Number},
      r: {type: Number},
      elementStyles: {type: Object},
      offsetX: {type: Number},
      offsetY: {type: Number},
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
        filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.5));
      }

      .hex {
        transition: fill 0.2s;
        fill: whitesmoke;
      }

      .corner, .edge {
        transition: stroke 0.2s;
        fill: lightgray;
      }
    `;
  }

  isValidCoord(i, j) {
    return isValidCoord(this.ns, i, j);
  }

  dispatchGenericMouseEvent(e, name) {
    let tileType = null;
    if (e.target.matches('.hex')) tileType = 'hex';
    if (e.target.matches('.edge')) tileType = 'edge';
    if (tileType) {
      let id = e.target.dataset.id;
      let detail = {id, coord: JSON.parse(id), tileType};
      this.dispatchEvent(new CustomEvent(`tile-${name}`, {detail}));
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
    return validHexCoords(this.ns);
  }

  canonizeCorner(coord) {
    if (coord[2] == 2 || coord[2] == 5) return [...coord, 0];
    if (coord[2] == 0) {
      return [...this.halfedgeMirror(this.halfedgePrev(coord)), 0];
    } else if (coord[2] == 1) {
      return [...this.halfedgeNext(this.halfedgeMirror(coord)), 0];
    } else if (coord[2] == 3) {
      return [...this.halfedgeMirror(this.halfedgePrev(coord)), 0];
    } else if (coord[2] == 4) {
      return [...this.halfedgeNext(this.halfedgeMirror(coord)), 0];
    }
  }

  get validCornerIds() {
    return Array.from(new Set(this.validHexCoords.flatMap(x =>
      HEX_ANGLES.map((y,i) => this.coordToId(this.canonizeCorner([...x, i]))))));
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
    return halfedgeMirror(coord);
  }

  halfedgeNext(coord) {
    return [coord[0], coord[1], (coord[2] + 1) % 6]; 
  }

  halfedgePrev(coord) {
    return [coord[0], coord[1], (coord[2] + 5) % 6]; 
  }
 
  hexAdjacentHexes(coord) {
    return HEX_ADJACENT.map(([dx,dy]) => [coord[0] + dx, coord[1] + dy]);
  }

  hexAdjacentEdges(coord) {
    return HEX_ANGLES.map((x,i) => this.canonicalHalfedge([...coord, i]));
  }

  hexAdjacentHexInDirection(coord, i) {
    return this.halfedgeMirror([...coord, i]).slice(0,2);
  }

  halfedgesAdjacentEdges(coord) {
    let mirror = this.halfedgeMirror(coord);
    return [
      this.halfedgeNext(coord), this.halfedgePrev(mirror),
      this.halfedgePrev(coord), this.halfedgeNext(mirror)
    ].map(x => this.canonicalHalfedge(x));
  }

  edgeAdjacentHexes(coord) {
    let mirror = this.halfedgeMirror(coord);
    return [coord.slice(0,2), mirror.slice(0,2)];
  }

  cornerAdjacentEdges(coord) {
    let prev = this.halfedgePrev(coord);
    let nextMirror = this.halfedgeNext(this.halfedgeMirror(coord));
    return [coord, prev, nextMirror].map(x => this.canonicalHalfedge(x));
  }

  canonicalHalfedge(coord) {
    return canonicalHalfedge(coord);
  }

  coordToId(coord) {
    return JSON.stringify(coord);
  }

  idToCoord(id) {
    return JSON.parse(id);
  }

  isEdgeId(id) {
    return commaCount(id) == 2;
  }

  isHexId(id) {
    return commaCount(id) == 1;
  }

  get hexCenterXFunction() {
    let {ns, r, margin = 0, offsetX = 0} = this;
    let inner = hexCenterXFunction(ns, r, margin);
    return (i,j) => inner(i,j) + offsetX;
  }

  get hexCenterYFunction() {
    let {ns, r, margin = 0, offsetY = 0} = this;
    let inner = hexCenterYFunction(ns, r, margin);
    return (i,j) => inner(i,j) + offsetY;
  }

  render() {
    let hexes = [];
    let {ns, r, margin = 0, elementStyles} = this;
    let scale = r + margin;

    let computeCX = this.hexCenterXFunction;
    let computeCY =  this.hexCenterYFunction;
    
    for (let [i,j] of this.validHexCoords) {
      let cx = computeCX(i, j);
      let cy = computeCY(i, j);
      let shape = {cx, cy, r};
      let id = this.coordToId([i,j]);
      let style = this.elementStyles.get(id) || {};
      hexes.push(renderHexPath(id, shape, style));

    }

    let edges = [];
    for (let [i,j,k] of this.validHalfedgeCoords) {
      let cx = computeCX(i, j);
      let cy = computeCY(i, j);

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

    let corners = [];
    for (let id of this.validCornerIds) {
      let [i, j, k] = this.idToCoord(id);
      let cx = computeCX(i, j);
      let cy = computeCY(i, j);
      corners.push(renderCorner(id, {
        cx: cx + scale*HEX_ANGLES_COS[k],
        cy: cy + scale*HEX_ANGLES_SIN[k],
        r: this.margin,
      }, this.elementStyles.get(id) || {}));
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

