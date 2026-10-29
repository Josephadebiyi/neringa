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
  String get itemImagesLabel => 'Item Images';

  @override
  String get notProvidedLabel => 'Not provided';

  @override
  String get receiverInfo => 'Receiver Information';

  @override
  String get escrowLabel => 'Escrow Balance';

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

  @override
  String get activityTitle => 'Activity';

  @override
  String get activityTabTrips => 'Trips';

  @override
  String get activityTabShipments => 'Shipments';

  @override
  String get activityTabRequests => 'Requests';

  @override
  String get noTripsYet => 'No trips yet';

  @override
  String get postATripCta => 'Post a Trip';

  @override
  String get postATripSubtitle =>
      'Post a trip to start earning by carrying packages.';

  @override
  String get noShipmentsYet => 'No shipments yet';

  @override
  String get sendAPackageCta => 'Send a Package';

  @override
  String get sendAPackageSubtitle => 'Send a package and track it here.';

  @override
  String get noRequestsYet => 'No requests yet';

  @override
  String get noRequestsSubtitle =>
      'When you send or receive shipment requests, they\'ll show here.';

  @override
  String get incomingRequestsLabel => 'Incoming requests';

  @override
  String get sentRequestsLabel => 'Sent requests';

  @override
  String get fromSenderLabel => 'From sender';

  @override
  String get withCarrierLabel => 'With carrier';

  @override
  String get pendingPriceLabel => 'Pending price';

  @override
  String get shipmentRequestFallback => 'Shipment request';

  @override
  String activeShipmentsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count active shipments',
      one: '1 active shipment',
    );
    return '$_temp0';
  }

  @override
  String kgFreeLabel(Object kg) {
    return '$kg kg free';
  }

  @override
  String get ratingsAndReviewsTitle => 'Ratings & Reviews';

  @override
  String get noReviewsYet => 'No reviews yet';

  @override
  String get noReviewsSubtitle =>
      'Reviews from senders and travelers will appear here.';

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count reviews',
      one: '1 review',
    );
    return '$_temp0';
  }

  @override
  String get requestsSectionCarry => 'Packages to carry';

  @override
  String get requestsSectionSending => 'My shipping requests';

  @override
  String get searchRequestsHint => 'Search by name or package...';

  @override
  String noResultsFor(Object query) {
    return 'No results for \"$query\"';
  }

  @override
  String get activeShipmentsSection => 'Active';

  @override
  String get pastShipmentsSection => 'Past';

  @override
  String get searchTripsHint => 'Search by route, date or status...';

  @override
  String get searchShipmentsHint => 'Search by package, city or traveler...';

  @override
  String get uiIncludingProcessingByOurIdentityVerification =>
      ', including processing by our identity verification partner.';

  @override
  String get ui1000Deliveries => '1,000+\nDeliveries';

  @override
  String get ui247Support => '24/7\nSupport';

  @override
  String get ui6DigitCode => '6-digit code';

  @override
  String get ui9DigitAbaRoutingNumber => '9-digit ABA routing number';

  @override
  String get uiAClearPhotoHelpsTheTraveler =>
      'A clear photo helps the traveler identify your item';

  @override
  String get uiANewCodeHasBeenSent => 'A new code has been sent';

  @override
  String get uiAccountDetails => 'ACCOUNT DETAILS';

  @override
  String get uiAccountInformation => 'ACCOUNT INFORMATION';

  @override
  String get uiAccept => 'Accept';

  @override
  String get uiAcceptContinue => 'Accept & Continue';

  @override
  String get uiAcceptRequest => 'Accept Request';

  @override
  String get uiAccountHolderName => 'Account Holder Name';

  @override
  String get uiAccountHolderName2 => 'Account Holder Name *';

  @override
  String get uiAccountNumber => 'Account Number';

  @override
  String get uiAccountNumber2 => 'Account Number *';

  @override
  String get uiAccountSuspended => 'Account Suspended';

  @override
  String get uiAccountVerification => 'Account Verification';

  @override
  String get uiAccountCreated => 'Account created';

  @override
  String get uiAccountHolder => 'Account holder';

  @override
  String get uiAccountNumberMustBe10Digits =>
      'Account number must be 10 digits.';

  @override
  String get uiActionNeeded => 'Action needed';

  @override
  String get uiActiveShipment => 'Active shipment';

  @override
  String get uiActiveShipments => 'Active shipments';

  @override
  String get uiAdd24PhotosAndAccept =>
      'Add 2–4 photos and accept all agreements.';

  @override
  String get uiAddBankAccount => 'Add Bank Account';

  @override
  String get uiAddAService => 'Add a service';

  @override
  String get uiAddAnItemImageBeforeContinuing =>
      'Add an item image before continuing.';

  @override
  String get uiAddItemPhoto => 'Add item photo';

  @override
  String get uiAddItemPhotoOptional => 'Add item photo (optional)';

  @override
  String get uiAddKg => 'Add kg';

  @override
  String get uiAddMoreKg => 'Add more kg';

  @override
  String get uiAddPhoto => 'Add photo';

  @override
  String get uiAddYourPayoutAccountSoYou =>
      'Add your payout account so you can receive money from deliveries.';

  @override
  String get uiAdditionalWeight => 'Additional weight';

  @override
  String get uiAddressLine1 => 'Address Line 1 *';

  @override
  String get uiAddressLine2 => 'Address Line 2';

  @override
  String get uiAfterDelivery => 'After delivery';

  @override
  String get uiAgeVerification => 'Age Verification *';

  @override
  String get uiAgreementShippingConfirmation =>
      'Agreement & Shipping Confirmation';

  @override
  String get uiAllConversationsStaySynced => 'All conversations stay synced';

  @override
  String get uiAllow => 'Allow';

  @override
  String get uiAllowNotifications => 'Allow notifications?';

  @override
  String get uiAmount => 'Amount';

  @override
  String get uiAnAgentWillJoinShortlyYou =>
      'An agent will join shortly. You can send a message below.';

  @override
  String get uiAnySpecialRequirementsOrInstructions =>
      'Any special requirements or instructions...';

  @override
  String get uiApartmentSuiteEtcOptional => 'Apartment, suite, etc. (optional)';

  @override
  String get uiAppPasscode => 'App passcode';

  @override
  String get uiAppPasscodeRemoved => 'App passcode removed.';

  @override
  String get uiAppPasscodeSaved => 'App passcode saved.';

  @override
  String get uiApplePay => 'Apple Pay';

  @override
  String get uiApplySuggestion => 'Apply suggestion';

  @override
  String get uiAreYouSigningUpAsAn =>
      'Are you signing up as an individual or a company?';

  @override
  String get uiAreYouSureYouWantTo =>
      'Are you sure you want to delete this saved route?';

  @override
  String get uiArrival => 'Arrival';

  @override
  String get uiAskTheSenderOrReceiverFor =>
      'Ask the sender or receiver for their 4-digit handover PIN to confirm delivery and release your payment instantly.';

  @override
  String get uiAtLeast8Characters => 'At least 8 characters';

  @override
  String get uiAvailable => 'Available';

  @override
  String get uiAvailableBalance => 'Available Balance';

  @override
  String get uiAvailableCapacity => 'Available Capacity';

  @override
  String get uiAvailableNow => 'Available now';

  @override
  String get uiAwaitingPaymentTapToContinue =>
      'Awaiting payment — tap to continue';

  @override
  String get uiBillingAddress => 'BILLING ADDRESS';

  @override
  String get uiBack => 'Back';

  @override
  String get uiBackToApp => 'Back to App';

  @override
  String get uiBagoCommission => 'Bago commission';

  @override
  String get uiBagoFee => 'Bago fee';

  @override
  String get uiBagoGuidelines => 'Bago guidelines';

  @override
  String get uiBagoUsesFlutterwaveForSecureCheckout =>
      'Bago uses Flutterwave for secure checkout. When you pay by card, Apple Pay, bank transfer, or mobile money, Flutterwave securely handles and stores the payment details. Bago never receives raw card numbers.';

  @override
  String get uiBagoWillUseThisCountryTo =>
      'Bago will use this country to set your wallet currency before KYC.';

  @override
  String get uiBank => 'Bank';

  @override
  String get uiBankCountry => 'Bank Country';

  @override
  String get uiBankName => 'Bank Name';

  @override
  String get uiBankName2 => 'Bank Name *';

  @override
  String get uiBankAccountAddedSuccessfully =>
      'Bank account added successfully!';

  @override
  String get uiBankAccountLinkedSuccessfully =>
      'Bank account linked successfully!';

  @override
  String get uiBankAccountSetupCouldNotBe =>
      'Bank account setup could not be completed. Please try again.';

  @override
  String get uiBankCountry2 => 'Bank country *';

  @override
  String get uiBioCannotBeEmpty => 'Bio cannot be empty';

  @override
  String get uiBioUpdatedSuccessfully => 'Bio updated successfully';

  @override
  String get uiBiometricUnlockFailed => 'Biometric unlock failed.';

  @override
  String get uiBookings => 'Bookings';

  @override
  String get uiBriefSummaryOfYourIssue => 'Brief summary of your issue';

  @override
  String get uiBrowseQuickAnswersStartALive =>
      'Browse quick answers, start a live chat, or return to an existing thread without losing context.';

  @override
  String get uiBusinessOrOrganisation => 'Business or organisation';

  @override
  String get uiBusinessServices => 'Business services';

  @override
  String get uiBusinessServicesAreAvailableToBusiness =>
      'Business services are available to business accounts.';

  @override
  String get uiBuyItemsAbroad => 'Buy Items Abroad';

  @override
  String get uiBuyItemsAbroadIsNotLive =>
      'Buy Items Abroad is not live yet. We will implement it soon.';

  @override
  String get uiByContinuingIConfirmThat => 'By continuing, I confirm that:';

  @override
  String get uiBySubmittingYouConfirmThisTrip =>
      'By submitting, you confirm this trip is accurate. Trips with new or edited details are sent to the support team again for approval before going live.';

  @override
  String get uiCategory => 'CATEGORY';

  @override
  String get uiCalculatingCheckoutTotal => 'Calculating checkout total...';

  @override
  String get uiCanTFindItCheckYour =>
      'Can\'t find it? Check your spam or junk folder.';

  @override
  String get uiCardsAreSavedDuringCheckout => 'Cards are saved during checkout';

  @override
  String get uiCarrierLogisticsCompanyName =>
      'Carrier / logistics company name';

  @override
  String get uiCategory2 => 'Category';

  @override
  String get uiChange => 'Change';

  @override
  String get uiChangeNumber => 'Change number';

  @override
  String get uiChangingThisAccountRequiresAConfirmation =>
      'Changing this account requires a confirmation code sent to your email.';

  @override
  String get uiChatClosed => 'Chat closed';

  @override
  String get uiChatIsNotAvailableForThis =>
      'Chat is not available for this shipment yet.';

  @override
  String get uiChatSafelyByStayingWithinBago =>
      'Chat safely by staying within Bago. We protect your payments and data.';

  @override
  String get uiChatWithSupport => 'Chat with support';

  @override
  String get uiCheckYourInboxForTheVerification =>
      'Check your inbox for the verification email we sent when you signed up. Once verified, you\'re good to go.';

  @override
  String get uiChooseFromLibrary => 'Choose from library';

  @override
  String get uiChooseYourEarningCurrencyThisWill =>
      'Choose your earning currency. This will be locked once confirmed and can only be changed by support.';

  @override
  String get uiCity => 'City *';

  @override
  String get uiCityCountry => 'City, Country';

  @override
  String get uiCityAirportStation => 'City, airport, station...';

  @override
  String get uiComingSoon => 'Coming soon';

  @override
  String get uiCommunication => 'Communication';

  @override
  String get uiCommunityVerified => 'Community\nVerified';

  @override
  String get uiCompany => 'Company';

  @override
  String get uiCompleteSignup => 'Complete Signup';

  @override
  String get uiCompleteIdentityVerificationBeforeAddingA =>
      'Complete identity verification before adding a payout account.';

  @override
  String get uiCompleteIdentityVerificationBeforeChangingPayout =>
      'Complete identity verification before changing payout currency.';

  @override
  String get uiCompleteYourProfile => 'Complete your profile';

  @override
  String get uiConfirm => 'Confirm';

  @override
  String get uiConfirmBankAccount => 'Confirm Bank Account';

  @override
  String get uiConfirmDeliveryGetPaid => 'Confirm Delivery & Get Paid';

  @override
  String get uiConfirmUkBankAccount => 'Confirm UK Bank Account';

  @override
  String get uiConfirmUsdBankAccount => 'Confirm USD Bank Account';

  @override
  String get uiConfirmCountry => 'Confirm country';

  @override
  String get uiConfirmDelivery => 'Confirm delivery';

  @override
  String get uiConfirmDeliveryToReleaseThePayment =>
      'Confirm delivery to release the payment.';

  @override
  String get uiConfirmDelivery2 => 'Confirm delivery?';

  @override
  String get uiConfirmPasscode => 'Confirm passcode';

  @override
  String get uiConfirmThisOnlyAfterThePackage =>
      'Confirm this only after the package is in your hands. This will release payment to the traveler.';

  @override
  String get uiConfirmWithdrawal => 'Confirm withdrawal';

  @override
  String get uiConfirmYourBank => 'Confirm your bank';

  @override
  String get uiConfirmYourCountry => 'Confirm your country';

  @override
  String get uiConfirmationCodeCopied => 'Confirmation code copied.';

  @override
  String get uiConfirmingReceiptWillReleasePaymentTo =>
      'Confirming receipt will release payment to the traveler. Only do this once you have the package.';

  @override
  String get uiConnectionError => 'Connection error';

  @override
  String get uiContactSupport => 'Contact Support';

  @override
  String get uiContactSupport2 => 'Contact support';

  @override
  String get uiContinueAsGuest => 'Continue as guest';

  @override
  String get uiContinueBrowsing => 'Continue browsing';

  @override
  String get uiContinueToPayment => 'Continue to Payment';

  @override
  String get uiContinueWithApple => 'Continue with Apple';

  @override
  String get uiConversationWithBagoSupport => 'Conversation with Bago support';

  @override
  String get uiCouldNotConfirmTheCodePlease =>
      'Could not confirm the code. Please try again.';

  @override
  String get uiCouldNotLoadBanksPleaseTry =>
      'Could not load banks. Please try again.';

  @override
  String get uiCouldNotLoadMap => 'Could not load map';

  @override
  String get uiCouldNotLoadRequests => 'Could not load requests';

  @override
  String get uiCouldNotLoadShipmentDetailsPlease =>
      'Could not load shipment details. Please try again.';

  @override
  String get uiCouldNotLoadShipments => 'Could not load shipments';

  @override
  String get uiCouldNotLoadTrips => 'Could not load trips';

  @override
  String get uiCouldNotSendTheRequestPlease =>
      'Could not send the request. Please try again.';

  @override
  String get uiCouldNotUpdateWalletCurrencyPlease =>
      'Could not update wallet currency. Please try again.';

  @override
  String get uiCountryOfResidence => 'Country of residence';

  @override
  String get uiCreateAccount => 'Create Account';

  @override
  String get uiCreateGroupShipment => 'Create Group Shipment';

  @override
  String get uiCreateAPassword => 'Create a\npassword';

  @override
  String get uiCreateAFreeAccountOrSign =>
      'Create a free account or sign in to book a carrier and ship your package.';

  @override
  String get uiCreateAGroupShippingRequest => 'Create a group shipping request';

  @override
  String get uiCreateYourAccount => 'Create your\naccount';

  @override
  String get uiCreditDebitCard => 'Credit / Debit Card';

  @override
  String get uiCurrency => 'Currency';

  @override
  String get uiCurrencyNotSet => 'Currency Not Set';

  @override
  String get uiCurrentLocationOptional => 'Current location (optional)';

  @override
  String get uiCurrentShipments => 'Current shipments';

  @override
  String get uiDataProtectionConsent => 'Data Protection & Consent';

  @override
  String get uiDate => 'Date';

  @override
  String get uiDateOfBirth => 'Date of Birth';

  @override
  String get uiDateOfBirth2 => 'Date of Birth *';

  @override
  String get uiDecline => 'Decline';

  @override
  String get uiDeleteRoute => 'Delete Route';

  @override
  String get uiDeliveryAddress => 'Delivery address';

  @override
  String get uiDeliveryConfirmedPaymentReleasedToTraveler =>
      'Delivery confirmed! Payment released to traveler.';

  @override
  String get uiDepartureTime => 'Departure Time';

  @override
  String get uiDescribeYourItemSoYourTraveler =>
      'Describe your item so your traveler knows what to expect.';

  @override
  String get uiDiscard => 'Discard';

  @override
  String get uiDiscardDraft => 'Discard draft?';

  @override
  String get uiDocumentsSubmitted => 'Documents Submitted';

  @override
  String get uiDropOffAddress => 'Drop-off address';

  @override
  String get uiEarnByCarryingPackagesOnYour =>
      'Earn by carrying packages on your trip';

  @override
  String get uiEditBio => 'Edit bio';

  @override
  String get uiEmailAddress => 'Email Address';

  @override
  String get uiEmailNotifications => 'Email Notifications';

  @override
  String get uiEmailSupport => 'Email Support';

  @override
  String get uiEmailChangesAreHandledThroughVerification =>
      'Email changes are handled through verification.';

  @override
  String get uiEnter48Digits => 'Enter 4-8 digits';

  @override
  String get uiEnterAValidPhoneNumber5 =>
      'Enter a valid phone number (5–15 digits, numbers only).';

  @override
  String get uiEnterAValidShipmentWeight => 'Enter a valid shipment weight.';

  @override
  String get uiEnterAccountNumber => 'Enter account number';

  @override
  String get uiEnterAll4Digits => 'Enter all 4 digits';

  @override
  String get uiEnterAmount => 'Enter amount';

  @override
  String get uiEnterTheCode => 'Enter the Code';

  @override
  String get uiEnterTheAdditionalKg => 'Enter the additional kg.';

  @override
  String get uiEnterWithdrawalCode => 'Enter withdrawal code';

  @override
  String get uiEnterYourEmail => 'Enter your\nemail';

  @override
  String get uiEnterYourPhoneNumber => 'Enter your\nphone number';

  @override
  String get uiEnterYourAppPasscode => 'Enter your app passcode.';

  @override
  String get uiEnterYourEmailAndWeWill =>
      'Enter your email and we will send you a 6-digit verification code to reset your password.';

  @override
  String get uiEnterYourPasscode => 'Enter your passcode';

  @override
  String get uiEnterYourRegisteredBusinessName =>
      'Enter your registered business name';

  @override
  String get uiEnterYourRouteToSeeAvailable =>
      'Enter your route to see available travelers.';

  @override
  String get uiEverythingLookRightPublishWhenReady =>
      'Everything look right? Publish when ready.';

  @override
  String get uiEverythingStaysInOneThreadSo =>
      'Everything stays in one thread so users can return any time, just like a messenger inbox.';

  @override
  String get uiExplainWhyYouAreRejectingThe =>
      'Explain why you are rejecting the package.';

  @override
  String get uiExternalCarrierTracking => 'External Carrier Tracking';

  @override
  String get uiFrequentlyAskedQuestions => 'FREQUENTLY ASKED QUESTIONS';

  @override
  String get uiFaceIdOrTouchId => 'Face ID or Touch ID';

  @override
  String get uiFactorySealedEvidence => 'Factory-sealed evidence';

  @override
  String get uiFailedToSaveNamePleaseTry =>
      'Failed to save name. Please try again.';

  @override
  String get uiFailedToUpdateBio => 'Failed to update bio';

  @override
  String get uiFailedToUpdatePreferences => 'Failed to update preferences';

  @override
  String get uiFailedToUpdateProfile => 'Failed to update profile';

  @override
  String get uiFindARoute => 'Find a Route';

  @override
  String get uiFindATravelerToCarryYour =>
      'Find a traveler to carry your package.';

  @override
  String get uiFindAnswersToCommonQuestionsBelow =>
      'Find answers to common questions below.';

  @override
  String get uiFindingTravelersOnThisRoute =>
      'Finding travelers on this route…';

  @override
  String get uiFirstName => 'First Name *';

  @override
  String get uiForComplexIssues => 'For complex issues';

  @override
  String get uiForYourSafetyTheSenderMust =>
      'For your safety, the sender must open the package and allow you to inspect all items before collection.\n\nDo not accept sealed packages or items that you have not personally inspected.';

  @override
  String get uiForYourSecurityPleaseUnlockThe =>
      'For your security, please unlock the app to continue.';

  @override
  String get uiFromGallery => 'From Gallery';

  @override
  String get uiFromWizard => 'From wizard';

  @override
  String get uiFullName => 'Full Name';

  @override
  String get uiFullName2 => 'Full name';

  @override
  String get uiFullNameOnTheAccount => 'Full name on the account';

  @override
  String get uiFullNameOnTheBankAccount => 'Full name on the bank account';

  @override
  String get uiGbpPayoutsUseAUkSort =>
      'GBP payouts use a UK sort code and account number.';

  @override
  String get uiGetInstantUpdatesAboutMessagesShipment =>
      'Get instant updates about messages, shipment activity, and delivery progress.';

  @override
  String get uiGetMatchedWithACarrierTogether =>
      'Get matched with a carrier together';

  @override
  String get uiGiftItemsIsNotLiveYet =>
      'Gift items is not live yet. We will implement it soon.';

  @override
  String get uiGoogleSignInCanBeUnreliable =>
      'Google Sign-In can be unreliable on the iPhone simulator. If it hangs, use email login here and test Google on a real device.';

  @override
  String get uiGotIt => 'Got it';

  @override
  String get uiGroupShipping => 'Group Shipping';

  @override
  String get uiGroupShippingRequestCreatedShareWith =>
      'Group shipping request created! Share with your group to join.';

  @override
  String get uiHowItWorks => 'HOW IT WORKS';

  @override
  String get uiHandoverPin => 'Handover PIN';

  @override
  String get uiHandoverConfirmedFundsReleased =>
      'Handover confirmed! Funds released.';

  @override
  String get uiHowCanWeHelp => 'How can we help?';

  @override
  String get uiHowManyKgCanYouCarry => 'How many kg can you carry?';

  @override
  String get uiHowWeUseIt => 'How we use it';

  @override
  String get uiHowWouldYouLikeToSign => 'How would you like to sign up?';

  @override
  String get uiIReceivedMyPackage => 'I Received My Package';

  @override
  String get uiIAcceptResponsibilityForThisPackage =>
      'I accept responsibility for this package once I collect it and understand this agreement will be electronically signed and kept with the order.';

  @override
  String get uiIAcknowledgeThatMyPersonalData =>
      'I acknowledge that my personal data will be processed according to the privacy policy.';

  @override
  String get uiIAgreeToFollowBagoS =>
      'I agree to follow Bago\'s guidelines and take responsibility for my shipment.';

  @override
  String get uiIAgreeToThePlatformS =>
      'I agree to the platform\'s terms and conditions for using Bago.';

  @override
  String get uiIAgreeStartVerification => 'I agree — Start Verification';

  @override
  String get uiIConfirmThatIAm18 =>
      'I confirm that I am 18 years of age or older.';

  @override
  String get uiIConfirmThatMyShipmentDoes =>
      'I confirm that my shipment does not contain any prohibited items and complies with Bago\'s item policy.';

  @override
  String get uiIConsentToTheCollectionAnd =>
      'I consent to the collection and processing of my personal data as described in the ';

  @override
  String get uiIHavePersonallyInspectedTheContents =>
      'I have personally inspected the contents and confirm the items match the delivery description.';

  @override
  String get uiIHaveReadAndAgreeTo => 'I have read and agree to the ';

  @override
  String get uiIUnderstandAndAgreeToAll =>
      'I understand and agree to all terms';

  @override
  String get uiIUnderstandThatIMustNot =>
      'I understand that I must not transport illegal, dangerous, restricted, undisclosed, or suspicious items.';

  @override
  String get uiIUnderstandTheTravelerMayInspect =>
      'I understand the traveler may inspect the contents for safety and compliance.';

  @override
  String get uiIWouldLikeToReceivePromotional =>
      'I would like to receive promotional offers and updates via email.';

  @override
  String get uiIban => 'IBAN *';

  @override
  String get uiIdVerified => 'ID\nVerified';

  @override
  String get uiIdentityVerificationRequired => 'Identity Verification Required';

  @override
  String get uiIdentityVerificationApproved =>
      'Identity verification approved!';

  @override
  String get uiImageUnavailable => 'Image unavailable';

  @override
  String get uiInEscrow => 'In escrow';

  @override
  String get uiInbox => 'Inbox';

  @override
  String get uiIndividual => 'Individual';

  @override
  String get uiInsufficientBalance => 'Insufficient balance.';

  @override
  String get uiInsuranceIncluded => 'Insurance included';

  @override
  String get uiInsuredDelivery => 'Insured\nDelivery';

  @override
  String get uiInviteOthersWithTheSameDestination =>
      'Invite others with the same destination';

  @override
  String get uiItemCategory => 'Item Category';

  @override
  String get uiItemDescription => 'Item Description';

  @override
  String get uiJohnDoe => 'John Doe';

  @override
  String get uiJourneyMap => 'Journey Map';

  @override
  String get uiKeep => 'Keep';

  @override
  String get uiKeepTheSenderUpdatedOnThe =>
      'Keep the sender updated on the shipment progress.';

  @override
  String get uiLinkedPayoutAccount => 'LINKED PAYOUT ACCOUNT';

  @override
  String get uiLocationInformation => 'LOCATION INFORMATION';

  @override
  String get uiLastName => 'Last Name *';

  @override
  String get uiLastUpdatedJuly152026 => 'Last updated: July 15, 2026';

  @override
  String get uiLastUpdatedJuly172026 => 'Last updated: July 17, 2026';

  @override
  String get uiLinkBankAccount => 'Link Bank Account';

  @override
  String get uiListTheItemsYouWantTo => 'List the items you want to ship...';

  @override
  String get uiLiveChat => 'Live Chat';

  @override
  String get uiLiveChat2 => 'Live chat';

  @override
  String get uiLivenessCheck => 'Liveness Check';

  @override
  String get uiLoadingMap => 'Loading map...';

  @override
  String get uiLocked => 'Locked';

  @override
  String get uiLogout => 'Logout';

  @override
  String get uiMmDdYyyy => 'MM/DD/YYYY';

  @override
  String get uiMyBio => 'MY BIO';

  @override
  String get uiMakeSureAllTextIsClearly =>
      'Make sure all text is clearly visible and there\'s no glare.';

  @override
  String get uiManage => 'Manage';

  @override
  String get uiMarketingCommunications => 'Marketing Communications';

  @override
  String get uiMembersWithABioAre3x =>
      'Members with a bio are 3x more likely to have their shipments or trips booked. A complete profile builds trust in the Bago community.';

  @override
  String get uiMessage => 'Message';

  @override
  String get uiMethod => 'Method';

  @override
  String get uiMinimum => 'Minimum';

  @override
  String get uiMyShipmentDoesNotContainAny =>
      'My shipment does not contain any prohibited or restricted items.';

  @override
  String get uiNotificationSettings => 'NOTIFICATION SETTINGS';

  @override
  String get uiNameAndDateOfBirthAre =>
      'Name and date of birth are locked after KYC approval.';

  @override
  String get uiNameMustBeAtLeast2 => 'Name must be at least 2 characters';

  @override
  String get uiNewConversation => 'New conversation';

  @override
  String get uiNewShipment => 'New shipment';

  @override
  String get uiNewShipmentRequest => 'New shipment request';

  @override
  String get uiNewTicket => 'New ticket';

  @override
  String get uiNoActiveConversationsYet => 'No active conversations yet';

  @override
  String get uiNoBanksFound => 'No banks found';

  @override
  String get uiNoCitiesFound => 'No cities found';

  @override
  String get uiNoHelpArticlesMatchedThatSearch =>
      'No help articles matched that search';

  @override
  String get uiNoPayoutMethodLinked => 'No payout method linked';

  @override
  String get uiNoProhibitedItems => 'No prohibited items';

  @override
  String get uiNoRecentSearches => 'No recent searches';

  @override
  String get uiNoReferredUsersYet => 'No referred users yet.';

  @override
  String get uiNoSavedRoutesFound => 'No saved routes found.';

  @override
  String get uiNoServicesYetAddANamed =>
      'No services yet. Add a named rate like \"Express\" or \"Standard\" — senders will see it priced the same way as any trip, everywhere in the app.';

  @override
  String get uiNoTravelersYet => 'No travelers yet';

  @override
  String get uiNone => 'None';

  @override
  String get uiNotNow => 'Not now';

  @override
  String get uiNoteForTravelerOptional => 'Note for traveler (optional)';

  @override
  String get uiNoteToTraveler => 'Note to traveler';

  @override
  String get uiNotesOptional => 'Notes (optional)';

  @override
  String get uiOpen => 'Open';

  @override
  String get uiOpenBoxInspectionRequired => 'Open Box Inspection Required';

  @override
  String get uiOpenChat => 'Open Chat';

  @override
  String get uiOpenSettings => 'Open Settings';

  @override
  String get uiOpenInbox => 'Open inbox';

  @override
  String get uiOpenToInspection => 'Open to inspection';

  @override
  String get uiOpenWebSupport => 'Open web support';

  @override
  String get uiOptional => 'Optional';

  @override
  String get uiOptionalPreferences => 'Optional Preferences';

  @override
  String get uiOptionalHandlingInstructions =>
      'Optional handling instructions…';

  @override
  String get uiOptionalSkipIfYourIdHas =>
      'Optional — skip if your ID has no back side';

  @override
  String get uiOptional2 => 'Optional:';

  @override
  String get uiOriginCountry => 'Origin country';

  @override
  String get uiOurTeamWillReviewYourIdentity =>
      'Our team will review your identity documents within 1–2 business days. You\'ll receive a notification when it\'s done.';

  @override
  String get uiPackageDeclaration => 'PACKAGE DECLARATION';

  @override
  String get uiPersonalInformation => 'PERSONAL INFORMATION';

  @override
  String get uiPopularCities => 'POPULAR CITIES';

  @override
  String get uiProofOfCollectionRequired => 'PROOF OF COLLECTION REQUIRED';

  @override
  String get uiPackage => 'Package';

  @override
  String get uiPackageUnderReviewDoNotTransport =>
      'Package Under Review\nDo not transport or collect this package while Bago reviews the evidence.';

  @override
  String get uiPasscode => 'Passcode';

  @override
  String get uiPasscodesDoNotMatch => 'Passcodes do not match.';

  @override
  String get uiPaymentAndConversionFees => 'Payment and conversion fees';

  @override
  String get uiPaymentDetailsAreProcessedByFlutterwave =>
      'Payment details are processed by Flutterwave. Bago stores only safe payment references for support, refunds, and shipment tracking.';

  @override
  String get uiPayoutCurrency => 'Payout currency';

  @override
  String get uiPayoutStatus => 'Payout status';

  @override
  String get uiPayoutStatusRefreshed => 'Payout status refreshed.';

  @override
  String get uiPayoutsReleaseAfterDeliveryIsComplete =>
      'Payouts release after delivery is complete, confirmed, and cleared.';

  @override
  String get uiPersonalAccount => 'Personal account';

  @override
  String get uiPhoneNumberUpdated => 'Phone Number Updated!';

  @override
  String get uiPhoneNumber => 'Phone number';

  @override
  String get uiPhoneNumberChangesAreConfirmedWith =>
      'Phone number changes are confirmed with an OTP sent to your email.';

  @override
  String get uiPickUpWhereYouLeftOff => 'Pick up where you left off';

  @override
  String get uiPickupAndDestinationCitiesMustBe =>
      'Pickup and destination cities must be different.';

  @override
  String get uiPleaseAcceptAllRequiredTerms =>
      'Please accept all required terms';

  @override
  String get uiPleaseAgreeToTheTermsAnd =>
      'Please agree to the terms and conditions';

  @override
  String get uiPleaseConfirmYourLegalNameAnd =>
      'Please confirm your legal name and date of birth exactly as they appear on your ID document. These must match for verification to succeed.';

  @override
  String get uiPleaseDescribeYourIssue => 'Please describe your issue';

  @override
  String get uiPleaseEnterAValid10Digit =>
      'Please enter a valid 10-digit account number';

  @override
  String get uiPleaseEnterAValidIban => 'Please enter a valid IBAN.';

  @override
  String get uiPleaseEnterAValidOtp => 'Please enter a valid OTP';

  @override
  String get uiPleaseEnterAValidAccountNumber =>
      'Please enter a valid account number.';

  @override
  String get uiPleaseEnterAValidAmount => 'Please enter a valid amount.';

  @override
  String get uiPleaseEnterThe6DigitCode => 'Please enter the 6-digit code';

  @override
  String get uiPleaseEnterThe6DigitCode2 => 'Please enter the 6-digit code.';

  @override
  String get uiPleaseEnterTheSwiftBicCode => 'Please enter the SWIFT/BIC code.';

  @override
  String get uiPleaseEnterTheAccountHolderName =>
      'Please enter the account holder name.';

  @override
  String get uiPleaseEnterYourDateOfBirth => 'Please enter your date of birth';

  @override
  String get uiPleaseEnterYourFirstAndLast =>
      'Please enter your first and last name';

  @override
  String get uiPleaseEnterYourFullName => 'Please enter your full name';

  @override
  String get uiPleaseEnterYourNameSoWe =>
      'Please enter your name so we know what to call you.';

  @override
  String get uiPleaseEnterYourPhoneNumber => 'Please enter your phone number';

  @override
  String get uiPleaseEnterYourRealNameSo =>
      'Please enter your real name so others know who they\'re working with.';

  @override
  String get uiPleaseFillAllRequiredFields => 'Please fill all required fields';

  @override
  String get uiPleaseFillInAllReceiverDetails =>
      'Please fill in all receiver details.';

  @override
  String get uiPleaseFillInTheRequiredFields =>
      'Please fill in the required fields';

  @override
  String get uiPleaseFillInYourAddressStreet =>
      'Please fill in your address (street, city, postal code, and country).';

  @override
  String get uiPleaseLinkABankAccountBefore =>
      'Please link a bank account before withdrawing.';

  @override
  String get uiPleaseReadAndConfirmEachStatement =>
      'Please read and confirm each statement before sending your shipment.';

  @override
  String get uiPleaseReadTheseTermsOfService =>
      'Please read these Terms of Service carefully before using Bago. These terms govern your use of our platform and services.';

  @override
  String get uiPleaseReviewOurPolicies => 'Please review\nour policies';

  @override
  String get uiPleaseSelectABank => 'Please select a bank';

  @override
  String get uiPleaseSelectABankAndEnter =>
      'Please select a bank and enter account number.';

  @override
  String get uiPleaseSelectARole => 'Please select a role';

  @override
  String get uiPleaseSelectAnAuthenticationMethod =>
      'Please select an authentication method';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn =>
      'Please set your preferred currency in profile settings before continuing.';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn2 =>
      'Please set your preferred currency in profile settings before requesting shipping.';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn3 =>
      'Please set your preferred currency in profile settings before withdrawing.';

  @override
  String get uiPleaseVerifyYourPhoneNumberBefore =>
      'Please verify your phone number before posting a trip.';

  @override
  String get uiPleaseWaitForAccountVerification =>
      'Please wait for account verification';

  @override
  String get uiPoolYourShipmentWithOthersGoing =>
      'Pool your shipment with others going to the same destination to split costs and get cheaper rates.';

  @override
  String get uiPostTrip => 'Post trip';

  @override
  String get uiPostalCode => 'Postal Code *';

  @override
  String get uiPressAndHoldThisDraftTo =>
      'Press and hold this draft to delete it';

  @override
  String get uiPricePerKg => 'Price per kg';

  @override
  String get uiPrivacyConsent => 'Privacy & Consent';

  @override
  String get uiPrivacyPolicy => 'Privacy Policy *';

  @override
  String get uiProcessingYourVerification => 'Processing your verification…';

  @override
  String get uiProfilePhotoUpdated => 'Profile photo updated';

  @override
  String get uiProfileUpdatedSuccessfully => 'Profile updated successfully';

  @override
  String get uiProhibitedItems => 'Prohibited Items';

  @override
  String get uiProof => 'Proof';

  @override
  String get uiProofOfTrip => 'Proof of trip';

  @override
  String get uiProtectMyItem => 'Protect my item';

  @override
  String get uiProtectedByBankGradeEncryption =>
      'Protected by bank-grade encryption';

  @override
  String get uiPublish => 'Publish';

  @override
  String get uiPushNotifications => 'Push Notifications';

  @override
  String get uiQualifiedShipment => 'Qualified shipment';

  @override
  String get uiQuickUnlockAfterInactivity => 'Quick unlock after inactivity';

  @override
  String get uiRateThisShipmentExperienceAndAdd =>
      'Rate this shipment experience and add a short comment.';

  @override
  String get uiReEnterPasscode => 'Re-enter passcode';

  @override
  String get uiReadyToWithdraw => 'Ready to withdraw';

  @override
  String get uiReadyToWithdrawHeldInEscrow =>
      'Ready to withdraw + held in escrow';

  @override
  String get uiRealTimeTracking => 'Real-Time\nTracking';

  @override
  String get uiReason => 'Reason';

  @override
  String get uiReceiverDetails => 'Receiver Details';

  @override
  String get uiRecentSearches => 'Recent Searches';

  @override
  String get uiReferralEarnings => 'Referral earnings';

  @override
  String get uiReferrals => 'Referrals';

  @override
  String get uiReferredUsers => 'Referred users';

  @override
  String get uiRefresh => 'Refresh';

  @override
  String get uiRefreshWallet => 'Refresh wallet';

  @override
  String get uiReject => 'Reject';

  @override
  String get uiRejectPackage => 'Reject Package';

  @override
  String get uiRejectionReasonIfRejecting => 'Rejection reason (if rejecting)';

  @override
  String get uiRemaining => 'Remaining';

  @override
  String get uiRemove => 'Remove';

  @override
  String get uiRemoveAppPasscode => 'Remove app passcode';

  @override
  String get uiRemoveFromHistory => 'Remove from history?';

  @override
  String get uiRemoveService => 'Remove service';

  @override
  String get uiReplyToSupport => 'Reply to support…';

  @override
  String get uiReportIssue => 'Report issue';

  @override
  String get uiReportShipment => 'Report shipment';

  @override
  String get uiRequestShipment => 'Request Shipment';

  @override
  String get uiRequestACurrencyChange => 'Request a currency change';

  @override
  String get uiRequestAccepted => 'Request accepted';

  @override
  String get uiRequestAccepted2 => 'Request accepted!';

  @override
  String get uiRequestDeclined => 'Request declined';

  @override
  String get uiRequestDeclined2 => 'Request declined.';

  @override
  String get uiRequestNotFound => 'Request not found';

  @override
  String get uiRequestSentSupportWillUpdateYou =>
      'Request sent. Support will update you in your tickets.';

  @override
  String get uiRequestsWillAppearHereWhenSenders =>
      'Requests will appear here when senders ask you to carry a package.';

  @override
  String get uiRequiredAgreements => 'Required Agreements';

  @override
  String get uiRequiredAgreements2 => 'Required agreements:';

  @override
  String get uiRequiredByOurPayoutProviderTo =>
      'Required by our payout provider to verify EUR/GBP transfers.';

  @override
  String get uiReserved => 'Reserved';

  @override
  String get uiRetake => 'Retake';

  @override
  String get uiReviewYourTrip => 'Review Your Trip';

  @override
  String get uiReviewPackageRequestsFromSendersWaiting =>
      'Review package requests from senders waiting for your trip.';

  @override
  String get uiReviewYourShipmentDetailsAndConfirm =>
      'Review your shipment details and confirm your item is safe to send.';

  @override
  String get uiRewardRules => 'Reward rules';

  @override
  String get uiRouteDeleted => 'Route deleted';

  @override
  String get uiRoutingNumberUsBanks => 'Routing Number (US banks)';

  @override
  String get uiStillNeedHelp => 'STILL NEED HELP?';

  @override
  String get uiSubject => 'SUBJECT';

  @override
  String get uiSwiftBicBanksOutsideTheUs =>
      'SWIFT / BIC (banks outside the US)';

  @override
  String get uiSwiftBic => 'SWIFT/BIC';

  @override
  String get uiSwiftBic2 => 'SWIFT/BIC *';

  @override
  String get uiSafetyCheck => 'Safety Check';

  @override
  String get uiSave => 'Save';

  @override
  String get uiSaveBankAccount => 'Save Bank Account';

  @override
  String get uiSearchAgain => 'Search Again';

  @override
  String get uiSearchTravelers => 'Search Travelers';

  @override
  String get uiSearchBank => 'Search bank...';

  @override
  String get uiSearchBanks => 'Search banks...';

  @override
  String get uiSearchChatsNamesOrRoutes => 'Search chats, names, or routes';

  @override
  String get uiSearchCity => 'Search city';

  @override
  String get uiSearchCityAndCountry => 'Search city and country';

  @override
  String get uiSearchConversations => 'Search conversations';

  @override
  String get uiSearchCountry => 'Search country';

  @override
  String get uiSearchCountryOrCurrency => 'Search country or currency';

  @override
  String get uiSearchCountryOrDialCode => 'Search country or dial code…';

  @override
  String get uiSearchCountry2 => 'Search country…';

  @override
  String get uiSearchForACityOrAirport => 'Search for a city or airport';

  @override
  String get uiSearchForACityOrCountry => 'Search for a city or country';

  @override
  String get uiSecureCheckout => 'Secure checkout';

  @override
  String get uiSeeAll => 'See all';

  @override
  String get uiSeeEveryThread => 'See every thread';

  @override
  String get uiSelectBank => 'Select Bank';

  @override
  String get uiSelectBank2 => 'Select Bank *';

  @override
  String get uiSelectARejectionReason => 'Select a rejection reason.';

  @override
  String get uiSelectEveryItemContainedInThe =>
      'Select every item contained in the package.';

  @override
  String get uiSelectTheCountryThatIssuedThe =>
      'Select the country that issued the ID you\'ll use — this decides which document types the verification widget accepts.';

  @override
  String get uiSelectYourIdType => 'Select your ID type';

  @override
  String get uiSelected => 'Selected';

  @override
  String get uiSendCode => 'Send Code';

  @override
  String get uiSendAGift => 'Send a Gift';

  @override
  String get uiSendAPackageWithATraveler => 'Send a package with a traveler';

  @override
  String get uiSendKgRequest => 'Send kg request';

  @override
  String get uiSendPackage => 'Send package';

  @override
  String get uiSendRequest => 'Send request';

  @override
  String get uiSendersWillSeeYourAvailableKg =>
      'Senders will see your available kg and match accordingly.';

  @override
  String get uiServiceName => 'Service name';

  @override
  String get uiServiceRemoved => 'Service removed';

  @override
  String get uiSetAnAppPasscodeOrEnable =>
      'Set an app passcode or enable biometrics first before turning on quick unlock.';

  @override
  String get uiSetCountryCurrency => 'Set country & currency';

  @override
  String get uiSetUpWithdrawals => 'Set up\nwithdrawals';

  @override
  String get uiSetUpAccount => 'Set up account';

  @override
  String get uiSetUpPayoutMethod => 'Set up payout method →';

  @override
  String get uiSetYourCountryAndCurrencyFirst =>
      'Set your country and currency first — it only takes a moment.';

  @override
  String get uiSetYourCountryOfResidenceBefore =>
      'Set your country of residence before paying. Your payment currency is assigned from that country.';

  @override
  String get uiSetYourRateCompetitivePricingAttracts =>
      'Set your rate. Competitive pricing attracts more senders.';

  @override
  String get uiShareHowTheShipmentWentSo =>
      'Share how the shipment went so others can make better decisions.';

  @override
  String get uiShareTheShippingCostSaveUp =>
      'Share the shipping cost — save up to 60%';

  @override
  String get uiShareThisPinWithTheTraveler =>
      'Share this PIN with the traveler to confirm handover.';

  @override
  String get uiShareTrip => 'Share trip';

  @override
  String get uiShareWhatWentWellOrWhat =>
      'Share what went well or what could improve...';

  @override
  String get uiShipmentRequest => 'Shipment Request';

  @override
  String get uiShipmentSummary => 'Shipment Summary';

  @override
  String get uiShipmentHasBeenDeliveredWaitingFor =>
      'Shipment has been delivered. Waiting for sender confirmation.';

  @override
  String get uiShipmentReportedSupportCanNowReview =>
      'Shipment reported. Support can now review the chat history.';

  @override
  String get uiShipmentStarted => 'Shipment started';

  @override
  String get uiShippingFee => 'Shipping fee';

  @override
  String get uiShipsToAnyDestination => 'Ships to any destination';

  @override
  String get uiSignIn => 'Sign In';

  @override
  String get uiSignInToContinue => 'Sign in to continue';

  @override
  String get uiSimulatorCode => 'Simulator code';

  @override
  String get uiSinceYouSignedUpWithGoogle =>
      'Since you signed up with Google/Apple, we need to verify your phone number before you can send a shipment.';

  @override
  String get uiSkipBackPhoto => 'Skip back photo';

  @override
  String get uiSkipForNow => 'Skip for now';

  @override
  String get uiSold => 'Sold';

  @override
  String get uiSomethingWentWrongPleaseTryAgain =>
      'Something went wrong. Please try again.';

  @override
  String get uiSortCode => 'Sort Code *';

  @override
  String get uiStartAConversationAnyTimeAnd =>
      'Start a conversation any time and keep the full thread in one place.';

  @override
  String get uiStartALiveChatAndYour =>
      'Start a live chat and your messages will appear here like a shared support inbox.';

  @override
  String get uiStartConversation => 'Start conversation';

  @override
  String get uiStartingVerification => 'Starting verification…';

  @override
  String get uiStateRegion => 'State / Region';

  @override
  String get uiStatusUpdated => 'Status updated!';

  @override
  String get uiStatus => 'Status:';

  @override
  String get uiStreetAddress => 'Street address';

  @override
  String get uiSubmissionFailedPleaseTryAgain =>
      'Submission failed. Please try again.';

  @override
  String get uiSubmitForReview => 'Submit for Review';

  @override
  String get uiSupport => 'Support';

  @override
  String get uiSupportChatIsTemporarilyUnavailablePlease =>
      'Support chat is temporarily unavailable.\nPlease email support@sendwithbago.com';

  @override
  String get uiSupportInbox => 'Support inbox';

  @override
  String get uiSupportRepliesAroundTheClock =>
      'Support replies around the clock';

  @override
  String get uiSupportThatFeelsLikeAConversation =>
      'Support that feels like a conversation';

  @override
  String get uiSupportingExplanation => 'Supporting explanation';

  @override
  String get uiSwapCities => 'Swap cities';

  @override
  String get uiSystemAlerts => 'System Alerts';

  @override
  String get uiTakePhoto => 'Take Photo';

  @override
  String get uiTakeAClearPhotoOfThe => 'Take a clear photo of the back side.';

  @override
  String get uiTakePhoto2 => 'Take photo';

  @override
  String get uiTalkToSupportNow => 'Talk to support now';

  @override
  String get uiTapToAddPhoto => 'Tap to add photo';

  @override
  String get uiTapToCopyThisTestCode =>
      'Tap to copy this test code if the email does not arrive.';

  @override
  String get uiTapToReRecord => 'Tap to re-record';

  @override
  String get uiTellUsThePickupAndDelivery =>
      'Tell us the pickup and delivery locations for your shipment.';

  @override
  String get uiTermsConditions => 'Terms & Conditions';

  @override
  String get uiTermsOfService => 'Terms of Service *';

  @override
  String get uiThanksForSharingYourFeedbackIt =>
      'Thanks for sharing your feedback. It helps other users trust the marketplace.';

  @override
  String get uiThatPasscodeIsNotCorrect => 'That passcode is not correct.';

  @override
  String get uiThePackageIsNowInTransit => 'The package is now in transit.';

  @override
  String get uiTheRequestDetailsAreNotAvailable =>
      'The request details are not available right now. Please refresh and try again.';

  @override
  String get uiTheTravelerHasMarkedThisPackage =>
      'The traveler has marked this package as delivered. Please confirm you\'ve received it to release the payment.';

  @override
  String get uiTheTravelerMarkedThisShipmentAs =>
      'The traveler marked this shipment as delivered. Confirm receipt here to release the payment.';

  @override
  String get uiTheTravellerMustBeAllowedTo =>
      'The traveller must be allowed to inspect the package.';

  @override
  String get uiThisAddsWeightToTheActive =>
      'This adds weight to the active shipment in this chat. Receiver details stay the same.';

  @override
  String get uiThisBecomesYourWalletDisplayAnd =>
      'This becomes your wallet display and payout currency.';

  @override
  String get uiThisCategoryRequiresExtraCareYour =>
      'This category requires extra care. Your traveler may request additional details.';

  @override
  String get uiThisConversationHasBeenClosedStart =>
      'This conversation has been closed. Start a new ticket if you still need help.';

  @override
  String get uiThisDeterminesWhichDocumentTypesThe =>
      'This determines which document types the verification widget shows you.';

  @override
  String get uiThisIsASecureProcessThat =>
      'This is a secure process that takes just a few minutes. We\'ll verify your identity and activate your account.';

  @override
  String get uiThisShipmentChatIsClosedPlease =>
      'This shipment chat is closed. Please contact support or open a dispute if needed.';

  @override
  String get uiThisWillPermanentlyRemoveThisItem =>
      'This will permanently remove this item from your history.';

  @override
  String get uiThisWillRemoveThisDraftShipment =>
      'This will remove this draft shipment immediately. You can start again anytime.';

  @override
  String get uiThisWillRemoveYourSavedShipment =>
      'This will remove your saved shipment draft. You\'ll need to start over if you want to send this package.';

  @override
  String get uiThisWillRemoveYourSavedShipment2 =>
      'This will remove your saved shipment draft. You\'ll need to start over.';

  @override
  String get uiTicketNotFound => 'Ticket not found';

  @override
  String get uiTicketSubmittedWeLlGetBack =>
      'Ticket submitted! We\'ll get back to you soon.';

  @override
  String get uiTicketsAndChatInOneFlow => 'Tickets and chat in one flow';

  @override
  String get uiTime => 'Time';

  @override
  String get uiToGetYourShipmentPayoutsTell =>
      'To get your shipment payouts, tell us where you want Bago to send the money.';

  @override
  String get uiToUnlockAllFeaturesPleaseComplete =>
      'To unlock all features, please complete identity verification.';

  @override
  String get uiToVerifyYourIdentityWeCollect =>
      'To verify your identity we collect and process your personal data including government-issued ID documents and biometric information. This is required by applicable law and our platform terms.';

  @override
  String get uiTotal => 'Total';

  @override
  String get uiTotalSpace => 'Total space';

  @override
  String get uiTotalWallet => 'Total wallet';

  @override
  String get uiTrackingNumber => 'Tracking number';

  @override
  String get uiTravelDate => 'Travel Date';

  @override
  String get uiTravelType => 'Travel Type';

  @override
  String get uiTraveller => 'Traveller';

  @override
  String get uiTripNumber => 'Trip number';

  @override
  String get uiTryAgain => 'Try Again';

  @override
  String get uiTryADifferentKeywordOrStart =>
      'Try a different keyword or start a support conversation so the team can help directly.';

  @override
  String get uiTryAgain2 => 'Try again';

  @override
  String get uiTypeAMessage => 'Type a message...';

  @override
  String get uiTypeCityOrCountry => 'Type city or country';

  @override
  String get uiUkBankAccount => 'UK BANK ACCOUNT';

  @override
  String get uiUkAccountNumbersMustContain8 =>
      'UK account numbers must contain 8 digits.';

  @override
  String get uiUkSortCodesMustContain6 =>
      'UK sort codes must contain 6 digits.';

  @override
  String get uiUsdBankAccount => 'USD BANK ACCOUNT';

  @override
  String get uiUnableToLoadMessages => 'Unable to load messages';

  @override
  String get uiUnderReviewSendersCannotSeeThis =>
      'Under review — senders cannot see this trip yet. We\'ll activate it once approved.';

  @override
  String get uiUnlimitedCapacity => 'Unlimited capacity';

  @override
  String get uiUnlockBago => 'Unlock Bago';

  @override
  String get uiUnlockWithPasscode => 'Unlock with Passcode';

  @override
  String get uiUnverified => 'Unverified';

  @override
  String get uiUpdateStatus => 'Update Status';

  @override
  String get uiUploadingDocuments => 'Uploading documents…';

  @override
  String get uiUseA4To8Digit => 'Use a 4 to 8 digit app passcode.';

  @override
  String get uiUseSecureCheckoutToPayBy =>
      'Use secure checkout to pay by card, Apple Pay, bank transfer, or mobile money.';

  @override
  String get uiUsuallyRepliesInMinutes => 'Usually replies in minutes';

  @override
  String get uiValue => 'Value';

  @override
  String get uiVerificationCodeSentViaSms => 'Verification code sent via SMS.';

  @override
  String get uiVerifyEmail => 'Verify Email';

  @override
  String get uiVerifyIdentity => 'Verify Identity';

  @override
  String get uiVerifyPhone => 'Verify Phone';

  @override
  String get uiVerifyPhoneNumber => 'Verify Phone Number';

  @override
  String get uiVerifyYourEmailFirst => 'Verify your email first';

  @override
  String get uiVerifyYourPhoneNumber => 'Verify your phone number';

  @override
  String get uiView => 'View';

  @override
  String get uiViewDetails => 'View details';

  @override
  String get uiViewImage => 'View image';

  @override
  String get uiViewShipmentDetails => 'View shipment details';

  @override
  String get uiVisaMastercardAmex => 'Visa, Mastercard, Amex';

  @override
  String get uiWhatWouldYouLikeMembersTo =>
      'WHAT WOULD YOU LIKE MEMBERS TO KNOW ABOUT YOU?';

  @override
  String get uiWaitingForAnAgent => 'Waiting for an agent';

  @override
  String get uiWeLlReviewYourDocumentsWithin =>
      'We\'ll review your documents within 1–2 business days and notify you of the result.';

  @override
  String get uiWeVeSentA6Digit => 'We\'ve sent a 6-digit code to ';

  @override
  String get uiWeightKg => 'Weight (kg)*';

  @override
  String get uiWhatAreYouSending => 'What are you sending?';

  @override
  String get uiWhatHappensNext => 'What happens next?';

  @override
  String get uiWhatIsInside => 'What is inside?';

  @override
  String get uiWhatWeCollect => 'What we collect';

  @override
  String get uiWhatWouldYouLikeToDo => 'What would you like to do?';

  @override
  String get uiWhatSYourDateOfBirth => 'What\'s your\ndate of birth?';

  @override
  String get uiWhatSYourFullName => 'What\'s your\nfull name?';

  @override
  String get uiWhatSYourRole => 'What\'s your\nrole?';

  @override
  String get uiWhenAreYouTravelling => 'When are you travelling?';

  @override
  String get uiWhenDoesYourJourneyBegin => 'When does your journey begin?';

  @override
  String get uiWhereAreYouSending => 'Where are you sending?';

  @override
  String get uiWhichCountryIssuedYourId => 'Which country issued your ID?';

  @override
  String get uiWhoReceivesThis => 'Who receives this?';

  @override
  String get uiWhyABio => 'Why a bio?';

  @override
  String get uiWhyDoYouNeedToChange =>
      'Why do you need to change it? (e.g. moved country)';

  @override
  String get uiWithdrawEarnings => 'Withdraw Earnings';

  @override
  String get uiWithdrawFunds => 'Withdraw Funds';

  @override
  String get uiWithdrawAll => 'Withdraw all';

  @override
  String get uiWithdrawalRequest => 'Withdrawal Request';

  @override
  String get uiWithdrawalSubmitted => 'Withdrawal Submitted';

  @override
  String get uiWithdrawalCouldNotBeSubmittedPlease =>
      'Withdrawal could not be submitted. Please try again.';

  @override
  String get uiWrappedOrSealedPackagesAreNot =>
      'Wrapped or sealed packages are not rejected, but they must be inspected before collection.';

  @override
  String get uiWriteAShortBioAboutYourself =>
      'Write a short bio about yourself...';

  @override
  String get uiYyyyMmDd => 'YYYY-MM-DD';

  @override
  String get uiYouCanChangeThisLater => 'You can change this later';

  @override
  String get uiYouCanTrackTheStatusIn =>
      'You can track the status in your transaction history.';

  @override
  String get uiYourDetails => 'Your Details';

  @override
  String get uiYourPrivacyRights => 'Your Privacy Rights';

  @override
  String get uiYourUsdAccountNumber => 'Your USD account number';

  @override
  String get uiYourAccountDoesnTHavePermission =>
      'Your account doesn\'t have permission to withdraw funds. Ask the business owner to enable it.';

  @override
  String get uiYourAccountHasBeenSuspendedDue =>
      'Your account has been suspended due to a violation of our Terms of Service.';

  @override
  String get uiYourBankDetailsAreEncryptedAnd =>
      'Your bank details are encrypted and securely stored. Used strictly for traveler payouts.';

  @override
  String get uiYourDataIsProcessedSecurelyAnd =>
      'Your data is processed securely and will not be shared with third parties without your consent.';

  @override
  String get uiYourDataIsProcessedSolelyTo =>
      'Your data is processed solely to verify your identity and comply with anti-money-laundering (AML) and know-your-customer (KYC) regulations. It is not sold to third parties.';

  @override
  String get uiYourEarningAndPayoutCurrencyIs =>
      'Your earning and payout currency is locked. To change it, send a change request below or chat with support.';

  @override
  String get uiYourEarnings => 'Your earnings';

  @override
  String get uiYourIssue => 'Your issue:';

  @override
  String get uiYourItemsWeight => 'Your items\' weight';

  @override
  String get uiYourMessagesWithBagoSupport => 'Your messages with Bago support';

  @override
  String get uiYourPhoneNumberHasBeenSuccessfully =>
      'Your phone number has been successfully verified and updated on your account.';

  @override
  String get uiYourPrivacyMattersToUsThis =>
      'Your privacy matters to us. This Privacy Policy explains how Bago collects, uses, and protects your personal information.';

  @override
  String get uiEGLagosFriendsGroup => 'e.g. \"Lagos Friends Group\"';

  @override
  String get uiEGAcmeLogisticsLtd => 'e.g. Acme Logistics Ltd';

  @override
  String get uiEGBago12345678 => 'e.g. BAGO-12345678';

  @override
  String get uiEGBarclaysLloydsMonzo => 'e.g. Barclays, Lloyds, Monzo';

  @override
  String get uiEGBerlin => 'e.g. Berlin';

  @override
  String get uiEGChasus33 => 'e.g. CHASUS33';

  @override
  String get uiEGChaseBankOfAmerica => 'e.g. Chase, Bank of America, Wise';

  @override
  String get uiEGDoe => 'e.g. Doe';

  @override
  String get uiEGExpressStandard => 'e.g. Express, Standard';

  @override
  String get uiEGJohn => 'e.g. John';

  @override
  String get uiEGLt12345678901234 => 'e.g. LT12 3456 7890 1234 5678';

  @override
  String get uiEGLagosAccra => 'e.g. Lagos, Accra';

  @override
  String get uiEGRevolt21 => 'e.g. REVOLT21';

  @override
  String get uiEGRevolutN26Wise => 'e.g. Revolut, N26, Wise';

  @override
  String get uiEGUnitedStates => 'e.g. United States';

  @override
  String get uiKg => 'kg';

  @override
  String get uiOr => 'or';

  @override
  String get uiTyping => 'typing…';

  @override
  String uiFUse(Object p0) {
    return 'Use $p0';
  }

  @override
  String uiFWalletCurrencySetTo(Object p0) {
    return 'Wallet currency set to $p0.';
  }

  @override
  String uiFWeSentADigitVerificationCode(Object p0) {
    return 'We sent a 6-digit verification code to $p0. Enter it on the next screen to set a new password.';
  }

  @override
  String uiFOtpSentTo(Object p0) {
    return 'OTP sent to $p0';
  }

  @override
  String uiFEnterTheOtpSentTo(Object p0) {
    return 'Enter the OTP\nsent to $p0';
  }

  @override
  String uiFResendCodeInS(Object p0) {
    return 'Resend code in ${p0}s';
  }

  @override
  String uiFANewVerificationCodeWasSent(Object p0) {
    return 'A new verification code was sent to $p0.';
  }

  @override
  String uiFHeldInEscrow(Object p0, Object p1) {
    return '$p0 $p1 held in escrow';
  }

  @override
  String uiFShipmentProgressStepOf(Object p0) {
    return 'Shipment progress, step $p0 of 4';
  }

  @override
  String uiFFrontOf(Object p0) {
    return 'Front of $p0';
  }

  @override
  String uiFBackOf(Object p0) {
    return 'Back of $p0';
  }

  @override
  String uiFTracking(Object p0) {
    return 'Tracking: $p0';
  }

  @override
  String uiFShipmentNeedHelpContactSupportOr(Object p0) {
    return 'Shipment $p0. Need help? Contact support or report an issue.';
  }

  @override
  String uiFChargedIn(Object p0) {
    return 'Charged in $p0';
  }

  @override
  String uiFUnableToLoadBanksRightNow(Object p0) {
    return 'Unable to load banks right now: $p0';
  }

  @override
  String uiFWithdrawalsArePaidByTheBago(Object p0) {
    return '$p0 withdrawals are paid by the Bago accounts team by bank transfer, usually within 1–3 business days. You\'ll get an email and a notification at each step.';
  }

  @override
  String uiFWeSentADigitCodeTo(Object p0, Object p1) {
    return 'We sent a 6-digit code to $p0$p1 via SMS. Enter it below.';
  }

  @override
  String uiFPaymentCurrency(Object p0) {
    return 'Payment currency: $p0';
  }

  @override
  String uiFCurrentOurTeamReviewsRequestsWithin(Object p0) {
    return 'Current: $p0. Our team reviews requests within 1–2 business days.';
  }

  @override
  String uiFWillUseForPayments(Object p0, Object p1, Object p2) {
    return '$p0 $p1 will use $p2 for payments.';
  }

  @override
  String uiFCharacters(Object p0) {
    return '$p0/250 characters';
  }

  @override
  String uiFPayoutSetupWasNotCompletedCurrency(Object p0) {
    return 'Payout setup was not completed. Currency restored to $p0.';
  }

  @override
  String uiFPayoutAccountLinked(Object p0) {
    return '$p0 payout account linked.';
  }

  @override
  String uiFCurrencyRestoredTo(Object p0, Object p1) {
    return '$p0 Currency restored to $p1.';
  }

  @override
  String uiFSetUpPayouts(Object p0) {
    return 'Set up $p0 payouts?';
  }

  @override
  String uiFYouMustLinkAPayoutAccount(Object p0, Object p1) {
    return 'You must link a $p0 payout account to use this currency. If setup is cancelled, Bago will keep $p1.';
  }

  @override
  String uiFKeep(Object p0) {
    return 'Keep $p0';
  }

  @override
  String uiFDataAreCollectedByBagoAnd(Object p0) {
    return 'Data are collected by Bago and transmitted to our payout provider only to enable payouts. $p0 By proceeding, you confirm this payout account belongs to you.';
  }

  @override
  String uiFCopied(Object p0) {
    return '$p0 copied';
  }

  @override
  String uiFYouAndYourFriendEachGet(Object p0) {
    return 'You and your friend each get $p0 after signup';
  }

  @override
  String uiFEarnAnotherWhenTheySendAn(Object p0, Object p1) {
    return 'Earn another $p0 when they send an item over $p1';
  }

  @override
  String uiFEarned(Object p0, Object p1) {
    return '$p0 $p1 earned';
  }

  @override
  String uiFYourBalanceIsBelowTheMinimum(Object p0, Object p1) {
    return 'Your balance is below the minimum withdrawal amount of $p0 $p1.';
  }

  @override
  String uiFMinimumWithdrawalIsAcrossAllCurrencies(Object p0, Object p1) {
    return 'Minimum withdrawal is $p0 $p1 across all currencies.';
  }

  @override
  String uiFWithdrawalsArePaidToYourBank(Object p0) {
    return '$p0 withdrawals are paid to your bank by the Bago accounts team, usually within 1–3 business days. We\'ll email and notify you when it\'s approved and paid.';
  }

  @override
  String uiFNoTravelersAreHeadingFromTo(Object p0, Object p1) {
    return 'No travelers are heading from $p0 to $p1 right now. Check back soon!';
  }

  @override
  String uiFSendWith(Object p0) {
    return 'Send with $p0';
  }

  @override
  String uiFDone(Object p0) {
    return 'Done ($p0)';
  }

  @override
  String uiFKgFree(Object p0) {
    return '$p0 kg free';
  }

  @override
  String uiFDeparts(Object p0) {
    return 'Departs $p0';
  }

  @override
  String uiFValue(Object p0, Object p1) {
    return 'Value: $p0 $p1';
  }

  @override
  String uiFOtherRequestsWaiting(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count requests waiting',
      one: '1 request waiting',
    );
    return '$_temp0';
  }

  @override
  String uiFSender(Object p0) {
    return 'Sender: $p0';
  }

  @override
  String uiFCreated(Object p0) {
    return 'Created $p0';
  }

  @override
  String uiFUpdateShipmentTo(Object p0) {
    return 'Update shipment to \"$p0\"?';
  }

  @override
  String uiFTravelerInspectionPhotos(Object p0) {
    return 'Traveler inspection photos ($p0/4)';
  }

  @override
  String uiFOfConfirmed(Object p0) {
    return '$p0 of 3 confirmed';
  }

  @override
  String uiFTrips(Object p0) {
    return '$p0 trips';
  }

  @override
  String uiFKgBooked(Object p0) {
    return '${p0}kg booked';
  }

  @override
  String uiFKgLeft(Object p0) {
    return '${p0}kg left';
  }

  @override
  String uiFActive(Object p0) {
    return '$p0 active';
  }

  @override
  String uiFOtherConversations(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count conversations',
      one: '1 conversation',
    );
    return '$_temp0';
  }

  @override
  String uiFCategoryPriority(Object p0, Object p1) {
    return 'Category: $p0  •  Priority: $p1';
  }

  @override
  String uiFRemoveSendersWillNoLongerSee(Object p0) {
    return 'Remove \"$p0\"? Senders will no longer see it in search.';
  }

  @override
  String uiFSelected(Object p0) {
    return 'Selected: $p0';
  }

  @override
  String uiFTypicalRatesRangeFromPerKg(Object p0, Object p1) {
    return 'Typical rates range from $p0 5 - $p1 20 per kg depending on the route.';
  }

  @override
  String uiFAiSuggestsKg(Object p0, Object p1, Object p2) {
    return 'AI suggests $p0 $p1–$p2/kg';
  }

  @override
  String uiFKgBooked2(Object p0) {
    return '$p0 kg booked';
  }

  @override
  String uiFAppearance(Object p0) {
    return '$p0 appearance';
  }
}
