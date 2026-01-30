!function(){"use strict";function e(e,t,i,s){var o,r=arguments.length,a=r<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,i,s);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(a=(r<3?o(a):r>3?o(t,i,a):o(t,i))||a);return r>3&&a&&Object.defineProperty(t,i,a),a}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let r=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=o.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(t,e))}return e}toString(){return this.cssText}};const a=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[s+1],e[0]);return new r(i,e,s)},n=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new r("string"==typeof e?e:e+"",void 0,s))(t)})(e):e,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:_}=Object,g=globalThis,u=g.trustedTypes,m=u?u.emptyScript:"",v=g.reactiveElementPolyfillSupport,f=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?m:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},y=(e,t)=>!l(e,t),x={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(e,i,t);void 0!==s&&c(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){const{get:s,set:o}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:s,set(t){const r=s?.call(this);o?.call(this,t),this.requestUpdate(e,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=_(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...h(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,s)=>{if(i)e.adoptedStyleSheets=s.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of s){const s=document.createElement("style"),o=t.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=i.cssText,e.appendChild(s)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(t,i.type);this._$Em=e,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(e,t){const i=this.constructor,s=i._$Eh.get(e);if(void 0!==s&&this._$Em!==s){const e=i.getPropertyOptions(s),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:b;this._$Em=s;const r=o.fromAttribute(t,e.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(e,t,i,s=!1,o){if(void 0!==e){const r=this.constructor;if(!1===s&&(o=this[e]),i??=r.getPropertyOptions(e),!((i.hasChanged??y)(o,t)||i.useDefault&&i.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(r._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:s,wrapped:o},r){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,r??t??this[e]),!0!==o||void 0!==r)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===s&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,s=this[t];!0!==e||this._$AL.has(t)||void 0===s||this.C(t,void 0,i,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,v?.({ReactiveElement:$}),(g.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,C=e=>e,S=w.trustedTypes,k=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,P="$lit$",z=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+z,M=`<${E}>`,T=document,A=()=>T.createComment(""),I=e=>null===e||"object"!=typeof e&&"function"!=typeof e,q=Array.isArray,D="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,B=/>/g,j=RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),F=/'/g,L=/"/g,O=/^(?:script|style|textarea|title)$/i,N=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),H=Symbol.for("lit-noChange"),G=Symbol.for("lit-nothing"),W=new WeakMap,V=T.createTreeWalker(T,129);function Y(e,t){if(!q(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(t):t}const K=(e,t)=>{const i=e.length-1,s=[];let o,r=2===t?"<svg>":3===t?"<math>":"",a=U;for(let t=0;t<i;t++){const i=e[t];let n,l,c=-1,d=0;for(;d<i.length&&(a.lastIndex=d,l=a.exec(i),null!==l);)d=a.lastIndex,a===U?"!--"===l[1]?a=R:void 0!==l[1]?a=B:void 0!==l[2]?(O.test(l[2])&&(o=RegExp("</"+l[2],"g")),a=j):void 0!==l[3]&&(a=j):a===j?">"===l[0]?(a=o??U,c=-1):void 0===l[1]?c=-2:(c=a.lastIndex-l[2].length,n=l[1],a=void 0===l[3]?j:'"'===l[3]?L:F):a===L||a===F?a=j:a===R||a===B?a=U:(a=j,o=void 0);const h=a===j&&e[t+1].startsWith("/>")?" ":"";r+=a===U?i+M:c>=0?(s.push(n),i.slice(0,c)+P+i.slice(c)+z+h):i+z+(-2===c?t:h)}return[Y(e,r+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),s]};class X{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let o=0,r=0;const a=e.length-1,n=this.parts,[l,c]=K(e,t);if(this.el=X.createElement(l,i),V.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(s=V.nextNode())&&n.length<a;){if(1===s.nodeType){if(s.hasAttributes())for(const e of s.getAttributeNames())if(e.endsWith(P)){const t=c[r++],i=s.getAttribute(e).split(z),a=/([.?@])?(.*)/.exec(t);n.push({type:1,index:o,name:a[2],strings:i,ctor:"."===a[1]?te:"?"===a[1]?ie:"@"===a[1]?se:ee}),s.removeAttribute(e)}else e.startsWith(z)&&(n.push({type:6,index:o}),s.removeAttribute(e));if(O.test(s.tagName)){const e=s.textContent.split(z),t=e.length-1;if(t>0){s.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)s.append(e[i],A()),V.nextNode(),n.push({type:2,index:++o});s.append(e[t],A())}}}else if(8===s.nodeType)if(s.data===E)n.push({type:2,index:o});else{let e=-1;for(;-1!==(e=s.data.indexOf(z,e+1));)n.push({type:7,index:o}),e+=z.length-1}o++}}static createElement(e,t){const i=T.createElement("template");return i.innerHTML=e,i}}function Z(e,t,i=e,s){if(t===H)return t;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const r=I(t)?void 0:t._$litDirective$;return o?.constructor!==r&&(o?._$AO?.(!1),void 0===r?o=void 0:(o=new r(e),o._$AT(e,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(t=Z(e,o._$AS(e,t.values),o,s)),t}let J=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,s=(e?.creationScope??T).importNode(t,!0);V.currentNode=s;let o=V.nextNode(),r=0,a=0,n=i[0];for(;void 0!==n;){if(r===n.index){let t;2===n.type?t=new Q(o,o.nextSibling,this,e):1===n.type?t=new n.ctor(o,n.name,n.strings,this,e):6===n.type&&(t=new oe(o,this,e)),this._$AV.push(t),n=i[++a]}r!==n?.index&&(o=V.nextNode(),r++)}return V.currentNode=T,s}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}};class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,s){this.type=2,this._$AH=G,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Z(this,e,t),I(e)?e===G||null==e||""===e?(this._$AH!==G&&this._$AR(),this._$AH=G):e!==this._$AH&&e!==H&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>q(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==G&&I(this._$AH)?this._$AA.nextSibling.data=e:this.T(T.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,s="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=X.createElement(Y(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(t);else{const e=new J(s,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=W.get(e.strings);return void 0===t&&W.set(e.strings,t=new X(e)),t}k(e){q(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,s=0;for(const o of e)s===t.length?t.push(i=new Q(this.O(A()),this.O(A()),this,this.options)):i=t[s],i._$AI(o),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=C(e).nextSibling;C(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,s,o){this.type=1,this._$AH=G,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=G}_$AI(e,t=this,i,s){const o=this.strings;let r=!1;if(void 0===o)e=Z(this,e,t,0),r=!I(e)||e!==this._$AH&&e!==H,r&&(this._$AH=e);else{const s=e;let a,n;for(e=o[0],a=0;a<o.length-1;a++)n=Z(this,s[i+a],t,a),n===H&&(n=this._$AH[a]),r||=!I(n)||n!==this._$AH[a],n===G?e=G:e!==G&&(e+=(n??"")+o[a+1]),this._$AH[a]=n}r&&!s&&this.j(e)}j(e){e===G?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===G?void 0:e}}class ie extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==G)}}class se extends ee{constructor(e,t,i,s,o){super(e,t,i,s,o),this.type=5}_$AI(e,t=this){if((e=Z(this,e,t,0)??G)===H)return;const i=this._$AH,s=e===G&&i!==G||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,o=e!==G&&(i===G||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class oe{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Z(this,e)}}const re=w.litHtmlPolyfillSupport;re?.(X,Q),(w.litHtmlVersions??=[]).push("3.3.2");const ae=globalThis;let ne=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const s=i?.renderBefore??t;let o=s._$litPart$;if(void 0===o){const e=i?.renderBefore??null;s._$litPart$=o=new Q(t.insertBefore(A(),e),e,void 0,i??{})}return o._$AI(e),o})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return H}};ne._$litElement$=!0,ne.finalized=!0,ae.litElementHydrateSupport?.({LitElement:ne});const le=ae.litElementPolyfillSupport;le?.({LitElement:ne}),(ae.litElementVersions??=[]).push("4.2.2");const ce=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},de={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:y},he=(e=de,t,i)=>{const{kind:s,metadata:o}=i;let r=globalThis.litPropertyMetadata.get(o);if(void 0===r&&globalThis.litPropertyMetadata.set(o,r=new Map),"setter"===s&&((e=Object.create(e)).wrapped=!0),r.set(i.name,e),"accessor"===s){const{name:s}=i;return{set(i){const o=t.get.call(this);t.set.call(this,i),this.requestUpdate(s,o,e,!0,i)},init(t){return void 0!==t&&this.C(s,void 0,e,t),t}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];t.call(this,i),this.requestUpdate(s,o,e,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pe(e){return(t,i)=>"object"==typeof i?he(e,t,i):((e,t,i)=>{const s=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),s?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function _e(e){return pe({...e,state:!0,attribute:!1})}function ge(e,t){return(t,i,s)=>((e,t,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,i),i))(t,i,{get(){return(t=>t.renderRoot?.querySelector(e)??null)(this)}})}const ue=2,me=e=>(...t)=>({_$litDirective$:e,values:t});class ve{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}const fe=(e,t)=>{const i=e._$AN;if(void 0===i)return!1;for(const e of i)e._$AO?.(t,!1),fe(e,t);return!0},be=e=>{let t,i;do{if(void 0===(t=e._$AM))break;i=t._$AN,i.delete(e),e=t}while(0===i?.size)},ye=e=>{for(let t;t=e._$AM;e=t){let i=t._$AN;if(void 0===i)t._$AN=i=new Set;else if(i.has(e))break;i.add(e),we(t)}};function xe(e){void 0!==this._$AN?(be(this),this._$AM=e,ye(this)):this._$AM=e}function $e(e,t=!1,i=0){const s=this._$AH,o=this._$AN;if(void 0!==o&&0!==o.size)if(t)if(Array.isArray(s))for(let e=i;e<s.length;e++)fe(s[e],!1),be(s[e]);else null!=s&&(fe(s,!1),be(s));else fe(this,e)}const we=e=>{e.type==ue&&(e._$AP??=$e,e._$AQ??=xe)};class Ce extends ve{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,i){super._$AT(e,t,i),ye(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(fe(this,e),be(this))}setValue(e){if((e=>void 0===e.strings)(this._$Ct))this._$Ct._$AI(e,this);else{const t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}}class Se{}const ke=new WeakMap,Pe=me(class extends Ce{render(e){return G}update(e,[t]){const i=t!==this.G;return i&&void 0!==this.G&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),G}rt(e){if(this.isConnected||(e=void 0),"function"==typeof this.G){const t=this.ht??globalThis;let i=ke.get(t);void 0===i&&(i=new WeakMap,ke.set(t,i)),void 0!==i.get(this.G)&&this.G.call(this.ht,void 0),i.set(this.G,e),void 0!==e&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return"function"==typeof this.G?ke.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),ze=a`
  /* Base styles - follows HA haStyle patterns */
  :host {
    display: block;
    height: 100%;
    background-color: var(--primary-background-color);
    color: var(--primary-text-color);
    font-family: var(--ha-font-family-body, var(--paper-font-body1_-_font-family, Roboto, sans-serif));
    font-size: var(--ha-font-size-m, 14px);
    line-height: var(--ha-line-height-normal, 1.5);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* Fixed header - follows HA developer-tools pattern */
  .header {
    background-color: var(--app-header-background-color);
    color: var(--app-header-text-color, var(--text-primary-color));
    border-bottom: 1px solid var(--divider-color);
    position: fixed;
    top: 0;
    left: var(--mdc-drawer-width, 0px);
    right: 0;
    z-index: 4;
    padding-top: env(safe-area-inset-top, 0px);
  }

  :host([narrow]) .header {
    left: 0;
  }

  /* Toolbar - hamburger menu and title */
  .toolbar {
    display: flex;
    align-items: center;
    height: var(--header-height, 56px);
    padding: 0 12px;
    box-sizing: border-box;
  }

  .main-title {
    margin-left: 8px;
    font-size: 20px;
    font-weight: 400;
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* ha-tab-group - native HA tab component (same as Developer Tools) */
  ha-tab-group {
    --track-color: var(--divider-color);
    --indicator-color: var(--primary-color);
  }

  ha-tab-group-tab {
    --ha-tab-text-color: var(--secondary-text-color);
    --ha-tab-active-text-color: var(--wa-color-brand-on-quiet);
  }

  /* Content area with padding for fixed header */
  .content {
    padding: calc(var(--header-height, 56px) + 48px + 16px + env(safe-area-inset-top, 0px)) 16px 16px;
    max-width: 1200px;
    margin: 0 auto;
    box-sizing: border-box;
    min-height: 100vh;
  }

  /* HA scrollbar styling (from haStyleScrollbar) */
  ::-webkit-scrollbar {
    width: 0.4rem;
    height: 0.4rem;
  }

  ::-webkit-scrollbar-thumb {
    -webkit-border-radius: 4px;
    border-radius: 4px;
    background: var(--scrollbar-thumb-color, var(--divider-color));
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  /* Controls section - now using ha-card */
  ha-card.controls {
    padding: 16px;
    margin-bottom: 24px;
  }

  .control-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .control-row:last-child {
    margin-bottom: 0;
  }

  /* Desktop layout: Target and Favorites side by side */
  .target-favorites-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .target-favorites-grid .control-row {
    margin-bottom: 0;
  }

  @media (min-width: 768px) {
    .target-favorites-grid {
      grid-template-columns: 1fr 1fr;
    }
  }

  .control-label {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--secondary-text-color);
    line-height: var(--ha-line-height-condensed, 1.2);
  }

  .quick-controls-label {
    color: var(--secondary-text-color);
  }

  .control-input {
    width: 100%;
  }

  .control-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .control-buttons ha-button {
    flex: 1 1 auto;
    min-width: 140px;
  }

  .control-buttons ha-icon {
    margin-right: 4px;
  }

  /* Target input with selector and favorite button */
  .target-input {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;
    min-width: 0;
    width: 100%;
  }

  /* Target selector container */
  .target-selector {
    flex: 1;
    min-width: 200px;
  }

  .target-selector ha-selector {
    display: block;
    width: 100%;
  }

  .add-favorite-btn {
    --mdc-icon-button-size: 36px;
    color: var(--primary-color);
    flex-shrink: 0;
  }

  .add-favorite-btn:hover {
    color: var(--accent-color, var(--primary-color));
  }

  /* Favorite inline input */
  .favorite-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .favorite-input-container ha-selector {
    flex: 1;
    min-width: 150px;
  }

  .favorite-input-container ha-button {
    flex-shrink: 0;
  }

  .favorite-input-buttons {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  /* Light tile card container - uses HA grid patterns */
  .light-tile-container {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .light-tile-container hui-tile-card {
    --ha-card-background: var(--card-background-color);
    --ha-card-border-radius: var(--ha-card-border-radius, 12px);
    display: block;
    width: 100%;
  }

  /* Favorites container - compact grid layout */
  .favorites-container {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  @media (min-width: 768px) {
    .favorites-container {
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }
  }

  .favorite-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 8px 8px 8px;
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    cursor: pointer;
    transition: all 0.2s ease-in-out;
    position: relative;
    overflow: hidden;
  }

  .favorite-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--primary-color);
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
  }

  .favorite-button:hover::before {
    opacity: 0.08;
  }

  .favorite-button:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .favorite-button:active {
    transform: translateY(0);
  }

  .favorite-button.selected {
    border-color: var(--primary-color);
    border-width: 2px;
  }

  .favorite-button.selected::before {
    opacity: 0.12;
  }

  .favorite-button-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(var(--rgb-primary-color), 0.2);
    border-radius: var(--ha-card-border-radius, 10px);
    flex-shrink: 0;
    transition: all 0.2s ease-in-out;
    position: relative;
    z-index: 1;
  }

  .favorite-button-icon ha-icon {
    --mdc-icon-size: 24px;
    color: var(--primary-color);
  }

  .favorite-button:hover .favorite-button-icon {
    background: rgba(var(--rgb-primary-color), 0.3);
  }

  .favorite-button:hover .favorite-button-icon ha-icon {
    color: var(--primary-color);
  }

  .favorite-button-content {
    flex: 1;
    width: 100%;
    text-align: center;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  .favorite-button-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--primary-text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.3;
  }

  .favorite-button-count {
    font-size: 11px;
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  .favorite-button-remove {
    position: absolute;
    top: 4px;
    right: 4px;
    --mdc-icon-button-size: 28px;
    --mdc-icon-size: 16px;
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
    z-index: 2;
  }

  .favorite-button:hover .favorite-button-remove {
    opacity: 0.6;
  }

  .favorite-button-remove ha-icon {
    color: var(--primary-text-color);
  }

  .favorite-button:hover .favorite-button-remove ha-icon {
    color: var(--text-primary-color);
  }

  .favorite-button-remove:hover {
    opacity: 1 !important;
  }

  /* Favorite button states */
  .favorite-button.state-off .favorite-button-icon {
    opacity: 0.4;
  }

  .favorite-button.state-off .favorite-button-count {
    opacity: 0.6;
  }

  .favorite-button.state-unavailable .favorite-button-icon {
    opacity: 0.3;
    filter: grayscale(100%);
  }

  .favorite-button.state-unavailable .favorite-button-count {
    opacity: 0.5;
  }

  .favorite-button.state-on:hover .favorite-button-icon {
    filter: none;
  }

  .favorite-button.state-off:hover .favorite-button-icon {
    opacity: 1;
    filter: none;
  }

  .favorite-button.state-unavailable:hover .favorite-button-icon {
    opacity: 1;
    filter: none;
  }

  /* ha-expansion-panel styling for sections - follows HA patterns */
  ha-expansion-panel {
    --expansion-panel-content-padding: 0 16px 16px 16px;
    --ha-card-border-radius: var(--ha-card-border-radius, 12px);
    margin-bottom: 16px;
    display: block;
  }

  ha-expansion-panel[outlined] {
    border-radius: var(--ha-card-border-radius, 12px);
    border: 1px solid var(--divider-color);
    background: var(--card-background-color);
  }

  /* Expansion panel header styling */
  ha-expansion-panel .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    cursor: default;
    margin-bottom: 0;
    user-select: none;
    padding: 8px;
  }

  ha-expansion-panel .section-header-controls {
    margin-right: 0;
  }

  /* Expansion panel content - consistent 16px padding */
  ha-expansion-panel .section-content {
    padding: 0;
  }

  /* Controls content inside expansion panel - flex column layout instead of grid */
  ha-expansion-panel .section-content.controls-content {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  /* Legacy section styling for ha-card - follows HA patterns */
  ha-card.section {
    --ha-card-background: var(--card-background-color, var(--primary-background-color));
    --ha-card-border-radius: var(--ha-card-border-radius, 12px);
    padding: 16px;
    margin-bottom: 16px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    cursor: pointer;
    user-select: none;
  }

  .section-title {
    font-size: var(--ha-font-size-l, 18px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
  }

  .section-subtitle {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  .section-header-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* Sort dropdown - uses HA select styling patterns */
  .sort-select {
    padding: 6px 10px;
    font-size: var(--ha-font-size-s, 12px);
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-border-radius-sm, 4px);
    background: var(--card-background-color);
    color: var(--primary-text-color);
    cursor: pointer;
    min-width: 110px;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3e%3cpath d='M7 10l5 5 5-5z'/%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 4px center;
    background-size: 18px;
    padding-right: 24px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
  }

  .sort-select:hover {
    border-color: var(--primary-color);
  }

  .sort-select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
  }

  /* Preset grid - uses HA layout patterns */
  .section-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .section-content.collapsed {
    display: none;
  }

  /* Preset buttons - follows HA card interaction patterns */
  .preset-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: var(--card-background-color);
    border: 2px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    min-height: 80px;
    position: relative;
    overflow: hidden;
  }

  .preset-button::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--primary-color);
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
  }

  .preset-button:hover::before {
    opacity: 0.08;
  }

  .preset-button:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .preset-button:active {
    transform: translateY(0);
  }

  .preset-button.disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .preset-button.disabled:hover {
    border-color: var(--divider-color);
    transform: none;
    box-shadow: none;
  }

  .preset-button.disabled::before {
    opacity: 0;
  }

  .preset-name {
    font-size: var(--ha-font-size-s, 13px);
    font-weight: var(--ha-font-weight-medium, 500);
    text-align: center;
    margin-top: 8px;
    position: relative;
  }

  .preset-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .preset-icon img,
  .preset-icon svg {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }

  .preset-icon ha-icon {
    width: 100%;
    height: 100%;
    --mdc-icon-size: 32px;
  }

  /* Loading state - follows HA patterns */
  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
    font-size: var(--ha-font-size-m, 16px);
    color: var(--secondary-text-color);
  }

  /* HA native ha-alert component styling */
  ha-alert {
    display: block;
    margin-bottom: 16px;
  }

  .no-lights {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color);
    font-size: var(--ha-font-size-m, 14px);
  }

  ha-selector {
    display: block;
    width: 100%;
  }

  ha-slider {
    width: 100%;
  }

  /* Tab content area */
  .tab-content {
    min-height: 200px;
  }

  /* Editor form styles - now using ha-card, follows HA form patterns */
  ha-card.editor-form {
    padding: 16px;
  }

  .editor-form h2 {
    font-size: var(--ha-font-size-xl, 20px);
    font-weight: var(--ha-font-weight-medium, 500);
    margin: 0 0 8px 0;
    color: var(--primary-text-color);
  }

  .form-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-row:last-child {
    margin-bottom: 0;
  }

  .form-label {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    min-width: 120px;
    color: var(--secondary-text-color);
  }

  .form-hint {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    margin-top: -4px;
  }

  .form-input {
    flex: 1;
  }

  /* Vertical form section - label above content, left-aligned */
  .form-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .form-section .form-label {
    min-width: unset;
  }

  /* Brightness override section - vertical stacking */
  .brightness-override-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 16px;
  }

  .brightness-slider {
    padding-left: 0;
  }

  /* Two-column form row for Name/Icon on desktop */
  .form-row-pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-row-pair .form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-row-pair .form-field .form-label {
    min-width: unset;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color);
  }

  /* =========================================
   * UNIFORM COLOR PICKER STYLES
   * Standard variant: for color arrays (Effects, Gradient, Blocks, Sequence Steps)
   * Palette variant: for pattern-editor Individual mode (selectable fixed colors)
   * ========================================= */

  /* Color picker container */
  .color-picker-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  /* Individual color item wrapper */
  .color-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  /* Color swatch - 48px for good touch targets */
  .color-swatch {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid var(--divider-color);
    transition: all 0.2s ease;
  }

  .color-swatch:hover {
    transform: scale(1.05);
    border-color: var(--primary-color);
  }

  /* Hidden native input overlays the swatch */
  .color-swatch input[type="color"] {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    top: 0;
    left: 0;
    border: none;
    padding: 0;
  }

  /* Edit/Remove button below color swatch */
  .color-edit-btn {
    padding: 4px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .color-edit-btn:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
  }

  .color-edit-btn ha-icon {
    --mdc-icon-size: 16px;
  }

  /* Delete button variant */
  .color-remove {
    padding: 4px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .color-remove:hover {
    background: var(--error-color);
    color: white;
  }

  .color-remove ha-icon {
    --mdc-icon-size: 16px;
  }

  /* Invisible spacer to maintain alignment when delete button is hidden */
  .color-remove-spacer {
    height: 26px;
    visibility: hidden;
  }

  /* Add color button - matches color-item layout */
  .add-color-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    flex-shrink: 0;
  }

  .add-color-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border: 2px dashed var(--divider-color);
    border-radius: 8px;
    cursor: pointer;
    color: var(--secondary-text-color);
    background: transparent;
    transition: all 0.15s ease;
  }

  .add-color-btn:not(.disabled):hover .add-color-icon {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: var(--secondary-background-color);
  }

  .add-color-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* =========================================
   * PALETTE VARIANT
   * For pattern-editor Individual mode (selectable fixed colors)
   * ========================================= */

  /* Palette container */
  .color-palette {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  /* Palette color wrapper with edit button */
  .palette-color-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  /* Selectable palette swatch */
  .palette-color {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 3px solid var(--divider-color);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .palette-color:hover {
    transform: scale(1.08);
  }

  .palette-color.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color);
  }

  /* Small edit button below palette swatch */
  .palette-edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: var(--secondary-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
    --mdc-icon-size: 14px;
  }

  .palette-edit-btn:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
  }

  /* Color picker modal overlay */
  .color-picker-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .color-picker-modal {
    background: var(--card-background-color);
    border-radius: 8px;
    padding: 24px;
    width: 298px;
    max-width: calc(100vw - 80px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .color-picker-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .color-picker-modal-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .color-picker-modal-preview {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    border: 2px solid var(--divider-color);
  }

  .color-picker-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }

  /* Step list styles - follows HA list patterns */
  .step-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 12px;
    background: var(--card-background-color);
    border-radius: var(--ha-border-radius-sm, 8px);
    border: 1px solid var(--divider-color);
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-radius: 50%;
    font-size: var(--ha-font-size-s, 12px);
    font-weight: var(--ha-font-weight-medium, 600);
    flex-shrink: 0;
  }

  .step-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .step-row {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .step-field {
    flex: 1;
    min-width: 120px;
  }

  .step-field-label {
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .step-actions {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .step-actions ha-icon-button {
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 18px;
  }

  .add-step-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    border: 2px dashed var(--divider-color);
    border-radius: var(--ha-border-radius-sm, 8px);
    cursor: pointer;
    color: var(--secondary-text-color);
    transition: all 0.15s ease-in-out;
  }

  .add-step-btn:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: var(--secondary-background-color);
  }

  /* Segment grid editor - follows HA grid patterns */
  .segment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 4px;
    padding: 12px;
    background: var(--card-background-color);
    border-radius: var(--ha-border-radius-sm, 8px);
  }

  .segment-cell {
    aspect-ratio: 1;
    border-radius: var(--ha-border-radius-sm, 4px);
    cursor: pointer;
    border: 2px solid var(--divider-color);
    transition: all 0.15s ease-in-out;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ha-font-size-xs, 10px);
    font-weight: var(--ha-font-weight-medium, 600);
    color: var(--secondary-text-color);
  }

  .segment-cell:hover {
    transform: scale(1.1);
    z-index: 1;
  }

  .segment-cell.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color);
  }

  .segment-cell.colored {
    border-color: transparent;
  }

  .preset-type-tabs {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .preset-type-tab {
    padding: 8px 16px;
    border: 1px solid var(--divider-color);
    border-radius: 20px;
    background: transparent;
    cursor: pointer;
    font-size: var(--ha-font-size-s, 13px);
    color: var(--secondary-text-color);
    transition: all 0.15s ease-in-out;
  }

  .preset-type-tab:hover {
    background: var(--secondary-background-color);
  }

  .preset-type-tab.active {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
  }

  .preset-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Preset list item - follows HA list-item patterns */
  .preset-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--card-background-color);
    border-radius: var(--ha-border-radius-sm, 8px);
    border: 1px solid var(--divider-color);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .preset-list-item:hover {
    background: var(--secondary-background-color);
  }

  .preset-list-item-info {
    flex: 1;
  }

  .preset-list-item-name {
    font-weight: var(--ha-font-weight-medium, 500);
    font-size: var(--ha-font-size-m, 14px);
  }

  .preset-list-item-description {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    margin-top: 2px;
  }

  .preset-list-item-meta {
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  .preset-list-item-actions {
    display: flex;
    gap: 4px;
  }

  .preset-list-item-actions ha-icon-button {
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 18px;
  }

  .empty-state {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color);
  }

  .empty-state-icon {
    --mdc-icon-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-state-text {
    font-size: var(--ha-font-size-m, 14px);
  }

  /* Editor description */
  .editor-description {
    font-size: var(--ha-font-size-m, 14px);
    color: var(--secondary-text-color);
    margin-bottom: 24px;
    line-height: var(--ha-line-height-normal, 1.5);
  }

  /* Placeholder styles */
  .coming-soon {
    text-align: center;
    padding: 60px 20px;
    color: var(--secondary-text-color);
    background: var(--card-background-color);
    border-radius: var(--ha-card-border-radius, 12px);
    border: 2px dashed var(--divider-color);
    font-size: var(--ha-font-size-m, 14px);
  }

  /* Toolbar actions for export/import buttons */
  .toolbar-actions {
    display: flex;
    gap: 8px;
    margin: 16px 0;
  }

  .toolbar-actions mwc-button {
    --mdc-button-disabled-fill-color: var(--disabled-color);
    --mdc-theme-primary: var(--secondary-text-color);
    transition: all 0.2s ease;
  }

  .toolbar-actions mwc-button:not([disabled]):hover {
    --mdc-theme-primary: var(--primary-color);
  }

  .toolbar-actions mwc-button:not([disabled]):hover ha-icon {
    color: var(--primary-color);
  }

  .toolbar-actions mwc-button:not([disabled]):active {
    opacity: 0.9;
  }

  /* No presets empty state - follows HA empty state patterns */
  .no-presets {
    text-align: center;
    padding: 60px 20px;
    color: var(--secondary-text-color);
    background: var(--card-background-color);
    border-radius: var(--ha-card-border-radius, 12px);
  }

  .no-presets ha-icon {
    --mdc-icon-size: 48px;
    opacity: 0.5;
    margin-bottom: 16px;
    display: block;
  }

  .no-presets p {
    margin: 8px 0;
    font-size: var(--ha-font-size-m, 14px);
  }

  /* User preset button styling in Activate tab */
  .preset-button.user-preset {
    border-color: var(--primary-color);
    border-style: dashed;
    border-width: 2px;
  }

  .preset-button.user-preset:hover {
    border-style: solid;
  }

  /* My Presets management section content */
  .preset-management-content {
    display: block;
  }

  /* Preset grid for My Presets tab */
  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  /* User preset card with action buttons - follows HA card patterns */
  .user-preset-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: var(--card-background-color);
    border: 2px solid var(--divider-color);
    border-radius: var(--ha-card-border-radius, 12px);
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    min-height: 80px;
    overflow: hidden;
  }

  .user-preset-card::before {
    content: '';
    position: absolute;
    inset: 0;
    background: var(--primary-color);
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
  }

  .user-preset-card:hover::before {
    opacity: 0.08;
  }

  .user-preset-card:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: var(--ha-card-box-shadow, 0 4px 8px rgba(0, 0, 0, 0.1));
  }

  .user-preset-card:active {
    transform: translateY(0);
  }

  .user-preset-card.disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .user-preset-card.disabled:hover {
    border-color: var(--divider-color);
    transform: none;
    box-shadow: none;
  }

  .user-preset-card.disabled::before {
    opacity: 0;
  }

  .user-preset-card .preset-icon {
    font-size: 28px;
    margin-bottom: 8px;
    line-height: 1;
    position: relative;
    --mdc-icon-size: 28px;
  }

  .user-preset-card .preset-name {
    font-size: var(--ha-font-size-s, 12px);
    text-align: center;
    font-weight: var(--ha-font-weight-medium, 500);
    line-height: 1.2;
    word-break: break-word;
    max-width: 100%;
    position: relative;
  }

  /* Action buttons overlay */
  .preset-card-actions {
    position: absolute;
    top: 4px;
    right: 4px;
    display: flex;
    gap: 2px;
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
    background: rgba(0, 0, 0, 0.6);
    border-radius: var(--ha-border-radius-sm, 4px);
    padding: 2px;
    z-index: 1;
  }

  .user-preset-card:hover .preset-card-actions,
  .builtin-preset:hover .preset-card-actions {
    opacity: 1;
  }

  .preset-card-actions ha-icon-button {
    --mdc-icon-button-size: 28px;
    --mdc-icon-size: 16px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preset-card-actions ha-icon-button ha-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preset-card-actions ha-icon-button:hover {
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--ha-border-radius-sm, 4px);
  }

  /* Responsive styles - follows HA breakpoints */
  @media (max-width: 600px) {
    .content {
      padding: calc(var(--header-height, 56px) + 48px + 8px + env(safe-area-inset-top, 0px)) 8px 8px;
    }

    .toolbar {
      padding: 0 4px;
    }

    .main-title {
      font-size: 18px;
    }

    ha-tab-group-tab {
      font-size: 12px;
    }

    .light-tile-container {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 8px;
    }

    .section-content {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
    }

    .preset-button {
      padding: 8px;
      min-height: 60px;
    }

    .preset-name {
      font-size: var(--ha-font-size-xs, 11px);
    }

    /* Target selector takes full width on mobile */
    .target-selector {
      min-width: 100%;
    }

    /* Favorite input mobile - buttons below text field */
    .favorite-input-container {
      flex-direction: column;
      align-items: stretch;
    }

    .favorite-input-container ha-selector {
      width: 100%;
      min-width: unset;
    }

    .favorite-input-buttons {
      justify-content: flex-end;
    }
  }

  /* Mobile responsive form styles */
  @media (max-width: 600px) {
    .form-row {
      flex-direction: column;
      align-items: stretch;
    }

    .form-row-pair {
      grid-template-columns: 1fr;
    }

    .form-label {
      min-width: unset;
      margin-bottom: 4px;
    }

    .step-row {
      flex-direction: column;
    }

    .step-field {
      min-width: unset;
    }

    /* Sort dropdown mobile styles */
    .sort-select {
      min-width: 90px;
      font-size: var(--ha-font-size-xs, 11px);
      padding: 4px 20px 4px 6px;
    }

    .section-header-controls {
      gap: 4px;
    }

    .preset-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 8px;
    }

    .user-preset-card {
      padding: 8px;
      min-height: 60px;
    }

    .user-preset-card .preset-icon {
      font-size: 24px;
      margin-bottom: 4px;
      --mdc-icon-size: 24px;
    }

    .user-preset-card .preset-name {
      font-size: var(--ha-font-size-xs, 11px);
    }
  }

  /* HA dialog fullscreen on mobile - follows haStyleDialog */
  @media all and (max-width: 450px), all and (max-height: 500px) {
    ha-dialog {
      --mdc-dialog-min-width: calc(100vw - env(safe-area-inset-right) - env(safe-area-inset-left));
      --mdc-dialog-max-width: calc(100vw - env(safe-area-inset-right) - env(safe-area-inset-left));
      --mdc-dialog-min-height: 100%;
      --mdc-dialog-max-height: 100%;
      --vertical-align-dialog: flex-end;
      --ha-dialog-border-radius: 0;
    }
  }

  /* Version display in toolbar */
  .version-display {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
    margin-left: 8px;
    white-space: nowrap;
  }

  .version-display ha-icon {
    --mdc-icon-size: 14px;
  }

  .version-display .version-text {
    line-height: 1.3;
  }

  .version-display.version-mismatch {
    color: var(--warning-color);
  }

  /* Transition settings responsive grid - mobile first */
  .transition-settings-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }

  .transition-curve-column {
    border-bottom: 1px solid var(--divider-color);
  }

  .initial-brightness-column {
    display: flex;
    flex-direction: column;
  }

  .initial-brightness-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
  }

  .initial-brightness-content .form-section {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .initial-brightness-content .form-label {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--secondary-text-color);
    margin-bottom: 16px;
  }

  /* Desktop view - side by side layout */
  @media (min-width: 768px) {
    .transition-settings-grid {
      grid-template-columns: 1fr 1fr;
    }

    .transition-curve-column {
      border-bottom: none;
      border-right: 1px solid var(--divider-color);
    }
  }

  :host([narrow]) .transition-settings-grid {
    grid-template-columns: 1fr;
  }

  :host([narrow]) .transition-curve-column {
    border-right: none;
    border-bottom: 1px solid var(--divider-color);
  }

  /* Compatibility warning in editor tabs */
  .compatibility-warning {
    margin-bottom: 16px;
  }

  /* Dimming settings responsive grid - mobile first */
  .dimming-settings-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0;
  }

  .dimming-setting-item {
    border-bottom: 1px solid var(--divider-color);
  }

  .dimming-setting-item:last-child {
    border-bottom: none;
  }

  .dimming-setting-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .dimming-setting-content .form-label {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--secondary-text-color);
  }

  .entity-not-found {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
  }

  /* Desktop view - 2x2 grid layout for dimming settings */
  @media (min-width: 768px) {
    .dimming-settings-grid {
      grid-template-columns: 1fr 1fr;
    }

    .dimming-setting-item {
      border-bottom: 1px solid var(--divider-color);
    }

    .dimming-setting-item:nth-child(odd) {
      border-right: 1px solid var(--divider-color);
    }

    .dimming-setting-item:nth-last-child(-n+2) {
      border-bottom: none;
    }
  }

  :host([narrow]) .dimming-settings-grid {
    grid-template-columns: 1fr;
  }

  :host([narrow]) .dimming-setting-item {
    border-bottom: 1px solid var(--divider-color);
  }

  :host([narrow]) .dimming-setting-item:nth-child(odd) {
    border-right: none;
  }

  :host([narrow]) .dimming-setting-item:last-child {
    border-bottom: none;
  }

  /* Curve control styles for transition settings */
  .curve-control-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 12px;
  }

  .curve-control-info {
    flex: 1;
  }

  .curve-control-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .curve-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .legend-dot.fast-slow {
    background: var(--warning-color, #ffc107);
  }

  .legend-dot.linear {
    background: var(--success-color, #4caf50);
  }

  .legend-dot.slow-fast {
    background: var(--primary-color, #03a9f4);
  }

  /* Mobile: stack curve controls */
  @media (max-width: 767px) {
    .curve-control-row {
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }

    .curve-control-actions {
      justify-content: space-between;
    }

    .curve-legend {
      justify-content: center;
    }
  }

  /* Z2M Instances Grid Styles */
  .z2m-instances-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
    padding: 16px;
  }

  .z2m-instance-card {
    background: var(--card-background-color, var(--ha-card-background));
    border: 1px solid var(--divider-color);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .z2m-instance-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .z2m-instance-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .z2m-instance-name {
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
    word-break: break-word;
  }

  .z2m-instance-topic {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    word-break: break-word;
  }

  .z2m-instance-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .z2m-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 12px;
    min-width: 60px;
  }

  .z2m-stat-value {
    font-size: var(--ha-font-size-xl, 20px);
    font-weight: var(--ha-font-weight-bold, 600);
    color: var(--primary-color);
  }

  .z2m-stat-label {
    font-size: var(--ha-font-size-xs, 11px);
    color: var(--secondary-text-color);
    text-align: center;
    white-space: nowrap;
  }

  .z2m-devices-list {
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid var(--divider-color);
  }

  .z2m-devices-list details summary {
    user-select: none;
  }

  .z2m-devices-list details[open] summary {
    margin-bottom: 4px;
  }

  /* Mobile adjustments for Z2M instances */
  @media (max-width: 480px) {
    .z2m-instances-grid {
      grid-template-columns: 1fr;
      padding: 12px;
      gap: 12px;
    }

    .z2m-instance-stats {
      gap: 8px;
    }

    .z2m-stat {
      flex: 1;
      min-width: 50px;
      padding: 6px 8px;
    }
  }
`,Ee=a`
  /* =========================================
   * UNIFORM COLOR PICKER STYLES
   * Standard variant: for color arrays (Effects, Gradient, Blocks, Sequence Steps)
   * Palette variant: for pattern-editor Individual mode (selectable fixed colors)
   * ========================================= */

  /* Color picker container */
  .color-picker-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  /* Individual color item wrapper */
  .color-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  /* Color swatch - 48px for good touch targets */
  .color-swatch {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    cursor: pointer;
    border: 2px solid var(--divider-color);
    transition: all 0.2s ease;
  }

  .color-swatch:hover {
    transform: scale(1.05);
    border-color: var(--primary-color);
  }

  /* Hidden native input overlays the swatch */
  .color-swatch input[type="color"] {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    top: 0;
    left: 0;
    border: none;
    padding: 0;
  }

  /* Edit/Remove button below color swatch */
  .color-edit-btn {
    padding: 4px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .color-edit-btn:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
  }

  .color-edit-btn ha-icon {
    --mdc-icon-size: 16px;
  }

  /* Delete button variant */
  .color-remove {
    padding: 4px;
    background: var(--secondary-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .color-remove:hover {
    background: var(--error-color);
    color: white;
  }

  .color-remove ha-icon {
    --mdc-icon-size: 16px;
  }

  /* Invisible spacer to maintain alignment when delete button is hidden */
  .color-remove-spacer {
    height: 26px;
    visibility: hidden;
  }

  /* Add color button - matches color-item layout */
  .add-color-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 4px;
    flex-shrink: 0;
  }

  .add-color-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border: 2px dashed var(--divider-color);
    border-radius: 8px;
    cursor: pointer;
    color: var(--secondary-text-color);
    background: transparent;
    transition: all 0.15s ease;
  }

  .add-color-btn:not(.disabled):hover .add-color-icon {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: var(--secondary-background-color);
  }

  .add-color-btn.disabled {
    opacity: 0.4;
    cursor: not-allowed;
    pointer-events: none;
  }

  /* =========================================
   * PALETTE VARIANT
   * For pattern-editor Individual mode (selectable fixed colors)
   * ========================================= */

  /* Palette container */
  .color-palette {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
  }

  /* Palette color wrapper with edit button */
  .palette-color-wrapper {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  /* Selectable palette swatch */
  .palette-color {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 3px solid var(--divider-color);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .palette-color:hover {
    transform: scale(1.08);
  }

  .palette-color.selected {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px var(--primary-color);
  }

  /* Small edit button below palette swatch */
  .palette-edit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    border-radius: 50%;
    background: var(--secondary-background-color);
    color: var(--secondary-text-color);
    cursor: pointer;
    padding: 0;
    transition: all 0.15s ease;
    --mdc-icon-size: 14px;
  }

  .palette-edit-btn:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
  }

  /* Color picker modal overlay */
  .color-picker-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .color-picker-modal {
    background: var(--card-background-color);
    border-radius: 8px;
    padding: 24px;
    width: 298px;
    max-width: calc(100vw - 80px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }

  .color-picker-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .color-picker-modal-title {
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .color-picker-modal-preview {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    border: 2px solid var(--divider-color);
  }

  .color-picker-value-display {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    font-family: var(--code-font-family, monospace);
    color: var(--primary-text-color);
    text-align: center;
    padding: 8px 16px;
    background: var(--secondary-background-color);
    border-radius: var(--ha-border-radius-sm, 4px);
    letter-spacing: 0.5px;
  }

  .color-picker-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 20px;
  }

  /* =========================================
   * COLOR HISTORY
   * Recent colors swatches shown in color picker modals
   * ========================================= */

  .color-history-section {
    margin: 16px 0 0;
    width: 100%;
  }

  .color-history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .color-history-label {
    font-size: var(--ha-font-size-s, 12px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--secondary-text-color);
  }

  .color-history-clear {
    background: none;
    border: none;
    color: var(--secondary-text-color);
    cursor: pointer;
    font-size: var(--ha-font-size-s, 12px);
    padding: 2px 6px;
    border-radius: 4px;
    transition: all 0.15s ease;
  }

  .color-history-clear:hover {
    color: var(--primary-color);
    background: var(--secondary-background-color);
  }

  .color-history-swatches {
    display: flex;
    gap: 6px;
  }

  .color-history-swatch {
    width: 32px;
    height: 32px;
    border: 2px solid var(--divider-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
    flex-shrink: 0;
  }

  .color-history-swatch:hover {
    transform: scale(1.1);
    border-color: var(--primary-color);
  }

  .color-history-swatch:active {
    transform: scale(0.95);
  }
`;function Me(e){return Math.round(1e4*e)/1e4}function Te(e,t,i=255){if(0===t)return{r:0,g:0,b:0};const s=1/t*e,o=1/t*(1-e-t);let r=3.2406*s-1.5372+-.4986*o,a=-.9689*s+1.8758+.0415*o,n=.0557*s-.204+1.057*o;const l=Math.max(r,a,n);l>1&&(r/=l,a/=l,n/=l),r=Math.max(0,r),a=Math.max(0,a),n=Math.max(0,n),r=r<=.0031308?12.92*r:1.055*Math.pow(r,1/2.4)-.055,a=a<=.0031308?12.92*a:1.055*Math.pow(a,1/2.4)-.055,n=n<=.0031308?12.92*n:1.055*Math.pow(n,1/2.4)-.055;const c=i/255;return{r:Math.max(0,Math.min(255,Math.round(255*r*c))),g:Math.max(0,Math.min(255,Math.round(255*a*c))),b:Math.max(0,Math.min(255,Math.round(255*n*c)))}}function Ae(e,t,i){let s=e/255,o=t/255,r=i/255;s=s>.04045?Math.pow((s+.055)/1.055,2.4):s/12.92,o=o>.04045?Math.pow((o+.055)/1.055,2.4):o/12.92,r=r>.04045?Math.pow((r+.055)/1.055,2.4):r/12.92;const a=.4124*s+.3576*o+.1805*r,n=.2126*s+.7152*o+.0722*r,l=a+n+(.0193*s+.1192*o+.9505*r);return 0===l?{x:.3127,y:.329}:{x:Me(a/l),y:Me(n/l)}}function Ie(e){const t=e=>e.toString(16).padStart(2,"0");return`#${t(e.r)}${t(e.g)}${t(e.b)}`}function qe(e,t=255){return Ie(Te(e.x,e.y,t))}function De(e){const t=Te(e.x,e.y,255);return function(e,t,i){const s=e/255,o=t/255,r=i/255,a=Math.max(s,o,r),n=a-Math.min(s,o,r);let l=0,c=0;return 0!==a&&(c=n/a*100),0!==n&&(l=a===s?(o-r)/n%6:a===o?(r-s)/n+2:(s-o)/n+4,l=Math.round(60*l),l<0&&(l+=360)),{h:l,s:Math.round(c)}}(t.r,t.g,t.b)}function Ue(e){const t=function(e,t){const i=t/100*1,s=i*(1-Math.abs(e/60%2-1)),o=1-i;let r=0,a=0,n=0;return e>=0&&e<60?(r=i,a=s,n=0):e>=60&&e<120?(r=s,a=i,n=0):e>=120&&e<180?(r=0,a=i,n=s):e>=180&&e<240?(r=0,a=s,n=i):e>=240&&e<300?(r=s,a=0,n=i):(r=i,a=0,n=s),{r:Math.round(255*(r+o)),g:Math.round(255*(a+o)),b:Math.round(255*(n+o))}}(e.h,e.s);return Ae(t.r,t.g,t.b)}function Re(e){const t=De(e);return Ue({h:(t.h+180)%360,s:t.s})}class Be extends ve{constructor(e){if(super(e),this.it=G,e.type!==ue)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===G||null==e)return this._t=void 0,this.it=e;if(e===H)return e;if("string"!=typeof e)throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}Be.directiveName="unsafeHTML",Be.resultType=1;const je=me(Be),Fe=200,Le=200,Oe=180,Ne=180,He=80;function Ge(e,t){const i=(e-90)*Math.PI/180;return[Math.round(100*(Fe+t*Math.cos(i)))/100,Math.round(100*(Le+t*Math.sin(i)))/100]}function We(e,t,i){if(t-e>=360)return`<circle cx="200" cy="200" r="180" fill="${i}" />`;const[s,o]=Ge(e,Oe),[r,a]=Ge(t,Oe);return`<path fill="${i}" stroke="${i}" stroke-width="1" d="M200,200 L${s},${o} A180,180 0 ${t-e>180?1:0},1 ${r},${a} Z" />`}function Ve(e){return Ie(Te(e.x,e.y,255))}function Ye(e){if(e.length<=8)return e;const t=[];for(let i=0;i<8;i++){const s=Math.round(i/8*e.length)%e.length;t.push({hex:e[s].hex,startDeg:45*i,endDeg:45*(i+1)})}return t}function Ke(e){const t=e/100;let i,s,o;t<=66?i=255:(i=329.698727446*Math.pow(t-60,-.1332047592),i=Math.max(0,Math.min(255,i))),s=t<=66?99.4708025861*Math.log(t)-161.1195681661:288.1221695283*Math.pow(t-60,-.0755148492),s=Math.max(0,Math.min(255,s)),t>=66?o=255:t<=19?o=0:(o=138.5177312231*Math.log(t-10)-305.0447927307,o=Math.max(0,Math.min(255,o)));const r=e=>Math.round(e).toString(16).padStart(2,"0");return`#${r(i)}${r(s)}${r(o)}`}function Xe(e){return`<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">${e}</svg>`}function Ze(e){if(!e.segments||0===e.segments.length)return null;const t=function(e){if(0===e.length)return[];const t=[...e].sort((e,t)=>("number"==typeof e.segment?e.segment:parseInt(e.segment,10))-("number"==typeof t.segment?t.segment:parseInt(t.segment,10))),i=360/t.length,s=[];let o=Ie(t[0].color),r=0;for(let e=1;e<t.length;e++){const a=Ie(t[e].color);a!==o&&(s.push({hex:o,startDeg:r,endDeg:e*i}),o=a,r=e*i)}return s.push({hex:o,startDeg:r,endDeg:360}),Ye(s)}(e.segments),i=t.map(e=>We(e.startDeg,e.endDeg,e.hex)).join("");return N`${Qe(Xe(i))}`}function Je(e){if(!e.steps||0===e.steps.length)return null;const t=e.steps[0];let i=[];if(t.segment_colors&&t.segment_colors.length>0?i=t.segment_colors.map(e=>Ie(e.color)):t.colors&&t.colors.length>0&&(i=t.colors.map(e=>Ie({r:e[0]??0,g:e[1]??0,b:e[2]??0}))),0===i.length)return null;const s=function(e){if(0===e.length)return[];const t=360/e.length,i=[];let s=e[0],o=0;for(let r=1;r<e.length;r++)e[r]!==s&&(i.push({hex:s,startDeg:o,endDeg:r*t}),s=e[r],o=r*t);return i.push({hex:s,startDeg:o,endDeg:360}),Ye(i)}(i);if(1===s.length){const e=[`<circle cx="200" cy="200" r="180" fill="${s[0].hex}" />`,'<circle cx="200" cy="200" r="80" fill="var(--card-background-color, #fff)" />'].join("");return N`${Qe(Xe(e))}`}const o=s.map(e=>function(e,t,i){if(t-e>=360)return[`<circle cx="200" cy="200" r="180" fill="${i}" />`,'<circle cx="200" cy="200" r="80" fill="var(--card-background-color, #fff)" />'].join("");const[s,o]=Ge(e,Ne),[r,a]=Ge(t,Ne),[n,l]=Ge(t,He),[c,d]=Ge(e,He),h=t-e>180?1:0;return`<path fill="${i}" stroke="${i}" stroke-width="1" d="M${s},${o} A180,180 0 ${h},1 ${r},${a} L${n},${l} A80,80 0 ${h},0 ${c},${d} Z" />`}(e.startDeg,e.endDeg,e.hex)).join("");return N`${Qe(Xe(o))}`}function Qe(e){return je(e)}const et={title:"Aqara Advanced Lighting",tabs:{activate:"Activate",effects:"Effects",patterns:"Patterns",cct:"CCT",segments:"Segments",presets:"My Presets",config:"Device Config"},errors:{title:"Error",loading_presets:"Failed to load presets. Please refresh the page.",loading_presets_generic:"Failed to load presets",no_presets_title:"No presets available",no_presets_message:"No built-in presets are available. Please check your configuration.",incompatible_light_title:"Incompatible light selected",incompatible_light_message:"One or more selected lights are not supported Aqara models. Please select only T1M, T1 Strip, or T2 bulb lights."},target:{section_title:"Target",select_lights:"Select lights to control",lights_selected:"{count} light selected",lights_selected_plural:"{count} lights selected",lights_label:"Lights",favorites_label:"Favorites",favorite_name_label:"Favorite Name",light_control_label:"Light control",quick_controls_label:"Quick controls",custom_brightness_label:"Brightness override",controls_card_title:"Controls",effect_button:"Effect",cct_button:"CCT",segment_button:"Segment",no_lights_message:"Please select one or more lights to view available presets",group_label:"Group ({count} lights)"},presets:{manage_description:"Manage your saved presets.",manage_description_with_selection:"Click a preset to activate it, or use the edit/delete buttons.",no_presets_title:"No saved presets yet.",no_presets_description:"Use the other tabs to create and save your custom presets.",sort_name_asc:"Name (A-Z)",sort_name_desc:"Name (Z-A)",sort_date_new:"Newest first",sort_date_old:"Oldest first",export_button:"Backup Presets",import_button:"Restore Presets",export_success:"Presets backed up successfully",import_success:"{count} presets restored successfully",import_progress:"Restoring presets...",export_progress:"Backing up presets...",import_error_invalid_file:"Invalid backup file format",import_error_unknown:"An unexpected error occurred",export_error_network:"Network error during backup"},dialogs:{create_effect_title:"Create Effect Preset",edit_effect_title:"Edit Effect Preset",create_effect_description:"Create custom dynamic effect presets with your choice of colors, speed, and brightness.",edit_effect_description:"Update your effect preset settings.",create_pattern_title:"Create Segment Pattern",edit_pattern_title:"Edit Segment Pattern",create_pattern_description:"Design custom segment patterns by setting individual segment colors.",edit_pattern_description:"Update your segment pattern settings.",create_cct_title:"Create CCT Sequence",edit_cct_title:"Edit CCT Sequence",create_cct_description:"Build color temperature sequences with multiple steps and timing controls.",edit_cct_description:"Update your CCT sequence settings.",create_segment_title:"Create Segment Sequence",edit_segment_title:"Edit Segment Sequence",create_segment_description:"Design animated segment sequences with multiple steps and transition effects.",edit_segment_description:"Update your segment sequence settings.",compatibility_warning_effects:"Preview not available, the selected light does not support dynamic effects. Compatible devices: T2 RGB bulb, T1M RGB endpoint, T1 Strip.",compatibility_warning_patterns:"Preview not available, the selected light does not support segment patterns. Compatible devices: T1M RGB endpoint, T1 Strip.",compatibility_warning_cct:"Preview not available, the selected light does not support CCT sequences. Compatible devices: T2 RGB bulb, T2 CCT bulb, T1M white endpoint, T1 Strip.",compatibility_warning_segments:"Preview not available, the selected light does not support segment sequences. Compatible devices: T1M RGB endpoint, T1 Strip."},config:{transition_settings:"T2 transition settings",custom_curvature_label:"Custom curvature",initial_brightness_label:"Initial brightness",on_to_off_duration_label:"On to off duration",off_to_on_duration_label:"Off to on duration",dimming_range_min_label:"Dimming range minimum",dimming_range_max_label:"Dimming range maximum",strip_length_label:"Strip length",select_light_message:"Select a light in the Activate tab to configure device-specific settings."},instances:{section_title:"Zigbee2MQTT instances",subtitle_single:"{count} instance, {devices} device",subtitle_plural:"{count} instances, {devices} devices",no_instances:"No Z2M instances found. Make sure the integration is properly configured.",total:"Total",t2_rgb:"T2 RGB",t2_cct:"T2 CCT",t1m:"T1M",t1_strip:"T1 Strip",other:"Other",show_devices_single:"Show {count} device",show_devices_plural:"Show {count} devices"},transition_curve:{title:"Transition curve",subtitle:"Drag on the graph to adjust"},tooltips:{color_edit:"Click to edit color",color_remove:"Remove color",color_add:"Add color",step_move_up:"Move up",step_move_down:"Move down",step_duplicate:"Duplicate",step_remove:"Remove",favorite_save:"Save as favorite",preset_edit:"Edit preset",preset_duplicate:"Duplicate preset",preset_delete:"Delete preset",version_mismatch:"Version mismatch detected: Backend (v{backend}) and frontend (v{frontend}) versions differ. Please refresh the page or restart Home Assistant to resolve this issue."},options:{loop_mode_once:"Run once",loop_mode_count:"Loop N times",loop_mode_continuous:"Continuous loop",end_behavior_maintain:"Stay at last step",end_behavior_turn_off:"Turn off light",activation_all:"All at once",activation_sequential_forward:"Sequential forward",activation_sequential_reverse:"Sequential reverse",activation_random:"Random",activation_ping_pong:"Ping pong",activation_center_out:"Center out",activation_edges_in:"Edges in",activation_paired:"Paired"},editors:{name_label:"Name",icon_label:"Icon",icon_auto_hint:"Auto-generated from colors when not set",cancel_button:"Cancel",save_button:"Save",select_all_button:"Select all",clear_all_button:"Clear all",clear_selected_button:"Clear selected",clear_mode_on:"Clear: ON",clear_mode_off:"Clear: OFF",segments_selected:"{count} selected",select_mode_on:"Select: ON",select_mode_off:"Select: OFF",add_step_button:"Add step",apply_to_selected_button:"Apply to selected",loop_mode_label:"Loop mode",loop_count_label:"Loop count",end_behavior_label:"End behavior",device_type_label:"Device type",selected_device_type:"Selected device",skip_first_step_label:"Skip first step in loop",no_steps_message:'No steps defined. Click "Add step" to create your first step.',segments_label:"Segments",colors_label:"Colors (1-8)",color_picker_title:"Select color",apply_button:"Apply",color_temperature_label:"Color temperature ({value}K)",transition_time_label:"Transition time (seconds)",hold_time_label:"Hold time (seconds)",duration_label:"Duration (seconds)",activation_pattern_label:"Activation pattern",speed_label:"Speed",effect_label:"Effect",segment_grid_label:"Segment grid",brightness_label:"Brightness",brightness_percent_label:"Brightness (%)",steps_label:"Steps (1-20)",select_lights_for_preview_effects:"Select light entities in the Activate tab to preview effects on your devices.",select_lights_for_preview_patterns:"Select light entities in the Activate tab to preview patterns on your devices.",select_lights_for_preview_sequences:"Select light entities in the Activate tab to preview sequences on your devices.",first_half_button:"First Half",second_half_button:"Second Half",odd_button:"Odd",even_button:"Even",individual_tab:"Individual",gradient_tab:"Gradient",blocks_tab:"Blocks",apply_to_grid_button:"Apply to Grid",expand_blocks_label:"Expand blocks to fill segments evenly",gradient_mode_description:"Create a smooth color gradient. Add 2-6 colors to blend.",blocks_mode_description:"Create evenly spaced blocks of color. Add 1-6 colors.",gradient_reverse_label:"Reverse direction",gradient_mirror_label:"Mirror gradient",gradient_wave_label:"Wave easing",gradient_repeat_label:"Repeat",gradient_wave_cycles_label:"Wave cycles",gradient_interpolation_label:"Interpolation",gradient_interp_shortest:"Shortest hue",gradient_interp_longest:"Longest hue",gradient_interp_rgb:"Linear RGB"},color_history:{recent_colors:"Recent colors",clear:"Clear"}},tt="aqara_lighting_color_history";function it(e){return Math.round(1e4*e)/1e4}function st(){try{const e=localStorage.getItem(tt);if(!e)return[];const t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function ot(e){try{let t=st();t=t.filter(t=>!function(e,t){return it(e.x)===it(t.x)&&it(e.y)===it(t.y)}(t,e)),t.unshift({x:it(e.x),y:it(e.y)}),t.length>8&&(t=t.slice(0,8)),localStorage.setItem(tt,JSON.stringify(t))}catch{}}function rt(){try{localStorage.removeItem(tt)}catch{}}let at=class extends ne{constructor(){super(...arguments),this.color={x:.68,y:.31},this.size=220,this.showRgbInputs=!0,this._isDragging=!1,this._editingColor={h:0,s:100},this._onPointerMove=e=>{this._isDragging&&(e.preventDefault(),this._handleWheelInteraction(e))},this._onPointerUp=()=>{this._isDragging=!1,this._marker?.classList.remove("dragging"),window.removeEventListener("mousemove",this._onPointerMove),window.removeEventListener("mouseup",this._onPointerUp),window.removeEventListener("touchmove",this._onPointerMove),window.removeEventListener("touchend",this._onPointerUp)}}firstUpdated(){this._editingColor=De(this.color),this._drawColorWheel(),this._updateMarkerPosition()}updated(e){e.has("size")&&(this._drawColorWheel(),this._updateMarkerPosition()),e.has("color")&&!this._isDragging&&(this._editingColor=De(this.color),this._updateMarkerPosition())}_drawColorWheel(){const e=this._canvas;if(!e)return;const t=e.getContext("2d");if(!t)return;const i=this.size,s=i/2,o=i/2,r=i/2;e.width=i,e.height=i;for(let e=0;e<360;e++){const i=(e-1)*Math.PI/180,a=(e+1)*Math.PI/180,n=t.createRadialGradient(s,o,0,s,o,r);n.addColorStop(0,"hsl("+e+", 0%, 100%)"),n.addColorStop(1,"hsl("+e+", 100%, 50%)"),t.beginPath(),t.moveTo(s,o),t.arc(s,o,r,i,a),t.closePath(),t.fillStyle=n,t.fill()}}_updateMarkerPosition(){if(!this._marker)return;const{x:e,y:t}=this._hsToPosition(this._editingColor);this._marker.style.left=`${e}px`,this._marker.style.top=`${t}px`;const i=Ue(this._editingColor),s=Te(i.x,i.y,255),o=`#${s.r.toString(16).padStart(2,"0")}${s.g.toString(16).padStart(2,"0")}${s.b.toString(16).padStart(2,"0")}`;this._marker.style.backgroundColor=o}_hsToPosition(e){const t=this.size/2,i=this.size/2,s=this.size/2,o=e.h*Math.PI/180,r=e.s/100*s;return{x:t+r*Math.cos(o),y:i+r*Math.sin(o)}}_positionToHs(e,t){const i=this.size/2,s=this.size/2,o=this.size/2,r=e-i,a=t-s;let n=Math.sqrt(r*r+a*a);n=Math.min(n,o);let l=180*Math.atan2(a,r)/Math.PI;return l<0&&(l+=360),{h:Math.round(l)%360,s:Math.round(n/o*100)}}_handleWheelInteraction(e){const t=this._canvas;if(!t)return;const i=t.getBoundingClientRect();let s,o;if("touches"in e){const t=e.touches[0];if(!t)return;s=t.clientX,o=t.clientY}else s=e.clientX,o=e.clientY;const r=s-i.left,a=o-i.top,n=this._positionToHs(r,a);this._editingColor=n;const l=Ue(n);this._updateMarkerPosition(),this._updateRgbInputs(l),this._fireColorChanged(l)}_handleRgbInput(e,t){const i=e.target,s=parseInt(i.value,10);if(isNaN(s)||s<0||s>255)return;const o=Ue(this._editingColor),r=Te(o.x,o.y,255),a={r:"r"===t?s:r.r,g:"g"===t?s:r.g,b:"b"===t?s:r.b},n=Ae(a.r,a.g,a.b),l=De(n);this._editingColor=l,this._updateMarkerPosition(),this._updateRgbInputs(n),this._fireColorChanged(n);const c=Te(n.x,n.y,255);if(("r"===t?c.r:"g"===t?c.g:c.b)!==s){const e=i.style.borderColor;i.style.borderColor="var(--warning-color, #ff9800)",setTimeout(()=>{i.style.borderColor=e},500)}}_updateRgbInputs(e){const t=this.shadowRoot?.querySelectorAll(".rgb-input-field");if(!t||3!==t.length)return;const i=Te(e.x,e.y,255);t[0].value=i.r.toString(),t[1].value=i.g.toString(),t[2].value=i.b.toString()}_fireColorChanged(e){this.dispatchEvent(new CustomEvent("color-changed",{detail:{color:e},bubbles:!0,composed:!0}))}_onPointerDown(e){e.preventDefault(),this._isDragging=!0,this._marker?.classList.add("dragging"),this._handleWheelInteraction(e),e instanceof MouseEvent?(window.addEventListener("mousemove",this._onPointerMove),window.addEventListener("mouseup",this._onPointerUp)):(window.addEventListener("touchmove",this._onPointerMove,{passive:!1}),window.addEventListener("touchend",this._onPointerUp))}render(){const e=Ue(this._editingColor),t=Te(e.x,e.y,255);return N`
      <div class="color-picker-container">
        <div style="position: relative; width: ${this.size}px; height: ${this.size}px;">
          <canvas
            @mousedown=${this._onPointerDown}
            @touchstart=${this._onPointerDown}
          ></canvas>
          <div class="marker"></div>
        </div>
      </div>
      ${this.showRgbInputs?N`
        <div class="rgb-inputs">
          <label class="rgb-input-label">
            <span class="rgb-input-channel">R</span>
            <input
              type="number"
              class="rgb-input-field"
              min="0"
              max="255"
              .value=${t.r.toString()}
              @input=${e=>this._handleRgbInput(e,"r")}
            />
          </label>
          <label class="rgb-input-label">
            <span class="rgb-input-channel">G</span>
            <input
              type="number"
              class="rgb-input-field"
              min="0"
              max="255"
              .value=${t.g.toString()}
              @input=${e=>this._handleRgbInput(e,"g")}
            />
          </label>
          <label class="rgb-input-label">
            <span class="rgb-input-channel">B</span>
            <input
              type="number"
              class="rgb-input-field"
              min="0"
              max="255"
              .value=${t.b.toString()}
              @input=${e=>this._handleRgbInput(e,"b")}
            />
          </label>
        </div>
      `:""}
    `}};at.styles=a`
    :host {
      display: block;
      width: 100%;
    }

    .color-picker-container {
      position: relative;
      touch-action: none;
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }

    canvas {
      border-radius: 50%;
      cursor: crosshair;
      display: block;
    }

    .marker {
      position: absolute;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3);
      pointer-events: none;
      transform: translate(-50%, -50%);
      transition: box-shadow 0.1s ease;
    }

    .marker.dragging {
      box-shadow: 0 0 8px rgba(0, 0, 0, 0.7), inset 0 0 2px rgba(0, 0, 0, 0.3);
    }

    .rgb-inputs {
      display: flex;
      justify-content: center;
      gap: 12px;
      margin: 16px 0;
    }

    .rgb-input-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .rgb-input-channel {
      font-size: 12px;
      font-weight: 500;
      color: var(--secondary-text-color);
      text-transform: uppercase;
    }

    .rgb-input-field {
      width: 60px;
      padding: 6px 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      background: var(--card-background-color);
      color: var(--primary-text-color);
      font-size: 14px;
      font-family: monospace;
      text-align: center;
    }

    .rgb-input-field:focus {
      outline: none;
      border-color: var(--primary-color);
    }
  `,e([pe({type:Object})],at.prototype,"color",void 0),e([pe({type:Number})],at.prototype,"size",void 0),e([pe({type:Boolean})],at.prototype,"showRgbInputs",void 0),e([_e()],at.prototype,"_isDragging",void 0),e([_e()],at.prototype,"_editingColor",void 0),e([ge("canvas")],at.prototype,"_canvas",void 0),e([ge(".marker")],at.prototype,"_marker",void 0),at=e([ce("xy-color-picker")],at);const nt={t2_bulb:["breathing","candlelight","fading","flash"],t1:["flow1","flow2","fading","hopping","breathing","rolling"],t1m:["flow1","flow2","fading","hopping","breathing","rolling"],t1_strip:["breathing","rainbow1","chasing","flash","hopping","rainbow2","flicker","dash"]},lt={},ct={t2_bulb:"T2 Bulb",t1:"T1 (20 segments)",t1m:"T1M (26 segments)",t1_strip:"T1 Strip"};let dt=class extends ne{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.previewActive=!1,this.stripSegmentCount=10,this._name="",this._icon="",this._deviceType="t2_bulb",this._effect="",this._speed=50,this._brightness=100,this._colors=[{x:.68,y:.31}],this._segments="",this._saving=!1,this._previewing=!1,this._editingColorIndex=null,this._editingColor=null,this._hasUserInteraction=!1}updated(e){super.updated(e),e.has("preset")&&(this.preset?(this._hasUserInteraction=!0,this._loadPreset(this.preset)):this._hasUserInteraction=!1),e.has("deviceContext")&&!this._hasUserInteraction&&this.deviceContext?.deviceType&&(this._deviceType=this.deviceContext.deviceType,this._effect="")}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._deviceType=e.device_type||"t2_bulb",this._effect=e.effect,this._speed=e.effect_speed,this._brightness=e.effect_brightness||100,this._colors=e.effect_colors.map(e=>"x"in e&&"y"in e?{x:e.x,y:e.y}:"r"in e&&"g"in e&&"b"in e?Ae(e.r,e.g,e.b):{x:.68,y:.31}),this._segments=e.effect_segments||""}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleDeviceTypeChange(e){this._deviceType=e.detail.value||"t2_bulb",this._hasUserInteraction=!0,this._effect=""}_handleSpeedChange(e){this._speed=e.detail.value||50}_handleBrightnessChange(e){this._brightness=e.detail.value||100}_handleSegmentsChange(e){this._segments=e.detail.value||""}_openColorPicker(e){const t=this._colors[e];t&&(this._editingColorIndex=e,this._editingColor=t)}_handleColorPickerChange(e){this._editingColor=e.detail.color}_confirmColorPicker(){null!==this._editingColorIndex&&null!==this._editingColor&&(ot(this._editingColor),this._colors=this._colors.map((e,t)=>t===this._editingColorIndex?this._editingColor:e)),this._closeColorPicker()}_selectHistoryColor(e){this._editingColor={x:e.x,y:e.y}}_clearColorHistory(){rt(),this.requestUpdate()}_closeColorPicker(){this._editingColorIndex=null,this._editingColor=null}_addColor(){if(this._colors.length<8){const e=Re(this._colors[this._colors.length-1]||{x:.68,y:.31});this._colors=[...this._colors,e]}}_removeColor(e){this._colors.length>1&&(this._colors=this._colors.filter((t,i)=>i!==e))}_renderColorHistory(){const e=st();return N`
      <div class="color-history-section">
        <div class="color-history-header">
          <span class="color-history-label">${this._localize("color_history.recent_colors")}</span>
          ${e.length>0?N`
            <button class="color-history-clear" @click=${this._clearColorHistory}>
              ${this._localize("color_history.clear")}
            </button>
          `:""}
        </div>
        <div class="color-history-swatches">
          ${e.map(e=>N`
            <button
              class="color-history-swatch"
              style="background-color: ${qe(e,255)}"
              @click=${()=>this._selectHistoryColor(e)}
            ></button>
          `)}
        </div>
      </div>
    `}_colorToHex(e){return qe(e,255)}_getEffectIconUrl(e){return`/api/aqara_advanced_lighting/icons/${lt[e]||e}.svg`}_selectEffect(e){this._effect=e}_getPresetData(){const e={name:this._name,icon:this._icon||void 0,device_type:this._deviceType,effect:this._effect,effect_speed:this._speed,effect_brightness:this._brightness,effect_colors:this._colors};return"t1_strip"===this._deviceType&&this._segments&&(e.effect_segments=this._segments),e}async _preview(){if(this.hass&&this._effect&&!this._previewing){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&this._effect){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){const e=Object.entries(ct).map(([e,t])=>({value:e,label:t})),t=nt[this._deviceType]||[],i="t1_strip"===this._deviceType;return N`
      <div class="editor-content">
        <div class="form-row-triple">
          <div class="form-field">
            <span class="form-label">${this._localize("editors.name_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{text:{}}}
              .value=${this._name}
              @value-changed=${this._handleNameChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.icon_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{icon:{}}}
              .value=${this._icon}
              @value-changed=${this._handleIconChange}
            ></ha-selector>
            ${this._icon?"":N`<span class="form-hint">${this._localize("editors.icon_auto_hint")}</span>`}
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.device_type_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:e,mode:"dropdown"}}}
              .value=${this._deviceType}
              @value-changed=${this._handleDeviceTypeChange}
            ></ha-selector>
          </div>
        </div>

        <div class="form-row-pair">
          <div class="form-field">
            <span class="form-label">${this._localize("editors.speed_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:1,max:100,mode:"slider"}}}
              .value=${this._speed}
              @value-changed=${this._handleSpeedChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.brightness_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:1,max:100,mode:"slider",unit_of_measurement:"%"}}}
              .value=${this._brightness}
              @value-changed=${this._handleBrightnessChange}
            ></ha-selector>
          </div>
        </div>

        ${i?N`
              <div class="form-section">
                <segment-selector
                  .hass=${this.hass}
                  .mode=${"selection"}
                  .maxSegments=${this.stripSegmentCount}
                  .value=${this._segments}
                  .label=${this._localize("editors.segments_label")}
                  .translations=${this.translations}
                  @value-changed=${this._handleSegmentsChange}
                ></segment-selector>
              </div>
            `:""}

        <div class="form-section">
          <span class="form-label">${this._localize("editors.effect_label")}</span>
          <div class="effect-grid">
            ${t.map(e=>N`
                <div
                  class="effect-icon-btn ${this._effect===e?"selected":""}"
                  @click=${()=>this._selectEffect(e)}
                  title=${e}
                >
                  <div
                    class="effect-icon"
                    style="
                      -webkit-mask-image: url('${this._getEffectIconUrl(e)}');
                      mask-image: url('${this._getEffectIconUrl(e)}');
                    "
                  ></div>
                  <span>${e}</span>
                </div>
              `)}
          </div>
        </div>

        <div class="form-section">
          <span class="form-label">${this._localize("editors.colors_label")}</span>
          <div class="color-picker-grid">
            ${this._colors.map((e,t)=>N`
                <div class="color-item">
                  <div
                    class="color-swatch"
                    style="background-color: ${this._colorToHex(e)}"
                    @click=${()=>this._openColorPicker(t)}
                    title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_edit")}"
                  ></div>
                  ${this._colors.length>1?N`
                        <button
                          class="color-remove"
                          @click=${()=>this._removeColor(t)}
                          title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_remove")}"
                        >
                          <ha-icon icon="mdi:close"></ha-icon>
                        </button>
                      `:N`<div class="color-remove-spacer"></div>`}
                </div>
              `)}
            <div class="add-color-btn ${this._colors.length>=8?"disabled":""}">
              <div
                class="add-color-icon"
                @click=${this._addColor}
                title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_add")}"
              >
                <ha-icon icon="mdi:plus"></ha-icon>
              </div>
              <div class="color-remove-spacer"></div>
            </div>
          </div>
        </div>

        ${null!==this._editingColorIndex&&null!==this._editingColor?N`
              <div class="color-picker-modal-overlay" @click=${this._closeColorPicker}>
                <div class="color-picker-modal" @click=${e=>e.stopPropagation()}>
                  <div class="color-picker-modal-header">
                    <span class="color-picker-modal-title">${this._localize("editors.color_picker_title")}</span>
                    <div
                      class="color-picker-modal-preview"
                      style="background-color: ${this._colorToHex(this._editingColor)}"
                    ></div>
                  </div>
                  <xy-color-picker
                    .color=${this._editingColor}
                    .size=${220}
                    .showRgbInputs=${!0}
                    @color-changed=${this._handleColorPickerChange}
                  ></xy-color-picker>
                  ${this._renderColorHistory()}
                  <div class="color-picker-modal-actions">
                    <ha-button @click=${this._closeColorPicker}>${this._localize("editors.cancel_button")}</ha-button>
                    <ha-button @click=${this._confirmColorPicker}>
                      <ha-icon icon="mdi:check"></ha-icon>
                      ${this._localize("editors.apply_button")}
                    </ha-button>
                  </div>
                </div>
              </div>
            `:""}

        ${this.hasSelectedEntities?"":N`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_effects")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?N`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  Stop
                </ha-button>
              `:N`
                <ha-button
                  @click=${this._preview}
                  .disabled=${!this._effect||this._previewing||!this.hasSelectedEntities||!this.isCompatible}
                  title=${this.hasSelectedEntities?this.isCompatible?"":"Selected light is not compatible":"Select entities in Activate tab first"}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  Preview
                </ha-button>
              `}
          <ha-button @click=${this._save} .disabled=${!this._name.trim()||!this._effect||this._saving}>
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode?"Update":"Save"}
          </ha-button>
        </div>
      </div>
    `}};dt.styles=[Ee,a`
    :host {
      display: block;
    }

    .editor-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .form-row-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-triple {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-pair .form-field,
    .form-row-triple .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .form-section .form-label {
      min-width: unset;
    }

    .form-label {
      font-size: 14px;
      font-weight: 500;
      min-width: 120px;
      color: var(--secondary-text-color);
    }

    .field-description {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 4px;
    }

    .form-input {
      flex: 1;
    }

    /* Color picker styles inherited from panelStyles (styles.ts) */

    /* Effect icon grid selector */
    .effect-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .effect-icon-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 8px;
      min-width: 70px;
      background: var(--card-background-color);
      border: 2px solid var(--divider-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .effect-icon-btn:hover {
      background: var(--secondary-background-color);
      border-color: var(--primary-color);
    }

    .effect-icon-btn.selected {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--text-primary-color);
    }

    .effect-icon {
      width: 32px;
      height: 32px;
      margin-bottom: 4px;
      background-color: var(--primary-text-color);
      -webkit-mask-size: contain;
      mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-position: center;
      mask-position: center;
    }

    .effect-icon-btn.selected .effect-icon {
      background-color: var(--text-primary-color);
    }

    .effect-icon-btn span {
      font-size: 11px;
      text-transform: capitalize;
      text-align: center;
    }

    /* .color-remove and .add-color-btn inherited from panelStyles (styles.ts) */

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
    }

    .preview-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-left: 4px solid var(--warning-color, #ffc107);
      border-radius: 4px;
      font-size: 13px;
    }

    .preview-warning ha-icon {
      flex-shrink: 0;
      --mdc-icon-size: 18px;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        align-items: stretch;
      }

      .form-row-pair,
      .form-row-triple {
        grid-template-columns: 1fr;
      }

      .form-label {
        min-width: unset;
        margin-bottom: 4px;
      }
    }

    .form-hint {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
      margin-top: -4px;
    }
  `],e([pe({attribute:!1})],dt.prototype,"hass",void 0),e([pe({type:Object})],dt.prototype,"preset",void 0),e([pe({type:Object})],dt.prototype,"translations",void 0),e([pe({type:Boolean})],dt.prototype,"editMode",void 0),e([pe({type:Boolean})],dt.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],dt.prototype,"isCompatible",void 0),e([pe({type:Boolean})],dt.prototype,"previewActive",void 0),e([pe({type:Number})],dt.prototype,"stripSegmentCount",void 0),e([pe({type:Object})],dt.prototype,"deviceContext",void 0),e([_e()],dt.prototype,"_name",void 0),e([_e()],dt.prototype,"_icon",void 0),e([_e()],dt.prototype,"_deviceType",void 0),e([_e()],dt.prototype,"_effect",void 0),e([_e()],dt.prototype,"_speed",void 0),e([_e()],dt.prototype,"_brightness",void 0),e([_e()],dt.prototype,"_colors",void 0),e([_e()],dt.prototype,"_segments",void 0),e([_e()],dt.prototype,"_saving",void 0),e([_e()],dt.prototype,"_previewing",void 0),e([_e()],dt.prototype,"_editingColorIndex",void 0),e([_e()],dt.prototype,"_editingColor",void 0),e([_e()],dt.prototype,"_hasUserInteraction",void 0),dt=e([ce("effect-editor")],dt);const ht={t1:20,t1m:26,t1_strip:50},pt={t1:"T1 (20 segments)",t1m:"T1M (26 segments)",t1_strip:"T1 Strip (up to 50 segments)"},_t=[{x:.68,y:.31},{x:.17,y:.7},{x:.15,y:.06},{x:.42,y:.51},{x:.38,y:.16},{x:.22,y:.33}];let gt=class extends ne{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.stripSegmentCount=10,this._name="",this._icon="",this._deviceType="t1m",this._segments=new Map,this._selectedSegments=new Set,this._saving=!1,this._previewing=!1,this._colorPalette=[..._t],this._gradientColors=[{x:.68,y:.31},{x:.15,y:.06}],this._blockColors=[{x:.68,y:.31},{x:.17,y:.7}],this._expandBlocks=!1,this._gradientMirror=!1,this._gradientRepeat=1,this._gradientReverse=!1,this._gradientInterpolation="shortest",this._gradientWave=!1,this._gradientWaveCycles=1,this._hasUserInteraction=!1}updated(e){if(super.updated(e),e.has("preset")&&(this.preset?(this._hasUserInteraction=!0,this._loadPreset(this.preset)):this._hasUserInteraction=!1),e.has("deviceContext")&&!this._hasUserInteraction&&this.deviceContext?.deviceType&&(this._deviceType=this.deviceContext.deviceType),e.has("stripSegmentCount")&&"t1_strip"===this._deviceType){const e=this._getMaxSegments();let t=!1;const i=new Map;for(const[s,o]of this._segments)s<e?i.set(s,o):t=!0;if(t){this._segments=i;const t=new Set;for(const i of this._selectedSegments)i<e&&t.add(i);this._selectedSegments=t}}}_getMaxSegments(){return"t1_strip"===this._deviceType?this.stripSegmentCount:ht[this._deviceType]||26}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._deviceType=e.device_type||"t1m",this._segments=new Map,this._selectedSegments=new Set;for(const t of e.segments){const e="string"==typeof t.segment?parseInt(t.segment,10):t.segment,i=t.color;"x"in i&&"y"in i?this._segments.set(e-1,{x:i.x,y:i.y}):"r"in i&&"g"in i&&"b"in i&&this._segments.set(e-1,Ae(i.r,i.g,i.b))}}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleDeviceTypeChange(e){this._deviceType=e.detail.value||"t1m",this._hasUserInteraction=!0;const t=this._getMaxSegments(),i=new Map;for(const[e,s]of this._segments)e<t&&i.set(e,s);this._segments=i,this._selectedSegments=new Set}_handleColorValueChange(e){const{value:t}=e.detail;t instanceof Map&&(this._segments=t)}_handleGradientColorsChange(e){const{colors:t}=e.detail;Array.isArray(t)&&(this._gradientColors=t)}_handleBlockColorsChange(e){const{colors:t}=e.detail;Array.isArray(t)&&(this._blockColors=t)}_handleColorPaletteChange(e){const{colors:t}=e.detail;Array.isArray(t)&&(this._colorPalette=t)}_getCurrentPattern(){return this._segments}_getPresetData(){const e=this._getCurrentPattern(),t=[];for(const[i,s]of e){const e=Te(s.x,s.y,255);t.push({segment:i+1,color:{r:e.r,g:e.g,b:e.b}})}return{name:this._name,icon:this._icon||void 0,device_type:this._deviceType,segments:t}}async _preview(){if(!this.hass||this._previewing)return;if(0!==this._getCurrentPattern().size){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}async _save(){if(!this._name.trim())return;if(0!==this._getCurrentPattern().size){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_canPreview(){return this._getCurrentPattern().size>0}_canSave(){if(!this._name.trim())return!1;return this._getCurrentPattern().size>0}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){const e=Object.entries(pt).map(([e,t])=>({value:e,label:"t1_strip"===e?`T1 Strip (${this.stripSegmentCount} segments)`:t}));return N`
      <div class="editor-content">
        <div class="form-row-triple">
          <div class="form-field">
            <span class="form-label">${this._localize("editors.name_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{text:{}}}
              .value=${this._name}
              @value-changed=${this._handleNameChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.icon_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{icon:{}}}
              .value=${this._icon}
              @value-changed=${this._handleIconChange}
            ></ha-selector>
            ${this._icon?"":N`<span class="form-hint">${this._localize("editors.icon_auto_hint")}</span>`}
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.device_type_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:e,mode:"dropdown"}}}
              .value=${this._deviceType}
              @value-changed=${this._handleDeviceTypeChange}
            ></ha-selector>
          </div>
        </div>

        <div class="form-section">
          <span class="form-label">${this._localize("editors.segment_grid_label")}</span>
          <segment-selector
            .hass=${this.hass}
            .mode=${"color"}
            .maxSegments=${this._getMaxSegments()}
            .colorValue=${this._segments}
            .colorPalette=${this._colorPalette}
            .gradientColors=${this._gradientColors}
            .blockColors=${this._blockColors}
            .expandBlocks=${this._expandBlocks}
            .gradientMirror=${this._gradientMirror}
            .gradientRepeat=${this._gradientRepeat}
            .gradientReverse=${this._gradientReverse}
            .gradientInterpolation=${this._gradientInterpolation}
            .gradientWave=${this._gradientWave}
            .gradientWaveCycles=${this._gradientWaveCycles}
            .translations=${this.translations}
            @color-value-changed=${this._handleColorValueChange}
            @color-palette-changed=${this._handleColorPaletteChange}
            @gradient-colors-changed=${this._handleGradientColorsChange}
            @block-colors-changed=${this._handleBlockColorsChange}
          ></segment-selector>
        </div>

        ${this.hasSelectedEntities?"":N`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_patterns")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          <ha-button
            @click=${this._preview}
            .disabled=${!this._canPreview()||this._previewing||!this.hasSelectedEntities||!this.isCompatible}
            title=${this.hasSelectedEntities?this.isCompatible?"":"Selected light is not compatible":"Select entities in Activate tab first"}
          >
            <ha-icon icon="mdi:play"></ha-icon>
            Preview
          </ha-button>
          <ha-button
            @click=${this._save}
            .disabled=${!this._canSave()||this._saving}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode?"Update":"Save"}
          </ha-button>
        </div>
      </div>
    `}};gt.styles=[Ee,a`
    :host {
      display: block;
    }

    .editor-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .form-row-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-triple {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-pair .form-field,
    .form-row-triple .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .form-section .form-label {
      min-width: unset;
    }

    .form-label {
      font-size: 14px;
      font-weight: 500;
      min-width: 120px;
      color: var(--secondary-text-color);
    }

    .form-input {
      flex: 1;
    }

    .segment-grid-container {
      background: var(--card-background-color);
      border-radius: 8px;
      padding: 16px;
    }

    .segment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
      gap: 4px;
      margin-bottom: 12px;
    }

    .segment-cell {
      aspect-ratio: 1;
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid var(--divider-color);
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      color: var(--secondary-text-color);
      background: var(--primary-background-color);
    }

    .segment-cell:hover {
      transform: scale(1.1);
      z-index: 1;
    }

    .segment-cell.selected {
      border-color: var(--primary-color);
      box-shadow: 0 0 0 2px var(--primary-color);
    }

    .segment-cell.colored {
      border-color: transparent;
      color: transparent;
    }

    /* Clear mode cursor */
    .segment-grid.clear-mode .segment-cell.colored {
      cursor: not-allowed;
    }

    .segment-grid.clear-mode .segment-cell.colored:hover {
      opacity: 0.7;
    }

    /* Select mode cursor */
    .segment-grid.select-mode .segment-cell {
      cursor: crosshair;
    }

    .segment-grid.select-mode .segment-cell:hover {
      border-color: var(--info-color, #2196f3);
    }

    .grid-controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      padding-top: 8px;
      border-top: 1px solid var(--divider-color);
    }

    .grid-info {
      font-size: 12px;
      color: var(--secondary-text-color);
      margin-top: 8px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
    }

    .preview-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-left: 4px solid var(--warning-color, #ffc107);
      border-radius: 4px;
      font-size: 13px;
    }

    .preview-warning ha-icon {
      flex-shrink: 0;
      --mdc-icon-size: 18px;
    }

    /* Sub-tabs for pattern modes */
    .mode-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 2px solid var(--divider-color);
    }

    .mode-tab {
      padding: 8px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--secondary-text-color);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s ease;
    }

    .mode-tab:hover {
      color: var(--primary-text-color);
      background: var(--secondary-background-color);
    }

    .mode-tab.active {
      color: var(--primary-color);
      border-bottom-color: var(--primary-color);
    }

    /* Color picker, palette, color-array, color-item, color-swatch,
       color-picker-modal, color-remove, add-color-btn styles
       are inherited from panelStyles (styles.ts) */

    .palette-label {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin-right: 8px;
    }

    /* Use color-picker-grid as alias for color-array in gradient/blocks modes */
    .color-array {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }

    /* Options row */
    .options-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 12px;
      flex-wrap: wrap;
    }

    .option-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .option-label {
      font-size: 13px;
      color: var(--secondary-text-color);
    }

    /* Mode description */
    .mode-description {
      font-size: 13px;
      color: var(--secondary-text-color);
      margin-bottom: 16px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      border-radius: 4px;
    }

    /* Clear mode toggle button */
    .clear-mode-toggle.active {
      --mdc-theme-primary: var(--error-color);
      color: var(--error-color);
    }

    /* Select mode toggle button */
    .select-mode-toggle.active {
      --mdc-theme-primary: var(--info-color, #2196f3);
      color: var(--info-color, #2196f3);
    }

    /* Generated pattern actions */
    .generated-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    /* Mode content container */
    .mode-content {
      background: var(--card-background-color);
      border-radius: 8px;
      padding: 16px;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        align-items: stretch;
      }

      .form-row-pair,
      .form-row-triple {
        grid-template-columns: 1fr;
      }

      .form-label {
        min-width: unset;
        margin-bottom: 4px;
      }

      .grid-controls {
        flex-direction: column;
      }

      .mode-tabs {
        overflow-x: auto;
      }

      .color-palette {
        justify-content: center;
      }
    }

    .form-hint {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
      margin-top: -4px;
    }
  `],e([pe({attribute:!1})],gt.prototype,"hass",void 0),e([pe({type:Object})],gt.prototype,"preset",void 0),e([pe({type:Object})],gt.prototype,"translations",void 0),e([pe({type:Boolean})],gt.prototype,"editMode",void 0),e([pe({type:Boolean})],gt.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],gt.prototype,"isCompatible",void 0),e([pe({type:Number})],gt.prototype,"stripSegmentCount",void 0),e([pe({type:Object})],gt.prototype,"deviceContext",void 0),e([_e()],gt.prototype,"_name",void 0),e([_e()],gt.prototype,"_icon",void 0),e([_e()],gt.prototype,"_deviceType",void 0),e([_e()],gt.prototype,"_segments",void 0),e([_e()],gt.prototype,"_selectedSegments",void 0),e([_e()],gt.prototype,"_saving",void 0),e([_e()],gt.prototype,"_previewing",void 0),e([_e()],gt.prototype,"_colorPalette",void 0),e([_e()],gt.prototype,"_gradientColors",void 0),e([_e()],gt.prototype,"_blockColors",void 0),e([_e()],gt.prototype,"_expandBlocks",void 0),e([_e()],gt.prototype,"_gradientMirror",void 0),e([_e()],gt.prototype,"_gradientRepeat",void 0),e([_e()],gt.prototype,"_gradientReverse",void 0),e([_e()],gt.prototype,"_gradientInterpolation",void 0),e([_e()],gt.prototype,"_gradientWave",void 0),e([_e()],gt.prototype,"_gradientWaveCycles",void 0),e([_e()],gt.prototype,"_hasUserInteraction",void 0),gt=e([ce("pattern-editor")],gt);let ut=class extends ne{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.selectedEntities=[],this.previewActive=!1,this._name="",this._icon="",this._steps=[],this._loopMode="once",this._loopCount=3,this._endBehavior="maintain",this._saving=!1,this._previewing=!1}get _loopModeOptions(){return[{value:"once",label:this._localize("options.loop_mode_once")},{value:"loop",label:this._localize("options.loop_mode_count")},{value:"continuous",label:this._localize("options.loop_mode_continuous")}]}get _endBehaviorOptions(){return[{value:"maintain",label:this._localize("options.end_behavior_maintain")},{value:"turn_off",label:this._localize("options.end_behavior_turn_off")}]}get _deviceTypeLabel(){if(!this.deviceContext?.deviceType)return"";return{t2_bulb:"T2 Bulb",t2_cct:"T2 CCT",t1m:"T1M",t1_strip:"T1 Strip",t1:"T1"}[this.deviceContext.deviceType]||this.deviceContext.deviceType}connectedCallback(){super.connectedCallback(),0!==this._steps.length||this.preset||this._addDefaultStep()}updated(e){super.updated(e),e.has("preset")&&this.preset&&this._loadPreset(this.preset)}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._loopMode=e.loop_mode,this._loopCount=e.loop_count||3,this._endBehavior=e.end_behavior,this._steps=e.steps.map((e,t)=>({...e,id:`step-${t}-${Date.now()}`}))}_addDefaultStep(){this._steps=[{id:`step-0-${Date.now()}`,color_temp:4e3,brightness:50,transition:15,hold:60}]}_generateStepId(){return`step-${this._steps.length}-${Date.now()}`}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleLoopModeChange(e){this._loopMode=e.detail.value||"once"}_handleLoopCountChange(e){this._loopCount=e.detail.value||3}_handleEndBehaviorChange(e){this._endBehavior=e.detail.value||"maintain"}_hasIncompatibleEndpoints(){if(!this.hass||!this.selectedEntities.length)return!1;for(const e of this.selectedEntities){const t=this.hass.states[e];if(!t)continue;const i=t.attributes.supported_color_modes;if(!i||!i.includes("color_temp"))return!0}return!1}_handleStepFieldChange(e,t,i){this._steps=this._steps.map(s=>s.id===e?{...s,[t]:i.detail.value}:s)}_handleStepColorTempChange(e,t){const i=t.detail.value,s=100*Math.round(1e6/i/100);this._steps=this._steps.map(t=>t.id===e?{...t,color_temp:s}:t)}_addStep(){if(this._steps.length>=20)return;const e={id:this._generateStepId(),color_temp:4e3,brightness:50,transition:15,hold:60};this._steps=[...this._steps,e]}_removeStep(e){this._steps.length<=1||(this._steps=this._steps.filter(t=>t.id!==e))}_moveStepUp(e){if(e<=0)return;const t=[...this._steps],i=t[e-1];t[e-1]=t[e],t[e]=i,this._steps=t}_moveStepDown(e){if(e>=this._steps.length-1)return;const t=[...this._steps],i=t[e];t[e]=t[e+1],t[e+1]=i,this._steps=t}_duplicateStep(e){if(this._steps.length>=20)return;const t={...e,id:this._generateStepId()},i=this._steps.findIndex(t=>t.id===e.id),s=[...this._steps];s.splice(i+1,0,t),this._steps=s}_getPresetData(){const e=this._steps.map(({id:e,...t})=>t),t={name:this._name,icon:this._icon||void 0,steps:e,loop_mode:this._loopMode,end_behavior:this._endBehavior};return"loop"===this._loopMode&&(t.loop_count=this._loopCount),t}async _preview(){if(this.hass&&!this._previewing){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&0!==this._steps.length){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_renderStep(e,t){return N`
      <div class="step-item">
        <div class="step-header">
          <span class="step-number">Step ${t+1}</span>
          <div class="step-actions">
            <ha-icon-button
              @click=${()=>this._moveStepUp(t)}
              .disabled=${0===t}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.step_move_up")}"
            >
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${()=>this._moveStepDown(t)}
              .disabled=${t===this._steps.length-1}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.step_move_down")}"
            >
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${()=>this._duplicateStep(e)}
              .disabled=${this._steps.length>=20}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.step_duplicate")}"
            >
              <ha-icon icon="mdi:content-copy"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${()=>this._removeStep(e.id)}
              .disabled=${this._steps.length<=1}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.step_remove")}"
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>
        </div>
        <div class="step-fields">
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.color_temperature_label",{value:e.color_temp.toString()})}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{color_temp:{min_mireds:153,max_mireds:370}}}
              .value=${Math.round(1e6/e.color_temp)}
              @value-changed=${t=>this._handleStepColorTempChange(e.id,t)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.brightness_percent_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:1,max:100,mode:"slider",unit_of_measurement:"%"}}}
              .value=${e.brightness}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"brightness",t)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.transition_time_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:3600,step:.5,mode:"box",unit_of_measurement:"s"}}}
              .value=${e.transition}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"transition",t)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.hold_time_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:43200,step:1,mode:"box",unit_of_measurement:"s"}}}
              .value=${e.hold}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"hold",t)}
            ></ha-selector>
          </div>
        </div>
      </div>
    `}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){return N`
      <div class="editor-content">
        ${this.deviceContext?.deviceType?N`
          <div class="device-context-badge">
            <ha-icon icon="mdi:lightbulb-outline"></ha-icon>
            <span>${this._localize("editors.selected_device_type")}: ${this._deviceTypeLabel}</span>
          </div>
        `:""}
        <div class="form-row-pair">
          <div class="form-field">
            <span class="form-label">${this._localize("editors.name_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{text:{}}}
              .value=${this._name}
              @value-changed=${this._handleNameChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.icon_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{icon:{}}}
              .value=${this._icon}
              @value-changed=${this._handleIconChange}
            ></ha-selector>
            ${this._icon?"":N`<span class="form-hint">${this._localize("editors.icon_auto_hint")}</span>`}
          </div>
        </div>

        <div class="form-row-pair">
          <div class="form-field">
            <span class="form-label">${this._localize("editors.loop_mode_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:this._loopModeOptions,mode:"dropdown"}}}
              .value=${this._loopMode}
              @value-changed=${this._handleLoopModeChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.end_behavior_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:this._endBehaviorOptions,mode:"dropdown"}}}
              .value=${this._endBehavior}
              @value-changed=${this._handleEndBehaviorChange}
            ></ha-selector>
          </div>
        </div>

        ${"loop"===this._loopMode?N`
              <div class="form-row">
                <span class="form-label">${this._localize("editors.loop_count_label")}</span>
                <div class="form-input">
                  <ha-selector
                    .hass=${this.hass}
                    .selector=${{number:{min:1,max:100,mode:"box"}}}
                    .value=${this._loopCount}
                    @value-changed=${this._handleLoopCountChange}
                  ></ha-selector>
                </div>
              </div>
            `:""}

        <div class="form-section">
          <span class="form-label">${this._localize("editors.steps_label")}</span>
          <div class="step-list">
            ${0===this._steps.length?N`
                  <div class="empty-steps">
                    ${this._localize("editors.no_steps_message")}
                  </div>
                `:this._steps.map((e,t)=>this._renderStep(e,t))}

            <button
              class="add-step-btn ${this._steps.length>=20?"disabled":""}"
              @click=${this._addStep}
              ?disabled=${this._steps.length>=20}
            >
              <ha-icon icon="mdi:plus"></ha-icon>
              ${this._localize("editors.add_step_button")}
            </button>
          </div>
        </div>

        ${this._hasIncompatibleEndpoints()?N`
              <div class="error-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>One or more selected lights do not support color temperature control. CCT sequences require lights with color_temp capability. For T1M devices, select the white/CCT endpoint instead of the RGB ring endpoint.</span>
              </div>
            `:""}

        ${this.hasSelectedEntities?"":N`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_sequences")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?N`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  Stop
                </ha-button>
              `:N`
                <ha-button
                  @click=${this._preview}
                  .disabled=${this._previewing||0===this._steps.length||!this.hasSelectedEntities||!this.isCompatible||this._hasIncompatibleEndpoints()}
                  title=${this.hasSelectedEntities?this.isCompatible?this._hasIncompatibleEndpoints()?"Selected light does not support color temperature":"":"Selected light is not compatible":"Select entities in Activate tab first"}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  Preview
                </ha-button>
              `}
          <ha-button
            @click=${this._save}
            .disabled=${!this._name.trim()||0===this._steps.length||this._saving}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode?"Update":"Save"}
          </ha-button>
        </div>
      </div>
    `}};ut.styles=a`
    :host {
      display: block;
    }

    .editor-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .form-row-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-pair .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .form-section .form-label {
      min-width: unset;
    }

    .form-label {
      font-size: 14px;
      font-weight: 500;
      min-width: 120px;
      color: var(--secondary-text-color);
    }

    .form-input {
      flex: 1;
    }

    .step-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .step-item {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 16px;
    }

    .step-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .step-number {
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-color);
    }

    .step-actions {
      display: flex;
      gap: 4px;
    }

    .step-actions ha-icon-button {
      --mdc-icon-button-size: 32px;
      --mdc-icon-size: 18px;
    }

    .step-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 12px;
    }

    .step-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .step-field-label {
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .add-step-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 2px dashed var(--divider-color);
      border-radius: 8px;
      cursor: pointer;
      color: var(--secondary-text-color);
      transition: all 0.2s ease;
      background: transparent;
    }

    .add-step-btn:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }

    .add-step-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
    }

    .preview-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-left: 4px solid var(--warning-color, #ffc107);
      border-radius: 4px;
      font-size: 13px;
    }

    .preview-warning ha-icon {
      flex-shrink: 0;
      --mdc-icon-size: 18px;
    }

    .error-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-left: 4px solid var(--error-color, #db4437);
      border-radius: 4px;
      font-size: 13px;
    }

    .error-warning ha-icon {
      flex-shrink: 0;
      --mdc-icon-size: 18px;
    }

    .empty-steps {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text-color);
      background: var(--card-background-color);
      border-radius: 8px;
      border: 2px dashed var(--divider-color);
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        align-items: stretch;
      }

      .form-row-pair {
        grid-template-columns: 1fr;
      }

      .form-label {
        min-width: unset;
        margin-bottom: 4px;
      }

      .step-fields {
        grid-template-columns: 1fr;
      }
    }

    .device-context-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: var(--secondary-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      font-size: 13px;
      font-weight: 500;
      color: var(--secondary-text-color);
      margin-bottom: 8px;
    }

    .device-context-badge ha-icon {
      --mdc-icon-size: 16px;
    }

    .form-hint {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
      margin-top: -4px;
    }
  `,e([pe({attribute:!1})],ut.prototype,"hass",void 0),e([pe({type:Object})],ut.prototype,"preset",void 0),e([pe({type:Object})],ut.prototype,"translations",void 0),e([pe({type:Boolean})],ut.prototype,"editMode",void 0),e([pe({type:Boolean})],ut.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],ut.prototype,"isCompatible",void 0),e([pe({type:Array})],ut.prototype,"selectedEntities",void 0),e([pe({type:Boolean})],ut.prototype,"previewActive",void 0),e([pe({type:Object})],ut.prototype,"deviceContext",void 0),e([_e()],ut.prototype,"_name",void 0),e([_e()],ut.prototype,"_icon",void 0),e([_e()],ut.prototype,"_steps",void 0),e([_e()],ut.prototype,"_loopMode",void 0),e([_e()],ut.prototype,"_loopCount",void 0),e([_e()],ut.prototype,"_endBehavior",void 0),e([_e()],ut.prototype,"_saving",void 0),e([_e()],ut.prototype,"_previewing",void 0),ut=e([ce("cct-sequence-editor")],ut);const mt={t1:"T1 (20 segments)",t1m:"T1M (26 segments)",t1_strip:"T1 Strip (up to 50 segments)"},vt=[{x:.68,y:.31},{x:.17,y:.7},{x:.15,y:.06},{x:.42,y:.51},{x:.38,y:.16},{x:.22,y:.33}],ft=[{x:.68,y:.31},{x:.15,y:.06}],bt=[{x:.68,y:.31},{x:.17,y:.7}];let yt=class extends ne{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.previewActive=!1,this.stripSegmentCount=10,this._name="",this._icon="",this._deviceType="t1m",this._steps=[],this._loopMode="once",this._loopCount=3,this._endBehavior="maintain",this._clearSegments=!1,this._skipFirstInLoop=!1,this._saving=!1,this._previewing=!1,this._hasUserInteraction=!1}get _loopModeOptions(){return[{value:"once",label:this._localize("options.loop_mode_once")},{value:"count",label:this._localize("options.loop_mode_count")},{value:"continuous",label:this._localize("options.loop_mode_continuous")}]}get _endBehaviorOptions(){return[{value:"maintain",label:this._localize("options.end_behavior_maintain")},{value:"turn_off",label:this._localize("options.end_behavior_turn_off")}]}get _activationPatternOptions(){return[{value:"all",label:this._localize("options.activation_all")},{value:"sequential_forward",label:this._localize("options.activation_sequential_forward")},{value:"sequential_reverse",label:this._localize("options.activation_sequential_reverse")},{value:"random",label:this._localize("options.activation_random")},{value:"ping_pong",label:this._localize("options.activation_ping_pong")},{value:"center_out",label:this._localize("options.activation_center_out")},{value:"edges_in",label:this._localize("options.activation_edges_in")},{value:"paired",label:this._localize("options.activation_paired")}]}connectedCallback(){super.connectedCallback(),0!==this._steps.length||this.preset||this._addDefaultStep()}updated(e){super.updated(e),e.has("preset")&&(this.preset?(this._hasUserInteraction=!0,this._loadPreset(this.preset)):this._hasUserInteraction=!1),e.has("deviceContext")&&!this._hasUserInteraction&&this.deviceContext?.deviceType&&(this._deviceType=this.deviceContext.deviceType)}_getCurrentSegmentCount(){switch(this._deviceType){case"t1":return 20;case"t1m":default:return 26;case"t1_strip":return this.stripSegmentCount}}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._deviceType=e.device_type||"t1m",this._loopMode=e.loop_mode,this._loopCount=e.loop_count||3,this._endBehavior=e.end_behavior,this._clearSegments=e.clear_segments||!1,this._skipFirstInLoop=e.skip_first_in_loop||!1,this._steps=e.steps.map((e,t)=>{const i=e.colors.map(e=>{const t={r:e[0]??0,g:e[1]??0,b:e[2]??0};return Ae(t.r,t.g,t.b)});let s="individual";"gradient"===e.mode?s="gradient":"blocks_expand"===e.mode||"blocks_repeat"===e.mode?s="blocks":"individual"===e.mode&&(s="individual");const o=new Map;if(e.segment_colors&&Array.isArray(e.segment_colors))for(const t of e.segment_colors){const e="number"==typeof t.segment?t.segment:parseInt(t.segment,10),i=t.color;if("r"in i&&"g"in i&&"b"in i){if(0===i.r&&0===i.g&&0===i.b)continue;o.set(e-1,Ae(i.r,i.g,i.b))}}return{...e,id:`step-${t}-${Date.now()}`,coloredSegments:o,colorPalette:[...vt],gradientColors:i.length>=2?i:[...ft],blockColors:i.length>=1?i:[...bt],expandBlocks:"blocks_expand"===e.mode,patternMode:s,gradientMirror:!1,gradientRepeat:1,gradientReverse:!1,gradientInterpolation:"shortest",gradientWave:!1,gradientWaveCycles:1}})}_addDefaultStep(){this._steps=[{id:`step-0-${Date.now()}`,segments:"all",colors:[[255,0,0]],mode:"blocks_expand",duration:15,hold:60,activation_pattern:"all",coloredSegments:new Map,colorPalette:[...vt],gradientColors:[...ft],blockColors:[...bt],expandBlocks:!1,patternMode:"individual",gradientMirror:!1,gradientRepeat:1,gradientReverse:!1,gradientInterpolation:"shortest",gradientWave:!1,gradientWaveCycles:1}]}_generateStepId(){return`step-${this._steps.length}-${Date.now()}`}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleDeviceTypeChange(e){this._deviceType=e.detail.value||"t1m",this._hasUserInteraction=!0}_handleLoopModeChange(e){this._loopMode=e.detail.value||"once"}_handleLoopCountChange(e){this._loopCount=e.detail.value||3}_handleEndBehaviorChange(e){this._endBehavior=e.detail.value||"maintain"}_handleClearSegmentsChange(e){this._clearSegments=e.target.checked}_handleSkipFirstInLoopChange(e){this._skipFirstInLoop=e.target.checked}_hasInvalidGradientSteps(){return this._steps.some(e=>"gradient"===e.patternMode&&e.gradientColors.length<2)}_handleStepFieldChange(e,t,i){this._steps=this._steps.map(s=>s.id===e?{...s,[t]:i.detail.value}:s)}_handleStepColorValueChange(e,t){const{value:i}=t.detail;this._steps=this._steps.map(t=>{if(t.id!==e)return t;if(i instanceof Map){const e=Array.from(i.keys()).sort((e,t)=>e-t),s=e.length>0?e.map(e=>e+1).join(","):"all";return{...t,coloredSegments:i,segments:s}}return t})}_handleStepGradientColorsChange(e,t){const{colors:i}=t.detail;Array.isArray(i)&&(this._steps=this._steps.map(t=>t.id===e?{...t,gradientColors:i}:t))}_handleStepBlockColorsChange(e,t){const{colors:i}=t.detail;Array.isArray(i)&&(this._steps=this._steps.map(t=>t.id===e?{...t,blockColors:i}:t))}_handleStepColorPaletteChange(e,t){const{colors:i}=t.detail;Array.isArray(i)&&(this._steps=this._steps.map(t=>t.id===e?{...t,colorPalette:i}:t))}_addStep(){if(this._steps.length>=20)return;const e=this._steps[this._steps.length-1],t={id:this._generateStepId(),segments:e?.segments||"all",colors:e?.colors?.map(e=>Array.isArray(e)?[...e]:e)||[[255,0,0]],mode:e?.mode||"blocks_expand",duration:15,hold:60,activation_pattern:"all",coloredSegments:e?new Map(e.coloredSegments):new Map,colorPalette:e?e.colorPalette.map(e=>({...e})):[...vt],gradientColors:e?e.gradientColors.map(e=>({...e})):[...ft],blockColors:e?e.blockColors.map(e=>({...e})):[...bt],expandBlocks:e?.expandBlocks||!1,patternMode:e?.patternMode||"individual",gradientMirror:e?.gradientMirror||!1,gradientRepeat:e?.gradientRepeat||1,gradientReverse:e?.gradientReverse||!1,gradientInterpolation:e?.gradientInterpolation||"shortest",gradientWave:e?.gradientWave||!1,gradientWaveCycles:e?.gradientWaveCycles||1};this._steps=[...this._steps,t]}_removeStep(e){this._steps.length<=1||(this._steps=this._steps.filter(t=>t.id!==e))}_moveStepUp(e){if(e<=0)return;const t=[...this._steps],i=t[e-1];t[e-1]=t[e],t[e]=i,this._steps=t}_moveStepDown(e){if(e>=this._steps.length-1)return;const t=[...this._steps],i=t[e];t[e]=t[e+1],t[e+1]=i,this._steps=t}_duplicateStep(e){if(this._steps.length>=20)return;const t={...e,id:this._generateStepId(),colors:e.colors?.map(e=>Array.isArray(e)?[...e]:e)||[[255,0,0]],coloredSegments:new Map(e.coloredSegments),colorPalette:e.colorPalette.map(e=>({...e})),gradientColors:e.gradientColors.map(e=>({...e})),blockColors:e.blockColors.map(e=>({...e}))},i=this._steps.findIndex(t=>t.id===e.id),s=[...this._steps];s.splice(i+1,0,t),this._steps=s}_getPresetData(){const e=this._getCurrentSegmentCount(),t=this._steps.map(({id:t,coloredSegments:i,colorPalette:s,gradientColors:o,blockColors:r,expandBlocks:a,patternMode:n,gradientMirror:l,gradientRepeat:c,gradientReverse:d,gradientInterpolation:h,gradientWave:p,gradientWaveCycles:_,...g})=>{const u=[],m=new Set;for(const[e,t]of i){const i=Te(t.x,t.y,255);u.push({segment:e+1,color:{r:i.r,g:i.g,b:i.b}}),m.add(e+1)}for(let t=1;t<=e;t++)m.has(t)||u.push({segment:t,color:{r:0,g:0,b:0}});return{...g,segment_colors:u}}),i={name:this._name,icon:this._icon||void 0,device_type:this._deviceType,steps:t,loop_mode:this._loopMode,end_behavior:this._endBehavior,clear_segments:this._clearSegments,skip_first_in_loop:this._skipFirstInLoop};return"count"===this._loopMode&&(i.loop_count=this._loopCount),i}async _preview(){if(this.hass&&!this._previewing){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&0!==this._steps.length){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_renderStep(e,t){return N`
      <div class="step-item">
        <div class="step-header">
          <span class="step-number">Step ${t+1}</span>
          <div class="step-actions">
            <ha-icon-button
              @click=${()=>this._moveStepUp(t)}
              .disabled=${0===t}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.step_move_up")}"
            >
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${()=>this._moveStepDown(t)}
              .disabled=${t===this._steps.length-1}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.step_move_down")}"
            >
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${()=>this._duplicateStep(e)}
              .disabled=${this._steps.length>=20}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.step_duplicate")}"
            >
              <ha-icon icon="mdi:content-copy"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              @click=${()=>this._removeStep(e.id)}
              .disabled=${this._steps.length<=1}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.step_remove")}"
            >
              <ha-icon icon="mdi:delete"></ha-icon>
            </ha-icon-button>
          </div>
        </div>
        <div class="step-segment-selector">
          <segment-selector
            .hass=${this.hass}
            .mode=${"color"}
            .maxSegments=${this._getCurrentSegmentCount()}
            .colorValue=${e.coloredSegments}
            .colorPalette=${e.colorPalette}
            .gradientColors=${e.gradientColors}
            .blockColors=${e.blockColors}
            .expandBlocks=${e.expandBlocks}
            .gradientMirror=${e.gradientMirror}
            .gradientRepeat=${e.gradientRepeat}
            .gradientReverse=${e.gradientReverse}
            .gradientInterpolation=${e.gradientInterpolation}
            .gradientWave=${e.gradientWave}
            .gradientWaveCycles=${e.gradientWaveCycles}
            .initialPatternMode=${e.patternMode}
            .label=${this._localize("editors.segment_grid_label")}
            .translations=${this.translations}
            @color-value-changed=${t=>this._handleStepColorValueChange(e.id,t)}
            @color-palette-changed=${t=>this._handleStepColorPaletteChange(e.id,t)}
            @gradient-colors-changed=${t=>this._handleStepGradientColorsChange(e.id,t)}
            @block-colors-changed=${t=>this._handleStepBlockColorsChange(e.id,t)}
          ></segment-selector>
        </div>
        <div class="step-fields">
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.activation_pattern_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:this._activationPatternOptions,mode:"dropdown"}}}
              .value=${e.activation_pattern}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"activation_pattern",t)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.duration_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:3600,step:.5,mode:"box",unit_of_measurement:"s"}}}
              .value=${e.duration}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"duration",t)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.hold_time_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:43200,step:1,mode:"box",unit_of_measurement:"s"}}}
              .value=${e.hold}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"hold",t)}
            ></ha-selector>
          </div>
        </div>
      </div>
    `}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){const e=Object.entries(mt).map(([e,t])=>({value:e,label:t}));return N`
      <div class="editor-content">
        <div class="form-row-triple">
          <div class="form-field">
            <span class="form-label">${this._localize("editors.name_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{text:{}}}
              .value=${this._name}
              @value-changed=${this._handleNameChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.icon_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{icon:{}}}
              .value=${this._icon}
              @value-changed=${this._handleIconChange}
            ></ha-selector>
            ${this._icon?"":N`<span class="form-hint">${this._localize("editors.icon_auto_hint")}</span>`}
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.device_type_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:e,mode:"dropdown"}}}
              .value=${this._deviceType}
              @value-changed=${this._handleDeviceTypeChange}
            ></ha-selector>
          </div>
        </div>

        <div class="form-row-pair">
          <div class="form-field">
            <span class="form-label">${this._localize("editors.loop_mode_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:this._loopModeOptions,mode:"dropdown"}}}
              .value=${this._loopMode}
              @value-changed=${this._handleLoopModeChange}
            ></ha-selector>
          </div>
          <div class="form-field">
            <span class="form-label">${this._localize("editors.end_behavior_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:this._endBehaviorOptions,mode:"dropdown"}}}
              .value=${this._endBehavior}
              @value-changed=${this._handleEndBehaviorChange}
            ></ha-selector>
          </div>
        </div>

        ${"count"===this._loopMode?N`
              <div class="form-row">
                <span class="form-label">${this._localize("editors.loop_count_label")}</span>
                <div class="form-input">
                  <ha-selector
                    .hass=${this.hass}
                    .selector=${{number:{min:1,max:100,mode:"box"}}}
                    .value=${this._loopCount}
                    @value-changed=${this._handleLoopCountChange}
                  ></ha-selector>
                </div>
              </div>
            `:""}

        <div class="form-section toggle-row">
          <div class="toggle-item">
            <span class="toggle-label">Clear Segments</span>
            <ha-switch
              .checked=${this._clearSegments}
              @change=${this._handleClearSegmentsChange}
            ></ha-switch>
          </div>
          <div class="toggle-item">
            <span class="toggle-label">${this._localize("editors.skip_first_step_label")}</span>
            <ha-switch
              .checked=${this._skipFirstInLoop}
              @change=${this._handleSkipFirstInLoopChange}
            ></ha-switch>
          </div>
        </div>

        <div class="form-section">
          <span class="form-label">${this._localize("editors.steps_label")}</span>
          <div class="step-list">
            ${0===this._steps.length?N`
                  <div class="empty-steps">
                    ${this._localize("editors.no_steps_message")}
                  </div>
                `:this._steps.map((e,t)=>this._renderStep(e,t))}

            <button
              class="add-step-btn ${this._steps.length>=20?"disabled":""}"
              @click=${this._addStep}
              ?disabled=${this._steps.length>=20}
            >
              <ha-icon icon="mdi:plus"></ha-icon>
              ${this._localize("editors.add_step_button")}
            </button>
          </div>
        </div>

        ${this._hasInvalidGradientSteps()?N`
              <div class="error-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>Gradient mode requires at least 2 colors. Please add more colors to steps using gradient mode or change the mode.</span>
              </div>
            `:""}

        ${this.hasSelectedEntities?"":N`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_sequences")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?N`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  Stop
                </ha-button>
              `:N`
                <ha-button
                  @click=${this._preview}
                  .disabled=${this._previewing||0===this._steps.length||!this.hasSelectedEntities||!this.isCompatible||this._hasInvalidGradientSteps()}
                  title=${this.hasSelectedEntities?this.isCompatible?this._hasInvalidGradientSteps()?"Fix gradient validation errors first":"":"Selected light is not compatible":"Select entities in Activate tab first"}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  Preview
                </ha-button>
              `}
          <ha-button
            @click=${this._save}
            .disabled=${!this._name.trim()||0===this._steps.length||this._saving||this._hasInvalidGradientSteps()}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode?"Update":"Save"}
          </ha-button>
        </div>
      </div>
    `}};yt.styles=[Ee,a`
    :host {
      display: block;
    }

    .editor-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .form-row-pair {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-triple {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row-pair .form-field,
    .form-row-triple .form-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }

    .form-section.toggle-row {
      flex-direction: row;
      gap: 24px;
      flex-wrap: wrap;
    }

    .toggle-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toggle-label {
      font-size: 14px;
      color: var(--secondary-text-color);
    }

    .form-section .form-label {
      min-width: unset;
    }

    .form-label {
      font-size: 14px;
      font-weight: 500;
      min-width: 120px;
      color: var(--secondary-text-color);
    }

    .form-input {
      flex: 1;
    }

    .step-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .step-item {
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 16px;
    }

    .step-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .step-number {
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-color);
    }

    .step-actions {
      display: flex;
      gap: 4px;
    }

    .step-actions ha-icon-button {
      --mdc-icon-button-size: 32px;
      --mdc-icon-size: 18px;
    }

    .step-segment-selector {
      width: 100%;
      margin-bottom: 16px;
    }

    .step-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }

    .step-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .step-field-label {
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    .step-field.full-width {
      grid-column: 1 / -1;
    }

    /* Color picker styles (color-picker-grid, color-item, color-swatch,
       color-picker-modal, color-remove, add-color-btn) are inherited
       from panelStyles (styles.ts) */

    .add-step-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      border: 2px dashed var(--divider-color);
      border-radius: 8px;
      cursor: pointer;
      color: var(--secondary-text-color);
      transition: all 0.2s ease;
      background: transparent;
    }

    .add-step-btn:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }

    .add-step-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--divider-color);
    }

    .preview-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-left: 4px solid var(--warning-color, #ffc107);
      border-radius: 4px;
      font-size: 13px;
    }

    .preview-warning ha-icon {
      flex-shrink: 0;
      --mdc-icon-size: 18px;
    }

    .error-warning {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-left: 4px solid var(--error-color, #db4437);
      border-radius: 4px;
      font-size: 13px;
    }

    .error-warning ha-icon {
      flex-shrink: 0;
      --mdc-icon-size: 18px;
    }

    .empty-steps {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text-color);
      background: var(--card-background-color);
      border-radius: 8px;
      border: 2px dashed var(--divider-color);
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        align-items: stretch;
      }

      .form-row-pair,
      .form-row-triple {
        grid-template-columns: 1fr;
      }

      .form-label {
        min-width: unset;
        margin-bottom: 4px;
      }

      .step-fields {
        grid-template-columns: 1fr;
      }
    }

    .form-hint {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
      margin-top: -4px;
    }
  `],e([pe({attribute:!1})],yt.prototype,"hass",void 0),e([pe({type:Object})],yt.prototype,"preset",void 0),e([pe({type:Object})],yt.prototype,"translations",void 0),e([pe({type:Boolean})],yt.prototype,"editMode",void 0),e([pe({type:Boolean})],yt.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],yt.prototype,"isCompatible",void 0),e([pe({type:Boolean})],yt.prototype,"previewActive",void 0),e([pe({type:Number})],yt.prototype,"stripSegmentCount",void 0),e([pe({type:Object})],yt.prototype,"deviceContext",void 0),e([_e()],yt.prototype,"_name",void 0),e([_e()],yt.prototype,"_icon",void 0),e([_e()],yt.prototype,"_deviceType",void 0),e([_e()],yt.prototype,"_steps",void 0),e([_e()],yt.prototype,"_loopMode",void 0),e([_e()],yt.prototype,"_loopCount",void 0),e([_e()],yt.prototype,"_endBehavior",void 0),e([_e()],yt.prototype,"_clearSegments",void 0),e([_e()],yt.prototype,"_skipFirstInLoop",void 0),e([_e()],yt.prototype,"_saving",void 0),e([_e()],yt.prototype,"_previewing",void 0),e([_e()],yt.prototype,"_hasUserInteraction",void 0),yt=e([ce("segment-sequence-editor")],yt);let xt=class extends ne{constructor(){super(...arguments),this.curvature=1,this.width=300,this.height=300,this._isDragging=!1,this.MIN_CURVATURE=.2,this.MAX_CURVATURE=6,this.STEP=.01,this._handleCanvasPointerMove=e=>{this._isDragging&&(e.preventDefault(),this._handleCanvasInteraction(e))},this._handleCanvasPointerUp=()=>{this._isDragging=!1,window.removeEventListener("mousemove",this._handleCanvasPointerMove),window.removeEventListener("mouseup",this._handleCanvasPointerUp),window.removeEventListener("touchmove",this._handleCanvasPointerMove),window.removeEventListener("touchend",this._handleCanvasPointerUp)}}firstUpdated(){this._drawCurve()}updated(e){e.has("curvature")&&this._canvas&&this._drawCurve()}_getControlPoint(){const e=this.curvature;let t;t=e<=1?(e-this.MIN_CURVATURE)/(1-this.MIN_CURVATURE)*.5:.5+(e-1)/(this.MAX_CURVATURE-1)*.5;return{cx:.05+.9*t,cy:.95-.9*t}}_bezierY(e,t){return 2*(1-e)*e*t+e*e}_bezierX(e,t){return 2*(1-e)*e*t+e*e}_getCurveColor(){const e=getComputedStyle(this);return this.curvature<.95?e.getPropertyValue("--warning-color").trim()||"#ffc107":this.curvature>1.05?e.getPropertyValue("--primary-color").trim()||"#03a9f4":e.getPropertyValue("--success-color").trim()||"#4caf50"}_drawCurve(){const e=this._canvas;if(!e)return;const t=e.getContext("2d");if(!t)return;const{width:i,height:s}=this,o=24,r=i-48,a=s-48;e.width=i,e.height=s,t.clearRect(0,0,i,s),this._drawGrid(t,o,r,a);const{cx:n,cy:l}=this._getControlPoint(),c=this._getCurveColor(),d=document.createElement("div");d.style.color=c,document.body.appendChild(d);const h=getComputedStyle(d).color;document.body.removeChild(d);const p=h.match(/\d+/g),_=p?p[0]:"3",g=p?p[1]:"169",u=p?p[2]:"244";t.beginPath(),t.moveTo(o,s-o);const m=100;for(let e=0;e<=m;e++){const i=e/m,c=o+this._bezierX(i,n)*r,d=s-o-this._bezierY(i,l)*a;t.lineTo(c,d)}t.lineTo(o+r,s-o),t.closePath();const v=t.createLinearGradient(0,o,0,s-o);v.addColorStop(0,`rgba(${_}, ${g}, ${u}, 0.15)`),v.addColorStop(1,`rgba(${_}, ${g}, ${u}, 0.02)`),t.fillStyle=v,t.fill(),t.beginPath();for(let e=0;e<=m;e++){const i=e/m,c=o+this._bezierX(i,n)*r,d=s-o-this._bezierY(i,l)*a;0===e?t.moveTo(c,d):t.lineTo(c,d)}t.strokeStyle=c,t.lineWidth=3,t.lineCap="round",t.lineJoin="round",t.stroke();const f=s-o-a;t.beginPath(),t.arc(o+r,f,6,0,2*Math.PI),t.fillStyle=c,t.fill(),t.strokeStyle="white",t.lineWidth=2,t.stroke()}_drawGrid(e,t,i,s){const o=getComputedStyle(this).getPropertyValue("--secondary-text-color").trim()||"rgba(128, 128, 128, 0.5)";e.strokeStyle=o,e.globalAlpha=.3,e.lineWidth=1,e.setLineDash([4,4]);for(let o=0;o<=3;o++){const r=t+i/3*o;e.beginPath(),e.moveTo(r,t),e.lineTo(r,t+s),e.stroke()}for(let o=0;o<=3;o++){const r=t+s/3*o;e.beginPath(),e.moveTo(t,r),e.lineTo(t+i,r),e.stroke()}e.globalAlpha=1,e.setLineDash([])}_handleCanvasPointerDown(e){e.preventDefault(),this._isDragging=!0,this._handleCanvasInteraction(e),e instanceof MouseEvent?(window.addEventListener("mousemove",this._handleCanvasPointerMove),window.addEventListener("mouseup",this._handleCanvasPointerUp)):(window.addEventListener("touchmove",this._handleCanvasPointerMove,{passive:!1}),window.addEventListener("touchend",this._handleCanvasPointerUp))}_handleCanvasInteraction(e){const t=this._canvas;if(!t)return;const i=t.getBoundingClientRect();let s;if("touches"in e){const t=e.touches[0];if(!t)return;s=t.clientY}else s=e.clientY;const o=this.height-48,r=s-i.top-24,a=1-Math.max(0,Math.min(1,r/o));let n;if(a>=.5){n=1-2*(a-.5)*(1-this.MIN_CURVATURE)}else{n=1+2*(.5-a)*(this.MAX_CURVATURE-1)}n=Math.round(n/this.STEP)*this.STEP,n=Math.max(this.MIN_CURVATURE,Math.min(this.MAX_CURVATURE,n));const l=parseFloat(n.toFixed(2));this.dispatchEvent(new CustomEvent("curvature-input",{detail:{curvature:l},bubbles:!0,composed:!0}))}render(){return N`
      <div class="curve-editor-container">
        <div class="curve-header">
          <span class="title">${this.hass.localize("component.aqara_advanced_lighting.panel.transition_curve.title")}</span>
          <span class="subtitle">${this.hass.localize("component.aqara_advanced_lighting.panel.transition_curve.subtitle")}</span>
        </div>

        <div class="curve-canvas-wrapper">
          <div class="graph-container">
            <div class="graph-row">
              <div class="y-axis-label">
                <ha-icon icon="mdi:brightness-6"></ha-icon>
              </div>
              <canvas
                width="${this.width}"
                height="${this.height}"
                @mousedown=${this._handleCanvasPointerDown}
                @touchstart=${this._handleCanvasPointerDown}
              ></canvas>
              <div class="graph-spacer"></div>
            </div>
            <div class="x-axis-label">
              <ha-icon icon="mdi:clock-outline"></ha-icon>
            </div>
          </div>
        </div>
      </div>
    `}};var $t;xt.styles=a`
    :host {
      display: block;
    }

    .curve-editor-container {
      background: var(--card-background-color);
      overflow: hidden;
    }

    .curve-header {
      padding: 12px 8px 8px;
    }

    .curve-header .title {
      font-size: var(--ha-font-size-l, 16px);
      font-weight: var(--ha-font-weight-medium, 500);
      color: var(--primary-text-color);
      display: block;
      margin-bottom: 4px;
    }

    .curve-header .subtitle {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
    }

    .curve-canvas-wrapper {
      position: relative;
      padding: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .graph-container {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .graph-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .y-axis-label {
      display: flex;
      align-items: center;
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
    }

    .graph-spacer {
      width: 20px;
      flex-shrink: 0;
    }

    .x-axis-label {
      display: flex;
      justify-content: center;
      padding-top: 8px;
      color: var(--secondary-text-color);
      --mdc-icon-size: 20px;
      width: 100%;
    }

    canvas {
      display: block;
      cursor: ns-resize;
      border-radius: 8px;
      background: var(--card-background-color);
    }
  `,e([pe({attribute:!1})],xt.prototype,"hass",void 0),e([pe({type:Number})],xt.prototype,"curvature",void 0),e([pe({type:Number})],xt.prototype,"width",void 0),e([pe({type:Number})],xt.prototype,"height",void 0),e([_e()],xt.prototype,"_isDragging",void 0),e([ge("canvas")],xt.prototype,"_canvas",void 0),xt=e([ce("transition-curve-editor")],xt);let wt=$t=class extends ne{constructor(){super(...arguments),this.narrow=!1,this._loading=!0,this._selectedEntities=[],this._brightness=100,this._useCustomBrightness=!1,this._collapsed={},this._hasIncompatibleLights=!1,this._favorites=[],this._activeFavoriteId=null,this._showFavoriteInput=!1,this._favoriteInputName="",this._activeTab="activate",this._effectPreviewActive=!1,this._cctPreviewActive=!1,this._segmentSequencePreviewActive=!1,this._sortPreferences={},this._frontendVersion="0.9.0",this._supportedEntities=new Map,this._z2mInstances=[],this._localCurvature=1,this._applyingCurvature=!1,this._isExporting=!1,this._isImporting=!1,this._translations=et,this._fileInputRef=null,this._tileCardRef=new Se,this._tileCards=new Map}_localize(e,t){const i=e.split(".");let s=this._translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}return"string"!=typeof s?e:(t&&Object.keys(t).forEach(e=>{const i=t[e];void 0!==i&&(s=s.replace(`{${e}}`,i))}),s)}firstUpdated(){this._loadPresets(),this._loadFavorites(),this._loadUserPresets(),this._loadSortPreferences(),this._loadBackendVersion(),this._loadSupportedEntities()}updated(e){super.updated(e),e.has("hass")&&void 0===e.get("hass")&&(this._loadPresets(),this._loadFavorites(),this._loadUserPresets(),this._loadSupportedEntities()),this._updateTileCard()}async _updateTileCard(){const e=this._tileCardRef.value;if(!e||!this.hass)return void(this._tileCards.size>0&&this._tileCards.clear());if(!this._selectedEntities.length)return this._tileCards.forEach(e=>{e.parentElement&&e.remove()}),void this._tileCards.clear();await customElements.whenDefined("hui-tile-card");const t=new Set(this._selectedEntities);for(const[i,s]of this._tileCards.entries())t.has(i)&&s.parentElement===e||(s.parentElement&&s.remove(),this._tileCards.delete(i));for(const t of this._selectedEntities){let i=this._tileCards.get(t);i&&i.parentElement===e||(i=document.createElement("hui-tile-card"),e.appendChild(i),this._tileCards.set(t,i));try{i.setConfig({type:"tile",entity:t,features:[{type:"light-brightness"}]}),i.hass=this.hass}catch(e){console.warn("Failed to configure tile card for",t,":",e)}}}async _loadPresets(){try{const e=await fetch("/api/aqara_advanced_lighting/presets");if(!e.ok)throw new Error(`HTTP error ${e.status}`);this._presets=await e.json(),this._loading=!1}catch(e){this._error=e instanceof Error?e.message:this._localize("errors.loading_presets_generic"),this._loading=!1}}async _loadFavorites(){if(this.hass)try{const e=await this.hass.callApi("GET","aqara_advanced_lighting/favorites");this._favorites=e.favorites||[]}catch(e){console.warn("Failed to load favorites:",e)}}async _loadUserPresets(){if(this.hass)try{this._userPresets=await this.hass.callApi("GET","aqara_advanced_lighting/user_presets")}catch(e){console.warn("Failed to load user presets:",e)}}_loadSortPreferences(){try{const e=localStorage.getItem("aqara_lighting_sort_preferences");if(e){const t=JSON.parse(e);this._sortPreferences={...t}}}catch(e){console.warn("Failed to load sort preferences:",e)}}_getSortPreference(e){return this._sortPreferences[e]||"name-asc"}async _loadBackendVersion(){try{const e=await fetch("/api/aqara_advanced_lighting/version");if(!e.ok)return void console.warn("Failed to load backend version:",e.status);const t=await e.json();this._backendVersion=t.version}catch(e){console.warn("Failed to load backend version:",e)}}async _loadSupportedEntities(){try{const e=await fetch("/api/aqara_advanced_lighting/supported_entities");if(!e.ok)return void console.warn("Failed to load supported entities:",e.status);const t=await e.json(),i=new Map;for(const e of t.entities||[])i.set(e.entity_id,{device_type:e.device_type,model_id:e.model_id,z2m_friendly_name:e.z2m_friendly_name});for(const e of t.light_groups||[])i.set(e.entity_id,{device_type:e.device_type,model_id:"light_group",z2m_friendly_name:e.friendly_name,is_group:!0,member_count:e.member_count});this._supportedEntities=i,this._z2mInstances=t.instances||[]}catch(e){console.warn("Failed to load supported entities:",e)}}_saveSortPreferences(){try{localStorage.setItem("aqara_lighting_sort_preferences",JSON.stringify(this._sortPreferences))}catch(e){console.warn("Failed to save sort preferences:",e)}}_setSortPreference(e,t){this._sortPreferences={...this._sortPreferences,[e]:t},this._saveSortPreferences()}_sortUserEffectPresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserPatternPresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserCCTSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserSegmentSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortDynamicEffectPresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortSegmentPatternPresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortCCTSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortSegmentSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_groupPresetsByDeviceType(e){const t=[],i=new Map;for(const s of e)if(s.device_type){const e=i.get(s.device_type)||[];e.push(s),i.set(s.device_type,e)}else t.push(s);return{ungrouped:t,grouped:i}}async _saveUserPreset(e,t){if(this.hass)try{await this.hass.callApi("POST","aqara_advanced_lighting/user_presets",{type:e,data:t}),await this._loadUserPresets()}catch(e){console.error("Failed to save user preset:",e)}}async _updateUserPreset(e,t,i){if(this.hass)try{await this.hass.callApi("PUT",`aqara_advanced_lighting/user_presets/${e}/${t}`,i),await this._loadUserPresets()}catch(e){console.error("Failed to update user preset:",e)}}async _deleteUserPreset(e,t){if(this.hass)try{await this.hass.callApi("DELETE",`aqara_advanced_lighting/user_presets/${e}/${t}`),await this._loadUserPresets()}catch(e){console.error("Failed to delete user preset:",e)}}_setActiveTab(e){this._activeTab=e}_handleTabChange(e){const t=e.detail.name;t&&t!==this._activeTab&&(this._activeTab=t)}_addFavorite(){if(!this._selectedEntities.length)return;const e=this._selectedEntities[0],t=1===this._selectedEntities.length&&e?this._getEntityFriendlyName(e):`${this._selectedEntities.length} lights`;this._favoriteInputName=t,this._showFavoriteInput=!0}async _saveFavorite(){if(this._selectedEntities.length&&this.hass){try{const e=await this.hass.callApi("POST","aqara_advanced_lighting/favorites",{entities:this._selectedEntities,name:this._favoriteInputName||void 0});this._favorites=[...this._favorites,e.favorite]}catch(e){console.error("Failed to add favorite:",e)}this._cancelFavoriteInput()}else this._cancelFavoriteInput()}_cancelFavoriteInput(){this._showFavoriteInput=!1,this._favoriteInputName=""}_handleFavoriteNameChange(e){this._favoriteInputName=e.detail.value||""}_handleFavoriteNameKeydown(e){"Enter"===e.key?(e.preventDefault(),this._saveFavorite()):"Escape"===e.key&&(e.preventDefault(),this._cancelFavoriteInput())}async _removeFavorite(e){if(this.hass)try{await this.hass.callApi("DELETE",`aqara_advanced_lighting/favorites/${e}`),this._favorites=this._favorites.filter(t=>t.id!==e)}catch(e){console.error("Failed to remove favorite:",e)}}_selectFavorite(e){this._selectedEntities=[...e.entities],this._activeFavoriteId=e.id,this._loadCurvatureFromEntity()}_getEntityFriendlyName(e){if(!this.hass)return e;const t=this.hass.states[e];return t&&t.attributes.friendly_name?t.attributes.friendly_name:e.split(".")[1]?.replace(/_/g," ")||e}_getEntityIcon(e){if(!this.hass)return"mdi:lightbulb";const t=this.hass.states[e];if(t){if(t.attributes.icon)return t.attributes.icon;if("light"===e.split(".")[0])return"mdi:lightbulb"}return"mdi:lightbulb"}_getEntityState(e){if(!this.hass)return"unavailable";const t=this.hass.states[e];return t?t.state:"unavailable"}_getEntityColor(e){if(!this.hass)return null;const t=this.hass.states[e];if(!t||"on"!==t.state)return null;if(t.attributes.rgb_color){const[e,i,s]=t.attributes.rgb_color;return`rgb(${e}, ${i}, ${s})`}if(t.attributes.hs_color&&Array.isArray(t.attributes.hs_color)){const e=t.attributes.hs_color;if(e.length>=2&&"number"==typeof e[0]&&"number"==typeof e[1]){const t=e[0],i=e[1]/100*255,s=i*(1-Math.abs(t/60%2-1)),o=255-i;let r=0,a=0,n=0;return t<60?(r=i,a=s,n=0):t<120?(r=s,a=i,n=0):t<180?(r=0,a=i,n=s):t<240?(r=0,a=s,n=i):t<300?(r=s,a=0,n=i):(r=i,a=0,n=s),`rgb(${Math.round(r+o)}, ${Math.round(a+o)}, ${Math.round(n+o)})`}}return null}_getSelectedDeviceTypes(){if(!this._selectedEntities.length||!this.hass)return this._hasIncompatibleLights=!1,[];const e=new Set;let t=!1;for(const i of this._selectedEntities){const s=this.hass.states[i];if(!s)continue;const o=this._supportedEntities.get(i);if(o){if("t1m"===o.device_type){const t=s.attributes.supported_color_modes;t&&Array.isArray(t)&&t.some(e=>["xy","hs","rgb","rgbw","rgbww"].includes(e))?e.add("t1m"):e.add("t1m_white");continue}if(o.device_type&&"unknown"!==o.device_type){e.add(o.device_type);continue}}const r=s.attributes.effect_list;r&&Array.isArray(r)?r.includes("flow1")||r.includes("flow2")||r.includes("rolling")?e.add("t1m"):r.includes("rainbow1")||r.includes("rainbow2")||r.includes("chasing")||r.includes("flicker")||r.includes("dash")?e.add("t1_strip"):r.includes("candlelight")?e.add("t2_bulb"):t=!0:r||void 0===s.attributes.color_temp?t=!0:e.add("t2_cct")}return this._hasIncompatibleLights=t,Array.from(e)}_getT1StripSegmentCount(){if(!this._selectedEntities.length||!this.hass)return 10;for(const e of this._selectedEntities){const t=this.hass.states[e];if(!t)continue;const i=t.attributes.effect_list;if(i&&Array.isArray(i)&&(i.includes("rainbow1")||i.includes("rainbow2")||i.includes("chasing")||i.includes("flicker")||i.includes("dash"))){let i;const s=t.attributes.length;if(s&&"number"==typeof s&&s>0&&(i=s),void 0===i){const t=e.split(".")[1]||"";for(const e of["number","sensor"]){const s=`${e}.${t}_length`,o=this.hass.states[s];if(o&&o.state&&"unknown"!==o.state&&"unavailable"!==o.state){const e=parseFloat(o.state);if(!isNaN(e)&&e>0){i=e;break}}}}if(void 0!==i&&i>0)return Math.floor(5*i)}}return 10}_getDeviceContextForEditor(e){const t=this._getSelectedDeviceTypes();if(0===t.length)return{deviceType:null,hasSelection:!1};let i=null;switch(e){case"effect":i=t.find(e=>"t2_bulb"===e||"t1m"===e||"t1_strip"===e||"t1"===e)??null;break;case"pattern":case"segment":i=t.find(e=>"t1m"===e||"t1_strip"===e||"t1"===e)??null;break;case"cct":i=t[0]??null}return{deviceType:i,hasSelection:!0}}_hasRGBColorMode(e){const t=e.attributes.supported_color_modes;return!!t&&Array.isArray(t)&&t.some(e=>["xy","hs","rgb","rgbw","rgbww"].includes(e))}_isT1MEntity(e){const t=e.attributes.effect_list;return!!t&&Array.isArray(t)&&t.includes("flow1")}_isEffectsCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i)||0===i.length)&&!(this._isT1MEntity(t)&&!this._hasRGBColorMode(t))})}_isPatternsCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i))&&(!(!i.includes("flow1")&&!i.includes("rainbow1"))&&!(this._isT1MEntity(t)&&!this._hasRGBColorMode(t)))})}_isCCTCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];if(!t)return!1;return!(void 0===t.attributes.color_temp&&void 0===t.attributes.color_temp_kelvin&&void 0===t.attributes.min_color_temp_kelvin)&&(!this._isT1MEntity(t)||!this._hasRGBColorMode(t))})}_isSegmentsCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i))&&(!(!i.includes("flow1")&&!i.includes("rainbow1"))&&!(this._isT1MEntity(t)&&!this._hasRGBColorMode(t)))})}_getEffectsCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i)||0===i.length)&&!(this._isT1MEntity(t)&&!this._hasRGBColorMode(t))}):[]}_getPatternsCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i))&&(!(!i.includes("flow1")&&!i.includes("rainbow1"))&&!(this._isT1MEntity(t)&&!this._hasRGBColorMode(t)))}):[]}_getCCTCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;return!(void 0===t.attributes.color_temp&&void 0===t.attributes.color_temp_kelvin&&void 0===t.attributes.min_color_temp_kelvin)&&(!this._isT1MEntity(t)||!this._hasRGBColorMode(t))}):[]}_getSegmentsCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i))&&(!(!i.includes("flow1")&&!i.includes("rainbow1"))&&!(this._isT1MEntity(t)&&!this._hasRGBColorMode(t)))}):[]}_getT2CompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list,s=i&&i.includes("candlelight"),o=!i&&void 0!==t.attributes.color_temp;return s||o}):[]}_filterPresets(){const e=this._getSelectedDeviceTypes(),t=e.length>0,i=e.includes("t2_bulb"),s=e.includes("t2_cct"),o=e.includes("t1m"),r=e.includes("t1m_white"),a=e.includes("t1_strip");return{showDynamicEffects:t&&(i||o||a),showSegmentPatterns:t&&(o||a),showCCTSequences:t&&(i||s||r||a),showSegmentSequences:t&&(o||a),hasT2:i,hasT1M:o,hasT1Strip:a,t2Presets:i&&this._presets?.dynamic_effects.t2_bulb||[],t1mPresets:o&&this._presets?.dynamic_effects.t1m||[],t1StripPresets:a&&this._presets?.dynamic_effects.t1_strip||[]}}_handleEntityChanged(e){const t=e.detail.value;if(!t)return this._selectedEntities=[],void(this._activeFavoriteId=null);Array.isArray(t)?this._selectedEntities=t:this._selectedEntities=[t],this._activeFavoriteId=null,this._loadCurvatureFromEntity()}_handleBrightnessChange(e){this._brightness=e.detail.value}_handleCustomBrightnessToggle(e){this._useCustomBrightness=e.target.checked}_handleExpansionChange(e,t){const i=t.detail.expanded;this._collapsed={...this._collapsed,[e]:!i}}async _activateDynamicEffect(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0};this._useCustomBrightness&&(t.brightness=this._brightness),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",t)}async _activateSegmentPattern(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0};this._useCustomBrightness&&(t.brightness=this._brightness),await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",t)}async _activateCCTSequence(e){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",{entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0})}async _activateSegmentSequence(e){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",{entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0})}async _stopEffect(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","stop_effect",{entity_id:this._selectedEntities,restore_state:!0})}async _pauseCCTSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","pause_cct_sequence",{entity_id:this._selectedEntities})}async _resumeCCTSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","resume_cct_sequence",{entity_id:this._selectedEntities})}async _stopCCTSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","stop_cct_sequence",{entity_id:this._selectedEntities})}async _pauseSegmentSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","pause_segment_sequence",{entity_id:this._selectedEntities})}async _resumeSegmentSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","resume_segment_sequence",{entity_id:this._selectedEntities})}async _stopSegmentSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","stop_segment_sequence",{entity_id:this._selectedEntities})}_getUserEffectPresetsForDeviceType(e){return this._userPresets?.effect_presets?this._userPresets.effect_presets.filter(t=>!t.device_type||("t1m"===e&&("t1"===t.device_type||"t1m"===t.device_type)||t.device_type===e)):[]}_getUserPatternPresetsForDeviceType(e){return this._userPresets?.segment_pattern_presets?this._userPresets.segment_pattern_presets.filter(t=>!t.device_type||("t1m"===e&&("t1"===t.device_type||"t1m"===t.device_type)||t.device_type===e)):[]}_getFilteredUserCCTSequencePresets(){if(!this._userPresets?.cct_sequence_presets)return[];return this._getSelectedDeviceTypes().length>0?this._userPresets.cct_sequence_presets:[]}_getUserSegmentSequencePresetsForDeviceType(e){return this._userPresets?.segment_sequence_presets?this._userPresets.segment_sequence_presets.filter(t=>!t.device_type||("t1m"===e&&("t1"===t.device_type||"t1m"===t.device_type)||t.device_type===e)):[]}async _activateUserEffectPreset(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,effect:e.effect,speed:e.effect_speed,turn_on:!0,sync:!0};e.effect_colors.forEach((e,i)=>{i<8&&(t[`color_${i+1}`]={x:e.x,y:e.y})}),void 0!==e.effect_brightness?t.brightness=e.effect_brightness:this._useCustomBrightness&&(t.brightness=this._brightness),e.effect_segments&&(t.segments=e.effect_segments),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",t)}async _activateUserPatternPreset(e){if(!this._selectedEntities.length)return;if(!e.segments||!Array.isArray(e.segments)||0===e.segments.length)return void console.warn("Pattern preset has no segments:",e.name);const t=e.segments.filter(e=>e&&e.color).map(e=>({segment:e.segment,color:{r:e.color.r,g:e.color.g,b:e.color.b}}));if(0===t.length)return void console.warn("Pattern preset has no valid segments after filtering:",e.name);const i={entity_id:this._selectedEntities,segment_colors:t,turn_on:!0,sync:!0,turn_off_unspecified:!0};this._useCustomBrightness&&(i.brightness=this._brightness);try{await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",i)}catch(e){console.error("Failed to activate pattern preset:",e)}}async _activateUserCCTSequencePreset(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,loop_mode:e.loop_mode,end_behavior:e.end_behavior,turn_on:!0,sync:!0};"count"===e.loop_mode&&void 0!==e.loop_count&&(t.loop_count=e.loop_count),e.steps.forEach((e,i)=>{const s=i+1;s<=20&&(t[`step_${s}_color_temp`]=e.color_temp,t[`step_${s}_brightness`]=e.brightness,t[`step_${s}_transition`]=e.transition,t[`step_${s}_hold`]=e.hold)}),await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",t)}async _activateUserSegmentSequencePreset(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,loop_mode:e.loop_mode,end_behavior:e.end_behavior,turn_on:!0,sync:!0};"count"===e.loop_mode&&void 0!==e.loop_count&&(t.loop_count=e.loop_count),e.steps.forEach((e,i)=>{const s=i+1;s<=20&&(t[`step_${s}_segments`]=e.segments,t[`step_${s}_mode`]=e.mode,t[`step_${s}_duration`]=e.duration,t[`step_${s}_hold`]=e.hold,t[`step_${s}_activation_pattern`]=e.activation_pattern,e.colors&&Array.isArray(e.colors)&&e.colors.forEach((e,i)=>{i<6&&(t[`step_${s}_color_${i+1}`]=e)}))}),await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",t)}render(){if(this._loading)return N`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">${this._localize("title")}</div>
          </div>
        </div>
        <div class="content">
          <div class="loading">${this._localize("errors.loading_presets")}</div>
        </div>
      `;if(this._error)return N`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">${this._localize("title")}</div>
          </div>
        </div>
        <div class="content">
          <ha-alert alert-type="error" title="${this._localize("errors.title")}">
            ${this._error}
          </ha-alert>
        </div>
      `;if(!this._presets)return N`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">${this._localize("title")}</div>
          </div>
        </div>
        <div class="content">
          <ha-alert alert-type="warning" title="${this._localize("errors.no_presets_title")}">
            ${this._localize("errors.no_presets_message")}
          </ha-alert>
        </div>
      `;const e=this._backendVersion&&this._backendVersion!==this._frontendVersion;return N`
      <div class="header">
        <div class="toolbar">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <div class="main-title">Aqara Advanced Lighting</div>
          ${this._backendVersion?N`
            <div
              class="version-display ${e?"version-mismatch":""}"
              title="${e?this._localize("tooltips.version_mismatch",{backend:this._backendVersion,frontend:this._frontendVersion}):`v${this._backendVersion}`}"
            >
              ${e?N`
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                <span class="version-text">v${this._backendVersion} / v${this._frontendVersion}</span>
              `:N`
                <span class="version-text">v${this._backendVersion}</span>
              `}
            </div>
          `:""}
        </div>
        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab slot="nav" panel="activate" .active=${"activate"===this._activeTab}>
            ${this._localize("tabs.activate")}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="effects" .active=${"effects"===this._activeTab}>
            ${this._localize("tabs.effects")}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="patterns" .active=${"patterns"===this._activeTab}>
            ${this._localize("tabs.patterns")}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="cct" .active=${"cct"===this._activeTab}>
            ${this._localize("tabs.cct")}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="segments" .active=${"segments"===this._activeTab}>
            ${this._localize("tabs.segments")}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="presets" .active=${"presets"===this._activeTab}>
            ${this._localize("tabs.presets")}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="config" .active=${"config"===this._activeTab}>
            ${this._localize("tabs.config")}
          </ha-tab-group-tab>
        </ha-tab-group>
      </div>
      <div class="content">
        <div class="tab-content">
          ${this._renderTabContent()}
        </div>
      </div>
    `}_renderTabContent(){switch(this._activeTab){case"activate":default:return this._renderActivateTab();case"effects":return this._renderEffectsTab();case"patterns":return this._renderPatternsTab();case"cct":return this._renderCCTTab();case"segments":return this._renderSegmentsTab();case"presets":return this._renderPresetsTab();case"config":return this._renderConfigTab()}}_renderActivateTab(){const e=this._filterPresets(),t=this._selectedEntities.length>0,i="target_controls",s=!this._collapsed[i];return N`
      <ha-expansion-panel
        outlined
        .expanded=${s}
        @expanded-changed=${e=>this._handleExpansionChange(i,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("target.section_title")}</div>
            <div class="section-subtitle">${t?this._localize(1===this._selectedEntities.length?"target.lights_selected":"target.lights_selected_plural",{count:this._selectedEntities.length.toString()}):this._localize("target.select_lights")}</div>
          </div>
        </div>
        <div class="section-content controls-content">
          <div class="target-favorites-grid">
            <div class="control-row">
              <span class="control-label">${this._localize("target.lights_label")}</span>
              <div class="control-input target-input">
                <div class="target-selector">
                  <ha-selector
                    .hass=${this.hass}
                    .selector=${{entity:{multiple:!0,domain:"light",...this._supportedEntities.size>0?{include_entities:Array.from(this._supportedEntities.keys())}:{}}}}
                    .value=${this._selectedEntities}
                    @value-changed=${this._handleEntityChanged}
                  ></ha-selector>
                </div>
                ${t&&!this._showFavoriteInput?N`
                      <ha-icon-button
                        class="add-favorite-btn"
                        @click=${this._addFavorite}
                        title="${this._localize("tooltips.favorite_save")}"
                      >
                        <ha-icon icon="mdi:star-plus"></ha-icon>
                      </ha-icon-button>
                    `:""}
              </div>
            </div>

            ${this._favorites.length>0?N`
                  <div class="control-row">
                    <span class="control-label">${this._localize("target.favorites_label")}</span>
                    <div class="control-input favorites-container">
                      ${this._favorites.map(e=>{const t=e.entities[0]||"",i=this._getEntityIcon(t),s=e.entities.length,o=this._getEntityState(t),r=this._getEntityColor(t),a="on"===o,n="unavailable"===o||"unknown"===o,l=this._activeFavoriteId===e.id;let c="",d="";if(r){const e=r.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);if(e){const[,t,i,s]=e;c=`background: rgba(${t}, ${i}, ${s}, 0.2);`,d=`color: ${r};`}}return N`
                          <div class="favorite-button ${a?"state-on":"state-off"} ${n?"state-unavailable":""} ${l?"selected":""}" @click=${()=>this._selectFavorite(e)}>
                            <div class="favorite-button-icon" style="${c}">
                              <ha-icon icon="${i}" style="${d}"></ha-icon>
                            </div>
                            <div class="favorite-button-content">
                              <div class="favorite-button-name">${e.name}</div>
                              ${s>1?N`<div class="favorite-button-count">${s} lights</div>`:""}
                            </div>
                            <ha-icon-button
                              class="favorite-button-remove"
                              @click=${t=>{t.stopPropagation(),this._removeFavorite(e.id)}}
                              title="${this._localize("tooltips.favorite_remove")}"
                            >
                              <ha-icon icon="mdi:close"></ha-icon>
                            </ha-icon-button>
                          </div>
                        `})}
                    </div>
                  </div>
                `:""}
          </div>

          ${this._showFavoriteInput?N`
                <div class="control-row">
                  <span class="control-label">${this._localize("target.favorite_name_label")}</span>
                  <div class="control-input favorite-input-container">
                    <ha-selector
                      .hass=${this.hass}
                      .selector=${{text:{}}}
                      .value=${this._favoriteInputName}
                      @value-changed=${this._handleFavoriteNameChange}
                      @keydown=${this._handleFavoriteNameKeydown}
                    ></ha-selector>
                    <div class="favorite-input-buttons">
                      <ha-button @click=${this._saveFavorite}>
                        <ha-icon icon="mdi:check"></ha-icon>
                        ${this._localize("editors.save_button")}
                      </ha-button>
                      <ha-button @click=${this._cancelFavoriteInput}>
                        <ha-icon icon="mdi:close"></ha-icon>
                        ${this._localize("editors.cancel_button")}
                      </ha-button>
                    </div>
                  </div>
                </div>
              `:""}

          ${t?N`
                <div class="control-row">
                  <span class="control-label">${this._localize("target.light_control_label")}</span>
                  <div class="control-input light-tile-container" ${Pe(this._tileCardRef)}>
                  </div>
                </div>
              `:""}
        </div>
      </ha-expansion-panel>

      ${t?N`
            <ha-expansion-panel
              outlined
              .expanded=${!this._collapsed.controls}
              @expanded-changed=${e=>this._handleExpansionChange("controls",e)}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize("target.controls_card_title")}</div>
                </div>
              </div>
              <div class="section-content controls-content">
                <div class="control-row">
                  <span class="control-label quick-controls-label">${this._localize("target.quick_controls_label")}</span>
                  <div class="control-input control-buttons">
                    ${e.showDynamicEffects?N`
                          <ha-button @click=${this._stopEffect}>
                            <ha-icon icon="mdi:stop"></ha-icon>
                            ${this._localize("target.effect_button")}
                          </ha-button>
                        `:""}
                    <ha-button @click=${this._pauseCCTSequence}>
                      <ha-icon icon="mdi:pause"></ha-icon>
                      ${this._localize("target.cct_button")}
                    </ha-button>
                    <ha-button @click=${this._resumeCCTSequence}>
                      <ha-icon icon="mdi:play"></ha-icon>
                      ${this._localize("target.cct_button")}
                    </ha-button>
                    <ha-button @click=${this._stopCCTSequence}>
                      <ha-icon icon="mdi:stop"></ha-icon>
                      ${this._localize("target.cct_button")}
                    </ha-button>
                    ${e.showSegmentSequences?N`
                          <ha-button @click=${this._pauseSegmentSequence}>
                            <ha-icon icon="mdi:pause"></ha-icon>
                            ${this._localize("target.segment_button")}
                          </ha-button>
                          <ha-button @click=${this._resumeSegmentSequence}>
                            <ha-icon icon="mdi:play"></ha-icon>
                            ${this._localize("target.segment_button")}
                          </ha-button>
                          <ha-button @click=${this._stopSegmentSequence}>
                            <ha-icon icon="mdi:stop"></ha-icon>
                            ${this._localize("target.segment_button")}
                          </ha-button>
                        `:""}
                  </div>
                </div>

                <div class="brightness-override-section">
                  <div class="form-section">
                    <span class="form-label">${this._localize("target.custom_brightness_label")}</span>
                    <ha-switch
                      .checked=${this._useCustomBrightness}
                      @change=${this._handleCustomBrightnessToggle}
                    ></ha-switch>
                  </div>

                  ${this._useCustomBrightness?N`
                        <div class="brightness-slider">
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:1,max:100,mode:"slider",unit_of_measurement:"%"}}}
                            .value=${this._brightness}
                            @value-changed=${this._handleBrightnessChange}
                          ></ha-selector>
                        </div>
                      `:""}
                </div>
              </div>
            </ha-expansion-panel>
          `:""}

      ${t?"":N`<div class="no-lights">${this._localize("target.no_lights_message")}</div>`}

      ${this._hasIncompatibleLights?N`
            <ha-alert alert-type="error" title="${this._localize("errors.incompatible_light_title")}">
              ${this._localize("errors.incompatible_light_message")}
            </ha-alert>
          `:""}

      ${e.showDynamicEffects&&!this._hasIncompatibleLights?N`
            ${e.hasT2&&(e.t2Presets.length>0||this._getUserEffectPresetsForDeviceType("t2_bulb").length>0)?this._renderDynamicEffectsSection("T2 Bulb",e.t2Presets,"t2_bulb"):""}
            ${e.hasT1M&&(e.t1mPresets.length>0||this._getUserEffectPresetsForDeviceType("t1m").length>0)?this._renderDynamicEffectsSection("T1M",e.t1mPresets,"t1m"):""}
            ${e.hasT1Strip&&(e.t1StripPresets.length>0||this._getUserEffectPresetsForDeviceType("t1_strip").length>0)?this._renderDynamicEffectsSection("T1 Strip",e.t1StripPresets,"t1_strip"):""}
          `:""}

      ${e.showSegmentPatterns&&!this._hasIncompatibleLights?N`
            ${e.hasT1M&&((this._presets?.segment_patterns?.length??0)>0||this._getUserPatternPresetsForDeviceType("t1m").length>0)?this._renderSegmentPatternsSection("T1M",this._presets?.segment_patterns||[],"t1m"):""}
            ${e.hasT1Strip&&((this._presets?.segment_patterns?.length??0)>0||this._getUserPatternPresetsForDeviceType("t1_strip").length>0)?this._renderSegmentPatternsSection("T1 Strip",this._presets?.segment_patterns||[],"t1_strip"):""}
          `:""}

      ${e.showCCTSequences&&((this._presets?.cct_sequences?.length??0)>0||this._getFilteredUserCCTSequencePresets().length>0)&&!this._hasIncompatibleLights?this._renderCCTSequencesSection():""}

      ${e.showSegmentSequences&&!this._hasIncompatibleLights?N`
            ${e.hasT1M&&((this._presets?.segment_sequences?.length??0)>0||this._getUserSegmentSequencePresetsForDeviceType("t1m").length>0)?this._renderSegmentSequencesSection("T1M",this._presets?.segment_sequences||[],"t1m"):""}
            ${e.hasT1Strip&&((this._presets?.segment_sequences?.length??0)>0||this._getUserSegmentSequencePresetsForDeviceType("t1_strip").length>0)?this._renderSegmentSequencesSection("T1 Strip",this._presets?.segment_sequences||[],"t1_strip"):""}
          `:""}
    `}_renderEffectsTab(){const e="effect"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isEffectsCompatible(),i=this._selectedEntities.length>0;return N`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_effect_title"):this._localize("dialogs.create_effect_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_effect_description"):this._localize("dialogs.create_effect_description")}
        </p>
        ${i&&!t?N`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_effects")}
          </ha-alert>
        `:""}
        <effect-editor
          .hass=${this.hass}
          .preset=${e}
          .translations=${this._translations}
          .editMode=${!!e&&!this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .previewActive=${this._effectPreviewActive}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          .deviceContext=${this._getDeviceContextForEditor("effect")}
          @save=${this._handleEffectSave}
          @preview=${this._handleEffectPreview}
          @stop-preview=${this._handleEffectStopPreview}
          @cancel=${this._handleEditorCancel}
        ></effect-editor>
      </ha-card>
    `}async _handleEffectSave(e){if("effect"!==this._editingPreset?.type||this._editingPreset.isDuplicate)await this._saveUserPreset("effect",e.detail);else{const t=this._editingPreset.preset;await this._updateUserPreset("effect",t.id,e.detail)}this._editingPreset=void 0,this._setActiveTab("presets")}_handleEditorCancel(){this._editingPreset=void 0,this._setActiveTab("activate")}async _handleEffectPreview(e){const t=this._getEffectsCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for effect preview");const i=e.detail,s={entity_id:t,effect:i.effect,speed:i.effect_speed,turn_on:!0,sync:!0};i.effect_colors&&i.effect_colors.forEach((e,t)=>{if(t<8)if("x"in e&&"y"in e&&void 0!==e.x&&void 0!==e.y){const i=Te(e.x,e.y,255);s[`color_${t+1}`]=[i.r,i.g,i.b]}else"r"in e&&"g"in e&&"b"in e&&(s[`color_${t+1}`]=[e.r,e.g,e.b])}),void 0!==i.effect_brightness&&(s.brightness=i.effect_brightness),i.effect_segments&&(s.segments=i.effect_segments),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",s),this._effectPreviewActive=!0}async _handleEffectStopPreview(){const e=this._getEffectsCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_effect",{entity_id:e,restore_state:!0}),this._effectPreviewActive=!1)}_renderPatternsTab(){const e="pattern"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isPatternsCompatible(),i=this._selectedEntities.length>0;return N`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_pattern_title"):this._localize("dialogs.create_pattern_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_pattern_description"):this._localize("dialogs.create_pattern_description")}
        </p>
        ${i&&!t?N`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_patterns")}
          </ha-alert>
        `:""}
        <pattern-editor
          .hass=${this.hass}
          .preset=${e}
          .translations=${this._translations}
          .editMode=${!!e&&!this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          .deviceContext=${this._getDeviceContextForEditor("pattern")}
          @save=${this._handlePatternSave}
          @preview=${this._handlePatternPreview}
          @cancel=${this._handleEditorCancel}
        ></pattern-editor>
      </ha-card>
    `}async _handlePatternSave(e){if("pattern"!==this._editingPreset?.type||this._editingPreset.isDuplicate)await this._saveUserPreset("segment_pattern",e.detail);else{const t=this._editingPreset.preset;await this._updateUserPreset("segment_pattern",t.id,e.detail)}this._editingPreset=void 0,this._setActiveTab("presets")}async _handlePatternPreview(e){const t=this._getPatternsCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for pattern preview");const i=e.detail;if(!i.segments||!Array.isArray(i.segments))return void console.error("Pattern preview: No segments in data");const s=i.segments.map(e=>({segment:e.segment,color:{r:e.color.r,g:e.color.g,b:e.color.b}}));try{await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",{entity_id:t,segment_colors:s,turn_on:!0,turn_off_unspecified:!0,sync:!0})}catch(e){console.error("Pattern preview service call failed:",e)}}_renderCCTTab(){const e="cct"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isCCTCompatible(),i=this._selectedEntities.length>0;return N`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_cct_title"):this._localize("dialogs.create_cct_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_cct_description"):this._localize("dialogs.create_cct_description")}
        </p>
        ${i&&!t?N`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_cct")}
          </ha-alert>
        `:""}
        <cct-sequence-editor
          .hass=${this.hass}
          .preset=${e}
          .translations=${this._translations}
          .editMode=${!!e&&!this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .selectedEntities=${this._selectedEntities}
          .previewActive=${this._cctPreviewActive}
          .deviceContext=${this._getDeviceContextForEditor("cct")}
          @save=${this._handleCCTSave}
          @preview=${this._handleCCTPreview}
          @stop-preview=${this._handleCCTStopPreview}
          @cancel=${this._handleEditorCancel}
        ></cct-sequence-editor>
      </ha-card>
    `}async _handleCCTSave(e){if("cct"!==this._editingPreset?.type||this._editingPreset.isDuplicate)await this._saveUserPreset("cct_sequence",e.detail);else{const t=this._editingPreset.preset;await this._updateUserPreset("cct_sequence",t.id,e.detail)}this._editingPreset=void 0,this._setActiveTab("presets")}async _handleCCTPreview(e){const t=this._getCCTCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for CCT preview");const i=e.detail,s={entity_id:t,loop_mode:i.loop_mode,end_behavior:i.end_behavior,turn_on:!0,sync:!0};"count"===i.loop_mode&&void 0!==i.loop_count&&(s.loop_count=i.loop_count),i.steps&&Array.isArray(i.steps)&&i.steps.forEach((e,t)=>{const i=t+1;i<=20&&(s[`step_${i}_color_temp`]=e.color_temp,s[`step_${i}_brightness`]=e.brightness,s[`step_${i}_transition`]=e.transition,s[`step_${i}_hold`]=e.hold)}),await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",s),this._cctPreviewActive=!0}async _handleCCTStopPreview(){const e=this._getCCTCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_cct_sequence",{entity_id:e}),this._cctPreviewActive=!1)}_renderSegmentsTab(){const e="segment"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isSegmentsCompatible(),i=this._selectedEntities.length>0;return N`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_segment_title"):this._localize("dialogs.create_segment_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_segment_description"):this._localize("dialogs.create_segment_description")}
        </p>
        ${i&&!t?N`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_segments")}
          </ha-alert>
        `:""}
        <segment-sequence-editor
          .hass=${this.hass}
          .preset=${e}
          .translations=${this._translations}
          .editMode=${!!e&&!this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .previewActive=${this._segmentSequencePreviewActive}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          .deviceContext=${this._getDeviceContextForEditor("segment")}
          @save=${this._handleSegmentSequenceSave}
          @preview=${this._handleSegmentSequencePreview}
          @stop-preview=${this._handleSegmentSequenceStopPreview}
          @cancel=${this._handleEditorCancel}
        ></segment-sequence-editor>
      </ha-card>
    `}async _handleSegmentSequenceSave(e){if("segment"!==this._editingPreset?.type||this._editingPreset.isDuplicate)await this._saveUserPreset("segment_sequence",e.detail);else{const t=this._editingPreset.preset;await this._updateUserPreset("segment_sequence",t.id,e.detail)}this._editingPreset=void 0,this._setActiveTab("presets")}async _handleSegmentSequencePreview(e){const t=this._getSegmentsCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for segment sequence preview");const i=e.detail,s={entity_id:t,loop_mode:i.loop_mode,end_behavior:i.end_behavior,clear_segments:i.clear_segments||!1,skip_first_in_loop:i.skip_first_in_loop||!1,turn_on:!0,sync:!0};"count"===i.loop_mode&&void 0!==i.loop_count&&(s.loop_count=i.loop_count),i.steps&&Array.isArray(i.steps)&&i.steps.forEach((e,t)=>{const i=t+1;i<=20&&(s[`step_${i}_segments`]=e.segments,s[`step_${i}_mode`]=e.mode,s[`step_${i}_duration`]=e.duration,s[`step_${i}_hold`]=e.hold,s[`step_${i}_activation_pattern`]=e.activation_pattern,e.segment_colors&&Array.isArray(e.segment_colors)&&e.segment_colors.length>0?s[`step_${i}_segment_colors`]=e.segment_colors:e.colors&&Array.isArray(e.colors)&&e.colors.forEach((e,t)=>{t<6&&(s[`step_${i}_color_${t+1}`]=e)}))}),await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",s),this._segmentSequencePreviewActive=!0}async _handleSegmentSequenceStopPreview(){const e=this._getSegmentsCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_segment_sequence",{entity_id:e}),this._segmentSequencePreviewActive=!1)}async _handleExportPresets(){this._isExporting=!0,this.requestUpdate();try{const e=await fetch("/api/aqara_advanced_lighting/presets/export",{method:"GET",headers:{Authorization:`Bearer ${this.hass.auth.data.access_token}`}});if(!e.ok)throw new Error(`Export failed: ${e.statusText}`);const t=e.headers.get("Content-Disposition"),i=t?.match(/filename="(.+)"/),s=i?.[1]||"aqara_presets_backup.json",o=await e.blob(),r=window.URL.createObjectURL(o),a=document.createElement("a");a.href=r,a.download=s,document.body.appendChild(a),a.click(),window.URL.revokeObjectURL(r),document.body.removeChild(a),this._showToast(this._localize("presets.export_success"))}catch(e){this._showToast(this._localize("presets.export_error_network")),console.error("Export error:",e)}finally{this._isExporting=!1,this.requestUpdate()}}_handleImportClick(){this._fileInputRef||(this._fileInputRef=document.createElement("input"),this._fileInputRef.type="file",this._fileInputRef.accept=".json,application/json",this._fileInputRef.addEventListener("change",e=>{const t=e.target;t.files&&t.files[0]&&this._handleImportFile(t.files[0])})),this._fileInputRef.click()}async _handleImportFile(e){this._isImporting=!0,this.requestUpdate();try{const t=await e.text(),i=JSON.parse(t),s=await this.hass.callApi("POST","aqara_advanced_lighting/presets/import",i),o=Object.values(s.counts).reduce((e,t)=>e+t,0);this._showToast(this._localize("presets.import_success",{count:o.toString()})),await this._loadUserPresets()}catch(e){let t=this._localize("presets.import_error_unknown");e instanceof SyntaxError?t=this._localize("presets.import_error_invalid_file"):e instanceof Error&&(t=e.message),this._showToast(t),console.error("Import error:",e)}finally{this._isImporting=!1,this.requestUpdate()}}_showToast(e){const t=new CustomEvent("hass-notification",{detail:{message:e,duration:3e3},bubbles:!0,composed:!0});this.dispatchEvent(t)}_renderPresetsTab(){const e=this._userPresets?.effect_presets||[],t=this._userPresets?.segment_pattern_presets||[],i=this._userPresets?.cct_sequence_presets||[],s=this._userPresets?.segment_sequence_presets||[],o=e.length+t.length+i.length+s.length,r=this._selectedEntities.length>0,a="my_presets_overview",n=!this._collapsed[a];return N`
      <ha-expansion-panel
        outlined
        .expanded=${n}
        @expanded-changed=${e=>this._handleExpansionChange(a,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("tabs.presets")}</div>
            <div class="section-subtitle">
              ${o} presets${r?"":" - select lights in the Activate tab to enable activation"}
            </div>
          </div>
        </div>
        <div class="section-content preset-management-content">
          <div class="toolbar-actions">
            <mwc-button
              raised
              @click=${this._handleExportPresets}
              .disabled=${this._isExporting||this._isImporting}
            >
              <ha-icon icon="mdi:download" slot="icon"></ha-icon>
              ${this._isExporting?this._localize("presets.export_progress"):this._localize("presets.export_button")}
            </mwc-button>

            <mwc-button
              raised
              @click=${this._handleImportClick}
              .disabled=${this._isExporting||this._isImporting}
            >
              <ha-icon icon="mdi:upload" slot="icon"></ha-icon>
              ${this._isImporting?this._localize("presets.import_progress"):this._localize("presets.import_button")}
            </mwc-button>
          </div>
        </div>
      </ha-expansion-panel>

      ${0===o?N`
            <div class="no-presets">
              <ha-icon icon="mdi:folder-open-outline"></ha-icon>
              <p>${this._localize("presets.no_presets_title")}</p>
              <p>${this._localize("presets.no_presets_description")}</p>
            </div>
          `:N`
            ${this._renderPresetDeviceSections("Dynamic Effects","presets_effects",e,r,e=>this._activateUserEffectPreset(e),e=>this._editEffectPreset(e),"effect",e=>this._renderUserEffectIcon(e),(e,t)=>this._sortUserEffectPresets(e,t),e=>this._duplicateUserEffectPreset(e))}

            ${this._renderPresetDeviceSections("Segment Patterns","presets_patterns",t,r,e=>this._activateUserPatternPreset(e),e=>this._editPatternPreset(e),"segment_pattern",e=>this._renderUserPatternIcon(e),(e,t)=>this._sortUserPatternPresets(e,t),e=>this._duplicateUserPatternPreset(e))}

            ${i.length>0?this._renderPresetSection("CCT Sequences","presets_cct",i,r,e=>this._activateUserCCTSequencePreset(e),e=>this._editCCTSequencePreset(e),"cct_sequence",e=>this._renderUserCCTIcon(e),(e,t)=>this._sortUserCCTSequencePresets(e,t),e=>this._duplicateUserCCTSequencePreset(e)):""}

            ${this._renderPresetDeviceSections("Segment Sequences","presets_segments",s,r,e=>this._activateUserSegmentSequencePreset(e),e=>this._editSegmentSequencePreset(e),"segment_sequence",e=>this._renderUserSegmentSequenceIcon(e),(e,t)=>this._sortUserSegmentSequencePresets(e,t),e=>this._duplicateUserSegmentSequencePreset(e))}
          `}
    `}_renderPresetDeviceSections(e,t,i,s,o,r,a,n,l,c){if(0===i.length)return"";const{ungrouped:d,grouped:h}=this._groupPresetsByDeviceType(i);return N`
      ${d.length>0?this._renderPresetSection(e,t,d,s,o,r,a,n,l,c):""}
      ${$t.PRESET_DEVICE_TYPES.map(({key:i,label:d})=>{const p=h.get(i);return p?.length?this._renderPresetSection(`${e}: ${d}`,`${t}_${i}`,p,s,o,r,a,n,l,c):""})}
    `}_renderPresetSection(e,t,i,s,o,r,a,n,l,c){const d=!this._collapsed[t],h=l(i,this._getSortPreference(t));return N`
      <ha-expansion-panel
        outlined
        .expanded=${d}
        @expanded-changed=${e=>this._handleExpansionChange(t,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${e}</div>
            <div class="section-subtitle">${i.length} presets</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(t)}
          </div>
        </div>
        <div class="section-content preset-grid">
          ${h.map(e=>this._renderPresetCard(e,s,o,r,a,n,c))}
        </div>
      </ha-expansion-panel>
    `}_renderPresetCard(e,t,i,s,o,r,a){return N`
      <div
        class="user-preset-card ${t?"":"disabled"}"
        @click=${t?()=>i(e):null}
        title="${e.name}"
      >
        <div class="preset-card-actions">
          <ha-icon-button
            @click=${t=>{t.stopPropagation(),s(e)}}
            title="${this._localize("tooltips.preset_edit")}"
          >
            <ha-icon icon="mdi:pencil"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            @click=${t=>{t.stopPropagation(),a(e)}}
            title="${this._localize("tooltips.preset_duplicate")}"
          >
            <ha-icon icon="mdi:content-copy"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            @click=${t=>{t.stopPropagation(),this._deleteUserPreset(o,e.id)}}
            title="${this._localize("tooltips.preset_delete")}"
          >
            <ha-icon icon="mdi:delete"></ha-icon>
          </ha-icon-button>
        </div>
        <div class="preset-icon">
          ${r(e)}
        </div>
        <div class="preset-name">${e.name}</div>
      </div>
    `}_editEffectPreset(e){this._editingPreset={type:"effect",preset:e},this._setActiveTab("effects")}_editPatternPreset(e){this._editingPreset={type:"pattern",preset:e},this._setActiveTab("patterns")}_editCCTSequencePreset(e){this._editingPreset={type:"cct",preset:e},this._setActiveTab("cct")}_editSegmentSequencePreset(e){this._editingPreset={type:"segment",preset:e},this._setActiveTab("segments")}_duplicateUserEffectPreset(e){const t={...e,id:"",name:`${e.name} (copy)`,created_at:"",modified_at:""};this._editingPreset={type:"effect",preset:t,isDuplicate:!0},this._setActiveTab("effects")}_duplicateUserPatternPreset(e){const t={...e,id:"",name:`${e.name} (copy)`,created_at:"",modified_at:""};this._editingPreset={type:"pattern",preset:t,isDuplicate:!0},this._setActiveTab("patterns")}_duplicateUserCCTSequencePreset(e){const t={...e,id:"",name:`${e.name} (copy)`,created_at:"",modified_at:""};this._editingPreset={type:"cct",preset:t,isDuplicate:!0},this._setActiveTab("cct")}_duplicateUserSegmentSequencePreset(e){const t={...e,id:"",name:`${e.name} (copy)`,created_at:"",modified_at:""};this._editingPreset={type:"segment",preset:t,isDuplicate:!0},this._setActiveTab("segments")}_duplicateBuiltinEffectPreset(e,t){const i={id:"",name:`${e.name} (copy)`,effect:e.effect,effect_speed:e.speed,effect_brightness:null!=e.brightness?Math.round(e.brightness/255*100):100,effect_colors:e.colors.map(e=>Ae(e[0],e[1],e[2])),device_type:t,created_at:"",modified_at:""};this._editingPreset={type:"effect",preset:i,isDuplicate:!0},this._setActiveTab("effects")}_getDeviceSegmentCount(e){switch(e){case"t1":return 20;case"t1m":default:return 26;case"t1_strip":return this._getT1StripSegmentCount()}}_scaleSegmentPattern(e,t){const i=e.length;return t<1||i<1?[]:t===i?[...e]:Array.from({length:t},(s,o)=>e[Math.floor(o*i/t)])}_duplicateBuiltinPatternPreset(e,t){const i=this._getDeviceSegmentCount(t),s=this._scaleSegmentPattern(e.segments,i),o={id:"",name:`${e.name} (copy)`,device_type:t,segments:s.map((e,t)=>({segment:t+1,color:{r:e[0],g:e[1],b:e[2]}})),created_at:"",modified_at:""};this._editingPreset={type:"pattern",preset:o,isDuplicate:!0},this._setActiveTab("patterns")}_duplicateBuiltinCCTSequencePreset(e){const t={id:"",name:`${e.name} (copy)`,steps:e.steps.map(e=>({...e,brightness:Math.round(e.brightness/255*100)})),loop_mode:e.loop_mode,loop_count:e.loop_count,end_behavior:e.end_behavior,created_at:"",modified_at:""};this._editingPreset={type:"cct",preset:t,isDuplicate:!0},this._setActiveTab("cct")}_duplicateBuiltinSegmentSequencePreset(e,t){const i={id:"",name:`${e.name} (copy)`,device_type:t,steps:e.steps.map(e=>({...e})),loop_mode:e.loop_mode,loop_count:e.loop_count,end_behavior:e.end_behavior,created_at:"",modified_at:""};this._editingPreset={type:"segment",preset:i,isDuplicate:!0},this._setActiveTab("segments")}_renderSortDropdown(e){const t=this._getSortPreference(e);return N`
      <select
        class="sort-select"
        .value=${t}
        @change=${t=>{t.stopPropagation(),this._setSortPreference(e,t.target.value)}}
        @click=${e=>e.stopPropagation()}
      >
        <option value="name-asc">${this._localize("presets.sort_name_asc")}</option>
        <option value="name-desc">${this._localize("presets.sort_name_desc")}</option>
        <option value="date-new">${this._localize("presets.sort_date_new")}</option>
        <option value="date-old">${this._localize("presets.sort_date_old")}</option>
      </select>
    `}_renderDynamicEffectsSection(e,t,i){const s=`dynamic_${e.toLowerCase().replace(/\s+/g,"_")}`,o=!this._collapsed[s],r=this._getUserEffectPresetsForDeviceType(i),a=r.length+t.length,n=this._getSortPreference(s),l=this._sortUserEffectPresets(r,n),c=this._sortDynamicEffectPresets(t,n);return N`
      <ha-expansion-panel
        outlined
        .expanded=${o}
        @expanded-changed=${e=>this._handleExpansionChange(s,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Dynamic Effects: ${e}</div>
            <div class="section-subtitle">${a} presets${r.length>0?` (${r.length} custom)`:""}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(s)}
          </div>
        </div>
        <div class="section-content">
          ${l.map(e=>N`
              <div class="preset-button user-preset" @click=${()=>this._activateUserEffectPreset(e)}>
                <div class="preset-icon">
                  ${this._renderUserEffectIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${c.map(e=>N`
              <div class="preset-button builtin-preset" @click=${()=>this._activateDynamicEffect(e)}>
                <div class="preset-card-actions">
                  <ha-icon-button
                    @click=${t=>{t.stopPropagation(),this._duplicateBuiltinEffectPreset(e,i)}}
                    title="${this._localize("tooltips.preset_duplicate")}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
                <div class="preset-icon">
                  ${this._renderPresetIcon(e.icon,"mdi:lightbulb-on")}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
        </div>
      </ha-expansion-panel>
    `}_renderSegmentPatternsSection(e,t,i){const s=`segment_pat_${e.toLowerCase().replace(/\s+/g,"_")}`,o=!this._collapsed[s],r=this._getUserPatternPresetsForDeviceType(i),a=r.length+t.length,n=this._getSortPreference(s),l=this._sortUserPatternPresets(r,n),c=this._sortSegmentPatternPresets(t,n);return N`
      <ha-expansion-panel
        outlined
        .expanded=${o}
        @expanded-changed=${e=>this._handleExpansionChange(s,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Segment Patterns: ${e}</div>
            <div class="section-subtitle">${a} presets${r.length>0?` (${r.length} custom)`:""}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(s)}
          </div>
        </div>
        <div class="section-content">
          ${l.map(e=>N`
              <div class="preset-button user-preset" @click=${()=>this._activateUserPatternPreset(e)}>
                <div class="preset-icon">
                  ${this._renderUserPatternIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${c.map(e=>N`
              <div class="preset-button builtin-preset" @click=${()=>this._activateSegmentPattern(e)}>
                <div class="preset-card-actions">
                  <ha-icon-button
                    @click=${t=>{t.stopPropagation(),this._duplicateBuiltinPatternPreset(e,i)}}
                    title="${this._localize("tooltips.preset_duplicate")}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
                <div class="preset-icon">
                  ${this._renderPresetIcon(e.icon,"mdi:palette")}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
        </div>
      </ha-expansion-panel>
    `}_renderPresetIcon(e,t){return e?e.includes(".")?N`<img src="/api/aqara_advanced_lighting/icons/${e}" alt="preset icon" />`:N`<ha-icon icon="${e}"></ha-icon>`:N`<ha-icon icon="${t}"></ha-icon>`}_renderUserEffectIcon(e){return e.icon?this._renderPresetIcon(e.icon,"mdi:lightbulb-on"):function(e){const t=(e.effect_colors??[]).slice(0,8);if(0===t.length)return null;if(1===t.length){const e=Ve(t[0]);return N`${Qe(Xe(`<circle cx="200" cy="200" r="180" fill="${e}" />`))}`}const i=360/t.length,s=t.map((e,t)=>We(t*i,(t+1)*i,Ve(e))).join("");return N`${Qe(Xe(s))}`}(e)??N`<ha-icon icon="mdi:lightbulb-on"></ha-icon>`}_renderUserPatternIcon(e){return e.icon?this._renderPresetIcon(e.icon,"mdi:palette"):Ze(e)??N`<ha-icon icon="mdi:palette"></ha-icon>`}_renderUserCCTIcon(e){return e.icon?this._renderPresetIcon(e.icon,"mdi:temperature-kelvin"):function(e){const t=(e.steps??[]).map(e=>e.color_temp).filter(e=>null!=e);if(0===t.length)return null;if(1===t.length){const e=Ke(t[0]);return N`${Qe(Xe(`<rect fill="${e}" x="20" y="20" width="360" height="360" rx="4" />`))}`}const i=`cct-${e.id}`,s=t.map((e,i)=>`<stop offset="${Math.round(i/(t.length-1)*100)}%" stop-color="${Ke(e)}" />`).join("");return N`${Qe(Xe(`<defs><linearGradient id="${i}" x1="0" y1="0" x2="1" y2="0">${s}</linearGradient></defs><rect fill="url(#${i})" x="20" y="20" width="360" height="360" rx="4" />`))}`}(e)??N`<ha-icon icon="mdi:temperature-kelvin"></ha-icon>`}_renderUserSegmentSequenceIcon(e){return e.icon?this._renderPresetIcon(e.icon,"mdi:animation-play"):Je(e)??N`<ha-icon icon="mdi:animation-play"></ha-icon>`}_renderCCTSequencesSection(){const e="cct_sequences",t=!this._collapsed[e],i=this._getFilteredUserCCTSequencePresets(),s=this._presets.cct_sequences,o=i.length+s.length,r=this._getSortPreference(e),a=this._sortUserCCTSequencePresets(i,r),n=this._sortCCTSequencePresets(s,r);return N`
      <ha-expansion-panel
        outlined
        .expanded=${t}
        @expanded-changed=${t=>this._handleExpansionChange(e,t)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">CCT Sequences</div>
            <div class="section-subtitle">${o} presets${i.length>0?` (${i.length} custom)`:""}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(e)}
          </div>
        </div>
        <div class="section-content">
          ${a.map(e=>N`
              <div class="preset-button user-preset" @click=${()=>this._activateUserCCTSequencePreset(e)}>
                <div class="preset-icon">
                  ${this._renderUserCCTIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${n.map(e=>N`
              <div class="preset-button builtin-preset" @click=${()=>this._activateCCTSequence(e)}>
                <div class="preset-card-actions">
                  <ha-icon-button
                    @click=${t=>{t.stopPropagation(),this._duplicateBuiltinCCTSequencePreset(e)}}
                    title="${this._localize("tooltips.preset_duplicate")}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
                <div class="preset-icon">
                  ${this._renderPresetIcon(e.icon,"mdi:temperature-kelvin")}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
        </div>
      </ha-expansion-panel>
    `}_renderSegmentSequencesSection(e,t,i){const s=`segment_seq_${e.toLowerCase().replace(/\s+/g,"_")}`,o=!this._collapsed[s],r=this._getUserSegmentSequencePresetsForDeviceType(i),a=r.length+t.length,n=this._getSortPreference(s),l=this._sortUserSegmentSequencePresets(r,n),c=this._sortSegmentSequencePresets(t,n);return N`
      <ha-expansion-panel
        outlined
        .expanded=${o}
        @expanded-changed=${e=>this._handleExpansionChange(s,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Segment Sequences: ${e}</div>
            <div class="section-subtitle">${a} presets${r.length>0?` (${r.length} custom)`:""}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(s)}
          </div>
        </div>
        <div class="section-content">
          ${l.map(e=>N`
              <div class="preset-button user-preset" @click=${()=>this._activateUserSegmentSequencePreset(e)}>
                <div class="preset-icon">
                  ${this._renderUserSegmentSequenceIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${c.map(e=>N`
              <div class="preset-button builtin-preset" @click=${()=>this._activateSegmentSequence(e)}>
                <div class="preset-card-actions">
                  <ha-icon-button
                    @click=${t=>{t.stopPropagation(),this._duplicateBuiltinSegmentSequencePreset(e,i)}}
                    title="${this._localize("tooltips.preset_duplicate")}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
                <div class="preset-icon">
                  ${this._renderPresetIcon(e.icon,"mdi:animation-play")}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
        </div>
      </ha-expansion-panel>
    `}_renderConfigTab(){const e=this._selectedEntities.length>0,t=this._getSelectedDeviceTypes(),i=t.includes("t2_bulb")||t.includes("t2_cct"),s=t.includes("t1_strip"),o=this._findTransitionCurveEntity(),r=this._findInitialBrightnessEntity(),a=this._findT1StripLengthEntity(),n=this._findOnOffDurationEntity(),l=this._findOffOnDurationEntity(),c=this._findDimmingRangeMinEntity(),d=this._findDimmingRangeMaxEntity(),h=r&&this.hass?.states[r]&&parseFloat(this.hass.states[r].state)||0,p=a&&this.hass?.states[a]&&parseFloat(this.hass.states[a].state)||2,_=n&&this.hass?.states[n]&&parseFloat(this.hass.states[n].state)||0,g=l&&this.hass?.states[l]&&parseFloat(this.hass.states[l].state)||0,u=c&&this.hass?.states[c]&&parseFloat(this.hass.states[c].state)||1,m=d&&this.hass?.states[d]&&parseFloat(this.hass.states[d].state)||100,v=n||l||c||d;return N`
      <!-- Z2M Instances Info Section -->
      <ha-expansion-panel
        outlined
        .expanded=${!1}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("instances.section_title")}</div>
            <div class="section-subtitle">${(()=>{const e=this._z2mInstances.length,t=this._z2mInstances.reduce((e,t)=>e+t.device_counts.total,0),i=1===e&&1===t?"instances.subtitle_single":"instances.subtitle_plural";return this._localize(i,{count:String(e),devices:String(t)})})()}</div>
          </div>
        </div>
        <div class="section-content" style="display: block; padding: 0;">
          ${0===this._z2mInstances.length?N`
                <div style="padding: 16px; text-align: center; color: var(--secondary-text-color);">
                  <ha-icon icon="mdi:information-outline" style="margin-right: 8px;"></ha-icon>
                  ${this._localize("instances.no_instances")}
                </div>
              `:N`
                <div class="z2m-instances-grid">
                  ${this._z2mInstances.map(e=>N`
                    <div class="z2m-instance-card">
                      <div class="z2m-instance-header">
                        <ha-icon icon="mdi:zigbee" style="color: var(--primary-color);"></ha-icon>
                        <div class="z2m-instance-info">
                          <span class="z2m-instance-name">${e.title}</span>
                          ${e.title!==e.z2m_base_topic?N`
                            <span class="z2m-instance-topic">${e.z2m_base_topic}</span>
                          `:""}
                        </div>
                      </div>
                      <div class="z2m-instance-stats">
                        <div class="z2m-stat">
                          <span class="z2m-stat-value">${e.device_counts.total}</span>
                          <span class="z2m-stat-label">${this._localize("instances.total")}</span>
                        </div>
                        ${e.device_counts.t2_rgb>0?N`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.t2_rgb}</span>
                            <span class="z2m-stat-label">${this._localize("instances.t2_rgb")}</span>
                          </div>
                        `:""}
                        ${e.device_counts.t2_cct>0?N`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.t2_cct}</span>
                            <span class="z2m-stat-label">${this._localize("instances.t2_cct")}</span>
                          </div>
                        `:""}
                        ${e.device_counts.t1m>0?N`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.t1m}</span>
                            <span class="z2m-stat-label">${this._localize("instances.t1m")}</span>
                          </div>
                        `:""}
                        ${e.device_counts.t1_strip>0?N`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.t1_strip}</span>
                            <span class="z2m-stat-label">${this._localize("instances.t1_strip")}</span>
                          </div>
                        `:""}
                        ${e.device_counts.other>0?N`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.other}</span>
                            <span class="z2m-stat-label">${this._localize("instances.other")}</span>
                          </div>
                        `:""}
                      </div>
                      ${e.devices.length>0?N`
                        <div class="z2m-devices-list">
                          <details>
                            <summary style="cursor: pointer; color: var(--secondary-text-color); font-size: var(--ha-font-size-s, 12px);">
                              ${this._localize(1===e.devices.length?"instances.show_devices_single":"instances.show_devices_plural",{count:String(e.devices.length)})}
                            </summary>
                            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                              ${e.devices.map(e=>N`<li>${e}</li>`)}
                            </ul>
                          </details>
                        </div>
                      `:""}
                    </div>
                  `)}
                </div>
              `}
        </div>
      </ha-expansion-panel>

      ${e?"":N`
            <ha-card class="controls">
              <div class="control-row">
                <div class="control-input">
                  <ha-alert alert-type="info">
                    ${this._localize("config.select_light_message")}
                  </ha-alert>
                </div>
              </div>
            </ha-card>
          `}

      ${i?N`
            <ha-expansion-panel
              outlined
              .expanded=${!0}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize("config.transition_settings")}</div>
                </div>
              </div>
              <div class="section-content" style="display: block; padding: 0;">
                <div class="transition-settings-grid">
                  <div class="transition-curve-column">
                    <transition-curve-editor
                      .hass=${this.hass}
                      .curvature=${this._localCurvature}
                      @curvature-input=${this._handleCurvatureInput}
                    ></transition-curve-editor>
                  </div>
                  <div class="initial-brightness-column">
                    <div class="initial-brightness-content">
                      <!-- Curvature controls -->
                      <div class="form-section" style="margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid var(--divider-color);">
                        <div class="curve-control-row">
                          <div class="curve-control-info">
                            <span class="form-label">${this._localize("config.custom_curvature_label")}</span>
                            <div style="font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                              ${this._getCurvatureDescription()}
                            </div>
                          </div>
                          <div class="curve-control-actions">
                            <ha-selector
                              .hass=${this.hass}
                              .selector=${{number:{min:.2,max:6,step:.01,mode:"box"}}}
                              .value=${this._localCurvature}
                              @value-changed=${this._handleCurvatureNumberChange}
                              style="width: 80px;"
                            ></ha-selector>
                            <ha-button
                              @click=${this._applyCurvature}
                              ?disabled=${!o||this._applyingCurvature}
                            >
                              ${this._applyingCurvature?"Applying...":"Apply"}
                            </ha-button>
                          </div>
                        </div>
                        <div class="curve-legend">
                          <span class="legend-item">
                            <span class="legend-dot fast-slow"></span>
                            0.2-1: Fast then slow
                          </span>
                          <span class="legend-item">
                            <span class="legend-dot linear"></span>
                            1: Linear
                          </span>
                          <span class="legend-item">
                            <span class="legend-dot slow-fast"></span>
                            1-6: Slow then fast
                          </span>
                        </div>
                      </div>

                      <!-- Initial Brightness -->
                      <div class="form-section">
                        <span class="form-label">${this._localize("config.initial_brightness_label")}</span>
                        <ha-selector
                          .hass=${this.hass}
                          .selector=${{number:{min:0,max:50,step:1,mode:"slider",unit_of_measurement:"%"}}}
                          .value=${h}
                          @value-changed=${e=>this._handleInitialBrightnessChange(e)}
                          ?disabled=${!r}
                        ></ha-selector>
                        ${r?"":N`
                          <div style="margin-top: 8px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                            Initial brightness entity not found for this device.
                          </div>
                        `}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ha-expansion-panel>
          `:""}

      ${e?N`
            <ha-expansion-panel
              outlined
              .expanded=${!0}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">Dimming settings</div>
                </div>
              </div>
              <div class="section-content" style="display: block; padding: 0;">
                <div class="dimming-settings-grid">
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize("config.on_to_off_duration_label")}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:0,max:10,step:.1,mode:"slider",unit_of_measurement:"s"}}}
                        .value=${_}
                        @value-changed=${e=>this._handleDimmingSettingChange(e,"on_off_duration")}
                        ?disabled=${!n}
                      ></ha-selector>
                      ${n?"":N`
                        <div class="entity-not-found">Entity not found for this device.</div>
                      `}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize("config.off_to_on_duration_label")}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:0,max:10,step:.1,mode:"slider",unit_of_measurement:"s"}}}
                        .value=${g}
                        @value-changed=${e=>this._handleDimmingSettingChange(e,"off_on_duration")}
                        ?disabled=${!l}
                      ></ha-selector>
                      ${l?"":N`
                        <div class="entity-not-found">Entity not found for this device.</div>
                      `}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize("config.dimming_range_min_label")}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:1,max:Math.min(99,m-1),step:1,mode:"slider",unit_of_measurement:"%"}}}
                        .value=${u}
                        @value-changed=${e=>this._handleDimmingRangeMinChange(e)}
                        ?disabled=${!c}
                      ></ha-selector>
                      ${c?"":N`
                        <div class="entity-not-found">Entity not found for this device.</div>
                      `}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize("config.dimming_range_max_label")}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:Math.max(2,u+1),max:100,step:1,mode:"slider",unit_of_measurement:"%"}}}
                        .value=${m}
                        @value-changed=${e=>this._handleDimmingRangeMaxChange(e)}
                        ?disabled=${!d}
                      ></ha-selector>
                      ${d?"":N`
                        <div class="entity-not-found">Entity not found for this device.</div>
                      `}
                    </div>
                  </div>
                </div>
                ${v?"":N`
                  <div style="padding: 16px; text-align: center; color: var(--secondary-text-color);">
                    <ha-icon icon="mdi:information-outline" style="margin-right: 8px;"></ha-icon>
                    Dimming settings are not available for this device.
                  </div>
                `}
              </div>
            </ha-expansion-panel>
          `:""}

      ${s?N`
            <ha-expansion-panel
              outlined
              .expanded=${!0}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">T1 Strip settings</div>
                </div>
              </div>
              <div class="section-content" style="display: block; padding: 16px;">
                <div class="form-section">
                  <span class="form-label">${this._localize("config.strip_length_label")}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .selector=${{number:{min:1,max:10,step:.2,mode:"slider",unit_of_measurement:"m"}}}
                    .value=${p}
                    @value-changed=${e=>this._handleT1StripLengthChange(e)}
                    ?disabled=${!a}
                  ></ha-selector>
                  <div style="margin-top: 8px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                    ${a?"Each meter has 5 addressable RGB segments (20cm each).":"Length entity not found for this device."}
                  </div>
                </div>
              </div>
            </ha-expansion-panel>
          `:""}
    `}async _handleInitialBrightnessChange(e){if(!this.hass)return;const t=e.detail.value;if("number"!=typeof t)return;const i=this._findAllInitialBrightnessEntities();if(i.length)try{await Promise.all(i.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:t})))}catch(e){console.error("Failed to set initial brightness:",e)}}_findTransitionCurveEntity(){if(!this.hass||!this._selectedEntities.length)return;const e="transition_curve_curvature";for(const t of this._selectedEntities){const i=this.hass.states[t];if(!i)continue;const s=this._supportedEntities.get(t),o="t2_bulb"===s?.device_type||"t2_cct"===s?.device_type,r=i.attributes.effect_list,a=r&&r.includes("candlelight"),n=!r&&void 0!==i.attributes.color_temp;if(!o&&!a&&!n)continue;const l=t.replace("light.",""),c=`number.${l}_${e}`;if(this.hass.states[c])return c;if(s?.z2m_friendly_name){const t=`number.${s.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${e}`;if(this.hass.states[t])return t}const d=l.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(e)){const i=t.replace("number.","").replace(`_${e}`,"").toLowerCase().split("_");if(d.length>=2&&i.length>=2&&d[0]===i[0]&&d[1]===i[1])return t}}}_findInitialBrightnessEntity(){if(!this.hass||!this._selectedEntities.length)return;const e="transition_initial_brightness";for(const t of this._selectedEntities){const i=this.hass.states[t];if(!i)continue;const s=this._supportedEntities.get(t),o="t2_bulb"===s?.device_type||"t2_cct"===s?.device_type,r=i.attributes.effect_list,a=r&&r.includes("candlelight"),n=!r&&void 0!==i.attributes.color_temp;if(!o&&!a&&!n)continue;const l=t.replace("light.",""),c=`number.${l}_${e}`;if(this.hass.states[c])return c;if(s?.z2m_friendly_name){const t=`number.${s.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${e}`;if(this.hass.states[t])return t}const d=l.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(e)){const i=t.replace("number.","").replace(`_${e}`,"").toLowerCase().split("_");if(d.length>=2&&i.length>=2&&d[0]===i[0]&&d[1]===i[1])return t}}}_findAllTransitionCurveEntities(){if(!this.hass||!this._selectedEntities.length)return[];const e=[],t=this._getT2CompatibleEntities(),i="transition_curve_curvature";for(const s of t){const t=s.replace("light.",""),o=`number.${t}_${i}`;if(this.hass.states[o]){e.push(o);continue}const r=this._supportedEntities.get(s);if(r?.z2m_friendly_name){const t=`number.${r.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${i}`;if(this.hass.states[t]&&!e.includes(t)){e.push(t);continue}}const a=t.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(i)&&!e.includes(t)){const s=t.replace("number.","").replace(`_${i}`,"").toLowerCase().split("_");if(a.length>=2&&s.length>=2&&a[0]===s[0]&&a[1]===s[1]){e.push(t);break}}}return e}_findAllInitialBrightnessEntities(){if(!this.hass||!this._selectedEntities.length)return[];const e=[],t=this._getT2CompatibleEntities(),i="transition_initial_brightness";for(const s of t){const t=s.replace("light.",""),o=`number.${t}_${i}`;if(this.hass.states[o]){e.push(o);continue}const r=this._supportedEntities.get(s);if(r?.z2m_friendly_name){const t=`number.${r.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${i}`;if(this.hass.states[t]&&!e.includes(t)){e.push(t);continue}}const a=t.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(i)&&!e.includes(t)){const s=t.replace("number.","").replace(`_${i}`,"").toLowerCase().split("_");if(a.length>=2&&s.length>=2&&a[0]===s[0]&&a[1]===s[1]){e.push(t);break}}}return e}_findAllDimmingEntities(e){if(!this.hass||!this._selectedEntities.length)return[];const t=[];for(const i of this._selectedEntities){if(!this.hass.states[i])continue;const s=i.replace("light.",""),o=`number.${s}_${e}`;if(this.hass.states[o]){t.push(o);continue}const r=this._supportedEntities.get(i);if(r?.z2m_friendly_name){const i=`number.${r.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${e}`;if(this.hass.states[i]&&!t.includes(i)){t.push(i);continue}}const a=s.toLowerCase().split("_");for(const i of Object.keys(this.hass.states))if(i.startsWith("number.")&&i.includes(e)&&!t.includes(i)){const s=i.replace("number.","").replace(`_${e}`,"").toLowerCase().split("_");if(a.length>=2&&s.length>=2&&a[0]===s[0]&&a[1]===s[1]){t.push(i);break}}}return t}_findDimmingEntity(e){if(this.hass&&this._selectedEntities.length)for(const t of this._selectedEntities){if(!this.hass.states[t])continue;const i=t.replace("light.",""),s=`number.${i}_${e}`;if(this.hass.states[s])return s;const o=this._supportedEntities.get(t);if(o?.z2m_friendly_name){const t=`number.${o.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${e}`;if(this.hass.states[t])return t}const r=i.toLowerCase();for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(e)){const i=t.replace("number.","").replace(`_${e}`,"").toLowerCase(),s=r.split("_"),o=i.split("_");if(s.length>=2&&o.length>=2&&s[0]===o[0]&&s[1]===o[1])return t}}}_findOnOffDurationEntity(){return this._findDimmingEntity("on_off_duration")}_findOffOnDurationEntity(){return this._findDimmingEntity("off_on_duration")}_findDimmingRangeMinEntity(){return this._findDimmingEntity("dimming_range_minimum")}_findDimmingRangeMaxEntity(){return this._findDimmingEntity("dimming_range_maximum")}async _handleDimmingSettingChange(e,t){if(!this.hass)return;const i=e.detail.value;if("number"!=typeof i)return;const s=this._findAllDimmingEntities(t);if(s.length)try{await Promise.all(s.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:i})))}catch(e){console.error("Failed to set dimming setting:",e)}}async _handleDimmingRangeMinChange(e){const t=this._findDimmingRangeMinEntity(),i=this._findDimmingRangeMaxEntity();if(!this.hass||!t)return;const s=e.detail.value;if("number"!=typeof s)return;s>=(i&&this.hass.states[i]&&parseFloat(this.hass.states[i].state)||100)||await this._handleDimmingSettingChange(e,"dimming_range_minimum")}async _handleDimmingRangeMaxChange(e){const t=this._findDimmingRangeMinEntity(),i=this._findDimmingRangeMaxEntity();if(!this.hass||!i)return;const s=e.detail.value;if("number"!=typeof s)return;s<=(t&&this.hass.states[t]&&parseFloat(this.hass.states[t].state)||1)||await this._handleDimmingSettingChange(e,"dimming_range_maximum")}_getT1StripCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return i&&i.includes("dash")&&!i.includes("candlelight")}):[]}_findT1StripLengthEntity(){if(!this.hass||!this._selectedEntities.length)return;const e=this._getT1StripCompatibleEntities();if(!e.length)return;const t="length";for(const i of e){const e=i.replace("light.",""),s=`number.${e}_${t}`;if(this.hass.states[s])return s;const o=this._supportedEntities.get(i);if(o?.z2m_friendly_name){const e=`number.${o.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${t}`;if(this.hass.states[e])return e}const r=e.toLowerCase().split("_");for(const e of Object.keys(this.hass.states))if(e.startsWith("number.")&&e.endsWith(`_${t}`)){const i=e.replace("number.","").replace(`_${t}`,"").toLowerCase().split("_");if(r.length>=2&&i.length>=2&&r[0]===i[0]&&r[1]===i[1])return e}}}_findAllT1StripLengthEntities(){if(!this.hass||!this._selectedEntities.length)return[];const e=[],t=this._getT1StripCompatibleEntities(),i="length";for(const s of t){const t=s.replace("light.",""),o=`number.${t}_${i}`;if(this.hass.states[o]){e.push(o);continue}const r=this._supportedEntities.get(s);if(r?.z2m_friendly_name){const t=`number.${r.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${i}`;if(this.hass.states[t]&&!e.includes(t)){e.push(t);continue}}const a=t.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.endsWith(`_${i}`)&&!e.includes(t)){const s=t.replace("number.","").replace(`_${i}`,"").toLowerCase().split("_");if(a.length>=2&&s.length>=2&&a[0]===s[0]&&a[1]===s[1]){e.push(t);break}}}return e}async _handleT1StripLengthChange(e){if(!this.hass)return;const t=e.detail.value;if("number"!=typeof t)return;const i=this._findAllT1StripLengthEntities();if(i.length)try{await Promise.all(i.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:t})))}catch(e){console.error("Failed to set T1 Strip length:",e)}}_handleCurvatureInput(e){const{curvature:t}=e.detail;"number"==typeof t&&(this._localCurvature=t)}_handleCurvatureNumberChange(e){const t=e.detail.value;if("number"==typeof t){const e=Math.max(.2,Math.min(6,t));this._localCurvature=Math.round(100*e)/100}}_getCurvatureDescription(){return this._localCurvature<.9?"Fast start, slow end":this._localCurvature<=1.1?"Linear (uniform)":"Slow start, fast end"}async _applyCurvature(){if(!this.hass)return;const e=this._findAllTransitionCurveEntities();if(e.length){this._applyingCurvature=!0;try{await Promise.all(e.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:this._localCurvature})))}catch(e){console.error("Failed to set transition curve curvature:",e)}finally{this._applyingCurvature=!1}}}_loadCurvatureFromEntity(){const e=this._findTransitionCurveEntity();if(!this.hass||!e)return;const t=this.hass.states[e];if(!t)return;const i=parseFloat(t.state);!isNaN(i)&&i>=.2&&i<=6&&(this._localCurvature=Math.round(100*i)/100)}};wt.styles=ze,wt.PRESET_DEVICE_TYPES=[{key:"t2_bulb",label:"T2 Bulb"},{key:"t1",label:"T1 (20 segments)"},{key:"t1m",label:"T1M (26 segments)"},{key:"t1_strip",label:"T1 Strip"}],e([pe({attribute:!1})],wt.prototype,"hass",void 0),e([pe({type:Boolean,reflect:!0})],wt.prototype,"narrow",void 0),e([_e()],wt.prototype,"_presets",void 0),e([_e()],wt.prototype,"_loading",void 0),e([_e()],wt.prototype,"_error",void 0),e([_e()],wt.prototype,"_selectedEntities",void 0),e([_e()],wt.prototype,"_brightness",void 0),e([_e()],wt.prototype,"_useCustomBrightness",void 0),e([_e()],wt.prototype,"_collapsed",void 0),e([_e()],wt.prototype,"_hasIncompatibleLights",void 0),e([_e()],wt.prototype,"_favorites",void 0),e([_e()],wt.prototype,"_activeFavoriteId",void 0),e([_e()],wt.prototype,"_showFavoriteInput",void 0),e([_e()],wt.prototype,"_favoriteInputName",void 0),e([_e()],wt.prototype,"_activeTab",void 0),e([_e()],wt.prototype,"_userPresets",void 0),e([_e()],wt.prototype,"_editingPreset",void 0),e([_e()],wt.prototype,"_effectPreviewActive",void 0),e([_e()],wt.prototype,"_cctPreviewActive",void 0),e([_e()],wt.prototype,"_segmentSequencePreviewActive",void 0),e([_e()],wt.prototype,"_sortPreferences",void 0),e([_e()],wt.prototype,"_backendVersion",void 0),e([_e()],wt.prototype,"_frontendVersion",void 0),e([_e()],wt.prototype,"_supportedEntities",void 0),e([_e()],wt.prototype,"_z2mInstances",void 0),e([_e()],wt.prototype,"_localCurvature",void 0),e([_e()],wt.prototype,"_applyingCurvature",void 0),e([_e()],wt.prototype,"_isExporting",void 0),e([_e()],wt.prototype,"_isImporting",void 0),wt=$t=e([ce("aqara-advanced-lighting-panel")],wt);const Ct=[{x:.68,y:.31},{x:.17,y:.7},{x:.15,y:.06},{x:.42,y:.51},{x:.38,y:.16},{x:.22,y:.33}],St=[{x:.68,y:.31},{x:.15,y:.06}],kt=[{x:.68,y:.31},{x:.17,y:.7}];function Pt(e,t=255){return Ie(Te(e.x,e.y,t))}let zt=class extends ne{constructor(){super(...arguments),this.mode="selection",this.maxSegments=10,this.value="",this.colorValue=new Map,this.colorPalette=[...Ct],this.gradientColors=[...St],this.blockColors=[...kt],this.expandBlocks=!1,this.gradientMirror=!1,this.gradientRepeat=1,this.gradientReverse=!1,this.gradientInterpolation="shortest",this.gradientWave=!1,this.gradientWaveCycles=1,this.label="",this.description="",this.disabled=!1,this.translations={},this._selectedSegments=new Set,this._coloredSegments=new Map,this._lastSelectedIndex=null,this._selectedPaletteIndex=0,this._clearMode=!1,this._selectMode=!1,this._patternMode="individual",this._initialPatternApplied=!1,this._editingColorSource=null,this._editingColorIndex=null,this._editingColor=null,this._hsColorCache=new Map,this._wheelIsDragging=!1,this._wheelCanvasId=null,this._wheelMarkerId=null,this._wheelSize=0,this._wheelPointerMoveBound=null,this._wheelPointerUpBound=null}static get styles(){return a`
      :host {
        display: block;
      }

      .segment-selector {
        width: 100%;
      }

      .label {
        display: block;
        font-weight: 500;
        margin-bottom: 8px;
        color: var(--primary-text-color);
      }

      .segment-grid-container {
        background: var(--card-background-color);
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 8px;
      }

      .segment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
        gap: 4px;
        margin-bottom: 12px;
      }

      .segment-cell {
        aspect-ratio: 1;
        border-radius: 4px;
        cursor: pointer;
        border: 2px solid var(--divider-color);
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
        color: var(--secondary-text-color);
        background: var(--primary-background-color);
        user-select: none;
      }

      .segment-cell:hover {
        transform: scale(1.1);
        z-index: 1;
        border-color: var(--primary-color);
      }

      .segment-cell.selected {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px var(--primary-color);
      }

      .segment-cell.colored {
        border-color: transparent;
        color: transparent;
      }

      .segment-cell.disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      /* Clear mode cursor */
      .segment-grid.clear-mode .segment-cell.colored {
        cursor: not-allowed;
      }

      .segment-grid.clear-mode .segment-cell.colored:hover {
        opacity: 0.7;
      }

      /* Select mode cursor */
      .segment-grid.select-mode .segment-cell {
        cursor: crosshair;
      }

      .segment-grid.select-mode .segment-cell:hover {
        border-color: var(--info-color, #2196f3);
      }

      .controls {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-bottom: 8px;
      }

      .controls ha-button {
        --mdc-theme-primary: var(--primary-color);
      }

      .selection-info {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: var(--primary-background-color);
        border-radius: 4px;
        font-size: 12px;
        color: var(--secondary-text-color);
      }

      .selection-info ha-icon {
        --mdc-icon-size: 16px;
      }

      /* Clear mode toggle button */
      .clear-mode-toggle.active {
        --mdc-theme-primary: var(--error-color);
        color: var(--error-color);
      }

      /* Select mode toggle button */
      .select-mode-toggle.active {
        --mdc-theme-primary: var(--info-color, #2196f3);
        color: var(--info-color, #2196f3);
      }

      .description {
        display: block;
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 4px;
      }

      .hint {
        display: block;
        font-size: 11px;
        color: var(--secondary-text-color);
        margin-top: 8px;
        font-style: italic;
      }

      /* Color palette styles */
      .color-palette-container {
        margin-top: 8px;
        padding: 16px;
        background: var(--card-background-color);
        border-radius: 8px;
      }

      .mode-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 16px;
        border-bottom: 2px solid var(--divider-color);
      }

      .mode-tab {
        padding: 8px 16px;
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        color: var(--secondary-text-color);
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: all 0.2s ease;
      }

      .mode-tab:hover {
        color: var(--primary-text-color);
        background: var(--secondary-background-color);
      }

      .mode-tab.active {
        color: var(--primary-color);
        border-bottom-color: var(--primary-color);
      }

      .mode-description {
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-bottom: 16px;
        padding: 8px 12px;
        background: var(--secondary-background-color);
        border-radius: 4px;
      }

      .color-palette {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
      }

      .palette-label {
        font-size: 13px;
        color: var(--secondary-text-color);
        margin-right: 8px;
      }

      .palette-color-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .palette-color {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        cursor: pointer;
        border: 3px solid var(--divider-color);
        transition: all 0.2s ease;
        position: relative;
      }

      .palette-color:hover {
        transform: scale(1.1);
        border-color: var(--primary-color);
      }

      .palette-color.selected {
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px var(--primary-color);
      }

      .palette-edit-btn {
        padding: 4px;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .palette-edit-btn:hover {
        background: var(--primary-color);
        color: var(--text-primary-color);
      }

      .palette-edit-btn ha-icon {
        --mdc-icon-size: 16px;
      }

      /* Color array for gradient/blocks modes */
      .color-array {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        align-items: center;
        margin-bottom: 16px;
      }

      .color-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .color-swatch {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        cursor: pointer;
        border: 2px solid var(--divider-color);
        transition: all 0.2s ease;
      }

      .color-swatch:hover {
        transform: scale(1.05);
        border-color: var(--primary-color);
      }

      .color-remove {
        padding: 4px;
        background: var(--secondary-background-color);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .color-remove:hover {
        background: var(--error-color);
        color: white;
      }

      .color-remove ha-icon {
        --mdc-icon-size: 16px;
      }

      .color-remove-spacer {
        height: 26px;
        visibility: hidden;
      }

      .add-color-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        gap: 4px;
      }

      .add-color-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border: 2px dashed var(--divider-color);
        border-radius: 8px;
        cursor: pointer;
        color: var(--secondary-text-color);
        transition: all 0.2s ease;
      }

      .add-color-btn:hover .add-color-icon {
        border-color: var(--primary-color);
        color: var(--primary-color);
        transform: scale(1.05);
      }

      .add-color-icon ha-icon {
        --mdc-icon-size: 24px;
      }

      .generated-actions {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-top: 16px;
      }

      .options-row {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-top: 12px;
        flex-wrap: wrap;
      }

      .option-item {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
      }

      .option-label {
        font-size: 13px;
        color: var(--secondary-text-color);
      }

      .option-number-input {
        width: 50px;
        padding: 4px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 13px;
        text-align: center;
      }

      .option-select {
        padding: 4px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 13px;
      }

      /* Color picker modal */
      .color-picker-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }

      .color-picker-modal {
        background: var(--card-background-color);
        border-radius: 8px;
        padding: 24px;
        width: 298px;
        max-width: calc(100vw - 80px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .color-picker-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
      }

      .color-picker-modal-title {
        font-size: 18px;
        font-weight: 500;
        color: var(--primary-text-color);
      }

      .color-picker-modal-preview {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        border: 2px solid var(--divider-color);
      }

      .color-picker-canvas-container {
        display: flex;
        justify-content: center;
        margin: 20px 0;
      }

      .color-picker-rgb-inputs {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin: 16px 0;
      }

      .rgb-input-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }

      .rgb-input-channel {
        font-size: 12px;
        font-weight: 500;
        color: var(--secondary-text-color);
        text-transform: uppercase;
      }

      .rgb-input-field {
        width: 60px;
        padding: 6px 8px;
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        background: var(--card-background-color);
        color: var(--primary-text-color);
        font-size: 14px;
        font-family: monospace;
        text-align: center;
      }

      .rgb-input-field:focus {
        outline: none;
        border-color: var(--primary-color);
      }

      .color-picker-modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 20px;
      }

      .color-history-section {
        margin: 16px 0 0;
        width: 100%;
      }

      .color-history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .color-history-label {
        font-size: var(--ha-font-size-s, 12px);
        font-weight: var(--ha-font-weight-medium, 500);
        color: var(--secondary-text-color);
      }

      .color-history-clear {
        background: none;
        border: none;
        color: var(--secondary-text-color);
        cursor: pointer;
        font-size: var(--ha-font-size-s, 12px);
        padding: 2px 6px;
        border-radius: 4px;
        transition: all 0.15s ease;
      }

      .color-history-clear:hover {
        color: var(--primary-color);
        background: var(--secondary-background-color);
      }

      .color-history-swatches {
        display: flex;
        gap: 6px;
      }

      .color-history-swatch {
        width: 32px;
        height: 32px;
        border: 2px solid var(--divider-color);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.15s ease;
        padding: 0;
        flex-shrink: 0;
      }

      .color-history-swatch:hover {
        transform: scale(1.1);
        border-color: var(--primary-color);
      }

      .color-history-swatch:active {
        transform: scale(0.95);
      }

      @media (max-width: 600px) {
        .segment-grid {
          grid-template-columns: repeat(auto-fill, minmax(32px, 1fr));
          gap: 3px;
        }

        .segment-cell {
          font-size: 9px;
        }

        .controls ha-button {
          width: calc(50% - 4px);
        }

        .mode-tabs {
          overflow-x: auto;
        }
      }
    `}updated(e){!e.has("value")||e.get("value")===this.value||"selection"!==this.mode&&"sequence"!==this.mode||this._parseValue(),!e.has("colorValue")||e.get("colorValue")===this.colorValue||"color"!==this.mode&&"sequence"!==this.mode||this._parseColorValue(),this.initialPatternMode&&!this._initialPatternApplied&&"individual"!==this.initialPatternMode&&this.maxSegments>0&&(this._initialPatternApplied=!0,this._patternMode=this.initialPatternMode,this._applyToGrid()),e.has("maxSegments")&&this._validateSelection()}_parseValue(){const e=new Set;if(!this.value||""===this.value.trim())return void(this._selectedSegments=e);const t=this.value.trim().toLowerCase();if("all"===t){for(let t=0;t<this.maxSegments;t++)e.add(t);return void(this._selectedSegments=e)}const i=t.split(",");for(const t of i){const i=t.trim();if(i)if(i.includes("-")){const t=i.split("-").map(e=>e.trim()),s=t[0]??"",o=t[1]??"",r=parseInt(s,10),a=parseInt(o,10);if(!isNaN(r)&&!isNaN(a)){const t=Math.max(0,r-1),i=Math.min(this.maxSegments-1,a-1);for(let s=t;s<=i;s++)e.add(s)}}else{const t=parseInt(i,10);if(!isNaN(t)){const i=t-1;i>=0&&i<this.maxSegments&&e.add(i)}}}this._selectedSegments=e}_parseColorValue(){this.colorValue instanceof Map?this._coloredSegments=new Map(this.colorValue):this._coloredSegments=new Map}_validateSelection(){const e=new Set;for(const t of this._selectedSegments)t<this.maxSegments&&e.add(t);e.size!==this._selectedSegments.size&&(this._selectedSegments=e,"selection"!==this.mode&&"sequence"!==this.mode||this._fireValueChanged());const t=new Map;for(const[e,i]of this._coloredSegments)e<this.maxSegments&&t.set(e,i);t.size!==this._coloredSegments.size&&(this._coloredSegments=t,"color"!==this.mode&&"sequence"!==this.mode||this._fireColorValueChanged())}_segmentsToString(){if(0===this._selectedSegments.size)return"";if(this._selectedSegments.size===this.maxSegments)return"all";const e=Array.from(this._selectedSegments).sort((e,t)=>e-t),t=[];if(0===e.length)return"";let i=e[0],s=e[0];for(let o=1;o<e.length;o++){const r=e[o];r===s+1?s=r:(t.push(i===s?`${i+1}`:`${i+1}-${s+1}`),i=s=r)}return t.push(i===s?`${i+1}`:`${i+1}-${s+1}`),t.join(",")}_handleSegmentClick(e,t){this.disabled||(t.preventDefault(),"selection"===this.mode?this._handleSelectionClick(e,t):"color"!==this.mode&&"sequence"!==this.mode||this._handleColorClick(e,t))}_handleSelectionClick(e,t){const i=new Set(this._selectedSegments);if(t.shiftKey&&null!==this._lastSelectedIndex){const t=Math.min(this._lastSelectedIndex,e),s=Math.max(this._lastSelectedIndex,e);for(let e=t;e<=s;e++)i.add(e)}else t.ctrlKey||t.metaKey,i.has(e)?i.delete(e):i.add(e);this._lastSelectedIndex=e,this._selectedSegments=i,this._fireValueChanged()}_handleColorClick(e,t){if(this._clearMode){const t=new Map(this._coloredSegments);return t.delete(e),this._coloredSegments=t,void this._fireColorValueChanged()}if(this._selectMode||t.shiftKey){const t=new Set(this._selectedSegments);t.has(e)?t.delete(e):t.add(e),this._selectedSegments=t}else if(t.ctrlKey||t.metaKey)this._selectedSegments=new Set([...this._selectedSegments,e]);else{const t=this.colorPalette[this._selectedPaletteIndex];if(!t)return;const i=new Map(this._coloredSegments);i.set(e,{...t}),this._coloredSegments=i,this._fireColorValueChanged()}}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,String(t))}),o}_selectAll(){if(this.disabled)return;const e=new Set;for(let t=0;t<this.maxSegments;t++)e.add(t);this._selectedSegments=e,this._lastSelectedIndex=null,"selection"!==this.mode&&"sequence"!==this.mode||this._fireValueChanged()}_clearAll(){this.disabled||(this._selectedSegments=new Set,this._coloredSegments=new Map,this._lastSelectedIndex=null,"selection"!==this.mode&&"sequence"!==this.mode||this._fireValueChanged(),"color"!==this.mode&&"sequence"!==this.mode||this._fireColorValueChanged())}_selectFirstHalf(){if(this.disabled)return;const e=new Set,t=Math.floor(this.maxSegments/2);for(let i=0;i<t;i++)e.add(i);this._selectedSegments=e,this._lastSelectedIndex=null,this._fireValueChanged()}_selectSecondHalf(){if(this.disabled)return;const e=new Set;for(let t=Math.floor(this.maxSegments/2);t<this.maxSegments;t++)e.add(t);this._selectedSegments=e,this._lastSelectedIndex=null,this._fireValueChanged()}_selectOdd(){if(this.disabled)return;const e=new Set;for(let t=0;t<this.maxSegments;t+=2)e.add(t);this._selectedSegments=e,this._lastSelectedIndex=null,this._fireValueChanged()}_selectEven(){if(this.disabled)return;const e=new Set;for(let t=1;t<this.maxSegments;t+=2)e.add(t);this._selectedSegments=e,this._lastSelectedIndex=null,this._fireValueChanged()}_clearSelected(){if(!this.disabled&&0!==this._selectedSegments.size){if("color"===this.mode||"sequence"===this.mode){const e=new Map(this._coloredSegments);for(const t of this._selectedSegments)e.delete(t);this._coloredSegments=e,this._fireColorValueChanged()}this._selectedSegments=new Set}}_toggleClearMode(){this._clearMode=!this._clearMode,this._clearMode&&(this._selectMode=!1)}_toggleSelectMode(){this._selectMode=!this._selectMode,this._selectMode&&(this._clearMode=!1)}_selectPaletteColor(e){this._selectedPaletteIndex=e}_applyToSelected(){if(0===this._selectedSegments.size)return;const e=this.colorPalette[this._selectedPaletteIndex];if(!e)return;const t=new Map(this._coloredSegments);for(const i of this._selectedSegments)t.set(i,{...e});this._coloredSegments=t,this._selectedSegments=new Set,this._fireColorValueChanged()}_setPatternMode(e){this._patternMode=e,this._clearMode=!1,this._selectMode=!1}_addGradientColor(){if(this.gradientColors.length>=6||0===this.gradientColors.length)return;const e=Re(this.gradientColors[this.gradientColors.length-1]);this.gradientColors=[...this.gradientColors,e],this._fireGradientColorsChanged()}_removeGradientColor(e){this.gradientColors.length<=2||(this.gradientColors=this.gradientColors.filter((t,i)=>i!==e),this._fireGradientColorsChanged())}_addBlockColor(){if(this.blockColors.length>=6||0===this.blockColors.length)return;const e=Re(this.blockColors[this.blockColors.length-1]);this.blockColors=[...this.blockColors,e],this._fireBlockColorsChanged()}_removeBlockColor(e){this.blockColors.length<=1||(this.blockColors=this.blockColors.filter((t,i)=>i!==e),this._fireBlockColorsChanged())}_handleExpandBlocksChange(e){this.expandBlocks=e.target.checked}_handleGradientReverseChange(e){this.gradientReverse=e.target.checked}_handleGradientMirrorChange(e){this.gradientMirror=e.target.checked}_handleGradientWaveChange(e){this.gradientWave=e.target.checked}_handleGradientRepeatChange(e){this.gradientRepeat=Math.max(1,Math.min(10,parseInt(e.target.value)||1))}_handleGradientWaveCyclesChange(e){this.gradientWaveCycles=Math.max(1,Math.min(5,parseInt(e.target.value)||1))}_handleGradientInterpolationChange(e){this.gradientInterpolation=e.target.value}_interpolateHue(e,t,i){let s=t-e;s>180?s-=360:s<-180&&(s+=360);let o=e+s*i;return o<0&&(o+=360),o>=360&&(o-=360),o}_interpolateHueLongest(e,t,i){let s=t-e;s>0&&s<=180?s-=360:s<0&&s>=-180&&(s+=360);let o=e+s*i;return o<0&&(o+=360),o>=360&&(o-=360),o}_interpolateColorPair(e,t,i,s,o){if("rgb"===this.gradientInterpolation){const e=Te(i.x,i.y,255),t=Te(s.x,s.y,255);return Ae(Math.round(e.r+(t.r-e.r)*o),Math.round(e.g+(t.g-e.g)*o),Math.round(e.b+(t.b-e.b)*o))}const r="longest"===this.gradientInterpolation?this._interpolateHueLongest(e.h,t.h,o):this._interpolateHue(e.h,t.h,o);return Ue({h:Math.round(r),s:Math.round(e.s+(t.s-e.s)*o)})}_applyWaveTransform(e){return.5-.5*Math.cos(e*Math.PI*2*this.gradientWaveCycles)}_generateGradientColorArray(e){if(0===e||this.gradientColors.length<2)return[];const t=this.gradientReverse?[...this.gradientColors].reverse():[...this.gradientColors],i=t.length,s=t.map(e=>De(e)),o=this.gradientMirror?Math.ceil(e/2):e,r=this.gradientRepeat>1?Math.max(2,Math.ceil(o/this.gradientRepeat)):o,a=[];for(let e=0;e<r;e++){let o=r>1?e/(r-1):0;this.gradientWave&&(o=this._applyWaveTransform(o));const n=o*(i-1),l=Math.floor(n),c=n-l,d=s[Math.min(l,i-1)],h=s[Math.min(l+1,i-1)],p=t[Math.min(l,i-1)],_=t[Math.min(l+1,i-1)];a.push(this._interpolateColorPair(d,h,p,_,c))}const n=[];for(let e=0;e<o;e++)n.push(a[e%r]);if(this.gradientMirror){const t=[...n],i=[...n].reverse();for(let s=e%2!=0&&n.length>1?1:0;s<i.length;s++)t.push(i[s]);return t.slice(0,e)}return n}_generateGradientPattern(){if(this.gradientColors.length<2||0===this.maxSegments)return new Map;const e=this._generateGradientColorArray(this.maxSegments),t=new Map;return e.forEach((e,i)=>t.set(i,e)),t}_generateBlocksPattern(){const e=this.blockColors,t=e.length,i=new Map;if(0===t||0===this.maxSegments)return i;if(this.expandBlocks){const s=this.maxSegments/t;for(let o=0;o<this.maxSegments;o++){const r=e[Math.min(Math.floor(o/s),t-1)];i.set(o,{x:r.x,y:r.y})}}else for(let s=0;s<this.maxSegments;s++){const o=e[s%t];i.set(s,{x:o.x,y:o.y})}return i}_applyToGrid(){let e;if("gradient"===this._patternMode)e=this._generateGradientPattern();else{if("blocks"!==this._patternMode)return;e=this._generateBlocksPattern()}this._coloredSegments=e,this._fireColorValueChanged()}_applyToSelectedSegments(){if(0===this._selectedSegments.size)return;const e=Array.from(this._selectedSegments).sort((e,t)=>e-t),t=e.length;let i=[];if("gradient"===this._patternMode)i=this.gradientColors;else{if("blocks"!==this._patternMode)return;i=this.blockColors}const s=i.length,o=new Map(this._coloredSegments);if("gradient"===this._patternMode){const i=this._generateGradientColorArray(t);for(let s=0;s<t;s++){const t=e[s],r=i[s];o.set(t,r)}}else if("blocks"===this._patternMode)if(this.expandBlocks){const r=Math.ceil(t/s);for(let a=0;a<t;a++){const t=e[a],n=i[Math.min(Math.floor(a/r),s-1)];o.set(t,{x:n.x,y:n.y})}}else for(let r=0;r<t;r++){const t=e[r],a=i[r%s];o.set(t,{x:a.x,y:a.y})}this._coloredSegments=o,this._selectedSegments=new Set,this._fireColorValueChanged()}_openColorPicker(e,t){let i;if("palette"===e?i=this.colorPalette[t]:"gradient"===e?i=this.gradientColors[t]:"blocks"===e&&(i=this.blockColors[t]),!i)return;this._editingColorSource=e,this._editingColorIndex=t;const s=`${i.x.toFixed(4)},${i.y.toFixed(4)}`,o=this._hsColorCache.get(s);this._editingColor=o||De(i)}_confirmColorPicker(){if(null===this._editingColorIndex||null===this._editingColor||!this._editingColorSource)return void this._closeColorPicker();const e=Ue(this._editingColor);ot(e);const t=`${e.x.toFixed(4)},${e.y.toFixed(4)}`;this._hsColorCache.set(t,{h:this._editingColor.h,s:this._editingColor.s}),"palette"===this._editingColorSource?(this.colorPalette=this.colorPalette.map((t,i)=>i===this._editingColorIndex?e:t),this._fireColorPaletteChanged()):"gradient"===this._editingColorSource?(this.gradientColors=this.gradientColors.map((t,i)=>i===this._editingColorIndex?e:t),this._fireGradientColorsChanged()):"blocks"===this._editingColorSource&&(this.blockColors=this.blockColors.map((t,i)=>i===this._editingColorIndex?e:t),this._fireBlockColorsChanged()),this._closeColorPicker()}_closeColorPicker(){this._editingColorSource=null,this._editingColorIndex=null,this._editingColor=null}_selectHistoryColor(e){const t=De(e);this._editingColor={h:t.h,s:t.s};this._updateMarkerPosition("color-wheel-canvas","color-wheel-marker",220);const i=Te(e.x,e.y,255),s=this.shadowRoot?.querySelectorAll(".color-picker-rgb-inputs .rgb-input-field");s&&3===s.length&&(s[0].value=String(i.r),s[1].value=String(i.g),s[2].value=String(i.b));const o=this.shadowRoot?.querySelector(".color-picker-modal-preview");o&&(o.style.backgroundColor=Ie(i))}_clearColorHistory(){rt(),this.requestUpdate()}_renderColorHistory(){const e=st();return N`
      <div class="color-history-section">
        <div class="color-history-header">
          <span class="color-history-label">${this._localize("color_history.recent_colors")}</span>
          ${e.length>0?N`
            <button class="color-history-clear" @click=${this._clearColorHistory}>
              ${this._localize("color_history.clear")}
            </button>
          `:""}
        </div>
        <div class="color-history-swatches">
          ${e.map(e=>N`
            <button
              class="color-history-swatch"
              style="background-color: ${Pt(e,255)}"
              @click=${()=>this._selectHistoryColor(e)}
            ></button>
          `)}
        </div>
      </div>
    `}_handleRgbInput(e,t){const i=e.target;let s=parseInt(i.value,10);if(isNaN(s)||""===i.value)return;if(s=Math.max(0,Math.min(255,s)),!this._editingColor)return;const o=Ue(this._editingColor),r=Te(o.x,o.y,255),a={r:"r"===t?s:r.r,g:"g"===t?s:r.g,b:"b"===t?s:r.b},n=Ae(a.r,a.g,a.b),l=De(n);this._editingColor={h:l.h,s:l.s};this._updateMarkerPosition("color-wheel-canvas","color-wheel-marker",220);const c=this.shadowRoot?.querySelector(".color-picker-modal-preview");if(c){const e=Ie(Te(n.x,n.y,255));c.style.backgroundColor=e}const d=this.shadowRoot?.querySelectorAll(".rgb-input-field");if(d&&3===d.length){const e=Te(n.x,n.y,255),i="r"===t?0:"g"===t?1:2,o=d[0],r=d[1],a=d[2];o&&(o.value=String(e.r)),r&&(r.value=String(e.g)),a&&(a.value=String(e.b));if(("r"===t?e.r:"g"===t?e.g:e.b)!==s){const e=d[i];if(e){const t=e.style.borderColor;e.style.borderColor="var(--warning-color, #ff9800)",setTimeout(()=>{e.style.borderColor=t},500)}}}}_fireValueChanged(){const e=this._segmentsToString();this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:!0,composed:!0}))}_fireColorValueChanged(){this.dispatchEvent(new CustomEvent("color-value-changed",{detail:{value:this._coloredSegments,segments:this._segmentsToString()},bubbles:!0,composed:!0}))}_fireColorPaletteChanged(){this.dispatchEvent(new CustomEvent("color-palette-changed",{detail:{colors:this.colorPalette},bubbles:!0,composed:!0}))}_fireGradientColorsChanged(){this.dispatchEvent(new CustomEvent("gradient-colors-changed",{detail:{colors:this.gradientColors},bubbles:!0,composed:!0}))}_fireBlockColorsChanged(){this.dispatchEvent(new CustomEvent("block-colors-changed",{detail:{colors:this.blockColors},bubbles:!0,composed:!0}))}_renderGrid(){const e=[];for(let t=0;t<this.maxSegments;t++){const i=this._selectedSegments.has(t),s=this._coloredSegments.get(t),o=void 0!==s,r=[];i&&r.push("selected"),!o||"color"!==this.mode&&"sequence"!==this.mode||r.push("colored"),this.disabled&&r.push("disabled");const a=!o||"color"!==this.mode&&"sequence"!==this.mode?"":`background-color: ${Pt(s)}`;e.push(N`
        <div
          class="segment-cell ${r.join(" ")}"
          style="${a}"
          @click=${e=>this._handleSegmentClick(t,e)}
          title="Segment ${t+1}${i?" (selected)":""}${o?" (colored)":""}"
        >
          ${t+1}
        </div>
      `)}return N`
      <div class="segment-grid-container">
        <div class="segment-grid ${this._clearMode?"clear-mode":""} ${this._selectMode?"select-mode":""}">
          ${e}
        </div>
        ${this._renderControls()}
      </div>
    `}_renderControls(){const e=this._selectedSegments.size,t=e>0;return"selection"===this.mode?N`
        <div class="controls">
          <ha-button @click=${this._selectAll} .disabled=${this.disabled}>
            <ha-icon icon="mdi:select-all"></ha-icon>
            ${this._localize("editors.select_all_button")}
          </ha-button>
          <ha-button @click=${this._clearAll} .disabled=${this.disabled||!t}>
            <ha-icon icon="mdi:selection-off"></ha-icon>
            ${this._localize("editors.clear_all_button")}
          </ha-button>
          <ha-button @click=${this._selectFirstHalf} .disabled=${this.disabled}>
            <ha-icon icon="mdi:arrow-left-bold"></ha-icon>
            ${this._localize("editors.first_half_button")}
          </ha-button>
          <ha-button @click=${this._selectSecondHalf} .disabled=${this.disabled}>
            <ha-icon icon="mdi:arrow-right-bold"></ha-icon>
            ${this._localize("editors.second_half_button")}
          </ha-button>
          <ha-button @click=${this._selectOdd} .disabled=${this.disabled}>
            <ha-icon icon="mdi:numeric-1"></ha-icon>
            ${this._localize("editors.odd_button")}
          </ha-button>
          <ha-button @click=${this._selectEven} .disabled=${this.disabled}>
            <ha-icon icon="mdi:numeric-2"></ha-icon>
            ${this._localize("editors.even_button")}
          </ha-button>
          <div class="selection-info">
            <ha-icon icon="mdi:information-outline"></ha-icon>
            <span>${this._localize("editors.segments_selected",{count:e})}</span>
          </div>
        </div>
      `:"color"===this.mode||"sequence"===this.mode?N`
        <div class="controls">
          <ha-button
            class="${this._selectMode?"select-mode-toggle active":"select-mode-toggle"}"
            @click=${this._toggleSelectMode}
            .disabled=${this.disabled}
          >
            <ha-icon icon="${this._selectMode?"mdi:selection-multiple":"mdi:selection"}"></ha-icon>
            ${this._selectMode?this._localize("editors.select_mode_on"):this._localize("editors.select_mode_off")}
          </ha-button>
          <ha-button
            class="${this._clearMode?"clear-mode-toggle active":"clear-mode-toggle"}"
            @click=${this._toggleClearMode}
            .disabled=${this.disabled}
          >
            <ha-icon icon="${this._clearMode?"mdi:eraser":"mdi:eraser-variant"}"></ha-icon>
            ${this._clearMode?this._localize("editors.clear_mode_on"):this._localize("editors.clear_mode_off")}
          </ha-button>
          <ha-button @click=${this._selectAll} .disabled=${this.disabled}>
            ${this._localize("editors.select_all_button")}
          </ha-button>
          <ha-button @click=${this._clearSelected} .disabled=${this.disabled||!t}>
            ${this._localize("editors.clear_selected_button")}
          </ha-button>
          <ha-button @click=${this._clearAll} .disabled=${this.disabled}>
            ${this._localize("editors.clear_all_button")}
          </ha-button>
          <div class="selection-info">
            <span>${this._localize("editors.segments_selected",{count:e})}</span>
          </div>
        </div>
      `:""}_renderColorPalette(){return"color"!==this.mode&&"sequence"!==this.mode?"":N`
      <div class="color-palette-container">
        ${"color"===this.mode?this._renderModeTabs():""}
        ${this._renderModeContent()}
      </div>
    `}_renderModeTabs(){return N`
      <div class="mode-tabs">
        <button
          class="mode-tab ${"individual"===this._patternMode?"active":""}"
          @click=${()=>this._setPatternMode("individual")}
        >
          ${this._localize("editors.individual_tab")}
        </button>
        <button
          class="mode-tab ${"gradient"===this._patternMode?"active":""}"
          @click=${()=>this._setPatternMode("gradient")}
        >
          ${this._localize("editors.gradient_tab")}
        </button>
        <button
          class="mode-tab ${"blocks"===this._patternMode?"active":""}"
          @click=${()=>this._setPatternMode("blocks")}
        >
          ${this._localize("editors.blocks_tab")}
        </button>
      </div>
    `}_renderModeContent(){return"sequence"===this.mode||"individual"===this._patternMode?this._renderIndividualMode():"gradient"===this._patternMode?this._renderGradientMode():"blocks"===this._patternMode?this._renderBlocksMode():N``}_renderIndividualMode(){return N`
      <div class="mode-description">
        Click a color to select it, then click segments to apply.
      </div>
      <div class="color-palette">
        ${this.colorPalette.map((e,t)=>N`
          <div class="palette-color-wrapper">
            <div
              class="palette-color ${this._selectedPaletteIndex===t?"selected":""}"
              style="background-color: ${Pt(e)}"
              @click=${()=>this._selectPaletteColor(t)}
            ></div>
            <button
              class="palette-edit-btn"
              @click=${()=>this._openColorPicker("palette",t)}
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
          </div>
        `)}
      </div>
      <div class="generated-actions">
        <ha-button
          @click=${this._applyToSelected}
          .disabled=${0===this._selectedSegments.size}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          ${this._localize("editors.apply_to_selected_button")}
        </ha-button>
      </div>
    `}_renderGradientMode(){return N`
      <div class="mode-description">
        ${this._localize("editors.gradient_mode_description")}
      </div>
      <div class="color-array">
        ${this.gradientColors.map((e,t)=>N`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${Pt(e)}"
              @click=${()=>this._openColorPicker("gradient",t)}
            ></div>
            ${this.gradientColors.length>2?N`
              <button class="color-remove" @click=${()=>this._removeGradientColor(t)}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            `:N`<div class="color-remove-spacer"></div>`}
          </div>
        `)}
        ${this.gradientColors.length<6?N`
          <div class="add-color-btn">
            <div class="add-color-icon" @click=${this._addGradientColor}>
              <ha-icon icon="mdi:plus"></ha-icon>
            </div>
            <div class="color-remove-spacer"></div>
          </div>
        `:""}
      </div>
      <div class="options-row">
        <label class="option-item">
          <input
            type="checkbox"
            .checked=${this.gradientReverse}
            @change=${this._handleGradientReverseChange}
          />
          <span class="option-label">${this._localize("editors.gradient_reverse_label")}</span>
        </label>
        <label class="option-item">
          <input
            type="checkbox"
            .checked=${this.gradientMirror}
            @change=${this._handleGradientMirrorChange}
          />
          <span class="option-label">${this._localize("editors.gradient_mirror_label")}</span>
        </label>
        <label class="option-item">
          <input
            type="checkbox"
            .checked=${this.gradientWave}
            @change=${this._handleGradientWaveChange}
          />
          <span class="option-label">${this._localize("editors.gradient_wave_label")}</span>
        </label>
      </div>
      <div class="options-row">
        <label class="option-item">
          <span class="option-label">${this._localize("editors.gradient_repeat_label")}</span>
          <input
            type="number"
            class="option-number-input"
            min="1"
            max="10"
            .value=${String(this.gradientRepeat)}
            @change=${this._handleGradientRepeatChange}
          />
        </label>
        ${this.gradientWave?N`
          <label class="option-item">
            <span class="option-label">${this._localize("editors.gradient_wave_cycles_label")}</span>
            <input
              type="number"
              class="option-number-input"
              min="1"
              max="5"
              .value=${String(this.gradientWaveCycles)}
              @change=${this._handleGradientWaveCyclesChange}
            />
          </label>
        `:""}
        <label class="option-item">
          <span class="option-label">${this._localize("editors.gradient_interpolation_label")}</span>
          <select
            class="option-select"
            .value=${this.gradientInterpolation}
            @change=${this._handleGradientInterpolationChange}
          >
            <option value="shortest">${this._localize("editors.gradient_interp_shortest")}</option>
            <option value="longest">${this._localize("editors.gradient_interp_longest")}</option>
            <option value="rgb">${this._localize("editors.gradient_interp_rgb")}</option>
          </select>
        </label>
      </div>
      <div class="generated-actions">
        <ha-button @click=${this._applyToGrid}>
          <ha-icon icon="mdi:grid"></ha-icon>
          ${this._localize("editors.apply_to_grid_button")}
        </ha-button>
        <ha-button
          @click=${this._applyToSelectedSegments}
          .disabled=${0===this._selectedSegments.size}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          ${this._localize("editors.apply_to_selected_button")}
        </ha-button>
      </div>
    `}_renderBlocksMode(){return N`
      <div class="mode-description">
        ${this._localize("editors.blocks_mode_description")}
      </div>
      <div class="color-array">
        ${this.blockColors.map((e,t)=>N`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${Pt(e)}"
              @click=${()=>this._openColorPicker("blocks",t)}
            ></div>
            ${this.blockColors.length>1?N`
              <button class="color-remove" @click=${()=>this._removeBlockColor(t)}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            `:N`<div class="color-remove-spacer"></div>`}
          </div>
        `)}
        ${this.blockColors.length<6?N`
          <div class="add-color-btn">
            <div class="add-color-icon" @click=${this._addBlockColor}>
              <ha-icon icon="mdi:plus"></ha-icon>
            </div>
            <div class="color-remove-spacer"></div>
          </div>
        `:""}
      </div>
      <div class="options-row">
        <label class="option-item">
          <input
            type="checkbox"
            .checked=${this.expandBlocks}
            @change=${this._handleExpandBlocksChange}
          />
          <span class="option-label">${this._localize("editors.expand_blocks_label")}</span>
        </label>
      </div>
      <div class="generated-actions">
        <ha-button @click=${this._applyToGrid}>
          <ha-icon icon="mdi:grid"></ha-icon>
          ${this._localize("editors.apply_to_grid_button")}
        </ha-button>
        <ha-button
          @click=${this._applyToSelectedSegments}
          .disabled=${0===this._selectedSegments.size}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          ${this._localize("editors.apply_to_selected_button")}
        </ha-button>
      </div>
    `}_renderColorPickerModal(){if(null===this._editingColorSource||null===this._editingColor)return"";const e=Ue(this._editingColor),t=Te(e.x,e.y,255),i=Ie(t);return N`
      <div class="color-picker-modal-overlay" @click=${this._closeColorPicker}>
        <div class="color-picker-modal" @click=${e=>e.stopPropagation()}>
          <div class="color-picker-modal-header">
            <span class="color-picker-modal-title">${this._localize("editors.color_picker_title")}</span>
            <div
              class="color-picker-modal-preview"
              style="background-color: ${i}"
            ></div>
          </div>
          <div class="color-picker-canvas-container">
            ${this._renderColorWheel()}
          </div>
          <div class="color-picker-rgb-inputs">
            <label class="rgb-input-label">
              <span class="rgb-input-channel">R</span>
              <input
                type="number"
                class="rgb-input-field"
                min="0"
                max="255"
                .value=${String(t.r)}
                @input=${e=>this._handleRgbInput(e,"r")}
              />
            </label>
            <label class="rgb-input-label">
              <span class="rgb-input-channel">G</span>
              <input
                type="number"
                class="rgb-input-field"
                min="0"
                max="255"
                .value=${String(t.g)}
                @input=${e=>this._handleRgbInput(e,"g")}
              />
            </label>
            <label class="rgb-input-label">
              <span class="rgb-input-channel">B</span>
              <input
                type="number"
                class="rgb-input-field"
                min="0"
                max="255"
                .value=${String(t.b)}
                @input=${e=>this._handleRgbInput(e,"b")}
              />
            </label>
          </div>
          ${this._renderColorHistory()}
          <div class="color-picker-modal-actions">
            <ha-button @click=${this._closeColorPicker}>${this._localize("editors.cancel_button")}</ha-button>
            <ha-button @click=${this._confirmColorPicker}>
              <ha-icon icon="mdi:check"></ha-icon>
              ${this._localize("editors.apply_button")}
            </ha-button>
          </div>
        </div>
      </div>
    `}_renderColorWheel(){const e=220,t="color-wheel-canvas",i="color-wheel-marker";if(!this._editingColor)return N``;const s=Ue(this._editingColor),o=Ie(Te(s.x,s.y,255)),{x:r,y:a}=this._hsToWheelPosition(this._editingColor,e);return setTimeout(()=>{this._drawColorWheel(t,e),this._wheelIsDragging||this._updateMarkerPosition(t,i,e)},0),N`
      <div class="hs-color-picker-container" style="width: ${e}px; height: ${e}px; position: relative; margin: 0 auto; touch-action: none;">
        <canvas
          id="${t}"
          width="${e}"
          height="${e}"
          style="border-radius: 50%; cursor: crosshair; display: block;"
          @mousedown=${s=>this._onWheelPointerDown(s,t,i,e)}
          @touchstart=${s=>this._onWheelPointerDown(s,t,i,e)}
        ></canvas>
        <div
          id="${i}"
          style="position: absolute; left: ${r}px; top: ${a}px; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3); pointer-events: none; transform: translate(-50%, -50%); transition: box-shadow 0.1s ease; background-color: ${o};"
        ></div>
      </div>
    `}_drawColorWheel(e,t){const i=this.shadowRoot?.getElementById(e);if(!i)return;const s=i.getContext("2d");if(!s)return;const o=t/2,r=t/2,a=t/2;i.width=t,i.height=t;for(let e=0;e<360;e++){const t=(e-1)*Math.PI/180,i=(e+1)*Math.PI/180,n=s.createRadialGradient(o,r,0,o,r,a);n.addColorStop(0,`hsl(${e}, 0%, 100%)`),n.addColorStop(1,`hsl(${e}, 100%, 50%)`),s.beginPath(),s.moveTo(o,r),s.arc(o,r,a,t,i),s.closePath(),s.fillStyle=n,s.fill()}}_updateMarkerPosition(e,t,i){const s=this.shadowRoot?.getElementById(t);if(!s||!this._editingColor)return;const{x:o,y:r}=this._hsToWheelPosition(this._editingColor,i),a=Ue(this._editingColor),n=Ie(Te(a.x,a.y,255));s.style.left=`${o}px`,s.style.top=`${r}px`,s.style.backgroundColor=n}_hsToWheelPosition(e,t){const i=t/2,s=t/2,o=t/2,r=e.h*Math.PI/180,a=e.s/100*o;return{x:i+a*Math.cos(r),y:s+a*Math.sin(r)}}_wheelPositionToHs(e,t,i){const s=i/2,o=e-i/2,r=t-i/2;let a=Math.sqrt(o*o+r*r);a=Math.min(a,s);let n=180*Math.atan2(r,o)/Math.PI;n<0&&(n+=360);let l=Math.round(a/s*100);return l>=98&&(l=100),{h:Math.round(n)%360,s:l}}_onWheelPointerDown(e,t,i,s){e.preventDefault(),this._wheelIsDragging=!0,this._wheelCanvasId=t,this._wheelMarkerId=i,this._wheelSize=s;const o=this.shadowRoot?.getElementById(i);o&&(o.style.boxShadow="0 0 8px rgba(0, 0, 0, 0.7), inset 0 0 2px rgba(0, 0, 0, 0.3)"),this._handleWheelInteraction(e,t,i,s),e instanceof MouseEvent?(this._wheelPointerMoveBound=e=>this._onWheelPointerMove(e),this._wheelPointerUpBound=()=>this._onWheelPointerUp(),window.addEventListener("mousemove",this._wheelPointerMoveBound),window.addEventListener("mouseup",this._wheelPointerUpBound)):(this._wheelPointerMoveBound=e=>this._onWheelPointerMove(e),this._wheelPointerUpBound=()=>this._onWheelPointerUp(),window.addEventListener("touchmove",this._wheelPointerMoveBound,{passive:!1}),window.addEventListener("touchend",this._wheelPointerUpBound))}_onWheelPointerMove(e){this._wheelIsDragging&&this._wheelCanvasId&&this._wheelMarkerId&&(e.preventDefault(),this._handleWheelInteraction(e,this._wheelCanvasId,this._wheelMarkerId,this._wheelSize))}_onWheelPointerUp(){this._wheelIsDragging=!1;const e=this._wheelMarkerId?this.shadowRoot?.getElementById(this._wheelMarkerId):null;e&&(e.style.boxShadow="0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3)"),this._wheelPointerMoveBound&&(window.removeEventListener("mousemove",this._wheelPointerMoveBound),window.removeEventListener("touchmove",this._wheelPointerMoveBound),this._wheelPointerMoveBound=null),this._wheelPointerUpBound&&(window.removeEventListener("mouseup",this._wheelPointerUpBound),window.removeEventListener("touchend",this._wheelPointerUpBound),this._wheelPointerUpBound=null)}_handleWheelInteraction(e,t,i,s){const o=this.shadowRoot?.getElementById(t);if(!o)return;const r=o.getBoundingClientRect();let a,n;if("touches"in e){const t=e.touches[0];if(!t)return;a=t.clientX,n=t.clientY}else a=e.clientX,n=e.clientY;const l=a-r.left,c=n-r.top,d=this._wheelPositionToHs(l,c,s);this._editingColor=d,this._updateMarkerPosition(t,i,s);const h=this.shadowRoot?.querySelector(".color-picker-modal-preview");if(h){const e=Ue(this._editingColor),t=Ie(Te(e.x,e.y,255));h.style.backgroundColor=t}const p=this.shadowRoot?.querySelectorAll(".rgb-input-field");if(p&&3===p.length){const e=Ue(this._editingColor),t=Te(e.x,e.y,255),i=p[0],s=p[1],o=p[2];i&&(i.value=String(t.r)),s&&(s.value=String(t.g)),o&&(o.value=String(t.b))}}render(){return N`
      <div class="segment-selector">
        ${this.label?N`<span class="label">${this.label}</span>`:""}
        ${this._renderGrid()}
        ${this._renderColorPalette()}
        ${this.description?N`<span class="description">${this.description}</span>`:""}
        ${this._renderColorPickerModal()}
      </div>
    `}};e([pe({type:Object})],zt.prototype,"hass",void 0),e([pe({type:String})],zt.prototype,"mode",void 0),e([pe({type:Number})],zt.prototype,"maxSegments",void 0),e([pe({type:String})],zt.prototype,"value",void 0),e([pe({type:Object})],zt.prototype,"colorValue",void 0),e([pe({type:Array})],zt.prototype,"colorPalette",void 0),e([pe({type:Array})],zt.prototype,"gradientColors",void 0),e([pe({type:Array})],zt.prototype,"blockColors",void 0),e([pe({type:Boolean})],zt.prototype,"expandBlocks",void 0),e([pe({type:Boolean})],zt.prototype,"gradientMirror",void 0),e([pe({type:Number})],zt.prototype,"gradientRepeat",void 0),e([pe({type:Boolean})],zt.prototype,"gradientReverse",void 0),e([pe({type:String})],zt.prototype,"gradientInterpolation",void 0),e([pe({type:Boolean})],zt.prototype,"gradientWave",void 0),e([pe({type:Number})],zt.prototype,"gradientWaveCycles",void 0),e([pe({type:String})],zt.prototype,"label",void 0),e([pe({type:String})],zt.prototype,"description",void 0),e([pe({type:Boolean})],zt.prototype,"disabled",void 0),e([pe({type:Object})],zt.prototype,"translations",void 0),e([pe({type:String})],zt.prototype,"initialPatternMode",void 0),e([_e()],zt.prototype,"_selectedSegments",void 0),e([_e()],zt.prototype,"_coloredSegments",void 0),e([_e()],zt.prototype,"_lastSelectedIndex",void 0),e([_e()],zt.prototype,"_selectedPaletteIndex",void 0),e([_e()],zt.prototype,"_clearMode",void 0),e([_e()],zt.prototype,"_selectMode",void 0),e([_e()],zt.prototype,"_patternMode",void 0),e([_e()],zt.prototype,"_editingColorSource",void 0),e([_e()],zt.prototype,"_editingColorIndex",void 0),e([_e()],zt.prototype,"_editingColor",void 0),zt=e([ce("segment-selector")],zt);const Et="aqara-advanced-lighting-panel";customElements.get(Et)?console.log(`${Et} already registered`):console.log(`Registering ${Et}`),window.customPanel&&window.customPanel(Et)}();
