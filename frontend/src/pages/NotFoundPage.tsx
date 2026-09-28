import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-mono text-muted-foreground">404</p>
      <h1 className="text-3xl font-semibold tracking-tight mt-2">Không tìm thấy trang</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm">
        Trang bạn tìm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}