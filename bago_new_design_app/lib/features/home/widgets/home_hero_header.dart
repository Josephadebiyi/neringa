import '../../../l10n/runtime_tr.dart';
import '../../../l10n/app_localizations.dart';
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
    if (hour < 12) return tr('Good morning');
    if (hour < 17) return tr('Good afternoon');
    return tr('Good evening');
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
                    border: Border.all(
                        color: AppPalette.of(context).white, width: 2),
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
          // Trip search: From, To, Date stacked, then Search.
          Container(
            decoration: BoxDecoration(
              color: AppPalette.of(context).white,
              borderRadius: BorderRadius.circular(24),
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
                Stack(
                  children: [
                    Column(
                      children: [
                        _SearchField(
                          icon: Icons.radio_button_checked_rounded,
                          label: AppLocalizations.of(context).fromLabel,
                          value: from,
                          hint: AppLocalizations.of(context).enterPickupCity,
                          onTap: onFromTap,
                          rightInset: 64,
                        ),
                        Divider(
                            height: 1,
                            indent: 56,
                            endIndent: 64,
                            color: AppPalette.of(context).gray100),
                        _SearchField(
                          icon: Icons.location_on_rounded,
                          label: AppLocalizations.of(context).toLabel,
                          value: to,
                          hint: AppLocalizations.of(context).enterDestination,
                          onTap: onToTap,
                          rightInset: 64,
                        ),
                      ],
                    ),
                    // Swap sits on the seam between From and To.
                    Positioned(
                      right: 16,
                      top: 0,
                      bottom: 0,
                      child: Center(
                        child: Semantics(
                          button: true,
                          label: AppLocalizations.of(context).uiSwapCities,
                          child: GestureDetector(
                            onTap: onSwap,
                            child: Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: AppPalette.of(context).primarySoft,
                                shape: BoxShape.circle,
                                border: Border.all(
                                    color: AppPalette.of(context).white,
                                    width: 3),
                              ),
                              child: Icon(Icons.swap_vert_rounded,
                                  color: AppColors.primary, size: 20),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                Divider(
                    height: 1,
                    indent: 56,
                    endIndent: 18,
                    color: AppPalette.of(context).gray100),
                _SearchField(
                  icon: Icons.calendar_today_rounded,
                  label: AppLocalizations.of(context).uiDate,
                  value: date,
                  hint: AppLocalizations.of(context).anyDate,
                  onTap: onDateTap,
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 4, 12, 12),
                  child: Semantics(
                    button: true,
                    label: AppLocalizations.of(context).uiFindARoute,
                    child: GestureDetector(
                      onTap: onSearch,
                      child: Container(
                        height: 52,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [AppColors.primaryLight, AppColors.primary],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.search_rounded,
                                color: Colors.white, size: 20),
                            SizedBox(width: 8),
                            Text(
                              AppLocalizations.of(context).uiFindARoute,
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 15.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
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
                  border: Border.all(
                      color: AppPalette.of(context).white, width: 1.5),
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
    this.rightInset = 18,
  });

  final IconData icon;
  final String label;
  final String value;
  final String hint;
  final VoidCallback onTap;

  /// Extra right padding so text never runs under the swap button.
  final double rightInset;

  @override
  Widget build(BuildContext context) {
    final hasValue = value.trim().isNotEmpty;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: EdgeInsets.fromLTRB(18, 12, rightInset, 12),
        child: Row(
          children: [
            // Fixed slot so text lines up whether a flag or icon shows.
            SizedBox(
              width: 24,
              child: Center(
                child: CountryFlag.codeForLocation(value).isNotEmpty
                    ? CountryFlag(
                        code: CountryFlag.codeForLocation(value), size: 22)
                    : Icon(icon,
                        size: 20, color: AppPalette.of(context).primary),
              ),
            ),
            const SizedBox(width: 14),
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
