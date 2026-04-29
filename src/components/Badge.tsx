import { AssetStatus, ClipStatus } from '../types';
import { useAppStore } from '../store';
import { t } from '../i18n';

interface BadgeProps {
  status: AssetStatus | ClipStatus;
}

export function Badge({ status }: BadgeProps) {
  const { language } = useAppStore();
  
  const config: Record<string, { labelKey: string; className: string }> = {
    inbox: { labelKey: 'workflow.inbox', className: 'bg-gray-100 text-gray-600' },
    to_classify: { labelKey: 'workflow.toClassify', className: 'bg-[#FBF3DB] text-[#956400]' },
    ready_clipping: { labelKey: 'workflow.readyClipping', className: 'bg-[#E1F3FE] text-[#1F6C9F]' },
    processing: { labelKey: 'workflow.processing', className: 'bg-[#E1F3FE] text-[#1F6C9F]' },
    received: { labelKey: 'workflow.clipReview', className: 'bg-[#EDF3EC] text-[#346538]' },
    review: { labelKey: 'workflow.clipReview', className: 'bg-[#FBF3DB] text-[#956400]' },
    approved: { labelKey: 'workflow.approved', className: 'bg-[#EDF3EC] text-[#346538]' },
    published: { labelKey: 'workflow.published', className: 'bg-[#EDF3EC] text-[#346538]' },
    pending: { labelKey: 'workflow.clipReview', className: 'bg-[#FBF3DB] text-[#956400]' }, // Using review label/style for pending
    rejected: { labelKey: 'workflow.rejected', className: 'bg-red-100 text-red-600' }, // Assuming workflow.rejected might not exist but fallback handles it
  };

  const { labelKey, className } = config[status] || { labelKey: status, className: 'bg-gray-100 text-gray-600' };
  const label = config[status] ? t(labelKey as any, language) : status;

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-widest ${className}`}>
      {label}
    </span>
  );
}
