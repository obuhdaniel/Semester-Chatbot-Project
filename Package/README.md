# 🧠 ollama-web-ui

A lightweight and beautiful React component library for interacting with locally hosted Ollama models. Built with Vite, Tailwind CSS, and Lucide React icons.

> ⚡ Rapidly build AI chat interfaces using minimal setup.

---

## ✨ Features

- 🧩 Prebuilt chat UI components
- 💨 Tailwind CSS styling out of the box
- 🧠 Designed for Ollama model integrations
- 🧑‍🎨 Lucide icons for a modern look
- ⚛️ React 18+ support

---

## 📦 Installation

Make sure you have `react`, `react-dom`, `axios`, `tailwindcss`, and `lucide-react` installed in your project.

```bash
npm install ollama-web-ui
```

Or with Yarn:

```bash
yarn add ollama-web-ui
```

> 💡 This package relies on peer dependencies. Install them if you haven't:

```bash
npm install react react-dom axios tailwindcss @tailwindcss/vite lucide-react
```

---

## 🔧 Usage

```jsx
import React from 'react';
import OllamaUi from 'ollama-web-ui';

function App() {
  return (
    <div className="p-4">
      <OllamaUi />
    </div>
  );
}
```

---

## 🎨 Tailwind CSS Setup

Ensure Tailwind is configured in your project. Minimal setup:

```bash
npm install tailwindcss @tailwindcss/vite
npx tailwindcss init -p
```

Add this to your `vite.config.js`:

```js

import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
})
```

Then include the Tailwind styles in your main `index.css` or `App.css`:

```css
@import "tailwindcss";
```

---

## 🧪 Local Development

If you're developing locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## 🤝 Contributing

Feel free to open issues or pull requests to improve or extend the library!

---

## 📄 License

[MIT](./LICENSE) © Obuh Daniel

---

## 💬 Credits

This project is inspired by the need for a lightweight, easy-to-use chat interface for locally running LLMs like those powered by [Ollama](https://ollama.com/).