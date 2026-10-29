Shipment rejection refunds

Traveller rejected/cancelled, admin cancelled, and admin status updates to rejected/cancelled all invoke refundPaidShipmentRequest. Admin actions require refunds.manage; the issueRefund flag no longer opts out. Inspection rejection under review retains the existing dispute workflow.

Stripe refunds use the original PaymentIntent, Flutterwave refunds use the original numeric transaction ID. An uncaptured Stripe authorization is cancelled. Processor-pending refunds stay pending rather than being labelled completed. Existing Stripe refund/cancellation helpers use the same service.

Duplicate protection

A committed shipment_refund_attempts row reserves each (provider, payment_reference) before the processor is contacted. The composite primary key, row/advisory locks and Stripe idempotency keys prevent parallel or repeated application requests from refunding the same payment twice. The ledger is independent of shipment metadata and intentionally has no cascading foreign key. Client payment-status updates are read-only and cannot replace the original gateway, reference, paid status or refund metadata.

Do not delete reservations or reset an initiating/reconciliation_required attempt to retry. A processor timeout may mean the refund was already accepted. Reconcile the original payment in the processor dashboard using the recorded paymentReference and refund reference. Pending processor refunds are not resubmitted. A database failure after processor acceptance also requires reconciliation; it does not trigger another processor call.

Deployment

Deploy the backend. The service initializes the ledger under a schema advisory lock before sending any refund. For a runtime database role without CREATE/ALTER privileges, have the database owner apply migrations/20261029_shipment_refund_attempts.sql first. RLS is enabled with no public policies. Keep the ledger and backups when deleting or cleaning shipment records.

Deploy the updated admin build to the admin site's existing hosting directory. The cancellation modal explains automatic original-processor refunds and no longer offers a Flutterwave-only refund checkbox. Do not upload the admin build over the customer website.

Validation

286 backend tests passed across 43 files, including concurrent requests for both processors, metadata overwrite, cross-shipment payment reuse, processor timeout, process interruption, final database failure, legacy refund markers, authorization release, admin paths, traveller paths and legacy Stripe entrypoints. Admin production build passed. Processor calls and database concurrency in automated tests are simulated; no live charge, refund, or production database mutation was performed.
