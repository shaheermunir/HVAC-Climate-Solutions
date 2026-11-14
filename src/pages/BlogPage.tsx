import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, Calendar, ArrowRight, Tag } from 'lucide-react';

export const BlogPage: React.FC = () => {
  const { articles, setCurrentRoute } = useApp();
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const allTags = ['all', 'AC Repair', 'Heat Pumps', 'Energy Efficiency', 'Troubleshooting', 'Buying Guide'];

  const filteredArticles = articles.filter((a) => {
    if (!a.isPublished) return false;
    if (selectedTag === 'all') return true;
    return a.tags.some((t) => t.toLowerCase().includes(selectedTag.toLowerCase()));
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
          Educational Resource Center
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
          HVAC Knowledge & Homeowner Guides
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          Written by certified master technicians to help you troubleshoot common climate issues, understand efficiency ratings, and maximize heating and cooling equipment lifespan.
        </p>
      </div>

      {/* Tag Filters */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {allTags.map((t) => (
          <button
            key={t}
            onClick={() => setSelectedTag(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedTag === t
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {t === 'all' ? 'All Guides' : t}
          </button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredArticles.map((art) => (
          <div
            key={art.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-48 bg-slate-100 overflow-hidden">
                <img
                  src={art.coverImage || '/images/hero_hvac_technician_1794171516085.jpg'}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-900/90 text-white text-[10px] font-bold rounded">
                  {art.category}
                </div>
              </div>

              <div className="p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                  <span>{art.publishDate}</span>
                  <span>·</span>
                  <span>{art.readTime}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors font-heading leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{art.excerpt}</p>
              </div>
            </div>

            <div className="p-6 pt-0 border-t border-slate-100 flex items-center justify-between mt-4">
              <span className="text-[11px] text-slate-400 font-medium">By {art.author.split(',')[0]}</span>
              <button
                onClick={() => setCurrentRoute(`/blog/${art.slug}`)}
                className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
              >
                <span>Read Full Article</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
