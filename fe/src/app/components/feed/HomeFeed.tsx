import { useState, useEffect } from 'react';
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
	UserCheck,
	Loader2,
	MoreVertical,
	Pencil,
	Trash2,
	AlertTriangle
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '../ui/dropdown-menu';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter
} from '../ui/dialog';
import {
	PostItem,
	getPostsApi,
	createPostApi,
	addCommentApi,
	toggleLikePostApi,
	updatePostApi,
	deletePostApi,
	deleteCommentApi,
	getAccessToken
} from '../../services/api';

export function HomeFeed() {
	const navigate = useNavigate();
	const { user, token } = useAuth();
	const profileUrl = user?.user_id ? `/profile/${user.user_id}` : '/profile/me';

	const [posts, setPosts] = useState<PostItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'all' | 'code' | 'milestones' | 'discussions'>('all');
	const [isPosting, setIsPosting] = useState(false);
	const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});
	const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

	// Create Post Popup Modal states
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [postType, setPostType] = useState<'discussion' | 'code-share' | 'achievement'>('discussion');
	const [postContent, setPostContent] = useState('');
	const [tagInput, setTagInput] = useState('Discussion, CodExecute');
	const [tags, setTags] = useState<string[]>(['Discussion', 'CodExecute']);

	// Code Snippet attachment states
	const [codeFilename, setCodeFilename] = useState('solution.py');
	const [codeLanguage, setCodeLanguage] = useState('python');
	const [codeText, setCodeText] = useState('');
	const [codeRuntime, setCodeRuntime] = useState('24ms');
	const [codeBeats, setCodeBeats] = useState('98.5%');

	// Achievement state
	const [achievementText, setAchievementText] = useState('');

	// Comment states
	const [openCommentsMap, setOpenCommentsMap] = useState<Record<string, boolean>>({});
	const [commentInputsMap, setCommentInputsMap] = useState<Record<string, string>>({});
	const [commentSubmittingMap, setCommentSubmittingMap] = useState<Record<string, boolean>>({});

	// Edit & Delete Post & Comment states
	const [editingPostId, setEditingPostId] = useState<string | null>(null);
	const [editContent, setEditContent] = useState('');
	const [isUpdating, setIsUpdating] = useState(false);

	const [deletingCommentTarget, setDeletingCommentTarget] = useState<{ postId: string; commentId: string } | null>(null);
	const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const getInitials = (name?: string) => {
		if (!name) return 'U';
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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

	const formatTimeAgo = (dateStr?: string) => {
		if (!dateStr) return 'Just now';
		const date = new Date(dateStr);
		if (isNaN(date.getTime())) return dateStr;
		const now = new Date();
		const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
		if (diffInSeconds < 60) return 'Just now';
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
	};

	// Fetch real posts from backend
	const fetchFeedPosts = async () => {
		try {
			setIsLoading(true);
			const data = await getPostsApi();
			setPosts(data);
		} catch (err) {
			console.error('Failed to load feed posts:', err);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchFeedPosts();
	}, []);

	const topSolvers = [
		{ id: 1, name: 'David Kim', username: '@davidk', avatar: 'DK', solved: 412, rank: 1, streak: '45 days' },
		{ id: 2, name: 'Elena Rostova', username: '@elena_r', avatar: 'ER', solved: 389, rank: 2, streak: '32 days' },
		{ id: 3, name: 'Kenji Sato', username: '@kenjis', avatar: 'KS', solved: 356, rank: 3, streak: '28 days' },
		{ id: 4, name: 'Sophia Miller', username: '@sophiam', avatar: 'SM', solved: 310, rank: 4, streak: '19 days' }
	];

	const toggleLike = async (postId: string) => {
		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}
		try {
			const updatedPost = await toggleLikePostApi(authToken, postId);
			setPosts(prev => prev.map(p => (p.post_id === postId ? updatedPost : p)));
		} catch (err) {
			console.error('Failed to toggle like:', err);
		}
	};

	const toggleBookmark = (postId: string) => {
		setBookmarkedMap(prev => ({ ...prev, [postId]: !prev[postId] }));
	};

	const toggleFollow = (solverId: number) => {
		setFollowingMap(prev => ({ ...prev, [solverId]: !prev[solverId] }));
	};

	const toggleCommentsSection = (postId: string) => {
		setOpenCommentsMap(prev => ({ ...prev, [postId]: !prev[postId] }));
	};

	const handleSubmitNewPost = async () => {
		if (!postContent.trim()) return;

		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		try {
			setIsPosting(true);
			const payload: any = {
				content: postContent.trim(),
				type: postType,
				tags: tags.length > 0 ? tags : ['CodExecute']
			};

			if (postType === 'code-share' && codeText.trim()) {
				payload.code_snippet = {
					filename: codeFilename || 'solution.py',
					language: codeLanguage || 'python',
					code: codeText.trim(),
					runtime: codeRuntime || undefined,
					beats: codeBeats || undefined
				};
			}

			if (postType === 'achievement' && achievementText.trim()) {
				payload.achievement = achievementText.trim();
			}

			const newPost = await createPostApi(authToken, payload);
			setPosts(prev => [newPost, ...prev]);

			setPostContent('');
			setCodeText('');
			setAchievementText('');
			setIsCreateModalOpen(false);
		} catch (err: any) {
			alert(err.message || 'Không thể tạo bài viết');
		} finally {
			setIsPosting(false);
		}
	};

	const handleAddComment = async (postId: string) => {
		const commentText = commentInputsMap[postId]?.trim();
		if (!commentText) return;

		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		try {
			setCommentSubmittingMap(prev => ({ ...prev, [postId]: true }));
			const updatedPost = await addCommentApi(authToken, postId, commentText);
			setPosts(prev => prev.map(p => (p.post_id === postId ? updatedPost : p)));
			setCommentInputsMap(prev => ({ ...prev, [postId]: '' }));
		} catch (err: any) {
			alert(err.message || 'Failed to add comment');
		} finally {
			setCommentSubmittingMap(prev => ({ ...prev, [postId]: false }));
		}
	};

	const handleDeleteComment = (postId: string, commentId: string) => {
		setDeletingCommentTarget({ postId, commentId });
	};

	const confirmDeleteComment = async () => {
		if (!deletingCommentTarget) return;
		const { postId, commentId } = deletingCommentTarget;

		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		try {
			setIsDeleting(true);
			const updatedPost = await deleteCommentApi(authToken, postId, commentId);
			setPosts(prev => prev.map(p => (p.post_id === postId ? updatedPost : p)));
			setDeletingCommentTarget(null);
		} catch (err: any) {
			alert(err.message || 'Không thể xóa bình luận');
		} finally {
			setIsDeleting(false);
		}
	};

	const handleDeletePost = (postId: string) => {
		setDeletingPostId(postId);
	};

	const confirmDeletePost = async () => {
		if (!deletingPostId) return;

		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		try {
			setIsDeleting(true);
			await deletePostApi(authToken, deletingPostId);
			setPosts(prev => prev.filter(p => p.post_id !== deletingPostId));
			setDeletingPostId(null);
		} catch (err: any) {
			alert(err.message || 'Không thể xóa bài viết');
		} finally {
			setIsDeleting(false);
		}
	};

	const handleSaveEditPost = async () => {
		if (!editingPostId || !editContent.trim()) return;

		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		try {
			setIsUpdating(true);
			const updatedPost = await updatePostApi(authToken, editingPostId, editContent.trim());
			setPosts(prev => prev.map(p => (p.post_id === editingPostId ? updatedPost : p)));
			setEditingPostId(null);
			setEditContent('');
		} catch (err: any) {
			alert(err.message || 'Không thể cập nhật bài viết');
		} finally {
			setIsUpdating(false);
		}
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
								onClick={() => navigate(profileUrl)}
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
					
					{/* Create Post Trigger Box */}
					<Card className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-3">
						<div
							className="flex items-center gap-3 cursor-pointer group"
							onClick={() => {
								setPostType('discussion');
								setIsCreateModalOpen(true);
							}}
						>
							<Avatar className="w-9 h-9 border border-border">
								<AvatarImage src={user?.avatar_url} />
								<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
									{getInitials(user?.full_name)}
								</AvatarFallback>
							</Avatar>
							<div className="flex-1 px-4 py-2.5 bg-background rounded-xl border border-border text-muted-foreground text-sm group-hover:border-primary/50 transition-colors">
								Share code snippet, ask an algorithm question...
							</div>
						</div>

						<div className="flex items-center justify-between pt-2 border-t border-border/60">
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer"
									onClick={() => {
										setPostType('code-share');
										setIsCreateModalOpen(true);
									}}
								>
									<Code2 className="w-4 h-4 text-primary" />
									<span>Code Snippet</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-amber-500 cursor-pointer"
									onClick={() => {
										setPostType('achievement');
										setIsCreateModalOpen(true);
									}}
								>
									<Trophy className="w-4 h-4 text-amber-500" />
									<span>Milestone</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-blue-500 cursor-pointer"
									onClick={() => {
										setPostType('discussion');
										setIsCreateModalOpen(true);
									}}
								>
									<ImageIcon className="w-4 h-4 text-blue-500" />
									<span>Image</span>
								</Button>
							</div>

							<Button
								size="sm"
								onClick={() => {
									setPostType('discussion');
									setIsCreateModalOpen(true);
								}}
								className="h-8 rounded-xl px-4 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm cursor-pointer"
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
						{isLoading ? (
							<Card className="p-8 text-center bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl">
								<Loader2 className="w-6 h-6 animate-spin mx-auto text-primary mb-2" />
								<p className="text-xs text-muted-foreground">Loading community posts...</p>
							</Card>
						) : filteredPosts.length === 0 ? (
							<Card className="p-8 text-center bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl">
								<p className="text-sm font-medium text-muted-foreground">No posts yet. Be the first to share!</p>
							</Card>
						) : (
							filteredPosts.map((post) => {
								const isLikedByMe = user?.user_id ? post.liked_by?.includes(user.user_id) : false;
								const isBookmarked = bookmarkedMap[post.post_id];
								const isCommentsOpen = openCommentsMap[post.post_id];
								const commentText = commentInputsMap[post.post_id] || '';
								const isSubmittingCmt = commentSubmittingMap[post.post_id];
								const isAuthor = !post.author_id || (user?.user_id && post.author_id === user.user_id) || user?.role === 'admin';

								return (
									<Card key={post.post_id} className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
										{/* Post Author Info */}
										<div className="flex items-start justify-between mb-3">
											<div className="flex items-center gap-3">
												<Avatar
													className="w-10 h-10 cursor-pointer border border-border"
													onClick={() => navigate(`/profile/${post.author_id}`)}
												>
													<AvatarImage src={post.author_avatar} alt={post.author_name} />
													<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
														{getInitials(post.author_name)}
													</AvatarFallback>
												</Avatar>
												<div>
													<h4
														className="text-foreground font-bold text-sm hover:text-primary cursor-pointer transition-colors leading-snug"
														onClick={() => navigate(`/profile/${post.author_id}`)}
													>
														{post.author_name}
													</h4>
													<p className="text-muted-foreground text-xs">
														{post.author_title || 'Developer'} • <span className="font-mono text-[11px]">{formatTimeAgo(post.created_at)}</span>
													</p>
												</div>
											</div>

											{/* Action Menu & Bookmark */}
											<div className="flex items-center gap-1">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-muted-foreground hover:text-foreground"
													onClick={() => toggleBookmark(post.post_id)}
												>
													<Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-primary text-primary' : ''}`} />
												</Button>

												{isAuthor && (
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<button
																type="button"
																className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer rounded-lg transition-colors focus:outline-none"
															>
																<MoreVertical className="w-4 h-4" />
															</button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" sideOffset={6} className="w-40 p-1.5 rounded-xl border-border bg-card shadow-2xl z-50 space-y-0.5">
															<DropdownMenuItem
																className="cursor-pointer gap-2.5 p-2 rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors"
																onClick={() => {
																	setEditingPostId(post.post_id);
																	setEditContent(post.content);
																}}
															>
																<Pencil className="w-3.5 h-3.5 text-primary" />
																<span>Edit Post</span>
															</DropdownMenuItem>
															<DropdownMenuItem
																variant="destructive"
																className="cursor-pointer gap-2.5 p-2 rounded-lg text-xs font-medium text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 transition-colors"
																onClick={() => handleDeletePost(post.post_id)}
															>
																<Trash2 className="w-3.5 h-3.5 text-destructive" />
																<span>Delete Post</span>
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												)}
											</div>
										</div>

										{/* Post Body Content */}
										<p className="text-foreground text-sm leading-relaxed mb-4 whitespace-pre-line">
											{post.content}
										</p>

										{/* Code Share Block Attachment */}
										{post.type === 'code-share' && post.code_snippet && (
											<div className="mb-4 rounded-xl border border-border bg-[#1e1e1e] text-gray-200 overflow-hidden font-mono text-xs shadow-md">
												<div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-b border-[#333333]">
													<span className="text-gray-300 text-xs font-semibold flex items-center gap-2">
														<Code2 className="w-4 h-4 text-primary" />
														{post.code_snippet.filename || 'solution.py'}
													</span>
													<div className="flex items-center gap-3 text-[11px]">
														{post.code_snippet.runtime && <span className="text-emerald-400">Runtime: {post.code_snippet.runtime}</span>}
														{post.code_snippet.beats && (
															<Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">
																Beats {post.code_snippet.beats}
															</Badge>
														)}
													</div>
												</div>
												<div className="flex bg-[#1e1e1e]">
													<div className="bg-[#1e1e1e] border-r border-[#2d2d2d] py-4 px-2 text-right text-[11px] text-gray-600 font-mono select-none w-10 shrink-0 space-y-[2px]">
														{Array.from({ length: Math.max(1, (post.code_snippet.code || '').split('\n').length) }).map((_, i) => (
															<div key={i} className="leading-relaxed">{i + 1}</div>
														))}
													</div>
													<pre className="p-4 overflow-x-auto text-gray-200 text-xs leading-relaxed font-mono bg-[#1e1e1e] flex-1">
														<code dangerouslySetInnerHTML={{ __html: highlightCodeToHtml(post.code_snippet.code) }} />
													</pre>
												</div>
											</div>
										)}

										{/* Achievement Milestone Attachment */}
										{post.type === 'achievement' && post.achievement && (
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
												onClick={() => toggleLike(post.post_id)}
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
												className="h-8 gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
											>
												<Share2 className="w-4 h-4" />
												<span>Share</span>
											</Button>
										</div>

										{/* Collapsible Comments Section */}
										{isCommentsOpen && (
											<div className="mt-4 pt-4 border-t border-border/60 space-y-4">
												{/* Add Comment Input */}
												<div className="flex items-center gap-3">
													<Avatar className="w-8 h-8">
														<AvatarImage src={user?.avatar_url} />
														<AvatarFallback className="bg-primary text-primary-foreground font-bold text-[10px]">
															{getInitials(user?.full_name)}
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
														className="flex-1 px-3 py-2 bg-background rounded-xl border border-border text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
													/>
													<Button
														size="sm"
														disabled={!commentText.trim() || isSubmittingCmt}
														onClick={() => handleAddComment(post.post_id)}
														className="h-8 px-3 rounded-xl text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1 font-semibold"
													>
														{isSubmittingCmt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
														<span>Send</span>
													</Button>
												</div>

												{/* Comments List */}
												{post.comments && post.comments.length > 0 ? (
													<div className="space-y-2.5 pt-1">
														{post.comments.map((cmt) => {
															const isCommentAuthor = user?.user_id && cmt.user_id === user.user_id;
															const isPostAuthor = isAuthor;
															const canDeleteComment = isCommentAuthor || isPostAuthor;

															return (
																<div key={cmt.comment_id} className="flex items-start gap-2.5 group">
																	<Avatar className="w-8 h-8 shrink-0 cursor-pointer border border-border/60 mt-0.5" onClick={() => navigate(`/profile/${cmt.user_id}`)}>
																		<AvatarImage src={cmt.user_avatar} alt={cmt.user_name} />
																		<AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
																			{getInitials(cmt.user_name)}
																		</AvatarFallback>
																	</Avatar>
																	<div className="flex items-center gap-1.5 max-w-[calc(100%-2.5rem)]">
																		<div className="bg-muted/40 hover:bg-muted/60 dark:bg-accent/40 border border-border/50 rounded-2xl rounded-tl-xs px-3.5 py-2 transition-colors">
																			<div className="flex items-center justify-between gap-4">
																				<span
																					className="text-xs font-bold text-foreground cursor-pointer hover:text-primary transition-colors"
																					onClick={() => navigate(`/profile/${cmt.user_id}`)}
																				>
																					{cmt.user_name}
																				</span>
																				<span className="text-[10px] text-muted-foreground/80 font-mono">{formatTimeAgo(cmt.created_at)}</span>
																			</div>
																			<p className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line mt-0.5">{cmt.content}</p>
																		</div>

																		{canDeleteComment && (
																			<button
																				type="button"
																				className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer focus:outline-none shrink-0"
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
												) : (
													<p className="text-xs text-muted-foreground text-center py-2 italic">No comments yet. Start the conversation!</p>
												)}
											</div>
										)}
									</Card>
								);
							})
						)}
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
							{['#DynamicProgramming', '#GraphTheory', '#BinarySearch', '#SystemDesign', '#TwoPointers', '#Recursion', '#Python'].map((tag) => (
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

			{/* Edit Post Modal Dialog */}
			<Dialog open={!!editingPostId} onOpenChange={(open) => !open && setEditingPostId(null)}>
				<DialogContent className="sm:max-w-md p-6 space-y-4 rounded-2xl border-border bg-card shadow-2xl">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-foreground">Edit Post</DialogTitle>
					</DialogHeader>
					<div className="space-y-2">
						<textarea
							className="w-full h-32 p-3 bg-background rounded-xl border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							placeholder="Edit your post content..."
						/>
					</div>
					<DialogFooter className="flex items-center justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="rounded-xl h-9 text-xs cursor-pointer"
							onClick={() => setEditingPostId(null)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={isUpdating || !editContent.trim()}
							onClick={handleSaveEditPost}
							className="rounded-xl h-9 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold cursor-pointer"
						>
							{isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
							<span>Save Changes</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Comment Confirmation Modal */}
			<Dialog open={!!deletingCommentTarget} onOpenChange={(open) => !open && setDeletingCommentTarget(null)}>
				<DialogContent className="sm:max-w-md p-6 space-y-4 rounded-2xl border-border bg-card shadow-2xl">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
							<AlertTriangle className="w-5 h-5 text-rose-500" />
							<span>Confirm Delete Comment</span>
						</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Are you sure you want to delete this comment? This action cannot be undone.
					</p>
					<DialogFooter className="flex items-center justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="rounded-xl h-9 text-xs cursor-pointer"
							onClick={() => setDeletingCommentTarget(null)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={isDeleting}
							onClick={confirmDeleteComment}
							className="rounded-xl h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 font-semibold cursor-pointer"
						>
							{isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
							<span>Delete</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Post Confirmation Modal */}
			<Dialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
				<DialogContent className="sm:max-w-md p-6 space-y-4 rounded-2xl border-border bg-card shadow-2xl">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
							<AlertTriangle className="w-5 h-5 text-rose-500" />
							<span>Confirm Delete Post</span>
						</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground leading-relaxed">
						Are you sure you want to delete this post? All attached comments and likes will be removed permanently.
					</p>
					<DialogFooter className="flex items-center justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="rounded-xl h-9 text-xs cursor-pointer"
							onClick={() => setDeletingPostId(null)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={isDeleting}
							onClick={confirmDeletePost}
							className="rounded-xl h-9 text-xs bg-rose-600 hover:bg-rose-700 text-white gap-1.5 font-semibold cursor-pointer"
						>
							{isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
							<span>Delete Post</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			{/* Create Post Popup Modal */}
			<Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
				<DialogContent className="sm:max-w-xl p-6 space-y-4 rounded-2xl border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-foreground">Create Post</DialogTitle>
					</DialogHeader>

					<div className="overflow-y-auto space-y-4 pr-1 flex-1">
						{/* Author info & Post Type Selectors */}
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<Avatar className="w-10 h-10 border border-border">
									<AvatarImage src={user?.avatar_url} />
									<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
										{getInitials(user?.full_name)}
									</AvatarFallback>
								</Avatar>
								<div>
									<h4 className="text-sm font-bold text-foreground">{user?.full_name || 'Developer'}</h4>
									<p className="text-[11px] text-muted-foreground">{user?.title || 'CodExecute Member'}</p>
								</div>
							</div>

							{/* Type Selector Tabs */}
							<div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
								<button
									type="button"
									onClick={() => setPostType('discussion')}
									className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
										postType === 'discussion'
											? 'bg-primary text-primary-foreground shadow-xs'
											: 'text-muted-foreground hover:text-foreground'
									}`}
								>
									Discussion
								</button>

								<button
									type="button"
									onClick={() => setPostType('code-share')}
									className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
										postType === 'code-share'
											? 'bg-primary text-primary-foreground shadow-xs'
											: 'text-muted-foreground hover:text-foreground'
									}`}
								>
									<Code2 className="w-3.5 h-3.5" />
									<span>Code</span>
								</button>

								<button
									type="button"
									onClick={() => setPostType('achievement')}
									className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
										postType === 'achievement'
											? 'bg-primary text-primary-foreground shadow-xs'
											: 'text-muted-foreground hover:text-foreground'
									}`}
								>
									<Trophy className="w-3.5 h-3.5" />
									<span>Milestone</span>
								</button>
							</div>
						</div>

						{/* Main Post Content Textarea */}
						<div>
							<textarea
								className="w-full h-32 p-3 bg-background rounded-xl border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground"
								value={postContent}
								onChange={(e) => setPostContent(e.target.value)}
								placeholder="Share code snippet, ask an algorithm question, or post a coding milestone..."
							/>
						</div>

						{/* Code Snippet Attachment Form (IDE Style) */}
						{postType === 'code-share' && (
							<div className="rounded-xl border border-border bg-[#1e1e1e] overflow-hidden font-mono shadow-xl">
								{/* IDE Header Bar */}
								<div className="bg-[#252526] px-4 py-2.5 flex items-center justify-between border-b border-[#333333]">
									<div className="flex items-center gap-3 flex-1">
										{/* Mac/IDE Window Dots */}
										<div className="flex items-center gap-1.5 shrink-0">
											<span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
											<span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
											<span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
										</div>

										{/* Filename Input */}
										<div className="flex items-center gap-2 bg-[#1e1e1e] px-3 py-1 rounded-lg border border-[#3c3c3c] flex-1 max-w-xs">
											<Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
											<input
												type="text"
												value={codeFilename}
												onChange={(e) => setCodeFilename(e.target.value)}
												placeholder="solution.py"
												className="bg-transparent text-xs text-gray-200 focus:outline-none w-full font-mono"
												spellCheck={false}
											/>
										</div>
									</div>

									{/* Language Select */}
									<select
										value={codeLanguage}
										onChange={(e) => setCodeLanguage(e.target.value)}
										className="bg-[#2d2d2d] px-3 py-1 rounded-lg border border-[#444444] text-xs text-gray-200 focus:outline-none focus:border-primary cursor-pointer font-mono"
									>
										<option value="python">Python</option>
										<option value="cpp">C++</option>
										<option value="java">Java</option>
										<option value="javascript">JavaScript</option>
										<option value="go">Go</option>
										<option value="rust">Rust</option>
									</select>
								</div>

								{/* IDE Editor Main Body with Line Numbers & Real-time Syntax Highlighting */}
								<div className="flex bg-[#1e1e1e] relative h-[200px] overflow-hidden">
									{/* Line Numbers Column */}
									<div className="bg-[#1e1e1e] border-r border-[#2d2d2d] py-3 px-2 text-right text-[11px] text-gray-600 font-mono select-none w-10 shrink-0 space-y-[2px]">
										{Array.from({ length: Math.max(1, codeText.split('\n').length) }).map((_, i) => (
											<div key={i} className="leading-5">{i + 1}</div>
										))}
									</div>

									{/* Code Container with Real-time Syntax Overlay */}
									<div className="relative flex-1 bg-[#1e1e1e] overflow-hidden h-full">
										{/* Syntax Highlighted Backdrop Layer */}
										<pre
											className="absolute inset-0 p-3 m-0 text-xs font-mono leading-5 overflow-hidden pointer-events-none whitespace-pre select-none text-gray-200 border-0"
											style={{ tabSize: 4 }}
											aria-hidden="true"
										>
											<code dangerouslySetInnerHTML={{
												__html: (highlightCodeToHtml(codeText) || '<span class="text-gray-600">// Write or paste your algorithm code here...</span>') + '\n'
											}} />
										</pre>

										{/* Interactive Transparent Textarea Layer */}
										<textarea
											value={codeText}
											onChange={(e) => setCodeText(e.target.value)}
											onScroll={(e) => {
												const backdrop = e.currentTarget.previousElementSibling as HTMLElement;
												if (backdrop) {
													backdrop.scrollTop = e.currentTarget.scrollTop;
													backdrop.scrollLeft = e.currentTarget.scrollLeft;
												}
											}}
											onKeyDown={(e) => {
												if (e.key === 'Tab') {
													e.preventDefault();
													const target = e.currentTarget;
													const start = target.selectionStart;
													const end = target.selectionEnd;
													const val = codeText;
													setCodeText(val.substring(0, start) + '    ' + val.substring(end));
													setTimeout(() => {
														target.selectionStart = target.selectionEnd = start + 4;
													}, 0);
												}
											}}
											placeholder=""
											spellCheck={false}
											className="relative z-10 w-full h-full p-3 bg-transparent text-transparent caret-white text-xs font-mono focus:outline-none resize-none leading-5 overflow-y-auto whitespace-pre border-0"
											style={{ tabSize: 4 }}
										/>
									</div>
								</div>

								{/* IDE Footer Metrics Bar */}
								<div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-t border-[#333333] text-[11px] text-gray-400">
									<div className="flex items-center gap-4">
										<span>UTF-8</span>
										<span>Spaces: 4</span>
										<span className="capitalize">{codeLanguage}</span>
									</div>

									<div className="flex items-center gap-3">
										<div className="flex items-center gap-1.5">
											<span className="text-gray-400 text-[10px]">Runtime:</span>
											<input
												type="text"
												value={codeRuntime}
												onChange={(e) => setCodeRuntime(e.target.value)}
												placeholder="24ms"
												className="w-16 bg-[#1e1e1e] px-2 py-0.5 rounded border border-[#3c3c3c] text-[11px] text-emerald-400 font-mono focus:outline-none focus:border-primary"
												spellCheck={false}
											/>
										</div>
										<div className="flex items-center gap-1.5">
											<span className="text-gray-400 text-[10px]">Beats:</span>
											<input
												type="text"
												value={codeBeats}
												onChange={(e) => setCodeBeats(e.target.value)}
												placeholder="98.5%"
												className="w-16 bg-[#1e1e1e] px-2 py-0.5 rounded border border-[#3c3c3c] text-[11px] text-emerald-400 font-mono focus:outline-none focus:border-primary"
												spellCheck={false}
											/>
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Milestone Attachment Form */}
						{postType === 'achievement' && (
							<div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
								<label className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
									<Trophy className="w-4 h-4 fill-amber-500" />
									<span>Achievement Title</span>
								</label>
								<input
									type="text"
									value={achievementText}
									onChange={(e) => setAchievementText(e.target.value)}
									placeholder="e.g. Solved 100 Dynamic Programming Problems!"
									className="w-full px-3 py-2 bg-background rounded-xl border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
								/>
							</div>
						)}

						{/* Tags Input */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-muted-foreground">Tags (comma separated)</label>
							<input
								type="text"
								value={tagInput}
								onChange={(e) => {
									setTagInput(e.target.value);
									const parsed = e.target.value.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
									setTags(parsed.length > 0 ? parsed : ['CodExecute']);
								}}
								placeholder="Discussion, Algorithm, Python"
								className="w-full px-3 py-2 bg-background rounded-xl border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
							/>
							<div className="flex flex-wrap gap-1.5 pt-1">
								{tags.map((tag) => (
									<span key={tag} className="text-[11px] text-primary bg-primary/10 font-mono px-2 py-0.5 rounded-md">
										#{tag}
									</span>
								))}
							</div>
						</div>
					</div>

					<DialogFooter className="flex items-center justify-between border-t border-border/60 pt-3">
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="rounded-xl h-9 text-xs cursor-pointer"
							onClick={() => setIsCreateModalOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={isPosting || !postContent.trim()}
							onClick={handleSubmitNewPost}
							className="rounded-xl h-9 px-5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold cursor-pointer"
						>
							{isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
							<span>{isPosting ? 'Posting...' : 'Publish Post'}</span>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}