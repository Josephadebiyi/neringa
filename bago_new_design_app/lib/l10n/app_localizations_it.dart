// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Italian (`it`).
class AppLocalizationsIt extends AppLocalizations {
  AppLocalizationsIt([String locale = 'it']) : super(locale);

  @override
  String get appTitle => 'Bago';

  @override
  String get accountSettings => 'Impostazioni account';

  @override
  String get verificationStatus => 'Stato verifica';

  @override
  String get actionRequiredVerifyIdentity =>
      'Azione richiesta: verifica l\'identità';

  @override
  String get kycPassed => 'KYC superato';

  @override
  String get profileSection => 'Profilo';

  @override
  String get editProfile => 'Modifica profilo';

  @override
  String get paymentMethods => 'Metodi di pagamento';

  @override
  String get preferencesSection => 'Preferenze';

  @override
  String get notifications => 'Notifiche';

  @override
  String get biometricLogin => 'Accesso biometrico';

  @override
  String get language => 'Lingua';

  @override
  String get legalSection => 'Legale';

  @override
  String get termsOfService => 'Termini di servizio';

  @override
  String get privacyPolicy => 'Informativa sulla privacy';

  @override
  String get deleteAccount => 'Elimina account';

  @override
  String get biometricEnabledMessage => 'L\'accesso biometrico è ora attivo.';

  @override
  String get biometricDisabledMessage =>
      'L\'accesso biometrico è ora disattivato.';

  @override
  String get languageSettingsTitle => 'Lingua';

  @override
  String get languageSettingsSubtitle =>
      'Scegli la lingua da usare in tutta l\'app.';

  @override
  String get languageChangedMessage => 'Lingua aggiornata.';

  @override
  String get languageEnglish => 'Inglese';

  @override
  String get languageGerman => 'Tedesco';

  @override
  String get languageFrench => 'Francese';

  @override
  String get languageSpanish => 'Spagnolo';

  @override
  String get languagePortuguese => 'Portoghese';

  @override
  String get languageItalian => 'Italiano';

  @override
  String get emailLabel => 'Email';

  @override
  String get emailHint => 'tu@esempio.com';

  @override
  String get passwordLabel => 'Password';

  @override
  String get passwordHint => 'La tua password';

  @override
  String get forgotPassword => 'Password dimenticata?';

  @override
  String get logIn => 'Accedi';

  @override
  String get continueWithGoogle => 'Continua con Google';

  @override
  String get continueWithEmail => 'Continua con email';

  @override
  String get useBiometric => 'Usa Face ID / impronta';

  @override
  String get notMemberYet => 'Non sei ancora membro?';

  @override
  String get signUp => 'Registrati';

  @override
  String get pleaseFillAllFields => 'Compila tutti i campi';

  @override
  String get biometricAuthFailed => 'Autenticazione biometrica non riuscita.';

  @override
  String get pleaseEnterYourEmail => 'Inserisci la tua email';

  @override
  String get pleaseEnterYourPassword => 'Inserisci la tua password';

  @override
  String get signInToYourAccount => 'Accedi al tuo account';

  @override
  String get choosePreferredMethod => 'Scegli il metodo che preferisci';

  @override
  String get dontHaveAccount => 'Non hai un account?';

  @override
  String get enterYourEmailTitle => 'Inserisci la tua email';

  @override
  String get verificationCodeMessage => 'Ti invieremo un codice di verifica';

  @override
  String get enterYourPasswordTitle => 'Inserisci la tua password';

  @override
  String get keepYourAccountSecure => 'Mantieni il tuo account al sicuro';

  @override
  String get forgotPasswordTitle => 'Password dimenticata?';

  @override
  String get forgotPasswordDescription =>
      'Inserisci la tua email e ti invieremo un link per reimpostare la password.';

  @override
  String get emailAddressLabel => 'Indirizzo email';

  @override
  String get emailRequired => 'L\'email è obbligatoria';

  @override
  String get enterValidEmail => 'Inserisci un\'email valida';

  @override
  String get sendResetLink => 'Invia link di ripristino';

  @override
  String get checkYourInbox => 'Controlla la tua casella di posta';

  @override
  String passwordResetEmailSent(Object email) {
    return 'Abbiamo inviato un link di ripristino a $email. Controlla la tua email e segui le istruzioni.';
  }

  @override
  String get backToSignIn => 'Torna all\'accesso';

  @override
  String get resetPasswordTitle => 'Reimposta password';

  @override
  String get createNewPasswordTitle => 'Crea una nuova password';

  @override
  String get enterNewPasswordDescription =>
      'Inserisci qui sotto la tua nuova password';

  @override
  String get newPasswordLabel => 'Nuova password';

  @override
  String get newPasswordHint => 'Inserisci la nuova password';

  @override
  String get confirmPasswordLabel => 'Conferma password';

  @override
  String get confirmPasswordHint => 'Reinserisci la password';

  @override
  String get passwordsDoNotMatch => 'Le password non corrispondono';

  @override
  String get passwordMinLength =>
      'La password deve contenere almeno 8 caratteri';

  @override
  String get passwordResetSuccessfully => 'Password reimpostata con successo';

  @override
  String get resetPasswordButton => 'Reimposta password';

  @override
  String get onboardingSlide1Title => 'Spedisci alle tue condizioni';

  @override
  String get onboardingSlide1Description =>
      'Connettiti con viaggiatori verificati diretti verso la tua destinazione per spedizioni convenienti.';

  @override
  String get onboardingSlide2Title => 'Trasforma i chilometri in denaro';

  @override
  String get onboardingSlide2Description =>
      'Monetizza il tuo spazio libero e consegna pacchi lungo il tuo percorso.';

  @override
  String get onboardingSlide3Title => 'Sicuro, verificato, affidabile';

  @override
  String get onboardingSlide3Description =>
      'Bago usa la verifica della community e il tracciamento in tempo reale per garantire la sicurezza di ogni pacco.';

  @override
  String get skip => 'Salta';

  @override
  String get next => 'Avanti';

  @override
  String get createAccount => 'Crea un account';

  @override
  String get signupStepEmailTitle => 'Qual è la tua email?';

  @override
  String get checkingEmail => 'Controllo email...';

  @override
  String get emailAvailable => 'L\'email è disponibile';

  @override
  String get emailAlreadyExists => 'Questa email ha già un account';

  @override
  String get availableEmailRequired =>
      'Inserisci un indirizzo email disponibile.';

  @override
  String get signupRestartCountry =>
      'Riavvia la registrazione e scegli di nuovo il tuo paese.';

  @override
  String get signupStepNameTitle => 'Come ti chiami?';

  @override
  String get firstNameHint => 'Nome';

  @override
  String get lastNameHint => 'Cognome';

  @override
  String get phoneNumberTitle => 'Numero di telefono';

  @override
  String get phoneDeliveryUpdates =>
      'Lo useremo per gli aggiornamenti sulla consegna.';

  @override
  String get phoneHint => 'Numero di telefono';

  @override
  String countryCodeSelected(Object dialCode, Object country) {
    return 'Prefisso $dialCode selezionato per $country.';
  }

  @override
  String get dobTitle => 'Quando sei nato?';

  @override
  String get securityTitle => 'Sicurezza';

  @override
  String get signupStepCountryTitle => 'Dove ti trovi?';

  @override
  String get countryCurrencyMethods =>
      'Questo determina la tua valuta e i metodi di pagamento disponibili.';

  @override
  String get selectedWalletSetup => 'Configurazione wallet selezionata';

  @override
  String currencySelection(Object currency, Object symbol) {
    return 'Valuta: $currency ($symbol)';
  }

  @override
  String get verifyYourEmail => 'Verifica la tua email';

  @override
  String sentSixDigitCode(Object email) {
    return 'Abbiamo inviato un codice di 6 cifre a $email';
  }

  @override
  String get resendCode => 'Invia di nuovo il codice';

  @override
  String resendIn(Object seconds) {
    return 'Invia di nuovo tra ${seconds}s';
  }

  @override
  String get resend => 'Invia di nuovo';

  @override
  String get welcomeToBago => 'Benvenuto in Bago!';

  @override
  String walletSetTo(Object currency, Object symbol) {
    return 'Il tuo wallet è stato impostato su $currency (${symbol}0.00)';
  }

  @override
  String get selectCountry => 'Seleziona paese';

  @override
  String get goToDashboard => 'Vai alla dashboard';

  @override
  String get orLabel => 'OPPURE';

  @override
  String get profileTabAboutYou => 'Su di te';

  @override
  String get profileTabAccount => 'Account';

  @override
  String get profileFallbackUser => 'Utente Bago';

  @override
  String get deleteAccountTitle => 'Eliminare l’account?';

  @override
  String get deleteAccountMessage =>
      'Questo rimuoverà definitivamente il tuo account Bago e ti disconnetterà.';

  @override
  String get cancel => 'Annulla';

  @override
  String get roleSendPackages => 'Invia pacchi';

  @override
  String get roleEarnTraveler => 'Guadagna come viaggiatore';

  @override
  String get editPersonalDetails => 'Modifica dati personali';

  @override
  String get identityVerification => 'Verifica dell’identità';

  @override
  String get notSet => 'Non impostato';

  @override
  String get aboutYouSection => 'Su di te';

  @override
  String get addMiniBio => 'Aggiungi una mini bio';

  @override
  String get highlyResponsiveReliable => 'Molto reattivo e affidabile';

  @override
  String get highlyRatedCommunity => 'Molto apprezzato dalla comunità Bago';

  @override
  String get ratingsActivity => 'Valutazioni e attività';

  @override
  String get ratingsLeft => 'Valutazioni lasciate';

  @override
  String get savedRoutes => 'Percorsi salvati';

  @override
  String get paymentsSection => 'Pagamenti';

  @override
  String preferredCurrency(Object currency) {
    return 'Valuta preferita: $currency';
  }

  @override
  String get changePassword => 'Cambia password';

  @override
  String get payoutMethods => 'Metodi di pagamento';

  @override
  String get paymentsRefunds => 'Pagamenti e rimborsi';

  @override
  String get supportLegal => 'Supporto e legale';

  @override
  String get communicationPreferences => 'Preferenze di comunicazione';

  @override
  String get helpSupport => 'Aiuto e supporto';

  @override
  String get signOut => 'Esci';

  @override
  String get shipmentsTitle => 'Le mie spedizioni';

  @override
  String get tripsTitle => 'I miei viaggi';

  @override
  String get activeTab => 'Attivo';

  @override
  String get historyTab => 'Cronologia';

  @override
  String get nothingHereYet => 'Qui non c’è ancora nulla';

  @override
  String get shipmentsEmptySubtitle =>
      'Le tue spedizioni appariranno qui quando inizierai a usare Bago.';

  @override
  String get findTraveler => 'Trova un viaggiatore';

  @override
  String get requestsSent => 'Richieste inviate';

  @override
  String get requestHistory => 'Cronologia richieste';

  @override
  String get requestsSentSubtitle =>
      'Richieste che hai inviato ai viaggiatori elencati.';

  @override
  String get requestHistorySubtitle => 'Richieste completate e rifiutate.';

  @override
  String get myShipmentsSection => 'Le mie spedizioni';

  @override
  String get shipmentHistory => 'Cronologia spedizioni';

  @override
  String get myShipmentsSubtitle => 'Pacchi che hai creato.';

  @override
  String get shipmentHistorySubtitle => 'Spedizioni completate e chiuse.';

  @override
  String get pendingPayment => 'Pagamento in sospeso';

  @override
  String get finishCheckoutShipment =>
      'Completa il pagamento per inviare questa richiesta di spedizione.';

  @override
  String resumeBefore(Object time) {
    return 'Riprendi prima di $time';
  }

  @override
  String get continueShipment => 'Continua spedizione';

  @override
  String get delete => 'Elimina';

  @override
  String get tripsEmptySubtitle =>
      'I tuoi viaggi e le richieste in arrivo appariranno qui quando i viaggiatori inizieranno a inviare richieste.';

  @override
  String get seeRequests => 'Vedi richieste';

  @override
  String get incomingRequests => 'Richieste in arrivo';

  @override
  String get incomingRequestsSubtitle =>
      'Controlla le richieste di pacchi prima di accettarle o rifiutarle.';

  @override
  String get myTripsSubtitle => 'I tuoi itinerari pubblicati.';

  @override
  String get tripHistory => 'Cronologia viaggi';

  @override
  String get tripHistorySubtitle => 'Viaggi completati e chiusi.';

  @override
  String get deleteTripTitle => 'Eliminare il viaggio?';

  @override
  String get deleteTripMessage =>
      'Questo rimuoverà il viaggio dal tuo account.';

  @override
  String get tripDeletedSuccessfully => 'Viaggio eliminato con successo';

  @override
  String get paymentReviewTitle => 'Controlla e paga';

  @override
  String get noPendingShipmentPayment =>
      'Nessun pagamento di spedizione in sospeso trovato.';

  @override
  String get shipmentCurrencyMissing =>
      'Manca la valuta della spedizione. Riavvia il flusso della spedizione dalla pagina dei dettagli del viaggiatore.';

  @override
  String get totalAmount => 'Importo totale';

  @override
  String get shippingFee => 'Costo di spedizione';

  @override
  String get insurance => 'Assicurazione';

  @override
  String get route => 'Percorso';

  @override
  String get receiver => 'Destinatario';

  @override
  String get receiverFallback => 'Destinatario';

  @override
  String get securePayment => 'Pagamento sicuro';

  @override
  String get stripeSecureHelp =>
      'Scegli una delle tue carte salvate o aggiungine una nuova prima di pagare.';

  @override
  String get paymentMethod => 'Metodo di pagamento';

  @override
  String get noSavedCardsYet =>
      'Nessuna carta salvata al momento. Aggiungi una Visa o Mastercard per continuare.';

  @override
  String get shipmentPendingUntilConfirmed =>
      'La tua spedizione resta in sospeso finché il pagamento non viene confermato.';

  @override
  String get paymentDraftExpired =>
      'Questa bozza di pagamento è scaduta e non può più essere completata.';

  @override
  String paymentCanBeResumedUntil(Object time) {
    return 'La tua spedizione in sospeso può essere ripresa fino a $time.';
  }

  @override
  String get pay => 'Paga';

  @override
  String get processingPayment => 'Elaborazione del pagamento';

  @override
  String get addCardTitle => 'Aggiungi carta';

