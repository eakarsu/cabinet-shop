import { prisma } from "@/lib/db";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  companyName: "Heritage Cabinet & Stone",
  phone: "(555) 482-7100",
  email: "hello@heritagecabinetstone.com",
  address: "1840 Millwright Ave, Suite 5, Riverton",
  hours: ["Mon–Fri · 8am–6pm", "Saturday · 9am–2pm", "Sunday · Closed"],
};

export default async function AdminSettingsPage() {
  const s = (await prisma.setting.findUnique({ where: { id: "default" } })) ?? DEFAULTS;
  return (
    <>
      <AdminPageHeader title="Settings" subtitle="Company details shown across the site." />
      <div className="p-6 sm:p-8">
        <SettingsForm
          initial={{
            companyName: s.companyName,
            phone: s.phone,
            email: s.email,
            address: s.address,
            hours: s.hours,
          }}
        />
      </div>
    </>
  );
}
