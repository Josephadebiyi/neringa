// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for German (`de`).
class AppLocalizationsDe extends AppLocalizations {
  AppLocalizationsDe([String locale = 'de']) : super(locale);

  @override
  String get appTitle => 'Bago';

  @override
  String get accountSettings => 'Kontoeinstellungen';

  @override
  String get verificationStatus => 'Verifizierungsstatus';

  @override
  String get actionRequiredVerifyIdentity =>
      'Aktion erforderlich: Identität verifizieren';

  @override
  String get kycPassed => 'KYC bestanden';

  @override
  String get profileSection => 'Profil';

  @override
  String get editProfile => 'Profil bearbeiten';

  @override
  String get paymentMethods => 'Zahlungsmethoden';

  @override
  String get preferencesSection => 'Einstellungen';

  @override
  String get notifications => 'Benachrichtigungen';

  @override
  String get biometricLogin => 'Biometrische Anmeldung';

  @override
  String get language => 'Sprache';

  @override
  String get legalSection => 'Rechtliches';

  @override
  String get termsOfService => 'Nutzungsbedingungen';

  @override
  String get privacyPolicy => 'Datenschutzrichtlinie';

  @override
  String get deleteAccount => 'Konto löschen';

  @override
  String get biometricEnabledMessage =>
      'Biometrische Anmeldung ist jetzt aktiviert.';

  @override
  String get biometricDisabledMessage =>
      'Biometrische Anmeldung ist jetzt deaktiviert.';

  @override
  String get languageSettingsTitle => 'Sprache';

  @override
  String get languageSettingsSubtitle =>
      'Wähle die Sprache, die du in der gesamten App verwenden möchtest.';

  @override
  String get languageChangedMessage => 'Sprache aktualisiert.';

  @override
  String get languageEnglish => 'Englisch';

  @override
  String get languageGerman => 'Deutsch';

  @override
  String get languageFrench => 'Französisch';

  @override
  String get languageSpanish => 'Spanisch';

  @override
  String get languagePortuguese => 'Portugiesisch';

  @override
  String get languageItalian => 'Italienisch';

  @override
  String get emailLabel => 'E-Mail';

  @override
  String get emailHint => 'du@beispiel.com';

  @override
  String get passwordLabel => 'Passwort';

  @override
  String get passwordHint => 'Dein Passwort';

  @override
  String get forgotPassword => 'Passwort vergessen?';

  @override
  String get logIn => 'Anmelden';

  @override
  String get continueWithGoogle => 'Mit Google fortfahren';

  @override
  String get continueWithEmail => 'Mit E-Mail fortfahren';

  @override
  String get useBiometric => 'Face ID / Fingerabdruck verwenden';

  @override
  String get notMemberYet => 'Noch kein Mitglied?';

  @override
  String get signUp => 'Registrieren';

  @override
  String get pleaseFillAllFields => 'Bitte fülle alle Felder aus';

  @override
  String get biometricAuthFailed =>
      'Biometrische Authentifizierung fehlgeschlagen.';

  @override
  String get pleaseEnterYourEmail => 'Bitte gib deine E-Mail ein';

  @override
  String get pleaseEnterYourPassword => 'Bitte gib dein Passwort ein';

  @override
  String get signInToYourAccount => 'Melde dich bei deinem Konto an';

  @override
  String get choosePreferredMethod => 'Wähle deine bevorzugte Methode';

  @override
  String get dontHaveAccount => 'Du hast noch kein Konto?';

  @override
  String get enterYourEmailTitle => 'Gib deine E-Mail ein';

  @override
  String get verificationCodeMessage => 'Wir senden dir einen Bestätigungscode';

  @override
  String get enterYourPasswordTitle => 'Gib dein Passwort ein';

  @override
  String get keepYourAccountSecure => 'Halte dein Konto sicher';

  @override
  String get forgotPasswordTitle => 'Passwort vergessen?';

  @override
  String get forgotPasswordDescription =>
      'Gib deine E-Mail ein und wir senden dir einen Link zum Zurücksetzen deines Passworts.';

  @override
  String get emailAddressLabel => 'E-Mail-Adresse';

  @override
  String get emailRequired => 'E-Mail ist erforderlich';

  @override
  String get enterValidEmail => 'Gib eine gültige E-Mail ein';

  @override
  String get sendResetLink => 'Link zum Zurücksetzen senden';

  @override
  String get checkYourInbox => 'Prüfe deinen Posteingang';

  @override
  String passwordResetEmailSent(Object email) {
    return 'Wir haben einen Link zum Zurücksetzen des Passworts an $email gesendet. Prüfe deine E-Mails und folge den Anweisungen.';
  }

  @override
  String get backToSignIn => 'Zurück zur Anmeldung';

  @override
  String get resetPasswordTitle => 'Passwort zurücksetzen';

  @override
  String get createNewPasswordTitle => 'Neues Passwort erstellen';

  @override
  String get enterNewPasswordDescription => 'Gib unten dein neues Passwort ein';

  @override
  String get newPasswordLabel => 'Neues Passwort';

  @override
  String get newPasswordHint => 'Neues Passwort eingeben';

