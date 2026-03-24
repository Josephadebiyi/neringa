import { Platform } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

// Platform-specific icon imports
import * as LucideNative from 'lucide-react-native';
import * as LucideWeb from 'lucide-react';

const IconPackage = (Platform.OS === 'web' ? LucideWeb : LucideNative) as any;

// Export all commonly used icons with platform detection
export const Package = (props: LucideProps) => { const Icon = IconPackage.Package; return <Icon {...props} />; };
export const Plane = (props: LucideProps) => { const Icon = IconPackage.Plane; return <Icon {...props} />; };
export const Shield = (props: LucideProps) => { const Icon = IconPackage.Shield; return <Icon {...props} />; };
export const Star = (props: LucideProps) => { const Icon = IconPackage.Star; return <Icon {...props} />; };
export const Home = (props: LucideProps) => { const Icon = IconPackage.Home; return <Icon {...props} />; };
export const Search = (props: LucideProps) => { const Icon = IconPackage.Search; return <Icon {...props} />; };
export const Bell = (props: LucideProps) => { const Icon = IconPackage.Bell; return <Icon {...props} />; };
export const User = (props: LucideProps) => { const Icon = IconPackage.User; return <Icon {...props} />; };
export const Settings = (props: LucideProps) => { const Icon = IconPackage.Settings; return <Icon {...props} />; };
export const ChevronRight = (props: LucideProps) => { const Icon = IconPackage.ChevronRight; return <Icon {...props} />; };
export const ChevronLeft = (props: LucideProps) => { const Icon = IconPackage.ChevronLeft; return <Icon {...props} />; };
export const MapPin = (props: LucideProps) => { const Icon = IconPackage.MapPin; return <Icon {...props} />; };
export const Calendar = (props: LucideProps) => { const Icon = IconPackage.Calendar; return <Icon {...props} />; };
export const Clock = (props: LucideProps) => { const Icon = IconPackage.Clock; return <Icon {...props} />; };
export const DollarSign = (props: LucideProps) => { const Icon = IconPackage.DollarSign; return <Icon {...props} />; };
export const CheckCircle = (props: LucideProps) => { const Icon = IconPackage.CheckCircle; return <Icon {...props} />; };
export const XCircle = (props: LucideProps) => { const Icon = IconPackage.XCircle; return <Icon {...props} />; };
export const AlertCircle = (props: LucideProps) => { const Icon = IconPackage.AlertCircle; return <Icon {...props} />; };
export const Info = (props: LucideProps) => { const Icon = IconPackage.Info; return <Icon {...props} />; };
export const Mail = (props: LucideProps) => { const Icon = IconPackage.Mail; return <Icon {...props} />; };
export const Lock = (props: LucideProps) => { const Icon = IconPackage.Lock; return <Icon {...props} />; };
export const Eye = (props: LucideProps) => { const Icon = IconPackage.Eye; return <Icon {...props} />; };
export const EyeOff = (props: LucideProps) => { const Icon = IconPackage.EyeOff; return <Icon {...props} />; };
export const ArrowLeft = (props: LucideProps) => { const Icon = IconPackage.ArrowLeft; return <Icon {...props} />; };
export const ArrowRight = (props: LucideProps) => { const Icon = IconPackage.ArrowRight; return <Icon {...props} />; };
export const Plus = (props: LucideProps) => { const Icon = IconPackage.Plus; return <Icon {...props} />; };
export const Minus = (props: LucideProps) => { const Icon = IconPackage.Minus; return <Icon {...props} />; };
export const X = (props: LucideProps) => { const Icon = IconPackage.X; return <Icon {...props} />; };
export const Menu = (props: LucideProps) => { const Icon = IconPackage.Menu; return <Icon {...props} />; };
export const LogOut = (props: LucideProps) => { const Icon = IconPackage.LogOut; return <Icon {...props} />; };
export const Edit = (props: LucideProps) => { const Icon = IconPackage.Edit; return <Icon {...props} />; };
export const Trash = (props: LucideProps) => { const Icon = IconPackage.Trash; return <Icon {...props} />; };
export const Download = (props: LucideProps) => { const Icon = IconPackage.Download; return <Icon {...props} />; };
export const Upload = (props: LucideProps) => { const Icon = IconPackage.Upload; return <Icon {...props} />; };
export const Share = (props: LucideProps) => { const Icon = IconPackage.Share; return <Icon {...props} />; };
export const Camera = (props: LucideProps) => { const Icon = IconPackage.Camera; return <Icon {...props} />; };
export const Image = (props: LucideProps) => { const Icon = IconPackage.Image; return <Icon {...props} />; };
export const FileText = (props: LucideProps) => { const Icon = IconPackage.FileText; return <Icon {...props} />; };
export const CreditCard = (props: LucideProps) => { const Icon = IconPackage.CreditCard; return <Icon {...props} />; };
export const Wallet = (props: LucideProps) => { const Icon = IconPackage.Wallet; return <Icon {...props} />; };
export const TrendingUp = (props: LucideProps) => { const Icon = IconPackage.TrendingUp; return <Icon {...props} />; };
export const TrendingDown = (props: LucideProps) => { const Icon = IconPackage.TrendingDown; return <Icon {...props} />; };
export const Filter = (props: LucideProps) => { const Icon = IconPackage.Filter; return <Icon {...props} />; };
export const SortAsc = (props: LucideProps) => { const Icon = IconPackage.SortAsc; return <Icon {...props} />; };
export const SortDesc = (props: LucideProps) => { const Icon = IconPackage.SortDesc; return <Icon {...props} />; };
export const MoreVertical = (props: LucideProps) => { const Icon = IconPackage.MoreVertical; return <Icon {...props} />; };
export const MoreHorizontal = (props: LucideProps) => { const Icon = IconPackage.MoreHorizontal; return <Icon {...props} />; };
export const Fingerprint = (props: LucideProps) => { const Icon = IconPackage.Fingerprint; return <Icon {...props} />; };
export const Chrome = (props: LucideProps) => { const Icon = IconPackage.Chrome; return <Icon {...props} />; };


// You can add more icons as needed by following the same pattern
