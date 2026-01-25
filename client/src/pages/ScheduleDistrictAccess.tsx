import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, Star, Users, Zap } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function ScheduleDistrictAccess() {
  const [formData, setFormData] = useState({
    districtName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    studentCount: "",
    message: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Send notification to sales team
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      setSubmitted(true);
      setTimeout(() => {
        setFormData({
          districtName: "",
          contactName: "",
          contactEmail: "",
          contactPhone: "",
          studentCount: "",
          message: "",
        });
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Schedule District Access</h1>
          <p className="text-xl text-gray-600 mt-2">Transform your district's nutrition education with Wisconsin Food Explorer</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pricing Tiers */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Pricing Tiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* School License */}
              <Card className="border-2 border-gray-200 hover:border-green-500 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-green-600" />
                    School License
                  </CardTitle>
                  <CardDescription>Perfect for individual schools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-gray-900">
                    Custom Pricing
                    <span className="text-lg text-gray-600 font-normal">/year</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Up to 500 students",
                      "All game features",
                      "Certificate generation",
                      "Email templates",
                      "Basic analytics",
                      "Email support",
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-green-600 hover:bg-green-700">Learn More</Button>
                </CardContent>
              </Card>

              {/* District License */}
              <Card className="border-2 border-green-500 bg-green-50 relative">
                <div className="absolute top-0 right-0 bg-green-600 text-white px-3 py-1 rounded-bl-lg text-sm font-bold">Popular</div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    District License
                  </CardTitle>
                  <CardDescription>Best for districts & regions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-gray-900">
                    Custom Pricing
                    <span className="text-lg text-gray-600 font-normal">/year</span>
                  </div>
                  <ul className="space-y-3">
                    {[
                      "Unlimited students",
                      "All game features",
                      "Advanced analytics",
                      "Custom branding",
                      "Priority support",
                      "Professional onboarding",
                      "Dedicated account manager",
                    ].map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-gray-700">
                        <Check className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full bg-green-600 hover:bg-green-700">Get Started</Button>
                </CardContent>
              </Card>
            </div>

            {/* Case Studies */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  school: "Madison Central School District",
                  quote: "Wisconsin Food Explorer transformed how we teach nutrition. Students are more engaged, and teachers love the certificate feature.",
                  author: "Dr. Sarah Johnson, Curriculum Director",
                  students: "2,500+",
                },
                {
                  school: "Milwaukee Public Schools",
                  quote: "The analytics dashboard gives us insights into student learning patterns. We've seen a 35% improvement in nutrition knowledge scores.",
                  author: "James Chen, Health Education Coordinator",
                  students: "5,000+",
                },
              ].map((study, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-gray-700 mb-4 italic">"{study.quote}"</p>
                    <div className="border-t pt-4">
                      <p className="font-semibold text-gray-900">{study.school}</p>
                      <p className="text-sm text-gray-600">{study.author}</p>
                      <p className="text-sm text-green-600 font-semibold mt-2">{study.students} students</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Schedule a Demo</CardTitle>
                <CardDescription>Our team will reach out within 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you!</h3>
                    <p className="text-gray-600">We'll contact you soon to schedule your demo.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">District Name</label>
                      <Input
                        type="text"
                        name="districtName"
                        value={formData.districtName}
                        onChange={handleChange}
                        placeholder="Your district"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                      <Input
                        type="text"
                        name="contactName"
                        value={formData.contactName}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        type="email"
                        name="contactEmail"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <Input
                        type="tel"
                        name="contactPhone"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Students</label>
                      <Input
                        type="number"
                        name="studentCount"
                        value={formData.studentCount}
                        onChange={handleChange}
                        placeholder="e.g., 1000"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Message (Optional)</label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your needs..."
                        className="w-full"
                        rows={3}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? "Submitting..." : "Schedule Demo"}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      We respect your privacy. Your information is safe with us.
                    </p>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 bg-white rounded-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Why Choose Wisconsin Food Explorer?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "🎮",
                title: "Engaging Games",
                description: "Interactive nutrition games that keep students engaged and learning",
              },
              {
                icon: "📜",
                title: "Certificates",
                description: "Professional certificates to recognize student achievement",
              },
              {
                icon: "📊",
                title: "Analytics",
                description: "Detailed insights into student learning and engagement",
              },
              {
                icon: "✉️",
                title: "Email Templates",
                description: "Customizable email templates for communication",
              },
              {
                icon: "🎨",
                title: "Custom Branding",
                description: "White-label options for district branding",
              },
              {
                icon: "🤝",
                title: "Support",
                description: "Dedicated support team to help you succeed",
              },
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
