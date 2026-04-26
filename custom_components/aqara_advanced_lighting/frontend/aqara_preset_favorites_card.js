!function(){"use strict";function e(e,t,i,s){var n,o=arguments.length,r=o<3?t:null===s?s=Object.getOwnPropertyDescriptor(t,i):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)r=Reflect.decorate(e,t,i,s);else for(var a=e.length-1;a>=0;a--)(n=e[a])&&(r=(o<3?n(r):o>3?n(t,i,r):n(t,i))||r);return o>3&&r&&Object.defineProperty(t,i,r),r}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,i=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),n=new WeakMap;let o=class{constructor(e,t,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(i&&void 0===e){const i=void 0!==t&&1===t.length;i&&(e=n.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),i&&n.set(t,e))}return e}toString(){return this.cssText}};const r=(e,...t)=>{const i=1===e.length?e[0]:t.reduce((t,i,s)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(i)+e[s+1],e[0]);return new o(i,e,s)},a=i?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const i of e.cssRules)t+=i.cssText;return(e=>new o("string"==typeof e?e:e+"",void 0,s))(t)})(e):e,{is:c,defineProperty:d,getOwnPropertyDescriptor:l,getOwnPropertyNames:h,getOwnPropertySymbols:u,getPrototypeOf:p}=Object,_=globalThis,f=_.trustedTypes,g=f?f.emptyScript:"",m=_.reactiveElementPolyfillSupport,v=(e,t)=>e,y={toAttribute(e,t){switch(t){case Boolean:e=e?g:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let i=e;switch(t){case Boolean:i=null!==e;break;case Number:i=null===e?null:Number(e);break;case Object:case Array:try{i=JSON.parse(e)}catch(e){i=null}}return i}},$=(e,t)=>!c(e,t),b={attribute:!0,type:String,converter:y,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),_.litPropertyMetadata??=new WeakMap;let x=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=b){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const i=Symbol(),s=this.getPropertyDescriptor(e,i,t);void 0!==s&&d(this.prototype,e,s)}}static getPropertyDescriptor(e,t,i){const{get:s,set:n}=l(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:s,set(t){const o=s?.call(this);n?.call(this,t),this.requestUpdate(e,o,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??b}static _$Ei(){if(this.hasOwnProperty(v("elementProperties")))return;const e=p(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(v("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(v("properties"))){const e=this.properties,t=[...h(e),...u(e)];for(const i of t)this.createProperty(i,e[i])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,i]of t)this.elementProperties.set(e,i)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const i=this._$Eu(e,t);void 0!==i&&this._$Eh.set(i,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const i=new Set(e.flat(1/0).reverse());for(const e of i)t.unshift(a(e))}else void 0!==e&&t.push(a(e));return t}static _$Eu(e,t){const i=t.attribute;return!1===i?void 0:"string"==typeof i?i:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const i of t.keys())this.hasOwnProperty(i)&&(e.set(i,this[i]),delete this[i]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,s)=>{if(i)e.adoptedStyleSheets=s.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const i of s){const s=document.createElement("style"),n=t.litNonce;void 0!==n&&s.setAttribute("nonce",n),s.textContent=i.cssText,e.appendChild(s)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,i){this._$AK(e,i)}_$ET(e,t){const i=this.constructor.elementProperties.get(e),s=this.constructor._$Eu(e,i);if(void 0!==s&&!0===i.reflect){const n=(void 0!==i.converter?.toAttribute?i.converter:y).toAttribute(t,i.type);this._$Em=e,null==n?this.removeAttribute(s):this.setAttribute(s,n),this._$Em=null}}_$AK(e,t){const i=this.constructor,s=i._$Eh.get(e);if(void 0!==s&&this._$Em!==s){const e=i.getPropertyOptions(s),n="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:y;this._$Em=s;const o=n.fromAttribute(t,e.type);this[s]=o??this._$Ej?.get(s)??o,this._$Em=null}}requestUpdate(e,t,i,s=!1,n){if(void 0!==e){const o=this.constructor;if(!1===s&&(n=this[e]),i??=o.getPropertyOptions(e),!((i.hasChanged??$)(n,t)||i.useDefault&&i.reflect&&n===this._$Ej?.get(e)&&!this.hasAttribute(o._$Eu(e,i))))return;this.C(e,t,i)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:i,reflect:s,wrapped:n},o){i&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,o??t??this[e]),!0!==n||void 0!==o)||(this._$AL.has(e)||(this.hasUpdated||i||(t=void 0),this._$AL.set(e,t)),!0===s&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,i]of e){const{wrapped:e}=i,s=this[t];!0!==e||this._$AL.has(t)||void 0===s||this.C(t,void 0,i,s)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};x.elementStyles=[],x.shadowRootOptions={mode:"open"},x[v("elementProperties")]=new Map,x[v("finalized")]=new Map,m?.({ReactiveElement:x}),(_.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,A=e=>e,E=w.trustedTypes,S=E?E.createPolicy("lit-html",{createHTML:e=>e}):void 0,M="$lit$",O=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+O,P=`<${C}>`,q=document,k=()=>q.createComment(""),T=e=>null===e||"object"!=typeof e&&"function"!=typeof e,R=Array.isArray,z="[ \t\n\f\r]",D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,U=/-->/g,j=/>/g,N=RegExp(`>|${z}(?:([^\\s"'>=/]+)(${z}*=${z}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),H=/'/g,I=/"/g,B=/^(?:script|style|textarea|title)$/i,L=(e=>(t,...i)=>({_$litType$:e,strings:t,values:i}))(1),F=Symbol.for("lit-noChange"),G=Symbol.for("lit-nothing"),V=new WeakMap,W=q.createTreeWalker(q,129);function Z(e,t){if(!R(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(t):t}const J=(e,t)=>{const i=e.length-1,s=[];let n,o=2===t?"<svg>":3===t?"<math>":"",r=D;for(let t=0;t<i;t++){const i=e[t];let a,c,d=-1,l=0;for(;l<i.length&&(r.lastIndex=l,c=r.exec(i),null!==c);)l=r.lastIndex,r===D?"!--"===c[1]?r=U:void 0!==c[1]?r=j:void 0!==c[2]?(B.test(c[2])&&(n=RegExp("</"+c[2],"g")),r=N):void 0!==c[3]&&(r=N):r===N?">"===c[0]?(r=n??D,d=-1):void 0===c[1]?d=-2:(d=r.lastIndex-c[2].length,a=c[1],r=void 0===c[3]?N:'"'===c[3]?I:H):r===I||r===H?r=N:r===U||r===j?r=D:(r=N,n=void 0);const h=r===N&&e[t+1].startsWith("/>")?" ":"";o+=r===D?i+P:d>=0?(s.push(a),i.slice(0,d)+M+i.slice(d)+O+h):i+O+(-2===d?t:h)}return[Z(e,o+(e[i]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),s]};class K{constructor({strings:e,_$litType$:t},i){let s;this.parts=[];let n=0,o=0;const r=e.length-1,a=this.parts,[c,d]=J(e,t);if(this.el=K.createElement(c,i),W.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(s=W.nextNode())&&a.length<r;){if(1===s.nodeType){if(s.hasAttributes())for(const e of s.getAttributeNames())if(e.endsWith(M)){const t=d[o++],i=s.getAttribute(e).split(O),r=/([.?@])?(.*)/.exec(t);a.push({type:1,index:n,name:r[2],strings:i,ctor:"."===r[1]?te:"?"===r[1]?ie:"@"===r[1]?se:ee}),s.removeAttribute(e)}else e.startsWith(O)&&(a.push({type:6,index:n}),s.removeAttribute(e));if(B.test(s.tagName)){const e=s.textContent.split(O),t=e.length-1;if(t>0){s.textContent=E?E.emptyScript:"";for(let i=0;i<t;i++)s.append(e[i],k()),W.nextNode(),a.push({type:2,index:++n});s.append(e[t],k())}}}else if(8===s.nodeType)if(s.data===C)a.push({type:2,index:n});else{let e=-1;for(;-1!==(e=s.data.indexOf(O,e+1));)a.push({type:7,index:n}),e+=O.length-1}n++}}static createElement(e,t){const i=q.createElement("template");return i.innerHTML=e,i}}function Y(e,t,i=e,s){if(t===F)return t;let n=void 0!==s?i._$Co?.[s]:i._$Cl;const o=T(t)?void 0:t._$litDirective$;return n?.constructor!==o&&(n?._$AO?.(!1),void 0===o?n=void 0:(n=new o(e),n._$AT(e,i,s)),void 0!==s?(i._$Co??=[])[s]=n:i._$Cl=n),void 0!==n&&(t=Y(e,n._$AS(e,t.values),n,s)),t}let Q=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:i}=this._$AD,s=(e?.creationScope??q).importNode(t,!0);W.currentNode=s;let n=W.nextNode(),o=0,r=0,a=i[0];for(;void 0!==a;){if(o===a.index){let t;2===a.type?t=new X(n,n.nextSibling,this,e):1===a.type?t=new a.ctor(n,a.name,a.strings,this,e):6===a.type&&(t=new ne(n,this,e)),this._$AV.push(t),a=i[++r]}o!==a?.index&&(n=W.nextNode(),o++)}return W.currentNode=q,s}p(e){let t=0;for(const i of this._$AV)void 0!==i&&(void 0!==i.strings?(i._$AI(e,i,t),t+=i.strings.length-2):i._$AI(e[t])),t++}};class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,i,s){this.type=2,this._$AH=G,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=i,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=Y(this,e,t),T(e)?e===G||null==e||""===e?(this._$AH!==G&&this._$AR(),this._$AH=G):e!==this._$AH&&e!==F&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>R(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==G&&T(this._$AH)?this._$AA.nextSibling.data=e:this.T(q.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:i}=e,s="number"==typeof i?this._$AC(e):(void 0===i.el&&(i.el=K.createElement(Z(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===s)this._$AH.p(t);else{const e=new Q(s,this),i=e.u(this.options);e.p(t),this.T(i),this._$AH=e}}_$AC(e){let t=V.get(e.strings);return void 0===t&&V.set(e.strings,t=new K(e)),t}k(e){R(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let i,s=0;for(const n of e)s===t.length?t.push(i=new X(this.O(k()),this.O(k()),this,this.options)):i=t[s],i._$AI(n),s++;s<t.length&&(this._$AR(i&&i._$AB.nextSibling,s),t.length=s)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=A(e).nextSibling;A(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class ee{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,i,s,n){this.type=1,this._$AH=G,this._$AN=void 0,this.element=e,this.name=t,this._$AM=s,this.options=n,i.length>2||""!==i[0]||""!==i[1]?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=G}_$AI(e,t=this,i,s){const n=this.strings;let o=!1;if(void 0===n)e=Y(this,e,t,0),o=!T(e)||e!==this._$AH&&e!==F,o&&(this._$AH=e);else{const s=e;let r,a;for(e=n[0],r=0;r<n.length-1;r++)a=Y(this,s[i+r],t,r),a===F&&(a=this._$AH[r]),o||=!T(a)||a!==this._$AH[r],a===G?e=G:e!==G&&(e+=(a??"")+n[r+1]),this._$AH[r]=a}o&&!s&&this.j(e)}j(e){e===G?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class te extends ee{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===G?void 0:e}}class ie extends ee{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==G)}}class se extends ee{constructor(e,t,i,s,n){super(e,t,i,s,n),this.type=5}_$AI(e,t=this){if((e=Y(this,e,t,0)??G)===F)return;const i=this._$AH,s=e===G&&i!==G||e.capture!==i.capture||e.once!==i.once||e.passive!==i.passive,n=e!==G&&(i===G||s);s&&this.element.removeEventListener(this.name,this,i),n&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ne{constructor(e,t,i){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(e){Y(this,e)}}const oe=w.litHtmlPolyfillSupport;oe?.(K,X),(w.litHtmlVersions??=[]).push("3.3.2");const re=globalThis;let ae=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,i)=>{const s=i?.renderBefore??t;let n=s._$litPart$;if(void 0===n){const e=i?.renderBefore??null;s._$litPart$=n=new X(t.insertBefore(k(),e),e,void 0,i??{})}return n._$AI(e),n})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return F}};ae._$litElement$=!0,ae.finalized=!0,re.litElementHydrateSupport?.({LitElement:ae});const ce=re.litElementPolyfillSupport;ce?.({LitElement:ae}),(re.litElementVersions??=[]).push("4.2.2");const de=e=>(t,i)=>{void 0!==i?i.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},le={attribute:!0,type:String,converter:y,reflect:!1,hasChanged:$},he=(e=le,t,i)=>{const{kind:s,metadata:n}=i;let o=globalThis.litPropertyMetadata.get(n);if(void 0===o&&globalThis.litPropertyMetadata.set(n,o=new Map),"setter"===s&&((e=Object.create(e)).wrapped=!0),o.set(i.name,e),"accessor"===s){const{name:s}=i;return{set(i){const n=t.get.call(this);t.set.call(this,i),this.requestUpdate(s,n,e,!0,i)},init(t){return void 0!==t&&this.C(s,void 0,e,t),t}}}if("setter"===s){const{name:s}=i;return function(i){const n=this[s];t.call(this,i),this.requestUpdate(s,n,e,!0,i)}}throw Error("Unsupported decorator location: "+s)};function ue(e){return(t,i)=>"object"==typeof i?he(e,t,i):((e,t,i)=>{const s=t.hasOwnProperty(i);return t.constructor.createProperty(i,e),s?Object.getOwnPropertyDescriptor(t,i):void 0})(e,t,i)}function pe(e){return ue({...e,state:!0,attribute:!1})}const _e={card:{name:"Aqara Advanced Lighting Presets",description:"Displays and activates your favorited Aqara Advanced Lighting presets for a specific entity.",default_title:"Favorite Presets",error_loading:"Failed to load preset data",empty_no_favorites:"No compatible favorites for this device",editor:{entities_label:"Entities",title_label:"Title",columns_label:"Columns (0 = auto)",compact_label:"Compact mode",show_names_label:"Show preset names",highlight_user_label:"Highlight user presets"}}};let fe;function ge(e){return fe??(fe=!!customElements.get("ha-input"))?L`
      <ha-input
        .label=${e.label??""}
        .value=${e.value??""}
        .hint=${e.hint??""}
        type=${e.type??G}
        min=${e.min??G}
        max=${e.max??G}
        class=${e.className??G}
        style=${e.style??G}
        @change=${e.onChange??G}
        @input=${e.onInput??G}
      ></ha-input>
    `:L`
    <ha-textfield
      .label=${e.label??""}
      .value=${e.value??""}
      .helper=${e.hint??""}
      .helperPersistent=${!!e.hint}
      type=${e.type??G}
      min=${e.min??G}
      max=${e.max??G}
      class=${e.className??G}
      style=${e.style??G}
      @change=${e.onChange??G}
      @input=${e.onInput??G}
    ></ha-textfield>
  `}function me(e,t,i){if(0===t.length)return"cct_sequence"===e.type||"dynamic_scene"===e.type;const s=function(e){const t=e.length>0,i=e.includes("t2_bulb"),s=e.includes("t2_cct"),n=e.includes("t1m"),o=e.includes("t1m_white"),r=e.includes("t1_strip"),a=e.includes("generic_rgb"),c=e.includes("generic_cct");return{showDynamicEffects:t&&(i||n||r),showSegmentPatterns:t&&(n||r),showSegmentSequences:t&&(n||r),showCCTSequences:t&&(i||s||o||r||a||c),showDynamicScenes:t&&(i||s||n||o||r||a||c),showMusicSync:t&&r,hasT2:i,hasT1M:n,hasT1Strip:r,t2Presets:[],t1mPresets:[],t1StripPresets:[]}}(t),n=e=>{if(!e)return!0;switch(e){case"t2_bulb":return s.hasT2;case"t1m":case"t1":return s.hasT1M;case"t1_strip":return s.hasT1Strip;default:return!0}};switch(e.type){case"effect":return s.showDynamicEffects&&n(i);case"segment_pattern":return s.showSegmentPatterns&&n(i);case"cct_sequence":return s.showCCTSequences;case"segment_sequence":return s.showSegmentSequences&&n(i);case"dynamic_scene":return s.showDynamicScenes;default:return!1}}r`
  :host {
    display: block;
  }

  /* Fix ha-svg-icon vertical misalignment inside ha-icon-button.
   * ha-svg-icon sets vertical-align: middle in its shadow DOM.
   * Making ha-icon a flex container neutralizes this. */
  ha-icon-button > ha-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  ${r`
  /* Editor-content wrapper used by all standalone editors */
  .editor-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
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

  .form-row-pair .form-field .form-label {
    min-width: unset;
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
    font-size: var(--ha-font-size-m, 14px);
    font-weight: var(--ha-font-weight-medium, 500);
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

  .form-hint {
    font-size: var(--ha-font-size-s, 12px);
    color: var(--secondary-text-color);
    margin-top: -4px;
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    align-items: center;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--divider-color);
  }

  .form-actions-left {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-right: auto;
  }

  .unsaved-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--ha-font-size-s, 12px);
    color: var(--warning-color);
    white-space: nowrap;
  }

  .unsaved-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--warning-color);
    flex-shrink: 0;
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

  .icon-field-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon-field-row ha-selector {
    flex: 1;
  }

  .icon-clear-btn {
    --ha-icon-button-size: 32px;
    --mdc-icon-button-size: 32px;
    --mdc-icon-size: 18px;
    color: var(--secondary-text-color);
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

  /* Two-column row for audio override controls, stacks on mobile */
  .audio-override-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 0 16px 8px;
  }

  .audio-dropdowns-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 0 16px 8px;
  }

  .audio-sliders-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    padding: 0 16px 8px;
  }

  .audio-toggles-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 0 16px 8px;
  }

  .audio-toggles-grid .form-section {
    align-items: flex-start;
    margin-bottom: 0;
  }

  /* Responsive form */
  @media (max-width: 600px) {
    .form-row {
      flex-direction: column;
      align-items: stretch;
    }

    .form-row-pair,
    .form-row-triple {
      grid-template-columns: 1fr;
    }

    .audio-override-row {
      grid-template-columns: 1fr;
    }

    .audio-dropdowns-grid {
      grid-template-columns: 1fr;
    }

    .audio-sliders-row {
      grid-template-columns: 1fr;
    }

    .audio-toggles-grid {
      grid-template-columns: 1fr 1fr;
    }

    .form-label {
      min-width: unset;
      margin-bottom: 4px;
    }

    .form-actions .btn-text {
      display: none;
    }

    .form-actions {
      gap: 8px;
    }
  }
`}
`;const ve=2;class ye{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,i){this._$Ct=e,this._$AM=t,this._$Ci=i}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}}class $e extends ye{constructor(e){if(super(e),this.it=G,e.type!==ve)throw Error(this.constructor.directiveName+"() can only be used in child bindings")}render(e){if(e===G||null==e)return this._t=void 0,this.it=e;if(e===F)return e;if("string"!=typeof e)throw Error(this.constructor.directiveName+"() called with a non-string value");if(e===this.it)return this._t;this.it=e;const t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}}$e.directiveName="unsafeHTML",$e.resultType=1;const be=(e=>(...t)=>({_$litDirective$:e,values:t}))($e);function xe(e,t,i=255){if(0===t)return{r:0,g:0,b:0};const s=1/t*e,n=1/t*(1-e-t);let o=3.2406*s-1.5372+-.4986*n,r=-.9689*s+1.8758+.0415*n,a=.0557*s-.204+1.057*n;const c=Math.max(o,r,a);c>1&&(o/=c,r/=c,a/=c),o=Math.max(0,o),r=Math.max(0,r),a=Math.max(0,a),o=o<=.0031308?12.92*o:1.055*Math.pow(o,1/2.4)-.055,r=r<=.0031308?12.92*r:1.055*Math.pow(r,1/2.4)-.055,a=a<=.0031308?12.92*a:1.055*Math.pow(a,1/2.4)-.055;const d=i/255;return{r:Math.max(0,Math.min(255,Math.round(255*o*d))),g:Math.max(0,Math.min(255,Math.round(255*r*d))),b:Math.max(0,Math.min(255,Math.round(255*a*d)))}}function we(e){const t=e=>e.toString(16).padStart(2,"0");return`#${t(e.r)}${t(e.g)}${t(e.b)}`}function Ae(e,t=255){return we(xe(e.x,e.y,t))}const Ee=200,Se=200,Me=180;function Oe(e,t){const i=(e-90)*Math.PI/180;return[Math.round(100*(Ee+t*Math.cos(i)))/100,Math.round(100*(Se+t*Math.sin(i)))/100]}function Ce(e,t,i){if(t-e>=360)return`<circle cx="200" cy="200" r="180" fill="${i}" />`;const[s,n]=Oe(e,Me),[o,r]=Oe(t,Me);return`<path fill="${i}" stroke="${i}" stroke-width="1" d="M200,200 L${s},${n} A180,180 0 ${t-e>180?1:0},1 ${o},${r} Z" />`}function Pe(e){const t=Math.round(e.brightness_pct/100*255);return we(xe(e.x,e.y,t))}const qe=new Map;function ke(e){if(e.length<=8)return e;const t=[];for(let i=0;i<8;i++){const s=Math.round(i/8*e.length)%e.length;t.push({hex:e[s].hex,startDeg:45*i,endDeg:45*(i+1)})}return t}function Te(e){return we(function(e){const t=e/100;let i,s,n;return t<=66?i=255:(i=329.698727446*Math.pow(t-60,-.1332047592),i=Math.max(0,Math.min(255,i))),s=t<=66?99.4708025861*Math.log(t)-161.1195681661:288.1221695283*Math.pow(t-60,-.0755148492),s=Math.max(0,Math.min(255,s)),t>=66?n=255:t<=19?n=0:(n=138.5177312231*Math.log(t-10)-305.0447927307,n=Math.max(0,Math.min(255,n))),{r:Math.round(i),g:Math.round(s),b:Math.round(n)}}(e))}function Re(e){return`<svg viewBox="20 20 360 360" xmlns="http://www.w3.org/2000/svg">${e}</svg>`}function ze(e){if(!e.segments||0===e.segments.length)return null;const t=function(e){if(0===e.length)return[];const t="seg:"+e.map(e=>`${e.segment}:${e.color.r},${e.color.g},${e.color.b}`).join("|"),i=qe.get(t);if(i)return i;const s=[...e].sort((e,t)=>("number"==typeof e.segment?e.segment:parseInt(e.segment,10))-("number"==typeof t.segment?t.segment:parseInt(t.segment,10))),n=360/s.length,o=[];let r=we(s[0].color),a=0;for(let e=1;e<s.length;e++){const t=we(s[e].color);t!==r&&(o.push({hex:r,startDeg:a,endDeg:e*n}),r=t,a=e*n)}o.push({hex:r,startDeg:a,endDeg:360});const c=ke(o);if(qe.size>=64){const e=qe.keys().next().value;void 0!==e&&qe.delete(e)}return qe.set(t,c),c}(e.segments),i=t.map(e=>Ce(e.startDeg,e.endDeg,e.hex)).join("");return L`${be(Re(i))}`}function De(e){if(!e.steps||0===e.steps.length)return null;const t=e.steps[0];let i=[];if(t.segment_colors&&t.segment_colors.length>0?i=t.segment_colors.map(e=>we(e.color)):t.colors&&t.colors.length>0&&(i=t.colors.map(e=>we({r:e[0]??0,g:e[1]??0,b:e[2]??0}))),0===i.length)return null;const s=function(e){if(0===e.length)return[];const t="hex:"+e.join("|"),i=qe.get(t);if(i)return i;const s=360/e.length,n=[];let o=e[0],r=0;for(let t=1;t<e.length;t++)e[t]!==o&&(n.push({hex:o,startDeg:r,endDeg:t*s}),o=e[t],r=t*s);n.push({hex:o,startDeg:r,endDeg:360});const a=ke(n);if(qe.size>=64){const e=qe.keys().next().value;void 0!==e&&qe.delete(e)}return qe.set(t,a),a}(i);if(1===s.length)return L`${be(Re(`<circle cx="200" cy="200" r="180" fill="${s[0].hex}" />`))}`;const n=s.map(e=>Ce(e.startDeg,e.endDeg,e.hex)).join("");return L`${be(Re(n))}`}function Ue(e){const t=e.match(/^(\d{1,2}):(\d{2})$/);if(t)return 60*parseInt(t[1],10)+parseInt(t[2],10);const i=e.match(/^(sunrise|sunset)([+-]\d+)?$/);if(i){return("sunrise"===i[1]?360:1080)+(i[2]?parseInt(i[2],10):0)}return 0}function je(e){if("solar"===e.mode)return function(e){const t=e.solar_steps??[];if(0===t.length)return null;const i=function(e){const t=e.filter(e=>"rising"===e.phase).sort((e,t)=>e.sun_elevation-t.sun_elevation),i=e.filter(e=>"any"===e.phase).sort((e,t)=>e.sun_elevation-t.sun_elevation),s=e.filter(e=>"setting"===e.phase).sort((e,t)=>t.sun_elevation-e.sun_elevation);return[...t,...i,...s]}(t),s=i.map(e=>e.color_temp),n='<line x1="20" y1="200" x2="380" y2="200" stroke="var(--secondary-text-color, #888)" stroke-width="2" stroke-opacity="0.3" />';if(1===s.length){const e=Te(s[0]);return L`${be(Re(`<circle cx="200" cy="200" r="180" fill="${e}" />${n}`))}`}const o=`solar-${e.id}`,r=`solar-clip-${e.id}`,a=s.map((e,t)=>`<stop offset="${Math.round(t/(s.length-1)*100)}%" stop-color="${Te(e)}" />`).join("");return L`${be(Re(`<defs><clipPath id="${r}"><circle cx="200" cy="200" r="180" /></clipPath><linearGradient id="${o}" x1="0" y1="0" x2="1" y2="0">${a}</linearGradient></defs><rect fill="url(#${o})" x="0" y="0" width="400" height="400" clip-path="url(#${r})" />`+n))}`}(e);if("schedule"===e.mode)return function(e){const t=e.schedule_steps??[];if(0===t.length)return null;const i=[...t].sort((e,t)=>Ue(e.time)-Ue(t.time)),s=i.map(e=>e.color_temp);if(1===s.length){const e=Te(s[0]);return L`${be(Re(`<circle cx="200" cy="200" r="180" fill="${e}" />`))}`}const n=i.map(e=>Ue(e.time)),o=n[0],r=n[n.length-1]-o,a=`sched-${e.id}`,c=`sched-clip-${e.id}`,d=s.map((e,t)=>`<stop offset="${r>0?Math.round((n[t]-o)/r*100):Math.round(t/(s.length-1)*100)}%" stop-color="${Te(e)}" />`).join("");return L`${be(Re(`<defs><clipPath id="${c}"><circle cx="200" cy="200" r="180" /></clipPath><linearGradient id="${a}" x1="0" y1="0" x2="0" y2="1">${d}</linearGradient></defs><rect fill="url(#${a})" x="0" y="0" width="400" height="400" clip-path="url(#${c})" />`))}`}(e);const t=(e.steps??[]).map(e=>e.color_temp).filter(e=>null!=e);if(0===t.length)return null;if(1===t.length){const e=Te(t[0]);return L`${be(Re(`<circle cx="200" cy="200" r="180" fill="${e}" />`))}`}const i=`cct-${e.id}`,s=`cct-clip-${e.id}`,n=t.map((e,i)=>`<stop offset="${Math.round(i/(t.length-1)*100)}%" stop-color="${Te(e)}" />`).join("");return L`${be(Re(`<defs><clipPath id="${s}"><circle cx="200" cy="200" r="180" /></clipPath><linearGradient id="${i}" x1="0" y1="0" x2="1" y2="0">${n}</linearGradient></defs><rect fill="url(#${i})" x="0" y="0" width="400" height="400" clip-path="url(#${s})" />`))}`}function Ne(e){const t=xe(e.x,e.y,255),i=function(e,t,i){const s=e/255,n=t/255,o=i/255,r=Math.max(s,n,o),a=r-Math.min(s,n,o);let c=0,d=0;return 0!==r&&(d=a/r*100),0!==a&&(c=r===s?(n-o)/a%6:r===n?(o-s)/a+2:(s-n)/a+4,c=Math.round(60*c),c<0&&(c+=360)),{h:c,s:Math.round(d)}}(t.r,t.g,t.b);return 0===i.s?360:i.h}function He(e){if(!Array.isArray(e)&&e.thumbnail){const t=e.thumbnail;return L`<img
      src="/api/aqara_advanced_lighting/thumbnails/${t}"
      alt="Preset thumbnail"
      style="object-fit:cover"
    />`}let t,i;if(Array.isArray(e)?(t=e.slice(0,8),i=`ds-${t.map(e=>`${e.x}${e.y}`).join("")}`):(t=(e.colors??[]).slice(0,8),i=`ds-${e.id}`),0===t.length)return null;if(1===t.length){const e=Pe(t[0]);return L`${be(Re(`<circle cx="200" cy="200" r="180" fill="${e}" />`))}`}const s=[...t].sort((e,t)=>Ne(e)-Ne(t)),n=`${i}-clip`,o=s.map((e,t)=>`<stop offset="${Math.round(t/(s.length-1)*100)}%" stop-color="${Pe(e)}" />`).join("");return L`${be(Re(`<defs><clipPath id="${n}"><circle cx="200" cy="200" r="180" /></clipPath><linearGradient id="${i}" x1="0" y1="0" x2="1" y2="1">${o}</linearGradient></defs><rect fill="url(#${i})" x="0" y="0" width="400" height="400" clip-path="url(#${n})" />`))}`}function Ie(e,t){return e?e.includes(".")?L`<img src="/api/aqara_advanced_lighting/icons/${e}" alt="preset icon" />`:L`<ha-icon icon="${e}"></ha-icon>`:L`<ha-icon icon="${t}"></ha-icon>`}const Be=L`<span class="audio-badge"><ha-icon icon="mdi:waveform"></ha-icon></span>`,Le=(e,t)=>t?L`${e}${Be}`:e;function Fe(e){const t=!!e.audio_config?.audio_speed_mode;if(e.icon)return Le(Ie(e.icon,"mdi:lightbulb-on"),t);const i=function(e){const t=(e.effect_colors??[]).slice(0,8);if(0===t.length)return null;if(1===t.length){const e=Ae(t[0]);return L`${be(Re(`<circle cx="200" cy="200" r="180" fill="${e}" />`))}`}const i=360/t.length,s=t.map((e,t)=>Ce(t*i,(t+1)*i,Ae(e))).join("");return L`${be(Re(s))}`}(e)??L`<ha-icon icon="mdi:lightbulb-on"></ha-icon>`;return Le(i,t)}function Ge(e,t,i){switch(e.type){case"effect":return i?Fe(t):function(e){const t=Ie(e.icon,"mdi:lightbulb-on");return Le(t,!!e.audio_speed_mode)}(t);case"segment_pattern":return i?function(e){return e.icon?Ie(e.icon,"mdi:palette"):ze(e)??L`<ha-icon icon="mdi:palette"></ha-icon>`}(t):Ie(t.icon,"mdi:palette");case"cct_sequence":return i?function(e){return e.icon?Ie(e.icon,"mdi:temperature-kelvin"):je(e)??L`<ha-icon icon="mdi:temperature-kelvin"></ha-icon>`}(t):Ie(t.icon,"mdi:temperature-kelvin");case"segment_sequence":return i?function(e){return e.icon?Ie(e.icon,"mdi:animation-play"):De(e)??L`<ha-icon icon="mdi:animation-play"></ha-icon>`}(t):Ie(t.icon,"mdi:animation-play");case"dynamic_scene":return i?function(e){const t=!(!e.audio_entity&&!e.audio_color_advance);if(e.icon)return Le(Ie(e.icon,"mdi:lamps"),t);const i=He(e)??L`<ha-icon icon="mdi:lamps"></ha-icon>`;return Le(i,t)}(t):function(e){const t=He(e)??L`<ha-icon icon="mdi:lamps"></ha-icon>`;return Le(t,!!e.audio_color_advance)}(t);default:return L`<ha-icon icon="mdi:star"></ha-icon>`}}const Ve="aqara_advanced_lighting";async function We(e,t,i,s,n,o={}){if(0!==t.length)switch(i.type){case"effect":return n?async function(e,t,i,s){const n={entity_id:t,effect:i.effect,speed:i.effect_speed,preset:i.name,turn_on:!0,sync:!0};i.effect_colors.forEach((e,t)=>{t<8&&(n[`color_${t+1}`]={x:e.x,y:e.y})}),void 0!==i.effect_brightness?n.brightness=i.effect_brightness:void 0!==s.brightness&&(n.brightness=s.brightness);i.effect_segments&&(n.segments=i.effect_segments);if(s.useEffectAudioReactive){if(s.audioOverrideEntity){const e=i.audio_config;n.audio_entity=s.audioOverrideEntity,n.audio_sensitivity=e?.audio_sensitivity??s.effectAudioOverrideSensitivity,n.audio_silence_behavior=e?.audio_silence_behavior??"decay_min",n.audio_speed_mode=e?.audio_speed_mode||"volume",void 0!==e?.audio_speed_min&&(n.audio_speed_min=e.audio_speed_min),void 0!==e?.audio_speed_max&&(n.audio_speed_max=e.audio_speed_max)}}else if(i.audio_config?.audio_entity){const e=i.audio_config,t=e.audio_entity||s.audioOverrideEntity;t&&(n.audio_entity=t,n.audio_sensitivity=e.audio_sensitivity??50,n.audio_silence_behavior=e.audio_silence_behavior??"decay_min",e.audio_speed_mode&&(n.audio_speed_mode=e.audio_speed_mode,n.audio_speed_min=e.audio_speed_min??1,n.audio_speed_max=e.audio_speed_max??100))}await e.callService(Ve,"set_dynamic_effect",n)}(e,t,s,o):async function(e,t,i,s){const n={entity_id:t,preset:i.id,turn_on:!0,sync:!0};void 0!==s.brightness&&(n.brightness=s.brightness);if(s.useEffectAudioReactive)s.audioOverrideEntity&&(n.audio_entity=s.audioOverrideEntity,n.audio_sensitivity=i.audio_sensitivity??s.effectAudioOverrideSensitivity,n.audio_silence_behavior=i.audio_silence_behavior??"decay_min",n.audio_speed_mode=i.audio_speed_mode||"volume",void 0!==i.audio_speed_min&&(n.audio_speed_min=i.audio_speed_min),void 0!==i.audio_speed_max&&(n.audio_speed_max=i.audio_speed_max));else if(i.audio_speed_mode){const e=s.audioOverrideEntity;e&&(n.audio_entity=e)}await e.callService(Ve,"set_dynamic_effect",n)}(e,t,s,o);case"segment_pattern":return n?async function(e,t,i,s){if(!i.segments||!Array.isArray(i.segments)||0===i.segments.length)return;const n=i.segments.filter(e=>e&&e.color).map(e=>({segment:e.segment,color:{r:e.color.r,g:e.color.g,b:e.color.b}}));if(0===n.length)return;const o={entity_id:t,segment_colors:n,preset:i.name,turn_on:!0,sync:!0,turn_off_unspecified:!0};void 0!==s.brightness&&(o.brightness=s.brightness);try{await e.callService(Ve,"set_segment_pattern",o)}catch(e){}}(e,t,s,o):async function(e,t,i,s){const n={entity_id:t,preset:i.id,turn_on:!0,sync:!0};void 0!==s.brightness&&(n.brightness=s.brightness);await e.callService(Ve,"set_segment_pattern",n)}(e,t,s,o);case"cct_sequence":return n?async function(e,t,i){if("solar"===i.mode||"schedule"===i.mode)return void await e.callService(Ve,"start_cct_sequence",{entity_id:t,preset:i.name,sync:!0});const s={entity_id:t,preset:i.name,loop_mode:i.loop_mode,end_behavior:i.end_behavior,turn_on:!0,sync:!0};"count"===i.loop_mode&&void 0!==i.loop_count&&(s.loop_count=i.loop_count);i.steps.forEach((e,t)=>{const i=t+1;i<=20&&(s[`step_${i}_color_temp`]=e.color_temp,s[`step_${i}_brightness`]=e.brightness,s[`step_${i}_transition`]=e.transition,s[`step_${i}_hold`]=e.hold)}),await e.callService(Ve,"start_cct_sequence",s)}(e,t,s):async function(e,t,i){const s="solar"===i.mode||"schedule"===i.mode;await e.callService(Ve,"start_cct_sequence",{entity_id:t,preset:i.id,...!s&&{turn_on:!0},sync:!0})}(e,t,s);case"segment_sequence":return n?async function(e,t,i,s){const n={entity_id:t,preset:i.name,loop_mode:i.loop_mode,end_behavior:i.end_behavior,turn_on:!0,sync:!0};void 0!==s.brightness&&(n.brightness=s.brightness);"count"===i.loop_mode&&void 0!==i.loop_count&&(n.loop_count=i.loop_count);i.steps.forEach((e,t)=>{const i=t+1;i<=20&&(n[`step_${i}_segments`]=e.segments,n[`step_${i}_mode`]=e.mode,n[`step_${i}_duration`]=e.duration,n[`step_${i}_hold`]=e.hold,n[`step_${i}_activation_pattern`]=e.activation_pattern,e.colors&&Array.isArray(e.colors)&&e.colors.forEach((e,t)=>{t<6&&(n[`step_${i}_color_${t+1}`]=e)}))}),await e.callService(Ve,"start_segment_sequence",n)}(e,t,s,o):async function(e,t,i,s){const n={entity_id:t,preset:i.id,turn_on:!0,sync:!0};void 0!==s.brightness&&(n.brightness=s.brightness);await e.callService(Ve,"start_segment_sequence",n)}(e,t,s,o);case"dynamic_scene":return n?async function(e,t,i,s){const n=s.brightness??null,o={entity_id:t,scene_name:i.name,transition_time:i.transition_time,hold_time:i.hold_time,distribution_mode:s.useDistributionModeOverride?s.distributionModeOverride:i.distribution_mode,random_order:i.random_order,loop_mode:i.loop_mode,end_behavior:i.end_behavior};void 0!==i.offset_delay&&i.offset_delay>0&&(o.offset_delay=i.offset_delay);"count"===i.loop_mode&&void 0!==i.loop_count&&(o.loop_count=i.loop_count);o.colors=i.colors.map(e=>({x:e.x,y:e.y,brightness_pct:n??e.brightness_pct})),s.useStaticSceneMode&&(o.static=!0);Je(o,s),Ze(o,i,s),await e.callService(Ve,"start_dynamic_scene",o)}(e,t,s,o):async function(e,t,i,s){const n=s.brightness??null,o={entity_id:t,scene_name:i.name,transition_time:i.transition_time,hold_time:i.hold_time,distribution_mode:s.useDistributionModeOverride?s.distributionModeOverride:i.distribution_mode,random_order:i.random_order,loop_mode:i.loop_mode,end_behavior:i.end_behavior};void 0!==i.offset_delay&&i.offset_delay>0&&(o.offset_delay=i.offset_delay);"count"===i.loop_mode&&void 0!==i.loop_count&&(o.loop_count=i.loop_count);o.colors=i.colors.map(e=>({x:e.x,y:e.y,brightness_pct:n??e.brightness_pct})),s.useStaticSceneMode&&(o.static=!0);Je(o,s),Ze(o,i,s),await e.callService(Ve,"start_dynamic_scene",o)}(e,t,s,o)}}function Ze(e,t,i){if(i.useAudioReactive&&i.audioOverrideEntity)return;if(!t.audio_color_advance)return;const s=t.audio_entity||i.audioOverrideEntity;s&&(e.audio_entity=s,e.audio_color_advance=t.audio_color_advance,null!=t.audio_sensitivity&&(e.audio_sensitivity=t.audio_sensitivity),void 0!==t.audio_brightness_curve&&(e.audio_brightness_curve=t.audio_brightness_curve),null!=t.audio_brightness_min&&(e.audio_brightness_min=t.audio_brightness_min),null!=t.audio_brightness_max&&(e.audio_brightness_max=t.audio_brightness_max),null!=t.audio_transition_speed&&(e.audio_transition_speed=t.audio_transition_speed),null!=t.audio_detection_mode&&(e.audio_detection_mode=t.audio_detection_mode),null!=t.audio_frequency_zone&&(e.audio_frequency_zone=t.audio_frequency_zone),null!=t.audio_silence_behavior&&(e.audio_silence_behavior=t.audio_silence_behavior),null!=t.audio_prediction_aggressiveness&&(e.audio_prediction_aggressiveness=t.audio_prediction_aggressiveness),null!=t.audio_latency_compensation_ms&&(e.audio_latency_compensation_ms=t.audio_latency_compensation_ms),null!=t.audio_color_by_frequency&&(e.audio_color_by_frequency=t.audio_color_by_frequency),null!=t.audio_rolloff_brightness&&(e.audio_rolloff_brightness=t.audio_rolloff_brightness))}function Je(e,t){t.useAudioReactive&&t.audioOverrideEntity&&(e.audio_entity=t.audioOverrideEntity,void 0!==t.audioOverrideSensitivity&&(e.audio_sensitivity=t.audioOverrideSensitivity),void 0!==t.audioOverrideColorAdvance&&(e.audio_color_advance=t.audioOverrideColorAdvance),void 0!==t.audioOverrideTransitionSpeed&&(e.audio_transition_speed=t.audioOverrideTransitionSpeed),void 0!==t.audioOverrideBrightnessCurve&&(e.audio_brightness_curve=t.audioOverrideBrightnessCurve),void 0!==t.audioOverrideBrightnessMin&&(e.audio_brightness_min=t.audioOverrideBrightnessMin),void 0!==t.audioOverrideBrightnessMax&&(e.audio_brightness_max=t.audioOverrideBrightnessMax),void 0!==t.audioOverrideDetectionMode&&(e.audio_detection_mode=t.audioOverrideDetectionMode),void 0!==t.audioOverrideFrequencyZone&&(e.audio_frequency_zone=t.audioOverrideFrequencyZone),void 0!==t.audioOverrideSilenceBehavior&&(e.audio_silence_behavior=t.audioOverrideSilenceBehavior),void 0!==t.audioOverridePredictionAggressiveness&&(e.audio_prediction_aggressiveness=t.audioOverridePredictionAggressiveness),void 0!==t.audioOverrideLatencyCompensationMs&&(e.audio_latency_compensation_ms=t.audioOverrideLatencyCompensationMs),void 0!==t.audioOverrideColorByFrequency&&(e.audio_color_by_frequency=t.audioOverrideColorByFrequency),void 0!==t.audioOverrideRolloffBrightness&&(e.audio_rolloff_brightness=t.audioOverrideRolloffBrightness))}const Ke=36e5,Ye=12e4,Qe=new Map,Xe=new Map;function et(e,t){Qe.set(e,{data:t,timestamp:Date.now()})}async function tt(e,t,i){const s=function(e,t){const i=Qe.get(e);if(i&&Date.now()-i.timestamp<t)return i.data}(e,t);if(void 0!==s)return s;const n=Xe.get(e);if(n)return n;const o=i().then(t=>(et(e,t),t)).finally(()=>Xe.delete(e));return Xe.set(e,o),o}async function it(e){return tt("presets",Ke,async()=>{const t=await e.fetchWithAuth("/api/aqara_advanced_lighting/presets");if(!t.ok)throw new Error(`Presets fetch failed: ${t.status}`);return t.json()})}async function st(e){return tt("user_presets",Ye,()=>e.callApi("GET","aqara_advanced_lighting/user_presets"))}async function nt(e){return tt("user_preferences",Ye,()=>e.callApi("GET","aqara_advanced_lighting/user_preferences"))}async function ot(e){return tt("supported_entities",Ke,()=>e.callApi("GET","aqara_advanced_lighting/supported_entities"))}async function rt(e,t={}){if(!t.bypassCache){const e=Qe.get("running_operations");if(e)return e.data}const i=await e.callApi("GET","aqara_advanced_lighting/running_operations");return et("running_operations",i),i}let at=!1,ct=!1;function dt(e,t){const i=new Set(t),s=new Map;if(!e)return s;for(const t of e){if(!t.preset_id)continue;("string"==typeof t.entity_id&&i.has(t.entity_id)||Array.isArray(t.entity_ids)&&t.entity_ids.some(e=>i.has(e)))&&s.set(t.preset_id,t.type)}return s}async function lt(e,t,i){const s=await rt(e,{bypassCache:!0}).catch(()=>{});s&&i(dt(s.operations,t))}var ht;let ut=class extends ae{constructor(){super(...arguments),this._t=_e.card}setConfig(e){this._config={...e}}render(){return this.hass&&this._config?L`
      <div class="editor">
        <ha-selector
          .hass=${this.hass}
          .label=${this._t.editor.entities_label}
          .selector=${{entity:{domain:"light",multiple:!0}}}
          .value=${this._config.entities||(this._config.entity?[this._config.entity]:[])}
          .required=${!0}
          @value-changed=${e=>{const t=e.detail.value;this._updateConfig("entities",t?.length?t:void 0),this._config.entity&&this._updateConfig("entity",void 0)}}
        ></ha-selector>
        ${ge({label:this._t.editor.title_label,value:this._config.title||"",onInput:e=>this._updateConfig("title",e.target.value)})}
        ${ge({label:this._t.editor.columns_label,type:"number",min:"0",max:"6",value:String(this._config.columns||0),onInput:e=>{const t=parseInt(e.target.value,10);this._updateConfig("columns",isNaN(t)||t<=0?void 0:t)}})}
        <ha-formfield .label=${this._t.editor.compact_label}>
          <ha-switch
            .checked=${this._config.compact||!1}
            @change=${e=>this._updateConfig("compact",e.target.checked||void 0)}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${this._t.editor.show_names_label}>
          <ha-switch
            .checked=${!1!==this._config.show_names}
            @change=${e=>this._updateConfig("show_names",!!e.target.checked&&void 0)}
          ></ha-switch>
        </ha-formfield>
        <ha-formfield .label=${this._t.editor.highlight_user_label}>
          <ha-switch
            .checked=${!1!==this._config.highlight_user_presets}
            @change=${e=>this._updateConfig("highlight_user_presets",!!e.target.checked&&void 0)}
          ></ha-switch>
        </ha-formfield>
      </div>
    `:L``}_updateConfig(e,t){if(!this._config)return;const i={...this._config,[e]:t};(void 0===t||""===t&&"title"!==e)&&delete i[e],this._config=i,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:i}}))}};ut.styles=r`
    .editor {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
    }
  `,e([ue({attribute:!1})],ut.prototype,"hass",void 0),e([pe()],ut.prototype,"_config",void 0),ut=e([de("aqara-preset-favorites-card-editor")],ut);let pt=ht=class extends ae{constructor(){super(...arguments),this._t=_e.card,this._favoriteRefs=[],this._supportedEntities=new Map,this._loading=!0,this._activePresets=new Map,this._dataLoaded=!1,this._subscriptionFailed=!1,this._lastHassConnected=!0,this._subscribing=!1}_findActiveOpType(e,t){const i=this._activePresets.get(e.id);if(i===e.type)return i;const s=this._activePresets.get(t.name);return s===e.type?s:void 0}setConfig(e){if(!(e.entity||e.entities&&0!==e.entities.length))throw new Error("At least one entity is required");this._config=e}_getEntityIds(){return this._config?.entities?.length?this._config.entities:this._config?.entity?[this._config.entity]:[]}getCardSize(){return 3}static getConfigElement(){return document.createElement("aqara-preset-favorites-card-editor")}static getStubConfig(){return{entity:"",title:_e.card.default_title}}async updated(e){if(super.updated(e),!this._subscribing){if(e.has("hass")&&this.hass){this._subscribing=!0;try{if(!this._dataLoaded)await this._loadData(),await this._startSubscription(),this._lastHassConnected=!1!==this.hass.connected;else{const e=!1!==this.hass.connected;!this._lastHassConnected&&e&&await this._resyncRunningOps(),this._lastHassConnected=e}}finally{this._subscribing=!1}}e.has("hass")&&!this.hass&&this._stopSubscription()}}disconnectedCallback(){super.disconnectedCallback(),this._stopSubscription()}async _startSubscription(){if(this._stopSubscription(),!this.hass)return;const e=this._getEntityIds();try{const t=await async function(e,t,i){let s;const n=async()=>{try{const s=await rt(e,{bypassCache:!0});i(dt(s.operations,t))}catch(e){ct||(ct=!0)}};await n();try{s=await e.connection.subscribeEvents(n,"aqara_advanced_lighting_operations_changed")}catch(e){throw at||(at=!0),e}return()=>{s&&(s(),s=void 0)}}(this.hass,e,e=>{this._activePresets=e});if(!this.isConnected)return void t();this._unsubRunningOps=t,this._subscriptionFailed=!1}catch{this._subscriptionFailed=!0}}async _resyncRunningOps(){if(this.hass)try{const e=await rt(this.hass,{bypassCache:!0});this._activePresets=dt(e.operations,this._getEntityIds())}catch{}}_stopSubscription(){this._unsubRunningOps&&(this._unsubRunningOps(),this._unsubRunningOps=void 0)}async _loadData(){if(this.hass){this._loading=!0,this._error=void 0;try{const[e,t,i,s]=await Promise.all([it(this.hass),st(this.hass),nt(this.hass),ot(this.hass)]);this._presets=e,this._userPresets=t,this._favoriteRefs=i.favorite_presets||[],this._userPrefs=i;const n=new Map;for(const e of s.entities||[])n.set(e.entity_id,{device_type:e.device_type,model_id:e.model_id});this._supportedEntities=n,this._dataLoaded=!0}catch(e){this._error=this._t.error_loading}finally{this._loading=!1}}}_getSelectedDeviceTypes(){const e=this._getEntityIds(),t=[];for(const i of e){const e=this._supportedEntities.get(i)?.device_type;e&&!t.includes(e)&&t.push(e)}return t}async _activatePreset(e,t,i){const s=this._getEntityIds();if(0===s.length)return;const n=this._findActiveOpType(e,t);if(n){const i=this._activePresets.has(e.id)?e.id:t.name;return void await this._stopPreset(i,n)}this._activating=e.id;try{const n=this._buildActivationOptions();await We(this.hass,s,e,t,i,n)}catch(e){}finally{this._activating=void 0,this._subscriptionFailed&&await lt(this.hass,this._getEntityIds(),e=>{this._activePresets=e})}}_buildActivationOptions(){const e=this._userPrefs;return e?{audioOverrideEntity:e.audio_override_entity??void 0,useAudioReactive:e.use_audio_reactive,useEffectAudioReactive:e.use_effect_audio_reactive,effectAudioOverrideSensitivity:e.effect_audio_override_sensitivity,audioOverrideSensitivity:e.audio_override_sensitivity,audioOverrideColorAdvance:e.audio_override_color_advance??null,audioOverrideTransitionSpeed:e.audio_override_transition_speed,audioOverrideBrightnessCurve:e.audio_override_brightness_curve??null,audioOverrideBrightnessMin:e.audio_override_brightness_min,audioOverrideBrightnessMax:e.audio_override_brightness_max,audioOverrideDetectionMode:e.audio_override_detection_mode,audioOverrideFrequencyZone:e.audio_override_frequency_zone,audioOverrideSilenceBehavior:e.audio_override_silence_behavior,audioOverridePredictionAggressiveness:e.audio_override_prediction_aggressiveness,audioOverrideLatencyCompensationMs:e.audio_override_latency_compensation_ms,audioOverrideColorByFrequency:e.audio_override_color_by_frequency,audioOverrideRolloffBrightness:e.audio_override_rolloff_brightness}:{}}async _stopPreset(e,t){const i=this._getEntityIds();if(0===i.length)return;const s=ht._STOP_SERVICES[t];if(s){this._activating=e;try{const e={entity_id:i};"segment_sequence"!==t&&(e.restore_state=!0),await this.hass.callService("aqara_advanced_lighting",s,e)}catch(e){}finally{this._activating=void 0,this._activePresets.delete(e),this._subscriptionFailed&&await lt(this.hass,this._getEntityIds(),e=>{this._activePresets=e})}}}render(){if(!this._config)return L``;const e=void 0===this._config.title?this._t.default_title:this._config.title||void 0;if(this._loading)return L`
        <ha-card .header=${e}>
          <div class="card-content loading">
            <ha-circular-progress indeterminate></ha-circular-progress>
          </div>
        </ha-card>
      `;if(this._error)return L`
        <ha-card .header=${e}>
          <div class="card-content">
            <ha-alert alert-type="error">${this._error}</ha-alert>
          </div>
        </ha-card>
      `;const t=this._presets&&this._userPresets?function(e,t,i,s){const n=[];for(const o of e){let e,r=null,a=!1;switch(o.type){case"effect":for(const i of["t2_bulb","t1m","t1_strip"]){const s=t.dynamic_effects?.[i]?.find(e=>e.id===o.id);if(s){r=s,e=i;break}}if(!r){const t=i.effect_presets?.find(e=>e.id===o.id);t&&(r=t,a=!0,e=t.device_type)}break;case"segment_pattern":if(r=t.segment_patterns?.find(e=>e.id===o.id)||null,!r){const t=i.segment_pattern_presets?.find(e=>e.id===o.id);t&&(r=t,a=!0,e=t.device_type)}break;case"cct_sequence":r=t.cct_sequences?.find(e=>e.id===o.id)||null,r||(r=i.cct_sequence_presets?.find(e=>e.id===o.id)||null,r&&(a=!0));break;case"segment_sequence":if(r=t.segment_sequences?.find(e=>e.id===o.id)||null,!r){const t=i.segment_sequence_presets?.find(e=>e.id===o.id);t&&(r=t,a=!0,e=t.device_type)}break;case"dynamic_scene":r=t.dynamic_scenes?.find(e=>e.id===o.id)||null,r||(r=i.dynamic_scene_presets?.find(e=>e.id===o.id)||null,r&&(a=!0))}r&&me(o,s,e)&&n.push({ref:o,preset:r,isUser:a,deviceType:e})}return n}(this._favoriteRefs,this._presets,this._userPresets,this._getSelectedDeviceTypes()):[];if(0===t.length)return L`
        <ha-card .header=${e}>
          <div class="card-content empty">
            <ha-icon icon="mdi:star-off-outline"></ha-icon>
            <p>${this._t.empty_no_favorites}</p>
          </div>
        </ha-card>
      `;const i=this._config.columns?`grid-template-columns: repeat(${this._config.columns}, 1fr)`:"",s=this._config.compact||!1,n=!1!==this._config.show_names,o=!1!==this._config.highlight_user_presets;return L`
      <ha-card .header=${e}>
        <div class="preset-grid ${s?"compact":""} ${n?"":"no-names"} ${e?"":"no-title"}" style=${i||G}>
          ${t.map(({ref:e,preset:t,isUser:i})=>{const s=this._activating===e.id,r=void 0!==this._findActiveOpType(e,t);return L`
              <div
                class="preset-button ${i&&o?"user-preset":"builtin-preset"} ${s?"activating":""} ${r?"active":""}"
                role="button"
                tabindex="0"
                aria-label="${t.name}"
                @click=${()=>this._activatePreset(e,t,i)}
                @keydown=${s=>{"Enter"===s.key&&this._activatePreset(e,t,i)}}
              >
                <div class="preset-icon">
                  ${Ge(e,t,i)}
                </div>
                ${n?L`<div class="preset-name">${t.name}</div>`:G}
                ${s?L`<div class="activating-overlay"><ha-circular-progress indeterminate size="small"></ha-circular-progress></div>`:G}
              </div>
            `})}
        </div>
      </ha-card>
    `}};pt._STOP_SERVICES={effect:"stop_effect",cct_sequence:"stop_cct_sequence",segment_sequence:"stop_segment_sequence",dynamic_scene:"stop_dynamic_scene"},pt.styles=r`
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
      width: 56px;
      height: 56px;
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
      --mdc-icon-size: 56px;
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
      width: 64px;
      height: 64px;
    }

    .no-names .preset-icon ha-icon {
      --mdc-icon-size: 64px;
    }

    .no-names .preset-button {
      min-height: 68px;
    }

    /* No names + compact combined */
    .compact.no-names .preset-icon {
      width: 48px;
      height: 48px;
    }

    .compact.no-names .preset-icon ha-icon {
      --mdc-icon-size: 48px;
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
      width: 40px;
      height: 40px;
    }

    .compact .preset-icon ha-icon {
      --mdc-icon-size: 40px;
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
  `,e([ue({attribute:!1})],pt.prototype,"hass",void 0),e([pe()],pt.prototype,"_config",void 0),e([pe()],pt.prototype,"_presets",void 0),e([pe()],pt.prototype,"_userPresets",void 0),e([pe()],pt.prototype,"_favoriteRefs",void 0),e([pe()],pt.prototype,"_userPrefs",void 0),e([pe()],pt.prototype,"_supportedEntities",void 0),e([pe()],pt.prototype,"_loading",void 0),e([pe()],pt.prototype,"_error",void 0),e([pe()],pt.prototype,"_activating",void 0),e([pe()],pt.prototype,"_activePresets",void 0),pt=ht=e([de("aqara-preset-favorites-card")],pt),window.customCards=window.customCards||[],window.customCards.push({type:"aqara-preset-favorites-card",name:_e.card.name,description:_e.card.description,preview:!1})}();
