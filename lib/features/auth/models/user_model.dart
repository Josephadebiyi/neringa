import 'dart:convert';

import '../../../core/utils/json_parser.dart';

class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String? phone;
  final String? country;
  final String? dateOfBirth;
  final String? profilePicture;
  final String role; // 'sender' | 'carrier'
  final bool isVerified;
  final bool emailVerified;
  final bool phoneVerified;
  // KYC statuses: not_started | pending | approved | rejected | expired | manual_review
  final String? kycStatus;
  final double walletBalance;
  final double escrowBalance;
  final String currency;
  final String preferredCurrency;
  final String? bio;
  final double rating;
  final int ratingCount;
  final bool biometricEnabled;
  final bool acceptedTerms;
  final bool bankAccountLinked;
  final String? stripeConnectAccountId;
  final bool stripeVerified;
  final String? signupMethod; // 'email' | 'google' | 'apple'
  final DateTime? termsAcceptedAt;

  const UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    this.phone,
    this.country,
    this.dateOfBirth,
    this.profilePicture,
    this.role = 'sender',
    this.isVerified = false,
    this.emailVerified = false,
    this.phoneVerified = false,
    this.kycStatus,
    this.walletBalance = 0.0,
    this.escrowBalance = 0.0,
    this.currency = '',
    this.preferredCurrency = '',
    this.bio,
    this.rating = 0.0,
    this.ratingCount = 0,
    this.biometricEnabled = false,
    this.acceptedTerms = false,
    this.bankAccountLinked = false,
    this.stripeConnectAccountId,
    this.stripeVerified = false,
    this.signupMethod,
    this.termsAcceptedAt,
  });

  bool get isCarrier => _normalizeRole(role) == 'carrier';
  bool get isSender => _normalizeRole(role) == 'sender';
  bool get isKycApproved => hasPassedKyc;
  bool get isGoogleUser => signupMethod == 'google';
  bool get isAppleUser => signupMethod == 'apple';
  bool get isSocialSignup => signupMethod == 'google' || signupMethod == 'apple';

  bool get hasPassedKyc {
    final normalized = kycStatus?.trim().toLowerCase() ?? '';
    return normalized == 'approved' ||
        normalized == 'verified' ||
        normalized == 'completed';
  }

  /// Whether this sender can create a shipment — all users must verify phone.
  bool get canSendShipment => phoneVerified;

  /// Whether this traveler can post a trip.
  bool get canPostTrip => hasPassedKyc;

  /// Whether this user can withdraw funds.
  bool get canWithdraw => hasPassedKyc;

  String get kycDisplayStatus {
    switch (kycStatus?.toLowerCase()) {
      case 'approved':
      case 'verified':
      case 'completed':
        return 'Verified';
      case 'pending':
        return 'Pending Review';
      case 'rejected':
      case 'declined':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      case 'manual_review':
        return 'Under Review';
      default:
        return 'Not Started';
    }
  }

  UserModel copyWith({
    String? id,
    String? email,
    String? fullName,
    String? phone,
    String? country,
    String? dateOfBirth,
    String? profilePicture,
    String? role,
    bool? isVerified,
    bool? emailVerified,
    bool? phoneVerified,
    String? kycStatus,
    double? walletBalance,
    double? escrowBalance,
    String? currency,
    String? preferredCurrency,
    String? bio,
    double? rating,
    int? ratingCount,
    bool? biometricEnabled,
    bool? acceptedTerms,
    bool? bankAccountLinked,
    String? stripeConnectAccountId,
    bool? stripeVerified,
    String? signupMethod,
    DateTime? termsAcceptedAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      country: country ?? this.country,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      profilePicture: profilePicture ?? this.profilePicture,
      role: _normalizeRole(role ?? this.role),
      isVerified: isVerified ?? this.isVerified,
      emailVerified: emailVerified ?? this.emailVerified,
      phoneVerified: phoneVerified ?? this.phoneVerified,
      kycStatus: kycStatus ?? this.kycStatus,
      walletBalance: walletBalance ?? this.walletBalance,
      escrowBalance: escrowBalance ?? this.escrowBalance,
      currency: currency ?? this.currency,
      preferredCurrency: preferredCurrency ?? this.preferredCurrency,
      bio: bio ?? this.bio,
      rating: rating ?? this.rating,
      ratingCount: ratingCount ?? this.ratingCount,
      biometricEnabled: biometricEnabled ?? this.biometricEnabled,
      acceptedTerms: acceptedTerms ?? this.acceptedTerms,
      bankAccountLinked: bankAccountLinked ?? this.bankAccountLinked,
      stripeConnectAccountId: stripeConnectAccountId ?? this.stripeConnectAccountId,
      stripeVerified: stripeVerified ?? this.stripeVerified,
      signupMethod: signupMethod ?? this.signupMethod,
      termsAcceptedAt: termsAcceptedAt ?? this.termsAcceptedAt,
    );
  }

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: JsonParser.parseId(json),
        email: json['email']?.toString() ?? '',
        fullName: json['full_name']?.toString() ??
            json['fullName']?.toString() ??
            JsonParser.parseFullName(json),
        phone: json['phone']?.toString(),
        country: json['country']?.toString(),
        dateOfBirth: json['dateOfBirth']?.toString() ??
            json['dob']?.toString() ??
            json['date_of_birth']?.toString(),
        profilePicture: json['profile_picture']?.toString() ??
            json['profilePicture']?.toString() ??
            json['image']?.toString(),
        role: _normalizeRole(json['role']?.toString() ?? 'sender'),
        isVerified: json['is_verified'] == true || json['isVerified'] == true,
        emailVerified: json['emailVerified'] == true || json['email_verified'] == true,
        phoneVerified: json['phoneVerified'] == true || json['phone_verified'] == true,
        kycStatus: json['kyc_status']?.toString() ?? json['kycStatus']?.toString(),
        walletBalance: JsonParser.parseDoubleFirst(json, ['wallet_balance', 'walletBalance']),
        escrowBalance: JsonParser.parseDoubleFirst(json, ['escrow_balance', 'escrowBalance']),
        currency: json['currency']?.toString() ??
            json['preferredCurrency']?.toString() ??
            json['preferred_currency']?.toString() ??
            '',
        bio: json['bio']?.toString(),
        rating: JsonParser.parseDouble(json, 'rating'),
        ratingCount: JsonParser.parseInt(json, 'rating_count', altKey: 'ratingCount'),
        acceptedTerms: json['accepted_terms'] == true || json['acceptedTerms'] == true,
        bankAccountLinked: json['bank_account_linked'] == true || json['bankAccountLinked'] == true,
        stripeConnectAccountId: json['stripeConnectAccountId']?.toString() ??
            json['stripe_connect_account_id']?.toString(),
        stripeVerified: json['stripeVerified'] == true || json['stripe_verified'] == true,
        signupMethod: json['signupMethod']?.toString() ?? json['signup_method']?.toString(),
        preferredCurrency: json['preferredCurrency']?.toString() ??
            json['preferred_currency']?.toString() ??
            json['currency']?.toString() ??
            '',
        termsAcceptedAt: json['termsAcceptedAt'] != null
            ? DateTime.tryParse(json['termsAcceptedAt'].toString())
            : null,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'full_name': fullName,
        'phone': phone,
        'country': country,
        'dateOfBirth': dateOfBirth,
        'profile_picture': profilePicture,
        'role': _normalizeRole(role),
        'is_verified': isVerified,
        'emailVerified': emailVerified,
        'phoneVerified': phoneVerified,
        'kyc_status': kycStatus,
        'wallet_balance': walletBalance,
        'escrow_balance': escrowBalance,
        'currency': currency,
        'preferredCurrency': preferredCurrency.isNotEmpty ? preferredCurrency : currency,
        'bio': bio,
        'rating': rating,
        'rating_count': ratingCount,
        'stripeConnectAccountId': stripeConnectAccountId,
        'stripeVerified': stripeVerified,
        'signupMethod': signupMethod,
      };

  String toJsonString() => jsonEncode(toJson());

  factory UserModel.fromJsonString(String jsonString) =>
      UserModel.fromJson(jsonDecode(jsonString) as Map<String, dynamic>);

  static String _normalizeRole(String rawRole) {
    switch (rawRole.trim().toLowerCase()) {
      case 'carrier':
      case 'traveler':
      case 'traveller':
        return 'carrier';
      default:
        return 'sender';
    }
  }
}
