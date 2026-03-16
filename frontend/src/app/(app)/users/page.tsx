"use client";

import { useState } from "react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, UserCog, School, Eye, EyeOff } from "lucide-react";
import type { UserWithCount } from "@/types";

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<UserWithCount | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "TEACHER" as string,
  });

  // Redirect if not admin
  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <UserCog className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm font-medium text-slate-500">
          Bạn không có quyền truy cập trang này.
        </p>
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ email: "", password: "", firstName: "", lastName: "", role: "TEACHER" });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const openEdit = (u: UserWithCount) => {
    setEditing(u);
    setForm({
      email: u.email,
      password: "",
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
    });
    setShowPassword(false);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const payload: Record<string, string> = {};
      if (form.firstName !== editing.firstName) payload.firstName = form.firstName;
      if (form.lastName !== editing.lastName) payload.lastName = form.lastName;
      if (form.role !== editing.role) payload.role = form.role;
      if (form.password) payload.password = form.password;
      await updateUser.mutateAsync({ id: editing.id, ...payload });
    } else {
      await createUser.mutateAsync(form);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      alert("Không thể xóa tài khoản của chính bạn.");
      return;
    }
    if (confirm("Bạn có chắc chắn muốn xóa người dùng này?")) {
      await deleteUser.mutateAsync(id);
    }
  };

  const setField = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Người dùng</h1>
          <p className="text-muted-foreground">Quản lý tài khoản giáo viên và quản trị viên</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Thêm người dùng
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : users?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <UserCog className="mb-2 h-8 w-8" />
            <p>Chưa có người dùng nào.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {users?.map((u) => (
            <Card key={u.id} className="group">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
                    {u.lastName?.charAt(0) ?? "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-800">
                        {u.lastName} {u.firstName}
                      </p>
                      <Badge
                        className={
                          u.role === "ADMIN"
                            ? "rounded-lg border-0 bg-indigo-50 text-[11px] font-semibold text-indigo-700"
                            : "rounded-lg border-0 bg-emerald-50 text-[11px] font-semibold text-emerald-700"
                        }
                      >
                        {u.role === "ADMIN" ? "Quản trị viên" : "Giáo viên"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <School className="h-4 w-4" />
                    <span>{u._count.classes} lớp</span>
                  </div>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {u.id !== currentUser?.id && (
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? "Chỉnh sửa người dùng" : "Thêm người dùng mới"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Cập nhật thông tin người dùng. Để trống mật khẩu nếu không muốn thay đổi."
                : "Tạo tài khoản mới cho giáo viên hoặc quản trị viên."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Label>Họ</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-4">
                <Label>Tên</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                required
                disabled={!!editing}
              />
            </div>

            <div className="space-y-4">
              <Label>{editing ? "Mật khẩu mới (tùy chọn)" : "Mật khẩu"}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  placeholder={editing ? "Để trống nếu không đổi" : "Tối thiểu 6 ký tự"}
                  required={!editing}
                  minLength={editing && !form.password ? undefined : 6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Vai trò</Label>
              <Select value={form.role} onValueChange={(v) => setField("role", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TEACHER">Giáo viên</SelectItem>
                  <SelectItem value="ADMIN">Quản trị viên</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createUser.isPending || updateUser.isPending}
              >
                {editing ? "Lưu" : "Tạo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
