# MathFuel - TODO

## Phase 1: Core Student Experience
- [x] New database schema: skills, subskills, problems, practice sessions, student progress, mastery tracking
- [x] Seed Grade 1-2 math content (addition, subtraction, number sense, place value, comparisons, word problems, counting)
- [x] Student dashboard (streaks, recommended session, recent performance, mastery progress)
- [x] Practice session engine with adaptive difficulty
- [x] Answer validation (deterministic, not AI-dependent)
- [x] Immediate feedback UI (correct/incorrect with explanation)
- [x] Scaffolded hint system (progressive hints, not just answers)
- [x] Mastery model (not started / practicing / close / mastered per skill)
- [x] Rewards: streaks, badges, session completion celebration
- [x] Child-friendly practice UI (bright, simple, calm, low reading burden, button-forward)

## Phase 2: Parent Experience
- [x] Parent dashboard (child progress, strengths, struggle areas, time spent, accuracy)
- [x] Session summary (what was practiced, where child got stuck, suggested next step)
- [x] Mastery reporting with visual skill map

## Phase 3: AI Enhancement
- [x] AI-generated explanations in age-appropriate language
- [x] AI-generated scaffolded hints
- [ ] Error pattern identification
- [ ] Adaptive sequencing recommendations

## Phase 4: Homepage & Branding
- [x] Redesign homepage as MathFuel landing page
- [x] Update branding from MathMastery to MathFuel
- [ ] Pricing page update for family subscription model

## Testing
- [x] Vitest tests for answer checking (number, boolean, text, choice)
- [x] Vitest tests for mastery level calculation
- [x] Vitest tests for adaptive difficulty engine
- [x] Vitest tests for streak logic
- [x] Vitest tests for badge award logic
- [x] All 112 tests passing

## Infrastructure (Existing - Keep)
- [x] Admin settings panel
- [x] Payment notification system with Stripe webhooks
- [x] RBAC with admin/user roles
- [x] Stripe integration
- [x] CDN asset infrastructure

## Phase 5: AI-Powered Dynamic Hints & Explanations
- [x] Server-side tRPC procedure for AI hint generation (invokeLLM)
- [x] Server-side tRPC procedure for AI explanation generation after wrong answer
- [x] Age-appropriate prompt engineering (Grade 1-2 language, scaffolded, conceptual)
- [x] Update PracticeSession UI to call AI hints instead of static hints
- [x] Update PracticeSession UI to show AI explanation after incorrect answer
- [x] Loading states and error handling for AI responses
- [x] Vitest tests for AI hint/explanation procedures

## Phase 6: AI Feedback Rating System
- [x] Database table for AI response feedback (thumbs up/down, response type, problem context)
- [x] tRPC procedure to submit feedback rating
- [x] tRPC procedure to query feedback stats (admin/parent view)
- [x] Thumbs up/down UI on AI hints in PracticeSession
- [x] Thumbs up/down UI on AI explanations in PracticeSession
- [x] Child-friendly feedback interaction (simple, non-disruptive)
- [x] Admin view of AI feedback quality metrics (getFeedbackStats procedure available)
- [x] Vitest tests for feedback procedures (15 tests passing)

## Phase 7: Rebrand to MathFuel
- [x] Rename all "Wisconsin Food Explorer" references to "MathFuel"
- [x] Rename all "wisconsin-food-explorer" references to "mathfuel"
- [x] Update package.json name
- [x] Update HTML title and meta tags
- [x] Update VITE_APP_TITLE (user needs to update in Settings > General)
- [x] Generate MathFuel logo (math + jet fuel concept)
- [x] Integrate logo into app header, favicon, and landing page
- [x] Verify all pages render correctly after rename

## Phase 8: Brand-Quality Mobile Polish
- [x] Home page: hero text sizing, nav hamburger, feature cards stacking, CTA spacing, footer layout
- [x] StudentDashboard: stat cards grid, badge overflow, session history cards, nav spacing
- [x] PracticeSession: question text sizing, answer input sizing, hint panel width, feedback cards, progress bar
- [x] SkillMap: domain cards stacking, skill list overflow, mastery badges sizing
- [x] ParentDashboard: child selector, progress charts, session table to cards on mobile
- [x] Global CSS: base font scaling, container padding, touch target minimums, safe-area insets
- [x] Test all pages at 375px and 390px widths

## Phase 9: Animated Incremental Hint System
- [x] Animated "Need a Hint?" button with pulse/glow effect when idle
- [x] Incremental hint reveal (one clue at a time, not all at once)
- [x] Smooth slide-in/fade-in animation for each new hint
- [x] Visual hint counter (e.g., "Hint 1 of 3")
- [x] Progressive hint styling (each hint visually distinct)
- [x] Gentle encouragement copy between hints
- [x] Disable hint button briefly after reveal to prevent spam-clicking
- [x] Mobile-optimized hint panel with proper touch targets

## Phase 10: Custom In-App Authentication (Replace Manus OAuth)
- [x] Add password field to users table (hashed with bcrypt)
- [x] Server-side register endpoint (email, password, name, role)
- [x] Server-side login endpoint (email + password → JWT cookie)
- [x] Server-side logout endpoint (clear JWT cookie)
- [x] Password hashing with bcrypt
- [x] JWT session creation and verification (no external OAuth)
- [x] Login page with MathFuel branding (email + password)
- [x] Signup page with role selection (Student / Parent / Teacher)
- [x] Update useAuth hook to work with custom auth
- [x] Remove all Manus OAuth redirects (getLoginUrl, OAuth portal)
- [x] Protected route guards using custom JWT
- [x] Update main.tsx to redirect to /login instead of OAuth
- [x] Test registration, login, logout, protected routes (19 tests)
