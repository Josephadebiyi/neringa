import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/app_lock_service.dart';
import '../services/storage_service.dart';
import '../../features/auth/services/auth_service.dart';

final appLockProvider = ChangeNotifierProvider<AppLockService>((ref) {
  final service = AppLockService(
    storage: StorageService.instance,
    authService: AuthService.instance,
  );
  service.initialise();
  return service;
});
