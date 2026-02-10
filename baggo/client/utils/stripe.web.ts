// Stripe stub for web platform
export const StripeProvider = ({ children }: { children: React.ReactNode }) => children;
export const CardField = () => null;
export const useStripe = () => ({
  confirmPayment: async () => ({ error: { message: 'Stripe payments not available on web. Please use the mobile app.' } })
});
