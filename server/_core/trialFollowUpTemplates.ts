export interface FollowUpEmailTemplate {
  subject: string;
  body: string;
  cta: string;
  ctaUrl: string;
}

export const followUpEmailTemplates: Record<string, FollowUpEmailTemplate> = {
  day_3_check_in: {
    subject: "Getting Started with Wisconsin Food Explorer - Quick Tips",
    body: `
Hi {school_name},

We hope you're enjoying Wisconsin Food Explorer! Here are some quick tips to get the most out of your trial:

**Getting Started:**
- Create your first game session with the Challenge Cards
- Try the Nutrition Roulette game for interactive learning
- Generate certificates to recognize student achievement

**Quick Win:**
Many schools see the best results by having students play one game per week. This keeps engagement high without overwhelming your schedule.

**Questions?**
Our support team is here to help. Reply to this email or visit our help center.

Best regards,
The Wisconsin Food Explorer Team
    `.trim(),
    cta: "View Getting Started Guide",
    ctaUrl: "/getting-started",
  },

  day_7_engagement: {
    subject: "Your Trial Progress - Engagement Tips",
    body: `
Hi {school_name},

We wanted to check in on your Wisconsin Food Explorer trial! Here's what we're seeing:

**Your Trial Stats:**
- Students engaged: {student_count}
- Games played: {games_played}
- Certificates generated: {certificates_generated}

**Boost Engagement:**
1. Use the Teacher Portal to create custom questions specific to your curriculum
2. Share certificates with students to celebrate their achievements
3. Try the Nutrition Roulette game for variety

**Pro Tip:**
Schools that use multiple game types see 2x higher engagement. Mix Challenge Cards with Nutrition Roulette for best results.

Ready to explore more features?
    `.trim(),
    cta: "Explore Advanced Features",
    ctaUrl: "/teacher",
  },

  day_14_features: {
    subject: "Unlock Advanced Features - Analytics & Custom Content",
    body: `
Hi {school_name},

You're halfway through your trial! Let's explore some powerful features you might not have discovered yet:

**Advanced Features:**
- **Custom Questions:** Create questions tailored to your curriculum
- **Analytics Dashboard:** Track student progress and learning outcomes
- **Email Templates:** Customize certificates and communications
- **Bulk Operations:** Generate certificates for entire classes at once

**Success Story:**
{success_school} used custom questions to align with their state standards and saw a 40% increase in student engagement.

**Special Offer:**
Districts that convert during their trial get 3 months free + dedicated support.

Let's schedule a demo to see how these features can transform your nutrition education.
    `.trim(),
    cta: "Schedule a Demo",
    ctaUrl: "/schedule-access",
  },

  day_28_conversion: {
    subject: "Your Trial Ends Soon - Special Conversion Offer",
    body: `
Hi {school_name},

Your Wisconsin Food Explorer trial ends in 2 days! We've loved having you as part of our pilot program.

**Your Trial Impact:**
- {student_count} students engaged
- {games_played} games played
- {certificates_generated} certificates generated

**What's Next?**
We're offering a special conversion package for trial schools:
- **School License:** Custom pricing based on your student count
- **District License:** Unlimited access for your entire district
- **Bonus:** 3 months free + free onboarding + dedicated support

**Limited Time:**
This offer is only valid for schools completing their trial. Convert by {conversion_deadline} to lock in your rate.

Our sales team will reach out shortly, or you can schedule a call directly.

Thank you for piloting Wisconsin Food Explorer!
    `.trim(),
    cta: "Schedule Conversion Call",
    ctaUrl: "/schedule-access",
  },

  expired_offer: {
    subject: "Your Trial Has Ended - Exclusive Offer Inside",
    body: `
Hi {school_name},

Your Wisconsin Food Explorer trial has ended, but your journey doesn't have to!

**Your Trial Summary:**
- {student_count} students engaged
- {games_played} games played
- {certificates_generated} certificates generated

**We Want You to Stay:**
Based on your trial usage, we're extending a special offer:
- **Exclusive Pricing:** {discount}% off annual plans
- **Extended Trial:** 2 additional weeks of free access
- **Premium Support:** Dedicated onboarding and training

**One-Time Offer:**
This exclusive pricing is only available if you respond within 7 days.

Let's continue your nutrition education journey together. Schedule a call with our team today.

Best regards,
The Wisconsin Food Explorer Team
    `.trim(),
    cta: "Claim Your Offer",
    ctaUrl: "/schedule-access",
  },
};

export function renderTemplate(template: FollowUpEmailTemplate, variables: Record<string, string>): FollowUpEmailTemplate {
  let body = template.body;
  let subject = template.subject;

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{${key}}`;
    body = body.replace(new RegExp(placeholder, "g"), value);
    subject = subject.replace(new RegExp(placeholder, "g"), value);
  });

  return {
    subject,
    body,
    cta: template.cta,
    ctaUrl: template.ctaUrl,
  };
}
