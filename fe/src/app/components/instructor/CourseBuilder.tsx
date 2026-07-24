import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Upload, Video, FileText, HelpCircle, GitBranch, Plus, Trash2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';

interface CourseBuilderProps {
	step: number;
	setStep: (step: number) => void;
}

export function CourseBuilder({ step, setStep }: CourseBuilderProps) {
	const navigate = useNavigate();
	const steps = [
		{ number: 1, title: 'Basic Info', description: 'Course details' },
		{ number: 2, title: 'Content Builder', description: 'Add modules & lessons' },
		{ number: 3, title: 'Publish', description: 'Review & publish' }
	];

	return (
		<div className="max-w-6xl mx-auto px-6 py-8">
			<div className="mb-8"><Button variant="ghost" className="gap-2 text-gray-600 hover:text-[#1A237E] mb-4" onClick={() => navigate('/instructor')}><ArrowLeft className="w-4 h-4" />Back to Dashboard</Button><h1 className="text-gray-900 mb-2">Create New Course</h1><p className="text-gray-600">Follow the steps to create your course</p></div>
			<div className="mb-8"><div className="flex items-center justify-between max-w-3xl mx-auto">{steps.map((s, index) => (<div key={s.number} className="flex items-center flex-1"><div className="flex flex-col items-center flex-1"><div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${step > s.number ? 'bg-green-500 text-white' : step === s.number ? 'bg-[#00BCD4] text-white' : 'bg-gray-200 text-gray-400'}`}>{step > s.number ? <Check className="w-6 h-6" /> : s.number}</div><div className="text-center"><p className={`text-sm mb-1 ${step === s.number ? 'text-[#1A237E]' : 'text-gray-500'}`}>{s.title}</p><p className="text-xs text-gray-400">{s.description}</p></div></div>{index < steps.length - 1 && (<div className={`h-0.5 flex-1 mx-4 mt-[-40px] transition-all ${step > s.number ? 'bg-green-500' : 'bg-gray-200'}`} />)}</div>))}</div></div>
			{step === 1 && <BasicInfoStep />}
			{step === 2 && <ContentBuilderStep />}
			{step === 3 && <PublishStep />}
			<div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200"><Button variant="outline" onClick={() => step > 1 ? setStep(step - 1) : navigate('/instructor')} className="gap-2"><ArrowLeft className="w-4 h-4" />{step > 1 ? 'Previous' : 'Cancel'}</Button><Button className="bg-[#00BCD4] hover:bg-[#00ACC1] text-white gap-2" onClick={() => { if (step < 3) { setStep(step + 1); } else { navigate('/instructor'); } }}>{step < 3 ? 'Next Step' : 'Publish Course'}<ArrowRight className="w-4 h-4" /></Button></div>
		</div>
	);
}

function BasicInfoStep() {
	return (
		<Card className="p-8">
			<h2 className="text-gray-900 mb-6">Course Basic Information</h2>
			<div className="space-y-6">
				<div><Label htmlFor="title">Course Title *</Label><Input id="title" placeholder="e.g., Complete React Developer Course" className="mt-2" defaultValue="" /></div>
				<div><Label htmlFor="subtitle">Subtitle</Label><Input id="subtitle" placeholder="Brief description of what students will learn" className="mt-2" defaultValue="" /></div>
				<div><Label htmlFor="description">Course Description *</Label><Textarea id="description" placeholder="Provide a detailed description of your course..." className="mt-2 min-h-[120px]" defaultValue="" /></div>
				<div className="grid grid-cols-2 gap-6"><div><Label htmlFor="category">Category *</Label><Select defaultValue=""><SelectTrigger className="mt-2"><SelectValue placeholder="Select a category" /></SelectTrigger><SelectContent><SelectItem value="web-dev">Web Development</SelectItem><SelectItem value="mobile-dev">Mobile Development</SelectItem><SelectItem value="data-science">Data Science</SelectItem><SelectItem value="algorithms">Algorithms & Data Structures</SelectItem><SelectItem value="system-design">System Design</SelectItem></SelectContent></Select></div><div><Label htmlFor="level">Difficulty Level *</Label><Select defaultValue=""><SelectTrigger className="mt-2"><SelectValue placeholder="Select difficulty" /></SelectTrigger><SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent></Select></div></div>
				<div className="grid grid-cols-2 gap-6"><div><Label htmlFor="price">Price (USD) *</Label><Input id="price" type="number" placeholder="49.99" className="mt-2" defaultValue="" /></div><div><Label htmlFor="duration">Estimated Duration</Label><Input id="duration" placeholder="e.g., 10 hours" className="mt-2" defaultValue="" /></div></div>
				<div><Label htmlFor="thumbnail">Course Thumbnail</Label><div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#00BCD4] transition-colors cursor-pointer"><Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" /><p className="text-gray-600 mb-1">Click to upload or drag and drop</p><p className="text-gray-400 text-sm">PNG, JPG up to 5MB (Recommended: 1280x720)</p></div></div>
			</div>
		</Card>
	);
}

function ContentBuilderStep() {
	const modules = [{ id: 1, title: 'Introduction to React', lessons: [{ id: 1, title: 'What is React?', type: 'video', duration: '12:30' }, { id: 2, title: 'Setting up your environment', type: 'video', duration: '8:45' }, { id: 3, title: 'Quiz: React Basics', type: 'quiz', questions: 5 }] }];
	return (
		<div className="space-y-6">
			<Card className="p-8"><div className="flex items-center justify-between mb-6"><div><h2 className="text-gray-900 mb-1">Course Content</h2><p className="text-gray-600">Add modules, lessons, and learning materials</p></div><Button className="bg-[#1A237E] hover:bg-[#283593] text-white gap-2"><Plus className="w-4 h-4" />Add Module</Button></div><div className="space-y-4">{modules.map((module) => (<div key={module.id} className="border border-gray-200 rounded-lg"><div className="bg-gray-50 p-4 flex items-center justify-between"><div className="flex items-center gap-3 flex-1"><div className="w-8 h-8 bg-[#1A237E] rounded text-white flex items-center justify-center text-sm">{module.id}</div><Input defaultValue={module.title} className="flex-1 bg-white" /></div><div className="flex items-center gap-2 ml-4"><Button variant="ghost" size="sm" className="text-gray-600"><Trash2 className="w-4 h-4" /></Button></div></div><div className="p-4 space-y-2">{module.lessons.map((lesson) => (<div key={lesson.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"><div className={`w-8 h-8 rounded flex items-center justify-center ${lesson.type === 'video' ? 'bg-blue-100' : 'bg-purple-100'}`}>{lesson.type === 'video' ? <Video className={`w-4 h-4 ${lesson.type === 'video' ? 'text-blue-500' : 'text-purple-500'}`} /> : <HelpCircle className="w-4 h-4 text-purple-500" />}</div><div className="flex-1"><p className="text-gray-900 text-sm">{lesson.title}</p><p className="text-gray-500 text-xs">{lesson.type === 'video' ? lesson.duration : `${lesson.questions} questions`}</p></div><Button variant="ghost" size="sm" className="text-gray-400"><Trash2 className="w-4 h-4" /></Button></div>))}<div className="flex gap-2 pt-2"><Button variant="outline" size="sm" className="flex-1 gap-2"><Video className="w-4 h-4" />Add Video</Button><Button variant="outline" size="sm" className="flex-1 gap-2"><FileText className="w-4 h-4" />Add Article</Button><Button variant="outline" size="sm" className="flex-1 gap-2"><HelpCircle className="w-4 h-4" />Add Quiz</Button><Button variant="outline" size="sm" className="flex-1 gap-2"><GitBranch className="w-4 h-4" />Add Project</Button></div></div></div>))}</div></Card>
			<Card className="p-6 bg-gradient-to-r from-[#1A237E] to-[#283593] text-white"><div className="flex items-start gap-4"><div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0"><GitBranch className="w-6 h-6" /></div><div><h3 className="mb-2">Git Repository Integration</h3><p className="text-white/90 text-sm mb-4">Add a practical coding project by connecting a Git repository. Students can fork, clone, and submit their work.</p><Input placeholder="https://github.com/username/repository" className="bg-white/10 border-white/20 text-white placeholder:text-white/50" defaultValue="" /></div></div></Card>
		</div>
	);
}

function PublishStep() {
	return (
		<Card className="p-8"><h2 className="text-gray-900 mb-6">Review & Publish</h2><div className="space-y-6"><div className="bg-green-50 border border-green-200 rounded-lg p-6"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center"><Check className="w-6 h-6 text-white" /></div><div><h3 className="text-green-900">Course Ready for Review</h3><p className="text-green-700 text-sm">All required fields have been completed</p></div></div></div><div className="grid grid-cols-2 gap-6"><div><Label className="text-gray-600">Course Title</Label><p className="text-gray-900 mt-1">Complete React Developer Course</p></div><div><Label className="text-gray-600">Category</Label><p className="text-gray-900 mt-1">Web Development</p></div><div><Label className="text-gray-600">Price</Label><p className="text-gray-900 mt-1">$49.99</p></div><div><Label className="text-gray-600">Difficulty</Label><p className="text-gray-900 mt-1">Intermediate</p></div></div></div></Card>
	);
}