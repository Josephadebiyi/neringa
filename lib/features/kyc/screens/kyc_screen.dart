import 'package:flutter/material.dart';

import 'kyc_country_selector.dart';

class KycScreen extends StatelessWidget {
  const KycScreen({super.key, this.fromOnboarding = false});
  final bool fromOnboarding;

  @override
  Widget build(BuildContext context) {
    return KycCountrySelector(fromOnboarding: fromOnboarding);
  }
}
