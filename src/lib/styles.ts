// This file contains the CSS content from src/styles/main.css

// Define the CSS content as a regular string
export const css = `
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
`;

// Function to apply the CSS with dynamic values
export function applyStyles(settings: { backgroundOpacity: number }): void {
    // Apply the CSS with dynamic values
    GM_addStyle(css.replace('rgba(28,28,28,0.15)', `rgba(28,28,28,${settings.backgroundOpacity / 100})`));
}
