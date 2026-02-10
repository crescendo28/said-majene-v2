import Navbar from "@/components/Navbar";
import { getNavLinks } from "@/lib/googleSheets";

export default async function NavbarWrapper() {
  const dynamicLinks = await getNavLinks();
  return <Navbar dynamicLinks={dynamicLinks} />;
}
