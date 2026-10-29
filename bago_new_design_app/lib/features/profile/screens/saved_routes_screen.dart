import '../../../l10n/app_localizations.dart';
import '../../../core/theme/app_palette.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/widgets/app_snackbar.dart';

class SavedRoutesScreen extends StatefulWidget {
  const SavedRoutesScreen({super.key});

  @override
  State<SavedRoutesScreen> createState() => _SavedRoutesScreenState();
}

class _SavedRoutesScreenState extends State<SavedRoutesScreen> {
  final List<Map<String, String>> routes = [
    {'id': '1', 'from': 'Madrid', 'to': 'Lisbon', 'frequency': 'Daily'},
    {'id': '2', 'from': 'Paris', 'to': 'London', 'frequency': 'Weekly'},
  ];

  void _deleteRoute(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context).uiDeleteRoute),
        content: Text(AppLocalizations.of(context).uiAreYouSureYouWantTo),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppLocalizations.of(context).cancel),
          ),
          TextButton(
            onPressed: () {
              setState(() => routes.removeWhere((r) => r['id'] == id));
              Navigator.pop(context);
              AppSnackBar.show(
                context,
                message: AppLocalizations.of(context).uiRouteDeleted,
                type: SnackBarType.success,
              );
            },
            child: Text(AppLocalizations.of(context).delete,
                style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppPalette.of(context).pageBackground,
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).savedRoutes,
            style: AppTextStyles.h3),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: routes.isEmpty
          ? Center(
              child: Text(
                AppLocalizations.of(context).uiNoSavedRoutesFound,
                style: AppTextStyles.bodyMd.copyWith(
                  color: AppPalette.of(context).gray400,
                ),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(24),
              itemCount: routes.length,
              itemBuilder: (context, index) {
                final route = routes[index];
                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppPalette.of(context).gray50,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Column(
                            children: [
                              Icon(
                                Icons.circle_rounded,
                                size: 10,
                                color: AppPalette.of(context).primary,
                              ),
                              SizedBox(
                                height: 20,
                                child: VerticalDivider(
                                  color: AppPalette.of(context).gray300,
                                  thickness: 2,
                                ),
                              ),
                              const Icon(
                                Icons.circle_rounded,
                                size: 10,
                                color: Colors.green,
                              ),
                            ],
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  route['from']!,
                                  style: AppTextStyles.labelMd
                                      .copyWith(fontWeight: FontWeight.w700),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  route['to']!,
                                  style: AppTextStyles.labelMd
                                      .copyWith(fontWeight: FontWeight.w700),
                                ),
                              ],
                            ),
                          ),
                          GestureDetector(
                            onTap: () => _deleteRoute(route['id']!),
                            child: Icon(
                              Icons.delete_outline_rounded,
                              color: AppPalette.of(context).gray300,
                              size: 20,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Divider(color: AppPalette.of(context).white, height: 1),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              route['frequency']!,
                              style: AppTextStyles.caption.copyWith(
                                color: AppPalette.of(context).primary,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          TextButton(
                            onPressed: () {},
                            child: Row(
                              children: [
                                Text(
                                  AppLocalizations.of(context).uiSearchAgain,
                                  style: AppTextStyles.labelSm.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 4),
                                Icon(
                                  Icons.arrow_forward_rounded,
                                  size: 14,
                                  color: AppPalette.of(context).primary,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
    );
  }
}
