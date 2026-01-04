!function(){"use strict";function t(t,e,s,i){var n,o=arguments.length,r=o<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(t,e,s,i);else for(var a=t.length-1;a>=0;a--)(n=t[a])&&(r=(o<3?n(r):o>3?n(e,s,r):n(e,s))||r);return o>3&&r&&Object.defineProperty(e,s,r),r}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,s=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,i=Symbol(),n=new WeakMap;let o=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==i)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=n.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&n.set(e,t))}return t}toString(){return this.cssText}};const r=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,i))(e)})(t):t,{is:a,defineProperty:c,getOwnPropertyDescriptor:l,getOwnPropertyNames:h,getOwnPropertySymbols:d,getPrototypeOf:p}=Object,u=globalThis,_=u.trustedTypes,g=_?_.emptyScript:"",m=u.reactiveElementPolyfillSupport,v=(t,e)=>t,$={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},f=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:$,reflect:!1,useDefault:!1,hasChanged:f};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&c(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:n}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const o=i?.call(this);n?.call(this,e),this.requestUpdate(t,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const t=this.properties,e=[...h(t),...d(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(r(t))}else void 0!==t&&e.push(r(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,i)=>{if(s)t.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of i){const i=document.createElement("style"),n=e.litNonce;void 0!==n&&i.setAttribute("nonce",n),i.textContent=s.cssText,t.appendChild(i)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const n=(void 0!==s.converter?.toAttribute?s.converter:$).toAttribute(e,s.type);this._$Em=t,null==n?this.removeAttribute(i):this.setAttribute(i,n),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),n="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:$;this._$Em=i;const o=n.fromAttribute(e,t.type);this[i]=o??this._$Ej?.get(i)??o,this._$Em=null}}requestUpdate(t,e,s,i=!1,n){if(void 0!==t){const o=this.constructor;if(!1===i&&(n=this[t]),s??=o.getPropertyOptions(t),!((s.hasChanged??f)(n,e)||s.useDefault&&s.reflect&&n===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:n},o){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==n||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[v("elementProperties")]=new Map,b[v("finalized")]=new Map,m?.({ReactiveElement:b}),(u.reactiveElementVersions??=[]).push("2.1.2");const S=globalThis,A=t=>t,E=S.trustedTypes,w=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,x="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+C,q=`<${P}>`,T=document,k=()=>T.createComment(""),U=t=>null===t||"object"!=typeof t&&"function"!=typeof t,O=Array.isArray,M="[ \t\n\f\r]",H=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,R=/-->/g,N=/>/g,D=RegExp(`>|${M}(?:([^\\s"'>=/]+)(${M}*=${M}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),B=/'/g,I=/"/g,L=/^(?:script|style|textarea|title)$/i,j=(t=>(e,...s)=>({_$litType$:t,strings:e,values:s}))(1),z=Symbol.for("lit-noChange"),W=Symbol.for("lit-nothing"),V=new WeakMap,F=T.createTreeWalker(T,129);function J(t,e){if(!O(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==w?w.createHTML(e):e}const K=(t,e)=>{const s=t.length-1,i=[];let n,o=2===e?"<svg>":3===e?"<math>":"",r=H;for(let e=0;e<s;e++){const s=t[e];let a,c,l=-1,h=0;for(;h<s.length&&(r.lastIndex=h,c=r.exec(s),null!==c);)h=r.lastIndex,r===H?"!--"===c[1]?r=R:void 0!==c[1]?r=N:void 0!==c[2]?(L.test(c[2])&&(n=RegExp("</"+c[2],"g")),r=D):void 0!==c[3]&&(r=D):r===D?">"===c[0]?(r=n??H,l=-1):void 0===c[1]?l=-2:(l=r.lastIndex-c[2].length,a=c[1],r=void 0===c[3]?D:'"'===c[3]?I:B):r===I||r===B?r=D:r===R||r===N?r=H:(r=D,n=void 0);const d=r===D&&t[e+1].startsWith("/>")?" ":"";o+=r===H?s+q:l>=0?(i.push(a),s.slice(0,l)+x+s.slice(l)+C+d):s+C+(-2===l?e:d)}return[J(t,o+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class Y{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let n=0,o=0;const r=t.length-1,a=this.parts,[c,l]=K(t,e);if(this.el=Y.createElement(c,s),F.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=F.nextNode())&&a.length<r;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(x)){const e=l[o++],s=i.getAttribute(t).split(C),r=/([.?@])?(.*)/.exec(e);a.push({type:1,index:n,name:r[2],strings:s,ctor:"."===r[1]?tt:"?"===r[1]?et:"@"===r[1]?st:X}),i.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:n}),i.removeAttribute(t));if(L.test(i.tagName)){const t=i.textContent.split(C),e=t.length-1;if(e>0){i.textContent=E?E.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],k()),F.nextNode(),a.push({type:2,index:++n});i.append(t[e],k())}}}else if(8===i.nodeType)if(i.data===P)a.push({type:2,index:n});else{let t=-1;for(;-1!==(t=i.data.indexOf(C,t+1));)a.push({type:7,index:n}),t+=C.length-1}n++}}static createElement(t,e){const s=T.createElement("template");return s.innerHTML=t,s}}function Z(t,e,s=t,i){if(e===z)return e;let n=void 0!==i?s._$Co?.[i]:s._$Cl;const o=U(e)?void 0:e._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(t),n._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=n:s._$Cl=n),void 0!==n&&(e=Z(t,n._$AS(t,e.values),n,i)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??T).importNode(e,!0);F.currentNode=i;let n=F.nextNode(),o=0,r=0,a=s[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new G(n,n.nextSibling,this,t):1===a.type?e=new a.ctor(n,a.name,a.strings,this,t):6===a.type&&(e=new it(n,this,t)),this._$AV.push(e),a=s[++r]}o!==a?.index&&(n=F.nextNode(),o++)}return F.currentNode=T,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class G{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=W,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Z(this,t,e),U(t)?t===W||null==t||""===t?(this._$AH!==W&&this._$AR(),this._$AH=W):t!==this._$AH&&t!==z&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>O(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==W&&U(this._$AH)?this._$AA.nextSibling.data=t:this.T(T.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Y.createElement(J(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new Q(i,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new Y(t)),e}k(t){O(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const n of t)i===e.length?e.push(s=new G(this.O(k()),this.O(k()),this,this.options)):s=e[i],s._$AI(n),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class X{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,n){this.type=1,this._$AH=W,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=n,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=W}_$AI(t,e=this,s,i){const n=this.strings;let o=!1;if(void 0===n)t=Z(this,t,e,0),o=!U(t)||t!==this._$AH&&t!==z,o&&(this._$AH=t);else{const i=t;let r,a;for(t=n[0],r=0;r<n.length-1;r++)a=Z(this,i[s+r],e,r),a===z&&(a=this._$AH[r]),o||=!U(a)||a!==this._$AH[r],a===W?t=W:t!==W&&(t+=(a??"")+n[r+1]),this._$AH[r]=a}o&&!i&&this.j(t)}j(t){t===W?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends X{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===W?void 0:t}}class et extends X{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==W)}}class st extends X{constructor(t,e,s,i,n){super(t,e,s,i,n),this.type=5}_$AI(t,e=this){if((t=Z(this,t,e,0)??W)===z)return;const s=this._$AH,i=t===W&&s!==W||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,n=t!==W&&(s===W||i);i&&this.element.removeEventListener(this.name,this,s),n&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class it{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){Z(this,t)}}const nt=S.litHtmlPolyfillSupport;nt?.(Y,G),(S.litHtmlVersions??=[]).push("3.3.2");const ot=globalThis;class rt extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let n=i._$litPart$;if(void 0===n){const t=s?.renderBefore??null;i._$litPart$=n=new G(e.insertBefore(k(),t),t,void 0,s??{})}return n._$AI(t),n})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return z}}rt._$litElement$=!0,rt.finalized=!0,ot.litElementHydrateSupport?.({LitElement:rt});const at=ot.litElementPolyfillSupport;at?.({LitElement:rt}),(ot.litElementVersions??=[]).push("4.2.2");const ct={attribute:!0,type:String,converter:$,reflect:!1,hasChanged:f},lt=(t=ct,e,s)=>{const{kind:i,metadata:n}=s;let o=globalThis.litPropertyMetadata.get(n);if(void 0===o&&globalThis.litPropertyMetadata.set(n,o=new Map),"setter"===i&&((t=Object.create(t)).wrapped=!0),o.set(s.name,t),"accessor"===i){const{name:i}=s;return{set(s){const n=e.get.call(this);e.set.call(this,s),this.requestUpdate(i,n,t,!0,s)},init(e){return void 0!==e&&this.C(i,void 0,t,e),e}}}if("setter"===i){const{name:i}=s;return function(s){const n=this[i];e.call(this,s),this.requestUpdate(i,n,t,!0,s)}}throw Error("Unsupported decorator location: "+i)};function ht(t){return(e,s)=>"object"==typeof s?lt(t,e,s):((t,e,s)=>{const i=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),i?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}function dt(t){return ht({...t,state:!0,attribute:!1})}const pt=((t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]);return new o(s,t,i)})`
  :host {
    display: block;
    padding: 16px;
    background-color: var(--card-background-color, #fff);
    color: var(--primary-text-color, #000);
    font-family: var(--paper-font-body1_-_font-family);
    max-width: 1200px;
    margin: 0 auto;
  }

  .panel-header {
    margin-bottom: 24px;
  }

  .panel-title {
    font-size: 24px;
    font-weight: 500;
    margin: 0 0 8px 0;
    color: var(--primary-text-color);
  }

  .controls {
    background: var(--primary-background-color);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
  }

  .control-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .control-row:last-child {
    margin-bottom: 0;
  }

  .control-label {
    font-size: 14px;
    font-weight: 500;
    min-width: 80px;
    color: var(--secondary-text-color);
  }

  .control-input {
    flex: 1;
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

  .section {
    background: var(--primary-background-color);
    border-radius: 8px;
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
    font-size: 18px;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .section-subtitle {
    font-size: 12px;
    color: var(--secondary-text-color);
    margin-top: 4px;
  }

  .section-content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }

  .section-content.collapsed {
    display: none;
  }

  .preset-button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 12px;
    background: var(--card-background-color);
    border: 2px solid var(--divider-color);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    min-height: 80px;
  }

  .preset-button:hover {
    background: var(--primary-color);
    color: var(--text-primary-color);
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  .preset-button:active {
    transform: translateY(0);
  }

  .preset-button.disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .preset-button.disabled:hover {
    background: var(--card-background-color);
    color: var(--primary-text-color);
    border-color: var(--divider-color);
    transform: none;
    box-shadow: none;
  }

  .preset-name {
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    margin-top: 8px;
  }

  .preset-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preset-icon img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .preset-icon ha-icon {
    width: 100%;
    height: 100%;
  }

  .loading {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 40px;
    font-size: 16px;
    color: var(--secondary-text-color);
  }

  .error {
    background: var(--error-color);
    color: white;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .no-lights {
    text-align: center;
    padding: 40px;
    color: var(--secondary-text-color);
    font-size: 14px;
  }

  ha-entity-picker {
    display: block;
    width: 100%;
  }

  ha-slider {
    width: 100%;
  }

  @media (max-width: 600px) {
    :host {
      padding: 8px;
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
      font-size: 11px;
    }
  }
`;let ut=class extends rt{constructor(){super(...arguments),this.narrow=!1,this._loading=!0,this._selectedEntities=[],this._brightness=100,this._useCustomBrightness=!1,this._collapsed={},this._hasIncompatibleLights=!1}firstUpdated(){this._loadPresets()}updated(t){super.updated(t),t.has("hass")&&void 0===t.get("hass")&&this._loadPresets()}async _loadPresets(){try{const t=await fetch("/api/aqara_advanced_lighting/presets");if(!t.ok)throw new Error(`HTTP error ${t.status}`);this._presets=await t.json(),this._loading=!1}catch(t){this._error=t instanceof Error?t.message:"Failed to load presets",this._loading=!1}}_getSelectedDeviceTypes(){if(!this._selectedEntities.length||!this.hass)return this._hasIncompatibleLights=!1,[];const t=new Set;let e=!1;for(const s of this._selectedEntities){const i=this.hass.states[s];if(!i)continue;const n=i.attributes.effect_list;n&&Array.isArray(n)?n.includes("flow1")||n.includes("flow2")||n.includes("rolling")?t.add("t1m"):n.includes("rainbow1")||n.includes("rainbow2")||n.includes("chasing")||n.includes("flicker")||n.includes("dash")?t.add("t1_strip"):n.includes("candlelight")?t.add("t2_bulb"):e=!0:n||void 0===i.attributes.color_temp?e=!0:t.add("t2_cct")}return this._hasIncompatibleLights=e,Array.from(t)}_filterPresets(){const t=this._getSelectedDeviceTypes(),e=t.length>0,s=t.includes("t2_bulb"),i=t.includes("t1m"),n=t.includes("t1_strip");return{showDynamicEffects:e&&(s||i||n),showSegmentPatterns:e&&(i||n),showCCTSequences:e,showSegmentSequences:e&&(i||n),t2Presets:s&&this._presets?.dynamic_effects.t2_bulb||[],t1mPresets:i&&this._presets?.dynamic_effects.t1m||[],t1StripPresets:n&&this._presets?.dynamic_effects.t1_strip||[]}}_handleEntityChange(t){const e=t.detail.value;"string"==typeof e?this._selectedEntities=e?[e]:[]:Array.isArray(e)?this._selectedEntities=e:this._selectedEntities=[]}_handleBrightnessChange(t){this._brightness=t.detail.value}_handleCustomBrightnessToggle(t){this._useCustomBrightness=t.detail.value}_toggleSection(t){this._collapsed={...this._collapsed,[t]:!this._collapsed[t]}}async _activateDynamicEffect(t){if(!this._selectedEntities.length)return;const e={entity_id:this._selectedEntities,preset:t.id,turn_on:!0,sync:!0};this._useCustomBrightness&&(e.brightness=this._brightness),await this.hass.callService("aqara_advanced_lighting","set_dynamic_effect",e)}async _activateSegmentPattern(t){if(!this._selectedEntities.length)return;const e={entity_id:this._selectedEntities,preset:t.id,turn_on:!0,sync:!0};this._useCustomBrightness&&(e.brightness=this._brightness),await this.hass.callService("aqara_advanced_lighting","set_segment_pattern",e)}async _activateCCTSequence(t){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","start_cct_sequence",{entity_id:this._selectedEntities,preset:t.id,turn_on:!0,sync:!0})}async _activateSegmentSequence(t){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","start_segment_sequence",{entity_id:this._selectedEntities,preset:t.id,turn_on:!0,sync:!0})}async _stopEffect(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","stop_effect",{entity_id:this._selectedEntities,restore_state:!0})}async _pauseCCTSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","pause_cct_sequence",{entity_id:this._selectedEntities})}async _resumeCCTSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","resume_cct_sequence",{entity_id:this._selectedEntities})}async _stopCCTSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","stop_cct_sequence",{entity_id:this._selectedEntities})}async _pauseSegmentSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","pause_segment_sequence",{entity_id:this._selectedEntities})}async _resumeSegmentSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","resume_segment_sequence",{entity_id:this._selectedEntities})}async _stopSegmentSequence(){this._selectedEntities.length&&await this.hass.callService("aqara_advanced_lighting","stop_segment_sequence",{entity_id:this._selectedEntities})}render(){if(this._loading)return j`<div class="loading">Loading presets...</div>`;if(this._error)return j`<div class="error">Error: ${this._error}</div>`;if(!this._presets)return j`<div class="error">No presets available</div>`;const t=this._filterPresets(),e=this._selectedEntities.length>0;return j`
      <div class="panel-header">
        <h1 class="panel-title">Aqara Advanced Lighting</h1>
      </div>

      <div class="controls">
        <div class="control-row">
          <span class="control-label">Target</span>
          <div class="control-input">
            <ha-selector
              .hass=${this.hass}
              .selector=${{entity:{multiple:!0,filter:{domain:"light"}}}}
              .value=${this._selectedEntities}
              @value-changed=${this._handleEntityChange}
            ></ha-selector>
          </div>
        </div>

        <div class="control-row">
          <span class="control-label">Custom Brightness</span>
          <div class="control-input">
            <ha-selector
              .hass=${this.hass}
              .selector=${{boolean:{}}}
              .value=${this._useCustomBrightness}
              @value-changed=${this._handleCustomBrightnessToggle}
            ></ha-selector>
          </div>
        </div>

        ${this._useCustomBrightness?j`
              <div class="control-row">
                <span class="control-label">Brightness</span>
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

        ${e?j`
              <div class="control-row">
                <span class="control-label">Quick Controls</span>
                <div class="control-input control-buttons">
                  <ha-button @click=${this._stopEffect}>
                    <ha-icon icon="mdi:stop"></ha-icon>
                    Stop Effect
                  </ha-button>
                  <ha-button @click=${this._pauseCCTSequence}>
                    <ha-icon icon="mdi:pause"></ha-icon>
                    Pause CCT
                  </ha-button>
                  <ha-button @click=${this._resumeCCTSequence}>
                    <ha-icon icon="mdi:play"></ha-icon>
                    Resume CCT
                  </ha-button>
                  <ha-button @click=${this._stopCCTSequence}>
                    <ha-icon icon="mdi:stop"></ha-icon>
                    Stop CCT
                  </ha-button>
                  <ha-button @click=${this._pauseSegmentSequence}>
                    <ha-icon icon="mdi:pause"></ha-icon>
                    Pause Segment
                  </ha-button>
                  <ha-button @click=${this._resumeSegmentSequence}>
                    <ha-icon icon="mdi:play"></ha-icon>
                    Resume Segment
                  </ha-button>
                  <ha-button @click=${this._stopSegmentSequence}>
                    <ha-icon icon="mdi:stop"></ha-icon>
                    Stop Segment
                  </ha-button>
                </div>
              </div>
            `:""}
      </div>

      ${e?"":j`<div class="no-lights">Please select one or more lights to view available presets</div>`}

      ${this._hasIncompatibleLights?j`<div class="error">Incompatible light selected. Please select a compatible Aqara light (T1, T1M, T1 Strip, or T2 Bulb).</div>`:""}

      ${t.showDynamicEffects&&!this._hasIncompatibleLights?j`
            ${t.t2Presets.length>0?this._renderDynamicEffectsSection("T2 Bulb",t.t2Presets):""}
            ${t.t1mPresets.length>0?this._renderDynamicEffectsSection("T1M",t.t1mPresets):""}
            ${t.t1StripPresets.length>0?this._renderDynamicEffectsSection("T1 Strip",t.t1StripPresets):""}
          `:""}

      ${t.showSegmentPatterns&&this._presets.segment_patterns.length>0&&!this._hasIncompatibleLights?this._renderSegmentPatternsSection():""}

      ${t.showCCTSequences&&this._presets.cct_sequences.length>0&&!this._hasIncompatibleLights?this._renderCCTSequencesSection():""}

      ${t.showSegmentSequences&&this._presets.segment_sequences.length>0&&!this._hasIncompatibleLights?this._renderSegmentSequencesSection():""}
    `}_renderDynamicEffectsSection(t,e){const s=`dynamic_${t.toLowerCase().replace(/\s+/g,"_")}`,i=this._collapsed[s];return j`
      <div class="section">
        <div class="section-header" @click=${()=>this._toggleSection(s)}>
          <div>
            <div class="section-title">Dynamic Effects: ${t}</div>
            <div class="section-subtitle">${e.length} presets</div>
          </div>
          <ha-icon .icon=${i?"mdi:chevron-down":"mdi:chevron-up"}></ha-icon>
        </div>
        <div class="section-content ${i?"collapsed":""}">
          ${e.map(t=>j`
              <div class="preset-button" @click=${()=>this._activateDynamicEffect(t)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(t.icon,"mdi:lightbulb-on")}
                </div>
                <div class="preset-name">${t.name}</div>
              </div>
            `)}
        </div>
      </div>
    `}_renderSegmentPatternsSection(){const t="segment_patterns",e=this._collapsed[t];return j`
      <div class="section">
        <div class="section-header" @click=${()=>this._toggleSection(t)}>
          <div>
            <div class="section-title">Segment Patterns</div>
            <div class="section-subtitle">${this._presets.segment_patterns.length} presets</div>
          </div>
          <ha-icon .icon=${e?"mdi:chevron-down":"mdi:chevron-up"}></ha-icon>
        </div>
        <div class="section-content ${e?"collapsed":""}">
          ${this._presets.segment_patterns.map(t=>j`
              <div class="preset-button" @click=${()=>this._activateSegmentPattern(t)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(t.icon,"mdi:palette")}
                </div>
                <div class="preset-name">${t.name}</div>
              </div>
            `)}
        </div>
      </div>
    `}_renderPresetIcon(t,e){return t?t.includes(".")?j`<img src="/api/aqara_advanced_lighting/icons/${t}" alt="preset icon" />`:j`<ha-icon icon="${t}"></ha-icon>`:j`<ha-icon icon="${e}"></ha-icon>`}_renderCCTSequencesSection(){const t="cct_sequences",e=this._collapsed[t];return j`
      <div class="section">
        <div class="section-header" @click=${()=>this._toggleSection(t)}>
          <div>
            <div class="section-title">CCT Sequences</div>
            <div class="section-subtitle">${this._presets.cct_sequences.length} presets</div>
          </div>
          <ha-icon .icon=${e?"mdi:chevron-down":"mdi:chevron-up"}></ha-icon>
        </div>
        <div class="section-content ${e?"collapsed":""}">
          ${this._presets.cct_sequences.map(t=>j`
              <div class="preset-button" @click=${()=>this._activateCCTSequence(t)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(t.icon,"mdi:temperature-kelvin")}
                </div>
                <div class="preset-name">${t.name}</div>
              </div>
            `)}
        </div>
      </div>
    `}_renderSegmentSequencesSection(){const t="segment_sequences",e=this._collapsed[t];return j`
      <div class="section">
        <div class="section-header" @click=${()=>this._toggleSection(t)}>
          <div>
            <div class="section-title">Segment Sequences</div>
            <div class="section-subtitle">${this._presets.segment_sequences.length} presets</div>
          </div>
          <ha-icon .icon=${e?"mdi:chevron-down":"mdi:chevron-up"}></ha-icon>
        </div>
        <div class="section-content ${e?"collapsed":""}">
          ${this._presets.segment_sequences.map(t=>j`
              <div class="preset-button" @click=${()=>this._activateSegmentSequence(t)}>
                <div class="preset-icon">
                  ${this._renderPresetIcon(t.icon,"mdi:animation-play")}
                </div>
                <div class="preset-name">${t.name}</div>
              </div>
            `)}
        </div>
      </div>
    `}};ut.styles=pt,t([ht({attribute:!1})],ut.prototype,"hass",void 0),t([ht({type:Boolean})],ut.prototype,"narrow",void 0),t([dt()],ut.prototype,"_presets",void 0),t([dt()],ut.prototype,"_loading",void 0),t([dt()],ut.prototype,"_error",void 0),t([dt()],ut.prototype,"_selectedEntities",void 0),t([dt()],ut.prototype,"_brightness",void 0),t([dt()],ut.prototype,"_useCustomBrightness",void 0),t([dt()],ut.prototype,"_collapsed",void 0),t([dt()],ut.prototype,"_hasIncompatibleLights",void 0),ut=t([(t=>(e,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})("aqara-advanced-lighting-panel")],ut);const _t="aqara-advanced-lighting-panel";customElements.get(_t)?console.log(`${_t} already registered`):console.log(`Registering ${_t}`),window.customPanel&&window.customPanel(_t)}();
