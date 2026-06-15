import { ArrowLeft, Users, Bell, BellOff, Settings, ThumbsUp, MessageCircle, Share2, Pin, Image as ImageIcon } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Screen } from '../App';

interface GroupFeedProps {
  navigateTo: (screen: Screen) => void;
}

export function GroupFeed({ navigateTo }: GroupFeedProps) {
  const posts = [
    {
      id: 1,
      author: 'Sarah Chen',
      avatar: 'SC',
      role: 'Admin',
      time: '1 hour ago',
      content: 'Welcome to our new members! 🎉 Please introduce yourself and share what you\'re currently working on or learning. We\'re all here to help each other grow!',
      isPinned: true,
      likes: 45,
      comments: 23,
      shares: 5
    },
    {
      id: 2,
      author: 'Ahmed Hassan',
      avatar: 'AH',
      time: '3 hours ago',
      content: 'Just finished implementing a custom hook for form validation in React. Anyone interested in a code review? Happy to share and get feedback!',
      image: 'https://images.unsplash.com/photo-1566915896913-549d796d2166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMHdvcmtzcGFjZSUyMGRldmVsb3BlcnxlbnwxfHx8fDE3NjI3Mzg0MzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
      likes: 78,
      comments: 34,
      shares: 12
    },
    {
      id: 3,
      author: 'Maria Rodriguez',
      avatar: 'MR',
      time: '5 hours ago',
      content: 'Question: What\'s your preferred state management solution for large-scale React apps? I\'m debating between Redux Toolkit and Zustand for my next project.',
      likes: 56,
      comments: 67,
      shares: 8
    },
    {
      id: 4,
      author: 'David Kim',
      avatar: 'DK',
      time: '8 hours ago',
      content: 'Pro tip: Use React.memo() wisely! Don\'t over-optimize. I spent hours debugging only to find that unnecessary memoization was causing issues. Profile first, optimize second.',
      likes: 92,
      comments: 28,
      shares: 34
    }
  ];

  const members = [
    { name: 'Sarah Chen', avatar: 'SC', role: 'Admin' },
    { name: 'Ahmed Hassan', avatar: 'AH', role: 'Moderator' },
    { name: 'Maria Rodriguez', avatar: 'MR', role: 'Member' },
    { name: 'David Kim', avatar: 'DK', role: 'Member' },
    { name: 'Emma Wilson', avatar: 'EW', role: 'Member' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        className="gap-2 text-gray-600 hover:text-[#1A237E] mb-6"
        onClick={() => navigateTo('groups-discovery')}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Groups
      </Button>

      {/* Group Header */}
      <Card className="mb-6 overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-[#1A237E] to-[#283593] relative">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1566915896913-549d796d2166?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMHdvcmtzcGFjZSUyMGRldmVsb3BlcnxlbnwxfHx8fDE3NjI3Mzg0MzV8MA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Group cover"
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-gray-900 mb-2">React Developers</h1>
              <p className="text-gray-600 mb-4 max-w-2xl">
                A community for React developers to share knowledge, discuss best practices, and help each other solve problems. All skill levels welcome!
              </p>
              <div className="flex items-center gap-6 text-gray-500">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>12,543 members</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Public Group
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Content */}
        <div className="col-span-8 space-y-4">
          {/* Create Post */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarFallback className="bg-[#1A237E] text-white">JD</AvatarFallback>
              </Avatar>
              <input
                type="text"
                placeholder="Share something with the group..."
                className="flex-1 px-4 py-2 bg-gray-50 rounded-full border border-gray-200 focus:outline-none focus:border-[#00BCD4]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
                <ImageIcon className="w-4 h-4" />
                Photo
              </Button>
              <Button variant="ghost" size="sm" className="gap-2 text-gray-600">
                <ImageIcon className="w-4 h-4" />
                Code
              </Button>
            </div>
          </Card>

          {/* Posts */}
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              {post.isPinned && (
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-2 border-b border-amber-200">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Pin className="w-4 h-4" />
                    <span className="text-sm">Pinned by admin</span>
                  </div>
                </div>
              )}
              <div className="p-6">
                {/* Post Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="cursor-pointer" onClick={() => navigateTo('user-profile')}>
                      <AvatarFallback className="bg-[#1A237E] text-white">{post.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-gray-900 cursor-pointer hover:text-[#1A237E]" onClick={() => navigateTo('user-profile')}>
                          {post.author}
                        </h4>
                        {post.role && (
                          <Badge className="bg-[#1A237E] text-xs">{post.role}</Badge>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">{post.time}</p>
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <p className="text-gray-700 mb-4">{post.content}</p>

                {/* Post Image */}
                {post.image && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <ImageWithFallback
                      src={post.image}
                      alt="Post image"
                      className="w-full h-80 object-cover"
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="flex items-center gap-1 pt-4 border-t border-gray-100">
                  <Button variant="ghost" className="flex-1 flex items-center gap-2 text-gray-600 hover:text-[#00BCD4]">
                    <ThumbsUp className="w-5 h-5" />
                    <span>{post.likes}</span>
                  </Button>
                  <Button variant="ghost" className="flex-1 flex items-center gap-2 text-gray-600 hover:text-[#00BCD4]">
                    <MessageCircle className="w-5 h-5" />
                    <span>{post.comments}</span>
                  </Button>
                  <Button variant="ghost" className="flex-1 flex items-center gap-2 text-gray-600 hover:text-[#00BCD4]">
                    <Share2 className="w-5 h-5" />
                    <span>{post.shares}</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Sidebar */}
        <div className="col-span-4 space-y-4">
          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">About</h3>
            <p className="text-gray-600 text-sm mb-4">
              Join discussions about React, share your projects, and learn from experienced developers.
            </p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Created</span>
                <span className="text-gray-900">March 2023</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Posts this week</span>
                <span className="text-gray-900">147</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Privacy</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Public</Badge>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-900">Members</h3>
              <Button variant="ghost" size="sm" className="text-[#00BCD4]">
                See all
              </Button>
            </div>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.name} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors" onClick={() => navigateTo('user-profile')}>
                  <Avatar>
                    <AvatarFallback className="bg-[#1A237E] text-white">{member.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-gray-900 text-sm">{member.name}</p>
                    <p className="text-gray-500 text-xs">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-gray-900 mb-4">Group Rules</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Be respectful and professional</li>
              <li>• No spam or self-promotion</li>
              <li>• Share knowledge and help others</li>
              <li>• Use proper formatting for code</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
