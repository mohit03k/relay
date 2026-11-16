---
name: Relay
description: A clear handoff desk for client email.
colors:
  navigation-deep: "#202f60"
  navigation-blue: "#294078"
  navigation-hover: "#344777"
  navigation-active: "#e8ecf4"
  review-citron: "#e0ea92"
  review-citron-hover: "#d1e277"
  ink: "#0d1322"
  muted-ink: "#4d5870"
  warm-ground: "#faf9f6"
  white: "#ffffff"
  hairline: "#dedfdc"
  control-border: "#aeb8c8"
  suggestion-surface: "#eaedf4"
  focus: "#83a7ff"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next, Arial, sans-serif"
    fontSize: "clamp(25px, 2.25vw, 37px)"
    fontWeight: 700
    lineHeight: 1.16
    letterSpacing: "-.03em"
  headline:
    fontFamily: "Atkinson Hyperlegible Next, Arial, sans-serif"
    fontSize: "clamp(20px, 1.7vw, 25px)"
    fontWeight: 700
    lineHeight: 1.16
    letterSpacing: "-.025em"
  title:
    fontFamily: "Atkinson Hyperlegible Next, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.15
  body:
    fontFamily: "Atkinson Hyperlegible Next, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Atkinson Hyperlegible Next, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
rounded:
  marker: "4px"
  compact: "5px"
  control: "6px"
  nav: "7px"
  dialog: "12px"
  round: "50%"
spacing:
  xxs: "5px"
  xs: "8px"
  sm: "10px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "27px"
components:
  button-primary:
    backgroundColor: "{colors.navigation-blue}"
    textColor: "{colors.white}"
    rounded: "{rounded.control}"
    padding: "6px 14px"
    height: "34px"
  button-primary-hover:
    backgroundColor: "#1b3065"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "6px 14px"
    height: "34px"
  button-review:
    backgroundColor: "{colors.review-citron}"
    textColor: "{colors.ink}"
    rounded: "{rounded.nav}"
    padding: "7px 14px"
  nav-active:
    backgroundColor: "{colors.navigation-active}"
    textColor: "{colors.navigation-deep}"
    rounded: "{rounded.nav}"
    padding: "8px 10px"
  field:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    height: "38px"
  responsibility-review:
    backgroundColor: "{colors.review-citron}"
    textColor: "#19220a"
    rounded: "{rounded.control}"
    padding: "5px 8px"
  suggestion-card:
    backgroundColor: "{colors.suggestion-surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 14px"
---

# Design System: Relay

## Overview

**Creative North Star: "The Handoff Desk"**

Relay feels like a calm, dependable desk for decisions about client email. Its civic wayfinding character comes from a deep blue frame, plainly labelled actions, aligned records, and a visible route from suggestion to ownership. The approved revision makes the working area warmer and the blue quieter than the initial comp.

The interface is compact and information rich without ornamental noise. Warm off-white separates the working ground from white records and detail surfaces. Citron appears where ownership needs review, so the exception stays easy to find. The navigation frame and action controls carry most of the visual weight.

**Key Characteristics:**
- Deep blue navigation with a warm off-white workspace.
- Compact, highly legible sans typography and orderly rows.
- Soft citron reserved for review and uncertain ownership.
- Thin borders, tonal layers, and almost no resting shadows.

## Colors

The palette is a restrained blue and warm neutral system with one signal color. The frontmatter values are the source of truth.

### Primary
- **Deep Navigation Blue** (`navigation-deep`): the persistent navigation field, giving the app a stable frame.
- **Action Blue** (`navigation-blue`): the utility bar, primary actions, completed route steps, and checked markers.
- **Hover Blue** (`navigation-hover`): feedback inside dark navigation.

### Secondary
- **Soft Citron** (`review-citron`): the review count and review responsibility badge. Its hover value is `review-citron-hover`.

### Neutral
- **Ink** (`ink`): principal text and high contrast decision labels.
- **Muted Ink** (`muted-ink`): secondary text and timestamps.
- **Warm Ground** (`warm-ground`): the list workspace behind the white rows.
- **White** (`white`): rows, detail pane, fields, and modal surfaces.
- **Hairline** (`hairline`): quiet structural dividers.
- **Control Border** (`control-border`): form and action outlines.
- **Blue Mist** (`navigation-active`, `suggestion-surface`): selected navigation and explanatory surfaces.
- **Focus Blue** (`focus`): the keyboard focus outline.

**The Signal Rule.** Use citron for unresolved review states; use blue for navigation, ownership, and action. Keep the signal rare enough to scan instantly.

## Typography

