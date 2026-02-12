!function(){"use strict";function e(e,t,i,s){var o,n=arguments.length,r=n<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(o=e[a])&&(r=(n<3?o(r):n>3?o(t,i,r):o(t,i))||r);return n>3&&r&&Object.defineProperty(t,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let n=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=o.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(t,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[s+1],e[0]);return new n(i,e,s)},a=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new n("string"==typeof e?e:e+"",void 0,s))(t)})(e):e,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:_}=Object,g=globalThis,u=g.trustedTypes,m=u?u.emptyScript:"",v=g.reactiveElementPolyfillSupport,f=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?m:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},y=(e,t)=>!l(e,t),x={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(e,i,t);void 0!==s&&c(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){const{get:s,set:o}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:s,set(t){const n=s?.call(this);o?.call(this,t),this.requestUpdate(e,n,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=_(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...h(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(a(e))}else void 0!==e&&t.push(a(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,s)=>{if(i)e.adoptedStyleSheets=s.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of s){const s=document.createElement("style"),o=t.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=i.cssText,e.appendChild(s)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(t,i.type);this._$Em=e,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(e,t){const i=this.constructor,s=i._$Eh.get(e);if(void 0!==s&&this._$Em!==s){const e=i.getPropertyOptions(s),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:b;this._$Em=s;const n=o.fromAttribute(t,e.type);this[s]=n??this._$Ej?.get(s)??n,this._$Em=null}}requestUpdate(e,t,i,s=!1,o){if(void 0!==e){const n=this.constructor;if(!1===s&&(o=this[e]),i??=n.getPropertyOptions(e),!((i.hasChanged??y)(o,t)||i.useDefault&&i.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(n._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:s,wrapped:o},n){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,n??t??this[e]),!0!==o||void 0!==n)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===s&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,s=this[t];!0!==e||this._$AL.has(t)||void 0===s||this.C(t,void 0,i,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,v?.({ReactiveElement:$}),(g.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,C=e=>e,S=w.trustedTypes,z=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,k="$lit$",P=`lit$${Math.random().toFixed(9).slice(2)}$`,E="?"+P,T=`<${E}>`,M=document,D=()=>M.createComment(""),A=e=>null===e||"object"!=typeof e&&"function"!=typeof e,I=Array.isArray,q="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,B=/>/g,O=RegExp(`>|${q}(?:([^\\s"'>=/]+)(${q}*=${q}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),F=/'/g,L=/"/g,j=/^(?:script|style|textarea|title)$/i,H=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),N=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),G=new WeakMap,Z=M.createTreeWalker(M,129);function V(e,t){if(!I(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(t):t}const Y=(e,t)=>{const i=e.length-1,s=[];let o,n=2===t?"<svg>":3===t?"<math>":"",r=U;for(let t=0;t<i;t++){const i=e[t];let a,l,c=-1,d=0;for(;d<i.length&&(r.lastIndex=d,l=r.exec(i),null!==l);)d=r.lastIndex,r===U?"!--"===l[1]?r=R:void 0!==l[1]?r=B:void 0!==l[2]?(j.test(l[2])&&(o=RegExp("</"+l[2],"g")),r=O):void 0!==l[3]&&(r=O):r===O?">"===l[0]?(r=o??U,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,a=l[1],r=void 0===l[3]?O:'"'===l[3]?L:F):r===L||r===F?r=O:r===R||r===B?r=U:(r=O,o=void 0);const h=r===O&&e[t+1].startsWith("/>")?" ":"";n+=r===U?i+T:c>=0?(s.push(a),i.slice(0,c)+k+i.slice(c)+P+h):i+P+(-2===c?t:h)}return[V(e,n+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),s]};class K{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let o=0,n=0;const r=e.length-1,a=this.parts,[l,c]=Y(e,t);if(this.el=K.createElement(l,i),Z.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(s=Z.nextNode())&&a.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const e of s.getAttributeNames())if(e.endsWith(k)){const t=c[n++],i=s.getAttribute(e).split(P),r=/([.?@])?(.*)/.exec(t);a.push({type:1,index:o,name:r[2],strings:i,ctor:"."===r[1]?te:"?"===r[1]?ie:"@"===r[1]?se:ee}),s.removeAttribute(e)}else e.startsWith(P)&&(a.push({type:6,index:o}),s.removeAttribute(e));if(j.test(s.tagName)){const e=s.textContent.split(P),t=e.length-1;if(t>0){s.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)s.append(e[i],D()),Z.nextNode(),a.push({type:2,index:++o});s.append(e[t],D())}}}else if(8===s.nodeType)if(s.data===E)a.push({type:2,index:o});else{let e=-1;for(;-1!==(e=s.data.indexOf(P,e+1));)a.push({type:7,index:o}),e+=P.length-1}o++}}static createElement(e,t){const i=M.createElement("template");return i.innerHTML=e,i}}function X(e,t,i=e,s){if(t===N)return t;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const n=A(t)?void 0:t._$litDirective$;return o?.constructor!==n&&(o?._$AO?.(!1),void 0===n?o=void 0:(o=new n(e),o._$AT(e,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(t=X(e,o._$AS(e,t.values),o,s)),t}let J=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,s=(e?.creationScope??M).importNode(t,!0);Z.currentNode=s;let o=Z.nextNode(),n=0,r=0,a=i[0];for(;void 0!==a;){if(n===a.index){let t;2===a.type?t=new Q(o,o.nextSibling,this,e):1===a.type?t=new a.ctor(o,a.name,a.strings,this,e):6===a.type&&(t=new oe(o,this,e)),this._$AV.push(t),a=i[++r]}n!==a?.index&&(o=Z.nextNode(),n++)}return Z.currentNode=M,s}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}};class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,s){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=X(this,e,t),A(e)?e===W||null==e||""===e?(this._$AH!==W&&this._$AR(),this._$AH=W):e!==this._$AH&&e!==N&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>I(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==W&&A(this._$AH)?this._$AA.nextSibling.data=e:this.T(M.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,s="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=K.createElement(V(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(t);else{const e=new J(s,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=G.get(e.strings);return void 0===t&&G.set(e.strings,t=new K(e)),t}k(e){I(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,s=0;for(const o of e)s===t.length?t.push(i=new Q(this.O(D()),this.O(D()),this,this.options)):i=t[s],i._$AI(o),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=C(e).nextSibling;C(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,s,o){this.type=1,this._$AH=W,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=W}_$AI(e,t=this,i,s){const o=this.strings;let n=!1;if(void 0===o)e=X(this,e,t,0),n=!A(e)||e!==this._$AH&&e!==N,n&&(this._$AH=e);else{const s=e;let r,a;for(e=o[0],r=0;r<o.length-1;r++)a=X(this,s[i+r],t,r),a===N&&(a=this._$AH[r]),n||=!A(a)||a!==this._$AH[r],a===W?e=W:e!==W&&(e+=(a??"")+o[r+1]),this._$AH[r]=a}n&&!s&&this.j(e)}j(e){e===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===W?void 0:e}}class ie extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==W)}}class se extends ee{constructor(e,t,i,s,o){super(e,t,i,s,o),this.type=5}_$AI(e,t=this){if((e=X(this,e,t,0)??W)===N)return;const i=this._$AH,s=e===W&&i!==W||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,o=e!==W&&(i===W||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class oe{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){X(this,e)}}const ne=w.litHtmlPolyfillSupport;ne?.(K,Q),(w.litHtmlVersions??=[]).push("3.3.2");const re=globalThis;let ae=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const s=i?.renderBefore??t;let o=s._$litPart$;if(void 0===o){const e=i?.renderBefore??null;s._$litPart$=o=new Q(t.insertBefore(D(),e),e,void 0,i??{})}return o._$AI(e),o})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return N}};ae._$litElement$=!0,ae.finalized=!0,re.litElementHydrateSupport?.({LitElement:ae});const le=re.litElementPolyfillSupport;le?.({LitElement:ae}),(re.litElementVersions??=[]).push("4.2.2");const ce=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},de={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:y},he=(e=de,t,i)=>{const{kind:s,metadata:o}=i;let n=globalThis.litPropertyMetadata.get(o);if(void 0===n&&globalThis.litPropertyMetadata.set(o,n=new Map),"setter"===s&&((e=Object.create(e)).wrapped=!0),n.set(i.name,e),"accessor"===s){const{name:s}=i;return{set(i){const o=t.get.call(this);t.set.call(this,i),this.requestUpdate(s,o,e,!0,i)},init(t){return void 0!==t&&this.C(s,void 0,e,t),t}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];t.call(this,i),this.requestUpdate(s,o,e,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pe(e){return(t,i)=>"object"==typeof i?he(e,t,i):((e,t,i)=>{const s=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),s?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function _e(e){return pe({...e,state:!0,attribute:!1})}function ge(e,t){return(t,i,s)=>((e,t,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,i),i))(t,i,{get(){return(t=>t.renderRoot?.querySelector(e)??null)(this)}})}const ue=2,me=e=>(...t)=>({_$litDirective$:e,values:t});class ve{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}const fe=(e,t)=>{const i=e._$AN;if(void 0===i)return!1;for(const e of i)e._$AO?.(t,!1),fe(e,t);return!0},be=e=>{let t,i;do{if(void 0===(t=e._$AM))break;i=t._$AN,i.delete(e),e=t}while(0===i?.size)},ye=e=>{for(let t;t=e._$AM;e=t){let i=t._$AN;if(void 0===i)t._$AN=i=new Set;else if(i.has(e))break;i.add(e),we(t)}};function xe(e){void 0!==this._$AN?(be(this),this._$AM=e,ye(this)):this._$AM=e}function $e(e,t=!1,i=0){const s=this._$AH,o=this._$AN;if(void 0!==o&&0!==o.size)if(t)if(Array.isArray(s))for(let e=i;e<s.length;e++)fe(s[e],!1),be(s[e]);else null!=s&&(fe(s,!1),be(s));else fe(this,e)}const we=e=>{e.type==ue&&(e._$AP??=$e,e._$AQ??=xe)};class Ce extends ve{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,i){super._$AT(e,t,i),ye(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(fe(this,e),be(this))}setValue(e){if((e=>void 0===e.strings)(this._$Ct))this._$Ct._$AI(e,this);else{const t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}}class Se{}const ze=new WeakMap,ke=me(class extends Ce{render(e){return W}update(e,[t]){const i=t!==this.G;return i&&void 0!==this.G&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),W}rt(e){if(this.isConnected||(e=void 0),"function"==typeof this.G){const t=this.ht??globalThis;let i=ze.get(t);void 0===i&&(i=new WeakMap,ze.set(t,i)),void 0!==i.get(this.G)&&this.G.call(this.ht,void 0),i.set(this.G,e),void 0!==e&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return"function"==typeof this.G?ze.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),Pe=r`
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

  /* Fix ha-svg-icon vertical misalignment within ha-icon */
  ha-svg-icon {
    vertical-align: top;
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

  /* Running operations display */
  .running-ops-container {
    width: 100%;
  }

  .running-ops-empty {
    text-align: center;
    color: var(--secondary-text-color);
    padding: 12px 0;
    font-size: var(--ha-font-size-m, 14px);
  }

  .running-ops-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 8px;
    margin-top: 8px;
  }

  .running-op-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--card-background-color, var(--ha-card-background, #fff));
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: var(--ha-card-border-radius, 12px);
    gap: 8px;
  }

  .running-op-card.externally-paused {
    border-color: var(--warning-color, #ff9800);
    border-style: dashed;
  }

  .running-op-info {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  .running-op-icon {
    color: var(--primary-color);
    flex-shrink: 0;
    --mdc-icon-size: 20px;
  }

  .running-op-details {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .running-op-name {
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .running-op-entity {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .running-op-entity-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .running-op-progress {
    color: var(--primary-color);
    font-weight: var(--ha-font-weight-medium, 500);
  }

  .running-op-status {
    font-style: italic;
  }

  .externally-paused-text {
    color: var(--warning-color, #ff9800);
  }

  .running-op-actions {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
  }

  .running-op-actions ha-icon-button {
    --mdc-icon-button-size: 36px;
    --mdc-icon-size: 20px;
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

  .include-all-lights-toggle {
    margin-top: 8px;
  }

  .include-all-lights-toggle .toggle-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    cursor: pointer;
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
    width: 48px;
    height: 48px;
    background: rgba(var(--rgb-primary-color), 0.2);
    border-radius: var(--ha-card-border-radius, 10px);
    flex-shrink: 0;
    transition: all 0.2s ease-in-out;
    position: relative;
    z-index: 1;
  }

  .favorite-button-icon ha-icon {
    --mdc-icon-size: 32px;
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

  /* Activation overrides grid - 4 columns desktop, 2 columns mobile */
  .overrides-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 16px 0;
  }

  .override-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .override-item .form-label {
    min-width: unset;
    font-size: var(--ha-font-size-s, 12px);
  }

  .brightness-slider {
    padding: 0 16px 8px;
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
    font-size: 40px;
    margin-bottom: 8px;
    line-height: 1;
    position: relative;
    --mdc-icon-size: 40px;
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
  .user-preset:hover .preset-card-actions,
  .builtin-preset:hover .preset-card-actions {
    opacity: 1;
  }


  .preset-card-actions ha-icon-button,
  .preset-card-actions .favorite-star {
    --mdc-icon-button-size: 28px;
    --mdc-icon-size: 16px;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preset-card-actions .favorite-star.favorited {
    color: var(--accent-color, #ffc107);
  }

  .preset-card-actions ha-icon-button ha-icon,
  .preset-card-actions .favorite-star ha-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preset-card-actions ha-icon-button:hover,
  .preset-card-actions .favorite-star:hover {
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
      font-size: 36px;
      margin-bottom: 4px;
      --mdc-icon-size: 36px;
    }

    .user-preset-card .preset-name {
      font-size: var(--ha-font-size-xs, 11px);
    }

    .overrides-grid {
      grid-template-columns: repeat(2, 1fr);
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

  .setup-badge {
    margin-right: 4px;
    padding: 1px 6px;
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-radius: 8px;
    font-size: var(--ha-font-size-xs, 10px);
    font-weight: 500;
    white-space: nowrap;
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

  /* Segment zone management styles */
  .zone-device-section {
    padding: 16px;
    border-bottom: 1px solid var(--divider-color);
  }

  .zone-device-section:last-child {
    border-bottom: none;
  }

  .zone-device-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    font-weight: var(--ha-font-weight-medium, 500);
    color: var(--primary-text-color);
  }

  .zone-device-segments {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    font-weight: normal;
    margin-left: auto;
  }

  .zone-empty-message {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    padding: 8px 0;
  }

  .zone-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .zone-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    border: 1px solid var(--divider-color);
    border-radius: var(--ha-border-radius-sm, 4px);
    background: var(--secondary-background-color);
  }

  .zone-row-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .zone-name-input {
    flex: 1;
    min-width: 0;
  }

  .zone-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }
`,Ee=r`
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

  /* Segment selector zone buttons */
  .zone-divider {
    width: 1px;
    height: 24px;
    background: var(--divider-color);
    margin: 0 4px;
  }

  .zone-button {
    --mdc-theme-primary: var(--primary-color);
  }

  /* Color history styles moved to color-history-swatches.ts shared component */
`;function Te(e){return Math.round(1e4*e)/1e4}function Me(e,t,i=255){if(0===t)return{r:0,g:0,b:0};const s=1/t*e,o=1/t*(1-e-t);let n=3.2406*s-1.5372+-.4986*o,r=-.9689*s+1.8758+.0415*o,a=.0557*s-.204+1.057*o;const l=Math.max(n,r,a);l>1&&(n/=l,r/=l,a/=l),n=Math.max(0,n),r=Math.max(0,r),a=Math.max(0,a),n=n<=.0031308?12.92*n:1.055*Math.pow(n,1/2.4)-.055,r=r<=.0031308?12.92*r:1.055*Math.pow(r,1/2.4)-.055,a=a<=.0031308?12.92*a:1.055*Math.pow(a,1/2.4)-.055;const c=i/255;return{r:Math.max(0,Math.min(255,Math.round(255*n*c))),g:Math.max(0,Math.min(255,Math.round(255*r*c))),b:Math.max(0,Math.min(255,Math.round(255*a*c)))}}function De(e,t,i){let s=e/255,o=t/255,n=i/255;s=s>.04045?Math.pow((s+.055)/1.055,2.4):s/12.92,o=o>.04045?Math.pow((o+.055)/1.055,2.4):o/12.92,n=n>.04045?Math.pow((n+.055)/1.055,2.4):n/12.92;const r=.4124*s+.3576*o+.1805*n,a=.2126*s+.7152*o+.0722*n,l=r+a+(.0193*s+.1192*o+.9505*n);return 0===l?{x:.3127,y:.329}:{x:Te(r/l),y:Te(a/l)}}function Ae(e){const t=e=>e.toString(16).padStart(2,"0");return`#${t(e.r)}${t(e.g)}${t(e.b)}`}function Ie(e,t=255){return Ae(Me(e.x,e.y,t))}function qe(e,t,i){const s=e/255,o=t/255,n=i/255,r=Math.max(s,o,n),a=r-Math.min(s,o,n);let l=0,c=0;return 0!==r&&(c=a/r*100),0!==a&&(l=r===s?(o-n)/a%6:r===o?(n-s)/a+2:(s-o)/a+4,l=Math.round(60*l),l<0&&(l+=360)),{h:l,s:Math.round(c)}}function Ue(e){const t=Me(e.x,e.y,255);return qe(t.r,t.g,t.b)}function Re(e){const t=function(e,t){const i=t/100*1,s=i*(1-Math.abs(e/60%2-1)),o=1-i;let n=0,r=0,a=0;return e>=0&&e<60?(n=i,r=s,a=0):e>=60&&e<120?(n=s,r=i,a=0):e>=120&&e<180?(n=0,r=i,a=s):e>=180&&e<240?(n=0,r=s,a=i):e>=240&&e<300?(n=s,r=0,a=i):(n=i,r=0,a=s),{r:Math.round(255*(n+o)),g:Math.round(255*(r+o)),b:Math.round(255*(a+o))}}(e.h,e.s);return De(t.r,t.g,t.b)}function Be(e){const t=Ue(e);return Re({h:(t.h+180)%360,s:t.s})}class Oe extends ve{constructor(e){if(super(e),this.it=W,e.type!==ue)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===W||null==e)return this._t=void 0,this.it=e;if(e===N)return e;if("string"!=typeof e)throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}Oe.directiveName="unsafeHTML",Oe.resultType=1;const Fe=me(Oe),Le=200,je=200,He=180,Ne=180,We=80;function Ge(e,t){const i=(e-90)*Math.PI/180;return[Math.round(100*(Le+t*Math.cos(i)))/100,Math.round(100*(je+t*Math.sin(i)))/100]}function Ze(e,t,i){if(t-e>=360)return`<circle cx="200" cy="200" r="180" fill="${i}" />`;const[s,o]=Ge(e,He),[n,r]=Ge(t,He);return`<path fill="${i}" stroke="${i}" stroke-width="1" d="M200,200 L${s},${o} A180,180 0 ${t-e>180?1:0},1 ${n},${r} Z" />`}function Ve(e){return Ae(Me(e.x,e.y,255))}function Ye(e){const t=Math.round(e.brightness_pct/100*255);return Ae(Me(e.x,e.y,t))}function Ke(e){if(e.length<=8)return e;const t=[];for(let i=0;i<8;i++){const s=Math.round(i/8*e.length)%e.length;t.push({hex:e[s].hex,startDeg:45*i,endDeg:45*(i+1)})}return t}function Xe(e){const t=e/100;let i,s,o;t<=66?i=255:(i=329.698727446*Math.pow(t-60,-.1332047592),i=Math.max(0,Math.min(255,i))),s=t<=66?99.4708025861*Math.log(t)-161.1195681661:288.1221695283*Math.pow(t-60,-.0755148492),s=Math.max(0,Math.min(255,s)),t>=66?o=255:t<=19?o=0:(o=138.5177312231*Math.log(t-10)-305.0447927307,o=Math.max(0,Math.min(255,o)));const n=e=>Math.round(e).toString(16).padStart(2,"0");return`#${n(i)}${n(s)}${n(o)}`}function Je(e){return`<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">${e}</svg>`}function Qe(e){return`<svg class="gradient-thumb" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">${e}</svg>`}function et(e){if(!e.segments||0===e.segments.length)return null;const t=function(e){if(0===e.length)return[];const t=[...e].sort((e,t)=>("number"==typeof e.segment?e.segment:parseInt(e.segment,10))-("number"==typeof t.segment?t.segment:parseInt(t.segment,10))),i=360/t.length,s=[];let o=Ae(t[0].color),n=0;for(let e=1;e<t.length;e++){const r=Ae(t[e].color);r!==o&&(s.push({hex:o,startDeg:n,endDeg:e*i}),o=r,n=e*i)}return s.push({hex:o,startDeg:n,endDeg:360}),Ke(s)}(e.segments),i=t.map(e=>Ze(e.startDeg,e.endDeg,e.hex)).join("");return H`${ot(Je(i))}`}function tt(e){if(!e.steps||0===e.steps.length)return null;const t=e.steps[0];let i=[];if(t.segment_colors&&t.segment_colors.length>0?i=t.segment_colors.map(e=>Ae(e.color)):t.colors&&t.colors.length>0&&(i=t.colors.map(e=>Ae({r:e[0]??0,g:e[1]??0,b:e[2]??0}))),0===i.length)return null;const s=function(e){if(0===e.length)return[];const t=360/e.length,i=[];let s=e[0],o=0;for(let n=1;n<e.length;n++)e[n]!==s&&(i.push({hex:s,startDeg:o,endDeg:n*t}),s=e[n],o=n*t);return i.push({hex:s,startDeg:o,endDeg:360}),Ke(i)}(i);if(1===s.length){const e=[`<circle cx="200" cy="200" r="180" fill="${s[0].hex}" />`,'<circle cx="200" cy="200" r="80" fill="var(--card-background-color, #fff)" />'].join("");return H`${ot(Je(e))}`}const o=s.map(e=>function(e,t,i){if(t-e>=360)return[`<circle cx="200" cy="200" r="180" fill="${i}" />`,'<circle cx="200" cy="200" r="80" fill="var(--card-background-color, #fff)" />'].join("");const[s,o]=Ge(e,Ne),[n,r]=Ge(t,Ne),[a,l]=Ge(t,We),[c,d]=Ge(e,We),h=t-e>180?1:0;return`<path fill="${i}" stroke="${i}" stroke-width="1" d="M${s},${o} A180,180 0 ${h},1 ${n},${r} L${a},${l} A80,80 0 ${h},0 ${c},${d} Z" />`}(e.startDeg,e.endDeg,e.hex)).join("");return H`${ot(Je(o))}`}function it(e){const t=Me(e.x,e.y,255),i=qe(t.r,t.g,t.b);return 0===i.s?360:i.h}function st(e){let t,i;if(Array.isArray(e)?(t=e.slice(0,8),i=`ds-${t.map(e=>`${e.x}${e.y}`).join("")}`):(t=(e.colors??[]).slice(0,8),i=`ds-${e.id}`),0===t.length)return null;if(1===t.length){const e=Ye(t[0]);return H`${ot(Qe(`<rect fill="${e}" x="10" y="10" width="380" height="380" rx="8" />`))}`}const s=[...t].sort((e,t)=>it(e)-it(t)),o=s.map((e,t)=>`<stop offset="${Math.round(t/(s.length-1)*100)}%" stop-color="${Ye(e)}" />`).join("");return H`${ot(Qe(`<defs><linearGradient id="${i}" x1="0" y1="0" x2="1" y2="1">${o}</linearGradient></defs><rect fill="url(#${i})" x="10" y="10" width="380" height="380" rx="8" />`))}`}function ot(e){return Fe(e)}const nt={title:"Aqara Advanced Lighting",tabs:{activate:"Activate",effects:"Effects",patterns:"Patterns",cct:"CCT",segments:"Segments",scenes:"Scenes",presets:"My Presets",config:"Device Config"},status:{setting_up:"Setting up..."},errors:{title:"Error",loading_presets:"Failed to load presets. Please refresh the page.",loading_presets_generic:"Failed to load presets",no_presets_title:"No presets available",no_presets_message:"No built-in presets are available. Please check your configuration.",incompatible_light_title:"Incompatible light selected",incompatible_light_message:"One or more selected lights are not supported Aqara models. Please select only T1M, T1 Strip, or T2 bulb lights."},target:{section_title:"Targets",select_lights:"Select lights to control",lights_selected:"{count} light selected",lights_selected_plural:"{count} lights selected",lights_label:"Lights",favorites_label:"Favorite lights",favorite_name_label:"Favorite Name",light_control_label:"Light control",quick_controls_label:"Quick controls",custom_brightness_label:"Brightness",static_scene_mode_label:"Static scene mode",ignore_external_changes_label:"Ignore external changes",controls_card_title:"Active presets",activation_overrides_title:"Activation overrides",effect_button:"Effect",cct_button:"CCT",segment_button:"Segment",scene_button:"Scene",running_operations_label:"Running presets",no_running_operations:"No active presets",pause:"Pause",resume:"Resume",stop:"Stop",paused:"Paused",externally_paused:"Externally paused",resume_control:"Resume control",entities_externally_paused:"{count} paused externally",no_lights_message:"Please select one or more lights to view available presets",group_label:"Group ({count} lights)",lights_count:"{count} lights",favorite_lights_count:"{count} lights",include_all_lights_label:"Include non-Aqara lights",include_all_lights_hint:"Show all light entities, not just Aqara devices. CCT sequences and dynamic scenes work with any light."},devices:{t2_bulb:"T2 Bulb",t1:"T1",t1m:"T1M",t1_strip:"T1 Strip"},sections:{dynamic_effects:"Dynamic Effects",segment_patterns:"Segment Patterns",cct_sequences:"CCT Sequences",segment_sequences:"Segment Sequences",dynamic_scenes:"Dynamic Scenes",subtitle_presets:"{count} presets",subtitle_presets_custom:"{count} presets ({custom} custom)",subtitle_user_presets:"{count} presets",favorite_presets:"Favorite Presets",subtitle_favorites:"{count} favorites",t1_strip_settings:"T1 Strip settings"},presets:{manage_description:"Manage your saved presets.",manage_description_with_selection:"Click a preset to activate it, or use the edit/delete buttons.",no_presets_title:"No saved presets yet.",no_presets_description:"Use the other tabs to create and save your custom presets.",sort_name_asc:"Name (A-Z)",sort_name_desc:"Name (Z-A)",sort_date_new:"Newest first",sort_date_old:"Oldest first",export_button:"Backup Presets",import_button:"Restore Presets",export_success:"Presets backed up successfully",import_success:"{count} presets restored successfully",import_progress:"Restoring presets...",export_progress:"Backing up presets...",import_error_invalid_file:"Invalid backup file format",import_error_unknown:"An unexpected error occurred",export_error_network:"Network error during backup",copy_suffix:"(copy)",presets_count:"{count} presets"},dialogs:{create_effect_title:"Create Effect Preset",edit_effect_title:"Edit Effect Preset",create_effect_description:"Create custom dynamic effect presets with your choice of colors, speed, and brightness.",edit_effect_description:"Update your effect preset settings.",create_pattern_title:"Create Segment Pattern",edit_pattern_title:"Edit Segment Pattern",create_pattern_description:"Design custom segment patterns by setting individual segment colors.",edit_pattern_description:"Update your segment pattern settings.",create_cct_title:"Create CCT Sequence",edit_cct_title:"Edit CCT Sequence",create_cct_description:"Build color temperature sequences with multiple steps and timing controls.",edit_cct_description:"Update your CCT sequence settings.",create_segment_title:"Create Segment Sequence",edit_segment_title:"Edit Segment Sequence",create_segment_description:"Design animated segment sequences with multiple steps and transition effects.",edit_segment_description:"Update your segment sequence settings.",create_scene_title:"Create Dynamic Scene",edit_scene_title:"Edit Dynamic Scene",create_scene_description:"Create ambient lighting scenes with slow color transitions across multiple lights.",edit_scene_description:"Update your dynamic scene settings.",compatibility_warning_effects:"Preview not available, the selected light does not support dynamic effects. Compatible devices: T2 RGB bulb, T1M RGB endpoint, T1 Strip.",compatibility_warning_patterns:"Preview not available, the selected light does not support segment patterns. Compatible devices: T1M RGB endpoint, T1 Strip.",compatibility_warning_cct:"Preview not available, the selected light does not support CCT sequences. Compatible devices: T2 RGB bulb, T2 CCT bulb, T1M white endpoint, T1 Strip.",compatibility_warning_segments:"Preview not available, the selected light does not support segment sequences. Compatible devices: T1M RGB endpoint, T1 Strip.",compatibility_warning_scenes:"Preview not available, the selected light does not support RGB colors. Compatible devices: T2 RGB bulb, T1M RGB endpoint, T1 Strip."},config:{transition_settings:"T2 transition settings",custom_curvature_label:"Custom curvature",initial_brightness_label:"Initial brightness",on_to_off_duration_label:"On to off duration",off_to_on_duration_label:"Off to on duration",dimming_range_min_label:"Dimming range minimum",dimming_range_max_label:"Dimming range maximum",strip_length_label:"Strip length",select_light_message:"Select a light in the Activate tab to configure device-specific settings.",segment_zones_title:"Segment zones",segment_zones_subtitle:"Name segment ranges for quick selection and service calls",zone_name_label:"Zone name",zone_name_placeholder:"e.g. left side",zone_segments_label:"Segments",zone_segments_placeholder:"e.g. 1-8",zone_add_button:"Add zone",zone_save_button:"Save zones",zone_delete_tooltip:"Delete zone",zone_no_zones:"No zones defined for this device.",zone_saved:"Zones saved successfully.",zone_save_error:"Failed to save zones.",zone_name_required:"Zone name is required.",zone_segments_required:"Select at least one segment for each zone.",zone_invalid_range:'Zone "{name}": invalid segment range "{range}"',zone_out_of_range:'Zone "{name}": segment {segment} exceeds device maximum of {max}',zone_no_segment_devices:"Segment zones are only available for devices that support segment addressing (T1M, T1 Strip).",zone_duplicate_name:'Duplicate zone name: "{name}"',dimming_settings_title:"Dimming settings",entity_not_found:"Entity not found for this device.",initial_brightness_not_found:"Initial brightness entity not found for this device.",dimming_not_available:"Dimming settings are not available for this device.",strip_length_info:"Each meter has 5 addressable RGB segments (20cm each).",strip_length_not_found:"Length entity not found for this device.",segment_count:"{count} segments",applying_button:"Applying...",apply_button:"Apply",curvature_fast_slow:"Fast start, slow end",curvature_linear:"Linear (uniform)",curvature_slow_fast:"Slow start, fast end",curve_legend_fast_slow:"0.2-1: Fast then slow",curve_legend_linear:"1: Linear",curve_legend_slow_fast:"1-6: Slow then fast"},instances:{section_title:"Zigbee2MQTT instances",subtitle_single:"{count} instance, {devices} device",subtitle_plural:"{count} instances, {devices} devices",no_instances:"No Z2M instances found. Make sure the integration is properly configured.",total:"Total",t2_rgb:"T2 RGB",t2_cct:"T2 CCT",t1m:"T1M",t1_strip:"T1 Strip",other:"Other",show_devices_single:"Show {count} device",show_devices_plural:"Show {count} devices"},transition_curve:{title:"Transition curve",subtitle:"Drag on the graph to adjust"},tooltips:{color_edit:"Click to edit color",color_remove:"Remove color",color_add:"Add color",step_move_up:"Move up",step_move_down:"Move down",step_duplicate:"Duplicate",step_remove:"Remove",favorite_save:"Save as favorite",favorite_preset_add:"Add to favorites",favorite_preset_remove:"Remove from favorites",preset_edit:"Edit preset",preset_duplicate:"Duplicate preset",preset_delete:"Delete preset",version_mismatch:"Version mismatch detected: Backend (v{backend}) and frontend (v{frontend}) versions differ. Please refresh the page or restart Home Assistant to resolve this issue.",setup_in_progress:"The integration is still initializing. Device discovery is in progress and some features may not work correctly until setup completes."},options:{loop_mode_once:"Run once",loop_mode_count:"Loop N times",loop_mode_continuous:"Continuous loop",end_behavior_maintain:"Stay at last step",end_behavior_turn_off:"Turn off light",activation_all:"All at once",activation_sequential_forward:"Sequential forward",activation_sequential_reverse:"Sequential reverse",activation_random:"Random",activation_ping_pong:"Ping pong",activation_center_out:"Center out",activation_edges_in:"Edges in",activation_paired:"Paired"},editors:{name_label:"Name",icon_label:"Icon",icon_auto_hint:"Auto-generated from colors when not set",cancel_button:"Cancel",save_button:"Save",select_all_button:"Select all",clear_all_button:"Clear all",clear_selected_button:"Clear selected",clear_mode_on:"Clear: ON",clear_mode_off:"Clear: OFF",segments_selected:"{count} selected",zone_select_label:"Select zone...",select_mode_on:"Select: ON",select_mode_off:"Select: OFF",add_step_button:"Add step",apply_to_selected_button:"Apply to selected",loop_mode_label:"Loop mode",loop_count_label:"Loop count",end_behavior_label:"End behavior",device_type_label:"Device type",selected_device_type:"Selected device",skip_first_step_label:"Skip first step in loop",no_steps_message:'No steps defined. Click "Add step" to create your first step.',segments_label:"Segments",colors_label:"Colors (1-8)",colors_brightness_label:"Colors and brightness (1-8)",color_picker_title:"Select color",apply_button:"Apply",color_temperature_label:"Color temperature ({value}K)",transition_time_label:"Transition time",hold_time_label:"Hold time",duration_label:"Duration",activation_pattern_label:"Activation pattern",speed_label:"Speed",effect_label:"Effect",segment_grid_label:"Segment grid",brightness_label:"Brightness",brightness_percent_label:"Brightness (%)",steps_label:"Steps (1-20)",select_lights_for_preview_effects:"Select light entities in the Activate tab to preview effects on your devices.",select_lights_for_preview_patterns:"Select light entities in the Activate tab to preview patterns on your devices.",select_lights_for_preview_sequences:"Select light entities in the Activate tab to preview sequences on your devices.",first_half_button:"First Half",second_half_button:"Second Half",odd_button:"Odd",even_button:"Even",individual_tab:"Individual",gradient_tab:"Gradient",blocks_tab:"Blocks",apply_to_grid_button:"Apply to Grid",expand_blocks_label:"Expand blocks to fill segments evenly",gradient_mode_description:"Create a smooth color gradient. Add 2-6 colors to blend.",blocks_mode_description:"Create evenly spaced blocks of color. Add 1-6 colors.",gradient_reverse_label:"Reverse direction",gradient_mirror_label:"Mirror gradient",gradient_wave_label:"Wave easing",gradient_repeat_label:"Repeat",gradient_wave_cycles_label:"Wave cycles",gradient_interpolation_label:"Interpolation",gradient_interp_shortest:"Shortest hue",gradient_interp_longest:"Longest hue",gradient_interp_rgb:"Linear RGB",preview_button:"Preview",stop_button:"Stop",update_button:"Update",clear_segments_label:"Clear Segments",gradient_min_colors_error:"Gradient mode requires at least 2 colors. Please add more colors to steps using gradient mode or change the mode.",tooltip_select_lights_first:"Select entities in Activate tab first",tooltip_light_not_compatible:"Selected light is not compatible",tooltip_light_no_cct:"Selected light does not support color temperature",tooltip_fix_gradient_errors:"Fix gradient validation errors first",turn_off_unspecified_label:"Turn off unspecified segments",incompatible_cct_endpoints:"One or more selected lights do not support color temperature control. CCT sequences require lights with color_temp capability. For T1M devices, select the white/CCT endpoint instead of the RGB ring endpoint."},color_history:{recent_colors:"Recent colors",clear:"Clear"},dynamic_scene:{add_color_button:"Add color",timing_label:"Timing",distribution_mode_label:"Color assignment",distribution_shuffle_rotate:"Shuffle and rotate",distribution_synchronized:"Synchronized",distribution_random:"Random",ripple_effect_label:"Transition stagger",random_order_label:"Randomize light order",scene_brightness_label:"Maximum scene brightness",offset_delay_label:"Offset delay between lights",end_behavior_restore:"Restore previous state",select_lights_for_preview:"Select light entities in the Activate tab to preview dynamic scenes on your devices."}};function rt(e){return Math.round(1e4*e)/1e4}function at(e,t){let i=e.filter(e=>!function(e,t){return rt(e.x)===rt(t.x)&&rt(e.y)===rt(t.y)}(e,t));return i=[{x:rt(t.x),y:rt(t.y)},...i],i.length>8&&(i=i.slice(0,8)),i}let lt=class extends ae{constructor(){super(...arguments),this.color={x:.68,y:.31},this.size=220,this.showRgbInputs=!0,this._isDragging=!1,this._editingColor={h:0,s:100},this._onPointerMove=e=>{this._isDragging&&(e.preventDefault(),this._handleWheelInteraction(e))},this._onPointerUp=()=>{this._isDragging=!1,this._marker?.classList.remove("dragging"),window.removeEventListener("mousemove",this._onPointerMove),window.removeEventListener("mouseup",this._onPointerUp),window.removeEventListener("touchmove",this._onPointerMove),window.removeEventListener("touchend",this._onPointerUp)}}firstUpdated(){this._editingColor=Ue(this.color),this._drawColorWheel(),this._updateMarkerPosition()}updated(e){e.has("size")&&(this._drawColorWheel(),this._updateMarkerPosition()),e.has("color")&&!this._isDragging&&(this._editingColor=Ue(this.color),this._updateMarkerPosition())}_drawColorWheel(){const e=this._canvas;if(!e)return;const t=e.getContext("2d");if(!t)return;const i=this.size,s=i/2,o=i/2,n=i/2;e.width=i,e.height=i;for(let e=0;e<360;e++){const i=(e-1)*Math.PI/180,r=(e+1)*Math.PI/180,a=t.createRadialGradient(s,o,0,s,o,n);a.addColorStop(0,"hsl("+e+", 0%, 100%)"),a.addColorStop(1,"hsl("+e+", 100%, 50%)"),t.beginPath(),t.moveTo(s,o),t.arc(s,o,n,i,r),t.closePath(),t.fillStyle=a,t.fill()}}_updateMarkerPosition(){if(!this._marker)return;const{x:e,y:t}=this._hsToPosition(this._editingColor);this._marker.style.left=`${e}px`,this._marker.style.top=`${t}px`;const i=Re(this._editingColor),s=Me(i.x,i.y,255),o=`#${s.r.toString(16).padStart(2,"0")}${s.g.toString(16).padStart(2,"0")}${s.b.toString(16).padStart(2,"0")}`;this._marker.style.backgroundColor=o}_hsToPosition(e){const t=this.size/2,i=this.size/2,s=this.size/2,o=e.h*Math.PI/180,n=e.s/100*s;return{x:t+n*Math.cos(o),y:i+n*Math.sin(o)}}_positionToHs(e,t){const i=this.size/2,s=this.size/2,o=this.size/2,n=e-i,r=t-s;let a=Math.sqrt(n*n+r*r);a=Math.min(a,o);let l=180*Math.atan2(r,n)/Math.PI;return l<0&&(l+=360),{h:Math.round(l)%360,s:Math.round(a/o*100)}}_handleWheelInteraction(e){const t=this._canvas;if(!t)return;const i=t.getBoundingClientRect();let s,o;if("touches"in e){const t=e.touches[0];if(!t)return;s=t.clientX,o=t.clientY}else s=e.clientX,o=e.clientY;const n=s-i.left,r=o-i.top,a=this._positionToHs(n,r);this._editingColor=a;const l=Re(a);this._updateMarkerPosition(),this._updateRgbInputs(l),this._fireColorChanged(l)}_handleRgbInput(e,t){const i=e.target,s=parseInt(i.value,10);if(isNaN(s)||s<0||s>255)return;const o=Re(this._editingColor),n=Me(o.x,o.y,255),r={r:"r"===t?s:n.r,g:"g"===t?s:n.g,b:"b"===t?s:n.b},a=De(r.r,r.g,r.b),l=Ue(a);this._editingColor=l,this._updateMarkerPosition(),this._updateRgbInputs(a),this._fireColorChanged(a);const c=Me(a.x,a.y,255);if(("r"===t?c.r:"g"===t?c.g:c.b)!==s){const e=i.style.borderColor;i.style.borderColor="var(--warning-color, #ff9800)",setTimeout(()=>{i.style.borderColor=e},500)}}_updateRgbInputs(e){const t=this.shadowRoot?.querySelectorAll(".rgb-input-field");if(!t||3!==t.length)return;const i=Me(e.x,e.y,255);t[0].value=i.r.toString(),t[1].value=i.g.toString(),t[2].value=i.b.toString()}_fireColorChanged(e){this.dispatchEvent(new CustomEvent("color-changed",{detail:{color:e},bubbles:!0,composed:!0}))}_onPointerDown(e){e.preventDefault(),this._isDragging=!0,this._marker?.classList.add("dragging"),this._handleWheelInteraction(e),e instanceof MouseEvent?(window.addEventListener("mousemove",this._onPointerMove),window.addEventListener("mouseup",this._onPointerUp)):(window.addEventListener("touchmove",this._onPointerMove,{passive:!1}),window.addEventListener("touchend",this._onPointerUp))}render(){const e=Re(this._editingColor),t=Me(e.x,e.y,255);return H`
      <div class="color-picker-container">
        <div style="position: relative; width: ${this.size}px; height: ${this.size}px;">
          <canvas
            @mousedown=${this._onPointerDown}
            @touchstart=${this._onPointerDown}
          ></canvas>
          <div class="marker"></div>
        </div>
      </div>
      ${this.showRgbInputs?H`
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
    `}};lt.styles=r`
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
  `,e([pe({type:Object})],lt.prototype,"color",void 0),e([pe({type:Number})],lt.prototype,"size",void 0),e([pe({type:Boolean})],lt.prototype,"showRgbInputs",void 0),e([_e()],lt.prototype,"_isDragging",void 0),e([_e()],lt.prototype,"_editingColor",void 0),e([ge("canvas")],lt.prototype,"_canvas",void 0),e([ge(".marker")],lt.prototype,"_marker",void 0),lt=e([ce("xy-color-picker")],lt);let ct=class extends ae{constructor(){super(...arguments),this.colorHistory=[],this.translations={}}_localize(e){const t=e.split(".");let i=this.translations;for(const s of t){if(!i||"object"!=typeof i||!(s in i))return e;i=i[s]}return"string"==typeof i?i:e}_handleColorClick(e){this.dispatchEvent(new CustomEvent("color-selected",{detail:{color:e},bubbles:!0,composed:!0}))}_handleClear(){this.dispatchEvent(new CustomEvent("clear-history",{bubbles:!0,composed:!0}))}render(){return H`
      <div class="color-history-section">
        <div class="color-history-header">
          <span class="color-history-label">
            ${this._localize("color_history.recent_colors")}
          </span>
          ${this.colorHistory.length>0?H`
            <button class="color-history-clear" @click=${this._handleClear}>
              ${this._localize("color_history.clear")}
            </button>
          `:""}
        </div>
        <div class="color-history-swatches">
          ${this.colorHistory.map(e=>H`
            <button
              class="color-history-swatch"
              style="background-color: ${Ie(e,255)}"
              @click=${()=>this._handleColorClick(e)}
            ></button>
          `)}
        </div>
      </div>
    `}};ct.styles=r`
    :host {
      display: block;
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
  `,e([pe({type:Array})],ct.prototype,"colorHistory",void 0),e([pe({type:Object})],ct.prototype,"translations",void 0),ct=e([ce("color-history-swatches")],ct);const dt={t2_bulb:["breathing","candlelight","fading","flash"],t1:["flow1","flow2","fading","hopping","breathing","rolling"],t1m:["flow1","flow2","fading","hopping","breathing","rolling"],t1_strip:["breathing","rainbow1","chasing","flash","hopping","rainbow2","flicker","dash"]},ht={},pt={t2_bulb:"T2 Bulb",t1:"T1 (20 segments)",t1m:"T1M (26 segments)",t1_strip:"T1 Strip"};let _t=class extends ae{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.previewActive=!1,this.stripSegmentCount=10,this.colorHistory=[],this._name="",this._icon="",this._deviceType="t2_bulb",this._effect="",this._speed=50,this._brightness=100,this._colors=[{x:.68,y:.31}],this._segments="",this._saving=!1,this._previewing=!1,this._editingColorIndex=null,this._editingColor=null,this._hasUserInteraction=!1}updated(e){super.updated(e),e.has("draft")&&this.draft?this._restoreDraft(this.draft):e.has("preset")&&(this.preset?(this._hasUserInteraction=!0,this._loadPreset(this.preset)):this._hasUserInteraction=!1),e.has("deviceContext")&&!this._hasUserInteraction&&this.deviceContext?.deviceType&&(this._deviceType=this.deviceContext.deviceType,this._effect="","t1_strip"!==this._deviceType||this._segments||(this._segments="all"))}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._deviceType=e.device_type||"t2_bulb",this._effect=e.effect,this._speed=e.effect_speed,this._brightness=e.effect_brightness||100,this._colors=e.effect_colors.map(e=>"x"in e&&"y"in e?{x:e.x,y:e.y}:"r"in e&&"g"in e&&"b"in e?De(e.r,e.g,e.b):{x:.68,y:.31}),this._segments=e.effect_segments||""}getDraftState(){return{name:this._name,icon:this._icon,deviceType:this._deviceType,effect:this._effect,speed:this._speed,brightness:this._brightness,colors:[...this._colors],segments:this._segments}}resetToDefaults(){this._name="",this._icon="",this._deviceType="t2_bulb",this._effect="",this._speed=50,this._brightness=100,this._colors=[{x:.68,y:.31}],this._segments="",this._hasUserInteraction=!1}_restoreDraft(e){this._name=e.name,this._icon=e.icon,this._deviceType=e.deviceType,this._effect=e.effect,this._speed=e.speed,this._brightness=e.brightness,this._colors=[...e.colors],this._segments=e.segments,this._hasUserInteraction=!0}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleDeviceTypeChange(e){this._deviceType=e.detail.value||"t2_bulb",this._hasUserInteraction=!0,this._effect="","t1_strip"!==this._deviceType||this._segments||(this._segments="all")}_handleSpeedChange(e){this._speed=e.detail.value??50}_handleBrightnessChange(e){this._brightness=e.detail.value??100}_handleSegmentsChange(e){this._segments=e.detail.value||""}_openColorPicker(e){const t=this._colors[e];t&&(this._editingColorIndex=e,this._editingColor=t)}_handleColorPickerChange(e){this._editingColor=e.detail.color}_confirmColorPicker(){if(null!==this._editingColorIndex&&null!==this._editingColor){const e=at(this.colorHistory,this._editingColor);this.dispatchEvent(new CustomEvent("color-history-changed",{detail:{colorHistory:e},bubbles:!0,composed:!0})),this._colors=this._colors.map((e,t)=>t===this._editingColorIndex?this._editingColor:e)}this._closeColorPicker()}_handleHistoryColorSelected(e){const t=e.detail.color;this._editingColor={x:t.x,y:t.y}}_closeColorPicker(){this._editingColorIndex=null,this._editingColor=null}_addColor(){if(this._colors.length<8){const e=Be(this._colors[this._colors.length-1]||{x:.68,y:.31});this._colors=[...this._colors,e]}}_removeColor(e){this._colors.length>1&&(this._colors=this._colors.filter((t,i)=>i!==e))}_colorToHex(e){return Ie(e,255)}_getEffectIconUrl(e){return`/api/aqara_advanced_lighting/icons/${ht[e]||e}.svg`}_selectEffect(e){this._effect=e,this._hasUserInteraction=!0}_getPresetData(){const e={name:this._name,icon:this._icon||void 0,device_type:this._deviceType,effect:this._effect,effect_speed:this._speed,effect_brightness:this._brightness,effect_colors:this._colors};return"t1_strip"===this._deviceType&&this._segments&&(e.effect_segments=this._segments),e}async _preview(){if(this.hass&&this._effect&&!this._previewing){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&this._effect){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){const e=Object.entries(pt).map(([e,t])=>({value:e,label:t})),t=dt[this._deviceType]||[],i="t1_strip"===this._deviceType;return H`
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
            ${this._icon?"":H`<span class="form-hint">${this._localize("editors.icon_auto_hint")}</span>`}
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

        ${i?H`
              <div class="form-section">
                <segment-selector
                  .hass=${this.hass}
                  .mode=${"selection"}
                  .maxSegments=${this.stripSegmentCount}
                  .value=${this._segments}
                  .label=${this._localize("editors.segments_label")}
                  .translations=${this.translations}
                  .zones=${this.deviceContext?.zones||[]}
                  @value-changed=${this._handleSegmentsChange}
                ></segment-selector>
              </div>
            `:""}

        <div class="form-section">
          <span class="form-label">${this._localize("editors.effect_label")}</span>
          <div class="effect-grid">
            ${t.map(e=>H`
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
            ${this._colors.map((e,t)=>H`
                <div class="color-item">
                  <div
                    class="color-swatch"
                    style="background-color: ${this._colorToHex(e)}"
                    @click=${()=>this._openColorPicker(t)}
                    title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_edit")}"
                  ></div>
                  ${this._colors.length>1?H`
                        <button
                          class="color-remove"
                          @click=${()=>this._removeColor(t)}
                          title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_remove")}"
                        >
                          <ha-icon icon="mdi:close"></ha-icon>
                        </button>
                      `:H`<div class="color-remove-spacer"></div>`}
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

        ${null!==this._editingColorIndex&&null!==this._editingColor?H`
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
                  <color-history-swatches
                    .colorHistory=${this.colorHistory}
                    .translations=${this.translations}
                    @color-selected=${this._handleHistoryColorSelected}
                  ></color-history-swatches>
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

        ${this.hasSelectedEntities?"":H`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_effects")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?H`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  ${this._localize("editors.stop_button")}
                </ha-button>
              `:H`
                <ha-button
                  @click=${this._preview}
                  .disabled=${!this._effect||this._previewing||!this.hasSelectedEntities||!this.isCompatible}
                  title=${this.hasSelectedEntities?this.isCompatible?"":this._localize("editors.tooltip_light_not_compatible"):this._localize("editors.tooltip_select_lights_first")}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  ${this._localize("editors.preview_button")}
                </ha-button>
              `}
          <ha-button @click=${this._save} .disabled=${!this._name.trim()||!this._effect||this._saving}>
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode?this._localize("editors.update_button"):this._localize("editors.save_button")}
          </ha-button>
        </div>
      </div>
    `}};_t.styles=[Ee,r`
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
  `],e([pe({attribute:!1})],_t.prototype,"hass",void 0),e([pe({type:Object})],_t.prototype,"preset",void 0),e([pe({type:Object})],_t.prototype,"translations",void 0),e([pe({type:Boolean})],_t.prototype,"editMode",void 0),e([pe({type:Boolean})],_t.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],_t.prototype,"isCompatible",void 0),e([pe({type:Boolean})],_t.prototype,"previewActive",void 0),e([pe({type:Number})],_t.prototype,"stripSegmentCount",void 0),e([pe({type:Object})],_t.prototype,"deviceContext",void 0),e([pe({type:Array})],_t.prototype,"colorHistory",void 0),e([pe({type:Object})],_t.prototype,"draft",void 0),e([_e()],_t.prototype,"_name",void 0),e([_e()],_t.prototype,"_icon",void 0),e([_e()],_t.prototype,"_deviceType",void 0),e([_e()],_t.prototype,"_effect",void 0),e([_e()],_t.prototype,"_speed",void 0),e([_e()],_t.prototype,"_brightness",void 0),e([_e()],_t.prototype,"_colors",void 0),e([_e()],_t.prototype,"_segments",void 0),e([_e()],_t.prototype,"_saving",void 0),e([_e()],_t.prototype,"_previewing",void 0),e([_e()],_t.prototype,"_editingColorIndex",void 0),e([_e()],_t.prototype,"_editingColor",void 0),e([_e()],_t.prototype,"_hasUserInteraction",void 0),_t=e([ce("effect-editor")],_t);const gt={t1:20,t1m:26,t1_strip:50},ut={t1:"T1 (20 segments)",t1m:"T1M (26 segments)",t1_strip:"T1 Strip (up to 50 segments)"},mt=[{x:.68,y:.31},{x:.17,y:.7},{x:.15,y:.06},{x:.42,y:.51},{x:.38,y:.16},{x:.22,y:.33}];let vt=class extends ae{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.stripSegmentCount=10,this.colorHistory=[],this._name="",this._icon="",this._deviceType="t1m",this._segments=new Map,this._selectedSegments=new Set,this._saving=!1,this._previewing=!1,this._colorPalette=[...mt],this._gradientColors=[{x:.68,y:.31},{x:.15,y:.06}],this._blockColors=[{x:.68,y:.31},{x:.17,y:.7}],this._expandBlocks=!1,this._gradientMirror=!1,this._gradientRepeat=1,this._gradientReverse=!1,this._gradientInterpolation="shortest",this._gradientWave=!1,this._gradientWaveCycles=1,this._turnOffUnspecified=!0,this._hasUserInteraction=!1}updated(e){if(super.updated(e),e.has("draft")&&this.draft?this._restoreDraft(this.draft):e.has("preset")&&(this.preset?(this._hasUserInteraction=!0,this._loadPreset(this.preset)):this._hasUserInteraction=!1),e.has("deviceContext")&&!this._hasUserInteraction&&this.deviceContext?.deviceType&&(this._deviceType=this.deviceContext.deviceType),e.has("stripSegmentCount")&&"t1_strip"===this._deviceType){const e=this._getMaxSegments();let t=!1;const i=new Map;for(const[s,o]of this._segments)s<e?i.set(s,o):t=!0;if(t){this._segments=i;const t=new Set;for(const i of this._selectedSegments)i<e&&t.add(i);this._selectedSegments=t}}}_getMaxSegments(){return"t1_strip"===this._deviceType?this.stripSegmentCount:gt[this._deviceType]||26}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._deviceType=e.device_type||"t1m",this._segments=new Map,this._selectedSegments=new Set;for(const t of e.segments){const e="string"==typeof t.segment?parseInt(t.segment,10):t.segment,i=t.color;"x"in i&&"y"in i?this._segments.set(e-1,{x:i.x,y:i.y}):"r"in i&&"g"in i&&"b"in i&&this._segments.set(e-1,De(i.r,i.g,i.b))}}getDraftState(){return{name:this._name,icon:this._icon,deviceType:this._deviceType,segments:Array.from(this._segments.entries()),colorPalette:[...this._colorPalette],gradientColors:[...this._gradientColors],blockColors:[...this._blockColors],expandBlocks:this._expandBlocks,gradientMirror:this._gradientMirror,gradientRepeat:this._gradientRepeat,gradientReverse:this._gradientReverse,gradientInterpolation:this._gradientInterpolation,gradientWave:this._gradientWave,gradientWaveCycles:this._gradientWaveCycles,turnOffUnspecified:this._turnOffUnspecified}}resetToDefaults(){this._name="",this._icon="",this._deviceType="t1m",this._segments=new Map,this._selectedSegments=new Set,this._colorPalette=[...mt],this._gradientColors=[{x:.68,y:.31},{x:.15,y:.06}],this._blockColors=[{x:.68,y:.31},{x:.17,y:.7}],this._expandBlocks=!1,this._gradientMirror=!1,this._gradientRepeat=1,this._gradientReverse=!1,this._gradientInterpolation="shortest",this._gradientWave=!1,this._gradientWaveCycles=1,this._turnOffUnspecified=!0,this._hasUserInteraction=!1}_restoreDraft(e){this._name=e.name,this._icon=e.icon,this._deviceType=e.deviceType,this._segments=new Map(e.segments),this._colorPalette=[...e.colorPalette],this._gradientColors=[...e.gradientColors],this._blockColors=[...e.blockColors],this._expandBlocks=e.expandBlocks,this._gradientMirror=e.gradientMirror,this._gradientRepeat=e.gradientRepeat,this._gradientReverse=e.gradientReverse,this._gradientInterpolation=e.gradientInterpolation,this._gradientWave=e.gradientWave,this._gradientWaveCycles=e.gradientWaveCycles,this._turnOffUnspecified=e.turnOffUnspecified,this._hasUserInteraction=!0}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleDeviceTypeChange(e){this._deviceType=e.detail.value||"t1m",this._hasUserInteraction=!0;const t=this._getMaxSegments(),i=new Map;for(const[e,s]of this._segments)e<t&&i.set(e,s);this._segments=i,this._selectedSegments=new Set}_handleColorValueChange(e){const{value:t}=e.detail;t instanceof Map&&(this._segments=t)}_handleGradientColorsChange(e){const{colors:t}=e.detail;Array.isArray(t)&&(this._gradientColors=t)}_handleBlockColorsChange(e){const{colors:t}=e.detail;Array.isArray(t)&&(this._blockColors=t)}_handleColorPaletteChange(e){const{colors:t}=e.detail;Array.isArray(t)&&(this._colorPalette=t)}_handleTurnOffUnspecifiedChange(e){this._turnOffUnspecified=e.detail.value}_getCurrentPattern(){return this._segments}_getPresetData(){const e=this._getCurrentPattern(),t=[];for(const[i,s]of e){const e=Me(s.x,s.y,255);t.push({segment:i+1,color:{r:e.r,g:e.g,b:e.b}})}return{name:this._name,icon:this._icon||void 0,device_type:this._deviceType,segments:t,turn_off_unspecified:this._turnOffUnspecified}}async _preview(){if(!this.hass||this._previewing)return;if(0!==this._getCurrentPattern().size){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}async _save(){if(!this._name.trim())return;if(0!==this._getCurrentPattern().size){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_canPreview(){return this._getCurrentPattern().size>0}_canSave(){if(!this._name.trim())return!1;return this._getCurrentPattern().size>0}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){const e=Object.entries(ut).map(([e,t])=>({value:e,label:"t1_strip"===e?`T1 Strip (${this.stripSegmentCount} segments)`:t}));return H`
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
            ${this._icon?"":H`<span class="form-hint">${this._localize("editors.icon_auto_hint")}</span>`}
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
            .colorHistory=${this.colorHistory}
            .zones=${this.deviceContext?.zones||[]}
            .turnOffUnspecified=${this._turnOffUnspecified}
            @color-value-changed=${this._handleColorValueChange}
            @color-palette-changed=${this._handleColorPaletteChange}
            @gradient-colors-changed=${this._handleGradientColorsChange}
            @block-colors-changed=${this._handleBlockColorsChange}
            @turn-off-unspecified-changed=${this._handleTurnOffUnspecifiedChange}
          ></segment-selector>
        </div>

        ${this.hasSelectedEntities?"":H`
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
            title=${this.hasSelectedEntities?this.isCompatible?"":this._localize("editors.tooltip_light_not_compatible"):this._localize("editors.tooltip_select_lights_first")}
          >
            <ha-icon icon="mdi:play"></ha-icon>
            ${this._localize("editors.preview_button")}
          </ha-button>
          <ha-button
            @click=${this._save}
            .disabled=${!this._canSave()||this._saving}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode?this._localize("editors.update_button"):this._localize("editors.save_button")}
          </ha-button>
        </div>
      </div>
    `}};vt.styles=[Ee,r`
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
  `],e([pe({attribute:!1})],vt.prototype,"hass",void 0),e([pe({type:Object})],vt.prototype,"preset",void 0),e([pe({type:Object})],vt.prototype,"translations",void 0),e([pe({type:Boolean})],vt.prototype,"editMode",void 0),e([pe({type:Boolean})],vt.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],vt.prototype,"isCompatible",void 0),e([pe({type:Number})],vt.prototype,"stripSegmentCount",void 0),e([pe({type:Object})],vt.prototype,"deviceContext",void 0),e([pe({type:Array})],vt.prototype,"colorHistory",void 0),e([pe({type:Object})],vt.prototype,"draft",void 0),e([_e()],vt.prototype,"_name",void 0),e([_e()],vt.prototype,"_icon",void 0),e([_e()],vt.prototype,"_deviceType",void 0),e([_e()],vt.prototype,"_segments",void 0),e([_e()],vt.prototype,"_selectedSegments",void 0),e([_e()],vt.prototype,"_saving",void 0),e([_e()],vt.prototype,"_previewing",void 0),e([_e()],vt.prototype,"_colorPalette",void 0),e([_e()],vt.prototype,"_gradientColors",void 0),e([_e()],vt.prototype,"_blockColors",void 0),e([_e()],vt.prototype,"_expandBlocks",void 0),e([_e()],vt.prototype,"_gradientMirror",void 0),e([_e()],vt.prototype,"_gradientRepeat",void 0),e([_e()],vt.prototype,"_gradientReverse",void 0),e([_e()],vt.prototype,"_gradientInterpolation",void 0),e([_e()],vt.prototype,"_gradientWave",void 0),e([_e()],vt.prototype,"_gradientWaveCycles",void 0),e([_e()],vt.prototype,"_turnOffUnspecified",void 0),e([_e()],vt.prototype,"_hasUserInteraction",void 0),vt=e([ce("pattern-editor")],vt);const ft={draggingIndex:null,dropTargetIndex:null},bt=r`
  .drag-handle {
    cursor: grab;
    display: flex;
    align-items: center;
    color: var(--secondary-text-color);
    padding: 4px;
    margin-right: 4px;
    touch-action: none;
    transition: color 0.2s ease;
    -webkit-user-select: none;
    user-select: none;
  }

  .drag-handle:hover {
    color: var(--primary-color);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .drag-handle ha-icon {
    --mdc-icon-size: 20px;
  }

  .step-item.dragging {
    opacity: 0.4;
  }

  .drop-indicator {
    height: 3px;
    background: var(--primary-color);
    border-radius: 2px;
    margin: -7px 0 -8px 0;
    pointer-events: none;
    z-index: 1;
    position: relative;
  }

  .step-list.is-dragging {
    user-select: none;
    -webkit-user-select: none;
  }
`;function yt(t){class i extends t{constructor(){super(...arguments),this._dragState={...ft},this._boundMove=this._onPointerMove.bind(this),this._boundEnd=this._onPointerEnd.bind(this),this._scrollContainer=null,this._autoScrollRaf=0,this._lastClientY=0}disconnectedCallback(){super.disconnectedCallback(),this._cleanupDrag()}_onDragHandlePointerDown(e,t){if(this._steps.length<=1)return;e.preventDefault(),e.stopPropagation();const i=this.shadowRoot?.querySelector(".step-list"),s=this.shadowRoot?.querySelectorAll(".step-item");i&&s&&(this._scrollContainer=this._findScrollContainer(i),this._dragState={draggingIndex:t,dropTargetIndex:null},s[t]?.classList.add("dragging"),i.classList.add("is-dragging"),this._lastClientY=e.clientY,window.addEventListener("pointermove",this._boundMove),window.addEventListener("pointerup",this._boundEnd),window.addEventListener("pointercancel",this._boundEnd),this.requestUpdate())}_onPointerMove(e){null!==this._dragState.draggingIndex&&(e.preventDefault(),this._lastClientY=e.clientY,this._updateDropTarget(e.clientY),this._startAutoScroll())}_onPointerEnd(e){if(null===this._dragState.draggingIndex)return;e.preventDefault();const{draggingIndex:t,dropTargetIndex:i}=this._dragState;null!==i&&i!==t&&i!==t+1&&this._reorderStep(t,i),this._cleanupDrag()}_cleanupDrag(){window.removeEventListener("pointermove",this._boundMove),window.removeEventListener("pointerup",this._boundEnd),window.removeEventListener("pointercancel",this._boundEnd),this._autoScrollRaf&&(cancelAnimationFrame(this._autoScrollRaf),this._autoScrollRaf=0);const e=this.shadowRoot?.querySelector(".step-list");e?.classList.remove("is-dragging"),this.shadowRoot?.querySelectorAll(".step-item.dragging").forEach(e=>e.classList.remove("dragging")),this._scrollContainer=null,this._dragState={...ft},this.requestUpdate()}_updateDropTarget(e){const t=this._calcDropTarget(e);t!==this._dragState.dropTargetIndex&&(this._dragState={...this._dragState,dropTargetIndex:t})}_calcDropTarget(e){if(null===this._dragState.draggingIndex)return null;const t=this.shadowRoot?.querySelectorAll(".step-item");if(!t||0===t.length)return null;for(let i=0;i<t.length;i++){const s=t[i].getBoundingClientRect();if(e<s.top+s.height/2)return i}return t.length}_findScrollContainer(e){let t=e;for(;t;){if(!t.parentElement&&t.getRootNode()instanceof ShadowRoot){t=t.getRootNode().host;continue}if(t=t.parentElement,!t)break;const e=getComputedStyle(t).overflowY;if(("auto"===e||"scroll"===e)&&t.scrollHeight>t.clientHeight)return t}return null}_startAutoScroll(){if(this._autoScrollRaf)return;const e=()=>{if(null===this._dragState.draggingIndex)return void(this._autoScrollRaf=0);const t=this._scrollContainer;if(t){{const e=t.getBoundingClientRect(),i=this._lastClientY;if(i<e.top+40&&t.scrollTop>0)t.scrollTop-=8,this._updateDropTarget(this._lastClientY);else{if(!(i>e.bottom-40&&t.scrollTop<t.scrollHeight-t.clientHeight))return void(this._autoScrollRaf=0);t.scrollTop+=8,this._updateDropTarget(this._lastClientY)}}this._autoScrollRaf=requestAnimationFrame(e)}else this._autoScrollRaf=0};this._autoScrollRaf=requestAnimationFrame(e)}_reorderStep(e,t){const i=[...this._steps],[s]=i.splice(e,1),o=e<t?t-1:t;i.splice(o,0,s),this._steps=i}_renderDragHandle(e){return H`
        <div
          class="drag-handle"
          @pointerdown=${t=>this._onDragHandlePointerDown(t,e)}
        >
          <ha-icon icon="mdi:drag"></ha-icon>
        </div>
      `}_renderDropIndicator(e){const{draggingIndex:t,dropTargetIndex:i}=this._dragState;return null===t||i!==e?"":H`<div class="drop-indicator"></div>`}}return e([_e()],i.prototype,"_dragState",void 0),i}let xt=class extends(yt(ae)){constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.selectedEntities=[],this.previewActive=!1,this._name="",this._icon="",this._steps=[],this._loopMode="once",this._loopCount=3,this._endBehavior="maintain",this._saving=!1,this._previewing=!1}get _loopModeOptions(){return[{value:"once",label:this._localize("options.loop_mode_once")},{value:"loop",label:this._localize("options.loop_mode_count")},{value:"continuous",label:this._localize("options.loop_mode_continuous")}]}get _endBehaviorOptions(){return[{value:"maintain",label:this._localize("options.end_behavior_maintain")},{value:"turn_off",label:this._localize("options.end_behavior_turn_off")}]}get _deviceTypeLabel(){if(!this.deviceContext?.deviceType)return"";return{t2_bulb:"T2 Bulb",t2_cct:"T2 CCT",t1m:"T1M",t1_strip:"T1 Strip",t1:"T1"}[this.deviceContext.deviceType]||this.deviceContext.deviceType}connectedCallback(){super.connectedCallback(),0!==this._steps.length||this.preset||this._addDefaultStep()}updated(e){super.updated(e),e.has("draft")&&this.draft?this._restoreDraft(this.draft):e.has("preset")&&this.preset&&this._loadPreset(this.preset)}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._loopMode=e.loop_mode,this._loopCount=e.loop_count||3,this._endBehavior=e.end_behavior,this._steps=e.steps.map((e,t)=>({...e,id:`step-${t}-${Date.now()}`}))}getDraftState(){return{name:this._name,icon:this._icon,steps:this._steps.map(e=>({color_temp:e.color_temp,brightness:e.brightness,transition:e.transition,hold:e.hold})),loopMode:this._loopMode,loopCount:this._loopCount,endBehavior:this._endBehavior}}resetToDefaults(){this._name="",this._icon="",this._loopMode="once",this._loopCount=3,this._endBehavior="maintain",this._addDefaultStep()}_restoreDraft(e){this._name=e.name,this._icon=e.icon,this._loopMode=e.loopMode,this._loopCount=e.loopCount,this._endBehavior=e.endBehavior,this._steps=e.steps.map((e,t)=>({...e,id:`step-${t}-${Date.now()}`}))}_addDefaultStep(){this._steps=[{id:`step-0-${Date.now()}`,color_temp:4e3,brightness:50,transition:15,hold:60}]}_generateStepId(){return`step-${this._steps.length}-${Date.now()}`}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleLoopModeChange(e){this._loopMode=e.detail.value||"once"}_handleLoopCountChange(e){this._loopCount=e.detail.value??3}_handleEndBehaviorChange(e){this._endBehavior=e.detail.value||"maintain"}_hasIncompatibleEndpoints(){if(!this.hass||!this.selectedEntities.length)return!1;for(const e of this.selectedEntities){const t=this.hass.states[e];if(!t)continue;const i=t.attributes.supported_color_modes;if(!i||!i.includes("color_temp"))return!0}return!1}_handleStepFieldChange(e,t,i){this._steps=this._steps.map(s=>s.id===e?{...s,[t]:i.detail.value}:s)}_handleStepColorTempChange(e,t){const i=t.detail.value,s=100*Math.round(1e6/i/100);this._steps=this._steps.map(t=>t.id===e?{...t,color_temp:s}:t)}_addStep(){if(this._steps.length>=20)return;const e={id:this._generateStepId(),color_temp:4e3,brightness:50,transition:15,hold:60};this._steps=[...this._steps,e]}_removeStep(e){this._steps.length<=1||(this._steps=this._steps.filter(t=>t.id!==e))}_moveStepUp(e){if(e<=0)return;const t=[...this._steps],i=t[e-1];t[e-1]=t[e],t[e]=i,this._steps=t}_moveStepDown(e){if(e>=this._steps.length-1)return;const t=[...this._steps],i=t[e];t[e]=t[e+1],t[e+1]=i,this._steps=t}_duplicateStep(e){if(this._steps.length>=20)return;const t={...e,id:this._generateStepId()},i=this._steps.findIndex(t=>t.id===e.id),s=[...this._steps];s.splice(i+1,0,t),this._steps=s}_getPresetData(){const e=this._steps.map(({id:e,...t})=>t),t={name:this._name,icon:this._icon||void 0,steps:e,loop_mode:this._loopMode,end_behavior:this._endBehavior};return"loop"===this._loopMode&&(t.loop_count=this._loopCount),t}async _preview(){if(this.hass&&!this._previewing){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&0!==this._steps.length){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_renderStep(e,t){return H`
      <div class="step-item">
        <div class="step-header">
          ${this._renderDragHandle(t)}
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
    `}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){return H`
      <div class="editor-content">
        ${this.deviceContext?.deviceType?H`
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
            ${this._icon?"":H`<span class="form-hint">${this._localize("editors.icon_auto_hint")}</span>`}
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

        ${"loop"===this._loopMode?H`
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
            ${0===this._steps.length?H`
                  <div class="empty-steps">
                    ${this._localize("editors.no_steps_message")}
                  </div>
                `:this._steps.map((e,t)=>H`
                  ${this._renderDropIndicator(t)}
                  ${this._renderStep(e,t)}
                `)}
            ${this._renderDropIndicator(this._steps.length)}

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

        ${this._hasIncompatibleEndpoints()?H`
              <div class="error-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>${this._localize("editors.incompatible_cct_endpoints")}</span>
              </div>
            `:""}

        ${this.hasSelectedEntities?"":H`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_sequences")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?H`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  ${this._localize("editors.stop_button")}
                </ha-button>
              `:H`
                <ha-button
                  @click=${this._preview}
                  .disabled=${this._previewing||0===this._steps.length||!this.hasSelectedEntities||!this.isCompatible||this._hasIncompatibleEndpoints()}
                  title=${this.hasSelectedEntities?this.isCompatible?this._hasIncompatibleEndpoints()?this._localize("editors.tooltip_light_no_cct"):"":this._localize("editors.tooltip_light_not_compatible"):this._localize("editors.tooltip_select_lights_first")}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  ${this._localize("editors.preview_button")}
                </ha-button>
              `}
          <ha-button
            @click=${this._save}
            .disabled=${!this._name.trim()||0===this._steps.length||this._saving}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode?this._localize("editors.update_button"):this._localize("editors.save_button")}
          </ha-button>
        </div>
      </div>
    `}};xt.styles=[bt,r`
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
      flex: 1;
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
  `],e([pe({attribute:!1})],xt.prototype,"hass",void 0),e([pe({type:Object})],xt.prototype,"preset",void 0),e([pe({type:Object})],xt.prototype,"translations",void 0),e([pe({type:Boolean})],xt.prototype,"editMode",void 0),e([pe({type:Boolean})],xt.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],xt.prototype,"isCompatible",void 0),e([pe({type:Array})],xt.prototype,"selectedEntities",void 0),e([pe({type:Boolean})],xt.prototype,"previewActive",void 0),e([pe({type:Object})],xt.prototype,"deviceContext",void 0),e([pe({type:Object})],xt.prototype,"draft",void 0),e([_e()],xt.prototype,"_name",void 0),e([_e()],xt.prototype,"_icon",void 0),e([_e()],xt.prototype,"_steps",void 0),e([_e()],xt.prototype,"_loopMode",void 0),e([_e()],xt.prototype,"_loopCount",void 0),e([_e()],xt.prototype,"_endBehavior",void 0),e([_e()],xt.prototype,"_saving",void 0),e([_e()],xt.prototype,"_previewing",void 0),xt=e([ce("cct-sequence-editor")],xt);const $t={t1:"T1 (20 segments)",t1m:"T1M (26 segments)",t1_strip:"T1 Strip (up to 50 segments)"},wt=[{x:.68,y:.31},{x:.17,y:.7},{x:.15,y:.06},{x:.42,y:.51},{x:.38,y:.16},{x:.22,y:.33}],Ct=[{x:.68,y:.31},{x:.15,y:.06}],St=[{x:.68,y:.31},{x:.17,y:.7}];let zt=class extends(yt(ae)){constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.previewActive=!1,this.stripSegmentCount=10,this.colorHistory=[],this._name="",this._icon="",this._deviceType="t1m",this._steps=[],this._loopMode="once",this._loopCount=3,this._endBehavior="maintain",this._clearSegments=!1,this._skipFirstInLoop=!1,this._saving=!1,this._previewing=!1,this._hasUserInteraction=!1}get _loopModeOptions(){return[{value:"once",label:this._localize("options.loop_mode_once")},{value:"count",label:this._localize("options.loop_mode_count")},{value:"continuous",label:this._localize("options.loop_mode_continuous")}]}get _endBehaviorOptions(){return[{value:"maintain",label:this._localize("options.end_behavior_maintain")},{value:"turn_off",label:this._localize("options.end_behavior_turn_off")}]}get _activationPatternOptions(){return[{value:"all",label:this._localize("options.activation_all")},{value:"sequential_forward",label:this._localize("options.activation_sequential_forward")},{value:"sequential_reverse",label:this._localize("options.activation_sequential_reverse")},{value:"random",label:this._localize("options.activation_random")},{value:"ping_pong",label:this._localize("options.activation_ping_pong")},{value:"center_out",label:this._localize("options.activation_center_out")},{value:"edges_in",label:this._localize("options.activation_edges_in")},{value:"paired",label:this._localize("options.activation_paired")}]}connectedCallback(){super.connectedCallback(),0!==this._steps.length||this.preset||this._addDefaultStep()}updated(e){super.updated(e),e.has("draft")&&this.draft?this._restoreDraft(this.draft):e.has("preset")&&(this.preset?(this._hasUserInteraction=!0,this._loadPreset(this.preset)):this._hasUserInteraction=!1),e.has("deviceContext")&&!this._hasUserInteraction&&this.deviceContext?.deviceType&&(this._deviceType=this.deviceContext.deviceType)}_getCurrentSegmentCount(){switch(this._deviceType){case"t1":return 20;case"t1m":default:return 26;case"t1_strip":return this.stripSegmentCount}}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._deviceType=e.device_type||"t1m",this._loopMode=e.loop_mode,this._loopCount=e.loop_count||3,this._endBehavior=e.end_behavior,this._clearSegments=e.clear_segments||!1,this._skipFirstInLoop=e.skip_first_in_loop||!1,this._steps=e.steps.map((e,t)=>{const i=e.colors.map(e=>{const t={r:e[0]??0,g:e[1]??0,b:e[2]??0};return De(t.r,t.g,t.b)});let s="individual";"gradient"===e.mode?s="gradient":"blocks_expand"===e.mode||"blocks_repeat"===e.mode?s="blocks":"individual"===e.mode&&(s="individual");const o=new Map;if(e.segment_colors&&Array.isArray(e.segment_colors))for(const t of e.segment_colors){const e="number"==typeof t.segment?t.segment:parseInt(t.segment,10),i=t.color;if("r"in i&&"g"in i&&"b"in i){if(0===i.r&&0===i.g&&0===i.b)continue;o.set(e-1,De(i.r,i.g,i.b))}}return{...e,id:`step-${t}-${Date.now()}`,coloredSegments:o,colorPalette:[...wt],gradientColors:i.length>=2?i:[...Ct],blockColors:i.length>=1?i:[...St],expandBlocks:"blocks_expand"===e.mode,patternMode:s,gradientMirror:!1,gradientRepeat:1,gradientReverse:!1,gradientInterpolation:"shortest",gradientWave:!1,gradientWaveCycles:1,turnOffUnspecified:!0}})}getDraftState(){return{name:this._name,icon:this._icon,deviceType:this._deviceType,steps:this._steps.map(e=>({id:e.id,duration:e.duration,hold:e.hold,activation_pattern:e.activation_pattern,transition:e.transition,coloredSegments:Array.from(e.coloredSegments.entries()),colorPalette:[...e.colorPalette],gradientColors:[...e.gradientColors],blockColors:[...e.blockColors],expandBlocks:e.expandBlocks,patternMode:e.patternMode,gradientMirror:e.gradientMirror,gradientRepeat:e.gradientRepeat,gradientReverse:e.gradientReverse,gradientInterpolation:e.gradientInterpolation,gradientWave:e.gradientWave,gradientWaveCycles:e.gradientWaveCycles,turnOffUnspecified:e.turnOffUnspecified})),loopMode:this._loopMode,loopCount:this._loopCount,endBehavior:this._endBehavior,clearSegments:this._clearSegments,skipFirstInLoop:this._skipFirstInLoop}}resetToDefaults(){this._name="",this._icon="",this._deviceType="t1m",this._loopMode="once",this._loopCount=3,this._endBehavior="maintain",this._clearSegments=!1,this._skipFirstInLoop=!1,this._hasUserInteraction=!1,this._addDefaultStep()}_restoreDraft(e){this._name=e.name,this._icon=e.icon,this._deviceType=e.deviceType,this._loopMode=e.loopMode,this._loopCount=e.loopCount,this._endBehavior=e.endBehavior,this._clearSegments=e.clearSegments,this._skipFirstInLoop=e.skipFirstInLoop,this._steps=e.steps.map(e=>({segments:"all",colors:[[255,0,0]],mode:"gradient"===e.patternMode?"gradient":e.expandBlocks?"blocks_expand":"blocks_repeat",duration:e.duration,hold:e.hold,activation_pattern:e.activation_pattern,transition:e.transition,id:e.id,coloredSegments:new Map(e.coloredSegments),colorPalette:[...e.colorPalette],gradientColors:[...e.gradientColors],blockColors:[...e.blockColors],expandBlocks:e.expandBlocks,patternMode:e.patternMode,gradientMirror:e.gradientMirror,gradientRepeat:e.gradientRepeat,gradientReverse:e.gradientReverse,gradientInterpolation:e.gradientInterpolation,gradientWave:e.gradientWave,gradientWaveCycles:e.gradientWaveCycles,turnOffUnspecified:e.turnOffUnspecified})),this._hasUserInteraction=!0}_addDefaultStep(){this._steps=[{id:`step-0-${Date.now()}`,segments:"all",colors:[[255,0,0]],mode:"blocks_expand",duration:15,hold:60,activation_pattern:"all",coloredSegments:new Map,colorPalette:[...wt],gradientColors:[...Ct],blockColors:[...St],expandBlocks:!1,patternMode:"individual",gradientMirror:!1,gradientRepeat:1,gradientReverse:!1,gradientInterpolation:"shortest",gradientWave:!1,gradientWaveCycles:1,turnOffUnspecified:!0}]}_generateStepId(){return`step-${this._steps.length}-${Date.now()}`}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleDeviceTypeChange(e){this._deviceType=e.detail.value||"t1m",this._hasUserInteraction=!0}_handleLoopModeChange(e){this._loopMode=e.detail.value||"once"}_handleLoopCountChange(e){this._loopCount=e.detail.value??3}_handleEndBehaviorChange(e){this._endBehavior=e.detail.value||"maintain"}_handleClearSegmentsChange(e){this._clearSegments=e.target.checked}_handleSkipFirstInLoopChange(e){this._skipFirstInLoop=e.target.checked}_hasInvalidGradientSteps(){return this._steps.some(e=>"gradient"===e.patternMode&&e.gradientColors.length<2)}_handleStepFieldChange(e,t,i){this._steps=this._steps.map(s=>s.id===e?{...s,[t]:i.detail.value}:s)}_handleStepColorValueChange(e,t){const{value:i}=t.detail;this._steps=this._steps.map(t=>{if(t.id!==e)return t;if(i instanceof Map){const e=Array.from(i.keys()).sort((e,t)=>e-t),s=e.length>0?e.map(e=>e+1).join(","):"all";return{...t,coloredSegments:i,segments:s}}return t})}_handleStepGradientColorsChange(e,t){const{colors:i}=t.detail;Array.isArray(i)&&(this._steps=this._steps.map(t=>t.id===e?{...t,gradientColors:i}:t))}_handleStepBlockColorsChange(e,t){const{colors:i}=t.detail;Array.isArray(i)&&(this._steps=this._steps.map(t=>t.id===e?{...t,blockColors:i}:t))}_handleStepColorPaletteChange(e,t){const{colors:i}=t.detail;Array.isArray(i)&&(this._steps=this._steps.map(t=>t.id===e?{...t,colorPalette:i}:t))}_handleStepTurnOffUnspecifiedChange(e,t){this._steps=this._steps.map(i=>i.id===e?{...i,turnOffUnspecified:t.detail.value}:i)}_addStep(){if(this._steps.length>=20)return;const e=this._steps[this._steps.length-1],t={id:this._generateStepId(),segments:e?.segments||"all",colors:e?.colors?.map(e=>Array.isArray(e)?[...e]:e)||[[255,0,0]],mode:e?.mode||"blocks_expand",duration:15,hold:60,activation_pattern:"all",coloredSegments:e?new Map(e.coloredSegments):new Map,colorPalette:e?e.colorPalette.map(e=>({...e})):[...wt],gradientColors:e?e.gradientColors.map(e=>({...e})):[...Ct],blockColors:e?e.blockColors.map(e=>({...e})):[...St],expandBlocks:e?.expandBlocks||!1,patternMode:e?.patternMode||"individual",gradientMirror:e?.gradientMirror||!1,gradientRepeat:e?.gradientRepeat||1,gradientReverse:e?.gradientReverse||!1,gradientInterpolation:e?.gradientInterpolation||"shortest",gradientWave:e?.gradientWave||!1,gradientWaveCycles:e?.gradientWaveCycles||1,turnOffUnspecified:e?.turnOffUnspecified??!0};this._steps=[...this._steps,t]}_removeStep(e){this._steps.length<=1||(this._steps=this._steps.filter(t=>t.id!==e))}_moveStepUp(e){if(e<=0)return;const t=[...this._steps],i=t[e-1];t[e-1]=t[e],t[e]=i,this._steps=t}_moveStepDown(e){if(e>=this._steps.length-1)return;const t=[...this._steps],i=t[e];t[e]=t[e+1],t[e+1]=i,this._steps=t}_duplicateStep(e){if(this._steps.length>=20)return;const t={...e,id:this._generateStepId(),colors:e.colors?.map(e=>Array.isArray(e)?[...e]:e)||[[255,0,0]],coloredSegments:new Map(e.coloredSegments),colorPalette:e.colorPalette.map(e=>({...e})),gradientColors:e.gradientColors.map(e=>({...e})),blockColors:e.blockColors.map(e=>({...e}))},i=this._steps.findIndex(t=>t.id===e.id),s=[...this._steps];s.splice(i+1,0,t),this._steps=s}_getPresetData(){const e=this._getCurrentSegmentCount(),t=this._steps.map(({id:t,coloredSegments:i,colorPalette:s,gradientColors:o,blockColors:n,expandBlocks:r,patternMode:a,gradientMirror:l,gradientRepeat:c,gradientReverse:d,gradientInterpolation:h,gradientWave:p,gradientWaveCycles:_,turnOffUnspecified:g,...u})=>{const m=[],v=new Set;for(const[e,t]of i){const i=Me(t.x,t.y,255);m.push({segment:e+1,color:{r:i.r,g:i.g,b:i.b}}),v.add(e+1)}if(g)for(let t=1;t<=e;t++)v.has(t)||m.push({segment:t,color:{r:0,g:0,b:0}});return{...u,segment_colors:m}}),i={name:this._name,icon:this._icon||void 0,device_type:this._deviceType,steps:t,loop_mode:this._loopMode,end_behavior:this._endBehavior,clear_segments:this._clearSegments,skip_first_in_loop:this._skipFirstInLoop};return"count"===this._loopMode&&(i.loop_count=this._loopCount),i}async _preview(){if(this.hass&&!this._previewing){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&0!==this._steps.length){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_renderStep(e,t){return H`
      <div class="step-item">
        <div class="step-header">
          ${this._renderDragHandle(t)}
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
            .colorHistory=${this.colorHistory}
            .zones=${this.deviceContext?.zones||[]}
            .turnOffUnspecified=${e.turnOffUnspecified}
            @color-value-changed=${t=>this._handleStepColorValueChange(e.id,t)}
            @color-palette-changed=${t=>this._handleStepColorPaletteChange(e.id,t)}
            @gradient-colors-changed=${t=>this._handleStepGradientColorsChange(e.id,t)}
            @block-colors-changed=${t=>this._handleStepBlockColorsChange(e.id,t)}
            @turn-off-unspecified-changed=${t=>this._handleStepTurnOffUnspecifiedChange(e.id,t)}
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
    `}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){const e=Object.entries($t).map(([e,t])=>({value:e,label:t}));return H`
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
            ${this._icon?"":H`<span class="form-hint">${this._localize("editors.icon_auto_hint")}</span>`}
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

        ${"count"===this._loopMode?H`
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
            <span class="toggle-label">${this._localize("editors.clear_segments_label")}</span>
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
            ${0===this._steps.length?H`
                  <div class="empty-steps">
                    ${this._localize("editors.no_steps_message")}
                  </div>
                `:this._steps.map((e,t)=>H`
                  ${this._renderDropIndicator(t)}
                  ${this._renderStep(e,t)}
                `)}
            ${this._renderDropIndicator(this._steps.length)}

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

        ${this._hasInvalidGradientSteps()?H`
              <div class="error-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>${this._localize("editors.gradient_min_colors_error")}</span>
              </div>
            `:""}

        ${this.hasSelectedEntities?"":H`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_sequences")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?H`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  ${this._localize("editors.stop_button")}
                </ha-button>
              `:H`
                <ha-button
                  @click=${this._preview}
                  .disabled=${this._previewing||0===this._steps.length||!this.hasSelectedEntities||!this.isCompatible||this._hasInvalidGradientSteps()}
                  title=${this.hasSelectedEntities?this.isCompatible?this._hasInvalidGradientSteps()?this._localize("editors.tooltip_fix_gradient_errors"):"":this._localize("editors.tooltip_light_not_compatible"):this._localize("editors.tooltip_select_lights_first")}
                >
                  <ha-icon icon="mdi:play"></ha-icon>
                  ${this._localize("editors.preview_button")}
                </ha-button>
              `}
          <ha-button
            @click=${this._save}
            .disabled=${!this._name.trim()||0===this._steps.length||this._saving||this._hasInvalidGradientSteps()}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode?this._localize("editors.update_button"):this._localize("editors.save_button")}
          </ha-button>
        </div>
      </div>
    `}};zt.styles=[Ee,bt,r`
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
      flex: 1;
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
  `],e([pe({attribute:!1})],zt.prototype,"hass",void 0),e([pe({type:Object})],zt.prototype,"preset",void 0),e([pe({type:Object})],zt.prototype,"translations",void 0),e([pe({type:Boolean})],zt.prototype,"editMode",void 0),e([pe({type:Boolean})],zt.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],zt.prototype,"isCompatible",void 0),e([pe({type:Boolean})],zt.prototype,"previewActive",void 0),e([pe({type:Number})],zt.prototype,"stripSegmentCount",void 0),e([pe({type:Object})],zt.prototype,"deviceContext",void 0),e([pe({type:Array})],zt.prototype,"colorHistory",void 0),e([pe({type:Object})],zt.prototype,"draft",void 0),e([_e()],zt.prototype,"_name",void 0),e([_e()],zt.prototype,"_icon",void 0),e([_e()],zt.prototype,"_deviceType",void 0),e([_e()],zt.prototype,"_steps",void 0),e([_e()],zt.prototype,"_loopMode",void 0),e([_e()],zt.prototype,"_loopCount",void 0),e([_e()],zt.prototype,"_endBehavior",void 0),e([_e()],zt.prototype,"_clearSegments",void 0),e([_e()],zt.prototype,"_skipFirstInLoop",void 0),e([_e()],zt.prototype,"_saving",void 0),e([_e()],zt.prototype,"_previewing",void 0),e([_e()],zt.prototype,"_hasUserInteraction",void 0),zt=e([ce("segment-sequence-editor")],zt);let kt=class extends(yt(ae)){constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.selectedEntities=[],this.previewActive=!1,this.colorHistory=[],this._name="",this._icon="",this._steps=[],this._transitionTime=120,this._holdTime=0,this._distributionMode="shuffle_rotate",this._offsetDelay=0,this._randomOrder=!1,this._loopMode="continuous",this._loopCount=3,this._endBehavior="restore",this._saving=!1,this._previewing=!1,this._editingColorIndex=null,this._editingColor=null}get _colors(){return this._steps}set _colors(e){this._steps=e}get _loopModeOptions(){return[{value:"once",label:this._localize("options.loop_mode_once")},{value:"loop",label:this._localize("options.loop_mode_count")},{value:"continuous",label:this._localize("options.loop_mode_continuous")}]}get _endBehaviorOptions(){return[{value:"maintain",label:this._localize("options.end_behavior_maintain")},{value:"restore",label:this._localize("dynamic_scene.end_behavior_restore")||"Restore previous state"}]}get _distributionModeOptions(){return[{value:"shuffle_rotate",label:this._localize("dynamic_scene.distribution_shuffle_rotate")||"Shuffle and rotate"},{value:"synchronized",label:this._localize("dynamic_scene.distribution_synchronized")||"Synchronized"},{value:"random",label:this._localize("dynamic_scene.distribution_random")||"Random"}]}connectedCallback(){super.connectedCallback(),0!==this._colors.length||this.preset||this._addDefaultColors()}updated(e){super.updated(e),e.has("draft")&&this.draft?this._restoreDraft(this.draft):e.has("preset")&&this.preset&&this._loadPreset(this.preset)}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._transitionTime=e.transition_time,this._holdTime=e.hold_time,this._distributionMode=e.distribution_mode,this._offsetDelay=e.offset_delay,this._randomOrder=e.random_order,this._loopMode=e.loop_mode,this._loopCount=e.loop_count||3,this._endBehavior=e.end_behavior,this._colors=e.colors.map((e,t)=>({...e,id:`color-${t}-${Date.now()}`}))}getDraftState(){return{name:this._name,icon:this._icon,colors:this._colors.map(e=>({x:e.x,y:e.y,brightness_pct:e.brightness_pct})),transitionTime:this._transitionTime,holdTime:this._holdTime,distributionMode:this._distributionMode,offsetDelay:this._offsetDelay,randomOrder:this._randomOrder,loopMode:this._loopMode,loopCount:this._loopCount,endBehavior:this._endBehavior}}resetToDefaults(){this._name="",this._icon="",this._transitionTime=120,this._holdTime=0,this._distributionMode="shuffle_rotate",this._offsetDelay=0,this._randomOrder=!1,this._loopMode="continuous",this._loopCount=3,this._endBehavior="restore",this._addDefaultColors()}_restoreDraft(e){this._name=e.name,this._icon=e.icon,this._transitionTime=e.transitionTime,this._holdTime=e.holdTime,this._distributionMode=e.distributionMode,this._offsetDelay=e.offsetDelay,this._randomOrder=e.randomOrder,this._loopMode=e.loopMode,this._loopCount=e.loopCount,this._endBehavior=e.endBehavior,this._colors=e.colors.map((e,t)=>({...e,id:`color-${t}-${Date.now()}`}))}_addDefaultColors(){this._colors=[{id:`color-0-${Date.now()}`,x:.55,y:.41,brightness_pct:100},{id:`color-1-${Date.now()+1}`,x:.15,y:.06,brightness_pct:100}]}_generateColorId(){return`color-${this._colors.length}-${Date.now()}`}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleTransitionTimeChange(e){this._transitionTime=e.detail.value??120}_handleHoldTimeChange(e){this._holdTime=e.detail.value??0}_handleDistributionModeChange(e){this._distributionMode=e.detail.value||"shuffle_rotate"}_handleOffsetDelayChange(e){this._offsetDelay=e.detail.value??0}_handleRandomOrderChange(e){this._randomOrder=e.detail.value??!1}_handleLoopModeChange(e){this._loopMode=e.detail.value||"continuous"}_handleLoopCountChange(e){this._loopCount=e.detail.value??3}_handleEndBehaviorChange(e){this._endBehavior=e.detail.value||"restore"}_handleColorBrightnessChange(e,t){const i=t.detail.value??100;this._colors=this._colors.map(t=>t.id===e?{...t,brightness_pct:i}:t)}_openColorPicker(e){const t=this._colors[e];t&&(this._editingColorIndex=e,this._editingColor={x:t.x,y:t.y})}_handleColorPickerChange(e){this._editingColor=e.detail.color}_confirmColorPicker(){if(null!==this._editingColorIndex&&null!==this._editingColor){const e=at(this.colorHistory,this._editingColor);this.dispatchEvent(new CustomEvent("color-history-changed",{detail:{colorHistory:e},bubbles:!0,composed:!0})),this._colors=this._colors.map((e,t)=>t===this._editingColorIndex?{...e,x:this._editingColor.x,y:this._editingColor.y}:e)}this._closeColorPicker()}_handleHistoryColorSelected(e){const t=e.detail.color;this._editingColor={x:t.x,y:t.y}}_closeColorPicker(){this._editingColorIndex=null,this._editingColor=null}_addColor(){if(this._colors.length>=8)return;const e=this._colors[this._colors.length-1],t=function(e){const t=Ue(e);return Re({h:(t.h+30)%360,s:t.s})}(e?{x:e.x,y:e.y}:{x:.68,y:.31});this._colors=[...this._colors,{id:this._generateColorId(),x:t.x,y:t.y,brightness_pct:e?.brightness_pct??100}]}_removeColor(e){this._colors.length<=1||(this._colors=this._colors.filter(t=>t.id!==e))}_getPresetData(){const e={name:this._name,icon:this._icon||void 0,colors:this._colors.map(e=>({x:e.x,y:e.y,brightness_pct:e.brightness_pct})),transition_time:this._transitionTime,hold_time:this._holdTime,distribution_mode:this._distributionMode,offset_delay:this._offsetDelay,random_order:this._randomOrder,loop_mode:this._loopMode,end_behavior:this._endBehavior};return"loop"===this._loopMode&&(e.loop_count=this._loopCount),e}async _preview(){if(this.hass&&!this._previewing&&0!==this._colors.length){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&0!==this._colors.length){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_formatTime(e){if(e<60)return`${e}s`;if(e<3600){const t=Math.floor(e/60),i=e%60;return i>0?`${t}m ${i}s`:`${t}m`}{const t=Math.floor(e/3600),i=Math.floor(e%3600/60);return i>0?`${t}h ${i}m`:`${t}h`}}_renderColorSlot(e,t){const i=Ie({x:e.x,y:e.y},255);return H`
      <div class="color-slot step-item">
        ${this._renderDragHandle(t)}
        <span class="color-slot-number">${t+1}</span>
        <div
          class="color-preview"
          style="background-color: ${i}"
          @click=${()=>this._openColorPicker(t)}
          title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_edit")}"
        ></div>
        <div class="brightness-control">
          <ha-selector
            .hass=${this.hass}
            .selector=${{number:{min:1,max:100,mode:"slider",unit_of_measurement:"%"}}}
            .value=${e.brightness_pct}
            @value-changed=${t=>this._handleColorBrightnessChange(e.id,t)}
          ></ha-selector>
        </div>
        <div class="color-slot-actions">
          ${this._colors.length>1?H`
            <ha-icon-button
              @click=${()=>this._removeColor(e.id)}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_remove")}"
            >
              <ha-icon icon="mdi:close"></ha-icon>
            </ha-icon-button>
          `:""}
        </div>
      </div>
    `}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){return H`
      <div class="editor-content">
        <!-- Header: Name and Icon -->
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
            ${this._icon?"":H`<span class="form-hint">${this._localize("editors.icon_auto_hint")}</span>`}
          </div>
        </div>

        <!-- Colors Section (1-8 reorderable) -->
        <div class="form-section">
          <span class="form-label">${this._localize("editors.colors_brightness_label")||"Colors and brightness (1-8)"}</span>
          <div class="color-slots-container step-list">
            ${this._colors.map((e,t)=>H`
              ${this._renderDropIndicator(t)}
              ${this._renderColorSlot(e,t)}
            `)}
            ${this._renderDropIndicator(this._colors.length)}

            <button
              class="add-color-btn ${this._colors.length>=8?"disabled":""}"
              @click=${this._addColor}
              ?disabled=${this._colors.length>=8}
            >
              <ha-icon icon="mdi:plus"></ha-icon>
              ${this._localize("dynamic_scene.add_color_button")||"Add color"}
            </button>
          </div>
        </div>

        <!-- Timing Section -->
        <div class="form-section">
          <span class="form-label">${this._localize("dynamic_scene.timing_label")||"Timing"}</span>
          <div class="timing-section">
            <div class="timing-field">
              <div class="timing-label">
                <span class="form-label">${this._localize("editors.transition_time_label")}</span>
                <span class="timing-value">${this._formatTime(this._transitionTime)}</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:30,max:3600,step:5,mode:"slider",unit_of_measurement:"s"}}}
                .value=${this._transitionTime}
                @value-changed=${this._handleTransitionTimeChange}
              ></ha-selector>
            </div>
            <div class="timing-field">
              <div class="timing-label">
                <span class="form-label">${this._localize("editors.hold_time_label")}</span>
                <span class="timing-value">${this._formatTime(this._holdTime)}</span>
              </div>
              <ha-selector
                .hass=${this.hass}
                .selector=${{number:{min:0,max:3600,step:5,mode:"slider",unit_of_measurement:"s"}}}
                .value=${this._holdTime}
                @value-changed=${this._handleHoldTimeChange}
              ></ha-selector>
            </div>
          </div>
        </div>

        <!-- Color Assignment + Randomize Light Order -->
        <div class="form-row-pair">
          <div class="form-section">
            <span class="form-label">${this._localize("dynamic_scene.distribution_mode_label")||"Color assignment"}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:this._distributionModeOptions,mode:"dropdown"}}}
              .value=${this._distributionMode}
              @value-changed=${this._handleDistributionModeChange}
            ></ha-selector>
          </div>
          <div class="form-section boolean-left">
            <span class="form-label">${this._localize("dynamic_scene.random_order_label")||"Randomize light order"}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{boolean:{}}}
              .value=${this._randomOrder}
              @value-changed=${this._handleRandomOrderChange}
            ></ha-selector>
          </div>
        </div>

        <!-- Ripple Effect + Maximum Scene Brightness -->
        <div class="form-row-pair">
          <div class="form-section">
            <span class="form-label">${this._localize("dynamic_scene.ripple_effect_label")||"Ripple effect"}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:120,step:1,mode:"slider",unit_of_measurement:"s"}}}
              .value=${this._offsetDelay}
              @value-changed=${this._handleOffsetDelayChange}
            ></ha-selector>
          </div>
        </div>

        <!-- Loop Behavior -->
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

        ${"loop"===this._loopMode?H`
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

        <!-- Color Picker Modal -->
        ${null!==this._editingColorIndex&&null!==this._editingColor?H`
          <div class="color-picker-modal-overlay" @click=${this._closeColorPicker}>
            <div class="color-picker-modal" @click=${e=>e.stopPropagation()}>
              <div class="color-picker-modal-header">
                <span class="color-picker-modal-title">${this._localize("editors.color_picker_title")}</span>
                <div
                  class="color-picker-modal-preview"
                  style="background-color: ${Ie(this._editingColor,255)}"
                ></div>
              </div>
              <xy-color-picker
                .color=${this._editingColor}
                .size=${220}
                .showRgbInputs=${!0}
                @color-changed=${this._handleColorPickerChange}
              ></xy-color-picker>
              <color-history-swatches
                .colorHistory=${this.colorHistory}
                .translations=${this.translations}
                @color-selected=${this._handleHistoryColorSelected}
              ></color-history-swatches>
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

        <!-- Preview Warning -->
        ${this.hasSelectedEntities?"":H`
          <div class="preview-warning">
            <ha-icon icon="mdi:information"></ha-icon>
            <span>${this._localize("dynamic_scene.select_lights_for_preview")||"Select light entities in the Activate tab to preview dynamic scenes on your devices."}</span>
          </div>
        `}

        <!-- Form Actions -->
        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?H`
            <ha-button @click=${this._stopPreview}>
              <ha-icon icon="mdi:stop"></ha-icon>
              ${this._localize("editors.stop_button")}
            </ha-button>
          `:H`
            <ha-button
              @click=${this._preview}
              .disabled=${this._previewing||0===this._colors.length||!this.hasSelectedEntities||!this.isCompatible}
              title=${this.hasSelectedEntities?this.isCompatible?"":this._localize("editors.tooltip_light_not_compatible"):this._localize("editors.tooltip_select_lights_first")}
            >
              <ha-icon icon="mdi:play"></ha-icon>
              ${this._localize("editors.preview_button")}
            </ha-button>
          `}
          <ha-button
            @click=${this._save}
            .disabled=${!this._name.trim()||0===this._colors.length||this._saving}
          >
            <ha-icon icon="mdi:content-save"></ha-icon>
            ${this.editMode?this._localize("editors.update_button"):this._localize("editors.save_button")}
          </ha-button>
        </div>
      </div>
    `}};kt.styles=[Ee,bt,r`
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

    .boolean-left ha-selector {
      display: flex;
      justify-content: flex-start;
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

    .form-hint {
      font-size: var(--ha-font-size-s, 12px);
      color: var(--secondary-text-color);
      margin-top: -4px;
    }

    /* Color slots section */
    .color-slots-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .color-slot {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: var(--card-background-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
    }

    .color-slot.dragging {
      opacity: 0.4;
    }

    .color-preview {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      cursor: pointer;
      border: 2px solid var(--divider-color);
      flex-shrink: 0;
    }

    .color-slot-number {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-color);
      min-width: 20px;
      flex-shrink: 0;
    }

    .brightness-control {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
      overflow: hidden;
    }

    .brightness-control ha-selector {
      flex: 1;
      min-width: 80px;
    }

    .brightness-value {
      font-size: 13px;
      color: var(--secondary-text-color);
      min-width: 40px;
      text-align: right;
    }

    .color-slot-actions {
      display: flex;
      gap: 4px;
    }

    .color-slot-actions ha-icon-button {
      --mdc-icon-button-size: 32px;
      --mdc-icon-size: 18px;
    }

    .add-color-btn {
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

    .add-color-btn:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
      background: var(--secondary-background-color);
    }

    .add-color-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Timing sliders */
    .timing-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .timing-field {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .timing-label {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .timing-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-color);
    }

    /* Distribution section */
    .distribution-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .toggle-field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding-top: 4px;
    }

    .toggle-label {
      font-size: 12px;
      color: var(--secondary-text-color);
    }

    /* Form actions */
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

      .form-row-pair {
        grid-template-columns: 1fr;
      }

      .timing-section {
        grid-template-columns: 1fr;
      }

      .form-label {
        min-width: unset;
        margin-bottom: 4px;
      }

      .color-slots-container {
        gap: 8px;
      }

      .color-slot {
        gap: 8px;
        padding: 8px;
      }

      .color-preview {
        width: 40px;
        height: 40px;
      }

      .color-slot-number {
        min-width: 16px;
        font-size: 13px;
      }

      .brightness-control {
        gap: 4px;
      }

      .brightness-control ha-selector {
        min-width: 60px;
      }

      .color-slot-actions ha-icon-button {
        --mdc-icon-button-size: 28px;
        --mdc-icon-size: 16px;
      }
    }
  `],e([pe({attribute:!1})],kt.prototype,"hass",void 0),e([pe({type:Object})],kt.prototype,"preset",void 0),e([pe({type:Object})],kt.prototype,"translations",void 0),e([pe({type:Boolean})],kt.prototype,"editMode",void 0),e([pe({type:Boolean})],kt.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],kt.prototype,"isCompatible",void 0),e([pe({type:Array})],kt.prototype,"selectedEntities",void 0),e([pe({type:Boolean})],kt.prototype,"previewActive",void 0),e([pe({type:Array})],kt.prototype,"colorHistory",void 0),e([pe({type:Object})],kt.prototype,"draft",void 0),e([_e()],kt.prototype,"_name",void 0),e([_e()],kt.prototype,"_icon",void 0),e([_e()],kt.prototype,"_steps",void 0),e([_e()],kt.prototype,"_transitionTime",void 0),e([_e()],kt.prototype,"_holdTime",void 0),e([_e()],kt.prototype,"_distributionMode",void 0),e([_e()],kt.prototype,"_offsetDelay",void 0),e([_e()],kt.prototype,"_randomOrder",void 0),e([_e()],kt.prototype,"_loopMode",void 0),e([_e()],kt.prototype,"_loopCount",void 0),e([_e()],kt.prototype,"_endBehavior",void 0),e([_e()],kt.prototype,"_saving",void 0),e([_e()],kt.prototype,"_previewing",void 0),e([_e()],kt.prototype,"_editingColorIndex",void 0),e([_e()],kt.prototype,"_editingColor",void 0),kt=e([ce("dynamic-scene-editor")],kt);let Pt=class extends ae{constructor(){super(...arguments),this.curvature=1,this.width=300,this.height=300,this._isDragging=!1,this.MIN_CURVATURE=.2,this.MAX_CURVATURE=6,this.STEP=.01,this._handleCanvasPointerMove=e=>{this._isDragging&&(e.preventDefault(),this._handleCanvasInteraction(e))},this._handleCanvasPointerUp=()=>{this._isDragging=!1,window.removeEventListener("mousemove",this._handleCanvasPointerMove),window.removeEventListener("mouseup",this._handleCanvasPointerUp),window.removeEventListener("touchmove",this._handleCanvasPointerMove),window.removeEventListener("touchend",this._handleCanvasPointerUp)}}firstUpdated(){this._drawCurve()}updated(e){e.has("curvature")&&this._canvas&&this._drawCurve()}_getControlPoint(){const e=this.curvature;let t;t=e<=1?(e-this.MIN_CURVATURE)/(1-this.MIN_CURVATURE)*.5:.5+(e-1)/(this.MAX_CURVATURE-1)*.5;return{cx:.05+.9*t,cy:.95-.9*t}}_bezierY(e,t){return 2*(1-e)*e*t+e*e}_bezierX(e,t){return 2*(1-e)*e*t+e*e}_getCurveColor(){const e=getComputedStyle(this);return this.curvature<.95?e.getPropertyValue("--warning-color").trim()||"#ffc107":this.curvature>1.05?e.getPropertyValue("--primary-color").trim()||"#03a9f4":e.getPropertyValue("--success-color").trim()||"#4caf50"}_drawCurve(){const e=this._canvas;if(!e)return;const t=e.getContext("2d");if(!t)return;const{width:i,height:s}=this,o=24,n=i-48,r=s-48;e.width=i,e.height=s,t.clearRect(0,0,i,s),this._drawGrid(t,o,n,r);const{cx:a,cy:l}=this._getControlPoint(),c=this._getCurveColor(),d=document.createElement("div");d.style.color=c,document.body.appendChild(d);const h=getComputedStyle(d).color;document.body.removeChild(d);const p=h.match(/\d+/g),_=p?p[0]:"3",g=p?p[1]:"169",u=p?p[2]:"244";t.beginPath(),t.moveTo(o,s-o);const m=100;for(let e=0;e<=m;e++){const i=e/m,c=o+this._bezierX(i,a)*n,d=s-o-this._bezierY(i,l)*r;t.lineTo(c,d)}t.lineTo(o+n,s-o),t.closePath();const v=t.createLinearGradient(0,o,0,s-o);v.addColorStop(0,`rgba(${_}, ${g}, ${u}, 0.15)`),v.addColorStop(1,`rgba(${_}, ${g}, ${u}, 0.02)`),t.fillStyle=v,t.fill(),t.beginPath();for(let e=0;e<=m;e++){const i=e/m,c=o+this._bezierX(i,a)*n,d=s-o-this._bezierY(i,l)*r;0===e?t.moveTo(c,d):t.lineTo(c,d)}t.strokeStyle=c,t.lineWidth=3,t.lineCap="round",t.lineJoin="round",t.stroke();const f=s-o-r;t.beginPath(),t.arc(o+n,f,6,0,2*Math.PI),t.fillStyle=c,t.fill(),t.strokeStyle="white",t.lineWidth=2,t.stroke()}_drawGrid(e,t,i,s){const o=getComputedStyle(this).getPropertyValue("--secondary-text-color").trim()||"rgba(128, 128, 128, 0.5)";e.strokeStyle=o,e.globalAlpha=.3,e.lineWidth=1,e.setLineDash([4,4]);for(let o=0;o<=3;o++){const n=t+i/3*o;e.beginPath(),e.moveTo(n,t),e.lineTo(n,t+s),e.stroke()}for(let o=0;o<=3;o++){const n=t+s/3*o;e.beginPath(),e.moveTo(t,n),e.lineTo(t+i,n),e.stroke()}e.globalAlpha=1,e.setLineDash([])}_handleCanvasPointerDown(e){e.preventDefault(),this._isDragging=!0,this._handleCanvasInteraction(e),e instanceof MouseEvent?(window.addEventListener("mousemove",this._handleCanvasPointerMove),window.addEventListener("mouseup",this._handleCanvasPointerUp)):(window.addEventListener("touchmove",this._handleCanvasPointerMove,{passive:!1}),window.addEventListener("touchend",this._handleCanvasPointerUp))}_handleCanvasInteraction(e){const t=this._canvas;if(!t)return;const i=t.getBoundingClientRect();let s;if("touches"in e){const t=e.touches[0];if(!t)return;s=t.clientY}else s=e.clientY;const o=this.height-48,n=s-i.top-24,r=1-Math.max(0,Math.min(1,n/o));let a;if(r>=.5){a=1-2*(r-.5)*(1-this.MIN_CURVATURE)}else{a=1+2*(.5-r)*(this.MAX_CURVATURE-1)}a=Math.round(a/this.STEP)*this.STEP,a=Math.max(this.MIN_CURVATURE,Math.min(this.MAX_CURVATURE,a));const l=parseFloat(a.toFixed(2));this.dispatchEvent(new CustomEvent("curvature-input",{detail:{curvature:l},bubbles:!0,composed:!0}))}render(){return H`
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
    `}};var Et;Pt.styles=r`
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
  `,e([pe({attribute:!1})],Pt.prototype,"hass",void 0),e([pe({type:Number})],Pt.prototype,"curvature",void 0),e([pe({type:Number})],Pt.prototype,"width",void 0),e([pe({type:Number})],Pt.prototype,"height",void 0),e([_e()],Pt.prototype,"_isDragging",void 0),e([ge("canvas")],Pt.prototype,"_canvas",void 0),Pt=e([ce("transition-curve-editor")],Pt);let Tt=Et=class extends ae{constructor(){super(...arguments),this.narrow=!1,this._loading=!0,this._selectedEntities=[],this._brightness=100,this._useCustomBrightness=!1,this._useStaticSceneMode=!1,this._ignoreExternalChanges=!1,this._collapsed={},this._hasIncompatibleLights=!1,this._includeAllLights=!1,this._favorites=[],this._activeFavoriteId=null,this._showFavoriteInput=!1,this._favoriteInputName="",this._activeTab="activate",this._effectPreviewActive=!1,this._cctPreviewActive=!1,this._segmentSequencePreviewActive=!1,this._scenePreviewActive=!1,this._sortPreferences={},this._colorHistory=[],this._frontendVersion="0.12.0",this._supportedEntities=new Map,this._deviceZones=new Map,this._zoneEditing=new Map,this._zoneSaving=!1,this._z2mInstances=[],this._localCurvature=1,this._applyingCurvature=!1,this._zhaDeviceConfig=new Map,this._isExporting=!1,this._isImporting=!1,this._favoritePresets=[],this._runningOperations=[],this._setupComplete=!0,this._translations=nt,this._fileInputRef=null,this._eventUnsubscribers=[],this._tileCardRef=new Se,this._tileCards=new Map,this._editorDraftCache={},this._handleColorHistoryChanged=e=>{const t=e.detail;t&&Array.isArray(t.colorHistory)&&(this._colorHistory=t.colorHistory,this._saveUserPreferences())},this._handleClearColorHistory=e=>{this._colorHistory=[],this._saveUserPreferences(!0)}}_localize(e,t){const i=e.split(".");let s=this._translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}return"string"!=typeof s?e:(t&&Object.keys(t).forEach(e=>{const i=t[e];void 0!==i&&(s=s.replace(`{${e}}`,i))}),s)}firstUpdated(){this._loadPresets(),this._loadFavorites(),this._loadUserPresets(),this._loadUserPreferences(),this._loadBackendVersion(),this._loadSupportedEntities(),this._loadRunningOperations(),this._subscribeToOperationEvents(),this.addEventListener("color-history-changed",this._handleColorHistoryChanged),this.addEventListener("clear-history",this._handleClearColorHistory)}disconnectedCallback(){super.disconnectedCallback(),this.removeEventListener("color-history-changed",this._handleColorHistoryChanged),this.removeEventListener("clear-history",this._handleClearColorHistory),void 0!==this._preferencesSaveTimer&&(clearTimeout(this._preferencesSaveTimer),this._preferencesSaveTimer=void 0),this._stopSetupPolling(),this._tileCards.clear();for(const e of this._eventUnsubscribers)e();this._eventUnsubscribers=[]}updated(e){super.updated(e),e.has("hass")&&void 0===e.get("hass")&&(this._loadPresets(),this._loadFavorites(),this._loadUserPresets(),this._loadSupportedEntities()),this._updateTileCard()}async _updateTileCard(){const e=this._tileCardRef.value;if(!e||!this.hass)return void(this._tileCards.size>0&&this._tileCards.clear());if(!this._selectedEntities.length)return this._tileCards.forEach(e=>{e.parentElement&&e.remove()}),void this._tileCards.clear();await customElements.whenDefined("hui-tile-card");const t=new Set(this._selectedEntities);for(const[i,s]of this._tileCards.entries())t.has(i)&&s.parentElement===e||(s.parentElement&&s.remove(),this._tileCards.delete(i));for(const t of this._selectedEntities){let i=this._tileCards.get(t);i&&i.parentElement===e||(i=document.createElement("hui-tile-card"),e.appendChild(i),this._tileCards.set(t,i));try{i.setConfig({type:"tile",entity:t,features:[{type:"light-brightness"}]}),i.hass=this.hass}catch(e){console.warn("Failed to configure tile card for",t,":",e)}}}async _loadPresets(){try{const e=await fetch("/api/aqara_advanced_lighting/presets");if(!e.ok)throw new Error(`HTTP error ${e.status}`);this._presets=await e.json(),this._loading=!1}catch(e){this._error=e instanceof Error?e.message:this._localize("errors.loading_presets_generic"),this._loading=!1}}async _loadFavorites(){if(this.hass)try{const e=await this.hass.callApi("GET","aqara_advanced_lighting/favorites");this._favorites=e.favorites||[]}catch(e){console.warn("Failed to load favorites:",e)}}async _loadUserPresets(){if(this.hass)try{this._userPresets=await this.hass.callApi("GET","aqara_advanced_lighting/user_presets")}catch(e){console.warn("Failed to load user presets:",e)}}async _loadUserPreferences(){if(this.hass){try{const e=await this.hass.callApi("GET","aqara_advanced_lighting/user_preferences");if(0===e.color_history.length&&0===Object.keys(e.sort_preferences).length){const e=this._migrateLocalStoragePreferences();if(e){const t=await this.hass.callApi("PUT","aqara_advanced_lighting/user_preferences",e);return this._colorHistory=t.color_history,this._sortPreferences=t.sort_preferences,localStorage.removeItem("aqara_lighting_color_history"),void localStorage.removeItem("aqara_lighting_sort_preferences")}}this._colorHistory=e.color_history,this._sortPreferences=e.sort_preferences,this._favoritePresets=e.favorite_presets||[],e.collapsed_sections&&(this._collapsed=e.collapsed_sections),void 0!==e.include_all_lights&&(this._includeAllLights=e.include_all_lights),void 0!==e.static_scene_mode&&(this._useStaticSceneMode=e.static_scene_mode)}catch(e){console.warn("Failed to load user preferences:",e),this._loadSortPreferencesFromLocalStorage()}try{const e=await this.hass.callApi("GET","aqara_advanced_lighting/global_preferences");void 0!==e.ignore_external_changes&&(this._ignoreExternalChanges=e.ignore_external_changes)}catch(e){console.warn("Failed to load global preferences:",e)}}}_migrateLocalStoragePreferences(){const e={};let t=!1;try{const i=localStorage.getItem("aqara_lighting_color_history");if(i){const s=JSON.parse(i);Array.isArray(s)&&s.length>0&&(e.color_history=s,t=!0)}}catch{}try{const i=localStorage.getItem("aqara_lighting_sort_preferences");if(i){const s=JSON.parse(i);s&&"object"==typeof s&&Object.keys(s).length>0&&(e.sort_preferences=s,t=!0)}}catch{}return t?e:null}_loadSortPreferencesFromLocalStorage(){try{const e=localStorage.getItem("aqara_lighting_sort_preferences");e&&(this._sortPreferences=JSON.parse(e))}catch{}}_saveUserPreferences(e=!1){if(!this.hass)return;void 0!==this._preferencesSaveTimer&&(clearTimeout(this._preferencesSaveTimer),this._preferencesSaveTimer=void 0);const t=()=>{this.hass.callApi("PUT","aqara_advanced_lighting/user_preferences",{color_history:this._colorHistory,sort_preferences:this._sortPreferences,collapsed_sections:this._collapsed,include_all_lights:this._includeAllLights,favorite_presets:this._favoritePresets,static_scene_mode:this._useStaticSceneMode}).catch(e=>{console.warn("Failed to save user preferences:",e)})};e?t():this._preferencesSaveTimer=setTimeout(t,500)}_isPresetFavorited(e,t){return this._favoritePresets.some(i=>i.type===e&&i.id===t)}_toggleFavoritePreset(e,t,i){i.stopPropagation();const s=this._favoritePresets.findIndex(i=>i.type===e&&i.id===t);this._favoritePresets=s>=0?[...this._favoritePresets.slice(0,s),...this._favoritePresets.slice(s+1)]:[...this._favoritePresets,{type:e,id:t}],this._saveUserPreferences(!0)}_renderFavoriteStar(e,t){const i=this._isPresetFavorited(e,t);return H`
      <ha-icon-button
        class="favorite-star ${i?"favorited":""}"
        @click=${i=>this._toggleFavoritePreset(e,t,i)}
        title="${i?this._localize("tooltips.favorite_preset_remove"):this._localize("tooltips.favorite_preset_add")}"
      >
        <ha-icon icon="${i?"mdi:star":"mdi:star-outline"}"></ha-icon>
      </ha-icon-button>
    `}_getResolvedFavoritePresets(){const e=[];for(const t of this._favoritePresets){let i,s=null,o=!1;switch(t.type){case"effect":for(const e of["t2_bulb","t1m","t1_strip"]){const o=this._presets?.dynamic_effects?.[e]?.find(e=>e.id===t.id);if(o){s=o,i=e;break}}s||(s=this._userPresets?.effect_presets?.find(e=>e.id===t.id)||null,s&&(o=!0,i=s.device_type));break;case"segment_pattern":s=this._presets?.segment_patterns?.find(e=>e.id===t.id)||null,s||(s=this._userPresets?.segment_pattern_presets?.find(e=>e.id===t.id)||null,s&&(o=!0,i=s.device_type));break;case"cct_sequence":s=this._presets?.cct_sequences?.find(e=>e.id===t.id)||null,s||(s=this._userPresets?.cct_sequence_presets?.find(e=>e.id===t.id)||null,s&&(o=!0));break;case"segment_sequence":s=this._presets?.segment_sequences?.find(e=>e.id===t.id)||null,s||(s=this._userPresets?.segment_sequence_presets?.find(e=>e.id===t.id)||null,s&&(o=!0,i=s.device_type));break;case"dynamic_scene":s=this._presets?.dynamic_scenes?.find(e=>e.id===t.id)||null,s||(s=this._userPresets?.dynamic_scene_presets?.find(e=>e.id===t.id)||null,s&&(o=!0))}s&&e.push({ref:t,preset:s,isUser:o,deviceType:i})}return e.length!==this._favoritePresets.length&&(this._favoritePresets=e.map(e=>e.ref),this._saveUserPreferences()),e}async _activateFavoritePreset(e,t,i){switch(e.type){case"effect":i?await this._activateUserEffectPreset(t):await this._activateDynamicEffect(t);break;case"segment_pattern":i?await this._activateUserPatternPreset(t):await this._activateSegmentPattern(t);break;case"cct_sequence":i?await this._activateUserCCTSequencePreset(t):await this._activateCCTSequence(t);break;case"segment_sequence":i?await this._activateUserSegmentSequencePreset(t):await this._activateSegmentSequence(t);break;case"dynamic_scene":i?await this._activateUserDynamicScenePreset(t):await this._activateDynamicScene(t)}}_renderFavoritePresetIcon(e,t,i){switch(e.type){case"effect":return i?this._renderUserEffectIcon(t):this._renderPresetIcon(t.icon,"mdi:lightbulb-on");case"segment_pattern":return i?this._renderUserPatternIcon(t):this._renderPresetIcon(t.icon,"mdi:palette");case"cct_sequence":return i?this._renderUserCCTIcon(t):this._renderPresetIcon(t.icon,"mdi:temperature-kelvin");case"segment_sequence":return i?this._renderUserSegmentSequenceIcon(t):this._renderPresetIcon(t.icon,"mdi:animation-play");case"dynamic_scene":return i?this._renderUserDynamicSceneIcon(t):this._renderBuiltinDynamicSceneIcon(t);default:return H`<ha-icon icon="mdi:star"></ha-icon>`}}_getSortPreference(e){return this._sortPreferences[e]||"name-asc"}async _loadBackendVersion(){try{const e=await fetch("/api/aqara_advanced_lighting/version");if(!e.ok)return void console.warn("Failed to load backend version:",e.status);const t=await e.json();this._backendVersion=t.version,this._setupComplete=t.setup_complete??!0,this._setupComplete||this._setupPollTimer||this._startSetupPolling()}catch(e){console.warn("Failed to load backend version:",e)}}_startSetupPolling(){this._setupPollTimer=setInterval(()=>this._checkSetupStatus(),2500)}async _checkSetupStatus(){try{const e=await fetch("/api/aqara_advanced_lighting/version");if(!e.ok)return;const t=await e.json();this._setupComplete=t.setup_complete??!0,this._setupComplete&&(this._stopSetupPolling(),this._loadSupportedEntities())}catch(e){}}_stopSetupPolling(){this._setupPollTimer&&(clearInterval(this._setupPollTimer),this._setupPollTimer=void 0)}async _loadSupportedEntities(){try{const e=await fetch("/api/aqara_advanced_lighting/supported_entities",{headers:{Authorization:`Bearer ${this.hass?.auth?.data?.access_token}`}});if(!e.ok)return void console.warn("Failed to load supported entities:",e.status);const t=await e.json(),i=new Map;for(const e of t.entities||[])i.set(e.entity_id,{device_type:e.device_type,model_id:e.model_id,z2m_friendly_name:e.z2m_friendly_name,ieee_address:e.ieee_address,segment_count:e.segment_count,backend_type:e.backend_type});for(const e of t.light_groups||[])i.set(e.entity_id,{device_type:e.device_type,model_id:"light_group",z2m_friendly_name:e.friendly_name,is_group:!0,member_count:e.member_count});this._supportedEntities=i,this._z2mInstances=t.instances||[]}catch(e){console.warn("Failed to load supported entities:",e)}}async _loadRunningOperations(){if(this.hass?.auth?.data?.access_token)try{const e=await fetch("/api/aqara_advanced_lighting/running_operations",{headers:{Authorization:`Bearer ${this.hass.auth.data.access_token}`}});if(!e.ok)return;const t=await e.json();this._runningOperations=t.operations||[]}catch(e){console.warn("Failed to load running operations:",e)}}async _subscribeToOperationEvents(){if(!this.hass?.connection)return;const e=["aqara_advanced_lighting_sequence_started","aqara_advanced_lighting_sequence_stopped","aqara_advanced_lighting_sequence_completed","aqara_advanced_lighting_sequence_paused","aqara_advanced_lighting_sequence_resumed","aqara_advanced_lighting_dynamic_scene_started","aqara_advanced_lighting_dynamic_scene_stopped","aqara_advanced_lighting_dynamic_scene_finished","aqara_advanced_lighting_dynamic_scene_paused","aqara_advanced_lighting_dynamic_scene_resumed","aqara_advanced_lighting_effect_activated","aqara_advanced_lighting_effect_stopped","aqara_advanced_lighting_entity_externally_controlled","aqara_advanced_lighting_entity_control_resumed"];for(const t of e)try{const e=await this.hass.connection.subscribeEvents(()=>{this._loadRunningOperations()},t);this._eventUnsubscribers.push(e)}catch(e){console.warn(`Failed to subscribe to ${t}:`,e)}}_getSelectedSegmentDevices(){const e=new Map;for(const t of this._selectedEntities){const i=this._supportedEntities.get(t);if(!i?.ieee_address)continue;if("t1m"!==i.device_type&&"t1_strip"!==i.device_type)continue;if(e.has(i.ieee_address))continue;const s="t1_strip"===i.device_type?this._getT1StripSegmentCount():i.segment_count||0;0!==s&&e.set(i.ieee_address,{device_type:i.device_type,segment_count:s,z2m_friendly_name:i.z2m_friendly_name,entity_id:t})}return e}async _loadZonesForDevice(e){try{const t=await fetch(`/api/aqara_advanced_lighting/segment_zones/${encodeURIComponent(e)}`,{headers:{Authorization:`Bearer ${this.hass?.auth?.data?.access_token}`}});if(!t.ok)return;const i=await t.json(),s=Object.entries(i.zones||{}).map(([e,t])=>({name:e,segments:t}));this._deviceZones=new Map(this._deviceZones).set(e,s),this._zoneEditing=new Map(this._zoneEditing).set(e,s.map(e=>({...e})))}catch(t){console.warn("Failed to load zones for device:",e,t)}}async _loadZonesForSelectedDevices(){const e=this._getSelectedSegmentDevices();await Promise.all(Array.from(e.keys()).map(e=>this._loadZonesForDevice(e)))}_validateSegmentRange(e,t,i){const s=e.trim().toLowerCase();if(new Set(["odd","even","all","first-half","second-half"]).has(s))return null;const o=s.split(",");for(const e of o){const s=e.trim(),o=s.match(/^(\d+)-(\d+)$/);if(o){const e=parseInt(o[1]??"",10),n=parseInt(o[2]??"",10);if(isNaN(e)||isNaN(n))return this._localize("config.zone_invalid_range").replace("{name}",i).replace("{range}",s);if(e>t||n>t){const s=Math.max(e,n);return this._localize("config.zone_out_of_range").replace("{name}",i).replace("{segment}",String(s)).replace("{max}",String(t))}}else{const e=parseInt(s,10);if(isNaN(e))return this._localize("config.zone_invalid_range").replace("{name}",i).replace("{range}",s);if(e>t)return this._localize("config.zone_out_of_range").replace("{name}",i).replace("{segment}",String(e)).replace("{max}",String(t))}}return null}async _saveZones(e,t){const i=this._zoneEditing.get(e)||[],s={},o=new Set;for(const e of i){const i=e.name.trim(),n=e.segments.trim();if(!i&&!n)continue;if(!i)return void this._showToast(this._localize("config.zone_name_required"));if(!n)return void this._showToast(this._localize("config.zone_segments_required"));const r=i.toLowerCase();if(o.has(r))return void this._showToast(this._localize("config.zone_duplicate_name",{name:i}));o.add(r);const a=this._validateSegmentRange(n,t,i);if(a)return void this._showToast(a);s[i]=n}this._zoneSaving=!0;try{const t=await fetch(`/api/aqara_advanced_lighting/segment_zones/${encodeURIComponent(e)}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.hass?.auth?.data?.access_token}`},body:JSON.stringify({zones:s})});if(t.ok)await this._loadZonesForDevice(e),this._showToast(this._localize("config.zone_saved"));else{const e=await t.json().catch(()=>({}));this._showToast(e.message||this._localize("config.zone_save_error"))}}catch{this._showToast(this._localize("config.zone_save_error"))}finally{this._zoneSaving=!1}}_addZoneRow(e){const t=[...this._zoneEditing.get(e)||[],{name:"",segments:""}];this._zoneEditing=new Map(this._zoneEditing).set(e,t)}async _removeZoneRow(e,t){const i=this._zoneEditing.get(e)||[],s=i[t];if(s){const t=(this._deviceZones.get(e)||[]).some(e=>e.name.toLowerCase()===s.name.trim().toLowerCase()&&""!==s.name.trim());if(t)try{return await fetch(`/api/aqara_advanced_lighting/segment_zones/${encodeURIComponent(e)}/${encodeURIComponent(s.name.trim())}`,{method:"DELETE",headers:{Authorization:`Bearer ${this.hass?.auth?.data?.access_token}`}}),void await this._loadZonesForDevice(e)}catch{return void this._showToast(this._localize("config.zone_save_error"))}}const o=i.filter((e,i)=>i!==t);this._zoneEditing=new Map(this._zoneEditing).set(e,o)}_updateZoneField(e,t,i,s){const o=(this._zoneEditing.get(e)||[]).map((e,o)=>o===t?{...e,[i]:s}:e);this._zoneEditing=new Map(this._zoneEditing).set(e,o)}_zonesModified(e){const t=this._deviceZones.get(e)||[],i=this._zoneEditing.get(e)||[];return t.length!==i.length||t.some((e,t)=>e.name!==i[t]?.name||e.segments!==i[t]?.segments)}_setSortPreference(e,t){this._sortPreferences={...this._sortPreferences,[e]:t},this._saveUserPreferences()}_sortUserEffectPresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserPatternPresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserCCTSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserSegmentSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserDynamicScenePresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortDynamicEffectPresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortSegmentPatternPresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortCCTSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortSegmentSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortDynamicScenePresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortResolvedFavorites(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.preset.name.localeCompare(t.preset.name));case"name-desc":return i.sort((e,t)=>t.preset.name.localeCompare(e.preset.name));case"date-new":return i.reverse();default:return i}}_groupPresetsByDeviceType(e){const t=[],i=new Map;for(const s of e)if(s.device_type){const e=i.get(s.device_type)||[];e.push(s),i.set(s.device_type,e)}else t.push(s);return{ungrouped:t,grouped:i}}async _saveUserPreset(e,t){if(this.hass)try{await this.hass.callApi("POST","aqara_advanced_lighting/user_presets",{type:e,data:t}),await this._loadUserPresets()}catch(e){console.error("Failed to save user preset:",e)}}async _updateUserPreset(e,t,i){if(this.hass)try{await this.hass.callApi("PUT",`aqara_advanced_lighting/user_presets/${e}/${t}`,i),await this._loadUserPresets()}catch(e){console.error("Failed to update user preset:",e)}}async _deleteUserPreset(e,t){if(this.hass)try{await this.hass.callApi("DELETE",`aqara_advanced_lighting/user_presets/${e}/${t}`),await this._loadUserPresets()}catch(e){console.error("Failed to delete user preset:",e)}}_setActiveTab(e){e!==this._activeTab&&this._cacheCurrentEditorDraft(),this._activeTab=e}_handleTabChange(e){const t=e.detail.name;t&&t!==this._activeTab&&(this._cacheCurrentEditorDraft(),this._activeTab=t)}_cacheCurrentEditorDraft(){const e={effects:"effect-editor",patterns:"pattern-editor",cct:"cct-sequence-editor",segments:"segment-sequence-editor",scenes:"dynamic-scene-editor"}[this._activeTab];if(!e)return;const t=this.shadowRoot?.querySelector(e);if(t&&"function"==typeof t.getDraftState){const e=t.getDraftState();if(e){const t=this._activeTab;this._editorDraftCache={...this._editorDraftCache,[t]:e}}}}_getEditorDraft(e){const t=e,i=this._editorDraftCache[t];if(i){const{[t]:e,...i}=this._editorDraftCache;this._editorDraftCache=i}return i}_clearEditorDraft(e){if(e){const t=e,{[t]:i,...s}=this._editorDraftCache;this._editorDraftCache=s}else this._editorDraftCache={}}_addFavorite(){if(!this._selectedEntities.length)return;const e=this._selectedEntities[0],t=1===this._selectedEntities.length&&e?this._getEntityFriendlyName(e):this._localize("target.lights_count",{count:this._selectedEntities.length.toString()});this._favoriteInputName=t,this._showFavoriteInput=!0}async _saveFavorite(){if(this._selectedEntities.length&&this.hass){try{const e=await this.hass.callApi("POST","aqara_advanced_lighting/favorites",{entities:this._selectedEntities,name:this._favoriteInputName||void 0});this._favorites=[...this._favorites,e.favorite]}catch(e){console.error("Failed to add favorite:",e)}this._cancelFavoriteInput()}else this._cancelFavoriteInput()}_cancelFavoriteInput(){this._showFavoriteInput=!1,this._favoriteInputName=""}_handleFavoriteNameChange(e){this._favoriteInputName=e.detail.value||""}_handleFavoriteNameKeydown(e){"Enter"===e.key?(e.preventDefault(),this._saveFavorite()):"Escape"===e.key&&(e.preventDefault(),this._cancelFavoriteInput())}async _removeFavorite(e){if(this.hass)try{await this.hass.callApi("DELETE",`aqara_advanced_lighting/favorites/${e}`),this._favorites=this._favorites.filter(t=>t.id!==e)}catch(e){console.error("Failed to remove favorite:",e)}}_selectFavorite(e){this._selectedEntities=[...e.entities],this._activeFavoriteId=e.id,this._loadCurvatureFromEntity(),this._loadZonesForSelectedDevices()}_getEntityFriendlyName(e){if(!this.hass)return e;const t=this.hass.states[e];return t&&t.attributes.friendly_name?t.attributes.friendly_name:e.split(".")[1]?.replace(/_/g," ")||e}_getEntityIcon(e){if(!this.hass)return"mdi:lightbulb";const t=this.hass.states[e];if(t){if(t.attributes.icon)return t.attributes.icon;if("light"===e.split(".")[0])return"mdi:lightbulb"}return"mdi:lightbulb"}_getEntityState(e){if(!this.hass)return"unavailable";const t=this.hass.states[e];return t?t.state:"unavailable"}_getEntityColor(e){if(!this.hass)return null;const t=this.hass.states[e];if(!t||"on"!==t.state)return null;if(t.attributes.rgb_color){const[e,i,s]=t.attributes.rgb_color;return`rgb(${e}, ${i}, ${s})`}if(t.attributes.hs_color&&Array.isArray(t.attributes.hs_color)){const e=t.attributes.hs_color;if(e.length>=2&&"number"==typeof e[0]&&"number"==typeof e[1]){const t=e[0],i=e[1]/100*255,s=i*(1-Math.abs(t/60%2-1)),o=255-i;let n=0,r=0,a=0;return t<60?(n=i,r=s,a=0):t<120?(n=s,r=i,a=0):t<180?(n=0,r=i,a=s):t<240?(n=0,r=s,a=i):t<300?(n=s,r=0,a=i):(n=i,r=0,a=s),`rgb(${Math.round(n+o)}, ${Math.round(r+o)}, ${Math.round(a+o)})`}}return null}_getSelectedDeviceTypes(){if(!this._selectedEntities.length||!this.hass)return this._hasIncompatibleLights=!1,[];const e=new Set;let t=!1;for(const i of this._selectedEntities){const s=this._getEntityDeviceType(i);s?e.add(s):t=!0}return this._hasIncompatibleLights=t&&!e.has("generic_rgb")&&!e.has("generic_cct"),Array.from(e)}_getT1StripSegmentCount(){if(!this._selectedEntities.length||!this.hass)return 10;for(const e of this._selectedEntities){if("t1_strip"!==this._getEntityDeviceType(e))continue;const t=this.hass.states[e];if(!t)continue;let i;const s=t.attributes.length;if(s&&"number"==typeof s&&s>0&&(i=s),void 0===i){const t=e.split(".")[1]||"";for(const e of["number","sensor"]){const s=`${e}.${t}_length`,o=this.hass.states[s];if(o&&o.state&&"unknown"!==o.state&&"unavailable"!==o.state){const e=parseFloat(o.state);if(!isNaN(e)&&e>0){i=e;break}}}}if(void 0!==i&&i>0)return Math.floor(5*i)}return 10}_getDeviceContextForEditor(e){const t=this._getSelectedDeviceTypes();if(0===t.length)return{deviceType:null,hasSelection:!1};let i=null;switch(e){case"effect":i=t.find(e=>"t2_bulb"===e||"t1m"===e||"t1_strip"===e||"t1"===e)??null;break;case"pattern":case"segment":i=t.find(e=>"t1m"===e||"t1_strip"===e||"t1"===e)??null;break;case"cct":i=t[0]??null}return{deviceType:i,hasSelection:!0,zones:this._getResolvedZonesForSelection()}}_getResolvedZonesForSelection(){for(const e of this._selectedEntities){const t=this._supportedEntities.get(e);if(!t?.ieee_address)continue;if("t1m"!==t.device_type&&"t1_strip"!==t.device_type)continue;const i="t1_strip"===t.device_type?this._getT1StripSegmentCount():t.segment_count||0;if(0===i)continue;return(this._deviceZones.get(t.ieee_address)||[]).map(e=>{const t=[];for(const s of e.segments.split(",")){const e=s.trim(),o=e.match(/^(\d+)-(\d+)$/);if(o&&o[1]&&o[2]){const e=parseInt(o[1],10),s=parseInt(o[2],10);for(let o=e;o<=s&&o<=i;o++)t.push(o-1)}else{const s=parseInt(e,10);!isNaN(s)&&s>=1&&s<=i&&t.push(s-1)}}return{name:e.name,segmentIndices:t}})}return[]}_hasRGBColorMode(e){const t=e.attributes.supported_color_modes;return!!t&&Array.isArray(t)&&t.some(e=>["xy","hs","rgb","rgbw","rgbww"].includes(e))}_getEntityDeviceType(e){const t=this.hass?.states[e];if(!t)return null;const i=this._supportedEntities.get(e);if(i){if("t1m"===i.device_type)return this._hasRGBColorMode(t)?"t1m":"t1m_white";if(i.device_type&&"unknown"!==i.device_type)return i.device_type}if(this._includeAllLights){if(this._hasRGBColorMode(t))return"generic_rgb";const e=t.attributes.supported_color_modes;if(e?.includes("color_temp"))return"generic_cct"}const s=t.attributes.effect_list;if(s&&Array.isArray(s)){if(s.includes("flow1")||s.includes("flow2")||s.includes("rolling"))return"t1m";if(s.includes("rainbow1")||s.includes("rainbow2")||s.includes("chasing")||s.includes("flicker")||s.includes("dash"))return"t1_strip";if(s.includes("candlelight"))return"t2_bulb"}else if(!s&&void 0!==t.attributes.color_temp)return"t2_cct";return null}_isEffectsCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{if(!this._supportedEntities.has(e))return!1;const t=this._getEntityDeviceType(e);return"t2_bulb"===t||"t1m"===t||"t1_strip"===t})}_isPatternsCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{if(!this._supportedEntities.has(e))return!1;const t=this._getEntityDeviceType(e);return"t1m"===t||"t1_strip"===t})}_isCCTCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];if(!t)return!1;if(!(void 0!==t.attributes.color_temp||void 0!==t.attributes.color_temp_kelvin||void 0!==t.attributes.min_color_temp_kelvin))return!1;return"t1m"!==this._getEntityDeviceType(e)})}_isSegmentsCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{if(!this._supportedEntities.has(e))return!1;const t=this._getEntityDeviceType(e);return"t1m"===t||"t1_strip"===t})}_getEffectsCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{if(!this._supportedEntities.has(e))return!1;const t=this._getEntityDeviceType(e);return"t2_bulb"===t||"t1m"===t||"t1_strip"===t}):[]}_getPatternsCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{if(!this._supportedEntities.has(e))return!1;const t=this._getEntityDeviceType(e);return"t1m"===t||"t1_strip"===t}):[]}_getCCTCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;if(!(void 0!==t.attributes.color_temp||void 0!==t.attributes.color_temp_kelvin||void 0!==t.attributes.min_color_temp_kelvin))return!1;return"t1m"!==this._getEntityDeviceType(e)}):[]}_getSegmentsCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{if(!this._supportedEntities.has(e))return!1;const t=this._getEntityDeviceType(e);return"t1m"===t||"t1_strip"===t}):[]}_getT2CompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this._getEntityDeviceType(e);return"t2_bulb"===t||"t2_cct"===t}):[]}_filterPresets(){const e=this._getSelectedDeviceTypes(),t=e.length>0,i=e.includes("t2_bulb"),s=e.includes("t2_cct"),o=e.includes("t1m"),n=e.includes("t1m_white"),r=e.includes("t1_strip"),a=e.includes("generic_rgb"),l=e.includes("generic_cct");return{showDynamicEffects:t&&(i||o||r),showSegmentPatterns:t&&(o||r),showCCTSequences:t&&(i||s||n||r||a||l),showSegmentSequences:t&&(o||r),showDynamicScenes:t&&(i||o||r||a),hasT2:i,hasT1M:o,hasT1Strip:r,t2Presets:i&&this._presets?.dynamic_effects.t2_bulb||[],t1mPresets:o&&this._presets?.dynamic_effects.t1m||[],t1StripPresets:r&&this._presets?.dynamic_effects.t1_strip||[]}}_handleEntityChanged(e){const t=e.detail.value;if(!t)return this._selectedEntities=[],void(this._activeFavoriteId=null);Array.isArray(t)?this._selectedEntities=t:this._selectedEntities=[t],this._activeFavoriteId=null,this._loadCurvatureFromEntity(),this._loadZhaDeviceConfigs(),this._loadZonesForSelectedDevices()}_handleIncludeAllLightsToggle(e){if(this._includeAllLights=e.target.checked,this._saveUserPreferences(),!this._includeAllLights){const e=new Set(this._supportedEntities.keys()),t=this._selectedEntities.filter(t=>e.has(t));t.length!==this._selectedEntities.length&&(this._selectedEntities=t)}}_handleBrightnessChange(e){this._brightness=e.detail.value}_handleCustomBrightnessToggle(e){this._useCustomBrightness=e.target.checked}_handleStaticSceneModeToggle(e){this._useStaticSceneMode=e.target.checked,this._saveUserPreferences()}_handleIgnoreExternalChangesToggle(e){this._ignoreExternalChanges=e.target.checked,this._saveGlobalPreferences()}async _saveGlobalPreferences(){try{await this.hass.callApi("PUT","aqara_advanced_lighting/global_preferences",{ignore_external_changes:this._ignoreExternalChanges})}catch(e){console.warn("Failed to save global preferences:",e)}}_handleExpansionChange(e,t){const i=t.detail.expanded;this._collapsed={...this._collapsed,[e]:!i},this._saveUserPreferences()}async _activateDynamicEffect(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0};this._useCustomBrightness&&(t.brightness=this._brightness),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",t)}async _activateSegmentPattern(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0};this._useCustomBrightness&&(t.brightness=this._brightness),await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",t)}async _activateCCTSequence(e){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",{entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0})}async _activateSegmentSequence(e){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",{entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0})}async _activateDynamicScene(e){if(!this._selectedEntities.length)return;const t=this._useCustomBrightness?this._brightness:null,i={entity_id:this._selectedEntities,scene_name:e.name,transition_time:e.transition_time,hold_time:e.hold_time,distribution_mode:e.distribution_mode,random_order:e.random_order,loop_mode:e.loop_mode,end_behavior:e.end_behavior};void 0!==e.offset_delay&&e.offset_delay>0&&(i.offset_delay=e.offset_delay),"loop"===e.loop_mode&&void 0!==e.loop_count&&(i.loop_count=e.loop_count),i.colors=e.colors.map(e=>({x:e.x,y:e.y,brightness_pct:t??e.brightness_pct})),this._useStaticSceneMode&&(i.static=!0),await this.hass.callService("aqara_advanced_lighting","start_dynamic_scene",i)}_getEntityName(e){const t=this.hass?.states?.[e];return t?.attributes?.friendly_name||e}_resolvePresetInfo(e){if(!e)return{name:null,icon:null};if(this._presets?.dynamic_effects)for(const t of Object.values(this._presets.dynamic_effects)){const i=t.find(t=>t.id===e);if(i)return{name:i.name,icon:i.icon||null}}const t=this._presets?.segment_patterns?.find(t=>t.id===e);if(t)return{name:t.name,icon:t.icon||null};const i=this._presets?.cct_sequences?.find(t=>t.id===e);if(i)return{name:i.name,icon:i.icon||null};const s=this._presets?.segment_sequences?.find(t=>t.id===e);if(s)return{name:s.name,icon:s.icon||null};const o=this._presets?.dynamic_scenes?.find(t=>t.id===e);if(o)return{name:o.name,icon:o.icon||null};if(this._userPresets){const t=[...this._userPresets.effect_presets||[],...this._userPresets.segment_pattern_presets||[],...this._userPresets.cct_sequence_presets||[],...this._userPresets.segment_sequence_presets||[],...this._userPresets.dynamic_scene_presets||[]].find(t=>t.id===e||t.name===e);if(t)return{name:t.name,icon:t.icon||null}}return{name:e,icon:null}}_renderRunningOperations(){return 0===this._runningOperations.length?H`
        <div class="running-ops-empty">
          ${this._localize("target.no_running_operations")}
        </div>
      `:H`
      <div class="running-ops-container">
        <span class="control-label">${this._localize("target.running_operations_label")}</span>
        <div class="running-ops-list">
          ${this._runningOperations.map(e=>this._renderOperationCard(e))}
        </div>
      </div>
    `}_renderOperationCard(e){switch(e.type){case"effect":return this._renderEffectOp(e);case"cct_sequence":case"segment_sequence":return this._renderSequenceOp(e);case"dynamic_scene":return this._renderSceneOp(e);default:return""}}_renderEffectOp(e){const t=this._getEntityName(e.entity_id),i=this._resolvePresetInfo(e.preset_id);return H`
      <div class="running-op-card">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="${i.icon||"mdi:palette"}"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${i.name||this._localize("target.effect_button")}</span>
            <span class="running-op-entity"><span class="running-op-entity-name">${t}</span></span>
          </div>
        </div>
        <div class="running-op-actions">
          <ha-icon-button
            .label=${this._localize("target.stop")}
            @click=${()=>this._stopRunningEffect(e.entity_id)}
          >
            <ha-icon icon="mdi:stop"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `}_renderSequenceOp(e){const t=this._getEntityName(e.entity_id),i=this._resolvePresetInfo(e.preset_id),s="cct_sequence"===e.type,o=s?"mdi:thermometer":"mdi:led-strip-variant",n=s?this._localize("target.cct_button"):this._localize("target.segment_button");return H`
      <div class="running-op-card ${e.externally_paused?"externally-paused":""}">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="${i.icon||o}"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${i.name||n}</span>
            <span class="running-op-entity">
              <span class="running-op-entity-name">${t}</span>
              ${e.paused?H`<span class="running-op-status">${this._localize("target.paused")}</span>`:""}
              ${e.externally_paused?H`<span class="running-op-status externally-paused-text">${this._localize("target.externally_paused")}</span>`:""}
            </span>
          </div>
        </div>
        <div class="running-op-actions">
          ${e.externally_paused?H`
                <ha-icon-button
                  .label=${this._localize("target.resume_control")}
                  @click=${()=>this._resumeEntityControl(e.entity_id)}
                >
                  <ha-icon icon="mdi:play-circle-outline"></ha-icon>
                </ha-icon-button>
              `:H`
                <ha-icon-button
                  .label=${e.paused?this._localize("target.resume"):this._localize("target.pause")}
                  @click=${()=>this._toggleSequencePause(e)}
                >
                  <ha-icon icon="mdi:${e.paused?"play":"pause"}"></ha-icon>
                </ha-icon-button>
              `}
          <ha-icon-button
            .label=${this._localize("target.stop")}
            @click=${()=>this._stopRunningSequence(e)}
          >
            <ha-icon icon="mdi:stop"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `}_renderSceneOp(e){const t=this._resolvePresetInfo(e.preset_id),i=(e.entity_ids||[]).map(e=>this._getEntityName(e)).join(", "),s=e.externally_paused_entities||[];return H`
      <div class="running-op-card">
        <div class="running-op-info">
          <ha-icon class="running-op-icon" icon="${t.icon||"mdi:palette-swatch-variant"}"></ha-icon>
          <div class="running-op-details">
            <span class="running-op-name">${t.name||this._localize("target.scene_button")}</span>
            <span class="running-op-entity">
              <span class="running-op-entity-name">${i}</span>
              ${e.paused?H`<span class="running-op-status">${this._localize("target.paused")}</span>`:""}
              ${s.length>0?H`<span class="running-op-status externally-paused-text">
                    ${this._localize("target.entities_externally_paused",{count:String(s.length)})}
                  </span>`:""}
            </span>
          </div>
        </div>
        <div class="running-op-actions">
          ${s.length>0?H`
                <ha-icon-button
                  .label=${this._localize("target.resume_control")}
                  @click=${()=>this._resumeSceneEntities(s)}
                >
                  <ha-icon icon="mdi:play-circle-outline"></ha-icon>
                </ha-icon-button>
              `:""}
          <ha-icon-button
            .label=${e.paused?this._localize("target.resume"):this._localize("target.pause")}
            @click=${()=>this._toggleScenePause(e)}
          >
            <ha-icon icon="mdi:${e.paused?"play":"pause"}"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            .label=${this._localize("target.stop")}
            @click=${()=>this._stopRunningScene(e)}
          >
            <ha-icon icon="mdi:stop"></ha-icon>
          </ha-icon-button>
        </div>
      </div>
    `}async _stopRunningEffect(e){await this.hass.callService("aqara_advanced_lighting","stop_effect",{entity_id:[e],restore_state:!0})}async _toggleSequencePause(e){if(!e.entity_id)return;const t="cct_sequence"===e.type,i=e.paused?t?"resume_cct_sequence":"resume_segment_sequence":t?"pause_cct_sequence":"pause_segment_sequence";await this.hass.callService("aqara_advanced_lighting",i,{entity_id:[e.entity_id]})}async _stopRunningSequence(e){if(!e.entity_id)return;const t="cct_sequence"===e.type?"stop_cct_sequence":"stop_segment_sequence";await this.hass.callService("aqara_advanced_lighting",t,{entity_id:[e.entity_id]})}async _toggleScenePause(e){if(!e.entity_ids?.length)return;const t=e.paused?"resume_dynamic_scene":"pause_dynamic_scene";await this.hass.callService("aqara_advanced_lighting",t,{entity_id:e.entity_ids})}async _stopRunningScene(e){e.entity_ids?.length&&await this.hass.callService("aqara_advanced_lighting","stop_dynamic_scene",{entity_id:e.entity_ids})}async _resumeEntityControl(e){await this.hass.callService("aqara_advanced_lighting","resume_entity_control",{entity_id:[e]})}async _resumeSceneEntities(e){await this.hass.callService("aqara_advanced_lighting","resume_entity_control",{entity_id:e})}_getUserEffectPresetsForDeviceType(e){return this._userPresets?.effect_presets?this._userPresets.effect_presets.filter(t=>!t.device_type||("t1m"===e&&("t1"===t.device_type||"t1m"===t.device_type)||t.device_type===e)):[]}_getUserPatternPresetsForDeviceType(e){return this._userPresets?.segment_pattern_presets?this._userPresets.segment_pattern_presets.filter(t=>!t.device_type||("t1m"===e&&("t1"===t.device_type||"t1m"===t.device_type)||t.device_type===e)):[]}_getFilteredUserCCTSequencePresets(){if(!this._userPresets?.cct_sequence_presets)return[];return this._getSelectedDeviceTypes().length>0?this._userPresets.cct_sequence_presets:[]}_getUserSegmentSequencePresetsForDeviceType(e){return this._userPresets?.segment_sequence_presets?this._userPresets.segment_sequence_presets.filter(t=>!t.device_type||("t1m"===e&&("t1"===t.device_type||"t1m"===t.device_type)||t.device_type===e)):[]}_getFilteredUserDynamicScenePresets(){if(!this._userPresets?.dynamic_scene_presets)return[];return this._getSelectedDeviceTypes().length>0?this._userPresets.dynamic_scene_presets:[]}async _activateUserEffectPreset(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,effect:e.effect,speed:e.effect_speed,preset:e.name,turn_on:!0,sync:!0};e.effect_colors.forEach((e,i)=>{i<8&&(t[`color_${i+1}`]={x:e.x,y:e.y})}),void 0!==e.effect_brightness?t.brightness=e.effect_brightness:this._useCustomBrightness&&(t.brightness=this._brightness),e.effect_segments&&(t.segments=e.effect_segments),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",t)}async _activateUserPatternPreset(e){if(!this._selectedEntities.length)return;if(!e.segments||!Array.isArray(e.segments)||0===e.segments.length)return void console.warn("Pattern preset has no segments:",e.name);const t=e.segments.filter(e=>e&&e.color).map(e=>({segment:e.segment,color:{r:e.color.r,g:e.color.g,b:e.color.b}}));if(0===t.length)return void console.warn("Pattern preset has no valid segments after filtering:",e.name);const i={entity_id:this._selectedEntities,segment_colors:t,preset:e.name,turn_on:!0,sync:!0,turn_off_unspecified:!0};this._useCustomBrightness&&(i.brightness=this._brightness);try{await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",i)}catch(e){console.error("Failed to activate pattern preset:",e)}}async _activateUserCCTSequencePreset(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,preset:e.name,loop_mode:e.loop_mode,end_behavior:e.end_behavior,turn_on:!0,sync:!0};"count"===e.loop_mode&&void 0!==e.loop_count&&(t.loop_count=e.loop_count),e.steps.forEach((e,i)=>{const s=i+1;s<=20&&(t[`step_${s}_color_temp`]=e.color_temp,t[`step_${s}_brightness`]=e.brightness,t[`step_${s}_transition`]=e.transition,t[`step_${s}_hold`]=e.hold)}),await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",t)}async _activateUserSegmentSequencePreset(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,preset:e.name,loop_mode:e.loop_mode,end_behavior:e.end_behavior,turn_on:!0,sync:!0};"count"===e.loop_mode&&void 0!==e.loop_count&&(t.loop_count=e.loop_count),e.steps.forEach((e,i)=>{const s=i+1;s<=20&&(t[`step_${s}_segments`]=e.segments,t[`step_${s}_mode`]=e.mode,t[`step_${s}_duration`]=e.duration,t[`step_${s}_hold`]=e.hold,t[`step_${s}_activation_pattern`]=e.activation_pattern,e.colors&&Array.isArray(e.colors)&&e.colors.forEach((e,i)=>{i<6&&(t[`step_${s}_color_${i+1}`]=e)}))}),await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",t)}async _activateUserDynamicScenePreset(e){if(!this._selectedEntities.length)return;const t=this._useCustomBrightness?this._brightness:null,i={entity_id:this._selectedEntities,scene_name:e.name,transition_time:e.transition_time,hold_time:e.hold_time,distribution_mode:e.distribution_mode,random_order:e.random_order,loop_mode:e.loop_mode,end_behavior:e.end_behavior};void 0!==e.offset_delay&&e.offset_delay>0&&(i.offset_delay=e.offset_delay),"loop"===e.loop_mode&&void 0!==e.loop_count&&(i.loop_count=e.loop_count),i.colors=e.colors.map(e=>({x:e.x,y:e.y,brightness_pct:t??e.brightness_pct})),this._useStaticSceneMode&&(i.static=!0),await this.hass.callService("aqara_advanced_lighting","start_dynamic_scene",i)}render(){if(this._loading)return H`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">${this._localize("title")}</div>
          </div>
        </div>
        <div class="content">
          <div class="loading">${this._localize("errors.loading_presets")}</div>
        </div>
      `;if(this._error)return H`
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
      `;if(!this._presets)return H`
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
      `;const e=this._backendVersion&&this._backendVersion!==this._frontendVersion;return H`
      <div class="header">
        <div class="toolbar">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <div class="main-title">${this._localize("title")}</div>
          ${this._backendVersion?H`
            <div
              class="version-display ${e?"version-mismatch":""}"
              title="${e?this._localize("tooltips.version_mismatch",{backend:this._backendVersion,frontend:this._frontendVersion}):`v${this._backendVersion}`}"
            >
              ${this._setupComplete?"":H`
                <span class="setup-badge" title="${this._localize("tooltips.setup_in_progress")}">${this._localize("status.setting_up")}</span>
              `}
              ${e?H`
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                <span class="version-text">v${this._backendVersion} / v${this._frontendVersion}</span>
              `:H`
                <span class="version-text">v${this._backendVersion}</span>
              `}
            </div>
          `:""}
        </div>
        <ha-tab-group @wa-tab-show=${this._handleTabChange}>
          <ha-tab-group-tab slot="nav" panel="activate" .active=${"activate"===this._activeTab}>
            ${this._localize("tabs.activate")}
          </ha-tab-group-tab>
          <ha-tab-group-tab slot="nav" panel="scenes" .active=${"scenes"===this._activeTab}>
            ${this._localize("tabs.scenes")}
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
    `}_renderTabContent(){switch(this._activeTab){case"activate":default:return this._renderActivateTab();case"effects":return this._renderEffectsTab();case"patterns":return this._renderPatternsTab();case"cct":return this._renderCCTTab();case"segments":return this._renderSegmentsTab();case"scenes":return this._renderScenesTab();case"presets":return this._renderPresetsTab();case"config":return this._renderConfigTab()}}_renderActivateTab(){const e=this._filterPresets(),t=this._selectedEntities.length>0,i="target_controls",s=!this._collapsed[i];return H`
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
                    .selector=${{entity:{multiple:!0,domain:"light",...!this._includeAllLights&&this._supportedEntities.size>0?{include_entities:Array.from(this._supportedEntities.keys())}:{}}}}
                    .value=${this._selectedEntities}
                    @value-changed=${this._handleEntityChanged}
                  ></ha-selector>
                  <div class="include-all-lights-toggle">
                    <label class="toggle-label">
                      <ha-switch
                        .checked=${this._includeAllLights}
                        @change=${this._handleIncludeAllLightsToggle}
                        title="${this._localize("target.include_all_lights_hint")}"
                      ></ha-switch>
                      <span>${this._localize("target.include_all_lights_label")}</span>
                    </label>
                  </div>
                </div>
                ${t&&!this._showFavoriteInput?H`
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

            ${this._favorites.length>0?H`
                  <div class="control-row">
                    <span class="control-label">${this._localize("target.favorites_label")}</span>
                    <div class="control-input favorites-container">
                      ${this._favorites.map(e=>{const t=e.entities[0]||"",i=this._getEntityIcon(t),s=e.entities.length,o=this._getEntityState(t),n=this._getEntityColor(t),r="on"===o,a="unavailable"===o||"unknown"===o,l=this._activeFavoriteId===e.id;let c="",d="";if(n){const e=n.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);if(e){const[,t,i,s]=e;c=`background: rgba(${t}, ${i}, ${s}, 0.2);`,d=`color: ${n};`}}return H`
                          <div class="favorite-button ${r?"state-on":"state-off"} ${a?"state-unavailable":""} ${l?"selected":""}" @click=${()=>this._selectFavorite(e)}>
                            <div class="favorite-button-icon" style="${c}">
                              <ha-icon icon="${i}" style="${d}"></ha-icon>
                            </div>
                            <div class="favorite-button-content">
                              <div class="favorite-button-name">${e.name}</div>
                              ${s>1?H`<div class="favorite-button-count">${this._localize("target.favorite_lights_count",{count:s.toString()})}</div>`:""}
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

          ${this._showFavoriteInput?H`
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

          ${t?H`
                <div class="control-row">
                  <span class="control-label">${this._localize("target.light_control_label")}</span>
                  <div class="control-input light-tile-container" ${ke(this._tileCardRef)}>
                  </div>
                </div>
              `:""}
        </div>
      </ha-expansion-panel>

      ${t?H`
            <ha-expansion-panel
              outlined
              .expanded=${!this._collapsed.activation_overrides}
              @expanded-changed=${e=>this._handleExpansionChange("activation_overrides",e)}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize("target.activation_overrides_title")}</div>
                </div>
              </div>
              <div class="section-content controls-content">
                <div class="overrides-grid">
                  <div class="override-item">
                    <span class="form-label">${this._localize("target.custom_brightness_label")}</span>
                    <ha-switch
                      .checked=${this._useCustomBrightness}
                      @change=${this._handleCustomBrightnessToggle}
                    ></ha-switch>
                  </div>

                  <div class="override-item">
                    <span class="form-label">${this._localize("target.static_scene_mode_label")}</span>
                    <ha-switch
                      .checked=${this._useStaticSceneMode}
                      @change=${this._handleStaticSceneModeToggle}
                    ></ha-switch>
                  </div>

                  <div class="override-item">
                    <span class="form-label">${this._localize("target.ignore_external_changes_label")}</span>
                    <ha-switch
                      .checked=${this._ignoreExternalChanges}
                      @change=${this._handleIgnoreExternalChangesToggle}
                    ></ha-switch>
                  </div>
                </div>

                ${this._useCustomBrightness?H`
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
            </ha-expansion-panel>
          `:""}

      ${t||this._runningOperations.length>0?H`
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
                ${this._renderRunningOperations()}
              </div>
            </ha-expansion-panel>
          `:""}

      ${t?"":H`<div class="no-lights">${this._localize("target.no_lights_message")}</div>`}

      ${this._hasIncompatibleLights?H`
            <ha-alert alert-type="error" title="${this._localize("errors.incompatible_light_title")}">
              ${this._localize("errors.incompatible_light_message")}
            </ha-alert>
          `:""}

      ${t&&!this._hasIncompatibleLights?this._renderFavoritesSection(e):""}

      ${e.showDynamicScenes&&((this._presets?.dynamic_scenes?.length??0)>0||this._getFilteredUserDynamicScenePresets().length>0)&&!this._hasIncompatibleLights?this._renderDynamicScenesSection():""}

      ${e.showDynamicEffects&&!this._hasIncompatibleLights?H`
            ${e.hasT2&&(e.t2Presets.length>0||this._getUserEffectPresetsForDeviceType("t2_bulb").length>0)?this._renderDynamicEffectsSection(this._localize("devices.t2_bulb"),e.t2Presets,"t2_bulb"):""}
            ${e.hasT1M&&(e.t1mPresets.length>0||this._getUserEffectPresetsForDeviceType("t1m").length>0)?this._renderDynamicEffectsSection(this._localize("devices.t1m"),e.t1mPresets,"t1m"):""}
            ${e.hasT1Strip&&(e.t1StripPresets.length>0||this._getUserEffectPresetsForDeviceType("t1_strip").length>0)?this._renderDynamicEffectsSection(this._localize("devices.t1_strip"),e.t1StripPresets,"t1_strip"):""}
          `:""}

      ${e.showSegmentPatterns&&!this._hasIncompatibleLights?H`
            ${e.hasT1M&&((this._presets?.segment_patterns?.length??0)>0||this._getUserPatternPresetsForDeviceType("t1m").length>0)?this._renderSegmentPatternsSection(this._localize("devices.t1m"),this._presets?.segment_patterns||[],"t1m"):""}
            ${e.hasT1Strip&&((this._presets?.segment_patterns?.length??0)>0||this._getUserPatternPresetsForDeviceType("t1_strip").length>0)?this._renderSegmentPatternsSection(this._localize("devices.t1_strip"),this._presets?.segment_patterns||[],"t1_strip"):""}
          `:""}

      ${e.showCCTSequences&&((this._presets?.cct_sequences?.length??0)>0||this._getFilteredUserCCTSequencePresets().length>0)&&!this._hasIncompatibleLights?this._renderCCTSequencesSection():""}

      ${e.showSegmentSequences&&!this._hasIncompatibleLights?H`
            ${e.hasT1M&&((this._presets?.segment_sequences?.length??0)>0||this._getUserSegmentSequencePresetsForDeviceType("t1m").length>0)?this._renderSegmentSequencesSection(this._localize("devices.t1m"),this._presets?.segment_sequences||[],"t1m"):""}
            ${e.hasT1Strip&&((this._presets?.segment_sequences?.length??0)>0||this._getUserSegmentSequencePresetsForDeviceType("t1_strip").length>0)?this._renderSegmentSequencesSection(this._localize("devices.t1_strip"),this._presets?.segment_sequences||[],"t1_strip"):""}
          `:""}
    `}_renderEffectsTab(){const e="effect"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isEffectsCompatible(),i=this._selectedEntities.length>0;return H`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_effect_title"):this._localize("dialogs.create_effect_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_effect_description"):this._localize("dialogs.create_effect_description")}
        </p>
        ${i&&!t?H`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_effects")}
          </ha-alert>
        `:""}
        <effect-editor
          .hass=${this.hass}
          .preset=${e}
          .draft=${this._getEditorDraft("effects")}
          .translations=${this._translations}
          .editMode=${!!e&&!this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .previewActive=${this._effectPreviewActive}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          .deviceContext=${this._getDeviceContextForEditor("effect")}
          .colorHistory=${this._colorHistory}
          @save=${this._handleEffectSave}
          @preview=${this._handleEffectPreview}
          @stop-preview=${this._handleEffectStopPreview}
          @cancel=${this._handleEditorCancel}
        ></effect-editor>
      </ha-card>
    `}async _handleEffectSave(e){if("effect"!==this._editingPreset?.type||this._editingPreset.isDuplicate)await this._saveUserPreset("effect",e.detail);else{const t=this._editingPreset.preset;await this._updateUserPreset("effect",t.id,e.detail)}this._clearEditorDraft("effects"),this._editingPreset=void 0,this._setActiveTab("presets")}_handleEditorCancel(){this._clearEditorDraft(this._activeTab),this._resetCurrentEditor(),this._editingPreset=void 0,this._setActiveTab("activate")}_resetCurrentEditor(){const e={effects:"effect-editor",patterns:"pattern-editor",cct:"cct-sequence-editor",segments:"segment-sequence-editor",scenes:"dynamic-scene-editor"}[this._activeTab];if(!e)return;const t=this.shadowRoot?.querySelector(e);t&&"function"==typeof t.resetToDefaults&&t.resetToDefaults()}async _handleEffectPreview(e){const t=this._getEffectsCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for effect preview");const i=e.detail,s={entity_id:t,effect:i.effect,speed:i.effect_speed,turn_on:!0,sync:!0};i.effect_colors&&i.effect_colors.forEach((e,t)=>{if(t<8)if("x"in e&&"y"in e&&void 0!==e.x&&void 0!==e.y){const i=Me(e.x,e.y,255);s[`color_${t+1}`]=[i.r,i.g,i.b]}else"r"in e&&"g"in e&&"b"in e&&(s[`color_${t+1}`]=[e.r,e.g,e.b])}),void 0!==i.effect_brightness&&(s.brightness=i.effect_brightness),i.effect_segments&&(s.segments=i.effect_segments),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",s),this._effectPreviewActive=!0}async _handleEffectStopPreview(){const e=this._getEffectsCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_effect",{entity_id:e,restore_state:!0}),this._effectPreviewActive=!1)}_renderPatternsTab(){const e="pattern"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isPatternsCompatible(),i=this._selectedEntities.length>0;return H`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_pattern_title"):this._localize("dialogs.create_pattern_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_pattern_description"):this._localize("dialogs.create_pattern_description")}
        </p>
        ${i&&!t?H`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_patterns")}
          </ha-alert>
        `:""}
        <pattern-editor
          .hass=${this.hass}
          .preset=${e}
          .draft=${this._getEditorDraft("patterns")}
          .translations=${this._translations}
          .editMode=${!!e&&!this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          .deviceContext=${this._getDeviceContextForEditor("pattern")}
          .colorHistory=${this._colorHistory}
          @save=${this._handlePatternSave}
          @preview=${this._handlePatternPreview}
          @cancel=${this._handleEditorCancel}
        ></pattern-editor>
      </ha-card>
    `}async _handlePatternSave(e){if("pattern"!==this._editingPreset?.type||this._editingPreset.isDuplicate)await this._saveUserPreset("segment_pattern",e.detail);else{const t=this._editingPreset.preset;await this._updateUserPreset("segment_pattern",t.id,e.detail)}this._clearEditorDraft("patterns"),this._editingPreset=void 0,this._setActiveTab("presets")}async _handlePatternPreview(e){const t=this._getPatternsCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for pattern preview");const i=e.detail;if(!i.segments||!Array.isArray(i.segments))return void console.error("Pattern preview: No segments in data");const s=i.segments.map(e=>({segment:e.segment,color:{r:e.color.r,g:e.color.g,b:e.color.b}}));try{await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",{entity_id:t,segment_colors:s,turn_on:!0,turn_off_unspecified:i.turn_off_unspecified??!0,sync:!0})}catch(e){console.error("Pattern preview service call failed:",e)}}_renderCCTTab(){const e="cct"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isCCTCompatible(),i=this._selectedEntities.length>0;return H`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_cct_title"):this._localize("dialogs.create_cct_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_cct_description"):this._localize("dialogs.create_cct_description")}
        </p>
        ${i&&!t?H`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_cct")}
          </ha-alert>
        `:""}
        <cct-sequence-editor
          .hass=${this.hass}
          .preset=${e}
          .draft=${this._getEditorDraft("cct")}
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
    `}async _handleCCTSave(e){if("cct"!==this._editingPreset?.type||this._editingPreset.isDuplicate)await this._saveUserPreset("cct_sequence",e.detail);else{const t=this._editingPreset.preset;await this._updateUserPreset("cct_sequence",t.id,e.detail)}this._clearEditorDraft("cct"),this._editingPreset=void 0,this._setActiveTab("presets")}async _handleCCTPreview(e){const t=this._getCCTCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for CCT preview");const i=e.detail,s={entity_id:t,loop_mode:i.loop_mode,end_behavior:i.end_behavior,turn_on:!0,sync:!0};"count"===i.loop_mode&&void 0!==i.loop_count&&(s.loop_count=i.loop_count),i.steps&&Array.isArray(i.steps)&&i.steps.forEach((e,t)=>{const i=t+1;i<=20&&(s[`step_${i}_color_temp`]=e.color_temp,s[`step_${i}_brightness`]=e.brightness,s[`step_${i}_transition`]=e.transition,s[`step_${i}_hold`]=e.hold)}),await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",s),this._cctPreviewActive=!0}async _handleCCTStopPreview(){const e=this._getCCTCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_cct_sequence",{entity_id:e}),this._cctPreviewActive=!1)}_renderSegmentsTab(){const e="segment"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isSegmentsCompatible(),i=this._selectedEntities.length>0;return H`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_segment_title"):this._localize("dialogs.create_segment_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_segment_description"):this._localize("dialogs.create_segment_description")}
        </p>
        ${i&&!t?H`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_segments")}
          </ha-alert>
        `:""}
        <segment-sequence-editor
          .hass=${this.hass}
          .preset=${e}
          .draft=${this._getEditorDraft("segments")}
          .translations=${this._translations}
          .editMode=${!!e&&!this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .previewActive=${this._segmentSequencePreviewActive}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          .deviceContext=${this._getDeviceContextForEditor("segment")}
          .colorHistory=${this._colorHistory}
          @save=${this._handleSegmentSequenceSave}
          @preview=${this._handleSegmentSequencePreview}
          @stop-preview=${this._handleSegmentSequenceStopPreview}
          @cancel=${this._handleEditorCancel}
        ></segment-sequence-editor>
      </ha-card>
    `}async _handleSegmentSequenceSave(e){if("segment"!==this._editingPreset?.type||this._editingPreset.isDuplicate)await this._saveUserPreset("segment_sequence",e.detail);else{const t=this._editingPreset.preset;await this._updateUserPreset("segment_sequence",t.id,e.detail)}this._clearEditorDraft("segments"),this._editingPreset=void 0,this._setActiveTab("presets")}async _handleSegmentSequencePreview(e){const t=this._getSegmentsCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for segment sequence preview");const i=e.detail,s={entity_id:t,loop_mode:i.loop_mode,end_behavior:i.end_behavior,clear_segments:i.clear_segments||!1,skip_first_in_loop:i.skip_first_in_loop||!1,turn_on:!0,sync:!0};"count"===i.loop_mode&&void 0!==i.loop_count&&(s.loop_count=i.loop_count),i.steps&&Array.isArray(i.steps)&&i.steps.forEach((e,t)=>{const i=t+1;i<=20&&(s[`step_${i}_segments`]=e.segments,s[`step_${i}_mode`]=e.mode,s[`step_${i}_duration`]=e.duration,s[`step_${i}_hold`]=e.hold,s[`step_${i}_activation_pattern`]=e.activation_pattern,e.segment_colors&&Array.isArray(e.segment_colors)&&e.segment_colors.length>0?s[`step_${i}_segment_colors`]=e.segment_colors:e.colors&&Array.isArray(e.colors)&&e.colors.forEach((e,t)=>{t<6&&(s[`step_${i}_color_${t+1}`]=e)}))}),await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",s),this._segmentSequencePreviewActive=!0}async _handleSegmentSequenceStopPreview(){const e=this._getSegmentsCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_segment_sequence",{entity_id:e}),this._segmentSequencePreviewActive=!1)}_isScenesCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];return!!t&&this._hasRGBColorMode(t)})}_getScenesCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];return!!t&&this._hasRGBColorMode(t)}):[]}_renderScenesTab(){const e="dynamic_scene"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isScenesCompatible(),i=this._selectedEntities.length>0;return H`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_scene_title"):this._localize("dialogs.create_scene_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_scene_description"):this._localize("dialogs.create_scene_description")}
        </p>
        ${i&&!t?H`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_scenes")}
          </ha-alert>
        `:""}
        <dynamic-scene-editor
          .hass=${this.hass}
          .preset=${e}
          .draft=${this._getEditorDraft("scenes")}
          .translations=${this._translations}
          .editMode=${!!e&&!this._editingPreset?.isDuplicate}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .selectedEntities=${this._selectedEntities}
          .previewActive=${this._scenePreviewActive}
          .colorHistory=${this._colorHistory}
          @save=${this._handleSceneSave}
          @preview=${this._handleScenePreview}
          @stop-preview=${this._handleSceneStopPreview}
          @cancel=${this._handleEditorCancel}
          @color-history-changed=${this._handleColorHistoryChanged}
        ></dynamic-scene-editor>
      </ha-card>
    `}async _handleSceneSave(e){if("dynamic_scene"!==this._editingPreset?.type||this._editingPreset.isDuplicate)await this._saveUserPreset("dynamic_scene",e.detail);else{const t=this._editingPreset.preset;await this._updateUserPreset("dynamic_scene",t.id,e.detail)}this._clearEditorDraft("scenes"),this._editingPreset=void 0,this._setActiveTab("presets")}async _handleScenePreview(e){const t=this._getScenesCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for scene preview");const i=e.detail,s={entity_id:t,transition_time:i.transition_time,hold_time:i.hold_time,distribution_mode:i.distribution_mode,random_order:i.random_order,loop_mode:i.loop_mode,end_behavior:i.end_behavior};void 0!==i.offset_delay&&i.offset_delay>0&&(s.offset_delay=i.offset_delay),"loop"===i.loop_mode&&void 0!==i.loop_count&&(s.loop_count=i.loop_count),i.colors&&Array.isArray(i.colors)&&(s.colors=i.colors.map(e=>({x:e.x,y:e.y,brightness_pct:e.brightness_pct}))),await this.hass.callService("aqara_advanced_lighting","start_dynamic_scene",s),this._scenePreviewActive=!0}async _handleSceneStopPreview(){const e=this._getScenesCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_dynamic_scene",{entity_id:e}),this._scenePreviewActive=!1)}async _handleExportPresets(){this._isExporting=!0,this.requestUpdate();try{const e=await fetch("/api/aqara_advanced_lighting/presets/export",{method:"GET",headers:{Authorization:`Bearer ${this.hass.auth.data.access_token}`}});if(!e.ok)throw new Error(`Export failed: ${e.statusText}`);const t=e.headers.get("Content-Disposition"),i=t?.match(/filename="(.+)"/),s=i?.[1]||"aqara_presets_backup.json",o=await e.blob(),n=window.URL.createObjectURL(o),r=document.createElement("a");r.href=n,r.download=s,document.body.appendChild(r),r.click(),window.URL.revokeObjectURL(n),document.body.removeChild(r),this._showToast(this._localize("presets.export_success"))}catch(e){this._showToast(this._localize("presets.export_error_network")),console.error("Export error:",e)}finally{this._isExporting=!1,this.requestUpdate()}}_handleImportClick(){this._fileInputRef||(this._fileInputRef=document.createElement("input"),this._fileInputRef.type="file",this._fileInputRef.accept=".json,application/json",this._fileInputRef.addEventListener("change",e=>{const t=e.target;t.files&&t.files[0]&&this._handleImportFile(t.files[0])})),this._fileInputRef.click()}async _handleImportFile(e){this._isImporting=!0,this.requestUpdate();try{const t=await e.text(),i=JSON.parse(t),s=await this.hass.callApi("POST","aqara_advanced_lighting/presets/import",i),o=Object.values(s.counts).reduce((e,t)=>e+t,0);this._showToast(this._localize("presets.import_success",{count:o.toString()})),await this._loadUserPresets()}catch(e){let t=this._localize("presets.import_error_unknown");e instanceof SyntaxError?t=this._localize("presets.import_error_invalid_file"):e instanceof Error&&(t=e.message),this._showToast(t),console.error("Import error:",e)}finally{this._isImporting=!1,this.requestUpdate()}}_showToast(e){const t=new CustomEvent("hass-notification",{detail:{message:e,duration:3e3},bubbles:!0,composed:!0});this.dispatchEvent(t)}_renderPresetsTab(){const e=this._userPresets?.effect_presets||[],t=this._userPresets?.segment_pattern_presets||[],i=this._userPresets?.cct_sequence_presets||[],s=this._userPresets?.segment_sequence_presets||[],o=this._userPresets?.dynamic_scene_presets||[],n=e.length+t.length+i.length+s.length+o.length,r="my_presets_overview",a=!this._collapsed[r];return H`
      <ha-expansion-panel
        outlined
        .expanded=${a}
        @expanded-changed=${e=>this._handleExpansionChange(r,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("tabs.presets")}</div>
            <div class="section-subtitle">
              ${this._localize("sections.subtitle_user_presets",{count:n.toString()})}
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

      ${0===n?H`
            <div class="no-presets">
              <ha-icon icon="mdi:folder-open-outline"></ha-icon>
              <p>${this._localize("presets.no_presets_title")}</p>
              <p>${this._localize("presets.no_presets_description")}</p>
            </div>
          `:H`
            ${this._renderPresetDeviceSections(this._localize("sections.dynamic_effects"),"presets_effects",e,e=>this._editEffectPreset(e),"effect",e=>this._renderUserEffectIcon(e),(e,t)=>this._sortUserEffectPresets(e,t),e=>this._duplicateUserEffectPreset(e))}

            ${this._renderPresetDeviceSections(this._localize("sections.segment_patterns"),"presets_patterns",t,e=>this._editPatternPreset(e),"segment_pattern",e=>this._renderUserPatternIcon(e),(e,t)=>this._sortUserPatternPresets(e,t),e=>this._duplicateUserPatternPreset(e))}

            ${i.length>0?this._renderPresetSection(this._localize("sections.cct_sequences"),"presets_cct",i,e=>this._editCCTSequencePreset(e),"cct_sequence",e=>this._renderUserCCTIcon(e),(e,t)=>this._sortUserCCTSequencePresets(e,t),e=>this._duplicateUserCCTSequencePreset(e)):""}

            ${this._renderPresetDeviceSections(this._localize("sections.segment_sequences"),"presets_segments",s,e=>this._editSegmentSequencePreset(e),"segment_sequence",e=>this._renderUserSegmentSequenceIcon(e),(e,t)=>this._sortUserSegmentSequencePresets(e,t),e=>this._duplicateUserSegmentSequencePreset(e))}

            ${o.length>0?this._renderPresetSection(this._localize("sections.dynamic_scenes"),"presets_scenes",o,e=>this._editDynamicScenePreset(e),"dynamic_scene",e=>this._renderUserDynamicSceneIcon(e),(e,t)=>this._sortUserDynamicScenePresets(e,t),e=>this._duplicateUserDynamicScenePreset(e)):""}
          `}
    `}_renderPresetDeviceSections(e,t,i,s,o,n,r,a){if(0===i.length)return"";const{ungrouped:l,grouped:c}=this._groupPresetsByDeviceType(i);return H`
      ${l.length>0?this._renderPresetSection(e,t,l,s,o,n,r,a):""}
      ${Et.PRESET_DEVICE_TYPES.map(i=>{const l=c.get(i);if(!l?.length)return"";const d=this._localize(`devices.${i}`);return this._renderPresetSection(`${e}: ${d}`,`${t}_${i}`,l,s,o,n,r,a)})}
    `}_renderPresetSection(e,t,i,s,o,n,r,a){const l=!this._collapsed[t],c=r(i,this._getSortPreference(t));return H`
      <ha-expansion-panel
        outlined
        .expanded=${l}
        @expanded-changed=${e=>this._handleExpansionChange(t,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${e}</div>
            <div class="section-subtitle">${this._localize("presets.presets_count",{count:i.length.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(t)}
          </div>
        </div>
        <div class="section-content preset-grid">
          ${c.map(e=>this._renderPresetCard(e,s,o,n,a))}
        </div>
      </ha-expansion-panel>
    `}_renderPresetCard(e,t,i,s,o){return H`
      <div
        class="user-preset-card"
        title="${e.name}"
      >
        <div class="preset-card-actions">
          <ha-icon-button
            @click=${i=>{i.stopPropagation(),t(e)}}
            title="${this._localize("tooltips.preset_edit")}"
          >
            <ha-icon icon="mdi:pencil"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            @click=${t=>{t.stopPropagation(),o(e)}}
            title="${this._localize("tooltips.preset_duplicate")}"
          >
            <ha-icon icon="mdi:content-copy"></ha-icon>
          </ha-icon-button>
          <ha-icon-button
            @click=${t=>{t.stopPropagation(),this._deleteUserPreset(i,e.id)}}
            title="${this._localize("tooltips.preset_delete")}"
          >
            <ha-icon icon="mdi:delete"></ha-icon>
          </ha-icon-button>
        </div>
        <div class="preset-icon">
          ${s(e)}
        </div>
        <div class="preset-name">${e.name}</div>
      </div>
    `}_editEffectPreset(e){this._clearEditorDraft("effects"),this._editingPreset={type:"effect",preset:e},this._setActiveTab("effects")}_editPatternPreset(e){this._clearEditorDraft("patterns"),this._editingPreset={type:"pattern",preset:e},this._setActiveTab("patterns")}_editCCTSequencePreset(e){this._clearEditorDraft("cct"),this._editingPreset={type:"cct",preset:e},this._setActiveTab("cct")}_editSegmentSequencePreset(e){this._clearEditorDraft("segments"),this._editingPreset={type:"segment",preset:e},this._setActiveTab("segments")}_duplicateUserEffectPreset(e){const t={...e,id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,created_at:"",modified_at:""};this._clearEditorDraft("effects"),this._editingPreset={type:"effect",preset:t,isDuplicate:!0},this._setActiveTab("effects")}_duplicateUserPatternPreset(e){const t={...e,id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,created_at:"",modified_at:""};this._clearEditorDraft("patterns"),this._editingPreset={type:"pattern",preset:t,isDuplicate:!0},this._setActiveTab("patterns")}_duplicateUserCCTSequencePreset(e){const t={...e,id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,created_at:"",modified_at:""};this._clearEditorDraft("cct"),this._editingPreset={type:"cct",preset:t,isDuplicate:!0},this._setActiveTab("cct")}_duplicateUserSegmentSequencePreset(e){const t={...e,id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,created_at:"",modified_at:""};this._clearEditorDraft("segments"),this._editingPreset={type:"segment",preset:t,isDuplicate:!0},this._setActiveTab("segments")}_editDynamicScenePreset(e){this._clearEditorDraft("scenes"),this._editingPreset={type:"dynamic_scene",preset:e},this._setActiveTab("scenes")}_duplicateUserDynamicScenePreset(e){const t={...e,id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,created_at:"",modified_at:""};this._clearEditorDraft("scenes"),this._editingPreset={type:"dynamic_scene",preset:t,isDuplicate:!0},this._setActiveTab("scenes")}_duplicateBuiltinEffectPreset(e,t){const i={id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,effect:e.effect,effect_speed:e.speed,effect_brightness:null!=e.brightness?Math.round(e.brightness/255*100):100,effect_colors:e.colors.map(e=>De(e[0],e[1],e[2])),device_type:t,created_at:"",modified_at:""};this._clearEditorDraft("effects"),this._editingPreset={type:"effect",preset:i,isDuplicate:!0},this._setActiveTab("effects")}_getDeviceSegmentCount(e){switch(e){case"t1":return 20;case"t1m":default:return 26;case"t1_strip":return this._getT1StripSegmentCount()}}_scaleSegmentPattern(e,t){const i=e.length;return t<1||i<1?[]:t===i?[...e]:Array.from({length:t},(s,o)=>e[Math.floor(o*i/t)])}_duplicateBuiltinPatternPreset(e,t){const i=this._getDeviceSegmentCount(t),s=this._scaleSegmentPattern(e.segments,i),o={id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,device_type:t,segments:s.map((e,t)=>({segment:t+1,color:{r:e[0],g:e[1],b:e[2]}})),created_at:"",modified_at:""};this._clearEditorDraft("patterns"),this._editingPreset={type:"pattern",preset:o,isDuplicate:!0},this._setActiveTab("patterns")}_duplicateBuiltinCCTSequencePreset(e){const t={id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,steps:e.steps.map(e=>({...e,brightness:Math.round(e.brightness/255*100)})),loop_mode:e.loop_mode,loop_count:e.loop_count,end_behavior:e.end_behavior,created_at:"",modified_at:""};this._clearEditorDraft("cct"),this._editingPreset={type:"cct",preset:t,isDuplicate:!0},this._setActiveTab("cct")}_duplicateBuiltinSegmentSequencePreset(e,t){const i={id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,device_type:t,steps:e.steps.map(e=>({...e})),loop_mode:e.loop_mode,loop_count:e.loop_count,end_behavior:e.end_behavior,created_at:"",modified_at:""};this._clearEditorDraft("segments"),this._editingPreset={type:"segment",preset:i,isDuplicate:!0},this._setActiveTab("segments")}_duplicateBuiltinDynamicScenePreset(e){const t={id:"",name:`${e.name} ${this._localize("presets.copy_suffix")}`,colors:e.colors.map(e=>({...e})),transition_time:e.transition_time,hold_time:e.hold_time,distribution_mode:e.distribution_mode,offset_delay:e.offset_delay,random_order:e.random_order,loop_mode:e.loop_mode,loop_count:e.loop_count,end_behavior:e.end_behavior,created_at:"",modified_at:""};this._clearEditorDraft("scenes"),this._editingPreset={type:"dynamic_scene",preset:t,isDuplicate:!0},this._setActiveTab("scenes")}_renderSortDropdown(e){const t=this._getSortPreference(e);return H`
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
    `}_renderFavoritesSection(e){const t=this._getResolvedFavoritePresets(),i=t=>{if(!t)return!0;switch(t){case"t2_bulb":return e.hasT2;case"t1m":case"t1":return e.hasT1M;case"t1_strip":return e.hasT1Strip;default:return!0}},s=t.filter(({ref:t,deviceType:s})=>{switch(t.type){case"effect":return e.showDynamicEffects&&i(s);case"segment_pattern":return e.showSegmentPatterns&&i(s);case"cct_sequence":return e.showCCTSequences;case"segment_sequence":return e.showSegmentSequences&&i(s);case"dynamic_scene":return e.showDynamicScenes;default:return!1}});if(0===s.length)return"";const o="favorite_presets",n=!this._collapsed[o],r=this._getSortPreference(o),a=this._sortResolvedFavorites(s,r);return H`
      <ha-expansion-panel
        outlined
        .expanded=${n}
        @expanded-changed=${e=>this._handleExpansionChange(o,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("sections.favorite_presets")}</div>
            <div class="section-subtitle">${this._localize("sections.subtitle_favorites",{count:s.length.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(o)}
          </div>
        </div>
        <div class="section-content">
          ${a.map(({ref:e,preset:t,isUser:i})=>H`
            <div class="preset-button ${i?"user-preset":"builtin-preset"}" @click=${()=>this._activateFavoritePreset(e,t,i)}>
              <div class="preset-card-actions">
                ${this._renderFavoriteStar(e.type,e.id)}
              </div>
              <div class="preset-icon">
                ${this._renderFavoritePresetIcon(e,t,i)}
              </div>
              <div class="preset-name">${t.name}</div>
            </div>
          `)}
        </div>
      </ha-expansion-panel>
    `}_renderDynamicEffectsSection(e,t,i){const s=`dynamic_${e.toLowerCase().replace(/\s+/g,"_")}`,o=!this._collapsed[s],n=this._getUserEffectPresetsForDeviceType(i),r=n.length+t.length,a=this._getSortPreference(s),l=this._sortUserEffectPresets(n,a),c=this._sortDynamicEffectPresets(t,a);return H`
      <ha-expansion-panel
        outlined
        .expanded=${o}
        @expanded-changed=${e=>this._handleExpansionChange(s,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("sections.dynamic_effects")}: ${e}</div>
            <div class="section-subtitle">${n.length>0?this._localize("sections.subtitle_presets_custom",{count:r.toString(),custom:n.length.toString()}):this._localize("sections.subtitle_presets",{count:r.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(s)}
          </div>
        </div>
        <div class="section-content">
          ${l.map(e=>H`
              <div class="preset-button user-preset" @click=${()=>this._activateUserEffectPreset(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("effect",e.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserEffectIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${c.map(e=>H`
              <div class="preset-button builtin-preset" @click=${()=>this._activateDynamicEffect(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("effect",e.id)}
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
    `}_renderSegmentPatternsSection(e,t,i){const s=`segment_pat_${e.toLowerCase().replace(/\s+/g,"_")}`,o=!this._collapsed[s],n=this._getUserPatternPresetsForDeviceType(i),r=n.length+t.length,a=this._getSortPreference(s),l=this._sortUserPatternPresets(n,a),c=this._sortSegmentPatternPresets(t,a);return H`
      <ha-expansion-panel
        outlined
        .expanded=${o}
        @expanded-changed=${e=>this._handleExpansionChange(s,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("sections.segment_patterns")}: ${e}</div>
            <div class="section-subtitle">${n.length>0?this._localize("sections.subtitle_presets_custom",{count:r.toString(),custom:n.length.toString()}):this._localize("sections.subtitle_presets",{count:r.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(s)}
          </div>
        </div>
        <div class="section-content">
          ${l.map(e=>H`
              <div class="preset-button user-preset" @click=${()=>this._activateUserPatternPreset(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("segment_pattern",e.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserPatternIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${c.map(e=>H`
              <div class="preset-button builtin-preset" @click=${()=>this._activateSegmentPattern(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("segment_pattern",e.id)}
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
    `}_renderPresetIcon(e,t){return e?e.includes(".")?H`<img src="/api/aqara_advanced_lighting/icons/${e}" alt="preset icon" />`:H`<ha-icon icon="${e}"></ha-icon>`:H`<ha-icon icon="${t}"></ha-icon>`}_renderUserEffectIcon(e){return e.icon?this._renderPresetIcon(e.icon,"mdi:lightbulb-on"):function(e){const t=(e.effect_colors??[]).slice(0,8);if(0===t.length)return null;if(1===t.length){const e=Ve(t[0]);return H`${ot(Je(`<circle cx="200" cy="200" r="180" fill="${e}" />`))}`}const i=360/t.length,s=t.map((e,t)=>Ze(t*i,(t+1)*i,Ve(e))).join("");return H`${ot(Je(s))}`}(e)??H`<ha-icon icon="mdi:lightbulb-on"></ha-icon>`}_renderUserPatternIcon(e){return e.icon?this._renderPresetIcon(e.icon,"mdi:palette"):et(e)??H`<ha-icon icon="mdi:palette"></ha-icon>`}_renderUserCCTIcon(e){return e.icon?this._renderPresetIcon(e.icon,"mdi:temperature-kelvin"):function(e){const t=(e.steps??[]).map(e=>e.color_temp).filter(e=>null!=e);if(0===t.length)return null;if(1===t.length){const e=Xe(t[0]);return H`${ot(Qe(`<rect fill="${e}" x="10" y="10" width="380" height="380" rx="8" />`))}`}const i=`cct-${e.id}`,s=t.map((e,i)=>`<stop offset="${Math.round(i/(t.length-1)*100)}%" stop-color="${Xe(e)}" />`).join("");return H`${ot(Qe(`<defs><linearGradient id="${i}" x1="0" y1="0" x2="1" y2="0">${s}</linearGradient></defs><rect fill="url(#${i})" x="10" y="10" width="380" height="380" rx="8" />`))}`}(e)??H`<ha-icon icon="mdi:temperature-kelvin"></ha-icon>`}_renderUserSegmentSequenceIcon(e){return e.icon?this._renderPresetIcon(e.icon,"mdi:animation-play"):tt(e)??H`<ha-icon icon="mdi:animation-play"></ha-icon>`}_renderUserDynamicSceneIcon(e){return e.icon?this._renderPresetIcon(e.icon,"mdi:lamps"):st(e)??H`<ha-icon icon="mdi:lamps"></ha-icon>`}_renderBuiltinDynamicSceneIcon(e){return st(e)??H`<ha-icon icon="mdi:lamps"></ha-icon>`}_renderCCTSequencesSection(){const e="cct_sequences",t=!this._collapsed[e],i=this._getFilteredUserCCTSequencePresets(),s=this._presets.cct_sequences,o=i.length+s.length,n=this._getSortPreference(e),r=this._sortUserCCTSequencePresets(i,n),a=this._sortCCTSequencePresets(s,n);return H`
      <ha-expansion-panel
        outlined
        .expanded=${t}
        @expanded-changed=${t=>this._handleExpansionChange(e,t)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("sections.cct_sequences")}</div>
            <div class="section-subtitle">${i.length>0?this._localize("sections.subtitle_presets_custom",{count:o.toString(),custom:i.length.toString()}):this._localize("sections.subtitle_presets",{count:o.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(e)}
          </div>
        </div>
        <div class="section-content">
          ${r.map(e=>H`
              <div class="preset-button user-preset" @click=${()=>this._activateUserCCTSequencePreset(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("cct_sequence",e.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserCCTIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${a.map(e=>H`
              <div class="preset-button builtin-preset" @click=${()=>this._activateCCTSequence(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("cct_sequence",e.id)}
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
    `}_renderSegmentSequencesSection(e,t,i){const s=`segment_seq_${e.toLowerCase().replace(/\s+/g,"_")}`,o=!this._collapsed[s],n=this._getUserSegmentSequencePresetsForDeviceType(i),r=n.length+t.length,a=this._getSortPreference(s),l=this._sortUserSegmentSequencePresets(n,a),c=this._sortSegmentSequencePresets(t,a);return H`
      <ha-expansion-panel
        outlined
        .expanded=${o}
        @expanded-changed=${e=>this._handleExpansionChange(s,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("sections.segment_sequences")}: ${e}</div>
            <div class="section-subtitle">${n.length>0?this._localize("sections.subtitle_presets_custom",{count:r.toString(),custom:n.length.toString()}):this._localize("sections.subtitle_presets",{count:r.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(s)}
          </div>
        </div>
        <div class="section-content">
          ${l.map(e=>H`
              <div class="preset-button user-preset" @click=${()=>this._activateUserSegmentSequencePreset(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("segment_sequence",e.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserSegmentSequenceIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${c.map(e=>H`
              <div class="preset-button builtin-preset" @click=${()=>this._activateSegmentSequence(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("segment_sequence",e.id)}
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
    `}_renderDynamicScenesSection(){const e="dynamic_scenes",t=!this._collapsed[e],i=this._getFilteredUserDynamicScenePresets(),s=this._presets.dynamic_scenes||[],o=i.length+s.length,n=this._getSortPreference(e),r=this._sortUserDynamicScenePresets(i,n),a=this._sortDynamicScenePresets(s,n);return H`
      <ha-expansion-panel
        outlined
        .expanded=${t}
        @expanded-changed=${t=>this._handleExpansionChange(e,t)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("sections.dynamic_scenes")}</div>
            <div class="section-subtitle">${i.length>0?this._localize("sections.subtitle_presets_custom",{count:o.toString(),custom:i.length.toString()}):this._localize("sections.subtitle_presets",{count:o.toString()})}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown(e)}
          </div>
        </div>
        <div class="section-content">
          ${r.map(e=>H`
              <div class="preset-button user-preset" @click=${()=>this._activateUserDynamicScenePreset(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("dynamic_scene",e.id)}
                </div>
                <div class="preset-icon">
                  ${this._renderUserDynamicSceneIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${a.map(e=>H`
              <div class="preset-button builtin-preset" @click=${()=>this._activateDynamicScene(e)}>
                <div class="preset-card-actions">
                  ${this._renderFavoriteStar("dynamic_scene",e.id)}
                  <ha-icon-button
                    @click=${t=>{t.stopPropagation(),this._duplicateBuiltinDynamicScenePreset(e)}}
                    title="${this._localize("tooltips.preset_duplicate")}"
                  >
                    <ha-icon icon="mdi:content-copy"></ha-icon>
                  </ha-icon-button>
                </div>
                <div class="preset-icon">
                  ${this._renderBuiltinDynamicSceneIcon(e)}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
        </div>
      </ha-expansion-panel>
    `}_hasZhaEntity(){for(const e of this._selectedEntities){const t=this._supportedEntities.get(e);if("zha"===t?.backend_type)return!0}return!1}_getZhaConfigValue(e,t){for(const t of this._selectedEntities){const i=this._zhaDeviceConfig.get(t);if(i&&e in i){const t=i[e];if(void 0!==t)return t}}return t}async _loadZhaDeviceConfig(e){try{const t=await this.hass.callApi("GET",`aqara_advanced_lighting/device_config/${e}`);if(t?.config){const i=new Map(this._zhaDeviceConfig);i.set(e,t.config),this._zhaDeviceConfig=i}}catch(t){console.error(`Failed to load ZHA device config for ${e}:`,t)}}async _loadZhaDeviceConfigs(){if(!this._hasZhaEntity())return;const e=this._selectedEntities.filter(e=>"zha"===this._supportedEntities.get(e)?.backend_type).map(e=>this._loadZhaDeviceConfig(e));await Promise.all(e),this._loadCurvatureFromEntity()}async _setZhaDeviceConfig(e,t){const i=this._selectedEntities.filter(e=>"zha"===this._supportedEntities.get(e)?.backend_type);try{await Promise.all(i.map(async i=>{const s=await this.hass.callApi("POST",`aqara_advanced_lighting/device_config/${i}`,{setting:e,value:t});if(s?.success){const s=new Map(this._zhaDeviceConfig),o=s.get(i)||{};s.set(i,{...o,[e]:t}),this._zhaDeviceConfig=s}}))}catch(i){console.error(`Failed to set ZHA device config ${e}=${t}:`,i)}}_renderConfigTab(){const e=this._selectedEntities.length>0,t=this._getSelectedDeviceTypes(),i=t.includes("t2_bulb")||t.includes("t2_cct"),s=t.includes("t1_strip"),o=t.includes("t1m")||t.includes("t1_strip"),n=this._findTransitionCurveEntity(),r=this._findInitialBrightnessEntity(),a=this._findT1StripLengthEntity(),l=this._findOnOffDurationEntity(),c=this._findOffOnDurationEntity(),d=this._findDimmingRangeMinEntity(),h=this._findDimmingRangeMaxEntity(),p=this._hasZhaEntity(),_=r&&this.hass?.states[r]?parseFloat(this.hass.states[r].state)||0:p?this._getZhaConfigValue("initial_brightness",0):0,g=a&&this.hass?.states[a]?parseFloat(this.hass.states[a].state)||2:p?this._getZhaConfigValue("strip_length",2):2,u=l&&this.hass?.states[l]&&parseFloat(this.hass.states[l].state)||0,m=c&&this.hass?.states[c]&&parseFloat(this.hass.states[c].state)||0,v=d&&this.hass?.states[d]?parseFloat(this.hass.states[d].state)||1:p?this._getZhaConfigValue("dimming_range_min",1):1,f=h&&this.hass?.states[h]?parseFloat(this.hass.states[h].state)||100:p?this._getZhaConfigValue("dimming_range_max",100):100,b=l||c||d||h||p;return H`
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
          ${0===this._z2mInstances.length?H`
                <div style="padding: 16px; text-align: center; color: var(--secondary-text-color);">
                  <ha-icon icon="mdi:information-outline" style="margin-right: 8px;"></ha-icon>
                  ${this._localize("instances.no_instances")}
                </div>
              `:H`
                <div class="z2m-instances-grid">
                  ${this._z2mInstances.map(e=>H`
                    <div class="z2m-instance-card">
                      <div class="z2m-instance-header">
                        <ha-icon icon="mdi:zigbee" style="color: var(--primary-color);"></ha-icon>
                        <div class="z2m-instance-info">
                          <span class="z2m-instance-name">${e.title}</span>
                          ${e.title!==e.z2m_base_topic?H`
                            <span class="z2m-instance-topic">${e.z2m_base_topic}</span>
                          `:""}
                        </div>
                      </div>
                      <div class="z2m-instance-stats">
                        <div class="z2m-stat">
                          <span class="z2m-stat-value">${e.device_counts.total}</span>
                          <span class="z2m-stat-label">${this._localize("instances.total")}</span>
                        </div>
                        ${e.device_counts.t2_rgb>0?H`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.t2_rgb}</span>
                            <span class="z2m-stat-label">${this._localize("instances.t2_rgb")}</span>
                          </div>
                        `:""}
                        ${e.device_counts.t2_cct>0?H`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.t2_cct}</span>
                            <span class="z2m-stat-label">${this._localize("instances.t2_cct")}</span>
                          </div>
                        `:""}
                        ${e.device_counts.t1m>0?H`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.t1m}</span>
                            <span class="z2m-stat-label">${this._localize("instances.t1m")}</span>
                          </div>
                        `:""}
                        ${e.device_counts.t1_strip>0?H`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.t1_strip}</span>
                            <span class="z2m-stat-label">${this._localize("instances.t1_strip")}</span>
                          </div>
                        `:""}
                        ${e.device_counts.other>0?H`
                          <div class="z2m-stat">
                            <span class="z2m-stat-value">${e.device_counts.other}</span>
                            <span class="z2m-stat-label">${this._localize("instances.other")}</span>
                          </div>
                        `:""}
                      </div>
                      ${e.devices.length>0?H`
                        <div class="z2m-devices-list">
                          <details>
                            <summary style="cursor: pointer; color: var(--secondary-text-color); font-size: var(--ha-font-size-s, 12px);">
                              ${this._localize(1===e.devices.length?"instances.show_devices_single":"instances.show_devices_plural",{count:String(e.devices.length)})}
                            </summary>
                            <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                              ${e.devices.map(e=>H`<li>${e}</li>`)}
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

      ${e?"":H`
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

      ${i?H`
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
                              ?disabled=${!n&&!p||this._applyingCurvature}
                            >
                              ${this._applyingCurvature?this._localize("config.applying_button"):this._localize("config.apply_button")}
                            </ha-button>
                          </div>
                        </div>
                        <div class="curve-legend">
                          <span class="legend-item">
                            <span class="legend-dot fast-slow"></span>
                            ${this._localize("config.curve_legend_fast_slow")}
                          </span>
                          <span class="legend-item">
                            <span class="legend-dot linear"></span>
                            ${this._localize("config.curve_legend_linear")}
                          </span>
                          <span class="legend-item">
                            <span class="legend-dot slow-fast"></span>
                            ${this._localize("config.curve_legend_slow_fast")}
                          </span>
                        </div>
                      </div>

                      <!-- Initial Brightness -->
                      <div class="form-section">
                        <span class="form-label">${this._localize("config.initial_brightness_label")}</span>
                        <ha-selector
                          .hass=${this.hass}
                          .selector=${{number:{min:0,max:50,step:1,mode:"slider",unit_of_measurement:"%"}}}
                          .value=${_}
                          @value-changed=${e=>this._handleInitialBrightnessChange(e)}
                          ?disabled=${!r&&!p}
                        ></ha-selector>
                        ${r||p?"":H`
                          <div style="margin-top: 8px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                            ${this._localize("config.initial_brightness_not_found")}
                          </div>
                        `}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ha-expansion-panel>
          `:""}

      ${e?H`
            <ha-expansion-panel
              outlined
              .expanded=${!0}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize("config.dimming_settings_title")}</div>
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
                        .value=${u}
                        @value-changed=${e=>this._handleDimmingSettingChange(e,"on_off_duration","off_transition_time")}
                        ?disabled=${!l}
                      ></ha-selector>
                      ${l?"":H`
                        <div class="entity-not-found">${this._localize("config.entity_not_found")}</div>
                      `}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize("config.off_to_on_duration_label")}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:0,max:10,step:.1,mode:"slider",unit_of_measurement:"s"}}}
                        .value=${m}
                        @value-changed=${e=>this._handleDimmingSettingChange(e,"off_on_duration","on_transition_time")}
                        ?disabled=${!c}
                      ></ha-selector>
                      ${c?"":H`
                        <div class="entity-not-found">${this._localize("config.entity_not_found")}</div>
                      `}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize("config.dimming_range_min_label")}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:1,max:Math.min(99,f-1),step:1,mode:"slider",unit_of_measurement:"%"}}}
                        .value=${v}
                        @value-changed=${e=>this._handleDimmingRangeMinChange(e)}
                        ?disabled=${!d&&!p}
                      ></ha-selector>
                      ${d||p?"":H`
                        <div class="entity-not-found">${this._localize("config.entity_not_found")}</div>
                      `}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize("config.dimming_range_max_label")}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:Math.max(2,v+1),max:100,step:1,mode:"slider",unit_of_measurement:"%"}}}
                        .value=${f}
                        @value-changed=${e=>this._handleDimmingRangeMaxChange(e)}
                        ?disabled=${!h&&!p}
                      ></ha-selector>
                      ${h||p?"":H`
                        <div class="entity-not-found">${this._localize("config.entity_not_found")}</div>
                      `}
                    </div>
                  </div>
                </div>
                ${b?"":H`
                  <div style="padding: 16px; text-align: center; color: var(--secondary-text-color);">
                    <ha-icon icon="mdi:information-outline" style="margin-right: 8px;"></ha-icon>
                    ${this._localize("config.dimming_not_available")}
                  </div>
                `}
              </div>
            </ha-expansion-panel>
          `:""}

      ${s?H`
            <ha-expansion-panel
              outlined
              .expanded=${!0}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize("sections.t1_strip_settings")}</div>
                </div>
              </div>
              <div class="section-content" style="display: block; padding: 16px;">
                <div class="form-section">
                  <span class="form-label">${this._localize("config.strip_length_label")}</span>
                  <ha-selector
                    .hass=${this.hass}
                    .selector=${{number:{min:1,max:10,step:.2,mode:"slider",unit_of_measurement:"m"}}}
                    .value=${g}
                    @value-changed=${e=>this._handleT1StripLengthChange(e)}
                    ?disabled=${!a&&!p}
                  ></ha-selector>
                  <div style="margin-top: 8px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                    ${a||p?this._localize("config.strip_length_info"):this._localize("config.strip_length_not_found")}
                  </div>
                </div>
              </div>
            </ha-expansion-panel>
          `:""}

      ${o?this._renderSegmentZonesSection():""}
    `}_renderSegmentZonesSection(){const e=this._getSelectedSegmentDevices();if(0===e.size){if(this._selectedEntities.length>0){if(this._getSelectedDeviceTypes().some(e=>"t1m"!==e&&"t1_strip"!==e))return H`
            <ha-expansion-panel outlined .expanded=${!1}>
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">${this._localize("config.segment_zones_title")}</div>
                  <div class="section-subtitle">${this._localize("config.segment_zones_subtitle")}</div>
                </div>
              </div>
              <div class="section-content" style="display: block; padding: 16px;">
                <ha-alert alert-type="info">
                  ${this._localize("config.zone_no_segment_devices")}
                </ha-alert>
              </div>
            </ha-expansion-panel>
          `}return""}return H`
      <ha-expansion-panel outlined .expanded=${!0}>
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">${this._localize("config.segment_zones_title")}</div>
            <div class="section-subtitle">${this._localize("config.segment_zones_subtitle")}</div>
          </div>
        </div>
        <div class="section-content" style="display: block; padding: 0;">
          ${Array.from(e.entries()).map(([e,t])=>{const i=this._zoneEditing.get(e)||[],s=this._zonesModified(e);return H`
              <div class="zone-device-section">
                <div class="zone-device-header">
                  <ha-icon icon="${this._getEntityIcon(t.entity_id)}"></ha-icon>
                  <span>${t.z2m_friendly_name}</span>
                  <span class="zone-device-segments">${this._localize("config.segment_count",{count:t.segment_count.toString()})}</span>
                </div>
                ${0===i.length?H`<div class="zone-empty-message">${this._localize("config.zone_no_zones")}</div>`:H`
                    <div class="zone-list">
                      ${i.map((i,s)=>H`
                        <div class="zone-row">
                          <div class="zone-row-header">
                            <ha-selector
                              class="zone-name-input"
                              .hass=${this.hass}
                              .selector=${{text:{}}}
                              .value=${i.name}
                              .label=${this._localize("config.zone_name_label")}
                              @value-changed=${t=>this._updateZoneField(e,s,"name",t.detail.value)}
                            ></ha-selector>
                            <ha-icon-button
                              @click=${()=>this._removeZoneRow(e,s)}
                              title=${this._localize("config.zone_delete_tooltip")}
                            >
                              <ha-icon icon="mdi:delete-outline"></ha-icon>
                            </ha-icon-button>
                          </div>
                          <segment-selector
                            .mode=${"selection"}
                            .maxSegments=${t.segment_count}
                            .value=${i.segments}
                            .hideControls=${!0}
                            @value-changed=${t=>this._updateZoneField(e,s,"segments",t.detail.value)}
                          ></segment-selector>
                        </div>
                      `)}
                    </div>
                  `}
                <div class="zone-actions">
                  <ha-button @click=${()=>this._addZoneRow(e)}>
                    <ha-icon icon="mdi:plus"></ha-icon>
                    ${this._localize("config.zone_add_button")}
                  </ha-button>
                  <ha-button
                    @click=${()=>this._saveZones(e,t.segment_count)}
                    ?disabled=${!s||this._zoneSaving}
                  >
                    <ha-icon icon="mdi:content-save-outline"></ha-icon>
                    ${this._localize("config.zone_save_button")}
                  </ha-button>
                </div>
              </div>
            `})}
        </div>
      </ha-expansion-panel>
    `}async _handleInitialBrightnessChange(e){if(!this.hass)return;const t=e.detail.value;if("number"!=typeof t)return;const i=this._findAllInitialBrightnessEntities();if(i.length)try{await Promise.all(i.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:t})))}catch(e){console.error("Failed to set initial brightness:",e)}else this._hasZhaEntity()&&await this._setZhaDeviceConfig("initial_brightness",t)}_findTransitionCurveEntity(){if(!this.hass||!this._selectedEntities.length)return;const e="transition_curve_curvature";for(const t of this._selectedEntities){const i=this.hass.states[t];if(!i)continue;const s=this._supportedEntities.get(t),o="t2_bulb"===s?.device_type||"t2_cct"===s?.device_type,n=i.attributes.effect_list,r=n&&n.includes("candlelight"),a=!n&&void 0!==i.attributes.color_temp;if(!o&&!r&&!a)continue;const l=t.replace("light.",""),c=`number.${l}_${e}`;if(this.hass.states[c])return c;if(s?.z2m_friendly_name){const t=`number.${s.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${e}`;if(this.hass.states[t])return t}const d=l.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(e)){const i=t.replace("number.","").replace(`_${e}`,"").toLowerCase().split("_");if(d.length>=2&&i.length>=2&&d[0]===i[0]&&d[1]===i[1])return t}}}_findInitialBrightnessEntity(){if(!this.hass||!this._selectedEntities.length)return;const e="transition_initial_brightness";for(const t of this._selectedEntities){const i=this.hass.states[t];if(!i)continue;const s=this._supportedEntities.get(t),o="t2_bulb"===s?.device_type||"t2_cct"===s?.device_type,n=i.attributes.effect_list,r=n&&n.includes("candlelight"),a=!n&&void 0!==i.attributes.color_temp;if(!o&&!r&&!a)continue;const l=t.replace("light.",""),c=`number.${l}_${e}`;if(this.hass.states[c])return c;if(s?.z2m_friendly_name){const t=`number.${s.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${e}`;if(this.hass.states[t])return t}const d=l.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(e)){const i=t.replace("number.","").replace(`_${e}`,"").toLowerCase().split("_");if(d.length>=2&&i.length>=2&&d[0]===i[0]&&d[1]===i[1])return t}}}_findAllTransitionCurveEntities(){if(!this.hass||!this._selectedEntities.length)return[];const e=[],t=this._getT2CompatibleEntities(),i="transition_curve_curvature";for(const s of t){const t=s.replace("light.",""),o=`number.${t}_${i}`;if(this.hass.states[o]){e.push(o);continue}const n=this._supportedEntities.get(s);if(n?.z2m_friendly_name){const t=`number.${n.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${i}`;if(this.hass.states[t]&&!e.includes(t)){e.push(t);continue}}const r=t.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(i)&&!e.includes(t)){const s=t.replace("number.","").replace(`_${i}`,"").toLowerCase().split("_");if(r.length>=2&&s.length>=2&&r[0]===s[0]&&r[1]===s[1]){e.push(t);break}}}return e}_findAllInitialBrightnessEntities(){if(!this.hass||!this._selectedEntities.length)return[];const e=[],t=this._getT2CompatibleEntities(),i="transition_initial_brightness";for(const s of t){const t=s.replace("light.",""),o=`number.${t}_${i}`;if(this.hass.states[o]){e.push(o);continue}const n=this._supportedEntities.get(s);if(n?.z2m_friendly_name){const t=`number.${n.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${i}`;if(this.hass.states[t]&&!e.includes(t)){e.push(t);continue}}const r=t.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(i)&&!e.includes(t)){const s=t.replace("number.","").replace(`_${i}`,"").toLowerCase().split("_");if(r.length>=2&&s.length>=2&&r[0]===s[0]&&r[1]===s[1]){e.push(t);break}}}return e}_findAllDimmingEntities(e){if(!this.hass||!this._selectedEntities.length)return[];const t=[];for(const i of this._selectedEntities){if(!this.hass.states[i])continue;const s=i.replace("light.",""),o=`number.${s}_${e}`;if(this.hass.states[o]){t.push(o);continue}const n=this._supportedEntities.get(i);if(n?.z2m_friendly_name){const i=`number.${n.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${e}`;if(this.hass.states[i]&&!t.includes(i)){t.push(i);continue}}const r=s.toLowerCase().split("_");for(const i of Object.keys(this.hass.states))if(i.startsWith("number.")&&i.includes(e)&&!t.includes(i)){const s=i.replace("number.","").replace(`_${e}`,"").toLowerCase().split("_");if(r.length>=2&&s.length>=2&&r[0]===s[0]&&r[1]===s[1]){t.push(i);break}}}return t}_findDimmingEntity(e){if(this.hass&&this._selectedEntities.length)for(const t of this._selectedEntities){if(!this.hass.states[t])continue;const i=t.replace("light.",""),s=`number.${i}_${e}`;if(this.hass.states[s])return s;const o=this._supportedEntities.get(t);if(o?.z2m_friendly_name){const t=`number.${o.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${e}`;if(this.hass.states[t])return t}const n=i.toLowerCase();for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(e)){const i=t.replace("number.","").replace(`_${e}`,"").toLowerCase(),s=n.split("_"),o=i.split("_");if(s.length>=2&&o.length>=2&&s[0]===o[0]&&s[1]===o[1])return t}}}_findOnOffDurationEntity(){return this._findDimmingEntity("on_off_duration")??this._findDimmingEntity("off_transition_time")}_findOffOnDurationEntity(){return this._findDimmingEntity("off_on_duration")??this._findDimmingEntity("on_transition_time")}_findDimmingRangeMinEntity(){return this._findDimmingEntity("dimming_range_minimum")}_findDimmingRangeMaxEntity(){return this._findDimmingEntity("dimming_range_maximum")}async _handleDimmingSettingChange(e,...t){if(!this.hass)return;const i=e.detail.value;if("number"!=typeof i)return;const s=[];for(const e of t)for(const t of this._findAllDimmingEntities(e))s.includes(t)||s.push(t);if(s.length)try{await Promise.all(s.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:i})))}catch(e){console.error("Failed to set dimming setting:",e)}}async _handleDimmingRangeMinChange(e){const t=this._findDimmingRangeMinEntity(),i=this._findDimmingRangeMaxEntity(),s=this._hasZhaEntity();if(!this.hass||!t&&!s)return;const o=e.detail.value;if("number"!=typeof o)return;o>=(i&&this.hass.states[i]?parseFloat(this.hass.states[i].state)||100:s?this._getZhaConfigValue("dimming_range_max",100):100)||(t?await this._handleDimmingSettingChange(e,"dimming_range_minimum"):s&&await this._setZhaDeviceConfig("dimming_range_min",o))}async _handleDimmingRangeMaxChange(e){const t=this._findDimmingRangeMinEntity(),i=this._findDimmingRangeMaxEntity(),s=this._hasZhaEntity();if(!this.hass||!i&&!s)return;const o=e.detail.value;if("number"!=typeof o)return;o<=(t&&this.hass.states[t]?parseFloat(this.hass.states[t].state)||1:s?this._getZhaConfigValue("dimming_range_min",1):1)||(i?await this._handleDimmingSettingChange(e,"dimming_range_maximum"):s&&await this._setZhaDeviceConfig("dimming_range_max",o))}_getT1StripCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>"t1_strip"===this._getEntityDeviceType(e)):[]}_findT1StripLengthEntity(){if(!this.hass||!this._selectedEntities.length)return;const e=this._getT1StripCompatibleEntities();if(!e.length)return;const t="length";for(const i of e){const e=i.replace("light.",""),s=`number.${e}_${t}`;if(this.hass.states[s])return s;const o=this._supportedEntities.get(i);if(o?.z2m_friendly_name){const e=`number.${o.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${t}`;if(this.hass.states[e])return e}const n=e.toLowerCase().split("_");for(const e of Object.keys(this.hass.states))if(e.startsWith("number.")&&e.endsWith(`_${t}`)){const i=e.replace("number.","").replace(`_${t}`,"").toLowerCase().split("_");if(n.length>=2&&i.length>=2&&n[0]===i[0]&&n[1]===i[1])return e}}}_findAllT1StripLengthEntities(){if(!this.hass||!this._selectedEntities.length)return[];const e=[],t=this._getT1StripCompatibleEntities(),i="length";for(const s of t){const t=s.replace("light.",""),o=`number.${t}_${i}`;if(this.hass.states[o]){e.push(o);continue}const n=this._supportedEntities.get(s);if(n?.z2m_friendly_name){const t=`number.${n.z2m_friendly_name.toLowerCase().replace(/\s+/g,"_")}_${i}`;if(this.hass.states[t]&&!e.includes(t)){e.push(t);continue}}const r=t.toLowerCase().split("_");for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.endsWith(`_${i}`)&&!e.includes(t)){const s=t.replace("number.","").replace(`_${i}`,"").toLowerCase().split("_");if(r.length>=2&&s.length>=2&&r[0]===s[0]&&r[1]===s[1]){e.push(t);break}}}return e}async _handleT1StripLengthChange(e){if(!this.hass)return;const t=e.detail.value;if("number"!=typeof t)return;const i=this._findAllT1StripLengthEntities();if(i.length)try{await Promise.all(i.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:t})))}catch(e){console.error("Failed to set T1 Strip length:",e)}else this._hasZhaEntity()&&await this._setZhaDeviceConfig("strip_length",t)}_handleCurvatureInput(e){const{curvature:t}=e.detail;"number"==typeof t&&(this._localCurvature=t)}_handleCurvatureNumberChange(e){const t=e.detail.value;if("number"==typeof t){const e=Math.max(.2,Math.min(6,t));this._localCurvature=Math.round(100*e)/100}}_getCurvatureDescription(){return this._localCurvature<.9?this._localize("config.curvature_fast_slow"):this._localCurvature<=1.1?this._localize("config.curvature_linear"):this._localize("config.curvature_slow_fast")}async _applyCurvature(){if(this.hass){this._applyingCurvature=!0;try{const e=this._findAllTransitionCurveEntities();e.length?await Promise.all(e.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:this._localCurvature}))):this._hasZhaEntity()&&await this._setZhaDeviceConfig("transition_curve",this._localCurvature)}catch(e){console.error("Failed to set transition curve curvature:",e)}finally{this._applyingCurvature=!1}}}_loadCurvatureFromEntity(){const e=this._findTransitionCurveEntity();if(this.hass&&e){const t=this.hass.states[e];if(t){const e=parseFloat(t.state);if(!isNaN(e)&&e>=.2&&e<=6)return void(this._localCurvature=Math.round(100*e)/100)}}if(this._hasZhaEntity()){const e=this._getZhaConfigValue("transition_curve",-1);e>=.2&&e<=6&&(this._localCurvature=Math.round(100*e)/100)}}};Tt.styles=Pe,Tt.PRESET_DEVICE_TYPES=["t2_bulb","t1","t1m","t1_strip"],e([pe({attribute:!1})],Tt.prototype,"hass",void 0),e([pe({type:Boolean,reflect:!0})],Tt.prototype,"narrow",void 0),e([_e()],Tt.prototype,"_presets",void 0),e([_e()],Tt.prototype,"_loading",void 0),e([_e()],Tt.prototype,"_error",void 0),e([_e()],Tt.prototype,"_selectedEntities",void 0),e([_e()],Tt.prototype,"_brightness",void 0),e([_e()],Tt.prototype,"_useCustomBrightness",void 0),e([_e()],Tt.prototype,"_useStaticSceneMode",void 0),e([_e()],Tt.prototype,"_ignoreExternalChanges",void 0),e([_e()],Tt.prototype,"_collapsed",void 0),e([_e()],Tt.prototype,"_hasIncompatibleLights",void 0),e([_e()],Tt.prototype,"_includeAllLights",void 0),e([_e()],Tt.prototype,"_favorites",void 0),e([_e()],Tt.prototype,"_activeFavoriteId",void 0),e([_e()],Tt.prototype,"_showFavoriteInput",void 0),e([_e()],Tt.prototype,"_favoriteInputName",void 0),e([_e()],Tt.prototype,"_activeTab",void 0),e([_e()],Tt.prototype,"_userPresets",void 0),e([_e()],Tt.prototype,"_editingPreset",void 0),e([_e()],Tt.prototype,"_effectPreviewActive",void 0),e([_e()],Tt.prototype,"_cctPreviewActive",void 0),e([_e()],Tt.prototype,"_segmentSequencePreviewActive",void 0),e([_e()],Tt.prototype,"_scenePreviewActive",void 0),e([_e()],Tt.prototype,"_sortPreferences",void 0),e([_e()],Tt.prototype,"_colorHistory",void 0),e([_e()],Tt.prototype,"_backendVersion",void 0),e([_e()],Tt.prototype,"_frontendVersion",void 0),e([_e()],Tt.prototype,"_supportedEntities",void 0),e([_e()],Tt.prototype,"_deviceZones",void 0),e([_e()],Tt.prototype,"_zoneEditing",void 0),e([_e()],Tt.prototype,"_zoneSaving",void 0),e([_e()],Tt.prototype,"_z2mInstances",void 0),e([_e()],Tt.prototype,"_localCurvature",void 0),e([_e()],Tt.prototype,"_applyingCurvature",void 0),e([_e()],Tt.prototype,"_zhaDeviceConfig",void 0),e([_e()],Tt.prototype,"_isExporting",void 0),e([_e()],Tt.prototype,"_isImporting",void 0),e([_e()],Tt.prototype,"_favoritePresets",void 0),e([_e()],Tt.prototype,"_runningOperations",void 0),e([_e()],Tt.prototype,"_setupComplete",void 0),Tt=Et=e([ce("aqara-advanced-lighting-panel")],Tt);const Mt=[{x:.68,y:.31},{x:.17,y:.7},{x:.15,y:.06},{x:.42,y:.51},{x:.38,y:.16},{x:.22,y:.33}],Dt=[{x:.68,y:.31},{x:.15,y:.06}],At=[{x:.68,y:.31},{x:.17,y:.7}];function It(e,t=255){return Ae(Me(e.x,e.y,t))}let qt=class extends ae{constructor(){super(...arguments),this.mode="selection",this.maxSegments=10,this.value="",this.colorValue=new Map,this.colorPalette=[...Mt],this.gradientColors=[...Dt],this.blockColors=[...At],this.expandBlocks=!1,this.gradientMirror=!1,this.gradientRepeat=1,this.gradientReverse=!1,this.gradientInterpolation="shortest",this.gradientWave=!1,this.gradientWaveCycles=1,this.label="",this.description="",this.disabled=!1,this.translations={},this.colorHistory=[],this.zones=[],this.turnOffUnspecified=!0,this.hideControls=!1,this._selectedSegments=new Set,this._coloredSegments=new Map,this._lastSelectedIndex=null,this._selectedPaletteIndex=0,this._selectedZone="",this._clearMode=!1,this._selectMode=!1,this._patternMode="individual",this._initialPatternApplied=!1,this._editingColorSource=null,this._editingColorIndex=null,this._editingColor=null,this._hsColorCache=new Map,this._wheelIsDragging=!1,this._wheelCanvasId=null,this._wheelMarkerId=null,this._wheelSize=0,this._wheelPointerMoveBound=null,this._wheelPointerUpBound=null}static get styles(){return r`
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

      .segment-grid-container.compact {
        padding: 8px;
        margin-bottom: 0;
      }

      .segment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
        gap: 4px;
        margin-bottom: 12px;
      }

      .compact .segment-grid {
        grid-template-columns: repeat(auto-fill, minmax(28px, 1fr));
        gap: 3px;
        margin-bottom: 0;
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

      .compact .segment-cell {
        font-size: 9px;
        border-width: 1px;
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

      .zone-select {
        min-width: 200px;
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
    `}disconnectedCallback(){super.disconnectedCallback(),this._wheelPointerMoveBound&&(window.removeEventListener("mousemove",this._wheelPointerMoveBound),window.removeEventListener("touchmove",this._wheelPointerMoveBound),this._wheelPointerMoveBound=null),this._wheelPointerUpBound&&(window.removeEventListener("mouseup",this._wheelPointerUpBound),window.removeEventListener("touchend",this._wheelPointerUpBound),this._wheelPointerUpBound=null)}updated(e){!e.has("value")||e.get("value")===this.value||"selection"!==this.mode&&"sequence"!==this.mode||this._parseValue(),!e.has("colorValue")||e.get("colorValue")===this.colorValue||"color"!==this.mode&&"sequence"!==this.mode||this._parseColorValue(),this.initialPatternMode&&!this._initialPatternApplied&&"individual"!==this.initialPatternMode&&this.maxSegments>0&&(this._initialPatternApplied=!0,0===this._coloredSegments.size&&(this._patternMode=this.initialPatternMode,this._applyToGrid())),e.has("maxSegments")&&this._validateSelection()}_parseValue(){const e=new Set;if(!this.value||""===this.value.trim())return void(this._selectedSegments=e);const t=this.value.trim().toLowerCase();if("all"===t){for(let t=0;t<this.maxSegments;t++)e.add(t);return void(this._selectedSegments=e)}const i=t.split(",");for(const t of i){const i=t.trim();if(i)if(i.includes("-")){const t=i.split("-").map(e=>e.trim()),s=t[0]??"",o=t[1]??"",n=parseInt(s,10),r=parseInt(o,10);if(!isNaN(n)&&!isNaN(r)){const t=Math.max(0,n-1),i=Math.min(this.maxSegments-1,r-1);for(let s=t;s<=i;s++)e.add(s)}}else{const t=parseInt(i,10);if(!isNaN(t)){const i=t-1;i>=0&&i<this.maxSegments&&e.add(i)}}}this._selectedSegments=e}_parseColorValue(){this.colorValue instanceof Map?this._coloredSegments=new Map(this.colorValue):this._coloredSegments=new Map}_validateSelection(){const e=new Set;for(const t of this._selectedSegments)t<this.maxSegments&&e.add(t);e.size!==this._selectedSegments.size&&(this._selectedSegments=e,"selection"!==this.mode&&"sequence"!==this.mode||this._fireValueChanged());const t=new Map;for(const[e,i]of this._coloredSegments)e<this.maxSegments&&t.set(e,i);t.size!==this._coloredSegments.size&&(this._coloredSegments=t,"color"!==this.mode&&"sequence"!==this.mode||this._fireColorValueChanged())}_segmentsToString(){if(0===this._selectedSegments.size)return"";if(this._selectedSegments.size===this.maxSegments)return"all";const e=Array.from(this._selectedSegments).sort((e,t)=>e-t),t=[];if(0===e.length)return"";let i=e[0],s=e[0];for(let o=1;o<e.length;o++){const n=e[o];n===s+1?s=n:(t.push(i===s?`${i+1}`:`${i+1}-${s+1}`),i=s=n)}return t.push(i===s?`${i+1}`:`${i+1}-${s+1}`),t.join(",")}_handleSegmentClick(e,t){this.disabled||(t.preventDefault(),"selection"===this.mode?this._handleSelectionClick(e,t):"color"!==this.mode&&"sequence"!==this.mode||this._handleColorClick(e,t))}_handleSelectionClick(e,t){const i=new Set(this._selectedSegments);if(t.shiftKey&&null!==this._lastSelectedIndex){const t=Math.min(this._lastSelectedIndex,e),s=Math.max(this._lastSelectedIndex,e);for(let e=t;e<=s;e++)i.add(e)}else t.ctrlKey||t.metaKey,i.has(e)?i.delete(e):i.add(e);this._lastSelectedIndex=e,this._selectedSegments=i,this._fireValueChanged()}_handleColorClick(e,t){if(this._clearMode){const t=new Map(this._coloredSegments);return t.delete(e),this._coloredSegments=t,void this._fireColorValueChanged()}if(this._selectMode||t.shiftKey){const t=new Set(this._selectedSegments);t.has(e)?t.delete(e):t.add(e),this._selectedSegments=t}else if(t.ctrlKey||t.metaKey)this._selectedSegments=new Set([...this._selectedSegments,e]);else{const t=this.colorPalette[this._selectedPaletteIndex];if(!t)return;const i=new Map(this._coloredSegments);i.set(e,{...t}),this._coloredSegments=i,this._fireColorValueChanged()}}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,String(t))}),o}_selectAll(){if(this.disabled)return;const e=new Set;for(let t=0;t<this.maxSegments;t++)e.add(t);this._selectedSegments=e,this._lastSelectedIndex=null,"selection"!==this.mode&&"sequence"!==this.mode||this._fireValueChanged()}_clearAll(){this.disabled||(this._selectedSegments=new Set,this._coloredSegments=new Map,this._lastSelectedIndex=null,"selection"!==this.mode&&"sequence"!==this.mode||this._fireValueChanged(),"color"!==this.mode&&"sequence"!==this.mode||this._fireColorValueChanged())}_getBuiltInZoneIndices(e){const t=Math.floor(this.maxSegments/2);switch(e){case"__all":return Array.from({length:this.maxSegments},(e,t)=>t);case"__first-half":return Array.from({length:t},(e,t)=>t);case"__second-half":return Array.from({length:this.maxSegments-t},(e,i)=>t+i);case"__odd":return Array.from({length:this.maxSegments},(e,t)=>t).filter(e=>e%2==0);case"__even":return Array.from({length:this.maxSegments},(e,t)=>t).filter(e=>e%2==1);default:return null}}_renderZoneListItems(){const e=[];if(this.zones.length>0)for(const t of this.zones)e.push(H`<mwc-list-item value=${t.name}>${t.name}</mwc-list-item>`);return e.push(H`<mwc-list-item value="__all">${this._localize("editors.select_all_button")}</mwc-list-item>`),e.push(H`<mwc-list-item value="__first-half">${this._localize("editors.first_half_button")}</mwc-list-item>`),e.push(H`<mwc-list-item value="__second-half">${this._localize("editors.second_half_button")}</mwc-list-item>`),e.push(H`<mwc-list-item value="__odd">${this._localize("editors.odd_button")}</mwc-list-item>`),e.push(H`<mwc-list-item value="__even">${this._localize("editors.even_button")}</mwc-list-item>`),e}_handleZoneSelected(e){const t=e.target.value;if(!t||this.disabled)return;const i=this._getBuiltInZoneIndices(t);let s;if(i)s=new Set(i);else{const e=this.zones.find(e=>e.name===t);if(!e)return;s=new Set(e.segmentIndices)}this._selectedSegments=s,this._lastSelectedIndex=null,"selection"!==this.mode&&"sequence"!==this.mode||this._fireValueChanged()}_handleZoneMenuClosed(e){e.stopPropagation(),this._selectedZone=""}_clearSelected(){if(!this.disabled&&0!==this._selectedSegments.size){if("color"===this.mode||"sequence"===this.mode){const e=new Map(this._coloredSegments);for(const t of this._selectedSegments)e.delete(t);this._coloredSegments=e,this._fireColorValueChanged()}this._selectedSegments=new Set}}_toggleClearMode(){this._clearMode=!this._clearMode,this._clearMode&&(this._selectMode=!1)}_toggleSelectMode(){this._selectMode=!this._selectMode,this._selectMode&&(this._clearMode=!1)}_selectPaletteColor(e){this._selectedPaletteIndex=e}_applyToSelected(){if(0===this._selectedSegments.size)return;const e=this.colorPalette[this._selectedPaletteIndex];if(!e)return;const t=new Map(this._coloredSegments);for(const i of this._selectedSegments)t.set(i,{...e});this._coloredSegments=t,this._selectedSegments=new Set,this._fireColorValueChanged()}_setPatternMode(e){this._patternMode=e,this._clearMode=!1,this._selectMode=!1}_addGradientColor(){if(this.gradientColors.length>=6||0===this.gradientColors.length)return;const e=this.gradientColors[this.gradientColors.length-1];if(!e)return;const t=Be(e);this.gradientColors=[...this.gradientColors,t],this._fireGradientColorsChanged()}_removeGradientColor(e){this.gradientColors.length<=2||(this.gradientColors=this.gradientColors.filter((t,i)=>i!==e),this._fireGradientColorsChanged())}_addBlockColor(){if(this.blockColors.length>=6||0===this.blockColors.length)return;const e=this.blockColors[this.blockColors.length-1];if(!e)return;const t=Be(e);this.blockColors=[...this.blockColors,t],this._fireBlockColorsChanged()}_removeBlockColor(e){this.blockColors.length<=1||(this.blockColors=this.blockColors.filter((t,i)=>i!==e),this._fireBlockColorsChanged())}_handleExpandBlocksChange(e){this.expandBlocks=e.target.checked}_handleGradientReverseChange(e){this.gradientReverse=e.target.checked}_handleGradientMirrorChange(e){this.gradientMirror=e.target.checked}_handleGradientWaveChange(e){this.gradientWave=e.target.checked}_handleGradientRepeatChange(e){this.gradientRepeat=Math.max(1,Math.min(10,parseInt(e.target.value)||1))}_handleGradientWaveCyclesChange(e){this.gradientWaveCycles=Math.max(1,Math.min(5,parseInt(e.target.value)||1))}_handleGradientInterpolationChange(e){this.gradientInterpolation=e.target.value}_interpolateHue(e,t,i){let s=t-e;s>180?s-=360:s<-180&&(s+=360);let o=e+s*i;return o<0&&(o+=360),o>=360&&(o-=360),o}_interpolateHueLongest(e,t,i){let s=t-e;s>0&&s<=180?s-=360:s<0&&s>=-180&&(s+=360);let o=e+s*i;return o<0&&(o+=360),o>=360&&(o-=360),o}_interpolateColorPair(e,t,i,s,o){if("rgb"===this.gradientInterpolation){const e=Me(i.x,i.y,255),t=Me(s.x,s.y,255);return De(Math.round(e.r+(t.r-e.r)*o),Math.round(e.g+(t.g-e.g)*o),Math.round(e.b+(t.b-e.b)*o))}const n="longest"===this.gradientInterpolation?this._interpolateHueLongest(e.h,t.h,o):this._interpolateHue(e.h,t.h,o);return Re({h:Math.round(n),s:Math.round(e.s+(t.s-e.s)*o)})}_applyWaveTransform(e){return.5-.5*Math.cos(e*Math.PI*2*this.gradientWaveCycles)}_generateGradientColorArray(e){if(0===e||this.gradientColors.length<2)return[];const t=this.gradientReverse?[...this.gradientColors].reverse():[...this.gradientColors],i=t.length,s=t.map(e=>Ue(e)),o=this.gradientMirror?Math.ceil(e/2):e,n=this.gradientRepeat>1?Math.max(2,Math.ceil(o/this.gradientRepeat)):o,r=[];for(let e=0;e<n;e++){let o=n>1?e/(n-1):0;this.gradientWave&&(o=this._applyWaveTransform(o));const a=o*(i-1),l=Math.floor(a),c=a-l,d=Math.min(l,i-1),h=Math.min(l+1,i-1),p=s[d],_=s[h],g=t[d],u=t[h];p&&_&&g&&u&&r.push(this._interpolateColorPair(p,_,g,u,c))}const a=[];for(let e=0;e<o;e++){const t=r[e%n];t&&a.push(t)}if(this.gradientMirror){const t=[...a],i=[...a].reverse();for(let s=e%2!=0&&a.length>1?1:0;s<i.length;s++){const e=i[s];e&&t.push(e)}return t.slice(0,e)}return a}_generateGradientPattern(){if(this.gradientColors.length<2||0===this.maxSegments)return new Map;const e=this._generateGradientColorArray(this.maxSegments),t=new Map;return e.forEach((e,i)=>t.set(i,e)),t}_generateBlocksPattern(){const e=this.blockColors,t=e.length,i=new Map;if(0===t||0===this.maxSegments)return i;if(this.expandBlocks){const s=this.maxSegments/t;for(let o=0;o<this.maxSegments;o++){const n=e[Math.min(Math.floor(o/s),t-1)];i.set(o,{x:n.x,y:n.y})}}else for(let s=0;s<this.maxSegments;s++){const o=e[s%t];i.set(s,{x:o.x,y:o.y})}return i}_applyToGrid(){let e;if("gradient"===this._patternMode)e=this._generateGradientPattern();else{if("blocks"!==this._patternMode)return;e=this._generateBlocksPattern()}this._coloredSegments=e,this._fireColorValueChanged()}_applyToSelectedSegments(){if(0===this._selectedSegments.size)return;const e=Array.from(this._selectedSegments).sort((e,t)=>e-t),t=e.length;let i=[];if("gradient"===this._patternMode)i=this.gradientColors;else{if("blocks"!==this._patternMode)return;i=this.blockColors}const s=i.length,o=new Map(this._coloredSegments);if("gradient"===this._patternMode){const i=this._generateGradientColorArray(t);for(let s=0;s<t;s++){const t=e[s],n=i[s];void 0!==t&&n&&o.set(t,n)}}else if("blocks"===this._patternMode)if(this.expandBlocks){const n=Math.ceil(t/s);for(let r=0;r<t;r++){const t=e[r];if(void 0===t)continue;const a=i[Math.min(Math.floor(r/n),s-1)];a&&o.set(t,{x:a.x,y:a.y})}}else for(let n=0;n<t;n++){const t=e[n];if(void 0===t)continue;const r=i[n%s];r&&o.set(t,{x:r.x,y:r.y})}this._coloredSegments=o,this._selectedSegments=new Set,this._fireColorValueChanged()}_openColorPicker(e,t){let i;if("palette"===e?i=this.colorPalette[t]:"gradient"===e?i=this.gradientColors[t]:"blocks"===e&&(i=this.blockColors[t]),!i)return;this._editingColorSource=e,this._editingColorIndex=t;const s=`${i.x.toFixed(4)},${i.y.toFixed(4)}`,o=this._hsColorCache.get(s);this._editingColor=o||Ue(i)}_confirmColorPicker(){if(null===this._editingColorIndex||null===this._editingColor||!this._editingColorSource)return void this._closeColorPicker();const e=Re(this._editingColor),t=at(this.colorHistory,e);this.dispatchEvent(new CustomEvent("color-history-changed",{detail:{colorHistory:t},bubbles:!0,composed:!0}));const i=`${e.x.toFixed(4)},${e.y.toFixed(4)}`;this._hsColorCache.set(i,{h:this._editingColor.h,s:this._editingColor.s}),"palette"===this._editingColorSource?(this.colorPalette=this.colorPalette.map((t,i)=>i===this._editingColorIndex?e:t),this._fireColorPaletteChanged()):"gradient"===this._editingColorSource?(this.gradientColors=this.gradientColors.map((t,i)=>i===this._editingColorIndex?e:t),this._fireGradientColorsChanged()):"blocks"===this._editingColorSource&&(this.blockColors=this.blockColors.map((t,i)=>i===this._editingColorIndex?e:t),this._fireBlockColorsChanged()),this._closeColorPicker()}_closeColorPicker(){this._editingColorSource=null,this._editingColorIndex=null,this._editingColor=null}_handleHistoryColorSelected(e){const t=e.detail.color,i=Ue(t);this._editingColor={h:i.h,s:i.s};this._updateMarkerPosition("color-wheel-canvas","color-wheel-marker",220);const s=Me(t.x,t.y,255),o=this.shadowRoot?.querySelectorAll(".color-picker-rgb-inputs .rgb-input-field");o&&3===o.length&&(o[0].value=String(s.r),o[1].value=String(s.g),o[2].value=String(s.b));const n=this.shadowRoot?.querySelector(".color-picker-modal-preview");n&&(n.style.backgroundColor=Ae(s))}_handleRgbInput(e,t){const i=e.target;let s=parseInt(i.value,10);if(isNaN(s)||""===i.value)return;if(s=Math.max(0,Math.min(255,s)),!this._editingColor)return;const o=Re(this._editingColor),n=Me(o.x,o.y,255),r={r:"r"===t?s:n.r,g:"g"===t?s:n.g,b:"b"===t?s:n.b},a=De(r.r,r.g,r.b),l=Ue(a);this._editingColor={h:l.h,s:l.s};this._updateMarkerPosition("color-wheel-canvas","color-wheel-marker",220);const c=this.shadowRoot?.querySelector(".color-picker-modal-preview");if(c){const e=Ae(Me(a.x,a.y,255));c.style.backgroundColor=e}const d=this.shadowRoot?.querySelectorAll(".rgb-input-field");if(d&&3===d.length){const e=Me(a.x,a.y,255),i="r"===t?0:"g"===t?1:2,o=d[0],n=d[1],r=d[2];o&&(o.value=String(e.r)),n&&(n.value=String(e.g)),r&&(r.value=String(e.b));if(("r"===t?e.r:"g"===t?e.g:e.b)!==s){const e=d[i];if(e){const t=e.style.borderColor;e.style.borderColor="var(--warning-color, #ff9800)",setTimeout(()=>{e.style.borderColor=t},500)}}}}_fireValueChanged(){const e=this._segmentsToString();this.dispatchEvent(new CustomEvent("value-changed",{detail:{value:e},bubbles:!0,composed:!0}))}_fireColorValueChanged(){this.dispatchEvent(new CustomEvent("color-value-changed",{detail:{value:this._coloredSegments,segments:this._segmentsToString()},bubbles:!0,composed:!0}))}_fireColorPaletteChanged(){this.dispatchEvent(new CustomEvent("color-palette-changed",{detail:{colors:this.colorPalette},bubbles:!0,composed:!0}))}_fireGradientColorsChanged(){this.dispatchEvent(new CustomEvent("gradient-colors-changed",{detail:{colors:this.gradientColors},bubbles:!0,composed:!0}))}_handleTurnOffUnspecifiedChange(e){this.turnOffUnspecified=e.target.checked,this.dispatchEvent(new CustomEvent("turn-off-unspecified-changed",{detail:{value:this.turnOffUnspecified},bubbles:!0,composed:!0}))}_fireBlockColorsChanged(){this.dispatchEvent(new CustomEvent("block-colors-changed",{detail:{colors:this.blockColors},bubbles:!0,composed:!0}))}_renderGrid(){const e=[];for(let t=0;t<this.maxSegments;t++){const i=this._selectedSegments.has(t),s=this._coloredSegments.get(t),o=void 0!==s,n=[];i&&n.push("selected"),!o||"color"!==this.mode&&"sequence"!==this.mode||n.push("colored"),this.disabled&&n.push("disabled");const r=!o||"color"!==this.mode&&"sequence"!==this.mode?"":`background-color: ${It(s)}`;e.push(H`
        <div
          class="segment-cell ${n.join(" ")}"
          style="${r}"
          @click=${e=>this._handleSegmentClick(t,e)}
          title="Segment ${t+1}${i?" (selected)":""}${o?" (colored)":""}"
        >
          ${t+1}
        </div>
      `)}return H`
      <div class="segment-grid-container ${this.hideControls?"compact":""}">
        <div class="segment-grid ${this._clearMode?"clear-mode":""} ${this._selectMode?"select-mode":""}">
          ${e}
        </div>
        ${this.hideControls?"":this._renderControls()}
      </div>
    `}_renderControls(){const e=this._selectedSegments.size,t=e>0;return"selection"===this.mode?H`
        <div class="controls">
          <ha-button @click=${this._selectAll} .disabled=${this.disabled}>
            <ha-icon icon="mdi:select-all"></ha-icon>
            ${this._localize("editors.select_all_button")}
          </ha-button>
          <ha-button @click=${this._clearAll} .disabled=${this.disabled||!t}>
            <ha-icon icon="mdi:selection-off"></ha-icon>
            ${this._localize("editors.clear_all_button")}
          </ha-button>
          <div class="selection-info">
            <ha-icon icon="mdi:information-outline"></ha-icon>
            <span>${this._localize("editors.segments_selected",{count:e})}</span>
          </div>
        </div>
        <div class="options-row">
          <ha-select
            class="zone-select"
            .label=${this._localize("editors.zone_select_label")}
            .value=${this._selectedZone}
            .disabled=${this.disabled}
            fixedMenuPosition
            naturalMenuWidth
            @selected=${this._handleZoneSelected}
            @closed=${this._handleZoneMenuClosed}
          >
            ${this._renderZoneListItems()}
          </ha-select>
        </div>
      `:"color"===this.mode||"sequence"===this.mode?H`
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
        <div class="options-row">
          <ha-select
            class="zone-select"
            .label=${this._localize("editors.zone_select_label")}
            .value=${this._selectedZone}
            .disabled=${this.disabled}
            fixedMenuPosition
            naturalMenuWidth
            @selected=${this._handleZoneSelected}
            @closed=${this._handleZoneMenuClosed}
          >
            ${this._renderZoneListItems()}
          </ha-select>
          <label class="option-item">
            <ha-switch
              .checked=${this.turnOffUnspecified}
              @change=${this._handleTurnOffUnspecifiedChange}
            ></ha-switch>
            <span class="option-label">${this._localize("editors.turn_off_unspecified_label")}</span>
          </label>
        </div>
      `:""}_renderColorPalette(){return"color"!==this.mode&&"sequence"!==this.mode?"":H`
      <div class="color-palette-container">
        ${"color"===this.mode?this._renderModeTabs():""}
        ${this._renderModeContent()}
      </div>
    `}_renderModeTabs(){return H`
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
    `}_renderModeContent(){return"sequence"===this.mode||"individual"===this._patternMode?this._renderIndividualMode():"gradient"===this._patternMode?this._renderGradientMode():"blocks"===this._patternMode?this._renderBlocksMode():H``}_renderIndividualMode(){return H`
      <div class="mode-description">
        Click a color to select it, then click segments to apply.
      </div>
      <div class="color-palette">
        ${this.colorPalette.map((e,t)=>H`
          <div class="palette-color-wrapper">
            <div
              class="palette-color ${this._selectedPaletteIndex===t?"selected":""}"
              style="background-color: ${It(e)}"
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
    `}_renderGradientMode(){return H`
      <div class="mode-description">
        ${this._localize("editors.gradient_mode_description")}
      </div>
      <div class="color-array">
        ${this.gradientColors.map((e,t)=>H`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${It(e)}"
              @click=${()=>this._openColorPicker("gradient",t)}
            ></div>
            ${this.gradientColors.length>2?H`
              <button class="color-remove" @click=${()=>this._removeGradientColor(t)}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            `:H`<div class="color-remove-spacer"></div>`}
          </div>
        `)}
        ${this.gradientColors.length<6?H`
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
          <ha-switch
            .checked=${this.gradientReverse}
            @change=${this._handleGradientReverseChange}
          ></ha-switch>
          <span class="option-label">${this._localize("editors.gradient_reverse_label")}</span>
        </label>
        <label class="option-item">
          <ha-switch
            .checked=${this.gradientMirror}
            @change=${this._handleGradientMirrorChange}
          ></ha-switch>
          <span class="option-label">${this._localize("editors.gradient_mirror_label")}</span>
        </label>
        <label class="option-item">
          <ha-switch
            .checked=${this.gradientWave}
            @change=${this._handleGradientWaveChange}
          ></ha-switch>
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
        ${this.gradientWave?H`
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
    `}_renderBlocksMode(){return H`
      <div class="mode-description">
        ${this._localize("editors.blocks_mode_description")}
      </div>
      <div class="color-array">
        ${this.blockColors.map((e,t)=>H`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${It(e)}"
              @click=${()=>this._openColorPicker("blocks",t)}
            ></div>
            ${this.blockColors.length>1?H`
              <button class="color-remove" @click=${()=>this._removeBlockColor(t)}>
                <ha-icon icon="mdi:close"></ha-icon>
              </button>
            `:H`<div class="color-remove-spacer"></div>`}
          </div>
        `)}
        ${this.blockColors.length<6?H`
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
          <ha-switch
            .checked=${this.expandBlocks}
            @change=${this._handleExpandBlocksChange}
          ></ha-switch>
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
    `}_renderColorPickerModal(){if(null===this._editingColorSource||null===this._editingColor)return"";const e=Re(this._editingColor),t=Me(e.x,e.y,255),i=Ae(t);return H`
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
          <color-history-swatches
            .colorHistory=${this.colorHistory}
            .translations=${this.translations}
            @color-selected=${this._handleHistoryColorSelected}
          ></color-history-swatches>
          <div class="color-picker-modal-actions">
            <ha-button @click=${this._closeColorPicker}>${this._localize("editors.cancel_button")}</ha-button>
            <ha-button @click=${this._confirmColorPicker}>
              <ha-icon icon="mdi:check"></ha-icon>
              ${this._localize("editors.apply_button")}
            </ha-button>
          </div>
        </div>
      </div>
    `}_renderColorWheel(){const e=220,t="color-wheel-canvas",i="color-wheel-marker";if(!this._editingColor)return H``;const s=Re(this._editingColor),o=Ae(Me(s.x,s.y,255)),{x:n,y:r}=this._hsToWheelPosition(this._editingColor,e);return setTimeout(()=>{this._drawColorWheel(t,e),this._wheelIsDragging||this._updateMarkerPosition(t,i,e)},0),H`
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
          style="position: absolute; left: ${n}px; top: ${r}px; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3); pointer-events: none; transform: translate(-50%, -50%); transition: box-shadow 0.1s ease; background-color: ${o};"
        ></div>
      </div>
    `}_drawColorWheel(e,t){const i=this.shadowRoot?.getElementById(e);if(!i)return;const s=i.getContext("2d");if(!s)return;const o=t/2,n=t/2,r=t/2;i.width=t,i.height=t;for(let e=0;e<360;e++){const t=(e-1)*Math.PI/180,i=(e+1)*Math.PI/180,a=s.createRadialGradient(o,n,0,o,n,r);a.addColorStop(0,`hsl(${e}, 0%, 100%)`),a.addColorStop(1,`hsl(${e}, 100%, 50%)`),s.beginPath(),s.moveTo(o,n),s.arc(o,n,r,t,i),s.closePath(),s.fillStyle=a,s.fill()}}_updateMarkerPosition(e,t,i){const s=this.shadowRoot?.getElementById(t);if(!s||!this._editingColor)return;const{x:o,y:n}=this._hsToWheelPosition(this._editingColor,i),r=Re(this._editingColor),a=Ae(Me(r.x,r.y,255));s.style.left=`${o}px`,s.style.top=`${n}px`,s.style.backgroundColor=a}_hsToWheelPosition(e,t){const i=t/2,s=t/2,o=t/2,n=e.h*Math.PI/180,r=e.s/100*o;return{x:i+r*Math.cos(n),y:s+r*Math.sin(n)}}_wheelPositionToHs(e,t,i){const s=i/2,o=e-i/2,n=t-i/2;let r=Math.sqrt(o*o+n*n);r=Math.min(r,s);let a=180*Math.atan2(n,o)/Math.PI;a<0&&(a+=360);let l=Math.round(r/s*100);return l>=98&&(l=100),{h:Math.round(a)%360,s:l}}_onWheelPointerDown(e,t,i,s){e.preventDefault(),this._wheelIsDragging=!0,this._wheelCanvasId=t,this._wheelMarkerId=i,this._wheelSize=s;const o=this.shadowRoot?.getElementById(i);o&&(o.style.boxShadow="0 0 8px rgba(0, 0, 0, 0.7), inset 0 0 2px rgba(0, 0, 0, 0.3)"),this._handleWheelInteraction(e,t,i,s),e instanceof MouseEvent?(this._wheelPointerMoveBound=e=>this._onWheelPointerMove(e),this._wheelPointerUpBound=()=>this._onWheelPointerUp(),window.addEventListener("mousemove",this._wheelPointerMoveBound),window.addEventListener("mouseup",this._wheelPointerUpBound)):(this._wheelPointerMoveBound=e=>this._onWheelPointerMove(e),this._wheelPointerUpBound=()=>this._onWheelPointerUp(),window.addEventListener("touchmove",this._wheelPointerMoveBound,{passive:!1}),window.addEventListener("touchend",this._wheelPointerUpBound))}_onWheelPointerMove(e){this._wheelIsDragging&&this._wheelCanvasId&&this._wheelMarkerId&&(e.preventDefault(),this._handleWheelInteraction(e,this._wheelCanvasId,this._wheelMarkerId,this._wheelSize))}_onWheelPointerUp(){this._wheelIsDragging=!1;const e=this._wheelMarkerId?this.shadowRoot?.getElementById(this._wheelMarkerId):null;e&&(e.style.boxShadow="0 0 4px rgba(0, 0, 0, 0.5), inset 0 0 2px rgba(0, 0, 0, 0.3)"),this._wheelPointerMoveBound&&(window.removeEventListener("mousemove",this._wheelPointerMoveBound),window.removeEventListener("touchmove",this._wheelPointerMoveBound),this._wheelPointerMoveBound=null),this._wheelPointerUpBound&&(window.removeEventListener("mouseup",this._wheelPointerUpBound),window.removeEventListener("touchend",this._wheelPointerUpBound),this._wheelPointerUpBound=null)}_handleWheelInteraction(e,t,i,s){const o=this.shadowRoot?.getElementById(t);if(!o)return;const n=o.getBoundingClientRect();let r,a;if("touches"in e){const t=e.touches[0];if(!t)return;r=t.clientX,a=t.clientY}else r=e.clientX,a=e.clientY;const l=r-n.left,c=a-n.top,d=this._wheelPositionToHs(l,c,s);this._editingColor=d,this._updateMarkerPosition(t,i,s);const h=this.shadowRoot?.querySelector(".color-picker-modal-preview");if(h){const e=Re(this._editingColor),t=Ae(Me(e.x,e.y,255));h.style.backgroundColor=t}const p=this.shadowRoot?.querySelectorAll(".rgb-input-field");if(p&&3===p.length){const e=Re(this._editingColor),t=Me(e.x,e.y,255),i=p[0],s=p[1],o=p[2];i&&(i.value=String(t.r)),s&&(s.value=String(t.g)),o&&(o.value=String(t.b))}}render(){return H`
      <div class="segment-selector">
        ${this.label?H`<span class="label">${this.label}</span>`:""}
        ${this._renderGrid()}
        ${this._renderColorPalette()}
        ${this.description?H`<span class="description">${this.description}</span>`:""}
        ${this._renderColorPickerModal()}
      </div>
    `}};e([pe({type:Object})],qt.prototype,"hass",void 0),e([pe({type:String})],qt.prototype,"mode",void 0),e([pe({type:Number})],qt.prototype,"maxSegments",void 0),e([pe({type:String})],qt.prototype,"value",void 0),e([pe({type:Object})],qt.prototype,"colorValue",void 0),e([pe({type:Array})],qt.prototype,"colorPalette",void 0),e([pe({type:Array})],qt.prototype,"gradientColors",void 0),e([pe({type:Array})],qt.prototype,"blockColors",void 0),e([pe({type:Boolean})],qt.prototype,"expandBlocks",void 0),e([pe({type:Boolean})],qt.prototype,"gradientMirror",void 0),e([pe({type:Number})],qt.prototype,"gradientRepeat",void 0),e([pe({type:Boolean})],qt.prototype,"gradientReverse",void 0),e([pe({type:String})],qt.prototype,"gradientInterpolation",void 0),e([pe({type:Boolean})],qt.prototype,"gradientWave",void 0),e([pe({type:Number})],qt.prototype,"gradientWaveCycles",void 0),e([pe({type:String})],qt.prototype,"label",void 0),e([pe({type:String})],qt.prototype,"description",void 0),e([pe({type:Boolean})],qt.prototype,"disabled",void 0),e([pe({type:Object})],qt.prototype,"translations",void 0),e([pe({type:Array})],qt.prototype,"colorHistory",void 0),e([pe({type:String})],qt.prototype,"initialPatternMode",void 0),e([pe({type:Array})],qt.prototype,"zones",void 0),e([pe({type:Boolean})],qt.prototype,"turnOffUnspecified",void 0),e([pe({type:Boolean})],qt.prototype,"hideControls",void 0),e([_e()],qt.prototype,"_selectedSegments",void 0),e([_e()],qt.prototype,"_coloredSegments",void 0),e([_e()],qt.prototype,"_lastSelectedIndex",void 0),e([_e()],qt.prototype,"_selectedPaletteIndex",void 0),e([_e()],qt.prototype,"_selectedZone",void 0),e([_e()],qt.prototype,"_clearMode",void 0),e([_e()],qt.prototype,"_selectMode",void 0),e([_e()],qt.prototype,"_patternMode",void 0),e([_e()],qt.prototype,"_editingColorSource",void 0),e([_e()],qt.prototype,"_editingColorIndex",void 0),e([_e()],qt.prototype,"_editingColor",void 0),qt=e([ce("segment-selector")],qt);const Ut="aqara-advanced-lighting-panel";customElements.get(Ut)?console.log(`${Ut} already registered`):console.log(`Registering ${Ut}`),window.customPanel&&window.customPanel(Ut)}();
