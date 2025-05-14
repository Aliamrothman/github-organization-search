import React, { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { searchRepositories } from '../services/githubService';
import { FaSearch } from 'react-icons/fa';
import '../styles/SearchPage.css';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const search = useSearch();

  // استعادة نتائج البحث عند تحميل الصفحة
  useEffect(() => {
    const savedResults = sessionStorage.getItem('searchResults');
    const savedQuery = sessionStorage.getItem('searchQuery');
    
    if (savedResults && savedQuery) {
      setSearchResults(JSON.parse(savedResults));
      setQuery(savedQuery);
    }
  }, []);

  // حفظ النتائج عند تغييرها
  useEffect(() => {
    if (searchResults.length > 0) {
      sessionStorage.setItem('searchResults', JSON.stringify(searchResults));
      sessionStorage.setItem('searchQuery', query);
    }
  }, [searchResults, query]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const results = await searchRepositories(query);
      setSearchResults(results);
      // تحديث URL مع كلمة البحث
      navigate({
        search: (prev) => ({ ...prev, q: query })
      });
    } catch (err) {
      setError('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRepoClick = (repo) => {
    // حفظ النتائج قبل الانتقال
    sessionStorage.setItem('searchResults', JSON.stringify(searchResults));
    sessionStorage.setItem('searchQuery', query);
    navigate({
      to: '/org/$org/repo/$repo',
      params: {
        org: repo.owner.login,
        repo: repo.name
      }
    });
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مستودعات GitHub..."
              className="search-input"
            />
          </div>
          <button type="submit" className="search-button" disabled={loading}>
            {loading ? 'جاري البحث...' : 'بحث'}
          </button>
        </form>

        {error && <div className="error-message">{error}</div>}

        <div className="results-container">
          {searchResults.map((repo) => (
            <div
              key={repo.id}
              className="repo-card"
              onClick={() => handleRepoClick(repo)}
            >
              <h3>{repo.name}</h3>
              <p>{repo.description || 'لا يوجد وصف'}</p>
              <div className="repo-stats">
                <span>⭐ {repo.stargazers_count}</span>
                <span>🔀 {repo.forks_count}</span>
                <span>👁️ {repo.watchers_count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage; 