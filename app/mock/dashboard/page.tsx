import PhoneScreen from "@/components/PhoneScreen";

/**
 * Clean screenshot route. Set DevTools viewport to 390×844 (iPhone 14)
 * and capture, the PhoneScreen exactly fills the frame.
 * Route sits OUTSIDE the (public) group on purpose: no Nav, no Footer.
 */
export default function MockDashboard() {
  return <PhoneScreen />;
}
