"use client";

import katex from "katex";

type MathProps = {
  text: string;
};

export default function Math({ text }: MathProps) {
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*\$)/g);

  return (
    <span className="math-content">
      {parts.map((part, index) => {
        if (part.startsWith("$$") && part.endsWith("$$")) {
          return (
            <span
              className="math-display"
              key={`${part}-${index}`}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(part.slice(2, -2), {
                  displayMode: true,
                  throwOnError: false,
                }),
              }}
            />
          );
        }

        if (part.startsWith("$") && part.endsWith("$")) {
          return (
            <span
              className="math-inline"
              key={`${part}-${index}`}
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(part.slice(1, -1), {
                  throwOnError: false,
                }),
              }}
            />
          );
        }

        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </span>
  );
}
