import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

export default function NewsCard({ article, onReadMore, isHighlighted }) {
  const { isNew, formatDate, getFileUrl } = useData();
  const [imageUrl, setImageUrl] = useState(article.imageData || "");

  useEffect(() => {
    let active = true;
    if (!article.imageData && article.imageFileId) {
      getFileUrl(article.imageFileId).then((url) => {
        if (active && url) setImageUrl(url);
      });
    }
    return () => {
      active = false;
    };
  }, [article.imageData, article.imageFileId, getFileUrl]);

  return (
    <article
      id={`news-${article.id}`}
      className={`news-card ${isHighlighted ? 'highlight-pulse' : ''}`}
    >
      <div className="news-image" aria-hidden={!imageUrl}>
        {imageUrl ? (
          <img src={imageUrl} alt={`${article.title} news image`} />
        ) : (
          "Education News"
        )}
      </div>
      <div className="meta-row">
        <span>{formatDate(article.date)}</span>
        {isNew(article.date) && <span className="badge">New</span>}
      </div>
      <h3>{article.title}</h3>
      <p>{article.summary}</p>
      <button className="btn btn-secondary" type="button" onClick={() => onReadMore(article)}>
        Read More
      </button>
    </article>
  );
}
