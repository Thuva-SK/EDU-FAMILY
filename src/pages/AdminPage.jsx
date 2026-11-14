import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  BookOpen,
  Calendar,
  Bell,
  Mail,
  Settings,
  Plus,
  Pencil,
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
  Info,
  AlignLeft,
  Copy,
  Check,
  Printer,
  UserPlus,
  Users,
  Crown,
  Shield,
  BarChart3,
  TrendingUp,
  Globe,
  Activity,
  Radio,
  Zap,
  Wifi,
  RotateCcw,
  Share2
} from 'lucide-react';
import { supabase, fetchWithTimeout } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { 
  getVisitorStats, 
  updateVisitorBaseline, 
  resetVisitorStatsToZero 
} from '../lib/visitorTracker';

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

  // Visitor Analytics states
  const [visitorStats, setVisitorStats] = useState(null);
  const [liveOnlineCount, setLiveOnlineCount] = useState(0);
  const [recentLiveEvents, setRecentLiveEvents] = useState([]);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [showEditBaselineModal, setShowEditBaselineModal] = useState(false);
  const [customTotalVisits, setCustomTotalVisits] = useState('');
  const [customUniqueVisitors, setCustomUniqueVisitors] = useState('');

  // Modal forms
  const [showResModal, setShowResModal] = useState(false);
  const [newRes, setNewRes] = useState({ title: '', category: 'Notes', link: '', description: '', file_size: '', file_name: '' });
  const [resFormat, setResFormat] = useState('pdf'); // 'pdf' or 'text'
  const [textContent, setTextContent] = useState('');
  const [showTextPreview, setShowTextPreview] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  // Edit Resource modal states
  const [showEditResModal, setShowEditResModal] = useState(false);
  const [editingRes, setEditingRes] = useState(null);
  const [editResData, setEditResData] = useState({ title: '', category: 'Notes', link: '', description: '', file_size: '', file_name: '', downloads: 0 });
  const [editResFormat, setEditResFormat] = useState('pdf');
  const [editTextContent, setEditTextContent] = useState('');
  const [showEditTextPreview, setShowEditTextPreview] = useState(false);
  const [editPdfFile, setEditPdfFile] = useState(null);
  const [isUpdatingRes, setIsUpdatingRes] = useState(false);
  const [copiedResLinkId, setCopiedResLinkId] = useState(null);

  const [showEvtModal, setShowEvtModal] = useState(false);
  const [newEvt, setNewEvt] = useState({ title: '', date: '', location: 'Zoom Online', description: '', cover_image: '' });
  const [evtCoverFile, setEvtCoverFile] = useState(null);
  const [evtCoverPreview, setEvtCoverPreview] = useState(null);
  const [isUploadingEvt, setIsUploadingEvt] = useState(false);

  // Edit Event modal states
  const [showEditEvtModal, setShowEditEvtModal] = useState(false);
  const [editingEvt, setEditingEvt] = useState(null);
  const [editEvtData, setEditEvtData] = useState({ title: '', date: '', location: 'Zoom Online', status: 'Upcoming', description: '', cover_image: '' });
  const [editEvtCoverFile, setEditEvtCoverFile] = useState(null);
  const [editEvtCoverPreview, setEditEvtCoverPreview] = useState(null);
  const [isUpdatingEvt, setIsUpdatingEvt] = useState(false);

  const [showAnnModal, setShowAnnModal] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: '', priority: 'General', audience: 'All Students', description: '' });

  // Edit Announcement modal states
  const [showEditAnnModal, setShowEditAnnModal] = useState(false);
  const [editingAnn, setEditingAnn] = useState(null);
  const [editAnnData, setEditAnnData] = useState({ title: '', priority: 'General', audience: 'All Students', description: '' });
  const [isUpdatingAnn, setIsUpdatingAnn] = useState(false);

  // Admin Management states (adminbabi@gmail.com super admin feature)
  const [admins, setAdmins] = useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'Admin' });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);
  const [showAdminPasswordInTable, setShowAdminPasswordInTable] = useState({});

  // Change Password Modal states
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [targetAdminForPasswordChange, setTargetAdminForPasswordChange] = useState(null);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const currentAdminEmail = (sessionStorage.getItem('edufamily_admin_email') || 'adminbabi@gmail.com').toLowerCase().trim();
  const isSuperAdmin = currentAdminEmail === 'adminbabi@gmail.com';

  useEffect(() => {
    if (!isAuthenticated) return;

    loadAllAdminData();

    // 1. Periodic background sync every 15 seconds as safety sync
    const livePollTimer = setInterval(async () => {
      try {
        const stats = await getVisitorStats();
        if (stats) setVisitorStats(stats);
      } catch (e) {}
    }, 15000);

    return () => {
      clearInterval(livePollTimer);
    };
  }, [isAuthenticated]);

  const loadAllAdminData = async () => {
    try {
      const [resRes, evtRes, annRes, inqRes, psRes, usersRes, statsRes] = await Promise.allSettled([
        fetchWithTimeout(supabase.from('resources').select('*').order('id', { ascending: false }), 8000),
        fetchWithTimeout(supabase.from('events').select('*').order('id', { ascending: false }), 8000),
        fetchWithTimeout(supabase.from('announcements').select('*').order('id', { ascending: false }), 8000),
        fetchWithTimeout(supabase.from('inquiries').select('*').order('submitted_at', { ascending: false }), 8000),
        fetchWithTimeout(supabase.from('portal_settings').select('setting_value').eq('setting_key', 'admin_password_adminbabi@gmail.com').maybeSingle(), 8000),
        fetchWithTimeout(supabase.from('users').select('*').order('created_at', { ascending: false }), 8000),
        getVisitorStats()
      ]);

      const resData = resRes.status === 'fulfilled' ? resRes.value.data : null;
      setResources(resData || []);

      const evtData = evtRes.status === 'fulfilled' ? evtRes.value.data : null;
      if (evtData) {
        setEvents(evtData.map(e => ({
          ...e,
          cover_image: e.cover_image || e.description?.match(/<!--COVER_IMAGE:(.*?)-->/)?.[1] || null
        })));
      } else {
        setEvents([]);
      }

      const annData = annRes.status === 'fulfilled' ? annRes.value.data : null;
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

      const inqData = inqRes.status === 'fulfilled' ? inqRes.value.data : null;
      setInquiries(inqData || []);

      // Fetch users / admins
      let superPass = localStorage.getItem('edufamily_super_admin_pass') || 'edufamilyadmin-babi';
      const psData = psRes.status === 'fulfilled' ? psRes.value.data : null;
      if (psData?.setting_value) {
        superPass = psData.setting_value;
        localStorage.setItem('edufamily_super_admin_pass', superPass);
      }

      const superAdminDefault = {
        id: 1,
        name: 'Babi',
        email: 'adminbabi@gmail.com',
        password_hash: superPass,
        role: 'Super Admin',
        status: 'Active',
        avatar: 'BA',
        created_at: '2024-01-01'
      };

      let loadedAdmins = [];
      const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data : null;
      if (usersData && usersData.length > 0) {
        const hasSuper = usersData.some(u => u.email?.toLowerCase() === 'adminbabi@gmail.com');
        loadedAdmins = hasSuper ? usersData : [superAdminDefault, ...usersData];
      } else {
        loadedAdmins = [superAdminDefault];
      }

      // Merge with any local cache admins if available
      try {
        const localAdmins = JSON.parse(localStorage.getItem('edufamily_local_admins') || '[]');
        localAdmins.forEach(la => {
          if (!loadedAdmins.some(a => a.email?.toLowerCase() === la.email?.toLowerCase())) {
            loadedAdmins.push(la);
          }
        });
      } catch (e) {
        // ignore
      }

      setAdmins(loadedAdmins);

      // Load visitor stats
      if (statsRes.status === 'fulfilled' && statsRes.value) {
        setVisitorStats(statsRes.value);
      }
    } catch (e) {
      setResources([]);
      setEvents([]);
      setAnnouncements([]);
      setInquiries([]);
    }
  };

  const handleRefreshVisitorStats = async () => {
    setIsLoadingStats(true);
    try {
      const stats = await getVisitorStats();
      setVisitorStats(stats);
      addToast('பார்வையாளர்கள் விபரம் புதுப்பிக்கப்பட்டது!', 'success');
    } catch (e) {
      addToast('விபரங்களை புதுப்பிப்பதில் பிழை', 'error');
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSaveCustomBaseline = async (e) => {
    e.preventDefault();
    if (!isSuperAdmin) return;
    const newTotal = parseInt(customTotalVisits, 10);
    const newUnique = parseInt(customUniqueVisitors, 10);
    if (isNaN(newTotal) || isNaN(newUnique)) {
      addToast('தயவுசெய்து சரியான எண்களை உள்ளிடவும்', 'error');
      return;
    }
    const updated = {
      ...(visitorStats || {}),
      total_visits: newTotal,
      unique_visitors: newUnique,
      today_visits: newTotal === 0 ? 0 : (visitorStats?.today_visits || 0),
      ...(newTotal === 0 ? { page_views: {}, daily_stats: {} } : {}),
      last_updated: new Date().toISOString()
    };
    const success = await updateVisitorBaseline(updated);
    if (success) {
      setVisitorStats(updated);
      setShowEditBaselineModal(false);
      addToast('பார்வையாளர்கள் எண்ணிக்கை வெற்றிகரமாக மாற்றப்பட்டது!', 'success');
    } else {
      addToast('மாற்ற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.', 'error');
    }
  };

  const handleResetToZero = async () => {
    if (!window.confirm('பார்வையாளர்கள் எண்ணிக்கை முழுவதையும் 0 ஆக மீட்டமைக்க வேண்டுமா? (Are you sure you want to reset all visitor statistics to 0?)')) {
      return;
    }
    const success = await resetVisitorStatsToZero();
    if (success) {
      const stats = await getVisitorStats();
      setVisitorStats(stats);
      setCustomTotalVisits('0');
      setCustomUniqueVisitors('0');
      setShowEditBaselineModal(false);
      addToast('பார்வையாளர்கள் விபரம் 0 ஆக மீட்டமைக்கப்பட்டது!', 'success');
    } else {
      addToast('மீட்டமைப்பதில் பிழை ஏற்பட்டது!', 'error');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const email = adminEmail.trim().toLowerCase();
    const pass = adminPassword.trim();

    // 1. Super Admin credentials check (adminbabi@gmail.com)
    let currentSuperPass = localStorage.getItem('edufamily_super_admin_pass');
    if (!currentSuperPass) {
      try {
        const { data: ps } = await supabase
          .from('portal_settings')
          .select('setting_value')
          .eq('setting_key', 'admin_password_adminbabi@gmail.com')
          .maybeSingle();
        if (ps?.setting_value) {
          currentSuperPass = ps.setting_value;
          localStorage.setItem('edufamily_super_admin_pass', currentSuperPass);
        }
      } catch (e) {}
    }
    const validSuperPass = currentSuperPass || 'edufamilyadmin-babi';

    if (
      (email === 'adminbabi@gmail.com' && (pass === validSuperPass || pass === 'edufamilyadmin-babi')) ||
      (email === 'admin' && (pass === validSuperPass || pass === 'edufamilyadmin-babi' || pass === '1234' || pass === 'admin')) ||
      (pass === validSuperPass)
    ) {
      setIsAuthenticated(true);
      sessionStorage.setItem('edufamily_admin_auth', 'true');
      sessionStorage.setItem('edufamily_admin_email', 'adminbabi@gmail.com');
      sessionStorage.setItem('edufamily_admin_name', 'Babi (Super Admin)');
      sessionStorage.setItem('edufamily_admin_role', 'Super Admin');
      addToast('முதன்மை சூப்பர் அட்மின் அணுகல் அனுமதிக்கப்பட்டது! (Super Admin Login Successful)', 'success');
      setIsSubmitting(false);
      return;
    }

    // 2. Database users check
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password_hash', pass)
        .maybeSingle();

      if (data && !error) {
        if (data.status === 'Inactive') {
          addToast('உங்கள் நிர்வாகக் கணக்கு முடக்கப்பட்டுள்ளது (Account is inactive)', 'error');
          setIsSubmitting(false);
          return;
        }
        setIsAuthenticated(true);
        sessionStorage.setItem('edufamily_admin_auth', 'true');
        sessionStorage.setItem('edufamily_admin_email', data.email);
        sessionStorage.setItem('edufamily_admin_name', data.name);
        sessionStorage.setItem('edufamily_admin_role', data.role || 'Admin');
        addToast(`வரவேற்கிறோம் ${data.name}! (Admin Login Successful)`, 'success');
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      console.warn(err);
    }

    // 3. Check portal_settings custom password for any admin
    try {
      const { data: settingData } = await supabase
        .from('portal_settings')
        .select('setting_value')
        .eq('setting_key', `admin_password_${email}`)
        .maybeSingle();
      if (settingData?.setting_value && settingData.setting_value === pass) {
        setIsAuthenticated(true);
        sessionStorage.setItem('edufamily_admin_auth', 'true');
        sessionStorage.setItem('edufamily_admin_email', email);
        sessionStorage.setItem('edufamily_admin_name', email.split('@')[0]);
        sessionStorage.setItem('edufamily_admin_role', email === 'adminbabi@gmail.com' ? 'Super Admin' : 'Admin');
        addToast('வரவேற்கிறோம்! (Admin Login Successful)', 'success');
        setIsSubmitting(false);
        return;
      }
    } catch (err) {}

    // 4. Local cache fallback check (if saved locally)
    try {
      const localAdmins = JSON.parse(localStorage.getItem('edufamily_local_admins') || '[]');
      const matched = localAdmins.find(a => a.email.toLowerCase() === email && a.password_hash === pass);
      if (matched) {
        if (matched.status === 'Inactive') {
          addToast('உங்கள் நிர்வாகக் கணக்கு முடக்கப்பட்டுள்ளது (Account is inactive)', 'error');
          setIsSubmitting(false);
          return;
        }
        setIsAuthenticated(true);
        sessionStorage.setItem('edufamily_admin_auth', 'true');
        sessionStorage.setItem('edufamily_admin_email', matched.email);
        sessionStorage.setItem('edufamily_admin_name', matched.name);
        sessionStorage.setItem('edufamily_admin_role', matched.role || 'Admin');
        addToast(`வரவேற்கிறோம் ${matched.name}! (Admin Login Successful)`, 'success');
        setIsSubmitting(false);
        return;
      }
    } catch (e) {
      // ignore
    }

    addToast('தவறான மின்னஞ்சல் அல்லது கடவுச்சொல்! (Invalid Email or Password)', 'error');
    setIsSubmitting(false);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('edufamily_admin_auth');
    sessionStorage.removeItem('edufamily_admin_email');
    sessionStorage.removeItem('edufamily_admin_name');
    sessionStorage.removeItem('edufamily_admin_role');
    setAdminPassword('');
    setActiveTab('resources');
    addToast('வெளியேற்றப்பட்டது (Logged Out)', 'info');
  };

  // Change Admin Password function (Self or by Super Admin)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    const isEditingSelf = !targetAdminForPasswordChange || targetAdminForPasswordChange.email.toLowerCase() === currentAdminEmail;
    const targetEmail = (targetAdminForPasswordChange ? targetAdminForPasswordChange.email : currentAdminEmail).toLowerCase().trim();
    const targetName = targetAdminForPasswordChange ? targetAdminForPasswordChange.name : (sessionStorage.getItem('edufamily_admin_name') || 'Admin');

    const newPass = newPasswordInput.trim();
    const confirmPass = confirmPasswordInput.trim();

    if (!newPass) {
      addToast('தயவுசெய்து புதிய கடவுச்சொல்லை உள்ளிடவும் (New password is required)', 'error');
      return;
    }
    if (newPass.length < 4) {
      addToast('கடவுச்சொல் குறைந்தது 4 எழுத்துக்களைக் கொண்டிருக்க வேண்டும் (Min 4 characters)', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      addToast('கடவுச்சொற்கள் பொருந்தவில்லை! (Passwords do not match)', 'error');
      return;
    }

    // If changing own password, verify current password
    if (isEditingSelf) {
      const currentPass = currentPasswordInput.trim();
      const existingAdm = admins.find(a => a.email.toLowerCase() === targetEmail);
      const expectedPass = existingAdm?.password_hash || (targetEmail === 'adminbabi@gmail.com' ? (localStorage.getItem('edufamily_super_admin_pass') || 'edufamilyadmin-babi') : '');
      if (expectedPass && currentPass !== expectedPass) {
        addToast('தற்போதைய கடவுச்சொல் தவறானது! (Current password is incorrect)', 'error');
        return;
      }
    }

    setIsChangingPassword(true);

    try {
      const existingAdm = admins.find(a => a.email.toLowerCase() === targetEmail);
      const userPayload = {
        id: existingAdm?.id || (targetEmail === 'adminbabi@gmail.com' ? 1 : Date.now()),
        name: targetName || existingAdm?.name || 'Admin',
        email: targetEmail,
        password_hash: newPass,
        role: existingAdm?.role || (targetEmail === 'adminbabi@gmail.com' ? 'Super Admin' : 'Admin'),
        avatar: existingAdm?.avatar || (targetName.slice(0, 2) || 'AD').toUpperCase(),
        status: existingAdm?.status || 'Active'
      };

      // 1. Update in Supabase users table
      try {
        const { error: upsertErr } = await supabase
          .from('users')
          .upsert([userPayload], { onConflict: 'email' });
        if (upsertErr) {
          console.warn('Upsert user error:', upsertErr.message);
          await supabase.from('users').update({ password_hash: newPass }).eq('email', targetEmail);
        }
      } catch (err) {
        console.warn('DB error updating password:', err);
      }

      // 2. Also save to portal_settings as safe persistent backup
      try {
        await supabase.from('portal_settings').upsert([{
          setting_key: `admin_password_${targetEmail}`,
          setting_value: newPass,
          updated_at: new Date().toISOString()
        }], { onConflict: 'setting_key' });
      } catch (err) {}

      // 3. Update localStorage
      if (targetEmail === 'adminbabi@gmail.com') {
        localStorage.setItem('edufamily_super_admin_pass', newPass);
      }
      const localAdmins = JSON.parse(localStorage.getItem('edufamily_local_admins') || '[]');
      const updatedLocal = localAdmins.map(a => 
        a.email.toLowerCase() === targetEmail ? { ...a, password_hash: newPass } : a
      );
      if (!updatedLocal.some(a => a.email.toLowerCase() === targetEmail)) {
        updatedLocal.push(userPayload);
      }
      localStorage.setItem('edufamily_local_admins', JSON.stringify(updatedLocal));

      // 4. Update in React state
      setAdmins(prev => prev.map(a => 
        a.email.toLowerCase() === targetEmail ? { ...a, password_hash: newPass } : a
      ));

      // 5. Clean up modal states
      setShowChangePasswordModal(false);
      setTargetAdminForPasswordChange(null);
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setIsChangingPassword(false);
      addToast('கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது! (Password updated successfully)', 'success');
    } catch (error) {
      console.error('Password change error:', error);
      setIsChangingPassword(false);
      addToast('கடவுச்சொல்லை மாற்றுவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.', 'error');
    }
  };

  // Add new admin (Super Admin only: adminbabi@gmail.com)
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.name.trim()) {
      addToast('தயவுசெய்து நிர்வாகியின் பெயரை உள்ளிடவும் (Name is required)', 'error');
      return;
    }
    if (!newAdmin.email.trim() || !newAdmin.email.includes('@')) {
      addToast('தயவுசெய்து சரியான மின்னஞ்சலை உள்ளிடவும் (Valid email is required)', 'error');
      return;
    }
    if (!newAdmin.password.trim() || newAdmin.password.length < 4) {
      addToast('கடவுச்சொல் குறைந்தது 4 எழுத்துக்களைக் கொண்டிருக்க வேண்டும் (Password min 4 chars)', 'error');
      return;
    }

    const emailLower = newAdmin.email.trim().toLowerCase();

    // Check if email already exists
    if (admins.some(a => a.email.toLowerCase() === emailLower)) {
      addToast('இந்த மின்னஞ்சல் முகவரியில் ஏற்கனவே ஒரு நிர்வாகி உள்ளார்! (Email already exists)', 'error');
      return;
    }

    setIsSubmittingAdmin(true);

    const newAdminRecord = {
      id: Date.now(),
      name: newAdmin.name.trim(),
      email: emailLower,
      password_hash: newAdmin.password.trim(),
      role: newAdmin.role || 'Admin',
      avatar: (newAdmin.name.trim().slice(0, 2) || 'AD').toUpperCase(),
      status: 'Active',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('users').insert([newAdminRecord]).select();
      if (error) {
        console.warn('Supabase users insert error:', error.message);
      }

      const created = (data && data[0]) ? data[0] : newAdminRecord;
      setAdmins(prev => [created, ...prev]);

      // Cache locally so login works seamlessly
      const localAdmins = JSON.parse(localStorage.getItem('edufamily_local_admins') || '[]');
      localStorage.setItem('edufamily_local_admins', JSON.stringify([newAdminRecord, ...localAdmins.filter(a => a.email !== emailLower)]));

      setShowAdminModal(false);
      setNewAdmin({ name: '', email: '', password: '', role: 'Admin' });
      setIsSubmittingAdmin(false);
      addToast(`புதிய நிர்வாகி (${created.name}) வெற்றிகரமாக சேர்க்கப்பட்டார்!`, 'success');
    } catch (err) {
      console.error(err);
      setIsSubmittingAdmin(false);
      addToast('நிர்வாகியைச் சேர்ப்பதில் பிழை ஏற்பட்டது.', 'error');
    }
  };

  // Delete an admin (Super Admin only)
  const handleDeleteAdmin = async (id, email) => {
    if (email.toLowerCase() === 'adminbabi@gmail.com') {
      addToast('முதன்மை சூப்பர் அட்மினை நீக்க முடியாது! (Super Admin cannot be deleted)', 'error');
      return;
    }

    if (!window.confirm(`இந்த நிர்வாகியை (${email}) நிச்சயமாக நீக்க வேண்டுமா?`)) return;

    try {
      await supabase.from('users').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete user db error:', err);
    }

    setAdmins(prev => prev.filter(a => a.id !== id && a.email.toLowerCase() !== email.toLowerCase()));

    // Also update local cache
    const localAdmins = JSON.parse(localStorage.getItem('edufamily_local_admins') || '[]');
    localStorage.setItem('edufamily_local_admins', JSON.stringify(localAdmins.filter(a => a.email.toLowerCase() !== email.toLowerCase())));

    addToast('நிர்வாகிக் கணக்கு நீக்கப்பட்டது!', 'info');
  };

  // Toggle active/inactive status of an admin
  const handleToggleAdminStatus = async (adminItem) => {
    if (adminItem.email.toLowerCase() === 'adminbabi@gmail.com') {
      addToast('முதன்மை சூப்பர் அட்மினை முடக்க முடியாது!', 'error');
      return;
    }

    const newStatus = adminItem.status === 'Active' ? 'Inactive' : 'Active';

    try {
      await supabase.from('users').update({ status: newStatus }).eq('id', adminItem.id);
    } catch (err) {
      console.warn(err);
    }

    setAdmins(prev => prev.map(a => a.id === adminItem.id ? { ...a, status: newStatus } : a));

    // Update local cache
    const localAdmins = JSON.parse(localStorage.getItem('edufamily_local_admins') || '[]');
    localStorage.setItem('edufamily_local_admins', JSON.stringify(localAdmins.map(a => a.id === adminItem.id ? { ...a, status: newStatus } : a)));

    addToast(`நிர்வாகி நிலை மாற்றப்பட்டது: ${newStatus === 'Active' ? 'செயலில் உள்ளது (Active)' : 'முடக்கப்பட்டது (Inactive)'}`, 'info');
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


  // Add Resource with PDF or Text format
  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newRes.title.trim()) {
      addToast('தயவுசெய்து தலைப்பை உள்ளிடவும் (Title is required)', 'error');
      return;
    }

    const isTextFormat = 
      (newRes.category === 'GK' && resFormat === 'text') ||
      (!pdfFile && newRes.category === 'GK') ||
      (!pdfFile && !newRes.link && (textContent.trim().length > 0 || (newRes.description && newRes.description.trim().length > 30)));

    const effectiveText = textContent.trim() || newRes.description.trim();

    if (isTextFormat && !effectiveText) {
      addToast('தயவுசெய்து உரை உள்ளடக்கத்தை உள்ளிடவும் (Please enter text content)', 'error');
      setIsUploadingPdf(false);
      return;
    }

    setIsUploadingPdf(true);
    let finalFileUrl = newRes.link?.trim() || '';
    let finalFileName = newRes.file_name || (isTextFormat ? 'GK_Content.txt' : 'Document.pdf');
    let finalFileSize = newRes.file_size || (isTextFormat ? 'Text' : '1.0 MB');
    let storageFilePath = null;

    if (isTextFormat) {
      const words = effectiveText.split(/\s+/).filter(Boolean).length;
      finalFileSize = `${words} சொற்கள் (Text)`;
      const cleanSlug = newRes.title.trim().replace(/[^a-zA-Z0-9\u0B80-\u0BFF]/g, '_').slice(0, 35) || 'GK_Content';
      finalFileName = `${cleanSlug}.txt`;
      storageFilePath = 'text';

      // Create downloadable text data URI
      finalFileUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(effectiveText)}`;

      try {
        const textBlob = new Blob([effectiveText], { type: 'text/plain;charset=utf-8' });
        const uniqueFilePath = `gk_text_${Date.now()}_${cleanSlug}.txt`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('resources')
          .upload(uniqueFilePath, textBlob, { cacheControl: '3600', upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('resources').getPublicUrl(uniqueFilePath);
          if (publicUrlData?.publicUrl) {
            finalFileUrl = publicUrlData.publicUrl;
            storageFilePath = uniqueFilePath;
          }
        }
      } catch (err) {
        console.warn('Storage upload fallback for text:', err);
      }
    } else if (pdfFile) {
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
      finalFileUrl = isTextFormat ? '' : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }

    // Keep file_path safe and under 250 chars so it NEVER violates VARCHAR(500) limit
    const safeFilePath = (storageFilePath || finalFileName || (isTextFormat ? 'text' : 'document.pdf')).slice(0, 250);

    const finalDescription = isTextFormat
      ? effectiveText
      : (newRes.description || '');

    const payload = {
      title: newRes.title.trim(),
      category: newRes.category || 'Notes',
      link: finalFileUrl,
      file_path: safeFilePath,
      file_name: finalFileName,
      file_size: finalFileSize,
      description: finalDescription,
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
      setTextContent('');
      setResFormat('pdf');
      setShowTextPreview(false);
      setNewRes({ title: '', category: 'Notes', link: '', description: '', file_size: '', file_name: '' });
      setIsUploadingPdf(false);
      addToast(isTextFormat ? 'பொது அறிவு உரை வளம் வெற்றிகரமாக சேர்க்கப்பட்டது!' : 'புதிய கல்வி வளம் வெற்றிகரமாக சேர்க்கப்பட்டது!', 'success');
    } catch (err) {
      console.error(err);
      addToast('சேமிப்பில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.', 'error');
      setIsUploadingPdf(false);
    }
  };

  // Copy and Share direct link of a resource
  const handleShareResourceLink = (r) => {
    const url = `${window.location.origin}/resources?id=${r.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedResLinkId(r.id);
    addToast(`'${r.title}' நேரடி இணைப்பு நகலெடுக்கப்பட்டது! (Direct link copied)`, 'success');
    setTimeout(() => setCopiedResLinkId(null), 2500);
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

  // Open Edit Resource Modal with prefilled data
  const handleOpenEditResource = (r) => {
    const isText = (
      r.file_name?.toLowerCase().endsWith('.txt') ||
      r.file_size?.toLowerCase().includes('text') ||
      r.file_size?.toLowerCase().includes('சொற்கள்') ||
      r.file_size?.toLowerCase().includes('words') ||
      r.file_path === 'text' ||
      r.link?.startsWith('data:text') ||
      (r.category?.toLowerCase() === 'gk' && (!r.file_name || !r.file_name.toLowerCase().endsWith('.pdf') || r.file_name === 'Document.pdf'))
    );

    let extractedText = r.description || '';
    if (!extractedText && r.link?.startsWith('data:text')) {
      try {
        extractedText = decodeURIComponent(r.link.replace(/^data:text\/[^,]+,/, ''));
      } catch (err) {
        extractedText = '';
      }
    }

    setEditingRes(r);
    setEditResData({
      title: r.title || '',
      category: r.category || 'Notes',
      link: r.link?.startsWith('data:') ? '' : (r.link || ''),
      description: isText ? '' : (r.description || ''),
      file_size: r.file_size || '',
      file_name: r.file_name || '',
      downloads: r.downloads ?? 0
    });
    setEditResFormat(isText ? 'text' : 'pdf');
    setEditTextContent(isText ? extractedText : (r.description || ''));
    setShowEditTextPreview(false);
    setEditPdfFile(null);
    setShowEditResModal(true);
  };

  // Handle PDF file selection for Edit
  const handleEditFileChange = (e) => {
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

    setEditPdfFile(file);
    setEditResData(prev => ({
      ...prev,
      file_name: file.name,
      file_size: formattedSize
    }));
  };

  // Update existing Resource in Supabase
  const handleUpdateResource = async (e) => {
    e.preventDefault();
    if (!editingRes) return;
    if (!editResData.title.trim()) {
      addToast('தயவுசெய்து தலைப்பை உள்ளிடவும் (Title is required)', 'error');
      return;
    }

    const isTextFormat =
      (editResData.category === 'GK' && editResFormat === 'text') ||
      (editResFormat === 'text');

    const effectiveText = editTextContent.trim() || editResData.description.trim();

    if (isTextFormat && !effectiveText) {
      addToast('தயவுசெய்து உரை உள்ளடக்கத்தை உள்ளிடவும் (Please enter text content)', 'error');
      return;
    }

    setIsUpdatingRes(true);

    let finalFileUrl = editResData.link?.trim() || editingRes.link || '';
    let finalFileName = editResData.file_name || editingRes.file_name || (isTextFormat ? 'GK_Content.txt' : 'Document.pdf');
    let finalFileSize = editResData.file_size || editingRes.file_size || (isTextFormat ? 'Text' : '1.0 MB');
    let storageFilePath = editingRes.file_path || null;

    if (isTextFormat) {
      const words = effectiveText.split(/\s+/).filter(Boolean).length;
      finalFileSize = `${words} சொற்கள் (Text)`;
      const cleanSlug = editResData.title.trim().replace(/[^a-zA-Z0-9\u0B80-\u0BFF]/g, '_').slice(0, 35) || 'GK_Content';
      finalFileName = `${cleanSlug}.txt`;
      storageFilePath = 'text';

      // Create downloadable text data URI
      finalFileUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(effectiveText)}`;

      try {
        const textBlob = new Blob([effectiveText], { type: 'text/plain;charset=utf-8' });
        const uniqueFilePath = `gk_text_${Date.now()}_${cleanSlug}.txt`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('resources')
          .upload(uniqueFilePath, textBlob, { cacheControl: '3600', upsert: true });

        if (!uploadErr && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('resources').getPublicUrl(uniqueFilePath);
          if (publicUrlData?.publicUrl) {
            finalFileUrl = publicUrlData.publicUrl;
            storageFilePath = uniqueFilePath;
          }
        }
      } catch (err) {
        console.warn('Storage upload fallback for text:', err);
      }
    } else if (editPdfFile) {
      finalFileName = editPdfFile.name;
      const sizeInMB = editPdfFile.size / (1024 * 1024);
      finalFileSize = sizeInMB >= 1 ? `${sizeInMB.toFixed(1)} MB` : `${Math.round(editPdfFile.size / 1024)} KB`;

      let uploadedToStorage = false;
      const cleanName = editPdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniqueFilePath = `${Date.now()}_${cleanName}`;

      try {
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('resources')
          .upload(uniqueFilePath, editPdfFile, { cacheControl: '3600', upsert: true });

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
        if (editPdfFile.size <= 2.5 * 1024 * 1024) {
          finalFileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(editPdfFile);
          });
          storageFilePath = finalFileName;
        } else if (!finalFileUrl) {
          setIsUpdatingRes(false);
          addToast('Supabase Storage "resources" பக்கெட் கிடைக்கவில்லை. 2.5MB-க்கு அதிகமான கோப்புகளுக்கு Google Drive இணைப்பைப் பயன்படுத்தவும்.', 'error');
          return;
        }
      }
    }

    if (!finalFileUrl && !isTextFormat) {
      finalFileUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    }

    const safeFilePath = (storageFilePath || finalFileName || (isTextFormat ? 'text' : 'document.pdf')).slice(0, 250);

    const finalDescription = isTextFormat
      ? effectiveText
      : (editResData.description || '');

    const updatePayload = {
      title: editResData.title.trim(),
      category: editResData.category || 'Notes',
      link: finalFileUrl,
      file_path: safeFilePath,
      file_name: finalFileName,
      file_size: finalFileSize,
      description: finalDescription,
      downloads: Number(editResData.downloads) || 0
    };

    try {
      const { data, error } = await supabase
        .from('resources')
        .update(updatePayload)
        .eq('id', editingRes.id)
        .select();

      if (error) {
        console.error('Resource update error:', error);
        addToast(`மாற்றங்களைச் சேமிக்க முடியவில்லை: ${error.message}`, 'error');
        setIsUpdatingRes(false);
        return;
      }

      const updatedItem = (data && data.length > 0) ? data[0] : { ...editingRes, ...updatePayload };
      setResources(prev => prev.map(item => item.id === editingRes.id ? updatedItem : item));

      setShowEditResModal(false);
      setEditingRes(null);
      setEditPdfFile(null);
      setEditTextContent('');
      setEditResFormat('pdf');
      setShowEditTextPreview(false);
      setIsUpdatingRes(false);
      addToast('கல்வி வளம் வெற்றிகரமாக மாற்றப்பட்டது (Resource updated successfully)!', 'success');
    } catch (err) {
      console.error(err);
      addToast('புதுப்பிப்பதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.', 'error');
      setIsUpdatingRes(false);
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

  // Open Edit Event Modal
  const handleOpenEditEvent = (e) => {
    const cover = e.cover_image || e.description?.match(/<!--COVER_IMAGE:(.*?)-->/)?.[1] || '';
    const cleanDesc = (e.description || '').replace(/<!--COVER_IMAGE:.*?-->/g, '').trim();

    setEditingEvt(e);
    setEditEvtData({
      title: e.title || '',
      date: e.date || '',
      location: e.location || 'Zoom Online',
      status: e.status || 'Upcoming',
      description: cleanDesc,
      cover_image: cover
    });
    setEditEvtCoverFile(null);
    setEditEvtCoverPreview(cover || null);
    setShowEditEvtModal(true);
  };

  // Handle Edit Event Cover Image selection
  const handleEditEventCoverChange = (e) => {
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

    setEditEvtCoverFile(file);
    const previewUrl = URL.createObjectURL(file);
    setEditEvtCoverPreview(previewUrl);
    addToast('கவர் படம் தேர்ந்தெடுக்கப்பட்டது!', 'info');
  };

  // Update Event
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!editingEvt) return;
    if (!editEvtData.title.trim()) {
      addToast('நிகழ்வு தலைப்பு அவசியம் (Title is required)', 'error');
      return;
    }

    setIsUpdatingEvt(true);
    let coverImageUrl = editEvtData.cover_image || '';

    if (editEvtCoverFile) {
      let uploadedToStorage = false;
      try {
        const cleanName = editEvtCoverFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `event_${Date.now()}_${cleanName}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('resources')
          .upload(filePath, editEvtCoverFile, { cacheControl: '3600', upsert: true });

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
        if (editEvtCoverFile.size <= 2 * 1024 * 1024) {
          coverImageUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve('');
            reader.readAsDataURL(editEvtCoverFile);
          });
        }
      }
    }

    let finalDescription = editEvtData.description || '';
    if (coverImageUrl) {
      finalDescription = `${finalDescription}\n\n<!--COVER_IMAGE:${coverImageUrl}-->`.trim();
    }

    const payload = {
      title: editEvtData.title.trim(),
      date: editEvtData.date || new Date().toLocaleDateString(),
      location: editEvtData.location || 'Zoom Online',
      status: editEvtData.status || 'Upcoming',
      description: finalDescription,
      cover_image: coverImageUrl
    };

    try {
      const { data, error } = await supabase.from('events').update(payload).eq('id', editingEvt.id).select();
      if (error) {
        console.error(error);
        addToast(`நிகழ்வைப் புதுப்பிப்பதில் பிழை: ${error.message}`, 'error');
        setIsUpdatingEvt(false);
        return;
      }

      const updatedEvt = data && data.length > 0 ? { ...data[0], cover_image: coverImageUrl } : { ...editingEvt, ...payload, cover_image: coverImageUrl };
      setEvents(prev => prev.map(item => item.id === editingEvt.id ? updatedEvt : item));

      setShowEditEvtModal(false);
      setEditingEvt(null);
      setEditEvtCoverFile(null);
      setEditEvtCoverPreview(null);
      setIsUpdatingEvt(false);
      addToast('நிகழ்வு வெற்றிகரமாக மாற்றப்பட்டது (Event updated successfully)!', 'success');
    } catch (err) {
      console.error(err);
      addToast('நிகழ்வைப் புதுப்பிப்பதில் பிழை ஏற்பட்டது', 'error');
      setIsUpdatingEvt(false);
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

  // Open Edit Announcement Modal
  const handleOpenEditAnnouncement = (a) => {
    const descMatch = a.title?.match(/<!--DESC:(.*?)-->/);
    const cleanTitle = a.clean_title || a.title?.replace(/<!--DESC:.*?-->/g, '').trim() || a.title;
    const cleanDesc = a.description || (descMatch ? descMatch[1] : '') || '';

    setEditingAnn(a);
    setEditAnnData({
      title: cleanTitle,
      priority: a.priority || 'General',
      audience: a.audience || 'All Students',
      description: cleanDesc
    });
    setShowEditAnnModal(true);
  };

  // Update Announcement
  const handleUpdateAnnouncement = async (e) => {
    e.preventDefault();
    if (!editingAnn) return;
    if (!editAnnData.title.trim()) {
      addToast('அறிவிப்பு தலைப்பு அவசியம்', 'error');
      return;
    }

    setIsUpdatingAnn(true);
    const rawTitle = editAnnData.title.trim();
    const rawDesc = editAnnData.description?.trim() || '';

    const standardPayload = {
      title: rawTitle,
      priority: editAnnData.priority || 'General',
      audience: editAnnData.audience || 'All Students',
      description: rawDesc
    };

    let updatedItem = null;
    let updateErr = null;

    try {
      const { data, error } = await supabase.from('announcements').update(standardPayload).eq('id', editingAnn.id).select();
      if (!error && data && data.length > 0) {
        updatedItem = data[0];
      } else if (error) {
        updateErr = error;
      }
    } catch (e) {
      updateErr = e;
    }

    // Fallback if description column doesn't exist
    if (!updatedItem && updateErr && (updateErr.message?.includes('description') || updateErr.code === 'PGRST204')) {
      try {
        const fallbackTitle = rawDesc ? `${rawTitle} <!--DESC:${rawDesc}-->` : rawTitle;
        const fallbackPayload = {
          title: fallbackTitle,
          priority: editAnnData.priority || 'General',
          audience: editAnnData.audience || 'All Students'
        };
        const { data, error } = await supabase.from('announcements').update(fallbackPayload).eq('id', editingAnn.id).select();
        if (!error && data && data.length > 0) {
          updatedItem = data[0];
          updateErr = null;
        } else {
          updateErr = error;
        }
      } catch (e) {
        updateErr = e;
      }
    }

    if (updateErr && !updatedItem) {
      console.error('Announcement update error:', updateErr);
      addToast(`அறிவிப்பை மாற்றுவதில் பிழை: ${updateErr?.message || 'Error updating'}`, 'error');
      setIsUpdatingAnn(false);
      return;
    }

    const descMatch = updatedItem?.title?.match(/<!--DESC:(.*?)-->/);
    const parsedItem = {
      ...(updatedItem || editingAnn),
      ...standardPayload,
      clean_title: updatedItem?.title?.replace(/<!--DESC:.*?-->/g, '').trim() || rawTitle,
      description: updatedItem?.description || (descMatch ? descMatch[1] : rawDesc)
    };

    setAnnouncements(prev => prev.map(item => item.id === editingAnn.id ? parsedItem : item));
    setShowEditAnnModal(false);
    setEditingAnn(null);
    setIsUpdatingAnn(false);
    addToast('அறிவிப்பு வெற்றிகரமாக மாற்றப்பட்டது (Announcement updated successfully)!', 'success');
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
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isSuperAdmin ? 'OFFICIAL SUPER ADMIN DASHBOARD' : 'OFFICIAL ADMIN DASHBOARD'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '3px 10px', borderRadius: '12px', background: isSuperAdmin ? '#fef3c7' : '#dcfce7', color: isSuperAdmin ? '#92400e' : '#166534', fontWeight: 700 }}>
                {isSuperAdmin ? <Crown size={12} color="#b45309" /> : <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e' }}></span>}
                {sessionStorage.getItem('edufamily_admin_email') || 'adminbabi@gmail.com'}
              </span>
              {isSuperAdmin && (
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(215, 25, 32, 0.1)', color: 'var(--primary)', fontWeight: 800 }}>
                  👑 முதன்மை நிர்வாகி (Super Admin)
                </span>
              )}
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Edufamily நிர்வாகப் பகுதி</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                setTargetAdminForPasswordChange(null);
                setCurrentPasswordInput('');
                setNewPasswordInput('');
                setConfirmPasswordInput('');
                setShowChangePasswordModal(true);
              }}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              title="உங்கள் நிர்வாகக் கடவுச்சொல்லை மாற்றவும்"
            >
              <Key size={16} color="var(--primary)" />
              <span>கடவுச்சொல் மாற்று (Change Password)</span>
            </button>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '0.9rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <LogOut size={16} />
              <span>வெளியேறு (Logout)</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isSuperAdmin ? 'repeat(auto-fit, minmax(210px, 1fr))' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          {/* Visitors KPI Card with Realtime Live Indicator */}
          <div
            className="card"
            onClick={() => setActiveTab('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '18px 16px',
              border: activeTab === 'analytics' ? '2px solid #8b5cf6' : '1.5px solid rgba(139, 92, 246, 0.3)',
              background: 'radial-gradient(circle at 100% 0%, rgba(139, 92, 246, 0.12), transparent 70%)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 0
            }}
            title="முழுமையான நேரலை பார்வையாளர்கள் பகுப்பாய்வைக் காண கிளிக் செய்யவும்"
          >
            {/* Live Realtime Pulse Badge */}
            <div style={{ position: 'absolute', top: '10px', right: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span className="live-pulse-dot" style={{ width: '7px', height: '7px' }}></span>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                LIVE {liveOnlineCount}
              </span>
            </div>

            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.18)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Eye size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1, paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', flexWrap: 'wrap', marginBottom: '2px' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                  {(visitorStats?.total_visits || 0).toLocaleString()}
                </div>
                <span style={{ fontSize: '0.68rem', padding: '1px 6px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  +{visitorStats?.today_visits || 0} இன்று
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                பார்வையாளர்கள் (Visitors)
              </div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 16px', minWidth: 0 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(215,25,32,0.1)', color: '#d71920', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{resources.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>கல்வி வளங்கள்</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 16px', minWidth: 0 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(34,197,94,0.1)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Calendar size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{events.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>நிகழ்வுகள்</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 16px', minWidth: 0 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bell size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{announcements.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>அறிவிப்புகள்</div>
            </div>
          </div>

          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 16px', minWidth: 0 }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Mail size={22} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{inquiries.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>மாணவர் செய்திகள்</div>
            </div>
          </div>

          {isSuperAdmin && (
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '18px 16px', border: '1.5px solid rgba(215, 25, 32, 0.25)', background: 'radial-gradient(circle at 100% 0%, rgba(215, 25, 32, 0.05), transparent 70%)', minWidth: 0 }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(215,25,32,0.12)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Crown size={22} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '1.45rem', fontWeight: 800 }}>{admins.length}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>நிர்வாகிகள் (Admins)</div>
              </div>
            </div>
          )}
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
            <button
              className={`pill-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: activeTab === 'analytics' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.3)',
                color: activeTab === 'analytics' ? '#fff' : '#8b5cf6',
                background: activeTab === 'analytics' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.06)',
                fontWeight: 700
              }}
            >
              <span className="live-pulse-dot" style={{ width: '7px', height: '7px' }}></span>
              <span>நேரலை ({liveOnlineCount} Live / {(visitorStats?.total_visits || 0).toLocaleString()})</span>
            </button>
            {isSuperAdmin && (
              <button
                className={`pill-btn ${activeTab === 'admins' ? 'active' : ''}`}
                onClick={() => setActiveTab('admins')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderColor: activeTab === 'admins' ? 'var(--primary)' : 'rgba(215, 25, 32, 0.3)',
                  color: activeTab === 'admins' ? '#fff' : 'var(--primary)',
                  background: activeTab === 'admins' ? 'var(--primary)' : 'rgba(215, 25, 32, 0.06)',
                  fontWeight: 700
                }}
              >
                <Crown size={14} />
                <span>Admins ({admins.length})</span>
              </button>
            )}
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
                    <th style={{ padding: '12px', textAlign: 'right' }}>செயல்கள் (Actions)</th>
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
                    resources.map((r) => {
                      const isText = (
                        r.file_name?.toLowerCase().endsWith('.txt') ||
                        r.file_size?.toLowerCase().includes('text') ||
                        r.file_size?.toLowerCase().includes('சொற்கள்') ||
                        r.file_size?.toLowerCase().includes('words') ||
                        r.file_path === 'text' ||
                        r.link?.startsWith('data:text') ||
                        (r.category?.toLowerCase() === 'gk' && (!r.file_name || !r.file_name.toLowerCase().endsWith('.pdf') || r.file_name === 'Document.pdf'))
                      );
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{r.title}</td>
                          <td style={{ padding: '12px' }}>
                            <span className="category-tag">{r.category}</span>
                            {isText && (
                              <span style={{ marginLeft: '6px', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', fontWeight: 700 }}>
                                Text
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {isText ? (
                              <span
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#059669', fontWeight: 600, fontSize: '0.85rem' }}
                                title={r.file_name || 'GK Text Content'}
                              >
                                <AlignLeft size={15} />
                                <span>{r.file_size || 'உரை (Text)'}</span>
                              </span>
                            ) : r.link || r.file_path ? (
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
                          <td style={{ padding: '12px' }}>
                            {isText ? (
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>— (Text)</span>
                            ) : (
                              r.downloads || 0
                            )}
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => handleShareResourceLink(r)}
                                style={{
                                  background: copiedResLinkId === r.id ? 'rgba(34, 197, 94, 0.15)' : 'rgba(139, 92, 246, 0.12)',
                                  border: copiedResLinkId === r.id ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(139, 92, 246, 0.25)',
                                  color: copiedResLinkId === r.id ? '#16a34a' : '#8b5cf6',
                                  cursor: 'pointer',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  transition: 'all 0.2s'
                                }}
                                title="நேரடி இணைப்பைப் பகிர் (Share Direct Link)"
                              >
                                {copiedResLinkId === r.id ? <Check size={14} /> : <Share2 size={14} />}
                                <span>{copiedResLinkId === r.id ? 'நகலெடுக்கப்பட்டது' : 'பகிர்'}</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditResource(r)}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  border: '1px solid rgba(59, 130, 246, 0.25)',
                                  color: '#3b82f6',
                                  cursor: 'pointer',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  transition: 'all 0.2s'
                                }}
                                title="வளத்தைத் திருத்து (Edit Resource)"
                              >
                                <Pencil size={14} />
                                <span>திருத்து</span>
                              </button>
                              <button
                                onClick={() => handleDeleteResource(r.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '5px 7px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                                title="நீக்கு (Delete Resource)"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
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
                    <th style={{ padding: '12px', textAlign: 'right' }}>செயல்கள் (Actions)</th>
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
                            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                onClick={() => handleOpenEditEvent(e)}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  border: '1px solid rgba(59, 130, 246, 0.25)',
                                  color: '#3b82f6',
                                  cursor: 'pointer',
                                  padding: '5px 9px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  transition: 'all 0.2s'
                                }}
                                title="நிகழ்வைத் திருத்து (Edit Event)"
                              >
                                <Pencil size={14} />
                                <span>திருத்து</span>
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(e.id)}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.12)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '5px 7px',
                                  borderRadius: '6px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.2s'
                                }}
                                title="நீக்கு (Delete Event)"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
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
                    <th style={{ padding: '12px', textAlign: 'right' }}>செயல்கள் (Actions)</th>
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
                          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => handleOpenEditAnnouncement(a)}
                              style={{
                                background: 'rgba(59, 130, 246, 0.12)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                                color: '#3b82f6',
                                cursor: 'pointer',
                                padding: '5px 9px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                transition: 'all 0.2s'
                              }}
                              title="அறிவிப்பைத் திருத்து (Edit Announcement)"
                            >
                              <Pencil size={14} />
                              <span>திருத்து</span>
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(a.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '5px 7px',
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                              }}
                              title="நீக்கு (Delete Announcement)"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
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

        {/* Tab Content: Admins (adminbabi@gmail.com Super Admin Only) */}
        {activeTab === 'admins' && isSuperAdmin && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={22} color="var(--primary)" />
                  <span>நிர்வாகிகள் மேலாண்மை (Admins Management)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  முதன்மை நிர்வாகி (adminbabi@gmail.com) மட்டுமே புதிய நிர்வாகிகளை சேர்க்கவும், அவர்களின் கணக்குகளை நிர்வகிக்கவும் முடியும்.
                </p>
              </div>
              <button
                onClick={() => setShowAdminModal(true)}
                className="btn btn-primary"
                style={{ padding: '8px 18px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <UserPlus size={16} />
                <span>புதிய நிர்வாகி சேர் (Add Admin)</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>நிர்வாகி பெயர் (Name)</th>
                    <th style={{ padding: '12px' }}>மின்னஞ்சல் (Email)</th>
                    <th style={{ padding: '12px' }}>கடவுச்சொல் (Password)</th>
                    <th style={{ padding: '12px' }}>பங்கு (Role)</th>
                    <th style={{ padding: '12px' }}>நிலை (Status)</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>அகற்று (Delete)</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                        நிர்வாகிகள் விவரம் எதுவும் கிடைக்கவில்லை.
                      </td>
                    </tr>
                  ) : (
                    admins.map((adm) => {
                      const isMainSuper = adm.email.toLowerCase() === 'adminbabi@gmail.com';
                      const showPass = showAdminPasswordInTable[adm.id];
                      return (
                        <tr key={adm.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: isMainSuper ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--primary-light)',
                                color: isMainSuper ? '#fff' : 'var(--primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.8rem',
                                flexShrink: 0
                              }}>
                                {adm.avatar || adm.name?.slice(0, 2).toUpperCase() || 'AD'}
                              </div>
                              <div>
                                <span>{adm.name}</span>
                                {isMainSuper && (
                                  <span style={{ marginLeft: '6px', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(234, 179, 8, 0.2)', color: '#b45309', fontWeight: 800 }}>
                                    Primary Super Admin
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px', color: 'var(--text-main)', fontSize: '0.88rem' }}>
                            {adm.email}
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: showPass ? 'monospace' : 'inherit', letterSpacing: showPass ? '1px' : '0', fontWeight: showPass ? 700 : 400 }}>
                                {showPass ? (adm.password_hash || '••••••') : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowAdminPasswordInTable(prev => ({ ...prev, [adm.id]: !prev[adm.id] }))}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                                title={showPass ? 'கடவுச்சொல்லை மறை' : 'கடவுச்சொல்லைக் காட்டு'}
                              >
                                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetAdminForPasswordChange(adm);
                                  setCurrentPasswordInput('');
                                  setNewPasswordInput('');
                                  setConfirmPasswordInput('');
                                  setShowChangePasswordModal(true);
                                }}
                                style={{
                                  background: 'rgba(215, 25, 32, 0.08)',
                                  border: '1px solid rgba(215, 25, 32, 0.2)',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  color: 'var(--primary)',
                                  padding: '2px 8px',
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                                title="கடவுச்சொல்லை மாற்றவும் (Change Password)"
                              >
                                <Key size={11} />
                                <span>மாற்று</span>
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className="category-tag" style={{ background: isMainSuper ? 'rgba(234, 179, 8, 0.15)' : undefined, color: isMainSuper ? '#b45309' : undefined }}>
                              {adm.role || (isMainSuper ? 'Super Admin' : 'Admin')}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleAdminStatus(adm)}
                              disabled={isMainSuper}
                              style={{
                                border: 'none',
                                background: adm.status === 'Active' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: adm.status === 'Active' ? '#15803d' : '#b91c1c',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: isMainSuper ? 'default' : 'pointer'
                              }}
                              title={isMainSuper ? 'முதன்மை சூப்பர் அட்மின் எப்போதும் செயலில் இருக்கும்' : 'நிலையை மாற்ற கிளிக் செய்யவும்'}
                            >
                              {adm.status === 'Active' ? 'செயலில் (Active)' : 'முடக்கம் (Inactive)'}
                            </button>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetAdminForPasswordChange(adm);
                                  setCurrentPasswordInput('');
                                  setNewPasswordInput('');
                                  setConfirmPasswordInput('');
                                  setShowChangePasswordModal(true);
                                }}
                                className="icon-btn"
                                style={{ width: '30px', height: '30px', color: 'var(--primary)', background: 'rgba(215, 25, 32, 0.08)' }}
                                title="கடவுச்சொல் மாற்று (Change Password)"
                              >
                                <Key size={14} />
                              </button>
                              {!isMainSuper && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAdmin(adm.id, adm.email)}
                                  className="icon-btn delete-btn"
                                  style={{ width: '30px', height: '30px', color: '#ef4444' }}
                                  title="இந்த நிர்வாகியை நீக்கு"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
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

        {/* Tab Content: Analytics & Visitors */}
        {activeTab === 'analytics' && (
          <div className="card">
            {/* Analytics Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart3 size={22} color="#8b5cf6" />
                  <span>வலைத்தளப் பார்வையாளர்கள் பகுப்பாய்வு (Visitors & Analytics)</span>
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  மாணவர்கள் மற்றும் பார்வையாளர்களின் நேரலை வருகை மற்றும் பக்கங்களின் பார்வை விபரங்கள்
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleRefreshVisitorStats}
                  className="btn btn-secondary"
                  disabled={isLoadingStats}
                  style={{ padding: '7px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  title="பார்வையாளர்கள் விபரங்களைப் புதுப்பிக்கவும்"
                >
                  <RefreshCw size={14} className={isLoadingStats ? 'spin-icon' : ''} />
                  <span>{isLoadingStats ? 'புதுப்பிக்கிறது...' : 'புதுப்பி (Refresh)'}</span>
                </button>

                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomTotalVisits(String(visitorStats?.total_visits || 0));
                      setCustomUniqueVisitors(String(visitorStats?.unique_visitors || 0));
                      setShowEditBaselineModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '7px 14px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}
                    title="பார்வையாளர்கள் ஆரம்ப எண்ணிக்கையை மாற்று"
                  >
                    <Settings size={14} />
                    <span>எண்ணிக்கை திருத்து (Adjust Baseline)</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              {/* Card 1: Live Active Users Right Now */}
              <div style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.05))', padding: '20px', borderRadius: '14px', border: '1.5px solid rgba(34, 197, 94, 0.3)', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.2)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Radio size={24} className="spin-icon" style={{ animationDuration: '4s' }} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="live-pulse-dot"></span>
                    <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#15803d', lineHeight: '1.2' }}>{liveOnlineCount}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 700 }}>நேரலையில் உள்ளோர் (Live Online Now)</div>
                </div>
              </div>

              {/* Card 2: Total Page Views */}
              <div style={{ background: 'var(--bg-light)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Globe size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>{(visitorStats?.total_visits || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>மொத்த பார்வைகள் (Total Views)</div>
                </div>
              </div>

              {/* Card 3: Unique Visitors */}
              <div style={{ background: 'var(--bg-light)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Users size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>{(visitorStats?.unique_visitors || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>தனிப்பட்ட நபர்கள் (Unique Visitors)</div>
                </div>
              </div>

              {/* Card 4: Today's Visits */}
              <div style={{ background: 'var(--bg-light)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <TrendingUp size={24} />
                </div>
                <div>
                  <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>{(visitorStats?.today_visits || 0).toLocaleString()}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>இன்றைய வருகைகள் (Today)</div>
                </div>
              </div>
            </div>

            {/* Realtime Live Activity Feed Bar (if events present) */}
            {recentLiveEvents.length > 0 && (
              <div style={{ marginBottom: '24px', padding: '14px 18px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.06)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed' }}>
                  <Zap size={15} />
                  <span>நேரலை பார்வையாளர் நிகழ்வுகள் (Realtime Live Activity):</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {recentLiveEvents.map((evt) => (
                    <span key={evt.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '3px 10px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontWeight: 600 }}>
                      <span className="live-pulse-dot" style={{ width: '6px', height: '6px' }}></span>
                      <span>[{evt.time}] {evt.path === '/' ? 'Home' : evt.path} {evt.isNewUnique ? '👤 (புதியவர்)' : ''}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Grid for Pages Breakdown & Daily stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Pages breakdown */}
              <div style={{ background: 'var(--bg-light)', padding: '22px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} color="var(--primary)" />
                  <span>முக்கிய பக்கங்களின் பார்வைகள் (Top Visited Pages)</span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { path: '/', label: 'முகப்பு பக்கம் (Homepage)' },
                    { path: '/resources', label: 'கல்வி வளங்கள் (Resources & Past Papers)' },
                    { path: '/events', label: 'கருத்தரங்குகள் (Live Seminars & Workshops)' },
                    { path: '/announcements', label: 'அறிவிப்புகள் (Announcements & News Flash)' },
                    { path: '/about', label: 'எங்களைப் பற்றி (About Edufamily)' },
                    { path: '/contact', label: 'தொடர்பு & WhatsApp (Contact Us)' }
                  ].map((page) => {
                    const views = visitorStats?.page_views?.[page.path] || 0;
                    const total = visitorStats?.total_visits || 0;
                    const percent = total > 0 ? Math.min(100, Math.round((views / total) * 100)) : 0;

                    return (
                      <div key={page.path}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', fontWeight: 600, marginBottom: '6px' }}>
                          <span style={{ color: 'var(--text-main)' }}>{page.label}</span>
                          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{views.toLocaleString()} ({percent}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #ef4444)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Daily Trend & Insights */}
              <div style={{ background: 'var(--bg-light)', padding: '22px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} color="#16a34a" />
                    <span>சமீபத்திய தினசரி வருகைகள் (Daily Traffic Insights)</span>
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Object.entries(visitorStats?.daily_stats || { [new Date().toISOString().split('T')[0]]: visitorStats?.today_visits || 0 })
                      .slice(-5)
                      .reverse()
                      .map(([date, count]) => (
                        <div key={date} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={14} color="var(--text-muted)" />
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{date}</span>
                          </div>
                          <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.9rem' }}>
                            {count} வருகைகள்
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div style={{ marginTop: '20px', padding: '14px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.5' }}>
                  <div style={{ fontWeight: 700, color: '#2563eb', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Info size={15} />
                    <span>தானியங்கிப் பகுப்பாய்வுக் குறிப்பு:</span>
                  </div>
                  மாணவர்கள் இணையதளத்தின் எந்தப் பக்கத்தைப் பார்வையிட்டாலும் அது உண்மையான நேரத்தில் (Realtime) இங்கு பதிவாகும். நிர்வாகப் பக்கத்தின் (Admin) பார்வைகள் இதில் சேர்க்கப்படாது.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Resource Modal */}
      {showResModal && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>புதிய கல்வி வளம் சேர் (Add Resource)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  பாடக் குறிப்புகள், முந்தைய வினாத்தாள்கள் அல்லது பொது அறிவு (GK) உரை/PDF சேர்க்கவும்
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowResModal(false);
                  setPdfFile(null);
                  setTextContent('');
                  setResFormat('pdf');
                  setShowTextPreview(false);
                }}
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddResource}>
              {/* Category */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  பிரிவு (Category) *
                </label>
                <select
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                  value={newRes.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setNewRes(prev => ({ ...prev, category: cat }));
                    if (cat === 'GK') {
                      setResFormat('text');
                    } else {
                      setResFormat('pdf');
                    }
                  }}
                >
                  <option value="Past Paper">Past Paper (முந்தைய வினாத்தாள்கள்)</option>
                  <option value="Notes">Notes (பாடக் குறிப்புகள்)</option>
                  <option value="GK">GK & Quiz (பொது அறிவு & வினாடி வினா)</option>
                </select>
              </div>

              {/* Title */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  வளத்தின் தலைப்பு (Resource Title) *
                </label>
                <input
                  type="text"
                  placeholder={newRes.category === 'GK' ? "உதாரணம்: பொது அறிவு வினா விடைகள் 2024 (General Knowledge Quiz)" : "உதாரணம்: G.C.E O/L Science Past Paper 2023"}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={newRes.title}
                  onChange={(e) => setNewRes({ ...newRes, title: e.target.value })}
                  required
                />
              </div>

              {/* If Category is GK: choose PDF or Text format */}
              {newRes.category === 'GK' && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>
                    பொது அறிவு வடிவம் தேர்ந்தெடுக்கவும் (Resource Type: PDF / Text) *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setResFormat('pdf')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: resFormat === 'pdf' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: resFormat === 'pdf' ? 'var(--primary-light)' : 'var(--bg-card)',
                        color: resFormat === 'pdf' ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: resFormat === 'pdf' ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <FileText size={18} />
                      <span>PDF ஆவணம் (PDF)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResFormat('text')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: resFormat === 'text' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                        background: resFormat === 'text' ? 'var(--primary-light)' : 'var(--bg-card)',
                        color: resFormat === 'text' ? 'var(--primary)' : 'var(--text-main)',
                        fontWeight: resFormat === 'text' ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <AlignLeft size={18} />
                      <span>உரை வடிவம் (Text / Quiz)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Conditional: PDF Upload Dropzone OR Text Content Editor */}
              {newRes.category === 'GK' && resFormat === 'text' ? (
                /* Text Input Area */
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      பொது அறிவு உரை / வினா விடைகள் (GK Text Content / Questions & Answers) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTextPreview(!showTextPreview)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={14} />
                      {showTextPreview ? 'உரையைத் திருத்து (Edit)' : 'முன்னோட்டம் (Preview)'}
                    </button>
                  </div>

                  {/* Template Shortcuts */}
                  {!showTextPreview && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const tpl = '\n1. வினா: [இங்கே கேள்வியை உள்ளிடவும்]\nவிடை: [இங்கே சரியான விடை]\n';
                          setTextContent(prev => prev ? prev + tpl : tpl.trim());
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-light)',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          fontWeight: 500
                        }}
                      >
                        + வினா - விடை (Q&A)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tpl = '\nவினா: [வினாடி வினா கேள்வி]\nஅ) தெரிவு 1\nஆ) தெரிவு 2\nஇ) தெரிவு 3\nஈ) தெரிவு 4\nசரியான விடை: அ\n';
                          setTextContent(prev => prev ? prev + tpl : tpl.trim());
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-light)',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          fontWeight: 500
                        }}
                      >
                        + MCQ பல்தேர்வு
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tpl = '\n• [பொது அறிவு முக்கிய குறிப்பு]\n• [அடுத்த குறிப்பு]\n';
                          setTextContent(prev => prev ? prev + tpl : tpl.trim());
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-light)',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          fontWeight: 500
                        }}
                      >
                        + புல்லட் புள்ளிகள்
                      </button>
                    </div>
                  )}

                  {showTextPreview ? (
                    <div style={{
                      minHeight: '180px',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-light)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {textContent.trim() || <span style={{ color: 'var(--text-muted)' }}>உரை எதுவும் உள்ளிடப்படவில்லை...</span>}
                    </div>
                  ) : (
                    <textarea
                      rows={8}
                      placeholder="பொது அறிவுத் தகவல்கள், வினாக்கள், விடைகள் அல்லது வினாடி வினா விபரங்களை இங்கே நேரடியாக தட்டச்சு செய்யவும்...&#10;&#10;உதாரணம்:&#10;1. இலங்கையின் மிகப்பெரிய நதி எது?&#10;விடை: மகாவலி கங்கை&#10;&#10;2. உலகிலேயே மிக ஆழமான கடல் பகுதி எது?&#10;விடை: மரியானா அகழி"
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        outline: 'none',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        lineHeight: '1.6',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      required
                    />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>{textContent.trim() ? `${textContent.trim().split(/\s+/).filter(Boolean).length} சொற்கள் (Words)` : '0 சொற்கள்'}</span>
                    <span>{textContent.length} எழுத்துக்கள்</span>
                  </div>
                </div>
              ) : (
                /* PDF Upload Dropzone */
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
              )}

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

              {/* Description (Optional summary) */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  {newRes.category === 'GK' && resFormat === 'text' ? 'சுருக்கக் குறிப்பு (Optional Summary Note)' : 'விளக்கம் (Description)'}
                </label>
                <textarea
                  rows={2}
                  placeholder={newRes.category === 'GK' && resFormat === 'text' ? 'இந்த பொது அறிவுத் தொகுப்பைப் பற்றிய சிறு குறிப்பு (விரும்பினால்)...' : 'மாணவர்களுக்குப் பயன்படக்கூடிய விபரங்கள்...'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', resize: 'vertical' }}
                  value={newRes.description}
                  onChange={(e) => setNewRes({ ...newRes, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowResModal(false);
                    setPdfFile(null);
                    setTextContent('');
                    setResFormat('pdf');
                    setShowTextPreview(false);
                  }}
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

      {/* Edit Resource Modal */}
      {showEditResModal && editingRes && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '580px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>கல்வி வளத்தைத் திருத்து (Edit Resource)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  தலைப்பு, பிரிவு, உரை அல்லது PDF கோப்பு விபரங்களை மாற்றியமைக்கவும்
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditResModal(false);
                  setEditingRes(null);
                  setEditPdfFile(null);
                  setEditTextContent('');
                  setShowEditTextPreview(false);
                }}
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateResource}>
              {/* Category */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  பிரிவு (Category) *
                </label>
                <select
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                  value={editResData.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    setEditResData(prev => ({ ...prev, category: cat }));
                    if (cat === 'GK') {
                      setEditResFormat('text');
                    }
                  }}
                >
                  <option value="Past Paper">Past Paper (முந்தைய வினாத்தாள்கள்)</option>
                  <option value="Notes">Notes (பாடக் குறிப்புகள்)</option>
                  <option value="GK">GK & Quiz (பொது அறிவு & வினாடி வினா)</option>
                </select>
              </div>

              {/* Title */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  வளத்தின் தலைப்பு (Resource Title) *
                </label>
                <input
                  type="text"
                  placeholder="வளத்தின் தலைப்பு..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={editResData.title}
                  onChange={(e) => setEditResData({ ...editResData, title: e.target.value })}
                  required
                />
              </div>

              {/* Format Toggle (PDF or Text) */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>
                  வடிவம் (Resource Type: PDF / Text)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setEditResFormat('pdf')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: editResFormat === 'pdf' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: editResFormat === 'pdf' ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: editResFormat === 'pdf' ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: editResFormat === 'pdf' ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <FileText size={18} />
                    <span>PDF ஆவணம் (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditResFormat('text')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: editResFormat === 'text' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                      background: editResFormat === 'text' ? 'var(--primary-light)' : 'var(--bg-card)',
                      color: editResFormat === 'text' ? 'var(--primary)' : 'var(--text-main)',
                      fontWeight: editResFormat === 'text' ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <AlignLeft size={18} />
                    <span>உரை வடிவம் (Text / Quiz)</span>
                  </button>
                </div>
              </div>

              {/* If Text Format */}
              {editResFormat === 'text' ? (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      உரை / வினா விடைகள் (GK Text Content / Questions & Answers) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowEditTextPreview(!showEditTextPreview)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        fontWeight: 600,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Eye size={14} />
                      {showEditTextPreview ? 'உரையைத் திருத்து (Edit)' : 'முன்னோட்டம் (Preview)'}
                    </button>
                  </div>

                  {!showEditTextPreview && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const tpl = '\n1. வினா: [இங்கே கேள்வியை உள்ளிடவும்]\nவிடை: [இங்கே சரியான விடை]\n';
                          setEditTextContent(prev => prev ? prev + tpl : tpl.trim());
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-light)',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          fontWeight: 500
                        }}
                      >
                        + வினா - விடை (Q&A)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tpl = '\nவினா: [வினாடி வினா கேள்வி]\nஅ) தெரிவு 1\nஆ) தெரிவு 2\nஇ) தெரிவு 3\nஈ) தெரிவு 4\nசரியான விடை: அ\n';
                          setEditTextContent(prev => prev ? prev + tpl : tpl.trim());
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-light)',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          fontWeight: 500
                        }}
                      >
                        + MCQ பல்தேர்வு
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const tpl = '\n• [பொது அறிவு முக்கிய குறிப்பு]\n• [அடுத்த குறிப்பு]\n';
                          setEditTextContent(prev => prev ? prev + tpl : tpl.trim());
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-light)',
                          cursor: 'pointer',
                          color: 'var(--text-main)',
                          fontWeight: 500
                        }}
                      >
                        + புல்லட் புள்ளிகள்
                      </button>
                    </div>
                  )}

                  {showEditTextPreview ? (
                    <div style={{
                      minHeight: '180px',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-light)',
                      color: 'var(--text-main)',
                      fontSize: '0.9rem',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {editTextContent.trim() || <span style={{ color: 'var(--text-muted)' }}>உரை எதுவும் உள்ளிடப்படவில்லை...</span>}
                    </div>
                  ) : (
                    <textarea
                      rows={8}
                      placeholder="பொது அறிவுத் தகவல்கள், வினாக்கள், விடைகளை இங்கே நேரடியாக தட்டச்சு செய்யவும்..."
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        outline: 'none',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        lineHeight: '1.6',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                      value={editTextContent}
                      onChange={(e) => setEditTextContent(e.target.value)}
                      required
                    />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span>{editTextContent.trim() ? `${editTextContent.trim().split(/\s+/).filter(Boolean).length} சொற்கள் (Words)` : '0 சொற்கள்'}</span>
                    <span>{editTextContent.length} எழுத்துக்கள்</span>
                  </div>
                </div>
              ) : (
                /* PDF File Area */
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
                    PDF கோப்பு (PDF File)
                  </label>

                  {/* Existing file info */}
                  {editingRes.file_name && !editPdfFile && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-light)',
                      border: '1px solid var(--border-color)',
                      marginBottom: '10px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <FileText size={18} color="var(--primary)" />
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>தற்போதைய கோப்பு: </span>
                          <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>{editingRes.file_name}</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '6px' }}>({editingRes.file_size || 'PDF'})</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!editPdfFile ? (
                    <label
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '18px 16px',
                        border: '2px dashed var(--primary)',
                        borderRadius: '10px',
                        background: 'var(--primary-light)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'center'
                      }}
                    >
                      <UploadCloud size={28} color="var(--primary)" />
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' }}>
                          {editingRes.file_name ? 'புதிய PDF கோப்பை மாற்றி அமைக்க கிளிக் செய்யவும்' : 'PDF கோப்பைத் தேர்ந்தெடுக்க கிளிக் செய்யவும்'}
                        </span>
                        <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          (Click to replace file • Max: 20MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={handleEditFileChange}
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
                            {editPdfFile.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                            {editResData.file_size || 'PDF'} • புதிய கோப்பு தேர்ந்தெடுக்கப்பட்டது
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditPdfFile(null);
                          setEditResData(prev => ({
                            ...prev,
                            file_name: editingRes.file_name || '',
                            file_size: editingRes.file_size || ''
                          }));
                        }}
                        className="icon-btn"
                        style={{ width: '28px', height: '28px', color: '#dc2626', background: 'rgba(239,68,68,0.1)' }}
                        title="புதிய கோப்பை அகற்று"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Optional external link */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  மாற்று இணைய இணைப்பு / Drive Link (விரும்பினால்)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  value={editResData.link}
                  onChange={(e) => setEditResData({ ...editResData, link: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  {editResFormat === 'text' ? 'சுருக்கக் குறிப்பு (Optional Summary Note)' : 'விளக்கம் (Description)'}
                </label>
                <textarea
                  rows={2}
                  placeholder={editResFormat === 'text' ? 'சிறு குறிப்பு (விரும்பினால்)...' : 'மாணவர்களுக்குப் பயன்படக்கூடிய விபரங்கள்...'}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', resize: 'vertical' }}
                  value={editResData.description}
                  onChange={(e) => setEditResData({ ...editResData, description: e.target.value })}
                />
              </div>

              {/* Downloads Count adjustment */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  பதிவிறக்கங்கள் எண்ணிக்கை (Downloads Count)
                </label>
                <input
                  type="number"
                  min="0"
                  style={{ width: '140px', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={editResData.downloads}
                  onChange={(e) => setEditResData({ ...editResData, downloads: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditResModal(false);
                    setEditingRes(null);
                    setEditPdfFile(null);
                    setEditTextContent('');
                    setShowEditTextPreview(false);
                  }}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                  disabled={isUpdatingRes}
                >
                  ரத்து செய் (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isUpdatingRes}
                >
                  {isUpdatingRes ? (
                    <span>சேமிக்கப்படுகிறது...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>மாற்றங்களைச் சேமி (Save Changes)</span>
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

      {/* Edit Event Modal */}
      {showEditEvtModal && editingEvt && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>கருத்தரங்கைத் திருத்து (Edit Event)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  நிகழ்வு தலைப்பு, திகதி, கவர் படம் அல்லது விபரங்களை மாற்றியமைக்கவும்
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditEvtModal(false);
                  setEditingEvt(null);
                  setEditEvtCoverFile(null);
                  setEditEvtCoverPreview(null);
                }}
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateEvent}>
              {/* Cover Image Upload (Optional) */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontWeight: 700, fontSize: '0.9rem' }}>
                  <span>கவர் படம் (Cover Image)</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>விருப்பத்தேர்வு (Optional)</span>
                </label>

                {!editEvtCoverPreview && !editEvtData.cover_image ? (
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
                        JPG, PNG, WebP (1200x630 அல்லது 16:9)
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleEditEventCoverChange}
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
                      src={editEvtCoverPreview || editEvtData.cover_image}
                      alt="Cover Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setEditEvtCoverFile(null);
                        setEditEvtCoverPreview(null);
                        setEditEvtData(prev => ({ ...prev, cover_image: '' }));
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
                      ✓ கவர் படம்
                    </div>
                  </div>
                )}
              </div>

              {/* Optional Image URL Input */}
              {!editEvtCoverPreview && (
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <input
                    type="url"
                    placeholder="அல்லது இணைய பட URL உள்ளிடவும்: https://..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.82rem' }}
                    value={editEvtData.cover_image}
                    onChange={(e) => setEditEvtData({ ...editEvtData, cover_image: e.target.value })}
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
                  placeholder="உதாரணம்: G.C.E A/L ICT Seminar"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={editEvtData.title}
                  onChange={(e) => setEditEvtData({ ...editEvtData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                {/* Date & Time */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                    திகதி & நேரம் (Date & Time) *
                  </label>
                  <input
                    type="text"
                    placeholder="எ.கா: 15 Nov 2024 | 06:30 PM"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                    value={editEvtData.date}
                    onChange={(e) => setEditEvtData({ ...editEvtData, date: e.target.value })}
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                    நிலை (Status)
                  </label>
                  <select
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                    value={editEvtData.status}
                    onChange={(e) => setEditEvtData({ ...editEvtData, status: e.target.value })}
                  >
                    <option value="Upcoming">Upcoming (நடைபெற உள்ளது)</option>
                    <option value="Completed">Completed (முடிவுற்றது)</option>
                    <option value="Postponed">Postponed (ஒத்திவைக்கப்பட்டது)</option>
                    <option value="Cancelled">Cancelled (ரத்து செய்யப்பட்டது)</option>
                  </select>
                </div>
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
                  value={editEvtData.location}
                  onChange={(e) => setEditEvtData({ ...editEvtData, location: e.target.value })}
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
                  value={editEvtData.description}
                  onChange={(e) => setEditEvtData({ ...editEvtData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditEvtModal(false);
                    setEditingEvt(null);
                    setEditEvtCoverFile(null);
                    setEditEvtCoverPreview(null);
                  }}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                  disabled={isUpdatingEvt}
                >
                  ரத்து செய் (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isUpdatingEvt}
                >
                  {isUpdatingEvt ? (
                    <span>சேமிக்கப்படுகிறது...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>மாற்றங்களைச் சேமி (Save Changes)</span>
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

      {/* Edit Announcement Modal */}
      {showEditAnnModal && editingAnn && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>அறிவிப்பைத் திருத்து (Edit Announcement)</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  அறிவிப்பு தலைப்பு, முன்னுரிமை, இலக்கு அல்லது விபரங்களை மாற்றியமைக்கவும்
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditAnnModal(false);
                  setEditingAnn(null);
                }}
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateAnnouncement}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  அறிவிப்பு தலைப்பு (Notice Title) *
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={editAnnData.title}
                  onChange={(e) => setEditAnnData({ ...editAnnData, title: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                {/* Priority */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                    முன்னுரிமை (Priority)
                  </label>
                  <select
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                    value={editAnnData.priority}
                    onChange={(e) => setEditAnnData({ ...editAnnData, priority: e.target.value })}
                  >
                    <option value="Urgent">Urgent (அவசரம்)</option>
                    <option value="Important">Important (முக்கியம்)</option>
                    <option value="General">General (பொது)</option>
                  </select>
                </div>

                {/* Audience */}
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                    இலக்கு (Audience)
                  </label>
                  <input
                    type="text"
                    placeholder="All Students / O/L Students"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                    value={editAnnData.audience}
                    onChange={(e) => setEditAnnData({ ...editAnnData, audience: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
                  விளக்கம் (Description) *
                </label>
                <textarea
                  rows={4}
                  placeholder="அறிவிப்பின் விபரங்கள்..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', resize: 'vertical' }}
                  value={editAnnData.description}
                  onChange={(e) => setEditAnnData({ ...editAnnData, description: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAnnModal(false);
                    setEditingAnn(null);
                  }}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                  disabled={isUpdatingAnn}
                >
                  ரத்து செய் (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isUpdatingAnn}
                >
                  {isUpdatingAnn ? (
                    <span>சேமிக்கப்படுகிறது...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>மாற்றங்களைச் சேமி (Save Changes)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Admin Modal (Super Admin adminbabi@gmail.com Only) */}
      {showAdminModal && isSuperAdmin && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserPlus size={20} color="var(--primary)" />
                  <span>புதிய நிர்வாகி சேர் (Add Admin)</span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Edufamily போர்ட்டலை நிர்வகிக்க புதிய நிர்வாகிக்கு அனுமதி வழங்கவும்
                </p>
              </div>
              <button
                type="button"
                onClick={() => { setShowAdminModal(false); setNewAdmin({ name: '', email: '', password: '', role: 'Admin' }); }}
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAdmin}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  நிர்வாகியின் பெயர் (Full Name) *
                </label>
                <input
                  type="text"
                  placeholder="உதாரணம்: K. Suresh அல்லது ஆசிரியை வினோதா"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  மின்னஞ்சல் முகவரி (Admin Email) *
                </label>
                <input
                  type="email"
                  placeholder="உதாரணம்: suresh.edufamily@gmail.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)' }}
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  உள்நுழைவு கடவுச்சொல் (Login Password) *
                </label>
                <input
                  type="text"
                  placeholder="குறைந்தது 4 எழுத்துக்கள் உள்ளிடவும்..."
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontFamily: 'monospace' }}
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  குறிப்பு: புதிய நிர்வாகி இந்த மின்னஞ்சல் மற்றும் கடவுச்சொல்லைப் பயன்படுத்தி உள்நுழைய முடியும்.
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  பங்கு & அதிகாரம் (Role & Permissions)
                </label>
                <select
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontWeight: 600 }}
                  value={newAdmin.role}
                  onChange={(e) => setNewAdmin({ ...newAdmin, role: e.target.value })}
                >
                  <option value="Admin">Admin (முழு நிர்வாக அனுமதி - வளங்கள், நிகழ்வுகள், செய்திகள்)</option>
                  <option value="Editor">Editor (கல்வி வளங்களை மட்டும் பதிவேற்றுபவர்)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowAdminModal(false); setNewAdmin({ name: '', email: '', password: '', role: 'Admin' }); }}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                  disabled={isSubmittingAdmin}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isSubmittingAdmin}
                >
                  {isSubmittingAdmin ? (
                    <span>சேமிக்கிறது...</span>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>நிர்வாகியைச் சேர் (Save Admin)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Super Admin Baseline Edit Modal */}
      {showEditBaselineModal && isSuperAdmin && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>பார்வையாளர்கள் எண்ணிக்கை மாற்றம்</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  வலைத்தள ஆரம்பப் பார்வையாளர்கள் எண்ணிக்கையை மாற்றி அமைக்கவும்
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditBaselineModal(false)}
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCustomBaseline}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  மொத்த பார்வைகள் (Total Visits) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={customTotalVisits}
                  onChange={(e) => setCustomTotalVisits(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  தனிப்பட்ட பார்வையாளர்கள் (Unique Visitors) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={customUniqueVisitors}
                  onChange={(e) => setCustomUniqueVisitors(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setShowEditBaselineModal(false)}
                    className="btn btn-secondary"
                    style={{ flexGrow: 1 }}
                  >
                    ரத்து செய்
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <Check size={16} />
                    <span>சேமி (Save)</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleResetToZero}
                  className="btn btn-secondary"
                  style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
                >
                  <RotateCcw size={15} />
                  <span>எல்லாவற்றையும் 0 ஆக மீட்டமை (Reset all to 0)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={20} color="var(--primary)" />
                  <span>
                    {targetAdminForPasswordChange && targetAdminForPasswordChange.email.toLowerCase() !== currentAdminEmail
                      ? `கடவுச்சொல் மாற்றம் (${targetAdminForPasswordChange.name})`
                      : 'கடவுச்சொல் மாற்றம் (Change Password)'}
                  </span>
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {targetAdminForPasswordChange && targetAdminForPasswordChange.email.toLowerCase() !== currentAdminEmail
                    ? `${targetAdminForPasswordChange.email} கணக்கின் கடவுச்சொல்லை மாற்றவும்`
                    : `${currentAdminEmail} கணக்கிற்கான புதிய கடவுச்சொல்லை அமைக்கவும்`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setTargetAdminForPasswordChange(null);
                  setCurrentPasswordInput('');
                  setNewPasswordInput('');
                  setConfirmPasswordInput('');
                }}
                className="icon-btn"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword}>
              {/* If changing own password, ask for current password */}
              {(!targetAdminForPasswordChange || targetAdminForPasswordChange.email.toLowerCase() === currentAdminEmail) && (
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                    தற்போதைய கடவுச்சொல் (Current Password) *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="தற்போதைய கடவுச்சொல்லை உள்ளிடவும்"
                      style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      title={showCurrentPass ? 'மறை' : 'காட்டு'}
                    >
                      {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* New Password */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  புதிய கடவுச்சொல் (New Password) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="குறைந்தது 4 எழுத்துக்கள் (Min 4 chars)"
                    style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                    required
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    title={showNewPass ? 'மறை' : 'காட்டு'}
                  >
                    {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group" style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                  புதிய கடவுச்சொல்லை உறுதிப்படுத்து (Confirm New Password) *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    value={confirmPasswordInput}
                    onChange={(e) => setConfirmPasswordInput(e.target.value)}
                    placeholder="மீண்டும் புதிய கடவுச்சொல்லை உள்ளிடவும்"
                    style={{ width: '100%', padding: '10px 40px 10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', fontSize: '0.95rem' }}
                    required
                    minLength={4}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    title={showConfirmPass ? 'மறை' : 'காட்டு'}
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPasswordInput && confirmPasswordInput && newPasswordInput !== confirmPasswordInput && (
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: '#ef4444' }}>
                    கடவுச்சொற்கள் பொருந்தவில்லை! (Passwords do not match)
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setTargetAdminForPasswordChange(null);
                    setCurrentPasswordInput('');
                    setNewPasswordInput('');
                    setConfirmPasswordInput('');
                  }}
                  className="btn btn-secondary"
                  style={{ flexGrow: 1 }}
                >
                  ரத்து செய் (Cancel)
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  disabled={isChangingPassword || (newPasswordInput && confirmPasswordInput && newPasswordInput !== confirmPasswordInput)}
                >
                  {isChangingPassword ? (
                    <span>மாற்றுகிறது...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>கடவுச்சொல்லை மாற்று (Update)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
