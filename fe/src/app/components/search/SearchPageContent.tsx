import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Code2, Users, Search as SearchIcon, ArrowRight, UserPlus, UserCheck, Loader2, BookOpen } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { searchApi, followUserApi, unfollowUserApi, SearchProblemItem, SearchUserItem } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function SearchPageContent() {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { user: currentUser } = useAuth();
	const query = searchParams.get('q') || '';

	const [problems, setProblems] = useState<SearchProblemItem[]>([]);
	const [users, setUsers] = useState<SearchUserItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<'all' | 'problems' | 'users'>('all');
	const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});

	useEffect(() => {
		let isMounted = true;
		if (!query.trim()) {
			setProblems([]);
			setUsers([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		setError(null);

		searchApi(query)
			.then((data) => {
				if (isMounted) {
					setProblems(data.problems || []);
					setUsers(data.users || []);
					setLoading(false);
				}
			})
			.catch((err) => {
				if (isMounted) {
					console.error('Search error:', err);
					setError(err.message || 'Lỗi khi tải kết quả tìm kiếm');
					setLoading(false);
				}
			});

		return () => {
			isMounted = false;
		};
	}, [query]);

	const handleToggleFollow = async (userItem: SearchUserItem) => {
		const targetId = userItem.user_id;
		setFollowLoadingMap((prev) => ({ ...prev, [targetId]: true }));
		try {
			if (userItem.is_following) {
				await unfollowUserApi(targetId);
				setUsers((prev) =>
					prev.map((u) =>
						u.user_id === targetId
							? {
									...u,
									is_following: false,
									followers_count: Math.max(0, (u.followers_count || 1) - 1),
							  }
							: u
					)
				);
			} else {
				await followUserApi(targetId);
				setUsers((prev) =>
					prev.map((u) =>
						u.user_id === targetId
							? {
									...u,
									is_following: true,
									followers_count: (u.followers_count || 0) + 1,
							  }
							: u
					)
				);
			}
		} catch (err: any) {
			console.error('Follow error:', err);
		} finally {
			setFollowLoadingMap((prev) => ({ ...prev, [targetId]: false }));
		}
	};

	const getInitials = (name?: string) => {
		if (!name) return 'U';
		const parts = name.trim().split(' ');
		if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
		return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
	};

	const totalCount = problems.length + users.length;

	return (
		<div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
			{/* Page Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
				<div>
					<div className="flex items-center gap-2 text-muted-foreground text-sm font-medium mb-1">
						<SearchIcon className="w-4 h-4 text-primary" />
						<span>Search Results</span>
					</div>
					<h1 className="text-3xl font-bold tracking-tight text-foreground">
						{query ? (
							<>
								Results for <span className="text-primary">"{query}"</span>
							</>
						) : (
							'Search CodExecute'
						)}
					</h1>
				</div>

				{/* Filter Tabs */}
				<div className="flex items-center gap-2 bg-muted/60 p-1 rounded-xl border border-border/60 w-fit">
					<button
						onClick={() => setActiveTab('all')}
						className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
							activeTab === 'all'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						All ({totalCount})
					</button>
					<button
						onClick={() => setActiveTab('problems')}
						className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
							activeTab === 'problems'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						<Code2 className="w-3.5 h-3.5" />
						<span>Problems ({problems.length})</span>
					</button>
					<button
						onClick={() => setActiveTab('users')}
						className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
							activeTab === 'users'
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'
						}`}
					>
						<Users className="w-3.5 h-3.5" />
						<span>Users ({users.length})</span>
					</button>
				</div>
			</div>

			{/* Loading State */}
			{loading && (
				<div className="flex flex-col items-center justify-center py-16 space-y-4">
					<Loader2 className="w-8 h-8 text-primary animate-spin" />
					<p className="text-sm text-muted-foreground">Searching for "{query}"...</p>
				</div>
			)}

			{/* Error State */}
			{!loading && error && (
				<div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
					{error}
				</div>
			)}

			{/* Empty Query / Empty Results */}
			{!loading && !error && (!query.trim() || totalCount === 0) && (
				<div className="flex flex-col items-center justify-center py-20 text-center space-y-4 max-w-md mx-auto">
					<div className="w-16 h-16 rounded-2xl bg-muted/80 flex items-center justify-center text-muted-foreground border border-border/80 shadow-inner">
						<SearchIcon className="w-8 h-8" />
					</div>
					<div>
						<h3 className="text-lg font-bold text-foreground">
							{!query.trim() ? 'Enter a search term' : `No results found for "${query}"`}
						</h3>
						<p className="text-sm text-muted-foreground mt-1">
							{!query.trim()
								? 'Search for coding problems by title or developers by username.'
								: 'Try searching with different keywords, problem titles, or user names.'}
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => navigate('/problems')}
						className="gap-2 rounded-xl text-xs"
					>
						<BookOpen className="w-4 h-4" />
						<span>Browse Problems</span>
					</Button>
				</div>
			)}

			{/* Results View */}
			{!loading && !error && totalCount > 0 && (
				<div className="space-y-10">
					{/* SECTION 1: PROBLEMS */}
					{(activeTab === 'all' || activeTab === 'problems') && (
						<section className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
										<Code2 className="w-5 h-5" />
									</div>
									<h2 className="text-xl font-bold text-foreground tracking-tight">Problems</h2>
									<Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
										{problems.length}
									</Badge>
								</div>
							</div>

							{problems.length === 0 ? (
								<p className="text-sm text-muted-foreground italic py-4">No matching problems found.</p>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{problems.map((prob) => (
										<Card
											key={prob.id}
											onClick={() => navigate(`/problems/${prob.id}`)}
											className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
										>
											<div className="space-y-2">
												<div className="flex items-start justify-between gap-3">
													<h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
														{prob.title}
													</h3>
													<Badge
														variant="outline"
														className={`shrink-0 text-xs px-2.5 py-0.5 font-medium border ${
															prob.difficulty === 'Easy'
																? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
																: prob.difficulty === 'Medium'
																? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
																: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
														}`}
													>
														{prob.difficulty}
													</Badge>
												</div>
												{prob.description && (
													<p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
														{prob.description}
													</p>
												)}
											</div>

											<div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40 text-xs text-muted-foreground">
												<span className="font-medium">{prob.category || 'Algorithms'}</span>
												<div className="flex items-center gap-3">
													<span>Acceptance: <strong className="text-foreground font-mono">{prob.acceptance}</strong></span>
													<ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0" />
												</div>
											</div>
										</Card>
									))}
								</div>
							)}
						</section>
					)}

					{/* SECTION 2: USERS */}
					{(activeTab === 'all' || activeTab === 'users') && (
						<section className="space-y-4">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2.5">
									<div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
										<Users className="w-5 h-5" />
									</div>
									<h2 className="text-xl font-bold text-foreground tracking-tight">Users</h2>
									<Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs font-semibold">
										{users.length}
									</Badge>
								</div>
							</div>

							{users.length === 0 ? (
								<p className="text-sm text-muted-foreground italic py-4">No matching users found.</p>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
									{users.map((userItem) => {
										const isSelf = currentUser?.user_id === userItem.user_id || userItem.is_self;
										const isFollowing = userItem.is_following;
										const isBtnLoading = !!followLoadingMap[userItem.user_id];

										return (
											<Card
												key={userItem.user_id}
												className="p-5 bg-card/60 backdrop-blur-xl border border-border/80 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all space-y-4 flex flex-col justify-between"
											>
												<div
													onClick={() => navigate(`/profile/${userItem.user_id}`)}
													className="flex items-start gap-3.5 cursor-pointer group"
												>
													<Avatar className="h-12 w-12 border-2 border-background shadow-sm shrink-0 group-hover:scale-105 transition-transform">
														<AvatarImage src={userItem.avatar_url} alt={userItem.full_name} />
														<AvatarFallback className="bg-primary text-primary-foreground font-semibold text-sm">
															{getInitials(userItem.full_name)}
														</AvatarFallback>
													</Avatar>
													<div className="overflow-hidden space-y-0.5">
														<div className="flex items-center gap-1.5 flex-wrap">
															<h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate">
																{userItem.full_name || 'User'}
															</h3>
															<span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
																{userItem.role || 'user'}
															</span>
														</div>
														<p className="text-xs text-muted-foreground truncate">
															{userItem.title || userItem.email}
														</p>
														{userItem.bio && (
															<p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1">
																{userItem.bio}
															</p>
														)}
													</div>
												</div>

												<div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
													<span className="text-muted-foreground font-medium">
														<strong className="text-foreground">{userItem.followers_count || 0}</strong> followers
													</span>

													{isSelf ? (
														<Button
															variant="outline"
															size="sm"
															onClick={() => navigate(`/profile/${userItem.user_id}`)}
															className="h-8 px-3 text-xs rounded-xl font-medium"
														>
															View Profile
														</Button>
													) : (
														<Button
															variant={isFollowing ? 'outline' : 'default'}
															size="sm"
															disabled={isBtnLoading}
															onClick={() => handleToggleFollow(userItem)}
															className={`h-8 px-3 text-xs rounded-xl font-medium gap-1.5 ${
																isFollowing
																	? 'border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
																	: 'bg-primary text-primary-foreground hover:bg-primary/90'
															}`}
														>
															{isBtnLoading ? (
																<Loader2 className="w-3.5 h-3.5 animate-spin" />
															) : isFollowing ? (
																<>
																	<UserCheck className="w-3.5 h-3.5" />
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
											</Card>
										);
									})}
								</div>
							)}
						</section>
					)}
				</div>
			)}
		</div>
	);
}
