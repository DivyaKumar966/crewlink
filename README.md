# CREWLINK

Project collaboration platform built with MongoDB, Express, React and Node.js.

## 1. Requirements
- Node.js 20+
- MongoDB local installation or MongoDB Atlas account
- Google OAuth Web Client ID (you will add this yourself)

## 2. Backend setup
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and fill in your MongoDB URI, JWT secret and Google Client ID.

```bash
npm run dev
```
API runs at http://localhost:5000

## 3. Frontend setup
Open another terminal:
```bash
cd frontend
npm install
```
Create `frontend/.env` from `.env.example`, and add the same Google Client ID.

```bash
npm run dev
```
Open http://localhost:5173

## 4. Google OAuth
Create a Google OAuth Web application in Google Cloud Console.
Add `http://localhost:5173` as an authorized JavaScript origin.
Copy the Web Client ID to both env files. No client secret is needed in this frontend flow.
The backend verifies the Google credential and issues the app's JWT.

## 5. Database
Example local URI:
`mongodb://127.0.0.1:27017/crewlink`

For MongoDB Atlas, paste your own connection string into `backend/.env`.
Never commit `.env` files.

## Included
- Google sign-in and first-login profile completion
- Project creation, project discovery and filters
- Join requests and leader approval/rejection
- Role capacity validation
- Team workspace and task assignment
- Warning-before-member-removal rule
- Admin user deactivation and project deletion
- Socket.IO workspace events
- GitHub webhook activity endpoint starter
- Responsive UI with subtle transitions and animations

GitHub repository access is not automatically granted by entering a username. A project owner must add collaborators through GitHub or install/configure a GitHub App. The webhook endpoint is provided for activity updates; configure it only after deployment and use the raw-body verification implementation included here.


## Recent UI and notification updates

- CREWLINK logo is used in the navigation, login screen, dashboard graphic, and browser tab favicon (`frontend/public/crewlink-logo.png`).
- Project leaders cannot apply to their own project (checked in both frontend and backend).
- Project leaders can review pending applications from the project workspace.
- Applications create persistent notifications for the project leader. Approval/rejection creates a notification for the applicant.
- The notification bell loads unread notifications and receives new ones live through an authenticated Socket.IO connection.
- User avatars fall back to initials if the Google profile image cannot be loaded.

After replacing the source files, install dependencies in `frontend` and `backend` with `npm install`, then start each app as described above. Keep your own `.env` files locally; they are intentionally not included in this ZIP.


## CREWLINK updates in this build

### Sign-in and theme
- Landing page includes CREWLINK introduction, feature overview, email/password registration and sign-in, plus Google sign-in.
- Email/password accounts use Node.js scrypt password hashing with a per-user salt. Passwords are never stored as plain text.
- Light/dark theme toggle is available on the landing page and inside the signed-in app. Theme preference is saved in the browser.

### Tasks and member management
- Only the project leader can assign tasks, and the assignee must be an active project member.
- A task assignment creates a persistent in-app notification for that selected member only.
- A member sees only tasks assigned to their account in their workspace. They can start a task (To do → In progress) and finish it (In progress → Completed).
- The task assignee is checked again by the backend. Other members and the leader cannot change that member's task status.
- Starting/completing a task sends an in-app update to the project leader.
- Leaders can issue a reasoned warning. The warning is saved and the member receives an in-app notification. The Remove action is only shown after a warning exists, and the backend independently enforces the same rule. Removing a member reopens their role slot.
- Project task data is returned only to the leader and active members; non-members cannot subscribe to project Socket.IO rooms.

### GitHub webhook setup (per project repository)
The GitHub webhook must be added to the **GitHub repository linked in that CREWLINK project**, not to the CREWLINK source-code repository.

1. Deploy the CREWLINK backend to a public HTTPS URL. A local `localhost` URL cannot receive GitHub webhooks.
2. Set `GITHUB_WEBHOOK_SECRET` on the backend host to a long random secret. Restart/redeploy the backend after setting it.
3. In CREWLINK, create/edit the project and set its GitHub repository URL exactly, for example `https://github.com/owner/repository`.
4. Copy that project's MongoDB project ID from its CREWLINK URL, `/projects/PROJECT_ID`.
5. Open the linked GitHub repository → Settings → Webhooks → Add webhook.
6. Payload URL: `https://YOUR-BACKEND-DOMAIN/api/github/webhook/PROJECT_ID`
7. Content type: `application/json`
8. Secret: the same value configured as `GITHUB_WEBHOOK_SECRET` on the backend.
9. Select **Just the push event**, keep the webhook active, and click Add webhook.
10. Push a test commit to that repository. Open the CREWLINK project workspace; the push should appear in GitHub activity while a team member is connected to that workspace.

The webhook verifies GitHub's HMAC SHA-256 signature against the original raw request bytes and checks that the pushed repository matches the repository URL saved on that project. Repeat these steps for each project repository. This starter handles push activity; it does not automatically create GitHub webhooks or install a GitHub App.

### Environment setup
Copy `.env.example` to `.env` in each folder and fill in your own values. Do not commit `.env` files. The same Google OAuth Web Client ID is used in both frontend and backend environment files. Add `http://localhost:5173` to Authorized JavaScript origins in Google Cloud Console.

Install dependencies and run each server in a separate terminal:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

Notifications are in-app notifications (database + Socket.IO). Email, SMS and operating-system push notifications are not included.

## Developer profiles and membership updates
- Developer profiles include email, GitHub username/profile, LinkedIn, portfolio, bio and technology skills.
- Authenticated users can open public developer profiles from project leaders, crew members and pending applicants.
- Public profiles show projects led/joined and active/completed project counts. Project leaders can mark a project completed or reopen it from its workspace.
- Active non-leader members can leave a project from the workspace. The role vacancy is reopened and the leader receives an in-app notification.
- Project leaders can open an applicant's public profile before approving or rejecting an application.
- Dark mode uses high-contrast white headings and text in place of the low-contrast navy headings.
