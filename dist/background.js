(()=>{"use strict";var e={994:function(e,t,o){var i=this&&this.__awaiter||function(e,t,o,i){return new(o||(o=Promise))((function(n,s){function r(e){try{c(i.next(e))}catch(e){s(e)}}function l(e){try{c(i.throw(e))}catch(e){s(e)}}function c(e){var t;e.done?n(e.value):(t=e.value,t instanceof o?t:new o((function(e){e(t)}))).then(r,l)}c((i=i.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0});const n=o(379);chrome.action.onClicked.addListener((e=>{e.id&&e.url&&chrome.scripting.executeScript({target:{tabId:e.id},files:["content_script.js"]})}));const s=new n.LocalDatabase;console.log("Background script started."),chrome.runtime.onMessage.addListener(((e,t,o)=>{if(console.log("Message received in background:",e),"save_entry"===e.type)return s.save(e.entry).then((()=>i(void 0,void 0,void 0,(function*(){console.log("Entry saved successfully:",e.entry);const t=yield s.getAll();console.log("All entries after save:",t),o({status:"ok"})})))),!0}))},379:function(e,t){var o=this&&this.__awaiter||function(e,t,o,i){return new(o||(o=Promise))((function(n,s){function r(e){try{c(i.next(e))}catch(e){s(e)}}function l(e){try{c(i.throw(e))}catch(e){s(e)}}function c(e){var t;e.done?n(e.value):(t=e.value,t instanceof o?t:new o((function(e){e(t)}))).then(r,l)}c((i=i.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.LocalDatabase=void 0,t.LocalDatabase=class{constructor(){this.STORAGE_KEY="word_entries",this.EXCLUDED_DOMAIN_KEY="excluded_domains",this.INCLUDED_DOMAIN_KEY="included_domains"}getAll(){return o(this,void 0,void 0,(function*(){console.log("Getting all entries from storage...");const e=yield chrome.storage.local.get(this.STORAGE_KEY);return console.log("All entries:",e),e[this.STORAGE_KEY]||[]}))}save(e){return o(this,void 0,void 0,(function*(){const t=yield this.getAll(),o=t.findIndex((t=>t.key===e.key));o>-1?t[o]=e:t.push(e),yield chrome.storage.local.set({[this.STORAGE_KEY]:t})}))}delete(e){return o(this,void 0,void 0,(function*(){const t=(yield this.getAll()).filter((t=>t.key!==e));yield chrome.storage.local.set({[this.STORAGE_KEY]:t})}))}getAllExcludedDomains(){return o(this,void 0,void 0,(function*(){return(yield chrome.storage.local.get(this.EXCLUDED_DOMAIN_KEY))[this.EXCLUDED_DOMAIN_KEY]||[]}))}addExcludedDomain(e){return o(this,void 0,void 0,(function*(){const t=yield this.getAllExcludedDomains();t.some((t=>t.domain===e))||(t.push({domain:e}),yield chrome.storage.local.set({[this.EXCLUDED_DOMAIN_KEY]:t}))}))}removeExcludedDomain(e){return o(this,void 0,void 0,(function*(){const t=(yield this.getAllExcludedDomains()).filter((t=>t.domain!==e));yield chrome.storage.local.set({[this.EXCLUDED_DOMAIN_KEY]:t})}))}getAllIncludedDomains(){return o(this,void 0,void 0,(function*(){return(yield chrome.storage.local.get(this.INCLUDED_DOMAIN_KEY))[this.INCLUDED_DOMAIN_KEY]||[]}))}addIncludedDomain(e){return o(this,void 0,void 0,(function*(){const t=yield this.getAllIncludedDomains();t.some((t=>t.domain===e))||(t.push({domain:e}),yield chrome.storage.local.set({[this.INCLUDED_DOMAIN_KEY]:t}))}))}removeIncludedDomain(e){return o(this,void 0,void 0,(function*(){const t=(yield this.getAllIncludedDomains()).filter((t=>t.domain!==e));yield chrome.storage.local.set({[this.INCLUDED_DOMAIN_KEY]:t})}))}}}},t={};!function o(i){var n=t[i];if(void 0!==n)return n.exports;var s=t[i]={exports:{}};return e[i].call(s.exports,s,s.exports,o),s.exports}(994)})();