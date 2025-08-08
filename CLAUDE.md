# Claude Development Reference

## Project Context
"The Commons" is an academic publishing platform disrupting traditional publishing with open access, fair pricing, and transparent peer review.

## Core References

### 📋 Primary Documentation
- **PLAN.md**: Complete project roadmap and implementation phases
- **DESIGN_SYSTEM.md**: Comprehensive design system and UI guidelines

### 🔄 Development Workflow

#### Before Starting Any Phase
1. **Read PLAN.md** - Review the specific phase requirements and deliverables
2. **Check DESIGN_SYSTEM.md** - Ensure all UI follows established patterns
3. **Update TodoWrite** - Plan tasks and track progress throughout implementation

#### When Creating UI Components
1. **Follow DESIGN_SYSTEM.md** color palette, typography, and spacing
2. **Use established component patterns** from Phase 2 implementation
3. **Implement accessibility standards** (WCAG 2.1 AA compliance)
4. **Ensure responsive design** using mobile-first breakpoints

#### Page Creation Standards
1. **Academic-focused design** - Scholarly, professional appearance
2. **Typography hierarchy** - Use Playfair Display for headings, Crimson Text for articles
3. **Color consistency** - Deep Academic Blue (#1e3a8a), Scholarly Gold (#d97706)
4. **Component reuse** - Leverage existing components before creating new ones

## Tech Stack Reminder
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 + custom academic classes
- **UI Library**: Shadcn/UI + custom academic components
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe
- **Deployment**: Vercel (frontend) + Railway (Redis)

## Key Files Structure
```
app/
├── (auth)/         # Authentication pages
├── (dashboard)/    # Role-based dashboards  
├── (public)/       # Public pages
└── api/           # API routes

components/
├── ui/            # Core UI components
├── layout/        # Layout components
├── public/        # Public page components
├── dashboard/     # Dashboard components
└── forms/         # Form components

lib/
├── supabase/      # Database clients
├── stripe/        # Payment integration
└── utils/         # Utility functions
```

## Implementation Notes

### Phase Progress Tracking
- Always use TodoWrite to track phase progress
- Mark tasks complete only when fully implemented
- Update status in real-time as work progresses

### Code Quality Standards
- Follow existing patterns established in Phase 2
- Maintain TypeScript strict mode compliance
- Use established CSS classes and design tokens
- Implement proper error handling and loading states

### 🚨 Critical Development Rules

#### ALWAYS Run Build Before Committing
```bash
npm run build  # Must pass with zero errors
```
- **Never commit** code that doesn't compile
- **Fix ALL TypeScript errors** before proceeding
- Build errors indicate systemic issues that compound over time
- Clean builds ensure deployment success

### 🔧 TypeScript Best Practices

#### Next.js 15 API Routes
```typescript
// ✅ CORRECT Pattern
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params // Always await!
  const supabase = await createClient() // Always await!
}
```

#### Page Components
```typescript
interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
}
```

#### Import Management
- **Remove unused imports**: Always clean up unused import statements
- **Component imports**: Only import icons/components that are actually used
- **Type imports**: Remove unused type imports from interfaces

#### Null Safety Patterns
```typescript
// ✅ CORRECT - Always check for undefined objects
if (!data) return null

// ✅ CORRECT - Safe property access with defaults
const length = data?.items?.length || 0

// ✅ CORRECT - Safe method chaining
const results = items?.filter?.(item => item.active) || []
```

#### Parameter Handling
- **Unused parameters**: Prefix with underscore `_request`, `_channel`
- **Unused destructured variables**: Use underscore `const [, setValue] = useState()`
- **Function signatures**: Match interface definitions exactly

#### Complex Object Access
```typescript
// ✅ CORRECT - Type assertion for dynamic access
const value = (complexObject as any)[dynamicKey]?.property

// ✅ CORRECT - Safe array operations with typing
items?.map((item: any, index: number) => ...)
```

#### Third-party Library Compatibility
- **Redis/ioredis**: Use only supported configuration options
- **Zustand stores**: Match interface definitions exactly
- **Supabase relations**: Use type assertions for complex nested data

#### Pre-commit Checklist
1. All `createClient()` calls are awaited
2. API routes use `await context.params` 
3. Page props use Promise patterns
4. **No unused imports or variables**
5. **All object property access is null-safe**
6. **Type assertions used for dynamic property access**
7. **Function parameters match interface definitions**
8. **Third-party library options are valid**

### Academic Publishing Focus
Remember this is a scholarly platform requiring:
- Professional, academic aesthetic
- High accessibility standards
- Print-optimized layouts for articles
- Citation and reference management
- Manuscript status tracking
- Peer review workflows

## Quick Reference
- **Colors**: Primary #1e3a8a, Secondary #d97706, Accent #16a34a
- **Fonts**: Playfair Display (headings), Inter (UI), Crimson Text (articles)
- **Spacing**: 4px base unit, systematic scaling
- **Breakpoints**: sm(640px), md(768px), lg(1024px), xl(1280px)
- **Components**: Use .card-academic, .btn-academic, .prose-academic classes

---
*This file is for Claude's reference only. User-facing documentation is in README.md*