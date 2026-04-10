import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';
import 'app_card.dart';

class BagoSubPageScaffold extends StatelessWidget {
  const BagoSubPageScaffold({
    super.key,
    required this.title,
    required this.child,
    this.trailing,
    this.onBack,
    this.backFallbackPath,
    this.backgroundColor = AppColors.backgroundOff,
    this.padding = const EdgeInsets.all(16),
    this.scrollable = true,
  });

  final String title;
  final Widget child;
  final Widget? trailing;
  final VoidCallback? onBack;
  final String? backFallbackPath;
  final Color backgroundColor;
  final EdgeInsetsGeometry padding;
  final bool scrollable;

  @override
  Widget build(BuildContext context) {
    void handleBack() {
      if (onBack != null) {
        onBack!.call();
        return;
      }
      if (Navigator.of(context).canPop()) {
        context.pop();
        return;
      }
      if (backFallbackPath != null && backFallbackPath!.isNotEmpty) {
        context.go(backFallbackPath!);
      }
    }

    final body = scrollable
        ? SingleChildScrollView(
            padding: padding,
            child: child,
          )
        : Padding(
            padding: padding,
            child: child,
          );

    return PopScope(
      canPop: Navigator.of(context).canPop(),
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) {
          handleBack();
        }
      },
      child: Scaffold(
        backgroundColor: backgroundColor,
        body: SafeArea(
          child: Column(
            children: [
              Container(
                color: AppColors.white,
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 14),
                child: Row(
                  children: [
                    InkWell(
                      onTap: handleBack,
                      borderRadius: BorderRadius.circular(22),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.gray100,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          size: 18,
                          color: AppColors.black,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        title,
                        style: AppTextStyles.h3.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.black,
                        ),
                      ),
                    ),
                    if (trailing != null) trailing!,
                  ],
                ),
              ),
              Expanded(child: body),
            ],
          ),
        ),
      ),
    );
  }
}

class BagoSectionLabel extends StatelessWidget {
  const BagoSectionLabel(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 12),
      child: Text(
        label.toUpperCase(),
        style: AppTextStyles.labelXs.copyWith(
          color: AppColors.gray400,
          fontWeight: FontWeight.w800,
          letterSpacing: 1.1,
        ),
      ),
    );
  }
}

class BagoMenuGroup extends StatelessWidget {
  const BagoMenuGroup({
    super.key,
    required this.children,
  });

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: EdgeInsets.zero,
      borderRadius: 16,
      child: Column(children: children),
    );
  }
}

class BagoMenuItem extends StatelessWidget {
  const BagoMenuItem({
    super.key,
    required this.label,
    required this.leading,
    this.onTap,
    this.trailing,
    this.isDestructive = false,
    this.showDivider = true,
  });

  final String label;
  final Widget leading;
  final VoidCallback? onTap;
  final Widget? trailing;
  final bool isDestructive;
  final bool showDivider;

  @override
  Widget build(BuildContext context) {
    final labelColor = isDestructive ? AppColors.accentCoral : AppColors.black;

    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
        decoration: BoxDecoration(
          border: showDivider
              ? const Border(
                  bottom: BorderSide(color: AppColors.gray100),
                )
              : null,
        ),
        child: Row(
          children: [
            leading,
            const SizedBox(width: 16),
            Expanded(
              child: Text(
                label,
                style: AppTextStyles.labelMd.copyWith(
                  color: labelColor,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            trailing ??
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.gray400,
                  size: 18,
                ),
          ],
        ),
      ),
    );
  }
}

class BagoEmptyState extends StatelessWidget {
  const BagoEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.cta,
  });

  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? cta;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.white,
                borderRadius: BorderRadius.circular(60),
              ),
              child: Icon(icon, size: 56, color: AppColors.gray300),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              textAlign: TextAlign.center,
              style: AppTextStyles.h2.copyWith(
                color: AppColors.black,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyMd.copyWith(
                color: AppColors.gray500,
                fontWeight: FontWeight.w600,
                height: 1.5,
              ),
            ),
            if (cta != null) ...[
              const SizedBox(height: 28),
              cta!,
            ],
          ],
        ),
      ),
    );
  }
}

class BagoInfoBanner extends StatelessWidget {
  const BagoInfoBanner({
    super.key,
    required this.icon,
    required this.message,
    this.color = AppColors.primary,
    this.backgroundColor = AppColors.primarySoft,
  });

  final IconData icon;
  final String message;
  final Color color;
  final Color backgroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: AppTextStyles.bodySm.copyWith(
                color: color,
                fontWeight: FontWeight.w700,
                height: 1.45,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class BagoPlaceholderPage extends StatelessWidget {
  const BagoPlaceholderPage({
    super.key,
    required this.title,
    required this.icon,
    required this.description,
  });

  final String title;
  final IconData icon;
  final String description;

  @override
  Widget build(BuildContext context) {
    return BagoSubPageScaffold(
      title: title,
      child: BagoEmptyState(
        icon: icon,
        title: title,
        subtitle: description,
      ),
    );
  }
}
