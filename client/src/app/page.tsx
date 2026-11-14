import type { Metadata } from 'next';
import { HomeCta } from '@/components/home/HomeCta';
import { HomeFooter } from '@/components/home/HomeFooter';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeSteps } from '@/components/home/HomeSteps';
import { HomeTrust } from '@/components/home/HomeTrust';
import { en } from '@/strings/en';

export const metadata: Metadata = {
  title: en.nav.home,
  description: en.home.hero.text,
};

export default function HomePage() {
  return (
    <>
      <HomeHero />
      <HomeSteps />
      <HomeTrust />
      <HomeCta />
      <HomeFooter />
    </>
  );
}
