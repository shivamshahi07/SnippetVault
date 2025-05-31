interface LanguageInfo {
  name: string;
  extensions: string[];
  patterns: RegExp[];
}

const languagePatterns: LanguageInfo[] = [
  {
    name: "html",
    extensions: [".html", ".htm"],
    patterns: [
      /^\s*<!DOCTYPE\s+html>/i,
      /<(?:html|head|body|script|div|span)[>\s]/i,
    ],
  },
  {
    name: "css",
    extensions: [".css", ".scss", ".less"],
    patterns: [/^\s*[.#][\w-]+\s*{/, /@media\s+/, /^[\s\w-.#]+{[\s\w-:;]+}/],
  },
  {
    name: "javascript",
    extensions: [".js", ".jsx", ".mjs"],
    patterns: [
      /^\s*import\s+.*from\s+/,
      /^\s*export\s+/,
      /^\s*function\s+\w+\s*\(/,
      /^\s*const\s+\w+\s*=/,
      /^\s*let\s+\w+\s*=/,
      /^\s*var\s+\w+\s*=/,
    ],
  },
  {
    name: "typescript",
    extensions: [".ts", ".tsx"],
    patterns: [
      /^\s*interface\s+\w+/,
      /^\s*type\s+\w+/,
      /:\s*(?:string|number|boolean|any|void)\s*[,=)]/,
    ],
  },
  {
    name: "python",
    extensions: [".py"],
    patterns: [
      /^\s*def\s+\w+\s*\(/,
      /^\s*class\s+\w+[:\s]/,
      /^\s*import\s+\w+/,
      /^\s*from\s+\w+\s+import\s+/,
    ],
  },
  {
    name: "java",
    extensions: [".java"],
    patterns: [
      /^\s*public\s+class\s+/,
      /^\s*private\s+\w+/,
      /^\s*protected\s+\w+/,
      /^\s*package\s+[\w.]+;/,
    ],
  },
  {
    name: "json",
    extensions: [".json"],
    patterns: [/^\s*[{\[]/],
  },
  {
    name: "markdown",
    extensions: [".md", ".markdown"],
    patterns: [/^\s*#{1,6}\s+/, /^\s*[-*+]\s+/, /^\s*\d+\.\s+/],
  },
  {
    name: "yaml",
    extensions: [".yml", ".yaml"],
    patterns: [/^\s*[\w-]+:\s+/],
  },
  {
    name: "shell",
    extensions: [".sh", ".bash"],
    patterns: [/^\s*#!/, /^\s*\w+=["'].*["']/, /^\s*(?:if|for|while)\s+/],
  },
];

export function detectLanguage(code: string): string {
  // Remove comments to avoid false positives
  const cleanCode = code
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .replace(/\/\/.*/g, ""); // Remove single-line comments

  for (const lang of languagePatterns) {
    if (lang.patterns.some((pattern) => pattern.test(cleanCode))) {
      return lang.name;
    }
  }

  return "javascript"; // Default fallback
}

export function getFileExtension(language: string): string {
  const langInfo = languagePatterns.find((l) => l.name === language);
  return langInfo ? langInfo.extensions[0].slice(1) : language;
}

export const supportedLanguages = languagePatterns.map((lang) => ({
  name: lang.name,
  displayName: lang.name.charAt(0).toUpperCase() + lang.name.slice(1),
}));
