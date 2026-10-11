/**
 * AdSense Auto ads are loaded once from the root layout.
 * Add dedicated AdSense unit slot IDs here only after they are created in AdSense.
 */
export function BannerAd({ placement }: { placement: "home" | "game" }) {
  void placement;
  return null;
}
