import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";

const schema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((s) => s.setTokens);
  const setUser = useAuthStore((s) => s.setUser);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const tokens = await authService.login(values);
      setTokens(tokens.access_token, tokens.refresh_token);
      const me = await authService.me();
      setUser(me);
      return me;
    },
    onSuccess: (me) => {
      toast.success(`Chào ${me.full_name}`);
      navigate("/");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? "Đăng nhập thất bại";
      toast.error(msg);
    },
  });

  return (
    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
        <p className="text-sm text-muted-foreground">Nhập thông tin tài khoản của bạn</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="text"
          inputMode="email"
          placeholder="you@example.com"
          autoComplete="email"
          {...form.register("email")}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...form.register("password")}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Đăng nhập
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Demo: <span className="font-mono">admin@example.com / ChangeMe123!</span>
      </p>
    </form>
  );
}