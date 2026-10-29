import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_de.dart';
import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_it.dart';
import 'app_localizations_pt.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('de'),
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('it'),
    Locale('pt')
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'Bago'**
  String get appTitle;

  /// No description provided for @accountSettings.
  ///
  /// In en, this message translates to:
  /// **'Account Settings'**
  String get accountSettings;

  /// No description provided for @verificationStatus.
  ///
  /// In en, this message translates to:
  /// **'Verification Status'**
  String get verificationStatus;

  /// No description provided for @actionRequiredVerifyIdentity.
  ///
  /// In en, this message translates to:
  /// **'Action required: Verify identity'**
  String get actionRequiredVerifyIdentity;

  /// No description provided for @kycPassed.
  ///
  /// In en, this message translates to:
  /// **'KYC Passed'**
  String get kycPassed;

  /// No description provided for @profileSection.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profileSection;

  /// No description provided for @editProfile.
  ///
  /// In en, this message translates to:
  /// **'Edit Profile'**
  String get editProfile;

  /// No description provided for @paymentMethods.
  ///
  /// In en, this message translates to:
  /// **'Payment Methods'**
  String get paymentMethods;

  /// No description provided for @preferencesSection.
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get preferencesSection;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @biometricLogin.
  ///
  /// In en, this message translates to:
  /// **'Biometric Login'**
  String get biometricLogin;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @legalSection.
  ///
  /// In en, this message translates to:
  /// **'Legal'**
  String get legalSection;

  /// No description provided for @termsOfService.
  ///
  /// In en, this message translates to:
  /// **'Terms of Service'**
  String get termsOfService;

  /// No description provided for @privacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy'**
  String get privacyPolicy;

  /// No description provided for @deleteAccount.
  ///
  /// In en, this message translates to:
  /// **'Delete Account'**
  String get deleteAccount;

  /// No description provided for @biometricEnabledMessage.
  ///
  /// In en, this message translates to:
  /// **'Biometric login is now enabled.'**
  String get biometricEnabledMessage;

  /// No description provided for @biometricDisabledMessage.
  ///
  /// In en, this message translates to:
  /// **'Biometric login is now disabled.'**
  String get biometricDisabledMessage;

  /// No description provided for @languageSettingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get languageSettingsTitle;

  /// No description provided for @languageSettingsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Choose the language you want to use across the app.'**
  String get languageSettingsSubtitle;

  /// No description provided for @languageChangedMessage.
  ///
  /// In en, this message translates to:
  /// **'Language updated.'**
  String get languageChangedMessage;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageGerman.
  ///
  /// In en, this message translates to:
  /// **'German'**
  String get languageGerman;

  /// No description provided for @languageFrench.
  ///
  /// In en, this message translates to:
  /// **'French'**
  String get languageFrench;

  /// No description provided for @languageSpanish.
  ///
  /// In en, this message translates to:
  /// **'Spanish'**
  String get languageSpanish;

  /// No description provided for @languagePortuguese.
  ///
  /// In en, this message translates to:
  /// **'Portuguese'**
  String get languagePortuguese;

  /// No description provided for @languageItalian.
  ///
  /// In en, this message translates to:
  /// **'Italian'**
  String get languageItalian;

  /// No description provided for @emailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @emailHint.
  ///
  /// In en, this message translates to:
  /// **'you@example.com'**
  String get emailHint;

  /// No description provided for @passwordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get passwordLabel;

  /// No description provided for @passwordHint.
  ///
  /// In en, this message translates to:
  /// **'Your password'**
  String get passwordHint;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPassword;

  /// No description provided for @logIn.
  ///
  /// In en, this message translates to:
  /// **'Log In'**
  String get logIn;

  /// No description provided for @continueWithGoogle.
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueWithGoogle;

  /// No description provided for @continueWithEmail.
  ///
  /// In en, this message translates to:
  /// **'Continue with Email'**
  String get continueWithEmail;

  /// No description provided for @useBiometric.
  ///
  /// In en, this message translates to:
  /// **'Use Face ID / Fingerprint'**
  String get useBiometric;

  /// No description provided for @notMemberYet.
  ///
  /// In en, this message translates to:
  /// **'Not a member yet?'**
  String get notMemberYet;

  /// No description provided for @signUp.
  ///
  /// In en, this message translates to:
  /// **'Sign up'**
  String get signUp;

  /// No description provided for @pleaseFillAllFields.
  ///
  /// In en, this message translates to:
  /// **'Please fill in all fields'**
  String get pleaseFillAllFields;

  /// No description provided for @biometricAuthFailed.
  ///
  /// In en, this message translates to:
  /// **'Biometric authentication failed.'**
  String get biometricAuthFailed;

  /// No description provided for @pleaseEnterYourEmail.
  ///
  /// In en, this message translates to:
  /// **'Please enter your email'**
  String get pleaseEnterYourEmail;

  /// No description provided for @pleaseEnterYourPassword.
  ///
  /// In en, this message translates to:
  /// **'Please enter your password'**
  String get pleaseEnterYourPassword;

  /// No description provided for @signInToYourAccount.
  ///
  /// In en, this message translates to:
  /// **'Sign in to your account'**
  String get signInToYourAccount;

  /// No description provided for @choosePreferredMethod.
  ///
  /// In en, this message translates to:
  /// **'Choose your preferred method'**
  String get choosePreferredMethod;

  /// No description provided for @dontHaveAccount.
  ///
  /// In en, this message translates to:
  /// **'Don\'t have an account?'**
  String get dontHaveAccount;

  /// No description provided for @enterYourEmailTitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your email'**
  String get enterYourEmailTitle;

  /// No description provided for @verificationCodeMessage.
  ///
  /// In en, this message translates to:
  /// **'We\'ll send you a verification code'**
  String get verificationCodeMessage;

  /// No description provided for @enterYourPasswordTitle.
  ///
  /// In en, this message translates to:
  /// **'Enter your password'**
  String get enterYourPasswordTitle;

  /// No description provided for @keepYourAccountSecure.
  ///
  /// In en, this message translates to:
  /// **'Keep your account secure'**
  String get keepYourAccountSecure;

  /// No description provided for @forgotPasswordTitle.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPasswordTitle;

  /// No description provided for @forgotPasswordDescription.
  ///
  /// In en, this message translates to:
  /// **'Enter your email and we\'ll send you a link to reset your password.'**
  String get forgotPasswordDescription;

  /// No description provided for @emailAddressLabel.
  ///
  /// In en, this message translates to:
  /// **'Email address'**
  String get emailAddressLabel;

  /// No description provided for @emailRequired.
  ///
  /// In en, this message translates to:
  /// **'Email is required'**
  String get emailRequired;

  /// No description provided for @enterValidEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get enterValidEmail;

  /// No description provided for @sendResetLink.
  ///
  /// In en, this message translates to:
  /// **'Send Reset Link'**
  String get sendResetLink;

  /// No description provided for @checkYourInbox.
  ///
  /// In en, this message translates to:
  /// **'Check your inbox'**
  String get checkYourInbox;

  /// No description provided for @passwordResetEmailSent.
  ///
  /// In en, this message translates to:
  /// **'We sent a password reset link to {email}. Check your email and follow the instructions.'**
  String passwordResetEmailSent(Object email);

  /// No description provided for @backToSignIn.
  ///
  /// In en, this message translates to:
  /// **'Back to Sign In'**
  String get backToSignIn;

  /// No description provided for @resetPasswordTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset Password'**
  String get resetPasswordTitle;

  /// No description provided for @createNewPasswordTitle.
  ///
  /// In en, this message translates to:
  /// **'Create New Password'**
  String get createNewPasswordTitle;

  /// No description provided for @enterNewPasswordDescription.
  ///
  /// In en, this message translates to:
  /// **'Enter your new password below'**
  String get enterNewPasswordDescription;

  /// No description provided for @newPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'New Password'**
  String get newPasswordLabel;

  /// No description provided for @newPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Enter new password'**
  String get newPasswordHint;

  /// No description provided for @confirmPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Confirm Password'**
  String get confirmPasswordLabel;

  /// No description provided for @confirmPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Re-enter password'**
  String get confirmPasswordHint;

  /// No description provided for @passwordsDoNotMatch.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get passwordsDoNotMatch;

  /// No description provided for @passwordMinLength.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 8 characters'**
  String get passwordMinLength;

  /// No description provided for @passwordResetSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Password reset successfully'**
  String get passwordResetSuccessfully;

  /// No description provided for @resetPasswordButton.
  ///
  /// In en, this message translates to:
  /// **'Reset Password'**
  String get resetPasswordButton;

  /// No description provided for @onboardingSlide1Title.
  ///
  /// In en, this message translates to:
  /// **'Send on your terms'**
  String get onboardingSlide1Title;

  /// No description provided for @onboardingSlide1Description.
  ///
  /// In en, this message translates to:
  /// **'Connect with verified travelers heading your way for cost-effective shipping.'**
  String get onboardingSlide1Description;

  /// No description provided for @onboardingSlide2Title.
  ///
  /// In en, this message translates to:
  /// **'Turn miles into money'**
  String get onboardingSlide2Title;

  /// No description provided for @onboardingSlide2Description.
  ///
  /// In en, this message translates to:
  /// **'Monetize your empty space and deliver packages along your route.'**
  String get onboardingSlide2Description;

  /// No description provided for @onboardingSlide3Title.
  ///
  /// In en, this message translates to:
  /// **'Safe, verified, reliable'**
  String get onboardingSlide3Title;

  /// No description provided for @onboardingSlide3Description.
  ///
  /// In en, this message translates to:
  /// **'Bago uses community verification and real-time tracking to ensure every package is safe.'**
  String get onboardingSlide3Description;

  /// No description provided for @skip.
  ///
  /// In en, this message translates to:
  /// **'Skip'**
  String get skip;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create an account'**
  String get createAccount;

  /// No description provided for @signupStepEmailTitle.
  ///
  /// In en, this message translates to:
  /// **'What\'s your email?'**
  String get signupStepEmailTitle;

  /// No description provided for @checkingEmail.
  ///
  /// In en, this message translates to:
  /// **'Checking email...'**
  String get checkingEmail;

  /// No description provided for @emailAvailable.
  ///
  /// In en, this message translates to:
  /// **'Email is available'**
  String get emailAvailable;

  /// No description provided for @emailAlreadyExists.
  ///
  /// In en, this message translates to:
  /// **'This email already has an account'**
  String get emailAlreadyExists;

  /// No description provided for @availableEmailRequired.
  ///
  /// In en, this message translates to:
  /// **'Please enter an available email address.'**
  String get availableEmailRequired;

  /// No description provided for @signupRestartCountry.
  ///
  /// In en, this message translates to:
  /// **'Please restart signup and choose your country again.'**
  String get signupRestartCountry;

  /// No description provided for @signupStepNameTitle.
  ///
  /// In en, this message translates to:
  /// **'What\'s your name?'**
  String get signupStepNameTitle;

  /// No description provided for @firstNameHint.
  ///
  /// In en, this message translates to:
  /// **'First name'**
  String get firstNameHint;

  /// No description provided for @lastNameHint.
  ///
  /// In en, this message translates to:
  /// **'Last name'**
  String get lastNameHint;

  /// No description provided for @phoneNumberTitle.
  ///
  /// In en, this message translates to:
  /// **'Phone Number'**
  String get phoneNumberTitle;

  /// No description provided for @phoneDeliveryUpdates.
  ///
  /// In en, this message translates to:
  /// **'We\'ll use this for delivery updates.'**
  String get phoneDeliveryUpdates;

  /// No description provided for @phoneHint.
  ///
  /// In en, this message translates to:
  /// **'812 345 6789'**
  String get phoneHint;

  /// No description provided for @countryCodeSelected.
  ///
  /// In en, this message translates to:
  /// **'Country code {dialCode} selected for {country}.'**
  String countryCodeSelected(Object dialCode, Object country);

  /// No description provided for @dobTitle.
  ///
  /// In en, this message translates to:
  /// **'When were you born?'**
  String get dobTitle;

  /// No description provided for @securityTitle.
  ///
  /// In en, this message translates to:
  /// **'Security'**
  String get securityTitle;

  /// No description provided for @signupStepCountryTitle.
  ///
  /// In en, this message translates to:
  /// **'Where are you located?'**
  String get signupStepCountryTitle;

  /// No description provided for @countryCurrencyMethods.
  ///
  /// In en, this message translates to:
  /// **'This determines your currency and available payment methods.'**
  String get countryCurrencyMethods;

  /// No description provided for @selectedWalletSetup.
  ///
  /// In en, this message translates to:
  /// **'Selected wallet setup'**
  String get selectedWalletSetup;

  /// No description provided for @currencySelection.
  ///
  /// In en, this message translates to:
  /// **'Currency: {currency} ({symbol})'**
  String currencySelection(Object currency, Object symbol);

  /// No description provided for @verifyYourEmail.
  ///
  /// In en, this message translates to:
  /// **'Verify your email'**
  String get verifyYourEmail;

  /// No description provided for @sentSixDigitCode.
  ///
  /// In en, this message translates to:
  /// **'We\'ve sent a 6-digit code to {email}'**
  String sentSixDigitCode(Object email);

  /// No description provided for @resendCode.
  ///
  /// In en, this message translates to:
  /// **'Resend code'**
  String get resendCode;

  /// No description provided for @resendIn.
  ///
  /// In en, this message translates to:
  /// **'Resend in {seconds}s'**
  String resendIn(Object seconds);

  /// No description provided for @resend.
  ///
  /// In en, this message translates to:
  /// **'Resend'**
  String get resend;

  /// No description provided for @welcomeToBago.
  ///
  /// In en, this message translates to:
  /// **'Welcome to Bago!'**
  String get welcomeToBago;

  /// No description provided for @walletSetTo.
  ///
  /// In en, this message translates to:
  /// **'Your wallet has been set to {currency} ({symbol}0.00)'**
  String walletSetTo(Object currency, Object symbol);

  /// No description provided for @selectCountry.
  ///
  /// In en, this message translates to:
  /// **'Select country'**
  String get selectCountry;

  /// No description provided for @goToDashboard.
  ///
  /// In en, this message translates to:
  /// **'Go to Dashboard'**
  String get goToDashboard;

  /// No description provided for @orLabel.
  ///
  /// In en, this message translates to:
  /// **'OR'**
  String get orLabel;

  /// No description provided for @profileTabAboutYou.
  ///
  /// In en, this message translates to:
  /// **'About you'**
  String get profileTabAboutYou;

  /// No description provided for @profileTabAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get profileTabAccount;

  /// No description provided for @profileFallbackUser.
  ///
  /// In en, this message translates to:
  /// **'Bago User'**
  String get profileFallbackUser;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete account?'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountMessage.
  ///
  /// In en, this message translates to:
  /// **'This will permanently remove your Bago account and sign you out.'**
  String get deleteAccountMessage;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @roleSendPackages.
  ///
  /// In en, this message translates to:
  /// **'Send Packages'**
  String get roleSendPackages;

  /// No description provided for @roleEarnTraveler.
  ///
  /// In en, this message translates to:
  /// **'Earn as Traveler'**
  String get roleEarnTraveler;

  /// No description provided for @editPersonalDetails.
  ///
  /// In en, this message translates to:
  /// **'Edit personal details'**
  String get editPersonalDetails;

  /// No description provided for @identityVerification.
  ///
  /// In en, this message translates to:
  /// **'Identity Verification'**
  String get identityVerification;

  /// No description provided for @notSet.
  ///
  /// In en, this message translates to:
  /// **'Not set'**
  String get notSet;

  /// No description provided for @aboutYouSection.
  ///
  /// In en, this message translates to:
  /// **'About You'**
  String get aboutYouSection;

  /// No description provided for @addMiniBio.
  ///
  /// In en, this message translates to:
  /// **'Add a mini bio'**
  String get addMiniBio;

  /// No description provided for @highlyResponsiveReliable.
  ///
  /// In en, this message translates to:
  /// **'Highly responsive and reliable'**
  String get highlyResponsiveReliable;

  /// No description provided for @highlyRatedCommunity.
  ///
  /// In en, this message translates to:
  /// **'Highly rated by the Bago community'**
  String get highlyRatedCommunity;

  /// No description provided for @ratingsActivity.
  ///
  /// In en, this message translates to:
  /// **'Ratings & Activity'**
  String get ratingsActivity;

  /// No description provided for @ratingsLeft.
  ///
  /// In en, this message translates to:
  /// **'Ratings you\'ve left'**
  String get ratingsLeft;

  /// No description provided for @savedRoutes.
  ///
  /// In en, this message translates to:
  /// **'Saved routes'**
  String get savedRoutes;

  /// No description provided for @paymentsSection.
  ///
  /// In en, this message translates to:
  /// **'Payments'**
  String get paymentsSection;

  /// No description provided for @preferredCurrency.
  ///
  /// In en, this message translates to:
  /// **'Preferred currency: {currency}'**
  String preferredCurrency(Object currency);

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change password'**
  String get changePassword;

  /// No description provided for @payoutMethods.
  ///
  /// In en, this message translates to:
  /// **'Payout methods'**
  String get payoutMethods;

  /// No description provided for @paymentsRefunds.
  ///
  /// In en, this message translates to:
  /// **'Payments & refunds'**
  String get paymentsRefunds;

  /// No description provided for @supportLegal.
  ///
  /// In en, this message translates to:
  /// **'Support & Legal'**
  String get supportLegal;

  /// No description provided for @communicationPreferences.
  ///
  /// In en, this message translates to:
  /// **'Communication preferences'**
  String get communicationPreferences;

  /// No description provided for @helpSupport.
  ///
  /// In en, this message translates to:
  /// **'Help & support'**
  String get helpSupport;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign Out'**
  String get signOut;

  /// No description provided for @shipmentsTitle.
  ///
  /// In en, this message translates to:
  /// **'My Shipments'**
  String get shipmentsTitle;

  /// No description provided for @tripsTitle.
  ///
  /// In en, this message translates to:
  /// **'My Trips'**
  String get tripsTitle;

  /// No description provided for @activeTab.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get activeTab;

  /// No description provided for @historyTab.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get historyTab;

  /// No description provided for @nothingHereYet.
  ///
  /// In en, this message translates to:
  /// **'Nothing here yet'**
  String get nothingHereYet;

  /// No description provided for @shipmentsEmptySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Your shipments will appear here once you start using Bago.'**
  String get shipmentsEmptySubtitle;

  /// No description provided for @findTraveler.
  ///
  /// In en, this message translates to:
  /// **'Find a Traveler'**
  String get findTraveler;

  /// No description provided for @requestsSent.
  ///
  /// In en, this message translates to:
  /// **'Requests Sent'**
  String get requestsSent;

  /// No description provided for @requestHistory.
  ///
  /// In en, this message translates to:
  /// **'Request History'**
  String get requestHistory;

  /// No description provided for @requestsSentSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Requests you have sent to listed travelers.'**
  String get requestsSentSubtitle;

  /// No description provided for @requestHistorySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Completed and declined traveler requests.'**
  String get requestHistorySubtitle;

  /// No description provided for @myShipmentsSection.
  ///
  /// In en, this message translates to:
  /// **'My Shipments'**
  String get myShipmentsSection;

  /// No description provided for @shipmentHistory.
  ///
  /// In en, this message translates to:
  /// **'Shipment History'**
  String get shipmentHistory;

  /// No description provided for @myShipmentsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Packages you have created.'**
  String get myShipmentsSubtitle;

  /// No description provided for @shipmentHistorySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Completed and closed shipments.'**
  String get shipmentHistorySubtitle;

  /// No description provided for @pendingPayment.
  ///
  /// In en, this message translates to:
  /// **'Pending Payment'**
  String get pendingPayment;

  /// No description provided for @finishCheckoutShipment.
  ///
  /// In en, this message translates to:
  /// **'Finish checkout to send this shipment request.'**
  String get finishCheckoutShipment;

  /// No description provided for @resumeBefore.
  ///
  /// In en, this message translates to:
  /// **'Resume before {time}'**
  String resumeBefore(Object time);

  /// No description provided for @continueShipment.
  ///
  /// In en, this message translates to:
  /// **'Continue Shipment'**
  String get continueShipment;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @tripsEmptySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Your trips and incoming requests will appear here once travelers start sending requests.'**
  String get tripsEmptySubtitle;

  /// No description provided for @seeRequests.
  ///
  /// In en, this message translates to:
  /// **'See Requests'**
  String get seeRequests;

  /// No description provided for @incomingRequests.
  ///
  /// In en, this message translates to:
  /// **'Incoming Requests'**
  String get incomingRequests;

  /// No description provided for @incomingRequestsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Review package requests before accepting or rejecting them.'**
  String get incomingRequestsSubtitle;

  /// No description provided for @myTripsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Your published itineraries.'**
  String get myTripsSubtitle;

  /// No description provided for @tripHistory.
  ///
  /// In en, this message translates to:
  /// **'Trip History'**
  String get tripHistory;

  /// No description provided for @tripHistorySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Completed and closed trips.'**
  String get tripHistorySubtitle;

  /// No description provided for @deleteTripTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete trip?'**
  String get deleteTripTitle;

  /// No description provided for @deleteTripMessage.
  ///
  /// In en, this message translates to:
  /// **'This will remove the trip from your account.'**
  String get deleteTripMessage;

  /// No description provided for @tripDeletedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Trip deleted successfully'**
  String get tripDeletedSuccessfully;

  /// No description provided for @paymentReviewTitle.
  ///
  /// In en, this message translates to:
  /// **'Review & Pay'**
  String get paymentReviewTitle;

  /// No description provided for @noPendingShipmentPayment.
  ///
  /// In en, this message translates to:
  /// **'No pending shipment payment was found.'**
  String get noPendingShipmentPayment;

  /// No description provided for @shipmentCurrencyMissing.
  ///
  /// In en, this message translates to:
  /// **'Shipment currency is missing. Please restart the shipment flow from the traveler details page.'**
  String get shipmentCurrencyMissing;

  /// No description provided for @totalAmount.
  ///
  /// In en, this message translates to:
  /// **'Total Amount'**
  String get totalAmount;

  /// No description provided for @shippingFee.
  ///
  /// In en, this message translates to:
  /// **'Shipping Fee'**
  String get shippingFee;

  /// No description provided for @insurance.
  ///
  /// In en, this message translates to:
  /// **'Insurance'**
  String get insurance;

  /// No description provided for @route.
  ///
  /// In en, this message translates to:
  /// **'Route'**
  String get route;

  /// No description provided for @receiver.
  ///
  /// In en, this message translates to:
  /// **'Receiver'**
  String get receiver;

  /// No description provided for @receiverFallback.
  ///
  /// In en, this message translates to:
  /// **'Receiver'**
  String get receiverFallback;

  /// No description provided for @securePayment.
  ///
  /// In en, this message translates to:
  /// **'Secure payment'**
  String get securePayment;

  /// No description provided for @stripeSecureHelp.
  ///
  /// In en, this message translates to:
  /// **'Choose one of your saved cards or add a new one before paying.'**
  String get stripeSecureHelp;

  /// No description provided for @paymentMethod.
  ///
  /// In en, this message translates to:
  /// **'Payment Method'**
  String get paymentMethod;

  /// No description provided for @noSavedCardsYet.
  ///
  /// In en, this message translates to:
  /// **'No saved cards yet. Add a Visa or Mastercard to continue.'**
  String get noSavedCardsYet;

  /// No description provided for @shipmentPendingUntilConfirmed.
  ///
  /// In en, this message translates to:
  /// **'Your shipment stays pending until payment is confirmed.'**
  String get shipmentPendingUntilConfirmed;

  /// No description provided for @paymentDraftExpired.
  ///
  /// In en, this message translates to:
  /// **'This payment draft has expired and can no longer be completed.'**
  String get paymentDraftExpired;

  /// No description provided for @paymentCanBeResumedUntil.
  ///
  /// In en, this message translates to:
  /// **'Your pending shipment can be resumed until {time}.'**
  String paymentCanBeResumedUntil(Object time);

  /// No description provided for @pay.
  ///
  /// In en, this message translates to:
  /// **'Pay'**
  String get pay;

  /// No description provided for @processingPayment.
  ///
  /// In en, this message translates to:
  /// **'Processing payment'**
  String get processingPayment;

  /// No description provided for @addCardTitle.
  ///
  /// In en, this message translates to:
  /// **'Add Card'**
  String get addCardTitle;

  /// No description provided for @addCardDescription.
  ///
  /// In en, this message translates to:
  /// **'Enter your card details below. Only Visa and Mastercard are supported.'**
  String get addCardDescription;

  /// No description provided for @enterValidSupportedCard.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid Visa or Mastercard to continue.'**
  String get enterValidSupportedCard;

  /// No description provided for @savingCard.
  ///
  /// In en, this message translates to:
  /// **'Saving Card...'**
  String get savingCard;

  /// No description provided for @saveCard.
  ///
  /// In en, this message translates to:
  /// **'Save Card'**
  String get saveCard;

  /// No description provided for @manageAllCards.
  ///
  /// In en, this message translates to:
  /// **'Manage all cards'**
  String get manageAllCards;

  /// No description provided for @pickupLocation.
  ///
  /// In en, this message translates to:
  /// **'Pickup location'**
  String get pickupLocation;

  /// No description provided for @deliveryLocation.
  ///
  /// In en, this message translates to:
  /// **'Delivery location'**
  String get deliveryLocation;

  /// No description provided for @pickupCityPrompt.
  ///
  /// In en, this message translates to:
  /// **'What is your pickup city?'**
  String get pickupCityPrompt;

  /// No description provided for @sendingToPrompt.
  ///
  /// In en, this message translates to:
  /// **'Where are you sending to?'**
  String get sendingToPrompt;

  /// No description provided for @selectCitiesFirst.
  ///
  /// In en, this message translates to:
  /// **'Please select both departure and destination cities first.'**
  String get selectCitiesFirst;

  /// No description provided for @homeFallbackUser.
  ///
  /// In en, this message translates to:
  /// **'User'**
  String get homeFallbackUser;

  /// No description provided for @welcomeBackName.
  ///
  /// In en, this message translates to:
  /// **'Welcome back, {name}'**
  String welcomeBackName(Object name);

  /// No description provided for @homeSenderHeadline.
  ///
  /// In en, this message translates to:
  /// **'Send or receive items across borders'**
  String get homeSenderHeadline;

  /// No description provided for @homeCarrierSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Earn on your next trip with Bago'**
  String get homeCarrierSubtitle;

  /// No description provided for @homeSenderSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Fast, secure cross-border delivery'**
  String get homeSenderSubtitle;

  /// No description provided for @whatDoYouWantToDo.
  ///
  /// In en, this message translates to:
  /// **'What do you want to do?'**
  String get whatDoYouWantToDo;

  /// No description provided for @topDestination.
  ///
  /// In en, this message translates to:
  /// **'Top Destination'**
  String get topDestination;

  /// No description provided for @tripActivityShort.
  ///
  /// In en, this message translates to:
  /// **'Trip activity'**
  String get tripActivityShort;

  /// No description provided for @recentActivity.
  ///
  /// In en, this message translates to:
  /// **'Recent activity'**
  String get recentActivity;

  /// No description provided for @enterPickupCity.
  ///
  /// In en, this message translates to:
  /// **'Enter pickup city'**
  String get enterPickupCity;

  /// No description provided for @enterDestination.
  ///
  /// In en, this message translates to:
  /// **'Enter destination'**
  String get enterDestination;

  /// No description provided for @todayLabel.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get todayLabel;

  /// No description provided for @findTravelerButton.
  ///
  /// In en, this message translates to:
  /// **'Find Traveler'**
  String get findTravelerButton;

  /// No description provided for @earnedBalance.
  ///
  /// In en, this message translates to:
  /// **'EARNED BALANCE'**
  String get earnedBalance;

  /// No description provided for @publishNewItinerary.
  ///
  /// In en, this message translates to:
  /// **'Publish New Itinerary'**
  String get publishNewItinerary;

  /// No description provided for @globalLocationSearch.
  ///
  /// In en, this message translates to:
  /// **'Global Location Search'**
  String get globalLocationSearch;

  /// No description provided for @searchCityAirport.
  ///
  /// In en, this message translates to:
  /// **'Search for a city or airport to choose a location.'**
  String get searchCityAirport;

  /// No description provided for @selectDate.
  ///
  /// In en, this message translates to:
  /// **'Select Date'**
  String get selectDate;

  /// No description provided for @confirmDate.
  ///
  /// In en, this message translates to:
  /// **'Confirm Date'**
  String get confirmDate;

  /// No description provided for @yourTripActivity.
  ///
  /// In en, this message translates to:
  /// **'Your Trip Activity'**
  String get yourTripActivity;

  /// No description provided for @yourActivity.
  ///
  /// In en, this message translates to:
  /// **'Your activity'**
  String get yourActivity;

  /// No description provided for @loadingTrips.
  ///
  /// In en, this message translates to:
  /// **'Loading your trips...'**
  String get loadingTrips;

  /// No description provided for @loadingActivity.
  ///
  /// In en, this message translates to:
  /// **'Loading your activity...'**
  String get loadingActivity;

  /// No description provided for @shipmentsHistoryAvailable.
  ///
  /// In en, this message translates to:
  /// **'Your shipment history and requests sent to travelers are available in My Shipments.'**
  String get shipmentsHistoryAvailable;

  /// No description provided for @openMyShipments.
  ///
  /// In en, this message translates to:
  /// **'Open My Shipments'**
  String get openMyShipments;

  /// No description provided for @travelersAvailableToday.
  ///
  /// In en, this message translates to:
  /// **'8 travelers available for popular routes today'**
  String get travelersAvailableToday;

  /// No description provided for @serviceSendPackage.
  ///
  /// In en, this message translates to:
  /// **'Send Package'**
  String get serviceSendPackage;

  /// No description provided for @serviceBuyItems.
  ///
  /// In en, this message translates to:
  /// **'Buy Items'**
  String get serviceBuyItems;

  /// No description provided for @serviceGiftItems.
  ///
  /// In en, this message translates to:
  /// **'Gift Items'**
  String get serviceGiftItems;

  /// No description provided for @serviceSeeRequests.
  ///
  /// In en, this message translates to:
  /// **'See Requests'**
  String get serviceSeeRequests;

  /// No description provided for @servicePublishTrip.
  ///
  /// In en, this message translates to:
  /// **'Publish Trip'**
  String get servicePublishTrip;

  /// No description provided for @serviceMessages.
  ///
  /// In en, this message translates to:
  /// **'Messages'**
  String get serviceMessages;

  /// No description provided for @serviceSendPackageDesc.
  ///
  /// In en, this message translates to:
  /// **'Send items across borders easily.'**
  String get serviceSendPackageDesc;

  /// No description provided for @serviceBuyItemsDesc.
  ///
  /// In en, this message translates to:
  /// **'Ask a traveler to shop for you.'**
  String get serviceBuyItemsDesc;

  /// No description provided for @serviceGiftItemsDesc.
  ///
  /// In en, this message translates to:
  /// **'Send something special to someone.'**
  String get serviceGiftItemsDesc;

  /// No description provided for @serviceSeeRequestsDesc.
  ///
  /// In en, this message translates to:
  /// **'Review shipment requests waiting for you.'**
  String get serviceSeeRequestsDesc;

  /// No description provided for @servicePublishTripDesc.
  ///
  /// In en, this message translates to:
  /// **'Create a new itinerary for travelers.'**
  String get servicePublishTripDesc;

  /// No description provided for @serviceMessagesDesc.
  ///
  /// In en, this message translates to:
  /// **'Keep shipment chats in one place.'**
  String get serviceMessagesDesc;

  /// No description provided for @tripDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Trip Details'**
  String get tripDetailsTitle;

  /// No description provided for @couldNotLoadTrip.
  ///
  /// In en, this message translates to:
  /// **'Could not load this trip.'**
  String get couldNotLoadTrip;

  /// No description provided for @statusLabel.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get statusLabel;

  /// No description provided for @travelTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'Travel type'**
  String get travelTypeLabel;

  /// No description provided for @departureLabel.
  ///
  /// In en, this message translates to:
  /// **'Departure'**
  String get departureLabel;

  /// No description provided for @capacityLabel.
  ///
  /// In en, this message translates to:
  /// **'Capacity'**
  String get capacityLabel;

  /// No description provided for @priceLabel.
  ///
  /// In en, this message translates to:
  /// **'Price'**
  String get priceLabel;

  /// No description provided for @approxInCurrency.
  ///
  /// In en, this message translates to:
  /// **'≈ In {currency}'**
  String approxInCurrency(Object currency);

  /// No description provided for @tripProofLabel.
  ///
  /// In en, this message translates to:
  /// **'Trip proof'**
  String get tripProofLabel;

  /// No description provided for @uploaded.
  ///
  /// In en, this message translates to:
  /// **'Uploaded'**
  String get uploaded;

  /// No description provided for @missing.
  ///
  /// In en, this message translates to:
  /// **'Missing'**
  String get missing;

  /// No description provided for @tripEditApprovalMessage.
  ///
  /// In en, this message translates to:
  /// **'Editing this trip sends it to the support team again for approval. Upload updated proof if your ticket or booking changed.'**
  String get tripEditApprovalMessage;

  /// No description provided for @tripMissingReference.
  ///
  /// In en, this message translates to:
  /// **'This trip is missing its details reference. Please refresh and try again.'**
  String get tripMissingReference;

  /// No description provided for @editTrip.
  ///
  /// In en, this message translates to:
  /// **'Edit Trip'**
  String get editTrip;

  /// No description provided for @deleteTrip.
  ///
  /// In en, this message translates to:
  /// **'Delete Trip'**
  String get deleteTrip;

  /// No description provided for @shipmentDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Shipment Details'**
  String get shipmentDetailsTitle;

  /// No description provided for @couldNotLoadShipment.
  ///
  /// In en, this message translates to:
  /// **'Could not load shipment'**
  String get couldNotLoadShipment;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @shippingPdfTitle.
  ///
  /// In en, this message translates to:
  /// **'Shipping PDF'**
  String get shippingPdfTitle;

  /// No description provided for @shippingPdfDescription.
  ///
  /// In en, this message translates to:
  /// **'Create a branded A4 document with QR tracking, timeline, and shipment details.'**
  String get shippingPdfDescription;

  /// No description provided for @previewPrint.
  ///
  /// In en, this message translates to:
  /// **'Preview / Print'**
  String get previewPrint;

  /// No description provided for @shareSavePdf.
  ///
  /// In en, this message translates to:
  /// **'Share / Save PDF'**
  String get shareSavePdf;

  /// No description provided for @feedbackSubmittedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Feedback submitted successfully.'**
  String get feedbackSubmittedSuccessfully;

  /// No description provided for @leaveFeedback.
  ///
  /// In en, this message translates to:
  /// **'Leave feedback'**
  String get leaveFeedback;

  /// No description provided for @rateTravelerNote.
  ///
  /// In en, this message translates to:
  /// **'Rate the traveler and leave a short note for other users.'**
  String get rateTravelerNote;

  /// No description provided for @shareYourExperience.
  ///
  /// In en, this message translates to:
  /// **'Share your experience...'**
  String get shareYourExperience;

  /// No description provided for @submitFeedback.
  ///
  /// In en, this message translates to:
  /// **'Submit feedback'**
  String get submitFeedback;

  /// No description provided for @fromLabel.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get fromLabel;

  /// No description provided for @toLabel.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get toLabel;

  /// No description provided for @packageDetailsTitle.
  ///
  /// In en, this message translates to:
  /// **'Package Details'**
  String get packageDetailsTitle;

  /// No description provided for @weightLabel.
  ///
  /// In en, this message translates to:
  /// **'Weight'**
  String get weightLabel;

  /// No description provided for @declaredValueLabel.
  ///
  /// In en, this message translates to:
  /// **'Declared Value'**
  String get declaredValueLabel;

  /// No description provided for @yesLabel.
  ///
  /// In en, this message translates to:
  /// **'Yes'**
  String get yesLabel;

  /// No description provided for @noLabel.
  ///
  /// In en, this message translates to:
  /// **'No'**
  String get noLabel;

  /// No description provided for @descriptionLabel.
  ///
  /// In en, this message translates to:
  /// **'Description'**
  String get descriptionLabel;

  /// No description provided for @senderLabel.
  ///
  /// In en, this message translates to:
  /// **'Sender'**
  String get senderLabel;

  /// No description provided for @travelerLabel.
  ///
  /// In en, this message translates to:
  /// **'Traveler'**
  String get travelerLabel;

  /// No description provided for @paymentLabel.
  ///
  /// In en, this message translates to:
  /// **'Payment'**
  String get paymentLabel;

  /// No description provided for @pickupDateLabel.
  ///
  /// In en, this message translates to:
  /// **'Pickup Date'**
  String get pickupDateLabel;

  /// No description provided for @deliveryDateLabel.
  ///
  /// In en, this message translates to:
  /// **'Delivery Date'**
  String get deliveryDateLabel;

  /// No description provided for @estimatedDepartureLabel.
  ///
  /// In en, this message translates to:
  /// **'Estimated Departure'**
  String get estimatedDepartureLabel;

  /// No description provided for @estimatedArrivalLabel.
  ///
  /// In en, this message translates to:
  /// **'Estimated Arrival'**
  String get estimatedArrivalLabel;

  /// No description provided for @addressesTitle.
  ///
  /// In en, this message translates to:
  /// **'Addresses'**
  String get addressesTitle;

  /// No description provided for @pickupLabel.
  ///
  /// In en, this message translates to:
  /// **'Pickup'**
  String get pickupLabel;

  /// No description provided for @deliveryLabel.
  ///
  /// In en, this message translates to:
  /// **'Delivery'**
  String get deliveryLabel;

  /// No description provided for @nameLabel.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get nameLabel;

  /// No description provided for @phoneLabel.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get phoneLabel;

  /// No description provided for @itemImagesLabel.
  ///
  /// In en, this message translates to:
  /// **'Item Images'**
  String get itemImagesLabel;

  /// No description provided for @notProvidedLabel.
  ///
  /// In en, this message translates to:
  /// **'Not provided'**
  String get notProvidedLabel;

  /// No description provided for @receiverInfo.
  ///
  /// In en, this message translates to:
  /// **'Receiver Information'**
  String get receiverInfo;

  /// No description provided for @escrowLabel.
  ///
  /// In en, this message translates to:
  /// **'Escrow Balance'**
  String get escrowLabel;

  /// No description provided for @trackingNumberTitle.
  ///
  /// In en, this message translates to:
  /// **'Tracking Number'**
  String get trackingNumberTitle;

  /// No description provided for @copiedToClipboard.
  ///
  /// In en, this message translates to:
  /// **'Copied to clipboard'**
  String get copiedToClipboard;

  /// No description provided for @totalPriceTitle.
  ///
  /// In en, this message translates to:
  /// **'Total Price'**
  String get totalPriceTitle;

  /// No description provided for @feedbackCardDescription.
  ///
  /// In en, this message translates to:
  /// **'Rate the traveler and add a short comment to help other senders.'**
  String get feedbackCardDescription;

  /// No description provided for @downloadPdf.
  ///
  /// In en, this message translates to:
  /// **'Download PDF'**
  String get downloadPdf;

  /// No description provided for @goBack.
  ///
  /// In en, this message translates to:
  /// **'Go back'**
  String get goBack;

  /// No description provided for @searchResultsTitle.
  ///
  /// In en, this message translates to:
  /// **'Search Results'**
  String get searchResultsTitle;

  /// No description provided for @tripsFoundCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {1 trip found} other {{count} trips found}}'**
  String tripsFoundCount(int count);

  /// No description provided for @anyLabel.
  ///
  /// In en, this message translates to:
  /// **'Any'**
  String get anyLabel;

  /// No description provided for @noTripsFound.
  ///
  /// In en, this message translates to:
  /// **'No trips found'**
  String get noTripsFound;

  /// No description provided for @tryAdjustingSearch.
  ///
  /// In en, this message translates to:
  /// **'Try adjusting your search'**
  String get tryAdjustingSearch;

  /// No description provided for @searchAgain.
  ///
  /// In en, this message translates to:
  /// **'Search again'**
  String get searchAgain;

  /// No description provided for @selectBothCitiesFirst.
  ///
  /// In en, this message translates to:
  /// **'Select both cities first'**
  String get selectBothCitiesFirst;

  /// No description provided for @searchRequiresCities.
  ///
  /// In en, this message translates to:
  /// **'Trip search only shows results after you choose a departure and destination city.'**
  String get searchRequiresCities;

  /// No description provided for @passKycBeforeShipment.
  ///
  /// In en, this message translates to:
  /// **'Please pass KYC before creating a shipment.'**
  String get passKycBeforeShipment;

  /// No description provided for @kgAvailable.
  ///
  /// In en, this message translates to:
  /// **'{kg} kg available'**
  String kgAvailable(Object kg);

  /// No description provided for @sendWithThisCarrier.
  ///
  /// In en, this message translates to:
  /// **'Send with this carrier'**
  String get sendWithThisCarrier;

  /// No description provided for @sendWithThisTraveler.
  ///
  /// In en, this message translates to:
  /// **'Send with this Traveler'**
  String get sendWithThisTraveler;

  /// No description provided for @sendPackageTitle.
  ///
  /// In en, this message translates to:
  /// **'Send a Package'**
  String get sendPackageTitle;

  /// No description provided for @findTravelerForRoute.
  ///
  /// In en, this message translates to:
  /// **'Find a traveler for your route'**
  String get findTravelerForRoute;

  /// No description provided for @selectPickupAndDelivery.
  ///
  /// In en, this message translates to:
  /// **'Please select pickup and delivery locations.'**
  String get selectPickupAndDelivery;

  /// No description provided for @anyDate.
  ///
  /// In en, this message translates to:
  /// **'Any date'**
  String get anyDate;

  /// No description provided for @findYourTravelerTitle.
  ///
  /// In en, this message translates to:
  /// **'Find your traveler'**
  String get findYourTravelerTitle;

  /// No description provided for @findYourTravelerDescription.
  ///
  /// In en, this message translates to:
  /// **'Enter your pickup and delivery locations above, then tap Find Traveler to see who\'s heading your way.'**
  String get findYourTravelerDescription;

  /// No description provided for @setPreferredCurrencyTitle.
  ///
  /// In en, this message translates to:
  /// **'Set your preferred currency'**
  String get setPreferredCurrencyTitle;

  /// No description provided for @needWalletCurrency.
  ///
  /// In en, this message translates to:
  /// **'We need your wallet currency to price this shipment correctly.'**
  String get needWalletCurrency;

  /// No description provided for @rateLabel.
  ///
  /// In en, this message translates to:
  /// **'Rate'**
  String get rateLabel;

  /// No description provided for @paymentFailedTitle.
  ///
  /// In en, this message translates to:
  /// **'Payment Failed'**
  String get paymentFailedTitle;

  /// No description provided for @draftAvailableUntil.
  ///
  /// In en, this message translates to:
  /// **'Your shipment draft stays available until {time}.'**
  String draftAvailableUntil(Object time);

  /// No description provided for @continuePayment.
  ///
  /// In en, this message translates to:
  /// **'Continue Payment'**
  String get continuePayment;

  /// No description provided for @deleteDraft.
  ///
  /// In en, this message translates to:
  /// **'Delete Draft'**
  String get deleteDraft;

  /// No description provided for @backToMyShipments.
  ///
  /// In en, this message translates to:
  /// **'Back to My Shipments'**
  String get backToMyShipments;

  /// No description provided for @paymentNotCompleted.
  ///
  /// In en, this message translates to:
  /// **'Your payment was not completed.'**
  String get paymentNotCompleted;

  /// No description provided for @insufficientFundsMessage.
  ///
  /// In en, this message translates to:
  /// **'Your card has insufficient funds. Try another card or contact your bank.'**
  String get insufficientFundsMessage;

  /// No description provided for @cardDeclinedMessage.
  ///
  /// In en, this message translates to:
  /// **'Your bank declined this card. Try another card or contact your bank.'**
  String get cardDeclinedMessage;

  /// No description provided for @incorrectCvcMessage.
  ///
  /// In en, this message translates to:
  /// **'The security code is incorrect. Please check it and try again.'**
  String get incorrectCvcMessage;

  /// No description provided for @expiredCardMessage.
  ///
  /// In en, this message translates to:
  /// **'This card has expired. Please use a different card.'**
  String get expiredCardMessage;

  /// No description provided for @incorrectNumberMessage.
  ///
  /// In en, this message translates to:
  /// **'The card number looks incorrect. Please check it and try again.'**
  String get incorrectNumberMessage;

  /// No description provided for @bankVerificationMessage.
  ///
  /// In en, this message translates to:
  /// **'This card needs bank verification. Please continue and complete the verification in the app.'**
  String get bankVerificationMessage;

  /// No description provided for @processingErrorMessage.
  ///
  /// In en, this message translates to:
  /// **'We could not process this card right now. Please try again in a moment.'**
  String get processingErrorMessage;

  /// No description provided for @paymentCancelledMessage.
  ///
  /// In en, this message translates to:
  /// **'Payment was cancelled before it could be completed.'**
  String get paymentCancelledMessage;

  /// No description provided for @paymentCouldNotCompleteGeneric.
  ///
  /// In en, this message translates to:
  /// **'Your payment could not be completed. Please try again or use a different card.'**
  String get paymentCouldNotCompleteGeneric;

  /// No description provided for @shipmentRequestedTitle.
  ///
  /// In en, this message translates to:
  /// **'Shipment Requested!'**
  String get shipmentRequestedTitle;

  /// No description provided for @shipmentCreatedSentTraveler.
  ///
  /// In en, this message translates to:
  /// **'Your shipment has been created and sent to the selected traveler.'**
  String get shipmentCreatedSentTraveler;

  /// No description provided for @paymentReferenceValue.
  ///
  /// In en, this message translates to:
  /// **'Payment reference: {reference}'**
  String paymentReferenceValue(Object reference);

  /// No description provided for @viewShipments.
  ///
  /// In en, this message translates to:
  /// **'View Shipments'**
  String get viewShipments;

  /// No description provided for @backToHome.
  ///
  /// In en, this message translates to:
  /// **'Back to Home'**
  String get backToHome;

  /// No description provided for @trackShipmentTitle.
  ///
  /// In en, this message translates to:
  /// **'Track Shipment'**
  String get trackShipmentTitle;

  /// No description provided for @trackYourPackage.
  ///
  /// In en, this message translates to:
  /// **'Track Your Package'**
  String get trackYourPackage;

  /// No description provided for @enterTrackingNumberPrompt.
  ///
  /// In en, this message translates to:
  /// **'Enter your tracking number to find your package'**
  String get enterTrackingNumberPrompt;

  /// No description provided for @enterTrackingNumberMessage.
  ///
  /// In en, this message translates to:
  /// **'Please enter a tracking number'**
  String get enterTrackingNumberMessage;

  /// No description provided for @trackingNumberLabel.
  ///
  /// In en, this message translates to:
  /// **'Tracking Number'**
  String get trackingNumberLabel;

  /// No description provided for @searchButton.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get searchButton;

  /// No description provided for @searchAnother.
  ///
  /// In en, this message translates to:
  /// **'Search Another'**
  String get searchAnother;

  /// No description provided for @unknownLabel.
  ///
  /// In en, this message translates to:
  /// **'Unknown'**
  String get unknownLabel;

  /// No description provided for @unknownSender.
  ///
  /// In en, this message translates to:
  /// **'Unknown Sender'**
  String get unknownSender;

  /// No description provided for @unknownReceiver.
  ///
  /// In en, this message translates to:
  /// **'Unknown Receiver'**
  String get unknownReceiver;

  /// No description provided for @currentStatusTitle.
  ///
  /// In en, this message translates to:
  /// **'Current Status'**
  String get currentStatusTitle;

  /// No description provided for @originLabel.
  ///
  /// In en, this message translates to:
  /// **'Origin'**
  String get originLabel;

  /// No description provided for @destinationLabel.
  ///
  /// In en, this message translates to:
  /// **'Destination'**
  String get destinationLabel;

  /// No description provided for @currentLocationLabel.
  ///
  /// In en, this message translates to:
  /// **'Current Location'**
  String get currentLocationLabel;

  /// No description provided for @estimatedDeliveryLabel.
  ///
  /// In en, this message translates to:
  /// **'Estimated Delivery'**
  String get estimatedDeliveryLabel;

  /// No description provided for @pendingLabel.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get pendingLabel;

  /// No description provided for @pickedUpLabel.
  ///
  /// In en, this message translates to:
  /// **'Picked Up'**
  String get pickedUpLabel;

  /// No description provided for @inTransitLabel.
  ///
  /// In en, this message translates to:
  /// **'In Transit'**
  String get inTransitLabel;

  /// No description provided for @outForDeliveryLabel.
  ///
  /// In en, this message translates to:
  /// **'Out for Delivery'**
  String get outForDeliveryLabel;

  /// No description provided for @deliveredLabel.
  ///
  /// In en, this message translates to:
  /// **'Delivered'**
  String get deliveredLabel;

  /// No description provided for @tripRouteOrigin.
  ///
  /// In en, this message translates to:
  /// **'Origin'**
  String get tripRouteOrigin;

  /// No description provided for @tripRouteDestination.
  ///
  /// In en, this message translates to:
  /// **'Destination'**
  String get tripRouteDestination;

  /// No description provided for @travelModeFlight.
  ///
  /// In en, this message translates to:
  /// **'Flight'**
  String get travelModeFlight;

  /// No description provided for @travelModeBus.
  ///
  /// In en, this message translates to:
  /// **'Bus'**
  String get travelModeBus;

  /// No description provided for @travelModeTrain.
  ///
  /// In en, this message translates to:
  /// **'Train'**
  String get travelModeTrain;

  /// No description provided for @travelModeCar.
  ///
  /// In en, this message translates to:
  /// **'Car'**
  String get travelModeCar;

  /// No description provided for @travelModeShip.
  ///
  /// In en, this message translates to:
  /// **'Ship'**
  String get travelModeShip;

  /// No description provided for @setWalletCurrencyTitle.
  ///
  /// In en, this message translates to:
  /// **'Set Wallet Currency'**
  String get setWalletCurrencyTitle;

  /// No description provided for @chooseWalletCurrencyDescription.
  ///
  /// In en, this message translates to:
  /// **'Choose the currency you want to use for earnings and trip pricing.'**
  String get chooseWalletCurrencyDescription;

  /// No description provided for @confirmCurrency.
  ///
  /// In en, this message translates to:
  /// **'Confirm currency'**
  String get confirmCurrency;

  /// No description provided for @acceptTermsToContinue.
  ///
  /// In en, this message translates to:
  /// **'Please accept the terms to continue.'**
  String get acceptTermsToContinue;

  /// No description provided for @identityVerificationRequiredTrip.
  ///
  /// In en, this message translates to:
  /// **'Identity verification required before posting a trip.'**
  String get identityVerificationRequiredTrip;

  /// No description provided for @selectDepartureCity.
  ///
  /// In en, this message translates to:
  /// **'Please select a departure city.'**
  String get selectDepartureCity;

  /// No description provided for @selectDestinationCity.
  ///
  /// In en, this message translates to:
  /// **'Please select a destination city.'**
  String get selectDestinationCity;

  /// No description provided for @departureDestinationDifferent.
  ///
  /// In en, this message translates to:
  /// **'Departure and destination must be different cities.'**
  String get departureDestinationDifferent;

  /// No description provided for @selectTravelDate.
  ///
  /// In en, this message translates to:
  /// **'Please select a travel date.'**
  String get selectTravelDate;

  /// No description provided for @setDepartureTime.
  ///
  /// In en, this message translates to:
  /// **'Please set a departure time.'**
  String get setDepartureTime;

  /// No description provided for @uploadTripProofContinue.
  ///
  /// In en, this message translates to:
  /// **'Please upload proof of this trip before continuing.'**
  String get uploadTripProofContinue;

  /// No description provided for @enterPricePerKg.
  ///
  /// In en, this message translates to:
  /// **'Please enter a price per kg.'**
  String get enterPricePerKg;

  /// No description provided for @chooseTravelType.
  ///
  /// In en, this message translates to:
  /// **'Please choose a travel type.'**
  String get chooseTravelType;

  /// No description provided for @uploadProofOfTrip.
  ///
  /// In en, this message translates to:
  /// **'Please upload proof of this trip.'**
  String get uploadProofOfTrip;

  /// No description provided for @capacityAtLeastOneKg.
  ///
  /// In en, this message translates to:
  /// **'Available capacity must be at least 1 kg.'**
  String get capacityAtLeastOneKg;

  /// No description provided for @validPricePerKg.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid price per kg.'**
  String get validPricePerKg;

  /// No description provided for @noWalletCurrencySet.
  ///
  /// In en, this message translates to:
  /// **'No wallet currency set. Please update your profile currency before posting a trip.'**
  String get noWalletCurrencySet;

  /// No description provided for @uploadProofTitle.
  ///
  /// In en, this message translates to:
  /// **'Upload Proof'**
  String get uploadProofTitle;

  /// No description provided for @jpegPdfMaxSize.
  ///
  /// In en, this message translates to:
  /// **'JPEG or PDF · max 2 MB'**
  String get jpegPdfMaxSize;

  /// No description provided for @choosePhoto.
  ///
  /// In en, this message translates to:
  /// **'Choose Photo'**
  String get choosePhoto;

  /// No description provided for @jpegFromGallery.
  ///
  /// In en, this message translates to:
  /// **'JPEG from your gallery'**
  String get jpegFromGallery;

  /// No description provided for @choosePdf.
  ///
  /// In en, this message translates to:
  /// **'Choose PDF'**
  String get choosePdf;

  /// No description provided for @boardingPassBooking.
  ///
  /// In en, this message translates to:
  /// **'Boarding pass or booking confirmation'**
  String get boardingPassBooking;

  /// No description provided for @fileTooLargeUnder2mb.
  ///
  /// In en, this message translates to:
  /// **'File is too large. Please choose a file under 2 MB.'**
  String get fileTooLargeUnder2mb;

  /// No description provided for @postTripTitle.
  ///
  /// In en, this message translates to:
  /// **'Post a Trip'**
  String get postTripTitle;

  /// No description provided for @departureLabelShort.
  ///
  /// In en, this message translates to:
  /// **'Departure'**
  String get departureLabelShort;

  /// No description provided for @destinationLabelShort.
  ///
  /// In en, this message translates to:
  /// **'Destination'**
  String get destinationLabelShort;

  /// No description provided for @saveChanges.
  ///
  /// In en, this message translates to:
  /// **'Save Changes'**
  String get saveChanges;

  /// No description provided for @publishTripAction.
  ///
  /// In en, this message translates to:
  /// **'Publish Trip'**
  String get publishTripAction;

  /// No description provided for @continueLabel.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueLabel;

  /// No description provided for @departureCityTitle.
  ///
  /// In en, this message translates to:
  /// **'Departure City'**
  String get departureCityTitle;

  /// No description provided for @departureCitySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Where are you travelling from?'**
  String get departureCitySubtitle;

  /// No description provided for @destinationCityTitle.
  ///
  /// In en, this message translates to:
  /// **'Destination City'**
  String get destinationCityTitle;

  /// No description provided for @destinationCitySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Where are you heading to?'**
  String get destinationCitySubtitle;

  /// No description provided for @tripUpdatedTitle.
  ///
  /// In en, this message translates to:
  /// **'Trip Updated!'**
  String get tripUpdatedTitle;

  /// No description provided for @tripSubmittedTitle.
  ///
  /// In en, this message translates to:
  /// **'Trip Submitted!'**
  String get tripSubmittedTitle;

  /// No description provided for @statusPendingReview.
  ///
  /// In en, this message translates to:
  /// **'STATUS: PENDING REVIEW'**
  String get statusPendingReview;

  /// No description provided for @tripUpdatedApproval.
  ///
  /// In en, this message translates to:
  /// **'Your trip to {destination} has been updated and sent back to the support team for approval.'**
  String tripUpdatedApproval(Object destination);

  /// No description provided for @tripSubmittedApproval.
  ///
  /// In en, this message translates to:
  /// **'Your trip to {destination} has been submitted with proof and is now waiting for support team approval.'**
  String tripSubmittedApproval(Object destination);

  /// No description provided for @ticketProofAttached.
  ///
  /// In en, this message translates to:
  /// **'Ticket proof attached for review'**
  String get ticketProofAttached;

  /// No description provided for @pendingSupportApproval.
  ///
  /// In en, this message translates to:
  /// **'Pending support team approval'**
  String get pendingSupportApproval;

  /// No description provided for @goToMyTrips.
  ///
  /// In en, this message translates to:
  /// **'Go to My Trips'**
  String get goToMyTrips;

  /// No description provided for @almostThere.
  ///
  /// In en, this message translates to:
  /// **'Almost there!'**
  String get almostThere;

  /// No description provided for @reviewGuidelinesBeforePosting.
  ///
  /// In en, this message translates to:
  /// **'Please review and accept our community guidelines before posting your trip.'**
  String get reviewGuidelinesBeforePosting;

  /// No description provided for @verifyIdentityAndAgreeTerms.
  ///
  /// In en, this message translates to:
  /// **'Before posting, we need to verify your identity and ensure you agree to our safety and legal terms.'**
  String get verifyIdentityAndAgreeTerms;

  /// No description provided for @identityVerificationKyc.
  ///
  /// In en, this message translates to:
  /// **'Identity Verification (KYC)'**
  String get identityVerificationKyc;

  /// No description provided for @requiredToPostTrip.
  ///
  /// In en, this message translates to:
  /// **'Required to post a trip'**
  String get requiredToPostTrip;

  /// No description provided for @changePasswordTitle.
  ///
  /// In en, this message translates to:
  /// **'Update Your Password'**
  String get changePasswordTitle;

  /// No description provided for @changePasswordDescription.
  ///
  /// In en, this message translates to:
  /// **'Enter your current password and choose a new one. If you signed in with Google or don\'t know your current password, send yourself a reset link instead.'**
  String get changePasswordDescription;

  /// No description provided for @currentPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Current Password'**
  String get currentPasswordLabel;

  /// No description provided for @currentPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Enter current password'**
  String get currentPasswordHint;

  /// No description provided for @confirmNewPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Confirm New Password'**
  String get confirmNewPasswordLabel;

  /// No description provided for @confirmNewPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'Re-enter new password'**
  String get confirmNewPasswordHint;

  /// No description provided for @newPasswordMustDiffer.
  ///
  /// In en, this message translates to:
  /// **'New password must be different from current password'**
  String get newPasswordMustDiffer;

  /// No description provided for @passwordChangedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Password changed successfully'**
  String get passwordChangedSuccessfully;

  /// No description provided for @resetByEmailUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Reset by email unavailable'**
  String get resetByEmailUnavailable;

  /// No description provided for @forgotCurrentPasswordReset.
  ///
  /// In en, this message translates to:
  /// **'Forgot current password? Reset by email'**
  String get forgotCurrentPasswordReset;

  /// No description provided for @changeEmailTitle.
  ///
  /// In en, this message translates to:
  /// **'Change Email'**
  String get changeEmailTitle;

  /// No description provided for @updateYourEmail.
  ///
  /// In en, this message translates to:
  /// **'Update your email'**
  String get updateYourEmail;

  /// No description provided for @changeEmailDescription.
  ///
  /// In en, this message translates to:
  /// **'Enter the new email address you\'d like to use. You\'ll need to verify it with an OTP.'**
  String get changeEmailDescription;

  /// No description provided for @newEmailAddressLabel.
  ///
  /// In en, this message translates to:
  /// **'New Email Address'**
  String get newEmailAddressLabel;

  /// No description provided for @sendVerificationCode.
  ///
  /// In en, this message translates to:
  /// **'Send Verification Code'**
  String get sendVerificationCode;

  /// No description provided for @verifyItsYou.
  ///
  /// In en, this message translates to:
  /// **'Verify it\'s you'**
  String get verifyItsYou;

  /// No description provided for @weSentCodeToPrefix.
  ///
  /// In en, this message translates to:
  /// **'We\'ve sent a code to '**
  String get weSentCodeToPrefix;

  /// No description provided for @weSentCodeToSuffix.
  ///
  /// In en, this message translates to:
  /// **'. Enter it below to confirm the change.'**
  String get weSentCodeToSuffix;

  /// No description provided for @verificationCodeLabel.
  ///
  /// In en, this message translates to:
  /// **'Verification Code'**
  String get verificationCodeLabel;

  /// No description provided for @updateEmailAddress.
  ///
  /// In en, this message translates to:
  /// **'Update Email Address'**
  String get updateEmailAddress;

  /// No description provided for @changeEmailAddress.
  ///
  /// In en, this message translates to:
  /// **'Change email address'**
  String get changeEmailAddress;

  /// No description provided for @enterValidEmailAddress.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid email address.'**
  String get enterValidEmailAddress;

  /// No description provided for @verificationCodeSentTo.
  ///
  /// In en, this message translates to:
  /// **'Verification code sent to {value}'**
  String verificationCodeSentTo(Object value);

  /// No description provided for @enterVerificationCodePrompt.
  ///
  /// In en, this message translates to:
  /// **'Please enter the verification code.'**
  String get enterVerificationCodePrompt;

  /// No description provided for @emailUpdatedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Email updated successfully!'**
  String get emailUpdatedSuccessfully;

  /// No description provided for @changePhoneNumberTitle.
  ///
  /// In en, this message translates to:
  /// **'Change Phone Number'**
  String get changePhoneNumberTitle;

  /// No description provided for @updateYourPhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Update your phone number'**
  String get updateYourPhoneNumber;

  /// No description provided for @changePhoneDescription.
  ///
  /// In en, this message translates to:
  /// **'Enter the new phone number you want to use. We will send a verification code to {email} to confirm the change.'**
  String changePhoneDescription(Object email);

  /// No description provided for @newPhoneNumberLabel.
  ///
  /// In en, this message translates to:
  /// **'New Phone Number'**
  String get newPhoneNumberLabel;

  /// No description provided for @enterValidPhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid phone number.'**
  String get enterValidPhoneNumber;

  /// No description provided for @phoneNumberUpdatedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Phone number updated successfully!'**
  String get phoneNumberUpdatedSuccessfully;

  /// No description provided for @confirmFromYourEmail.
  ///
  /// In en, this message translates to:
  /// **'Confirm from your email'**
  String get confirmFromYourEmail;

  /// No description provided for @weSentVerificationCodeToPrefix.
  ///
  /// In en, this message translates to:
  /// **'We sent a verification code to '**
  String get weSentVerificationCodeToPrefix;

  /// No description provided for @weSentVerificationCodeToSuffix.
  ///
  /// In en, this message translates to:
  /// **'. Enter it below to update your phone number.'**
  String get weSentVerificationCodeToSuffix;

  /// No description provided for @updatePhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Update Phone Number'**
  String get updatePhoneNumber;

  /// No description provided for @changePhoneNumberAction.
  ///
  /// In en, this message translates to:
  /// **'Change phone number'**
  String get changePhoneNumberAction;

  /// No description provided for @startVerification.
  ///
  /// In en, this message translates to:
  /// **'Start Verification'**
  String get startVerification;

  /// No description provided for @communityGuidelinesTerms.
  ///
  /// In en, this message translates to:
  /// **'Community Guidelines & Terms'**
  String get communityGuidelinesTerms;

  /// No description provided for @acceptSafetyTerms.
  ///
  /// In en, this message translates to:
  /// **'I accept all safety guidelines and legal terms'**
  String get acceptSafetyTerms;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navShipments.
  ///
  /// In en, this message translates to:
  /// **'Shipments'**
  String get navShipments;

  /// No description provided for @navTrips.
  ///
  /// In en, this message translates to:
  /// **'Trips'**
  String get navTrips;

  /// No description provided for @navMessages.
  ///
  /// In en, this message translates to:
  /// **'Messages'**
  String get navMessages;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @preferredCurrencyTitle.
  ///
  /// In en, this message translates to:
  /// **'Preferred Currency'**
  String get preferredCurrencyTitle;

  /// No description provided for @currencyScreenInfo.
  ///
  /// In en, this message translates to:
  /// **'Choose the currency you want to see across the app. This updates your wallet display, payouts, and pricing preferences. Trip listings keep their original currency, but rates are shown using in-app reference conversions.'**
  String get currencyScreenInfo;

  /// No description provided for @currencyUpdatedTo.
  ///
  /// In en, this message translates to:
  /// **'Preferred currency updated to {currency}'**
  String currencyUpdatedTo(Object currency);

  /// No description provided for @referenceRates.
  ///
  /// In en, this message translates to:
  /// **'Reference Rates'**
  String get referenceRates;

  /// No description provided for @referenceRatesInfo.
  ///
  /// In en, this message translates to:
  /// **'These are the conversion rates currently used inside the app for supported currencies.'**
  String get referenceRatesInfo;

  /// No description provided for @escrowProtectionTitle.
  ///
  /// In en, this message translates to:
  /// **'Escrow Protection'**
  String get escrowProtectionTitle;

  /// No description provided for @escrowProtectionDesc.
  ///
  /// In en, this message translates to:
  /// **'\"In Escrow\" means funds are held securely. They move to \"Completed\" once delivery is confirmed.'**
  String get escrowProtectionDesc;

  /// No description provided for @transactionHistory.
  ///
  /// In en, this message translates to:
  /// **'Transaction History'**
  String get transactionHistory;

  /// No description provided for @noTransactionsYet.
  ///
  /// In en, this message translates to:
  /// **'No transactions yet'**
  String get noTransactionsYet;

  /// No description provided for @noTransactionsDesc.
  ///
  /// In en, this message translates to:
  /// **'Once you make a payment or receive a refund, it will appear here.'**
  String get noTransactionsDesc;

  /// No description provided for @helpHeroText.
  ///
  /// In en, this message translates to:
  /// **'How can we\nhelp you today?'**
  String get helpHeroText;

  /// No description provided for @quickHelp.
  ///
  /// In en, this message translates to:
  /// **'Quick Help'**
  String get quickHelp;

  /// No description provided for @faqSection.
  ///
  /// In en, this message translates to:
  /// **'Frequently Asked Questions'**
  String get faqSection;

  /// No description provided for @searchHelpHint.
  ///
  /// In en, this message translates to:
  /// **'Search help topics...'**
  String get searchHelpHint;

  /// No description provided for @noRatingsYet.
  ///
  /// In en, this message translates to:
  /// **'You haven\'t left any ratings yet.'**
  String get noRatingsYet;

  /// No description provided for @setCurrencyFirst.
  ///
  /// In en, this message translates to:
  /// **'Please set your preferred currency in profile settings before managing payout methods.'**
  String get setCurrencyFirst;

  /// No description provided for @activityTitle.
  ///
  /// In en, this message translates to:
  /// **'Activity'**
  String get activityTitle;

  /// No description provided for @activityTabTrips.
  ///
  /// In en, this message translates to:
  /// **'Trips'**
  String get activityTabTrips;

  /// No description provided for @activityTabShipments.
  ///
  /// In en, this message translates to:
  /// **'Shipments'**
  String get activityTabShipments;

  /// No description provided for @activityTabRequests.
  ///
  /// In en, this message translates to:
  /// **'Requests'**
  String get activityTabRequests;

  /// No description provided for @noTripsYet.
  ///
  /// In en, this message translates to:
  /// **'No trips yet'**
  String get noTripsYet;

  /// No description provided for @postATripCta.
  ///
  /// In en, this message translates to:
  /// **'Post a Trip'**
  String get postATripCta;

  /// No description provided for @postATripSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Post a trip to start earning by carrying packages.'**
  String get postATripSubtitle;

  /// No description provided for @noShipmentsYet.
  ///
  /// In en, this message translates to:
  /// **'No shipments yet'**
  String get noShipmentsYet;

  /// No description provided for @sendAPackageCta.
  ///
  /// In en, this message translates to:
  /// **'Send a Package'**
  String get sendAPackageCta;

  /// No description provided for @sendAPackageSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Send a package and track it here.'**
  String get sendAPackageSubtitle;

  /// No description provided for @noRequestsYet.
  ///
  /// In en, this message translates to:
  /// **'No requests yet'**
  String get noRequestsYet;

  /// No description provided for @noRequestsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'When you send or receive shipment requests, they\'ll show here.'**
  String get noRequestsSubtitle;

  /// No description provided for @incomingRequestsLabel.
  ///
  /// In en, this message translates to:
  /// **'Incoming requests'**
  String get incomingRequestsLabel;

  /// No description provided for @sentRequestsLabel.
  ///
  /// In en, this message translates to:
  /// **'Sent requests'**
  String get sentRequestsLabel;

  /// No description provided for @fromSenderLabel.
  ///
  /// In en, this message translates to:
  /// **'From sender'**
  String get fromSenderLabel;

  /// No description provided for @withCarrierLabel.
  ///
  /// In en, this message translates to:
  /// **'With carrier'**
  String get withCarrierLabel;

  /// No description provided for @pendingPriceLabel.
  ///
  /// In en, this message translates to:
  /// **'Pending price'**
  String get pendingPriceLabel;

  /// No description provided for @shipmentRequestFallback.
  ///
  /// In en, this message translates to:
  /// **'Shipment request'**
  String get shipmentRequestFallback;

  /// No description provided for @activeShipmentsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {1 active shipment} other {{count} active shipments}}'**
  String activeShipmentsCount(int count);

  /// No description provided for @kgFreeLabel.
  ///
  /// In en, this message translates to:
  /// **'{kg} kg free'**
  String kgFreeLabel(Object kg);

  /// No description provided for @ratingsAndReviewsTitle.
  ///
  /// In en, this message translates to:
  /// **'Ratings & Reviews'**
  String get ratingsAndReviewsTitle;

  /// No description provided for @noReviewsYet.
  ///
  /// In en, this message translates to:
  /// **'No reviews yet'**
  String get noReviewsYet;

  /// No description provided for @noReviewsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Reviews from senders and travelers will appear here.'**
  String get noReviewsSubtitle;

  /// No description provided for @reviewsCount.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, one {1 review} other {{count} reviews}}'**
  String reviewsCount(int count);

  /// No description provided for @requestsSectionCarry.
  ///
  /// In en, this message translates to:
  /// **'Packages to carry'**
  String get requestsSectionCarry;

  /// No description provided for @requestsSectionSending.
  ///
  /// In en, this message translates to:
  /// **'My shipping requests'**
  String get requestsSectionSending;

  /// No description provided for @searchRequestsHint.
  ///
  /// In en, this message translates to:
  /// **'Search by name or package...'**
  String get searchRequestsHint;

  /// No description provided for @noResultsFor.
  ///
  /// In en, this message translates to:
  /// **'No results for \"{query}\"'**
  String noResultsFor(Object query);

  /// No description provided for @activeShipmentsSection.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get activeShipmentsSection;

  /// No description provided for @pastShipmentsSection.
  ///
  /// In en, this message translates to:
  /// **'Past'**
  String get pastShipmentsSection;

  /// No description provided for @searchTripsHint.
  ///
  /// In en, this message translates to:
  /// **'Search by route, date or status...'**
  String get searchTripsHint;

  /// No description provided for @searchShipmentsHint.
  ///
  /// In en, this message translates to:
  /// **'Search by package, city or traveler...'**
  String get searchShipmentsHint;

  /// No description provided for @uiIncludingProcessingByOurIdentityVerification.
  ///
  /// In en, this message translates to:
  /// **', including processing by our identity verification partner.'**
  String get uiIncludingProcessingByOurIdentityVerification;

  /// No description provided for @ui1000Deliveries.
  ///
  /// In en, this message translates to:
  /// **'1,000+\nDeliveries'**
  String get ui1000Deliveries;

  /// No description provided for @ui247Support.
  ///
  /// In en, this message translates to:
  /// **'24/7\nSupport'**
  String get ui247Support;

  /// No description provided for @ui6DigitCode.
  ///
  /// In en, this message translates to:
  /// **'6-digit code'**
  String get ui6DigitCode;

  /// No description provided for @ui9DigitAbaRoutingNumber.
  ///
  /// In en, this message translates to:
  /// **'9-digit ABA routing number'**
  String get ui9DigitAbaRoutingNumber;

  /// No description provided for @uiAClearPhotoHelpsTheTraveler.
  ///
  /// In en, this message translates to:
  /// **'A clear photo helps the traveler identify your item'**
  String get uiAClearPhotoHelpsTheTraveler;

  /// No description provided for @uiANewCodeHasBeenSent.
  ///
  /// In en, this message translates to:
  /// **'A new code has been sent'**
  String get uiANewCodeHasBeenSent;

  /// No description provided for @uiAccountDetails.
  ///
  /// In en, this message translates to:
  /// **'ACCOUNT DETAILS'**
  String get uiAccountDetails;

  /// No description provided for @uiAccountInformation.
  ///
  /// In en, this message translates to:
  /// **'ACCOUNT INFORMATION'**
  String get uiAccountInformation;

  /// No description provided for @uiAccept.
  ///
  /// In en, this message translates to:
  /// **'Accept'**
  String get uiAccept;

  /// No description provided for @uiAcceptContinue.
  ///
  /// In en, this message translates to:
  /// **'Accept & Continue'**
  String get uiAcceptContinue;

  /// No description provided for @uiAcceptRequest.
  ///
  /// In en, this message translates to:
  /// **'Accept Request'**
  String get uiAcceptRequest;

  /// No description provided for @uiAccountHolderName.
  ///
  /// In en, this message translates to:
  /// **'Account Holder Name'**
  String get uiAccountHolderName;

  /// No description provided for @uiAccountHolderName2.
  ///
  /// In en, this message translates to:
  /// **'Account Holder Name *'**
  String get uiAccountHolderName2;

  /// No description provided for @uiAccountNumber.
  ///
  /// In en, this message translates to:
  /// **'Account Number'**
  String get uiAccountNumber;

  /// No description provided for @uiAccountNumber2.
  ///
  /// In en, this message translates to:
  /// **'Account Number *'**
  String get uiAccountNumber2;

  /// No description provided for @uiAccountSuspended.
  ///
  /// In en, this message translates to:
  /// **'Account Suspended'**
  String get uiAccountSuspended;

  /// No description provided for @uiAccountVerification.
  ///
  /// In en, this message translates to:
  /// **'Account Verification'**
  String get uiAccountVerification;

  /// No description provided for @uiAccountCreated.
  ///
  /// In en, this message translates to:
  /// **'Account created'**
  String get uiAccountCreated;

  /// No description provided for @uiAccountHolder.
  ///
  /// In en, this message translates to:
  /// **'Account holder'**
  String get uiAccountHolder;

  /// No description provided for @uiAccountNumberMustBe10Digits.
  ///
  /// In en, this message translates to:
  /// **'Account number must be 10 digits.'**
  String get uiAccountNumberMustBe10Digits;

  /// No description provided for @uiActionNeeded.
  ///
  /// In en, this message translates to:
  /// **'Action needed'**
  String get uiActionNeeded;

  /// No description provided for @uiActiveShipment.
  ///
  /// In en, this message translates to:
  /// **'Active shipment'**
  String get uiActiveShipment;

  /// No description provided for @uiActiveShipments.
  ///
  /// In en, this message translates to:
  /// **'Active shipments'**
  String get uiActiveShipments;

  /// No description provided for @uiAdd24PhotosAndAccept.
  ///
  /// In en, this message translates to:
  /// **'Add 2–4 photos and accept all agreements.'**
  String get uiAdd24PhotosAndAccept;

  /// No description provided for @uiAddBankAccount.
  ///
  /// In en, this message translates to:
  /// **'Add Bank Account'**
  String get uiAddBankAccount;

  /// No description provided for @uiAddAService.
  ///
  /// In en, this message translates to:
  /// **'Add a service'**
  String get uiAddAService;

  /// No description provided for @uiAddAnItemImageBeforeContinuing.
  ///
  /// In en, this message translates to:
  /// **'Add an item image before continuing.'**
  String get uiAddAnItemImageBeforeContinuing;

  /// No description provided for @uiAddItemPhoto.
  ///
  /// In en, this message translates to:
  /// **'Add item photo'**
  String get uiAddItemPhoto;

  /// No description provided for @uiAddItemPhotoOptional.
  ///
  /// In en, this message translates to:
  /// **'Add item photo (optional)'**
  String get uiAddItemPhotoOptional;

  /// No description provided for @uiAddKg.
  ///
  /// In en, this message translates to:
  /// **'Add kg'**
  String get uiAddKg;

  /// No description provided for @uiAddMoreKg.
  ///
  /// In en, this message translates to:
  /// **'Add more kg'**
  String get uiAddMoreKg;

  /// No description provided for @uiAddPhoto.
  ///
  /// In en, this message translates to:
  /// **'Add photo'**
  String get uiAddPhoto;

  /// No description provided for @uiAddYourPayoutAccountSoYou.
  ///
  /// In en, this message translates to:
  /// **'Add your payout account so you can receive money from deliveries.'**
  String get uiAddYourPayoutAccountSoYou;

  /// No description provided for @uiAdditionalWeight.
  ///
  /// In en, this message translates to:
  /// **'Additional weight'**
  String get uiAdditionalWeight;

  /// No description provided for @uiAddressLine1.
  ///
  /// In en, this message translates to:
  /// **'Address Line 1 *'**
  String get uiAddressLine1;

  /// No description provided for @uiAddressLine2.
  ///
  /// In en, this message translates to:
  /// **'Address Line 2'**
  String get uiAddressLine2;

  /// No description provided for @uiAfterDelivery.
  ///
  /// In en, this message translates to:
  /// **'After delivery'**
  String get uiAfterDelivery;

  /// No description provided for @uiAgeVerification.
  ///
  /// In en, this message translates to:
  /// **'Age Verification *'**
  String get uiAgeVerification;

  /// No description provided for @uiAgreementShippingConfirmation.
  ///
  /// In en, this message translates to:
  /// **'Agreement & Shipping Confirmation'**
  String get uiAgreementShippingConfirmation;

  /// No description provided for @uiAllConversationsStaySynced.
  ///
  /// In en, this message translates to:
  /// **'All conversations stay synced'**
  String get uiAllConversationsStaySynced;

  /// No description provided for @uiAllow.
  ///
  /// In en, this message translates to:
  /// **'Allow'**
  String get uiAllow;

  /// No description provided for @uiAllowNotifications.
  ///
  /// In en, this message translates to:
  /// **'Allow notifications?'**
  String get uiAllowNotifications;

  /// No description provided for @uiAmount.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get uiAmount;

  /// No description provided for @uiAnAgentWillJoinShortlyYou.
  ///
  /// In en, this message translates to:
  /// **'An agent will join shortly. You can send a message below.'**
  String get uiAnAgentWillJoinShortlyYou;

  /// No description provided for @uiAnySpecialRequirementsOrInstructions.
  ///
  /// In en, this message translates to:
  /// **'Any special requirements or instructions...'**
  String get uiAnySpecialRequirementsOrInstructions;

  /// No description provided for @uiApartmentSuiteEtcOptional.
  ///
  /// In en, this message translates to:
  /// **'Apartment, suite, etc. (optional)'**
  String get uiApartmentSuiteEtcOptional;

  /// No description provided for @uiAppPasscode.
  ///
  /// In en, this message translates to:
  /// **'App passcode'**
  String get uiAppPasscode;

  /// No description provided for @uiAppPasscodeRemoved.
  ///
  /// In en, this message translates to:
  /// **'App passcode removed.'**
  String get uiAppPasscodeRemoved;

  /// No description provided for @uiAppPasscodeSaved.
  ///
  /// In en, this message translates to:
  /// **'App passcode saved.'**
  String get uiAppPasscodeSaved;

  /// No description provided for @uiApplePay.
  ///
  /// In en, this message translates to:
  /// **'Apple Pay'**
  String get uiApplePay;

  /// No description provided for @uiApplySuggestion.
  ///
  /// In en, this message translates to:
  /// **'Apply suggestion'**
  String get uiApplySuggestion;

  /// No description provided for @uiAreYouSigningUpAsAn.
  ///
  /// In en, this message translates to:
  /// **'Are you signing up as an individual or a company?'**
  String get uiAreYouSigningUpAsAn;

  /// No description provided for @uiAreYouSureYouWantTo.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to delete this saved route?'**
  String get uiAreYouSureYouWantTo;

  /// No description provided for @uiArrival.
  ///
  /// In en, this message translates to:
  /// **'Arrival'**
  String get uiArrival;

  /// No description provided for @uiAskTheSenderOrReceiverFor.
  ///
  /// In en, this message translates to:
  /// **'Ask the sender or receiver for their 4-digit handover PIN to confirm delivery and release your payment instantly.'**
  String get uiAskTheSenderOrReceiverFor;

  /// No description provided for @uiAtLeast8Characters.
  ///
  /// In en, this message translates to:
  /// **'At least 8 characters'**
  String get uiAtLeast8Characters;

  /// No description provided for @uiAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available'**
  String get uiAvailable;

  /// No description provided for @uiAvailableBalance.
  ///
  /// In en, this message translates to:
  /// **'Available Balance'**
  String get uiAvailableBalance;

  /// No description provided for @uiAvailableCapacity.
  ///
  /// In en, this message translates to:
  /// **'Available Capacity'**
  String get uiAvailableCapacity;

  /// No description provided for @uiAvailableNow.
  ///
  /// In en, this message translates to:
  /// **'Available now'**
  String get uiAvailableNow;

  /// No description provided for @uiAwaitingPaymentTapToContinue.
  ///
  /// In en, this message translates to:
  /// **'Awaiting payment — tap to continue'**
  String get uiAwaitingPaymentTapToContinue;

  /// No description provided for @uiBillingAddress.
  ///
  /// In en, this message translates to:
  /// **'BILLING ADDRESS'**
  String get uiBillingAddress;

  /// No description provided for @uiBack.
  ///
  /// In en, this message translates to:
  /// **'Back'**
  String get uiBack;

  /// No description provided for @uiBackToApp.
  ///
  /// In en, this message translates to:
  /// **'Back to App'**
  String get uiBackToApp;

  /// No description provided for @uiBagoCommission.
  ///
  /// In en, this message translates to:
  /// **'Bago commission'**
  String get uiBagoCommission;

  /// No description provided for @uiBagoFee.
  ///
  /// In en, this message translates to:
  /// **'Bago fee'**
  String get uiBagoFee;

  /// No description provided for @uiBagoGuidelines.
  ///
  /// In en, this message translates to:
  /// **'Bago guidelines'**
  String get uiBagoGuidelines;

  /// No description provided for @uiBagoUsesFlutterwaveForSecureCheckout.
  ///
  /// In en, this message translates to:
  /// **'Bago uses Flutterwave for secure checkout. When you pay by card, Apple Pay, bank transfer, or mobile money, Flutterwave securely handles and stores the payment details. Bago never receives raw card numbers.'**
  String get uiBagoUsesFlutterwaveForSecureCheckout;

  /// No description provided for @uiBagoWillUseThisCountryTo.
  ///
  /// In en, this message translates to:
  /// **'Bago will use this country to set your wallet currency before KYC.'**
  String get uiBagoWillUseThisCountryTo;

  /// No description provided for @uiBank.
  ///
  /// In en, this message translates to:
  /// **'Bank'**
  String get uiBank;

  /// No description provided for @uiBankCountry.
  ///
  /// In en, this message translates to:
  /// **'Bank Country'**
  String get uiBankCountry;

  /// No description provided for @uiBankName.
  ///
  /// In en, this message translates to:
  /// **'Bank Name'**
  String get uiBankName;

  /// No description provided for @uiBankName2.
  ///
  /// In en, this message translates to:
  /// **'Bank Name *'**
  String get uiBankName2;

  /// No description provided for @uiBankAccountAddedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Bank account added successfully!'**
  String get uiBankAccountAddedSuccessfully;

  /// No description provided for @uiBankAccountLinkedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Bank account linked successfully!'**
  String get uiBankAccountLinkedSuccessfully;

  /// No description provided for @uiBankAccountSetupCouldNotBe.
  ///
  /// In en, this message translates to:
  /// **'Bank account setup could not be completed. Please try again.'**
  String get uiBankAccountSetupCouldNotBe;

  /// No description provided for @uiBankCountry2.
  ///
  /// In en, this message translates to:
  /// **'Bank country *'**
  String get uiBankCountry2;

  /// No description provided for @uiBioCannotBeEmpty.
  ///
  /// In en, this message translates to:
  /// **'Bio cannot be empty'**
  String get uiBioCannotBeEmpty;

  /// No description provided for @uiBioUpdatedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Bio updated successfully'**
  String get uiBioUpdatedSuccessfully;

  /// No description provided for @uiBiometricUnlockFailed.
  ///
  /// In en, this message translates to:
  /// **'Biometric unlock failed.'**
  String get uiBiometricUnlockFailed;

  /// No description provided for @uiBookings.
  ///
  /// In en, this message translates to:
  /// **'Bookings'**
  String get uiBookings;

  /// No description provided for @uiBriefSummaryOfYourIssue.
  ///
  /// In en, this message translates to:
  /// **'Brief summary of your issue'**
  String get uiBriefSummaryOfYourIssue;

  /// No description provided for @uiBrowseQuickAnswersStartALive.
  ///
  /// In en, this message translates to:
  /// **'Browse quick answers, start a live chat, or return to an existing thread without losing context.'**
  String get uiBrowseQuickAnswersStartALive;

  /// No description provided for @uiBusinessOrOrganisation.
  ///
  /// In en, this message translates to:
  /// **'Business or organisation'**
  String get uiBusinessOrOrganisation;

  /// No description provided for @uiBusinessServices.
  ///
  /// In en, this message translates to:
  /// **'Business services'**
  String get uiBusinessServices;

  /// No description provided for @uiBusinessServicesAreAvailableToBusiness.
  ///
  /// In en, this message translates to:
  /// **'Business services are available to business accounts.'**
  String get uiBusinessServicesAreAvailableToBusiness;

  /// No description provided for @uiBuyItemsAbroad.
  ///
  /// In en, this message translates to:
  /// **'Buy Items Abroad'**
  String get uiBuyItemsAbroad;

  /// No description provided for @uiBuyItemsAbroadIsNotLive.
  ///
  /// In en, this message translates to:
  /// **'Buy Items Abroad is not live yet. We will implement it soon.'**
  String get uiBuyItemsAbroadIsNotLive;

  /// No description provided for @uiByContinuingIConfirmThat.
  ///
  /// In en, this message translates to:
  /// **'By continuing, I confirm that:'**
  String get uiByContinuingIConfirmThat;

  /// No description provided for @uiBySubmittingYouConfirmThisTrip.
  ///
  /// In en, this message translates to:
  /// **'By submitting, you confirm this trip is accurate. Trips with new or edited details are sent to the support team again for approval before going live.'**
  String get uiBySubmittingYouConfirmThisTrip;

  /// No description provided for @uiCategory.
  ///
  /// In en, this message translates to:
  /// **'CATEGORY'**
  String get uiCategory;

  /// No description provided for @uiCalculatingCheckoutTotal.
  ///
  /// In en, this message translates to:
  /// **'Calculating checkout total...'**
  String get uiCalculatingCheckoutTotal;

  /// No description provided for @uiCanTFindItCheckYour.
  ///
  /// In en, this message translates to:
  /// **'Can\'t find it? Check your spam or junk folder.'**
  String get uiCanTFindItCheckYour;

  /// No description provided for @uiCardsAreSavedDuringCheckout.
  ///
  /// In en, this message translates to:
  /// **'Cards are saved during checkout'**
  String get uiCardsAreSavedDuringCheckout;

  /// No description provided for @uiCarrierLogisticsCompanyName.
  ///
  /// In en, this message translates to:
  /// **'Carrier / logistics company name'**
  String get uiCarrierLogisticsCompanyName;

  /// No description provided for @uiCategory2.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get uiCategory2;

  /// No description provided for @uiChange.
  ///
  /// In en, this message translates to:
  /// **'Change'**
  String get uiChange;

  /// No description provided for @uiChangeNumber.
  ///
  /// In en, this message translates to:
  /// **'Change number'**
  String get uiChangeNumber;

  /// No description provided for @uiChangingThisAccountRequiresAConfirmation.
  ///
  /// In en, this message translates to:
  /// **'Changing this account requires a confirmation code sent to your email.'**
  String get uiChangingThisAccountRequiresAConfirmation;

  /// No description provided for @uiChatClosed.
  ///
  /// In en, this message translates to:
  /// **'Chat closed'**
  String get uiChatClosed;

  /// No description provided for @uiChatIsNotAvailableForThis.
  ///
  /// In en, this message translates to:
  /// **'Chat is not available for this shipment yet.'**
  String get uiChatIsNotAvailableForThis;

  /// No description provided for @uiChatSafelyByStayingWithinBago.
  ///
  /// In en, this message translates to:
  /// **'Chat safely by staying within Bago. We protect your payments and data.'**
  String get uiChatSafelyByStayingWithinBago;

  /// No description provided for @uiChatWithSupport.
  ///
  /// In en, this message translates to:
  /// **'Chat with support'**
  String get uiChatWithSupport;

  /// No description provided for @uiCheckYourInboxForTheVerification.
  ///
  /// In en, this message translates to:
  /// **'Check your inbox for the verification email we sent when you signed up. Once verified, you\'re good to go.'**
  String get uiCheckYourInboxForTheVerification;

  /// No description provided for @uiChooseFromLibrary.
  ///
  /// In en, this message translates to:
  /// **'Choose from library'**
  String get uiChooseFromLibrary;

  /// No description provided for @uiChooseYourEarningCurrencyThisWill.
  ///
  /// In en, this message translates to:
  /// **'Choose your earning currency. This will be locked once confirmed and can only be changed by support.'**
  String get uiChooseYourEarningCurrencyThisWill;

  /// No description provided for @uiCity.
  ///
  /// In en, this message translates to:
  /// **'City *'**
  String get uiCity;

  /// No description provided for @uiCityCountry.
  ///
  /// In en, this message translates to:
  /// **'City, Country'**
  String get uiCityCountry;

  /// No description provided for @uiCityAirportStation.
  ///
  /// In en, this message translates to:
  /// **'City, airport, station...'**
  String get uiCityAirportStation;

  /// No description provided for @uiComingSoon.
  ///
  /// In en, this message translates to:
  /// **'Coming soon'**
  String get uiComingSoon;

  /// No description provided for @uiCommunication.
  ///
  /// In en, this message translates to:
  /// **'Communication'**
  String get uiCommunication;

  /// No description provided for @uiCommunityVerified.
  ///
  /// In en, this message translates to:
  /// **'Community\nVerified'**
  String get uiCommunityVerified;

  /// No description provided for @uiCompany.
  ///
  /// In en, this message translates to:
  /// **'Company'**
  String get uiCompany;

  /// No description provided for @uiCompleteSignup.
  ///
  /// In en, this message translates to:
  /// **'Complete Signup'**
  String get uiCompleteSignup;

  /// No description provided for @uiCompleteIdentityVerificationBeforeAddingA.
  ///
  /// In en, this message translates to:
  /// **'Complete identity verification before adding a payout account.'**
  String get uiCompleteIdentityVerificationBeforeAddingA;

  /// No description provided for @uiCompleteIdentityVerificationBeforeChangingPayout.
  ///
  /// In en, this message translates to:
  /// **'Complete identity verification before changing payout currency.'**
  String get uiCompleteIdentityVerificationBeforeChangingPayout;

  /// No description provided for @uiCompleteYourProfile.
  ///
  /// In en, this message translates to:
  /// **'Complete your profile'**
  String get uiCompleteYourProfile;

  /// No description provided for @uiConfirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get uiConfirm;

  /// No description provided for @uiConfirmBankAccount.
  ///
  /// In en, this message translates to:
  /// **'Confirm Bank Account'**
  String get uiConfirmBankAccount;

  /// No description provided for @uiConfirmDeliveryGetPaid.
  ///
  /// In en, this message translates to:
  /// **'Confirm Delivery & Get Paid'**
  String get uiConfirmDeliveryGetPaid;

  /// No description provided for @uiConfirmUkBankAccount.
  ///
  /// In en, this message translates to:
  /// **'Confirm UK Bank Account'**
  String get uiConfirmUkBankAccount;

  /// No description provided for @uiConfirmUsdBankAccount.
  ///
  /// In en, this message translates to:
  /// **'Confirm USD Bank Account'**
  String get uiConfirmUsdBankAccount;

  /// No description provided for @uiConfirmCountry.
  ///
  /// In en, this message translates to:
  /// **'Confirm country'**
  String get uiConfirmCountry;

  /// No description provided for @uiConfirmDelivery.
  ///
  /// In en, this message translates to:
  /// **'Confirm delivery'**
  String get uiConfirmDelivery;

  /// No description provided for @uiConfirmDeliveryToReleaseThePayment.
  ///
  /// In en, this message translates to:
  /// **'Confirm delivery to release the payment.'**
  String get uiConfirmDeliveryToReleaseThePayment;

  /// No description provided for @uiConfirmDelivery2.
  ///
  /// In en, this message translates to:
  /// **'Confirm delivery?'**
  String get uiConfirmDelivery2;

  /// No description provided for @uiConfirmPasscode.
  ///
  /// In en, this message translates to:
  /// **'Confirm passcode'**
  String get uiConfirmPasscode;

  /// No description provided for @uiConfirmThisOnlyAfterThePackage.
  ///
  /// In en, this message translates to:
  /// **'Confirm this only after the package is in your hands. This will release payment to the traveler.'**
  String get uiConfirmThisOnlyAfterThePackage;

  /// No description provided for @uiConfirmWithdrawal.
  ///
  /// In en, this message translates to:
  /// **'Confirm withdrawal'**
  String get uiConfirmWithdrawal;

  /// No description provided for @uiConfirmYourBank.
  ///
  /// In en, this message translates to:
  /// **'Confirm your bank'**
  String get uiConfirmYourBank;

  /// No description provided for @uiConfirmYourCountry.
  ///
  /// In en, this message translates to:
  /// **'Confirm your country'**
  String get uiConfirmYourCountry;

  /// No description provided for @uiConfirmationCodeCopied.
  ///
  /// In en, this message translates to:
  /// **'Confirmation code copied.'**
  String get uiConfirmationCodeCopied;

  /// No description provided for @uiConfirmingReceiptWillReleasePaymentTo.
  ///
  /// In en, this message translates to:
  /// **'Confirming receipt will release payment to the traveler. Only do this once you have the package.'**
  String get uiConfirmingReceiptWillReleasePaymentTo;

  /// No description provided for @uiConnectionError.
  ///
  /// In en, this message translates to:
  /// **'Connection error'**
  String get uiConnectionError;

  /// No description provided for @uiContactSupport.
  ///
  /// In en, this message translates to:
  /// **'Contact Support'**
  String get uiContactSupport;

  /// No description provided for @uiContactSupport2.
  ///
  /// In en, this message translates to:
  /// **'Contact support'**
  String get uiContactSupport2;

  /// No description provided for @uiContinueAsGuest.
  ///
  /// In en, this message translates to:
  /// **'Continue as guest'**
  String get uiContinueAsGuest;

  /// No description provided for @uiContinueBrowsing.
  ///
  /// In en, this message translates to:
  /// **'Continue browsing'**
  String get uiContinueBrowsing;

  /// No description provided for @uiContinueToPayment.
  ///
  /// In en, this message translates to:
  /// **'Continue to Payment'**
  String get uiContinueToPayment;

  /// No description provided for @uiContinueWithApple.
  ///
  /// In en, this message translates to:
  /// **'Continue with Apple'**
  String get uiContinueWithApple;

  /// No description provided for @uiConversationWithBagoSupport.
  ///
  /// In en, this message translates to:
  /// **'Conversation with Bago support'**
  String get uiConversationWithBagoSupport;

  /// No description provided for @uiCouldNotConfirmTheCodePlease.
  ///
  /// In en, this message translates to:
  /// **'Could not confirm the code. Please try again.'**
  String get uiCouldNotConfirmTheCodePlease;

  /// No description provided for @uiCouldNotLoadBanksPleaseTry.
  ///
  /// In en, this message translates to:
  /// **'Could not load banks. Please try again.'**
  String get uiCouldNotLoadBanksPleaseTry;

  /// No description provided for @uiCouldNotLoadMap.
  ///
  /// In en, this message translates to:
  /// **'Could not load map'**
  String get uiCouldNotLoadMap;

  /// No description provided for @uiCouldNotLoadRequests.
  ///
  /// In en, this message translates to:
  /// **'Could not load requests'**
  String get uiCouldNotLoadRequests;

  /// No description provided for @uiCouldNotLoadShipmentDetailsPlease.
  ///
  /// In en, this message translates to:
  /// **'Could not load shipment details. Please try again.'**
  String get uiCouldNotLoadShipmentDetailsPlease;

  /// No description provided for @uiCouldNotLoadShipments.
  ///
  /// In en, this message translates to:
  /// **'Could not load shipments'**
  String get uiCouldNotLoadShipments;

  /// No description provided for @uiCouldNotLoadTrips.
  ///
  /// In en, this message translates to:
  /// **'Could not load trips'**
  String get uiCouldNotLoadTrips;

  /// No description provided for @uiCouldNotSendTheRequestPlease.
  ///
  /// In en, this message translates to:
  /// **'Could not send the request. Please try again.'**
  String get uiCouldNotSendTheRequestPlease;

  /// No description provided for @uiCouldNotUpdateWalletCurrencyPlease.
  ///
  /// In en, this message translates to:
  /// **'Could not update wallet currency. Please try again.'**
  String get uiCouldNotUpdateWalletCurrencyPlease;

  /// No description provided for @uiCountryOfResidence.
  ///
  /// In en, this message translates to:
  /// **'Country of residence'**
  String get uiCountryOfResidence;

  /// No description provided for @uiCreateAccount.
  ///
  /// In en, this message translates to:
  /// **'Create Account'**
  String get uiCreateAccount;

  /// No description provided for @uiCreateGroupShipment.
  ///
  /// In en, this message translates to:
  /// **'Create Group Shipment'**
  String get uiCreateGroupShipment;

  /// No description provided for @uiCreateAPassword.
  ///
  /// In en, this message translates to:
  /// **'Create a\npassword'**
  String get uiCreateAPassword;

  /// No description provided for @uiCreateAFreeAccountOrSign.
  ///
  /// In en, this message translates to:
  /// **'Create a free account or sign in to book a carrier and ship your package.'**
  String get uiCreateAFreeAccountOrSign;

  /// No description provided for @uiCreateAGroupShippingRequest.
  ///
  /// In en, this message translates to:
  /// **'Create a group shipping request'**
  String get uiCreateAGroupShippingRequest;

  /// No description provided for @uiCreateYourAccount.
  ///
  /// In en, this message translates to:
  /// **'Create your\naccount'**
  String get uiCreateYourAccount;

  /// No description provided for @uiCreditDebitCard.
  ///
  /// In en, this message translates to:
  /// **'Credit / Debit Card'**
  String get uiCreditDebitCard;

  /// No description provided for @uiCurrency.
  ///
  /// In en, this message translates to:
  /// **'Currency'**
  String get uiCurrency;

  /// No description provided for @uiCurrencyNotSet.
  ///
  /// In en, this message translates to:
  /// **'Currency Not Set'**
  String get uiCurrencyNotSet;

  /// No description provided for @uiCurrentLocationOptional.
  ///
  /// In en, this message translates to:
  /// **'Current location (optional)'**
  String get uiCurrentLocationOptional;

  /// No description provided for @uiCurrentShipments.
  ///
  /// In en, this message translates to:
  /// **'Current shipments'**
  String get uiCurrentShipments;

  /// No description provided for @uiDataProtectionConsent.
  ///
  /// In en, this message translates to:
  /// **'Data Protection & Consent'**
  String get uiDataProtectionConsent;

  /// No description provided for @uiDate.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get uiDate;

  /// No description provided for @uiDateOfBirth.
  ///
  /// In en, this message translates to:
  /// **'Date of Birth'**
  String get uiDateOfBirth;

  /// No description provided for @uiDateOfBirth2.
  ///
  /// In en, this message translates to:
  /// **'Date of Birth *'**
  String get uiDateOfBirth2;

  /// No description provided for @uiDecline.
  ///
  /// In en, this message translates to:
  /// **'Decline'**
  String get uiDecline;

  /// No description provided for @uiDeleteRoute.
  ///
  /// In en, this message translates to:
  /// **'Delete Route'**
  String get uiDeleteRoute;

  /// No description provided for @uiDeliveryAddress.
  ///
  /// In en, this message translates to:
  /// **'Delivery address'**
  String get uiDeliveryAddress;

  /// No description provided for @uiDeliveryConfirmedPaymentReleasedToTraveler.
  ///
  /// In en, this message translates to:
  /// **'Delivery confirmed! Payment released to traveler.'**
  String get uiDeliveryConfirmedPaymentReleasedToTraveler;

  /// No description provided for @uiDepartureTime.
  ///
  /// In en, this message translates to:
  /// **'Departure Time'**
  String get uiDepartureTime;

  /// No description provided for @uiDescribeYourItemSoYourTraveler.
  ///
  /// In en, this message translates to:
  /// **'Describe your item so your traveler knows what to expect.'**
  String get uiDescribeYourItemSoYourTraveler;

  /// No description provided for @uiDiscard.
  ///
  /// In en, this message translates to:
  /// **'Discard'**
  String get uiDiscard;

  /// No description provided for @uiDiscardDraft.
  ///
  /// In en, this message translates to:
  /// **'Discard draft?'**
  String get uiDiscardDraft;

  /// No description provided for @uiDocumentsSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Documents Submitted'**
  String get uiDocumentsSubmitted;

  /// No description provided for @uiDropOffAddress.
  ///
  /// In en, this message translates to:
  /// **'Drop-off address'**
  String get uiDropOffAddress;

  /// No description provided for @uiEarnByCarryingPackagesOnYour.
  ///
  /// In en, this message translates to:
  /// **'Earn by carrying packages on your trip'**
  String get uiEarnByCarryingPackagesOnYour;

  /// No description provided for @uiEditBio.
  ///
  /// In en, this message translates to:
  /// **'Edit bio'**
  String get uiEditBio;

  /// No description provided for @uiEmailAddress.
  ///
  /// In en, this message translates to:
  /// **'Email Address'**
  String get uiEmailAddress;

  /// No description provided for @uiEmailNotifications.
  ///
  /// In en, this message translates to:
  /// **'Email Notifications'**
  String get uiEmailNotifications;

  /// No description provided for @uiEmailSupport.
  ///
  /// In en, this message translates to:
  /// **'Email Support'**
  String get uiEmailSupport;

  /// No description provided for @uiEmailChangesAreHandledThroughVerification.
  ///
  /// In en, this message translates to:
  /// **'Email changes are handled through verification.'**
  String get uiEmailChangesAreHandledThroughVerification;

  /// No description provided for @uiEnter48Digits.
  ///
  /// In en, this message translates to:
  /// **'Enter 4-8 digits'**
  String get uiEnter48Digits;

  /// No description provided for @uiEnterAValidPhoneNumber5.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid phone number (5–15 digits, numbers only).'**
  String get uiEnterAValidPhoneNumber5;

  /// No description provided for @uiEnterAValidShipmentWeight.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid shipment weight.'**
  String get uiEnterAValidShipmentWeight;

  /// No description provided for @uiEnterAccountNumber.
  ///
  /// In en, this message translates to:
  /// **'Enter account number'**
  String get uiEnterAccountNumber;

  /// No description provided for @uiEnterAll4Digits.
  ///
  /// In en, this message translates to:
  /// **'Enter all 4 digits'**
  String get uiEnterAll4Digits;

  /// No description provided for @uiEnterAmount.
  ///
  /// In en, this message translates to:
  /// **'Enter amount'**
  String get uiEnterAmount;

  /// No description provided for @uiEnterTheCode.
  ///
  /// In en, this message translates to:
  /// **'Enter the Code'**
  String get uiEnterTheCode;

  /// No description provided for @uiEnterTheAdditionalKg.
  ///
  /// In en, this message translates to:
  /// **'Enter the additional kg.'**
  String get uiEnterTheAdditionalKg;

  /// No description provided for @uiEnterWithdrawalCode.
  ///
  /// In en, this message translates to:
  /// **'Enter withdrawal code'**
  String get uiEnterWithdrawalCode;

  /// No description provided for @uiEnterYourEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter your\nemail'**
  String get uiEnterYourEmail;

  /// No description provided for @uiEnterYourPhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Enter your\nphone number'**
  String get uiEnterYourPhoneNumber;

  /// No description provided for @uiEnterYourAppPasscode.
  ///
  /// In en, this message translates to:
  /// **'Enter your app passcode.'**
  String get uiEnterYourAppPasscode;

  /// No description provided for @uiEnterYourEmailAndWeWill.
  ///
  /// In en, this message translates to:
  /// **'Enter your email and we will send you a 6-digit verification code to reset your password.'**
  String get uiEnterYourEmailAndWeWill;

  /// No description provided for @uiEnterYourPasscode.
  ///
  /// In en, this message translates to:
  /// **'Enter your passcode'**
  String get uiEnterYourPasscode;

  /// No description provided for @uiEnterYourRegisteredBusinessName.
  ///
  /// In en, this message translates to:
  /// **'Enter your registered business name'**
  String get uiEnterYourRegisteredBusinessName;

  /// No description provided for @uiEnterYourRouteToSeeAvailable.
  ///
  /// In en, this message translates to:
  /// **'Enter your route to see available travelers.'**
  String get uiEnterYourRouteToSeeAvailable;

  /// No description provided for @uiEverythingLookRightPublishWhenReady.
  ///
  /// In en, this message translates to:
  /// **'Everything look right? Publish when ready.'**
  String get uiEverythingLookRightPublishWhenReady;

  /// No description provided for @uiEverythingStaysInOneThreadSo.
  ///
  /// In en, this message translates to:
  /// **'Everything stays in one thread so users can return any time, just like a messenger inbox.'**
  String get uiEverythingStaysInOneThreadSo;

  /// No description provided for @uiExplainWhyYouAreRejectingThe.
  ///
  /// In en, this message translates to:
  /// **'Explain why you are rejecting the package.'**
  String get uiExplainWhyYouAreRejectingThe;

  /// No description provided for @uiExternalCarrierTracking.
  ///
  /// In en, this message translates to:
  /// **'External Carrier Tracking'**
  String get uiExternalCarrierTracking;

  /// No description provided for @uiFrequentlyAskedQuestions.
  ///
  /// In en, this message translates to:
  /// **'FREQUENTLY ASKED QUESTIONS'**
  String get uiFrequentlyAskedQuestions;

  /// No description provided for @uiFaceIdOrTouchId.
  ///
  /// In en, this message translates to:
  /// **'Face ID or Touch ID'**
  String get uiFaceIdOrTouchId;

  /// No description provided for @uiFactorySealedEvidence.
  ///
  /// In en, this message translates to:
  /// **'Factory-sealed evidence'**
  String get uiFactorySealedEvidence;

  /// No description provided for @uiFailedToSaveNamePleaseTry.
  ///
  /// In en, this message translates to:
  /// **'Failed to save name. Please try again.'**
  String get uiFailedToSaveNamePleaseTry;

  /// No description provided for @uiFailedToUpdateBio.
  ///
  /// In en, this message translates to:
  /// **'Failed to update bio'**
  String get uiFailedToUpdateBio;

  /// No description provided for @uiFailedToUpdatePreferences.
  ///
  /// In en, this message translates to:
  /// **'Failed to update preferences'**
  String get uiFailedToUpdatePreferences;

  /// No description provided for @uiFailedToUpdateProfile.
  ///
  /// In en, this message translates to:
  /// **'Failed to update profile'**
  String get uiFailedToUpdateProfile;

  /// No description provided for @uiFindARoute.
  ///
  /// In en, this message translates to:
  /// **'Find a Route'**
  String get uiFindARoute;

  /// No description provided for @uiFindATravelerToCarryYour.
  ///
  /// In en, this message translates to:
  /// **'Find a traveler to carry your package.'**
  String get uiFindATravelerToCarryYour;

  /// No description provided for @uiFindAnswersToCommonQuestionsBelow.
  ///
  /// In en, this message translates to:
  /// **'Find answers to common questions below.'**
  String get uiFindAnswersToCommonQuestionsBelow;

  /// No description provided for @uiFindingTravelersOnThisRoute.
  ///
  /// In en, this message translates to:
  /// **'Finding travelers on this route…'**
  String get uiFindingTravelersOnThisRoute;

  /// No description provided for @uiFirstName.
  ///
  /// In en, this message translates to:
  /// **'First Name *'**
  String get uiFirstName;

  /// No description provided for @uiForComplexIssues.
  ///
  /// In en, this message translates to:
  /// **'For complex issues'**
  String get uiForComplexIssues;

  /// No description provided for @uiForYourSafetyTheSenderMust.
  ///
  /// In en, this message translates to:
  /// **'For your safety, the sender must open the package and allow you to inspect all items before collection.\n\nDo not accept sealed packages or items that you have not personally inspected.'**
  String get uiForYourSafetyTheSenderMust;

  /// No description provided for @uiForYourSecurityPleaseUnlockThe.
  ///
  /// In en, this message translates to:
  /// **'For your security, please unlock the app to continue.'**
  String get uiForYourSecurityPleaseUnlockThe;

  /// No description provided for @uiFromGallery.
  ///
  /// In en, this message translates to:
  /// **'From Gallery'**
  String get uiFromGallery;

  /// No description provided for @uiFromWizard.
  ///
  /// In en, this message translates to:
  /// **'From wizard'**
  String get uiFromWizard;

  /// No description provided for @uiFullName.
  ///
  /// In en, this message translates to:
  /// **'Full Name'**
  String get uiFullName;

  /// No description provided for @uiFullName2.
  ///
  /// In en, this message translates to:
  /// **'Full name'**
  String get uiFullName2;

  /// No description provided for @uiFullNameOnTheAccount.
  ///
  /// In en, this message translates to:
  /// **'Full name on the account'**
  String get uiFullNameOnTheAccount;

  /// No description provided for @uiFullNameOnTheBankAccount.
  ///
  /// In en, this message translates to:
  /// **'Full name on the bank account'**
  String get uiFullNameOnTheBankAccount;

  /// No description provided for @uiGbpPayoutsUseAUkSort.
  ///
  /// In en, this message translates to:
  /// **'GBP payouts use a UK sort code and account number.'**
  String get uiGbpPayoutsUseAUkSort;

  /// No description provided for @uiGetInstantUpdatesAboutMessagesShipment.
  ///
  /// In en, this message translates to:
  /// **'Get instant updates about messages, shipment activity, and delivery progress.'**
  String get uiGetInstantUpdatesAboutMessagesShipment;

  /// No description provided for @uiGetMatchedWithACarrierTogether.
  ///
  /// In en, this message translates to:
  /// **'Get matched with a carrier together'**
  String get uiGetMatchedWithACarrierTogether;

  /// No description provided for @uiGiftItemsIsNotLiveYet.
  ///
  /// In en, this message translates to:
  /// **'Gift items is not live yet. We will implement it soon.'**
  String get uiGiftItemsIsNotLiveYet;

  /// No description provided for @uiGoogleSignInCanBeUnreliable.
  ///
  /// In en, this message translates to:
  /// **'Google Sign-In can be unreliable on the iPhone simulator. If it hangs, use email login here and test Google on a real device.'**
  String get uiGoogleSignInCanBeUnreliable;

  /// No description provided for @uiGotIt.
  ///
  /// In en, this message translates to:
  /// **'Got it'**
  String get uiGotIt;

  /// No description provided for @uiGroupShipping.
  ///
  /// In en, this message translates to:
  /// **'Group Shipping'**
  String get uiGroupShipping;

  /// No description provided for @uiGroupShippingRequestCreatedShareWith.
  ///
  /// In en, this message translates to:
  /// **'Group shipping request created! Share with your group to join.'**
  String get uiGroupShippingRequestCreatedShareWith;

  /// No description provided for @uiHowItWorks.
  ///
  /// In en, this message translates to:
  /// **'HOW IT WORKS'**
  String get uiHowItWorks;

  /// No description provided for @uiHandoverPin.
  ///
  /// In en, this message translates to:
  /// **'Handover PIN'**
  String get uiHandoverPin;

  /// No description provided for @uiHandoverConfirmedFundsReleased.
  ///
  /// In en, this message translates to:
  /// **'Handover confirmed! Funds released.'**
  String get uiHandoverConfirmedFundsReleased;

  /// No description provided for @uiHowCanWeHelp.
  ///
  /// In en, this message translates to:
  /// **'How can we help?'**
  String get uiHowCanWeHelp;

  /// No description provided for @uiHowManyKgCanYouCarry.
  ///
  /// In en, this message translates to:
  /// **'How many kg can you carry?'**
  String get uiHowManyKgCanYouCarry;

  /// No description provided for @uiHowWeUseIt.
  ///
  /// In en, this message translates to:
  /// **'How we use it'**
  String get uiHowWeUseIt;

  /// No description provided for @uiHowWouldYouLikeToSign.
  ///
  /// In en, this message translates to:
  /// **'How would you like to sign up?'**
  String get uiHowWouldYouLikeToSign;

  /// No description provided for @uiIReceivedMyPackage.
  ///
  /// In en, this message translates to:
  /// **'I Received My Package'**
  String get uiIReceivedMyPackage;

  /// No description provided for @uiIAcceptResponsibilityForThisPackage.
  ///
  /// In en, this message translates to:
  /// **'I accept responsibility for this package once I collect it and understand this agreement will be electronically signed and kept with the order.'**
  String get uiIAcceptResponsibilityForThisPackage;

  /// No description provided for @uiIAcknowledgeThatMyPersonalData.
  ///
  /// In en, this message translates to:
  /// **'I acknowledge that my personal data will be processed according to the privacy policy.'**
  String get uiIAcknowledgeThatMyPersonalData;

  /// No description provided for @uiIAgreeToFollowBagoS.
  ///
  /// In en, this message translates to:
  /// **'I agree to follow Bago\'s guidelines and take responsibility for my shipment.'**
  String get uiIAgreeToFollowBagoS;

  /// No description provided for @uiIAgreeToThePlatformS.
  ///
  /// In en, this message translates to:
  /// **'I agree to the platform\'s terms and conditions for using Bago.'**
  String get uiIAgreeToThePlatformS;

  /// No description provided for @uiIAgreeStartVerification.
  ///
  /// In en, this message translates to:
  /// **'I agree — Start Verification'**
  String get uiIAgreeStartVerification;

  /// No description provided for @uiIConfirmThatIAm18.
  ///
  /// In en, this message translates to:
  /// **'I confirm that I am 18 years of age or older.'**
  String get uiIConfirmThatIAm18;

  /// No description provided for @uiIConfirmThatMyShipmentDoes.
  ///
  /// In en, this message translates to:
  /// **'I confirm that my shipment does not contain any prohibited items and complies with Bago\'s item policy.'**
  String get uiIConfirmThatMyShipmentDoes;

  /// No description provided for @uiIConsentToTheCollectionAnd.
  ///
  /// In en, this message translates to:
  /// **'I consent to the collection and processing of my personal data as described in the '**
  String get uiIConsentToTheCollectionAnd;

  /// No description provided for @uiIHavePersonallyInspectedTheContents.
  ///
  /// In en, this message translates to:
  /// **'I have personally inspected the contents and confirm the items match the delivery description.'**
  String get uiIHavePersonallyInspectedTheContents;

  /// No description provided for @uiIHaveReadAndAgreeTo.
  ///
  /// In en, this message translates to:
  /// **'I have read and agree to the '**
  String get uiIHaveReadAndAgreeTo;

  /// No description provided for @uiIUnderstandAndAgreeToAll.
  ///
  /// In en, this message translates to:
  /// **'I understand and agree to all terms'**
  String get uiIUnderstandAndAgreeToAll;

  /// No description provided for @uiIUnderstandThatIMustNot.
  ///
  /// In en, this message translates to:
  /// **'I understand that I must not transport illegal, dangerous, restricted, undisclosed, or suspicious items.'**
  String get uiIUnderstandThatIMustNot;

  /// No description provided for @uiIUnderstandTheTravelerMayInspect.
  ///
  /// In en, this message translates to:
  /// **'I understand the traveler may inspect the contents for safety and compliance.'**
  String get uiIUnderstandTheTravelerMayInspect;

  /// No description provided for @uiIWouldLikeToReceivePromotional.
  ///
  /// In en, this message translates to:
  /// **'I would like to receive promotional offers and updates via email.'**
  String get uiIWouldLikeToReceivePromotional;

  /// No description provided for @uiIban.
  ///
  /// In en, this message translates to:
  /// **'IBAN *'**
  String get uiIban;

  /// No description provided for @uiIdVerified.
  ///
  /// In en, this message translates to:
  /// **'ID\nVerified'**
  String get uiIdVerified;

  /// No description provided for @uiIdentityVerificationRequired.
  ///
  /// In en, this message translates to:
  /// **'Identity Verification Required'**
  String get uiIdentityVerificationRequired;

  /// No description provided for @uiIdentityVerificationApproved.
  ///
  /// In en, this message translates to:
  /// **'Identity verification approved!'**
  String get uiIdentityVerificationApproved;

  /// No description provided for @uiImageUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Image unavailable'**
  String get uiImageUnavailable;

  /// No description provided for @uiInEscrow.
  ///
  /// In en, this message translates to:
  /// **'In escrow'**
  String get uiInEscrow;

  /// No description provided for @uiInbox.
  ///
  /// In en, this message translates to:
  /// **'Inbox'**
  String get uiInbox;

  /// No description provided for @uiIndividual.
  ///
  /// In en, this message translates to:
  /// **'Individual'**
  String get uiIndividual;

  /// No description provided for @uiInsufficientBalance.
  ///
  /// In en, this message translates to:
  /// **'Insufficient balance.'**
  String get uiInsufficientBalance;

  /// No description provided for @uiInsuranceIncluded.
  ///
  /// In en, this message translates to:
  /// **'Insurance included'**
  String get uiInsuranceIncluded;

  /// No description provided for @uiInsuredDelivery.
  ///
  /// In en, this message translates to:
  /// **'Insured\nDelivery'**
  String get uiInsuredDelivery;

  /// No description provided for @uiInviteOthersWithTheSameDestination.
  ///
  /// In en, this message translates to:
  /// **'Invite others with the same destination'**
  String get uiInviteOthersWithTheSameDestination;

  /// No description provided for @uiItemCategory.
  ///
  /// In en, this message translates to:
  /// **'Item Category'**
  String get uiItemCategory;

  /// No description provided for @uiItemDescription.
  ///
  /// In en, this message translates to:
  /// **'Item Description'**
  String get uiItemDescription;

  /// No description provided for @uiJohnDoe.
  ///
  /// In en, this message translates to:
  /// **'John Doe'**
  String get uiJohnDoe;

  /// No description provided for @uiJourneyMap.
  ///
  /// In en, this message translates to:
  /// **'Journey Map'**
  String get uiJourneyMap;

  /// No description provided for @uiKeep.
  ///
  /// In en, this message translates to:
  /// **'Keep'**
  String get uiKeep;

  /// No description provided for @uiKeepTheSenderUpdatedOnThe.
  ///
  /// In en, this message translates to:
  /// **'Keep the sender updated on the shipment progress.'**
  String get uiKeepTheSenderUpdatedOnThe;

  /// No description provided for @uiLinkedPayoutAccount.
  ///
  /// In en, this message translates to:
  /// **'LINKED PAYOUT ACCOUNT'**
  String get uiLinkedPayoutAccount;

  /// No description provided for @uiLocationInformation.
  ///
  /// In en, this message translates to:
  /// **'LOCATION INFORMATION'**
  String get uiLocationInformation;

  /// No description provided for @uiLastName.
  ///
  /// In en, this message translates to:
  /// **'Last Name *'**
  String get uiLastName;

  /// No description provided for @uiLastUpdatedJuly152026.
  ///
  /// In en, this message translates to:
  /// **'Last updated: July 15, 2026'**
  String get uiLastUpdatedJuly152026;

  /// No description provided for @uiLastUpdatedJuly172026.
  ///
  /// In en, this message translates to:
  /// **'Last updated: July 17, 2026'**
  String get uiLastUpdatedJuly172026;

  /// No description provided for @uiLinkBankAccount.
  ///
  /// In en, this message translates to:
  /// **'Link Bank Account'**
  String get uiLinkBankAccount;

  /// No description provided for @uiListTheItemsYouWantTo.
  ///
  /// In en, this message translates to:
  /// **'List the items you want to ship...'**
  String get uiListTheItemsYouWantTo;

  /// No description provided for @uiLiveChat.
  ///
  /// In en, this message translates to:
  /// **'Live Chat'**
  String get uiLiveChat;

  /// No description provided for @uiLiveChat2.
  ///
  /// In en, this message translates to:
  /// **'Live chat'**
  String get uiLiveChat2;

  /// No description provided for @uiLivenessCheck.
  ///
  /// In en, this message translates to:
  /// **'Liveness Check'**
  String get uiLivenessCheck;

  /// No description provided for @uiLoadingMap.
  ///
  /// In en, this message translates to:
  /// **'Loading map...'**
  String get uiLoadingMap;

  /// No description provided for @uiLocked.
  ///
  /// In en, this message translates to:
  /// **'Locked'**
  String get uiLocked;

  /// No description provided for @uiLogout.
  ///
  /// In en, this message translates to:
  /// **'Logout'**
  String get uiLogout;

  /// No description provided for @uiMmDdYyyy.
  ///
  /// In en, this message translates to:
  /// **'MM/DD/YYYY'**
  String get uiMmDdYyyy;

  /// No description provided for @uiMyBio.
  ///
  /// In en, this message translates to:
  /// **'MY BIO'**
  String get uiMyBio;

  /// No description provided for @uiMakeSureAllTextIsClearly.
  ///
  /// In en, this message translates to:
  /// **'Make sure all text is clearly visible and there\'s no glare.'**
  String get uiMakeSureAllTextIsClearly;

  /// No description provided for @uiManage.
  ///
  /// In en, this message translates to:
  /// **'Manage'**
  String get uiManage;

  /// No description provided for @uiMarketingCommunications.
  ///
  /// In en, this message translates to:
  /// **'Marketing Communications'**
  String get uiMarketingCommunications;

  /// No description provided for @uiMembersWithABioAre3x.
  ///
  /// In en, this message translates to:
  /// **'Members with a bio are 3x more likely to have their shipments or trips booked. A complete profile builds trust in the Bago community.'**
  String get uiMembersWithABioAre3x;

  /// No description provided for @uiMessage.
  ///
  /// In en, this message translates to:
  /// **'Message'**
  String get uiMessage;

  /// No description provided for @uiMethod.
  ///
  /// In en, this message translates to:
  /// **'Method'**
  String get uiMethod;

  /// No description provided for @uiMinimum.
  ///
  /// In en, this message translates to:
  /// **'Minimum'**
  String get uiMinimum;

  /// No description provided for @uiMyShipmentDoesNotContainAny.
  ///
  /// In en, this message translates to:
  /// **'My shipment does not contain any prohibited or restricted items.'**
  String get uiMyShipmentDoesNotContainAny;

  /// No description provided for @uiNotificationSettings.
  ///
  /// In en, this message translates to:
  /// **'NOTIFICATION SETTINGS'**
  String get uiNotificationSettings;

  /// No description provided for @uiNameAndDateOfBirthAre.
  ///
  /// In en, this message translates to:
  /// **'Name and date of birth are locked after KYC approval.'**
  String get uiNameAndDateOfBirthAre;

  /// No description provided for @uiNameMustBeAtLeast2.
  ///
  /// In en, this message translates to:
  /// **'Name must be at least 2 characters'**
  String get uiNameMustBeAtLeast2;

  /// No description provided for @uiNewConversation.
  ///
  /// In en, this message translates to:
  /// **'New conversation'**
  String get uiNewConversation;

  /// No description provided for @uiNewShipment.
  ///
  /// In en, this message translates to:
  /// **'New shipment'**
  String get uiNewShipment;

  /// No description provided for @uiNewShipmentRequest.
  ///
  /// In en, this message translates to:
  /// **'New shipment request'**
  String get uiNewShipmentRequest;

  /// No description provided for @uiNewTicket.
  ///
  /// In en, this message translates to:
  /// **'New ticket'**
  String get uiNewTicket;

  /// No description provided for @uiNoActiveConversationsYet.
  ///
  /// In en, this message translates to:
  /// **'No active conversations yet'**
  String get uiNoActiveConversationsYet;

  /// No description provided for @uiNoBanksFound.
  ///
  /// In en, this message translates to:
  /// **'No banks found'**
  String get uiNoBanksFound;

  /// No description provided for @uiNoCitiesFound.
  ///
  /// In en, this message translates to:
  /// **'No cities found'**
  String get uiNoCitiesFound;

  /// No description provided for @uiNoHelpArticlesMatchedThatSearch.
  ///
  /// In en, this message translates to:
  /// **'No help articles matched that search'**
  String get uiNoHelpArticlesMatchedThatSearch;

  /// No description provided for @uiNoPayoutMethodLinked.
  ///
  /// In en, this message translates to:
  /// **'No payout method linked'**
  String get uiNoPayoutMethodLinked;

  /// No description provided for @uiNoProhibitedItems.
  ///
  /// In en, this message translates to:
  /// **'No prohibited items'**
  String get uiNoProhibitedItems;

  /// No description provided for @uiNoRecentSearches.
  ///
  /// In en, this message translates to:
  /// **'No recent searches'**
  String get uiNoRecentSearches;

  /// No description provided for @uiNoReferredUsersYet.
  ///
  /// In en, this message translates to:
  /// **'No referred users yet.'**
  String get uiNoReferredUsersYet;

  /// No description provided for @uiNoSavedRoutesFound.
  ///
  /// In en, this message translates to:
  /// **'No saved routes found.'**
  String get uiNoSavedRoutesFound;

  /// No description provided for @uiNoServicesYetAddANamed.
  ///
  /// In en, this message translates to:
  /// **'No services yet. Add a named rate like \"Express\" or \"Standard\" — senders will see it priced the same way as any trip, everywhere in the app.'**
  String get uiNoServicesYetAddANamed;

  /// No description provided for @uiNoTravelersYet.
  ///
  /// In en, this message translates to:
  /// **'No travelers yet'**
  String get uiNoTravelersYet;

  /// No description provided for @uiNone.
  ///
  /// In en, this message translates to:
  /// **'None'**
  String get uiNone;

  /// No description provided for @uiNotNow.
  ///
  /// In en, this message translates to:
  /// **'Not now'**
  String get uiNotNow;

  /// No description provided for @uiNoteForTravelerOptional.
  ///
  /// In en, this message translates to:
  /// **'Note for traveler (optional)'**
  String get uiNoteForTravelerOptional;

  /// No description provided for @uiNoteToTraveler.
  ///
  /// In en, this message translates to:
  /// **'Note to traveler'**
  String get uiNoteToTraveler;

  /// No description provided for @uiNotesOptional.
  ///
  /// In en, this message translates to:
  /// **'Notes (optional)'**
  String get uiNotesOptional;

  /// No description provided for @uiOpen.
  ///
  /// In en, this message translates to:
  /// **'Open'**
  String get uiOpen;

  /// No description provided for @uiOpenBoxInspectionRequired.
  ///
  /// In en, this message translates to:
  /// **'Open Box Inspection Required'**
  String get uiOpenBoxInspectionRequired;

  /// No description provided for @uiOpenChat.
  ///
  /// In en, this message translates to:
  /// **'Open Chat'**
  String get uiOpenChat;

  /// No description provided for @uiOpenSettings.
  ///
  /// In en, this message translates to:
  /// **'Open Settings'**
  String get uiOpenSettings;

  /// No description provided for @uiOpenInbox.
  ///
  /// In en, this message translates to:
  /// **'Open inbox'**
  String get uiOpenInbox;

  /// No description provided for @uiOpenToInspection.
  ///
  /// In en, this message translates to:
  /// **'Open to inspection'**
  String get uiOpenToInspection;

  /// No description provided for @uiOpenWebSupport.
  ///
  /// In en, this message translates to:
  /// **'Open web support'**
  String get uiOpenWebSupport;

  /// No description provided for @uiOptional.
  ///
  /// In en, this message translates to:
  /// **'Optional'**
  String get uiOptional;

  /// No description provided for @uiOptionalPreferences.
  ///
  /// In en, this message translates to:
  /// **'Optional Preferences'**
  String get uiOptionalPreferences;

  /// No description provided for @uiOptionalHandlingInstructions.
  ///
  /// In en, this message translates to:
  /// **'Optional handling instructions…'**
  String get uiOptionalHandlingInstructions;

  /// No description provided for @uiOptionalSkipIfYourIdHas.
  ///
  /// In en, this message translates to:
  /// **'Optional — skip if your ID has no back side'**
  String get uiOptionalSkipIfYourIdHas;

  /// No description provided for @uiOptional2.
  ///
  /// In en, this message translates to:
  /// **'Optional:'**
  String get uiOptional2;

  /// No description provided for @uiOriginCountry.
  ///
  /// In en, this message translates to:
  /// **'Origin country'**
  String get uiOriginCountry;

  /// No description provided for @uiOurTeamWillReviewYourIdentity.
  ///
  /// In en, this message translates to:
  /// **'Our team will review your identity documents within 1–2 business days. You\'ll receive a notification when it\'s done.'**
  String get uiOurTeamWillReviewYourIdentity;

  /// No description provided for @uiPackageDeclaration.
  ///
  /// In en, this message translates to:
  /// **'PACKAGE DECLARATION'**
  String get uiPackageDeclaration;

  /// No description provided for @uiPersonalInformation.
  ///
  /// In en, this message translates to:
  /// **'PERSONAL INFORMATION'**
  String get uiPersonalInformation;

  /// No description provided for @uiPopularCities.
  ///
  /// In en, this message translates to:
  /// **'POPULAR CITIES'**
  String get uiPopularCities;

  /// No description provided for @uiProofOfCollectionRequired.
  ///
  /// In en, this message translates to:
  /// **'PROOF OF COLLECTION REQUIRED'**
  String get uiProofOfCollectionRequired;

  /// No description provided for @uiPackage.
  ///
  /// In en, this message translates to:
  /// **'Package'**
  String get uiPackage;

  /// No description provided for @uiPackageUnderReviewDoNotTransport.
  ///
  /// In en, this message translates to:
  /// **'Package Under Review\nDo not transport or collect this package while Bago reviews the evidence.'**
  String get uiPackageUnderReviewDoNotTransport;

  /// No description provided for @uiPasscode.
  ///
  /// In en, this message translates to:
  /// **'Passcode'**
  String get uiPasscode;

  /// No description provided for @uiPasscodesDoNotMatch.
  ///
  /// In en, this message translates to:
  /// **'Passcodes do not match.'**
  String get uiPasscodesDoNotMatch;

  /// No description provided for @uiPaymentAndConversionFees.
  ///
  /// In en, this message translates to:
  /// **'Payment and conversion fees'**
  String get uiPaymentAndConversionFees;

  /// No description provided for @uiPaymentDetailsAreProcessedByFlutterwave.
  ///
  /// In en, this message translates to:
  /// **'Payment details are processed by Flutterwave. Bago stores only safe payment references for support, refunds, and shipment tracking.'**
  String get uiPaymentDetailsAreProcessedByFlutterwave;

  /// No description provided for @uiPayoutCurrency.
  ///
  /// In en, this message translates to:
  /// **'Payout currency'**
  String get uiPayoutCurrency;

  /// No description provided for @uiPayoutStatus.
  ///
  /// In en, this message translates to:
  /// **'Payout status'**
  String get uiPayoutStatus;

  /// No description provided for @uiPayoutStatusRefreshed.
  ///
  /// In en, this message translates to:
  /// **'Payout status refreshed.'**
  String get uiPayoutStatusRefreshed;

  /// No description provided for @uiPayoutsReleaseAfterDeliveryIsComplete.
  ///
  /// In en, this message translates to:
  /// **'Payouts release after delivery is complete, confirmed, and cleared.'**
  String get uiPayoutsReleaseAfterDeliveryIsComplete;

  /// No description provided for @uiPersonalAccount.
  ///
  /// In en, this message translates to:
  /// **'Personal account'**
  String get uiPersonalAccount;

  /// No description provided for @uiPhoneNumberUpdated.
  ///
  /// In en, this message translates to:
  /// **'Phone Number Updated!'**
  String get uiPhoneNumberUpdated;

  /// No description provided for @uiPhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Phone number'**
  String get uiPhoneNumber;

  /// No description provided for @uiPhoneNumberChangesAreConfirmedWith.
  ///
  /// In en, this message translates to:
  /// **'Phone number changes are confirmed with an OTP sent to your email.'**
  String get uiPhoneNumberChangesAreConfirmedWith;

  /// No description provided for @uiPickUpWhereYouLeftOff.
  ///
  /// In en, this message translates to:
  /// **'Pick up where you left off'**
  String get uiPickUpWhereYouLeftOff;

  /// No description provided for @uiPickupAndDestinationCitiesMustBe.
  ///
  /// In en, this message translates to:
  /// **'Pickup and destination cities must be different.'**
  String get uiPickupAndDestinationCitiesMustBe;

  /// No description provided for @uiPleaseAcceptAllRequiredTerms.
  ///
  /// In en, this message translates to:
  /// **'Please accept all required terms'**
  String get uiPleaseAcceptAllRequiredTerms;

  /// No description provided for @uiPleaseAgreeToTheTermsAnd.
  ///
  /// In en, this message translates to:
  /// **'Please agree to the terms and conditions'**
  String get uiPleaseAgreeToTheTermsAnd;

  /// No description provided for @uiPleaseConfirmYourLegalNameAnd.
  ///
  /// In en, this message translates to:
  /// **'Please confirm your legal name and date of birth exactly as they appear on your ID document. These must match for verification to succeed.'**
  String get uiPleaseConfirmYourLegalNameAnd;

  /// No description provided for @uiPleaseDescribeYourIssue.
  ///
  /// In en, this message translates to:
  /// **'Please describe your issue'**
  String get uiPleaseDescribeYourIssue;

  /// No description provided for @uiPleaseEnterAValid10Digit.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid 10-digit account number'**
  String get uiPleaseEnterAValid10Digit;

  /// No description provided for @uiPleaseEnterAValidIban.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid IBAN.'**
  String get uiPleaseEnterAValidIban;

  /// No description provided for @uiPleaseEnterAValidOtp.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid OTP'**
  String get uiPleaseEnterAValidOtp;

  /// No description provided for @uiPleaseEnterAValidAccountNumber.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid account number.'**
  String get uiPleaseEnterAValidAccountNumber;

  /// No description provided for @uiPleaseEnterAValidAmount.
  ///
  /// In en, this message translates to:
  /// **'Please enter a valid amount.'**
  String get uiPleaseEnterAValidAmount;

  /// No description provided for @uiPleaseEnterThe6DigitCode.
  ///
  /// In en, this message translates to:
  /// **'Please enter the 6-digit code'**
  String get uiPleaseEnterThe6DigitCode;

  /// No description provided for @uiPleaseEnterThe6DigitCode2.
  ///
  /// In en, this message translates to:
  /// **'Please enter the 6-digit code.'**
  String get uiPleaseEnterThe6DigitCode2;

  /// No description provided for @uiPleaseEnterTheSwiftBicCode.
  ///
  /// In en, this message translates to:
  /// **'Please enter the SWIFT/BIC code.'**
  String get uiPleaseEnterTheSwiftBicCode;

  /// No description provided for @uiPleaseEnterTheAccountHolderName.
  ///
  /// In en, this message translates to:
  /// **'Please enter the account holder name.'**
  String get uiPleaseEnterTheAccountHolderName;

  /// No description provided for @uiPleaseEnterYourDateOfBirth.
  ///
  /// In en, this message translates to:
  /// **'Please enter your date of birth'**
  String get uiPleaseEnterYourDateOfBirth;

  /// No description provided for @uiPleaseEnterYourFirstAndLast.
  ///
  /// In en, this message translates to:
  /// **'Please enter your first and last name'**
  String get uiPleaseEnterYourFirstAndLast;

  /// No description provided for @uiPleaseEnterYourFullName.
  ///
  /// In en, this message translates to:
  /// **'Please enter your full name'**
  String get uiPleaseEnterYourFullName;

  /// No description provided for @uiPleaseEnterYourNameSoWe.
  ///
  /// In en, this message translates to:
  /// **'Please enter your name so we know what to call you.'**
  String get uiPleaseEnterYourNameSoWe;

  /// No description provided for @uiPleaseEnterYourPhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Please enter your phone number'**
  String get uiPleaseEnterYourPhoneNumber;

  /// No description provided for @uiPleaseEnterYourRealNameSo.
  ///
  /// In en, this message translates to:
  /// **'Please enter your real name so others know who they\'re working with.'**
  String get uiPleaseEnterYourRealNameSo;

  /// No description provided for @uiPleaseFillAllRequiredFields.
  ///
  /// In en, this message translates to:
  /// **'Please fill all required fields'**
  String get uiPleaseFillAllRequiredFields;

  /// No description provided for @uiPleaseFillInAllReceiverDetails.
  ///
  /// In en, this message translates to:
  /// **'Please fill in all receiver details.'**
  String get uiPleaseFillInAllReceiverDetails;

  /// No description provided for @uiPleaseFillInTheRequiredFields.
  ///
  /// In en, this message translates to:
  /// **'Please fill in the required fields'**
  String get uiPleaseFillInTheRequiredFields;

  /// No description provided for @uiPleaseFillInYourAddressStreet.
  ///
  /// In en, this message translates to:
  /// **'Please fill in your address (street, city, postal code, and country).'**
  String get uiPleaseFillInYourAddressStreet;

  /// No description provided for @uiPleaseLinkABankAccountBefore.
  ///
  /// In en, this message translates to:
  /// **'Please link a bank account before withdrawing.'**
  String get uiPleaseLinkABankAccountBefore;

  /// No description provided for @uiPleaseReadAndConfirmEachStatement.
  ///
  /// In en, this message translates to:
  /// **'Please read and confirm each statement before sending your shipment.'**
  String get uiPleaseReadAndConfirmEachStatement;

  /// No description provided for @uiPleaseReadTheseTermsOfService.
  ///
  /// In en, this message translates to:
  /// **'Please read these Terms of Service carefully before using Bago. These terms govern your use of our platform and services.'**
  String get uiPleaseReadTheseTermsOfService;

  /// No description provided for @uiPleaseReviewOurPolicies.
  ///
  /// In en, this message translates to:
  /// **'Please review\nour policies'**
  String get uiPleaseReviewOurPolicies;

  /// No description provided for @uiPleaseSelectABank.
  ///
  /// In en, this message translates to:
  /// **'Please select a bank'**
  String get uiPleaseSelectABank;

  /// No description provided for @uiPleaseSelectABankAndEnter.
  ///
  /// In en, this message translates to:
  /// **'Please select a bank and enter account number.'**
  String get uiPleaseSelectABankAndEnter;

  /// No description provided for @uiPleaseSelectARole.
  ///
  /// In en, this message translates to:
  /// **'Please select a role'**
  String get uiPleaseSelectARole;

  /// No description provided for @uiPleaseSelectAnAuthenticationMethod.
  ///
  /// In en, this message translates to:
  /// **'Please select an authentication method'**
  String get uiPleaseSelectAnAuthenticationMethod;

  /// No description provided for @uiPleaseSetYourPreferredCurrencyIn.
  ///
  /// In en, this message translates to:
  /// **'Please set your preferred currency in profile settings before continuing.'**
  String get uiPleaseSetYourPreferredCurrencyIn;

  /// No description provided for @uiPleaseSetYourPreferredCurrencyIn2.
  ///
  /// In en, this message translates to:
  /// **'Please set your preferred currency in profile settings before requesting shipping.'**
  String get uiPleaseSetYourPreferredCurrencyIn2;

  /// No description provided for @uiPleaseSetYourPreferredCurrencyIn3.
  ///
  /// In en, this message translates to:
  /// **'Please set your preferred currency in profile settings before withdrawing.'**
  String get uiPleaseSetYourPreferredCurrencyIn3;

  /// No description provided for @uiPleaseVerifyYourPhoneNumberBefore.
  ///
  /// In en, this message translates to:
  /// **'Please verify your phone number before posting a trip.'**
  String get uiPleaseVerifyYourPhoneNumberBefore;

  /// No description provided for @uiPleaseWaitForAccountVerification.
  ///
  /// In en, this message translates to:
  /// **'Please wait for account verification'**
  String get uiPleaseWaitForAccountVerification;

  /// No description provided for @uiPoolYourShipmentWithOthersGoing.
  ///
  /// In en, this message translates to:
  /// **'Pool your shipment with others going to the same destination to split costs and get cheaper rates.'**
  String get uiPoolYourShipmentWithOthersGoing;

  /// No description provided for @uiPostTrip.
  ///
  /// In en, this message translates to:
  /// **'Post trip'**
  String get uiPostTrip;

  /// No description provided for @uiPostalCode.
  ///
  /// In en, this message translates to:
  /// **'Postal Code *'**
  String get uiPostalCode;

  /// No description provided for @uiPressAndHoldThisDraftTo.
  ///
  /// In en, this message translates to:
  /// **'Press and hold this draft to delete it'**
  String get uiPressAndHoldThisDraftTo;

  /// No description provided for @uiPricePerKg.
  ///
  /// In en, this message translates to:
  /// **'Price per kg'**
  String get uiPricePerKg;

  /// No description provided for @uiPrivacyConsent.
  ///
  /// In en, this message translates to:
  /// **'Privacy & Consent'**
  String get uiPrivacyConsent;

  /// No description provided for @uiPrivacyPolicy.
  ///
  /// In en, this message translates to:
  /// **'Privacy Policy *'**
  String get uiPrivacyPolicy;

  /// No description provided for @uiProcessingYourVerification.
  ///
  /// In en, this message translates to:
  /// **'Processing your verification…'**
  String get uiProcessingYourVerification;

  /// No description provided for @uiProfilePhotoUpdated.
  ///
  /// In en, this message translates to:
  /// **'Profile photo updated'**
  String get uiProfilePhotoUpdated;

  /// No description provided for @uiProfileUpdatedSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Profile updated successfully'**
  String get uiProfileUpdatedSuccessfully;

  /// No description provided for @uiProhibitedItems.
  ///
  /// In en, this message translates to:
  /// **'Prohibited Items'**
  String get uiProhibitedItems;

  /// No description provided for @uiProof.
  ///
  /// In en, this message translates to:
  /// **'Proof'**
  String get uiProof;

  /// No description provided for @uiProofOfTrip.
  ///
  /// In en, this message translates to:
  /// **'Proof of trip'**
  String get uiProofOfTrip;

  /// No description provided for @uiProtectMyItem.
  ///
  /// In en, this message translates to:
  /// **'Protect my item'**
  String get uiProtectMyItem;

  /// No description provided for @uiProtectedByBankGradeEncryption.
  ///
  /// In en, this message translates to:
  /// **'Protected by bank-grade encryption'**
  String get uiProtectedByBankGradeEncryption;

  /// No description provided for @uiPublish.
  ///
  /// In en, this message translates to:
  /// **'Publish'**
  String get uiPublish;

  /// No description provided for @uiPushNotifications.
  ///
  /// In en, this message translates to:
  /// **'Push Notifications'**
  String get uiPushNotifications;

  /// No description provided for @uiQualifiedShipment.
  ///
  /// In en, this message translates to:
  /// **'Qualified shipment'**
  String get uiQualifiedShipment;

  /// No description provided for @uiQuickUnlockAfterInactivity.
  ///
  /// In en, this message translates to:
  /// **'Quick unlock after inactivity'**
  String get uiQuickUnlockAfterInactivity;

  /// No description provided for @uiRateThisShipmentExperienceAndAdd.
  ///
  /// In en, this message translates to:
  /// **'Rate this shipment experience and add a short comment.'**
  String get uiRateThisShipmentExperienceAndAdd;

  /// No description provided for @uiReEnterPasscode.
  ///
  /// In en, this message translates to:
  /// **'Re-enter passcode'**
  String get uiReEnterPasscode;

  /// No description provided for @uiReadyToWithdraw.
  ///
  /// In en, this message translates to:
  /// **'Ready to withdraw'**
  String get uiReadyToWithdraw;

  /// No description provided for @uiReadyToWithdrawHeldInEscrow.
  ///
  /// In en, this message translates to:
  /// **'Ready to withdraw + held in escrow'**
  String get uiReadyToWithdrawHeldInEscrow;

  /// No description provided for @uiRealTimeTracking.
  ///
  /// In en, this message translates to:
  /// **'Real-Time\nTracking'**
  String get uiRealTimeTracking;

  /// No description provided for @uiReason.
  ///
  /// In en, this message translates to:
  /// **'Reason'**
  String get uiReason;

  /// No description provided for @uiReceiverDetails.
  ///
  /// In en, this message translates to:
  /// **'Receiver Details'**
  String get uiReceiverDetails;

  /// No description provided for @uiRecentSearches.
  ///
  /// In en, this message translates to:
  /// **'Recent Searches'**
  String get uiRecentSearches;

  /// No description provided for @uiReferralEarnings.
  ///
  /// In en, this message translates to:
  /// **'Referral earnings'**
  String get uiReferralEarnings;

  /// No description provided for @uiReferrals.
  ///
  /// In en, this message translates to:
  /// **'Referrals'**
  String get uiReferrals;

  /// No description provided for @uiReferredUsers.
  ///
  /// In en, this message translates to:
  /// **'Referred users'**
  String get uiReferredUsers;

  /// No description provided for @uiRefresh.
  ///
  /// In en, this message translates to:
  /// **'Refresh'**
  String get uiRefresh;

  /// No description provided for @uiRefreshWallet.
  ///
  /// In en, this message translates to:
  /// **'Refresh wallet'**
  String get uiRefreshWallet;

  /// No description provided for @uiReject.
  ///
  /// In en, this message translates to:
  /// **'Reject'**
  String get uiReject;

  /// No description provided for @uiRejectPackage.
  ///
  /// In en, this message translates to:
  /// **'Reject Package'**
  String get uiRejectPackage;

  /// No description provided for @uiRejectionReasonIfRejecting.
  ///
  /// In en, this message translates to:
  /// **'Rejection reason (if rejecting)'**
  String get uiRejectionReasonIfRejecting;

  /// No description provided for @uiRemaining.
  ///
  /// In en, this message translates to:
  /// **'Remaining'**
  String get uiRemaining;

  /// No description provided for @uiRemove.
  ///
  /// In en, this message translates to:
  /// **'Remove'**
  String get uiRemove;

  /// No description provided for @uiRemoveAppPasscode.
  ///
  /// In en, this message translates to:
  /// **'Remove app passcode'**
  String get uiRemoveAppPasscode;

  /// No description provided for @uiRemoveFromHistory.
  ///
  /// In en, this message translates to:
  /// **'Remove from history?'**
  String get uiRemoveFromHistory;

  /// No description provided for @uiRemoveService.
  ///
  /// In en, this message translates to:
  /// **'Remove service'**
  String get uiRemoveService;

  /// No description provided for @uiReplyToSupport.
  ///
  /// In en, this message translates to:
  /// **'Reply to support…'**
  String get uiReplyToSupport;

  /// No description provided for @uiReportIssue.
  ///
  /// In en, this message translates to:
  /// **'Report issue'**
  String get uiReportIssue;

  /// No description provided for @uiReportShipment.
  ///
  /// In en, this message translates to:
  /// **'Report shipment'**
  String get uiReportShipment;

  /// No description provided for @uiRequestShipment.
  ///
  /// In en, this message translates to:
  /// **'Request Shipment'**
  String get uiRequestShipment;

  /// No description provided for @uiRequestACurrencyChange.
  ///
  /// In en, this message translates to:
  /// **'Request a currency change'**
  String get uiRequestACurrencyChange;

  /// No description provided for @uiRequestAccepted.
  ///
  /// In en, this message translates to:
  /// **'Request accepted'**
  String get uiRequestAccepted;

  /// No description provided for @uiRequestAccepted2.
  ///
  /// In en, this message translates to:
  /// **'Request accepted!'**
  String get uiRequestAccepted2;

  /// No description provided for @uiRequestDeclined.
  ///
  /// In en, this message translates to:
  /// **'Request declined'**
  String get uiRequestDeclined;

  /// No description provided for @uiRequestDeclined2.
  ///
  /// In en, this message translates to:
  /// **'Request declined.'**
  String get uiRequestDeclined2;

  /// No description provided for @uiRequestNotFound.
  ///
  /// In en, this message translates to:
  /// **'Request not found'**
  String get uiRequestNotFound;

  /// No description provided for @uiRequestSentSupportWillUpdateYou.
  ///
  /// In en, this message translates to:
  /// **'Request sent. Support will update you in your tickets.'**
  String get uiRequestSentSupportWillUpdateYou;

  /// No description provided for @uiRequestsWillAppearHereWhenSenders.
  ///
  /// In en, this message translates to:
  /// **'Requests will appear here when senders ask you to carry a package.'**
  String get uiRequestsWillAppearHereWhenSenders;

  /// No description provided for @uiRequiredAgreements.
  ///
  /// In en, this message translates to:
  /// **'Required Agreements'**
  String get uiRequiredAgreements;

  /// No description provided for @uiRequiredAgreements2.
  ///
  /// In en, this message translates to:
  /// **'Required agreements:'**
  String get uiRequiredAgreements2;

  /// No description provided for @uiRequiredByOurPayoutProviderTo.
  ///
  /// In en, this message translates to:
  /// **'Required by our payout provider to verify EUR/GBP transfers.'**
  String get uiRequiredByOurPayoutProviderTo;

  /// No description provided for @uiReserved.
  ///
  /// In en, this message translates to:
  /// **'Reserved'**
  String get uiReserved;

  /// No description provided for @uiRetake.
  ///
  /// In en, this message translates to:
  /// **'Retake'**
  String get uiRetake;

  /// No description provided for @uiReviewYourTrip.
  ///
  /// In en, this message translates to:
  /// **'Review Your Trip'**
  String get uiReviewYourTrip;

  /// No description provided for @uiReviewPackageRequestsFromSendersWaiting.
  ///
  /// In en, this message translates to:
  /// **'Review package requests from senders waiting for your trip.'**
  String get uiReviewPackageRequestsFromSendersWaiting;

  /// No description provided for @uiReviewYourShipmentDetailsAndConfirm.
  ///
  /// In en, this message translates to:
  /// **'Review your shipment details and confirm your item is safe to send.'**
  String get uiReviewYourShipmentDetailsAndConfirm;

  /// No description provided for @uiRewardRules.
  ///
  /// In en, this message translates to:
  /// **'Reward rules'**
  String get uiRewardRules;

  /// No description provided for @uiRouteDeleted.
  ///
  /// In en, this message translates to:
  /// **'Route deleted'**
  String get uiRouteDeleted;

  /// No description provided for @uiRoutingNumberUsBanks.
  ///
  /// In en, this message translates to:
  /// **'Routing Number (US banks)'**
  String get uiRoutingNumberUsBanks;

  /// No description provided for @uiStillNeedHelp.
  ///
  /// In en, this message translates to:
  /// **'STILL NEED HELP?'**
  String get uiStillNeedHelp;

  /// No description provided for @uiSubject.
  ///
  /// In en, this message translates to:
  /// **'SUBJECT'**
  String get uiSubject;

  /// No description provided for @uiSwiftBicBanksOutsideTheUs.
  ///
  /// In en, this message translates to:
  /// **'SWIFT / BIC (banks outside the US)'**
  String get uiSwiftBicBanksOutsideTheUs;

  /// No description provided for @uiSwiftBic.
  ///
  /// In en, this message translates to:
  /// **'SWIFT/BIC'**
  String get uiSwiftBic;

  /// No description provided for @uiSwiftBic2.
  ///
  /// In en, this message translates to:
  /// **'SWIFT/BIC *'**
  String get uiSwiftBic2;

  /// No description provided for @uiSafetyCheck.
  ///
  /// In en, this message translates to:
  /// **'Safety Check'**
  String get uiSafetyCheck;

  /// No description provided for @uiSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get uiSave;

  /// No description provided for @uiSaveBankAccount.
  ///
  /// In en, this message translates to:
  /// **'Save Bank Account'**
  String get uiSaveBankAccount;

  /// No description provided for @uiSearchAgain.
  ///
  /// In en, this message translates to:
  /// **'Search Again'**
  String get uiSearchAgain;

  /// No description provided for @uiSearchTravelers.
  ///
  /// In en, this message translates to:
  /// **'Search Travelers'**
  String get uiSearchTravelers;

  /// No description provided for @uiSearchBank.
  ///
  /// In en, this message translates to:
  /// **'Search bank...'**
  String get uiSearchBank;

  /// No description provided for @uiSearchBanks.
  ///
  /// In en, this message translates to:
  /// **'Search banks...'**
  String get uiSearchBanks;

  /// No description provided for @uiSearchChatsNamesOrRoutes.
  ///
  /// In en, this message translates to:
  /// **'Search chats, names, or routes'**
  String get uiSearchChatsNamesOrRoutes;

  /// No description provided for @uiSearchCity.
  ///
  /// In en, this message translates to:
  /// **'Search city'**
  String get uiSearchCity;

  /// No description provided for @uiSearchCityAndCountry.
  ///
  /// In en, this message translates to:
  /// **'Search city and country'**
  String get uiSearchCityAndCountry;

  /// No description provided for @uiSearchConversations.
  ///
  /// In en, this message translates to:
  /// **'Search conversations'**
  String get uiSearchConversations;

  /// No description provided for @uiSearchCountry.
  ///
  /// In en, this message translates to:
  /// **'Search country'**
  String get uiSearchCountry;

  /// No description provided for @uiSearchCountryOrCurrency.
  ///
  /// In en, this message translates to:
  /// **'Search country or currency'**
  String get uiSearchCountryOrCurrency;

  /// No description provided for @uiSearchCountryOrDialCode.
  ///
  /// In en, this message translates to:
  /// **'Search country or dial code…'**
  String get uiSearchCountryOrDialCode;

  /// No description provided for @uiSearchCountry2.
  ///
  /// In en, this message translates to:
  /// **'Search country…'**
  String get uiSearchCountry2;

  /// No description provided for @uiSearchForACityOrAirport.
  ///
  /// In en, this message translates to:
  /// **'Search for a city or airport'**
  String get uiSearchForACityOrAirport;

  /// No description provided for @uiSearchForACityOrCountry.
  ///
  /// In en, this message translates to:
  /// **'Search for a city or country'**
  String get uiSearchForACityOrCountry;

  /// No description provided for @uiSecureCheckout.
  ///
  /// In en, this message translates to:
  /// **'Secure checkout'**
  String get uiSecureCheckout;

  /// No description provided for @uiSeeAll.
  ///
  /// In en, this message translates to:
  /// **'See all'**
  String get uiSeeAll;

  /// No description provided for @uiSeeEveryThread.
  ///
  /// In en, this message translates to:
  /// **'See every thread'**
  String get uiSeeEveryThread;

  /// No description provided for @uiSelectBank.
  ///
  /// In en, this message translates to:
  /// **'Select Bank'**
  String get uiSelectBank;

  /// No description provided for @uiSelectBank2.
  ///
  /// In en, this message translates to:
  /// **'Select Bank *'**
  String get uiSelectBank2;

  /// No description provided for @uiSelectARejectionReason.
  ///
  /// In en, this message translates to:
  /// **'Select a rejection reason.'**
  String get uiSelectARejectionReason;

  /// No description provided for @uiSelectEveryItemContainedInThe.
  ///
  /// In en, this message translates to:
  /// **'Select every item contained in the package.'**
  String get uiSelectEveryItemContainedInThe;

  /// No description provided for @uiSelectTheCountryThatIssuedThe.
  ///
  /// In en, this message translates to:
  /// **'Select the country that issued the ID you\'ll use — this decides which document types the verification widget accepts.'**
  String get uiSelectTheCountryThatIssuedThe;

  /// No description provided for @uiSelectYourIdType.
  ///
  /// In en, this message translates to:
  /// **'Select your ID type'**
  String get uiSelectYourIdType;

  /// No description provided for @uiSelected.
  ///
  /// In en, this message translates to:
  /// **'Selected'**
  String get uiSelected;

  /// No description provided for @uiSendCode.
  ///
  /// In en, this message translates to:
  /// **'Send Code'**
  String get uiSendCode;

  /// No description provided for @uiSendAGift.
  ///
  /// In en, this message translates to:
  /// **'Send a Gift'**
  String get uiSendAGift;

  /// No description provided for @uiSendAPackageWithATraveler.
  ///
  /// In en, this message translates to:
  /// **'Send a package with a traveler'**
  String get uiSendAPackageWithATraveler;

  /// No description provided for @uiSendKgRequest.
  ///
  /// In en, this message translates to:
  /// **'Send kg request'**
  String get uiSendKgRequest;

  /// No description provided for @uiSendPackage.
  ///
  /// In en, this message translates to:
  /// **'Send package'**
  String get uiSendPackage;

  /// No description provided for @uiSendRequest.
  ///
  /// In en, this message translates to:
  /// **'Send request'**
  String get uiSendRequest;

  /// No description provided for @uiSendersWillSeeYourAvailableKg.
  ///
  /// In en, this message translates to:
  /// **'Senders will see your available kg and match accordingly.'**
  String get uiSendersWillSeeYourAvailableKg;

  /// No description provided for @uiServiceName.
  ///
  /// In en, this message translates to:
  /// **'Service name'**
  String get uiServiceName;

  /// No description provided for @uiServiceRemoved.
  ///
  /// In en, this message translates to:
  /// **'Service removed'**
  String get uiServiceRemoved;

  /// No description provided for @uiSetAnAppPasscodeOrEnable.
  ///
  /// In en, this message translates to:
  /// **'Set an app passcode or enable biometrics first before turning on quick unlock.'**
  String get uiSetAnAppPasscodeOrEnable;

  /// No description provided for @uiSetCountryCurrency.
  ///
  /// In en, this message translates to:
  /// **'Set country & currency'**
  String get uiSetCountryCurrency;

  /// No description provided for @uiSetUpWithdrawals.
  ///
  /// In en, this message translates to:
  /// **'Set up\nwithdrawals'**
  String get uiSetUpWithdrawals;

  /// No description provided for @uiSetUpAccount.
  ///
  /// In en, this message translates to:
  /// **'Set up account'**
  String get uiSetUpAccount;

  /// No description provided for @uiSetUpPayoutMethod.
  ///
  /// In en, this message translates to:
  /// **'Set up payout method →'**
  String get uiSetUpPayoutMethod;

  /// No description provided for @uiSetYourCountryAndCurrencyFirst.
  ///
  /// In en, this message translates to:
  /// **'Set your country and currency first — it only takes a moment.'**
  String get uiSetYourCountryAndCurrencyFirst;

  /// No description provided for @uiSetYourCountryOfResidenceBefore.
  ///
  /// In en, this message translates to:
  /// **'Set your country of residence before paying. Your payment currency is assigned from that country.'**
  String get uiSetYourCountryOfResidenceBefore;

  /// No description provided for @uiSetYourRateCompetitivePricingAttracts.
  ///
  /// In en, this message translates to:
  /// **'Set your rate. Competitive pricing attracts more senders.'**
  String get uiSetYourRateCompetitivePricingAttracts;

  /// No description provided for @uiShareHowTheShipmentWentSo.
  ///
  /// In en, this message translates to:
  /// **'Share how the shipment went so others can make better decisions.'**
  String get uiShareHowTheShipmentWentSo;

  /// No description provided for @uiShareTheShippingCostSaveUp.
  ///
  /// In en, this message translates to:
  /// **'Share the shipping cost — save up to 60%'**
  String get uiShareTheShippingCostSaveUp;

  /// No description provided for @uiShareThisPinWithTheTraveler.
  ///
  /// In en, this message translates to:
  /// **'Share this PIN with the traveler to confirm handover.'**
  String get uiShareThisPinWithTheTraveler;

  /// No description provided for @uiShareTrip.
  ///
  /// In en, this message translates to:
  /// **'Share trip'**
  String get uiShareTrip;

  /// No description provided for @uiShareWhatWentWellOrWhat.
  ///
  /// In en, this message translates to:
  /// **'Share what went well or what could improve...'**
  String get uiShareWhatWentWellOrWhat;

  /// No description provided for @uiShipmentRequest.
  ///
  /// In en, this message translates to:
  /// **'Shipment Request'**
  String get uiShipmentRequest;

  /// No description provided for @uiShipmentSummary.
  ///
  /// In en, this message translates to:
  /// **'Shipment Summary'**
  String get uiShipmentSummary;

  /// No description provided for @uiShipmentHasBeenDeliveredWaitingFor.
  ///
  /// In en, this message translates to:
  /// **'Shipment has been delivered. Waiting for sender confirmation.'**
  String get uiShipmentHasBeenDeliveredWaitingFor;

  /// No description provided for @uiShipmentReportedSupportCanNowReview.
  ///
  /// In en, this message translates to:
  /// **'Shipment reported. Support can now review the chat history.'**
  String get uiShipmentReportedSupportCanNowReview;

  /// No description provided for @uiShipmentStarted.
  ///
  /// In en, this message translates to:
  /// **'Shipment started'**
  String get uiShipmentStarted;

  /// No description provided for @uiShippingFee.
  ///
  /// In en, this message translates to:
  /// **'Shipping fee'**
  String get uiShippingFee;

  /// No description provided for @uiShipsToAnyDestination.
  ///
  /// In en, this message translates to:
  /// **'Ships to any destination'**
  String get uiShipsToAnyDestination;

  /// No description provided for @uiSignIn.
  ///
  /// In en, this message translates to:
  /// **'Sign In'**
  String get uiSignIn;

  /// No description provided for @uiSignInToContinue.
  ///
  /// In en, this message translates to:
  /// **'Sign in to continue'**
  String get uiSignInToContinue;

  /// No description provided for @uiSimulatorCode.
  ///
  /// In en, this message translates to:
  /// **'Simulator code'**
  String get uiSimulatorCode;

  /// No description provided for @uiSinceYouSignedUpWithGoogle.
  ///
  /// In en, this message translates to:
  /// **'Since you signed up with Google/Apple, we need to verify your phone number before you can send a shipment.'**
  String get uiSinceYouSignedUpWithGoogle;

  /// No description provided for @uiSkipBackPhoto.
  ///
  /// In en, this message translates to:
  /// **'Skip back photo'**
  String get uiSkipBackPhoto;

  /// No description provided for @uiSkipForNow.
  ///
  /// In en, this message translates to:
  /// **'Skip for now'**
  String get uiSkipForNow;

  /// No description provided for @uiSold.
  ///
  /// In en, this message translates to:
  /// **'Sold'**
  String get uiSold;

  /// No description provided for @uiSomethingWentWrongPleaseTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Please try again.'**
  String get uiSomethingWentWrongPleaseTryAgain;

  /// No description provided for @uiSortCode.
  ///
  /// In en, this message translates to:
  /// **'Sort Code *'**
  String get uiSortCode;

  /// No description provided for @uiStartAConversationAnyTimeAnd.
  ///
  /// In en, this message translates to:
  /// **'Start a conversation any time and keep the full thread in one place.'**
  String get uiStartAConversationAnyTimeAnd;

  /// No description provided for @uiStartALiveChatAndYour.
  ///
  /// In en, this message translates to:
  /// **'Start a live chat and your messages will appear here like a shared support inbox.'**
  String get uiStartALiveChatAndYour;

  /// No description provided for @uiStartConversation.
  ///
  /// In en, this message translates to:
  /// **'Start conversation'**
  String get uiStartConversation;

  /// No description provided for @uiStartingVerification.
  ///
  /// In en, this message translates to:
  /// **'Starting verification…'**
  String get uiStartingVerification;

  /// No description provided for @uiStateRegion.
  ///
  /// In en, this message translates to:
  /// **'State / Region'**
  String get uiStateRegion;

  /// No description provided for @uiStatusUpdated.
  ///
  /// In en, this message translates to:
  /// **'Status updated!'**
  String get uiStatusUpdated;

  /// No description provided for @uiStatus.
  ///
  /// In en, this message translates to:
  /// **'Status:'**
  String get uiStatus;

  /// No description provided for @uiStreetAddress.
  ///
  /// In en, this message translates to:
  /// **'Street address'**
  String get uiStreetAddress;

  /// No description provided for @uiSubmissionFailedPleaseTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Submission failed. Please try again.'**
  String get uiSubmissionFailedPleaseTryAgain;

  /// No description provided for @uiSubmitForReview.
  ///
  /// In en, this message translates to:
  /// **'Submit for Review'**
  String get uiSubmitForReview;

  /// No description provided for @uiSupport.
  ///
  /// In en, this message translates to:
  /// **'Support'**
  String get uiSupport;

  /// No description provided for @uiSupportChatIsTemporarilyUnavailablePlease.
  ///
  /// In en, this message translates to:
  /// **'Support chat is temporarily unavailable.\nPlease email support@sendwithbago.com'**
  String get uiSupportChatIsTemporarilyUnavailablePlease;

  /// No description provided for @uiSupportInbox.
  ///
  /// In en, this message translates to:
  /// **'Support inbox'**
  String get uiSupportInbox;

  /// No description provided for @uiSupportRepliesAroundTheClock.
  ///
  /// In en, this message translates to:
  /// **'Support replies around the clock'**
  String get uiSupportRepliesAroundTheClock;

  /// No description provided for @uiSupportThatFeelsLikeAConversation.
  ///
  /// In en, this message translates to:
  /// **'Support that feels like a conversation'**
  String get uiSupportThatFeelsLikeAConversation;

  /// No description provided for @uiSupportingExplanation.
  ///
  /// In en, this message translates to:
  /// **'Supporting explanation'**
  String get uiSupportingExplanation;

  /// No description provided for @uiSwapCities.
  ///
  /// In en, this message translates to:
  /// **'Swap cities'**
  String get uiSwapCities;

  /// No description provided for @uiSystemAlerts.
  ///
  /// In en, this message translates to:
  /// **'System Alerts'**
  String get uiSystemAlerts;

  /// No description provided for @uiTakePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take Photo'**
  String get uiTakePhoto;

  /// No description provided for @uiTakeAClearPhotoOfThe.
  ///
  /// In en, this message translates to:
  /// **'Take a clear photo of the back side.'**
  String get uiTakeAClearPhotoOfThe;

  /// No description provided for @uiTakePhoto2.
  ///
  /// In en, this message translates to:
  /// **'Take photo'**
  String get uiTakePhoto2;

  /// No description provided for @uiTalkToSupportNow.
  ///
  /// In en, this message translates to:
  /// **'Talk to support now'**
  String get uiTalkToSupportNow;

  /// No description provided for @uiTapToAddPhoto.
  ///
  /// In en, this message translates to:
  /// **'Tap to add photo'**
  String get uiTapToAddPhoto;

  /// No description provided for @uiTapToCopyThisTestCode.
  ///
  /// In en, this message translates to:
  /// **'Tap to copy this test code if the email does not arrive.'**
  String get uiTapToCopyThisTestCode;

  /// No description provided for @uiTapToReRecord.
  ///
  /// In en, this message translates to:
  /// **'Tap to re-record'**
  String get uiTapToReRecord;

  /// No description provided for @uiTellUsThePickupAndDelivery.
  ///
  /// In en, this message translates to:
  /// **'Tell us the pickup and delivery locations for your shipment.'**
  String get uiTellUsThePickupAndDelivery;

  /// No description provided for @uiTermsConditions.
  ///
  /// In en, this message translates to:
  /// **'Terms & Conditions'**
  String get uiTermsConditions;

  /// No description provided for @uiTermsOfService.
  ///
  /// In en, this message translates to:
  /// **'Terms of Service *'**
  String get uiTermsOfService;

  /// No description provided for @uiThanksForSharingYourFeedbackIt.
  ///
  /// In en, this message translates to:
  /// **'Thanks for sharing your feedback. It helps other users trust the marketplace.'**
  String get uiThanksForSharingYourFeedbackIt;

  /// No description provided for @uiThatPasscodeIsNotCorrect.
  ///
  /// In en, this message translates to:
  /// **'That passcode is not correct.'**
  String get uiThatPasscodeIsNotCorrect;

  /// No description provided for @uiThePackageIsNowInTransit.
  ///
  /// In en, this message translates to:
  /// **'The package is now in transit.'**
  String get uiThePackageIsNowInTransit;

  /// No description provided for @uiTheRequestDetailsAreNotAvailable.
  ///
  /// In en, this message translates to:
  /// **'The request details are not available right now. Please refresh and try again.'**
  String get uiTheRequestDetailsAreNotAvailable;

  /// No description provided for @uiTheTravelerHasMarkedThisPackage.
  ///
  /// In en, this message translates to:
  /// **'The traveler has marked this package as delivered. Please confirm you\'ve received it to release the payment.'**
  String get uiTheTravelerHasMarkedThisPackage;

  /// No description provided for @uiTheTravelerMarkedThisShipmentAs.
  ///
  /// In en, this message translates to:
  /// **'The traveler marked this shipment as delivered. Confirm receipt here to release the payment.'**
  String get uiTheTravelerMarkedThisShipmentAs;

  /// No description provided for @uiTheTravellerMustBeAllowedTo.
  ///
  /// In en, this message translates to:
  /// **'The traveller must be allowed to inspect the package.'**
  String get uiTheTravellerMustBeAllowedTo;

  /// No description provided for @uiThisAddsWeightToTheActive.
  ///
  /// In en, this message translates to:
  /// **'This adds weight to the active shipment in this chat. Receiver details stay the same.'**
  String get uiThisAddsWeightToTheActive;

  /// No description provided for @uiThisBecomesYourWalletDisplayAnd.
  ///
  /// In en, this message translates to:
  /// **'This becomes your wallet display and payout currency.'**
  String get uiThisBecomesYourWalletDisplayAnd;

  /// No description provided for @uiThisCategoryRequiresExtraCareYour.
  ///
  /// In en, this message translates to:
  /// **'This category requires extra care. Your traveler may request additional details.'**
  String get uiThisCategoryRequiresExtraCareYour;

  /// No description provided for @uiThisConversationHasBeenClosedStart.
  ///
  /// In en, this message translates to:
  /// **'This conversation has been closed. Start a new ticket if you still need help.'**
  String get uiThisConversationHasBeenClosedStart;

  /// No description provided for @uiThisDeterminesWhichDocumentTypesThe.
  ///
  /// In en, this message translates to:
  /// **'This determines which document types the verification widget shows you.'**
  String get uiThisDeterminesWhichDocumentTypesThe;

  /// No description provided for @uiThisIsASecureProcessThat.
  ///
  /// In en, this message translates to:
  /// **'This is a secure process that takes just a few minutes. We\'ll verify your identity and activate your account.'**
  String get uiThisIsASecureProcessThat;

  /// No description provided for @uiThisShipmentChatIsClosedPlease.
  ///
  /// In en, this message translates to:
  /// **'This shipment chat is closed. Please contact support or open a dispute if needed.'**
  String get uiThisShipmentChatIsClosedPlease;

  /// No description provided for @uiThisWillPermanentlyRemoveThisItem.
  ///
  /// In en, this message translates to:
  /// **'This will permanently remove this item from your history.'**
  String get uiThisWillPermanentlyRemoveThisItem;

  /// No description provided for @uiThisWillRemoveThisDraftShipment.
  ///
  /// In en, this message translates to:
  /// **'This will remove this draft shipment immediately. You can start again anytime.'**
  String get uiThisWillRemoveThisDraftShipment;

  /// No description provided for @uiThisWillRemoveYourSavedShipment.
  ///
  /// In en, this message translates to:
  /// **'This will remove your saved shipment draft. You\'ll need to start over if you want to send this package.'**
  String get uiThisWillRemoveYourSavedShipment;

  /// No description provided for @uiThisWillRemoveYourSavedShipment2.
  ///
  /// In en, this message translates to:
  /// **'This will remove your saved shipment draft. You\'ll need to start over.'**
  String get uiThisWillRemoveYourSavedShipment2;

  /// No description provided for @uiTicketNotFound.
  ///
  /// In en, this message translates to:
  /// **'Ticket not found'**
  String get uiTicketNotFound;

  /// No description provided for @uiTicketSubmittedWeLlGetBack.
  ///
  /// In en, this message translates to:
  /// **'Ticket submitted! We\'ll get back to you soon.'**
  String get uiTicketSubmittedWeLlGetBack;

  /// No description provided for @uiTicketsAndChatInOneFlow.
  ///
  /// In en, this message translates to:
  /// **'Tickets and chat in one flow'**
  String get uiTicketsAndChatInOneFlow;

  /// No description provided for @uiTime.
  ///
  /// In en, this message translates to:
  /// **'Time'**
  String get uiTime;

  /// No description provided for @uiToGetYourShipmentPayoutsTell.
  ///
  /// In en, this message translates to:
  /// **'To get your shipment payouts, tell us where you want Bago to send the money.'**
  String get uiToGetYourShipmentPayoutsTell;

  /// No description provided for @uiToUnlockAllFeaturesPleaseComplete.
  ///
  /// In en, this message translates to:
  /// **'To unlock all features, please complete identity verification.'**
  String get uiToUnlockAllFeaturesPleaseComplete;

  /// No description provided for @uiToVerifyYourIdentityWeCollect.
  ///
  /// In en, this message translates to:
  /// **'To verify your identity we collect and process your personal data including government-issued ID documents and biometric information. This is required by applicable law and our platform terms.'**
  String get uiToVerifyYourIdentityWeCollect;

  /// No description provided for @uiTotal.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get uiTotal;

  /// No description provided for @uiTotalSpace.
  ///
  /// In en, this message translates to:
  /// **'Total space'**
  String get uiTotalSpace;

  /// No description provided for @uiTotalWallet.
  ///
  /// In en, this message translates to:
  /// **'Total wallet'**
  String get uiTotalWallet;

  /// No description provided for @uiTrackingNumber.
  ///
  /// In en, this message translates to:
  /// **'Tracking number'**
  String get uiTrackingNumber;

  /// No description provided for @uiTravelDate.
  ///
  /// In en, this message translates to:
  /// **'Travel Date'**
  String get uiTravelDate;

  /// No description provided for @uiTravelType.
  ///
  /// In en, this message translates to:
  /// **'Travel Type'**
  String get uiTravelType;

  /// No description provided for @uiTraveller.
  ///
  /// In en, this message translates to:
  /// **'Traveller'**
  String get uiTraveller;

  /// No description provided for @uiTripNumber.
  ///
  /// In en, this message translates to:
  /// **'Trip number'**
  String get uiTripNumber;

  /// No description provided for @uiTryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try Again'**
  String get uiTryAgain;

  /// No description provided for @uiTryADifferentKeywordOrStart.
  ///
  /// In en, this message translates to:
  /// **'Try a different keyword or start a support conversation so the team can help directly.'**
  String get uiTryADifferentKeywordOrStart;

  /// No description provided for @uiTryAgain2.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get uiTryAgain2;

  /// No description provided for @uiTypeAMessage.
  ///
  /// In en, this message translates to:
  /// **'Type a message...'**
  String get uiTypeAMessage;

  /// No description provided for @uiTypeCityOrCountry.
  ///
  /// In en, this message translates to:
  /// **'Type city or country'**
  String get uiTypeCityOrCountry;

  /// No description provided for @uiUkBankAccount.
  ///
  /// In en, this message translates to:
  /// **'UK BANK ACCOUNT'**
  String get uiUkBankAccount;

  /// No description provided for @uiUkAccountNumbersMustContain8.
  ///
  /// In en, this message translates to:
  /// **'UK account numbers must contain 8 digits.'**
  String get uiUkAccountNumbersMustContain8;

  /// No description provided for @uiUkSortCodesMustContain6.
  ///
  /// In en, this message translates to:
  /// **'UK sort codes must contain 6 digits.'**
  String get uiUkSortCodesMustContain6;

  /// No description provided for @uiUsdBankAccount.
  ///
  /// In en, this message translates to:
  /// **'USD BANK ACCOUNT'**
  String get uiUsdBankAccount;

  /// No description provided for @uiUnableToLoadMessages.
  ///
  /// In en, this message translates to:
  /// **'Unable to load messages'**
  String get uiUnableToLoadMessages;

  /// No description provided for @uiUnderReviewSendersCannotSeeThis.
  ///
  /// In en, this message translates to:
  /// **'Under review — senders cannot see this trip yet. We\'ll activate it once approved.'**
  String get uiUnderReviewSendersCannotSeeThis;

  /// No description provided for @uiUnlimitedCapacity.
  ///
  /// In en, this message translates to:
  /// **'Unlimited capacity'**
  String get uiUnlimitedCapacity;

  /// No description provided for @uiUnlockBago.
  ///
  /// In en, this message translates to:
  /// **'Unlock Bago'**
  String get uiUnlockBago;

  /// No description provided for @uiUnlockWithPasscode.
  ///
  /// In en, this message translates to:
  /// **'Unlock with Passcode'**
  String get uiUnlockWithPasscode;

  /// No description provided for @uiUnverified.
  ///
  /// In en, this message translates to:
  /// **'Unverified'**
  String get uiUnverified;

  /// No description provided for @uiUpdateStatus.
  ///
  /// In en, this message translates to:
  /// **'Update Status'**
  String get uiUpdateStatus;

  /// No description provided for @uiUploadingDocuments.
  ///
  /// In en, this message translates to:
  /// **'Uploading documents…'**
  String get uiUploadingDocuments;

  /// No description provided for @uiUseA4To8Digit.
  ///
  /// In en, this message translates to:
  /// **'Use a 4 to 8 digit app passcode.'**
  String get uiUseA4To8Digit;

  /// No description provided for @uiUseSecureCheckoutToPayBy.
  ///
  /// In en, this message translates to:
  /// **'Use secure checkout to pay by card, Apple Pay, bank transfer, or mobile money.'**
  String get uiUseSecureCheckoutToPayBy;

  /// No description provided for @uiUsuallyRepliesInMinutes.
  ///
  /// In en, this message translates to:
  /// **'Usually replies in minutes'**
  String get uiUsuallyRepliesInMinutes;

  /// No description provided for @uiValue.
  ///
  /// In en, this message translates to:
  /// **'Value'**
  String get uiValue;

  /// No description provided for @uiVerificationCodeSentViaSms.
  ///
  /// In en, this message translates to:
  /// **'Verification code sent via SMS.'**
  String get uiVerificationCodeSentViaSms;

  /// No description provided for @uiVerifyEmail.
  ///
  /// In en, this message translates to:
  /// **'Verify Email'**
  String get uiVerifyEmail;

  /// No description provided for @uiVerifyIdentity.
  ///
  /// In en, this message translates to:
  /// **'Verify Identity'**
  String get uiVerifyIdentity;

  /// No description provided for @uiVerifyPhone.
  ///
  /// In en, this message translates to:
  /// **'Verify Phone'**
  String get uiVerifyPhone;

  /// No description provided for @uiVerifyPhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Verify Phone Number'**
  String get uiVerifyPhoneNumber;

  /// No description provided for @uiVerifyYourEmailFirst.
  ///
  /// In en, this message translates to:
  /// **'Verify your email first'**
  String get uiVerifyYourEmailFirst;

  /// No description provided for @uiVerifyYourPhoneNumber.
  ///
  /// In en, this message translates to:
  /// **'Verify your phone number'**
  String get uiVerifyYourPhoneNumber;

  /// No description provided for @uiView.
  ///
  /// In en, this message translates to:
  /// **'View'**
  String get uiView;

  /// No description provided for @uiViewDetails.
  ///
  /// In en, this message translates to:
  /// **'View details'**
  String get uiViewDetails;

  /// No description provided for @uiViewImage.
  ///
  /// In en, this message translates to:
  /// **'View image'**
  String get uiViewImage;

  /// No description provided for @uiViewShipmentDetails.
  ///
  /// In en, this message translates to:
  /// **'View shipment details'**
  String get uiViewShipmentDetails;

  /// No description provided for @uiVisaMastercardAmex.
  ///
  /// In en, this message translates to:
  /// **'Visa, Mastercard, Amex'**
  String get uiVisaMastercardAmex;

  /// No description provided for @uiWhatWouldYouLikeMembersTo.
  ///
  /// In en, this message translates to:
  /// **'WHAT WOULD YOU LIKE MEMBERS TO KNOW ABOUT YOU?'**
  String get uiWhatWouldYouLikeMembersTo;

  /// No description provided for @uiWaitingForAnAgent.
  ///
  /// In en, this message translates to:
  /// **'Waiting for an agent'**
  String get uiWaitingForAnAgent;

  /// No description provided for @uiWeLlReviewYourDocumentsWithin.
  ///
  /// In en, this message translates to:
  /// **'We\'ll review your documents within 1–2 business days and notify you of the result.'**
  String get uiWeLlReviewYourDocumentsWithin;

  /// No description provided for @uiWeVeSentA6Digit.
  ///
  /// In en, this message translates to:
  /// **'We\'ve sent a 6-digit code to '**
  String get uiWeVeSentA6Digit;

  /// No description provided for @uiWeightKg.
  ///
  /// In en, this message translates to:
  /// **'Weight (kg)*'**
  String get uiWeightKg;

  /// No description provided for @uiWhatAreYouSending.
  ///
  /// In en, this message translates to:
  /// **'What are you sending?'**
  String get uiWhatAreYouSending;

  /// No description provided for @uiWhatHappensNext.
  ///
  /// In en, this message translates to:
  /// **'What happens next?'**
  String get uiWhatHappensNext;

  /// No description provided for @uiWhatIsInside.
  ///
  /// In en, this message translates to:
  /// **'What is inside?'**
  String get uiWhatIsInside;

  /// No description provided for @uiWhatWeCollect.
  ///
  /// In en, this message translates to:
  /// **'What we collect'**
  String get uiWhatWeCollect;

  /// No description provided for @uiWhatWouldYouLikeToDo.
  ///
  /// In en, this message translates to:
  /// **'What would you like to do?'**
  String get uiWhatWouldYouLikeToDo;

  /// No description provided for @uiWhatSYourDateOfBirth.
  ///
  /// In en, this message translates to:
  /// **'What\'s your\ndate of birth?'**
  String get uiWhatSYourDateOfBirth;

  /// No description provided for @uiWhatSYourFullName.
  ///
  /// In en, this message translates to:
  /// **'What\'s your\nfull name?'**
  String get uiWhatSYourFullName;

  /// No description provided for @uiWhatSYourRole.
  ///
  /// In en, this message translates to:
  /// **'What\'s your\nrole?'**
  String get uiWhatSYourRole;

  /// No description provided for @uiWhenAreYouTravelling.
  ///
  /// In en, this message translates to:
  /// **'When are you travelling?'**
  String get uiWhenAreYouTravelling;

  /// No description provided for @uiWhenDoesYourJourneyBegin.
  ///
  /// In en, this message translates to:
  /// **'When does your journey begin?'**
  String get uiWhenDoesYourJourneyBegin;

  /// No description provided for @uiWhereAreYouSending.
  ///
  /// In en, this message translates to:
  /// **'Where are you sending?'**
  String get uiWhereAreYouSending;

  /// No description provided for @uiWhichCountryIssuedYourId.
  ///
  /// In en, this message translates to:
  /// **'Which country issued your ID?'**
  String get uiWhichCountryIssuedYourId;

  /// No description provided for @uiWhoReceivesThis.
  ///
  /// In en, this message translates to:
  /// **'Who receives this?'**
  String get uiWhoReceivesThis;

  /// No description provided for @uiWhyABio.
  ///
  /// In en, this message translates to:
  /// **'Why a bio?'**
  String get uiWhyABio;

  /// No description provided for @uiWhyDoYouNeedToChange.
  ///
  /// In en, this message translates to:
  /// **'Why do you need to change it? (e.g. moved country)'**
  String get uiWhyDoYouNeedToChange;

  /// No description provided for @uiWithdrawEarnings.
  ///
  /// In en, this message translates to:
  /// **'Withdraw Earnings'**
  String get uiWithdrawEarnings;

  /// No description provided for @uiWithdrawFunds.
  ///
  /// In en, this message translates to:
  /// **'Withdraw Funds'**
  String get uiWithdrawFunds;

  /// No description provided for @uiWithdrawAll.
  ///
  /// In en, this message translates to:
  /// **'Withdraw all'**
  String get uiWithdrawAll;

  /// No description provided for @uiWithdrawalRequest.
  ///
  /// In en, this message translates to:
  /// **'Withdrawal Request'**
  String get uiWithdrawalRequest;

  /// No description provided for @uiWithdrawalSubmitted.
  ///
  /// In en, this message translates to:
  /// **'Withdrawal Submitted'**
  String get uiWithdrawalSubmitted;

  /// No description provided for @uiWithdrawalCouldNotBeSubmittedPlease.
  ///
  /// In en, this message translates to:
  /// **'Withdrawal could not be submitted. Please try again.'**
  String get uiWithdrawalCouldNotBeSubmittedPlease;

  /// No description provided for @uiWrappedOrSealedPackagesAreNot.
  ///
  /// In en, this message translates to:
  /// **'Wrapped or sealed packages are not rejected, but they must be inspected before collection.'**
  String get uiWrappedOrSealedPackagesAreNot;

  /// No description provided for @uiWriteAShortBioAboutYourself.
  ///
  /// In en, this message translates to:
  /// **'Write a short bio about yourself...'**
  String get uiWriteAShortBioAboutYourself;

  /// No description provided for @uiYyyyMmDd.
  ///
  /// In en, this message translates to:
  /// **'YYYY-MM-DD'**
  String get uiYyyyMmDd;

  /// No description provided for @uiYouCanChangeThisLater.
  ///
  /// In en, this message translates to:
  /// **'You can change this later'**
  String get uiYouCanChangeThisLater;

  /// No description provided for @uiYouCanTrackTheStatusIn.
  ///
  /// In en, this message translates to:
  /// **'You can track the status in your transaction history.'**
  String get uiYouCanTrackTheStatusIn;

  /// No description provided for @uiYourDetails.
  ///
  /// In en, this message translates to:
  /// **'Your Details'**
  String get uiYourDetails;

  /// No description provided for @uiYourPrivacyRights.
  ///
  /// In en, this message translates to:
  /// **'Your Privacy Rights'**
  String get uiYourPrivacyRights;

  /// No description provided for @uiYourUsdAccountNumber.
  ///
  /// In en, this message translates to:
  /// **'Your USD account number'**
  String get uiYourUsdAccountNumber;

  /// No description provided for @uiYourAccountDoesnTHavePermission.
  ///
  /// In en, this message translates to:
  /// **'Your account doesn\'t have permission to withdraw funds. Ask the business owner to enable it.'**
  String get uiYourAccountDoesnTHavePermission;

  /// No description provided for @uiYourAccountHasBeenSuspendedDue.
  ///
  /// In en, this message translates to:
  /// **'Your account has been suspended due to a violation of our Terms of Service.'**
  String get uiYourAccountHasBeenSuspendedDue;

  /// No description provided for @uiYourBankDetailsAreEncryptedAnd.
  ///
  /// In en, this message translates to:
  /// **'Your bank details are encrypted and securely stored. Used strictly for traveler payouts.'**
  String get uiYourBankDetailsAreEncryptedAnd;

  /// No description provided for @uiYourDataIsProcessedSecurelyAnd.
  ///
  /// In en, this message translates to:
  /// **'Your data is processed securely and will not be shared with third parties without your consent.'**
  String get uiYourDataIsProcessedSecurelyAnd;

  /// No description provided for @uiYourDataIsProcessedSolelyTo.
  ///
  /// In en, this message translates to:
  /// **'Your data is processed solely to verify your identity and comply with anti-money-laundering (AML) and know-your-customer (KYC) regulations. It is not sold to third parties.'**
  String get uiYourDataIsProcessedSolelyTo;

  /// No description provided for @uiYourEarningAndPayoutCurrencyIs.
  ///
  /// In en, this message translates to:
  /// **'Your earning and payout currency is locked. To change it, send a change request below or chat with support.'**
  String get uiYourEarningAndPayoutCurrencyIs;

  /// No description provided for @uiYourEarnings.
  ///
  /// In en, this message translates to:
  /// **'Your earnings'**
  String get uiYourEarnings;

  /// No description provided for @uiYourIssue.
  ///
  /// In en, this message translates to:
  /// **'Your issue:'**
  String get uiYourIssue;

  /// No description provided for @uiYourItemsWeight.
  ///
  /// In en, this message translates to:
  /// **'Your items\' weight'**
  String get uiYourItemsWeight;

  /// No description provided for @uiYourMessagesWithBagoSupport.
  ///
  /// In en, this message translates to:
  /// **'Your messages with Bago support'**
  String get uiYourMessagesWithBagoSupport;

  /// No description provided for @uiYourPhoneNumberHasBeenSuccessfully.
  ///
  /// In en, this message translates to:
  /// **'Your phone number has been successfully verified and updated on your account.'**
  String get uiYourPhoneNumberHasBeenSuccessfully;

  /// No description provided for @uiYourPrivacyMattersToUsThis.
  ///
  /// In en, this message translates to:
  /// **'Your privacy matters to us. This Privacy Policy explains how Bago collects, uses, and protects your personal information.'**
  String get uiYourPrivacyMattersToUsThis;

  /// No description provided for @uiEGLagosFriendsGroup.
  ///
  /// In en, this message translates to:
  /// **'e.g. \"Lagos Friends Group\"'**
  String get uiEGLagosFriendsGroup;

  /// No description provided for @uiEGAcmeLogisticsLtd.
  ///
  /// In en, this message translates to:
  /// **'e.g. Acme Logistics Ltd'**
  String get uiEGAcmeLogisticsLtd;

  /// No description provided for @uiEGBago12345678.
  ///
  /// In en, this message translates to:
  /// **'e.g. BAGO-12345678'**
  String get uiEGBago12345678;

  /// No description provided for @uiEGBarclaysLloydsMonzo.
  ///
  /// In en, this message translates to:
  /// **'e.g. Barclays, Lloyds, Monzo'**
  String get uiEGBarclaysLloydsMonzo;

  /// No description provided for @uiEGBerlin.
  ///
  /// In en, this message translates to:
  /// **'e.g. Berlin'**
  String get uiEGBerlin;

  /// No description provided for @uiEGChasus33.
  ///
  /// In en, this message translates to:
  /// **'e.g. CHASUS33'**
  String get uiEGChasus33;

  /// No description provided for @uiEGChaseBankOfAmerica.
  ///
  /// In en, this message translates to:
  /// **'e.g. Chase, Bank of America, Wise'**
  String get uiEGChaseBankOfAmerica;

  /// No description provided for @uiEGDoe.
  ///
  /// In en, this message translates to:
  /// **'e.g. Doe'**
  String get uiEGDoe;

  /// No description provided for @uiEGExpressStandard.
  ///
  /// In en, this message translates to:
  /// **'e.g. Express, Standard'**
  String get uiEGExpressStandard;

  /// No description provided for @uiEGJohn.
  ///
  /// In en, this message translates to:
  /// **'e.g. John'**
  String get uiEGJohn;

  /// No description provided for @uiEGLt12345678901234.
  ///
  /// In en, this message translates to:
  /// **'e.g. LT12 3456 7890 1234 5678'**
  String get uiEGLt12345678901234;

  /// No description provided for @uiEGLagosAccra.
  ///
  /// In en, this message translates to:
  /// **'e.g. Lagos, Accra'**
  String get uiEGLagosAccra;

  /// No description provided for @uiEGRevolt21.
  ///
  /// In en, this message translates to:
  /// **'e.g. REVOLT21'**
  String get uiEGRevolt21;

  /// No description provided for @uiEGRevolutN26Wise.
  ///
  /// In en, this message translates to:
  /// **'e.g. Revolut, N26, Wise'**
  String get uiEGRevolutN26Wise;

  /// No description provided for @uiEGUnitedStates.
  ///
  /// In en, this message translates to:
  /// **'e.g. United States'**
  String get uiEGUnitedStates;

  /// No description provided for @uiKg.
  ///
  /// In en, this message translates to:
  /// **'kg'**
  String get uiKg;

  /// No description provided for @uiOr.
  ///
  /// In en, this message translates to:
  /// **'or'**
  String get uiOr;

  /// No description provided for @uiTyping.
  ///
  /// In en, this message translates to:
  /// **'typing…'**
  String get uiTyping;

  /// No description provided for @uiFUse.
  ///
  /// In en, this message translates to:
  /// **'Use {p0}'**
  String uiFUse(Object p0);

  /// No description provided for @uiFWalletCurrencySetTo.
  ///
  /// In en, this message translates to:
  /// **'Wallet currency set to {p0}.'**
  String uiFWalletCurrencySetTo(Object p0);

  /// No description provided for @uiFWeSentADigitVerificationCode.
  ///
  /// In en, this message translates to:
  /// **'We sent a 6-digit verification code to {p0}. Enter it on the next screen to set a new password.'**
  String uiFWeSentADigitVerificationCode(Object p0);

  /// No description provided for @uiFOtpSentTo.
  ///
  /// In en, this message translates to:
  /// **'OTP sent to {p0}'**
  String uiFOtpSentTo(Object p0);

  /// No description provided for @uiFEnterTheOtpSentTo.
  ///
  /// In en, this message translates to:
  /// **'Enter the OTP\nsent to {p0}'**
  String uiFEnterTheOtpSentTo(Object p0);

  /// No description provided for @uiFResendCodeInS.
  ///
  /// In en, this message translates to:
  /// **'Resend code in {p0}s'**
  String uiFResendCodeInS(Object p0);

  /// No description provided for @uiFANewVerificationCodeWasSent.
  ///
  /// In en, this message translates to:
  /// **'A new verification code was sent to {p0}.'**
  String uiFANewVerificationCodeWasSent(Object p0);

  /// No description provided for @uiFHeldInEscrow.
  ///
  /// In en, this message translates to:
  /// **'{p0} {p1} held in escrow'**
  String uiFHeldInEscrow(Object p0, Object p1);

  /// No description provided for @uiFShipmentProgressStepOf.
  ///
  /// In en, this message translates to:
  /// **'Shipment progress, step {p0} of 4'**
  String uiFShipmentProgressStepOf(Object p0);

  /// No description provided for @uiFFrontOf.
  ///
  /// In en, this message translates to:
  /// **'Front of {p0}'**
  String uiFFrontOf(Object p0);

  /// No description provided for @uiFBackOf.
  ///
  /// In en, this message translates to:
  /// **'Back of {p0}'**
  String uiFBackOf(Object p0);

  /// No description provided for @uiFTracking.
  ///
  /// In en, this message translates to:
  /// **'Tracking: {p0}'**
  String uiFTracking(Object p0);

  /// No description provided for @uiFShipmentNeedHelpContactSupportOr.
  ///
  /// In en, this message translates to:
  /// **'Shipment {p0}. Need help? Contact support or report an issue.'**
  String uiFShipmentNeedHelpContactSupportOr(Object p0);

  /// No description provided for @uiFChargedIn.
  ///
  /// In en, this message translates to:
  /// **'Charged in {p0}'**
  String uiFChargedIn(Object p0);

  /// No description provided for @uiFUnableToLoadBanksRightNow.
  ///
  /// In en, this message translates to:
  /// **'Unable to load banks right now: {p0}'**
  String uiFUnableToLoadBanksRightNow(Object p0);

  /// No description provided for @uiFWithdrawalsArePaidByTheBago.
  ///
  /// In en, this message translates to:
  /// **'{p0} withdrawals are paid by the Bago accounts team by bank transfer, usually within 1–3 business days. You\'ll get an email and a notification at each step.'**
  String uiFWithdrawalsArePaidByTheBago(Object p0);

  /// No description provided for @uiFWeSentADigitCodeTo.
  ///
  /// In en, this message translates to:
  /// **'We sent a 6-digit code to {p0}{p1} via SMS. Enter it below.'**
  String uiFWeSentADigitCodeTo(Object p0, Object p1);

  /// No description provided for @uiFPaymentCurrency.
  ///
  /// In en, this message translates to:
  /// **'Payment currency: {p0}'**
  String uiFPaymentCurrency(Object p0);

  /// No description provided for @uiFCurrentOurTeamReviewsRequestsWithin.
  ///
  /// In en, this message translates to:
  /// **'Current: {p0}. Our team reviews requests within 1–2 business days.'**
  String uiFCurrentOurTeamReviewsRequestsWithin(Object p0);

  /// No description provided for @uiFWillUseForPayments.
  ///
  /// In en, this message translates to:
  /// **'{p0} {p1} will use {p2} for payments.'**
  String uiFWillUseForPayments(Object p0, Object p1, Object p2);

  /// No description provided for @uiFCharacters.
  ///
  /// In en, this message translates to:
  /// **'{p0}/250 characters'**
  String uiFCharacters(Object p0);

  /// No description provided for @uiFPayoutSetupWasNotCompletedCurrency.
  ///
  /// In en, this message translates to:
  /// **'Payout setup was not completed. Currency restored to {p0}.'**
  String uiFPayoutSetupWasNotCompletedCurrency(Object p0);

  /// No description provided for @uiFPayoutAccountLinked.
  ///
  /// In en, this message translates to:
  /// **'{p0} payout account linked.'**
  String uiFPayoutAccountLinked(Object p0);

  /// No description provided for @uiFCurrencyRestoredTo.
  ///
  /// In en, this message translates to:
  /// **'{p0} Currency restored to {p1}.'**
  String uiFCurrencyRestoredTo(Object p0, Object p1);

  /// No description provided for @uiFSetUpPayouts.
  ///
  /// In en, this message translates to:
  /// **'Set up {p0} payouts?'**
  String uiFSetUpPayouts(Object p0);

  /// No description provided for @uiFYouMustLinkAPayoutAccount.
  ///
  /// In en, this message translates to:
  /// **'You must link a {p0} payout account to use this currency. If setup is cancelled, Bago will keep {p1}.'**
  String uiFYouMustLinkAPayoutAccount(Object p0, Object p1);

  /// No description provided for @uiFKeep.
  ///
  /// In en, this message translates to:
  /// **'Keep {p0}'**
  String uiFKeep(Object p0);

  /// No description provided for @uiFDataAreCollectedByBagoAnd.
  ///
  /// In en, this message translates to:
  /// **'Data are collected by Bago and transmitted to our payout provider only to enable payouts. {p0} By proceeding, you confirm this payout account belongs to you.'**
  String uiFDataAreCollectedByBagoAnd(Object p0);

  /// No description provided for @uiFCopied.
  ///
  /// In en, this message translates to:
  /// **'{p0} copied'**
  String uiFCopied(Object p0);

  /// No description provided for @uiFYouAndYourFriendEachGet.
  ///
  /// In en, this message translates to:
  /// **'You and your friend each get {p0} after signup'**
  String uiFYouAndYourFriendEachGet(Object p0);

  /// No description provided for @uiFEarnAnotherWhenTheySendAn.
  ///
  /// In en, this message translates to:
  /// **'Earn another {p0} when they send an item over {p1}'**
  String uiFEarnAnotherWhenTheySendAn(Object p0, Object p1);

  /// No description provided for @uiFEarned.
  ///
  /// In en, this message translates to:
  /// **'{p0} {p1} earned'**
  String uiFEarned(Object p0, Object p1);

  /// No description provided for @uiFYourBalanceIsBelowTheMinimum.
  ///
  /// In en, this message translates to:
  /// **'Your balance is below the minimum withdrawal amount of {p0} {p1}.'**
  String uiFYourBalanceIsBelowTheMinimum(Object p0, Object p1);

  /// No description provided for @uiFMinimumWithdrawalIsAcrossAllCurrencies.
  ///
  /// In en, this message translates to:
  /// **'Minimum withdrawal is {p0} {p1} across all currencies.'**
  String uiFMinimumWithdrawalIsAcrossAllCurrencies(Object p0, Object p1);

  /// No description provided for @uiFWithdrawalsArePaidToYourBank.
  ///
  /// In en, this message translates to:
  /// **'{p0} withdrawals are paid to your bank by the Bago accounts team, usually within 1–3 business days. We\'ll email and notify you when it\'s approved and paid.'**
  String uiFWithdrawalsArePaidToYourBank(Object p0);

  /// No description provided for @uiFNoTravelersAreHeadingFromTo.
  ///
  /// In en, this message translates to:
  /// **'No travelers are heading from {p0} to {p1} right now. Check back soon!'**
  String uiFNoTravelersAreHeadingFromTo(Object p0, Object p1);

  /// No description provided for @uiFSendWith.
  ///
  /// In en, this message translates to:
  /// **'Send with {p0}'**
  String uiFSendWith(Object p0);

  /// No description provided for @uiFDone.
  ///
  /// In en, this message translates to:
  /// **'Done ({p0})'**
  String uiFDone(Object p0);

  /// No description provided for @uiFKgFree.
  ///
  /// In en, this message translates to:
  /// **'{p0} kg free'**
  String uiFKgFree(Object p0);

  /// No description provided for @uiFDeparts.
  ///
  /// In en, this message translates to:
  /// **'Departs {p0}'**
  String uiFDeparts(Object p0);

  /// No description provided for @uiFValue.
  ///
  /// In en, this message translates to:
  /// **'Value: {p0} {p1}'**
  String uiFValue(Object p0, Object p1);

  /// No description provided for @uiFOtherRequestsWaiting.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 request waiting} other{{count} requests waiting}}'**
  String uiFOtherRequestsWaiting(int count);

  /// No description provided for @uiFSender.
  ///
  /// In en, this message translates to:
  /// **'Sender: {p0}'**
  String uiFSender(Object p0);

  /// No description provided for @uiFCreated.
  ///
  /// In en, this message translates to:
  /// **'Created {p0}'**
  String uiFCreated(Object p0);

  /// No description provided for @uiFUpdateShipmentTo.
  ///
  /// In en, this message translates to:
  /// **'Update shipment to \"{p0}\"?'**
  String uiFUpdateShipmentTo(Object p0);

  /// No description provided for @uiFTravelerInspectionPhotos.
  ///
  /// In en, this message translates to:
  /// **'Traveler inspection photos ({p0}/4)'**
  String uiFTravelerInspectionPhotos(Object p0);

  /// No description provided for @uiFOfConfirmed.
  ///
  /// In en, this message translates to:
  /// **'{p0} of 3 confirmed'**
  String uiFOfConfirmed(Object p0);

  /// No description provided for @uiFTrips.
  ///
  /// In en, this message translates to:
  /// **'{p0} trips'**
  String uiFTrips(Object p0);

  /// No description provided for @uiFKgBooked.
  ///
  /// In en, this message translates to:
  /// **'{p0}kg booked'**
  String uiFKgBooked(Object p0);

  /// No description provided for @uiFKgLeft.
  ///
  /// In en, this message translates to:
  /// **'{p0}kg left'**
  String uiFKgLeft(Object p0);

  /// No description provided for @uiFActive.
  ///
  /// In en, this message translates to:
  /// **'{p0} active'**
  String uiFActive(Object p0);

  /// No description provided for @uiFOtherConversations.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =1{1 conversation} other{{count} conversations}}'**
  String uiFOtherConversations(int count);

  /// No description provided for @uiFCategoryPriority.
  ///
  /// In en, this message translates to:
  /// **'Category: {p0}  •  Priority: {p1}'**
  String uiFCategoryPriority(Object p0, Object p1);

  /// No description provided for @uiFRemoveSendersWillNoLongerSee.
  ///
  /// In en, this message translates to:
  /// **'Remove \"{p0}\"? Senders will no longer see it in search.'**
  String uiFRemoveSendersWillNoLongerSee(Object p0);

  /// No description provided for @uiFSelected.
  ///
  /// In en, this message translates to:
  /// **'Selected: {p0}'**
  String uiFSelected(Object p0);

  /// No description provided for @uiFTypicalRatesRangeFromPerKg.
  ///
  /// In en, this message translates to:
  /// **'Typical rates range from {p0} 5 - {p1} 20 per kg depending on the route.'**
  String uiFTypicalRatesRangeFromPerKg(Object p0, Object p1);

  /// No description provided for @uiFAiSuggestsKg.
  ///
  /// In en, this message translates to:
  /// **'AI suggests {p0} {p1}–{p2}/kg'**
  String uiFAiSuggestsKg(Object p0, Object p1, Object p2);

  /// No description provided for @uiFKgBooked2.
  ///
  /// In en, this message translates to:
  /// **'{p0} kg booked'**
  String uiFKgBooked2(Object p0);

  /// No description provided for @uiFAppearance.
  ///
  /// In en, this message translates to:
  /// **'{p0} appearance'**
  String uiFAppearance(Object p0);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
        'de',
        'en',
        'es',
        'fr',
        'it',
        'pt'
      ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'de':
      return AppLocalizationsDe();
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'fr':
      return AppLocalizationsFr();
    case 'it':
      return AppLocalizationsIt();
    case 'pt':
      return AppLocalizationsPt();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
