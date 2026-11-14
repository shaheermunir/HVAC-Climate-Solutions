import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ChevronLeft,
  Calendar,
  Clock,
  User,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface ArticleDetailPageProps {
  slug: string;
}

export const ArticleDetailPage: React.FC<ArticleDetailPageProps> = ({ slug }) => {
  const { articles, services, openBookingModal, setCurrentRoute } = useApp();

  const article = articles.find((a) => a.slug === slug) || articles[0];

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Article Not Found</h2>
        <button
          onClick={() => setCurrentRoute('/blog')}
          className="text-blue-700 hover:underline text-sm font-semibold"
        >
          Return to Blog
        </button>
      </div>
    );
  }

  const relatedServices = services.filter((s) => (article.relatedServiceSlugs || []).includes(s.slug));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Back button */}
      <button
        onClick={() => setCurrentRoute('/blog')}
        className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Back to All Educational Guides</span>
      </button>

      {/* Header */}
      <div className="space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
          {article.category}
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-b border-slate-200 pb-4">
          <span className="font-semibold text-slate-700">By {article.author}</span>
          <span>·</span>
          <span>Published on {article.publishDate}</span>
          <span>·</span>
          <span>{article.readTime}</span>
        </div>
      </div>

      {/* Featured Image */}
      {article.coverImage && (
        <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 max-h-96">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Safety Advisory Banner */}
      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="block text-amber-950 mb-0.5">HVAC Safety Warning:</strong>
          This article is intended for homeowner troubleshooting and education. Never open sealed refrigerant circuits,
          handle high-voltage capacitors, or disassemble gas burner assemblies without EPA and NATE credentials.
        </div>
      </div>

      {/* Article Body */}
      <div className="prose prose-slate max-w-none text-xs sm:text-sm leading-relaxed text-slate-700 space-y-4 whitespace-pre-line">
        {article.content}
      </div>

      {/* Tags */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tags:</span>
        {(article.tags || []).map((t) => (
          <span key={t} className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
            #{t}
          </span>
        ))}
      </div>

      {/* Related Services Callout */}
      {relatedServices.length > 0 && (
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm font-heading">Need Professional Assistance?</h3>
          <p className="text-xs text-slate-600">
            Our certified master technicians provide upfront flat-rate diagnostics and same-day repairs.
          </p>
          <div className="flex flex-wrap gap-3">
            {relatedServices.map((srv) => (
              <button
                key={srv.id}
                onClick={() => openBookingModal(srv.id)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Schedule {srv.name}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
