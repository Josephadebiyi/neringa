import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_text_styles.dart';

class AppTextField extends StatefulWidget {
  const AppTextField({
    super.key,
    required this.controller,
    this.label,
    this.hint,
    this.errorText,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.textInputAction = TextInputAction.next,
    this.autocorrect = true,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.prefixIcon,
    this.prefix,
    this.suffixIcon,
    this.suffix,
    this.helperText,
    this.enabled = true,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.inputFormatters,
    this.autofocus = false,
    this.focusNode,
    this.readOnly = false,
    this.onTap,
    this.textAlign = TextAlign.start,
  });

  final TextEditingController controller;
  final String? label;
  final String? hint;
  final String? errorText;
  final bool obscureText;
  final TextInputType keyboardType;
  final TextInputAction textInputAction;
  final bool autocorrect;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final FormFieldValidator<String>? validator;
  final Widget? prefixIcon;
  final Widget? prefix;
  final Widget? suffixIcon;
  final Widget? suffix;
  final String? helperText;
  final bool enabled;
  final int maxLines;
  final int? minLines;
  final int? maxLength;
  final List<TextInputFormatter>? inputFormatters;
  final bool autofocus;
  final FocusNode? focusNode;
  final bool readOnly;
  final VoidCallback? onTap;
  final TextAlign textAlign;

  @override
  State<AppTextField> createState() => _AppTextFieldState();
}

class _AppTextFieldState extends State<AppTextField> {
  late bool _obscure;
  bool _hasFocus = false;

  @override
  void initState() {
    super.initState();
    _obscure = widget.obscureText;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasError = widget.errorText != null && widget.errorText!.trim().isNotEmpty;
    final borderRadius = BorderRadius.circular(16);
    final borderColor = hasError
        ? theme.colorScheme.error
        : _hasFocus
            ? theme.colorScheme.primary
            : AppColors.border;
    final backgroundColor = widget.enabled
        ? theme.colorScheme.surface
        : theme.colorScheme.surface.withValues(alpha: 0.65);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (widget.label != null) ...[
          Text(widget.label!, style: AppTextStyles.labelMd),
          const SizedBox(height: 6),
        ],
        Focus(
          focusNode: widget.focusNode,
          onFocusChange: (value) {
            if (mounted && value != _hasFocus) {
              setState(() => _hasFocus = value);
            }
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 160),
            curve: Curves.easeOut,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: borderRadius,
              border: Border.all(
                color: borderColor,
                width: _hasFocus ? 1.5 : 1,
              ),
              boxShadow: _hasFocus && widget.enabled
                  ? [
                      BoxShadow(
                        color: theme.colorScheme.primary.withValues(alpha: 0.08),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ]
                  : const [],
            ),
            child: TextFormField(
              controller: widget.controller,
              obscureText: _obscure,
              keyboardType: widget.keyboardType,
              textInputAction: widget.textInputAction,
              autocorrect: widget.autocorrect,
              onChanged: widget.onChanged,
              onFieldSubmitted: widget.onSubmitted,
              validator: widget.validator,
              enabled: widget.enabled,
              maxLines: widget.obscureText ? 1 : widget.maxLines,
              minLines: widget.minLines,
              maxLength: widget.maxLength,
              inputFormatters: widget.inputFormatters,
              autofocus: widget.autofocus,
              focusNode: widget.focusNode,
              readOnly: widget.readOnly,
              onTap: widget.onTap,
              textAlign: widget.textAlign,
              textAlignVertical: TextAlignVertical.center,
              style: AppTextStyles.bodyMd,
              cursorColor: theme.colorScheme.primary,
              decoration: InputDecoration(
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                errorBorder: InputBorder.none,
                focusedErrorBorder: InputBorder.none,
                disabledBorder: InputBorder.none,
                filled: false,
                isDense: true,
                contentPadding: EdgeInsets.symmetric(
                  horizontal: widget.prefixIcon != null || widget.prefix != null ? 14 : 16,
                  vertical: widget.maxLines > 1 ? 16 : 15,
                ),
                prefixIconConstraints: const BoxConstraints(
                  minWidth: 44,
                  minHeight: 44,
                ),
                prefix: widget.prefix,
                suffixIconConstraints: const BoxConstraints(
                  minWidth: 44,
                  minHeight: 44,
                ),
                hintText: widget.hint,
                hintStyle: AppTextStyles.bodyMd.copyWith(
                  color: AppColors.gray500,
                ),
                errorText: widget.errorText,
                prefixIcon: widget.prefixIcon,
                helperText: widget.helperText,
                helperStyle: AppTextStyles.caption.copyWith(
                  color: AppColors.gray500,
                ),
                suffixIcon: widget.obscureText
                    ? IconButton(
                        icon: Icon(
                          _obscure ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                          color: AppColors.gray400,
                          size: 20,
                        ),
                        onPressed: () => setState(() => _obscure = !_obscure),
                      )
                    : widget.suffixIcon,
                suffix: widget.suffix,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
