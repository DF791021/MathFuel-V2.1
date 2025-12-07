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
