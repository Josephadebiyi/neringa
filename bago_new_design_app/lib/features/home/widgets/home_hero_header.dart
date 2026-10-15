import '../../../shared/widgets/country_flag.dart';
import '../../../core/theme/app_palette.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';

/// Clean Home header: avatar + greeting + name, notification bell, and one
/// trip-search bar that opens the "find a traveler" route picker.
class HomeHeroHeader extends StatelessWidget {
  const HomeHeroHeader({
    super.key,
    required this.firstName,
    required this.avatarUrl,
    required this.unreadCount,
    required this.from,
    required this.to,
    required this.date,
    required this.onFromTap,
    required this.onToTap,
    required this.onDateTap,
    required this.onSwap,
    required this.onSearch,
  });

  final String firstName;
  final String? avatarUrl;
  final int unreadCount;
  final String from;
  final String to;
  final String date;
  final VoidCallback onFromTap;
  final VoidCallback onToTap;
  final VoidCallback onDateTap;
  final VoidCallback onSwap;
  final VoidCallback onSearch;

  String get _greeting {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final topInset = MediaQuery.paddingOf(context).top;
    final letter = firstName.isNotEmpty ? firstName[0].toUpperCase() : 'B';

    return Padding(
      padding: EdgeInsets.fromLTRB(20, topInset + 12, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              GestureDetector(
                onTap: () => context.go('/profile'),
                child: Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppPalette.of(context).primarySoft,
                    border: Border.all(color: AppColors.white, width: 2),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.12),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: ClipOval(
                    child: avatarUrl != null && avatarUrl!.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: avatarUrl!,
                            fit: BoxFit.cover,
                            errorWidget: (_, __, ___) => _AvatarLetter(letter),
                            placeholder: (_, __) => _AvatarLetter(letter),
                          )
                        : _AvatarLetter(letter),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _greeting,
                      style: TextStyle(
                        color: AppPalette.of(context).gray500,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$firstName 👋',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: AppPalette.of(context).black,
                        fontSize: 19,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
              _RoundIconButton(
                icon: Icons.notifications_none_rounded,
                showDot: unreadCount > 0,
                onTap: () => context.go('/messages'),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Trip search: From → To, date, search.
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
            decoration: BoxDecoration(
              color: AppPalette.of(context).white,
              borderRadius: BorderRadius.circular(26),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        children: [
                          _SearchField(
                              icon: Icons.radio_button_checked_rounded,
                              label: 'From',
                              value: from,
                              hint: 'Pickup city',
                              onTap: onFromTap),
                          const Divider(height: 16),
                          _SearchField(
                              icon: Icons.location_on_rounded,
                              label: 'To',
                              value: to,
                              hint: 'Destination',
                              onTap: onToTap),
                        ],
                      ),
                    ),
                    IconButton(
                        tooltip: 'Swap cities',
                        onPressed: onSwap,
                        icon: Icon(Icons.swap_vert_rounded,
                            color: AppPalette.of(context).primary)),
                  ],
                ),
                Divider(height: 14, color: AppPalette.of(context).gray100),
                _SearchField(
                  icon: Icons.calendar_today_rounded,
                  label: 'Date',
                  value: date,
                  hint: 'Any date',
                  onTap: onDateTap,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton.icon(
                      onPressed: onSearch,
                      style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: AppColors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(18))),
                      icon: const Icon(Icons.route_rounded, size: 20),
                      label: const Text('Find a Route',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w800))),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  const _RoundIconButton({
    required this.icon,
    required this.onTap,
    this.showDot = false,
  });

  final IconData icon;
  final VoidCallback onTap;
  final bool showDot;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppPalette.of(context).white,
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.08),
                  blurRadius: 14,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Icon(icon, color: AppPalette.of(context).black, size: 23),
          ),
          if (showDot)
            Positioned(
              top: 11,
              right: 12,
              child: Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: AppColors.error,
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.white, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _AvatarLetter extends StatelessWidget {
  const _AvatarLetter(this.letter);
  final String letter;

  @override
  Widget build(BuildContext context) => Center(
        child: Text(
          letter,
          style: TextStyle(
            color: AppPalette.of(context).primary,
            fontSize: 18,
            fontWeight: FontWeight.w800,
          ),
        ),
      );
}

class _SearchField extends StatelessWidget {
  const _SearchField({
    required this.icon,
    required this.label,
    required this.value,
    required this.hint,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final String hint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final hasValue = value.trim().isNotEmpty;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            if (CountryFlag.codeForLocation(value).isNotEmpty)
              CountryFlag(code: CountryFlag.codeForLocation(value), size: 24)
            else
              Icon(icon, size: 18, color: AppPalette.of(context).primary),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label,
                      style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w600,
                          color: AppPalette.of(context).gray400)),
                  const SizedBox(height: 1),
                  Text(
                    hasValue ? value.split(',').first.trim() : hint,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 14.5,
                      fontWeight: hasValue ? FontWeight.w800 : FontWeight.w500,
                      color: hasValue
                          ? AppPalette.of(context).black
                          : AppPalette.of(context).gray400,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
