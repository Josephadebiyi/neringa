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
  String get itemImagesLabel => 'Artikelbilder';

  @override
  String get notProvidedLabel => 'Nicht angegeben';

  @override
  String get receiverInfo => 'Empfängerinformationen';

  @override
  String get escrowLabel => 'Treuhandsaldo';

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

  @override
  String get activityTitle => 'Aktivitäten';

  @override
  String get activityTabTrips => 'Reisen';

  @override
  String get activityTabShipments => 'Sendungen';

  @override
  String get activityTabRequests => 'Anfragen';

  @override
  String get noTripsYet => 'Noch keine Reisen';

  @override
  String get postATripCta => 'Reise posten';

  @override
  String get postATripSubtitle =>
      'Poste eine Reise, um durch das Tragen von Paketen zu verdienen.';

  @override
  String get noShipmentsYet => 'Noch keine Sendungen';

  @override
  String get sendAPackageCta => 'Paket senden';

  @override
  String get sendAPackageSubtitle => 'Sende ein Paket und verfolge es hier.';

  @override
  String get noRequestsYet => 'Noch keine Anfragen';

  @override
  String get noRequestsSubtitle =>
      'Wenn du Sendungsanfragen sendest oder erhältst, erscheinen sie hier.';

  @override
  String get incomingRequestsLabel => 'Eingehende Anfragen';

  @override
  String get sentRequestsLabel => 'Gesendete Anfragen';

  @override
  String get fromSenderLabel => 'Vom Absender';

  @override
  String get withCarrierLabel => 'Mit Kurier';

  @override
  String get pendingPriceLabel => 'Preis ausstehend';

  @override
  String get shipmentRequestFallback => 'Sendungsanfrage';

  @override
  String activeShipmentsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count aktive Sendungen',
      one: '1 aktive Sendung',
    );
    return '$_temp0';
  }

  @override
  String kgFreeLabel(Object kg) {
    return '$kg kg frei';
  }

  @override
  String get ratingsAndReviewsTitle => 'Bewertungen & Rezensionen';

  @override
  String get noReviewsYet => 'Noch keine Bewertungen';

  @override
  String get noReviewsSubtitle =>
      'Bewertungen von Absendern und Reisenden erscheinen hier.';

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Bewertungen',
      one: '1 Bewertung',
    );
    return '$_temp0';
  }

  @override
  String get requestsSectionCarry => 'Pakete zu tragen';

  @override
  String get requestsSectionSending => 'Meine Versandanfragen';

  @override
  String get searchRequestsHint => 'Nach Name oder Paket suchen...';

  @override
  String noResultsFor(Object query) {
    return 'Keine Ergebnisse für \"$query\"';
  }

  @override
  String get activeShipmentsSection => 'Aktiv';

  @override
  String get pastShipmentsSection => 'Vergangen';

  @override
  String get searchTripsHint => 'Nach Route, Datum oder Status suchen...';

  @override
  String get searchShipmentsHint =>
      'Nach Paket, Stadt oder Reisenden suchen...';

  @override
  String get uiIncludingProcessingByOurIdentityVerification =>
      ', einschließlich der Verarbeitung durch unseren Partner für Identitätsprüfung.';

  @override
  String get ui1000Deliveries => '1.000+\nLieferungen';

  @override
  String get ui247Support => '24/7\nSupport';

  @override
  String get ui6DigitCode => '6-stelliger Code';

  @override
  String get ui9DigitAbaRoutingNumber => '9-stellige ABA-Routingnummer';

  @override
  String get uiAClearPhotoHelpsTheTraveler =>
      'Ein klares Foto hilft dem Reisenden, deinen Artikel zu erkennen';

  @override
  String get uiANewCodeHasBeenSent => 'Ein neuer Code wurde gesendet';

  @override
  String get uiAccountDetails => 'KONTODATEN';

  @override
  String get uiAccountInformation => 'KONTOINFORMATIONEN';

  @override
  String get uiAccept => 'Annehmen';

  @override
  String get uiAcceptContinue => 'Akzeptieren & weiter';

  @override
  String get uiAcceptRequest => 'Anfrage annehmen';

  @override
  String get uiAccountHolderName => 'Name des Kontoinhabers';

  @override
  String get uiAccountHolderName2 => 'Name des Kontoinhabers *';

  @override
  String get uiAccountNumber => 'Kontonummer';

  @override
  String get uiAccountNumber2 => 'Kontonummer *';

  @override
  String get uiAccountSuspended => 'Konto gesperrt';

  @override
  String get uiAccountVerification => 'Kontoverifizierung';

  @override
  String get uiAccountCreated => 'Konto erstellt';

  @override
  String get uiAccountHolder => 'Kontoinhaber';

  @override
  String get uiAccountNumberMustBe10Digits =>
      'Die Kontonummer muss 10 Ziffern haben.';

  @override
  String get uiActionNeeded => 'Handlung erforderlich';

  @override
  String get uiActiveShipment => 'Aktive Sendung';

  @override
  String get uiActiveShipments => 'Aktive Sendungen';

  @override
  String get uiAdd24PhotosAndAccept =>
      'Füge 2–4 Fotos hinzu und akzeptiere alle Vereinbarungen.';

  @override
  String get uiAddBankAccount => 'Bankkonto hinzufügen';

  @override
  String get uiAddAService => 'Service hinzufügen';

  @override
  String get uiAddAnItemImageBeforeContinuing =>
      'Füge vor dem Fortfahren ein Artikelbild hinzu.';

  @override
  String get uiAddItemPhoto => 'Artikelfoto hinzufügen';

  @override
  String get uiAddItemPhotoOptional => 'Artikelfoto hinzufügen (optional)';

  @override
  String get uiAddKg => 'kg hinzufügen';

  @override
  String get uiAddMoreKg => 'Mehr kg hinzufügen';

  @override
  String get uiAddPhoto => 'Foto hinzufügen';

  @override
  String get uiAddYourPayoutAccountSoYou =>
      'Füge dein Auszahlungskonto hinzu, um Geld aus Lieferungen zu erhalten.';

  @override
  String get uiAdditionalWeight => 'Zusätzliches Gewicht';

  @override
  String get uiAddressLine1 => 'Adresszeile 1 *';

  @override
  String get uiAddressLine2 => 'Adresszeile 2';

  @override
  String get uiAfterDelivery => 'Nach der Lieferung';

  @override
  String get uiAgeVerification => 'Altersverifizierung *';

  @override
  String get uiAgreementShippingConfirmation =>
      'Vereinbarung & Versandbestätigung';

  @override
  String get uiAllConversationsStaySynced =>
      'Alle Unterhaltungen bleiben synchron';

  @override
  String get uiAllow => 'Erlauben';

  @override
  String get uiAllowNotifications => 'Benachrichtigungen erlauben?';

  @override
  String get uiAmount => 'Betrag';

  @override
  String get uiAnAgentWillJoinShortlyYou =>
      'Gleich meldet sich ein Mitarbeiter. Du kannst unten eine Nachricht senden.';

  @override
  String get uiAnySpecialRequirementsOrInstructions =>
      'Besondere Anforderungen oder Hinweise...';

  @override
  String get uiApartmentSuiteEtcOptional => 'Wohnung, Etage usw. (optional)';

  @override
  String get uiAppPasscode => 'App-Code';

  @override
  String get uiAppPasscodeRemoved => 'App-Code entfernt.';

  @override
  String get uiAppPasscodeSaved => 'App-Code gespeichert.';

  @override
  String get uiApplePay => 'Apple Pay';

  @override
  String get uiApplySuggestion => 'Vorschlag übernehmen';

  @override
  String get uiAreYouSigningUpAsAn =>
      'Registrierst du dich als Privatperson oder als Unternehmen?';

  @override
  String get uiAreYouSureYouWantTo =>
      'Möchtest du diese gespeicherte Route wirklich löschen?';

  @override
  String get uiArrival => 'Ankunft';

  @override
  String get uiAskTheSenderOrReceiverFor =>
      'Bitte den Absender oder Empfänger um die 4-stellige Übergabe-PIN, um die Lieferung zu bestätigen und deine Zahlung sofort freizugeben.';

  @override
  String get uiAtLeast8Characters => 'Mindestens 8 Zeichen';

  @override
  String get uiAvailable => 'Verfügbar';

  @override
  String get uiAvailableBalance => 'Verfügbares Guthaben';

  @override
  String get uiAvailableCapacity => 'Verfügbare Kapazität';

  @override
  String get uiAvailableNow => 'Jetzt verfügbar';

  @override
  String get uiAwaitingPaymentTapToContinue =>
      'Zahlung ausstehend – tippe zum Fortfahren';

  @override
  String get uiBillingAddress => 'RECHNUNGSADRESSE';

  @override
  String get uiBack => 'Zurück';

  @override
  String get uiBackToApp => 'Zurück zur App';

  @override
  String get uiBagoCommission => 'Bago-Provision';

  @override
  String get uiBagoFee => 'Bago-Gebühr';

  @override
  String get uiBagoGuidelines => 'Bago-Richtlinien';

  @override
  String get uiBagoUsesFlutterwaveForSecureCheckout =>
      'Bago nutzt Flutterwave für einen sicheren Checkout. Wenn du per Karte, Apple Pay, Banküberweisung oder Mobile Money zahlst, verarbeitet und speichert Flutterwave die Zahlungsdaten sicher. Bago erhält niemals vollständige Kartennummern.';

  @override
  String get uiBagoWillUseThisCountryTo =>
      'Bago verwendet dieses Land, um vor der KYC deine Wallet-Währung festzulegen.';

  @override
  String get uiBank => 'Bank';

  @override
  String get uiBankCountry => 'Land der Bank';

  @override
  String get uiBankName => 'Name der Bank';

  @override
  String get uiBankName2 => 'Name der Bank *';

  @override
  String get uiBankAccountAddedSuccessfully =>
      'Bankkonto erfolgreich hinzugefügt!';

  @override
  String get uiBankAccountLinkedSuccessfully =>
      'Bankkonto erfolgreich verknüpft!';

  @override
  String get uiBankAccountSetupCouldNotBe =>
      'Das Bankkonto konnte nicht eingerichtet werden. Bitte versuche es erneut.';

  @override
  String get uiBankCountry2 => 'Land der Bank *';

  @override
  String get uiBioCannotBeEmpty => 'Die Bio darf nicht leer sein';

  @override
  String get uiBioUpdatedSuccessfully => 'Bio aktualisiert';

  @override
  String get uiBiometricUnlockFailed =>
      'Biometrisches Entsperren fehlgeschlagen.';

  @override
  String get uiBookings => 'Buchungen';

  @override
  String get uiBriefSummaryOfYourIssue => 'Kurze Beschreibung deines Problems';

  @override
  String get uiBrowseQuickAnswersStartALive =>
      'Durchsuche schnelle Antworten, starte einen Live-Chat oder kehre zu einer bestehenden Unterhaltung zurück, ohne den Kontext zu verlieren.';

  @override
  String get uiBusinessOrOrganisation => 'Unternehmen oder Organisation';

  @override
  String get uiBusinessServices => 'Unternehmensservices';

  @override
  String get uiBusinessServicesAreAvailableToBusiness =>
      'Unternehmensservices sind für Unternehmenskonten verfügbar.';

  @override
  String get uiBuyItemsAbroad => 'Im Ausland einkaufen';

  @override
  String get uiBuyItemsAbroadIsNotLive =>
      '„Im Ausland einkaufen“ ist noch nicht verfügbar. Es kommt bald.';

  @override
  String get uiByContinuingIConfirmThat =>
      'Mit dem Fortfahren bestätige ich, dass:';

  @override
  String get uiBySubmittingYouConfirmThisTrip =>
      'Mit dem Absenden bestätigst du, dass diese Reise korrekt ist. Reisen mit neuen oder geänderten Angaben werden vor der Veröffentlichung erneut vom Support-Team geprüft.';

  @override
  String get uiCategory => 'KATEGORIE';

  @override
  String get uiCalculatingCheckoutTotal => 'Gesamtbetrag wird berechnet...';

  @override
  String get uiCanTFindItCheckYour =>
      'Nicht gefunden? Prüfe deinen Spam- oder Junk-Ordner.';

  @override
  String get uiCardsAreSavedDuringCheckout =>
      'Karten werden beim Bezahlen gespeichert';

  @override
  String get uiCarrierLogisticsCompanyName =>
      'Name des Transport-/Logistikunternehmens';

  @override
  String get uiCategory2 => 'Kategorie';

  @override
  String get uiChange => 'Ändern';

  @override
  String get uiChangeNumber => 'Nummer ändern';

  @override
  String get uiChangingThisAccountRequiresAConfirmation =>
      'Um dieses Konto zu ändern, ist ein Bestätigungscode per E-Mail nötig.';

  @override
  String get uiChatClosed => 'Chat geschlossen';

  @override
  String get uiChatIsNotAvailableForThis =>
      'Der Chat ist für diese Sendung noch nicht verfügbar.';

  @override
  String get uiChatSafelyByStayingWithinBago =>
      'Chatte sicher, indem du in Bago bleibst. Wir schützen deine Zahlungen und Daten.';

  @override
  String get uiChatWithSupport => 'Mit dem Support chatten';

  @override
  String get uiCheckYourInboxForTheVerification =>
      'Prüfe dein Postfach auf die Bestätigungs-E-Mail von deiner Registrierung. Nach der Bestätigung kann es losgehen.';

  @override
  String get uiChooseFromLibrary => 'Aus der Mediathek wählen';

  @override
  String get uiChooseYourEarningCurrencyThisWill =>
      'Wähle deine Einnahmewährung. Sie wird nach der Bestätigung gesperrt und kann nur vom Support geändert werden.';

  @override
  String get uiCity => 'Stadt *';

  @override
  String get uiCityCountry => 'Stadt, Land';

  @override
  String get uiCityAirportStation => 'Stadt, Flughafen, Bahnhof...';

  @override
  String get uiComingSoon => 'Demnächst';

  @override
  String get uiCommunication => 'Kommunikation';

  @override
  String get uiCommunityVerified => 'Community\ngeprüft';

  @override
  String get uiCompany => 'Unternehmen';

  @override
  String get uiCompleteSignup => 'Registrierung abschließen';

  @override
  String get uiCompleteIdentityVerificationBeforeAddingA =>
      'Schließe die Identitätsprüfung ab, bevor du ein Auszahlungskonto hinzufügst.';

  @override
  String get uiCompleteIdentityVerificationBeforeChangingPayout =>
      'Schließe die Identitätsprüfung ab, bevor du die Auszahlungswährung änderst.';

  @override
  String get uiCompleteYourProfile => 'Vervollständige dein Profil';

  @override
  String get uiConfirm => 'Bestätigen';

  @override
  String get uiConfirmBankAccount => 'Bankkonto bestätigen';

  @override
  String get uiConfirmDeliveryGetPaid =>
      'Lieferung bestätigen & bezahlt werden';

  @override
  String get uiConfirmUkBankAccount => 'UK-Bankkonto bestätigen';

  @override
  String get uiConfirmUsdBankAccount => 'USD-Bankkonto bestätigen';

  @override
  String get uiConfirmCountry => 'Land bestätigen';

  @override
  String get uiConfirmDelivery => 'Lieferung bestätigen';

  @override
  String get uiConfirmDeliveryToReleaseThePayment =>
      'Bestätige die Lieferung, um die Zahlung freizugeben.';

  @override
  String get uiConfirmDelivery2 => 'Lieferung bestätigen?';

  @override
  String get uiConfirmPasscode => 'Code bestätigen';

  @override
  String get uiConfirmThisOnlyAfterThePackage =>
      'Bestätige dies erst, wenn du das Paket in den Händen hältst. Dadurch wird die Zahlung an den Reisenden freigegeben.';

  @override
  String get uiConfirmWithdrawal => 'Auszahlung bestätigen';

  @override
  String get uiConfirmYourBank => 'Bank bestätigen';

  @override
  String get uiConfirmYourCountry => 'Bestätige dein Land';

  @override
  String get uiConfirmationCodeCopied => 'Bestätigungscode kopiert.';

  @override
  String get uiConfirmingReceiptWillReleasePaymentTo =>
      'Mit der Empfangsbestätigung wird die Zahlung an den Reisenden freigegeben. Bestätige erst, wenn du das Paket hast.';

  @override
  String get uiConnectionError => 'Verbindungsfehler';

  @override
  String get uiContactSupport => 'Support kontaktieren';

  @override
  String get uiContactSupport2 => 'Support kontaktieren';

  @override
  String get uiContinueAsGuest => 'Als Gast fortfahren';

  @override
  String get uiContinueBrowsing => 'Weiter stöbern';

  @override
  String get uiContinueToPayment => 'Weiter zur Zahlung';

  @override
  String get uiContinueWithApple => 'Mit Apple fortfahren';

  @override
  String get uiConversationWithBagoSupport =>
      'Unterhaltung mit dem Bago-Support';

  @override
  String get uiCouldNotConfirmTheCodePlease =>
      'Der Code konnte nicht bestätigt werden. Bitte versuche es erneut.';

  @override
  String get uiCouldNotLoadBanksPleaseTry =>
      'Banken konnten nicht geladen werden. Bitte versuche es erneut.';

  @override
  String get uiCouldNotLoadMap => 'Karte konnte nicht geladen werden';

  @override
  String get uiCouldNotLoadRequests => 'Anfragen konnten nicht geladen werden';

  @override
  String get uiCouldNotLoadShipmentDetailsPlease =>
      'Sendungsdetails konnten nicht geladen werden. Bitte versuche es erneut.';

  @override
  String get uiCouldNotLoadShipments =>
      'Sendungen konnten nicht geladen werden';

  @override
  String get uiCouldNotLoadTrips => 'Reisen konnten nicht geladen werden';

  @override
  String get uiCouldNotSendTheRequestPlease =>
      'Die Anfrage konnte nicht gesendet werden. Bitte versuche es erneut.';

  @override
  String get uiCouldNotUpdateWalletCurrencyPlease =>
      'Wallet-Währung konnte nicht aktualisiert werden. Bitte versuche es erneut.';

  @override
  String get uiCountryOfResidence => 'Wohnsitzland';

  @override
  String get uiCreateAccount => 'Konto erstellen';

  @override
  String get uiCreateGroupShipment => 'Gruppensendung erstellen';

  @override
  String get uiCreateAPassword => 'Erstelle ein\nPasswort';

  @override
  String get uiCreateAFreeAccountOrSign =>
      'Erstelle ein kostenloses Konto oder melde dich an, um einen Reisenden zu buchen und dein Paket zu versenden.';

  @override
  String get uiCreateAGroupShippingRequest => 'Gruppenversandanfrage erstellen';

  @override
  String get uiCreateYourAccount => 'Erstelle dein\nKonto';

  @override
  String get uiCreditDebitCard => 'Kredit- / Debitkarte';

  @override
  String get uiCurrency => 'Währung';

  @override
  String get uiCurrencyNotSet => 'Währung nicht festgelegt';

  @override
  String get uiCurrentLocationOptional => 'Aktueller Standort (optional)';

  @override
  String get uiCurrentShipments => 'Aktuelle Sendungen';

  @override
  String get uiDataProtectionConsent => 'Datenschutz & Einwilligung';

  @override
  String get uiDate => 'Datum';

  @override
  String get uiDateOfBirth => 'Geburtsdatum';

  @override
  String get uiDateOfBirth2 => 'Geburtsdatum *';

  @override
  String get uiDecline => 'Ablehnen';

  @override
  String get uiDeleteRoute => 'Route löschen';

  @override
  String get uiDeliveryAddress => 'Lieferadresse';

  @override
  String get uiDeliveryConfirmedPaymentReleasedToTraveler =>
      'Lieferung bestätigt! Zahlung an den Reisenden freigegeben.';

  @override
  String get uiDepartureTime => 'Abfahrtszeit';

  @override
  String get uiDescribeYourItemSoYourTraveler =>
      'Beschreibe deinen Artikel, damit der Reisende weiß, was ihn erwartet.';

  @override
  String get uiDiscard => 'Verwerfen';

  @override
  String get uiDiscardDraft => 'Entwurf verwerfen?';

  @override
  String get uiDocumentsSubmitted => 'Dokumente eingereicht';

  @override
  String get uiDropOffAddress => 'Abgabeadresse';

  @override
  String get uiEarnByCarryingPackagesOnYour =>
      'Verdiene, indem du auf deiner Reise Pakete mitnimmst';

  @override
  String get uiEditBio => 'Bio bearbeiten';

  @override
  String get uiEmailAddress => 'E-Mail-Adresse';

  @override
  String get uiEmailNotifications => 'E-Mail-Benachrichtigungen';

  @override
  String get uiEmailSupport => 'E-Mail-Support';

  @override
  String get uiEmailChangesAreHandledThroughVerification =>
      'Änderungen der E-Mail erfolgen über eine Verifizierung.';

  @override
  String get uiEnter48Digits => '4–8 Ziffern eingeben';

  @override
  String get uiEnterAValidPhoneNumber5 =>
      'Gib eine gültige Telefonnummer ein (5–15 Ziffern, nur Zahlen).';

  @override
  String get uiEnterAValidShipmentWeight =>
      'Gib ein gültiges Sendungsgewicht ein.';

  @override
  String get uiEnterAccountNumber => 'Kontonummer eingeben';

  @override
  String get uiEnterAll4Digits => 'Alle 4 Ziffern eingeben';

  @override
  String get uiEnterAmount => 'Betrag eingeben';

  @override
  String get uiEnterTheCode => 'Code eingeben';

  @override
  String get uiEnterTheAdditionalKg => 'Gib die zusätzlichen kg ein.';

  @override
  String get uiEnterWithdrawalCode => 'Auszahlungscode eingeben';

  @override
  String get uiEnterYourEmail => 'Gib deine\nE-Mail ein';

  @override
  String get uiEnterYourPhoneNumber => 'Gib deine\nTelefonnummer ein';

  @override
  String get uiEnterYourAppPasscode => 'Gib deinen App-Code ein.';

  @override
  String get uiEnterYourEmailAndWeWill =>
      'Gib deine E-Mail ein und wir senden dir einen 6-stelligen Code zum Zurücksetzen deines Passworts.';

  @override
  String get uiEnterYourPasscode => 'Code eingeben';

  @override
  String get uiEnterYourRegisteredBusinessName =>
      'Gib deinen eingetragenen Firmennamen ein';

  @override
  String get uiEnterYourRouteToSeeAvailable =>
      'Gib deine Route ein, um verfügbare Reisende zu sehen.';

  @override
  String get uiEverythingLookRightPublishWhenReady =>
      'Alles korrekt? Veröffentliche, wenn du bereit bist.';

  @override
  String get uiEverythingStaysInOneThreadSo =>
      'Alles bleibt in einer Unterhaltung, sodass du jederzeit zurückkehren kannst – wie in einem Messenger.';

  @override
  String get uiExplainWhyYouAreRejectingThe =>
      'Erkläre, warum du das Paket ablehnst.';

  @override
  String get uiExternalCarrierTracking => 'Externe Sendungsverfolgung';

  @override
  String get uiFrequentlyAskedQuestions => 'HÄUFIG GESTELLTE FRAGEN';

  @override
  String get uiFaceIdOrTouchId => 'Face ID oder Touch ID';

  @override
  String get uiFactorySealedEvidence => 'Nachweis der Werksversiegelung';

  @override
  String get uiFailedToSaveNamePleaseTry =>
      'Name konnte nicht gespeichert werden. Bitte versuche es erneut.';

  @override
  String get uiFailedToUpdateBio => 'Bio konnte nicht aktualisiert werden';

  @override
  String get uiFailedToUpdatePreferences =>
      'Einstellungen konnten nicht aktualisiert werden';

  @override
  String get uiFailedToUpdateProfile =>
      'Profil konnte nicht aktualisiert werden';

  @override
  String get uiFindARoute => 'Route finden';

  @override
  String get uiFindATravelerToCarryYour =>
      'Finde einen Reisenden für dein Paket.';

  @override
  String get uiFindAnswersToCommonQuestionsBelow =>
      'Antworten auf häufige Fragen findest du unten.';

  @override
  String get uiFindingTravelersOnThisRoute =>
      'Reisende auf dieser Route werden gesucht…';

  @override
  String get uiFirstName => 'Vorname *';

  @override
  String get uiForComplexIssues => 'Für komplexe Anliegen';

  @override
  String get uiForYourSafetyTheSenderMust =>
      'Zu deiner Sicherheit muss der Absender das Paket öffnen und dich vor der Abholung alle Artikel prüfen lassen.\n\nNimm keine versiegelten Pakete oder Artikel an, die du nicht selbst geprüft hast.';

  @override
  String get uiForYourSecurityPleaseUnlockThe =>
      'Bitte entsperre zu deiner Sicherheit die App, um fortzufahren.';

  @override
  String get uiFromGallery => 'Aus der Galerie';

  @override
  String get uiFromWizard => 'Aus dem Assistenten';

  @override
  String get uiFullName => 'Vollständiger Name';

  @override
  String get uiFullName2 => 'Vollständiger Name';

  @override
  String get uiFullNameOnTheAccount => 'Vollständiger Name auf dem Konto';

  @override
  String get uiFullNameOnTheBankAccount =>
      'Vollständiger Name auf dem Bankkonto';

  @override
  String get uiGbpPayoutsUseAUkSort =>
      'GBP-Auszahlungen verwenden eine britische Bankleitzahl (Sort Code) und Kontonummer.';

  @override
  String get uiGetInstantUpdatesAboutMessagesShipment =>
      'Erhalte sofortige Updates zu Nachrichten, Sendungen und Lieferfortschritt.';

  @override
  String get uiGetMatchedWithACarrierTogether =>
      'Gemeinsam mit einem Reisenden zusammengebracht werden';

  @override
  String get uiGiftItemsIsNotLiveYet =>
      '„Geschenke senden“ ist noch nicht verfügbar. Es kommt bald.';

  @override
  String get uiGoogleSignInCanBeUnreliable =>
      'Google-Anmeldung kann im iPhone-Simulator unzuverlässig sein. Falls sie hängt, nutze hier die E-Mail-Anmeldung und teste Google auf einem echten Gerät.';

  @override
  String get uiGotIt => 'Verstanden';

  @override
  String get uiGroupShipping => 'Gruppenversand';

  @override
  String get uiGroupShippingRequestCreatedShareWith =>
      'Gruppenversandanfrage erstellt! Teile sie mit deiner Gruppe.';

  @override
  String get uiHowItWorks => 'SO FUNKTIONIERT\'S';

  @override
  String get uiHandoverPin => 'Übergabe-PIN';

  @override
  String get uiHandoverConfirmedFundsReleased =>
      'Übergabe bestätigt! Betrag freigegeben.';

  @override
  String get uiHowCanWeHelp => 'Wie können wir helfen?';

  @override
  String get uiHowManyKgCanYouCarry => 'Wie viele kg kannst du mitnehmen?';

  @override
  String get uiHowWeUseIt => 'Wie wir sie nutzen';

  @override
  String get uiHowWouldYouLikeToSign => 'Wie möchtest du dich registrieren?';

  @override
  String get uiIReceivedMyPackage => 'Ich habe mein Paket erhalten';

  @override
  String get uiIAcceptResponsibilityForThisPackage =>
      'Ich übernehme die Verantwortung für dieses Paket ab der Abholung und verstehe, dass diese Vereinbarung elektronisch unterzeichnet und mit der Bestellung gespeichert wird.';

  @override
  String get uiIAcknowledgeThatMyPersonalData =>
      'Ich nehme zur Kenntnis, dass meine personenbezogenen Daten gemäß der Datenschutzrichtlinie verarbeitet werden.';

  @override
  String get uiIAgreeToFollowBagoS =>
      'Ich halte mich an die Richtlinien von Bago und übernehme die Verantwortung für meine Sendung.';

  @override
  String get uiIAgreeToThePlatformS =>
      'Ich stimme den Nutzungsbedingungen der Plattform Bago zu.';

  @override
  String get uiIAgreeStartVerification =>
      'Ich stimme zu – Verifizierung starten';

  @override
  String get uiIConfirmThatIAm18 =>
      'Ich bestätige, dass ich mindestens 18 Jahre alt bin.';

  @override
  String get uiIConfirmThatMyShipmentDoes =>
      'Ich bestätige, dass meine Sendung keine verbotenen Artikel enthält und den Artikelrichtlinien von Bago entspricht.';

  @override
  String get uiIConsentToTheCollectionAnd =>
      'Ich willige in die Erhebung und Verarbeitung meiner personenbezogenen Daten ein, wie beschrieben in der ';

  @override
  String get uiIHavePersonallyInspectedTheContents =>
      'Ich habe den Inhalt persönlich geprüft und bestätige, dass die Artikel der Lieferbeschreibung entsprechen.';

  @override
  String get uiIHaveReadAndAgreeTo => 'Ich habe gelesen und stimme zu: ';

  @override
  String get uiIUnderstandAndAgreeToAll =>
      'Ich verstehe alle Bedingungen und stimme ihnen zu';

  @override
  String get uiIUnderstandThatIMustNot =>
      'Ich verstehe, dass ich keine illegalen, gefährlichen, eingeschränkten, nicht angegebenen oder verdächtigen Artikel transportieren darf.';

  @override
  String get uiIUnderstandTheTravelerMayInspect =>
      'Ich verstehe, dass der Reisende den Inhalt aus Sicherheits- und Compliance-Gründen prüfen darf.';

  @override
  String get uiIWouldLikeToReceivePromotional =>
      'Ich möchte Werbeangebote und Neuigkeiten per E-Mail erhalten.';

  @override
  String get uiIban => 'IBAN *';

  @override
  String get uiIdVerified => 'ID\ngeprüft';

  @override
  String get uiIdentityVerificationRequired => 'Identitätsprüfung erforderlich';

  @override
  String get uiIdentityVerificationApproved => 'Identitätsprüfung bestätigt!';

  @override
  String get uiImageUnavailable => 'Bild nicht verfügbar';

  @override
  String get uiInEscrow => 'Treuhand';

  @override
  String get uiInbox => 'Posteingang';

  @override
  String get uiIndividual => 'Privatperson';

  @override
  String get uiInsufficientBalance => 'Unzureichendes Guthaben.';

  @override
  String get uiInsuranceIncluded => 'Versicherung inklusive';

  @override
  String get uiInsuredDelivery => 'Versicherte\nLieferung';

  @override
  String get uiInviteOthersWithTheSameDestination =>
      'Lade andere mit demselben Ziel ein';

  @override
  String get uiItemCategory => 'Artikelkategorie';

  @override
  String get uiItemDescription => 'Artikelbeschreibung';

  @override
  String get uiJohnDoe => 'Max Mustermann';

  @override
  String get uiJourneyMap => 'Reisekarte';

  @override
  String get uiKeep => 'Behalten';

  @override
  String get uiKeepTheSenderUpdatedOnThe =>
      'Halte den Absender über den Sendungsfortschritt auf dem Laufenden.';

  @override
  String get uiLinkedPayoutAccount => 'VERKNÜPFTES AUSZAHLUNGSKONTO';

  @override
  String get uiLocationInformation => 'STANDORTINFORMATIONEN';

  @override
  String get uiLastName => 'Nachname *';

  @override
  String get uiLastUpdatedJuly152026 => 'Zuletzt aktualisiert: 15. Juli 2026';

  @override
  String get uiLastUpdatedJuly172026 => 'Zuletzt aktualisiert: 17. Juli 2026';

  @override
  String get uiLinkBankAccount => 'Bankkonto verknüpfen';

  @override
  String get uiListTheItemsYouWantTo =>
      'Liste die Artikel auf, die du versenden möchtest...';

  @override
  String get uiLiveChat => 'Live-Chat';

  @override
  String get uiLiveChat2 => 'Live-Chat';

  @override
  String get uiLivenessCheck => 'Lebendigkeitsprüfung';

  @override
  String get uiLoadingMap => 'Karte wird geladen...';

  @override
  String get uiLocked => 'Gesperrt';

  @override
  String get uiLogout => 'Abmelden';

  @override
  String get uiMmDdYyyy => 'TT.MM.JJJJ';

  @override
  String get uiMyBio => 'MEINE BIO';

  @override
  String get uiMakeSureAllTextIsClearly =>
      'Achte darauf, dass der gesamte Text gut lesbar ist und nichts spiegelt.';

  @override
  String get uiManage => 'Verwalten';

  @override
  String get uiMarketingCommunications => 'Marketing-Mitteilungen';

  @override
  String get uiMembersWithABioAre3x =>
      'Mitglieder mit Bio werden 3x häufiger für Sendungen oder Reisen gebucht. Ein vollständiges Profil schafft Vertrauen in der Bago-Community.';

  @override
  String get uiMessage => 'Nachricht';

  @override
  String get uiMethod => 'Methode';

  @override
  String get uiMinimum => 'Minimum';

  @override
  String get uiMyShipmentDoesNotContainAny =>
      'Meine Sendung enthält keine verbotenen oder eingeschränkten Artikel.';

  @override
  String get uiNotificationSettings => 'BENACHRICHTIGUNGSEINSTELLUNGEN';

  @override
  String get uiNameAndDateOfBirthAre =>
      'Name und Geburtsdatum sind nach der KYC-Freigabe gesperrt.';

  @override
  String get uiNameMustBeAtLeast2 => 'Der Name muss mindestens 2 Zeichen haben';

  @override
  String get uiNewConversation => 'Neue Unterhaltung';

  @override
  String get uiNewShipment => 'Neue Sendung';

  @override
  String get uiNewShipmentRequest => 'Neue Sendungsanfrage';

  @override
  String get uiNewTicket => 'Neues Ticket';

  @override
  String get uiNoActiveConversationsYet => 'Noch keine aktiven Unterhaltungen';

  @override
  String get uiNoBanksFound => 'Keine Banken gefunden';

  @override
  String get uiNoCitiesFound => 'Keine Städte gefunden';

  @override
  String get uiNoHelpArticlesMatchedThatSearch =>
      'Keine Hilfeartikel passen zu dieser Suche';

  @override
  String get uiNoPayoutMethodLinked => 'Keine Auszahlungsmethode verknüpft';

  @override
  String get uiNoProhibitedItems => 'Keine verbotenen Artikel';

  @override
  String get uiNoRecentSearches => 'Keine letzten Suchen';

  @override
  String get uiNoReferredUsersYet => 'Noch keine geworbenen Nutzer.';

  @override
  String get uiNoSavedRoutesFound => 'Keine gespeicherten Routen gefunden.';

  @override
  String get uiNoServicesYetAddANamed =>
      'Noch keine Services. Füge einen benannten Tarif wie „Express“ oder „Standard“ hinzu – Absender sehen ihn überall in der App wie jede andere Reise bepreist.';

  @override
  String get uiNoTravelersYet => 'Noch keine Reisenden';

  @override
  String get uiNone => 'Keine';

  @override
  String get uiNotNow => 'Nicht jetzt';

  @override
  String get uiNoteForTravelerOptional => 'Notiz für den Reisenden (optional)';

  @override
  String get uiNoteToTraveler => 'Notiz an den Reisenden';

  @override
  String get uiNotesOptional => 'Notizen (optional)';

  @override
  String get uiOpen => 'Offen';

  @override
  String get uiOpenBoxInspectionRequired =>
      'Prüfung des geöffneten Pakets erforderlich';

  @override
  String get uiOpenChat => 'Chat öffnen';

  @override
  String get uiOpenSettings => 'Einstellungen öffnen';

  @override
  String get uiOpenInbox => 'Posteingang öffnen';

  @override
  String get uiOpenToInspection => 'Prüfung erlaubt';

  @override
  String get uiOpenWebSupport => 'Web-Support öffnen';

  @override
  String get uiOptional => 'Optional';

  @override
  String get uiOptionalPreferences => 'Optionale Einstellungen';

  @override
  String get uiOptionalHandlingInstructions =>
      'Optionale Hinweise zur Handhabung…';

  @override
  String get uiOptionalSkipIfYourIdHas =>
      'Optional – überspringen, wenn dein Ausweis keine Rückseite hat';

  @override
  String get uiOptional2 => 'Optional:';

  @override
  String get uiOriginCountry => 'Herkunftsland';

  @override
  String get uiOurTeamWillReviewYourIdentity =>
      'Unser Team prüft deine Ausweisdokumente innerhalb von 1–2 Werktagen. Du wirst benachrichtigt, sobald es erledigt ist.';

  @override
  String get uiPackageDeclaration => 'PAKETERKLÄRUNG';

  @override
  String get uiPersonalInformation => 'PERSÖNLICHE DATEN';

  @override
  String get uiPopularCities => 'BELIEBTE STÄDTE';

  @override
  String get uiProofOfCollectionRequired => 'ABHOLNACHWEIS ERFORDERLICH';

  @override
  String get uiPackage => 'Paket';

  @override
  String get uiPackageUnderReviewDoNotTransport =>
      'Paket in Prüfung\nTransportiere oder hole dieses Paket nicht ab, solange Bago die Nachweise prüft.';

  @override
  String get uiPasscode => 'Code';

  @override
  String get uiPasscodesDoNotMatch => 'Die Codes stimmen nicht überein.';

  @override
  String get uiPaymentAndConversionFees => 'Zahlungs- und Umrechnungsgebühren';

  @override
  String get uiPaymentDetailsAreProcessedByFlutterwave =>
      'Zahlungsdaten werden von Flutterwave verarbeitet. Bago speichert nur sichere Zahlungsreferenzen für Support, Erstattungen und Sendungsverfolgung.';

  @override
  String get uiPayoutCurrency => 'Auszahlungswährung';

  @override
  String get uiPayoutStatus => 'Auszahlungsstatus';

  @override
  String get uiPayoutStatusRefreshed => 'Auszahlungsstatus aktualisiert.';

  @override
  String get uiPayoutsReleaseAfterDeliveryIsComplete =>
      'Auszahlungen werden freigegeben, sobald die Lieferung abgeschlossen, bestätigt und verrechnet ist.';

  @override
  String get uiPersonalAccount => 'Privatkonto';

  @override
  String get uiPhoneNumberUpdated => 'Telefonnummer aktualisiert!';

  @override
  String get uiPhoneNumber => 'Telefonnummer';

  @override
  String get uiPhoneNumberChangesAreConfirmedWith =>
      'Änderungen der Telefonnummer werden mit einem Einmalcode per E-Mail bestätigt.';

  @override
  String get uiPickUpWhereYouLeftOff => 'Mach da weiter, wo du aufgehört hast';

  @override
  String get uiPickupAndDestinationCitiesMustBe =>
      'Abhol- und Zielstadt müssen unterschiedlich sein.';

  @override
  String get uiPleaseAcceptAllRequiredTerms =>
      'Bitte akzeptiere alle erforderlichen Bedingungen';

  @override
  String get uiPleaseAgreeToTheTermsAnd =>
      'Bitte stimme den Nutzungsbedingungen zu';

  @override
  String get uiPleaseConfirmYourLegalNameAnd =>
      'Bitte bestätige deinen vollständigen Namen und dein Geburtsdatum genau wie auf deinem Ausweis. Diese müssen für eine erfolgreiche Verifizierung übereinstimmen.';

  @override
  String get uiPleaseDescribeYourIssue => 'Bitte beschreibe dein Problem';

  @override
  String get uiPleaseEnterAValid10Digit =>
      'Bitte gib eine gültige 10-stellige Kontonummer ein';

  @override
  String get uiPleaseEnterAValidIban => 'Bitte gib eine gültige IBAN ein.';

  @override
  String get uiPleaseEnterAValidOtp => 'Bitte gib einen gültigen Code ein';

  @override
  String get uiPleaseEnterAValidAccountNumber =>
      'Bitte gib eine gültige Kontonummer ein.';

  @override
  String get uiPleaseEnterAValidAmount =>
      'Bitte gib einen gültigen Betrag ein.';

  @override
  String get uiPleaseEnterThe6DigitCode => 'Bitte gib den 6-stelligen Code ein';

  @override
  String get uiPleaseEnterThe6DigitCode2 =>
      'Bitte gib den 6-stelligen Code ein.';

  @override
  String get uiPleaseEnterTheSwiftBicCode =>
      'Bitte gib den SWIFT/BIC-Code ein.';

  @override
  String get uiPleaseEnterTheAccountHolderName =>
      'Bitte gib den Namen des Kontoinhabers ein.';

  @override
  String get uiPleaseEnterYourDateOfBirth => 'Bitte gib dein Geburtsdatum ein';

  @override
  String get uiPleaseEnterYourFirstAndLast =>
      'Bitte gib deinen Vor- und Nachnamen ein';

  @override
  String get uiPleaseEnterYourFullName =>
      'Bitte gib deinen vollständigen Namen ein';

  @override
  String get uiPleaseEnterYourNameSoWe =>
      'Bitte gib deinen Namen ein, damit wir wissen, wie wir dich ansprechen sollen.';

  @override
  String get uiPleaseEnterYourPhoneNumber =>
      'Bitte gib deine Telefonnummer ein';

  @override
  String get uiPleaseEnterYourRealNameSo =>
      'Bitte gib deinen echten Namen ein, damit andere wissen, mit wem sie es zu tun haben.';

  @override
  String get uiPleaseFillAllRequiredFields =>
      'Bitte fülle alle Pflichtfelder aus';

  @override
  String get uiPleaseFillInAllReceiverDetails =>
      'Bitte gib alle Empfängerdaten ein.';

  @override
  String get uiPleaseFillInTheRequiredFields =>
      'Bitte fülle die Pflichtfelder aus';

  @override
  String get uiPleaseFillInYourAddressStreet =>
      'Bitte gib deine Adresse ein (Straße, Stadt, Postleitzahl und Land).';

  @override
  String get uiPleaseLinkABankAccountBefore =>
      'Bitte verknüpfe vor der Auszahlung ein Bankkonto.';

  @override
  String get uiPleaseReadAndConfirmEachStatement =>
      'Bitte lies und bestätige jede Aussage, bevor du deine Sendung abschickst.';

  @override
  String get uiPleaseReadTheseTermsOfService =>
      'Bitte lies diese Nutzungsbedingungen sorgfältig, bevor du Bago nutzt. Sie regeln die Nutzung unserer Plattform und Dienste.';

  @override
  String get uiPleaseReviewOurPolicies => 'Bitte lies\nunsere Richtlinien';

  @override
  String get uiPleaseSelectABank => 'Bitte wähle eine Bank';

  @override
  String get uiPleaseSelectABankAndEnter =>
      'Bitte wähle eine Bank und gib die Kontonummer ein.';

  @override
  String get uiPleaseSelectARole => 'Bitte wähle eine Rolle';

  @override
  String get uiPleaseSelectAnAuthenticationMethod =>
      'Bitte wähle eine Anmeldemethode';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn =>
      'Bitte lege vor dem Fortfahren deine bevorzugte Währung in den Profileinstellungen fest.';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn2 =>
      'Bitte lege deine bevorzugte Währung in den Profileinstellungen fest, bevor du einen Versand anfragst.';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn3 =>
      'Bitte lege vor der Auszahlung deine bevorzugte Währung in den Profileinstellungen fest.';

  @override
  String get uiPleaseVerifyYourPhoneNumberBefore =>
      'Bitte bestätige deine Telefonnummer, bevor du eine Reise veröffentlichst.';

  @override
  String get uiPleaseWaitForAccountVerification =>
      'Bitte warte auf die Kontoverifizierung';

  @override
  String get uiPoolYourShipmentWithOthersGoing =>
      'Bündle deine Sendung mit anderen zum selben Ziel, um Kosten zu teilen und günstigere Preise zu erhalten.';

  @override
  String get uiPostTrip => 'Reise posten';

  @override
  String get uiPostalCode => 'Postleitzahl *';

  @override
  String get uiPressAndHoldThisDraftTo =>
      'Halte diesen Entwurf gedrückt, um ihn zu löschen';

  @override
  String get uiPricePerKg => 'Preis pro kg';

  @override
  String get uiPrivacyConsent => 'Datenschutz & Einwilligung';

  @override
  String get uiPrivacyPolicy => 'Datenschutzrichtlinie *';

  @override
  String get uiProcessingYourVerification =>
      'Deine Verifizierung wird verarbeitet…';

  @override
  String get uiProfilePhotoUpdated => 'Profilfoto aktualisiert';

  @override
  String get uiProfileUpdatedSuccessfully => 'Profil erfolgreich aktualisiert';

  @override
  String get uiProhibitedItems => 'Verbotene Artikel';

  @override
  String get uiProof => 'Nachweis';

  @override
  String get uiProofOfTrip => 'Reisenachweis';

  @override
  String get uiProtectMyItem => 'Artikel versichern';

  @override
  String get uiProtectedByBankGradeEncryption =>
      'Geschützt durch Verschlüsselung auf Bankniveau';

  @override
  String get uiPublish => 'Veröffentlichen';

  @override
  String get uiPushNotifications => 'Push-Benachrichtigungen';

  @override
  String get uiQualifiedShipment => 'Qualifizierte Sendung';

  @override
  String get uiQuickUnlockAfterInactivity =>
      'Schnell entsperren nach Inaktivität';

  @override
  String get uiRateThisShipmentExperienceAndAdd =>
      'Bewerte diese Sendung und füge einen kurzen Kommentar hinzu.';

  @override
  String get uiReEnterPasscode => 'Code erneut eingeben';

  @override
  String get uiReadyToWithdraw => 'Auszahlbar';

  @override
  String get uiReadyToWithdrawHeldInEscrow => 'Auszahlbar + in Treuhand';

  @override
  String get uiRealTimeTracking => 'Echtzeit-\nTracking';

  @override
  String get uiReason => 'Grund';

  @override
  String get uiReceiverDetails => 'Empfängerdaten';

  @override
  String get uiRecentSearches => 'Letzte Suchen';

  @override
  String get uiReferralEarnings => 'Prämien aus Empfehlungen';

  @override
  String get uiReferrals => 'Empfehlungen';

  @override
  String get uiReferredUsers => 'Geworbene Nutzer';

  @override
  String get uiRefresh => 'Aktualisieren';

  @override
  String get uiRefreshWallet => 'Wallet aktualisieren';

  @override
  String get uiReject => 'Ablehnen';

  @override
  String get uiRejectPackage => 'Paket ablehnen';

  @override
  String get uiRejectionReasonIfRejecting => 'Ablehnungsgrund (bei Ablehnung)';

  @override
  String get uiRemaining => 'Verbleibend';

  @override
  String get uiRemove => 'Entfernen';

  @override
  String get uiRemoveAppPasscode => 'App-Code entfernen';

  @override
  String get uiRemoveFromHistory => 'Aus dem Verlauf entfernen?';

  @override
  String get uiRemoveService => 'Service entfernen';

  @override
  String get uiReplyToSupport => 'Dem Support antworten…';

  @override
  String get uiReportIssue => 'Problem melden';

  @override
  String get uiReportShipment => 'Sendung melden';

  @override
  String get uiRequestShipment => 'Versand anfragen';

  @override
  String get uiRequestACurrencyChange => 'Währungsänderung beantragen';

  @override
  String get uiRequestAccepted => 'Anfrage angenommen';

  @override
  String get uiRequestAccepted2 => 'Anfrage angenommen!';

  @override
  String get uiRequestDeclined => 'Anfrage abgelehnt';

  @override
  String get uiRequestDeclined2 => 'Anfrage abgelehnt.';

  @override
  String get uiRequestNotFound => 'Anfrage nicht gefunden';

  @override
  String get uiRequestSentSupportWillUpdateYou =>
      'Anfrage gesendet. Der Support informiert dich in deinen Tickets.';

  @override
  String get uiRequestsWillAppearHereWhenSenders =>
      'Anfragen erscheinen hier, wenn Absender dich bitten, ein Paket mitzunehmen.';

  @override
  String get uiRequiredAgreements => 'Erforderliche Vereinbarungen';

  @override
  String get uiRequiredAgreements2 => 'Erforderliche Vereinbarungen:';

  @override
  String get uiRequiredByOurPayoutProviderTo =>
      'Von unserem Auszahlungsanbieter zur Prüfung von EUR/GBP-Überweisungen erforderlich.';

  @override
  String get uiReserved => 'Reserviert';

  @override
  String get uiRetake => 'Neu aufnehmen';

  @override
  String get uiReviewYourTrip => 'Reise überprüfen';

  @override
  String get uiReviewPackageRequestsFromSendersWaiting =>
      'Prüfe Paketanfragen von Absendern, die auf deine Reise warten.';

  @override
  String get uiReviewYourShipmentDetailsAndConfirm =>
      'Prüfe deine Sendungsdaten und bestätige, dass dein Artikel sicher versendet werden kann.';

  @override
  String get uiRewardRules => 'Prämienregeln';

  @override
  String get uiRouteDeleted => 'Route gelöscht';

  @override
  String get uiRoutingNumberUsBanks => 'Routingnummer (US-Banken)';

  @override
  String get uiStillNeedHelp => 'NOCH FRAGEN?';

  @override
  String get uiSubject => 'BETREFF';

  @override
  String get uiSwiftBicBanksOutsideTheUs =>
      'SWIFT / BIC (Banken außerhalb der USA)';

  @override
  String get uiSwiftBic => 'SWIFT/BIC';

  @override
  String get uiSwiftBic2 => 'SWIFT/BIC *';

  @override
  String get uiSafetyCheck => 'Sicherheitsprüfung';

  @override
  String get uiSave => 'Speichern';

  @override
  String get uiSaveBankAccount => 'Bankkonto speichern';

  @override
  String get uiSearchAgain => 'Erneut suchen';

  @override
  String get uiSearchTravelers => 'Reisende suchen';

  @override
  String get uiSearchBank => 'Bank suchen...';

  @override
  String get uiSearchBanks => 'Banken suchen...';

  @override
  String get uiSearchChatsNamesOrRoutes => 'Chats, Namen oder Routen suchen';

  @override
  String get uiSearchCity => 'Stadt suchen';

  @override
  String get uiSearchCityAndCountry => 'Stadt und Land suchen';

  @override
  String get uiSearchConversations => 'Unterhaltungen suchen';

  @override
  String get uiSearchCountry => 'Land suchen';

  @override
  String get uiSearchCountryOrCurrency => 'Land oder Währung suchen';

  @override
  String get uiSearchCountryOrDialCode => 'Land oder Vorwahl suchen…';

  @override
  String get uiSearchCountry2 => 'Land suchen…';

  @override
  String get uiSearchForACityOrAirport => 'Nach Stadt oder Flughafen suchen';

  @override
  String get uiSearchForACityOrCountry => 'Nach Stadt oder Land suchen';

  @override
  String get uiSecureCheckout => 'Sicherer Checkout';

  @override
  String get uiSeeAll => 'Alle anzeigen';

  @override
  String get uiSeeEveryThread => 'Alle Unterhaltungen ansehen';

  @override
  String get uiSelectBank => 'Bank auswählen';

  @override
  String get uiSelectBank2 => 'Bank auswählen *';

  @override
  String get uiSelectARejectionReason => 'Wähle einen Ablehnungsgrund.';

  @override
  String get uiSelectEveryItemContainedInThe =>
      'Wähle jeden Artikel aus, der im Paket enthalten ist.';

  @override
  String get uiSelectTheCountryThatIssuedThe =>
      'Wähle das Land, das deinen Ausweis ausgestellt hat – davon hängt ab, welche Dokumente die Verifizierung akzeptiert.';

  @override
  String get uiSelectYourIdType => 'Wähle deine Ausweisart';

  @override
  String get uiSelected => 'Ausgewählt';

  @override
  String get uiSendCode => 'Code senden';

  @override
  String get uiSendAGift => 'Geschenk senden';

  @override
  String get uiSendAPackageWithATraveler =>
      'Ein Paket mit einem Reisenden senden';

  @override
  String get uiSendKgRequest => 'kg-Anfrage senden';

  @override
  String get uiSendPackage => 'Paket senden';

  @override
  String get uiSendRequest => 'Anfrage senden';

  @override
  String get uiSendersWillSeeYourAvailableKg =>
      'Absender sehen deine verfügbaren kg und werden entsprechend vermittelt.';

  @override
  String get uiServiceName => 'Name des Service';

  @override
  String get uiServiceRemoved => 'Service entfernt';

  @override
  String get uiSetAnAppPasscodeOrEnable =>
      'Lege zuerst einen App-Code fest oder aktiviere Biometrie, bevor du das schnelle Entsperren einschaltest.';

  @override
  String get uiSetCountryCurrency => 'Land & Währung festlegen';

  @override
  String get uiSetUpWithdrawals => 'Auszahlungen\neinrichten';

  @override
  String get uiSetUpAccount => 'Konto einrichten';

  @override
  String get uiSetUpPayoutMethod => 'Auszahlungsmethode einrichten →';

  @override
  String get uiSetYourCountryAndCurrencyFirst =>
      'Lege zuerst Land und Währung fest – das dauert nur einen Moment.';

  @override
  String get uiSetYourCountryOfResidenceBefore =>
      'Lege vor dem Bezahlen dein Wohnsitzland fest. Deine Zahlungswährung richtet sich nach diesem Land.';

  @override
  String get uiSetYourRateCompetitivePricingAttracts =>
      'Lege deinen Preis fest. Wettbewerbsfähige Preise ziehen mehr Absender an.';

  @override
  String get uiShareHowTheShipmentWentSo =>
      'Erzähle, wie die Sendung lief, damit andere bessere Entscheidungen treffen können.';

  @override
  String get uiShareTheShippingCostSaveUp =>
      'Teile die Versandkosten – spare bis zu 60 %';

  @override
  String get uiShareThisPinWithTheTraveler =>
      'Teile diese PIN mit dem Reisenden, um die Übergabe zu bestätigen.';

  @override
  String get uiShareTrip => 'Reise teilen';

  @override
  String get uiShareWhatWentWellOrWhat =>
      'Teile, was gut lief oder was besser sein könnte...';

  @override
  String get uiShipmentRequest => 'Sendungsanfrage';

  @override
  String get uiShipmentSummary => 'Sendungsübersicht';

  @override
  String get uiShipmentHasBeenDeliveredWaitingFor =>
      'Die Sendung wurde zugestellt. Warten auf Bestätigung des Absenders.';

  @override
  String get uiShipmentReportedSupportCanNowReview =>
      'Sendung gemeldet. Der Support kann jetzt den Chatverlauf prüfen.';

  @override
  String get uiShipmentStarted => 'Sendung gestartet';

  @override
  String get uiShippingFee => 'Versandgebühr';

  @override
  String get uiShipsToAnyDestination => 'Versendet an jedes Ziel';

  @override
  String get uiSignIn => 'Anmelden';

  @override
  String get uiSignInToContinue => 'Melde dich an, um fortzufahren';

  @override
  String get uiSimulatorCode => 'Simulator-Code';

  @override
  String get uiSinceYouSignedUpWithGoogle =>
      'Da du dich mit Google/Apple registriert hast, müssen wir deine Telefonnummer prüfen, bevor du eine Sendung aufgeben kannst.';

  @override
  String get uiSkipBackPhoto => 'Rückseitenfoto überspringen';

  @override
  String get uiSkipForNow => 'Vorerst überspringen';

  @override
  String get uiSold => 'Verkauft';

  @override
  String get uiSomethingWentWrongPleaseTryAgain =>
      'Etwas ist schiefgelaufen. Bitte versuche es erneut.';

  @override
  String get uiSortCode => 'Sort Code *';

  @override
  String get uiStartAConversationAnyTimeAnd =>
      'Starte jederzeit eine Unterhaltung und behalte den gesamten Verlauf an einem Ort.';

  @override
  String get uiStartALiveChatAndYour =>
      'Starte einen Live-Chat – deine Nachrichten erscheinen hier wie in einem gemeinsamen Support-Postfach.';

  @override
  String get uiStartConversation => 'Unterhaltung starten';

  @override
  String get uiStartingVerification => 'Verifizierung wird gestartet…';

  @override
  String get uiStateRegion => 'Bundesland / Region';

  @override
  String get uiStatusUpdated => 'Status aktualisiert!';

  @override
  String get uiStatus => 'Status:';

  @override
  String get uiStreetAddress => 'Straße und Hausnummer';

  @override
  String get uiSubmissionFailedPleaseTryAgain =>
      'Senden fehlgeschlagen. Bitte versuche es erneut.';

  @override
  String get uiSubmitForReview => 'Zur Prüfung einreichen';

  @override
  String get uiSupport => 'Support';

  @override
  String get uiSupportChatIsTemporarilyUnavailablePlease =>
      'Der Support-Chat ist vorübergehend nicht verfügbar.\nBitte schreibe an support@sendwithbago.com';

  @override
  String get uiSupportInbox => 'Support-Postfach';

  @override
  String get uiSupportRepliesAroundTheClock =>
      'Der Support antwortet rund um die Uhr';

  @override
  String get uiSupportThatFeelsLikeAConversation =>
      'Support, der sich wie ein Gespräch anfühlt';

  @override
  String get uiSupportingExplanation => 'Erläuterung';

  @override
  String get uiSwapCities => 'Städte tauschen';

  @override
  String get uiSystemAlerts => 'Systemmeldungen';

  @override
  String get uiTakePhoto => 'Foto aufnehmen';

  @override
  String get uiTakeAClearPhotoOfThe =>
      'Mach ein deutliches Foto der Rückseite.';

  @override
  String get uiTakePhoto2 => 'Foto aufnehmen';

  @override
  String get uiTalkToSupportNow => 'Jetzt mit dem Support sprechen';

  @override
  String get uiTapToAddPhoto => 'Tippen, um ein Foto hinzuzufügen';

  @override
  String get uiTapToCopyThisTestCode =>
      'Tippe, um diesen Testcode zu kopieren, falls die E-Mail nicht ankommt.';

  @override
  String get uiTapToReRecord => 'Tippen, um neu aufzunehmen';

  @override
  String get uiTellUsThePickupAndDelivery =>
      'Nenne uns Abhol- und Lieferort deiner Sendung.';

  @override
  String get uiTermsConditions => 'Allgemeine Geschäftsbedingungen';

  @override
  String get uiTermsOfService => 'Nutzungsbedingungen *';

  @override
  String get uiThanksForSharingYourFeedbackIt =>
      'Danke für dein Feedback. Es hilft anderen, dem Marktplatz zu vertrauen.';

  @override
  String get uiThatPasscodeIsNotCorrect => 'Dieser Code ist nicht korrekt.';

  @override
  String get uiThePackageIsNowInTransit => 'Das Paket ist jetzt unterwegs.';

  @override
  String get uiTheRequestDetailsAreNotAvailable =>
      'Die Anfragedetails sind derzeit nicht verfügbar. Bitte aktualisiere und versuche es erneut.';

  @override
  String get uiTheTravelerHasMarkedThisPackage =>
      'Der Reisende hat dieses Paket als zugestellt markiert. Bitte bestätige den Erhalt, um die Zahlung freizugeben.';

  @override
  String get uiTheTravelerMarkedThisShipmentAs =>
      'Der Reisende hat diese Sendung als zugestellt markiert. Bestätige hier den Erhalt, um die Zahlung freizugeben.';

  @override
  String get uiTheTravellerMustBeAllowedTo =>
      'Der Reisende muss das Paket prüfen dürfen.';

  @override
  String get uiThisAddsWeightToTheActive =>
      'Dadurch wird der aktiven Sendung in diesem Chat Gewicht hinzugefügt. Die Empfängerdaten bleiben gleich.';

  @override
  String get uiThisBecomesYourWalletDisplayAnd =>
      'Dies wird deine Anzeige- und Auszahlungswährung in der Wallet.';

  @override
  String get uiThisCategoryRequiresExtraCareYour =>
      'Diese Kategorie erfordert besondere Sorgfalt. Dein Reisender fragt eventuell nach weiteren Details.';

  @override
  String get uiThisConversationHasBeenClosedStart =>
      'Diese Unterhaltung wurde geschlossen. Eröffne ein neues Ticket, wenn du weiter Hilfe brauchst.';

  @override
  String get uiThisDeterminesWhichDocumentTypesThe =>
      'Davon hängt ab, welche Dokumentarten dir die Verifizierung anzeigt.';

  @override
  String get uiThisIsASecureProcessThat =>
      'Dies ist ein sicherer Vorgang, der nur wenige Minuten dauert. Wir prüfen deine Identität und aktivieren dein Konto.';

  @override
  String get uiThisShipmentChatIsClosedPlease =>
      'Dieser Sendungschat ist geschlossen. Bitte wende dich an den Support oder eröffne bei Bedarf einen Streitfall.';

  @override
  String get uiThisWillPermanentlyRemoveThisItem =>
      'Dadurch wird dieser Eintrag dauerhaft aus deinem Verlauf entfernt.';

  @override
  String get uiThisWillRemoveThisDraftShipment =>
      'Dieser Sendungsentwurf wird sofort entfernt. Du kannst jederzeit neu beginnen.';

  @override
  String get uiThisWillRemoveYourSavedShipment =>
      'Dein gespeicherter Sendungsentwurf wird entfernt. Du musst neu beginnen, wenn du dieses Paket senden willst.';

  @override
  String get uiThisWillRemoveYourSavedShipment2 =>
      'Dein gespeicherter Sendungsentwurf wird entfernt. Du musst neu beginnen.';

  @override
  String get uiTicketNotFound => 'Ticket nicht gefunden';

  @override
  String get uiTicketSubmittedWeLlGetBack =>
      'Ticket gesendet! Wir melden uns bald.';

  @override
  String get uiTicketsAndChatInOneFlow => 'Tickets und Chat in einem Ablauf';

  @override
  String get uiTime => 'Uhrzeit';

  @override
  String get uiToGetYourShipmentPayoutsTell =>
      'Damit du deine Auszahlungen erhältst, sag uns, wohin Bago das Geld senden soll.';

  @override
  String get uiToUnlockAllFeaturesPleaseComplete =>
      'Schließe die Identitätsprüfung ab, um alle Funktionen freizuschalten.';

  @override
  String get uiToVerifyYourIdentityWeCollect =>
      'Zur Identitätsprüfung erheben und verarbeiten wir deine personenbezogenen Daten, einschließlich amtlicher Ausweisdokumente und biometrischer Daten. Dies ist gesetzlich und nach unseren Plattformbedingungen erforderlich.';

  @override
  String get uiTotal => 'Gesamt';

  @override
  String get uiTotalSpace => 'Gesamtplatz';

  @override
  String get uiTotalWallet => 'Gesamte Wallet';

  @override
  String get uiTrackingNumber => 'Sendungsnummer';

  @override
  String get uiTravelDate => 'Reisedatum';

  @override
  String get uiTravelType => 'Reiseart';

  @override
  String get uiTraveller => 'Reisender';

  @override
  String get uiTripNumber => 'Reisenummer';

  @override
  String get uiTryAgain => 'Erneut versuchen';

  @override
  String get uiTryADifferentKeywordOrStart =>
      'Versuche ein anderes Stichwort oder starte eine Support-Unterhaltung, damit das Team direkt helfen kann.';

  @override
  String get uiTryAgain2 => 'Erneut versuchen';

  @override
  String get uiTypeAMessage => 'Nachricht schreiben...';

  @override
  String get uiTypeCityOrCountry => 'Stadt oder Land eingeben';

  @override
  String get uiUkBankAccount => 'UK-BANKKONTO';

  @override
  String get uiUkAccountNumbersMustContain8 =>
      'UK-Kontonummern müssen 8 Ziffern haben.';

  @override
  String get uiUkSortCodesMustContain6 =>
      'UK-Sort-Codes müssen 6 Ziffern haben.';

  @override
  String get uiUsdBankAccount => 'USD-BANKKONTO';

  @override
  String get uiUnableToLoadMessages =>
      'Nachrichten konnten nicht geladen werden';

  @override
  String get uiUnderReviewSendersCannotSeeThis =>
      'In Prüfung – Absender sehen diese Reise noch nicht. Wir aktivieren sie nach der Freigabe.';

  @override
  String get uiUnlimitedCapacity => 'Unbegrenzte Kapazität';

  @override
  String get uiUnlockBago => 'Bago entsperren';

  @override
  String get uiUnlockWithPasscode => 'Mit Code entsperren';

  @override
  String get uiUnverified => 'Nicht verifiziert';

  @override
  String get uiUpdateStatus => 'Status aktualisieren';

  @override
  String get uiUploadingDocuments => 'Dokumente werden hochgeladen…';

  @override
  String get uiUseA4To8Digit => 'Verwende einen 4- bis 8-stelligen App-Code.';

  @override
  String get uiUseSecureCheckoutToPayBy =>
      'Nutze den sicheren Checkout, um per Karte, Apple Pay, Banküberweisung oder Mobile Money zu zahlen.';

  @override
  String get uiUsuallyRepliesInMinutes =>
      'Antwortet meist innerhalb von Minuten';

  @override
  String get uiValue => 'Wert';

  @override
  String get uiVerificationCodeSentViaSms =>
      'Bestätigungscode per SMS gesendet.';

  @override
  String get uiVerifyEmail => 'E-Mail bestätigen';

  @override
  String get uiVerifyIdentity => 'Identität bestätigen';

  @override
  String get uiVerifyPhone => 'Telefon bestätigen';

  @override
  String get uiVerifyPhoneNumber => 'Telefonnummer bestätigen';

  @override
  String get uiVerifyYourEmailFirst => 'Bestätige zuerst deine E-Mail';

  @override
  String get uiVerifyYourPhoneNumber => 'Bestätige deine Telefonnummer';

  @override
  String get uiView => 'Ansehen';

  @override
  String get uiViewDetails => 'Details ansehen';

  @override
  String get uiViewImage => 'Bild ansehen';

  @override
  String get uiViewShipmentDetails => 'Sendungsdetails ansehen';

  @override
  String get uiVisaMastercardAmex => 'Visa, Mastercard, Amex';

  @override
  String get uiWhatWouldYouLikeMembersTo =>
      'WAS SOLLEN MITGLIEDER ÜBER DICH WISSEN?';

  @override
  String get uiWaitingForAnAgent => 'Warten auf einen Mitarbeiter';

  @override
  String get uiWeLlReviewYourDocumentsWithin =>
      'Wir prüfen deine Dokumente innerhalb von 1–2 Werktagen und informieren dich über das Ergebnis.';

  @override
  String get uiWeVeSentA6Digit =>
      'Wir haben einen 6-stelligen Code gesendet an ';

  @override
  String get uiWeightKg => 'Gewicht (kg)*';

  @override
  String get uiWhatAreYouSending => 'Was versendest du?';

  @override
  String get uiWhatHappensNext => 'Wie geht es weiter?';

  @override
  String get uiWhatIsInside => 'Was ist drin?';

  @override
  String get uiWhatWeCollect => 'Was wir erheben';

  @override
  String get uiWhatWouldYouLikeToDo => 'Was möchtest du tun?';

  @override
  String get uiWhatSYourDateOfBirth => 'Wann ist dein\nGeburtstag?';

  @override
  String get uiWhatSYourFullName => 'Wie lautet dein\nvollständiger Name?';

  @override
  String get uiWhatSYourRole => 'Was ist deine\nRolle?';

  @override
  String get uiWhenAreYouTravelling => 'Wann reist du?';

  @override
  String get uiWhenDoesYourJourneyBegin => 'Wann beginnt deine Reise?';

  @override
  String get uiWhereAreYouSending => 'Wohin versendest du?';

  @override
  String get uiWhichCountryIssuedYourId =>
      'Welches Land hat deinen Ausweis ausgestellt?';

  @override
  String get uiWhoReceivesThis => 'Wer erhält das?';

  @override
  String get uiWhyABio => 'Warum eine Bio?';

  @override
  String get uiWhyDoYouNeedToChange =>
      'Warum musst du sie ändern? (z. B. Umzug in ein anderes Land)';

  @override
  String get uiWithdrawEarnings => 'Einnahmen auszahlen';

  @override
  String get uiWithdrawFunds => 'Geld auszahlen';

  @override
  String get uiWithdrawAll => 'Alles auszahlen';

  @override
  String get uiWithdrawalRequest => 'Auszahlungsanfrage';

  @override
  String get uiWithdrawalSubmitted => 'Auszahlung eingereicht';

  @override
  String get uiWithdrawalCouldNotBeSubmittedPlease =>
      'Die Auszahlung konnte nicht eingereicht werden. Bitte versuche es erneut.';

  @override
  String get uiWrappedOrSealedPackagesAreNot =>
      'Verpackte oder versiegelte Pakete werden nicht abgelehnt, müssen aber vor der Abholung geprüft werden.';

  @override
  String get uiWriteAShortBioAboutYourself =>
      'Schreibe eine kurze Bio über dich...';

  @override
  String get uiYyyyMmDd => 'JJJJ-MM-TT';

  @override
  String get uiYouCanChangeThisLater => 'Du kannst das später ändern';

  @override
  String get uiYouCanTrackTheStatusIn =>
      'Den Status findest du in deinem Transaktionsverlauf.';

  @override
  String get uiYourDetails => 'Deine Angaben';

  @override
  String get uiYourPrivacyRights => 'Deine Datenschutzrechte';

  @override
  String get uiYourUsdAccountNumber => 'Deine USD-Kontonummer';

  @override
  String get uiYourAccountDoesnTHavePermission =>
      'Dein Konto darf keine Auszahlungen vornehmen. Bitte den Inhaber des Unternehmens, dies zu aktivieren.';

  @override
  String get uiYourAccountHasBeenSuspendedDue =>
      'Dein Konto wurde wegen eines Verstoßes gegen unsere Nutzungsbedingungen gesperrt.';

  @override
  String get uiYourBankDetailsAreEncryptedAnd =>
      'Deine Bankdaten werden verschlüsselt und sicher gespeichert. Sie werden ausschließlich für Auszahlungen an Reisende verwendet.';

  @override
  String get uiYourDataIsProcessedSecurelyAnd =>
      'Deine Daten werden sicher verarbeitet und ohne deine Zustimmung nicht an Dritte weitergegeben.';

  @override
  String get uiYourDataIsProcessedSolelyTo =>
      'Deine Daten werden ausschließlich zur Identitätsprüfung und zur Einhaltung der Vorschriften zur Geldwäschebekämpfung (AML) und KYC verarbeitet. Sie werden nicht an Dritte verkauft.';

  @override
  String get uiYourEarningAndPayoutCurrencyIs =>
      'Deine Einnahme- und Auszahlungswährung ist gesperrt. Um sie zu ändern, sende unten eine Änderungsanfrage oder chatte mit dem Support.';

  @override
  String get uiYourEarnings => 'Deine Einnahmen';

  @override
  String get uiYourIssue => 'Dein Anliegen:';

  @override
  String get uiYourItemsWeight => 'Gewicht deiner Artikel';

  @override
  String get uiYourMessagesWithBagoSupport =>
      'Deine Nachrichten mit dem Bago-Support';

  @override
  String get uiYourPhoneNumberHasBeenSuccessfully =>
      'Deine Telefonnummer wurde erfolgreich bestätigt und in deinem Konto aktualisiert.';

  @override
  String get uiYourPrivacyMattersToUsThis =>
      'Deine Privatsphäre ist uns wichtig. Diese Datenschutzrichtlinie erklärt, wie Bago deine personenbezogenen Daten erhebt, nutzt und schützt.';

  @override
  String get uiEGLagosFriendsGroup => 'z. B. „Lagos Freundesgruppe“';

  @override
  String get uiEGAcmeLogisticsLtd => 'z. B. Acme Logistics GmbH';

  @override
  String get uiEGBago12345678 => 'z. B. BAGO-12345678';

  @override
  String get uiEGBarclaysLloydsMonzo => 'z. B. Barclays, Lloyds, Monzo';

  @override
  String get uiEGBerlin => 'z. B. Berlin';

  @override
  String get uiEGChasus33 => 'z. B. CHASUS33';

  @override
  String get uiEGChaseBankOfAmerica => 'z. B. Chase, Bank of America, Wise';

  @override
  String get uiEGDoe => 'z. B. Mustermann';

  @override
  String get uiEGExpressStandard => 'z. B. Express, Standard';

  @override
  String get uiEGJohn => 'z. B. Max';

  @override
  String get uiEGLt12345678901234 => 'z. B. LT12 3456 7890 1234 5678';

  @override
  String get uiEGLagosAccra => 'z. B. Lagos, Accra';

  @override
  String get uiEGRevolt21 => 'z. B. REVOLT21';

  @override
  String get uiEGRevolutN26Wise => 'z. B. Revolut, N26, Wise';

  @override
  String get uiEGUnitedStates => 'z. B. Vereinigte Staaten';

  @override
  String get uiKg => 'kg';

  @override
  String get uiOr => 'oder';

  @override
  String get uiTyping => 'schreibt…';

  @override
  String uiFUse(Object p0) {
    return '$p0 verwenden';
  }

  @override
  String uiFWalletCurrencySetTo(Object p0) {
    return 'Wallet-Währung auf $p0 gesetzt.';
  }

  @override
  String uiFWeSentADigitVerificationCode(Object p0) {
    return 'Wir haben einen 6-stelligen Bestätigungscode an $p0 gesendet. Gib ihn im nächsten Schritt ein, um ein neues Passwort festzulegen.';
  }

  @override
  String uiFOtpSentTo(Object p0) {
    return 'Code an $p0 gesendet';
  }

  @override
  String uiFEnterTheOtpSentTo(Object p0) {
    return 'Gib den Code ein,\nder an $p0 gesendet wurde';
  }

  @override
  String uiFResendCodeInS(Object p0) {
    return 'Code erneut senden in $p0 s';
  }

  @override
  String uiFANewVerificationCodeWasSent(Object p0) {
    return 'Ein neuer Bestätigungscode wurde an $p0 gesendet.';
  }

  @override
  String uiFHeldInEscrow(Object p0, Object p1) {
    return '$p0 $p1 in Treuhand';
  }

  @override
  String uiFShipmentProgressStepOf(Object p0) {
    return 'Sendungsfortschritt, Schritt $p0 von 4';
  }

  @override
  String uiFFrontOf(Object p0) {
    return 'Vorderseite: $p0';
  }

  @override
  String uiFBackOf(Object p0) {
    return 'Rückseite: $p0';
  }

  @override
  String uiFTracking(Object p0) {
    return 'Sendungsnummer: $p0';
  }

  @override
  String uiFShipmentNeedHelpContactSupportOr(Object p0) {
    return 'Sendung $p0. Brauchst du Hilfe? Kontaktiere den Support oder melde ein Problem.';
  }

  @override
  String uiFChargedIn(Object p0) {
    return 'Abgerechnet in $p0';
  }

  @override
  String uiFUnableToLoadBanksRightNow(Object p0) {
    return 'Banken können gerade nicht geladen werden: $p0';
  }

  @override
  String uiFWithdrawalsArePaidByTheBago(Object p0) {
    return '$p0-Auszahlungen werden vom Bago-Finanzteam per Banküberweisung ausgezahlt, meist innerhalb von 1–3 Werktagen. Du erhältst bei jedem Schritt eine E-Mail und eine Benachrichtigung.';
  }

  @override
  String uiFWeSentADigitCodeTo(Object p0, Object p1) {
    return 'Wir haben per SMS einen 6-stelligen Code an $p0$p1 gesendet. Gib ihn unten ein.';
  }

  @override
  String uiFPaymentCurrency(Object p0) {
    return 'Zahlungswährung: $p0';
  }

  @override
  String uiFCurrentOurTeamReviewsRequestsWithin(Object p0) {
    return 'Aktuell: $p0. Unser Team prüft Anfragen innerhalb von 1–2 Werktagen.';
  }

  @override
  String uiFWillUseForPayments(Object p0, Object p1, Object p2) {
    return '$p0 $p1 verwendet $p2 für Zahlungen.';
  }

  @override
  String uiFCharacters(Object p0) {
    return '$p0/250 Zeichen';
  }

  @override
  String uiFPayoutSetupWasNotCompletedCurrency(Object p0) {
    return 'Die Auszahlungseinrichtung wurde nicht abgeschlossen. Währung auf $p0 zurückgesetzt.';
  }

  @override
  String uiFPayoutAccountLinked(Object p0) {
    return '$p0-Auszahlungskonto verknüpft.';
  }

  @override
  String uiFCurrencyRestoredTo(Object p0, Object p1) {
    return '$p0 Währung auf $p1 zurückgesetzt.';
  }

  @override
  String uiFSetUpPayouts(Object p0) {
    return '$p0-Auszahlungen einrichten?';
  }

  @override
  String uiFYouMustLinkAPayoutAccount(Object p0, Object p1) {
    return 'Du musst ein $p0-Auszahlungskonto verknüpfen, um diese Währung zu nutzen. Wird die Einrichtung abgebrochen, behält Bago $p1 bei.';
  }

  @override
  String uiFKeep(Object p0) {
    return '$p0 behalten';
  }

  @override
  String uiFDataAreCollectedByBagoAnd(Object p0) {
    return 'Die Daten werden von Bago erhoben und nur an unseren Auszahlungsanbieter übermittelt, um Auszahlungen zu ermöglichen. $p0 Mit dem Fortfahren bestätigst du, dass dieses Auszahlungskonto dir gehört.';
  }

  @override
  String uiFCopied(Object p0) {
    return '$p0 kopiert';
  }

  @override
  String uiFYouAndYourFriendEachGet(Object p0) {
    return 'Du und dein Freund erhaltet nach der Registrierung jeweils $p0';
  }

  @override
  String uiFEarnAnotherWhenTheySendAn(Object p0, Object p1) {
    return 'Verdiene weitere $p0, wenn sie einen Artikel über $p1 versenden';
  }

  @override
  String uiFEarned(Object p0, Object p1) {
    return '$p0 $p1 verdient';
  }

  @override
  String uiFYourBalanceIsBelowTheMinimum(Object p0, Object p1) {
    return 'Dein Guthaben liegt unter dem Mindestauszahlungsbetrag von $p0 $p1.';
  }

  @override
  String uiFMinimumWithdrawalIsAcrossAllCurrencies(Object p0, Object p1) {
    return 'Die Mindestauszahlung beträgt $p0 $p1 in allen Währungen.';
  }

  @override
  String uiFWithdrawalsArePaidToYourBank(Object p0) {
    return '$p0-Auszahlungen werden vom Bago-Finanzteam auf dein Bankkonto überwiesen, meist innerhalb von 1–3 Werktagen. Wir informieren dich per E-Mail, wenn sie freigegeben und bezahlt sind.';
  }

  @override
  String uiFNoTravelersAreHeadingFromTo(Object p0, Object p1) {
    return 'Derzeit reisen keine Reisenden von $p0 nach $p1. Schau bald wieder vorbei!';
  }

  @override
  String uiFSendWith(Object p0) {
    return 'Mit $p0 senden';
  }

  @override
  String uiFDone(Object p0) {
    return 'Fertig ($p0)';
  }

  @override
  String uiFKgFree(Object p0) {
    return '$p0 kg frei';
  }

  @override
  String uiFDeparts(Object p0) {
    return 'Abfahrt $p0';
  }

  @override
  String uiFValue(Object p0, Object p1) {
    return 'Wert: $p0 $p1';
  }

  @override
  String uiFOtherRequestsWaiting(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Anfragen warten',
      one: '1 Anfrage wartet',
    );
    return '$_temp0';
  }

  @override
  String uiFSender(Object p0) {
    return 'Absender: $p0';
  }

  @override
  String uiFCreated(Object p0) {
    return 'Erstellt $p0';
  }

  @override
  String uiFUpdateShipmentTo(Object p0) {
    return 'Sendung auf „$p0“ aktualisieren?';
  }

  @override
  String uiFTravelerInspectionPhotos(Object p0) {
    return 'Prüffotos des Reisenden ($p0/4)';
  }

  @override
  String uiFOfConfirmed(Object p0) {
    return '$p0 von 3 bestätigt';
  }

  @override
  String uiFTrips(Object p0) {
    return '$p0 Reisen';
  }

  @override
  String uiFKgBooked(Object p0) {
    return '$p0 kg gebucht';
  }

  @override
  String uiFKgLeft(Object p0) {
    return '$p0 kg übrig';
  }

  @override
  String uiFActive(Object p0) {
    return '$p0 aktiv';
  }

  @override
  String uiFOtherConversations(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Unterhaltungen',
      one: '1 Unterhaltung',
    );
    return '$_temp0';
  }

  @override
  String uiFCategoryPriority(Object p0, Object p1) {
    return 'Kategorie: $p0  •  Priorität: $p1';
  }

  @override
  String uiFRemoveSendersWillNoLongerSee(Object p0) {
    return '„$p0“ entfernen? Absender sehen ihn dann nicht mehr in der Suche.';
  }

  @override
  String uiFSelected(Object p0) {
    return 'Ausgewählt: $p0';
  }

  @override
  String uiFTypicalRatesRangeFromPerKg(Object p0, Object p1) {
    return 'Übliche Preise liegen je nach Route zwischen $p0 5 und $p1 20 pro kg.';
  }

  @override
  String uiFAiSuggestsKg(Object p0, Object p1, Object p2) {
    return 'KI schlägt $p0 $p1–$p2/kg vor';
  }

  @override
  String uiFKgBooked2(Object p0) {
    return '$p0 kg gebucht';
  }

  @override
  String uiFAppearance(Object p0) {
    return 'Darstellung: $p0';
  }
}
