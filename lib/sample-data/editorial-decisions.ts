import { createClient } from '@/lib/supabase/client'

interface SampleDecision {
  manuscript_id: string
  editor_id: string
  decision: 'accepted' | 'rejected' | 'revisions_requested'
  decision_letter: string
  internal_notes?: string
  sent_at?: string
  created_at: string
}

export const sampleEditorialDecisions: Omit<SampleDecision, 'manuscript_id' | 'editor_id'>[] = [
  {
    decision: 'accepted',
    decision_letter: `Dear Dr. Smith,

Thank you for submitting your manuscript "Quantum Computing Applications in Climate Modeling" to The Commons.

After careful consideration and peer review, I am pleased to inform you that your manuscript has been ACCEPTED for publication. The reviewers were impressed with the novel approach to quantum algorithms for climate prediction and the comprehensive validation against existing models.

The reviewers provided the following positive feedback:
- Innovative application of quantum computing to environmental science
- Rigorous methodology and thorough experimental validation
- Clear presentation of complex technical concepts
- Significant potential impact on the field

Your manuscript will now move to the production stage. Our production team will contact you within the next week regarding final formatting and copy editing.

Congratulations on this excellent work!

Best regards,
Dr. Sarah Johnson
Editor-in-Chief, The Commons`,
    internal_notes: 'Exceptional paper - fast-track for publication. Both reviewers gave strong accept recommendations.',
    sent_at: '2024-01-20T14:30:00Z',
    created_at: '2024-01-20T10:15:00Z'
  },
  {
    decision: 'revisions_requested',
    decision_letter: `Dear Dr. Chen,

Thank you for submitting your manuscript "Machine Learning Approaches to Drug Discovery" to The Commons.

After careful peer review, I am writing to request MAJOR REVISIONS to your manuscript before it can be considered for publication. While the reviewers found the core research valuable, several significant issues need to be addressed.

The reviewers have identified the following areas requiring attention:

**Major Issues:**
1. Statistical analysis needs strengthening - please include confidence intervals and effect sizes
2. The methodology section requires more detail about model training and validation procedures
3. Comparison with existing drug discovery methods should be expanded
4. Discussion of limitations is insufficient

**Minor Issues:**
- Figure 3 needs higher resolution
- Several typos in the references section
- Abstract should be more concise (currently 320 words, limit is 250)

We encourage you to revise and resubmit your manuscript. Please prepare a detailed response letter addressing each reviewer comment. The revised manuscript will undergo further peer review.

You have 60 days to submit your revision from the date of this letter.

Best regards,
Dr. Sarah Johnson
Editor-in-Chief, The Commons`,
    internal_notes: 'Good research but needs significant improvements. Both reviewers recommend major revision.',
    sent_at: '2024-01-18T16:45:00Z',
    created_at: '2024-01-18T11:20:00Z'
  },
  {
    decision: 'rejected',
    decision_letter: `Dear Dr. Rodriguez,

Thank you for submitting your manuscript "Sustainable Energy Solutions for Urban Areas" to The Commons.

After careful consideration and peer review, I regret to inform you that we cannot accept your manuscript for publication in The Commons.

While your work addresses an important topic, the reviewers identified several fundamental issues that prevent publication at this time:

**Primary Concerns:**
- The experimental design has significant methodological flaws that compromise the validity of results
- The literature review is incomplete and misses several key recent publications
- The statistical analysis is inadequate for the conclusions drawn
- The novelty of the approach is limited compared to existing solutions

**Reviewer Feedback:**
Reviewer 1 noted that the energy efficiency calculations appear to contain errors and recommended a complete re-analysis of the data. Reviewer 2 pointed out that similar studies have been published recently with more robust methodologies.

We appreciate your interest in The Commons and encourage you to consider these comments for future submissions. You may also wish to consider submission to a more specialized journal in renewable energy.

Thank you for considering The Commons for your research.

Best regards,
Dr. Sarah Johnson
Editor-in-Chief, The Commons`,
    internal_notes: 'Both reviewers recommend rejection. Major methodological issues that cannot be addressed through revision.',
    sent_at: '2024-01-15T13:15:00Z',
    created_at: '2024-01-15T09:30:00Z'
  },
  {
    decision: 'accepted',
    decision_letter: `Dear Dr. Williams,

Thank you for submitting your manuscript "Blockchain Applications in Supply Chain Management" to The Commons.

I am delighted to inform you that your manuscript has been ACCEPTED for publication following minor revisions.

The reviewers were very positive about your work, particularly highlighting:
- The practical implementation of blockchain technology in real supply chains
- Comprehensive cost-benefit analysis
- Clear documentation of security improvements
- Well-written and accessible presentation

Please address the following minor points before final acceptance:
1. Update Figure 2 to include the latest data from Q4 2023
2. Add a brief discussion of potential scalability challenges
3. Correct the formatting of references 15-18

These are minor adjustments that should not require additional peer review. Please submit your revised manuscript within 2 weeks.

Congratulations on this excellent contribution to the field!

Best regards,
Dr. Sarah Johnson
Editor-in-Chief, The Commons`,
    internal_notes: 'Strong paper with practical applications. Minor revisions only - no need for re-review.',
    sent_at: '2024-01-22T11:00:00Z',
    created_at: '2024-01-22T08:45:00Z'
  },
  {
    decision: 'revisions_requested',
    decision_letter: `Dear Dr. Anderson,

Thank you for submitting your manuscript "AI Ethics in Healthcare Decision Making" to The Commons.

After thorough peer review, I am requesting MINOR REVISIONS to your manuscript. The reviewers found your work timely and important, with only a few issues to address.

**Required Revisions:**
1. Expand the section on patient consent in AI-driven diagnosis (Section 4.2)
2. Include more recent case studies from 2023-2024
3. Clarify the ethical framework recommendations in the conclusion
4. Address reviewer concerns about the generalizability of your proposed solutions

**Reviewer Comments:**
Both reviewers praised the comprehensive analysis and practical recommendations. Reviewer 1 particularly appreciated the multi-stakeholder perspective, while Reviewer 2 found the policy implications well-articulated.

Please prepare a detailed response addressing each point and submit your revision within 30 days. Given the minor nature of these revisions, the revised manuscript will likely be accepted without further review.

Best regards,
Dr. Sarah Johnson
Editor-in-Chief, The Commons`,
    internal_notes: 'Excellent paper on timely topic. Minor revisions should be straightforward.',
    sent_at: '2024-01-25T15:20:00Z',
    created_at: '2024-01-25T12:10:00Z'
  }
]

