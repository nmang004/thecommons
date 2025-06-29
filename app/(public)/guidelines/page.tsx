import { Metadata } from 'next'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Users, 
  Shield,
  AlertCircle,
  BookOpen,
  Download,
  Mail,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Author Guidelines - The Commons',
  description: 'Comprehensive guidelines for authors submitting to The Commons. Learn about our submission process, formatting requirements, and publication standards.',
  keywords: ['author guidelines', 'submission', 'manuscript preparation', 'academic publishing', 'peer review'],
}

const submissionSteps = [
  {
    step: 1,
    title: 'Manuscript Type & Field',
    description: 'Select your manuscript type and field of study',
    icon: BookOpen,
  },
  {
    step: 2,
    title: 'Title & Abstract',
    description: 'Provide your title, abstract, and keywords',
    icon: FileText,
  },
  {
    step: 3,
    title: 'Authors & Affiliations',
    description: 'Add all authors and their institutional affiliations',
    icon: Users,
  },
  {
    step: 4,
    title: 'File Upload',
    description: 'Upload your manuscript and supplementary files',
    icon: Download,
  },
  {
    step: 5,
    title: 'Additional Information',
    description: 'Provide funding, conflicts, and data availability statements',
    icon: Shield,
  },
  {
    step: 6,
    title: 'Review & Payment',
    description: 'Review submission and complete publication fee payment',
    icon: DollarSign,
  },
]

const manuscriptTypes = [
  {
    type: 'Research Article',
    description: 'Original research with novel findings',
    wordLimit: '8,000 words',
    figureLimit: '10 figures/tables',
  },
  {
    type: 'Review Article',
    description: 'Comprehensive review of existing literature',
    wordLimit: '12,000 words',
    figureLimit: '8 figures/tables',
  },
  {
    type: 'Short Communication',
    description: 'Brief report of significant findings',
    wordLimit: '3,000 words',
    figureLimit: '4 figures/tables',
  },
  {
    type: 'Case Study',
    description: 'Detailed analysis of specific cases',
    wordLimit: '5,000 words',
    figureLimit: '6 figures/tables',
  },
]

const formattingRequirements = [
  'Double-spaced, 12-point Times New Roman font',
  'Line numbers on all pages',
  'Page numbers in the footer',
  'Margins of at least 1 inch on all sides',
  'References in a standard academic format (APA, MLA, or Chicago)',
  'Figures and tables with clear captions',
  'High-resolution images (minimum 300 DPI)',
  'Supplementary files clearly labeled',
]

