import React, { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import { clientServer, BASE_URL } from '@/config';
import { useRouter } from 'next/router';
import styles from './index.module.css';

const TABS           = ['Matches', 'Bracket', 'Standings', 'Players', 'Calendar', 'Photos'];
const ROUND_OPTIONS  = ['Group Stage', 'Round of 16', 'Quarter Final', 'Semi Final', 'Final'];
const KNOCKOUT_ROUNDS = ['Round of 16', 'Quarter Final', 'Semi Final', 'Final'];

const FOOTBALL_PERIODS   = ['1st Half', 'Half Time', '2nd Half', 'Full Time', 'Extra Time', 'Penalties'];
const BASKETBALL_PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'OT'];
const CRICKET_INNINGS    = ['1st Innings', 'Innings Break', '2nd Innings', 'Match Complete'];

/** Detect sport category from a free-text sport name */
function getSportCat(sport) {
  if (!sport) return 'generic';
  const s = sport.toLowerCase();
  if (s.includes('cricket'))                                            return 'cricket';
  if (s.includes('basketball'))                                         return 'basketball';
  if (['badminton','tennis','table tennis','volleyball'].some(x => s.includes(x))) return 'sets';
  if (['football','hockey','futsal','soccer'].some(x => s.includes(x))) return 'football';
  return 'generic';
}

