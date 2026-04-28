import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { requireUser } from "@/lib/api/server";
export default async function Layout({ children, }) {
    const user = await requireUser();
    return (<DashboardLayout user={{ email: user.email, id: user.id, full_name: user.full_name }}>
      {children}
    </DashboardLayout>);
}
