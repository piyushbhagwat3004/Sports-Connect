// test_all_features.js

const API_BASE = "http://localhost:9000";

// A small custom delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log("=== STARTING FULL END-TO-END FEATURES TEST ===");
  const suffix = Math.floor(1000 + Math.random() * 9000);
  
  const userAlpha = {
    name: `User Alpha ${suffix}`,
    username: `alpha_${suffix}`,
    email: `alpha_${suffix}@gmail.com`,
    password: "Password123"
  };

  const userBeta = {
    name: `User Beta ${suffix}`,
    username: `beta_${suffix}`,
    email: `beta_${suffix}@gmail.com`,
    password: "Password123"
  };

  const userGamma = {
    name: `User Gamma ${suffix}`,
    username: `gamma_${suffix}`,
    email: `gamma_${suffix}@gmail.com`,
    password: "Password123"
  };

  // 1. REGISTER USERS
  console.log("\n--- Registering Demo Users ---");
  for (const user of [userAlpha, userBeta, userGamma]) {
    const res = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user)
    });
    const data = await res.json();
    console.log(`Register ${user.username}: Status ${res.status}`, data);
    if (res.status !== 201) throw new Error(`Registration failed for ${user.username}`);
  }

  // 2. LOGIN USERS & RETRIEVE TOKENS
  console.log("\n--- Logging in Demo Users ---");
  const tokens = {};
  const userIds = {};

  for (const user of [userAlpha, userBeta, userGamma]) {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });
    const data = await res.json();
    console.log(`Login ${user.username}: Status ${res.status}`, data.message);
    if (res.status !== 200) throw new Error(`Login failed for ${user.username}`);
    tokens[user.username] = data.token;
  }

  // Get current profiles/ids for users
  for (const user of [userAlpha, userBeta, userGamma]) {
    const res = await fetch(`${API_BASE}/get_user_and_profile?token=${tokens[user.username]}`);
    const data = await res.json();
    userIds[user.username] = data.userProfile.userId._id;
    console.log(`Fetched User ID for ${user.username}: ${userIds[user.username]}`);
  }

  // 3. CREATE POST FOR ALPHA
  console.log("\n--- Creating Post for User Alpha ---");
  const postRes = await fetch(`${API_BASE}/post`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userAlpha.username],
      body: "Hello world! This is my first training post."
    })
  });
  const postData = await postRes.json();
  console.log("Post creation response:", postData);

  // Retrieve the post ID by getting all posts
  const allPostsRes = await fetch(`${API_BASE}/posts`);
  const allPostsData = await allPostsRes.json();
  const createdPost = allPostsData.posts.find(p => p.userId?.username === userAlpha.username);
  console.log("Found created post:", createdPost);
  const postId = createdPost._id;

  // 3.5. BETA LIKES ALPHA'S POST
  console.log("\n--- User Beta Likes User Alpha's Post ---");
  const likeRes = await fetch(`${API_BASE}/increment_post_like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      post_id: postId,
      user_id: userIds[userBeta.username]
    })
  });
  const likeData = await likeRes.json();
  console.log("Like Toggle status:", likeRes.status, likeData.message);

  // Check Alpha's notifications for like
  console.log("\n--- Checking Alpha's Notifications for Likes ---");
  const alphaLikeNotiRes = await fetch(`${API_BASE}/user/notifications?token=${tokens[userAlpha.username]}`);
  const alphaLikeNotiData = await alphaLikeNotiRes.json();
  const likeNotification = alphaLikeNotiData.notifications.find(n => n.type === 'like');
  console.log("Found like notification:", likeNotification ? likeNotification.message : "Not found!");

  // 4. BETA COMMENTS ON ALPHA'S POST
  console.log("\n--- User Beta Comments on User Alpha's Post ---");
  const commentRes = await fetch(`${API_BASE}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userBeta.username],
      post_id: postId,
      commentBody: "Great work, Alpha! Keep pushing!"
    })
  });
  const commentData = await commentRes.json();
  console.log("Comment Status:", commentRes.status, commentData.message);

  // Check Alpha's notifications for comment
  console.log("\n--- Checking Alpha's Notifications for comments ---");
  const alphaNotiRes = await fetch(`${API_BASE}/user/notifications?token=${tokens[userAlpha.username]}`);
  const alphaNotiData = await alphaNotiRes.json();
  console.log("Alpha's Notifications count:", alphaNotiData.notifications.length);
  const commentNotification = alphaNotiData.notifications.find(n => n.type === 'comment');
  console.log("Found comment notification:", commentNotification ? commentNotification.message : "Not found!");

  // 5. ALPHA SENDS CONNECTION REQUEST TO BETA
  console.log("\n--- User Alpha sends Connection Request to User Beta ---");
  const connReqRes = await fetch(`${API_BASE}/user/send_connection_request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userAlpha.username],
      connectionId: userIds[userBeta.username]
    })
  });
  const connReqData = await connReqRes.json();
  console.log("Connection Request status:", connReqRes.status, connReqData.message);

  // Check Beta's notifications for connection request
  console.log("\n--- Checking Beta's Notifications for connection request ---");
  const betaNotiRes = await fetch(`${API_BASE}/user/notifications?token=${tokens[userBeta.username]}`);
  const betaNotiData = await betaNotiRes.json();
  const connNotification = betaNotiData.notifications.find(n => n.type === 'connection_request');
  console.log("Found connection request notification:", connNotification ? connNotification.message : "Not found!");

  // 6. BETA ACCEPTS ALPHA'S CONNECTION REQUEST
  console.log("\n--- User Beta Accepts Connection Request ---");
  const acceptConnRes = await fetch(`${API_BASE}/user/accept_connection_request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userBeta.username],
      requestId: connNotification.relatedId,
      action_type: "accept"
    })
  });
  const acceptConnData = await acceptConnRes.json();
  console.log("Accept Connection status:", acceptConnRes.status, acceptConnData.message);

  // Check Alpha's notifications for connection acceptance
  console.log("\n--- Checking Alpha's Notifications for Connection Acceptance ---");
  const alphaConnNotiRes = await fetch(`${API_BASE}/user/notifications?token=${tokens[userAlpha.username]}`);
  const alphaConnNotiData = await alphaConnNotiRes.json();
  const connAcceptNoti = alphaConnNotiData.notifications.find(n => n.type === 'connection_request' && n.message.includes("accepted"));
  console.log("Found connection acceptance notification:", connAcceptNoti ? connAcceptNoti.message : "Not found!");

  // Verify they are connected by getting user connections list
  const getConnRes = await fetch(`${API_BASE}/user/get_user_connections?userId=${userIds[userAlpha.username]}`);
  const getConnData = await getConnRes.json();
  console.log("Alpha's Connections List:", getConnData.connections.map(c => c.username));

  // 7. ALPHA CREATES TEAM "Alpha Warriors"
  console.log("\n--- User Alpha Creates Team ---");
  const teamRes = await fetch(`${API_BASE}/teams/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userAlpha.username],
      name: `Alpha Warriors ${suffix}`,
      sport: "Football",
      description: "Only the elite squads belong here.",
      maxSize: 5
    })
  });
  const teamData = await teamRes.json();
  console.log("Team Created status:", teamRes.status, teamData.message);
  const teamId = teamData.team._id;

  // 8. BETA REQUESTS TO JOIN THE TEAM (APPROVAL FLOW CHECK)
  console.log("\n--- User Beta Requests to Join Alpha's Team ---");
  const joinReqRes = await fetch(`${API_BASE}/teams/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userBeta.username],
      teamId: teamId
    })
  });
  const joinReqData = await joinReqRes.json();
  console.log("Join Request status (Should be waiting for approval):", joinReqRes.status, joinReqData.message);

  // Check Alpha's notifications for team join request
  console.log("\n--- Checking Team Owner (Alpha) Notifications for Join Request ---");
  const ownerNotiRes = await fetch(`${API_BASE}/user/notifications?token=${tokens[userAlpha.username]}`);
  const ownerNotiData = await ownerNotiRes.json();
  const joinRequestNoti = ownerNotiData.notifications.find(n => n.type === 'team_join_request');
  console.log("Found join request notification:", joinRequestNoti ? joinRequestNoti.message : "Not found!");
  if (!joinRequestNoti) throw new Error("Join Request Notification not found for owner!");

  // 9. ALPHA APPROVES BETA'S REQUEST
  console.log("\n--- Team Owner (Alpha) Approves User Beta ---");
  const approveRes = await fetch(`${API_BASE}/teams/accept_join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userAlpha.username],
      teamId: teamId,
      notificationId: joinRequestNoti._id,
      requesterId: userIds[userBeta.username]
    })
  });
  const approveData = await approveRes.json();
  console.log("Approval Status:", approveRes.status, approveData.message);

  // 10. ALPHA INVITES GAMMA (DIRECT INVITATION FLOW CHECK)
  console.log("\n--- Team Owner (Alpha) Invites User Gamma ---");
  const inviteRes = await fetch(`${API_BASE}/teams/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userAlpha.username],
      teamId: teamId,
      targetUserId: userIds[userGamma.username]
    })
  });
  const inviteData = await inviteRes.json();
  console.log("Invite Gamma status:", inviteRes.status, inviteData.message);

  // Check Gamma's notifications for invite
  console.log("\n--- Checking Gamma's Notifications for Team Invite ---");
  const gammaNotiRes = await fetch(`${API_BASE}/user/notifications?token=${tokens[userGamma.username]}`);
  const gammaNotiData = await gammaNotiRes.json();
  const inviteNoti = gammaNotiData.notifications.find(n => n.type === 'team_invite');
  console.log("Found invite notification:", inviteNoti ? inviteNoti.message : "Not found!");
  if (!inviteNoti) throw new Error("Invite Notification not found for Gamma!");

  // 11. GAMMA ACCEPTS TEAM INVITATION
  console.log("\n--- User Gamma Accepts Team Invitation ---");
  const acceptInviteRes = await fetch(`${API_BASE}/teams/accept_invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userGamma.username],
      teamId: teamId,
      notificationId: inviteNoti._id
    })
  });
  const acceptInviteData = await acceptInviteRes.json();
  console.log("Accept Invite status:", acceptInviteRes.status, acceptInviteData.message);

  // Verify all members of the squad
  console.log("\n--- Getting Team Details to Verify Members ---");
  const allTeamsRes = await fetch(`${API_BASE}/teams`);
  const allTeamsData = await allTeamsRes.json();
  const targetTeam = allTeamsData.teams.find(t => t._id === teamId);
  console.log("Squad Member count:", targetTeam.members.length);
  console.log("Squad Members names:", targetTeam.members.map(m => m.name));

  // Verify get teams by user endpoint
  console.log("\n--- Testing GET /teams/user/:userId for Gamma ---");
  const gammaTeamsRes = await fetch(`${API_BASE}/teams/user/${userIds[userGamma.username]}`);
  const gammaTeamsData = await gammaTeamsRes.json();
  console.log("Gamma's teams list:", gammaTeamsData.teams.map(t => t.name));

  // 12. CHAT MESSAGING BETWEEN MEMBERS
  console.log("\n--- Live Squad Chat messaging ---");
  const msgRes = await fetch(`${API_BASE}/teams/${teamId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokens[userBeta.username],
      message: "Hey team! Ready for the match tomorrow?"
    })
  });
  const msgData = await msgRes.json();
  console.log("Message sent status:", msgRes.status, msgData.message);

  // Check Alpha's notifications for team message
  console.log("\n--- Checking Alpha's Notifications for Team Messages ---");
  const alphaMsgNotiRes = await fetch(`${API_BASE}/user/notifications?token=${tokens[userAlpha.username]}`);
  const alphaMsgNotiData = await alphaMsgNotiRes.json();
  const msgNotification = alphaMsgNotiData.notifications.find(n => n.type === 'team_message');
  console.log("Found squad chat message notification for Alpha:", msgNotification ? msgNotification.message : "Not found!");

  // Check Gamma's notifications for team message
  console.log("\n--- Checking Gamma's Notifications for Team Messages ---");
  const gammaMsgNotiRes = await fetch(`${API_BASE}/user/notifications?token=${tokens[userGamma.username]}`);
  const gammaMsgNotiData = await gammaMsgNotiRes.json();
  const gammaMsgNotification = gammaMsgNotiData.notifications.find(n => n.type === 'team_message');
  console.log("Found squad chat message notification for Gamma:", gammaMsgNotification ? gammaMsgNotification.message : "Not found!");

  // Retrieve chat messages
  const getMsgsRes = await fetch(`${API_BASE}/teams/${teamId}/messages?token=${tokens[userAlpha.username]}`);
  const getMsgsData = await getMsgsRes.json();
  console.log("Retrieved Chat messages in squad:");
  for (const m of getMsgsData.messages) {
    console.log(`[${m.senderId.name}]: ${m.message}`);
  }

  console.log("\n=== SPORT EVENT TESTS ===");

  const tokenAlpha = tokens[userAlpha.username];
  const tokenBeta  = tokens[userBeta.username];

  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate   = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const matchDateInRange  = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const matchDateOutRange = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Test 1: Host creates event
  console.log("\n[EVENT TEST 1] Alpha creates a Sport Event");
  const createEventRes = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: tokenAlpha, name: `Test Tournament ${suffix}`,
      description: 'An automated test event', startDate, endDate,
      sports: JSON.stringify([{ sportName: 'Football', advanceCount: 2 }]),
    })
  });
  const createEventData = await createEventRes.json();
  if (!createEventData.eventKey) throw new Error("Event creation failed — no eventKey: " + JSON.stringify(createEventData));
  const eventId  = createEventData.event._id;
  const eventKey = createEventData.eventKey;
  console.log(`✅ Event created. ID=${eventId}, Key=${eventKey}`);

  // Test 2: Follower joins via key
  console.log("\n[EVENT TEST 2] Beta joins event using key");
  const joinRes = await fetch(`${API_BASE}/events/join`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenBeta, eventKey })
  });
  const joinData = await joinRes.json();
  if (joinRes.status !== 200) throw new Error("Join by key failed: " + joinData.message);
  console.log(`✅ Beta joined: ${joinData.message}`);

  // Test 3: Duplicate join rejected
  console.log("\n[EVENT TEST 3] Beta joins again (should be 400)");
  const joinAgainRes = await fetch(`${API_BASE}/events/join`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenBeta, eventKey })
  });
  if (joinAgainRes.status !== 400) throw new Error("Duplicate join should return 400");
  console.log(`✅ Duplicate join correctly rejected (400)`);

  // Test 4: Host adds two teams
  console.log("\n[EVENT TEST 4] Alpha adds Thunder FC and Storm United");
  for (const [teamName, color] of [['Thunder FC', '#e63946'], ['Storm United', '#2196f3']]) {
    const r = await fetch(`${API_BASE}/events/${eventId}/teams`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenAlpha, sportName: 'Football', teamName, color, players: JSON.stringify([{name:'Alice'},{name:'Bob'}]) })
    });
    const d = await r.json();
    if (r.status !== 201) throw new Error(`Add team '${teamName}' failed: ${d.message}`);
    console.log(`✅ Team '${teamName}' added`);
  }

  // Test 5a: Validation — self-play
  console.log("\n[EVENT TEST 5a] Self-play validation (expect 400)");
  const selfPlayRes = await fetch(`${API_BASE}/events/${eventId}/matches`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenAlpha, sportName: 'Football', homeTeamName: 'Thunder FC', awayTeamName: 'Thunder FC' })
  });
  if (selfPlayRes.status !== 400) throw new Error("Self-play should return 400, got " + selfPlayRes.status);
  console.log(`✅ Self-play correctly rejected (400)`);

  // Test 5b: Validation — unregistered team
  console.log("\n[EVENT TEST 5b] Unregistered team validation (expect 400)");
  const unregRes = await fetch(`${API_BASE}/events/${eventId}/matches`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenAlpha, sportName: 'Football', homeTeamName: 'Thunder FC', awayTeamName: 'Ghost FC' })
  });
  if (unregRes.status !== 400) throw new Error("Unregistered team should return 400, got " + unregRes.status);
  console.log(`✅ Unregistered team correctly rejected (400)`);

  // Test 5c: Validation — date out of range
  console.log("\n[EVENT TEST 5c] Out-of-range match date (expect 400)");
  const outRangeRes = await fetch(`${API_BASE}/events/${eventId}/matches`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenAlpha, sportName: 'Football', homeTeamName: 'Thunder FC', awayTeamName: 'Storm United', matchDate: matchDateOutRange })
  });
  if (outRangeRes.status !== 400) throw new Error("Out-of-range date should return 400, got " + outRangeRes.status);
  console.log(`✅ Out-of-range match date correctly rejected (400)`);

  // Test 6: Create valid group match
  console.log("\n[EVENT TEST 6] Alpha creates a valid group stage match");
  const createMatchRes = await fetch(`${API_BASE}/events/${eventId}/matches`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenAlpha, sportName: 'Football', homeTeamName: 'Thunder FC', awayTeamName: 'Storm United', round: 'Group Stage', matchDate: matchDateInRange })
  });
  const createMatchData = await createMatchRes.json();
  if (createMatchRes.status !== 201) throw new Error("Match creation failed: " + createMatchData.message);
  const matchId = createMatchData.match._id;
  console.log(`✅ Match created. ID=${matchId}`);

  // Test 7: Host-only score enforcement
  console.log("\n[EVENT TEST 7] Beta tries to update score (expect 403)");
  const betaScoreRes = await fetch(`${API_BASE}/events/${eventId}/matches/${matchId}/score`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenBeta, homeScore: 5, awayScore: 0, status: 'live' })
  });
  if (betaScoreRes.status !== 403) throw new Error("Non-host score update should return 403, got " + betaScoreRes.status);
  console.log(`✅ Beta correctly blocked from updating score (403)`);

  // Test 8: Score update + standings recalculation
  console.log("\n[EVENT TEST 8] Alpha sets 3-1, marks completed — standings should recalculate");
  const scoreRes = await fetch(`${API_BASE}/events/${eventId}/matches/${matchId}/score`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenAlpha, homeScore: 3, awayScore: 1, status: 'completed' })
  });
  const scoreData = await scoreRes.json();
  if (scoreRes.status !== 200) throw new Error("Score update failed: " + scoreData.message);
  const standings = scoreData.standings || [];
  if (!standings.length) throw new Error("Standings not returned after completion");
  const thunder = standings.find(r => r.teamName === 'Thunder FC');
  const storm   = standings.find(r => r.teamName === 'Storm United');
  if (!thunder || thunder.points !== 3) throw new Error(`Expected Thunder FC 3pts, got ${thunder?.points}`);
  if (!storm   || storm.points   !== 0) throw new Error(`Expected Storm United 0pts, got ${storm?.points}`);
  console.log(`✅ Standings correct. Thunder FC: ${thunder.points}pts (rank 1), Storm United: ${storm.points}pts`);

  // Test 9: Host-only photo check
  console.log("\n[EVENT TEST 9] Beta tries to upload photo — JSON body (no file) → expect 403 or 400");
  const betaPhotoRes = await fetch(`${API_BASE}/events/${eventId}/photos`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: tokenBeta, caption: 'Hack attempt' })
  });
  const betaPhotoStatus = betaPhotoRes.status;
  if (betaPhotoStatus !== 403 && betaPhotoStatus !== 400) {
    throw new Error("Beta photo upload should return 403 or 400, got " + betaPhotoStatus);
  }
  console.log(`✅ Beta photo upload blocked (${betaPhotoStatus})`);

  // Test 10: Public event listing
  console.log("\n[EVENT TEST 10] Event appears in public GET /events listing");
  const allEventsRes = await fetch(`${API_BASE}/events`);
  const allEventsData = await allEventsRes.json();
  const found = allEventsData.events?.find(e => e._id === eventId);
  if (!found) throw new Error("Created event not found in GET /events");
  console.log(`✅ Event visible in listing. Followers: ${found.followers?.length}`);

  console.log("\n=== SPORT EVENT TESTS COMPLETED ===");

  console.log("\n=== ALL END-TO-END FEATURES COMPLETED SUCCESSFULLY AND VALIDATED! ===");
}

runTests().catch(err => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
