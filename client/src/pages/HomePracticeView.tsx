import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen, Clock, Target, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function HomePracticeView() {
  const [, params] = useRoute("/parent/practice/:studentId");
  const studentId = params?.studentId ? parseInt(params.studentId) : null;
  const [, setLocation] = useRoute();

  const { data: assignments, isLoading } = trpc.parentPortal.getHomePracticeAssignments.useQuery(
    { studentId: studentId || 0 },
    { enabled: !!studentId }
  );

  const updateProgressMutation = trpc.parentPortal.updateAssignmentProgress.useMutation({
    onSuccess: () => {
      toast.success("Progress updated successfully!");
    },
  });

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Button variant="outline" onClick={() => setLocation("/parent")} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-900">Invalid Student</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groupedByDueDate = assignments?.reduce((acc: any, assignment: any) => {
    const date = new Date(assignment.dueDate).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(assignment);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Button variant="outline" onClick={() => setLocation("/parent")} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Home Practice Assignments</h1>
          <p className="text-gray-600">Help your student practice math at home with teacher-assigned activities</p>
        </div>

        {/* Assignments by Due Date */}
        {groupedByDueDate && Object.keys(groupedByDueDate).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedByDueDate).map(([date, dateAssignments]: [string, any]) => (
              <div key={date}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Due: {date}</h2>
                <div className="space-y-4">
                  {dateAssignments.map((assignment: any) => (
                    <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{assignment.title}</CardTitle>
                              <Badge
                                variant={
                                  assignment.status === "completed"
                                    ? "default"
                                    : assignment.status === "in_progress"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {assignment.status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                            <CardDescription>{assignment.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Assignment Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <Target className="w-4 h-4 text-blue-600" />
                              <span className="text-gray-600">{assignment.totalProblems} problems</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <span className="text-gray-600">{assignment.estimatedMinutes} min</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <BookOpen className="w-4 h-4 text-green-600" />
                              <span className="text-gray-600">{assignment.topic}</span>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {assignment.status !== "not_started" && (
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Progress</span>
                                <span className="text-sm text-gray-600">
                                  {assignment.completionPercentage || 0}%
                                </span>
                              </div>
                              <Progress value={assignment.completionPercentage || 0} className="h-2" />
                            </div>
                          )}

                          {/* Performance Stats */}
                          {assignment.status === "completed" && (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-green-900">Great job!</p>
                                  <p className="text-sm text-green-800 mt-1">
                                    {assignment.problemsCorrect}/{assignment.problemsAttempted} correct
                                    ({Math.round((assignment.problemsCorrect / assignment.problemsAttempted) * 100)}% accuracy)
                                  </p>
                                  <p className="text-sm text-green-700 mt-1">
                                    Completed in {assignment.timeSpentMinutes} minutes
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-4">
                            {assignment.status === "not_started" && (
                              <Button className="flex-1" onClick={() => toast.info("Assignment link would open here")}>
                                Start Practice
                              </Button>
                            )}
                            {assignment.status === "in_progress" && (
                              <Button className="flex-1" onClick={() => toast.info("Resume assignment")}>
                                Continue Practice
                              </Button>
                            )}
                            {assignment.status === "completed" && (
                              <Button variant="outline" className="flex-1" onClick={() => toast.info("Review assignment")}>
                                Review Results
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <CardTitle className="text-blue-900">No Assignments Yet</CardTitle>
                  <CardDescription className="text-blue-800 mt-2">
                    Your student doesn't have any home practice assignments yet. Check back soon!
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
