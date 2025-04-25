# Application Use Cases & Features (Thorough Analysis)

Based on detailed analysis of the frontend and backend code, this document outlines implemented vs. missing/incomplete features, focusing on specific UI interactions, data flow, and potential implementation steps.

## Core Concepts

The application is a collaborative platform centered around **Teams** and **Projects**. Users manage tasks via a Kanban board, communicate via partially implemented chat features, schedule events, take personal notes (Markdown supported), and manage contacts. Collaboration relies on users **requesting** to join Teams/Projects, which Admins then approve/reject. Direct Admin **invites** are largely missing.

## Feature Breakdown

### 1. Authentication (`/`, `/signin`, `AuthContext`)

*   **Implemented:**
    *   **Registration:** Basic form (likely email/password fields) on `/signin` or a dedicated signup route. Calls backend `POST /user/register`.
    *   **Login:** Email/password form on `/signin`. Calls backend `POST /user/login`, receives JWT.
    *   **Google OAuth:** Backend `User` model has `googleId`. Frontend integration likely uses a "Sign in with Google" button, initiating an OAuth flow (specific library/implementation not verified).
    *   **Password Hashing:** Backend uses `bcrypt` via `userSchema.pre('save')`.
    *   **JWT:** Backend issues tokens via `userSchema.methods.generateAuthToken`. Frontend `AuthContext` likely stores token (e.g., in localStorage) and sends it in API request headers (e.g., via Axios interceptors).
    *   **Route Protection:** Frontend `ProtectedRoute` component uses `useAuth()` hook to check for `user` state before rendering child routes. Redirects to `/signin` if no user.
    *   **Pages:** Basic `HomePage` (`/`) and `SigninPage` (`/signin`) components exist.
    *   **Logout:** Assumed `logout` function in `AuthContext` clears user state and removes token.
*   **Missing/Incomplete:**
    *   **UI Detail:** `/` and `/signin` pages likely have minimal styling/content beyond basic forms. so the `/` page should display ehat the website does and a full website information page with buttons to login/signin. the ui should also be good for `/` and `/signin` pages

### 2. Dashboard (`/dashboard`, `Dashboard.js`)

*   **Implemented:**
    *   Route (`/dashboard`) defined in `App.js`.
    *   `Dashboard/index.js` renders a simple `<div>Dashboard</div>` placeholder.
*   **Missing/Incomplete:**
    *   **All Content:** Lacks any informational widgets (My Tasks, Recent Activity, etc.).
    *   **Data Fetching:** No `useEffect` hooks or API calls within `Dashboard/index.js` to load data.
*   **How to Implement:**
    *   **UI:** Design components for dashboard widgets (e.g., `MyTasksWidget`, `ActivityFeedWidget`).
    *   **Backend:** Create specific endpoints if needed (e.g., `GET /user/dashboard-summary` aggregating tasks, notifications). Alternatively, fetch data from existing endpoints (tasks, projects, notifications) and filter/process on frontend.
    *   **Frontend:** Use `useEffect` in `Dashboard/index.js` to fetch data from context or API services on mount. Pass data as props to widget components.

### 3. Teams - Overview Page (`/teams`, `Teams.js`, `TeamsContext`)

*   **Implemented:**
    *   **View Toggles:** Buttons (`BsGrid3X3Gap`, `BsList`) set `viewMode` state, conditionally rendering grid or list layout.
    *   **Listing:** Fetches teams via `fetchTeams()` from `TeamsContext`. Renders sorted/filtered teams using `.map()`:
        *   Grid: `Link` component styled as `team-card`. Shows name, description snippet, admin badge, member/project counts.
        *   List: `Link` component styled as `team-list-item`. Shows avatar initial, name, description, member/project counts with icons.
    *   **Creation:** "Create Team" button sets `showCreateModal` state to true. `CreateTeamModal` component (code not seen) likely takes name/description, calls `createTeam(teamData)` from context on submit (which hits `POST /team`).
    *   **Search:** `<input type="text">` updates `searchQuery` state. Client-side filtering applied via `teams.filter()`.
    *   **Filtering:** `<select>` dropdown updates `filterBy` state. Client-side filtering applied. Options: 'all', 'admin', 'member'.
    *   **Sorting:** `<select>` dropdown updates `sortBy` state. Client-side sorting applied via `teams.sort()`. Options: 'name', 'members', 'projects', 'recent'.
    *   **Navigation:** `Link` components navigate to `/teams/:teamId`.
    *   **Handling Incoming Requests:** "Join Requests" button toggles `showJoinRequests` state. Fetches *user's* pending requests via `fetchJoinRequests()` from context (likely `GET /team/join-requests` filtered for the user). Displays requests (UI not seen) with Accept/Reject buttons calling context functions (`acceptJoinRequest`, `rejectJoinRequest`), which likely hit `POST /team/accept-join` / `POST /team/reject-join`.
