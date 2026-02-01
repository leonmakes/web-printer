# Web-to-PDF

Convert Markdown/HTML/URL to professional PDF documents, ideal for technical documentation, reports, and archiving.

## Theme Styles

This skill provides 5 carefully designed themes:

| Theme     | Style Description                        |
|-----------|------------------------------------------|
| default   | Apple design style, clean and elegant    |
| github    | GitHub README style, clear and readable  |
| academic  | Academic paper style, two-column layout  |
| magazine  | Magazine layout style, drop cap effect   |

---

## Code Highlighting Examples

### JavaScript

```javascript
// Convert Markdown to PDF
import { toPdf } from "./converter.js";

async function convert() {
  const result = await toPdf({
    inputPath: "README.md",
    outputPath: "output.pdf",
    style: "github",
    options: {
      format: "markdown"
    }
  });
  
  console.log(`PDF generated: ${result.pdfPath}`);
}
```

### Python

```python
def fibonacci(n: int) -> list[int]:
    """Generate Fibonacci sequence"""
    if n <= 0:
        return []
    if n == 1:
        return [0]
    
    sequence = [0, 1]
    while len(sequence) < n:
        sequence.append(sequence[-1] + sequence[-2])
    return sequence

# Example usage
print(fibonacci(10))  # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

---

## Table Examples

### CLI Parameters Overview

| Parameter       | Description                      | Default    |
|-----------------|----------------------------------|------------|
| `--input`       | Input file path (md/html)        | Required   |
| `--output`      | Output PDF path                  | Required   |
| `--style`       | Theme style                      | `default`  |
| `--format`      | Input format                     | `markdown` |
| `--no-html`     | Don't keep intermediate HTML     | `false`    |
| `--no-mermaid`  | Disable Mermaid pre-rendering    | `false`    |

---

## Blockquote Styles

> **Tip**: This skill supports Mermaid diagram pre-rendering.  
> Just use standard mermaid code blocks in your Markdown.

---

## List Styles

### Unordered List

- Supports Markdown syntax highlighting
- Automatically handles Mermaid diagrams
- Multiple preset themes available
- Print-ready output quality

### Ordered List

1. Install dependencies: `npm install`
2. Run Playwright: `pnpm exec playwright install chromium`
3. Execute conversion: `node scripts/converter.js --input doc.md --output output.pdf`

---

## Footnotes and Emphasis

This is a paragraph with **bold**, *italic*, `inline code`, and [links](https://example.com).

For scenarios requiring math formulas, you can use LaTeX syntax^[Additional configuration required].

---

## Separation and Typography

This skill focuses on **output quality**, with each theme carefully crafted:

- Clear font hierarchy
- Comfortable line height and spacing
- Code block syntax highlighting
- Beautiful tables and blockquotes

> High-quality PDF output, starting from Markdown.
