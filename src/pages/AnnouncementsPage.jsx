import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  Search, 
  Sparkles, 
  Calendar, 
  UserCheck, 
  AlertTriangle, 
  Info, 
  X,
  Megaphone
} from 'lucide-react';
import { supabase, INITIAL_ANNOUNCEMENTS } from '../lib/supabase';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAnnouncement, setActiveAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('id', { ascending: false });

      if (error || !data || data.length === 0) {
        if (!isBackground) setAnnouncements(INITIAL_ANNOUNCEMENTS);
      } else {
        const parsed = data.map((a) => {
          const descMatch = a.title?.match(/<!--DESC:(.*?)-->/);
          return {
            ...a,
            clean_title: a.title?.replace(/<!--DESC:.*?-->/g, '').trim() || a.title,
            description: a.description || (descMatch ? descMatch[1] : '')
          };
        });
        setAnnouncements(parsed);
      }
    } catch (err) {
      if (!isBackground) setAnnouncements(INITIAL_ANNOUNCEMENTS);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const priorityOptions = ['All', 'Urgent', 'Important', 'General'];

  const filteredAnnouncements = announcements.filter((ann) => {
    const matchesPriority = selectedPriority === 'All' || ann.priority?.toLowerCase() === selectedPriority.toLowerCase();
    const title = ann.clean_title || ann.title || '';
    const desc = ann.description || '';
    const matchesSearch = 
      title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ann.audience?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPriority && matchesSearch;
  });

  const getPriorityClass = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'priority-urgent';
      case 'important': return 'priority-important';
      default: return 'priority-general';
    }
  };

  return (
    <div className="announcements-page">
      {/* Header Banner */}
      <section style={{ background: 'radial-gradient(circle at 50% 0%, rgba(215, 25, 32, 0.12) 0%, transparent 60%)', padding: '60px 0 40px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="badge-tag">
            <Sparkles size={16} />
            <span>OFFICIAL NOTICES & NEWS</span>
          </div>
          <h1 className="section-title page-hero-title">
            கல்வி <span style={{ color: '#d71920' }}>அறிவிப்புகள்</span> (Announcements)
          </h1>
          <p className="section-desc">
            Edufamily-யின் புதிய கல்விச் செய்திகள் மற்றும் அறிவிப்புகள் உடனுக்குடன்.
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section style={{ padding: '0 0 60px 0' }}>
        <div className="container">
          <div className="filter-bar">
            {/* Priority Pills */}
            <div className="pills-group">
              {priorityOptions.map((pr) => (
                <button
                  key={pr}
                  className={`pill-btn ${selectedPriority === pr ? 'active' : ''}`}
                  onClick={() => setSelectedPriority(pr)}
                >
                  {pr === 'All' ? 'அனைத்தும் (All)' : pr}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="அறிவிப்புகளைத் தேடுக (Search)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* List Display */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p>அறிவிப்புகள் ஏற்றப்படுகின்றன...</p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <Bell size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto' }} />
              <h3>அறிவிப்புகள் எதுவும் கிடைக்கவில்லை</h3>
              <p style={{ color: 'var(--text-muted)' }}>நீங்கள் தேடிய பிரிவில் தற்சமயம் அறிவிப்புகள் இல்லை.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredAnnouncements.map((ann) => (
                <div 
                  key={ann.id} 
                  className={`card announcement-card ${getPriorityClass(ann.priority)}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setActiveAnnouncement(ann)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={`status-badge ${getPriorityClass(ann.priority)}`}>
                        {ann.priority || 'General'}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-light)', padding: '2px 10px', borderRadius: '12px' }}>
                        {ann.audience || 'All Students'}
                      </span>
                    </div>

                    <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={13} />
                      {ann.date || 'Today'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
                    {ann.clean_title || ann.title}
                  </h3>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {ann.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Announcement Detail Modal */}
      {activeAnnouncement && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card">
            <button 
              onClick={() => setActiveAnnouncement(null)} 
              className="icon-btn" 
              style={{ position: 'absolute', top: '16px', right: '16px' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <span className={`status-badge ${getPriorityClass(activeAnnouncement.priority)}`}>
                {activeAnnouncement.priority} Priority
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', background: 'var(--bg-light)', padding: '4px 12px', borderRadius: '12px' }}>
                {activeAnnouncement.audience}
              </span>
            </div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '16px', lineHeight: '1.3' }}>
              {activeAnnouncement.clean_title || activeAnnouncement.title}
            </h2>

            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.7', marginBottom: '24px', background: 'var(--bg-light)', padding: '20px', borderRadius: '16px' }}>
              {activeAnnouncement.description || 'இந்த அறிவிப்பு தொடர்பான முழுமையான தகவல்களுக்கு Edufamily உத்தியோகபூர்வ வாட்ஸ்அப் சேனலைத் தொடர்ந்து பாருங்கள்.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>அறிவிக்கப்பட்ட திகதி: {activeAnnouncement.date}</span>
              <button 
                onClick={() => setActiveAnnouncement(null)} 
                className="btn btn-secondary" 
                style={{ padding: '8px 20px', fontSize: '0.9rem' }}
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
