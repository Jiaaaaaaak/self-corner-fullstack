import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import AppLayout from "@/components/AppLayout";
import { Activity, Pencil, Save, X, User as UserIcon, Calendar, School, ChevronRight, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Info() {
  const [user, setUser] = useState({
    name: "王老師",
    email: "teacher@school.edu.tw",
    avatar: "",
    school: "台北市立和平國民中學",
    experience: "12 年",
    since: "2024.09"
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ ...user });

  const handleSave = () => {
    setUser({ ...editForm });
    setIsEditing(false);
    toast({ title: "儲存成功", description: "您的個人資料已更新" });
  };

  const handleCancel = () => {
    setEditForm({ ...user });
    setIsEditing(false);
  };

  return (
    <AppLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto flex flex-col gap-6 min-h-full animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex items-center justify-between pl-12 lg:pl-0">
          <div className="flex flex-col gap-1">
            <span className="font-heading text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Personal Space</span>
            <h1 className="font-heading text-3xl font-bold text-[#3D3831] tracking-tight">個人帳號管理</h1>
          </div>
          <Badge className="bg-[#3D3831] text-white px-3 py-1 font-heading text-[10px] tracking-widest uppercase rounded-full">
            Pro Member
          </Badge>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar Stats */}
          <div className="flex flex-col gap-6">
            {/* Stats Card - stretch to fill height */}
            <div className="bg-[#3D3831] rounded-2xl shadow-xl p-6 flex flex-col items-center text-center gap-3 relative overflow-hidden flex-1">
              <div className="absolute top-0 left-0 w-full h-full chalk-dots opacity-10 pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-1 relative z-10">
                <Activity className="w-6 h-6" />
              </div>
              <div className="relative z-10">
                <p className="text-xs text-white/50 font-bold uppercase tracking-widest mb-1">Total Sessions</p>
                <p className="font-heading text-5xl font-bold text-white tracking-tighter">24</p>
              </div>
              <div className="w-full h-px bg-white/10 my-2 relative z-10" />
              <div className="flex flex-col gap-1 relative z-10">
                <p className="text-xs text-secondary font-bold uppercase tracking-wider">Skill Level: Expert</p>
                <p className="text-[11px] text-white/40 font-medium">您已經超過了 85% 的使用者</p>
              </div>
            </div>
          </div>

          {/* Main Profile Form */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="bg-white border border-[#E5E2D9] rounded-2xl shadow-sm overflow-hidden">
              {/* Profile Top Banner */}
              <div className="h-20 bg-[#FAF9F6] border-b border-[#E5E2D9] relative">
                 <div className="absolute -bottom-10 left-8">
                    <div className="relative group">
                       <Avatar className="h-20 w-20 border-4 border-white shadow-xl bg-white">
                         <AvatarImage src={user.avatar || undefined} />
                         <AvatarFallback className="bg-primary text-white text-2xl font-heading font-bold">
                           {user.name.charAt(0)}
                         </AvatarFallback>
                       </Avatar>
                       <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <UserIcon className="w-6 h-6 text-white" />
                       </div>
                    </div>
                 </div>
                 <div className="absolute bottom-4 right-8">
                    {!isEditing ? (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E2D9] rounded-lg text-xs font-bold text-[#3D3831] hover:border-primary hover:text-primary transition-all shadow-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        編輯基本資料
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E2D9] rounded-lg text-xs font-bold text-[#706C61] hover:bg-muted/30 transition-all">
                          <X className="w-3.5 h-3.5" />
                          取消
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-lg shadow-primary/20 hover:bg-[#C8694F] transition-all">
                          <Save className="w-3.5 h-3.5" />
                          儲存變更
                        </button>
                      </div>
                    )}
                 </div>
              </div>

              {/* Form Content */}
              <div className="pt-14 pb-6 px-8">
                <div className="mb-5">
                   <h2 className="font-heading text-xl font-bold text-[#3D3831]">{user.name}</h2>
                   <p className="text-sm text-[#706C61] font-medium flex items-center gap-2 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      平台成員自 {user.since}
                   </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Field Name */}
                  <div className="flex flex-col gap-2">
                    <Label className="font-heading text-[10px] font-bold text-[#A09C94] uppercase tracking-[0.15em]">顯示姓名</Label>
                    {isEditing ? (
                      <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="bg-[#FAF9F6] border-[#E5E2D9] rounded-xl font-medium" />
                    ) : (
                      <div className="h-10 flex items-center px-4 bg-[#FAF9F6] rounded-lg border border-transparent font-bold text-[#3D3831]">{user.name}</div>
                    )}
                  </div>

                  {/* Field Email */}
                  <div className="flex flex-col gap-2">
                    <Label className="font-heading text-[10px] font-bold text-[#A09C94] uppercase tracking-[0.15em]">電子郵件</Label>
                    {isEditing ? (
                      <Input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="bg-[#FAF9F6] border-[#E5E2D9] rounded-xl font-medium" />
                    ) : (
                      <div className="h-10 flex items-center px-4 bg-[#FAF9F6] rounded-lg border border-transparent font-bold text-[#3D3831]">{user.email}</div>
                    )}
                  </div>

                  {/* Field School */}
                  <div className="flex flex-col gap-2">
                    <Label className="font-heading text-[10px] font-bold text-[#A09C94] uppercase tracking-[0.15em]">服務單位</Label>
                    {isEditing ? (
                      <div className="relative">
                        <Input value={editForm.school} onChange={e => setEditForm({...editForm, school: e.target.value})} className="bg-[#FAF9F6] border-[#E5E2D9] rounded-xl font-medium pl-10" />
                        <School className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A09C94]" />
                      </div>
                    ) : (
                      <div className="h-10 flex items-center px-4 bg-[#FAF9F6] rounded-lg border border-transparent font-bold text-[#3D3831] flex gap-2">
                         <School className="w-4 h-4 text-[#A09C94]" />
                         {user.school}
                      </div>
                    )}
                  </div>

                  {/* Field Experience */}
                  <div className="flex flex-col gap-2">
                    <Label className="font-heading text-[10px] font-bold text-[#A09C94] uppercase tracking-[0.15em]">教學年資</Label>
                    {isEditing ? (
                      <Input value={editForm.experience} onChange={e => setEditForm({...editForm, experience: e.target.value})} className="bg-[#FAF9F6] border-[#E5E2D9] rounded-xl font-medium" />
                    ) : (
                      <div className="h-10 flex items-center px-4 bg-[#FAF9F6] rounded-lg border border-transparent font-bold text-[#3D3831]">{user.experience}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Section Placeholder */}
            <div className="bg-white border border-[#E5E2D9] rounded-2xl p-6 shadow-sm flex items-center justify-between group cursor-pointer hover:border-primary/30 transition-all">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#FAF9F6] rounded-xl flex items-center justify-center">
                     <Shield className="w-6 h-6 text-[#A09C94]" />
                  </div>
                  <div>
                     <h3 className="font-heading text-[15px] font-bold text-[#3D3831]">帳號安全設定</h3>
                     <p className="text-xs text-[#706C61] font-medium">修改密碼與驗證您的身分資訊</p>
                  </div>
               </div>
               <ChevronRight className="w-5 h-5 text-[#A09C94] group-hover:text-primary transition-all" />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
