# Editorial Decision Workflow System

## Overview

The Editorial Decision Workflow is a comprehensive, transactional system for managing the complete lifecycle of editorial decisions in academic publishing. This system transforms the basic decision process into a professional-grade workflow with advanced automation, rich text editing, template management, and analytics.

## Architecture

### Core Principles
- **Atomic Transactions**: All decision operations are transactional and reversible
- **Component-Based Design**: Modular architecture for maintainability
- **Template-Driven**: Reusable, structured templates for consistency
- **Automation-First**: Post-decision actions execute automatically
- **Analytics-Enabled**: Built-in metrics and reporting

### System Components

```
Editorial Decision Workflow
├── Database Layer
│   ├── Enhanced editorial_decisions table
│   ├── editorial_templates table
│   └── Transactional functions
├── Service Layer
│   ├── DecisionProcessingService
│   ├── PostDecisionActionOrchestrator
│   └── Template management
├── API Layer
│   ├── Transactional decision endpoints
│   ├── Template CRUD operations
│   └── Analytics endpoints
├── UI Layer
│   ├── Multi-step decision form
│   ├── Rich text editor with variables
│   ├── Template management interface
│   └── Analytics dashboard
└── Automation Layer
    ├── Email notifications
    ├── DOI generation
    ├── Production workflows
    └── Follow-up reminders
```

## Features

### 1. Decision Recording Interface
**Location**: `components/dashboard/editorial-decision-form.tsx`

A 5-step workflow for creating editorial decisions:

1. **Decision Type Selection**: Choose accept/revisions/reject
2. **Editorial Summary**: Structured assessment with review integration
3. **Author Letter**: Rich text editor with variables and review comments
4. **Actions & Settings**: Configure post-decision automation
5. **Review & Submit**: Final validation and submission

**Key Features**:
- Progress tracking with step validation
- Auto-save every 30 seconds
- Draft management
- Real-time form validation
- Component-based state management

### 2. Rich Text Decision Letter Builder
**Location**: `components/ui/rich-text-editor.tsx`

Advanced editor for composing decision letters:

**Capabilities**:
- Variable insertion (`@author_name`, `@manuscript_title`, etc.)
- Review comment embedding with formatted blocks
- Template application with smart merging
- Real-time preview mode
- Version control for letter drafts
- Character counting and limits

**Editor Extensions**:
- Tiptap with custom mention system
- Typography enhancements
- Focus management
- Undo/redo functionality

### 3. Template Management System
**Location**: `components/dashboard/template-manager.tsx`

Comprehensive template management with:

**Features**:
- CRUD operations for templates
- Public/private template sharing
- Usage analytics and tracking
- Category-based organization
- Search and filtering
- Template versioning

**Template Structure**:
```json
{
  "sections": [
    {
      "id": "greeting",
      "type": "text",
      "content": "Dear {{author_name}},",
      "required": true,
      "order": 1
    }
  ],
  "variables": ["author_name", "manuscript_title"],
  "defaultActions": {
    "notifyAuthor": true,
    "generateDOI": false
  }
}
```

### 4. Transactional Processing
**Location**: `lib/services/decision-processing-service.ts`

Database-backed service ensuring atomic operations:

**Capabilities**:
- Atomic decision creation
- Manuscript status updates
- Review assignment status management
- Template usage tracking
- Activity logging
- Error rollback

**Database Function**: `process_editorial_decision()`
- Validates permissions
- Creates decision record
- Updates manuscript status
- Logs all activities
- Handles errors gracefully

### 5. Post-Decision Automation
**Location**: `lib/workflows/post-decision-actions.ts`

Automated workflows triggered after decision submission:

**Actions Available**:
- **Author Notifications**: Email with decision letter
- **Reviewer Notifications**: Thank you messages
- **DOI Generation**: Automatic DOI assignment
- **Production Assignment**: Editor allocation
- **Publication Scheduling**: Timeline management
- **Follow-up Reminders**: Automated follow-ups

