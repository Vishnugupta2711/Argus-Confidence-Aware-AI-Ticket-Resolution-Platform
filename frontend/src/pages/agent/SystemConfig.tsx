import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getThresholds, updateThreshold, getImpactPreview } from "@/services/config";
import { ThresholdConfig } from "@/types";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Settings2, RotateCcw, Save, ChevronDown, ChevronUp, BarChart3,
  TrendingUp, TrendingDown, Minus
} from "lucide-react";

interface ThresholdDraft {
  threshold_a: number;
  threshold_b: number;
  threshold_c: number;
  novelty_threshold: number;
  min_sample_size: number;
}

interface CategoryDraft extends ThresholdDraft {
  isDirty: boolean;
  isSaving: boolean;
}

const SIGNAL_DEFS = [
  { key: "threshold_a" as const, label: "Signal A", sub: "Semantic Relevance", desc: "Qdrant similarity score threshold", sigClass: "sig-a", color: "#7C3AED" },
  { key: "threshold_b" as const, label: "Signal B", sub: "Cohort Consensus", desc: "Top-k cluster agreement threshold", sigClass: "sig-b", color: "#4F46E5" },
  { key: "threshold_c" as const, label: "Signal C", sub: "Historical Success", desc: "Historical auto-resolution rate", sigClass: "sig-c", color: "#0891B2" },
  { key: "novelty_threshold" as const, label: "Novelty", sub: "Novelty Gate", desc: "Min similarity to avoid escalation", sigClass: "sig-n", color: "#059669" },
  { key: "min_sample_size" as const, label: "Min Sample", sub: "Sample Size", desc: "Min rows before historical fallback", sigClass: "sig-m", color: "#D97706" },
] as const;

const SIGNAL_RANGES: Record<keyof ThresholdDraft, { min: number; max: number; step: number }> = {
  threshold_a: { min: 0.5, max: 0.99, step: 0.01 },
  threshold_b: { min: 0.3, max: 0.9, step: 0.01 },
  threshold_c: { min: 0.4, max: 0.95, step: 0.01 },
  novelty_threshold: { min: 0.3, max: 0.7, step: 0.01 },
  min_sample_size: { min: 5, max: 100, step: 1 },
};

const DEFAULT_THRESHOLD: ThresholdDraft = {
  threshold_a: 0.75,
  threshold_b: 0.60,
  threshold_c: 0.70,
  novelty_threshold: 0.50,
  min_sample_size: 30,
};

function formatValue(key: keyof ThresholdDraft, value: number): string {
  if (key === "min_sample_size") return String(value);
  return `${(value * 100).toFixed(0)}%`;
}

function SignalSlider({
  def,
  value,
  onChange,
}: {
  def: typeof SIGNAL_DEFS[number];
  value: number;
  onChange: (v: number) => void;
}) {
  const range = SIGNAL_RANGES[def.key];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: def.color, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--argus-text-primary)' }}>
            {def.label}
          </span>
          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--argus-surface-2)', color: 'var(--argus-text-muted)', fontWeight: 500 }}>
            {def.sub}
          </span>
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--argus-text-primary)', minWidth: '40px', textAlign: 'right' }}>
          {formatValue(def.key, value)}
        </span>
      </div>
      <Slider
        className={`slider-argus slider-argus--${def.sigClass}`}
        value={[value]}
        min={range.min}
        max={range.max}
        step={range.step}
        onValueChange={([v]: [number]) => onChange(v)}
      />
      <span style={{ fontSize: '11px', color: 'var(--argus-text-muted)', paddingLeft: '16px' }}>
        {def.desc}
      </span>
    </div>
  );
}

