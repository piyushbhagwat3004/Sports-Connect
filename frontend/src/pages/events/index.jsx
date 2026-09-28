import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/layout/DashboardLayout';
import { clientServer } from '@/config';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/router';
import styles from './index.module.css';

const SPORTS_LIST = ['Football', 'Cricket', 'Basketball', 'Badminton', 'Tennis', 'Volleyball', 'Hockey', 'Table Tennis'];

export default function EventsPage() {
  const authState = useSelector((s) => s.auth);
  const router = useRouter();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '', description: '', startDate: '', endDate: '',
    sports: [{ sportName: 'Football', advanceCount: 2 }],
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  // Join modal
  const [showJoin, setShowJoin] = useState(false);
  const [joinKey, setJoinKey] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinMsg, setJoinMsg] = useState('');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await clientServer.get('/events');
      setEvents(res.data.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, []);

  const handleCreateSportAdd = () => {
    setCreateForm(f => ({
      ...f,
      sports: [...f.sports, { sportName: 'Cricket', advanceCount: 2 }],
    }));
  };

  const handleCreateSportChange = (i, field, val) => {
    setCreateForm(f => {
      const sports = [...f.sports];
      sports[i] = { ...sports[i], [field]: field === 'advanceCount' ? Number(val) : val };
      return { ...f, sports };
    });
  };

  const handleCreateSportRemove = (i) => {
    setCreateForm(f => ({ ...f, sports: f.sports.filter((_, idx) => idx !== i) }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMsg('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        token,
        name: createForm.name,
        description: createForm.description,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        sports: JSON.stringify(createForm.sports),
      };
      const res = await clientServer.post('/events', payload);
      // BUG FIX 1: redirect host straight to their event page
      setShowCreate(false);
      router.push(`/events/${res.data.event._id}`);
    } catch (err) {
      setCreateMsg('❌ ' + (err.response?.data?.message || err.message));
      setCreateLoading(false);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setJoinLoading(true);
    setJoinMsg('');
    try {
      const token = localStorage.getItem('token');
      const res = await clientServer.post('/events/join', { token, eventKey: joinKey });
      setJoinMsg('✅ Joined! Redirecting…');
      setTimeout(() => {
        router.push(`/events/${res.data.eventId}`);
      }, 800);
    } catch (err) {
      setJoinMsg('❌ ' + (err.response?.data?.message || err.message));
    } finally {
      setJoinLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  const isLoggedIn = !!authState?.user;

  return (
    <DashboardLayout>
      <div className={styles.page}>
        {/* ── Hero Header ─────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.heroIcon}>🏆</div>
            <div>
              <h1 className={styles.heroTitle}>Sport Events</h1>
              <p className={styles.heroSub}>Host tournaments, track live scores, and follow the action</p>
            </div>
          </div>
          {isLoggedIn && (
            <div className={styles.heroActions}>
              <button className={styles.btnJoin} onClick={() => setShowJoin(true)}>
                🔑 Join via Key
              </button>
              <button className={styles.btnCreate} onClick={() => setShowCreate(true)}>
                + Host Event
              </button>
            </div>
          )}
        </div>

        {createMsg && <div className={styles.globalMsg}>{createMsg}</div>}

        {/* ── Events Grid ─────────────────────────────────── */}
        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>Loading events…</p>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>🏟️</span>
            <h3>No events yet</h3>
            <p>Be the first to host a sport event!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {events.map((ev) => (
              <div
                key={ev._id}
                className={styles.card}
                onClick={() => router.push(`/events/${ev._id}`)}
              >
                {ev.coverImage ? (
                  <img
                    className={styles.cardCover}
                    src={`http://localhost:9000/uploads/${ev.coverImage}`}
                    alt={ev.name}
                  />
                ) : (
                  <div className={styles.cardCoverPlaceholder}>
                    <span>🏆</span>
                  </div>
                )}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{ev.name}</h3>
                  <p className={styles.cardDates}>
                    📅 {formatDate(ev.startDate)} — {formatDate(ev.endDate)}
                  </p>
                  <div className={styles.sportChips}>
                    {(ev.sports || []).map((s, i) => (
                      <span key={i} className={styles.chip}>{s.sportName}</span>
                    ))}
                  </div>
                  <div className={styles.cardMeta}>
                    <img
                      className={styles.hostAvatar}
                      src={ev.hostId?.profilePicture
                        ? `http://localhost:9000/uploads/${ev.hostId.profilePicture}`
                        : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ev.hostId?.name || 'H')}
                      alt={ev.hostId?.name}
                    />
                    <span className={styles.hostName}>@{ev.hostId?.username}</span>
                    <span className={styles.followerCount}>👥 {ev.followers?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Create Modal ────────────────────────────────── */}
        {showCreate && (
          <div className={styles.overlay} onClick={() => setShowCreate(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>🏆 Host a New Event</h2>
                <button className={styles.closeBtn} onClick={() => setShowCreate(false)}>✕</button>
              </div>
              <form className={styles.form} onSubmit={handleCreateSubmit}>
                <label>Event Name *</label>
                <input
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Aim-Gold Championship 2025"
                />
                <label>Description</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Tell participants what this event is about…"
                />
                <div className={styles.dateRow}>
                  <div>
                    <label>Start Date *</label>
                    <input
                      type="date" required
                      value={createForm.startDate}
                      onChange={(e) => setCreateForm(f => ({ ...f, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label>End Date *</label>
                    <input
                      type="date" required
                      value={createForm.endDate}
                      onChange={(e) => setCreateForm(f => ({ ...f, endDate: e.target.value }))}
                    />
                  </div>
                </div>

                <label>Sports in this Event</label>
                {createForm.sports.map((s, i) => (
                  <div key={i} className={styles.sportRow}>
                    <select
                      value={s.sportName}
                      onChange={(e) => handleCreateSportChange(i, 'sportName', e.target.value)}
                    >
                      {SPORTS_LIST.map(sp => <option key={sp}>{sp}</option>)}
                    </select>
                    <div className={styles.advanceWrap}>
                      <span>Top</span>
                      <input
                        type="number" min={1} max={32}
                        value={s.advanceCount}
                        onChange={(e) => handleCreateSportChange(i, 'advanceCount', e.target.value)}
                      />
                      <span>advance</span>
                    </div>
                    {createForm.sports.length > 1 && (
                      <button type="button" className={styles.removeBtn} onClick={() => handleCreateSportRemove(i)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" className={styles.addSportBtn} onClick={handleCreateSportAdd}>
                  + Add Another Sport
                </button>

                {createMsg && <p className={styles.formMsg}>{createMsg}</p>}
                <button type="submit" className={styles.submitBtn} disabled={createLoading}>
                  {createLoading ? 'Creating…' : 'Create Event'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── Join Modal ──────────────────────────────────── */}
        {showJoin && (
          <div className={styles.overlay} onClick={() => setShowJoin(false)}>
            <div className={styles.modalSmall} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>🔑 Join Event by Key</h2>
                <button className={styles.closeBtn} onClick={() => setShowJoin(false)}>✕</button>
              </div>
              <form className={styles.form} onSubmit={handleJoin}>
                <label>Event Key</label>
                <input
                  required
                  value={joinKey}
                  onChange={(e) => setJoinKey(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3D4"
                  className={styles.keyInput}
                />
                {joinMsg && <p className={styles.formMsg}>{joinMsg}</p>}
                <button type="submit" className={styles.submitBtn} disabled={joinLoading}>
                  {joinLoading ? 'Joining…' : 'Join Event'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
