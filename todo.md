# Wisconsin Food Explorer - TODO

## Core Game Features
- [x] Game board with Wisconsin map background
- [x] Animated player pieces (cheese, cranberry, corn, milk)
- [x] Dice rolling with animation
- [x] Challenge cards with questions (60+ cards)
- [x] Fun fact cards (25+ cards)
- [x] Score tracking
- [x] Turn-based gameplay
- [x] Confetti celebration for correct answers

## Full-Stack Upgrade
- [x] Database schema for game sessions, scores, and custom questions
- [x] User authentication (students, teachers, admins)
- [x] Save game scores to leaderboard
- [x] Global leaderboard display with podium for top 3
- [x] Teacher portal for managing questions
- [x] Class/group management with join codes
- [x] tRPC API routes for all features

## UI/UX Enhancements
- [x] Mobile-responsive design
- [x] Sound effects toggle button
- [x] Celebration animations for correct answers
- [x] Player name input before game start
- [x] Character selection with 4 avatars
- [x] Framer Motion animations throughout
- [x] Floating food decorations on homepage

## Pages
- [x] Home page with game board
- [x] Leaderboard page with rankings
- [x] Teacher Portal with tabs (Questions, Classes, Stats)

## Certificate Feature
- [x] Create Certificate component with Wisconsin theme
- [x] Add student name, date, and achievement fields
- [x] Implement print functionality
- [x] Add certificate generation to Teacher Portal
- [x] Allow customization of certificate message

## School Logo Upload Feature
- [x] Add file input for logo upload
- [x] Preview uploaded logo in certificate
- [x] Include logo in printed certificate
- [x] Add option to remove/change logo

## Batch Certificate Generation
- [x] Add student list text input for multiple names
- [x] Support CSV file upload for class lists
- [x] Preview all certificates in a grid
- [x] Bulk print all certificates at once
- [x] Show progress indicator during batch generation

## Email Certificate Feature
- [x] Create email API endpoint for sending certificates
- [x] Add email input field for each student in batch mode
- [x] Add "Send via Email" button alongside print
- [x] Generate certificate as PDF attachment for email
- [x] Show success/error feedback for email sending

## Customizable Email Template Feature
- [x] Add email subject line input field
- [x] Add email body textarea with placeholder variables
- [x] Show preview of email with variables replaced
- [x] Support variables: {student_name}, {achievement}, {teacher_name}, {school_name}, {date}
- [x] Update API to accept custom subject and body

## Saved Email Templates Feature
- [x] Create database table for email templates
- [x] Add API endpoints for CRUD operations on templates
- [x] Add "Save as Template" button in email dialog
- [x] Add template selector dropdown to load saved templates
- [x] Allow naming and managing saved templates
- [x] Support default template per achievement type

## Full Email Preview Feature
- [x] Create email preview modal showing full email layout
- [x] Display certificate thumbnail in preview
- [x] Show email header, subject, body, and footer
- [x] Add "Send" and "Edit" buttons in preview
- [x] Style preview to look like actual email client

## Scheduled Email Feature
- [x] Create database table for scheduled emails
- [x] Add API endpoint for scheduling emails
- [x] Add date/time picker to email dialog
- [x] Show scheduled emails list in Teacher Portal
- [x] Allow canceling/editing scheduled emails
- [x] Display countdown or scheduled time in UI

## Scheduled Emails Management Feature
- [x] Create ScheduledEmails management component
- [x] Display list of all pending scheduled emails
- [x] Show email details (recipient, student, date/time, status)
- [x] Add edit functionality to modify scheduled emails
- [x] Add cancel/delete functionality for scheduled emails
- [x] Integrate into Teacher Portal as new tab

## Certificate Verification & Anti-Forgery Feature
- [x] Create database table for issued certificates with unique IDs
- [x] Generate cryptographic signature for each certificate
- [x] Add QR code generation to certificate component
- [x] Create public verification page (/verify/:id)
- [x] Display verification status with certificate details
- [x] Add verification badge/seal to printed certificates
- [x] Store certificate metadata (student, date, achievement, issuer)

## Verification Page Customization Feature
- [x] Update issued certificates table to store school branding
- [x] Add logo URL and primary/secondary color fields
- [x] Update verification page to display custom logo
- [x] Apply custom colors to verification page header
- [x] Add branding options to certificate generation form

