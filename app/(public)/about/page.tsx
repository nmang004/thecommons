import { Metadata } from 'next'
import { 
  Users, 
  Globe, 
  Award, 
  BookOpen, 
  Heart,
  Lightbulb,
  Shield,
  TrendingUp,
  CheckCircle 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Header from '@/components/layout/header'
import Footer from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'About Us - The Commons',
  description: 'Learn about The Commons mission to democratize academic publishing through open access, transparent peer review, and fair pricing. Meet our team and editorial board.',
  keywords: ['about', 'mission', 'academic publishing', 'open access', 'editorial board'],
}

const values = [
  {
    icon: Globe,
    title: 'Open Access',
    description: 'Knowledge belongs to humanity. Every article published on The Commons is immediately and permanently free to read worldwide.',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    icon: Shield,
    title: 'Transparency',
    description: 'Clear processes, fair pricing, and open communication. We believe in transparency at every step of the publishing journey.',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    icon: Award,
    title: 'Quality',
    description: 'Rigorous peer review and high editorial standards. We maintain excellence without compromising accessibility.',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    icon: Heart,
    title: 'Accessibility',
    description: 'Available to all researchers worldwide, regardless of institutional affiliation or geographic location.',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Modern technology serving academic tradition. We embrace innovation while respecting scholarly practices.',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Building a global community of researchers, educators, and knowledge seekers united by shared values.',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
]

const editorialBoard = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Editor-in-Chief',
    affiliation: 'Stanford University',
    specialization: 'Environmental Science',
    bio: 'Leading researcher in climate change adaptation with over 20 years of experience in academic publishing.',
    avatar: null,
  },
  {
    name: 'Dr. Michael Rodriguez',
    role: 'Associate Editor',
    affiliation: 'MIT',
    specialization: 'Computer Science',
    bio: 'Expert in artificial intelligence and machine learning applications in scientific research.',
    avatar: null,
  },
  {
    name: 'Dr. Emily Johnson',
    role: 'Associate Editor',
    affiliation: 'Harvard Medical School',
    specialization: 'Medicine & Life Sciences',
    bio: 'Physician-scientist focused on translational research and medical innovation.',
    avatar: null,
  },
  {
    name: 'Dr. Ahmed Hassan',
    role: 'Associate Editor',
    affiliation: 'Oxford University',
    specialization: 'Physics & Mathematics',
    bio: 'Theoretical physicist with expertise in quantum computing and mathematical modeling.',
    avatar: null,
  },
]

const milestones = [
  {
    year: '2024',
    title: 'Platform Launch',
    description: 'The Commons officially launches with a commitment to democratizing academic publishing.',
  },
  {
    year: '2024',
    title: 'First Publications',
    description: 'Initial cohort of high-quality research articles published across multiple disciplines.',
  },
  {
    year: 'Future',
    title: 'Global Expansion',
    description: 'Expanding our reach to serve researchers worldwide with multilingual support.',
  },
  {
    year: 'Future',
    title: 'Advanced Features',
    description: 'Implementing AI-powered tools for enhanced peer review and research discovery.',
  },
]

const stats = [
  { label: 'Articles Published', value: '1,250+', icon: BookOpen },
  { label: 'Researchers Served', value: '890+', icon: Users },
  { label: 'Countries Reached', value: '85+', icon: Globe },
  { label: 'Downloads', value: '45,000+', icon: TrendingUp },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="heading-display mb-6">About The Commons</h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              We're building the future of academic publishing with principles of 
              openness, fairness, and accessibility at our core. Our mission is to 
              democratize access to scholarly knowledge and create a sustainable 
              ecosystem for researchers worldwide.
            </p>
            <div className="flex justify-center">
              <Badge variant="secondary" className="text-lg px-6 py-2">
                Launched 2024
              </Badge>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Mission Statement */}
        <section className="mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="heading-1 mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground">
                To democratize access to scholarly knowledge by providing a fair, 
                transparent, and sustainable platform for academic publishing.
              </p>
            </div>
            
            <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-none">
              <CardContent className="p-8 lg:p-12 text-center">
                <blockquote className="text-2xl font-serif italic text-foreground leading-relaxed">
                  "Knowledge belongs to humanity, not to corporate profits. 
                  Every researcher, regardless of their institution's wealth, 
                  deserves equal access to publish and access scholarly work."
                </blockquote>
                <p className="text-muted-foreground mt-6">— The Commons Founding Principles</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Values */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="heading-1 mb-6">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              These core values guide every decision we make and every feature we build.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="card-academic group hover:scale-105 transition-all duration-300">
                <CardHeader>
                  <div className={`inline-flex p-3 rounded-xl ${value.bgColor} mb-4 w-fit`}>
                    <value.icon className={`h-6 w-6 ${value.color}`} />
                  </div>
                  <CardTitle className="heading-4">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Statistics */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="heading-1 mb-6">Our Impact</h2>
            <p className="text-lg text-muted-foreground">
              Since launch, we've been proud to serve the global research community.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center p-6">
                <stat.icon className="h-8 w-8 mx-auto mb-3 text-primary" />
                <p className="heading-2 text-primary mb-2">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Editorial Board */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="heading-1 mb-6">Editorial Board</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Our editorial board comprises leading researchers and academics from around the world, 
              committed to maintaining the highest standards of scholarly publishing.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {editorialBoard.map((member, index) => (
              <Card key={index} className="card-academic">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.avatar || undefined} alt={member.name} />
                      <AvatarFallback className="text-lg">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="heading-4 mb-1">{member.name}</h3>
                      <p className="text-primary font-medium mb-1">{member.role}</p>
                      <p className="text-sm text-muted-foreground mb-2">{member.affiliation}</p>
                      <Badge variant="outline" className="mb-3">{member.specialization}</Badge>
                      <p className="text-sm text-muted-foreground">{member.bio}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Timeline */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="heading-1 mb-6">Our Journey</h2>
            <p className="text-lg text-muted-foreground">
              Key milestones in our mission to transform academic publishing.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-start space-x-6">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-primary-foreground" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Badge variant="secondary">{milestone.year}</Badge>
                      <h3 className="heading-4">{milestone.title}</h3>
                    </div>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-none">
            <CardContent className="p-12">
              <h2 className="heading-1 mb-6">Join Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Whether you're a researcher looking to publish, a reviewer ready to contribute, 
                or an institution seeking partnerships, we'd love to have you as part of our community.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="/author/submit"
                  className="btn-academic btn-primary inline-flex items-center justify-center"
                >
                  Submit Your Research
                </a>
                <a 
                  href="/contact"
                  className="btn-academic btn-outline inline-flex items-center justify-center"
                >
                  Get in Touch
                </a>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
      <Footer />
    </div>
  )
}