*   **Missing/Incomplete:**
    *   **Inviting Users:** No "Invite" button or related UI flow. also there should be a view invites pop on this page
    *   **Editing/Deletion:** No buttons/menus on cards/list items.
*   **How to Implement:**
    *   **Invites:** Add on `TeamDetail` page (see below).
    *   **Editing/Deletion:** Add on `TeamDetail` page.

### 4. Teams - Detail Page (`/teams/:teamId`, `TeamDetail.js`, `TeamsContext`)

*   **Implemented:**
    *   **Data Fetching:** Uses `useEffect` and `axios.get(${API_URL}/team/${teamId})` to fetch specific team data on mount.
    *   **Info Display:** Shows `team.name`, `team.description`, member/project counts fetched from API.
    *   **Tabs:** State `activeTab` likely controls which view (`members`, `projects`, `chat`, `invite`) is rendered. Tab switching UI itself not fully visible.
    *   **Members Tab:** `renderMembers` function maps `team.members` array, displaying each member's avatar initial, name, email, and role (checks if `member._id === team.admin._id`).
    *   **Projects Tab:** `renderProjects` function maps `team.projects` array, displaying basic project info (name, description, status, due date).
    *   **Chat Tab:** `renderTeamChat` function maps `team.messages` (if present on fetched data), showing author/time/content. Includes an uncontrolled `<input>` and "Send" button (form submission logic missing).
    *   **Handling Join Requests (Admin):** "Join Requests ({count})" button (visible if `team.admin._id === user._id`) toggles `showJoinRequests` state. Fetches requests for *this team* (`GET /team/join-requests` filtered client-side or needs dedicated backend endpoint like `GET /team/:teamId/requests`). Renders requests (UI not seen) with Accept/Reject buttons calling `handleAcceptRequest`/`handleRejectRequest` which use `axios.post` to hit `POST /team/accept-join` / `POST /team/reject-join`.
*   **Missing/Incomplete:**
    *   **Member Invites:** "Invite Members" button exists, sets `activeTab` to 'invite'. `handleInviteMember` function **incorrectly** calls `POST /team/join-request` with an email. **Needs complete rework:** 1. Add user search input on 'invite' tab. 2. Add backend endpoint `GET /user/search?query=...`. 3. On selection, call backend `POST /team/add-member` (requires `userId`) or create a dedicated `POST /team/invite` endpoint.
    *   **Member Management:** No "Remove Member" or "Promote/Demote Sub-Admin" buttons/options visible in `renderMembers`. Requires UI controls and backend endpoints (`POST /team/remove-member`, `POST /team/update-role`).
    *   **Sub-Admin Role:** Backend `subAdmins` array is ignored by the UI. Needs display in `renderMembers` and management controls.
    *   **Project Management:** No "Create Project" button or links to manage existing projects listed in `renderProjects`.
    *   **Team Editing/Deletion:** No "Edit Team" or "Delete Team" buttons. Requires UI controls (visible to admin) and backend endpoints (`PUT /team/:teamId`, `DELETE /team/:teamId`).
    *   **Real-time Chat:** `renderTeamChat` shows static data. Needs `socket.io-client` integration, likely via `ChatContext`, to send messages (`socket.emit`) and receive/display new messages (`socket.on`). Input form needs state management and submit handler.
