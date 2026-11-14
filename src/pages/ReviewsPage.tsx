import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Star, CheckCircle2, MessageSquarePlus, Filter } from 'lucide-react';

export const ReviewsPage: React.FC = () => {
  const { reviews, submitReview, getPage, getPageSection } = useApp();

  const reviewsPage = getPage('reviews') || getPage('/reviews');
  const heroSec = getPageSection('/reviews', 'hero') || reviewsPage?.sections[0];

  const [filterCategory, setFilterCategory] = useState('all');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [city, setCity] = useState('Metro Area');
  const [rating, setRating] = useState(5);
  const [serviceCategory, setServiceCategory] = useState('AC Repair');
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['all', 'AC Repair', 'AC Installation', 'Maintenance Plan', 'Ductwork Services', 'Commercial HVAC'];

  const filteredReviews = reviews.filter((r) => {
    if (r.status !== 'approved') return false;
    if (filterCategory === 'all') return true;
    return r.serviceCategory.toLowerCase().includes(filterCategory.toLowerCase());
  });

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName || !text) return;

    setIsSubmitting(true);
    await submitReview({
      authorName,
      city,
      rating,
      serviceCategory,
      text,
    });
    setIsSubmitting(false);
    setShowSubmitModal(false);
    setText('');
    setAuthorName('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Header with Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">
            {heroSec?.kicker || 'Real Homeowner Experiences'}
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-heading">
            {heroSec?.heading || 'Verified Customer Reviews'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
            {heroSec?.subheading || 'We measure our success by the comfort and trust of our valued community members. Every review represents genuine diagnostic and installation craftsmanship.'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-6 shrink-0">
          <div>
            <div className="text-3xl font-black text-slate-900 font-mono">4.9</div>
            <div className="flex text-amber-500 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
              ))}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">384+ Verified Ratings</span>
          </div>

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Leave a Review</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterCategory === c
                ? 'bg-blue-700 text-white shadow-2xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {c === 'all' ? 'All Services' : c}
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReviews.map((rev) => (
          <div
            key={rev.id}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex text-amber-500">
                  {[...Array(rev.rating)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                  ))}
                </div>
                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {rev.source}
                </span>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed italic mb-4">"{rev.text}"</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{rev.authorName}</span>
                <span className="text-[11px] text-slate-500">{rev.city} · {rev.date}</span>
              </div>
              <span className="text-[11px] text-blue-700 font-semibold">{rev.serviceCategory}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Review Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-heading">Submit Verified Review</h3>
            <p className="text-xs text-slate-500">
              Share your feedback regarding our technician's arrival, diagnostic accuracy, and workmanship.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jessica M."
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">City / Area</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Service</label>
                  <select
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden bg-white"
                  >
                    <option value="AC Repair">AC Repair</option>
                    <option value="AC Installation">AC Installation</option>
                    <option value="Furnace & Heating">Furnace & Heating</option>
                    <option value="Maintenance Plan">Maintenance Plan</option>
                    <option value="Ductwork Services">Ductwork Services</option>
                    <option value="Commercial HVAC">Commercial HVAC</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-2 rounded-lg border flex items-center justify-center ${
                        rating >= star ? 'border-amber-400 bg-amber-50 text-amber-500' : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Your Review *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your service experience..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-blue-600 outline-hidden"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
