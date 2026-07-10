'use client';

import { useState } from 'react';

export default function ReviewForm({ loadId, targetId, targetName, targetRole }: { 
  loadId: string, 
  targetId: string, 
  targetName: string,
  targetRole: string 
}) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Please select a star rating.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loadId, targetId, rating, comment })
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        if (data.error === 'Already reviewed') {
          setSubmitted(true);
        } else {
          alert('Error submitting review.');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-3xl mb-2">✅</div>
        <div className="text-sm font-bold text-green-700">Review submitted for {targetName}!</div>
        <div className="text-xs text-green-600 mt-1">Thank you for your feedback.</div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
          {targetName.charAt(0)}
        </div>
        <div>
          <div className="font-bold text-gray-900 text-sm">{targetName}</div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">{targetRole}</div>
        </div>
      </div>

      {/* Star Rating */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Rate your experience</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button 
              key={star}
              type="button"
              onMouseEnter={() => setHoveredStar(star)}
              onMouseLeave={() => setHoveredStar(0)}
              onClick={() => setRating(star)}
              className="text-3xl transition-transform hover:scale-110"
            >
              {star <= (hoveredStar || rating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Leave a comment (optional)</label>
        <textarea 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was your experience working with this company?"
          rows={3}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-900 focus:outline-none focus:border-brand-500 resize-none"
        />
      </div>

      {/* Submit */}
      <button 
        onClick={handleSubmit}
        disabled={loading || rating === 0}
        className="w-full bg-brand-600 hover:bg-brand-500 text-gray-900 font-bold py-3 rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-md"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}
