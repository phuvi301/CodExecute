import { useState, FormEvent, useEffect, useRef, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Mail,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Upload,
  Trash2,
  Camera,
  Image as ImageIcon,
  Briefcase,
  MapPin,
  FileText,
  ChevronDown,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Dialog, DialogContent } from '../../components/ui/dialog';

const JOB_TITLE_SUGGESTIONS = [
  'Full Stack Engineer',
  'Frontend Developer',
  'Backend Engineer',
  'Software Engineer',
  'DevOps & Cloud Engineer',
  'Data Engineer & Scientist',
  'AI / Machine Learning Engineer',
  'Mobile Developer (iOS / Android)',
  'Competitive Programmer',
  'System Architect',
  'Security & Cyber Security Engineer',
  'Computer Science Student',
  'UI/UX Developer'
];

const ADDRESS_SUGGESTIONS = [
  'Ho Chi Minh City, Vietnam',
  'Hanoi, Vietnam',
  'Da Nang, Vietnam',
  'Can Tho, Vietnam',
  'Hai Phong, Vietnam',
  'San Francisco, CA, USA',
  'New York, NY, USA',
  'Seattle, WA, USA',
  'London, United Kingdom',
  'Singapore',
  'Tokyo, Japan',
  'Seoul, South Korea',
  'Sydney, Australia',
  'Berlin, Germany',
  'Toronto, Canada'
];

