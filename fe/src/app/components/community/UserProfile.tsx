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
	Users,
	ThumbsUp,
	MessageCircle,
	Repeat,
	Send,
	Trash2,
	Loader2,
	FileText
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PROBLEMS_LIST } from '../../context/ProblemContext';
import {
	getProfileApi,
	followUserApi,
	unfollowUserApi,
	getUserPostsApi,
	toggleLikePostApi,
	toggleRepostPostApi,
	addCommentApi,
	deletePostApi,
	deleteCommentApi,
	getAccessToken,
	PostItem,
	UserProfile as UserProfileType
} from '../../services/api';
import { FollowListModal } from './FollowListModal';

export function UserProfile() {
	const navigate = useNavigate();
	const { userId: urlUserId } = useParams<{ userId?: string }>();
	const { user: currentUser } = useAuth();

	const targetUserId = urlUserId || currentUser?.user_id || '';

	const [profile, setProfile] = useState<UserProfileType | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isSubmittingFollow, setIsSubmittingFollow] = useState<boolean>(false);
	const [copied, setCopied] = useState(false);

	const [isFollowModalOpen, setIsFollowModalOpen] = useState<boolean>(false);
	const [followModalTab, setFollowModalTab] = useState<'followers' | 'following'>('followers');

	// Posts state & functions
	const [userPosts, setUserPosts] = useState<PostItem[]>([]);
	const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(true);
	const [postsFilter, setPostsFilter] = useState<'all' | 'posted' | 'reposted'>('all');

	// Comments state
	const [openCommentsMap, setOpenCommentsMap] = useState<Record<string, boolean>>({});
	const [commentInputsMap, setCommentInputsMap] = useState<Record<string, string>>({});
	const [commentSubmittingMap, setCommentSubmittingMap] = useState<Record<string, boolean>>({});

	const fetchUserPosts = async () => {
		if (!targetUserId) return;
		setIsLoadingPosts(true);
		try {
			const data = await getUserPostsApi(targetUserId);
			setUserPosts(data);
		} catch (err) {
			console.error("Failed to load user posts:", err);
		} finally {
			setIsLoadingPosts(false);
		}
	};

	useEffect(() => {
		fetchUserPosts();
	}, [targetUserId]);

	const formatTimeAgo = (dateStr?: string) => {
		if (!dateStr) return 'Just now';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;

		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffSec = Math.floor(diffMs / 1000);
		const diffMin = Math.floor(diffSec / 60);
		const diffHour = Math.floor(diffMin / 60);
		const diffDay = Math.floor(diffHour / 24);

		if (diffSec < 60) return 'Just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		if (diffHour < 24) return `${diffHour}h ago`;
		if (diffDay < 7) return `${diffDay}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	};

	const getProblemTitle = (problemId: string) => {
		const found = PROBLEMS_LIST.find(p => p.id === problemId || p.id === problemId.toLowerCase());
		if (found) return found.title;
		return problemId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
	};

	const highlightCodeToHtml = (codeStr: string) => {
		if (!codeStr) return '';
		let escaped = codeStr
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');

		const comments: string[] = [];
		escaped = escaped.replace(/(#.*|\/\/.*)/g, (match) => {
			comments.push(match);
			return `§C${comments.length - 1}§`;
		});

		const strings: string[] = [];
		escaped = escaped.replace(/(".*?"|'.*?'|`.*?`)/g, (match) => {
			strings.push(match);
			return `§S${strings.length - 1}§`;
		});

		const keywords = /\b(def|class|return|if|elif|else|for|while|import|from|in|as|try|except|finally|raise|pass|lambda|const|let|var|function|async|await|public|private|static|void|int|float|double|char|bool|string|include|using|namespace|struct|interface|type)\b/g;
		escaped = escaped.replace(keywords, '<span class="syn-kw">$1</span>');

		const builtins = /\b(self|True|False|None|true|false|null|undefined|this|console|print|len|range|enumerate|zip|dict|list|set|int|str)\b/g;
		escaped = escaped.replace(builtins, '<span class="syn-bi">$1</span>');

		const numbers = /\b(\d+(\.\d+)?)\b/g;
		escaped = escaped.replace(numbers, '<span class="syn-num">$1</span>');

		const functions = /\b([a-zA-Z_]\w*)\s*\(/g;
		escaped = escaped.replace(functions, '<span class="syn-fn">$1</span>(');

		escaped = escaped.replace(/§S(\d+)§/g, (_, idx) => {
			return `<span class="syn-str">${strings[parseInt(idx)]}</span>`;
		});

		escaped = escaped.replace(/§C(\d+)§/g, (_, idx) => {
			return `<span class="syn-com">${comments[parseInt(idx)]}</span>`;
		});

		return escaped;
	};

	const handleToggleLike = async (postId: string) => {
		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		const currentUserId = currentUser?.user_id || '';

		setUserPosts(prev =>
			prev.map(p => {
				if (p.post_id !== postId) return p;
				const isLiked = p.liked_by?.includes(currentUserId);
				const newLikedBy = isLiked
					? (p.liked_by || []).filter(id => id !== currentUserId)
					: [...(p.liked_by || []), currentUserId];
				const newLikesCount = isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1;
				return { ...p, likes_count: newLikesCount, liked_by: newLikedBy };
			})
		);

		try {
			const updatedPost = await toggleLikePostApi(authToken, postId);
			setUserPosts(prev =>
				prev.map(p => (p.post_id === postId ? { ...p, likes_count: updatedPost.likes_count, liked_by: updatedPost.liked_by } : p))
			);
		} catch (err) {
			console.error('Failed to toggle like:', err);
			fetchUserPosts();
		}
	};

	const handleToggleRepost = async (postId: string) => {
		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		const currentUserId = currentUser?.user_id || '';

		setUserPosts(prev =>
			prev.map(p => {
				if (p.post_id !== postId) return p;
				const isReposted = p.reposted_by?.includes(currentUserId);
				const newRepostedBy = isReposted
					? (p.reposted_by || []).filter(id => id !== currentUserId)
					: [...(p.reposted_by || []), currentUserId];
				const newRepostsCount = isReposted ? Math.max(0, (p.reposts_count || 0) - 1) : (p.reposts_count || 0) + 1;
				return { ...p, reposts_count: newRepostsCount, reposted_by: newRepostedBy };
			})
		);

		try {
			const updatedPost = await toggleRepostPostApi(authToken, postId);
			setUserPosts(prev =>
				prev.map(p => (p.post_id === postId ? { ...p, reposts_count: updatedPost.reposts_count, reposted_by: updatedPost.reposted_by } : p))
			);
		} catch (err) {
			console.error('Failed to toggle repost:', err);
			fetchUserPosts();
		}
	};

	const toggleCommentsSection = (postId: string) => {
		setOpenCommentsMap(prev => ({ ...prev, [postId]: !prev[postId] }));
	};

	const handleAddComment = async (postId: string) => {
		const text = (commentInputsMap[postId] || '').trim();
		if (!text) return;

		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		setCommentSubmittingMap(prev => ({ ...prev, [postId]: true }));

		try {
			const updatedPost = await addCommentApi(authToken, postId, text);
			setUserPosts(prev => prev.map(p => (p.post_id === postId ? updatedPost : p)));
			setCommentInputsMap(prev => ({ ...prev, [postId]: '' }));
		} catch (err) {
			console.error('Failed to add comment:', err);
		} finally {
			setCommentSubmittingMap(prev => ({ ...prev, [postId]: false }));
		}
	};

	const handleDeleteComment = async (postId: string, commentId: string) => {
		const authToken = getAccessToken();
		if (!authToken) return;

		try {
			const updatedPost = await deleteCommentApi(authToken, postId, commentId);
			setUserPosts(prev => prev.map(p => (p.post_id === postId ? updatedPost : p)));
		} catch (err) {
			console.error('Failed to delete comment:', err);
		}
	};

	const handleDeletePost = async (postId: string) => {
		const authToken = getAccessToken();
		if (!authToken) return;

		try {
			await deletePostApi(authToken, postId);
			setUserPosts(prev => prev.filter(p => p.post_id !== postId));
		} catch (err) {
			console.error('Failed to delete post:', err);
		}
	};

	const refreshProfile = async () => {
		if (!targetUserId) return;
		try {
			const data = await getProfileApi(targetUserId);
			setProfile(data);
		} catch (err) {
			console.error("Failed to refresh profile:", err);
		}
	};

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
				console.error("Failed to load profile:", err);
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
			console.error("Failed to toggle follow status:", err);
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
									<button
										type="button"
										onClick={() => {
											setFollowModalTab('followers');
											setIsFollowModalOpen(true);
										}}
										className="hover:text-primary transition-colors cursor-pointer focus:outline-none"
									>
										<strong className="text-primary">{profile?.followers_count || 0}</strong> Followers
									</button>
									<span>•</span>
									<button
										type="button"
										onClick={() => {
											setFollowModalTab('following');
											setIsFollowModalOpen(true);
										}}
										className="hover:text-primary transition-colors cursor-pointer focus:outline-none"
									>
										<strong className="text-primary">{profile?.following_count || 0}</strong> Following
									</button>
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

			{/* Main Profile Tabs: Posts, Problems, Achievements, Skills, Activity */}
			<Tabs defaultValue="posts" className="space-y-6">
				<div className="bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl p-1.5 overflow-x-auto">
					<TabsList className="bg-transparent w-full justify-start gap-2">
						<TabsTrigger value="posts" className="rounded-xl text-xs font-semibold px-5 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all flex items-center gap-2">
							<FileText className="w-4 h-4" />
							<span>Posts & Reposts</span>
							{userPosts.length > 0 && (
								<Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5 rounded-full font-bold">
									{userPosts.length}
								</Badge>
							)}
						</TabsTrigger>
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

				{/* TAB: Posts & Reposts */}
				<TabsContent value="posts" className="space-y-6">
					{/* Sub-filter tabs */}
					<div className="flex items-center gap-2 border-b border-border/60 pb-3 overflow-x-auto">
						<button
							onClick={() => setPostsFilter('all')}
							className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
								postsFilter === 'all'
									? 'bg-primary text-primary-foreground font-semibold shadow-sm'
									: 'bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground'
							}`}
						>
							All ({userPosts.length})
						</button>
						<button
							onClick={() => setPostsFilter('posted')}
							className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
								postsFilter === 'posted'
									? 'bg-primary text-primary-foreground font-semibold shadow-sm'
									: 'bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground'
							}`}
						>
							Posts ({userPosts.filter(p => p.author_id === targetUserId).length})
						</button>
						<button
							onClick={() => setPostsFilter('reposted')}
							className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
								postsFilter === 'reposted'
									? 'bg-primary text-primary-foreground font-semibold shadow-sm'
									: 'bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground'
							}`}
						>
							Reposts ({userPosts.filter(p => p.author_id !== targetUserId).length})
						</button>
					</div>

					{/* Posts list */}
					{isLoadingPosts ? (
						<Card className="p-8 text-center bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl">
							<Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
							<p className="text-xs text-muted-foreground">Loading posts...</p>
						</Card>
					) : userPosts.filter(p => {
						if (postsFilter === 'posted') return p.author_id === targetUserId;
						if (postsFilter === 'reposted') return p.author_id !== targetUserId;
						return true;
					}).length === 0 ? (
						<Card className="p-8 text-center bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl">
							<FileText className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
							<p className="text-sm font-semibold text-foreground">No posts yet</p>
							<p className="text-xs text-muted-foreground mt-1">
								{postsFilter === 'posted'
									? "This user hasn't posted anything yet."
									: postsFilter === 'reposted'
									? "This user hasn't reposted anything yet."
									: 'No posts or repost activity yet.'}
							</p>
						</Card>
					) : (
						<div className="space-y-4">
							{userPosts
								.filter(p => {
									if (postsFilter === 'posted') return p.author_id === targetUserId;
									if (postsFilter === 'reposted') return p.author_id !== targetUserId;
									return true;
								})
								.map((post) => {
									const isRepostedByTarget = post.author_id !== targetUserId;
									const isLikedByMe = currentUser?.user_id ? post.liked_by?.includes(currentUser.user_id) : false;
									const isRepostedByMe = currentUser?.user_id ? post.reposted_by?.includes(currentUser.user_id) : false;
									const isCommentsOpen = openCommentsMap[post.post_id];
									const commentText = commentInputsMap[post.post_id] || '';
									const isSubmittingCmt = commentSubmittingMap[post.post_id];
									const canDeletePost = currentUser?.user_id && (post.author_id === currentUser.user_id || currentUser.role === 'admin');

									return (
										<Card key={post.post_id} className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-4">
											{/* Repost Header Indicator if applicable */}
											{isRepostedByTarget && (
												<div className="flex items-center gap-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
													<Repeat className="w-3.5 h-3.5" />
													<span>{displayName} reposted this post</span>
												</div>
											)}

											{/* Author Header */}
											<div className="flex items-start justify-between">
												<div className="flex items-center gap-3">
													<Avatar className="w-10 h-10 border border-border cursor-pointer" onClick={() => navigate(`/profile/${post.author_id}`)}>
														<AvatarImage src={post.author_avatar} alt={post.author_name} />
														<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
															{post.author_name ? post.author_name.substring(0, 2).toUpperCase() : 'U'}
														</AvatarFallback>
													</Avatar>
													<div>
														<h4 className="text-foreground font-bold text-sm hover:text-primary cursor-pointer transition-colors" onClick={() => navigate(`/profile/${post.author_id}`)}>
															{post.author_name}
														</h4>
														<p className="text-muted-foreground text-xs">
															{post.author_title || 'Developer'} • <span className="font-mono text-[11px]">{formatTimeAgo(post.created_at)}</span>
														</p>
													</div>
												</div>

												{canDeletePost && (
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-xl"
														onClick={() => handleDeletePost(post.post_id)}
														title="Delete Post"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												)}
											</div>

											{/* Topic Badge if associated with a Problem */}
											{post.problem_id && (
												<div className="mb-2">
													<button
														type="button"
														onClick={(e) => {
															e.stopPropagation();
															navigate(`/problems/${post.problem_id}`);
														}}
														className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold transition-all cursor-pointer group shadow-xs"
													>
														<Code2 className="w-3.5 h-3.5" />
														<span>Topic: <strong className="font-semibold">{getProblemTitle(post.problem_id)}</strong></span>
														<ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
													</button>
												</div>
											)}

											{/* Content */}
											<p className="text-foreground text-sm leading-relaxed whitespace-pre-line">{post.content}</p>

											{/* Code Snippet */}
											{post.code_snippet && post.code_snippet.code && (
												<div className="rounded-xl overflow-hidden border border-border/80 bg-slate-950 font-mono text-xs shadow-inner">
													<div className="bg-slate-900/90 px-4 py-2 flex items-center justify-between border-b border-slate-800">
														<div className="flex items-center gap-2">
															<span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
															<span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
															<span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
															<span className="text-slate-300 font-semibold ml-2 text-[11px]">{post.code_snippet.filename || 'solution.py'}</span>
														</div>
														<div className="flex items-center gap-3 text-[11px] text-slate-400">
															{post.code_snippet.runtime && <span>Runtime: <strong className="text-emerald-400">{post.code_snippet.runtime}</strong></span>}
															{post.code_snippet.beats && <span>Beats: <strong className="text-blue-400">{post.code_snippet.beats}</strong></span>}
														</div>
													</div>
													<pre className="p-4 text-slate-100 overflow-x-auto leading-relaxed" dangerouslySetInnerHTML={{ __html: highlightCodeToHtml(post.code_snippet.code) }} />
												</div>
											)}

											{/* Achievement */}
											{post.achievement && (
												<div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
													<div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
														<Trophy className="w-4 h-4 fill-slate-950" />
													</div>
													<div>
														<Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold mb-0.5">
															Achievement Unlocked
														</Badge>
														<p className="text-foreground font-bold text-xs">{post.achievement}</p>
													</div>
												</div>
											)}

											{/* Tags */}
											{post.tags && post.tags.length > 0 && (
												<div className="flex flex-wrap gap-1.5">
													{post.tags.map((tag) => (
														<span key={tag} className="text-xs text-primary font-mono bg-primary/10 px-2.5 py-0.5 rounded-md">
															#{tag}
														</span>
													))}
												</div>
											)}

											{/* Action buttons */}
											<div className="flex items-center justify-between pt-3 border-t border-border/60">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleToggleLike(post.post_id)}
													className={`h-8 gap-1.5 text-xs font-semibold ${
														isLikedByMe ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
													}`}
												>
													<ThumbsUp className={`w-4 h-4 ${isLikedByMe ? 'fill-primary' : ''}`} />
													<span>{post.likes_count}</span>
												</Button>

												<Button
													variant="ghost"
													size="sm"
													onClick={() => toggleCommentsSection(post.post_id)}
													className={`h-8 gap-1.5 text-xs font-medium ${
														isCommentsOpen ? 'text-primary bg-primary/10 font-semibold' : 'text-muted-foreground hover:text-foreground'
													}`}
												>
													<MessageCircle className="w-4 h-4" />
													<span>{post.comments?.length || 0} Comments</span>
												</Button>

												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleToggleRepost(post.post_id)}
													className={`h-8 gap-1.5 text-xs font-semibold ${
														isRepostedByMe ? 'text-emerald-500 bg-emerald-500/10' : 'text-muted-foreground hover:text-foreground'
													}`}
												>
													<Repeat className="w-4 h-4" />
													<span>{post.reposts_count && post.reposts_count > 0 ? `${post.reposts_count} Repost` : 'Repost'}</span>
												</Button>
											</div>

											{/* Comments section */}
											{isCommentsOpen && (
												<div className="pt-3 border-t border-border/60 space-y-3">
													<div className="flex items-center gap-2">
														<Avatar className="w-7 h-7">
															<AvatarImage src={currentUser?.avatar_url} />
															<AvatarFallback className="bg-primary text-primary-foreground font-bold text-[10px]">
																{currentUser?.full_name ? currentUser.full_name.substring(0, 2).toUpperCase() : 'U'}
															</AvatarFallback>
														</Avatar>
														<input
															type="text"
															placeholder="Write a comment..."
															value={commentText}
															onChange={(e) => setCommentInputsMap(prev => ({ ...prev, [post.post_id]: e.target.value }))}
															onKeyDown={(e) => {
																if (e.key === 'Enter' && !e.shiftKey) {
																	e.preventDefault();
																	handleAddComment(post.post_id);
																}
															}}
															disabled={isSubmittingCmt}
															className="flex-1 px-3 py-1.5 bg-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
														/>
														<Button
															size="sm"
															disabled={!commentText.trim() || isSubmittingCmt}
															onClick={() => handleAddComment(post.post_id)}
															className="h-7 px-2.5 rounded-xl text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1 font-semibold"
														>
															{isSubmittingCmt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
															<span>Send</span>
														</Button>
													</div>

													{post.comments && post.comments.length > 0 && (
														<div className="space-y-2 pt-1">
															{post.comments.map((cmt) => {
																const isCommentAuthor = currentUser?.user_id && cmt.user_id === currentUser.user_id;
																const canDeleteCmt = isCommentAuthor || (currentUser?.user_id && post.author_id === currentUser.user_id) || currentUser?.role === 'admin';

																return (
																	<div key={cmt.comment_id} className="flex items-start gap-2 group">
																		<Avatar className="w-7 h-7 shrink-0 cursor-pointer mt-0.5 border border-border/60" onClick={() => navigate(`/profile/${cmt.user_id}`)}>
																			<AvatarImage src={cmt.user_avatar} />
																			<AvatarFallback className="bg-primary/10 text-primary font-bold text-[10px]">
																				{cmt.user_name ? cmt.user_name.substring(0, 2).toUpperCase() : 'U'}
																			</AvatarFallback>
																		</Avatar>
																		<div className="flex items-center gap-1.5 flex-1">
																			<div className="bg-muted/40 rounded-xl px-3 py-1.5 border border-border/50 flex-1">
																				<div className="flex items-center justify-between gap-2">
																					<span className="text-xs font-bold text-foreground cursor-pointer hover:text-primary" onClick={() => navigate(`/profile/${cmt.user_id}`)}>
																						{cmt.user_name}
																					</span>
																					<span className="text-[10px] text-muted-foreground font-mono">{formatTimeAgo(cmt.created_at)}</span>
																				</div>
																				<p className="text-xs text-foreground/90 leading-relaxed mt-0.5">{cmt.content}</p>
																			</div>

																			{canDeleteCmt && (
																				<button
																					type="button"
																					className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg shrink-0"
																					onClick={() => handleDeleteComment(post.post_id, cmt.comment_id)}
																					title="Delete comment"
																				>
																					<Trash2 className="w-3.5 h-3.5" />
																				</button>
																			)}
																		</div>
																	</div>
																);
															})}
														</div>
													)}
												</div>
											)}
										</Card>
									);
								})}
						</div>
					)}
				</TabsContent>

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

			{/* Follow / Following List Popup Modal */}
			<FollowListModal
				isOpen={isFollowModalOpen}
				onClose={() => setIsFollowModalOpen(false)}
				userId={targetUserId}
				initialTab={followModalTab}
				userName={displayName}
				followersCount={profile?.followers_count}
				followingCount={profile?.following_count}
				onFollowChange={refreshProfile}
			/>
		</div>
	);
}