import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { adminSettingsRouter } from "./routers/adminSettings";
import { mathContentRouter } from "./routers/mathContent";
import { practiceRouter } from "./routers/practice";
import { studentRouter } from "./routers/student";
import { parentRouter } from "./routers/parent";
import { teacherRouter } from "./routers/teacher";
import { aiTutorRouter } from "./routers/aiTutor";
import { customAuthRouter } from "./routers/customAuth";
import { paymentRouter } from "./routers/payment";
import { referralRouter } from "./routers/referral";
import { leaderboardRouter } from "./routers/leaderboard";

export const appRouter = router({
  system: systemRouter,
  adminSettings: adminSettingsRouter,
  mathContent: mathContentRouter,
  practice: practiceRouter,
  student: studentRouter,
  parent: parentRouter,
  teacher: teacherRouter,
  aiTutor: aiTutorRouter,
  auth: customAuthRouter,
  payment: paymentRouter,
  referral: referralRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
