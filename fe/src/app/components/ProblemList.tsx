import { Search, Filter, TrendingUp, CheckCircle, Circle } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Screen } from '../App';

interface ProblemListProps {
  navigateTo: (screen: Screen, options?: { problemId?: string }) => void;
}

export function ProblemList({ navigateTo }: ProblemListProps) {
  const problems = [
    {
      id: '1',
      title: 'Two Sum',
      difficulty: 'Easy',
      acceptance: '48.2%',
      category: 'Array, Hash Table',
      status: 'solved'
    },
    {
      id: '2',
      title: 'Add Two Numbers',
      difficulty: 'Medium',
      acceptance: '38.7%',
      category: 'Linked List, Math',
      status: 'attempted'
    },
    {
      id: '3',
      title: 'Longest Substring Without Repeating Characters',
      difficulty: 'Medium',
      acceptance: '33.5%',
      category: 'String, Sliding Window',
      status: 'solved'
    },
    {
      id: '4',
      title: 'Median of Two Sorted Arrays',
      difficulty: 'Hard',
      acceptance: '35.1%',
      category: 'Array, Binary Search',
      status: null
    },
    {
      id: '5',
      title: 'Longest Palindromic Substring',
      difficulty: 'Medium',
      acceptance: '32.3%',
      category: 'String, Dynamic Programming',
      status: 'solved'
    },
    {
      id: '6',
      title: 'Reverse Integer',
      difficulty: 'Easy',
      acceptance: '26.8%',
      category: 'Math',
      status: null
    },
    {
      id: '7',
      title: 'Regular Expression Matching',
      difficulty: 'Hard',
      acceptance: '27.9%',
      category: 'String, Dynamic Programming',
      status: null
    },
    {
      id: '8',
      title: 'Container With Most Water',
      difficulty: 'Medium',
      acceptance: '52.7%',
      category: 'Array, Two Pointers',
      status: 'attempted'
    },
    {
      id: '9',
      title: 'Integer to Roman',
      difficulty: 'Medium',
      acceptance: '60.1%',
      category: 'Hash Table, Math',
      status: null
    },
    {
      id: '10',
      title: 'Roman to Integer',
      difficulty: 'Easy',
      acceptance: '57.3%',
      category: 'Hash Table, Math',
      status: 'solved'
    },
    {
      id: '11',
      title: 'Valid Parentheses',
      difficulty: 'Easy',
      acceptance: '40.6%',
      category: 'Stack, String',
      status: 'solved'
    },
    {
      id: '12',
      title: 'Merge Two Sorted Lists',
      difficulty: 'Easy',
      acceptance: '61.2%',
      category: 'Linked List',
      status: null
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-500';
      case 'Medium':
        return 'bg-amber-500';
      case 'Hard':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Problem Set</h1>
        <p className="text-gray-600">Practice coding problems and improve your algorithmic thinking</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
          <div className="text-3xl text-gray-900 mb-1">45</div>
          <div className="text-gray-600 text-sm mb-2">Easy Solved</div>
          <div className="w-full bg-green-200 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '45%' }}></div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="text-3xl text-gray-900 mb-1">32</div>
          <div className="text-gray-600 text-sm mb-2">Medium Solved</div>
          <div className="w-full bg-amber-200 rounded-full h-1.5">
            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '21%' }}></div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-red-50 to-red-100">
          <div className="text-3xl text-gray-900 mb-1">10</div>
          <div className="text-gray-600 text-sm mb-2">Hard Solved</div>
          <div className="w-full bg-red-200 rounded-full h-1.5">
            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '12%' }}></div>
          </div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-[#1A237E] to-[#283593] text-white">
          <div className="text-3xl mb-1">87</div>
          <div className="text-white/90 text-sm mb-2">Total Solved</div>
          <div className="w-full bg-white/20 rounded-full h-1.5">
            <div className="bg-[#00BCD4] h-1.5 rounded-full" style={{ width: '26%' }}></div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search problems..."
              className="pl-10"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulty</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-tags">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-tags">All Topics</SelectItem>
              <SelectItem value="array">Array</SelectItem>
              <SelectItem value="string">String</SelectItem>
              <SelectItem value="linked-list">Linked List</SelectItem>
              <SelectItem value="tree">Tree</SelectItem>
              <SelectItem value="graph">Graph</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all-status">
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-status">All Status</SelectItem>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="solved">Solved</SelectItem>
              <SelectItem value="attempted">Attempted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Problems Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-gray-700 text-sm w-12">Status</th>
                <th className="px-6 py-4 text-left text-gray-700 text-sm">Title</th>
                <th className="px-6 py-4 text-left text-gray-700 text-sm">Difficulty</th>
                <th className="px-6 py-4 text-left text-gray-700 text-sm">Category</th>
                <th className="px-6 py-4 text-left text-gray-700 text-sm">Acceptance</th>
                <th className="px-6 py-4 text-left text-gray-700 text-sm w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {problems.map((problem) => (
                <tr 
                  key={problem.id} 
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigateTo('problem-editor', { problemId: problem.id })}
                >
                  <td className="px-6 py-4">
                    {problem.status === 'solved' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : problem.status === 'attempted' ? (
                      <Circle className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-300" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-900 hover:text-[#00BCD4]">{problem.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={getDifficultyColor(problem.difficulty)}>
                      {problem.difficulty}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {problem.category.split(', ').map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{problem.acceptance}</td>
                  <td className="px-6 py-4">
                    <Button 
                      size="sm" 
                      className="bg-[#00BCD4] hover:bg-[#00ACC1] text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('problem-editor', { problemId: problem.id });
                      }}
                    >
                      Solve
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Daily Challenge Banner */}
      <Card className="mt-6 overflow-hidden">
        <div className="bg-gradient-to-r from-[#1A237E] to-[#283593] p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <h3 className="mb-1">Daily Challenge</h3>
                <p className="text-white/90 text-sm">Solve today's problem and earn bonus points!</p>
              </div>
            </div>
            <Button className="bg-[#00BCD4] hover:bg-[#00ACC1] text-white">
              Start Challenge
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
