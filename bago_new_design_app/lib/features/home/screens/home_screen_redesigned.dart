import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_snackbar.dart';
import '../widgets/banner_slider.dart';

class HomeScreenRedesigned extends ConsumerStatefulWidget {
  const HomeScreenRedesigned({super.key});

  @override
  ConsumerState<HomeScreenRedesigned> createState() =>
      _HomeScreenRedesignedState();
}

class _HomeScreenRedesignedState extends ConsumerState<HomeScreenRedesigned> {
  String _selectedRole = 'traveller'; // 'traveller' or 'sender'

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.of(context).pageBackground,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // Header
            SliverAppBar(
              backgroundColor: AppPalette.of(context).pageBackground,
              elevation: 0,
              floating: true,
              snap: true,
              centerTitle: false,
              title: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.primaryLight,
                    ),
                    child: Center(
                      child: Text(
                        'B',
                        style: AppTextStyles.h3.copyWith(
                          color: AppColors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'BAGO',
                    style: AppTextStyles.h3.copyWith(
                      color: AppPalette.of(context).black,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              actions: [
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Center(
                    child: GestureDetector(
                      onTap: () {
                        AppSnackBar.show(
                          context,
                          message: 'Notifications feature coming soon',
                          type: SnackBarType.info,
                        );
                      },
                      child: Stack(
                        children: [
                          Icon(
                            Icons.notifications_none,
                            color: AppPalette.of(context).black,
                            size: 24,
                          ),
                          Positioned(
                            top: 0,
                            right: 0,
                            child: Container(
                              width: 8,
                              height: 8,
                              decoration: const BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.error,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Main content
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Greeting
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back!',
                          style: AppTextStyles.h2.copyWith(
                            color: AppPalette.of(context).black,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Ready to travel or send something?',
                          style: AppTextStyles.bodyMd.copyWith(
                            color: AppPalette.of(context).gray500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Search / Filter Card
                    _buildSearchCard(context),
                    const SizedBox(height: 24),

                    // Dynamic banner slider (managed from admin)
                    const BannerSlider(),
                    const SizedBox(height: 24),

                    // Action Cards (Post trip / Send item)
                    Row(
                      children: [
                        Expanded(
                          child: _buildActionCard(
                            icon: Icons.flight_takeoff,
                            title: 'Post New\nTrip',
                            subtitle: 'Earn money',
                            color: AppColors.accentLime,
                            onTap: () => context.go('/post-trip'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildActionCard(
                            icon: Icons.local_shipping,
                            title: 'Send\nItem',
                            subtitle: 'Fast delivery',
                            color: AppColors.accentCoral,
                            onTap: () {
                              AppSnackBar.show(
                                context,
                                message: 'Send item feature coming soon',
                                type: SnackBarType.info,
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Available Trips / Shipments Feed
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          _selectedRole == 'traveller'
                              ? 'Available Trips'
                              : 'Shipment Requests',
                          style: AppTextStyles.h3.copyWith(
                            color: AppPalette.of(context).black,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => context.go('/search'),
                          child: Text(
                            'View all',
                            style: AppTextStyles.caption.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),

            // Trips/Shipments list
            SliverList(
              delegate: SliverChildBuilderDelegate(
                (context, index) => _buildTripCard(index),
                childCount: 3,
              ),
            ),

            const SliverToBoxAdapter(
              child: SizedBox(height: 32),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchCard(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/search'),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.primary,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withOpacity(0.2),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _selectedRole == 'traveller' ? 'Find trips' : 'Find senders',
              style: AppTextStyles.labelMd.copyWith(
                color: AppColors.white,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppPalette.of(context).white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.location_on_outlined,
                            size: 18, color: AppPalette.of(context).primary),
                        const SizedBox(width: 8),
                        Text(
                          'From...',
                          style: AppTextStyles.bodyMd.copyWith(
                            color: AppPalette.of(context).gray400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppPalette.of(context).white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.location_on,
                            size: 18, color: AppPalette.of(context).primary),
                        const SizedBox(width: 8),
                        Text(
                          'To...',
                          style: AppTextStyles.bodyMd.copyWith(
                            color: AppPalette.of(context).gray400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppPalette.of(context).white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.calendar_today,
                            size: 18, color: AppPalette.of(context).primary),
                        const SizedBox(width: 8),
                        Text(
                          'Date',
                          style: AppTextStyles.bodyMd.copyWith(
                            color: AppPalette.of(context).gray400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppPalette.of(context).white,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.person,
                            size: 18, color: AppPalette.of(context).primary),
                        const SizedBox(width: 8),
                        Text(
                          'Qty',
                          style: AppTextStyles.bodyMd.copyWith(
                            color: AppPalette.of(context).gray400,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 140,
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          border: Border.all(color: color.withOpacity(0.3), width: 1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 12),
            Text(
              title,
              textAlign: TextAlign.center,
              style: AppTextStyles.labelMd.copyWith(
                color: AppPalette.of(context).black,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              textAlign: TextAlign.center,
              style: AppTextStyles.caption.copyWith(
                color: AppPalette.of(context).gray500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTripCard(int index) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Container(
        decoration: BoxDecoration(
          color: AppPalette.of(context).white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppPalette.of(context).gray200),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Lagos → Abuja',
                        style: AppTextStyles.labelMd.copyWith(
                          color: AppPalette.of(context).black,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Tomorrow at 10:00 AM',
                        style: AppTextStyles.caption.copyWith(
                          color: AppPalette.of(context).gray500,
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₦5,000',
                      style: AppTextStyles.h3.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color:
                            AppPalette.of(context).soft(AppColors.successLight),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Available',
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.success,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              '📦 Max weight: 10kg',
              style: AppTextStyles.caption.copyWith(
                color: AppPalette.of(context).gray500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