*   **How to Implement:** Address each point above by adding required UI elements, implementing correct API calls (potentially requiring new backend endpoints), and integrating WebSockets for chat.

### 5. Projects - Overview Page (`/projects`, `Projects.js`, `ProjectsContext`)

*   **Implemented:**
    *   **View Toggles:** Buttons (`BsGrid3X3Gap`, `BsList`) control view mode.
    *   **Listing:** Fetches projects via `fetchProjects()` from `ProjectsContext`. Renders using `ProjectCard` (grid) or list row component (list view code not fully seen). Displays name, status badge, team name, deadline, member/task counts.
    *   **Creation:** "+" button sets `showCreateModal`. Modal (UI not seen) takes name, description, team, status, deadline. Calls `createProject(projectData)` from context (hits `POST /project`).
    *   **Search:** Input updates `search` state for client-side filtering.
    *   **Filtering:** `<select>` for status ('all', 'future', 'ongoing', 'completed'). Client-side filtering.
    *   **Sorting:** `<select>` for sort key ('name', etc.). Client-side sorting.
    *   **Status Change:** Buttons ("Start Project", "Complete Project") on `ProjectCard` call `handleStatusChange`, which uses `updateProject(projectId, { status: newStatus })` from context (hits `PUT /project/:id`).
    *   **Navigation:** `ProjectCard` click navigates to `/projects/:projectId`.
    *   **Handling Join Requests (Admin):** "Join Requests" section (toggled via `showJoinRequests`) fetches requests via `fetchJoinRequests()` from context. Displays requests (UI not seen) with Accept/Reject buttons calling context functions (`acceptJoinRequest`, `rejectJoinRequest`) hitting backend `POST /project/accept-join`, `POST /project/reject-join`.
    *   **Edit/Delete (Partial):** `handleEditProject`/`handleUpdateProject` functions manage `showEditModal` state and call `updateProject()` from context. `handleDeleteProject` calls `deleteProject()` from context (hits `DELETE /project/:id`). Assumes trigger buttons exist on cards/list items.
*   **Missing/Incomplete:**
    *   **Project Invites:** No UI to invite users directly.
    *   **Sorting/Filtering:** Options are basic (only status filter).
    *   **UI Triggers for Edit/Delete:** Specific buttons/menus not confirmed in snippet.
*   **How to Implement:**
    *   **Invites:** Add "Invite Member" button (visible to admins) on `ProjectDetail` page. Follow search user + add/invite flow (needs backend endpoint `POST /project/add-member` or `POST /project/invite`).
    *   **Sorting/Filtering:** Add more `<option>` elements and update client-side logic.

### 6. Projects - Detail Page (`/projects/:projectId`, `ProjectDetail.js`, `TasksContext`, `ProjectsContext`) - Task Board

*   **Implemented:**
    *   **Data Loading:** `useEffect` finds project in `projects` array from context or potentially fetches individually (code snippet cut off). Populates `tasks` state, sorting by due date within status categories.
    *   **Board Structure:** Uses `DragDropContext`. `TaskColumn` components act as `Droppable` areas for statuses ('todo', 'assigned', 'review', 'completed').
    *   **Task Cards:** `TaskCard` component is `Draggable`. Shows title, priority, creator, due date. "View" button opens `TaskDetailsModal`. Visually distinct styles for `rejected` / `completed`.
    *   **Task Details Modal:** `TaskDetailsModal` component displays all task fields. Includes a "Delete Task" button (visible to admin/creator) calling `handleDelete` (hits `DELETE /task/:taskId`).
    *   **Add Task:** "+" button in 'todo' column calls `handleAddTaskClick` setting `showAddTaskModal`. Modal (UI not seen) takes title, description, due date, priority. Calls `handleAddTask` which uses `addTask(newTaskData)` from context (hits `POST /task`).
    *   **Drag-and-Drop Logic (`handleDragEnd`):**
        *   Determines source/destination columns.
        *   Calls `moveTask(task, fromStatus, toStatus)` helper.
        *   **Special Transitions:**
            *   If `toStatus` is 'assigned', sets `showAssignModal`, waits for member selection, then updates task via API (`PUT /task/:taskId` with `assignedTo` and `status`).
            *   If `toStatus` is 'completed', updates task via API (likely sets `completedAt` and `status`).
            *   If source is 'review' and dest is 'assigned' (rejection), sets `showRemarkModal`, waits for remark input, then updates task via API (sets `remark`, `isRejected: true`, `status: 'assigned'`).
            *   Other transitions likely update status directly via API.
    *   **Navigation:** "Back" button (`BsArrowLeft`) navigates to `/projects`.
