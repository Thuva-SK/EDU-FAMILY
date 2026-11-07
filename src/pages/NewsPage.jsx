import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import NewsCard from '../components/NewsCard';
import NewsModal from '../components/NewsModal';

export default function NewsPage() {
  const { news, isNew, formatDate, getFileUrl } = useData();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [clockText, setClockText] = useState('');
  const [topStoryImageUrl, setTopStoryImageUrl] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const articleId = params.get('id') || params.get('article');
    const q = params.get('search');
    if (articleId && news.length > 0) {
      const found = news.find((item) => String(item.id) === String(articleId));
      if (found) {
        setSelectedArticle(found);
        setHighlightedId(found.id);
        setTimeout(() => {
          const el = document.getElementById(`news-${found.id}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 200);
      }
    } else if (q) {
      setSearchTerm(q);
    }
  }, [location.search, news]);

  useEffect(() => {
    const updateClock = () => {
      const formatted = new Intl.DateTimeFormat("en", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      }).format(new Date());
      setClockText(formatted);
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const sortedNews = useMemo(() => {
    return [...news].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [news]);

  const topStory = useMemo(() => {
    return sortedNews.find((item) => item.featured) || sortedNews[0];
  }, [sortedNews]);

  useEffect(() => {
    let active = true;
    if (topStory) {
      if (topStory.imageData) {
        setTopStoryImageUrl(topStory.imageData);
      } else if (topStory.imageFileId) {
        getFileUrl(topStory.imageFileId).then((url) => {
          if (active) setTopStoryImageUrl(url);
        });
      } else {
        setTopStoryImageUrl('');
      }
    }
    return () => {
      active = false;
    };
  }, [topStory, getFileUrl]);

  const filteredNews = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sortedNews.filter((item) =>
      `${item.title} ${item.summary} ${item.body}`.toLowerCase().includes(term)
    );
  }, [sortedNews, searchTerm]);

  return (
    <main>
      <section className="page-hero section-pad">
        <div className="container reveal visible">
          <span className="eyebrow">Education news desk</span>
          <h1>Latest Academic News and Announcements</h1>
          <p>
            Follow featured stories, exam alerts, scholarship updates, and education opportunities in a clean news reading experience.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="container">
          <div className="toolbar reveal visible">
            <input
              id="newsSearch"
              type="search"
              placeholder="Search news by title or summary"
              aria-label="Search news"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="live-clock" aria-live="polite">
              {clockText || 'Loading current time...'}
            </div>
          </div>

          {topStory && (
            <article className="featured-news reveal visible" id="featuredNews">
              <div className="news-image" aria-hidden={!topStoryImageUrl}>
                {topStoryImageUrl ? (
                  <img src={topStoryImageUrl} alt={`${topStory.title} featured news image`} />
                ) : (
                  'Top Story'
                )}
              </div>
              <div>
                <span className="eyebrow">Featured News</span>
                <h2>{topStory.title}</h2>
                <p>{topStory.summary}</p>
                <div className="meta-row">
                  <span>{formatDate(topStory.date)}</span>
                  {isNew(topStory.date) && <span className="badge">New</span>}
                </div>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => setSelectedArticle(topStory)}
                >
                  Read More
                </button>
              </div>
            </article>
          )}

          <div className="section-heading reveal visible">
            <span className="eyebrow">Auto-updating feed</span>
            <h2>Latest News</h2>
          </div>

          <div className="news-grid" id="newsGrid" aria-live="polite">
            {filteredNews.length > 0 ? (
              filteredNews.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onReadMore={setSelectedArticle}
                  isHighlighted={article.id === highlightedId}
                />
              ))
            ) : (
              <div className="empty-state">No news articles found.</div>
            )}
          </div>
        </div>
      </section>

      <NewsModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
    </main>
  );
}
