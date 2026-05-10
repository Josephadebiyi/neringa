import 'dart:convert';

import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

class TappableImage extends StatelessWidget {
  const TappableImage({
    super.key,
    required this.url,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.placeholder,
  });

  final String url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? placeholder;

  @override
  Widget build(BuildContext context) {
    final child = _ImageContent(
      url: url,
      fit: fit,
      placeholder: placeholder,
    );
    final clipped = borderRadius == null
        ? child
        : ClipRRect(borderRadius: borderRadius!, child: child);

    return Semantics(
      button: true,
      label: 'View image',
      child: GestureDetector(
        onTap: url.trim().isEmpty
            ? null
            : () => Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => FullScreenImageViewer(url: url),
                  ),
                ),
        child: SizedBox(width: width, height: height, child: clipped),
      ),
    );
  }
}

class FullScreenImageViewer extends StatelessWidget {
  const FullScreenImageViewer({super.key, required this.url});

  final String url;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SafeArea(
        child: Center(
          child: InteractiveViewer(
            minScale: 0.8,
            maxScale: 4,
            child: _ImageContent(
              url: url,
              fit: BoxFit.contain,
              placeholder: const Icon(
                Icons.image_not_supported_rounded,
                color: Colors.white54,
                size: 56,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ImageContent extends StatelessWidget {
  const _ImageContent({
    required this.url,
    required this.fit,
    this.placeholder,
  });

  final String url;
  final BoxFit fit;
  final Widget? placeholder;

  Widget get _fallback =>
      placeholder ??
      Container(
        color: AppColors.gray100,
        alignment: Alignment.center,
        child: const Icon(Icons.image_not_supported_rounded,
            color: AppColors.gray300, size: 40),
      );

  @override
  Widget build(BuildContext context) {
    final trimmed = url.trim();
    if (trimmed.isEmpty) return _fallback;

    if (trimmed.startsWith('data:')) {
      try {
        final commaIndex = trimmed.indexOf(',');
        if (commaIndex == -1) return _fallback;
        final bytes = base64Decode(trimmed.substring(commaIndex + 1));
        return Image.memory(
          bytes,
          fit: fit,
          errorBuilder: (_, __, ___) => _fallback,
        );
      } catch (_) {
        return _fallback;
      }
    }

    return Image.network(
      trimmed,
      fit: fit,
      errorBuilder: (_, __, ___) => _fallback,
    );
  }
}
