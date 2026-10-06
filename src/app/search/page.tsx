import { Metadata } from "next";
import ExplorePage from "@/components/search/ExplorePage";

export const metadata: Metadata = {
  title: "Explore",
  description: "Discover and explore portfolios and projects.",
};

export default function SearchPage() {
  return <ExplorePage />;
}
