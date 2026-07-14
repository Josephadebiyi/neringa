import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_text_styles.dart';
import '../models/promo_banner_model.dart';
import '../services/banner_service.dart';

class BannerSlider extends StatefulWidget {
  const BannerSlider({super.key});

  @override
  State<BannerSlider> createState() => _BannerSliderState();
}

class _BannerSliderState extends State<BannerSlider> {
  List<PromoBanner> _banners = [];
  bool _loading = true;
  int _current = 0;
  final PageController _pageCtrl = PageController();
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    final cached = BannerService.instance.cachedActiveBanners;
    if (cached.isNotEmpty) {
      _banners = cached;
      _loading = false;
      if (cached.length > 1) _startTimer();
    }
    _load();
  }

  Future<void> _load() async {
    try {
      final banners = await BannerService.instance
          .fetchActiveBanners()
          .timeout(const Duration(seconds: 8));
      if (!mounted) return;
      setState(() {
        _banners = banners;
        _loading = false;
      });
      if (banners.length > 1) _startTimer();
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || _banners.isEmpty) return;
      final next = (_current + 1) % _banners.length;
      _pageCtrl.animateToPage(
        next,
        duration: const Duration(milliseconds: 400),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return const SizedBox(
        height: 154,
        child: _BannerFrame(
          child: Center(
            child: SizedBox(
              width: 22,
              height: 22,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        ),
      );
    }
    if (_banners.isEmpty) {
      return const SizedBox.shrink();
    }
    return Column(
      children: [
        SizedBox(
          height: 154,
          child: PageView.builder(
            controller: _pageCtrl,
            itemCount: _banners.length,
            onPageChanged: (i) => setState(() => _current = i),
            itemBuilder: (_, i) => _BannerCard(banner: _banners[i]),
          ),
        ),
        if (_banners.length > 1) ...[
          const SizedBox(height: 10),
          _Dots(count: _banners.length, current: _current),
        ],
      ],
    );
  }
}

class _BannerCard extends StatelessWidget {
  const _BannerCard({required this.banner});
  final PromoBanner banner;

  @override
  Widget build(BuildContext context) {
    final url = _mobileImageUrl(banner.imageUrl);
    return _BannerFrame(
      child: url.isEmpty
          ? _BannerFallback(title: banner.title)
          : Image.network(
              url,
              fit: BoxFit.cover,
              width: double.infinity,
              height: double.infinity,
              gaplessPlayback: true,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return _BannerFallback(title: banner.title);
              },
              errorBuilder: (_, __, ___) =>
                  _BannerFallback(title: banner.title),
            ),
    );
  }

  String _mobileImageUrl(String url) {
    final trimmed = url.trim();
    if (!trimmed.contains('res.cloudinary.com') ||
        !trimmed.contains('/image/upload/')) {
      return trimmed;
    }
    return trimmed.replaceFirst(
      '/image/upload/',
      '/image/upload/c_fill,g_auto,w_900,h_430,q_auto/',
    );
  }
}

class _BannerFrame extends StatelessWidget {
  const _BannerFrame({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: SizedBox(
          width: double.infinity,
          height: double.infinity,
          child: child,
        ),
      ),
    );
  }
}

class _BannerFallback extends StatelessWidget {
  const _BannerFallback({required this.title});
  final String title;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          colors: [AppColors.primary, Color(0xFF9B5CF6)],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(22),
        child: Align(
          alignment: Alignment.centerLeft,
          child: Text(
            title.isEmpty ? 'Bago' : title,
            style: AppTextStyles.h3.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.w900,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ),
    );
  }
}

class _Dots extends StatelessWidget {
  const _Dots({required this.count, required this.current});
  final int count;
  final int current;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        count,
        (i) => AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          margin: const EdgeInsets.symmetric(horizontal: 3),
          width: i == current ? 20 : 6,
          height: 6,
          decoration: BoxDecoration(
            color: i == current ? AppColors.primary : AppColors.gray300,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
      ),
    );
  }
}
