import React, { useState } from 'react';
import { 
  Clock, 
  MapPin, 
  Filter 
} from 'lucide-react';
import { Event, Claim, Document } from '../types/investigation';
import { sortEventsForTimeline } from '../utils/contradictionEngine';

interface EventTimelineProps {
  events: Event[];
  claims: Claim[];
  documents: Document[];
}

export const EventTimeline: React.FC<EventTimelineProps> = ({
  events,
  claims,
  documents,
}) => {
  const [filterDisputedOnly, setFilterDisputedOnly] = useState(false);

  const { datedEvents, undatedEvents } = sortEventsForTimeline(events);

  const filteredDatedEvents = filterDisputedOnly
    ? datedEvents.filter(e => e.isDisputed)
    : datedEvents;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-[#E1E4DC] rounded-xl shadow-xs">
        <div>
          <h2 className="text-sm font-bold text-[#252720] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#52765C]" />
            Chronological Timeline & Competing Timestamps
          </h2>
          <p className="text-xs text-slate-500 font-normal">
            When reports disagree about dates or timestamps, competing assertions are displayed side-by-side.
          </p>
        </div>

        <button
          onClick={() => setFilterDisputedOnly(!filterDisputedOnly)}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold border flex items-center gap-1.5 transition-all shrink-0 ${
            filterDisputedOnly
              ? 'bg-[#FFF1F2] text-[#881337] border-[#F43F5E]/40'
              : 'bg-white text-slate-700 border-[#E1E4DC] hover:bg-[#FAF9F6]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{filterDisputedOnly ? 'Disputed Timestamps Only' : 'Show All Events'}</span>
        </button>
      </div>

      {/* Timeline List */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E1E4DC]">
        {filteredDatedEvents.map((evt, idx) => (
          <div key={evt.id} className="relative">
            {/* Timeline Circle */}
            <div className={`absolute -left-6 top-2 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold font-mono ${
              evt.isDisputed
                ? 'bg-[#FFF1F2] border-[#F43F5E] text-[#881337]'
                : 'bg-[#E8EFE6] border-[#52765C] text-[#252720]'
            }`}>
              {idx + 1}
            </div>

            {/* Event Card */}
            <div className="p-5 bg-white border border-[#E1E4DC] rounded-xl space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#E1E4DC] pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-semibold rounded ${
                      evt.isDisputed
                        ? 'bg-[#FFF1F2] text-[#881337] border border-[#F43F5E]/30'
                        : 'bg-[#E8EFE6] text-[#52765C] border border-[#52765C]/20'
                    }`}>
                      {evt.isDisputed ? 'TIMELINE DISCREPANCY' : 'CONSENSUS EVENT'}
                    </span>
                    {evt.location && (
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                        <MapPin className="w-3 h-3 text-[#52765C]" />
                        {evt.location}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#252720]">
                    {evt.title}
                  </h3>
                </div>

                <div className="px-2.5 py-1 bg-[#FAF9F6] border border-[#E1E4DC] rounded text-xs font-mono font-bold text-[#881337]">
                  {evt.timestampStr}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {evt.description}
              </p>

              {/* Competing Timestamps Grid */}
              {evt.competingDates && evt.competingDates.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                    Competing Document Assertions
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {evt.competingDates.map((cd, cdIdx) => (
                      <div
                        key={cdIdx}
                        className="p-3 bg-[#FAF9F6] border border-[#E1E4DC] rounded-lg space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-mono text-[11px] text-[#52765C]">
                          <span className="font-bold truncate max-w-[130px]">
                            {cd.documentTitle}
                          </span>
                          <span className="text-slate-400">p.{cd.pageNumber || 1}</span>
                        </div>

                        <div className="font-mono font-bold text-[#881337]">
                          {cd.dateStr}
                        </div>

                        <p className="text-slate-600 italic text-[11px] leading-relaxed">
                          "{cd.excerpt}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Undated or Uncertain Timestamp Events Section */}
      {undatedEvents.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-[#E1E4DC]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 font-mono uppercase tracking-wider">
              Events with Missing or Uncertain Timestamps ({undatedEvents.length})
            </span>
          </div>

          <div className="space-y-3">
            {undatedEvents.map((evt) => (
              <div key={evt.id} className="p-4 bg-[#FAF9F6] border border-[#E1E4DC] rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-[#E1E4DC] pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-[#FEF3C7] text-[#78350F] border border-[#D97706]/30">
                      UNCERTAIN TIMESTAMP
                    </span>
                    <h3 className="font-bold text-[#252720]">{evt.title}</h3>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 italic">
                    {evt.timestampStr || 'No specific date reported'}
                  </span>
                </div>
                <p className="text-slate-600 font-normal leading-relaxed">{evt.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
