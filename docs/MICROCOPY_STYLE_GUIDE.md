# MathFuel Microcopy Style Guide

A short reference for anyone writing UI text in MathFuel. If you're adding a
button, error, empty state, or toast, read this first.

## Voice

We sound like **a confident, patient coach**. Warm but not cutesy. We speak to
three audiences with one voice, tuned for each:

- **Students (Grade 1–5):** short sentences, concrete words, second person.
  Never baby talk. Never sarcasm.
- **Parents:** calm, specific, outcome-focused. Respect their time.
- **Teachers/Admins:** direct and professional. Assume literacy with the product.

If a sentence would feel weird coming from a thoughtful tutor, rewrite it.

## Principles

1. **Say what happened and what to do next.** Every error and empty state
   should answer both questions.
2. **Name the thing, not the mechanism.** Prefer "Save New Password" over
   "Submit". Prefer "Start Practicing" over "Begin".
3. **Put the user in the sentence.** "You're in!" beats "Account created."
   "We couldn't reach Stripe" beats "Network error."
4. **Cut filler.** Remove "please", "simply", "just", "unfortunately", and most
   exclamation points.
5. **No emojis in production UI.** Use icons for affordance, words for meaning.
6. **Concrete over abstract.** "About 4 minutes" beats "a short session."
   "6 or more characters" beats "a strong password."
7. **One idea per line.** If a toast needs a comma splice, split it.

## Capitalization

- **Buttons and primary actions:** Title Case — "Create My Account",
  "Check My Answer", "Save New Password".
- **Headings:** Sentence case — "Your account", "Common questions",
  "Where you get stuck".
- **Body and helper text:** Sentence case, punctuated with periods.
- **Toasts:** Sentence case. End with a period.

## Punctuation

- Periods end full sentences, even in toasts and helper text.
- Use em dashes (—) sparingly for emphasis, not as a general comma substitute.
- No trailing exclamation points on errors, ever. One "!" per positive
  confirmation is the max.
- Avoid "..." except for in-progress states ("Saving your new password...").

## Button labels

Name the outcome, not the verb.

| Don't                | Do                          |
| -------------------- | --------------------------- |
| Submit               | Check My Answer             |
| Submit               | Save New Password           |
| Begin                | Start Practicing            |
| Continue             | See How I Did               |
| Log In               | Log In to My Account        |
| Send                 | Email Me a Reset Link       |
| View Referral Program | Open My Referral Page      |

Loading state uses the active verb: "Checking your answer...",
"Saving your new password...", "Setting up your practice...".

## Error messages

Formula: **what went wrong → what the user can do → no blame.**

| Don't                                 | Do                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Login failed. Please try again.       | That email and password don't match. Try again or reset your password.      |
| Registration failed. Please try again. | We couldn't create your account. This email may already be in use — try logging in instead. |
| Please fill in all fields.            | Fill in every field to finish creating your account.                        |
| Password must be at least 6 characters. | Passwords need 6 or more characters. Add a few more.                      |
| Passwords don't match.                | These two passwords are different. Check for typos.                         |
| Failed to get hint                    | MathBuddy is having trouble writing a hint. Try again in a moment.          |
| Failed to open billing portal.        | We couldn't reach the billing portal right now. Try again in a moment.      |

Never say "invalid", "illegal", or "forbidden" to end users.

## Empty states

Formula: **why it's empty → one concrete next action.**

| Don't                          | Do                                                                      |
| ------------------------------ | ----------------------------------------------------------------------- |
| No sessions yet.               | No sessions yet. A first one takes about 4 minutes — try it now.        |
| Complete sessions to earn badges! | Finish your first session to unlock your first badge.                |
| Learning Insights              | Where you get stuck                                                     |
| No Linked Students             | You're not linked to a child yet                                        |
| No sessions yet.               | Recent sessions will show up here once your child starts practicing.    |

## Student-facing feedback

- **Correct:** "Correct!" — one word is plenty.
- **Incorrect:** "Close! Let's look at this one." Never "Wrong." Never "Nope."
- **End-of-session (high accuracy):** name the achievement concretely.
  "Nine or more out of ten — that's mastery-level focus."
- **End-of-session (low accuracy):** normalize struggle, point forward.
  "Tough session — that's how brains grow. Try 5 more and it'll feel easier."

Never imply the student is bad at math. Imply the problem was tricky, or that
a pattern needs more reps.

## Parent-facing copy

- Lead with what they want to know (trend, specific skill, next action).
- Avoid pedagogy jargon — say "where they get stuck" not "error patterns".
- Time estimates always concrete: "about 4 minutes", "15 minutes a day".

## Form helper text

Tell the user the rule *before* they break it.

- Password field (empty): "Use 6 or more characters. Mix in a number to make
  it stronger."
- Password field (too short): "{n} more characters to go."
- Name field (student): placeholder "Your first name".
- Name field (adult): placeholder "Your full name".
- Email field: placeholder "you@example.com".

## Words to avoid

| Avoid             | Reason                                       | Use instead                         |
| ----------------- | -------------------------------------------- | ----------------------------------- |
| Please            | Filler, doesn't earn its keep                | — (just say it)                     |
| Simply, just      | Patronizing when things are hard             | — (delete)                          |
| Oops, Oh no       | Saccharine, undermines trust                 | State the issue plainly             |
| Awesome, Amazing  | Overused; no signal                          | Specific praise tied to performance |
| Failed to X       | Blames the system, not actionable            | "We couldn't X. Try Y."             |
| Invalid           | Accusatory                                   | "doesn't match", "isn't recognized" |
| Utilize           | Pretentious                                  | "use"                               |
| Leverage          | Corporate                                    | "use"                               |
| In order to       | Wordy                                        | "to"                                |

## Checklist before shipping

- [ ] Does every error tell the user what to do next?
- [ ] Does every button describe an outcome, not a mechanism?
- [ ] Would this sentence make sense to an 8-year-old (if student-facing)?
- [ ] Is there a period at the end?
- [ ] Have I removed every "please", "just", and "simply"?
- [ ] Is there any emoji? (Remove it.)
- [ ] Would a thoughtful tutor say this sentence out loud?
