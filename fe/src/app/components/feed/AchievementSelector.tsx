import React from 'react';
import { UserAchievementItem } from '../../services/api';
import {
	Trophy,
	Flame,
	Zap,
	CheckCircle2,
	Code2,
	Sparkles,
	Star,
	Award,
	Medal,
	Lock,
	Check,
	LucideIcon
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
	Code2,
	CheckCircle2,
	Flame,
	Trophy,
	Zap,
	Sparkles,
	Star,
	Award,
	Medal,
};

export function getAchievementIcon(iconName?: string): LucideIcon {
	if (!iconName) return Trophy;
	return iconMap[iconName] || Trophy;
}

interface AchievementSelectorProps {
	achievements: UserAchievementItem[];
	selectedAchievement: UserAchievementItem | null;
	onSelect: (achievement: UserAchievementItem) => void;
	isLoading?: boolean;
}

export function AchievementSelector({
	achievements,
	selectedAchievement,
	onSelect,
	isLoading = false
}: AchievementSelectorProps) {
	const unlockedList = achievements.filter(a => a.unlocked);

	if (isLoading) {
		return (
			<div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 rounded bg-amber-500/20 animate-pulse" />
					<div className="h-4 w-40 bg-amber-500/20 rounded animate-pulse" />
				</div>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
					<div className="h-20 bg-muted/40 rounded-xl animate-pulse" />
					<div className="h-20 bg-muted/40 rounded-xl animate-pulse" />
				</div>
			</div>
		);
	}

	if (unlockedList.length === 0) {
		return (
			<div className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent text-center space-y-3">
				<div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30 shadow-inner">
					<Lock className="w-6 h-6" />
				</div>
				<div>
					<h4 className="text-sm font-bold text-foreground">No Unlocked Achievements Yet</h4>
					<p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
						You haven't unlocked any achievements yet. Solve coding problems or maintain your daily streak to unlock achievements and share them on the Feed!
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<label className="text-xs font-bold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider">
					<Trophy className="w-4 h-4 fill-amber-500" />
					<span>Select Unlocked Achievement ({unlockedList.length})</span>
				</label>
				<span className="text-[11px] text-muted-foreground">Click to select achievement</span>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto p-1.5">
				{unlockedList.map((ach) => {
					const IconComp = getAchievementIcon(ach.icon);
					const isSelected = selectedAchievement?.id === ach.id || (selectedAchievement?.title && selectedAchievement.title === ach.title);

					return (
						<div
							key={ach.id || ach.title}
							onClick={() => onSelect(ach)}
							className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 relative ${
								isSelected
									? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 shadow-md'
									: 'bg-card/80 border-border hover:border-amber-500/40 hover:bg-amber-500/5'
							}`}
						>
							<div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
								isSelected ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold' : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
							}`}>
								<IconComp className="w-4.5 h-4.5" />
							</div>

							<div className="flex-1 min-w-0 pr-4">
								<h5 className="text-xs font-bold text-foreground truncate">{ach.title}</h5>
								<p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">{ach.desc}</p>
								<span className="inline-block mt-1.5 text-[10px] font-semibold text-amber-500/90 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
									{ach.category || 'Achievement'}
								</span>
							</div>

							{isSelected && (
								<div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-sm">
									<Check className="w-3.5 h-3.5 stroke-[3]" />
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
