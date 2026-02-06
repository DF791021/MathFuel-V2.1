import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import TeacherChatbot from "@/components/TeacherChatbot";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Trash2, Edit, Users, BookOpen, Trophy, 
  Copy, CheckCircle, XCircle, ArrowLeft, Sparkles,
  GraduationCap, ClipboardList, BarChart3, Award, Clock, Target, Bell, Brain
} from "lucide-react";
import Certificate from "@/components/Certificate";
import BatchCertificates from "@/components/BatchCertificates";
import ScheduledEmails from "@/components/ScheduledEmails";
import GoalsManagement from "@/components/GoalsManagement";
import TeacherGoalMonitoringDashboard from "@/components/TeacherGoalMonitoringDashboard";
import { AlertEngagementDashboard } from "@/components/AlertEngagementDashboard";
import SuccessStoriesGallery from "@/components/SuccessStoriesGallery";
import ExportSuccessStoriesPDF from "@/components/ExportSuccessStoriesPDF";
import { getLoginUrl } from "@/const";

const CATEGORIES = [
  { value: "arithmetic", label: "Arithmetic", color: "bg-blue-500" },
  { value: "algebra", label: "Algebra", color: "bg-purple-500" },
  { value: "geometry", label: "Geometry", color: "bg-green-500" },
  { value: "statistics", label: "Statistics & Probability", color: "bg-orange-500" },
  { value: "fractions", label: "Fractions & Decimals", color: "bg-red-500" },
  { value: "problem-solving", label: "Problem Solving", color: "bg-indigo-500" },
];

export default function TeacherPortal() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  
  // Form states
  const [newQuestion, setNewQuestion] = useState({
    category: "",
    questionType: "question" as "question" | "activity",
    question: "",
    answer: "",
  });
  const [newClassName, setNewClassName] = useState("");

  // Queries
  const { data: myQuestions, refetch: refetchQuestions } = trpc.questions.getMyQuestions.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: myClasses, refetch: refetchClasses } = trpc.classes.getMyClasses.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutations
  const createQuestion = trpc.questions.create.useMutation({
    onSuccess: () => {
      toast.success("Math problem created!");
      refetchQuestions();
      setIsAddQuestionOpen(false);
      setNewQuestion({ category: "", questionType: "question", question: "", answer: "" });
    },
  });
  const updateQuestion = trpc.questions.update.useMutation({
    onSuccess: () => {
      toast.success("Problem updated!");
      refetchQuestions();
      setEditingQuestion(null);
    },
  });
  const deleteQuestion = trpc.questions.delete.useMutation({
    onSuccess: () => {
      toast.success("Problem deleted!");
      refetchQuestions();
    },
  });
  const createClass = trpc.classes.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Class created! Join code: ${data?.joinCode}`);
      refetchClasses();
      setIsAddClassOpen(false);
      setNewClassName("");
    },
  });

  const handleCreateQuestion = () => {
    if (!newQuestion.category || !newQuestion.question) {
      toast.error("Please fill in all required fields");
      return;
    }
    createQuestion.mutate(newQuestion);
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion.category || !editingQuestion.question) {
      toast.error("Please fill in all required fields");
      return;
    }
    updateQuestion.mutate(editingQuestion);
  };

  const handleCreateClass = () => {
    if (!newClassName.trim()) {
      toast.error("Please enter a class name");
      return;
    }
    createClass.mutate({ name: newClassName });
  };

  if (loading) {
    return <div className="container py-12">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="container py-12 text-center">
        <p className="mb-4">Please log in to access the teacher portal.</p>
        <Button onClick={() => window.location.href = getLoginUrl()}>Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b-2 border-primary sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-primary">Teacher Portal</h1>
                <p className="text-xs sm:text-sm text-gray-600">Manage your math classes and content</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/";
              }}
              className="text-xs sm:text-sm"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        <Tabs defaultValue="classes" className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 mb-8">
            <TabsTrigger value="classes" className="text-xs sm:text-sm">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Classes</span>
            </TabsTrigger>
            <TabsTrigger value="problems" className="text-xs sm:text-sm">
              <BookOpen className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Problems</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="tools" className="text-xs sm:text-sm">
              <Sparkles className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Tools</span>
            </TabsTrigger>
          </TabsList>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">My Classes</h2>
                <p className="text-sm text-gray-600">Manage your student groups</p>
              </div>
              <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">New Class</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Class name (e.g., Algebra 101)"
                      value={newClassName}
                      onChange={(e) => setNewClassName(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddClassOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateClass}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myClasses?.map((cls: any) => (
                <motion.div
                  key={cls.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-lg transition h-full">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {cls.name}
                      </CardTitle>
                      <CardDescription>
                        <Badge variant="outline" className="mt-2">
                          Code: {cls.joinCode}
                        </Badge>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <p>{cls.studentCount || 0} students</p>
                      </div>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Copy className="h-4 w-4" />
                        Copy Code
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Problems Tab */}
          <TabsContent value="problems" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">Math Problems</h2>
                <p className="text-sm text-gray-600">Create and manage custom problems</p>
              </div>
              <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">New Problem</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Problem</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Select value={newQuestion.category} onValueChange={(value) => setNewQuestion({...newQuestion, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Problem statement"
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                      className="min-h-24"
                    />
                    <Textarea
                      placeholder="Correct answer/solution"
                      value={newQuestion.answer}
                      onChange={(e) => setNewQuestion({...newQuestion, answer: e.target.value})}
                      className="min-h-24"
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddQuestionOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateQuestion}>Create</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {myQuestions?.map((q: any) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="hover:shadow-md transition">
                    <CardHeader>
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={CATEGORIES.find(c => c.value === q.category)?.color}>
                              {CATEGORIES.find(c => c.value === q.category)?.label}
                            </Badge>
                          </div>
                          <CardTitle className="text-base sm:text-lg">{q.question}</CardTitle>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingQuestion(q)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteQuestion.mutate({ id: q.id })}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600"><strong>Answer:</strong> {q.answer}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-4">Class Analytics</h2>
              <TeacherGoalMonitoringDashboard />
            </div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-500" />
                    Certificates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <BatchCertificates />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-500" />
                    Engagement Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertEngagementDashboard />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-500" />
                  Student Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GoalsManagement />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
