# CREWLINK flow

1. User signs in with Google. Backend verifies the Google ID token and creates a user record.
2. First-time users complete GitHub username, bio and known technologies.
3. Users browse projects by project name, stack and category.
4. A leader creates a project with role capacities and optional repository URL.
5. A user applies for an open role. The leader approves or rejects the request.
6. Approval increments the role's filled count; the server checks capacity again before approval.
7. The leader assigns targets to active members.
8. The leader must issue at least one warning before removing a member. Removal reopens that role slot.
9. Admin can deactivate accounts and soft-delete projects. Admin access is controlled by a database role.
10. Socket.IO broadcasts workspace events. GitHub webhooks can publish push activity after secure webhook configuration.
