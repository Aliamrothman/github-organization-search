import React, { useState } from 'react';
import { searchOrganizationRepos } from '../services/githubService';
import { Card, Input, Button, Select, Spin, Empty, message } from 'antd';
import { SearchOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import '../styles/SearchPage.css';

const { Option } = Select;

function getInitial(name) {
  return name && name.length > 0 ? name[0].toUpperCase() : '?';
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' });
  return `${day} ${month}`;
}

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [languages, setLanguages] = useState(['all']);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const data = await searchOrganizationRepos(searchTerm);
      if (!data || data.length === 0) {
        message.warning('No repositories found for this organization.');
        setRepos([]);
        setLanguages(['all']);
        setSelectedLanguage('all');
        return;
      }
      setRepos(data);
      const uniqueLanguages = [...new Set(data.map(repo => repo.language).filter(Boolean))];
      setLanguages(['all', ...uniqueLanguages]);
      setSelectedLanguage('all');
    } catch (error) {
      console.error('Search error:', error);
      setRepos([]);
      setLanguages(['all']);
      setSelectedLanguage('all');
      if (error.message === 'Organization not found') {
        message.error('Organization not found. Please check the name and try again.');
      } else if (error.message.includes('401')) {
        message.error('Authentication error. Please try again later.');
      } else if (error.message.includes('403') || error.message.includes('Rate limit')) {
        message.error('Rate limit exceeded. Please try again later.');
      } else {
        message.error('An error occurred while searching. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = selectedLanguage === 'all'
    ? repos
    : repos.filter(repo => repo.language === selectedLanguage);

  const handleRepoClick = (repo) => {
    navigate({
      to: '/org/$org/repo/$repo',
      params: { org: repo.owner.login, repo: repo.name }
    });
  };

  return (
    <div className="search-page">
      <div className="search-bar-row">
        <Input
          placeholder="Enter organization name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onPressEnter={handleSearch}
          className="search-input-custom"
        />
        <Button
          className="search-btn-custom"
          onClick={handleSearch}
          icon={<SearchOutlined style={{ fontSize: 22 }} />}
        />
      </div>
      <div className="repos-header-row">
        <h2 className="repos-title">Repositories</h2>
        {repos.length > 0 && (
          <Card className="languages-card" bordered={true} bodyStyle={{ padding: 0 }}>
            <Select
              value={selectedLanguage}
              onChange={setSelectedLanguage}
              className="languages-select"
              bordered={false}
              dropdownClassName="languages-dropdown"
            >
              {languages.map(lang => (
                <Option key={lang} value={lang}>
                  {lang === 'all' ? 'Languages' : lang}
                </Option>
              ))}
            </Select>
          </Card>
        )}
      </div>
      {loading ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : (
        <div className="repos-list-custom">
          {filteredRepos.length > 0 ? (
            filteredRepos.map(repo => (
              <Card
                key={repo.id}
                className="repo-card-custom"
                bordered={true}
                bodyStyle={{ padding: 20 }}
                onClick={() => handleRepoClick(repo)}
                style={{ cursor: 'pointer' }}
              >
                <div className="repo-card-content">
                  {repo.owner.avatar_url ? (
                    <img
                      src={repo.owner.avatar_url}
                      alt={repo.owner.login}
                      className="repo-avatar-large"
                    />
                  ) : (
                    <div className="repo-avatar-fallback">
                      {getInitial(repo.name)}
                    </div>
                  )}
                  <div className="repo-main-info">
                    <div className="repo-name-custom">{repo.name}</div>
                    <div className="repo-owner-custom">{repo.owner.login}</div>
                    <div className="repo-meta-row">
                      <span className="repo-stars-custom">
                        <StarFilled style={{ color: '#FFA940', marginRight: 4, fontSize: 18 }} />
                        {repo.stargazers_count}
                      </span>
                      <span className="repo-updated-custom">
                        Updated {formatDate(repo.updated_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Empty description="No repositories found" />
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;