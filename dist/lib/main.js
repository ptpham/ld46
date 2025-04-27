// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/dom.js
var isCEPolyfill = typeof window !== "undefined" && window.customElements != null && window.customElements.polyfillWrapFlushCallback !== void 0;
var reparentNodes = (container, start, end = null, before = null) => {
  while (start !== end) {
    const n = start.nextSibling;
    container.insertBefore(start, before);
    start = n;
  }
};
var removeNodes = (container, start, end = null) => {
  while (start !== end) {
    const n = start.nextSibling;
    container.removeChild(start);
    start = n;
  }
};

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/template.js
var marker = `{{lit-${String(Math.random()).slice(2)}}}`;
var nodeMarker = `<!--${marker}-->`;
var markerRegex = new RegExp(`${marker}|${nodeMarker}`);
var boundAttributeSuffix = "$lit$";
var Template = class {
  constructor(result, element) {
    this.parts = [];
    this.element = element;
    const nodesToRemove = [];
    const stack = [];
    const walker = document.createTreeWalker(element.content, 133, null, false);
    let lastPartIndex = 0;
    let index = -1;
    let partIndex = 0;
    const { strings, values: { length } } = result;
    while (partIndex < length) {
      const node = walker.nextNode();
      if (node === null) {
        walker.currentNode = stack.pop();
        continue;
      }
      index++;
      if (node.nodeType === 1) {
        if (node.hasAttributes()) {
          const attributes = node.attributes;
          const { length: length2 } = attributes;
          let count = 0;
          for (let i = 0; i < length2; i++) {
            if (endsWith(attributes[i].name, boundAttributeSuffix)) {
              count++;
            }
          }
          while (count-- > 0) {
            const stringForPart = strings[partIndex];
            const name = lastAttributeNameRegex.exec(stringForPart)[2];
            const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
            const attributeValue = node.getAttribute(attributeLookupName);
            node.removeAttribute(attributeLookupName);
            const statics = attributeValue.split(markerRegex);
            this.parts.push({ type: "attribute", index, name, strings: statics });
            partIndex += statics.length - 1;
          }
        }
        if (node.tagName === "TEMPLATE") {
          stack.push(node);
          walker.currentNode = node.content;
        }
      } else if (node.nodeType === 3) {
        const data = node.data;
        if (data.indexOf(marker) >= 0) {
          const parent = node.parentNode;
          const strings2 = data.split(markerRegex);
          const lastIndex = strings2.length - 1;
          for (let i = 0; i < lastIndex; i++) {
            let insert;
            let s = strings2[i];
            if (s === "") {
              insert = createMarker();
            } else {
              const match = lastAttributeNameRegex.exec(s);
              if (match !== null && endsWith(match[2], boundAttributeSuffix)) {
                s = s.slice(0, match.index) + match[1] + match[2].slice(0, -boundAttributeSuffix.length) + match[3];
              }
              insert = document.createTextNode(s);
            }
            parent.insertBefore(insert, node);
            this.parts.push({ type: "node", index: ++index });
          }
          if (strings2[lastIndex] === "") {
            parent.insertBefore(createMarker(), node);
            nodesToRemove.push(node);
          } else {
            node.data = strings2[lastIndex];
          }
          partIndex += lastIndex;
        }
      } else if (node.nodeType === 8) {
        if (node.data === marker) {
          const parent = node.parentNode;
          if (node.previousSibling === null || index === lastPartIndex) {
            index++;
            parent.insertBefore(createMarker(), node);
          }
          lastPartIndex = index;
          this.parts.push({ type: "node", index });
          if (node.nextSibling === null) {
            node.data = "";
          } else {
            nodesToRemove.push(node);
            index--;
          }
          partIndex++;
        } else {
          let i = -1;
          while ((i = node.data.indexOf(marker, i + 1)) !== -1) {
            this.parts.push({ type: "node", index: -1 });
            partIndex++;
          }
        }
      }
    }
    for (const n of nodesToRemove) {
      n.parentNode.removeChild(n);
    }
  }
};
var endsWith = (str, suffix) => {
  const index = str.length - suffix.length;
  return index >= 0 && str.slice(index) === suffix;
};
var isTemplatePartActive = (part) => part.index !== -1;
var createMarker = () => document.createComment("");
var lastAttributeNameRegex = (
  // eslint-disable-next-line no-control-regex
  /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F "'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/
);

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/modify-template.js
var walkerNodeFilter = 133;
function removeNodesFromTemplate(template, nodesToRemove) {
  const { element: { content }, parts: parts2 } = template;
  const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
  let partIndex = nextActiveIndexInTemplateParts(parts2);
  let part = parts2[partIndex];
  let nodeIndex = -1;
  let removeCount = 0;
  const nodesToRemoveInTemplate = [];
  let currentRemovingNode = null;
  while (walker.nextNode()) {
    nodeIndex++;
    const node = walker.currentNode;
    if (node.previousSibling === currentRemovingNode) {
      currentRemovingNode = null;
    }
    if (nodesToRemove.has(node)) {
      nodesToRemoveInTemplate.push(node);
      if (currentRemovingNode === null) {
        currentRemovingNode = node;
      }
    }
    if (currentRemovingNode !== null) {
      removeCount++;
    }
    while (part !== void 0 && part.index === nodeIndex) {
      part.index = currentRemovingNode !== null ? -1 : part.index - removeCount;
      partIndex = nextActiveIndexInTemplateParts(parts2, partIndex);
      part = parts2[partIndex];
    }
  }
  nodesToRemoveInTemplate.forEach((n) => n.parentNode.removeChild(n));
}
var countNodes = (node) => {
  let count = node.nodeType === 11 ? 0 : 1;
  const walker = document.createTreeWalker(node, walkerNodeFilter, null, false);
  while (walker.nextNode()) {
    count++;
  }
  return count;
};
var nextActiveIndexInTemplateParts = (parts2, startIndex = -1) => {
  for (let i = startIndex + 1; i < parts2.length; i++) {
    const part = parts2[i];
    if (isTemplatePartActive(part)) {
      return i;
    }
  }
  return -1;
};
function insertNodeIntoTemplate(template, node, refNode = null) {
  const { element: { content }, parts: parts2 } = template;
  if (refNode === null || refNode === void 0) {
    content.appendChild(node);
    return;
  }
  const walker = document.createTreeWalker(content, walkerNodeFilter, null, false);
  let partIndex = nextActiveIndexInTemplateParts(parts2);
  let insertCount = 0;
  let walkerIndex = -1;
  while (walker.nextNode()) {
    walkerIndex++;
    const walkerNode = walker.currentNode;
    if (walkerNode === refNode) {
      insertCount = countNodes(node);
      refNode.parentNode.insertBefore(node, refNode);
    }
    while (partIndex !== -1 && parts2[partIndex].index === walkerIndex) {
      if (insertCount > 0) {
        while (partIndex !== -1) {
          parts2[partIndex].index += insertCount;
          partIndex = nextActiveIndexInTemplateParts(parts2, partIndex);
        }
        return;
      }
      partIndex = nextActiveIndexInTemplateParts(parts2, partIndex);
    }
  }
}

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/directive.js
var directives = /* @__PURE__ */ new WeakMap();
var isDirective = (o) => {
  return typeof o === "function" && directives.has(o);
};

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/part.js
var noChange = {};
var nothing = {};

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/template-instance.js
var TemplateInstance = class {
  constructor(template, processor, options) {
    this.__parts = [];
    this.template = template;
    this.processor = processor;
    this.options = options;
  }
  update(values) {
    let i = 0;
    for (const part of this.__parts) {
      if (part !== void 0) {
        part.setValue(values[i]);
      }
      i++;
    }
    for (const part of this.__parts) {
      if (part !== void 0) {
        part.commit();
      }
    }
  }
  _clone() {
    const fragment = isCEPolyfill ? this.template.element.content.cloneNode(true) : document.importNode(this.template.element.content, true);
    const stack = [];
    const parts2 = this.template.parts;
    const walker = document.createTreeWalker(fragment, 133, null, false);
    let partIndex = 0;
    let nodeIndex = 0;
    let part;
    let node = walker.nextNode();
    while (partIndex < parts2.length) {
      part = parts2[partIndex];
      if (!isTemplatePartActive(part)) {
        this.__parts.push(void 0);
        partIndex++;
        continue;
      }
      while (nodeIndex < part.index) {
        nodeIndex++;
        if (node.nodeName === "TEMPLATE") {
          stack.push(node);
          walker.currentNode = node.content;
        }
        if ((node = walker.nextNode()) === null) {
          walker.currentNode = stack.pop();
          node = walker.nextNode();
        }
      }
      if (part.type === "node") {
        const part2 = this.processor.handleTextExpression(this.options);
        part2.insertAfterNode(node.previousSibling);
        this.__parts.push(part2);
      } else {
        this.__parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
      }
      partIndex++;
    }
    if (isCEPolyfill) {
      document.adoptNode(fragment);
      customElements.upgrade(fragment);
    }
    return fragment;
  }
};

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/template-result.js
var policy = window.trustedTypes && trustedTypes.createPolicy("lit-html", { createHTML: (s) => s });
var commentMarker = ` ${marker} `;
var TemplateResult = class {
  constructor(strings, values, type, processor) {
    this.strings = strings;
    this.values = values;
    this.type = type;
    this.processor = processor;
  }
  /**
   * Returns a string of HTML used to create a `<template>` element.
   */
  getHTML() {
    const l = this.strings.length - 1;
    let html2 = "";
    let isCommentBinding = false;
    for (let i = 0; i < l; i++) {
      const s = this.strings[i];
      const commentOpen = s.lastIndexOf("<!--");
      isCommentBinding = (commentOpen > -1 || isCommentBinding) && s.indexOf("-->", commentOpen + 1) === -1;
      const attributeMatch = lastAttributeNameRegex.exec(s);
      if (attributeMatch === null) {
        html2 += s + (isCommentBinding ? commentMarker : nodeMarker);
      } else {
        html2 += s.substr(0, attributeMatch.index) + attributeMatch[1] + attributeMatch[2] + boundAttributeSuffix + attributeMatch[3] + marker;
      }
    }
    html2 += this.strings[l];
    return html2;
  }
  getTemplateElement() {
    const template = document.createElement("template");
    let value = this.getHTML();
    if (policy !== void 0) {
      value = policy.createHTML(value);
    }
    template.innerHTML = value;
    return template;
  }
};
var SVGTemplateResult = class extends TemplateResult {
  getHTML() {
    return `<svg>${super.getHTML()}</svg>`;
  }
  getTemplateElement() {
    const template = super.getTemplateElement();
    const content = template.content;
    const svgElement = content.firstChild;
    content.removeChild(svgElement);
    reparentNodes(content, svgElement.firstChild);
    return template;
  }
};

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/parts.js
var isPrimitive = (value) => {
  return value === null || !(typeof value === "object" || typeof value === "function");
};
var isIterable = (value) => {
  return Array.isArray(value) || // eslint-disable-next-line @typescript-eslint/no-explicit-any
  !!(value && value[Symbol.iterator]);
};
var AttributeCommitter = class {
  constructor(element, name, strings) {
    this.dirty = true;
    this.element = element;
    this.name = name;
    this.strings = strings;
    this.parts = [];
    for (let i = 0; i < strings.length - 1; i++) {
      this.parts[i] = this._createPart();
    }
  }
  /**
   * Creates a single part. Override this to create a differnt type of part.
   */
  _createPart() {
    return new AttributePart(this);
  }
  _getValue() {
    const strings = this.strings;
    const l = strings.length - 1;
    const parts2 = this.parts;
    if (l === 1 && strings[0] === "" && strings[1] === "") {
      const v = parts2[0].value;
      if (typeof v === "symbol") {
        return String(v);
      }
      if (typeof v === "string" || !isIterable(v)) {
        return v;
      }
    }
    let text = "";
    for (let i = 0; i < l; i++) {
      text += strings[i];
      const part = parts2[i];
      if (part !== void 0) {
        const v = part.value;
        if (isPrimitive(v) || !isIterable(v)) {
          text += typeof v === "string" ? v : String(v);
        } else {
          for (const t of v) {
            text += typeof t === "string" ? t : String(t);
          }
        }
      }
    }
    text += strings[l];
    return text;
  }
  commit() {
    if (this.dirty) {
      this.dirty = false;
      this.element.setAttribute(this.name, this._getValue());
    }
  }
};
var AttributePart = class {
  constructor(committer) {
    this.value = void 0;
    this.committer = committer;
  }
  setValue(value) {
    if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
      this.value = value;
      if (!isDirective(value)) {
        this.committer.dirty = true;
      }
    }
  }
  commit() {
    while (isDirective(this.value)) {
      const directive2 = this.value;
      this.value = noChange;
      directive2(this);
    }
    if (this.value === noChange) {
      return;
    }
    this.committer.commit();
  }
};
var NodePart = class _NodePart {
  constructor(options) {
    this.value = void 0;
    this.__pendingValue = void 0;
    this.options = options;
  }
  /**
   * Appends this part into a container.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  appendInto(container) {
    this.startNode = container.appendChild(createMarker());
    this.endNode = container.appendChild(createMarker());
  }
  /**
   * Inserts this part after the `ref` node (between `ref` and `ref`'s next
   * sibling). Both `ref` and its next sibling must be static, unchanging nodes
   * such as those that appear in a literal section of a template.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  insertAfterNode(ref) {
    this.startNode = ref;
    this.endNode = ref.nextSibling;
  }
  /**
   * Appends this part into a parent part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  appendIntoPart(part) {
    part.__insert(this.startNode = createMarker());
    part.__insert(this.endNode = createMarker());
  }
  /**
   * Inserts this part after the `ref` part.
   *
   * This part must be empty, as its contents are not automatically moved.
   */
  insertAfterPart(ref) {
    ref.__insert(this.startNode = createMarker());
    this.endNode = ref.endNode;
    ref.endNode = this.startNode;
  }
  setValue(value) {
    this.__pendingValue = value;
  }
  commit() {
    if (this.startNode.parentNode === null) {
      return;
    }
    while (isDirective(this.__pendingValue)) {
      const directive2 = this.__pendingValue;
      this.__pendingValue = noChange;
      directive2(this);
    }
    const value = this.__pendingValue;
    if (value === noChange) {
      return;
    }
    if (isPrimitive(value)) {
      if (value !== this.value) {
        this.__commitText(value);
      }
    } else if (value instanceof TemplateResult) {
      this.__commitTemplateResult(value);
    } else if (value instanceof Node) {
      this.__commitNode(value);
    } else if (isIterable(value)) {
      this.__commitIterable(value);
    } else if (value === nothing) {
      this.value = nothing;
      this.clear();
    } else {
      this.__commitText(value);
    }
  }
  __insert(node) {
    this.endNode.parentNode.insertBefore(node, this.endNode);
  }
  __commitNode(value) {
    if (this.value === value) {
      return;
    }
    this.clear();
    this.__insert(value);
    this.value = value;
  }
  __commitText(value) {
    const node = this.startNode.nextSibling;
    value = value == null ? "" : value;
    const valueAsString = typeof value === "string" ? value : String(value);
    if (node === this.endNode.previousSibling && node.nodeType === 3) {
      node.data = valueAsString;
    } else {
      this.__commitNode(document.createTextNode(valueAsString));
    }
    this.value = value;
  }
  __commitTemplateResult(value) {
    const template = this.options.templateFactory(value);
    if (this.value instanceof TemplateInstance && this.value.template === template) {
      this.value.update(value.values);
    } else {
      const instance = new TemplateInstance(template, value.processor, this.options);
      const fragment = instance._clone();
      instance.update(value.values);
      this.__commitNode(fragment);
      this.value = instance;
    }
  }
  __commitIterable(value) {
    if (!Array.isArray(this.value)) {
      this.value = [];
      this.clear();
    }
    const itemParts = this.value;
    let partIndex = 0;
    let itemPart;
    for (const item of value) {
      itemPart = itemParts[partIndex];
      if (itemPart === void 0) {
        itemPart = new _NodePart(this.options);
        itemParts.push(itemPart);
        if (partIndex === 0) {
          itemPart.appendIntoPart(this);
        } else {
          itemPart.insertAfterPart(itemParts[partIndex - 1]);
        }
      }
      itemPart.setValue(item);
      itemPart.commit();
      partIndex++;
    }
    if (partIndex < itemParts.length) {
      itemParts.length = partIndex;
      this.clear(itemPart && itemPart.endNode);
    }
  }
  clear(startNode = this.startNode) {
    removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
  }
};
var BooleanAttributePart = class {
  constructor(element, name, strings) {
    this.value = void 0;
    this.__pendingValue = void 0;
    if (strings.length !== 2 || strings[0] !== "" || strings[1] !== "") {
      throw new Error("Boolean attributes can only contain a single expression");
    }
    this.element = element;
    this.name = name;
    this.strings = strings;
  }
  setValue(value) {
    this.__pendingValue = value;
  }
  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive2 = this.__pendingValue;
      this.__pendingValue = noChange;
      directive2(this);
    }
    if (this.__pendingValue === noChange) {
      return;
    }
    const value = !!this.__pendingValue;
    if (this.value !== value) {
      if (value) {
        this.element.setAttribute(this.name, "");
      } else {
        this.element.removeAttribute(this.name);
      }
      this.value = value;
    }
    this.__pendingValue = noChange;
  }
};
var PropertyCommitter = class extends AttributeCommitter {
  constructor(element, name, strings) {
    super(element, name, strings);
    this.single = strings.length === 2 && strings[0] === "" && strings[1] === "";
  }
  _createPart() {
    return new PropertyPart(this);
  }
  _getValue() {
    if (this.single) {
      return this.parts[0].value;
    }
    return super._getValue();
  }
  commit() {
    if (this.dirty) {
      this.dirty = false;
      this.element[this.name] = this._getValue();
    }
  }
};
var PropertyPart = class extends AttributePart {
};
var eventOptionsSupported = false;
(() => {
  try {
    const options = {
      get capture() {
        eventOptionsSupported = true;
        return false;
      }
    };
    window.addEventListener("test", options, options);
    window.removeEventListener("test", options, options);
  } catch (_e) {
  }
})();
var EventPart = class {
  constructor(element, eventName, eventContext) {
    this.value = void 0;
    this.__pendingValue = void 0;
    this.element = element;
    this.eventName = eventName;
    this.eventContext = eventContext;
    this.__boundHandleEvent = (e) => this.handleEvent(e);
  }
  setValue(value) {
    this.__pendingValue = value;
  }
  commit() {
    while (isDirective(this.__pendingValue)) {
      const directive2 = this.__pendingValue;
      this.__pendingValue = noChange;
      directive2(this);
    }
    if (this.__pendingValue === noChange) {
      return;
    }
    const newListener = this.__pendingValue;
    const oldListener = this.value;
    const shouldRemoveListener = newListener == null || oldListener != null && (newListener.capture !== oldListener.capture || newListener.once !== oldListener.once || newListener.passive !== oldListener.passive);
    const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
    if (shouldRemoveListener) {
      this.element.removeEventListener(this.eventName, this.__boundHandleEvent, this.__options);
    }
    if (shouldAddListener) {
      this.__options = getOptions(newListener);
      this.element.addEventListener(this.eventName, this.__boundHandleEvent, this.__options);
    }
    this.value = newListener;
    this.__pendingValue = noChange;
  }
  handleEvent(event) {
    if (typeof this.value === "function") {
      this.value.call(this.eventContext || this.element, event);
    } else {
      this.value.handleEvent(event);
    }
  }
};
var getOptions = (o) => o && (eventOptionsSupported ? { capture: o.capture, passive: o.passive, once: o.once } : o.capture);

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/template-factory.js
function templateFactory(result) {
  let templateCache = templateCaches.get(result.type);
  if (templateCache === void 0) {
    templateCache = {
      stringsArray: /* @__PURE__ */ new WeakMap(),
      keyString: /* @__PURE__ */ new Map()
    };
    templateCaches.set(result.type, templateCache);
  }
  let template = templateCache.stringsArray.get(result.strings);
  if (template !== void 0) {
    return template;
  }
  const key = result.strings.join(marker);
  template = templateCache.keyString.get(key);
  if (template === void 0) {
    template = new Template(result, result.getTemplateElement());
    templateCache.keyString.set(key, template);
  }
  templateCache.stringsArray.set(result.strings, template);
  return template;
}
var templateCaches = /* @__PURE__ */ new Map();

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/render.js
var parts = /* @__PURE__ */ new WeakMap();
var render = (result, container, options) => {
  let part = parts.get(container);
  if (part === void 0) {
    removeNodes(container, container.firstChild);
    parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
    part.appendInto(container);
  }
  part.setValue(result);
  part.commit();
};

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/default-template-processor.js
var DefaultTemplateProcessor = class {
  /**
   * Create parts for an attribute-position binding, given the event, attribute
   * name, and string literals.
   *
   * @param element The element containing the binding
   * @param name  The attribute name
   * @param strings The string literals. There are always at least two strings,
   *   event for fully-controlled bindings with a single expression.
   */
  handleAttributeExpressions(element, name, strings, options) {
    const prefix = name[0];
    if (prefix === ".") {
      const committer2 = new PropertyCommitter(element, name.slice(1), strings);
      return committer2.parts;
    }
    if (prefix === "@") {
      return [new EventPart(element, name.slice(1), options.eventContext)];
    }
    if (prefix === "?") {
      return [new BooleanAttributePart(element, name.slice(1), strings)];
    }
    const committer = new AttributeCommitter(element, name, strings);
    return committer.parts;
  }
  /**
   * Create parts for a text-position binding.
   * @param templateFactory
   */
  handleTextExpression(options) {
    return new NodePart(options);
  }
};
var defaultTemplateProcessor = new DefaultTemplateProcessor();

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lit-html.js
if (typeof window !== "undefined") {
  (window["litHtmlVersions"] || (window["litHtmlVersions"] = [])).push("1.4.1");
}
var html = (strings, ...values) => new TemplateResult(strings, values, "html", defaultTemplateProcessor);
var svg = (strings, ...values) => new SVGTemplateResult(strings, values, "svg", defaultTemplateProcessor);