*   **Missing/Incomplete:**
    *   **Member Management:** No UI for inviting/removing project members.
    *   **Project Editing:** No UI for editing project details (name, description, etc.).
    *   **Project Chat:** No UI integration for `ProjectChat`.
    *   **Task Editing:** No "Edit" button on `TaskCard` or `TaskDetailsModal`. Requires UI trigger, modal, and backend `PUT /task/:taskId`.
    *   **Task Comments:** Only single rejection `remark` handled. Backend `remarks` array ignored. Needs comment list UI in modal, input field, and backend `POST /task/:taskId/comment`, `GET /task/:taskId/comments`.
*   **How to Implement:**
    *   **Members:** Add "Members" tab/section with Invite/Remove UI (calling relevant backend endpoints).
    *   **Project Edit:** Add "Edit Project" button (visible to admin) opening modal, calling `updateProject()`.
    *   **Chat:** Add "Chat" tab integrating chat component via WebSockets.
    *   **Task Edit:** Add "Edit" button to modal/card -> open modal -> call `PUT /task/:taskId`.
    *   **Comments:** Add comment list/input to `TaskDetailsModal`, implement backend API.

### 7. Notes - Overview Page (`/notes`, `Notes.js`, `NotesContext`)

*   **Implemented:**
    *   **Listing:** Fetches notes via `fetchNotes()` from `NotesContext`. Renders grid of `Link`s styled as `note-card`.
    *   **Card Content:** Shows title, Markdown snippet (via `markdown-it` with `dangerouslySetInnerHTML`), last updated date (`note.updatedAt`).
    *   **Markdown:** `renderMarkdown` function uses `markdown-it` parser, ensures external links open in new tab.
    *   **Search:** `<input>` filters notes client-side based on title/content match.
    *   **Creation:** "+ New Note" button (`Link`) navigates to `/notes/new`.
*   **Missing/Incomplete:**
    *   **Sorting/Filtering:** No UI controls.
    *   **Quick Actions:** No Edit/Delete buttons on cards.
    *   **Tags:** Placeholder comment exists, but feature not implemented in model or UI.
*   **How to Implement:**
    *   **Sort/Filter:** Add `<select>` controls, update client-side sort/filter logic.
    *   **Quick Actions:** Add icon buttons to cards linking to edit (`/notes/:id/edit`) or triggering delete (via context `removeNote` -> `DELETE /notes/:id`).
    *   **Tags:** 1. Add `tags: [String]` to backend `Note` model. 2. Add tag input to `NoteEditor`. 3. Update `addNote`/`editNote` to handle tags. 4. Display tags on `note-card`. 5. Add tag filtering UI.

### 8. Notes - Editor Page (`/notes/new`, `/notes/:noteId/edit`, `NoteEditor.js`, `NotesContext`)

*   **Implemented:**
    *   **Mode Handling:** Checks `useParams().noteId` to determine create/edit mode.
    *   **Data Loading (Edit):** `useEffect` finds note in `notes` array from context.
    *   **Title:** Controlled `<input type="text">` for `title` state.
    *   **Editor:** Uses `<MdEditor>` component, updating `content` state via `onChange`. Toolbar configured.
    *   **Saving:** "Save" button calls `handleSave`. Uses `addNote` or `editNote` from context (hitting `POST /notes` or `PUT /notes/:id`). Disables button during save. Navigates to `/notes` on success.
    *   **Local Auto-Save:** `useEffect` saves `title`/`content` to `localStorage` (`noteAutoSave`) after 1s debounce. Loads from localStorage on mount if state is empty. Clears on successful manual save.
    *   **Error Handling:** Displays `saveError` state. Handles context `loading`/`error`.
