import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Award,
  Flame,
} from "lucide-react";
import GoalCreationForm from "./GoalCreationForm";
import GoalProgressTracker from "./GoalProgressTracker";
import GoalAchievementNotifications from "./GoalAchievementNotifications";

export default function GoalsManagement() {
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Fetch classes
  const { data: classes, isLoading: classesLoading } = trpc.classes.getMyClasses.useQuery();

  // Initialize selected class
  if (classes && classes.length > 0 && selectedClassId === null) {
    setSelectedClassId(classes[0].id);
  }

  // Fetch class members
  const { data: classMembers } = trpc.classes.getMembers.useQuery(
    { classId: selectedClassId! },
    { enabled: selectedClassId !== null }
  );

  // Fetch goal statistics
  const { data: stats } = trpc.goals.getStatistics.useQuery();

  // Fetch upcoming goals
  const { data: goalsDueSoon } = trpc.goals.getGoalsDueSoon.useQuery();

  // Fetch overdue goals
  const { data: overdueGoals } = trpc.goals.getOverdueGoals.useQuery();

  if (classesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className="text-gray-600 mb-4">No classes found</p>
            <p className="text-sm text-gray-500">
              Create a class first to set goals for students
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Total Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.totalGoals || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats?.activeGoals || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.completedGoals || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {stats?.completionRate || 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Due Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {goalsDueSoon?.length || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Next 7 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {overdueGoals?.length || 0}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              Needs attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="achievements" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="achievements">
            <Award className="w-4 h-4 mr-2" />
            Achievements
          </TabsTrigger>
          <TabsTrigger value="manage">
            <Target className="w-4 h-4 mr-2" />
            Manage Goals
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertCircle className="w-4 h-4 mr-2" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Achievements Tab */}
        <TabsContent value="achievements" className="space-y-4">
          <GoalAchievementNotifications limit={15} />
        </TabsContent>

        {/* Manage Goals Tab */}
        <TabsContent value="manage" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Select Student</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Class
                    </label>
                    <select
                      value={selectedClassId || ""}
                      onChange={(e) => {
                        setSelectedClassId(parseInt(e.target.value));
                        setSelectedStudentId(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {!classMembers || classMembers.length === 0 ? (
                      <p className="text-sm text-gray-600 text-center py-4">
                        No students in this class
                      </p>
                    ) : (
                      classMembers.map((student: any) => (
                        <button
                          key={student.id}
                          onClick={() => {
                            setSelectedStudentId(student.id);
                            setSelectedStudentName(student.name);
                          }}
                          className={`w-full text-left p-3 rounded-lg border-2 transition ${
                            selectedStudentId === student.id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="font-medium text-gray-900">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            {student.email || "No email"}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Goal Management */}
            <div className="lg:col-span-2 space-y-4">
              {selectedStudentId ? (
                <>
                  {/* Create New Goal */}
                  <GoalCreationForm
                    playerId={selectedStudentId}
                    playerName={selectedStudentName}
                    classId={selectedClassId || 0}
                    onSuccess={() => {
                      // Refresh goals
                    }}
                  />

                  {/* Goal Progress Tracker */}
                  <GoalProgressTracker
                    playerId={selectedStudentId}
                    playerName={selectedStudentName}
                  />
                </>
              ) : (
                <Card className="border-dashed border-2">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600">
                        Select a student to manage their goals
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goals Due Soon */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  Goals Due Soon (Next 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goalsDueSoon && goalsDueSoon.length > 0 ? (
                  <div className="space-y-3">
                    {goalsDueSoon.map((goal: any) => (
                      <div
                        key={goal.id}
                        className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {goal.goalName}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {goal.playerName}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              Due:{" "}
                              {new Date(goal.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-yellow-600">
                            {goal.progressPercentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No goals due soon
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Overdue Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  Overdue Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overdueGoals && overdueGoals.length > 0 ? (
                  <div className="space-y-3">
                    {overdueGoals.map((goal: any) => (
                      <div
                        key={goal.id}
                        className="p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">
                              {goal.goalName}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {goal.playerName}
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                              Was due:{" "}
                              {new Date(goal.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className="bg-red-600">
                            {goal.progressPercentage}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 text-center py-4">
                    No overdue goals
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