// node_modules/.deno/lit-html@1.4.1/node_modules/lit-html/lib/shady-render.js
var getTemplateCacheKey = (type, scopeName) => `${type}--${scopeName}`;
var compatibleShadyCSSVersion = true;
if (typeof window.ShadyCSS === "undefined") {
  compatibleShadyCSSVersion = false;
} else if (typeof window.ShadyCSS.prepareTemplateDom === "undefined") {
  console.warn(`Incompatible ShadyCSS version detected. Please update to at least @webcomponents/webcomponentsjs@2.0.2 and @webcomponents/shadycss@1.3.1.`);
  compatibleShadyCSSVersion = false;
}
var shadyTemplateFactory = (scopeName) => (result) => {
  const cacheKey = getTemplateCacheKey(result.type, scopeName);
  let templateCache = templateCaches.get(cacheKey);
  if (templateCache === void 0) {
    templateCache = {
      stringsArray: /* @__PURE__ */ new WeakMap(),
      keyString: /* @__PURE__ */ new Map()
    };
    templateCaches.set(cacheKey, templateCache);
  }
  let template = templateCache.stringsArray.get(result.strings);
  if (template !== void 0) {
    return template;
  }
  const key = result.strings.join(marker);
  template = templateCache.keyString.get(key);
  if (template === void 0) {
    const element = result.getTemplateElement();
    if (compatibleShadyCSSVersion) {
      window.ShadyCSS.prepareTemplateDom(element, scopeName);
    }
    template = new Template(result, element);
    templateCache.keyString.set(key, template);
  }
  templateCache.stringsArray.set(result.strings, template);
  return template;
};
var TEMPLATE_TYPES = ["html", "svg"];
var removeStylesFromLitTemplates = (scopeName) => {
  TEMPLATE_TYPES.forEach((type) => {
    const templates = templateCaches.get(getTemplateCacheKey(type, scopeName));
    if (templates !== void 0) {
      templates.keyString.forEach((template) => {
        const { element: { content } } = template;
        const styles = /* @__PURE__ */ new Set();
        Array.from(content.querySelectorAll("style")).forEach((s) => {
          styles.add(s);
        });
        removeNodesFromTemplate(template, styles);
      });
    }
  });
};
var shadyRenderSet = /* @__PURE__ */ new Set();
var prepareTemplateStyles = (scopeName, renderedDOM, template) => {
  shadyRenderSet.add(scopeName);
  const templateElement = !!template ? template.element : document.createElement("template");
  const styles = renderedDOM.querySelectorAll("style");
  const { length } = styles;
  if (length === 0) {
    window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
    return;
  }
  const condensedStyle = document.createElement("style");
  for (let i = 0; i < length; i++) {
    const style2 = styles[i];
    style2.parentNode.removeChild(style2);
    condensedStyle.textContent += style2.textContent;
  }
  removeStylesFromLitTemplates(scopeName);
  const content = templateElement.content;
  if (!!template) {
    insertNodeIntoTemplate(template, condensedStyle, content.firstChild);
  } else {
    content.insertBefore(condensedStyle, content.firstChild);
  }
  window.ShadyCSS.prepareTemplateStyles(templateElement, scopeName);
  const style = content.querySelector("style");
  if (window.ShadyCSS.nativeShadow && style !== null) {
    renderedDOM.insertBefore(style.cloneNode(true), renderedDOM.firstChild);
  } else if (!!template) {
    content.insertBefore(condensedStyle, content.firstChild);
    const removes = /* @__PURE__ */ new Set();
    removes.add(condensedStyle);
    removeNodesFromTemplate(template, removes);
  }
};
var render2 = (result, container, options) => {
  if (!options || typeof options !== "object" || !options.scopeName) {
    throw new Error("The `scopeName` option is required.");
  }
  const scopeName = options.scopeName;
  const hasRendered = parts.has(container);
  const needsScoping = compatibleShadyCSSVersion && container.nodeType === 11 && !!container.host;
  const firstScopeRender = needsScoping && !shadyRenderSet.has(scopeName);
  const renderContainer = firstScopeRender ? document.createDocumentFragment() : container;
  render(result, renderContainer, Object.assign({ templateFactory: shadyTemplateFactory(scopeName) }, options));
  if (firstScopeRender) {
    const part = parts.get(renderContainer);
    parts.delete(renderContainer);
    const template = part.value instanceof TemplateInstance ? part.value.template : void 0;
    prepareTemplateStyles(scopeName, renderContainer, template);
    removeNodes(container, container.firstChild);
    container.appendChild(renderContainer);
    parts.set(container, part);
  }
  if (!hasRendered && needsScoping) {
    window.ShadyCSS.styleElement(container.host);
  }
};

