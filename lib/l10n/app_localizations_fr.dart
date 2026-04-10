// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appTitle => 'Bago';

  @override
  String get accountSettings => 'Paramètres du compte';

  @override
  String get verificationStatus => 'Statut de vérification';

  @override
  String get actionRequiredVerifyIdentity =>
      'Action requise : vérifier l\'identité';

  @override
  String get kycPassed => 'KYC validé';

  @override
  String get profileSection => 'Profil';

  @override
  String get editProfile => 'Modifier le profil';

  @override
  String get paymentMethods => 'Moyens de paiement';

  @override
  String get preferencesSection => 'Préférences';

  @override
  String get notifications => 'Notifications';

  @override
  String get biometricLogin => 'Connexion biométrique';

  @override
  String get language => 'Langue';

  @override
  String get legalSection => 'Légal';

  @override
  String get termsOfService => 'Conditions d\'utilisation';

  @override
  String get privacyPolicy => 'Politique de confidentialité';

  @override
  String get deleteAccount => 'Supprimer le compte';

  @override
  String get biometricEnabledMessage =>
      'La connexion biométrique est maintenant activée.';

  @override
  String get biometricDisabledMessage =>
      'La connexion biométrique est maintenant désactivée.';

  @override
  String get languageSettingsTitle => 'Langue';

  @override
  String get languageSettingsSubtitle =>
      'Choisissez la langue que vous souhaitez utiliser dans toute l\'application.';

  @override
  String get languageChangedMessage => 'Langue mise à jour.';

  @override
  String get languageEnglish => 'Anglais';

  @override
  String get languageGerman => 'Allemand';

  @override
  String get languageFrench => 'Français';

  @override
  String get languageSpanish => 'Espagnol';

  @override
  String get languagePortuguese => 'Portugais';

  @override
  String get languageItalian => 'Italien';

  @override
  String get emailLabel => 'E-mail';

  @override
  String get emailHint => 'vous@exemple.com';

  @override
  String get passwordLabel => 'Mot de passe';

  @override
  String get passwordHint => 'Votre mot de passe';

  @override
  String get forgotPassword => 'Mot de passe oublié ?';

  @override
  String get logIn => 'Se connecter';

  @override
  String get continueWithGoogle => 'Continuer avec Google';

  @override
  String get continueWithEmail => 'Continuer avec l’e-mail';

  @override
  String get useBiometric => 'Utiliser Face ID / empreinte';

  @override
  String get notMemberYet => 'Pas encore membre ?';

  @override
  String get signUp => 'S’inscrire';

  @override
  String get pleaseFillAllFields => 'Veuillez remplir tous les champs';

  @override
  String get biometricAuthFailed => 'L’authentification biométrique a échoué.';

  @override
  String get pleaseEnterYourEmail => 'Veuillez saisir votre e-mail';

  @override
  String get pleaseEnterYourPassword => 'Veuillez saisir votre mot de passe';

  @override
  String get signInToYourAccount => 'Connectez-vous à votre compte';

  @override
  String get choosePreferredMethod => 'Choisissez votre méthode préférée';

  @override
  String get dontHaveAccount => 'Vous n’avez pas de compte ?';

  @override
  String get enterYourEmailTitle => 'Saisissez votre e-mail';

  @override
  String get verificationCodeMessage =>
      'Nous vous enverrons un code de vérification';

  @override
  String get enterYourPasswordTitle => 'Saisissez votre mot de passe';

  @override
  String get keepYourAccountSecure => 'Protégez votre compte';

  @override
  String get forgotPasswordTitle => 'Mot de passe oublié ?';

  @override
  String get forgotPasswordDescription =>
      'Entrez votre e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.';

  @override
  String get emailAddressLabel => 'Adresse e-mail';

  @override
  String get emailRequired => 'L’e-mail est requis';

  @override
  String get enterValidEmail => 'Entrez un e-mail valide';

  @override
  String get sendResetLink => 'Envoyer le lien de réinitialisation';

  @override
  String get checkYourInbox => 'Vérifiez votre boîte mail';

  @override
  String passwordResetEmailSent(Object email) {
    return 'Nous avons envoyé un lien de réinitialisation à $email. Vérifiez votre e-mail et suivez les instructions.';
  }

  @override
  String get backToSignIn => 'Retour à la connexion';

  @override
  String get resetPasswordTitle => 'Réinitialiser le mot de passe';

  @override
  String get createNewPasswordTitle => 'Créer un nouveau mot de passe';

  @override
  String get enterNewPasswordDescription =>
      'Saisissez votre nouveau mot de passe ci-dessous';

  @override
  String get newPasswordLabel => 'Nouveau mot de passe';

  @override
  String get newPasswordHint => 'Entrez le nouveau mot de passe';

  @override
  String get confirmPasswordLabel => 'Confirmer le mot de passe';

  @override
  String get confirmPasswordHint => 'Saisissez à nouveau le mot de passe';

  @override
  String get passwordsDoNotMatch => 'Les mots de passe ne correspondent pas';

  @override
  String get passwordMinLength =>
      'Le mot de passe doit contenir au moins 8 caractères';

  @override
  String get passwordResetSuccessfully =>
      'Mot de passe réinitialisé avec succès';

  @override
  String get resetPasswordButton => 'Réinitialiser le mot de passe';

  @override
  String get onboardingSlide1Title => 'Envoyez à votre façon';

  @override
  String get onboardingSlide1Description =>
      'Connectez-vous avec des voyageurs vérifiés allant dans votre direction pour un envoi rentable.';

  @override
  String get onboardingSlide2Title => 'Transformez vos kilomètres en argent';

  @override
  String get onboardingSlide2Description =>
      'Monétisez votre espace libre et livrez des colis sur votre trajet.';

  @override
  String get onboardingSlide3Title => 'Sûr, vérifié, fiable';

  @override
  String get onboardingSlide3Description =>
      'Bago utilise la vérification communautaire et le suivi en temps réel pour garantir la sécurité de chaque colis.';

  @override
  String get skip => 'Passer';

  @override
  String get next => 'Suivant';

  @override
  String get createAccount => 'Créer un compte';

  @override
  String get signupStepEmailTitle => 'Quelle est votre adresse e-mail ?';

  @override
  String get checkingEmail => 'Vérification de l’e-mail...';

  @override
  String get emailAvailable => 'L’e-mail est disponible';

  @override
  String get emailAlreadyExists => 'Cet e-mail possède déjà un compte';

  @override
  String get availableEmailRequired =>
      'Veuillez saisir une adresse e-mail disponible.';

  @override
  String get signupRestartCountry =>
      'Veuillez recommencer l’inscription et choisir à nouveau votre pays.';

  @override
  String get signupStepNameTitle => 'Quel est votre nom ?';

  @override
  String get firstNameHint => 'Prénom';

  @override
  String get lastNameHint => 'Nom';

  @override
  String get phoneNumberTitle => 'Numéro de téléphone';

  @override
  String get phoneDeliveryUpdates =>
      'Nous l’utiliserons pour les mises à jour de livraison.';

  @override
  String get phoneHint => 'Numéro de téléphone';

  @override
  String countryCodeSelected(Object dialCode, Object country) {
    return 'Indicatif $dialCode sélectionné pour $country.';
  }

  @override
  String get dobTitle => 'Quelle est votre date de naissance ?';

  @override
  String get securityTitle => 'Sécurité';

  @override
  String get signupStepCountryTitle => 'Où êtes-vous situé ?';

  @override
  String get countryCurrencyMethods =>
      'Cela détermine votre devise et les moyens de paiement disponibles.';

  @override
  String get selectedWalletSetup =>
      'Configuration du portefeuille sélectionnée';

  @override
  String currencySelection(Object currency, Object symbol) {
    return 'Devise : $currency ($symbol)';
  }

  @override
  String get verifyYourEmail => 'Vérifiez votre e-mail';

  @override
  String sentSixDigitCode(Object email) {
    return 'Nous avons envoyé un code à 6 chiffres à $email';
  }

  @override
  String get resendCode => 'Renvoyer le code';

  @override
  String resendIn(Object seconds) {
    return 'Renvoyer dans ${seconds}s';
  }

  @override
  String get resend => 'Renvoyer';

  @override
  String get welcomeToBago => 'Bienvenue sur Bago !';

  @override
  String walletSetTo(Object currency, Object symbol) {
    return 'Votre portefeuille a été configuré en $currency (${symbol}0.00)';
  }

  @override
  String get selectCountry => 'Sélectionner un pays';

  @override
  String get goToDashboard => 'Aller au tableau de bord';

  @override
  String get orLabel => 'OU';

  @override
  String get profileTabAboutYou => 'À propos de vous';

  @override
  String get profileTabAccount => 'Compte';

  @override
  String get profileFallbackUser => 'Utilisateur Bago';

  @override
  String get deleteAccountTitle => 'Supprimer le compte ?';

  @override
  String get deleteAccountMessage =>
      'Cela supprimera définitivement votre compte Bago et vous déconnectera.';

  @override
  String get cancel => 'Annuler';

  @override
  String get roleSendPackages => 'Envoyer des colis';

  @override
  String get roleEarnTraveler => 'Gagner en tant que voyageur';

  @override
  String get editPersonalDetails => 'Modifier les informations personnelles';

  @override
  String get identityVerification => 'Vérification d’identité';

  @override
  String get notSet => 'Non défini';

  @override
  String get aboutYouSection => 'À propos de vous';

  @override
  String get addMiniBio => 'Ajouter une mini bio';

  @override
  String get highlyResponsiveReliable => 'Très réactif et fiable';

  @override
  String get highlyRatedCommunity => 'Très bien noté par la communauté Bago';

  @override
  String get ratingsActivity => 'Notes et activité';

  @override
  String get ratingsLeft => 'Notes que vous avez laissées';

  @override
  String get savedRoutes => 'Trajets enregistrés';

  @override
  String get paymentsSection => 'Paiements';

  @override
  String preferredCurrency(Object currency) {
    return 'Devise préférée : $currency';
  }

  @override
  String get changePassword => 'Changer le mot de passe';

  @override
  String get payoutMethods => 'Méthodes de paiement';

  @override
  String get paymentsRefunds => 'Paiements et remboursements';

  @override
  String get supportLegal => 'Support et mentions légales';

  @override
  String get communicationPreferences => 'Préférences de communication';

  @override
  String get helpSupport => 'Aide et support';

  @override
  String get signOut => 'Se déconnecter';

  @override
  String get shipmentsTitle => 'Mes expéditions';

  @override
  String get tripsTitle => 'Mes voyages';

  @override
  String get activeTab => 'Actif';

  @override
  String get historyTab => 'Historique';

  @override
  String get nothingHereYet => 'Rien ici pour le moment';

  @override
  String get shipmentsEmptySubtitle =>
      'Vos expéditions apparaîtront ici dès que vous commencerez à utiliser Bago.';

  @override
  String get findTraveler => 'Trouver un voyageur';

  @override
  String get requestsSent => 'Demandes envoyées';

  @override
  String get requestHistory => 'Historique des demandes';

  @override
  String get requestsSentSubtitle =>
      'Demandes que vous avez envoyées aux voyageurs listés.';

  @override
  String get requestHistorySubtitle => 'Demandes terminées et refusées.';

  @override
  String get myShipmentsSection => 'Mes expéditions';

  @override
  String get shipmentHistory => 'Historique des expéditions';

  @override
  String get myShipmentsSubtitle => 'Colis que vous avez créés.';

  @override
  String get shipmentHistorySubtitle => 'Expéditions terminées et clôturées.';

  @override
  String get pendingPayment => 'Paiement en attente';

  @override
  String get finishCheckoutShipment =>
      'Terminez le paiement pour envoyer cette demande d’expédition.';

  @override
  String resumeBefore(Object time) {
    return 'Reprendre avant $time';
  }

  @override
  String get continueShipment => 'Continuer l’expédition';

  @override
  String get delete => 'Supprimer';

  @override
  String get tripsEmptySubtitle =>
      'Vos voyages et demandes reçues apparaîtront ici lorsque les voyageurs commenceront à envoyer des demandes.';

  @override
  String get seeRequests => 'Voir les demandes';

  @override
  String get incomingRequests => 'Demandes reçues';

  @override
  String get incomingRequestsSubtitle =>
      'Examinez les demandes de colis avant de les accepter ou de les refuser.';

  @override
  String get myTripsSubtitle => 'Vos itinéraires publiés.';

  @override
  String get tripHistory => 'Historique des voyages';

  @override
  String get tripHistorySubtitle => 'Voyages terminés et clôturés.';

  @override
  String get deleteTripTitle => 'Supprimer le voyage ?';

  @override
  String get deleteTripMessage => 'Cela supprimera le voyage de votre compte.';

  @override
  String get tripDeletedSuccessfully => 'Voyage supprimé avec succès';

  @override
  String get paymentReviewTitle => 'Vérifier et payer';

  @override
  String get noPendingShipmentPayment =>
      'Aucun paiement d’expédition en attente n’a été trouvé.';

  @override
  String get shipmentCurrencyMissing =>
      'La devise de l’expédition est manquante. Veuillez redémarrer le processus d’expédition depuis la page des détails du voyageur.';

  @override
  String get totalAmount => 'Montant total';

  @override
  String get shippingFee => 'Frais d’expédition';

  @override
  String get insurance => 'Assurance';

  @override
  String get route => 'Itinéraire';

  @override
  String get receiver => 'Destinataire';

  @override
  String get receiverFallback => 'Destinataire';

  @override
  String get securePayment => 'Paiement sécurisé';

  @override
  String get paystackSecureHelp =>
      'Vous finaliserez le paiement en toute sécurité avec Paystack.';

  @override
  String get stripeSecureHelp =>
      'Choisissez l’une de vos cartes enregistrées ou ajoutez-en une nouvelle avant de payer.';

  @override
  String get paymentMethod => 'Mode de paiement';

  @override
  String get noSavedCardsYet =>
      'Aucune carte enregistrée pour le moment. Ajoutez une Visa ou une Mastercard pour continuer.';

  @override
  String get shipmentPendingUntilConfirmed =>
      'Votre expédition reste en attente jusqu’à confirmation du paiement.';

  @override
  String get paymentDraftExpired =>
      'Ce brouillon de paiement a expiré et ne peut plus être finalisé.';

  @override
  String paymentCanBeResumedUntil(Object time) {
    return 'Votre expédition en attente peut être reprise jusqu’à $time.';
  }

  @override
  String get pay => 'Payer';

  @override
  String get processingPayment => 'Traitement du paiement';

  @override
  String get addCardTitle => 'Ajouter une carte';

  @override
  String get addCardDescription =>
      'Saisissez les détails de votre carte ci-dessous. Seules Visa et Mastercard sont prises en charge.';

  @override
  String get enterValidSupportedCard =>
      'Saisissez une Visa ou Mastercard valide pour continuer.';

  @override
  String get savingCard => 'Enregistrement de la carte...';

  @override
  String get saveCard => 'Enregistrer la carte';

  @override
  String get manageAllCards => 'Gérer toutes les cartes';

  @override
  String get pickupLocation => 'Lieu de retrait';

  @override
  String get deliveryLocation => 'Lieu de livraison';

  @override
  String get pickupCityPrompt => 'Quelle est votre ville de retrait ?';

  @override
  String get sendingToPrompt => 'Où envoyez-vous ?';

  @override
  String get selectCitiesFirst =>
      'Veuillez d’abord sélectionner les deux villes.';

  @override
  String get homeFallbackUser => 'Utilisateur';

  @override
  String welcomeBackName(Object name) {
    return 'Bon retour, $name';
  }

  @override
  String get homeSenderHeadline =>
      'Envoyez ou recevez des articles au-delà des frontières';

  @override
  String get homeCarrierSubtitle =>
      'Gagnez lors de votre prochain voyage avec Bago';

  @override
  String get homeSenderSubtitle =>
      'Livraison transfrontalière rapide et sécurisée';

  @override
  String get whatDoYouWantToDo => 'Que voulez-vous faire ?';

  @override
  String get topDestination => 'Destination principale';

  @override
  String get tripActivityShort => 'Activité du voyage';

  @override
  String get recentActivity => 'Activité récente';

  @override
  String get enterPickupCity => 'Saisir la ville de retrait';

  @override
  String get enterDestination => 'Saisir la destination';

  @override
  String get todayLabel => 'Aujourd’hui';

  @override
  String get findTravelerButton => 'Trouver un voyageur';

  @override
  String get earnedBalance => 'SOLDE GAGNÉ';

  @override
  String get publishNewItinerary => 'Publier un nouvel itinéraire';

  @override
  String get globalLocationSearch => 'Recherche de lieu mondiale';

  @override
  String get searchCityAirport =>
      'Recherchez une ville ou un aéroport pour choisir un lieu.';

  @override
  String get selectDate => 'Sélectionner une date';

  @override
  String get confirmDate => 'Confirmer la date';

  @override
  String get yourTripActivity => 'Votre activité de voyage';

  @override
  String get yourActivity => 'Votre activité';

  @override
  String get loadingTrips => 'Chargement de vos voyages...';

  @override
  String get loadingActivity => 'Chargement de votre activité...';

  @override
  String get shipmentsHistoryAvailable =>
      'L’historique de vos expéditions et les demandes envoyées aux voyageurs sont disponibles dans Mes expéditions.';

  @override
  String get openMyShipments => 'Ouvrir Mes expéditions';

  @override
  String get travelersAvailableToday =>
      '8 voyageurs sont disponibles aujourd’hui pour les trajets populaires';

  @override
  String get serviceSendPackage => 'Envoyer un colis';

  @override
  String get serviceBuyItems => 'Acheter des articles';

  @override
  String get serviceGiftItems => 'Offrir des articles';

  @override
  String get serviceSeeRequests => 'Voir les demandes';

  @override
  String get servicePublishTrip => 'Publier un voyage';

  @override
  String get serviceMessages => 'Messages';

  @override
  String get serviceSendPackageDesc =>
      'Envoyez facilement des articles au-delà des frontières.';

  @override
  String get serviceBuyItemsDesc =>
      'Demandez à un voyageur de faire des achats pour vous.';

  @override
  String get serviceGiftItemsDesc =>
      'Envoyez quelque chose de spécial à quelqu’un.';

  @override
  String get serviceSeeRequestsDesc =>
      'Consultez les demandes d’expédition qui vous attendent.';

  @override
  String get servicePublishTripDesc =>
      'Créez un nouvel itinéraire pour les voyageurs.';

  @override
  String get serviceMessagesDesc =>
      'Gardez toutes les conversations d’expédition au même endroit.';

  @override
  String get tripDetailsTitle => 'Détails du voyage';

  @override
  String get couldNotLoadTrip => 'Impossible de charger ce voyage.';

  @override
  String get statusLabel => 'Statut';

  @override
  String get travelTypeLabel => 'Type de voyage';

  @override
  String get departureLabel => 'Départ';

  @override
  String get capacityLabel => 'Capacité';

  @override
  String get priceLabel => 'Prix';

  @override
  String approxInCurrency(Object currency) {
    return '≈ En $currency';
  }

  @override
  String get tripProofLabel => 'Preuve du voyage';

  @override
  String get uploaded => 'Téléchargé';

  @override
  String get missing => 'Manquant';

  @override
  String get tripEditApprovalMessage =>
      'La modification de ce voyage l’envoie à nouveau à l’équipe support pour approbation. Téléchargez une preuve mise à jour si votre billet ou votre réservation a changé.';

  @override
  String get tripMissingReference =>
      'La référence des détails de ce voyage est manquante. Veuillez actualiser et réessayer.';

  @override
  String get editTrip => 'Modifier le voyage';

  @override
  String get deleteTrip => 'Supprimer le voyage';

  @override
  String get shipmentDetailsTitle => 'Détails de l’expédition';

  @override
  String get couldNotLoadShipment => 'Impossible de charger l’expédition';

  @override
  String get retry => 'Réessayer';

  @override
  String get shippingPdfTitle => 'PDF d’expédition';

  @override
  String get shippingPdfDescription =>
      'Créez un document A4 de marque avec suivi QR, chronologie et détails de l’expédition.';

  @override
  String get previewPrint => 'Aperçu / Imprimer';

  @override
  String get shareSavePdf => 'Partager / Enregistrer le PDF';

  @override
  String get feedbackSubmittedSuccessfully => 'Retour envoyé avec succès.';

  @override
  String get leaveFeedback => 'Laisser un avis';

  @override
  String get rateTravelerNote =>
      'Notez le voyageur et laissez une courte note pour les autres utilisateurs.';

  @override
  String get shareYourExperience => 'Partagez votre expérience...';

  @override
  String get submitFeedback => 'Envoyer l’avis';

  @override
  String get fromLabel => 'De';

  @override
  String get toLabel => 'À';

  @override
  String get packageDetailsTitle => 'Détails du colis';

  @override
  String get weightLabel => 'Poids';

  @override
  String get declaredValueLabel => 'Valeur déclarée';

  @override
  String get yesLabel => 'Oui';

  @override
  String get noLabel => 'Non';

  @override
  String get descriptionLabel => 'Description';

  @override
  String get senderLabel => 'Expéditeur';

  @override
  String get travelerLabel => 'Voyageur';

  @override
  String get paymentLabel => 'Paiement';

  @override
  String get pickupDateLabel => 'Date de retrait';

  @override
  String get deliveryDateLabel => 'Date de livraison';

  @override
  String get estimatedDepartureLabel => 'Départ estimé';

  @override
  String get estimatedArrivalLabel => 'Arrivée estimée';

  @override
  String get addressesTitle => 'Adresses';

  @override
  String get pickupLabel => 'Retrait';

  @override
  String get deliveryLabel => 'Livraison';

  @override
  String get nameLabel => 'Nom';

  @override
  String get phoneLabel => 'Téléphone';

  @override
  String get trackingNumberTitle => 'Numéro de suivi';

  @override
  String get copiedToClipboard => 'Copié dans le presse-papiers';

  @override
  String get totalPriceTitle => 'Prix total';

  @override
  String get feedbackCardDescription =>
      'Évaluez le voyageur et ajoutez un court commentaire pour aider les autres expéditeurs.';

  @override
  String get downloadPdf => 'Télécharger le PDF';

  @override
  String get goBack => 'Retour';

  @override
  String get searchResultsTitle => 'Résultats de recherche';

  @override
  String tripsFoundCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count voyages trouvés',
      one: '1 voyage trouvé',
    );
    return '$_temp0';
  }

  @override
  String get anyLabel => 'Peu importe';

  @override
  String get noTripsFound => 'Aucun voyage trouvé';

  @override
  String get tryAdjustingSearch => 'Essayez d’ajuster votre recherche';

  @override
  String get searchAgain => 'Rechercher à nouveau';

  @override
  String get selectBothCitiesFirst => 'Sélectionnez d’abord les deux villes';

  @override
  String get searchRequiresCities =>
      'La recherche de voyages affiche les résultats uniquement après avoir choisi une ville de départ et de destination.';

  @override
  String get passKycBeforeShipment =>
      'Veuillez réussir la vérification KYC avant de créer une expédition.';

  @override
  String kgAvailable(Object kg) {
    return '$kg kg disponibles';
  }

  @override
  String get sendWithThisCarrier => 'Envoyer avec ce voyageur';

  @override
  String get sendWithThisTraveler => 'Envoyer avec ce voyageur';

  @override
  String get sendPackageTitle => 'Envoyer un colis';

  @override
  String get findTravelerForRoute =>
      'Trouvez un voyageur pour votre itinéraire';

  @override
  String get selectPickupAndDelivery =>
      'Sélectionnez le point de collecte et la destination';

  @override
  String get anyDate => 'N’importe quelle date';

  @override
  String get findYourTravelerTitle => 'Trouvez votre voyageur';

  @override
  String get findYourTravelerDescription =>
      'Trouvez un voyageur de confiance pour transporter votre colis';

  @override
  String get setPreferredCurrencyTitle => 'Définissez votre devise préférée';

  @override
  String get needWalletCurrency =>
      'Vous devez définir la devise de votre portefeuille avant de continuer.';

  @override
  String get rateLabel => 'Évaluation';

  @override
  String get paymentFailedTitle => 'Paiement échoué';

  @override
  String draftAvailableUntil(Object time) {
    return 'Le brouillon de votre expédition reste disponible jusqu’à $time.';
  }

  @override
  String get continuePayment => 'Continuer le paiement';

  @override
  String get deleteDraft => 'Supprimer le brouillon';

  @override
  String get backToMyShipments => 'Retour à Mes expéditions';

  @override
  String get paymentNotCompleted => 'Votre paiement n’a pas été finalisé.';

  @override
  String get insufficientFundsMessage =>
      'Votre carte ne dispose pas de fonds suffisants. Essayez une autre carte ou contactez votre banque.';

  @override
  String get cardDeclinedMessage =>
      'Votre banque a refusé cette carte. Essayez une autre carte ou contactez votre banque.';

  @override
  String get incorrectCvcMessage =>
      'Le code de sécurité est incorrect. Veuillez le vérifier et réessayer.';

  @override
  String get expiredCardMessage =>
      'Cette carte a expiré. Veuillez utiliser une autre carte.';

  @override
  String get incorrectNumberMessage =>
      'Le numéro de carte semble incorrect. Veuillez le vérifier et réessayer.';

  @override
  String get bankVerificationMessage =>
      'Cette carte nécessite une vérification bancaire. Veuillez continuer et terminer la vérification dans l’application.';

  @override
  String get processingErrorMessage =>
      'Nous n’avons pas pu traiter cette carte pour le moment. Veuillez réessayer dans un instant.';

  @override
  String get paymentCancelledMessage =>
      'Le paiement a été annulé avant d’être finalisé.';

  @override
  String get paymentCouldNotCompleteGeneric =>
      'Votre paiement n’a pas pu être finalisé. Veuillez réessayer ou utiliser une autre carte.';

  @override
  String get shipmentRequestedTitle => 'Expédition demandée !';

  @override
  String get shipmentCreatedSentTraveler =>
      'Votre expédition a été créée et envoyée au voyageur sélectionné.';

  @override
  String paymentReferenceValue(Object reference) {
    return 'Référence du paiement : $reference';
  }

  @override
  String get viewShipments => 'Voir les expéditions';

  @override
  String get backToHome => 'Retour à l’accueil';

  @override
  String get trackShipmentTitle => 'Suivre l’expédition';

  @override
  String get trackYourPackage => 'Suivre votre colis';

  @override
  String get enterTrackingNumberPrompt =>
      'Entrez un numéro de suivi pour continuer.';

  @override
  String get enterTrackingNumberMessage => 'Veuillez saisir un numéro de suivi';

  @override
  String get trackingNumberLabel => 'Numéro de suivi';

  @override
  String get searchButton => 'Rechercher';

  @override
  String get searchAnother => 'Rechercher à nouveau';

  @override
  String get unknownLabel => 'Inconnu';

  @override
  String get unknownSender => 'Expéditeur inconnu';

  @override
  String get unknownReceiver => 'Destinataire inconnu';

  @override
  String get currentStatusTitle => 'Statut actuel';

  @override
  String get originLabel => 'Origine';

  @override
  String get destinationLabel => 'Destination';

  @override
  String get currentLocationLabel => 'Position actuelle';

  @override
  String get estimatedDeliveryLabel => 'Livraison estimée';

  @override
  String get pendingLabel => 'En attente';

  @override
  String get pickedUpLabel => 'Récupéré';

  @override
  String get inTransitLabel => 'En transit';

  @override
  String get outForDeliveryLabel => 'En cours de livraison';

  @override
  String get deliveredLabel => 'Livré';

  @override
  String get tripRouteOrigin => 'Origine';

  @override
  String get tripRouteDestination => 'Destination du trajet';

  @override
  String get travelModeFlight => 'Vol';

  @override
  String get travelModeBus => 'Bus';

  @override
  String get travelModeTrain => 'Train';

  @override
  String get travelModeCar => 'Voiture';

  @override
  String get travelModeShip => 'Bateau';

  @override
  String get setWalletCurrencyTitle => 'Définir la devise du portefeuille';

  @override
  String get chooseWalletCurrencyDescription =>
      'Choisissez la devise dans laquelle vous souhaitez recevoir les paiements.';

  @override
  String get confirmCurrency => 'Confirmer la devise';

  @override
  String get acceptTermsToContinue =>
      'Vous devez accepter les conditions pour continuer.';

  @override
  String get identityVerificationRequiredTrip =>
      'Vérification d’identité requise';

  @override
  String get selectDepartureCity => 'Sélectionnez la ville de départ';

  @override
  String get selectDestinationCity => 'Sélectionnez la ville de destination';

  @override
  String get departureDestinationDifferent =>
      'Le départ et la destination doivent être différents';

  @override
  String get selectTravelDate => 'Sélectionnez la date du voyage';

  @override
  String get setDepartureTime => 'Définissez l’heure de départ';

  @override
  String get uploadTripProofContinue =>
      'Téléchargez une preuve de voyage pour continuer';

  @override
  String get enterPricePerKg => 'Entrez le prix par kg';

  @override
  String get chooseTravelType => 'Choisissez le type de voyage';

  @override
  String get uploadProofOfTrip => 'Télécharger une preuve de voyage';

  @override
  String get capacityAtLeastOneKg => 'La capacité doit être d’au moins 1 kg';

  @override
  String get validPricePerKg => 'Entrez un prix valide par kg';

  @override
  String get noWalletCurrencySet => 'Aucune devise de portefeuille définie';

  @override
  String get uploadProofTitle => 'Télécharger une preuve';

  @override
  String get jpegPdfMaxSize => 'JPEG ou PDF, 2 Mo max';

  @override
  String get choosePhoto => 'Choisir une photo';

  @override
  String get jpegFromGallery => 'JPEG depuis la galerie';

  @override
  String get choosePdf => 'Choisir un PDF';

  @override
  String get boardingPassBooking =>
      'Carte d’embarquement ou confirmation de réservation';

  @override
  String get fileTooLargeUnder2mb =>
      'Fichier trop volumineux. Veuillez rester sous 2 Mo.';

  @override
  String get postTripTitle => 'Publier un voyage';

  @override
  String get departureLabelShort => 'Départ';

  @override
  String get destinationLabelShort => 'Dest.';

  @override
  String get saveChanges => 'Enregistrer les modifications';

  @override
  String get publishTripAction => 'Publier le voyage';

  @override
  String get continueLabel => 'Continuer';

  @override
  String get departureCityTitle => 'Ville de départ';

  @override
  String get departureCitySubtitle => 'D’où voyagez-vous ?';

  @override
  String get destinationCityTitle => 'Ville de destination';

  @override
  String get destinationCitySubtitle => 'Où allez-vous ?';

  @override
  String get tripUpdatedTitle => 'Voyage mis à jour';

  @override
  String get tripSubmittedTitle => 'Voyage envoyé';

  @override
  String get statusPendingReview => 'En attente de révision';

  @override
  String tripUpdatedApproval(Object destination) {
    return 'Votre voyage a été mis à jour et renvoyé à l’équipe support pour approbation.';
  }

  @override
  String tripSubmittedApproval(Object destination) {
    return 'Votre voyage a été envoyé et attend l’approbation de l’équipe support.';
  }

  @override
  String get ticketProofAttached => 'Preuve de billet jointe';

  @override
  String get pendingSupportApproval =>
      'Approbation de l’équipe support en attente';

  @override
  String get goToMyTrips => 'Voir mes voyages';

  @override
  String get almostThere => 'On y est presque !';

  @override
  String get reviewGuidelinesBeforePosting =>
      'Veuillez consulter les consignes avant de publier votre voyage.';

  @override
  String get verifyIdentityAndAgreeTerms =>
      'Vérifiez votre identité et acceptez les conditions pour continuer.';

  @override
  String get identityVerificationKyc =>
      'Une vérification d’identité KYC est requise pour cette action.';

  @override
  String get requiredToPostTrip =>
      'Vous devez valider le KYC avant de publier un voyage.';

  @override
  String get changePasswordTitle => 'Mettre à jour votre mot de passe';

  @override
  String get changePasswordDescription =>
      'Saisissez votre mot de passe actuel et choisissez-en un nouveau. Si vous vous êtes connecté avec Google ou ne connaissez pas votre mot de passe actuel, envoyez-vous plutôt un lien de réinitialisation.';

  @override
  String get currentPasswordLabel => 'Mot de passe actuel';

  @override
  String get currentPasswordHint => 'Saisissez le mot de passe actuel';

  @override
  String get confirmNewPasswordLabel => 'Confirmer le nouveau mot de passe';

  @override
  String get confirmNewPasswordHint =>
      'Saisissez à nouveau le nouveau mot de passe';

  @override
  String get newPasswordMustDiffer =>
      'Le nouveau mot de passe doit être différent du mot de passe actuel';

  @override
  String get passwordChangedSuccessfully => 'Mot de passe modifié avec succès';

  @override
  String get resetByEmailUnavailable =>
      'Réinitialisation par e-mail indisponible';

  @override
  String get forgotCurrentPasswordReset =>
      'Mot de passe actuel oublié ? Réinitialiser par e-mail';

  @override
  String get changeEmailTitle => 'Changer l’e-mail';

  @override
  String get updateYourEmail => 'Mettre à jour votre e-mail';

  @override
  String get changeEmailDescription =>
      'Saisissez la nouvelle adresse e-mail que vous souhaitez utiliser. Vous devrez la vérifier avec un OTP.';

  @override
  String get newEmailAddressLabel => 'Nouvelle adresse e-mail';

  @override
  String get sendVerificationCode => 'Envoyer le code de vérification';

  @override
  String get verifyItsYou => 'Vérifiez que c’est bien vous';

  @override
  String get weSentCodeToPrefix => 'Nous avons envoyé un code à ';

  @override
  String get weSentCodeToSuffix =>
      '. Saisissez-le ci-dessous pour confirmer le changement.';

  @override
  String get verificationCodeLabel => 'Code de vérification';

  @override
  String get updateEmailAddress => 'Mettre à jour l’adresse e-mail';

  @override
  String get changeEmailAddress => 'Changer l’adresse e-mail';

  @override
  String get enterValidEmailAddress =>
      'Veuillez saisir une adresse e-mail valide.';

  @override
  String verificationCodeSentTo(Object value) {
    return 'Code de vérification envoyé à $value';
  }

  @override
  String get enterVerificationCodePrompt =>
      'Veuillez saisir le code de vérification.';

  @override
  String get emailUpdatedSuccessfully =>
      'Adresse e-mail mise à jour avec succès !';

  @override
  String get changePhoneNumberTitle => 'Changer le numéro de téléphone';

  @override
  String get updateYourPhoneNumber => 'Mettre à jour votre numéro de téléphone';

  @override
  String changePhoneDescription(Object email) {
    return 'Saisissez le nouveau numéro de téléphone que vous souhaitez utiliser. Nous enverrons un code de vérification à $email pour confirmer le changement.';
  }

  @override
  String get newPhoneNumberLabel => 'Nouveau numéro de téléphone';

  @override
  String get enterValidPhoneNumber =>
      'Veuillez saisir un numéro de téléphone valide.';

  @override
  String get phoneNumberUpdatedSuccessfully =>
      'Numéro de téléphone mis à jour avec succès !';

  @override
  String get confirmFromYourEmail => 'Confirmez depuis votre e-mail';

  @override
  String get weSentVerificationCodeToPrefix =>
      'Nous avons envoyé un code de vérification à ';

  @override
  String get weSentVerificationCodeToSuffix =>
      '. Saisissez-le ci-dessous pour mettre à jour votre numéro de téléphone.';

  @override
  String get updatePhoneNumber => 'Mettre à jour le numéro de téléphone';

  @override
  String get changePhoneNumberAction => 'Changer le numéro de téléphone';

  @override
  String get startVerification => 'Commencer la vérification';

  @override
  String get communityGuidelinesTerms =>
      'Règles de la communauté et conditions';

  @override
  String get acceptSafetyTerms =>
      'J’accepte toutes les consignes de sécurité et les conditions légales';

  @override
  String get navHome => 'Accueil';

  @override
  String get navShipments => 'Colis';

  @override
  String get navTrips => 'Trajets';

  @override
  String get navMessages => 'Messages';

  @override
  String get navProfile => 'Profil';

  @override
  String get preferredCurrencyTitle => 'Devise préférée';

  @override
  String get currencyScreenInfo =>
      'Choisissez la devise que vous souhaitez voir dans l\'application. Cela met à jour l\'affichage de votre portefeuille, les versements et les préférences de prix.';

  @override
  String currencyUpdatedTo(Object currency) {
    return 'Devise préférée mise à jour en $currency';
  }

  @override
  String get referenceRates => 'Taux de référence';

  @override
  String get referenceRatesInfo =>
      'Ce sont les taux de conversion actuellement utilisés dans l\'application pour les devises prises en charge.';

  @override
  String get escrowProtectionTitle => 'Protection Escrow';

  @override
  String get escrowProtectionDesc =>
      '\"En Escrow\" signifie que les fonds sont sécurisés. Ils passent en \"Terminé\" une fois la livraison confirmée.';

  @override
  String get transactionHistory => 'Historique des transactions';

  @override
  String get noTransactionsYet => 'Aucune transaction pour l\'instant';

  @override
  String get noTransactionsDesc =>
      'Une fois que vous avez effectué un paiement ou reçu un remboursement, il apparaîtra ici.';

  @override
  String get helpHeroText => 'Comment pouvons-nous\nvous aider aujourd\'hui ?';

  @override
  String get quickHelp => 'Aide rapide';

  @override
  String get faqSection => 'Questions fréquentes';

  @override
  String get searchHelpHint => 'Rechercher des rubriques d\'aide...';

  @override
  String get noRatingsYet => 'Vous n\'avez pas encore laissé d\'avis.';

  @override
  String get setCurrencyFirst =>
      'Veuillez définir votre devise préférée dans les paramètres de profil avant de gérer les méthodes de paiement.';
}
