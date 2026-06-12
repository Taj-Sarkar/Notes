import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import Prism from 'prismjs';

// Import CSS for prism
import 'prismjs/themes/prism-tomorrow.css';

// Import required Prism languages for syntax highlighting
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';

interface CodeBlockProps {
  language: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Run Prism highlighting for code blocks rendered dynamically
    Prism.highlightAll();
  }, [value, language]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const displayLang = language ? language.toLowerCase() : 'text';
  const labelLang = language ? language.toUpperCase() : 'CODE';

  return (
    <div className="relative my-4 border border-zinc-800 bg-zinc-950/70 font-mono text-xs md:text-sm flex flex-col" id={`code-block-${labelLang}`}>
      <div className="flex justify-between items-center px-4 py-1.5 border-b border-zinc-800 bg-zinc-900/90 text-zinc-400 text-[10px] tracking-wider select-none font-bold">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
          <span>{labelLang}</span>
        </div>
        <button
          onClick={handleCopy}
          className="hover:text-white transition-colors duration-150 flex items-center gap-1 cursor-pointer bg-zinc-950/40 px-2 py-0.5 border border-zinc-800 hover:border-zinc-500 font-mono text-[9px]"
        >
          {copied ? 'COPIED!' : 'COPY'}
        </button>
      </div>
      <div className="overflow-x-auto p-4 leading-relaxed font-mono">
        <pre className={`language-${displayLang} !m-0 !p-0 !bg-transparent`}>
          <code className={`language-${displayLang} !bg-transparent !p-0 !m-0 font-mono`}>
            {value}
          </code>
        </pre>
      </div>
    </div>
  );
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  useEffect(() => {
    Prism.highlightAll();
  }, [content]);

  return (
    <div className="markdown-body text-zinc-100 leading-relaxed font-mono text-sm max-w-none">
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const isInline = !className;
            
            if (isInline) {
              return (
                <code className="bg-zinc-900 border border-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded-none font-mono text-xs" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                language={lang}
                value={String(children).replace(/\n$/, '')}
              />
            );
          },
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-6 mb-3 text-white tracking-tight border-b border-zinc-800 pb-1 flex items-center gap-2">
              <span className="text-zinc-500">#</span> {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-5 mb-2 text-white flex items-center gap-2">
              <span className="text-zinc-600">##</span> {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mt-4 mb-2 text-zinc-300 flex items-center gap-2">
              <span className="text-zinc-700">###</span> {children}
            </h3>
          ),
          p: ({ children }) => <p className="mb-3 text-zinc-300 text-sm">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-zinc-500 pl-4 my-2 italic text-zinc-400 bg-zinc-900/30 py-1">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => <ul className="list-none pl-4 mb-3 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>,
          li: ({ children }) => (
            <li className="text-zinc-300 text-sm flex items-start gap-2">
              <span className="text-zinc-600 select-none mt-1">»</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 border border-zinc-800">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-300">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-zinc-800/50">{children}</tbody>,
          tr: ({ children }) => <tr className="hover:bg-zinc-900/30">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-2 font-bold">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 text-zinc-400">{children}</td>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              referrerPolicy="no-referrer"
              className="text-white underline hover:text-zinc-300 transition-colors"
            >
              {children}
            </a>
          ),
        }}
      >
        {content || '*No content*'}
      </ReactMarkdown>
    </div>
  );
};
