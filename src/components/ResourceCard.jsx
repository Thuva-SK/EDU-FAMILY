import React from 'react';
import { useData } from '../context/DataContext';

export default function ResourceCard({ resource, isHighlighted }) {
  const { isNew, formatDate, showToast, getFile } = useData();

  const shortCategory =
    resource.category === "General Knowledge"
      ? "GK"
      : resource.category
          .split(" ")
          .map((word) => word[0])
          .join("");

  const isPlaceholderLink =
    !resource.link ||
    resource.link === "#" ||
    resource.link.includes("edufamily.vercel.app/resources");

  const downloadName =
    resource.fileName || `${resource.title.replace(/\s+/g, "-").toLowerCase()}.pdf`;

  const triggerBlobDownload = (blobOrFile, name) => {
    const url = URL.createObjectURL(blobOrFile);
    const a = document.createElement("a");
    a.href = url;
    a.download = name || "resource.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownload = async (e) => {
    e.preventDefault();

    // 1. Try IndexedDB file if saved locally
    if (resource.fileId) {
      try {
        const file = await getFile(resource.fileId);
        if (file) {
          triggerBlobDownload(file, downloadName);
          return;
        }
      } catch (err) {
        console.warn("IndexedDB download error:", err);
      }
    }

    // 2. Try Base64 fileData if present
    if (resource.fileData && resource.fileData.startsWith("data:")) {
      try {
        const res = await fetch(resource.fileData);
        const blob = await res.blob();
        triggerBlobDownload(blob, downloadName);
        return;
      } catch (err) {
        console.warn("Base64 download error:", err);
      }
    }

    // 3. Try Remote PDF Link (Supabase Storage or external URL)
    if (resource.link && !isPlaceholderLink) {
      try {
        showToast("Downloading PDF...");
        const response = await fetch(resource.link);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        triggerBlobDownload(blob, downloadName);
        return;
      } catch (err) {
        console.warn("Direct fetch failed, opening URL in new tab:", err);
        window.open(resource.link, "_blank", "noopener,noreferrer");
        return;
      }
    }

    // 4. Fallback if no valid PDF source is available
    showToast("PDF file is not available for download");
  };

  return (
    <article
      id={`resource-${resource.id}`}
      className={`resource-card ${isHighlighted ? 'highlight-pulse' : ''}`}
    >
      <div className="resource-icon" aria-hidden="true">
        {shortCategory}
      </div>
      <div className="meta-row">
        <span className="category-pill">{resource.category}</span>
        {isNew(resource.date) && <span className="badge">New</span>}
      </div>
      <h3>{resource.title}</h3>
      <p>{resource.description}</p>
      <div className="meta-row">
        <span>Uploaded {formatDate(resource.date)}</span>
      </div>
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleDownload}
      >
        Download PDF
      </button>
    </article>
  );
}
