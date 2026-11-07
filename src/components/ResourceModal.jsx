import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { supabase } from '../services/supabaseClient';

const BUCKET_NAME = "resources";

export default function ResourceModal({ resource, isOpen, onClose }) {
  const { resources, saveResourcesState, showToast, saveFile } = useData();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Notes');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [file, setFile] = useState(null);
  const [fileHelpText, setFileHelpText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (resource) {
      setTitle(resource.title || '');
      setCategory(resource.category || 'Notes');
      setDescription(resource.description || '');
      setDate(resource.date || new Date().toISOString().slice(0, 10));
      setFile(null);
      setFileHelpText(
        resource.fileName
          ? `Current PDF: ${resource.fileName}. Upload a new PDF to replace it.`
          : "This resource uses a published PDF link. Upload a PDF to replace it."
      );
    } else {
      setTitle('');
      setCategory('Notes');
      setDescription('');
      setDate(new Date().toISOString().slice(0, 10));
      setFile(null);
      setFileHelpText(
        "Choose a PDF file up to 30 MB. Existing PDFs stay attached when editing unless you upload a new one."
      );
    }
  }, [resource, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const id = resource ? resource.id : `res-${Date.now()}`;
    const existing = resource || {};

    if (file && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Please upload a PDF file");
      setIsSubmitting(false);
      return;
    }

    if (file && file.size > 30 * 1024 * 1024) {
      showToast("PDF is too large. Please use a file under 30 MB.");
      setIsSubmitting(false);
      return;
    }

    let fileData = existing.fileData || "";
    let fileName = existing.fileName || "";
    let fileId = existing.fileId || "";
    let link = existing.link || "";

    if (file) {
      try {
        const storageId = `resource-${id}-${Date.now()}`;
        const filePath = `pdfs/${storageId}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, file, { contentType: "application/pdf", upsert: true });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
        link = urlData ? urlData.publicUrl : "";
        fileData = "";
        fileName = file.name;
        fileId = "";
      } catch (storageError) {
        console.warn("Supabase Storage upload failed, falling back to IndexedDB:", storageError);
        try {
          fileId = `resource-${id}-${Date.now()}`;
          await saveFile(fileId, file);
          fileData = "";
          fileName = file.name;
          link = "";
        } catch (localError) {
          showToast("Could not save the PDF file");
          setIsSubmitting(false);
          return;
        }
      }
    }

    const payload = {
      id,
      title: title.trim(),
      category,
      description: description.trim(),
      date,
      link,
      fileData,
      fileName,
      fileId
    };

    const updated = [...resources];
    const index = updated.findIndex((item) => item.id === id);
    if (index >= 0) {
      updated[index] = payload;
    } else {
      updated.unshift(payload);
    }

    await saveResourcesState(updated);
    showToast(index >= 0 ? "Resource updated" : "Resource added");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="resourceModalTitle">
      <div className="modal-dialog">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close modal">
          ×
        </button>
        <form className="modal-form" onSubmit={handleSubmit}>
          <h2 id="resourceModalTitle">{resource ? 'Edit Resource' : 'Add Resource'}</h2>
          
          <label htmlFor="resourceTitle">Title</label>
          <input
            id="resourceTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label htmlFor="resourceCategory">Category</label>
          <select
            id="resourceCategory"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="Notes">Notes</option>
            <option value="Past Papers">Past Papers</option>
            <option value="General Knowledge">General Knowledge</option>
          </select>

          <label htmlFor="resourceDescription">Short Description</label>
          <textarea
            id="resourceDescription"
            rows="4"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          ></textarea>

          <label htmlFor="resourceDate">Upload Date</label>
          <input
            id="resourceDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <label htmlFor="resourceFile">Upload PDF File</label>
          <input
            id="resourceFile"
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setFile(e.target.files[0] || null)}
          />
          <p className="form-help" id="resourceFileHelp">
            {fileHelpText}
          </p>

          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Resource'}
          </button>
        </form>
      </div>
    </div>
  );
}
