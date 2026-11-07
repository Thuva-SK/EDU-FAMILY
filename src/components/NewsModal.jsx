import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

export default function NewsModal({ article, onClose }) {
  const { formatDate, getFileUrl } = useData();
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    let active = true;
    if (article) {
      if (article.imageData) {
        setImageUrl(article.imageData);
      } else if (article.imageFileId) {
        getFileUrl(article.imageFileId).then((url) => {
          if (active) setImageUrl(url);
        });
      } else {
        setImageUrl("");
      }
    }
    return () => {
      active = false;
    };
  }, [article, getFileUrl]);

  if (!article) return null;

  return (
    <div className="modal open" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
      <div className="modal-dialog">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Close modal">
          ×
        </button>
        <div id="modalContent">
          <span className="eyebrow">Education News</span>
          <h2 id="modalTitle">{article.title}</h2>
          {imageUrl && (
            <div className="news-image modal-news-image">
              <img src={imageUrl} alt={`${article.title} news image`} />
            </div>
          )}
          <div className="meta-row">
            <span>{formatDate(article.date)}</span>
          </div>
          <p>{article.body}</p>
        </div>
      </div>
    </div>
  );
}