**Display Font:** Atkinson Hyperlegible Next, with Arial and sans-serif fallbacks.
**Body Font:** The same family. No separate decorative or monospace face is established.

**Character:** Clear, sturdy, and compact. Bold labels create hierarchy within dense records; regular body text keeps explanations readable.

### Hierarchy
- **Display:** The responsive, bold greeting scale in the frontmatter; reserved for top level workspace headings.
- **Headline:** The responsive, bold detail title scale; used for the selected item or a major panel heading.
- **Title:** 18px bold with tight leading for a decisive recommendation inside a card.
- **Body:** 13px regular with 1.4 line height for thread text; introductions and suggestion copy rise to 15px where they need a gentler reading pace.
- **Label:** 12px bold for table headers, controls, small section labels, and metadata. Dense responsibility badges use 11px bold.

**The Scan Rule.** Put the decision bearing phrase in bold, then keep supporting context lighter and smaller. Use tabular numerals for counts and ages.

## Layout

The desktop shell uses a 206px navigation rail and a two pane work area. The left pane holds the heading, search and filters, and a dense five column conversation table. The right pane starts with the citron review banner and holds the selected conversation beneath it. The list uses compact 50px minimum rows and thin dividers. At narrower widths, the rail compresses to an icon rail before becoming a drawer.

At 700px and below, the rail becomes a slide-in drawer and the list and detail become separate full-height views. A compact blue header keeps the prototype disclosure visible. Rows reflow into a two-column summary with owner and age on the right; the detail keeps the same action hierarchy and a back control. Preserve information hierarchy when the grid collapses instead of shrinking desktop columns.

## Elevation & Depth

Relay is flat at rest. White rows and detail surfaces sit against a warm ground, while blue mist marks the selected record and suggestion. Borders establish separation. Shadows appear only on the mobile navigation drawer (`8px 0 24px #06113538`) and the authentication dialog (`0 15px 42px #06134745`), where an overlay must sit visibly above the workspace.

**The Flat Desk Rule.** Use tonal layers and hairlines for ordinary content; reserve shadow for a surface that actually overlays another.

## Shapes

Controls and explanatory cards have gently curved 6px corners. Navigation items and the review count use 7px; small attachments use 5px; a dialog uses 12px. Circular avatars and route nodes are the exception. Table rows stay square edged and divided by lines. Form borders are thin, with a 3px focus outline offset by 2px for keyboard interaction.

## Components

### Buttons
- **Shape:** Compact 6px corners, 34px minimum height for assignment actions, and 6px 14px padding.
- **Primary:** Action blue fill with white, bold text; a darker blue on hover. Use for the main assignment or submit action.
- **Secondary:** White fill, cool border, and ink text; a pale blue hover fill.
- **Review count:** Larger bold text on softened citron, with a slightly deeper citron hover.
- **Focus:** All buttons inherit the 3px focus blue outline and 2px offset. Disabled buttons fade to half opacity.

### Chips
- **Responsibility badge:** Small, bold, softly rounded label. Review is citron; assigned owners use pale blue or gray blue fills. Keep the state in words as well as color.
- **Status pill:** White fill and a blue gray outline, signalling a state without competing with the primary action.

### Cards / Containers
- **Suggestion card:** Blue mist fill, 6px corners, and 12px 14px padding. The icon and bold recommendation lead; a plain language reason follows.
- **Records:** White, square edged rows separated by hairlines. Hover is a cool pale neutral; selected is blue mist.

### Inputs / Fields
- **Search:** White 38px field above the conversation table, with a search icon and a cool border.
- **Forms and filters:** White fields, 6px corners, cool 1px border, and dark text. Use the shared focus outline.

### Navigation
- **Rail:** Deep blue field with white icon and text labels. Active state is a pale blue inset tile with deep blue text; hover is a lighter blue field.
- **Mobile:** The rail slides in from the left over the workspace; list and detail views have their own back path.

### Ownership Route

Use small circular nodes and a thin connecting line to make the handoff state legible. Completed nodes and line segments use action blue; the future route is outlined and dashed. Pair each node with a short label and state text.

## Do's and Don'ts

### Do:
- **Do** keep the deep blue frame and warm working ground as the main visual relationship.
- **Do** make the next owner and primary action readable before secondary metadata.
- **Do** use citron for review states and retain text labels alongside color.
- **Do** preserve visible keyboard focus and the mobile list-to-detail path.

### Don't:
- **Don't** spread citron into generic success, decorative accents, or ordinary navigation.
- **Don't** add resting shadows to records or routine cards.
- **Don't** replace aligned, compact records with ornamental tiles where the assistant needs to compare items.