**Action Types**:
```typescript
- notify_author
- notify_reviewers  
- generate_doi
- assign_production_editor
- schedule_publication
- follow_up_reminder
- send_to_production
```

### 6. Analytics & Reporting
**Location**: `components/dashboard/decision-analytics.tsx`

Comprehensive analytics with:

**Metrics**:
- Decision distribution (accept/reject/revisions)
- Processing time trends
- Template usage statistics
- Editor performance metrics
- Monthly decision trends

**Visualizations**:
- Pie charts for decision distribution
- Line charts for trends over time
- Bar charts for comparative metrics
- Performance dashboards

## Database Schema

### Enhanced Editorial Decisions
```sql
-- New columns added to editorial_decisions
ALTER TABLE editorial_decisions ADD COLUMN:
- components JSONB           -- Structured decision components
- template_id UUID          -- Reference to template used
- template_version INTEGER  -- Template version
- actions JSONB             -- Post-decision actions config
- draft_data JSONB          -- Temporary draft data
- version INTEGER           -- Decision version number
- is_draft BOOLEAN          -- Draft status flag
- submitted_at TIMESTAMPTZ  -- Final submission time
- updated_at TIMESTAMPTZ    -- Last update time
```

### Editorial Templates Table
```sql
CREATE TABLE editorial_templates (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('accept', 'minor_revision', 'major_revision', 'reject', 'desk_reject')),
  decision_type manuscript_status NOT NULL,
  template_content JSONB NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  usage_count INTEGER DEFAULT 0,
  tags TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### Decision Management
- `POST /api/manuscripts/[id]/decisions` - Create/update decision
- `GET /api/manuscripts/[id]/decisions` - Get decision history
- `PUT /api/manuscripts/[id]/decisions` - Submit final decision from draft

### Template Management  
- `GET /api/editorial/templates` - List templates
- `POST /api/editorial/templates` - Create template
- `PUT /api/editorial/templates/[id]` - Update template
- `DELETE /api/editorial/templates/[id]` - Delete template

### Analytics
- `GET /api/analytics/editorial-decisions` - Get analytics data
- `GET /api/analytics/editorial-decisions/export` - Export data

## Usage Examples

### Basic Decision Flow
```typescript
// Initialize decision processing
const decisionService = new DecisionProcessingService(supabase)

// Create decision
const result = await decisionService.processDecision({
  manuscriptId: 'manuscript-id',
  editorId: 'editor-id',
  decision: 'accepted',
  components: {
    editorSummary: 'Editorial assessment...',
    authorLetter: 'Dear author...',
    reviewerComments: [...],
    internalNotes: 'Internal notes...'
  },
  actions: {
    notifyAuthor: true,
    generateDOI: true,
    schedulePublication: '2024-03-01'
  }
})
```

### Using Templates
```typescript
// Apply template to decision
const applyTemplate = (template) => {
  let content = template.template_content.sections
    .map(section => section.content)
    .join('\n\n')
  
  // Replace variables
  content = content.replace(/{{author_name}}/g, manuscript.author.name)
  content = content.replace(/{{manuscript_title}}/g, manuscript.title)
  
  return content
}
```

### Auto-Save Hook
```typescript
// Use auto-save functionality
const { 
  draftState, 
  saveDraft, 
  hasPendingChanges 
} = useDecisionDraft({
  manuscriptId,
  userId,
  autoSaveInterval: 30000
})
```

## File Structure

```
├── components/
│   ├── dashboard/
│   │   ├── editorial-decision-form.tsx          # Main decision form
│   │   ├── template-manager.tsx                 # Template management
│   │   ├── decision-analytics.tsx               # Analytics dashboard
│   │   └── decision-components/
│   │       ├── DecisionSummaryEditor.tsx        # Editorial summary component
│   │       ├── AuthorLetterBuilder.tsx          # Letter composition
│   │       └── PostDecisionActions.tsx          # Actions configuration
│   └── ui/
│       ├── rich-text-editor.tsx                 # Rich text editor
│       ├── rich-text-editor-suggestion.ts       # Variable suggestions
│       ├── progress.tsx                         # Progress bar
│       ├── calendar.tsx                         # Date picker
│       ├── popover.tsx                          # Popover component
│       └── switch.tsx                           # Toggle switch
├── lib/
│   ├── services/
│   │   └── decision-processing-service.ts       # Core business logic
│   └── workflows/
│       └── post-decision-actions.ts             # Automation workflows
├── hooks/
│   └── useDecisionDraft.ts                     # Auto-save hook
├── app/api/
│   ├── manuscripts/[id]/decisions/route.ts      # Decision API
│   └── editorial/templates/route.ts             # Template API
├── supabase/migrations/
│   ├── 015_enhanced_editorial_decisions.sql    # Enhanced schema
│   ├── 016_editorial_templates.sql             # Templates table
│   └── 017_decision_processing_function.sql    # Database functions
└── types/
    └── database.ts                              # Enhanced TypeScript types