  @override
  String get addCardDescription =>
      'Inserisci qui sotto i dettagli della tua carta. Sono supportate solo Visa e Mastercard.';

  @override
  String get enterValidSupportedCard =>
      'Inserisci una Visa o Mastercard valida per continuare.';

  @override
  String get savingCard => 'Salvataggio carta...';

  @override
  String get saveCard => 'Salva carta';

  @override
  String get manageAllCards => 'Gestisci tutte le carte';

  @override
  String get pickupLocation => 'Luogo di ritiro';

  @override
  String get deliveryLocation => 'Luogo di consegna';

  @override
  String get pickupCityPrompt => 'Qual è la tua città di ritiro?';

  @override
  String get sendingToPrompt => 'Dove stai inviando?';

  @override
  String get selectCitiesFirst => 'Seleziona prima entrambe le città.';

  @override
  String get homeFallbackUser => 'Utente';

  @override
  String welcomeBackName(Object name) {
    return 'Bentornato, $name';
  }

  @override
  String get homeSenderHeadline => 'Invia o ricevi articoli oltre confine';

  @override
  String get homeCarrierSubtitle =>
      'Guadagna nel tuo prossimo viaggio con Bago';

  @override
  String get homeSenderSubtitle => 'Consegna transfrontaliera veloce e sicura';

  @override
  String get whatDoYouWantToDo => 'Cosa vuoi fare?';

  @override
  String get topDestination => 'Destinazione principale';

  @override
  String get tripActivityShort => 'Attività del viaggio';

  @override
  String get recentActivity => 'Attività recente';

  @override
  String get enterPickupCity => 'Inserisci la città di ritiro';

  @override
  String get enterDestination => 'Inserisci la destinazione';

  @override
  String get todayLabel => 'Oggi';

  @override
  String get findTravelerButton => 'Trova un viaggiatore';

  @override
  String get earnedBalance => 'SALDO GUADAGNATO';

  @override
  String get publishNewItinerary => 'Pubblica un nuovo itinerario';

  @override
  String get globalLocationSearch => 'Ricerca globale località';

  @override
  String get searchCityAirport =>
      'Cerca una città o un aeroporto per scegliere una località.';

  @override
  String get selectDate => 'Seleziona data';

  @override
  String get confirmDate => 'Conferma data';

  @override
  String get yourTripActivity => 'La tua attività di viaggio';

  @override
  String get yourActivity => 'La tua attività';

  @override
  String get loadingTrips => 'Caricamento dei tuoi viaggi...';

  @override
  String get loadingActivity => 'Caricamento della tua attività...';

  @override
  String get shipmentsHistoryAvailable =>
      'La cronologia delle tue spedizioni e le richieste inviate ai viaggiatori sono disponibili in Le mie spedizioni.';

  @override
  String get openMyShipments => 'Apri Le mie spedizioni';

  @override
  String get travelersAvailableToday =>
      'Oggi sono disponibili 8 viaggiatori per le rotte più popolari';

  @override
  String get serviceSendPackage => 'Invia pacco';

  @override
  String get serviceBuyItems => 'Compra articoli';

  @override
  String get serviceGiftItems => 'Regala articoli';

  @override
  String get serviceSeeRequests => 'Vedi richieste';

  @override
  String get servicePublishTrip => 'Pubblica viaggio';

  @override
  String get serviceMessages => 'Messaggi';

  @override
  String get serviceSendPackageDesc =>
      'Invia facilmente articoli oltre i confini.';

  @override
  String get serviceBuyItemsDesc =>
      'Chiedi a un viaggiatore di fare acquisti per te.';

  @override
  String get serviceGiftItemsDesc => 'Invia qualcosa di speciale a qualcuno.';

  @override
  String get serviceSeeRequestsDesc =>
      'Controlla le richieste di spedizione in attesa per te.';

  @override
  String get servicePublishTripDesc =>
      'Crea un nuovo itinerario per i viaggiatori.';

  @override
  String get serviceMessagesDesc =>
      'Tieni tutte le chat delle spedizioni in un unico posto.';

  @override
  String get tripDetailsTitle => 'Dettagli del viaggio';

  @override
  String get couldNotLoadTrip => 'Impossibile caricare questo viaggio.';

  @override
  String get statusLabel => 'Stato';

  @override
  String get travelTypeLabel => 'Tipo di viaggio';

  @override
  String get departureLabel => 'Partenza';

  @override
  String get capacityLabel => 'Capacità';

  @override
  String get priceLabel => 'Prezzo';

  @override
  String approxInCurrency(Object currency) {
    return 'Circa in $currency';
  }

  @override
  String get tripProofLabel => 'Prova del viaggio';

  @override
  String get uploaded => 'Caricato';

  @override
  String get missing => 'Mancante';

  @override
  String get tripEditApprovalMessage =>
      'Modificare questo viaggio lo invia di nuovo al team di supporto per l’approvazione. Carica una prova aggiornata se il tuo biglietto o la tua prenotazione sono cambiati.';

  @override
  String get tripMissingReference =>
      'A questo viaggio manca il riferimento dei dettagli. Aggiorna e riprova.';

  @override
  String get editTrip => 'Modifica viaggio';

  @override
  String get deleteTrip => 'Elimina viaggio';

  @override
  String get shipmentDetailsTitle => 'Dettagli della spedizione';

  @override
  String get couldNotLoadShipment => 'Impossibile caricare la spedizione';

  @override
  String get retry => 'Riprova';

  @override
  String get shippingPdfTitle => 'PDF di spedizione';

  @override
  String get shippingPdfDescription =>
      'Crea un documento A4 brandizzato con tracciamento QR, cronologia e dettagli della spedizione.';

  @override
  String get previewPrint => 'Anteprima / Stampa';

  @override
  String get shareSavePdf => 'Condividi / Salva PDF';

  @override
  String get feedbackSubmittedSuccessfully => 'Feedback inviato con successo.';

  @override
  String get leaveFeedback => 'Lascia feedback';

  @override
  String get rateTravelerNote =>
      'Valuta il viaggiatore e lascia una breve nota per gli altri utenti.';

  @override
  String get shareYourExperience => 'Condividi la tua esperienza...';

  @override
  String get submitFeedback => 'Invia feedback';

  @override
  String get fromLabel => 'Da';

  @override
  String get toLabel => 'A';

  @override
  String get packageDetailsTitle => 'Dettagli del pacco';

  @override
  String get weightLabel => 'Peso';

  @override
  String get declaredValueLabel => 'Valore dichiarato';

  @override
  String get yesLabel => 'Sì';

  @override
  String get noLabel => 'No';

  @override
  String get descriptionLabel => 'Descrizione';

  @override
  String get senderLabel => 'Mittente';

  @override
  String get travelerLabel => 'Viaggiatore';

  @override
  String get paymentLabel => 'Pagamento';

  @override
  String get pickupDateLabel => 'Data di ritiro';

  @override
  String get deliveryDateLabel => 'Data di consegna';

  @override
  String get estimatedDepartureLabel => 'Partenza stimata';

  @override
  String get estimatedArrivalLabel => 'Arrivo stimato';

  @override
  String get addressesTitle => 'Indirizzi';

  @override
  String get pickupLabel => 'Ritiro';

  @override
  String get deliveryLabel => 'Consegna';

  @override
  String get nameLabel => 'Nome';

  @override
  String get phoneLabel => 'Telefono';

  @override
  String get itemImagesLabel => 'Immagini dell\'articolo';

  @override
  String get notProvidedLabel => 'Non fornito';

  @override
  String get receiverInfo => 'Informazioni del destinatario';

  @override
  String get escrowLabel => 'Saldo di deposito in garanzia';

  @override
  String get trackingNumberTitle => 'Numero di tracciamento';

  @override
  String get copiedToClipboard => 'Copiato negli appunti';

  @override
  String get totalPriceTitle => 'Prezzo totale';

  @override
  String get feedbackCardDescription =>
      'Valuta il viaggiatore e aggiungi un breve commento per aiutare altri mittenti.';

  @override
  String get downloadPdf => 'Scarica PDF';

  @override
  String get goBack => 'Indietro';

  @override
  String get searchResultsTitle => 'Risultati della ricerca';