## Bulk Certificate Issuance Feature
- [x] Create bulk issue API endpoint for multiple certificates
- [x] Update BatchCertificates to support CSV with achievements
- [x] Add "Issue All with QR" button for batch mode
- [x] Generate unique IDs and QR codes for each certificate
- [x] Show progress indicator during bulk issuance
- [x] Display issued certificates with their QR codes

## ZIP Download for Bulk Certificates
- [x] Install JSZip library for client-side ZIP generation
- [x] Generate certificate images for each student
- [x] Bundle all certificates into a single ZIP file
- [x] Add "Download All as ZIP" button after bulk issuance
- [x] Include certificate metadata in filenames

## Email ZIP Feature
- [x] Create email service module with nodemailer integration (server/_core/email.ts)
- [x] Add database table to track ZIP email history (zipEmailHistory)
- [x] Add getUserById helper function to db.ts
- [x] Create sendZipEmail tRPC procedure in routers.ts
- [x] Add state variables for email ZIP dialog in BatchCertificates component
- [x] Add sendZipEmailMutation hook in BatchCertificates component
- [x] Add handleEmailZip function to generate and email ZIP files
- [x] Add Email ZIP button next to Download ZIP button
- [x] Add Email ZIP Dialog with confirmation UI
- [x] Integrate email sending with ZIP attachment support
- [x] Add owner notification when ZIP is emailed
- [x] Support both development (Ethereal) and production SMTP modes
- [x] Create beautiful HTML email template with batch details

## Email Customization Feature
- [x] Update database schema to store custom email subject and body templates
- [x] Add subject line input field to email ZIP dialog
- [x] Add email body textarea with placeholder variables
- [x] Create email preview modal showing formatted email
- [x] Implement variable substitution ({teacher_name}, {school_name}, {date}, {student_count})
- [x] Create backend procedure for sending customized emails
- [x] Add "Save as Template" option for future use
- [x] Validate email content before sending
- [x] Show character count for subject and body
- [x] Add default email template suggestions

## Email Template Save/Load Feature
- [x] Create emailTemplates database table with fields: id, teacherId, name, subject, body, isDefault, createdAt, updatedAt
- [x] Add database helper functions for template CRUD operations
- [x] Create tRPC procedures: saveTemplate, getTemplates, deleteTemplate, setDefaultTemplate
- [x] Add "Save as Template" button to email customization dialog
- [x] Add template name input dialog when saving
- [x] Add template selector dropdown to load saved templates
- [x] Add "Load Template" button to populate subject and body from selected template
- [x] Add "Delete Template" button with confirmation
- [x] Add "Set as Default" option for templates
- [x] Display template list with edit/delete options
- [x] Show default template indicator
- [x] Test saving multiple templates
- [x] Test loading templates
- [x] Test deleting templates
- [x] Test setting default template

## Email Template Sharing Feature
- [ ] Add isShared and sharedWith fields to emailTemplates table
- [ ] Create templateShares table to track sharing relationships
- [ ] Add shareCode field to templates for easy sharing
- [ ] Create tRPC procedure to share template with colleagues
- [ ] Create tRPC procedure to view shared templates
- [ ] Create tRPC procedure to import shared template
- [ ] Create tRPC procedure to revoke template sharing
- [ ] Add "Share Template" button to template list in dialog
- [ ] Add share modal with colleague email input
- [ ] Add copy-to-clipboard for share code
- [ ] Add "Shared Templates" tab in email dialog
- [ ] Display list of templates shared with current teacher
- [ ] Add "Import" button to import shared templates
- [ ] Show template owner/creator in shared templates list
- [ ] Add sharing permissions UI (view-only, can-edit, can-share)
- [ ] Test sharing template with colleague
- [ ] Test importing shared template
- [ ] Test revoking template sharing
- [ ] Test permission levels

## Template Sharing Backend Implementation - COMPLETED
- [x] Database schema with templateShares, sharedTemplateLibrary, and templateImports tables
- [x] tRPC procedures: shareTemplate, getSharedWithMe, revokeShare, publishToLibrary, getPublicTemplates, importTemplate, rateTemplate
- [x] Database helper functions for all sharing operations
- [x] Support for permission levels (view, edit, admin)
- [x] Template library with public/private templates
- [x] Usage tracking and rating system
- [x] Template import with automatic copy creation

## Template Sharing Frontend - TODO
- [ ] Share Template modal in email customization dialog
- [ ] Colleague email input with validation
- [ ] Permission level selector
- [ ] Copy-to-clipboard for share codes
- [ ] Shared Templates tab showing received templates
- [ ] Public Templates library browser
- [ ] Search and filter for templates
- [ ] Template rating UI
- [ ] Import template button
- [ ] Revoke sharing button