  @override
  String get confirmPasswordLabel => 'Passwort bestätigen';

  @override
  String get confirmPasswordHint => 'Passwort erneut eingeben';

  @override
  String get passwordsDoNotMatch => 'Passwörter stimmen nicht überein';

  @override
  String get passwordMinLength =>
      'Das Passwort muss mindestens 8 Zeichen lang sein';

  @override
  String get passwordResetSuccessfully => 'Passwort erfolgreich zurückgesetzt';

  @override
  String get resetPasswordButton => 'Passwort zurücksetzen';

  @override
  String get onboardingSlide1Title => 'Versenden zu deinen Bedingungen';

  @override
  String get onboardingSlide1Description =>
      'Verbinde dich mit verifizierten Reisenden auf deiner Strecke für günstigen Versand.';

  @override
  String get onboardingSlide2Title => 'Verdiene Geld mit deinen Kilometern';

  @override
  String get onboardingSlide2Description =>
      'Nutze deinen freien Platz und liefere Pakete auf deiner Route.';

  @override
  String get onboardingSlide3Title => 'Sicher, verifiziert, zuverlässig';

  @override
  String get onboardingSlide3Description =>
      'Bago nutzt Community-Verifizierung und Echtzeit-Tracking, damit jedes Paket sicher ist.';

  @override
  String get skip => 'Überspringen';

  @override
  String get next => 'Weiter';

  @override
  String get createAccount => 'Konto erstellen';

  @override
  String get signupStepEmailTitle => 'Wie lautet deine E-Mail?';

  @override
  String get checkingEmail => 'E-Mail wird geprüft...';

  @override
  String get emailAvailable => 'E-Mail ist verfügbar';

  @override
  String get emailAlreadyExists => 'Für diese E-Mail gibt es bereits ein Konto';

  @override
  String get availableEmailRequired =>
      'Bitte gib eine verfügbare E-Mail-Adresse ein.';

  @override
  String get signupRestartCountry =>
      'Bitte starte die Registrierung neu und wähle dein Land erneut.';

  @override
  String get signupStepNameTitle => 'Wie heißt du?';

  @override
  String get firstNameHint => 'Vorname';

  @override
  String get lastNameHint => 'Nachname';

  @override
  String get phoneNumberTitle => 'Telefonnummer';

  @override
  String get phoneDeliveryUpdates => 'Wir nutzen diese für Liefer-Updates.';

  @override
  String get phoneHint => 'Telefonnummer';

  @override
  String countryCodeSelected(Object dialCode, Object country) {
    return 'Ländervorwahl $dialCode für $country ausgewählt.';
  }

  @override
  String get dobTitle => 'Wann bist du geboren?';

  @override
  String get securityTitle => 'Sicherheit';

  @override
  String get signupStepCountryTitle => 'Wo befindest du dich?';

  @override
  String get countryCurrencyMethods =>
      'Das bestimmt deine Währung und verfügbaren Zahlungsmethoden.';

  @override
  String get selectedWalletSetup => 'Ausgewählte Wallet-Einrichtung';

  @override
  String currencySelection(Object currency, Object symbol) {
    return 'Währung: $currency ($symbol)';
  }

  @override
  String get verifyYourEmail => 'Bestätige deine E-Mail';

  @override
  String sentSixDigitCode(Object email) {
    return 'Wir haben einen 6-stelligen Code an $email gesendet';
  }

  @override
  String get resendCode => 'Code erneut senden';

  @override
  String resendIn(Object seconds) {
    return 'Erneut senden in ${seconds}s';
  }

  @override
  String get resend => 'Erneut senden';

  @override
  String get welcomeToBago => 'Willkommen bei Bago!';

  @override
  String walletSetTo(Object currency, Object symbol) {
    return 'Deine Wallet wurde auf $currency gesetzt (${symbol}0.00)';
  }

  @override
  String get selectCountry => 'Land auswählen';

  @override
  String get goToDashboard => 'Zum Dashboard';

  @override
  String get orLabel => 'ODER';

  @override
  String get profileTabAboutYou => 'Über dich';

  @override
  String get profileTabAccount => 'Konto';

  @override
  String get profileFallbackUser => 'Bago-Nutzer';

  @override
  String get deleteAccountTitle => 'Konto löschen?';

  @override
  String get deleteAccountMessage =>
      'Dadurch wird dein Bago-Konto dauerhaft gelöscht und du wirst abgemeldet.';

  @override
  String get cancel => 'Abbrechen';

  @override
  String get roleSendPackages => 'Pakete senden';

  @override
  String get roleEarnTraveler => 'Als Reisender verdienen';

  @override
  String get editPersonalDetails => 'Persönliche Daten bearbeiten';

  @override
  String get identityVerification => 'Identitätsprüfung';

  @override
  String get notSet => 'Nicht festgelegt';

  @override
  String get aboutYouSection => 'Über dich';

  @override
  String get addMiniBio => 'Mini-Bio hinzufügen';

  @override
  String get highlyResponsiveReliable =>
      'Sehr reaktionsschnell und zuverlässig';

  @override
  String get highlyRatedCommunity => 'Von der Bago-Community hoch bewertet';

