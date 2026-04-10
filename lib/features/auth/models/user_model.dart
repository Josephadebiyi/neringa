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
  final String? kycStatus; // 'pending' | 'approved' | 'rejected'
  final double walletBalance;
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
  final String? signupMethod; // 'email' | 'google'

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
    this.kycStatus,
    this.walletBalance = 0.0,
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
  });

  bool get isCarrier => _normalizeRole(role) == 'carrier';
  bool get isSender => _normalizeRole(role) == 'sender';
  bool get isKycApproved => hasPassedKyc;
  bool get isGoogleUser => signupMethod == 'google';
  bool get hasPassedKyc {
    final normalized = kycStatus?.trim().toLowerCase() ?? '';
    return normalized == 'approved' ||
        normalized == 'verified' ||
        normalized == 'completed';
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
    String? kycStatus,
    double? walletBalance,
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
  }) {
    final resolvedIsVerified = isVerified ?? this.isVerified;
    final resolvedEmailVerified = emailVerified ?? this.emailVerified;
    final resolvedBiometricEnabled =
        biometricEnabled ?? this.biometricEnabled;
    final resolvedAcceptedTerms = acceptedTerms ?? this.acceptedTerms;
    final resolvedBankAccountLinked =
        bankAccountLinked ?? this.bankAccountLinked;
    final resolvedStripeVerified = stripeVerified ?? this.stripeVerified;

    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      country: country ?? this.country,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      profilePicture: profilePicture ?? this.profilePicture,
      role: _normalizeRole(role ?? this.role),
      isVerified: resolvedIsVerified,
      emailVerified: resolvedEmailVerified,
      kycStatus: kycStatus ?? this.kycStatus,
      walletBalance: walletBalance ?? this.walletBalance,
      currency: currency ?? this.currency,
      preferredCurrency: preferredCurrency ?? this.preferredCurrency,
      bio: bio ?? this.bio,
      rating: rating ?? this.rating,
      ratingCount: ratingCount ?? this.ratingCount,
      biometricEnabled: resolvedBiometricEnabled,
      acceptedTerms: resolvedAcceptedTerms,
      bankAccountLinked: resolvedBankAccountLinked,
      stripeConnectAccountId:
          stripeConnectAccountId ?? this.stripeConnectAccountId,
      stripeVerified: resolvedStripeVerified,
      signupMethod: signupMethod ?? this.signupMethod,
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
        isVerified:
            json['is_verified'] == true || json['isVerified'] == true,
        emailVerified: json['emailVerified'] == true ||
            json['email_verified'] == true,
        kycStatus: json['kyc_status']?.toString() ?? json['kycStatus']?.toString(),
        walletBalance: JsonParser.parseDoubleFirst(json, ['wallet_balance', 'walletBalance']),
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
        stripeVerified:
            json['stripeVerified'] == true || json['stripe_verified'] == true,
        signupMethod: json['signupMethod']?.toString() ?? json['signup_method']?.toString(),
        preferredCurrency: json['preferredCurrency']?.toString() ??
            json['preferred_currency']?.toString() ??
            json['currency']?.toString() ??
            '',
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
        'kyc_status': kycStatus,
        'wallet_balance': walletBalance,
        'currency': currency,
        'preferredCurrency': preferredCurrency.isNotEmpty ? preferredCurrency : currency,
        'bio': bio,
        'rating': rating,
        'rating_count': ratingCount,
        'stripeConnectAccountId': stripeConnectAccountId,
        'stripeVerified': stripeVerified,
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
