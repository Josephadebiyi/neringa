import 'package:flutter/material.dart';

import 'kyc_resumable_flow.dart';

class KycScreen extends StatelessWidget {
  const KycScreen({super.key, this.fromOnboarding = false});
  final bool fromOnboarding;

  @override
  Widget build(BuildContext context) {
    return KYCResumableFlow(fromOnboarding: fromOnboarding);
  }
}
