/**
 * Entry point for Aqara Advanced Lighting panel
 */

import './aqara-panel';
import './segment-selector';

// Panel configuration
const PANEL_NAME = 'aqara-advanced-lighting-panel';

// Check if we're running in Home Assistant context
if (customElements.get(PANEL_NAME)) {
  console.log(`${PANEL_NAME} already registered`);
} else {
  console.log(`Registering ${PANEL_NAME}`);
}

// Make panel available to Home Assistant
if ((window as any).customPanel) {
  (window as any).customPanel(PANEL_NAME);
}