// node_modules/.deno/lit-element@2.5.1/node_modules/lit-element/lib/updating-element.js
var _a;
window.JSCompiler_renameProperty = (prop, _obj) => prop;
var defaultConverter = {
  toAttribute(value, type) {
    switch (type) {
      case Boolean:
        return value ? "" : null;
      case Object:
      case Array:
        return value == null ? value : JSON.stringify(value);
    }
    return value;
  },
  fromAttribute(value, type) {
    switch (type) {
      case Boolean:
        return value !== null;
      case Number:
        return value === null ? null : Number(value);
      case Object:
      case Array:
        return JSON.parse(value);
    }
    return value;
  }
};
var notEqual = (value, old) => {
  return old !== value && (old === old || value === value);
};
var defaultPropertyDeclaration = {
  attribute: true,
  type: String,
  converter: defaultConverter,
  reflect: false,
  hasChanged: notEqual
};
var STATE_HAS_UPDATED = 1;
var STATE_UPDATE_REQUESTED = 1 << 2;
var STATE_IS_REFLECTING_TO_ATTRIBUTE = 1 << 3;
var STATE_IS_REFLECTING_TO_PROPERTY = 1 << 4;
var finalized = "finalized";
var UpdatingElement = class extends HTMLElement {
  constructor() {
    super();
    this.initialize();
  }
  /**
   * Returns a list of attributes corresponding to the registered properties.
   * @nocollapse
   */
  static get observedAttributes() {
    this.finalize();
    const attributes = [];
    this._classProperties.forEach((v, p) => {
      const attr = this._attributeNameForProperty(p, v);
      if (attr !== void 0) {
        this._attributeToPropertyMap.set(attr, p);
        attributes.push(attr);
      }
    });
    return attributes;
  }
  /**
   * Ensures the private `_classProperties` property metadata is created.
   * In addition to `finalize` this is also called in `createProperty` to
   * ensure the `@property` decorator can add property metadata.
   */
  /** @nocollapse */
  static _ensureClassProperties() {
    if (!this.hasOwnProperty(JSCompiler_renameProperty("_classProperties", this))) {
      this._classProperties = /* @__PURE__ */ new Map();
      const superProperties = Object.getPrototypeOf(this)._classProperties;
      if (superProperties !== void 0) {
        superProperties.forEach((v, k) => this._classProperties.set(k, v));
      }
    }
  }
  /**
   * Creates a property accessor on the element prototype if one does not exist
   * and stores a PropertyDeclaration for the property with the given options.
   * The property setter calls the property's `hasChanged` property option
   * or uses a strict identity check to determine whether or not to request
   * an update.
   *
   * This method may be overridden to customize properties; however,
   * when doing so, it's important to call `super.createProperty` to ensure
   * the property is setup correctly. This method calls
   * `getPropertyDescriptor` internally to get a descriptor to install.
   * To customize what properties do when they are get or set, override
   * `getPropertyDescriptor`. To customize the options for a property,
   * implement `createProperty` like this:
   *
   * static createProperty(name, options) {
   *   options = Object.assign(options, {myOption: true});
   *   super.createProperty(name, options);
   * }
   *
   * @nocollapse
   */
  static createProperty(name, options = defaultPropertyDeclaration) {
    this._ensureClassProperties();
    this._classProperties.set(name, options);
    if (options.noAccessor || this.prototype.hasOwnProperty(name)) {
      return;
    }
    const key = typeof name === "symbol" ? Symbol() : `__${name}`;
    const descriptor = this.getPropertyDescriptor(name, key, options);
    if (descriptor !== void 0) {
      Object.defineProperty(this.prototype, name, descriptor);
    }
  }
  /**
   * Returns a property descriptor to be defined on the given named property.
   * If no descriptor is returned, the property will not become an accessor.
   * For example,
   *
   *   class MyElement extends LitElement {
   *     static getPropertyDescriptor(name, key, options) {
   *       const defaultDescriptor =
   *           super.getPropertyDescriptor(name, key, options);
   *       const setter = defaultDescriptor.set;
   *       return {
   *         get: defaultDescriptor.get,
   *         set(value) {
   *           setter.call(this, value);
   *           // custom action.
   *         },
   *         configurable: true,
   *         enumerable: true
   *       }
   *     }
   *   }
   *
   * @nocollapse
   */
  static getPropertyDescriptor(name, key, options) {
    return {
      // tslint:disable-next-line:no-any no symbol in index
      get() {
        return this[key];
      },
      set(value) {
        const oldValue = this[name];
        this[key] = value;
        this.requestUpdateInternal(name, oldValue, options);
      },
      configurable: true,
      enumerable: true
    };
  }
  /**
   * Returns the property options associated with the given property.
   * These options are defined with a PropertyDeclaration via the `properties`
   * object or the `@property` decorator and are registered in
   * `createProperty(...)`.
   *
   * Note, this method should be considered "final" and not overridden. To
   * customize the options for a given property, override `createProperty`.
   *
   * @nocollapse
   * @final
   */
  static getPropertyOptions(name) {
    return this._classProperties && this._classProperties.get(name) || defaultPropertyDeclaration;
  }
  /**
   * Creates property accessors for registered properties and ensures
   * any superclasses are also finalized.
   * @nocollapse
   */
  static finalize() {
    const superCtor = Object.getPrototypeOf(this);
    if (!superCtor.hasOwnProperty(finalized)) {
      superCtor.finalize();
    }
    this[finalized] = true;
    this._ensureClassProperties();
    this._attributeToPropertyMap = /* @__PURE__ */ new Map();
    if (this.hasOwnProperty(JSCompiler_renameProperty("properties", this))) {
      const props = this.properties;
      const propKeys = [
        ...Object.getOwnPropertyNames(props),
        ...typeof Object.getOwnPropertySymbols === "function" ? Object.getOwnPropertySymbols(props) : []
      ];
      for (const p of propKeys) {
        this.createProperty(p, props[p]);
      }
    }
  }
  /**
   * Returns the property name for the given attribute `name`.
   * @nocollapse
   */
  static _attributeNameForProperty(name, options) {
    const attribute = options.attribute;
    return attribute === false ? void 0 : typeof attribute === "string" ? attribute : typeof name === "string" ? name.toLowerCase() : void 0;
  }
  /**
   * Returns true if a property should request an update.
   * Called when a property value is set and uses the `hasChanged`
   * option for the property if present or a strict identity check.
   * @nocollapse
   */
  static _valueHasChanged(value, old, hasChanged = notEqual) {
    return hasChanged(value, old);
  }
  /**
   * Returns the property value for the given attribute value.
   * Called via the `attributeChangedCallback` and uses the property's
   * `converter` or `converter.fromAttribute` property option.
   * @nocollapse
   */
  static _propertyValueFromAttribute(value, options) {
    const type = options.type;
    const converter = options.converter || defaultConverter;
    const fromAttribute = typeof converter === "function" ? converter : converter.fromAttribute;
    return fromAttribute ? fromAttribute(value, type) : value;
  }
  /**
   * Returns the attribute value for the given property value. If this
   * returns undefined, the property will *not* be reflected to an attribute.
   * If this returns null, the attribute will be removed, otherwise the
   * attribute will be set to the value.
   * This uses the property's `reflect` and `type.toAttribute` property options.
   * @nocollapse
   */
  static _propertyValueToAttribute(value, options) {
    if (options.reflect === void 0) {
      return;
    }
    const type = options.type;
    const converter = options.converter;
    const toAttribute = converter && converter.toAttribute || defaultConverter.toAttribute;
    return toAttribute(value, type);
  }
  /**
   * Performs element initialization. By default captures any pre-set values for
   * registered properties.
   */
  initialize() {
    this._updateState = 0;
    this._updatePromise = new Promise((res) => this._enableUpdatingResolver = res);
    this._changedProperties = /* @__PURE__ */ new Map();
    this._saveInstanceProperties();
    this.requestUpdateInternal();
  }
  /**
   * Fixes any properties set on the instance before upgrade time.
   * Otherwise these would shadow the accessor and break these properties.
   * The properties are stored in a Map which is played back after the
   * constructor runs. Note, on very old versions of Safari (<=9) or Chrome
   * (<=41), properties created for native platform properties like (`id` or
   * `name`) may not have default values set in the element constructor. On
   * these browsers native properties appear on instances and therefore their
   * default value will overwrite any element default (e.g. if the element sets
   * this.id = 'id' in the constructor, the 'id' will become '' since this is
   * the native platform default).
   */
  _saveInstanceProperties() {
    this.constructor._classProperties.forEach((_v, p) => {
      if (this.hasOwnProperty(p)) {
        const value = this[p];
        delete this[p];
        if (!this._instanceProperties) {
          this._instanceProperties = /* @__PURE__ */ new Map();
        }
        this._instanceProperties.set(p, value);
      }
    });
  }
  /**
   * Applies previously saved instance properties.
   */
  _applyInstanceProperties() {
    this._instanceProperties.forEach((v, p) => this[p] = v);
    this._instanceProperties = void 0;
  }
  connectedCallback() {
    this.enableUpdating();
  }
  enableUpdating() {
    if (this._enableUpdatingResolver !== void 0) {
      this._enableUpdatingResolver();
      this._enableUpdatingResolver = void 0;
    }
  }
  /**
   * Allows for `super.disconnectedCallback()` in extensions while
   * reserving the possibility of making non-breaking feature additions
   * when disconnecting at some point in the future.
   */
  disconnectedCallback() {
  }
  /**
   * Synchronizes property values when attributes change.
   */
  attributeChangedCallback(name, old, value) {
    if (old !== value) {
      this._attributeToProperty(name, value);
    }
  }
  _propertyToAttribute(name, value, options = defaultPropertyDeclaration) {
    const ctor = this.constructor;
    const attr = ctor._attributeNameForProperty(name, options);
    if (attr !== void 0) {
      const attrValue = ctor._propertyValueToAttribute(value, options);
      if (attrValue === void 0) {
        return;
      }
      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_ATTRIBUTE;
      if (attrValue == null) {
        this.removeAttribute(attr);
      } else {
        this.setAttribute(attr, attrValue);
      }
      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_ATTRIBUTE;
    }
  }
  _attributeToProperty(name, value) {
    if (this._updateState & STATE_IS_REFLECTING_TO_ATTRIBUTE) {
      return;
    }
    const ctor = this.constructor;
    const propName = ctor._attributeToPropertyMap.get(name);
    if (propName !== void 0) {
      const options = ctor.getPropertyOptions(propName);
      this._updateState = this._updateState | STATE_IS_REFLECTING_TO_PROPERTY;
      this[propName] = // tslint:disable-next-line:no-any
      ctor._propertyValueFromAttribute(value, options);
      this._updateState = this._updateState & ~STATE_IS_REFLECTING_TO_PROPERTY;
    }
  }
  /**
   * This protected version of `requestUpdate` does not access or return the
   * `updateComplete` promise. This promise can be overridden and is therefore
   * not free to access.
   */
  requestUpdateInternal(name, oldValue, options) {
    let shouldRequestUpdate = true;
    if (name !== void 0) {
      const ctor = this.constructor;
      options = options || ctor.getPropertyOptions(name);
      if (ctor._valueHasChanged(this[name], oldValue, options.hasChanged)) {
        if (!this._changedProperties.has(name)) {
          this._changedProperties.set(name, oldValue);
        }
        if (options.reflect === true && !(this._updateState & STATE_IS_REFLECTING_TO_PROPERTY)) {
          if (this._reflectingProperties === void 0) {
            this._reflectingProperties = /* @__PURE__ */ new Map();
          }
          this._reflectingProperties.set(name, options);
        }
      } else {
        shouldRequestUpdate = false;
      }
    }
    if (!this._hasRequestedUpdate && shouldRequestUpdate) {
      this._updatePromise = this._enqueueUpdate();
    }
  }
  /**
   * Requests an update which is processed asynchronously. This should
   * be called when an element should update based on some state not triggered
   * by setting a property. In this case, pass no arguments. It should also be
   * called when manually implementing a property setter. In this case, pass the
   * property `name` and `oldValue` to ensure that any configured property
   * options are honored. Returns the `updateComplete` Promise which is resolved
   * when the update completes.
   *
   * @param name {PropertyKey} (optional) name of requesting property
   * @param oldValue {any} (optional) old value of requesting property
   * @returns {Promise} A Promise that is resolved when the update completes.
   */
  requestUpdate(name, oldValue) {
    this.requestUpdateInternal(name, oldValue);
    return this.updateComplete;
  }
  /**
   * Sets up the element to asynchronously update.
   */
  async _enqueueUpdate() {
    this._updateState = this._updateState | STATE_UPDATE_REQUESTED;
    try {
      await this._updatePromise;
    } catch (e) {
    }
    const result = this.performUpdate();
    if (result != null) {
      await result;
    }
    return !this._hasRequestedUpdate;
  }
  get _hasRequestedUpdate() {
    return this._updateState & STATE_UPDATE_REQUESTED;
  }
  get hasUpdated() {
    return this._updateState & STATE_HAS_UPDATED;
  }
  /**
   * Performs an element update. Note, if an exception is thrown during the
   * update, `firstUpdated` and `updated` will not be called.
   *
   * You can override this method to change the timing of updates. If this
   * method is overridden, `super.performUpdate()` must be called.
   *
   * For instance, to schedule updates to occur just before the next frame:
   *
   * ```
   * protected async performUpdate(): Promise<unknown> {
   *   await new Promise((resolve) => requestAnimationFrame(() => resolve()));
   *   super.performUpdate();
   * }
   * ```
   */
  performUpdate() {
    if (!this._hasRequestedUpdate) {
      return;
    }
    if (this._instanceProperties) {
      this._applyInstanceProperties();
    }
    let shouldUpdate = false;
    const changedProperties = this._changedProperties;
    try {
      shouldUpdate = this.shouldUpdate(changedProperties);
      if (shouldUpdate) {
        this.update(changedProperties);
      } else {
        this._markUpdated();
      }
    } catch (e) {
      shouldUpdate = false;
      this._markUpdated();
      throw e;
    }
    if (shouldUpdate) {
      if (!(this._updateState & STATE_HAS_UPDATED)) {
        this._updateState = this._updateState | STATE_HAS_UPDATED;
        this.firstUpdated(changedProperties);
      }
      this.updated(changedProperties);
    }
  }
  _markUpdated() {
    this._changedProperties = /* @__PURE__ */ new Map();
    this._updateState = this._updateState & ~STATE_UPDATE_REQUESTED;
  }
  /**
   * Returns a Promise that resolves when the element has completed updating.
   * The Promise value is a boolean that is `true` if the element completed the
   * update without triggering another update. The Promise result is `false` if
   * a property was set inside `updated()`. If the Promise is rejected, an
   * exception was thrown during the update.
   *
   * To await additional asynchronous work, override the `_getUpdateComplete`
   * method. For example, it is sometimes useful to await a rendered element
   * before fulfilling this Promise. To do this, first await
   * `super._getUpdateComplete()`, then any subsequent state.
   *
   * @returns {Promise} The Promise returns a boolean that indicates if the
   * update resolved without triggering another update.
   */
  get updateComplete() {
    return this._getUpdateComplete();
  }
  /**
   * Override point for the `updateComplete` promise.
   *
   * It is not safe to override the `updateComplete` getter directly due to a
   * limitation in TypeScript which means it is not possible to call a
   * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
   * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
   * This method should be overridden instead. For example:
   *
   *   class MyElement extends LitElement {
   *     async _getUpdateComplete() {
   *       await super._getUpdateComplete();
   *       await this._myChild.updateComplete;
   *     }
   *   }
   * @deprecated Override `getUpdateComplete()` instead for forward
   *     compatibility with `lit-element` 3.0 / `@lit/reactive-element`.
   */
  _getUpdateComplete() {
    return this.getUpdateComplete();
  }
  /**
   * Override point for the `updateComplete` promise.
   *
   * It is not safe to override the `updateComplete` getter directly due to a
   * limitation in TypeScript which means it is not possible to call a
   * superclass getter (e.g. `super.updateComplete.then(...)`) when the target
   * language is ES5 (https://github.com/microsoft/TypeScript/issues/338).
   * This method should be overridden instead. For example:
   *
   *   class MyElement extends LitElement {
   *     async getUpdateComplete() {
   *       await super.getUpdateComplete();
   *       await this._myChild.updateComplete;
   *     }
   *   }
   */
  getUpdateComplete() {
    return this._updatePromise;
  }
  /**
   * Controls whether or not `update` should be called when the element requests
   * an update. By default, this method always returns `true`, but this can be
   * customized to control when to update.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  shouldUpdate(_changedProperties) {
    return true;
  }
  /**
   * Updates the element. This method reflects property values to attributes.
   * It can be overridden to render and keep updated element DOM.
   * Setting properties inside this method will *not* trigger
   * another update.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  update(_changedProperties) {
    if (this._reflectingProperties !== void 0 && this._reflectingProperties.size > 0) {
      this._reflectingProperties.forEach((v, k) => this._propertyToAttribute(k, this[k], v));
      this._reflectingProperties = void 0;
    }
    this._markUpdated();
  }
  /**
   * Invoked whenever the element is updated. Implement to perform
   * post-updating tasks via DOM APIs, for example, focusing an element.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  updated(_changedProperties) {
  }
  /**
   * Invoked when the element is first updated. Implement to perform one time
   * work on the element after update.
   *
   * Setting properties inside this method will trigger the element to update
   * again after this update cycle completes.
   *
   * @param _changedProperties Map of changed properties with old values
   */
  firstUpdated(_changedProperties) {
  }
};
_a = finalized;
UpdatingElement[_a] = true;

