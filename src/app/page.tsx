'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import './globals.css';

type ExplainResult = {
  plain: string;
  sec30: string;
  kid10: string;
  manager: string;
  linkedin: string;
  tweet: string;
};

type SectionKey = keyof ExplainResult;

const SECTION_META: { key: SectionKey; title: string; subtitle: string }[] = [
  { key: 'plain', title: 'Plain English', subtitle: 'Simple, clear explanation' },
  { key: 'sec30', title: '30-second version', subtitle: 'Fast, punchy summary' },
  { key: 'kid10', title: 'Like I am 10', subtitle: 'Kid-friendly clarity' },
  { key: 'manager', title: 'For a non-tech manager', subtitle: 'Business-safe wording' },
  { key: 'linkedin', title: 'LinkedIn post', subtitle: 'Ready to paste' },
  { key: 'tweet', title: 'Tweet', subtitle: 'Short and sharp' },
];

async function copyToClipboard(text: string): Promise<void> {
  // Modern clipboard API (requires secure context)
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  
  // Fallback for older browsers or non-secure contexts
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export default function HomePage() {
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const [input, setInput] = useState('');
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<SectionKey | null>(null);

  const canExplain = useMemo(() => input.trim().length >= 3 && !isLoading, [input, isLoading]);

  useEffect(() => {
    setResult(null);
    setErrorMsg(null);
    setCopiedKey(null);
  }, [input]);

  async function onExplain() {
    setErrorMsg(null);
    setCopiedKey(null);
    setIsLoading(true);
  
    try {
      const resp = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input }),
      });
  
      const data = await resp.json();
  
      if (!resp.ok) {
        throw new Error(data?.error ?? 'Failed to generate explanation.');
      }
  
      setResult(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e: unknown) {
      const error = e as Error;
      setErrorMsg(error.message ?? 'Something went wrong. Try again.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function onCopy(key: SectionKey) {
    if (!result) return;
    await copyToClipboard(result[key]);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1200);
  }

  function onUseExample(example: string) {
    setInput(example);
    setResult(null);
    setErrorMsg(null);
    setCopiedKey(null);
  }

  function onClear() {
    setInput('');
    setResult(null);
    setErrorMsg(null);
    setCopiedKey(null);
  }

  const examples = [
    'Explain inflation',
    'Explain Bitcoin',
    'Explain React hooks',
    'Explain startup equity',
    'Explain what an API is',
  ];

  return (
    <main className="min-h-screen w-full text-neutral-100 bg-[#1a1a1a]" style={{
      background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 130, 0.3), transparent), #1a1a1a'
    }}>
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        {/* Header */}
        <header className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-3 py-1 text-xs text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-neutral-400" />
            <span>Understand anything in 30 seconds</span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Explain Like I’m Busy
          </h1>

          <p className="text-sm leading-relaxed text-neutral-300 sm:text-base">
            Paste a topic. Get six versions: plain English, 30-second summary, kid mode, manager mode, LinkedIn post, and a tweet.
          </p>
        </header>

        {/* Input */}
        <section className="gradient-border mt-8 rounded-2xl p-4 sm:p-5 bg-black">
          <label className="mb-2 block text-sm font-medium text-neutral-200">
            What do you want explained?
          </label>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Explain quantum computing"
            className="min-h-[120px] w-full resize-y rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-600"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <button
              type="button"
              onClick={onClear}
              className="inline-flex items-center justify-center rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={onExplain}
              disabled={!canExplain}
              className="inline-flex items-center justify-center rounded-xl bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-950 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? 'Explaining…' : 'Explain like I’m busy 🚀'}
            </button>
          </div>

          {errorMsg ? (
            <p className="mt-3 text-sm text-red-300">{errorMsg}</p>
          ) : null}
        </section>

        <div className="mt-3">
        <div className="flex flex-wrap gap-2">
              {examples.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => onUseExample(ex)}
                  className="rounded-full border border-neutral-800 bg-neutral-950/40 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-900"
                >
                  {ex}
                </button>
              ))}
            </div>
        </div>

        {/* Results */}
        {
          result && (
            <section ref={resultsRef} className="mt-6 space-y-4">
              {SECTION_META.map((s) => {
                const text = result?.[s.key] ?? '';
                const isCopied = copiedKey === s.key;

                return (
                  <div
                    key={s.key}
                    className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold">{s.title}</h2>
                        <p className="mt-1 text-xs text-neutral-400">{s.subtitle}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => onCopy(s.key)}
                        disabled={!result}
                        className="rounded-xl border border-neutral-800 bg-neutral-950/40 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-40"
                        title={result ? 'Copy to clipboard' : 'Generate an explanation first'}
                      >
                        {isCopied ? 'Copied ✓' : 'Copy'}
                      </button>
                    </div>

                    <div className="mt-3 rounded-xl border border-neutral-800 bg-neutral-950/40 p-3">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-100">{text}</p>
                    </div>
                  </div>
                );
              })}
            </section>
          )
        } 
        {
          !result && (
            <section ref={resultsRef} className="mt-6 space-y-4">
              <p className="text-sm text-neutral-500">Your result will appear here.</p>
            </section>
          )
        }
      </div>
    </main>
  );
}