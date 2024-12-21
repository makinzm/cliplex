(()=>{"use strict";var e={379:function(e,t){var n=this&&this.__awaiter||function(e,t,n,o){return new(n||(n=Promise))((function(i,d){function l(e){try{c(o.next(e))}catch(e){d(e)}}function a(e){try{c(o.throw(e))}catch(e){d(e)}}function c(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(l,a)}c((o=o.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0}),t.LocalDatabase=void 0,t.LocalDatabase=class{constructor(){this.STORAGE_KEY="word_entries",this.EXCLUDED_DOMAIN_KEY="excluded_domains",this.INCLUDED_DOMAIN_KEY="included_domains"}getAll(){return n(this,void 0,void 0,(function*(){console.log("Getting all entries from storage...");const e=yield chrome.storage.local.get(this.STORAGE_KEY);return console.log("All entries:",e),e[this.STORAGE_KEY]||[]}))}save(e){return n(this,void 0,void 0,(function*(){const t=yield this.getAll(),n=t.findIndex((t=>t.key===e.key));n>-1?t[n]=e:t.push(e),yield chrome.storage.local.set({[this.STORAGE_KEY]:t})}))}delete(e){return n(this,void 0,void 0,(function*(){const t=(yield this.getAll()).filter((t=>t.key!==e));yield chrome.storage.local.set({[this.STORAGE_KEY]:t})}))}getAllExcludedDomains(){return n(this,void 0,void 0,(function*(){return(yield chrome.storage.local.get(this.EXCLUDED_DOMAIN_KEY))[this.EXCLUDED_DOMAIN_KEY]||[]}))}addExcludedDomain(e){return n(this,void 0,void 0,(function*(){const t=yield this.getAllExcludedDomains();t.some((t=>t.domain===e))||(t.push({domain:e}),yield chrome.storage.local.set({[this.EXCLUDED_DOMAIN_KEY]:t}))}))}removeExcludedDomain(e){return n(this,void 0,void 0,(function*(){const t=(yield this.getAllExcludedDomains()).filter((t=>t.domain!==e));yield chrome.storage.local.set({[this.EXCLUDED_DOMAIN_KEY]:t})}))}getAllIncludedDomains(){return n(this,void 0,void 0,(function*(){return(yield chrome.storage.local.get(this.INCLUDED_DOMAIN_KEY))[this.INCLUDED_DOMAIN_KEY]||[]}))}addIncludedDomain(e){return n(this,void 0,void 0,(function*(){const t=yield this.getAllIncludedDomains();t.some((t=>t.domain===e))||(t.push({domain:e}),yield chrome.storage.local.set({[this.INCLUDED_DOMAIN_KEY]:t}))}))}removeIncludedDomain(e){return n(this,void 0,void 0,(function*(){const t=(yield this.getAllIncludedDomains()).filter((t=>t.domain!==e));yield chrome.storage.local.set({[this.INCLUDED_DOMAIN_KEY]:t})}))}}},115:function(e,t,n){var o=this&&this.__awaiter||function(e,t,n,o){return new(n||(n=Promise))((function(i,d){function l(e){try{c(o.next(e))}catch(e){d(e)}}function a(e){try{c(o.throw(e))}catch(e){d(e)}}function c(e){var t;e.done?i(e.value):(t=e.value,t instanceof n?t:new n((function(e){e(t)}))).then(l,a)}c((o=o.apply(e,t||[])).next())}))};Object.defineProperty(t,"__esModule",{value:!0});const i=new(n(379).LocalDatabase),d=document.getElementById("dateFrom"),l=document.getElementById("dateTo"),a=document.getElementById("filterButton"),c=document.getElementById("prioritySort"),r=document.getElementById("wordsTableBody");let s=[];function u(){return o(this,arguments,void 0,(function*(e={}){let t=yield i.getAll();e.from&&(t=t.filter((t=>new Date(t.addedDate)>=e.from))),e.to&&(t=t.filter((t=>new Date(t.addedDate)<=e.to))),e.prioritySort?t.sort(((t,n)=>"asc"===e.prioritySort?t.priority===n.priority?new Date(t.addedDate).getTime()-new Date(n.addedDate).getTime():t.priority-n.priority:"desc"===e.prioritySort?t.priority===n.priority?new Date(n.addedDate).getTime()-new Date(t.addedDate).getTime():n.priority-t.priority:0)):t.sort(((e,t)=>e.priority===t.priority?new Date(t.addedDate).getTime()-new Date(e.addedDate).getTime():t.priority-e.priority)),s=t,v()}))}let m=1;const h=10,y=document.getElementById("pagination");function p(){y.innerHTML="";const e=Math.ceil(s.length/h),t=document.createElement("button");t.textContent="前へ",t.className="pagination-button",t.disabled=1===m,t.addEventListener("click",(()=>{m>1&&(m--,v(),p())})),y.appendChild(t);const n=document.createElement("button");n.textContent="次へ",n.className="pagination-button",n.disabled=m===e,n.addEventListener("click",(()=>{m<e&&(m++,v(),p())})),y.appendChild(n)}function v(){r.innerHTML="",Math.ceil(s.length/h);const e=(m-1)*h,t=e+h,n=s.slice(e,t);for(const e of n){const t=document.createElement("tr"),n=`https://youglish.com/pronounce/${encodeURIComponent(e.key)}/english`,d=`https://playphrase.me/#/search?q=${encodeURIComponent(e.key)}`,l=`https://www.oxfordlearnersdictionaries.com/definition/english/${encodeURIComponent(e.key)}`,a=`https://ejje.weblio.jp/content/${encodeURIComponent(e.key)}`,c=`https://www.yourdictionary.com/${encodeURIComponent(e.key)}`,s=`https://hypcol.marutank.net/?q=${encodeURIComponent(e.key)}&d=f`;t.innerHTML=`\n      <td class="key-cell">${e.key}</td>\n      <td class="link-cell">\n        <ul>\n          <li><a href="${l}" target="_blank">Ox.</a></li>\n          <li><a href="${a}" target="_blank">We.</a></li>\n        </ul>\n      </td>\n      <td class="link-cell">\n        <ul>\n          <li><a href="${n}" target="_blank">Youglish</a></li>\n          <li><a href="${d}" target="_blank">P.P.</a></li>\n        </ul>\n      </td>\n      <td class="link-cell">\n        <ul>\n          <li><a href="${c}" target="_blank">Y.D.</a></li>\n          <li><a href="${s}" target="_blank">H.D.</a></li>\n        </ul>\n      </td>\n      <td>\n        <ul>\n          ${e.examples.map(((e,t)=>`\n            <li>${e} <button class="delete-example" data-index="${t}">削除</button></li>\n          `)).join("")}\n        </ul>\n        <button class="add-example">追加</button>\n      </td>\n      <td>\n        <textarea class="note-area">${e.note}</textarea>\n      </td>\n      <td>${new Date(e.addedDate).toLocaleString()}</td>\n      <td>\n        <select class="priority-select">\n          ${[1,2,3,4,5].map((t=>`<option value="${t}" ${t===e.priority?"selected":""}>${t}</option>`)).join("")}\n        </select>\n      </td>\n      <td>\n        <button class="save-changes">保存</button>\n        <button class="delete-key">削除</button>\n      </td>\n    `,t.querySelector(".add-example").addEventListener("click",(()=>{const t=prompt("新しい例文を入力してください:");t&&(e.examples.push(t),v())})),t.querySelectorAll(".delete-example").forEach((t=>{t.addEventListener("click",(()=>{const n=Number(t.getAttribute("data-index"));e.examples.splice(n,1),v()}))})),t.querySelector(".save-changes").addEventListener("click",(()=>o(this,void 0,void 0,(function*(){const n=t.querySelector(".note-area"),o=t.querySelector(".priority-select");e.note=n.value,e.priority=Number(o.value),yield i.save(e),console.log("保存しました")})))),t.querySelector(".delete-key").addEventListener("click",(()=>o(this,void 0,void 0,(function*(){yield i.delete(e.key),u()})))),r.appendChild(t)}p()}a.addEventListener("click",(()=>{u({from:d.value?new Date(d.value):void 0,to:l.value?new Date(l.value):void 0,prioritySort:c.value})}));const g=document.getElementById("excludedDomainInput"),E=document.getElementById("addExcludedDomainButton"),D=document.getElementById("excludedDomainList");function f(){return o(this,void 0,void 0,(function*(){const e=yield i.getAllExcludedDomains();D.innerHTML="";for(const t of e){const e=document.createElement("li");e.textContent=t.domain;const n=document.createElement("button");n.textContent="削除",n.addEventListener("click",(()=>o(this,void 0,void 0,(function*(){yield i.removeExcludedDomain(t.domain),f()})))),e.appendChild(n),D.appendChild(e)}}))}E.addEventListener("click",(()=>o(void 0,void 0,void 0,(function*(){const e=g.value.trim();e&&(yield i.addExcludedDomain(e),g.value="",f())}))));const x="domainFilterMode",I=document.getElementById("radioExclude"),_=document.getElementById("radioInclude"),k=document.getElementById("excludeSettings"),b=document.getElementById("includeSettings");function L(e){"exclude"===e?(k.style.display="block",b.style.display="none"):(k.style.display="none",b.style.display="block"),localStorage.setItem("domainFilterMode",e)}I.addEventListener("change",(()=>L("exclude"))),_.addEventListener("change",(()=>L("include"))),"exclude"===(localStorage.getItem("domainFilterMode")||"include")?(I.checked=!0,L("exclude")):(_.checked=!0,L("include")),f(),u(),function(){o(this,void 0,void 0,(function*(){var e;"include"===(null!==(e=(yield chrome.storage.local.get(x))[x])&&void 0!==e?e:"exclude")?_.checked=!0:I.checked=!0}))}(),function(){[I,_].forEach((e=>{e.addEventListener("change",(()=>o(this,void 0,void 0,(function*(){e.checked&&(yield chrome.storage.local.set({[x]:e.value}))}))))}))}()}},t={};!function n(o){var i=t[o];if(void 0!==i)return i.exports;var d=t[o]={exports:{}};return e[o].call(d.exports,d,d.exports,n),d.exports}(115)})();