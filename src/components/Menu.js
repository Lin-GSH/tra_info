import Link from "next/link";// 導入 Link 組件，用於導航

export default function Menu() {
  return (
    <nav className="flex justify-center my-[20px] gap-[50px] border-b border-[#e6d5b8] pb-[15px]">
        <Link href='/' className="text-[#e6d5b8] text-[1.5rem] hover:underline">首頁</Link>
        <Link href='/tra' className="text-[#e6d5b8] text-[1.5rem] hover:underline">台鐵</Link>
        <Link href='/hsr'className="text-[#e6d5b8] text-[1.5rem] hover:underline">高鐵</Link>
        <Link href='/about'className="text-[#e6d5b8] text-[1.5rem] hover:underline">關於</Link>
    </nav>
  );
}