export async function createSampleEditorialDecisions() {
  const supabase = createClient()
  
  try {
    // First, let's get some sample manuscripts and editors
    const { data: manuscripts } = await supabase
      .from('manuscripts')
      .select('id, title')
      .limit(5)
    
    const { data: editors } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'editor')
      .limit(1)
    
    if (!manuscripts || manuscripts.length === 0) {
      console.log('No manuscripts found. Please create sample manuscripts first.')
      return
    }
    
    if (!editors || editors.length === 0) {
      console.log('No editors found. Please create sample editor profiles first.')
      return
    }
    
    const editorId = editors[0].id
    const decisions = sampleEditorialDecisions.slice(0, manuscripts.length).map((decision, index) => ({
      ...decision,
      manuscript_id: manuscripts[index].id,
      editor_id: editorId
    }))
    
    // Insert sample decisions
    const { data, error } = await supabase
      .from('editorial_decisions')
      .insert(decisions)
      .select()
    
    if (error) {
      console.error('Error creating sample decisions:', error)
      throw error
    }
    
    console.log(`Successfully created ${data?.length || 0} sample editorial decisions`)
    return data
    
  } catch (error) {
    console.error('Failed to create sample editorial decisions:', error)
    throw error
  }
}

// Export individual decisions for testing
export const acceptanceDecision = sampleEditorialDecisions[0]
export const majorRevisionDecision = sampleEditorialDecisions[1]
export const rejectionDecision = sampleEditorialDecisions[2]
export const minorRevisionDecision = sampleEditorialDecisions[4]