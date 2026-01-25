import { useState } from "react";
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
  GraduationCap, ClipboardList, BarChart3, Award, Clock, Target, Bell 
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
  { value: "energy", label: "Energy & Growth", color: "bg-green-500" },
  { value: "safety", label: "Food Safety", color: "bg-red-500" },
  { value: "literacy", label: "Nutrition Literacy", color: "bg-blue-500" },
  { value: "culture", label: "Food & Culture", color: "bg-purple-500" },
  { value: "health", label: "Healthy Behaviors", color: "bg-orange-500" },
  { value: "classification", label: "Food Classification", color: "bg-teal-500" },
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
      toast.success("Question created!");
      refetchQuestions();
      setIsAddQuestionOpen(false);
      setNewQuestion({ category: "", questionType: "question", question: "", answer: "" });
    },
  });
  const updateQuestion = trpc.questions.update.useMutation({
    onSuccess: () => {
      toast.success("Question updated!");
      refetchQuestions();
      setEditingQuestion(null);
    },
  });
  const deleteQuestion = trpc.questions.delete.useMutation({
    onSuccess: () => {
      toast.success("Question deleted!");
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

  const handleCreateClass = () => {
    if (!newClassName.trim()) {
      toast.error("Please enter a class name");
      return;
    }
    createClass.mutate({ name: newClassName });
  };

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Join code copied!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0e6d2] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f0e6d2] flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-4 border-[#8b5a2b]">
          <CardHeader className="text-center">
            <GraduationCap className="h-16 w-16 mx-auto text-primary mb-4" />
            <CardTitle className="text-2xl font-['Chango']">Teacher Portal</CardTitle>
            <CardDescription>Sign in to manage your questions and classes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full h-12 text-lg">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/">← Back to Game</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0e6d2]">
      {/* Header */}
      <header className="bg-white border-b-4 border-[#8b5a2b] shadow-md">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Game
              </Button>
            </Link>
            <div className="h-8 w-px bg-border" />
            <div>
              <h1 className="text-2xl font-['Chango'] text-primary">Teacher Portal</h1>
              <p className="text-sm text-muted-foreground">Welcome, {user?.name || "Teacher"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/analytics">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChatbotOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Assistant
            </Button>
            <Badge variant="secondary" className="text-sm">
              <GraduationCap className="h-4 w-4 mr-1" />
              Teacher
            </Badge>
          </div>
        </div>
      </header>

      {/* Chatbot */}
      <TeacherChatbot isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {/* Main Content */}
      <main className="container py-8">
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full max-w-5xl grid-cols-9 h-12">
            <TabsTrigger value="questions" className="text-sm">
              <ClipboardList className="h-4 w-4 mr-2" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="classes" className="text-sm">
              <Users className="h-4 w-4 mr-2" />
              Classes
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm">
              <Trophy className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="certificates" className="text-sm">
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="text-sm">
              <Clock className="h-4 w-4 mr-2" />
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="goalMonitoring" className="text-sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Goal Monitor
            </TabsTrigger>
            <TabsTrigger value="goals" className="text-sm">
              <Target className="h-4 w-4 mr-2" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="stories" className="text-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Success Stories
            </TabsTrigger>
          </TabsList>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">My Custom Questions</h2>
                <p className="text-muted-foreground">Create questions that will appear in the game</p>
              </div>
              <Dialog open={isAddQuestionOpen} onOpenChange={setIsAddQuestionOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Create New Question
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={newQuestion.category}
                        onValueChange={(v) => setNewQuestion({ ...newQuestion, category: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                                {cat.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newQuestion.questionType}
                        onValueChange={(v: "question" | "activity") => 
                          setNewQuestion({ ...newQuestion, questionType: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="question">❓ Question</SelectItem>
                          <SelectItem value="activity">🏃 Physical Activity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Question / Activity *</Label>
                      <Textarea
                        placeholder="Enter your question or activity description..."
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Answer (optional)</Label>
                      <Textarea
                        placeholder="Enter the expected answer..."
                        value={newQuestion.answer}
                        onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddQuestionOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateQuestion} disabled={createQuestion.isPending}>
                      {createQuestion.isPending ? "Creating..." : "Create Question"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Questions List */}
            <div className="grid gap-4">
              <AnimatePresence>
                {myQuestions?.map((q, index) => {
                  const category = CATEGORIES.find((c) => c.value === q.category);
                  return (
                    <motion.div
                      key={q.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-2 hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-2 h-full min-h-[60px] rounded-full ${category?.color || 'bg-gray-300'}`} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="secondary">{category?.label}</Badge>
                                <Badge variant={q.questionType === "activity" ? "default" : "outline"}>
                                  {q.questionType === "activity" ? "🏃 Activity" : "❓ Question"}
                                </Badge>
                                {q.isActive ? (
                                  <Badge className="bg-green-100 text-green-700">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <p className="font-medium mb-1">{q.question}</p>
                              {q.answer && (
                                <p className="text-sm text-muted-foreground italic">
                                  Answer: {q.answer}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => updateQuestion.mutate({ 
                                  id: q.id, 
                                  isActive: !q.isActive 
                                })}
                              >
                                {q.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteQuestion.mutate({ id: q.id })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {(!myQuestions || myQuestions.length === 0) && (
                <Card className="border-2 border-dashed">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No custom questions yet</p>
                    <p className="text-sm text-muted-foreground">Create your first question to get started!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">My Classes</h2>
                <p className="text-muted-foreground">Create classes and share join codes with students</p>
              </div>
              <Dialog open={isAddClassOpen} onOpenChange={setIsAddClassOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Class
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Class</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Class Name</Label>
                      <Input
                        placeholder="e.g., Mrs. Johnson's 3rd Grade"
                        value={newClassName}
                        onChange={(e) => setNewClassName(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddClassOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateClass} disabled={createClass.isPending}>
                      {createClass.isPending ? "Creating..." : "Create Class"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Classes List */}
            <div className="grid gap-4 md:grid-cols-2">
              <AnimatePresence>
                {myClasses?.map((cls, index) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="border-2 hover:shadow-md transition-shadow">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-primary" />
                          {cls.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Join Code</p>
                            <p className="text-2xl font-mono font-bold tracking-widest">{cls.joinCode}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyJoinCode(cls.joinCode)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {(!myClasses || myClasses.length === 0) && (
                <Card className="border-2 border-dashed md:col-span-2">
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No classes yet</p>
                    <p className="text-sm text-muted-foreground">Create a class and share the join code with your students!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Class Leaderboard
                </CardTitle>
                <CardDescription>Top performing students across all your classes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Statistics will appear here as students play the game</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="h-6 w-6 text-yellow-500" />
                Generate Achievement Certificates
              </h2>
              <p className="text-muted-foreground">Create personalized certificates for your students</p>
            </div>

            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="single">Single Certificate</TabsTrigger>
                <TabsTrigger value="batch">Batch (Entire Class)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="single" className="mt-4">
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <Certificate />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="batch" className="mt-4">
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <BatchCertificates />
                  </CardContent>
                </Card>
              </TabsContent>
                    <TabsContent value="alerts" className="space-y-6">
          {myClasses && myClasses.length > 0 ? (
            <div className="space-y-6">
              {myClasses.map((classData) => (
                <div key={classData.id}>
                  <AlertEngagementDashboard classId={classData.id} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-2">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No classes found</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                Game Analytics
              </h2>
              <p className="text-muted-foreground">View detailed performance reports and insights</p>
            </div>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground mb-4">Open the full analytics dashboard to view comprehensive reports:</p>
                <Link href="/analytics">
                  <Button className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Open Analytics Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Emails Tab */}
          <TabsContent value="scheduled" className="space-y-6">
            <ScheduledEmails />
          </TabsContent>

          {/* Goal Monitoring Tab */}
          <TabsContent value="goalMonitoring" className="space-y-6">
            {myClasses && myClasses.length > 0 ? (
              <div className="space-y-6">
                {myClasses.map((classData) => (
                  <div key={classData.id}>
                    <TeacherGoalMonitoringDashboard
                      classId={classData.id}
                      className={classData.name}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <Card className="border-2">
                <CardContent className="p-8 text-center">
                  <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 mb-4">No classes yet. Create a class to monitor student goals.</p>
                  <Button onClick={() => setIsAddClassOpen(true)}>Create a Class</Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Student Performance Goals</h2>
                <p className="text-gray-600 mt-2">Set and track performance targets for your students</p>
              </div>
            </div>
            <GoalsManagement />
          </TabsContent>
                <TabsContent value="alerts" className="space-y-6">
          {myClasses && myClasses.length > 0 ? (
            <div className="space-y-6">
              {myClasses.map((classData) => (
                <div key={classData.id}>
                  <AlertEngagementDashboard classId={classData.id} />
                </div>
              ))}
            </div>
          ) : (
            <Card className="border-2">
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No classes found</p>
              </CardContent>
            </Card>
          )}
          </TabsContent>

          <TabsContent value="stories" className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Success Stories</h2>
                  <p className="text-gray-600 mt-2">Celebrate student achievements and inspire others</p>
                </div>
                {myClasses && myClasses.length > 0 && (
                  <ExportSuccessStoriesPDF classId={myClasses[0]?.id || 0} className={myClasses[0]?.name || "Class"} />
                )}
              </div>
              {myClasses && myClasses.length > 0 ? (
                <div className="space-y-6">
                  {myClasses.map((classData) => (
                    <div key={classData.id} className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-800">{classData.name}</h3>
                      <SuccessStoriesGallery classId={classData.id} />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="border-2">
                  <CardContent className="p-8 text-center">
                    <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No classes found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

      </Tabs>
      </main>
    </div>
  );
}