  @override
  String get ratingsActivity => 'Bewertungen und Aktivität';

  @override
  String get ratingsLeft => 'Von dir abgegebene Bewertungen';

  @override
  String get savedRoutes => 'Gespeicherte Routen';

  @override
  String get paymentsSection => 'Zahlungen';

  @override
  String preferredCurrency(Object currency) {
    return 'Bevorzugte Währung: $currency';
  }

  @override
  String get changePassword => 'Passwort ändern';

  @override
  String get payoutMethods => 'Auszahlungsmethoden';

  @override
  String get paymentsRefunds => 'Zahlungen und Rückerstattungen';

  @override
  String get supportLegal => 'Support und Rechtliches';

  @override
  String get communicationPreferences => 'Kommunikationseinstellungen';

  @override
  String get helpSupport => 'Hilfe und Support';

  @override
  String get signOut => 'Abmelden';

  @override
  String get shipmentsTitle => 'Meine Sendungen';

  @override
  String get tripsTitle => 'Meine Reisen';

  @override
  String get activeTab => 'Aktiv';

  @override
  String get historyTab => 'Verlauf';

  @override
  String get nothingHereYet => 'Hier ist noch nichts';

  @override
  String get shipmentsEmptySubtitle =>
      'Deine Sendungen erscheinen hier, sobald du Bago nutzt.';

  @override
  String get findTraveler => 'Reisenden finden';

  @override
  String get requestsSent => 'Gesendete Anfragen';

  @override
  String get requestHistory => 'Anfrageverlauf';

  @override
  String get requestsSentSubtitle =>
      'Anfragen, die du an gelistete Reisende gesendet hast.';

  @override
  String get requestHistorySubtitle =>
      'Abgeschlossene und abgelehnte Anfragen an Reisende.';

  @override
  String get myShipmentsSection => 'Meine Sendungen';

  @override
  String get shipmentHistory => 'Sendungsverlauf';

  @override
  String get myShipmentsSubtitle => 'Pakete, die du erstellt hast.';

  @override
  String get shipmentHistorySubtitle =>
      'Abgeschlossene und geschlossene Sendungen.';

  @override
  String get pendingPayment => 'Ausstehende Zahlung';

  @override
  String get finishCheckoutShipment =>
      'Schließe den Bezahlvorgang ab, um diese Sendungsanfrage zu senden.';

  @override
  String resumeBefore(Object time) {
    return 'Vor $time fortsetzen';
  }

  @override
  String get continueShipment => 'Sendung fortsetzen';

  @override
  String get delete => 'Löschen';

  @override
  String get tripsEmptySubtitle =>
      'Deine Reisen und eingehenden Anfragen erscheinen hier, sobald Reisende Anfragen senden.';

  @override
  String get seeRequests => 'Anfragen ansehen';

  @override
  String get incomingRequests => 'Eingehende Anfragen';

  @override
  String get incomingRequestsSubtitle =>
      'Prüfe Paketanfragen, bevor du sie annimmst oder ablehnst.';

  @override
  String get myTripsSubtitle => 'Deine veröffentlichten Reisepläne.';

  @override
  String get tripHistory => 'Reiseverlauf';

  @override
  String get tripHistorySubtitle => 'Abgeschlossene und geschlossene Reisen.';

  @override
  String get deleteTripTitle => 'Reise löschen?';

  @override
  String get deleteTripMessage =>
      'Dadurch wird die Reise aus deinem Konto entfernt.';

  @override
  String get tripDeletedSuccessfully => 'Reise erfolgreich gelöscht';

  @override
  String get paymentReviewTitle => 'Prüfen und bezahlen';

  @override
  String get noPendingShipmentPayment =>
      'Keine ausstehende Sendungszahlung gefunden.';

  @override
  String get shipmentCurrencyMissing =>
      'Die Sendungswährung fehlt. Bitte starte den Sendungsablauf auf der Detailseite des Reisenden neu.';

  @override
  String get totalAmount => 'Gesamtbetrag';

  @override
  String get shippingFee => 'Versandgebühr';

  @override
  String get insurance => 'Versicherung';

  @override
  String get route => 'Route';

  @override
  String get receiver => 'Empfänger';

  @override
  String get receiverFallback => 'Empfänger';

  @override
  String get securePayment => 'Sichere Zahlung';

  @override
  String get paystackSecureHelp =>
      'Du schließt die Zahlung sicher mit Paystack ab.';

  @override
  String get stripeSecureHelp =>
      'Wähle eine gespeicherte Karte oder füge eine neue hinzu, bevor du zahlst.';

  @override
  String get paymentMethod => 'Zahlungsmethode';

  @override
  String get noSavedCardsYet =>
      'Noch keine gespeicherten Karten. Füge eine Visa- oder Mastercard hinzu, um fortzufahren.';

  @override
  String get shipmentPendingUntilConfirmed =>
      'Deine Sendung bleibt ausstehend, bis die Zahlung bestätigt ist.';

  @override
  String get paymentDraftExpired =>
      'Dieser Zahlungsentwurf ist abgelaufen und kann nicht mehr abgeschlossen werden.';

