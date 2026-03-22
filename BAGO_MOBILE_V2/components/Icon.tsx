import { Platform } from 'react-native';
import type { LucideProps } from 'lucide-react-native';

// Platform-specific icon imports
let IconPackage: any;

if (Platform.OS === 'web') {
  IconPackage = require('lucide-react');
} else {
  IconPackage = require('lucide-react-native');
}

// Export all commonly used icons with platform detection
export const Package = (props: LucideProps) => <IconPackage.Package {...props} />;
export const Plane = (props: LucideProps) => <IconPackage.Plane {...props} />;
export const Shield = (props: LucideProps) => <IconPackage.Shield {...props} />;
export const Star = (props: LucideProps) => <IconPackage.Star {...props} />;
export const Home = (props: LucideProps) => <IconPackage.Home {...props} />;
export const Search = (props: LucideProps) => <IconPackage.Search {...props} />;
export const Bell = (props: LucideProps) => <IconPackage.Bell {...props} />;
export const User = (props: LucideProps) => <IconPackage.User {...props} />;
export const Settings = (props: LucideProps) => <IconPackage.Settings {...props} />;
export const ChevronRight = (props: LucideProps) => <IconPackage.ChevronRight {...props} />;
export const ChevronLeft = (props: LucideProps) => <IconPackage.ChevronLeft {...props} />;
export const MapPin = (props: LucideProps) => <IconPackage.MapPin {...props} />;
export const Calendar = (props: LucideProps) => <IconPackage.Calendar {...props} />;
export const Clock = (props: LucideProps) => <IconPackage.Clock {...props} />;
export const DollarSign = (props: LucideProps) => <IconPackage.DollarSign {...props} />;
export const CheckCircle = (props: LucideProps) => <IconPackage.CheckCircle {...props} />;
export const XCircle = (props: LucideProps) => <IconPackage.XCircle {...props} />;
export const AlertCircle = (props: LucideProps) => <IconPackage.AlertCircle {...props} />;
export const Info = (props: LucideProps) => <IconPackage.Info {...props} />;
export const Mail = (props: LucideProps) => <IconPackage.Mail {...props} />;
export const Lock = (props: LucideProps) => <IconPackage.Lock {...props} />;
export const Eye = (props: LucideProps) => <IconPackage.Eye {...props} />;
export const EyeOff = (props: LucideProps) => <IconPackage.EyeOff {...props} />;
export const ArrowLeft = (props: LucideProps) => <IconPackage.ArrowLeft {...props} />;
export const ArrowRight = (props: LucideProps) => <IconPackage.ArrowRight {...props} />;
export const Plus = (props: LucideProps) => <IconPackage.Plus {...props} />;
export const Minus = (props: LucideProps) => <IconPackage.Minus {...props} />;
export const X = (props: LucideProps) => <IconPackage.X {...props} />;
export const Menu = (props: LucideProps) => <IconPackage.Menu {...props} />;
export const LogOut = (props: LucideProps) => <IconPackage.LogOut {...props} />;
export const Edit = (props: LucideProps) => <IconPackage.Edit {...props} />;
export const Trash = (props: LucideProps) => <IconPackage.Trash {...props} />;
export const Download = (props: LucideProps) => <IconPackage.Download {...props} />;
export const Upload = (props: LucideProps) => <IconPackage.Upload {...props} />;
export const Share = (props: LucideProps) => <IconPackage.Share {...props} />;
export const Camera = (props: LucideProps) => <IconPackage.Camera {...props} />;
export const Image = (props: LucideProps) => <IconPackage.Image {...props} />;
export const FileText = (props: LucideProps) => <IconPackage.FileText {...props} />;
export const CreditCard = (props: LucideProps) => <IconPackage.CreditCard {...props} />;
export const Wallet = (props: LucideProps) => <IconPackage.Wallet {...props} />;
export const TrendingUp = (props: LucideProps) => <IconPackage.TrendingUp {...props} />;
export const TrendingDown = (props: LucideProps) => <IconPackage.TrendingDown {...props} />;
export const Filter = (props: LucideProps) => <IconPackage.Filter {...props} />;
export const SortAsc = (props: LucideProps) => <IconPackage.SortAsc {...props} />;
export const SortDesc = (props: LucideProps) => <IconPackage.SortDesc {...props} />;
export const MoreVertical = (props: LucideProps) => <IconPackage.MoreVertical {...props} />;
export const MoreHorizontal = (props: LucideProps) => <IconPackage.MoreHorizontal {...props} />;
export const Fingerprint = (props: LucideProps) => <IconPackage.Fingerprint {...props} />;
export const Chrome = (props: LucideProps) => <IconPackage.Chrome {...props} />;

// You can add more icons as needed by following the same pattern
