import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Plus,
  Search,
  ExternalLink,
  Edit,
  Trash2,
  CheckCircle2,
  Eye,
  Clock,
  BookOpen,
  X,
  Send,
} from 'lucide-react';
import { Article } from '../../types';

export const ArticlesTab: React.FC = () => {
  const { articles, saveArticle, deleteArticle, setCurrentRoute } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('HVAC Maintenance');
  const [author, setAuthor] = useState('Airflow Climate Solutions Engineering Team');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState('5 min read');
  const [coverImage, setCoverImage] = useState('/images/hvac_installation_ac_1794171517489.jpg');
  const [tags, setTags] = useState('Heat Pumps, SEER2, Efficiency, Maintenance');
  const [isPublished, setIsPublished] = useState(true);

  const openNewModal = () => {
    setEditingArticle(null);
    setTitle('');
    setSlug('');
    setCategory('Cooling');
    setAuthor('Airflow Climate Solutions Master Technician Team');
    setExcerpt('');
    setContent('');
    setReadTime('4 min read');
    setCoverImage('/images/hvac_installation_ac_1794171517489.jpg');
    setTags('Air Conditioning, Inverter Systems, Maintenance, Rebates');
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const openEditModal = (art: Article) => {
    setEditingArticle(art);
    setTitle(art.title);
    setSlug(art.slug);
    setCategory(art.category);
    setAuthor(art.author);
    setExcerpt(art.excerpt);
    setContent(art.content);
    setReadTime(art.readTime || '5 min read');
    setCoverImage(art.coverImage || '/images/hvac_installation_ac_1794171517489.jpg');
    setTags(Array.isArray(art.tags) ? art.tags.join(', ') : '');
    setIsPublished(art.isPublished);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingArticle) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: Partial<Article> = {
      ...(editingArticle ? { id: editingArticle.id } : {}),
      title: title.trim(),
      slug: slug.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: category.trim(),
      author: author.trim(),
      excerpt: excerpt.trim() || title.trim(),
      content: content.trim(),
      readTime: readTime.trim(),
      coverImage: coverImage.trim(),
      tags: parsedTags,
      isPublished,
      publishDate: editingArticle?.publishDate || new Date().toISOString().split('T')[0],
      relatedServiceSlugs: editingArticle?.relatedServiceSlugs || ['ac-repair', 'heat-pumps'],
    };

    const success = await saveArticle(payload);
    if (success) {
      setIsModalOpen(false);
    }
  };

  const categories = Array.from(new Set(articles.map((a) => a.category))).filter(Boolean);

  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.excerpt.toLowerCase().includes(search.toLowerCase()) ||
      a.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalArticles = articles.length;
  const publishedCount = articles.filter((a) => a.isPublished).length;
  const draftCount = totalArticles - publishedCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 font-heading">Blog & Educational Articles CMS</h2>
          <p className="text-xs text-slate-500 mt-0.5">Author and manage SEO guides, homeowner troubleshooting tips, and seasonal efficiency advice.</p>
        </div>
        <button
          onClick={openNewModal}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Resources</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">{totalArticles}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Published & Draft Posts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider block">Live on Public Site</span>
          <span className="text-2xl font-extrabold text-emerald-800 font-mono mt-1 block">{publishedCount}</span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Indexed for Organic SEO</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Drafts</span>
          <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">{draftCount}</span>
          <span className="text-[10px] text-slate-400 mt-0.5 block">In review / unpublished</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Topic Categories</span>
          <span className="text-2xl font-extrabold text-blue-900 font-mono mt-1 block">{categories.length}</span>
          <span className="text-[10px] text-blue-600 mt-0.5 block">Efficiency, Repair, IAQ</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            All Categories ({totalArticles})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-blue-700 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search articles by title or topic..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                <img
                  src={art.coverImage || '/images/hvac_installation_ac_1794171517489.jpg'}
                  alt={art.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/90 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider backdrop-blur-xs">
                  {art.category}
                </div>
                <button
                  type="button"
                  onClick={() => saveArticle({ id: art.id, isPublished: !art.isPublished })}
                  className={`absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-xs transition-colors ${
                    art.isPublished
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                  title="Click to toggle publish status"
                >
                  {art.isPublished ? '✓ Published' : 'Draft'}
                </button>
              </div>

              <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <span>{art.publishDate}</span>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{art.readTime}</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 font-heading leading-snug line-clamp-2">
                  {art.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {art.excerpt}
                </p>

                {art.tags && art.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {art.tags.slice(0, 3).map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                onClick={() => setCurrentRoute(`/blog/${art.slug}`)}
                className="text-blue-700 hover:text-blue-800 font-semibold flex items-center gap-1"
                title="View on Public Blog"
              >
                <span>Read Live</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(art)}
                  className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Article"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete article "${art.title}"?`)) {
                      deleteArticle(art.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Article"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No articles found</p>
            <p className="text-xs text-slate-400 mt-0.5">Author your first post or adjust your search filter.</p>
          </div>
        )}
      </div>

      {/* MODAL: CREATE / EDIT ARTICLE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden my-8">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {editingArticle ? `Edit Article` : 'Publish New Educational Resource'}
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">Craft content for homeowner education, SEER2 standards, and search indexing.</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Article Headline *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Inverter Heat Pumps: How Variable Speed Saves 40% on Summer Electric Bills"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">URL Slug</label>
                  <div className="flex items-center">
                    <span className="px-2.5 py-2 bg-slate-100 border border-r-0 border-slate-300 rounded-l-xl text-slate-500 font-mono text-[11px]">
                      /blog/
                    </span>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-r-xl font-mono text-[11px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Energy Efficiency"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Author Byline</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Read Time</label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="e.g. 6 min read"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Summary Excerpt</label>
                <textarea
                  rows={2}
                  required
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Short teaser that appears in search engine result snippets and card listings..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Article Body Content *</label>
                <textarea
                  rows={8}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Detailed article paragraphs, technical benchmarks, diagnostic checklists..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-sans leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cover Image Asset URL</label>
                  <input
                    type="text"
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Heat Pumps, SEER2, Rebates, AC"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishedCheck"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
                <label htmlFor="publishedCheck" className="font-semibold text-slate-800">
                  Publish article live immediately to public blog directory
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{editingArticle ? 'Save Changes' : 'Publish Article'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
