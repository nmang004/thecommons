import { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'
import {
  CheckCircle,
  Users,
  Award,
  BookOpen,
  Globe,
  Star,
  ArrowRight,
  UserPlus,
  Target,
  Shield,
  Zap,
  HeartHandshake
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Become a Reviewer - The Commons',
  description: 'Join our community of expert peer reviewers and help shape the future of academic publishing. Apply to become a reviewer for The Commons platform.',
  keywords: ['peer review', 'academic reviewer', 'scholarly publishing', 'research review', 'academic community'],
  openGraph: {
    title: 'Become a Reviewer - The Commons',
    description: 'Join our community of expert peer reviewers and help shape the future of academic publishing.',
    url: 'https://thecommons.institute/become-reviewer',
    siteName: 'The Commons',
    images: [
      {
        url: '/images/reviewer-hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Join The Commons Reviewer Community',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
}

const benefits = [
  {
    icon: Globe,
    title: 'Global Impact',
    description: 'Help advance scientific knowledge by reviewing cutting-edge research from around the world',
    color: 'text-blue-600'
  },
  {
    icon: Users,
    title: 'Expert Network',
    description: 'Connect with leading researchers and build valuable professional relationships',
    color: 'text-green-600'
  },
  {
    icon: Award,
    title: 'Recognition',
    description: 'Earn badges and build your reputation as a trusted expert in your field',
    color: 'text-amber-600'
  },
  {
    icon: Zap,
    title: 'Professional Development',
    description: 'Stay current with research trends and develop critical evaluation skills',
    color: 'text-purple-600'
  },
  {
    icon: HeartHandshake,
    title: 'Fair Compensation',
    description: 'Receive fair recognition for your expertise and time contribution',
    color: 'text-rose-600'
  },
  {
    icon: Shield,
    title: 'Quality Assurance',
    description: 'Maintain high standards of scholarly publication with our quality-focused approach',
    color: 'text-indigo-600'
  }
]

const requirements = [
  {
    category: 'Education',
    items: ['PhD or equivalent terminal degree', 'Active research experience', 'Published peer-reviewed work']
  },
  {
    category: 'Experience',
    items: ['Minimum 3 years post-graduation research', 'At least 5 peer-reviewed publications', 'Previous review experience preferred']
  },
  {
    category: 'Expertise',
    items: ['Deep knowledge in specific research areas', 'Current with field developments', 'Critical analysis skills']
  },
  {
    category: 'Commitment',
    items: ['Available for 2-3 reviews per month', 'Meet review deadlines consistently', 'Provide constructive feedback']
  }
]

const reviewProcess = [
  {
    step: '1',
    title: 'Application',
    description: 'Submit your reviewer application with expertise areas and CV',
    icon: UserPlus
  },
  {
    step: '2',
    title: 'Review',
    description: 'Our editorial team evaluates your qualifications and experience',
    icon: Target
  },
  {
    step: '3',
    title: 'Onboarding',
    description: 'Complete our reviewer training and platform orientation',
    icon: BookOpen
  },
  {
    step: '4',
    title: 'Start Reviewing',
    description: 'Receive your first manuscript invitations and begin contributing',
    icon: Star
  }
]

const stats = [
  { number: '500+', label: 'Active Reviewers' },
  { number: '95%', label: 'Review Quality Score' },
  { number: '21', label: 'Avg Days to Review' },
  { number: '40+', label: 'Research Fields' }
]

export default function BecomeReviewerPage() {
  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-16 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="inline-flex items-center space-x-2 mb-6 bg-blue-100 text-blue-800 border-blue-200">
                <Users className="w-4 h-4" />
                <span>Join Our Expert Community</span>
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl font-heading font-bold text-gray-900 mb-6 leading-tight">
                Shape the Future of 
                <span className="block text-blue-600">Academic Publishing</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join our community of expert peer reviewers and help maintain the highest standards 
                of scholarly research. Make a meaningful impact on scientific progress while building 
                your professional reputation.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/auth/register?role=reviewer">
                    <UserPlus className="w-5 h-5 mr-2" />
                    Apply Now
                  </Link>
                </Button>
                
                <Button variant="outline" size="lg" asChild>
                  <Link href="#requirements">
                    Learn More
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stat.number}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Quick Application
                  </h3>
                  <p className="text-gray-600">
                    Get started in minutes with our streamlined process
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>No lengthy forms</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Quick qualification review</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Start reviewing within days</span>
                  </div>
                </div>
                
                <Button className="w-full mt-6" asChild>
                  <Link href="/auth/register?role=reviewer">
                    Start Application
                  </Link>
                </Button>
              </div>
              
              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-amber-400 rounded-full flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
              Why Become a Reviewer?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join a community that values expertise, promotes excellence, and rewards 
              meaningful contributions to academic progress.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br from-gray-50 to-white">
                <div className={`w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-4`}>
                  <benefit.icon className={`w-6 h-6 ${benefit.color}`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {benefit.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section id="requirements" className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
              Reviewer Requirements
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We maintain high standards to ensure quality reviews. Here's what we look for 
              in our expert reviewers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {requirements.map((req, index) => (
              <Card key={index} className="p-6 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  {req.category}
                </h3>
                <ul className="space-y-2">
                  {req.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
              Application Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our streamlined application process gets you reviewing quality manuscripts 
              as quickly as possible.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {reviewProcess.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold z-10">
                  {step.step}
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
                
                {/* Connector Line */}
                {index < reviewProcess.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-gray-200 z-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How much time does reviewing take?
              </h3>
              <p className="text-gray-600">
                Most reviews take 3-5 hours to complete. We provide estimated time commitments 
                upfront so you can plan accordingly. You can set your availability and workload preferences.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How are reviewers compensated?
              </h3>
              <p className="text-gray-600">
                We believe in fair compensation for expertise. Reviewers receive recognition credits, 
                professional development opportunities, and monetary compensation based on review complexity.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What if I need to decline a review?
              </h3>
              <p className="text-gray-600">
                Absolutely no problem! You can decline any invitation without penalty. We encourage 
                honest availability and only assign reviews when you're ready to contribute.
              </p>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                How do you ensure review quality?
              </h3>
              <p className="text-gray-600">
                We provide comprehensive guidelines, sample reviews, and ongoing feedback. Our platform 
                includes quality assessment tools and peer recognition systems to maintain high standards.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-heading font-bold mb-4">
              Ready to Make an Impact?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Join hundreds of expert reviewers who are shaping the future of academic publishing. 
              Your expertise can help advance scientific knowledge worldwide.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                asChild
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Link href="/auth/register?role=reviewer">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Start Your Application
                </Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                asChild
                className="border-white text-white hover:bg-white hover:text-blue-600"
              >
                <Link href="/guidelines">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Review Guidelines
                </Link>
              </Button>
            </div>
            
            <p className="text-sm opacity-75 mt-6">
              Already have an account? <Link href="/auth/login" className="underline hover:no-underline">Sign in here</Link>
            </p>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  )
}