import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Flame,
	Trophy,
	Calendar,
	Zap,
	CheckCircle2,
	AlertTriangle,
	ArrowLeft,
	Award,
	Sparkles,
	Clock,
	Code2,
	Target,
	ChevronRight,
	ShieldCheck,
	Loader2,
	RefreshCw
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useAuth } from '../../context/AuthContext';
import {
	getProfileApi,
	getMySubmissionsApi,
	UserProfile,
	SubmissionResponseData
} from '../../services/api';

export function StreakDetails() {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [submissions, setSubmissions] = useState<SubmissionResponseData[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);

	const fetchData = async () => {
		setIsLoading(true);
		try {
			const profilePromise = user?.user_id ? getProfileApi(user.user_id) : Promise.resolve(null);
			const subsPromise = getMySubmissionsApi().catch(() => []);

			const [prof, subs] = await Promise.all([profilePromise, subsPromise]);
			setUserProfile(prof);
			setSubmissions(subs || []);
		} catch (err) {
			console.error('Failed to fetch streak details:', err);
		} fontFinally: {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [user?.user_id]);

	// Extract streak values
	const currentStreak = userProfile?.streak?.current_streak ?? 0;
	const bestStreak = userProfile?.streak?.best_streak ?? 0;

	// Map submissions by YYYY-MM-DD date
	const submissionDatesMap = useMemo(() => {
		const map: Record<string, number> = {};
		submissions.forEach((sub) => {
			if (!sub.submitted_at) return;
			const dateStr = sub.submitted_at.substring(0, 10);
			map[dateStr] = (map[dateStr] || 0) + 1;
		});
		return map;
	}, [submissions]);

	// Check if user has active submission today (UTC/Local)
	const todayDateStr = new Date().toISOString().substring(0, 10);
	const hasSolvedToday = (submissionDatesMap[todayDateStr] || 0) > 0;

	// Generate 365 Days Heatmap grouped by Day of Week & Month Headers
	const { heatmapWeeks, monthHeaders } = useMemo(() => {
		const today = new Date();
		
		// Determine start date (52 weeks ago, padded to previous Sunday)
		const startDate = new Date(today);
		startDate.setDate(today.getDate() - 364);
		const dayOfWeek = startDate.getDay(); // 0 = Sun
		startDate.setDate(startDate.getDate() - dayOfWeek);

		const weeks: Array<Array<{ dateStr: string; count: number; date: Date }>> = [];
		const months: Array<{ name: string; colIndex: number }> = [];

		let currentWeek: Array<{ dateStr: string; count: number; date: Date }> = [];
		let lastMonth = '';
		let colIndex = 0;

		const curr = new Date(startDate);
		while (curr <= today || currentWeek.length > 0) {
			const dateStr = curr.toISOString().substring(0, 10);
			const count = submissionDatesMap[dateStr] || 0;
			const monthName = curr.toLocaleString('en-US', { month: 'short' });

			if (monthName !== lastMonth && curr <= today) {
				months.push({ name: monthName, colIndex });
				lastMonth = monthName;
			}

			currentWeek.push({
				dateStr,
				count,
				date: new Date(curr)
			});

			if (currentWeek.length === 7) {
				weeks.push(currentWeek);
				currentWeek = [];
				colIndex++;
			}

			curr.setDate(curr.getDate() + 1);
			if (curr > today && currentWeek.length === 0) break;
		}

		return { heatmapWeeks: weeks, monthHeaders: months };
	}, [submissionDatesMap]);

	// Total active days count
	const totalActiveDays = Object.keys(submissionDatesMap).length;

	// Streak badges definitions
	const streakBadges = [
		{
			title: '3-Day Streak',
			desc: 'Solve at least 1 problem for 3 consecutive days',
			target: 3,
			icon: Flame,
			badgeClass: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
			unlocked: (bestStreak >= 3 || currentStreak >= 3)
		},
		{
			title: '7-Day Streak',
			desc: 'Maintain daily practice momentum for a full week',
			target: 7,
			icon: Zap,
			badgeClass: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30',
			unlocked: (bestStreak >= 7 || currentStreak >= 7)
		},
		{
			title: '30-Day Streak',
			desc: 'Master consistency with 30 days of continuous coding',
			target: 30,
			icon: Trophy,
			badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
			unlocked: (bestStreak >= 30 || currentStreak >= 30)
		},
		{
			title: '100-Day Centurion',
			desc: 'Achieve legendary status with 100 consecutive active days',
			target: 100,
			icon: Award,
			badgeClass: 'bg-purple-500/10 text-purple-500 border-purple-500/30',
			unlocked: (bestStreak >= 100 || currentStreak >= 100)
		}
	];

	return (
		<div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
			{/* Page Header Bar */}
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
						<Flame className="w-6 h-6 fill-amber-500" />
					</div>
					<div>
						<h1 className="text-2xl font-extrabold text-foreground tracking-tight">
							Coding Streak & Activity
						</h1>
						<p className="text-xs text-muted-foreground mt-0.5">
							Track your daily practice momentum, streak history, and activity calendar.
						</p>
					</div>
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => navigate(-1)}
					className="rounded-xl border-border text-xs font-semibold gap-2 h-9 px-4 hover:bg-accent cursor-pointer shrink-0 text-foreground"
				>
					<ArrowLeft className="w-4 h-4 text-muted-foreground" />
					<span>Back</span>
				</Button>
			</div>

			{/* Main Hero Streak Banner */}
			<Card className="p-6 md:p-8 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-card backdrop-blur-xl border border-amber-500/30 rounded-3xl shadow-lg relative overflow-hidden">
				<div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

				<div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
					{/* Left: Current Streak Display */}
					<div className="flex items-center gap-5 text-center md:text-left">
						<div className="w-20 h-20 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xl shadow-amber-500/20 shrink-0 ring-4 ring-amber-500/30">
							<Flame className="w-10 h-10 fill-slate-950 animate-pulse" />
						</div>

						<div>
							<div className="flex items-center justify-center md:justify-start gap-2.5">
								<h2 className="text-4xl font-extrabold text-foreground font-mono">
									{currentStreak} <span className="text-2xl font-sans text-amber-500">Days</span>
								</h2>
							</div>

							<p className="text-xs text-muted-foreground mt-1 font-medium">
								{hasSolvedToday
									? 'Awesome! You solved a problem today and maintained your streak chain.'
									: 'Solve at least 1 problem today to keep your streak going!'}
							</p>
						</div>
					</div>

					{/* Right: Quick Stats & CTA Button */}
					<div className="flex items-center gap-4 flex-wrap justify-center md:justify-end shrink-0">
						<div className="px-4 py-3 rounded-2xl bg-background/80 border border-border/80 text-center min-w-[110px]">
							<p className="text-[10px] uppercase font-bold text-muted-foreground">Best Streak</p>
							<p className="text-xl font-extrabold text-foreground font-mono mt-0.5">{bestStreak} Days</p>
						</div>

						<div className="px-4 py-3 rounded-2xl bg-background/80 border border-border/80 text-center min-w-[110px]">
							<p className="text-[10px] uppercase font-bold text-muted-foreground">Active Days</p>
							<p className="text-xl font-extrabold text-foreground font-mono mt-0.5">{totalActiveDays} Days</p>
						</div>

						<Button
							size="lg"
							onClick={() => navigate('/problems')}
							className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs px-6 h-12 gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
						>
							<Zap className="w-4 h-4 fill-slate-950" />
							<span>Solve Problem Now</span>
						</Button>
					</div>
				</div>
			</Card>

			{/* 365-Day Activity Heatmap Grid */}
			<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl shadow-sm space-y-4">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Calendar className="w-5 h-5 text-primary" />
						<h3 className="text-base font-bold text-foreground">365-Day Activity Heatmap</h3>
					</div>
					<span className="text-xs text-muted-foreground font-mono">{submissions.length} Total Submissions</span>
				</div>

				{/* Heatmap Grid Box */}
				<div className="overflow-x-auto pb-2">
					<div className="min-w-[760px] space-y-2">
						{/* Month Headers */}
						<div className="flex text-[11px] font-mono text-muted-foreground pl-10 h-4 relative">
							{monthHeaders.map((m, idx) => (
								<span
									key={`${m.name}-${idx}`}
									style={{ left: `${m.colIndex * 20 + 40}px` }}
									className="absolute"
								>
									{m.name}
								</span>
							))}
						</div>

						{/* Days of Week Labels + Grid Matrix */}
						<div className="flex gap-2 items-start">
							{/* Day of Week Labels */}
							<div className="grid grid-rows-7 gap-1.5 text-[10px] font-mono text-muted-foreground shrink-0 leading-3 py-0.5 text-right w-8">
								<span>Sun</span>
								<span>Mon</span>
								<span>Tue</span>
								<span>Wed</span>
								<span>Thu</span>
								<span>Fri</span>
								<span>Sat</span>
							</div>

							{/* Heatmap Weeks Grid */}
							<div className="flex gap-1.5 flex-1">
								{heatmapWeeks.map((week, wIdx) => (
									<div key={wIdx} className="grid grid-rows-7 gap-1.5">
										{week.map((day) => {
											let bgClass = 'bg-muted/40 border border-border/40';
											if (day.count === 1) bgClass = 'bg-emerald-900/60 dark:bg-emerald-950/80 border border-emerald-700/50 text-emerald-300';
											else if (day.count >= 2 && day.count <= 3) bgClass = 'bg-emerald-600/80 border border-emerald-500 text-white';
											else if (day.count >= 4) bgClass = 'bg-emerald-400 border border-emerald-300 text-slate-950';

											return (
												<div
													key={day.dateStr}
													title={`${day.dateStr}: ${day.count} submission${day.count === 1 ? '' : 's'}`}
													className={`w-3.5 h-3.5 rounded-sm transition-all hover:scale-125 cursor-pointer ${bgClass}`}
												/>
											);
										})}
									</div>
								))}
							</div>
						</div>

						{/* Legend */}
						<div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground pt-2">
							<span>Less</span>
							<div className="w-3.5 h-3.5 rounded-sm bg-muted/40 border border-border/40" />
							<div className="w-3.5 h-3.5 rounded-sm bg-emerald-900/60 dark:bg-emerald-950/80 border border-emerald-700/50" />
							<div className="w-3.5 h-3.5 rounded-sm bg-emerald-600/80 border border-emerald-500" />
							<div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 border border-emerald-300" />
							<span>More</span>
						</div>
					</div>
				</div>
			</Card>

			{/* Streak Badges & Achievements Grid */}
			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Trophy className="w-5 h-5 text-amber-500" />
					<h3 className="text-base font-bold text-foreground">Streak Badges & Milestones</h3>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					{streakBadges.map((badge) => {
						const IconComp = badge.icon;
						const progressPercent = Math.min(100, Math.round((currentStreak / badge.target) * 100));

						return (
							<Card
								key={badge.title}
								className={`p-5 backdrop-blur-xl border rounded-2xl shadow-sm space-y-3 transition-all ${
									badge.unlocked
										? 'bg-card/80 border-amber-500/40 ring-1 ring-amber-500/20'
										: 'bg-card/40 border-border/60 opacity-80'
								}`}
							>
								<div className="flex items-center justify-between">
									<div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${badge.badgeClass}`}>
										<IconComp className="w-5 h-5" />
									</div>
									{badge.unlocked ? (
										<Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
											Unlocked
										</Badge>
									) : (
										<Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
											{currentStreak} / {badge.target} Days
										</Badge>
									)}
								</div>

								<div>
									<h4 className="text-sm font-bold text-foreground leading-tight">{badge.title}</h4>
									<p className="text-xs text-muted-foreground mt-1 leading-snug">{badge.desc}</p>
								</div>

								{!badge.unlocked && (
									<div className="space-y-1.5 pt-1">
										<div className="w-full bg-muted rounded-full h-2 overflow-hidden">
											<div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
										</div>
										<div className="flex justify-between text-[10px] font-mono text-muted-foreground">
											<span>Progress</span>
											<span>{progressPercent}%</span>
										</div>
									</div>
								)}
							</Card>
						);
					})}
				</div>
			</div>
		</div>
	);
}
