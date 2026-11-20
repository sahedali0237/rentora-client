import Hero from "@/components/HeroBanner";
import EquipmentCarousel from "@/components/equipment-carousel";
import BrowseCategories from "@/components/BrowseCategories";
import ReviewMarquee from "@/components/review-marquee";

export default function Home() {
  return (
    <>
      <Hero />
      <EquipmentCarousel />
      <div className="bg-white dark:bg-background">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <BrowseCategories />
        </div>
      </div>
      <ReviewMarquee />
    </>
  );
}
