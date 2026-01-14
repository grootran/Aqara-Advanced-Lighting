# Frontend Panel Translations

This directory contains translations for the Aqara Advanced Lighting frontend panel UI.

## Why Separate from Backend Translations?

Home Assistant's translation API for custom integrations only serves standard sections like `config`, `services`, and `exceptions`. Custom sections like `panel` are not supported by the API endpoint.

Therefore, panel translations must be embedded directly in the compiled JavaScript bundle.

## Current Language Support

- `panel.en.json` - English (default)

## Adding New Languages

To add support for additional languages:

1. Create a new translation file following the naming pattern `panel.{locale}.json`
   - Example: `panel.fr.json` for French
   - Example: `panel.de.json` for German
   - Example: `panel.es.json` for Spanish

2. Copy the structure from `panel.en.json` and translate all values

3. Update `src/panel-translations.ts` to import and select the appropriate language:
   ```typescript
   import panelTranslationsEn from '../translations/panel.en.json';
   import panelTranslationsFr from '../translations/panel.fr.json';
   // ... import other languages

   // Detect user's locale from Home Assistant
   const userLocale = (hass?.language || 'en').substring(0, 2);

   const translations = {
     en: panelTranslationsEn,
     fr: panelTranslationsFr,
     // ... add other languages
   };

   export const PANEL_TRANSLATIONS = translations[userLocale] || panelTranslationsEn;
   ```

4. Rebuild the frontend: `npm run build`

## Translation String Format

Translation strings support placeholders using curly braces:
- `{count}` - Numeric values
- `{value}` - Generic values
- `{entity_id}`, `{device}`, etc. - Named parameters

Example:
```json
"lights_selected": "{count} light selected",
"color_temperature_label": "Color temperature ({value}K)"
```

## Maintaining Translations

When adding new UI features:

1. Add the English translation to `panel.en.json`
2. Add corresponding entries to all other language files (or mark as TODO)
3. Rebuild the frontend
4. Test the new strings in the panel UI
