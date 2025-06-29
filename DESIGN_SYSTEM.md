# The Commons Design System

## Overview

The Commons design system is built specifically for academic publishing, prioritizing readability, accessibility, and professional aesthetics. It reflects the scholarly nature of our platform while maintaining modern usability standards.

## Brand Identity

### Mission
Democratize access to scholarly knowledge through fair, transparent, and sustainable academic publishing.

### Values
- **Open Access**: Knowledge belongs to humanity
- **Transparency**: Clear processes and fair pricing
- **Quality**: Rigorous peer review and high standards
- **Accessibility**: Available to all researchers worldwide
- **Innovation**: Modern technology serving academic tradition

## Color Palette

### Primary Colors
```css
--color-primary: #1e3a8a;           /* Deep Academic Blue */
--color-primary-foreground: #ffffff;
--color-secondary: #d97706;         /* Scholarly Gold */
--color-secondary-foreground: #ffffff;
--color-accent: #16a34a;            /* Sage Green */
--color-accent-foreground: #ffffff;
```

### Semantic Colors
```css
--color-success: #10b981;           /* Success Green */
--color-warning: #f59e0b;           /* Warning Amber */
--color-error: #ef4444;             /* Error Red */
--color-info: #3b82f6;              /* Info Blue */
```

### Neutral Scale
```css
--color-background: #ffffff;        /* Light theme background */
--color-foreground: #111827;        /* Light theme text */
--color-muted: #f9fafb;             /* Muted background */
--color-muted-foreground: #6b7280;  /* Muted text */
--color-border: #e5e7eb;            /* Border color */
```

### Dark Theme
```css
/* Dark theme optimized for academic reading */
--background: #0f172a;              /* Slate 900 */
--foreground: #f1f5f9;              /* Slate 100 */
--card: #1e293b;                    /* Slate 800 */
--primary: #3b82f6;                 /* Blue 500 */
--secondary: #fbbf24;               /* Amber 400 */
```

## Typography

### Font Families
```css
--font-heading: 'Playfair Display', serif;    /* Academic elegance */
--font-sans: 'Inter', sans-serif;             /* Modern readability */
--font-serif: 'Crimson Text', serif;          /* Article content */
--font-mono: 'JetBrains Mono', monospace;     /* Code and technical */
```

### Type Scale
```css
/* Headings */
.heading-display: 3rem (48px)      /* Hero titles */
.heading-1: 2.5rem (40px)         /* Page titles */
.heading-2: 2rem (32px)           /* Section titles */
.heading-3: 1.5rem (24px)         /* Subsection titles */
.heading-4: 1.25rem (20px)        /* Card titles */
.heading-5: 1.125rem (18px)       /* Small headings */

/* Body text */
.text-academic-lg: 1.125rem (18px) /* Article content */
.text-academic-base: 1rem (16px)   /* Default body */
.text-academic-sm: 0.875rem (14px) /* Small text */
```

### Typography Classes
```css
/* Academic content styling */
.prose-academic {
  font-family: var(--font-serif);
  font-size: 1.125rem;
  line-height: 1.8;
  letter-spacing: 0.015em;
  text-align: justify;
  hyphens: auto;
}

/* Drop caps for article beginnings */
.prose-academic p:first-of-type::first-letter {
  font-size: 3.5rem;
  line-height: 3rem;
  float: left;
  margin: 0.125rem 0.5rem 0 0;
  font-weight: 600;
  color: var(--primary);
  font-family: var(--font-heading);
}
```

## Spacing System

### Base Unit: 4px
```css
--spacing-1: 0.25rem;   /* 4px */
--spacing-2: 0.5rem;    /* 8px */
--spacing-3: 0.75rem;   /* 12px */
--spacing-4: 1rem;      /* 16px */
--spacing-6: 1.5rem;    /* 24px */
--spacing-8: 2rem;      /* 32px */
--spacing-12: 3rem;     /* 48px */
--spacing-16: 4rem;     /* 64px */
--spacing-24: 6rem;     /* 96px */
--spacing-32: 8rem;     /* 128px */
```

### Layout Spacing
- **Component padding**: 16px (mobile), 24px (tablet), 32px (desktop)
- **Section spacing**: 48px (mobile), 64px (tablet), 96px (desktop)
- **Element gaps**: 8px (tight), 16px (normal), 24px (loose)

## Border Radius

```css
--radius-sm: 0.25rem;   /* 4px - buttons, inputs */
--radius-md: 0.5rem;    /* 8px - cards */
--radius-lg: 1rem;      /* 16px - modals */
--radius-full: 9999px;  /* pills, avatars */
```

## Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

## Components

### Buttons

