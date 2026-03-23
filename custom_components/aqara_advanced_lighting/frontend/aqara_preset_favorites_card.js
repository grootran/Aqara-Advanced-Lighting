!function(){"use strict";function t(t,e,i,s){var n,r=arguments.length,o=r<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)o=Reflect.decorate(t,e,i,s);else for(var a=t.length-1;a>=0;a--)(n=t[a])&&(o=(r<3?n(o):r>3?n(e,i,o):n(e,i))||o);return r>3&&o&&Object.defineProperty(e,i,o),o}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,i=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let r=class{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(i&&void 0===t){const i=void 0!==e&&1===e.length;i&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(e,t))}return t}toString(){return this.cssText}};const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,i,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+t[s+1],t[0]);return new r(i,t,s)},a=i?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const i of t.cssRules)e+=i.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:c,defineProperty:h,getOwnPropertyDescriptor:l,getOwnPropertyNames:d,getOwnPropertySymbols:p,getPrototypeOf:u}=Object,_=globalThis,f=_.trustedTypes,g=f?f.emptyScript:"",m=_.reactiveElementPolyfillSupport,v=(t,e)=>t,y={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let i=t;switch(e){case Boolean:i=null!==t;break;case Number:i=null===t?null:Number(t);break;case Object:case Array:try{i=JSON.parse(t)}catch(t){i=null}}return i}},$=(t,e)=>!c(t,e),b={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(t,i,e);void 0!==s&&h(this.prototype,t,s)}}static getPropertyDescriptor(t,e,i){const{get:s,set:n}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const r=s?.call(this);n?.call(this,e),this.requestUpdate(t,r,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...d(t),...p(t)];for(const i of e)this.createProperty(i,t[i])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,i]of e)this.elementProperties.set(t,i)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const i=this._$Eu(t,e);void 0!==i&&this._$Eh.set(i,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const t of i)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const i=e.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const i of e.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(i)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const i of s){const s=document.createElement("style"),n=e.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,i){this._$AK(t,i)}_$ET(t,e){const i=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(e,i.type);this._$Em=t,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(t,e){const i=this.constructor,s=i._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=i.getPropertyOptions(s),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:y;this._$Em=s;const r=n.fromAttribute(e,t.type);this[s]=r??this._$Ej?.get(s)??r,this._$Em=null}}requestUpdate(t,e,i,s=!1,n){if(void 0!==t){const r=this.constructor;if(!1===s&&(n=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??$)(n,e)||i.useDefault&&i.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,e,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:i,reflect:s,wrapped:n},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??e??this[t]),!0!==n||void 0!==r)||(this._$AL.has(t)||(this.hasUpdated||i||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,i]of t){const{wrapped:t}=i,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,i,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[v("elementProperties")]=new Map,x[v("finalized")]=new Map,m?.({ReactiveElement:x}),(_.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,A=t=>t,E=w.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,P="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+C,q=`<${M}>`,k=document,U=()=>k.createComment(""),T=t=>null===t||"object"!=typeof t&&"function"!=typeof t,O=Array.isArray,D="[ \t\n\f\r]",R=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,j=/-->/g,N=/>/g,H=RegExp(`>|${D}(?:([^\\s"'>=/]+)(${D}*=${D}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,I=/"/g,L=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...i)=>({_$litType$:t,strings:e,values:i}))(1),G=Symbol.for("lit-noChange"),F=Symbol.for("lit-nothing"),V=new WeakMap,W=k.createTreeWalker(k,129);function Z(t,e){if(!O(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const J=(t,e)=>{const i=t.length-1,s=[];let n,r=2===e?"<svg>":3===e?"<math>":"",o=R;for(let e=0;e<i;e++){const i=t[e];let a,c,h=-1,l=0;for(;l<i.length&&(o.lastIndex=l,c=o.exec(i),null!==c);)l=o.lastIndex,o===R?"!--"===c[1]?o=j:void 0!==c[1]?o=N:void 0!==c[2]?(L.test(c[2])&&(n=RegExp("</"+c[2],"g")),o=H):void 0!==c[3]&&(o=H):o===H?">"===c[0]?(o=n??R,h=-1):void 0===c[1]?h=-2:(h=o.lastIndex-c[2].length,a=c[1],o=void 0===c[3]?H:'"'===c[3]?I:z):o===I||o===z?o=H:o===j||o===N?o=R:(o=H,n=void 0);const d=o===H&&t[e+1].startsWith("/>")?" ":"";r+=o===R?i+q:h>=0?(s.push(a),i.slice(0,h)+P+i.slice(h)+C+d):i+C+(-2===h?e:d)}return[Z(t,r+(t[i]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class K{constructor({strings:t,_$litType$:e},i){let s;this.parts=[];let n=0,r=0;const o=t.length-1,a=this.parts,[c,h]=J(t,e);if(this.el=K.createElement(c,i),W.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=W.nextNode())&&a.length<o;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(P)){const e=h[r++],i=s.getAttribute(t).split(C),o=/([.?@])?(.*)/.exec(e);a.push({type:1,index:n,name:o[2],strings:i,ctor:"."===o[1]?et:"?"===o[1]?it:"@"===o[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:n}),s.removeAttribute(t));if(L.test(s.tagName)){const t=s.textContent.split(C),e=t.length-1;if(e>0){s.textContent=E?E.emptyScript:"";for(let i=0;i<e;i++)s.append(t[i],U()),W.nextNode(),a.push({type:2,index:++n});s.append(t[e],U())}}}else if(8===s.nodeType)if(s.data===M)a.push({type:2,index:n});else{let t=-1;for(;-1!==(t=s.data.indexOf(C,t+1));)a.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const i=k.createElement("template");return i.innerHTML=t,i}}function Y(t,e,i=t,s){if(e===G)return e;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const r=T(e)?void 0:e._$litDirective$;return n?.constructor!==r&&(n?._$AO?.(!1),void 0===r?n=void 0:(n=new r(t),n._$AT(t,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(e=Y(t,n._$AS(t,e.values),n,s)),e}let Q=class{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:i}=this._$AD,s=(t?.creationScope??k).importNode(e,!0);W.currentNode=s;let n=W.nextNode(),r=0,o=0,a=i[0];for(;void 0!==a;){if(r===a.index){let e;2===a.type?e=new X(n,n.nextSibling,this,t):1===a.type?e=new a.ctor(n,a.name,a.strings,this,t):6===a.type&&(e=new nt(n,this,t)),this._$AV.push(e),a=i[++o]}r!==a?.index&&(n=W.nextNode(),r++)}return W.currentNode=k,s}p(t){let e=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(t,i,e),e+=i.strings.length-2):i._$AI(t[e])),e++}};class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,i,s){this.type=2,this._$AH=F,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Y(this,t,e),T(t)?t===F||null==t||""===t?(this._$AH!==F&&this._$AR(),this._$AH=F):t!==this._$AH&&t!==G&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>O(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==F&&T(this._$AH)?this._$AA.nextSibling.data=t:this.T(k.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:i}=t,s="number"==typeof i?this._$AC(t):(void 0===i.el&&(i.el=K.createElement(Z(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new Q(s,this),i=t.u(this.options);t.p(e),this.T(i),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new K(t)),e}k(t){O(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let i,s=0;for(const n of t)s===e.length?e.push(i=new X(this.O(U()),this.O(U()),this,this.options)):i=e[s],i._$AI(n),s++;s<e.length&&(this._$AR(i&&i._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,i,s,n){this.type=1,this._$AH=F,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=F}_$AI(t,e=this,i,s){const n=this.strings;let r=!1;if(void 0===n)t=Y(this,t,e,0),r=!T(t)||t!==this._$AH&&t!==G,r&&(this._$AH=t);else{const s=t;let o,a;for(t=n[0],o=0;o<n.length-1;o++)a=Y(this,s[i+o],e,o),a===G&&(a=this._$AH[o]),r||=!T(a)||a!==this._$AH[o],a===F?t=F:t!==F&&(t+=(a??"")+n[o+1]),this._$AH[o]=a}r&&!s&&this.j(t)}j(t){t===F?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===F?void 0:t}}class it extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==F)}}class st extends tt{constructor(t,e,i,s,n){super(t,e,i,s,n),this.type=5}_$AI(t,e=this){if((t=Y(this,t,e,0)??F)===G)return;const i=this._$AH,s=t===F&&i!==F||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,n=t!==F&&(i===F||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class nt{constructor(t,e,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Y(this,t)}}const rt=w.litHtmlPolyfillSupport;rt?.(K,X),(w.litHtmlVersions??=[]).push("3.3.2");const ot=globalThis;let at=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,i)=>{const s=i?.renderBefore??e;let n=s._$litPart$;if(void 0===n){const t=i?.renderBefore??null;s._$litPart$=n=new X(e.insertBefore(U(),t),t,void 0,i??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return G}};at._$litElement$=!0,at.finalized=!0,ot.litElementHydrateSupport?.({LitElement:at});const ct=ot.litElementPolyfillSupport;ct?.({LitElement:at}),(ot.litElementVersions??=[]).push("4.2.2");const ht=t=>(e,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},lt={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:$},dt=(t=lt,e,i)=>{const{kind:s,metadata:n}=i;let r=globalThis.litPropertyMetadata.get(n);if(void 0===r&&globalThis.litPropertyMetadata.set(n,r=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),r.set(i.name,t),"accessor"===s){const{name:s}=i;return{set(i){const n=e.get.call(this);e.set.call(this,i),this.requestUpdate(s,n,t,!0,i)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];e.call(this,i),this.requestUpdate(s,n,t,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pt(t){return(e,i)=>"object"==typeof i?dt(t,e,i):((t,e,i)=>{const s=e.hasOwnProperty(i);return e.constructor.createProperty(i,t),s?Object.getOwnPropertyDescriptor(e,i):void 0})(t,e,i)}function ut(t){return pt({...t,state:!0,attribute:!1})}const _t=2;class ft{constructor(t){}get _$AU(){return this._$AM._$AU}_$AT(t,e,i){this._$Ct=t,this._$AM=e,this._$Ci=i}_$AS(t,e){return this.update(t,e)}update(t,e){return this.render(...e)}}class gt extends ft{constructor(t){if(super(t),this.it=F,t.type!==_t)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(t){if(t===F||null==t)return this._t=void 0,this.it=t;if(t===G)return t;if("string"!=typeof t)throw Error(this.constructor.directiveName+"() called with a non-string value");if(t===this.it)return this._t;this.it=t;const e=[t];return e.raw=e,this._t={_$litType$:this.constructor.resultType,strings:e,values:[]}}}gt.directiveName="unsafeHTML",gt.resultType=1;const mt=(t=>(...e)=>({_$litDirective$:t,values:e}))(gt);function vt(t,e,i=255){if(0===e)return{r:0,g:0,b:0};const s=1/e*t,n=1/e*(1-t-e);let r=3.2406*s-1.5372+-.4986*n,o=-.9689*s+1.8758+.0415*n,a=.0557*s-.204+1.057*n;const c=Math.max(r,o,a);c>1&&(r/=c,o/=c,a/=c),r=Math.max(0,r),o=Math.max(0,o),a=Math.max(0,a),r=r<=.0031308?12.92*r:1.055*Math.pow(r,1/2.4)-.055,o=o<=.0031308?12.92*o:1.055*Math.pow(o,1/2.4)-.055,a=a<=.0031308?12.92*a:1.055*Math.pow(a,1/2.4)-.055;const h=i/255;return{r:Math.max(0,Math.min(255,Math.round(255*r*h))),g:Math.max(0,Math.min(255,Math.round(255*o*h))),b:Math.max(0,Math.min(255,Math.round(255*a*h)))}}function yt(t){const e=t=>t.toString(16).padStart(2,"0");return`#${e(t.r)}${e(t.g)}${e(t.b)}`}function $t(t,e=255){return yt(vt(t.x,t.y,e))}const bt=200,xt=200,wt=180,At=180,Et=80;function St(t,e){const i=(t-90)*Math.PI/180;return[Math.round(100*(bt+e*Math.cos(i)))/100,Math.round(100*(xt+e*Math.sin(i)))/100]}function Pt(t,e,i){if(e-t>=360)return`<circle cx="200" cy="200" r="180" fill="${i}" />`;const[s,n]=St(t,wt),[r,o]=St(e,wt);return`<path fill="${i}" stroke="${i}" stroke-width="1" d="M200,200 L${s},${n} A180,180 0 ${e-t>180?1:0},1 ${r},${o} Z" />`}function Ct(t){const e=Math.round(t.brightness_pct/100*255);return yt(vt(t.x,t.y,e))}const Mt=new Map;function qt(t){if(t.length<=8)return t;const e=[];for(let i=0;i<8;i++){const s=Math.round(i/8*t.length)%t.length;e.push({hex:t[s].hex,startDeg:45*i,endDeg:45*(i+1)})}return e}function kt(t){const e=t/100;let i,s,n;e<=66?i=255:(i=329.698727446*Math.pow(e-60,-.1332047592),i=Math.max(0,Math.min(255,i))),s=e<=66?99.4708025861*Math.log(e)-161.1195681661:288.1221695283*Math.pow(e-60,-.0755148492),s=Math.max(0,Math.min(255,s)),e>=66?n=255:e<=19?n=0:(n=138.5177312231*Math.log(e-10)-305.0447927307,n=Math.max(0,Math.min(255,n)));const r=t=>Math.round(t).toString(16).padStart(2,"0");return`#${r(i)}${r(s)}${r(n)}`}function Ut(t){return`<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">${t}</svg>`}function Tt(t){return`<svg class="gradient-thumb" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">${t}</svg>`}function Ot(t){if(!t.segments||0===t.segments.length)return null;const e=function(t){if(0===t.length)return[];const e="seg:"+t.map(t=>`${t.segment}:${t.color.r},${t.color.g},${t.color.b}`).join("|"),i=Mt.get(e);if(i)return i;const s=[...t].sort((t,e)=>("number"==typeof t.segment?t.segment:parseInt(t.segment,10))-("number"==typeof e.segment?e.segment:parseInt(e.segment,10))),n=360/s.length,r=[];let o=yt(s[0].color),a=0;for(let t=1;t<s.length;t++){const e=yt(s[t].color);e!==o&&(r.push({hex:o,startDeg:a,endDeg:t*n}),o=e,a=t*n)}r.push({hex:o,startDeg:a,endDeg:360});const c=qt(r);if(Mt.size>=64){const t=Mt.keys().next().value;void 0!==t&&Mt.delete(t)}return Mt.set(e,c),c}(t.segments),i=e.map(t=>Pt(t.startDeg,t.endDeg,t.hex)).join("");return B`${mt(Ut(i))}`}function Dt(t){if(!t.steps||0===t.steps.length)return null;const e=t.steps[0];let i=[];if(e.segment_colors&&e.segment_colors.length>0?i=e.segment_colors.map(t=>yt(t.color)):e.colors&&e.colors.length>0&&(i=e.colors.map(t=>yt({r:t[0]??0,g:t[1]??0,b:t[2]??0}))),0===i.length)return null;const s=function(t){if(0===t.length)return[];const e="hex:"+t.join("|"),i=Mt.get(e);if(i)return i;const s=360/t.length,n=[];let r=t[0],o=0;for(let e=1;e<t.length;e++)t[e]!==r&&(n.push({hex:r,startDeg:o,endDeg:e*s}),r=t[e],o=e*s);n.push({hex:r,startDeg:o,endDeg:360});const a=qt(n);if(Mt.size>=64){const t=Mt.keys().next().value;void 0!==t&&Mt.delete(t)}return Mt.set(e,a),a}(i);if(1===s.length){const t=[`<circle cx="200" cy="200" r="180" fill="${s[0].hex}" />`,'<circle cx="200" cy="200" r="80" fill="var(--card-background-color, #fff)" />'].join("");return B`${mt(Ut(t))}`}const n=s.map(t=>function(t,e,i){if(e-t>=360)return[`<circle cx="200" cy="200" r="180" fill="${i}" />`,'<circle cx="200" cy="200" r="80" fill="var(--card-background-color, #fff)" />'].join("");const[s,n]=St(t,At),[r,o]=St(e,At),[a,c]=St(e,Et),[h,l]=St(t,Et),d=e-t>180?1:0;return`<path fill="${i}" stroke="${i}" stroke-width="1" d="M${s},${n} A180,180 0 ${d},1 ${r},${o} L${a},${c} A80,80 0 ${d},0 ${h},${l} Z" />`}(t.startDeg,t.endDeg,t.hex)).join("");return B`${mt(Ut(n))}`}function Rt(t){const e=t.match(/^(\d{1,2}):(\d{2})$/);if(e)return 60*parseInt(e[1],10)+parseInt(e[2],10);const i=t.match(/^(sunrise|sunset)([+-]\d+)?$/);if(i){return("sunrise"===i[1]?360:1080)+(i[2]?parseInt(i[2],10):0)}return 0}function jt(t){if("solar"===t.mode)return function(t){const e=t.solar_steps??[];if(0===e.length)return null;const i=function(t){const e=t.filter(t=>"rising"===t.phase).sort((t,e)=>t.sun_elevation-e.sun_elevation),i=t.filter(t=>"any"===t.phase).sort((t,e)=>t.sun_elevation-e.sun_elevation),s=t.filter(t=>"setting"===t.phase).sort((t,e)=>e.sun_elevation-t.sun_elevation);return[...e,...i,...s]}(e),s=i.map(t=>t.color_temp);if(1===s.length){const t=kt(s[0]);return B`${mt(Tt(`<path fill="${t}" d="M 20,290 A 180,180 0 0,1 380,290 L 280,290 A 80,80 0 0,0 120,290 Z" /><line x1="15" y1="290" x2="385" y2="290" stroke="var(--secondary-text-color, #888)" stroke-width="2" stroke-opacity="0.4" />`))}`}const n=`solar-${t.id}`,r=s.map((t,e)=>`<stop offset="${Math.round(e/(s.length-1)*100)}%" stop-color="${kt(t)}" />`).join("");return B`${mt(Tt(`<defs><linearGradient id="${n}" x1="0" y1="0" x2="1" y2="0">${r}</linearGradient></defs><path fill="url(#${n})" d="M 20,290 A 180,180 0 0,1 380,290 L 280,290 A 80,80 0 0,0 120,290 Z" /><line x1="15" y1="290" x2="385" y2="290" stroke="var(--secondary-text-color, #888)" stroke-width="2" stroke-opacity="0.4" />`))}`}(t);if("schedule"===t.mode)return function(t){const e=t.schedule_steps??[];if(0===e.length)return null;const i=[...e].sort((t,e)=>Rt(t.time)-Rt(e.time)),s=i.map(t=>t.color_temp);if(1===s.length){const t=kt(s[0]);return B`${mt(Tt(`<rect fill="${t}" x="10" y="10" width="380" height="380" rx="8" />`))}`}const n=i.map(t=>Rt(t.time)),r=n[0],o=n[n.length-1]-r,a=`sched-${t.id}`,c=s.map((t,e)=>`<stop offset="${o>0?Math.round((n[e]-r)/o*100):Math.round(e/(s.length-1)*100)}%" stop-color="${kt(t)}" />`).join("");return B`${mt(Tt(`<defs><linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1">${c}</linearGradient></defs><rect fill="url(#${a})" x="10" y="10" width="380" height="380" rx="8" />`))}`}(t);const e=(t.steps??[]).map(t=>t.color_temp).filter(t=>null!=t);if(0===e.length)return null;if(1===e.length){const t=kt(e[0]);return B`${mt(Tt(`<rect fill="${t}" x="10" y="10" width="380" height="380" rx="8" />`))}`}const i=`cct-${t.id}`,s=e.map((t,i)=>`<stop offset="${Math.round(i/(e.length-1)*100)}%" stop-color="${kt(t)}" />`).join("");return B`${mt(Tt(`<defs><linearGradient id="${i}" x1="0" y1="0" x2="1" y2="0">${s}</linearGradient></defs><rect fill="url(#${i})" x="10" y="10" width="380" height="380" rx="8" />`))}`}function Nt(t){const e=vt(t.x,t.y,255),i=function(t,e,i){const s=t/255,n=e/255,r=i/255,o=Math.max(s,n,r),a=o-Math.min(s,n,r);let c=0,h=0;return 0!==o&&(h=a/o*100),0!==a&&(c=o===s?(n-r)/a%6:o===n?(r-s)/a+2:(s-n)/a+4,c=Math.round(60*c),c<0&&(c+=360)),{h:c,s:Math.round(h)}}(e.r,e.g,e.b);return 0===i.s?360:i.h}function Ht(t){if(!Array.isArray(t)&&t.thumbnail){const e=t.thumbnail;return B`<img
      src="/api/aqara_advanced_lighting/thumbnails/${e}"
      alt="Preset thumbnail"
      style="width:100%;height:100%;object-fit:cover;border-radius:4px"
    />`}let e,i;if(Array.isArray(t)?(e=t.slice(0,8),i=`ds-${e.map(t=>`${t.x}${t.y}`).join("")}`):(e=(t.colors??[]).slice(0,8),i=`ds-${t.id}`),0===e.length)return null;if(1===e.length){const t=Ct(e[0]);return B`${mt(Tt(`<rect fill="${t}" x="10" y="10" width="380" height="380" rx="8" />`))}`}const s=[...e].sort((t,e)=>Nt(t)-Nt(e)),n=s.map((t,e)=>`<stop offset="${Math.round(e/(s.length-1)*100)}%" stop-color="${Ct(t)}" />`).join("");return B`${mt(Tt(`<defs><linearGradient id="${i}" x1="0" y1="0" x2="1" y2="1">${n}</linearGradient></defs><rect fill="url(#${i})" x="10" y="10" width="380" height="380" rx="8" />`))}`}const zt={card:{name:"Aqara Advanced Lighting Presets",description:"Displays and activates your favorited Aqara Advanced Lighting presets for a specific entity.",default_title:"Favorite Presets",error_loading:"Failed to load preset data",empty_no_favorites:"No compatible favorites for this device",editor:{entities_label:"Entities",title_label:"Title",columns_label:"Columns (0 = auto)",compact_label:"Compact mode",show_names_label:"Show preset names",highlight_user_label:"Highlight user presets"}}};var It;const Lt=36e5,Bt=12e4,Gt=new Map;function Ft(t,e){const i=Gt.get(t);if(i&&Date.now()-i.timestamp<e)return i.data}function Vt(t,e){Gt.set(t,{data:e,timestamp:Date.now()})}let Wt=class extends at{constructor(){super(...arguments),this._t=zt.card}setConfig(t){this._config={...t}}render(){return this.hass&&this._config?B`
      <div class="editor">
        <ha-selector
          .hass=${this.hass}
          .label=${this._t.editor.entities_label}
          .selector=${{entity:{domain:"light",multiple:!0}}}
          .value=${this._config.entities||(this._config.entity?[this._config.entity]:[])}
          .required=${!0}
          @value-changed=${t=>{const e=t.detail.value;this._updateConfig("entities",e?.length?e:void 0),this._config.entity&&this._updateConfig("entity",void 0)}}
        ></ha-selector>
        <ha-textfield
          .label=${this._t.editor.title_label}
          .value=${this._config.title||""}
          @input=${t=>this._updateConfig("title",t.target.value)}
        ></ha-textfield>
        <ha-textfield
          .label=${this._t.editor.columns_label}
          type="number"
          min="0"
          max="6"
          .value=${String(this._config.columns||0)}
          @input=${t=>{const e=parseInt(t.target.value,10);this._updateConfig("columns",isNaN(e)||e<=0?void 0:e)}}
        ></ha-textfield>
        <ha-formfield .label=${this._t.editor.compact_label}>
          <ha-switch
            .checked=${this._config.compact||!1}
            @change=${t=>this._updateConfig("compact",t.target.checked||void 0)}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${this._t.editor.show_names_label}>
          <ha-switch
            .checked=${!1!==this._config.show_names}
            @change=${t=>this._updateConfig("show_names",!!t.target.checked&&void 0)}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${this._t.editor.highlight_user_label}>
          <ha-switch
            .checked=${!1!==this._config.highlight_user_presets}
            @change=${t=>this._updateConfig("highlight_user_presets",!!t.target.checked&&void 0)}
          ></ha-switch>
        </ha-formfield>
      </div>
    `:B``}_updateConfig(t,e){if(!this._config)return;const i={...this._config,[t]:e};(void 0===e||""===e&&"title"!==t)&&delete i[t],this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i}}))}};Wt.styles=o`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }
  `,t([pt({attribute:!1})],Wt.prototype,"hass",void 0),t([ut()],Wt.prototype,"_config",void 0),Wt=t([ht("aqara-preset-favorites-card-editor")],Wt);let Zt=It=class extends at{constructor(){super(...arguments),this._t=zt.card,this._favoriteRefs=[],this._supportedEntities=new Map,this._loading=!0,this._activePresets=new Map,this._dataLoaded=!1,this._hassConnected=!1}setConfig(t){if(!(t.entity||t.entities&&0!==t.entities.length))throw new Error("At least one entity is required");this._config=t}_getEntityIds(){return this._config?.entities?.length?this._config.entities:this._config?.entity?[this._config.entity]:[]}getCardSize(){return 3}static getConfigElement(){return document.createElement("aqara-preset-favorites-card-editor")}static getStubConfig(){return{entity:"",title:zt.card.default_title}}updated(t){if(super.updated(t),t.has("hass")&&this.hass){const t=this._hassConnected;this._hassConnected=!0,this._dataLoaded&&t||(this._loadData(),this._startPolling())}t.has("hass")&&!this.hass&&(this._hassConnected=!1,this._stopPolling())}disconnectedCallback(){super.disconnectedCallback(),this._stopPolling()}_startPolling(){this._stopPolling(),this._pollRunningOperations(),this._pollTimer=setInterval(()=>this._pollRunningOperations(),5e3)}_stopPolling(){this._pollTimer&&(clearInterval(this._pollTimer),this._pollTimer=void 0)}async _pollRunningOperations(){if(this.hass)try{const t=await this.hass.callApi("GET","aqara_advanced_lighting/running_operations"),e=new Set(this._getEntityIds()),i=new Map;for(const s of t.operations||[])s.preset_id&&e.has(s.entity_id)&&i.set(s.preset_id,s.type);this._activePresets=i}catch{}}async _loadData(){if(this.hass){this._loading=!0,this._error=void 0;try{const t=Ft("presets",Lt),e=Ft("user_presets",Bt),i=Ft("user_preferences",Bt),s=Ft("supported_entities",Lt),n={presets:t??this._fetchPresetsData(),userPresets:e??this.hass.callApi("GET","aqara_advanced_lighting/user_presets"),prefs:i??this.hass.callApi("GET","aqara_advanced_lighting/user_preferences"),entities:s??this.hass.callApi("GET","aqara_advanced_lighting/supported_entities")},[r,o,a,c]=await Promise.all([n.presets,n.userPresets,n.prefs,n.entities]);t||Vt("presets",r),e||Vt("user_presets",o),i||Vt("user_preferences",a),s||Vt("supported_entities",c),this._presets=r,this._userPresets=o,this._favoriteRefs=a.favorite_presets||[];const h=new Map;for(const t of c.entities||[])h.set(t.entity_id,{device_type:t.device_type,model_id:t.model_id});this._supportedEntities=h,this._dataLoaded=!0}catch(t){this._error=this._t.error_loading,console.error("AqaraFavoritesCard: data load failed",t)}finally{this._loading=!1}}}async _fetchPresetsData(){const t=await this.hass.fetchWithAuth("/api/aqara_advanced_lighting/presets");if(!t.ok)throw new Error(`Presets fetch failed: ${t.status}`);return t.json()}_getSelectedDeviceTypes(){const t=this._getEntityIds(),e=[];for(const i of t){const t=this._supportedEntities.get(i)?.device_type;t&&!e.includes(t)&&e.push(t)}return e}_isPresetCompatible(t,e,i){if(0===e.length)return"cct_sequence"===t.type||"dynamic_scene"===t.type;const s=e.includes("t2_bulb"),n=e.includes("t1m"),r=e.includes("t1_strip"),o=e.includes("generic_rgb"),a=e.includes("t2_cct"),c=e.includes("t1m_white"),h=e.includes("generic_cct"),l=s||n||r||o,d=n||r,p=s||a||c||r||o||h,u=t=>{if(!t)return!0;switch(t){case"t2_bulb":return s;case"t1m":case"t1":return n;case"t1_strip":return r;default:return!0}};switch(t.type){case"effect":return l&&u(i);case"segment_pattern":case"segment_sequence":return d&&u(i);case"cct_sequence":return p;case"dynamic_scene":return l;default:return!1}}_resolvedFavorites(){if(!this._presets||!this._userPresets)return[];const t=this._getSelectedDeviceTypes(),e=[];for(const i of this._favoriteRefs){let s,n=null,r=!1;switch(i.type){case"effect":for(const t of["t2_bulb","t1m","t1_strip"]){const e=this._presets.dynamic_effects?.[t]?.find(t=>t.id===i.id);if(e){n=e,s=t;break}}if(!n){const t=this._userPresets.effect_presets?.find(t=>t.id===i.id);t&&(n=t,r=!0,s=t.device_type)}break;case"segment_pattern":if(n=this._presets.segment_patterns?.find(t=>t.id===i.id)||null,!n){const t=this._userPresets.segment_pattern_presets?.find(t=>t.id===i.id);t&&(n=t,r=!0,s=t.device_type)}break;case"cct_sequence":n=this._presets.cct_sequences?.find(t=>t.id===i.id)||null,n||(n=this._userPresets.cct_sequence_presets?.find(t=>t.id===i.id)||null,n&&(r=!0));break;case"segment_sequence":if(n=this._presets.segment_sequences?.find(t=>t.id===i.id)||null,!n){const t=this._userPresets.segment_sequence_presets?.find(t=>t.id===i.id);t&&(n=t,r=!0,s=t.device_type)}break;case"dynamic_scene":n=this._presets.dynamic_scenes?.find(t=>t.id===i.id)||null,n||(n=this._userPresets.dynamic_scene_presets?.find(t=>t.id===i.id)||null,n&&(r=!0))}n&&this._isPresetCompatible(i,t,s)&&e.push({ref:i,preset:n,isUser:r,deviceType:s})}return e}async _activatePreset(t,e,i){const s=this._getEntityIds();if(0===s.length)return;const n=this._activePresets.get(t.id);if(n)await this._stopPreset(t.id,n);else{this._activating=t.id;try{switch(t.type){case"effect":i?await this._activateUserEffect(s,e):await this._activateBuiltinEffect(s,e);break;case"segment_pattern":i?await this._activateUserPattern(s,e):await this._activateBuiltinPattern(s,e);break;case"cct_sequence":i?await this._activateUserCCTSequence(s,e):await this._activateBuiltinCCTSequence(s,e);break;case"segment_sequence":i?await this._activateUserSegmentSequence(s,e):await this._activateBuiltinSegmentSequence(s,e);break;case"dynamic_scene":i?await this._activateUserDynamicScene(s,e):await this._activateBuiltinDynamicScene(s,e)}}catch(t){console.error("AqaraFavoritesCard: activation failed",t)}finally{this._activating=void 0,this._pollRunningOperations()}}}async _activateBuiltinEffect(t,e){await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",{entity_id:t,preset:e.id,turn_on:!0,sync:!0})}async _activateBuiltinPattern(t,e){await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",{entity_id:t,preset:e.id,turn_on:!0,sync:!0})}async _activateBuiltinCCTSequence(t,e){const i="solar"===e.mode||"schedule"===e.mode;await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",{entity_id:t,preset:e.id,...!i&&{turn_on:!0},sync:!0})}async _activateBuiltinSegmentSequence(t,e){await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",{entity_id:t,preset:e.id,turn_on:!0,sync:!0})}async _activateBuiltinDynamicScene(t,e){const i={entity_id:t,scene_name:e.name,transition_time:e.transition_time,hold_time:e.hold_time,distribution_mode:e.distribution_mode,random_order:e.random_order,loop_mode:e.loop_mode,end_behavior:e.end_behavior,colors:e.colors.map(t=>({x:t.x,y:t.y,brightness_pct:t.brightness_pct}))};void 0!==e.offset_delay&&e.offset_delay>0&&(i.offset_delay=e.offset_delay),"count"===e.loop_mode&&void 0!==e.loop_count&&(i.loop_count=e.loop_count),await this.hass.callService("aqara_advanced_lighting","start_dynamic_scene",i)}async _activateUserEffect(t,e){const i={entity_id:t,effect:e.effect,speed:e.effect_speed,preset:e.name,turn_on:!0,sync:!0};e.effect_colors.forEach((t,e)=>{e<8&&(i[`color_${e+1}`]={x:t.x,y:t.y})}),void 0!==e.effect_brightness&&(i.brightness=e.effect_brightness),e.effect_segments&&(i.segments=e.effect_segments),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",i)}async _activateUserPattern(t,e){if(!e.segments?.length)return;const i=e.segments.filter(t=>t?.color).map(t=>({segment:t.segment,color:{r:t.color.r,g:t.color.g,b:t.color.b}}));0!==i.length&&await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",{entity_id:t,segment_colors:i,preset:e.name,turn_on:!0,sync:!0,turn_off_unspecified:!0})}async _activateUserCCTSequence(t,e){if("solar"===e.mode||"schedule"===e.mode)return void await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",{entity_id:t,preset:e.name,sync:!0});const i={entity_id:t,preset:e.name,loop_mode:e.loop_mode,end_behavior:e.end_behavior,turn_on:!0,sync:!0};"count"===e.loop_mode&&void 0!==e.loop_count&&(i.loop_count=e.loop_count),e.steps.forEach((t,e)=>{const s=e+1;s<=20&&(i[`step_${s}_color_temp`]=t.color_temp,i[`step_${s}_brightness`]=t.brightness,i[`step_${s}_transition`]=t.transition,i[`step_${s}_hold`]=t.hold)}),await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",i)}async _activateUserSegmentSequence(t,e){const i={entity_id:t,preset:e.name,loop_mode:e.loop_mode,end_behavior:e.end_behavior,turn_on:!0,sync:!0};"count"===e.loop_mode&&void 0!==e.loop_count&&(i.loop_count=e.loop_count),e.steps.forEach((t,e)=>{const s=e+1;s<=20&&(i[`step_${s}_segments`]=t.segments,i[`step_${s}_mode`]=t.mode,i[`step_${s}_duration`]=t.duration,i[`step_${s}_hold`]=t.hold,i[`step_${s}_activation_pattern`]=t.activation_pattern,t.colors?.length&&t.colors.forEach((t,e)=>{e<6&&(i[`step_${s}_color_${e+1}`]=t)}))}),await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",i)}async _activateUserDynamicScene(t,e){const i={entity_id:t,scene_name:e.name,transition_time:e.transition_time,hold_time:e.hold_time,distribution_mode:e.distribution_mode,random_order:e.random_order,loop_mode:e.loop_mode,end_behavior:e.end_behavior,colors:e.colors.map(t=>({x:t.x,y:t.y,brightness_pct:t.brightness_pct}))};void 0!==e.offset_delay&&e.offset_delay>0&&(i.offset_delay=e.offset_delay),"count"===e.loop_mode&&void 0!==e.loop_count&&(i.loop_count=e.loop_count),e.audio_entity&&(i.audio_entity=e.audio_entity,i.audio_sensitivity=e.audio_sensitivity,i.audio_brightness_response=e.audio_brightness_response,i.audio_color_advance=e.audio_color_advance,i.audio_transition_speed=e.audio_transition_speed,i.audio_detection_mode=e.audio_detection_mode,i.audio_frequency_zone=e.audio_frequency_zone,i.audio_silence_degradation=e.audio_silence_degradation,i.audio_prediction_aggressiveness=e.audio_prediction_aggressiveness,i.audio_latency_compensation_ms=e.audio_latency_compensation_ms),await this.hass.callService("aqara_advanced_lighting","start_dynamic_scene",i)}async _stopPreset(t,e){const i=this._getEntityIds();if(0===i.length)return;const s=It._STOP_SERVICES[e];if(s){this._activating=t;try{const t={entity_id:i};"segment_sequence"!==e&&(t.restore_state=!0),await this.hass.callService("aqara_advanced_lighting",s,t)}catch(t){console.error("AqaraFavoritesCard: stop failed",t)}finally{this._activating=void 0,this._activePresets.delete(t),this._pollRunningOperations()}}}_renderPresetIcon(t,e,i){const s=(t,e)=>t?t.includes(".")?B`<img src="/api/aqara_advanced_lighting/icons/${t}" alt="preset icon" />`:B`<ha-icon icon="${t}"></ha-icon>`:B`<ha-icon icon="${e}"></ha-icon>`,n=(t,e,i)=>t?s(t,e):i()??B`<ha-icon icon="${e}"></ha-icon>`;switch(t.type){case"effect":return i?n(e.icon,"mdi:lightbulb-on",()=>function(t){const e=(t.effect_colors??[]).slice(0,8);if(0===e.length)return null;if(1===e.length){const t=$t(e[0]);return B`${mt(Ut(`<circle cx="200" cy="200" r="180" fill="${t}" />`))}`}const i=360/e.length,s=e.map((t,e)=>Pt(e*i,(e+1)*i,$t(t))).join("");return B`${mt(Ut(s))}`}(e)):s(e.icon,"mdi:lightbulb-on");case"segment_pattern":return i?n(e.icon,"mdi:palette",()=>Ot(e)):s(e.icon,"mdi:palette");case"cct_sequence":return i?n(e.icon,"mdi:temperature-kelvin",()=>jt(e)):s(e.icon,"mdi:temperature-kelvin");case"segment_sequence":return i?n(e.icon,"mdi:animation-play",()=>Dt(e)):s(e.icon,"mdi:animation-play");case"dynamic_scene":if(i){const t=e,i=n(t.icon,"mdi:lamps",()=>Ht(t));return t.audio_entity?B`${i}<span class="audio-badge"><ha-icon icon="mdi:waveform"></ha-icon></span>`:i}return Ht(e)??B`<ha-icon icon="mdi:lamps"></ha-icon>`;default:return B`<ha-icon icon="mdi:star"></ha-icon>`}}render(){if(!this._config)return B``;const t=void 0===this._config.title?this._t.default_title:this._config.title||void 0;if(this._loading)return B`
        <ha-card .header=${t}>
          <div class="card-content loading">
            <ha-circular-progress indeterminate></ha-circular-progress>
          </div>
        </ha-card>
      `;if(this._error)return B`
        <ha-card .header=${t}>
          <div class="card-content">
            <ha-alert alert-type="error">${this._error}</ha-alert>
          </div>
        </ha-card>
      `;const e=this._resolvedFavorites();if(0===e.length)return B`
        <ha-card .header=${t}>
          <div class="card-content empty">
            <ha-icon icon="mdi:star-off-outline"></ha-icon>
            <p>${this._t.empty_no_favorites}</p>
          </div>
        </ha-card>
      `;const i=this._config.columns?`grid-template-columns: repeat(${this._config.columns}, 1fr)`:"",s=this._config.compact||!1,n=!1!==this._config.show_names,r=!1!==this._config.highlight_user_presets;return B`
      <ha-card .header=${t}>
        <div class="preset-grid ${s?"compact":""} ${n?"":"no-names"} ${t?"":"no-title"}" style=${i||F}>
          ${e.map(({ref:t,preset:e,isUser:i})=>{const s=this._activating===t.id,o=this._activePresets.has(t.id);return B`
              <div
                class="preset-button ${i&&r?"user-preset":"builtin-preset"} ${s?"activating":""} ${o?"active":""}"
                role="button"
                tabindex="0"
                aria-label="${e.name}"
                @click=${()=>this._activatePreset(t,e,i)}
                @keydown=${s=>{"Enter"===s.key&&this._activatePreset(t,e,i)}}
              >
                <div class="preset-icon">
                  ${this._renderPresetIcon(t,e,i)}
                </div>
                ${n?B`<div class="preset-name">${e.name}</div>`:F}
                ${s?B`<div class="activating-overlay"><ha-circular-progress indeterminate size="small"></ha-circular-progress></div>`:F}
              </div>
            `})}
        </div>
      </ha-card>
    `}};Zt._STOP_SERVICES={effect:"stop_effect",cct_sequence:"stop_cct_sequence",segment_sequence:"stop_segment_sequence",dynamic_scene:"stop_dynamic_scene"},Zt.styles=o`
    :host {
      display: block;
    }

    /* Fix ha-svg-icon vertical misalignment inside ha-icon-button */
    ha-icon-button > ha-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-content {
      padding: 16px;
    }

    .card-content.loading {
      display: flex;
      justify-content: center;
      padding: 32px 16px;
    }

    .card-content.empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 16px;
      color: var(--secondary-text-color);
    }

    .card-content.empty ha-icon {
      --mdc-icon-size: 32px;
      opacity: 0.5;
    }

    .card-content.empty p {
      margin: 0;
      font-size: var(--ha-font-size-s, 13px);
    }

    /* Preset grid */
    .preset-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 12px;
      padding: 0 16px 16px;
    }

    .preset-grid.no-title {
      padding-top: 16px;
    }

    /* Preset buttons — copied from styles.ts:820-910 */
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
      transition: all 0.2s ease-in-out;
      position: relative;
      min-height: 80px;
      overflow: hidden;
      user-select: none;
      -webkit-tap-highlight-color: transparent;
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

    .preset-button.user-preset {
      border-color: var(--primary-color);
      border-style: dashed;
      border-width: 2px;
    }

    .preset-button.user-preset:hover {
      border-style: solid;
    }

    .preset-button.active {
      border-color: var(--primary-color);
      background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.15);
      box-shadow: 0 0 8px rgba(var(--rgb-primary-color, 3, 169, 244), 0.3);
    }

    .preset-button.active::before {
      opacity: 0.1;
    }

    .preset-button.active.user-preset {
      border-style: solid;
    }

    .preset-button.activating {
      opacity: 0.6;
      pointer-events: none;
    }

    .activating-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(var(--rgb-card-background-color, 255, 255, 255), 0.6);
      border-radius: inherit;
    }

    .preset-name {
      font-size: var(--ha-font-size-s, 13px);
      font-weight: var(--ha-font-weight-medium, 500);
      text-align: center;
      margin-top: 8px;
      position: relative;
      word-break: break-word;
    }

    .preset-icon {
      width: 48px;
      height: 48px;
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

    .preset-icon svg.gradient-thumb {
      border-radius: 4px;
    }

    .preset-icon ha-icon {
      width: 100%;
      height: 100%;
      --mdc-icon-size: 48px;
    }

    /* Audio-reactive badge overlay */
    .preset-icon .audio-badge {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preset-icon .audio-badge ha-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      --mdc-icon-size: 20px;
    }

    /* No names — larger icons fill the space */
    .no-names .preset-icon {
      width: 56px;
      height: 56px;
    }

    .no-names .preset-icon ha-icon {
      --mdc-icon-size: 56px;
    }

    .no-names .preset-button {
      min-height: 68px;
    }

    /* No names + compact combined */
    .compact.no-names .preset-icon {
      width: 40px;
      height: 40px;
    }

    .compact.no-names .preset-icon ha-icon {
      --mdc-icon-size: 40px;
    }

    .compact.no-names .preset-button {
      min-height: 48px;
    }

    /* Compact mode — tighter layout for narrow cards */
    .preset-grid.compact {
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px;
      padding: 0 8px 8px;
    }

    .preset-grid.compact.no-title {
      padding-top: 8px;
    }

    .compact .preset-button {
      padding: 8px 4px;
      min-height: 56px;
    }

    .compact .preset-icon {
      width: 32px;
      height: 32px;
    }

    .compact .preset-icon ha-icon {
      --mdc-icon-size: 32px;
    }

    .compact .preset-name {
      font-size: var(--ha-font-size-xs, 11px);
      margin-top: 4px;
    }

    /* Mobile responsive */
    @media (max-width: 600px) {
      .preset-grid {
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 8px;
        padding: 0 8px 8px;
      }

      .preset-button {
        padding: 8px;
        min-height: 60px;
      }

      .preset-name {
        font-size: var(--ha-font-size-xs, 11px);
      }
    }
  `,t([pt({attribute:!1})],Zt.prototype,"hass",void 0),t([ut()],Zt.prototype,"_config",void 0),t([ut()],Zt.prototype,"_presets",void 0),t([ut()],Zt.prototype,"_userPresets",void 0),t([ut()],Zt.prototype,"_favoriteRefs",void 0),t([ut()],Zt.prototype,"_supportedEntities",void 0),t([ut()],Zt.prototype,"_loading",void 0),t([ut()],Zt.prototype,"_error",void 0),t([ut()],Zt.prototype,"_activating",void 0),t([ut()],Zt.prototype,"_activePresets",void 0),Zt=It=t([ht("aqara-preset-favorites-card")],Zt),window.customCards=window.customCards||[],window.customCards.push({type:"aqara-preset-favorites-card",name:zt.card.name,description:zt.card.description,preview:!1})}();
