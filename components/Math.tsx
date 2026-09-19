"use client";

import katex from "katex";
import { segments } from "@/lib/latex";

type MathProps = {
  text: string;
};

type MacroContext = {
  consumeArgs: (count: number) => { text: string }[][];
};

/** `\multicolumn{n}{spec}{body}`: KaTeX can't span cells, so keep the body. */
function multicolumn(context: MacroContext) {
  context.consumeArgs(2);
  const [body] = context.consumeArgs(1);
  return body
    .reverse()
    .map((token) => token.text)
    .join("");
}

/** AoPS statements use LaTeX commands KaTeX doesn't ship. */
const MACROS = {
  "\\mbox": "\\text",
  // `\Aboxed` boxes across an alignment point, which `\boxed` can't do.
  "\\Aboxed": "#1",
  "\\hfill": "",
  "\\break": "",
  "\\multicolumn": multicolumn,
};

/** Renders prose with its `$…$`, `\(…\)`, `$$…$$`, `\[…\]` and environments typeset. */
export default function Math({ text }: MathProps) {
  return (
    <span className="math-content">
      {segments(text).map((part, index) => {
        const key = `${part.value}-${index}`;

        if (part.kind === "text") return <span key={key}>{part.value}</span>;

        return (
          <span
            className={part.kind === "display" ? "math-display" : "math-inline"}
            key={key}
            dangerouslySetInnerHTML={{
              __html: katex.renderToString(part.value, {
                displayMode: part.kind === "display",
                macros: MACROS,
                throwOnError: false,
              }),
            }}
          />
        );
      })}
    </span>
  );
}
