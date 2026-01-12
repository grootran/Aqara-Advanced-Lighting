/**
 * Panel translations for Aqara Advanced Lighting
 *
 * These translations are embedded directly in the compiled JavaScript
 * because Home Assistant's translation API endpoint for custom integrations
 * only serves standard sections (config, services, exceptions), not custom
 * sections like 'panel'.
 *
 * Translations are loaded from frontend_src/translations/panel.en.json
 * Future: Add support for additional languages by importing locale-specific files
 */

import panelTranslationsEn from '../translations/panel.en.json';

// Currently using English translations
// Future: Detect user locale and load appropriate translation file
export const PANEL_TRANSLATIONS = panelTranslationsEn;
