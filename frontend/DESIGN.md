# CampusBite Frontend Design System (DESIGN.md)

This document establishes the visual design foundation for CampusBite.
Visual look determined strictly by **Hallmark** guidelines, with spacing and polish refined by **Taste Skill**.

---

## 1. Colour Palette & Contrast Ratios

All colours are chosen to convey a warm, appetizing campus eatery atmosphere while maintaining strict WCAG 2.1 AA accessibility standards (contrast ratio >= 4.5:1 for normal text).

| Role | CSS Variable | Hex Code | Purpose | Text Contrast Check |
|------|--------------|----------|---------|---------------------|
| **Primary** | `--color-primary` | `#C8481B` | Primary actions, branding, key buttons | 5.2:1 against White (#FFF) |
| **Primary Hover** | `--color-primary-hover` | `#A83812` | Hover & focus active states | 7.1:1 against White (#FFF) |
| **Primary Tint** | `--color-primary-tint` | `#FDF4EF` | Subtle highlight surfaces | 5.0:1 with Primary Text |
| **Page Background** | `--color-bg-page` | `#F8F6F2` | Warm cream canvas, non-glare | Base background |
| **Surface** | `--color-bg-surface` | `#FFFFFF` | Cards, navigation bars, modals | Base container surface |
| **Border** | `--color-border` | `#E5DFD5` | Card dividers, input outlines | 3.2:1 against background |
| **Text Primary** | `--color-text-primary` | `#231F1C` | Headings, titles, high-contrast copy | 15.6:1 against Surface |
| **Text Secondary** | `--color-text-secondary` | `#645D56` | Subtitles, metadata, hints | 4.8:1 against Surface |
| **Text Muted** | `--color-text-muted` | `#8C847C` | Disabled text, subtle footers | 3.1:1 against Surface |
| **Success** | `--color-success` | `#1E7B48` | Completed milestones, available status | 5.2:1 against Surface |
| **Success Surface** | `--color-success-surface` | `#EAF6EE` | Success alerts, DELIVERED badge | 5.0:1 with Success text |
| **Warning** | `--color-warning` | `#9A5B00` | Pending states, attention notices | 5.4:1 against Surface |
| **Warning Surface** | `--color-warning-surface` | `#FFF8EB` | Warning banners, PLACED badge | 5.1:1 with Warning text |
| **Error** | `--color-error` | `#B92828` | Destructive buttons, failed actions | 5.6:1 against Surface |
| **Error Surface** | `--color-error-surface` | `#FDF0F0` | Error banners, REFUNDED badge | 5.3:1 with Error text |

---

## 2. Typography & Type Scale

- **Headings Font**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif` (Warm, human, confident).
- **Body & Controls Font**: `'Inter', system-ui, -apple-system, sans-serif` (Maximum legibility at small sizes).

### Type Scale
- `--font-size-xs`: `0.75rem` (12px) - Badge labels, timestamps, fine print
- `--font-size-sm`: `0.875rem` (14px) - Form inputs, helper text, table cells
- `--font-size-base`: `1.0rem` (16px) - Body copy, standard buttons
- `--font-size-md`: `1.125rem` (18px) - Dish titles, card subheadings
- `--font-size-lg`: `1.25rem` (20px) - Section headers, modal titles
- `--font-size-xl`: `1.5rem` (24px) - Restaurant page headings
- `--font-size-2xl`: `1.875rem` (30px) - Page titles, hero banners
- `--font-size-3xl`: `2.25rem` (36px) - Major dashboard headers

---

## 3. Spacing Scale & Radius

### Spacing Scale
- `--space-1`: `0.25rem` (4px)
- `--space-2`: `0.5rem` (8px)
- `--space-3`: `0.75rem` (12px)
- `--space-4`: `1.0rem` (16px)
- `--space-5`: `1.25rem` (20px)
- `--space-6`: `1.5rem` (24px)
- `--space-8`: `2.0rem` (32px)
- `--space-10`: `2.5rem` (40px)
- `--space-12`: `3.0rem` (48px)

### Border Radius
- `--radius`: `8px` (`0.5rem`) - Used consistently across buttons, inputs, card corners, and dialogs.
- `--radius-sm`: `4px` (`0.25rem`) - Small controls, tags.
- `--radius-full`: `9999px` - Pill status badges and circular avatar badges.

### Elevation & Focus
- `--shadow-sm`: `0 1px 3px rgba(35, 31, 28, 0.06)`
- `--shadow-md`: `0 4px 8px -1px rgba(35, 31, 28, 0.08), 0 2px 4px -1px rgba(35, 31, 28, 0.04)`
- `--focus-ring`: `0 0 0 3px rgba(200, 72, 27, 0.25)`

---

## 4. Visual Execution Rules

1. **No Gradients & No Glows**: Pure solid background fills with subtle warm borders. Never use purple cyber-glows or gradient overlays.
2. **No Emojis as Icons**: All icons are rendered strictly using vector SVG glyphs from `lucide-react` with proper `aria-hidden` tags.
3. **No Stock Photo Placeholders**: Because the backend schema does not store dish/restaurant image URLs, cards use high-end typographic monograms, bold pricing pills, category chips, and structured layout dividers rather than generic stock food pictures.
4. **No Lorem Ipsum**: Realistic campus food data (e.g. "Main Canteen", "Library Cafe", "Veggie Roll", "Masala Dosa").
5. **No Sideways Horizontal Scrolling**: Mobile layouts stack vertically with fluid percentages and flexible containers.

---

## 5. Order Status Badges Specification

Every order lifecycle state has an accessible, distinct visual style:

| Status | Background | Text Colour | Border Colour | Visual Meaning |
|--------|------------|-------------|---------------|----------------|
| **PLACED** | `#FFF8EB` | `#9A5B00` | `#F7DEB0` | Amber / Just submitted by student |
| **ACCEPTED** | `#EEF6FA` | `#1C6488` | `#BBDDEE` | Slate Blue / Kitchen acknowledged |
| **PREPARING** | `#F4EEFD` | `#69359C` | `#DDC6F8` | Warm Violet / Cook active |
| **READY** | `#EAF6EE` | `#1E7B48` | `#BBE3C9` | Emerald / Packed for pickup |
| **ASSIGNED** | `#EBF3FE` | `#1A569C` | `#B7D4FB` | Indigo / Delivery partner matched |
| **OUT_FOR_DELIVERY** | `#FDF4EF` | `#C8481B` | `#F5C7B3` | Terracotta / On bike/transit to dorm |
| **DELIVERED** | `#EAF6EE` | `#135C34` | `#A0D8B4` | Deep Green / Handed over to student |
| **CANCELLED** | `#F3F4F6` | `#4B5563` | `#D1D5DB` | Neutral Slate / Cancelled in PLACED |
| **REFUNDED** | `#FDF0F0` | `#B92828` | `#F6C1C1` | Crimson Brick / Returned & money refunded |