// node_modules/.deno/lit-element@2.5.1/node_modules/lit-element/lib/decorators.js
var ElementProto = Element.prototype;
var legacyMatches = ElementProto.msMatchesSelector || ElementProto.webkitMatchesSelector;

// node_modules/.deno/lit-element@2.5.1/node_modules/lit-element/lib/css-tag.js
var supportsAdoptingStyleSheets = window.ShadowRoot && (window.ShadyCSS === void 0 || window.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var constructionToken = Symbol();
var CSSResult = class {
  constructor(cssText, safeToken) {
    if (safeToken !== constructionToken) {
      throw new Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    }
    this.cssText = cssText;
  }
  // Note, this is a getter so that it's lazy. In practice, this means
  // stylesheets are not created until the first element instance is made.
  get styleSheet() {
    if (this._styleSheet === void 0) {
      if (supportsAdoptingStyleSheets) {
        this._styleSheet = new CSSStyleSheet();
        this._styleSheet.replaceSync(this.cssText);
      } else {
        this._styleSheet = null;
      }
    }
    return this._styleSheet;
  }
  toString() {
    return this.cssText;
  }
};
var unsafeCSS = (value) => {
  return new CSSResult(String(value), constructionToken);
};
var textFromCSSResult = (value) => {
  if (value instanceof CSSResult) {
    return value.cssText;
  } else if (typeof value === "number") {
    return value;
  } else {
    throw new Error(`Value passed to 'css' function must be a 'css' function result: ${value}. Use 'unsafeCSS' to pass non-literal values, but
            take care to ensure page security.`);
  }
};
var css = (strings, ...values) => {
  const cssText = values.reduce((acc, v, idx) => acc + textFromCSSResult(v) + strings[idx + 1], strings[0]);
  return new CSSResult(cssText, constructionToken);
};

// node_modules/.deno/lit-element@2.5.1/node_modules/lit-element/lit-element.js
(window["litElementVersions"] || (window["litElementVersions"] = [])).push("2.5.1");
var renderNotImplemented = {};
var LitElement = class extends UpdatingElement {
  /**
   * Return the array of styles to apply to the element.
   * Override this method to integrate into a style management system.
   *
   * @nocollapse
   */
  static getStyles() {
    return this.styles;
  }
  /** @nocollapse */
  static _getUniqueStyles() {
    if (this.hasOwnProperty(JSCompiler_renameProperty("_styles", this))) {
      return;
    }
    const userStyles = this.getStyles();
    if (Array.isArray(userStyles)) {
      const addStyles = (styles2, set2) => styles2.reduceRight((set3, s) => (
        // Note: On IE set.add() does not return the set
        Array.isArray(s) ? addStyles(s, set3) : (set3.add(s), set3)
      ), set2);
      const set = addStyles(userStyles, /* @__PURE__ */ new Set());
      const styles = [];
      set.forEach((v) => styles.unshift(v));
      this._styles = styles;
    } else {
      this._styles = userStyles === void 0 ? [] : [userStyles];
    }
    this._styles = this._styles.map((s) => {
      if (s instanceof CSSStyleSheet && !supportsAdoptingStyleSheets) {
        const cssText = Array.prototype.slice.call(s.cssRules).reduce((css2, rule) => css2 + rule.cssText, "");
        return unsafeCSS(cssText);
      }
      return s;
    });
  }
  /**
   * Performs element initialization. By default this calls
   * [[`createRenderRoot`]] to create the element [[`renderRoot`]] node and
   * captures any pre-set values for registered properties.
   */
  initialize() {
    super.initialize();
    this.constructor._getUniqueStyles();
    this.renderRoot = this.createRenderRoot();
    if (window.ShadowRoot && this.renderRoot instanceof window.ShadowRoot) {
      this.adoptStyles();
    }
  }
  /**
   * Returns the node into which the element should render and by default
   * creates and returns an open shadowRoot. Implement to customize where the
   * element's DOM is rendered. For example, to render into the element's
   * childNodes, return `this`.
   * @returns {Element|DocumentFragment} Returns a node into which to render.
   */
  createRenderRoot() {
    return this.attachShadow(this.constructor.shadowRootOptions);
  }
  /**
   * Applies styling to the element shadowRoot using the [[`styles`]]
   * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
   * available and will fallback otherwise. When Shadow DOM is polyfilled,
   * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
   * is available but `adoptedStyleSheets` is not, styles are appended to the
   * end of the `shadowRoot` to [mimic spec
   * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
   */
  adoptStyles() {
    const styles = this.constructor._styles;
    if (styles.length === 0) {
      return;
    }
    if (window.ShadyCSS !== void 0 && !window.ShadyCSS.nativeShadow) {
      window.ShadyCSS.ScopingShim.prepareAdoptedCssText(styles.map((s) => s.cssText), this.localName);
    } else if (supportsAdoptingStyleSheets) {
      this.renderRoot.adoptedStyleSheets = styles.map((s) => s instanceof CSSStyleSheet ? s : s.styleSheet);
    } else {
      this._needsShimAdoptedStyleSheets = true;
    }
  }
  connectedCallback() {
    super.connectedCallback();
    if (this.hasUpdated && window.ShadyCSS !== void 0) {
      window.ShadyCSS.styleElement(this);
    }
  }
  /**
   * Updates the element. This method reflects property values to attributes
   * and calls `render` to render DOM via lit-html. Setting properties inside
   * this method will *not* trigger another update.
   * @param _changedProperties Map of changed properties with old values
   */
  update(changedProperties) {
    const templateResult = this.render();
    super.update(changedProperties);
    if (templateResult !== renderNotImplemented) {
      this.constructor.render(templateResult, this.renderRoot, { scopeName: this.localName, eventContext: this });
    }
    if (this._needsShimAdoptedStyleSheets) {
      this._needsShimAdoptedStyleSheets = false;
      this.constructor._styles.forEach((s) => {
        const style = document.createElement("style");
        style.textContent = s.cssText;
        this.renderRoot.appendChild(style);
      });
    }
  }
  /**
   * Invoked on each update to perform rendering tasks. This method may return
   * any value renderable by lit-html's `NodePart` - typically a
   * `TemplateResult`. Setting properties inside this method will *not* trigger
   * the element to update.
   */
  render() {
    return renderNotImplemented;
  }
};
LitElement["finalized"] = true;
LitElement.render = render2;
LitElement.shadowRootOptions = { mode: "open" };

// lib/hex-grid.js
var HEX_ANGLES = new Array(6).fill(0).map((x, i) => 2 * Math.PI * (i + 0.5) / 6);
var HEX_ANGLES_COS = HEX_ANGLES.map((x) => Math.cos(x));
var HEX_ANGLES_SIN = HEX_ANGLES.map((x) => Math.sin(x));
var HEX_ADJACENT = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
function renderHexPath(id, shape, style = {}) {
  let { cx, cy, r } = shape;
  let { fill = "whitesmoke", opacity = 1 } = style;
  let corners = HEX_ANGLES.map((x) => [r * Math.cos(x) + cx, r * Math.sin(x) + cy]);
  let coords = corners.map((x) => x.join(","));
  let d = `M${coords[0]} ${coords.join("L ")} Z`;
  return svg`<path class="hex" data-id="${id}" d="${d}"
    style="opacity: ${opacity}; fill: ${fill}"></path>`;
}
function renderEdgePath(id, shape, style = {}) {
  let { x0, y0, x1, y1 } = shape;
  let { stroke = "lightgray", strokeWidth = 1 } = style;
  return svg`
    <line class="edge" data-id="${id}" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${stroke}"
      stroke-width="${strokeWidth}"></line>
  `;
}
function renderCorner(id, shape, style = {}) {
  let { cx, cy, r } = shape;
  let { fill = "lightgray" } = style;
  return svg`
    <circle class="corner" data-id="${id}" cx="${cx}" cy="${cy}" r="${r}"
       style="fill: ${fill}"></line>
  `;
}
function commaCount(x) {
  let result = 0;
  for (let i = 0; i < x.length; i++) {
    if (x[i] == ",") result++;
  }
  return result;
}
function isValidCoord(ns, i, j) {
  return !(i + j < ns - 1 || i + j > 2 * ns + Math.ceil(ns / 2) - 1);
}
function validHexCoords(ns) {
  let result = [];
  for (let i = 0; i < 2 * ns - 1; i++) {
    for (let j = 0; j < 2 * ns - 1; j++) {
      if (!isValidCoord(ns, i, j)) continue;
      result.push([i, j]);
    }
  }
  return result;
}
function coordToId(coord) {
  return JSON.stringify(coord);
}
function validHalfedgeCoords(ns) {
  const allHalfedges = validHexCoords(ns).flatMap((x) => HEX_ANGLES.map((y, i) => [...x, i]));
  const canonicalIds = allHalfedges.map((x) => coordToId(canonicalHalfedge(x)));
  return Array.from(new Set(canonicalIds)).map((x) => JSON.parse(x));
}
function canonicalHalfedge(coord) {
  if (coord[2] < 3) return coord.length == 3 ? coord : coord.slice(0, 3);
  return halfedgeMirror(coord);
}
function validCoords(ns) {
  return [...validHexCoords(ns), ...validHalfedgeCoords(ns)];
}
function halfedgeMirror(coord) {
  switch (coord[2]) {
    case 0:
      return [coord[0], coord[1] + 1, 3];
    case 1:
      return [coord[0] - 1, coord[1] + 1, 4];
    case 2:
      return [coord[0] - 1, coord[1], 5];
    case 3:
      return [coord[0], coord[1] - 1, 0];
    case 4:
      return [coord[0] + 1, coord[1] - 1, 1];
    case 5:
      return [coord[0] + 1, coord[1], 2];
  }
}
function hexCenterXFunction(ns, r, margin = 0) {
  let dx = Math.cos(HEX_ANGLES[0]);
  let scale = r + margin;
  return (i, j) => scale * dx * (2 * i + j - ns + 2.5);
}
function hexCenterYFunction(ns, r, margin = 0) {
  let dy = Math.sin(HEX_ANGLES[0]) + 1;
  let scale = r + margin;
  return (i, j) => scale * (dy * j + 2) + 2 * margin;
}
var HexGrid = class extends LitElement {
  static get properties() {
    return {
      ns: { type: Number },
      margin: { type: Number },
      r: { type: Number },
      elementStyles: { type: Object },
      offsetX: { type: Number },
      offsetY: { type: Number }
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
    if (e.target.matches(".hex")) tileType = "hex";
    if (e.target.matches(".edge")) tileType = "edge";
    if (tileType) {
      let id = e.target.dataset.id;
      let detail = { id, coord: JSON.parse(id), tileType };
      this.dispatchEvent(new CustomEvent(`tile-${name}`, { detail }));
    }
  }
  onClick(e) {
    this.dispatchGenericMouseEvent(e, "click");
  }
  onMouseOver(e) {
    this.dispatchGenericMouseEvent(e, "mouseover");
  }
  onMouseOut(e) {
    this.dispatchGenericMouseEvent(e, "mouseout");
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
    return Array.from(new Set(this.validHexCoords.flatMap((x) => HEX_ANGLES.map((y, i) => this.coordToId(this.canonizeCorner([...x, i]))))));
  }
  get validHalfedgeCoords() {
    const allHalfedges = this.validHexCoords.flatMap((x) => HEX_ANGLES.map((y, i) => [...x, i]));
    const canonicalIds = allHalfedges.map((x) => this.coordToId(this.canonicalHalfedge(x)));
    return Array.from(new Set(canonicalIds)).map((x) => JSON.parse(x));
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
    return HEX_ADJACENT.map(([dx, dy]) => [coord[0] + dx, coord[1] + dy]);
  }
  hexAdjacentEdges(coord) {
    return HEX_ANGLES.map((x, i) => this.canonicalHalfedge([...coord, i]));
  }
  hexAdjacentHexInDirection(coord, i) {
    return this.halfedgeMirror([...coord, i]).slice(0, 2);
  }
  halfedgesAdjacentEdges(coord) {
    let mirror = this.halfedgeMirror(coord);
    return [
      this.halfedgeNext(coord),
      this.halfedgePrev(mirror),
      this.halfedgePrev(coord),
      this.halfedgeNext(mirror)
    ].map((x) => this.canonicalHalfedge(x));
  }
  edgeAdjacentHexes(coord) {
    let mirror = this.halfedgeMirror(coord);
    return [coord.slice(0, 2), mirror.slice(0, 2)];
  }
  cornerAdjacentEdges(coord) {
    let prev = this.halfedgePrev(coord);
    let nextMirror = this.halfedgeNext(this.halfedgeMirror(coord));
    return [coord, prev, nextMirror].map((x) => this.canonicalHalfedge(x));
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
    let { ns, r, margin = 0, offsetX = 0 } = this;
    let inner = hexCenterXFunction(ns, r, margin);
    return (i, j) => inner(i, j) + offsetX;
  }
  get hexCenterYFunction() {
    let { ns, r, margin = 0, offsetY = 0 } = this;
    let inner = hexCenterYFunction(ns, r, margin);
    return (i, j) => inner(i, j) + offsetY;
  }
  render() {
    let hexes = [];
    let { ns, r, margin = 0, elementStyles } = this;
    let scale = r + margin;
    let computeCX = this.hexCenterXFunction;
    let computeCY = this.hexCenterYFunction;
    for (let [i, j] of this.validHexCoords) {
      let cx = computeCX(i, j);
      let cy = computeCY(i, j);
      let shape = { cx, cy, r };
      let id = this.coordToId([i, j]);
      let style = this.elementStyles.get(id) || {};
      hexes.push(renderHexPath(id, shape, style));
    }
    let edges = [];
    for (let [i, j, k] of this.validHalfedgeCoords) {
      let cx = computeCX(i, j);
      let cy = computeCY(i, j);
      let x0 = cx + scale * HEX_ANGLES_COS[k];
      let y0 = cy + scale * HEX_ANGLES_SIN[k];
      let x1 = cx + scale * HEX_ANGLES_COS[(k + 1) % 6];
      let y1 = cy + scale * HEX_ANGLES_SIN[(k + 1) % 6];
      let shape = { x0, y0, x1, y1 };
      let id = this.coordToId([i, j, k]);
      let style = this.elementStyles.get(id) || {};
      style.strokeWidth = 2 * this.margin;
      edges.push(renderEdgePath(id, shape, style));
    }
    let corners = [];
    for (let id of this.validCornerIds) {
      let [i, j, k] = this.idToCoord(id);
      let cx = computeCX(i, j);
      let cy = computeCY(i, j);
      corners.push(renderCorner(id, {
        cx: cx + scale * HEX_ANGLES_COS[k],
        cy: cy + scale * HEX_ANGLES_SIN[k],
        r: this.margin
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
};
customElements.define("hex-grid", HexGrid);

// lib/hexa-slime-game.js
var PLAYER_COLOR_MAP = {
  "blue": {
    highlightColor: "cornflowerblue",
    hexColor: "rgb(50,50,150)",
    edgeColor: "blue"
  },
  "red": {
    highlightColor: "lightcoral",
    hexColor: "darkred",
    edgeColor: "red"
  },
  "dead": {
    highlightColor: "black",
    hexColor: "rgb(30,30,30)",
    edgeColor: "black"
  }
};
var GRID_NS = 5;
var GRID_R = 5;
var GRID_MARGIN = 1;
var HexaSlimeGame = class extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        background: darkslategray;
      }

      hex-grid {
        background: darkslategray;
      }

      #frame, hex-grid {
        height: 100vh;
        width: 100vh;
        position: relative;
      }

      #info {
        display: flex;
        width: 75pt;
        flex-direction: column;
        padding: 10pt;
        margin: 10pt;
        background: white;
        border-radius: 5pt;
        box-shadow: 0 0 10pt 0 rgba(0,0,0,0.8);
        position: sticky;
        left: 0;
        z-index: 1000;
      }

      .player-info {
        display: flex;
        justify-content: center;
        transition: opacity 0.2s, box-shadow 0.2s;
        box-shadow: none;
        opacity: 0.5;
        padding: 10pt 20pt;
        color: white;
        font-size: 15pt;
        border-radius: 5pt;
      }

      .player-info + .player-info {
        margin-top: 5pt;
      }

      .player-info.active {
        box-shadow: 0 2pt 4pt 0 rgba(0,0,0,0.5);
        opacity: 1;
      }

      .edge-bubble {
        display: flex;
        justify-content: center;
        align-items: center;
        flex-shrink: 0;
        width: 35pt;
        height: 35pt;
        border-radius: 100pt;
        box-sizing: border-box;
        transition: border 0.2s;
        border: none;
      }

      @keyframes flash {
        0% {opacity: 0}
        50% {opacity: 1}
        100% {opacity: 0}
      }

      .player-info.active .edge-bubble.active {
        border: 2pt solid white;
        animation: flash 1s infinite;
      }

      .heading {
        margin-bottom: 10pt; 
      }

      #wrapper {
        display: flex;
        justify-content: center;
        flex: 1;
      }

      .health-indicator {
        display: flex;
        font-size: 10pt;
        justify-content: center;
        align-items: center;
        background: white;
        position: absolute;
        border-radius: 20pt;
        width: 20pt;
        height: 20pt;
        z-index: 100;
        box-shadow: 0 2pt 4pt 0 rgba(0,0,0,0.5);
      }
    `;
  }
  static get properties() {
    return {
      hoverId: { type: String },
      players: { type: Array },
      currentPlayerIndex: { type: Number },
      clientIsPlayer: { type: Boolean }
    };
  }
  constructor() {
    super();
    this.restart();
  }
  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }
  restart() {
    let { hexGrid, players = [] } = this;
    this.turn = 0;
    this.elementDataMap = /* @__PURE__ */ new Map();
    for (let coord of validCoords(GRID_NS)) {
      this.elementDataMap.set(JSON.stringify(coord), { health: 0 });
    }
    this.playerData = players.map(() => ({ edgeCount: 0 }));
    this.requestUpdate();
  }
  getElementsForPlayer(target) {
    return Array.from(this.elementDataMap.entries()).filter(([id, entry]) => entry.player == target).map(([id, entry]) => id);
  }
  get currentPlayerData() {
    return this.playerData[this.currentPlayerIndex];
  }
  getElementData(id) {
    return this.elementDataMap.get(id) || {};
  }
  floodConnected(id) {
    let { hexGrid } = this;
    let result = /* @__PURE__ */ new Set();
    let visit = [id];
    let elementData = this.getElementData(id);
    if (!elementData.player || elementData.player == "dead") return result;
    while (visit.length) {
      let next = [];
      for (let visitId of visit) {
        if (this.getElementData(visitId).player != elementData.player) continue;
        if (result.has(visitId)) continue;
        result.add(visitId);
        let coord = hexGrid.idToCoord(visitId);
        if (hexGrid.isHexId(visitId)) {
          let adjacentEdges = hexGrid.hexAdjacentEdges(coord);
          for (let i = 0; i < adjacentEdges.length; i++) {
            let adjacent = adjacentEdges[i];
            next.push(adjacent);
            let adjacentId = hexGrid.coordToId(adjacent);
            if (!this.getElementData(adjacentId).player) {
              next.push(hexGrid.hexAdjacentHexInDirection(coord, i));
            }
          }
        } else if (hexGrid.isEdgeId(visitId)) {
          for (let adjacent of hexGrid.halfedgesAdjacentEdges(coord)) {
            next.push(adjacent);
          }
          for (let adjacent of hexGrid.edgeAdjacentHexes(coord)) {
            next.push(adjacent);
          }
        }
      }
      visit = next.map((x) => hexGrid.coordToId(x));
    }
    return result;
  }
  get hexData() {
    const { hexGrid } = this;
    return hexGrid.validHexCoords.map(
      (coord) => this.elementDataMap.get(hexGrid.coordToId(coord))
    );
  }
  checkGameOver() {
    let { hexData } = this;
    for (let data of hexData) if (!data.player) return false;
    let uniquePlayers = new Set(hexData.map((x) => x.player).filter((player) => player != "dead"));
    if (uniquePlayers.size > 1) return false;
    return Array.from(uniquePlayers);
  }
  decrementAllHealth() {
    let { hexGrid } = this;
    let seen = /* @__PURE__ */ new Set();
    for (let coord of hexGrid.validHexCoords) {
      let id = hexGrid.coordToId(coord);
      if (seen.has(id)) continue;
      let component = this.floodConnected(id);
      let allComponentData = Array.from(component).map((id2) => this.getElementData(id2));
      let maxHealth = Math.max(...allComponentData.map((x) => x.health));
      for (let data of allComponentData) {
        data.health = maxHealth;
      }
      let hexComponentData = Array.from(component).filter((x) => hexGrid.isHexId(x)).map((x) => this.getElementData(x));
      for (let componentId of component) {
        seen.add(componentId);
        let data = this.getElementData(componentId);
        let nextHealth = data.player == this.currentPlayer ? data.health - 1 : data.health;
        data.health = Math.min(nextHealth, hexComponentData.length);
        if (data.health < 0) data.player = "dead";
      }
      let maxTurn = Math.max(...hexComponentData.map((x) => x.claimTurn));
      for (let data of hexComponentData) {
        data.showHealth = maxTurn == data.claimTurn;
      }
    }
  }
  nextTurn() {
    this.currentPlayerData.usingEdge = false;
    this.decrementAllHealth();
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    this.currentPlayerData.edgeCount += 1;
    this.turn++;
    let winners = this.checkGameOver();
    if (winners) {
      this.dispatchEvent(new CustomEvent("game-over", { detail: { winners } }));
      return;
    }
    this.dispatchEvent(new CustomEvent(
      "next-turn",
      { detail: { currentPlayer: this.players[this.currentPlayerIndex] } }
    ));
    if (!this.getClickableEdgeIdsForCurrentPlayer().length && this.hexData.every((data) => data.player)) {
      this.nextTurn();
    }
  }
  getClickableEdgeIds() {
    if (!this.clientIsPlayer) return [];
    return this.getClickableEdgeIdsForCurrentPlayer();
  }
  getClickableEdgeIdsForCurrentPlayer() {
    let { hexGrid } = this;
    let elements = this.getElementsForPlayer(this.currentPlayer).map((x) => hexGrid.idToCoord(x));
    let hexes = elements.filter((x) => x.length == 2);
    let edges = elements.filter((x) => x.length == 3);
    return [
      ...hexes.flatMap((x) => hexGrid.hexAdjacentEdges(x)),
      ...edges.flatMap((x) => hexGrid.halfedgesAdjacentEdges(x))
    ].map((x) => hexGrid.coordToId(x)).filter((id) => {
      let elementData = this.elementDataMap.get(id);
      if (!elementData) return false;
      return !elementData.player;
    });
  }
  get hexGrid() {
    return this.shadowRoot.querySelector("hex-grid");
  }
  onTileClick(e) {
    if (!this.clientIsPlayer) return;
    this.processTileClick(e.detail);
    this.dispatchEvent(new CustomEvent(
      "tile-click",
      { detail: e.detail, bubbles: true, composed: true }
    ));
  }
  processTileClick(detail) {
    let { id, tileType } = detail;
    let data = this.elementDataMap.get(id);
    let clickableEdges = this.getClickableEdgeIdsForCurrentPlayer();
    if (tileType == "edge" && !new Set(clickableEdges).has(detail.id)) return;
    if (tileType == "hex" && (data.player || this.currentPlayerData.usingEdge)) return;
    data.player = this.currentPlayer;
    data.claimTurn = this.turn;
    if (detail.tileType == "hex") {
      this.incrementComponentHealth(id);
      this.nextTurn();
    } else if (detail.tileType == "edge") {
      this.currentPlayerData.edgeCount--;
      this.currentPlayerData.usingEdge = true;
      if (this.currentPlayerData.edgeCount <= 0 || !clickableEdges.length) {
        this.nextTurn();
      }
    }
    this.requestUpdate();
  }
  incrementComponentHealth(id) {
    let { hexGrid } = this;
    let component = Array.from(this.floodConnected(id));
    let componentSize = component.filter((id2) => hexGrid.isHexId(id2)).length;
    let data = component.map((id2) => this.getElementData(id2));
    for (let x of data) x.health = componentSize + 1;
  }
  setHoverId(newId) {
    this.hoverId = null;
    if (this.clientIsPlayer) {
      this.hoverId = newId;
    }
  }
  onTileMouseOver(e) {
    let { id, coord, tileType } = e.detail;
    if (tileType == "hex" && this.currentPlayerData.usingEdge) return;
    this.setHoverId(id);
  }
  onTileMouseOut(e) {
    this.setHoverId(null);
  }
  renderElementStyles() {
    let elementStyles = /* @__PURE__ */ new Map();
    let { hexGrid } = this;
    if (!hexGrid) return elementStyles;
    let { elementDataMap } = this;
    function isFilledCorner(coord) {
      let adjacent = hexGrid.cornerAdjacentEdges(coord).map((x) => (elementDataMap.get(hexGrid.coordToId(x)) || {}).player).filter((x) => x);
      if (adjacent.length < 2) return;
      if (adjacent[0] == adjacent[1]) return adjacent[0];
      if (adjacent[1] == adjacent[2]) return adjacent[1];
      if (adjacent[2] == adjacent[0]) return adjacent[2];
    }
    let clickableEdges = new Set(this.getClickableEdgeIds());
    for (let coord of hexGrid.validCoords) {
      let id = hexGrid.coordToId(coord);
      let style = {};
      if (clickableEdges.has(id)) {
        style.stroke = "gray";
      }
      if (id == this.hoverId && this.currentPlayer) {
        style.fill = PLAYER_COLOR_MAP[this.currentPlayer].highlightColor;
        style.stroke = PLAYER_COLOR_MAP[this.currentPlayer].highlightColor;
      }
      if (hexGrid.isEdgeId(id) && !clickableEdges.has(id)) {
        delete style.fill;
        delete style.stroke;
      }
      let elementPlayer = this.elementDataMap.get(id).player;
      if (elementPlayer) {
        style.fill = PLAYER_COLOR_MAP[elementPlayer].hexColor;
        style.stroke = PLAYER_COLOR_MAP[elementPlayer].edgeColor;
      }
      elementStyles.set(id, style);
    }
    for (let id of hexGrid.validCornerIds) {
      let coord = hexGrid.idToCoord(id);
      let elementPlayer = isFilledCorner(coord);
      if (elementPlayer) {
        let style = {};
        style.fill = PLAYER_COLOR_MAP[elementPlayer].edgeColor;
        elementStyles.set(id, style);
      }
    }
    return elementStyles;
  }
  renderPlayerData(data, i) {
    let playerColors = PLAYER_COLOR_MAP[this.players[i]];
    let divStyle = `
      background: ${playerColors.edgeColor};
    `;
    const activeClass = i === this.currentPlayerIndex ? "active" : "";
    const edgeClass = this.currentPlayerData.usingEdge ? "active" : "";
    return html`
      <div class="player-info ${activeClass}" style="${divStyle}">
        <div class="edge-bubble ${edgeClass}">${data.edgeCount}</div>
      </div>
    `;
  }
  render() {
    let hexCenterX = hexCenterXFunction(GRID_NS, GRID_R, GRID_MARGIN);
    let hexCenterY = hexCenterYFunction(GRID_NS, GRID_R, GRID_MARGIN);
    let elementStyles = this.renderElementStyles();
    let healthIndicators = Array.from(this.elementDataMap.entries()).map(([id, entry]) => {
      if (!entry.showHealth || entry.player == "dead") return;
      let coord = JSON.parse(id);
      let style = `
          left: calc(${hexCenterX(...coord)}% - 10pt);
          top: calc(${hexCenterY(...coord)}% - 10pt);
        `;
      return html`<div class="health-indicator" style="${style}">${entry.health}</div>`;
    }).filter((x) => x);
    return html`
      <div id="info">
        <div class="heading">Edge Counts</div>
        ${this.playerData.map(this.renderPlayerData.bind(this))}
      </div>
      <div id="wrapper">
        <div id="frame">
          ${healthIndicators}
          <hex-grid ns=${GRID_NS} r=${GRID_R} margin=${GRID_MARGIN} .elementStyles=${elementStyles}
              @tile-click=${this.onTileClick}
              @tile-mouseover=${this.onTileMouseOver}
              @tile-mouseout=${this.onTileMouseOut}
            ></hex-grid>
        </div>
     </div>
    `;
  }
};
customElements.define("hexa-slime-game", HexaSlimeGame);

// lib/main.js
var ModalFrame = class extends LitElement {
  static get properties() {
    return {
      show: { type: Boolean }
    };
  }
  static get styles() {
    return css`
      #shade {
        position: fixed;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.8);
        transition: background 0.2s;
        z-index: 2000;
      }

      #shade.hidden {
        pointer-events: none;
        background: transparent;
      }

      #wrapper {
        height: 80%;
        width: 70%;
        background: white;
        border-radius: 20pt;
        box-shadow: 0 0 10pt 0 black;
        position: fixed;
        top: 10%;
        left: 15%;
        padding: 20pt;
        box-sizing: border-box;

        display: flex;
        flex-direction: column;
        justify-content: space-between;
        transition: opacity 0.2s;
        opacity: 1;
      }

      .hidden #wrapper {
        opacity: 0;
      }
    `;
  }
  render() {
    let showClass = this.show ? "" : "hidden";
    return html`
      <div id="shade" class="${showClass}">
        <div id="wrapper"><slot></slot>
        </div>
      </div>`;
  }
};
customElements.define("modal-frame", ModalFrame);
var HexaSlimeGameManager = class extends LitElement {
  static get properties() {
    return {
      showModal: { type: Boolean },
      winners: { type: Array },
      peerId: { type: String },
      serverId: { type: String },
      connectedServerId: { type: String },
      connectedPeerIds: { type: Array },
      currentPlayer: { type: String },
      players: { type: Array }
    };
  }
  static get styles() {
    return css`
      :host {
        font-weight: lighter;
      }

      button {
        font-size: 20pt;
        padding: 0 15pt;
        border: 1pt solid gray;
        box-shadow: none;
        transition: box-shadow 0.2s;
        cursor: pointer;
        border-radius: 50pt;
        font-weight: lighter;
        outline: none;
      }

      button + button {
        margin-top: 10pt;
      }

      button:hover {
        color: white;
        background: dimgray;
      }

      hex-grid {
        flex: 1;
      }

      #intro {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      #instructions {
        overflow-y: auto;
        box-shadow: 0 0 8pt 0 rgba(0,0,0,0.2) inset;
        padding: 0 10pt;
        padding-bottom: 10pt;
        margin-bottom: 20pt;
      }

      input {
        width: 100%;
        border: 1pt solid gray;
        font-size: 20pt;
        border-radius: 100pt;
        padding: 5pt 20pt;
        outline: none;
        margin-bottom: 20pt;
      }

      #player-list {
        margin-bottom: 20pt;
      }

      .message {
        margin-top: 10pt;
      }

      #colored-characters span:nth-child(odd) {
        color: blue;
      }

      #colored-characters span:nth-child(even) {
        color: red;
      }
    `;
  }
  constructor() {
    super();
    this.showModal = "intro";
    this.players = ["red", "blue"];
  }
  get game() {
    return this.shadowRoot.querySelector("hexa-slime-game");
  }
  startLocalGame() {
    let game = this.game;
    game.players = this.players;
    game.restart();
    this.showModal = false;
    this.gameMode = "local";
  }
  startNetworkGame() {
    this.startAsClient(this.players[0]);
    this.currentPlayer = this.players[0];
    this.dispatchEvent(new CustomEvent("server-start"));
  }
  startAsClient(player) {
    let game = this.game;
    game.players = this.players;
    this.gameMode = "network";
    game.restart();
    this.showModal = false;
    this.clientPlayer = player;
  }
  renderModal() {
    if (!this.showModal) return null;
    switch (this.showModal) {
      case "intro":
        return this.renderIntro();
      case "game-over":
        return this.renderGameOver();
      case "network-server":
        return this.renderServerGame();
      case "network-client":
        return this.renderClientGame();
    }
    return null;
  }
  returnToIntro() {
    this.showModal = "intro";
  }
  renderGameOver() {
    let winners = this.winners || [];
    let heading = winners.length ? "WINNER" : "NO WINNERS";
    let elementStyles = /* @__PURE__ */ new Map();
    let player = winners[0] || "dead";
    elementStyles.set("[0,0]", {
      fill: PLAYER_COLOR_MAP[player].hexColor,
      stroke: PLAYER_COLOR_MAP[player].edgeColor
    });
    return html`
      <h1 style="align-self: center">${heading}</h1>
      <hex-grid r=30 ns=1 margin=5 .elementStyles="${elementStyles}"
        .offsetX="${5}" .offsetY="${-30}"></hex-grid>
      <button @click="${this.returnToIntro}">RETURN TO INTRO</button>
    `;
  }
  configureNetworkGame() {
    this.showModal = "network-server";
  }
  handleRemoteTileClick(detail) {
    this.game.processTileClick(detail);
  }
  renderIntro() {
    return html`
      <div id="intro">
        <h1><span id="colored-characters"><span>H</span><span>E</span><span>X</span><span>A</span></span>SLIME</h1>

        <div id="instructions">
        <h3>INTRO</h3>
        Dr. Slimentist was working late in his lab one night and created
        sentient slime blobs in this giant novelty, hexagonally tiled petri
        dish gifted to him by his Aunt Bertrude for Christmas. He watches on in
        fascination as the slimes struggle to keep themselves alive.

        <h3>RULES</h3>
        Each turn, you may take one of two actions:
        <ul>
          <li>Click on a hex tile to claim it.</li>
          <li>Click on a edges to claim them. Edges must be adjacent to hexes
          or edges that you already own. If you choose to do this, you must
          claim the number of edges associated with your color on the left if
          there are available unclaimed edges.</li>
          <li>You gain one usable edge per turn.</li>
        </ul>

        Connected hexes and edges make blobs:
        <ul>
          <li> Two adjacent hexes of the same color are connected if the edge
            between them is claimed by the same player or is unclaimed.</li>
          <li> A hex is connected to an edge if the edge is one of the hex's
            edges.</li>
          <li> Edges are connected if they share a corner.</li>
        </ul>

        Keep your blobs alive:
        <ul>
          <li>Each blob has health that decreases every round.</li>
          <li>When a blob's health drops below zero, it dies. </li>
          <li>A blob's health is shown by a number on the newest hex in the
            blob.</li>
          <li>When a blob gets an additional hex, it's health increases to the
            number of hexes that compose it.</li>
          <li>Blobs may not have more health than the number of hexes that
          compose it. This means that splitting blobs can make them lose
          health.</li>
          <li> Two blobs connected by an edge will take on the maximum health
            between them.</li>
        </ul>

        Win the game:
        <ul>
          <li>The player with the last living blob on the field wins.</li>
          <li>If there are no living blobs, there is no winner.</li>
        </ul>

        </div>
        <button @click="${this.startLocalGame}">START LOCAL GAME</button>
        <button @click="${this.configureGameAsServer}">NETWORK GAME AS SERVER</button>
        <button @click="${this.configureGameAsClient}">NETWORK GAME AS CLIENT</button>
      </div>
    `;
  }
  configureGameAsServer() {
    this.showModal = "network-server";
    this.dispatchEvent(new CustomEvent("server-setup"));
    this.isServer = true;
  }
  configureGameAsClient() {
    this.showModal = "network-client";
    this.isServer = false;
  }
  updateServerId(e) {
    this.serverId = e.target.value;
  }
  connectToServer() {
    if (this.serverId && this.serverId != this.peerId) {
      this.dispatchEvent(new CustomEvent("server-connect", { detail: { serverId: this.serverId } }));
    }
  }
  renderServerGame() {
    let peerId = this.peerId || "[Loading...]";
    let emptyMessage = !this.connectedPeerIds || !this.connectedPeerIds.length ? "[No Players Connected]" : "";
    return html`
      <h1>NETWORK GAME AS SERVER</h1>
      <div>
        <p>Your server id is <b>${peerId}</b>. Send this
        value to other players to connect to your machine</p>
        <h3>CONNECTED PLAYERS</h3>
        <div id="player-list">
          ${emptyMessage} 
          ${(this.connectedPeerIds || []).map((id) => html`<b>${id}</b>`)}
        </div>
        <button @click="${this.startNetworkGame}">START NETWORK GAME</button>
      </div>
      <button @click="${this.returnToIntro}">RETURN TO INTRO</button>
    `;
  }
  renderCurrentServerConnection() {
    if (!this.connectedServerId) return null;
    return html`<div class="message">Connected to server <b>${this.connectedServerId}</b></div>`;
  }
  renderClientGame() {
    return html`
      <h1>NETWORK GAME AS CLIENT</h1>
      <div>
        <p>Your id is <b>${this.peerId}</b>. Ask for the serving player's server id
        and enter it below.</p>
        <input value="${this.serverId || ""}" @input="${this.updateServerId}"></input>
        <button @click="${this.connectToServer}">CONNECT TO SERVER</button>
        ${this.renderCurrentServerConnection()}
      </div>
      <button @click="${this.returnToIntro}">RETURN TO INTRO</button>
    `;
  }
  onGameOver(e) {
    this.winners = e.detail.winners;
    this.showModal = "game-over";
  }
  onNextTurn(e) {
    this.currentPlayer = e.detail.currentPlayer;
  }
  render() {
    let clientIsPlayer = this.gameMode == "local" || this.clientPlayer && this.currentPlayer == this.clientPlayer;
    return html`
      <modal-frame .show=${this.showModal}>
        ${this.renderModal()}
      </modal-frame>
      <hexa-slime-game currentPlayerIndex=0 .players="${this.players}"
        @game-over=${this.onGameOver} @next-turn="${this.onNextTurn}"
        .clientIsPlayer="${clientIsPlayer}"></hexa-slime-game>
    `;
  }
};
customElements.define("hexa-slime-game-manager", HexaSlimeGameManager);
/*! Bundled license information:

lit-html/lib/dom.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/template.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/modify-template.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/directive.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/part.js:
  (**
   * @license
   * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/template-instance.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/template-result.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/parts.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/template-factory.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/render.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/default-template-processor.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lit-html.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-html/lib/shady-render.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-element/lib/updating-element.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-element/lib/decorators.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)

lit-element/lib/css-tag.js:
  (**
  @license
  Copyright (c) 2019 The Polymer Project Authors. All rights reserved.
  This code may only be used under the BSD style license found at
  http://polymer.github.io/LICENSE.txt The complete set of authors may be found at
  http://polymer.github.io/AUTHORS.txt The complete set of contributors may be
  found at http://polymer.github.io/CONTRIBUTORS.txt Code distributed by Google as
  part of the polymer project is also subject to an additional IP rights grant
  found at http://polymer.github.io/PATENTS.txt
  *)

lit-element/lit-element.js:
  (**
   * @license
   * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
   * This code may only be used under the BSD style license found at
   * http://polymer.github.io/LICENSE.txt
   * The complete set of authors may be found at
   * http://polymer.github.io/AUTHORS.txt
   * The complete set of contributors may be found at
   * http://polymer.github.io/CONTRIBUTORS.txt
   * Code distributed by Google as part of the polymer project is also
   * subject to an additional IP rights grant found at
   * http://polymer.github.io/PATENTS.txt
   *)
*/
//# sourceMappingURL=main.js.map