  @override
  String paymentCanBeResumedUntil(Object time) {
    return 'Deine ausstehende Sendung kann bis $time fortgesetzt werden.';
  }

  @override
  String get pay => 'Bezahlen';

  @override
  String get processingPayment => 'Zahlung wird verarbeitet';

  @override
  String get addCardTitle => 'Karte hinzufügen';

  @override
  String get addCardDescription =>
      'Gib unten deine Kartendaten ein. Nur Visa und Mastercard werden unterstützt.';

  @override
  String get enterValidSupportedCard =>
      'Gib eine gültige Visa- oder Mastercard ein, um fortzufahren.';

  @override
  String get savingCard => 'Karte wird gespeichert...';

  @override
  String get saveCard => 'Karte speichern';

  @override
  String get manageAllCards => 'Alle Karten verwalten';

  @override
  String get pickupLocation => 'Abholort';

  @override
  String get deliveryLocation => 'Lieferort';

  @override
  String get pickupCityPrompt => 'Welche ist deine Abholstadt?';

  @override
  String get sendingToPrompt => 'Wohin sendest du?';

  @override
  String get selectCitiesFirst => 'Bitte wähle zuerst beide Städte aus.';

  @override
  String get homeFallbackUser => 'Nutzer';

  @override
  String welcomeBackName(Object name) {
    return 'Willkommen zurück, $name';
  }

  @override
  String get homeSenderHeadline =>
      'Sende oder empfange Artikel über Grenzen hinweg';

  @override
  String get homeCarrierSubtitle =>
      'Verdiene auf deiner nächsten Reise mit Bago';

  @override
  String get homeSenderSubtitle =>
      'Schnelle, sichere grenzüberschreitende Lieferung';

  @override
  String get whatDoYouWantToDo => 'Was möchtest du tun?';

  @override
  String get topDestination => 'Top-Ziel';

  @override
  String get tripActivityShort => 'Reiseaktivität';

  @override
  String get recentActivity => 'Letzte Aktivität';

  @override
  String get enterPickupCity => 'Abholstadt eingeben';

  @override
  String get enterDestination => 'Ziel eingeben';

  @override
  String get todayLabel => 'Heute';

  @override
  String get findTravelerButton => 'Reisenden finden';

  @override
  String get earnedBalance => 'VERDIENTER SALDO';

  @override
  String get publishNewItinerary => 'Neue Reiseroute veröffentlichen';

  @override
  String get globalLocationSearch => 'Globale Ortssuche';

  @override
  String get searchCityAirport =>
      'Suche nach einer Stadt oder einem Flughafen, um einen Ort auszuwählen.';

  @override
  String get selectDate => 'Datum auswählen';

  @override
  String get confirmDate => 'Datum bestätigen';

  @override
  String get yourTripActivity => 'Deine Reiseaktivität';

  @override
  String get yourActivity => 'Deine Aktivität';

  @override
  String get loadingTrips => 'Deine Reisen werden geladen...';

  @override
  String get loadingActivity => 'Deine Aktivität wird geladen...';

  @override
  String get shipmentsHistoryAvailable =>
      'Dein Sendungsverlauf und an Reisende gesendete Anfragen sind in Meine Sendungen verfügbar.';

  @override
  String get openMyShipments => 'Meine Sendungen öffnen';

  @override
  String get travelersAvailableToday =>
      '8 Reisende sind heute für beliebte Routen verfügbar';

  @override
  String get serviceSendPackage => 'Paket senden';

  @override
  String get serviceBuyItems => 'Artikel kaufen';

  @override
  String get serviceGiftItems => 'Artikel schenken';

  @override
  String get serviceSeeRequests => 'Anfragen ansehen';

  @override
  String get servicePublishTrip => 'Reise veröffentlichen';

  @override
  String get serviceMessages => 'Nachrichten';

  @override
  String get serviceSendPackageDesc =>
      'Sende Artikel einfach über Grenzen hinweg.';

  @override
  String get serviceBuyItemsDesc =>
      'Bitte einen Reisenden, für dich einzukaufen.';

  @override
  String get serviceGiftItemsDesc => 'Sende jemandem etwas Besonderes.';

  @override
  String get serviceSeeRequestsDesc =>
      'Prüfe auf dich wartende Sendungsanfragen.';

  @override
  String get servicePublishTripDesc =>
      'Erstelle eine neue Reiseroute für Reisende.';

  @override
  String get serviceMessagesDesc => 'Behalte alle Sendungschats an einem Ort.';

  @override
  String get tripDetailsTitle => 'Reisedetails';

  @override
  String get couldNotLoadTrip => 'Diese Reise konnte nicht geladen werden.';

  @override
  String get statusLabel => 'Status';

  @override
  String get travelTypeLabel => 'Reiseart';

  @override
  String get departureLabel => 'Abfahrt';

  @override
  String get capacityLabel => 'Kapazität';

  @override
  String get priceLabel => 'Preis';

  @override
  String approxInCurrency(Object currency) {
    return 'Ca. in $currency';
  }

  @override
  String get tripProofLabel => 'Reisenachweis';

  @override
  String get uploaded => 'Hochgeladen';

