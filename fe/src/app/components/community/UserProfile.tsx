import { useState, useEffect } from 'react';
import {
	MapPin,
	Mail,
	Award,
	Code2,
	Trophy,
	Star,
	Pencil,
	Check,
	Zap,
	Sparkles,
	Clock,
	ExternalLink,
	Share2,
	UserPlus,
	UserCheck,
	CheckCircle2,
	TrendingUp,
	Flame,
	Users
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getProfileApi, followUserApi, unfollowUserApi, UserProfile as UserProfileType } from '../../services/api';

export function UserProfile() {
	const navigate = useNavigate();
	const { userId: urlUserId } = useParams<{ userId?: string }>();
	const { user: currentUser } = useAuth();

	const targetUserId = urlUserId || currentUser?.user_id || '';

	const [profile, setProfile] = useState<UserProfileType | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmittingFollow, setIsSubmittingFollow] = useState<boolean>(false);
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		async function loadProfile() {
			if (!targetUserId) {
				setIsLoading(false);
				return;
			}
			setIsLoading(true);
			try {
				const data = await getProfileApi(targetUserId);
				setProfile(data);
			} catch (err) {
				console.error("Lỗi khi tải profile:", err);
				setProfile(null);
			} finally {
				setIsLoading(false);
			}
		}
		loadProfile();
	}, [targetUserId]);

	const handleToggleFollow = async () => {
		if (!profile || isSubmittingFollow || !profile.can_follow) return;
		setIsSubmittingFollow(true);
		try {
			if (profile.is_following) {
				const updated = await unfollowUserApi(profile.user_id);
				setProfile(updated);
			} else {
				const updated = await followUserApi(profile.user_id);
				setProfile(updated);
			}
		} catch (err) {
			console.error("Lỗi thay đổi trạng thái follow:", err);
		} finally {
			setIsSubmittingFollow(false);
		}
	};

	const displayName = profile?.full_name || currentUser?.full_name || 'User';
	const displayEmail = profile?.email || currentUser?.email || '';
	const displayTitle = profile?.title || 'Developer';
	const displayAddress = profile?.address || 'Unknown';

	const getInitials = (name: string) => {
		if (!name) return 'U';
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const copyProfileLink = () => {
		navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const achievements = [
		{ id: 1, title: '100 Day Streak', desc: 'Solved coding problems for 100 consecutive days', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', unlocked: true },
		{ id: 2, title: 'Algorithm Master', desc: 'Solved over 50 hard algorithm problems', icon: Star, color: 'text-purple-500', bg: 'bg-purple-500/10 border-purple-500/20', unlocked: true },
		{ id: 3, title: 'Speed Demon', desc: 'Beat 95%+ runtime on 20 different problems', icon: Zap, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', unlocked: true },
		{ id: 4, title: 'Problem Solver', desc: 'Successfully solved over 80 coding challenges', icon: Code2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', unlocked: true },
		{ id: 5, title: 'Graph Guru', desc: 'Mastered all Graph & BFS/DFS problems', icon: Sparkles, color: 'text-rose-500', bg: 'bg-rose-500/10 border-rose-500/20', unlocked: true },
		{ id: 6, title: 'Community Star', desc: 'Received 100+ likes on solution discussions', icon: Award, color: 'text-cyan-500', bg: 'bg-cyan-500/10 border-cyan-500/20', unlocked: false }
	];

	const problemStats = [
		{ label: 'Easy', count: 45, total: 100, color: 'bg-emerald-500', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
		{ label: 'Medium', count: 32, total: 150, color: 'bg-amber-500', badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' },
		{ label: 'Hard', count: 10, total: 80, color: 'bg-rose-500', badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30' }
	];

	const recentSubmissions = [
		{ problem: 'Two Sum', difficulty: 'Easy', status: 'Accepted', runtime: '52 ms', beats: '88.4%', time: '2 hours ago' },
		{ problem: 'Binary Tree Level Order Traversal', difficulty: 'Medium', status: 'Accepted', runtime: '64 ms', beats: '92.1%', time: '5 hours ago' },
		{ problem: 'Longest Substring Without Repeating', difficulty: 'Medium', status: 'Accepted', runtime: '78 ms', beats: '84.5%', time: '1 day ago' },
		{ problem: 'Median of Two Sorted Arrays', difficulty: 'Hard', status: 'Accepted', runtime: '44 ms', beats: '98.4%', time: '2 days ago' },
		{ problem: 'Valid Parentheses', difficulty: 'Easy', status: 'Accepted', runtime: '36 ms', beats: '96.2%', time: '3 days ago' }
	];

	const skills = [
		{ name: 'Python', level: 92, category: 'Language' },
		{ name: 'JavaScript', level: 88, category: 'Language' },
		{ name: 'Data Structures', level: 85, category: 'Core' },
		{ name: 'Algorithms & Dynamic Programming', level: 80, category: 'Core' },
		{ name: 'C++', level: 74, category: 'Language' },
		{ name: 'System Design', level: 70, category: 'Architecture' }
	];

	const recentActivity = [
		{ id: 1, type: 'problem', title: 'Solved "Two Sum" with Optimal Hash Map', detail: 'Runtime: 52 ms (Beats 88.4%)', time: '2 hours ago' },
		{ id: 2, type: 'achievement', title: 'Unlocked Badge "100 Day Streak"', detail: 'Completed daily challenges for 100 days straight!', time: '1 day ago' },
		{ id: 3, type: 'problem', title: 'Solved "Median of Two Sorted Arrays"', detail: 'Binary Search partition strategy • Runtime: 44 ms', time: '2 days ago' },
		{ id: 4, type: 'discussion', title: 'Posted solution in "Optimal Approach using Hash Map"', detail: 'Received 14 upvotes from the community', time: '3 days ago' }
	];

	if (isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-6 py-12 flex justify-center items-center text-muted-foreground">
				<span>Loading user profile...</span>
			</div>
		);
	}

	if (!profile && !isLoading) {
		return (
			<div className="max-w-7xl mx-auto px-6 py-12 flex justify-center items-center text-muted-foreground">
				<span>Cannot find user profile.</span>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
			{/* Main Profile Header Card */}
			<Card className="relative overflow-hidden bg-card/70 backdrop-blur-xl border border-border/80 rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
				{/* Top subtle decorative accent glow */}
				<div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-blue-500 to-indigo-500" />

				{/* Profile Info Container */}
				<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
						{/* Avatar */}
						<div className="relative shrink-0">
							<Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-4 border-background rounded-2xl shadow-xl ring-2 ring-primary/20">
								<AvatarImage src={profile?.avatar_url} alt={displayName} className="object-cover" />
								<AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground text-3xl font-extrabold rounded-2xl">
									{getInitials(displayName || '')}
								</AvatarFallback>
							</Avatar>
							<span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background ring-2 ring-emerald-500/20" title="Online"></span>
						</div>

						{/* User Details */}
						<div className="space-y-2">
							<div className="flex items-center gap-3 flex-wrap">
								<h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{displayName}</h1>
								{profile?.role && (
									<Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
										{profile.role}
									</Badge>
								)}
							</div>

							<p className="text-sm font-semibold text-primary/90 flex items-center gap-2">
								<span>{displayTitle}</span>
							</p>

							{profile?.bio && (
								<p className="text-xs text-muted-foreground max-w-xl leading-relaxed italic">
									"{profile.bio}"
								</p>
							)}

							<div className="flex items-center gap-3 text-muted-foreground text-xs pt-1 flex-wrap font-medium">
								<div className="flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-xl border border-border/40">
									<MapPin className="w-3.5 h-3.5 text-primary" />
									<span className="text-foreground">{displayAddress}</span>
								</div>
								<div className="flex items-center gap-1.5 bg-accent/50 px-3 py-1.5 rounded-xl border border-border/40">
									<Mail className="w-3.5 h-3.5 text-primary" />
									<span className="font-mono text-foreground">{displayEmail}</span>
								</div>
								<div className="flex items-center gap-2 bg-accent/50 px-3 py-1.5 rounded-xl border border-border/40 font-semibold text-foreground">
									<Users className="w-3.5 h-3.5 text-primary" />
									<span><strong className="text-primary">{profile?.followers_count || 0}</strong> Followers</span>
									<span>•</span>
									<span><strong className="text-primary">{profile?.following_count || 0}</strong> Following</span>
								</div>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-start sm:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-border/60">
						<Button
							variant="outline"
							size="sm"
							className="gap-2 rounded-xl h-10 px-4 text-xs font-semibold border-border hover:bg-accent cursor-pointer"
							onClick={copyProfileLink}
						>
							{copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
							<span>{copied ? 'Link Copied' : 'Share'}</span>
						</Button>

						{/* Nếu là profile của bản thân: Hiển thị Edit Profile */}
						{profile?.can_edit && (
							<Button
								variant="outline"
								size="sm"
								className="gap-2 rounded-xl h-10 px-4 text-xs font-semibold border-border hover:bg-accent cursor-pointer"
								onClick={() => navigate('/settings')}
							>
								<Pencil className="w-4 h-4 text-primary" />
								<span>Edit Profile</span>
							</Button>
						)}

						{/* Nếu là profile người khác: Hiển thị Follow / Following */}
						{profile?.can_follow && (
							<Button
								size="sm"
								onClick={handleToggleFollow}
								disabled={isSubmittingFollow}
								className={`gap-2 rounded-xl h-10 px-5 text-xs font-semibold shadow-md transition-all ${
									profile.is_following
										? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
										: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20'
								}`}
							>
								{profile.is_following ? <UserCheck className="w-4 h-4 text-emerald-500" /> : <UserPlus className="w-4 h-4" />}
								<span>{profile.is_following ? 'Following' : 'Follow'}</span>
							</Button>
						)}
					</div>
				</div>

				{/* Developer Stat Highlights Cards */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-border/60">
					{/* Problems Solved */}
					<Card className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-xl shadow-sm flex items-center gap-4 hover:border-primary/40 transition-colors">
						<div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0">
							<Code2 className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Problems Solved</p>
							<div className="flex items-baseline gap-2 mt-0.5">
								<span className="text-2xl font-extrabold text-foreground">87</span>
								<span className="text-xs text-emerald-500 font-semibold font-mono">26% Total</span>
							</div>
						</div>
					</Card>

					{/* Acceptance Rate */}
					<Card className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-xl shadow-sm flex items-center gap-4 hover:border-primary/40 transition-colors">
						<div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shrink-0">
							<TrendingUp className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acceptance Rate</p>
							<div className="flex items-baseline gap-2 mt-0.5">
								<span className="text-2xl font-extrabold text-foreground">68.4%</span>
								<span className="text-xs text-blue-500 font-semibold font-mono">120 Subs</span>
							</div>
						</div>
					</Card>

					{/* Day Streak */}
					<Card className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-xl shadow-sm flex items-center gap-4 hover:border-primary/40 transition-colors">
						<div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
							<Flame className="w-6 h-6 fill-amber-500" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Streak</p>
							<div className="flex items-baseline gap-2 mt-0.5">
								<span className="text-2xl font-extrabold text-foreground">47 Days</span>
								<span className="text-xs text-amber-500 font-semibold font-mono">Best: 60</span>
							</div>
						</div>
					</Card>

					{/* Achievements Count */}
					<Card className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-xl shadow-sm flex items-center gap-4 hover:border-primary/40 transition-colors">
						<div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shrink-0">
							<Trophy className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Badges Unlocked</p>
							<div className="flex items-baseline gap-2 mt-0.5">
								<span className="text-2xl font-extrabold text-foreground">15</span>
								<span className="text-xs text-purple-500 font-semibold font-mono">Top 5%</span>
							</div>
						</div>
					</Card>
				</div>
			</Card>

			{/* Main Profile Tabs: Problems, Achievements, Skills, Activity */}
			<Tabs defaultValue="problems" className="space-y-6">
				<div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl p-1.5">
					<TabsList className="bg-transparent w-full justify-start gap-2">
						<TabsTrigger value="problems" className="rounded-xl text-xs font-semibold px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
							Problems & Submissions
						</TabsTrigger>
						<TabsTrigger value="achievements" className="rounded-xl text-xs font-semibold px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
							Achievements
						</TabsTrigger>
						<TabsTrigger value="skills" className="rounded-xl text-xs font-semibold px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
							Skills & Languages
						</TabsTrigger>
						<TabsTrigger value="activity" className="rounded-xl text-xs font-semibold px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">
							Activity Log
						</TabsTrigger>
					</TabsList>
				</div>

				{/* TAB 1: Problems & Submissions */}
				<TabsContent value="problems" className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
						{problemStats.map((stat) => (
							<Card key={stat.label} className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-3">
								<div className="flex items-center justify-between">
									<h3 className="text-foreground font-bold text-base">{stat.label}</h3>
									<Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-semibold ${stat.badgeClass}`}>
										{stat.count} Solved
									</Badge>
								</div>
								<div className="space-y-2">
									<div className="w-full bg-muted rounded-full h-2.5 overflow-hidden p-0.5 border border-border/40">
										<div className={`${stat.color} h-full rounded-full transition-all duration-500`} style={{ width: `${(stat.count / stat.total) * 100}%` }}></div>
									</div>
									<div className="flex justify-between text-xs text-muted-foreground font-mono">
										<span>Progress</span>
										<span>{stat.count} / {stat.total}</span>
									</div>
								</div>
							</Card>
						))}
					</div>

					{/* Submissions List */}
					<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-4">
						<div className="flex items-center justify-between">
							<h3 className="text-foreground font-bold text-lg flex items-center gap-2">
								<CheckCircle2 className="w-5 h-5 text-emerald-500" />
								<span>Recent Accepted Submissions</span>
							</h3>
							<Button variant="ghost" size="sm" className="text-xs text-primary font-medium hover:underline gap-1" onClick={() => navigate('/problems')}>
								<span>View All Problems</span>
								<ExternalLink className="w-3.5 h-3.5" />
							</Button>
						</div>

						<div className="space-y-2.5">
							{recentSubmissions.map((submission, i) => (
								<div
									key={i}
									className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-background/60 rounded-xl border border-border/60 hover:border-primary/40 transition-colors cursor-pointer gap-3"
									onClick={() => navigate('/problems/1')}
								>
									<div className="flex items-center gap-3">
										<Badge
											variant="outline"
											className={`text-xs px-2.5 py-0.5 font-medium shrink-0 ${
												submission.difficulty === 'Easy'
													? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
													: submission.difficulty === 'Medium'
													? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
													: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
											}`}
										>
											{submission.difficulty}
										</Badge>
										<span className="text-foreground font-semibold text-sm hover:text-primary transition-colors">
											{submission.problem}
										</span>
									</div>

									<div className="flex items-center gap-4 text-xs font-mono shrink-0">
										<Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[11px] gap-1">
											<Check className="w-3 h-3" />
											<span>{submission.status}</span>
										</Badge>
										<span className="text-muted-foreground">{submission.runtime}</span>
										<span className="text-emerald-500 font-semibold">{submission.beats}</span>
										<span className="text-muted-foreground/60">{submission.time}</span>
									</div>
								</div>
							))}
						</div>
					</Card>
				</TabsContent>

				{/* TAB 2: Achievements & Badges */}
				<TabsContent value="achievements" className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{achievements.map((achievement) => (
							<Card
								key={achievement.id}
								className={`p-5 bg-card/60 backdrop-blur-xl border rounded-2xl shadow-sm transition-all ${
									achievement.unlocked ? 'border-border/80 hover:border-primary/40' : 'border-border/40 opacity-60'
								}`}
							>
								<div className="flex items-start gap-4">
									<div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${achievement.bg}`}>
										<achievement.icon className={`w-7 h-7 ${achievement.color}`} />
									</div>
									<div className="space-y-1">
										<div className="flex items-center gap-2">
											<h4 className="text-foreground font-bold text-sm">{achievement.title}</h4>
											{achievement.unlocked ? (
												<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] px-1.5 py-0">Unlocked</Badge>
											) : (
												<Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0">Locked</Badge>
											)}
										</div>
										<p className="text-muted-foreground text-xs leading-relaxed">{achievement.desc}</p>
									</div>
								</div>
							</Card>
						))}
					</div>
				</TabsContent>

				{/* TAB 3: Skills & Languages */}
				<TabsContent value="skills" className="space-y-4">
					<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-6">
						<div>
							<h3 className="text-foreground font-bold text-lg mb-1">Developer Skills & Proficiency</h3>
							<p className="text-muted-foreground text-xs">Based on solved problems, algorithm categories, and code submissions.</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{skills.map((skill) => (
								<div key={skill.name} className="space-y-2 p-4 rounded-xl bg-background/60 border border-border/60">
									<div className="flex justify-between items-center text-sm font-medium">
										<span className="text-foreground font-semibold flex items-center gap-2">
											<Code2 className="w-4 h-4 text-primary" />
											{skill.name}
										</span>
										<div className="flex items-center gap-2">
											<Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20">
												{skill.category}
											</Badge>
											<span className="font-mono text-xs font-bold text-primary">{skill.level}%</span>
										</div>
									</div>
									<div className="w-full bg-muted rounded-full h-2 overflow-hidden p-0.5 border border-border/40">
										<div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${skill.level}%` }}></div>
									</div>
								</div>
							))}
						</div>
					</Card>
				</TabsContent>

				{/* TAB 4: Activity Log */}
				<TabsContent value="activity" className="space-y-4">
					<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-6">
						<h3 className="text-foreground font-bold text-lg flex items-center gap-2">
							<Clock className="w-5 h-5 text-primary" />
							<span>Recent Activity Timeline</span>
						</h3>

						<div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
							{recentActivity.map((act) => (
								<div key={act.id} className="relative flex items-start gap-4">
									<div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background"></div>
									<div className="bg-background/60 p-4 rounded-xl border border-border/60 flex-1 space-y-1">
										<div className="flex items-center justify-between gap-2">
											<h4 className="text-foreground font-bold text-sm">{act.title}</h4>
											<span className="text-xs text-muted-foreground font-mono">{act.time}</span>
										</div>
										<p className="text-muted-foreground text-xs">{act.detail}</p>
									</div>
								</div>
							))}
						</div>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
}