function CategoryCard({
  category,
  draft,
  isExpanded,
  onToggle,
  onSignalChange,
  onReset,
  onCancel,
  onSave,
}: {
  category: string;
  draft: CategoryDraft;
  isExpanded: boolean;
  onToggle: () => void;
  onSignalChange: (key: keyof ThresholdDraft, value: number) => void;
  onReset: () => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const hasChanges = draft.isDirty;

  return (
    <div
      style={{
        background: 'var(--argus-surface)',
        border: `1px solid var(--argus-border)`,
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {/* Card header */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {/* Category icon */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: hasChanges ? 'var(--argus-amber-light)' : 'var(--argus-indigo-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Settings2
            size={16}
            style={{ color: hasChanges ? 'var(--argus-amber)' : 'var(--argus-indigo)' }}
          />
        </div>

        {/* Category name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--argus-text-primary)' }}>
              {category}
            </span>
            {hasChanges && (
              <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--argus-amber-light)', color: 'var(--argus-amber)', fontWeight: 600 }}>
                Unsaved
              </span>
            )}
          </div>
        </div>

        {/* Action buttons (visible when dirty) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {hasChanges && (
            <>
              <Button
                size="xs"
                variant="ghost"
                onClick={(e) => { e.stopPropagation(); onCancel(); }}
                style={{ height: '28px', fontSize: '11px', color: 'var(--argus-text-muted)' }}
              >
                Cancel
              </Button>
              <Button
                size="xs"
                onClick={(e) => { e.stopPropagation(); onSave(); }}
                disabled={draft.isSaving}
                style={{ height: '28px', fontSize: '11px', background: 'var(--argus-indigo)', color: 'white' }}
              >
                <Save size={10} />
                Save
              </Button>
            </>
          )}
          <Button
            size="xs"
            variant="ghost"
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            style={{ height: '28px', color: 'var(--argus-text-muted)' }}
          >
            <RotateCcw size={11} />
          </Button>
        </div>

        {/* Chevron */}
        <div style={{ color: 'var(--argus-text-muted)', flexShrink: 0 }}>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {/* Expanded: sliders */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '8px 16px 16px',
                borderTop: '1px solid var(--argus-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {SIGNAL_DEFS.map((def) => (
                <SignalSlider
                  key={def.key}
                  def={def}
                  value={draft[def.key]}
                  onChange={(v) => onSignalChange(def.key, v)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MasterControlsPanel({
  drafts,
  onMasterChange,
}: {
  drafts: Record<string, CategoryDraft>;
  onMasterChange: (key: keyof ThresholdDraft, value: number) => void;
}) {
  const firstCat = Object.keys(drafts)[0];
  const firstDraft = firstCat ? drafts[firstCat] : null;
  const masterValues = firstDraft ?? DEFAULT_THRESHOLD;

  return (
    <div
      style={{
        background: 'var(--argus-surface)',
        border: '1px solid var(--argus-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--argus-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--argus-indigo)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={14} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--argus-text-primary)' }}>Master Controls</div>
            <div style={{ fontSize: '11px', color: 'var(--argus-text-muted)' }}>Apply to all categories</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '12px 16px 8px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {SIGNAL_DEFS.map((def) => (
          <SignalSlider
            key={def.key}
            def={def}
            value={masterValues[def.key]}
            onChange={(v) => onMasterChange(def.key, v)}
          />
        ))}
      </div>

    </div>
  );
}

function ImpactPreviewPanel({ data }: { data: any }) {
  if (!data) return null;

  const rate = data.auto_resolve_rate ?? 0;
  const delta = data.delta ?? 0;

  const getDeltaIcon = () => {
    if (delta > 0) return <TrendingUp size={12} style={{ color: 'var(--argus-emerald)' }} />;
    if (delta < 0) return <TrendingDown size={12} style={{ color: 'var(--argus-red)' }} />;
    return <Minus size={12} style={{ color: 'var(--argus-text-muted)' }} />;
  };

  const getDeltaColor = () => {
    if (delta > 0) return 'var(--argus-emerald)';
    if (delta < 0) return 'var(--argus-red)';
    return 'var(--argus-text-muted)';
  };

  const total = data.total_tickets ?? 0;
  const autoResolved = data.auto_resolved_count ?? 0;
  const escalated = data.escalated_count ?? 0;

  return (
    <div
      style={{
        background: 'var(--argus-surface)',
        border: '1px solid var(--argus-border)',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--argus-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--argus-cyan-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={14} style={{ color: 'var(--argus-cyan)' }} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--argus-text-primary)' }}>Impact Preview</div>
            <div style={{ fontSize: '11px', color: 'var(--argus-text-muted)' }}>Based on recent {total} tickets</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Main rate */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--argus-text-muted)' }}>Auto-Resolve Rate</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--argus-text-primary)' }}>
              {(rate * 100).toFixed(1)}%
            </span>
            {getDeltaIcon()}
            <span style={{ fontSize: '11px', fontWeight: 600, color: getDeltaColor() }}>
              {delta > 0 ? '+' : ''}{(delta * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Bar */}
        <div style={{ height: '6px', borderRadius: '999px', background: 'var(--argus-border)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${Math.min(100, (rate * 100))}%`,
              height: '100%',
              background: 'var(--argus-indigo)',
              borderRadius: '999px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--argus-surface-2)', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--argus-emerald)' }}>{autoResolved}</div>
            <div style={{ fontSize: '10px', color: 'var(--argus-text-muted)', marginTop: '2px' }}>Auto-Resolved</div>
          </div>
          <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--argus-surface-2)', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--argus-amber)' }}>{escalated}</div>
            <div style={{ fontSize: '10px', color: 'var(--argus-text-muted)', marginTop: '2px' }}>Escalated</div>
          </div>
          <div style={{ flex: 1, padding: '10px', borderRadius: '8px', background: 'var(--argus-surface-2)', textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--argus-text-primary)' }}>{total}</div>
            <div style={{ fontSize: '10px', color: 'var(--argus-text-muted)', marginTop: '2px' }}>Total</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SystemConfig() {
  const queryClient = useQueryClient();
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [drafts, setDrafts] = useState<Record<string, CategoryDraft>>({});

  const { data: thresholds, isLoading } = useQuery({
    queryKey: ["config-thresholds"],
    queryFn: getThresholds,
  });

  const { data: impact } = useQuery({
    queryKey: ["config-impact"],
    queryFn: getImpactPreview,
    refetchInterval: 30000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ category, payload }: { category: string; payload: any }) =>
      updateThreshold(category, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-thresholds"] });
      queryClient.invalidateQueries({ queryKey: ["config-impact"] });
      toast.success("Thresholds saved");
    },
    onError: () => {
      toast.error("Failed to save thresholds");
    },
  });

  // Initialize drafts from fetched thresholds
  const initDrafts = useCallback(() => {
    if (!thresholds) return;
    const next: Record<string, CategoryDraft> = {};
    thresholds.forEach((t: ThresholdConfig) => {
      next[t.category] = {
        threshold_a: t.threshold_a,
        threshold_b: t.threshold_b,
        threshold_c: t.threshold_c,
        novelty_threshold: t.novelty_threshold,
        min_sample_size: t.min_sample_size,
        isDirty: false,
        isSaving: false,
      };
    });
    setDrafts(next);
  }, [thresholds]);

  // When thresholds load, initialize drafts
  useState(() => {
    if (thresholds && Object.keys(drafts).length === 0) {
      initDrafts();
    }
  });

  // Re-init when thresholds change and no pending drafts
  if (thresholds && Object.keys(drafts).length === 0) {
    initDrafts();
  }

  const toggleCategory = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleSignalChange = (cat: string, key: keyof ThresholdDraft, value: number) => {
    setDrafts((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], [key]: value, isDirty: true },
    }));
  };

  const handleCancel = (cat: string) => {
    setDrafts((prev) => {
      const orig = thresholds?.find((t: ThresholdConfig) => t.category === cat);
      if (!orig) return prev;
      return {
        ...prev,
        [cat]: {
          threshold_a: orig.threshold_a,
          threshold_b: orig.threshold_b,
          threshold_c: orig.threshold_c,
          novelty_threshold: orig.novelty_threshold,
          min_sample_size: orig.min_sample_size,
          isDirty: false,
          isSaving: false,
        },
      };
    });
  };

  const handleSave = (cat: string) => {
    const draft = drafts[cat];
    if (!draft) return;
    setDrafts((prev) => ({
      ...prev,
      [cat]: { ...prev[cat], isSaving: true },
    }));
    updateMutation.mutate({
      category: cat,
      payload: {
        threshold_a: draft.threshold_a,
        threshold_b: draft.threshold_b,
        threshold_c: draft.threshold_c,
        novelty_threshold: draft.novelty_threshold,
        min_sample_size: draft.min_sample_size,
      },
    });
  };

  const handleReset = (cat: string) => {
    setDrafts((prev) => ({
      ...prev,
      [cat]: {
        ...DEFAULT_THRESHOLD,
        isDirty: true,
        isSaving: false,
      },
    }));
  };

  const handleResetAll = () => {
    const next: Record<string, CategoryDraft> = {};
    thresholds?.forEach((t: ThresholdConfig) => {
      next[t.category] = {
        ...DEFAULT_THRESHOLD,
        isDirty: true,
        isSaving: false,
      };
    });
    setDrafts(next);
    toast.info("All categories reset to defaults — save to apply");
  };

  const handleMasterChange = (key: keyof ThresholdDraft, value: number) => {
      setDrafts((prev) => {
      const next: Record<string, CategoryDraft> = {};
      Object.entries(prev).forEach(([cat, draft]) => {
        next[cat] = { ...draft, [key]: value, isDirty: true };
      });
      return next;
    });
  };

  const handleCancelAll = () => {
    if (!thresholds) return;
    const next: Record<string, CategoryDraft> = {};
    thresholds.forEach((t: ThresholdConfig) => {
      next[t.category] = {
        threshold_a: t.threshold_a,
        threshold_b: t.threshold_b,
        threshold_c: t.threshold_c,
        novelty_threshold: t.novelty_threshold,
        min_sample_size: t.min_sample_size,
        isDirty: false,
        isSaving: false,
      };
    });
    setDrafts(next);
    toast.success("All changes cancelled");
  };

  const handleSaveAll = () => {
    const dirty = Object.entries(drafts).filter(([_, d]) => d.isDirty);
    if (dirty.length === 0) return;
    dirty.forEach(([cat, draft]) => {
      updateMutation.mutate({
        category: cat,
        payload: {
          threshold_a: draft.threshold_a,
          threshold_b: draft.threshold_b,
          threshold_c: draft.threshold_c,
          novelty_threshold: draft.novelty_threshold,
          min_sample_size: draft.min_sample_size,
        },
      });
    });
  };

  const categories = thresholds?.map((t: ThresholdConfig) => t.category) ?? [];
  const dirtyCount = Object.values(drafts).filter((d) => d.isDirty).length;

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--argus-border)', borderTopColor: 'var(--argus-indigo)', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'var(--argus-text-muted)' }}>Loading thresholds...</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--argus-text-primary)', margin: 0, marginBottom: '4px' }}>
          System Config
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--argus-text-muted)', margin: 0 }}>
          Configure confidence thresholds per category. Changes take effect after saving.
        </p>
      </div>

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>

        {/* Left: category cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {categories.map((cat: string) => {
            const draft = drafts[cat];
            if (!draft) return null;
            return (
              <CategoryCard
                key={cat}
                category={cat}
                draft={draft}
                isExpanded={expandedCats.has(cat)}
                onToggle={() => toggleCategory(cat)}
                onSignalChange={(key, value) => handleSignalChange(cat, key, value)}
                onReset={() => handleReset(cat)}
                onCancel={() => handleCancel(cat)}
                onSave={() => handleSave(cat)}
              />
            );
          })}

          {/* Bottom action row: Reset All | Cancel | Save All */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--argus-border)',
            marginTop: '4px',
          }}>
            {/* Left: Reset to defaults */}
            <Button
              variant="outline"
              onClick={handleResetAll}
              style={{
                height: '34px',
                fontSize: '12px',
                borderColor: 'var(--argus-border)',
                color: 'var(--argus-text-muted)',
                background: 'var(--argus-surface)',
              }}
            >
              <RotateCcw size={12} />
              Reset All to Defaults
            </Button>

            {/* Right: Cancel All + Save All */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="outline"
                onClick={handleCancelAll}
                disabled={dirtyCount === 0}
                style={{
                  height: '34px',
                  fontSize: '12px',
                  borderColor: 'var(--argus-border)',
                  color: 'var(--argus-text-muted)',
                  background: 'var(--argus-surface)',
                  opacity: dirtyCount === 0 ? 0.45 : 1,
                }}
              >
                Cancel All
              </Button>
              <Button
                onClick={handleSaveAll}
                disabled={dirtyCount === 0 || updateMutation.isPending}
                style={{
                  height: '34px',
                  fontSize: '12px',
                  background: dirtyCount === 0 ? '#9CA3AF' : 'var(--argus-indigo)',
                  color: 'white',
                  opacity: updateMutation.isPending ? 0.7 : 1,
                }}
              >
                <Save size={12} />
                Save All Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Right: sticky panel */}
        <div style={{ position: 'sticky', top: '0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <MasterControlsPanel
            drafts={drafts}
            onMasterChange={handleMasterChange}
          />
          <ImpactPreviewPanel data={impact} />
        </div>
      </div>
    </div>
  );
}
