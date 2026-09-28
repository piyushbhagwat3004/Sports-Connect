# Task List

## Fix 1: Profile Navigation (SSR Docker Networking)
- [x] Add `INTERNAL_API_URL` env var to docker-compose.yml frontend service
- [x] Create `serverClient` in frontend config/index.jsx
- [x] Update `[username].jsx` getServerSideProps to use `serverClient`

## Fix 2: Team Join → Owner Approval Flow
- [x] Add `team_join_request` to notification model enum
- [x] Rewrite `joinTeam` to send notification instead of direct add
- [x] Add `acceptJoinRequest` handler in team.controller.js
- [x] Add `rejectJoinRequest` handler in team.controller.js
- [x] Register new routes in team.routes.js
- [x] Add Accept/Decline buttons for team_join_request in Navbar
- [x] Change "Join Squad" label to "Request to Join" in teams page

## Fix 3: Profile Page — Show Posts & Teams
- [x] Add `GET /teams/user/:userId` backend endpoint
- [x] Add Posts grid section to [username].jsx
- [x] Add Teams section to [username].jsx
- [x] Style new profile sections

## Fix 4: API Testing
- [x] Create 3 demo users via API
- [x] Test connection requests between users
- [x] Test team creation, join request, and approval
- [x] Test post creation and commenting notifications
- [x] Test squad chat messaging

## Phase 2: ObjectID and Notification Fixes
- [x] Fix ObjectID reference comparisons in `team.controller.js` (`joinTeam`, `acceptJoinRequest`, `leaveTeam`, `inviteToTeam`, `acceptTeamInvite`)
- [x] Add `"like"` and `"team_message"` types to Notification enum
- [x] Trigger notification on Post Liked in `posts.controller.js`
- [x] Trigger notification on Connection Request Accepted in `user.controller.js`
- [x] Trigger notification on Team Message Sent to all other squad members in `teamMessage.controller.js`
- [x] Implement Accept/Reject buttons for `connection_request` inside Navbar Notification dropdown
- [x] Map icons for `"like"` and `"team_message"` notifications in Navbar
- [x] Update and execute automated integration tests `test_all_features.js` to verify all Phase 2 fixes
- [x] Add checks to hide action buttons on accepted notification messages in `Navbar/index.jsx`
- [x] Implement premium Athlete Scouting Profile layout in `[username].jsx` and `index.module.css`
- [x] Implement premium Network Dashboard layout in `my_connections/index.jsx` and `index.module.css`
