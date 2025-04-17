// 跨平台词典/翻译/单词本 WebApp 项目脚手架

// 项目结构：
// ├── package.json
// ├── jest.config.js
// ├── next.config.js
// ├── tsconfig.json
// ├── public/
// │   ├── manifest.json
// │   └── icons/
// │       ├── icon-192.png
// │       └── icon-512.png
// ├── src/
// │   ├── pages/
// │   │   ├── _app.tsx
// │   │   └── index.tsx
// │   ├── components/
// │   │   ├── Dictionary.tsx
// │   │   ├── Translator.tsx
// │   │   └── Wordbook.tsx
// │   ├── utils/
// │   │   ├── mdxParser.ts
// │   │   └── api.ts
// │   └── __tests__/
// │       └── packageJson.test.ts

// package.json
{
  "name": "cross-platform-dict-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest"
  },
  "dependencies": {
    "next": "latest",
    "react": "latest",
    "react-dom": "latest",
    "next-pwa": "latest",
    "mdict-parser": "latest",
    "axios": "latest"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "ts-jest": "^29.0.0"
  }
}

// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
};

// next.config.js
const withPWA = require('next-pwa')({ dest: 'public' })
module.exports = withPWA({
  reactStrictMode: true,
  pwa: {
    disable: process.env.NODE_ENV === 'development',
    register: true,
    skipWaiting: true,
  },
})

// tsconfig.json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}

// public/manifest.json
{
  "name": "跨平台词典翻译",
  "short_name": "词典App",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#ffffff",
  "background_color": "#ffffff"
}

// src/utils/mdxParser.ts
import { MdictParser } from 'mdict-parser'

export async function parseMdx(file: File) {
  const arrayBuffer = await file.arrayBuffer()
  const dict = new MdictParser()
  await dict.open(arrayBuffer)
  return dict // 包含查词, 读样式, 读发音等API
}

// src/utils/api.ts
import axios from 'axios'

export async function translateText(text: string, engine: 'deepl' | 'gemini') {
  if (engine === 'deepl') {
    const res = await axios.post('https://api.deepl.com/v2/translate', {
      text,
      target_lang: 'EN',
      auth_key: process.env.NEXT_PUBLIC_DEEPL_KEY,
    })
    return res.data.translations[0].text
  } else {
    // Gemini AI 模型示例
    const res = await axios.post('https://api.gemini.example/translate', {
      input: text,
    }, {
      headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_GEMINI_KEY}` }
    })
    return res.data.output
  }
}

// src/components/Dictionary.tsx
import React, { useState } from 'react'
import { parseMdx } from '../utils/mdxParser'

export const Dictionary: React.FC = () => {
  const [dict, setDict] = useState<any>(null)
  const [query, setQuery] = useState('')
  const [entry, setEntry] = useState<string>('')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const d = await parseMdx(file)
      setDict(d)
    }
  }

  const lookup = async () => {
    if (!dict) return
    const result = await dict.lookup(query)
    setEntry(result?.html || '未找到')
  }

  return (
    <div>
      <input type="file" accept=".mdx" onChange={handleFile} />
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="输入单词"
      />
      <button onClick={lookup}>查词</button>
      <div dangerouslySetInnerHTML={{ __html: entry }} />
      {dict && <button onClick={() => dict.playPronunciation(query)}>🔊</button>}
    </div>
  )
}

// src/components/Translator.tsx
import React, { useState } from 'react'
import { translateText } from '../utils/api'
import deeplIcon from '../public/icons/deepl.png'
import geminiIcon from '../public/icons/gemini.png'

export const Translator: React.FC = () => {
  const [text, setText] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [engine, setEngine] = useState<'deepl' | 'gemini'>('deepl')

  const onTranslate = async () => {
    setLoading(true)
    const res = await translateText(text, engine)
    setResult(res)
    setLoading(false)
  }

  return (
    <div>
      <textarea
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="输入要翻译的文本"
      />
      <div>
        <label>
          <input
            type="radio"
            checked={engine === 'deepl'}
            onChange={() => setEngine('deepl')}
          />
          <img src={deeplIcon.src} alt="DeepL" width={24} /> DeepL
        </label>
        <label>
          <input
            type="radio"
            checked={engine === 'gemini'}
            onChange={() => setEngine('gemini')}
          />
          <img src={geminiIcon.src} alt="Gemini" width={24} /> Gemini
        </label>
      </div>
      <button onClick={onTranslate} disabled={loading}>
        {loading ? '翻译中...' : '翻译'}
      </button>
      <pre>{result}</pre>
    </div>
  )
}

// src/components/Wordbook.tsx
import React, { useEffect, useState } from 'react'

export const Wordbook: React.FC = () => {
  const [words, setWords] = useState<string[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('wordbook')
    if (stored) setWords(JSON.parse(stored))
  }, [])

  const addWord = (w: string) => {
    if (!words.includes(w)) {
      const newList = [w, ...words]
      setWords(newList)
      localStorage.setItem('wordbook', JSON.stringify(newList))
    }
  }

  return (
    <div>
      <h3>单词本</h3>
      <ul>
        {words.map(w => (
          <li key={w}>{w}</li>
        ))}
      </ul>
      {/* 在词典或翻译组件中调用 addWord('示例') 即可收藏 */}
    </div>
  )
}

// src/pages/_app.tsx
import React from 'react'
import type { AppProps } from 'next/app'
import '../styles/globals.css'

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

// src/pages/index.tsx
import React from 'react'
import { Dictionary } from '../components/Dictionary'
import { Translator } from '../components/Translator'
import { Wordbook } from '../components/Wordbook'

export default function Home() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">跨平台词典・翻译・单词本</h1>
      <div className="mb-6">
        <Dictionary />
      </div>
      <div className="mb-6">
        <Translator />
      </div>
      <Wordbook />
    </div>
  )
}

// src/__tests__/packageJson.test.ts
import packageJson from '../../package.json'

describe('package.json', () => {
  it('should have the correct project name', () => {
    expect(packageJson.name).toBe('cross-platform-dict-app')
  })
})
