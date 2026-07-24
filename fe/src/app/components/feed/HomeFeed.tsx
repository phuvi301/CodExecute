import { ThumbsUp, MessageCircle, Share2, Bookmark, TrendingUp, Award, Users } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { useNavigate } from 'react-router-dom';

export function HomeFeed() {
	const navigate = useNavigate();
	const posts = [
		{
			id: 1,
			author: 'Sarah Chen',
			avatar: 'SC',
			role: 'Senior Developer',
			time: '2 hours ago',
			content: 'Just completed the Advanced Data Structures course! The tree traversal section was particularly enlightening. Highly recommend for anyone preparing for technical interviews.',
			type: 'course-update',
			courseTitle: 'Advanced Data Structures & Algorithms',
			likes: 45,
			comments: 12,
			shares: 5
		},
		{
			id: 2,
			author: 'Ahmed Hassan',
			avatar: 'AH',
			role: 'Instructor',
			time: '4 hours ago',
			content: 'New course alert! 🚀 I\'m excited to announce my new course on System Design. We\'ll cover scalability, microservices, and real-world architecture patterns. Early bird discount available!',
			type: 'announcement',
			image: 'https://images.unsplash.com/photo-1587037325379-0b8807b41f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NjI3NTU3NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080',
			likes: 128,
			comments: 34,
			shares: 18
		},
		{
			id: 3,
			author: 'Maria Rodriguez',
			avatar: 'MR',
			role: 'Problem Solver',
			time: '6 hours ago',
			content: 'Solved my 100th problem today! 🎉 The key to mastering algorithms is consistency. Keep grinding, everyone!',
			type: 'achievement',
			achievement: '100 Problems Solved',
			likes: 89,
			comments: 23,
			shares: 7
		}
	];

	const suggestedCourses = [
		{ id: 1, title: 'React Advanced Patterns', instructor: 'John Doe', students: 1234, rating: 4.8 },
		{ id: 2, title: 'System Design Masterclass', instructor: 'Ahmed Hassan', students: 892, rating: 4.9 },
		{ id: 3, title: 'Python for Data Science', instructor: 'Emma Wilson', students: 2156, rating: 4.7 }
	];

	return (
		<div className="max-w-7xl mx-auto px-6 py-8">
			<div className="grid grid-cols-12 gap-6">
				<div className="col-span-3 space-y-4">
					<Card className="p-6">
						<div className="flex flex-col items-center text-center">
							<Avatar className="w-20 h-20 mb-3">
								<AvatarFallback className="bg-[#1A237E] text-white text-xl">JD</AvatarFallback>
							</Avatar>
							<h3 className="text-gray-900 dark:text-white mb-1">John Doe</h3>
							<p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Full Stack Developer</p>
							<Button
								variant="outline"
								className="w-full border-[#1A237E] dark:border-[#00BCD4] text-[#1A237E] dark:text-[#00BCD4] hover:bg-[#1A237E] dark:hover:bg-[#00BCD4] hover:text-white dark:hover:text-gray-900"
								onClick={() => navigate('/profile/john-doe')}
							>
								View Profile
							</Button>
						</div>
						<div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between mb-3">
								<span className="text-gray-600 dark:text-gray-400 text-sm">Courses Completed</span>
								<span className="text-[#1A237E] dark:text-[#00BCD4]">12</span>
							</div>
							<div className="flex items-center justify-between mb-3">
								<span className="text-gray-600 dark:text-gray-400 text-sm">Problems Solved</span>
								<span className="text-[#1A237E] dark:text-[#00BCD4]">87</span>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-gray-600 dark:text-gray-400 text-sm">Followers</span>
								<span className="text-[#1A237E] dark:text-[#00BCD4]">342</span>
							</div>
						</div>
					</Card>

					<Card className="p-6">
						<h3 className="text-gray-900 dark:text-white mb-4">Quick Links</h3>
						<div className="space-y-2">
							<button onClick={() => navigate('/problems')} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
								<TrendingUp className="w-5 h-5 text-[#00BCD4]" />
								<span className="text-gray-700 dark:text-gray-300">Daily Challenge</span>
							</button>
							<button onClick={() => navigate('/groups')} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
								<Users className="w-5 h-5 text-[#00BCD4]" />
								<span className="text-gray-700 dark:text-gray-300">My Groups</span>
							</button>
							<button className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-left transition-colors">
								<Award className="w-5 h-5 text-[#00BCD4]" />
								<span className="text-gray-700 dark:text-gray-300">Achievements</span>
							</button>
						</div>
					</Card>
				</div>

				<div className="col-span-6 space-y-4">
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<Avatar>
								<AvatarFallback className="bg-[#1A237E] dark:bg-[#00BCD4] text-white dark:text-gray-900">JD</AvatarFallback>
							</Avatar>
							<input type="text" placeholder="Share your progress, ask a question..." className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 focus:outline-none focus:border-[#00BCD4] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400" />
						</div>
					</Card>

					{posts.map((post) => (
						<Card key={post.id} className="overflow-hidden">
							<div className="p-6">
								<div className="flex items-start justify-between mb-4">
									<div className="flex items-start gap-3">
										<Avatar className="cursor-pointer" onClick={() => navigate('/profile/john-doe')}>
											<AvatarFallback className="bg-[#1A237E] dark:bg-[#00BCD4] text-white dark:text-gray-900">{post.avatar}</AvatarFallback>
										</Avatar>
										<div>
											<h4 className="text-gray-900 dark:text-white cursor-pointer hover:text-[#1A237E] dark:hover:text-[#00BCD4]" onClick={() => navigate('/profile/john-doe')}>
												{post.author}
											</h4>
											<p className="text-gray-500 dark:text-gray-400 text-sm">{post.role} • {post.time}</p>
										</div>
									</div>
									<Button variant="ghost" size="icon">
										<Bookmark className="w-5 h-5 text-gray-400 dark:text-gray-500" />
									</Button>
								</div>

								<p className="text-gray-700 dark:text-gray-300 mb-4">{post.content}</p>

								{post.type === 'course-update' && (
									<div className="bg-gradient-to-r from-[#1A237E] to-[#283593] p-4 rounded-lg mb-4">
										<Badge className="bg-[#00BCD4] text-white mb-2">Course Completed</Badge>
										<p className="text-white">{post.courseTitle}</p>
									</div>
								)}

								{post.image && (
									<div className="mb-4 rounded-lg overflow-hidden">
										<ImageWithFallback src={post.image} alt="Post image" className="w-full h-64 object-cover" />
									</div>
								)}

								{post.type === 'achievement' && (
									<div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 rounded-lg mb-4 flex items-center gap-3">
										<Award className="w-8 h-8 text-white" />
										<div>
											<Badge className="bg-white text-orange-500 mb-1">Achievement Unlocked</Badge>
											<p className="text-white">{post.achievement}</p>
										</div>
									</div>
								)}

								<div className="flex items-center gap-1 pt-4 border-t border-gray-100 dark:border-gray-700">
									<Button variant="ghost" className="flex-1 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#00BCD4]">
										<ThumbsUp className="w-5 h-5" />
										<span>{post.likes}</span>
									</Button>
									<Button variant="ghost" className="flex-1 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#00BCD4]">
										<MessageCircle className="w-5 h-5" />
										<span>{post.comments}</span>
									</Button>
									<Button variant="ghost" className="flex-1 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#00BCD4]">
										<Share2 className="w-5 h-5" />
										<span>{post.shares}</span>
									</Button>
								</div>
							</div>
						</Card>
					))}
				</div>

				<div className="col-span-3 space-y-4">
					<Card className="p-6">
						<h3 className="text-gray-900 dark:text-white mb-4">Suggested Courses</h3>
						<div className="space-y-4">
							{suggestedCourses.map((course) => (
								<div key={course.id} className="pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
									<h4 className="text-gray-900 dark:text-white mb-2 hover:text-[#1A237E] dark:hover:text-[#00BCD4] cursor-pointer">{course.title}</h4>
									<p className="text-gray-500 dark:text-gray-400 text-sm mb-2">by {course.instructor}</p>
									<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
										<span>{course.students.toLocaleString()} students</span>
										<span className="text-amber-500">★ {course.rating}</span>
									</div>
								</div>
							))}
						</div>
					</Card>

					<Card className="p-6">
						<h3 className="text-gray-900 dark:text-white mb-4">Trending Topics</h3>
						<div className="flex flex-wrap gap-2">
							{['React', 'System Design', 'Algorithms', 'Python', 'TypeScript', 'AWS'].map((topic) => (
								<Badge key={topic} variant="secondary" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-[#1A237E] dark:hover:bg-[#00BCD4] hover:text-white dark:hover:text-gray-900 cursor-pointer">
									{topic}
								</Badge>
							))}
						</div>
					</Card>
				</div>
			</div>
		</div>
	);
}