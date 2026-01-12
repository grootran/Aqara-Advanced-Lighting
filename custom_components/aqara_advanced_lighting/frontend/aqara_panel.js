!function(){"use strict";function e(e,t,i,s){var o,a=arguments.length,r=a<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,s);else for(var n=e.length-1;n>=0;n--)(o=e[n])&&(r=(a<3?o(r):a>3?o(t,i,r):o(t,i))||r);return a>3&&r&&Object.defineProperty(t,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let a=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=o.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&o.set(t,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[s+1],e[0]);return new a(i,e,s)},n=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new a("string"==typeof e?e:e+"",void 0,s))(t)})(e):e,{is:l,defineProperty:c,getOwnPropertyDescriptor:d,getOwnPropertyNames:h,getOwnPropertySymbols:p,getPrototypeOf:_}=Object,g=globalThis,m=g.trustedTypes,u=m?m.emptyScript:"",v=g.reactiveElementPolyfillSupport,f=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?u:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},y=(e,t)=>!l(e,t),x={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=x){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(e,i,t);void 0!==s&&c(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){const{get:s,set:o}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:s,set(t){const a=s?.call(this);o?.call(this,t),this.requestUpdate(e,a,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??x}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=_(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...h(e),...p(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,s)=>{if(i)e.adoptedStyleSheets=s.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of s){const s=document.createElement("style"),o=t.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=i.cssText,e.appendChild(s)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(void 0!==s&&!0===i.reflect){const o=(void 0!==i.converter?.toAttribute?i.converter:b).toAttribute(t,i.type);this._$Em=e,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(e,t){const i=this.constructor,s=i._$Eh.get(e);if(void 0!==s&&this._$Em!==s){const e=i.getPropertyOptions(s),o="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:b;this._$Em=s;const a=o.fromAttribute(t,e.type);this[s]=a??this._$Ej?.get(s)??a,this._$Em=null}}requestUpdate(e,t,i,s=!1,o){if(void 0!==e){const a=this.constructor;if(!1===s&&(o=this[e]),i??=a.getPropertyOptions(e),!((i.hasChanged??y)(o,t)||i.useDefault&&i.reflect&&o===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:s,wrapped:o},a){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==o||void 0!==a)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===s&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,s=this[t];!0!==e||this._$AL.has(t)||void 0===s||this.C(t,void 0,i,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,v?.({ReactiveElement:$}),(g.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,C=e=>e,S=w.trustedTypes,k=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,P="$lit$",E=`lit$${Math.random().toFixed(9).slice(2)}$`,z="?"+E,A=`<${z}>`,T=document,M=()=>T.createComment(""),q=e=>null===e||"object"!=typeof e&&"function"!=typeof e,D=Array.isArray,I="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,B=/-->/g,F=/>/g,O=RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),N=/'/g,L=/"/g,j=/^(?:script|style|textarea|title)$/i,R=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),H=Symbol.for("lit-noChange"),G=Symbol.for("lit-nothing"),V=new WeakMap,W=T.createTreeWalker(T,129);function Y(e,t){if(!D(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==k?k.createHTML(t):t}const K=(e,t)=>{const i=e.length-1,s=[];let o,a=2===t?"<svg>":3===t?"<math>":"",r=U;for(let t=0;t<i;t++){const i=e[t];let n,l,c=-1,d=0;for(;d<i.length&&(r.lastIndex=d,l=r.exec(i),null!==l);)d=r.lastIndex,r===U?"!--"===l[1]?r=B:void 0!==l[1]?r=F:void 0!==l[2]?(j.test(l[2])&&(o=RegExp("</"+l[2],"g")),r=O):void 0!==l[3]&&(r=O):r===O?">"===l[0]?(r=o??U,c=-1):void 0===l[1]?c=-2:(c=r.lastIndex-l[2].length,n=l[1],r=void 0===l[3]?O:'"'===l[3]?L:N):r===L||r===N?r=O:r===B||r===F?r=U:(r=O,o=void 0);const h=r===O&&e[t+1].startsWith("/>")?" ":"";a+=r===U?i+A:c>=0?(s.push(n),i.slice(0,c)+P+i.slice(c)+E+h):i+E+(-2===c?t:h)}return[Y(e,a+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),s]};class X{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let o=0,a=0;const r=e.length-1,n=this.parts,[l,c]=K(e,t);if(this.el=X.createElement(l,i),W.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(s=W.nextNode())&&n.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const e of s.getAttributeNames())if(e.endsWith(P)){const t=c[a++],i=s.getAttribute(e).split(E),r=/([.?@])?(.*)/.exec(t);n.push({type:1,index:o,name:r[2],strings:i,ctor:"."===r[1]?te:"?"===r[1]?ie:"@"===r[1]?se:ee}),s.removeAttribute(e)}else e.startsWith(E)&&(n.push({type:6,index:o}),s.removeAttribute(e));if(j.test(s.tagName)){const e=s.textContent.split(E),t=e.length-1;if(t>0){s.textContent=S?S.emptyScript:"";for(let i=0;i<t;i++)s.append(e[i],M()),W.nextNode(),n.push({type:2,index:++o});s.append(e[t],M())}}}else if(8===s.nodeType)if(s.data===z)n.push({type:2,index:o});else{let e=-1;for(;-1!==(e=s.data.indexOf(E,e+1));)n.push({type:7,index:o}),e+=E.length-1}o++}}static createElement(e,t){const i=T.createElement("template");return i.innerHTML=e,i}}function J(e,t,i=e,s){if(t===H)return t;let o=void 0!==s?i._$Co?.[s]:i._$Cl;const a=q(t)?void 0:t._$litDirective$;return o?.constructor!==a&&(o?._$AO?.(!1),void 0===a?o=void 0:(o=new a(e),o._$AT(e,i,s)),void 0!==s?(i._$Co??=[])[s]=o:i._$Cl=o),void 0!==o&&(t=J(e,o._$AS(e,t.values),o,s)),t}class Z{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,s=(e?.creationScope??T).importNode(t,!0);W.currentNode=s;let o=W.nextNode(),a=0,r=0,n=i[0];for(;void 0!==n;){if(a===n.index){let t;2===n.type?t=new Q(o,o.nextSibling,this,e):1===n.type?t=new n.ctor(o,n.name,n.strings,this,e):6===n.type&&(t=new oe(o,this,e)),this._$AV.push(t),n=i[++r]}a!==n?.index&&(o=W.nextNode(),a++)}return W.currentNode=T,s}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}}class Q{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,s){this.type=2,this._$AH=G,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),q(e)?e===G||null==e||""===e?(this._$AH!==G&&this._$AR(),this._$AH=G):e!==this._$AH&&e!==H&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>D(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==G&&q(this._$AH)?this._$AA.nextSibling.data=e:this.T(T.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,s="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=X.createElement(Y(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(t);else{const e=new Z(s,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=V.get(e.strings);return void 0===t&&V.set(e.strings,t=new X(e)),t}k(e){D(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,s=0;for(const o of e)s===t.length?t.push(i=new Q(this.O(M()),this.O(M()),this,this.options)):i=t[s],i._$AI(o),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=C(e).nextSibling;C(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,s,o){this.type=1,this._$AH=G,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=o,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=G}_$AI(e,t=this,i,s){const o=this.strings;let a=!1;if(void 0===o)e=J(this,e,t,0),a=!q(e)||e!==this._$AH&&e!==H,a&&(this._$AH=e);else{const s=e;let r,n;for(e=o[0],r=0;r<o.length-1;r++)n=J(this,s[i+r],t,r),n===H&&(n=this._$AH[r]),a||=!q(n)||n!==this._$AH[r],n===G?e=G:e!==G&&(e+=(n??"")+o[r+1]),this._$AH[r]=n}a&&!s&&this.j(e)}j(e){e===G?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===G?void 0:e}}class ie extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==G)}}class se extends ee{constructor(e,t,i,s,o){super(e,t,i,s,o),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??G)===H)return;const i=this._$AH,s=e===G&&i!==G||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,o=e!==G&&(i===G||s);s&&this.element.removeEventListener(this.name,this,i),o&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class oe{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const ae=w.litHtmlPolyfillSupport;ae?.(X,Q),(w.litHtmlVersions??=[]).push("3.3.2");const re=globalThis;let ne=class extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const s=i?.renderBefore??t;let o=s._$litPart$;if(void 0===o){const e=i?.renderBefore??null;s._$litPart$=o=new Q(t.insertBefore(M(),e),e,void 0,i??{})}return o._$AI(e),o})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return H}};ne._$litElement$=!0,ne.finalized=!0,re.litElementHydrateSupport?.({LitElement:ne});const le=re.litElementPolyfillSupport;le?.({LitElement:ne}),(re.litElementVersions??=[]).push("4.2.2");const ce=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},de={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:y},he=(e=de,t,i)=>{const{kind:s,metadata:o}=i;let a=globalThis.litPropertyMetadata.get(o);if(void 0===a&&globalThis.litPropertyMetadata.set(o,a=new Map),"setter"===s&&((e=Object.create(e)).wrapped=!0),a.set(i.name,e),"accessor"===s){const{name:s}=i;return{set(i){const o=t.get.call(this);t.set.call(this,i),this.requestUpdate(s,o,e,!0,i)},init(t){return void 0!==t&&this.C(s,void 0,e,t),t}}}if("setter"===s){const{name:s}=i;return function(i){const o=this[s];t.call(this,i),this.requestUpdate(s,o,e,!0,i)}}throw Error("Unsupported decorator location: "+s)};function pe(e){return(t,i)=>"object"==typeof i?he(e,t,i):((e,t,i)=>{const s=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),s?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function _e(e){return pe({...e,state:!0,attribute:!1})}function ge(e,t){return(t,i,s)=>((e,t,i)=>(i.configurable=!0,i.enumerable=!0,Reflect.decorate&&"object"!=typeof t&&Object.defineProperty(e,t,i),i))(t,i,{get(){return(t=>t.renderRoot?.querySelector(e)??null)(this)}})}const me=2;class ue{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}const ve=(e,t)=>{const i=e._$AN;if(void 0===i)return!1;for(const e of i)e._$AO?.(t,!1),ve(e,t);return!0},fe=e=>{let t,i;do{if(void 0===(t=e._$AM))break;i=t._$AN,i.delete(e),e=t}while(0===i?.size)},be=e=>{for(let t;t=e._$AM;e=t){let i=t._$AN;if(void 0===i)t._$AN=i=new Set;else if(i.has(e))break;i.add(e),$e(t)}};function ye(e){void 0!==this._$AN?(fe(this),this._$AM=e,be(this)):this._$AM=e}function xe(e,t=!1,i=0){const s=this._$AH,o=this._$AN;if(void 0!==o&&0!==o.size)if(t)if(Array.isArray(s))for(let e=i;e<s.length;e++)ve(s[e],!1),fe(s[e]);else null!=s&&(ve(s,!1),fe(s));else ve(this,e)}const $e=e=>{e.type==me&&(e._$AP??=xe,e._$AQ??=ye)};class we extends ue{constructor(){super(...arguments),this._$AN=void 0}_$AT(e,t,i){super._$AT(e,t,i),be(this),this.isConnected=e._$AU}_$AO(e,t=!0){e!==this.isConnected&&(this.isConnected=e,e?this.reconnected?.():this.disconnected?.()),t&&(ve(this,e),fe(this))}setValue(e){if((e=>void 0===e.strings)(this._$Ct))this._$Ct._$AI(e,this);else{const t=[...this._$Ct._$AH];t[this._$Ci]=e,this._$Ct._$AI(t,this,0)}}disconnected(){}reconnected(){}}class Ce{}const Se=new WeakMap,ke=(e=>(...t)=>({_$litDirective$:e,values:t}))(class extends we{render(e){return G}update(e,[t]){const i=t!==this.G;return i&&void 0!==this.G&&this.rt(void 0),(i||this.lt!==this.ct)&&(this.G=t,this.ht=e.options?.host,this.rt(this.ct=e.element)),G}rt(e){if(this.isConnected||(e=void 0),"function"==typeof this.G){const t=this.ht??globalThis;let i=Se.get(t);void 0===i&&(i=new WeakMap,Se.set(t,i)),void 0!==i.get(this.G)&&this.G.call(this.ht,void 0),i.set(this.G,e),void 0!==e&&this.G.call(this.ht,e)}else this.G.value=e}get lt(){return"function"==typeof this.G?Se.get(this.ht??globalThis)?.get(this.G):this.G?.value}disconnected(){this.lt===this.ct&&this.rt(void 0)}reconnected(){this.rt(this.ct)}}),Pe=r`
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
    top: env(safe-area-inset-top, 0px);
    left: var(--mdc-drawer-width, 0px);
    right: 0;
    z-index: 4;
  }

  :host([narrow]) .header {
    left: 0;
  }

  /* Safe area padding for iOS notch */
  @supports (padding-top: env(safe-area-inset-top)) {
    .header {
      padding-top: 0;
    }
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
    --ha-tab-active-text-color: var(--primary-text-color);
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
    color: var(--primary-text-color);
    line-height: var(--ha-line-height-condensed, 1.2);
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

  /* Favorites container - uses HA chip pattern */
  .favorites-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .favorite-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px 6px 12px;
    background: var(--card-background-color);
    border: 1px solid var(--divider-color);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
    font-size: var(--ha-font-size-s, 13px);
  }

  .favorite-chip:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
  }

  .favorite-icon {
    --mdc-icon-size: 16px;
    color: var(--warning-color, #ff9800);
  }

  .favorite-chip:hover .favorite-icon {
    color: var(--text-primary-color);
  }

  .favorite-name {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .remove-favorite-btn {
    --mdc-icon-button-size: 24px;
    --mdc-icon-size: 16px;
    margin: -4px -4px -4px 0;
    opacity: 0.7;
  }

  .remove-favorite-btn:hover {
    opacity: 1;
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

  .preset-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
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
    align-items: center;
    gap: 6px;
    padding: 6px;
    background: var(--card-background-color);
    border-radius: 8px;
    border: 1px solid var(--divider-color);
  }

  /* Color swatch - 40px for good touch targets (Apple HIG recommends 44px minimum) */
  .color-swatch {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--divider-color);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.15s ease, border-color 0.15s ease;
    flex-shrink: 0;
  }

  .color-swatch:hover {
    transform: scale(1.08);
    border-color: var(--primary-color);
  }

  .color-swatch:active {
    transform: scale(0.95);
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

  /* Remove button */
  .color-remove {
    --mdc-icon-button-size: 28px;
    --mdc-icon-size: 16px;
    opacity: 0.6;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s ease, color 0.15s ease;
  }

  .color-remove:hover {
    opacity: 1;
    color: var(--error-color);
  }

  /* Add color button - 44px minimum for touch */
  .add-color-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 2px dashed var(--divider-color);
    border-radius: 8px;
    cursor: pointer;
    color: var(--secondary-text-color);
    background: transparent;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .add-color-btn:hover {
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
    background: var(--card-background-color, #fff);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    max-width: 90vw;
  }

  .color-picker-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 8px;
  }

  .color-picker-modal-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .color-picker-modal-preview {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid var(--divider-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .color-picker-modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
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

  /* Preset category in My Presets tab */
  .preset-category {
    margin-bottom: 24px;
  }

  .preset-category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .preset-category h3 {
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-medium, 600);
    margin: 0;
    color: var(--primary-text-color);
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

  .user-preset-card:hover .preset-card-actions {
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

    .preset-category-header {
      flex-wrap: wrap;
      gap: 8px;
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

  /* Hide version on very narrow screens to prevent toolbar overflow */
  @media (max-width: 500px) {
    .version-display {
      display: none;
    }
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
    color: var(--primary-text-color);
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
    color: var(--primary-text-color);
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
    align-items: center;
    gap: 6px;
    padding: 6px;
    background: var(--card-background-color);
    border-radius: 8px;
    border: 1px solid var(--divider-color);
  }

  /* Color swatch - 40px for good touch targets (Apple HIG recommends 44px minimum) */
  .color-swatch {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--divider-color);
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.15s ease, border-color 0.15s ease;
    flex-shrink: 0;
  }

  .color-swatch:hover {
    transform: scale(1.08);
    border-color: var(--primary-color);
  }

  .color-swatch:active {
    transform: scale(0.95);
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

  /* Remove button */
  .color-remove {
    --mdc-icon-button-size: 28px;
    --mdc-icon-size: 16px;
    opacity: 0.6;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: opacity 0.15s ease, color 0.15s ease;
  }

  .color-remove:hover {
    opacity: 1;
    color: var(--error-color);
  }

  /* Add color button - 44px minimum for touch */
  .add-color-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border: 2px dashed var(--divider-color);
    border-radius: 8px;
    cursor: pointer;
    color: var(--secondary-text-color);
    background: transparent;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .add-color-btn:hover {
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
    background: var(--card-background-color, #fff);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    max-width: 90vw;
  }

  .color-picker-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 8px;
  }

  .color-picker-modal-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .color-picker-modal-preview {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid var(--divider-color);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  }

  .color-picker-modal-actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }
`;function ze(e,t,i=255){if(0===t)return{r:0,g:0,b:0};const s=1/t*e,o=1/t*(1-e-t);let a=3.2406*s-1.5372+-.4986*o,r=-.9689*s+1.8758+.0415*o,n=.0557*s-.204+1.057*o;const l=Math.max(a,r,n);l>1&&(a/=l,r/=l,n/=l),a=Math.max(0,a),r=Math.max(0,r),n=Math.max(0,n),a=a<=.0031308?12.92*a:1.055*Math.pow(a,1/2.4)-.055,r=r<=.0031308?12.92*r:1.055*Math.pow(r,1/2.4)-.055,n=n<=.0031308?12.92*n:1.055*Math.pow(n,1/2.4)-.055;const c=i/255;return{r:Math.max(0,Math.min(255,Math.round(255*a*c))),g:Math.max(0,Math.min(255,Math.round(255*r*c))),b:Math.max(0,Math.min(255,Math.round(255*n*c)))}}function Ae(e,t,i){let s=e/255,o=t/255,a=i/255;s=s>.04045?Math.pow((s+.055)/1.055,2.4):s/12.92,o=o>.04045?Math.pow((o+.055)/1.055,2.4):o/12.92,a=a>.04045?Math.pow((a+.055)/1.055,2.4):a/12.92;const r=.4124*s+.3576*o+.1805*a,n=.2126*s+.7152*o+.0722*a,l=r+n+(.0193*s+.1192*o+.9505*a);return 0===l?{x:.3127,y:.329}:{x:r/l,y:n/l}}function Te(e){const t=e=>e.toString(16).padStart(2,"0");return`#${t(e.r)}${t(e.g)}${t(e.b)}`}function Me(e,t=255){return Te(ze(e.x,e.y,t))}function qe(e,t){const i=1*(t/100),s=i*(1-Math.abs(e/60%2-1)),o=1-i;let a=0,r=0,n=0;return e>=0&&e<60?(a=i,r=s,n=0):e>=60&&e<120?(a=s,r=i,n=0):e>=120&&e<180?(a=0,r=i,n=s):e>=180&&e<240?(a=0,r=s,n=i):e>=240&&e<300?(a=s,r=0,n=i):(a=i,r=0,n=s),{r:Math.round(255*(a+o)),g:Math.round(255*(r+o)),b:Math.round(255*(n+o))}}function De(e){const t=ze(e.x,e.y,255);return function(e,t,i){const s=e/255,o=t/255,a=i/255,r=Math.max(s,o,a),n=r-Math.min(s,o,a);let l=0,c=0;return 0!==r&&(c=n/r*100),0!==n&&(l=r===s?(o-a)/n%6:r===o?(a-s)/n+2:(s-o)/n+4,l=Math.round(60*l),l<0&&(l+=360)),{h:l,s:Math.round(c)}}(t.r,t.g,t.b)}function Ie(e){const t=qe(e.h,e.s);return Ae(t.r,t.g,t.b)}const Ue={title:"Aqara Advanced Lighting",tabs:{activate:"Activate",effects:"Effects",patterns:"Patterns",cct:"CCT",segments:"Segments",presets:"My Presets",config:"Device Config"},errors:{title:"Error",loading_presets:"Failed to load presets. Please refresh the page.",loading_presets_generic:"Failed to load presets",no_presets_title:"No presets available",no_presets_message:"No built-in presets are available. Please check your configuration.",incompatible_light_title:"Incompatible light selected",incompatible_light_message:"One or more selected lights are not supported Aqara models. Please select only T1M, T1 Strip, or T2 bulb lights."},target:{section_title:"Target",select_lights:"Select lights to control",lights_selected:"{count} light selected",lights_selected_plural:"{count} lights selected",lights_label:"Lights",favorites_label:"Favorites",favorite_name_label:"Favorite Name",save_as_favorite:"Save as favorite",remove_favorite:"Remove favorite",light_control_label:"Light Control",quick_controls_label:"Quick Controls",custom_brightness_label:"Custom Brightness",brightness_label:"Brightness"},presets:{manage_description:"Manage your saved presets.",manage_description_with_selection:"Click a preset to activate it, or use the edit/delete buttons.",no_presets_title:"No saved presets yet.",no_presets_description:"Use the other tabs to create and save your custom presets.",edit_preset:"Edit preset",delete_preset:"Delete preset",no_effect_presets:"No effect presets saved",no_pattern_presets:"No pattern presets saved",no_cct_presets:"No CCT sequence presets saved",no_segment_presets:"No segment sequence presets saved",create_first_effect:"Create your first effect preset in the Effects tab.",create_first_pattern:"Create your first segment pattern in the Patterns tab.",create_first_cct:"Create your first CCT sequence in the CCT tab.",create_first_segment:"Create your first segment sequence in the Segments tab.",sort_by:"Sort by",sort_name_asc:"Name (A-Z)",sort_name_desc:"Name (Z-A)",sort_date_new:"Newest first",sort_date_old:"Oldest first"},dialogs:{create_effect_title:"Create Effect Preset",edit_effect_title:"Edit Effect Preset",create_effect_description:"Create custom dynamic effect presets with your choice of colors, speed, and brightness.",edit_effect_description:"Update your effect preset settings.",create_pattern_title:"Create Segment Pattern",edit_pattern_title:"Edit Segment Pattern",create_pattern_description:"Design custom segment patterns by setting individual segment colors.",edit_pattern_description:"Update your segment pattern settings.",create_cct_title:"Create CCT Sequence",edit_cct_title:"Edit CCT Sequence",create_cct_description:"Build color temperature sequences with multiple steps and timing controls.",edit_cct_description:"Update your CCT sequence settings.",create_segment_title:"Create Segment Sequence",edit_segment_title:"Edit Segment Sequence",create_segment_description:"Design animated segment sequences with multiple steps and transition effects.",edit_segment_description:"Update your segment sequence settings.",compatibility_warning_effects:"The selected light does not support dynamic effects. Compatible models: T2 RGB, T1M, T1 Strip.",compatibility_warning_patterns:"The selected light does not support segment patterns. Compatible models: T1M, T1 Strip.",compatibility_warning_cct:"The selected light does not support CCT sequences. Compatible models: T2 RGB, T2 CCT, T1M, T1 Strip.",compatibility_warning_segments:"The selected light does not support segment sequences. Compatible models: T1M, T1 Strip."},config:{transition_settings:"Transition Settings",transition_description:"Configure the transition curve for T2 bulbs when changing states.",curvature_label:"Curvature",custom_curvature_label:"Custom curvature",initial_brightness_label:"Initial brightness",on_to_off_duration_label:"On to off duration",off_to_on_duration_label:"Off to on duration",dimming_range_min_label:"Dimming range minimum",dimming_range_max_label:"Dimming range maximum",strip_length_label:"Strip length",apply_button:"Apply to selected lights",applying_button:"Applying...",version_info:"Version Information",backend_version:"Backend",frontend_version:"Frontend",loading_version:"Loading..."},transition_curve:{title:"Transition curve",subtitle:"Drag on the graph to adjust",brightness_axis:"Brightness",time_axis:"Time"},tooltips:{color_edit:"Click to edit color",color_remove:"Remove color",color_add:"Add color",color_select:"Color {index} - Click to select",color_edit_index:"Edit color {index}",step_move_up:"Move up",step_move_down:"Move down",step_duplicate:"Duplicate",step_remove:"Remove",segment_number:"Segment {number}",segment_clear:"Segment {number} - Click to clear",mode_select:"Toggle select mode - when active, clicking segments toggles selection",mode_clear:"Toggle clear mode - when active, clicking segments removes their color",favorite_save:"Save as favorite",favorite_remove:"Remove favorite",preset_edit:"Edit preset",preset_delete:"Delete preset"},options:{loop_mode_once:"Run once",loop_mode_count:"Loop N times",loop_mode_continuous:"Continuous loop",end_behavior_maintain:"Stay at last step",end_behavior_turn_off:"Turn off light",pattern_mode_blocks_repeat:"Blocks (Repeat)",pattern_mode_blocks_expand:"Blocks (Expand)",pattern_mode_gradient:"Gradient",activation_all:"All at once",activation_sequential_forward:"Sequential forward",activation_sequential_reverse:"Sequential reverse",activation_random:"Random",activation_ping_pong:"Ping pong",activation_center_out:"Center out",activation_edges_in:"Edges in",activation_paired:"Paired"},editors:{name_label:"Name",icon_label:"Icon",cancel_button:"Cancel",save_button:"Save",preview_button:"Preview",stop_preview_button:"Stop preview",select_all_button:"Select all",clear_all_button:"Clear all",clear_selected_button:"Clear selected",clear_mode_on:"Clear: ON",clear_mode_off:"Clear: OFF",segments_selected:"{count} selected",select_mode_on:"Select: ON",select_mode_off:"Select: OFF",add_step_button:"Add step",apply_to_selected_button:"Apply to selected",loop_mode_label:"Loop mode",loop_count_label:"Loop count",end_behavior_label:"End behavior",device_type_label:"Device type",skip_first_step_label:"Skip first step in loop",no_steps_message:'No steps defined. Click "Add step" to create your first step.',segments_label:"Segments",segments_description:'Segments to apply effect to (e.g., "1,2,3", "1-20", "odd", "even", "first-half", "last-third").',segments_input_label:"Segments (e.g., 1-5, 10, 15-20)",colors_label:"Colors (1-8)",color_temperature_label:"Color temperature ({value}K)",transition_time_label:"Transition time (seconds)",hold_time_label:"Hold time (seconds)",duration_label:"Duration (seconds)",activation_pattern_label:"Activation pattern",pattern_mode_label:"Pattern mode",speed_label:"Speed",effect_label:"Effect",mode_label:"Mode",segment_grid_label:"Segment grid",brightness_label:"Brightness",brightness_percent_label:"Brightness (%)",steps_label:"Steps (1-20)",select_lights_for_preview_effects:"Select light entities in the Activate tab to preview effects on your devices.",select_lights_for_preview_patterns:"Select light entities in the Activate tab to preview patterns on your devices.",select_lights_for_preview_sequences:"Select light entities in the Activate tab to preview sequences on your devices."}};let Be=class extends ne{constructor(){super(...arguments),this.color={h:0,s:100},this.size=200,this._isDragging=!1,this._onPointerMove=e=>{this._isDragging&&(e.preventDefault(),this._handleInteraction(e))},this._onPointerUp=()=>{this._isDragging=!1,this._marker?.classList.remove("dragging"),window.removeEventListener("mousemove",this._onPointerMove),window.removeEventListener("mouseup",this._onPointerUp),window.removeEventListener("touchmove",this._onPointerMove),window.removeEventListener("touchend",this._onPointerUp)}}firstUpdated(){this._drawColorWheel(),this._updateMarkerPosition()}updated(e){e.has("size")&&this._drawColorWheel(),e.has("color")&&!this._isDragging&&this._updateMarkerPosition()}_drawColorWheel(){const e=this._canvas;if(!e)return;const t=e.getContext("2d");if(!t)return;const i=this.size,s=i/2,o=i/2,a=i/2;e.width=i,e.height=i;for(let e=0;e<360;e++){const i=(e-1)*Math.PI/180,r=(e+1)*Math.PI/180,n=t.createRadialGradient(s,o,0,s,o,a);n.addColorStop(0,"hsl("+e+", 0%, 100%)"),n.addColorStop(1,"hsl("+e+", 100%, 50%)"),t.beginPath(),t.moveTo(s,o),t.arc(s,o,a,i,r),t.closePath(),t.fillStyle=n,t.fill()}}_updateMarkerPosition(){if(!this._marker)return;const{x:e,y:t}=this._hsToPosition(this.color);var i;this._marker.style.left=`${e}px`,this._marker.style.top=`${t}px`,this._marker.style.backgroundColor=Te(qe((i=this.color).h,i.s))}_hsToPosition(e){const t=this.size/2,i=this.size/2,s=this.size/2,o=e.h*Math.PI/180,a=e.s/100*s;return{x:t+a*Math.cos(o),y:i+a*Math.sin(o)}}_positionToHs(e,t){const i=this.size/2,s=this.size/2,o=this.size/2,a=e-i,r=t-s;let n=Math.sqrt(a*a+r*r);n=Math.min(n,o);let l=180*Math.atan2(r,a)/Math.PI;return l<0&&(l+=360),{h:Math.round(l)%360,s:Math.round(n/o*100)}}_handleInteraction(e){const t=this._canvas;if(!t)return;const i=t.getBoundingClientRect();let s,o;if(e instanceof TouchEvent){const t=e.touches[0];if(!t)return;s=t.clientX,o=t.clientY}else s=e.clientX,o=e.clientY;const a=s-i.left,r=o-i.top,n=this._positionToHs(a,r);this.color=n,this._updateMarkerPosition(),this.dispatchEvent(new CustomEvent("color-changed",{detail:{color:n},bubbles:!0,composed:!0}))}_onPointerDown(e){e.preventDefault(),this._isDragging=!0,this._marker?.classList.add("dragging"),this._handleInteraction(e),e instanceof MouseEvent?(window.addEventListener("mousemove",this._onPointerMove),window.addEventListener("mouseup",this._onPointerUp)):(window.addEventListener("touchmove",this._onPointerMove,{passive:!1}),window.addEventListener("touchend",this._onPointerUp))}render(){return R`
      <div class="color-picker-container" style="width: ${this.size}px; height: ${this.size}px;">
        <canvas
          @mousedown=${this._onPointerDown}
          @touchstart=${this._onPointerDown}
        ></canvas>
        <div class="marker"></div>
      </div>
    `}};Be.styles=r`
    :host {
      display: inline-block;
    }

    .color-picker-container {
      position: relative;
      touch-action: none;
    }

    canvas {
      border-radius: 50%;
      cursor: crosshair;
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

    .center-white {
      position: absolute;
      width: 20%;
      height: 20%;
      border-radius: 50%;
      background: radial-gradient(circle, white 0%, transparent 100%);
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }
  `,e([pe({type:Object})],Be.prototype,"color",void 0),e([pe({type:Number})],Be.prototype,"size",void 0),e([_e()],Be.prototype,"_isDragging",void 0),e([ge("canvas")],Be.prototype,"_canvas",void 0),e([ge(".marker")],Be.prototype,"_marker",void 0),Be=e([ce("hs-color-picker")],Be);const Fe={t2_bulb:["breathing","candlelight","fading","flash"],t1:["flow1","flow2","fading","hopping","breathing","rolling"],t1m:["flow1","flow2","fading","hopping","breathing","rolling"],t1_strip:["breathing","rainbow1","chasing","flash","hopping","rainbow2","flicker","dash"]},Oe={},Ne={t2_bulb:"T2 Bulb",t1:"T1 (20 segments)",t1m:"T1M (26 segments)",t1_strip:"T1 Strip"};let Le=class extends ne{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.previewActive=!1,this._name="",this._icon="",this._deviceType="t2_bulb",this._effect="",this._speed=50,this._brightness=100,this._colors=[{x:.68,y:.31}],this._segments="",this._saving=!1,this._previewing=!1,this._editingColorIndex=null,this._editingColor=null}updated(e){super.updated(e),e.has("preset")&&this.preset&&this._loadPreset(this.preset)}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._deviceType=e.device_type||"t2_bulb",this._effect=e.effect,this._speed=e.effect_speed,this._brightness=e.effect_brightness||100,this._colors=e.effect_colors.map(e=>"x"in e&&"y"in e?{x:e.x,y:e.y}:"r"in e&&"g"in e&&"b"in e?Ae(e.r,e.g,e.b):{x:.68,y:.31}),this._segments=e.effect_segments||""}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleDeviceTypeChange(e){this._deviceType=e.detail.value||"t2_bulb",this._effect=""}_handleSpeedChange(e){this._speed=e.detail.value||50}_handleBrightnessChange(e){this._brightness=e.detail.value||100}_handleSegmentsChange(e){this._segments=e.detail.value||""}_openColorPicker(e){const t=this._colors[e];t&&(this._editingColorIndex=e,this._editingColor=De(t))}_handleColorPickerChange(e){this._editingColor=e.detail.color}_confirmColorPicker(){if(null!==this._editingColorIndex&&null!==this._editingColor){const e=Ie(this._editingColor);this._colors=this._colors.map((t,i)=>i===this._editingColorIndex?e:t)}this._closeColorPicker()}_closeColorPicker(){this._editingColorIndex=null,this._editingColor=null}_addColor(){this._colors.length<8&&(this._colors=[...this._colors,{x:.3127,y:.329}])}_removeColor(e){this._colors.length>1&&(this._colors=this._colors.filter((t,i)=>i!==e))}_colorToHex(e){return Me(e,255)}_getEffectIconUrl(e){return`/api/aqara_advanced_lighting/icons/${Oe[e]||e}.svg`}_selectEffect(e){this._effect=e}_getPresetData(){const e={name:this._name,icon:this._icon||void 0,device_type:this._deviceType,effect:this._effect,effect_speed:this._speed,effect_brightness:this._brightness,effect_colors:this._colors};return"t1_strip"===this._deviceType&&this._segments&&(e.effect_segments=this._segments),e}async _preview(){if(this.hass&&this._effect&&!this._previewing){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&this._effect){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){const e=Object.entries(Ne).map(([e,t])=>({value:e,label:t})),t=Fe[this._deviceType]||[],i="t1_strip"===this._deviceType;return R`
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

        ${i?R`
              <div class="form-section">
                <span class="form-label">${this._localize("editors.segments_label")}</span>
                <ha-selector
                  .hass=${this.hass}
                  .selector=${{text:{}}}
                  .value=${this._segments}
                  @value-changed=${this._handleSegmentsChange}
                ></ha-selector>
                <span class="field-description">${this._localize("editors.segments_description")}</span>
              </div>
            `:""}

        <div class="form-section">
          <span class="form-label">${this._localize("editors.effect_label")}</span>
          <div class="effect-grid">
            ${t.map(e=>R`
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
            ${this._colors.map((e,t)=>R`
                <div class="color-item">
                  <div
                    class="color-swatch"
                    style="background-color: ${this._colorToHex(e)}"
                    @click=${()=>this._openColorPicker(t)}
                    title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_edit")}"
                  ></div>
                  ${this._colors.length>1?R`
                        <ha-icon-button
                          class="color-remove"
                          @click=${()=>this._removeColor(t)}
                          title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_remove")}"
                        >
                          <ha-icon icon="mdi:close"></ha-icon>
                        </ha-icon-button>
                      `:""}
                </div>
              `)}
            <div
              class="add-color-btn ${this._colors.length>=8?"disabled":""}"
              @click=${this._addColor}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_add")}"
            >
              <ha-icon icon="mdi:plus"></ha-icon>
            </div>
          </div>
        </div>

        ${null!==this._editingColorIndex&&null!==this._editingColor?R`
              <div class="color-picker-modal-overlay" @click=${this._closeColorPicker}>
                <div class="color-picker-modal" @click=${e=>e.stopPropagation()}>
                  <div class="color-picker-modal-header">
                    <span class="color-picker-modal-title">Select color</span>
                    <div
                      class="color-picker-modal-preview"
                      style="background-color: ${this._editingColor?`hsl(${this._editingColor.h}, ${this._editingColor.s}%, 50%)`:"#fff"}"
                    ></div>
                  </div>
                  <hs-color-picker
                    .color=${this._editingColor}
                    .size=${220}
                    @color-changed=${this._handleColorPickerChange}
                  ></hs-color-picker>
                  <div class="color-picker-modal-actions">
                    <ha-button @click=${this._closeColorPicker}>${this._localize("editors.cancel_button")}</ha-button>
                    <ha-button @click=${this._confirmColorPicker}>
                      <ha-icon icon="mdi:check"></ha-icon>
                      Apply
                    </ha-button>
                  </div>
                </div>
              </div>
            `:""}

        ${this.hasSelectedEntities?"":R`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_effects")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?R`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  Stop
                </ha-button>
              `:R`
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
    `}};Le.styles=[Ee,r`
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
  `],e([pe({attribute:!1})],Le.prototype,"hass",void 0),e([pe({type:Object})],Le.prototype,"preset",void 0),e([pe({type:Object})],Le.prototype,"translations",void 0),e([pe({type:Boolean})],Le.prototype,"editMode",void 0),e([pe({type:Boolean})],Le.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],Le.prototype,"isCompatible",void 0),e([pe({type:Boolean})],Le.prototype,"previewActive",void 0),e([_e()],Le.prototype,"_name",void 0),e([_e()],Le.prototype,"_icon",void 0),e([_e()],Le.prototype,"_deviceType",void 0),e([_e()],Le.prototype,"_effect",void 0),e([_e()],Le.prototype,"_speed",void 0),e([_e()],Le.prototype,"_brightness",void 0),e([_e()],Le.prototype,"_colors",void 0),e([_e()],Le.prototype,"_segments",void 0),e([_e()],Le.prototype,"_saving",void 0),e([_e()],Le.prototype,"_previewing",void 0),e([_e()],Le.prototype,"_editingColorIndex",void 0),e([_e()],Le.prototype,"_editingColor",void 0),Le=e([ce("effect-editor")],Le);const je={t1:20,t1m:26,t1_strip:50},Re={t1:"T1 (20 segments)",t1m:"T1M (26 segments)",t1_strip:"T1 Strip (up to 50 segments)"},He=[{x:.68,y:.31},{x:.17,y:.7},{x:.15,y:.06},{x:.42,y:.51},{x:.38,y:.16},{x:.22,y:.33}];let Ge=class extends ne{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.stripSegmentCount=50,this._name="",this._icon="",this._deviceType="t1m",this._segments=new Map,this._selectedSegments=new Set,this._saving=!1,this._previewing=!1,this._clearMode=!1,this._selectMode=!1,this._patternMode="individual",this._colorPalette=[...He],this._selectedPaletteIndex=0,this._gradientColors=[{x:.68,y:.31},{x:.15,y:.06}],this._blockColors=[{x:.68,y:.31},{x:.17,y:.7}],this._expandBlocks=!1,this._editingColorSource=null,this._editingColorIndex=null,this._editingColor=null}updated(e){if(super.updated(e),e.has("preset")&&this.preset&&this._loadPreset(this.preset),e.has("stripSegmentCount")&&"t1_strip"===this._deviceType){const e=this._getMaxSegments();let t=!1;const i=new Map;for(const[s,o]of this._segments)s<e?i.set(s,o):t=!0;if(t){this._segments=i;const t=new Set;for(const i of this._selectedSegments)i<e&&t.add(i);this._selectedSegments=t}}}_getMaxSegments(){return"t1_strip"===this._deviceType?this.stripSegmentCount:je[this._deviceType]||26}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._deviceType=e.device_type||"t1m",this._segments=new Map,this._selectedSegments=new Set,this._patternMode="individual",this._clearMode=!1;for(const t of e.segments){const e="string"==typeof t.segment?parseInt(t.segment,10):t.segment,i=t.color;"x"in i&&"y"in i?this._segments.set(e-1,{x:i.x,y:i.y}):"r"in i&&"g"in i&&"b"in i&&this._segments.set(e-1,Ae(i.r,i.g,i.b))}}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleDeviceTypeChange(e){this._deviceType=e.detail.value||"t1m";const t=this._getMaxSegments(),i=new Map;for(const[e,s]of this._segments)e<t&&i.set(e,s);this._segments=i,this._selectedSegments=new Set}_handlePatternModeChange(e){this._patternMode=e,this._clearMode=!1,this._selectMode=!1}_toggleClearMode(){this._clearMode=!this._clearMode,this._clearMode&&(this._selectMode=!1)}_toggleSelectMode(){this._selectMode=!this._selectMode,this._selectMode&&(this._clearMode=!1)}_handleSegmentClick(e,t){if(this._clearMode){const t=new Map(this._segments);return t.delete(e),void(this._segments=t)}if(this._selectMode||t.shiftKey){const t=new Set(this._selectedSegments);t.has(e)?t.delete(e):t.add(e),this._selectedSegments=t}else if(t.ctrlKey||t.metaKey)this._selectedSegments=new Set([...this._selectedSegments,e]);else{const t=this._colorPalette[this._selectedPaletteIndex],i=new Map(this._segments);i.set(e,{...t}),this._segments=i}}_selectPaletteColor(e){this._selectedPaletteIndex=e}_addGradientColor(){this._gradientColors.length>=6||(this._gradientColors=[...this._gradientColors,{x:.42,y:.51}])}_removeGradientColor(e){this._gradientColors.length<=2||(this._gradientColors=this._gradientColors.filter((t,i)=>i!==e))}_addBlockColor(){this._blockColors.length>=6||(this._blockColors=[...this._blockColors,{x:.22,y:.33}])}_removeBlockColor(e){this._blockColors.length<=1||(this._blockColors=this._blockColors.filter((t,i)=>i!==e))}_handleExpandBlocksChange(e){const t=e.target;this._expandBlocks=t.checked}_applyToSelected(){if(0===this._selectedSegments.size)return;const e=this._colorPalette[this._selectedPaletteIndex],t=new Map(this._segments);for(const i of this._selectedSegments)t.set(i,{...e});this._segments=t,this._selectedSegments=new Set}_clearSelected(){if(0===this._selectedSegments.size)return;const e=new Map(this._segments);for(const t of this._selectedSegments)e.delete(t);this._segments=e,this._selectedSegments=new Set}_selectAll(){const e=this._getMaxSegments(),t=new Set;for(let i=0;i<e;i++)t.add(i);this._selectedSegments=t}_clearAll(){this._segments=new Map,this._selectedSegments=new Set}_interpolateHue(e,t,i){let s=t-e;s>180?s-=360:s<-180&&(s+=360);let o=e+s*i;return o<0&&(o+=360),o>=360&&(o-=360),o}_generateGradientPattern(){const e=this._getMaxSegments(),t=this._gradientColors,i=t.length,s=new Map;if(i<2||0===e)return s;const o=t.map(e=>De(e));for(let t=0;t<e;t++){const a=t/(e-1)*(i-1),r=Math.floor(a),n=a-r,l=o[Math.min(r,i-1)],c=o[Math.min(r+1,i-1)],d={h:Math.round(this._interpolateHue(l.h,c.h,n)),s:Math.round(l.s+(c.s-l.s)*n)};s.set(t,Ie(d))}return s}_generateBlocksPattern(){const e=this._getMaxSegments(),t=this._blockColors,i=t.length,s=new Map;if(0===i||0===e)return s;if(this._expandBlocks){const o=e/i;for(let a=0;a<e;a++){const e=Math.min(Math.floor(a/o),i-1);s.set(a,{...t[e]})}}else for(let o=0;o<e;o++){const e=o%i;s.set(o,{...t[e]})}return s}_applyToGrid(){let e;if("gradient"===this._patternMode)e=this._generateGradientPattern();else{if("blocks"!==this._patternMode)return;e=this._generateBlocksPattern()}this._segments=e}_applyToSelectedSegments(){if(0===this._selectedSegments.size)return;const e=Array.from(this._selectedSegments).sort((e,t)=>e-t),t=e.length;let i=[];if("gradient"===this._patternMode)i=this._gradientColors;else{if("blocks"!==this._patternMode)return;i=this._blockColors}const s=i.length,o=new Map(this._segments);if("gradient"===this._patternMode){const a=i.map(e=>De(e));for(let i=0;i<t;i++){const r=e[i],n=(t>1?i/(t-1):0)*(s-1),l=Math.floor(n),c=n-l,d=a[Math.min(l,s-1)],h=a[Math.min(l+1,s-1)],p={h:Math.round(this._interpolateHue(d.h,h.h,c)),s:Math.round(d.s+(h.s-d.s)*c)};o.set(r,Ie(p))}}else if("blocks"===this._patternMode)if(this._expandBlocks){const a=Math.ceil(t/s);for(let r=0;r<t;r++){const t=e[r],n=Math.min(Math.floor(r/a),s-1);o.set(t,{...i[n]})}}else for(let a=0;a<t;a++){const t=e[a],r=a%s;o.set(t,{...i[r]})}this._segments=o,this._selectedSegments=new Set}_openPaletteColorPicker(e){const t=this._colorPalette[e];t&&(this._editingColorSource="palette",this._editingColorIndex=e,this._editingColor=De(t))}_openGradientColorPicker(e){const t=this._gradientColors[e];t&&(this._editingColorSource="gradient",this._editingColorIndex=e,this._editingColor=De(t))}_openBlockColorPicker(e){const t=this._blockColors[e];t&&(this._editingColorSource="blocks",this._editingColorIndex=e,this._editingColor=De(t))}_handleColorPickerChange(e){this._editingColor=e.detail.color}_confirmColorPicker(){if(null===this._editingColorIndex||null===this._editingColor||!this._editingColorSource)return void this._closeColorPicker();const e=Ie(this._editingColor);"palette"===this._editingColorSource?this._colorPalette=this._colorPalette.map((t,i)=>i===this._editingColorIndex?e:t):"gradient"===this._editingColorSource?this._gradientColors=this._gradientColors.map((t,i)=>i===this._editingColorIndex?e:t):"blocks"===this._editingColorSource&&(this._blockColors=this._blockColors.map((t,i)=>i===this._editingColorIndex?e:t)),this._closeColorPicker()}_closeColorPicker(){this._editingColorSource=null,this._editingColorIndex=null,this._editingColor=null}_getCurrentPattern(){return this._segments}_colorToHex(e){return Me(e,255)}_getPresetData(){const e=this._getCurrentPattern(),t=[];for(const[i,s]of e){const e=ze(s.x,s.y,255);t.push({segment:i+1,color:{r:e.r,g:e.g,b:e.b}})}return{name:this._name,icon:this._icon||void 0,device_type:this._deviceType,segments:t}}async _preview(){if(!this.hass||this._previewing)return;if(0!==this._getCurrentPattern().size){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}async _save(){if(!this._name.trim())return;if(0!==this._getCurrentPattern().size){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_canPreview(){return this._getCurrentPattern().size>0}_canSave(){if(!this._name.trim())return!1;return this._getCurrentPattern().size>0}_renderSegmentGrid(){const e=this._getMaxSegments(),t=[];for(let i=0;i<e;i++){const e=this._segments.get(i),s=this._selectedSegments.has(i),o=void 0!==e,a=this._clearMode&&o?"component.aqara_advanced_lighting.panel.tooltips.segment_clear":"component.aqara_advanced_lighting.panel.tooltips.segment_number",r=this.hass.localize(a).replace("{number}",(i+1).toString());t.push(R`
        <div
          class="segment-cell ${s?"selected":""} ${o?"colored":""}"
          style="${o?`background-color: ${this._colorToHex(e)}`:""}"
          @click=${e=>this._handleSegmentClick(i,e)}
          title="${r}"
        >
          ${i+1}
        </div>
      `)}return R`
      <div class="segment-grid-container">
        <div class="segment-grid ${this._clearMode?"clear-mode":""} ${this._selectMode?"select-mode":""}">
          ${t}
        </div>
        <div class="grid-controls">
          <ha-button
            class="${this._selectMode?"select-mode-toggle active":"select-mode-toggle"}"
            @click=${this._toggleSelectMode}
            title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.mode_select")}"
          >
            <ha-icon icon="${this._selectMode?"mdi:selection-multiple":"mdi:selection"}"></ha-icon>
            ${this._selectMode?this._localize("editors.select_mode_on"):this._localize("editors.select_mode_off")}
          </ha-button>
          <ha-button
            class="${this._clearMode?"clear-mode-toggle active":"clear-mode-toggle"}"
            @click=${this._toggleClearMode}
            title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.mode_clear")}"
          >
            <ha-icon icon="${this._clearMode?"mdi:eraser":"mdi:eraser-variant"}"></ha-icon>
            ${this._clearMode?this._localize("editors.clear_mode_on"):this._localize("editors.clear_mode_off")}
          </ha-button>
          <ha-button @click=${this._selectAll}>${this._localize("editors.select_all_button")}</ha-button>
          <ha-button
            @click=${this._clearSelected}
            .disabled=${0===this._selectedSegments.size}
          >
            ${this._localize("editors.clear_selected_button")}
          </ha-button>
          <ha-button @click=${this._clearAll}>${this._localize("editors.clear_all_button")}</ha-button>
        </div>
        <div class="grid-info">
          ${this._localize("editors.segments_selected",{count:this._selectedSegments.size.toString()})}
        </div>
      </div>
    `}_renderIndividualMode(){return R`
      <div class="mode-description">
        Click a color to select it, click the pencil to change it. Then click segments to apply.
      </div>
      <div class="color-palette">
        <span class="palette-label">Colors:</span>
        ${this._colorPalette.map((e,t)=>R`
          <div class="palette-color-wrapper">
            <div
              class="palette-color ${this._selectedPaletteIndex===t?"selected":""}"
              style="background-color: ${this._colorToHex(e)}"
              @click=${()=>this._selectPaletteColor(t)}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_select").replace("{index}",(t+1).toString())}"
            ></div>
            <button
              class="palette-edit-btn"
              @click=${()=>this._openPaletteColorPicker(t)}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_edit_index").replace("{index}",(t+1).toString())}"
            >
              <ha-icon icon="mdi:pencil"></ha-icon>
            </button>
          </div>
        `)}
        <ha-button
          @click=${this._applyToSelected}
          .disabled=${0===this._selectedSegments.size}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          ${this._localize("editors.apply_to_selected_button")}
        </ha-button>
      </div>
    `}_renderGradientMode(){return R`
      <div class="mode-description">
        Create a smooth color gradient across all segments. Add 2-6 colors to blend.
      </div>
      <div class="color-array">
        ${this._gradientColors.map((e,t)=>R`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${this._colorToHex(e)}"
              @click=${()=>this._openGradientColorPicker(t)}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_edit")}"
            ></div>
            ${this._gradientColors.length>2?R`
                  <ha-icon-button
                    class="color-remove"
                    @click=${()=>this._removeGradientColor(t)}
                  >
                    <ha-icon icon="mdi:close"></ha-icon>
                  </ha-icon-button>
                `:""}
          </div>
        `)}
        ${this._gradientColors.length<6?R`
              <div
                class="add-color-btn"
                @click=${this._addGradientColor}
                title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_add")}"
              >
                <ha-icon icon="mdi:plus"></ha-icon>
              </div>
            `:""}
      </div>
      <div class="generated-actions">
        <ha-button @click=${this._applyToGrid}>
          <ha-icon icon="mdi:grid"></ha-icon>
          Apply to Grid
        </ha-button>
        <ha-button
          @click=${this._applyToSelectedSegments}
          .disabled=${0===this._selectedSegments.size}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          Apply to Selected
        </ha-button>
      </div>
    `}_renderBlocksMode(){return R`
      <div class="mode-description">
        Create evenly spaced blocks of color across all segments. Add 1-6 colors.
      </div>
      <div class="color-array">
        ${this._blockColors.map((e,t)=>R`
          <div class="color-item">
            <div
              class="color-swatch"
              style="background-color: ${this._colorToHex(e)}"
              @click=${()=>this._openBlockColorPicker(t)}
              title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_edit")}"
            ></div>
            ${this._blockColors.length>1?R`
                  <ha-icon-button
                    class="color-remove"
                    @click=${()=>this._removeBlockColor(t)}
                  >
                    <ha-icon icon="mdi:close"></ha-icon>
                  </ha-icon-button>
                `:""}
          </div>
        `)}
        ${this._blockColors.length<6?R`
              <div
                class="add-color-btn"
                @click=${this._addBlockColor}
                title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_add")}"
              >
                <ha-icon icon="mdi:plus"></ha-icon>
              </div>
            `:""}
      </div>
      <div class="options-row">
        <label class="option-item">
          <input
            type="checkbox"
            .checked=${this._expandBlocks}
            @change=${this._handleExpandBlocksChange}
          />
          <span class="option-label">Expand blocks to fill segments evenly</span>
        </label>
      </div>
      <div class="generated-actions">
        <ha-button @click=${this._applyToGrid}>
          <ha-icon icon="mdi:grid"></ha-icon>
          Apply to Grid
        </ha-button>
        <ha-button
          @click=${this._applyToSelectedSegments}
          .disabled=${0===this._selectedSegments.size}
        >
          <ha-icon icon="mdi:selection"></ha-icon>
          Apply to Selected
        </ha-button>
      </div>
    `}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){const e=Object.entries(Re).map(([e,t])=>({value:e,label:"t1_strip"===e?`T1 Strip (${this.stripSegmentCount} segments)`:t}));return R`
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
          ${this._renderSegmentGrid()}
        </div>

        <div class="form-section">
          <span class="form-label">${this._localize("editors.pattern_mode_label")}</span>
          <div class="mode-content">
              <div class="mode-tabs">
                <button
                  class="mode-tab ${"individual"===this._patternMode?"active":""}"
                  @click=${()=>this._handlePatternModeChange("individual")}
                >
                  Individual
                </button>
                <button
                  class="mode-tab ${"gradient"===this._patternMode?"active":""}"
                  @click=${()=>this._handlePatternModeChange("gradient")}
                >
                  Gradient
                </button>
                <button
                  class="mode-tab ${"blocks"===this._patternMode?"active":""}"
                  @click=${()=>this._handlePatternModeChange("blocks")}
                >
                  Blocks
                </button>
              </div>

              ${"individual"===this._patternMode?this._renderIndividualMode():"gradient"===this._patternMode?this._renderGradientMode():this._renderBlocksMode()}
            </div>
        </div>

        ${this.hasSelectedEntities?"":R`
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

        ${null!==this._editingColorSource&&null!==this._editingColor?R`
              <div class="color-picker-modal-overlay" @click=${this._closeColorPicker}>
                <div class="color-picker-modal" @click=${e=>e.stopPropagation()}>
                  <div class="color-picker-modal-header">
                    <span class="color-picker-modal-title">Select color</span>
                    <div
                      class="color-picker-modal-preview"
                      style="background-color: ${this._editingColor?`hsl(${this._editingColor.h}, ${this._editingColor.s}%, 50%)`:"#fff"}"
                    ></div>
                  </div>
                  <hs-color-picker
                    .color=${this._editingColor}
                    .size=${220}
                    @color-changed=${this._handleColorPickerChange}
                  ></hs-color-picker>
                  <div class="color-picker-modal-actions">
                    <ha-button @click=${this._closeColorPicker}>${this._localize("editors.cancel_button")}</ha-button>
                    <ha-button @click=${this._confirmColorPicker}>
                      <ha-icon icon="mdi:check"></ha-icon>
                      Apply
                    </ha-button>
                  </div>
                </div>
              </div>
            `:""}
      </div>
    `}};Ge.styles=[Ee,r`
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
  `],e([pe({attribute:!1})],Ge.prototype,"hass",void 0),e([pe({type:Object})],Ge.prototype,"preset",void 0),e([pe({type:Object})],Ge.prototype,"translations",void 0),e([pe({type:Boolean})],Ge.prototype,"editMode",void 0),e([pe({type:Boolean})],Ge.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],Ge.prototype,"isCompatible",void 0),e([pe({type:Number})],Ge.prototype,"stripSegmentCount",void 0),e([_e()],Ge.prototype,"_name",void 0),e([_e()],Ge.prototype,"_icon",void 0),e([_e()],Ge.prototype,"_deviceType",void 0),e([_e()],Ge.prototype,"_segments",void 0),e([_e()],Ge.prototype,"_selectedSegments",void 0),e([_e()],Ge.prototype,"_saving",void 0),e([_e()],Ge.prototype,"_previewing",void 0),e([_e()],Ge.prototype,"_clearMode",void 0),e([_e()],Ge.prototype,"_selectMode",void 0),e([_e()],Ge.prototype,"_patternMode",void 0),e([_e()],Ge.prototype,"_colorPalette",void 0),e([_e()],Ge.prototype,"_selectedPaletteIndex",void 0),e([_e()],Ge.prototype,"_gradientColors",void 0),e([_e()],Ge.prototype,"_blockColors",void 0),e([_e()],Ge.prototype,"_expandBlocks",void 0),e([_e()],Ge.prototype,"_editingColorSource",void 0),e([_e()],Ge.prototype,"_editingColorIndex",void 0),e([_e()],Ge.prototype,"_editingColor",void 0),Ge=e([ce("pattern-editor")],Ge);let Ve=class extends ne{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.selectedEntities=[],this.previewActive=!1,this._name="",this._icon="",this._steps=[],this._loopMode="once",this._loopCount=3,this._endBehavior="maintain",this._saving=!1,this._previewing=!1}get _loopModeOptions(){return[{value:"once",label:this._localize("options.loop_mode_once")},{value:"loop",label:this._localize("options.loop_mode_count")},{value:"continuous",label:this._localize("options.loop_mode_continuous")}]}get _endBehaviorOptions(){return[{value:"maintain",label:this._localize("options.end_behavior_maintain")},{value:"turn_off",label:this._localize("options.end_behavior_turn_off")}]}connectedCallback(){super.connectedCallback(),0!==this._steps.length||this.preset||this._addDefaultStep()}updated(e){super.updated(e),e.has("preset")&&this.preset&&this._loadPreset(this.preset)}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._loopMode=e.loop_mode,this._loopCount=e.loop_count||3,this._endBehavior=e.end_behavior,this._steps=e.steps.map((e,t)=>({...e,id:`step-${t}-${Date.now()}`}))}_addDefaultStep(){this._steps=[{id:`step-0-${Date.now()}`,color_temp:4e3,brightness:50,transition:15,hold:60}]}_generateStepId(){return`step-${this._steps.length}-${Date.now()}`}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleLoopModeChange(e){this._loopMode=e.detail.value||"once"}_handleLoopCountChange(e){this._loopCount=e.detail.value||3}_handleEndBehaviorChange(e){this._endBehavior=e.detail.value||"maintain"}_hasIncompatibleEndpoints(){if(!this.hass||!this.selectedEntities.length)return!1;for(const e of this.selectedEntities){const t=this.hass.states[e];if(!t)continue;const i=t.attributes.supported_color_modes;if(!i||!i.includes("color_temp"))return!0}return!1}_handleStepFieldChange(e,t,i){this._steps=this._steps.map(s=>s.id===e?{...s,[t]:i.detail.value}:s)}_handleStepColorTempChange(e,t){const i=t.detail.value,s=100*Math.round(1e6/i/100);this._steps=this._steps.map(t=>t.id===e?{...t,color_temp:s}:t)}_addStep(){if(this._steps.length>=20)return;const e={id:this._generateStepId(),color_temp:4e3,brightness:50,transition:15,hold:60};this._steps=[...this._steps,e]}_removeStep(e){this._steps.length<=1||(this._steps=this._steps.filter(t=>t.id!==e))}_moveStepUp(e){if(e<=0)return;const t=[...this._steps],i=t[e-1];t[e-1]=t[e],t[e]=i,this._steps=t}_moveStepDown(e){if(e>=this._steps.length-1)return;const t=[...this._steps],i=t[e];t[e]=t[e+1],t[e+1]=i,this._steps=t}_duplicateStep(e){if(this._steps.length>=20)return;const t={...e,id:this._generateStepId()},i=this._steps.findIndex(t=>t.id===e.id),s=[...this._steps];s.splice(i+1,0,t),this._steps=s}_getPresetData(){const e=this._steps.map(({id:e,...t})=>t),t={name:this._name,icon:this._icon||void 0,steps:e,loop_mode:this._loopMode,end_behavior:this._endBehavior};return"loop"===this._loopMode&&(t.loop_count=this._loopCount),t}async _preview(){if(this.hass&&!this._previewing){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&0!==this._steps.length){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_renderStep(e,t){return R`
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
              .selector=${{number:{min:0,max:60,step:.5,mode:"box",unit_of_measurement:"s"}}}
              .value=${e.transition}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"transition",t)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.hold_time_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:300,step:1,mode:"box",unit_of_measurement:"s"}}}
              .value=${e.hold}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"hold",t)}
            ></ha-selector>
          </div>
        </div>
      </div>
    `}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){return R`
      <div class="editor-content">
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

        ${"loop"===this._loopMode?R`
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
            ${0===this._steps.length?R`
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

        ${this._hasIncompatibleEndpoints()?R`
              <div class="error-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>One or more selected lights do not support color temperature control. CCT sequences require lights with color_temp capability. For T1M devices, select the white/CCT endpoint instead of the RGB ring endpoint.</span>
              </div>
            `:""}

        ${this.hasSelectedEntities?"":R`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_sequences")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?R`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  Stop
                </ha-button>
              `:R`
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
    `}};Ve.styles=r`
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
  `,e([pe({attribute:!1})],Ve.prototype,"hass",void 0),e([pe({type:Object})],Ve.prototype,"preset",void 0),e([pe({type:Object})],Ve.prototype,"translations",void 0),e([pe({type:Boolean})],Ve.prototype,"editMode",void 0),e([pe({type:Boolean})],Ve.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],Ve.prototype,"isCompatible",void 0),e([pe({type:Array})],Ve.prototype,"selectedEntities",void 0),e([pe({type:Boolean})],Ve.prototype,"previewActive",void 0),e([_e()],Ve.prototype,"_name",void 0),e([_e()],Ve.prototype,"_icon",void 0),e([_e()],Ve.prototype,"_steps",void 0),e([_e()],Ve.prototype,"_loopMode",void 0),e([_e()],Ve.prototype,"_loopCount",void 0),e([_e()],Ve.prototype,"_endBehavior",void 0),e([_e()],Ve.prototype,"_saving",void 0),e([_e()],Ve.prototype,"_previewing",void 0),Ve=e([ce("cct-sequence-editor")],Ve);const We={t1:"T1 (20 segments)",t1m:"T1M (26 segments)",t1_strip:"T1 Strip (up to 50 segments)"};let Ye=class extends ne{constructor(){super(...arguments),this.translations={},this.editMode=!1,this.hasSelectedEntities=!1,this.isCompatible=!0,this.previewActive=!1,this._name="",this._icon="",this._deviceType="t1m",this._steps=[],this._loopMode="once",this._loopCount=3,this._endBehavior="maintain",this._clearSegments=!1,this._skipFirstInLoop=!1,this._saving=!1,this._previewing=!1,this._editingStepId=null,this._editingColorIndex=null,this._editingColor=null}get _loopModeOptions(){return[{value:"once",label:this._localize("options.loop_mode_once")},{value:"count",label:this._localize("options.loop_mode_count")},{value:"continuous",label:this._localize("options.loop_mode_continuous")}]}get _endBehaviorOptions(){return[{value:"maintain",label:this._localize("options.end_behavior_maintain")},{value:"turn_off",label:this._localize("options.end_behavior_turn_off")}]}get _stepModeOptions(){return[{value:"blocks_repeat",label:this._localize("options.pattern_mode_blocks_repeat")},{value:"blocks_expand",label:this._localize("options.pattern_mode_blocks_expand")},{value:"gradient",label:this._localize("options.pattern_mode_gradient")}]}get _activationPatternOptions(){return[{value:"all",label:this._localize("options.activation_all")},{value:"sequential_forward",label:this._localize("options.activation_sequential_forward")},{value:"sequential_reverse",label:this._localize("options.activation_sequential_reverse")},{value:"random",label:this._localize("options.activation_random")},{value:"ping_pong",label:this._localize("options.activation_ping_pong")},{value:"center_out",label:this._localize("options.activation_center_out")},{value:"edges_in",label:this._localize("options.activation_edges_in")},{value:"paired",label:this._localize("options.activation_paired")}]}connectedCallback(){super.connectedCallback(),0!==this._steps.length||this.preset||this._addDefaultStep()}updated(e){super.updated(e),e.has("preset")&&this.preset&&this._loadPreset(this.preset)}_loadPreset(e){this._name=e.name,this._icon=e.icon||"",this._deviceType=e.device_type||"t1m",this._loopMode=e.loop_mode,this._loopCount=e.loop_count||3,this._endBehavior=e.end_behavior,this._clearSegments=e.clear_segments||!1,this._skipFirstInLoop=e.skip_first_in_loop||!1,this._steps=e.steps.map((e,t)=>({...e,id:`step-${t}-${Date.now()}`,colorsArray:e.colors.map(e=>{const t={r:e[0]??0,g:e[1]??0,b:e[2]??0};return Ae(t.r,t.g,t.b)})}))}_addDefaultStep(){this._steps=[{id:`step-0-${Date.now()}`,segments:"1-5",colors:[[255,0,0]],colorsArray:[{x:.68,y:.31}],mode:"blocks_expand",duration:15,hold:60,activation_pattern:"all"}]}_generateStepId(){return`step-${this._steps.length}-${Date.now()}`}_handleNameChange(e){this._name=e.detail.value||""}_handleIconChange(e){this._icon=e.detail.value||""}_handleDeviceTypeChange(e){this._deviceType=e.detail.value||"t1m"}_handleLoopModeChange(e){this._loopMode=e.detail.value||"once"}_handleLoopCountChange(e){this._loopCount=e.detail.value||3}_handleEndBehaviorChange(e){this._endBehavior=e.detail.value||"maintain"}_handleClearSegmentsChange(e){this._clearSegments=e.target.checked}_handleSkipFirstInLoopChange(e){this._skipFirstInLoop=e.target.checked}_hasInvalidGradientSteps(){return this._steps.some(e=>"gradient"===e.mode&&e.colorsArray.length<2)}_handleStepFieldChange(e,t,i){this._steps=this._steps.map(s=>s.id===e?{...s,[t]:i.detail.value}:s)}_openStepColorPicker(e,t){const i=this._steps.find(t=>t.id===e);if(!i)return;const s=i.colorsArray[t];s&&(this._editingStepId=e,this._editingColorIndex=t,this._editingColor=De(s))}_handleColorPickerChange(e){this._editingColor=e.detail.color}_confirmColorPicker(){if(null===this._editingStepId||null===this._editingColorIndex||null===this._editingColor)return void this._closeColorPicker();const e=Ie(this._editingColor),t=this._editingStepId,i=this._editingColorIndex;this._steps=this._steps.map(s=>{if(s.id!==t)return s;const o=s.colorsArray.map((t,s)=>s===i?e:t),a=o.map(e=>{const t=ze(e.x,e.y,255);return[t.r,t.g,t.b]});return{...s,colorsArray:o,colors:a}}),this._closeColorPicker()}_closeColorPicker(){this._editingStepId=null,this._editingColorIndex=null,this._editingColor=null}_addStepColor(e){this._steps=this._steps.map(t=>{if(t.id!==e||t.colorsArray.length>=8)return t;const i=[...t.colorsArray,{x:.3127,y:.329}],s=i.map(e=>{const t=ze(e.x,e.y,255);return[t.r,t.g,t.b]});return{...t,colorsArray:i,colors:s}})}_removeStepColor(e,t){this._steps=this._steps.map(i=>{if(i.id!==e||i.colorsArray.length<=1)return i;const s=i.colorsArray.filter((e,i)=>i!==t),o=s.map(e=>{const t=ze(e.x,e.y,255);return[t.r,t.g,t.b]});return{...i,colorsArray:s,colors:o}})}_addStep(){if(this._steps.length>=20)return;const e={id:this._generateStepId(),segments:"1-5",colors:[[255,0,0]],colorsArray:[{x:.68,y:.31}],mode:"blocks_expand",duration:15,hold:60,activation_pattern:"all"};this._steps=[...this._steps,e]}_removeStep(e){this._steps.length<=1||(this._steps=this._steps.filter(t=>t.id!==e))}_moveStepUp(e){if(e<=0)return;const t=[...this._steps],i=t[e-1];t[e-1]=t[e],t[e]=i,this._steps=t}_moveStepDown(e){if(e>=this._steps.length-1)return;const t=[...this._steps],i=t[e];t[e]=t[e+1],t[e+1]=i,this._steps=t}_duplicateStep(e){if(this._steps.length>=20)return;const t={...e,id:this._generateStepId(),colorsArray:e.colorsArray.map(e=>({...e})),colors:e.colors.map(e=>[...e])},i=this._steps.findIndex(t=>t.id===e.id),s=[...this._steps];s.splice(i+1,0,t),this._steps=s}_getPresetData(){const e=this._steps.map(({id:e,colorsArray:t,...i})=>({...i,colors:t.map(e=>{const t=ze(e.x,e.y,255);return[t.r,t.g,t.b]})})),t={name:this._name,icon:this._icon||void 0,device_type:this._deviceType,steps:e,loop_mode:this._loopMode,end_behavior:this._endBehavior,clear_segments:this._clearSegments,skip_first_in_loop:this._skipFirstInLoop};return"count"===this._loopMode&&(t.loop_count=this._loopCount),t}_colorToHex(e){return Me(e,255)}async _preview(){if(this.hass&&!this._previewing){this._previewing=!0;try{this.dispatchEvent(new CustomEvent("preview",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._previewing=!1}}}_stopPreview(){this.dispatchEvent(new CustomEvent("stop-preview",{bubbles:!0,composed:!0}))}async _save(){if(this._name.trim()&&0!==this._steps.length){this._saving=!0;try{this.dispatchEvent(new CustomEvent("save",{detail:this._getPresetData(),bubbles:!0,composed:!0}))}finally{this._saving=!1}}}_cancel(){this.dispatchEvent(new CustomEvent("cancel",{bubbles:!0,composed:!0}))}_renderStep(e,t){return R`
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
            <span class="step-field-label">${this._localize("editors.segments_input_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{text:{}}}
              .value=${e.segments}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"segments",t)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.mode_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{select:{options:this._stepModeOptions,mode:"dropdown"}}}
              .value=${e.mode}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"mode",t)}
            ></ha-selector>
          </div>
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
              .selector=${{number:{min:0,max:60,step:.5,mode:"box",unit_of_measurement:"s"}}}
              .value=${e.duration}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"duration",t)}
            ></ha-selector>
          </div>
          <div class="step-field">
            <span class="step-field-label">${this._localize("editors.hold_time_label")}</span>
            <ha-selector
              .hass=${this.hass}
              .selector=${{number:{min:0,max:300,step:1,mode:"box",unit_of_measurement:"s"}}}
              .value=${e.hold}
              @value-changed=${t=>this._handleStepFieldChange(e.id,"hold",t)}
            ></ha-selector>
          </div>
          <div class="step-field full-width">
            <span class="step-field-label">${this._localize("editors.colors_label")}</span>
            <div class="color-picker-grid">
              ${e.colorsArray.map((t,i)=>R`
                  <div class="color-item">
                    <div
                      class="color-swatch"
                      style="background-color: ${this._colorToHex(t)}"
                      @click=${()=>this._openStepColorPicker(e.id,i)}
                      title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_edit")}"
                    ></div>
                    ${e.colorsArray.length>1?R`
                          <ha-icon-button
                            class="color-remove"
                            @click=${()=>this._removeStepColor(e.id,i)}
                            title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_remove")}"
                          >
                            <ha-icon icon="mdi:close"></ha-icon>
                          </ha-icon-button>
                        `:""}
                  </div>
                `)}
              ${e.colorsArray.length<8?R`
                    <div
                      class="add-color-btn"
                      @click=${()=>this._addStepColor(e.id)}
                      title="${this.hass.localize("component.aqara_advanced_lighting.panel.tooltips.color_add")}"
                    >
                      <ha-icon icon="mdi:plus"></ha-icon>
                    </div>
                  `:""}
            </div>
          </div>
        </div>
      </div>
    `}_localize(e,t){const i=e.split(".");let s=this.translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}let o="string"==typeof s?s:e;return t&&Object.entries(t).forEach(([e,t])=>{o=o.replace(`{${e}}`,t)}),o}render(){const e=Object.entries(We).map(([e,t])=>({value:e,label:t}));return R`
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

        ${"count"===this._loopMode?R`
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
            ${0===this._steps.length?R`
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

        ${this._hasInvalidGradientSteps()?R`
              <div class="error-warning">
                <ha-icon icon="mdi:alert-circle"></ha-icon>
                <span>Gradient mode requires at least 2 colors. Please add more colors to steps using gradient mode or change the mode.</span>
              </div>
            `:""}

        ${this.hasSelectedEntities?"":R`
              <div class="preview-warning">
                <ha-icon icon="mdi:information"></ha-icon>
                <span>${this._localize("editors.select_lights_for_preview_sequences")}</span>
              </div>
            `}

        <div class="form-actions">
          <ha-button @click=${this._cancel}>${this._localize("editors.cancel_button")}</ha-button>
          ${this.previewActive?R`
                <ha-button @click=${this._stopPreview}>
                  <ha-icon icon="mdi:stop"></ha-icon>
                  Stop
                </ha-button>
              `:R`
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

        ${null!==this._editingStepId&&null!==this._editingColor?R`
              <div class="color-picker-modal-overlay" @click=${this._closeColorPicker}>
                <div class="color-picker-modal" @click=${e=>e.stopPropagation()}>
                  <div class="color-picker-modal-header">
                    <span class="color-picker-modal-title">Select color</span>
                    <div
                      class="color-picker-modal-preview"
                      style="background-color: ${this._editingColor?`hsl(${this._editingColor.h}, ${this._editingColor.s}%, 50%)`:"#fff"}"
                    ></div>
                  </div>
                  <hs-color-picker
                    .color=${this._editingColor}
                    .size=${220}
                    @color-changed=${this._handleColorPickerChange}
                  ></hs-color-picker>
                  <div class="color-picker-modal-actions">
                    <ha-button @click=${this._closeColorPicker}>${this._localize("editors.cancel_button")}</ha-button>
                    <ha-button @click=${this._confirmColorPicker}>
                      <ha-icon icon="mdi:check"></ha-icon>
                      Apply
                    </ha-button>
                  </div>
                </div>
              </div>
            `:""}
      </div>
    `}};Ye.styles=[Ee,r`
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
  `],e([pe({attribute:!1})],Ye.prototype,"hass",void 0),e([pe({type:Object})],Ye.prototype,"preset",void 0),e([pe({type:Object})],Ye.prototype,"translations",void 0),e([pe({type:Boolean})],Ye.prototype,"editMode",void 0),e([pe({type:Boolean})],Ye.prototype,"hasSelectedEntities",void 0),e([pe({type:Boolean})],Ye.prototype,"isCompatible",void 0),e([pe({type:Boolean})],Ye.prototype,"previewActive",void 0),e([_e()],Ye.prototype,"_name",void 0),e([_e()],Ye.prototype,"_icon",void 0),e([_e()],Ye.prototype,"_deviceType",void 0),e([_e()],Ye.prototype,"_steps",void 0),e([_e()],Ye.prototype,"_loopMode",void 0),e([_e()],Ye.prototype,"_loopCount",void 0),e([_e()],Ye.prototype,"_endBehavior",void 0),e([_e()],Ye.prototype,"_clearSegments",void 0),e([_e()],Ye.prototype,"_skipFirstInLoop",void 0),e([_e()],Ye.prototype,"_saving",void 0),e([_e()],Ye.prototype,"_previewing",void 0),e([_e()],Ye.prototype,"_editingStepId",void 0),e([_e()],Ye.prototype,"_editingColorIndex",void 0),e([_e()],Ye.prototype,"_editingColor",void 0),Ye=e([ce("segment-sequence-editor")],Ye);let Ke=class extends ne{constructor(){super(...arguments),this.curvature=1,this.width=320,this.height=320,this._isDragging=!1,this.MIN_CURVATURE=.2,this.MAX_CURVATURE=6,this.STEP=.01,this._handleCanvasPointerMove=e=>{this._isDragging&&(e.preventDefault(),this._handleCanvasInteraction(e))},this._handleCanvasPointerUp=()=>{this._isDragging=!1,window.removeEventListener("mousemove",this._handleCanvasPointerMove),window.removeEventListener("mouseup",this._handleCanvasPointerUp),window.removeEventListener("touchmove",this._handleCanvasPointerMove),window.removeEventListener("touchend",this._handleCanvasPointerUp)}}firstUpdated(){this._drawCurve()}updated(e){e.has("curvature")&&this._canvas&&this._drawCurve()}_getControlPoint(){const e=this.curvature;let t;t=e<=1?(e-this.MIN_CURVATURE)/(1-this.MIN_CURVATURE)*.5:.5+(e-1)/(this.MAX_CURVATURE-1)*.5;return{cx:.05+.9*t,cy:.95-.9*t}}_bezierY(e,t){return 2*(1-e)*e*t+e*e}_bezierX(e,t){return 2*(1-e)*e*t+e*e}_drawCurve(){const e=this._canvas;if(!e)return;const t=e.getContext("2d");if(!t)return;const{width:i,height:s}=this,o=40,a=i-80,r=s-80;e.width=i,e.height=s,t.clearRect(0,0,i,s),this._drawGrid(t,o,a,r);const{cx:n,cy:l}=this._getControlPoint();t.beginPath(),t.moveTo(o,s-o);const c=100;for(let e=0;e<=c;e++){const i=e/c,d=o+this._bezierX(i,n)*a,h=s-o-this._bezierY(i,l)*r;t.lineTo(d,h)}t.lineTo(o+a,s-o),t.closePath();const d=t.createLinearGradient(0,o,0,s-o);d.addColorStop(0,"rgba(3, 169, 244, 0.15)"),d.addColorStop(1,"rgba(3, 169, 244, 0.02)"),t.fillStyle=d,t.fill(),t.beginPath();for(let e=0;e<=c;e++){const i=e/c,d=o+this._bezierX(i,n)*a,h=s-o-this._bezierY(i,l)*r;0===e?t.moveTo(d,h):t.lineTo(d,h)}const h=getComputedStyle(this).getPropertyValue("--primary-color").trim()||"#03a9f4";t.strokeStyle=h,t.lineWidth=3,t.lineCap="round",t.lineJoin="round",t.stroke();const p=s-o-r;t.beginPath(),t.arc(o+a,p,6,0,2*Math.PI),t.fillStyle=h,t.fill(),t.strokeStyle="white",t.lineWidth=2,t.stroke()}_drawGrid(e,t,i,s){const o=getComputedStyle(this).getPropertyValue("--divider-color").trim()||"#e0e0e0";e.strokeStyle=o,e.lineWidth=1,e.setLineDash([4,4]);for(let o=0;o<=3;o++){const a=t+i/3*o;e.beginPath(),e.moveTo(a,t),e.lineTo(a,t+s),e.stroke()}for(let o=0;o<=3;o++){const a=t+s/3*o;e.beginPath(),e.moveTo(t,a),e.lineTo(t+i,a),e.stroke()}e.setLineDash([])}_handleCanvasPointerDown(e){e.preventDefault(),this._isDragging=!0,this._handleCanvasInteraction(e),e instanceof MouseEvent?(window.addEventListener("mousemove",this._handleCanvasPointerMove),window.addEventListener("mouseup",this._handleCanvasPointerUp)):(window.addEventListener("touchmove",this._handleCanvasPointerMove,{passive:!1}),window.addEventListener("touchend",this._handleCanvasPointerUp))}_handleCanvasInteraction(e){const t=this._canvas;if(!t)return;const i=t.getBoundingClientRect();let s;if(e instanceof TouchEvent){const t=e.touches[0];if(!t)return;s=t.clientY}else s=e.clientY;const o=this.height-80,a=s-i.top-40,r=1-Math.max(0,Math.min(1,a/o));let n;if(r>=.5){n=1-2*(r-.5)*(1-this.MIN_CURVATURE)}else{n=1+2*(.5-r)*(this.MAX_CURVATURE-1)}n=Math.round(n/this.STEP)*this.STEP,n=Math.max(this.MIN_CURVATURE,Math.min(this.MAX_CURVATURE,n));const l=parseFloat(n.toFixed(2));this.dispatchEvent(new CustomEvent("curvature-input",{detail:{curvature:l},bubbles:!0,composed:!0}))}render(){return R`
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
            </div>
            <div class="x-axis-label">
              <ha-icon icon="mdi:clock-outline"></ha-icon>
            </div>
          </div>
        </div>
      </div>
    `}};Ke.styles=r`
    :host {
      display: block;
    }

    .curve-editor-container {
      background: var(--card-background-color);
      overflow: hidden;
    }

    .curve-header {
      padding: 16px 16px 12px;
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
      padding: 16px;
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
  `,e([pe({attribute:!1})],Ke.prototype,"hass",void 0),e([pe({type:Number})],Ke.prototype,"curvature",void 0),e([pe({type:Number})],Ke.prototype,"width",void 0),e([pe({type:Number})],Ke.prototype,"height",void 0),e([_e()],Ke.prototype,"_isDragging",void 0),e([ge("canvas")],Ke.prototype,"_canvas",void 0),Ke=e([ce("transition-curve-editor")],Ke);let Xe=class extends ne{constructor(){super(...arguments),this.narrow=!1,this._loading=!0,this._selectedEntities=[],this._brightness=100,this._useCustomBrightness=!1,this._collapsed={},this._hasIncompatibleLights=!1,this._favorites=[],this._showFavoriteInput=!1,this._favoriteInputName="",this._activeTab="activate",this._effectPreviewActive=!1,this._cctPreviewActive=!1,this._segmentSequencePreviewActive=!1,this._sortPreferences={effects:"name-asc",patterns:"name-asc",cct:"name-asc",segments:"name-asc"},this._frontendVersion="0.6.0",this._localCurvature=1,this._applyingCurvature=!1,this._translations=Ue,this._tileCardRef=new Ce,this._tileCards=new Map}_localize(e,t){const i=e.split(".");let s=this._translations;for(const t of i){if(!s||"object"!=typeof s||!(t in s))return e;s=s[t]}return"string"!=typeof s?e:(t&&Object.keys(t).forEach(e=>{const i=t[e];void 0!==i&&(s=s.replace(`{${e}}`,i))}),s)}firstUpdated(){this._loadPresets(),this._loadFavorites(),this._loadUserPresets(),this._loadSortPreferences(),this._loadBackendVersion()}updated(e){super.updated(e),e.has("hass")&&void 0===e.get("hass")&&(this._loadPresets(),this._loadFavorites(),this._loadUserPresets()),this._updateTileCard()}async _updateTileCard(){const e=this._tileCardRef.value;if(!e||!this.hass)return void(this._tileCards.size>0&&this._tileCards.clear());if(!this._selectedEntities.length)return this._tileCards.forEach(e=>{e.parentElement&&e.remove()}),void this._tileCards.clear();await customElements.whenDefined("hui-tile-card");const t=new Set(this._selectedEntities);for(const[i,s]of this._tileCards.entries())t.has(i)&&s.parentElement===e||(s.parentElement&&s.remove(),this._tileCards.delete(i));for(const t of this._selectedEntities){let i=this._tileCards.get(t);i&&i.parentElement===e||(i=document.createElement("hui-tile-card"),e.appendChild(i),this._tileCards.set(t,i));try{i.setConfig({type:"tile",entity:t,features:[{type:"light-brightness"}]}),i.hass=this.hass}catch(e){console.warn("Failed to configure tile card for",t,":",e)}}}async _loadPresets(){try{const e=await fetch("/api/aqara_advanced_lighting/presets");if(!e.ok)throw new Error(`HTTP error ${e.status}`);this._presets=await e.json(),this._loading=!1}catch(e){this._error=e instanceof Error?e.message:this._localize("errors.loading_presets_generic"),this._loading=!1}}async _loadFavorites(){if(this.hass?.auth?.data?.access_token)try{const e=await fetch("/api/aqara_advanced_lighting/favorites",{credentials:"same-origin",headers:{Authorization:`Bearer ${this.hass.auth.data.access_token}`}});if(!e.ok)return void console.warn("Failed to load favorites:",e.status);const t=await e.json();this._favorites=t.favorites||[]}catch(e){console.warn("Failed to load favorites:",e)}else console.warn("No auth token available, skipping favorites load")}async _loadUserPresets(){if(this.hass?.auth?.data?.access_token)try{const e=await fetch("/api/aqara_advanced_lighting/user_presets",{credentials:"same-origin",headers:{Authorization:`Bearer ${this.hass.auth.data.access_token}`}});if(!e.ok)return void console.warn("Failed to load user presets:",e.status);this._userPresets=await e.json()}catch(e){console.warn("Failed to load user presets:",e)}else console.warn("No auth token available, skipping user presets load")}_loadSortPreferences(){try{const e=localStorage.getItem("aqara_lighting_sort_preferences");if(e){const t=JSON.parse(e);this._sortPreferences={effects:t.effects||"name-asc",patterns:t.patterns||"name-asc",cct:t.cct||"name-asc",segments:t.segments||"name-asc"}}}catch(e){console.warn("Failed to load sort preferences:",e)}}async _loadBackendVersion(){try{const e=await fetch("/api/aqara_advanced_lighting/version");if(!e.ok)return void console.warn("Failed to load backend version:",e.status);const t=await e.json();this._backendVersion=t.version}catch(e){console.warn("Failed to load backend version:",e)}}_saveSortPreferences(){try{localStorage.setItem("aqara_lighting_sort_preferences",JSON.stringify(this._sortPreferences))}catch(e){console.warn("Failed to save sort preferences:",e)}}_setSortPreference(e,t){this._sortPreferences={...this._sortPreferences,[e]:t},this._saveSortPreferences()}_sortUserEffectPresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserPatternPresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserCCTSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortUserSegmentSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name));case"date-new":return i.sort((e,t)=>new Date(t.created_at).getTime()-new Date(e.created_at).getTime());case"date-old":return i.sort((e,t)=>new Date(e.created_at).getTime()-new Date(t.created_at).getTime());default:return i}}_sortDynamicEffectPresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortSegmentPatternPresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortCCTSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}_sortSegmentSequencePresets(e,t){const i=[...e];switch(t){case"name-asc":case"date-new":case"date-old":default:return i.sort((e,t)=>e.name.localeCompare(t.name));case"name-desc":return i.sort((e,t)=>t.name.localeCompare(e.name))}}async _saveUserPreset(e,t){if(this.hass?.auth?.data?.access_token)try{const i=await fetch("/api/aqara_advanced_lighting/user_presets",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.hass.auth.data.access_token}`},body:JSON.stringify({type:e,data:t})});if(!i.ok)throw new Error(`HTTP error ${i.status}`);await this._loadUserPresets()}catch(e){console.error("Failed to save user preset:",e)}else console.error("No auth token available")}async _updateUserPreset(e,t,i){if(this.hass?.auth?.data?.access_token)try{const s=await fetch(`/api/aqara_advanced_lighting/user_presets/${e}/${t}`,{method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.hass.auth.data.access_token}`},body:JSON.stringify(i)});if(!s.ok)throw new Error(`HTTP error ${s.status}`);await this._loadUserPresets()}catch(e){console.error("Failed to update user preset:",e)}else console.error("No auth token available")}async _deleteUserPreset(e,t){if(this.hass?.auth?.data?.access_token)try{const i=await fetch(`/api/aqara_advanced_lighting/user_presets/${e}/${t}`,{method:"DELETE",credentials:"same-origin",headers:{Authorization:`Bearer ${this.hass.auth.data.access_token}`}});if(!i.ok&&204!==i.status)throw new Error(`HTTP error ${i.status}`);await this._loadUserPresets()}catch(e){console.error("Failed to delete user preset:",e)}else console.error("No auth token available")}_setActiveTab(e){this._activeTab=e}_handleTabChange(e){const t=e.detail.name;t&&t!==this._activeTab&&(this._activeTab=t)}_addFavorite(){if(!this._selectedEntities.length)return;const e=this._selectedEntities[0],t=1===this._selectedEntities.length&&e?this._getEntityFriendlyName(e):`${this._selectedEntities.length} lights`;this._favoriteInputName=t,this._showFavoriteInput=!0}async _saveFavorite(){if(this._selectedEntities.length&&this.hass?.auth?.data?.access_token){try{const e=await fetch("/api/aqara_advanced_lighting/favorites",{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.hass.auth.data.access_token}`},body:JSON.stringify({entities:this._selectedEntities,name:this._favoriteInputName||void 0})});if(!e.ok)throw new Error(`HTTP error ${e.status}`);const t=await e.json();this._favorites=[...this._favorites,t.favorite]}catch(e){console.error("Failed to add favorite:",e)}this._cancelFavoriteInput()}else this._cancelFavoriteInput()}_cancelFavoriteInput(){this._showFavoriteInput=!1,this._favoriteInputName=""}_handleFavoriteNameChange(e){this._favoriteInputName=e.detail.value||""}_handleFavoriteNameKeydown(e){"Enter"===e.key?(e.preventDefault(),this._saveFavorite()):"Escape"===e.key&&(e.preventDefault(),this._cancelFavoriteInput())}async _removeFavorite(e){if(this.hass?.auth?.data?.access_token)try{const t=await fetch(`/api/aqara_advanced_lighting/favorites/${e}`,{method:"DELETE",credentials:"same-origin",headers:{Authorization:`Bearer ${this.hass.auth.data.access_token}`}});if(!t.ok&&204!==t.status)throw new Error(`HTTP error ${t.status}`);this._favorites=this._favorites.filter(t=>t.id!==e)}catch(e){console.error("Failed to remove favorite:",e)}else console.error("No auth token available")}_selectFavorite(e){this._selectedEntities=[...e.entities],this._loadCurvatureFromEntity()}_getEntityFriendlyName(e){if(!this.hass)return e;const t=this.hass.states[e];return t&&t.attributes.friendly_name?t.attributes.friendly_name:e.split(".")[1]?.replace(/_/g," ")||e}_getSelectedDeviceTypes(){if(!this._selectedEntities.length||!this.hass)return this._hasIncompatibleLights=!1,[];const e=new Set;let t=!1;for(const i of this._selectedEntities){const s=this.hass.states[i];if(!s)continue;const o=s.attributes.effect_list;o&&Array.isArray(o)?o.includes("flow1")||o.includes("flow2")||o.includes("rolling")?e.add("t1m"):o.includes("rainbow1")||o.includes("rainbow2")||o.includes("chasing")||o.includes("flicker")||o.includes("dash")?e.add("t1_strip"):o.includes("candlelight")?e.add("t2_bulb"):t=!0:o||void 0===s.attributes.color_temp?t=!0:e.add("t2_cct")}return this._hasIncompatibleLights=t,Array.from(e)}_getT1StripSegmentCount(){if(!this._selectedEntities.length||!this.hass)return 50;for(const e of this._selectedEntities){const t=this.hass.states[e];if(!t)continue;const i=t.attributes.effect_list;if(i&&Array.isArray(i)&&(i.includes("rainbow1")||i.includes("rainbow2")||i.includes("chasing")||i.includes("flicker")||i.includes("dash"))){let i;const s=t.attributes.length;if(s&&"number"==typeof s&&s>0&&(i=s),void 0===i){const t=e.split(".")[1]||"";for(const e of["number","sensor"]){const s=`${e}.${t}_length`,o=this.hass.states[s];if(o&&o.state&&"unknown"!==o.state&&"unavailable"!==o.state){const e=parseFloat(o.state);if(!isNaN(e)&&e>0){i=e;break}}}}if(void 0!==i&&i>0)return Math.round(5*i)}}return 50}_isEffectsCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return i&&Array.isArray(i)&&i.length>0})}_isPatternsCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i))&&(i.includes("flow1")||i.includes("rainbow1"))})}_isCCTCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];return!!t&&(void 0!==t.attributes.color_temp||void 0!==t.attributes.color_temp_kelvin||void 0!==t.attributes.min_color_temp_kelvin)})}_isSegmentsCompatible(){return!(!this.hass||!this._selectedEntities.length)&&this._selectedEntities.some(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i))&&(i.includes("flow1")||i.includes("rainbow1"))})}_getEffectsCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return i&&Array.isArray(i)&&i.length>0}):[]}_getPatternsCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i))&&(i.includes("flow1")||i.includes("rainbow1"))}):[]}_getCCTCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];return!!t&&(void 0!==t.attributes.color_temp||void 0!==t.attributes.color_temp_kelvin||void 0!==t.attributes.min_color_temp_kelvin)}):[]}_getSegmentsCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return!(!i||!Array.isArray(i))&&(i.includes("flow1")||i.includes("rainbow1"))}):[]}_getT2CompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list,s=i&&i.includes("candlelight"),o=!i&&void 0!==t.attributes.color_temp;return s||o}):[]}_filterPresets(){const e=this._getSelectedDeviceTypes(),t=e.length>0,i=e.includes("t2_bulb"),s=e.includes("t1m"),o=e.includes("t1_strip");return{showDynamicEffects:t&&(i||s||o),showSegmentPatterns:t&&(s||o),showCCTSequences:t,showSegmentSequences:t&&(s||o),t2Presets:i&&this._presets?.dynamic_effects.t2_bulb||[],t1mPresets:s&&this._presets?.dynamic_effects.t1m||[],t1StripPresets:o&&this._presets?.dynamic_effects.t1_strip||[]}}_handleTargetChanged(e){const t=e.detail.value;if(!t)return void(this._selectedEntities=[]);const i=t.entity_id;i?(Array.isArray(i)?this._selectedEntities=i:this._selectedEntities=[i],this._loadCurvatureFromEntity()):this._selectedEntities=[]}_handleBrightnessChange(e){this._brightness=e.detail.value}_handleCustomBrightnessToggle(e){this._useCustomBrightness=e.target.checked}_handleExpansionChange(e,t){const i=t.detail.expanded;this._collapsed={...this._collapsed,[e]:!i}}async _activateDynamicEffect(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0};this._useCustomBrightness&&(t.brightness=this._brightness),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",t)}async _activateSegmentPattern(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0};this._useCustomBrightness&&(t.brightness=this._brightness),await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",t)}async _activateCCTSequence(e){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",{entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0})}async _activateSegmentSequence(e){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",{entity_id:this._selectedEntities,preset:e.id,turn_on:!0,sync:!0})}async _stopEffect(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","stop_effect",{entity_id:this._selectedEntities,restore_state:!0})}async _pauseCCTSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","pause_cct_sequence",{entity_id:this._selectedEntities})}async _resumeCCTSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","resume_cct_sequence",{entity_id:this._selectedEntities})}async _stopCCTSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","stop_cct_sequence",{entity_id:this._selectedEntities})}async _pauseSegmentSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","pause_segment_sequence",{entity_id:this._selectedEntities})}async _resumeSegmentSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","resume_segment_sequence",{entity_id:this._selectedEntities})}async _stopSegmentSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","stop_segment_sequence",{entity_id:this._selectedEntities})}_getUserEffectPresetsForDeviceType(e){return this._userPresets?.effect_presets?this._userPresets.effect_presets.filter(t=>!t.device_type||("t1m"===e&&("t1"===t.device_type||"t1m"===t.device_type)||t.device_type===e)):[]}_getFilteredUserPatternPresets(){if(!this._userPresets?.segment_pattern_presets)return[];const e=this._getSelectedDeviceTypes();if(0===e.length)return[];return e.includes("t1m")||e.includes("t1_strip")?this._userPresets.segment_pattern_presets.filter(t=>!t.device_type||("t1"===t.device_type||"t1m"===t.device_type?e.includes("t1m"):e.includes(t.device_type))):[]}_getFilteredUserCCTSequencePresets(){if(!this._userPresets?.cct_sequence_presets)return[];return this._getSelectedDeviceTypes().length>0?this._userPresets.cct_sequence_presets:[]}_getFilteredUserSegmentSequencePresets(){if(!this._userPresets?.segment_sequence_presets)return[];const e=this._getSelectedDeviceTypes();if(0===e.length)return[];return e.includes("t1m")||e.includes("t1_strip")?this._userPresets.segment_sequence_presets.filter(t=>!t.device_type||("t1"===t.device_type||"t1m"===t.device_type?e.includes("t1m"):e.includes(t.device_type))):[]}async _activateUserEffectPreset(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,effect:e.effect,speed:e.effect_speed,turn_on:!0,sync:!0};e.effect_colors.forEach((e,i)=>{i<8&&(t[`color_${i+1}`]={x:e.x,y:e.y})}),void 0!==e.effect_brightness?t.brightness=e.effect_brightness:this._useCustomBrightness&&(t.brightness=this._brightness),e.effect_segments&&(t.segments=e.effect_segments),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",t)}async _activateUserPatternPreset(e){if(!this._selectedEntities.length)return;if(!e.segments||!Array.isArray(e.segments)||0===e.segments.length)return void console.warn("Pattern preset has no segments:",e.name);const t=e.segments.filter(e=>e&&e.color).map(e=>({segment:e.segment,color:{r:e.color.r,g:e.color.g,b:e.color.b}}));if(0===t.length)return void console.warn("Pattern preset has no valid segments after filtering:",e.name);const i={entity_id:this._selectedEntities,segment_colors:t,turn_on:!0,sync:!0,turn_off_unspecified:!0};this._useCustomBrightness&&(i.brightness=this._brightness);try{await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",i)}catch(e){console.error("Failed to activate pattern preset:",e)}}async _activateUserCCTSequencePreset(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,loop_mode:e.loop_mode,end_behavior:e.end_behavior,turn_on:!0,sync:!0};"count"===e.loop_mode&&void 0!==e.loop_count&&(t.loop_count=e.loop_count),e.steps.forEach((e,i)=>{const s=i+1;s<=20&&(t[`step_${s}_color_temp`]=e.color_temp,t[`step_${s}_brightness`]=e.brightness,t[`step_${s}_transition`]=e.transition,t[`step_${s}_hold`]=e.hold)}),await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",t)}async _activateUserSegmentSequencePreset(e){if(!this._selectedEntities.length)return;const t={entity_id:this._selectedEntities,loop_mode:e.loop_mode,end_behavior:e.end_behavior,turn_on:!0,sync:!0};"count"===e.loop_mode&&void 0!==e.loop_count&&(t.loop_count=e.loop_count),e.steps.forEach((e,i)=>{const s=i+1;s<=20&&(t[`step_${s}_segments`]=e.segments,t[`step_${s}_mode`]=e.mode,t[`step_${s}_duration`]=e.duration,t[`step_${s}_hold`]=e.hold,t[`step_${s}_activation_pattern`]=e.activation_pattern,e.colors&&Array.isArray(e.colors)&&e.colors.forEach((e,i)=>{i<6&&(t[`step_${s}_color_${i+1}`]=e)}))}),await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",t)}render(){if(this._loading)return R`
        <div class="header">
          <div class="toolbar">
            <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
            <div class="main-title">${this._localize("title")}</div>
          </div>
        </div>
        <div class="content">
          <div class="loading">${this._localize("errors.loading_presets")}</div>
        </div>
      `;if(this._error)return R`
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
      `;if(!this._presets)return R`
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
      `;const e=this._backendVersion&&this._backendVersion!==this._frontendVersion;return R`
      <div class="header">
        <div class="toolbar">
          <ha-menu-button .hass=${this.hass} .narrow=${this.narrow}></ha-menu-button>
          <div class="main-title">Aqara Advanced Lighting</div>
          ${this._backendVersion?R`
            <div class="version-display ${e?"version-mismatch":""}">
              ${e?R`
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                <span class="version-text">v${this._backendVersion} / v${this._frontendVersion}</span>
              `:R`
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
    `}_renderTabContent(){switch(this._activeTab){case"activate":default:return this._renderActivateTab();case"effects":return this._renderEffectsTab();case"patterns":return this._renderPatternsTab();case"cct":return this._renderCCTTab();case"segments":return this._renderSegmentsTab();case"presets":return this._renderPresetsTab();case"config":return this._renderConfigTab()}}_renderActivateTab(){const e=this._filterPresets(),t=this._selectedEntities.length>0,i="target_controls",s=!this._collapsed[i];return R`
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
                    .selector=${{target:{entity:{domain:"light"}}}}
                    .value=${{entity_id:this._selectedEntities}}
                    @value-changed=${this._handleTargetChanged}
                  ></ha-selector>
                </div>
                ${t&&!this._showFavoriteInput?R`
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

            ${this._favorites.length>0?R`
                  <div class="control-row">
                    <span class="control-label">${this._localize("target.favorites_label")}</span>
                    <div class="control-input favorites-container">
                      ${this._favorites.map(e=>R`
                          <div class="favorite-chip" @click=${()=>this._selectFavorite(e)}>
                            <ha-icon icon="mdi:star" class="favorite-icon"></ha-icon>
                            <span class="favorite-name">${e.name}</span>
                            <ha-icon-button
                              class="remove-favorite-btn"
                              @click=${t=>{t.stopPropagation(),this._removeFavorite(e.id)}}
                              title="${this._localize("tooltips.favorite_remove")}"
                            >
                              <ha-icon icon="mdi:close"></ha-icon>
                            </ha-icon-button>
                          </div>
                        `)}
                    </div>
                  </div>
                `:""}
          </div>

          ${this._showFavoriteInput?R`
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
                        Save
                      </ha-button>
                      <ha-button @click=${this._cancelFavoriteInput}>
                        <ha-icon icon="mdi:close"></ha-icon>
                        Cancel
                      </ha-button>
                    </div>
                  </div>
                </div>
              `:""}

          ${t?R`
                <div class="control-row">
                  <span class="control-label">${this._localize("target.light_control_label")}</span>
                  <div class="control-input light-tile-container" ${ke(this._tileCardRef)}>
                  </div>
                </div>

                <div class="control-row">
                  <span class="control-label">${this._localize("target.quick_controls_label")}</span>
                  <div class="control-input control-buttons">
                    ${e.showDynamicEffects?R`
                          <ha-button @click=${this._stopEffect}>
                            <ha-icon icon="mdi:stop"></ha-icon>
                            Effect
                          </ha-button>
                        `:""}
                    <ha-button @click=${this._pauseCCTSequence}>
                      <ha-icon icon="mdi:pause"></ha-icon>
                      CCT
                    </ha-button>
                    <ha-button @click=${this._resumeCCTSequence}>
                      <ha-icon icon="mdi:play"></ha-icon>
                      CCT
                    </ha-button>
                    <ha-button @click=${this._stopCCTSequence}>
                      <ha-icon icon="mdi:stop"></ha-icon>
                      CCT
                    </ha-button>
                    ${e.showSegmentSequences?R`
                          <ha-button @click=${this._pauseSegmentSequence}>
                            <ha-icon icon="mdi:pause"></ha-icon>
                            Segment
                          </ha-button>
                          <ha-button @click=${this._resumeSegmentSequence}>
                            <ha-icon icon="mdi:play"></ha-icon>
                            Segment
                          </ha-button>
                          <ha-button @click=${this._stopSegmentSequence}>
                            <ha-icon icon="mdi:stop"></ha-icon>
                            Segment
                          </ha-button>
                        `:""}
                  </div>
                </div>

                <div class="form-section">
                  <span class="form-label">${this._localize("target.custom_brightness_label")}</span>
                  <ha-switch
                    .checked=${this._useCustomBrightness}
                    @change=${this._handleCustomBrightnessToggle}
                  ></ha-switch>
                </div>

                ${this._useCustomBrightness?R`
                      <div class="control-row">
                        <span class="control-label">${this._localize("target.brightness_label")}</span>
                        <div class="control-input">
                          <ha-selector
                            .hass=${this.hass}
                            .selector=${{number:{min:1,max:100,mode:"slider",unit_of_measurement:"%"}}}
                            .value=${this._brightness}
                            @value-changed=${this._handleBrightnessChange}
                          ></ha-selector>
                        </div>
                      </div>
                    `:""}
              `:""}
        </div>
      </ha-expansion-panel>

      ${t?"":R`<div class="no-lights">Please select one or more lights to view available presets</div>`}

      ${this._hasIncompatibleLights?R`
            <ha-alert alert-type="error" title="${this._localize("errors.incompatible_light_title")}">
              ${this._localize("errors.incompatible_light_message")}
            </ha-alert>
          `:""}

      ${e.showDynamicEffects&&!this._hasIncompatibleLights?R`
            ${e.t2Presets.length>0||this._getUserEffectPresetsForDeviceType("t2_bulb").length>0?this._renderDynamicEffectsSection("T2 Bulb",e.t2Presets,"t2_bulb"):""}
            ${e.t1mPresets.length>0||this._getUserEffectPresetsForDeviceType("t1m").length>0?this._renderDynamicEffectsSection("T1M",e.t1mPresets,"t1m"):""}
            ${e.t1StripPresets.length>0||this._getUserEffectPresetsForDeviceType("t1_strip").length>0?this._renderDynamicEffectsSection("T1 Strip",e.t1StripPresets,"t1_strip"):""}
          `:""}

      ${e.showSegmentPatterns&&((this._presets?.segment_patterns?.length??0)>0||this._getFilteredUserPatternPresets().length>0)&&!this._hasIncompatibleLights?this._renderSegmentPatternsSection():""}

      ${e.showCCTSequences&&((this._presets?.cct_sequences?.length??0)>0||this._getFilteredUserCCTSequencePresets().length>0)&&!this._hasIncompatibleLights?this._renderCCTSequencesSection():""}

      ${e.showSegmentSequences&&((this._presets?.segment_sequences?.length??0)>0||this._getFilteredUserSegmentSequencePresets().length>0)&&!this._hasIncompatibleLights?this._renderSegmentSequencesSection():""}
    `}_renderEffectsTab(){const e="effect"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isEffectsCompatible(),i=this._selectedEntities.length>0;return R`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_effect_title"):this._localize("dialogs.create_effect_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_effect_description"):this._localize("dialogs.create_effect_description")}
        </p>
        ${i&&!t?R`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_effects")}
          </ha-alert>
        `:""}
        <effect-editor
          .hass=${this.hass}
          .preset=${e}
          .translations=${this._translations}
          .editMode=${!!e}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .previewActive=${this._effectPreviewActive}
          @save=${this._handleEffectSave}
          @preview=${this._handleEffectPreview}
          @stop-preview=${this._handleEffectStopPreview}
          @cancel=${this._handleEditorCancel}
        ></effect-editor>
      </ha-card>
    `}async _handleEffectSave(e){if("effect"===this._editingPreset?.type){const t=this._editingPreset.preset;await this._updateUserPreset("effect",t.id,e.detail)}else await this._saveUserPreset("effect",e.detail);this._editingPreset=void 0,this._setActiveTab("presets")}_handleEditorCancel(){this._editingPreset=void 0,this._setActiveTab("activate")}async _handleEffectPreview(e){const t=this._getEffectsCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for effect preview");const i=e.detail,s={entity_id:t,effect:i.effect,speed:i.effect_speed,turn_on:!0,sync:!0};i.effect_colors&&i.effect_colors.forEach((e,t)=>{if(t<8)if("x"in e&&"y"in e&&void 0!==e.x&&void 0!==e.y){const i=ze(e.x,e.y,255);s[`color_${t+1}`]=[i.r,i.g,i.b]}else"r"in e&&"g"in e&&"b"in e&&(s[`color_${t+1}`]=[e.r,e.g,e.b])}),void 0!==i.effect_brightness&&(s.brightness=i.effect_brightness),i.effect_segments&&(s.segments=i.effect_segments),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",s),this._effectPreviewActive=!0}async _handleEffectStopPreview(){const e=this._getEffectsCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_effect",{entity_id:e,restore_state:!0}),this._effectPreviewActive=!1)}_renderPatternsTab(){const e="pattern"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isPatternsCompatible(),i=this._selectedEntities.length>0;return R`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_pattern_title"):this._localize("dialogs.create_pattern_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_pattern_description"):this._localize("dialogs.create_pattern_description")}
        </p>
        ${i&&!t?R`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_patterns")}
          </ha-alert>
        `:""}
        <pattern-editor
          .hass=${this.hass}
          .preset=${e}
          .translations=${this._translations}
          .editMode=${!!e}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .stripSegmentCount=${this._getT1StripSegmentCount()}
          @save=${this._handlePatternSave}
          @preview=${this._handlePatternPreview}
          @cancel=${this._handleEditorCancel}
        ></pattern-editor>
      </ha-card>
    `}async _handlePatternSave(e){if("pattern"===this._editingPreset?.type){const t=this._editingPreset.preset;await this._updateUserPreset("segment_pattern",t.id,e.detail)}else await this._saveUserPreset("segment_pattern",e.detail);this._editingPreset=void 0,this._setActiveTab("presets")}async _handlePatternPreview(e){const t=this._getPatternsCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for pattern preview");const i=e.detail;if(!i.segments||!Array.isArray(i.segments))return void console.error("Pattern preview: No segments in data");const s=i.segments.map(e=>({segment:e.segment,color:{r:e.color.r,g:e.color.g,b:e.color.b}}));try{await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",{entity_id:t,segment_colors:s,turn_on:!0,turn_off_unspecified:!0,sync:!0})}catch(e){console.error("Pattern preview service call failed:",e)}}_renderCCTTab(){const e="cct"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isCCTCompatible(),i=this._selectedEntities.length>0;return R`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_cct_title"):this._localize("dialogs.create_cct_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_cct_description"):this._localize("dialogs.create_cct_description")}
        </p>
        ${i&&!t?R`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_cct")}
          </ha-alert>
        `:""}
        <cct-sequence-editor
          .hass=${this.hass}
          .preset=${e}
          .translations=${this._translations}
          .editMode=${!!e}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .selectedEntities=${this._selectedEntities}
          .previewActive=${this._cctPreviewActive}
          @save=${this._handleCCTSave}
          @preview=${this._handleCCTPreview}
          @stop-preview=${this._handleCCTStopPreview}
          @cancel=${this._handleEditorCancel}
        ></cct-sequence-editor>
      </ha-card>
    `}async _handleCCTSave(e){if("cct"===this._editingPreset?.type){const t=this._editingPreset.preset;await this._updateUserPreset("cct_sequence",t.id,e.detail)}else await this._saveUserPreset("cct_sequence",e.detail);this._editingPreset=void 0,this._setActiveTab("presets")}async _handleCCTPreview(e){const t=this._getCCTCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for CCT preview");const i=e.detail,s={entity_id:t,loop_mode:i.loop_mode,end_behavior:i.end_behavior,turn_on:!0,sync:!0};"count"===i.loop_mode&&void 0!==i.loop_count&&(s.loop_count=i.loop_count),i.steps&&Array.isArray(i.steps)&&i.steps.forEach((e,t)=>{const i=t+1;i<=20&&(s[`step_${i}_color_temp`]=e.color_temp,s[`step_${i}_brightness`]=e.brightness,s[`step_${i}_transition`]=e.transition,s[`step_${i}_hold`]=e.hold)}),await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",s),this._cctPreviewActive=!0}async _handleCCTStopPreview(){const e=this._getCCTCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_cct_sequence",{entity_id:e}),this._cctPreviewActive=!1)}_renderSegmentsTab(){const e="segment"===this._editingPreset?.type?this._editingPreset.preset:void 0,t=this._isSegmentsCompatible(),i=this._selectedEntities.length>0;return R`
      <ha-card class="editor-form">
        <h2>${e?this._localize("dialogs.edit_segment_title"):this._localize("dialogs.create_segment_title")}</h2>
        <p class="editor-description">
          ${e?this._localize("dialogs.edit_segment_description"):this._localize("dialogs.create_segment_description")}
        </p>
        ${i&&!t?R`
          <ha-alert alert-type="warning" class="compatibility-warning">
            ${this._localize("dialogs.compatibility_warning_segments")}
          </ha-alert>
        `:""}
        <segment-sequence-editor
          .hass=${this.hass}
          .preset=${e}
          .translations=${this._translations}
          .editMode=${!!e}
          .hasSelectedEntities=${i}
          .isCompatible=${t}
          .previewActive=${this._segmentSequencePreviewActive}
          @save=${this._handleSegmentSequenceSave}
          @preview=${this._handleSegmentSequencePreview}
          @stop-preview=${this._handleSegmentSequenceStopPreview}
          @cancel=${this._handleEditorCancel}
        ></segment-sequence-editor>
      </ha-card>
    `}async _handleSegmentSequenceSave(e){if("segment"===this._editingPreset?.type){const t=this._editingPreset.preset;await this._updateUserPreset("segment_sequence",t.id,e.detail)}else await this._saveUserPreset("segment_sequence",e.detail);this._editingPreset=void 0,this._setActiveTab("presets")}async _handleSegmentSequencePreview(e){const t=this._getSegmentsCompatibleEntities();if(!t.length)return void console.warn("No compatible entities selected for segment sequence preview");const i=e.detail,s={entity_id:t,loop_mode:i.loop_mode,end_behavior:i.end_behavior,clear_segments:i.clear_segments||!1,skip_first_in_loop:i.skip_first_in_loop||!1,turn_on:!0,sync:!0};"count"===i.loop_mode&&void 0!==i.loop_count&&(s.loop_count=i.loop_count),i.steps&&Array.isArray(i.steps)&&i.steps.forEach((e,t)=>{const i=t+1;i<=20&&(s[`step_${i}_segments`]=e.segments,s[`step_${i}_mode`]=e.mode,s[`step_${i}_duration`]=e.duration,s[`step_${i}_hold`]=e.hold,s[`step_${i}_activation_pattern`]=e.activation_pattern,e.colors&&Array.isArray(e.colors)&&e.colors.forEach((e,t)=>{t<6&&(s[`step_${i}_color_${t+1}`]=e)}))}),await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",s),this._segmentSequencePreviewActive=!0}async _handleSegmentSequenceStopPreview(){const e=this._getSegmentsCompatibleEntities();e.length&&(await this.hass.callService("aqara_advanced_lighting","stop_segment_sequence",{entity_id:e}),this._segmentSequencePreviewActive=!1)}_renderPresetsTab(){const e=this._userPresets?.effect_presets||[],t=this._userPresets?.segment_pattern_presets||[],i=this._userPresets?.cct_sequence_presets||[],s=this._userPresets?.segment_sequence_presets||[],o=e.length+t.length+i.length+s.length,a=this._selectedEntities.length>0,r=this._sortUserEffectPresets(e,this._sortPreferences.effects),n=this._sortUserPatternPresets(t,this._sortPreferences.patterns),l=this._sortUserCCTSequencePresets(i,this._sortPreferences.cct),c=this._sortUserSegmentSequencePresets(s,this._sortPreferences.segments);return R`
      <ha-card class="editor-form">
        <h2>${this._localize("tabs.presets")}</h2>
        <p class="editor-description">
          ${this._localize("presets.manage_description")} ${a?this._localize("presets.manage_description_with_selection"):"Select lights in the Activate tab to enable activation."}
        </p>

        ${0===o?R`
              <div class="no-presets">
                <ha-icon icon="mdi:folder-open-outline"></ha-icon>
                <p>${this._localize("presets.no_presets_title")}</p>
                <p>${this._localize("presets.no_presets_description")}</p>
              </div>
            `:R`
              ${e.length>0?R`
                    <div class="preset-category">
                      <div class="preset-category-header">
                        <h3>Effect Presets (${e.length})</h3>
                        ${this._renderSortDropdown("effects")}
                      </div>
                      <div class="preset-grid">
                        ${r.map(e=>R`
                            <div
                              class="user-preset-card ${a?"":"disabled"}"
                              @click=${a?()=>this._activateUserEffectPreset(e):null}
                              title="${e.name}"
                            >
                              <div class="preset-card-actions">
                                <ha-icon-button
                                  @click=${t=>{t.stopPropagation(),this._editEffectPreset(e)}}
                                  title="${this._localize("tooltips.preset_edit")}"
                                >
                                  <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                  @click=${t=>{t.stopPropagation(),this._deleteUserPreset("effect",e.id)}}
                                  title="${this._localize("tooltips.preset_delete")}"
                                >
                                  <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                              </div>
                              <div class="preset-icon">
                                <ha-icon icon="${e.icon||"mdi:lightbulb-on"}"></ha-icon>
                              </div>
                              <div class="preset-name">${e.name}</div>
                            </div>
                          `)}
                      </div>
                    </div>
                  `:""}

              ${t.length>0?R`
                    <div class="preset-category">
                      <div class="preset-category-header">
                        <h3>Segment Pattern Presets (${t.length})</h3>
                        ${this._renderSortDropdown("patterns")}
                      </div>
                      <div class="preset-grid">
                        ${n.map(e=>R`
                            <div
                              class="user-preset-card ${a?"":"disabled"}"
                              @click=${a?()=>this._activateUserPatternPreset(e):null}
                              title="${e.name}"
                            >
                              <div class="preset-card-actions">
                                <ha-icon-button
                                  @click=${t=>{t.stopPropagation(),this._editPatternPreset(e)}}
                                  title="${this._localize("tooltips.preset_edit")}"
                                >
                                  <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                  @click=${t=>{t.stopPropagation(),this._deleteUserPreset("segment_pattern",e.id)}}
                                  title="${this._localize("tooltips.preset_delete")}"
                                >
                                  <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                              </div>
                              <div class="preset-icon">
                                <ha-icon icon="${e.icon||"mdi:palette"}"></ha-icon>
                              </div>
                              <div class="preset-name">${e.name}</div>
                            </div>
                          `)}
                      </div>
                    </div>
                  `:""}

              ${i.length>0?R`
                    <div class="preset-category">
                      <div class="preset-category-header">
                        <h3>CCT Sequence Presets (${i.length})</h3>
                        ${this._renderSortDropdown("cct")}
                      </div>
                      <div class="preset-grid">
                        ${l.map(e=>R`
                            <div
                              class="user-preset-card ${a?"":"disabled"}"
                              @click=${a?()=>this._activateUserCCTSequencePreset(e):null}
                              title="${e.name}"
                            >
                              <div class="preset-card-actions">
                                <ha-icon-button
                                  @click=${t=>{t.stopPropagation(),this._editCCTSequencePreset(e)}}
                                  title="${this._localize("tooltips.preset_edit")}"
                                >
                                  <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                  @click=${t=>{t.stopPropagation(),this._deleteUserPreset("cct_sequence",e.id)}}
                                  title="${this._localize("tooltips.preset_delete")}"
                                >
                                  <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                              </div>
                              <div class="preset-icon">
                                <ha-icon icon="${e.icon||"mdi:temperature-kelvin"}"></ha-icon>
                              </div>
                              <div class="preset-name">${e.name}</div>
                            </div>
                          `)}
                      </div>
                    </div>
                  `:""}

              ${s.length>0?R`
                    <div class="preset-category">
                      <div class="preset-category-header">
                        <h3>Segment Sequence Presets (${s.length})</h3>
                        ${this._renderSortDropdown("segments")}
                      </div>
                      <div class="preset-grid">
                        ${c.map(e=>R`
                            <div
                              class="user-preset-card ${a?"":"disabled"}"
                              @click=${a?()=>this._activateUserSegmentSequencePreset(e):null}
                              title="${e.name}"
                            >
                              <div class="preset-card-actions">
                                <ha-icon-button
                                  @click=${t=>{t.stopPropagation(),this._editSegmentSequencePreset(e)}}
                                  title="${this._localize("tooltips.preset_edit")}"
                                >
                                  <ha-icon icon="mdi:pencil"></ha-icon>
                                </ha-icon-button>
                                <ha-icon-button
                                  @click=${t=>{t.stopPropagation(),this._deleteUserPreset("segment_sequence",e.id)}}
                                  title="${this._localize("tooltips.preset_delete")}"
                                >
                                  <ha-icon icon="mdi:delete"></ha-icon>
                                </ha-icon-button>
                              </div>
                              <div class="preset-icon">
                                <ha-icon icon="${e.icon||"mdi:animation-play"}"></ha-icon>
                              </div>
                              <div class="preset-name">${e.name}</div>
                            </div>
                          `)}
                      </div>
                    </div>
                  `:""}
            `}
      </ha-card>
    `}_editEffectPreset(e){this._editingPreset={type:"effect",preset:e},this._setActiveTab("effects")}_editPatternPreset(e){this._editingPreset={type:"pattern",preset:e},this._setActiveTab("patterns")}_editCCTSequencePreset(e){this._editingPreset={type:"cct",preset:e},this._setActiveTab("cct")}_editSegmentSequencePreset(e){this._editingPreset={type:"segment",preset:e},this._setActiveTab("segments")}_renderSortDropdown(e){const t=this._sortPreferences[e];return R`
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
    `}_renderDynamicEffectsSection(e,t,i){const s=`dynamic_${e.toLowerCase().replace(/\s+/g,"_")}`,o=!this._collapsed[s],a=this._getUserEffectPresetsForDeviceType(i),r=a.length+t.length,n=this._sortUserEffectPresets(a,this._sortPreferences.effects),l=this._sortDynamicEffectPresets(t,this._sortPreferences.effects);return R`
      <ha-expansion-panel
        outlined
        .expanded=${o}
        @expanded-changed=${e=>this._handleExpansionChange(s,e)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Dynamic Effects: ${e}</div>
            <div class="section-subtitle">${r} presets${a.length>0?` (${a.length} custom)`:""}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown("effects")}
          </div>
        </div>
        <div class="section-content">
          ${n.map(e=>R`
              <div class="preset-button user-preset" @click=${()=>this._activateUserEffectPreset(e)}>
                <div class="preset-icon">
                  <ha-icon icon="${e.icon||"mdi:lightbulb-on"}"></ha-icon>
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${l.map(e=>R`
              <div class="preset-button" @click=${()=>this._activateDynamicEffect(e)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(e.icon,"mdi:lightbulb-on")}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
        </div>
      </ha-expansion-panel>
    `}_renderSegmentPatternsSection(){const e="segment_patterns",t=!this._collapsed[e],i=this._getFilteredUserPatternPresets(),s=this._presets.segment_patterns,o=i.length+s.length,a=this._sortUserPatternPresets(i,this._sortPreferences.patterns),r=this._sortSegmentPatternPresets(s,this._sortPreferences.patterns);return R`
      <ha-expansion-panel
        outlined
        .expanded=${t}
        @expanded-changed=${t=>this._handleExpansionChange(e,t)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Segment Patterns</div>
            <div class="section-subtitle">${o} presets${i.length>0?` (${i.length} custom)`:""}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown("patterns")}
          </div>
        </div>
        <div class="section-content">
          ${a.map(e=>R`
              <div class="preset-button user-preset" @click=${()=>this._activateUserPatternPreset(e)}>
                <div class="preset-icon">
                  <ha-icon icon="${e.icon||"mdi:palette"}"></ha-icon>
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${r.map(e=>R`
              <div class="preset-button" @click=${()=>this._activateSegmentPattern(e)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(e.icon,"mdi:palette")}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
        </div>
      </ha-expansion-panel>
    `}_renderPresetIcon(e,t){return e?e.includes(".")?R`<img src="/api/aqara_advanced_lighting/icons/${e}" alt="preset icon" />`:R`<ha-icon icon="${e}"></ha-icon>`:R`<ha-icon icon="${t}"></ha-icon>`}_renderCCTSequencesSection(){const e="cct_sequences",t=!this._collapsed[e],i=this._getFilteredUserCCTSequencePresets(),s=this._presets.cct_sequences,o=i.length+s.length,a=this._sortUserCCTSequencePresets(i,this._sortPreferences.cct),r=this._sortCCTSequencePresets(s,this._sortPreferences.cct);return R`
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
            ${this._renderSortDropdown("cct")}
          </div>
        </div>
        <div class="section-content">
          ${a.map(e=>R`
              <div class="preset-button user-preset" @click=${()=>this._activateUserCCTSequencePreset(e)}>
                <div class="preset-icon">
                  <ha-icon icon="${e.icon||"mdi:temperature-kelvin"}"></ha-icon>
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${r.map(e=>R`
              <div class="preset-button" @click=${()=>this._activateCCTSequence(e)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(e.icon,"mdi:temperature-kelvin")}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
        </div>
      </ha-expansion-panel>
    `}_renderSegmentSequencesSection(){const e="segment_sequences",t=!this._collapsed[e],i=this._getFilteredUserSegmentSequencePresets(),s=this._presets.segment_sequences,o=i.length+s.length,a=this._sortUserSegmentSequencePresets(i,this._sortPreferences.segments),r=this._sortSegmentSequencePresets(s,this._sortPreferences.segments);return R`
      <ha-expansion-panel
        outlined
        .expanded=${t}
        @expanded-changed=${t=>this._handleExpansionChange(e,t)}
      >
        <div slot="header" class="section-header">
          <div>
            <div class="section-title">Segment Sequences</div>
            <div class="section-subtitle">${o} presets${i.length>0?` (${i.length} custom)`:""}</div>
          </div>
          <div class="section-header-controls" @click=${e=>e.stopPropagation()}>
            ${this._renderSortDropdown("segments")}
          </div>
        </div>
        <div class="section-content">
          ${a.map(e=>R`
              <div class="preset-button user-preset" @click=${()=>this._activateUserSegmentSequencePreset(e)}>
                <div class="preset-icon">
                  <ha-icon icon="${e.icon||"mdi:animation-play"}"></ha-icon>
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
          ${r.map(e=>R`
              <div class="preset-button" @click=${()=>this._activateSegmentSequence(e)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(e.icon,"mdi:animation-play")}
                </div>
                <div class="preset-name">${e.name}</div>
              </div>
            `)}
        </div>
      </ha-expansion-panel>
    `}_renderConfigTab(){const e=this._selectedEntities.length>0,t=this._getSelectedDeviceTypes(),i=t.includes("t2_bulb")||t.includes("t2_cct"),s=t.includes("t1_strip"),o=this._findTransitionCurveEntity(),a=this._findInitialBrightnessEntity(),r=this._findT1StripLengthEntity(),n=this._findOnOffDurationEntity(),l=this._findOffOnDurationEntity(),c=this._findDimmingRangeMinEntity(),d=this._findDimmingRangeMaxEntity(),h=a&&this.hass?.states[a]&&parseFloat(this.hass.states[a].state)||0,p=r&&this.hass?.states[r]&&parseFloat(this.hass.states[r].state)||2,_=n&&this.hass?.states[n]&&parseFloat(this.hass.states[n].state)||0,g=l&&this.hass?.states[l]&&parseFloat(this.hass.states[l].state)||0,m=c&&this.hass?.states[c]&&parseFloat(this.hass.states[c].state)||1,u=d&&this.hass?.states[d]&&parseFloat(this.hass.states[d].state)||100,v=n||l||c||d;return R`
      ${e?"":R`
            <ha-card class="controls">
              <div class="control-row">
                <div class="control-input">
                  <ha-alert alert-type="info">
                    Select a light in the Activate tab to configure device-specific settings.
                  </ha-alert>
                </div>
              </div>
            </ha-card>
          `}

      ${i?R`
            <ha-expansion-panel
              outlined
              .expanded=${!0}
            >
              <div slot="header" class="section-header">
                <div>
                  <div class="section-title">Transition settings</div>
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
                          ?disabled=${!a}
                        ></ha-selector>
                        ${a?"":R`
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

      ${e?R`
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
                      ${n?"":R`
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
                      ${l?"":R`
                        <div class="entity-not-found">Entity not found for this device.</div>
                      `}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize("config.dimming_range_min_label")}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:1,max:Math.min(99,u-1),step:1,mode:"slider",unit_of_measurement:"%"}}}
                        .value=${m}
                        @value-changed=${e=>this._handleDimmingRangeMinChange(e)}
                        ?disabled=${!c}
                      ></ha-selector>
                      ${c?"":R`
                        <div class="entity-not-found">Entity not found for this device.</div>
                      `}
                    </div>
                  </div>
                  <div class="dimming-setting-item">
                    <div class="dimming-setting-content">
                      <span class="form-label">${this._localize("config.dimming_range_max_label")}</span>
                      <ha-selector
                        .hass=${this.hass}
                        .selector=${{number:{min:Math.max(2,m+1),max:100,step:1,mode:"slider",unit_of_measurement:"%"}}}
                        .value=${u}
                        @value-changed=${e=>this._handleDimmingRangeMaxChange(e)}
                        ?disabled=${!d}
                      ></ha-selector>
                      ${d?"":R`
                        <div class="entity-not-found">Entity not found for this device.</div>
                      `}
                    </div>
                  </div>
                </div>
                ${v?"":R`
                  <div style="padding: 16px; text-align: center; color: var(--secondary-text-color);">
                    <ha-icon icon="mdi:information-outline" style="margin-right: 8px;"></ha-icon>
                    Dimming settings are not available for this device.
                  </div>
                `}
              </div>
            </ha-expansion-panel>
          `:""}

      ${s?R`
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
                    ?disabled=${!r}
                  ></ha-selector>
                  <div style="margin-top: 8px; font-size: var(--ha-font-size-s, 12px); color: var(--secondary-text-color);">
                    ${r?"Each meter has 5 addressable RGB segments (20cm each).":"Length entity not found for this device."}
                  </div>
                </div>
              </div>
            </ha-expansion-panel>
          `:""}
    `}async _handleInitialBrightnessChange(e){if(!this.hass)return;const t=e.detail.value;if("number"!=typeof t)return;const i=this._findAllInitialBrightnessEntities();if(i.length)try{await Promise.all(i.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:t})))}catch(e){console.error("Failed to set initial brightness:",e)}}_findTransitionCurveEntity(){if(this.hass&&this._selectedEntities.length)for(const e of this._selectedEntities){const t=this.hass.states[e];if(!t)continue;const i=t.attributes.effect_list,s=i&&i.includes("candlelight"),o=!i&&void 0!==t.attributes.color_temp;if(!s&&!o)continue;const a=e.replace("light.",""),r=`number.${a}_transition_curve_curvature`;if(this.hass.states[r])return r;const n=a.toLowerCase(),l=n.split("_")[0]||n;for(const e of Object.keys(this.hass.states))if(e.startsWith("number.")&&e.includes("transition_curve_curvature")&&e.toLowerCase().includes(l))return e}}_findInitialBrightnessEntity(){if(this.hass&&this._selectedEntities.length)for(const e of this._selectedEntities){const t=this.hass.states[e];if(!t)continue;const i=t.attributes.effect_list,s=i&&i.includes("candlelight"),o=!i&&void 0!==t.attributes.color_temp;if(!s&&!o)continue;const a=e.replace("light.",""),r=`number.${a}_transition_initial_brightness`;if(this.hass.states[r])return r;const n=a.toLowerCase(),l=n.split("_")[0]||n;for(const e of Object.keys(this.hass.states))if(e.startsWith("number.")&&e.includes("transition_initial_brightness")&&e.toLowerCase().includes(l))return e}}_findAllTransitionCurveEntities(){if(!this.hass||!this._selectedEntities.length)return[];const e=[],t=this._getT2CompatibleEntities();for(const i of t){const t=i.replace("light.",""),s=`number.${t}_transition_curve_curvature`;if(this.hass.states[s]){e.push(s);continue}const o=t.toLowerCase(),a=o.split("_")[0]||o;for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes("transition_curve_curvature")&&t.toLowerCase().includes(a)&&!e.includes(t)){e.push(t);break}}return e}_findAllInitialBrightnessEntities(){if(!this.hass||!this._selectedEntities.length)return[];const e=[],t=this._getT2CompatibleEntities();for(const i of t){const t=i.replace("light.",""),s=`number.${t}_transition_initial_brightness`;if(this.hass.states[s]){e.push(s);continue}const o=t.toLowerCase(),a=o.split("_")[0]||o;for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes("transition_initial_brightness")&&t.toLowerCase().includes(a)&&!e.includes(t)){e.push(t);break}}return e}_findAllDimmingEntities(e){if(!this.hass||!this._selectedEntities.length)return[];const t=[];for(const i of this._selectedEntities){if(!this.hass.states[i])continue;const s=i.replace("light.",""),o=`number.${s}_${e}`;if(this.hass.states[o]){t.push(o);continue}const a=s.toLowerCase(),r=a.split("_")[0]||a;for(const i of Object.keys(this.hass.states))if(i.startsWith("number.")&&i.includes(e)&&i.toLowerCase().includes(r)&&!t.includes(i)){t.push(i);break}}return t}_findDimmingEntity(e){if(this.hass&&this._selectedEntities.length)for(const t of this._selectedEntities){if(!this.hass.states[t])continue;const i=t.replace("light.",""),s=`number.${i}_${e}`;if(this.hass.states[s])return s;const o=i.toLowerCase(),a=o.split("_")[0]||o;for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.includes(e)&&t.toLowerCase().includes(a))return t}}_findOnOffDurationEntity(){return this._findDimmingEntity("on_off_duration")}_findOffOnDurationEntity(){return this._findDimmingEntity("off_on_duration")}_findDimmingRangeMinEntity(){return this._findDimmingEntity("dimming_range_minimum")}_findDimmingRangeMaxEntity(){return this._findDimmingEntity("dimming_range_maximum")}async _handleDimmingSettingChange(e,t){if(!this.hass)return;const i=e.detail.value;if("number"!=typeof i)return;const s=this._findAllDimmingEntities(t);if(s.length)try{await Promise.all(s.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:i})))}catch(e){console.error("Failed to set dimming setting:",e)}}async _handleDimmingRangeMinChange(e){const t=this._findDimmingRangeMinEntity(),i=this._findDimmingRangeMaxEntity();if(!this.hass||!t)return;const s=e.detail.value;if("number"!=typeof s)return;s>=(i&&this.hass.states[i]&&parseFloat(this.hass.states[i].state)||100)||await this._handleDimmingSettingChange(e,"dimming_range_minimum")}async _handleDimmingRangeMaxChange(e){const t=this._findDimmingRangeMinEntity(),i=this._findDimmingRangeMaxEntity();if(!this.hass||!i)return;const s=e.detail.value;if("number"!=typeof s)return;s<=(t&&this.hass.states[t]&&parseFloat(this.hass.states[t].state)||1)||await this._handleDimmingSettingChange(e,"dimming_range_maximum")}_getT1StripCompatibleEntities(){return this.hass?this._selectedEntities.filter(e=>{const t=this.hass.states[e];if(!t)return!1;const i=t.attributes.effect_list;return i&&i.includes("dash")&&!i.includes("candlelight")}):[]}_findT1StripLengthEntity(){if(!this.hass||!this._selectedEntities.length)return;const e=this._getT1StripCompatibleEntities();if(e.length)for(const t of e){const e=t.replace("light.",""),i=`number.${e}_length`;if(this.hass.states[i])return i;const s=e.toLowerCase(),o=s.split("_")[0]||s;for(const e of Object.keys(this.hass.states))if(e.startsWith("number.")&&e.endsWith("_length")&&e.toLowerCase().includes(o))return e}}_findAllT1StripLengthEntities(){if(!this.hass||!this._selectedEntities.length)return[];const e=[],t=this._getT1StripCompatibleEntities();for(const i of t){const t=i.replace("light.",""),s=`number.${t}_length`;if(this.hass.states[s]){e.push(s);continue}const o=t.toLowerCase(),a=o.split("_")[0]||o;for(const t of Object.keys(this.hass.states))if(t.startsWith("number.")&&t.endsWith("_length")&&t.toLowerCase().includes(a)&&!e.includes(t)){e.push(t);break}}return e}async _handleT1StripLengthChange(e){if(!this.hass)return;const t=e.detail.value;if("number"!=typeof t)return;const i=this._findAllT1StripLengthEntities();if(i.length)try{await Promise.all(i.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:t})))}catch(e){console.error("Failed to set T1 Strip length:",e)}}_handleCurvatureInput(e){const{curvature:t}=e.detail;"number"==typeof t&&(this._localCurvature=t)}_handleCurvatureNumberChange(e){const t=e.detail.value;if("number"==typeof t){const e=Math.max(.2,Math.min(6,t));this._localCurvature=Math.round(100*e)/100}}_getCurvatureDescription(){return this._localCurvature<.9?"Fast start, slow end":this._localCurvature<=1.1?"Linear (uniform)":"Slow start, fast end"}async _applyCurvature(){if(!this.hass)return;const e=this._findAllTransitionCurveEntities();if(e.length){this._applyingCurvature=!0;try{await Promise.all(e.map(e=>this.hass.callService("number","set_value",{entity_id:e,value:this._localCurvature})))}catch(e){console.error("Failed to set transition curve curvature:",e)}finally{this._applyingCurvature=!1}}}_loadCurvatureFromEntity(){const e=this._findTransitionCurveEntity();if(!this.hass||!e)return;const t=this.hass.states[e];if(!t)return;const i=parseFloat(t.state);!isNaN(i)&&i>=.2&&i<=6&&(this._localCurvature=Math.round(100*i)/100)}};Xe.styles=Pe,e([pe({attribute:!1})],Xe.prototype,"hass",void 0),e([pe({type:Boolean,reflect:!0})],Xe.prototype,"narrow",void 0),e([_e()],Xe.prototype,"_presets",void 0),e([_e()],Xe.prototype,"_loading",void 0),e([_e()],Xe.prototype,"_error",void 0),e([_e()],Xe.prototype,"_selectedEntities",void 0),e([_e()],Xe.prototype,"_brightness",void 0),e([_e()],Xe.prototype,"_useCustomBrightness",void 0),e([_e()],Xe.prototype,"_collapsed",void 0),e([_e()],Xe.prototype,"_hasIncompatibleLights",void 0),e([_e()],Xe.prototype,"_favorites",void 0),e([_e()],Xe.prototype,"_showFavoriteInput",void 0),e([_e()],Xe.prototype,"_favoriteInputName",void 0),e([_e()],Xe.prototype,"_activeTab",void 0),e([_e()],Xe.prototype,"_userPresets",void 0),e([_e()],Xe.prototype,"_editingPreset",void 0),e([_e()],Xe.prototype,"_effectPreviewActive",void 0),e([_e()],Xe.prototype,"_cctPreviewActive",void 0),e([_e()],Xe.prototype,"_segmentSequencePreviewActive",void 0),e([_e()],Xe.prototype,"_sortPreferences",void 0),e([_e()],Xe.prototype,"_backendVersion",void 0),e([_e()],Xe.prototype,"_frontendVersion",void 0),e([_e()],Xe.prototype,"_localCurvature",void 0),e([_e()],Xe.prototype,"_applyingCurvature",void 0),Xe=e([ce("aqara-advanced-lighting-panel")],Xe);const Je="aqara-advanced-lighting-panel";customElements.get(Je)?console.log(`${Je} already registered`):console.log(`Registering ${Je}`),window.customPanel&&window.customPanel(Je)}();
