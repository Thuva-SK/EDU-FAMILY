import { supabase } from './supabase';

const STORAGE_CACHE_KEY = 'edufamily_visitor_stats_cache';
const VISITOR_ID_KEY = 'edufamily_visitor_uuid';
const SESSION_VISIT_KEY = 'edufamily_session_active';

export const getOrCreateVisitorId = () => {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = `vis_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Clean zero baseline for genuine visitor tracking
export const getInitialBaselineStats = () => {
  const today = getTodayString();
  return {
    total_visits: 0,
    unique_visitors: 0,
    today_visits: 0,
    today_date: today,
    daily_stats: {
      [today]: 0
    },
    page_views: {
      '/': 0,
      '/resources': 0,
      '/events': 0,
      '/announcements': 0,
      '/about': 0,
      '/contact': 0
    },
    last_updated: new Date().toISOString()
  };
};

/**
 * Singleton Realtime WebSocket Channel for Live Visitors Presence & Broadcasts
 */
let liveChannelInstance = null;
const presenceListeners = new Set();
const broadcastListeners = new Set();

export const getLiveChannel = () => {
  if (liveChannelInstance) {
    return liveChannelInstance;
  }

  const visitorId = getOrCreateVisitorId();

  liveChannelInstance = supabase.channel('edufamily-live-visitors', {
    config: {
      presence: { key: visitorId },
      broadcast: { ack: false }
    }
  });

  liveChannelInstance
    .on('presence', { event: 'sync' }, () => {
      const state = liveChannelInstance.presenceState();
      // Count unique presence keys (active users currently on website)
      const count = Object.keys(state).length;
      presenceListeners.forEach(listener => {
        try { listener(count, state); } catch (e) {}
      });
    })
    .on('broadcast', { event: 'visitor_count_updated' }, ({ payload }) => {
      if (payload) {
        // Cache locally immediately
        try {
          localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(payload.stats || payload));
        } catch (e) {}

        broadcastListeners.forEach(listener => {
          try { listener(payload); } catch (e) {}
        });
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        try {
          await liveChannelInstance.track({
            online_at: new Date().toISOString(),
            path: typeof window !== 'undefined' ? window.location.pathname : '/',
            visitor_id: visitorId
          });
        } catch (err) {
          // silent fallback
        }
      }
    });

  return liveChannelInstance;
};

/**
 * Register a listener for real-time live online visitor count changes
 */
export const onLiveVisitorCount = (callback) => {
  presenceListeners.add(callback);
  getLiveChannel(); // ensure channel is initialized

  return () => {
    presenceListeners.delete(callback);
  };
};

/**
 * Register a listener for real-time broadcast visit events
 */
export const onBroadcastVisit = (callback) => {
  broadcastListeners.add(callback);
  getLiveChannel();

  return () => {
    broadcastListeners.delete(callback);
  };
};

/**
 * Fetch visitor stats from Supabase portal_settings table, falling back to local cache
 */
export const getVisitorStats = async () => {
  const today = getTodayString();
  let stats = null;

  try {
    const { data, error } = await supabase
      .from('portal_settings')
      .select('setting_value')
      .eq('setting_key', 'website_visitor_stats')
      .maybeSingle();

    if (data?.setting_value && !error) {
      try {
        stats = typeof data.setting_value === 'string' 
          ? JSON.parse(data.setting_value) 
          : data.setting_value;
      } catch (e) {
        console.warn('Error parsing visitor stats from DB:', e);
      }
    }
  } catch (err) {
    console.warn('Supabase fetch visitor stats error:', err);
  }

  // Fallback to local storage cache if database read failed
  if (!stats) {
    try {
      const cached = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        stats = JSON.parse(cached);
      }
    } catch (e) {
      // ignore
    }
  }

  // If still null, use initial baseline
  if (!stats) {
    stats = getInitialBaselineStats();
  }

  // Normalize today's date rollover
  if (stats.today_date !== today) {
    stats.today_date = today;
    stats.today_visits = 0;
    if (!stats.daily_stats) stats.daily_stats = {};
    if (!stats.daily_stats[today]) stats.daily_stats[today] = 0;
  }

  return stats;
};

// Debounce helper to prevent rapid duplicate calls within milliseconds
let isTracking = false;

/**
 * Tracks a page visit when a user views a route in REAL TIME
 */
export const trackPageView = async (pathname = '/') => {
  // Ensure presence channel is connected
  const channel = getLiveChannel();

  // Never count admin dashboard visits as student visitor traffic
  if (pathname.startsWith('/admin')) {
    return;
  }

  // Update presence current path
  if (channel) {
    try {
      channel.track({
        online_at: new Date().toISOString(),
        path: pathname,
        visitor_id: getOrCreateVisitorId()
      });
    } catch (e) {}
  }

  // Throttle rapid reloads
  if (isTracking) return;
  isTracking = true;
  setTimeout(() => { isTracking = false; }, 1200);

  try {
    const today = getTodayString();
    
    // Check if new unique visitor
    const hadVisitorId = !!localStorage.getItem(VISITOR_ID_KEY);
    getOrCreateVisitorId();
    const isNewUnique = !hadVisitorId;

    // Session check: only increment total visits once per session or route visit
    const sessionKey = `${SESSION_VISIT_KEY}_${pathname}_${today}`;
    sessionStorage.setItem(sessionKey, 'true');

    // Get current stats
    const stats = await getVisitorStats();

    // Increment values
    stats.total_visits = (Number(stats.total_visits) || 0) + 1;
    if (isNewUnique) {
      stats.unique_visitors = (Number(stats.unique_visitors) || 0) + 1;
    }

    // Today counter
    if (stats.today_date === today) {
      stats.today_visits = (Number(stats.today_visits) || 0) + 1;
    } else {
      stats.today_date = today;
      stats.today_visits = 1;
    }

    // Daily breakdown
    if (!stats.daily_stats) stats.daily_stats = {};
    stats.daily_stats[today] = (Number(stats.daily_stats[today]) || 0) + 1;

    // Page view breakdown
    if (!stats.page_views) stats.page_views = {};
    const cleanPath = pathname || '/';
    stats.page_views[cleanPath] = (Number(stats.page_views[cleanPath]) || 0) + 1;
    stats.last_updated = new Date().toISOString();

    // Cache locally immediately
    try {
      localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(stats));
    } catch (e) {}

    // INSTANT REAL-TIME BROADCAST: Send live websocket message to all open admin screens (<50ms)!
    try {
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'visitor_count_updated',
          payload: {
            stats,
            pathname: cleanPath,
            isNewUnique,
            timestamp: new Date().toISOString()
          }
        });
      }
    } catch (broadcastErr) {
      console.warn('Realtime broadcast error:', broadcastErr);
    }

    // Save to Supabase portal_settings for permanent persistence
    try {
      const { data: existing } = await supabase
        .from('portal_settings')
        .select('id')
        .eq('setting_key', 'website_visitor_stats')
        .maybeSingle();

      const payload = {
        setting_key: 'website_visitor_stats',
        setting_value: JSON.stringify(stats),
        updated_at: new Date().toISOString()
      };

      if (existing?.id) {
        await supabase
          .from('portal_settings')
          .update(payload)
          .eq('setting_key', 'website_visitor_stats');
      } else {
        await supabase
          .from('portal_settings')
          .insert([payload]);
      }
    } catch (dbErr) {
      console.warn('Could not persist visitor stats to DB:', dbErr);
    }
  } catch (err) {
    console.warn('Visitor tracking error:', err);
  }
};

/**
 * Super Admin function to reset or set base visitor counts
 */
export const updateVisitorBaseline = async (newStats) => {
  try {
    const updated = {
      ...newStats,
      last_updated: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(updated));

    // Broadcast change in realtime to all admins
    try {
      const channel = getLiveChannel();
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'visitor_count_updated',
          payload: { stats: updated, timestamp: new Date().toISOString() }
        });
      }
    } catch (e) {}

    const { data: existing } = await supabase
      .from('portal_settings')
      .select('id')
      .eq('setting_key', 'website_visitor_stats')
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('portal_settings')
        .update({
          setting_value: JSON.stringify(updated),
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'website_visitor_stats');
    } else {
      await supabase
        .from('portal_settings')
        .insert([{
          setting_key: 'website_visitor_stats',
          setting_value: JSON.stringify(updated)
        }]);
    }
    return true;
  } catch (e) {
    console.error('Failed to update visitor baseline:', e);
    return false;
  }
};

/**
 * Resets visitor counts completely back to 0
 */
export const resetVisitorStatsToZero = async () => {
  const fresh = getInitialBaselineStats();
  return await updateVisitorBaseline(fresh);
};