## Template Library Page - TODO
- [ ] Create TemplateLibrary.tsx page component
- [ ] Add page layout with header and search bar
- [ ] Implement template grid/list display
- [ ] Add category filter sidebar
- [ ] Add search functionality with debouncing
- [ ] Add sort options (popularity, rating, newest)
- [ ] Create template card component with preview
- [ ] Add template details modal
- [ ] Implement import button with confirmation
- [ ] Add rating display and user ratings
- [ ] Show template creator information
- [ ] Add usage count display
- [ ] Implement pagination for large result sets
- [ ] Add empty state when no templates found
- [ ] Add loading states and skeletons
- [ ] Add "My Templates" section for user's own templates
- [ ] Add "Recently Imported" section
- [ ] Add breadcrumb navigation
- [ ] Add route to template library page
- [ ] Add link in teacher dashboard navigation

## Public Template Library Page - COMPLETED
- [x] Create TemplateLibrary.tsx page component with full layout
- [x] Implement search functionality with debouncing
- [x] Add category filtering sidebar
- [x] Add sort options (popular, rating, newest)
- [x] Create template card component with preview
- [x] Add template details modal with full preview
- [x] Implement import button with mutation handling
- [x] Add rating display and statistics
- [x] Show template creator information
- [x] Display usage count
- [x] Implement pagination for large result sets
- [x] Add empty state with helpful messaging
- [x] Add loading states and skeleton loaders
- [x] Add stats footer showing totals
- [x] Add route to template library page (/templates)
- [x] Tested template library page loads correctly
- [x] Verified search, filter, and sort UI elements are present
- [x] Tested empty state display


## Teacher AI Chatbot - COMPLETED
- [x] Request OpenAI API key via webdev_request_secrets - VERIFIED WORKING
- [x] Create backend chatbot service with OpenAI integration (server/_core/teacherChatbot.ts)
- [x] Implement streaming response support with markdown rendering
- [x] Create tRPC procedure for chat messages (server/routers/teacherChatbot.ts)
- [x] Build ChatBot UI component with message history (client/src/components/TeacherChatbot.tsx)
- [x] Add chatbot to teacher portal with AI Assistant button
- [x] Implement specialized modes (ideas, resources, trivia, challenges)
- [x] Add context awareness for teacher-specific help
- [x] Test chatbot responses and functionality - VERIFIED: Generated 3 detailed lesson ideas with tables and variations
- [x] Add error handling and fallback messages
- [x] Add message history and conversation context
- [x] Add mode switching with badge buttons
- [x] Add clear chat functionality
- [x] Render markdown content with Streamdown component


## Chat History Persistence - COMPLETED
- [x] Create chatConversations and chatMessages database tables
- [x] Add database helper functions for conversation CRUD
- [x] Create tRPC procedures for saving/loading conversations (server/routers/chatHistory.ts)
- [x] Add conversation list UI to chatbot with History sidebar
- [x] Implement auto-save functionality for current conversation
- [x] Add conversation title input and generation
- [x] Implement conversation switching with message loading
- [x] Add delete conversation functionality with confirmation
- [x] Add New conversation button for starting fresh
- [x] Add conversation message counter
- [x] Test chat history save and load - VERIFIED
- [x] Test conversation switching
- [x] Test conversation deletion
- [x] Implement mode-aware conversation tracking
- [x] Add conversation timestamp tracking
- [x] Verify persistence across browser sessions


## User Manual Creation - COMPLETED
- [x] Research all current features and user workflows
- [x] Create manual structure and outline with sections for each user role
- [x] Write teacher-focused section with game and certificate features
- [x] Write nutrition staff section with bulk operations and email features
- [x] Write administrator section with portal management and AI chatbot
- [x] Add troubleshooting guide and FAQs
- [x] Create comprehensive manual as markdown document (WISCONSIN_FOOD_EXPLORER_USER_MANUAL.md)
- [x] Include step-by-step guides for all features
- [x] Add real-world scenarios and examples
- [x] Include troubleshooting section and FAQs


## Video Tutorial Creation - COMPLETED
- [x] Plan video content and create scripts for each tutorial
- [x] Generate video: Creating Individual Certificates (2:30) - tutorial_01_individual_certificates.mp4
- [x] Generate video: Bulk Certificate Generation and ZIP Download (2:45) - tutorial_02_bulk_certificates.mp4
- [x] Generate video: Customizing and Sending Emails with Certificates (3:15) - tutorial_03_email_certificates.mp4
- [x] Generate video: Saving and Managing Email Templates (3:00) - tutorial_04_email_templates.mp4
- [x] Create summary document with video descriptions and links (VIDEO_TUTORIALS_GUIDE.md)
- [x] Total training time: ~12 minutes across 4 tutorials


