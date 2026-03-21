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
- [x] All 78 tests passing

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
