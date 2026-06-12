import { redirect } from "next/navigation";

export default function Home() {
  // 메인 페이지('/') 접속 시 즉시 관리자 로그인 페이지로 리다이렉트합니다.
  redirect("/admin/login");
}