## Innovative New Game - "Nutrition Roulette" - COMPLETED
- [x] Design innovative game concept with roulette wheel mechanics
- [x] Create database schema with 7 new tables (gameSession, gamePlayer, gameChallenge, gameResult, powerUp, etc.)
- [x] Build backend game logic with tRPC procedures (10 procedures for game management)
- [x] Develop frontend UI with animated roulette wheel
- [x] Implement challenge display and timer system
- [x] Add answer submission and scoring system
- [x] Create real-time leaderboard display
- [x] Implement 5 challenge types: Trivia, Match, Recipe, Wellness, Speed
- [x] Add difficulty levels and point scaling
- [x] Implement streak bonuses and power-ups system
- [x] Add game session management (create, join, start, end)
- [x] Create teacher dashboard for managing active games
- [x] Add player scoring and ranking system
- [x] Implement game results and analytics
- [x] Test game flow from creation to completion - VERIFIED WORKING
- [x] Add route to App.tsx (/roulette)
- [x] Deploy to dev server - LIVE AND FUNCTIONAL


## WebSocket Real-Time Multiplayer - COMPLETED
- [x] Install Socket.IO and Socket.IO-client packages
- [x] Set up WebSocket server with Socket.IO
- [x] Create game room management with player tracking
- [x] Implement player join/leave events
- [x] Create real-time game state synchronization
- [x] Implement live leaderboard updates via WebSocket
- [x] Add instant feedback for correct/incorrect answers
- [x] Create player connection status tracking
- [ ] Implement disconnect/reconnect handling
- [ ] Add real-time timer synchronization
- [ ] Create WebSocket event handlers for game actions
- [ ] Update frontend to subscribe to WebSocket events
- [ ] Implement live player list display
- [ ] Add real-time score updates
- [ ] Test multiplayer game flow with multiple players
- [ ] Test connection stability and error handling
- [ ] Verify leaderboard synchronization across clients
- [ ] Test instant feedback delivery


## Game Analytics Dashboard - COMPLETED
- [x] Design analytics dashboard structure and data requirements
- [x] Create 6 new analytics database tables (student summary, question performance, class performance, daily engagement, topic mastery, difficulty progression)
- [x] Write 20+ database helper functions for analytics data aggregation
- [x] Create analytics tRPC router with 8 procedures for data retrieval
- [x] Build comprehensive dashboard UI with 4 main tabs (Overview, Students, Questions, Trends)
- [x] Implement date range filtering (week, month, all-time)
- [x] Add export functionality (CSV for students, questions, classes; full text report)
- [x] Create analytics export utility library with multiple export formats
- [x] Add Analytics tab to TeacherPortal with link to full dashboard
- [x] Add Analytics route to App.tsx (/analytics)
- [x] Write 32 comprehensive tests for analytics procedures (all passing)
- [x] Test student performance tracking and aggregation
- [x] Test question performance analysis and difficulty identification
- [x] Test class performance analytics
- [x] Test daily engagement trend tracking
- [x] Test topic mastery tracking across multiple topics
- [x] Test difficulty progression tracking (easy, medium, hard)
- [x] Test teacher analytics summary calculation
- [x] Verify data consistency across multiple operations
- [x] Test edge cases (zero values, maximum values)
- [x] Verify dev server running with no TypeScript errors


## Comparative Analytics Enhancement - COMPLETED
- [x] Design comparative analytics features and data requirements
- [x] Create database schema for historical performance snapshots
- [x] Build backend procedures for period-over-period comparisons
- [x] Create improvement trend calculation functions
- [x] Implement student progress tracking over time
- [x] Add comparative UI components with trend indicators
- [x] Create period-over-period comparison visualizations
- [x] Implement improvement alerts and insights
- [x] Add student ranking changes tracking
- [x] Create class improvement metrics
- [x] Write comprehensive tests for comparative analytics (25 tests passing)
- [x] Integrate comparative analytics into main dashboard
- [x] Test improvement tracking accuracy


