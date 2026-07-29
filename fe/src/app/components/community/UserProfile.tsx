import { useState, useEffect, useMemo } from 'react';
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
	FileText,
	FileCode2,
	Calendar,
	MoreVertical
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { PROBLEMS_LIST } from '../../context/ProblemContext';
import { PostRichTextEditor } from '../feed/PostRichTextEditor';
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
	getProfileApi,
	followUserApi,
	unfollowUserApi,
	getUserPostsApi,
	toggleLikePostApi,
	toggleRepostPostApi,
	addCommentApi,
	createPostApi,
	updatePostApi,
	deletePostApi,
	deleteCommentApi,
	getAccessToken,
	getMySubmissionsApi,
	PostItem,
	UserProfile as UserProfileType,
	UserAchievementItem
} from '../../services/api';
import { FollowListModal } from './FollowListModal';
import { FormattedPostContent } from '../feed/FormattedPostContent';
import { AchievementSelector } from '../feed/AchievementSelector';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../ui/alert-dialog';

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
	const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
	const [isDeletingPost, setIsDeletingPost] = useState<boolean>(false);

	// Edit post states
	const [editingPostId, setEditingPostId] = useState<string | null>(null);
	const [editContent, setEditContent] = useState('');
	const [editPostType, setEditPostType] = useState<'discussion' | 'code-share' | 'achievement'>('discussion');
	const [editCodeFilename, setEditCodeFilename] = useState('solution.py');
	const [editCodeLanguage, setEditCodeLanguage] = useState('python');
	const [editCodeText, setEditCodeText] = useState('');
	const [editAchievementText, setEditAchievementText] = useState('');
	const [editTagInput, setEditTagInput] = useState('');
	const [editTags, setEditTags] = useState<string[]>([]);
	const [isUpdatingPost, setIsUpdatingPost] = useState<boolean>(false);

	// Create Post states
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [postType, setPostType] = useState<'discussion' | 'code-share' | 'achievement'>('discussion');
	const [postContent, setPostContent] = useState('');
	const [codeFilename, setCodeFilename] = useState('solution.py');
	const [codeLanguage, setCodeLanguage] = useState('python');
	const [codeText, setCodeText] = useState('');
	const [achievementText, setAchievementText] = useState('');
	const [selectedAchievement, setSelectedAchievement] = useState<UserAchievementItem | null>(null);
	const [currentUserProfile, setCurrentUserProfile] = useState<UserProfileType | null>(null);
	const [tagInput, setTagInput] = useState('');
	const [tags, setTags] = useState<string[]>(['Discussion', 'CodExecute']);
	const [isPosting, setIsPosting] = useState(false);

	// Fetch current user achievements if not on own profile
	useEffect(() => {
		if (currentUser?.user_id) {
			getProfileApi(currentUser.user_id).then(data => {
				setCurrentUserProfile(data);
			}).catch(err => console.error('Failed to load current user profile:', err));
		}
	}, [currentUser?.user_id]);

	const myAchievements = currentUserProfile?.achievements || (profile?.user_id === currentUser?.user_id ? profile?.achievements : []) || currentUser?.achievements || [];

	useEffect(() => {
		if (postType === 'achievement') {
			const unlocked = myAchievements.filter(a => a.unlocked);
			if (unlocked.length > 0 && !selectedAchievement) {
				setSelectedAchievement(unlocked[0]);
				setAchievementText(unlocked[0].title);
			}
		}
	}, [postType, myAchievements]);

	// Comments state
	const [openCommentsMap, setOpenCommentsMap] = useState<Record<string, boolean>>({});
	const [commentInputsMap, setCommentInputsMap] = useState<Record<string, string>>({});
	const [commentSubmittingMap, setCommentSubmittingMap] = useState<Record<string, boolean>>({});
	const [allSubmissions, setAllSubmissions] = useState<any[]>([]);

	useEffect(() => {
		if (targetUserId && currentUser?.user_id && targetUserId === currentUser.user_id) {
			getMySubmissionsApi().then(data => {
				if (Array.isArray(data)) setAllSubmissions(data);
			}).catch(() => {});
		}
	}, [targetUserId, currentUser?.user_id]);

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
		const targetPost = userPosts.find(p => p.post_id === postId);
		if (targetPost && targetPost.author_id === currentUserId) {
			return;
		}

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

	const handlePromptDeletePost = (postId: string) => {
		setDeletingPostId(postId);
	};

	const handleConfirmDeletePost = async () => {
		if (!deletingPostId) return;
		const authToken = getAccessToken();
		if (!authToken) return;

		setIsDeletingPost(true);
		try {
			await deletePostApi(authToken, deletingPostId);
			setUserPosts(prev => prev.filter(p => p.post_id !== deletingPostId));
			setDeletingPostId(null);
		} catch (err) {
			console.error('Failed to delete post:', err);
		} finally {
			setIsDeletingPost(false);
		}
	};

	const isPostContentEmpty = (contentStr: string) => {
		if (!contentStr) return true;
		const stripped = contentStr.replace(/<[^>]*>/g, '').trim();
		return stripped.length === 0;
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
			setIsUpdatingPost(true);
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
			setUserPosts(prev => prev.map(p => (p.post_id === editingPostId ? updatedPost : p)));
			setEditingPostId(null);
		} catch (err: any) {
			console.error('Failed to update post:', err);
		} finally {
			setIsUpdatingPost(false);
		}
	};

	const getDefaultTagsForType = (type: 'discussion' | 'code-share' | 'achievement') => {
		switch (type) {
			case 'code-share':
				return { input: 'Solution, CodeShare', list: ['Solution', 'CodeShare'] };
			case 'achievement':
				return { input: 'Achievement, Milestone', list: ['Achievement', 'Milestone'] };
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
			setUserPosts(prev => [newPost, ...prev]);

			setPostContent('');
			setCodeText('');
			setAchievementText('');
			setSelectedAchievement(null);
			setIsCreateModalOpen(false);
		} catch (err: any) {
			console.error('Failed to create post:', err);
			alert(err.message || 'Không thể tạo bài viết');
		} finally {
			setIsPosting(false);
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
	const displayTitle = profile?.title || 'Unknown';
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

	const ICON_MAP: Record<string, any> = {
		Code2,
		CheckCircle2,
		Flame,
		Trophy,
		Zap,
		Sparkles,
		Star,
		Award,
		Clock,
	};

	const achievementsList = profile?.achievements || [];

	const problemStats = [
		{
			label: 'Easy',
			count: profile?.stats?.easy_solved || 0,
			total: profile?.stats?.total_easy || 0,
			color: 'bg-emerald-500',
			badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
		},
		{
			label: 'Medium',
			count: profile?.stats?.medium_solved || 0,
			total: profile?.stats?.total_medium || 0,
			color: 'bg-amber-500',
			badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
		},
		{
			label: 'Hard',
			count: profile?.stats?.hard_solved || 0,
			total: profile?.stats?.total_hard || 0,
			color: 'bg-rose-500',
			badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
		}
	];

	const recentSubmissionsList = profile?.recent_submissions || [];
	const skillsList = profile?.skills && profile.skills.length > 0
		? profile.skills
		: [
			{ name: 'Python', level: 0, category: 'Language' },
			{ name: 'C++', level: 0, category: 'Language' }
		];

	const dynamicActivity = [
		...(recentSubmissionsList.slice(0, 5).map((sub, idx) => ({
			id: `sub-${idx}`,
			type: 'problem',
			title: `Solved "${sub.problem}"`,
			detail: `Language: ${sub.language} • Runtime: ${sub.runtime} • Memory: ${sub.memory}`,
			time: formatTimeAgo(sub.submitted_at)
		}))),
		...(achievementsList.filter(a => a.unlocked).map((ach, idx) => ({
			id: `ach-${idx}`,
			type: 'achievement',
			title: `Unlocked Achievement "${ach.title}"`,
			detail: ach.desc,
			time: formatTimeAgo(ach.unlocked_at)
		})))
	];

	// Heatmap computation for User Profile
	const { heatmapWeeks, heatmapMonthHeaders } = useMemo(() => {
		const submissionDatesMap: Record<string, number> = {};
		
		const sourceList = allSubmissions.length > 0 ? allSubmissions : recentSubmissionsList;
		if (Array.isArray(sourceList)) {
			sourceList.forEach((sub: any) => {
				if (sub.submitted_at) {
					const dStr = sub.submitted_at.substring(0, 10);
					submissionDatesMap[dStr] = (submissionDatesMap[dStr] || 0) + 1;
				}
			});
		}

		const today = new Date();
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

		return { heatmapWeeks: weeks, heatmapMonthHeaders: months };
	}, [allSubmissions, recentSubmissionsList]);

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

						{/* Nếu là profile của bản thân: Hiển thị Submissions History & Edit Profile */}
						{profile?.can_edit && (
							<>
								<Button
									variant="outline"
									size="sm"
									className="gap-2 rounded-xl h-10 px-4 text-xs font-semibold border-border hover:bg-accent cursor-pointer text-foreground"
									onClick={() => navigate('/submissions')}
								>
									<FileCode2 className="w-4 h-4 text-primary" />
									<span>Submissions History</span>
								</Button>

								<Button
									variant="outline"
									size="sm"
									className="gap-2 rounded-xl h-10 px-4 text-xs font-semibold border-border hover:bg-accent cursor-pointer"
									onClick={() => navigate('/settings')}
								>
									<Pencil className="w-4 h-4 text-primary" />
									<span>Edit Profile</span>
								</Button>
							</>
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
					<Card
						onClick={() => navigate('/submissions')}
						className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-xl shadow-sm flex items-center gap-4 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all cursor-pointer group"
					>
						<div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform">
							<Code2 className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-emerald-500 transition-colors">Problems Solved</p>
							<div className="flex items-baseline gap-2 mt-0.5">
								<span className="text-2xl font-extrabold text-foreground">{profile?.stats?.solved_count ?? 0}</span>
								<span className="text-xs text-emerald-500 font-semibold font-mono">
									{profile?.stats?.total_problems ? Math.round((profile.stats.solved_count / profile.stats.total_problems) * 100) : 0}% Total
								</span>
							</div>
						</div>
					</Card>

					{/* Acceptance Rate */}
					<Card
						onClick={() => navigate('/submissions')}
						className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-xl shadow-sm flex items-center gap-4 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
					>
						<div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 shrink-0 group-hover:scale-105 transition-transform">
							<TrendingUp className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-blue-500 transition-colors">Acceptance Rate</p>
							<div className="flex items-baseline gap-2 mt-0.5">
								<span className="text-2xl font-extrabold text-foreground">{profile?.stats?.acceptance_rate ?? 0}%</span>
								<span className="text-xs text-blue-500 font-semibold font-mono">{profile?.stats?.total_submissions ?? 0} Subs</span>
							</div>
						</div>
					</Card>

					{/* Day Streak */}
					<Card
						onClick={() => navigate('/streak')}
						className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-xl shadow-sm flex items-center gap-4 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group"
					>
						<div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0 group-hover:scale-105 transition-transform">
							<Flame className="w-6 h-6 fill-amber-500" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-amber-500 transition-colors">Active Streak</p>
							<div className="flex items-baseline gap-2 mt-0.5">
								<span className="text-2xl font-extrabold text-foreground">{profile?.streak?.current_streak ?? 0} Days</span>
								<span className="text-xs text-amber-500 font-semibold font-mono">Best: {profile?.streak?.best_streak ?? 0}</span>
							</div>
						</div>
					</Card>

					{/* Global Rank */}
					<Card
						onClick={() => navigate('/leaderboard')}
						className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-xl shadow-sm flex items-center gap-4 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all cursor-pointer group"
					>
						<div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/20 shrink-0 group-hover:scale-105 transition-transform">
							<Trophy className="w-6 h-6" />
						</div>
						<div>
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-purple-500 transition-colors">Leaderboard</p>
							<div className="flex items-baseline gap-2 mt-0.5">
								<span className="text-2xl font-extrabold text-foreground">#{profile?.rank ?? 1}</span>
								<span className="text-xs text-purple-500 font-semibold font-mono">of {profile?.total_users ?? 1} Users</span>
							</div>
						</div>
					</Card>
				</div>

				{/* 365-Day Activity Heatmap Grid */}
				<div className="pt-4 border-t border-border/60">
					<div className="flex items-center justify-between mb-3">
						<div className="flex items-center gap-2">
							<Calendar className="w-4 h-4 text-primary" />
							<h3 className="text-sm font-bold text-foreground">Activity Heatmap</h3>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="text-xs text-primary font-medium hover:underline gap-1 cursor-pointer h-7 px-2"
							onClick={() => navigate('/streak')}
						>
							<span>View Streak & Activity Details</span>
							<ExternalLink className="w-3 h-3" />
						</Button>
					</div>

					<div className="overflow-x-auto pb-2">
						<div className="min-w-[760px] space-y-2">
							{/* Month Headers */}
							<div className="flex text-[11px] font-mono text-muted-foreground pl-10 h-4 relative">
								{heatmapMonthHeaders.map((m, idx) => (
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
							<div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground pt-1">
								<span>Less</span>
								<div className="w-3.5 h-3.5 rounded-sm bg-muted/40 border border-border/40" />
								<div className="w-3.5 h-3.5 rounded-sm bg-emerald-900/60 dark:bg-emerald-950/80 border border-emerald-700/50" />
								<div className="w-3.5 h-3.5 rounded-sm bg-emerald-600/80 border border-emerald-500" />
								<div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 border border-emerald-300" />
								<span>More</span>
							</div>
						</div>
					</div>
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
					{/* Create Post Trigger Box (Only when viewing own profile) */}
					{profile?.can_edit && (
						<Card className="p-4 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-3">
							<div
								className="flex items-center gap-3 cursor-pointer group"
								onClick={() => handleOpenCreateModal('discussion')}
							>
								<Avatar className="w-9 h-9 border border-border">
									<AvatarImage src={profile?.avatar_url || currentUser?.avatar_url} />
									<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
										{getInitials(displayName)}
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
					)}
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
									const isAuthor = Boolean(currentUser?.user_id && post.author_id === currentUser.user_id);
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
													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<button
																type="button"
																className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent cursor-pointer rounded-xl transition-colors focus:outline-none"
															>
																<MoreVertical className="w-4 h-4" />
															</button>
														</DropdownMenuTrigger>
														<DropdownMenuContent align="end" sideOffset={6} className="w-40 p-1.5 rounded-xl border-border bg-card shadow-2xl z-50 space-y-0.5">
															{isAuthor && (
																<DropdownMenuItem
																	className="cursor-pointer gap-2.5 p-2 rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors"
																	onClick={() => handleOpenEditModal(post)}
																>
																	<Pencil className="w-3.5 h-3.5 text-primary" />
																	<span>Edit Post</span>
																</DropdownMenuItem>
															)}
															<DropdownMenuItem
																variant="destructive"
																className="cursor-pointer gap-2.5 p-2 rounded-lg text-xs font-medium text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20 transition-colors"
																onClick={() => handlePromptDeletePost(post.post_id)}
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
											<FormattedPostContent content={post.content} className="mb-2" />

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
													disabled={isAuthor}
													title={isAuthor ? "You cannot repost your own post" : undefined}
													onClick={() => !isAuthor && handleToggleRepost(post.post_id)}
													className={`h-8 gap-1.5 text-xs font-semibold ${
														isAuthor
															? 'opacity-40 cursor-not-allowed text-muted-foreground'
															: isRepostedByMe
															? 'text-emerald-500 bg-emerald-500/10'
															: 'text-muted-foreground hover:text-foreground'
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
										<div className={`${stat.color} h-full rounded-full transition-all duration-500`} style={{ width: `${stat.total > 0 ? (stat.count / stat.total) * 100 : 0}%` }}></div>
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
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									className="text-xs text-primary font-medium hover:bg-accent gap-1.5 rounded-xl cursor-pointer"
									onClick={() => navigate('/submissions')}
								>
									<FileCode2 className="w-3.5 h-3.5" />
									<span>Submissions History</span>
								</Button>
								<Button variant="ghost" size="sm" className="text-xs text-primary font-medium hover:underline gap-1 cursor-pointer" onClick={() => navigate('/problems')}>
									<span>View All Problems</span>
									<ExternalLink className="w-3.5 h-3.5" />
								</Button>
							</div>
						</div>

						{recentSubmissionsList.length === 0 ? (
							<div className="p-8 text-center text-muted-foreground text-xs font-medium">
								No submissions recorded yet. Solve a problem to start tracking your progress!
							</div>
						) : (
							<div className="space-y-2.5">
								{recentSubmissionsList.map((submission, i) => (
									<div
										key={submission.submission_id || i}
										className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-background/60 rounded-xl border border-border/60 hover:border-primary/40 transition-colors cursor-pointer gap-3"
										onClick={() => navigate(`/problems/${submission.problem_id}`)}
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
												{submission.difficulty || 'Easy'}
											</Badge>
											<span className="text-foreground font-semibold text-sm hover:text-primary transition-colors">
												{submission.problem}
											</span>
										</div>

										<div className="flex items-center gap-4 text-xs font-mono shrink-0">
											<Badge
												variant="outline"
												className={`text-[11px] gap-1 ${
													submission.status === 'Accepted'
														? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
														: 'bg-rose-500/10 text-rose-500 border-rose-500/30'
												}`}
											>
												{submission.status === 'Accepted' ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
												<span>{submission.status}</span>
											</Badge>
											<span className="text-muted-foreground">{submission.runtime}</span>
											<span className="text-muted-foreground">{submission.memory}</span>
											<span className="text-muted-foreground/60">{formatTimeAgo(submission.submitted_at)}</span>
										</div>
									</div>
								))}
							</div>
						)}
					</Card>
				</TabsContent>

				{/* TAB 2: Achievements */}
				<TabsContent value="achievements" className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{achievementsList.map((achievement) => {
							const IconComponent = ICON_MAP[achievement.icon] || Trophy;
							const isUnlocked = achievement.unlocked;
							const getCategoryBg = (cat: string) => {
								switch (cat) {
									case 'Solving': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
									case 'Streak': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
									case 'Performance': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
									case 'Challenge': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
									default: return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
								}
							};

							return (
								<Card
									key={achievement.id}
									className={`p-5 bg-card/60 backdrop-blur-xl border rounded-2xl shadow-sm transition-all ${
										isUnlocked ? 'border-border/80 hover:border-primary/40' : 'border-border/40 opacity-60'
									}`}
								>
									<div className="flex items-start gap-4">
										<div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shrink-0 ${getCategoryBg(achievement.category)}`}>
											<IconComponent className="w-7 h-7" />
										</div>
										<div className="space-y-1 flex-1">
											<div className="flex items-center justify-between gap-2">
												<h4 className="text-foreground font-bold text-sm">{achievement.title}</h4>
												{isUnlocked ? (
													<Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-[10px] px-1.5 py-0">Unlocked</Badge>
												) : (
													<Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0">Locked</Badge>
												)}
											</div>
											<p className="text-muted-foreground text-xs leading-relaxed">{achievement.desc}</p>
											<div className="pt-2 space-y-1">
												<div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
													<div
														className={`h-full rounded-full transition-all ${isUnlocked ? 'bg-emerald-500' : 'bg-primary/50'}`}
														style={{ width: `${Math.min(100, (achievement.progress / achievement.max_progress) * 100)}%` }}
													/>
												</div>
												<div className="flex justify-between text-[10px] text-muted-foreground font-mono">
													<span>Progress</span>
													<span>{achievement.progress} / {achievement.max_progress}</span>
												</div>
											</div>
										</div>
									</div>
								</Card>
							);
						})}
					</div>
				</TabsContent>

				{/* TAB 3: Skills & Languages */}
				<TabsContent value="skills" className="space-y-4">
					<Card className="p-6 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm space-y-6">
						<div>
							<h3 className="text-foreground font-bold text-lg mb-1">Developer Skills & Languages</h3>
							<p className="text-muted-foreground text-xs">Based on programming languages used in code submissions.</p>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{skillsList.map((skill) => (
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

						{dynamicActivity.length === 0 ? (
							<div className="p-6 text-center text-muted-foreground text-xs font-medium">
								No activity logged yet.
							</div>
						) : (
							<div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
								{dynamicActivity.map((act) => (
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
						)}
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

			{/* Delete Post Confirmation Popup Modal */}
			<AlertDialog open={Boolean(deletingPostId)} onOpenChange={(open) => !open && setDeletingPostId(null)}>
				<AlertDialogContent className="bg-card border border-border/80 sm:max-w-md rounded-2xl shadow-xl">
					<AlertDialogHeader>
						<AlertDialogTitle className="text-foreground font-bold text-lg flex items-center gap-2">
							<Trash2 className="w-5 h-5 text-rose-500" />
							<span>Confirm Delete Post</span>
						</AlertDialogTitle>
						<AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed pt-1">
							Are you sure you want to delete this post? This action cannot be undone and the post will be permanently removed from your profile and community feed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter className="gap-2 sm:gap-2 border-t border-border/60 pt-3 mt-2 flex-row justify-end">
						<AlertDialogCancel
							disabled={isDeletingPost}
							className="rounded-xl text-xs font-semibold hover:bg-accent border-border cursor-pointer m-0"
						>
							Cancel
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault();
								handleConfirmDeletePost();
							}}
							disabled={isDeletingPost}
							className="rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer m-0"
						>
							{isDeletingPost ? (
								<>
									<Loader2 className="w-3.5 h-3.5 animate-spin" />
									<span>Deleting...</span>
								</>
							) : (
								<>
									<Trash2 className="w-3.5 h-3.5" />
									<span>Delete Post</span>
								</>
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

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
							disabled={isUpdatingPost || isPostContentEmpty(editContent)}
							onClick={handleSaveEditPost}
							className="rounded-xl h-9 px-5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 font-semibold cursor-pointer"
						>
							{isUpdatingPost ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
							<span>Save Changes</span>
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
									<AvatarImage src={profile?.avatar_url || currentUser?.avatar_url} />
									<AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
										{getInitials(displayName)}
									</AvatarFallback>
								</Avatar>
								<div>
									<h4 className="text-sm font-bold text-foreground">{displayName}</h4>
									<p className="text-[11px] text-muted-foreground">{displayTitle}</p>
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
									achievements={myAchievements}
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
										<div className="flex items-center gap-1.5 shrink-0">
											<span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
											<span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
											<span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
										</div>

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

								<div className="flex bg-[#1e1e1e] relative h-[200px] overflow-hidden">
									<div className="bg-[#1e1e1e] border-r border-[#2d2d2d] py-3 px-2 text-right text-[11px] text-gray-600 font-mono select-none w-10 shrink-0 space-y-[2px]">
										{Array.from({ length: Math.max(1, codeText.split('\n').length) }).map((_, i) => (
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
												__html: (highlightCodeToHtml(codeText) || '<span class="text-gray-600">// Write or paste your algorithm code here...</span>') + '\n'
											}} />
										</pre>

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
											spellCheck={false}
											className="relative z-10 w-full h-full p-3 bg-transparent text-transparent caret-white text-xs font-mono focus:outline-none resize-none leading-5 overflow-y-auto whitespace-pre border-0"
											style={{ tabSize: 4 }}
										/>
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
							className="rounded-xl h-9 px-5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm cursor-pointer"
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