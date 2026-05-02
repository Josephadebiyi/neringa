class CountryCurrencyData {
  const CountryCurrencyData({
    required this.name,
    required this.code,
    required this.currency,
    required this.symbol,
    required this.flag,
    required this.dialCode,
  });

  final String name;
  final String code;
  final String currency;
  final String symbol;
  final String flag;
  final String dialCode;

  String get paymentProvider => CurrencyConversionHelper.providerForCurrency(currency);
}

class CurrencyConversionHelper {
  CurrencyConversionHelper._();

  static const double minimumWithdrawalUsd = 5.0;

  static const List<CountryCurrencyData> supportedCountries = [
    CountryCurrencyData(name: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£', flag: '🇬🇧', dialCode: '+44'),
    CountryCurrencyData(name: 'Nigeria', code: 'NG', currency: 'NGN', symbol: '₦', flag: '🇳🇬', dialCode: '+234'),
    CountryCurrencyData(name: 'United States', code: 'US', currency: 'USD', symbol: '\$', flag: '🇺🇸', dialCode: '+1'),
    CountryCurrencyData(name: 'Canada', code: 'CA', currency: 'CAD', symbol: '\$', flag: '🇨🇦', dialCode: '+1'),
    CountryCurrencyData(name: 'France', code: 'FR', currency: 'EUR', symbol: '€', flag: '🇫🇷', dialCode: '+33'),
    CountryCurrencyData(name: 'Germany', code: 'DE', currency: 'EUR', symbol: '€', flag: '🇩🇪', dialCode: '+49'),
    CountryCurrencyData(name: 'Ghana', code: 'GH', currency: 'GHS', symbol: 'GH₵', flag: '🇬🇭', dialCode: '+233'),
    CountryCurrencyData(name: 'Kenya', code: 'KE', currency: 'KES', symbol: 'KSh', flag: '🇰🇪', dialCode: '+254'),
    CountryCurrencyData(name: 'South Africa', code: 'ZA', currency: 'ZAR', symbol: 'R', flag: '🇿🇦', dialCode: '+27'),
  ];

  static const List<CountryCurrencyData> allCountries = [
    CountryCurrencyData(name: 'Afghanistan', code: 'AF', currency: 'AFN', symbol: '؋', flag: '🇦🇫', dialCode: '+93'),
    CountryCurrencyData(name: 'Albania', code: 'AL', currency: 'ALL', symbol: 'L', flag: '🇦🇱', dialCode: '+355'),
    CountryCurrencyData(name: 'Algeria', code: 'DZ', currency: 'DZD', symbol: 'DA', flag: '🇩🇿', dialCode: '+213'),
    CountryCurrencyData(name: 'Andorra', code: 'AD', currency: 'EUR', symbol: '€', flag: '🇦🇩', dialCode: '+376'),
    CountryCurrencyData(name: 'Angola', code: 'AO', currency: 'AOA', symbol: 'Kz', flag: '🇦🇴', dialCode: '+244'),
    CountryCurrencyData(name: 'Antigua and Barbuda', code: 'AG', currency: 'XCD', symbol: '\$', flag: '🇦🇬', dialCode: '+1-268'),
    CountryCurrencyData(name: 'Argentina', code: 'AR', currency: 'ARS', symbol: '\$', flag: '🇦🇷', dialCode: '+54'),
    CountryCurrencyData(name: 'Armenia', code: 'AM', currency: 'AMD', symbol: '֏', flag: '🇦🇲', dialCode: '+374'),
    CountryCurrencyData(name: 'Australia', code: 'AU', currency: 'AUD', symbol: '\$', flag: '🇦🇺', dialCode: '+61'),
    CountryCurrencyData(name: 'Austria', code: 'AT', currency: 'EUR', symbol: '€', flag: '🇦🇹', dialCode: '+43'),
    CountryCurrencyData(name: 'Azerbaijan', code: 'AZ', currency: 'AZN', symbol: '₼', flag: '🇦🇿', dialCode: '+994'),
    CountryCurrencyData(name: 'Bahamas', code: 'BS', currency: 'BSD', symbol: '\$', flag: '🇧🇸', dialCode: '+1-242'),
    CountryCurrencyData(name: 'Bahrain', code: 'BH', currency: 'BHD', symbol: 'BD', flag: '🇧🇭', dialCode: '+973'),
    CountryCurrencyData(name: 'Bangladesh', code: 'BD', currency: 'BDT', symbol: '৳', flag: '🇧🇩', dialCode: '+880'),
    CountryCurrencyData(name: 'Barbados', code: 'BB', currency: 'BBD', symbol: '\$', flag: '🇧🇧', dialCode: '+1-246'),
    CountryCurrencyData(name: 'Belarus', code: 'BY', currency: 'BYN', symbol: 'Br', flag: '🇧🇾', dialCode: '+375'),
    CountryCurrencyData(name: 'Belgium', code: 'BE', currency: 'EUR', symbol: '€', flag: '🇧🇪', dialCode: '+32'),
    CountryCurrencyData(name: 'Belize', code: 'BZ', currency: 'BZD', symbol: '\$', flag: '🇧🇿', dialCode: '+501'),
    CountryCurrencyData(name: 'Benin', code: 'BJ', currency: 'XOF', symbol: 'CFA', flag: '🇧🇯', dialCode: '+229'),
    CountryCurrencyData(name: 'Bhutan', code: 'BT', currency: 'BTN', symbol: 'Nu', flag: '🇧🇹', dialCode: '+975'),
    CountryCurrencyData(name: 'Bolivia', code: 'BO', currency: 'BOB', symbol: 'Bs', flag: '🇧🇴', dialCode: '+591'),
    CountryCurrencyData(name: 'Bosnia and Herzegovina', code: 'BA', currency: 'BAM', symbol: 'KM', flag: '🇧🇦', dialCode: '+387'),
    CountryCurrencyData(name: 'Botswana', code: 'BW', currency: 'BWP', symbol: 'P', flag: '🇧🇼', dialCode: '+267'),
    CountryCurrencyData(name: 'Brazil', code: 'BR', currency: 'BRL', symbol: 'R\$', flag: '🇧🇷', dialCode: '+55'),
    CountryCurrencyData(name: 'Brunei', code: 'BN', currency: 'BND', symbol: '\$', flag: '🇧🇳', dialCode: '+673'),
    CountryCurrencyData(name: 'Bulgaria', code: 'BG', currency: 'BGN', symbol: 'лв', flag: '🇧🇬', dialCode: '+359'),
    CountryCurrencyData(name: 'Burkina Faso', code: 'BF', currency: 'XOF', symbol: 'CFA', flag: '🇧🇫', dialCode: '+226'),
    CountryCurrencyData(name: 'Burundi', code: 'BI', currency: 'BIF', symbol: 'Fr', flag: '🇧🇮', dialCode: '+257'),
    CountryCurrencyData(name: 'Cabo Verde', code: 'CV', currency: 'CVE', symbol: '\$', flag: '🇨🇻', dialCode: '+238'),
    CountryCurrencyData(name: 'Cambodia', code: 'KH', currency: 'KHR', symbol: '៛', flag: '🇰🇭', dialCode: '+855'),
    CountryCurrencyData(name: 'Cameroon', code: 'CM', currency: 'XAF', symbol: 'CFA', flag: '🇨🇲', dialCode: '+237'),
    CountryCurrencyData(name: 'Canada', code: 'CA', currency: 'CAD', symbol: '\$', flag: '🇨🇦', dialCode: '+1'),
    CountryCurrencyData(name: 'Central African Republic', code: 'CF', currency: 'XAF', symbol: 'CFA', flag: '🇨🇫', dialCode: '+236'),
    CountryCurrencyData(name: 'Chad', code: 'TD', currency: 'XAF', symbol: 'CFA', flag: '🇹🇩', dialCode: '+235'),
    CountryCurrencyData(name: 'Chile', code: 'CL', currency: 'CLP', symbol: '\$', flag: '🇨🇱', dialCode: '+56'),
    CountryCurrencyData(name: 'China', code: 'CN', currency: 'CNY', symbol: '¥', flag: '🇨🇳', dialCode: '+86'),
    CountryCurrencyData(name: 'Colombia', code: 'CO', currency: 'COP', symbol: '\$', flag: '🇨🇴', dialCode: '+57'),
    CountryCurrencyData(name: 'Comoros', code: 'KM', currency: 'KMF', symbol: 'Fr', flag: '🇰🇲', dialCode: '+269'),
    CountryCurrencyData(name: 'Congo (DRC)', code: 'CD', currency: 'CDF', symbol: 'Fr', flag: '🇨🇩', dialCode: '+243'),
    CountryCurrencyData(name: 'Congo (Republic)', code: 'CG', currency: 'XAF', symbol: 'CFA', flag: '🇨🇬', dialCode: '+242'),
    CountryCurrencyData(name: 'Costa Rica', code: 'CR', currency: 'CRC', symbol: '₡', flag: '🇨🇷', dialCode: '+506'),
    CountryCurrencyData(name: 'Croatia', code: 'HR', currency: 'EUR', symbol: '€', flag: '🇭🇷', dialCode: '+385'),
    CountryCurrencyData(name: 'Cuba', code: 'CU', currency: 'CUP', symbol: '\$', flag: '🇨🇺', dialCode: '+53'),
    CountryCurrencyData(name: 'Cyprus', code: 'CY', currency: 'EUR', symbol: '€', flag: '🇨🇾', dialCode: '+357'),
    CountryCurrencyData(name: 'Czech Republic', code: 'CZ', currency: 'CZK', symbol: 'Kč', flag: '🇨🇿', dialCode: '+420'),
    CountryCurrencyData(name: 'Denmark', code: 'DK', currency: 'DKK', symbol: 'kr', flag: '🇩🇰', dialCode: '+45'),
    CountryCurrencyData(name: 'Djibouti', code: 'DJ', currency: 'DJF', symbol: 'Fr', flag: '🇩🇯', dialCode: '+253'),
    CountryCurrencyData(name: 'Dominica', code: 'DM', currency: 'XCD', symbol: '\$', flag: '🇩🇲', dialCode: '+1-767'),
    CountryCurrencyData(name: 'Dominican Republic', code: 'DO', currency: 'DOP', symbol: 'RD\$', flag: '🇩🇴', dialCode: '+1-809'),
    CountryCurrencyData(name: 'Ecuador', code: 'EC', currency: 'USD', symbol: '\$', flag: '🇪🇨', dialCode: '+593'),
    CountryCurrencyData(name: 'Egypt', code: 'EG', currency: 'EGP', symbol: '£', flag: '🇪🇬', dialCode: '+20'),
    CountryCurrencyData(name: 'El Salvador', code: 'SV', currency: 'USD', symbol: '\$', flag: '🇸🇻', dialCode: '+503'),
    CountryCurrencyData(name: 'Equatorial Guinea', code: 'GQ', currency: 'XAF', symbol: 'CFA', flag: '🇬🇶', dialCode: '+240'),
    CountryCurrencyData(name: 'Eritrea', code: 'ER', currency: 'ERN', symbol: 'Nfk', flag: '🇪🇷', dialCode: '+291'),
    CountryCurrencyData(name: 'Estonia', code: 'EE', currency: 'EUR', symbol: '€', flag: '🇪🇪', dialCode: '+372'),
    CountryCurrencyData(name: 'Eswatini', code: 'SZ', currency: 'SZL', symbol: 'L', flag: '🇸🇿', dialCode: '+268'),
    CountryCurrencyData(name: 'Ethiopia', code: 'ET', currency: 'ETB', symbol: 'Br', flag: '🇪🇹', dialCode: '+251'),
    CountryCurrencyData(name: 'Fiji', code: 'FJ', currency: 'FJD', symbol: '\$', flag: '🇫🇯', dialCode: '+679'),
    CountryCurrencyData(name: 'Finland', code: 'FI', currency: 'EUR', symbol: '€', flag: '🇫🇮', dialCode: '+358'),
    CountryCurrencyData(name: 'France', code: 'FR', currency: 'EUR', symbol: '€', flag: '🇫🇷', dialCode: '+33'),
    CountryCurrencyData(name: 'Gabon', code: 'GA', currency: 'XAF', symbol: 'CFA', flag: '🇬🇦', dialCode: '+241'),
    CountryCurrencyData(name: 'Gambia', code: 'GM', currency: 'GMD', symbol: 'D', flag: '🇬🇲', dialCode: '+220'),
    CountryCurrencyData(name: 'Georgia', code: 'GE', currency: 'GEL', symbol: '₾', flag: '🇬🇪', dialCode: '+995'),
    CountryCurrencyData(name: 'Germany', code: 'DE', currency: 'EUR', symbol: '€', flag: '🇩🇪', dialCode: '+49'),
    CountryCurrencyData(name: 'Ghana', code: 'GH', currency: 'GHS', symbol: 'GH₵', flag: '🇬🇭', dialCode: '+233'),
    CountryCurrencyData(name: 'Greece', code: 'GR', currency: 'EUR', symbol: '€', flag: '🇬🇷', dialCode: '+30'),
    CountryCurrencyData(name: 'Grenada', code: 'GD', currency: 'XCD', symbol: '\$', flag: '🇬🇩', dialCode: '+1-473'),
    CountryCurrencyData(name: 'Guatemala', code: 'GT', currency: 'GTQ', symbol: 'Q', flag: '🇬🇹', dialCode: '+502'),
    CountryCurrencyData(name: 'Guinea', code: 'GN', currency: 'GNF', symbol: 'Fr', flag: '🇬🇳', dialCode: '+224'),
    CountryCurrencyData(name: 'Guinea-Bissau', code: 'GW', currency: 'XOF', symbol: 'CFA', flag: '🇬🇼', dialCode: '+245'),
    CountryCurrencyData(name: 'Guyana', code: 'GY', currency: 'GYD', symbol: '\$', flag: '🇬🇾', dialCode: '+592'),
    CountryCurrencyData(name: 'Haiti', code: 'HT', currency: 'HTG', symbol: 'G', flag: '🇭🇹', dialCode: '+509'),
    CountryCurrencyData(name: 'Honduras', code: 'HN', currency: 'HNL', symbol: 'L', flag: '🇭🇳', dialCode: '+504'),
    CountryCurrencyData(name: 'Hungary', code: 'HU', currency: 'HUF', symbol: 'Ft', flag: '🇭🇺', dialCode: '+36'),
    CountryCurrencyData(name: 'Iceland', code: 'IS', currency: 'ISK', symbol: 'kr', flag: '🇮🇸', dialCode: '+354'),
    CountryCurrencyData(name: 'India', code: 'IN', currency: 'INR', symbol: '₹', flag: '🇮🇳', dialCode: '+91'),
    CountryCurrencyData(name: 'Indonesia', code: 'ID', currency: 'IDR', symbol: 'Rp', flag: '🇮🇩', dialCode: '+62'),
    CountryCurrencyData(name: 'Iran', code: 'IR', currency: 'IRR', symbol: '﷼', flag: '🇮🇷', dialCode: '+98'),
    CountryCurrencyData(name: 'Iraq', code: 'IQ', currency: 'IQD', symbol: 'ع.د', flag: '🇮🇶', dialCode: '+964'),
    CountryCurrencyData(name: 'Ireland', code: 'IE', currency: 'EUR', symbol: '€', flag: '🇮🇪', dialCode: '+353'),
    CountryCurrencyData(name: 'Israel', code: 'IL', currency: 'ILS', symbol: '₪', flag: '🇮🇱', dialCode: '+972'),
    CountryCurrencyData(name: 'Italy', code: 'IT', currency: 'EUR', symbol: '€', flag: '🇮🇹', dialCode: '+39'),
    CountryCurrencyData(name: 'Ivory Coast', code: 'CI', currency: 'XOF', symbol: 'CFA', flag: '🇨🇮', dialCode: '+225'),
    CountryCurrencyData(name: 'Jamaica', code: 'JM', currency: 'JMD', symbol: '\$', flag: '🇯🇲', dialCode: '+1-876'),
    CountryCurrencyData(name: 'Japan', code: 'JP', currency: 'JPY', symbol: '¥', flag: '🇯🇵', dialCode: '+81'),
    CountryCurrencyData(name: 'Jordan', code: 'JO', currency: 'JOD', symbol: 'JD', flag: '🇯🇴', dialCode: '+962'),
    CountryCurrencyData(name: 'Kazakhstan', code: 'KZ', currency: 'KZT', symbol: '₸', flag: '🇰🇿', dialCode: '+7'),
    CountryCurrencyData(name: 'Kenya', code: 'KE', currency: 'KES', symbol: 'KSh', flag: '🇰🇪', dialCode: '+254'),
    CountryCurrencyData(name: 'Kiribati', code: 'KI', currency: 'AUD', symbol: '\$', flag: '🇰🇮', dialCode: '+686'),
    CountryCurrencyData(name: 'Kosovo', code: 'XK', currency: 'EUR', symbol: '€', flag: '🇽🇰', dialCode: '+383'),
    CountryCurrencyData(name: 'Kuwait', code: 'KW', currency: 'KWD', symbol: 'KD', flag: '🇰🇼', dialCode: '+965'),
    CountryCurrencyData(name: 'Kyrgyzstan', code: 'KG', currency: 'KGS', symbol: 'с', flag: '🇰🇬', dialCode: '+996'),
    CountryCurrencyData(name: 'Laos', code: 'LA', currency: 'LAK', symbol: '₭', flag: '🇱🇦', dialCode: '+856'),
    CountryCurrencyData(name: 'Latvia', code: 'LV', currency: 'EUR', symbol: '€', flag: '🇱🇻', dialCode: '+371'),
    CountryCurrencyData(name: 'Lebanon', code: 'LB', currency: 'LBP', symbol: 'ل.ل', flag: '🇱🇧', dialCode: '+961'),
    CountryCurrencyData(name: 'Lesotho', code: 'LS', currency: 'LSL', symbol: 'L', flag: '🇱🇸', dialCode: '+266'),
    CountryCurrencyData(name: 'Liberia', code: 'LR', currency: 'LRD', symbol: '\$', flag: '🇱🇷', dialCode: '+231'),
    CountryCurrencyData(name: 'Libya', code: 'LY', currency: 'LYD', symbol: 'LD', flag: '🇱🇾', dialCode: '+218'),
    CountryCurrencyData(name: 'Liechtenstein', code: 'LI', currency: 'CHF', symbol: 'Fr', flag: '🇱🇮', dialCode: '+423'),
    CountryCurrencyData(name: 'Lithuania', code: 'LT', currency: 'EUR', symbol: '€', flag: '🇱🇹', dialCode: '+370'),
    CountryCurrencyData(name: 'Luxembourg', code: 'LU', currency: 'EUR', symbol: '€', flag: '🇱🇺', dialCode: '+352'),
    CountryCurrencyData(name: 'Madagascar', code: 'MG', currency: 'MGA', symbol: 'Ar', flag: '🇲🇬', dialCode: '+261'),
    CountryCurrencyData(name: 'Malawi', code: 'MW', currency: 'MWK', symbol: 'MK', flag: '🇲🇼', dialCode: '+265'),
    CountryCurrencyData(name: 'Malaysia', code: 'MY', currency: 'MYR', symbol: 'RM', flag: '🇲🇾', dialCode: '+60'),
    CountryCurrencyData(name: 'Maldives', code: 'MV', currency: 'MVR', symbol: 'Rf', flag: '🇲🇻', dialCode: '+960'),
    CountryCurrencyData(name: 'Mali', code: 'ML', currency: 'XOF', symbol: 'CFA', flag: '🇲🇱', dialCode: '+223'),
    CountryCurrencyData(name: 'Malta', code: 'MT', currency: 'EUR', symbol: '€', flag: '🇲🇹', dialCode: '+356'),
    CountryCurrencyData(name: 'Marshall Islands', code: 'MH', currency: 'USD', symbol: '\$', flag: '🇲🇭', dialCode: '+692'),
    CountryCurrencyData(name: 'Mauritania', code: 'MR', currency: 'MRU', symbol: 'UM', flag: '🇲🇷', dialCode: '+222'),
    CountryCurrencyData(name: 'Mauritius', code: 'MU', currency: 'MUR', symbol: '₨', flag: '🇲🇺', dialCode: '+230'),
    CountryCurrencyData(name: 'Mexico', code: 'MX', currency: 'MXN', symbol: '\$', flag: '🇲🇽', dialCode: '+52'),
    CountryCurrencyData(name: 'Micronesia', code: 'FM', currency: 'USD', symbol: '\$', flag: '🇫🇲', dialCode: '+691'),
    CountryCurrencyData(name: 'Moldova', code: 'MD', currency: 'MDL', symbol: 'L', flag: '🇲🇩', dialCode: '+373'),
    CountryCurrencyData(name: 'Monaco', code: 'MC', currency: 'EUR', symbol: '€', flag: '🇲🇨', dialCode: '+377'),
    CountryCurrencyData(name: 'Mongolia', code: 'MN', currency: 'MNT', symbol: '₮', flag: '🇲🇳', dialCode: '+976'),
    CountryCurrencyData(name: 'Montenegro', code: 'ME', currency: 'EUR', symbol: '€', flag: '🇲🇪', dialCode: '+382'),
    CountryCurrencyData(name: 'Morocco', code: 'MA', currency: 'MAD', symbol: 'MAD', flag: '🇲🇦', dialCode: '+212'),
    CountryCurrencyData(name: 'Mozambique', code: 'MZ', currency: 'MZN', symbol: 'MT', flag: '🇲🇿', dialCode: '+258'),
    CountryCurrencyData(name: 'Myanmar', code: 'MM', currency: 'MMK', symbol: 'K', flag: '🇲🇲', dialCode: '+95'),
    CountryCurrencyData(name: 'Namibia', code: 'NA', currency: 'NAD', symbol: '\$', flag: '🇳🇦', dialCode: '+264'),
    CountryCurrencyData(name: 'Nauru', code: 'NR', currency: 'AUD', symbol: '\$', flag: '🇳🇷', dialCode: '+674'),
    CountryCurrencyData(name: 'Nepal', code: 'NP', currency: 'NPR', symbol: '₨', flag: '🇳🇵', dialCode: '+977'),
    CountryCurrencyData(name: 'Netherlands', code: 'NL', currency: 'EUR', symbol: '€', flag: '🇳🇱', dialCode: '+31'),
    CountryCurrencyData(name: 'New Zealand', code: 'NZ', currency: 'NZD', symbol: '\$', flag: '🇳🇿', dialCode: '+64'),
    CountryCurrencyData(name: 'Nicaragua', code: 'NI', currency: 'NIO', symbol: 'C\$', flag: '🇳🇮', dialCode: '+505'),
    CountryCurrencyData(name: 'Niger', code: 'NE', currency: 'XOF', symbol: 'CFA', flag: '🇳🇪', dialCode: '+227'),
    CountryCurrencyData(name: 'Nigeria', code: 'NG', currency: 'NGN', symbol: '₦', flag: '🇳🇬', dialCode: '+234'),
    CountryCurrencyData(name: 'North Korea', code: 'KP', currency: 'KPW', symbol: '₩', flag: '🇰🇵', dialCode: '+850'),
    CountryCurrencyData(name: 'North Macedonia', code: 'MK', currency: 'MKD', symbol: 'ден', flag: '🇲🇰', dialCode: '+389'),
    CountryCurrencyData(name: 'Norway', code: 'NO', currency: 'NOK', symbol: 'kr', flag: '🇳🇴', dialCode: '+47'),
    CountryCurrencyData(name: 'Oman', code: 'OM', currency: 'OMR', symbol: 'ر.ع.', flag: '🇴🇲', dialCode: '+968'),
    CountryCurrencyData(name: 'Pakistan', code: 'PK', currency: 'PKR', symbol: '₨', flag: '🇵🇰', dialCode: '+92'),
    CountryCurrencyData(name: 'Palau', code: 'PW', currency: 'USD', symbol: '\$', flag: '🇵🇼', dialCode: '+680'),
    CountryCurrencyData(name: 'Panama', code: 'PA', currency: 'PAB', symbol: 'B/.', flag: '🇵🇦', dialCode: '+507'),
    CountryCurrencyData(name: 'Papua New Guinea', code: 'PG', currency: 'PGK', symbol: 'K', flag: '🇵🇬', dialCode: '+675'),
    CountryCurrencyData(name: 'Paraguay', code: 'PY', currency: 'PYG', symbol: '₲', flag: '🇵🇾', dialCode: '+595'),
    CountryCurrencyData(name: 'Peru', code: 'PE', currency: 'PEN', symbol: 'S/.', flag: '🇵🇪', dialCode: '+51'),
    CountryCurrencyData(name: 'Philippines', code: 'PH', currency: 'PHP', symbol: '₱', flag: '🇵🇭', dialCode: '+63'),
    CountryCurrencyData(name: 'Poland', code: 'PL', currency: 'PLN', symbol: 'zł', flag: '🇵🇱', dialCode: '+48'),
    CountryCurrencyData(name: 'Portugal', code: 'PT', currency: 'EUR', symbol: '€', flag: '🇵🇹', dialCode: '+351'),
    CountryCurrencyData(name: 'Qatar', code: 'QA', currency: 'QAR', symbol: 'ر.ق', flag: '🇶🇦', dialCode: '+974'),
    CountryCurrencyData(name: 'Romania', code: 'RO', currency: 'RON', symbol: 'lei', flag: '🇷🇴', dialCode: '+40'),
    CountryCurrencyData(name: 'Russia', code: 'RU', currency: 'RUB', symbol: '₽', flag: '🇷🇺', dialCode: '+7'),
    CountryCurrencyData(name: 'Rwanda', code: 'RW', currency: 'RWF', symbol: 'Fr', flag: '🇷🇼', dialCode: '+250'),
    CountryCurrencyData(name: 'Saint Kitts and Nevis', code: 'KN', currency: 'XCD', symbol: '\$', flag: '🇰🇳', dialCode: '+1-869'),
    CountryCurrencyData(name: 'Saint Lucia', code: 'LC', currency: 'XCD', symbol: '\$', flag: '🇱🇨', dialCode: '+1-758'),
    CountryCurrencyData(name: 'Saint Vincent and Grenadines', code: 'VC', currency: 'XCD', symbol: '\$', flag: '🇻🇨', dialCode: '+1-784'),
    CountryCurrencyData(name: 'Samoa', code: 'WS', currency: 'WST', symbol: 'T', flag: '🇼🇸', dialCode: '+685'),
    CountryCurrencyData(name: 'San Marino', code: 'SM', currency: 'EUR', symbol: '€', flag: '🇸🇲', dialCode: '+378'),
    CountryCurrencyData(name: 'Sao Tome and Principe', code: 'ST', currency: 'STN', symbol: 'Db', flag: '🇸🇹', dialCode: '+239'),
    CountryCurrencyData(name: 'Saudi Arabia', code: 'SA', currency: 'SAR', symbol: 'ر.س', flag: '🇸🇦', dialCode: '+966'),
    CountryCurrencyData(name: 'Senegal', code: 'SN', currency: 'XOF', symbol: 'CFA', flag: '🇸🇳', dialCode: '+221'),
    CountryCurrencyData(name: 'Serbia', code: 'RS', currency: 'RSD', symbol: 'din', flag: '🇷🇸', dialCode: '+381'),
    CountryCurrencyData(name: 'Seychelles', code: 'SC', currency: 'SCR', symbol: '₨', flag: '🇸🇨', dialCode: '+248'),
    CountryCurrencyData(name: 'Sierra Leone', code: 'SL', currency: 'SLL', symbol: 'Le', flag: '🇸🇱', dialCode: '+232'),
    CountryCurrencyData(name: 'Singapore', code: 'SG', currency: 'SGD', symbol: '\$', flag: '🇸🇬', dialCode: '+65'),
    CountryCurrencyData(name: 'Slovakia', code: 'SK', currency: 'EUR', symbol: '€', flag: '🇸🇰', dialCode: '+421'),
    CountryCurrencyData(name: 'Slovenia', code: 'SI', currency: 'EUR', symbol: '€', flag: '🇸🇮', dialCode: '+386'),
    CountryCurrencyData(name: 'Solomon Islands', code: 'SB', currency: 'SBD', symbol: '\$', flag: '🇸🇧', dialCode: '+677'),
    CountryCurrencyData(name: 'Somalia', code: 'SO', currency: 'SOS', symbol: 'Sh', flag: '🇸🇴', dialCode: '+252'),
    CountryCurrencyData(name: 'South Africa', code: 'ZA', currency: 'ZAR', symbol: 'R', flag: '🇿🇦', dialCode: '+27'),
    CountryCurrencyData(name: 'South Korea', code: 'KR', currency: 'KRW', symbol: '₩', flag: '🇰🇷', dialCode: '+82'),
    CountryCurrencyData(name: 'South Sudan', code: 'SS', currency: 'SSP', symbol: '£', flag: '🇸🇸', dialCode: '+211'),
    CountryCurrencyData(name: 'Spain', code: 'ES', currency: 'EUR', symbol: '€', flag: '🇪🇸', dialCode: '+34'),
    CountryCurrencyData(name: 'Sri Lanka', code: 'LK', currency: 'LKR', symbol: '₨', flag: '🇱🇰', dialCode: '+94'),
    CountryCurrencyData(name: 'Sudan', code: 'SD', currency: 'SDG', symbol: 'ج.س.', flag: '🇸🇩', dialCode: '+249'),
    CountryCurrencyData(name: 'Suriname', code: 'SR', currency: 'SRD', symbol: '\$', flag: '🇸🇷', dialCode: '+597'),
    CountryCurrencyData(name: 'Sweden', code: 'SE', currency: 'SEK', symbol: 'kr', flag: '🇸🇪', dialCode: '+46'),
    CountryCurrencyData(name: 'Switzerland', code: 'CH', currency: 'CHF', symbol: 'Fr', flag: '🇨🇭', dialCode: '+41'),
    CountryCurrencyData(name: 'Syria', code: 'SY', currency: 'SYP', symbol: '£', flag: '🇸🇾', dialCode: '+963'),
    CountryCurrencyData(name: 'Taiwan', code: 'TW', currency: 'TWD', symbol: 'NT\$', flag: '🇹🇼', dialCode: '+886'),
    CountryCurrencyData(name: 'Tajikistan', code: 'TJ', currency: 'TJS', symbol: 'SM', flag: '🇹🇯', dialCode: '+992'),
    CountryCurrencyData(name: 'Tanzania', code: 'TZ', currency: 'TZS', symbol: 'Sh', flag: '🇹🇿', dialCode: '+255'),
    CountryCurrencyData(name: 'Thailand', code: 'TH', currency: 'THB', symbol: '฿', flag: '🇹🇭', dialCode: '+66'),
    CountryCurrencyData(name: 'Timor-Leste', code: 'TL', currency: 'USD', symbol: '\$', flag: '🇹🇱', dialCode: '+670'),
    CountryCurrencyData(name: 'Togo', code: 'TG', currency: 'XOF', symbol: 'CFA', flag: '🇹🇬', dialCode: '+228'),
    CountryCurrencyData(name: 'Tonga', code: 'TO', currency: 'TOP', symbol: 'T\$', flag: '🇹🇴', dialCode: '+676'),
    CountryCurrencyData(name: 'Trinidad and Tobago', code: 'TT', currency: 'TTD', symbol: 'TT\$', flag: '🇹🇹', dialCode: '+1-868'),
    CountryCurrencyData(name: 'Tunisia', code: 'TN', currency: 'TND', symbol: 'DT', flag: '🇹🇳', dialCode: '+216'),
    CountryCurrencyData(name: 'Turkey', code: 'TR', currency: 'TRY', symbol: '₺', flag: '🇹🇷', dialCode: '+90'),
    CountryCurrencyData(name: 'Turkmenistan', code: 'TM', currency: 'TMT', symbol: 'T', flag: '🇹🇲', dialCode: '+993'),
    CountryCurrencyData(name: 'Tuvalu', code: 'TV', currency: 'AUD', symbol: '\$', flag: '🇹🇻', dialCode: '+688'),
    CountryCurrencyData(name: 'Uganda', code: 'UG', currency: 'UGX', symbol: 'Sh', flag: '🇺🇬', dialCode: '+256'),
    CountryCurrencyData(name: 'Ukraine', code: 'UA', currency: 'UAH', symbol: '₴', flag: '🇺🇦', dialCode: '+380'),
    CountryCurrencyData(name: 'United Arab Emirates', code: 'AE', currency: 'AED', symbol: 'د.إ', flag: '🇦🇪', dialCode: '+971'),
    CountryCurrencyData(name: 'United Kingdom', code: 'GB', currency: 'GBP', symbol: '£', flag: '🇬🇧', dialCode: '+44'),
    CountryCurrencyData(name: 'United States', code: 'US', currency: 'USD', symbol: '\$', flag: '🇺🇸', dialCode: '+1'),
    CountryCurrencyData(name: 'Uruguay', code: 'UY', currency: 'UYU', symbol: '\$U', flag: '🇺🇾', dialCode: '+598'),
    CountryCurrencyData(name: 'Uzbekistan', code: 'UZ', currency: 'UZS', symbol: 'so\'m', flag: '🇺🇿', dialCode: '+998'),
    CountryCurrencyData(name: 'Vanuatu', code: 'VU', currency: 'VUV', symbol: 'Vt', flag: '🇻🇺', dialCode: '+678'),
    CountryCurrencyData(name: 'Vatican City', code: 'VA', currency: 'EUR', symbol: '€', flag: '🇻🇦', dialCode: '+39'),
    CountryCurrencyData(name: 'Venezuela', code: 'VE', currency: 'VES', symbol: 'Bs.S', flag: '🇻🇪', dialCode: '+58'),
    CountryCurrencyData(name: 'Vietnam', code: 'VN', currency: 'VND', symbol: '₫', flag: '🇻🇳', dialCode: '+84'),
    CountryCurrencyData(name: 'Yemen', code: 'YE', currency: 'YER', symbol: '﷼', flag: '🇾🇪', dialCode: '+967'),
    CountryCurrencyData(name: 'Zambia', code: 'ZM', currency: 'ZMW', symbol: 'ZK', flag: '🇿🇲', dialCode: '+260'),
    CountryCurrencyData(name: 'Zimbabwe', code: 'ZW', currency: 'ZWL', symbol: 'Z\$', flag: '🇿🇼', dialCode: '+263'),
  ];

  static const Map<String, double> _defaultUsdRates = {
    'USD': 1.0,
    'EUR': 0.92,
    'GBP': 0.79,
    'CAD': 1.36,
    'NGN': 1550.0,
    'GHS': 15.2,
    'KES': 129.0,
    'ZAR': 18.5,
  };

  static Map<String, double> _runtimeUsdRates = Map<String, double>.from(_defaultUsdRates);
  static List<String> _runtimeSupportedCurrencies = _defaultUsdRates.keys.toList();

  static List<String> get supportedCurrencyCodes =>
      List<String>.unmodifiable(_runtimeSupportedCurrencies);

  static void applyRemoteConfig({
    String baseCurrency = 'USD',
    List<String>? supportedCurrencies,
    Map<String, double>? usdRates,
  }) {
    final normalizedBase = baseCurrency.trim().toUpperCase();
    if (normalizedBase != 'USD') {
      return;
    }

    final nextRates = <String, double>{};
    for (final entry in (usdRates ?? _defaultUsdRates).entries) {
      final code = entry.key.trim().toUpperCase();
      final rate = entry.value;
      if (code.isNotEmpty && rate > 0) {
        nextRates[code] = rate;
      }
    }

    if (!nextRates.containsKey('USD')) {
      nextRates['USD'] = 1.0;
    }

    final nextSupported = ((supportedCurrencies ?? nextRates.keys.toList()))
        .map((value) => value.trim().toUpperCase())
        .where((value) => value.isNotEmpty && nextRates.containsKey(value))
        .toSet()
        .toList()
      ..sort();

    if (!nextSupported.contains('USD')) {
      nextSupported.insert(0, 'USD');
    }

    _runtimeUsdRates = nextRates;
    _runtimeSupportedCurrencies = nextSupported;
  }

  static CountryCurrencyData? countryByName(String? name) {
    if (name == null) return null;
    for (final country in supportedCountries) {
      if (country.name.toLowerCase() == name.toLowerCase()) {
        return country;
      }
    }
    return null;
  }

  static CountryCurrencyData? countryByCode(String? code) {
    if (code == null) return null;
    for (final country in supportedCountries) {
      if (country.code.toLowerCase() == code.toLowerCase()) {
        return country;
      }
    }
    return null;
  }

  static String providerForCurrency(String currency) {
    switch (currency.toUpperCase()) {
      case 'NGN':
      case 'GHS':
      case 'KES':
      case 'ZAR':
        return 'paystack';
      default:
        return 'stripe';
    }
  }

  static double convert({
    required double amount,
    required String fromCurrency,
    required String toCurrency,
  }) {
    final fromRate = _runtimeUsdRates[fromCurrency.toUpperCase()];
    final toRate = _runtimeUsdRates[toCurrency.toUpperCase()];
    if (fromRate == null || toRate == null) return amount;
    final usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  static bool canConvert({
    required String fromCurrency,
    required String toCurrency,
  }) {
    return _runtimeUsdRates.containsKey(fromCurrency.toUpperCase()) &&
        _runtimeUsdRates.containsKey(toCurrency.toUpperCase());
  }

  static String symbolForCurrency(String currency) {
    final upper = currency.toUpperCase();
    for (final country in supportedCountries) {
      if (country.currency == upper) return country.symbol;
    }
    return upper;
  }

  static String formatMoney(String currency, double amount) {
    final symbol = symbolForCurrency(currency);
    return '$symbol${amount.toStringAsFixed(2)}';
  }

  static double minimumWithdrawalForCurrency(String currency) {
    return convert(
      amount: minimumWithdrawalUsd,
      fromCurrency: 'USD',
      toCurrency: currency,
    );
  }
}
