import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';

class RatingsScreen extends StatelessWidget {
  const RatingsScreen({super.key});

  final List<Map<String, dynamic>> ratings = const [
    {
      'name': 'Alex M.',
      'rating': 5,
      'date': 'Oct 12, 2024',
      'comment': 'Excellent carrier, very professional and delivered on time!',
    },
    {
      'name': 'Sarah J.',
      'rating': 4,
      'date': 'Sep 28, 2024',
      'comment': 'Good communication, package arrived safely.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).ratingsLeft, style: AppTextStyles.h3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: ratings.isEmpty
          ? Center(
              child: Text(
                AppLocalizations.of(context).noRatingsYet,
                style: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.gray400,
                ),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(24),
              itemCount: ratings.length,
              itemBuilder: (context, index) {
                final rating = ratings[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.gray50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Center(
                              child: Text(
                                rating['name'][0],
                                style: AppTextStyles.labelMd.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  rating['name'],
                                  style: AppTextStyles.labelMd
                                      .copyWith(fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  rating['date'],
                                  style: AppTextStyles.caption
                                      .copyWith(color: AppColors.gray400),
                                ),
                              ],
                            ),
                          ),
                          Row(
                            children: List.generate(
                              5,
                              (i) => Icon(
                                i < rating['rating']
                                    ? Icons.star_rounded
                                    : Icons.star_outline_rounded,
                                size: 14,
                                color: i < rating['rating']
                                    ? Colors.amber
                                    : AppColors.gray300,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        rating['comment'],
                        style: AppTextStyles.bodySm.copyWith(
                          color: AppColors.gray600,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
