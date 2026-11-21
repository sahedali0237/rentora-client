import { Suspense } from "react";

export default function BookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cache Components: the booking page reads URL params (useParams /
  // useSearchParams) in a Client Component, so it must stream in after
  // prerendering instead of blocking static generation.
  return (
    <Suspense fallback={<div>Loading booking...</div>}>
      {children}
    </Suspense>
  );
}