*   **Missing/Incomplete:**
    *   **Robust Data Loading:** Relies on context; direct navigation to edit URL fails if context isn't populated. Needs fallback fetch.
    *   **Tag Management:** No UI for tags.
    *   **Deletion:** No "Delete" button.
    *   **Autosave UI:** No visual feedback (e.g., "Saving...", "Draft saved").
*   **How to Implement:**
    *   **Robust Fetch:** In `useEffect`, if note not in context, call `fetchNoteById(noteId)` (needs context function + `GET /notes/:id` backend).
    *   **Tags:** Add tag input component, integrate with `handleSave`.
    *   **Delete:** Add button calling context `removeNote(noteId)` -> `DELETE /notes/:id`.
    *   **Autosave UI:** Add subtle text indicator based on saving state/timeout.

### 9. Events (`/events`, `EventsPage.js`, `EventsContext`)

*   **Implemented:**
    *   **Calendar View:**
        *   Month view with navigation (previous/next month buttons).
        *   Weekday headers (Monday to Sunday).
        *   Day cells showing date and events (up to 2 events visible, "+X more" for additional).
        *   Visual distinction for current month days vs. other month days.
        *   Today's date highlighted.
        *   Click on day to create new event.
    *   **Event List View:**
        *   Lists all events sorted by date.
        *   Shows event title, date/time, description, and tag.
        *   Visual distinction for expired events.
        *   Toggle to show/hide expired events.
        *   Click on event to edit.
    *   **Event Creation/Editing:**
        *   Modal form with fields for:
            *   Title (required)
            *   Description
            *   Date & Time (datetime-local input)
            *   Tag selection (meeting, deadline, reminder, appointment, general)
        *   Form validation (title required).
        *   Pre-fills date when creating from calendar click.
        *   Pre-fills all fields when editing existing event.
    *   **Event Management:**
        *   Delete expired events functionality (with confirmation).
        *   Count of expired events displayed.
        *   Events sorted by date (active) and reverse date (expired).
    *   **UI/UX:**
        *   Responsive design (stacks calendar and list on mobile).
        *   Loading states with spinner.
        *   Error handling and display.
        *   Empty state messages.
        *   Hover effects and transitions.
        *   Color-coded tags and status indicators.
*   **Missing/Incomplete:**
    *   **Recurring Events:** No support for recurring events (daily, weekly, monthly).
    *   **Event Reminders:** No reminder/notification system.
    *   **Event Sharing:** No way to share events with other users also with tems or projects.
    *   **Event Export:** No export functionality (iCal, etc.).
    *   **Event Search:** No search functionality for events.
    *   **Event Filtering:** No filtering by tag or date range.
    *   **Event Colors:** No custom color assignment for events.
*   **How to Implement Missing Features:**
    *   **Recurring Events:**
        1. Add recurrence options to `EventForm` (frequency, end date).
        2. Update backend model to store recurrence rules.
        3. Modify calendar view to show recurring instances.
    *   **Event Categories:**
        1. Add category management UI.
        2. Update backend model to support custom categories.
        3. Add category filtering to event list.
    *   **Event Reminders:**
        2. Implement notification system using WebSocket.
    *   **Event Sharing:**
        1. Add share button to event form.
    *   **Event Export:**
        1. Add export options
        2. Implement export generation.
        3. Add export button to event list.
    *   **Event Search/Filter:**
        1. Add search bar to event list.
        2. Implement tag/date range filters.
        3. Add filter UI components.
    *   **Event Colors:**
        1. Add color picker to `EventForm`.
        2. Update calendar view to use custom colors.
        3. Add color management system.

### 10. Contacts (`/contacts`, `ContactsPage.js`, `ContactsContext`)