  @override
  String tripsFoundCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count viaggi trovati',
      one: '1 viaggio trovato',
    );
    return '$_temp0';
  }

  @override
  String get anyLabel => 'Qualsiasi';

  @override
  String get noTripsFound => 'Nessun viaggio trovato';

  @override
  String get tryAdjustingSearch => 'Prova a modificare la ricerca';

  @override
  String get searchAgain => 'Cerca di nuovo';

  @override
  String get selectBothCitiesFirst => 'Seleziona prima entrambe le città';

  @override
  String get searchRequiresCities =>
      'Seleziona sia la città di ritiro che quella di destinazione prima di cercare.';

  @override
  String get passKycBeforeShipment =>
      'Supera il KYC prima di creare una spedizione.';

  @override
  String kgAvailable(Object kg) {
    return '$kg kg disponibili';
  }

  @override
  String get sendWithThisCarrier => 'Invia con questo viaggiatore';

  @override
  String get sendWithThisTraveler => 'Invia con questo viaggiatore';

  @override
  String get sendPackageTitle => 'Invia un pacco';

  @override
  String get findTravelerForRoute => 'Trova un viaggiatore per il tuo percorso';

  @override
  String get selectPickupAndDelivery => 'Seleziona ritiro e consegna';

  @override
  String get anyDate => 'Qualsiasi data';

  @override
  String get findYourTravelerTitle => 'Trova il tuo viaggiatore';

  @override
  String get findYourTravelerDescription =>
      'Trova un viaggiatore affidabile per trasportare il tuo pacco';

  @override
  String get setPreferredCurrencyTitle => 'Imposta la tua valuta preferita';

  @override
  String get needWalletCurrency =>
      'Devi impostare la valuta del wallet prima di continuare.';

  @override
  String get rateLabel => 'Valutazione';

  @override
  String get paymentFailedTitle => 'Pagamento non riuscito';

  @override
  String draftAvailableUntil(Object time) {
    return 'La bozza della tua spedizione resta disponibile fino a $time.';
  }

  @override
  String get continuePayment => 'Continua pagamento';

  @override
  String get deleteDraft => 'Elimina bozza';

  @override
  String get backToMyShipments => 'Torna a Le mie spedizioni';

  @override
  String get paymentNotCompleted => 'Il tuo pagamento non è stato completato.';

  @override
  String get insufficientFundsMessage =>
      'La tua carta non ha fondi sufficienti. Prova con un’altra carta o contatta la tua banca.';

  @override
  String get cardDeclinedMessage =>
      'La tua banca ha rifiutato questa carta. Prova con un’altra carta o contatta la tua banca.';

  @override
  String get incorrectCvcMessage =>
      'Il codice di sicurezza è errato. Controllalo e riprova.';

  @override
  String get expiredCardMessage =>
      'Questa carta è scaduta. Usa una carta diversa.';

  @override
  String get incorrectNumberMessage =>
      'Il numero della carta sembra errato. Controllalo e riprova.';

  @override
  String get bankVerificationMessage =>
      'Questa carta richiede una verifica bancaria. Continua e completa la verifica nell’app.';

  @override
  String get processingErrorMessage =>
      'Non siamo riusciti a elaborare questa carta in questo momento. Riprova tra poco.';

  @override
  String get paymentCancelledMessage =>
      'Il pagamento è stato annullato prima di essere completato.';

  @override
  String get paymentCouldNotCompleteGeneric =>
      'Il tuo pagamento non è stato completato. Riprova o usa un’altra carta.';

  @override
  String get shipmentRequestedTitle => 'Spedizione richiesta!';

  @override
  String get shipmentCreatedSentTraveler =>
      'La tua spedizione è stata creata e inviata al viaggiatore selezionato.';

  @override
  String paymentReferenceValue(Object reference) {
    return 'Riferimento pagamento: $reference';
  }

  @override
  String get viewShipments => 'Vedi spedizioni';

  @override
  String get backToHome => 'Torna alla home';

  @override
  String get trackShipmentTitle => 'Traccia spedizione';

  @override
  String get trackYourPackage => 'Traccia il tuo pacco';

  @override
  String get enterTrackingNumberPrompt =>
      'Inserisci un numero di tracciamento per continuare.';

  @override
  String get enterTrackingNumberMessage =>
      'Inserisci un numero di tracciamento';

  @override
  String get trackingNumberLabel => 'Numero di tracciamento';

  @override
  String get searchButton => 'Cerca';

  @override
  String get searchAnother => 'Cerca un altro';

  @override
  String get unknownLabel => 'Sconosciuto';

  @override
  String get unknownSender => 'Mittente sconosciuto';

  @override
  String get unknownReceiver => 'Destinatario sconosciuto';

  @override
  String get currentStatusTitle => 'Stato attuale';

  @override
  String get originLabel => 'Origine';

  @override
  String get destinationLabel => 'Destinazione';

  @override
  String get currentLocationLabel => 'Posizione attuale';

  @override
  String get estimatedDeliveryLabel => 'Consegna stimata';

  @override
  String get pendingLabel => 'In sospeso';

  @override
  String get pickedUpLabel => 'Ritirato';

  @override
  String get inTransitLabel => 'In transito';

  @override
  String get outForDeliveryLabel => 'In consegna';

  @override
  String get deliveredLabel => 'Consegnato';

  @override
  String get tripRouteOrigin => 'Origine';

  @override
  String get tripRouteDestination => 'Destinazione';

  @override
  String get travelModeFlight => 'Volo';

  @override
  String get travelModeBus => 'Autobus';

  @override
  String get travelModeTrain => 'Treno';

  @override
  String get travelModeCar => 'Auto';

  @override
  String get travelModeShip => 'Nave';

  @override
  String get setWalletCurrencyTitle => 'Imposta la valuta del wallet';

  @override
  String get chooseWalletCurrencyDescription =>
      'Scegli la valuta in cui vuoi ricevere i pagamenti.';

  @override
  String get confirmCurrency => 'Conferma valuta';

  @override
  String get acceptTermsToContinue =>
      'Devi accettare i termini per continuare.';

  @override
  String get identityVerificationRequiredTrip =>
      'Verifica dell’identità richiesta';

  @override
  String get selectDepartureCity => 'Seleziona la città di partenza';

  @override
  String get selectDestinationCity => 'Seleziona la città di destinazione';

  @override
  String get departureDestinationDifferent =>
      'Partenza e destinazione devono essere diverse';

  @override
  String get selectTravelDate => 'Seleziona la data del viaggio';

  @override
  String get setDepartureTime => 'Imposta l’orario di partenza';

  @override
  String get uploadTripProofContinue =>
      'Carica una prova del viaggio per continuare';

  @override
  String get enterPricePerKg => 'Inserisci il prezzo per kg';

  @override
  String get chooseTravelType => 'Scegli il tipo di viaggio';

  @override
  String get uploadProofOfTrip => 'Carica prova del viaggio';

  @override
  String get capacityAtLeastOneKg => 'La capacità deve essere di almeno 1 kg';

  @override
  String get validPricePerKg => 'Inserisci un prezzo valido per kg';

  @override
  String get noWalletCurrencySet => 'Nessuna valuta del wallet impostata';

  @override
  String get uploadProofTitle => 'Carica prova';

  @override
  String get jpegPdfMaxSize => 'JPEG o PDF, massimo 2 MB';

  @override
  String get choosePhoto => 'Scegli foto';

  @override
  String get jpegFromGallery => 'JPEG dalla galleria';

  @override
  String get choosePdf => 'Scegli PDF';

  @override
  String get boardingPassBooking =>
      'Carta d’imbarco o conferma di prenotazione';

  @override
  String get fileTooLargeUnder2mb =>
      'File troppo grande. Mantienilo sotto i 2 MB.';

  @override
  String get postTripTitle => 'Pubblica un viaggio';

  @override
  String get departureLabelShort => 'Partenza';

  @override
  String get destinationLabelShort => 'Destinazione';

  @override
  String get saveChanges => 'Salva modifiche';

  @override
  String get publishTripAction => 'Pubblica viaggio';

  @override
  String get continueLabel => 'Continua';

  @override
  String get departureCityTitle => 'Città di partenza';

  @override
  String get departureCitySubtitle => 'Da dove viaggi?';

  @override
  String get destinationCityTitle => 'Città di destinazione';

  @override
  String get destinationCitySubtitle => 'Dove stai andando?';

  @override
  String get tripUpdatedTitle => 'Viaggio aggiornato';

  @override
  String get tripSubmittedTitle => 'Viaggio inviato';

  @override
  String get statusPendingReview => 'In attesa di revisione';

  @override
  String tripUpdatedApproval(Object destination) {
    return 'Il tuo viaggio è stato aggiornato e reinviato al team di supporto per l’approvazione.';
  }

  @override
  String tripSubmittedApproval(Object destination) {
    return 'Il tuo viaggio è stato inviato ed è in attesa dell’approvazione del team di supporto.';
  }

  @override
  String get ticketProofAttached => 'Prova del biglietto allegata';

  @override
  String get pendingSupportApproval =>
      'Approvazione del team di supporto in attesa';

  @override
  String get goToMyTrips => 'Vai ai miei viaggi';

  @override
  String get almostThere => 'Ci siamo quasi!';

  @override
  String get reviewGuidelinesBeforePosting =>
      'Consulta le linee guida prima di pubblicare il tuo viaggio.';

  @override
  String get verifyIdentityAndAgreeTerms =>
      'Verifica la tua identità e accetta i termini per continuare.';

  @override
  String get identityVerificationKyc =>
      'Per questa azione è richiesta la verifica dell’identità KYC.';

  @override
  String get requiredToPostTrip =>
      'Devi superare il KYC prima di pubblicare un viaggio.';

  @override
  String get changePasswordTitle => 'Aggiorna la tua password';

  @override
  String get changePasswordDescription =>
      'Inserisci la password attuale e scegline una nuova. Se hai effettuato l’accesso con Google o non conosci la password attuale, inviati invece un link di reimpostazione.';

  @override
  String get currentPasswordLabel => 'Password attuale';

  @override
  String get currentPasswordHint => 'Inserisci la password attuale';

  @override
  String get confirmNewPasswordLabel => 'Conferma nuova password';

  @override
  String get confirmNewPasswordHint => 'Reinserisci la nuova password';

  @override
  String get newPasswordMustDiffer =>
      'La nuova password deve essere diversa da quella attuale';

  @override
  String get passwordChangedSuccessfully => 'Password modificata con successo';

  @override
  String get resetByEmailUnavailable =>
      'Reimpostazione via e-mail non disponibile';

  @override
  String get forgotCurrentPasswordReset =>
      'Hai dimenticato la password attuale? Reimpostala via e-mail';

  @override
  String get changeEmailTitle => 'Cambia e-mail';

  @override
  String get updateYourEmail => 'Aggiorna la tua e-mail';

  @override
  String get changeEmailDescription =>
      'Inserisci il nuovo indirizzo e-mail che desideri usare. Dovrai verificarlo con un OTP.';

  @override
  String get newEmailAddressLabel => 'Nuovo indirizzo e-mail';

  @override
  String get sendVerificationCode => 'Invia codice di verifica';

  @override
  String get verifyItsYou => 'Verifica che sia proprio tu';

  @override
  String get weSentCodeToPrefix => 'Abbiamo inviato un codice a ';

  @override
  String get weSentCodeToSuffix =>
      '. Inseriscilo qui sotto per confermare la modifica.';

  @override
  String get verificationCodeLabel => 'Codice di verifica';

  @override
  String get updateEmailAddress => 'Aggiorna indirizzo e-mail';

  @override
  String get changeEmailAddress => 'Cambia indirizzo e-mail';

  @override
  String get enterValidEmailAddress => 'Inserisci un indirizzo e-mail valido.';

  @override
  String verificationCodeSentTo(Object value) {
    return 'Codice di verifica inviato a $value';
  }

  @override
  String get enterVerificationCodePrompt => 'Inserisci il codice di verifica.';

  @override
  String get emailUpdatedSuccessfully => 'E-mail aggiornata con successo!';

  @override
  String get changePhoneNumberTitle => 'Cambia numero di telefono';

  @override
  String get updateYourPhoneNumber => 'Aggiorna il tuo numero di telefono';

  @override
  String changePhoneDescription(Object email) {
    return 'Inserisci il nuovo numero di telefono che desideri usare. Invieremo un codice di verifica a $email per confermare la modifica.';
  }

  @override
  String get newPhoneNumberLabel => 'Nuovo numero di telefono';

  @override
  String get enterValidPhoneNumber => 'Inserisci un numero di telefono valido.';

  @override
  String get phoneNumberUpdatedSuccessfully =>
      'Numero di telefono aggiornato con successo!';

  @override
  String get confirmFromYourEmail => 'Conferma dalla tua e-mail';

  @override
  String get weSentVerificationCodeToPrefix =>
      'Abbiamo inviato un codice di verifica a ';

  @override
  String get weSentVerificationCodeToSuffix =>
      '. Inseriscilo qui sotto per aggiornare il tuo numero di telefono.';

  @override
  String get updatePhoneNumber => 'Aggiorna numero di telefono';

  @override
  String get changePhoneNumberAction => 'Cambia numero di telefono';

  @override
  String get startVerification => 'Avvia verifica';

  @override
  String get communityGuidelinesTerms =>
      'Linee guida della community e termini';

  @override
  String get acceptSafetyTerms =>
      'Accetto tutte le linee guida di sicurezza e i termini legali';

  @override
  String get navHome => 'Home';

  @override
  String get navShipments => 'Spedizioni';

  @override
  String get navTrips => 'Viaggi';

  @override
  String get navMessages => 'Messaggi';

  @override
  String get navProfile => 'Profilo';

  @override
  String get preferredCurrencyTitle => 'Valuta preferita';

  @override
  String get currencyScreenInfo =>
      'Scegli la valuta che vuoi vedere nell\'app. Questo aggiorna la visualizzazione del portafoglio, i pagamenti e le preferenze di prezzo.';

  @override
  String currencyUpdatedTo(Object currency) {
    return 'Valuta preferita aggiornata a $currency';
  }

  @override
  String get referenceRates => 'Tassi di riferimento';

  @override
  String get referenceRatesInfo =>
      'Questi sono i tassi di conversione attualmente utilizzati nell\'app per le valute supportate.';

  @override
  String get escrowProtectionTitle => 'Protezione Escrow';

  @override
  String get escrowProtectionDesc =>
      '\"In Garanzia\" significa che i fondi sono custoditi in modo sicuro. Passano a \"Completato\" una volta confermata la consegna.';

  @override
  String get transactionHistory => 'Cronologia transazioni';

  @override
  String get noTransactionsYet => 'Nessuna transazione ancora';

  @override
  String get noTransactionsDesc =>
      'Una volta effettuato un pagamento o ricevuto un rimborso, apparirà qui.';

  @override
  String get helpHeroText => 'Come possiamo\naiutarti oggi?';

  @override
  String get quickHelp => 'Aiuto rapido';

  @override
  String get faqSection => 'Domande frequenti';

  @override
  String get searchHelpHint => 'Cerca argomenti di assistenza...';

  @override
  String get noRatingsYet => 'Non hai ancora lasciato nessuna valutazione.';

  @override
  String get setCurrencyFirst =>
      'Imposta la tua valuta preferita nelle impostazioni del profilo prima di gestire i metodi di pagamento.';

  @override
  String get activityTitle => 'Attività';

  @override
  String get activityTabTrips => 'Viaggi';

  @override
  String get activityTabShipments => 'Spedizioni';

  @override
  String get activityTabRequests => 'Richieste';

  @override
  String get noTripsYet => 'Nessun viaggio ancora';

  @override
  String get postATripCta => 'Pubblica un viaggio';

  @override
  String get postATripSubtitle =>
      'Pubblica un viaggio per iniziare a guadagnare trasportando pacchi.';

  @override
  String get noShipmentsYet => 'Nessuna spedizione ancora';

  @override
  String get sendAPackageCta => 'Invia un pacco';

  @override
  String get sendAPackageSubtitle => 'Invia un pacco e traccialo qui.';

  @override
  String get noRequestsYet => 'Nessuna richiesta ancora';

  @override
  String get noRequestsSubtitle =>
      'Quando invii o ricevi richieste di spedizione, appariranno qui.';

  @override
  String get incomingRequestsLabel => 'Richieste in arrivo';

  @override
  String get sentRequestsLabel => 'Richieste inviate';

  @override
  String get fromSenderLabel => 'Dal mittente';

  @override
  String get withCarrierLabel => 'Con il corriere';

  @override
  String get pendingPriceLabel => 'Prezzo in attesa';

  @override
  String get shipmentRequestFallback => 'Richiesta di spedizione';

  @override
  String activeShipmentsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count spedizioni attive',
      one: '1 spedizione attiva',
    );
    return '$_temp0';
  }

  @override
  String kgFreeLabel(Object kg) {
    return '$kg kg liberi';
  }

  @override
  String get ratingsAndReviewsTitle => 'Valutazioni e recensioni';

  @override
  String get noReviewsYet => 'Nessuna recensione ancora';

  @override
  String get noReviewsSubtitle =>
      'Le recensioni di mittenti e viaggiatori appariranno qui.';

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count recensioni',
      one: '1 recensione',
    );
    return '$_temp0';
  }

  @override
  String get requestsSectionCarry => 'Pacchi da trasportare';

  @override
  String get requestsSectionSending => 'Le mie richieste di spedizione';

  @override
  String get searchRequestsHint => 'Cerca per nome o pacco...';

  @override
  String noResultsFor(Object query) {
    return 'Nessun risultato per \"$query\"';
  }

  @override
  String get activeShipmentsSection => 'Attivo';

  @override
  String get pastShipmentsSection => 'Passato';

  @override
  String get searchTripsHint => 'Cerca per percorso, data o stato...';

  @override
  String get searchShipmentsHint => 'Cerca per pacco, città o viaggiatore...';

  @override
  String get uiIncludingProcessingByOurIdentityVerification =>
      ', incluso il trattamento da parte del nostro partner per la verifica dell\'identità.';

  @override
  String get ui1000Deliveries => '1.000+\nConsegne';

  @override
  String get ui247Support => '24/7\nAssistenza';

  @override
  String get ui6DigitCode => 'Codice a 6 cifre';

  @override
  String get ui9DigitAbaRoutingNumber => 'Numero di routing ABA a 9 cifre';

  @override
  String get uiAClearPhotoHelpsTheTraveler =>
      'Una foto chiara aiuta il viaggiatore a riconoscere il tuo articolo';

  @override
  String get uiANewCodeHasBeenSent => 'È stato inviato un nuovo codice';

  @override
  String get uiAccountDetails => 'DETTAGLI DEL CONTO';

  @override
  String get uiAccountInformation => 'INFORMAZIONI SULL\'ACCOUNT';

  @override
  String get uiAccept => 'Accetta';

  @override
  String get uiAcceptContinue => 'Accetta e continua';

  @override
  String get uiAcceptRequest => 'Accetta richiesta';

  @override
  String get uiAccountHolderName => 'Nome dell\'intestatario';

  @override
  String get uiAccountHolderName2 => 'Nome dell\'intestatario *';

  @override
  String get uiAccountNumber => 'Numero di conto';

  @override
  String get uiAccountNumber2 => 'Numero di conto *';

  @override
  String get uiAccountSuspended => 'Account sospeso';

  @override
  String get uiAccountVerification => 'Verifica dell\'account';

  @override
  String get uiAccountCreated => 'Account creato';

  @override
  String get uiAccountHolder => 'Intestatario';

  @override
  String get uiAccountNumberMustBe10Digits =>
      'Il numero di conto deve avere 10 cifre.';

  @override
  String get uiActionNeeded => 'Azione richiesta';

  @override
  String get uiActiveShipment => 'Spedizione attiva';

  @override
  String get uiActiveShipments => 'Spedizioni attive';

  @override
  String get uiAdd24PhotosAndAccept =>
      'Aggiungi 2–4 foto e accetta tutti gli accordi.';

  @override
  String get uiAddBankAccount => 'Aggiungi conto bancario';

  @override
  String get uiAddAService => 'Aggiungi un servizio';

  @override
  String get uiAddAnItemImageBeforeContinuing =>
      'Aggiungi un\'immagine dell\'articolo prima di continuare.';

  @override
  String get uiAddItemPhoto => 'Aggiungi foto dell\'articolo';

  @override
  String get uiAddItemPhotoOptional =>
      'Aggiungi foto dell\'articolo (facoltativo)';

  @override
  String get uiAddKg => 'Aggiungi kg';

  @override
  String get uiAddMoreKg => 'Aggiungi altri kg';

  @override
  String get uiAddPhoto => 'Aggiungi foto';

  @override
  String get uiAddYourPayoutAccountSoYou =>
      'Aggiungi il tuo conto di pagamento per ricevere i soldi delle consegne.';

  @override
  String get uiAdditionalWeight => 'Peso aggiuntivo';

  @override
  String get uiAddressLine1 => 'Indirizzo riga 1 *';

  @override
  String get uiAddressLine2 => 'Indirizzo riga 2';

  @override
  String get uiAfterDelivery => 'Dopo la consegna';

  @override
  String get uiAgeVerification => 'Verifica dell\'età *';

  @override
  String get uiAgreementShippingConfirmation =>
      'Accordo e conferma di spedizione';

  @override
  String get uiAllConversationsStaySynced =>
      'Tutte le conversazioni restano sincronizzate';

  @override
  String get uiAllow => 'Consenti';

  @override
  String get uiAllowNotifications => 'Consentire le notifiche?';

  @override
  String get uiAmount => 'Importo';

  @override
  String get uiAnAgentWillJoinShortlyYou =>
      'Un operatore ti risponderà a breve. Puoi inviare un messaggio qui sotto.';

  @override
  String get uiAnySpecialRequirementsOrInstructions =>
      'Requisiti o istruzioni particolari...';

  @override
  String get uiApartmentSuiteEtcOptional =>
      'Interno, scala, ecc. (facoltativo)';

  @override
  String get uiAppPasscode => 'Codice dell\'app';

  @override
  String get uiAppPasscodeRemoved => 'Codice dell\'app rimosso.';

  @override
  String get uiAppPasscodeSaved => 'Codice dell\'app salvato.';

  @override
  String get uiApplePay => 'Apple Pay';

  @override
  String get uiApplySuggestion => 'Applica suggerimento';

  @override
  String get uiAreYouSigningUpAsAn =>
      'Ti registri come privato o come azienda?';

  @override
  String get uiAreYouSureYouWantTo =>
      'Vuoi davvero eliminare questo percorso salvato?';

  @override
  String get uiArrival => 'Arrivo';

  @override
  String get uiAskTheSenderOrReceiverFor =>
      'Chiedi al mittente o al destinatario il PIN di consegna a 4 cifre per confermare la consegna e sbloccare subito il pagamento.';

  @override
  String get uiAtLeast8Characters => 'Almeno 8 caratteri';

  @override
  String get uiAvailable => 'Disponibile';

  @override
  String get uiAvailableBalance => 'Saldo disponibile';

  @override
  String get uiAvailableCapacity => 'Capacità disponibile';

  @override
  String get uiAvailableNow => 'Disponibile ora';

  @override
  String get uiAwaitingPaymentTapToContinue =>
      'Pagamento in attesa — tocca per continuare';

  @override
  String get uiBillingAddress => 'INDIRIZZO DI FATTURAZIONE';

  @override
  String get uiBack => 'Indietro';

  @override
  String get uiBackToApp => 'Torna all\'app';

  @override
  String get uiBagoCommission => 'Commissione Bago';

  @override
  String get uiBagoFee => 'Commissione Bago';

  @override
  String get uiBagoGuidelines => 'Linee guida di Bago';

  @override
  String get uiBagoUsesFlutterwaveForSecureCheckout =>
      'Bago usa Flutterwave per un pagamento sicuro. Quando paghi con carta, Apple Pay, bonifico o mobile money, Flutterwave gestisce e conserva in sicurezza i dati di pagamento. Bago non riceve mai i numeri completi della carta.';

  @override
  String get uiBagoWillUseThisCountryTo =>
      'Bago userà questo paese per impostare la valuta del portafoglio prima della verifica dell\'identità.';

  @override
  String get uiBank => 'Banca';

  @override
  String get uiBankCountry => 'Paese della banca';

  @override
  String get uiBankName => 'Nome della banca';

  @override
  String get uiBankName2 => 'Nome della banca *';

  @override
  String get uiBankAccountAddedSuccessfully => 'Conto bancario aggiunto!';

  @override
  String get uiBankAccountLinkedSuccessfully => 'Conto bancario collegato!';

  @override
  String get uiBankAccountSetupCouldNotBe =>
      'Impossibile configurare il conto bancario. Riprova.';

  @override
  String get uiBankCountry2 => 'Paese della banca *';

  @override
  String get uiBioCannotBeEmpty => 'La bio non può essere vuota';

  @override
  String get uiBioUpdatedSuccessfully => 'Bio aggiornata';

  @override
  String get uiBiometricUnlockFailed => 'Sblocco biometrico non riuscito.';

  @override
  String get uiBookings => 'Prenotazioni';

  @override
  String get uiBriefSummaryOfYourIssue => 'Breve riepilogo del problema';

  @override
  String get uiBrowseQuickAnswersStartALive =>
      'Consulta le risposte rapide, avvia una chat dal vivo o torna a una conversazione esistente senza perdere il contesto.';

  @override
  String get uiBusinessOrOrganisation => 'Azienda o organizzazione';

  @override
  String get uiBusinessServices => 'Servizi aziendali';

  @override
  String get uiBusinessServicesAreAvailableToBusiness =>
      'I servizi aziendali sono disponibili per gli account aziendali.';

  @override
  String get uiBuyItemsAbroad => 'Acquista all\'estero';

  @override
  String get uiBuyItemsAbroadIsNotLive =>
      '«Acquista all\'estero» non è ancora disponibile. Arriverà presto.';

  @override
  String get uiByContinuingIConfirmThat => 'Continuando, confermo che:';

  @override
  String get uiBySubmittingYouConfirmThisTrip =>
      'Inviando, confermi che questo viaggio è corretto. I viaggi nuovi o modificati vengono di nuovo approvati dal team di supporto prima della pubblicazione.';

  @override
  String get uiCategory => 'CATEGORIA';

  @override
  String get uiCalculatingCheckoutTotal => 'Calcolo del totale...';

  @override
  String get uiCanTFindItCheckYour =>
      'Non lo trovi? Controlla la cartella spam.';

  @override
  String get uiCardsAreSavedDuringCheckout =>
      'Le carte vengono salvate durante il pagamento';

  @override
  String get uiCarrierLogisticsCompanyName =>
      'Nome del corriere / società logistica';

  @override
  String get uiCategory2 => 'Categoria';

  @override
  String get uiChange => 'Modifica';

  @override
  String get uiChangeNumber => 'Cambia numero';

  @override
  String get uiChangingThisAccountRequiresAConfirmation =>
      'Per modificare questo conto serve un codice di conferma inviato via email.';

  @override
  String get uiChatClosed => 'Chat chiusa';

  @override
  String get uiChatIsNotAvailableForThis =>
      'La chat non è ancora disponibile per questa spedizione.';

  @override
  String get uiChatSafelyByStayingWithinBago =>
      'Chatta in sicurezza restando su Bago. Proteggiamo i tuoi pagamenti e i tuoi dati.';

  @override
  String get uiChatWithSupport => 'Chatta con l\'assistenza';

  @override
  String get uiCheckYourInboxForTheVerification =>
      'Controlla la posta in arrivo per l\'email di verifica inviata alla registrazione. Una volta verificata, sei a posto.';

  @override
  String get uiChooseFromLibrary => 'Scegli dalla libreria';

  @override
  String get uiChooseYourEarningCurrencyThisWill =>
      'Scegli la valuta dei guadagni. Verrà bloccata dopo la conferma e potrà essere cambiata solo dall\'assistenza.';

  @override
  String get uiCity => 'Città *';

  @override
  String get uiCityCountry => 'Città, paese';

  @override
  String get uiCityAirportStation => 'Città, aeroporto, stazione...';

  @override
  String get uiComingSoon => 'Prossimamente';

  @override
  String get uiCommunication => 'Comunicazione';

  @override
  String get uiCommunityVerified => 'Community\nverificata';

  @override
  String get uiCompany => 'Azienda';

  @override
  String get uiCompleteSignup => 'Completa la registrazione';

  @override
  String get uiCompleteIdentityVerificationBeforeAddingA =>
      'Completa la verifica dell\'identità prima di aggiungere un conto di pagamento.';

  @override
  String get uiCompleteIdentityVerificationBeforeChangingPayout =>
      'Completa la verifica dell\'identità prima di cambiare la valuta di pagamento.';

  @override
  String get uiCompleteYourProfile => 'Completa il tuo profilo';

  @override
  String get uiConfirm => 'Conferma';

  @override
  String get uiConfirmBankAccount => 'Conferma conto bancario';

  @override
  String get uiConfirmDeliveryGetPaid =>
      'Conferma la consegna e ricevi il pagamento';

  @override
  String get uiConfirmUkBankAccount => 'Conferma conto bancario UK';

  @override
  String get uiConfirmUsdBankAccount => 'Conferma conto bancario in USD';

  @override
  String get uiConfirmCountry => 'Conferma paese';

  @override
  String get uiConfirmDelivery => 'Conferma consegna';

  @override
  String get uiConfirmDeliveryToReleaseThePayment =>
      'Conferma la consegna per sbloccare il pagamento.';

  @override
  String get uiConfirmDelivery2 => 'Confermare la consegna?';

  @override
  String get uiConfirmPasscode => 'Conferma codice';

  @override
  String get uiConfirmThisOnlyAfterThePackage =>
      'Conferma solo quando hai il pacco in mano. Questo sbloccherà il pagamento al viaggiatore.';

  @override
  String get uiConfirmWithdrawal => 'Conferma prelievo';

  @override
  String get uiConfirmYourBank => 'Conferma la tua banca';

  @override
  String get uiConfirmYourCountry => 'Conferma il tuo paese';

  @override
  String get uiConfirmationCodeCopied => 'Codice di conferma copiato.';

  @override
  String get uiConfirmingReceiptWillReleasePaymentTo =>
      'Confermare la ricezione sblocca il pagamento al viaggiatore. Fallo solo quando hai il pacco.';

  @override
  String get uiConnectionError => 'Errore di connessione';

  @override
  String get uiContactSupport => 'Contatta l\'assistenza';

  @override
  String get uiContactSupport2 => 'Contatta l\'assistenza';

  @override
  String get uiContinueAsGuest => 'Continua come ospite';

  @override
  String get uiContinueBrowsing => 'Continua a esplorare';

  @override
  String get uiContinueToPayment => 'Procedi al pagamento';

  @override
  String get uiContinueWithApple => 'Continua con Apple';

  @override
  String get uiConversationWithBagoSupport =>
      'Conversazione con l\'assistenza Bago';

  @override
  String get uiCouldNotConfirmTheCodePlease =>
      'Impossibile confermare il codice. Riprova.';

  @override
  String get uiCouldNotLoadBanksPleaseTry =>
      'Impossibile caricare le banche. Riprova.';

  @override
  String get uiCouldNotLoadMap => 'Impossibile caricare la mappa';

  @override
  String get uiCouldNotLoadRequests => 'Impossibile caricare le richieste';

  @override
  String get uiCouldNotLoadShipmentDetailsPlease =>
      'Impossibile caricare i dettagli della spedizione. Riprova.';

  @override
  String get uiCouldNotLoadShipments => 'Impossibile caricare le spedizioni';

  @override
  String get uiCouldNotLoadTrips => 'Impossibile caricare i viaggi';

  @override
  String get uiCouldNotSendTheRequestPlease =>
      'Impossibile inviare la richiesta. Riprova.';

  @override
  String get uiCouldNotUpdateWalletCurrencyPlease =>
      'Impossibile aggiornare la valuta del portafoglio. Riprova.';

  @override
  String get uiCountryOfResidence => 'Paese di residenza';

  @override
  String get uiCreateAccount => 'Crea account';

  @override
  String get uiCreateGroupShipment => 'Crea spedizione di gruppo';

  @override
  String get uiCreateAPassword => 'Crea una\npassword';

  @override
  String get uiCreateAFreeAccountOrSign =>
      'Crea un account gratuito o accedi per prenotare un viaggiatore e spedire il tuo pacco.';

  @override
  String get uiCreateAGroupShippingRequest =>
      'Crea una richiesta di spedizione di gruppo';

  @override
  String get uiCreateYourAccount => 'Crea il tuo\naccount';

  @override
  String get uiCreditDebitCard => 'Carta di credito / debito';

  @override
  String get uiCurrency => 'Valuta';

  @override
  String get uiCurrencyNotSet => 'Valuta non impostata';

  @override
  String get uiCurrentLocationOptional => 'Posizione attuale (facoltativo)';

  @override
  String get uiCurrentShipments => 'Spedizioni in corso';

  @override
  String get uiDataProtectionConsent => 'Protezione dei dati e consenso';

  @override
  String get uiDate => 'Data';

  @override
  String get uiDateOfBirth => 'Data di nascita';

  @override
  String get uiDateOfBirth2 => 'Data di nascita *';

  @override
  String get uiDecline => 'Rifiuta';

  @override
  String get uiDeleteRoute => 'Elimina percorso';

  @override
  String get uiDeliveryAddress => 'Indirizzo di consegna';

  @override
  String get uiDeliveryConfirmedPaymentReleasedToTraveler =>
      'Consegna confermata! Pagamento sbloccato al viaggiatore.';

  @override
  String get uiDepartureTime => 'Orario di partenza';

  @override
  String get uiDescribeYourItemSoYourTraveler =>
      'Descrivi il tuo articolo così il viaggiatore sa cosa aspettarsi.';

  @override
  String get uiDiscard => 'Scarta';

  @override
  String get uiDiscardDraft => 'Scartare la bozza?';

  @override
  String get uiDocumentsSubmitted => 'Documenti inviati';

  @override
  String get uiDropOffAddress => 'Indirizzo di consegna';

  @override
  String get uiEarnByCarryingPackagesOnYour =>
      'Guadagna portando pacchi durante il tuo viaggio';

  @override
  String get uiEditBio => 'Modifica bio';

  @override
  String get uiEmailAddress => 'Indirizzo email';

  @override
  String get uiEmailNotifications => 'Notifiche email';

  @override
  String get uiEmailSupport => 'Assistenza via email';

  @override
  String get uiEmailChangesAreHandledThroughVerification =>
      'Le modifiche dell\'email avvengono tramite verifica.';

  @override
  String get uiEnter48Digits => 'Inserisci 4–8 cifre';

  @override
  String get uiEnterAValidPhoneNumber5 =>
      'Inserisci un numero valido (5–15 cifre, solo numeri).';

  @override
  String get uiEnterAValidShipmentWeight =>
      'Inserisci un peso di spedizione valido.';

  @override
  String get uiEnterAccountNumber => 'Inserisci il numero di conto';

  @override
  String get uiEnterAll4Digits => 'Inserisci tutte e 4 le cifre';

  @override
  String get uiEnterAmount => 'Inserisci l\'importo';

  @override
  String get uiEnterTheCode => 'Inserisci il codice';

  @override
  String get uiEnterTheAdditionalKg => 'Inserisci i kg aggiuntivi.';

  @override
  String get uiEnterWithdrawalCode => 'Inserisci il codice di prelievo';

  @override
  String get uiEnterYourEmail => 'Inserisci la tua\nemail';

  @override
  String get uiEnterYourPhoneNumber => 'Inserisci il tuo\nnumero di telefono';

  @override
  String get uiEnterYourAppPasscode => 'Inserisci il codice dell\'app.';

  @override
  String get uiEnterYourEmailAndWeWill =>
      'Inserisci la tua email e ti invieremo un codice a 6 cifre per reimpostare la password.';

  @override
  String get uiEnterYourPasscode => 'Inserisci il codice';

  @override
  String get uiEnterYourRegisteredBusinessName =>
      'Inserisci la ragione sociale della tua azienda';

  @override
  String get uiEnterYourRouteToSeeAvailable =>
      'Inserisci il tuo percorso per vedere i viaggiatori disponibili.';

  @override
  String get uiEverythingLookRightPublishWhenReady =>
      'Tutto a posto? Pubblica quando sei pronto.';

  @override
  String get uiEverythingStaysInOneThreadSo =>
      'Tutto resta in un\'unica conversazione per tornarci quando vuoi, come in un\'app di messaggistica.';

  @override
  String get uiExplainWhyYouAreRejectingThe =>
      'Spiega perché rifiuti il pacco.';

  @override
  String get uiExternalCarrierTracking => 'Tracciamento corriere esterno';

  @override
  String get uiFrequentlyAskedQuestions => 'DOMANDE FREQUENTI';

  @override
  String get uiFaceIdOrTouchId => 'Face ID o Touch ID';

  @override
  String get uiFactorySealedEvidence => 'Prova di sigillo di fabbrica';

  @override
  String get uiFailedToSaveNamePleaseTry =>
      'Impossibile salvare il nome. Riprova.';

  @override
  String get uiFailedToUpdateBio => 'Impossibile aggiornare la bio';

  @override
  String get uiFailedToUpdatePreferences =>
      'Impossibile aggiornare le preferenze';

  @override
  String get uiFailedToUpdateProfile => 'Impossibile aggiornare il profilo';

  @override
  String get uiFindARoute => 'Trova un percorso';

  @override
  String get uiFindATravelerToCarryYour =>
      'Trova un viaggiatore che porti il tuo pacco.';

  @override
  String get uiFindAnswersToCommonQuestionsBelow =>
      'Trova qui sotto le risposte alle domande più comuni.';

  @override
  String get uiFindingTravelersOnThisRoute =>
      'Ricerca di viaggiatori su questo percorso…';

  @override
  String get uiFirstName => 'Nome *';

  @override
  String get uiForComplexIssues => 'Per problemi complessi';

  @override
  String get uiForYourSafetyTheSenderMust =>
      'Per la tua sicurezza, il mittente deve aprire il pacco e farti ispezionare tutti gli articoli prima del ritiro.\n\nNon accettare pacchi sigillati o articoli che non hai ispezionato personalmente.';

  @override
  String get uiForYourSecurityPleaseUnlockThe =>
      'Per la tua sicurezza, sblocca l\'app per continuare.';

  @override
  String get uiFromGallery => 'Dalla galleria';

  @override
  String get uiFromWizard => 'Dalla procedura guidata';

  @override
  String get uiFullName => 'Nome completo';

  @override
  String get uiFullName2 => 'Nome completo';

  @override
  String get uiFullNameOnTheAccount => 'Nome completo dell\'intestatario';

  @override
  String get uiFullNameOnTheBankAccount => 'Nome completo sul conto bancario';

  @override
  String get uiGbpPayoutsUseAUkSort =>
      'I pagamenti in GBP usano un sort code britannico e il numero di conto.';

  @override
  String get uiGetInstantUpdatesAboutMessagesShipment =>
      'Ricevi aggiornamenti immediati su messaggi, spedizioni e stato della consegna.';

  @override
  String get uiGetMatchedWithACarrierTogether =>
      'Trovate insieme un viaggiatore';

  @override
  String get uiGiftItemsIsNotLiveYet =>
      '«Invia regali» non è ancora disponibile. Arriverà presto.';

  @override
  String get uiGoogleSignInCanBeUnreliable =>
      'L\'accesso con Google può non funzionare bene sul simulatore iPhone. Se si blocca, usa l\'email qui e prova Google su un dispositivo reale.';

  @override
  String get uiGotIt => 'Capito';

  @override
  String get uiGroupShipping => 'Spedizione di gruppo';

  @override
  String get uiGroupShippingRequestCreatedShareWith =>
      'Richiesta di spedizione di gruppo creata! Condividila con il tuo gruppo.';

  @override
  String get uiHowItWorks => 'COME FUNZIONA';

  @override
  String get uiHandoverPin => 'PIN di consegna';

  @override
  String get uiHandoverConfirmedFundsReleased =>
      'Consegna confermata! Fondi sbloccati.';

  @override
  String get uiHowCanWeHelp => 'Come possiamo aiutarti?';

  @override
  String get uiHowManyKgCanYouCarry => 'Quanti kg puoi portare?';

  @override
  String get uiHowWeUseIt => 'Come li usiamo';

  @override
  String get uiHowWouldYouLikeToSign => 'Come vuoi registrarti?';

  @override
  String get uiIReceivedMyPackage => 'Ho ricevuto il mio pacco';

  @override
  String get uiIAcceptResponsibilityForThisPackage =>
      'Mi assumo la responsabilità di questo pacco al ritiro e comprendo che questo accordo sarà firmato elettronicamente e conservato con l\'ordine.';

  @override
  String get uiIAcknowledgeThatMyPersonalData =>
      'Prendo atto che i miei dati personali saranno trattati secondo l\'informativa sulla privacy.';

  @override
  String get uiIAgreeToFollowBagoS =>
      'Accetto di seguire le linee guida di Bago e di assumermi la responsabilità della mia spedizione.';

  @override
  String get uiIAgreeToThePlatformS =>
      'Accetto i termini e le condizioni d\'uso di Bago.';

  @override
  String get uiIAgreeStartVerification => 'Accetto — Avvia la verifica';

  @override
  String get uiIConfirmThatIAm18 => 'Confermo di avere almeno 18 anni.';

  @override
  String get uiIConfirmThatMyShipmentDoes =>
      'Confermo che la mia spedizione non contiene articoli vietati e rispetta le regole di Bago.';

  @override
  String get uiIConsentToTheCollectionAnd =>
      'Acconsento alla raccolta e al trattamento dei miei dati personali come descritto nella ';

  @override
  String get uiIHavePersonallyInspectedTheContents =>
      'Ho ispezionato personalmente il contenuto e confermo che gli articoli corrispondono alla descrizione.';

  @override
  String get uiIHaveReadAndAgreeTo => 'Ho letto e accetto i ';

  @override
  String get uiIUnderstandAndAgreeToAll =>
      'Comprendo e accetto tutti i termini';

  @override
  String get uiIUnderstandThatIMustNot =>
      'Comprendo che non devo trasportare articoli illegali, pericolosi, soggetti a restrizioni, non dichiarati o sospetti.';

  @override
  String get uiIUnderstandTheTravelerMayInspect =>
      'Comprendo che il viaggiatore può ispezionare il contenuto per sicurezza e conformità.';

  @override
  String get uiIWouldLikeToReceivePromotional =>
      'Desidero ricevere offerte promozionali e novità via email.';

  @override
  String get uiIban => 'IBAN *';

  @override
  String get uiIdVerified => 'ID\nverificato';

  @override
  String get uiIdentityVerificationRequired =>
      'Verifica dell\'identità richiesta';

  @override
  String get uiIdentityVerificationApproved =>
      'Verifica dell\'identità approvata!';

  @override
  String get uiImageUnavailable => 'Immagine non disponibile';

  @override
  String get uiInEscrow => 'In deposito';

  @override
  String get uiInbox => 'Posta in arrivo';

  @override
  String get uiIndividual => 'Privato';

  @override
  String get uiInsufficientBalance => 'Saldo insufficiente.';

  @override
  String get uiInsuranceIncluded => 'Assicurazione inclusa';

  @override
  String get uiInsuredDelivery => 'Consegna\nassicurata';

  @override
  String get uiInviteOthersWithTheSameDestination =>
      'Invita altri con la stessa destinazione';

  @override
  String get uiItemCategory => 'Categoria dell\'articolo';

  @override
  String get uiItemDescription => 'Descrizione dell\'articolo';

  @override
  String get uiJohnDoe => 'Mario Rossi';

  @override
  String get uiJourneyMap => 'Mappa del viaggio';

  @override
  String get uiKeep => 'Mantieni';

  @override
  String get uiKeepTheSenderUpdatedOnThe =>
      'Tieni aggiornato il mittente sull\'avanzamento della spedizione.';

  @override
  String get uiLinkedPayoutAccount => 'CONTO DI PAGAMENTO COLLEGATO';

  @override
  String get uiLocationInformation => 'INFORMAZIONI SULLA POSIZIONE';

  @override
  String get uiLastName => 'Cognome *';

  @override
  String get uiLastUpdatedJuly152026 => 'Ultimo aggiornamento: 15 luglio 2026';

  @override
  String get uiLastUpdatedJuly172026 => 'Ultimo aggiornamento: 17 luglio 2026';

  @override
  String get uiLinkBankAccount => 'Collega conto bancario';

  @override
  String get uiListTheItemsYouWantTo =>
      'Elenca gli articoli che vuoi spedire...';

  @override
  String get uiLiveChat => 'Chat dal vivo';

  @override
  String get uiLiveChat2 => 'Chat dal vivo';

  @override
  String get uiLivenessCheck => 'Verifica di presenza';

  @override
  String get uiLoadingMap => 'Caricamento mappa...';

  @override
  String get uiLocked => 'Bloccato';

  @override
  String get uiLogout => 'Esci';

  @override
  String get uiMmDdYyyy => 'GG/MM/AAAA';

  @override
  String get uiMyBio => 'LA MIA BIO';

  @override
  String get uiMakeSureAllTextIsClearly =>
      'Assicurati che tutto il testo sia ben leggibile e senza riflessi.';

  @override
  String get uiManage => 'Gestisci';

  @override
  String get uiMarketingCommunications => 'Comunicazioni di marketing';

  @override
  String get uiMembersWithABioAre3x =>
      'I membri con una bio hanno 3 volte più probabilità di essere prenotati. Un profilo completo crea fiducia nella community Bago.';

  @override
  String get uiMessage => 'Messaggio';

  @override
  String get uiMethod => 'Metodo';

  @override
  String get uiMinimum => 'Minimo';

  @override
  String get uiMyShipmentDoesNotContainAny =>
      'La mia spedizione non contiene articoli vietati o soggetti a restrizioni.';

  @override
  String get uiNotificationSettings => 'IMPOSTAZIONI DI NOTIFICA';

  @override
  String get uiNameAndDateOfBirthAre =>
      'Nome e data di nascita sono bloccati dopo la verifica dell\'identità.';

  @override
  String get uiNameMustBeAtLeast2 => 'Il nome deve avere almeno 2 caratteri';

  @override
  String get uiNewConversation => 'Nuova conversazione';

  @override
  String get uiNewShipment => 'Nuova spedizione';

  @override
  String get uiNewShipmentRequest => 'Nuova richiesta di spedizione';

  @override
  String get uiNewTicket => 'Nuovo ticket';

  @override
  String get uiNoActiveConversationsYet => 'Nessuna conversazione attiva';

  @override
  String get uiNoBanksFound => 'Nessuna banca trovata';

  @override
  String get uiNoCitiesFound => 'Nessuna città trovata';

  @override
  String get uiNoHelpArticlesMatchedThatSearch =>
      'Nessun articolo di aiuto corrisponde alla ricerca';

  @override
  String get uiNoPayoutMethodLinked => 'Nessun metodo di pagamento collegato';

  @override
  String get uiNoProhibitedItems => 'Nessun articolo vietato';

  @override
  String get uiNoRecentSearches => 'Nessuna ricerca recente';

  @override
  String get uiNoReferredUsersYet => 'Nessun utente invitato per ora.';

  @override
  String get uiNoSavedRoutesFound => 'Nessun percorso salvato.';

  @override
  String get uiNoServicesYetAddANamed =>
      'Nessun servizio per ora. Aggiungi una tariffa con nome come «Express» o «Standard»: i mittenti la vedranno con lo stesso prezzo di qualsiasi viaggio in tutta l\'app.';

  @override
  String get uiNoTravelersYet => 'Nessun viaggiatore per ora';

  @override
  String get uiNone => 'Nessuno';

  @override
  String get uiNotNow => 'Non ora';

  @override
  String get uiNoteForTravelerOptional =>
      'Nota per il viaggiatore (facoltativo)';

  @override
  String get uiNoteToTraveler => 'Nota al viaggiatore';

  @override
  String get uiNotesOptional => 'Note (facoltativo)';

  @override
  String get uiOpen => 'Aperto';

  @override
  String get uiOpenBoxInspectionRequired =>
      'Ispezione a pacco aperto obbligatoria';

  @override
  String get uiOpenChat => 'Apri chat';

  @override
  String get uiOpenSettings => 'Apri impostazioni';

  @override
  String get uiOpenInbox => 'Apri posta in arrivo';

  @override
  String get uiOpenToInspection => 'Ispezionabile';

  @override
  String get uiOpenWebSupport => 'Apri assistenza web';

  @override
  String get uiOptional => 'Facoltativo';

  @override
  String get uiOptionalPreferences => 'Preferenze facoltative';

  @override
  String get uiOptionalHandlingInstructions =>
      'Istruzioni di gestione facoltative…';

  @override
  String get uiOptionalSkipIfYourIdHas =>
      'Facoltativo — salta se il documento non ha il retro';

  @override
  String get uiOptional2 => 'Facoltativo:';

  @override
  String get uiOriginCountry => 'Paese di origine';

  @override
  String get uiOurTeamWillReviewYourIdentity =>
      'Il nostro team esaminerà i tuoi documenti d\'identità entro 1–2 giorni lavorativi. Riceverai una notifica al termine.';

  @override
  String get uiPackageDeclaration => 'DICHIARAZIONE DEL PACCO';

  @override
  String get uiPersonalInformation => 'INFORMAZIONI PERSONALI';

  @override
  String get uiPopularCities => 'CITTÀ POPOLARI';

  @override
  String get uiProofOfCollectionRequired => 'PROVA DI RITIRO OBBLIGATORIA';

  @override
  String get uiPackage => 'Pacco';

  @override
  String get uiPackageUnderReviewDoNotTransport =>
      'Pacco in revisione\nNon trasportare né ritirare questo pacco mentre Bago esamina le prove.';

  @override
  String get uiPasscode => 'Codice';

  @override
  String get uiPasscodesDoNotMatch => 'I codici non corrispondono.';

  @override
  String get uiPaymentAndConversionFees =>
      'Commissioni di pagamento e conversione';

  @override
  String get uiPaymentDetailsAreProcessedByFlutterwave =>
      'I dati di pagamento sono elaborati da Flutterwave. Bago conserva solo riferimenti sicuri per assistenza, rimborsi e tracciamento.';

  @override
  String get uiPayoutCurrency => 'Valuta di pagamento';

  @override
  String get uiPayoutStatus => 'Stato del pagamento';

  @override
  String get uiPayoutStatusRefreshed => 'Stato del pagamento aggiornato.';

  @override
  String get uiPayoutsReleaseAfterDeliveryIsComplete =>
      'I pagamenti vengono sbloccati quando la consegna è completata, confermata e compensata.';

  @override
  String get uiPersonalAccount => 'Account personale';

  @override
  String get uiPhoneNumberUpdated => 'Numero di telefono aggiornato!';

  @override
  String get uiPhoneNumber => 'Numero di telefono';

  @override
  String get uiPhoneNumberChangesAreConfirmedWith =>
      'Le modifiche del numero vengono confermate con un codice inviato via email.';

  @override
  String get uiPickUpWhereYouLeftOff => 'Riprendi da dove avevi lasciato';

  @override
  String get uiPickupAndDestinationCitiesMustBe =>
      'Le città di partenza e destinazione devono essere diverse.';

  @override
  String get uiPleaseAcceptAllRequiredTerms =>
      'Accetta tutti i termini richiesti';

  @override
  String get uiPleaseAgreeToTheTermsAnd => 'Accetta i termini e le condizioni';

  @override
  String get uiPleaseConfirmYourLegalNameAnd =>
      'Conferma nome legale e data di nascita esattamente come sul documento. Devono corrispondere perché la verifica vada a buon fine.';

  @override
  String get uiPleaseDescribeYourIssue => 'Descrivi il problema';

  @override
  String get uiPleaseEnterAValid10Digit =>
      'Inserisci un numero di conto valido a 10 cifre';

  @override
  String get uiPleaseEnterAValidIban => 'Inserisci un IBAN valido.';

  @override
  String get uiPleaseEnterAValidOtp => 'Inserisci un codice valido';

  @override
  String get uiPleaseEnterAValidAccountNumber =>
      'Inserisci un numero di conto valido.';

  @override
  String get uiPleaseEnterAValidAmount => 'Inserisci un importo valido.';

  @override
  String get uiPleaseEnterThe6DigitCode => 'Inserisci il codice a 6 cifre';

  @override
  String get uiPleaseEnterThe6DigitCode2 => 'Inserisci il codice a 6 cifre.';

  @override
  String get uiPleaseEnterTheSwiftBicCode => 'Inserisci il codice SWIFT/BIC.';

  @override
  String get uiPleaseEnterTheAccountHolderName =>
      'Inserisci il nome dell\'intestatario.';

  @override
  String get uiPleaseEnterYourDateOfBirth => 'Inserisci la tua data di nascita';

  @override
  String get uiPleaseEnterYourFirstAndLast => 'Inserisci nome e cognome';

  @override
  String get uiPleaseEnterYourFullName => 'Inserisci il tuo nome completo';

  @override
  String get uiPleaseEnterYourNameSoWe =>
      'Inserisci il tuo nome così sappiamo come chiamarti.';

  @override
  String get uiPleaseEnterYourPhoneNumber =>
      'Inserisci il tuo numero di telefono';

  @override
  String get uiPleaseEnterYourRealNameSo =>
      'Inserisci il tuo vero nome così gli altri sanno con chi hanno a che fare.';

  @override
  String get uiPleaseFillAllRequiredFields =>
      'Compila tutti i campi obbligatori';

  @override
  String get uiPleaseFillInAllReceiverDetails =>
      'Compila tutti i dati del destinatario.';

  @override
  String get uiPleaseFillInTheRequiredFields => 'Compila i campi obbligatori';

  @override
  String get uiPleaseFillInYourAddressStreet =>
      'Inserisci il tuo indirizzo (via, città, CAP e paese).';

  @override
  String get uiPleaseLinkABankAccountBefore =>
      'Collega un conto bancario prima di prelevare.';

  @override
  String get uiPleaseReadAndConfirmEachStatement =>
      'Leggi e conferma ogni dichiarazione prima di inviare la spedizione.';

  @override
  String get uiPleaseReadTheseTermsOfService =>
      'Leggi attentamente questi termini prima di usare Bago. Regolano l\'uso della nostra piattaforma e dei nostri servizi.';

  @override
  String get uiPleaseReviewOurPolicies => 'Leggi\nle nostre politiche';

  @override
  String get uiPleaseSelectABank => 'Seleziona una banca';

  @override
  String get uiPleaseSelectABankAndEnter =>
      'Seleziona una banca e inserisci il numero di conto.';

  @override
  String get uiPleaseSelectARole => 'Seleziona un ruolo';

  @override
  String get uiPleaseSelectAnAuthenticationMethod =>
      'Seleziona un metodo di accesso';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn =>
      'Imposta la tua valuta preferita nelle impostazioni del profilo prima di continuare.';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn2 =>
      'Imposta la tua valuta preferita nelle impostazioni del profilo prima di richiedere una spedizione.';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn3 =>
      'Imposta la tua valuta preferita nelle impostazioni del profilo prima di prelevare.';

  @override
  String get uiPleaseVerifyYourPhoneNumberBefore =>
      'Verifica il tuo numero di telefono prima di pubblicare un viaggio.';

  @override
  String get uiPleaseWaitForAccountVerification =>
      'Attendi la verifica dell\'account';

  @override
  String get uiPoolYourShipmentWithOthersGoing =>
      'Unisci la tua spedizione ad altre verso la stessa destinazione per dividere i costi e risparmiare.';

  @override
  String get uiPostTrip => 'Pubblica viaggio';

  @override
  String get uiPostalCode => 'CAP *';

  @override
  String get uiPressAndHoldThisDraftTo =>
      'Tieni premuta questa bozza per eliminarla';

  @override
  String get uiPricePerKg => 'Prezzo al kg';

  @override
  String get uiPrivacyConsent => 'Privacy e consenso';

  @override
  String get uiPrivacyPolicy => 'Informativa sulla privacy *';

  @override
  String get uiProcessingYourVerification => 'Elaborazione della verifica…';

  @override
  String get uiProfilePhotoUpdated => 'Foto profilo aggiornata';

  @override
  String get uiProfileUpdatedSuccessfully => 'Profilo aggiornato';

  @override
  String get uiProhibitedItems => 'Articoli vietati';

  @override
  String get uiProof => 'Prova';

  @override
  String get uiProofOfTrip => 'Prova del viaggio';

  @override
  String get uiProtectMyItem => 'Proteggi il mio articolo';

  @override
  String get uiProtectedByBankGradeEncryption =>
      'Protetto da crittografia di livello bancario';

  @override
  String get uiPublish => 'Pubblica';

  @override
  String get uiPushNotifications => 'Notifiche push';

  @override
  String get uiQualifiedShipment => 'Spedizione idonea';

  @override
  String get uiQuickUnlockAfterInactivity => 'Sblocco rapido dopo inattività';

  @override
  String get uiRateThisShipmentExperienceAndAdd =>
      'Valuta questa spedizione e aggiungi un breve commento.';

  @override
  String get uiReEnterPasscode => 'Reinserisci il codice';

  @override
  String get uiReadyToWithdraw => 'Pronto da prelevare';

  @override
  String get uiReadyToWithdrawHeldInEscrow =>
      'Pronto da prelevare + in deposito';

  @override
  String get uiRealTimeTracking => 'Tracciamento\nin tempo reale';

  @override
  String get uiReason => 'Motivo';

  @override
  String get uiReceiverDetails => 'Dati del destinatario';

  @override
  String get uiRecentSearches => 'Ricerche recenti';

  @override
  String get uiReferralEarnings => 'Guadagni da inviti';

  @override
  String get uiReferrals => 'Inviti';

  @override
  String get uiReferredUsers => 'Utenti invitati';

  @override
  String get uiRefresh => 'Aggiorna';

  @override
  String get uiRefreshWallet => 'Aggiorna portafoglio';

  @override
  String get uiReject => 'Rifiuta';

  @override
  String get uiRejectPackage => 'Rifiuta pacco';

  @override
  String get uiRejectionReasonIfRejecting => 'Motivo del rifiuto (se rifiuti)';

  @override
  String get uiRemaining => 'Rimanente';

  @override
  String get uiRemove => 'Rimuovi';

  @override
  String get uiRemoveAppPasscode => 'Rimuovi il codice dell\'app';

  @override
  String get uiRemoveFromHistory => 'Rimuovere dalla cronologia?';

  @override
  String get uiRemoveService => 'Rimuovi servizio';

  @override
  String get uiReplyToSupport => 'Rispondi all\'assistenza…';

  @override
  String get uiReportIssue => 'Segnala un problema';

  @override
  String get uiReportShipment => 'Segnala spedizione';

  @override
  String get uiRequestShipment => 'Richiedi spedizione';

  @override
  String get uiRequestACurrencyChange => 'Richiedi cambio valuta';

  @override
  String get uiRequestAccepted => 'Richiesta accettata';

  @override
  String get uiRequestAccepted2 => 'Richiesta accettata!';

  @override
  String get uiRequestDeclined => 'Richiesta rifiutata';

  @override
  String get uiRequestDeclined2 => 'Richiesta rifiutata.';

  @override
  String get uiRequestNotFound => 'Richiesta non trovata';

  @override
  String get uiRequestSentSupportWillUpdateYou =>
      'Richiesta inviata. L\'assistenza ti aggiornerà nei tuoi ticket.';

  @override
  String get uiRequestsWillAppearHereWhenSenders =>
      'Le richieste appariranno qui quando i mittenti ti chiederanno di portare un pacco.';

  @override
  String get uiRequiredAgreements => 'Accordi richiesti';

  @override
  String get uiRequiredAgreements2 => 'Accordi richiesti:';

  @override
  String get uiRequiredByOurPayoutProviderTo =>
      'Richiesto dal nostro fornitore di pagamenti per verificare i bonifici in EUR/GBP.';

  @override
  String get uiReserved => 'Riservato';

  @override
  String get uiRetake => 'Riscatta';

  @override
  String get uiReviewYourTrip => 'Rivedi il tuo viaggio';

  @override
  String get uiReviewPackageRequestsFromSendersWaiting =>
      'Esamina le richieste dei mittenti che aspettano il tuo viaggio.';

  @override
  String get uiReviewYourShipmentDetailsAndConfirm =>
      'Controlla i dettagli della spedizione e conferma che l\'articolo è sicuro da spedire.';

  @override
  String get uiRewardRules => 'Regole dei premi';

  @override
  String get uiRouteDeleted => 'Percorso eliminato';

  @override
  String get uiRoutingNumberUsBanks => 'Numero di routing (banche USA)';

  @override
  String get uiStillNeedHelp => 'SERVE ANCORA AIUTO?';

  @override
  String get uiSubject => 'OGGETTO';

  @override
  String get uiSwiftBicBanksOutsideTheUs =>
      'SWIFT / BIC (banche fuori dagli USA)';

  @override
  String get uiSwiftBic => 'SWIFT/BIC';

  @override
  String get uiSwiftBic2 => 'SWIFT/BIC *';

  @override
  String get uiSafetyCheck => 'Controllo di sicurezza';

  @override
  String get uiSave => 'Salva';

  @override
  String get uiSaveBankAccount => 'Salva conto bancario';

  @override
  String get uiSearchAgain => 'Cerca di nuovo';

  @override
  String get uiSearchTravelers => 'Cerca viaggiatori';

  @override
  String get uiSearchBank => 'Cerca banca...';

  @override
  String get uiSearchBanks => 'Cerca banche...';

  @override
  String get uiSearchChatsNamesOrRoutes => 'Cerca chat, nomi o percorsi';

  @override
  String get uiSearchCity => 'Cerca città';

  @override
  String get uiSearchCityAndCountry => 'Cerca città e paese';

  @override
  String get uiSearchConversations => 'Cerca conversazioni';

  @override
  String get uiSearchCountry => 'Cerca paese';

  @override
  String get uiSearchCountryOrCurrency => 'Cerca paese o valuta';

  @override
  String get uiSearchCountryOrDialCode => 'Cerca paese o prefisso…';

  @override
  String get uiSearchCountry2 => 'Cerca paese…';

  @override
  String get uiSearchForACityOrAirport => 'Cerca città o aeroporto';

  @override
  String get uiSearchForACityOrCountry => 'Cerca città o paese';

  @override
  String get uiSecureCheckout => 'Pagamento sicuro';

  @override
  String get uiSeeAll => 'Vedi tutto';

  @override
  String get uiSeeEveryThread => 'Vedi tutte le conversazioni';

  @override
  String get uiSelectBank => 'Seleziona banca';

  @override
  String get uiSelectBank2 => 'Seleziona banca *';

  @override
  String get uiSelectARejectionReason => 'Seleziona un motivo di rifiuto.';

  @override
  String get uiSelectEveryItemContainedInThe =>
      'Seleziona ogni articolo contenuto nel pacco.';

  @override
  String get uiSelectTheCountryThatIssuedThe =>
      'Scegli il paese che ha rilasciato il documento che userai: determina quali documenti accetta la verifica.';

  @override
  String get uiSelectYourIdType => 'Seleziona il tipo di documento';

  @override
  String get uiSelected => 'Selezionato';

  @override
  String get uiSendCode => 'Invia codice';

  @override
  String get uiSendAGift => 'Invia un regalo';

  @override
  String get uiSendAPackageWithATraveler => 'Invia un pacco con un viaggiatore';

  @override
  String get uiSendKgRequest => 'Invia richiesta kg';

  @override
  String get uiSendPackage => 'Invia pacco';

  @override
  String get uiSendRequest => 'Invia richiesta';

  @override
  String get uiSendersWillSeeYourAvailableKg =>
      'I mittenti vedranno i tuoi kg disponibili e verranno abbinati di conseguenza.';

  @override
  String get uiServiceName => 'Nome del servizio';

  @override
  String get uiServiceRemoved => 'Servizio rimosso';

  @override
  String get uiSetAnAppPasscodeOrEnable =>
      'Imposta prima un codice o attiva la biometria prima di attivare lo sblocco rapido.';

  @override
  String get uiSetCountryCurrency => 'Imposta paese e valuta';

  @override
  String get uiSetUpWithdrawals => 'Configura\ni prelievi';

  @override
  String get uiSetUpAccount => 'Configura account';

  @override
  String get uiSetUpPayoutMethod => 'Configura metodo di pagamento →';

  @override
  String get uiSetYourCountryAndCurrencyFirst =>
      'Imposta prima paese e valuta: ci vuole solo un attimo.';

  @override
  String get uiSetYourCountryOfResidenceBefore =>
      'Imposta il paese di residenza prima di pagare. La valuta di pagamento dipende da quel paese.';

  @override
  String get uiSetYourRateCompetitivePricingAttracts =>
      'Imposta la tua tariffa. Prezzi competitivi attirano più mittenti.';

  @override
  String get uiShareHowTheShipmentWentSo =>
      'Racconta com\'è andata la spedizione per aiutare gli altri a scegliere meglio.';

  @override
  String get uiShareTheShippingCostSaveUp =>
      'Dividi il costo di spedizione: risparmia fino al 60%';

  @override
  String get uiShareThisPinWithTheTraveler =>
      'Condividi questo PIN con il viaggiatore per confermare la consegna.';

  @override
  String get uiShareTrip => 'Condividi viaggio';

  @override
  String get uiShareWhatWentWellOrWhat =>
      'Racconta cosa è andato bene o cosa si può migliorare...';

  @override
  String get uiShipmentRequest => 'Richiesta di spedizione';

  @override
  String get uiShipmentSummary => 'Riepilogo spedizione';

  @override
  String get uiShipmentHasBeenDeliveredWaitingFor =>
      'La spedizione è stata consegnata. In attesa della conferma del mittente.';

  @override
  String get uiShipmentReportedSupportCanNowReview =>
      'Spedizione segnalata. L\'assistenza ora può esaminare la cronologia della chat.';

  @override
  String get uiShipmentStarted => 'Spedizione avviata';

  @override
  String get uiShippingFee => 'Costo di spedizione';

  @override
  String get uiShipsToAnyDestination => 'Spedisce in qualsiasi destinazione';

  @override
  String get uiSignIn => 'Accedi';

  @override
  String get uiSignInToContinue => 'Accedi per continuare';

  @override
  String get uiSimulatorCode => 'Codice del simulatore';

  @override
  String get uiSinceYouSignedUpWithGoogle =>
      'Poiché ti sei registrato con Google/Apple, dobbiamo verificare il tuo numero prima che tu possa spedire.';

  @override
  String get uiSkipBackPhoto => 'Salta foto del retro';

  @override
  String get uiSkipForNow => 'Salta per ora';

  @override
  String get uiSold => 'Venduto';

  @override
  String get uiSomethingWentWrongPleaseTryAgain =>
      'Qualcosa è andato storto. Riprova.';

  @override
  String get uiSortCode => 'Sort code *';

  @override
  String get uiStartAConversationAnyTimeAnd =>
      'Avvia una conversazione quando vuoi e tieni tutta la cronologia in un unico posto.';

  @override
  String get uiStartALiveChatAndYour =>
      'Avvia una chat dal vivo e i tuoi messaggi appariranno qui come in una casella di assistenza condivisa.';

  @override
  String get uiStartConversation => 'Avvia conversazione';

  @override
  String get uiStartingVerification => 'Avvio della verifica…';

  @override
  String get uiStateRegion => 'Provincia / regione';

  @override
  String get uiStatusUpdated => 'Stato aggiornato!';

  @override
  String get uiStatus => 'Stato:';

  @override
  String get uiStreetAddress => 'Indirizzo';

  @override
  String get uiSubmissionFailedPleaseTryAgain => 'Invio non riuscito. Riprova.';

  @override
  String get uiSubmitForReview => 'Invia per la revisione';

  @override
  String get uiSupport => 'Assistenza';

  @override
  String get uiSupportChatIsTemporarilyUnavailablePlease =>
      'La chat di assistenza è temporaneamente non disponibile.\nScrivi a support@sendwithbago.com';

  @override
  String get uiSupportInbox => 'Casella di assistenza';

  @override
  String get uiSupportRepliesAroundTheClock =>
      'L\'assistenza risponde 24 ore su 24';

  @override
  String get uiSupportThatFeelsLikeAConversation =>
      'Un\'assistenza che sembra una conversazione';

  @override
  String get uiSupportingExplanation => 'Spiegazione';

  @override
  String get uiSwapCities => 'Inverti città';

  @override
  String get uiSystemAlerts => 'Avvisi di sistema';

  @override
  String get uiTakePhoto => 'Scatta foto';

  @override
  String get uiTakeAClearPhotoOfThe => 'Scatta una foto chiara del retro.';

  @override
  String get uiTakePhoto2 => 'Scatta foto';

  @override
  String get uiTalkToSupportNow => 'Parla subito con l\'assistenza';

  @override
  String get uiTapToAddPhoto => 'Tocca per aggiungere una foto';

  @override
  String get uiTapToCopyThisTestCode =>
      'Tocca per copiare questo codice di prova se l\'email non arriva.';

  @override
  String get uiTapToReRecord => 'Tocca per registrare di nuovo';

  @override
  String get uiTellUsThePickupAndDelivery =>
      'Indica i luoghi di ritiro e consegna della spedizione.';

  @override
  String get uiTermsConditions => 'Termini e condizioni';

  @override
  String get uiTermsOfService => 'Termini di servizio *';

  @override
  String get uiThanksForSharingYourFeedbackIt =>
      'Grazie per il tuo feedback. Aiuta gli altri a fidarsi della piattaforma.';

  @override
  String get uiThatPasscodeIsNotCorrect => 'Questo codice non è corretto.';

  @override
  String get uiThePackageIsNowInTransit => 'Il pacco è ora in transito.';

  @override
  String get uiTheRequestDetailsAreNotAvailable =>
      'I dettagli della richiesta non sono disponibili. Aggiorna e riprova.';

  @override
  String get uiTheTravelerHasMarkedThisPackage =>
      'Il viaggiatore ha segnato questo pacco come consegnato. Conferma la ricezione per sbloccare il pagamento.';

  @override
  String get uiTheTravelerMarkedThisShipmentAs =>
      'Il viaggiatore ha segnato questa spedizione come consegnata. Conferma qui la ricezione per sbloccare il pagamento.';

  @override
  String get uiTheTravellerMustBeAllowedTo =>
      'Il viaggiatore deve poter ispezionare il pacco.';

  @override
  String get uiThisAddsWeightToTheActive =>
      'Aggiunge peso alla spedizione attiva di questa chat. I dati del destinatario restano invariati.';

  @override
  String get uiThisBecomesYourWalletDisplayAnd =>
      'Sarà la valuta di visualizzazione e di pagamento del tuo portafoglio.';

  @override
  String get uiThisCategoryRequiresExtraCareYour =>
      'Questa categoria richiede più attenzione. Il viaggiatore potrebbe chiedere altri dettagli.';

  @override
  String get uiThisConversationHasBeenClosedStart =>
      'Questa conversazione è stata chiusa. Apri un nuovo ticket se hai ancora bisogno di aiuto.';

  @override
  String get uiThisDeterminesWhichDocumentTypesThe =>
      'Determina quali tipi di documento ti mostra la verifica.';

  @override
  String get uiThisIsASecureProcessThat =>
      'È una procedura sicura che richiede pochi minuti. Verificheremo la tua identità e attiveremo l\'account.';

  @override
  String get uiThisShipmentChatIsClosedPlease =>
      'Questa chat della spedizione è chiusa. Contatta l\'assistenza o apri una contestazione se necessario.';

  @override
  String get uiThisWillPermanentlyRemoveThisItem =>
      'Questo elemento verrà rimosso definitivamente dalla cronologia.';

  @override
  String get uiThisWillRemoveThisDraftShipment =>
      'Questa bozza di spedizione verrà rimossa subito. Puoi ricominciare quando vuoi.';

  @override
  String get uiThisWillRemoveYourSavedShipment =>
      'La bozza di spedizione salvata verrà rimossa. Dovrai ricominciare se vuoi inviare questo pacco.';

  @override
  String get uiThisWillRemoveYourSavedShipment2 =>
      'La bozza di spedizione salvata verrà rimossa. Dovrai ricominciare.';

  @override
  String get uiTicketNotFound => 'Ticket non trovato';

  @override
  String get uiTicketSubmittedWeLlGetBack =>
      'Ticket inviato! Ti risponderemo presto.';

  @override
  String get uiTicketsAndChatInOneFlow => 'Ticket e chat in un unico flusso';

  @override
  String get uiTime => 'Ora';

  @override
  String get uiToGetYourShipmentPayoutsTell =>
      'Per ricevere i pagamenti, dicci dove Bago deve inviare il denaro.';

  @override
  String get uiToUnlockAllFeaturesPleaseComplete =>
      'Completa la verifica dell\'identità per sbloccare tutte le funzioni.';

  @override
  String get uiToVerifyYourIdentityWeCollect =>
      'Per verificare la tua identità raccogliamo e trattiamo i tuoi dati personali, inclusi documenti ufficiali e dati biometrici. È richiesto dalla legge e dai nostri termini.';

  @override
  String get uiTotal => 'Totale';

  @override
  String get uiTotalSpace => 'Spazio totale';

  @override
  String get uiTotalWallet => 'Portafoglio totale';

  @override
  String get uiTrackingNumber => 'Numero di tracciamento';

  @override
  String get uiTravelDate => 'Data del viaggio';

  @override
  String get uiTravelType => 'Tipo di viaggio';

  @override
  String get uiTraveller => 'Viaggiatore';

  @override
  String get uiTripNumber => 'Numero del viaggio';

  @override
  String get uiTryAgain => 'Riprova';

  @override
  String get uiTryADifferentKeywordOrStart =>
      'Prova un\'altra parola chiave o avvia una conversazione con l\'assistenza per ricevere aiuto diretto.';

  @override
  String get uiTryAgain2 => 'Riprova';

  @override
  String get uiTypeAMessage => 'Scrivi un messaggio...';

  @override
  String get uiTypeCityOrCountry => 'Scrivi città o paese';

  @override
  String get uiUkBankAccount => 'CONTO BANCARIO UK';

  @override
  String get uiUkAccountNumbersMustContain8 =>
      'I numeri di conto UK devono avere 8 cifre.';

  @override
  String get uiUkSortCodesMustContain6 =>
      'I sort code UK devono avere 6 cifre.';

  @override
  String get uiUsdBankAccount => 'CONTO BANCARIO IN USD';

  @override
  String get uiUnableToLoadMessages => 'Impossibile caricare i messaggi';

  @override
  String get uiUnderReviewSendersCannotSeeThis =>
      'In revisione: i mittenti non vedono ancora questo viaggio. Lo attiveremo dopo l\'approvazione.';

  @override
  String get uiUnlimitedCapacity => 'Capacità illimitata';

  @override
  String get uiUnlockBago => 'Sblocca Bago';

  @override
  String get uiUnlockWithPasscode => 'Sblocca con codice';

  @override
  String get uiUnverified => 'Non verificato';

  @override
  String get uiUpdateStatus => 'Aggiorna stato';

  @override
  String get uiUploadingDocuments => 'Caricamento documenti…';

  @override
  String get uiUseA4To8Digit => 'Usa un codice di 4–8 cifre.';

  @override
  String get uiUseSecureCheckoutToPayBy =>
      'Usa il pagamento sicuro con carta, Apple Pay, bonifico o mobile money.';

  @override
  String get uiUsuallyRepliesInMinutes => 'Di solito risponde in pochi minuti';

  @override
  String get uiValue => 'Valore';

  @override
  String get uiVerificationCodeSentViaSms =>
      'Codice di verifica inviato via SMS.';

  @override
  String get uiVerifyEmail => 'Verifica email';

  @override
  String get uiVerifyIdentity => 'Verifica identità';

  @override
  String get uiVerifyPhone => 'Verifica telefono';

  @override
  String get uiVerifyPhoneNumber => 'Verifica numero di telefono';

  @override
  String get uiVerifyYourEmailFirst => 'Verifica prima la tua email';

  @override
  String get uiVerifyYourPhoneNumber => 'Verifica il tuo numero di telefono';

  @override
  String get uiView => 'Visualizza';

  @override
  String get uiViewDetails => 'Visualizza dettagli';

  @override
  String get uiViewImage => 'Visualizza immagine';

  @override
  String get uiViewShipmentDetails => 'Visualizza dettagli spedizione';

  @override
  String get uiVisaMastercardAmex => 'Visa, Mastercard, Amex';

  @override
  String get uiWhatWouldYouLikeMembersTo =>
      'COSA VUOI CHE I MEMBRI SAPPIANO DI TE?';

  @override
  String get uiWaitingForAnAgent => 'In attesa di un operatore';

  @override
  String get uiWeLlReviewYourDocumentsWithin =>
      'Esamineremo i tuoi documenti entro 1–2 giorni lavorativi e ti comunicheremo l\'esito.';

  @override
  String get uiWeVeSentA6Digit => 'Abbiamo inviato un codice a 6 cifre a ';

  @override
  String get uiWeightKg => 'Peso (kg)*';

  @override
  String get uiWhatAreYouSending => 'Cosa spedisci?';

  @override
  String get uiWhatHappensNext => 'Cosa succede ora?';

  @override
  String get uiWhatIsInside => 'Cosa c\'è dentro?';

  @override
  String get uiWhatWeCollect => 'Cosa raccogliamo';

  @override
  String get uiWhatWouldYouLikeToDo => 'Cosa vuoi fare?';

  @override
  String get uiWhatSYourDateOfBirth => 'Qual è la tua\ndata di nascita?';

  @override
  String get uiWhatSYourFullName => 'Qual è il tuo\nnome completo?';

  @override
  String get uiWhatSYourRole => 'Qual è il tuo\nruolo?';

  @override
  String get uiWhenAreYouTravelling => 'Quando viaggi?';

  @override
  String get uiWhenDoesYourJourneyBegin => 'Quando inizia il tuo viaggio?';

  @override
  String get uiWhereAreYouSending => 'Dove spedisci?';

  @override
  String get uiWhichCountryIssuedYourId =>
      'Quale paese ha rilasciato il tuo documento?';

  @override
  String get uiWhoReceivesThis => 'Chi lo riceve?';

  @override
  String get uiWhyABio => 'Perché una bio?';

  @override
  String get uiWhyDoYouNeedToChange =>
      'Perché devi cambiarla? (es. ti sei trasferito)';

  @override
  String get uiWithdrawEarnings => 'Preleva guadagni';

  @override
  String get uiWithdrawFunds => 'Preleva fondi';

  @override
  String get uiWithdrawAll => 'Preleva tutto';

  @override
  String get uiWithdrawalRequest => 'Richiesta di prelievo';

  @override
  String get uiWithdrawalSubmitted => 'Prelievo inviato';

  @override
  String get uiWithdrawalCouldNotBeSubmittedPlease =>
      'Impossibile inviare il prelievo. Riprova.';

  @override
  String get uiWrappedOrSealedPackagesAreNot =>
      'I pacchi incartati o sigillati non vengono rifiutati, ma devono essere ispezionati prima del ritiro.';

  @override
  String get uiWriteAShortBioAboutYourself =>
      'Scrivi una breve bio su di te...';

  @override
  String get uiYyyyMmDd => 'AAAA-MM-GG';

  @override
  String get uiYouCanChangeThisLater => 'Puoi cambiarlo in seguito';

  @override
  String get uiYouCanTrackTheStatusIn =>
      'Puoi seguire lo stato nella cronologia delle transazioni.';

  @override
  String get uiYourDetails => 'I tuoi dati';

  @override
  String get uiYourPrivacyRights => 'I tuoi diritti sulla privacy';

  @override
  String get uiYourUsdAccountNumber => 'Il tuo numero di conto in USD';

  @override
  String get uiYourAccountDoesnTHavePermission =>
      'Il tuo account non può prelevare fondi. Chiedi al titolare dell\'azienda di abilitarlo.';

  @override
  String get uiYourAccountHasBeenSuspendedDue =>
      'Il tuo account è stato sospeso per violazione dei nostri termini di servizio.';

  @override
  String get uiYourBankDetailsAreEncryptedAnd =>
      'I tuoi dati bancari sono crittografati e conservati in sicurezza. Usati solo per i pagamenti ai viaggiatori.';

  @override
  String get uiYourDataIsProcessedSecurelyAnd =>
      'I tuoi dati sono trattati in sicurezza e non verranno condivisi con terzi senza il tuo consenso.';

  @override
  String get uiYourDataIsProcessedSolelyTo =>
      'I tuoi dati sono trattati solo per verificare l\'identità e rispettare le norme antiriciclaggio (AML) e KYC. Non vengono venduti a terzi.';

  @override
  String get uiYourEarningAndPayoutCurrencyIs =>
      'La valuta dei guadagni e dei pagamenti è bloccata. Per cambiarla, invia una richiesta qui sotto o scrivi all\'assistenza.';

  @override
  String get uiYourEarnings => 'I tuoi guadagni';

  @override
  String get uiYourIssue => 'Il tuo problema:';

  @override
  String get uiYourItemsWeight => 'Peso dei tuoi articoli';

  @override
  String get uiYourMessagesWithBagoSupport =>
      'I tuoi messaggi con l\'assistenza Bago';

  @override
  String get uiYourPhoneNumberHasBeenSuccessfully =>
      'Il tuo numero è stato verificato e aggiornato nell\'account.';

  @override
  String get uiYourPrivacyMattersToUsThis =>
      'La tua privacy è importante per noi. Questa informativa spiega come Bago raccoglie, usa e protegge i tuoi dati personali.';

  @override
  String get uiEGLagosFriendsGroup => 'es. «Gruppo amici di Lagos»';

  @override
  String get uiEGAcmeLogisticsLtd => 'es. Acme Logistica S.r.l.';

  @override
  String get uiEGBago12345678 => 'es. BAGO-12345678';

  @override
  String get uiEGBarclaysLloydsMonzo => 'es. Barclays, Lloyds, Monzo';

  @override
  String get uiEGBerlin => 'es. Berlino';

  @override
  String get uiEGChasus33 => 'es. CHASUS33';

  @override
  String get uiEGChaseBankOfAmerica => 'es. Chase, Bank of America, Wise';

  @override
  String get uiEGDoe => 'es. Rossi';

  @override
  String get uiEGExpressStandard => 'es. Express, Standard';

  @override
  String get uiEGJohn => 'es. Mario';

  @override
  String get uiEGLt12345678901234 => 'es. LT12 3456 7890 1234 5678';

  @override
  String get uiEGLagosAccra => 'es. Lagos, Accra';

  @override
  String get uiEGRevolt21 => 'es. REVOLT21';

  @override
  String get uiEGRevolutN26Wise => 'es. Revolut, N26, Wise';

  @override
  String get uiEGUnitedStates => 'es. Stati Uniti';

  @override
  String get uiKg => 'kg';

  @override
  String get uiOr => 'oppure';

  @override
  String get uiTyping => 'sta scrivendo…';

  @override
  String uiFUse(Object p0) {
    return 'Usa $p0';
  }

  @override
  String uiFWalletCurrencySetTo(Object p0) {
    return 'Valuta del portafoglio impostata su $p0.';
  }

  @override
  String uiFWeSentADigitVerificationCode(Object p0) {
    return 'Abbiamo inviato un codice a 6 cifre a $p0. Inseriscilo nella schermata successiva per impostare una nuova password.';
  }

  @override
  String uiFOtpSentTo(Object p0) {
    return 'Codice inviato a $p0';
  }

  @override
  String uiFEnterTheOtpSentTo(Object p0) {
    return 'Inserisci il codice\ninviato a $p0';
  }

  @override
  String uiFResendCodeInS(Object p0) {
    return 'Invia di nuovo il codice tra $p0 s';
  }

  @override
  String uiFANewVerificationCodeWasSent(Object p0) {
    return 'È stato inviato un nuovo codice di verifica a $p0.';
  }

  @override
  String uiFHeldInEscrow(Object p0, Object p1) {
    return '$p0 $p1 in deposito';
  }

  @override
  String uiFShipmentProgressStepOf(Object p0) {
    return 'Avanzamento spedizione, passaggio $p0 di 4';
  }

  @override
  String uiFFrontOf(Object p0) {
    return 'Fronte: $p0';
  }

  @override
  String uiFBackOf(Object p0) {
    return 'Retro: $p0';
  }

  @override
  String uiFTracking(Object p0) {
    return 'Tracciamento: $p0';
  }

  @override
  String uiFShipmentNeedHelpContactSupportOr(Object p0) {
    return 'Spedizione $p0. Serve aiuto? Contatta l\'assistenza o segnala un problema.';
  }

  @override
  String uiFChargedIn(Object p0) {
    return 'Addebitato in $p0';
  }

  @override
  String uiFUnableToLoadBanksRightNow(Object p0) {
    return 'Impossibile caricare le banche ora: $p0';
  }

  @override
  String uiFWithdrawalsArePaidByTheBago(Object p0) {
    return 'I prelievi in $p0 vengono pagati dal team contabile di Bago tramite bonifico, di solito entro 1–3 giorni lavorativi. Riceverai un\'email e una notifica a ogni passaggio.';
  }

  @override
  String uiFWeSentADigitCodeTo(Object p0, Object p1) {
    return 'Abbiamo inviato via SMS un codice a 6 cifre a $p0$p1. Inseriscilo qui sotto.';
  }

  @override
  String uiFPaymentCurrency(Object p0) {
    return 'Valuta di pagamento: $p0';
  }

  @override
  String uiFCurrentOurTeamReviewsRequestsWithin(Object p0) {
    return 'Attuale: $p0. Il nostro team esamina le richieste entro 1–2 giorni lavorativi.';
  }

  @override
  String uiFWillUseForPayments(Object p0, Object p1, Object p2) {
    return '$p0 $p1 userà $p2 per i pagamenti.';
  }

  @override
  String uiFCharacters(Object p0) {
    return '$p0/250 caratteri';
  }

  @override
  String uiFPayoutSetupWasNotCompletedCurrency(Object p0) {
    return 'La configurazione dei pagamenti non è stata completata. Valuta ripristinata a $p0.';
  }

  @override
  String uiFPayoutAccountLinked(Object p0) {
    return 'Conto di pagamento in $p0 collegato.';
  }

  @override
  String uiFCurrencyRestoredTo(Object p0, Object p1) {
    return '$p0 Valuta ripristinata a $p1.';
  }

  @override
  String uiFSetUpPayouts(Object p0) {
    return 'Configurare i pagamenti in $p0?';
  }

  @override
  String uiFYouMustLinkAPayoutAccount(Object p0, Object p1) {
    return 'Devi collegare un conto di pagamento in $p0 per usare questa valuta. Se annulli, Bago manterrà $p1.';
  }

  @override
  String uiFKeep(Object p0) {
    return 'Mantieni $p0';
  }

  @override
  String uiFDataAreCollectedByBagoAnd(Object p0) {
    return 'I dati sono raccolti da Bago e trasmessi al nostro fornitore di pagamenti solo per consentire i pagamenti. $p0 Continuando, confermi che questo conto è tuo.';
  }

  @override
  String uiFCopied(Object p0) {
    return '$p0 copiato';
  }

  @override
  String uiFYouAndYourFriendEachGet(Object p0) {
    return 'Tu e il tuo amico ricevete $p0 ciascuno dopo la registrazione';
  }

  @override
  String uiFEarnAnotherWhenTheySendAn(Object p0, Object p1) {
    return 'Guadagna altri $p0 quando spediscono un articolo oltre $p1';
  }

  @override
  String uiFEarned(Object p0, Object p1) {
    return '$p0 $p1 guadagnati';
  }

  @override
  String uiFYourBalanceIsBelowTheMinimum(Object p0, Object p1) {
    return 'Il tuo saldo è inferiore al prelievo minimo di $p0 $p1.';
  }

  @override
  String uiFMinimumWithdrawalIsAcrossAllCurrencies(Object p0, Object p1) {
    return 'Il prelievo minimo è di $p0 $p1 per tutte le valute.';
  }

  @override
  String uiFWithdrawalsArePaidToYourBank(Object p0) {
    return 'I prelievi in $p0 vengono pagati sul tuo conto dal team contabile di Bago, di solito entro 1–3 giorni lavorativi. Ti avviseremo via email quando saranno approvati e pagati.';
  }

  @override
  String uiFNoTravelersAreHeadingFromTo(Object p0, Object p1) {
    return 'Al momento nessun viaggiatore va da $p0 a $p1. Torna presto!';
  }

  @override
  String uiFSendWith(Object p0) {
    return 'Invia con $p0';
  }

  @override
  String uiFDone(Object p0) {
    return 'Fatto ($p0)';
  }

  @override
  String uiFKgFree(Object p0) {
    return '$p0 kg liberi';
  }

  @override
  String uiFDeparts(Object p0) {
    return 'Parte il $p0';
  }

  @override
  String uiFValue(Object p0, Object p1) {
    return 'Valore: $p0 $p1';
  }

  @override
  String uiFOtherRequestsWaiting(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count richieste in attesa',
      one: '1 richiesta in attesa',
    );
    return '$_temp0';
  }

  @override
  String uiFSender(Object p0) {
    return 'Mittente: $p0';
  }

  @override
  String uiFCreated(Object p0) {
    return 'Creato il $p0';
  }

  @override
  String uiFUpdateShipmentTo(Object p0) {
    return 'Aggiornare la spedizione a «$p0»?';
  }

  @override
  String uiFTravelerInspectionPhotos(Object p0) {
    return 'Foto di ispezione del viaggiatore ($p0/4)';
  }

  @override
  String uiFOfConfirmed(Object p0) {
    return '$p0 di 3 confermati';
  }

  @override
  String uiFTrips(Object p0) {
    return '$p0 viaggi';
  }

  @override
  String uiFKgBooked(Object p0) {
    return '$p0 kg prenotati';
  }

  @override
  String uiFKgLeft(Object p0) {
    return '$p0 kg rimanenti';
  }

  @override
  String uiFActive(Object p0) {
    return '$p0 attivi';
  }

  @override
  String uiFOtherConversations(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count conversazioni',
      one: '1 conversazione',
    );
    return '$_temp0';
  }

  @override
  String uiFCategoryPriority(Object p0, Object p1) {
    return 'Categoria: $p0  •  Priorità: $p1';
  }

  @override
  String uiFRemoveSendersWillNoLongerSee(Object p0) {
    return 'Rimuovere «$p0»? I mittenti non lo vedranno più nella ricerca.';
  }

  @override
  String uiFSelected(Object p0) {
    return 'Selezionato: $p0';
  }

  @override
  String uiFTypicalRatesRangeFromPerKg(Object p0, Object p1) {
    return 'Le tariffe tipiche vanno da $p0 5 a $p1 20 al kg a seconda del percorso.';
  }

  @override
  String uiFAiSuggestsKg(Object p0, Object p1, Object p2) {
    return 'L\'IA suggerisce $p0 $p1–$p2/kg';
  }

  @override
  String uiFKgBooked2(Object p0) {
    return '$p0 kg prenotati';
  }

  @override
  String uiFAppearance(Object p0) {
    return 'Aspetto: $p0';
  }
}