```

## Configuration

### Environment Variables
```env
# Required for decision processing
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional for email notifications
RESEND_API_KEY=your-resend-api-key
```

### Feature Flags
```typescript
// Enable/disable features
const FEATURES = {
  AUTO_SAVE: true,
  TEMPLATE_SHARING: true,
  ANALYTICS: true,
  EMAIL_NOTIFICATIONS: true,
  DOI_GENERATION: true
}
```

## Testing

### Unit Tests
- Decision processing service tests
- Template management tests
- Component rendering tests
- Hook functionality tests

### Integration Tests
- End-to-end decision workflow
- Template application flow
- Auto-save functionality
- Analytics data processing

### Performance Tests
- Large template collections
- Concurrent decision processing
- Auto-save performance
- Analytics query optimization

## Security Considerations

### Row Level Security (RLS)
- Templates access control
- Decision history protection
- Draft visibility restrictions
- Analytics data isolation

### Input Validation
- Decision type validation
- Template content sanitization
- File upload restrictions
- SQL injection prevention

### Audit Trail
- All decision changes logged
- Template usage tracking
- User action monitoring
- Error event logging

## Deployment

### Database Migrations
```bash
# Run migrations in order
supabase migration up 015_enhanced_editorial_decisions.sql
supabase migration up 016_editorial_templates.sql  
supabase migration up 017_decision_processing_function.sql
```

### Dependencies
```bash
# Install required packages
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-mention
npm install @radix-ui/react-progress @radix-ui/react-switch
npm install tippy.js date-fns recharts
```

### Environment Setup
1. Configure Supabase with enhanced schema
2. Set up email service (Resend recommended)
3. Configure job queue for automation (optional)
4. Enable analytics collection
5. Set up monitoring and alerting

## Monitoring

### Key Metrics to Track
- Decision processing time
- Auto-save success rate
- Template usage patterns
- Error rates and types
- User engagement metrics

### Alerts
- Failed decision submissions
- Template creation errors
- Auto-save failures
- Analytics processing issues

## Future Enhancements

### Planned Features
- **Collaborative Editing**: Multiple editors on single decision
- **Version Comparison**: Visual diff between decision versions  
- **Advanced Analytics**: Machine learning insights
- **Mobile Optimization**: Native mobile app integration
- **API Integration**: External system webhooks
- **Advanced Templates**: Conditional logic and branching

### Performance Optimizations
- Template caching strategy
- Decision history pagination
- Analytics pre-computation
- Real-time collaboration infrastructure

---

## Changelog

### Version 1.0.0 (Current)
- ✅ Multi-step decision workflow
- ✅ Rich text editor with variables
- ✅ Template management system
- ✅ Transactional processing
- ✅ Post-decision automation
- ✅ Analytics dashboard
- ✅ Auto-save functionality
- ✅ Draft management
- ✅ Performance metrics
- ✅ Comprehensive error handling

---

*This documentation covers the complete Editorial Decision Workflow system implementation. For technical support or feature requests, please refer to the project's issue tracker.*