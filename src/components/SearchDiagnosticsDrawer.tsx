import React, { useState } from 'react';
import {
  X,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Search,
  Filter,
  Copy,
  Check,
  Compass,
  Layers,
  Database,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { SearchDiagnostics, VisitedWebsiteAudit } from '../types';

interface SearchDiagnosticsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics?: SearchDiagnostics;
  query: string;
  locationName: string;
  radiusMiles: number;
}

export const SearchDiagnosticsDrawer: React.FC<SearchDiagnosticsDrawerProps> = ({
  isOpen,
  onClose,
  diagnostics,
  query,
  locationName,
  radiusMiles,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'parsed' | 'skipped'>('all');
  const [filterQuery, setFilterQuery] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !diagnostics) return null;

  const websites: VisitedWebsiteAudit[] = diagnostics.visitedWebsites || [];

  const parsedCount = websites.filter(
    (w) => w.parseStatus === 'PARSED_SUCCESS' || w.parseStatus === 'PARSED_PARTIAL'
  ).length;

  const skippedCount = websites.filter(
    (w) => w.parseStatus === 'SKIPPED_NO_MENU' || w.parseStatus === 'UNAVAILABLE'
  ).length;

  const filteredWebsites = websites.filter((site) => {
    if (activeTab === 'parsed' && site.parseStatus !== 'PARSED_SUCCESS' && site.parseStatus !== 'PARSED_PARTIAL') {
      return false;
    }
    if (activeTab === 'skipped' && site.parseStatus !== 'SKIPPED_NO_MENU' && site.parseStatus !== 'UNAVAILABLE') {
      return false;
    }
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      return (
        site.restaurantName.toLowerCase().includes(q) ||
        site.sourceType.toLowerCase().includes(q) ||
        site.reasonOrDetails.toLowerCase().includes(q) ||
        site.websiteUrl.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      searchedQuery: query,
      canonicalDish: diagnostics.interpretation?.canonicalDish || query,
      location: locationName,
      coordinates: diagnostics.geoAccuracy?.coordinates,
      radiusMiles: diagnostics.radiusMiles || radiusMiles,
      apiStatus: diagnostics.apiStatus,
      totalEvaluated: diagnostics.candidatesEvaluated,
      menusChecked: diagnostics.menusChecked,
      exactMatchCount: diagnostics.exactMatchCount,
      similarMatchCount: diagnostics.similarMatchCount,
      verifiedCount: diagnostics.verifiedCount,
      unverifiedCount: diagnostics.unverifiedCount,
      pipelineSteps: diagnostics.pipelineSteps,
      visitedWebsites: diagnostics.visitedWebsites,
    };

    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: VisitedWebsiteAudit['parseStatus']) => {
    switch (status) {
      case 'PARSED_SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Menu Parsed
          </span>
        );
      case 'PARSED_PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Partial / Similar
          </span>
        );
      case 'SKIPPED_NO_MENU':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-200 text-stone-700 border border-stone-300">
            <XCircle className="w-3 h-3 text-stone-500" />
            Skipped / No Dish Match
          </span>
        );
    }
  };

  const getSourceBadge = (sourceType: VisitedWebsiteAudit['sourceType']) => {
    switch (sourceType) {
      case 'Uber Eats':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Toast POS':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'DoorDash':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Google Places / Registry':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#202B2E]/50 backdrop-blur-xs animate-in fade-in duration-200 flex justify-end">
      {/* Drawer Panel */}
      <div className="relative w-full max-w-3xl bg-[#FFF9EF] shadow-2xl border-l border-[#123D45]/15 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-white border-b border-[#123D45]/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#123D45] text-[#F7D889] shadow-md shadow-[#123D45]/20">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl sm:text-2xl font-black text-[#123D45]">
                  Search Diagnostics
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {diagnostics.apiStatus || 'Operational'}
                </span>
              </div>
              <p className="text-xs text-[#202B2E]/70 mt-0.5">
                Real-time pipeline audit of crawled restaurant websites, menus parsed & skipped
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#123D45] text-xs font-bold transition shadow-2xs"
              title="Copy complete diagnostics JSON"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Export'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#202B2E]/60 hover:text-[#202B2E] hover:bg-stone-100 transition"
              title="Close diagnostics"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Query Summary & Geo Perimeters Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-[#123D45]/10 shadow-xs">
              <div className="text-[11px] font-semibold text-[#202B2E]/60 uppercase tracking-wider">
                Searched Craving
              </div>
              <div className="font-heading font-black text-sm sm:text-base text-[#123D45] mt-1 truncate">
                {query}
              </div>
              <div className="text-[10px] text-[#F47B54] font-medium mt-0.5">
                Canon: {diagnostics.interpretation?.canonicalDish || query}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#123D45]/10 shadow-xs">
              <div className="text-[11px] font-semibold text-[#202B2E]/60 uppercase tracking-wider">
                Strict Perimeter
              </div>
              <div className="font-heading font-black text-sm sm:text-base text-[#123D45] mt-1">
                ±{diagnostics.radiusMiles || radiusMiles} Miles
              </div>
              <div className="text-[10px] text-[#202B2E]/60 mt-0.5">
                {diagnostics.radiusMeters ? `${diagnostics.radiusMeters} meters` : 'High precision filter'}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#123D45]/10 shadow-xs">
              <div className="text-[11px] font-semibold text-[#202B2E]/60 uppercase tracking-wider">
                Websites Visited
              </div>
              <div className="font-heading font-black text-sm sm:text-base text-[#123D45] mt-1">
                {websites.length} Sources
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                {parsedCount} parsed / {skippedCount} skipped
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white border border-[#123D45]/10 shadow-xs">
              <div className="text-[11px] font-semibold text-[#202B2E]/60 uppercase tracking-wider">
                Confirmed Matches
              </div>
              <div className="font-heading font-black text-sm sm:text-base text-emerald-700 mt-1">
                {diagnostics.verifiedCount} Verified
              </div>
              <div className="text-[10px] text-[#202B2E]/60 mt-0.5">
                {diagnostics.exactMatchCount} exact • {diagnostics.similarMatchCount} similar
              </div>
            </div>
          </div>

          {/* Pipeline Execution Stages */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#123D45]/10 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-[#F47B54]" />
              <h3 className="font-heading font-bold text-sm text-[#123D45] uppercase tracking-wider">
                Search Pipeline Stages
              </h3>
            </div>
            <div className="space-y-2.5">
              {(diagnostics.pipelineSteps || []).map((step, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#FFF9EF]/60 border border-[#123D45]/5 flex items-start gap-3"
                >
                  <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-heading font-bold text-xs text-[#123D45]">{step.step}</div>
                    <div className="text-[11px] text-[#202B2E]/75 mt-0.5 leading-relaxed">
                      {step.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Website Crawl & Menu Parsing Audit Section */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#123D45]/10 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#123D45]/10">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#123D45]" />
                <h3 className="font-heading font-bold text-base text-[#123D45]">
                  Restaurant Websites & Menu Crawl Audit
                </h3>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'all'
                      ? 'bg-white text-[#123D45] shadow-xs'
                      : 'text-[#202B2E]/60 hover:text-[#123D45]'
                  }`}
                >
                  All ({websites.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('parsed')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'parsed'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  Parsed ({parsedCount})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('skipped')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeTab === 'skipped'
                      ? 'bg-stone-700 text-white shadow-xs'
                      : 'text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  Skipped ({skippedCount})
                </button>
              </div>
            </div>

            {/* Quick Search within inspected websites */}
            <div className="relative mb-3.5">
              <Search className="w-4 h-4 text-[#202B2E]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter inspected restaurant names, sources, or notes..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs text-[#202B2E] placeholder:text-stone-400 focus:outline-hidden focus:border-[#F47B54]"
              />
            </div>

            {/* List of Audited Restaurant Websites */}
            <div className="space-y-3">
              {filteredWebsites.length === 0 ? (
                <div className="text-center py-8 text-xs text-stone-500">
                  No websites matching current filter.
                </div>
              ) : (
                filteredWebsites.map((site, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl border transition-all duration-150 hover:border-[#123D45]/30 bg-[#FFF9EF]/30"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-black text-sm text-[#123D45]">
                          {site.restaurantName}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getSourceBadge(
                            site.sourceType
                          )}`}
                        >
                          {site.sourceType}
                        </span>
                        {site.itemsDiscoveredCount > 0 && (
                          <span className="text-[10px] text-[#202B2E]/60 font-medium">
                            {site.itemsDiscoveredCount} items parsed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(site.parseStatus)}
                        {site.websiteUrl && (
                          <a
                            href={site.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg text-[#123D45] hover:bg-stone-100 transition"
                            title="Visit audited menu URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-[#202B2E]/80 bg-white p-2.5 rounded-xl border border-[#123D45]/5 leading-relaxed">
                      {site.reasonOrDetails}
                    </div>

                    <div className="flex items-center justify-between mt-2 text-[10px] text-[#202B2E]/50">
                      <span className="truncate max-w-[360px] font-mono">
                        {site.websiteUrl}
                      </span>
                      {site.responseTimeMs && (
                        <span>Crawled in {site.responseTimeMs}ms</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-white border-t border-[#123D45]/10 flex items-center justify-between text-xs text-[#202B2E]/60 shrink-0">
          <div>
            Center: <strong className="text-[#123D45]">{locationName}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#123D45] text-white font-bold hover:bg-[#1a4e57] transition"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
