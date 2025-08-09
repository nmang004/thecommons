import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import OpenAI from 'openai';
import { 
  AssistanceRequest, 
  AssistanceResponse,
  AssistanceSuggestion,
  BiasWarning 
} from '@/lib/types/quality';
import { QualityAnalysisService } from '@/lib/services/quality-analysis';

function getOpenAI(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/**
 * POST /api/reviews/assistance
 * Provide real-time AI assistance for review writing
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AssistanceRequest = await request.json();
    const { review_id, section, current_text, assistance_type } = body;

    // Verify the user is the reviewer
    const { data: review } = await supabase
      .from('reviews')
      .select('reviewer_id, manuscript_id')
      .eq('id', review_id)
      .single();

    if (!review || review.reviewer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get or create assistance session
    let session = await getOrCreateSession(review_id, user.id);

    // Perform different types of assistance
    const suggestions: AssistanceSuggestion[] = [];
    const warnings: BiasWarning[] = [];
    let completenessScore = 1.0;

    if (assistance_type === 'completeness' || assistance_type === 'all') {
      const completenessSuggestions = await checkCompleteness(section, current_text);
      suggestions.push(...completenessSuggestions);
      completenessScore = calculateCompletenessScore(current_text, section);
    }

    if (assistance_type === 'tone' || assistance_type === 'all') {
      const toneSuggestions = await analyzeTone(current_text);
      suggestions.push(...toneSuggestions);
    }

    if (assistance_type === 'clarity' || assistance_type === 'all') {
      const claritySuggestions = await improveClarity(current_text);
      suggestions.push(...claritySuggestions);
    }

    if (assistance_type === 'bias_check' || assistance_type === 'all') {
      const qualityService = new QualityAnalysisService();
      const biasWarnings = await qualityService.detectBias(current_text);
      warnings.push(...biasWarnings);
    }

    // Update session with suggestions
    await updateSession(session.id, {
      total_suggestions: suggestions.length,
      completeness_checks: suggestions.filter(s => s.type === 'completeness'),
      tone_adjustments: suggestions.filter(s => s.type === 'tone'),
      clarity_improvements: suggestions.filter(s => s.type === 'clarity'),
      bias_warnings: warnings
    });

    // Calculate estimated quality impact
    const estimatedImpact = calculateQualityImpact(suggestions, warnings);

    const response: AssistanceResponse = {
      suggestions,
      warnings,
      completeness_score: completenessScore,
      estimated_quality_impact: estimatedImpact
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error providing review assistance:', error);
    return NextResponse.json(
      { error: 'Failed to provide assistance' },
      { status: 500 }
    );
  }
}

/**
 * Check completeness of review section
 */
async function checkCompleteness(
  section: string, 
  text: string
): Promise<AssistanceSuggestion[]> {
  const suggestions: AssistanceSuggestion[] = [];
  
  const minLengths: Record<string, number> = {
    summary: 150,
    strengths: 100,
    weaknesses: 100,
    detailed_comments: 300,
    recommendation: 50
  };

  const requiredElements: Record<string, string[]> = {
    summary: ['main findings', 'methodology', 'contribution'],
    strengths: ['specific examples', 'positive aspects'],
    weaknesses: ['areas for improvement', 'specific issues'],
    detailed_comments: ['specific sections', 'actionable feedback'],
    recommendation: ['clear decision', 'justification']
  };

  // Check minimum length
  const minLength = minLengths[section] || 100;
  if (text.length < minLength) {
    suggestions.push({
      type: 'completeness',
      original_text: text,
      suggested_text: `${text}\n\n[Consider expanding this section with more detail. Aim for at least ${minLength} characters.]`,
      reason: `This section appears too brief. More detail would improve the review quality.`,
      accepted: false,
      timestamp: new Date().toISOString()
    });
  }

  // Check for required elements
  const required = requiredElements[section] || [];
  const lowerText = text.toLowerCase();
  
  for (const element of required) {
    if (!lowerText.includes(element.toLowerCase())) {
      suggestions.push({
        type: 'completeness',
        original_text: text,
        suggested_text: text,
        reason: `Consider addressing "${element}" in this section`,
        accepted: false,
        timestamp: new Date().toISOString()
      });
    }
  }

  return suggestions;
}

/**
 * Analyze and improve tone
 */
async function analyzeTone(text: string): Promise<AssistanceSuggestion[]> {
  if (!text || text.length < 20) return [];

  try {
    const prompt = `
      Analyze the tone of this peer review text and suggest improvements to make it more constructive and professional.
      Focus on:
      1. Replacing harsh or dismissive language
      2. Adding constructive elements
      3. Maintaining professionalism
      
      Text: "${text}"
      
      Return a JSON array of suggestions, each with:
      - original_phrase: the problematic phrase
      - suggested_phrase: the improved version
      - reason: why this change improves the tone
      
      If the tone is already good, return an empty array.
    `;

    const completion = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert in academic writing and peer review. Provide specific, actionable suggestions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content || '{"suggestions": []}');
    
    return (result.suggestions || []).map((s: any) => ({
      type: 'tone' as const,
      original_text: s.original_phrase,
      suggested_text: s.suggested_phrase,
      reason: s.reason,
      accepted: false,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('Tone analysis error:', error);
    return [];
  }
}

/**
 * Improve clarity of text
 */
async function improveClarity(text: string): Promise<AssistanceSuggestion[]> {
  if (!text || text.length < 20) return [];

  const suggestions: AssistanceSuggestion[] = [];

  // Check for overly long sentences
  const sentences = text.split(/[.!?]+/);
  for (const sentence of sentences) {
    if (sentence.split(' ').length > 30) {
      suggestions.push({
        type: 'clarity',
        original_text: sentence.trim(),
        suggested_text: sentence.trim(),
        reason: 'This sentence is very long. Consider breaking it into shorter, clearer sentences.',
        accepted: false,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Check for passive voice
  const passiveIndicators = ['was', 'were', 'been', 'being', 'be'];
  const passivePattern = new RegExp(`\\b(${passiveIndicators.join('|')})\\s+\\w+ed\\b`, 'gi');
  const passiveMatches = text.match(passivePattern);
  
  if (passiveMatches && passiveMatches.length > 2) {
    suggestions.push({
      type: 'clarity',
      original_text: passiveMatches[0],
      suggested_text: passiveMatches[0],
      reason: 'Consider using active voice for clearer, more direct communication.',
      accepted: false,
      timestamp: new Date().toISOString()
    });
  }

  // Check for vague language
  const vagueTerms = ['very', 'really', 'quite', 'somewhat', 'rather', 'fairly'];
  for (const term of vagueTerms) {
    if (text.toLowerCase().includes(term)) {
      suggestions.push({
        type: 'clarity',
        original_text: term,
        suggested_text: '[specific descriptor]',
        reason: `Replace "${term}" with more specific language for clarity.`,
        accepted: false,
        timestamp: new Date().toISOString()
      });
      break; // Only flag once
    }
  }

  return suggestions;
}

/**
 * Calculate completeness score
 */
function calculateCompletenessScore(text: string, section: string): number {
  if (!text) return 0;

  const targetLengths: Record<string, number> = {
    summary: 300,
    strengths: 200,
    weaknesses: 200,
    detailed_comments: 500,
    recommendation: 100
  };

  const target = targetLengths[section] || 200;
  const ratio = text.length / target;
  
  // Score peaks at 1.0 when at target length, decreases if too short or too long
  if (ratio < 1) {
    return ratio;
  } else if (ratio > 2) {
    return Math.max(0.7, 2 - ratio); // Penalty for being too verbose
  } else {
    return 1.0;
  }
}

/**
 * Calculate estimated quality impact
 */
function calculateQualityImpact(
  suggestions: AssistanceSuggestion[], 
  warnings: BiasWarning[]
): number {
  let impact = 0;

  // Each accepted suggestion could improve quality
  const potentialImprovements = suggestions.length * 0.05; // 5% per suggestion
  
  // Bias warnings have higher impact
  const biasImpact = warnings.filter(w => w.severity === 'high').length * 0.1 +
                     warnings.filter(w => w.severity === 'medium').length * 0.05;

  impact = Math.min(0.3, potentialImprovements + biasImpact); // Cap at 30% improvement
  
  return impact;
}

/**
 * Get or create assistance session
 */
async function getOrCreateSession(reviewId: string, reviewerId: string) {
  const supabase = await createClient();
  
  // Check for existing active session (within last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data: existing } = await supabase
    .from('review_assistance_sessions')
    .select('*')
    .eq('review_id', reviewId)
    .eq('reviewer_id', reviewerId)
    .is('session_end', null)
    .gte('session_start', oneHourAgo)
    .single();

  if (existing) {
    return existing;
  }

  // Create new session
  const { data: newSession, error } = await supabase
    .from('review_assistance_sessions')
    .insert({
      review_id: reviewId,
      reviewer_id: reviewerId,
      assistance_level: 'standard'
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return newSession;
}

/**
 * Update assistance session
 */
async function updateSession(sessionId: string, updates: any) {
  const supabase = await createClient();
  
  await supabase
    .from('review_assistance_sessions')
    .update(updates)
    .eq('id', sessionId);
}