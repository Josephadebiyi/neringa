import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_text_styles.dart';

class BuyItemsScreen extends StatelessWidget {
  const BuyItemsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.of(context).pageBackground,
      appBar: AppBar(
        backgroundColor: AppPalette.of(context).pageBackground,
        elevation: 0,
        title: Text(
          AppLocalizations.of(context).uiBuyItemsAbroad,
          style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
        ),
        centerTitle: true,
        leading: GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppPalette.of(context).gray100,
              borderRadius: BorderRadius.circular(22),
            ),
            child: Icon(Icons.arrow_back_rounded,
                color: AppPalette.of(context).black),
          ),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: AppPalette.of(context).primarySoft,
                  borderRadius: BorderRadius.circular(28),
                ),
                child: Icon(
                  Icons.shopping_bag_outlined,
                  color: AppPalette.of(context).primary,
                  size: 40,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                AppLocalizations.of(context).uiComingSoon,
                style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900,
                  color: AppPalette.of(context).black,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                AppLocalizations.of(context).uiBuyItemsAbroadIsNotLive,
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyMd.copyWith(
                  color: AppPalette.of(context).gray500,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
