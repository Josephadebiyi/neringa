import 'dart:async';
import 'dart:convert';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../../../shared/services/storage_service.dart';
import '../../../shared/widgets/app_text_field.dart';

class CitySearchScreen extends ConsumerStatefulWidget {
  final bool isFromCity;
  final ValueChanged<Map<String, String>>? onCitySelected;

  const CitySearchScreen({
    super.key,
    this.isFromCity = true,
    this.onCitySelected,
  });

  @override
  ConsumerState<CitySearchScreen> createState() => _CitySearchScreenState();
}

class _CitySearchScreenState extends ConsumerState<CitySearchScreen> {
  final _searchCtrl = TextEditingController();
  List<Map<String, String>> _searchResults = [];
  List<Map<String, String>> _recentSearches = [];
  bool _isSearching = false;
  Timer? _debounce;

  static const _recentSearchesKey = 'recent_city_searches';

  @override
  void initState() {
    super.initState();
    _loadRecentSearches();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _loadRecentSearches() async {
    final raw = await StorageService.instance.read(_recentSearchesKey);
    if (!mounted) return;
    if (raw == null || raw.isEmpty) {
      setState(() => _recentSearches = []);
      return;
    }

    try {
      final decoded = jsonDecode(raw) as List<dynamic>;
      setState(() {
        _recentSearches = decoded
            .whereType<Map>()
            .map((entry) => {
                  'city': entry['city']?.toString() ?? '',
                  'country': entry['country']?.toString() ?? '',
                  'flag': entry['flag']?.toString() ?? '📍',
                })
            .where((city) => city['city']!.isNotEmpty)
            .toList();
      });
    } catch (_) {
      setState(() => _recentSearches = []);
    }
  }

  void _performSearch(String query) {
    if (query.isEmpty) {
      _debounce?.cancel();
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    _debounce?.cancel();
    setState(() => _isSearching = true);
    _debounce = Timer(const Duration(milliseconds: 300), () {
      _searchRemote(query);
    });
  }

  Future<void> _searchRemote(String query) async {
    try {
      final dio = Dio();
      final res = await dio.get(
        'https://nominatim.openstreetmap.org/search',
        queryParameters: {
          'q': query,
          'format': 'jsonv2',
          'addressdetails': 1,
          'limit': 10,
        },
        options: Options(
          headers: const {'User-Agent': 'BagoApp/1.0'},
        ),
      );

      final results = (res.data as List<dynamic>)
          .map<Map<String, String>>((item) {
        final map = item as Map<String, dynamic>;
        final address = (map['address'] as Map?)?.cast<String, dynamic>() ?? {};
        final displayParts = map['display_name']
                ?.toString()
                .split(',')
                .map((s) => s.trim())
                .toList() ??
            const <String>[];
        final city = address['city']?.toString() ??
            address['town']?.toString() ??
            address['village']?.toString() ??
            (displayParts.isNotEmpty ? displayParts.first : '');
        final country = address['country']?.toString() ??
            (displayParts.length > 1 ? displayParts[1] : '');
        final flag = _countryFlag((address['country_code']?.toString() ?? ''));
        return {
          'city': city,
          'country': country,
          'flag': flag,
        };
      }).where((city) => city['city']!.isNotEmpty).toList();

      if (!mounted) return;
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isSearching = false);
    }
  }

  void _handleCitySelect(Map<String, String> city) {
    // Save to recent searches
    _recentSearches.removeWhere((c) =>
        c['city'] == city['city'] && c['country'] == city['country']);
    _recentSearches.insert(0, city);
    if (_recentSearches.length > 10) {
      _recentSearches.removeLast();
    }
    StorageService.instance.write(
      _recentSearchesKey,
      jsonEncode(_recentSearches),
    );

    widget.onCitySelected?.call(city);
    Navigator.pop(context, city);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.white,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation: 0,
        automaticallyImplyLeading: true,
        title: Text(
          widget.isFromCity ? 'From where?' : 'To where?',
          style: AppTextStyles.h3.copyWith(
            color: AppColors.black,
          ),
        ),
        centerTitle: false,
      ),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(16.0),
            child: AppTextField(
              controller: _searchCtrl,
              label: 'Search city',
              hint: 'e.g. Lagos, Accra',
              prefixIcon: Icon(Icons.search, color: AppColors.gray400),
              onChanged: _performSearch,
            ),
          ),
          _isSearching
              ? Padding(
                  padding: EdgeInsets.symmetric(vertical: 32.0),
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppColors.primary,
                    ),
                  ),
                )
              : Expanded(
                  child: _searchCtrl.text.isEmpty
                      ? _buildRecentSearches()
                      : _buildSearchResults(),
                ),
        ],
      ),
    );
  }

  Widget _buildRecentSearches() {
    return _recentSearches.isEmpty
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.history,
                  size: 48,
                  color: AppColors.gray300,
                ),
                SizedBox(height: 12),
                Text(
                  'No recent searches',
                  style: AppTextStyles.bodyMd.copyWith(
                    color: AppColors.gray500,
                  ),
                ),
              ],
            ),
          )
        : ListView(
            padding: EdgeInsets.all(16.0),
            children: [
              Text(
                'Recent Searches',
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.black,
                ),
              ),
              SizedBox(height: 12),
              ..._recentSearches.map((city) => _buildCityTile(city)),
            ],
          );
  }

  Widget _buildSearchResults() {
    return _searchResults.isEmpty
        ? Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.location_off,
                  size: 48,
                  color: AppColors.gray300,
                ),
                SizedBox(height: 12),
                Text(
                  'No cities found',
                  style: AppTextStyles.bodyMd.copyWith(
                    color: AppColors.gray500,
                  ),
                ),
              ],
            ),
          )
        : ListView(
            padding: EdgeInsets.all(16.0),
            children: [
              Text(
                'Search Results',
                style: AppTextStyles.labelMd.copyWith(
                  color: AppColors.black,
                ),
              ),
              SizedBox(height: 12),
              ..._searchResults.map((city) => _buildCityTile(city)),
            ],
          );
  }

  Widget _buildCityTile(Map<String, String> city) {
    return GestureDetector(
      onTap: () => _handleCitySelect(city),
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12, horizontal: 12),
        margin: EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.gray200),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Text(
              city['flag'] ?? '📍',
              style: TextStyle(fontSize: 24),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    city['city'] ?? '',
                    style: AppTextStyles.labelMd.copyWith(
                      color: AppColors.black,
                    ),
                  ),
                  SizedBox(height: 2),
                  Text(
                    city['country'] ?? '',
                    style: AppTextStyles.caption.copyWith(
                      color: AppColors.gray500,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.arrow_forward_ios,
              size: 16,
              color: AppColors.gray400,
            ),
          ],
        ),
      ),
    );
  }

  String _countryFlag(String code) {
    if (code.length != 2) return '🌍';
    final upper = code.toUpperCase();
    return String.fromCharCodes(upper.codeUnits.map((codeUnit) => 0x1F1E6 - 65 + codeUnit));
  }
}
