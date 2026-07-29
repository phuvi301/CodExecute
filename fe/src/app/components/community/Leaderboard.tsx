import { useState, useEffect } from 'react';
import {
	Trophy,
	Medal,
	Flame,
	Code2,
	TrendingUp,
	Search,
	Loader2,
	UserCheck,
	Sparkles,
	ArrowUpRight
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getLeaderboardApi, LeaderboardUser } from '../../services/api';

export function Leaderboard() {
	const navigate = useNavigate();
	const { user: currentUser } = useAuth();
	const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		async function fetchLeaderboard() {
			setIsLoading(true);
			try {
				const data = await getLeaderboardApi();
				setLeaderboard(data);
			} catch (err) {
				console.error('Failed to fetch leaderboard:', err);
			} finally {
				setIsLoading(false);
			}
		}
		fetchLeaderboard();
	}, []);

	const getInitials = (name?: string) => {
		if (!name) return 'U';
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const filteredLeaderboard = leaderboard.filter(item => {
		if (!searchQuery.trim()) return true;
		const q = searchQuery.toLowerCase().trim();
		return (
			item.full_name.toLowerCase().includes(q) ||
			item.email.toLowerCase().includes(q) ||
			(item.title && item.title.toLowerCase().includes(q))
		);
	});

	const top3 = leaderboard.slice(0, 3);
	const firstPlace = top3[0];
	const secondPlace = top3[1];
	const thirdPlace = top3[2];

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-6 py-16 flex flex-col justify-center items-center gap-3 text-muted-foreground">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
				<span className="text-sm font-medium">Loading leaderboard rankings...</span>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
			{/* Page Header */}
			<div className="relative overflow-hidden bg-card/70 backdrop-blur-xl border border-border/80 rounded-2xl shadow-lg p-6 sm:p-8">
				<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-primary to-blue-500" />
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
					<div className="space-y-1">
						<div className="flex items-center gap-2.5">
							<div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
								<Trophy className="w-5 h-5 fill-amber-500" />
							</div>
							<h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">Leaderboard</h1>
						</div>
						<p className="text-xs sm:text-sm text-muted-foreground">
							Top developers ranked by solved coding challenges, active streaks, and acceptance accuracy.
						</p>
					</div>
				</div>
			</div>

			{/* Top 3 Podium Cards */}
			{top3.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
					{/* 2nd Place */}
					{secondPlace && (
						<Card className="order-2 md:order-1 p-6 bg-card/70 backdrop-blur-xl border border-slate-400/30 rounded-2xl shadow-md flex flex-col items-center text-center relative hover:border-slate-400/60 transition-all">
							<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-300 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-extrabold text-xs px-3 py-0.5 rounded-full border border-slate-400/50 shadow-sm flex items-center gap-1">
								<Medal className="w-3.5 h-3.5 text-slate-400" />
								<span>2ND PLACE</span>
							</div>

							<Avatar className="w-20 h-20 border-4 border-slate-400/40 rounded-2xl shadow-lg mt-2 mb-3">
								<AvatarImage src={secondPlace.avatar_url} alt={secondPlace.full_name} />
								<AvatarFallback className="bg-slate-700 text-slate-100 font-bold text-lg">
									{getInitials(secondPlace.full_name)}
								</AvatarFallback>
							</Avatar>

							<h3 className="text-foreground font-bold text-base line-clamp-1">{secondPlace.full_name}</h3>
							<p className="text-xs text-muted-foreground font-medium mb-3">{secondPlace.title || 'Developer'}</p>

							<div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs font-mono">
								<div className="bg-muted/40 p-2 rounded-xl border border-border/40">
									<span className="text-muted-foreground text-[10px] uppercase block font-sans">Solved</span>
									<span className="text-foreground font-bold text-sm">{secondPlace.solved_count}</span>
								</div>
								<div className="bg-muted/40 p-2 rounded-xl border border-border/40">
									<span className="text-muted-foreground text-[10px] uppercase block font-sans">Streak</span>
									<span className="text-amber-500 font-bold text-sm flex items-center justify-center gap-1">
										{secondPlace.current_streak} <Flame className="w-3 h-3 fill-amber-500" />
									</span>
								</div>
							</div>

							<Button
								variant="outline"
								size="sm"
								className="w-full mt-4 rounded-xl h-8 text-xs font-semibold border-border hover:bg-accent gap-1 cursor-pointer"
								onClick={() => navigate(`/profile/${secondPlace.user_id}`)}
							>
								<span>View Profile</span>
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Button>
						</Card>
					)}

					{/* 1st Place (Gold Podium) */}
					{firstPlace && (
						<Card className="order-1 md:order-2 p-7 bg-gradient-to-b from-amber-500/10 via-card/80 to-card/90 backdrop-blur-xl border-2 border-amber-500/50 rounded-2xl shadow-xl flex flex-col items-center text-center relative hover:border-amber-500 transition-all transform md:-translate-y-2">
							<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs px-4 py-1 rounded-full border border-amber-400 shadow-md flex items-center gap-1.5 uppercase tracking-wider">
								<Trophy className="w-4 h-4 fill-slate-950" />
								<span>CHAMPION #1</span>
							</div>

							<Avatar className="w-24 h-24 border-4 border-amber-500 rounded-2xl shadow-2xl mt-2 mb-3 ring-4 ring-amber-500/30">
								<AvatarImage src={firstPlace.avatar_url} alt={firstPlace.full_name} />
								<AvatarFallback className="bg-gradient-to-br from-amber-500 to-yellow-600 text-slate-950 font-black text-2xl">
									{getInitials(firstPlace.full_name)}
								</AvatarFallback>
							</Avatar>

							<h3 className="text-foreground font-extrabold text-lg line-clamp-1">{firstPlace.full_name}</h3>
							<p className="text-xs text-amber-500 font-semibold mb-3">{firstPlace.title || 'Master Developer'}</p>

							<div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-amber-500/20 text-xs font-mono">
								<div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
									<span className="text-muted-foreground text-[10px] uppercase block font-sans">Solved</span>
									<span className="text-foreground font-bold text-sm">{firstPlace.solved_count}</span>
								</div>
								<div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
									<span className="text-muted-foreground text-[10px] uppercase block font-sans">Streak</span>
									<span className="text-amber-500 font-bold text-sm flex items-center justify-center gap-0.5">
										{firstPlace.current_streak} <Flame className="w-3 h-3 fill-amber-500" />
									</span>
								</div>
								<div className="bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
									<span className="text-muted-foreground text-[10px] uppercase block font-sans">Acc %</span>
									<span className="text-emerald-500 font-bold text-sm">{firstPlace.acceptance_rate}%</span>
								</div>
							</div>

							<Button
								size="sm"
								className="w-full mt-4 rounded-xl h-9 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
								onClick={() => navigate(`/profile/${firstPlace.user_id}`)}
							>
								<span>View Profile</span>
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Button>
						</Card>
					)}

					{/* 3rd Place */}
					{thirdPlace && (
						<Card className="order-3 p-6 bg-card/70 backdrop-blur-xl border border-amber-700/30 rounded-2xl shadow-md flex flex-col items-center text-center relative hover:border-amber-700/60 transition-all">
							<div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-800/80 text-amber-100 font-extrabold text-xs px-3 py-0.5 rounded-full border border-amber-700/50 shadow-sm flex items-center gap-1">
								<Medal className="w-3.5 h-3.5 text-amber-500" />
								<span>3RD PLACE</span>
							</div>

							<Avatar className="w-20 h-20 border-4 border-amber-700/40 rounded-2xl shadow-lg mt-2 mb-3">
								<AvatarImage src={thirdPlace.avatar_url} alt={thirdPlace.full_name} />
								<AvatarFallback className="bg-amber-900 text-amber-100 font-bold text-lg">
									{getInitials(thirdPlace.full_name)}
								</AvatarFallback>
							</Avatar>

							<h3 className="text-foreground font-bold text-base line-clamp-1">{thirdPlace.full_name}</h3>
							<p className="text-xs text-muted-foreground font-medium mb-3">{thirdPlace.title || 'Developer'}</p>

							<div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-border/60 text-xs font-mono">
								<div className="bg-muted/40 p-2 rounded-xl border border-border/40">
									<span className="text-muted-foreground text-[10px] uppercase block font-sans">Solved</span>
									<span className="text-foreground font-bold text-sm">{thirdPlace.solved_count}</span>
								</div>
								<div className="bg-muted/40 p-2 rounded-xl border border-border/40">
									<span className="text-muted-foreground text-[10px] uppercase block font-sans">Streak</span>
									<span className="text-amber-500 font-bold text-sm flex items-center justify-center gap-1">
										{thirdPlace.current_streak} <Flame className="w-3 h-3 fill-amber-500" />
									</span>
								</div>
							</div>

							<Button
								variant="outline"
								size="sm"
								className="w-full mt-4 rounded-xl h-8 text-xs font-semibold border-border hover:bg-accent gap-1 cursor-pointer"
								onClick={() => navigate(`/profile/${thirdPlace.user_id}`)}
							>
								<span>View Profile</span>
								<ArrowUpRight className="w-3.5 h-3.5" />
							</Button>
						</Card>
					)}
				</div>
			)}

			{/* Full Rankings Table Card */}
			<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
					<h3 className="text-lg font-bold text-foreground flex items-center gap-2">
						<Code2 className="w-5 h-5 text-primary" />
						<span>Full Leaderboard Standings</span>
					</h3>

					{/* Search input */}
					<div className="relative w-full sm:w-72">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search developer..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 h-9 rounded-xl bg-background border-border text-xs focus:ring-1 focus:ring-primary"
						/>
					</div>
				</div>

				{/* Table */}
				<div className="overflow-x-auto rounded-xl border border-border/60">
					<table className="w-full text-left text-xs">
						<thead className="bg-muted/50 text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border/60">
							<tr>
								<th className="py-3 px-4 w-16 text-center">Rank</th>
								<th className="py-3 px-4">Developer</th>
								<th className="py-3 px-4 text-center">Solved</th>
								<th className="py-3 px-4 text-center">Breakdown (E/M/H)</th>
								<th className="py-3 px-4 text-center">Acceptance</th>
								<th className="py-3 px-4 text-center">Active Streak</th>
								<th className="py-3 px-4 text-right">Action</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-border/60 font-medium">
							{filteredLeaderboard.length === 0 ? (
								<tr>
									<td colSpan={7} className="py-8 text-center text-muted-foreground">
										No developers found matching your search.
									</td>
								</tr>
							) : (
								filteredLeaderboard.map((item) => {
									const isMe = Boolean(currentUser?.user_id && item.user_id === currentUser.user_id);

									return (
										<tr
											key={item.user_id}
											className={`hover:bg-accent/40 transition-colors ${
												isMe ? 'bg-primary/5 dark:bg-primary/10 border-l-4 border-l-primary' : ''
											}`}
										>
											{/* Rank Badge */}
											<td className="py-3.5 px-4 text-center font-bold font-mono">
												{item.rank === 1 ? (
													<span className="inline-flex w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-extrabold items-center justify-center shadow-md">1</span>
												) : item.rank === 2 ? (
													<span className="inline-flex w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-950 dark:text-slate-100 font-extrabold items-center justify-center">2</span>
												) : item.rank === 3 ? (
													<span className="inline-flex w-7 h-7 rounded-full bg-amber-800 text-amber-100 font-extrabold items-center justify-center">3</span>
												) : (
													<span className="text-muted-foreground">#{item.rank}</span>
												)}
											</td>

											{/* Developer Info */}
											<td className="py-3.5 px-4">
												<div className="flex items-center gap-3">
													<Avatar
														className="w-10 h-10 border border-border shrink-0 cursor-pointer"
														onClick={() => navigate(`/profile/${item.user_id}`)}
													>
														<AvatarImage src={item.avatar_url} alt={item.full_name} />
														<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
															{getInitials(item.full_name)}
														</AvatarFallback>
													</Avatar>

													<div>
														<div className="flex items-center gap-2">
															<span
																className="font-bold text-foreground hover:text-primary cursor-pointer transition-colors text-sm"
																onClick={() => navigate(`/profile/${item.user_id}`)}
															>
																{item.full_name}
															</span>
															{isMe && (
																<Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0 font-semibold">You</Badge>
															)}
														</div>
														<p className="text-[11px] text-muted-foreground font-mono">{item.title || 'Developer'}</p>
													</div>
												</div>
											</td>

											{/* Solved Count */}
											<td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-foreground">
												{item.solved_count}
											</td>

											{/* Breakdown Easy/Medium/Hard */}
											<td className="py-3.5 px-4 text-center font-mono">
												<div className="flex items-center justify-center gap-1.5 text-[11px]">
													<span className="text-emerald-500 font-semibold">{item.easy_solved}</span>
													<span className="text-muted-foreground/40">/</span>
													<span className="text-amber-500 font-semibold">{item.medium_solved}</span>
													<span className="text-muted-foreground/40">/</span>
													<span className="text-rose-500 font-semibold">{item.hard_solved}</span>
												</div>
											</td>

											{/* Acceptance Rate */}
											<td className="py-3.5 px-4 text-center font-mono text-xs">
												<span className="text-blue-500 font-semibold">{item.acceptance_rate}%</span>
												<span className="text-[10px] text-muted-foreground block">{item.total_submissions} subs</span>
											</td>

											{/* Active Streak */}
											<td className="py-3.5 px-4 text-center font-mono">
												<div className="inline-flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-xs">
													<Flame className="w-3.5 h-3.5 fill-amber-500" />
													<span>{item.current_streak} days</span>
												</div>
											</td>

											{/* Action button */}
											<td className="py-3.5 px-4 text-right">
												<Button
													variant="ghost"
													size="sm"
													className="h-8 rounded-xl px-3 text-xs font-semibold text-primary hover:bg-primary/10 gap-1 cursor-pointer"
													onClick={() => navigate(`/profile/${item.user_id}`)}
												>
													<span>Profile</span>
													<ArrowUpRight className="w-3.5 h-3.5" />
												</Button>
											</td>
										</tr>
									);
								})
							)}
						</tbody>
					</table>
				</div>
			</Card>
		</div>
	);
}
