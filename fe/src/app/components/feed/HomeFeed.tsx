import { useState, useEffect, useRef } from 'react';
import { PostRichTextEditor } from './PostRichTextEditor';
import { FormattedPostContent } from './FormattedPostContent';
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
	AlertTriangle,
	ExternalLink,
	FileCode2
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { TrendingTopics } from './TrendingTopics';
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
import { AchievementSelector } from './AchievementSelector';
import {
	PostItem,
	UserProfile,
	UserAchievementItem,
	LeaderboardUser,
	getPostsApi,
	createPostApi,
	addCommentApi,
	toggleLikePostApi,
	updatePostApi,
	deletePostApi,
	deleteCommentApi,
	toggleRepostPostApi,
	getProfileApi,
	getProblemsApi,
	getLeaderboardApi,
	getAccessToken
} from '../../services/api';

export function HomeFeed() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, token } = useAuth();
	const profileUrl = user?.user_id ? `/profile/${user.user_id}` : '/profile/me';

	const [posts, setPosts] = useState<PostItem[]>([]);
	const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
	const [problemsList, setProblemsList] = useState<any[]>([]);
	const [topSolvers, setTopSolvers] = useState<LeaderboardUser[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [activeTab, setActiveTab] = useState<'all' | 'code' | 'milestones' | 'discussions'>('all');
	const [selectedTopicFilter, setSelectedTopicFilter] = useState<string | null>(null);
	const [isPosting, setIsPosting] = useState(false);
	const [followingMap, setFollowingMap] = useState<Record<number, boolean>>({});
	const [bookmarkedMap, setBookmarkedMap] = useState<Record<string, boolean>>({});

	const handleTopicClick = (topic: string) => {
		const clean = topic.trim().replace(/^#/, '');
		if (selectedTopicFilter && selectedTopicFilter.toLowerCase() === clean.toLowerCase()) {
			setSelectedTopicFilter(null);
		} else {
			setSelectedTopicFilter(clean);
		}
	};

	// Create Post Popup Modal states
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [postType, setPostType] = useState<'discussion' | 'code-share' | 'achievement'>('discussion');
	const [postContent, setPostContent] = useState('');
	const createTextareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [tagInput, setTagInput] = useState('Discussion, CodExecute');
	const [tags, setTags] = useState<string[]>(['Discussion', 'CodExecute']);

	const getDefaultTagsForType = (type: 'discussion' | 'code-share' | 'achievement') => {
		switch (type) {
			case 'code-share':
				return { input: 'Solution, CodeShare', list: ['Solution', 'CodeShare'] };
			case 'achievement':
				return { input: 'Achievement, Milestone', list: ['Achievement', 'Milestone'] };
			case 'discussion':
			default:
				return { input: 'Discussion, CodExecute', list: ['Discussion', 'CodExecute'] };
		}
	};

	const handleOpenCreateModal = (type: 'discussion' | 'code-share' | 'achievement') => {
		setPostType(type);
		const defaultTags = getDefaultTagsForType(type);
		setTagInput(defaultTags.input);
		setTags(defaultTags.list);
		setIsCreateModalOpen(true);
	};

	const handleSwitchPostType = (type: 'discussion' | 'code-share' | 'achievement') => {
		setPostType(type);
		const defaultTags = getDefaultTagsForType(type);
		setTagInput(defaultTags.input);
		setTags(defaultTags.list);
	};

	// Code Snippet attachment states
	const [codeFilename, setCodeFilename] = useState('solution.py');
	const [codeLanguage, setCodeLanguage] = useState('python');
	const [codeText, setCodeText] = useState('');
	const [codeRuntime, setCodeRuntime] = useState('24ms');
	const [codeBeats, setCodeBeats] = useState('98.5%');

	// Achievement state
	const [achievementText, setAchievementText] = useState('');
	const [selectedAchievement, setSelectedAchievement] = useState<UserAchievementItem | null>(null);

	// Comment states
	const [openCommentsMap, setOpenCommentsMap] = useState<Record<string, boolean>>({});
	const [commentInputsMap, setCommentInputsMap] = useState<Record<string, string>>({});
	const [commentSubmittingMap, setCommentSubmittingMap] = useState<Record<string, boolean>>({});

	// Edit & Delete Post & Comment states
	const [editingPostId, setEditingPostId] = useState<string | null>(null);
	const [editContent, setEditContent] = useState('');
	const [editPostType, setEditPostType] = useState<'discussion' | 'code-share' | 'achievement'>('discussion');
	const [editCodeFilename, setEditCodeFilename] = useState('solution.py');
	const [editCodeLanguage, setEditCodeLanguage] = useState('python');
	const [editCodeText, setEditCodeText] = useState('');
	const [editAchievementText, setEditAchievementText] = useState('');
	const [editTagInput, setEditTagInput] = useState('');
	const [editTags, setEditTags] = useState<string[]>([]);
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

	const getProblemTitle = (problemId: string) => {
		const found = problemsList.find(p => p.problem_id === problemId || p.id === problemId || p.problem_id?.toLowerCase() === problemId.toLowerCase());
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

		// Fetch database problems for titles & counts
		getProblemsApi().then(data => {
			if (Array.isArray(data)) setProblemsList(data);
		}).catch(err => console.error('Failed to fetch problems:', err));

		// Fetch top solvers from leaderboard DB
		getLeaderboardApi().then(data => {
			if (Array.isArray(data)) setTopSolvers(data.slice(0, 4));
		}).catch(err => console.error('Failed to fetch leaderboard:', err));
	}, []);

	useEffect(() => {
		if (user?.user_id) {
			getProfileApi(user.user_id).then(data => {
				setUserProfile(data);
			}).catch(err => console.error('Failed to fetch user profile:', err));
		} else {
			setUserProfile(null);
		}
	}, [user?.user_id]);

	useEffect(() => {
		if (postType === 'achievement') {
			const achievements = userProfile?.achievements || user?.achievements || [];
			const unlocked = achievements.filter(a => a.unlocked);
			if (unlocked.length > 0 && !selectedAchievement) {
				setSelectedAchievement(unlocked[0]);
				setAchievementText(unlocked[0].title);
			}
		}
	}, [postType, userProfile, user]);

	useEffect(() => {
		const searchParams = new URLSearchParams(location.search);
		const openCommentsPostId = searchParams.get('open_comments');
		if (openCommentsPostId) {
			setOpenCommentsMap((prev) => ({ ...prev, [openCommentsPostId]: true }));
		}

		if (location.hash) {
			const targetId = location.hash.replace('#', '');
			setTimeout(() => {
				const el = document.getElementById(targetId);
				if (el) {
					el.scrollIntoView({ behavior: 'smooth', block: 'center' });
					el.classList.add('ring-2', 'ring-primary', 'transition-all');
					setTimeout(() => el.classList.remove('ring-2', 'ring-primary'), 2500);
				}
			}, 300);
		}
	}, [location.search, location.hash, posts]);

	const toggleLike = async (postId: string) => {
		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		const currentUserId = user?.user_id || '';

		// 1. Optimistic Update UI ngay lập tức
		setPosts(prev =>
			prev.map(p => {
				if (p.post_id !== postId) return p;
				const isLiked = p.liked_by?.includes(currentUserId);
				const newLikedBy = isLiked
					? (p.liked_by || []).filter(id => id !== currentUserId)
					: [...(p.liked_by || []), currentUserId];
				const newLikesCount = isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1;
				return {
					...p,
					likes_count: newLikesCount,
					liked_by: newLikedBy
				};
			})
		);

		// 2. Gọi API ngầm và chỉ patch các trường lượt thích
		try {
			const updatedPost = await toggleLikePostApi(authToken, postId);
			setPosts(prev =>
				prev.map(p => (p.post_id === postId ? { ...p, likes_count: updatedPost.likes_count, liked_by: updatedPost.liked_by } : p))
			);
		} catch (err) {
			console.error('Failed to toggle like:', err);
			// Revert state nếu API lỗi bằng cách tải lại danh sách bài viết
			fetchFeedPosts();
		}
	};

	const toggleRepost = async (postId: string) => {
		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		const currentUserId = user?.user_id || '';
		const targetPost = posts.find(p => p.post_id === postId);
		if (targetPost && targetPost.author_id === currentUserId) {
			return;
		}

		setPosts(prev =>
			prev.map(p => {
				if (p.post_id !== postId) return p;
				const isReposted = p.reposted_by?.includes(currentUserId);
				const newRepostedBy = isReposted
					? (p.reposted_by || []).filter(id => id !== currentUserId)
					: [...(p.reposted_by || []), currentUserId];
				const newRepostsCount = isReposted ? Math.max(0, (p.reposts_count || 0) - 1) : (p.reposts_count || 0) + 1;
				return {
					...p,
					reposts_count: newRepostsCount,
					reposted_by: newRepostedBy
				};
			})
		);

		try {
			const updatedPost = await toggleRepostPostApi(authToken, postId);
			setPosts(prev =>
				prev.map(p => (p.post_id === postId ? { ...p, reposts_count: updatedPost.reposts_count, reposted_by: updatedPost.reposted_by } : p))
			);
		} catch (err) {
			console.error('Failed to toggle repost:', err);
			fetchFeedPosts();
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

	const isPostContentEmpty = (content: string) => {
		if (!content) return true;
		const text = content.replace(/<[^>]*>/g, '').trim();
		return text.length === 0;
	};

	const handleSubmitNewPost = async () => {
		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		if (postType === 'achievement') {
			if (!selectedAchievement && !achievementText.trim()) {
				alert('Please select an unlocked achievement to publish your post.');
				return;
			}
		} else {
			if (isPostContentEmpty(postContent)) return;
		}

		try {
			setIsPosting(true);
			const titleToUse = selectedAchievement?.title || achievementText.trim();
			const descToUse = selectedAchievement?.desc || '';
			const defaultAchievementContent = descToUse
				? `🏆 I unlocked the achievement "${titleToUse}": ${descToUse}`
				: `🏆 I unlocked the achievement "${titleToUse}"`;

			const finalContent = postType === 'achievement'
				? (postContent.trim() || defaultAchievementContent)
				: postContent.trim();

			const payload: any = {
				content: finalContent,
				type: postType,
				tags: tags.length > 0 ? tags : ['CodExecute']
			};

			if (postType === 'code-share' && codeText.trim()) {
				payload.code_snippet = {
					filename: codeFilename || 'solution.py',
					language: codeLanguage || 'python',
					code: codeText.trim(),
				};
			}

			if (postType === 'achievement' && titleToUse) {
				payload.achievement = titleToUse;
			}

			const newPost = await createPostApi(authToken, payload);
			setPosts(prev => [newPost, ...prev]);

			setPostContent('');
			setCodeText('');
			setAchievementText('');
			setSelectedAchievement(null);
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
			setPosts(prev => prev.map(p => (p.post_id === postId ? { ...p, comments: updatedPost.comments } : p)));
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
			setPosts(prev => prev.map(p => (p.post_id === postId ? { ...p, comments: updatedPost.comments } : p)));
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

	const handleOpenEditModal = (post: PostItem) => {
		setEditingPostId(post.post_id);
		setEditContent(post.content);
		setEditPostType(post.type || 'discussion');
		setEditCodeFilename(post.code_snippet?.filename || 'solution.py');
		setEditCodeLanguage(post.code_snippet?.language || 'python');
		setEditCodeText(post.code_snippet?.code || '');
		setEditAchievementText(post.achievement || '');
		const existingTags = post.tags || [];
		setEditTagInput(existingTags.join(', '));
		setEditTags(existingTags);
	};

	const handleSaveEditPost = async () => {
		if (!editingPostId || isPostContentEmpty(editContent)) return;

		const authToken = getAccessToken();
		if (!authToken) {
			navigate('/login');
			return;
		}

		try {
			setIsUpdating(true);
			const parsedTags = editTagInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
			const payload: any = {
				content: editContent.trim(),
				tags: parsedTags,
			};

			if (editCodeText.trim()) {
				payload.code_snippet = {
					filename: editCodeFilename || 'solution.py',
					language: editCodeLanguage || 'python',
					code: editCodeText.trim(),
				};
			}

			if (editAchievementText.trim()) {
				payload.achievement = editAchievementText.trim();
			}

			const updatedPost = await updatePostApi(authToken, editingPostId, payload);
			setPosts(prev => prev.map(p => (p.post_id === editingPostId ? updatedPost : p)));
			setEditingPostId(null);
		} catch (err: any) {
			alert(err.message || 'Không thể cập nhật bài viết');
		} finally {
			setIsUpdating(false);
		}
	};

	const filteredPosts = posts.filter(post => {
		if (activeTab === 'code' && post.type !== 'code-share') return false;
		if (activeTab === 'milestones' && post.type !== 'achievement') return false;
		if (activeTab === 'discussions' && post.type !== 'discussion') return false;

		if (selectedTopicFilter) {
			const target = selectedTopicFilter.toLowerCase();
			const matchInTags = post.tags?.some(t => t.toLowerCase().replace(/^#/, '') === target);
			const matchInContent = post.content?.toLowerCase().includes(`#${target}`) || post.content?.toLowerCase().includes(target);
			if (!matchInTags && !matchInContent) return false;
		}

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

							<h3 className="text-foreground font-bold text-lg leading-tight">{userProfile?.full_name || user?.full_name || 'Guest User'}</h3>
							<p className="text-muted-foreground text-xs mt-1 mb-3 font-medium">{userProfile?.title || user?.title || 'Member'}</p>
							
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
							<div
								onClick={() => navigate('/submissions')}
								className="p-2 rounded-xl bg-muted/30 hover:bg-muted/70 cursor-pointer transition-colors group"
								title="View Submissions History"
							>
								<p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Solved</p>
								<p className="text-foreground font-bold text-base mt-0.5">{userProfile?.stats?.solved_count ?? 0}</p>
							</div>
							<div
								onClick={() => navigate('/streak')}
								className="p-2 rounded-xl bg-muted/30 hover:bg-muted/70 cursor-pointer transition-colors group"
								title="View Streak Details & Activity"
							>
								<p className="text-xs text-muted-foreground group-hover:text-amber-500 transition-colors">Streak</p>
								<p className="text-amber-500 font-bold text-base mt-0.5 flex items-center justify-center gap-0.5">
									<span>{userProfile?.streak?.current_streak ?? 0}</span>
									<Flame className="w-3.5 h-3.5 fill-amber-500" />
								</p>
							</div>
							<div
								onClick={() => navigate('/leaderboard')}
								className="p-2 rounded-xl bg-muted/30 hover:bg-muted/70 cursor-pointer transition-colors group"
								title="View Leaderboard"
							>
								<p className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Rank</p>
								<p className="text-primary font-bold text-base mt-0.5">{userProfile?.rank ? `#${userProfile.rank}` : 'N/A'}</p>
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
								onClick={() => navigate('/streak')}
								className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-amber-500/20 hover:bg-amber-500/10 text-left transition-all duration-200 group cursor-pointer"
							>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 group-hover:border-amber-400 group-hover:scale-105 transition-all duration-200">
										<Flame className="w-4 h-4 fill-amber-500 group-hover:fill-slate-950" />
									</div>
									<span className="text-foreground text-sm font-medium group-hover:text-amber-500 transition-colors">Streak & Activity</span>
								</div>
								<Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] px-2 font-mono">
									{userProfile?.streak?.current_streak ?? 0}🔥
								</Badge>
							</button>

							<button
								onClick={() => navigate('/problems')}
								className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-primary/20 hover:bg-primary/10 text-left transition-all duration-200 group cursor-pointer"
							>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary/40 group-hover:scale-105 transition-all duration-200">
										<Code2 className="w-4 h-4" />
									</div>
									<span className="text-foreground text-sm font-medium group-hover:text-primary transition-colors">Problem Set</span>
								</div>
								<span className="text-xs text-muted-foreground font-mono">{problemsList.length > 0 ? `${problemsList.length}` : '0'}</span>
							</button>

							<button
								onClick={() => navigate('/submissions')}
								className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-blue-500/20 hover:bg-blue-500/10 text-left transition-all duration-200 group cursor-pointer"
							>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white group-hover:border-blue-400 group-hover:scale-105 transition-all duration-200">
										<FileCode2 className="w-4 h-4" />
									</div>
									<span className="text-foreground text-sm font-medium group-hover:text-blue-500 transition-colors">Submissions</span>
								</div>
							</button>

							<button
								onClick={() => navigate('/leaderboard')}
								className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-rose-500/20 hover:bg-rose-500/10 text-left transition-all duration-200 group cursor-pointer"
							>
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 group-hover:bg-rose-500 group-hover:text-white group-hover:border-rose-400 group-hover:scale-105 transition-all duration-200">
										<Trophy className="w-4 h-4" />
									</div>
									<span className="text-foreground text-sm font-medium group-hover:text-rose-500 transition-colors">Leaderboard</span>
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
							onClick={() => handleOpenCreateModal('discussion')}
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
									onClick={() => handleOpenCreateModal('code-share')}
								>
									<Code2 className="w-4 h-4 text-primary" />
									<span>Code Snippet</span>
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-amber-500 cursor-pointer"
									onClick={() => handleOpenCreateModal('achievement')}
								>
									<Trophy className="w-4 h-4 text-amber-500" />
									<span>Milestone</span>
								</Button>
							</div>

							<Button
								size="sm"
								onClick={() => handleOpenCreateModal('discussion')}
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

					{/* Active Topic Filter Indicator */}
					{selectedTopicFilter && (
						<div className="flex items-center justify-between p-3.5 px-4 bg-primary/10 border border-primary/25 rounded-2xl text-xs backdrop-blur-md">
							<div className="flex items-center gap-2.5 text-foreground font-medium">
								<span className="text-muted-foreground">Filtered by topic:</span>
								<span className="font-mono font-bold text-primary bg-primary/20 px-3 py-1 rounded-xl border border-primary/30 text-xs shadow-sm">
									#{selectedTopicFilter}
								</span>
							</div>
							<button
								onClick={() => setSelectedTopicFilter(null)}
								className="text-xs text-muted-foreground hover:text-foreground font-semibold underline cursor-pointer transition-colors"
							>
								Clear filter
							</button>
						</div>
					)}

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
								const isRepostedByMe = user?.user_id ? post.reposted_by?.includes(user.user_id) : false;
								const isCommentsOpen = openCommentsMap[post.post_id];
								const commentText = commentInputsMap[post.post_id] || '';
								const isSubmittingCmt = commentSubmittingMap[post.post_id];
								const isAuthor = !post.author_id || (user?.user_id && post.author_id === user.user_id) || user?.role === 'admin';

								return (
									<Card id={`post-${post.post_id}`} key={post.post_id} className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md transition-all">
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

											{/* Action Menu */}
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
															onClick={() => handleOpenEditModal(post)}
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

										{/* Topic Badge if associated with a Problem */}
										{post.problem_id && (
											<div className="mb-3">
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

										{/* Post Body Content */}
										<FormattedPostContent content={post.content} className="mb-4" />

										{/* Code Block Attachment (for Code Shares or Discussions with attached code) */}
										{post.code_snippet && (
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
													<span
														key={tag}
														onClick={() => handleTopicClick(tag)}
														className="text-xs text-primary font-mono bg-primary/10 px-2.5 py-0.5 rounded-md hover:bg-primary/20 cursor-pointer transition-colors"
													>
														#{tag.replace(/^#/, '')}
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
												disabled={isAuthor}
												title={isAuthor ? "Bạn không thể chia sẻ lại bài viết của chính mình" : undefined}
												onClick={() => !isAuthor && toggleRepost(post.post_id)}
												className={`h-8 gap-1.5 text-xs font-semibold ${
													isAuthor
														? 'opacity-40 cursor-not-allowed text-muted-foreground'
														: isRepostedByMe
														? 'text-emerald-500 bg-emerald-500/10'
														: 'text-muted-foreground hover:text-foreground'
												}`}
											>
												<Share2 className="w-4 h-4" />
												<span>{post.reposts_count && post.reposts_count > 0 ? `${post.reposts_count} Repost` : 'Repost'}</span>
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

				{/* RIGHT SIDEBAR: Top Solvers & Trending Topics */}
				<div className="col-span-12 lg:col-span-3 space-y-5">
					{/* Trending Coding Topics Widget */}
					<TrendingTopics
						posts={posts}
						selectedTopic={selectedTopicFilter}
						onTopicClick={handleTopicClick}
					/>

					{/* Top Community Solvers Leaderboard Widget */}
					<Card className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-3">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Trophy className="w-4 h-4 text-amber-500" />
								<h4 className="text-sm font-bold text-foreground">Top Solvers</h4>
							</div>
							<button
								onClick={() => navigate('/leaderboard')}
								className="text-xs text-primary hover:underline font-medium cursor-pointer"
							>
								View all
							</button>
						</div>

						{topSolvers.length === 0 ? (
							<p className="text-xs text-muted-foreground italic py-1 text-center">No solvers yet</p>
						) : (
							<div className="space-y-2.5 pt-1">
								{topSolvers.map((solver, idx) => (
									<div
										key={solver.user_id}
										onClick={() => navigate(`/profile/${solver.user_id}`)}
										className="flex items-center justify-between p-2 rounded-xl hover:bg-accent/60 transition-colors cursor-pointer group"
									>
										<div className="flex items-center gap-2.5">
											<span className={`w-4 text-center text-xs font-bold font-mono ${
												idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'
											}`}>
												#{solver.rank || idx + 1}
											</span>
											<Avatar className="w-7 h-7 border border-border">
												<AvatarImage src={solver.avatar_url} />
												<AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
													{getInitials(solver.full_name)}
												</AvatarFallback>
											</Avatar>
											<div className="min-w-0 flex-1">
												<p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors leading-tight truncate">
													{solver.full_name}
												</p>
												<p className="text-[10px] text-muted-foreground truncate">
													{solver.title || 'Developer'}
												</p>
											</div>
										</div>

										<div className="text-right shrink-0">
											<span className="text-xs font-bold text-foreground">{solver.solved_count}</span>
											<span className="text-[10px] text-muted-foreground ml-1">solved</span>
										</div>
									</div>
								))}
							</div>
						)}
					</Card>
				</div>
			</div>

			{/* Edit Post Modal Dialog */}
			<Dialog open={!!editingPostId} onOpenChange={(open) => !open && setEditingPostId(null)}>
				<DialogContent className="sm:max-w-2xl p-6 space-y-4 rounded-2xl border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-foreground">Edit Post</DialogTitle>
					</DialogHeader>

					<div className="overflow-y-auto space-y-4 px-1 py-1 flex-1">
						{/* Main Post Content Live WYSIWYG Editor */}
						<div className="space-y-1">
							<PostRichTextEditor
								value={editContent}
								onChange={setEditContent}
								placeholder="Edit your post content..."
							/>
						</div>

						{/* Edit Code Snippet Attachment if present or code-share */}
						{(editPostType === 'code-share' || editCodeText) && (
							<div className="rounded-xl border border-border bg-[#1e1e1e] overflow-hidden font-mono shadow-xl">
								{/* IDE Header Bar */}
								<div className="bg-[#252526] px-4 py-2.5 flex items-center justify-between border-b border-[#333333]">
									<div className="flex items-center gap-3 flex-1">
										<div className="flex items-center gap-1.5 shrink-0">
											<span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
											<span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
											<span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
										</div>

										<div className="flex items-center gap-2 bg-[#1e1e1e] px-3 py-1 rounded-lg border border-[#3c3c3c] flex-1 max-w-xs">
											<Code2 className="w-3.5 h-3.5 text-primary shrink-0" />
											<input
												type="text"
												value={editCodeFilename}
												onChange={(e) => setEditCodeFilename(e.target.value)}
												placeholder="solution.py"
												className="bg-transparent text-xs text-gray-200 focus:outline-none w-full font-mono"
												spellCheck={false}
											/>
										</div>
									</div>

									<select
										value={editCodeLanguage}
										onChange={(e) => setEditCodeLanguage(e.target.value)}
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

								<div className="flex bg-[#1e1e1e] relative h-[200px] overflow-hidden">
									<div className="bg-[#1e1e1e] border-r border-[#2d2d2d] py-3 px-2 text-right text-[11px] text-gray-600 font-mono select-none w-10 shrink-0 space-y-[2px]">
										{Array.from({ length: Math.max(1, editCodeText.split('\n').length) }).map((_, i) => (
											<div key={i} className="leading-5">{i + 1}</div>
										))}
									</div>

									<div className="relative flex-1 bg-[#1e1e1e] overflow-hidden h-full">
										<pre
											className="absolute inset-0 p-3 m-0 text-xs font-mono leading-5 overflow-hidden pointer-events-none whitespace-pre select-none text-gray-200 border-0"
											style={{ tabSize: 4 }}
											aria-hidden="true"
										>
											<code dangerouslySetInnerHTML={{
												__html: (highlightCodeToHtml(editCodeText) || '<span class="text-gray-600">// Write or paste your algorithm code here...</span>') + '\n'
											}} />
										</pre>

										<textarea
											value={editCodeText}
											onChange={(e) => setEditCodeText(e.target.value)}
											onScroll={(e) => {
												const backdrop = e.currentTarget.previousElementSibling as HTMLElement;
												if (backdrop) {
													backdrop.scrollTop = e.currentTarget.scrollTop;
													backdrop.scrollLeft = e.currentTarget.scrollLeft;
												}
											}}
											spellCheck={false}
											className="relative z-10 w-full h-full p-3 bg-transparent text-transparent caret-white text-xs font-mono focus:outline-none resize-none leading-5 overflow-y-auto whitespace-pre border-0"
											style={{ tabSize: 4 }}
										/>
									</div>
								</div>
							</div>
						)}

						{/* Edit Milestone Attachment if present */}
						{(editPostType === 'achievement' || editAchievementText) && (
							<div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
								<label className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
									<Trophy className="w-4 h-4 fill-amber-500" />
									<span>Achievement Title</span>
								</label>
								<input
									type="text"
									value={editAchievementText}
									onChange={(e) => setEditAchievementText(e.target.value)}
									placeholder="e.g. Solved 100 Dynamic Programming Problems!"
									className="w-full px-3 py-2 bg-background rounded-xl border border-border text-foreground text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all"
								/>
							</div>
						)}

						{/* Edit Tags Input */}
						<div className="space-y-1.5">
							<label className="text-xs font-semibold text-muted-foreground">Tags (comma separated)</label>
							<input
								type="text"
								value={editTagInput}
								onChange={(e) => {
									setEditTagInput(e.target.value);
									const parsed = e.target.value.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
									setEditTags(parsed);
								}}
								placeholder="Discussion, Solution, Algorithm"
								className="w-full px-3 py-2 bg-background rounded-xl border border-border text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
							/>
							<div className="flex flex-wrap gap-1.5 pt-1">
								{editTags.map((tag) => (
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
							onClick={() => setEditingPostId(null)}
						>
							Cancel
						</Button>
						<Button
							type="button"
							size="sm"
							disabled={isUpdating || isPostContentEmpty(editContent)}
							onClick={handleSaveEditPost}
							className="rounded-xl h-9 px-5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold cursor-pointer"
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
				<DialogContent className="sm:max-w-2xl p-6 space-y-4 rounded-2xl border-border bg-card shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
					<DialogHeader>
						<DialogTitle className="text-lg font-bold text-foreground">Create Post</DialogTitle>
					</DialogHeader>

					<div className="overflow-y-auto space-y-4 px-1 py-1 flex-1">
						{/* Author info & Post Type Selectors */}
						<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="flex items-center gap-3 shrink-0">
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
							<div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50 shrink-0 overflow-x-auto self-start sm:self-auto">
								<button
									type="button"
									onClick={() => handleSwitchPostType('discussion')}
									className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
										postType === 'discussion'
											? 'bg-primary text-primary-foreground shadow-xs'
											: 'text-muted-foreground hover:text-foreground'
									}`}
								>
									Discussion
								</button>

								<button
									type="button"
									onClick={() => handleSwitchPostType('code-share')}
									className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
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
									onClick={() => handleSwitchPostType('achievement')}
									className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
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

						{/* Post Content Area: Rich Text Editor for normal posts, or Achievement Selector for Milestones */}
						{postType === 'achievement' ? (
							<div className="space-y-3">
								<AchievementSelector
									achievements={userProfile?.achievements || user?.achievements || []}
									selectedAchievement={selectedAchievement}
									onSelect={(ach) => {
										setSelectedAchievement(ach);
										setAchievementText(ach.title);
									}}
								/>
								<div className="space-y-1.5 pt-1">
									<label className="text-xs font-semibold text-muted-foreground">Additional Note (Optional)</label>
									<textarea
										value={postContent}
										onChange={(e) => setPostContent(e.target.value)}
										placeholder={selectedAchievement ? `🎉 Share your thoughts about "${selectedAchievement.title}"...` : "Write a note about this achievement..."}
										rows={2}
										className="w-full px-3 py-2 bg-background rounded-xl border border-border text-foreground text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 transition-all resize-none"
									/>
								</div>
							</div>
						) : (
							<PostRichTextEditor
								value={postContent}
								onChange={setPostContent}
								placeholder="Share code snippet, ask an algorithm question, or post a coding milestone..."
							/>
						)}

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

								{/* IDE Footer Bar */}
								<div className="bg-[#252526] px-4 py-2 flex items-center justify-between border-t border-[#333333] text-[11px] text-gray-400">
									<div className="flex items-center gap-4">
										<span>UTF-8</span>
										<span>Spaces: 4</span>
										<span className="capitalize">{codeLanguage}</span>
									</div>
								</div>
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
									const fallback = postType === 'code-share' ? ['Solution', 'CodeShare'] : postType === 'achievement' ? ['Achievement', 'Milestone'] : ['Discussion', 'CodExecute'];
									setTags(parsed.length > 0 ? parsed : fallback);
								}}
								placeholder={
									postType === 'code-share'
										? 'Solution, CodeShare, Python'
										: postType === 'achievement'
										? 'Achievement, Milestone, Streak'
										: 'Discussion, Algorithm, Question'
								}
								className="w-full px-3 py-2 bg-background rounded-xl border border-border text-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
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
							disabled={
								isPosting ||
								(postType === 'achievement'
									? !selectedAchievement && !achievementText.trim()
									: isPostContentEmpty(postContent))
							}
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