export function EditProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile, uploadAvatar } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Dropdown Autocomplete state
  const [showTitleDropdown, setShowTitleDropdown] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);

  const titleRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const displayName = user?.full_name || 'User';
  const displayEmail = user?.email || 'user@codexecute.dev';

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setAvatarUrl(user.avatar_url || '');
      setTitle(user.title || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (titleRef.current && !titleRef.current.contains(event.target as Node)) {
        setShowTitleDropdown(false);
      }
      if (addressRef.current && !addressRef.current.contains(event.target as Node)) {
        setShowAddressDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showSuccessModal) {
      const timer = setTimeout(() => {
        navigate('/profile');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessModal, navigate]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError(null);
    setIsUploadingAvatar(true);
    try {
      const res = await uploadAvatar(file);
      setAvatarUrl(res.avatar_url);
    } catch (err: any) {
      setError(err.message || 'Failed to upload avatar');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredTitles = JOB_TITLE_SUGGESTIONS.filter(item =>
    item.toLowerCase().includes(title.toLowerCase())
  );

  const filteredAddresses = ADDRESS_SUGGESTIONS.filter(item =>
    item.toLowerCase().includes(address.toLowerCase())
  );

  const validatePasswordStrength = (pass: string) => {
    if (pass.length < 8) return 'New password must be at least 8 characters';
    if (!/[A-Z]/.test(pass)) return 'New password must contain at least 1 uppercase letter';
    if (!/[0-9]/.test(pass)) return 'New password must contain at least 1 number';
    if (!/[!@#$%^&*(),.?":{}|<>_\-\=\+\[\]\\\/]/.test(pass)) return 'New password must contain at least 1 special character (e.g., !@#$%^&*)';
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Full name cannot be empty');
      return;
    }

    if (newPassword || confirmNewPassword) {
      if (!oldPassword.trim()) {
        setError('Please enter your current password to set a new password');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setError('New passwords do not match');
        return;
      }
      const pwdErr = validatePasswordStrength(newPassword);
      if (pwdErr) {
        setError(pwdErr);
        return;
      }
    }

    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName.trim(),
        avatar_url: avatarUrl,
        title: title.trim(),
        address: address.trim(),
        bio: bio.trim(),
        old_password: oldPassword.trim() || undefined,
        new_password: newPassword || undefined,
      });

      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account information, avatar, developer headline, address, and security preferences.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Avatar & Public Info Card */}
        <Card className="border-border/80 shadow-md">
          <CardHeader className="pb-4 border-b border-border/60">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-primary" />
              Public Information & Avatar
            </CardTitle>
            <CardDescription>
              Your profile picture, headline, address, and bio displayed across CodExecute.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-8">
            {/* Avatar Uploader Section */}
            <div className="space-y-4">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-muted-foreground" />
                Profile Picture
              </Label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 rounded-2xl bg-muted/40 border border-border/60">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Change Avatar"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2 cursor-pointer"
                    >
                      {isUploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-primary" />
                          Upload Photo
                        </>
                      )}
                    </Button>

                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAvatarUrl('')}
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Photo
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supports JPG, PNG, WebP or GIF (max 2MB).
                  </p>
                </div>
              </div>

              {/* Direct Image URL input */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="avatar-url" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" />
                  Or paste Image URL
                </Label>
                <Input
                  id="avatar-url"
                  type="url"
                  placeholder="https://example.com/my-photo.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  disabled={isSaving}
                  className="text-xs"
                />
              </div>
            </div>

            {/* Profile Fields Grid */}
            <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-border/40">
              <div className="space-y-2">
                <Label htmlFor="full-name" className="text-sm font-medium flex items-center gap-1.5">
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input
                  id="full-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSaving}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={displayEmail}
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">Email is managed by server security and cannot be changed.</p>
              </div>

              {/* Job Title Autocomplete Dropdown */}
              <div className="space-y-2 relative" ref={titleRef}>
                <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  Job Title / Headline
                </Label>
                <div className="relative">
                  <Input
                    id="title"
                    type="text"
                    placeholder="Type or select a Job Title..."
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setShowTitleDropdown(true);
                    }}
                    onFocus={() => setShowTitleDropdown(true)}
                    disabled={isSaving}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTitleDropdown(!showTitleDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Title Suggestions Dropdown */}
                {showTitleDropdown && (
                  <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-card/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2.5 py-1 tracking-wider">
                      Suggested Job Titles
                    </p>
                    {filteredTitles.length > 0 ? (
                      filteredTitles.map((suggestion) => (
                        <div
                          key={suggestion}
                          onClick={() => {
                            setTitle(suggestion);
                            setShowTitleDropdown(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                            title === suggestion
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          <span>{suggestion}</span>
                          {title === suggestion && <Check className="w-3.5 h-3.5 text-primary" />}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-muted-foreground italic">
                        No preset matches. Your custom title will be saved.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Location / Address Autocomplete Dropdown */}
              <div className="space-y-2 relative" ref={addressRef}>
                <Label htmlFor="address" className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  Location / Address
                </Label>
                <div className="relative">
                  <Input
                    id="address"
                    type="text"
                    placeholder="Type or select a Location..."
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setShowAddressDropdown(true);
                    }}
                    onFocus={() => setShowAddressDropdown(true)}
                    disabled={isSaving}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddressDropdown(!showAddressDropdown)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Address Suggestions Dropdown */}
                {showAddressDropdown && (
                  <div className="absolute z-30 left-0 right-0 top-full mt-1.5 bg-card/95 backdrop-blur-xl border border-border/80 rounded-xl shadow-2xl max-h-56 overflow-y-auto p-1.5 space-y-0.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase px-2.5 py-1 tracking-wider">
                      Suggested Cities & Locations
                    </p>
                    {filteredAddresses.length > 0 ? (
                      filteredAddresses.map((suggestion) => (
                        <div
                          key={suggestion}
                          onClick={() => {
                            setAddress(suggestion);
                            setShowAddressDropdown(false);
                          }}
                          className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                            address === suggestion
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-foreground hover:bg-accent'
                          }`}
                        >
                          <span>{suggestion}</span>
                          {address === suggestion && <Check className="w-3.5 h-3.5 text-primary" />}
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-xs text-muted-foreground italic">
                        No preset matches. Your custom location will be saved.
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bio" className="text-sm font-medium flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  Short Bio
                </Label>
                <Input
                  id="bio"
                  type="text"
                  placeholder="Brief introduction about yourself"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Password Card */}
        <Card className="border-border/80 shadow-md">
          <CardHeader className="pb-4 border-b border-border/60">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Security & Authentication
            </CardTitle>
            <CardDescription>
              Provide current password only when updating your account password.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-2 max-w-md">
              <Label htmlFor="old-password" className="text-sm font-medium flex items-center justify-between">
                <span>Current Password</span>
                <span className="text-xs text-muted-foreground font-normal">Required if changing password</span>
              </Label>
              <Input
                id="old-password"
                type="password"
                placeholder="Enter current password (required if setting new password)"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="pt-4 border-t border-border/60 space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Change Password (Optional)
                </p>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters, with 1 uppercase letter, 1 number, and 1 special symbol (!@#$%^&*).
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 max-w-2xl">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="At least 8 chars, 1 uppercase, 1 number, 1 special symbol"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/profile')}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 min-w-[140px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Error Notification Modal Popup */}
      <Dialog open={!!error} onOpenChange={(open) => !open && setError(null)}>
        <DialogContent className="sm:max-w-md text-center p-6 space-y-4 rounded-2xl border-border bg-card shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-8 ring-destructive/10">
            <AlertCircle className="h-10 w-10" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">Action Could Not Be Saved</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{error}</p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => setError(null)}
              className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground font-medium py-2.5 rounded-xl cursor-pointer"
            >
              Dismiss & Try Again
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Notification Modal Popup */}
      <Dialog
        open={showSuccessModal}
        onOpenChange={(open) => {
          setShowSuccessModal(open);
          if (!open) {
            navigate('/profile');
          }
        }}
      >
        <DialogContent className="sm:max-w-md text-center p-6 space-y-4 rounded-2xl border-border bg-card shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">Profile Updated Successfully!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your account details, headline, address, and credentials have been saved to the database.
            </p>
          </div>
          <div className="pt-2">
            <Button
              onClick={() => navigate('/profile')}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2.5 rounded-xl cursor-pointer"
            >
              Go to Profile Now
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
