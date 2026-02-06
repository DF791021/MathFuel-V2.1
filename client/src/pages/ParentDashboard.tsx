import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, BookOpen, Award, MessageSquare, TrendingUp, Plus } from "lucide-react";
import { useRoute } from "wouter";
import { useState } from "react";

export default function ParentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [, setLocation] = useRoute();

  // Fetch parent account and students
  const { data: parentAccount, isLoading: accountLoading } = trpc.parentPortal.getOrCreateParentAccount.useQuery();
  const { data: students, isLoading: studentsLoading } = trpc.parentPortal.getStudents.useQuery();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Parent Portal</CardTitle>
            <CardDescription>Please log in to access your student's progress</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" onClick={() => setLocation("/")}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (accountLoading || studentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-48 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-gray-600">Track your student's math journey and celebrate achievements</p>
        </div>

        {/* Students Overview */}
        {students && students.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {students.map((student: any) => (
              <Card
                key={student.studentId}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedStudent(student.studentId)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Student #{student.studentId}</CardTitle>
                      <CardDescription>{student.relationship}</CardDescription>
                    </div>
                    <Badge variant={student.accessLevel === "full_access" ? "default" : "secondary"}>
                      {student.accessLevel.replace(/_/g, " ")}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation(`/parent/practice/${student.studentId}`)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Home Practice
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation(`/parent/progress/${student.studentId}`)}
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Progress Tracking
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setLocation(`/parent/messages/${student.studentId}`)}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Messages
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
                <div>
                  <CardTitle className="text-amber-900">No Students Linked Yet</CardTitle>
                  <CardDescription className="text-amber-800 mt-2">
                    Ask your student's teacher for a link code to connect their account to your parent portal.
                    You'll then be able to track their progress, view assignments, and communicate with their teacher.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Link Student Account
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        {students && students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Active Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">3</div>
                <p className="text-xs text-gray-500 mt-1">Due this week</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Achievements Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-3xl font-bold text-orange-500">12</div>
                  <Award className="w-6 h-6 text-orange-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Avg. Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">87%</div>
                <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