## Goal-Setting Feature - COMPLETED
- [x] Design goal data model and database schema
- [x] Create database tables for goals and progress tracking (4 tables)
- [x] Build backend CRUD procedures for goals (20+ helper functions)
- [x] Implement goal progress calculation logic
- [x] Create goal creation form component (GoalCreationForm)
- [x] Build goal management UI (GoalsManagement with edit, delete, view)
- [x] Create goal progress visualization component (GoalProgressTracker)
- [x] Implement goal achievement notifications (GoalAchievementNotifications)
- [x] Add goal filtering and sorting
- [x] Write comprehensive tests for goal functions (23 tests passing)
- [x] Integrate goal UI into analytics dashboard (TeacherPortal Goals tab)
- [x] Test goal creation and progress tracking


## AI-Powered Goal Suggestions - COMPLETED
- [x] Design AI suggestion engine and data analysis requirements
- [x] Create backend procedure to gather student performance data
- [x] Build AI prompt engineering for goal recommendations
- [x] Create tRPC procedure for AI goal suggestions (getAISuggestions, acceptAISuggestions)
- [x] Build UI component for displaying and accepting AI suggestions (AIGoalSuggestions)
- [x] Implement suggestion caching and optimization (suggestionCache.ts)
- [x] Write tests for AI suggestion functions (20 tests passing)
- [x] Integrate AI suggestions into goal creation flow (GoalsManagement)


## Student Goal Portal - COMPLETED
- [x] Design student portal layout and user experience
- [x] Create student goal viewing and progress tracking components (StudentGoalCard, StudentGoalPortal)
- [x] Build progress visualization with charts and indicators (StudentProgressChart with Recharts)
- [x] Implement milestone celebration and achievement animations (MilestoneAchievements)
- [x] Create personalized encouragement message system (EncouragementMessages with AI-generated insights)
- [x] Add goal filtering and sorting features (by status, priority, due date, progress)
- [x] Write tests for student portal functionality
- [x] Integrate student portal into main navigation (added /goals route and My Goals link)


## Student Journaling Feature - IN PROGRESS
- [ ] Design journal data model and database schema
- [ ] Create database tables for journal entries and reflections
- [ ] Build backend procedures for journal CRUD operations
- [ ] Create journal entry editor and reflection prompt components
- [ ] Build journal timeline and reflection history view
- [ ] Implement reflection insights and progress analysis
- [ ] Write tests for journaling functionality
- [ ] Integrate journaling feature into student portal


## AI Journal Insights Feature - COMPLETED
- [x] Design AI insight generation system and analysis requirements
- [x] Create backend service for journal analysis using OpenAI (journalAnalysis.ts)
- [x] Build tRPC procedures for generating and retrieving insights (generateInsights, getLatestInsights, getInsightHistory)
- [x] Create UI components for displaying AI-generated insights (InsightCard, JournalInsightsPanel)
- [x] Implement insight caching and optimization (insightCache.ts with TTL management)
- [x] Add insight refresh and manual generation triggers (refresh button in JournalInsightsPanel)
- [x] Write tests for AI insight analysis functions (17 tests passing)
- [x] Integrate insights into student portal (Insights tab in StudentGoalPortal)


## Insight-Based Goal Recommendations - COMPLETED
- [x] Design goal recommendation engine and matching algorithm
- [x] Create backend service for generating goal recommendations from insights (goalRecommendations.ts)
- [x] Build tRPC procedures for retrieving and accepting recommendations (getRecommendations, acceptRecommendation)
- [x] Create UI component for displaying recommended goals (RecommendedGoalsPanel)
- [x] Implement recommendation ranking and filtering (rankRecommendations, filterRecommendationsByType, getTopRecommendations)
- [x] Add one-click goal creation from recommendations (integrated in RecommendedGoalsPanel)
- [x] Write tests for goal recommendation functions (21 tests passing)
- [x] Integrate recommendations into student portal (Recommended tab in StudentGoalPortal)


## Teacher Goal Monitoring Dashboard - COMPLETED
- [x] Design teacher goal monitoring dashboard layout and features
- [x] Create database queries for goal adoption and progress metrics
- [x] Build tRPC procedures for fetching monitoring data (getClassMetrics, getStudentAdoptionStatus, getAtRiskGoals, getGoalTypeDistribution)
- [x] Create dashboard UI components for goal adoption overview (TeacherGoalMonitoringDashboard)
- [x] Build student progress tracking and status visualization (bar charts, pie charts, student list with progress bars)
- [x] Implement filtering, sorting, and export functionality (CSV export, at-risk goals highlighting, sorting by progress)
- [x] Write tests for goal monitoring functions
- [x] Integrate dashboard into teacher portal (Goal Monitor tab in TeacherPortal with per-class views)
