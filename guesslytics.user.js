// ==UserScript==
// @name         Guesslytics - GeoGuessr Rating Tracker
// @namespace    https://github.com/Avanatiker/Guesslytics
// @version      0.1.2
// @description  Tracks your GeoGuessr competitive duel ratings over time and displays it in a graph
// @author       Constructor
// @match        *://*.geoguessr.com/multiplayer*
// @connect      game-server.geoguessr.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js
// @require      https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3.0.0/dist/chartjs-adapter-date-fns.bundle.min.js
// @updateURL    https://github.com/Avanatiker/Guesslytics/raw/main/guesslytics.user.js
// @downloadURL  https://github.com/Avanatiker/Guesslytics/raw/main/guesslytics.user.js
// ==/UserScript==
(function(){let e=`guesslyticsSettings`,t=`guesslyticsRatingHistory`,n=`guesslyticsBackfillState`,r={statsTimeframe:7,backfillFullHistory:!1,backfillDays:30,showAreaFill:!0,visibleDatasets:{overall:!0,moving:!0,noMove:!0,nmpz:!0},autoRefreshInterval:60,apiRequestDelay:250,backgroundOpacity:15,initialZoomDays:7,verboseLogging:!1},i={EXPAND:`<i class="fa-solid fa-expand"></i>`,COLLAPSE:`<i class="fa-solid fa-compress"></i>`,SETTINGS:`<i class="fa-solid fa-gear"></i>`,GITHUB:`<i class="fa-brands fa-github"></i>`,RESYNC:`<i class="fa-solid fa-sync-alt"></i>`,CHART:`<i class="fa-solid fa-chart-line" style="color: white;"></i>`},a={overall:{label:`Overall`,color:`#FFFFFF`},moving:{label:`Moving`,color:`#4A90E2`},noMove:{label:`No Move`,color:`#F5A623`},nmpz:{label:`NMPZ`,color:`#BD10E0`}};var o=class{enabled=!1;setLogging(e){this.enabled=e}log(e,t){this.enabled&&(t?console.log(`[Guesslytics] ${e}`,t):console.log(`[Guesslytics] ${e}`))}error(e,t){let n=t instanceof Error?t.message:t;console.error(`[Guesslytics] ERROR: ${e}`,n||``)}};let s=new o;function c(e,t,n){let r=e instanceof Error?e.message:e;s.error(`${t}: ${r||`Unknown error`}`,e),n?.setSyncState&&!n.silent&&n.setSyncState(!1,`Error during operation`,n.settings,n.callback)}async function l(){let t=await GM_getValue(e,r),n={...r,...t,visibleDatasets:{...r.visibleDatasets,...t.visibleDatasets}};return s.setLogging(n.verboseLogging),n}function u(e,t=2e4){return new Promise((n,r)=>{let i=setInterval(()=>{e()&&(clearInterval(i),n())},200);setTimeout(()=>{clearInterval(i);let e=Error(`Timed out waiting for page element.`);c(e,`Page initialization`,{silent:!0}),r(e)},t)})}let d=e=>new Promise(t=>setTimeout(t,e)),f=e=>e?new Date(e).toLocaleString():`N/A`;function p(){try{return JSON.parse(document.getElementById(`__NEXT_DATA__`)?.innerHTML||`{}`)?.props?.accountProps?.account?.user?.userId||null}catch(e){return c(e,`Failed to get user ID from page data`,{silent:!0}),null}}async function m(){let e=await GM_getValue(t);return e||{overall:[],moving:[],noMove:[],nmpz:[]}}async function h(e){await GM_setValue(t,e)}function g(e){return e===`StandardDuels`?`moving`:e===`NoMoveDuels`?`noMove`:e===`NmpzDuels`?`nmpz`:null}let _=`
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

#guesslyticsContainer { 
    display: flex; 
    flex-direction: column; 
    width: 100%; 
    height: 210px; 
    background: rgba(28,28,28,0.15); /* Default opacity 15% */
    border-radius: 8px; 
    border: 1px solid #444; 
    transition: height 0.3s ease, background-color 0.3s ease; 
    box-sizing: border-box; 
}

#guesslyticsContainer.expanded { 
    height: 400px; 
}

.guesslytics-header { 
    padding: 10px 15px; 
    border-bottom: 1px solid #444; 
    flex-shrink: 0; 
}

.guesslytics-header-row {
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
}

.guesslytics-buttons-section {
    display: flex;
    align-items: center;
    gap: 10px;
}

@media (max-width: 1500px) {
    .guesslytics-header {
        padding: 8px 12px;
    }
    
    .guesslytics-header-row {
        gap: 10px;
    }
    
    .guesslytics-buttons-section {
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }
    
    #guesslyticsTimer {
        font-size: 10px;
        white-space: nowrap;
    }
    
    #guesslyticsTimer.minimal-display .full-text {
        display: none;
    }
    
    #guesslyticsTimer.minimal-display .minimal-text {
        display: inline;
    }
    
    .guesslytics-title-wrapper .full-title {
        display: none;
    }
    
    .guesslytics-title-wrapper .short-title {
        display: inline !important;
    }
    
}

.guesslytics-title-wrapper { 
    display: flex; 
    align-items: center; 
    gap: 10px; 
    color: #fff; 
    font-size: 14px; 
}

.guesslytics-title-wrapper h3 {
    margin: 0;
}

.guesslytics-title-wrapper .short-title {
    display: none;
}

#guesslyticsStatus { 
    font-size: 12px; 
    color: #00BCD4; 
    display: flex; 
    align-items: center; 
    gap: 5px; 
}

#guesslyticsTimer { 
    font-size: 11px; 
    color: #888; 
}

#guesslyticsTimer.status-message {
    color: #00BCD4;
}

#guesslyticsTimer .minimal-text {
    display: none;
}

#graphWrapper { 
    display: flex; 
    flex-direction: column; 
    flex-grow: 1; 
    min-height: 0; 
    padding: 5px 10px 10px 5px; 
    box-sizing: border-box; 
}

#guesslyticsStats { 
    display: none; 
    flex-wrap: wrap; 
    justify-content: space-around; 
    padding: 5px 10px; 
    gap: 10px; 
    border-bottom: 1px solid #444; 
    margin-bottom: 5px; 
    flex-shrink: 0; 
}

.stat-item { 
    text-align: center; 
} 

.stat-item .value { 
    font-size: 16px; 
    font-weight: bold; 
    color: #fff; 
} 

.stat-item .label { 
    font-size: 11px; 
    color: #aaa; 
} 

.stat-item .value.positive { 
    color: #4CAF50; 
} 

.stat-item .value.negative { 
    color: #F44336; 
}

#guesslyticsCanvas { 
    flex-grow: 1; 
    min-height: 0; 
}

.chart-buttons { 
    display: flex; 
    gap: 5px; 
} 

.chart-buttons button { 
    background: #333; 
    border: 1px solid #555; 
    border-radius: 5px; 
    cursor: pointer; 
    color: white; 
    width: 24px; 
    height: 24px; 
    padding: 1px; 
}

.chart-buttons button:hover { 
    background: #444; 
} 

.chart-buttons button:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
}

/* Settings Panel Styles */
#guesslyticsSettingsPanel { 
    display: none; 
}

#guesslyticsSettingsOverlay { 
    position: fixed; 
    top: 0; 
    left: 0; 
    width: 100%; 
    height: 100%; 
    background: rgba(0,0,0,0.7); 
    z-index: 10000; 
}

#guesslyticsSettingsModal { 
    position: fixed; 
    top: 50%; 
    left: 50%; 
    transform: translate(-50%, -50%); 
    width: 400px; 
    background: #1c1c1c; 
    color: #fff; 
    padding: 25px; 
    border-radius: 8px; 
    z-index: 10001; 
    border: 1px solid #444; 
}

#guesslyticsSettingsModal h2 { 
    margin-top: 0; 
    text-align: center; 
}

.settings-section { 
    margin-bottom: 10px; 
} 

.settings-section h4 { 
    font-size: 14px; 
    margin: 0 0 8px; 
    border-bottom: 1px solid #444; 
    padding-bottom: 4px; 
}

.settings-row { 
    display: flex; 
    justify-content: space-between; 
    align-items: center; 
    margin-bottom: 8px; 
    font-size: 13px; 
}

#backfillDaysRow { 
    display: flex; 
}

#backfillDaysRow.hidden { 
    display: none !important; 
}

.settings-row input { 
    width: 60px; 
    text-align: center; 
    background: #333; 
    border: 1px solid #555; 
    color: #fff; 
    border-radius: 4px; 
    padding: 4px; 
}

.settings-row input[type="checkbox"] { 
    width: 16px; 
    height: 16px; 
    accent-color: #00BCD4; 
}

.graph-toggle-row { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
    gap: 5px 15px; 
} 

.graph-toggle-item { 
    display: flex; 
    align-items: center; 
    justify-content: space-between; 
}

.color-swatch { 
    width: 12px; 
    height: 12px; 
    border-radius: 3px; 
    margin-right: 8px; 
    border: 1px solid #888; 
}

.settings-actions { 
    display: flex; 
    gap: 10px; 
    margin-top: 10px; 
}

.settings-actions button { 
    flex-grow: 1; 
    padding: 8px; 
    border: none; 
    color: #fff; 
    font-weight: bold; 
    cursor: pointer; 
    border-radius: 4px; 
}

#clearDataBtn { 
    background: #c53030; 
} 

#resetSettingsBtn { 
    background: #717171; 
}

.settings-stats { 
    font-size: 13px; 
    color: #ccc; 
    border-top: 1px solid #444; 
    padding-top: 10px; 
    margin-top: 10px; 
}

.settings-footer { 
    text-align: center; 
    font-size: 11px; 
    color: #888; 
    margin-top: 10px; 
    border-top: 1px solid #444; 
    padding-top: 10px; 
}

.settings-footer a { 
    color: #aaa; 
    text-decoration: none; 
    display: inline-flex; 
    align-items: center; 
    gap: 4px; 
} 



/* Spinner Animation */
.gg-spinner { 
    animation: gg-spinner 1s linear infinite; 
    box-sizing: border-box; 
    position: relative; 
    display: inline-block; 
    transform: scale(0.7);
    width: 16px; 
    height: 16px; 
    border: 2px solid; 
    border-top-color: transparent; 
    border-radius: 50%; 
    margin-left: 4px;
    vertical-align: middle;
}

@keyframes gg-spinner { 
    0% { transform: rotate(0deg) } 
    100% { transform: rotate(360deg) } 
}
`;function v(e){GM_addStyle(_.replace(`rgba(28,28,28,0.15)`,`rgba(28,28,28,${e.backgroundOpacity/100})`))}let y=null,b=!1,x=null,S=null,C=!1;function w(e,t=``,n,r){let i=document.getElementById(`guesslyticsStatus`),a=document.getElementById(`guesslyticsTimer`),o=document.getElementById(`guesslyticsResyncBtn`);if(!(!i||!a||!o))if(o.disabled=e,e)S&&clearInterval(S),S=null,a.style.display=``,a.classList.add(`status-message`,`minimal-display`),a.innerHTML=`<span class="full-text">${t} <div class="gg-spinner"></div></span><span class="minimal-text"><div class="gg-spinner"></div></span>`,i.innerText=``;else{C=!0,a.style.display=``,a.classList.add(`status-message`,`minimal-display`);let e=t||`✓ Up-to-date`;a.innerHTML=`<span class="full-text">${e}</span><span class="minimal-text">✓</span>`,i.innerText=``,setTimeout(()=>{a&&a.classList.contains(`status-message`)&&(a.innerHTML=``,a.classList.remove(`status-message`,`minimal-display`),C=!1,n&&r&&N(n,r))},3e3)}}function T(e,t,n){s.log(`Setting up UI.`),Chart.defaults.font.family=`'ggFont', sans-serif`;let r=document.querySelector(`[class*="division-header_right"]`);if(!r||document.getElementById(`guesslyticsContainer`))return;let a=document.createElement(`div`);if(a.id=`guesslyticsContainer`,a.innerHTML=`
        <div class="guesslytics-header">
            <div class="guesslytics-header-row">
                <div class="guesslytics-title-wrapper">
                    <h3><span class="full-title">RATING HISTORY</span><span class="short-title">HISTORY</span></h3>
                    <span id="guesslyticsStatus"></span>
                </div>
                <div class="guesslytics-buttons-section">
                    <span id="guesslyticsTimer"></span>
                    <div class="chart-buttons">
                        <button id="guesslyticsResyncBtn" title="Manual Sync">${i.RESYNC}</button>
                        <button id="guesslyticsToggleBtn" title="Toggle Graph Size">${i.EXPAND}</button>
                        <button id="guesslyticsSettingsBtn" title="Settings">${i.SETTINGS}</button>
                    </div>
                </div>
            </div>
        </div>
        <div id="graphWrapper"><div id="guesslyticsStats"></div><canvas id="guesslyticsCanvas"></canvas></div>`,r.innerHTML=``,r.appendChild(a),!document.getElementById(`guesslyticsSettingsPanel`)){let e=document.createElement(`div`);e.id=`guesslyticsSettingsPanel`,document.body.appendChild(e)}document.getElementById(`guesslyticsToggleBtn`).onclick=()=>{b=!b,a.classList.toggle(`expanded`,b),document.getElementById(`guesslyticsToggleBtn`).innerHTML=b?i.COLLAPSE:i.EXPAND,document.getElementById(`guesslyticsStats`).style.display=b?`flex`:`none`,b&&E()},document.getElementById(`guesslyticsSettingsBtn`).onclick=()=>{document.getElementById(`guesslyticsSettingsPanel`).style.display=`block`,D(t)},document.getElementById(`guesslyticsResyncBtn`).onclick=async()=>{await n()},v(t)}async function E(){if(!b||!y)return;let e=document.getElementById(`guesslyticsStats`);if(!e)return;let t=await m(),n=y.scales.x.min,r=y.scales.x.max,i=t.overall.filter(e=>{let t=new Date(e.timestamp).getTime();return t>=n&&t<=r});if(i.length<2){e.innerHTML=`<div class="stat-item"><div class="label">Not enough data for stats</div></div>`;return}let a=i[i.length-1],o=i[i.length-2],s=a.rating-o.rating,c=`<div class="value ${s>=0?`positive`:`negative`}">${s>=0?`+`:``}${s}</div>`,l=0,u=0,d=0,f=0,p=i[0].rating;for(let e=1;e<i.length;e++){let t=i[e].rating-i[e-1].rating;t>0&&(l++,d+=t),t<0&&(u++,f+=t),i[e].rating>p&&(p=i[e].rating)}let h=i[i.length-1].rating-i[0].rating,g=i.length-1,_=g>0?(h/g).toFixed(2):`0`,v=`<div class="value ${Number(_)>=0?`positive`:`negative`}">${Number(_)>=0?`+`:``}${_}</div>`,x=l+u>0?Math.round(l/(l+u)*100):0,S=``;x>50&&(S=`positive`),x<50&&(S=`negative`);let C=`<div class="value ${S}">${x}%</div>`,w=l>0?(d/l).toFixed(2):`0`,T=u>0?(f/u).toFixed(2):`0`;e.innerHTML=`
        <div class="stat-item">${c}<div class="label">Last Change</div></div>
        <div class="stat-item">${v}<div class="label">Avg. Net/Game</div></div>
        <div class="stat-item">${C}<div class="label">Win Rate</div></div>
        <div class="stat-item"><div class="value positive">+${w}</div><div class="label">Avg Gain</div></div>
        <div class="stat-item"><div class="value negative">${T}</div><div class="label">Avg Loss</div></div>
        <div class="stat-item"><div class="value">${p}</div><div class="label">Peak Rating</div></div>`}async function D(e){s.log(`Rendering settings panel.`);let t=document.getElementById(`guesslyticsSettingsPanel`);if(!t)return;let r=await m(),o=await GM_getValue(n,{lastLimitDays:0,lastSyncTimestamp:null,ended:!1}),c={points:r.overall.length,oldest:r.overall.length>0?f(r.overall[0].timestamp):`N/A`,newest:r.overall.length>0?f(r.overall[r.overall.length-1].timestamp):`N/A`,lastSync:f(o?.lastSyncTimestamp??null)};t.innerHTML=`
        <div id="guesslyticsSettingsOverlay"></div>
        <div id="guesslyticsSettingsModal">
            <h2>Guesslytics Settings</h2>
            <div class="settings-section"><h4>Graphs</h4>
                <div class="graph-toggle-row">${Object.entries(a).map(([t,n])=>`<div class="graph-toggle-item"><label for="ds_${t}" style="display:flex;align-items:center;">
                    <span class="color-swatch" style="background:${n.color};"></span>${n.label}</label>
                    <input type="checkbox" id="ds_${t}" data-key="${t}" ${e.visibleDatasets[t]?`checked`:``}>
                    </div>`).join(``)}
                </div>
                <div class="settings-row"><label for="showAreaFill">Show Area Fill</label>
                <input type="checkbox" id="showAreaFill" ${e.showAreaFill?`checked`:``}></div></div>
            <div class="settings-section"><h4>Data Sync</h4>
                <div class="settings-row"><label for="backfillFull">Sync Full History</label>
                <input type="checkbox" id="backfillFull" ${e.backfillFullHistory?`checked`:``}></div>
                <div class="settings-row" id="backfillDaysRow"><label for="backfillDays">Sync history for (days)</label>
                <input type="number" id="backfillDays" value="${e.backfillDays}" min="1"></div></div>
            <div class="settings-section"><h4>Advanced</h4>
                <div class="settings-row"><label for="initialZoomDays">Initial Zoom (days)</label>
                <input type="number" id="initialZoomDays" value="${e.initialZoomDays||7}" min="1"></div>
                <div class="settings-row"><label for="autoRefreshInterval">Refresh Interval (sec)</label>
                <input type="number" id="autoRefreshInterval" value="${e.autoRefreshInterval}" min="10"></div>
                <div class="settings-row"><label for="apiRequestDelay">API Request Delay (ms)</label>
                <input type="number" id="apiRequestDelay" value="${e.apiRequestDelay}" min="50"></div>
                <div class="settings-row"><label for="bgOpacity">Background Opacity (%)</label>
                <input type="range" id="bgOpacity" value="${e.backgroundOpacity}" min="0" max="100"></div>
                <div class="settings-row"><label for="verboseLogging">Enable Verbose Logging</label>
                <input type="checkbox" id="verboseLogging" ${e.verboseLogging?`checked`:``}></div></div>
            <div class="settings-stats"><b>Games Tracked:</b> ${c.points} | <b>Last Sync:</b> ${c.lastSync}<br>
            <b>Date Range:</b> ${c.oldest} – ${c.newest}</div>
            <div class="settings-actions"><button id="resetSettingsBtn">Reset Settings</button>
            <button id="clearDataBtn">Clear All Data</button></div>
            <div class="settings-footer"><a href="https://github.com/Avanatiker/Guesslytics" target="_blank">
            ${i.GITHUB} Guesslytics v${GM_info.script.version} by Constructor</a></div>
        </div>`,document.getElementById(`guesslyticsSettingsOverlay`).onclick=()=>t.style.display=`none`;let l=e=>{if(e.key===`Escape`&&t.style.display===`block`){t.style.display=`none`,document.removeEventListener(`keydown`,l);let e=document.getElementById(`guesslyticsSettingsBtn`);e&&e.blur()}};document.addEventListener(`keydown`,l),document.dispatchEvent(new CustomEvent(`guesslyticsSettingsRendered`));let u=document.getElementById(`backfillDaysRow`),d=document.getElementById(`backfillFull`);u&&d&&(u.classList.toggle(`hidden`,e.backfillFullHistory),d.onchange=()=>{u.classList.toggle(`hidden`,d.checked)})}function O(e,t,n){return Object.keys(a).map(r=>{let i=a[r],o=n.getContext(`2d`).createLinearGradient(0,0,0,b?400:210);return o.addColorStop(0,`${i.color}55`),o.addColorStop(1,`${i.color}05`),{label:i.label,data:e[r].map(e=>({x:new Date(e.timestamp).getTime(),y:e.rating,gameId:e.gameId})),borderColor:i.color,borderWidth:r===`overall`?2.5:2,pointRadius:0,pointHoverRadius:6,pointHoverBorderColor:`#fff`,pointHoverBackgroundColor:i.color,fill:t.showAreaFill,backgroundColor:o,tension:0,stepped:!0,hidden:!t.visibleDatasets[r]}})}function k(){return{id:`crosshairLine`,afterDatasetsDraw:e=>{let{tooltip:t,ctx:n,chartArea:{top:r,bottom:i}}=e;if(t.getActiveElements()?.length>0){let e=t.getActiveElements()[0].element.x;n.save(),n.beginPath(),n.moveTo(e,r),n.lineTo(e,i),n.lineWidth=1,n.strokeStyle=`rgba(255, 255, 255, 0.5)`,n.stroke(),n.restore()}}}}function A(e,t,n,r,i,a){let o={animation:!1,responsive:!0,maintainAspectRatio:!1,interaction:{mode:`x`,intersect:!1},onClick:(e,t)=>{if(a.value||t.length===0)return;let{datasetIndex:n,index:r}=t[0],i=y.data.datasets[n].data[r].gameId;i&&window.open(`https://www.geoguessr.com/duels/${i}`,`_blank`)},plugins:{title:{display:!1},legend:{display:!1},tooltip:{position:`nearest`,backgroundColor:`rgba(0, 0, 0, 0.8)`,titleColor:`#fff`,bodyColor:`#fff`,borderColor:`rgba(255, 255, 255, 0.2)`,borderWidth:1,padding:10,displayColors:!0,callbacks:{title:e=>f(e[0].parsed.x),label:e=>`${e.dataset.label}: ${e.parsed.y}`}}},scales:{x:{type:`time`,time:{unit:`day`},ticks:{color:`#aaa`},grid:{color:`rgba(255,255,255,0.1)`}},y:{ticks:{color:`#aaa`},grid:{color:`rgba(255,255,255,0.1)`}}}};if(n?.min&&n?.max)o.scales.x.min=n.min,o.scales.x.max=n.max;else if(e.overall.length>0){let n=new Date(e.overall[e.overall.length-1].timestamp).getTime(),r=new Date(n);r.setDate(r.getDate()-(t.initialZoomDays||7)),o.scales.x.min=r.getTime(),o.scales.x.max=n}return o}function j(e,t,n,r,i){let a=!1,o=0,s=0,c=()=>{a&&(a=!1,e.style.cursor=`grab`,b&&E(),setTimeout(()=>i.value=!1,50))};e.onmousedown=t=>{a=!0,o=t.clientX,s=t.clientX,i.value=!1,e.style.cursor=`grabbing`},e.onmouseup=c,e.onmouseleave=c,e.onmousemove=e=>{if(!a)return;Math.abs(e.clientX-s)>5&&(i.value=!0);let c=e.clientX-o;o=e.clientX;let{scales:l}=y,u=l.x.min-(l.x.max-l.x.min)*(c/l.x.width),d=l.x.max-(l.x.max-l.x.min)*(c/l.x.width);if(t.overall.length>1&&n&&r){if(u<n){let e=n-u;u+=e,d+=e}if(d>r){let e=d-r;u-=e,d-=e}}y.options.scales.x.min=u,y.options.scales.x.max=d,y.update(`none`)},e.onwheel=e=>{e.preventDefault();let i=e.deltaY<0?.85:1.15,{scales:a}=y,o=a.x.getValueForPixel(e.offsetX),s=o-(o-a.x.min)*i,c=o+(a.x.max-o)*i;t.overall.length>1&&n&&r&&(s<n&&(s=n),c>r&&(c=r)),!(c-s<1e3*60*5)&&(y.options.scales.x.min=s,y.options.scales.x.max=c,y.update(`none`),b&&E())}}async function M(e,t){let n=!y||y.data.datasets.every(e=>e.data.length===0),r=y&&!n?{min:y.scales.x.min,max:y.scales.x.max}:null;y&&y.destroy();let i=document.getElementById(`guesslyticsCanvas`);if(!i)return;i.style.cursor=`grab`;let a=e.overall.map(e=>new Date(e.timestamp).getTime()),o=e.overall.length>0?Math.min(...a):null,s=e.overall.length>0?Math.max(...a):null,c={value:!1},l=O(e,t,i),u=A(e,t,r,o,s,c),d=k();y=new Chart(i,{type:`line`,data:{datasets:l},options:u,plugins:[d]}),j(i,e,o,s,c),b&&E()}function N(e,t){if(C)return;x&&clearInterval(x),S&&clearInterval(S);let n=p(),r=document.getElementById(`guesslyticsTimer`);if(!r)return;if(!n||e.autoRefreshInterval<=0){r.style.display=`none`;return}r.style.display=`inline`;let i=Date.now()+e.autoRefreshInterval*1e3,a=()=>{let e=Math.round((i-Date.now())/1e3);if(e>0){let t=Math.floor(e/60),n=e%60,i=t>0&&n>0?`(Sync in ${t}m ${n}s)`:`(Sync in ${e}s)`,a=`${e}s`;r.classList.add(`minimal-display`),r.innerHTML=`<span class="full-text">${i}</span><span class="minimal-text">${a}</span>`}};a(),x=window.setInterval(()=>{t(),i=Date.now()+e.autoRefreshInterval*1e3},e.autoRefreshInterval*1e3),S=window.setInterval(a,1e3)}let P=[],F=!1,I=0,L=15e3;async function R(){if(F||P.length===0)return;F=!0,I>0&&(I=Math.max(0,I-100));let e=P.shift();if(e)try{await e()}catch(e){c(e,`Request from queue failed`,{silent:!0})}F=!1,P.length>0&&setTimeout(R,100)}function z(e){return new Promise((t,n)=>{P.push(()=>e().then(t).catch(n)),F||R()})}async function B(e,t,n=3,r=1e3){s.log(`Executing request`,{url:e,baseApiRequestDelay:t,retries:n,retryDelay:r}),await d(t+I);for(let t=0;t<n;t++)try{return await new Promise((t,n)=>{GM_xmlhttpRequest({method:`GET`,url:e,responseType:`json`,timeout:2e4,onload:r=>{s.log(`Request onload`,{url:e,status:r.status}),r.status>=200&&r.status<300?t(r.response):r.status===429?n(Error(`API rate limit: ${r.status}`)):r.status>=500?n(Error(`API server error: ${r.status}`)):t(null)},onerror:e=>n(Error(`Network Error: ${JSON.stringify(e)}`)),ontimeout:()=>n(Error(`Request timed out`))})})}catch(i){let a=i.message?.includes(`429`);if(a){I=Math.min(L,(I||2e3)*2),s.log(`Rate limited. Increasing delay to ${I}ms.`);let e=document.getElementById(`guesslyticsStatus`);e&&(e.innerHTML=`Rate limited, retrying...`)}if(t===n-1)return c(i,`API request failed after all retries for ${e}`,{silent:!0}),null;let o=(a?Math.max(r,3e3):r)+I;s.log(`API request failed. Retrying in ${o/1e3}s...`,{error:i.message}),await d(o),r*=2}return null}function V(e,t){return z(()=>B(e,t))}function H(e){let t=[];s.log(`Extracting duel games from feed`,{entries:e});for(let n of e)try{if(n.type===7&&typeof n.payload==`string`){let e=JSON.parse(n.payload);t=t.concat(H(e))}else if(n.type===6){let e=typeof n.payload==`string`?JSON.parse(n.payload):n.payload,r=e.gameMode===`Duels`&&e.competitiveGameMode&&e.competitiveGameMode!==`None`;r&&t.push({time:n.time,payload:e})}}catch(e){c(e,`Failed to parse feed entry payload`,{silent:!0})}return s.log(`Finished extracting duel games`,{games:t}),t}async function U(e,t,n,r,i){s.log(`Processing games from feed entries`,{rawEntries:e});let a=await m(),o=i||new Set(a.overall.map(e=>e.gameId)),c=!1,l=!1,u=H(e);u.sort((e,t)=>new Date(t.time).getTime()-new Date(e.time).getTime());for(let e of u){let i=e.payload.gameId;if(o.has(i)){s.log(`Found existing game in database`,{gameId:i}),l=!0;continue}s.log(`Fetching duel data for game`,{gameId:i});let u=await V(`https://game-server.geoguessr.com/api/duels/${i}`,n);if(!u){s.log(`No duel data found for game`,{gameId:i});continue}let d=u.teams.flatMap(e=>e.players).find(e=>e.playerId===t),f=d?.progressChange?.rankedSystemProgress;if(f){s.log(`Found progress for game`,{gameId:i,progress:f});let t=g(f.gameMode),n={timestamp:e.time,gameId:i};for(let e in f.ratingAfter!=null&&a.overall.push({...n,rating:f.ratingAfter}),t&&f.gameModeRatingAfter!=null&&a[t].push({...n,rating:f.gameModeRatingAfter}),c=!0,o.add(i),a)a[e].sort((e,t)=>new Date(e.timestamp).getTime()-new Date(t.timestamp).getTime());await h(a),r&&await r()}}return{newDataAdded:c,foundExistingGame:l}}async function W(e,t,r){let{initialUrl:i=`https://www.geoguessr.com/api/v4/feed/private`,maxPages:a=500,cutoffDate:o,onGameProcessed:c}=r,l,u=!1,f=0,p=!1,h=!1,g=await m(),_=new Set(g.overall.map(e=>e.gameId)),v=await GM_getValue(n,{lastLimitDays:0,lastSyncTimestamp:null,ended:!1});s.log(`Starting feed processing`,{backfillStateEnded:v.ended,existingGamesCount:_.size,hasCutoffDate:!!o,cutoffDate:o?o.toISOString():`none`});let y=await V(i,t);if(!y)return s.log(`Failed to fetch initial feed page.`),{newDataAdded:u,reachedEnd:p,pagesProcessed:f};let b=await U(y.entries,e,t,c,_);if(u=b.newDataAdded,h=b.foundExistingGame,l=y.paginationToken,!l)return s.log(`Reached the end of the feed on the first page.`),p=!0,{newDataAdded:u,reachedEnd:p,pagesProcessed:f};if(h&&v.ended)return s.log(`Found existing game on first page and history end was reached. Stopping feed processing.`),{newDataAdded:u,reachedEnd:!0,pagesProcessed:f};if(o){let e=await m(),t=e.overall[0];if(t&&new Date(t.timestamp)<o)return s.log(`Reached cutoff date after first page. Stopping feed processing.`,{cutoffDate:o.toISOString(),oldestGameDate:t?new Date(t.timestamp).toISOString():`N/A`}),{newDataAdded:u,reachedEnd:!1,pagesProcessed:f}}for(;l&&f<a;){if(h&&v.ended){s.log(`Found existing game and history end was reached. Stopping feed processing.`);break}f++,s.log(`Processing feed page ${f}`);let n=await V(`https://www.geoguessr.com/api/v4/feed/private?paginationToken=${l}`,t);if(!n){s.log(`No feed data on page ${f}, stopping.`);break}let r=await U(n.entries,e,t,c,_);if(r.newDataAdded&&(u=!0),r.foundExistingGame&&(h=!0,s.log(`Found existing game on page`,{page:f,backfillStateEnded:v.ended}),v.ended)){s.log(`Found existing game and history end was reached. Stopping feed processing.`);break}if(o){let e=await m(),t=e.overall[0];if(t&&new Date(t.timestamp)<o){s.log(`Reached cutoff date. Stopping feed processing.`,{cutoffDate:o.toISOString(),oldestGameDate:t?new Date(t.timestamp).toISOString():`N/A`}),p=!1;break}}if(l=n.paginationToken,!l){s.log(`Reached the end of the feed.`),p=!0;break}await d(t)}return s.log(`Completed feed processing`,{pagesProcessed:f,newDataAdded:u,reachedEnd:p,foundExistingGame:h,backfillStateEnded:v.ended,stoppedDueToCutoff:o?`possibly`:`no`}),{newDataAdded:u,reachedEnd:p,pagesProcessed:f}}async function G(e,t,r,i,a,o={}){let{isBackfill:l=!1,logPrefix:u=`Sync`}=o;s.log(`${u}: Starting operation`),r(!0,`Syncing...`,i,a);try{let o=await GM_getValue(n,{lastLimitDays:0,lastSyncTimestamp:null,ended:!1}),c=i.backfillFullHistory?void 0:new Date;c&&(c.setDate(c.getDate()-i.backfillDays),s.log(`${u}: Using cutoff date`,{cutoffDate:c.toISOString(),backfillDays:i.backfillDays}));let d=await W(e,t,{cutoffDate:c,onGameProcessed:async()=>{let e=await m();await M(e,i);let t=e.overall[0];r(!0,`Syncing (${new Date(t.timestamp).toLocaleDateString()})...`,i,a)}}),{newDataAdded:f,reachedEnd:p,pagesProcessed:h}=d;s.log(`${u}: Operation completed`,{newDataAdded:f,reachedEnd:p,pagesProcessed:h,backfillStateEnded:o.ended});let g=await m();return r(!1,`✓ Up-to-date`,i,a),await GM_setValue(n,{lastLimitDays:i.backfillFullHistory?9999:i.backfillDays,lastSyncTimestamp:Date.now(),ended:l?p:p?!0:o.ended}),await M(g,i),d}catch(e){return c(e,`${u}: Operation failed`,{setSyncState:r,settings:i,callback:a}),{newDataAdded:!1,reachedEnd:!1,pagesProcessed:0}}}async function K(e,t,n,r,i){let a=await G(e,t,n,r,i,{isBackfill:!1,logPrefix:`Update check`});return a.newDataAdded}
/**
* Guesslytics - GeoGuessr Rating Tracker
* @author Constructor
* @license GPL-3.0+
*/
(async()=>{"use strict";let a={...r},o=!1,c=!1,d=null;async function f(){if(c||!d){s.log(`Sync request skipped (already in progress or no user ID).`);return}c=!0;try{await G(d,a.apiRequestDelay,w,a,h,{isBackfill:!0,logPrefix:`History backfill`})}finally{c=!1}}async function h(){if(!d||c)return;c=!0;let e=await K(d,a.apiRequestDelay,w,a,h);e&&await M(await m(),a),c=!1}function g(){if(window.location.pathname!==`/multiplayer`)return;let e=document.querySelector(`.status-box_actions__E_Ryq`);if(!e||document.getElementById(`guesslyticsGraphBtn`))return;e.style.display=`flex`,e.style.flexDirection=`row`,e.style.flexWrap=`nowrap`,e.style.justifyContent=`center`,e.style.gap=`10px`;let t=document.createElement(`div`);t.className=`flex_flex__Rxtgm flex_direction__Fa3Gs flex_gap__sXfgm flex_justify__2rGZO flex_align__PRoee`,t.style.cssText=`--direction: column; --gap: 6; --justify: flex-start; --align: center;`;let n=document.createElement(`div`);n.className=`status-box_actionButtonWrapper__4S6eN`;let r=document.createElement(`button`);r.id=`guesslyticsGraphBtn`,r.className=`status-box_actionButton__MbK3e`,r.innerHTML=i.CHART;let o=document.createElement(`span`);o.className=`status-box_buttonText__3IW4K`,o.textContent=`Statistics`,r.onclick=async()=>{s.log(`Statistics button clicked, restoring graph view`);let e=document.querySelector(`[class*="division-header_right"]`);if(!e){s.error(`Could not find target element for graph view`);return}e.innerHTML=``,d?(T(d,a,()=>f()),await M(await m(),a),await h()):s.error(`No user ID available for graph view`)},n.appendChild(r),t.appendChild(n),t.appendChild(o),e.appendChild(t),s.log(`Added Statistics button to victory screen`)}function _(){let i=async()=>{s.log(`Attaching settings panel handlers.`);let o={...a};document.getElementById(`clearDataBtn`).onclick=async()=>{confirm(`Are you sure you want to delete all stored rating data? This cannot be undone.`)&&(s.log(`Clearing all data.`),await GM_setValue(t,{overall:[],moving:[],noMove:[],nmpz:[]}),await GM_setValue(n,{lastLimitDays:0,lastSyncTimestamp:null,ended:!1}),window.location.reload())},document.getElementById(`resetSettingsBtn`).onclick=async()=>{confirm(`Are you sure you want to reset all settings to their defaults?`)&&(s.log(`Resetting settings.`),a={...r},await GM_setValue(e,a),await D(a),await i())};let c=document.querySelectorAll(`#guesslyticsSettingsModal input`);c.forEach(t=>{t.onchange=async()=>{s.log(`Setting changed: ${t.id}`),a.showAreaFill=document.getElementById(`showAreaFill`).checked,Object.keys(a.visibleDatasets).forEach(e=>{let t=document.getElementById(`ds_${e}`);t&&(a.visibleDatasets[e]=t.checked)}),a.backfillFullHistory=document.getElementById(`backfillFull`).checked,a.backfillDays=parseInt(document.getElementById(`backfillDays`).value,10),a.initialZoomDays=parseInt(document.getElementById(`initialZoomDays`).value,10),a.autoRefreshInterval=parseInt(document.getElementById(`autoRefreshInterval`).value,10),a.apiRequestDelay=parseInt(document.getElementById(`apiRequestDelay`).value,10),a.backgroundOpacity=parseInt(document.getElementById(`bgOpacity`).value,10),a.verboseLogging=document.getElementById(`verboseLogging`).checked,s.setLogging(a.verboseLogging),await GM_setValue(e,a);let r=document.getElementById(`guesslyticsContainer`);r&&(r.style.backgroundColor=`rgba(28,28,28,${a.backgroundOpacity/100})`),await M(await m(),a),N(a,h);let i=a.backfillFullHistory?9999:a.backfillDays,c=o.backfillFullHistory?9999:o.backfillDays,l=await GM_getValue(n,{lastLimitDays:0,lastSyncTimestamp:null,ended:!1}),u=a.backfillFullHistory&&!o.backfillFullHistory;u?(s.log(`Changed from limited to full history. Resetting ended flag and triggering new backfill.`),await GM_setValue(n,{...l,ended:!1}),await f()):i>c&&(l.ended&&(s.log(`Increased cutoff date. Resetting ended flag and triggering new backfill.`),await GM_setValue(n,{...l,ended:!1})),await f())}})};document.addEventListener(`guesslyticsSettingsRendered`,i)}async function v(){if(o)return;if(o=!0,s.log(`Guesslytics v${GM_info.script.version} Initializing...`),a=await l(),await u(()=>document.querySelector(`[class*="division-header_right"]`)!==null),d=p(),!d){s.log(`Could not get user ID. Aborting.`);return}T(d,a,()=>f()),await M(await m(),a),_();let e=await GM_getValue(n,{lastLimitDays:0,lastSyncTimestamp:null,ended:!1}),t=await m(),r=t.overall.length===0&&!e.lastSyncTimestamp&&!e.ended;r?(s.log(`No data found, starting initial history backfill.`),await f()):(s.log(`Found existing data, checking for recent updates.`),await h()),N(a,h)}let y=new MutationObserver(e=>{for(let t of e)if(t.type===`childList`){let e=window.location.pathname===`/multiplayer`,t=document.getElementById(`guesslyticsContainer`);e&&!t?v():e||(o=!1),e&&g();break}});y.observe(document.body,{childList:!0,subtree:!0}),window.location.pathname===`/multiplayer`&&v()})()})();