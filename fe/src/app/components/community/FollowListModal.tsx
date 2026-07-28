import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, UserCheck, Search, Loader2 } from 'lucide-react';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '../ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
	getFollowersApi,
	getFollowingApi,
	followUserApi,
	unfollowUserApi,
	UserProfile
} from '../../services/api';

interface FollowListModalProps {
	isOpen: boolean;
	onClose: () => void;
	userId: string;
	initialTab?: 'followers' | 'following';
	userName?: string;
	followersCount?: number;
	followingCount?: number;
	onFollowChange?: () => void;
}

export function FollowListModal({
	isOpen,
	onClose,
	userId,
	initialTab = 'followers',
	userName = 'User',
	followersCount,
	followingCount,
	onFollowChange
}: FollowListModalProps) {
	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
	const [followersList, setFollowersList] = useState<UserProfile[]>([]);
	const [followingList, setFollowingList] = useState<UserProfile[]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [submittingIds, setSubmittingIds] = useState<Record<string, boolean>>({});

	// Synchronize activeTab when initialTab changes on modal open
	useEffect(() => {
		if (isOpen) {
			setActiveTab(initialTab);
			setSearchQuery('');
		}
	}, [isOpen, initialTab]);

	// Fetch both followers and following lists in parallel on modal open
	useEffect(() => {
		async function fetchBothLists() {
			if (!isOpen || !userId) return;
			setIsLoading(true);
			try {
				const [followersData, followingData] = await Promise.all([
					getFollowersApi(userId),
					getFollowingApi(userId)
				]);
				setFollowersList(followersData);
				setFollowingList(followingData);
			} catch (err) {
				console.error("Failed to load follow lists:", err);
			} finally {
				setIsLoading(false);
			}
		}
		fetchBothLists();
	}, [isOpen, userId]);

	const handleToggleFollow = async (targetUser: UserProfile, e: React.MouseEvent) => {
		e.stopPropagation();
		if (!targetUser.can_follow || submittingIds[targetUser.user_id]) return;

		setSubmittingIds((prev) => ({ ...prev, [targetUser.user_id]: true }));
		try {
			let updated: UserProfile;
			if (targetUser.is_following) {
				updated = await unfollowUserApi(targetUser.user_id);
			} else {
				updated = await followUserApi(targetUser.user_id);
			}

			const updateInList = (list: UserProfile[]) =>
				list.map((u) =>
					u.user_id === targetUser.user_id
						? { ...u, is_following: updated.is_following }
						: u
				);

			setFollowersList((prev) => updateInList(prev));
			setFollowingList((prev) => updateInList(prev));

			if (onFollowChange) {
				onFollowChange();
			}
		} catch (err) {
			console.error("Failed to toggle follow status:", err);
		} finally {
			setSubmittingIds((prev) => ({ ...prev, [targetUser.user_id]: false }));
		}
	};

	const handleUserClick = (targetUserId: string) => {
		onClose();
		navigate(`/profile/${targetUserId}`);
	};

	const currentList = activeTab === 'followers' ? followersList : followingList;

	const filteredUsers = useMemo(() => {
		if (!searchQuery.trim()) return currentList;
		const q = searchQuery.toLowerCase().trim();
		return currentList.filter(
			(u) =>
				u.full_name?.toLowerCase().includes(q) ||
				u.title?.toLowerCase().includes(q) ||
				u.email?.toLowerCase().includes(q)
		);
	}, [currentList, searchQuery]);

	const getInitials = (name: string) => {
		if (!name) return 'U';
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const displayFollowersCount = followersList.length > 0 || !isLoading ? followersList.length : (followersCount ?? 0);
	const displayFollowingCount = followingList.length > 0 || !isLoading ? followingList.length : (followingCount ?? 0);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl p-0 overflow-hidden gap-0">
				{/* Modal Header */}
				<DialogHeader className="p-4 sm:p-5 pb-3 border-b border-border/60">
					<DialogTitle className="sr-only">
						{userName} - Follow Lists
					</DialogTitle>

					{/* Tab Switcher - mr-8 leaves balanced spacing before the top-right exit button */}
					<div className="flex bg-muted/60 p-1 rounded-xl border border-border/40 mr-8">
						<button
							type="button"
							onClick={() => setActiveTab('followers')}
							className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
								activeTab === 'followers'
									? 'bg-card text-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							Followers ({displayFollowersCount})
						</button>
						<button
							type="button"
							onClick={() => setActiveTab('following')}
							className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
								activeTab === 'following'
									? 'bg-card text-foreground shadow-sm'
									: 'text-muted-foreground hover:text-foreground'
							}`}
						>
							Following ({displayFollowingCount})
						</button>
					</div>
				</DialogHeader>

				{/* Search Input Bar */}
				<div className="p-3 border-b border-border/40 bg-accent/20">
					<div className="relative">
						<Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search users..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-9 h-9 text-xs rounded-xl bg-background/70 border-border/60 focus-visible:ring-primary/20"
						/>
					</div>
				</div>

				{/* Content List */}
				<div className="max-h-[360px] min-h-[220px] overflow-y-auto p-3 space-y-2">
					{isLoading ? (
						<div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
							<Loader2 className="w-6 h-6 animate-spin text-primary" />
							<span className="text-xs">Loading users list...</span>
						</div>
					) : filteredUsers.length === 0 ? (
						<div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
							<Users className="w-8 h-8 opacity-40" />
							<span className="text-xs font-medium">
								{searchQuery
									? 'No matching users found'
									: activeTab === 'followers'
									? 'No followers yet'
									: 'Not following anyone yet'}
							</span>
						</div>
					) : (
						filteredUsers.map((u) => (
							<div
								key={u.user_id}
								onClick={() => handleUserClick(u.user_id)}
								className="flex items-center justify-between p-2.5 rounded-xl hover:bg-accent/60 transition-colors border border-transparent hover:border-border/50 cursor-pointer group"
							>
								{/* User Info */}
								<div className="flex items-center gap-3 min-w-0">
									<Avatar className="w-10 h-10 rounded-xl border border-border/60 shrink-0 group-hover:scale-105 transition-transform">
										<AvatarImage src={u.avatar_url} alt={u.full_name} className="object-cover" />
										<AvatarFallback className="bg-primary/10 text-primary text-xs font-bold rounded-xl">
											{getInitials(u.full_name || '')}
										</AvatarFallback>
									</Avatar>

									<div className="min-w-0">
										<div className="flex items-center gap-1.5">
											<h4 className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
												{u.full_name || 'User'}
											</h4>
											{u.role && u.role !== 'user' && (
												<Badge className="bg-primary/10 text-primary text-[9px] px-1.5 py-0 rounded-md uppercase font-bold shrink-0">
													{u.role}
												</Badge>
											)}
										</div>
										<p className="text-[11px] text-muted-foreground truncate">
											{u.title || 'Developer'}
										</p>
									</div>
								</div>

								{/* Follow / Following Action Button */}
								{u.can_follow && (
									<Button
										size="sm"
										variant={u.is_following ? 'secondary' : 'default'}
										disabled={submittingIds[u.user_id]}
										onClick={(e) => handleToggleFollow(u, e)}
										className={`h-8 px-3 text-xs font-semibold rounded-lg gap-1.5 shrink-0 transition-all ${
											u.is_following
												? 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
												: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20'
										}`}
									>
										{submittingIds[u.user_id] ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : u.is_following ? (
											<>
												<UserCheck className="w-3.5 h-3.5 text-emerald-500" />
												<span>Following</span>
											</>
										) : (
											<>
												<UserPlus className="w-3.5 h-3.5" />
												<span>Follow</span>
											</>
										)}
									</Button>
								)}
							</div>
						))
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
