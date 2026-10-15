import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';

class GiftItemsScreen extends StatelessWidget {
  const GiftItemsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.of(context).pageBackground,
      appBar: AppBar(
        backgroundColor: AppPalette.of(context).pageBackground,
        elevation: 0,
        title: Text(
          'Send a Gift',
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
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(28),
                ),
                child: const Icon(
                  Icons.card_giftcard_rounded,
                  color: AppColors.accentAmber,
                  size: 40,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Coming soon',
                style: AppTextStyles.displaySm.copyWith(
                  fontWeight: FontWeight.w900,
                  color: AppPalette.of(context).black,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                'Gift items is not live yet. We will implement it soon.',
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
