import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  BookOpen,
  Calendar,
  Bell,
  Mail,
  Settings,
  Plus,
  Trash2,
  LogOut,
  Key,
  Layers,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Database,
  RefreshCw,
  UploadCloud,
  FileText,
  X,
  Image as ImageIcon,
  Info
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function AdminPage() {
  const { addToast } = useToast();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('edufamily_admin_auth') === 'true';
  });
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Tab state
  const [activeTab, setActiveTab] = useState('resources');

  // Data states
  const [resources, setResources] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  // Modal forms
  const [showResModal, setShowResModal] = useState(false);
  const [newRes, setNewRes] = useState({ title: '', category: 'Notes', link: '', description: '', file_size: '', file_name: '' });
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const [showEvtModal, setShowEvtModal] = useState(false);
  const [newEvt, setNewEvt] = useState({ title: '', date: '', location: 'Zoom Online', description: '', cover_image: '' });
  const [evtCoverFile, setEvtCoverFile] = useState(null);
  const [evtCoverPreview, setEvtCoverPreview] = useState(null);
  const [isUploadingEvt, setIsUploadingEvt] = useState(false);

  const [showAnnModal, setShowAnnModal] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', priority: 'General', audience: 'All Students', description: '' });

  useEffect(() => {
    if (!isAuthenticated) return;

    loadAllAdminData();

    // Setup realtime subscriptions for all admin tables
    const resChannel = supabase
      .channel('admin-realtime-resources')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
        loadAllAdminData();
      })
      .subscribe();

    const evtChannel = supabase
      .channel('admin-realtime-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        loadAllAdminData();
      })
      .subscribe();

    const annChannel = supabase
      .channel('admin-realtime-announcements')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        loadAllAdminData();
      })
      .subscribe();

    const inqChannel = supabase
      .channel('admin-realtime-inquiries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, (payload) => {
        loadAllAdminData();
        if (payload.eventType === 'INSERT') {
          addToast('புதிய மாணவர் செய்தி பெறப்பட்டது! (New inquiry received)', 'info');
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(resChannel);
      supabase.removeChannel(evtChannel);
      supabase.removeChannel(annChannel);
      supabase.removeChannel(inqChannel);
    };
  }, [isAuthenticated]);

  const loadAllAdminData = async () => {
    try {
      const { data: resData } = await supabase.from('resources').select('*').order('id', { ascending: false });
      setResources(resData || []);

      const { data: evtData } = await supabase.from('events').select('*').order('id', { ascending: false });
      if (evtData) {
        setEvents(evtData.map(e => ({
          ...e,
          cover_image: e.cover_image || e.description?.match(/<!--COVER_IMAGE:(.*?)-->/)?.[1] || null
        })));
      } else {
        setEvents([]);
      }

      const { data: annData } = await supabase.from('announcements').select('*').order('id', { ascending: false });
      if (annData) {
        setAnnouncements(annData.map(a => {
          const descMatch = a.title?.match(/<!--DESC:(.*?)-->/);
          return {
            ...a,
            clean_title: a.title?.replace(/<!--DESC:.*?-->/g, '').trim() || a.title,
            description: a.description || (descMatch ? descMatch[1] : '')
          };
        }));
      } else {
        setAnnouncements([]);
      }

      const { data: inqData } = await supabase.from('inquiries').select('*').order('submitted_at', { ascending: false });
      setInquiries(inqData || []);
    } catch (e) {
      setResources([]);
      setEvents([]);
      setAnnouncements([]);
      setInquiries([]);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const email = adminEmail.trim().toLowerCase();
    const pass = adminPassword.trim();

    // Check target credentials
    if (
      (email === 'adminbabi@gmail.com' && pass === 'edufamilyadmin-babi') ||
      (email === 'admin' && (pass === 'edufamilyadmin-babi' || pass === '1234' || pass === 'admin')) ||
      (pass === 'edufamilyadmin-babi')
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('edufamily_admin_auth', 'true');
      sessionStorage.setItem('edufamily_admin_email', email || 'adminbabi@gmail.com');
      addToast('நிர்வாகி அணுகல் அனுமதிக்கப்பட்டது! (Admin Login Successful)', 'success');
      setIsSubmitting(false);
      return;
    }

    // Check supabase users table if configured
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', pass)
        .maybeSingle();

      if (data && !error) {
        setIsAuthenticated(true);
        sessionStorage.setItem('edufamily_admin_auth', 'true');
        sessionStorage.setItem('edufamily_admin_email', data.email);
        addToast('நிர்வாகி அணுகல் அனுமதிக்கப்பட்டது! (Admin Login Successful)', 'success');
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      // fallback
    }

    addToast('தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்! (Invalid Email or Password)', 'error');
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('edufamily_admin_auth');
    sessionStorage.removeItem('edufamily_admin_email');
    setAdminPassword('');
    addToast('வெளியேற்றப்பட்டது (Logged Out)', 'info');
  };

  // Handle PDF file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      addToast('தயவுசெய்து ஒரு PDF ஆவணத்தை மட்டும் தேர்ந்தெடுக்கவும் (Please select a PDF file)', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      addToast('PDF கோப்பின் அளவு 20 MB-க்கு குறைவாக இருக்க வேண்டும் (File size must be under 20MB)', 'error');
      return;
    }

    const sizeInMB = file.size / (1024 * 1024);
    const formattedSize = sizeInMB >= 1
      ? `${sizeInMB.toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    setPdfFile(file);

    const cleanTitle = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ');
    setNewRes(prev => ({
      ...prev,
      title: prev.title || cleanTitle,
      file_name: file.name,
      file_size: formattedSize
    }));
    addToast(`PDF தேர்ந்தெடுக்கப்பட்டது: ${file.name}`, 'info');
  };


  // Add Resource with PDF Upload
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newRes.title.trim()) {
      addToast('தயவுசெய்து தலைப்பை உள்ளிடவும் (Title is required)', 'error');
      return;
    }

    setIsUploadingPdf(true);
    let finalFileUrl = newRes.link?.trim() || '';
    let finalFileName = newRes.file_name || 'Document.pdf';
    let finalFileSize = newRes.file_size || '1.0 MB';
    let storageFilePath = null;

    if (pdfFile) {
      finalFileName = pdfFile.name;
      const sizeInMB = pdfFile.size / (1024 * 1024);
      finalFileSize = sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${Math.round(pdfFile.size / 1024)} KB`;

      let uploadedToStorage = false;
      const cleanName = pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilePath = `${Date.now()}_${cleanName}`;

      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('resources')
          .upload(uniqueFilePath, pdfFile, { cacheControl: '3600', upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('resources').getPublicUrl(uniqueFilePath);
          if (publicUrlData?.publicUrl) {
            finalFileUrl = publicUrlData.publicUrl;
            storageFilePath = uniqueFilePath;
            uploadedToStorage = true;
          }
        } else if (uploadErr) {
          console.warn('Supabase storage upload error:', uploadErr.message);
        }
      } catch (err) {
        console.warn('Supabase storage upload exception:', err);
      }

      if (!uploadedToStorage) {
        // If file is under 2.5MB, convert to Base64 data URL so it can still be saved directly in the database
        if (pdfFile.size <= 2.5 * 1024 * 1024) {
          finalFileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(pdfFile);
          });
          storageFilePath = finalFileName;
        } else if (!finalFileUrl) {
          // File is too large for database row storage without Supabase Storage Bucket
          setIsUploadingPdf(false);
          addToast('Supabase Storage "resources" பக்கெட் கிடைக்கவில்லை. 2.5MB-க்கு அதிகமான கோப்புகளுக்கு Storage பக்கெட் அமைக்கப்பட வேண்டும் அல்லது Google Drive இணைப்பைப் பயன்படுத்தவும்.', 'error');
          return;
        }
      }
    }

    if (!finalFileUrl) {
      finalFileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }

    // Keep file_path safe and under 250 chars so it NEVER violates VARCHAR(500) limit
    const safeFilePath = (storageFilePath || finalFileName || 'document.pdf').slice(0, 250);

    const payload = {
      title: newRes.title.trim(),
      category: newRes.category || 'Notes',
      link: finalFileUrl,
      file_path: safeFilePath,
      file_name: finalFileName,
      file_size: finalFileSize,
      description: newRes.description || '',
      downloads: 0,
      status: 'Published',
      date: new Date().getFullYear().toString()
    };

    try {
      const { data, error } = await supabase.from('resources').insert([payload]).select();
      if (error) {
        console.error('Resource insert error:', error);
        addToast(`தரவுத்தளத்தில் சேமிக்க முடியவில்லை: ${error.message}`, 'error');
        setIsUploadingPdf(false);
        return;
      }

      if (data && data.length > 0) {
        setResources(prev => [data[0], ...prev]);
      }
      setShowResModal(false);
      setPdfFile(null);
      setNewRes({ title: '', category: 'Notes', link: '', description: '', file_size: '', file_name: '' });
      setIsUploadingPdf(false);
      addToast('புதிய கல்வி வளம் வெற்றிகரமாக சேர்க்கப்பட்டது!', 'success');
    } catch (err) {
      console.error(err);
      addToast('சேமிப்பில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.', 'error');
      setIsUploadingPdf(false);
    }
  };

  // Delete Resource
  const handleDeleteResource = async (id) => {
    if (!window.confirm('இந்த கல்வி வளத்தை நிச்சயமாக நீக்க வேண்டுமா?')) return;
    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) {
        addToast(`நீக்குவதில் பிழை: ${error.message}`, 'error');
        return;
      }
      setResources(prev => prev.filter(r => r.id !== id));
      addToast('கல்வி வளம் நீக்கப்பட்டது!', 'info');
    } catch (e) {
      console.error(e);
      addToast('நீக்குவதில் பிழை ஏற்பட்டது', 'error');
    }
  };

  // Handle Event Cover Image selection (optional)
  const handleEventCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('தயவுசெய்து ஒரு படக் கோப்பை மட்டும் தேர்ந்தெடுக்கவும் (Please select an image file)', 'error');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      addToast('படத்தின் அளவு 20 MB-க்கு குறைவாக இருக்க வேண்டும் (Image size must be under 20MB)', 'error');
      return;
    }

    setEvtCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setEvtCoverPreview(previewUrl);
    addToast('கவர் படம் தேர்ந்தெடுக்கப்பட்டது!', 'info');
  };

  // Add Event with optional cover image
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvt.title.trim()) {
      addToast('நிகழ்வு தலைப்பு அவசியம் (Title is required)', 'error');
      return;
    }

    setIsUploadingEvt(true);
    let coverImageUrl = newEvt.cover_image || '';

    if (evtCoverFile) {
      let uploadedToStorage = false;
      try {
        const cleanName = evtCoverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `event_${Date.now()}_${cleanName}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('resources')
          .upload(filePath, evtCoverFile, { cacheControl: '3600', upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('resources').getPublicUrl(filePath);
          if (publicUrlData?.publicUrl) {
            coverImageUrl = publicUrlData.publicUrl;
            uploadedToStorage = true;
          }
        }
      } catch (err) {
        // Fallback
      }

      if (!uploadedToStorage) {
        if (evtCoverFile.size <= 2 * 1024 * 1024) {
          coverImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(evtCoverFile);
          });
        }
      }
    }

    let finalDescription = newEvt.description || '';
    if (coverImageUrl) {
      finalDescription = `${finalDescription}\n\n<!--COVER_IMAGE:${coverImageUrl}-->`.trim();
    }

    const payload = {
      title: newEvt.title.trim(),
      date: newEvt.date || new Date().toLocaleDateString(),
      event_date: new Date().toISOString(),
      location: newEvt.location || 'Zoom Online',
      description: finalDescription,
      registered_count: 0,
      status: 'Upcoming'
    };

    try {
      const { data, error } = await supabase.from('events').insert([payload]).select();
      if (error) {
        console.error(error);
        addToast(`நிகழ்வைச் சேமிப்பதில் பிழை: ${error.message}`, 'error');
        setIsUploadingEvt(false);
        return;
      }
      if (data && data.length > 0) {
        setEvents(prev => [{ ...data[0], cover_image: coverImageUrl }, ...prev]);
      }
      setShowEvtModal(false);
      setEvtCoverFile(null);
      setEvtCoverPreview(null);
      setNewEvt({ title: '', date: '', location: 'Zoom Online', description: '', cover_image: '' });
      setIsUploadingEvt(false);
      addToast('புதிய நிகழ்வு வெற்றிகரமாக சேர்க்கப்பட்டது!', 'success');
    } catch (e) {
      console.error(e);
      addToast('நிகழ்வைச் சேமிப்பதில் பிழை ஏற்பட்டது', 'error');
      setIsUploadingEvt(false);
    }
  };

  // Delete Event
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('இந்த நிகழ்வை நிச்சயமாக நீக்க வேண்டுமா?')) return;
    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) {
        addToast(`நீக்குவதில் பிழை: ${error.message}`, 'error');
        return;
      }
      setEvents(prev => prev.filter(e => e.id !== id));
      addToast('நிகழ்வு நீக்கப்பட்டது!', 'info');
    } catch (e) {
      console.error(e);
      addToast('நீக்குவதில் பிழை ஏற்பட்டது', 'error');
    }
  };

  // Add Announcement
  const handleAddAnnouncement = async (e) => {
    e.preventDefault();
    if (!newAnn.title.trim()) {
      addToast('அறிவிப்பு தலைப்பு அவசியம்', 'error');
      return;
    }

    const rawTitle = newAnn.title.trim();
    const rawDesc = newAnn.description?.trim() || '';

    // Attempt 1: Try standard insert with description column
    const standardPayload = {
      title: rawTitle,
      priority: newAnn.priority || 'General',
      audience: newAnn.audience || 'All Students',
      date: new Date().toLocaleDateString(),
      is_active: true,
      description: rawDesc
    };

    let savedItem = null;
    let insertErr = null;

    try {
      const { data, error } = await supabase.from('announcements').insert([standardPayload]).select();
      if (!error && data && data.length > 0) {
        savedItem = data[0];
      } else if (error) {
        insertErr = error;
      }
    } catch (e) {
      insertErr = e;
    }

    // Attempt 2: If description column does not exist in schema cache, fallback to embedding in title
    if (!savedItem && insertErr && (insertErr.message?.includes('description') || insertErr.code === 'PGRST204')) {
      try {
        const fallbackTitle = rawDesc ? `${rawTitle} <!--DESC:${rawDesc}-->` : rawTitle;
        const fallbackPayload = {
          title: fallbackTitle,
          priority: newAnn.priority || 'General',
          audience: newAnn.audience || 'All Students',
          date: new Date().toLocaleDateString(),
          is_active: true
        };
        const { data, error } = await supabase.from('announcements').insert([fallbackPayload]).select();
        if (!error && data && data.length > 0) {
          savedItem = data[0];
          insertErr = null;
        } else {
          insertErr = error;
        }
      } catch (e) {
        insertErr = e;
      }
    }

    if (insertErr || !savedItem) {
      console.error('Announcement insert error:', insertErr);
      addToast(`அறிவிப்பைச் சேமிப்பதில் பிழை: ${insertErr?.message || 'Error saving'}`, 'error');
      return;
    }

    // Parse clean title and description for immediate state display
    const descMatch = savedItem.title?.match(/<!--DESC:(.*?)-->/);
    const parsedItem = {
      ...savedItem,
      clean_title: savedItem.title?.replace(/<!--DESC:.*?-->/g, '').trim() || savedItem.title,
      description: savedItem.description || (descMatch ? descMatch[1] : rawDesc)
    };

    setAnnouncements(prev => [parsedItem, ...prev]);
    setShowAnnModal(false);
    setNewAnn({ title: '', priority: 'General', audience: 'All Students', description: '' });
    addToast('புதிய அறிவிப்பு வெற்றிகரமாக வெளியிடப்பட்டது!', 'success');
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('இந்த அறிவிப்பை நிச்சயமாக நீக்க வேண்டுமா?')) return;
    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) {
        addToast(`நீக்குவதில் பிழை: ${error.message}`, 'error');
        return;
      }
      setAnnouncements(prev => prev.filter(a => a.id !== id));
      addToast('அறிவிப்பு நீக்கப்பட்டது!', 'info');
    } catch (e) {
      console.error(e);
      addToast('நீக்குவதில் பிழை ஏற்பட்டது', 'error');
    }
  };

  // Delete Inquiry
  const handleDeleteInquiry = async (id) => {
    if (!window.confirm('இந்த மாணவர் செய்தியை நிச்சயமாக நீக்க வேண்டுமா?')) return;
    try {
      const { error } = await supabase.from('inquiries').delete().eq('id', id);
      if (error) {
        addToast(`நீக்குவதில் பிழை: ${error.message}`, 'error');
        return;
      }
      setInquiries(prev => prev.filter(inq => inq.id !== id));
      addToast('மாணவர் செய்தி நீக்கப்பட்டது!', 'info');
    } catch (e) {
      console.error(e);
      addToast('நீக்குவதில் பிழை ஏற்பட்டது', 'error');
    }
  };

  // Toggle Inquiry Status
  const handleToggleInquiryStatus = async (inq) => {
    const nextStatus = inq.status === 'Replied' ? 'Unread' : 'Replied';
    try {
      const { error } = await supabase.from('inquiries').update({ status: nextStatus }).eq('id', inq.id);
      if (error) {
        addToast(`நிலை மாற்றுவதில் பிழை: ${error.message}`, 'error');
        return;
      }
      setInquiries(prev => prev.map(item => item.id === inq.id ? { ...item, status: nextStatus } : item));
      addToast(`செய்தி "${nextStatus}" என மாற்றப்பட்டது!`, 'success');
    } catch (e) {
      console.error(e);
      addToast('பிழை ஏற்பட்டது', 'error');
    }
  };


  // Login Screen
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div
          className="card"
          style={{
            maxWidth: '440px',
            width: '100%',
            padding: '40px 32px',
            borderRadius: '24px',
            boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                margin: '0 auto 16px auto',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(215,25,32,0.25)',
                border: '2px solid rgba(215,25,32,0.3)',
                padding: '2px',
                background: '#fff'
              }}
            >
              <img src="/logo.jpg" alt="Edufamily Logo" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>Edufamily Admin</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              நிர்வாக போர்ட்டலை அணுக உங்கள் விபரங்களை உள்ளிடவும் (Sign in to Admin Portal)
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email Field */}
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                மின்னஞ்சல் (Email Address)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="email"
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 14px 13px 44px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    background: 'var(--bg-card)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(215,25,32,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-main)' }}>
                கடவுச்சொல் (Password)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '13px 44px 13px 44px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border-color)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    background: 'var(--bg-card)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(215,25,32,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'var(--border-color)';
                    e.target.style.boxShadow = 'none';
                  }}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              <Key size={18} />
              <span>{isSubmitting ? 'சரிபார்க்கிறது...' : 'போர்ட்டலில் நுழைக'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page" style={{ padding: '40px 0 80px 0' }}>
      <div className="container">
        {/* Dashboard Header Bar */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 32px', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OFFICIAL ADMIN DASHBOARD</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '3px 10px', borderRadius: '12px', background: '#dcfce7', color: '#166534', fontWeight: 600 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }}></span>
                {sessionStorage.getItem('edufamily_admin_email') || 'adminbabi@gmail.com'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Edufamily நிர்வாகப் பகுதி</h1>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.9rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={16} />
            <span>வெளியேறு (Logout)</span>
          </button>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid-4" style={{ marginBottom: '32px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(215,25,32,0.1)', color: '#d71920', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{resources.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>கல்வி வளங்கள்</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34,197,94,0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{events.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>நிகழ்வுகள்</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{announcements.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>அறிவிப்புகள்</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail size={24} />
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{inquiries.length}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>மாணவர் செய்திகள்</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="filter-bar" style={{ marginBottom: '24px' }}>
          <div className="pills-group">
            <button className={`pill-btn ${activeTab === 'resources' ? 'active' : ''}`} onClick={() => setActiveTab('resources')}>
              Resources ({resources.length})
            </button>
            <button className={`pill-btn ${activeTab === 'events' ? 'active' : ''}`} onClick={() => setActiveTab('events')}>
              Events ({events.length})
            </button>
            <button className={`pill-btn ${activeTab === 'announcements' ? 'active' : ''}`} onClick={() => setActiveTab('announcements')}>
              Announcements ({announcements.length})
            </button>
            <button className={`pill-btn ${activeTab === 'inquiries' ? 'active' : ''}`} onClick={() => setActiveTab('inquiries')}>
              Inquiries ({inquiries.length})
            </button>
          </div>
        </div>

        {/* Tab Content: Resources */}
        {activeTab === 'resources' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>கல்வி வளங்கள் மேலாண்மை</h3>
              <button onClick={() => setShowResModal(true)} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
                <Plus size={16} />
                <span>புதிய வளம் சேர் (Add Resource)</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>தலைப்பு (Title)</th>
                    <th style={{ padding: '12px' }}>பிரிவு (Category)</th>
                    <th style={{ padding: '12px' }}>PDF கோப்பு (File)</th>
                    <th style={{ padding: '12px' }}>Downloads</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>அகற்று (Delete)</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        <p style={{ margin: '0 0 12px 0' }}>தற்போது எந்த கல்வி வளங்களும் சேர்க்கப்படவில்லை.</p>
                        <button className="btn btn-primary" onClick={() => setShowResModal(true)} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                          <Plus size={15} /> புதிய வளம் சேர்
                        </button>
                      </td>
                    </tr>
                  ) : (
                    resources.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{r.title}</td>
                        <td style={{ padding: '12px' }}><span className="category-tag">{r.category}</span></td>
                        <td style={{ padding: '12px' }}>
                          {r.link || r.file_path ? (
                            <a
                              href={r.link || r.file_path}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}
                              title={r.file_name || 'View/Download PDF'}
                            >
                              <FileText size={15} />
                              <span>{r.file_size || 'PDF'}</span>
                            </a>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>{r.downloads || 0}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button onClick={() => handleDeleteResource(r.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="நீக்கு">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Events */}
        {activeTab === 'events' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>கருத்தரங்குகள் மேலாண்மை</h3>
              <button onClick={() => setShowEvtModal(true)} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
                <Plus size={16} />
                <span>புதிய நிகழ்வு சேர் (Add Event)</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>கவர் படம் (Cover)</th>
                    <th style={{ padding: '12px' }}>நிகழ்வு (Event Title)</th>
                    <th style={{ padding: '12px' }}>திகதி (Date)</th>
                    <th style={{ padding: '12px' }}>நிலை (Status)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>அகற்று (Delete)</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        <p style={{ margin: '0 0 12px 0' }}>தற்போது எந்த கருத்தரங்குகளும் திட்டமிடப்படவில்லை.</p>
                        <button className="btn btn-primary" onClick={() => setShowEvtModal(true)} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                          <Plus size={15} /> புதிய நிகழ்வு சேர்
                        </button>
                      </td>
                    </tr>
                  ) : (
                    events.map((e) => {
                      const cover = e.cover_image || e.description?.match(/<!--COVER_IMAGE:(.*?)-->/)?.[1];
                      return (
                        <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px' }}>
                            {cover ? (
                              <a href={cover} target="_blank" rel="noreferrer" title="கவர் படத்தைப் பார்க்க">
                                <img src={cover} alt={e.title} className="admin-event-thumb" />
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>—</span>
                            )}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{e.title}</td>
                          <td style={{ padding: '12px' }}>{e.date}</td>
                          <td style={{ padding: '12px' }}><span className="status-badge status-upcoming">{e.status}</span></td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <button onClick={() => handleDeleteEvent(e.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="நீக்கு">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Announcements */}
        {activeTab === 'announcements' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>அறிவிப்புகள் மேலாண்மை</h3>
              <button onClick={() => setShowAnnModal(true)} className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '0.875rem' }}>
                <Plus size={16} />
                <span>புதிய அறிவிப்பு சேர் (Add Notice)</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>அறிவிப்பு (Notice)</th>
                    <th style={{ padding: '12px' }}>முன்னுரிமை (Priority)</th>
                    <th style={{ padding: '12px' }}>இலக்கு (Audience)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>அகற்று (Delete)</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        <p style={{ margin: '0 0 12px 0' }}>தற்போது எந்த புதிய அறிவிப்புகளும் வெளியிடப்படவில்லை.</p>
                        <button className="btn btn-primary" onClick={() => setShowAnnModal(true)} style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                          <Plus size={15} /> புதிய அறிவிப்பு சேர்
                        </button>
                      </td>
                    </tr>
                  ) : (
                    announcements.map((a) => (
                      <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{a.clean_title || a.title}</td>
                        <td style={{ padding: '12px' }}><span className="status-badge priority-important">{a.priority}</span></td>
                        <td style={{ padding: '12px' }}>{a.audience}</td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button onClick={() => handleDeleteAnnouncement(a.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }} title="நீக்கு">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab Content: Inquiries */}
        {activeTab === 'inquiries' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>மாணவர் கேள்விகள் & செய்திகள்</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  மாணவர்கள் இணையதளத்தின் தொடர்பு படிவம் மூலம் அனுப்பிய கேள்விகள்.
                </p>
              </div>
              <span className="badge-tag" style={{ margin: 0 }}>
                {inquiries.filter(i => i.status !== 'Replied').length} புதிய செய்திகள் (Pending)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {inquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)' }}>
                  <Mail size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>தற்போது எந்த புதிய மாணவர் செய்திகளும் இல்லை.</p>
                </div>
              ) : (
                inquiries.map((inq) => {
                  const isReplied = inq.status === 'Replied';
                  const dateStr = inq.submitted_at
                    ? new Date(inq.submitted_at).toLocaleString()
                    : (inq.date || 'சமீபத்தில்');

                  return (
                    <div
                      key={inq.id}
                      style={{
                        padding: '18px',
                        borderRadius: '14px',
                        background: isReplied ? 'var(--bg-card)' : 'var(--bg-light)',
                        border: `1.5px solid ${isReplied ? 'var(--border-color)' : 'rgba(215, 25, 32, 0.25)'}`,
                        boxShadow: isReplied ? 'none' : '0 4px 12px rgba(215, 25, 32, 0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
                              {inq.student_name || inq.name || 'மாணவர்'}
                            </span>
                            {inq.email && (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                ({inq.email})
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            பெறப்பட்ட நேரம்: {dateStr}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '0.8rem',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              background: isReplied ? '#dcfce7' : '#fef3c7',
                              color: isReplied ? '#15803d' : '#92400e',
                              fontWeight: 700
                            }}
                          >
                            {isReplied ? '✓ பதிலளிக்கப்பட்டது (Replied)' : '• காத்திருக்கிறது (Unread)'}
                          </span>
                        </div>
                      </div>

                      {/* Subject or topic */}
                      {inq.subject && (
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '8px' }}>
                          விடயம்: {inq.subject}
                        </div>
                      )}

                      {/* Message Content */}
                      <div style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.92rem',
                        lineHeight: 1.6,
                        color: 'var(--text-main)',
                        marginBottom: '14px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {inq.message}
                      </div>

                      {/* Action Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {inq.email && (
                            <a
                              href={`mailto:${inq.email}?subject=${encodeURIComponent('Edufamily பதில்: ' + (inq.subject || 'உங்கள் கேள்வி'))}&body=${encodeURIComponent('வணக்கம் ' + (inq.student_name || '') + ',\n\n')}`}
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Mail size={14} />
                              <span>பதிலளி (Email Reply)</span>
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleToggleInquiryStatus(inq)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          >
                            <CheckCircle size={14} color={isReplied ? '#94a3b8' : '#16a34a'} />
                            <span>{isReplied ? 'Mark as Unread' : 'Mark as Replied'}</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteInquiry(inq.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.82rem' }}
                          title="செய்தியை நீக்கு"
                        >
                          <Trash2 size={16} />
                          <span>நீக்கு</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      {showResModal && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>புதிய கல்வி வளம் சேர் (Add Resource)</h3>
              <button
                type="button"
                onClick={() => { setShowResModal(false); setPdfFile(null); }}
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddResource}>
              {/* PDF Upload Dropzone */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
                  PDF ஆவணம் (Upload PDF Document)
                </label>

                {!pdfFile ? (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '24px 16px',
                      border: '2px dashed var(--primary)',
                      borderRadius: '12px',
                      background: 'var(--primary-light)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    <UploadCloud size={32} color="var(--primary)" />
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.95rem' }}>
                        PDF கோப்பைத் தேர்ந்தெடுக்க இங்கே கிளிக் செய்யவும்
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        (Click to browse or drop PDF file • Max: 20MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </label>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: '#f0fdf4',
                      border: '1.5px solid #86efac',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                      <FileText size={24} color="#16a34a" style={{ flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#15803d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {pdfFile.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                          {newRes.file_size || 'PDF'} • பதிவேற்ற தயாராக உள்ளது
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPdfFile(null);
                        setNewRes(prev => ({ ...prev, file_name: '', file_size: '' }));
                      }}
                      className="icon-btn"
                      style={{ width: '28px', height: '28px', color: '#dc2626', background: 'rgba(239,68,68,0.1)' }}
                      title="கோப்பை அகற்று"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  வளத்தின் தலைப்பு (Resource Title) *
                </label>
                <input
                  type="text"
                  placeholder="உதாரணம்: G.C.E O/L Science Past Paper 2023"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={newRes.title}
                  onChange={(e) => setNewRes({ ...newRes, title: e.target.value })}
                  required
                />
              </div>

              {/* Category */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  பிரிவு (Category)
                </label>
                <select
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={newRes.category}
                  onChange={(e) => setNewRes({ ...newRes, category: e.target.value })}
                >
                  <option value="Past Paper">Past Paper (முந்தைய வினாத்தாள்கள்)</option>
                  <option value="Notes">Notes (பாடக் குறிப்புகள்)</option>
                  <option value="GK">GK & Quiz (பொது அறிவு & வினாடி வினா)</option>
                </select>
              </div>

              {/* Optional external link */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  மாற்று இணைய இணைப்பு / Drive Link (விரும்பினால்)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  value={newRes.link}
                  onChange={(e) => setNewRes({ ...newRes, link: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  விளக்கம் (Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="மாணவர்களுக்குப் பயன்படக்கூடிய விபரங்கள்..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', resize: 'vertical' }}
                  value={newRes.description}
                  onChange={(e) => setNewRes({ ...newRes, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowResModal(false); setPdfFile(null); }}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                  disabled={isUploadingPdf}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isUploadingPdf}
                >
                  {isUploadingPdf ? (
                    <span>பதிவேற்றுகிறது...</span>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      <span>பதிவேற்று (Publish Resource)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showEvtModal && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>புதிய கருத்தரங்கு சேர் (Add Event)</h3>
              <button
                type="button"
                onClick={() => { setShowEvtModal(false); setEvtCoverFile(null); setEvtCoverPreview(null); }}
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddEvent}>
              {/* Cover Image Upload (Optional) */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
                  <span>கவர் படம் (Cover Image)</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>விருப்பத்தேர்வு (Optional)</span>
                </label>

                {/* Image Size Guidance Note */}
                <div style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'rgba(215, 25, 32, 0.06)',
                  border: '1px solid rgba(215, 25, 32, 0.18)',
                  marginBottom: '10px',
                  fontSize: '0.8rem',
                  lineHeight: '1.45',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <Info size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '2px' }}>
                      பட அளவு வழிகாட்டல் (Cover Image Size Note):
                    </strong>
                    <span style={{ color: 'var(--text-muted)' }}>
                      • <strong>பரிந்துரைக்கப்பட்ட விகிதம்:</strong> 1200 × 630 px அல்லது 1280 × 720 px (16:9 Landscape)<br />
                      • <strong>அதிகபட்ச கோப்பு அளவு:</strong> 20 MB வரை (JPG, PNG, WebP)
                    </span>
                  </div>
                </div>

                {!evtCoverPreview && !newEvt.cover_image ? (
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '20px 16px',
                      border: '2px dashed var(--border-color)',
                      borderRadius: '12px',
                      background: 'var(--bg-light)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center'
                    }}
                  >
                    <ImageIcon size={30} color="var(--primary)" />
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        கவர் படத்தைப் பதிவேற்ற இங்கே கிளிக் செய்யவும்
                      </span>
                      <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        JPG, PNG, WebP (விருப்பமான அளவு: 1200x630 அல்லது 16:9)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleEventCoverChange}
                    />
                  </label>
                ) : (
                  <div
                    style={{
                      position: 'relative',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      height: '160px',
                      border: '2px solid var(--primary)',
                      background: '#0f172a'
                    }}
                  >
                    <img
                      src={evtCoverPreview || newEvt.cover_image}
                      alt="Cover Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEvtCoverFile(null);
                        setEvtCoverPreview(null);
                        setNewEvt(prev => ({ ...prev, cover_image: '' }));
                      }}
                      className="icon-btn"
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '32px',
                        height: '32px',
                        background: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        backdropFilter: 'blur(4px)'
                      }}
                      title="படத்தை அகற்று"
                    >
                      <X size={16} />
                    </button>
                    <div style={{
                      position: 'absolute',
                      bottom: '8px',
                      left: '12px',
                      background: 'rgba(0,0,0,0.75)',
                      color: '#fff',
                      fontSize: '0.75rem',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      backdropFilter: 'blur(4px)'
                    }}>
                      ✓ கவர் படம் தேர்ந்தெடுக்கப்பட்டது
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Image URL Input */}
              {!evtCoverPreview && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <input
                    type="url"
                    placeholder="அல்லது இணைய பட URL உள்ளிடவும்: https://..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    value={newEvt.cover_image}
                    onChange={(e) => setNewEvt({ ...newEvt, cover_image: e.target.value })}
                  />
                </div>
              )}

              {/* Title */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  நிகழ்வு தலைப்பு (Event Title) *
                </label>
                <input
                  type="text"
                  placeholder="உதாரணம்: G.C.E A/L ICT Seminar & Model Exam"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={newEvt.title}
                  onChange={(e) => setNewEvt({ ...newEvt, title: e.target.value })}
                  required
                />
              </div>

              {/* Date & Time */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  திகதி & நேரம் (Date & Time) *
                </label>
                <input
                  type="text"
                  placeholder="எ.கா: 15 Nov 2024 | 06:30 PM"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={newEvt.date}
                  onChange={(e) => setNewEvt({ ...newEvt, date: e.target.value })}
                  required
                />
              </div>

              {/* Location */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  இடம் / தளம் (Location / Platform)
                </label>
                <input
                  type="text"
                  placeholder="Zoom Online / YouTube Live / Colombo"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={newEvt.location}
                  onChange={(e) => setNewEvt({ ...newEvt, location: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  விளக்கம் (Description)
                </label>
                <textarea
                  rows={3}
                  placeholder="கருத்தரங்கு பற்றிய விரிவான தகவல்கள்..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', resize: 'vertical' }}
                  value={newEvt.description}
                  onChange={(e) => setNewEvt({ ...newEvt, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowEvtModal(false); setEvtCoverFile(null); setEvtCoverPreview(null); }}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                  disabled={isUploadingEvt}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isUploadingEvt}
                >
                  {isUploadingEvt ? (
                    <span>பதிவேற்றுகிறது...</span>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>நிகழ்வைச் சேர் (Add Event)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Announcement Modal */}
      {showAnnModal && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '16px' }}>புதிய அறிவிப்பு சேர்</h3>
            <form onSubmit={handleAddAnnouncement}>
              <div className="form-group">
                <label>அறிவிப்பு தலைப்பு (Notice Title)</label>
                <input type="text" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} value={newAnn.title} onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>முன்னுரிமை (Priority)</label>
                <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} value={newAnn.priority} onChange={(e) => setNewAnn({ ...newAnn, priority: e.target.value })}>
                  <option value="Urgent">Urgent</option>
                  <option value="Important">Important</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="form-group">
                <label>விளக்கம் (Description)</label>
                <textarea style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }} value={newAnn.description} onChange={(e) => setNewAnn({ ...newAnn, description: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowAnnModal(false)} className="btn btn-secondary" style={{ flexGrow: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flexGrow: 1 }}>Publish Notice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
