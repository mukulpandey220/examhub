import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Wrench, Clock, Send } from 'lucide-react';
import { ReviewStatus, ProctoringEvent } from '../../types/index.js';
import { api } from '../../services/api.js';

interface ReviewDecisionFormProps {
  event: ProctoringEvent;
  onReviewed: (updatedEvent: ProctoringEvent) => void;
}

export const ReviewDecisionForm: React.FC<ReviewDecisionFormProps> = ({ event, onReviewed }) => {
  const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>(event.review_status);
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await api.reviewEvent(event.id, selectedStatus, note);
      onReviewed(res.event);
      setSuccessMessage('Review decision saved successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Failed to save review decision: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
      <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Invigilator Determination Station
        </h4>
        <p className="text-[11px] text-slate-500">Record formal human review for this flagged event</p>
      </div>

      {/* Decision Radio Grid */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setSelectedStatus('reviewed_no_concern')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-semibold text-left transition-all ${
            selectedStatus === 'reviewed_no_concern'
              ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Reviewed — No Concern</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('requires_follow_up')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-semibold text-left transition-all ${
            selectedStatus === 'requires_follow_up'
              ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
          }`}
        >
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Requires Follow-up</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('technical_issue')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-semibold text-left transition-all ${
            selectedStatus === 'technical_issue'
              ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
          }`}
        >
          <Wrench className="h-4 w-4 shrink-0 text-blue-600" />
          <span>Technical Issue</span>
        </button>

        <button
          type="button"
          onClick={() => setSelectedStatus('pending_review')}
          className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs font-semibold text-left transition-all ${
            selectedStatus === 'pending_review'
              ? 'border-slate-500 bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
          }`}
        >
          <Clock className="h-4 w-4 shrink-0 text-slate-500" />
          <span>Pending Review</span>
        </button>
      </div>

      {/* Reviewer Note */}
      <div>
        <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Reviewer Audit Note (Mandatory for non-cleared determinations):
        </label>
        <textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="E.g., Candidate looked away for 6 seconds to inspect scratch paper; verified camera unobstructed."
          className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Submit Button & Feedback */}
      <div className="flex items-center justify-between">
        {successMessage && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            ✓ {successMessage}
          </span>
        )}
        <div className="ml-auto">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <Send className="h-3 w-3" />
            <span>{isSubmitting ? 'Saving...' : 'Save Decision'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

