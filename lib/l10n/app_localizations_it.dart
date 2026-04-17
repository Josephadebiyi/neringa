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
  String get paystackSecureHelp =>
      'Completerai il pagamento in modo sicuro con Paystack.';

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
}
