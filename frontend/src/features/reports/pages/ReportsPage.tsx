import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { SalesReport } from "../components/SalesReport";
import { AcademicReport } from "../components/AcademicReport";
import { StudentReport } from "../components/StudentReport";

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Báo cáo" description="Phân tích và thống kê" />
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Kinh doanh</TabsTrigger>
          <TabsTrigger value="academic">Học vụ</TabsTrigger>
          <TabsTrigger value="student">Học viên</TabsTrigger>
        </TabsList>
        <TabsContent value="sales"><SalesReport /></TabsContent>
        <TabsContent value="academic"><AcademicReport /></TabsContent>
        <TabsContent value="student"><StudentReport /></TabsContent>
      </Tabs>
    </div>
  );
}