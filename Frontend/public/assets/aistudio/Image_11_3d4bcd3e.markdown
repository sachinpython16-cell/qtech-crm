---
name: Kinetic Enterprise Surface
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1b1b1b'
  on-surface-variant: '#58423b'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0ef'
  outline: '#8c716a'
  outline-variant: '#e0c0b7'
  surface-tint: '#a93811'
  primary: '#a6350f'
  on-primary: '#ffffff'
  primary-container: '#c74d26'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb59f'
  secondary: '#006877'
  on-secondary: '#ffffff'
  secondary-container: '#8debff'
  on-secondary-container: '#006b7a'
  tertiary: '#29627e'
  on-tertiary: '#ffffff'
  tertiary-container: '#457b98'
  on-tertiary-container: '#fbfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd1'
  primary-fixed-dim: '#ffb59f'
  on-primary-fixed: '#3a0a00'
  on-primary-fixed-variant: '#862300'
  secondary-fixed: '#a3eeff'
  secondary-fixed-dim: '#76d4e7'
  on-secondary-fixed: '#001f25'
  on-secondary-fixed-variant: '#004e5a'
  tertiary-fixed: '#c3e8ff'
  tertiary-fixed-dim: '#98cded'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#084c67'
  background: '#fcf9f8'
  on-background: '#1b1b1b'
  surface-variant: '#e5e2e1'
  brand-orange: '#EB673E'
  electric-cyan: '#00D2D3'
  surface-canvas: '#F4F6F9'
  surface-neutral-subtle: '#4D4D4D'
  state-success: '#10B981'
  state-warning: '#F59E0B'
  state-danger: '#EF4444'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 56px
    fontWeight: '700'
    lineHeight: 64px
  display-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '700'
    lineHeight: 52px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  body-lg:
    fontFamily: Arimo
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Arimo
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Arimo
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Arimo
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Arimo
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  label-sm:
    fontFamily: Arimo
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  gutter-lg: 2rem
  margin: 1.5rem
  margin-mobile: 1rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system establishes a high-velocity, modern enterprise environment engineered specifically for complex CRM workflows. Melding Google Material 3's tonal layering and systematic clarity with high-contrast, energetic brand accents, the visual posture communicates operational rigor, technical forwardness, and decisive action. 

The aesthetic is precision-driven Corporate Modernism infused with deliberate energetic sparks: crisp surfaces, structured density, high legibility, and targeted chromatic punch. It eliminates decorative distraction in favor of scannable hierarchy, fluid spatial cadence, and purposeful state indication. Data density remains comfortable without sacrificing touch targets or desktop efficiency.

## Colors

The palette grounds itself in the foundational contrast between the dynamic brand orange (`#EB673E`), an electric digital teal/cyan (`#088395` and `#00D2D3`), and deep architectural neutrals. 

- **Primary (`#EB673E`):** Serves as the primary operational trigger—applied to focal calls-to-action, pipeline alerts, critical metrics, and key progress milestones.
- **Secondary (`#088395`):** Expresses technical stability and navigational clarity—used for active navigation states, selected filtering chips, and secondary analytical charts.
- **Tertiary (`#0A4D68`):** Provides anchor depth for segmented headers, tab groups, and data visualization category differentiation.
- **Neutral (`#1D1D1D`) & Neutral Subtle (`#4D4D4D`):** Provide extreme typographic clarity on top of the soft enterprise canvas background (`#F4F6F9`).
- **Surface Elevation:** Light mode utilizes M3 tonal surface steps (`#FFFFFF` for standard elevation, `#F4F6F9` for ground canvas, and low-opacity neutral blends for container layering).

## Typography

Typography balances structural authority with rapid data digestion. **Plus Jakarta Sans** introduces geometric modernity and crisp character shapes for displays, KPI titles, and table headers. **Arimo** brings high-legibility tabular consistency to body copy, numeric data grids, form fields, and metadata tags.

- Use uppercase styling exclusively for `label-sm` when designating pipeline stages, badge counters, or column sorting markers.
- Numeric metrics within tables and dashboard cards must use proportional or tabular alignment with `label-lg` or `headline-md` to avoid shifting during real-time data syncs.

## Layout & Spacing

A 12-column responsive fluid grid governs workspace layouts, adapting dynamically between compact analytical tables and expansive kanban pipelines.

