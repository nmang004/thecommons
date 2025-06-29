'use client'

import { 
  Lock, 
  DollarSign, 
  Clock, 
  Globe, 
  Users, 
  Shield, 
  Award, 
  BookOpen,
  CheckCircle 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  {
    icon: Lock,
    title: 'Open Access Forever',
    description: 'Every article published is immediately and permanently free to read worldwide. No paywalls, no subscriptions.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: DollarSign,
    title: 'Fair Pricing',
    description: 'Simple, transparent APC of $200 per submission. No hidden fees, no per-page charges, no color figure fees.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Clock,
    title: 'Fast Review Process',
    description: 'Efficient peer review with clear timelines. Most articles receive initial decisions within 6-8 weeks.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Users,
    title: 'Rigorous Peer Review',
    description: 'Double-blind peer review by experts in your field. Quality standards maintained through careful reviewer selection.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Your research accessible to readers in 85+ countries. Indexed in major databases for maximum visibility.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    icon: Shield,
    title: 'Ethical Standards',
    description: 'Committed to research integrity, transparency, and ethical publishing practices. COPE guidelines followed.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
]

const comparisonFeatures = [
  'Immediate open access publication',
  'Transparent, fixed pricing',
  'No subscription fees for readers',
  'Fast, efficient review process',
  'Author retains copyright',
  'Global distribution and indexing',
  'Rigorous quality standards',
  'Ethical publishing practices',
]

export default function FeaturesSection() {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="heading-1 mb-6">
            Why Choose The Commons?
          </h2>
          <p className="text-lg text-muted-foreground">
            We're building the future of academic publishing with principles of 
            openness, fairness, and accessibility at our core.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="card-academic group hover:scale-105 transition-all duration-300"
            >
              <CardHeader>
                <div className={`inline-flex p-3 rounded-xl ${feature.bgColor} mb-4 w-fit`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle className="heading-4">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparison Section */}
        <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-4">
                <Award className="h-8 w-8 text-primary mr-3" />
                <h3 className="heading-2">The Commons Advantage</h3>
              </div>
              <p className="text-lg text-muted-foreground mb-6">
                Traditional academic publishers exploit the system with high profits 
                and restricted access. We're different.
              </p>
              <div className="space-y-3">
                {comparisonFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <Card className="card-academic p-6">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h4 className="heading-3 mb-3">Our Mission</h4>
                  <p className="text-muted-foreground mb-6">
                    To democratize access to scholarly knowledge by providing a 
                    fair, transparent, and sustainable platform for academic publishing.
                  </p>
                  <div className="bg-primary/10 rounded-lg p-4">
                    <p className="text-sm font-medium text-primary">
                      "Knowledge belongs to humanity, not to corporate profits."
                    </p>
                  </div>
                </div>
              </Card>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-secondary/20 rounded-full" />
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-primary/20 rounded-full" />
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h3 className="heading-2 mb-4">Ready to Publish with Us?</h3>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of researchers who have chosen open access. 
            Your work deserves to be freely accessible to all.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="btn-academic btn-primary">
              Submit Your Article
            </button>
            <button className="btn-academic btn-outline">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}