import 'package:bago_app/core/utils/model_enums.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RequestStatus.isActive', () {
    test('keeps every in-progress workflow status active', () {
      const activeStatuses = {
        RequestStatus.pending,
        RequestStatus.accepted,
        RequestStatus.acceptedAwaitingInspection,
        RequestStatus.inspectionInProgress,
        RequestStatus.inspectionCompleted,
        RequestStatus.rejectedAtInspectionUnderReview,
        RequestStatus.approvedForTrip,
        RequestStatus.intransit,
        RequestStatus.delivering,
      };

      for (final status in activeStatuses) {
        expect(status.isActive, isTrue, reason: '${status.name} disappeared');
      }
    });

    test('classifies final refund and delivery outcomes as past', () {
      const pastStatuses = {
        RequestStatus.refundApproved,
        RequestStatus.partialRefundApproved,
        RequestStatus.refundDeclined,
        RequestStatus.rejected,
        RequestStatus.completed,
        RequestStatus.cancelled,
      };

      for (final status in pastStatuses) {
        expect(status.isActive, isFalse,
            reason: '${status.name} stayed active');
      }
    });
  });
}