  @override
  String get missing => 'Fehlt';

  @override
  String get tripEditApprovalMessage =>
      'Das Bearbeiten dieser Reise sendet sie erneut zur Genehmigung an das Support-Team. Lade einen aktualisierten Nachweis hoch, wenn sich dein Ticket oder deine Buchung geändert hat.';

  @override
  String get tripMissingReference =>
      'Für diese Reise fehlt die Detailreferenz. Bitte aktualisiere die Seite und versuche es erneut.';

  @override
  String get editTrip => 'Reise bearbeiten';

  @override
  String get deleteTrip => 'Reise löschen';

  @override
  String get shipmentDetailsTitle => 'Sendungsdetails';

  @override
  String get couldNotLoadShipment => 'Sendung konnte nicht geladen werden';

  @override
  String get retry => 'Erneut versuchen';

  @override
  String get shippingPdfTitle => 'Versand-PDF';

  @override
  String get shippingPdfDescription =>
      'Erstelle ein gebrandetes A4-Dokument mit QR-Tracking, Zeitachse und Sendungsdetails.';

  @override
  String get previewPrint => 'Vorschau / Drucken';

  @override
  String get shareSavePdf => 'PDF teilen / speichern';

  @override
  String get feedbackSubmittedSuccessfully => 'Feedback erfolgreich gesendet.';

  @override
  String get leaveFeedback => 'Feedback hinterlassen';

  @override
  String get rateTravelerNote =>
      'Bewerte den Reisenden und hinterlasse eine kurze Notiz für andere Nutzer.';

  @override
  String get shareYourExperience => 'Teile deine Erfahrung...';

  @override
  String get submitFeedback => 'Feedback senden';

  @override
  String get fromLabel => 'Von';

  @override
  String get toLabel => 'Nach';

  @override
  String get packageDetailsTitle => 'Paketdetails';

  @override
  String get weightLabel => 'Gewicht';

  @override
  String get declaredValueLabel => 'Deklarierter Wert';

  @override
  String get yesLabel => 'Ja';

  @override
  String get noLabel => 'Nein';

  @override
  String get descriptionLabel => 'Beschreibung';

  @override
  String get senderLabel => 'Absender';

  @override
  String get travelerLabel => 'Reisender';

  @override
  String get paymentLabel => 'Zahlung';

  @override
  String get pickupDateLabel => 'Abholdatum';

  @override
  String get deliveryDateLabel => 'Lieferdatum';

  @override
  String get estimatedDepartureLabel => 'Voraussichtliche Abfahrt';

  @override
  String get estimatedArrivalLabel => 'Voraussichtliche Ankunft';

  @override
  String get addressesTitle => 'Adressen';

  @override
  String get pickupLabel => 'Abholung';

  @override
  String get deliveryLabel => 'Lieferung';

  @override
  String get nameLabel => 'Name';

  @override
  String get phoneLabel => 'Telefon';

  @override
  String get trackingNumberTitle => 'Sendungsnummer';

  @override
  String get copiedToClipboard => 'In die Zwischenablage kopiert';

  @override
  String get totalPriceTitle => 'Gesamtpreis';

  @override
  String get feedbackCardDescription =>
      'Bewerte den Reisenden und füge einen kurzen Kommentar hinzu, um anderen Absendern zu helfen.';

  @override
  String get downloadPdf => 'PDF herunterladen';

  @override
  String get goBack => 'Zurück';

  @override
  String get searchResultsTitle => 'Suchergebnisse';

