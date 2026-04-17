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

  /// No description provided for @paystackSecureHelp.
  ///
  /// In en, this message translates to:
  /// **'You will complete payment securely with Paystack.'**
  String get paystackSecureHelp;

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
