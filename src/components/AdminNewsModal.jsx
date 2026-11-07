import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabaseClient';

const BUCKET_NAME = "resources";

export default function AdminNewsModal({ article, isOpen, onClose }) {
  const { news, saveNewsState, showToast, saveFile } = useData();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [featured, setFeatured] = useState(false);
  const [image, setImage] = useState(null);
  const [imageHelpText, setImageHelpText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setSummary(article.summary || '');
      setBody(article.body || '');
      setDate(article.date || new Date().toISOString().slice(0, 10));
      setFeatured(!!article.featured);
      setImage(null);
      setImageHelpText(
        article.imageName
          ? `Current image: ${article.imageName}. Upload a new image to replace it.`
          : "No image uploaded yet. Add an image to show it on the news page."
      );
    } else {
      setTitle('');
      setSummary('');
      setBody('');
      setDate(new Date().toISOString().slice(0, 10));
      setFeatured(false);
      setImage(null);
      setImageHelpText(
        "Choose a JPG, PNG, or WebP image up to 5 MB. Existing images stay attached when editing unless you upload a new one."
      );
    }
  }, [article, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const id = article ? article.id : `news-${Date.now()}`;
    const existing = article || {};

    if (image && !image.type.startsWith("image/")) {
      showToast("Please upload an image file");
      setIsSubmitting(false);
      return;
    }

    if (image && image.size > 5 * 1024 * 1024) {
      showToast("Image is too large. Please use an image under 5 MB.");
      setIsSubmitting(false);
      return;
    }

    let imageData = existing.imageData || "";
    let imageName = existing.imageName || "";
    let imageFileId = existing.imageFileId || "";

    if (image) {
      try {
        const storageId = `news-image-${id}-${Date.now()}`;
        const ext = image.name.split(".").pop() || "jpg";
        const filePath = `news/${storageId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, image, { contentType: image.type, upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        imageData = urlData ? urlData.publicUrl : "";
        imageName = image.name;
        imageFileId = "";
      } catch (storageError) {
        console.warn("Supabase Storage image upload failed, falling back to IndexedDB:", storageError);
        try {
          imageFileId = `news-image-${id}-${Date.now()}`;
          await saveFile(imageFileId, image);
          imageData = "";
          imageName = image.name;
        } catch (localError) {
          showToast("Could not save the image file");
          setIsSubmitting(false);
          return;
        }
      }
    }

    const payload = {
      id,
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim(),
      date,
      featured,
      imageData,
      imageName,
      imageFileId
    };

    let updatedNews = news.map((item) => (featured ? { ...item, featured: false } : item));
    const index = updatedNews.findIndex((item) => item.id === id);

    if (index >= 0) {
      updatedNews[index] = payload;
    } else {
      updatedNews.unshift(payload);
    }

    await saveNewsState(updatedNews);
    showToast(index >= 0 ? "News article updated" : "News article added");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="newsModalTitle">
      <div className="modal-dialog">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close modal">
          ×
        </button>
        <form className="modal-form" onSubmit={handleSubmit}>
          <h2 id="newsModalTitle">{article ? 'Edit News Article' : 'Add News Article'}</h2>
          
          <label htmlFor="newsTitle">Headline</label>
          <input
            id="newsTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label htmlFor="newsSummary">Summary</label>
          <textarea
            id="newsSummary"
            rows="3"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            required
          ></textarea>

          <label htmlFor="newsBody">Full Article</label>
          <textarea
            id="newsBody"
            rows="6"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          ></textarea>

          <label htmlFor="newsDate">Publish Date</label>
          <input
            id="newsDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <label htmlFor="newsImage">Upload News Image</label>
          <input
            id="newsImage"
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0] || null)}
          />
          <p className="form-help" id="newsImageHelp">
            {imageHelpText}
          </p>

          <label className="checkbox-line">
            <input
              id="newsFeatured"
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
            />
            Featured story
          </label>

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save News'}
          </button>
        </form>
      </div>
    </div>
  );
}
