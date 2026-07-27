import { useState } from 'react';
import {
	ThumbsUp,
	MessageCircle,
	Share2,
	Bookmark,
	Trophy,
	Flame,
	Code2,
	Send,
	Image as ImageIcon,
	Sparkles,
	Clock,
	UserPlus,
	UserCheck
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface Post {
	id: number;
	author: string;
	avatar: string;
	role: string;
	time: string;
	content: string;
	type: 'code-share' | 'achievement' | 'discussion';
	codeSnippet?: {
		filename: string;
		language: string;
		code: string;
		runtime: string;
		beats: string;
	};
	achievement?: string;
	tags?: string[];
	likes: number;
	comments: number;
	shares: number;
	isLiked?: boolean;
	isBookmarked?: boolean;
}

export function HomeFeed() {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [activeTab, setActiveTab] = useState<'all' | 'code' | 'milestones' | 'discussions'>('all');
	const [postInput, setPostInput] = useState('');
	const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});

	const getInitials = (name?: string) => {
		if (!name) return 'LT';
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const [posts, setPosts] = useState<Post[]>([
		{
			id: 1,
			author: 'Sarah Chen',
			avatar: 'SC',
			role: 'Senior Software Engineer',
			time: '2 hours ago',
			content: 'Just optimized my solution for "Median of Two Sorted Arrays" using Binary Search on the smaller partition! Reduced time complexity from O((m+n) log(m+n)) to O(log(min(m,n))).',
			type: 'code-share',
			codeSnippet: {
				filename: 'median_of_two_arrays.py',
				language: 'python',
				code: `def findMedianSortedArrays(nums1: list[int], nums2: list[int]) -> float:
    if len(nums1) > len(nums2):
        nums1, nums2 = nums2, nums1
    x, y = len(nums1), len(nums2)
    low, high = 0, x
    while low <= high:
        partitionX = (low + high) // 2
        partitionY = (x + y + 1) // 2 - partitionX
        # Partition boundary checks...`,
				runtime: '44 ms',
				beats: '98.4%'
			},
			likes: 64,
			comments: 14,
			shares: 8,
			isLiked: false,
			isBookmarked: false
		},
		{
			id: 2,
			author: 'Maria Rodriguez',
			avatar: 'MR',
			role: 'Algorithm Enthusiast',
			time: '5 hours ago',
			content: 'Hit a major milestone today! Solved my 100th problem on CodExecute and reached a 30-day daily coding streak! 🚀 Consistency really pays off.',
			type: 'achievement',
			achievement: '100 Problems Solved & 30-Day Streak',
			likes: 142,
			comments: 29,
			shares: 12,
			isLiked: true,
			isBookmarked: true
		},
		{
			id: 3,
			author: 'Alex Rivera',
			avatar: 'AR',
			role: 'Backend Architect',
			time: '7 hours ago',
			content: 'When designing real-time rate limiters, do you prefer Sliding Window Counter or Token Bucket for distributed microservices architecture? Interested to hear how your teams handle high-concurrency bursts.',
			type: 'discussion',
			tags: ['SystemDesign', 'Microservices', 'DistributedSystems', 'RateLimiting'],
			likes: 89,
			comments: 38,
			shares: 15,
			isLiked: false,
			isBookmarked: false
		}
	]);

	const topSolvers = [
		{ id: 1, name: 'David Kim', username: '@davidk', avatar: 'DK', solved: 412, rank: 1, streak: '45 days' },
		{ id: 2, name: 'Elena Rostova', username: '@elena_r', avatar: 'ER', solved: 389, rank: 2, streak: '32 days' },
		{ id: 3, name: 'Kenji Sato', username: '@kenjis', avatar: 'KS', solved: 356, rank: 3, streak: '28 days' },
		{ id: 4, name: 'Sophia Miller', username: '@sophiam', avatar: 'SM', solved: 310, rank: 4, streak: '19 days' }
	];

	const toggleLike = (postId: number) => {
		setPosts(prev =>
			prev.map(p => {
				if (p.id === postId) {
					return {
						...p,
						isLiked: !p.isLiked,
						likes: p.isLiked ? p.likes - 1 : p.likes + 1
					};
				}
				return p;
			})
		);
	};

	const toggleBookmark = (postId: number) => {
		setPosts(prev =>
			prev.map(p => (p.id === postId ? { ...p, isBookmarked: !p.isBookmarked } : p))
		);
	};

	const toggleFollow = (solverId: number) => {
		setFollowingMap(prev => ({ ...prev, [solverId]: !prev[solverId] }));
	};

	const handleCreatePost = () => {
		if (!postInput.trim()) return;

		const newPost: Post = {
			id: Date.now(),
			author: user?.full_name || 'Le Minh Tri',
			avatar: getInitials(user?.full_name),
			role: user?.title || 'Frontend Developer',
			time: 'Just now',
			content: postInput,
			type: 'discussion',
			tags: ['Discussion', 'CodExecute'],
			likes: 0,
			comments: 0,
			shares: 0,
			isLiked: false,
			isBookmarked: false
		};

		setPosts([newPost, ...posts]);
		setPostInput('');
	};

	const filteredPosts = posts.filter(post => {
		if (activeTab === 'code') return post.type === 'code-share';
		if (activeTab === 'milestones') return post.type === 'achievement';
		if (activeTab === 'discussions') return post.type === 'discussion';
		return true;
	});

	return (
		<div className="max-w-7xl mx-auto px-6 py-8">
			<div className="grid grid-cols-12 gap-6">
				
				{/* LEFT SIDEBAR: Developer Profile & Quick Shortcuts */}
				<div className="col-span-12 lg:col-span-3 space-y-5">
					{/* Developer Profile Card */}
					<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
						<div className="flex flex-col items-center text-center">
							<div className="relative mb-3">
								<Avatar className="w-20 h-20 ring-4 ring-primary/20">
									<AvatarImage src={user?.avatar_url} />
									<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xl">
										{getInitials(user?.full_name)}
									</AvatarFallback>
								</Avatar>
								<span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" title="Online"></span>
							</div>

							<h3 className="text-foreground font-bold text-lg leading-tight">{user?.full_name || 'Le Minh Tri'}</h3>
							<p className="text-muted-foreground text-xs mt-1 mb-3 font-medium">{user?.title || 'Frontend Developer'}</p>
							
							<Button
								variant="outline"
								size="sm"
								className="w-full rounded-xl border-border hover:bg-accent text-foreground text-xs font-semibold h-9 cursor-pointer"
								onClick={() => navigate('/profile')}
							>
								View Profile
							</Button>
						</div>

						{/* Developer Stats Grid */}
						<div className="mt-5 pt-5 border-t border-border/60 grid grid-cols-3 gap-2 text-center">
							<div className="p-2 rounded-xl bg-muted/30">
								<p className="text-xs text-muted-foreground">Solved</p>
								<p className="text-foreground font-bold text-base mt-0.5">87</p>
							</div>
							<div className="p-2 rounded-xl bg-muted/30">
								<p className="text-xs text-muted-foreground">Streak</p>
								<p className="text-amber-500 font-bold text-base mt-0.5 flex items-center justify-center gap-0.5">
									<span>7</span>
									<Flame className="w-3.5 h-3.5 fill-amber-500" />
								</p>
							</div>
							<div className="p-2 rounded-xl bg-muted/30">
								<p className="text-xs text-muted-foreground">Rank</p>
								<p className="text-primary font-bold text-base mt-0.5">#142</p>
							</div>
						</div>
					</Card>

					{/* Navigation Shortcuts */}
					<Card className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-3">
						<h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
							Quick Shortcuts
						</h4>
						<div className="space-y-1">
							<button
								onClick={() => navigate('/problems/1')}
								className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent text-left transition-colors group cursor-pointer"
							>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
										<Flame className="w-4 h-4" />
									</div>
									<span className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">Daily Challenge</span>
								</div>
								<Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-2">Active</Badge>
							</button>

							<button
								onClick={() => navigate('/problems')}
								className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent text-left transition-colors group cursor-pointer"
							>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
										<Code2 className="w-4 h-4" />
									</div>
									<span className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">Problem Set</span>
								</div>
								<span className="text-xs text-muted-foreground font-mono">1.2K+</span>
							</button>

							<button
								onClick={() => navigate('/problems')}
								className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-accent text-left transition-colors group cursor-pointer"
							>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20">
										<Trophy className="w-4 h-4" />
									</div>
									<span className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">Leaderboard</span>
								</div>
							</button>
						</div>
					</Card>
				</div>

				{/* CENTER COLUMN: Community Feed Stream */}
				<div className="col-span-12 lg:col-span-6 space-y-5">
					
					{/* Create Post Input Box */}
					<Card className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-3">
						<div className="flex items-center gap-3">
							<Avatar className="w-9 h-9">
								<AvatarImage src={user?.avatar_url} />
								<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
									{getInitials(user?.full_name)}
								</AvatarFallback>
							</Avatar>
							<input
								type="text"
								placeholder="Share code snippet, ask an algorithm question..."
								value={postInput}
								onChange={(e) => setPostInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										handleCreatePost();
									}
								}}
								className="flex-1 px-4 py-2.5 bg-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary"
							/>
						</div>

						<div className="flex items-center justify-between pt-2 border-t border-border/60">
							<div className="flex items-center gap-2">
								<Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary">
									<Code2 className="w-4 h-4 text-primary" />
									<span>Code Snippet</span>
								</Button>
								<Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-amber-500">
									<Trophy className="w-4 h-4 text-amber-500" />
									<span>Milestone</span>
								</Button>
								<Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-blue-500">
									<ImageIcon className="w-4 h-4 text-blue-500" />
									<span>Image</span>
								</Button>
							</div>

							<Button
								size="sm"
								disabled={!postInput.trim()}
								onClick={handleCreatePost}
								className="h-8 rounded-xl px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm"
							>
								<Send className="w-3.5 h-3.5" />
								<span>Post</span>
							</Button>
						</div>
					</Card>

					{/* Feed Filter Tabs */}
					<div className="flex items-center gap-2 overflow-x-auto pb-1">
						<button
							onClick={() => setActiveTab('all')}
							className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
								activeTab === 'all'
									? 'bg-primary text-primary-foreground shadow-sm font-semibold'
									: 'bg-card/60 border border-border text-muted-foreground hover:text-foreground'
							}`}
						>
							All Feed
						</button>
						<button
							onClick={() => setActiveTab('code')}
							className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
								activeTab === 'code'
									? 'bg-primary text-primary-foreground shadow-sm font-semibold'
									: 'bg-card/60 border border-border text-muted-foreground hover:text-foreground'
							}`}
						>
							Code Shares
						</button>
						<button
							onClick={() => setActiveTab('milestones')}
							className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
								activeTab === 'milestones'
									? 'bg-primary text-primary-foreground shadow-sm font-semibold'
									: 'bg-card/60 border border-border text-muted-foreground hover:text-foreground'
							}`}
						>
							Milestones
						</button>
						<button
							onClick={() => setActiveTab('discussions')}
							className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
								activeTab === 'discussions'
									? 'bg-primary text-primary-foreground shadow-sm font-semibold'
									: 'bg-card/60 border border-border text-muted-foreground hover:text-foreground'
							}`}
						>
							Discussions
						</button>
					</div>

					{/* Feed Items List */}
					<div className="space-y-4">
						{filteredPosts.map((post) => (
							<Card key={post.id} className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
								{/* Post Author Info */}
								<div className="flex items-start justify-between mb-3">
									<div className="flex items-center gap-3">
										<Avatar className="w-10 h-10 cursor-pointer border border-border" onClick={() => navigate('/profile')}>
											<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
												{post.avatar}
											</AvatarFallback>
										</Avatar>
										<div>
											<h4
												className="text-foreground font-bold text-sm hover:text-primary cursor-pointer transition-colors leading-snug"
												onClick={() => navigate('/profile')}
											>
												{post.author}
											</h4>
											<p className="text-muted-foreground text-xs">
												{post.role} • <span className="font-mono text-[11px]">{post.time}</span>
											</p>
										</div>
									</div>

									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-muted-foreground hover:text-foreground"
										onClick={() => toggleBookmark(post.id)}
									>
										<Bookmark className={`w-4 h-4 ${post.isBookmarked ? 'fill-primary text-primary' : ''}`} />
									</Button>
								</div>

								{/* Post Body Content */}
								<p className="text-foreground text-sm leading-relaxed mb-4 whitespace-pre-line">
									{post.content}
								</p>

								{/* Code Share Block Attachment */}
								{post.type === 'code-share' && post.codeSnippet && (
									<div className="mb-4 rounded-xl border border-border bg-[#1e1e1e] text-gray-200 overflow-hidden font-mono text-xs">
										<div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-b border-[#333333]">
											<span className="text-gray-300 text-xs font-semibold flex items-center gap-2">
												<Code2 className="w-4 h-4 text-primary" />
												{post.codeSnippet.filename}
											</span>
											<div className="flex items-center gap-3 text-[11px]">
												<span className="text-emerald-400">Runtime: {post.codeSnippet.runtime}</span>
												<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
													Beats {post.codeSnippet.beats}
												</Badge>
											</div>
										</div>
										<pre className="p-4 overflow-x-auto text-gray-300 text-xs leading-relaxed">
											<code>{post.codeSnippet.code}</code>
										</pre>
									</div>
								)}

								{/* Achievement Milestone Attachment */}
								{post.type === 'achievement' && (
									<div className="mb-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center gap-3">
										<div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shrink-0">
											<Trophy className="w-5 h-5 fill-slate-950" />
										</div>
										<div>
											<Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-semibold mb-0.5">
												Achievement Unlocked
											</Badge>
											<p className="text-foreground font-bold text-sm">{post.achievement}</p>
										</div>
									</div>
								)}

								{/* Tags */}
								{post.tags && post.tags.length > 0 && (
									<div className="flex flex-wrap gap-1.5 mb-4">
										{post.tags.map((tag) => (
											<span key={tag} className="text-xs text-primary font-mono bg-primary/10 px-2.5 py-0.5 rounded-md hover:bg-primary/20 cursor-pointer">
												#{tag}
											</span>
										))}
									</div>
								)}

								{/* Post Actions Bar */}
								<div className="flex items-center justify-between pt-3 border-t border-border/60">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => toggleLike(post.id)}
										className={`h-8 gap-1.5 text-xs font-semibold ${
											post.isLiked ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
										}`}
									>
										<ThumbsUp className={`w-4 h-4 ${post.isLiked ? 'fill-primary' : ''}`} />
										<span>{post.likes}</span>
									</Button>

									<Button
										variant="ghost"
										size="sm"
										className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
									>
										<MessageCircle className="w-4 h-4" />
										<span>{post.comments} Comments</span>
									</Button>

									<Button
										variant="ghost"
										size="sm"
										className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
									>
										<Share2 className="w-4 h-4" />
										<span>{post.shares}</span>
									</Button>
								</div>
							</Card>
						))}
					</div>
				</div>

				{/* RIGHT SIDEBAR: Top Solvers & Trending Topics (No Courses!) */}
				<div className="col-span-12 lg:col-span-3 space-y-5">
					
					{/* Top Solvers Leaderboard Widget */}
					<Card className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-4">
						<div className="flex items-center justify-between">
							<h4 className="text-sm font-bold text-foreground flex items-center gap-2">
								<Trophy className="w-4 h-4 text-amber-500" />
								<span>Top Solvers</span>
							</h4>
							<span className="text-[11px] text-muted-foreground font-mono">This Week</span>
						</div>

						<div className="space-y-3">
							{topSolvers.map((solver) => {
								const isFollowing = followingMap[solver.id];
								return (
									<div key={solver.id} className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-muted/30 transition-colors">
										<div className="flex items-center gap-2.5 overflow-hidden">
											<div className="relative shrink-0">
												<Avatar className="w-8 h-8 border border-border">
													<AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
														{solver.avatar}
													</AvatarFallback>
												</Avatar>
												<span className={`absolute -top-1 -left-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white ${
													solver.rank === 1 ? 'bg-amber-500' : solver.rank === 2 ? 'bg-slate-400' : 'bg-amber-700'
												}`}>
													{solver.rank}
												</span>
											</div>

											<div className="truncate">
												<p className="text-xs font-semibold text-foreground truncate hover:text-primary cursor-pointer">
													{solver.name}
												</p>
												<p className="text-[11px] text-muted-foreground font-mono">
													{solver.solved} solved
												</p>
											</div>
										</div>

										<Button
											variant={isFollowing ? 'secondary' : 'outline'}
											size="sm"
											onClick={() => toggleFollow(solver.id)}
											className="h-7 px-2.5 text-[11px] rounded-lg shrink-0 gap-1 font-medium cursor-pointer"
										>
											{isFollowing ? (
												<>
													<UserCheck className="w-3 h-3 text-emerald-500" />
													<span>Following</span>
												</>
											) : (
												<>
													<UserPlus className="w-3 h-3" />
													<span>Follow</span>
												</>
											)}
										</Button>
									</div>
								);
							})}
						</div>
					</Card>

					{/* Trending Coding Topics Widget */}
					<Card className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-3">
						<h4 className="text-sm font-bold text-foreground flex items-center gap-2">
							<Sparkles className="w-4 h-4 text-primary" />
							<span>Trending Topics</span>
						</h4>

						<div className="flex flex-wrap gap-1.5">
							{['#DynamicProgramming', '#GraphTheory', '#BinarySearch', '#SystemDesign', '#TwoPointers', '#Recursion', '#Python', '#TypeScript'].map((tag) => (
								<Badge
									key={tag}
									variant="secondary"
									className="bg-muted/60 text-muted-foreground hover:bg-primary hover:text-primary-foreground cursor-pointer text-[11px] font-mono transition-colors rounded-lg px-2.5 py-1"
								>
									{tag}
								</Badge>
							))}
						</div>
					</Card>

					{/* Upcoming Challenge Banner */}
					<Card className="p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl shadow-sm space-y-3">
						<div className="flex items-center gap-2 text-primary font-bold text-xs">
							<Clock className="w-4 h-4" />
							<span>Upcoming Contest</span>
						</div>

						<div>
							<h5 className="text-foreground font-bold text-sm">Weekly Contest #42</h5>
							<p className="text-muted-foreground text-xs mt-0.5">4 algorithmic problems • 90 minutes</p>
						</div>

						<div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-1">
							<span>Starts in 2h 30m</span>
							<Button size="sm" className="h-7 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg">
								Register
							</Button>
						</div>
					</Card>

				</div>
			</div>
		</div>
	);
}