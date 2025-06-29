import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import ArticleView from '@/components/public/article-view'

interface ArticlePageProps {
  params: Promise<{ id: string }>
}

async function getArticle(id: string) {
  const supabase = await createServiceClient()
  
  const { data: article, error } = await supabase
    .from('manuscripts')
    .select(`
      *,
      author:profiles!manuscripts_author_id_fkey (
        id,
        full_name,
        affiliation,
        orcid,
        avatar_url
      ),
      coauthors:manuscript_coauthors (*),
      files:manuscript_files (*)
    `)
    .eq('id', id)
    .eq('status', 'published')
    .single()

  if (error || !article) {
    return null
  }

  // Increment view count
  await supabase
    .from('manuscripts')
    .update({ view_count: (article.view_count || 0) + 1 })
    .eq('id', id)

  return article
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params
  const article = await getArticle(id)

  if (!article) {
    return {
      title: 'Article Not Found - The Commons',
    }
  }

  const description = article.abstract ? 
    article.abstract.slice(0, 160) + (article.abstract.length > 160 ? '...' : '') :
    'Open access academic article published on The Commons'

  return {
    title: `${article.title} - The Commons`,
    description,
    keywords: article.keywords || [],
    authors: [
      { name: article.author?.full_name || 'Unknown' },
      ...(article.coauthors || []).map((coauthor: any) => ({ name: coauthor.name }))
    ],
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      publishedTime: article.published_at,
      authors: [
        article.author?.full_name || 'Unknown',
        ...(article.coauthors || []).map((coauthor: any) => coauthor.name)
      ],
      section: article.field_of_study,
      tags: article.keywords || [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
    },
    other: {
      'citation_title': article.title,
      'citation_author': article.author?.full_name || 'Unknown',
      'citation_publication_date': article.published_at?.split('T')[0] || '',
      'citation_journal_title': 'The Commons',
      'citation_doi': article.doi || '',
    }
  }
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params
  const article = await getArticle(id)

  if (!article) {
    notFound()
  }

  return <ArticleView article={article} />
}