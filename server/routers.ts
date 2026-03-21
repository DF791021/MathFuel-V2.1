import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { adminSettingsRouter } from "./routers/adminSettings";
import { mathContentRouter } from "./routers/mathContent";
import { practiceRouter } from "./routers/practice";
import { studentRouter } from "./routers/student";
import { parentRouter } from "./routers/parent";
import { aiTutorRouter } from "./routers/aiTutor";
import { customAuthRouter } from "./routers/customAuth";
import { paymentRouter } from "./routers/payment";

export const appRouter = router({
  system: systemRouter,
  adminSettings: adminSettingsRouter,
  mathContent: mathContentRouter,
  practice: practiceRouter,
  student: studentRouter,
  parent: parentRouter,
  aiTutor: aiTutorRouter,
  auth: customAuthRouter,
  payment: paymentRouter,
});

export type AppRouter = typeof appRouter;
