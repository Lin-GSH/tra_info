import Image from "next/image";
import Link from "next/link";
import Menu from "@/components/Menu";
import Member from "@/components/Member";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="bg-[#2e2b27] text-[#e6d5b8] leading-[1.7] min-h-screen font-['Special_Elite',_monospace] bg-[length:40px_40px]">
        <header className="text-center px-[10px] py-[10px] border-b-[3px] border-[#e6d5b8] tracking-[0.15em]">
          <h1 className="text-[3rem] text-[#f8f1e7] [text-shadow:2px_2px_5px_#000000aa]">高鐵資訊</h1>
          <p className="mb-0 text-[1.2rem] text-[#d6c9b1] italic">-------------</p>
        </header>
        <Menu />
      </main>
      <Member />
    </div>
  );
}
