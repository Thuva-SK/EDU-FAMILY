import React, { useEffect, useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Search,
  Sparkles,
  X,
  CheckCircle,
  Video
} from 'lucide-react';
import WhatsAppIcon from '../components/WhatsAppIcon';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function EventsPage() {
  const { addToast } = useToast();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEvents();

    const subscription = supabase
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetchEvents(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchEvents = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('id', { ascending: false });

      if (error || !data) {
        if (!isBackground) setEvents([]);
      } else {
        setEvents(data);
      }
    } catch (err) {
      if (!isBackground) setEvents([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const statusOptions = ['All', 'Upcoming', 'Ongoing', 'Completed'];

  const getCoverFromEvent = (evt) => {
    if (!evt) return null;
    if (evt.cover_image) return evt.cover_image;
    if (!evt.description) return null;
    const match = evt.description.match(/<!--COVER_IMAGE:(.*?)-->/);
    return match ? match[1] : null;
  };

  const getCleanDescription = (desc) => {
    if (!desc) return '';
    return desc.replace(/<!--COVER_IMAGE:.*?-->/g, '').trim();
  };

  const filteredEvents = events.filter((evt) => {
    const matchesStatus = selectedStatus === 'All' || evt.status?.toLowerCase() === selectedStatus.toLowerCase();
    const cleanDesc = getCleanDescription(evt.description);
    const matchesSearch =
      evt.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cleanDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getWhatsAppRegisterUrl = (evt) => {
    const message = `வணக்கம்! நான் Edufamily இணையதளம் வழியாக "${evt.title}" (${evt.date || evt.event_date || 'நிகழ்வு'}) கருத்தரங்கில் பதிவு செய்ய / இணைய விரும்புகிறேன்.`;
    return `https://wa.me/94784674025?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="events-page">
      {/* Header Banner */}
      <section style={{ background: 'radial-gradient(circle at 50% 0%, rgba(215, 25, 32, 0.12) 0%, transparent 60%)', padding: '60px 0 40px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="badge-tag">
            <Sparkles size={16} />
            <span>LIVE SEMINARS & WEBINARS</span>
          </div>
          <h1 className="section-title page-hero-title">
            கல்வி <span style={{ color: '#d71920' }}>நிகழ்வுகள்</span> (Events)
          </h1>
          <p className="section-desc">
            நேரலை கருத்தரங்குகள், மாதிரிப் பரீட்சை வழிகாட்டல்கள் மற்றும் ஆன்லைன் கூட்டங்கள்.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section style={{ padding: '0 0 60px 0' }}>
        <div className="container">
          <div className="filter-bar">
            {/* Status Pills */}
            <div className="pills-group">
              {statusOptions.map((st) => (
                <button
                  key={st}
                  className={`pill-btn ${selectedStatus === st ? 'active' : ''}`}
                  onClick={() => setSelectedStatus(st)}
                >
                  {st === 'All' ? 'அனைத்தும் (All)' : st}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="நிகழ்வுகளைத் தேடுக (Search)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Grid Display */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p>நிகழ்வுகள் ஏற்றப்படுகின்றன...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <Calendar size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto' }} />
              <h3>நிகழ்வுகள் எதுவும் கிடைக்கவில்லை</h3>
              <p style={{ color: 'var(--text-muted)' }}>நீங்கள் தேடிய பிரிவில் நிகழ்வுகள் தற்சமயம் இல்லை.</p>
            </div>
          ) : (
            <div className="grid-3">
              {filteredEvents.map((evt) => {
                const cover = getCoverFromEvent(evt);
                const desc = getCleanDescription(evt.description);

                return (
                  <div key={evt.id} className="card event-card">
                    {cover && (
                      <div className="event-cover-banner">
                        <img src={cover} alt={evt.title} loading="lazy" />
                      </div>
                    )}
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <span className={`status-badge ${evt.status === 'Upcoming' ? 'status-upcoming' : 'status-completed'}`}>
                          {evt.status || 'Upcoming'}
                        </span>
                      </div>

                      <div className="event-date-badge">
                        <Calendar size={14} />
                        <span>{evt.date || evt.event_date}</span>
                      </div>

                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '10px', lineHeight: 1.3 }}>
                        {evt.title}
                      </h3>

                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px', lineHeight: 1.5 }}>
                        {desc}
                      </p>

                      <div className="event-location" style={{ marginBottom: '20px' }}>
                        <Video size={16} color="var(--primary)" />
                        <span>{evt.location || 'Zoom Online'}</span>
                      </div>
                    </div>

                    <a
                      href={getWhatsAppRegisterUrl(evt)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        textDecoration: 'none'
                      }}
                    >
                      <WhatsAppIcon size={18} color="#ffffff" />
                      <span>நிகழ்வில் இணைய</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