export default function EventDetailPage() {
  const router = useRouter();
  const { eventId } = router.query;

  // Simple helper — always reads current value from localStorage (client-side only)
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '');

  const [event, setEvent]           = useState(null);
  const [isHost, setIsHost]         = useState(false);
  const [isFollower, setIsFollower] = useState(false);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('Matches');
  const [activeSport, setActiveSport] = useState(0);

  const [matches, setMatches] = useState([]);
  const [photos, setPhotos]   = useState([]);

  // ── Host modals ─────────────────────────────────────────────────────────────
  const [showAddTeam, setShowAddTeam]   = useState(false);
  const [showAddMatch, setShowAddMatch] = useState(false);
  // BUG FIX 6: Separate message state per modal
  const [teamMsg,  setTeamMsg]  = useState('');
  const [matchMsg, setMatchMsg] = useState('');

  const [teamForm, setTeamForm] = useState({
    teamName: '', color: '#667eea', players: ''
  });
  const [matchForm, setMatchForm] = useState({
    homeTeamName: '', awayTeamName: '', round: 'Group Stage', matchDate: '', venue: ''
  });

  // ── Score update state ───────────────────────────────────────────────────────
  const [scoreEdits, setScoreEdits] = useState({});
  const [scoreMsg, setScoreMsg]     = useState({});

  // ── Photo upload ─────────────────────────────────────────────────────────────
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoFile, setPhotoFile]       = useState(null);
  const [photoMsg, setPhotoMsg]         = useState('');

  // ── Fetch helpers ────────────────────────────────────────────────────────────
  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    try {
      const tok = getToken();
      const res = await clientServer.get(`/events/${eventId}`, {
        headers: tok ? { 'x-auth-token': tok } : {},
      });
      setEvent(res.data.event);
      setIsHost(res.data.isHost);
      setIsFollower(res.data.isFollower);
    } catch (e) {
      console.error('fetchEvent error:', e);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  const fetchMatches = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await clientServer.get(`/events/${eventId}/matches`);
      setMatches(res.data.matches || []);
    } catch (e) { console.error(e); }
  }, [eventId]);

  const fetchPhotos = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await clientServer.get(`/events/${eventId}/photos`);
      setPhotos(res.data.photos || []);
    } catch (e) { console.error(e); }
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    fetchEvent();
    fetchMatches();
    fetchPhotos();
  }, [eventId, fetchEvent, fetchMatches, fetchPhotos]);

  // Poll matches every 5s on live-data tabs
  useEffect(() => {
    if (!['Matches', 'Bracket', 'Standings'].includes(activeTab)) return;
    const iv = setInterval(fetchMatches, 5000);
    return () => clearInterval(iv);
  }, [activeTab, fetchMatches]);

  // ── Add Team ─────────────────────────────────────────────────────────────────
  const handleAddTeam = async (e) => {
    e.preventDefault();
    setTeamMsg('');
    const sportName = event.sports[activeSport]?.sportName;
    const token = getToken();
    // BUG FIX 7: send players as plain array, not double-encoded string
    const players = teamForm.players
      ? teamForm.players.split(',').map(n => ({ name: n.trim() })).filter(p => p.name)
      : [];
    try {
      await clientServer.post(`/events/${eventId}/teams`, {
        token, sportName,
        teamName: teamForm.teamName,
        color: teamForm.color,
        players, // plain array — axios serializes to JSON
      });
      setTeamMsg('✅ Team added successfully!');
      setTeamForm({ teamName: '', color: '#667eea', players: '' });
      await fetchEvent(); // refresh so Match modal dropdowns show new team
      // Auto-switch to Players tab so host sees the team they just added
      setTimeout(() => {
        setShowAddTeam(false);
        setTeamMsg('');
      }, 1200);
    } catch (err) {
      setTeamMsg('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Add Match ────────────────────────────────────────────────────────────────
  const handleAddMatch = async (e) => {
    e.preventDefault();
    setMatchMsg('');
    const sportName = event.sports[activeSport]?.sportName;
    const token = getToken();
    try {
      await clientServer.post(`/events/${eventId}/matches`, {
        token, sportName, ...matchForm,
      });
      setMatchMsg('✅ Match created!');
      setMatchForm({ homeTeamName: '', awayTeamName: '', round: 'Group Stage', matchDate: '', venue: '' });
      await fetchMatches();
      setTimeout(() => {
        setShowAddMatch(false);
        setMatchMsg('');
      }, 1000);
    } catch (err) {
      setMatchMsg('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  // ── Update score (sport-aware) ────────────────────────────────────────────────
  const handleScoreUpdate = async (matchId, status) => {
    const match = matches.find(m => m._id === matchId);
    if (!match) return;
    const edit      = scoreEdits[matchId] || {};
    const editSD    = edit.scoreDetails || {};
    const matchSD   = match.scoreDetails || {};
    const token     = getToken();
    const cat       = getSportCat(match.sport);
    const period    = edit.period !== undefined ? edit.period : (match.period || '');

    let homeScore, awayScore, scoreDetails;

    if (cat === 'basketball') {
      // Total = sum of all quarter points
      const quarters = editSD.quarters || matchSD.quarters
        || [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }];
      homeScore    = quarters.reduce((s, q) => s + (Number(q.home) || 0), 0);
      awayScore    = quarters.reduce((s, q) => s + (Number(q.away) || 0), 0);
      scoreDetails = { ...matchSD, ...editSD, quarters };
    } else if (cat === 'sets') {
      // Total = sets won
      const sets = editSD.sets || matchSD.sets || [{ home: 0, away: 0 }];
      homeScore    = sets.filter(s => Number(s.home) > Number(s.away)).length;
      awayScore    = sets.filter(s => Number(s.away) > Number(s.home)).length;
      scoreDetails = { ...matchSD, ...editSD, sets };
    } else {
      // Football / Cricket / Generic — direct numeric inputs
      homeScore    = edit.homeScore !== undefined && edit.homeScore !== '' ? Number(edit.homeScore) : match.homeScore;
      awayScore    = edit.awayScore !== undefined && edit.awayScore !== '' ? Number(edit.awayScore) : match.awayScore;
      scoreDetails = { ...matchSD, ...editSD };
    }

    setScoreMsg(prev => ({ ...prev, [matchId]: '' }));
    try {
      await clientServer.post(`/events/${eventId}/matches/${matchId}/score`, {
        token, homeScore, awayScore, status: status || 'live', period, scoreDetails,
      });
      setScoreMsg(prev => ({
        ...prev,
        [matchId]: status === 'completed' ? '✅ Match ended!' : '✅ Score updated!',
      }));
      setScoreEdits(prev => { const n = { ...prev }; delete n[matchId]; return n; });
      fetchMatches();
      fetchEvent();
    } catch (err) {
      setScoreMsg(prev => ({
        ...prev,
        [matchId]: '❌ ' + (err.response?.data?.message || err.message),
      }));
    }
  };

  // ── Upload photo ──────────────────────────────────────────────────────────────
  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    setPhotoMsg('');
    if (!photoFile) { setPhotoMsg('❌ Please select an image'); return; }
    const token = getToken();
    const fd = new FormData();
    fd.append('token', token);
    fd.append('caption', photoCaption);
    fd.append('media', photoFile);
    try {
      await clientServer.post(`/events/${eventId}/photos`, fd);
      setPhotoMsg('✅ Photo uploaded!');
      setPhotoCaption('');
      setPhotoFile(null);
      fetchPhotos();
    } catch (err) {
      setPhotoMsg('❌ ' + (err.response?.data?.message || err.message));
    }
  };

  const handleLikePhoto = async (photoId) => {
    const token = getToken();
    try {
      await clientServer.post(`/events/${eventId}/photos/${photoId}/like`, { token });
      fetchPhotos();
    } catch (e) { console.error(e); }
  };

  const handleJoinEvent = async () => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    // Prompt user for key
    const key = window.prompt('Enter the event key to join:');
    if (!key) return;
    try {
      await clientServer.post('/events/join', { token, eventKey: key.trim().toUpperCase() });
      fetchEvent();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const fmt      = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const fmtDT    = (d) => d ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'TBD';

  // ── Loading / not found ───────────────────────────────────────────────────────
  if (loading) return (
    <DashboardLayout>
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>Loading event…</p>
      </div>
    </DashboardLayout>
  );

  if (!event) return (
    <DashboardLayout>
      <div className={styles.center}>
        <p style={{ color: '#94a3b8' }}>Event not found.</p>
        <button className={styles.actionBtn} onClick={() => router.push('/events')}>← Back to Events</button>
      </div>
    </DashboardLayout>
  );

  const currentSport    = event.sports?.[activeSport];
  const sportMatches    = matches.filter(m => m.sport === currentSport?.sportName);
  const groupMatches    = sportMatches.filter(m => m.round === 'Group Stage');
  const knockoutMatches = sportMatches.filter(m => m.round !== 'Group Stage');

  // Calendar days
  const calendarDays = (() => {
    if (!event.startDate || !event.endDate) return [];
    const days = [];
    const end = new Date(event.endDate);
    for (let d = new Date(event.startDate); d <= end; d.setDate(d.getDate() + 1)) {
      const iso = new Date(d).toISOString().split('T')[0];
      const dayMatches = matches.filter(m =>
        m.matchDate && new Date(m.matchDate).toISOString().split('T')[0] === iso
      );
      days.push({ date: new Date(d), matches: dayMatches });
    }
    return days;
  })();

  const teamsRegistered = (currentSport?.teams?.length || 0) >= 2;
  const hasCoverImg     = !!event.coverImage;

  return (
    <DashboardLayout>
      <div className={styles.page}>

        {/* ── EVENT HEADER ──────────────────────────────────────── */}
        <div className={`${styles.header} ${hasCoverImg ? styles.hasCover : ''}`}>
          {hasCoverImg && (
            <img className={styles.coverImg} src={`${BASE_URL}/uploads/${event.coverImage}`} alt={event.name} />
          )}
          <div className={styles.headerOverlay}>
            <div className={styles.headerContent}>
              <div className={styles.headerLeft}>
                <div className={styles.sportChips}>
                  {event.sports?.map((s, i) => (
                    <span key={i} className={styles.chip}>{s.sportName}</span>
                  ))}
                </div>
                <h1 className={styles.eventTitle}>{event.name}</h1>
                {event.description && <p className={styles.eventDesc}>{event.description}</p>}
                <p className={styles.eventDates}>📅 {fmt(event.startDate)} → {fmt(event.endDate)}</p>
              </div>
              <div className={styles.headerRight}>
                <img
                  className={styles.hostAvatar}
                  src={event.hostId?.profilePicture && event.hostId.profilePicture !== 'default.jpg'
                    ? `${BASE_URL}/uploads/${event.hostId.profilePicture}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(event.hostId?.name || 'H')}&background=6366f1&color=fff`}
                  alt={event.hostId?.name}
                />
                <div>
                  <p className={styles.hostLabel}>Hosted by</p>
                  <p className={styles.hostName}>{event.hostId?.name}</p>
                </div>
                <div className={styles.followerBadge}>
                  👥 {event.followers?.length || 0} <span>followers</span>
                </div>
                {isHost && <span className={styles.hostBadge}>👑 HOST</span>}
              </div>
            </div>

            {/* Event key shown to host */}
            {isHost && (
              <div className={styles.keyBadge}>
                🔑 Event Key: <strong>{event.eventKey}</strong>
                <span className={styles.keyHint}>— share this with participants so they can join</span>
              </div>
            )}

            {/* Join prompt for non-followers */}
            {!isFollower && !isHost && (
              <div className={styles.joinBanner}>
                <span>Have the event key? Join to follow live scores & updates.</span>
                <button className={styles.joinBannerBtn} onClick={handleJoinEvent}>Join Event</button>
              </div>
            )}
          </div>
        </div>

        {/* ── HOST CONTROL PANEL (BUG FIX 4: always visible, not buried in tabs) ── */}
        {isHost && (
          <div className={styles.hostPanel}>
            <div className={styles.hostPanelTitle}>
              <span>🎛️ Host Controls</span>
              <span className={styles.hostPanelSub}>
                {currentSport?.teams?.length || 0} teams · {sportMatches.length} matches
              </span>
            </div>
            <div className={styles.hostPanelActions}>
              <button
                className={styles.hostBtn}
                onClick={() => { setTeamMsg(''); setShowAddTeam(true); }}
              >
                ➕ Add Team
              </button>
              <button
                className={`${styles.hostBtn} ${styles.hostBtnMatch}`}
                onClick={() => {
                  setMatchMsg('');
                  // BUG FIX 5: Warn if no teams yet
                  if (!teamsRegistered) {
                    alert('⚠️ Add at least 2 teams before creating a match!');
                    return;
                  }
                  setShowAddMatch(true);
                }}
              >
                ⚡ Add Match
              </button>
              {sportMatches.length > 0 && (
                <button
                  className={`${styles.hostBtn} ${styles.hostBtnPhoto}`}
                  onClick={() => setActiveTab('Photos')}
                >
                  📸 Upload Photo
                </button>
              )}
            </div>
            {/* Workflow guide */}
            {!currentSport?.teams?.length && (
              <p className={styles.hostGuide}>
                👆 Start by adding teams, then create matches between them, then update scores live.
              </p>
            )}
            {(currentSport?.teams?.length > 0) && !teamsRegistered && (
              <p className={styles.hostGuide}>
                Add at least one more team before creating a match.
              </p>
            )}
          </div>
        )}

        {/* ── SPORT SELECTOR ────────────────────────────────────── */}
        {event.sports?.length > 1 && (
          <div className={styles.sportTabs}>
            {event.sports.map((s, i) => (
              <button
                key={i}
                className={`${styles.sportTab} ${activeSport === i ? styles.sportTabActive : ''}`}
                onClick={() => setActiveSport(i)}
              >
                {s.sportName}
              </button>
            ))}
          </div>
        )}

        {/* ── TAB BAR ───────────────────────────────────────────── */}
        <div className={styles.tabBar}>
          {TABS.map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ══════ TAB: MATCHES ════════════════════════════════════ */}
        {activeTab === 'Matches' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>⚽ {currentSport?.sportName} Matches</h2>

            {sportMatches.length === 0 ? (
              <div className={styles.empty}>
                {isHost
                  ? '⬆ Use "Add Match" in the Host Controls above to schedule your first match.'
                  : 'No matches scheduled yet.'}
              </div>
            ) : (
              <>
                {groupMatches.length > 0 && (
                  <>
                    <h3 className={styles.roundLabel}>Group Stage</h3>
                    {groupMatches.map(m => (
                      <MatchCard
                        key={m._id} m={m} isHost={isHost}
                        scoreEdits={scoreEdits} setScoreEdits={setScoreEdits}
                        handleScoreUpdate={handleScoreUpdate}
                        scoreMsg={scoreMsg[m._id] || ''}
                        fmtDT={fmtDT}
                      />
                    ))}
                  </>
                )}
                {knockoutMatches.length > 0 && (
                  <>
                    <h3 className={styles.roundLabel}>Knockout Rounds</h3>
                    {knockoutMatches.map(m => (
                      <MatchCard
                        key={m._id} m={m} isHost={isHost}
                        scoreEdits={scoreEdits} setScoreEdits={setScoreEdits}
                        handleScoreUpdate={handleScoreUpdate}
                        scoreMsg={scoreMsg[m._id] || ''}
                        fmtDT={fmtDT}
                      />
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ══════ TAB: BRACKET ════════════════════════════════════ */}
        {activeTab === 'Bracket' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>🏆 {currentSport?.sportName} Knockout Bracket</h2>
            {knockoutMatches.length === 0 ? (
              <div className={styles.empty}>
                Bracket will appear once knockout matches are added{isHost ? ' (use Host Controls above)' : ''}.
              </div>
            ) : (
              <div className={styles.bracket}>
                {KNOCKOUT_ROUNDS.map(round => {
                  const rm = knockoutMatches.filter(m => m.round === round);
                  if (!rm.length) return null;
                  return (
                    <div key={round} className={styles.bracketRound}>
                      <h4 className={styles.bracketRoundTitle}>{round}</h4>
                      {rm.map(m => (
                        <div key={m._id} className={`${styles.bracketMatch} ${m.status === 'completed' ? styles.bracketMatchDone : ''}`}>
                          <div className={`${styles.bracketTeam} ${m.winner === m.homeTeam?.name ? styles.bracketWinner : ''}`}>
                            <span className={styles.bracketTeamColor} style={{ background: m.homeTeam?.color }} />
                            <span>{m.homeTeam?.name}</span>
                            <span className={styles.bracketScore}>{m.homeScore}</span>
                          </div>
                          <div className={styles.bracketDivider} />
                          <div className={`${styles.bracketTeam} ${m.winner === m.awayTeam?.name ? styles.bracketWinner : ''}`}>
                            <span className={styles.bracketTeamColor} style={{ background: m.awayTeam?.color }} />
                            <span>{m.awayTeam?.name}</span>
                            <span className={styles.bracketScore}>{m.awayScore}</span>
                          </div>
                          <div className={styles.bracketStatus}>{m.status}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB: STANDINGS ══════════════════════════════════ */}
        {activeTab === 'Standings' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>📊 {currentSport?.sportName} Standings</h2>
            <p className={styles.tieBreakNote}>
              Tie-break: Points → Goal Difference → Goals Scored → Head-to-Head → Alphabetical
            </p>
            {!currentSport?.standings?.length ? (
              <div className={styles.empty}>Standings appear after group stage matches are completed.</div>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th>
                      <th>GF</th><th>GA</th><th>GD</th><th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSport.standings.map((row, i) => (
                      <tr key={row.teamName} className={i < currentSport.advanceCount ? styles.advanceRow : ''}>
                        <td>{i + 1}</td>
                        <td className={styles.teamCell}>
                          <span className={styles.teamDot}
                            style={{ background: currentSport.teams?.find(t => t.name === row.teamName)?.color || '#667eea' }} />
                          {row.teamName}
                          {i < currentSport.advanceCount && <span className={styles.advanceBadge}>↑</span>}
                        </td>
                        <td>{row.played}</td><td>{row.won}</td><td>{row.drawn}</td><td>{row.lost}</td>
                        <td>{row.goalsFor}</td><td>{row.goalsAgainst}</td>
                        <td className={(row.goalsFor - row.goalsAgainst) >= 0 ? styles.gdPos : styles.gdNeg}>
                          {row.goalsFor - row.goalsAgainst > 0 ? '+' : ''}{row.goalsFor - row.goalsAgainst}
                        </td>
                        <td className={styles.ptsCell}>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className={styles.advanceNote}>
                  ↑ Top {currentSport.advanceCount} team{currentSport.advanceCount > 1 ? 's' : ''} advance to knockout
                </p>
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB: PLAYERS ════════════════════════════════════ */}
        {activeTab === 'Players' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>👥 {currentSport?.sportName} — Teams & Rosters</h2>
            {!currentSport?.teams?.length ? (
              <div className={styles.empty}>
                {isHost
                  ? '⬆ Use "Add Team" in Host Controls above to register your first team.'
                  : 'No teams registered yet.'}
              </div>
            ) : (
              <div className={styles.teamGrid}>
                {currentSport.teams.map((team, i) => (
                  <div key={i} className={styles.teamCard}>
                    <div className={styles.teamCardHeader} style={{ background: team.color }}>
                      <span className={styles.teamCardName}>{team.name}</span>
                      <span className={styles.teamPlayerCount}>{team.players?.length || 0} players</span>
                    </div>
                    <div className={styles.teamCardBody}>
                      {team.players?.length ? (
                        <ul className={styles.playerList}>
                          {team.players.map((p, j) => (
                            <li key={j} className={styles.playerItem}>
                              <span className={styles.playerNum}>{j + 1}</span>
                              {p.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.noPlayers}>No players listed</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB: CALENDAR ═══════════════════════════════════ */}
        {activeTab === 'Calendar' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>📅 Event Calendar</h2>
            {calendarDays.length === 0 ? (
              <div className={styles.empty}>No calendar dates defined for this event.</div>
            ) : (
              <div className={styles.calendarGrid}>
                {calendarDays.map((day, i) => (
                  <div key={i} className={`${styles.calDay} ${day.matches.length ? styles.calDayActive : ''}`}>
                    <div className={styles.calDayHeader}>
                      <span className={styles.calDayName}>{day.date.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                      <span className={styles.calDayNum}>{day.date.getDate()}</span>
                      <span className={styles.calDayMonth}>{day.date.toLocaleDateString('en-GB', { month: 'short' })}</span>
                    </div>
                    {day.matches.length > 0 ? day.matches.map((m, j) => (
                      <div key={j} className={styles.calMatch}>
                        <span className={styles.calMatchSport}>{m.sport}</span>
                        <span className={styles.calMatchTeams}>{m.homeTeam?.name} vs {m.awayTeam?.name}</span>
                        {m.status === 'live' && <span className={styles.calLive}>LIVE</span>}
                      </div>
                    )) : (
                      <p className={styles.calNoMatch}>No matches</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ TAB: PHOTOS ═════════════════════════════════════ */}
        {activeTab === 'Photos' && (
          <div className={styles.tabContent}>
            <h2 className={styles.sectionTitle}>📸 Event Photos</h2>

            {isHost && (
              <form className={styles.photoUploadForm} onSubmit={handlePhotoUpload}>
                <label className={styles.photoFileLabel}>
                  {photoFile ? `📎 ${photoFile.name}` : '📎 Choose Photo'}
                  <input type="file" accept="image/*" onChange={e => setPhotoFile(e.target.files[0])} hidden />
                </label>
                <input
                  className={styles.captionInput}
                  placeholder="Caption (optional)…"
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                />
                <button type="submit" className={styles.actionBtn}>Upload</button>
                {photoMsg && <span className={styles.formMsg}>{photoMsg}</span>}
              </form>
            )}

            {photos.length === 0 ? (
              <div className={styles.empty}>
                {isHost ? 'Upload the first event photo above!' : 'No photos shared yet.'}
              </div>
            ) : (
              <div className={styles.photoGrid}>
                {photos.map(photo => (
                  <div key={photo._id} className={styles.photoCard}>
                    <img
                      className={styles.photoImg}
                      src={`${BASE_URL}/uploads/${photo.media}`}
                      alt={photo.caption || 'Event photo'}
                    />
                    {photo.caption && <p className={styles.photoCaption}>{photo.caption}</p>}
                    <div className={styles.photoMeta}>
                      <button className={styles.likeBtn} onClick={() => handleLikePhoto(photo._id)}>
                        ❤️ {photo.likes?.length || 0}
                      </button>
                      <span className={styles.photoDate}>{fmt(photo.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ ADD TEAM MODAL ══════════════════════════════════ */}
        {showAddTeam && (
          <div className={styles.overlay} onClick={() => setShowAddTeam(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>➕ Add Team — {currentSport?.sportName}</h2>
                <button className={styles.closeBtn} onClick={() => setShowAddTeam(false)}>✕</button>
              </div>
              <form className={styles.form} onSubmit={handleAddTeam}>
                <label>Team Name *</label>
                <input
                  required autoFocus
                  value={teamForm.teamName}
                  onChange={e => setTeamForm(f => ({ ...f, teamName: e.target.value }))}
                  placeholder="e.g. Thunder FC"
                />
                <label>Team Color</label>
                <div className={styles.colorRow}>
                  <input
                    type="color"
                    value={teamForm.color}
                    onChange={e => setTeamForm(f => ({ ...f, color: e.target.value }))}
                  />
                  <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Jersey colour shown in bracket and standings
                  </span>
                </div>
                <label>Player Names <small style={{ color: '#64748b', fontWeight: 400 }}>(optional — comma-separated)</small></label>
                <input
                  value={teamForm.players}
                  onChange={e => setTeamForm(f => ({ ...f, players: e.target.value }))}
                  placeholder="Alice, Bob, Charlie, Dave…"
                />
                {teamMsg && <p className={styles.formMsg}>{teamMsg}</p>}
                <button type="submit" className={styles.submitBtn}>Add Team</button>
              </form>
            </div>
          </div>
        )}

        {/* ══════ ADD MATCH MODAL ═════════════════════════════════ */}
        {showAddMatch && currentSport && (
          <div className={styles.overlay} onClick={() => setShowAddMatch(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>⚡ Add Match — {currentSport.sportName}</h2>
                <button className={styles.closeBtn} onClick={() => setShowAddMatch(false)}>✕</button>
              </div>
              <form className={styles.form} onSubmit={handleAddMatch}>
                <label>Home Team *</label>
                <select
                  required
                  value={matchForm.homeTeamName}
                  onChange={e => setMatchForm(f => ({ ...f, homeTeamName: e.target.value }))}
                >
                  <option value="">— select home team —</option>
                  {currentSport.teams?.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>

                <label>Away Team *</label>
                <select
                  required
                  value={matchForm.awayTeamName}
                  onChange={e => setMatchForm(f => ({ ...f, awayTeamName: e.target.value }))}
                >
                  <option value="">— select away team —</option>
                  {currentSport.teams
                    ?.filter(t => t.name !== matchForm.homeTeamName)
                    .map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                </select>

                <label>Round</label>
                <select
                  value={matchForm.round}
                  onChange={e => setMatchForm(f => ({ ...f, round: e.target.value }))}
                >
                  {ROUND_OPTIONS.map(r => <option key={r}>{r}</option>)}
                </select>

                <label>Match Date <small style={{ color: '#64748b', fontWeight: 400 }}>(optional)</small></label>
                <input
                  type="date"
                  value={matchForm.matchDate}
                  min={event.startDate?.split('T')[0]}
                  max={event.endDate?.split('T')[0]}
                  onChange={e => setMatchForm(f => ({ ...f, matchDate: e.target.value }))}
                />

                <label>Venue <small style={{ color: '#64748b', fontWeight: 400 }}>(optional)</small></label>
                <input
                  value={matchForm.venue}
                  onChange={e => setMatchForm(f => ({ ...f, venue: e.target.value }))}
                  placeholder="e.g. Main Ground, Court 1"
                />

                {matchMsg && <p className={styles.formMsg}>{matchMsg}</p>}
                <button type="submit" className={styles.submitBtn}>Create Match</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MATCHCARD — sport-aware display + host editing
// ══════════════════════════════════════════════════════════════════════════════

function MatchCard({ m, isHost, scoreEdits, setScoreEdits, handleScoreUpdate, scoreMsg, fmtDT }) {
  const cat    = getSportCat(m.sport);
  const edit   = scoreEdits[m._id] || {};
  const editSD = edit.scoreDetails || {};
  const matchSD = m.scoreDetails || {};
  const isLive = m.status === 'live';
  const isDone = m.status === 'completed';

  // Helpers to write into scoreEdits
  const setField = (key, val) =>
    setScoreEdits(prev => ({ ...prev, [m._id]: { ...prev[m._id], [key]: val } }));
  const setSD = (key, val) =>
    setScoreEdits(prev => ({
      ...prev,
      [m._id]: { ...prev[m._id], scoreDetails: { ...(prev[m._id]?.scoreDetails || {}), [key]: val } }
    }));

  // Basketball: get quarters from edit or match (default 4 empty quarters)
  const quarters = editSD.quarters || matchSD.quarters
    || [{ home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }, { home: 0, away: 0 }];
  const setQuarter = (idx, side, val) => {
    const q = quarters.map((x, i) => i === idx ? { ...x, [side]: val } : x);
    setSD('quarters', q);
  };

  // Sets sports: get sets from edit or match (default 1 empty set)
  const sets = editSD.sets || matchSD.sets || [{ home: 0, away: 0 }];
  const setSet = (idx, side, val) => {
    const s = sets.map((x, i) => i === idx ? { ...x, [side]: val } : x);
    setSD('sets', s);
  };
  const addSet = () => setSD('sets', [...sets, { home: 0, away: 0 }]);

  const STATUS_COLOR = { scheduled: '#64748b', live: '#22c55e', completed: '#f59e0b' };
  const statusLabel  = isLive ? '🔴 LIVE' : isDone ? '✅ FT' : '🕐 Scheduled';
  const curPeriod    = edit.period !== undefined ? edit.period : (m.period || '');

  return (
    <div className={`${styles.matchCard} ${isLive ? styles.matchCardLive : ''}`}>

      {/* ── Header ── */}
      <div className={styles.matchTop}>
        <span className={styles.matchRound}>{m.round}</span>
        <span className={styles.matchStatus} style={{ color: STATUS_COLOR[m.status] }}>{statusLabel}</span>
        {curPeriod && <span className={styles.periodPill}>{curPeriod}</span>}
        {m.matchDate && <span className={styles.matchDate}>{fmtDT(m.matchDate)}</span>}
        {m.venue && <span className={styles.matchVenue}>📍 {m.venue}</span>}
      </div>

      {/* ── Score body ── */}
      {m.status === 'scheduled' ? (
        <div className={styles.scheduledBody}>
          <span className={styles.teamDot} style={{ background: m.homeTeam?.color }} />
          <span className={styles.matchTeamName}>{m.homeTeam?.name}</span>
          <span className={styles.vsText}>VS</span>
          <span className={styles.matchTeamName}>{m.awayTeam?.name}</span>
          <span className={styles.teamDot} style={{ background: m.awayTeam?.color }} />
        </div>
      ) : cat === 'cricket' ? (
        <CricketDisplay m={m} />
      ) : cat === 'basketball' ? (
        <BasketballDisplay m={m} />
      ) : cat === 'sets' ? (
        <SetsDisplay m={m} />
      ) : (
        /* Football / Generic */
        <FootballDisplay m={m} isLive={isLive} />
      )}

      {/* ── Host score update panel ── */}
      {isHost && !isDone && (
        <div className={styles.scoreUpdatePanel}>
          {cat === 'football' && (
            <FootballEditor m={m} edit={edit} editSD={editSD} matchSD={matchSD}
              curPeriod={curPeriod} setField={setField} setSD={setSD}
              handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} />
          )}
          {cat === 'cricket' && (
            <CricketEditor m={m} edit={edit} editSD={editSD} matchSD={matchSD}
              setField={setField} setSD={setSD}
              handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} />
          )}
          {cat === 'basketball' && (
            <BasketballEditor m={m} edit={edit} editSD={editSD} matchSD={matchSD}
              quarters={quarters} curPeriod={curPeriod}
              setField={setField} setQuarter={setQuarter}
              handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} />
          )}
          {cat === 'sets' && (
            <SetsEditor m={m} sets={sets}
              setSet={setSet} addSet={addSet}
              handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} />
          )}
          {cat === 'generic' && (
            <GenericEditor m={m} edit={edit}
              setField={setField}
              handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} />
          )}
        </div>
      )}

      {/* ── Winner banner ── */}
      {isDone && m.winner && (
        <div className={styles.winnerBanner}>
          🏆 {m.winner === 'draw' ? 'Match drawn' : `Winner: ${m.winner}`}
        </div>
      )}
    </div>
  );
}

// ── Sport Score Displays (read-only) ──────────────────────────────────────────

function FootballDisplay({ m, isLive }) {
  const sd = m.scoreDetails || {};
  return (
    <div className={styles.matchBody}>
      <div className={styles.matchTeam}>
        <span className={styles.teamDot} style={{ background: m.homeTeam?.color }} />
        <span className={`${styles.matchTeamName} ${m.winner === m.homeTeam?.name ? styles.winnerName : ''}`}>
          {m.homeTeam?.name}
        </span>
      </div>
      <div className={styles.scoreDisplay}>
        <span className={`${styles.scoreText} ${isLive ? styles.scoreTextLive : ''}`}>
          {m.homeScore} — {m.awayScore}
        </span>
        {sd.htHomeScore !== undefined && (
          <div className={styles.htBadge}>HT {sd.htHomeScore}–{sd.htAwayScore}</div>
        )}
      </div>
      <div className={`${styles.matchTeam} ${styles.matchTeamRight}`}>
        <span className={`${styles.matchTeamName} ${m.winner === m.awayTeam?.name ? styles.winnerName : ''}`}>
          {m.awayTeam?.name}
        </span>
        <span className={styles.teamDot} style={{ background: m.awayTeam?.color }} />
      </div>
    </div>
  );
}

function CricketDisplay({ m }) {
  const sd = m.scoreDetails || {};
  const homeBatting = sd.battingTeam === 'home';
  const awayBatting = sd.battingTeam === 'away';
  return (
    <div className={styles.cricketDisplay}>
      {sd.innings && <span className={styles.inningsBadge}>{sd.innings}</span>}
      <div className={styles.cricketRow}>
        <div className={styles.cricketTeamInfo}>
          <span className={styles.teamDot} style={{ background: m.homeTeam?.color }} />
          <span className={`${styles.matchTeamName} ${m.winner === m.homeTeam?.name ? styles.winnerName : ''}`}>
            {m.homeTeam?.name}
          </span>
          {homeBatting && <span className={styles.battingPill}>🏏 Batting</span>}
        </div>
        <span className={styles.cricketRuns}>
          {m.homeScore}/{sd.homeWickets ?? 0}
          {sd.homeOvers ? <small> ({sd.homeOvers} ov)</small> : ''}
        </span>
      </div>
      <div className={styles.cricketRow}>
        <div className={styles.cricketTeamInfo}>
          <span className={styles.teamDot} style={{ background: m.awayTeam?.color }} />
          <span className={`${styles.matchTeamName} ${m.winner === m.awayTeam?.name ? styles.winnerName : ''}`}>
            {m.awayTeam?.name}
          </span>
          {awayBatting && <span className={styles.battingPill}>🏏 Batting</span>}
        </div>
        <span className={styles.cricketRuns}>
          {m.awayScore}/{sd.awayWickets ?? 0}
          {sd.awayOvers ? <small> ({sd.awayOvers} ov)</small> : ''}
        </span>
      </div>
    </div>
  );
}

function BasketballDisplay({ m }) {
  const sd = m.scoreDetails || {};
  const qs = sd.quarters || [];
  return (
    <div className={styles.basketballDisplay}>
      {qs.length > 0 && (
        <div className={styles.quartersRow}>
          {qs.map((q, i) => (
            <div key={i} className={styles.qtrCell}>
              <span className={styles.qtrLabel}>Q{i + 1}</span>
              <span className={styles.qtrScore}>{q.home}–{q.away}</span>
            </div>
          ))}
        </div>
      )}
      <div className={styles.matchBody}>
        <div className={styles.matchTeam}>
          <span className={styles.teamDot} style={{ background: m.homeTeam?.color }} />
          <span className={`${styles.matchTeamName} ${m.winner === m.homeTeam?.name ? styles.winnerName : ''}`}>
            {m.homeTeam?.name}
          </span>
        </div>
        <div className={styles.scoreDisplay}>
          <span className={`${styles.scoreText} ${m.status === 'live' ? styles.scoreTextLive : ''}`}>
            {m.homeScore} — {m.awayScore}
          </span>
        </div>
        <div className={`${styles.matchTeam} ${styles.matchTeamRight}`}>
          <span className={`${styles.matchTeamName} ${m.winner === m.awayTeam?.name ? styles.winnerName : ''}`}>
            {m.awayTeam?.name}
          </span>
          <span className={styles.teamDot} style={{ background: m.awayTeam?.color }} />
        </div>
      </div>
    </div>
  );
}

function SetsDisplay({ m }) {
  const sd = m.scoreDetails || {};
  const sets = sd.sets || [];
  return (
    <div className={styles.setsDisplay}>
      <div className={styles.setsHeader}>
        <span className={styles.matchTeamName}>{m.homeTeam?.name}</span>
        <div className={styles.setsCells}>
          {sets.map((s, i) => {
            const hw = Number(s.home) > Number(s.away);
            const aw = Number(s.away) > Number(s.home);
            return (
              <div key={i} className={styles.setCell}>
                <span className={hw ? styles.setWon : styles.setLost}>{s.home}</span>
                <span className={styles.setDash}>–</span>
                <span className={aw ? styles.setWon : styles.setLost}>{s.away}</span>
              </div>
            );
          })}
        </div>
        <span className={styles.matchTeamName}>{m.awayTeam?.name}</span>
      </div>
      <div className={styles.setsTotals}>
        Sets won:
        <strong className={m.winner === m.homeTeam?.name ? styles.winnerName : ''}> {m.homeScore}</strong>
        {' — '}
        <strong className={m.winner === m.awayTeam?.name ? styles.winnerName : ''}>{m.awayScore}</strong>
      </div>
    </div>
  );
}

// ── Sport Score Editors (host-only) ──────────────────────────────────────────

function EditorBtns({ matchId, handleScoreUpdate, scoreMsg, completeLabel = '✅ Full Time' }) {
  return (
    <>
      <div className={styles.scoreUpdateBtns}>
        <button className={styles.liveBtn} onClick={() => handleScoreUpdate(matchId, 'live')}>🔴 Update Live</button>
        <button className={styles.ftBtn}   onClick={() => handleScoreUpdate(matchId, 'completed')}>{completeLabel}</button>
      </div>
      {scoreMsg && <p className={styles.scoreFeedback}>{scoreMsg}</p>}
    </>
  );
}

function FootballEditor({ m, edit, editSD, matchSD, curPeriod, setField, setSD, handleScoreUpdate, scoreMsg }) {
  return (
    <>
      <div className={styles.scoreUpdateLabel}>Update Football Score</div>
      <div className={styles.editorRow}>
        <span className={styles.editorRowLabel}>Period:</span>
        <select className={styles.periodSelect}
          value={curPeriod}
          onChange={e => setField('period', e.target.value)}>
          <option value=''>— select —</option>
          {FOOTBALL_PERIODS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className={styles.scoreInputRow}>
        <div className={styles.scoreInputGroup}>
          <span className={styles.scoreInputTeam}>{m.homeTeam?.name}</span>
          <input type='number' min={0}
            value={edit.homeScore !== undefined ? edit.homeScore : m.homeScore}
            onChange={e => setField('homeScore', e.target.value)} />
        </div>
        <span className={styles.scoreSep}>:</span>
        <div className={styles.scoreInputGroup}>
          <span className={styles.scoreInputTeam}>{m.awayTeam?.name}</span>
          <input type='number' min={0}
            value={edit.awayScore !== undefined ? edit.awayScore : m.awayScore}
            onChange={e => setField('awayScore', e.target.value)} />
        </div>
      </div>
      <div className={styles.editorRow}>
        <span className={styles.editorRowLabel}>Half-Time (opt.):</span>
        <div className={styles.htInputs}>
          <input type='number' min={0} placeholder='HT Home' className={styles.htInput}
            value={editSD.htHomeScore ?? (matchSD.htHomeScore ?? '')}
            onChange={e => setSD('htHomeScore', e.target.value)} />
          <span>—</span>
          <input type='number' min={0} placeholder='HT Away' className={styles.htInput}
            value={editSD.htAwayScore ?? (matchSD.htAwayScore ?? '')}
            onChange={e => setSD('htAwayScore', e.target.value)} />
        </div>
      </div>
      <EditorBtns matchId={m._id} handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} />
    </>
  );
}

function CricketEditor({ m, edit, editSD, matchSD, setField, setSD, handleScoreUpdate, scoreMsg }) {
  return (
    <>
      <div className={styles.scoreUpdateLabel}>Update Cricket Score</div>
      <div className={styles.editorRow}>
        <span className={styles.editorRowLabel}>Innings:</span>
        <select className={styles.periodSelect}
          value={editSD.innings ?? (matchSD.innings || '1st Innings')}
          onChange={e => setSD('innings', e.target.value)}>
          {CRICKET_INNINGS.map(i => <option key={i}>{i}</option>)}
        </select>
      </div>
      <div className={styles.editorRow}>
        <span className={styles.editorRowLabel}>🏏 Batting:</span>
        <select className={styles.periodSelect}
          value={editSD.battingTeam ?? (matchSD.battingTeam || 'home')}
          onChange={e => setSD('battingTeam', e.target.value)}>
          <option value='home'>{m.homeTeam?.name}</option>
          <option value='away'>{m.awayTeam?.name}</option>
        </select>
      </div>
      {/* Home innings */}
      <div className={styles.cricketEditorBlock}>
        <span className={styles.cricketEditorTeam}>
          <span className={styles.teamDot} style={{ background: m.homeTeam?.color }} />
          {m.homeTeam?.name}
        </span>
        <div className={styles.cricketEditorInputs}>
          <div className={styles.cricketEditorField}>
            <label>Runs</label>
            <input type='number' min={0}
              value={edit.homeScore !== undefined ? edit.homeScore : m.homeScore}
              onChange={e => setField('homeScore', e.target.value)} />
          </div>
          <span className={styles.cricketSlash}>/</span>
          <div className={styles.cricketEditorField}>
            <label>Wkts</label>
            <input type='number' min={0} max={10}
              value={editSD.homeWickets ?? (matchSD.homeWickets ?? 0)}
              onChange={e => setSD('homeWickets', e.target.value)} />
          </div>
          <div className={styles.cricketEditorField}>
            <label>Overs</label>
            <input type='text' placeholder='45.2'
              value={editSD.homeOvers ?? (matchSD.homeOvers || '')}
              onChange={e => setSD('homeOvers', e.target.value)} />
          </div>
        </div>
      </div>
      {/* Away innings */}
      <div className={styles.cricketEditorBlock}>
        <span className={styles.cricketEditorTeam}>
          <span className={styles.teamDot} style={{ background: m.awayTeam?.color }} />
          {m.awayTeam?.name}
        </span>
        <div className={styles.cricketEditorInputs}>
          <div className={styles.cricketEditorField}>
            <label>Runs</label>
            <input type='number' min={0}
              value={edit.awayScore !== undefined ? edit.awayScore : m.awayScore}
              onChange={e => setField('awayScore', e.target.value)} />
          </div>
          <span className={styles.cricketSlash}>/</span>
          <div className={styles.cricketEditorField}>
            <label>Wkts</label>
            <input type='number' min={0} max={10}
              value={editSD.awayWickets ?? (matchSD.awayWickets ?? 0)}
              onChange={e => setSD('awayWickets', e.target.value)} />
          </div>
          <div className={styles.cricketEditorField}>
            <label>Overs</label>
            <input type='text' placeholder='38.4'
              value={editSD.awayOvers ?? (matchSD.awayOvers || '')}
              onChange={e => setSD('awayOvers', e.target.value)} />
          </div>
        </div>
      </div>
      <EditorBtns matchId={m._id} handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} completeLabel='✅ Match Complete' />
    </>
  );
}

function BasketballEditor({ m, edit, editSD, matchSD, quarters, curPeriod, setField, setQuarter, handleScoreUpdate, scoreMsg }) {
  const homeTotal = quarters.reduce((s, q) => s + (Number(q.home) || 0), 0);
  const awayTotal = quarters.reduce((s, q) => s + (Number(q.away) || 0), 0);
  return (
    <>
      <div className={styles.scoreUpdateLabel}>Update Basketball Score</div>
      <div className={styles.editorRow}>
        <span className={styles.editorRowLabel}>Period:</span>
        <select className={styles.periodSelect}
          value={curPeriod || 'Q1'}
          onChange={e => setField('period', e.target.value)}>
          {BASKETBALL_PERIODS.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className={styles.quartersEditorGrid}>
        {quarters.map((q, i) => (
          <div key={i} className={styles.qtrEditorCell}>
            <span className={styles.qtrEditorLabel}>Q{i + 1}</span>
            <input type='number' min={0} className={styles.qtrEditorInput}
              value={q.home}
              onChange={e => setQuarter(i, 'home', e.target.value)} />
            <span className={styles.qtrEditorSep}>–</span>
            <input type='number' min={0} className={styles.qtrEditorInput}
              value={q.away}
              onChange={e => setQuarter(i, 'away', e.target.value)} />
          </div>
        ))}
      </div>
      <div className={styles.autoCalcRow}>
        Total (auto-calculated): <strong>{homeTotal}</strong> — <strong>{awayTotal}</strong>
      </div>
      <EditorBtns matchId={m._id} handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} completeLabel='✅ Final Buzzer' />
    </>
  );
}

function SetsEditor({ m, sets, setSet, addSet, handleScoreUpdate, scoreMsg }) {
  const homeWins = sets.filter(s => Number(s.home) > Number(s.away)).length;
  const awayWins = sets.filter(s => Number(s.away) > Number(s.home)).length;
  return (
    <>
      <div className={styles.scoreUpdateLabel}>Update Sets Score</div>
      {sets.map((s, i) => {
        const hw = Number(s.home) > Number(s.away);
        const aw = Number(s.away) > Number(s.home);
        return (
          <div key={i} className={styles.setEditorRow}>
            <span className={styles.setEditorLabel}>Set {i + 1}</span>
            <input type='number' min={0} className={styles.setEditorInput}
              value={s.home} onChange={e => setSet(i, 'home', e.target.value)} />
            <span className={styles.setDash}>–</span>
            <input type='number' min={0} className={styles.setEditorInput}
              value={s.away} onChange={e => setSet(i, 'away', e.target.value)} />
            {hw && <span className={styles.setWinHint}>← {m.homeTeam?.name}</span>}
            {aw && <span className={styles.setWinHint}>{m.awayTeam?.name} →</span>}
          </div>
        );
      })}
      <button className={styles.addSetBtn} onClick={addSet}>＋ Add Set</button>
      <div className={styles.autoCalcRow}>
        Sets won: <strong>{m.homeTeam?.name} {homeWins}</strong> — <strong>{m.awayTeam?.name} {awayWins}</strong>
      </div>
      <EditorBtns matchId={m._id} handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} completeLabel='✅ Match Over' />
    </>
  );
}

function GenericEditor({ m, edit, setField, handleScoreUpdate, scoreMsg }) {
  return (
    <>
      <div className={styles.scoreUpdateLabel}>Update Score</div>
      <div className={styles.scoreInputRow}>
        <div className={styles.scoreInputGroup}>
          <span className={styles.scoreInputTeam}>{m.homeTeam?.name}</span>
          <input type='number' min={0}
            value={edit.homeScore !== undefined ? edit.homeScore : m.homeScore}
            onChange={e => setField('homeScore', e.target.value)} />
        </div>
        <span className={styles.scoreSep}>:</span>
        <div className={styles.scoreInputGroup}>
          <span className={styles.scoreInputTeam}>{m.awayTeam?.name}</span>
          <input type='number' min={0}
            value={edit.awayScore !== undefined ? edit.awayScore : m.awayScore}
            onChange={e => setField('awayScore', e.target.value)} />
        </div>
      </div>
      <EditorBtns matchId={m._id} handleScoreUpdate={handleScoreUpdate} scoreMsg={scoreMsg} />
    </>
  );
}