- **Desktop (1200px+):** 12 columns, 24px (`gutter-lg`) gutters, 40px (`margin-desktop`) canvas padding. Collapsible persistent navigation rail (72px collapsed, 256px expanded).
- **Tablet (600px - 1199px):** 8 columns, 16px (`gutter`) gutters, 24px (`margin`) margins. Drawer navigation shifts to overlay.
- **Mobile (< 600px):** 4 columns, 12px gutters, 16px (`margin-mobile`) margins. Stacked single-column layouts for record cards and pipeline boards.
- Compact component padding rules (`space-xs` through `space-md`) preserve maximum vertical real estate across CRM tables, customer contact logs, and deal flows.

## Elevation & Depth

In alignment with Material Design 3 guidelines, physical separation is expressed primarily through **tonal surface separation** coupled with diffused, low-opacity ambient shadows:

- **Level 0 (Flat Ground):** Background canvas `#F4F6F9`. No shadows.
- **Level 1 (Card / Table Surface):** Solid `#FFFFFF`, subtle hairline border `rgba(29, 29, 29, 0.08)`, soft shadow: `0px 1px 3px rgba(29, 29, 29, 0.05), 0px 1px 2px rgba(29, 29, 29, 0.03)`.
- **Level 2 (Hover / Filter Menus):** Solid `#FFFFFF`, ambient shadow: `0px 4px 6px -1px rgba(29, 29, 29, 0.08), 0px 2px 4px -2px rgba(29, 29, 29, 0.04)`.
- **Level 3 (Modals / Slide-over CRM Sheets):** Surface elevated with `0px 20px 25px -5px rgba(29, 29, 29, 0.1), 0px 8px 10px -6px rgba(29, 29, 29, 0.05)` accompanied by a backdrop scrim tinted with 40% `#1D1D1D`.

## Shapes

A balanced `roundedness: 2` (base 8px / `0.5rem`) structure reinforces the modern enterprise tone—avoiding both harsh brutalist sharpness and overly playful pill contours:

- **Standard Containers & Cards:** 8px (`0.5rem`) corner radius.
- **Panels, Sheets, and Modal Viewports:** 16px (`1rem`) corner radius.
- **Chips, Badges, and Status Tags:** 4px (`0.25rem`) corner radius for sharp data legibility.
- **Floating Action Buttons & Avatars:** Fully circular (9999px).

## Components

### Buttons
- **Primary:** Background `#EB673E`, text `#FFFFFF`, 8px radius, height 40px, font `label-lg`. On hover: brightness filter +5% and subtle Level 2 shadow.
- **Secondary (Technical):** Border 1.5px `#088395`, background transparent, text `#088395`. On hover: 8% `#088395` background fill.
- **Tertiary / Text:** No border, text `#4D4D4D`, hover background `rgba(29, 29, 29, 0.04)`.

### Form Fields & Inputs
- Height 40px (desktop CRM density), 8px border radius.
- Default state: Background `#FFFFFF`, border 1px solid `rgba(29, 29, 29, 0.2)`, text `#1D1D1D`.
- Focus state: Border 2px solid `#088395` with an outer soft glow ring `rgba(8, 131, 149, 0.15)`. Floating label transitions to `label-sm` in `#088395`.

### Chips & Status Badges
- Lead Pipeline badges utilize subtle 12% tinted fills with solid text:
  - *Active / Qualified:* `#E0F7F6` with `#088395` text.
  - *Opportunity / Hot:* `#FDEEE9` with `#EB673E` text.
  - *Archived / Stale:* `#F4F6F9` with `#4D4D4D` text.

### Data Tables & Deal Cards
- Row height: 48px standard, 36px dense mode. Border bottom 1px solid `rgba(29, 29, 29, 0.06)`.
- Cards maintain a 1px perimeter border `rgba(29, 29, 29, 0.08)` over surface `#FFFFFF` with optional left-hand accent stripe (3px) in `#EB673E` or `#088395` indicating lead status.

### Checkboxes & Selection Controls
- Checkbox size 18x18px, 4px corner radius. Inactive: 1.5px border `#4D4D4D`. Checked: Fill `#088395` with white check glyph.
- Switch toggles: 44x24px pill, inactive track `#E2E8F0`, active track `#EB673E`, white thumb with subtle Level 1 elevation.