*   **Implemented:**
    *   **View Modes:**
        *   List view with detailed contact information
        *   Grid view with compact contact cards
        *   Toggle between views using icons
    *   **Contact Management:**
        *   Add new contacts with comprehensive form
        *   Edit existing contacts
        *   Delete contacts with confirmation
        *   Share contacts (UI ready, functionality pending)
    *   **Contact Information:**
        *   Basic info: First Name, Last Name (required)
        *   Contact details: Email, Phone, Mobile
        *   Professional info: Company, Job Title
        *   Address: Full address, City, State, Country, ZIP Code
        *   Additional: Website, Notes, Tags
        *   Profile image support
    *   **Search & Filter:**
        *   Real-time search across all contact fields
        *   Tag-based filtering
    *   **Import/Export:**
        *   Import contacts from CSV/Excel files
        *   Export contacts to CSV/Excel
        *   Preview imported contacts before saving
        *   Validation during import
    *   **UI/UX:**
        *   Responsive design for all screen sizes
        *   Loading states and error handling
        *   Empty state messages
        *   Hover effects and transitions
        *   Action menus for each contact
        *   Form validation
        *   Duplicate contact detection
*   **Missing/Incomplete:**
    *   **Contact Sharing:** Share button exists but functionality not implemented
    *   **Bulk Actions:** No way to select and perform actions on multiple contacts
    *   **Contact Linking:** No way to link contacts to projects/teams
    *   **Contact Sync:** No synchronization with external contact sources
*   **How to Implement Missing Features:**
    *   **Contact Sharing:**
        2. Add share options (view/edit permissions)
        3. Add shared contacts view
    *   **Bulk Actions:**
        1. Add multi-select UI
        2. Implement bulk operations (delete, export, etc.)
        3. Add confirmation dialogs
    *   **Contact Linking:**
        1. Add project/team selection in contact form (can be multiple)
    *   **Contact Sync:**
        1. Add sync options (Google, Outlook, etc.)
        2. Implement sync service
        3. Add conflict resolution

### 11. Notifications (Integrated, `NotificationContext`, `socketService.js`)

*   **Implemented:**
    *   **Notification Center:**
        *   Dropdown in header with notification bell icon
        *   Unread count badge
        *   Mark all as read functionality
        *   Delete individual/all notifications
        *   Load more notifications with pagination
    *   **Notification Types:**
        *   Task assigned/status changed
        *   Event reminders
        *   Friend requests
        *   Team/project invites
        *   New messages
        *   Task due soon alerts
    *   **Notification UI:**
        *   Type-specific icons with color coding
        *   Title and message display
        *   Timestamp formatting (just now, minutes ago, etc.)
        *   Unread state highlighting
        *   Hover actions (delete)
        *   Click to navigate to related content
    *   **Real-time Updates:**
        *   WebSocket integration for instant notifications
        *   Auto-mark as read when dropdown opens
    *   **Backend Integration:**
        *   Comprehensive `Notification` model
        *   Auto-deletion after 30 days
        *   Read/unread status tracking
*   **Missing/Incomplete:**
    *   **Notification Priority:** No priority levels for notifications
    *   **Notification Categories:** No grouping by type/category
    *   **Notification Search:** No search functionality
    *   **Notification Export:** No export functionality
*   **How to Implement Missing Features:**
    *   **Notification Priority:**
        1. Add priority field to notification model
        2. Implement priority-based sorting/filtering
        3. Add visual indicators for priority
    *   **Notification Categories:**
        1. Add category filtering UI
        2. Implement category-based grouping
        3. Add category management
    *   **Notification Search:**
        1. Add search input to notification dropdown
        2. Implement search functionality
        3. Add search filters
    *   **Notification Export:**
        1. Add export options (CSV, JSON)
        2. Implement export generation
        3. Add export button

### 12. Chat System (Integrated, `ChatContext`, `socketService.js`)

