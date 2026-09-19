export type Segment = {
  kind: "text" | "inline" | "display";
  /** The maths or prose itself, with any delimiters stripped. */
  value: string;
  /** Where the segment, delimiters included, sits in the source text. */
  end: number;
};

/** `$$…$$`, `\[…\]`, a display environment, `$…$` or `\(…\)`, in that order. */
const MATH =
  /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\\begin\{([a-zA-Z]+\*?)\}[\s\S]*?\\end\{\1\}|\$[^$\n]+\$|\\\([\s\S]*?\\\)/g;

/** KaTeX ships neither `eqnarray` nor `tabular`, but renders both close enough. */
const ENVIRONMENTS: Record<string, string> = {
  eqnarray: "aligned",
  "eqnarray*": "aligned",
  tabular: "array",
};

export function katexEnvironments(latex: string) {
  return latex.replace(
    /\\(begin|end)\{([a-zA-Z]+\*?)\}/g,
    (raw, command: string, environment: string) =>
      environment in ENVIRONMENTS
        ? `\\${command}{${ENVIRONMENTS[environment]}}`
        : raw,
  );
}

function classify(raw: string, end: number): Segment {
  if (raw.startsWith("\\begin")) {
    return { kind: "display", value: katexEnvironments(raw), end };
  }

  const display = raw.startsWith("$$") || raw.startsWith("\\[");
  const delimiter = display || raw.startsWith("\\(") ? 2 : 1;

  return {
    kind: display ? "display" : "inline",
    value: katexEnvironments(raw.slice(delimiter, -delimiter)),
    end,
  };
}

/** Splits a statement into prose and the maths embedded in it. */
export function segments(text: string): Segment[] {
  const parts: Segment[] = [];
  let last = 0;

  for (const match of text.matchAll(MATH)) {
    const start = match.index ?? 0;
    if (start > last) {
      parts.push({ kind: "text", value: text.slice(last, start), end: start });
    }
    last = start + match[0].length;
    parts.push(classify(match[0], last));
  }

  if (last < text.length) {
    parts.push({ kind: "text", value: text.slice(last), end: text.length });
  }

  return parts;
}

/**
 * Shortens a statement to roughly `limit` characters without ever cutting a
 * formula in half, which would leave its delimiters stranded on screen.
 */
export function excerpt(statement: string, limit = 140) {
  const collapsed = statement.replace(/\s+/g, " ").trim();
  if (collapsed.length <= limit) return collapsed;

  let cut = 0;
  for (const part of segments(collapsed)) {
    if (part.end <= limit) {
      cut = part.end;
      continue;
    }
    // Prose can be cut mid-segment, on a word boundary; maths cannot.
    if (part.kind === "text") {
      cut = Math.max(cut, collapsed.slice(0, limit).replace(/\s+\S*$/, "").length);
    }
    break;
  }

  return `${collapsed.slice(0, cut).trimEnd()}…`;
}
