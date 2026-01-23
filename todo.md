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
