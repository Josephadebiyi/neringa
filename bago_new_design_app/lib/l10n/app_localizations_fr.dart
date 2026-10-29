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
  String get emailLabel => 'Email';

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
  String get itemImagesLabel => 'Images de l\'article';

  @override
  String get notProvidedLabel => 'Non fourni';

  @override
  String get receiverInfo => 'Informations du destinataire';

  @override
  String get escrowLabel => 'Solde de dépôt garanti';

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

  @override
  String get activityTitle => 'Activité';

  @override
  String get activityTabTrips => 'Voyages';

  @override
  String get activityTabShipments => 'Expéditions';

  @override
  String get activityTabRequests => 'Demandes';

  @override
  String get noTripsYet => 'Aucun voyage pour l\'instant';

  @override
  String get postATripCta => 'Publier un voyage';

  @override
  String get postATripSubtitle =>
      'Publiez un voyage pour commencer à gagner en transportant des colis.';

  @override
  String get noShipmentsYet => 'Aucune expédition pour l\'instant';

  @override
  String get sendAPackageCta => 'Envoyer un colis';

  @override
  String get sendAPackageSubtitle => 'Envoyez un colis et suivez-le ici.';

  @override
  String get noRequestsYet => 'Aucune demande pour l\'instant';

  @override
  String get noRequestsSubtitle =>
      'Quand vous envoyez ou recevez des demandes d\'expédition, elles apparaîtront ici.';

  @override
  String get incomingRequestsLabel => 'Demandes entrantes';

  @override
  String get sentRequestsLabel => 'Demandes envoyées';

  @override
  String get fromSenderLabel => 'De l\'expéditeur';

  @override
  String get withCarrierLabel => 'Avec le transporteur';

  @override
  String get pendingPriceLabel => 'Prix en attente';

  @override
  String get shipmentRequestFallback => 'Demande d\'expédition';

  @override
  String activeShipmentsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count expéditions actives',
      one: '1 expédition active',
    );
    return '$_temp0';
  }

  @override
  String kgFreeLabel(Object kg) {
    return '$kg kg libres';
  }

  @override
  String get ratingsAndReviewsTitle => 'Notes & Avis';

  @override
  String get noReviewsYet => 'Aucun avis pour l\'instant';

  @override
  String get noReviewsSubtitle =>
      'Les avis des expéditeurs et des voyageurs apparaîtront ici.';

  @override
  String reviewsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count avis',
      one: '1 avis',
    );
    return '$_temp0';
  }

  @override
  String get requestsSectionCarry => 'Colis à transporter';

  @override
  String get requestsSectionSending => 'Mes demandes d\'expédition';

  @override
  String get searchRequestsHint => 'Rechercher par nom ou colis...';

  @override
  String noResultsFor(Object query) {
    return 'Aucun résultat pour \"$query\"';
  }

  @override
  String get activeShipmentsSection => 'Actif';

  @override
  String get pastShipmentsSection => 'Passé';

  @override
  String get searchTripsHint => 'Rechercher par itinéraire, date ou statut...';

  @override
  String get searchShipmentsHint =>
      'Rechercher par colis, ville ou voyageur...';

  @override
  String get uiIncludingProcessingByOurIdentityVerification =>
      ', y el tratamiento por parte de nuestro socio de verificación de identidad.';

  @override
  String get ui1000Deliveries => '1 000+\nLivraisons';

  @override
  String get ui247Support => '24/7\nAssistance';

  @override
  String get ui6DigitCode => 'Code à 6 chiffres';

  @override
  String get ui9DigitAbaRoutingNumber => 'Numéro de routage ABA à 9 chiffres';

  @override
  String get uiAClearPhotoHelpsTheTraveler =>
      'Une photo nette aide le voyageur à identifier votre article';

  @override
  String get uiANewCodeHasBeenSent => 'Un nouveau code a été envoyé';

  @override
  String get uiAccountDetails => 'DÉTAILS DU COMPTE';

  @override
  String get uiAccountInformation => 'INFORMATIONS DU COMPTE';

  @override
  String get uiAccept => 'Accepter';

  @override
  String get uiAcceptContinue => 'Accepter et continuer';

  @override
  String get uiAcceptRequest => 'Accepter la demande';

  @override
  String get uiAccountHolderName => 'Nom du titulaire du compte';

  @override
  String get uiAccountHolderName2 => 'Nom du titulaire du compte *';

  @override
  String get uiAccountNumber => 'Numéro de compte';

  @override
  String get uiAccountNumber2 => 'Numéro de compte *';

  @override
  String get uiAccountSuspended => 'Compte suspendu';

  @override
  String get uiAccountVerification => 'Vérification du compte';

  @override
  String get uiAccountCreated => 'Compte créé';

  @override
  String get uiAccountHolder => 'Titulaire du compte';

  @override
  String get uiAccountNumberMustBe10Digits =>
      'Le numéro de compte doit comporter 10 chiffres.';

  @override
  String get uiActionNeeded => 'Action requise';

  @override
  String get uiActiveShipment => 'Envoi actif';

  @override
  String get uiActiveShipments => 'Envois actifs';

  @override
  String get uiAdd24PhotosAndAccept =>
      'Ajoutez 2 à 4 photos et acceptez tous les accords.';

  @override
  String get uiAddBankAccount => 'Ajouter un compte bancaire';

  @override
  String get uiAddAService => 'Ajouter un service';

  @override
  String get uiAddAnItemImageBeforeContinuing =>
      'Ajoutez une image de l\'article avant de continuer.';

  @override
  String get uiAddItemPhoto => 'Ajouter une photo de l\'article';

  @override
  String get uiAddItemPhotoOptional =>
      'Ajouter une photo de l\'article (facultatif)';

  @override
  String get uiAddKg => 'Ajouter des kg';

  @override
  String get uiAddMoreKg => 'Ajouter plus de kg';

  @override
  String get uiAddPhoto => 'Ajouter une photo';

  @override
  String get uiAddYourPayoutAccountSoYou =>
      'Ajoutez votre compte de versement pour recevoir l\'argent de vos livraisons.';

  @override
  String get uiAdditionalWeight => 'Poids supplémentaire';

  @override
  String get uiAddressLine1 => 'Adresse ligne 1 *';

  @override
  String get uiAddressLine2 => 'Adresse ligne 2';

  @override
  String get uiAfterDelivery => 'Après la livraison';

  @override
  String get uiAgeVerification => 'Vérification de l\'âge *';

  @override
  String get uiAgreementShippingConfirmation =>
      'Accord et confirmation d\'envoi';

  @override
  String get uiAllConversationsStaySynced =>
      'Toutes les conversations restent synchronisées';

  @override
  String get uiAllow => 'Autoriser';

  @override
  String get uiAllowNotifications => 'Autoriser les notifications ?';

  @override
  String get uiAmount => 'Montant';

  @override
  String get uiAnAgentWillJoinShortlyYou =>
      'Un agent va bientôt vous rejoindre. Vous pouvez envoyer un message ci-dessous.';

  @override
  String get uiAnySpecialRequirementsOrInstructions =>
      'Exigences ou instructions particulières...';

  @override
  String get uiApartmentSuiteEtcOptional =>
      'Appartement, étage, etc. (facultatif)';

  @override
  String get uiAppPasscode => 'Code de l\'app';

  @override
  String get uiAppPasscodeRemoved => 'Code de l\'app supprimé.';

  @override
  String get uiAppPasscodeSaved => 'Code de l\'app enregistré.';

  @override
  String get uiApplePay => 'Apple Pay';

  @override
  String get uiApplySuggestion => 'Appliquer la suggestion';

  @override
  String get uiAreYouSigningUpAsAn =>
      'Vous inscrivez-vous en tant que particulier ou entreprise ?';

  @override
  String get uiAreYouSureYouWantTo =>
      'Voulez-vous vraiment supprimer cet itinéraire enregistré ?';

  @override
  String get uiArrival => 'Arrivée';

  @override
  String get uiAskTheSenderOrReceiverFor =>
      'Demandez à l\'expéditeur ou au destinataire son code de remise à 4 chiffres pour confirmer la livraison et débloquer votre paiement immédiatement.';

  @override
  String get uiAtLeast8Characters => 'Au moins 8 caractères';

  @override
  String get uiAvailable => 'Disponible';

  @override
  String get uiAvailableBalance => 'Solde disponible';

  @override
  String get uiAvailableCapacity => 'Capacité disponible';

  @override
  String get uiAvailableNow => 'Disponible maintenant';

  @override
  String get uiAwaitingPaymentTapToContinue =>
      'Paiement en attente — appuyez pour continuer';

  @override
  String get uiBillingAddress => 'ADRESSE DE FACTURATION';

  @override
  String get uiBack => 'Retour';

  @override
  String get uiBackToApp => 'Retour à l\'app';

  @override
  String get uiBagoCommission => 'Commission Bago';

  @override
  String get uiBagoFee => 'Frais Bago';

  @override
  String get uiBagoGuidelines => 'Règles de Bago';

  @override
  String get uiBagoUsesFlutterwaveForSecureCheckout =>
      'Bago utilise Flutterwave pour un paiement sécurisé. Lorsque vous payez par carte, Apple Pay, virement ou mobile money, Flutterwave traite et conserve vos données de paiement en toute sécurité. Bago ne reçoit jamais les numéros de carte complets.';

  @override
  String get uiBagoWillUseThisCountryTo =>
      'Bago utilisera ce pays pour définir la devise de votre portefeuille avant la vérification d\'identité.';

  @override
  String get uiBank => 'Banque';

  @override
  String get uiBankCountry => 'Pays de la banque';

  @override
  String get uiBankName => 'Nom de la banque';

  @override
  String get uiBankName2 => 'Nom de la banque *';

  @override
  String get uiBankAccountAddedSuccessfully => 'Compte bancaire ajouté !';

  @override
  String get uiBankAccountLinkedSuccessfully => 'Compte bancaire associé !';

  @override
  String get uiBankAccountSetupCouldNotBe =>
      'Le compte bancaire n\'a pas pu être configuré. Veuillez réessayer.';

  @override
  String get uiBankCountry2 => 'Pays de la banque *';

  @override
  String get uiBioCannotBeEmpty => 'La bio ne peut pas être vide';

  @override
  String get uiBioUpdatedSuccessfully => 'Bio mise à jour';

  @override
  String get uiBiometricUnlockFailed => 'Échec du déverrouillage biométrique.';

  @override
  String get uiBookings => 'Réservations';

  @override
  String get uiBriefSummaryOfYourIssue => 'Bref résumé de votre problème';

  @override
  String get uiBrowseQuickAnswersStartALive =>
      'Parcourez les réponses rapides, lancez un chat en direct ou revenez à une conversation existante sans perdre le fil.';

  @override
  String get uiBusinessOrOrganisation => 'Entreprise ou organisation';

  @override
  String get uiBusinessServices => 'Services professionnels';

  @override
  String get uiBusinessServicesAreAvailableToBusiness =>
      'Les services professionnels sont réservés aux comptes entreprise.';

  @override
  String get uiBuyItemsAbroad => 'Acheter à l\'étranger';

  @override
  String get uiBuyItemsAbroadIsNotLive =>
      '« Acheter à l\'étranger » n\'est pas encore disponible. Bientôt.';

  @override
  String get uiByContinuingIConfirmThat => 'En continuant, je confirme que :';

  @override
  String get uiBySubmittingYouConfirmThisTrip =>
      'En envoyant, vous confirmez que ce trajet est exact. Les trajets nouveaux ou modifiés sont de nouveau soumis à l\'équipe d\'assistance avant publication.';

  @override
  String get uiCategory => 'CATÉGORIE';

  @override
  String get uiCalculatingCheckoutTotal => 'Calcul du total...';

  @override
  String get uiCanTFindItCheckYour => 'Introuvable ? Vérifiez vos spams.';

  @override
  String get uiCardsAreSavedDuringCheckout =>
      'Les cartes sont enregistrées lors du paiement';

  @override
  String get uiCarrierLogisticsCompanyName =>
      'Nom du transporteur / de la société logistique';

  @override
  String get uiCategory2 => 'Catégorie';

  @override
  String get uiChange => 'Modifier';

  @override
  String get uiChangeNumber => 'Changer de numéro';

  @override
  String get uiChangingThisAccountRequiresAConfirmation =>
      'La modification de ce compte nécessite un code de confirmation envoyé par e-mail.';

  @override
  String get uiChatClosed => 'Chat fermé';

  @override
  String get uiChatIsNotAvailableForThis =>
      'Le chat n\'est pas encore disponible pour cet envoi.';

  @override
  String get uiChatSafelyByStayingWithinBago =>
      'Discutez en toute sécurité sur Bago. Nous protégeons vos paiements et vos données.';

  @override
  String get uiChatWithSupport => 'Discuter avec l\'assistance';

  @override
  String get uiCheckYourInboxForTheVerification =>
      'Consultez votre boîte de réception pour l\'e-mail de vérification envoyé à l\'inscription. Une fois vérifié, c\'est bon.';

  @override
  String get uiChooseFromLibrary => 'Choisir dans la photothèque';

  @override
  String get uiChooseYourEarningCurrencyThisWill =>
      'Choisissez votre devise de gains. Elle sera verrouillée après confirmation et ne pourra être modifiée que par l\'assistance.';

  @override
  String get uiCity => 'Ville *';

  @override
  String get uiCityCountry => 'Ville, pays';

  @override
  String get uiCityAirportStation => 'Ville, aéroport, gare...';

  @override
  String get uiComingSoon => 'Bientôt disponible';

  @override
  String get uiCommunication => 'Communication';

  @override
  String get uiCommunityVerified => 'Communauté\nvérifiée';

  @override
  String get uiCompany => 'Entreprise';

  @override
  String get uiCompleteSignup => 'Terminer l\'inscription';

  @override
  String get uiCompleteIdentityVerificationBeforeAddingA =>
      'Terminez la vérification d\'identité avant d\'ajouter un compte de versement.';

  @override
  String get uiCompleteIdentityVerificationBeforeChangingPayout =>
      'Terminez la vérification d\'identité avant de changer la devise de versement.';

  @override
  String get uiCompleteYourProfile => 'Complétez votre profil';

  @override
  String get uiConfirm => 'Confirmer';

  @override
  String get uiConfirmBankAccount => 'Confirmer le compte bancaire';

  @override
  String get uiConfirmDeliveryGetPaid => 'Confirmer la livraison et être payé';

  @override
  String get uiConfirmUkBankAccount =>
      'Confirmer le compte bancaire britannique';

  @override
  String get uiConfirmUsdBankAccount => 'Confirmer le compte bancaire en USD';

  @override
  String get uiConfirmCountry => 'Confirmer le pays';

  @override
  String get uiConfirmDelivery => 'Confirmer la livraison';

  @override
  String get uiConfirmDeliveryToReleaseThePayment =>
      'Confirmez la livraison pour débloquer le paiement.';

  @override
  String get uiConfirmDelivery2 => 'Confirmer la livraison ?';

  @override
  String get uiConfirmPasscode => 'Confirmer le code';

  @override
  String get uiConfirmThisOnlyAfterThePackage =>
      'Ne confirmez qu\'une fois le colis entre vos mains. Cela débloquera le paiement au voyageur.';

  @override
  String get uiConfirmWithdrawal => 'Confirmer le retrait';

  @override
  String get uiConfirmYourBank => 'Confirmez votre banque';

  @override
  String get uiConfirmYourCountry => 'Confirmez votre pays';

  @override
  String get uiConfirmationCodeCopied => 'Code de confirmation copié.';

  @override
  String get uiConfirmingReceiptWillReleasePaymentTo =>
      'Confirmer la réception débloque le paiement au voyageur. Ne le faites qu\'une fois le colis reçu.';

  @override
  String get uiConnectionError => 'Erreur de connexion';

  @override
  String get uiContactSupport => 'Contacter l\'assistance';

  @override
  String get uiContactSupport2 => 'Contacter l\'assistance';

  @override
  String get uiContinueAsGuest => 'Continuer en tant qu\'invité';

  @override
  String get uiContinueBrowsing => 'Continuer la navigation';

  @override
  String get uiContinueToPayment => 'Continuer vers le paiement';

  @override
  String get uiContinueWithApple => 'Continuer avec Apple';

  @override
  String get uiConversationWithBagoSupport =>
      'Conversation avec l\'assistance Bago';

  @override
  String get uiCouldNotConfirmTheCodePlease =>
      'Le code n\'a pas pu être confirmé. Veuillez réessayer.';

  @override
  String get uiCouldNotLoadBanksPleaseTry =>
      'Impossible de charger les banques. Veuillez réessayer.';

  @override
  String get uiCouldNotLoadMap => 'Impossible de charger la carte';

  @override
  String get uiCouldNotLoadRequests => 'Impossible de charger les demandes';

  @override
  String get uiCouldNotLoadShipmentDetailsPlease =>
      'Impossible de charger les détails de l\'envoi. Veuillez réessayer.';

  @override
  String get uiCouldNotLoadShipments => 'Impossible de charger les envois';

  @override
  String get uiCouldNotLoadTrips => 'Impossible de charger les trajets';

  @override
  String get uiCouldNotSendTheRequestPlease =>
      'La demande n\'a pas pu être envoyée. Veuillez réessayer.';

  @override
  String get uiCouldNotUpdateWalletCurrencyPlease =>
      'Impossible de mettre à jour la devise du portefeuille. Veuillez réessayer.';

  @override
  String get uiCountryOfResidence => 'Pays de résidence';

  @override
  String get uiCreateAccount => 'Créer un compte';

  @override
  String get uiCreateGroupShipment => 'Créer un envoi groupé';

  @override
  String get uiCreateAPassword => 'Créez un\nmot de passe';

  @override
  String get uiCreateAFreeAccountOrSign =>
      'Créez un compte gratuit ou connectez-vous pour réserver un transporteur et envoyer votre colis.';

  @override
  String get uiCreateAGroupShippingRequest =>
      'Créer une demande d\'envoi groupé';

  @override
  String get uiCreateYourAccount => 'Créez votre\ncompte';

  @override
  String get uiCreditDebitCard => 'Carte de crédit / débit';

  @override
  String get uiCurrency => 'Devise';

  @override
  String get uiCurrencyNotSet => 'Devise non définie';

  @override
  String get uiCurrentLocationOptional => 'Position actuelle (facultatif)';

  @override
  String get uiCurrentShipments => 'Envois en cours';

  @override
  String get uiDataProtectionConsent =>
      'Protection des données et consentement';

  @override
  String get uiDate => 'Date';

  @override
  String get uiDateOfBirth => 'Date de naissance';

  @override
  String get uiDateOfBirth2 => 'Date de naissance *';

  @override
  String get uiDecline => 'Refuser';

  @override
  String get uiDeleteRoute => 'Supprimer l\'itinéraire';

  @override
  String get uiDeliveryAddress => 'Adresse de livraison';

  @override
  String get uiDeliveryConfirmedPaymentReleasedToTraveler =>
      'Livraison confirmée ! Paiement débloqué au voyageur.';

  @override
  String get uiDepartureTime => 'Heure de départ';

  @override
  String get uiDescribeYourItemSoYourTraveler =>
      'Décrivez votre article pour que le voyageur sache à quoi s\'attendre.';

  @override
  String get uiDiscard => 'Abandonner';

  @override
  String get uiDiscardDraft => 'Abandonner le brouillon ?';

  @override
  String get uiDocumentsSubmitted => 'Documents envoyés';

  @override
  String get uiDropOffAddress => 'Adresse de dépôt';

  @override
  String get uiEarnByCarryingPackagesOnYour =>
      'Gagnez de l\'argent en transportant des colis pendant votre trajet';

  @override
  String get uiEditBio => 'Modifier la bio';

  @override
  String get uiEmailAddress => 'Adresse e-mail';

  @override
  String get uiEmailNotifications => 'Notifications par e-mail';

  @override
  String get uiEmailSupport => 'Assistance par e-mail';

  @override
  String get uiEmailChangesAreHandledThroughVerification =>
      'Les changements d\'e-mail passent par une vérification.';

  @override
  String get uiEnter48Digits => 'Saisissez 4 à 8 chiffres';

  @override
  String get uiEnterAValidPhoneNumber5 =>
      'Saisissez un numéro valide (5 à 15 chiffres uniquement).';

  @override
  String get uiEnterAValidShipmentWeight =>
      'Saisissez un poids d\'envoi valide.';

  @override
  String get uiEnterAccountNumber => 'Saisissez le numéro de compte';

  @override
  String get uiEnterAll4Digits => 'Saisissez les 4 chiffres';

  @override
  String get uiEnterAmount => 'Saisissez le montant';

  @override
  String get uiEnterTheCode => 'Saisissez le code';

  @override
  String get uiEnterTheAdditionalKg => 'Saisissez les kg supplémentaires.';

  @override
  String get uiEnterWithdrawalCode => 'Saisissez le code de retrait';

  @override
  String get uiEnterYourEmail => 'Saisissez votre\ne-mail';

  @override
  String get uiEnterYourPhoneNumber => 'Saisissez votre\nnuméro de téléphone';

  @override
  String get uiEnterYourAppPasscode => 'Saisissez le code de l\'app.';

  @override
  String get uiEnterYourEmailAndWeWill =>
      'Saisissez votre e-mail et nous vous enverrons un code à 6 chiffres pour réinitialiser votre mot de passe.';

  @override
  String get uiEnterYourPasscode => 'Saisissez votre code';

  @override
  String get uiEnterYourRegisteredBusinessName =>
      'Saisissez la raison sociale de votre entreprise';

  @override
  String get uiEnterYourRouteToSeeAvailable =>
      'Saisissez votre itinéraire pour voir les voyageurs disponibles.';

  @override
  String get uiEverythingLookRightPublishWhenReady =>
      'Tout est correct ? Publiez quand vous êtes prêt.';

  @override
  String get uiEverythingStaysInOneThreadSo =>
      'Tout reste dans un même fil pour y revenir à tout moment, comme dans une messagerie.';

  @override
  String get uiExplainWhyYouAreRejectingThe =>
      'Expliquez pourquoi vous refusez le colis.';

  @override
  String get uiExternalCarrierTracking => 'Suivi transporteur externe';

  @override
  String get uiFrequentlyAskedQuestions => 'QUESTIONS FRÉQUENTES';

  @override
  String get uiFaceIdOrTouchId => 'Face ID ou Touch ID';

  @override
  String get uiFactorySealedEvidence => 'Preuve de scellé d\'usine';

  @override
  String get uiFailedToSaveNamePleaseTry =>
      'Impossible d\'enregistrer le nom. Veuillez réessayer.';

  @override
  String get uiFailedToUpdateBio => 'Impossible de mettre à jour la bio';

  @override
  String get uiFailedToUpdatePreferences =>
      'Impossible de mettre à jour les préférences';

  @override
  String get uiFailedToUpdateProfile => 'Impossible de mettre à jour le profil';

  @override
  String get uiFindARoute => 'Trouver un itinéraire';

  @override
  String get uiFindATravelerToCarryYour =>
      'Trouvez un voyageur pour transporter votre colis.';

  @override
  String get uiFindAnswersToCommonQuestionsBelow =>
      'Retrouvez ci-dessous les réponses aux questions fréquentes.';

  @override
  String get uiFindingTravelersOnThisRoute =>
      'Recherche de voyageurs sur cet itinéraire…';

  @override
  String get uiFirstName => 'Prénom *';

  @override
  String get uiForComplexIssues => 'Pour les demandes complexes';

  @override
  String get uiForYourSafetyTheSenderMust =>
      'Pour votre sécurité, l\'expéditeur doit ouvrir le colis et vous laisser inspecter tous les articles avant la prise en charge.\n\nN\'acceptez pas de colis scellés ni d\'articles que vous n\'avez pas inspectés vous-même.';

  @override
  String get uiForYourSecurityPleaseUnlockThe =>
      'Pour votre sécurité, déverrouillez l\'app pour continuer.';

  @override
  String get uiFromGallery => 'Depuis la galerie';

  @override
  String get uiFromWizard => 'Depuis l\'assistant';

  @override
  String get uiFullName => 'Nom complet';

  @override
  String get uiFullName2 => 'Nom complet';

  @override
  String get uiFullNameOnTheAccount => 'Nom complet du titulaire';

  @override
  String get uiFullNameOnTheBankAccount => 'Nom complet sur le compte bancaire';

  @override
  String get uiGbpPayoutsUseAUkSort =>
      'Les versements en GBP utilisent un sort code britannique et un numéro de compte.';

  @override
  String get uiGetInstantUpdatesAboutMessagesShipment =>
      'Recevez des alertes instantanées sur les messages, les envois et la livraison.';

  @override
  String get uiGetMatchedWithACarrierTogether =>
      'Trouvez ensemble un transporteur';

  @override
  String get uiGiftItemsIsNotLiveYet =>
      '« Envoyer des cadeaux » n\'est pas encore disponible. Bientôt.';

  @override
  String get uiGoogleSignInCanBeUnreliable =>
      'La connexion Google peut être instable sur le simulateur iPhone. En cas de blocage, utilisez la connexion par e-mail et testez Google sur un vrai appareil.';

  @override
  String get uiGotIt => 'Compris';

  @override
  String get uiGroupShipping => 'Envoi groupé';

  @override
  String get uiGroupShippingRequestCreatedShareWith =>
      'Demande d\'envoi groupé créée ! Partagez-la avec votre groupe.';

  @override
  String get uiHowItWorks => 'COMMENT ÇA MARCHE';

  @override
  String get uiHandoverPin => 'Code de remise';

  @override
  String get uiHandoverConfirmedFundsReleased =>
      'Remise confirmée ! Fonds débloqués.';

  @override
  String get uiHowCanWeHelp => 'Comment pouvons-nous vous aider ?';

  @override
  String get uiHowManyKgCanYouCarry =>
      'Combien de kg pouvez-vous transporter ?';

  @override
  String get uiHowWeUseIt => 'Comment nous les utilisons';

  @override
  String get uiHowWouldYouLikeToSign =>
      'Comment souhaitez-vous vous inscrire ?';

  @override
  String get uiIReceivedMyPackage => 'J\'ai reçu mon colis';

  @override
  String get uiIAcceptResponsibilityForThisPackage =>
      'J\'accepte la responsabilité de ce colis dès sa prise en charge et je comprends que cet accord sera signé électroniquement et conservé avec la commande.';

  @override
  String get uiIAcknowledgeThatMyPersonalData =>
      'Je reconnais que mes données personnelles seront traitées conformément à la politique de confidentialité.';

  @override
  String get uiIAgreeToFollowBagoS =>
      'Je m\'engage à respecter les règles de Bago et à assumer la responsabilité de mon envoi.';

  @override
  String get uiIAgreeToThePlatformS =>
      'J\'accepte les conditions générales d\'utilisation de Bago.';

  @override
  String get uiIAgreeStartVerification =>
      'J\'accepte — Commencer la vérification';

  @override
  String get uiIConfirmThatIAm18 => 'Je confirme avoir 18 ans ou plus.';

  @override
  String get uiIConfirmThatMyShipmentDoes =>
      'Je confirme que mon envoi ne contient aucun article interdit et respecte la politique de Bago.';

  @override
  String get uiIConsentToTheCollectionAnd =>
      'J\'accepte la collecte et le traitement de mes données personnelles comme décrit dans la ';

  @override
  String get uiIHavePersonallyInspectedTheContents =>
      'J\'ai personnellement inspecté le contenu et confirme que les articles correspondent à la description.';

  @override
  String get uiIHaveReadAndAgreeTo => 'J\'ai lu et j\'accepte les ';

  @override
  String get uiIUnderstandAndAgreeToAll =>
      'Je comprends et j\'accepte toutes les conditions';

  @override
  String get uiIUnderstandThatIMustNot =>
      'Je comprends que je ne dois pas transporter d\'articles illégaux, dangereux, restreints, non déclarés ou suspects.';

  @override
  String get uiIUnderstandTheTravelerMayInspect =>
      'Je comprends que le voyageur peut inspecter le contenu pour des raisons de sécurité et de conformité.';

  @override
  String get uiIWouldLikeToReceivePromotional =>
      'Je souhaite recevoir des offres promotionnelles et des actualités par e-mail.';

  @override
  String get uiIban => 'IBAN *';

  @override
  String get uiIdVerified => 'Identité\nvérifiée';

  @override
  String get uiIdentityVerificationRequired =>
      'Vérification d\'identité requise';

  @override
  String get uiIdentityVerificationApproved =>
      'Vérification d\'identité approuvée !';

  @override
  String get uiImageUnavailable => 'Image indisponible';

  @override
  String get uiInEscrow => 'En séquestre';

  @override
  String get uiInbox => 'Messages';

  @override
  String get uiIndividual => 'Particulier';

  @override
  String get uiInsufficientBalance => 'Solde insuffisant.';

  @override
  String get uiInsuranceIncluded => 'Assurance incluse';

  @override
  String get uiInsuredDelivery => 'Livraison\nassurée';

  @override
  String get uiInviteOthersWithTheSameDestination =>
      'Invitez d\'autres personnes vers la même destination';

  @override
  String get uiItemCategory => 'Catégorie de l\'article';

  @override
  String get uiItemDescription => 'Description de l\'article';

  @override
  String get uiJohnDoe => 'Jean Dupont';

  @override
  String get uiJourneyMap => 'Carte du trajet';

  @override
  String get uiKeep => 'Garder';

  @override
  String get uiKeepTheSenderUpdatedOnThe =>
      'Tenez l\'expéditeur informé de l\'avancement de l\'envoi.';

  @override
  String get uiLinkedPayoutAccount => 'COMPTE DE VERSEMENT ASSOCIÉ';

  @override
  String get uiLocationInformation => 'INFORMATIONS DE LOCALISATION';

  @override
  String get uiLastName => 'Nom *';

  @override
  String get uiLastUpdatedJuly152026 =>
      'Dernière mise à jour : 15 juillet 2026';

  @override
  String get uiLastUpdatedJuly172026 =>
      'Dernière mise à jour : 17 juillet 2026';

  @override
  String get uiLinkBankAccount => 'Associer un compte bancaire';

  @override
  String get uiListTheItemsYouWantTo => 'Listez les articles à envoyer...';

  @override
  String get uiLiveChat => 'Chat en direct';

  @override
  String get uiLiveChat2 => 'Chat en direct';

  @override
  String get uiLivenessCheck => 'Contrôle du vivant';

  @override
  String get uiLoadingMap => 'Chargement de la carte...';

  @override
  String get uiLocked => 'Verrouillé';

  @override
  String get uiLogout => 'Déconnexion';

  @override
  String get uiMmDdYyyy => 'JJ/MM/AAAA';

  @override
  String get uiMyBio => 'MA BIO';

  @override
  String get uiMakeSureAllTextIsClearly =>
      'Assurez-vous que tout le texte est bien lisible et sans reflet.';

  @override
  String get uiManage => 'Gérer';

  @override
  String get uiMarketingCommunications => 'Communications marketing';

  @override
  String get uiMembersWithABioAre3x =>
      'Les membres avec une bio ont 3 fois plus de chances d\'être réservés. Un profil complet inspire confiance dans la communauté Bago.';

  @override
  String get uiMessage => 'Message';

  @override
  String get uiMethod => 'Méthode';

  @override
  String get uiMinimum => 'Minimum';

  @override
  String get uiMyShipmentDoesNotContainAny =>
      'Mon envoi ne contient aucun article interdit ou restreint.';

  @override
  String get uiNotificationSettings => 'PARAMÈTRES DE NOTIFICATION';

  @override
  String get uiNameAndDateOfBirthAre =>
      'Le nom et la date de naissance sont verrouillés après la vérification d\'identité.';

  @override
  String get uiNameMustBeAtLeast2 =>
      'Le nom doit comporter au moins 2 caractères';

  @override
  String get uiNewConversation => 'Nouvelle conversation';

  @override
  String get uiNewShipment => 'Nouvel envoi';

  @override
  String get uiNewShipmentRequest => 'Nouvelle demande d\'envoi';

  @override
  String get uiNewTicket => 'Nouveau ticket';

  @override
  String get uiNoActiveConversationsYet => 'Aucune conversation active';

  @override
  String get uiNoBanksFound => 'Aucune banque trouvée';

  @override
  String get uiNoCitiesFound => 'Aucune ville trouvée';

  @override
  String get uiNoHelpArticlesMatchedThatSearch =>
      'Aucun article d\'aide ne correspond à cette recherche';

  @override
  String get uiNoPayoutMethodLinked => 'Aucun moyen de versement associé';

  @override
  String get uiNoProhibitedItems => 'Aucun article interdit';

  @override
  String get uiNoRecentSearches => 'Aucune recherche récente';

  @override
  String get uiNoReferredUsersYet =>
      'Aucun utilisateur parrainé pour l\'instant.';

  @override
  String get uiNoSavedRoutesFound => 'Aucun itinéraire enregistré.';

  @override
  String get uiNoServicesYetAddANamed =>
      'Aucun service pour l\'instant. Ajoutez un tarif nommé comme « Express » ou « Standard » — les expéditeurs le verront tarifé comme n\'importe quel trajet dans l\'app.';

  @override
  String get uiNoTravelersYet => 'Aucun voyageur pour l\'instant';

  @override
  String get uiNone => 'Aucun';

  @override
  String get uiNotNow => 'Pas maintenant';

  @override
  String get uiNoteForTravelerOptional => 'Note pour le voyageur (facultatif)';

  @override
  String get uiNoteToTraveler => 'Note au voyageur';

  @override
  String get uiNotesOptional => 'Notes (facultatif)';

  @override
  String get uiOpen => 'Ouvert';

  @override
  String get uiOpenBoxInspectionRequired => 'Inspection colis ouvert requise';

  @override
  String get uiOpenChat => 'Ouvrir le chat';

  @override
  String get uiOpenSettings => 'Ouvrir les réglages';

  @override
  String get uiOpenInbox => 'Ouvrir les messages';

  @override
  String get uiOpenToInspection => 'Ouvert à l\'inspection';

  @override
  String get uiOpenWebSupport => 'Ouvrir l\'assistance web';

  @override
  String get uiOptional => 'Facultatif';

  @override
  String get uiOptionalPreferences => 'Préférences facultatives';

  @override
  String get uiOptionalHandlingInstructions =>
      'Instructions de manutention facultatives…';

  @override
  String get uiOptionalSkipIfYourIdHas =>
      'Facultatif — ignorez si votre pièce n\'a pas de verso';

  @override
  String get uiOptional2 => 'Facultatif :';

  @override
  String get uiOriginCountry => 'Pays d\'origine';

  @override
  String get uiOurTeamWillReviewYourIdentity =>
      'Notre équipe examinera vos documents d\'identité sous 1 à 2 jours ouvrés. Vous serez notifié une fois terminé.';

  @override
  String get uiPackageDeclaration => 'DÉCLARATION DU COLIS';

  @override
  String get uiPersonalInformation => 'INFORMATIONS PERSONNELLES';

  @override
  String get uiPopularCities => 'VILLES POPULAIRES';

  @override
  String get uiProofOfCollectionRequired => 'PREUVE DE PRISE EN CHARGE REQUISE';

  @override
  String get uiPackage => 'Colis';

  @override
  String get uiPackageUnderReviewDoNotTransport =>
      'Colis en cours d\'examen\nNe transportez pas et ne récupérez pas ce colis pendant que Bago examine les preuves.';

  @override
  String get uiPasscode => 'Code';

  @override
  String get uiPasscodesDoNotMatch => 'Les codes ne correspondent pas.';

  @override
  String get uiPaymentAndConversionFees => 'Frais de paiement et de conversion';

  @override
  String get uiPaymentDetailsAreProcessedByFlutterwave =>
      'Les données de paiement sont traitées par Flutterwave. Bago ne conserve que des références sécurisées pour l\'assistance, les remboursements et le suivi.';

  @override
  String get uiPayoutCurrency => 'Devise de versement';

  @override
  String get uiPayoutStatus => 'Statut du versement';

  @override
  String get uiPayoutStatusRefreshed => 'Statut du versement actualisé.';

  @override
  String get uiPayoutsReleaseAfterDeliveryIsComplete =>
      'Les versements sont débloqués une fois la livraison terminée, confirmée et validée.';

  @override
  String get uiPersonalAccount => 'Compte personnel';

  @override
  String get uiPhoneNumberUpdated => 'Numéro de téléphone mis à jour !';

  @override
  String get uiPhoneNumber => 'Numéro de téléphone';

  @override
  String get uiPhoneNumberChangesAreConfirmedWith =>
      'Les changements de numéro sont confirmés par un code envoyé par e-mail.';

  @override
  String get uiPickUpWhereYouLeftOff => 'Reprenez là où vous vous êtes arrêté';

  @override
  String get uiPickupAndDestinationCitiesMustBe =>
      'Les villes de départ et d\'arrivée doivent être différentes.';

  @override
  String get uiPleaseAcceptAllRequiredTerms =>
      'Veuillez accepter toutes les conditions requises';

  @override
  String get uiPleaseAgreeToTheTermsAnd =>
      'Veuillez accepter les conditions générales';

  @override
  String get uiPleaseConfirmYourLegalNameAnd =>
      'Veuillez confirmer votre nom légal et votre date de naissance exactement comme sur votre pièce d\'identité. Ils doivent correspondre pour que la vérification réussisse.';

  @override
  String get uiPleaseDescribeYourIssue => 'Veuillez décrire votre problème';

  @override
  String get uiPleaseEnterAValid10Digit =>
      'Saisissez un numéro de compte valide à 10 chiffres';

  @override
  String get uiPleaseEnterAValidIban => 'Veuillez saisir un IBAN valide.';

  @override
  String get uiPleaseEnterAValidOtp => 'Veuillez saisir un code valide';

  @override
  String get uiPleaseEnterAValidAccountNumber =>
      'Veuillez saisir un numéro de compte valide.';

  @override
  String get uiPleaseEnterAValidAmount => 'Veuillez saisir un montant valide.';

  @override
  String get uiPleaseEnterThe6DigitCode =>
      'Veuillez saisir le code à 6 chiffres';

  @override
  String get uiPleaseEnterThe6DigitCode2 =>
      'Veuillez saisir le code à 6 chiffres.';

  @override
  String get uiPleaseEnterTheSwiftBicCode =>
      'Veuillez saisir le code SWIFT/BIC.';

  @override
  String get uiPleaseEnterTheAccountHolderName =>
      'Veuillez saisir le nom du titulaire.';

  @override
  String get uiPleaseEnterYourDateOfBirth =>
      'Veuillez saisir votre date de naissance';

  @override
  String get uiPleaseEnterYourFirstAndLast =>
      'Veuillez saisir votre prénom et votre nom';

  @override
  String get uiPleaseEnterYourFullName => 'Veuillez saisir votre nom complet';

  @override
  String get uiPleaseEnterYourNameSoWe =>
      'Saisissez votre nom pour que nous sachions comment vous appeler.';

  @override
  String get uiPleaseEnterYourPhoneNumber =>
      'Veuillez saisir votre numéro de téléphone';

  @override
  String get uiPleaseEnterYourRealNameSo =>
      'Saisissez votre vrai nom pour que les autres sachent avec qui ils échangent.';

  @override
  String get uiPleaseFillAllRequiredFields =>
      'Veuillez remplir tous les champs obligatoires';

  @override
  String get uiPleaseFillInAllReceiverDetails =>
      'Veuillez renseigner toutes les informations du destinataire.';

  @override
  String get uiPleaseFillInTheRequiredFields =>
      'Veuillez remplir les champs obligatoires';

  @override
  String get uiPleaseFillInYourAddressStreet =>
      'Veuillez saisir votre adresse (rue, ville, code postal et pays).';

  @override
  String get uiPleaseLinkABankAccountBefore =>
      'Veuillez associer un compte bancaire avant de retirer.';

  @override
  String get uiPleaseReadAndConfirmEachStatement =>
      'Veuillez lire et confirmer chaque déclaration avant d\'envoyer votre colis.';

  @override
  String get uiPleaseReadTheseTermsOfService =>
      'Veuillez lire attentivement ces conditions avant d\'utiliser Bago. Elles régissent l\'utilisation de notre plateforme et de nos services.';

  @override
  String get uiPleaseReviewOurPolicies => 'Veuillez lire\nnos règles';

  @override
  String get uiPleaseSelectABank => 'Veuillez choisir une banque';

  @override
  String get uiPleaseSelectABankAndEnter =>
      'Choisissez une banque et saisissez le numéro de compte.';

  @override
  String get uiPleaseSelectARole => 'Veuillez choisir un rôle';

  @override
  String get uiPleaseSelectAnAuthenticationMethod =>
      'Veuillez choisir une méthode de connexion';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn =>
      'Définissez votre devise préférée dans les paramètres du profil avant de continuer.';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn2 =>
      'Définissez votre devise préférée dans les paramètres du profil avant de demander un envoi.';

  @override
  String get uiPleaseSetYourPreferredCurrencyIn3 =>
      'Définissez votre devise préférée dans les paramètres du profil avant de retirer.';

  @override
  String get uiPleaseVerifyYourPhoneNumberBefore =>
      'Veuillez vérifier votre numéro avant de publier un trajet.';

  @override
  String get uiPleaseWaitForAccountVerification =>
      'Veuillez attendre la vérification du compte';

  @override
  String get uiPoolYourShipmentWithOthersGoing =>
      'Regroupez votre envoi avec d\'autres vers la même destination pour partager les frais et payer moins.';

  @override
  String get uiPostTrip => 'Publier un trajet';

  @override
  String get uiPostalCode => 'Code postal *';

  @override
  String get uiPressAndHoldThisDraftTo =>
      'Appuyez longuement sur ce brouillon pour le supprimer';

  @override
  String get uiPricePerKg => 'Prix par kg';

  @override
  String get uiPrivacyConsent => 'Confidentialité et consentement';

  @override
  String get uiPrivacyPolicy => 'Politique de confidentialité *';

  @override
  String get uiProcessingYourVerification =>
      'Traitement de votre vérification…';

  @override
  String get uiProfilePhotoUpdated => 'Photo de profil mise à jour';

  @override
  String get uiProfileUpdatedSuccessfully => 'Profil mis à jour';

  @override
  String get uiProhibitedItems => 'Articles interdits';

  @override
  String get uiProof => 'Preuve';

  @override
  String get uiProofOfTrip => 'Preuve du trajet';

  @override
  String get uiProtectMyItem => 'Protéger mon article';

  @override
  String get uiProtectedByBankGradeEncryption =>
      'Protégé par un chiffrement de niveau bancaire';

  @override
  String get uiPublish => 'Publier';

  @override
  String get uiPushNotifications => 'Notifications push';

  @override
  String get uiQualifiedShipment => 'Envoi éligible';

  @override
  String get uiQuickUnlockAfterInactivity =>
      'Déverrouillage rapide après inactivité';

  @override
  String get uiRateThisShipmentExperienceAndAdd =>
      'Évaluez cet envoi et ajoutez un court commentaire.';

  @override
  String get uiReEnterPasscode => 'Saisissez à nouveau le code';

  @override
  String get uiReadyToWithdraw => 'Disponible au retrait';

  @override
  String get uiReadyToWithdrawHeldInEscrow => 'Disponible + en séquestre';

  @override
  String get uiRealTimeTracking => 'Suivi en\ntemps réel';

  @override
  String get uiReason => 'Motif';

  @override
  String get uiReceiverDetails => 'Informations du destinataire';

  @override
  String get uiRecentSearches => 'Recherches récentes';

  @override
  String get uiReferralEarnings => 'Gains de parrainage';

  @override
  String get uiReferrals => 'Parrainages';

  @override
  String get uiReferredUsers => 'Utilisateurs parrainés';

  @override
  String get uiRefresh => 'Actualiser';

  @override
  String get uiRefreshWallet => 'Actualiser le portefeuille';

  @override
  String get uiReject => 'Refuser';

  @override
  String get uiRejectPackage => 'Refuser le colis';

  @override
  String get uiRejectionReasonIfRejecting => 'Motif du refus (en cas de refus)';

  @override
  String get uiRemaining => 'Restant';

  @override
  String get uiRemove => 'Retirer';

  @override
  String get uiRemoveAppPasscode => 'Supprimer le code de l\'app';

  @override
  String get uiRemoveFromHistory => 'Retirer de l\'historique ?';

  @override
  String get uiRemoveService => 'Retirer le service';

  @override
  String get uiReplyToSupport => 'Répondre à l\'assistance…';

  @override
  String get uiReportIssue => 'Signaler un problème';

  @override
  String get uiReportShipment => 'Signaler l\'envoi';

  @override
  String get uiRequestShipment => 'Demander un envoi';

  @override
  String get uiRequestACurrencyChange => 'Demander un changement de devise';

  @override
  String get uiRequestAccepted => 'Demande acceptée';

  @override
  String get uiRequestAccepted2 => 'Demande acceptée !';

  @override
  String get uiRequestDeclined => 'Demande refusée';

  @override
  String get uiRequestDeclined2 => 'Demande refusée.';

  @override
  String get uiRequestNotFound => 'Demande introuvable';

  @override
  String get uiRequestSentSupportWillUpdateYou =>
      'Demande envoyée. L\'assistance vous répondra dans vos tickets.';

  @override
  String get uiRequestsWillAppearHereWhenSenders =>
      'Les demandes apparaîtront ici quand des expéditeurs vous demanderont de transporter un colis.';

  @override
  String get uiRequiredAgreements => 'Accords requis';

  @override
  String get uiRequiredAgreements2 => 'Accords requis :';

  @override
  String get uiRequiredByOurPayoutProviderTo =>
      'Exigé par notre prestataire de versement pour vérifier les virements EUR/GBP.';

  @override
  String get uiReserved => 'Réservé';

  @override
  String get uiRetake => 'Reprendre';

  @override
  String get uiReviewYourTrip => 'Vérifier votre trajet';

  @override
  String get uiReviewPackageRequestsFromSendersWaiting =>
      'Examinez les demandes des expéditeurs qui attendent votre trajet.';

  @override
  String get uiReviewYourShipmentDetailsAndConfirm =>
      'Vérifiez les détails de votre envoi et confirmez que votre article peut être envoyé en toute sécurité.';

  @override
  String get uiRewardRules => 'Règles de récompense';

  @override
  String get uiRouteDeleted => 'Itinéraire supprimé';

  @override
  String get uiRoutingNumberUsBanks =>
      'Numéro de routage (banques américaines)';

  @override
  String get uiStillNeedHelp => 'BESOIN D\'AIDE ?';

  @override
  String get uiSubject => 'OBJET';

  @override
  String get uiSwiftBicBanksOutsideTheUs =>
      'SWIFT / BIC (banques hors des États-Unis)';

  @override
  String get uiSwiftBic => 'SWIFT/BIC';

  @override
  String get uiSwiftBic2 => 'SWIFT/BIC *';

  @override
  String get uiSafetyCheck => 'Contrôle de sécurité';

  @override
  String get uiSave => 'Enregistrer';

  @override
  String get uiSaveBankAccount => 'Enregistrer le compte bancaire';

  @override
  String get uiSearchAgain => 'Nouvelle recherche';

  @override
  String get uiSearchTravelers => 'Rechercher des voyageurs';

  @override
  String get uiSearchBank => 'Rechercher une banque...';

  @override
  String get uiSearchBanks => 'Rechercher des banques...';

  @override
  String get uiSearchChatsNamesOrRoutes =>
      'Rechercher des chats, noms ou itinéraires';

  @override
  String get uiSearchCity => 'Rechercher une ville';

  @override
  String get uiSearchCityAndCountry => 'Rechercher une ville et un pays';

  @override
  String get uiSearchConversations => 'Rechercher des conversations';

  @override
  String get uiSearchCountry => 'Rechercher un pays';

  @override
  String get uiSearchCountryOrCurrency => 'Rechercher un pays ou une devise';

  @override
  String get uiSearchCountryOrDialCode => 'Rechercher un pays ou un indicatif…';

  @override
  String get uiSearchCountry2 => 'Rechercher un pays…';

  @override
  String get uiSearchForACityOrAirport => 'Rechercher une ville ou un aéroport';

  @override
  String get uiSearchForACityOrCountry => 'Rechercher une ville ou un pays';

  @override
  String get uiSecureCheckout => 'Paiement sécurisé';

  @override
  String get uiSeeAll => 'Tout voir';

  @override
  String get uiSeeEveryThread => 'Voir toutes les conversations';

  @override
  String get uiSelectBank => 'Choisir la banque';

  @override
  String get uiSelectBank2 => 'Choisir la banque *';

  @override
  String get uiSelectARejectionReason => 'Choisissez un motif de refus.';

  @override
  String get uiSelectEveryItemContainedInThe =>
      'Sélectionnez chaque article contenu dans le colis.';

  @override
  String get uiSelectTheCountryThatIssuedThe =>
      'Choisissez le pays qui a délivré la pièce d\'identité que vous utiliserez — cela détermine les documents acceptés.';

  @override
  String get uiSelectYourIdType => 'Choisissez votre type de pièce';

  @override
  String get uiSelected => 'Sélectionné';

  @override
  String get uiSendCode => 'Envoyer le code';

  @override
  String get uiSendAGift => 'Envoyer un cadeau';

  @override
  String get uiSendAPackageWithATraveler => 'Envoyer un colis avec un voyageur';

  @override
  String get uiSendKgRequest => 'Envoyer la demande de kg';

  @override
  String get uiSendPackage => 'Envoyer un colis';

  @override
  String get uiSendRequest => 'Envoyer la demande';

  @override
  String get uiSendersWillSeeYourAvailableKg =>
      'Les expéditeurs verront vos kg disponibles et seront mis en relation en conséquence.';

  @override
  String get uiServiceName => 'Nom du service';

  @override
  String get uiServiceRemoved => 'Service retiré';

  @override
  String get uiSetAnAppPasscodeOrEnable =>
      'Définissez d\'abord un code ou activez la biométrie avant d\'activer le déverrouillage rapide.';

  @override
  String get uiSetCountryCurrency => 'Définir le pays et la devise';

  @override
  String get uiSetUpWithdrawals => 'Configurer\nles retraits';

  @override
  String get uiSetUpAccount => 'Configurer le compte';

  @override
  String get uiSetUpPayoutMethod => 'Configurer un moyen de versement →';

  @override
  String get uiSetYourCountryAndCurrencyFirst =>
      'Définissez d\'abord votre pays et votre devise — cela ne prend qu\'un instant.';

  @override
  String get uiSetYourCountryOfResidenceBefore =>
      'Définissez votre pays de résidence avant de payer. Votre devise de paiement en dépend.';

  @override
  String get uiSetYourRateCompetitivePricingAttracts =>
      'Fixez votre tarif. Un prix compétitif attire plus d\'expéditeurs.';

  @override
  String get uiShareHowTheShipmentWentSo =>
      'Racontez comment s\'est passé l\'envoi pour aider les autres à mieux choisir.';

  @override
  String get uiShareTheShippingCostSaveUp =>
      'Partagez les frais d\'envoi — économisez jusqu\'à 60 %';

  @override
  String get uiShareThisPinWithTheTraveler =>
      'Partagez ce code avec le voyageur pour confirmer la remise.';

  @override
  String get uiShareTrip => 'Partager le trajet';

  @override
  String get uiShareWhatWentWellOrWhat =>
      'Dites ce qui s\'est bien passé ou ce qui pourrait être amélioré...';

  @override
  String get uiShipmentRequest => 'Demande d\'envoi';

  @override
  String get uiShipmentSummary => 'Récapitulatif de l\'envoi';

  @override
  String get uiShipmentHasBeenDeliveredWaitingFor =>
      'L\'envoi a été livré. En attente de confirmation de l\'expéditeur.';

  @override
  String get uiShipmentReportedSupportCanNowReview =>
      'Envoi signalé. L\'assistance peut maintenant consulter l\'historique du chat.';

  @override
  String get uiShipmentStarted => 'Envoi lancé';

  @override
  String get uiShippingFee => 'Frais d\'envoi';

  @override
  String get uiShipsToAnyDestination => 'Livre vers toutes les destinations';

  @override
  String get uiSignIn => 'Se connecter';

  @override
  String get uiSignInToContinue => 'Connectez-vous pour continuer';

  @override
  String get uiSimulatorCode => 'Code du simulateur';

  @override
  String get uiSinceYouSignedUpWithGoogle =>
      'Comme vous vous êtes inscrit avec Google/Apple, nous devons vérifier votre numéro avant votre premier envoi.';

  @override
  String get uiSkipBackPhoto => 'Ignorer la photo du verso';

  @override
  String get uiSkipForNow => 'Passer pour l\'instant';

  @override
  String get uiSold => 'Vendu';

  @override
  String get uiSomethingWentWrongPleaseTryAgain =>
      'Une erreur s\'est produite. Veuillez réessayer.';

  @override
  String get uiSortCode => 'Sort code *';

  @override
  String get uiStartAConversationAnyTimeAnd =>
      'Lancez une conversation à tout moment et gardez tout le fil au même endroit.';

  @override
  String get uiStartALiveChatAndYour =>
      'Lancez un chat en direct : vos messages apparaîtront ici comme dans une boîte d\'assistance partagée.';

  @override
  String get uiStartConversation => 'Démarrer une conversation';

  @override
  String get uiStartingVerification => 'Démarrage de la vérification…';

  @override
  String get uiStateRegion => 'État / région';

  @override
  String get uiStatusUpdated => 'Statut mis à jour !';

  @override
  String get uiStatus => 'Statut :';

  @override
  String get uiStreetAddress => 'Adresse';

  @override
  String get uiSubmissionFailedPleaseTryAgain =>
      'Échec de l\'envoi. Veuillez réessayer.';

  @override
  String get uiSubmitForReview => 'Soumettre pour examen';

  @override
  String get uiSupport => 'Assistance';

  @override
  String get uiSupportChatIsTemporarilyUnavailablePlease =>
      'Le chat d\'assistance est temporairement indisponible.\nÉcrivez à support@sendwithbago.com';

  @override
  String get uiSupportInbox => 'Boîte d\'assistance';

  @override
  String get uiSupportRepliesAroundTheClock => 'L\'assistance répond 24 h/24';

  @override
  String get uiSupportThatFeelsLikeAConversation =>
      'Une assistance qui ressemble à une conversation';

  @override
  String get uiSupportingExplanation => 'Explication';

  @override
  String get uiSwapCities => 'Inverser les villes';

  @override
  String get uiSystemAlerts => 'Alertes système';

  @override
  String get uiTakePhoto => 'Prendre une photo';

  @override
  String get uiTakeAClearPhotoOfThe => 'Prenez une photo nette du verso.';

  @override
  String get uiTakePhoto2 => 'Prendre une photo';

  @override
  String get uiTalkToSupportNow => 'Parler à l\'assistance maintenant';

  @override
  String get uiTapToAddPhoto => 'Appuyez pour ajouter une photo';

  @override
  String get uiTapToCopyThisTestCode =>
      'Appuyez pour copier ce code de test si l\'e-mail n\'arrive pas.';

  @override
  String get uiTapToReRecord => 'Appuyez pour réenregistrer';

  @override
  String get uiTellUsThePickupAndDelivery =>
      'Indiquez les lieux de prise en charge et de livraison de votre envoi.';

  @override
  String get uiTermsConditions => 'Conditions générales';

  @override
  String get uiTermsOfService => 'Conditions d\'utilisation *';

  @override
  String get uiThanksForSharingYourFeedbackIt =>
      'Merci pour votre avis. Il aide les autres à faire confiance à la plateforme.';

  @override
  String get uiThatPasscodeIsNotCorrect => 'Ce code est incorrect.';

  @override
  String get uiThePackageIsNowInTransit =>
      'Le colis est en cours d\'acheminement.';

  @override
  String get uiTheRequestDetailsAreNotAvailable =>
      'Les détails de la demande sont indisponibles. Actualisez et réessayez.';

  @override
  String get uiTheTravelerHasMarkedThisPackage =>
      'Le voyageur a indiqué que ce colis est livré. Confirmez la réception pour débloquer le paiement.';

  @override
  String get uiTheTravelerMarkedThisShipmentAs =>
      'Le voyageur a indiqué que cet envoi est livré. Confirmez la réception ici pour débloquer le paiement.';

  @override
  String get uiTheTravellerMustBeAllowedTo =>
      'Le voyageur doit pouvoir inspecter le colis.';

  @override
  String get uiThisAddsWeightToTheActive =>
      'Cela ajoute du poids à l\'envoi actif de ce chat. Les informations du destinataire restent inchangées.';

  @override
  String get uiThisBecomesYourWalletDisplayAnd =>
      'Ce sera la devise d\'affichage et de versement de votre portefeuille.';

  @override
  String get uiThisCategoryRequiresExtraCareYour =>
      'Cette catégorie demande un soin particulier. Le voyageur pourra demander plus de détails.';

  @override
  String get uiThisConversationHasBeenClosedStart =>
      'Cette conversation est fermée. Ouvrez un nouveau ticket si vous avez encore besoin d\'aide.';

  @override
  String get uiThisDeterminesWhichDocumentTypesThe =>
      'Cela détermine les types de documents proposés par la vérification.';

  @override
  String get uiThisIsASecureProcessThat =>
      'C\'est un processus sécurisé de quelques minutes. Nous vérifierons votre identité et activerons votre compte.';

  @override
  String get uiThisShipmentChatIsClosedPlease =>
      'Ce chat d\'envoi est fermé. Contactez l\'assistance ou ouvrez un litige si nécessaire.';

  @override
  String get uiThisWillPermanentlyRemoveThisItem =>
      'Cet élément sera définitivement retiré de votre historique.';

  @override
  String get uiThisWillRemoveThisDraftShipment =>
      'Ce brouillon d\'envoi sera supprimé immédiatement. Vous pouvez recommencer à tout moment.';

  @override
  String get uiThisWillRemoveYourSavedShipment =>
      'Votre brouillon d\'envoi sera supprimé. Vous devrez recommencer pour envoyer ce colis.';

  @override
  String get uiThisWillRemoveYourSavedShipment2 =>
      'Votre brouillon d\'envoi sera supprimé. Vous devrez recommencer.';

  @override
  String get uiTicketNotFound => 'Ticket introuvable';

  @override
  String get uiTicketSubmittedWeLlGetBack =>
      'Ticket envoyé ! Nous vous répondrons bientôt.';

  @override
  String get uiTicketsAndChatInOneFlow => 'Tickets et chat au même endroit';

  @override
  String get uiTime => 'Heure';

  @override
  String get uiToGetYourShipmentPayoutsTell =>
      'Pour recevoir vos versements, indiquez-nous où Bago doit envoyer l\'argent.';

  @override
  String get uiToUnlockAllFeaturesPleaseComplete =>
      'Terminez la vérification d\'identité pour débloquer toutes les fonctionnalités.';

  @override
  String get uiToVerifyYourIdentityWeCollect =>
      'Pour vérifier votre identité, nous collectons et traitons vos données personnelles, y compris vos pièces d\'identité officielles et des données biométriques. C\'est exigé par la loi et nos conditions.';

  @override
  String get uiTotal => 'Total';

  @override
  String get uiTotalSpace => 'Espace total';

  @override
  String get uiTotalWallet => 'Portefeuille total';

  @override
  String get uiTrackingNumber => 'Numéro de suivi';

  @override
  String get uiTravelDate => 'Date du trajet';

  @override
  String get uiTravelType => 'Mode de transport';

  @override
  String get uiTraveller => 'Voyageur';

  @override
  String get uiTripNumber => 'Numéro du trajet';

  @override
  String get uiTryAgain => 'Réessayer';

  @override
  String get uiTryADifferentKeywordOrStart =>
      'Essayez un autre mot-clé ou contactez l\'assistance pour une aide directe.';

  @override
  String get uiTryAgain2 => 'Réessayer';

  @override
  String get uiTypeAMessage => 'Écrire un message...';

  @override
  String get uiTypeCityOrCountry => 'Saisissez une ville ou un pays';

  @override
  String get uiUkBankAccount => 'COMPTE BANCAIRE BRITANNIQUE';

  @override
  String get uiUkAccountNumbersMustContain8 =>
      'Les numéros de compte britanniques comportent 8 chiffres.';

  @override
  String get uiUkSortCodesMustContain6 =>
      'Les sort codes britanniques comportent 6 chiffres.';

  @override
  String get uiUsdBankAccount => 'COMPTE BANCAIRE EN USD';

  @override
  String get uiUnableToLoadMessages => 'Impossible de charger les messages';

  @override
  String get uiUnderReviewSendersCannotSeeThis =>
      'En cours d\'examen — les expéditeurs ne voient pas encore ce trajet. Il sera activé après validation.';

  @override
  String get uiUnlimitedCapacity => 'Capacité illimitée';

  @override
  String get uiUnlockBago => 'Déverrouiller Bago';

  @override
  String get uiUnlockWithPasscode => 'Déverrouiller avec le code';

  @override
  String get uiUnverified => 'Non vérifié';

  @override
  String get uiUpdateStatus => 'Mettre à jour le statut';

  @override
  String get uiUploadingDocuments => 'Envoi des documents…';

  @override
  String get uiUseA4To8Digit => 'Utilisez un code de 4 à 8 chiffres.';

  @override
  String get uiUseSecureCheckoutToPayBy =>
      'Utilisez le paiement sécurisé par carte, Apple Pay, virement ou mobile money.';

  @override
  String get uiUsuallyRepliesInMinutes =>
      'Répond généralement en quelques minutes';

  @override
  String get uiValue => 'Valeur';

  @override
  String get uiVerificationCodeSentViaSms =>
      'Code de vérification envoyé par SMS.';

  @override
  String get uiVerifyEmail => 'Vérifier l\'e-mail';

  @override
  String get uiVerifyIdentity => 'Vérifier l\'identité';

  @override
  String get uiVerifyPhone => 'Vérifier le téléphone';

  @override
  String get uiVerifyPhoneNumber => 'Vérifier le numéro de téléphone';

  @override
  String get uiVerifyYourEmailFirst => 'Vérifiez d\'abord votre e-mail';

  @override
  String get uiVerifyYourPhoneNumber => 'Vérifiez votre numéro de téléphone';

  @override
  String get uiView => 'Voir';

  @override
  String get uiViewDetails => 'Voir les détails';

  @override
  String get uiViewImage => 'Voir l\'image';

  @override
  String get uiViewShipmentDetails => 'Voir les détails de l\'envoi';

  @override
  String get uiVisaMastercardAmex => 'Visa, Mastercard, Amex';

  @override
  String get uiWhatWouldYouLikeMembersTo =>
      'QUE VOULEZ-VOUS QUE LES MEMBRES SACHENT DE VOUS ?';

  @override
  String get uiWaitingForAnAgent => 'En attente d\'un agent';

  @override
  String get uiWeLlReviewYourDocumentsWithin =>
      'Nous examinerons vos documents sous 1 à 2 jours ouvrés et vous informerons du résultat.';

  @override
  String get uiWeVeSentA6Digit => 'Nous avons envoyé un code à 6 chiffres à ';

  @override
  String get uiWeightKg => 'Poids (kg)*';

  @override
  String get uiWhatAreYouSending => 'Qu\'envoyez-vous ?';

  @override
  String get uiWhatHappensNext => 'Et ensuite ?';

  @override
  String get uiWhatIsInside => 'Qu\'y a-t-il à l\'intérieur ?';

  @override
  String get uiWhatWeCollect => 'Ce que nous collectons';

  @override
  String get uiWhatWouldYouLikeToDo => 'Que souhaitez-vous faire ?';

  @override
  String get uiWhatSYourDateOfBirth => 'Quelle est votre\ndate de naissance ?';

  @override
  String get uiWhatSYourFullName => 'Quel est votre\nnom complet ?';

  @override
  String get uiWhatSYourRole => 'Quel est votre\nrôle ?';

  @override
  String get uiWhenAreYouTravelling => 'Quand voyagez-vous ?';

  @override
  String get uiWhenDoesYourJourneyBegin => 'Quand commence votre trajet ?';

  @override
  String get uiWhereAreYouSending => 'Où envoyez-vous ?';

  @override
  String get uiWhichCountryIssuedYourId =>
      'Quel pays a délivré votre pièce d\'identité ?';

  @override
  String get uiWhoReceivesThis => 'Qui le reçoit ?';

  @override
  String get uiWhyABio => 'Pourquoi une bio ?';

  @override
  String get uiWhyDoYouNeedToChange =>
      'Pourquoi la changer ? (ex. : déménagement)';

  @override
  String get uiWithdrawEarnings => 'Retirer mes gains';

  @override
  String get uiWithdrawFunds => 'Retirer des fonds';

  @override
  String get uiWithdrawAll => 'Tout retirer';

  @override
  String get uiWithdrawalRequest => 'Demande de retrait';

  @override
  String get uiWithdrawalSubmitted => 'Retrait envoyé';

  @override
  String get uiWithdrawalCouldNotBeSubmittedPlease =>
      'Le retrait n\'a pas pu être envoyé. Veuillez réessayer.';

  @override
  String get uiWrappedOrSealedPackagesAreNot =>
      'Les colis emballés ou scellés ne sont pas refusés, mais doivent être inspectés avant la prise en charge.';

  @override
  String get uiWriteAShortBioAboutYourself => 'Écrivez une courte bio...';

  @override
  String get uiYyyyMmDd => 'AAAA-MM-JJ';

  @override
  String get uiYouCanChangeThisLater => 'Vous pourrez le modifier plus tard';

  @override
  String get uiYouCanTrackTheStatusIn =>
      'Suivez le statut dans votre historique de transactions.';

  @override
  String get uiYourDetails => 'Vos informations';

  @override
  String get uiYourPrivacyRights => 'Vos droits en matière de confidentialité';

  @override
  String get uiYourUsdAccountNumber => 'Votre numéro de compte en USD';

  @override
  String get uiYourAccountDoesnTHavePermission =>
      'Votre compte n\'est pas autorisé à retirer des fonds. Demandez au propriétaire de l\'entreprise de l\'activer.';

  @override
  String get uiYourAccountHasBeenSuspendedDue =>
      'Votre compte a été suspendu pour non-respect de nos conditions d\'utilisation.';

  @override
  String get uiYourBankDetailsAreEncryptedAnd =>
      'Vos coordonnées bancaires sont chiffrées et stockées en sécurité. Elles servent uniquement aux versements des voyageurs.';

  @override
  String get uiYourDataIsProcessedSecurelyAnd =>
      'Vos données sont traitées en sécurité et ne seront pas partagées sans votre consentement.';

  @override
  String get uiYourDataIsProcessedSolelyTo =>
      'Vos données servent uniquement à vérifier votre identité et à respecter les règles de lutte anti-blanchiment (AML) et KYC. Elles ne sont pas vendues à des tiers.';

  @override
  String get uiYourEarningAndPayoutCurrencyIs =>
      'Votre devise de gains et de versement est verrouillée. Pour la changer, envoyez une demande ci-dessous ou contactez l\'assistance.';

  @override
  String get uiYourEarnings => 'Vos gains';

  @override
  String get uiYourIssue => 'Votre problème :';

  @override
  String get uiYourItemsWeight => 'Poids de vos articles';

  @override
  String get uiYourMessagesWithBagoSupport =>
      'Vos messages avec l\'assistance Bago';

  @override
  String get uiYourPhoneNumberHasBeenSuccessfully =>
      'Votre numéro a été vérifié et mis à jour sur votre compte.';

  @override
  String get uiYourPrivacyMattersToUsThis =>
      'Votre vie privée compte pour nous. Cette politique explique comment Bago collecte, utilise et protège vos données personnelles.';

  @override
  String get uiEGLagosFriendsGroup => 'ex. « Groupe d\'amis de Lagos »';

  @override
  String get uiEGAcmeLogisticsLtd => 'ex. Acme Logistique SARL';

  @override
  String get uiEGBago12345678 => 'ex. BAGO-12345678';

  @override
  String get uiEGBarclaysLloydsMonzo => 'ex. Barclays, Lloyds, Monzo';

  @override
  String get uiEGBerlin => 'ex. Berlin';

  @override
  String get uiEGChasus33 => 'ex. CHASUS33';

  @override
  String get uiEGChaseBankOfAmerica => 'ex. Chase, Bank of America, Wise';

  @override
  String get uiEGDoe => 'ex. Dupont';

  @override
  String get uiEGExpressStandard => 'ex. Express, Standard';

  @override
  String get uiEGJohn => 'ex. Jean';

  @override
  String get uiEGLt12345678901234 => 'ex. LT12 3456 7890 1234 5678';

  @override
  String get uiEGLagosAccra => 'ex. Lagos, Accra';

  @override
  String get uiEGRevolt21 => 'ex. REVOLT21';

  @override
  String get uiEGRevolutN26Wise => 'ex. Revolut, N26, Wise';

  @override
  String get uiEGUnitedStates => 'ex. États-Unis';

  @override
  String get uiKg => 'kg';

  @override
  String get uiOr => 'ou';

  @override
  String get uiTyping => 'écrit…';

  @override
  String uiFUse(Object p0) {
    return 'Utiliser $p0';
  }

  @override
  String uiFWalletCurrencySetTo(Object p0) {
    return 'Devise du portefeuille définie sur $p0.';
  }

  @override
  String uiFWeSentADigitVerificationCode(Object p0) {
    return 'Nous avons envoyé un code à 6 chiffres à $p0. Saisissez-le à l\'étape suivante pour définir un nouveau mot de passe.';
  }

  @override
  String uiFOtpSentTo(Object p0) {
    return 'Code envoyé au $p0';
  }

  @override
  String uiFEnterTheOtpSentTo(Object p0) {
    return 'Saisissez le code\nenvoyé au $p0';
  }

  @override
  String uiFResendCodeInS(Object p0) {
    return 'Renvoyer le code dans $p0 s';
  }

  @override
  String uiFANewVerificationCodeWasSent(Object p0) {
    return 'Un nouveau code de vérification a été envoyé à $p0.';
  }

  @override
  String uiFHeldInEscrow(Object p0, Object p1) {
    return '$p0 $p1 en séquestre';
  }

  @override
  String uiFShipmentProgressStepOf(Object p0) {
    return 'Progression de l\'envoi, étape $p0 sur 4';
  }

  @override
  String uiFFrontOf(Object p0) {
    return 'Recto : $p0';
  }

  @override
  String uiFBackOf(Object p0) {
    return 'Verso : $p0';
  }

  @override
  String uiFTracking(Object p0) {
    return 'Suivi : $p0';
  }

  @override
  String uiFShipmentNeedHelpContactSupportOr(Object p0) {
    return 'Envoi $p0. Besoin d\'aide ? Contactez l\'assistance ou signalez un problème.';
  }

  @override
  String uiFChargedIn(Object p0) {
    return 'Facturé en $p0';
  }

  @override
  String uiFUnableToLoadBanksRightNow(Object p0) {
    return 'Impossible de charger les banques pour le moment : $p0';
  }

  @override
  String uiFWithdrawalsArePaidByTheBago(Object p0) {
    return 'Les retraits en $p0 sont versés par l\'équipe comptable de Bago par virement, généralement sous 1 à 3 jours ouvrés. Vous recevrez un e-mail et une notification à chaque étape.';
  }

  @override
  String uiFWeSentADigitCodeTo(Object p0, Object p1) {
    return 'Nous avons envoyé un code à 6 chiffres par SMS au $p0$p1. Saisissez-le ci-dessous.';
  }

  @override
  String uiFPaymentCurrency(Object p0) {
    return 'Devise de paiement : $p0';
  }

  @override
  String uiFCurrentOurTeamReviewsRequestsWithin(Object p0) {
    return 'Actuelle : $p0. Notre équipe traite les demandes sous 1 à 2 jours ouvrés.';
  }

  @override
  String uiFWillUseForPayments(Object p0, Object p1, Object p2) {
    return '$p0 $p1 utilisera $p2 pour les paiements.';
  }

  @override
  String uiFCharacters(Object p0) {
    return '$p0/250 caractères';
  }

  @override
  String uiFPayoutSetupWasNotCompletedCurrency(Object p0) {
    return 'La configuration des versements n\'a pas abouti. Devise rétablie sur $p0.';
  }

  @override
  String uiFPayoutAccountLinked(Object p0) {
    return 'Compte de versement en $p0 associé.';
  }

  @override
  String uiFCurrencyRestoredTo(Object p0, Object p1) {
    return '$p0 Devise rétablie sur $p1.';
  }

  @override
  String uiFSetUpPayouts(Object p0) {
    return 'Configurer les versements en $p0 ?';
  }

  @override
  String uiFYouMustLinkAPayoutAccount(Object p0, Object p1) {
    return 'Vous devez associer un compte de versement en $p0 pour utiliser cette devise. Si vous annulez, Bago conservera $p1.';
  }

  @override
  String uiFKeep(Object p0) {
    return 'Garder $p0';
  }

  @override
  String uiFDataAreCollectedByBagoAnd(Object p0) {
    return 'Les données sont collectées par Bago et transmises à notre prestataire de versement uniquement pour permettre les versements. $p0 En continuant, vous confirmez que ce compte vous appartient.';
  }

  @override
  String uiFCopied(Object p0) {
    return '$p0 copié';
  }

  @override
  String uiFYouAndYourFriendEachGet(Object p0) {
    return 'Vous et votre ami recevez chacun $p0 après l\'inscription';
  }

  @override
  String uiFEarnAnotherWhenTheySendAn(Object p0, Object p1) {
    return 'Gagnez $p0 de plus quand ils envoient un article de plus de $p1';
  }

  @override
  String uiFEarned(Object p0, Object p1) {
    return '$p0 $p1 gagnés';
  }

  @override
  String uiFYourBalanceIsBelowTheMinimum(Object p0, Object p1) {
    return 'Votre solde est inférieur au retrait minimum de $p0 $p1.';
  }

  @override
  String uiFMinimumWithdrawalIsAcrossAllCurrencies(Object p0, Object p1) {
    return 'Le retrait minimum est de $p0 $p1 pour toutes les devises.';
  }

  @override
  String uiFWithdrawalsArePaidToYourBank(Object p0) {
    return 'Les retraits en $p0 sont versés sur votre compte par l\'équipe comptable de Bago, généralement sous 1 à 3 jours ouvrés. Nous vous préviendrons par e-mail une fois validés et payés.';
  }

  @override
  String uiFNoTravelersAreHeadingFromTo(Object p0, Object p1) {
    return 'Aucun voyageur ne va de $p0 à $p1 pour le moment. Revenez bientôt !';
  }

  @override
  String uiFSendWith(Object p0) {
    return 'Envoyer avec $p0';
  }

  @override
  String uiFDone(Object p0) {
    return 'Terminé ($p0)';
  }

  @override
  String uiFKgFree(Object p0) {
    return '$p0 kg libres';
  }

  @override
  String uiFDeparts(Object p0) {
    return 'Départ $p0';
  }

  @override
  String uiFValue(Object p0, Object p1) {
    return 'Valeur : $p0 $p1';
  }

  @override
  String uiFOtherRequestsWaiting(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count demandes en attente',
      one: '1 demande en attente',
    );
    return '$_temp0';
  }

  @override
  String uiFSender(Object p0) {
    return 'Expéditeur : $p0';
  }

  @override
  String uiFCreated(Object p0) {
    return 'Créé le $p0';
  }

  @override
  String uiFUpdateShipmentTo(Object p0) {
    return 'Passer l\'envoi à « $p0 » ?';
  }

  @override
  String uiFTravelerInspectionPhotos(Object p0) {
    return 'Photos d\'inspection du voyageur ($p0/4)';
  }

  @override
  String uiFOfConfirmed(Object p0) {
    return '$p0 sur 3 confirmés';
  }

  @override
  String uiFTrips(Object p0) {
    return '$p0 trajets';
  }

  @override
  String uiFKgBooked(Object p0) {
    return '$p0 kg réservés';
  }

  @override
  String uiFKgLeft(Object p0) {
    return '$p0 kg restants';
  }

  @override
  String uiFActive(Object p0) {
    return '$p0 actifs';
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
    return 'Catégorie : $p0  •  Priorité : $p1';
  }

  @override
  String uiFRemoveSendersWillNoLongerSee(Object p0) {
    return 'Retirer « $p0 » ? Les expéditeurs ne le verront plus dans la recherche.';
  }

  @override
  String uiFSelected(Object p0) {
    return 'Sélectionné : $p0';
  }

  @override
  String uiFTypicalRatesRangeFromPerKg(Object p0, Object p1) {
    return 'Les tarifs habituels vont de $p0 5 à $p1 20 par kg selon l\'itinéraire.';
  }

  @override
  String uiFAiSuggestsKg(Object p0, Object p1, Object p2) {
    return 'L\'IA suggère $p0 $p1–$p2/kg';
  }

  @override
  String uiFKgBooked2(Object p0) {
    return '$p0 kg réservés';
  }

  @override
  String uiFAppearance(Object p0) {
    return 'Apparence : $p0';
  }
}
