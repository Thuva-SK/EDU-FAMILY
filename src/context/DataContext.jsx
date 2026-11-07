import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { saveFile, getFile, getFileUrl } from '../services/indexedDb';

const DataContext = createContext();

const RESOURCE_KEY = 'eduFamily.resources';
const NEWS_KEY = 'eduFamily.news';
const STORAGE_EVENT = 'eduFamily.updated';
const LEGACY_DOMAIN = 'https://edufamiy.vercel.app';
const BUCKET_NAME = 'resources';

export function DataProvider({ children }) {
  const [resources, setResources] = useState(() => {
    try {
      const stored = localStorage.getItem(RESOURCE_KEY);
      if (!stored) return [];
      const items = JSON.parse(stored);
      // Purge old legacy mock items from local storage
      const valid = items.filter((r) => r.link && !r.link.includes(LEGACY_DOMAIN) && !r.fileData);
      if (valid.length !== items.length) {
        localStorage.setItem(RESOURCE_KEY, JSON.stringify(valid));
      }
      return valid;
    } catch {
      return [];
    }
  });

  const [news, setNews] = useState(() => {
    try {
      const stored = localStorage.getItem(NEWS_KEY);
      if (!stored) return [];
      const items = JSON.parse(stored);
      // Purge old legacy mock news articles from local storage
      const valid = items.filter((n) => !n.imageData?.startsWith("data:") && !n.imageFileId);
      if (valid.length !== items.length) {
        localStorage.setItem(NEWS_KEY, JSON.stringify(valid));
      }
      return valid;
    } catch {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  const notifyUpdate = useCallback(() => {
    localStorage.setItem(STORAGE_EVENT, String(Date.now()));
  }, []);

  const syncFromSupabase = useCallback(async () => {
    try {
      const [resRes, newsRes] = await Promise.all([
        supabase.from("resources").select("*").order("id", { ascending: false }),
        supabase.from("news").select("*").order("id", { ascending: false })
      ]);

      const dbResources = resRes.data;
      const dbNews = newsRes.data;

      if (Array.isArray(dbResources)) {
        setResources((prev) => {
          const dbIds = new Set(dbResources.map((r) => r.id));
          // Only preserve genuinely unsynced local files waiting to upload (fileId)
          const unsyncedLocal = prev.filter((r) => !dbIds.has(r.id) && r.fileId);
          const merged = [...dbResources, ...unsyncedLocal];
          localStorage.setItem(RESOURCE_KEY, JSON.stringify(merged));
          return merged;
        });
      }

      if (Array.isArray(dbNews)) {
        setNews((prev) => {
          const dbIds = new Set(dbNews.map((n) => n.id));
          // Only preserve genuinely unsynced local images waiting to upload (imageFileId)
          const unsyncedLocal = prev.filter((n) => !dbIds.has(n.id) && n.imageFileId);
          const merged = [...dbNews, ...unsyncedLocal];
          localStorage.setItem(NEWS_KEY, JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.warn("Supabase Sync Error:", err);
    }
  }, []);  useEffect(() => {
    let cancelled = false;

    const loadCachedState = () => {
      try {
        const cachedResources = localStorage.getItem(RESOURCE_KEY);
        const cachedNews = localStorage.getItem(NEWS_KEY);

        if (!cachedResources || !cachedNews) {
          return false;
        }

        const parsedResources = JSON.parse(cachedResources);
        const parsedNews = JSON.parse(cachedNews);

        if (!Array.isArray(parsedResources) || !Array.isArray(parsedNews)) {
          return false;
        }

        if (parsedResources.length === 0 && parsedNews.length === 0) {
          return false;
        }

        if (Array.isArray(parsedResources)) setResources(parsedResources);
        if (Array.isArray(parsedNews)) setNews(parsedNews);

        return true;
      } catch (err) {
        console.warn("Storage sync parse error", err);
        return false;
      }
    };

    if (!loadCachedState()) {
      syncFromSupabase().catch((err) => console.warn("Supabase Sync Error:", err));
    }

    const handleStorageChange = (e) => {
      if (!e || [RESOURCE_KEY, NEWS_KEY, STORAGE_EVENT].includes(e.key)) {
        try {
          const cachedResources = localStorage.getItem(RESOURCE_KEY);
          const cachedNews = localStorage.getItem(NEWS_KEY);

          if (cachedResources) {
            const parsedResources = JSON.parse(cachedResources);
            if (Array.isArray(parsedResources)) setResources(parsedResources);
          }

          if (cachedNews) {
            const parsedNews = JSON.parse(cachedNews);
            if (Array.isArray(parsedNews)) setNews(parsedNews);
          }
        } catch (err) {
          console.warn("Storage sync parse error", err);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  }, [syncFromSupabase]);

  const saveResourcesState = async (newResources, deletedId = null) => {
    setResources(newResources);
    localStorage.setItem(RESOURCE_KEY, JSON.stringify(newResources));
    notifyUpdate();

    try {
      if (deletedId) {
        const { error } = await supabase.from("resources").delete().eq("id", String(deletedId));
        if (error) {
          console.error("Supabase delete error:", error);
          showToast("Cloud delete warning: " + (error.message || error.details || "Check DB RLS permissions"));
        } else {
          await syncFromSupabase();
        }
      } else {
        const cleanResources = newResources.map(({ fileData, ...r }) => r);
        const { error } = await supabase.from("resources").upsert(cleanResources);
        if (error) {
          console.error("Supabase upsert error:", error);
          showToast("Saved locally. Cloud Sync Error: " + (error.message || "Check DB permissions"));
        } else {
          await syncFromSupabase();
        }
      }
    } catch (err) {
      console.error("Supabase resources sync failed:", err);
    }
  };

  const saveNewsState = async (newNews, deletedId = null) => {
    setNews(newNews);
    localStorage.setItem(NEWS_KEY, JSON.stringify(newNews));
    notifyUpdate();

    try {
      if (deletedId) {
        const { error } = await supabase.from("news").delete().eq("id", String(deletedId));
        if (error) {
          console.error("Supabase news delete error:", error);
          showToast("Cloud delete warning: " + (error.message || error.details || "Check DB RLS permissions"));
        } else {
          await syncFromSupabase();
        }
      } else {
        const { error } = await supabase.from("news").upsert(newNews);
        if (error) {
          console.error("Supabase news upsert error:", error);
          showToast("Saved locally. Cloud Sync Error: " + (error.message || "Check DB permissions"));
        } else {
          await syncFromSupabase();
        }
      }
    } catch (err) {
      console.error("Supabase news sync failed:", err);
    }
  };

  const autoSyncLocalToSupabase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let syncNeeded = false;
      const pendingResources = resources.filter((r) => r.fileId);
      const pendingNews = news.filter((n) => n.imageFileId);

      if (pendingResources.length === 0 && pendingNews.length === 0) {
        return;
      }

      for (const item of pendingResources) {
        try {
          const file = await getFile(item.fileId);
          if (file) {
            const storageId = `resource-${item.id}-${Date.now()}`;
            const filePath = `pdfs/${storageId}.pdf`;
            const { error: uploadError } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(filePath, file, { contentType: "application/pdf", upsert: true });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
              if (urlData && urlData.publicUrl) {
                const cleanItem = {
                  id: item.id,
                  title: item.title,
                  category: item.category,
                  description: item.description,
                  date: item.date,
                  link: urlData.publicUrl,
                  fileName: item.fileName || ""
                };
                const { error: upsertErr } = await supabase.from("resources").upsert(cleanItem);
                if (!upsertErr) syncNeeded = true;
              }
            }
          }
        } catch (e) {
          console.warn("AutoSync file error:", e);
        }
      }

      for (const item of pendingNews) {
        try {
          const file = await getFile(item.imageFileId);
          if (file) {
            const ext = (file.name || "image.jpg").split(".").pop();
            const storageId = `news-image-${item.id}-${Date.now()}`;
            const filePath = `news/${storageId}.${ext}`;
            const { error: uploadError } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(filePath, file, { contentType: file.type || "image/jpeg", upsert: true });
            if (!uploadError) {
              const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
              if (urlData && urlData.publicUrl) {
                const cleanItem = {
                  id: item.id,
                  title: item.title,
                  summary: item.summary,
                  body: item.body,
                  date: item.date,
                  featured: item.featured || false,
                  imageData: urlData.publicUrl,
                  imageName: item.imageName || ""
                };
                const { error: upsertErr } = await supabase.from("news").upsert(cleanItem);
                if (!upsertErr) syncNeeded = true;
              }
            }
          }
        } catch (e) {
          console.warn("AutoSync image error:", e);
        }
      }

      if (syncNeeded) {
        await syncFromSupabase();
        showToast("Auto-synced local offline uploads to Supabase Cloud");
      }
    } catch (syncErr) {
      console.warn("AutoSync Error:", syncErr);
    }
  };

  const isNew = (dateString) => {
    if (!dateString) return false;
    const uploaded = new Date(dateString);
    const diff = (Date.now() - uploaded.getTime()) / 86400000;
    return diff <= 7;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric" }).format(new Date(dateString));
  };

  return (
    <DataContext.Provider
      value={{
        resources,
        news,
        toastMessage,
        showToast,
        saveResourcesState,
        saveNewsState,
        autoSyncLocalToSupabase,
        isNew,
        formatDate,
        saveFile,
        getFile,
        getFileUrl
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
