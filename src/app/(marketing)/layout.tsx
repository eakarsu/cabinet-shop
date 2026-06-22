import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { AssistantWidget } from "@/components/site/assistant-widget";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <AssistantWidget />
    </>
  );
}