const ethicalRequirements = [
  'Original work that has not been published elsewhere',
  'Proper attribution of all sources and previous work',
  'Disclosure of all conflicts of interest',
  'Approval from relevant ethics committees when applicable',
  'Consent from human subjects for research involving people',
  'Compliance with animal welfare guidelines for animal research',
  'Honest reporting of methodology and results',
  'Data availability and reproducibility considerations',
]

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="heading-display mb-6">Author Guidelines</h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Everything you need to know about submitting your research to The Commons. 
              We're committed to making the submission process as straightforward as possible 
              while maintaining the highest standards of academic publishing.
            </p>
            <div className="flex justify-center space-x-4">
              <Button asChild className="btn-primary">
                <Link href="/author/submit">
                  Start Submission
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/guidelines/template.docx">
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Quick Overview */}
        <section className="mb-16">
          <Alert className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Quick Facts</AlertTitle>
            <AlertDescription>
              Publication fee: $200 • Average review time: 6-8 weeks • Open access: Immediate and permanent
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <DollarSign className="h-8 w-8 mx-auto mb-3 text-green-600" />
              <h3 className="heading-4 mb-2">Fair Pricing</h3>
              <p className="text-sm text-muted-foreground">
                Simple $200 APC with no hidden fees
              </p>
            </Card>
            <Card className="text-center p-6">
              <Clock className="h-8 w-8 mx-auto mb-3 text-blue-600" />
              <h3 className="heading-4 mb-2">Fast Review</h3>
              <p className="text-sm text-muted-foreground">
                Efficient peer review process
              </p>
            </Card>
            <Card className="text-center p-6">
              <Eye className="h-8 w-8 mx-auto mb-3 text-purple-600" />
              <h3 className="heading-4 mb-2">Open Access</h3>
              <p className="text-sm text-muted-foreground">
                Immediate global accessibility
              </p>
            </Card>
          </div>
        </section>

        {/* Submission Process */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="heading-1 mb-6">Submission Process</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our streamlined submission process guides you through each step, 
              ensuring all necessary information is provided for efficient review.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissionSteps.map((step, index) => (
              <Card key={index} className="card-academic">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-sm">
                      {step.step}
                    </div>
                    <step.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Manuscript Types */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="heading-1 mb-6">Manuscript Types</h2>
            <p className="text-lg text-muted-foreground">
              We accept various types of scholarly contributions across all academic disciplines.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {manuscriptTypes.map((type, index) => (
              <Card key={index} className="card-academic">
                <CardHeader>
                  <CardTitle className="heading-4">{type.type}</CardTitle>
                  <p className="text-muted-foreground">{type.description}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Word Limit:</span>
                      <Badge variant="secondary">{type.wordLimit}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Figures/Tables:</span>
                      <Badge variant="secondary">{type.figureLimit}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Formatting Requirements */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="heading-1 mb-6">Formatting Requirements</h2>
            <p className="text-lg text-muted-foreground">
              Please ensure your manuscript follows these formatting guidelines before submission.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Manuscript Format
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {formattingRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{requirement}</p>
                  </div>
                ))}
              </div>
              
              <Separator className="my-6" />
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">File Formats Accepted</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">.docx</Badge>
                  <Badge variant="outline">.pdf</Badge>
                  <Badge variant="outline">.tex</Badge>
                  <Badge variant="outline">.png</Badge>
                  <Badge variant="outline">.jpg</Badge>
                  <Badge variant="outline">.tiff</Badge>
                  <Badge variant="outline">.eps</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Ethical Requirements */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="heading-1 mb-6">Ethical Standards</h2>
            <p className="text-lg text-muted-foreground">
              We are committed to the highest standards of research integrity and ethical publishing.
            </p>
          </div>

          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Research Ethics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ethicalRequirements.map((requirement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{requirement}</p>
                  </div>
                ))}
              </div>
              
              <Alert className="mt-6">
                <Shield className="h-4 w-4" />
                <AlertTitle>COPE Guidelines</AlertTitle>
                <AlertDescription>
                  The Commons follows the Committee on Publication Ethics (COPE) guidelines. 
                  All submissions are screened for plagiarism and research misconduct.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </section>

        {/* Peer Review Process */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="heading-1 mb-6">Peer Review Process</h2>
            <p className="text-lg text-muted-foreground">
              Our rigorous double-blind peer review ensures quality while maintaining fairness.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              <Card className="card-academic">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <h3 className="heading-4 mb-2">Initial Editorial Review</h3>
                      <p className="text-muted-foreground">
                        Manuscripts are first reviewed by our editorial team for scope, 
                        quality, and completeness (typically 3-5 days).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-academic">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <h3 className="heading-4 mb-2">Reviewer Assignment</h3>
                      <p className="text-muted-foreground">
                        We select 2-3 expert reviewers based on their expertise in your 
                        research area (typically 5-7 days).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-academic">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <h3 className="heading-4 mb-2">Peer Review</h3>
                      <p className="text-muted-foreground">
                        Reviewers evaluate your manuscript for originality, methodology, 
                        and significance (typically 3-4 weeks).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="card-academic">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-primary font-bold">4</span>
                    </div>
                    <div>
                      <h3 className="heading-4 mb-2">Editorial Decision</h3>
                      <p className="text-muted-foreground">
                        Based on reviewer feedback, we make a decision: accept, revise, 
                        or reject (typically 1-2 days after reviews).
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Contact and Support */}
        <section>
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-none">
            <CardContent className="p-12 text-center">
              <h2 className="heading-1 mb-6">Need Help?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Our editorial team is here to support you throughout the submission process. 
                Don't hesitate to reach out with any questions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild>
                  <Link href="mailto:editorial@thecommons.org">
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Editorial Team
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/faq">
                    View FAQ
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}