import { MapPin, Calendar, Link as LinkIcon, Award, BookOpen, Code2, Trophy, Star, Users, UserPlus } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Screen } from '../App';

interface UserProfileProps {
  navigateTo: (screen: Screen) => void;
}

export function UserProfile({ navigateTo }: UserProfileProps) {
  const achievements = [
    { id: 1, title: '100 Day Streak', icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50' },
    { id: 2, title: 'Fast Learner', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' },
    { id: 3, title: 'Problem Solver', icon: Code2, color: 'text-blue-500', bg: 'bg-blue-50' },
    { id: 4, title: 'Course Completionist', icon: Award, color: 'text-green-500', bg: 'bg-green-50' }
  ];

  const courses = [
    {
      id: 1,
      title: 'Complete React Developer Course',
      instructor: 'John Smith',
      progress: 85,
      image: 'https://images.unsplash.com/photo-1587037325379-0b8807b41f23?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NjI3NTU3NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 2,
      title: 'Advanced TypeScript Patterns',
      instructor: 'Sarah Chen',
      progress: 60,
      image: 'https://images.unsplash.com/photo-1566915896913-549d796d2166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMHdvcmtzcGFjZSUyMGRldmVsb3BlcnxlbnwxfHx8fDE3NjI3Mzg0MzV8MA&ixlib=rb-4.1.0&q=80&w=1080'
    },
    {
      id: 3,
      title: 'System Design Fundamentals',
      instructor: 'Ahmed Hassan',
      progress: 40,
      image: 'https://images.unsplash.com/photo-1675495277087-10598bf7bcd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2RlJTIwYWxnb3JpdGhtJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjI3NTU3NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080'
    }
  ];

  const problemStats = [
    { label: 'Easy', count: 45, total: 100, color: 'bg-green-500' },
    { label: 'Medium', count: 32, total: 150, color: 'bg-amber-500' },
    { label: 'Hard', count: 10, total: 80, color: 'bg-red-500' }
  ];

  const recentActivity = [
    { id: 1, type: 'problem', title: 'Solved: Two Sum', time: '2 hours ago' },
    { id: 2, type: 'course', title: 'Completed: React Hooks Module', time: '5 hours ago' },
    { id: 3, type: 'achievement', title: 'Earned: Fast Learner Badge', time: '1 day ago' },
    { id: 4, type: 'problem', title: 'Solved: Binary Tree Traversal', time: '2 days ago' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Profile Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#1A237E] to-[#283593]"></div>
        <div className="px-8 pb-8">
          <div className="flex items-end justify-between -mt-16 mb-6">
            <div className="flex items-end gap-6">
              <Avatar className="w-32 h-32 border-4 border-white">
                <AvatarFallback className="bg-[#1A237E] text-white text-3xl">JD</AvatarFallback>
              </Avatar>
              <div className="mb-2">
                <h1 className="text-gray-900 mb-1">John Doe</h1>
                <p className="text-gray-600 mb-2">Full Stack Developer | Lifelong Learner</p>
                <div className="flex items-center gap-4 text-gray-500 text-sm">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>San Francisco, CA</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined March 2023</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" />
                    <span className="text-[#00BCD4]">johndoe.dev</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="outline" className="gap-2">
                <Users className="w-4 h-4" />
                342 Followers
              </Button>
              <Button className="bg-[#00BCD4] hover:bg-[#00ACC1] text-white gap-2">
                <UserPlus className="w-4 h-4" />
                Follow
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <span className="text-2xl text-gray-900">12</span>
              </div>
              <p className="text-gray-600 text-sm">Courses Completed</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Code2 className="w-6 h-6 text-green-600" />
                <span className="text-2xl text-gray-900">87</span>
              </div>
              <p className="text-gray-600 text-sm">Problems Solved</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-purple-600" />
                <span className="text-2xl text-gray-900">15</span>
              </div>
              <p className="text-gray-600 text-sm">Achievements</p>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="w-6 h-6 text-amber-600" />
                <span className="text-2xl text-gray-900">47</span>
              </div>
              <p className="text-gray-600 text-sm">Day Streak</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="bg-white border border-gray-200">
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="problems">Problems</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="aspect-video overflow-hidden">
                  <ImageWithFallback
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-gray-900 mb-2">{course.title}</h3>
                  <p className="text-gray-500 text-sm mb-4">by {course.instructor}</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-[#1A237E]">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-[#00BCD4] h-2 rounded-full transition-all"
                        style={{ width: `${course.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="problems" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {problemStats.map((stat) => (
              <Card key={stat.label} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-900">{stat.label}</h3>
                  <Badge className={stat.color}>{stat.count}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`${stat.color} h-3 rounded-full transition-all`}
                      style={{ width: `${(stat.count / stat.total) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-gray-500 text-sm">{stat.count} of {stat.total} solved</p>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Recent Submissions</h3>
            <div className="space-y-3">
              {[
                { problem: 'Two Sum', difficulty: 'Easy', status: 'Accepted', time: '2h ago' },
                { problem: 'Binary Tree Traversal', difficulty: 'Medium', status: 'Accepted', time: '5h ago' },
                { problem: 'Longest Substring', difficulty: 'Medium', status: 'Accepted', time: '1d ago' },
                { problem: 'Merge K Sorted Lists', difficulty: 'Hard', status: 'Accepted', time: '2d ago' }
              ].map((submission, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <Badge variant={
                      submission.difficulty === 'Easy' ? 'default' : 
                      submission.difficulty === 'Medium' ? 'secondary' : 
                      'destructive'
                    } className={
                      submission.difficulty === 'Easy' ? 'bg-green-500' : 
                      submission.difficulty === 'Medium' ? 'bg-amber-500' : 
                      'bg-red-500'
                    }>
                      {submission.difficulty}
                    </Badge>
                    <span className="text-gray-900">{submission.problem}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-green-500">{submission.status}</Badge>
                    <span className="text-gray-500 text-sm">{submission.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-4 gap-6">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className={`w-16 h-16 ${achievement.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <achievement.icon className={`w-8 h-8 ${achievement.color}`} />
                </div>
                <h3 className="text-gray-900">{achievement.title}</h3>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'problem' ? 'bg-blue-100' :
                    activity.type === 'course' ? 'bg-green-100' :
                    'bg-purple-100'
                  }`}>
                    {activity.type === 'problem' ? (
                      <Code2 className="w-5 h-5 text-blue-500" />
                    ) : activity.type === 'course' ? (
                      <BookOpen className="w-5 h-5 text-green-500" />
                    ) : (
                      <Award className="w-5 h-5 text-purple-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">{activity.title}</p>
                    <p className="text-gray-500 text-sm">{activity.time}</p>
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
