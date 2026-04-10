// ignore_for_file: prefer_const_constructors

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../../l10n/app_localizations.dart';
import '../../../shared/services/storage_service.dart';

const _kOnboardingDoneKey = 'onboarding_done_v1';

Future<bool> hasSeenOnboarding() async {
  final val = await StorageService.instance.read(_kOnboardingDoneKey);
  return val == 'true';
}

Future<void> markOnboardingDone() async {
  await StorageService.instance.write(_kOnboardingDoneKey, 'true');
}

class _Slide {
  const _Slide({
    required this.title,
    required this.desc,
    required this.image,
    this.isDark = true,
  });
  final String title;
  final String desc;
  final String image;
  final bool isDark;
}

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _controller = PageController();
  int _currentIndex = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _goToSignup() {
    markOnboardingDone();
    context.push('/auth/signup');
  }

  void _goToLogin() {
    markOnboardingDone();
    context.push('/auth/signin');
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final slides = [
      _Slide(
        title: l10n.onboardingSlide1Title,
        desc: l10n.onboardingSlide1Description,
        image: 'assets/images/onboarding1.png',
        isDark: true,
      ),
      _Slide(
        title: l10n.onboardingSlide2Title,
        desc: l10n.onboardingSlide2Description,
        image: 'assets/images/onboarding2.png',
        isDark: false,
      ),
      _Slide(
        title: l10n.onboardingSlide3Title,
        desc: l10n.onboardingSlide3Description,
        image: 'assets/images/onboarding3.png',
        isDark: true,
      ),
    ];
    final slide = slides[_currentIndex];
    final isDark = slide.isDark;
    final textColor = isDark ? Colors.white : Colors.black87;
    final subColor = isDark
        ? Colors.white.withValues(alpha: 0.80)
        : Colors.black.withValues(alpha: 0.65);
    final dotActive = isDark ? Colors.white : Colors.black87;
    final dotInactive = isDark
        ? Colors.white.withValues(alpha: 0.35)
        : Colors.black.withValues(alpha: 0.20);

    SystemChrome.setSystemUIOverlayStyle(
      isDark ? SystemUiOverlayStyle.light : SystemUiOverlayStyle.dark,
    );

    return Scaffold(
      body: Stack(
        children: [
          // ── Full-screen paged images ───────────────────────────────────
          PageView.builder(
            controller: _controller,
            onPageChanged: (val) => setState(() => _currentIndex = val),
            itemCount: slides.length,
            itemBuilder: (context, i) => Image.asset(
              slides[i].image,
              fit: BoxFit.cover,
              width: double.infinity,
              height: double.infinity,
              errorBuilder: (_, __, ___) => Container(
                color: i == 1
                    ? const Color(0xFFF2A922)
                    : const Color(0xFF5240E8),
              ),
            ),
          ),

          // ── Top bar: Skip (left) + Next (right) ───────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(28, 16, 28, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Skip / Next row at top
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Skip
                      if (_currentIndex < slides.length - 1)
                        GestureDetector(
                          onTap: _goToLogin,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(30),
                            ),
                            child: Text(
                              l10n.skip,
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: textColor,
                              ),
                            ),
                          ),
                        )
                      else
                        const SizedBox.shrink(),
                      // Next
                      if (_currentIndex < slides.length - 1)
                        GestureDetector(
                          onTap: () => _controller.nextPage(
                            duration: const Duration(milliseconds: 320),
                            curve: Curves.easeInOut,
                          ),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF3D8B78),
                              borderRadius: BorderRadius.circular(30),
                            ),
                            child: Text(
                              '${l10n.next} →',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Headline
                  Text(
                    slides[_currentIndex].title,
                    style: TextStyle(
                      fontSize: 34,
                      fontWeight: FontWeight.w900,
                      height: 1.1,
                      letterSpacing: -0.6,
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 12),
                  // Description
                  Text(
                    slides[_currentIndex].desc,
                    style: TextStyle(
                      fontSize: 16,
                      height: 1.5,
                      color: subColor,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Bottom UI (dots + buttons) ─────────────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(28, 0, 28, 28),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Dots
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(
                        slides.length,
                        (i) => AnimatedContainer(
                          duration: const Duration(milliseconds: 220),
                          margin: const EdgeInsets.only(right: 7),
                          height: 8,
                          width: _currentIndex == i ? 26 : 8,
                          decoration: BoxDecoration(
                            color: _currentIndex == i ? dotActive : dotInactive,
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Create account button
                    SizedBox(
                      width: double.infinity,
                      height: 58,
                      child: ElevatedButton(
                        onPressed: _goToSignup,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF3D8B78),
                          foregroundColor: Colors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                        child: Text(
                          l10n.createAccount,
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),
                    // Log In
                    GestureDetector(
                      onTap: _goToLogin,
                      behavior: HitTestBehavior.opaque,
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(
                          l10n.logIn,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                            color: textColor,
                            letterSpacing: -0.2,
                          ),
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
    );
  }
}
