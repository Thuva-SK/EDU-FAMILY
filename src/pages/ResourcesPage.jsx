import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Download, 
  FileText, 
  Calendar, 
  Filter, 
  Eye,
  X,
  ExternalLink,
  Sparkles,
  AlignLeft,
  Copy,
  Check,
  Printer
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function ResourcesPage() {
  const { addToast } = useToast();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalResource, setActiveModalResource] = useState(null);
  const [copiedResId, setCopiedResId] = useState(null);

  useEffect(() => {
    fetchResources();

    // Subscribe to realtime changes in resources
    const subscription = supabase
      .channel('public:resources')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'resources' }, () => {
        fetchResources(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchResources = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('id', { ascending: false });

      if (error || !data) {
        if (!isBackground) setResources([]);
      } else {
        setResources(data);
      }
    } catch (err) {
      if (!isBackground) setResources([]);
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const categories = [
    { id: 'All', label: 'அனைத்தும் (All)' },
    { id: 'Past Paper', label: 'Past Papers' },
    { id: 'Notes', label: 'Notes' },
    { id: 'GK', label: 'GK & Quiz' }
  ];

  // Filtering Logic
  const filteredResources = resources.filter((res) => {
    const matchesCat = selectedCategory === 'All' || res.category?.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesSearch = 
      res.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Helper: detect if resource is text content
  const isTextResource = (res) => {
    if (!res) return false;
    return (
      res.file_name?.toLowerCase().endsWith('.txt') ||
      res.file_size?.toLowerCase().includes('text') ||
      res.file_size?.toLowerCase().includes('சொற்கள்') ||
      res.file_size?.toLowerCase().includes('words') ||
      res.file_path === 'text' ||
      res.link?.startsWith('data:text')
    );
  };

  const handleCopyText = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedResId(id);
    addToast('உரை வெற்றிகரமாக நகலெடுக்கப்பட்டது (Copied to clipboard)!', 'success');
    setTimeout(() => setCopiedResId(null), 2500);
  };

  const handlePrintText = (title, text) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title} - EDU FAMILY</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; line-height: 1.8; color: #111; max-width: 800px; margin: 0 auto; }
            h1 { border-bottom: 2px solid #d71920; padding-bottom: 10px; font-size: 22px; color: #d71920; }
            .meta { color: #666; font-size: 13px; margin-bottom: 20px; }
            .content { white-space: pre-wrap; font-size: 15px; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="meta">Edufamily Educational Portal • General Knowledge & Quiz</div>
          <div class="content">${(text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const handleDownload = async (res) => {
    const isText = isTextResource(res);
    const rawFileName = res.file_name || (isText ? `${res.title || 'gk_quiz'}.txt` : `${res.title || 'document'}.pdf`);
    // Clean filename: remove leading timestamp prefix if present (e.g. 1791183623848_gr_06... -> gr_06...)
    const cleanFileName = rawFileName.replace(/^\d+_/, '');
    
    addToast(`${res.title} பதிவிறக்கம் தொடங்குகிறது...`, 'success');
    
    // Increment download counter in Supabase
    try {
      await supabase
        .from('resources')
        .update({ downloads: (res.downloads || 0) + 1 })
        .eq('id', res.id);
      setResources(prev => prev.map(item => item.id === res.id ? { ...item, downloads: (item.downloads || 0) + 1 } : item));
    } catch (e) {
      setResources(prev => prev.map(item => item.id === res.id ? { ...item, downloads: (item.downloads || 0) + 1 } : item));
    }

    let fileUrl = res.link || res.file_path;
    if (isText && (!fileUrl || fileUrl === 'text')) {
      fileUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(res.description || res.title)}`;
    }
    if (!fileUrl) return;

    try {
      if (fileUrl.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = cleanFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Fetch as blob to trigger native direct file download with clean filename
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = cleanFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
      }
    } catch (err) {
      // Fallback
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = cleanFileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="resources-page">
      {/* Header Banner */}
      <section style={{ background: 'radial-gradient(circle at 50% 0%, rgba(215, 25, 32, 0.12) 0%, transparent 60%)', padding: '60px 0 40px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="badge-tag">
            <Sparkles size={16} />
            <span>FREE EDUCATIONAL DOWNLOADS</span>
          </div>
          <h1 className="section-title page-hero-title">
            கல்வி <span style={{ color: '#d71920' }}>வளங்கள்</span> (Resources)
          </h1>
          <p className="section-desc">
            மாணவர்களுக்குப் பயனுள்ள இலவச ஆவணங்கள், கையேடுகள், வினாத்தாள்கள் மற்றும் குறிப்புகள்.
          </p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section style={{ padding: '0 0 60px 0' }}>
        <div className="container">
          <div className="filter-bar">
            {/* Filter Pills */}
            <div className="pills-group">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  className={`pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="search-input-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="வளங்களைத் தேடுக (Search title/topic)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Grid Display */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p>கல்வி வளங்கள் ஏற்றப்படுகின்றன...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
              <BookOpen size={48} color="var(--primary)" style={{ margin: '0 auto 16px auto' }} />
              <h3>வளங்கள் எதுவும் கிடைக்கவில்லை</h3>
              <p style={{ color: 'var(--text-muted)' }}>நீங்கள் தேடிய சொல் அல்லது பிரிவில் தற்சமயம் ஆவணங்கள் இல்லை.</p>
            </div>
          ) : (
            <div className="grid-3">
              {filteredResources.map((res) => {
                const isText = isTextResource(res);
                return (
                  <div key={res.id} className="card resource-card">
                    <div>
                      <div className="res-header" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="category-tag">{res.category || 'Notes'}</span>
                          {isText ? (
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlignLeft size={11} /> உரை (Text)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', background: 'rgba(215, 25, 32, 0.1)', color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={11} /> PDF
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} />
                          {res.date || '2024'}
                        </span>
                      </div>

                      <h3 className="res-title" style={{ marginBottom: '10px' }}>{res.title}</h3>
                      <p className="res-desc" style={{ marginBottom: '16px' }}>{res.description}</p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                        <button 
                          onClick={() => setActiveModalResource(res)} 
                          className="btn btn-secondary" 
                          style={{ flexGrow: 1, padding: '8px', fontSize: '0.85rem' }}
                        >
                          {isText ? <BookOpen size={14} /> : <Eye size={14} />}
                          <span>{isText ? 'வாசிக்க (Read)' : 'விபரம் (View)'}</span>
                        </button>

                        <button 
                          onClick={() => handleDownload(res)} 
                          className="download-btn"
                          style={{ flexGrow: 1, justifyContent: 'center' }}
                        >
                          <Download size={14} />
                          <span>Download</span>
                        </button>
                      </div>

                      <div className="res-meta">
                        <span>{res.file_size || (isText ? 'Text Resource' : 'PDF Document')}</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                          {res.downloads || 0} Downloads
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Resource Detail Modal */}
      {activeModalResource && (
        <div className="modal-overlay">
          <div className="card modal-dialog-card" style={{ maxWidth: isTextResource(activeModalResource) ? '620px' : '520px' }}>
            <button 
              onClick={() => setActiveModalResource(null)} 
              className="icon-btn" 
              style={{ position: 'absolute', top: '16px', right: '16px' }}
            >
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span className="category-tag">{activeModalResource.category}</span>
              {isTextResource(activeModalResource) ? (
                <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <AlignLeft size={12} /> பொது அறிவு உரை வளம் (GK Text Resource)
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', padding: '3px 10px', borderRadius: '12px', background: 'rgba(215, 25, 32, 0.1)', color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FileText size={12} /> PDF ஆவணம்
                </span>
              )}
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '16px', lineHeight: '1.4' }}>
              {activeModalResource.title}
            </h2>

            {isTextResource(activeModalResource) ? (
              /* Text Content Reader View */
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', background: 'var(--bg-light)', padding: '10px 14px', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {activeModalResource.file_size || 'Text'} • {activeModalResource.downloads || 0} பதிவிறக்கங்கள்
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopyText(activeModalResource.description, activeModalResource.id)}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: copiedResId === activeModalResource.id ? '#16a34a' : 'var(--text-main)',
                        fontWeight: 600
                      }}
                      title="முழு உரையை நகலெடு"
                    >
                      {copiedResId === activeModalResource.id ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                      <span>{copiedResId === activeModalResource.id ? 'நகலெடுக்கப்பட்டது!' : 'நகலெடு (Copy)'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePrintText(activeModalResource.title, activeModalResource.description)}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '5px 12px',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        color: 'var(--text-main)',
                        fontWeight: 600
                      }}
                      title="அச்சிடு / PDF ஆக சேமிக்க"
                    >
                      <Printer size={13} />
                      <span>அச்சிடு (Print)</span>
                    </button>
                  </div>
                </div>

                {/* Scrollable Reader Box */}
                <div style={{
                  background: 'var(--bg-light)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  maxHeight: '360px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: '1.8',
                  fontSize: '0.96rem',
                  color: 'var(--text-main)',
                  marginBottom: '20px'
                }}>
                  {activeModalResource.description || 'உரை உள்ளடக்கம் கிடைக்கவில்லை.'}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => handleCopyText(activeModalResource.description, activeModalResource.id)}
                    className="btn btn-secondary"
                    style={{ justifyContent: 'center', padding: '10px' }}
                  >
                    {copiedResId === activeModalResource.id ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                    <span>{copiedResId === activeModalResource.id ? 'நகலெடுக்கப்பட்டது!' : 'உரையை நகலெடு (Copy)'}</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => {
                      handleDownload(activeModalResource);
                      setActiveModalResource(null);
                    }} 
                    className="btn btn-primary" 
                    style={{ justifyContent: 'center', padding: '10px' }}
                  >
                    <Download size={16} />
                    <span>Text கோப்பாகப் பதிவிறக்கு</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Standard PDF View */
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
                  {activeModalResource.description || 'இந்தக் கல்வி வளத்தில் விரிவான பாடக் குறிப்புகள் மற்றும் மாதிரி வினாக்கள் இடம்பெற்றுள்ளன.'}
                </p>

                <div style={{ background: 'var(--bg-light)', padding: '16px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>கோப்பின் பெயர் (File Name):</span>
                    <span style={{ fontWeight: 600 }}>{activeModalResource.file_name || 'Document.pdf'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>கோப்பு அளவு (Size):</span>
                    <span style={{ fontWeight: 600 }}>{activeModalResource.file_size || '3.5 MB'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>மொத்த பதிவிறக்கங்கள் (Downloads):</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{activeModalResource.downloads || 0}</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    handleDownload(activeModalResource);
                    setActiveModalResource(null);
                  }} 
                  className="btn btn-primary" 
                  style={{ width: '100%' }}
                >
                  <Download size={18} />
                  <span>இப்பொழுதே பதிவிறக்கு (Download File Now)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