#### Primary Button
```css
.btn-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: #1e40af;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

#### Button Variants
- `btn-primary`: Main call-to-action
- `btn-secondary`: Secondary actions
- `btn-outline`: Low-emphasis actions
- `btn-ghost`: Minimal actions

### Cards

#### Academic Card
```css
.card-academic {
  background-color: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.card-academic:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

### Forms

#### Academic Input
```css
.input-academic {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background-color: var(--input);
  font-family: var(--font-sans);
  transition: all 0.2s ease;
}

.input-academic:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}
```

### Status Badges

#### Manuscript Status Colors
```css
.status-draft: #6b7280 (Gray)
.status-submitted: #3b82f6 (Blue)
.status-under-review: #f59e0b (Amber)
.status-accepted: #10b981 (Emerald)
.status-published: #16a34a (Green)
.status-rejected: #ef4444 (Red)
```

### Tables

#### Academic Table
```css
.table-academic {
  width: 100%;
  border-collapse: collapse;
  margin: 2rem 0;
  background-color: var(--card);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.table-academic th {
  background-color: var(--primary);
  color: var(--primary-foreground);
  font-weight: 600;
  padding: 0.75rem 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

## Responsive Design

### Breakpoints
```css
xs: 0px      /* Mobile phones */
sm: 640px    /* Large phones */
md: 768px    /* Tablets */
lg: 1024px   /* Laptops */
xl: 1280px   /* Desktops */
2xl: 1536px  /* Large desktops */
```

### Container Sizes
```css
sm: max-width: 640px
md: max-width: 768px
lg: max-width: 1024px
xl: max-width: 1280px
2xl: max-width: 1536px
```

### Grid System
- Mobile: 1 column
- Tablet: 2-3 columns
- Desktop: 3-4 columns
- Large: 4-6 columns

## Animations

### Easing Functions
```css
ease-academic: cubic-bezier(0.25, 0.25, 0.25, 0.75)
ease-gentle: cubic-bezier(0.4, 0, 0.2, 1)
```

### Common Animations
```css
/* Fade in from bottom */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Gentle bounce for attention */
@keyframes bounceGentle {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-5px); }
  60% { transform: translateY(-3px); }
}
```

### Hover Effects
- **Cards**: `translateY(-2px)` + shadow increase
- **Buttons**: `translateY(-1px)` + background darken
- **Links**: Color transition to primary

## Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
- Text on background: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

#### Focus States
```css
*:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

#### Touch Targets
- Minimum 44px × 44px for all interactive elements
- Adequate spacing between touch targets

### Screen Reader Support
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## Icons

### Icon Library: Lucide React
- **Consistent style**: 24px default size
- **Semantic usage**: Icons support text meaning
- **Accessibility**: Proper aria-labels

### Common Icons
- Search: `Search`
- User: `User`
- Menu: `Menu`
- Close: `X`
- Download: `Download`
- Share: `Share2`
- Bookmark: `Bookmark`
- Calendar: `Calendar`
- Globe: `Globe`

## Print Styles

### Academic Print Optimization
```css
@media print {
  body {
    font-family: var(--font-serif);
    font-size: 12pt;
    line-height: 1.6;
    color: black;
    background: white;
  }
  
  .no-print { display: none !important; }
  
  h1, h2, h3, h4, h5, h6 {
    page-break-after: avoid;
  }
  
  p, blockquote {
    orphans: 3;
    widows: 3;
  }
}
```

## Usage Guidelines

### Do's
- Use serif fonts for article content
- Maintain consistent spacing throughout
- Follow color contrast requirements
- Implement proper focus states
- Use semantic HTML structure
- Test on multiple devices and screen readers

### Don'ts
- Don't use bright or neon colors
- Avoid thin fonts for body text
- Don't ignore keyboard navigation
- Avoid auto-playing content
- Don't use color alone to convey information
- Avoid overly complex animations

## Implementation

### CSS Architecture
1. **Global styles**: Base typography and colors
2. **Component styles**: Modular component CSS
3. **Utility classes**: Atomic design utilities
4. **Responsive utilities**: Breakpoint-specific styles

### File Structure
```
styles/
├── globals.css          # Global styles and variables
├── typography.css       # Typography system
└── components/          # Component-specific styles
```

## Maintenance

### Regular Reviews
- Accessibility testing with screen readers
- Performance impact of design changes
- Cross-browser compatibility
- Mobile device testing
- Print layout verification

### Updates
- Document any changes to this system
- Update component library accordingly
- Test changes across all breakpoints
- Verify accessibility compliance

---

This design system serves as the foundation for all UI decisions in The Commons platform, ensuring consistency, accessibility, and professional academic presentation.