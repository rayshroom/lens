# Lens Chrome Extension

A lightweight "thinking lens" extension that offers neutral principles and prompts to help you reframe situations.

## Installation (Developer Mode)

since this is a local "unpacked" extension, you need to install it manually:

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `extension` folder inside this project directory (`/Users/ruiqiyu/Documents/otherProjects/chromeExtension/extension`).

## Usage

1. Click the Lens icon in your toolbar.
2. A random principle will appear.
3. Click **Reflect** to see guiding questions.
4. Click **New Lens** to get a fresh perspective (avoids repeats).
5. (Optional) Type your situation in the input box to journal (saved locally).

## Managing Content

The lenses are stored in `extension/src/data/lenses.en.json`.
You can add your own lenses by editing this file.

Format:
```json
{
    "id": "lens_unique_id",
    "principle": "Your principle here.",
    "prompts": ["Question 1?", "Question 2?"],
    "counter": "Counter question?",
    "tags": ["tag1"],
    "version": 1
}
```

## Privacy

- Local-only storage.
- No network requests.
- No analytics.
- Your inputs stay on your machine.
