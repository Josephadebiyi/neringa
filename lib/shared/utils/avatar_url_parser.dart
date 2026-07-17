import '../../core/constants/api_constants.dart';

class AvatarUrlParser {
  AvatarUrlParser._();

  static String? fromJson(Map<dynamic, dynamic>? json) {
    final value = _valueFrom(json);
    return normalize(value);
  }

  static String? normalize(Object? value) {
    final raw = value?.toString().trim() ?? '';
    if (raw.isEmpty || raw.toLowerCase() == 'null') return null;
    if (raw.startsWith('data:image/')) return raw;
    if (raw.startsWith('//')) return 'https:$raw';
    final uri = Uri.tryParse(raw);
    if (uri != null && uri.hasScheme) return raw;
    if (raw.startsWith('/')) return '${ApiConstants.baseUrl}$raw';
    return '${ApiConstants.baseUrl}/$raw';
  }

  static Object? _valueFrom(Map<dynamic, dynamic>? json, [int depth = 0]) {
    if (json == null) return null;
    const keys = [
      'profile_picture',
      'profilePicture',
      'profile_image',
      'profileImage',
      'profile_photo',
      'profilePhoto',
      'photo',
      'photo_url',
      'photoUrl',
      'avatar',
      'avatar_url',
      'avatarUrl',
      'image',
      'image_url',
      'imageUrl',
      'picture',
      'picture_url',
      'pictureUrl',
    ];

    for (final key in keys) {
      final value = json[key];
      final raw = value?.toString().trim() ?? '';
      if (raw.isNotEmpty && raw.toLowerCase() != 'null') return value;
    }

    if (depth >= 3) return null;
    const nestedKeys = [
      'user',
      'profile',
      'userProfile',
      'user_profile',
      'metadata',
      'meta',
      'account',
      'data',
    ];
    for (final key in nestedKeys) {
      final value = json[key];
      if (value is Map) {
        final nested = _valueFrom(value, depth + 1);
        if (nested != null) return nested;
      }
    }
    return null;
  }
}
