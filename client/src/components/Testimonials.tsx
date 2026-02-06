import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useState } from "react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  school?: string;
  quote: string;
  rating: number;
  image?: string;
  category: "teacher" | "parent";
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Sarah Martinez",
    role: "4th Grade Teacher",
    school: "Lincoln Elementary School",
    quote:
      "MathMastery has completely transformed how my students engage with math. They're excited to come to class, and I can see real improvement in their problem-solving skills. The adaptive learning means every student is challenged at the right level.",
    rating: 5,
    category: "teacher",
  },
  {
    id: 2,
    name: "James Chen",
    role: "Parent",
    school: "Madison District",
    quote:
      "My daughter went from dreading math homework to asking when she can play MathMastery next. The parent dashboard lets me track her progress and celebrate her wins with her. It's made a huge difference in her confidence.",
    rating: 5,
    category: "parent",
  },
  {
    id: 3,
    name: "Dr. Patricia Okonkwo",
    role: "Math Department Head",
    school: "Central Middle School",
    quote:
      "The analytics dashboard gives me insights I've never had before. I can identify struggling students early and provide targeted support. MathMastery has become an essential tool for our entire department.",
    rating: 5,
    category: "teacher",
  },
  {
    id: 4,
    name: "Michael Rodriguez",
    role: "Parent",
    school: "Riverside Elementary",
    quote:
      "As a working parent, I appreciate how easy it is to stay connected to my son's learning. The messaging feature lets me communicate with his teacher, and I can see exactly where he needs help. It's peace of mind in an app.",
    rating: 5,
    category: "parent",
  },
  {
    id: 5,
    name: "Lisa Thompson",
    role: "5th Grade Teacher",
    school: "Westside Academy",
    quote:
      "The gamification keeps students motivated without feeling like they're being tricked into learning. They're developing real mathematical thinking, not just memorizing facts. This is what education should look like.",
    rating: 5,
    category: "teacher",
  },
  {
    id: 6,
    name: "David Park",
    role: "Parent",
    school: "North County Schools",
    quote:
      "MathMastery helped my son overcome his math anxiety. Seeing his progress tracked visually and celebrating achievements with him has been transformative. He actually looks forward to math now!",
    rating: 5,
    category: "parent",
  },
];

export default function Testimonials() {
  const [activeFilter, setActiveFilter] = useState<"all" | "teacher" | "parent">(
    "all"
  );

  const filteredTestimonials =
    activeFilter === "all"
      ? testimonials
      : testimonials.filter((t) => t.category === activeFilter);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by Teachers & Parents
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how MathMastery is transforming math education and building
            confidence in students across Wisconsin and beyond.
          </p>
        </motion.div>

        {/* Filter Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          <button
            onClick={() => setActiveFilter("all")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeFilter === "all"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Testimonials
          </button>
          <button
            onClick={() => setActiveFilter("teacher")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeFilter === "teacher"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Teachers
          </button>
          <button
            onClick={() => setActiveFilter("parent")}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              activeFilter === "parent"
                ? "bg-orange-600 text-white shadow-lg"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Parents
          </button>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredTestimonials.map((testimonial) => (
            <motion.div key={testimonial.id} variants={itemVariants}>
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-gray-50 to-white">
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Quote Icon */}
                  <div className="mb-4">
                    <Quote
                      className={`w-8 h-8 ${
                        testimonial.category === "teacher"
                          ? "text-purple-400"
                          : "text-orange-400"
                      }`}
                    />
                  </div>

                  {/* Quote Text */}
                  <p className="text-gray-700 mb-6 flex-grow leading-relaxed">
                    "{testimonial.quote}"
                  </p>

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Author Info */}
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                    {testimonial.school && (
                      <p className="text-xs text-gray-500 mt-1">
                        {testimonial.school}
                      </p>
                    )}
                  </div>

                  {/* Category Badge */}
                  <div className="mt-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        testimonial.category === "teacher"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {testimonial.category === "teacher"
                        ? "Educator"
                        : "Parent"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t"
        >
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600 mb-2">500+</p>
            <p className="text-gray-600">Schools & Districts</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-purple-600 mb-2">50K+</p>
            <p className="text-gray-600">Active Students</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-orange-600 mb-2">4.9/5</p>
            <p className="text-gray-600">Average Rating</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