  @override
  String tripsFoundCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Reisen gefunden',
      one: '1 Reise gefunden',
    );
    return '$_temp0';
  }

  @override
  String get anyLabel => 'Beliebig';

  @override
  String get noTripsFound => 'Keine Reisen gefunden';

  @override
  String get tryAdjustingSearch => 'Versuche, deine Suche anzupassen';

  @override
  String get searchAgain => 'Erneut suchen';

  @override
  String get selectBothCitiesFirst => 'Wähle zuerst beide Städte aus';

  @override
  String get searchRequiresCities =>
      'Die Reisesuche zeigt Ergebnisse erst an, wenn du eine Abfahrts- und Zielstadt auswählst.';

  @override
  String get passKycBeforeShipment =>
      'Bitte bestehe die KYC-Prüfung, bevor du eine Sendung erstellst.';

  @override
  String kgAvailable(Object kg) {
    return '$kg kg verfügbar';
  }

  @override
  String get sendWithThisCarrier => 'Mit diesem Reisenden senden';

  @override
  String get sendWithThisTraveler => 'Mit diesem Reisenden senden';

  @override
  String get sendPackageTitle => 'Ein Paket senden';

  @override
  String get findTravelerForRoute => 'Finde einen Reisenden für deine Route';

  @override
  String get selectPickupAndDelivery => 'Bitte wähle Abhol- und Lieferort aus.';

  @override
  String get anyDate => 'Beliebiges Datum';

  @override
  String get findYourTravelerTitle => 'Finde deinen Reisenden';

  @override
  String get findYourTravelerDescription =>
      'Gib oben deinen Abhol- und Lieferort ein und tippe dann auf Reisenden finden, um zu sehen, wer in deine Richtung reist.';

  @override
  String get setPreferredCurrencyTitle => 'Lege deine bevorzugte Währung fest';

  @override
  String get needWalletCurrency =>
      'Wir benötigen deine Wallet-Währung, um diese Sendung korrekt zu berechnen.';

  @override
  String get rateLabel => 'Tarif';

  @override
  String get paymentFailedTitle => 'Zahlung fehlgeschlagen';

  @override
  String draftAvailableUntil(Object time) {
    return 'Dein Sendungsentwurf bleibt bis $time verfügbar.';
  }

  @override
  String get continuePayment => 'Zahlung fortsetzen';

  @override
  String get deleteDraft => 'Entwurf löschen';

  @override
  String get backToMyShipments => 'Zurück zu Meine Sendungen';

  @override
  String get paymentNotCompleted => 'Deine Zahlung wurde nicht abgeschlossen.';

  @override
  String get insufficientFundsMessage =>
      'Deine Karte hat nicht genügend Guthaben. Versuche es mit einer anderen Karte oder kontaktiere deine Bank.';

  @override
  String get cardDeclinedMessage =>
      'Deine Bank hat diese Karte abgelehnt. Versuche es mit einer anderen Karte oder kontaktiere deine Bank.';

  @override
  String get incorrectCvcMessage =>
      'Der Sicherheitscode ist falsch. Bitte prüfe ihn und versuche es erneut.';

  @override
  String get expiredCardMessage =>
      'Diese Karte ist abgelaufen. Bitte verwende eine andere Karte.';

  @override
  String get incorrectNumberMessage =>
      'Die Kartennummer scheint falsch zu sein. Bitte prüfe sie und versuche es erneut.';

  @override
  String get bankVerificationMessage =>
      'Diese Karte benötigt eine Bankverifizierung. Bitte fahre fort und schließe die Verifizierung in der App ab.';

  @override
  String get processingErrorMessage =>
      'Diese Karte konnte gerade nicht verarbeitet werden. Bitte versuche es in einem Moment erneut.';

  @override
  String get paymentCancelledMessage =>
      'Die Zahlung wurde abgebrochen, bevor sie abgeschlossen werden konnte.';

  @override
  String get paymentCouldNotCompleteGeneric =>
      'Deine Zahlung konnte nicht abgeschlossen werden. Bitte versuche es erneut oder nutze eine andere Karte.';

  @override
  String get shipmentRequestedTitle => 'Sendung angefordert!';

  @override
  String get shipmentCreatedSentTraveler =>
      'Deine Sendung wurde erstellt und an den ausgewählten Reisenden gesendet.';

  @override
  String paymentReferenceValue(Object reference) {
    return 'Zahlungsreferenz: $reference';
  }

  @override
  String get viewShipments => 'Sendungen ansehen';

  @override
  String get backToHome => 'Zurück zur Startseite';

  @override
  String get trackShipmentTitle => 'Sendung verfolgen';

  @override
  String get trackYourPackage => 'Dein Paket verfolgen';

  @override
  String get enterTrackingNumberPrompt =>
      'Gib deine Sendungsnummer ein, um dein Paket zu finden';

  @override
  String get enterTrackingNumberMessage => 'Bitte gib eine Sendungsnummer ein';

  @override
  String get trackingNumberLabel => 'Sendungsnummer';

  @override
  String get searchButton => 'Suchen';

  @override
  String get searchAnother => 'Erneut suchen';

  @override
  String get unknownLabel => 'Unbekannt';

  @override
  String get unknownSender => 'Unbekannter Absender';

  @override
  String get unknownReceiver => 'Unbekannter Empfänger';

  @override
  String get currentStatusTitle => 'Aktueller Status';

  @override
  String get originLabel => 'Ursprung';

  @override
  String get destinationLabel => 'Ziel';

  @override
  String get currentLocationLabel => 'Aktueller Ort';

  @override
  String get estimatedDeliveryLabel => 'Voraussichtliche Lieferung';

  @override
  String get pendingLabel => 'Ausstehend';

  @override
  String get pickedUpLabel => 'Abgeholt';

  @override
  String get inTransitLabel => 'Unterwegs';

  @override
  String get outForDeliveryLabel => 'In Zustellung';

  @override
  String get deliveredLabel => 'Zugestellt';

  @override
  String get tripRouteOrigin => 'Start';

  @override
  String get tripRouteDestination => 'Ziel';

  @override
  String get travelModeFlight => 'Flug';

  @override
  String get travelModeBus => 'Bus';

  @override
  String get travelModeTrain => 'Zug';

  @override
  String get travelModeCar => 'Auto';

  @override
  String get travelModeShip => 'Schiff';

  @override
  String get setWalletCurrencyTitle => 'Wallet-Währung festlegen';

  @override
  String get chooseWalletCurrencyDescription =>
      'Wähle die Währung, die du für Einnahmen und Reisepreise verwenden möchtest.';

  @override
  String get confirmCurrency => 'Währung bestätigen';

  @override
  String get acceptTermsToContinue =>
      'Bitte akzeptiere die Bedingungen, um fortzufahren.';

  @override
  String get identityVerificationRequiredTrip =>
      'Identitätsprüfung erforderlich';

  @override
  String get selectDepartureCity => 'Abfahrtsstadt auswählen';

  @override
  String get selectDestinationCity => 'Zielstadt auswählen';

  @override
  String get departureDestinationDifferent =>
      'Abfahrts- und Zielort müssen unterschiedlich sein';

  @override
  String get selectTravelDate => 'Reisedatum auswählen';

  @override
  String get setDepartureTime => 'Abfahrtszeit festlegen';

  @override
  String get uploadTripProofContinue =>
      'Lade einen Reisenachweis hoch, um fortzufahren';

  @override
  String get enterPricePerKg => 'Preis pro kg eingeben';

  @override
  String get chooseTravelType => 'Reiseart wählen';

  @override
  String get uploadProofOfTrip => 'Reisenachweis hochladen';

  @override
  String get capacityAtLeastOneKg => 'Kapazität muss mindestens 1 kg betragen';

  @override
  String get validPricePerKg => 'Gültigen Preis pro kg eingeben';

  @override
  String get noWalletCurrencySet => 'Keine Wallet-Währung festgelegt';

  @override
  String get uploadProofTitle => 'Nachweis hochladen';

  @override
  String get jpegPdfMaxSize => 'JPEG oder PDF, max. 2 MB';

  @override
  String get choosePhoto => 'Foto wählen';

  @override
  String get jpegFromGallery => 'JPEG aus Galerie';

  @override
  String get choosePdf => 'PDF wählen';

  @override
  String get boardingPassBooking => 'Bordkarte oder Buchungsbestätigung';

  @override
  String get fileTooLargeUnder2mb => 'Datei zu groß. Bitte unter 2 MB bleiben.';

  @override
  String get postTripTitle => 'Reise veröffentlichen';

  @override
  String get departureLabelShort => 'Abfahrt';

  @override
  String get destinationLabelShort => 'Ziel';

  @override
  String get saveChanges => 'Änderungen speichern';

  @override
  String get publishTripAction => 'Reise veröffentlichen';

  @override
  String get continueLabel => 'Weiter';

  @override
  String get departureCityTitle => 'Abfahrtsstadt';

  @override
  String get departureCitySubtitle => 'Von wo reist du?';

  @override
  String get destinationCityTitle => 'Zielstadt';

  @override
  String get destinationCitySubtitle => 'Wohin reist du?';

  @override
  String get tripUpdatedTitle => 'Reise aktualisiert';

  @override
  String get tripSubmittedTitle => 'Reise eingereicht';

  @override
  String get statusPendingReview => 'Ausstehende Prüfung';

  @override
  String tripUpdatedApproval(Object destination) {
    return 'Deine Reise wurde aktualisiert und zur Genehmigung an das Support-Team gesendet.';
  }

  @override
  String tripSubmittedApproval(Object destination) {
    return 'Deine Reise wurde eingereicht und wartet auf die Genehmigung des Support-Teams.';
  }

  @override
  String get ticketProofAttached => 'Ticketnachweis angehängt';

  @override
  String get pendingSupportApproval =>
      'Genehmigung durch Support-Team ausstehend';

  @override
  String get goToMyTrips => 'Zu meinen Reisen';

  @override
  String get almostThere => 'Fast geschafft!';

  @override
  String get reviewGuidelinesBeforePosting =>
      'Bitte lies die Richtlinien vor dem Veröffentlichen deiner Reise.';

  @override
  String get verifyIdentityAndAgreeTerms =>
      'Bestätige deine Identität und akzeptiere die Bedingungen, um fortzufahren.';

  @override
  String get identityVerificationKyc =>
      'Für diese Aktion ist eine KYC-Identitätsprüfung erforderlich.';

  @override
  String get requiredToPostTrip =>
      'Du musst KYC bestehen, bevor du eine Reise veröffentlichen kannst.';

  @override
  String get changePasswordTitle => 'Passwort aktualisieren';

  @override
  String get changePasswordDescription =>
      'Gib dein aktuelles Passwort ein und wähle ein neues. Wenn du dich mit Google angemeldet hast oder dein aktuelles Passwort nicht kennst, sende dir stattdessen einen Reset-Link.';

  @override
  String get currentPasswordLabel => 'Aktuelles Passwort';

  @override
  String get currentPasswordHint => 'Aktuelles Passwort eingeben';

  @override
  String get confirmNewPasswordLabel => 'Neues Passwort bestätigen';

  @override
  String get confirmNewPasswordHint => 'Neues Passwort erneut eingeben';

  @override
  String get newPasswordMustDiffer =>
      'Das neue Passwort muss sich vom aktuellen Passwort unterscheiden';

  @override
  String get passwordChangedSuccessfully => 'Passwort erfolgreich geändert';

  @override
  String get resetByEmailUnavailable =>
      'Zurücksetzen per E-Mail nicht verfügbar';

  @override
  String get forgotCurrentPasswordReset =>
      'Aktuelles Passwort vergessen? Per E-Mail zurücksetzen';

  @override
  String get changeEmailTitle => 'E-Mail ändern';

  @override
  String get updateYourEmail => 'Deine E-Mail aktualisieren';

  @override
  String get changeEmailDescription =>
      'Gib die neue E-Mail-Adresse ein, die du verwenden möchtest. Du musst sie mit einem OTP bestätigen.';

  @override
  String get newEmailAddressLabel => 'Neue E-Mail-Adresse';

  @override
  String get sendVerificationCode => 'Bestätigungscode senden';

  @override
  String get verifyItsYou => 'Bestätige, dass du es bist';

  @override
  String get weSentCodeToPrefix => 'Wir haben einen Code gesendet an ';

  @override
  String get weSentCodeToSuffix =>
      '. Gib ihn unten ein, um die Änderung zu bestätigen.';

  @override
  String get verificationCodeLabel => 'Bestätigungscode';

  @override
  String get updateEmailAddress => 'E-Mail-Adresse aktualisieren';

  @override
  String get changeEmailAddress => 'E-Mail-Adresse ändern';

  @override
  String get enterValidEmailAddress =>
      'Bitte gib eine gültige E-Mail-Adresse ein.';

  @override
  String verificationCodeSentTo(Object value) {
    return 'Bestätigungscode gesendet an $value';
  }

  @override
  String get enterVerificationCodePrompt =>
      'Bitte gib den Bestätigungscode ein.';

  @override
  String get emailUpdatedSuccessfully => 'E-Mail erfolgreich aktualisiert!';

  @override
  String get changePhoneNumberTitle => 'Telefonnummer ändern';

  @override
  String get updateYourPhoneNumber => 'Deine Telefonnummer aktualisieren';

  @override
  String changePhoneDescription(Object email) {
    return 'Gib die neue Telefonnummer ein, die du verwenden möchtest. Wir senden einen Bestätigungscode an $email, um die Änderung zu bestätigen.';
  }

  @override
  String get newPhoneNumberLabel => 'Neue Telefonnummer';

  @override
  String get enterValidPhoneNumber =>
      'Bitte gib eine gültige Telefonnummer ein.';

  @override
  String get phoneNumberUpdatedSuccessfully =>
      'Telefonnummer erfolgreich aktualisiert!';

  @override
  String get confirmFromYourEmail => 'Über deine E-Mail bestätigen';

  @override
  String get weSentVerificationCodeToPrefix =>
      'Wir haben einen Bestätigungscode gesendet an ';

  @override
  String get weSentVerificationCodeToSuffix =>
      '. Gib ihn unten ein, um deine Telefonnummer zu aktualisieren.';

  @override
  String get updatePhoneNumber => 'Telefonnummer aktualisieren';

  @override
  String get changePhoneNumberAction => 'Telefonnummer ändern';

  @override
  String get startVerification => 'Verifizierung starten';

  @override
  String get communityGuidelinesTerms =>
      'Community-Richtlinien und Bedingungen';

  @override
  String get acceptSafetyTerms =>
      'Ich akzeptiere alle Sicherheitsrichtlinien und rechtlichen Bedingungen';

  @override
  String get navHome => 'Start';

  @override
  String get navShipments => 'Pakete';

  @override
  String get navTrips => 'Reisen';

  @override
  String get navMessages => 'Nachrichten';

  @override
  String get navProfile => 'Profil';

  @override
  String get preferredCurrencyTitle => 'Bevorzugte Währung';

  @override
  String get currencyScreenInfo =>
      'Wähle die Währung, die du in der gesamten App sehen möchtest. Dies aktualisiert deine Wallet-Anzeige, Auszahlungen und Preiseinstellungen.';

  @override
  String currencyUpdatedTo(Object currency) {
    return 'Bevorzugte Währung auf $currency aktualisiert';
  }

  @override
  String get referenceRates => 'Referenzkurse';

  @override
  String get referenceRatesInfo =>
      'Dies sind die aktuell in der App verwendeten Wechselkurse für unterstützte Währungen.';

  @override
  String get escrowProtectionTitle => 'Escrow-Schutz';

  @override
  String get escrowProtectionDesc =>
      '\"Im Treuhänder\" bedeutet, dass Gelder sicher verwahrt werden. Sie werden zu \"Abgeschlossen\", sobald die Lieferung bestätigt wird.';

  @override
  String get transactionHistory => 'Transaktionsverlauf';

  @override
  String get noTransactionsYet => 'Noch keine Transaktionen';

  @override
  String get noTransactionsDesc =>
      'Sobald du eine Zahlung getätigt oder eine Erstattung erhalten hast, erscheint sie hier.';

  @override
  String get helpHeroText => 'Wie können wir\ndir heute helfen?';

  @override
  String get quickHelp => 'Schnelle Hilfe';

  @override
  String get faqSection => 'Häufig gestellte Fragen';

  @override
  String get searchHelpHint => 'Hilfethemen suchen...';

  @override
  String get noRatingsYet => 'Du hast noch keine Bewertungen hinterlassen.';

  @override
  String get setCurrencyFirst =>
      'Bitte lege deine bevorzugte Währung in den Profileinstellungen fest, bevor du Auszahlungsmethoden verwaltest.';
}