*   **Implemented:**
    *   **Chat Types:**
        *   Friend chats (1-on-1)
        *   Team chats
        *   Project chats
    *   **Chat UI:**
        *   Popup in header with chat icon
        *   Tabbed interface for different chat types
        *   Chat list with unread indicators
        *   Chat search functionality
        *   Last message preview
        *   Timestamp display
        *   Avatar display
    *   **Chat Features:**
        *   Real-time messaging via WebSocket
        *   Typing indicators
        *   Unread message tracking
        *   Message history
        *   Chat navigation
    *   **UI/UX:**
        *   Responsive design
        *   Loading states
        *   Empty state messages
        *   Hover effects
        *   Smooth transitions
*   **Missing/Incomplete:**
    *   **Message Features:**
        *   No message reactions
        *   No message search
    *   **Chat Management:**
        *   No chat creation UI
        *   No chat settings
        *   No chat export
*   **How to Implement Missing Features:**
    *   **Message Features:**
        2. Implement reaction system
        5. Add message search
    *   **Chat Management:**
        1. Add chat creation UI
        2. Implement chat settings
        4. Implement chat export

### 13. User Profile (`/profile`, `UserDropdown`, `ProfileContext`)

*   **Implemented:**
    *   **Profile Access:**
        *   User dropdown in header
        *   Profile link in dropdown
        *   Quick access to profile
    *   **Profile Information:**
        *   Name display
        *   Email display
        *   Profile image support
        *   Avatar fallback
    *   **Navigation:**
        *   Profile page link
        *   Friends page link
        *   Settings page link
        *   Help & Support link
        *   Logout option
    *   **UI/UX:**
        *   Dropdown menu with sections
        *   Icon-based navigation
        *   Hover effects
        *   Responsive design
*   **Missing/Incomplete:**
    *   **Profile Page:**
        *   No dedicated profile page
        *   No profile editing
        *   No profile customization
        *   No profile privacy settings
    *   **Social Features:**
        *   No social media links
        *   No bio/about section
        *   No achievements/badges
*   **How to Implement Missing Features:**
    *   **Profile Page:**
        1. Create profile page component
        2. Add profile editing form
        3. Implement profile customization
        4. Add privacy settings
    *   **Social Features:**
        1. Add social media integration
        2. Create bio/about section
        4. Add achievements system

### 14. Codespace (`/codespace`, `CodespacePage.js`)

*   **Implemented:**
    *   Route (`/codespace`) exists in `App.js`.
    *   Basic `CodespacePage.js` component exists.
*   **Missing/Incomplete:**
    *   **All UI and Functionality:** Content of `CodespacePage.js` not analyzed. Purpose and features unknown.
*   **How to Implement:** Define requirements (simple scratchpad? code editor like Monaco? collaborative features?). Build UI and backend logic accordingly.


### 16. User Profiles & Social Features (`userController.js`, `User.js`)

*   **Implemented:**
    *   **Backend:** `User.js` model stores profile fields, `friends`, `friendRequestsReceived`, `friendRequestsSent`. `userController.js` likely has endpoints for profile update, friend request actions (send, accept, reject), fetching profile data. `getCommonConnections` method exists.
*   **Missing/Incomplete:**
    *   **Profile Page UI:** No `/profile/:id` or `/settings/profile` route/page observed.
    *   **Profile Editing UI:** No form found for users to update their name, handle, bio, image.
    *   **Friend Management UI:** No dedicated page/section found for searching users, viewing friend list, or managing pending friend requests (accept/reject buttons).
    *   **Common Connections UI:** No part of the UI seems to display results from `getCommonConnections`.
*   **How to Implement:**
    *   **Profile:** 1. Create `/profile/me` and potentially `/profile/:userId` routes/pages. 2. Fetch user data (`GET /user/me` or `GET /user/:id`). 3. Display profile info. 4. Add an "Edit Profile" page/modal with form fields calling backend `PUT /user/me`.
    *   **Friends:** 1. Create a "Network" or "Friends" page. 2. Add user search (`GET /user/search`). 3. Add "Send Friend Request" button (calls `POST /user/friend-request`). 4. Display friend list (from `user.friends`). 5. Display pending incoming/outgoing requests with Accept/Reject/Cancel buttons (calling relevant backend endpoints).
    *   **Common Connections:** On profile pages, fetch connections (`GET /user/:id/common/:otherId`?) and display shared teams/projects.