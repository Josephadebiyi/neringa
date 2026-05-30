import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/api_constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../l10n/app_localizations.dart';
import '../../../shared/services/api_service.dart';
import '../../auth/providers/auth_provider.dart';

class RatingsScreen extends ConsumerStatefulWidget {
  const RatingsScreen({super.key});

  @override
  ConsumerState<RatingsScreen> createState() => _RatingsScreenState();
}

class _RatingsScreenState extends ConsumerState<RatingsScreen> {
  bool _loading = true;
  List<Map<String, dynamic>> _reviews = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res =
          await ApiService.instance.get(ApiConstants.userReviews);
      final data = res.data;
      List<dynamic> list = [];
      if (data is List) {
        list = data;
      } else if (data is Map) {
        list = (data['reviews'] ??
                data['data'] ??
                data['ratings'] ??
                []) as List<dynamic>;
      }
      if (mounted) {
        setState(() {
          _reviews = list
              .whereType<Map<String, dynamic>>()
              .toList();
          _loading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final avg = user?.rating ?? 0.0;
    final count = user?.ratingCount ?? 0;

    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        title: Text(AppLocalizations.of(context)!.ratingsAndReviewsTitle, style: AppTextStyles.h3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  // ── Summary card ───────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.primarySoft,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              avg.toStringAsFixed(1),
                              style: AppTextStyles.displaySm.copyWith(
                                fontWeight: FontWeight.w900,
                                color: AppColors.primary,
                              ),
                            ),
                            _StarRow(rating: avg),
                            const SizedBox(height: 4),
                            Text(
                              AppLocalizations.of(context)!.reviewsCount(count),
                              style: AppTextStyles.bodySm
                                  .copyWith(color: AppColors.gray500),
                            ),
                          ],
                        ),
                        const SizedBox(width: 24),
                        Expanded(
                          child: Column(
                            children: [5, 4, 3, 2, 1].map((star) {
                              final starCount = _reviews
                                  .where((r) =>
                                      (r['rating'] as num?)?.round() == star)
                                  .length;
                              final fraction = count > 0
                                  ? starCount / (_reviews.isNotEmpty
                                      ? _reviews.length
                                      : 1)
                                  : 0.0;
                              return Padding(
                                padding:
                                    const EdgeInsets.symmetric(vertical: 2),
                                child: Row(
                                  children: [
                                    Text('$star',
                                        style: AppTextStyles.labelXs.copyWith(
                                            color: AppColors.gray500)),
                                    const SizedBox(width: 4),
                                    const Icon(Icons.star_rounded,
                                        size: 10,
                                        color: AppColors.gray400),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(4),
                                        child: LinearProgressIndicator(
                                          value: fraction,
                                          backgroundColor: AppColors.gray200,
                                          color: AppColors.primary,
                                          minHeight: 6,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // ── Individual reviews ─────────────────────────────────
                  if (_reviews.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 40),
                        child: Column(
                          children: [
                            const Icon(Icons.star_border_rounded,
                                size: 48, color: AppColors.gray300),
                            const SizedBox(height: 12),
                            Text(AppLocalizations.of(context)!.noReviewsYet,
                                style: AppTextStyles.h3
                                    .copyWith(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 6),
                            Text(
                              AppLocalizations.of(context)!.noReviewsSubtitle,
                              style: AppTextStyles.bodySm
                                  .copyWith(color: AppColors.gray500),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    ..._reviews.map((r) => _ReviewCard(review: r)),
                ],
              ),
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.review});
  final Map<String, dynamic> review;

  @override
  Widget build(BuildContext context) {
    final name = review['reviewerName'] ??
        review['senderName'] ??
        review['travelerName'] ??
        review['name'] ??
        'Anonymous';
    final rating = (review['rating'] as num?)?.toDouble() ?? 0.0;
    final comment = review['comment'] ??
        review['review'] ??
        review['message'] ??
        '';
    final date = review['createdAt'] ??
        review['date'] ??
        review['reviewedAt'] ??
        '';
    final role = review['reviewerRole'] ??
        review['role'] ??
        '';
    final initials =
        name.isNotEmpty ? (name as String)[0].toUpperCase() : '?';

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.gray50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.gray100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                decoration: BoxDecoration(
                  color: AppColors.primaryLight,
                  borderRadius: BorderRadius.circular(21),
                ),
                child: Center(
                  child: Text(
                    initials,
                    style: AppTextStyles.labelMd.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            name,
                            style: AppTextStyles.bodyMd
                                .copyWith(fontWeight: FontWeight.w700),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (role.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.gray100,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              role,
                              style: AppTextStyles.labelXs.copyWith(
                                  color: AppColors.gray500,
                                  fontWeight: FontWeight.w600),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 2),
                    _StarRow(rating: rating, size: 13),
                  ],
                ),
              ),
            ],
          ),
          if (comment.toString().trim().isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              comment.toString().trim(),
              style:
                  AppTextStyles.bodySm.copyWith(color: AppColors.gray700, height: 1.5),
            ),
          ],
          if (date.toString().trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              _formatDate(date.toString()),
              style:
                  AppTextStyles.labelXs.copyWith(color: AppColors.gray400),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(String raw) {
    try {
      final dt = DateTime.parse(raw);
      final months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      return '${months[dt.month - 1]} ${dt.day}, ${dt.year}';
    } catch (_) {
      return raw;
    }
  }
}

class _StarRow extends StatelessWidget {
  const _StarRow({required this.rating, this.size = 15});
  final double rating;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final filled = i < rating.floor();
        final half = !filled && i < rating;
        return Icon(
          filled
              ? Icons.star_rounded
              : half
                  ? Icons.star_half_rounded
                  : Icons.star_border_rounded,
          size: size,
          color: filled || half
              ? const Color(0xFFFBBF24)
              : AppColors.gray300,
        );
      }),
    );
  }
}
