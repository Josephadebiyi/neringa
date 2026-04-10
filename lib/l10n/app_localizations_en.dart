// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Bago';

  @override
  String get accountSettings => 'Account Settings';

  @override
  String get verificationStatus => 'Verification Status';

  @override
  String get actionRequiredVerifyIdentity => 'Action required: Verify identity';

  @override
  String get kycPassed => 'KYC Passed';

  @override
  String get profileSection => 'Profile';

  @override
  String get editProfile => 'Edit Profile';

  @override
  String get paymentMethods => 'Payment Methods';

  @override
  String get preferencesSection => 'Preferences';

  @override
  String get notifications => 'Notifications';

  @override
  String get biometricLogin => 'Biometric Login';

  @override
  String get language => 'Language';

  @override
  String get legalSection => 'Legal';

  @override
  String get termsOfService => 'Terms of Service';

  @override
  String get privacyPolicy => 'Privacy Policy';

  @override
  String get deleteAccount => 'Delete Account';

  @override
  String get biometricEnabledMessage => 'Biometric login is now enabled.';

  @override
  String get biometricDisabledMessage => 'Biometric login is now disabled.';

  @override
  String get languageSettingsTitle => 'Language';

  @override
  String get languageSettingsSubtitle =>
      'Choose the language you want to use across the app.';

  @override
  String get languageChangedMessage => 'Language updated.';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageGerman => 'German';

  @override
  String get languageFrench => 'French';

  @override
  String get languageSpanish => 'Spanish';

  @override
  String get languagePortuguese => 'Portuguese';

  @override
  String get languageItalian => 'Italian';

  @override
  String get emailLabel => 'Email';

  @override
  String get emailHint => 'you@example.com';

  @override
  String get passwordLabel => 'Password';

  @override
  String get passwordHint => 'Your password';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get logIn => 'Log In';

  @override
  String get continueWithGoogle => 'Continue with Google';

  @override
  String get continueWithEmail => 'Continue with Email';

  @override
  String get useBiometric => 'Use Face ID / Fingerprint';

  @override
  String get notMemberYet => 'Not a member yet?';

  @override
  String get signUp => 'Sign up';

  @override
  String get pleaseFillAllFields => 'Please fill in all fields';

  @override
  String get biometricAuthFailed => 'Biometric authentication failed.';

  @override
  String get pleaseEnterYourEmail => 'Please enter your email';

  @override
  String get pleaseEnterYourPassword => 'Please enter your password';

  @override
  String get signInToYourAccount => 'Sign in to your account';

  @override
  String get choosePreferredMethod => 'Choose your preferred method';

  @override
  String get dontHaveAccount => 'Don\'t have an account?';

  @override
  String get enterYourEmailTitle => 'Enter your email';

  @override
  String get verificationCodeMessage => 'We\'ll send you a verification code';

  @override
  String get enterYourPasswordTitle => 'Enter your password';

  @override
  String get keepYourAccountSecure => 'Keep your account secure';

  @override
  String get forgotPasswordTitle => 'Forgot password?';

  @override
  String get forgotPasswordDescription =>
      'Enter your email and we\'ll send you a link to reset your password.';

  @override
  String get emailAddressLabel => 'Email address';

  @override
  String get emailRequired => 'Email is required';

  @override
  String get enterValidEmail => 'Enter a valid email';

  @override
  String get sendResetLink => 'Send Reset Link';

  @override
  String get checkYourInbox => 'Check your inbox';

  @override
  String passwordResetEmailSent(Object email) {
    return 'We sent a password reset link to $email. Check your email and follow the instructions.';
  }

  @override
  String get backToSignIn => 'Back to Sign In';

  @override
  String get resetPasswordTitle => 'Reset Password';

  @override
  String get createNewPasswordTitle => 'Create New Password';

  @override
  String get enterNewPasswordDescription => 'Enter your new password below';

  @override
  String get newPasswordLabel => 'New Password';

  @override
  String get newPasswordHint => 'Enter new password';

  @override
  String get confirmPasswordLabel => 'Confirm Password';

  @override
  String get confirmPasswordHint => 'Re-enter password';

  @override
  String get passwordsDoNotMatch => 'Passwords do not match';

  @override
  String get passwordMinLength => 'Password must be at least 8 characters';

  @override
  String get passwordResetSuccessfully => 'Password reset successfully';

  @override
  String get resetPasswordButton => 'Reset Password';

  @override
  String get onboardingSlide1Title => 'Send on your terms';

  @override
  String get onboardingSlide1Description =>
      'Connect with verified travelers heading your way for cost-effective shipping.';

  @override
  String get onboardingSlide2Title => 'Turn miles into money';

  @override
  String get onboardingSlide2Description =>
      'Monetize your empty space and deliver packages along your route.';

  @override
  String get onboardingSlide3Title => 'Safe, verified, reliable';

  @override
  String get onboardingSlide3Description =>
      'Bago uses community verification and real-time tracking to ensure every package is safe.';

  @override
  String get skip => 'Skip';

  @override
  String get next => 'Next';

  @override
  String get createAccount => 'Create an account';

  @override
  String get signupStepEmailTitle => 'What\'s your email?';

  @override
  String get checkingEmail => 'Checking email...';

  @override
  String get emailAvailable => 'Email is available';

  @override
  String get emailAlreadyExists => 'This email already has an account';

  @override
  String get availableEmailRequired =>
      'Please enter an available email address.';

  @override
  String get signupRestartCountry =>
      'Please restart signup and choose your country again.';

  @override
  String get signupStepNameTitle => 'What\'s your name?';

  @override
  String get firstNameHint => 'First name';

  @override
  String get lastNameHint => 'Last name';

  @override
  String get phoneNumberTitle => 'Phone Number';

  @override
  String get phoneDeliveryUpdates => 'We\'ll use this for delivery updates.';

  @override
  String get phoneHint => '812 345 6789';

  @override
  String countryCodeSelected(Object dialCode, Object country) {
    return 'Country code $dialCode selected for $country.';
  }

  @override
  String get dobTitle => 'When were you born?';

  @override
  String get securityTitle => 'Security';

  @override
  String get signupStepCountryTitle => 'Where are you located?';

  @override
  String get countryCurrencyMethods =>
      'This determines your currency and available payment methods.';

  @override
  String get selectedWalletSetup => 'Selected wallet setup';

  @override
  String currencySelection(Object currency, Object symbol) {
    return 'Currency: $currency ($symbol)';
  }

  @override
  String get verifyYourEmail => 'Verify your email';

  @override
  String sentSixDigitCode(Object email) {
    return 'We\'ve sent a 6-digit code to $email';
  }

  @override
  String get resendCode => 'Resend code';

  @override
  String resendIn(Object seconds) {
    return 'Resend in ${seconds}s';
  }

  @override
  String get resend => 'Resend';

  @override
  String get welcomeToBago => 'Welcome to Bago!';

  @override
  String walletSetTo(Object currency, Object symbol) {
    return 'Your wallet has been set to $currency (${symbol}0.00)';
  }

  @override
  String get selectCountry => 'Select country';

  @override
  String get goToDashboard => 'Go to Dashboard';

  @override
  String get orLabel => 'OR';

  @override
  String get profileTabAboutYou => 'About you';

  @override
  String get profileTabAccount => 'Account';

  @override
  String get profileFallbackUser => 'Bago User';

  @override
  String get deleteAccountTitle => 'Delete account?';

  @override
  String get deleteAccountMessage =>
      'This will permanently remove your Bago account and sign you out.';

  @override
  String get cancel => 'Cancel';

  @override
  String get roleSendPackages => 'Send Packages';

  @override
  String get roleEarnTraveler => 'Earn as Traveler';

  @override
  String get editPersonalDetails => 'Edit personal details';

  @override
  String get identityVerification => 'Identity Verification';

  @override
  String get notSet => 'Not set';

  @override
  String get aboutYouSection => 'About You';

  @override
  String get addMiniBio => 'Add a mini bio';

  @override
  String get highlyResponsiveReliable => 'Highly responsive and reliable';

  @override
  String get highlyRatedCommunity => 'Highly rated by the Bago community';

  @override
  String get ratingsActivity => 'Ratings & Activity';

  @override
  String get ratingsLeft => 'Ratings you\'ve left';

  @override
  String get savedRoutes => 'Saved routes';

  @override
  String get paymentsSection => 'Payments';

  @override
  String preferredCurrency(Object currency) {
    return 'Preferred currency: $currency';
  }

  @override
  String get changePassword => 'Change password';

  @override
  String get payoutMethods => 'Payout methods';

  @override
  String get paymentsRefunds => 'Payments & refunds';

  @override
  String get supportLegal => 'Support & Legal';

  @override
  String get communicationPreferences => 'Communication preferences';

  @override
  String get helpSupport => 'Help & support';

  @override
  String get signOut => 'Sign Out';

  @override
  String get shipmentsTitle => 'My Shipments';

  @override
  String get tripsTitle => 'My Trips';

  @override
  String get activeTab => 'Active';

  @override
  String get historyTab => 'History';

  @override
  String get nothingHereYet => 'Nothing here yet';

  @override
  String get shipmentsEmptySubtitle =>
      'Your shipments will appear here once you start using Bago.';

  @override
  String get findTraveler => 'Find a Traveler';

  @override
  String get requestsSent => 'Requests Sent';

  @override
  String get requestHistory => 'Request History';

  @override
  String get requestsSentSubtitle =>
      'Requests you have sent to listed travelers.';

  @override
  String get requestHistorySubtitle =>
      'Completed and declined traveler requests.';

  @override
  String get myShipmentsSection => 'My Shipments';

  @override
  String get shipmentHistory => 'Shipment History';

  @override
  String get myShipmentsSubtitle => 'Packages you have created.';

  @override
  String get shipmentHistorySubtitle => 'Completed and closed shipments.';

  @override
  String get pendingPayment => 'Pending Payment';

  @override
  String get finishCheckoutShipment =>
      'Finish checkout to send this shipment request.';

  @override
  String resumeBefore(Object time) {
    return 'Resume before $time';
  }

  @override
  String get continueShipment => 'Continue Shipment';

  @override
  String get delete => 'Delete';

  @override
  String get tripsEmptySubtitle =>
      'Your trips and incoming requests will appear here once travelers start sending requests.';

  @override
  String get seeRequests => 'See Requests';

  @override
  String get incomingRequests => 'Incoming Requests';

  @override
  String get incomingRequestsSubtitle =>
      'Review package requests before accepting or rejecting them.';

  @override
  String get myTripsSubtitle => 'Your published itineraries.';

  @override
  String get tripHistory => 'Trip History';

  @override
  String get tripHistorySubtitle => 'Completed and closed trips.';

  @override
  String get deleteTripTitle => 'Delete trip?';

  @override
  String get deleteTripMessage =>
      'This will remove the trip from your account.';

  @override
  String get tripDeletedSuccessfully => 'Trip deleted successfully';

  @override
  String get paymentReviewTitle => 'Review & Pay';

  @override
  String get noPendingShipmentPayment =>
      'No pending shipment payment was found.';

  @override
  String get shipmentCurrencyMissing =>
      'Shipment currency is missing. Please restart the shipment flow from the traveler details page.';

  @override
  String get totalAmount => 'Total Amount';

  @override
  String get shippingFee => 'Shipping Fee';

  @override
  String get insurance => 'Insurance';

  @override
  String get route => 'Route';

  @override
  String get receiver => 'Receiver';

  @override
  String get receiverFallback => 'Receiver';

  @override
  String get securePayment => 'Secure payment';

  @override
  String get paystackSecureHelp =>
      'You will complete payment securely with Paystack.';

  @override
  String get stripeSecureHelp =>
      'Choose one of your saved cards or add a new one before paying.';

  @override
  String get paymentMethod => 'Payment Method';

  @override
  String get noSavedCardsYet =>
      'No saved cards yet. Add a Visa or Mastercard to continue.';

  @override
  String get shipmentPendingUntilConfirmed =>
      'Your shipment stays pending until payment is confirmed.';

  @override
  String get paymentDraftExpired =>
      'This payment draft has expired and can no longer be completed.';

  @override
  String paymentCanBeResumedUntil(Object time) {
    return 'Your pending shipment can be resumed until $time.';
  }

  @override
  String get pay => 'Pay';

  @override
  String get processingPayment => 'Processing payment';

  @override
  String get addCardTitle => 'Add Card';

  @override
  String get addCardDescription =>
      'Enter your card details below. Only Visa and Mastercard are supported.';

  @override
  String get enterValidSupportedCard =>
      'Enter a valid Visa or Mastercard to continue.';

  @override
  String get savingCard => 'Saving Card...';

  @override
  String get saveCard => 'Save Card';

  @override
  String get manageAllCards => 'Manage all cards';

  @override
  String get pickupLocation => 'Pickup location';

  @override
  String get deliveryLocation => 'Delivery location';

  @override
  String get pickupCityPrompt => 'What is your pickup city?';

  @override
  String get sendingToPrompt => 'Where are you sending to?';

  @override
  String get selectCitiesFirst =>
      'Please select both departure and destination cities first.';

  @override
  String get homeFallbackUser => 'User';

  @override
  String welcomeBackName(Object name) {
    return 'Welcome back, $name';
  }

  @override
  String get homeSenderHeadline => 'Send or receive items across borders';

  @override
  String get homeCarrierSubtitle => 'Earn on your next trip with Bago';

  @override
  String get homeSenderSubtitle => 'Fast, secure cross-border delivery';

  @override
  String get whatDoYouWantToDo => 'What do you want to do?';

  @override
  String get topDestination => 'Top Destination';

  @override
  String get tripActivityShort => 'Trip activity';

  @override
  String get recentActivity => 'Recent activity';

  @override
  String get enterPickupCity => 'Enter pickup city';

  @override
  String get enterDestination => 'Enter destination';

  @override
  String get todayLabel => 'Today';

  @override
  String get findTravelerButton => 'Find Traveler';

  @override
  String get earnedBalance => 'EARNED BALANCE';

  @override
  String get publishNewItinerary => 'Publish New Itinerary';

  @override
  String get globalLocationSearch => 'Global Location Search';

  @override
  String get searchCityAirport =>
      'Search for a city or airport to choose a location.';

  @override
  String get selectDate => 'Select Date';

  @override
  String get confirmDate => 'Confirm Date';

  @override
  String get yourTripActivity => 'Your Trip Activity';

  @override
  String get yourActivity => 'Your activity';

  @override
  String get loadingTrips => 'Loading your trips...';

  @override
  String get loadingActivity => 'Loading your activity...';

  @override
  String get shipmentsHistoryAvailable =>
      'Your shipment history and requests sent to travelers are available in My Shipments.';

  @override
  String get openMyShipments => 'Open My Shipments';

  @override
  String get travelersAvailableToday =>
      '8 travelers available for popular routes today';

  @override
  String get serviceSendPackage => 'Send Package';

  @override
  String get serviceBuyItems => 'Buy Items';

  @override
  String get serviceGiftItems => 'Gift Items';

  @override
  String get serviceSeeRequests => 'See Requests';

  @override
  String get servicePublishTrip => 'Publish Trip';

  @override
  String get serviceMessages => 'Messages';

  @override
  String get serviceSendPackageDesc => 'Send items across borders easily.';

  @override
  String get serviceBuyItemsDesc => 'Ask a traveler to shop for you.';

  @override
  String get serviceGiftItemsDesc => 'Send something special to someone.';

  @override
  String get serviceSeeRequestsDesc =>
      'Review shipment requests waiting for you.';

  @override
  String get servicePublishTripDesc => 'Create a new itinerary for travelers.';

  @override
  String get serviceMessagesDesc => 'Keep shipment chats in one place.';

  @override
  String get tripDetailsTitle => 'Trip Details';

  @override
  String get couldNotLoadTrip => 'Could not load this trip.';

  @override
  String get statusLabel => 'Status';

  @override
  String get travelTypeLabel => 'Travel type';

  @override
  String get departureLabel => 'Departure';

  @override
  String get capacityLabel => 'Capacity';

  @override
  String get priceLabel => 'Price';

  @override
  String approxInCurrency(Object currency) {
    return '≈ In $currency';
  }

  @override
  String get tripProofLabel => 'Trip proof';

  @override
  String get uploaded => 'Uploaded';

  @override
  String get missing => 'Missing';

  @override
  String get tripEditApprovalMessage =>
      'Editing this trip sends it to the support team again for approval. Upload updated proof if your ticket or booking changed.';

  @override
  String get tripMissingReference =>
      'This trip is missing its details reference. Please refresh and try again.';

  @override
  String get editTrip => 'Edit Trip';

  @override
  String get deleteTrip => 'Delete Trip';

  @override
  String get shipmentDetailsTitle => 'Shipment Details';

  @override
  String get couldNotLoadShipment => 'Could not load shipment';

  @override
  String get retry => 'Retry';

  @override
  String get shippingPdfTitle => 'Shipping PDF';

  @override
  String get shippingPdfDescription =>
      'Create a branded A4 document with QR tracking, timeline, and shipment details.';

  @override
  String get previewPrint => 'Preview / Print';

  @override
  String get shareSavePdf => 'Share / Save PDF';

  @override
  String get feedbackSubmittedSuccessfully =>
      'Feedback submitted successfully.';

  @override
  String get leaveFeedback => 'Leave feedback';

  @override
  String get rateTravelerNote =>
      'Rate the traveler and leave a short note for other users.';

  @override
  String get shareYourExperience => 'Share your experience...';

  @override
  String get submitFeedback => 'Submit feedback';

  @override
  String get fromLabel => 'From';

  @override
  String get toLabel => 'To';

  @override
  String get packageDetailsTitle => 'Package Details';

  @override
  String get weightLabel => 'Weight';

  @override
  String get declaredValueLabel => 'Declared Value';

  @override
  String get yesLabel => 'Yes';

  @override
  String get noLabel => 'No';

  @override
  String get descriptionLabel => 'Description';

  @override
  String get senderLabel => 'Sender';

  @override
  String get travelerLabel => 'Traveler';

  @override
  String get paymentLabel => 'Payment';

  @override
  String get pickupDateLabel => 'Pickup Date';

  @override
  String get deliveryDateLabel => 'Delivery Date';

  @override
  String get estimatedDepartureLabel => 'Estimated Departure';

  @override
  String get estimatedArrivalLabel => 'Estimated Arrival';

  @override
  String get addressesTitle => 'Addresses';

  @override
  String get pickupLabel => 'Pickup';

  @override
  String get deliveryLabel => 'Delivery';

  @override
  String get nameLabel => 'Name';

  @override
  String get phoneLabel => 'Phone';

  @override
  String get trackingNumberTitle => 'Tracking Number';

  @override
  String get copiedToClipboard => 'Copied to clipboard';

  @override
  String get totalPriceTitle => 'Total Price';

  @override
  String get feedbackCardDescription =>
      'Rate the traveler and add a short comment to help other senders.';

  @override
  String get downloadPdf => 'Download PDF';

  @override
  String get goBack => 'Go back';

  @override
  String get searchResultsTitle => 'Search Results';

  @override
  String tripsFoundCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count trips found',
      one: '1 trip found',
    );
    return '$_temp0';
  }

  @override
  String get anyLabel => 'Any';

  @override
  String get noTripsFound => 'No trips found';

  @override
  String get tryAdjustingSearch => 'Try adjusting your search';

  @override
  String get searchAgain => 'Search again';

  @override
  String get selectBothCitiesFirst => 'Select both cities first';

  @override
  String get searchRequiresCities =>
      'Trip search only shows results after you choose a departure and destination city.';

  @override
  String get passKycBeforeShipment =>
      'Please pass KYC before creating a shipment.';

  @override
  String kgAvailable(Object kg) {
    return '$kg kg available';
  }

  @override
  String get sendWithThisCarrier => 'Send with this carrier';

  @override
  String get sendWithThisTraveler => 'Send with this Traveler';

  @override
  String get sendPackageTitle => 'Send a Package';

  @override
  String get findTravelerForRoute => 'Find a traveler for your route';

  @override
  String get selectPickupAndDelivery =>
      'Please select pickup and delivery locations.';

  @override
  String get anyDate => 'Any date';

  @override
  String get findYourTravelerTitle => 'Find your traveler';

  @override
  String get findYourTravelerDescription =>
      'Enter your pickup and delivery locations above, then tap Find Traveler to see who\'s heading your way.';

  @override
  String get setPreferredCurrencyTitle => 'Set your preferred currency';

  @override
  String get needWalletCurrency =>
      'We need your wallet currency to price this shipment correctly.';

  @override
  String get rateLabel => 'Rate';

  @override
  String get paymentFailedTitle => 'Payment Failed';

  @override
  String draftAvailableUntil(Object time) {
    return 'Your shipment draft stays available until $time.';
  }

  @override
  String get continuePayment => 'Continue Payment';

  @override
  String get deleteDraft => 'Delete Draft';

  @override
  String get backToMyShipments => 'Back to My Shipments';

  @override
  String get paymentNotCompleted => 'Your payment was not completed.';

  @override
  String get insufficientFundsMessage =>
      'Your card has insufficient funds. Try another card or contact your bank.';

  @override
  String get cardDeclinedMessage =>
      'Your bank declined this card. Try another card or contact your bank.';

  @override
  String get incorrectCvcMessage =>
      'The security code is incorrect. Please check it and try again.';

  @override
  String get expiredCardMessage =>
      'This card has expired. Please use a different card.';

  @override
  String get incorrectNumberMessage =>
      'The card number looks incorrect. Please check it and try again.';

  @override
  String get bankVerificationMessage =>
      'This card needs bank verification. Please continue and complete the verification in the app.';

  @override
  String get processingErrorMessage =>
      'We could not process this card right now. Please try again in a moment.';

  @override
  String get paymentCancelledMessage =>
      'Payment was cancelled before it could be completed.';

  @override
  String get paymentCouldNotCompleteGeneric =>
      'Your payment could not be completed. Please try again or use a different card.';

  @override
  String get shipmentRequestedTitle => 'Shipment Requested!';

  @override
  String get shipmentCreatedSentTraveler =>
      'Your shipment has been created and sent to the selected traveler.';

  @override
  String paymentReferenceValue(Object reference) {
    return 'Payment reference: $reference';
  }

  @override
  String get viewShipments => 'View Shipments';

  @override
  String get backToHome => 'Back to Home';

  @override
  String get trackShipmentTitle => 'Track Shipment';

  @override
  String get trackYourPackage => 'Track Your Package';

  @override
  String get enterTrackingNumberPrompt =>
      'Enter your tracking number to find your package';

  @override
  String get enterTrackingNumberMessage => 'Please enter a tracking number';

  @override
  String get trackingNumberLabel => 'Tracking Number';

  @override
  String get searchButton => 'Search';

  @override
  String get searchAnother => 'Search Another';

  @override
  String get unknownLabel => 'Unknown';

  @override
  String get unknownSender => 'Unknown Sender';

  @override
  String get unknownReceiver => 'Unknown Receiver';

  @override
  String get currentStatusTitle => 'Current Status';

  @override
  String get originLabel => 'Origin';

  @override
  String get destinationLabel => 'Destination';

  @override
  String get currentLocationLabel => 'Current Location';

  @override
  String get estimatedDeliveryLabel => 'Estimated Delivery';

  @override
  String get pendingLabel => 'Pending';

  @override
  String get pickedUpLabel => 'Picked Up';

  @override
  String get inTransitLabel => 'In Transit';

  @override
  String get outForDeliveryLabel => 'Out for Delivery';

  @override
  String get deliveredLabel => 'Delivered';

  @override
  String get tripRouteOrigin => 'Origin';

  @override
  String get tripRouteDestination => 'Destination';

  @override
  String get travelModeFlight => 'Flight';

  @override
  String get travelModeBus => 'Bus';

  @override
  String get travelModeTrain => 'Train';

  @override
  String get travelModeCar => 'Car';

  @override
  String get travelModeShip => 'Ship';

  @override
  String get setWalletCurrencyTitle => 'Set Wallet Currency';

  @override
  String get chooseWalletCurrencyDescription =>
      'Choose the currency you want to use for earnings and trip pricing.';

  @override
  String get confirmCurrency => 'Confirm currency';

  @override
  String get acceptTermsToContinue => 'Please accept the terms to continue.';

  @override
  String get identityVerificationRequiredTrip =>
      'Identity verification required before posting a trip.';

  @override
  String get selectDepartureCity => 'Please select a departure city.';

  @override
  String get selectDestinationCity => 'Please select a destination city.';

  @override
  String get departureDestinationDifferent =>
      'Departure and destination must be different cities.';

  @override
  String get selectTravelDate => 'Please select a travel date.';

  @override
  String get setDepartureTime => 'Please set a departure time.';

  @override
  String get uploadTripProofContinue =>
      'Please upload proof of this trip before continuing.';

  @override
  String get enterPricePerKg => 'Please enter a price per kg.';

  @override
  String get chooseTravelType => 'Please choose a travel type.';

  @override
  String get uploadProofOfTrip => 'Please upload proof of this trip.';

  @override
  String get capacityAtLeastOneKg =>
      'Available capacity must be at least 1 kg.';

  @override
  String get validPricePerKg => 'Please enter a valid price per kg.';

  @override
  String get noWalletCurrencySet =>
      'No wallet currency set. Please update your profile currency before posting a trip.';

  @override
  String get uploadProofTitle => 'Upload Proof';

  @override
  String get jpegPdfMaxSize => 'JPEG or PDF · max 2 MB';

  @override
  String get choosePhoto => 'Choose Photo';

  @override
  String get jpegFromGallery => 'JPEG from your gallery';

  @override
  String get choosePdf => 'Choose PDF';

  @override
  String get boardingPassBooking => 'Boarding pass or booking confirmation';

  @override
  String get fileTooLargeUnder2mb =>
      'File is too large. Please choose a file under 2 MB.';

  @override
  String get postTripTitle => 'Post a Trip';

  @override
  String get departureLabelShort => 'Departure';

  @override
  String get destinationLabelShort => 'Destination';

  @override
  String get saveChanges => 'Save Changes';

  @override
  String get publishTripAction => 'Publish Trip';

  @override
  String get continueLabel => 'Continue';

  @override
  String get departureCityTitle => 'Departure City';

  @override
  String get departureCitySubtitle => 'Where are you travelling from?';

  @override
  String get destinationCityTitle => 'Destination City';

  @override
  String get destinationCitySubtitle => 'Where are you heading to?';

  @override
  String get tripUpdatedTitle => 'Trip Updated!';

  @override
  String get tripSubmittedTitle => 'Trip Submitted!';

  @override
  String get statusPendingReview => 'STATUS: PENDING REVIEW';

  @override
  String tripUpdatedApproval(Object destination) {
    return 'Your trip to $destination has been updated and sent back to the support team for approval.';
  }

  @override
  String tripSubmittedApproval(Object destination) {
    return 'Your trip to $destination has been submitted with proof and is now waiting for support team approval.';
  }

  @override
  String get ticketProofAttached => 'Ticket proof attached for review';

  @override
  String get pendingSupportApproval => 'Pending support team approval';

  @override
  String get goToMyTrips => 'Go to My Trips';

  @override
  String get almostThere => 'Almost there!';

  @override
  String get reviewGuidelinesBeforePosting =>
      'Please review and accept our community guidelines before posting your trip.';

  @override
  String get verifyIdentityAndAgreeTerms =>
      'Before posting, we need to verify your identity and ensure you agree to our safety and legal terms.';

  @override
  String get identityVerificationKyc => 'Identity Verification (KYC)';

  @override
  String get requiredToPostTrip => 'Required to post a trip';

  @override
  String get changePasswordTitle => 'Update Your Password';

  @override
  String get changePasswordDescription =>
      'Enter your current password and choose a new one. If you signed in with Google or don\'t know your current password, send yourself a reset link instead.';

  @override
  String get currentPasswordLabel => 'Current Password';

  @override
  String get currentPasswordHint => 'Enter current password';

  @override
  String get confirmNewPasswordLabel => 'Confirm New Password';

  @override
  String get confirmNewPasswordHint => 'Re-enter new password';

  @override
  String get newPasswordMustDiffer =>
      'New password must be different from current password';

  @override
  String get passwordChangedSuccessfully => 'Password changed successfully';

  @override
  String get resetByEmailUnavailable => 'Reset by email unavailable';

  @override
  String get forgotCurrentPasswordReset =>
      'Forgot current password? Reset by email';

  @override
  String get changeEmailTitle => 'Change Email';

  @override
  String get updateYourEmail => 'Update your email';

  @override
  String get changeEmailDescription =>
      'Enter the new email address you\'d like to use. You\'ll need to verify it with an OTP.';

  @override
  String get newEmailAddressLabel => 'New Email Address';

  @override
  String get sendVerificationCode => 'Send Verification Code';

  @override
  String get verifyItsYou => 'Verify it\'s you';

  @override
  String get weSentCodeToPrefix => 'We\'ve sent a code to ';

  @override
  String get weSentCodeToSuffix => '. Enter it below to confirm the change.';

  @override
  String get verificationCodeLabel => 'Verification Code';

  @override
  String get updateEmailAddress => 'Update Email Address';

  @override
  String get changeEmailAddress => 'Change email address';

  @override
  String get enterValidEmailAddress => 'Please enter a valid email address.';

  @override
  String verificationCodeSentTo(Object value) {
    return 'Verification code sent to $value';
  }

  @override
  String get enterVerificationCodePrompt =>
      'Please enter the verification code.';

  @override
  String get emailUpdatedSuccessfully => 'Email updated successfully!';

  @override
  String get changePhoneNumberTitle => 'Change Phone Number';

  @override
  String get updateYourPhoneNumber => 'Update your phone number';

  @override
  String changePhoneDescription(Object email) {
    return 'Enter the new phone number you want to use. We will send a verification code to $email to confirm the change.';
  }

  @override
  String get newPhoneNumberLabel => 'New Phone Number';

  @override
  String get enterValidPhoneNumber => 'Please enter a valid phone number.';

  @override
  String get phoneNumberUpdatedSuccessfully =>
      'Phone number updated successfully!';

  @override
  String get confirmFromYourEmail => 'Confirm from your email';

  @override
  String get weSentVerificationCodeToPrefix =>
      'We sent a verification code to ';

  @override
  String get weSentVerificationCodeToSuffix =>
      '. Enter it below to update your phone number.';

  @override
  String get updatePhoneNumber => 'Update Phone Number';

  @override
  String get changePhoneNumberAction => 'Change phone number';

  @override
  String get startVerification => 'Start Verification';

  @override
  String get communityGuidelinesTerms => 'Community Guidelines & Terms';

  @override
  String get acceptSafetyTerms =>
      'I accept all safety guidelines and legal terms';

  @override
  String get navHome => 'Home';

  @override
  String get navShipments => 'Shipments';

  @override
  String get navTrips => 'Trips';

  @override
  String get navMessages => 'Messages';

  @override
  String get navProfile => 'Profile';

  @override
  String get preferredCurrencyTitle => 'Preferred Currency';

  @override
  String get currencyScreenInfo =>
      'Choose the currency you want to see across the app. This updates your wallet display, payouts, and pricing preferences. Trip listings keep their original currency, but rates are shown using in-app reference conversions.';

  @override
  String currencyUpdatedTo(Object currency) {
    return 'Preferred currency updated to $currency';
  }

  @override
  String get referenceRates => 'Reference Rates';

  @override
  String get referenceRatesInfo =>
      'These are the conversion rates currently used inside the app for supported currencies.';

  @override
  String get escrowProtectionTitle => 'Escrow Protection';

  @override
  String get escrowProtectionDesc =>
      '\"In Escrow\" means funds are held securely. They move to \"Completed\" once delivery is confirmed.';

  @override
  String get transactionHistory => 'Transaction History';

  @override
  String get noTransactionsYet => 'No transactions yet';

  @override
  String get noTransactionsDesc =>
      'Once you make a payment or receive a refund, it will appear here.';

  @override
  String get helpHeroText => 'How can we\nhelp you today?';

  @override
  String get quickHelp => 'Quick Help';

  @override
  String get faqSection => 'Frequently Asked Questions';

  @override
  String get searchHelpHint => 'Search help topics...';

  @override
  String get noRatingsYet => 'You haven\'t left any ratings yet.';

  @override
  String get setCurrencyFirst =>
      'Please set your preferred currency in profile settings before managing payout methods.';
}
