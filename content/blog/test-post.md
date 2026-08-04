---
title: Test Post
date: 1970-01-01T00:00:00.000Z
summary: >-
  Heading Level 1 Heading Level 2 Heading Level 3 Heading Level 4 Heading Level
  5 Heading Level 6 This is a paragraph with **bold text**, *italic text*, and
  ***both bold and italic***. Lorem ipsum dolor sit amet, consectetur adipiscing
  elit. Sed do eiusmod tempor incididunt ut labore et dolore...
slug: test-post
editorial_review:
  reviewed: true
  date: 1970-01-01T00:00:00.000Z
  personally_specific: true
  intellectually_honest: true
  generous_to_subjects: true
  observation_separated_from_fact: true
  date_bound_advice_dated: true
  opinions_earned: true
  rights_cleared: true
---

# Heading Level 1

## Heading Level 2

### Heading Level 3

#### Heading Level 4

##### Heading Level 5

###### Heading Level 6

This is a paragraph with **bold text**, *italic text*, and ***both bold and italic***. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Here is some **bold with _nested italics_ inside it**, and a `small inline code snippet` alongside regular text. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

---

### Lists

#### Unordered List

- First item with a longer explanation
- Second item containing `inline code`
  - Nested sublist entry one
  - Nested sublist entry two
    - Deeply nested content here
- Third final item

#### Ordered List

1. Alpha entry with bold text
2. Beta entry with *italic emphasis*
3. Gamma entry that spans multiple lines of text and continues reading naturally
4. Delta entry as the last one

### Definition List

Term One
: Definition for the first term, explaining its meaning in detail.
Term Two
: Definition for the second term, which is shorter than the first.
Term Three
: Definition three
: With a second paragraph of definition text.

---

### Blockquotes

> This is a simple blockquote with a single paragraph. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
> Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

#### Nested Blockquote

> The first level of nesting in a blockquote.
>> Here is a nested deeper quote showing the double angle bracket pattern.
>>> And one more level deep with triple angle brackets.

#### Blockquote with Citation

> All things being equal, the best system is the one that maximizes utility and minimizes suffering.
> — Author Name, *Famous Book Title*

#### Multiple Blockquotes

> First quote demonstrates citation formatting.

> Second standalone blockquote shows paragraph breaks without inline citations.

---

### Code Blocks

Inline code: `const x = 42;`

```javascript
// JavaScript code block example
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10)); // Output: 55
```

```css
/* CSS code block example */
.post-list {
  display: grid;
  gap: 2rem;
  list-style: none;
}

.post-list li a {
  text-decoration: none;
  border-bottom: 1px solid var(--color-primary);
}
```

```html
<!-- HTML code block example -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Example</title>
</head>
<body>
  <h1>Hello, World!</h1>
</body>
</html>
```

### Fenced Code with No Language

```
Just plain text in a fenced block.
No syntax highlighting applied.
This is useful for terminal output or logs.
```

---

### Tables

| Column One | Column Two | Column Three |
|:-----------|:----------:|-------------:|
| Left aligned data | Centered value | Right-aligned number |
| Another entry | With more text | 12345 |
| Final row | Demo purpose | 99.9% |

| Header One | Header Two | Header Three | Header Four |
|:-----------|:----------:|:-------------|:-----------:|
| Alpha | Beta | Gamma | Delta |
| Epsilon | Zeta | Eta | Theta |
| Iota | Kappa | Lambda | Mu |

---

### Links

#### Inline Links

[Dean L. Young](https://deanlyoung.com) — an inline link to the homepage.

[About page](/about/) — a relative link to the about section.

[Craft page](/craft/) — another internal page link.

#### Auto-Links

<https://deanlyoung.com> — displayed as an email-like URL.
<mailto:hello@deanlyoung.com> — clickable mailto link.

#### Reference Links

This is a [reference-style link][ref1] that points to a defined URL elsewhere.

Here is another [referenced link][ref2] with different content.

[ref1]: https://deanlyoung.com/craft "Craft Page"
[ref2]: https://deanlyoung.com/resume "Resume Page"

#### Footnote Links

This sentence has a footnote reference[^fn1]. Another claim[^fn2] requires supporting evidence.

[^fn1]: This is the footnote text that explains the citation detail.
[^fn2]: Supporting reference goes here with full attribution.

---

### Images

#### Inline Image Syntax

![Alternative text description](/assets/dly-logo-color-1024.png)

#### Image with Title

![Another logo](/assets/dly-logo-color-16.png "Logo 16px")

---

### Horizontal Rules

Simple divider:

---

Another divider variant:

***

And a third using asterisks:

* * *

---

### Emphasis and Inline Formatting

This text has **strong emphasis** on key points. This has *emphatic text* for nuance. Use ***triple stars*** for extreme importance. Mixed **bold with _nested italic_ emphasis**. You can also use `monospace` for code references inline.

Use ~~strikethrough~~ to indicate deleted text (if your renderer supports it).

---

### Tables with Complex Content

| Feature | Description | Status |
|:--------|:------------|:------:|
| **Blog System** | Markdown-based blog posts | ✅ Active |
| *Craft Page* | Author quotes & insights | ✅ Active |
| ~~Draft Section~~ | Work in progress | 🚧 Draft |
| `Code Block` | Fenced code rendering | ✅ Active |

### Complex Nested Structure

1. **First ordered item** with nested details:
   - Sub-item A
     1. Nested order one
     2. Nested order two
   - Sub-item B with `code` and **bold**
2. **Second ordered item**
3. Third and final item in this list

This concludes the test post content covering all major Markdown formatting elements including headings, paragraphs, bold, italic, code blocks, blockquotes, lists (ordered, unordered, definition, nested), tables, links (inline, reference, auto), images, horizontal rules, strikethrough, emphasis nesting, and complex nested structures.

